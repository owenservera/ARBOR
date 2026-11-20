# File: native/hqkg/tests/context_retrieval.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/context_retrieval.rs |
| Language | Rust |
| Kind | source |
| Size | 11278 B |
| Lines | 299 |
| Hash | f6a1a121dd6d |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| node | function | 9 | no | fn node(id: &amp;str) -&gt; Node { |
| request | function | 13 | no | fn request(seeds: &amp;[&amp;str], budget: u64) -&gt; ContextRequest { |
| chain | function | 22 | no | fn chain() -&gt; Graph { |
| unknown_seed_fails_closed | function | 36 | no | fn unknown_seed_fails_closed() { |
| empty_seeds_fail_closed | function | 46 | no | fn empty_seeds_fail_closed() { |
| zero_budget_fails_closed | function | 53 | no | fn zero_budget_fails_closed() { |
| seed_also_excluded_fails_closed | function | 60 | no | fn seed_also_excluded_fails_closed() { |
| bfs_is_depth_bounded | function | 69 | no | fn bfs_is_depth_bounded() { |
| exclusion_prunes_subtree | function | 82 | no | fn exclusion_prunes_subtree() { |
| excluded_node_is_never_an_edge_endpoint | function | 94 | no | fn excluded_node_is_never_an_edge_endpoint() { |
| ranked_graph | function | 110 | no | fn ranked_graph() -&gt; Graph { |
| rank_order_is_depth_then_version_desc_then_id | function | 144 | no | fn rank_order_is_depth_then_version_desc_then_id() { |
| multi_seed_depth_is_nearest_seed | function | 155 | no | fn multi_seed_depth_is_nearest_seed() { |
| token_budget_is_a_hard_prefix_bound | function | 168 | no | fn token_budget_is_a_hard_prefix_bound() { |
| exact_fit_is_not_budget_exhausted | function | 195 | no | fn exact_fit_is_not_budget_exhausted() { |
| minimum_token_estimate_is_one | function | 209 | no | fn minimum_token_estimate_is_one() { |
| provenance_populated_from_sources_and_version | function | 217 | no | fn provenance_populated_from_sources_and_version() { |
| watermark_staleness_records_both_versions | function | 241 | no | fn watermark_staleness_records_both_versions() { |
| retrieval_is_deterministic_across_calls | function | 266 | no | fn retrieval_is_deterministic_across_calls() { |
| indexed_edge_projection_matches_full_scan_for_bounded_and_excluded_views | function | 275 | no | fn indexed_edge_projection_matches_full_scan_for_bounded_and_excluded_views() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::context_retrieval::{retrieve, ContextRequest} | use | 5 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 6 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! OVN-B lane 4: Oracle dynamic context retrieval with provenance and token bounds.
//! Matrix: fail-closed requests, bounded BFS, exclusion pruning, deterministic rank
//! order, hard token budget (prefix, never truncated mid-item), provenance from
//! node.sources, watermark staleness with both versions recorded, determinism.
use hqkg::context_retrieval::{retrieve, ContextRequest};
use hqkg::{Edge, Graph, Node, NodeKind};
use std::collections::{BTreeMap, BTreeSet};

fn node(id: &str) -> Node {
    Node::new(id, NodeKind::Concept, id)
}

fn request(seeds: &[&str], budget: u64) -> ContextRequest {
    ContextRequest {
        seeds: seeds.iter().map(|s| s.to_string()).collect(),
        budget_tokens: budget,
        excluded: BTreeSet::new(),
        watermark: None,
    }
}

fn chain() -> Graph {
    // a - b - c - d - e via "relates" edges.
    let mut g = Graph::new();
    for id in ["a", "b", "c", "d", "e"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("e1", "a", "relates", "b")).unwrap();
    g.put_edge(Edge::new("e2", "b", "relates", "c")).unwrap();
    g.put_edge(Edge::new("e3", "c", "relates", "d")).unwrap();
    g.put_edge(Edge::new("e4", "d", "relates", "e")).unwrap();
    g
}

#[test]
fn unknown_seed_fails_closed() {
    let g = chain();
    let err = retrieve(&g, &request(&["a", "ghost"], 100)).unwrap_err();
    assert!(
        matches!(err, hqkg::Error::Missing(ref id) if id == "ghost"),
        "{err}"
    );
}

#[test]
fn empty_seeds_fail_closed() {
    let g = chain();
    let err = retrieve(&g, &request(&[], 100)).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn zero_budget_fails_closed() {
    let g = chain();
    let err = retrieve(&g, &request(&["a"], 0)).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn seed_also_excluded_fails_closed() {
    let g = chain();
    let mut req = request(&["a"], 100);
    req.excluded.insert("a".into());
    let err = retrieve(&g, &req).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn bfs_is_depth_bounded() {
    let g = chain();
    let bundle = retrieve(&g, &request(&["a"], 10_000)).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    // Depth cap 3: a(0) b(1) c(2) d(3) reachable; e at depth 4 is not.
    assert_eq!(ids, ["a", "b", "c", "d"]);
    assert_eq!(bundle.items[0].depth, 0);
    assert_eq!(bundle.items[3].depth, 3);
    // Incident edges between retrieved nodes ride along.
    assert_eq!(bundle.edges.len(), 3);
}
```

_First 80 of 300 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
