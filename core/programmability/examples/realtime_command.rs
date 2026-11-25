//! Diagnostic native user-context client. Reads actual Host interpretation and Wiki responses.
//! Not GUI acceptance or an authorization path.
use std::io::{self,BufRead};
use serde_json::{json,Value};
use vivim_programmability_core::{realtime_command::project_user_context,wiki_read};
fn main(){
 for line in io::stdin().lock().lines(){
  let Ok(line)=line else{std::process::exit(1)};
  let result=serde_json::from_str::<Value>(&line).ok().and_then(|v|{
    let text=v["text"].as_str()?;
    let revision=v["draftRevision"].as_u64()?;
    let wiki=if v["wiki"].is_null(){None}else{Some(wiki_read::read(&v["wiki"]).ok()?)};
    project_user_context(text,revision,v.get("response").filter(|x|!x.is_null()),wiki.as_ref()).ok()
  });
  match result{
    Some(bundle)=>println!("{}",json!({"ok":true,"bundle":bundle})),
    None=>{println!("{}",json!({"ok":false,"error":"invalid-or-stale-projection"}));std::process::exit(1);}
  }
 }
}
