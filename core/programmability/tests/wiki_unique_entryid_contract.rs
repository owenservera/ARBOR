//! O03 synthetic read-only Wiki journal identity regression tests.
use serde_json::{json, Value};
use vivim_programmability_core::wiki_journal::changes;
const A:&str="00000000-0000-4000-8000-000000000001";
const B:&str="00000000-0000-4000-8000-000000000002";
fn edit(revision:u64,sequence:u64,id:&str,page:&str)->Value {
    json!({"page":page,"section":"Note","action":"set-section",
      "expectedRevision":revision,"entryId":id,"sequence":sequence,
      "receivedAt":"2026-11-23T22:10:00Z",
      "contentDigest":"c".repeat(64),"sequenceBinding":null,
      "syntheticPrivate":"SYNTHETIC-DISALLOWED-TEXT"})
}
fn project(entries:Vec<Value>,current_only:bool)->Value {
    changes(&json!({"schema":"vivim.wiki-change-source/1",
      "currentOnly":current_only,"entries":entries}))
}
fn inert(result:&Value) {
    assert_eq!(result["authority"],"none");
    assert_eq!(result["executionAuthorized"],false);
    assert_eq!(result["effectPerformed"],false);
    assert!(!result.to_string().contains("SYNTHETIC-DISALLOWED-TEXT"));
}
#[test]
fn unique_entry_ids_keep_valid_current_source_projection(){
    let r=project(vec![edit(2,10,A,"Inbox"),edit(5,11,B,"Inbox")],true);
    assert_eq!(r["outcome"],"computed");
    assert_eq!(r["total"],1);
    assert_eq!(r["items"][0]["entryId"],B);
    assert_eq!(r["items"][0]["status"],"current-section-revision");
    inert(&r);
}
#[test]
fn reused_entry_id_same_page_is_refused_despite_new_revision_and_sequence(){
    let r=project(vec![edit(2,10,A,"Inbox"),edit(4,13,A,"Inbox")],false);
    assert_eq!(r["outcome"],"refused");
    assert_eq!(r["code"],"INVALID_WIKI_CHANGES_SOURCE");
    assert!(r.get("items").is_none());
    inert(&r);
}
#[test]
fn reused_entry_id_on_other_page_cannot_become_independent_evidence(){
    let r=project(vec![edit(2,10,A,"Inbox"),edit(3,11,A,"Tasks")],true);
    assert_eq!(r["outcome"],"refused");
    assert_eq!(r["code"],"INVALID_WIKI_CHANGES_SOURCE");
    inert(&r);
}
#[test]
fn legacy_unidentified_rows_do_not_claim_or_reserve_a_commit_identity(){
    let mut legacy=edit(3,11,A,"Inbox");
    legacy["entryId"]=Value::Null;
    legacy["sequence"]=Value::Null;
    let r=project(vec![legacy,edit(5,20,A,"Inbox")],true);
    assert_eq!(r["outcome"],"computed");
    assert_eq!(r["total"],1);
    assert_eq!(r["items"][0]["entryId"],A);
    inert(&r);
}
