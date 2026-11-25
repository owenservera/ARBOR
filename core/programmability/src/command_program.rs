//! Exact inert Host command-DAG compilation, ported from
//! apps/vivim-host/control/command-program.mjs.
//! @hq:capability vivim.rust-command-program@1
//! No effects, approval issuance, executor references or provider transport.
use serde_json::{Value,json};
use std::collections::{BTreeMap,BTreeSet};

const SCHEMA:&str="vivim.command-program/1";
fn obj<'a>(v:&'a Value,allowed:&[&str])->Option<&'a serde_json::Map<String,Value>>{
    let o=v.as_object()?;
    if o.keys().all(|k|allowed.contains(&k.as_str())){Some(o)}else{None}
}
// Optional catalog descriptions are not the source of action readiness.
fn valid_readiness_metadata(catalog:&Value)->bool{
    catalog.get("readinessStates").is_none_or(|metadata|
        obj(metadata,&["verified","source_wired","adapter_pending","enforcement_missing","unsupported"])
            .is_some_and(|entries|entries.values().all(|v|v.as_str().is_some())))
}
fn id(s:&str)->bool{
    let b=s.as_bytes();
    !b.is_empty()&&b.len()<=80&&b[0].is_ascii_lowercase()&&
    b[1..].iter().all(|x|x.is_ascii_lowercase()||x.is_ascii_digit()||b"._:-".contains(x))
}
fn valid_args(expected:&Value,actual:&Value)->bool{
    let (Some(a),Some(b))=(expected.as_object(),actual.as_object())else{return false};
    if a.len()!=b.len(){return false}
    a.iter().all(|(name,spec)|{
        let Some(value)=b.get(name).and_then(Value::as_str)else{return false};
        if value.is_empty()||value!=value.trim(){return false}
        match spec.get("type").and_then(Value::as_str){
            Some("enum")=>spec["values"].as_array()
                .is_some_and(|choices|choices.iter().any(|x|x.as_str()==Some(value))),
            Some("string")=>{
                let length=value.encode_utf16().count() as u64;
                let min=spec["min"].as_u64().filter(|n|*n<=9_007_199_254_740_991);
                let max=spec["max"].as_u64().filter(|n|*n<=9_007_199_254_740_991);
                match(min,max){(Some(min),Some(max))=>length>=min&&length<=max,_=>false}
            }
            _=>false
        }
    })
}
fn refused(reason:&str,step:Option<&str>)->Value{
    json!({"schema":SCHEMA,"outcome":"refused","reason":reason,
        "stepId":step,"executionAuthorized":false,"executionPerformed":false})
}
fn visit<'a>(id:&str,index:&BTreeMap<&'a str,&'a Value>,
    seen:&mut BTreeSet<String>,active:&mut BTreeSet<String>,
    ordered:&mut Vec<&'a Value>)->bool{
    if active.contains(id){return false}
    if seen.contains(id){return true}
    let Some(step)=index.get(id)else{return false};
    active.insert(id.to_owned());
    if let Some(deps)=step["dependsOn"].as_array(){
        for dep in deps{
            let Some(dep)=dep.as_str()else{return false};
            if !visit(dep,index,seen,active,ordered){return false}
        }
    }else{return false}
    active.remove(id);
    seen.insert(id.to_owned());ordered.push(step);
    true
}
pub fn compile(input:&Value)->Value{
    let steps=input["steps"].as_array();
    let catalog=&input["catalog"];
    let program_id=input.get("programId").and_then(Value::as_str).unwrap_or("command-program");
    let ver=catalog["version"].as_u64().filter(|n|*n<=9_007_199_254_740_991);
    if steps.is_none_or(|a|a.is_empty()||a.len()>32)||
        obj(catalog,&["schema","version","asOf","policy","actions","languageGroups","readinessStates"]).is_none()||
        !valid_readiness_metadata(catalog)||
        catalog["schema"]!="vivim.control-action-catalog/1"||ver.is_none()||
        !catalog["actions"].is_array()||!id(program_id){
        return refused("INVALID_PROGRAM",None)
    }
    if let Some(expected)=input.get("expectedCatalogVersion"){
        if expected.as_u64()!=ver{return refused("STALE_CATALOG",None)}
    }
    let steps=steps.unwrap();
    let mut index=BTreeMap::<&str,&Value>::new();
    for step in steps{
        let key=step.get("id").and_then(Value::as_str);
        let Some(key)=key else{return refused("INVALID_STEP",None)};
        if obj(step,&["id","actionId","args","dependsOn","onFailure"]).is_none()||
            !id(key)||!step["actionId"].is_string()||!step["args"].is_object()||
            step["dependsOn"].as_array().is_none_or(|a|a.len()>32)||
            step.get("onFailure").is_some_and(|a|a.as_str()!=Some("stop"))||
            index.contains_key(key){return refused("INVALID_STEP",Some(key))}
        let mut seen=BTreeSet::new();
        for dep in step["dependsOn"].as_array().unwrap(){
            let Some(dep)=dep.as_str()else{return refused("INVALID_STEP",Some(key))};
            if !id(dep)||!seen.insert(dep){return refused("INVALID_STEP",Some(key))}
        }
        index.insert(key,step);
    }
    let mut seen=BTreeSet::new();let mut active=BTreeSet::new();
    let mut ordered=Vec::new();
    for key in index.keys(){
        if !visit(key,&index,&mut seen,&mut active,&mut ordered){
            return refused("CYCLIC_OR_UNKNOWN_DEPENDENCY",Some(key))
        }
    }
    let mut compiled=Vec::new();let mut required=Vec::new();
    for step in ordered{
        let key=step["id"].as_str().unwrap_or("");
        let action_id=step["actionId"].as_str().unwrap_or("");
        let matches:Vec<&Value>=catalog["actions"].as_array().unwrap().iter()
            .filter(|a|a["id"].as_str()==Some(action_id)).collect();
        if matches.len()!=1{return refused("UNKNOWN_OR_DUPLICATE_ACTION",Some(key))}
        let action=matches[0];
        let risk=action["risk"].as_str();
        if !matches!(risk,Some("R0"|"R1"|"R2"|"R3"))||
            !valid_args(&action["args"],&step["args"]){
            return refused("INVALID_ACTION_ARGUMENTS",Some(key))
        }
        let readiness=action["readiness"].as_str();
        if !matches!(readiness,Some("source_wired"|"verified"))||risk==Some("R3"){
            return refused("UNAVAILABLE_ACTION",Some(key))
        }
        let needs_approval=risk!=Some("R0");
        if needs_approval{required.push(key.to_owned())}
        compiled.push(json!({
            "id":key,"actionId":action_id,"args":step["args"],
            "dependsOn":step["dependsOn"],"onFailure":"stop",
            "risk":risk,"needsApproval":needs_approval,"readiness":readiness,
            "executionAuthorized":false,"executionPerformed":false
        }));
    }
    json!({"schema":SCHEMA,"outcome":"compiled","program":{
        "id":program_id,"catalogVersion":ver,"steps":compiled,
        "requiredApprovalSteps":required,"ordering":"topological",
        "retryPolicy":"no-implicit-retry"
    },"executionAuthorized":false,"executionPerformed":false})
}

#[cfg(test)]
mod workstation_catalog_compatibility_tests {
    use super::*;
    fn input()->Value{
        let catalog:Value=serde_json::from_str(include_str!("../../../apps/vivim-host/control/action-catalog.v1.json")).unwrap();
        json!({"catalog":catalog,"expectedCatalogVersion":catalog["version"],
            "steps":[{"id":"observe","actionId":"vivim.status.show","args":{},"dependsOn":[]}]})
    }
    #[test]
    fn current_host_catalog_compiles_inert_status_program(){
        let result=compile(&input());
        assert_eq!(result["outcome"],"compiled");
        assert_eq!(result["executionAuthorized"],false);
        assert_eq!(result["program"]["steps"][0]["actionId"],"vivim.status.show");
    }
    #[test]
    fn readiness_description_cannot_promote_unavailable_action(){
        let mut req=input();
        req["catalog"]["readinessStates"]["unsupported"]=json!("execute everything");
        req["steps"][0]["actionId"]=json!("machine.network.disable_all");
        assert_eq!(compile(&req)["reason"],"UNAVAILABLE_ACTION");
    }
    #[test]
    fn unknown_catalog_fields_and_invalid_metadata_still_refuse(){
        let mut req=input();
        req["catalog"]["arbitraryExecutor"]=json!("shell");
        assert_eq!(compile(&req)["reason"],"INVALID_PROGRAM");
        let mut req=input();
        req["catalog"]["readinessStates"]=json!({"verified":true});
        assert_eq!(compile(&req)["reason"],"INVALID_PROGRAM");
    }
}
