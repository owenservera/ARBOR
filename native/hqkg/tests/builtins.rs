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
