//! U05 — source-backed Unicode Wiki readback excerpt positions.
//! Synthetic text only; this pure reader never grants or performs a Host effect.
use serde_json::{json,Value};
use vivim_programmability_core::wiki_read::source_search;

fn search(content:&str,query:&str)->Value {
    source_search(&json!({
        "wiki":{"revision":17,"pages":{
            "Inbox":{"sections":{"Summary":content},"links":[]}
        }},
        "query":query,"limit":24
    }))
}
fn inert(read:&Value) {
    assert_eq!(read["authority"],"none");
    assert_eq!(read["executionAuthorized"],false);
    assert_eq!(read["effectPerformed"],false);
}

#[test]
fn unicode_lowercase_expansion_cannot_push_excerpt_past_match() {
    // Each U+0130 lowercases to two scalars: i + COMBINING DOT ABOVE.
    // The old search offset counted both as separate *source* scalars.
    let text=format!("{}NEEDLE","İ".repeat(60));
    let result=search(&text,"needle");
    assert_eq!(result["outcome"],"computed");
    assert_eq!(result["matches"],1);
    let excerpt=result["results"][0]["excerpt"].as_str().expect("readback excerpt");
    assert!(excerpt.contains("NEEDLE"),"real match must remain visible: {excerpt}");
    assert!(excerpt.starts_with('…'),"long prefix should be bounded");
    inert(&result);
}

#[test]
fn multi_byte_nonexpanding_prefix_keeps_correct_original_match() {
    let text=format!("{}TARGET","🚀".repeat(61));
    let result=search(&text,"target");
    assert_eq!(result["outcome"],"computed");
    assert_eq!(result["matches"],1);
    assert!(result["results"][0]["excerpt"].as_str().unwrap().contains("TARGET"));
    inert(&result);
}

#[test]
fn ordinary_ascii_search_still_returns_bounded_source_excerpt() {
    let text=format!("{}GOAL","a".repeat(90));
    let result=search(&text,"goal");
    assert_eq!(result["outcome"],"computed");
    assert_eq!(result["matches"],1);
    assert!(result["results"][0]["excerpt"].as_str().unwrap().contains("GOAL"));
    assert_eq!(result["wikiRevision"],17);
    assert_eq!(result["indexedSections"],1);
    inert(&result);
}

#[test]
fn malformed_or_control_query_is_still_refused_without_leaking_source() {
    let text="PRIVATE-SYNTHETIC-DATA";
    for query in ["", "\u{0000}", "\u{000a}"] {
        let result=search(text,query);
        assert_eq!(result["outcome"],"refused");
        assert!(result.get("results").is_none());
        assert!(!result.to_string().contains(text));
        inert(&result);
    }
}
