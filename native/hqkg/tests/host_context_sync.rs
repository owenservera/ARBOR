//! Real existing CLI processes against a temporary HQKG journal.
#![cfg(feature = "importer")]
use hqkg::Journal;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{fs, io::Write, path::{Path, PathBuf}, process::{Command, Stdio}, time::{SystemTime, UNIX_EPOCH}};
const SCOPE: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ENTRY: &str = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const NEXT: &str = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

struct Temp(PathBuf);
impl Temp {
    fn new() -> Self {
        let p=std::env::temp_dir().join(format!("hqkg-host-context-{}-{}",
            std::process::id(),SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()));
        fs::create_dir_all(&p).unwrap();
        Self(p)
    }
    fn journal(&self) -> PathBuf { self.0.join("personal.hqj") }
}
impl Drop for Temp { fn drop(&mut self) { let _=fs::remove_dir_all(&self.0); } }

fn sync(file:&Path,scope:&str,nodes:Vec<Value>) -> (bool,Value) {
    sync_with_relationships(file,scope,nodes,vec![])
}
fn sync_with_relationships(file:&Path,scope:&str,nodes:Vec<Value>,relationships:Vec<Value>) -> (bool,Value) {
    run_packet(file,json!({"schema":"vivim.hqkg-personal/1","scope":scope,"op":"sync-context","nodes":nodes,"relationships":relationships}))
}
fn run_packet(file:&Path,packet:Value) -> (bool,Value) {
    let mut child=Command::new(env!("CARGO_BIN_EXE_hqkg-personal"))
        .arg("--journal").arg(file).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().unwrap();
    child.stdin.take().unwrap().write_all(&serde_json::to_vec(&packet).unwrap()).unwrap();
    let out=child.wait_with_output().unwrap();
    (out.status.success(),serde_json::from_slice(&out.stdout).unwrap())
}
fn read(file:&Path,scope:&str,epoch:u64,view:&str) -> Option<Value> {
    let out=Command::new(env!("CARGO_BIN_EXE_hqkg-chat-context"))
        .arg(file).arg("--managed").arg(scope).arg(epoch.to_string()).arg(view).output().unwrap();
    if !out.status.success(){return None;}
    Some(serde_json::from_slice(&out.stdout).unwrap())
}
fn wiki(entry:&str,revision:u64,summary:&str)->Value {
    json!({"id":format!("vivim-context-w-{}","1".repeat(64)),"kind":"wiki","sourceRef":entry,
        "semanticId":"wiki:section:Main/About",
        "digest":if revision==2 {"2".repeat(64)} else {"3".repeat(64)},
        "revision":revision,"sourceRevision":revision,"order":revision,
        "title":"Wiki: Main/About","summary":summary})
}
fn effect()->Value {
    json!({"id":format!("vivim-context-e-{}","2".repeat(64)),"kind":"effect","sourceRef":"ctl-0123456789abcdef",
        "semanticId":"receipt:ctl-0123456789abcdef","digest":"4".repeat(64),
        "revision":2,"sourceRevision":2,"order":3,
        "title":"Applied: wiki.section.edit","summary":"Historical Host receipt",
        "actionId":"wiki.section.edit","wikiLink":{"kind":"committed-wiki-change","entryId":ENTRY,"wikiRevision":2}})
}
#[test]
fn native_reconciles_sources_without_duplicate_frames_or_stale_links() {
    let temp=Temp::new(); let file=temp.journal();
    let rows=vec![wiki(ENTRY,2,"First committed text"),effect()];
    let (ok,first)=sync(&file,SCOPE,rows.clone());
    assert!(ok,"{first}"); assert_eq!(first["synced"],2);
    let epoch=first["epoch"].as_u64().unwrap();
    let graph=Journal::new(&file).load().unwrap();
    assert_eq!(graph.node_count(),2); assert_eq!(graph.edge_count(),1);
    let bytes=fs::read(&file).unwrap();
    let (ok,second)=sync(&file,SCOPE,rows);
    assert!(ok,"{second}"); assert_eq!(second["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),bytes);
    let phone=read(&file,SCOPE,epoch,"wiki").unwrap();
    assert_eq!(phone["totalRetrieved"],1);
    assert_eq!(phone["items"][0]["summary"],"First committed text");
    assert_eq!(phone["items"][0]["sourceRevision"],2);
    assert!(phone["items"].as_array().unwrap().iter().all(|n|n["kind"]=="wiki"));
    let owner=read(&file,SCOPE,epoch,"owner").unwrap();
    assert_eq!(owner["totalRetrieved"],2);
    assert!(owner["tokensUsed"].as_u64().unwrap()<=320);
    let (ok,edited)=sync(&file,SCOPE,vec![wiki(NEXT,3,"Updated committed text"),effect()]);
    assert!(ok,"{edited}");
    let next=edited["epoch"].as_u64().unwrap();
    assert!(next>epoch);
    assert!(read(&file,SCOPE,epoch,"wiki").is_none());
    let phone=read(&file,SCOPE,next,"wiki").unwrap();
    assert_eq!(phone["items"][0]["summary"],"Updated committed text");
    assert_eq!(phone["items"][0]["sourceRevision"],3);
    assert!(!phone.to_string().contains("First committed text"));
    let graph=Journal::new(&file).load().unwrap();
    assert_eq!(graph.node_count(),2);
    assert_eq!(graph.edge_count(),0,"historical receipt cannot link to replacement");
    let before_stale=fs::read(&file).unwrap();
    assert!(!sync(&file,SCOPE,vec![wiki(ENTRY,2,"First committed text"),effect()]).0);
    assert_eq!(fs::read(&file).unwrap(),before_stale,"stale source cannot regress current node");
    assert!(read(&file,&"b".repeat(64),next,"wiki").is_none());
    assert!(!sync(&file,&"b".repeat(64),vec![]).0);
    let (ok,removed)=sync(&file,SCOPE,vec![]);
    assert!(ok,"{removed}");
    let empty=read(&file,SCOPE,removed["epoch"].as_u64().unwrap(),"wiki").unwrap();
    assert_eq!(empty["totalRetrieved"],0);
    assert_eq!(empty["items"],json!([]));
}
#[test]
fn strict_cas_and_torn_tail_cannot_publish_stale_snapshot() {
    let temp=Temp::new(); let file=temp.journal();
    let (ok,initial)=sync(&file,SCOPE,vec![wiki(ENTRY,2,"Committed")]);
    assert!(ok,"{initial}");
    let journal=Journal::new(&file);
    let old=journal.status().unwrap();
    let stale=journal.load().unwrap();
    let (ok,newer)=sync(&file,SCOPE,vec![wiki(NEXT,3,"Updated")]);
    assert!(ok,"{newer}");
    assert!(journal.save_checked(&stale,old.total_bytes,old.epoch).is_err());
    let mut f=fs::OpenOptions::new().append(true).open(&file).unwrap();
    f.write_all(b"HQ").unwrap(); f.sync_all().unwrap(); drop(f);
    assert!(!sync(&file,SCOPE,vec![]).0);
    assert!(read(&file,SCOPE,newer["epoch"].as_u64().unwrap(),"wiki").is_none());
}
#[test]
fn empty_source_sync_is_a_real_empty_native_journal() {
    let temp=Temp::new(); let file=temp.journal();
    let (ok,empty)=sync(&file,SCOPE,vec![]);
    assert!(ok,"{empty}");
    assert!(file.is_file());
    assert_eq!(read(&file,SCOPE,empty["epoch"].as_u64().unwrap(),"owner").unwrap()["items"],json!([]));
}

#[test]
fn committed_page_links_reconcile_and_are_read_back_as_actual_native_edges() {
    let temp=Temp::new(); let file=temp.journal();
    let mut a=wiki(ENTRY,3,"Committed Wiki structure");
    a["semanticId"]=json!("wiki:page:Main");
    let mut b=wiki(NEXT,3,"Committed Wiki structure");
    b["id"]=json!(format!("vivim-context-w-{}","5".repeat(64)));
    b["semanticId"]=json!("wiki:page:project");
    let local_id=format!("vivim-context-p-{:x}",Sha256::digest(serde_json::to_string(&[a["id"].as_str().unwrap(),b["id"].as_str().unwrap()]).unwrap().as_bytes()));
    let relation=json!({"id":local_id,
        "from":a["id"],"to":b["id"],"kind":"wiki-page-link",
        "sourceRef":NEXT,"revision":3,"digest":"3".repeat(64)});
    let rows=vec![a,b];
    let (ok,first)=sync_with_relationships(&file,SCOPE,rows.clone(),vec![relation.clone()]);
    assert!(ok,"{first}");
    assert_eq!(first["syncedRelationships"],1);
    assert_eq!(Journal::new(&file).load().unwrap().edge_count(),1);
    let epoch=first["epoch"].as_u64().unwrap();
    let phone=read(&file,SCOPE,epoch,"wiki").unwrap();
    assert_eq!(phone["pageRelationships"],json!([relation.clone()]));
    let bytes=fs::read(&file).unwrap();
    let (ok,unchanged)=sync_with_relationships(&file,SCOPE,rows.clone(),vec![relation.clone()]);
    assert!(ok,"{unchanged}"); assert_eq!(unchanged["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),bytes);
    let mut invalid=relation;
    invalid["to"]=invalid["from"].clone();
    assert!(!sync_with_relationships(&file,SCOPE,rows.clone(),vec![invalid]).0);
    assert_eq!(fs::read(&file).unwrap(),bytes);
    let (ok,removed)=sync_with_relationships(&file,SCOPE,rows,vec![]);
    assert!(ok,"{removed}");
    assert_eq!(Journal::new(&file).load().unwrap().edge_count(),0);
    assert_eq!(read(&file,SCOPE,removed["epoch"].as_u64().unwrap(),"wiki").unwrap()["pageRelationships"],json!([]));
}

#[test]
fn combined_sync_read_matches_standalone_durable_projection_and_rejects_unsafe_views() {
    let temp=Temp::new(); let file=temp.journal();
    let rows=vec![wiki(ENTRY,2,"First committed text"),effect()];
    let req=|view:&str, nodes:&Vec<Value>|json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context-read","view":view,"nodes":nodes,"relationships":[]});
    let (ok,initial)=run_packet(&file,req("wiki",&rows));
    assert!(ok,"{initial}");
    assert_eq!(initial["op"],"sync-context-read");
    let epoch=initial["epoch"].as_u64().unwrap();
    assert_eq!(initial["context"],read(&file,SCOPE,epoch,"wiki").unwrap());
    assert_eq!(initial["context"]["totalRetrieved"],1);
    let bytes=fs::read(&file).unwrap();
    let (ok,owner)=run_packet(&file,req("owner",&rows));
    assert!(ok,"{owner}");
    assert_eq!(owner["context"],read(&file,SCOPE,epoch,"owner").unwrap());
    assert_eq!(owner["context"]["totalRetrieved"],2);
    assert_eq!(owner["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),bytes);
    assert!(!run_packet(&file,req("all",&vec![])).0);
    assert_eq!(fs::read(&file).unwrap(),bytes);
    let next=vec![wiki(NEXT,3,"Replacement"),effect()];
    let (ok,updated)=run_packet(&file,req("wiki",&next));
    assert!(ok,"{updated}");
    let new_epoch=updated["epoch"].as_u64().unwrap();
    assert!(new_epoch>epoch);
    assert_eq!(updated["context"],read(&file,SCOPE,new_epoch,"wiki").unwrap());
    assert_eq!(updated["context"]["items"][0]["summary"],"Replacement");
    let current=fs::read(&file).unwrap();
    assert!(!run_packet(&file,req("wiki",&rows)).0);
    assert_eq!(fs::read(&file).unwrap(),current);
    let (graph,status)=Journal::new(&file).load_with_status().unwrap();
    assert_eq!(graph.epoch(),status.epoch);
    assert_eq!(status.total_bytes,current.len() as u64);
    assert_eq!(status.trailing_bytes,0);
    let mut f=fs::OpenOptions::new().append(true).open(&file).unwrap();
    f.write_all(b"HQ").unwrap(); f.sync_all().unwrap(); drop(f);
    assert!(!run_packet(&file,req("wiki",&next)).0);
}
