//! Deterministic Host typed-plan and bounded AI-candidate projection.
//! @hq:capability vivim.rust-control-planning@1
//! A caller-supplied catalog action is data, not authority. This module
//! never approves, issues grants, performs effects, or persists plans.
use serde_json::{json,Value};
const SCHEMA:&str="vivim.control-plan-projection/1";
fn refused(code:&str)->Value {
    json!({"schema":SCHEMA,"outcome":"refused","code":code,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn planned(plan:Value)->Value{
    json!({"schema":SCHEMA,"outcome":"planned","plan":plan,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn safe_string(value:&Value)->Option<&str>{
    value.as_str().filter(|s|!s.is_empty()&&s==&s.trim())
}
fn is_source(value:&str)->bool{
    matches!(value,"text"|"desktop"|"mobile"|"visual")
}
fn utf16_length(s:&str)->usize{s.encode_utf16().count()}
fn validate_args(action:&Value,args:&Value)->Result<Value,&'static str>{
    let Some(specs)=action["args"].as_object()else{return Err("CONTROL_ARGS_INVALID")};
    let Some(values)=args.as_object()else{return Err("CONTROL_ARGS_INVALID")};
    if specs.len()!=values.len()||values.keys().any(|key|!specs.contains_key(key)){
        return Err("CONTROL_ARGS_INVALID")
    }
    let mut normalized=serde_json::Map::new();
    for (key,spec) in specs{
        let Some(value)=values.get(key).and_then(safe_string)
            else{return Err("CONTROL_ARGS_INVALID")};
        let allowed=match spec["type"].as_str(){
            Some("enum")=>spec["values"].as_array()
                .is_some_and(|values|values.iter().any(|choice|choice==value)),
            Some("string")=>match(spec["min"].as_u64(),spec["max"].as_u64()){
                (Some(min),Some(max))=>{
                    let length=utf16_length(value) as u64;
                    length>=min&&length<=max
                },
                _=>false,
            },
            _=>false,
        };
        if !allowed{return Err("CONTROL_ARGS_INVALID")}
        normalized.insert(key.clone(),json!(value));
    }
    Ok(Value::Object(normalized))
}
fn project(action:&Value,args:&Value,source:&str,origin:&str)->Result<Value,&'static str>{
    if !is_source(source){return Err("CONTROL_SOURCE_INVALID")}
    let Some(action_id)=action["id"].as_str()
        else{return Err("CONTROL_ACTION_UNKNOWN")};
    let Some(risk)=action["risk"].as_str()
        .filter(|risk|matches!(*risk,"R0"|"R1"|"R2"|"R3"))
        else{return Err("CONTROL_NATIVE_PLAN_INVALID")};
    let Some(readiness)=action["readiness"].as_str()
        .filter(|status|matches!(*status,"adapter_pending"|"enforcement_missing"|
            "unsupported"|"source_wired"|"verified"))
        else{return Err("CONTROL_NATIVE_PLAN_INVALID")};
    let normalized=validate_args(action,args)?;
    let runnable=matches!(readiness,"source_wired"|"verified");
    let mut plan=json!({
        "schema":"vivim.control-plan/1","source":source,"origin":origin,
        "actionId":action_id,"title":action["title"],"args":normalized,
        "target":action["target"],"risk":risk,"readiness":readiness,
        "liveAcceptance":if readiness=="verified"{"verified"}else{"pending"},
        "outcome":if !runnable{"unavailable"}else if risk=="R0"{"ready"}
            else{"approval_required"},
        "requiresApproval":risk!="R0","executorStatus":readiness,
        "reversible":action["reversible"]==true,
        "executionPerformed":false
    });
    if let Some(undo)=action["undo"]["actionId"].as_str(){
        plan["undoActionId"]=json!(undo);
    }
    if let Some(precondition)=action["precondition"].as_str()
        .filter(|value|!value.is_empty()){
        plan["precondition"]=json!(precondition);
    }
    Ok(plan)
}
pub fn typed(input:&Value)->Value{
    if input["schema"]!="vivim.control-typed-plan-input/1"{
        return refused("CONTROL_NATIVE_PLAN_INVALID")
    }
    let Some(source)=input["source"].as_str()else{return refused("CONTROL_SOURCE_INVALID")};
    if !is_source(source){return refused("CONTROL_SOURCE_INVALID")}
    let Some(origin)=input["origin"].as_str()else{return refused("CONTROL_NATIVE_PLAN_INVALID")};
    if origin.is_empty(){return refused("CONTROL_NATIVE_PLAN_INVALID")}
    let Some(id)=input["actionId"].as_str()else{return refused("CONTROL_ACTION_UNKNOWN")};
    if input["action"]["id"]!=id{return refused("CONTROL_ACTION_UNKNOWN")}
    match project(&input["action"],&input["args"],source,origin){
        Ok(plan)=>planned(plan),Err(code)=>refused(code)
    }
}
pub fn candidate(input:&Value)->Value{
    if input["schema"]!="vivim.control-candidate-plan-input/1"{
        return refused("CONTROL_CANDIDATE_INVALID")
    }
    let Some(source)=input["source"].as_str()else{return refused("CONTROL_SOURCE_INVALID")};
    if !is_source(source){return refused("CONTROL_SOURCE_INVALID")}
    let Some(proposal)=input["candidate"].as_object()else{
        return refused("CONTROL_CANDIDATE_INVALID")
    };
    if proposal.keys().any(|key|!matches!(key.as_str(),
        "actionId"|"args"|"rationale"|"uncertainty")){
        return refused("CONTROL_CANDIDATE_INVALID")
    }
    if let Some(rationale)=proposal.get("rationale"){
        if !rationale.as_str().is_some_and(|s|utf16_length(s)<=500){
            return refused("CONTROL_CANDIDATE_INVALID")
        }
    }
    if let Some(uncertainty)=proposal.get("uncertainty"){
        if !uncertainty.as_f64().is_some_and(|n|n.is_finite()&&(0.0..=1.0).contains(&n)){
            return refused("CONTROL_CANDIDATE_INVALID")
        }
    }
    let Some(id)=proposal.get("actionId").and_then(Value::as_str)
        else{return refused("CONTROL_ACTION_UNKNOWN")};
    if input["action"]["id"]!=id{return refused("CONTROL_ACTION_UNKNOWN")}
    if input["action"]["aiCandidate"]==false{
        return refused("CONTROL_CANDIDATE_REFUSED")
    }
    let args=proposal.get("args").unwrap_or(&Value::Null);
    let empty=json!({});
    let args=if args.is_null()&&proposal.get("args").is_none(){&empty}else{args};
    match project(&input["action"],args,source,"ai_candidate"){
        Ok(mut plan)=>{
            plan["requiresApproval"]=json!(true);
            if plan["outcome"]=="ready"{plan["outcome"]=json!("approval_required");}
            plan["candidate"]=json!({
                "rationale":proposal.get("rationale").unwrap_or(&Value::Null),
                "uncertainty":proposal.get("uncertainty").unwrap_or(&Value::Null)
            });
            planned(plan)
        },
        Err(code)=>refused(code),
    }
}
