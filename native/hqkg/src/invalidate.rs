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
use crate::graph_change_set::ApplyReport;
use std::collections::{BTreeMap, BTreeSet};

/// Caller identity used for cross-user isolation. Namespaces do not
/// authenticate today, so the caller identity must be explicit and exact:
/// two lookups from different caller identities never share a cache entry.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct CallerId {
    pub caller: String,
    pub namespace: String,
}

impl CallerId {
    pub fn new(caller: impl Into<String>, namespace: impl Into<String>) -> Self {
        Self {
            caller: caller.into(),
            namespace: namespace.into(),
        }
    }
}

/// Exact source revision of one cached bundle: source id + content sha256
/// digest, scoped to the caller that stored it. A changed source revision
/// invalidates every bundle whose recorded source revisions touch it.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct SourceRevision {
    pub source: String,
    pub revision: u64,
    pub digest: String,
}

impl SourceRevision {
    pub fn new(source: impl Into<String>, revision: u64, digest: impl Into<String>) -> Self {
        Self {
            source: source.into(),
            revision,
            digest: digest.into(),
        }
    }
}

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
    /// Caller identity that stored this entry, enforced on every lookup so a
    /// caller can never be served another caller's bundle (cross-user
    /// isolation, fail-closed).
    caller: CallerId,
    /// Every retrieved node id -> its version at retrieval time. This is the
    /// per-node view checked against the watermark on every lookup.
    node_versions: BTreeMap<String, u64>,
    /// Every entity id the bundle emitted, nodes and edges alike. Same id
    /// namespace as `ApplyReport::invalidation_set`, so an invalidate_entity
    /// call fed straight from an apply report matches here.
    touched: BTreeSet<String>,
    /// Source revisions recorded at store time; drive revision-scoped
    /// invalidation alongside `touched` entity ids.
    source_revisions: BTreeSet<SourceRevision>,
    bundle: ContextBundle,
}

/// Seed-level entry: the last-known contribution of one seed across the
/// exact entries it participated in (aggregated at a single epoch).
#[derive(Clone, Debug)]
struct SeedEntry {
    epoch: u64,
    caller: CallerId,
    node_versions: BTreeMap<String, u64>,
    touched: BTreeSet<String>,
    source_revisions: BTreeSet<SourceRevision>,
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
    /// Source revision -> exact fingerprints whose bundle recorded that source
    /// revision. Drives revision-scoped invalidation: a changed source revision
    /// drops every bundle that depended on it, and only those bundles.
    source_index: BTreeMap<SourceRevision, BTreeSet<Fingerprint>>,
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
            source_index: BTreeMap::new(),
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
        self.lookup_with_caller(
            graph_epoch,
            &CallerId::new("anonymous", "global"),
            watermark,
            req,
        )
    }

    /// Caller-scoped lookup: serves the cached bundle for `req` only when
    /// the caller identity matches the entry's stored caller **and** the
    /// epoch/watermark validity rule holds. A caller from a different
    /// identity or namespace can never be served another caller's bundle
    /// — false or cross-user context reuse is rejected fail-closed.
    pub fn lookup_with_caller(
        &mut self,
        graph_epoch: u64,
        caller: &CallerId,
        watermark: &BTreeMap<String, u64>,
        req: &ContextRequest,
    ) -> Option<ContextBundle> {
        let fp = Fingerprint::of(req);
        let valid = match self.exact.peek(&fp) {
            Some(entry) => {
                entry.caller == *caller
                    && entry.epoch == graph_epoch
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
        self.store_with_caller_and_sources(
            graph_epoch,
            CallerId::new("anonymous", "global"),
            req,
            bundle,
            &[],
        );
    }

    /// Caller-scoped store: records `bundle` under `caller` and `source_revisions`
    /// (the exact source id + content sha256 of each seeded file's current
    /// bytes). Lookups from a different caller identity never share this
    /// entry. Source revisions are indexed so [`invalidate_revision`] can drop
    /// exactly the affected bundles when a source revision changes.
    pub fn store_with_caller_and_sources(
        &mut self,
        graph_epoch: u64,
        caller: CallerId,
        req: &ContextRequest,
        bundle: &ContextBundle,
        source_revisions: &[SourceRevision],
    ) {
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
        let srcs: BTreeSet<SourceRevision> =
            source_revisions.iter().cloned().collect();
        self.exact.insert(
            fp.clone(),
            ExactEntry {
                epoch: graph_epoch,
                caller: caller.clone(),
                node_versions: node_versions.clone(),
                touched,
                source_revisions: srcs.clone(),
                bundle: bundle.clone(),
            },
        );
        for seed in &req.seeds {
            let fresh = SeedEntry {
                epoch: graph_epoch,
                caller: caller.clone(),
                node_versions: node_versions.clone(),
                touched: {
                    let mut ids: BTreeSet<String> = node_versions.keys().cloned().collect();
                    ids.extend(bundle.edges.iter().map(|e| e.id.clone()));
                    ids
                },
                source_revisions: srcs.clone(),
                contributions: BTreeSet::from([fp.clone()]),
            };
            let merged = match self.seeds.peek(&seed.clone()) {
                Some(existing) if existing.epoch == graph_epoch && existing.caller == caller => {
                    let mut merged = existing.clone();
                    merged
                        .node_versions
                        .extend(node_versions.iter().map(|(k, v)| (k.clone(), *v)));
                    merged.touched.extend(fresh.touched.iter().cloned());
                    merged.source_revisions.extend(fresh.source_revisions.iter().cloned());
                    merged.contributions.insert(fp.clone());
                    merged
                }
                _ => fresh,
            };
            self.seeds.insert(seed.clone(), merged);
        }
        // Index every recorded source revision to this exact fingerprint so a
        // changed source revision can drop exactly the affected bundles.
        for src in &srcs {
            self.source_index
                .entry(src.clone())
                .or_default()
                .insert(fp.clone());
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
    /// [`Self::lookup`] (epoch equality plus full watermark confirmation), and
    /// only for the same caller identity — cross-user seed reuse is rejected.
    /// Survives exact-level misses for a different full request; an
    /// unconfirmed or stale view drops the seed entry and returns `None`.
    pub fn seed_state(
        &mut self,
        graph_epoch: u64,
        watermark: &BTreeMap<String, u64>,
        seed: &str,
    ) -> Option<BTreeMap<String, u64>> {
        self.seed_state_with_caller(
            graph_epoch,
            &CallerId::new("anonymous", "global"),
            watermark,
            seed,
        )
    }

    /// Caller-scoped seed-level probe: same rule as [`Self::seed_state`], but
    /// only serves a contribution stored by `caller`. A different caller's
    /// contribution is never returned (cross-user isolation, fail-closed).
    pub fn seed_state_with_caller(
        &mut self,
        graph_epoch: u64,
        caller: &CallerId,
        watermark: &BTreeMap<String, u64>,
        seed: &str,
    ) -> Option<BTreeMap<String, u64>> {
        let valid = match self.seeds.peek(&seed.to_owned()) {
            Some(entry) => {
                entry.caller == *caller
                    && entry.epoch == graph_epoch
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

    /// Remove one exact entry and unlink it from every seed contribution and
    /// from the source revision index.
    fn drop_exact(&mut self, fp: &Fingerprint) {
        if let Some(entry) = self.exact.remove(fp) {
            for src in &entry.source_revisions {
                if let Some(fps) = self.source_index.get_mut(src) {
                    fps.remove(fp);
                    if fps.is_empty() {
                        self.source_index.remove(src);
                    }
                }
            }
            for (entry, _) in self.seeds.entries.values_mut() {
                entry.contributions.remove(fp);
            }
        }
    }

    /// Revision-scoped invalidation: drop exactly the cached bundles whose
    /// recorded source revisions intersect `changed_revisions`, plus every
    /// entry whose touched entity set intersects `report.invalidation_set`.
    /// Entries unrelated to the changed sources or touched entities survive
    /// — only affected bundles are dropped. Then advance the epoch fence so
    /// stale entries below the new revision's graph epoch are gone too.
    pub fn invalidate_revision(
        &mut self,
        graph_epoch: u64,
        changed_revisions: &[SourceRevision],
        report: &ApplyReport,
    ) {
        // Drop exact entries by changed source revision (revision-scoped).
        let mut dead: Vec<Fingerprint> = Vec::new();
        for src in changed_revisions {
            if let Some(fps) = self.source_index.remove(src) {
                dead.extend(fps);
            }
        }
        // Drop exact entries by touched entity id (entity-scoped, from the
        // apply report's invalidation_set).
        for entity in &report.invalidation_set {
            let dead_entities: Vec<Fingerprint> = self
                .exact
                .entries
                .iter()
                .filter(|(_, e)| e.0.touched.contains(entity))
                .map(|(fp, _)| fp.clone())
                .collect();
            dead.extend(dead_entities);
        }
        for fp in dead {
            self.drop_exact(&fp);
        }
        // Drop seed-level entries whose touched entity set intersects the
        // invalidation set (caller-scoped seed entries survive unless touched).
        let dead_seeds: Vec<String> = self
            .seeds
            .entries
            .iter()
            .filter(|(_, e)| e.0.touched.intersection(&report.invalidation_set).next().is_some())
            .map(|(seed, _)| seed.clone())
            .collect();
        for seed in dead_seeds {
            self.seeds.remove(&seed);
        }
        // Epoch fence: everything below the new graph epoch is stale.
        let dead_epoch = self
            .exact
            .remove_where(|_, e| e.epoch < graph_epoch)
            .into_iter()
            .collect::<Vec<_>>();
        for fp in dead_epoch {
            self.drop_exact(&fp);
        }
        let dead_seed_epochs: Vec<String> = self
            .seeds
            .remove_where(|_, e| e.epoch < graph_epoch)
            .into_iter()
            .collect::<Vec<_>>();
        for seed in dead_seed_epochs {
            self.seeds.remove(&seed);
        }
    }
}
