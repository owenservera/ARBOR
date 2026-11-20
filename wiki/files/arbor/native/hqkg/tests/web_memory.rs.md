# File: native/hqkg/tests/web_memory.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/web_memory.rs |
| Language | Rust |
| Kind | source |
| Size | 14118 B |
| Lines | 379 |
| Hash | 47580da89993 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| tmp | function | 9 | no | fn tmp(label: &amp;str) -&gt; PathBuf { |
| sample | function | 15 | no | fn sample(start: usize, count: usize) -&gt; Vec&lt;u8&gt; { |
| open | function | 29 | no | fn open(path: &amp;PathBuf) -&gt; WebMemory { |
| query | function | 32 | no | fn query(memory: &amp;WebMemory, limit: usize, after: u64) -&gt; Value { |
| replay_rejects_conflicts_and_never_grows_on_duplicates | function | 42 | no | fn replay_rejects_conflicts_and_never_grows_on_duplicates() { |
| malformed_batch_is_atomic_and_private_urls_are_refused | function | 73 | no | fn malformed_batch_is_atomic_and_private_urls_are_refused() { |
| torn_delta_tail_requires_explicit_repair_without_false_ack | function | 107 | no | fn torn_delta_tail_requires_explicit_repair_without_false_ack() { |
| first_frame_crash_is_quarantined_until_operator_repair | function | 135 | no | fn first_frame_crash_is_quarantined_until_operator_repair() { |
| mixed_legacy_snapshot_and_deltas_survive_restart | function | 159 | no | fn mixed_legacy_snapshot_and_deltas_survive_restart() { |
| unsafe_legacy_location_is_not_disclosed_in_query | function | 195 | no | fn unsafe_legacy_location_is_not_disclosed_in_query() { |
| a_revoked_unsafe_row_is_neither_disclosed_nor_counted_as_omitted | function | 220 | no | fn a_revoked_unsafe_row_is_neither_disclosed_nor_counted_as_omitted() { |
| INSTALLATION | const | 221 | no | const INSTALLATION: &amp;str = &quot;12345678-1234-4234-8234-123456789012&quot;; |
| EVENT_ID | const | 222 | no | const EVENT_ID: &amp;str = &quot;22345678-1234-4234-8234-123456789012&quot;; |
| legacy_snapshot_cannot_erase_unrepaired_web_tail | function | 259 | no | fn legacy_snapshot_cannot_erase_unrepaired_web_tail() { |
| arbitrary_batch_replay_and_bounded_filtered_query | function | 279 | no | fn arbitrary_batch_replay_and_bounded_filtered_query() { |
| same_id_conflict_inside_one_batch_commits_nothing | function | 329 | no | fn same_id_conflict_inside_one_batch_commits_nothing() { |
| synthetic_event_stress | function | 342 | no | fn synthetic_event_stress() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::web_memory::{parse_batch, Query, WebMemory} | use | 4 | external |
| hqkg::{Graph, Journal, Node, NodeKind} | use | 5 | external |
| serde_json::{json, Value} | use | 6 | external |
| std::{fs, io::Write, path::PathBuf, time::Instant} | use | 7 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Recovery, dedupe, query and scale proof for browser metadata deltas. |
| 3 | owner | repos-hq | — | repos-hq |

## Excerpt

```rust
#![cfg(feature = "importer")]
//! @hq:context Recovery, dedupe, query and scale proof for browser metadata deltas.
//! @hq:owner repos-hq
use hqkg::web_memory::{parse_batch, Query, WebMemory};
use hqkg::{Graph, Journal, Node, NodeKind};
use serde_json::{json, Value};
use std::{fs, io::Write, path::PathBuf, time::Instant};

fn tmp(label: &str) -> PathBuf {
    let f = std::env::temp_dir().join(format!("hqkg-web-{}-{}.hqj", std::process::id(), label));
    let _ = fs::remove_file(&f);
    let _ = fs::remove_file(f.with_extension("hqkg.lock"));
    f
}
fn sample(start: usize, count: usize) -> Vec<u8> {
    let mut events = Vec::new();
    for i in start..start + count {
        events.push(json!({"id":format!("{:08x}-1234-4234-8234-123456789012",i),
            "type":"visit.observed","at":format!("2026-11-04T{:02}:{:02}:{:02}.000Z",i/3600%24,i/60%60,i%60),
            "page":{"browserTabId":i%1000,"site":"example.org",
                "url":format!("https://example.org/articles/{}",i)}}));
    }
    serde_json::to_vec(&json!({"schema":"vivim.browser-companion/1",
        "installationId":"12345678-1234-4234-8234-123456789012",
        "sessionId":"12345678-1234-4234-8234-123456789012",
        "events":events}))
    .unwrap()
}
fn open(path: &PathBuf) -> WebMemory {
    WebMemory::open(Journal::new(path)).unwrap()
}
fn query(memory: &WebMemory, limit: usize, after: u64) -> Value {
    memory
        .query(&Query {
            limit,
            after_cursor: after,
            ..Query::default()
        })
        .unwrap()
}
#[test]
fn replay_rejects_conflicts_and_never_grows_on_duplicates() {
    let f = tmp("idempotent");
    let mut memory = open(&f);
    let input = parse_batch(&sample(1, 2)).unwrap();
    let first = memory.accept(&input).unwrap();
    assert_eq!((first.inserted, first.duplicates), (2, 0));
    let bytes = memory.bytes();
    let epoch = memory.graph().epoch();
    let same = memory.accept(&input).unwrap();
    assert_eq!((same.inserted, same.duplicates), (0, 2));
    assert_eq!((memory.bytes(), memory.graph().epoch()), (bytes, epoch));
    let mut conflict = input.clone();
    conflict[0].url = "https://example.org/changed".into();
    // A malformed precomputed digest must fail validation; a valid alternate payload must conflict.
    assert!(memory.accept(&conflict).is_err());
    let mut different = sample(1, 2);
    let mut payload: Value = serde_json::from_slice(&different).unwrap();
    payload["events"][0]["page"]["url"] = json!("https://example.org/changed");
    different = serde_json::to_vec(&payload).unwrap();
    let altered = parse_batch(&different).unwrap();
    assert!(memory.accept(&altered).is_err());
    assert_eq!((memory.bytes(), memory.graph().epoch()), (bytes, epoch));
    let reopened = open(&f);
    assert_eq!(
        query(&reopened, 10, 0)["results"].as_array().unwrap().len(),
        2
    );
    assert_eq!(reopened.graph().check_indexes().is_ok(), true);
    fs::remove_file(f).unwrap();
}
#[test]
fn malformed_batch_is_atomic_and_private_urls_are_refused() {
    let f = tmp("invalid");
    let mut memory = open(&f);
    let base: Value = serde_json::from_slice(&sample(1, 2)).unwrap();
    for bad in [
        "https://example.org/?token=secret",
        "https://user@example.org/",
        "https://other.org/",
```

_First 80 of 380 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
