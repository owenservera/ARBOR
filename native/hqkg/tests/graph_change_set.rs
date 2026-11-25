use hqkg::graph_change_set::{
    apply, lineage_chain, lineage_depth, ApplyLedger, ChangeOp, GraphChangeSet, Tombstone,
};
use hqkg::{Edge, Graph, Node, NodeKind};

fn node(id: &str) -> Node {
    Node::new(id, NodeKind::Concept, id)
}

#[test]
fn put_ops_apply_with_invalidation_set() {
    let mut g = Graph::new();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-1", "web-feed")
        .put_node(node("a"))
        .put_node(node("b"))
        .put_edge(Edge::new("ab", "a", "depends_on", "b"));
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(r.change_set_id, "cs-1");
    assert!(!r.duplicate);
    assert_eq!(r.applied, 3);
    assert_eq!(r.skipped, 0);
    assert!(g.node("a").is_some() && g.node("b").is_some());
    assert!(g.edge("ab").is_some());
    assert_eq!(
        r.invalidation_set,
        ["a", "b", "ab"].into_iter().map(str::to_owned).collect()
    );
    assert!(r.tombstones.is_empty());
    // Ledger records the applied change set id.
    assert!(ledger.contains("cs-1"));
}

#[test]
fn same_change_set_id_applied_twice_is_a_no_op_duplicate() {
    let mut g = Graph::new();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-dup", "web-feed")
        .put_node(node("a"))
        .put_node(node("b"))
        .put_edge(Edge::new("ab", "a", "depends_on", "b"));
    let first = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(first.applied, 3);
    let epoch_after_first = g.epoch();
    let edge_count_after_first = g.edge_count();
    let second = apply(&mut g, &cs, &mut ledger).unwrap();
    assert!(
        second.duplicate,
        "re-apply must return the DUPLICATE marker"
    );
    assert_eq!(second.applied, 0);
    assert_eq!(second.skipped, 0);
    assert!(second.invalidation_set.is_empty());
    assert_eq!(g.epoch(), epoch_after_first, "duplicate must apply nothing");
    assert_eq!(g.edge_count(), edge_count_after_first);
    assert_eq!(g.node_count(), 2);
}

#[test]
fn remove_node_tombstone_is_a_record_not_an_erase_only() {
    let mut g = Graph::new();
    g.put_node(node("a")).unwrap();
    g.put_node(node("b")).unwrap();
    g.put_edge(Edge::new("ab", "a", "depends_on", "b")).unwrap();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-rm", "web-feed").remove_node("a", "stale fact", 1700000000);
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    // Graph removal is a hard remove for the node and its incident edges...
    assert!(g.node("a").is_none());
    assert!(g.edge("ab").is_none());
    assert_eq!(g.node_count(), 1);
    // ...but the change set result carries the tombstone record.
    assert_eq!(
        r.tombstones,
        vec![Tombstone {
            entity_id: "a".into(),
            reason: "stale fact".into(),
            ts: 1700000000
        }]
    );
    assert_eq!(r.applied, 1);
    assert!(r.invalidation_set.contains("a"));
    assert!(
        r.invalidation_set.contains("ab"),
        "removed incident edge is invalidated"
    );
    assert!(
        r.invalidation_set.contains("b"),
        "neighbor index rebuild is invalidated"
    );
    assert!(ledger.contains("cs-rm"));
}

#[test]
fn remove_node_of_missing_entity_skips_but_still_records_tombstone() {
    let mut g = Graph::new();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-rm-ghost", "web-feed").remove_node(
        "ghost",
        "already gone",
        1700000001,
    );
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(r.applied, 0);
    assert_eq!(r.skipped, 1);
    assert_eq!(r.tombstones.len(), 1);
    assert_eq!(r.tombstones[0].entity_id, "ghost");
}

#[test]
fn remove_edge_tombstone() {
    let mut g = Graph::new();
    g.put_node(node("a")).unwrap();
    g.put_node(node("b")).unwrap();
    g.put_edge(Edge::new("ab", "a", "depends_on", "b")).unwrap();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-rm-e", "web-feed").remove_edge(
        "ab",
        "relation withdrawn",
        1700000002,
    );
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    assert!(g.edge("ab").is_none());
    assert!(g.node("a").is_some() && g.node("b").is_some());
    assert_eq!(
        r.tombstones,
        vec![Tombstone {
            entity_id: "ab".into(),
            reason: "relation withdrawn".into(),
            ts: 1700000002
        }]
    );
    assert_eq!(r.applied, 1);
    assert_eq!(
        r.invalidation_set,
        ["ab", "a", "b"].into_iter().map(str::to_owned).collect()
    );
}

#[test]
fn merge_moves_duplicate_edges_onto_canonical_then_tombstones() {
    let mut g = Graph::new();
    for id in ["dup", "canon", "other"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("d-o", "dup", "mentions", "other"))
        .unwrap();
    g.put_edge(Edge::new("o-d", "other", "mentions", "dup"))
        .unwrap();
    g.put_edge(Edge::new("c-o", "canon", "mentions", "other"))
        .unwrap();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-merge", "dedup-job").merge(
        "dup",
        "canon",
        "duplicate entity",
        1700000003,
    );
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(r.applied, 1);
    assert!(
        g.node("dup").is_none(),
        "duplicate is removed from the graph"
    );
    assert!(g.node("canon").is_some());
    assert!(g.node("other").is_some());
    // Edges were moved, not dropped.
    assert_eq!(g.edge("d-o").unwrap().from, "canon");
    assert_eq!(g.edge("o-d").unwrap().to, "canon");
    assert!(g.edge("c-o").is_some());
    assert_eq!(g.edge_count(), 3);
    g.check_indexes().unwrap();
    assert_eq!(
        r.tombstones,
        vec![Tombstone {
            entity_id: "dup".into(),
            reason: "duplicate entity".into(),
            ts: 1700000003
        }]
    );
    assert_eq!(
        r.invalidation_set,
        ["dup", "canon", "d-o", "o-d", "other"]
            .into_iter()
            .map(str::to_owned)
            .collect()
    );
}

#[test]
fn merge_rejects_missing_or_identical_nodes() {
    let mut g = Graph::new();
    g.put_node(node("a")).unwrap();
    let mut ledger = ApplyLedger::new();
    let bad = GraphChangeSet::new("cs-bad-merge", "job").merge("a", "missing", "r", 1);
    assert!(apply(&mut g, &bad, &mut ledger).is_err());
    assert!(
        !ledger.contains("cs-bad-merge"),
        "failed apply must not be recorded"
    );
    let self_merge = GraphChangeSet::new("cs-self-merge", "job").merge("a", "a", "r", 1);
    assert!(apply(&mut g, &self_merge, &mut ledger).is_err());
}

#[test]
fn split_creates_new_node_and_rewires_stated_edge_subset() {
    let mut g = Graph::new();
    for id in ["s", "x", "y", "z"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("sx", "s", "relates", "x")).unwrap();
    g.put_edge(Edge::new("ys", "y", "relates", "s")).unwrap();
    g.put_edge(Edge::new("sz", "s", "relates", "z")).unwrap();
    let mut ledger = ApplyLedger::new();
    let cs = GraphChangeSet::new("cs-split", "refine-job").split(
        "s",
        node("s2"),
        vec!["sx".to_owned(), "ys".to_owned()],
        1700000004,
    );
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(r.applied, 1);
    assert!(g.node("s").is_some(), "source survives a split");
    assert!(g.node("s2").is_some(), "split creates the new node");
    // Stated subset was rewired.
    assert_eq!(g.edge("sx").unwrap().from, "s2");
    assert_eq!(g.edge("ys").unwrap().to, "s2");
    // Non-stated edge was left alone.
    assert_eq!(g.edge("sz").unwrap().from, "s");
    g.check_indexes().unwrap();
    assert!(r.tombstones.is_empty(), "split removes nothing");
    assert_eq!(
        r.invalidation_set,
        ["s", "s2", "sx", "ys", "x", "y"]
            .into_iter()
            .map(str::to_owned)
            .collect()
    );
}

#[test]
fn split_rejects_unknown_edges_and_existing_target() {
    let mut g = Graph::new();
    g.put_node(node("s")).unwrap();
    g.put_node(node("x")).unwrap();
    g.put_edge(Edge::new("sx", "s", "relates", "x")).unwrap();
    let mut ledger = ApplyLedger::new();
    // Edge not incident to the source.
    g.put_node(node("p")).unwrap();
    g.put_node(node("q")).unwrap();
    g.put_edge(Edge::new("pq", "p", "relates", "q")).unwrap();
    let target = node("t");
    let unrelated = GraphChangeSet::new("cs-bad-split-1", "job").split(
        "s",
        target.clone(),
        vec!["pq".to_owned()],
        1,
    );
    assert!(apply(&mut g, &unrelated, &mut ledger).is_err());
    // Unknown edge id.
    let unknown = GraphChangeSet::new("cs-bad-split-2", "job").split(
        "s",
        target.clone(),
        vec!["nope".to_owned()],
        1,
    );
    assert!(apply(&mut g, &unknown, &mut ledger).is_err());
    // Target already exists.
    let existing = GraphChangeSet::new("cs-bad-split-3", "job").split(
        "s",
        node("x"),
        vec!["sx".to_owned()],
        1,
    );
    assert!(apply(&mut g, &existing, &mut ledger).is_err());
    assert!(!ledger.contains("cs-bad-split-1"));
    assert!(!ledger.contains("cs-bad-split-2"));
    assert!(!ledger.contains("cs-bad-split-3"));
}

#[test]
fn failed_op_returns_err_and_is_not_recorded_in_ledger() {
    let mut g = Graph::new();
    g.put_node(node("a")).unwrap();
    let mut ledger = ApplyLedger::new();
    // Edge endpoint "b" does not exist yet.
    let cs =
        GraphChangeSet::new("cs-err", "web-feed").put_edge(Edge::new("ab", "a", "depends_on", "b"));
    let err = apply(&mut g, &cs, &mut ledger).unwrap_err();
    assert!(
        err.to_string().contains("cs-err"),
        "error names the change set: {err}"
    );
    assert!(
        !ledger.contains("cs-err"),
        "failed apply must stay re-appliable"
    );
    // Repair the graph, then the same change set applies cleanly.
    g.put_node(node("b")).unwrap();
    let r = apply(&mut g, &cs, &mut ledger).unwrap();
    assert_eq!(r.applied, 1);
    assert!(g.edge("ab").is_some());
}

#[test]
fn lineage_chain_walks_parents_and_rejects_cycles() {
    let cs1 = GraphChangeSet::new("cs-1", "src");
    let cs2 = GraphChangeSet::new("cs-2", "src").parent("cs-1");
    let cs3 = GraphChangeSet::new("cs-3", "src").parent("cs-2");
    let sets = vec![cs1, cs2, cs3];
    assert_eq!(
        lineage_chain(&sets, "cs-3").unwrap(),
        vec!["cs-3", "cs-2", "cs-1"]
    );
    assert_eq!(lineage_depth(&sets, "cs-3").unwrap(), 3);
    assert_eq!(lineage_chain(&sets, "cs-1").unwrap(), vec!["cs-1"]);
    assert_eq!(lineage_depth(&sets, "cs-1").unwrap(), 1);
    // Missing parent fails closed.
    assert!(lineage_chain(&sets, "nope").is_err());
    let orphan = GraphChangeSet::new("cs-x", "src").parent("cs-missing");
    let with_orphan: Vec<GraphChangeSet> = sets.into_iter().chain([orphan]).collect();
    assert!(lineage_chain(&with_orphan, "cs-x").is_err());
}

#[test]
fn lineage_cycle_rejected() {
    let a = GraphChangeSet::new("cs-a", "src").parent("cs-b");
    let b = GraphChangeSet::new("cs-b", "src").parent("cs-a");
    let sets = vec![a, b];
    let err = lineage_chain(&sets, "cs-a").unwrap_err();
    assert!(
        err.to_string().to_lowercase().contains("cycle"),
        "cycle error: {err}"
    );
    // A self-parent is also a cycle.
    let self_loop = [GraphChangeSet::new("cs-s", "src").parent("cs-s")];
    assert!(lineage_chain(&self_loop, "cs-s").is_err());
}

#[test]
fn change_ops_are_constructible_directly() {
    // The op enum is public data, not just builder calls.
    let cs = GraphChangeSet {
        change_set_id: "cs-raw".into(),
        parent_change_set_id: Some("cs-0".into()),
        source: "manual".into(),
        ops: vec![
            ChangeOp::PutNode(node("n1")),
            ChangeOp::RemoveEdge {
                entity_id: "e1".into(),
                reason: "gone".into(),
                ts: 7,
            },
        ],
    };
    assert_eq!(cs.parent_change_set_id.as_deref(), Some("cs-0"));
    assert_eq!(cs.ops.len(), 2);
}

#[test]
fn replacing_dependency_invalidates_old_and_new_adjacencies_only() {
    let mut g = Graph::new();
    for id in ["old-a", "old-b", "new-a", "new-b", "unrelated"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("dependency", "old-a", "imports", "old-b")).unwrap();
    let mut ledger = ApplyLedger::new();
    let report = apply(&mut g, &GraphChangeSet::new("move", "source")
        .put_edge(Edge::new("dependency", "new-a", "imports", "new-b")), &mut ledger).unwrap();
    assert_eq!(report.invalidation_set, ["dependency", "old-a", "old-b", "new-a", "new-b"]
        .into_iter().map(str::to_owned).collect());
    assert!(g.outgoing("old-a", Some("imports")).unwrap().is_empty());
    assert!(g.incoming("old-b", Some("imports")).unwrap().is_empty());
    assert_eq!(g.outgoing("new-a", Some("imports")).unwrap()[0].to, "new-b");
    g.check_indexes().unwrap();
}

#[test]
fn merging_self_loop_reindexes_once_and_preserves_dependency() {
    let mut g = Graph::new();
    for id in ["old", "canonical"] { g.put_node(node(id)).unwrap(); }
    g.put_edge(Edge::new("loop", "old", "imports", "old")).unwrap();
    let before = g.epoch();
    let mut ledger = ApplyLedger::new();
    let report = apply(&mut g, &GraphChangeSet::new("merge-loop", "source")
        .merge("old", "canonical", "identity reconciled", 1), &mut ledger).unwrap();
    assert_eq!(g.epoch(), before + 2);
    assert_eq!(g.edge("loop").unwrap().from, "canonical");
    assert_eq!(g.edge("loop").unwrap().to, "canonical");
    assert_eq!(report.invalidation_set, ["old", "canonical", "loop"]
        .into_iter().map(str::to_owned).collect());
    g.check_indexes().unwrap();
}
