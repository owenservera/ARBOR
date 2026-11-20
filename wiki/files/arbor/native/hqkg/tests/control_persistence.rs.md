# File: native/hqkg/tests/control_persistence.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/control_persistence.rs |
| Language | Rust |
| Kind | source |
| Size | 2167 B |
| Lines | 63 |
| Hash | 8a8593d27452 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| graph_versioned_config_round_trip | function | 5 | no | fn graph_versioned_config_round_trip() { |
| config_snapshot_tampering_is_rejected | function | 26 | no | fn config_snapshot_tampering_is_rejected() { |
| journal_status_and_guarded_tail_repair | function | 42 | no | fn journal_status_and_guarded_tail_repair() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::control::{ConfigPatch, CoreConfig, Mode} | use | 1 | external |
| hqkg::{Graph, Journal, Node, NodeKind} | use | 2 | external |
| std::io::Write | use | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
use hqkg::control::{ConfigPatch, CoreConfig, Mode};
use hqkg::{Graph, Journal, Node, NodeKind};
use std::io::Write;
#[test]
fn graph_versioned_config_round_trip() {
    let mut g = Graph::new();
    let mut c = CoreConfig::default();
    assert!(c.record_snapshot(&mut g).unwrap());
    c.patch(
        1,
        ConfigPatch {
            mode: Some(Mode::Development),
            ..Default::default()
        },
    )
    .unwrap();
    assert!(c.record_snapshot(&mut g).unwrap());
    assert_eq!(
        CoreConfig::latest_from_graph(&g).unwrap().mode,
        Mode::Development
    );
    assert_eq!(CoreConfig::latest_from_graph(&g).unwrap().revision, 2);
    assert_eq!(g.node_count(), 2);
}
#[test]
fn config_snapshot_tampering_is_rejected() {
    let mut g = Graph::new();
    let mut node = CoreConfig::default().snapshot_node();
    node.properties.insert("mode".into(), "unknown".into());
    g.put_node(node).unwrap();
    assert!(CoreConfig::latest_from_graph(&g).is_err());
    let mut n = Node::new(
        "config:core:99",
        NodeKind::Other("core-config".into()),
        "malformed",
    );
    n.properties.insert("mode".into(), "production".into());
    g.put_node(n).unwrap();
    assert!(CoreConfig::latest_from_graph(&g).is_err());
}
#[test]
fn journal_status_and_guarded_tail_repair() {
    let p = std::env::temp_dir().join(format!("hqkg-control-repair-{}.hqj", std::process::id()));
    let _ = std::fs::remove_file(&p);
    let j = Journal::new(&p);
    let mut g = Graph::new();
    g.put_node(Node::new("x", NodeKind::Fact, "X")).unwrap();
    j.save(&g).unwrap();
    std::fs::OpenOptions::new()
        .append(true)
        .open(&p)
        .unwrap()
        .write_all(b"HQJ1-truncated")
        .unwrap();
    let health = j.status().unwrap();
    assert!(health.trailing_bytes > 0);
    assert_eq!(health.epoch, 1);
    assert!(j.repair_torn_tail(2).is_err());
    assert_eq!(j.repair_torn_tail(1).unwrap(), 14);
    assert_eq!(j.status().unwrap().trailing_bytes, 0);
    assert_eq!(j.load().unwrap().node_count(), 1);
    let _ = std::fs::remove_file(p);
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
