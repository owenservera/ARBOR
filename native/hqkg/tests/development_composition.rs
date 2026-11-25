#![cfg(all(feature = "importer", feature = "native-program"))]

use hqkg::{Graph, Node, NodeKind, Edge};
use hqkg::import::{Exchange, Manifest};
use hqkg::development_engine::install_development_engine;
use hqkg::engine::{Budget, CancellationToken, EngineRegistry};
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken, IncrementalCache, RunState, OutputState};
use vivim_programmability_core::{Program, PolicyLimits, TransformStep, SourceRef, TransformKind, DataClass, Risk};
use serde_json::Value;
use std::collections::BTreeMap;

fn graph() -> Graph {
    let mut nodes = BTreeMap::new();
    for id in ["root", "dependency", "consumer"] {
        let mut node = Node::new(id, NodeKind::Other("source-file".into()), id);
        node.properties.insert("hqkg.exchange.source".into(), "repos-hq.index".into());
        node.properties.insert("source_path".into(), format!("arbor/{id}.rs"));
        node.properties.insert("content_sha256".into(), "a".repeat(64));
        nodes.insert(id.into(), node);
    }
    let mut edges = BTreeMap::new();
    for (id, from, to) in [("root-import", "root", "dependency"), ("consumer-import", "consumer", "dependency")] {
        let mut edge = Edge::new(id, from, "imports", to);
        edge.properties.insert("hqkg.exchange.source".into(), "repos-hq.index".into());
        edges.insert(id.into(), edge);
    }
    let exchange = Exchange {
        manifest: Manifest { source: "repos-hq.index".into(), digest: String::new(), node_count: nodes.len(), edge_count: edges.len(), tombstone_count: 0, reconcile_edges: true },
        nodes, edges, tombstones: Default::default()
    };
    let mut graph = Graph::new();
    exchange.apply(&mut graph).unwrap();
    graph
}

fn task(graph: &Graph) -> (Program, PolicyLimits, RevisionToken) {
    let node = graph.node("root").unwrap();
    let source = SourceRef { source_id: node.id.clone(), revision: node.version, digest: node.properties["content_sha256"].clone(), data_class: DataClass::Internal };
    let step = |id: &str, kind, dependencies: Vec<String>, inputs: Vec<SourceRef>| TransformStep {
        id: id.into(), kind, dependencies, inputs, output_data_class: DataClass::Internal, risk: Risk::R0, destination: None
    };
    let program = Program { id: "novel-import-impact".into(), revision: 1, policy_id: "development-preview".into(), policy_revision: 1, steps: vec![
        step("impact", TransformKind::Evaluate, vec!["select".into()], vec![]),
        step("select", TransformKind::SelectContext, vec![], vec![source]),
        step("projection", TransformKind::Project, vec!["impact".into()], vec![]),
    ] };
    let policy = PolicyLimits { id: "development-preview".into(), revision: 1, max_risk: Risk::R0, max_input_class: DataClass::Internal, max_output_class: DataClass::Internal, allowed_destinations: Default::default(), allow_effect_candidates: false };
    let token = RevisionToken { namespace: Namespace { domain: GraphDomain::Development, owner: "local-hq".into() }, graph_epoch: graph.epoch() };
    (program, policy, token)
}

#[test]
fn selected_imports_are_bound_to_source_free_impact_and_projection() {
    let graph = graph();
    let (program, policy, token) = task(&graph);
    let registry = EngineRegistry::new();
    install_development_engine(&registry, graph.clone()).unwrap();
    let mut cache = IncrementalCache::new();
    let cancel = CancellationToken::new();
    let run = |cache: &mut IncrementalCache| hqkg::native_program::run_indexed_program(&graph, &token, &program, &policy, &registry, cache, Budget::default(), &cancel).unwrap();
    let report = run(&mut cache);
    assert_eq!(report.state, RunState::Complete, "{:?}", report.failure);
    assert!(!report.effect_authorized);
    let impact: Value = serde_json::from_str(&report.outputs[1].data).unwrap();
    assert_eq!(impact["sourceCount"], 2);
    assert_eq!(impact["derivedSourceBindings"]["dependency"][0], "select");
    assert!(impact["dependents"].as_array().unwrap().iter().any(|row| row["id"] == "consumer"));
    let projection: Value = serde_json::from_str(&report.outputs[2].data).unwrap();
    assert_eq!(projection["sourceCount"], 2);
    assert_eq!(projection["derivedSourceBindings"]["dependency"][0], "impact");
    assert_eq!(projection["executionAuthorized"], false);
    let warm = run(&mut cache);
    assert!(warm.outputs.iter().all(|out| out.state == OutputState::Reused));
    assert_eq!(warm.outputs[2].data, report.outputs[2].data);
}

#[test]
fn derived_graph_bindings_require_internal_policy_and_no_destination() {
    let graph = graph();
    let (mut program, mut policy, token) = task(&graph);
    program.steps[0].output_data_class = DataClass::Public;
    assert!(hqkg::native_program::bind_indexed_program(&graph, &token, &program, &policy).is_err());
    program.steps[0].output_data_class = DataClass::Internal;
    policy.allowed_destinations.insert("external".into());
    program.steps[0].destination = Some("external".into());
    assert!(hqkg::native_program::bind_indexed_program(&graph, &token, &program, &policy).is_err());
}
