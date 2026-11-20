# File: native/hqkg/src/graph_change_set.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/graph_change_set.rs |
| Language | Rust |
| Kind | source |
| Size | 18925 B |
| Lines | 522 |
| Hash | cbb91043af55 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Tombstone | struct | 25 | yes | pub struct Tombstone { |
| ChangeOp | enum | 33 | yes | pub enum ChangeOp { |
| GraphChangeSet | struct | 82 | yes | pub struct GraphChangeSet { |
| parent | method | 98 | yes | pub fn parent(mut self, parent_change_set_id: impl Into&lt;String&gt;) -&gt; Self { |
| put_node | method | 102 | yes | pub fn put_node(mut self, node: Node) -&gt; Self { |
| put_edge | method | 106 | yes | pub fn put_edge(mut self, edge: Edge) -&gt; Self { |
| remove_node | method | 110 | yes | pub fn remove_node(mut self, entity_id: &amp;str, reason: &amp;str, ts: u64) -&gt; Self { |
| remove_edge | method | 118 | yes | pub fn remove_edge(mut self, entity_id: &amp;str, reason: &amp;str, ts: u64) -&gt; Self { |
| remove_node_fenced | method | 128 | yes | pub fn remove_node_fenced( mut self, entity_id: &amp;str, max_revision: u64, reason: &amp;str, |
| merge | method | 143 | yes | pub fn merge(mut self, duplicate_id: &amp;str, canonical_id: &amp;str, reason: &amp;str, ts: u64) -&gt; Self { |
| split | method | 152 | yes | pub fn split( mut self, source_id: &amp;str, new_node: Node, edge_ids: Vec&lt;String&gt;, |
| ApplyLedger | struct | 173 | yes | pub struct ApplyLedger { |
| contains | method | 181 | yes | pub fn contains(&amp;self, change_set_id: &amp;str) -&gt; bool { |
| len | method | 184 | yes | pub fn len(&amp;self) -&gt; usize { |
| is_empty | method | 187 | yes | pub fn is_empty(&amp;self) -&gt; bool { |
| ApplyReport | struct | 194 | yes | pub struct ApplyReport { |
| check_id | function | 209 | no | fn check_id(id: &amp;str, what: &amp;str) -&gt; Result&lt;()&gt; { |
| snapshot_incident | function | 216 | no | fn snapshot_incident(graph: &amp;Graph, id: &amp;str) -&gt; Result&lt;Vec&lt;Edge&gt;&gt; { |
| remove_entity | function | 230 | no | fn remove_entity( graph: &amp;mut Graph, entity_id: &amp;str, reason: &amp;str, ts: u64, |
| apply_op | function | 265 | no | fn apply_op(graph: &amp;mut Graph, op: &amp;ChangeOp, report: &amp;mut ApplyReport) -&gt; Result&lt;()&gt; { |
| apply | function | 452 | yes | pub fn apply( graph: &amp;mut Graph, cs: &amp;GraphChangeSet, ledger: &amp;mut ApplyLedger, ) -&gt; Result&lt;ApplyReport&gt; { |
| lineage_chain | function | 490 | yes | pub fn lineage_chain&lt;&#39;a&gt;(sets: &amp;&#39;a [GraphChangeSet], leaf_id: &amp;str) -&gt; Result&lt;Vec&lt;&amp;&#39;a str&gt;&gt; { |
| lineage_depth | function | 520 | yes | pub fn lineage_depth(sets: &amp;[GraphChangeSet], leaf_id: &amp;str) -&gt; Result&lt;usize&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::{BTreeMap, BTreeSet} | use | 17 | external |
| crate::{Edge, Error, Graph, Node, Result} | use | 19 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 14 | context | — | — | incremental source change sets, tombstones and lineage for HQKG (OVN-B lane 2) |
| 15 | owner | hq-agent | — | hq-agent |
| 16 | task | — | — | OVN-B lane 2 (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md) |

## Excerpt

```rust
//! Incremental change sets with tombstones, lineage and idempotent apply.
//!
//! A change set is a named, optionally parent-linked batch of graph operations.
//! Applying it through an [`ApplyLedger`] is idempotent: re-applying the same
//! `change_set_id` applies nothing and reports [`ApplyReport::duplicate`].
//! Deletions are tombstone *records* carried in the apply result — the graph
//! itself performs a hard remove and the journal frame format is untouched.
//!
//! Merge/split, as required by contract 3, are narrow:
//! merge moves every edge of a duplicate node onto the canonical id, then
//! tombstones the duplicate; split creates a new node and rewires only a
//! stated subset of the source's incident edges.
//!
//! @hq:context incremental source change sets, tombstones and lineage for HQKG (OVN-B lane 2)
//! @hq:owner hq-agent
//! @hq:task OVN-B lane 2 (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md)
use std::collections::{BTreeMap, BTreeSet};

use crate::{Edge, Error, Graph, Node, Result};

/// A deletion record. A tombstone is a statement that an entity was removed
/// as of `ts` for `reason`; it lives in change set results, never in journal
/// frames, and never resurrects or erases graph state by itself.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Tombstone {
    pub entity_id: String,
    pub reason: String,
    pub ts: u64,
}

/// One operation inside a change set. All ids refer to graph entity ids.
#[derive(Clone, Debug)]
pub enum ChangeOp {
    /// Insert or update a node (the graph assigns the next version).
    PutNode(Node),
    /// Insert or replace an edge; both endpoints must already exist.
    PutEdge(Edge),
    /// Hard-remove the node (and its incident edges) and record a tombstone.
    RemoveNode {
        entity_id: String,
        reason: String,
        ts: u64,
    },
    /// Revision-fenced removal: remove `entity_id` only when its recorded
    /// `hqkg.provenance.revision` is at or below `max_revision`. A source that
    /// has already moved past the fence is held — the tombstone is still
    /// recorded and the op counts as skipped, but the newer source survives.
    /// This is the op an authorized delta ingest uses, so a stale or replayed
    /// tombstone cannot regress a record that was updated after it was issued.
    RemoveNodeFenced {
        entity_id: String,
        max_revision: u64,
        reason: String,
        ts: u64,
    },
    /// Hard-remove the edge and record a tombstone.
    RemoveEdge {
        entity_id: String,
        reason: String,
        ts: u64,
    },
    /// Move every edge incident to `duplicate_id` onto `canonical_id`, then
    /// hard-remove the duplicate and tombstone it.
    MergeNodes {
        duplicate_id: String,
        canonical_id: String,
        reason: String,
        ts: u64,
    },
    /// Create `new_node`, then rewire only the listed incident edges of
    /// `source_id` to point at the new node. The source survives.
    SplitNode {
        source_id: String,
        new_node: Node,
        edge_ids: Vec<String>,
        ts: u64,
    },
}

/// A named, optionally parent-linked batch of operations.
```

_First 80 of 523 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
