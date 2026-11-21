//! Shared pure Rust product computation kernel for native and future WASM.
//! @hq:capability vivim.product-kernel@1
//! No filesystem, network, authorization, device I/O or effects.
use serde_json::{json,Value};
pub const REQUEST_SCHEMA:&str="vivim.product-pure-request/1";
pub const RESPONSE_SCHEMA:&str="vivim.product-pure-response/1";
pub const MAX_WIRE_BYTES:usize=512*1024;
// The Host durable journal is bounded at 8 MiB. Only this native-only replay
// operation can use a larger transport frame; browser ABI remains 512 KiB.
pub const MAX_JOURNAL_WIRE_BYTES:usize=12*1024*1024;
pub const MAX_CHANGE_WIRE_BYTES:usize=4*1024*1024;
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
        "first-contact"=>crate::first_contact::project(input),
        "ui-token-pack"=>crate::ui_tokens::resolve_package(input),
        "local-navigation"=>crate::navigation::destination(input),
        "vec-admission"=>crate::vec_admission::admit(input),
        "sha256-utf8"=>crate::source_digest::digest_utf8(input),
        "wiki-source-stamp"=>crate::wiki_read::source_stamp(input),
        "wiki-source-search"=>crate::wiki_read::source_search(input),
        "wiki-source-transition"=>crate::wiki_read::source_transition(input),
        "wiki-source-delta"=>crate::wiki_read::source_delta(input),
        "wiki-capture-projection"=>crate::wiki_journal::captures(input),
        "wiki-change-projection"=>crate::wiki_journal::changes(input),
        "wiki-structure-transition"=>crate::wiki_journal::structure_transition(input),
        "wiki-journal-replay"=>crate::wiki_replay::replay(input),
        "control-preclaim"=>crate::control_lifecycle::preclaim(input),
        "control-effect-disposition"=>crate::control_lifecycle::effect_disposition(input),
        "control-typed-plan"=>crate::control_planning::typed(input),
        "control-candidate-plan"=>crate::control_planning::candidate(input),
        "wiki-write-recipe"=>crate::wiki_write_recipe::process(input),
        "wiki-read-recipe"=>crate::wiki_read_recipe::process(input),
        "command-ai-guard"=>crate::command_ai_guard::validate(input),
        "command-intent-projection"=>crate::command_intent_projection::project(input),
        "control-lexicon-transition"=>crate::control_lexicon::transition(input),
        "personal-rule-selection"=>crate::personal_rule_selection::select(input),
        "personal-rule-transition"=>crate::personal_rule_transition::reduce(input),
        "control-catalog-compatibility"=>crate::control_catalog_compat::assess(input),
        "semantic-observation"=>crate::semantic_observation::aggregate(input),
        "development-projection"=>crate::development_projection::project(input),
        "control-plan-preview"=>crate::control_plan_presentation::project(input),
        "control-receipt-preview"=>crate::control_plan_presentation::receipt_project(input),
        "control-inspection-preview"=>crate::control_plan_presentation::inspection_project(input),
        _=>return refuse(op,"UNKNOWN_NATIVE_OPERATION"),
    };
    json!({"schema":RESPONSE_SCHEMA,"state":"computed","operation":op,
        "result":result,"authority":"none","executionAuthorized":false,
        "effectPerformed":false})
}
pub fn dispatch_json(raw:&str)->String{
    if raw.len()>MAX_JOURNAL_WIRE_BYTES{
        return refuse("","INPUT_TOO_LARGE").to_string()
    }
    let request=match serde_json::from_str::<Value>(raw){
        Ok(request)=>request,Err(_)=>return refuse("","INVALID_JSON").to_string()
    };
    let operation=request["operation"].as_str().unwrap_or("");
    let limit=match operation {
        "wiki-journal-replay"=>MAX_JOURNAL_WIRE_BYTES,
        "wiki-change-projection"=>MAX_CHANGE_WIRE_BYTES,
        _=>MAX_WIRE_BYTES,
    };
    if raw.len()>limit{return refuse(operation,"INPUT_TOO_LARGE").to_string()}
    let wire=dispatch(&request).to_string();
    if wire.len()>limit{refuse(operation,"NATIVE_RESULT_TOO_LARGE").to_string()}
    else{wire}
}
