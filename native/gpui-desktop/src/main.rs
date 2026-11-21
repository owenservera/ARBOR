//! @hq:capability vivim.gpui-desktop@1
//! @hq:consumes vivim.gpui-projection-client@1
//! @hq:consumes vivim.gpui-control-client@1
//! @hq:consumes vivim.rust-control-plan-presentation@1
//! @hq:consumes vivim.native-visual-validation@1
//! @hq:consumes vivim.native-visual-delta@1
//! @hq:consumes vivim.native-vec-visual-ir@1
//! @hq:consumes vivim.rust-wiki-read-model@1
//! @hq:consumes vivim.rust-wiki-source-search@1
//! @hq:consumes vivim.rust-wiki-source-delta@1
//! @hq:consumes hqkg.development-query@1
//! @hq:consumes vivim.rust-development-projection@1
use std::time::Duration;
use serde_json::json;
use vivim_programmability_core::navigation;
use vivim_programmability_core::visual::visual_delta;
use vivim_programmability_core::wiki_read::{self, RevisionGuard as WikiRevisionGuard};
use vivim_programmability_core::vec::{self, View as VecView, Element as VecElement};
use gpui::{AnyElement, App, Application, Bounds, Context, Entity, Window, WindowBounds, WindowOptions, div, prelude::*, px, relative, rgb, size};

// Window-local logical pixels, minus the workspace's horizontal padding.
// The Host remains responsible for admitting and planning this exact width.
fn viewport_for_width(width: f32) -> u32 {
    if !width.is_finite() { return 1000; }
    (width - 40.).round().clamp(240., 3840.) as u32
}
fn viewport_for_window(window: &Window) -> u32 {
    viewport_for_width(f32::from(window.bounds().size.width))
}

use gpui_component::{Root, input::{Input, InputState}, button::{Button, ButtonVariants}};
use vivim_gpui_desktop::{Overview, read_overview, read_development, control::{self, Review}, visual::{self, Visual, RevisionGuard}};

#[derive(Clone, Copy, PartialEq, Eq)]
enum Panel { Overview, Wiki, Visual, Graph, Control }
impl Panel {
    fn label(self)->&'static str {
        match self {
            Self::Overview=>"Overview",Self::Wiki=>"Wiki",Self::Visual=>"Build",
            Self::Graph=>"Knowledge graph",Self::Control=>"Host decisions",
        }
    }
}
struct Desktop {
    panel: Panel,
    viewport_px: u32,
    viewport_epoch: u64,
    read_busy: bool,
    refresh_pending: bool,
    source_status: String,
    wiki_query: Option<String>,
    input: Entity<InputState>,
    status: String,
    overview: Option<Overview>,
    visual: Option<Visual>,
    vec_view: Option<VecView>,
    visual_status: String,
    visual_guard: RevisionGuard,
    wiki_guard: WikiRevisionGuard,
    wiki_delta: String,
    wiki_events: Vec<String>,
    detail: String,
    graph_detail: String,
    graph_status: String,
    graph_busy: bool,
    review: Option<Review>,
    last_plan: Option<String>,
    busy: bool,
    // An uncertain execution must be inspected, never retried by this session.
    uncertain: bool,
}
impl Desktop {
    fn find_wiki(&mut self,cx:&mut Context<Self>){
        let raw=self.input.read(cx).value().to_string();
        let query=raw.trim();
        if query.is_empty() || query.chars().count()>160 || query.chars().any(char::is_control){
            self.status="Wiki search requires 1–160 visible characters".into();
            cx.notify();return;
        }
        self.wiki_query=Some(query.to_owned());
        self.select_panel(Panel::Wiki,cx);
    }
    fn clear_wiki_search(&mut self,cx:&mut Context<Self>){
        self.wiki_query=None;
        self.status="Wiki search cleared · original source view".into();
        cx.notify();
    }
    fn set_viewport(&mut self, viewport_px:u32, cx:&mut Context<Self>){
        if !(240..=3840).contains(&viewport_px) || self.viewport_px==viewport_px{return;}
        self.viewport_px=viewport_px;
        // Each resize changes the contract identity even if the user returns
        // to a previous width before an older HTTP read finishes.
        self.viewport_epoch=self.viewport_epoch.wrapping_add(1);
        let epoch=self.viewport_epoch;
        self.visual_status=format!("Viewport resized to {}px · awaiting Host admission",viewport_px);
        self.visual=None;
        self.vec_view=None;
        cx.notify();
        // Debounce drag-resize storms without displaying a stale source plan.
        cx.spawn(async move |this,cx|{
            cx.background_executor().timer(Duration::from_millis(250)).await;
            let _=this.update(cx,|view,cx|{
                if view.viewport_epoch==epoch {view.refresh(cx);}
            });
        }).detach();
    }
    fn select_panel(&mut self, panel:Panel, cx:&mut Context<Self>){
        self.panel=panel;
        self.status=format!("{} · local native view only",panel.label());
        cx.notify();
    }
    // Weak entity lifetime stops the observer when its workspace closes.
    // All refreshes are GET-only. Neither polling nor readback can approve.
    fn start_observer(&self,cx:&mut Context<Self>){
        cx.spawn(async move |this,cx|{
            loop{
                cx.background_executor().timer(Duration::from_secs(15)).await;
                if this.update(cx,|view,cx|{
                    if !view.busy && !view.uncertain
                        && !view.review.as_ref().is_some_and(Review::needs_approval){
                        view.refresh(cx);
                    }
                }).is_err(){break}
            }
        }).detach();
    }
    fn refresh(&mut self, cx: &mut Context<Self>) {
        // Read-only observation is never a substitute for explicit owner
        // review, and does not share the in-flight command/receipt flag.
        if self.busy || self.uncertain || self.review.as_ref().is_some_and(Review::needs_approval) {return;}
        if self.read_busy {self.refresh_pending=true;return;}
        self.read_busy=true;
        self.refresh_pending=false;
        self.source_status="Checking owner-authorized Host source · previous read may be stale".into();
        self.visual_status="Checking Host visual · previous admission may be stale".into();
        cx.notify();
        let viewport_px=self.viewport_px;
        let epoch=self.viewport_epoch;
        // These GET-only requests can finish independently. Neither invokes
        // planning, execution, approval, or a provider transport.
        let overview_job=cx.background_executor().spawn(async {read_overview()});
        let visual_job=cx.background_executor().spawn(async move {visual::read_at(viewport_px)});
        cx.spawn(async move |this, cx| {
            let overview=overview_job.await;
            let visual=visual_job.await;
            let _=this.update(cx,|view,cx|{
                view.read_busy=false;
                // Compare a monotonically increasing resize identity, not
                // just width: A -> B -> A still invalidates the first A read.
                if view.viewport_epoch!=epoch || view.viewport_px!=viewport_px {
                    view.refresh_pending=false; // the resize debounce owns the next fetch
                    return;
                }
                if std::mem::take(&mut view.refresh_pending) {
                    view.refresh(cx);
                }
                match overview {
                    Ok(data) => {
                        if view.wiki_guard.accept(data.wiki_revision, &data.wiki_digest).is_err() {
                            view.source_status="Wiki source revision/digest conflict · observation refused".into();
                            view.overview=None;view.visual=None;view.vec_view=None;
                            cx.notify();return;
                        }
                        view.source_status=format!(
                            "Owner-authorized Wiki · revision {} · source SHA256 {} · observed {}",
                            data.wiki_revision,data.wiki_digest,data.observed_at
                        );
                        let delta=wiki_read::source_delta(&json!({
                            "previous":view.overview.as_ref().map(|old|&old.wiki_source),
                            "current":&data.wiki_source
                        }));
                        let outcome=delta["outcome"].as_str();
                        if !matches!(outcome,Some("baseline"|"unchanged"|"changed")){
                            view.source_status="Rust Wiki source-delta refused · observation unavailable".into();
                            view.overview=None;view.visual=None;view.vec_view=None;
                            cx.notify();return;
                        }
                        view.wiki_delta=match outcome{
                            Some("baseline")=>"First authorized Wiki observation".into(),
                            Some("unchanged")=>format!("Wiki source unchanged · revision {}",data.wiki_revision),
                            _=>format!(
                                "Rust Wiki changes · {} pages · {} sections · {} link sets · {} events",
                                delta["changedPages"].as_u64().unwrap_or(0),
                                delta["changedSections"].as_u64().unwrap_or(0),
                                delta["changedLinks"].as_u64().unwrap_or(0),
                                delta["totalEvents"].as_u64().unwrap_or(0)
                            ),
                        };
                        view.wiki_events=delta["events"].as_array().map(|events|
                            events.iter().take(12).map(|event|format!(
                                "{} · {}{}",
                                event["kind"].as_str().unwrap_or("change"),
                                event["page"].as_str().unwrap_or("unknown"),
                                event["section"].as_str().map(|section|format!(" / {section}"))
                                    .unwrap_or_default()
                            )).collect()
                        ).unwrap_or_default();
                        if view.overview.as_ref()!=Some(&data){view.overview=Some(data);}
                    }
                    Err(error) => {
                        view.source_status=format!("{} · Wiki is unavailable, not empty",error.label());
                        view.overview=None;view.visual=None;view.vec_view=None;
                        view.wiki_events.clear();view.wiki_delta.clear();
                        cx.notify();return;
                    }
                }
                match visual.and_then(|v| view.visual_guard.accept(v).map_err(Into::into)) {
                    Ok(next) => {
                        match visual_delta(view.visual.as_ref(),next.as_ref()){
                            Ok(delta)=>{
                                if delta.is_empty(){
                                    view.visual_status=next.as_ref().map(|v|format!("Committed {} · revision {} · source fingerprint {} · Rust VEC unchanged",v.surface_id,v.revision,v.fingerprint)).unwrap_or_else(||"Host online · no committed visual surface".into());
                                }else{
                                    match next.as_ref().map(vec::compile).transpose(){
                                        Ok(compiled)=>match vec::diff(view.vec_view.as_ref(),compiled.as_ref()){
                                            Ok(changes)=>{
                                                view.visual_status=next.as_ref().map(|v|format!(
                                                    "Committed {} · rev {} · fingerprint {} · Rust VEC: +{} / ~{} / -{} / {} moved / {} reordered / {} bindings{}",
                                                    v.surface_id,v.revision,v.fingerprint,changes.added.len(),changes.updated.len(),
                                                    changes.removed.len(),changes.moved.len(),changes.reordered.len(),
                                                    changes.changed_bindings.len(),if changes.theme_changed{" · theme changed"}else{""}
                                                )).unwrap_or_else(||"Host online · no committed visual surface".into());
                                                // Retain revision and binding fences even if no redraw is required.
                                                view.visual=next;view.vec_view=compiled;
                                            }
                                            Err(_)=>{
                                                view.visual=None;view.vec_view=None;
                                                view.visual_status="VEC revision or design digest conflict".into();
                                            }
                                        },
                                        Err(_)=>{
                                            view.visual=None;view.vec_view=None;
                                            view.visual_status="VEC compilation rejected the admitted visual".into();
                                        }
                                    }
                                }
                            }
                            Err(_)=>{view.visual=None;view.vec_view=None;view.visual_status="Visual revision conflict".into();}
                        }
                    }
                    Err(e) => {
                        view.visual_status=format!("{} · visual unavailable, not an empty surface",e.label());
                        view.visual=None;view.vec_view=None;
                    }
                }
                cx.notify();
            });
        }).detach();
    }
    fn submit(&mut self, cx: &mut Context<Self>) {
        if self.busy || self.uncertain { return; }
        let text = self.input.read(cx).value().to_string();
        // Exact navigation is compiled by the same Rust core as PWA/Host.
        // Selecting a local panel is not a Host command or an approval.
        let destination=navigation::destination(&json!({"text":text}));
        let panel=match destination["destination"].as_str(){
            Some("today")=>Some(Panel::Overview),
            Some("wiki")=>Some(Panel::Wiki),
            Some("build")=>Some(Panel::Visual),
            Some("control")=>Some(Panel::Control),
            _=>None,
        };
        if let Some(panel)=panel {self.select_panel(panel,cx);return;}
        self.review = None;
        self.detail.clear();
        self.busy = true;
        self.status = "Planning with canonical Host…".into();
        cx.notify();
        let work = cx.background_executor().spawn(async move { control::plan(&text) });
        cx.spawn(async move |this,cx| {
            let result=work.await;
            let _=this.update(cx,|view,cx| {
                view.busy=false;
                match result {
                    Ok(review) => {
                        view.status=if review.needs_approval() {"Review exact plan · nothing executed"} else {"Host decision · no native approval issued"}.into();
                        view.detail=review.detail.clone();
                        view.review=Some(review);
                    }
                    Err(e)=>{view.status=format!("Planning unavailable: {}",e.label());}
                }
                cx.notify();
            });
        }).detach();
    }
    fn approve(&mut self,cx:&mut Context<Self>) {
        if self.busy || self.uncertain { return; }
        let Some(key)=self.review.as_mut().and_then(Review::consume_approval) else {return};
        self.last_plan=Some(key.id().to_owned());
        self.review=None;
        self.busy=true;
        self.status="Awaiting Host receipt. Never retry a lost response.".into();
        cx.notify();
        let work=cx.background_executor().spawn(async move {control::execute(key)});
        cx.spawn(async move |this,cx| {
            let result=work.await;
            let _=this.update(cx,|view,cx| {
                view.busy=false;
                // Old overview is not evidence of the just-completed command.
                view.overview=None;
                view.visual=None;
                view.visual_status="Refresh to observe the current Host revision".into();
                match result {
                    Ok(receipt)=>{
                        view.uncertain=receipt.status=="uncertain";
                        view.status=format!("Host receipt: {}",receipt.status);
                        view.detail=receipt.detail;
                    }
                    Err(e)=>{
                        view.uncertain=true;
                        view.status=format!("Outcome unknown: {}. Inspect original plan; do not retry.",e.label());
                    }
                }
                cx.notify();
                // Refresh authoritative state after an applied receipt; preserve receipt status.
                if !view.uncertain {view.refresh(cx);}
            });
        }).detach();
    }
    fn inspect_graph(&mut self,operation:&'static str,cx:&mut Context<Self>){
        if self.graph_busy{return}
        let key=self.input.read(cx).value().to_string();
        self.graph_busy=true;
        self.graph_status=format!("Reading owner-authorized graph {operation} for exact query “{key}”…");
        self.graph_detail.clear();
        cx.notify();
        let work=cx.background_executor().spawn(async move{read_development(operation,&key)});
        cx.spawn(async move |this,cx|{
            let result=work.await;
            let _=this.update(cx,|view,cx|{
                view.graph_busy=false;
                match result{
                    Ok(data)=>{
                        view.graph_status=format!("Source-backed HQKG · {operation} · query “{key}” · read only");
                        view.graph_detail=data;
                    }
                    Err(e)=>{
                        view.graph_status=format!("{} · graph result unavailable, not empty",e.label());
                        view.graph_detail.clear();
                    }
                }
                cx.notify();
            });
        }).detach();
    }
    fn inspect(&mut self,cx:&mut Context<Self>) {
        if self.busy { return; }
        // An owner can inspect a Host-owned plan after restarting GPUI without
        // inventing a local receipt ledger or replaying the original effect.
        let typed=self.input.read(cx).value().to_string();
        let typed=typed.trim();
        let id=if control::valid_id(typed) {
            typed.to_owned()
        }else if typed.starts_with("ctl-") {
            self.status="Invalid Host plan ID · expected ctl- and 16 lowercase hex characters".into();
            cx.notify();return;
        }else if let Some(id)=self.last_plan.clone(){
            id
        }else{
            self.status="Enter a Host plan ID from Recent Host decisions to inspect it".into();
            cx.notify();return;
        };
        self.last_plan=Some(id.clone());
        self.review=None;
        self.busy=true;
        self.status="Inspecting durable Host decision…".into();
        cx.notify();
        let work=cx.background_executor().spawn(async move {control::inspect(&id)});
        cx.spawn(async move |this,cx| {
            let result=work.await;
            let _=this.update(cx,|view,cx| {
                view.busy=false;
                match result {
                    Ok(detail)=>{
                        // Inspect is always read-only, no recovered approval.
                        // An uncertain session remains blocked until explicit
                        // acknowledgement and a new session after local review.
                        view.status="Original Host decision · inspection only".into();
                        view.detail=detail;
                    }
                    Err(e)=>{view.status=format!("Inspection unavailable: {}",e.label());}
                }
                cx.notify();
            });
        }).detach();
    }
}
// GPUI consumes only the compiled Rust VEC tree. Host/TierFlow remains the
// committed source; preview actions are intentionally inert in this renderer.
fn rgb_hex(s:&str)->u32{
    s.strip_prefix('#').filter(|x|x.len()==6)
        .and_then(|x|u32::from_str_radix(x,16).ok()).unwrap_or(0x151b24)
}
fn mount_node(n:&VecElement,view:&VecView)->AnyElement{
    let st=&n.style;
    let mut el=div().flex().flex_col().gap(px(st.gap_px)).p(px(st.padding_px));
    if let Some(bg)=st.background.as_deref(){
        el=el.bg(rgb(rgb_hex(bg)));
        if let Some(ink)=st.foreground.as_deref(){el=el.text_color(rgb(rgb_hex(ink)));}
    }
    if let Some(font)=st.font_size_px{el=el.text_size(px(font));}
    if let Some(radius)=st.radius_px{el=el.rounded(px(radius));}
    if st.border_width_px>0.{
        el=el.border_1().border_color(rgb(rgb_hex(st.border_color.as_deref().unwrap_or(&view.accent))));
    }
    if let Some(label)=&n.label{
        el=el.child(div().child(if n.preview_only{format!("{label} · preview only")}else{label.clone()}));
    }
    if let Some(detail)=&n.detail{el=el.child(div().child(detail.clone()));}
    if n.kind=="chart"{
        for bar in &n.bars{
            let track=div().relative().w_full().flex().h(px(10.)).bg(rgb(rgb_hex(&view.secondary)))
                .child(div().flex_none().w(relative(bar.start as f32)))
                .child(div().flex_none().w(relative(bar.extent as f32)).bg(rgb(rgb_hex(&view.accent))))
                .child(div().flex_none().w(relative((1.-bar.start-bar.extent).max(0.) as f32)))
                .child(div().absolute().top_0().bottom_0().left(relative(bar.zero as f32))
                    .w(px(1.)).bg(rgb(rgb_hex(&view.foreground))));
            el=el.child(div().child(format!("{} · {}",bar.label,bar.value))).child(track);
        }
    }else{for item in &n.items{el=el.child(div().p_1().child(item.clone()));}}
    match n.layout{
        "grid"=>{
            for row in n.children.chunks(n.columns as usize){
                let mut line=div().flex().gap_2();
                for child in row{line=line.child(div().flex_1().min_w_0().child(mount_node(child,view)));}
                el=el.child(line);
            }
        }
        "row"=>{
            let mut line=div().flex().flex_wrap().gap_2();
            for child in &n.children{line=line.child(mount_node(child,view));}
            el=el.child(line);
        }
        _=>for child in &n.children{el=el.child(mount_node(child,view));},
    }
    el.into_any_element()
}

impl Render for Desktop {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let mut body = div().flex().flex_col().gap_3()
            .child(div().text_sm().child(self.source_status.clone()));
        if let Some(data) = &self.overview {
            body = body.child(format!("Host observed: {}", data.observed_at))
                .child(format!("Active devices: {}", data.active_devices));
            if matches!(self.panel, Panel::Overview|Panel::Wiki) {
            body=body.child(div().text_lg().child(format!("Wiki · revision {}", data.wiki_revision)));
            body=body.child(div().text_sm().child(self.wiki_delta.clone()));
            for item in &self.wiki_events {
                body=body.child(div().text_sm().child(item.clone()));
            }
            body=body.child(div().text_sm().child(format!(
                "{} source-backed Wiki pages · {} displayed",data.wiki_page_total,data.wiki_content.len()
            )));
            if let Some(captures)=&data.wiki_captures {
                body=body.child(div().text_lg().child("Personal captures · committed Wiki"))
                    .child(format!(
                        "{} notes · {} open tasks · {} completed · {} unknown · {} total",
                        captures.counts.notes,captures.counts.open_tasks,
                        captures.counts.done_tasks,captures.counts.unknown_tasks,captures.total
                    ));
                for item in &captures.recent {
                    let kind=if item.kind=="note"{"Note".to_owned()}
                        else{format!("{} task",item.status.as_deref().unwrap_or("Unknown"))};
                    body=body.child(div().p_1().child(format!(
                        "{} · {} · revision {} · {}",
                        kind,item.page,item.created_revision,item.preview
                    )));
                }
                if captures.omitted>0 {
                    body=body.child(format!(
                        "{} earlier captures omitted by canonical Host projection",captures.omitted
                    ));
                }
            }
            if let Some(query)=&self.wiki_query {
                let read=wiki_read::WikiRead{
                    revision:data.wiki_revision,digest:data.wiki_digest.clone(),
                    pages_total:data.wiki_page_total,pages:data.wiki_content.clone(),
                    captures:data.wiki_captures.clone(),
                    search_index:data.wiki_search_index.clone(),
                    indexed_pages:data.wiki_indexed_pages,
                    index_truncated:data.wiki_index_truncated,
                };
                if let Some(found)=wiki_read::search_view(&read,query,24) {
                    body=body.child(div().text_lg().child(format!(
                        "Rust Wiki search · {} bounded matches for “{}”",
                        found.matches,query
                    )));
                    body=body.child(div().text_sm().child(format!(
                        "Read-only Wiki rev {} · {} of {} pages indexed · {} sections · {}",
                        found.revision,found.scanned_pages,found.pages_total,
                        found.indexed_sections,
                        if found.index_truncated{"bounded index: some source omitted"}
                        else{"indexed source complete"}
                    )));
                    for hit in &found.hits {
                        body=body.child(div().p_2().bg(rgb(0x202b3a))
                            .child(format!(
                                "{}{} · {}",
                                hit.page,hit.section.as_ref().map(|s|format!(" / {s}")).unwrap_or_default(),
                                hit.excerpt
                            )));
                    }
                    if found.matches>found.hits.len(){
                        body=body.child(format!(
                            "{} additional preview matches not displayed",found.matches-found.hits.len()
                        ));
                    }
                }
            } else {
            for page in &data.wiki_content {
                let mut page_view=div().flex().flex_col().gap_2().p_3()
                    .bg(rgb(0x202b3a))
                    .child(div().text_lg().child(page.name.clone()));
                if !page.links.is_empty() {
                    page_view=page_view.child(div().text_sm()
                        .child(format!("Links to: {}",page.links.join(", "))));
                }
                for section in &page.sections {
                    let text=if section.truncated {
                        format!("{}… [additional source text not displayed]",section.text)
                    }else{section.text.clone()};
                    page_view=page_view.child(div().p_2().flex().flex_col().gap_1()
                        .child(div().font_semibold().child(section.title.clone()))
                        .child(div().child(text)));
                }
                if page.sections_total>page.sections.len(){
                    page_view=page_view.child(format!(
                        "{} additional sections not displayed",page.sections_total-page.sections.len()
                    ));
                }
                body=body.child(page_view);
            }
            if data.wiki_page_total>data.wiki_content.len(){
                body=body.child(format!(
                    "{} additional Wiki pages not displayed",data.wiki_page_total-data.wiki_content.len()
                ));
            }
            }
            }
            if matches!(self.panel,Panel::Overview|Panel::Control){
            body = body.child(div().text_lg().child("Recent Host decisions"))
                .child(div().text_sm().child(
                    "Copy a ctl- plan ID into the command field and choose Inspect Host plan ID. This never retries execution."
                ));
            for row in &data.recent { body = body.child(div().p_1().child(row.clone())); }
            }
        }
        if matches!(self.panel,Panel::Overview|Panel::Visual){
        body=body.child(div().text_lg().child(format!(
            "Committed TierFlow surface · {}px GPUI window-derived Host request",self.viewport_px
        ))).child(self.visual_status.clone());
        if let Some(v)=&self.vec_view{
            body=body.child(div().text_sm().child(format!(
                "Admitted design digest SHA256 {} · surface {} · revision {} · authority {}",
                v.design_digest,v.surface_id,v.revision,v.authority
            )));
            for (binding,(revision,digest)) in v.binding_watermarks.iter().take(12) {
                body=body.child(div().text_sm().child(format!(
                    "Live source binding {binding} · revision {revision} · digest {digest}"
                )));
            }
            if v.binding_watermarks.len()>12 {
                body=body.child(format!(
                    "{} more bound source identities not displayed",v.binding_watermarks.len()-12
                ));
            }
            body=body.child(div().child(format!("Rust VEC · {} components · {} charts · {} preview-only actions",
                v.node_count,v.chart_count,v.preview_action_ids.len())))
                .child(div().p_3().bg(rgb(rgb_hex(&v.background))).text_color(rgb(rgb_hex(&v.foreground)))
                    .child(mount_node(&v.root,v)));
        }
        }
        let mut controls=div().flex().flex_wrap().gap_2()
            .child(Button::new("refresh").label("Refresh Host").on_click(cx.listener(|v,_,_,cx|v.refresh(cx))))
            .child(Button::new("plan").label("Review command").on_click(cx.listener(|v,_,_,cx|v.submit(cx))));
        if matches!(self.panel,Panel::Overview|Panel::Graph){
            controls=controls
                .child(Button::new("graph-symbol").label("Find graph symbol").on_click(cx.listener(|v,_,_,cx|v.inspect_graph("symbols",cx))))
                .child(Button::new("graph-sources").label("Find semantic anchors").on_click(cx.listener(|v,_,_,cx|v.inspect_graph("sources",cx))))
                .child(Button::new("graph-file").label("Compute graph file ID").on_click(cx.listener(|v,_,_,cx|v.inspect_graph("compute",cx))))
                .child(Button::new("graph-impact").label("Source impact").on_click(cx.listener(|v,_,_,cx|v.inspect_graph("impact",cx))))
                .child(Button::new("graph-wiring").label("Find potential wiring").on_click(cx.listener(|v,_,_,cx|v.inspect_graph("wiring",cx))));
        }
        if !self.busy && self.review.as_ref().is_some_and(Review::needs_approval) && !self.uncertain {
            controls=controls.child(Button::new("approve").primary().label("Approve exact displayed Host plan")
                .on_click(cx.listener(|v,_,_,cx|v.approve(cx))))
                .child(Button::new("cancel").label("Cancel · no effect").on_click(cx.listener(|v,_,_,cx|{
                    v.review=None;v.status="Cancelled locally · no execution sent".into();cx.notify();
                })));
        }
        controls=controls.child(Button::new("inspect").label("Inspect Host plan ID · read only")
            .on_click(cx.listener(|v,_,_,cx|v.inspect(cx))));
        if matches!(self.panel,Panel::Overview|Panel::Graph){
            body=body.child(div().text_lg().child("Development graph · source-backed only"))
                .child(self.graph_status.clone());
            if !self.graph_detail.is_empty(){
                body=body.child(div().p_3().bg(rgb(0x202b3a)).child(self.graph_detail.clone()));
            }
        }
        if matches!(self.panel,Panel::Overview|Panel::Control) && !self.detail.is_empty() {
            body=body.child(div().text_lg().child("Canonical Host response"))
                .child(div().p_3().bg(rgb(0x202b3a)).child(self.detail.clone()));
        }
        let mut actions=div().flex().flex_col().gap_2().child(controls);
        if matches!(self.panel,Panel::Overview|Panel::Wiki){
            actions=actions.child(div().flex().flex_wrap().gap_2()
                .child(Button::new("wiki-search").label("Search current Wiki")
                    .on_click(cx.listener(|v,_,_,cx|v.find_wiki(cx))))
                .child(Button::new("wiki-clear").label("Clear Wiki search")
                    .on_click(cx.listener(|v,_,_,cx|v.clear_wiki_search(cx)))));
        }
        if matches!(self.panel,Panel::Overview|Panel::Visual){
            actions=actions.child(div().text_sm().child(
                "Resize the native window to request the exact Host-planned viewport. Preview actions never execute."
            ));
        }
        let navigation=div().flex().flex_wrap().gap_2()
            .child(Button::new("panel-overview").label("Overview")
                .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Overview,cx))))
            .child(Button::new("panel-wiki").label("Wiki")
                .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Wiki,cx))))
            .child(Button::new("panel-build").label("Build")
                .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Visual,cx))))
            .child(Button::new("panel-graph").label("Graph")
                .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Graph,cx))))
            .child(Button::new("panel-decisions").label("Decisions")
                .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Control,cx))));
        div().size_full().bg(rgb(0x151b24)).text_color(rgb(0xe6edf3))
            .flex().flex_col().p_5().gap_3()
            .child(div().text_xl().child("VIVIM · Native workspace"))
            .child(navigation)
            .child(self.status.clone())
            .child(Input::new(&self.input))
            .child(actions)
            .child(div().id("host-projection").flex_1().min_h_0().overflow_y_scroll().child(body))
    }
}
fn main() {
    Application::new().run(|cx: &mut App| {
        gpui_component::init(cx);
        let bounds = Bounds::centered(None, size(px(1000.), px(740.)), cx);
        cx.open_window(WindowOptions { window_bounds: Some(WindowBounds::Windowed(bounds)), ..Default::default() },
            |window, cx| {
                let input=cx.new(|cx| InputState::new(window,cx).placeholder("Ask VIVIM or describe a Host command"));
                let view=cx.new(|cx| {
                    let mut view=Desktop {input,panel:Panel::Overview,viewport_px:viewport_for_window(window),
                        viewport_epoch:0,read_busy:false,refresh_pending:false,
                        source_status:"Host source not yet observed".into(),
                        wiki_query:None,status:"Not yet observed".into(),overview:None,visual:None,vec_view:None,visual_status:"Not yet observed".into(),visual_guard:RevisionGuard::default(),wiki_guard:WikiRevisionGuard::default(),wiki_delta:"Not yet observed".into(),wiki_events:Vec::new(),detail:String::new(),
                        review:None,last_plan:None,busy:false,uncertain:false,
                        graph_detail:String::new(),graph_status:"Graph not yet queried".into(),graph_busy:false};
                    cx.observe_window_bounds(window, |view,window,cx|{
                        view.set_viewport(viewport_for_window(window),cx);
                    }).detach();
                    view.refresh(cx);view.start_observer(cx);view
                });
                cx.new(|cx|Root::new(view,window,cx))
            }).expect("Unable to open VIVIM GPUI window");
        cx.activate(true);
    });
}

#[cfg(test)]
mod viewport_tests {
    use super::viewport_for_width;
    #[test]
    fn real_window_width_is_bounded_and_not_a_preset() {
        assert_eq!(viewport_for_width(1000.),960);
        assert_eq!(viewport_for_width(513.),473);
        assert_eq!(viewport_for_width(120.),240);
        assert_eq!(viewport_for_width(5000.),3840);
        assert_eq!(viewport_for_width(f32::NAN),1000);
    }
}
