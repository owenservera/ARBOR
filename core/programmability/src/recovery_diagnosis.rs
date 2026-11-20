//! Evidence-only Host recovery diagnosis, ported from recovery/intelligence.mjs.
//! @hq:capability vivim.rust-recovery-diagnosis@1
//! No watchdog, restart, resend, lock takeover, approvals or effects.
use serde_json::{Value,json};

#[derive(Clone,Copy)]
struct Signature{target:&'static str,evidence:&'static str,hypothesis:&'static str}
fn signature(code:&str)->Option<Signature>{
    Some(match code{
        "NO_HEARTBEAT"=>Signature{target:"worker",evidence:"missing_heartbeat",hypothesis:"worker not observed; process death not established"},
        "HEARTBEAT_STALE"=>Signature{target:"worker",evidence:"stale_heartbeat",hypothesis:"worker may be delayed, disconnected or stopped"},
        "WORKER_CYCLE_FAILED"=>Signature{target:"worker",evidence:"worker_cycle_error",hypothesis:"worker reported an unsuccessful cycle"},
        "PROCESS_ENDED"=>Signature{target:"worker",evidence:"process_exit",hypothesis:"process exited; pending effects may be uncertain"},
        "HOST_TRANSPORT_DISCONNECTED"=>Signature{target:"worker",evidence:"transport_disconnected",hypothesis:"transport may be offline, expired or owned by a dead worker"},
        "CONTROL_UNCERTAIN"=>Signature{target:"control",evidence:"control_claim_without_receipt",hypothesis:"claimed effect has no terminal receipt; outcome unknown"},
        "SEND_OUTCOME_UNCERTAIN"=>Signature{target:"control",evidence:"send_outcome_uncertain",hypothesis:"provider send may have occurred; do not resend"},
        "PHONE_PROJECTION_STALE"=>Signature{target:"world",evidence:"revision_gap",hypothesis:"phone projection may lag the authoritative World"},
        "GRANT_REVOKED"=>Signature{target:"world",evidence:"grant_revocation",hypothesis:"permission is revoked; cached sensitive projections must not be restored"},
        "SCHEMA_MISMATCH"=>Signature{target:"world",evidence:"schema_mismatch",hypothesis:"consumer and publisher schemas may be incompatible"},
        "WORLD_REVISION_CONFLICT"=>Signature{target:"world",evidence:"revision_conflict",hypothesis:"World revision conflict needs canonical state inspection"},
        _=>return None
    })
}
fn id(s:&str)->bool{
    !s.is_empty()&&s.len()<=100&&s.bytes().all(|b|b.is_ascii_alphanumeric()||b"_.:-".contains(&b))
}
fn digit(b:&[u8],from:usize,to:usize)->Option<u32>{
    let s=std::str::from_utf8(b.get(from..to)?).ok()?;
    if !s.bytes().all(|c|c.is_ascii_digit()){return None}
    s.parse().ok()
}
fn time(s:&str)->bool{
    let b=s.as_bytes();
    if b.len()!=24||b[4]!=b'-'||b[7]!=b'-'||b[10]!=b'T'||b[13]!=b':'||
        b[16]!=b':'||b[19]!=b'.'||b[23]!=b'Z'{return false}
    let Some(y)=digit(b,0,4)else{return false};
    let (Some(m),Some(d),Some(h),Some(min),Some(sec),Some(_ms))=
        (digit(b,5,7),digit(b,8,10),digit(b,11,13),digit(b,14,16),
         digit(b,17,19),digit(b,20,23))else{return false};
    let leap=y%4==0&&(y%100!=0||y%400==0);
    let days=match m{1|3|5|7|8|10|12=>31,4|6|9|11=>30,2 if leap=>29,2=>28,_=>0};
    d>=1&&d<=days&&h<=23&&min<=59&&sec<=59
}
fn validate(f:&Value)->bool{
    let Some(evidence)=f["evidence"].as_array()else{return false};
    if f["schema"]!="vivim.diagnostic-finding/1"||
        !f["id"].as_str().is_some_and(id)||
        !f["target"]["id"].as_str().is_some_and(id)||
        !matches!(f["target"]["kind"].as_str(),Some("worker"|"control"|"world"))||
        !f["observedAt"].as_str().is_some_and(time)||
        !matches!(f["severity"].as_str(),Some("low"|"medium"|"high"|"critical"))||
        !f["code"].as_str().is_some_and(|c|!c.is_empty()&&c.len()<=80&&
           c.bytes().all(|b|b.is_ascii_uppercase()||b.is_ascii_digit()||b==b'_'))||
        !f["confidence"].as_f64().is_some_and(|x|x.is_finite()&&(0. ..=1.).contains(&x))||
        evidence.len()>16{return false}
    evidence.iter().all(|e|{
        let Some(o)=e.as_object()else{return false};
        o.keys().all(|k|matches!(k.as_str(),"ref"|"kind"|"at"))&&
            e["ref"].as_str().is_some_and(id)&&e["kind"].as_str().is_some_and(id)&&
            e["at"].as_str().is_some_and(time)
    })
}
pub fn diagnose(finding:&Value)->Value{
    if !validate(finding){return json!({"error":"RECOVERY_FINDING_INVALID"})}
    let code=finding["code"].as_str().unwrap_or("");
    let target=finding["target"]["kind"].as_str().unwrap_or("");
    let evidence=finding["evidence"].as_array().unwrap();
    let refs:Vec<Value>=evidence.iter().map(|e|e["ref"].clone()).collect();
    let Some(s)=signature(code).filter(|s|s.target==target)else{
        return json!({"classification":"unknown","hypotheses":[],
            "evidenceRefs":refs,"escalation":"unknown_or_mismatched_signature"})
    };
    let matches:Vec<&Value>=evidence.iter().filter(|e|e["kind"]==s.evidence).collect();
    let observed=!matches.is_empty();
    let latest=matches.iter().filter_map(|e|e["at"].as_str()).max().unwrap_or("");
    let healthy=evidence.iter().any(|e|e["kind"]=="authoritative_healthy"&&
        e["at"].as_str().is_some_and(|at|at>latest));
    let confidence=finding["confidence"].as_f64().unwrap_or(0.);
    let classification=if observed&&healthy{"already_recovered"}
        else if !observed{"missing_observability"}
        else if matches!(code,"CONTROL_UNCERTAIN"|"SEND_OUTCOME_UNCERTAIN"|"GRANT_REVOKED"){
            "confirmed_state_not_effect_outcome"
        }else if confidence>=0.9{"confirmed_failure_signal"}
        else{"suspected"};
    json!({"classification":classification,
        "hypotheses":[{"code":code,"explanation":s.hypothesis,
            "confidence":if observed{confidence}else{0.}}],
        "evidenceRefs":refs,"escalation":null})
}
pub fn diagnose_batch(input:&Value)->Value{
    let Some(rows)=input["findings"].as_array()else{
        return json!({"error":"RECOVERY_FINDINGS_INVALID"})
    };
    if rows.len()>25{return json!({"error":"RECOVERY_FINDINGS_INVALID"})}
    let mut results=Vec::with_capacity(rows.len());
    for finding in rows{
        let value=diagnose(finding);
        if value.get("error").is_some(){return value}
        results.push(value);
    }
    json!({"schema":"vivim.native-recovery-batch/1","authority":"none",
        "results":results,"executionAuthorized":false,"effectPerformed":false})
}
