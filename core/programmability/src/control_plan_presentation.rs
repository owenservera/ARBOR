//! Inert exact-owner Host plan presentation, shared with the native Rust kernel.
//! @hq:capability vivim.rust-control-plan-presentation@1
//! @hq:consumes vivim.control-plan@1
//! Never generates approvals, plan digests, arguments or execution requests.
use serde_json::{json,Value};
const SCHEMA:&str="vivim.control-plan/1";
fn required<'a>(plan:&'a Value,key:&str)->Option<&'a str>{
    plan[key].as_str().filter(|s|!s.is_empty())
}
fn exact_digest(s:&str)->bool{
    s.len()==64&&s.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b))
}
fn plan_id(s:&str)->bool{
    s.strip_prefix("ctl-").is_some_and(|tail|tail.len()==16&&
        tail.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)))
}
pub fn format_review(plan:&Value)->Option<String>{
    if plan["schema"]!=SCHEMA||plan["source"]!="desktop"{return None}
    let outcome=required(plan,"outcome")?;
    if !matches!(outcome,"approval_required"|"done"|"clarification_required"|
        "incomplete"|"interpretation_required"|"refused"|"unavailable"){return None}
    let mut lines=vec![
        "VIVIM · canonical Host decision".to_owned(),
        format!("Outcome: {outcome}"),
        format!("Action: {}",required(plan,"actionId").unwrap_or("not selected")),
    ];
    if outcome=="approval_required"{
        let action=required(plan,"actionId")?;
        let risk=required(plan,"risk").filter(|s|matches!(*s,"R1"|"R2"))?;
        let id=required(plan,"planId").filter(|s|plan_id(s))?;
        let digest=required(plan,"planDigest").filter(|s|exact_digest(s))?;
        let expiry=required(plan,"expiresAt")?;
        if !plan["args"].is_object()||plan["approval"]["required"]!=true||
            !plan["approval"]["channels"].as_array().is_some_and(|channels|
                channels.iter().any(|channel|channel=="desktop-owner-token")) {
            return None;
        }
        lines.push(format!("Action to authorize: {action}"));
        lines.push(format!("Risk: {risk}"));
        lines.push(format!("Plan ID: {id}"));
        lines.push(format!("Exact plan digest: {digest}"));
        lines.push(format!("Expires: {expiry}"));
        lines.push("Approval: required · not yet executed".into());
        lines.push("Only the explicit owner approval control may execute this exact plan.".into());
    }else{
        lines.push("Approval: no native approval token issued by this response.".into());
    }
    // Keep the entire canonical Host payload, even for resolved arguments,
    // visual previews, warnings, metadata and unknown future fields.
    lines.push(String::new());
    lines.push("COMPLETE HOST RESPONSE (UNMODIFIED VALUES)".into());
    lines.push(serde_json::to_string_pretty(plan).ok()?);
    Some(lines.join("\n"))
}
pub fn project(input:&Value)->Value{
    match format_review(&input["plan"]){
        Some(text)=>json!({
            "schema":"vivim.control-plan-presentation/1","outcome":"computed",
            "text":text,"authority":"none","executionAuthorized":false,
            "effectPerformed":false
        }),
        None=>json!({
            "schema":"vivim.control-plan-presentation/1","outcome":"refused",
            "code":"INVALID_CONTROL_PLAN","authority":"none",
            "executionAuthorized":false,"effectPerformed":false
        })
    }
}
