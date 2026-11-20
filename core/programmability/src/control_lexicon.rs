//! Pure, versioned local command lexicon reducer.
//! @hq:capability vivim.rust-control-lexicon@1
//! Only the Host reads and locks the store, approves the command, and performs
//! atomic compare-and-save. The reducer never issues grants or writes files.
use serde_json::{json,Value};
use std::collections::HashSet;

const SCHEMA:&str="vivim.control-lexicon-transition/1";
fn refused(code:&str)->Value{
    json!({"schema":SCHEMA,"outcome":"refused","code":code,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn projected(next:Value,result:Value)->Value{
    json!({"schema":SCHEMA,"outcome":"projected","next":next,"result":result,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn valid_word(word:&str)->bool{
    let bytes=word.as_bytes();
    (2..=40).contains(&bytes.len())&&bytes[0].is_ascii_lowercase()&&
        bytes[1..].iter().all(|b|b.is_ascii_lowercase()||
            b.is_ascii_digit()||*b==b'-')
}
pub fn transition(input:&Value)->Value{
    if input["schema"]!="vivim.control-lexicon-transition-input/1"{
        return refused("CONTROL_LEXICON_NATIVE_INVALID")
    }
    let Some(mode)=input["mode"].as_str()
        .filter(|mode|matches!(*mode,"teach"|"forget"))
        else{return refused("CONTROL_LEXICON_NATIVE_INVALID")};
    let Some(word)=input["word"].as_str().filter(|word|valid_word(word))
        else{return refused("CONTROL_WORD_INVALID")};
    let Some(at)=input["at"].as_str().filter(|at|!at.is_empty())
        else{return refused("CONTROL_LEXICON_NATIVE_INVALID")};
    let Some(cur)=input["current"].as_object()
        else{return refused("CONTROL_LEXICON_NATIVE_INVALID")};
    if cur.get("schema")!=Some(&json!("vivim.control-lexicon/1")){
        return refused("CONTROL_LEXICON_NATIVE_INVALID")
    }
    let Some(version)=input["current"]["version"].as_u64()
        .filter(|n|*n<9_007_199_254_740_991)
        else{return refused("CONTROL_LEXICON_NATIVE_INVALID")};
    let Some(current_entries)=input["current"]["entries"].as_array()
        .filter(|rows|rows.len()<=200)
        else{return refused("CONTROL_LEXICON_NATIVE_INVALID")};
    let Some(current_history)=input["current"]["history"].as_array()
        .filter(|rows|rows.len()<=1000)
        else{return refused("CONTROL_LEXICON_NATIVE_INVALID")};
    let Some(reserved)=input["reserved"].as_array()else{
        return refused("CONTROL_LEXICON_NATIVE_INVALID")
    };
    let Some(spoken)=input["spoken"].as_array()else{
        return refused("CONTROL_LEXICON_NATIVE_INVALID")
    };
    if reserved.len()>10000||spoken.len()>3000{return refused("CONTROL_LEXICON_NATIVE_INVALID")}
    let Some(plan_id)=input.get("planId")else{
        return refused("CONTROL_LEXICON_NATIVE_INVALID")
    };
    if !plan_id.is_null()&&!plan_id.is_string(){
        return refused("CONTROL_LEXICON_NATIVE_INVALID")
    }
    let mut entries=current_entries.clone();
    let mut history=current_history.clone();
    let mut seen=HashSet::new();
    for row in &entries {
        let Some(key)=row["word"].as_str().filter(|key|valid_word(key))
            else{return refused("CONTROL_LEXICON_NATIVE_INVALID")};
        if !seen.insert(key)||!row["actionId"].is_string(){
            return refused("CONTROL_LEXICON_NATIVE_INVALID")
        }
    }
    let previous=entries.iter().find(|row|row["word"]==word)
        .and_then(|row|row["actionId"].as_str()).map(str::to_owned);
    let response=if mode=="teach"{
        if reserved.iter().any(|value|value==word){
            return refused("CONTROL_WORD_RESERVED")
        }
        let Some(action_id)=input["actionId"].as_str()else{
            return refused("CONTROL_TEACH_TARGET_INVALID")
        };
        if !spoken.iter().any(|value|value==action_id){
            return refused("CONTROL_TEACH_TARGET_INVALID")
        }
        if entries.len()>=200&&previous.is_none(){
            return refused("CONTROL_LEXICON_FULL")
        }
        entries.retain(|row|row["word"]!=word);
        entries.push(json!({"word":word,"actionId":action_id,"at":at,"planId":plan_id}));
        entries.sort_by(|a,b|a["word"].as_str().cmp(&b["word"].as_str()));
        history.push(json!({"op":"teach","word":word,"actionId":action_id,
            "previous":previous.clone(),"at":at,"planId":plan_id}));
        json!({"word":word,"actionId":action_id,"previous":previous,"version":version+1})
    }else{
        let Some(old)=previous else{return refused("CONTROL_WORD_UNKNOWN")};
        let forgot=old;
        entries.retain(|row|row["word"]!=word);
        history.push(json!({"op":"forget","word":word,"actionId":forgot,
            "at":at,"planId":plan_id}));
        json!({"word":word,"forgot":forgot,"version":version+1})
    };
    let from=history.len().saturating_sub(1000);
    history=history.split_off(from);
    let mut next=input["current"].clone();
    next["version"]=json!(version+1);
    next["entries"]=Value::Array(entries);
    next["history"]=Value::Array(history);
    projected(next,response)
}
