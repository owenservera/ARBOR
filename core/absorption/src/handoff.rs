//! Workers suggest capabilities; the master owns primitive revisions and Host owns effects.
use crate::discovery::Scope;
use serde::{Deserialize,Serialize};
use serde_json::{Value,json};
use std::collections::BTreeSet;
#[derive(Deserialize,Serialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
pub struct Handoff {
    pub schema:String,
    pub scope:Scope,
    pub source_id:String,
    pub candidates:Vec<Candidate>,
}
#[derive(Deserialize,Serialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
pub struct Candidate {
    pub primitive_id:String,
    pub surface_id:String,
    pub evidence_refs:Vec<String>,
}
fn ident(s:&str,max:usize)->bool{
    !s.is_empty()&&s.len()<=max&&s.bytes().all(|b|b.is_ascii_lowercase()||b.is_ascii_digit()||matches!(b,b'.'|b'-'|b'_'))
        &&s.split('.').all(|x|!x.is_empty())
}
pub fn validate(h:&Handoff,source:&Value)->Result<Value,&'static str>{
    if h.schema!="vivim.absorption-semantic-handoff/1"||h.candidates.len()>2500{return Err("HANDOFF_INVALID")}
    let (scope,refs)=match source["schema"].as_str(){
        Some("vivim.absorption-observation/1")=>{
            let d=&source["discovery"];
            let refs=d["evidence"].as_array().ok_or("SOURCE_INVALID")?.iter()
                .filter(|e|e["confidence"]=="observed")
                .filter_map(|e|e["evidenceId"].as_str().map(str::to_owned)).collect::<BTreeSet<_>>();
            (&d["scope"],refs)
        },
        Some("vivim.absorption-uia-observation/1")=>{
            let refs=source["observations"].as_array().ok_or("SOURCE_INVALID")?.iter()
                .filter_map(|e|e["ordinal"].as_u64().map(|n|format!("uia:{n}"))).collect();
            (&source["scope"],refs)
        },
        _=>return Err("SOURCE_KIND_INVALID")
    };
    if scope["siteId"]!=h.scope.site_id||scope["origin"]!=h.scope.origin{return Err("HANDOFF_SCOPE_MISMATCH")}
    let mut seen=BTreeSet::new();
    for c in &h.candidates{
        if !ident(&c.primitive_id,160)||!c.primitive_id.contains('.')||!ident(&c.surface_id,100)
            ||!seen.insert((&c.primitive_id,&c.surface_id))||c.evidence_refs.is_empty()||c.evidence_refs.len()>64
            ||c.evidence_refs.iter().collect::<BTreeSet<_>>().len()!=c.evidence_refs.len()
            ||c.evidence_refs.iter().any(|e|!refs.contains(e)){return Err("HANDOFF_CANDIDATE_INVALID")}
    }
    Ok(json!({"schema":"vivim.absorption-semantic-candidates/1","scope":h.scope,"sourceId":h.source_id,
        "candidates":h.candidates,"status":"proposed-not-verified",
        "authority":{"executionAuthorized":false,"activationPermitted":false,"sendPermission":false}}))
}
