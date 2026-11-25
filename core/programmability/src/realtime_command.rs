//! Shared native realtime-command reading; no parser, registry, plan or effect authority.
//! @hq:context Project the incumbent Host interpretation for native user and agent clients.
//! @hq:invariant A registered or source-wired action is not an approved or executed action.
use serde_json::Value;

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all="camelCase")]
pub struct ComposerMeaning {
    pub outcome: String,
    pub action_id: Option<String>,
    pub risk: Option<String>,
    pub hint: String,
    pub registered: Option<bool>,
    pub readiness: Option<String>,
    pub executor_wired: Option<bool>,
    pub live_verified: Option<bool>,
    pub catalog_revision: Option<u64>,
    pub world_revision: Option<u64>,
    pub wiki_revision: Option<u64>,
    pub execution_authorized: bool,
    pub effect_performed: bool,
}
pub fn project_composer_meaning(response: &Value) -> Result<Option<ComposerMeaning>, ProjectionError> {
    if response["schema"] != "vivim.control-language/1" ||
        response["composer"]["schema"] != "vivim.composer-assist/1" ||
        response["composer"]["authority"] != "none" {
        return Err(ProjectionError::InvalidProjection);
    }
    let outcome = response["outcome"].as_str().ok_or(ProjectionError::InvalidProjection)?;
    let catalog_revision=response["composer"]["catalogVersion"].as_u64();
    let world_revision=response["feedback"]["worldV"].as_u64();
    let wiki_revision=response["composer"]["wikiRevision"].as_u64();
    match outcome {
        "candidate" => {
            let id = response["candidate"]["actionId"].as_str()
                .filter(|s| (3..=96).contains(&s.len()) &&
                    s.bytes().all(|b|b.is_ascii_lowercase() || b.is_ascii_digit() ||
                        matches!(b, b'.'|b'_'|b'-')))
                .ok_or(ProjectionError::InvalidProjection)?;
            let action=&response["composer"]["action"];
            if action["id"] != id {return Err(ProjectionError::InvalidProjection)}
            let risk=action["risk"].as_str()
                .filter(|s|matches!(*s, "R0"|"R1"|"R2"|"R3"))
                .ok_or(ProjectionError::InvalidProjection)?;
            let readiness=action["readiness"].as_str()
                .filter(|s|matches!(*s,"source_wired"|"verified"|
                    "adapter_pending"|"enforcement_missing"|"unsupported"))
                .ok_or(ProjectionError::InvalidProjection)?;
            // Display the Host's typed argument binding; do not infer slots,
            // reparse user prose, or create a second native command grammar.
            // Bounded, inert preview: long values are visibly abbreviated.
            let args=response["candidate"]["args"].as_object()
                .ok_or(ProjectionError::InvalidProjection)?;
            if args.len()>12 { return Err(ProjectionError::InvalidProjection); }
            let mut fields=Vec::new();
            for (key, value) in args {
                if key.is_empty() || key.len()>96 ||
                    !key.bytes().all(|b|b.is_ascii_lowercase()||b.is_ascii_digit()||
                        matches!(b,b'.'|b'_'|b'-')) {
                    return Err(ProjectionError::InvalidProjection);
                }
                let text=value.as_str().filter(|v|
                    !v.is_empty() && v.encode_utf16().count()<=1000 &&
                    !v.chars().any(char::is_control))
                    .ok_or(ProjectionError::InvalidProjection)?;
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
                risk:Some(risk.into()),hint,
                registered:Some(true),readiness:Some(readiness.into()),
                executor_wired:Some(matches!(readiness,"source_wired"|"verified")),live_verified:Some(readiness=="verified"),
                catalog_revision,world_revision,wiki_revision,execution_authorized:false,effect_performed:false
            }))
        }
        "clarification_required" => {
            let question=response["question"].as_str()
                .filter(|s|!s.is_empty() && s.len()<=300 &&
                    !s.chars().any(char::is_control))
                .ok_or(ProjectionError::InvalidProjection)?;
            Ok(Some(ComposerMeaning {outcome:outcome.into(),
                action_id:None,risk:None,
            registered:None,readiness:None,executor_wired:None,live_verified:None,
            catalog_revision,world_revision,wiki_revision,execution_authorized:false,effect_performed:false,hint:format!("Needs clarification: {question}")}))
        }
        "incomplete" => Ok(Some(ComposerMeaning {
            outcome:outcome.into(),action_id:None,risk:None,
            registered:None,readiness:None,executor_wired:None,live_verified:None,
            catalog_revision,world_revision,wiki_revision,execution_authorized:false,effect_performed:false,
            hint:"Incomplete command · continue typing".into()
        })),
        // A deterministic non-match must be visible on the command surface:
        // never silently imply that an LLM was used or an effect was sent.
        "interpretation_required" => Ok(Some(ComposerMeaning {
            outcome:outcome.into(),action_id:None,risk:None,
            registered:None,readiness:None,executor_wired:None,live_verified:None,
            catalog_revision,world_revision,wiki_revision,execution_authorized:false,effect_performed:false,
            hint:"No deterministic command match · no action taken".into()
        })),
        "refused" => Ok(Some(ComposerMeaning {
            outcome:outcome.into(),action_id:None,risk:None,
            registered:None,readiness:None,executor_wired:None,live_verified:None,
            catalog_revision,world_revision,wiki_revision,execution_authorized:false,effect_performed:false,
            hint:"Command refused by Host policy · no action taken".into()
        })),
        "empty" => Ok(None),
        _ => Err(ProjectionError::InvalidProjection)
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ProjectionError { InvalidProjection }

/// Accept only an interpretation of the exact current draft. The UI also
/// fences asynchronous delivery against its own current edit epoch.
/// Registration and wiring are Host catalog claims, not live authority.
pub fn project_current_draft(text:&str,response:&Value)->Result<Option<ComposerMeaning>,ProjectionError>{
    if response["input"].as_str()!=Some(text) || text.trim()!=text ||
        text.is_empty() || text.encode_utf16().count()>1000 ||
        text.chars().any(char::is_control) {
        return Err(ProjectionError::InvalidProjection);
    }
    let reading=project_composer_meaning(response)?;
    if reading.as_ref().is_some_and(|m|m.outcome=="candidate" && m.catalog_revision.is_none()){
        return Err(ProjectionError::InvalidProjection);
    }
    Ok(reading)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn candidate()->Value{
        json!({"schema":"vivim.control-language/1","input":"create wiki page notes","outcome":"candidate",
          "candidate":{"actionId":"wiki.page.create","args":{"page":"notes"}},
          "feedback":{"worldV":12},
          "composer":{"schema":"vivim.composer-assist/1","authority":"none","catalogVersion":3,"wikiRevision":4,
            "action":{"id":"wiki.page.create","risk":"R1","readiness":"source_wired"}}})
    }
    #[test] fn separates_registered_wired_verified_and_authority(){
        let mut v=candidate();
        let text="create wiki page notes";
        let a=project_current_draft(text,&v).unwrap().unwrap();
        assert_eq!(a.registered,Some(true));assert_eq!(a.executor_wired,Some(true));assert_eq!(a.live_verified,Some(false));
        assert_eq!(a.catalog_revision,Some(3));assert_eq!(a.world_revision,Some(12));assert_eq!(a.wiki_revision,Some(4));
        assert!(!a.execution_authorized&&!a.effect_performed);
        v["composer"]["action"]["readiness"]=json!("adapter_pending");
        let a=project_current_draft(text,&v).unwrap().unwrap();
        assert_eq!(a.registered,Some(true));assert_eq!(a.executor_wired,Some(false));
        v["composer"]["action"]["readiness"]=json!("verified");
        let a=project_current_draft(text,&v).unwrap().unwrap();
        assert_eq!(a.live_verified,Some(true));assert!(!a.execution_authorized);
    }
    #[test] fn exact_current_draft_and_registration_required(){
        let mut v=candidate();
        assert!(project_current_draft("create wiki page work",&v).is_err());
        v["composer"]["catalogVersion"]=Value::Null;
        assert!(project_current_draft("create wiki page notes",&v).is_err());
        v=candidate();v["composer"]["action"]["id"]=json!("wiki.page.move");
        assert!(project_current_draft("create wiki page notes",&v).is_err());
    }
    #[test] fn unknown_is_not_unregistered_or_executable(){
        let mut v=candidate();v["outcome"]=json!("interpretation_required");
        let a=project_current_draft("create wiki page notes",&v).unwrap().unwrap();
        assert_eq!(a.registered,None);assert_eq!(a.executor_wired,None);assert!(!a.effect_performed);
    }
}
