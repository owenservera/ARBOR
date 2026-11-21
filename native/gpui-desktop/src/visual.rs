//! Loopback transport for the shared Rust visual admission core.
//! @hq:capability vivim.gpui-projection-client@1
//! @hq:consumes vivim.native-ui-view@1
//! @hq:consumes vivim.native-visual-validation@1
use crate::{BASE, LIMIT, Endpoint, ReadError, get, owner_token, validate_health};
use reqwest::blocking::Client;
use serde_json::Value;
use std::{io::Read,time::Duration};
pub use vivim_programmability_core::visual::{Visual, Node, RevisionGuard, VisualError};

/// Host Wiki-backed personal bindings use the exact Wiki revision. The
/// renderer may not claim live source parity if the two authorized GETs raced.
/// Returns the number of aligned Wiki bindings; zero means unproven, not empty.
pub fn aligned_wiki_bindings(wiki_revision:u64,visual:&Visual)->Result<usize,ReadError>{
    let mut aligned=0;
    for (name,(revision,_digest)) in &visual.binding_watermarks {
        if matches!(name.as_str(),
            "personal.open-tasks"|"personal.completed-tasks"|"personal.recent-notes") {
            if *revision!=wiki_revision {return Err(ReadError::SnapshotChanged);}
            aligned+=1;
        }
    }
    Ok(aligned)
}

/// All purely native validation precedes the shared revision guard's commit.
/// The Host owns visual source and effects; this is only an inert projection.
pub struct PreparedVisual {
    pub source: Option<Visual>,
    pub vec_view: Option<vivim_programmability_core::vec::View>,
    pub visual_delta: vivim_programmability_core::visual::VisualDelta,
    pub vec_delta: vivim_programmability_core::vec::Delta,
    pub aligned_wiki_bindings: usize,
}
pub fn prepare_visual(
    previous: Option<&Visual>,
    previous_vec: Option<&vivim_programmability_core::vec::View>,
    source: Option<Visual>,
    wiki_revision: u64,
) -> Result<PreparedVisual, ReadError> {
    let aligned_wiki_bindings=match source.as_ref() {
        Some(source)=>aligned_wiki_bindings(wiki_revision,source)?,
        None=>0,
    };
    let visual_delta=vivim_programmability_core::visual::visual_delta(
        previous,source.as_ref()
    )?;
    let vec_view=source.as_ref().map(vivim_programmability_core::vec::compile)
        .transpose()?;
    let vec_delta=vivim_programmability_core::vec::diff(
        previous_vec,vec_view.as_ref()
    )?;
    Ok(PreparedVisual{source,vec_view,visual_delta,vec_delta,aligned_wiki_bindings})
}

impl From<VisualError> for ReadError {
    fn from(e:VisualError)->Self {
        match e {VisualError::InvalidProjection=>Self::InvalidProjection,VisualError::Unavailable=>Self::Unavailable}
    }
}
/// Verify the viewport the canonical TierFlow plan actually admitted. This
/// field is in the existing GPUI/PWA-shared RenderPlan, not a new Host schema.
/// A request can return successfully yet still contain an older cached plan.
pub fn parse_at(viewport_px:u32,payload:&Value)->Result<Option<Visual>,ReadError>{
    if !(240..=3840).contains(&viewport_px) {return Err(ReadError::InvalidInput);}
    if payload["state"]=="source-backed" {
        let admitted=payload["plan"]["viewportPx"].as_u64()
            .ok_or(ReadError::InvalidProjection)?;
        if admitted!=u64::from(viewport_px){return Err(ReadError::SnapshotChanged);}
    }
    vivim_programmability_core::visual::parse(payload).map_err(Into::into)
}

/// Request a genuine Host-planned viewport, never a locally approximated layout.
pub fn read_at(viewport_px:u32)->Result<Option<Visual>,ReadError>{
    if !(240..=3840).contains(&viewport_px){return Err(ReadError::InvalidInput)}
    let client=Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none()).timeout(Duration::from_secs(8))
        .connect_timeout(Duration::from_secs(2)).build().map_err(|_|ReadError::Unavailable)?;
    validate_health(&get(&client,Endpoint::Health,None)?)?;
    let token=owner_token()?;
    if !vivim_host_supervisor::verify_host_owner(&client,&token) {
        return Err(ReadError::OwnerRequired);
    }
    let response=client.get(format!("{BASE}/api/host/control/native-ui-view?viewportPx={viewport_px}"))
        .bearer_auth(token).send().map_err(|_|ReadError::Offline)?;
    match response.status().as_u16(){200=>{},401|403=>return Err(ReadError::OwnerRequired),_=>return Err(ReadError::Unavailable)}
    let mut bytes=Vec::new();response.take(LIMIT+1).read_to_end(&mut bytes).map_err(|_|ReadError::Unavailable)?;
    if bytes.len() as u64>LIMIT{return Err(ReadError::InvalidProjection)}
    let payload:Value=serde_json::from_slice(&bytes).map_err(|_|ReadError::InvalidProjection)?;
    parse_at(viewport_px,&payload)
}


#[cfg(test)]
mod coherence_tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn rejects_wrong_or_missing_tierflow_admission_width_before_compilation() {
        let stale=json!({"state":"source-backed","plan":{"viewportPx":360}});
        assert_eq!(parse_at(768,&stale),Err(ReadError::SnapshotChanged));
        assert_eq!(parse_at(240,&json!({"state":"source-backed","plan":{}})),
            Err(ReadError::InvalidProjection));
        assert_eq!(parse_at(239,&stale),Err(ReadError::InvalidInput));
    }
    #[test]
    fn complete_visual_preflight_rejects_bad_vec_without_admitting_it() {
        let mut source=Visual{
            surface_id:"real".into(),revision:2,
            background:0x151b24,secondary:0x202b3a,accent:0x78b8f6,
            root:Node{
                id:"root".into(),component:"vivim.component.stack@1".into(),
                kind:"stack".into(),label:None,detail:None,
                horizontal:false,columns:1,background:None,padding:None,
                gap:None,radius:None,font_size:None,border:None,border_width:None,
                children:Vec::new(),items:Vec::new(),bars:Vec::new()
            },
            fingerprint:"real Host design".into(),
            binding_watermarks:Default::default(),
        };
        let good=prepare_visual(None,None,Some(source.clone()),7).unwrap();
        assert!(good.vec_view.is_some());
        assert_eq!(good.aligned_wiki_bindings,0);
        let previous=good.vec_view.as_ref().unwrap();
        source.root.kind="unsupported-component".into();
        assert!(matches!(prepare_visual(None,Some(previous),Some(source),7),
            Err(ReadError::InvalidProjection)));
    }
    #[test]
    fn preflight_fences_personal_wiki_revision_before_vec_compile() {
        let mut source=Visual{
            surface_id:"real".into(),revision:2,
            background:0x151b24,secondary:0x202b3a,accent:0x78b8f6,
            root:Node{
                id:"root".into(),component:"vivim.component.stack@1".into(),
                kind:"stack".into(),label:None,detail:None,
                horizontal:false,columns:1,background:None,padding:None,
                gap:None,radius:None,font_size:None,border:None,border_width:None,
                children:Vec::new(),items:Vec::new(),bars:Vec::new()
            },
            fingerprint:"real Host design".into(),
            binding_watermarks:Default::default(),
        };
        source.binding_watermarks.insert("personal.open-tasks".into(),(8,"source".into()));
        assert!(matches!(prepare_visual(None,None,Some(source),7),
            Err(ReadError::SnapshotChanged)));
    }
    #[test]
    fn cross_source_revision_mismatch_is_not_empty_or_accepted() {
        let mut visual=Visual{
            surface_id:"source".into(),revision:1,background:0,secondary:0,accent:0,
            root:Node{
                id:"root".into(),component:"vivim.component.stack@1".into(),
                kind:"stack".into(),label:None,detail:None,
                horizontal:false,columns:1,background:None,padding:None,
                gap:None,radius:None,font_size:None,border:None,border_width:None,
                children:Vec::new(),items:Vec::new(),bars:Vec::new()
            },fingerprint:"source".into(),binding_watermarks:Default::default(),
        };
        assert_eq!(aligned_wiki_bindings(7,&visual),Ok(0));
        visual.binding_watermarks.insert("personal.open-tasks".into(),(8,"digest".into()));
        assert_eq!(aligned_wiki_bindings(7,&visual),Err(ReadError::SnapshotChanged));
        assert_eq!(aligned_wiki_bindings(8,&visual),Ok(1));
        visual.binding_watermarks.insert("studio.recent-outcomes".into(),(99,"other".into()));
        assert_eq!(aligned_wiki_bindings(8,&visual),Ok(1));
    }
}
