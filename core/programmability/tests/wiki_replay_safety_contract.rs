//! O05 — deterministic Wiki replay provenance and correction safety.
//! Synthetic fixtures only: no personal corpus, Host effects, credentials or sends.
use serde_json::{json, Value};
use vivim_programmability_core::wiki_replay::replay;

const ENTRY: &str = "00000000-0000-4000-8000-000000000001";

fn pages() -> Value {
    json!([{"name":"Inbox","fields":[["sections",[["About","initial"]]]]}])
}
fn input(revision: u64, records: Vec<Value>) -> Value {
    json!({"schema":"vivim.wiki-journal-replay-input/1",
        "wikiRevision":revision,"pages":pages(),"records":records,"seedAt":""})
}
fn correction(revision: u64) -> Value {
    json!({"kind":"wiki-edit","expectedRevision":revision,
        "edit":{"action":"set-section","page":"Inbox","section":"About",
                "content":"synthetic correction"},
        "receivedAt":"2026-11-23T22:00:00Z"})
}
fn chat() -> Value {
    json!({"kind":"chat-send","actor":"human","text":"disposable fixture",
        "receivedAt":"2026-11-23T22:00:00Z","schemaVersion":1,"intent":null})
}
fn inert(result: &Value) {
    assert_eq!(result["authority"], "none");
    assert_eq!(result["executionAuthorized"], false);
    assert_eq!(result["effectPerformed"], false);
}

#[test]
fn legacy_entry_with_no_identity_and_no_sequence_is_accepted() {
    let result = replay(&input(0, vec![chat()]));
    assert_eq!(result["outcome"], "computed");
    assert_eq!(result["journalRevision"], 1);
    assert_eq!(result["productRevision"], 1);
    assert_eq!(result["chatEntries"][0]["text"], "disposable fixture");
    inert(&result);
}

#[test]
fn orphan_sequence_without_entry_id_cannot_be_replayed_as_provenance() {
    let mut row=chat();
    row["sequence"]=json!(1);
    let result=replay(&input(0, vec![row]));
    assert_eq!(result["outcome"], "refused");
    assert_eq!(result["code"], "INVALID_SEQUENCE");
    assert!(result.get("chatEntries").is_none());
    inert(&result);
}

#[test]
fn identified_entry_without_matching_sequence_is_refused() {
    let mut row=correction(0);
    row["entryId"]=json!(ENTRY);
    let result=replay(&input(0, vec![row]));
    assert_eq!(result["outcome"], "refused");
    assert_eq!(result["code"], "INVALID_SEQUENCE");
    assert!(result.get("pages").is_none());
    inert(&result);
}

#[test]
fn malformed_journal_entry_id_is_refused_even_with_a_sequence() {
    let mut row=correction(0);
    row["entryId"]=json!("not-valid");
    row["sequence"]=json!(1);
    let result=replay(&input(0, vec![row]));
    assert_eq!(result["outcome"], "refused");
    assert_eq!(result["code"], "INVALID_ENTRY_ID");
    inert(&result);
}

#[test]
fn identified_correction_commits_to_pure_readback_without_effect_authority() {
    let mut row=correction(0);
    row["entryId"]=json!(ENTRY);
    row["sequence"]=json!(1);
    let result=replay(&input(0, vec![row]));
    assert_eq!(result["outcome"], "computed");
    assert_eq!(result["wikiRevision"], 1);
    assert_eq!(result["productRevision"], 1);
    assert_eq!(result["pages"][0]["fields"][0][1][0][1], "synthetic correction");
    inert(&result);
}

#[test]
fn last_possible_revision_is_accepted_but_overflowing_correction_is_refused() {
    let accepted=replay(&input(u64::MAX-1, vec![correction(u64::MAX-1)]));
    assert_eq!(accepted["outcome"], "computed");
    assert_eq!(accepted["wikiRevision"], u64::MAX);
    inert(&accepted);
    let refused=replay(&input(u64::MAX, vec![correction(u64::MAX)]));
    assert_eq!(refused["outcome"], "refused");
    assert_eq!(refused["code"], "WIKI_REVISION_OVERFLOW");
    assert!(refused.get("pages").is_none());
    inert(&refused);
}
