//! U05: whole-source validation before a bounded Wiki readback or identity.
//! Synthetic fixtures only. No Host effects, permissions, or personal corpus.
use serde_json::{json, Map, Value};
use vivim_programmability_core::wiki_read::{
    read, source_delta, source_search, source_stamp, ReadError,
};

fn source(pages: Value) -> Value {
    json!({"revision": 18, "pages": pages})
}
fn safe_page() -> Value {
    json!({"sections": {"Summary": "disposable fixture"}, "links": []})
}
fn many_pages(count: usize) -> Map<String, Value> {
    (0..count)
        .map(|n| (format!("page-{n:03}"), safe_page()))
        .collect()
}
fn refused(stamp: &Value) {
    assert_eq!(stamp["state"], "refused");
    assert_eq!(stamp["code"], "INVALID_WIKI_SOURCE");
    assert_eq!(stamp["authority"], "none");
    assert_eq!(stamp["executionAuthorized"], false);
    assert_eq!(stamp["effectPerformed"], false);
    assert!(stamp.get("digest").is_none());
}

#[test]
fn valid_complete_source_keeps_bounded_display_and_search() {
    let doc = source(Value::Object(many_pages(270)));
    let view = read(&doc).expect("valid source");
    assert_eq!(view.pages_total, 270);
    assert_eq!(view.pages.len(), 40);
    assert_eq!(view.indexed_pages, 256);
    assert!(view.index_truncated);
    let stamp = source_stamp(&json!({"wiki": doc}));
    assert_eq!(stamp["state"], "computed");
    assert_eq!(stamp["pagesTotal"], 270);
    assert_eq!(stamp["authority"], "none");
    assert_eq!(stamp["effectPerformed"], false);
}

#[test]
fn malformed_page_beyond_search_window_cannot_receive_a_source_stamp() {
    let mut pages = many_pages(270);
    pages.insert("page-269".into(), json!({"sections": {"Summary": 42}, "links": []}));
    let doc = source(Value::Object(pages));
    assert!(matches!(read(&doc), Err(ReadError::InvalidProjection)));
    refused(&source_stamp(&json!({"wiki": doc.clone()})));
    let result = source_search(&json!({"wiki": doc.clone(), "query": "page", "limit": 24}));
    assert_eq!(result["outcome"], "refused");
    assert!(result.get("results").is_none());
    let delta = source_delta(&json!({"previous": null, "current": doc}));
    assert_eq!(delta["outcome"], "refused");
    assert_eq!(delta["code"], "INVALID_CURRENT_SOURCE");
}

#[test]
fn malformed_section_beyond_display_and_search_section_limits_is_refused() {
    let mut sections = Map::new();
    for n in 0..530 {
        sections.insert(format!("section-{n:03}"), json!("fixture"));
    }
    sections.insert("section-529".into(), json!({"unexpected": "object"}));
    let doc = source(json!({"Inbox": {"sections": Value::Object(sections), "links": []}}));
    assert!(matches!(read(&doc), Err(ReadError::InvalidProjection)));
    refused(&source_stamp(&json!({"wiki": doc})));
}

#[test]
fn invalid_link_beyond_twelve_displayed_links_fails_closed() {
    let mut links: Vec<Value> = (0..12).map(|n| json!(format!("page-{n:03}"))).collect();
    links.push(json!({"not": "a link"}));
    let doc = source(json!({"Inbox": {
        "sections": {"Summary": "fixture"}, "links": links
    }}));
    assert!(matches!(read(&doc), Err(ReadError::InvalidProjection)));
    refused(&source_stamp(&json!({"wiki": doc})));
}

#[test]
fn invalid_previous_source_beyond_display_limit_cannot_form_a_delta() {
    let mut pages = many_pages(270);
    pages.insert("page-269".into(), json!({"sections": null, "links": []}));
    let previous = source(Value::Object(pages));
    let current = json!({"revision": 19, "pages": {"Inbox": safe_page()}});
    let result = source_delta(&json!({"previous": previous, "current": current}));
    assert_eq!(result["outcome"], "refused");
    assert_eq!(result["code"], "INVALID_PREVIOUS_SOURCE");
    assert!(result.get("events").is_none());
    assert_eq!(result["effectPerformed"], false);
}
