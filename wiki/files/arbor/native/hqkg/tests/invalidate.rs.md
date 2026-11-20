# File: native/hqkg/tests/invalidate.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/invalidate.rs |
| Language | Rust |
| Kind | source |
| Size | 13821 B |
| Lines | 356 |
| Hash | fc769090bd21 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| node | function | 13 | no | fn node(id: &amp;str) -&gt; Node { |
| request | function | 17 | no | fn request(seeds: &amp;[&amp;str], budget: u64) -&gt; ContextRequest { |
| chain | function | 26 | no | fn chain() -&gt; Graph { |
| watermark_from | function | 40 | no | fn watermark_from(bundle: &amp;ContextBundle) -&gt; BTreeMap&lt;String, u64&gt; { |
| fill | function | 50 | no | fn fill( cache: &amp;mut InvalidateCache, g: &amp;Graph, req: &amp;ContextRequest, ) -&gt; (ContextBundle, BTreeMap&lt;String, u64&gt;) { |
| hit_on_unchanged_epoch_and_versions | function | 62 | no | fn hit_on_unchanged_epoch_and_versions() { |
| any_single_touched_version_bump_misses_and_drops | function | 72 | no | fn any_single_touched_version_bump_misses_and_drops() { |
| epoch_bump_without_node_version_change_misses | function | 88 | no | fn epoch_bump_without_node_version_change_misses() { |
| lru_eviction_order_per_level_exact | function | 106 | no | fn lru_eviction_order_per_level_exact() { |
| hit_refreshes_lru_recency | function | 133 | no | fn hit_refreshes_lru_recency() { |
| lru_eviction_seed_level | function | 159 | no | fn lru_eviction_seed_level() { |
| fingerprint_is_order_independent | function | 173 | no | fn fingerprint_is_order_independent() { |
| entity_invalidation_drops_only_affected_entries | function | 201 | no | fn entity_invalidation_drops_only_affected_entries() { |
| stale_watermark_mismatch_is_miss_with_entry_dropped | function | 253 | no | fn stale_watermark_mismatch_is_miss_with_entry_dropped() { |
| watermark_must_cover_every_touched_node | function | 285 | no | fn watermark_must_cover_every_touched_node() { |
| seed_level_contribution_reused_across_different_full_requests | function | 303 | no | fn seed_level_contribution_reused_across_different_full_requests() { |
| invalidate_epoch_drops_everything_below_new_epoch | function | 337 | no | fn invalidate_epoch_drops_everything_below_new_epoch() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest} | use | 8 | external |
| hqkg::invalidate::InvalidateCache | use | 9 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 10 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 11 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 357 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
