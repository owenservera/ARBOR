//! Exact, inert Wiki mutation-program recipe compiler, validator and binder.
//! @hq:capability vivim.rust-wiki-write-recipe@1
//! The Host remains authoritative for natural-language planning, approval,
//! source freshness, journal append and effect execution.
use serde_json::{json,Value};
use sha2::{Digest,Sha256};
use std::collections::BTreeSet;

const SCHEMA:&str="vivim.wiki-write-recipe-native/1";
const RECIPE:&str="vivim.wiki-write-recipe/1";
fn result(outcome:&str,value:Option<(&str,Value)>)->Value{
    let mut output=json!({"schema":SCHEMA,"outcome":outcome,"authority":"none",
        "executionAuthorized":false,"effectPerformed":false});
    if let Some((key,content))=value{output[key]=content}
    output
}
pub(crate) fn fingerprint(value:&Value)->String{
    let wire=serde_json::to_vec(value).unwrap_or_default();
    format!("{:x}",Sha256::digest(&wire))
}
pub(crate) fn text_length(s:&str)->usize{s.encode_utf16().count()}
pub(crate) fn valid_commands(commands:&str)->bool{
    if text_length(commands)>950{return false}
    let lines:Vec<&str>=commands.split('\n').collect();
    (2..=8).contains(&lines.len())&&lines.iter().all(|line|{
        let trimmed=line.trim();
        !trimmed.is_empty()&&text_length(trimmed)<=240
    })
}
fn writable(id:&str)->bool{
    matches!(id,"wiki.page.create"|"wiki.section.edit"|
        "wiki.page.move"|"wiki.pages.link")
}
fn slug(page:&str)->bool{
    let bytes=page.as_bytes();
    !bytes.is_empty()&&bytes.len()<=63&&bytes[0].is_ascii_lowercase()&&
    bytes[1..].iter().all(|b|b.is_ascii_lowercase()||b.is_ascii_digit()||*b==b'-')&&
    !matches!(page,"constructor"|"prototype"|"__proto__")
}
pub(crate) fn action<'a>(actions:&'a [Value],id:&str)->Option<&'a Value>{
    actions.iter().find(|item|item["id"]==id)
}
pub(crate) fn valid_args(specs:&Value,args:&Value)->bool{
    let (Some(expected),Some(actual))=(specs.as_object(),args.as_object())
        else{return false};
    if expected.len()!=actual.len(){return false}
    expected.iter().all(|(name,shape)|{
        let Some(value)=actual.get(name).and_then(Value::as_str)
            else{return false};
        if value.is_empty()||value!=value.trim(){return false}
        match shape["type"].as_str(){
            Some("enum")=>shape["values"].as_array()
                .is_some_and(|choices|choices.iter().any(|choice|choice.as_str()==Some(value))),
            Some("string")=>match(shape["min"].as_u64(),shape["max"].as_u64()){
                (Some(min),Some(max))=>{
                    let count=text_length(value) as u64;
                    count>=min&&count<=max
                },
                _=>false
            },
            _=>false
        }
    })
}
fn valid_step(step:&Value,actions:&[Value])->bool{
    let Some(row)=step.as_object()else{return false};
    if row.len()!=2||!row.contains_key("actionId")||!row.contains_key("args"){
        return false
    }
    let Some(id)=step["actionId"].as_str().filter(|id|writable(id))
        else{return false};
    let Some(a)=action(actions,id)else{return false};
    a["risk"]=="R1"&&matches!(a["readiness"].as_str(),Some("source_wired"|"verified"))&&
        valid_args(&a["args"],&step["args"])
}
pub(crate) fn expected_dependencies(steps:&[Value],actions:&[Value],program_id:&str)->Value{
    let mut ids=BTreeSet::new();
    ids.insert(program_id.to_owned());
    for step in steps{
        if let Some(id)=step["actionId"].as_str(){ids.insert(id.to_owned());}
    }
    Value::Array(ids.into_iter().map(|id|{
        let action=action(actions,&id).cloned().unwrap_or(Value::Null);
        json!({"id":id,"digest":fingerprint(&action)})
    }).collect())
}
fn has_slot(steps:&[Value],page:&str)->bool{
    slug(page)&&steps.iter()
        .filter(|step|step["actionId"]=="wiki.page.create").count()==1&&
        steps.iter().any(|step|step["actionId"]=="wiki.page.create"&&
            step["args"]["page"]==page)
}
fn valid(recipe:&Value,commands:&str,actions:&[Value])->bool{
    let Some(row)=recipe.as_object()else{return false};
    if row.len()!=5||!row.contains_key("schema")||
        !row.contains_key("steps")||!row.contains_key("dependencies")||
        !row.contains_key("commandDigest")||!row.contains_key("slot")||
        recipe["schema"]!=RECIPE||!valid_commands(commands)||
        recipe["commandDigest"]!=fingerprint(&json!(commands)){return false}
    let Some(steps)=recipe["steps"].as_array().filter(|steps|(2..=8).contains(&steps.len()))
        else{return false};
    if !steps.iter().all(|step|valid_step(step,actions)){return false}
    let dependencies=expected_dependencies(steps,actions,"program.write_wiki");
    if !recipe["dependencies"].is_array()||
        fingerprint(&recipe["dependencies"])!=fingerprint(&dependencies){return false}
    if recipe["slot"].is_null(){return true}
    let Some(slot)=recipe["slot"].as_object()else{return false};
    if slot.len()!=3||!slot.contains_key("name")||
        !slot.contains_key("type")||!slot.contains_key("example")||
        recipe["slot"]["name"]!="page"||
        recipe["slot"]["type"]!="wiki-page-slug"{return false}
    recipe["slot"]["example"].as_str()
        .is_some_and(|page|has_slot(steps,page))
}
fn compile(input:&Value,commands:&str,actions:&[Value])->Value{
    if !valid_commands(commands){return result("refused",None)}
    let Some(plans)=input["plans"].as_array()else{return result("refused",None)};
    let step_count=commands.split('\n').count();
    if plans.len()!=step_count{return result("refused",None)}
    let mut steps=Vec::new();
    for plan in plans{
        let Some(id)=plan["actionId"].as_str()else{return result("refused",None)};
        if plan["outcome"]!="approval_required"||
            plan["origin"]!="deterministic"||plan["risk"]!="R1"||
            !writable(id){return result("refused",None)}
        let step=json!({"actionId":id,"args":plan["args"]});
        if !valid_step(&step,actions){return result("refused",None)}
        steps.push(step);
    }
    let slot=if let Some(page)=input["page"].as_str(){
        if !has_slot(&steps,page){return result("refused",None)}
        json!({"name":"page","type":"wiki-page-slug","example":page})
    }else if input["page"].is_null(){Value::Null}
    else{return result("refused",None)};
    let dependencies=expected_dependencies(&steps,actions,"program.write_wiki");
    let recipe=json!({"schema":RECIPE,"steps":steps,
        "dependencies":dependencies,
        "commandDigest":fingerprint(&json!(commands)),"slot":slot});
    result("compiled",Some(("recipe",recipe)))
}
fn bind(recipe:&Value,commands:&str,actions:&[Value],page:&Value)->Value{
    if !valid(recipe,commands,actions){return result("refused",None)}
    let Some(steps)=recipe["steps"].as_array()else{return result("refused",None)};
    if recipe["slot"].is_null(){
        if !page.is_null(){return result("refused",None)}
        return result("bound",Some(("steps",Value::Array(steps.clone()))))
    }
    let Some(replacement)=page.as_str().filter(|page|slug(page))
        else{return result("refused",None)};
    let Some(example)=recipe["slot"]["example"].as_str()
        else{return result("refused",None)};
    let mut rebound=Vec::new();
    for step in steps{
        let mut step=step.clone();
        for key in ["page","from","to"]{
            if let Some(value)=step["args"][key].as_str(){
                if value.to_ascii_lowercase()==example{
                    step["args"][key]=json!(replacement);
                }
            }
        }
        if step["actionId"]=="wiki.section.edit" {
            if let Some(target)=step["args"]["target"].as_str(){
                if let Some((prefix,suffix))=target.split_once('/'){
                    if !prefix.is_empty()&&prefix.to_ascii_lowercase()==example{
                        step["args"]["target"]=json!(format!("{replacement}/{suffix}"));
                    }
                }
            }
        }
        if !valid_step(&step,actions){return result("refused",None)}
        rebound.push(step);
    }
    result("bound",Some(("steps",Value::Array(rebound))))
}
pub fn process(input:&Value)->Value{
    if input["schema"]!="vivim.wiki-write-recipe-request/1"{
        return result("refused",None)
    }
    let Some(commands)=input["commands"].as_str()else{return result("refused",None)};
    let Some(actions)=input["actions"].as_array()else{return result("refused",None)};
    if actions.len()>3000{return result("refused",None)}
    match input["mode"].as_str(){
        Some("compile")=>compile(input,commands,actions),
        Some("validate")=>result(if valid(&input["recipe"],commands,actions){
            "valid"
        }else{"refused"},None),
        Some("bind")=>bind(&input["recipe"],commands,actions,&input["page"]),
        _=>result("refused",None)
    }
}
