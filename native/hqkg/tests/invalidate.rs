//! OVN-B lane 5: revision-safe multilevel LRU invalidation; no stale-hit
//! acceptance. Matrix: hit on unchanged epoch+versions, miss+drop after any
//! touched node version bump, miss after epoch bump with node versions intact,
//! per-level LRU eviction order and recency refresh, order-independent
//! fingerprint equivalence, entity invalidation scoped to affected entries,
//! stale-watermark mismatch = miss with entry dropped, seed-level reuse across
//! differing full requests, epoch invalidation dropping everything below.
use hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest};
use hqkg::invalidate::InvalidateCache;
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

/// The caller's last-seen view: every retrieved item's current version.
fn watermark_from(bundle: &ContextBundle) -> BTreeMap<String, u64> {
    bundle
        .items
        .iter()
        .map(|i| (i.id.clone(), i.version))
        .collect()
}

/// Store `req`'s fresh retrieval at the graph's current epoch and return the
/// bundle plus the caller watermark derived from it.
fn fill(
    cache: &mut InvalidateCache,
    g: &Graph,
    req: &ContextRequest,
) -> (ContextBundle, BTreeMap<String, u64>) {
    let bundle = retrieve(g, req).unwrap();
    let mark = watermark_from(&bundle);
    cache.store(g.epoch(), req, &bundle);
    (bundle, mark)
}

#[test]
fn hit_on_unchanged_epoch_and_versions() {
    let g = chain();
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let (bundle, mark) = fill(&mut cache, &g, &req);
    let hit = cache.lookup(g.epoch(), &mark, &req);
    assert_eq!(hit.unwrap(), bundle);
}

#[test]
fn any_single_touched_version_bump_misses_and_drops() {
    let mut g = chain();
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let (_bundle, mark) = fill(&mut cache, &g, &req);
    // Bump exactly one touched node ("d", deep in the horizon). This also
    // bumps the epoch, but the assertion is the miss + the entry being gone.
    let mut d = node("d");
    d.title = "d".into();
    g.put_node(d).unwrap();
    assert!(cache.lookup(g.epoch(), &mark, &req).is_none());
    // The invalid entry was dropped, not left behind.
    assert_eq!(cache.exact_len(), 0);
}

#[test]
fn epoch_bump_without_node_version_change_misses() {
    let mut g = chain();
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let (bundle, mark) = fill(&mut cache, &g, &req);
    // Rewrite one edge: epoch advances twice, no node version changes. This
    // isolates the epoch rule from the per-node version rule.
    g.remove_edge("e2").unwrap();
    g.put_edge(Edge::new("e2", "b", "relates", "c")).unwrap();
    assert!(cache.lookup(g.epoch(), &mark, &req).is_none());
    assert_eq!(cache.exact_len(), 0);
    // A fresh store at the new epoch hits again with the new bundle.
    let (fresh, mark2) = fill(&mut cache, &g, &req);
    assert_ne!(fresh.epoch, bundle.epoch);
    assert_eq!(cache.lookup(g.epoch(), &mark2, &req).unwrap(), fresh);
}

#[test]
fn lru_eviction_order_per_level_exact() {
    let g = chain();
    let mut cache = InvalidateCache::new(2);
    let (_first, mark1) = fill(&mut cache, &g, &request(&["a"], 10_000));
    let (second, mark2) = fill(&mut cache, &g, &request(&["b"], 10_000));
    assert_eq!(cache.exact_len(), 2);
    let (third, mark3) = fill(&mut cache, &g, &request(&["c"], 10_000));
    // Capacity 2: the oldest entry (seed a) was evicted.
    assert_eq!(cache.exact_len(), 2);
    assert!(cache
        .lookup(g.epoch(), &mark1, &request(&["a"], 10_000))
        .is_none());
    assert_eq!(
        cache
            .lookup(g.epoch(), &mark2, &request(&["b"], 10_000))
            .unwrap(),
        second
    );
    assert_eq!(
        cache
            .lookup(g.epoch(), &mark3, &request(&["c"], 10_000))
            .unwrap(),
        third
    );
}

#[test]
fn hit_refreshes_lru_recency() {
    let g = chain();
    let mut cache = InvalidateCache::new(2);
    let (first, mark1) = fill(&mut cache, &g, &request(&["a"], 10_000));
    let (_second, mark2) = fill(&mut cache, &g, &request(&["b"], 10_000));
    // Touch the oldest entry: it becomes most-recently used.
    assert_eq!(
        cache
            .lookup(g.epoch(), &mark1, &request(&["a"], 10_000))
            .unwrap(),
        first
    );
    // Inserting a third entry now evicts seed b, not seed a.
    fill(&mut cache, &g, &request(&["c"], 10_000));
    assert_eq!(
        cache
            .lookup(g.epoch(), &mark1, &request(&["a"], 10_000))
            .unwrap(),
        first
    );
    assert!(cache
        .lookup(g.epoch(), &mark2, &request(&["b"], 10_000))
        .is_none());
}

#[test]
fn lru_eviction_seed_level() {
    let g = chain();
    let mut cache = InvalidateCache::new(2);
    fill(&mut cache, &g, &request(&["a"], 10_000));
    fill(&mut cache, &g, &request(&["b"], 10_000));
    fill(&mut cache, &g, &request(&["c"], 10_000));
    // Seed level is capped independently: oldest seed index evicted.
    assert_eq!(cache.seed_len(), 2);
    let mark = watermark_from(&retrieve(&g, &request(&["c"], 10_000)).unwrap());
    assert!(cache.seed_state(g.epoch(), &mark, "a").is_none());
    assert!(cache.seed_state(g.epoch(), &mark, "c").is_some());
}

#[test]
fn fingerprint_is_order_independent() {
    let mut g = Graph::new();
    for id in ["a", "b", "x", "y"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("ab", "a", "relates", "b")).unwrap();
    g.put_edge(Edge::new("bx", "b", "relates", "x")).unwrap();
    let mut cache = InvalidateCache::new(8);
    let mut req = request(&["a", "b"], 10_000);
    req.excluded.insert("x".into());
    let (bundle, mark) = fill(&mut cache, &g, &req);
    // Same request, seeds and exclusions reshuffled: still a hit.
    let mut shuffled = ContextRequest {
        seeds: vec!["b".into(), "a".into()],
        budget_tokens: 10_000,
        excluded: BTreeSet::from(["x".into()]),
        watermark: None,
    };
    assert_eq!(cache.lookup(g.epoch(), &mark, &shuffled).unwrap(), bundle);
    // A different budget or exclusion set is a genuinely different request.
    shuffled.budget_tokens = 9_999;
    assert!(cache.lookup(g.epoch(), &mark, &shuffled).is_none());
    let mut other = request(&["a", "b"], 10_000);
    other.excluded.insert("y".into());
    assert!(cache.lookup(g.epoch(), &mark, &other).is_none());
}

#[test]
fn entity_invalidation_drops_only_affected_entries() {
    // Two disconnected components so bundles never share entities.
    let mut g = Graph::new();
    for id in ["a", "b", "z"] {
        g.put_node(node(id)).unwrap();
    }
    g.put_edge(Edge::new("ab", "a", "relates", "b")).unwrap();
    let mut cache = InvalidateCache::new(8);
    let (_left, left_mark) = fill(&mut cache, &g, &request(&["a"], 10_000));
    let (right, right_mark) = fill(&mut cache, &g, &request(&["z"], 10_000));
    // Invalidate an entity only the left bundle touched.
    cache.invalidate_entity("b");
    assert!(cache
        .lookup(g.epoch(), &left_mark, &request(&["a"], 10_000))
        .is_none());
    assert_eq!(
        cache
            .lookup(g.epoch(), &right_mark, &request(&["z"], 10_000))
            .unwrap(),
        right
    );
    // The ApplyReport.invalidation_set also carries edge ids; those invalidate
    // exactly the bundles that emitted the edge.
    let (left2, left2_mark) = fill(&mut cache, &g, &request(&["a"], 10_000));
    assert_eq!(
        cache
            .lookup(g.epoch(), &left2_mark, &request(&["a"], 10_000))
            .unwrap(),
        left2
    );
    cache.invalidate_entity("ab");
    assert!(cache
        .lookup(g.epoch(), &left2_mark, &request(&["a"], 10_000))
        .is_none());
    assert_eq!(
        cache
            .lookup(g.epoch(), &right_mark, &request(&["z"], 10_000))
            .unwrap(),
        right
    );
    // Invalidation of an unrelated entity disturbs nothing.
    let (left3, left3_mark) = fill(&mut cache, &g, &request(&["a"], 10_000));
    cache.invalidate_entity("ghost");
    assert_eq!(
        cache
            .lookup(g.epoch(), &left3_mark, &request(&["a"], 10_000))
            .unwrap(),
        left3
    );
}

#[test]
fn stale_watermark_mismatch_is_miss_with_entry_dropped() {
    let mut g = chain();
    let mut b = node("b");
    b.title = "b".into();
    g.put_node(b).unwrap(); // b is now at version 2
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let bundle = retrieve(&g, &req).unwrap();
    // A caller watermark that disagrees with the bundle's recorded reality
    // ("b" is at version 2 in the graph; the caller claims 1).
    let mut stale_mark = BTreeMap::new();
    for item in &bundle.items {
        stale_mark.insert(
            item.id.clone(),
            if item.id == "b" { 1 } else { item.version },
        );
    }
    assert_eq!(
        bundle.items.iter().find(|i| i.id == "b").unwrap().version,
        2
    );
    cache.store(g.epoch(), &req, &bundle);
    // No stale-hit acceptance: the view cannot be confirmed, so it is a miss
    // and the entry is dropped.
    assert!(cache.lookup(g.epoch(), &stale_mark, &req).is_none());
    assert_eq!(cache.exact_len(), 0);
    // The cache remains usable afterwards.
    let (fresh, fresh_mark) = fill(&mut cache, &g, &req);
    assert_eq!(cache.lookup(g.epoch(), &fresh_mark, &req).unwrap(), fresh);
}

#[test]
fn watermark_must_cover_every_touched_node() {
    // Fail-closed: a partial watermark has no confirmed view for the missing
    // entities, so it can never validate a hit.
    let g = chain();
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let (bundle, _full_mark) = fill(&mut cache, &g, &req);
    let mut partial = BTreeMap::new();
    partial.insert(
        "a".to_string(),
        bundle.items.iter().find(|i| i.id == "a").unwrap().version,
    );
    assert!(cache.lookup(g.epoch(), &partial, &req).is_none());
    // And an empty watermark (watermark-less caller) never hits.
    assert!(cache.lookup(g.epoch(), &BTreeMap::new(), &req).is_none());
}

#[test]
fn seed_level_contribution_reused_across_different_full_requests() {
    let g = chain();
    let mut cache = InvalidateCache::new(8);
    let (bundle, mark) = fill(&mut cache, &g, &request(&["a", "b"], 10_000));
    // A different full request (different budget) is an exact-level miss...
    let other = request(&["a", "b"], 5_000);
    assert!(cache.lookup(g.epoch(), &mark, &other).is_none());
    // ...but the seed-level contribution stays valid and is reusable.
    let a_state = cache
        .seed_state(g.epoch(), &mark, "a")
        .expect("seed a contribution");
    assert_eq!(
        a_state.get("a"),
        bundle
            .items
            .iter()
            .find(|i| i.id == "a")
            .map(|i| &i.version)
    );
    assert!(cache.seed_state(g.epoch(), &mark, "b").is_some());
    // Invalidation of an entity in the contribution kills the seed entries:
    // a joint [a,b] bundle is one shared contribution for both seeds.
    cache.invalidate_entity("c");
    assert!(cache.seed_state(g.epoch(), &mark, "a").is_none());
    assert!(cache.seed_state(g.epoch(), &mark, "b").is_none());
    // Refill seed b alone, then an unconfirmed view is a miss there too.
    let (_b2, m2) = fill(&mut cache, &g, &request(&["b"], 10_000));
    assert!(cache.seed_state(g.epoch(), &m2, "b").is_some());
    let mut stale = m2.clone();
    stale.insert("c".into(), 999); // c is inside b's contribution
    assert!(cache.seed_state(g.epoch(), &stale, "b").is_none());
}

#[test]
fn invalidate_epoch_drops_everything_below_new_epoch() {
    let mut g = chain();
    let mut cache = InvalidateCache::new(8);
    let req = request(&["a"], 10_000);
    let (_bundle, mark) = fill(&mut cache, &g, &req);
    // Dropping to the current epoch removes nothing (strictly-below rule).
    cache.invalidate_epoch(g.epoch());
    assert_eq!(cache.exact_len(), 1);
    // Advance the graph: everything below the new epoch is gone, both levels.
    g.put_edge(Edge::new("ze", "e", "relates", "a")).unwrap();
    cache.invalidate_epoch(g.epoch());
    assert_eq!(cache.exact_len(), 0);
    assert_eq!(cache.seed_len(), 0);
    assert!(cache.lookup(g.epoch(), &mark, &req).is_none());
    // An entry stored at the new epoch itself survives an invalidate_epoch
    // call at that same epoch.
    let (fresh, fresh_mark) = fill(&mut cache, &g, &req);
    cache.invalidate_epoch(g.epoch());
    assert_eq!(cache.lookup(g.epoch(), &fresh_mark, &req).unwrap(), fresh);
}
