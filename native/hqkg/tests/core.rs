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
        .install(Arc::new(Echo("new")), Some(first.generation))
        .unwrap();
    let request = EngineRequest {
        operation: "echo".into(),
        data: "ok".into(),
    };
    assert_eq!(pinned.execute(&request).unwrap().data, "old:ok");
    assert_eq!(
        registry
            .pin("demo")
            .unwrap()
            .execute(&request)
            .unwrap()
            .data,
        "new:ok"
    );
    let mut graph = Graph::new();
    graph
        .record_engine_swap(&Echo("old").descriptor(), &first)
        .unwrap();
    graph
        .record_engine_swap(&Echo("new").descriptor(), &second)
        .unwrap();
    assert!(graph.node("engine:demo:1").is_some());
    assert_eq!(
        graph.edge("engine-active:demo").unwrap().to,
        "engine:demo:2"
    );
}
#[test]
fn bounded_scheduler_and_database_metadata() {
    let reg = EngineRegistry::new();
    reg.install(Arc::new(Echo("live")), None).unwrap();
    let plan = vec![
        Task {
            id: "1".into(),
            engine: "demo".into(),
            operation: "echo".into(),
            input: "a".into(),
            after: vec![],
        },
        Task {
            id: "2".into(),
            engine: "demo".into(),
            operation: "echo".into(),
            input: "b".into(),
            after: vec!["1".into()],
        },
    ];
    let r = Scheduler::new(&reg).run(&plan, Budget::default()).unwrap();
    assert_eq!(r[1].output, "live:b");
    let mut cycle = plan.clone();
    cycle[0].after.push("2".into());
    assert!(Scheduler::new(&reg).run(&cycle, Budget::default()).is_err());
    let db = DatabaseSpec {
        id: "db:one".into(),
        kind: DatabaseKind::Postgres,
        locator: String::new(),
        credential_env: Some("HQKG_PG_DSN".into()),
    };
    let node = db.to_node().unwrap();
    assert_eq!(
        DatabaseSpec::from_node(&node).unwrap().kind,
        DatabaseKind::Postgres
    );
    assert!(!node.properties.contains_key("password"));
    assert!(db.query("DELETE FROM x", 20).is_err());
    let _ = BTreeSet::<String>::new();
}
#[test]
fn public_writers_cannot_mint_reserved_properties() {
    let mut g = Graph::new();
    g.put_node(Node::new("a", NodeKind::Concept, "A")).unwrap();
    // Forging exchange ownership through the public node write is rejected.
    let mut forged = Node::new("b", NodeKind::Fact, "Forged owner");
    forged
        .properties
        .insert("hqkg.exchange.source".into(), "attacker/source".into());
    match g.put_node(forged) {
        Err(Error::Invalid(message)) => assert!(
            message.contains("reserved"),
            "unexpected rejection message: {message}"
        ),
        other => panic!("expected reserved-prefix rejection, got {other:?}"),
    }
    assert!(g.node("b").is_none(), "rejected node must not be stored");
    // Edge properties are reserved by the same rule.
    let mut forged_edge = Edge::new("ae", "a", "depends_on", "a");
    forged_edge
        .properties
        .insert("hqkg.exchange.source".into(), "attacker/source".into());
    assert!(matches!(g.put_edge(forged_edge), Err(Error::Invalid(_))));
    assert!(g.edge("ae").is_none());
    // Any hqkg.* key is reserved, not just the exchange ownership key.
    let mut contract = Node::new("c", NodeKind::Fact, "Contract");
    contract
        .properties
        .insert("hqkg.contract".into(), "x/1".into());
    assert!(matches!(g.put_node(contract), Err(Error::Invalid(_))));
    // Non-reserved properties stay writable and unaffected.
    g.put_node(Node::new("d", NodeKind::Fact, "Plain").property("k", "v"))
        .unwrap();
    assert_eq!(g.node("d").unwrap().properties["k"], "v");
}
