//! O03: read-only journal sequence integrity, synthetic entries only.
use serde_json::{json, Value};
use vivim_programmability_core::wiki_journal::changes;

const A: &str = "00000000-0000-4000-8000-000000000001";
const B: &str = "00000000-0000-4000-8000-000000000002";
const C: &str = "00000000-0000-4000-8000-000000000003";

fn entry(revision: u64, sequence: u64, id: &str, page: &str) -> Value {
    json!({
        "action":"set-section",
        "page":page,
        "section":"Summary",
        "expectedRevision":revision,
        "entryId":id,
        "sequence":sequence,
        "receivedAt":"2026-11-23T22:20:00Z",
        "contentDigest":"b".repeat(64),
        "sequenceBinding":null,
        "privateRawContent":"PRIVATE-SYNTHETIC-NEVER-RETURN"
    })
}
fn project(items: Vec<Value>, current_only: bool) -> Value {
    changes(&json!({"schema":"vivim.wiki-change-source/1",
        "currentOnly":current_only,"entries":items}))
}
fn safe(result:&Value) {
    assert_eq!(result["authority"],"none");
    assert_eq!(result["executionAuthorized"],false);
    assert_eq!(result["effectPerformed"],false);
    assert!(!result.to_string().contains("PRIVATE-SYNTHETIC"));
}

#[test]
fn ordered_host_sequences_with_gaps_preserve_current_and_superseded() {
    let result=project(vec![
        entry(2,40,A,"Inbox"),
        entry(4,43,B,"Tasks"),
        entry(7,48,C,"Inbox")
    ],false);
    assert_eq!(result["outcome"],"computed");
    assert_eq!(result["total"],3);
    assert_eq!(result["items"][0]["status"],"superseded-section-revision");
    assert_eq!(result["items"][1]["status"],"current-section-revision");
    assert_eq!(result["items"][2]["status"],"current-section-revision");
    safe(&result);
}

#[test]
fn reversed_journal_sequence_with_increasing_revisions_fails_closed() {
    let result=project(vec![
        entry(3,77,A,"Inbox"),entry(4,76,B,"Inbox")
    ],true);
    assert_eq!(result["outcome"],"refused");
    assert_eq!(result["code"],"INVALID_WIKI_CHANGES_SOURCE");
    assert!(result.get("items").is_none());
    safe(&result);
}

#[test]
fn duplicate_journal_sequence_across_distinct_pages_fails_closed() {
    let result=project(vec![
        entry(1,20,A,"Inbox"),entry(2,20,B,"Tasks")
    ],false);
    assert_eq!(result["outcome"],"refused");
    assert_eq!(result["code"],"INVALID_WIKI_CHANGES_SOURCE");
    safe(&result);
}

#[test]
fn unidentified_legacy_entry_does_not_forge_or_reset_sequence_identity() {
    let mut legacy=entry(5,11,B,"Inbox");
    legacy["entryId"]=Value::Null;
    legacy["sequence"]=Value::Null;
    let result=project(vec![
        entry(3,10,A,"Inbox"),legacy,entry(6,15,C,"Inbox")
    ],true);
    assert_eq!(result["outcome"],"computed");
    assert_eq!(result["total"],1);
    assert_eq!(result["items"][0]["entryId"],C);
    assert_eq!(result["items"][0]["sequence"],15);
    safe(&result);
}

#[test]
fn out_of_safe_integer_range_sequence_cannot_be_evidence() {
    let result=project(vec![entry(3,9_007_199_254_740_992,A,"Inbox")],false);
    assert_eq!(result["outcome"],"refused");
    assert_eq!(result["code"],"INVALID_WIKI_CHANGES_SOURCE");
    safe(&result);
}
