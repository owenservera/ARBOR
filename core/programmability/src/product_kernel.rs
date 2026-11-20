//! Shared pure Rust product computation kernel for native and future WASM.
//! @hq:capability vivim.product-kernel@1
//! No filesystem, network, authorization, device I/O or effects.
use serde_json::{json,Value};
pub const REQUEST_SCHEMA:&str="vivim.product-pure-request/1";
pub const RESPONSE_SCHEMA:&str="vivim.product-pure-response/1";
pub const MAX_WIRE_BYTES:usize=512*1024;
pub fn refuse(op:&str,code:&str)->Value{
    json!({"schema":RESPONSE_SCHEMA,"state":"refused","operation":op,
        "code":code,"authority":"none","executionAuthorized":false,"effectPerformed":false})
}
pub fn dispatch(request:&Value)->Value{
    let op=request["operation"].as_str().unwrap_or("");
    if request["schema"]!=REQUEST_SCHEMA||!request["input"].is_object(){
        return refuse(op,"INVALID_NATIVE_REQUEST")
    }
    let input=&request["input"];
    let result=match op{
        "command-program"=>crate::command_program::compile(input),
        "context-grounding"=>crate::context_grounding::resolve(input),
        "wiki-target"=>crate::wiki_target::resolve(input),
        "wiki-target-batch"=>crate::wiki_target::resolve_batch(input),
        "recovery-diagnosis"=>crate::recovery_diagnosis::diagnose(&input["finding"]),
        "recovery-diagnosis-batch"=>crate::recovery_diagnosis::diagnose_batch(input),
        "ui-value"=>crate::ui_value::validate(input),
        "ui-token-pack"=>crate::ui_tokens::resolve_package(input),
        "local-navigation"=>crate::navigation::destination(input),
        "vec-admission"=>crate::vec_admission::admit(input),
        "sha256-utf8"=>crate::source_digest::digest_utf8(input),
        _=>return refuse(op,"UNKNOWN_NATIVE_OPERATION"),
    };
    json!({"schema":RESPONSE_SCHEMA,"state":"computed","operation":op,
        "result":result,"authority":"none","executionAuthorized":false,
        "effectPerformed":false})
}
pub fn dispatch_json(raw:&str)->String{
    if raw.len()>MAX_WIRE_BYTES{return refuse("","INPUT_TOO_LARGE").to_string()}
    let result=match serde_json::from_str::<Value>(raw){
        Ok(request)=>dispatch(&request),Err(_)=>refuse("","INVALID_JSON")
    };
    let wire=result.to_string();
    if wire.len()>MAX_WIRE_BYTES{refuse("","NATIVE_RESULT_TOO_LARGE").to_string()}
    else{wire}
}
