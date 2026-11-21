//! Loopback transport for the shared Rust visual admission core.
//! @hq:capability vivim.gpui-projection-client@1
//! @hq:consumes vivim.native-ui-view@1
//! @hq:consumes vivim.native-visual-validation@1
use crate::{BASE, LIMIT, Endpoint, ReadError, get, owner_token, validate_health};
use reqwest::blocking::Client;
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

impl From<VisualError> for ReadError {
    fn from(e:VisualError)->Self {
        match e {VisualError::InvalidProjection=>Self::InvalidProjection,VisualError::Unavailable=>Self::Unavailable}
    }
}
/// Request a genuine Host-planned viewport, never a locally approximated layout.
pub fn read_at(viewport_px:u32)->Result<Option<Visual>,ReadError>{
    if !(240..=3840).contains(&viewport_px){return Err(ReadError::InvalidInput)}
    let client=Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none()).timeout(Duration::from_secs(8))
        .connect_timeout(Duration::from_secs(2)).build().map_err(|_|ReadError::Unavailable)?;
    validate_health(&get(&client,Endpoint::Health,None)?)?;
    let response=client.get(format!("{BASE}/api/host/control/native-ui-view?viewportPx={viewport_px}"))
        .bearer_auth(owner_token()?).send().map_err(|_|ReadError::Offline)?;
    match response.status().as_u16(){200=>{},401|403=>return Err(ReadError::OwnerRequired),_=>return Err(ReadError::Unavailable)}
    let mut bytes=Vec::new();response.take(LIMIT+1).read_to_end(&mut bytes).map_err(|_|ReadError::Unavailable)?;
    if bytes.len() as u64>LIMIT{return Err(ReadError::InvalidProjection)}
    Ok(vivim_programmability_core::visual::parse(&serde_json::from_slice(&bytes).map_err(|_|ReadError::InvalidProjection)?)?)
}


#[cfg(test)]
mod coherence_tests {
    use super::*;
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
