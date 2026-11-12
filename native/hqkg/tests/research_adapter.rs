use hqkg::adapters::research::ResearchCatalogCompute;
use hqkg::{ComputeEngine, EngineRegistry, EngineRequest, Graph, Node, NodeKind};
use std::sync::{Arc, RwLock};
#[test]
fn research_adapter_queries_catalog_without_activating_algorithms() {
    let mut g = Graph::new();
    g.put_node(
        Node::new("n1", NodeKind::Other("language-resource".into()), "ICU4X")
            .property("resource_id", "NLE-001")
            .property("family", "unicode")
            .property("asset_mode", "compute_reference_data")
            .property("asset_kinds", "unicode_locale_data")
            .property("status", "research_only")
            .property("installed", "false"),
    )
    .unwrap();
    g.put_node(
        Node::new("n2", NodeKind::Other("algorithm".into()), "EdgeMem")
            .property("algorithm_id", "KGSI-001")
            .property("family", "agent_memory")
            .property("status", "research_only"),
    )
    .unwrap();
    g.put_node(
        Node::new(
            "n3",
            NodeKind::Other("scoring-observation".into()),
            "Provisional score",
        )
        .property("file_id", "file:001")
        .property("F01", "5")
        .property("F02", "2"),
    )
    .unwrap();
    let n = g.node_count();
    let engine = ResearchCatalogCompute::new(Arc::new(RwLock::new(g)));
    let registry = EngineRegistry::new();
    registry.install(Arc::new(engine), None).unwrap();
    let lease = registry.pin("hqkg:research-catalog").unwrap();
    let ask = |op: &str, data: &str| {
        lease
            .execute(&EngineRequest {
                operation: op.into(),
                data: data.into(),
            })
            .unwrap()
            .data
    };
    assert!(ask("summary", "").contains("language-resource=1"));
    assert!(ask("list_kgsi", "").contains("KGSI-001"));
    assert!(ask("resource", "NLE-001").contains("installed=false"));
    assert!(ask("score_file", "file:001").contains("F01=5"));
    assert_eq!(n, 3);
    assert_eq!(lease.descriptor().interface, "hqkg.research.read.v1");
}
