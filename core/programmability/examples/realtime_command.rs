//! Diagnostic native projection client. Reads actual Host interpretation responses.
//! This is not a UI test or a Host authorization path.
use std::io::{self,BufRead};
use serde_json::{json,Value};
use vivim_programmability_core::realtime_command::project_current_draft;
fn main(){
 for line in io::stdin().lock().lines(){
  let Ok(line)=line else{std::process::exit(1)};
  let result=serde_json::from_str::<Value>(&line).ok().and_then(|v|{
    let text=v["text"].as_str()?;
    project_current_draft(text,&v["response"]).ok()
  });
  match result{
    Some(reading)=>println!("{}",json!({"ok":true,"reading":reading})),
    None=>{println!("{}",json!({"ok":false,"error":"invalid-or-stale-projection"}));std::process::exit(1);}
  }
 }
}
