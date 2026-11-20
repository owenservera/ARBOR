# File: native/hqkg/tests/import.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/import.rs |
| Language | Rust |
| Kind | source |
| Size | 22717 B |
| Lines | 520 |
| Hash | 265b652f728c |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sample | function | 5 | no | fn sample(changed: bool) -&gt; Vec&lt;u8&gt; { |
| import_is_idempotent_provenance_safe_and_incremental | function | 18 | no | fn import_is_idempotent_provenance_safe_and_incremental() { |
| detect_checksum_mismatch_and_source_collision | function | 45 | no | fn detect_checksum_mismatch_and_source_collision() { |
| rejects_duplicate_records_and_bad_manifest | function | 60 | no | fn rejects_duplicate_records_and_bad_manifest() { |
| journal_is_saved_once_for_staged_graph | function | 71 | no | fn journal_is_saved_once_for_staged_graph() { |
| tombstone_delta | function | 92 | no | fn tombstone_delta(ids: &amp;[&amp;str]) -&gt; Vec&lt;u8&gt; { |
| tombstone_deletes_owned_node_cascades_edges_and_persists_in_journal | function | 108 | no | fn tombstone_deletes_owned_node_cascades_edges_and_persists_in_journal() { |
| tombstone_replay_is_idempotent_and_does_not_advance_epoch | function | 142 | no | fn tombstone_replay_is_idempotent_and_does_not_advance_epoch() { |
| tombstone_never_destroys_another_producers_node | function | 162 | no | fn tombstone_never_destroys_another_producers_node() { |
| tombstone_conflicts_with_node_declared_in_same_exchange | function | 184 | no | fn tombstone_conflicts_with_node_declared_in_same_exchange() { |
| valid_exchange | function | 208 | no | fn valid_exchange( body: &amp;str, node_count: usize, edge_count: usize, tombstone_count: Option&lt;usize&gt;, |
| rejects_tombstone_before_redeclared_node | function | 232 | no | fn rejects_tombstone_before_redeclared_node() { |
| rejects_edge_after_tombstone_record | function | 254 | no | fn rejects_edge_after_tombstone_record() { |
| legacy_manifest_defaults_remain_zero_tombstones_and_no_reconcile | function | 277 | no | fn legacy_manifest_defaults_remain_zero_tombstones_and_no_reconcile() { |
| tombstone_count_mismatch_and_duplicates_rejected | function | 302 | no | fn tombstone_count_mismatch_and_duplicates_rejected() { |
| legacy_manifest_without_tombstone_count_still_parses | function | 321 | no | fn legacy_manifest_without_tombstone_count_still_parses() { |
| node_rows | function | 331 | no | fn node_rows() -&gt; String { |
| exchange_with | function | 342 | no | fn exchange_with( body: &amp;str, node_count: usize, edge_count: usize, reconcile: Option&lt;bool&gt;, |
| reconcile_removes_stale_owned_edge_while_both_endpoints_remain | function | 361 | no | fn reconcile_removes_stale_owned_edge_while_both_endpoints_remain() { |
| reconciliation_never_touches_another_producers_edge | function | 389 | no | fn reconciliation_never_touches_another_producers_edge() { |
| reconcile_replay_is_idempotent_and_does_not_advance_epoch | function | 435 | no | fn reconcile_replay_is_idempotent_and_does_not_advance_epoch() { |
| legacy_manifest_without_reconcile_flag_keeps_stale_edge | function | 461 | no | fn legacy_manifest_without_reconcile_flag_keeps_stale_edge() { |
| reserved_properties_are_importer_only_and_survive_journal_round_trip | function | 481 | no | fn reserved_properties_are_importer_only_and_survive_journal_round_trip() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::import::{parse, Exchange, ImportStats, Manifest} | use | 2 | external |
| hqkg::{Edge, Error, Graph, Journal, Node, NodeKind} | use | 3 | external |
| sha2::{Digest, Sha256} | use | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
#![cfg(feature = "importer")]
use hqkg::import::{parse, Exchange, ImportStats, Manifest};
use hqkg::{Edge, Error, Graph, Journal, Node, NodeKind};
use sha2::{Digest, Sha256};
fn sample(changed: bool) -> Vec<u8> {
    let id1 = format!("hqg1:{}", "a".repeat(64));
    let id2 = format!("hqg1:{}", "b".repeat(64));
    let edge = format!("hqg1:{}", "c".repeat(64));
    let title = if changed { "Updated" } else { "First" };
    let body=format!(
        "{{\"id\":\"{id1}\",\"kind\":\"file\",\"metadata\":{{\"line\":3}},\"title\":\"{title}\",\"type\":\"node\"}}\n\
         {{\"id\":\"{id2}\",\"kind\":\"sectionvariant\",\"metadata\":{{}},\"title\":\"Second\",\"type\":\"node\"}}\n\
         {{\"from\":\"{id1}\",\"id\":\"{edge}\",\"metadata\":{{}},\"relation\":\"HAS_SECTION\",\"to\":\"{id2}\",\"type\":\"edge\",\"weight\":1}}\n");
    let digest = format!("{:x}", Sha256::digest(body.as_bytes()));
    format!("{{\"authority\":\"data-only; no executable code or provider actions\",\"edge_count\":1,\"graph_sha256\":\"{digest}\",\"node_count\":2,\"schema\":\"repos-hq.hqkg-exchange/1\",\"source\":\"repos-hq/agentic-knowledge-graph\",\"type\":\"manifest\"}}\n{body}").into_bytes()
}
#[test]
fn import_is_idempotent_provenance_safe_and_incremental() {
    let payload = parse(&sample(false)).unwrap();
    let mut g = Graph::new();
    g.put_node(Node::new("manual", NodeKind::Fact, "Keep me"))
        .unwrap();
    let stats = payload.apply(&mut g).unwrap();
    assert_eq!(stats.nodes_inserted, 2);
    assert_eq!(stats.edges_inserted, 1);
    assert_eq!(g.node_count(), 3);
    let epoch = g.epoch();
    let again = payload.apply(&mut g).unwrap();
    assert_eq!(
        again,
        ImportStats {
            nodes_unchanged: 2,
            edges_unchanged: 1,
            ..Default::default()
        }
    );
    assert_eq!(g.epoch(), epoch);
    let changed = parse(&sample(true)).unwrap();
    let stats = changed.apply(&mut g).unwrap();
    assert_eq!(stats.nodes_updated, 1);
    assert!(g.epoch() > epoch);
    assert_eq!(g.node("manual").unwrap().title, "Keep me");
}
#[test]
fn detect_checksum_mismatch_and_source_collision() {
    let mut broken = sample(false);
    *broken.last_mut().unwrap() = b'X';
    assert!(parse(&broken).is_err());
    let original = parse(&sample(false)).unwrap();
    let mut g = Graph::new();
    let id = original.nodes.keys().next().unwrap();
    g.put_node(Node::new(id, NodeKind::Fact, "owned manually"))
        .unwrap();
    let epoch = g.epoch();
    let mut staged = g.clone();
    assert!(original.apply(&mut staged).is_err());
    assert_eq!(g.epoch(), epoch);
}
#[test]
fn rejects_duplicate_records_and_bad_manifest() {
    let original = sample(false);
    let text = String::from_utf8(original).unwrap();
    assert!(parse(
        text.replace("repos-hq.hqkg-exchange/1", "other-protocol/1")
            .as_bytes()
    )
    .is_err());
    assert!(parse(text.replace("node_count\":2", "node_count\":9").as_bytes()).is_err());
}
#[test]
fn journal_is_saved_once_for_staged_graph() {
    let exchange = parse(&sample(false)).unwrap();
    let path = std::env::temp_dir().join(format!("hqkg-import-fixture-{}.hqj", std::process::id()));
    let _ = std::fs::remove_file(&path);
    let journal = Journal::new(&path);
    let mut stage = journal.load().unwrap();
    let stats = exchange.apply(&mut stage).unwrap();
    if stats.changed() {
        journal.save(&stage).unwrap();
    }
```

_First 80 of 521 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
