//! Inert real-GPUI button acceptance for first paired Android proof.
//! No fake product renderer, no arbitrary pointer injection and NO Host effect.
//! The same native GPUI callback is used by a PC click and a paired phone tap.
//! The UI paints the button at PROOF_RECT in GPUI logical content coordinates.
//! Only this one inert target is accepted until Host can verify other native
//! controls and effect-specific approval policy. Native screen capture must be
//! exactly the client viewport; titlebar/Windows composition cannot shift it.
use crate::remote_viewport_contract::{
    Control,InputFence,InertAck,Rect,Refusal,Viewport
};
use crate::remote_host_transport::RemoteInput;

pub const PROOF_CONTROL_ID:u64=42;
pub const PROOF_LOGICAL_BOUNDS:Rect=Rect{
    x:16,y:56,width:200,height:48
};
#[derive(Debug,Clone,Copy,PartialEq,Eq)]
pub enum RemoteProofResult{
    InertButton(InertAck),
    Refused(Refusal),
    FrameUnavailable,
}
pub struct RemoteProof{
    session:u128,
    frame:Option<Viewport>,
    scale:f32,
    fence:InputFence,
}
fn scale_bounds(scale:f32)->Option<Rect>{
    if !scale.is_finite()||!(0.75..=4.).contains(&scale){return None;}
    let mul=|value:u32|((value as f32)*scale).round() as u32;
    Some(Rect{
        x:mul(PROOF_LOGICAL_BOUNDS.x),
        y:mul(PROOF_LOGICAL_BOUNDS.y),
        width:mul(PROOF_LOGICAL_BOUNDS.width),
        height:mul(PROOF_LOGICAL_BOUNDS.height)
    })
}
impl RemoteProof{
    pub fn new(session:u128)->Self{
        Self{session,frame:None,scale:1.,fence:InputFence::new()}
    }
    pub fn frame(&self)->Option<Viewport>{self.frame}
    pub fn record_native_frame(&mut self,width:u32,height:u32,revision:u64,scale:f32)
        ->Result<(),&'static str>{
        let rect=scale_bounds(scale).ok_or("GPUI_SCALE_UNAVAILABLE")?;
        if !(240..=4096).contains(&width)||!(240..=4096).contains(&height)||
            revision==0 || width<=rect.x+rect.width ||
            height<=rect.y+rect.height{
            return Err("GPUI_PROOF_VIEWPORT_INVALID");
        }
        if self.frame.is_some_and(|frame|revision<=frame.revision){
            return Err("GPUI_FRAME_STALE");
        }
        self.frame=Some(Viewport{width,height,revision,session:self.session});
        self.scale=scale;
        Ok(())
    }
    pub fn admit(&mut self,event:RemoteInput)->RemoteProofResult{
        let Some(frame)=self.frame else{return RemoteProofResult::FrameUnavailable};
        match event{
            RemoteInput::Pointer(touch)=>{
                let Some(bounds)=scale_bounds(self.scale) else{
                    return RemoteProofResult::Refused(Refusal::OutsideViewport);
                };
                let controls=[Control{id:PROOF_CONTROL_ID,bounds}];
                match self.fence.acknowledge(frame,&controls,touch){
                    Ok(ack)=>RemoteProofResult::InertButton(ack),
                    Err(reason)=>RemoteProofResult::Refused(reason)
                }
            }
            // A phone cannot invent GPUI text focus; this proof screen has
            // no composer. Full product IME remains separately gated by native
            // focus/readback and Host authorizations, not assumed here.
            RemoteInput::Text{..}=>RemoteProofResult::Refused(Refusal::NoFocus),
        }
    }
}
#[cfg(test)]
mod tests{
    use super::*;
    use crate::remote_viewport_contract::Touch;
    fn proof()->RemoteProof{
        let mut proof=RemoteProof::new(7);
        proof.record_native_frame(360,800,1,1.).unwrap();
        proof
    }
    fn tap(sequence:u64,x:u32,y:u32)->RemoteInput{
        RemoteInput::Pointer(Touch{
            session:7,revision:1,sequence,x,y
        })
    }
    #[test] fn inert_gpui_button_is_same_single_native_control(){
        let mut proof=proof();
        assert_eq!(proof.admit(tap(1,20,60)),RemoteProofResult::InertButton(
            InertAck{control_id:42,sequence:1,revision:1}
        ));
    }
    #[test] fn outside_only_safe_native_button_is_never_dispatched(){
        let mut proof=proof();
        assert_eq!(proof.admit(tap(1,300,100)),RemoteProofResult::Refused(Refusal::NoControl));
        assert_eq!(proof.admit(tap(2,0,0)),RemoteProofResult::Refused(Refusal::NoControl));
    }
    #[test] fn session_revision_and_replay_refuse_before_button_callback(){
        let mut proof=proof();
        assert!(matches!(proof.admit(tap(5,20,60)),RemoteProofResult::InertButton(_)));
        assert_eq!(proof.admit(tap(5,20,60)),RemoteProofResult::Refused(Refusal::Replay));
        assert_eq!(proof.admit(RemoteInput::Pointer(Touch{
            session:8,revision:1,sequence:6,x:20,y:60
        })),RemoteProofResult::Refused(Refusal::WrongSession));
        assert_eq!(proof.admit(RemoteInput::Pointer(Touch{
            session:7,revision:0,sequence:6,x:20,y:60
        })),RemoteProofResult::Refused(Refusal::StaleFrame));
    }
    #[test] fn native_dpi_scaling_preserves_same_button_hitbox(){
        let mut proof=RemoteProof::new(7);
        proof.record_native_frame(540,1200,1,1.5).unwrap();
        assert!(matches!(proof.admit(RemoteInput::Pointer(Touch{
            session:7,revision:1,sequence:1,x:30,y:90
        })),RemoteProofResult::InertButton(_)));
        assert_eq!(proof.record_native_frame(540,1200,1,1.5),
            Err("GPUI_FRAME_STALE"));
    }
    #[test] fn native_focus_is_unavailable_for_unsupported_product_ime(){
        let mut proof=proof();
        assert_eq!(proof.admit(RemoteInput::Text{
            session:7,revision:1,sequence:1,
            phase:crate::remote_viewport_contract::TextPhase::ImeCommit,
            text:"日本語".into()
        }),RemoteProofResult::Refused(Refusal::NoFocus));
    }
    #[test] fn never_accept_infinite_scale_or_tiny_viewport(){
        let mut proof=RemoteProof::new(7);
        assert_eq!(proof.record_native_frame(360,800,1,f32::INFINITY),
            Err("GPUI_SCALE_UNAVAILABLE"));
        assert_eq!(proof.record_native_frame(120,800,1,1.),
            Err("GPUI_PROOF_VIEWPORT_INVALID"));
    }
}
