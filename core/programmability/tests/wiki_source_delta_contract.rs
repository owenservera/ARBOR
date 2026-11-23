//! U05: Source-backed AutoWiki delta contract, using only disposable synthetic pages.
//! The pure read projection must not authorize an effect, leak section bodies,
//! accept a rollback, or silently drop counts when the event window is bounded.
//! This does not test a live Host grant, provider, phone, or personal corpus.

use serde_json::{json, Map, Value};
use vivim_programmability_core::wiki_read::{
    source_delta, source_stamp, source_transition,
};

fn wiki(revision: u64, pages: Value) -> Value {
    json!({"revision": revision, "pages": pages})
}

fn assert_inert(result: &Value) {
    assert_eq!(result["authority"], "none");
    assert_eq!(result["executionAuthorized"], false);
    assert_eq!(result["effectPerformed"], false);
}

#[test]
fn initial_source_is_only_a_baseline_not_an_effect_or_a_delta() {
    let current = wiki(4, json!({
        "Inbox": {"sections": {"Note": "synthetic text"}, "links": []}
    }));
    let result = source_delta(&json!({"previous": null, "current": current}));
    assert_eq!(result["schema"], "vivim.wiki-source-delta/1");
    assert_eq!(result["outcome"], "baseline");
    assert_eq!(result["to"]["revision"], 4);
    assert_eq!(result["to"]["pagesTotal"], 1);
    assert_eq!(result["changedPages"], 0);
    assert_eq!(result["totalEvents"], 0);
    assert!(result["events"].as_array().unwrap().is_empty());
    assert_inert(&result);
}

#[test]
fn revision_delta_tracks_add_remove_links_and_sections_without_section_bodies() {
    let previous = wiki(12, json!({
        "Inbox": {
            "sections": {"Note": "PRIVATE-SYNTHETIC-BEFORE"},
            "links": ["Project"]
        },
        "Project": {"sections": {"Status": "Open"}, "links": []}
    }));
    let current = wiki(13, json!({
        "Inbox": {
            "sections": {"Note": "PRIVATE-SYNTHETIC-AFTER"},
            "links": []
        },
        "Archive": {"sections": {"Summary": "PRIVATE-SYNTHETIC-ARCHIVED"}, "links": []}
    }));
    let result = source_delta(&json!({"previous": previous, "current": current}));
    assert_eq!(result["outcome"], "changed");
    assert_eq!(result["from"]["revision"], 12);
    assert_eq!(result["to"]["revision"], 13);
    assert_eq!(result["changedPages"], 3);
    assert_eq!(result["addedPages"], 1);
    assert_eq!(result["removedPages"], 1);
    assert_eq!(result["changedSections"], 1);
    assert_eq!(result["changedLinks"], 1);
    assert_eq!(result["totalEvents"], 4);
    let events = result["events"].as_array().expect("bounded events");
    assert!(events.iter().any(|event| event["kind"] == "page-added" && event["page"] == "Archive"));
    assert!(events.iter().any(|event| event["kind"] == "page-removed" && event["page"] == "Project"));
    assert!(events.iter().any(|event| event["kind"] == "links-changed" && event["page"] == "Inbox"));
    assert!(events.iter().any(|event| event["kind"] == "section-changed" && event["section"] == "Note"));
    let projection = result.to_string();
    assert!(!projection.contains("PRIVATE-SYNTHETIC-"), "section bodies must never leave delta");
    assert_inert(&result);
}

#[test]
fn equal_revision_with_mutated_source_is_refused_by_delta_and_identity_guard() {
    let previous = wiki(7, json!({
        "Inbox": {"sections": {"Note": "value-a"}, "links": []}
    }));
    let current = wiki(7, json!({
        "Inbox": {"sections": {"Note": "value-b"}, "links": []}
    }));
    let delta = source_delta(&json!({"previous": previous, "current": current}));
    assert_eq!(delta["outcome"], "refused");
    assert_eq!(delta["code"], "SOURCE_REVISION_CONFLICT");
    assert_inert(&delta);

    let old = source_stamp(&json!({"wiki": previous}));
    let next = source_stamp(&json!({"wiki": current}));
    let transition = source_transition(&json!({
        "previous": {"revision": old["revision"], "digest": old["digest"]},
        "current": {"revision": next["revision"], "digest": next["digest"]}
    }));
    assert_eq!(transition["outcome"], "refused");
    assert_eq!(transition["code"], "SOURCE_REVISION_CONFLICT");
    assert_inert(&transition);
}

#[test]
fn rollback_is_refused_but_unchanged_content_at_a_new_revision_is_observable() {
    let old = wiki(11, json!({"Inbox": {"sections": {"A": "same"}, "links": []}}));
    let rolled_back = wiki(10, json!({"Inbox": {"sections": {"A": "same"}, "links": []}}));
    let refused = source_delta(&json!({"previous": old, "current": rolled_back}));
    assert_eq!(refused["outcome"], "refused");
    assert_eq!(refused["code"], "SOURCE_REVISION_CONFLICT");
    assert_inert(&refused);

    let next = wiki(12, json!({"Inbox": {"sections": {"A": "same"}, "links": []}}));
    let accepted = source_delta(&json!({"previous": old, "current": next}));
    assert_eq!(accepted["outcome"], "unchanged");
    assert_eq!(accepted["to"]["revision"], 12);
    assert_eq!(accepted["totalEvents"], 0);
    assert_inert(&accepted);
}

#[test]
fn event_window_is_bounded_but_aggregate_counts_remain_complete() {
    let previous = wiki(1, json!({}));
    let mut pages = Map::new();
    for i in 0..60 {
        pages.insert(
            format!("page-{i:03}"),
            json!({"sections": {"Summary": "synthetic"}, "links": []}),
        );
    }
    let current = wiki(2, Value::Object(pages));
    let result = source_delta(&json!({"previous": previous, "current": current}));
    assert_eq!(result["outcome"], "changed");
    assert_eq!(result["changedPages"], 60);
    assert_eq!(result["addedPages"], 60);
    assert_eq!(result["totalEvents"], 60);
    assert_eq!(result["omittedEvents"], 12);
    assert_eq!(result["events"].as_array().unwrap().len(), 48);
    assert_inert(&result);
}

#[test]
fn invalid_current_source_cannot_become_a_partial_readback() {
    let previous = wiki(3, json!({}));
    let invalid = wiki(4, json!({
        "Inbox": {"sections": {"A": "text"}, "links": [42]}
    }));
    let refused = source_delta(&json!({"previous": previous, "current": invalid}));
    assert_eq!(refused["outcome"], "refused");
    assert_eq!(refused["code"], "INVALID_CURRENT_SOURCE");
    assert!(refused.get("events").is_none());
    assert_inert(&refused);
}

#[test]
fn metadata_only_revision_advance_is_reported_without_private_values() {
    let old = wiki(20, json!({
        "Inbox": {
            "sections": {"Note": "unchanged synthetic note"},
            "links": [],
            "sourceIdentity": "PRIVATE-SYNTHETIC-OLD"
        }
    }));
    let next = wiki(21, json!({
        "Inbox": {
            "sections": {"Note": "unchanged synthetic note"},
            "links": [],
            "sourceIdentity": "PRIVATE-SYNTHETIC-NEW"
        }
    }));
    let result = source_delta(&json!({"previous": old, "current": next}));
    assert_eq!(result["outcome"], "changed");
    assert_eq!(result["changedPages"], 1);
    assert_eq!(result["changedSections"], 0);
    assert_eq!(result["changedLinks"], 0);
    assert_eq!(result["totalEvents"], 1);
    assert_eq!(result["events"][0]["kind"], "page-metadata-changed");
    assert_eq!(result["events"][0]["page"], "Inbox");
    assert_ne!(result["from"]["digest"], result["to"]["digest"]);
    assert!(!result.to_string().contains("PRIVATE-SYNTHETIC-"));
    assert_inert(&result);
}

#[test]
fn metadata_add_remove_is_observed_but_equal_metadata_is_not_a_false_change() {
    let baseline = wiki(28, json!({
        "Inbox": {"sections": {"Note": "same"}, "links": []}
    }));
    let added = wiki(29, json!({
        "Inbox": {
            "sections": {"Note": "same"},
            "links": [],
            "ownerRef": "PRIVATE-SYNTHETIC-OWNER"
        }
    }));
    let changed = source_delta(&json!({"previous": baseline, "current": added}));
    assert_eq!(changed["outcome"], "changed");
    assert_eq!(changed["changedPages"], 1);
    assert_eq!(changed["totalEvents"], 1);
    assert!(!changed.to_string().contains("PRIVATE-SYNTHETIC-OWNER"));
    assert_inert(&changed);

    let stable = wiki(30, json!({
        "Inbox": {
            "sections": {"Note": "same"},
            "links": [],
            "ownerRef": "PRIVATE-SYNTHETIC-OWNER"
        }
    }));
    let no_op = source_delta(&json!({"previous": added, "current": stable}));
    assert_eq!(no_op["outcome"], "unchanged");
    assert_eq!(no_op["changedPages"], 0);
    assert_eq!(no_op["totalEvents"], 0);
    assert_inert(&no_op);

    let removed = wiki(31, json!({
        "Inbox": {"sections": {"Note": "same"}, "links": []}
    }));
    let inverse = source_delta(&json!({"previous": stable, "current": removed}));
    assert_eq!(inverse["outcome"], "changed");
    assert_eq!(inverse["events"][0]["kind"], "page-metadata-changed");
    assert_eq!(inverse["totalEvents"], 1);
    assert_inert(&inverse);
}
