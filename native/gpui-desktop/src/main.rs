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
use std::{time::{Duration, Instant}, sync::{Arc,atomic::{AtomicBool,Ordering},mpsc}};
use vivim_host_supervisor::{HostSupervisor, Readiness};
use serde_json::{json,Value};
use vivim_programmability_core::navigation;
use vivim_programmability_core::wiki_read::{self, RevisionGuard as WikiRevisionGuard};
use vivim_programmability_core::vec::{View as VecView, Element as VecElement};
use gpui::{AnyElement, App, Application, Bounds, Context, Entity, Focusable, Window, WindowBounds, WindowControlArea, WindowOptions, div, prelude::*, px, relative, rgb, size};

// One native GPUI-drawn Windows titlebar: File/Edit/View/Tools/Developer/Settings/
// Help and the OS minimize/maximize/close controls share a single top row.
// GPUI's Windows NCHITTEST mapping handles titlebar drag and caption buttons;
// no separate Win32 HMENU, browser window, or effect authority is introduced.
fn vivim_window_options(bounds: Bounds<gpui::Pixels>) -> WindowOptions {
    let mut options=WindowOptions {
        window_bounds: Some(WindowBounds::Windowed(bounds)),
        ..Default::default()
    };
    #[cfg(windows)]
    {
        options.titlebar=Some(gpui::TitlebarOptions {
            title: Some("VIVIM".into()),
            appears_transparent: true,
            ..Default::default()
        });
    }
    options
}

// GPUI 0.2.2 drawable viewport logical pixels, minus workspace padding.
// The Host remains responsible for admitting and planning this exact width.
fn viewport_for_width(width: f32) -> u32 {
    if !width.is_finite() { return 1000; }
    (width - 40.).round().clamp(240., 3840.) as u32
}
fn viewport_for_window(window: &Window) -> u32 {
    viewport_for_width(f32::from(window.viewport_size().width))
}

use gpui_component::{Root, StyledExt, input::{Input, InputState, InputEvent}, button::{Button, ButtonVariants}};
use vivim_gpui_desktop::first_contact::{self, PhoneDraft};
use vivim_gpui_desktop::desktop_menu::{self, Section, Destination, Intent};
use vivim_gpui_desktop::desktop_settings::{self, Preferences};
use vivim_gpui_desktop::desktop_capture;
use vivim_gpui_desktop::remote_host_transport::{
    self,NativeHostPeer,RemoteInput
};
use vivim_gpui_desktop::remote_proof::{
    RemoteProof,RemoteProofResult,PROOF_LOGICAL_BOUNDS,PROOF_CONTROL_ID
};
use vivim_gpui_desktop::live_delivery;
use vivim_gpui_desktop::surface_registry;
use vivim_gpui_desktop::{Overview, ThemeTokens, ReadError, ObservationTicket, passive_read_allowed, DevelopmentRevisionGuard, read_overview, read_development, control::{self, Review}, visual::{self, Visual, RevisionGuard}};

#[derive(Clone, Copy, PartialEq, Eq)]
enum Panel { FirstContact, Overview, Wiki, Visual, Graph, Control, Devices, Developer, Settings, About }
impl Panel {
    fn label(self)->&'static str {
        match self {
            Self::FirstContact=>"First Contact",Self::Overview=>"Overview",Self::Wiki=>"Wiki",Self::Visual=>"Build",
            Self::Graph=>"Knowledge graph",Self::Control=>"Host decisions",
            Self::Devices=>"Phone and devices",Self::Developer=>"Developer tools",
            Self::Settings=>"Settings",Self::About=>"About VIVIM",
        }
    }
}

#[derive(Debug)]
enum GpuiPhoneMessage {
    Frame {width:u32,height:u32,revision:u64},
    Input(RemoteInput),
    Stopped(&'static str),
}
struct GpuiPhoneShare {
    session:u128,
    scale:f32,
    stop:Arc<AtomicBool>,
    proof:RemoteProof,
}
impl Drop for GpuiPhoneShare {
    fn drop(&mut self){self.stop.store(true,Ordering::Release);}
}
struct Desktop {
    supervisor: Arc<HostSupervisor>,
    panel: Panel,
    menu_open: Option<Section>,
    surface_group: Option<Section>,
    preferences: Preferences,
    preferences_status: String,
    developer_status: String,
    delivery_status: String,
    delivery_busy: bool,
    capture_busy: bool,
    gpui_phone_share: Option<GpuiPhoneShare>,
    gpui_phone_status: String,
    gpui_phone_taps: u64,
    viewport_px: u32,
    viewport_epoch: u64,
    // Invalidates reads crossing a Host effect without weakening revision guards.
    source_epoch: u64,
    presentation_epoch: u64,
    read_busy: bool,
    refresh_pending: bool,
    // At most one immediate drift retry per successful cycle or observer tick.
    coherence_retry_ready: bool,
    source_status: String,
    wiki_query: Option<String>,
    // Composer UI identity is not a Host source revision. It only prevents
    // stale delayed refresh callbacks from creating redundant source reads.
    composer_edit_epoch: u64,
    last_wiki_observation_started: Option<Instant>,
    semantic_preview: Option<control::ComposerMeaning>,
    semantic_busy: bool,
    semantic_pending: bool,
    // A staged phone draft becomes unapprovable in GPUI after a native edit.
    // Host independently rejects stale session/source revisions at execution.
    phone_plan_edit_epoch: Option<u64>,
    // Invalidate an exact Host command plan on every native draft edit.
    composer_plan_edit_epoch: Option<u64>,
    input: Entity<InputState>,
    _input_subscription: Option<gpui::Subscription>,
    phone_draft: Option<PhoneDraft>,
    phone_status: String,
    status: String,
    overview: Option<Overview>,
    // Last verified Host color tokens are presentation-only cache. Holding
    // them through one-shot effects avoids flashing graphite while authoritative
    // Wiki and control readback are deliberately invalidated.
    last_theme: Option<ThemeTokens>,
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
    graph_pending: bool,
    graph_query: Option<(&'static str,String)>,
    graph_guard: DevelopmentRevisionGuard,
    review: Option<Review>,
    last_plan: Option<String>,
    busy: bool,
    // An uncertain execution must be inspected, never retried by this session.
    uncertain: bool,
}
impl Desktop {
    // Styling is an inert read of the SAME owner-authorized Host projection
    // the phone PWA uses. No duplicate desktop palette store or write authority.
    fn native_theme(&self) -> ThemeTokens {
        self.overview.as_ref().and_then(|v|v.theme)
            .or(self.last_theme).unwrap_or_else(ThemeTokens::graphite)
    }
    // GPUI-only Windows surface: Host control, plans and receipts render above.
    // Never start Edge, Chrome or a system browser from the native workspace.
    fn reconnect_host(&mut self,cx:&mut Context<Self>) {
        if !passive_read_allowed(self.busy,self.uncertain,
            self.review.as_ref().is_some_and(Review::needs_approval)) {
            self.status="Host reconnect blocked during an approval or uncertain effect".into();
            cx.notify();return;
        }
        self.status="Checking native Host lifecycle".into();
        cx.notify();
        let supervisor=Arc::clone(&self.supervisor);
        let job=cx.background_executor().spawn(async move { supervisor.reconcile() });
        cx.spawn(async move |this,cx| {
            let result=job.await;
            let _=this.update(cx,|view,cx|{
                view.status=match result {
                    Ok(())=>"Host attached or started · refreshing owner-authorized sources".into(),
                    Err(error)=>format!("Native Host unavailable · {error}"),
                };
                view.refresh(cx);
                cx.notify();
            });
        }).detach();
    }
    /// Ask the existing Host NLCL/VLANG compiler for an inert reading, never
    /// a plan. Only one request is in flight; a late answer cannot overwrite
    /// the newest draft and the latest edit is retried after the current read.
    fn read_composer_semantics(&mut self, cx:&mut Context<Self>) {
        // Wiki search has its own shorter limit. NLCL meaning can remain
        // useful for a longer valid draft, and must never cause an effect.
        let raw=self.input.read(cx).value().to_string();
        let Some(text)=first_contact::composer_semantic_input(&raw) else {
            self.semantic_preview=None;
            self.semantic_pending=false;
            cx.notify();
            return;
        };
        let text=text.to_owned();
        let allowed=passive_read_allowed(self.busy,self.uncertain,
            self.review.as_ref().is_some_and(Review::needs_approval));
        if !allowed {
            self.semantic_preview=None;
            self.semantic_pending=false;
            cx.notify();
            return;
        }
        if self.semantic_busy {
            self.semantic_pending=true;
            return;
        }
        let epoch=self.composer_edit_epoch;
        self.semantic_busy=true;
        self.semantic_pending=false;
        let job=cx.background_executor().spawn(async move {
            control::interpret_composer(&text)
        });
        cx.spawn(async move |this,cx| {
            let result=job.await;
            let _=this.update(cx,|view,cx| {
                view.semantic_busy=false;
                let allowed=passive_read_allowed(view.busy,view.uncertain,
                    view.review.as_ref().is_some_and(Review::needs_approval));
                let current_semantic=first_contact::composer_semantic_input(
                    &view.input.read(cx).value().to_string()
                ).is_some();
                if view.composer_edit_epoch==epoch && allowed && current_semantic {
                    view.semantic_preview=result.unwrap_or(None);
                }
                // If typing changed while the network was in flight, never
                // display the old meaning. Request only the newest draft.
                let retry=view.semantic_pending && current_semantic
                    && allowed && view.composer_edit_epoch!=epoch;
                view.semantic_pending=false;
                if retry {view.read_composer_semantics(cx);}
                cx.notify();
            });
        }).detach();
    }

    /// A native input event drives the SAME Rust Wiki search as the old
    /// Edge First Contact reference. No button, provider send or Host effect.
    fn on_composer_changed(&mut self, cx: &mut Context<Self>) {
        // Native human input supersedes any still-pending phone draft review.
        // No approval or delivery happens on an input event.
        let phone_plan=self.phone_plan_edit_epoch.take().is_some();
        let composer_plan=self.composer_plan_edit_epoch.take().is_some();
        if phone_plan || composer_plan {
            self.review=None;
            self.detail.clear();
        }
        // A previous completed receipt belongs in the Host journal, not below
        // a new command draft. Preserve pending approvals and in-flight effects.
        if !self.busy && !self.review.as_ref().is_some_and(Review::needs_approval) {
            self.review=None;
            self.detail.clear();
        }
        let value=self.input.read(cx).value().to_string();
        let query=value.trim();
        self.wiki_query=if query.is_empty() {
            None
        } else if query.chars().count()<=160 && !query.chars().any(char::is_control) {
            Some(query.to_owned())
        } else { None };
        self.status=if value.trim().is_empty() {
            "First Contact ready · type to explore your Wiki".into()
        } else if self.wiki_query.is_some() {
            "Searching the existing Host Wiki as you type · no effect sent".into()
        } else if first_contact::composer_semantic_input(&value).is_some() {
            "Wiki search limited to 160 characters · longer command meaning remains read-only".into()
        } else {
            "Composer preview unavailable for this input · no effect sent".into()
        };
        cx.notify();
        // The existing Host read path is expensive and version-bracketed.
        // Search the current admitted Rust Wiki immediately on every edit,
        // and schedule at most one fresh read after the typing burst settles.
        // A superseded edit or approval must never launch a new observation.
        self.composer_edit_epoch=self.composer_edit_epoch.wrapping_add(1);
        self.semantic_preview=None;
        if self.semantic_busy {self.semantic_pending=true;}
        let edit_epoch=self.composer_edit_epoch;
        cx.spawn(async move |this,cx| {
            cx.background_executor().timer(first_contact::WIKI_COMPOSER_DEBOUNCE).await;
            // Run one bounded source refresh after the last edit. A recent
            // Host read delays the refresh instead of dropping it altogether.
            let delay=this.update(cx,|view,cx|{
                if view.composer_edit_epoch==edit_epoch {
                    view.read_composer_semantics(cx);
                }
                let allowed=passive_read_allowed(
                    view.busy,view.uncertain,
                    view.review.as_ref().is_some_and(Review::needs_approval)
                );
                first_contact::wiki_refresh_delay_on_input(
                    view.wiki_query.is_some(),view.composer_edit_epoch,edit_epoch,
                    view.last_wiki_observation_started.map(|instant|instant.elapsed()),
                    allowed)
            }).ok().flatten();
            let Some(delay)=delay else{return;};
            if !delay.is_zero() {
                cx.background_executor().timer(delay).await;
            }
            let _=this.update(cx,|view,cx|{
                let allowed=passive_read_allowed(
                    view.busy,view.uncertain,
                    view.review.as_ref().is_some_and(Review::needs_approval)
                );
                if first_contact::should_refresh_wiki_on_input(
                    view.wiki_query.is_some(),view.composer_edit_epoch,edit_epoch,
                    view.last_wiki_observation_started.map(|instant|instant.elapsed()),
                    allowed
                ) {
                    view.refresh(cx);
                }
            });
        }).detach();
    }

    /// Near-real-time, owner-authorized read-only phone viewport observation.
    /// The Host LiveSystemState owns the draft and revision; GPUI never stores
    /// a second source of truth or overwrites a concurrent native human edit.
    fn start_phone_observer(&self, cx: &mut Context<Self>) {
        cx.spawn(async move |this,cx| {
            loop {
                let allowed=match this.update(cx,|view,_|
                    passive_read_allowed(view.busy,view.uncertain,
                        view.review.as_ref().is_some_and(Review::needs_approval))) {
                    Ok(allowed)=>allowed,
                    Err(_)=>break,
                };
                if allowed {
                    let job=cx.background_executor().spawn(async {first_contact::read_phone_draft()});
                    let result=job.await;
                    if this.update(cx,|view,cx|{
                        if !passive_read_allowed(view.busy,view.uncertain,
                            view.review.as_ref().is_some_and(Review::needs_approval)) {
                            view.phone_draft=None;
                            view.phone_status="Phone state withheld during Host review".into();
                        } else {
                            let (next,status)=match result {
                                Ok(Some(draft))=>(Some(draft),"Phone live · Host source verified".to_owned()),
                                Ok(None)=>(None,"No current visible phone draft".to_owned()),
                                Err(error)=>(None,format!("Phone live view unavailable · {}",error.label())),
                            };
                            if view.phone_draft!=next || view.phone_status!=status {
                                view.phone_draft=next;
                                view.phone_status=status;
                                cx.notify();
                            }
                        }
                    }).is_err(){break;}
                } else if this.update(cx,|view,cx|{
                    if view.phone_draft.take().is_some(){
                        view.phone_status="Phone state withheld during Host review".into();
                        cx.notify();
                    }
                }).is_err(){break;}
                // At most one owner read is in flight. No hot UI polling loop.
                cx.background_executor().timer(Duration::from_millis(1000)).await;
            }
        }).detach();
    }

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
        self.presentation_epoch=self.presentation_epoch.wrapping_add(1);
        self.graph_detail.clear();
        self.graph_status="Native viewport changed · graph read requires a fresh presentation".into();
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
        let changed=self.panel!=panel;
        self.menu_open=None;
        self.panel=panel;
        if changed {
            self.presentation_epoch=self.presentation_epoch.wrapping_add(1);
            if matches!(panel,Panel::Overview|Panel::Graph) {
                self.graph_detail.clear();
                self.graph_status="Native panel changed · graph readback must be refreshed".into();
            }
        }
        self.status=format!("{} · local native view only",panel.label());
        cx.notify();
        // A panel switch is an explicit freshness request, but still cannot
        // read through a Host approval, command or uncertain receipt.
        if changed {self.refresh(cx);}
    }
    fn retry_transient_source_drift(&mut self, cx: &mut Context<Self>) {
        // One bounded retry after a torn Wiki bracket or mismatched TierFlow
        // viewport/live-binding revision. Never retry through an approval.
        if !std::mem::take(&mut self.coherence_retry_ready) {return;}
        let viewport_epoch=self.viewport_epoch;
        let source_epoch=self.source_epoch;
        let presentation_epoch=self.presentation_epoch;
        cx.spawn(async move |this,cx|{
            cx.background_executor().timer(Duration::from_millis(375)).await;
            let _=this.update(cx,|view,cx|{
                if view.viewport_epoch==viewport_epoch &&
                    view.source_epoch==source_epoch &&
                    view.presentation_epoch==presentation_epoch &&
                    passive_read_allowed(view.busy,view.uncertain,
                        view.review.as_ref().is_some_and(Review::needs_approval)) {
                    view.refresh(cx);
                }
            });
        }).detach();
    }
    // Weak entity lifetime stops the observer when its workspace closes.
    // All refreshes are GET-only. Neither polling nor readback can approve.
    fn start_observer(&self,cx:&mut Context<Self>){
        // Cold native launch is asynchronous: refresh promptly when the owned
        // Host becomes ready rather than waiting the full periodic 15 seconds.
        let supervisor=Arc::clone(&self.supervisor);
        cx.spawn(async move |this,cx|{
            for _ in 0..24 {
                cx.background_executor().timer(Duration::from_millis(500)).await;
                match supervisor.snapshot().readiness {
                    Readiness::Owned|Readiness::Attached => {
                        let _=this.update(cx,|view,cx|{
                            view.status="Native Host ready · reading canonical projections".into();
                            view.refresh(cx);cx.notify();
                        });
                        break;
                    }
                    Readiness::Failed|Readiness::Exhausted => {
                        let _=this.update(cx,|view,cx|{
                            view.status=supervisor.snapshot().label();cx.notify();
                        });
                        break;
                    }
                    _=>{}
                }
            }
        }).detach();
        cx.spawn(async move |this,cx|{
            loop{
                cx.background_executor().timer(Duration::from_secs(15)).await;
                if this.update(cx,|view,cx|{
                    // The existing 15-second observation tick is the upper
                    // bound on retry re-arming for a perpetually changing Host.
                    view.coherence_retry_ready=true;
                    // Periodic observation never queues a replacement while a
                    // slow GET is still running: doing so could starve all
                    // successful views when network latency exceeds poll time.
                    // Explicit resize/tab/owner refresh still supersedes reads.
                    if !view.read_busy && passive_read_allowed(view.busy,view.uncertain,
                        view.review.as_ref().is_some_and(Review::needs_approval)){
                        view.refresh(cx);
                    }
                }).is_err(){break}
            }
        }).detach();
    }
    fn refresh(&mut self, cx: &mut Context<Self>) {
        // Read-only observation is never a substitute for explicit owner
        // review, and does not share the in-flight command/receipt flag.
        if !passive_read_allowed(self.busy,self.uncertain,
            self.review.as_ref().is_some_and(Review::needs_approval)) {return;}
        // Refresh the last explicitly selected graph query, never invent a new
        // query or poll its source while an approval is pending.
        self.refresh_graph(cx);
        if self.read_busy {self.refresh_pending=true;return;}
        self.read_busy=true;
        self.last_wiki_observation_started=Some(Instant::now());
        self.refresh_pending=false;
        self.source_status="Checking owner-authorized Host source · previous read may be stale".into();
        self.visual_status="Checking Host visual · previous admission may be stale".into();
        cx.notify();
        let ticket=ObservationTicket{
            viewport_px:self.viewport_px,
            viewport_epoch:self.viewport_epoch,
            source_epoch:self.source_epoch,
            presentation_epoch:self.presentation_epoch
        };
        let viewport_px=ticket.viewport_px;
        // These GET-only requests can finish independently. Neither invokes
        // planning, execution, approval, or a provider transport.
        let overview_job=cx.background_executor().spawn(async {read_overview()});
        let visual_job=cx.background_executor().spawn(async move {visual::read_at(viewport_px)});
        cx.spawn(async move |this, cx| {
            let overview=overview_job.await;
            let visual=visual_job.await;
            let _=this.update(cx,|view,cx|{
                view.read_busy=false;
                // A command or pending approval supersedes every read
                // started before it. In-flight GET data is not a receipt.
                if view.busy || view.uncertain
                    || view.review.as_ref().is_some_and(Review::needs_approval) {
                    view.refresh_pending=false;
                    return;
                }
                // Compare a monotonically increasing resize identity, not
                // just width: A -> B -> A still invalidates the first A read.
                if !ticket.matches(view.viewport_px,view.viewport_epoch,view.source_epoch,view.presentation_epoch) {
                    // The last resize or Host effect invalidated both results.
                    // A queued refresh replaces this stale response entirely.
                    if std::mem::take(&mut view.refresh_pending) {view.refresh(cx);}
                    return;
                }
                if std::mem::take(&mut view.refresh_pending) {
                    // Never apply the previous source after a fresher request
                    // has already been queued, even for an unchanged width.
                    view.refresh(cx);
                    return;
                }
                match overview {
                    Ok(data) => {
                        // Any change to the observed Host snapshot, Wiki source
                        // or device count invalidates graph reads launched under
                        // the old Host presentation. The graph journal retains
                        // its independent authoritative epoch fence.
                        let changed_source=view.overview.as_ref().is_some_and(|prior|
                            prior.host_snapshot_digest!=data.host_snapshot_digest ||
                            prior.wiki_revision!=data.wiki_revision ||
                            prior.wiki_digest!=data.wiki_digest ||
                            prior.active_devices!=data.active_devices
                        );
                        view.source_status=format!(
                            "Owner-authorized Host PWA summary SHA256 {} · observed {} · Wiki revision {} · Wiki source SHA256 {} · Wiki and Host summary double-bracketed; no global transaction claimed",
                            data.host_snapshot_digest,data.observed_at,
                            data.wiki_revision,data.wiki_digest
                        );
                        let delta=wiki_read::source_delta(&json!({
                            "previous":view.overview.as_ref().map(|old|&old.wiki_source),
                            "current":&data.wiki_source
                        }));
                        let outcome=delta["outcome"].as_str();
                        if !matches!(outcome,Some("baseline"|"unchanged"|"changed")){
                            view.source_status="Rust Wiki source-delta refused · observation unavailable".into();
                            view.source_epoch=view.source_epoch.wrapping_add(1);
                            view.overview=None;view.visual=None;view.vec_view=None;
                            view.graph_detail.clear();
                            view.graph_pending=false;
                            view.graph_status="Graph withheld after Rust Wiki source-delta refusal".into();
                            cx.notify();return;
                        }
                        // Admit the Wiki high-water only after the complete
                        // source-delta preflight succeeds. A refused delta
                        // must not poison the revision fence for later valid
                        // Host readbacks.
                        if view.wiki_guard.accept(data.wiki_revision, &data.wiki_digest).is_err() {
                            view.source_status="Wiki source revision/digest conflict · observation refused".into();
                            view.source_epoch=view.source_epoch.wrapping_add(1);
                            view.overview=None;view.visual=None;view.vec_view=None;
                            view.graph_detail.clear();
                            view.graph_pending=false;
                            view.graph_status="Graph withheld after Wiki revision/digest conflict".into();
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
                        if changed_source {
                            view.source_epoch=view.source_epoch.wrapping_add(1);
                            view.graph_detail.clear();
                            view.graph_status="Host snapshot, Wiki or device source changed · graph readback invalidated".into();
                        }
                        if let Some(tokens)=data.theme {view.last_theme=Some(tokens);}
                        if view.overview.as_ref()!=Some(&data){view.overview=Some(data);}
                    }
                    Err(error) => {
                        // The Host summary/Wiki source is not currently
                        // admissible. Invalidate any independent GET started
                        // under the previous owner-observation generation.
                        view.source_epoch=view.source_epoch.wrapping_add(1);
                        view.graph_detail.clear();
                        view.graph_status=format!(
                            "Graph readback withheld after Host observation failure · {}",
                            error.label()
                        );
                        view.source_status=if error==ReadError::SnapshotChanged {
                            "Host Wiki changed during summary read · mixed snapshot refused · bounded retry queued".into()
                        } else {
                            format!("{} · Wiki is unavailable, not empty",error.label())
                        };
                        view.overview=None;view.visual=None;view.vec_view=None;
                        view.visual_status="Visual admission withheld · Host Wiki/source snapshot unavailable".into();
                        view.wiki_events.clear();view.wiki_delta.clear();
                        if error==ReadError::SnapshotChanged {
                            view.retry_transient_source_drift(cx);
                        }
                        cx.notify();return;
                    }
                }
                // First prepare the entire inert Rust visual + VEC transition.
                // Only then advance the long-lived native revision/watermark
                // guard: a failed compilation must never become admitted state.
                let wiki_revision=view.overview.as_ref().map(|data|data.wiki_revision)
                    .expect("overview accepted above");
                let prepared=visual.and_then(|candidate|visual::prepare_visual(
                    view.visual.as_ref(),view.vec_view.as_ref(),candidate,wiki_revision
                ));
                let admitted=prepared.and_then(|prepared|{
                    view.visual_guard.accept(prepared.source.clone())
                        .map_err(ReadError::from)?;
                    Ok(prepared)
                });
                match admitted {
                    Ok(next)=>{
                        let coherent=if next.aligned_wiki_bindings>0 {
                            format!("{} personal binding revisions match Wiki rev {} (content identity independently validated only)",
                                next.aligned_wiki_bindings,wiki_revision)
                        } else {
                            "no personal binding revisions available to cross-check".into()
                        };
                        view.visual_status=match next.source.as_ref() {
                            None=>"Host online · no committed visual surface · not unavailable".into(),
                            Some(source)=>format!(
                                "Committed {} · revision {} · VEC design SHA256 {} · +{} / ~{} / -{} / {} moved / {} reordered / {} binding changes · {} · {}",
                                source.surface_id,source.revision,
                                next.vec_view.as_ref().map(|v|v.design_digest.as_str())
                                    .unwrap_or("not compiled"),
                                next.vec_delta.added.len(),next.vec_delta.updated.len(),
                                next.vec_delta.removed.len(),next.vec_delta.moved.len(),
                                next.vec_delta.reordered.len(),next.vec_delta.changed_bindings.len(),
                                if next.vec_delta.repaint_required || !next.visual_delta.is_empty() {
                                    "Rust VEC changed"
                                } else {"Rust VEC unchanged"},
                                coherent
                            )
                        };
                        // Retain compiled revision, binding and design identity
                        // even if the GPU redraw itself can be skipped.
                        view.visual=next.source;
                        view.vec_view=next.vec_view;
                        view.coherence_retry_ready=true;
                    }
                    Err(e)=>{
                        view.visual_status=if e==ReadError::SnapshotChanged {
                            "TierFlow viewport admission or personal Wiki revision disagrees with this read · visual withheld".into()
                        } else {
                            format!("{} · VEC validation failed or visual unavailable; not an empty surface",e.label())
                        };
                        view.visual=None;
                        view.vec_view=None;
                        if e==ReadError::SnapshotChanged {
                            view.retry_transient_source_drift(cx);
                        }
                    }
                }
                // The development graph is independently journaled; it is
                // never called transactionally consistent with Wiki/VEC.
                // Re-query after any Host source transition, not from a
                // previous panel/device presentation.
                if view.overview.is_some() {view.refresh_graph(cx);}
                cx.notify();
            });
        }).detach();
    }
    /// Owner-initiated PC -> phone proposal using the Host's existing
    /// revision-fenced composer stage and Control plan, never a direct write.
    /// The normal Host Control screen holds the explicit approval UI.
    fn review_phone_draft(&mut self,cx:&mut Context<Self>) {
        if self.busy || self.uncertain ||
            self.review.as_ref().is_some_and(Review::needs_approval) {return;}
        let text=self.input.read(cx).value().to_string();
        if text.trim().is_empty() || text.len()>1000 || text.contains('\0') {
            self.status="Phone proposal requires a nonempty PC draft up to 1000 UTF-8 bytes".into();
            cx.notify();return;
        }
        let edit_epoch=self.composer_edit_epoch;
        self.review=None;
        self.phone_plan_edit_epoch=None;
        self.detail.clear();
        self.busy=true;
        self.status="Asking Host to stage an exact phone draft · no effect performed".into();
        cx.notify();
        let job=cx.background_executor().spawn(async move {
            control::prepare_phone_draft(&text)
        });
        cx.spawn(async move |this,cx|{
            let result=job.await;
            let _=this.update(cx,|view,cx|{
                view.busy=false;
                if view.composer_edit_epoch!=edit_epoch {
                    view.review=None;
                    view.phone_plan_edit_epoch=None;
                    view.status="PC draft changed · discarded stale phone proposal".into();
                }else{
                    match result {
                        Ok(review)=>{
                            view.detail=review.detail.clone();
                            view.review=Some(review);
                            view.phone_plan_edit_epoch=Some(edit_epoch);
                            view.panel=Panel::Control;
                            view.menu_open=None;
                            view.presentation_epoch=view.presentation_epoch.wrapping_add(1);
                            view.status="Review exact phone draft plan · no effect until separate owner approval".into();
                        }
                        Err(error)=>{
                            view.phone_plan_edit_epoch=None;
                            view.status=format!("Phone proposal unavailable · {} · nothing delivered",error.label());
                        }
                    }
                }
                cx.notify();
            });
        }).detach();
    }

    fn submit(&mut self, cx: &mut Context<Self>) {
        if self.busy || self.uncertain ||
            self.review.as_ref().is_some_and(Review::needs_approval) { return; }
        let text = self.input.read(cx).value().to_string();
        if text.trim().is_empty() { return; }
        let edit_epoch=self.composer_edit_epoch;
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
        self.phone_plan_edit_epoch=None;
        self.composer_plan_edit_epoch=Some(edit_epoch);
        self.detail.clear();
        self.busy = true;
        self.graph_detail.clear();
        self.graph_status="Host planning in progress · graph readback withheld".into();
        self.status = "Planning with canonical Host…".into();
        cx.notify();
        let work = cx.background_executor().spawn(async move { control::plan(&text) });
        cx.spawn(async move |this,cx| {
            let result=work.await;
            let _=this.update(cx,|view,cx| {
                view.busy=false;
                if view.composer_edit_epoch!=edit_epoch ||
                    view.composer_plan_edit_epoch!=Some(edit_epoch) {
                    view.composer_plan_edit_epoch=None;
                    view.review=None;
                    view.detail.clear();
                    view.status="Draft changed during planning · stale proposal discarded".into();
                    cx.notify();return;
                }
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
    /// Explicit native button -> typed Host plan -> separate visible review.
    /// No Studio effect or model/provider request on selection alone.
    fn plan_studio_action(&mut self,action:&'static str,args:Value,cx:&mut Context<Self>){
        if !passive_read_allowed(self.busy,self.uncertain,
            self.review.as_ref().is_some_and(Review::needs_approval)) {
            self.status="Finish or cancel the current Host decision before planning Studio work".into();
            cx.notify();return;
        }
        self.busy=true;
        self.status="Requesting a reviewed Studio Host plan · nothing executed".into();
        self.detail.clear();
        cx.notify();
        let task=cx.background_executor().spawn(async move{
            control::plan_studio_action(action,args)
        });
        cx.spawn(async move |this,cx| {
            let result=task.await;
            let _=this.update(cx,|view,cx|{
                view.busy=false;
                match result {
                    Ok(review)=>{
                        view.status=if review.needs_approval(){
                            "Review the exact Studio Host plan; nothing executed yet"
                        }else{"Studio action unavailable; no effect attempted"}.into();
                        view.detail=review.detail.clone();
                        view.review=Some(review);
                        view.menu_open=None;
                        view.panel=Panel::Control;
                        view.presentation_epoch=view.presentation_epoch.wrapping_add(1);
                    },
                    Err(e)=>{
                        view.status=format!("Studio planning unavailable: {} · no effect attempted",e.label());
                    }
                }
                cx.notify();
            });
        }).detach();
    }

    fn approve(&mut self,cx:&mut Context<Self>) {
        if self.busy || self.uncertain { return; }
        if self.composer_plan_edit_epoch.is_some_and(|epoch|epoch!=self.composer_edit_epoch) {
            self.composer_plan_edit_epoch=None;
            self.review=None;
            self.detail.clear();
            self.status="Edited draft · Host approval withdrawn".into();
            cx.notify();return;
        }
        if self.phone_plan_edit_epoch.is_some_and(|epoch|epoch!=self.composer_edit_epoch) {
            self.phone_plan_edit_epoch=None;
            self.review=None;
            self.detail.clear();
            self.status="Native composer changed · phone approval withdrawn".into();
            cx.notify();return;
        }
        let Some(key)=self.review.as_mut().and_then(Review::consume_approval) else {return};
        self.phone_plan_edit_epoch=None;
        self.composer_plan_edit_epoch=None;
        self.last_plan=Some(key.id().to_owned());
        self.review=None;
        self.busy=true;
        self.source_epoch=self.source_epoch.wrapping_add(1);
        // No in-flight GET from before the effect is evidence of its outcome.
        self.overview=None;
        self.visual=None;
        self.vec_view=None;
        self.graph_detail.clear();
        self.source_status="Host effect pending · source readback invalidated".into();
        self.visual_status="Host effect pending · visual admission invalidated".into();
        self.graph_status="Graph readback invalidated by Host effect".into();
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
                view.vec_view=None;
                view.source_status="Awaiting fresh authoritative Host readback".into();
                view.visual_status="Awaiting fresh Host visual admission".into();
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
        let key=self.input.read(cx).value().to_string();
        let key=key.trim().to_owned();
        if !vivim_programmability_core::development_projection::valid_query(operation,&key) {
            // A rejected query supersedes any earlier graph search. Never
            // allow a late old-query response to reappear under its label.
            self.graph_query=None;
            self.graph_pending=false;
            self.graph_status="Invalid graph query · use a source name or exact hqg1: file ID".into();
            self.graph_detail.clear();
            cx.notify();return;
        }
        let same=self.graph_query.as_ref().is_some_and(|(op,prior)|*op==operation && prior==&key);
        self.graph_query=Some((operation,key.clone()));
        if !same {self.graph_detail.clear();}
        self.request_graph(operation,key,cx);
    }
    fn refresh_graph(&mut self,cx:&mut Context<Self>){
        // Hidden graph tabs retain their last exact query but never spend
        // background GETs on unread results. Require an admitted Host
        // overview before displaying an independently sourced graph read.
        if !matches!(self.panel,Panel::Overview|Panel::Graph) ||
            self.overview.is_none(){return;}
        if let Some((operation,key))=self.graph_query.clone() {
            self.request_graph(operation,key,cx);
        }
    }
    fn request_graph(&mut self,operation:&'static str,key:String,cx:&mut Context<Self>){
        if !passive_read_allowed(self.busy,self.uncertain,
            self.review.as_ref().is_some_and(Review::needs_approval)){return;}
        if self.overview.is_none() {
            self.graph_detail.clear();
            self.graph_status="Host source not admitted · graph query withheld, not empty".into();
            cx.notify();return;
        }
        if self.graph_busy {
            self.graph_pending=true;
            return;
        }
        self.graph_busy=true;
        self.graph_status=format!("Refreshing owner-authorized graph {operation} for “{key}” · previous read may be stale");
        cx.notify();
        let source_epoch=self.source_epoch;
        let presentation_epoch=self.presentation_epoch;
        let query=(operation,key);
        let request_key=query.1.clone();
        let work=cx.background_executor().spawn(async move {read_development(operation,&request_key)});
        cx.spawn(async move |this,cx|{
            let result=work.await;
            let _=this.update(cx,|view,cx|{
                view.graph_busy=false;
                if view.busy || view.uncertain
                    || view.review.as_ref().is_some_and(Review::needs_approval) {
                    view.graph_status="Graph readback withheld during Host decision or pending approval".into();
                    view.graph_detail.clear();
                    cx.notify();return;
                }
                if view.source_epoch!=source_epoch ||
                    view.presentation_epoch!=presentation_epoch {
                    view.graph_status="Discarded graph read predating Host source, tab or device change".into();
                    view.graph_detail.clear();
                    view.refresh_graph(cx); // GET-only, and still subject to approval fences
                    cx.notify();return;
                }
                if view.graph_query.as_ref()!=Some(&query) {
                    // Manual query replaced this one during flight. Discard
                    // the previous pending marker, so the new query cannot
                    // trigger an unnecessary additional readback.
                    view.graph_pending=false;
                    view.refresh_graph(cx);
                    return;
                }
                if std::mem::take(&mut view.graph_pending) {
                    view.graph_detail.clear();
                    view.graph_status="Superseded graph request · obtaining current source".into();
                    view.refresh_graph(cx);
                    cx.notify();return;
                }
                match result {
                    Ok(data)=>match view.graph_guard.accept(&data){
                        Ok(())=>{
                            let unchanged=view.graph_detail==data.text;
                            view.graph_status=if data.result_empty {
                                format!("HQKG epoch {} · owner-authorized query returned zero indexed matches (not an empty graph claim) · SHA256 {}",
                                    data.epoch,data.source_digest)
                            } else {
                                format!(
                                    "HQKG epoch {} · query result SHA256 {} · {} · requested “{}” · {} · read only",
                                    data.epoch,data.source_digest,data.operation,data.requested_key,
                                    if unchanged {"unchanged"}else{"updated"}
                                )
                            };
                            if !unchanged {view.graph_detail=data.text;}
                        }
                        Err(_)=>{
                            view.graph_status="HQKG epoch rollback or same-epoch query conflict · refused".into();
                            view.graph_detail.clear();
                        }
                    },
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

// Conventional native PC menu chrome around the shared First Contact surface.
// It is an app menu, not another product state or another UI renderer.
impl Desktop {
    fn run_menu_intent(&mut self, intent:Intent, window:&mut Window, cx:&mut Context<Self>) {
        self.menu_open=None;
        match intent {
            Intent::Navigate(destination) => {
                let panel=match destination {
                    Destination::FirstContact=>Panel::FirstContact,
                    Destination::WikiInspector=>Panel::Wiki,
                    Destination::Devices=>Panel::Devices,
                    Destination::HostStatus=>Panel::Overview,
                    Destination::Build=>Panel::Visual,
                    Destination::KnowledgeGraph=>Panel::Graph,
                    Destination::HostDecisions=>Panel::Control,
                    Destination::DeveloperTools=>Panel::Developer,
                    Destination::Preferences=>Panel::Settings,
                    Destination::About=>Panel::About,
                };
                self.select_panel(panel,cx);
            }
            Intent::RefreshSources=>self.refresh(cx),
            Intent::FocusComposer=>{
                self.select_panel(Panel::FirstContact,cx);
                self.input.read(cx).focus_handle(cx).focus(window);
            }
            Intent::ClearComposer=>{
                self.input.update(cx,|input,cx|input.set_value("",window,cx));
                // set_value emits no Change event; avoid stale Wiki.
                self.on_composer_changed(cx);
                self.select_panel(Panel::FirstContact,cx);
            }
            Intent::CaptureWindow=>self.capture_native_window(cx),
            Intent::OpenScreenshotsFolder=>self.open_captures_folder(cx),
            Intent::SaveDiagnostics=>self.save_developer_diagnostics(cx),
            Intent::InspectSurfaces(section)=>{
                self.surface_group=Some(section);
                self.select_panel(Panel::Developer,cx);
            },
        }
        cx.notify();
    }
    // Native-only Developer action over the canonical Host/PWA source bytes.
    fn inspect_live_build(&mut self,cx:&mut Context<Self>) {
        if self.delivery_busy { return; }
        self.delivery_busy=true;
        self.delivery_status="Reading existing Host PWA build evidence…".into();
        cx.notify();
        let job=cx.background_executor().spawn(async {
            live_delivery::inspect_live_delivery()
        });
        cx.spawn(async move |this,cx| {
            let result=job.await;
            let _=this.update(cx,|view,cx| {
                view.delivery_busy=false;
                view.delivery_status=match result {
                    Ok(report)=>report.status(),
                    Err(error)=>format!("Build evidence unavailable · {}",error.label()),
                };
                cx.notify();
            });
        }).detach();
    }

    // Owner must explicitly click the PC Developer menu before ANY frame
    // capture. A standalone Host already owns Direct pairing; GPUI does not
    // create another listener, renderer, token or approval channel.
    fn start_gpui_phone_share(&mut self,window:&mut Window,cx:&mut Context<Self>){
        if self.gpui_phone_share.is_some(){return;}
        let scale=window.scale_factor();
        if !(0.75..=4.).contains(&scale) {
            self.developer_status="GPUI phone viewport unavailable at this display scale".into();
            cx.notify();return;
        }
        let session=match remote_host_transport::new_native_session(){
            Ok(value)=>value,
            Err(code)=>{
                self.developer_status=format!("GPUI owner session unavailable: {code}");
                cx.notify();return;
            }
        };
        let stop=Arc::new(AtomicBool::new(false));
        let worker_stop=Arc::clone(&stop);
        let (tx,rx)=mpsc::sync_channel::<GpuiPhoneMessage>(32);
        let (ready_tx,ready_rx)=mpsc::sync_channel::<()>(1);
        // Never stream the prior Developer screen. Start the capture worker
        // only AFTER the new inert GPUI proof surface has actually repainted.
        window.on_next_frame(move |_,_|{
            let _=ready_tx.try_send(());
        });
        std::thread::spawn(move||{
            if ready_rx.recv_timeout(Duration::from_secs(3)).is_err(){
                let _=tx.try_send(GpuiPhoneMessage::Stopped(
                    "GPUI_REMOTE_PROOF_SCREEN_NOT_PAINTED"));
                return;
            }
            let peer=match NativeHostPeer::from_current_owner(){
                Ok(peer)=>peer,
                Err(code)=>{
                    let _=tx.try_send(GpuiPhoneMessage::Stopped(code));
                    return;
                }
            };
            let mut revision=0_u64;
            let mut failure=None;
            while !worker_stop.load(Ordering::Acquire){
                // The compositor capture itself fails closed unless the
                // owning GPUI window is foreground; no background recording.
                match desktop_capture::capture_gpui_viewport_png_bytes(){
                    Ok((width,height,png))=>{
                        revision=revision.saturating_add(1);
                        match peer.publish_png(session,revision,width,height,&png){
                            Ok(())=>{
                                let _=tx.try_send(GpuiPhoneMessage::Frame{
                                    width,height,revision
                                });
                            },
                            Err(code)=>{failure=Some(code);break;}
                        }
                    },
                    Err(_)=>{
                        failure=Some("GPUI_FOREGROUND_VIEWPORT_CAPTURE_REQUIRED");
                        break;
                    }
                }
                for _ in 0..16 {
                    if worker_stop.load(Ordering::Acquire){break;}
                    match peer.next_input(){
                        Ok(Some(packet))=>{
                            let _=tx.try_send(GpuiPhoneMessage::Input(packet));
                        },
                        Ok(None)=>break,
                        Err(code)=>{failure=Some(code);break;}
                    }
                }
                if failure.is_some(){break;}
                std::thread::sleep(Duration::from_millis(450));
            }
            // The owner-only Host route invalidates private PNGs and queued
            // inputs immediately; a failed call is UNKNOWN, never retried.
            let _=peer.stop_native_share();
            let stopped=if worker_stop.load(Ordering::Acquire){
                "GPUI_OWNER_STOPPED"
            }else{failure.unwrap_or("GPUI_NATIVE_FRAME_LOOP_ENDED")};
            let _=tx.try_send(GpuiPhoneMessage::Stopped(stopped));
        });
        self.gpui_phone_share=Some(GpuiPhoneShare{
            session,scale,stop,proof:RemoteProof::new(session)
        });
        self.gpui_phone_taps=0;
        self.gpui_phone_status="Owner-initiated GPUI viewport connecting to existing Host".into();
        cx.notify();

        // A bounded UI-thread mailbox is the sole bridge from the native
        // input poller. Do NOT dispatch arbitrary phone mouse events into all
        // GPUI/Host controls: this first physical proof admits only control 42.
        cx.spawn(async move|this,cx|{
            loop{
                cx.background_executor().timer(Duration::from_millis(120)).await;
                let mut events=Vec::new();
                let mut finished=false;
                for _ in 0..32{
                    match rx.try_recv(){
                        Ok(event)=>events.push(event),
                        Err(mpsc::TryRecvError::Empty)=>break,
                        Err(mpsc::TryRecvError::Disconnected)=>{
                            finished=true;break;
                        }
                    }
                }
                if finished && !events.iter().any(|event|
                    matches!(event,GpuiPhoneMessage::Stopped(_))){
                    events.push(GpuiPhoneMessage::Stopped("GPUI_NATIVE_PEER_DISCONNECTED"));
                }
                let running=this.update(cx,|view,cx|{
                    if !view.gpui_phone_share.as_ref()
                        .is_some_and(|share|share.session==session){return false;}
                    for event in events{
                        view.process_gpui_phone_message(event,cx);
                    }
                    view.gpui_phone_share.as_ref()
                        .is_some_and(|share|share.session==session)
                }).unwrap_or(false);
                if !running{break;}
            }
        }).detach();
    }
    fn stop_gpui_phone_share(&mut self,cx:&mut Context<Self>){
        if let Some(share)=self.gpui_phone_share.take(){
            share.stop.store(true,Ordering::Release);
        }
        self.panel=Panel::Developer;
        self.gpui_phone_status="GPUI viewport stopped by owner; Host frame revocation requested".into();
        self.developer_status=self.gpui_phone_status.clone();
        cx.notify();
    }
    // Both a local GPUI click and an admitted paired phone touch call this
    // exact inert handler. No Host effect, plan, approval or provider send.
    fn native_phone_proof_tap(&mut self,cx:&mut Context<Self>){
        self.gpui_phone_taps=self.gpui_phone_taps.saturating_add(1);
        self.gpui_phone_status=format!(
            "Actual native GPUI control #{PROOF_CONTROL_ID} · {} inert taps acknowledged",
            self.gpui_phone_taps
        );
        cx.notify();
    }
    fn process_gpui_phone_message(&mut self,message:GpuiPhoneMessage,cx:&mut Context<Self>){
        match message{
            GpuiPhoneMessage::Frame{width,height,revision}=>{
                if let Some(share)=self.gpui_phone_share.as_mut(){
                    if share.proof.record_native_frame(
                        width,height,revision,share.scale
                    ).is_ok(){
                        self.gpui_phone_status=format!(
                            "GPUI pixels published to owner Host · native frame {revision}"
                        );
                    }else{
                        self.gpui_phone_status=
                            "Native viewport dimensions/revision refused".into();
                    }
                }
                cx.notify();
            }
            GpuiPhoneMessage::Input(input)=>{
                let result=self.gpui_phone_share.as_mut()
                    .map(|share|share.proof.admit(input));
                match result{
                    Some(RemoteProofResult::InertButton(receipt))
                        if receipt.control_id==PROOF_CONTROL_ID=>{
                            self.native_phone_proof_tap(cx);
                        }
                    Some(RemoteProofResult::Refused(reason))=>{
                        self.gpui_phone_status=
                            format!("Native GPUI refused unapproved remote input: {reason:?}");
                        cx.notify();
                    }
                    _=>{}
                }
            }
            GpuiPhoneMessage::Stopped(reason)=>{
                self.gpui_phone_share.take();
                self.gpui_phone_status=format!("Native GPUI phone viewport stopped: {reason}");
                self.developer_status=self.gpui_phone_status.clone();
                self.panel=Panel::Developer;
                cx.notify();
            }
        }
    }
    fn capture_native_window(&mut self,cx:&mut Context<Self>) {
        if self.capture_busy {
            self.developer_status="A native screenshot is already in progress".into();
            cx.notify();
            return;
        }
        self.capture_busy=true;
        self.developer_status="Capturing only this GPUI window…".into();
        cx.notify();
        cx.spawn(async move |this,cx| {
            // The menu closes and GPUI repaints before the capture begins.
            // Capture is always a direct user gesture, never periodic.
            cx.background_executor().timer(Duration::from_millis(230)).await;
            let job=cx.background_executor().spawn(async {
                desktop_capture::capture_window_png()
            });
            let result=job.await;
            let _=this.update(cx,|view,cx| {
                view.capture_busy=false;
                view.developer_status=match result {
                    Ok(path)=>format!("GPUI screenshot saved: {}",path.display()),
                    Err(error)=>format!("GPUI screenshot failed: {error}"),
                };
                cx.notify();
            });
        }).detach();
    }
    fn open_captures_folder(&mut self,cx:&mut Context<Self>) {
        let result=desktop_capture::screenshot_dir().and_then(|folder| {
            std::fs::create_dir_all(&folder)?;
            std::process::Command::new("explorer.exe").arg(&folder).spawn()?;
            Ok(folder)
        });
        self.developer_status=match result {
            Ok(path)=>format!("Opened local screenshot folder: {}",path.display()),
            Err(error)=>format!("Could not open local screenshot folder: {error}"),
        };
        cx.notify();
    }
    /// Bounded local diagnostic report with NO draft texts, private Wiki
    /// content, tokens, URLs or approval payloads.
    fn save_developer_diagnostics(&mut self,cx:&mut Context<Self>) {
        let host=self.supervisor.snapshot();
        let report=format!(
            concat!(
                "VIVIM GPUI native diagnostic snapshot\n\n",
                "renderer=gpui\nmenu=Developer\n",
                "host_readiness={:?}\nhost_runtime={:?}\nhost_pid={:?}\n",
                "host_recoveries={}\nsource_epoch={}\nviewport_px={}\n",
                "wiki_source_available={}\nwiki_revision={}\nwiki_pages={}\n",
                "phone_source_available={}\nvisual_source_available={}\n",
                "review_pending={}\nuncertain_effect={}\n"
            ),
            host.readiness,host.origin,host.pid,host.recoveries,
            self.source_epoch,self.viewport_px,
            self.overview.is_some(),
            self.overview.as_ref().map(|s|s.wiki_revision).unwrap_or_default(),
            self.overview.as_ref().map(|s|s.wiki_page_total).unwrap_or_default(),
            self.phone_draft.is_some(),self.vec_view.is_some(),
            self.review.as_ref().is_some_and(Review::needs_approval),self.uncertain
        );
        // Desktop Commander-derived native capability, folded into the existing
        // Developer report. Only metadata from VIVIM's own screenshot folder,
        // with no filenames, screenshot bytes, external process or MCP service.
        let screenshot_observation=desktop_capture::inspect_screenshot_directory();
        let report=match screenshot_observation {
            Ok(stats)=>format!(
                "{report}screenshot_files={}\\nscreenshot_bytes={}\\nscreenshot_scan_truncated={}\\n",
                stats.regular_files,stats.total_bytes,stats.truncated
            ),
            Err(_)=>format!("{report}screenshot_inspection=unavailable\\n"),
        };
        self.developer_status=match desktop_capture::save_diagnostics(&report) {
            Ok(path)=>format!("Private diagnostic report saved: {}",path.display()),
            Err(error)=>format!("Diagnostic report failed: {error}"),
        };
        cx.notify();
    }
    fn toggle_phone_preview(&mut self,cx:&mut Context<Self>) {
        let next=Preferences {
            show_phone_draft_in_devices:!self.preferences.show_phone_draft_in_devices
        };
        match desktop_settings::save(next) {
            Ok(())=>{
                self.preferences=next;
                self.preferences_status="Saved local desktop preference".into();
            }
            Err(_)=>{
                self.preferences_status="Preference could not be saved; original privacy setting retained".into();
            }
        }
        cx.notify();
    }
    fn surface_menu(&self, window:&Window, cx:&mut Context<Self>) -> AnyElement {
        let theme=self.native_theme();
        // The titlebar itself is ONE row. Only VIVIM and the unused space
        // are draggable; menu items remain ordinary GPUI interactive buttons.
        // Win32 handles drag, double-click maximize, Snap layouts and caption
        // clicks through GPUI's native WindowControlArea hit-testing.
        let mut bar=div().w_full().h(px(36.)).flex().items_center().gap_1()
            .bg(rgb(theme.surface)).border_b_1().border_color(rgb(theme.border))
            .child(div().h_full().px_3().flex().items_center()
                .text_sm().font_semibold()
                .window_control_area(WindowControlArea::Drag)
                .child("VIVIM"));
        for section in Section::ALL {
            bar=bar.child(Button::new(section.key()).label(section.label())
                .on_click(cx.listener(move |view,_,_,cx|{
                    view.menu_open=if view.menu_open==Some(section){None}else{Some(section)};
                    cx.notify();
                })));
        }
        #[cfg(windows)]
        {
            bar=bar
                .child(div().flex_1().h_full()
                    .window_control_area(WindowControlArea::Drag))
                .child(div().w(px(46.)).h_full().flex().items_center()
                    .justify_center().text_sm().text_color(rgb(theme.text))
                    .window_control_area(WindowControlArea::Min).child("—"))
                .child(div().w(px(46.)).h_full().flex().items_center()
                    .justify_center().text_sm().text_color(rgb(theme.text))
                    .window_control_area(WindowControlArea::Max)
                    .child(if window.is_maximized() {"❐"} else {"□"}))
                .child(div().w(px(46.)).h_full().flex().items_center()
                    .justify_center().text_sm().text_color(rgb(theme.text))
                    .window_control_area(WindowControlArea::Close).child("×"));
        }
        #[cfg(not(windows))]
        { let _=window; }
        let mut chrome=div().w_full().flex().flex_col().child(bar);
        if let Some(section)=self.menu_open {
            let mut entries=div().flex().flex_col().gap_1().p_2()
                .bg(rgb(theme.raised)).border_1().border_color(rgb(theme.border))
                .rounded(px(8.));
            for item in desktop_menu::entries(section) {
                let intent=item.intent;
                entries=entries.child(Button::new(item.key).label(item.label)
                    .on_click(cx.listener(move |view,_,window,cx|{
                        view.run_menu_intent(intent,window,cx);
                    })));
            }
            chrome=chrome.child(div().flex().justify_start()
                .child(div().w(px(270.)).child(entries)));
        }
        chrome.into_any_element()
    }
}


fn native_source_inventory(group:Section)->AnyElement {
    // Render source metadata only. No second web view or operational authority.
    // Isolated from Desktop::render so even a very large donor catalog does not
    // enlarge the native Windows event/render frame when First Contact is shown.
    let all=group==Section::Developer;
    let rows=surface_registry::SURFACES.iter().filter(|row|
        all || row.placement.label()==group.label()
    ).collect::<Vec<_>>();
    let donors=surface_registry::DONOR_SURFACES.iter().filter(|row|
        all || row.target_menu.label()==group.label()
    ).collect::<Vec<_>>();
    let mut panel=div().flex().flex_col().gap_1()
        .child(div().text_lg().child(format!(
            "UI consolidation · {} · {} source entries",
            if all {"All menu groups"}else{group.label()},rows.len()
        )))
        .child(div().text_sm().child(
            "One GPUI local window + one shared phone PWA. Legacy pages are migration inputs, NOT functioning native features until ported. Retired references never launch."
        ));
    for row in rows {
        panel=panel.child(div().p_1().child(format!(
            "{} · {} → {} · {}",
            row.id,row.source,row.placement.label(),row.disposition.label()
        )));
    }
    panel=panel
        .child(div().text_lg().child(format!(
            "Donor-only reference pages · {}",donors.len()
        )))
        .child(div().text_sm().child(
            "Donor repositories are source material. No donor browser UI is mounted or relaunched."
        ));
    for row in donors {
        panel=panel.child(div().p_1().child(format!(
            "{} · {} → {} · donor-only",
            row.repo,row.source,row.target_menu.label()
        )));
    }
    panel.into_any_element()
}

impl Render for Desktop {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme=self.native_theme();
        // The remote acceptance screen is itself GPUI-rendered on the PC.
        // The phone receives exactly this native pixel buffer and only the
        // inert proof div below may be activated by a remote touch.
        if self.gpui_phone_share.is_some(){
            let bounds=PROOF_LOGICAL_BOUNDS;
            return div().relative().size_full()
                .bg(rgb(theme.background)).text_color(rgb(theme.text))
                .child(div().absolute()
                    .left(px(bounds.x as f32)).top(px(bounds.y as f32))
                    .w(px(bounds.width as f32)).h(px(bounds.height as f32))
                    .flex().items_center().justify_center()
                    .bg(rgb(theme.raised)).border_1()
                    .border_color(rgb(theme.border)).rounded(px(10.))
                    .child("Tap this real GPUI control from Android")
                    .on_click(cx.listener(|view,_,_,cx|{
                        view.native_phone_proof_tap(cx);
                    })))
                .child(div().absolute().left(px(16.)).top(px(140.))
                    .text_sm().child(self.gpui_phone_status.clone()))
                .child(div().absolute().right(px(16.)).bottom(px(16.))
                    .child(Button::new("native-phone-stop")
                        .label("Stop phone viewport · PC owner only")
                        .on_click(cx.listener(|view,_,_,cx|{
                            view.stop_gpui_phone_share(cx);
                        }))));
        }
        // The integrated GPUI caption is the sole Windows application chrome,
        // not a second PWA or a menu below another Windows titlebar.
        let menu=self.surface_menu(window,cx);
        // Native PC settings and advanced tools live *outside* the shared PWA
        // canvas. Neither can become an alternate home or effect authority.
        if matches!(self.panel, Panel::Settings|Panel::Devices|Panel::Developer|Panel::About) {
            let mut page=div().flex().flex_col().gap_3()
                .child(div().text_xl().child(self.panel.label()));
            match self.panel {
                Panel::Settings=>{
                    page=page
                        .child(div().text_lg().child("General"))
                        .child("Startup: First Contact (the canonical PWA-style home)")
                        .child("Renderer: native GPUI · no Edge, Chrome or WebView")
                        .child(div().text_lg().child("Appearance"))
                        .child(if self.overview.as_ref().and_then(|v|v.theme).is_some() {
                            format!("Theme: Host-owned palette revision {} · same tokens as phone PWA",theme.revision)
                        } else if self.last_theme.is_some() {
                            format!("Theme: last observed Host palette rev {} · current source pending",theme.revision)
                        } else {
                            "Theme: native graphite fallback · Host source not admitted".to_owned()
                        })
                        .child(div().text_lg().child("Privacy"))
                        .child("Phone draft contents are hidden in the PC Devices tool by default.")
                        .child(Button::new("settings-phone-preview")
                            .label(if self.preferences.show_phone_draft_in_devices {
                                "Hide phone draft text in Devices"
                            } else {
                                "Show phone draft text in Devices"
                            }).on_click(cx.listener(|v,_,_,cx|v.toggle_phone_preview(cx))))
                        .child(div().text_sm().child(self.preferences_status.clone()))
                        .child(div().text_lg().child("Connection"))
                        .child("Host owns commands, grants, approvals, effects and receipts.")
                        .child(Button::new("settings-reconnect")
                            .label("Reconnect Host")
                            .on_click(cx.listener(|v,_,_,cx|v.reconnect_host(cx))));
                }
                Panel::Devices=>{
                    page=page
                        .child(div().text_lg().child("Phone live composer"))
                        .child(self.phone_status.clone())
                        .child(div().text_sm().child(
                            "Edit this PC draft before requesting a Host plan. This never sends while typing and needs a separate owner approval."
                        ))
                        .child(Input::new(&self.input))
                        .child(Button::new("devices-propose-pc-draft")
                            .label("Propose PC draft on phone · review required")
                            .on_click(cx.listener(|v,_,_,cx|v.review_phone_draft(cx))));
                    if let Some(phone)=&self.phone_draft {
                        page=page.child(format!(
                            "Host revision {} · source revision {} · {}",
                            phone.system_revision,phone.source_revision,
                            if phone.composing {"composing"}else{"current"}
                        ));
                        if self.preferences.show_phone_draft_in_devices {
                            page=page.child(div().p_3().bg(rgb(theme.raised))
                                .child(phone.text.clone()));
                        } else {
                            page=page.child("Phone draft text hidden · enable it in Settings.");
                        }
                    }
                }
                Panel::Developer=>{
                    let host=self.supervisor.snapshot();
                    page=page
                        .child("Developer utilities are PC-only and never alter the mobile PWA.")
                        .child(div().text_lg().child("Native GPUI → paired Android viewport"))
                        .child("Explicit owner opt-in · only this foreground GPUI screen is mirrored. Phone touch can acknowledge inert native control #42 only; Host effects remain forbidden.")
                        .child(Button::new("dev-start-gpui-phone")
                            .label("Start native GPUI phone viewport")
                            .on_click(cx.listener(|v,_,window,cx|{
                                v.start_gpui_phone_share(window,cx);
                            })))
                        .child(div().text_sm().child(self.gpui_phone_status.clone()))
                        .child(div().text_lg().child("Capture and evidence"))
                        .child(Button::new("dev-capture").label(
                            if self.capture_busy {"Capturing GPUI window…"} else {"Capture GPUI screenshot"}
                        ).on_click(cx.listener(|v,_,_,cx|v.capture_native_window(cx))))
                        .child(Button::new("dev-open-folder").label("Open screenshots folder")
                            .on_click(cx.listener(|v,_,_,cx|v.open_captures_folder(cx))))
                        .child(Button::new("dev-save-report").label("Save diagnostic report")
                            .on_click(cx.listener(|v,_,_,cx|v.save_developer_diagnostics(cx))))
                        .child(div().text_sm().child(self.developer_status.clone()))
                        .child(div().text_lg().child("PWA delivery evidence"))
                        .child(Button::new("dev-live-build").label(
                            if self.delivery_busy {"Checking live PWA build…"} else {"Verify live PWA module"}
                        ).on_click(cx.listener(|v,_,_,cx|v.inspect_live_build(cx))))
                        .child(div().text_sm().child(self.delivery_status.clone()))
                        .child(div().text_lg().child("Live diagnostic readback"))
                        .child(format!("Host {:?} · runtime {:?} · PID {:?}",host.readiness,host.origin,host.pid))
                        .child(format!("Wiki source {} · revision {}",if self.overview.is_some() {"available"} else {"unavailable"},self.overview.as_ref().map(|s|s.wiki_revision).unwrap_or_default()))
                        .child(format!("VEC source {} · viewport {}px",if self.vec_view.is_some() {"available"} else {"unavailable"},self.viewport_px))
                        .child(format!("Phone current source {}",if self.phone_draft.is_some() {"available"} else {"unavailable"}))
                        .child(Button::new("dev-refresh").label("Refresh Host and Wiki")
                            .on_click(cx.listener(|v,_,_,cx|v.refresh(cx))))
                        .child(Button::new("dev-inspect-wiki").label("Wiki inspector")
                            .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Wiki,cx))))
                        .child(Button::new("dev-inspect-vec").label("VEC visual inspector")
                            .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Visual,cx))))
                        .child(Button::new("dev-inspect-graph").label("Knowledge graph")
                            .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Graph,cx))))
                        .child(Button::new("dev-inspect-devices").label("Phone observations")
                            .on_click(cx.listener(|v,_,_,cx|v.select_panel(Panel::Devices,cx))))
                        .child(Button::new("dev-surface-inventory").label("Inspect all UI source surfaces")
                            .on_click(cx.listener(|v,_,_,cx|{
                                v.surface_group=Some(Section::Developer);cx.notify();
                            })));
                    // Preserve valuable Studio readback without opening its
                    // retired browser dashboard or introducing a second AI
                    // controller. The existing Host PWA summary is the source.
                    page=page.child(div().text_lg().child("Studio AI delivery · verified history"));
                    if let Some(activity)=self.overview.as_ref()
                        .and_then(|o|o.studio_activity.as_ref()) {
                        page=page.child(format!(
                            "Historical Studio source rev {} · {} outcomes · {} displayed",
                            activity.revision,activity.total,activity.rows.len()
                        ));
                        for item in &activity.rows {
                            page=page.child(div().text_sm().child(item.clone()));
                        }
                    } else {
                        page=page.child(div().text_sm().child(
                            "Studio outcome source unavailable or not verified · no delivery inferred"
                        ));
                    }
                    // Merge the genuinely useful Studio capture and Drive
                    // state into existing native PC tools. This is an inert,
                    // owner-authorized Host projection; Studio still owns all
                    // recording/Drive actions until explicitly ported.
                    page=page.child(div().text_lg().child("Studio capture and Drive · owner-approved actions"));
                    if let Some(operations)=self.overview.as_ref()
                        .and_then(|o|o.studio_operations.as_ref()) {
                        page=page
                            .child(div().text_sm().child(operations.capture.clone()))
                            .child(div().text_sm().child(operations.browser.clone()))
                            .child(div().text_sm().child(operations.drive.clone()));
                        for job in &operations.jobs {
                            page=page.child(div().text_sm().child(job.clone()));
                        }
                        page=page.child(div().text_sm().child(
                            "Choose a capability below to create a Host plan. A separate approval is required before any Studio effect."
                        ));
                        if operations.capture_running {
                            page=page.child(Button::new("studio-stop-capture")
                                .label("Stop active Studio capture · review")
                                .on_click(cx.listener(|v,_,_,cx|{
                                    v.plan_studio_action("studio.capture.stop",json!({}),cx)
                                })));
                        }
                        if operations.capture_ready {
                            for (row,target) in operations.targets.iter().enumerate() {
                                let id=target.id.clone();
                                let title=format!("Start Studio capture · {} ({}) · review",
                                    target.host,&id[..id.len().min(10)]);
                                page=page.child(Button::new(("studio-start",row))
                                    .label(title)
                                    .on_click(cx.listener(move |v,_,_,cx|{
                                        v.plan_studio_action("studio.capture.start",json!({"target":id}),cx)
                                    })));
                            }
                        }
                        for (row,site) in operations.sites.iter().enumerate() {
                            let site_id=site.clone();
                            page=page.child(Button::new(("studio-dry-run",row))
                                .label(format!("Preview Drive · {} · dry run only",site_id))
                                .on_click(cx.listener(move |v,_,_,cx|{
                                    v.plan_studio_action("studio.drive.dry_run",json!({"site":site_id}),cx)
                                })));
                        }
                        for (row,id) in operations.cancelable_jobs.iter().enumerate() {
                            let job_id=id.clone();
                            page=page.child(Button::new(("studio-cancel",row))
                                .label(format!("Request Drive cancellation · {} · review",job_id))
                                .on_click(cx.listener(move |v,_,_,cx|{
                                    v.plan_studio_action("studio.drive.cancel",json!({"job_id":job_id}),cx)
                                })));
                        }
                    }else{
                        page=page.child(div().text_sm().child(
                            "Studio operations source unavailable · no recording or Drive state inferred."
                        ));
                    }
                    if let Some(group)=self.surface_group {
                        // Box inventory rendering outside the massive main
                        // GPUI render frame. Windows' default stack is small.
                        page=page.child(native_source_inventory(group));
                    }
                }
                Panel::About=>{
                    page=page
                        .child("VIVIM · Native Windows GPUI")
                        .child("One canonical product surface, shared with the phone PWA.")
                        .child("TierFlow capabilities migrate into the Rust/VEC/GPUI runtime.")
                        .child("The PC menu and settings are Windows-specific chrome, not a second product.");
                }
                _=>{}
            }
            return div().size_full().bg(rgb(theme.background)).text_color(rgb(theme.text))
                .flex().flex_col()
                .child(menu)
                .child(div().id("native-preferences-and-tools").flex_1().min_h_0().overflow_y_scroll()
                    .child(div().p_5().child(page)));
        }
        // ONE canonical First Contact surface. The former five-panel GPUI
        // diagnostics remain internal source, never a competing product home.
        if self.panel==Panel::FirstContact {
            // First Contact matches the proven Direct PWA empty-state contract:
            // a blank graphite canvas, one bottom composer, no diagnostics.
            // Host supervision, phone observation and Wiki reads still run,
            // but never create visible panels before the owner begins typing.
            // The fallback menu must touch the application viewport's top edge.
            // Padding belongs to the First Contact canvas below the app menu.
            let surface=div().size_full()
                .bg(rgb(theme.background)).text_color(rgb(theme.text))
                .flex().flex_col().child(menu);
            let mut canvas=div().flex_1().min_h_0()
                .flex().flex_col().p_4().gap_2()
                .child(div().flex_1());

            // AutoWiki is contextual, just like the Direct PWA. Empty text
            // must not render a Wiki header, revision log or error panel.
            if let Some(query)=&self.wiki_query {
                let mut wiki=div().flex().flex_col().gap_2().p_3()
                    .bg(rgb(theme.surface)).rounded(px(14.))
                    .border_1().border_color(rgb(theme.border));
                if let Some(data)=&self.overview {
                    let read=wiki_read::WikiRead{
                        revision:data.wiki_revision,digest:data.wiki_digest.clone(),
                        pages_total:data.wiki_page_total,pages:data.wiki_content.clone(),
                        captures:data.wiki_captures.clone(),
                        search_index:data.wiki_search_index.clone(),
                        indexed_pages:data.wiki_indexed_pages,
                        index_truncated:data.wiki_index_truncated,
                    };
                    if let Some(progress)=&data.oracle_progress {
                        wiki=wiki.child(div().text_sm().child(format!(
                            "Oracle · {} reported claims · {}/{} observed discovery passes · read-only",
                            progress.claims,progress.complete_passes,progress.observed_passes
                        )));
                    }
                    if let Some(found)=wiki_read::search_view(&read,query,24) {
                        wiki=wiki.child(div().text_sm().child(format!(
                            "AutoWiki · {} matches · revision {}",
                            found.matches,found.revision
                        )));
                        for hit in &found.hits {
                            wiki=wiki.child(div().p_2()
                                .border_t_1().border_color(rgb(theme.border))
                                .child(format!("{}{}",hit.page,
                                    hit.section.as_ref().map(|s|format!(" / {s}")).unwrap_or_default()))
                                .child(div().text_sm().child(hit.excerpt.clone())));
                        }
                        if found.hits.is_empty() {
                            wiki=wiki.child(div().text_sm().child("No matching Wiki sections"));
                        }
                    } else {
                        wiki=wiki.child(div().text_sm().child("Wiki search unavailable for this query"));
                    }
                } else {
                    wiki=wiki.child(div().text_sm().child(
                        "AutoWiki source unavailable · no cached results shown"
                    ));
                }
                canvas=canvas.child(div().w_full().flex().justify_center()
                    .child(div().id("first-contact-wiki").w_full().max_w(px(790.)).max_h(px(350.))
                        .overflow_y_scroll().child(wiki)));
            }

            // VLANG/NLCL meaning is a contextual, inert preview. The Host's
            // existing compiler owns the interpretation, and user typing can
            // never authorize a plan or execute an effect.
            if let Some(meaning)=&self.semantic_preview {
                canvas=canvas.child(div().w_full().flex().justify_center()
                    .child(div().w_full().max_w(px(760.)).p_2()
                        .bg(rgb(theme.accent_soft)).rounded(px(12.))
                        .child(div().text_sm().child(meaning.hint.clone()))));
            }

            // First Contact's command review reuses Host planning and approval.
            // Neither typing nor a semantic preview performs any effect.
            let draft_present=!self.input.read(cx).value().trim().is_empty();
            if draft_present || self.review.is_some() || !self.detail.is_empty() ||
                self.busy || self.uncertain {
                let mut command=div().w_full().max_w(px(760.))
                    .flex().flex_col().gap_2();
                if self.busy {
                    command=command.child(div().text_sm()
                        .child("Waiting for canonical Host · no effect from typing"));
                } else if draft_present && !self.uncertain && self.review.is_none() {
                    command=command.child(Button::new("first-contact-review-command")
                        .label("Review command · approval before execution")
                        .on_click(cx.listener(|view,_,_,cx|view.submit(cx))));
                }
                if let Some(review)=&self.review {
                    command=command.child(div().text_sm().child(self.status.clone()))
                        .child(div().id("first-contact-command-review").max_h(px(156.)).overflow_y_scroll()
                            .text_sm().child(review.detail.clone()));
                    if review.needs_approval() && !self.busy && !self.uncertain {
                        command=command.child(div().flex().gap_2()
                            .child(Button::new("first-contact-approve-plan").primary()
                                .label("Approve exact displayed Host plan")
                                .on_click(cx.listener(|view,_,_,cx|view.approve(cx))))
                            .child(Button::new("first-contact-cancel-plan")
                                .label("Cancel · no effect")
                                .on_click(cx.listener(|view,_,_,cx|{
                                    view.review=None;
                                    view.composer_plan_edit_epoch=None;
                                    view.phone_plan_edit_epoch=None;
                                    view.detail.clear();
                                    view.status="Cancelled locally · no execution sent".into();
                                    cx.notify();
                                }))));
                    }
                } else if !self.detail.is_empty() {
                    command=command.child(div().text_sm().child(self.status.clone()))
                        .child(div().id("first-contact-command-receipt").max_h(px(156.)).overflow_y_scroll()
                            .text_sm().child(self.detail.clone()));
                } else if self.uncertain {
                    command=command.child(div().text_sm()
                        .child("Outcome uncertain · inspect original Host plan; never retry"));
                }
                canvas=canvas.child(div().w_full().flex().justify_center().child(command));
            }
            // No second composer, browser frame or product dashboard.
            return surface.child(canvas.child(div().w_full().flex().justify_center()
                .child(div().w_full().max_w(px(760.)).p_2()
                    .bg(rgb(theme.raised)).rounded(px(22.))
                    .border_1().border_color(rgb(theme.border))
                    .child(Input::new(&self.input).appearance(false).w_full()))));
        }
        let mut body = div().flex().flex_col().gap_3()
            .child(div().text_sm().child(self.source_status.clone()));
        if let Some(data) = &self.overview {
            body = body.child(format!("Host observed: {}", data.observed_at))
                .child(format!("Active devices: {}", data.active_devices));
            if matches!(self.panel, Panel::Overview|Panel::Wiki) {
            if let Some(progress)=&data.oracle_progress {
                body=body.child(div().text_lg().child("Oracle · Host corpus"))
                    .child(div().text_sm().child(format!(
                        "{} reported claims · {} observations · {} conflicts · {}/{} observed passes. Personal statements remain owner-private.",
                        progress.claims,progress.observations,progress.contradictions,
                        progress.complete_passes,progress.observed_passes
                    )));
            }
            body=body.child(div().text_lg().child(format!("Wiki · revision {}", data.wiki_revision)));
            body=body.child(div().text_sm().child(self.wiki_delta.clone()));
            for item in &self.wiki_events {
                body=body.child(div().text_sm().child(item.clone()));
            }
            body=body.child(div().text_sm().child(format!(
                "{} source-backed Wiki pages · {} displayed",data.wiki_page_total,data.wiki_content.len()
            )));
            if data.wiki_page_total==0 {
                body=body.child(div().text_sm().child(
                    "Owner-authorized Wiki source is empty at this revision"
                ));
            }
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
                        body=body.child(div().p_2().bg(rgb(theme.raised))
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
                    .bg(rgb(theme.raised))
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
            .child(Button::new("host-reconnect").label("Reconnect Host").on_click(cx.listener(|v,_,_,cx|v.reconnect_host(cx))))
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
                    v.review=None;v.phone_plan_edit_epoch=None;
                    v.status="Cancelled locally · no execution sent".into();
                    v.refresh(cx);cx.notify();
                })));
        }
        controls=controls.child(Button::new("inspect").label("Inspect Host plan ID · read only")
            .on_click(cx.listener(|v,_,_,cx|v.inspect(cx))));
        if matches!(self.panel,Panel::Overview|Panel::Graph){
            body=body.child(div().text_lg().child(
                "Development graph · independently versioned HQKG source"
            )).child(self.graph_status.clone());
            if !self.graph_detail.is_empty(){
                // Render the actual, bounded Rust graph projection line by line.
                // No synthetic nodes, schema remapping or DOM/HTML interpretation.
                let mut lines=div().flex().flex_col().gap_1().p_3().bg(rgb(theme.raised));
                for line in self.graph_detail.lines().take(120) {
                    lines=lines.child(div().text_sm().child(line.to_owned()));
                }
                if self.graph_detail.lines().count()>120 {
                    lines=lines.child(div().text_sm().child(
                        "Additional graph projection lines omitted by the native viewport"
                    ));
                }
                body=body.child(lines);
            }
        }
        if matches!(self.panel,Panel::Overview|Panel::Control) && !self.detail.is_empty() {
            body=body.child(div().text_lg().child("Canonical Host response"))
                .child(div().p_3().bg(rgb(theme.raised)).child(self.detail.clone()));
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
        // Diagnostic navigation lives exclusively in the compact surface menu.
        div().size_full().bg(rgb(theme.background)).text_color(rgb(theme.text))
            .flex().flex_col().p_5().gap_3()
            .child(menu)
            .child(self.supervisor.snapshot().label())
            .child(self.status.clone())
            .child(Input::new(&self.input))
            .child(actions)
            .child(div().id("host-projection").flex_1().min_h_0().overflow_y_scroll().child(body))
    }
}
fn main() {
    // Cold-start the authoritative Host on a non-UI thread, without Tauri.
    let supervisor = Arc::new(HostSupervisor::new());
    let worker = Arc::clone(&supervisor);
    std::thread::spawn(move || worker.run());
    Application::new().run(move |cx: &mut App| {
        gpui_component::init(cx);
        let bounds = Bounds::centered(None, size(px(1000.), px(740.)), cx);
        cx.open_window(vivim_window_options(bounds),
            move |window, cx| {
                let supervisor = Arc::clone(&supervisor);
                let input=cx.new(|cx| InputState::new(window,cx).placeholder("Ask anything…"));
                // Capture the viewport value, not the mutable Window borrowed again by Root.
                let initial_viewport_px=viewport_for_window(window);
                let view=cx.new(move |cx| {
                    let mut view=Desktop {supervisor, input,panel:Panel::FirstContact,menu_open:None,surface_group:None,
                        preferences:desktop_settings::load().unwrap_or_default(),
                        preferences_status:"Windows-only presentation preference".into(),
                        developer_status:"No developer action requested".into(),
                        delivery_status:"Not yet verified on this PC · check in Developer".into(),
                        delivery_busy:false,capture_busy:false,
                        gpui_phone_share:None,
                        gpui_phone_status:"Native phone viewport not started · owner opt-in required".into(),
                        gpui_phone_taps:0,
                        viewport_px:initial_viewport_px,
                        viewport_epoch:0,source_epoch:0,presentation_epoch:0,read_busy:false,refresh_pending:false,
                        coherence_retry_ready:true,
                        source_status:"Host source not yet observed".into(),
                        wiki_query:None,composer_edit_epoch:0,
                        last_wiki_observation_started:None,
                        semantic_preview:None,semantic_busy:false,semantic_pending:false,
                        phone_plan_edit_epoch:None,composer_plan_edit_epoch:None,
                        _input_subscription:None,phone_draft:None,
                        phone_status:"Waiting for owner-authorized phone observation".into(),
                        status:"First Contact ready · type to explore your Wiki".into(),overview:None,last_theme:None,visual:None,vec_view:None,visual_status:"Not yet observed".into(),visual_guard:RevisionGuard::default(),wiki_guard:WikiRevisionGuard::default(),wiki_delta:"Not yet observed".into(),wiki_events:Vec::new(),detail:String::new(),
                        review:None,last_plan:None,busy:false,uncertain:false,
                        graph_detail:String::new(),graph_status:"Graph not yet queried".into(),graph_busy:false,graph_pending:false,
                        graph_query:None,graph_guard:DevelopmentRevisionGuard::default()};
                    view.refresh(cx);view.start_observer(cx);view.start_phone_observer(cx);view
                });
                // Register after construction so the Window reborrow is never moved into
                // the Desktop entity's 'move' initializer closure.
                view.update(cx,|desktop,cx|{
                    let input=desktop.input.clone();
                    desktop._input_subscription=Some(cx.subscribe(&input,
                        |view,_,event:&InputEvent,cx|{
                            if matches!(event,InputEvent::Change){
                                view.on_composer_changed(cx);
                            }
                        }));
                    cx.observe_window_bounds(window, |view: &mut Desktop,window,cx|{
                        // A resize or DPI transition invalidates client-pixel
                        // provenance. Explicitly restart native sharing only
                        // with fresh owner opt-in and matching new coordinates.
                        if view.gpui_phone_share.is_some(){
                            view.stop_gpui_phone_share(cx);
                        }
                        view.set_viewport(viewport_for_window(window),cx);
                    }).detach();
                });
                cx.new(|cx|Root::new(view,window,cx))
            }).expect("Unable to open VIVIM GPUI window");
        cx.activate(true);
    });
}

#[cfg(test)]
mod viewport_tests {
    use super::viewport_for_width;
    #[cfg(windows)]
    #[test]
    fn integrated_windows_titlebar_uses_native_hit_test_regions() {
        let options=super::vivim_window_options(gpui::Bounds {
            origin:gpui::point(gpui::px(0.),gpui::px(0.)),
            size:gpui::size(gpui::px(900.),gpui::px(600.)),
        });
        let titlebar=options.titlebar.expect("integrated titlebar required");
        assert!(titlebar.appears_transparent);
        assert!(titlebar.title.is_some());
        assert!(options.is_movable);
        assert!(options.is_minimizable);
        assert!(options.is_resizable);
    }
    #[test]
    fn real_window_width_is_bounded_and_not_a_preset() {
        assert_eq!(viewport_for_width(1000.),960);
        assert_eq!(viewport_for_width(513.),473);
        assert_eq!(viewport_for_width(120.),240);
        assert_eq!(viewport_for_width(5000.),3840);
        assert_eq!(viewport_for_width(f32::NAN),1000);
    }
}
