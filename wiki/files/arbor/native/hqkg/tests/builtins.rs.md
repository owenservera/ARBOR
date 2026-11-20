# File: native/hqkg/tests/builtins.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/builtins.rs |
| Language | Rust |
| Kind | source |
| Size | 1417 B |
| Lines | 39 |
| Hash | 6784983c5fd4 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| graph_compute_is_a_schedulable_engine | function | 7 | no | fn graph_compute_is_a_schedulable_engine() { |
| database_compute_is_an_engine_node_with_query_catalog_and_health | function | 27 | no | fn database_compute_is_an_engine_node_with_query_catalog_and_health() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::builtins::{DatabaseCompute, GraphCompute} | use | 1 | external |
| hqkg::{ComputeEngine, Edge, EngineRegistry, EngineRequest, Graph, Node, NodeKind} | use | 2 | external |
| hqkg::{DatabaseKind, DatabaseSpec} | use | 3 | external |
| std::sync::{Arc, RwLock} | use | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
use hqkg::builtins::{DatabaseCompute, GraphCompute};
use hqkg::{ComputeEngine, Edge, EngineRegistry, EngineRequest, Graph, Node, NodeKind};
use hqkg::{DatabaseKind, DatabaseSpec};
use std::sync::{Arc, RwLock};

#[test]
fn graph_compute_is_a_schedulable_engine() {
    let mut g = Graph::new();
    g.put_node(Node::new("a", NodeKind::Concept, "Alpha"))
        .unwrap();
    g.put_node(Node::new("b", NodeKind::Fact, "Beta")).unwrap();
    g.put_edge(Edge::new("ab", "a", "links", "b")).unwrap();
    let eng = GraphCompute::new("knowledge", Arc::new(RwLock::new(g)));
    let registry = EngineRegistry::new();
    registry.install(Arc::new(eng), None).unwrap();
    let out = registry
        .pin("knowledge")
        .unwrap()
        .execute(&EngineRequest {
            operation: "path".into(),
            data: "a\tb".into(),
        })
        .unwrap();
    assert_eq!(out.data, "a -> b");
}
#[test]
fn database_compute_is_an_engine_node_with_query_catalog_and_health() {
    let spec = DatabaseSpec {
        id: "db:docs".into(),
        kind: DatabaseKind::Sqlite,
        locator: "docs.db".into(),
        credential_env: None,
    };
    let eng = DatabaseCompute::new(spec);
    let desc = eng.descriptor();
    assert!(desc.capabilities.contains("catalog"));
    assert!(desc.capabilities.contains("query"));
    assert_eq!(desc.slot, "database:db:docs");
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
