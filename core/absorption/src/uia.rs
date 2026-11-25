//! Legacy UIA baseline is a separate evidence source, not a Craft atlas.
use crate::discovery::Scope;
use serde_json::{Value,json};
use sha2::{Digest,Sha256};

pub fn normalize_facebook(input:&[u8],scope:&Scope)->Result<Value,&'static str>{
    if input.len()>4*1024*1024{return Err("SIZE_LIMIT")}
    if scope.site_id!="facebook"||scope.origin!="https://www.facebook.com"{return Err("UIA_SCOPE_MISMATCH")}
    let v:Value=serde_json::from_slice(input).map_err(|_|"UIA_JSON_INVALID")?;
    if v["schema"]!="vivim.facebook-uia-observation/1"||v["executionAuthorized"]!=false||
        v["privateContentPersisted"]!=false{return Err("UIA_SOURCE_REJECTED")}
    let site=v["site"].as_str().ok_or("UIA_SITE_INVALID")?;
    let site=site.to_ascii_lowercase();
    if !matches!(site.trim_end_matches('/'),"facebook"|"www.facebook.com"|"https://www.facebook.com"|"https://facebook.com"){
        return Err("UIA_SITE_INVALID")
    }
    let rows=v["observations"].as_array().filter(|a|!a.is_empty()&&a.len()<=2500).ok_or("UIA_ROWS_INVALID")?;
    let mut observations=Vec::new();
    for (index,o) in rows.iter().enumerate(){
        let nodes=o["nodes"].as_u64().filter(|n|*n<=1_000_000).ok_or("UIA_NODES_INVALID")?;
        let controls=o["controls"].as_array().filter(|a|a.len()<=5000&&a.iter().all(Value::is_string)).ok_or("UIA_CONTROLS_INVALID")?;
        if !o["surface"].as_str().is_some_and(|s|!s.is_empty()&&s.len()<=200){return Err("UIA_SURFACE_INVALID")}
        // Surface and control text remain at the private source. A later scoped handoff
        // can propose semantic identifiers referencing these exact source ordinals.
        observations.push(json!({"ordinal":index,"nodeCount":nodes,"controlCount":controls.len()}));
    }
    Ok(json!({"schema":"vivim.absorption-uia-observation/1","scope":scope,
        "source":{"schema":"vivim.facebook-uia-observation/1","sha256":format!("{:x}",Sha256::digest(input)),
            "trust":"unattested-local-observation"},"observations":observations,
        "authority":{"executionAuthorized":false,"activationPermitted":false,"sendPermission":false}}))
}
