# File: native/hqkg/tests/algorithm_adapter.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/algorithm_adapter.rs |
| Language | Rust |
| Kind | source |
| Size | 6775 B |
| Lines | 202 |
| Hash | ca3faa244f57 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NeighborCount | struct | 10 | no | struct NeighborCount { |
| operations | method | 14 | no | fn operations(&amp;self) -&gt; BTreeSet&lt;String&gt; { |
| execute | method | 17 | no | fn execute(&amp;self, request: &amp;EngineRequest, graph: &amp;Graph) -&gt; hqkg::Result&lt;hqkg::EngineOutput&gt; { |
| graph | function | 24 | no | fn graph() -&gt; Arc&lt;RwLock&lt;Graph&gt;&gt; { |
| catalog_seeds_thirty_inert_nodes_idempotently | function | 39 | no | fn catalog_seeds_thirty_inert_nodes_idempotently() { |
| adapter_uses_existing_runtime_and_generational_pins | function | 61 | no | fn adapter_uses_existing_runtime_and_generational_pins() { |
| pinned_descriptor_v2 | function | 124 | no | fn pinned_descriptor_v2() -&gt; hqkg::EngineDescriptor { |
| missing_nodes_or_incompatible_drivers_are_rejected | function | 134 | no | fn missing_nodes_or_incompatible_drivers_are_rejected() { |
| custom_algorithms_have_the_same_extension_contract | function | 177 | no | fn custom_algorithms_have_the_same_extension_contract() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::{ | use | 2 | external |
| std::collections::BTreeSet | use | 7 | external |
| std::sync::{Arc, RwLock} | use | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Native HQKG integration tests; no external crates or network required.
use hqkg::{
    algorithm_by_id, algorithm_node_id, algorithm_slot, record_algorithm_engine_swap,
    seed_algorithm_nodes, AlgorithmCompute, AlgorithmDriver, ComputeEngine, EngineRegistry,
    EngineRequest, Graph, Node, NodeKind, ALGORITHMS,
};
use std::collections::BTreeSet;
use std::sync::{Arc, RwLock};

struct NeighborCount {
    multiplier: usize,
}
impl AlgorithmDriver for NeighborCount {
    fn operations(&self) -> BTreeSet<String> {
        ["neighbors_count"].iter().map(|v| v.to_string()).collect()
    }
    fn execute(&self, request: &EngineRequest, graph: &Graph) -> hqkg::Result<hqkg::EngineOutput> {
        let count = graph.outgoing(&request.data, None)?.len();
        Ok(hqkg::EngineOutput {
            data: (count * self.multiplier).to_string(),
        })
    }
}
fn graph() -> Arc<RwLock<Graph>> {
    let mut g = Graph::new();
    seed_algorithm_nodes(&mut g).unwrap();
    g.put_node(Node::new("test:one", NodeKind::Concept, "Root"))
        .unwrap();
    g.put_node(Node::new("test:two", NodeKind::Concept, "Leaf"))
        .unwrap();
    g.put_edge(hqkg::Edge::new(
        "test:e1", "test:one", "leads_to", "test:two",
    ))
    .unwrap();
    Arc::new(RwLock::new(g))
}

#[test]
fn catalog_seeds_thirty_inert_nodes_idempotently() {
    let mut graph = Graph::new();
    assert_eq!(ALGORITHMS.len(), 30);
    assert_eq!(seed_algorithm_nodes(&mut graph).unwrap(), 30);
    assert_eq!(graph.node_count(), 30);
    assert_eq!(seed_algorithm_nodes(&mut graph).unwrap(), 0);
    let node = graph.node(&algorithm_node_id("KGSI-001")).unwrap();
    assert_eq!(node.properties["algorithm_id"], "KGSI-001");
    assert_eq!(node.properties["executable"], "false");
    assert_eq!(node.properties["engine_slot"], algorithm_slot("KGSI-001"));
    assert_eq!(node.kind, NodeKind::Other("algorithm".into()));
    assert!(node
        .sources
        .contains(algorithm_by_id("KGSI-001").unwrap().source));
    assert_eq!(algorithm_by_id("KGSI-030").unwrap().name, "RippleMem");
    let bytes = hqkg::serialize(&graph).unwrap();
    let restored = hqkg::deserialize(&bytes).unwrap();
    assert_eq!(restored.node_count(), 30);
    assert!(restored.node(&algorithm_node_id("KGSI-030")).is_some());
}

#[test]
fn adapter_uses_existing_runtime_and_generational_pins() {
    let graph = graph();
    let registry = EngineRegistry::new();
    let v1 = Arc::new(
        AlgorithmCompute::new(
            "KGSI-001",
            "neighbor-baseline.v1",
            Arc::clone(&graph),
            Arc::new(NeighborCount { multiplier: 1 }),
        )
        .unwrap(),
    );
    let first = registry.install(v1.clone(), None).unwrap();
    assert_eq!(first.generation, 1);
    assert_eq!(v1.descriptor().slot, "algorithm:KGSI-001");
    let pinned = registry.pin("algorithm:KGSI-001").unwrap();
    let v2 = Arc::new(
        AlgorithmCompute::new(
            "KGSI-001",
            "neighbor-baseline.v2",
```

_First 80 of 203 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
