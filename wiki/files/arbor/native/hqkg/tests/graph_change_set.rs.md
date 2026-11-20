# File: native/hqkg/tests/graph_change_set.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/graph_change_set.rs |
| Language | Rust |
| Kind | source |
| Size | 12462 B |
| Lines | 358 |
| Hash | 127a3e2c4399 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| node | function | 6 | no | fn node(id: &amp;str) -&gt; Node { |
| put_ops_apply_with_invalidation_set | function | 11 | no | fn put_ops_apply_with_invalidation_set() { |
| same_change_set_id_applied_twice_is_a_no_op_duplicate | function | 35 | no | fn same_change_set_id_applied_twice_is_a_no_op_duplicate() { |
| remove_node_tombstone_is_a_record_not_an_erase_only | function | 60 | no | fn remove_node_tombstone_is_a_record_not_an_erase_only() { |
| remove_node_of_missing_entity_skips_but_still_records_tombstone | function | 95 | no | fn remove_node_of_missing_entity_skips_but_still_records_tombstone() { |
| remove_edge_tombstone | function | 111 | no | fn remove_edge_tombstone() { |
| merge_moves_duplicate_edges_onto_canonical_then_tombstones | function | 141 | no | fn merge_moves_duplicate_edges_onto_canonical_then_tombstones() { |
| merge_rejects_missing_or_identical_nodes | function | 191 | no | fn merge_rejects_missing_or_identical_nodes() { |
| split_creates_new_node_and_rewires_stated_edge_subset | function | 206 | no | fn split_creates_new_node_and_rewires_stated_edge_subset() { |
| split_rejects_unknown_edges_and_existing_target | function | 242 | no | fn split_rejects_unknown_edges_and_existing_target() { |
| failed_op_returns_err_and_is_not_recorded_in_ledger | function | 282 | no | fn failed_op_returns_err_and_is_not_recorded_in_ledger() { |
| lineage_chain_walks_parents_and_rejects_cycles | function | 306 | no | fn lineage_chain_walks_parents_and_rejects_cycles() { |
| lineage_cycle_rejected | function | 326 | no | fn lineage_cycle_rejected() { |
| change_ops_are_constructible_directly | function | 341 | no | fn change_ops_are_constructible_directly() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::graph_change_set::{ | use | 1 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
use hqkg::graph_change_set::{
    apply, lineage_chain, lineage_depth, ApplyLedger, ChangeOp, GraphChangeSet, Tombstone,
};
use hqkg::{Edge, Graph, Node, NodeKind};

fn node(id: &str) -> Node {
    Node::new(id, NodeKind::Concept, id)
}

#[test]
fn put_ops_apply_with_invalidation_set() {
    let mut g = Graph::new();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-1", "web-feed")
        .put_node(node("a"))
        .put_node(node("b"))
        .put_edge(Edge::new("ab", "a", "depends_on", "b"));
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(r.change_set_id, "cs-1");
    assert!(!r.duplicate);
    assert_eq!(r.applied, 3);
    assert_eq!(r.skipped, 0);
    assert!(g.node("a").is_some() && g.node("b").is_some());
    assert!(g.edge("ab").is_some());
    assert_eq!(
        r.invalidation_set,
        ["a", "b", "ab"].into_iter().map(str::to_owned).collect()
    );
    assert!(r.tombstones.is_empty());
    // Ledger records the applied change set id.
    assert!(ledger.contains("cs-1"));
}

#[test]
fn same_change_set_id_applied_twice_is_a_no_op_duplicate() {
    let mut g = Graph::new();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-dup", "web-feed")
        .put_node(node("a"))
        .put_node(node("b"))
        .put_edge(Edge::new("ab", "a", "depends_on", "b"));
    let first = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(first.applied, 3);
    let epoch_after_first = g.epoch();
    let edge_count_after_first = g.edge_count();
    let second = apply(&mut g, &cs, &mut ledger).unwrap();
    assert!(
        second.duplicate,
        "re-apply must return the DUPLICATE marker"
    );
    assert_eq!(second.applied, 0);
    assert_eq!(second.skipped, 0);
    assert!(second.invalidation_set.is_empty());
    assert_eq!(g.epoch(), epoch_after_first, "duplicate must apply nothing");
    assert_eq!(g.edge_count(), edge_count_after_first);
    assert_eq!(g.node_count(), 2);
}

#[test]
fn remove_node_tombstone_is_a_record_not_an_erase_only() {
    let mut g = Graph::new();
    g.put_node(node("a")).unwrap();
    g.put_node(node("b")).unwrap();
    g.put_edge(Edge::new("ab", "a", "depends_on", "b")).unwrap();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-rm", "web-feed").remove_node("a", "stale fact", 1700000000);
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    // Graph removal is a hard remove for the node and its incident edges...
    assert!(g.node("a").is_none());
    assert!(g.edge("ab").is_none());
    assert_eq!(g.node_count(), 1);
    // ...but the change set result carries the tombstone record.
    assert_eq!(
        r.tombstones,
        vec![Tombstone {
            entity_id: "a".into(),
            reason: "stale fact".into(),
            ts: 1700000000
        }]
    );
```

_First 80 of 359 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
