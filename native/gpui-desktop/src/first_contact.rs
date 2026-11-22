//! Read-only bridge from the existing Host LiveSystemState phone composer to
//! the native GPUI First Contact viewport. No parallel source or effects.
use crate::ReadError;
use reqwest::blocking::Client;
use serde_json::Value;
use std::{io::Read, time::Duration};
use vivim_host_supervisor::{read_owner_token, verify_host_owner};

const BASE: &str = "http://127.0.0.1:43187";
const MAX_RESPONSE_BYTES: u64 = 512 * 1024;

/// The actual phone's authorized, fresh source observation, NOT a second draft store.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PhoneDraft {
    pub epoch: String,
    pub system_revision: u64,
    pub source_revision: u64,
    pub view_revision: u64,
    pub local_revision: u64,
    pub session_id: String,
    pub text: String,
    pub composing: bool,
}

/// Admission is strict: never turn another region or an old/private Host error
/// into a plausible "live phone" view.
pub fn project_phone_draft(source: &Value) -> Result<Option<PhoneDraft>, ReadError> {
    if source["schema"] != "vivim.host-live-system/1" ||
        source["state"] != "source-backed" ||
        source["authority"] != "read-only-projection" ||
        source["executionAuthorized"] != false ||
        source["effectPerformed"] != false {
        return Err(ReadError::InvalidProjection);
    }
    let epoch = source["epoch"].as_str().filter(|s| !s.is_empty())
        .ok_or(ReadError::InvalidProjection)?;
    let system_revision = source["revision"].as_u64()
        .ok_or(ReadError::InvalidProjection)?;
    let regions = source["regions"].as_array().ok_or(ReadError::InvalidProjection)?;
    let mut found = regions.iter().filter(|r| r["id"] == "phone.composer");
    let Some(region) = found.next() else { return Ok(None) };
    if found.next().is_some() ||
        region["kind"] != "input" ||
        region["sourceId"] != "host.first-contact-composer" {
        return Err(ReadError::InvalidProjection);
    }
    if region["freshness"] != "current" || region["data"]["visible"] != true {
        // Never replay a disconnected/hidden draft as current desktop state.
        return Ok(None);
    }
    let source_revision = region["sourceRevision"].as_u64()
        .ok_or(ReadError::InvalidProjection)?;
    let view_revision = region["viewRevision"].as_u64()
        .ok_or(ReadError::InvalidProjection)?;
    let local_revision = region["data"]["localRevision"].as_u64()
        .ok_or(ReadError::InvalidProjection)?;
    let session_id = region["data"]["sessionId"].as_str()
        .filter(|s| s.len() == 32 && s.bytes().all(|b| b.is_ascii_hexdigit()))
        .ok_or(ReadError::InvalidProjection)?;
    let text = region["data"]["draft"].as_str()
        .filter(|s| s.len() <= 1000 && !s.contains('\\0'))
        .ok_or(ReadError::InvalidProjection)?;
    let composing = region["data"]["composing"].as_bool()
        .ok_or(ReadError::InvalidProjection)?;
    Ok(Some(PhoneDraft {
        epoch: epoch.to_owned(),
        system_revision, source_revision, view_revision, local_revision,
        session_id: session_id.to_owned(), text: text.to_owned(), composing,
    }))
}

/// Owner-authenticated read of the already-published Host state. This runs on
/// a background executor; it must never block GPUI's render thread.
pub fn read_phone_draft() -> Result<Option<PhoneDraft>, ReadError> {
    let client = Client::builder().no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(4))
        .connect_timeout(Duration::from_secs(1))
        .build().map_err(|_| ReadError::Unavailable)?;
    let owner = read_owner_token().map_err(|_| ReadError::OwnerRequired)?;
    if !verify_host_owner(&client, &owner) {
        return Err(ReadError::OwnerRequired);
    }
    let response = client.get(format!("{BASE}/api/host/live-system"))
        .bearer_auth(owner).send().map_err(|_| ReadError::Offline)?;
    match response.status().as_u16() {
        401 | 403 => return Err(ReadError::OwnerRequired),
        200 => {},
        _ => return Err(ReadError::Unavailable),
    }
    let mut bytes = Vec::new();
    response.take(MAX_RESPONSE_BYTES + 1).read_to_end(&mut bytes)
        .map_err(|_| ReadError::Unavailable)?;
    if bytes.len() as u64 > MAX_RESPONSE_BYTES {
        return Err(ReadError::InvalidProjection);
    }
    let value: Value = serde_json::from_slice(&bytes)
        .map_err(|_| ReadError::InvalidProjection)?;
    project_phone_draft(&value)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn state() -> Value {
        json!({
            "schema":"vivim.host-live-system/1", "state":"source-backed",
            "authority":"read-only-projection", "executionAuthorized":false,
            "effectPerformed":false, "epoch":"host.test", "revision":9,
            "regions":[{
                "id":"phone.composer", "kind":"input", "freshness":"current",
                "sourceId":"host.first-contact-composer",
                "sourceRevision":5, "viewRevision":6,
                "data":{"draft":"Wiki", "sessionId":"a".repeat(32),
                    "localRevision":2,"visible":true,"composing":false}
            }]
        })
    }
    #[test] fn accepts_only_authorized_current_phone_region() {
        let p = project_phone_draft(&state()).unwrap().unwrap();
        assert_eq!(p.text, "Wiki");
        assert_eq!(p.system_revision, 9);
        assert_eq!(p.source_revision, 5);
        assert!(!p.composing);
    }
    #[test] fn hides_stale_or_invisible_phone_without_claiming_empty_text() {
        let mut s=state();s["regions"][0]["freshness"]=json!("stale");
        assert_eq!(project_phone_draft(&s),Ok(None));
        s=state();s["regions"][0]["data"]["visible"]=json!(false);
        assert_eq!(project_phone_draft(&s),Ok(None));
        s=state();s["regions"]=json!([]);
        assert_eq!(project_phone_draft(&s),Ok(None));
    }
    #[test] fn refuses_fake_region_or_effect_authority() {
        let mut s=state();s["regions"][0]["sourceId"]=json!("other");
        assert_eq!(project_phone_draft(&s),Err(ReadError::InvalidProjection));
        s=state();s["effectPerformed"]=json!(true);
        assert_eq!(project_phone_draft(&s),Err(ReadError::InvalidProjection));
        s=state();s["regions"].as_array_mut().unwrap().push(s["regions"][0].clone());
        assert_eq!(project_phone_draft(&s),Err(ReadError::InvalidProjection));
    }
    #[test] fn refuses_oversized_or_unversioned_source() {
        let mut s=state();s["regions"][0]["data"]["draft"]=json!("x".repeat(1001));
        assert_eq!(project_phone_draft(&s),Err(ReadError::InvalidProjection));
        s=state();s["regions"][0]["sourceRevision"]=Value::Null;
        assert_eq!(project_phone_draft(&s),Err(ReadError::InvalidProjection));
    }
}
