//! @hq:capability vivim.gpui-control-client@1
//! @hq:consumes vivim.control-plan@1
//! @hq:consumes vivim.control-receipt@1
//! @hq:consumes vivim.rust-control-plan-presentation@1
//! @hq:consumes vivim.rust-control-receipt-presentation@1
//! @hq:consumes vivim.rust-control-inspection-presentation@1
//! Native client for the existing Host control contract. Planning is not approval.
use super::{BASE, LIMIT, Endpoint, ReadError, get, owner_token, validate_health};
use reqwest::blocking::Client;
use serde_json::{Value, json};
use vivim_programmability_core::control_plan_presentation;
use std::{io::Read, time::Duration};

const CONTROL: &str = "/api/host/control/";
const MAX_COMMAND: usize = 16 * 1024;

fn hex(s: &str, n: usize) -> bool {
    s.len() == n && s.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
pub fn valid_id(id: &str) -> bool {
    id.strip_prefix("ctl-").is_some_and(|s| hex(s, 16))
}
#[derive(Debug, PartialEq, Eq)]
pub struct PlanKey {
    id: String,
    digest: String,
    action: String,
}
impl PlanKey {
    pub fn id(&self) -> &str { &self.id }
    fn body(&self) -> Value { json!({"planId":self.id,"planDigest":self.digest}) }
    fn from_plan(p: &Value) -> Result<Self, ReadError> {
        let id = p["planId"].as_str().filter(|s| valid_id(s)).ok_or(ReadError::InvalidProjection)?;
        let digest = p["planDigest"].as_str().filter(|s| hex(s,64)).ok_or(ReadError::InvalidProjection)?;
        let action = p["actionId"].as_str().filter(|s| !s.is_empty()).ok_or(ReadError::InvalidProjection)?;
        if !p["args"].is_object() || !matches!(p["risk"].as_str(), Some("R1"|"R2"))
            || p["expiresAt"].as_str().is_none()
            || p["approval"]["required"] != true
            || !p["approval"]["channels"].as_array().is_some_and(|a| a.iter().any(|v| v == "desktop-owner-token")) {
            return Err(ReadError::InvalidProjection);
        }
        Ok(Self {id:id.into(),digest:digest.into(),action:action.into()})
    }
}
#[derive(Debug)]
pub struct Review {
    pub detail: String,
    approval: Option<PlanKey>,
}
impl Review {
    pub fn needs_approval(&self) -> bool { self.approval.is_some() }
    // A review can produce at most one approval in this process. It cannot be
    // rehydrated from a receipt or a GET plan response.
    pub fn consume_approval(&mut self) -> Option<PlanKey> { self.approval.take() }
    pub fn cancel(&mut self) { self.approval = None; }
}
fn parse_review(p: Value) -> Result<Review, ReadError> {
    if p["schema"] != "vivim.control-plan/1" || p["source"] != "desktop" {
        return Err(ReadError::InvalidProjection);
    }
    let approval = match p["outcome"].as_str() {
        Some("approval_required") => Some(PlanKey::from_plan(&p)?),
        Some("done"|"clarification_required"|"incomplete"|"interpretation_required"|"refused"|"unavailable") => None,
        _ => return Err(ReadError::InvalidProjection),
    };
    // Rust adds a source-backed review summary but preserves all plan values.
    // Neither the summary nor the source text can grant an approval.
    let detail = control_plan_presentation::format_review(&p)
        .ok_or(ReadError::InvalidProjection)?;
    Ok(Review {detail, approval})
}

fn connected() -> Result<(Client,String), ReadError> {
    let client = Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(2)).timeout(Duration::from_secs(30))
        .build().map_err(|_| ReadError::Unavailable)?;
    validate_health(&get(&client, Endpoint::Health, None)?)?;
    let token=owner_token()?;
    if !vivim_host_supervisor::verify_host_owner(&client,&token) {
        return Err(ReadError::OwnerRequired);
    }
    Ok((client,token))
}

fn request(route: &str, body: Option<Value>) -> Result<Value, ReadError> {
    let (client,token) = connected()?;
    let url = format!("{BASE}{CONTROL}{route}");
    let req = match body {
        Some(body) => client.post(url).header("origin",BASE).header("x-vivim-control","1").json(&body),
        None => client.get(url),
    }.bearer_auth(token);
    let response = req.send().map_err(|_| ReadError::Offline)?;
    match response.status().as_u16() {
        200 => {},
        401|403 => return Err(ReadError::OwnerRequired),
        _ => return Err(ReadError::Unavailable),
    }
    let mut bytes = Vec::new();
    response.take(LIMIT+1).read_to_end(&mut bytes).map_err(|_| ReadError::Unavailable)?;
    if bytes.len() as u64 > LIMIT { return Err(ReadError::InvalidProjection); }
    serde_json::from_slice(&bytes).map_err(|_| ReadError::InvalidProjection)
}
pub fn plan(text: &str) -> Result<Review, ReadError> {
    let text = text.trim();
    if text.is_empty() || text.len() > MAX_COMMAND { return Err(ReadError::InvalidInput); }
    parse_review(request("plan", Some(json!({"text":text})))?)
}
#[derive(Debug)]
pub struct Receipt {
    pub status: String,
    pub detail: String,
}
fn parse_receipt(p: Value, key: &PlanKey) -> Result<Receipt, ReadError> {
    let binding=json!({"planId":key.id,"planDigest":key.digest,
        "actionId":key.action,"source":"desktop"});
    let (status,detail)=control_plan_presentation::format_receipt(&p,&binding)
        .ok_or(ReadError::InvalidProjection)?;
    Ok(Receipt{status,detail})
}
// Transport or response errors after a click are treated as uncertain by the UI.
// No automatic replay or fallback to a different execution route.
pub fn execute(key: PlanKey) -> Result<Receipt, ReadError> {
    parse_receipt(request("execute",Some(key.body()))?,&key)
}
pub fn inspect(id: &str) -> Result<String, ReadError> {
    if !valid_id(id) { return Err(ReadError::InvalidInput); }
    let p=request(&format!("plans/{id}"),None)?;
    control_plan_presentation::format_inspection(&p,id)
        .ok_or(ReadError::InvalidProjection)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn proposed() -> Value {
        json!({"schema":"vivim.control-plan/1","source":"desktop","outcome":"approval_required",
        "actionId":"wiki.page.create","args":{"page":"work"},"risk":"R1","planId":"ctl-0123456789abcdef",
        "planDigest":"a".repeat(64),"expiresAt":"2026-11-20T00:00:00Z",
        "approval":{"required":true,"channels":["desktop-owner-token"]}})
    }
    #[test] fn one_click_consumes_exact_key() {
        let mut r=parse_review(proposed()).unwrap();
        assert!(r.needs_approval());
        let key=r.consume_approval().unwrap();
        assert_eq!(key.body(),json!({"planId":"ctl-0123456789abcdef","planDigest":"a".repeat(64)}));
        assert!(r.consume_approval().is_none());
    }
    #[test] fn cancel_and_read_only_never_approve() {
        let mut r=parse_review(proposed()).unwrap();r.cancel();
        assert!(r.consume_approval().is_none());
        let mut r=parse_review(json!({"schema":"vivim.control-plan/1","source":"desktop","outcome":"done","result":{}})).unwrap();
        assert!(r.consume_approval().is_none());
    }
    #[test] fn invalid_plan_refused() {
        for (field, value) in [("planId",json!("../execute")),("planDigest",json!("wrong")),("source",json!("mobile")),("args",json!(null)),("approval",json!({"required":false}))] {
            let mut p=proposed();p[field]=value;
            assert!(parse_review(p).is_err(),"{field}");
        }
    }
    #[test] fn receipt_must_match_exact_plan() {
        let key=parse_review(proposed()).unwrap().consume_approval().unwrap();
        let mut p=json!({"schema":"vivim.control-receipt/1","planId":key.id(),"planDigest":"a".repeat(64),
            "actionId":"wiki.page.create","source":"desktop","status":"applied","executionPerformed":true});
        assert_eq!(parse_receipt(p.clone(),&key).unwrap().status,"applied");
        p["planDigest"]=json!("b".repeat(64)); assert!(parse_receipt(p,&key).is_err());
    }
    #[test] fn inspect_path_is_not_user_controlled() {
        assert!(valid_id("ctl-0123456789abcdef"));
        assert!(!valid_id("ctl-0123456789abcdef/execute"));
        assert!(!valid_id("../execute"));
    }
}
