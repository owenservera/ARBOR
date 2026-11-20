# File: native/hqkg/tests/scoped_query_retrieval.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/scoped_query_retrieval.rs |
| Language | Rust |
| Kind | source |
| Size | 12400 B |
| Lines | 265 |
| Hash | c8fae0d5c74d |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| node | function | 11 | no | fn node(id: &amp;str, title: &amp;str) -&gt; Node { |
| query | function | 15 | no | fn query(seeds: &amp;[&amp;str], scope: &amp;str, budget: u64, max_items: usize) -&gt; ScopedQuery { |
| scoped_query_ranks_seeds_by_caller_relevance_not_version_or_recency | function | 27 | no | fn scoped_query_ranks_seeds_by_caller_relevance_not_version_or_recency() { |
| scoped_query_never_leaves_the_authorized_scope | function | 50 | no | fn scoped_query_never_leaves_the_authorized_scope() { |
| scoped_query_fails_closed_on_unbounded_arguments | function | 70 | no | fn scoped_query_fails_closed_on_unbounded_arguments() { |
| scoped_query_budget_and_item_cap_bound_output_only | function | 94 | no | fn scoped_query_budget_and_item_cap_bound_output_only() { |
| managed | module | 124 | no | mod managed { |
| SCOPE | const | 131 | no | const SCOPE: &amp;str = &quot;abababababababababababababababababababababababababababababababab&quot;; |
| DIGEST | const | 132 | no | const DIGEST: &amp;str = &quot;3333333333333333333333333333333333333333333333333333333333333333&quot;; |
| ns | function | 134 | no | fn ns() -&gt; Namespace { |
| provenance | function | 138 | no | fn provenance(source: &amp;str, revision: u64) -&gt; Provenance { |
| apply | function | 144 | no | fn apply(graph: &amp;mut Graph, nodes: Vec&lt;Node&gt;, edges: Vec&lt;Edge&gt;) { |
| wiki | function | 160 | no | fn wiki(index: u64, title: &amp;str, order: u64, revision: u64, semantic: &amp;str, summary: &amp;str) -&gt; Node { |
| link | function | 174 | no | fn link(from: u64, to: u64) -&gt; Edge { |
| older_linked_source_is_returned_without_newest_eight_selection | function | 186 | no | fn older_linked_source_is_returned_without_newest_eight_selection() { |
| no_links_degenerates_to_recency_and_stays_bounded | function | 226 | no | fn no_links_degenerates_to_recency_and_stays_bounded() { |
| owner_view_includes_effects_and_wiki_view_does_not | function | 242 | no | fn owner_view_includes_effects_and_wiki_view_does_not() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::context_retrieval::{query_scoped, ScopedQuery} | use | 7 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 8 | external |
| std::collections::BTreeSet | use | 9 | external |
| super::* | use | 125 | external |
| hqkg::graph_change_set::{ApplyLedger, GraphChangeSet} | use | 126 | external |
| hqkg::managed_context::project_managed_graph | use | 127 | external |
| hqkg::scoped_graph::{self, Provenance} | use | 128 | external |
| hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken} | use | 129 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! NEXT:D02:scoped-query-retrieval — scoped, relevance-ordered native retrieval.
//!
//! Proves that retrieval selects by relevance inside an authorized scope rather
//! than by newest-eight recency, that the budget/item cap bounds output only,
//! and that the managed projection surfaces older relationship-linked evidence
//! with its revision and digest while keeping the durable graph unchanged.
use hqkg::context_retrieval::{query_scoped, ScopedQuery};
use hqkg::{Edge, Graph, Node, NodeKind};
use std::collections::BTreeSet;

fn node(id: &str, title: &str) -> Node {
    Node::new(id, NodeKind::Concept, title)
}

fn query(seeds: &[&str], scope: &str, budget: u64, max_items: usize) -> ScopedQuery {
    ScopedQuery {
        seeds: seeds.iter().map(|s| s.to_string()).collect(),
        scope: scope.to_string(),
        budget_tokens: budget,
        max_items,
        excluded: BTreeSet::new(),
        watermark: None,
    }
}

#[test]
fn scoped_query_ranks_seeds_by_caller_relevance_not_version_or_recency() {
    let mut graph = Graph::new();
    graph.put_node(node("s/new", "new")).unwrap();
    graph.put_node(node("s/old", "old")).unwrap();
    // Raise the older node's version so recency/version ranking would pick it
    // first; caller relevance still puts the newer seed first.
    for _ in 0..2 {
        graph.put_node(node("s/old", "old")).unwrap();
    }
    graph.put_node(node("s/deep", "deep")).unwrap();
    graph
        .put_edge(Edge::new("s-new-deep", "s/new", "relates", "s/deep"))
        .unwrap();

    let bundle = query_scoped(&graph, &query(&["s/new", "s/old"], "s/", 10_000, 8)).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids, ["s/new", "s/old", "s/deep"]);
    assert_eq!(bundle.items[0].depth, 0);
    assert_eq!(bundle.items[1].depth, 0);
    assert_eq!(bundle.items[2].depth, 1);
}

#[test]
fn scoped_query_never_leaves_the_authorized_scope() {
    let mut graph = Graph::new();
    graph.put_node(node("in/a", "a")).unwrap();
    graph.put_node(node("out/b", "b")).unwrap();
    graph
        .put_edge(Edge::new("in-a-out-b", "in/a", "relates", "out/b"))
        .unwrap();

    // Traversal from an in-scope seed cannot reach an out-of-scope neighbour.
    let bundle = query_scoped(&graph, &query(&["in/a"], "in/", 10_000, 8)).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids, ["in/a"]);
    assert!(bundle.edges.is_empty());

    // An out-of-scope seed fails closed instead of widening the scope.
    let err = query_scoped(&graph, &query(&["out/b"], "in/", 10_000, 8)).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn scoped_query_fails_closed_on_unbounded_arguments() {
    let mut graph = Graph::new();
    graph.put_node(node("in/a", "a")).unwrap();
    assert!(matches!(
        query_scoped(&graph, &query(&["in/a"], "", 100, 8)).unwrap_err(),
        hqkg::Error::Invalid(_)
    ));
    assert!(matches!(
        query_scoped(&graph, &query(&["in/a"], "in/", 0, 8)).unwrap_err(),
        hqkg::Error::Invalid(_)
    ));
```

_First 80 of 265 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
