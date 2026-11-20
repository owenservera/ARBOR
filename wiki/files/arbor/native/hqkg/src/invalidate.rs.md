# File: native/hqkg/src/invalidate.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/invalidate.rs |
| Language | Rust |
| Kind | source |
| Size | 23760 B |
| Lines | 608 |
| Hash | dcfc50aa2834 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CallerId | struct | 70 | yes | pub struct CallerId { |
| SourceRevision | struct | 88 | yes | pub struct SourceRevision { |
| Fingerprint | struct | 108 | no | struct Fingerprint { |
| ExactEntry | struct | 132 | no | struct ExactEntry { |
| SeedEntry | struct | 155 | no | struct SeedEntry { |
| Lru | struct | 167 | no | struct Lru&lt;K: Ord + Clone, V&gt; { |
| len | method | 184 | no | fn len(&amp;self) -&gt; usize { |
| peek | method | 189 | no | fn peek(&amp;self, key: &amp;K) -&gt; Option&lt;&amp;V&gt; { |
| get | method | 194 | no | fn get(&amp;mut self, key: &amp;K) -&gt; Option&lt;&amp;V&gt; { |
| touch | method | 201 | no | fn touch(&amp;mut self, key: &amp;K) { |
| insert | method | 212 | no | fn insert(&amp;mut self, key: K, value: V) { |
| remove | method | 240 | no | fn remove(&amp;mut self, key: &amp;K) -&gt; Option&lt;V&gt; { |
| remove_where | method | 247 | no | fn remove_where(&amp;mut self, mut pred: impl FnMut(&amp;K, &amp;V) -&gt; bool) -&gt; Vec&lt;K&gt; { |
| InvalidateCache | struct | 263 | yes | pub struct InvalidateCache { |
| exact_len | method | 287 | yes | pub fn exact_len(&amp;self) -&gt; usize { |
| seed_len | method | 292 | yes | pub fn seed_len(&amp;self) -&gt; usize { |
| lookup | method | 302 | yes | pub fn lookup( &amp;mut self, graph_epoch: u64, watermark: &amp;BTreeMap&lt;String, u64&gt;, req: &amp;ContextRequest, |
| lookup_with_caller | method | 321 | yes | pub fn lookup_with_caller( &amp;mut self, graph_epoch: u64, caller: &amp;CallerId, watermark: &amp;BTreeMap&lt;String, u64&gt;, |
| store | method | 355 | yes | pub fn store(&amp;mut self, graph_epoch: u64, req: &amp;ContextRequest, bundle: &amp;ContextBundle) { |
| store_with_caller_and_sources | method | 370 | yes | pub fn store_with_caller_and_sources( &amp;mut self, graph_epoch: u64, caller: CallerId, req: &amp;ContextRequest, |
| invalidate_entity | method | 446 | yes | pub fn invalidate_entity(&amp;mut self, entity_id: &amp;str) { |
| invalidate_epoch | method | 464 | yes | pub fn invalidate_epoch(&amp;mut self, new_epoch: u64) { |
| seed_state | method | 481 | yes | pub fn seed_state( &amp;mut self, graph_epoch: u64, watermark: &amp;BTreeMap&lt;String, u64&gt;, seed: &amp;str, |
| seed_state_with_caller | method | 498 | yes | pub fn seed_state_with_caller( &amp;mut self, graph_epoch: u64, caller: &amp;CallerId, watermark: &amp;BTreeMap&lt;String, u64&gt;, |
| drop_exact | method | 528 | no | fn drop_exact(&amp;mut self, fp: &amp;Fingerprint) { |
| invalidate_revision | method | 550 | yes | pub fn invalidate_revision( &amp;mut self, graph_epoch: u64, changed_revisions: &amp;[SourceRevision], report: &amp;ApplyReport, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::context_retrieval::{ContextBundle, ContextRequest} | use | 62 | external |
| crate::graph_change_set::ApplyReport | use | 63 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 64 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 55 | owner | hq-agent | — | hq-agent |
| 56 | task | — | — | OVN-B lane 5 |
| 57 | see | — | research/rust-knowledge-graph/src/context_retrieval.rs | research/rust-knowledge-graph/src/context_retrieval.rs (landed, lane 4) |
| 58 | see | — | — | doc:OVN-B lane 5 — &quot;Revision-safe multilevel LRU invalidation; |
| 60 | invariant | — | — | A hit must be provably current: epoch equality plus every |

## Excerpt

````rust
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
````

_First 80 of 609 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
