//! OVN-B lane 5: revision-safe multilevel LRU invalidation above context
//! retrieval. Caches [`retrieve`] results keyed by an order-independent
//! request fingerprint and refuses every hit that cannot be proven current.
//!
//! # The validity rule (no stale-hit acceptance)
//!
//! A cached exact entry is served only when **both** hold:
//!
//! 1. `entry.epoch == graph_epoch` — the graph-wide epoch captured at store
//!    time equals the caller's current graph epoch; and
//! 2. **every** per-node version the bundle touched is confirmed by the
//!    caller's watermark: for each `(id, v)` in the entry's recorded node
//!    versions, `watermark.get(id) == Some(&v)`. A watermark entry that is
//!    absent (no confirmed view) or disagrees (stale view) both fail.
//!
//! Any mismatch is an invalidation: the entry is dropped and `lookup`
//! returns `None`. A hit is never served on doubt; `None` is the safe
//! answer because the caller simply falls through to a fresh `retrieve`.
//! Consequence: a caller that passes no watermark can never hit — that is
//! the fail-closed reading of the lane's demand.
//!
//! # Levels
//!
//! * **Exact level** — fingerprint → [`ContextBundle`]. The fingerprint is
//!   `(sorted seeds, sorted exclusions, budget, watermark)`, so reshuffled
//!   seeds or exclusions are the same request (retrieval output does not
//!   depend on seed order) while any real difference is a distinct entry.
//! * **Seed level** — seed id → last-known bundle contribution (recorded
//!   node versions + touched entity ids + the exact fingerprints the seed
//!   contributed to). It survives exact-level misses with a different full
//!   request and backs [`InvalidateCache::invalidate_entity`] and
//!   [`InvalidateCache::seed_state`]; a future partial-recompute consumer
//!   can rebuild a bundle from valid per-seed contributions.
//!
//! # Integration (consumer wiring — no code changes to other modules)
//!
//! `graph_change_set::apply` returns an `ApplyReport` whose
//! `invalidation_set: BTreeSet<String>` holds every entity id touched
//! directly or via index rebuild (node ids, edge ids, tombstoned and
//! merged ids). The consumer of both modules wires them together:
//!
//! ```text
//! let report = apply(&mut graph, &change_set, &mut ledger)?;
//! for entity in &report.invalidation_set {
//!     cache.invalidate_entity(entity);      // node AND edge ids both work
//! }
//! cache.invalidate_epoch(graph.epoch());    // epoch fence for the revision
//! ```
//!
//! `invalidate_entity` alone is sufficient for correctness of the entries
//! it touches (a graph mutation always bumps the epoch, so the epoch rule
//! is the second net); calling both is belt and braces and keeps the seed
//! level tight.
//!
//! @hq:owner hq-agent
//! @hq:task OVN-B lane 5
//! @hq:see research/rust-knowledge-graph/src/context_retrieval.rs (landed, lane 4)
//! @hq:see doc:OVN-B lane 5 — "Revision-safe multilevel LRU invalidation;
//! no stale-hit acceptance"
//! @hq:invariant A hit must be provably current: epoch equality plus every
//! touched node version confirmed by the watermark; otherwise miss + drop.
use crate::context_retrieval::{ContextBundle, ContextRequest};
use std::collections::{BTreeMap, BTreeSet};

/// Order-independent cache key for one retrieval request. Every component is
/// a sorted collection, so seed/exclusion order never changes the identity of
/// a request.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Fingerprint {
    seeds: BTreeSet<String>,
    excluded: BTreeSet<String>,
    budget_tokens: u64,
    watermark: BTreeMap<String, u64>,
}

impl Fingerprint {
    /// The request's own identity, including the watermark the caller
    /// attached to the request (empty when absent). The watermark passed to
    /// `lookup` separately is the *validation* view, not part of the key.
    fn of(req: &ContextRequest) -> Self {
        Self {
            seeds: req.seeds.iter().cloned().collect(),
            excluded: req.excluded.iter().cloned().collect(),
            budget_tokens: req.budget_tokens,
            watermark: req.watermark.clone().unwrap_or_default(),
        }
    }
}

/// One cached exact entry: the bundle plus everything needed to prove it
/// current at lookup time.
#[derive(Clone, Debug)]
struct ExactEntry {
    /// Graph epoch captured at store time.
    epoch: u64,
    /// Every retrieved node id -> its version at retrieval time. This is the
    /// per-node view checked against the watermark on every lookup.
    node_versions: BTreeMap<String, u64>,
    /// Every entity id the bundle emitted, nodes and edges alike. Same id
    /// namespace as `ApplyReport::invalidation_set`, so an invalidate_entity
    /// call fed straight from an apply report matches here.
    touched: BTreeSet<String>,
    bundle: ContextBundle,
}

/// Seed-level entry: the last-known contribution of one seed across the
/// exact entries it participated in (aggregated at a single epoch).
#[derive(Clone, Debug)]
struct SeedEntry {
    epoch: u64,
    node_versions: BTreeMap<String, u64>,
    touched: BTreeSet<String>,
    /// Exact fingerprints this seed contributed to.
    contributions: BTreeSet<Fingerprint>,
}

/// Minimal std-only LRU with explicit access-order tracking. O(log n) per
/// operation via a counter-ordered secondary map; capacities here are small.
struct Lru<K: Ord + Clone, V> {
    capacity: usize,
    tick: u64,
    entries: BTreeMap<K, (V, u64)>,
    order: BTreeMap<u64, K>,
}

impl<K: Ord + Clone, V> Lru<K, V> {
    fn new(capacity: usize) -> Self {
        Self {
            capacity,
            tick: 0,
            entries: BTreeMap::new(),
            order: BTreeMap::new(),
        }
    }

    fn len(&self) -> usize {
        self.entries.len()
    }

    /// Look up without touching recency.
    fn peek(&self, key: &K) -> Option<&V> {
        self.entries.get(key).map(|(v, _)| v)
    }

    /// Look up and mark most-recently used.
    fn get(&mut self, key: &K) -> Option<&V> {
        if self.entries.contains_key(key) {
            self.touch(key);
        }
        self.entries.get(key).map(|(v, _)| v)
    }

    fn touch(&mut self, key: &K) {
        self.tick += 1;
        if let Some((_, old)) = self.entries.get_mut(key) {
            self.order.remove(old);
            self.order.insert(self.tick, key.clone());
            *old = self.tick;
        }
    }

    /// Insert (or replace) and mark most-recently used, evicting the least
    /// recently used entry while over capacity. Capacity 0 stores nothing.
    fn insert(&mut self, key: K, value: V) {
        if self.capacity == 0 {
            return;
        }
        self.tick += 1;
        match self.entries.get_mut(&key) {
            Some((slot, old)) => {
                self.order.remove(old);
                self.order.insert(self.tick, key.clone());
                *old = self.tick;
                *slot = value;
            }
            None => {
                self.order.insert(self.tick, key.clone());
                self.entries.insert(key, (value, self.tick));
            }
        }
        while self.entries.len() > self.capacity {
            let (_, oldest) = match self.order.pop_first() {
                Some(pair) => pair,
                None => break,
            };
            if let Some((_, tick)) = self.entries.remove(&oldest) {
                self.order.remove(&tick);
            }
        }
    }

    fn remove(&mut self, key: &K) -> Option<V> {
        let (value, tick) = self.entries.remove(key)?;
        self.order.remove(&tick);
        Some(value)
    }

    /// Remove every entry matching `pred`; returns the removed keys.
    fn remove_where(&mut self, mut pred: impl FnMut(&K, &V) -> bool) -> Vec<K> {
        let dead: Vec<K> = self
            .entries
            .iter()
            .filter(|(key, (value, _))| pred(key, value))
            .map(|(key, _)| key.clone())
            .collect();
        for key in &dead {
            self.remove(key);
        }
        dead
    }
}

/// Revision-safe two-level LRU over retrieval results. See the module docs
/// for the validity rule and the consumer wiring.
pub struct InvalidateCache {
    capacity: usize,
    exact: Lru<Fingerprint, ExactEntry>,
    seeds: Lru<String, SeedEntry>,
}

impl InvalidateCache {
    /// A cache holding at most `capacity_per_level` entries on each level
    /// (exact level and seed level evict independently, least-recently-used
    /// first, by access order — hits refresh recency). `0` disables caching.
    pub fn new(capacity_per_level: usize) -> Self {
        Self {
            capacity: capacity_per_level,
            exact: Lru::new(capacity_per_level),
            seeds: Lru::new(capacity_per_level),
        }
    }

    /// Entries currently held on the exact level.
    pub fn exact_len(&self) -> usize {
        self.exact.len()
    }

    /// Entries currently held on the seed level.
    pub fn seed_len(&self) -> usize {
        self.seeds.len()
    }

    /// Return the cached bundle for `req` **only if it is provably current**
    /// against `graph_epoch` and the `watermark` view: cached epoch equal and
    /// every touched node version present-and-equal in the watermark. Any
    /// mismatch — including an absent watermark entry — invalidates: the
    /// entry is dropped and `None` is returned. A miss never disturbs other
    /// entries.
    pub fn lookup(
        &mut self,
        graph_epoch: u64,
        watermark: &BTreeMap<String, u64>,
        req: &ContextRequest,
    ) -> Option<ContextBundle> {
        let fp = Fingerprint::of(req);
        let valid = match self.exact.peek(&fp) {
            Some(entry) => {
                entry.epoch == graph_epoch
                    && entry
                        .node_versions
                        .iter()
                        .all(|(id, v)| watermark.get(id) == Some(v))
            }
            None => false,
        };
        if valid {
            // Recency refresh; clone out so the borrow ends here.
            if let Some(entry) = self.exact.get(&fp) {
                return Some(entry.bundle.clone());
            }
        }
        self.drop_exact(&fp);
        None
    }

    /// Record a fresh retrieval: the fingerprint of `req` (with the caller
    /// watermark carried in `req.watermark`), the graph epoch, the bundle,
    /// and the per-node versions + touched entity ids read off the bundle.
    /// Seed-level entries are merged when the seed's last contribution is at
    /// the same epoch, replaced otherwise.
    pub fn store(&mut self, graph_epoch: u64, req: &ContextRequest, bundle: &ContextBundle) {
        if self.capacity == 0 {
            return;
        }
        let fp = Fingerprint::of(req);
        let mut node_versions = BTreeMap::new();
        let mut touched = BTreeSet::new();
        for item in &bundle.items {
            node_versions.insert(item.id.clone(), item.version);
            touched.insert(item.id.clone());
        }
        for edge in &bundle.edges {
            touched.insert(edge.id.clone());
        }
        self.exact.insert(
            fp.clone(),
            ExactEntry {
                epoch: graph_epoch,
                node_versions: node_versions.clone(),
                touched,
                bundle: bundle.clone(),
            },
        );
        for seed in &req.seeds {
            let fresh = SeedEntry {
                epoch: graph_epoch,
                node_versions: node_versions.clone(),
                touched: {
                    let mut ids: BTreeSet<String> = node_versions.keys().cloned().collect();
                    ids.extend(bundle.edges.iter().map(|e| e.id.clone()));
                    ids
                },
                contributions: BTreeSet::from([fp.clone()]),
            };
            let merged = match self.seeds.peek(&seed.clone()) {
                Some(existing) if existing.epoch == graph_epoch => {
                    let mut merged = existing.clone();
                    merged
                        .node_versions
                        .extend(node_versions.iter().map(|(k, v)| (k.clone(), *v)));
                    merged.touched.extend(fresh.touched.iter().cloned());
                    merged.contributions.insert(fp.clone());
                    merged
                }
                _ => fresh,
            };
            self.seeds.insert(seed.clone(), merged);
        }
    }

    /// Drop every cached entry (exact and seed level) whose bundle touched
    /// `entity_id`. Accepts node ids and edge ids — exactly the id namespace
    /// of `graph_change_set::ApplyReport::invalidation_set`. Unrelated
    /// entries survive.
    pub fn invalidate_entity(&mut self, entity_id: &str) {
        let dead = self
            .exact
            .remove_where(|_, e| e.touched.contains(entity_id));
        for fp in dead {
            self.drop_exact(&fp);
        }
        let dead_seeds = self
            .seeds
            .remove_where(|_, e| e.touched.contains(entity_id));
        for seed in dead_seeds {
            self.seeds.remove(&seed);
        }
    }

    /// Epoch fence: drop every entry recorded below `new_epoch` on both
    /// levels. Entries recorded at exactly `new_epoch` are still valid there
    /// and survive.
    pub fn invalidate_epoch(&mut self, new_epoch: u64) {
        let dead = self.exact.remove_where(|_, e| e.epoch < new_epoch);
        for fp in dead {
            self.drop_exact(&fp);
        }
        let dead_seeds = self.seeds.remove_where(|_, e| e.epoch < new_epoch);
        for seed in dead_seeds {
            self.seeds.remove(&seed);
        }
    }

    /// Seed-level probe: the seed's last-known contribution (node id ->
    /// version) if it is provably current under the same rule as
    /// [`Self::lookup`] (epoch equality plus full watermark confirmation).
    /// Survives exact-level misses for a different full request; an
    /// unconfirmed or stale view drops the seed entry and returns `None`.
    pub fn seed_state(
        &mut self,
        graph_epoch: u64,
        watermark: &BTreeMap<String, u64>,
        seed: &str,
    ) -> Option<BTreeMap<String, u64>> {
        let valid = match self.seeds.peek(&seed.to_owned()) {
            Some(entry) => {
                entry.epoch == graph_epoch
                    && entry
                        .node_versions
                        .iter()
                        .all(|(id, v)| watermark.get(id) == Some(v))
            }
            None => false,
        };
        if valid {
            return self
                .seeds
                .get(&seed.to_owned())
                .map(|e| e.node_versions.clone());
        }
        self.seeds.remove(&seed.to_owned());
        None
    }

    /// Remove one exact entry and unlink it from every seed contribution.
    fn drop_exact(&mut self, fp: &Fingerprint) {
        if self.exact.remove(fp).is_some() {
            for (entry, _) in self.seeds.entries.values_mut() {
                entry.contributions.remove(fp);
            }
        }
    }
}
