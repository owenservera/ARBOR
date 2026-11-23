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
pub enum Refusal { WrongSession, StaleFrame, Replay, OutsideViewport, NoControl, NoFocus, InvalidText }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct InertAck { pub control_id: u64, pub sequence: u64, pub revision: u64 }
/// Only native GPUI establishes which control currently owns text focus.
/// A phone may supply text and phase, never a claimed Host effect or focus grant.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TextPhase { KeyDown, KeyUp, ImeStart, ImeUpdate, ImeCommit, ImeCancel }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TextInput<'a> {
    pub session: u128,
    pub revision: u64,
    pub sequence: u64,
    pub phase: TextPhase,
    pub text: &'a str,
}
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
    pub fn acknowledge_text(
        &mut self, viewport: Viewport, controls: &[Control],
        native_focused_id: Option<u64>, input: TextInput<'_>
    ) -> Result<InertAck, Refusal> {
        if input.session != viewport.session { return Err(Refusal::WrongSession); }
        if input.revision != viewport.revision { return Err(Refusal::StaleFrame); }
        if self.last_sequence.is_some_and(|n| input.sequence <= n) {
            return Err(Refusal::Replay);
        }
        // Count UTF-16 as phone browsers do: emoji are two units. Preserve
        // Unicode contents exactly; reject NUL and unsupported control bytes.
        let units=input.text.encode_utf16().count();
        if units>1024 || input.text.chars().any(|ch|
            (ch.is_control() && ch!='\\n' && ch!='\\t') || ch=='\\0'
        ) { return Err(Refusal::InvalidText); }
        let phase_valid=match input.phase {
            TextPhase::KeyDown|TextPhase::KeyUp =>
                (1..=64).contains(&units) && !input.text.contains(['\\n','\\t']),
            TextPhase::ImeStart|TextPhase::ImeCancel => units==0,
            TextPhase::ImeUpdate|TextPhase::ImeCommit => (1..=1024).contains(&units),
        };
        if !phase_valid { return Err(Refusal::InvalidText); }
        let Some(focused)=native_focused_id else { return Err(Refusal::NoFocus); };
        // Phone packets never choose the target control: GPUI passes its OWN
        // focus identity, and only native controls may be acknowledged.
        if !controls.iter().any(|c|c.id==focused) { return Err(Refusal::NoFocus); }
        self.last_sequence=Some(input.sequence);
        Ok(InertAck{control_id:focused,sequence:input.sequence,revision:viewport.revision})
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
    fn text<'a>(sequence:u64,phase:TextPhase,value:&'a str)->TextInput<'a>{
        TextInput{session:7,revision:4,sequence,phase,text:value}
    }
    #[test] fn native_focus_owns_key_and_unicode_ime_receipts() {
        let mut fence=InputFence::new();
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(1,TextPhase::KeyDown,"Enter")),
            Ok(InertAck{control_id:42,sequence:1,revision:4}));
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(2,TextPhase::ImeUpdate,"é🔹")),
            Ok(InertAck{control_id:42,sequence:2,revision:4}));
        assert!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(3,TextPhase::ImeCommit,"日本語")).is_ok());
    }
    #[test] fn phone_cannot_create_focus_or_claim_a_nonexistent_native_control() {
        let mut fence=InputFence::new();
        assert_eq!(fence.acknowledge_text(viewport(),&button(),None,
            text(1,TextPhase::KeyDown,"a")),Err(Refusal::NoFocus));
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(999),
            text(1,TextPhase::KeyDown,"a")),Err(Refusal::NoFocus));
        assert!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(1,TextPhase::KeyDown,"a")).is_ok());
    }
    #[test] fn native_text_obeys_shared_touch_replay_and_source_revision() {
        let mut fence=InputFence::new();
        assert!(fence.acknowledge(viewport(),&button(),touch()).is_ok());
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(1,TextPhase::KeyDown,"a")),Err(Refusal::Replay));
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
            TextInput{revision:3,..text(2,TextPhase::KeyDown,"a")}),
            Err(Refusal::StaleFrame));
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
            TextInput{session:8,..text(2,TextPhase::KeyDown,"a")}),
            Err(Refusal::WrongSession));
        assert!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(2,TextPhase::KeyDown,"a")).is_ok());
        assert_eq!(fence.acknowledge(viewport(),&button(),
            Touch{sequence:2,..touch()}),Err(Refusal::Replay));
    }
    #[test] fn invalid_text_cannot_advance_native_sequence_or_permit_false_ack() {
        let mut fence=InputFence::new();
        for bad in ["", "\\0", "\\r", "a".repeat(1025).as_str()] {
            assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
                text(1,TextPhase::KeyDown,bad)),Err(Refusal::InvalidText));
        }
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(1,TextPhase::ImeCommit,"🔹".repeat(513).as_str())),
            Err(Refusal::InvalidText));
        assert!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(1,TextPhase::KeyDown,"a")).is_ok());
    }
    #[test] fn ime_lifecycle_accepts_empty_start_cancel_but_not_empty_commit() {
        let mut fence=InputFence::new();
        assert!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(1,TextPhase::ImeStart,"")).is_ok());
        assert_eq!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(2,TextPhase::ImeCommit,"")),Err(Refusal::InvalidText));
        assert!(fence.acknowledge_text(viewport(),&button(),Some(42),
            text(2,TextPhase::ImeCancel,"")).is_ok());
    }

}
