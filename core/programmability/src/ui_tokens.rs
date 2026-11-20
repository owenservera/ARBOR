//! Native Design Tokens Community Group subset for VIVIM.
//! @hq:capability vivim.rust-design-tokens@1
//! Inert token packages and bounded alias graphs; no CSS, DOM or effects.
use serde_json::{json,Value};
use std::collections::{BTreeMap,BTreeSet};
const SCHEMA:&str="vivim.ui-token-pack/1";
struct Entry{kind:String,value:Value}
fn name(s:&str)->bool{
    let b=s.as_bytes();
    !b.is_empty()&&b[0].is_ascii_lowercase()&&b[1..].iter().all(|x|
        x.is_ascii_lowercase()||x.is_ascii_digit()||*x==b'_'||*x==b'-')
}
fn valid_path(s:&str)->bool{s.split('.').count()<=16&&s.split('.').all(name)}
fn value_type(kind:&str)->Option<&'static str>{
    Some(match kind{
        "color"=>"color","dimension"=>"length","duration"=>"duration",
        "number"=>"number","fontFamily"=>"token","fontWeight"=>"number",
        "cubicBezier"=>"map","shadow"=>"shadow","gradient"=>"gradient",
        _=>return None
    })
}
fn inert(v:&Value,depth:usize,count:&mut usize)->bool{
    *count+=1;
    if *count>2048||depth>12{return false}
    match v{
        Value::Null|Value::Bool(_)=>true,
        Value::Number(x)=>x.as_f64().is_some_and(f64::is_finite),
        Value::String(s)=>s.encode_utf16().count()<=1024&&
            !s.chars().any(|c|c=='\u{7f}'||c<='\u{1f}'),
        Value::Array(a)=>a.len()<=128&&a.iter().all(|v|inert(v,depth+1,count)),
        Value::Object(o)=>o.len()<=256&&o.iter().all(|(k,v)|{
            !matches!(k.as_str(),"__proto__"|"constructor"|"prototype")&&
            inert(v,depth+1,count)
        })
    }
}
fn collect(obj:&Value,prefix:&str,depth:usize,entries:&mut BTreeMap<String,Entry>)
    ->Result<(),&'static str>{
    let Some(group)=obj.as_object()else{return Err("INVALID_GROUP")};
    if group.len()>128{return Err("INVALID_GROUP")}
    if depth>9{return Err("DEPTH_LIMIT")}
    for (name_segment,value) in group{
        if !name(name_segment){return Err("INVALID_TOKEN_NAME")}
        let path=if prefix.is_empty(){name_segment.to_owned()}
            else{format!("{prefix}.{name_segment}")};
        let Some(data)=value.as_object()else{return Err("INVALID_GROUP")};
        if data.contains_key("$value"){
            if !data.keys().all(|k|matches!(k.as_str(),"$type"|"$value"|"$description")){
                return Err("UNKNOWN_TOKEN_TYPE")
            }
            let Some(kind)=data.get("$type").and_then(Value::as_str)else{
                return Err("UNKNOWN_TOKEN_TYPE")
            };
            if value_type(kind).is_none(){return Err("UNKNOWN_TOKEN_TYPE")}
            entries.insert(path,Entry{kind:kind.to_owned(),value:data["$value"].clone()});
            if entries.len()>512{return Err("TOO_MANY_TOKENS")}
        }else{collect(value,&path,depth+1,entries)?}
    }
    Ok(())
}
fn resolve(path:&str,entries:&BTreeMap<String,Entry>,
   resolved:&mut BTreeMap<String,Value>,active:&mut BTreeSet<String>,depth:usize)
   ->Result<Value,&'static str>{
    if depth>32{return Err("ALIAS_DEPTH")}
    if let Some(v)=resolved.get(path){return Ok(v.clone())}
    if !active.insert(path.to_owned()){return Err("ALIAS_CYCLE")}
    let Some(entry)=entries.get(path)else{return Err("UNKNOWN_TOKEN_REFERENCE")};
    let mut raw=entry.value.clone();
    if let Some(reference)=raw.as_str(){
        if reference.starts_with('{')&&reference.ends_with('}'){
            let target=&reference[1..reference.len()-1];
            if valid_path(target){
                let other=resolve(target,entries,resolved,active,depth+1)?;
                if other["type"]!=entry.kind{return Err("ALIAS_TYPE_MISMATCH")}
                raw=other["value"].clone();
            }
        }
    }
    let checked=crate::ui_value::validate(&json!({
        "type":value_type(&entry.kind).ok_or("UNKNOWN_TOKEN_TYPE")?,
        "value":raw
    }));
    if checked["ok"]!=true{return Err("INVALID_TOKEN_VALUE")}
    let output=json!({"path":path,"type":entry.kind,"value":checked["value"]});
    resolved.insert(path.to_owned(),output.clone());
    active.remove(path);
    Ok(output)
}
fn fail(code:&str,path:Option<&str>)->Value{
    let mut result=json!({"schema":SCHEMA,"outcome":"refused","code":code,"installed":false});
    if let Some(path)=path{result["path"]=json!(path)}
    result
}
pub fn resolve_package(input:&Value)->Value{
    let Some(o)=input.as_object()else{return fail("INVALID_TOKEN_PACKAGE",None)};
    if input["schema"]!=SCHEMA||!o.keys().all(|k|matches!(k.as_str(),"schema"|"tokens"|"mode"))||
        !input["tokens"].is_object(){return fail("INVALID_TOKEN_PACKAGE",None)}
    let mut count=0;
    if !inert(&input["tokens"],0,&mut count){return fail("INVALID_TOKEN_PACKAGE",None)}
    let mut entries=BTreeMap::new();
    if let Err(code)=collect(&input["tokens"],"",0,&mut entries){return fail(code,None)}
    let mut resolved=BTreeMap::new();let mut active=BTreeSet::new();
    for key in entries.keys(){
        if let Err(code)=resolve(key,&entries,&mut resolved,&mut active,0){
            return fail(code,Some(key))
        }
    }
    json!({"schema":SCHEMA,"outcome":"resolved","installed":false,"tokens":resolved})
}
