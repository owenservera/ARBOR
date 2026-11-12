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
        GraphChangeSet::new(qualified_id(&personal, "cs1").unwrap(), "fixture").put_node(node);
    let expected = token(&personal, &graph);
    assert!(apply_scoped(&mut graph, &development, &expected, &changes, &mut ledger).is_err());
    graph
        .put_node(Node::new("legacy-unscoped", NodeKind::Fact, "legacy"))
        .unwrap();
    let expected = token(&personal, &graph);
    assert!(apply_scoped(&mut graph, &personal, &expected, &changes, &mut ledger).is_err());
    assert_eq!(graph.node_count(), 1);
}
#[test]
fn provenance_requires_revision_digest_and_source() {
    let scope = ns(GraphDomain::Development);
    let bad = Provenance {
        source: "owner".into(),
        revision: 0,
        digest: "not-sha".into(),
    };
    assert!(node(&scope, "a", NodeKind::Concept, "bad", &bad).is_err());
}
