//! OVN-B lane 3: entity reconciliation, orphan/duplicate detection, federation.
//!
//! Detection proposes (exact signals only), the W4 change-set module applies.
//! End-to-end cycle: detect -> plan -> apply -> assert merged -> re-detect nothing.
//!
//! @hq:context reconciliation tests for HQKG (OVN-B lane 3)
//! @hq:owner hq-agent
//! @hq:task OVN-B lane 3 (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md)
use hqkg::graph_change_set::{apply, ApplyLedger};
use hqkg::reconcile::{find_duplicates, find_orphans, reconciliation_plan, DuplicateSignal};
use hqkg::{Edge, Graph, Node, NodeKind};

fn node(id: &str, kind: NodeKind, title: &str) -> Node {
    Node::new(id, kind, title)
}

#[test]
fn find_duplicates_flags_same_normalized_title() {
    let mut g = Graph::new();
    g.put_node(node("doc:1", NodeKind::Document, "Rust Core"))
        .unwrap();
    // Same normalized title (trim + lowercase), different id.
    g.put_node(node("doc:2", NodeKind::Document, "  rust CORE "))
        .unwrap();
    // Control: a distinct node must not be flagged.
    g.put_node(node("doc:3", NodeKind::Document, "Index Layer"))
        .unwrap();

    let dups = find_duplicates(&g);
    assert_eq!(dups.len(), 1, "expected exactly one candidate: {dups:?}");
    let c = &dups[0];
    assert_eq!(
        (c.id_a.as_str(), c.id_b.as_str()),
        ("doc:1", "doc:2"),
        "pairs must be ordered by id"
    );
    assert!(
        c.signals.iter().any(|s| matches!(s, DuplicateSignal::TitleMatch { normalized_title } if normalized_title == "rust core")),
        "title signal must cite its value: {:?}",
        c.signals
    );
}

#[test]
fn find_duplicates_cites_identical_property_key_sets() {
    let mut g = Graph::new();
    g.put_node(
        node("n:1", NodeKind::Fact, "Alpha")
            .property("lang", "rust")
            .property("owner", "hq"),
    )
    .unwrap();
    g.put_node(
        node("n:2", NodeKind::Fact, "Totally Different")
            .property("owner", "x")
            .property("lang", "y"),
    )
    .unwrap();

    let dups = find_duplicates(&g);
    assert_eq!(dups.len(), 1, "expected one candidate: {dups:?}");
    assert!(
        dups[0].signals.iter().any(
            |s| matches!(s, DuplicateSignal::PropertyKeySetMatch { keys }
            if keys == &vec!["lang".to_string(), "owner".to_string()])
        ),
        "property-key signal must cite the shared key set: {:?}",
        dups[0].signals
    );
}

#[test]
fn find_duplicates_shared_neighbor_signal_with_threshold() {
    let mut g = Graph::new();
    for id in ["h:1", "h:2", "a", "b", "c"] {
        g.put_node(node(id, NodeKind::Fact, id)).unwrap();
    }
    // a and b share TWO neighbors (h:1, h:2) -> candidate.
    g.put_edge(Edge::new("e:a-h1", "a", "mentions", "h:1"))
        .unwrap();
    g.put_edge(Edge::new("e:a-h2", "a", "mentions", "h:2"))
        .unwrap();
    g.put_edge(Edge::new("e:b-h1", "b", "mentions", "h:1"))
        .unwrap();
    g.put_edge(Edge::new("e:b-h2", "b", "mentions", "h:2"))
        .unwrap();
    // c shares only ONE neighbor with a -> below threshold, no candidate.
    g.put_edge(Edge::new("e:c-h1", "c", "mentions", "h:1"))
        .unwrap();

    let dups = find_duplicates(&g);
    // The hubs h:1 and h:2 also share neighbors a and b, so that pair
    // legitimately fires too; what must hold is that "a" pairs only with "b"
    // (c shares a single neighbor, below threshold) and the signal cites its count.
    let with_a: Vec<_> = dups
        .iter()
        .filter(|c| c.id_a == "a" || c.id_b == "a")
        .collect();
    assert_eq!(with_a.len(), 1, "only (a,b) may involve 'a': {dups:?}");
    assert_eq!(
        (with_a[0].id_a.as_str(), with_a[0].id_b.as_str()),
        ("a", "b")
    );
    assert!(
        with_a[0]
            .signals
            .iter()
            .any(|s| matches!(s, DuplicateSignal::SharedNeighbors { count } if *count >= 2)),
        "shared-neighbor signal must cite its count: {:?}",
        with_a[0].signals
    );
    assert!(
        !dups
            .iter()
            .any(|c| (c.id_a == "a" && c.id_b == "c") || (c.id_a == "c" && c.id_b == "a")),
        "single shared neighbor must not fire: {dups:?}"
    );
}

#[test]
fn find_orphans_zero_incident_edges_with_allowlist() {
    let mut g = Graph::new();
    g.put_node(node("fact:lonely", NodeKind::Fact, "Lonely Fact"))
        .unwrap();
    g.put_node(node("slot:1", NodeKind::EngineSlot, "compute-slot"))
        .unwrap();
    g.put_node(node("doc:linked", NodeKind::Document, "Linked"))
        .unwrap();
    g.put_node(node("doc:other", NodeKind::Document, "Other"))
        .unwrap();
    g.put_edge(Edge::new("e:link", "doc:linked", "cites", "doc:other"))
        .unwrap();

    let allow = &[NodeKind::EngineSlot];
    let orphans = find_orphans(&g, allow);
    assert_eq!(
        orphans,
        vec!["fact:lonely".to_string()],
        "allowlisted kinds are excluded, linked nodes are not orphans"
    );
    // Empty allowlist: both standalone nodes are orphans.
    let all = find_orphans(&g, &[]);
    assert_eq!(all, vec!["fact:lonely".to_string(), "slot:1".to_string()]);
}

#[test]
fn plan_winner_rule_highest_version_then_lowest_id() {
    // node:b is put twice -> version 2 -> canonical despite larger id.
    let mut g = Graph::new();
    g.put_node(node("node:a", NodeKind::Concept, "Dup Entity"))
        .unwrap();
    g.put_node(node("node:b", NodeKind::Concept, "Dup Entity"))
        .unwrap();
    g.put_node(node("node:b", NodeKind::Concept, "Dup Entity"))
        .unwrap();
    let dups = find_duplicates(&g);
    assert_eq!(dups.len(), 1);
    let plan = reconciliation_plan(&g, &dups).unwrap();
    let merges: Vec<(&str, &str)> = plan
        .ops
        .iter()
        .filter_map(|op| match op {
            hqkg::graph_change_set::ChangeOp::MergeNodes {
                duplicate_id,
                canonical_id,
                ..
            } => Some((duplicate_id.as_str(), canonical_id.as_str())),
            _ => None,
        })
        .collect();
    assert_eq!(
        merges,
        vec![("node:a", "node:b")],
        "highest version wins the canonical role"
    );

    // Tie on version -> lexicographically smallest id is canonical.
    let mut g2 = Graph::new();
    g2.put_node(node("z-node", NodeKind::Concept, "Tied Entity"))
        .unwrap();
    g2.put_node(node("a-node", NodeKind::Concept, "Tied Entity"))
        .unwrap();
    let plan2 = reconciliation_plan(&g2, &find_duplicates(&g2)).unwrap();
    let merges2: Vec<(&str, &str)> = plan2
        .ops
        .iter()
        .filter_map(|op| match op {
            hqkg::graph_change_set::ChangeOp::MergeNodes {
                duplicate_id,
                canonical_id,
                ..
            } => Some((duplicate_id.as_str(), canonical_id.as_str())),
            _ => None,
        })
        .collect();
    assert_eq!(
        merges2,
        vec![("z-node", "a-node")],
        "tie broken by id ordering"
    );
}

#[test]
fn plan_composes_and_applies_cleanly_end_to_end() {
    let mut g = Graph::new();
    g.put_node(node("doc:rust-core", NodeKind::Document, "Rust Core"))
        .unwrap();
    g.put_node(node("doc:rust-core-dup", NodeKind::Document, "rust CORE"))
        .unwrap();
    g.put_node(node("impl:kg", NodeKind::Fact, "KG engine"))
        .unwrap();
    g.put_node(node("impl:idx", NodeKind::Fact, "Indexer"))
        .unwrap();
    g.put_node(node("person:1", NodeKind::Fact, "Author"))
        .unwrap();
    g.put_edge(Edge::new("e:1", "doc:rust-core", "implements", "impl:kg"))
        .unwrap();
    g.put_edge(Edge::new("e:2", "doc:rust-core", "implements", "impl:idx"))
        .unwrap();
    g.put_edge(Edge::new(
        "e:3",
        "person:1",
        "authored",
        "doc:rust-core-dup",
    ))
    .unwrap();

    // Orphan detection is independent of the merge plan.
    assert_eq!(find_orphans(&g, &[]), Vec::<String>::new());

    let dups = find_duplicates(&g);
    assert_eq!(dups.len(), 1);
    let plan = reconciliation_plan(&g, &dups).unwrap();

    // Federation-ready shape: local source, parentless lineage.
    assert_eq!(plan.source, "reconcile://local");
    assert_eq!(plan.parent_change_set_id, None);

    let mut ledger = ApplyLedger::new();
    let report = apply(&mut g, &plan, &mut ledger).unwrap();
    assert_eq!(report.applied, 1, "one MergeNodes op applied");
    assert_eq!(report.skipped, 0, "zero Err-worthy ops; nothing skipped");
    assert!(report
        .tombstones
        .iter()
        .any(|t| t.entity_id == "doc:rust-core-dup"));

    // Merged: duplicate gone, canonical owns every edge from both sides.
    assert!(g.node("doc:rust-core-dup").is_none());
    assert_eq!(g.outgoing("doc:rust-core", None).unwrap().len(), 2);
    assert!(g
        .incoming("doc:rust-core", None)
        .unwrap()
        .iter()
        .any(|e| e.from == "person:1"));
    g.check_indexes().unwrap();

    // Idempotent through the W4 ledger.
    let again = apply(&mut g, &plan, &mut ledger).unwrap();
    assert!(again.duplicate);

    // Convergence: re-detection finds nothing.
    assert!(
        find_duplicates(&g).is_empty(),
        "post-merge re-detection must be clean"
    );
}

#[test]
fn plan_skips_stale_candidates_and_empty_plan_is_valid() {
    let mut g = Graph::new();
    g.put_node(node("solo", NodeKind::Fact, "Solo")).unwrap();
    // Candidate referencing nodes absent from the graph is skipped, not an Err.
    let plan = reconciliation_plan(&g, &[]).unwrap();
    assert_eq!(plan.ops.len(), 0);
    let mut ledger = ApplyLedger::new();
    let report = apply(&mut g, &plan, &mut ledger).unwrap();
    assert_eq!(report.applied, 0);
}
