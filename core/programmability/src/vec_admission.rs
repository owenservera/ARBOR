//! Inert VEC/0.1 admission and source-identity provenance.
//! @hq:capability vivim.rust-vec-admission@1
//! Trusted adapters remain owned by their products; neither source text
//! nor this output authorizes UI mutation, commands or external effects.
use serde_json::{json,Value};
const SCHEMA:&str="vivim.vec-compile/0.1";
fn known(domain:&str)->Option<(&'static str,&'static str)>{
    Some(match domain{
        "wiki"=>("wiki-projection","hq.wiki-program/1"),
        "command"=>("command-plan","vivim.command-intent/0.1"),
        "ui"=>("ui-revision-proposal","vivim.ui-proposal/1"),
        _=>return None
    })
}
fn fail(domain:Option<&str>,outcome:&str,code:&str)->Value{
    let product=domain.and_then(known).map(|x|x.0);
    json!({"schema":SCHEMA,"domain":domain,"product":product,
       "outcome":outcome,"code":code,"authorization":"none",
       "executed":false,"persisted":false})
}
fn semantic_id(schema:&str)->String{
    let i=schema.rfind('/').unwrap_or(0);
    format!("{}@{}",&schema[..i],&schema[i+1..])
}
pub fn admit(input:&Value)->Value{
    let domain=input["domain"].as_str().unwrap_or("");
    let Some((_,product_schema))=known(domain)else{
        return fail(None,"refused","UNKNOWN_DOMAIN")
    };
    let Some(text)=input["text"].as_str()else{
        return fail(Some(domain),"refused","INVALID_INPUT")
    };
    if text.trim().is_empty()||text.encode_utf16().count()>4096||
        text.chars().any(|c|matches!(c as u32,0..=8|11|12|14..=31|127)){
        return fail(Some(domain),"refused","INVALID_INPUT")
    }
    if input["contextValid"]!=true{
        return fail(Some(domain),"refused","INVALID_CONTEXT")
    }
    if input["adapterInstalled"]!=true{
        let mut out=fail(Some(domain),"unsupported","LEGACY_OWNER_NOT_MIGRATED");
        out["legacyOwner"]=json!(product_schema);return out;
    }
    let result=&input["adapterResult"];
    let Some(object)=result.as_object()else{
        return fail(Some(domain),"refused","ADAPTER_INVALID_RESULT")
    };
    let outcome=object.get("outcome").and_then(Value::as_str);
    if !matches!(outcome,Some("candidate"|"clarification_required"|"unsupported"|"refused")){
        return fail(Some(domain),"refused","ADAPTER_INVALID_RESULT")
    }
    let outcome=outcome.unwrap();
    let mut out=fail(Some(domain),outcome,"NONE");
    if let Some(code)=object.get("code"){if !code.is_null(){out["code"]=code.clone()}}
    let valid_candidate=outcome=="candidate"&&
        object.get("proposal").is_some_and(|p|p.is_object()&&p["schema"]==product_schema);
    if valid_candidate{
        out["sourceSemanticIds"]=json!([
            semantic_id(SCHEMA),semantic_id(product_schema)
        ]);
    }
    for key in ["proposal","preview","summary","detail"]{
        if let Some(value)=object.get(key){out[key]=value.clone()}
    }
    out
}
