//! Single bounded native stdio adapter for five existing pure VIVIM domains.
//! @hq:capability vivim.product-pure-native@1
//! Zero network, filesystem paths, authorization, device I/O or Host effects.
use std::io::{self,Read,Write};
use serde_json::{Value,json};
const REQUEST_SCHEMA:&str="vivim.product-pure-request/1";
const RESPONSE_SCHEMA:&str="vivim.product-pure-response/1";
const MAX_INPUT:u64=512*1024;
const MAX_OUTPUT:usize=512*1024;
fn refuse(operation:&str,code:&str)->Value{
    json!({"schema":RESPONSE_SCHEMA,"state":"refused","operation":operation,
        "code":code,"authority":"none","executionAuthorized":false,
        "effectPerformed":false})
}
fn dispatch(raw:&Value)->Value{
    let operation=raw["operation"].as_str().unwrap_or("");
    if raw["schema"]!=REQUEST_SCHEMA||!raw["input"].is_object(){
        return refuse(operation,"INVALID_NATIVE_REQUEST")
    }
    let result=match operation{
        "command-program"=>
            vivim_programmability_core::command_program::compile(&raw["input"]),
        "context-grounding"=>
            vivim_programmability_core::context_grounding::resolve(&raw["input"]),
        "wiki-target"=>
            vivim_programmability_core::wiki_target::resolve(&raw["input"]),
        "wiki-target-batch"=>
            vivim_programmability_core::wiki_target::resolve_batch(&raw["input"]),
        "recovery-diagnosis"=>
            vivim_programmability_core::recovery_diagnosis::diagnose(&raw["input"]["finding"]),
        "recovery-diagnosis-batch"=>
            vivim_programmability_core::recovery_diagnosis::diagnose_batch(&raw["input"]),
        "ui-value"=>
            vivim_programmability_core::ui_value::validate(&raw["input"]),
        _=>return refuse(operation,"UNKNOWN_NATIVE_OPERATION")
    };
    json!({"schema":RESPONSE_SCHEMA,"state":"computed","operation":operation,
        "result":result,"authority":"none","executionAuthorized":false,
        "effectPerformed":false})
}
fn main()->io::Result<()>{
    let mut bytes=Vec::new();
    io::stdin().lock().take(MAX_INPUT+1).read_to_end(&mut bytes)?;
    let outcome=if bytes.len() as u64>MAX_INPUT{refuse("","INPUT_TOO_LARGE")}
        else if let Ok(value)=serde_json::from_slice::<Value>(&bytes){dispatch(&value)}
        else{refuse("","INVALID_JSON")};
    let output=serde_json::to_vec(&outcome).map_err(io::Error::other)?;
    let output=if output.len()>MAX_OUTPUT{
        serde_json::to_vec(&refuse("","NATIVE_RESULT_TOO_LARGE")).map_err(io::Error::other)?
    }else{output};
    let mut stdout=io::stdout().lock();
    stdout.write_all(&output)?;
    stdout.write_all(b"\n")
}
