use hqkg::{deserialize, serialize, Edge, Graph, Node, NodeKind};
#[test]
fn indexes_survive_edge_replacement_node_delete_and_snapshot_replay() {
    let mut g = Graph::new();
    for id in ["a", "b", "c", "d"] {
        g.put_node(Node::new(id, NodeKind::Concept, id)).unwrap();
    }
    g.put_edge(Edge::new("e1", "a", "link", "b")).unwrap();
    g.put_edge(Edge::new("e2", "a", "link", "c")).unwrap();
    g.put_edge(Edge::new("e3", "c", "link", "d")).unwrap();
    g.check_indexes().unwrap();
    assert_eq!(g.outgoing("a", None).unwrap().len(), 2);
    assert_eq!(g.incoming("b", None).unwrap().len(), 1);
    // Reusing an edge ID must unlink the old endpoints.
    g.put_edge(Edge::new("e1", "b", "link", "d")).unwrap();
    assert_eq!(g.outgoing("a", None).unwrap().len(), 1);
    assert_eq!(g.incoming("b", None).unwrap().len(), 0);
    assert_eq!(g.incoming("d", None).unwrap().len(), 2);
    g.check_indexes().unwrap();
    let bytes = serialize(&g).unwrap();
    let mut decoded = deserialize(&bytes).unwrap();
    decoded.check_indexes().unwrap();
    assert_eq!(
        decoded.shortest_path("b", "d", None).unwrap().unwrap(),
        vec!["b", "d"]
    );
    decoded.remove_node("d").unwrap();
    decoded.check_indexes().unwrap();
    assert_eq!(decoded.edge_count(), 1);
    assert!(decoded.shortest_path("a", "c", None).unwrap().is_some());
}
#[test]
fn incoming_outgoing_relation_filters_and_duplicate_parallel_links() {
    let mut g = Graph::new();
    g.put_node(Node::new("a", NodeKind::Concept, "A")).unwrap();
    g.put_node(Node::new("b", NodeKind::Concept, "B")).unwrap();
    g.put_edge(Edge::new("1", "a", "same_as", "b")).unwrap();
    g.put_edge(Edge::new("2", "a", "mentions", "b")).unwrap();
    assert_eq!(g.outgoing("a", Some("same_as")).unwrap().len(), 1);
    assert_eq!(g.incoming("b", Some("mentions")).unwrap().len(), 1);
    g.remove_edge("1").unwrap();
    assert_eq!(g.outgoing("a", None).unwrap().len(), 1);
    g.check_indexes().unwrap();
}
