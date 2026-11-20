//! @hq:capability vivim.gpui-desktop@1
//! @hq:consumes vivim.gpui-projection-client@1
//! @hq:consumes vivim.gpui-control-client@1
//! @hq:consumes vivim.native-visual-validation@1
//! @hq:consumes vivim.native-visual-delta@1
//! @hq:consumes hqkg.development-query@1
use std::time::Duration;
use vivim_programmability_core::visual::visual_delta;
use gpui::{AnyElement, App, Application, Bounds, Context, Entity, Window, WindowBounds, WindowOptions, div, prelude::*, px, relative, rgb, size};
use gpui_component::{Root, input::{Input, InputState}, button::{Button, ButtonVariants}};
use vivim_gpui_desktop::{Overview, read_overview, read_development, control::{self, Review}, visual::{self, Visual, Node, RevisionGuard}};

struct Desktop {
    input: Entity<InputState>,
    status: String,
    overview: Option<Overview>,
    visual: Option<Visual>,
    visual_status: String,
    visual_guard: RevisionGuard,
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
    // Weak entity lifetime stops the observer when its workspace closes.
    // All refreshes are GET-only. Neither polling nor readback can approve.
    fn start_observer(&self,cx:&mut Context<Self>){
        cx.spawn(async move |this,cx|{
            loop{
                cx.background_executor().timer(Duration::from_secs(15)).await;
                if this.update(cx,|view,cx|{
                    if !view.busy&&!view.review.as_ref().is_some_and(Review::needs_approval){
                        view.refresh(cx);
                    }
                }).is_err(){break}
            }
        }).detach();
    }
    fn refresh(&mut self, cx: &mut Context<Self>) {
        if self.busy { return; }
        self.busy = true;
        self.visual_status = "Checking Host · displayed observations may be stale".into();
        cx.notify();
        let work = cx.background_executor().spawn(async move { (read_overview(), visual::read()) });
        cx.spawn(async move |this, cx| {
            let result = work.await;
            let _ = this.update(cx, |view, cx| {
                view.busy = false;
                let (overview, visual) = result;
                match overview {
                    Ok(data) => { if view.overview.as_ref()!=Some(&data){view.overview=Some(data);} }
                    Err(error) => { view.visual_status=error.label().into(); view.overview = None; view.review = None; view.visual=None; cx.notify(); return; }
                }
                match visual.and_then(|v| view.visual_guard.accept(v).map_err(Into::into)) {
                    Ok(next) => {
                        match visual_delta(view.visual.as_ref(),next.as_ref()){
                            Ok(delta)=>{
                                let summary=next.as_ref().map(|v|format!("Committed {} · revision {} · read-only · {} changed / {} added / {} removed",v.surface_id,v.revision,delta.changed.len(),delta.added.len(),delta.removed.len())).unwrap_or_else(||"No committed visual surface".into());
                                if !delta.is_empty(){view.visual=next;}
                                view.visual_status=summary;
                            }
                            Err(_)=>{view.visual=None;view.visual_status="Visual revision conflict".into();}
                        }
                    }
                    Err(e) => {view.visual_status=e.label().into(); view.visual=None;view.review=None;}
                }
                cx.notify();
            });
        }).detach();
    }
    fn submit(&mut self, cx: &mut Context<Self>) {
        if self.busy || self.uncertain { return; }
        let text = self.input.read(cx).value().to_string();
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
        self.graph_status=format!("Reading indexed {}…",operation);
        self.graph_detail.clear();
        cx.notify();
        let work=cx.background_executor().spawn(async move{read_development(operation,&key)});
        cx.spawn(async move |this,cx|{
            let result=work.await;
            let _=this.update(cx,|view,cx|{
                view.graph_busy=false;
                match result{
                    Ok(data)=>{view.graph_status="Source-backed HQKG read only".into();view.graph_detail=data;}
                    Err(e)=>{view.graph_status=e.label().into();view.graph_detail.clear();}
                }
                cx.notify();
            });
        }).detach();
    }
    fn inspect(&mut self,cx:&mut Context<Self>) {
        if self.busy { return; }
        let Some(id)=self.last_plan.clone() else {return};
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
// Native mapping of already-validated TierFlow structure. Inert buttons are
// labels, not Host actions. Grid uses canonical column count; no claim of
// pixel-level parity or font/animation parity.
use vivim_programmability_core::visual::contrast_ink as ink;
fn mount_node(n:&Node,theme:&Visual)->AnyElement{
    let is_card=matches!(n.kind.as_str(),"card"|"profile-card"|"project-card");
    let bg=n.background.or(if is_card{Some(theme.secondary)}else{None});
    let mut el=div().flex().flex_col().gap(px(n.gap.unwrap_or(8.))).p(px(n.padding.unwrap_or(if is_card{12.}else{2.})));
    if let Some(c)=bg{el=el.bg(rgb(c)).text_color(rgb(ink(c)));}
    if let Some(size)=n.font_size{el=el.text_size(px(size));}
    if let Some(radius)=n.radius{el=el.rounded(px(radius));}
    if n.border_width.unwrap_or(if n.border.is_some(){1.}else{0.})>0.{
        el=el.border_1().border_color(rgb(n.border.unwrap_or(theme.accent)));
    }
    if let Some(label)=&n.label{
        let text=if n.kind=="button"{format!("{label} · preview only")}else{label.clone()};
        el=el.child(div().child(text));
    }
    if let Some(detail)=&n.detail{el=el.child(div().child(detail.clone()));}
    if n.kind=="chart"{
        for bar in &n.bars{
            // Shared Rust geometry; segment widths are proportional to the signed range.
            let track=div().relative().w_full().flex().h(px(10.)).bg(rgb(theme.secondary))
                .child(div().flex_none().w(relative(bar.start as f32)))
                .child(div().flex_none().w(relative(bar.extent as f32)).bg(rgb(theme.accent)))
                .child(div().flex_none().w(relative((1.-bar.start-bar.extent).max(0.) as f32)))
                .child(div().absolute().top_0().bottom_0().left(relative(bar.zero as f32)).w(px(1.)).bg(rgb(ink(theme.secondary))));
            el=el.child(div().child(format!("{} · {}",bar.label,bar.value))).child(track);
        }
    }else{for item in &n.items{el=el.child(div().p_1().child(item.clone()));}}
    if n.kind=="grid"{
        for row in n.children.chunks(n.columns as usize){
            let mut line=div().flex().gap_2();
            for child in row{line=line.child(div().flex_1().min_w_0().child(mount_node(child,theme)));}
            el=el.child(line);
        }
    }else if n.horizontal{
        let mut row=div().flex().flex_wrap().gap_2();
        for child in &n.children{row=row.child(mount_node(child,theme));}el=el.child(row);
    }else{for child in &n.children{el=el.child(mount_node(child,theme));}}
    el.into_any_element()
}

impl Render for Desktop {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let mut body = div().flex().flex_col().gap_3();
        if let Some(data) = &self.overview {
            body = body.child(format!("Host observed: {}", data.observed_at))
                .child(format!("Active devices: {}", data.active_devices))
                .child(div().text_lg().child(format!("Wiki · revision {}", data.wiki_revision)));
            for page in &data.wiki_pages { body = body.child(div().p_1().child(page.clone())); }
            body = body.child(div().text_lg().child("Recent Host decisions"));
            for row in &data.recent { body = body.child(div().p_1().child(row.clone())); }
        }
        body=body.child(div().text_lg().child("Committed TierFlow surface")).child(self.visual_status.clone());
        if let Some(v)=&self.visual{
            body=body.child(div().p_3().bg(rgb(v.background)).text_color(rgb(ink(v.background))).child(mount_node(&v.root,v)));
        }
        let mut controls=div().flex().flex_wrap().gap_2()
            .child(Button::new("refresh").label("Refresh Host").on_click(cx.listener(|v,_,_,cx|v.refresh(cx))))
            .child(Button::new("plan").label("Review command").on_click(cx.listener(|v,_,_,cx|v.submit(cx))))
            .child(Button::new("graph-symbol").label("Find graph symbol").on_click(cx.listener(|v,_,_,cx|v.inspect_graph("symbols",cx))))
            .child(Button::new("graph-file").label("Compute graph file ID").on_click(cx.listener(|v,_,_,cx|v.inspect_graph("compute",cx))));
        if !self.busy && self.review.as_ref().is_some_and(Review::needs_approval) && !self.uncertain {
            controls=controls.child(Button::new("approve").primary().label("Approve exact displayed Host plan")
                .on_click(cx.listener(|v,_,_,cx|v.approve(cx))))
                .child(Button::new("cancel").label("Cancel · no effect").on_click(cx.listener(|v,_,_,cx|{
                    v.review=None;v.status="Cancelled locally · no execution sent".into();cx.notify();
                })));
        }
        if self.last_plan.is_some() {
            controls=controls.child(Button::new("inspect").label("Inspect original plan").on_click(cx.listener(|v,_,_,cx|v.inspect(cx))));
        }
        body=body.child(div().text_lg().child("Development graph · source-backed only"))
            .child(self.graph_status.clone());
        if !self.graph_detail.is_empty(){
            body=body.child(div().p_3().bg(rgb(0x202b3a)).child(self.graph_detail.clone()));
        }
        if !self.detail.is_empty() {
            body=body.child(div().text_lg().child("Canonical Host response"))
                .child(div().p_3().bg(rgb(0x202b3a)).child(self.detail.clone()));
        }
        div().size_full().bg(rgb(0x151b24)).text_color(rgb(0xe6edf3))
            .flex().flex_col().p_5().gap_3()
            .child(div().text_xl().child("VIVIM · Native workspace"))
            .child(self.status.clone())
            .child(Input::new(&self.input))
            .child(controls)
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
                    let mut view=Desktop {input,status:"Not yet observed".into(),overview:None,visual:None,visual_status:"Not yet observed".into(),visual_guard:RevisionGuard::default(),detail:String::new(),
                        review:None,last_plan:None,busy:false,uncertain:false,
                        graph_detail:String::new(),graph_status:"Graph not yet queried".into(),graph_busy:false};
                    view.refresh(cx);view.start_observer(cx);view
                });
                cx.new(|cx|Root::new(view,window,cx))
            }).expect("Unable to open VIVIM GPUI window");
        cx.activate(true);
    });
}
