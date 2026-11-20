# File: native/hqkg/src/reconcile.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/reconcile.rs |
| Language | Rust |
| Kind | source |
| Size | 11203 B |
| Lines | 288 |
| Hash | aa08e6915a77 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DuplicateSignal | enum | 43 | yes | pub enum DuplicateSignal { |
| DuplicateCandidate | struct | 55 | yes | pub struct DuplicateCandidate { |
| SHARED_NEIGHBOR_THRESHOLD | const | 62 | no | const SHARED_NEIGHBOR_THRESHOLD: usize = 2; |
| normalize_title | function | 64 | no | fn normalize_title(title: &amp;str) -&gt; String { |
| neighbor_set | function | 68 | no | fn neighbor_set(g: &amp;Graph, id: &amp;str) -&gt; BTreeSet&lt;String&gt; { |
| find_duplicates | function | 88 | yes | pub fn find_duplicates(g: &amp;Graph) -&gt; Vec&lt;DuplicateCandidate&gt; { |
| find_orphans | function | 185 | yes | pub fn find_orphans(g: &amp;Graph, allowlist: &amp;[NodeKind]) -&gt; Vec&lt;String&gt; { |
| canonical_of | function | 201 | no | fn canonical_of&lt;&#39;a&gt;(members: &amp;[&amp;&#39;a String], g: &amp;&#39;a Graph) -&gt; Result&lt;&amp;&#39;a str&gt; { |
| reconciliation_plan | function | 224 | yes | pub fn reconciliation_plan(g: &amp;Graph, dups: &amp;[DuplicateCandidate]) -&gt; Result&lt;GraphChangeSet&gt; { |
| find | function | 227 | no | fn find(parent: &amp;mut BTreeMap&lt;String, String&gt;, mut x: String) -&gt; String { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::{BTreeMap, BTreeSet} | use | 36 | external |
| crate::graph_change_set::GraphChangeSet | use | 38 | external |
| crate::{Error, Graph, NodeKind, Result} | use | 39 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 33 | context | — | — | orphan/duplicate detection and merge planning for HQKG (OVN-B lane 3) |
| 34 | owner | hq-agent | — | hq-agent |
| 35 | task | — | — | OVN-B lane 3 (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md) |

## Excerpt

```rust
//! Entity reconciliation: orphan/duplicate detection and merge planning.
//!
//! Detection proposes, the W4 change-set module applies. This module is
//! strictly read-only over the [`Graph`]: it emits exact-signal duplicate
//! candidates and a [`GraphChangeSet`] of [`ChangeOp::MergeNodes`] ops that
//! the caller applies through `graph_change_set::apply` with an
//! [`ApplyLedger`]. No fuzzy matching, no mutation from this module itself.
//!
//! Exact signals (each independently sufficient, all value-cited):
//! 1. `TitleMatch` — identical normalized title (trim + lowercase).
//! 2. `PropertyKeySetMatch` — identical, non-empty property-key sets.
//! 3. `SharedNeighbors` — two or more common neighbors via the derived
//!    outgoing/incoming indexes (count >= 2 so a single shared hub is not
//!    treated as identity evidence).
//!
//! Canonical winner rule (deterministic, stated): within a duplicate
//! cluster the node with the **highest `version`** becomes canonical
//! (highest version proxies the richest, longest-maintained history);
//! **ties break by lexicographically smallest id**. Every other cluster
//! member is emitted as one `MergeNodes` op into the canonical, in sorted
//! duplicate-id order, so `graph_change_set::apply` runs with zero Err.
//!
//! Federation-ready lineage: plans carry `source = "reconcile://local"`
//! and no parent. Merging a remote reconciliation later: a remote peer
//! ships its own change set (its own `change_set_id`, `source` such as
//! `reconcile://<peer>`, still parentless or parented onto a shared root).
//! Because `graph_change_set::apply` is idempotent per `change_set_id` and
//! every op re-validates against the receiving graph (missing endpoints
//! fail closed), a remote merge is just a second `apply` on this node —
//! conflicts surface as `Error::Missing`/`Error::Conflict` from the W4
//! module rather than silent divergence. No remote transport exists here.
//!
//! @hq:context orphan/duplicate detection and merge planning for HQKG (OVN-B lane 3)
//! @hq:owner hq-agent
//! @hq:task OVN-B lane 3 (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md)
use std::collections::{BTreeMap, BTreeSet};

use crate::graph_change_set::GraphChangeSet;
use crate::{Error, Graph, NodeKind, Result};

/// One exact identity signal that fired for a pair, with its evidence value.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DuplicateSignal {
    /// Both nodes normalize (trim + lowercase) to this title.
    TitleMatch { normalized_title: String },
    /// Both nodes have exactly this (non-empty, sorted) property-key set.
    PropertyKeySetMatch { keys: Vec<String> },
    /// Both nodes share this many common neighbors.
    SharedNeighbors { count: usize },
}

/// A pair of distinct nodes that at least one exact signal links, with the
/// evidence. Detection never mutates the graph.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DuplicateCandidate {
    pub id_a: String,
    pub id_b: String,
    pub signals: Vec<DuplicateSignal>,
}

/// Minimum common-neighbor count for the shared-neighbor signal to fire.
const SHARED_NEIGHBOR_THRESHOLD: usize = 2;

fn normalize_title(title: &str) -> String {
    title.trim().to_lowercase()
}

fn neighbor_set(g: &Graph, id: &str) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    if let Ok(edges) = g.outgoing(id, None) {
        for e in edges {
            out.insert(e.to.clone());
        }
    }
    if let Ok(edges) = g.incoming(id, None) {
        for e in edges {
            out.insert(e.from.clone());
        }
    }
    out.remove(id);
```

_First 80 of 289 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
