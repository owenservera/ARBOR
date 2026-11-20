# File: native/hqkg/src/context_retrieval.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/context_retrieval.rs |
| Language | Rust |
| Kind | source |
| Size | 14078 B |
| Lines | 334 |
| Hash | a720679c6955 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_DEPTH | const | 23 | yes | pub const MAX_DEPTH: usize = 3; |
| ContextRequest | struct | 28 | yes | pub struct ContextRequest { |
| ContextItem | struct | 43 | yes | pub struct ContextItem { |
| ScopedQuery | struct | 68 | yes | pub struct ScopedQuery { |
| ContextEdge | struct | 86 | yes | pub struct ContextEdge { |
| ContextBundle | struct | 96 | yes | pub struct ContextBundle { |
| estimate_tokens | function | 113 | no | fn estimate_tokens(node: &amp;Node) -&gt; u64 { |
| ranked_ids | function | 130 | no | fn ranked_ids( graph: &amp;Graph, depth: &amp;BTreeMap&lt;String, usize&gt;, seed_order: Option&lt;&amp;BTreeMap&lt;String, usize&gt;&gt;, ) -&gt; Vec&lt;String&gt; { |
| retrieve | function | 165 | yes | pub fn retrieve(graph: &amp;Graph, request: &amp;ContextRequest) -&gt; Result&lt;ContextBundle&gt; { |
| query_scoped | function | 176 | yes | pub fn query_scoped(graph: &amp;Graph, query: &amp;ScopedQuery) -&gt; Result&lt;ContextBundle&gt; { |
| retrieve_inner | function | 211 | no | fn retrieve_inner( graph: &amp;Graph, request: &amp;ContextRequest, scope: Option&lt;&amp;str&gt;, seed_order: Option&lt;&amp;BTreeMap&lt;String, usize&gt;&gt;, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::{Error, Graph, Node, Result} | use | 18 | external |
| std::collections::{BTreeMap, BTreeSet, VecDeque} | use | 19 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 12 | owner | hq-agent | — | hq-agent |
| 13 | task | — | — | OVN-B lane 4 |
| 14 | see | — | — | doc:OVN-B lane 5 (no stale-hit acceptance) — `stale` is surfaced, |
| 16 | invariant | — | — | Unknown or excluded seed, or a zero budget, fails closed. |
| 17 | invariant | — | — | Items are a prefix of the ranked list; never truncated mid-item. |

## Excerpt

```rust
//! Oracle dynamic context retrieval (OVN-B lane 4): bounded BFS from seed
//! entities across both index directions, deterministic ranking, a hard token
//! budget, full provenance and watermark staleness flags. Pure std data flow;
//! JSON mapping onto the pilot's ContextBundleRequest/Receipt contracts stays
//! on the Bun side.
//!
//! `query_scoped` is the same retrieval with an authorized id scope and an
//! explicit relevance order for the seeds. It reuses the bounded BFS, budget
//! prefix, exclusion and edge projection of `retrieve`; it never builds a
//! second graph or a second traversal.
//!
//! @hq:owner hq-agent
//! @hq:task OVN-B lane 4
//! @hq:see doc:OVN-B lane 5 (no stale-hit acceptance) — `stale` is surfaced,
//! never silently accepted.
//! @hq:invariant Unknown or excluded seed, or a zero budget, fails closed.
//! @hq:invariant Items are a prefix of the ranked list; never truncated mid-item.
use crate::{Error, Graph, Node, Result};
use std::collections::{BTreeMap, BTreeSet, VecDeque};

/// BFS depth cap from the nearest seed. Neighbours beyond this depth are
/// outside the retrieval horizon.
pub const MAX_DEPTH: usize = 3;

/// Mirrors the pilot `ContextBundleRequest` semantics (bundleId/taskRef stay on
/// the Bun side; the Rust layer needs the graph-facing fields only).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ContextRequest {
    /// Entity ids to start from. Every id must exist in the graph (fail-closed).
    pub seeds: Vec<String>,
    /// Hard upper bound on estimated tokens; must be >= 1.
    pub budget_tokens: u64,
    /// Excluded entity ids: they and their subtrees are skipped, and no edge
    /// touching an excluded id is ever emitted.
    pub excluded: BTreeSet<String>,
    /// Caller's last-seen id -> version. A mismatch marks the item stale with
    /// both versions recorded (lane 5: never silently accept a stale hit).
    pub watermark: Option<BTreeMap<String, u64>>,
}

/// One retrieved node. `id` mirrors the pilot receipt field `ref`.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ContextItem {
    pub id: String,
    pub title: String,
    /// BFS depth from the nearest seed.
    pub depth: usize,
    /// Estimated tokens contributed to `tokens_used`.
    pub tokens: u64,
    /// Node provenance. May be empty — recorded as empty, never invented.
    pub sources: BTreeSet<String>,
    /// Current node version at retrieval time.
    pub version: u64,
    /// Watermark mismatch: `watermark_version` is what the caller saw.
    pub stale: bool,
    pub watermark_version: Option<u64>,
}

/// A relevance-ordered retrieval inside one authorized id scope.
///
/// `seeds` are ordered by the caller's relevance judgement (most relevant
/// first), not by recency. Every seed and every traversed id must start with
/// `scope`; ids outside it are never visited, never returned and never used as
/// edge endpoints. `max_items` is an output bound only — traversal still runs
/// over the whole scoped horizon, and `budget_tokens` is applied to the
/// relevance-ordered result.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ScopedQuery {
    /// Relevance-ordered seeds. Duplicates collapse to the first position.
    pub seeds: Vec<String>,
    /// Authorized id prefix. Empty is rejected.
    pub scope: String,
    /// Hard upper bound on estimated tokens of the returned items; must be >= 1.
    pub budget_tokens: u64,
    /// Maximum returned items; must be >= 1.
    pub max_items: usize,
    /// Excluded entity ids: they and their subtrees are skipped, and no edge
    /// touching an excluded id is ever emitted.
    pub excluded: BTreeSet<String>,
    /// Caller's last-seen id -> version, as in [`ContextRequest`].
```

_First 80 of 335 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
