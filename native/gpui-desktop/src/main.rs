use gpui::{App, Application, Bounds, Context, Window, WindowBounds, WindowOptions, div, prelude::*, px, rgb, size};
use vivim_gpui_desktop::{Overview, read_overview};

struct Desktop {
    status: String,
    overview: Option<Overview>,
    busy: bool,
}
impl Desktop {
    fn refresh(&mut self, cx: &mut Context<Self>) {
        if self.busy { return; }
        self.busy = true;
        self.overview = None;
        self.status = "Reading canonical Host…".into();
        cx.notify();
        // Keep network calls off the render thread. No detached OS child or writer.
        let work = cx.background_executor().spawn(async move { read_overview() });
        cx.spawn(async move |this, cx| {
            let result = work.await;
            let _ = this.update(cx, |view, cx| {
                view.busy = false;
                match result {
                    Ok(data) => {
                        view.status = "Source-backed · read-only".into();
                        view.overview = Some(data);
                    }
                    Err(error) => {
                        view.status = error.label().into();
                        view.overview = None;
                    }
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
            for page in &data.wiki_pages {
                body = body.child(div().p_1().child(page.clone()));
            }
            body = body.child(div().text_lg().child("Recent Host decisions"));
            for row in &data.recent { body = body.child(div().p_1().child(row.clone())); }
        }
        div().size_full().bg(rgb(0x151b24)).text_color(rgb(0xe6edf3))
            .flex().flex_col().p_5().gap_3()
            .child(div().text_xl().child("VIVIM · Native workspace"))
            .child(self.status.clone())
            .child(div().id("refresh").p_2().rounded_md()
                .bg(rgb(0x304964)).cursor_pointer()
                .child(if self.busy { "Reading…" } else { "Refresh Host" })
                .on_click(cx.listener(|view, _, _, cx| view.refresh(cx))))
            .child(div().id("host-projection").flex_1().min_h_0().overflow_y_scroll().child(body))
    }
}

fn main() {
    Application::new().run(|cx: &mut App| {
        let bounds = Bounds::centered(None, size(px(900.), px(680.)), cx);
        cx.open_window(WindowOptions { window_bounds: Some(WindowBounds::Windowed(bounds)), ..Default::default() },
            |_, cx| cx.new(|cx| {
                let mut view = Desktop { status: "Not yet observed".into(), overview: None, busy: false };
                view.refresh(cx);
                view
            })).expect("Unable to open VIVIM GPUI window");
        cx.activate(true);
    });
}
