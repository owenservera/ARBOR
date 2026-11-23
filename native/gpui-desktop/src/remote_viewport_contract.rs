//! Inert, renderer-owned phone viewport input fencing.
//!
//! This is a transport-neutral contract, NOT a renderer or Host dispatcher.
//! Only the owning GPUI session may resolve a pointer to a native control.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Viewport {
    pub width: u32,
    pub height: u32,
    pub revision: u64,
    pub session: u128,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Rect { pub x: u32, pub y: u32, pub width: u32, pub height: u32 }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Control { pub id: u64, pub bounds: Rect }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Touch {
    pub session: u128,
    pub revision: u64,
    pub sequence: u64,
    pub x: u32,
    pub y: u32,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Refusal { WrongSession, StaleFrame, Replay, OutsideViewport, NoControl }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct InertAck { pub control_id: u64, pub sequence: u64, pub revision: u64 }
/// The owner retains this cursor across reconnects. No effect dispatch occurs.
pub struct InputFence { last_sequence: Option<u64> }
impl InputFence {
    pub const fn new() -> Self { Self { last_sequence: None } }
    pub fn acknowledge(&mut self, viewport: Viewport, controls: &[Control], touch: Touch)
        -> Result<InertAck, Refusal> {
        if touch.session != viewport.session { return Err(Refusal::WrongSession); }
        if touch.revision != viewport.revision { return Err(Refusal::StaleFrame); }
        if self.last_sequence.is_some_and(|n| touch.sequence <= n) { return Err(Refusal::Replay); }
        if touch.x >= viewport.width || touch.y >= viewport.height {
            return Err(Refusal::OutsideViewport);
        }
        // Consume a valid in-bounds event even if it missed a control.
        self.last_sequence = Some(touch.sequence);
        let control = controls.iter().find(|c| {
            touch.x >= c.bounds.x && touch.y >= c.bounds.y &&
            touch.x - c.bounds.x < c.bounds.width &&
            touch.y - c.bounds.y < c.bounds.height
        }).ok_or(Refusal::NoControl)?;
        Ok(InertAck { control_id: control.id, sequence: touch.sequence, revision: viewport.revision })
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn viewport() -> Viewport { Viewport { width: 360, height: 800, revision: 4, session: 7 } }
    fn button() -> [Control; 1] { [Control { id: 42, bounds: Rect { x: 12, y: 24, width: 100, height: 48 } }] }
    fn touch() -> Touch { Touch { session: 7, revision: 4, sequence: 1, x: 20, y: 30 } }
    #[test] fn exact_native_button_ack() {
        assert_eq!(InputFence::new().acknowledge(viewport(), &button(), touch()),
                   Ok(InertAck { control_id: 42, sequence: 1, revision: 4 }));
    }
    #[test] fn reconnect_replay_rejected() {
        let mut fence = InputFence::new();
        assert!(fence.acknowledge(viewport(), &button(), touch()).is_ok());
        assert_eq!(fence.acknowledge(viewport(), &button(), touch()), Err(Refusal::Replay));
    }
    #[test] fn session_and_revision_fenced() {
        let mut fence = InputFence::new();
        assert_eq!(fence.acknowledge(viewport(), &button(), Touch { session: 8, ..touch() }), Err(Refusal::WrongSession));
        assert_eq!(fence.acknowledge(viewport(), &button(), Touch { revision: 3, ..touch() }), Err(Refusal::StaleFrame));
    }
    #[test] fn resize_requires_new_frame_revision() {
        let mut v = viewport();
        v.width = 200; v.height = 400; v.revision += 1;
        let mut fence = InputFence::new();
        assert_eq!(fence.acknowledge(v, &button(), touch()), Err(Refusal::StaleFrame));
        assert!(fence.acknowledge(v, &button(), Touch { revision: 5, ..touch() }).is_ok());
    }
    #[test] fn bounds_and_miss_fail_closed() {
        let mut fence = InputFence::new();
        assert_eq!(fence.acknowledge(viewport(), &button(), Touch { x: 360, ..touch() }), Err(Refusal::OutsideViewport));
        assert_eq!(fence.acknowledge(viewport(), &button(), Touch { x: 300, ..touch() }), Err(Refusal::NoControl));
    }
}
