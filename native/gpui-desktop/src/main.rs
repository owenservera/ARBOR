use gpui::{App, Application, Bounds, Context, Entity, Window, WindowBounds, WindowOptions, div, prelude::*, px, rgb, size};
use gpui_component::{Root, input::{Input, InputState}, button::{Button, ButtonVariants}};
use vivim_gpui_desktop::{Overview, read_overview, control::{self, Review}};

struct Desktop {
    input: Entity<InputState>,
    status: String,
    overview: Option<Overview>,
    detail: String,
    review: Option<Review>,
    last_plan: Option<String>,
    busy: bool,
    // An uncertain execution must be inspected, never retried by this session.
    uncertain: bool,
}
impl Desktop {
    fn refresh(&mut self, cx: &mut Context<Self>) {
        if self.busy { return; }
        self.busy = true;
        self.overview = None;
        self.status = "Reading canonical Host…".into();
        cx.notify();
        let work = cx.background_executor().spawn(async move { read_overview() });
        cx.spawn(async move |this, cx| {
            let result = work.await;
            let _ = this.update(cx, |view, cx| {
                view.busy = false;
                match result {
                    Ok(data) => { view.status = "Host overview · source-backed".into(); view.overview = Some(data); }
                    Err(error) => { view.status = error.label().into(); view.overview = None; view.review = None; }
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
        let mut controls=div().flex().flex_wrap().gap_2()
            .child(Button::new("refresh").label("Refresh Host").on_click(cx.listener(|v,_,_,cx|v.refresh(cx))))
            .child(Button::new("plan").label("Review command").on_click(cx.listener(|v,_,_,cx|v.submit(cx))));
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
                    let mut view=Desktop {input,status:"Not yet observed".into(),overview:None,detail:String::new(),
                        review:None,last_plan:None,busy:false,uncertain:false};
                    view.refresh(cx);view
                });
                cx.new(|cx|Root::new(view,window,cx))
            }).expect("Unable to open VIVIM GPUI window");
        cx.activate(true);
    });
}
