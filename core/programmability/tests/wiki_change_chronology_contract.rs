//! O03/O05: Host Wiki journal chronology remains a pure, inert provenance read.
//! All rows are synthetic. No personal corpus, grants, effects or provider activity.

use serde_json::{json, Value};
use vivim_programmability_core::wiki_journal::changes;

const ID1: &str = "00000000-0000-4000-8000-000000000001";
const ID2: &str = "00000000-0000-4000-8000-000000000002";
const ID3: &str = "00000000-0000-4000-8000-000000000003";

fn entry(revision: u64, page: &str, section: &str, id: &str, sequence: u64) -> Value {
    json!({
        "page": page,
        "section": section,
        "action": "set-section",
        "expectedRevision": revision,
        "entryId": id,
        "sequence": sequence,
        "receivedAt": "2026-11-23T22:00:00Z",
        "contentDigest": "a".repeat(64),
        "sequenceBinding": null,
        "privateRawContent": "DO-NOT-LEAK-SYNTHETIC"
    })
}

fn project(entries: Vec<Value>, current_only: bool) -> Value {
    changes(&json!({
        "schema": "vivim.wiki-change-source/1",
        "currentOnly": current_only,
        "entries": entries
    }))
}

fn inert(result: &Value) {
    assert_eq!(result["authority"], "none");
    assert_eq!(result["executionAuthorized"], false);
    assert_eq!(result["effectPerformed"], false);
    assert!(!result.to_string().contains("DO-NOT-LEAK-SYNTHETIC"));
}

#[test]
fn ordered_history_marks_only_latest_section_revisions_current() {
    let first = entry(4, "Inbox", "Note", ID1, 5);
    let middle = entry(5, "Tasks", "Task", ID2, 6);
    let last = entry(6, "Inbox", "Note", ID3, 7);
    let output = project(vec![first.clone(), middle.clone(), last.clone()], false);
    assert_eq!(output["outcome"], "computed");
    assert_eq!(output["total"], 3);
    let rows = output["items"].as_array().unwrap();
    assert_eq!(rows[0]["status"], "superseded-section-revision");
    assert_eq!(rows[1]["status"], "current-section-revision");
    assert_eq!(rows[2]["status"], "current-section-revision");
    assert_eq!(rows[2]["wikiRevision"], 7);
    inert(&output);

    let recent = project(vec![first, middle, last], true);
    assert_eq!(recent["outcome"], "computed");
    assert_eq!(recent["total"], 2);
    assert_eq!(recent["items"].as_array().unwrap().len(), 2);
    assert!(recent["items"].as_array().unwrap().iter().all(
        |item| item["status"] == "current-section-revision"
    ));
    inert(&recent);
}

#[test]
fn reversed_journal_revisions_are_refused_not_misclassified_current() {
    let result = project(vec![
        entry(12, "Inbox", "Note", ID1, 13),
        entry(11, "Inbox", "Note", ID2, 12)
    ], false);
    assert_eq!(result["outcome"], "refused");
    assert_eq!(result["code"], "INVALID_WIKI_CHANGES_SOURCE");
    assert!(result.get("items").is_none());
    inert(&result);
}

#[test]
fn duplicate_global_journal_revision_is_refused_even_across_pages() {
    let result = project(vec![
        entry(9, "Inbox", "Note", ID1, 10),
        entry(9, "Tasks", "Task", ID2, 11)
    ], true);
    assert_eq!(result["outcome"], "refused");
    assert_eq!(result["code"], "INVALID_WIKI_CHANGES_SOURCE");
    assert!(result.get("items").is_none());
    inert(&result);
}

#[test]
fn legacy_unidentified_source_still_advances_current_section_revision() {
    let mut old = entry(20, "Inbox", "Note", ID1, 21);
    old["entryId"] = Value::Null;
    old["sequence"] = Value::Null;
    let next = entry(22, "Inbox", "Note", ID2, 23);
    let result = project(vec![old, next], true);
    assert_eq!(result["outcome"], "computed");
    assert_eq!(result["total"], 1);
    assert_eq!(result["items"][0]["entryId"], ID2);
    assert_eq!(result["items"][0]["status"], "current-section-revision");
    inert(&result);
}
