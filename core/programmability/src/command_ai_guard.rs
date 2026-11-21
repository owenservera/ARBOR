//! Source-bound, deterministic AI command candidate decision in Rust.
//! @hq:capability vivim.rust-ai-command-guard@1
//! The Host supplies fresh source text, canonical action and a newly computed
//! NLCL reading. No authorization, model transport, grants or effects.
use serde_json::{json,Value};
use crate::command_intent_projection::{
    valid_catalog_action, checked_args, catalog_entry, valid_source_snapshot,
    personal_provenance_valid
};

const SCHEMA:&str="vivim.command-ai-proposal-guard/1";
const INTENT:&str="vivim.command-intent/0.1";
fn envelope(intent:Value)->Value{
    json!({"schema":SCHEMA,"outcome":"projected","intent":intent,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn refused(input:&Value,code:&str,message:&str)->Value{
    envelope(json!({"schema":INTENT,"outcome":"refused",
        "refusal":{"code":code,"message":message},"provenance":{
            "method":"deterministic-validation",
            "catalogRevision":input["catalogRevision"],
            "worldRevision":input["worldRevision"],"authority":"none"
        }}))
}
fn canonical(id:&str,args:&Value)->Option<String>{
    let values=args.as_object()?;
    let mut formatted=format!("/{id}");
    for (key,value) in values {
        let encoded=serde_json::to_string(value).ok()?;
        formatted.push(' ');
        formatted.push_str(key);
        formatted.push('=');
        formatted.push_str(&encoded);
    }
    Some(formatted)
}
pub fn validate(input:&Value)->Value{
    let source=&input["input"];
    if input["schema"]!="vivim.command-ai-proposal-guard-input/1"{
        return refused(source,"INVALID_CONTEXT","Invalid or stale command context.")
    }
    let proposal=&input["proposal"];
    let Some(fields)=proposal.as_object()else{
        return refused(source,"INVALID_AI_PROPOSAL","AI proposal shape is invalid.")
    };
    if fields.keys().any(|key|!matches!(key.as_str(),
        "actionId"|"args"|"rationale"|"uncertainty")){
        return refused(source,"INVALID_AI_PROPOSAL","AI proposal shape is invalid.")
    }
    if let Some(rationale)=fields.get("rationale"){
        if !rationale.as_str().is_some_and(|text|text.encode_utf16().count()<=500){
            return refused(source,"INVALID_AI_PROPOSAL","AI proposal shape is invalid.")
        }
    }
    if let Some(uncertainty)=fields.get("uncertainty"){
        if !uncertainty.as_f64().is_some_and(|n|n.is_finite()&&(0.0..=1.0).contains(&n)){
            return refused(source,"INVALID_AI_PROPOSAL","AI proposal shape is invalid.")
        }
    }
    let reading=&input["reading"];
    if !valid_source_snapshot(source,&input["catalogVersion"],&input["worldRevision"],true){
        return refused(source,"UNSAFE_OR_UNRESOLVED_TEXT",
            "Owner text must be clarified before proposing an action.")
    }
    // NLCL's compiler/world/confidence stamps must match projected provenance.
    // This is inert consistency validation, never independent text parsing.
    let feedback=&reading["language"]["feedback"];
    if !feedback.is_object() ||
        !feedback["nlclVersion"].as_str().is_some_and(|s|!s.is_empty()&&s.len()<=128) ||
        input.get("worldNlclVersion").is_some_and(|v|
            !v.as_str().is_some_and(|s|!s.is_empty()&&s.len()<=128) ||
            *v != feedback["nlclVersion"]) ||
        !feedback["confidence"].as_f64().is_some_and(|n|n.is_finite()&&(0.0..=1.0).contains(&n)) ||
        feedback["worldV"]!=input["worldRevision"] ||
        reading["provenance"]["engineVersion"]!=feedback["nlclVersion"] ||
        reading["provenance"]["confidence"]!=feedback["confidence"] ||
        reading["language"].get("personalRule")!=reading["provenance"].get("personalRule"){
        return refused(source,"UNSAFE_OR_UNRESOLVED_TEXT",
            "Owner text must be clarified before proposing an action.")
    }
    // The Host supplies the freshly compiled owner reading; this is still
    // untrusted at the Rust entry point. A model-supplied or stale projection
    // cannot carry a forged grant, substitute a different surface, or impersonate
    // another catalog/world snapshot.
    if reading["schema"]!=INTENT ||
        reading["provenance"]["authority"]!="none" ||
        reading["provenance"]["catalogRevision"]!=input["catalogVersion"] ||
        reading["provenance"]["worldRevision"]!=input["worldRevision"] ||
        reading["provenance"]["audience"]!=source["audience"] ||
        reading["provenance"]["surface"]!=source["scope"] ||
        reading.get("authorization").is_some() ||
        reading.get("approval").is_some() ||
        reading["language"].get("authorization").is_some() ||
        reading["language"].get("approval").is_some() ||
        reading["provenance"].get("authorization").is_some() ||
        reading["provenance"].get("approval").is_some() ||
        reading.get("executionAuthorized").is_some_and(|v|v.as_bool()!=Some(false)) ||
        reading.get("effectPerformed").is_some_and(|v|v.as_bool()!=Some(false)) {
        return refused(source,"UNSAFE_OR_UNRESOLVED_TEXT",
            "Owner text must be clarified before proposing an action.")
    }
    let Some(outcome)=reading["outcome"].as_str()else{
        return refused(source,"UNSAFE_OR_UNRESOLVED_TEXT",
            "Owner text must be clarified before proposing an action.")
    };
    if !matches!(outcome,"candidate"|"clarification_required"|
        "interpretation_required"|"refused")||
        matches!(outcome,"refused"|"clarification_required"){
        return refused(source,"UNSAFE_OR_UNRESOLVED_TEXT",
            "Owner text must be clarified before proposing an action.")
    }
    let personal=reading["language"].get("personalRule").unwrap_or(&Value::Null);
    let method=reading["provenance"]["method"].as_str();
    // Only the incumbent language compiler or a Host-bound accepted personal
    // rule may produce a candidate. Ambiguity and refusals never become AI
    // proposals and an unverified personal rule is not an authorization.
    let accepted_method=if personal.is_null(){
        method==Some("deterministic-nlcl")
    } else {
        outcome=="candidate" && method==Some("accepted-personal-rule") &&
        personal["method"]=="accepted-personal-rule" &&
        personal_provenance_valid(personal,&input["catalogVersion"],&source["text"])
    };
    if !accepted_method || (outcome=="interpretation_required" && !personal.is_null()){
        return refused(source,"UNSAFE_OR_UNRESOLVED_TEXT",
            "Owner text must be clarified before proposing an action.")
    }
    let Some(action_id)=proposal["actionId"].as_str()else{
        return refused(source,"AI_ACTION_NOT_ALLOWED",
            "AI may only propose catalog-approved action IDs.")
    };
    if outcome=="candidate"&&reading["actionId"]!=action_id{
        return refused(source,"CONFLICTING_ACTION",
            "AI proposal conflicts with the deterministic reading.")
    }
    let action=&input["action"];
    if action["id"]!=action_id||action["aiCandidate"]==false||
        !action.get("aiCandidate").map_or(true, Value::is_boolean)||
        !valid_catalog_action(action) ||
        catalog_entry(&input["catalogActions"],action_id)!=Some(action){
        return refused(source,"AI_ACTION_NOT_ALLOWED",
            "AI may only propose catalog-approved action IDs.")
    }
    // JavaScript incumbent uses proposal.args ?? {}. Both omitted and
    // explicit null select the empty object, important for zero-arg actions.
    let args=proposal.get("args").unwrap_or(&Value::Null);
    let blank=json!({});
    let args=if args.is_null(){&blank}else{args};
    // Use the SAME Host-parity catalog argument validator as command
    // projection. A second validator may disagree on Unicode whitespace
    // or string length and refuse a valid owner-bound zero-argument action.
    let Some(args)=checked_args(action,args)else{
        return refused(source,"INVALID_ARGS","AI proposed invalid or missing arguments.")
    };
    let Some(expression)=canonical(action_id,&args)else{
        return refused(source,"INVALID_ARGS","AI proposed invalid or missing arguments.")
    };
    if outcome=="candidate"&&reading["canonical"]!=expression{
        return refused(source,"CONFLICTING_ARGUMENTS",
            "AI proposal changes arguments already resolved from owner text.")
    }
    // A matching action ID cannot carry forged risk, scopes or readiness.
    let expected_scopes=action.get("requiredScopes").cloned().unwrap_or_else(||json!([]));
    if outcome=="candidate" && (reading["args"]!=args ||
        reading["risk"]!=action["risk"] ||
        reading["requiredScopes"]!=expected_scopes ||
        reading["owner"]!=action["owner"] ||
        reading["readiness"]!=action["readiness"]){
        return refused(source,"UNSAFE_OR_UNRESOLVED_TEXT",
            "Owner text must be clarified before proposing an action.")
    }
    let Some(version)=input["catalogVersion"].as_u64()else{
        return refused(source,"INVALID_CONTEXT","Invalid or stale command context.")
    };
    let world=&input["worldRevision"]; // exact safe integer, not float recoding
    let rationale=proposal.get("rationale").unwrap_or(&Value::Null);
    let uncertainty=proposal.get("uncertainty").unwrap_or(&Value::Null);
    let scopes=action["requiredScopes"].as_array().cloned().unwrap_or_default();
    envelope(json!({
        "schema":INTENT,"outcome":"candidate","actionId":action_id,
        "args":args,"canonical":expression,
        "risk":action["risk"],"requiredScopes":scopes,
        "owner":action["owner"],"readiness":action["readiness"],
        "provenance":{
            "method":"bounded-ai-proposal","engineVersion":null,
            "catalogRevision":version,"worldRevision":world,
            "audience":source.get("audience").unwrap_or(&json!("owner")),
            "surface":source.get("scope").unwrap_or(&json!("text")),
            "confidence":null,"authority":"none",
            "rationale":rationale,"uncertainty":uncertainty
        }
    }))
}
