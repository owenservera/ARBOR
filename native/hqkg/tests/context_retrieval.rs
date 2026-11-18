//! OVN-B lane 4: Oracle dynamic context retrieval with provenance and token bounds.
//! Matrix: fail-closed requests, bounded BFS, exclusion pruning, deterministic rank
//! order, hard token budget (prefix, never truncated mid-item), provenance from
//! node.sources, watermark staleness with both versions recorded, determinism.
use hqkg::context_retrieval::{retrieve, ContextRequest};
use hqkg::{Edge, Graph, Node, NodeKind};
use std::collections::{BTreeMap, BTreeSet};

fn node(id: &str) -> Node {
    Node::new(id, NodeKind::Concept, id)
}

fn request(seeds: &[&str], budget: u64) -> ContextRequest {
    ContextRequest {
        seeds: seeds.iter().map(|s| s.to_string()).collect(),
        budget_tokens: budget,
        excluded: BTreeSet::new(),
        watermark: None,
    }
}

fn chain() -> Graph {
    // a - b - c - d - e via "relates" edges.
    let mut g = Graph::new();
    for id in ["a", "b", "c", "d", "e"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("e1", "a", "relates", "b")).unwrap();
    g.put_edge(Edge::new("e2", "b", "relates", "c")).unwrap();
    g.put_edge(Edge::new("e3", "c", "relates", "d")).unwrap();
    g.put_edge(Edge::new("e4", "d", "relates", "e")).unwrap();
    g
}

#[test]
fn unknown_seed_fails_closed() {
    let g = chain();
    let err = retrieve(&g, &request(&["a", "ghost"], 100)).unwrap_err();
    assert!(
        matches!(err, hqkg::Error::Missing(ref id) if id == "ghost"),
        "{err}"
    );
}

#[test]
fn empty_seeds_fail_closed() {
    let g = chain();
    let err = retrieve(&g, &request(&[], 100)).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn zero_budget_fails_closed() {
    let g = chain();
    let err = retrieve(&g, &request(&["a"], 0)).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn seed_also_excluded_fails_closed() {
    let g = chain();
    let mut req = request(&["a"], 100);
    req.excluded.insert("a".into());
    let err = retrieve(&g, &req).unwrap_err();
    assert!(matches!(err, hqkg::Error::Invalid(_)), "{err}");
}

#[test]
fn bfs_is_depth_bounded() {
    let g = chain();
    let bundle = retrieve(&g, &request(&["a"], 10_000)).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    // Depth cap 3: a(0) b(1) c(2) d(3) reachable; e at depth 4 is not.
    assert_eq!(ids, ["a", "b", "c", "d"]);
    assert_eq!(bundle.items[0].depth, 0);
    assert_eq!(bundle.items[3].depth, 3);
    // Incident edges between retrieved nodes ride along.
    assert_eq!(bundle.edges.len(), 3);
}

#[test]
fn exclusion_prunes_subtree() {
    let g = chain();
    let mut req = request(&["a"], 10_000);
    req.excluded.insert("b".into());
    let bundle = retrieve(&g, &req).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    // b is excluded and its subtree beyond it is unreachable; only the seed remains.
    assert_eq!(ids, ["a"]);
    assert!(bundle.edges.is_empty());
}

#[test]
fn excluded_node_is_never_an_edge_endpoint() {
    // a - x - b where x is excluded: the a-x and x-b edges must not leak in.
    let mut g = Graph::new();
    for id in ["a", "x", "b"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("ax", "a", "relates", "x")).unwrap();
    g.put_edge(Edge::new("xb", "x", "relates", "b")).unwrap();
    let mut req = request(&["a"], 10_000);
    req.excluded.insert("x".into());
    let bundle = retrieve(&g, &req).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids, ["a"]);
    assert!(bundle.edges.is_empty());
}

fn ranked_graph() -> Graph {
    // s is the seed; alpha/beta/gamma are all depth 1. Versions decide ties:
    // beta(7) and gamma(7) outrank alpha(5); beta < gamma by id.
    let mut g = Graph::new();
    g.put_node(node("s")).unwrap();
    g.put_node(node("alpha")).unwrap();
    g.put_node(node("beta")).unwrap();
    g.put_node(node("gamma")).unwrap();
    // Re-put to drive versions up deterministically.
    for id in ["alpha", "alpha", "alpha", "alpha"] {
        let mut n = node(id);
        n.title = "alpha".into();
        g.put_node(n).unwrap();
    }
    for id in ["beta", "beta", "beta", "beta", "beta", "beta"] {
        let mut n = node(id);
        n.title = "beta".into();
        g.put_node(n).unwrap();
    }
    for id in ["gamma", "gamma", "gamma", "gamma", "gamma", "gamma"] {
        let mut n = node(id);
        n.title = "gamma".into();
        g.put_node(n).unwrap();
    }
    g.put_edge(Edge::new("s-alpha", "s", "relates", "alpha"))
        .unwrap();
    g.put_edge(Edge::new("s-beta", "s", "relates", "beta"))
        .unwrap();
    g.put_edge(Edge::new("s-gamma", "s", "relates", "gamma"))
        .unwrap();
    g
}

#[test]
fn rank_order_is_depth_then_version_desc_then_id() {
    let g = ranked_graph();
    let bundle = retrieve(&g, &request(&["s"], 10_000)).unwrap();
    let order: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(order, ["s", "beta", "gamma", "alpha"]);
    assert_eq!(bundle.items[1].version, 7);
    assert_eq!(bundle.items[2].version, 7);
    assert_eq!(bundle.items[3].version, 5);
}

#[test]
fn multi_seed_depth_is_nearest_seed() {
    let g = chain();
    let bundle = retrieve(&g, &request(&["a", "e"], 10_000)).unwrap();
    let depth_of = |id: &str| bundle.items.iter().find(|i| i.id == id).unwrap().depth;
    assert_eq!(depth_of("a"), 0);
    assert_eq!(depth_of("e"), 0);
    assert_eq!(depth_of("c"), 2);
    // Both seeds land in the same depth-0 rank tier, ordered by id asc.
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids.first(), Some(&"a"));
}

#[test]
fn token_budget_is_a_hard_prefix_bound() {
    // Each node: title 16 bytes + id 1 byte = 17 bytes -> (17+0)/4 = 4 tokens.
    let mut g = Graph::new();
    for id in ["s", "n1", "n2", "n3"] {
        let mut n = node(id);
        n.title = "0123456789abcdef".into();
        g.put_node(n).unwrap();
    }
    for (eid, to) in [("l1", "n1"), ("l2", "n2"), ("l3", "n3")] {
        g.put_edge(Edge::new(eid, "s", "relates", to)).unwrap();
    }
    // Budget 9: s(4) + n1(4) = 8; n2 would reach 12 > 9 -> dropped, not split.
    let bundle = retrieve(&g, &request(&["s"], 9)).unwrap();
    let ids: Vec<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(ids, ["s", "n1"]);
    assert_eq!(bundle.tokens_used, 8);
    assert!(bundle.budget_exhausted);
    // The included items are exactly a prefix of the full ranked list.
    let full = retrieve(&g, &request(&["s"], 10_000)).unwrap();
    let full_ids: Vec<&str> = full.items.iter().map(|i| i.id.as_str()).collect();
    assert_eq!(full_ids, ["s", "n1", "n2", "n3"]);
    for (kept, ranked) in bundle.items.iter().zip(full.items.iter()) {
        assert_eq!(kept.id, ranked.id);
    }
}

#[test]
fn exact_fit_is_not_budget_exhausted() {
    let mut g = Graph::new();
    for id in ["s", "n1"] {
        let mut n = node(id);
        n.title = "0123456789abcdef".into(); // 4 tokens each
        g.put_node(n).unwrap();
    }
    g.put_edge(Edge::new("l1", "s", "relates", "n1")).unwrap();
    let bundle = retrieve(&g, &request(&["s"], 8)).unwrap();
    assert_eq!(bundle.tokens_used, 8);
    assert!(!bundle.budget_exhausted);
}

#[test]
fn minimum_token_estimate_is_one() {
    // Tiny node: 1-byte id + 1-byte title = 2 bytes -> max(0, 1) = 1 token.
    let g = chain();
    let bundle = retrieve(&g, &request(&["a"], 10_000)).unwrap();
    assert!(bundle.items.iter().all(|i| i.tokens >= 1));
}

#[test]
fn provenance_populated_from_sources_and_version() {
    let mut g = chain();
    let mut cited = node("b");
    cited.title = "b".into();
    cited = cited.source("doc:AF-020").source("decision:DEC-014");
    g.put_node(cited).unwrap();
    let mut uncited = node("c");
    uncited.title = "c".into();
    g.put_node(uncited).unwrap();
    let bundle = retrieve(&g, &request(&["a"], 10_000)).unwrap();
    let b = bundle.items.iter().find(|i| i.id == "b").unwrap();
    assert_eq!(
        b.sources.iter().map(|s| s.as_str()).collect::<Vec<_>>(),
        ["decision:DEC-014", "doc:AF-020"]
    );
    assert_eq!(b.version, 2);
    let c = bundle.items.iter().find(|i| i.id == "c").unwrap();
    // Empty provenance is recorded as empty, never invented.
    assert!(c.sources.is_empty());
    assert_eq!(c.version, 2);
    assert_eq!(bundle.epoch, g.epoch());
}

#[test]
fn watermark_staleness_records_both_versions() {
    let mut g = chain();
    let mut b = node("b");
    b.title = "b".into();
    g.put_node(b).unwrap(); // b.version = 2
    let mut req = request(&["a"], 10_000);
    let mut mark = BTreeMap::new();
    mark.insert("b".to_string(), 1u64); // caller saw version 1, graph is at 2
    mark.insert("c".to_string(), 1u64); // matches current (chain() put c once) -> not stale
    req.watermark = Some(mark);
    let bundle = retrieve(&g, &req).unwrap();
    let b = bundle.items.iter().find(|i| i.id == "b").unwrap();
    assert!(b.stale);
    assert_eq!(b.watermark_version, Some(1));
    assert_eq!(b.version, 2);
    let c = bundle.items.iter().find(|i| i.id == "c").unwrap();
    assert!(!c.stale);
    assert_eq!(c.watermark_version, Some(1));
    let a = bundle.items.iter().find(|i| i.id == "a").unwrap();
    assert!(!a.stale);
    assert_eq!(a.watermark_version, None);
    assert_eq!(bundle.stale_count, 1);
}

#[test]
fn retrieval_is_deterministic_across_calls() {
    let g = ranked_graph();
    let req = request(&["s"], 10_000);
    let first = retrieve(&g, &req).unwrap();
    let second = retrieve(&g, &req).unwrap();
    assert_eq!(first, second);
}

#[test]
fn indexed_edge_projection_matches_full_scan_for_bounded_and_excluded_views() {
    let mut g=chain();
    for i in 0..200 {
        let a=format!("unrelated-a-{i}");
        let b=format!("unrelated-b-{i}");
        g.put_node(node(&a)).unwrap();
        g.put_node(node(&b)).unwrap();
        g.put_edge(Edge::new(&format!("unrelated-edge-{i}"),&a,"relates",&b)).unwrap();
    }
    g.put_edge(Edge::new("z-back","c","relates","a")).unwrap();
    g.put_edge(Edge::new("a-parallel","a","other","b")).unwrap();
    for budget in [1,4,12,100] {
        for excluded in [BTreeSet::new(),BTreeSet::from(["b".to_string()])] {
            let mut req=request(&["a"],budget);
            req.excluded=excluded;
            let bundle=retrieve(&g,&req).unwrap();
            let selected:BTreeSet<&str>=bundle.items.iter().map(|item|item.id.as_str()).collect();
            let expected:Vec<&str>=g.edges()
                .filter(|edge|selected.contains(edge.from.as_str())&&selected.contains(edge.to.as_str()))
                .map(|edge|edge.id.as_str()).collect();
            let actual:Vec<&str>=bundle.edges.iter().map(|edge|edge.id.as_str()).collect();
            assert_eq!(actual,expected);
        }
    }
}
