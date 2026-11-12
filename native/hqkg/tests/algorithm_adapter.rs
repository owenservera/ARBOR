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
            Arc::clone(&graph),
            Arc::new(NeighborCount { multiplier: 2 }),
        )
        .unwrap(),
    );
    let second = registry
        .install(v2.clone(), Some(first.generation))
        .unwrap();
    assert_eq!(second.generation, 2);
    assert!(registry.install(v2, Some(first.generation)).is_err());
    let req = EngineRequest {
        operation: "neighbors_count".into(),
        data: "test:one".into(),
    };
    assert_eq!(pinned.execute(&req).unwrap().data, "1");
    assert_eq!(
        registry
            .pin("algorithm:KGSI-001")
            .unwrap()
            .execute(&req)
            .unwrap()
            .data,
        "2"
    );
    {
        let mut g = graph.write().unwrap();
        record_algorithm_engine_swap(&mut g, "KGSI-001", &v1.descriptor(), &first).unwrap();
        record_algorithm_engine_swap(&mut g, "KGSI-001", &pinned_descriptor_v2(), &second).unwrap();
        assert!(g.node("engine:algorithm:KGSI-001:1").is_some());
        assert_eq!(
            g.edge("engine-active:algorithm:KGSI-001").unwrap().to,
            "engine:algorithm:KGSI-001:2"
        );
        assert_eq!(
            g.edge("algorithm-slot-link:KGSI-001").unwrap().to,
            "engine-slot:algorithm:KGSI-001"
        );
        assert_eq!(
            g.node(&algorithm_node_id("KGSI-001")).unwrap().properties["executable"],
            "false"
        );
    }
}
fn pinned_descriptor_v2() -> hqkg::EngineDescriptor {
    hqkg::EngineDescriptor::new(
        "algorithm:KGSI-001",
        "neighbor-baseline.v2",
        "hqkg.algorithm.v1",
        &["neighbors_count"],
    )
}

#[test]
fn missing_nodes_or_incompatible_drivers_are_rejected() {
    let blank = Arc::new(RwLock::new(Graph::new()));
    assert!(AlgorithmCompute::new(
        "KGSI-001",
        "baseline",
        Arc::clone(&blank),
        Arc::new(NeighborCount { multiplier: 1 })
    )
    .is_err());
    let g = graph();
    assert!(AlgorithmCompute::new(
        "KGSI-001",
        "",
        Arc::clone(&g),
        Arc::new(NeighborCount { multiplier: 1 })
    )
    .is_err());
    let registry = EngineRegistry::new();
    assert!(registry.pin("algorithm:KGSI-001").is_err());
    let a = Arc::new(
        AlgorithmCompute::new(
            "KGSI-001",
            "baseline",
            Arc::clone(&g),
            Arc::new(NeighborCount { multiplier: 1 }),
        )
        .unwrap(),
    );
    registry.install(a, None).unwrap();
    let b = Arc::new(
        AlgorithmCompute::new(
            "KGSI-005",
            "other",
            Arc::clone(&g),
            Arc::new(NeighborCount { multiplier: 1 }),
        )
        .unwrap(),
    );
    assert!(registry.install(b, Some(1)).is_err());
    assert!(registry.pin("algorithm:KGSI-005").is_err());
}

#[test]
fn custom_algorithms_have_the_same_extension_contract() {
    let mut graph = Graph::new();
    assert!(hqkg::ensure_algorithm_node(
        &mut graph,
        "CUSTOM42",
        "MyGraphAlg",
        "custom",
        "local-source"
    )
    .unwrap());
    assert!(!hqkg::ensure_algorithm_node(
        &mut graph,
        "CUSTOM42",
        "MyGraphAlg",
        "custom",
        "local-source"
    )
    .unwrap());
    assert_eq!(graph.node_count(), 1);
    assert!(hqkg::ensure_algorithm_node(&mut graph, "BAD/ID", "Bad", "x", "").is_err());
    assert!(hqkg::ensure_algorithm_node(&mut graph, "CUSTOM42", "Changed", "x", "").is_ok());
    assert_eq!(
        graph.node(&algorithm_node_id("CUSTOM42")).unwrap().title,
        "MyGraphAlg"
    );
}
