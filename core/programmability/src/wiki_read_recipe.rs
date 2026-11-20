//! Inert Rust Wiki read-program recipe compiler and validator.
//! @hq:capability vivim.rust-wiki-read-recipe@1
//! The Host retains Wiki access, evidence resolution and actual read results.
use serde_json::{json,Value};
use crate::wiki_write_recipe::{
    action,expected_dependencies,fingerprint,valid_args,valid_commands
};

const SCHEMA:&str="vivim.wiki-read-recipe-native/1";
const RECIPE:&str="vivim.wiki-read-recipe/1";
fn response(outcome:&str,recipe:Option<Value>)->Value{
    let mut value=json!({"schema":SCHEMA,"outcome":outcome,
        "authority":"none","executionAuthorized":false,"effectPerformed":false});
    if let Some(recipe)=recipe{value["recipe"]=recipe}
    value
}
fn readable(id:&str)->bool {
    matches!(id,"wiki.pages.list"|"wiki.section.read")
}
fn valid_step(step:&Value,actions:&[Value])->bool{
    let Some(row)=step.as_object()else{return false};
    if row.len()!=2||!row.contains_key("actionId")||!row.contains_key("args"){
        return false
    }
    let Some(id)=step["actionId"].as_str().filter(|id|readable(id))
        else{return false};
    let Some(a)=action(actions,id)else{return false};
    a["risk"]=="R0"&&
        matches!(a["readiness"].as_str(),Some("source_wired"|"verified"))&&
        valid_args(&a["args"],&step["args"])
}
fn valid(recipe:&Value,commands:&str,actions:&[Value])->bool{
    let Some(fields)=recipe.as_object()else{return false};
    if fields.len()!=4||
        !fields.contains_key("schema")||!fields.contains_key("steps")||
        !fields.contains_key("dependencies")||!fields.contains_key("commandDigest")||
        recipe["schema"]!=RECIPE||!valid_commands(commands)||
        recipe["commandDigest"]!=fingerprint(&json!(commands)){return false}
    let Some(steps)=recipe["steps"].as_array()
        .filter(|steps|(2..=8).contains(&steps.len()))
        else{return false};
    if !steps.iter().all(|step|valid_step(step,actions)){return false}
    let expected=expected_dependencies(steps,actions,"program.read_wiki");
    recipe["dependencies"].is_array()&&
        fingerprint(&recipe["dependencies"])==fingerprint(&expected)
}
fn compile(input:&Value,commands:&str,actions:&[Value])->Value{
    if !valid_commands(commands){return response("refused",None)}
    let Some(plans)=input["plans"].as_array()else{return response("refused",None)};
    if plans.len()!=commands.split('\n').count(){return response("refused",None)}
    let mut steps=Vec::new();
    for plan in plans {
        let Some(id)=plan["actionId"].as_str().filter(|id|readable(id))
            else{return response("refused",None)};
        if plan["outcome"]!="ready"||plan["risk"]!="R0"||
            plan["origin"]!="deterministic"{return response("refused",None)}
        let step=json!({"actionId":id,"args":plan["args"]});
        if !valid_step(&step,actions){return response("refused",None)}
        steps.push(step);
    }
    let dependencies=expected_dependencies(&steps,actions,"program.read_wiki");
    let recipe=json!({"schema":RECIPE,"steps":steps,"dependencies":dependencies,
        "commandDigest":fingerprint(&json!(commands))});
    response("compiled",Some(recipe))
}
pub fn process(input:&Value)->Value{
    if input["schema"]!="vivim.wiki-read-recipe-request/1"{
        return response("refused",None)
    }
    let Some(commands)=input["commands"].as_str()
        else{return response("refused",None)};
    let Some(actions)=input["actions"].as_array()
        else{return response("refused",None)};
    if actions.len()>3000{return response("refused",None)}
    match input["mode"].as_str(){
        Some("compile")=>compile(input,commands,actions),
        Some("validate")=>response(if valid(&input["recipe"],commands,actions){
            "valid"
        }else{"refused"},None),
        _=>response("refused",None)
    }
}
