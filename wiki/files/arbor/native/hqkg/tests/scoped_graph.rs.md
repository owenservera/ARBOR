# File: native/hqkg/tests/scoped_graph.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/scoped_graph.rs |
| Language | Rust |
| Kind | source |
| Size | 3808 B |
| Lines | 100 |
| Hash | 3a4a2b7e648f |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ns | function | 6 | no | fn ns(domain: GraphDomain) -&gt; Namespace { |
| provenance | function | 12 | no | fn provenance() -&gt; Provenance { |
| token | function | 19 | no | fn token(ns: &amp;Namespace, g: &amp;Graph) -&gt; RevisionToken { |
| scoped_records_and_changes_are_atomic_and_invalidate | function | 26 | no | fn scoped_records_and_changes_are_atomic_and_invalidate() { |
| invalid_mutation_cannot_partially_modify_existing_graph | function | 51 | no | fn invalid_mutation_cannot_partially_modify_existing_graph() { |
| foreign_domains_and_unscoped_graph_are_refused | function | 74 | no | fn foreign_domains_and_unscoped_graph_are_refused() { |
| provenance_requires_revision_digest_and_source | function | 92 | no | fn provenance_requires_revision_digest_and_source() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::graph_change_set::{ApplyLedger, GraphChangeSet} | use | 1 | external |
| hqkg::scoped_graph::* | use | 2 | external |
| hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken} | use | 3 | external |
| hqkg::{Graph, Node, NodeKind} | use | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
use hqkg::graph_change_set::{ApplyLedger, GraphChangeSet};
use hqkg::scoped_graph::*;
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken};
use hqkg::{Graph, Node, NodeKind};

fn ns(domain: GraphDomain) -> Namespace {
    Namespace {
        domain,
        owner: "owner".into(),
    }
}
fn provenance() -> Provenance {
    Provenance {
        source: "trusted-file".into(),
        revision: 1,
        digest: "a".repeat(64),
    }
}
fn token(ns: &Namespace, g: &Graph) -> RevisionToken {
    RevisionToken {
        namespace: ns.clone(),
        graph_epoch: g.epoch(),
    }
}
#[test]
fn scoped_records_and_changes_are_atomic_and_invalidate() {
    let scope = ns(GraphDomain::Development);
    let mut graph = Graph::new();
    let mut ledger = ApplyLedger::new();
    let a = node(&scope, "a", NodeKind::Document, "A", &provenance()).unwrap();
    let b = node(&scope, "b", NodeKind::Document, "B", &provenance()).unwrap();
    let link = edge(&scope, "link", &a.id, "depends_on", &b.id, &provenance()).unwrap();
    let id = qualified_id(&scope, "cs1").unwrap();
    let changes = GraphChangeSet::new(&id, "fixture")
        .put_node(a.clone())
        .put_node(b.clone())
        .put_edge(link.clone());
    let expected = token(&scope, &graph);
    let report = apply_scoped(&mut graph, &scope, &expected, &changes, &mut ledger);
    assert!(report.is_ok());
    let report = report.unwrap();
    assert!(report.invalidation_set.contains(&a.id));
    assert_eq!(graph.node_count(), 2);
    assert_eq!(graph.edge_count(), 1);
    graph.check_indexes().unwrap();
    let prior = token(&scope, &graph);
    let duplicate = apply_scoped(&mut graph, &scope, &prior, &changes, &mut ledger).unwrap();
    assert!(duplicate.duplicate);
}
#[test]
fn invalid_mutation_cannot_partially_modify_existing_graph() {
    let scope = ns(GraphDomain::Personal);
    let mut graph = Graph::new();
    let mut ledger = ApplyLedger::new();
    let a = node(&scope, "a", NodeKind::Fact, "A", &provenance()).unwrap();
    let bad = edge(
        &scope,
        "dangling",
        &a.id,
        "depends_on",
        &qualified_id(&scope, "missing").unwrap(),
        &provenance(),
    )
    .unwrap();
    let changes = GraphChangeSet::new(qualified_id(&scope, "cs1").unwrap(), "fixture")
        .put_node(a)
        .put_edge(bad);
    let expected = token(&scope, &graph);
    assert!(apply_scoped(&mut graph, &scope, &expected, &changes, &mut ledger).is_err());
    assert_eq!(graph.node_count(), 0);
    assert_eq!(ledger.len(), 0);
}
#[test]
fn foreign_domains_and_unscoped_graph_are_refused() {
    let personal = ns(GraphDomain::Personal);
    let development = ns(GraphDomain::Development);
    let mut graph = Graph::new();
    let mut ledger = ApplyLedger::new();
    let node = node(&personal, "a", NodeKind::Fact, "private", &provenance()).unwrap();
    let changes =
```

_First 80 of 101 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
