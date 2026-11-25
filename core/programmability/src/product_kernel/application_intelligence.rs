//! Native implementation of the existing Studio Craft R003 read-only projection.
//! @hq:capability vivim.application-intelligence-native@1
//! No browser, storage, network, credentials, or effect authority. The Host
//! compatibility adapter compares this result with the incumbent projection.
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

type Res<T> = Result<T, &'static str>;
const BAD: &str = "CRAFT_ATLAS_REJECTED";
const RECON: &str = "CRAFT_RECONCILIATION_REJECTED";
fn hex(s: &str, n: usize) -> bool {
    s.len() == n && s.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn ident(s: &str, max: usize, extra: &[u8], first: impl Fn(u8) -> bool) -> bool {
    !s.is_empty() && s.len() <= max && first(s.as_bytes()[0]) &&
        s.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || extra.contains(&b))
}
fn site(s: &str) -> bool { ident(s, 80, b"-", |b| b.is_ascii_lowercase() || b.is_ascii_digit()) }
fn evidence_id(s: &str) -> bool { s.strip_prefix("ev_").is_some_and(|h| hex(h, 64)) }
fn arr<'a>(v: &'a Value, key: &str, max: usize, err: &'static str) -> Res<&'a Vec<Value>> {
    v.get(key).and_then(Value::as_array).filter(|a| a.len() <= max).ok_or(err)
}
fn string<'a>(v: &'a Value, key: &str, err: &'static str) -> Res<&'a str> {
    v.get(key).and_then(Value::as_str).ok_or(err)
}
fn inert(v: &Value) -> bool {
    v["executionAuthorized"] == false && v["activationPermitted"] == false && v["sendPermission"] == false
}
// Conservative canonical ASCII HTTP(S) subset; no URL library added to the
// core. Unsupported origins stay on the incumbent JS path in shadow mode.
fn origin(s: &str) -> bool {
    let (hostport, default) = if let Some(h) = s.strip_prefix("https://") { (h, 443) }
        else if let Some(h) = s.strip_prefix("http://") { (h, 80) } else { return false };
    let (host, port) = if let Some((h,p)) = hostport.split_once(':') {
        let Ok(n) = p.parse::<u16>() else {return false};
        if n == default || n.to_string() != p {return false} (h,Some(n))
    } else { (hostport,None) };
    let _ = port;
    if host.is_empty() || host.len() > 253 {return false}
    if let Ok(ip) = host.parse::<std::net::Ipv4Addr>() {return ip.to_string() == host}
    host.split('.').all(|part| !part.is_empty() && part.len() <= 63 &&
        !part.starts_with('-') && !part.ends_with('-') &&
        part.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')) &&
        host.rsplit('.').next().is_some_and(|p| !p.bytes().all(|b| b.is_ascii_digit()))
}
fn qualifier<'a>(v: &'a Value, k: &str, accepted: &[&str]) -> Res<&'a str> {
    if v[k].is_null() { return Ok("unknown") }
    let s = string(v,k,BAD)?;
    if !accepted.contains(&s) {return Err(BAD)} Ok(s)
}
fn add(m: &mut BTreeMap<String, usize>, key: &str) { *m.entry(key.into()).or_default() += 1; }
fn rows(m: BTreeMap<String,usize>, name: &str) -> Vec<Value> {
    m.into_iter().map(|(k,n)| {let mut v=json!({"count":n});v[name]=json!(k);v}).collect()
}

pub(super) fn project(input: &Value) -> Res<Value> {
    let a=&input["atlas"];
    let r=&input["reconciliation"];
    if !a.is_object() || a["schema"]!="vivim.application-surface-atlas/0.1" ||
        !a["target"].is_object() || !a["source"].is_object() ||
        a["source"]["producer"]!="craft-anything" || a["source"]["version"]!=1 || !inert(&a["authority"]) {return Err(BAD)}
    let site_id=string(&a["target"],"siteId",BAD)?;
    let site_origin=string(&a["target"],"origin",BAD)?;
    if !site(site_id) || !origin(site_origin) {return Err(BAD)}
    let digest=&a["source"]["bundleDigest"];
    if !digest.is_null() && !digest.as_str().is_some_and(|s| hex(s,64)) {return Err(BAD)}
    let es=arr(a,"evidence",2500,BAD)?;
    let cs=arr(a,"controls",5000,BAD)?;
    let os=arr(a,"observations",10000,BAD)?;
    let us=arr(a,"unknownIds",2500,BAD)?;
    let mut ids=BTreeSet::new();
    let (mut operations,mut roles,mut confidence,mut coverage,mut kinds) =
        (BTreeMap::new(),BTreeMap::new(),BTreeMap::new(),BTreeMap::new(),BTreeMap::new());
    let mut evidence=Vec::with_capacity(es.len());
    for x in es {
        let id=string(x,"evidenceId",BAD)?;
        let op=string(x,"operation",BAD)?;
        if !evidence_id(id) || !ids.insert(id) || !ident(op,100,b"_:-", |_| true) {return Err(BAD)}
        let q=qualifier(x,"confidence",&["observed","derived","inferred"])?;
        let cv=qualifier(x,"coverage",&["complete","partial","unknown"])?;
        add(&mut operations,op);add(&mut confidence,q);add(&mut coverage,cv);
        evidence.push(json!({"evidenceId":id,"operation":op,"confidence":q,"coverage":cv,
            "limitations":x["limitationCodes"].as_array().map_or(0,|a|a.len().min(25)),
            "cleanRoom":x["cleanRoom"]==true}));
    }
    for x in cs {
        let id=string(x,"sourceEvidenceId",BAD)?;
        let role=string(x,"role",BAD)?;
        if !ids.contains(id) || !ident(role,32,b"-",|b|b.is_ascii_lowercase()) ||
            x["effectAuthorized"]!=false || x["locatorVerified"]!=false {return Err(BAD)}
        add(&mut roles,role);
    }
    for x in os {
        let id=string(x,"evidenceId",BAD)?;
        let k=string(x,"kind",BAD)?;
        if !ids.contains(id) || x["effectAuthorized"]!=false ||
            !matches!(k,"website-capture"|"capture-artifact"|"state-capture"|"interaction-state"|"state-artifact"|"walkthrough"|"walkthrough-step"|"accessibility-summary") {return Err(BAD)}
        add(&mut kinds,k);
    }
    let recon=if r.is_null() {
        json!({"status":"not-provided","sourceDivergences":0,"unmappedCount":0,"features":[]})
    } else {
        if !r.is_object() || r["schema"]!="vivim.application-surface-reconciliation/1" ||
            r["target"]["siteId"]!=site_id || r["target"]["origin"]!=site_origin ||
            r["authority"]["executionAuthorized"]!=false || r["authority"]["activationPermitted"]!=false ||
            r["authority"]["sendPermission"]==true {return Err(RECON)}
        let fs=arr(r,"features",400,RECON)?;
        let ds=arr(r,"divergences",400,RECON)?;
        let mut features=Vec::with_capacity(fs.len());
        for f in fs {
            let owner=match f["owner"].as_str(){Some("studio")=>"studio",Some("harness")=>"harness",_=>"unknown"};
            let feature=f["featureId"].as_str().filter(|s|ident(s,100,b".-",|_|true)).unwrap_or("unknown");
            let status=match f["observationStatus"].as_str(){Some("label-correspondence-unverified")=>"label-correspondence-unverified",
                Some("not-observed-in-scoped-capture")=>"not-observed-in-scoped-capture",_=>"unknown"};
            let mut refs=BTreeSet::new();
            if let Some(rr)=f["evidenceRefs"].as_array(){
                for x in rr.iter().take(2500) {
                    let Some(id)=x["evidenceId"].as_str().filter(|s|ids.contains(s)) else {continue};
                    // Real reconciliation uses integer control positions or null.
                    // Reject noncanonical values rather than guessing JS coercion.
                    let pos=if x["position"].is_null(){String::new()}else if let Some(n)=x["position"].as_u64(){n.to_string()}
                        else{return Err(RECON)};
                    refs.insert((id,pos));
                }
            }
            features.push(json!({"owner":owner,"featureId":feature,"observationStatus":status,"evidenceCount":refs.len()}));
        }
        json!({"status":"source-reconciled-not-runtime-verified","sourceDivergences":ds.len(),
            "unmappedCount":r["unmapped"].as_array().map_or(0,Vec::len),"features":features})
    };
    let states=kinds.get("interaction-state").copied().unwrap_or(0)+kinds.get("state-capture").copied().unwrap_or(0);
    let projection=json!({"schema":"vivim.studio-craft-intelligence/1","status":"external-evidence-readonly",
        "target":{"siteId":site_id,"origin":site_origin},"source":{"producer":"craft-anything","bundleDigest":digest,
        "nativeVerified":a["source"]["nativeVerified"]==true,"verificationAuthority":"unattested-external-report","coverage":"bounded-observations-only"},
        "counts":{"evidence":es.len(),"controls":cs.len(),"observations":os.len(),"states":states,"unknowns":us.len()},
        "roles":rows(roles,"role"),"operations":rows(operations,"operation"),"observationKinds":rows(kinds,"kind"),
        "confidence":rows(confidence,"confidence"),"coverage":rows(coverage,"coverage"),"evidence":evidence,
        "reconciliation":recon,"authority":{"executionAuthorized":false,"activationPermitted":false,"sendPermission":false},
        "note":"Discovery only; no labels, selectors, private content or executable operations are returned."});
    Ok(json!({"schema":"vivim.application-intelligence-native/1","executionAuthorized":false,"projection":projection}))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn input()->Value {
        let id=format!("ev_{}","a".repeat(64));
        json!({"atlas":{"schema":"vivim.application-surface-atlas/0.1","target":{"siteId":"chatgpt","origin":"https://chatgpt.com"},
            "source":{"producer":"craft-anything","version":1,"bundleDigest":"b".repeat(64),"nativeVerified":true},
            "evidence":[{"evidenceId":id,"operation":"web_site_capture","confidence":"observed","coverage":"partial","cleanRoom":true,"private":"secret"}],
            "controls":[{"sourceEvidenceId":id,"role":"button","effectAuthorized":false,"locatorVerified":false,"label":"secret"}],
            "observations":[{"evidenceId":id,"kind":"interaction-state","effectAuthorized":false}],"unknownIds":[],
            "authority":{"executionAuthorized":false,"activationPermitted":false,"sendPermission":false}}})
    }
    #[test] fn projection_is_inert_and_minimized(){let r=project(&input()).unwrap();assert_eq!(r["projection"]["counts"]["states"],1);
        assert_eq!(r["projection"]["roles"][0]["role"],"button");assert_eq!(r["executionAuthorized"],false);
        assert_eq!(r["projection"]["source"]["verificationAuthority"],"unattested-external-report");assert!(!r.to_string().contains("secret"));}
    #[test] fn rejects_authority_and_unbound_controls(){let mut i=input();i["atlas"]["authority"]["sendPermission"]=json!(true);assert_eq!(project(&i),Err(BAD));
        let mut i=input();i["atlas"]["controls"][0]["sourceEvidenceId"]=json!(format!("ev_{}","c".repeat(64)));assert_eq!(project(&i),Err(BAD));}
    #[test] fn rejects_duplicate_and_unsafe_origin(){let mut i=input();let duplicate=i["atlas"]["evidence"][0].clone();i["atlas"]["evidence"].as_array_mut().unwrap().push(duplicate);assert_eq!(project(&i),Err(BAD));
        let mut i=input();i["atlas"]["target"]["origin"]=json!("https://chatgpt.com/private");assert_eq!(project(&i),Err(BAD));}
    #[test] fn accepts_owned_loopback(){let mut i=input();i["atlas"]["target"]["origin"]=json!("http://127.0.0.1:43187");assert!(project(&i).is_ok());}
    #[test] fn reconciliation_counts_only_bound_refs(){let mut i=input();let id=i["atlas"]["evidence"][0]["evidenceId"].clone();
        i["reconciliation"]=json!({"schema":"vivim.application-surface-reconciliation/1","target":i["atlas"]["target"],"authority":{"executionAuthorized":false,"activationPermitted":false},
            "features":[{"owner":"studio","featureId":"chat.composer","evidenceRefs":[{"evidenceId":id,"position":1},{"evidenceId":id,"position":1},{"evidenceId":"unknown"}]}],"divergences":[]});
        assert_eq!(project(&i).unwrap()["projection"]["reconciliation"]["features"][0]["evidenceCount"],1);}
}
