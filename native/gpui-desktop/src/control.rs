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
/// Rendered VLANG/NLCL meaning from the *existing* Host compiler. The
/// native desktop never interprets the text independently; this is a
/// read-only representation of the Host's `interpret?composer=true` response.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ComposerMeaning {
    pub outcome: String,
    pub action_id: Option<String>,
    pub risk: Option<String>,
    pub hint: String,
}
pub fn project_composer_meaning(response: &Value) -> Result<Option<ComposerMeaning>, ReadError> {
    if response["schema"] != "vivim.control-language/1" ||
        response["composer"]["schema"] != "vivim.composer-assist/1" ||
        response["composer"]["authority"] != "none" {
        return Err(ReadError::InvalidProjection);
    }
    let outcome = response["outcome"].as_str().ok_or(ReadError::InvalidProjection)?;
    match outcome {
        "candidate" => {
            let id = response["candidate"]["actionId"].as_str()
                .filter(|s| (3..=96).contains(&s.len()) &&
                    s.bytes().all(|b|b.is_ascii_lowercase() || b.is_ascii_digit() ||
                        matches!(b, b'.'|b'_'|b'-')))
                .ok_or(ReadError::InvalidProjection)?;
            let action=&response["composer"]["action"];
            if action["id"] != id {return Err(ReadError::InvalidProjection)}
            let risk=action["risk"].as_str()
                .filter(|s|matches!(*s, "R0"|"R1"|"R2"|"R3"))
                .ok_or(ReadError::InvalidProjection)?;
            let readiness=action["readiness"].as_str()
                .filter(|s|matches!(*s,"source_wired"|"verified"|
                    "adapter_pending"|"enforcement_missing"|"unsupported"))
                .ok_or(ReadError::InvalidProjection)?;
            // Display the Host's typed argument binding; do not infer slots,
            // reparse user prose, or create a second native command grammar.
            // Bounded, inert preview: long values are visibly abbreviated.
            let args=response["candidate"]["args"].as_object()
                .ok_or(ReadError::InvalidProjection)?;
            if args.len()>12 { return Err(ReadError::InvalidProjection); }
            let mut fields=Vec::new();
            for (key, value) in args {
                if key.is_empty() || key.len()>96 ||
                    !key.bytes().all(|b|b.is_ascii_lowercase()||b.is_ascii_digit()||
                        matches!(b,b'.'|b'_'|b'-')) {
                    return Err(ReadError::InvalidProjection);
                }
                let text=value.as_str().filter(|v|
                    !v.is_empty() && v.encode_utf16().count()<=1000 &&
                    !v.chars().any(char::is_control))
                    .ok_or(ReadError::InvalidProjection)?;
                if fields.len()<3 {
                    // Higher-risk arguments can contain private instructions;
                    // expose only slot presence, never duplicate their text.
                    let shown=if matches!(risk,"R2"|"R3") {
                        "[supplied]".to_owned()
                    } else {
                        let brief:String=text.chars().take(48).collect();
                        if text.chars().count()>48 {format!("{brief}…")} else {brief}
                    };
                    fields.push(format!("{key}={shown}"));
                }
            }
            let arg_hint=if args.is_empty(){String::new()}else{
                format!(" · arguments: {}{}",
                    fields.join(", "),if args.len()>3{" …"}else{""})
            };
            let hint=if matches!(readiness,"source_wired"|"verified") {
                if risk=="R0" {format!("Recognized: {id}{arg_hint} · read-only interpretation")}
                else {format!("Recognized: {id}{arg_hint} · {risk} · submit for a separate approved plan")}
            } else {format!("Recognized but unavailable: {id}{arg_hint} · {readiness}")};
            Ok(Some(ComposerMeaning {
                outcome:outcome.into(),action_id:Some(id.into()),
                risk:Some(risk.into()),hint
            }))
        }
        "clarification_required" => {
            let question=response["question"].as_str()
                .filter(|s|!s.is_empty() && s.len()<=300 &&
                    !s.chars().any(char::is_control))
                .ok_or(ReadError::InvalidProjection)?;
            Ok(Some(ComposerMeaning {outcome:outcome.into(),
                action_id:None,risk:None,hint:format!("Needs clarification: {question}")}))
        }
        "incomplete" => Ok(Some(ComposerMeaning {
            outcome:outcome.into(),action_id:None,risk:None,
            hint:"Incomplete command · continue typing".into()
        })),
        // A deterministic non-match must be visible on the command surface:
        // never silently imply that an LLM was used or an effect was sent.
        "interpretation_required" => Ok(Some(ComposerMeaning {
            outcome:outcome.into(),action_id:None,risk:None,
            hint:"No deterministic command match · no action taken".into()
        })),
        "refused" => Ok(Some(ComposerMeaning {
            outcome:outcome.into(),action_id:None,risk:None,
            hint:"Command refused by Host policy · no action taken".into()
        })),
        "empty" => Ok(None),
        _ => Err(ReadError::InvalidProjection)
    }
}
/// Observe meaning; DOES NOT call the Host plan or execute route.
pub fn interpret_composer(text: &str) -> Result<Option<ComposerMeaning>,ReadError> {
    let text=text.trim();
    if text.is_empty() || text.encode_utf16().count()>1000 ||
        text.chars().any(char::is_control) {
        return Err(ReadError::InvalidInput);
    }
    let response=request("interpret",Some(json!({"text":text,"composer":true})))?;
    project_composer_meaning(&response)
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
    #[test] fn inert_command_preview_requires_exact_host_composer_admission() {
        let p=json!({"schema":"vivim.control-language/1","outcome":"candidate",
            "candidate":{"actionId":"wiki.page.create","args":{"page":"notes"}},
            "composer":{"schema":"vivim.composer-assist/1","authority":"none",
                "action":{"id":"wiki.page.create","risk":"R1","readiness":"source_wired"}}});
        let meaning=project_composer_meaning(&p).unwrap().unwrap();
        assert_eq!(meaning.action_id.as_deref(),Some("wiki.page.create"));
        assert!(meaning.hint.contains("arguments: page=notes"));
        assert!(meaning.hint.contains("separate approved plan"));
        let mut invalid=p.clone();
        invalid["candidate"]["args"]=json!({"page":["malformed"]});
        assert!(project_composer_meaning(&invalid).is_err());
        invalid=p.clone();
        invalid["candidate"]["args"]=json!({"page":"has\\ncontrol"});
        assert!(project_composer_meaning(&invalid).is_err());
        invalid=p.clone();
        invalid["candidate"]["args"]=json!({"page":"private instruction"});
        invalid["composer"]["action"]["risk"]=json!("R2");
        let hidden=project_composer_meaning(&invalid).unwrap().unwrap();
        assert!(hidden.hint.contains("page=[supplied]"));
        assert!(!hidden.hint.contains("private instruction"));
        let mut fake=p.clone();fake["composer"]["action"]["id"]=json!("wiki.page.move");
        assert!(project_composer_meaning(&fake).is_err());
        fake=p.clone();fake["composer"]["authority"]=json!("Host");
        assert!(project_composer_meaning(&fake).is_err());
        fake=p.clone();fake["composer"]["action"]["readiness"]=json!("unknown");
        assert!(project_composer_meaning(&fake).is_err());
    }
    #[test] fn ambiguous_or_unrecognized_text_never_becomes_an_approval() {
        let base=json!({"schema":"vivim.control-language/1",
            "composer":{"schema":"vivim.composer-assist/1","authority":"none"}});
        let mut value=base.clone();
        value["outcome"]=json!("clarification_required");
        value["question"]=json!("Which Wiki section?");
        let preview=project_composer_meaning(&value).unwrap().unwrap();
        assert!(preview.hint.contains("Which Wiki section?"));
        assert!(preview.action_id.is_none());
        for (state, expected) in [
            ("refused", Some("refused by Host policy")),
            ("interpretation_required", Some("No deterministic command match")),
            ("empty", None),
        ] {
            value=base.clone();value["outcome"]=json!(state);
            let projection=project_composer_meaning(&value).unwrap();
            match expected {
                Some(label)=>{
                    let preview=projection.expect("unsupported commands need truthful feedback");
                    assert_eq!(preview.outcome,state);
                    assert!(preview.hint.contains(label));
                    assert!(preview.action_id.is_none());
                    assert!(preview.risk.is_none());
                }
                None=>assert!(projection.is_none()),
            }
        }
        value=base.clone();value["outcome"]=json!("candidate");
        assert!(project_composer_meaning(&value).is_err());
    }
    #[test] fn inspect_path_is_not_user_controlled() {
        assert!(valid_id("ctl-0123456789abcdef"));
        assert!(!valid_id("ctl-0123456789abcdef/execute"));
        assert!(!valid_id("../execute"));
    }
}
