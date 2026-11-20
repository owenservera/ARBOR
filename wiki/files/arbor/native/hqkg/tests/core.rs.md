# File: native/hqkg/tests/core.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/core.rs |
| Language | Rust |
| Kind | source |
| Size | 6679 B |
| Lines | 184 |
| Hash | 5361be4d8b31 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| graph_path_cycle_rank_and_deletion | function | 10 | no | fn graph_path_cycle_rank_and_deletion() { |
| journal_round_trip_and_torn_tail | function | 30 | no | fn journal_round_trip_and_torn_tail() { |
| Echo | struct | 64 | no | struct Echo(&amp;&#39;static str); |
| descriptor | method | 66 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 69 | no | fn execute(&amp;self, req: &amp;EngineRequest) -&gt; hqkg::Result&lt;EngineOutput&gt; { |
| hot_swap_preserves_inflight_lease | function | 76 | no | fn hot_swap_preserves_inflight_lease() { |
| bounded_scheduler_and_database_metadata | function | 111 | no | fn bounded_scheduler_and_database_metadata() { |
| public_writers_cannot_mint_reserved_properties | function | 151 | no | fn public_writers_cannot_mint_reserved_properties() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::{ | use | 1 | external |
| hqkg::{DatabaseKind, DatabaseSpec, Edge, Error, Graph, Journal, Node, NodeKind} | use | 5 | external |
| std::collections::BTreeSet | use | 6 | external |
| std::sync::Arc | use | 7 | external |
| std::io::Write | use | 49 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
use hqkg::{
    Budget, ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry, EngineRequest,
    Scheduler, Task,
};
use hqkg::{DatabaseKind, DatabaseSpec, Edge, Error, Graph, Journal, Node, NodeKind};
use std::collections::BTreeSet;
use std::sync::Arc;

#[test]
fn graph_path_cycle_rank_and_deletion() {
    let mut g = Graph::new();
    for id in ["a", "b", "c"] {
        g.put_node(Node::new(id, NodeKind::Concept, id)).unwrap();
    }
    g.put_edge(Edge::new("ab", "a", "depends_on", "b")).unwrap();
    g.put_edge(Edge::new("bc", "b", "depends_on", "c")).unwrap();
    assert_eq!(
        g.shortest_path("a", "c", None).unwrap().unwrap(),
        vec!["a", "b", "c"]
    );
    assert_eq!(g.topological("depends_on").unwrap(), vec!["a", "b", "c"]);
    let ranks = g.page_rank(20, 0.85).unwrap();
    assert!((ranks.values().sum::<f64>() - 1.0).abs() < 0.00001);
    g.put_edge(Edge::new("ca", "c", "depends_on", "a")).unwrap();
    assert!(g.topological("depends_on").is_err());
    g.remove_node("b").unwrap();
    assert_eq!(g.edge_count(), 1);
}
#[test]
fn journal_round_trip_and_torn_tail() {
    let file = std::env::temp_dir().join(format!(
        "hqkg-{}-{}.hqj",
        std::process::id(),
        std::thread::current().name().unwrap_or("journal")
    ));
    let _ = std::fs::remove_file(&file);
    let journal = Journal::new(&file);
    let mut g = Graph::new();
    g.put_node(
        Node::new("x", NodeKind::Fact, "Example")
            .property("k", "v")
            .source("paper:1"),
    )
    .unwrap();
    journal.save(&g).unwrap();
    let mut loaded = journal.load().unwrap();
    assert_eq!(loaded.node("x").unwrap().properties["k"], "v");
    // A torn frame must not invalidate the last complete graph revision.
    use std::io::Write;
    std::fs::OpenOptions::new()
        .append(true)
        .open(&file)
        .unwrap()
        .write_all(b"HQJ1")
        .unwrap();
    assert_eq!(journal.load().unwrap().node_count(), 1);
    loaded
        .put_node(Node::new("y", NodeKind::Dataset, "Y"))
        .unwrap();
    journal.save(&loaded).unwrap();
    assert_eq!(journal.load().unwrap().node_count(), 2);
    let _ = std::fs::remove_file(file);
}
struct Echo(&'static str);
impl ComputeEngine for Echo {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("demo", "echo", "text-v1", &["echo"])
    }
    fn execute(&self, req: &EngineRequest) -> hqkg::Result<EngineOutput> {
        Ok(EngineOutput {
            data: format!("{}:{}", self.0, req.data),
        })
    }
}
#[test]
fn hot_swap_preserves_inflight_lease() {
    let registry = EngineRegistry::new();
    let first = registry.install(Arc::new(Echo("old")), None).unwrap();
    let pinned = registry.pin("demo").unwrap();
    let second = registry
```

_First 80 of 185 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
