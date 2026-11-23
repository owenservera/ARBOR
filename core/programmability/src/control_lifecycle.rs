//! Pure Host command lifecycle checks. This neither validates an owner grant
//! nor approves, claims, executes, or retries a command. Those remain Host-only.
//! @hq:capability vivim.rust-control-lifecycle@1
use serde_json::{json,Value};

const PRECLAIM:&str="vivim.control-preclaim/1";
const DISPOSITION:&str="vivim.control-effect-disposition/1";
fn refused(code:&str)->Value{
    json!({"schema":PRECLAIM,"disposition":"refused","code":code,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
pub fn preclaim(input:&Value)->Value{
    if input["schema"]!="vivim.control-preclaim-input/1"{
        return refused("INVALID_INPUT")
    }
    let Some(risk)=input["risk"].as_str()else{return refused("INVALID_RISK")};
    let Some(source)=input["source"].as_str()else{return refused("INVALID_SOURCE")};
    let Some(channel)=input["channel"].as_str()else{return refused("INVALID_CHANNEL")};
    let Some(actor)=input["actor"].as_str()else{return refused("INVALID_ACTOR")};
    let Some(owner)=input["planActor"].as_str()else{return refused("INVALID_ACTOR")};
    let Some(now)=input["nowMs"].as_i64()else{return refused("INVALID_TIME")};
    let Some(expires)=input["expiresMs"].as_i64()else{return refused("INVALID_TIME")};
    let Some(wiki)=input["wikiMutation"].as_bool()else{return refused("INVALID_SCOPE")};
    let Some(rule)=input["ruleAction"].as_bool()else{return refused("INVALID_SCOPE")};
    if !matches!(risk,"R0"|"R1"|"R2"|"R3")||!matches!(channel,
        "desktop-owner-token"|"direct-phone")||source.is_empty()||
        actor.is_empty()||owner.is_empty(){return refused("INVALID_INPUT")}
    if now>=expires{return refused("CONTROL_PLAN_EXPIRED")}
    if risk=="R3"{return refused("CONTROL_R3_REFUSED")}
    if risk=="R2"&&channel!="desktop-owner-token"{
        return refused("CONTROL_DESKTOP_APPROVAL_REQUIRED")
    }
    if source=="mobile"&&channel!="direct-phone"||
        source=="desktop"&&channel!="desktop-owner-token"{
        return refused("CONTROL_APPROVAL_SOURCE_MISMATCH")
    }
    if wiki {
        if source=="mobile" {
            if channel!="direct-phone"||actor!=owner{
                return refused("CONTROL_WIKI_DEVICE_MISMATCH")
            }
        } else if channel!="desktop-owner-token"{
            return refused("CONTROL_DESKTOP_APPROVAL_REQUIRED")
        }
    }
    if rule&&(source!="desktop"||owner!="desktop-owner"||
        channel!="desktop-owner-token"||actor!="desktop-owner"){
        return refused("CONTROL_DESKTOP_APPROVAL_REQUIRED")
    }
    json!({"schema":PRECLAIM,"disposition":"admissible","code":null,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
const VALIDATION:&[&str]=&[
    "GRANT_REQUIRED","GRANT_SCOPE","OWNER_PREFERENCE_INVALID",
    "OWNER_PREFERENCE_NOT_OWNER","CONTROL_WORD_RESERVED",
    "PERSONAL_STORE_STALE","PERSONAL_STORE_CONFLICT",
    "PERSONAL_STORE_FULL","PERSONAL_STORE_BAD_TRANSITION",
    "PERSONAL_STORE_OWNER_APPROVAL_REQUIRED","CONTROL_RULE_STALE",
    "CONTROL_WORD_UNKNOWN","CONTROL_TEACH_TARGET_INVALID",
    "CONTROL_LEXICON_FULL","CONTROL_LEXICON_CORRUPT",
    "CONTROL_LEXICON_BUSY","CONTROL_DEVICE_AUTHORITY_UNAVAILABLE",
    "GRANT_UNKNOWN","GRANT_ALREADY_REVOKED",
    "CONTROL_DEVICE_SCOPE_INVALID","GRANT_NOT_PENDING",
    // Studio owner preflight: these happen BEFORE any browser/recording/Drive
    // effect. Do not classify a lost response AFTER a Studio POST as definite.
    "STUDIO_UNAVAILABLE","STUDIO_CAPTURE_TARGET_INVALID",
    "STUDIO_CAPTURE_PREFLIGHT","STUDIO_CAPTURE_TARGET_STALE",
    "STUDIO_CAPTURE_NOT_RECORDING","STUDIO_DRIVE_SITE_INVALID",
    "STUDIO_DRIVE_SITE_STALE","STUDIO_DRIVE_JOB_INVALID",
    "STUDIO_DRIVE_JOB_NOT_ACTIVE"
];
pub fn effect_disposition(input:&Value)->Value{
    let refuse=||json!({"schema":DISPOSITION,"disposition":"refused",
        "authority":"none","executionAuthorized":false,"effectPerformed":false});
    if input["schema"]!="vivim.control-effect-input/1"{
        return refuse()
    }
    let Some(failed)=input["failed"].as_bool()else{return refuse()};
    let Some(wiki)=input["wikiMutation"].as_bool()else{return refuse()};
    let status_code=input["statusCode"].as_i64();
    if !input["statusCode"].is_null()&&status_code.is_none(){return refuse()}
    let code=input["code"].as_str().unwrap_or("CONTROL_EFFECT_UNCERTAIN");
    let effective=if status_code==Some(409){"CONTROL_WIKI_STALE"}else{code};
    let definitive=status_code==Some(409)||
        VALIDATION.contains(&effective)||
        (wiki&&matches!(status_code,Some(400|404|413|428)));
    json!({
        "schema":DISPOSITION,"disposition":"computed",
        "status":if !failed{"applied"}else if definitive{"failed"}else{"uncertain"},
        "code":if failed{Some(effective)}else{None},
        "authority":"none","executionAuthorized":false,"effectPerformed":false
    })
}
