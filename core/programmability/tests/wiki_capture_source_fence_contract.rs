//! U05: read-only Wiki capture sidecar provenance must fail closed when malformed.
//! Only disposable local fixtures. No Host grants, provider operations or data ingestion.
use serde_json::{json,Map,Value};
use vivim_programmability_core::wiki_read::{read,source_search,source_stamp,source_delta,ReadError};

fn wiki()->Value {
    json!({"revision":5,"pages":{
        "Inbox":{"sections":{"Summary":"synthetic fixture"},"links":[]}
    }})
}
fn empty_captures(revision:u64)->Value {
    json!({"schema":"vivim.personal-captures/1",
        "authority":"committed-wiki-read-only",
        "wikiRevision":revision,
        "total":0,"omitted":0,
        "counts":{"notes":0,"openTasks":0,"doneTasks":0,"unknownTasks":0},
        "items":[]})
}
fn inert(value:&Value){
    assert_eq!(value["authority"],"none");
    assert_eq!(value["executionAuthorized"],false);
    assert_eq!(value["effectPerformed"],false);
}

#[test]
fn missing_and_explicitly_null_capture_sidecars_remain_optional() {
    let plain=wiki();
    assert!(read(&plain).unwrap().captures.is_none());
    let mut explicit=wiki();
    explicit["personalCaptures"]=Value::Null;
    let view=read(&explicit).expect("null is an unavailable optional sidecar");
    assert!(view.captures.is_none());
    assert_eq!(source_stamp(&json!({"wiki":explicit}))["state"],"computed");
}

#[test]
fn correctly_versioned_empty_capture_projection_remains_valid() {
    let mut doc=wiki();
    doc["personalCaptures"]=empty_captures(5);
    let view=read(&doc).expect("Host-issued empty projection");
    let captures=view.captures.expect("present valid sidecar");
    assert_eq!(captures.total,0);
    assert_eq!(captures.omitted,0);
    let stamp=source_stamp(&json!({"wiki":doc}));
    assert_eq!(stamp["state"],"computed");
    inert(&stamp);
}

#[test]
fn stale_capture_revision_cannot_be_silently_omitted_from_accepted_wiki() {
    let mut doc=wiki();
    doc["personalCaptures"]=empty_captures(4);
    assert_eq!(read(&doc).err(),Some(ReadError::InvalidProjection));
    let stamp=source_stamp(&json!({"wiki":doc.clone()}));
    assert_eq!(stamp["state"],"refused");
    assert_eq!(stamp["code"],"INVALID_WIKI_SOURCE");
    assert!(stamp.get("digest").is_none());
    inert(&stamp);
    let search=source_search(&json!({"wiki":doc.clone(),"query":"synthetic","limit":24}));
    assert_eq!(search["outcome"],"refused");
    assert!(search.get("results").is_none());
    inert(&search);
    let delta=source_delta(&json!({"previous":null,"current":doc}));
    assert_eq!(delta["outcome"],"refused");
    assert_eq!(delta["code"],"INVALID_CURRENT_SOURCE");
    inert(&delta);
}

#[test]
fn forged_done_task_status_cannot_create_a_valid_readback() {
    let name=format!("task-{}","a".repeat(32));
    let mut pages=Map::new();
    pages.insert(name.clone(),json!({
        "sections":{"Task":"PRIVATE-SYNTHETIC-TASK","Status":"Open"},"links":[]
    }));
    let mut doc=json!({"revision":5,"pages":Value::Object(pages)});
    doc["personalCaptures"]=json!({
        "schema":"vivim.personal-captures/1",
        "authority":"committed-wiki-read-only","wikiRevision":5,
        "total":1,"omitted":0,
        "counts":{"notes":0,"openTasks":0,"doneTasks":1,"unknownTasks":0},
        "items":[{"kind":"task","page":name,"section":"Task",
            "entryId":"00000000-0000-4000-8000-000000000001",
            "createdRevision":5,"status":"Done"}]
    });
    assert_eq!(read(&doc).err(),Some(ReadError::InvalidProjection));
    let stamp=source_stamp(&json!({"wiki":doc}));
    assert_eq!(stamp["state"],"refused");
    assert!(!stamp.to_string().contains("PRIVATE-SYNTHETIC-TASK"));
    inert(&stamp);
}
