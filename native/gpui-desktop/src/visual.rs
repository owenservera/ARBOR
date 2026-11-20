//! Loopback transport for the shared Rust visual admission core.
//! @hq:capability vivim.gpui-projection-client@1
//! @hq:consumes vivim.native-ui-view@1
//! @hq:consumes vivim.native-visual-validation@1
use crate::{BASE, LIMIT, Endpoint, ReadError, get, owner_token, validate_health};
use reqwest::blocking::Client;
use std::{io::Read,time::Duration};
pub use vivim_programmability_core::visual::{Visual, Node, RevisionGuard, VisualError};
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

