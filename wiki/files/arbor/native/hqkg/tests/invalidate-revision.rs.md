# File: native/hqkg/tests/invalidate-revision.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/invalidate-revision.rs |
| Language | Rust |
| Kind | source |
| Size | 10961 B |
| Lines | 317 |
| Hash | 78e0011797c4 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ns | function | 31 | no | fn ns(owner: &amp;str) -&gt; Namespace { |
| node | function | 38 | no | fn node(id: &amp;str) -&gt; Node { |
| request | function | 42 | no | fn request(seeds: &amp;[&amp;str], budget: u64) -&gt; ContextRequest { |
| chain | function | 51 | no | fn chain() -&gt; Graph { |
| bundle_for | function | 61 | no | fn bundle_for(graph: &amp;Graph, req: &amp;ContextRequest) -&gt; ContextBundle { |
| caller_a | function | 65 | no | fn caller_a() -&gt; CallerId { |
| caller_b | function | 68 | no | fn caller_b() -&gt; CallerId { |
| source_rev | function | 72 | no | fn source_rev(source: &amp;str, revision: u64) -&gt; SourceRevision { |
| revision_scoped_invalidation_drops_only_affected_bundles | function | 77 | no | fn revision_scoped_invalidation_drops_only_affected_bundles() { |
| unchanged_revision_serves_bundle_via_lookup_with_caller | function | 130 | no | fn unchanged_revision_serves_bundle_via_lookup_with_caller() { |
| caller_mismatch_rejects_reuse_fail_closed | function | 148 | no | fn caller_mismatch_rejects_reuse_fail_closed() { |
| stale_watermark_rejects_and_drops_entry | function | 169 | no | fn stale_watermark_rejects_and_drops_entry() { |
| absent_watermark_never_hits_fail_closed | function | 198 | no | fn absent_watermark_never_hits_fail_closed() { |
| seed_state_with_caller_is_caller_scoped | function | 215 | no | fn seed_state_with_caller_is_caller_scoped() { |
| gate_serve_rejects_cross_namespace_and_stale_provenance | function | 231 | no | fn gate_serve_rejects_cross_namespace_and_stale_provenance() { |
| invalidate_revision_entity_set_only_affects_touched_bundles | function | 272 | no | fn invalidate_revision_entity_set_only_affects_touched_bundles() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest} | use | 21 | external |
| hqkg::graph_change_set::{ApplyLedger, ApplyReport, GraphChangeSet} | use | 22 | external |
| hqkg::invalidate::{ | use | 23 | external |
| hqkg::scoped_graph::{gate_serve, Provenance} | use | 26 | external |
| hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken} | use | 27 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 28 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 29 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
// native/hqkg/tests/invalidate-revision.rs
//
// Partition 5 of roadmap item A06 (Incremental RDCB context with reuse receipts).
// Write scope: THIS FILE ONLY.
//
// Tests the partition-2 additions to native/hqkg/src/invalidate.rs:
//   CallerId, SourceRevision, store_with_caller_and_sources,
//   lookup_with_caller, seed_state_with_caller, invalidate_revision.
//
// Acceptance criteria covered:
//   - Revision-scoped invalidation: a changed source revision drops exactly the
//     bundles whose recorded source revisions touch it, and only those.
//   - Watermark fail-closed: a stale/absent watermark rejects the hit; no
//     stale-hit acceptance.
//   - Cross-user isolation: an entry stored for one caller is never served to
//     another caller (namespaces do not authenticate; caller identity is explicit).
//
// Modeled on tests/invalidate.rs (OVN-B lane 5) and tests/context_retrieval.rs
// (OVN-B lane 4).

use hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest};
use hqkg::graph_change_set::{ApplyLedger, ApplyReport, GraphChangeSet};
use hqkg::invalidate::{
    CallerId, InvalidateCache, SourceRevision,
};
use hqkg::scoped_graph::{gate_serve, Provenance};
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken};
use hqkg::{Edge, Graph, Node, NodeKind};
use std::collections::{BTreeMap, BTreeSet};

fn ns(owner: &str) -> Namespace {
    Namespace {
        domain: GraphDomain::Development,
        owner: owner.into(),
    }
}

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
    let mut g = Graph::new();
    for id in ["a", "b", "c"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("e1", "a", "relates", "b")).unwrap();
    g.put_edge(Edge::new("e2", "b", "relates", "c")).unwrap();
    g
}

fn bundle_for(graph: &Graph, req: &ContextRequest) -> ContextBundle {
    retrieve(graph, req).unwrap()
}

fn caller_a() -> CallerId {
    CallerId::new("user-a", "ns-a")
}
fn caller_b() -> CallerId {
    CallerId::new("user-b", "ns-b")
}

fn source_rev(source: &str, revision: u64) -> SourceRevision {
    SourceRevision::new(source, revision, "0".repeat(64))
}

#[test]
fn revision_scoped_invalidation_drops_only_affected_bundles() {
    // Two disconnected components: bundles never share entities.
    let mut g = chain();
    g.put_node(node("z")).unwrap();
```

_First 80 of 318 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
