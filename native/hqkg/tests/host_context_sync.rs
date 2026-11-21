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
// Durable delta ingestion: each record carries its own put/delete operation and
// the batch names the source revision it was projected from.
fn delta(file:&Path,scope:&str,base:u64,deltas:Vec<Value>) -> (bool,Value) {
    run_packet(file,json!({"schema":"vivim.hqkg-personal/1","scope":scope,"op":"sync-context",
        "baseRevision":base,"nodes":[],"relationships":[],"deltas":deltas}))
}
fn put(record:Value) -> Value {
    let mut d=record; d["op"]=json!("put"); d
}
fn tombstone(id:&str,kind:&str,revision:u64) -> Value {
    json!({"op":"delete","kind":kind,"id":id,"revision":revision})
}
fn query(file:&Path,scope:&str) -> Vec<Value> {
    let (ok,packet)=run_packet(file,json!({"schema":"vivim.hqkg-personal/1","scope":scope,"op":"query"}));
    assert!(ok,"{packet}");
    packet["nodes"].as_array().unwrap().clone()
}
fn qualified_id(file:&Path,scope:&str,source_ref:&str) -> String {
    query(file,scope).into_iter()
        .find(|n|n["properties"]["vivim.context.sourceRef"]==source_ref)
        .unwrap_or_else(||panic!("missing managed source {source_ref}"))["id"]
        .as_str().unwrap().to_string()
}
fn node_id(file:&Path,scope:&str,source_ref:&str) -> String {
    local(&qualified_id(file,scope,source_ref)).to_string()
}
// The delta protocol names records by their in-namespace local identity, exactly
// like the existing erase operations; the qualified id is the durable identity.
fn local(id:&str)->&str {
    match id.find("vivim-context-") {
        Some(at)=>&id[at..],
        None=>id,
    }
}
// A distinct managed Wiki observation per index, so a batch can carry far more
// records than one bounded read window will ever return.
fn wiki_record(index:usize,revision:u64) -> Value {
    json!({"id":format!("vivim-context-w-{:064x}",index as u64+1),"kind":"wiki",
        "sourceRef":format!("page-{index}"),
        "semanticId":format!("wiki:section:Page/{index}"),
        "digest":format!("{:064x}",index as u64+1),
        "revision":revision,"sourceRevision":revision,"order":index as u64+1,
        "title":format!("Wiki: Page/{index}"),"summary":format!("Committed text {index}")})
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

#[test]
fn delta_batches_ingest_past_the_bounded_read_window_without_dropping_older_sources() {
    let temp=Temp::new(); let file=temp.journal();
    let first:Vec<Value>=(0..40).map(|i|wiki_record(i,1)).collect();
    let second:Vec<Value>=(40..80).map(|i|wiki_record(i,1)).collect();
    // 80 authorized sources across two batches: durable ingestion is not capped at
    // the size of one bounded read window.
    let (ok,a)=delta(&file,SCOPE,0,first.iter().cloned().map(put).collect());
    assert!(ok,"{a}"); assert_eq!(a["mode"],"delta"); assert_eq!(a["ingested"],40);
    assert_eq!(a["tombstoned"],0);
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),40);
    let (ok,b)=delta(&file,SCOPE,1,second.iter().cloned().map(put).collect());
    assert!(ok,"{b}"); assert_eq!(b["ingested"],40);
    let epoch=b["epoch"].as_u64().unwrap();
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),80);
    // The second batch carries only records 40..80, so if omission were deletion
    // the first forty would be gone. They are still durable and still ranked.
    let phone=read(&file,SCOPE,epoch,"wiki").unwrap();
    assert_eq!(phone["totalRetrieved"],80);
    let window=phone["items"].as_array().unwrap().len();
    assert!(window>=1 && window<=8,"read window stays bounded: {window}");
    assert!(window<80,"bounded retrieval returns a window, never the durable set");
    let older=node_id(&file,SCOPE,"page-0");
    assert!(query(&file,SCOPE).iter().any(|n|local(n["id"].as_str().unwrap())==older &&
        n["properties"]["vivim.context.summary"]=="Committed text 0"));
    // The old source is still updatable after the window moved on.
    let (ok,c)=delta(&file,SCOPE,1,vec![put(wiki_record(0,2))]);
    assert!(ok,"{c}"); assert_eq!(c["tombstoned"],0);
    let updated:Vec<Value>=query(&file,SCOPE).into_iter()
        .filter(|n|local(n["id"].as_str().unwrap())==older).collect();
    assert_eq!(updated.len(),1);
    assert_eq!(updated[0]["properties"]["hqkg.provenance.revision"],"2");
    // A batch that claims to be projected from an older source than the one
    // already durable is refused, not applied.
    let current=fs::read(&file).unwrap();
    assert!(!delta(&file,SCOPE,0,second.iter().cloned().map(put).collect()).0);
    assert_eq!(fs::read(&file).unwrap(),current);
}

#[test]
fn explicit_tombstones_remove_one_source_and_replay_is_a_byte_identical_no_op() {
    let temp=Temp::new(); let file=temp.journal();
    let rows:Vec<Value>=(0..3).map(|i|wiki_record(i,1)).collect();
    let (ok,a)=delta(&file,SCOPE,0,rows.iter().cloned().map(put).collect());
    assert!(ok,"{a}");
    let before=fs::read(&file).unwrap();
    // Replaying an already-current batch stages nothing and writes nothing.
    let (ok,again)=delta(&file,SCOPE,1,rows.iter().cloned().map(put).collect());
    assert!(ok,"{again}"); assert_eq!(again["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),before);
    // An explicit tombstone removes exactly its own source.
    let victim=node_id(&file,SCOPE,"page-1");
    let (ok,d)=delta(&file,SCOPE,1,vec![tombstone(&victim,"wiki",1)]);
    assert!(ok,"{d}"); assert_eq!(d["tombstoned"],1);
    let after=fs::read(&file).unwrap();
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),2);
    assert!(!query(&file,SCOPE).iter().any(|n|local(n["id"].as_str().unwrap())==victim));
    assert!(query(&file,SCOPE).iter().any(|n|n["properties"]["vivim.context.sourceRef"]=="page-0"));
    // Replay is idempotent: the source is already gone, nothing is written.
    let (ok,replay)=delta(&file,SCOPE,1,vec![tombstone(&victim,"wiki",1)]);
    assert!(ok,"{replay}"); assert_eq!(replay["changed"],false);
    assert_eq!(replay["tombstoned"],0);
    assert_eq!(fs::read(&file).unwrap(),after);
    // A tombstone older than the source it names cannot remove it: the newer
    // source is held and the graph is left byte-identical.
    let survivor=node_id(&file,SCOPE,"page-2");
    let (ok,updated)=delta(&file,SCOPE,1,vec![put(wiki_record(2,2))]);
    assert!(ok,"{updated}");
    let current=fs::read(&file).unwrap();
    let (ok,stale)=delta(&file,SCOPE,2,vec![tombstone(&survivor,"wiki",1)]);
    assert!(!ok,"stale tombstone refused: {stale}");
    assert!(stale["error"].as_str().unwrap().contains("STALE_CONTEXT_SOURCE"));
    assert_eq!(fs::read(&file).unwrap(),current);
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),2);
}

#[test]
fn delta_tombstones_cannot_reach_another_namespace_or_a_non_context_record() {
    let temp=Temp::new(); let file=temp.journal();
    let other=temp.0.join("other.hqj");
    let other_scope="b".repeat(64);
    let other_scope=other_scope.as_str();
    let (ok,a)=delta(&file,SCOPE,0,vec![put(wiki_record(0,1))]);
    assert!(ok,"{a}");
    let (ok,b)=delta(&other,other_scope,0,vec![put(wiki_record(0,1))]);
    assert!(ok,"{b}");
    let own=fs::read(&file).unwrap();
    let foreign=fs::read(&other).unwrap();
    let foreign_id=qualified_id(&other,other_scope,"page-0");
    // A tombstone naming a qualified identity from another namespace is refused:
    // the namespace boundary is checked before any op is built.
    let (ok,cross)=delta(&file,SCOPE,1,vec![tombstone(&foreign_id,"wiki",1)]);
    assert!(!ok,"cross-namespace tombstone refused: {cross}");
    assert_eq!(fs::read(&file).unwrap(),own);
    assert_eq!(fs::read(&other).unwrap(),foreign);
    assert_eq!(Journal::new(&other).load().unwrap().node_count(),1);
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),1);
    // A tombstone may only name a managed context record, never another node in
    // the same namespace (commit markers, other capabilities' records).
    let (ok,marker)=delta(&file,SCOPE,1,vec![tombstone("commit-abc","wiki",1)]);
    assert!(!ok,"non-context tombstone refused: {marker}");
    // A kind that disagrees with the identity prefix is refused too.
    let (ok,mismatch)=delta(&file,SCOPE,1,vec![tombstone(&node_id(&file,SCOPE,"page-0"),"effect",1)]);
    assert!(!ok,"kind/identity mismatch refused: {mismatch}");
    assert_eq!(fs::read(&file).unwrap(),own);
}

#[test]
fn delta_ingestion_requires_a_base_revision() {
    let temp=Temp::new(); let file=temp.journal();
    // A delta batch that does not name the source revision it came from is
    // refused outright: the fence is not optional on this path.
    let (ok,no_base)=run_packet(&file,json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context","nodes":[],"deltas":vec![put(wiki_record(0,1))]}));
    assert!(!ok,"delta without baseRevision accepted: {no_base}");
    let (ok,a)=delta(&file,SCOPE,0,vec![put(wiki_record(0,1))]);
    assert!(ok,"{a}");
    // base 0 means "nothing projected yet" and is now behind the durable head.
    assert!(!delta(&file,SCOPE,0,vec![put(wiki_record(1,1))]).0);
    // A batch at the current head is accepted.
    let (ok,b)=delta(&file,SCOPE,1,vec![put(wiki_record(1,1))]);
    assert!(ok,"{b}");
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),2);
}

#[test]
fn delta_ingestion_and_a_complete_projection_converge_on_the_same_durable_graph() {
    let temp=Temp::new(); let file=temp.journal();
    let rows:Vec<Value>=(0..3).map(|i|wiki_record(i,2)).collect();
    let (ok,a)=delta(&file,SCOPE,0,rows.iter().cloned().map(put).collect());
    assert!(ok,"{a}");
    let bytes=fs::read(&file).unwrap();
    // Re-sending the same sources as a complete projection changes nothing: the
    // delta path is the same durable graph, not a second one.
    let (ok,b)=sync(&file,SCOPE,rows.clone());
    assert!(ok,"{b}"); assert_eq!(b["mode"],"projection");
    assert_eq!(b["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),bytes);
    // Restart parity: a fresh process reads the same head the delta wrote.
    let graph=Journal::new(&file).load().unwrap();
    assert_eq!(graph.node_count(),3);
    let status=Journal::new(&file).status().unwrap();
    assert_eq!(graph.epoch(),status.epoch);
    assert_eq!(status.trailing_bytes,0);
    assert_eq!(status.total_bytes,bytes.len() as u64);
}


#[test]
fn scoped_active_source_read_and_epoch_fenced_delta_preserve_unselected_history() {
    let temp=Temp::new(); let file=temp.journal();
    let a=wiki_record(0,1); let b=wiki_record(1,1);
    let (ok,first)=sync(&file,SCOPE,vec![a.clone(),b.clone()]);
    assert!(ok,"{first}");
    let epoch=first["epoch"].as_u64().unwrap();
    let req=|base:u64,active:Vec<Value>,deltas:Vec<Value>|json!({
        "schema":"vivim.hqkg-personal/1","scope":SCOPE,"op":"sync-context-read",
        "view":"wiki","nodes":[],"relationships":[],"baseRevision":2,
        "baseEpoch":base,"deltas":deltas,"activeIds":active
    });
    let active=vec![b["id"].clone()];
    let bytes=fs::read(&file).unwrap();
    let (ok,selected)=run_packet(&file,req(epoch,active.clone(),vec![]));
    assert!(ok,"{selected}");
    assert_eq!(selected["mode"],"delta");
    assert_eq!(selected["context"]["totalRetrieved"],1);
    assert_eq!(selected["context"]["items"][0]["sourceRef"],"page-1");
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),2);
    assert_eq!(fs::read(&file).unwrap(),bytes,"read selection must not write");
    let mut updated=wiki_record(1,2);
    updated["summary"]=json!("Verified revision two");
    let (ok,stale)=run_packet(&file,req(epoch+1,active.clone(),vec![put(updated.clone())]));
    assert!(!ok,"stale graph epoch must refuse: {stale}");
    assert_eq!(fs::read(&file).unwrap(),bytes);
    let (ok,current)=run_packet(&file,req(epoch,active.clone(),vec![put(updated.clone())]));
    assert!(ok,"{current}");
    assert_eq!(current["ingested"],1);
    assert_eq!(current["context"]["totalRetrieved"],1);
    assert_eq!(current["context"]["items"][0]["summary"],"Verified revision two");
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),2);
    let old_active=vec![a["id"].clone()];
    let (ok,historical)=run_packet(&file,req(current["epoch"].as_u64().unwrap(),old_active,vec![]));
    assert!(ok,"{historical}");
    assert_eq!(historical["context"]["items"][0]["sourceRef"],"page-0");
    let (ok,invalid)=run_packet(&file,req(current["epoch"].as_u64().unwrap(),vec![json!("foreign:node")],vec![]));
    assert!(!ok,"foreign active source must be refused: {invalid}");
}

#[test]
fn explicit_link_invalidation_removes_only_committed_page_relationship() {
    let temp=Temp::new(); let file=temp.journal();
    let mut a=wiki_record(0,3); a["semanticId"]=json!("wiki:page:Alpha");
    let mut b=wiki_record(1,3); b["semanticId"]=json!("wiki:page:Beta");
    let from=a["id"].as_str().unwrap(); let to=b["id"].as_str().unwrap();
    let id=format!("vivim-context-p-{:x}",Sha256::digest(
        serde_json::to_string(&[from,to]).unwrap().as_bytes()));
    let link=json!({"id":id,"from":from,"to":to,"kind":"wiki-page-link",
        "sourceRef":ENTRY,"revision":3,"digest":"a".repeat(64)});
    let rows=vec![a.clone(),b.clone()];
    let (ok,first)=sync_with_relationships(&file,SCOPE,rows.clone(),vec![link.clone()]);
    assert!(ok,"{first}");
    let epoch=first["epoch"].as_u64().unwrap();
    // A restart may still have a durable historic relationship outside the
    // current bounded Host link projection. Selection never exposes it.
    let masked=json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context-read","view":"wiki","nodes":[],"relationships":[],
        "baseRevision":3,"baseEpoch":epoch,"deltas":[],
        "activeIds":[a["id"],b["id"]],"activeRelationshipIds":[]});
    let (ok,readback)=run_packet(&file,masked);
    assert!(ok,"{readback}");
    assert_eq!(readback["context"]["pageRelationships"],json!([]));
    assert_eq!(Journal::new(&file).load().unwrap().edge_count(),1,
        "read selection cannot remove the durable relationship");
    let del=json!({"op":"delete","id":link["id"],"revision":3,"digest":link["digest"]});
    let packet=json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context-read","view":"wiki","nodes":[],"relationships":[],
        "baseRevision":3,"baseEpoch":epoch,"deltas":[],
        "activeIds":[a["id"],b["id"]],"activeRelationshipIds":[],"relationshipDeltas":[del]});
    let (ok,removed)=run_packet(&file,packet);
    assert!(ok,"{removed}");
    assert_eq!(removed["context"]["pageRelationships"],json!([]));
    assert_eq!(Journal::new(&file).load().unwrap().edge_count(),0);
    let bytes=fs::read(&file).unwrap();
    let (ok,stale)=run_packet(&file,json!({"schema":"vivim.hqkg-personal/1",
        "scope":SCOPE,"op":"sync-context","nodes":[],"relationships":[],
        "baseRevision":3,"baseEpoch":epoch,"deltas":[]}));
    assert!(!ok,"old link revision frame must be refused: {stale}");
    assert_eq!(fs::read(&file).unwrap(),bytes);
}


#[test]
fn multi_batch_ingestion_keeps_over_five_hundred_sources_and_reads_one_epoch() {
    let temp=Temp::new(); let file=temp.journal();
    let rows:Vec<Value>=(0..620).map(|i|wiki_record(i,1)).collect();
    let mut epoch=None;
    for chunk in rows.chunks(256) {
        let packet=json!({"schema":"vivim.hqkg-personal/1","scope":SCOPE,
            "op":"sync-context","nodes":[],"relationships":[],"baseRevision":1,
            "deltas":chunk.iter().cloned().map(put).collect::<Vec<_>>()});
        let mut packet=packet;
        if let Some(prior)=epoch {packet["baseEpoch"]=json!(prior);}
        let (ok,next)=run_packet(&file,packet);
        assert!(ok,"{next}");
        assert_eq!(next["mode"],"delta");
        assert_eq!(next["ingested"],chunk.len());
        assert_eq!(next["synced"],chunk.len());
        epoch=next["epoch"].as_u64();
    }
    let epoch=epoch.unwrap();
    let active=rows.iter().map(|r|r["id"].clone()).collect::<Vec<_>>();
    let (ok,context)=run_packet(&file,json!({
        "schema":"vivim.hqkg-personal/1","scope":SCOPE,"op":"sync-context-read",
        "view":"wiki","nodes":[],"relationships":[],"baseRevision":1,
        "baseEpoch":epoch,"deltas":[],"activeIds":active,
        "activeRelationshipIds":[]
    }));
    assert!(ok,"{context}");
    assert_eq!(context["epoch"],epoch);
    assert_eq!(context["synced"],0);
    assert_eq!(context["changed"],false);
    assert_eq!(context["context"]["totalRetrieved"],620);
    assert!(context["context"]["items"].as_array().unwrap().len()<=8);
    assert_eq!(Journal::new(&file).load().unwrap().node_count(),620);
    let bytes=fs::read(&file).unwrap();
    let (ok,stale)=run_packet(&file,json!({
        "schema":"vivim.hqkg-personal/1","scope":SCOPE,"op":"sync-context",
        "nodes":[],"relationships":[],"baseRevision":1,"baseEpoch":epoch-1,
        "deltas":[put(wiki_record(620,1))]
    }));
    assert!(!ok,"epoch mismatch should refuse: {stale}");
    assert_eq!(fs::read(&file).unwrap(),bytes);
}


#[test]
fn delayed_d4_receipt_delta_links_an_unchanged_durable_wiki_source() {
    let temp=Temp::new();let file=temp.journal();
    // The Wiki edit is already committed before the D4 receipt becomes visible.
    let (ok,first)=sync(&file,SCOPE,vec![wiki(ENTRY,2,"Committed Wiki source")]);
    assert!(ok,"{first}");
    assert_eq!(Journal::new(&file).load().unwrap().edge_count(),0);
    let (ok,late)=delta(&file,SCOPE,2,vec![put(effect())]);
    assert!(ok,"{late}");
    assert_eq!(late["ingested"],1);
    let graph=Journal::new(&file).load().unwrap();
    assert_eq!(graph.node_count(),2);
    assert_eq!(graph.edge_count(),1,"late receipt must link to existing committed source");
    let link=graph.edges().next().unwrap();
    assert_eq!(link.relation,"committed-wiki-change");
    assert_eq!(link.properties.get("vivim.context.kind").map(String::as_str),Some("effect-wiki-link"));
    let epoch=late["epoch"].as_u64().unwrap();
    let owner=read(&file,SCOPE,epoch,"owner").unwrap();
    assert_eq!(owner["effectRelationships"].as_array().unwrap().len(),1);
    let lineage=&owner["effectRelationships"][0];
    assert_eq!(lineage["sourceRef"],"ctl-0123456789abcdef");
    assert_eq!(lineage["wikiEntryId"],ENTRY);
    assert_eq!(lineage["wikiRevision"],2);
    assert_eq!(lineage["kind"],"committed-wiki-change");
    let phone=read(&file,SCOPE,epoch,"wiki").unwrap();
    assert!(phone.get("effectRelationships").is_none(),
        "owner receipt lineage must not enter phone Wiki context");
    let bytes=fs::read(&file).unwrap();
    let (ok,replay)=delta(&file,SCOPE,2,vec![put(effect())]);
    assert!(ok,"{replay}");
    assert_eq!(replay["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),bytes);
    // Replacing the section revokes only the current-lineage edge. The
    // historical effect and its applied receipt identity stay durable.
    let (ok,changed)=delta(&file,SCOPE,3,vec![put(wiki(NEXT,3,"Next committed source"))]);
    assert!(ok,"{changed}");
    let graph=Journal::new(&file).load().unwrap();
    assert_eq!(graph.node_count(),2);
    assert_eq!(graph.edge_count(),0,"superseded source must invalidate D4 link");
    let owner=read(&file,SCOPE,changed["epoch"].as_u64().unwrap(),"owner").unwrap();
    assert_eq!(owner["effectRelationships"],json!([]));
    assert_eq!(owner["omittedEffectRelationships"],0);
    assert!(graph.nodes().any(|n|
        n.properties.get("vivim.context.sourceRef").map(String::as_str)==Some("ctl-0123456789abcdef")));
    let bytes=fs::read(&file).unwrap();
    let (ok,stale)=delta(&file,SCOPE,3,vec![put(effect())]);
    assert!(ok,"historical receipt can remain immutable: {stale}");
    assert_eq!(stale["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),bytes);
}


#[test]
fn owner_lineage_digest_covers_all_thirty_active_edges_not_only_display_rows() {
    let temp=Temp::new(); let file=temp.journal();
    let mut nodes=vec![wiki(ENTRY,2,"Current committed Wiki section")];
    for i in 0..30u64 {
        let mut receipt=effect();
        let plan_id=format!("ctl-{i:016x}");
        receipt["id"]=json!(format!("vivim-context-e-{i:064x}"));
        receipt["sourceRef"]=json!(plan_id);
        receipt["semanticId"]=json!(format!("receipt:ctl-{i:016x}"));
        receipt["order"]=json!(i+4);
        nodes.push(receipt);
    }
    let (ok,first)=sync(&file,SCOPE,nodes);
    assert!(ok,"{first}");
    let epoch=first["epoch"].as_u64().unwrap();
    let graph=Journal::new(&file).load().unwrap();
    assert_eq!(graph.edge_count(),30);
    let owner=read(&file,SCOPE,epoch,"owner").unwrap();
    assert_eq!(owner["effectRelationshipsTotal"],30);
    assert_eq!(owner["omittedEffectRelationships"],6);
    let shown=owner["effectRelationships"].as_array().unwrap();
    assert_eq!(shown.len(),24);
    assert!(shown.windows(2).all(|w|w[0]["id"]<=w[1]["id"]));
    let mut proof=Vec::new();
    for edge in graph.edges() {
        let receipt=graph.node(&edge.from).unwrap();
        let wiki=graph.node(&edge.to).unwrap();
        proof.push(json!([
            local(&edge.id),local(&edge.from),local(&edge.to),edge.relation,
            receipt.properties.get("vivim.context.sourceRef").unwrap(),
            receipt.properties.get("hqkg.provenance.digest").unwrap(),
            wiki.properties.get("vivim.context.sourceRef").unwrap(),2
        ]));
    }
    proof.sort_by(|a,b|a[0].as_str().cmp(&b[0].as_str()));
    let expected=format!("{:x}",Sha256::digest(serde_json::to_vec(&proof).unwrap()));
    let sha=owner["effectRelationshipsDigest"].as_str().unwrap();
    assert_eq!(sha,expected,"native proof must cover every active D4 edge");
    assert_ne!(sha,format!("{:x}",Sha256::digest(b"[]")));
    let phone=read(&file,SCOPE,epoch,"wiki").unwrap();
    assert!(phone.get("effectRelationships").is_none());
    assert!(phone.get("effectRelationshipsDigest").is_none());
}

#[test]
fn exact_graph_epoch_fences_independent_lower_revision_sources() {
    let temp=Temp::new();let file=temp.journal();
    let mut receipt=effect();receipt["revision"]=json!(100);
    receipt["sourceRevision"]=json!(100);
    receipt["wikiLink"]=Value::Null;
    let current=wiki(ENTRY,2,"Current Wiki content");
    let (ok,first)=sync(&file,SCOPE,vec![current.clone(),receipt]);
    assert!(ok,"{first}");
    let epoch=first["epoch"].as_u64().unwrap();
    let updated=wiki(NEXT,3,"Next Wiki content");
    let (ok,valid)=run_packet(&file,json!({
        "schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context","nodes":[],"relationships":[],
        "baseRevision":3,"baseEpoch":epoch,
        "deltas":[put(updated)]
    }));
    assert!(ok,"unrelated receipt revision should not block epoch-fenced Wiki delta: {valid}");
    let after=valid["epoch"].as_u64().unwrap();
    assert!(after>epoch);
    let bytes=fs::read(&file).unwrap();
    let (ok,stale)=run_packet(&file,json!({
        "schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context","nodes":[],"relationships":[],
        "baseRevision":3,"baseEpoch":after,
        "deltas":[put(current)]
    }));
    assert!(!ok,"per-source revision still refuses older Wiki source: {stale}");
    assert_eq!(fs::read(&file).unwrap(),bytes);
}

#[test]
fn delinked_historical_receipt_retains_its_node_but_drops_old_d4_edge() {
    let temp=Temp::new();let file=temp.journal();
    let (ok,first)=sync(&file,SCOPE,vec![wiki(ENTRY,2,"Current"),effect()]);
    assert!(ok,"{first}");
    assert_eq!(Journal::new(&file).load().unwrap().edge_count(),1);
    let mut historical=effect();
    historical["wikiLink"]=Value::Null;
    let epoch=first["epoch"].as_u64().unwrap();
    let (ok,removed)=run_packet(&file,json!({
        "schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context","nodes":[],"relationships":[],
        "baseRevision":2,"baseEpoch":epoch,
        "deltas":[put(historical.clone())]
    }));
    assert!(ok,"{removed}");
    let graph=Journal::new(&file).load().unwrap();
    assert_eq!(graph.node_count(),2);
    assert_eq!(graph.edge_count(),0);
    let bytes=fs::read(&file).unwrap();
    let (ok,again)=run_packet(&file,json!({
        "schema":"vivim.hqkg-personal/1","scope":SCOPE,
        "op":"sync-context","nodes":[],"relationships":[],
        "baseRevision":2,"baseEpoch":removed["epoch"],
        "deltas":[put(historical)]
    }));
    assert!(ok,"{again}");
    assert_eq!(again["changed"],false);
    assert_eq!(fs::read(&file).unwrap(),bytes);
}
