# File: native/hqkg/tests/apply_ledger.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/apply_ledger.rs |
| Language | Rust |
| Kind | source |
| Size | 8404 B |
| Lines | 223 |
| Hash | d6c536311650 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| temp_dir | function | 19 | no | fn temp_dir(name: &amp;str) -&gt; PathBuf { |
| node | function | 27 | no | fn node(id: &amp;str) -&gt; Node { |
| seed_graph | function | 31 | no | fn seed_graph() -&gt; Graph { |
| cs_put_two | function | 37 | no | fn cs_put_two() -&gt; GraphChangeSet { |
| record_survives_drop_and_reopen | function | 47 | no | fn record_survives_drop_and_reopen() { |
| duplicate_record_returns_false_and_does_not_grow_file | function | 64 | no | fn duplicate_record_returns_false_and_does_not_grow_file() { |
| torn_tail_is_discarded_on_open_and_complete_records_survive | function | 88 | no | fn torn_tail_is_discarded_on_open_and_complete_records_survive() { |
| empty_and_missing_files_open_clean | function | 129 | no | fn empty_and_missing_files_open_clean() { |
| apply_durable_is_idempotent_across_reopen | function | 154 | no | fn apply_durable_is_idempotent_across_reopen() { |
| failed_apply_does_not_record_and_stays_reappliable | function | 189 | no | fn failed_apply_does_not_record_and_stays_reappliable() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::fs | use | 12 | external |
| std::path::PathBuf | use | 13 | external |
| hqkg::apply_ledger::{apply_durable, FileApplyLedger} | use | 15 | external |
| hqkg::graph_change_set::GraphChangeSet | use | 16 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 17 | external |
| std::io::Write | use | 98 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 9 | context | — | — | durable cross-process idempotency for HQKG change sets |
| 10 | owner | hq-agent | — | hq-agent |
| 11 | task | — | — | OVN-A lane 4 / OVN-B durability |

## Excerpt

```rust
//! Durable, cross-process apply-ledger tests (OVN-A lane 4 / OVN-B durability).
//!
//! The W4 in-memory `ApplyLedger` is process-local; these tests pin the
//! `FileApplyLedger` contract: records survive drop+reopen (a cross-process
//! simulation), duplicates never grow the file, torn tails are discarded on
//! open, and the composite `apply_durable` refuses duplicates before applying
//! and never records a failed apply.
//!
//! @hq:context durable cross-process idempotency for HQKG change sets
//! @hq:owner hq-agent
//! @hq:task OVN-A lane 4 / OVN-B durability
use std::fs;
use std::path::PathBuf;

use hqkg::apply_ledger::{apply_durable, FileApplyLedger};
use hqkg::graph_change_set::GraphChangeSet;
use hqkg::{Edge, Graph, Node, NodeKind};

fn temp_dir(name: &str) -> PathBuf {
    let dir =
        std::env::temp_dir().join(format!("hqkg-apply-ledger-{}-{}", name, std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn node(id: &str) -> Node {
    Node::new(id, NodeKind::Concept, id)
}

fn seed_graph() -> Graph {
    let mut g = Graph::new();
    g.put_node(node("base")).unwrap();
    g
}

fn cs_put_two() -> GraphChangeSet {
    GraphChangeSet::new("cs-durable-1", "web-feed")
        .put_node(node("a"))
        .put_node(node("b"))
        .put_edge(Edge::new("ab", "a", "depends_on", "b"))
}

/// (1) record -> drop -> reopen: a fresh instance (cross-process simulation)
/// sees contains == true and the same length.
#[test]
fn record_survives_drop_and_reopen() {
    let dir = temp_dir("reopen");
    let path = dir.join("ledger.applied");
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    assert!(ledger.record("cs-1").unwrap(), "first record returns true");
    assert!(ledger.contains("cs-1"));
    assert_eq!(ledger.len(), 1);
    drop(ledger);
    let reopened = FileApplyLedger::open(&path).unwrap();
    assert!(reopened.contains("cs-1"), "record must survive reopen");
    assert_eq!(reopened.len(), 1);
    assert!(!reopened.contains("cs-2"));
    fs::remove_dir_all(&dir).unwrap();
}

/// (2) duplicate record returns false and does not grow the file.
#[test]
fn duplicate_record_returns_false_and_does_not_grow_file() {
    let dir = temp_dir("dup");
    let path = dir.join("ledger.applied");
    let mut ledger = FileApplyLedger::open(&path).unwrap();
    assert!(ledger.record("cs-1").unwrap());
    let bytes_after_first = fs::metadata(&path).unwrap().len();
    let again = ledger.record("cs-1").unwrap();
    assert!(!again, "duplicate record returns false");
    let bytes_after_dup = fs::metadata(&path).unwrap().len();
    assert_eq!(
        bytes_after_first, bytes_after_dup,
        "duplicate must not append to the file"
    );
    assert_eq!(ledger.len(), 1);
    drop(ledger);
    let reopened = FileApplyLedger::open(&path).unwrap();
    assert_eq!(reopened.len(), 1);
```

_First 80 of 224 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
