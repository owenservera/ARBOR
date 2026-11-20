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
#[derive(Clone, Debug)]
pub struct GraphChangeSet {
    pub change_set_id: String,
    pub parent_change_set_id: Option<String>,
    pub source: String,
    pub ops: Vec<ChangeOp>,
}

impl GraphChangeSet {
    pub fn new(change_set_id: impl Into<String>, source: impl Into<String>) -> Self {
        Self {
            change_set_id: change_set_id.into(),
            parent_change_set_id: None,
            source: source.into(),
            ops: Vec::new(),
        }
    }
    pub fn parent(mut self, parent_change_set_id: impl Into<String>) -> Self {
        self.parent_change_set_id = Some(parent_change_set_id.into());
        self
    }
    pub fn put_node(mut self, node: Node) -> Self {
        self.ops.push(ChangeOp::PutNode(node));
        self
    }
    pub fn put_edge(mut self, edge: Edge) -> Self {
        self.ops.push(ChangeOp::PutEdge(edge));
        self
    }
    pub fn remove_node(mut self, entity_id: &str, reason: &str, ts: u64) -> Self {
        self.ops.push(ChangeOp::RemoveNode {
            entity_id: entity_id.into(),
            reason: reason.into(),
            ts,
        });
        self
    }
    pub fn remove_edge(mut self, entity_id: &str, reason: &str, ts: u64) -> Self {
        self.ops.push(ChangeOp::RemoveEdge {
            entity_id: entity_id.into(),
            reason: reason.into(),
            ts,
        });
        self
    }
    /// Revision-fenced variant of [`Self::remove_node`]. The op is a no-op
    /// against a source whose provenance revision is newer than `max_revision`.
    pub fn remove_node_fenced(
        mut self,
        entity_id: &str,
        max_revision: u64,
        reason: &str,
        ts: u64,
    ) -> Self {
        self.ops.push(ChangeOp::RemoveNodeFenced {
            entity_id: entity_id.into(),
            max_revision,
            reason: reason.into(),
            ts,
        });
        self
    }
    pub fn merge(mut self, duplicate_id: &str, canonical_id: &str, reason: &str, ts: u64) -> Self {
        self.ops.push(ChangeOp::MergeNodes {
            duplicate_id: duplicate_id.into(),
            canonical_id: canonical_id.into(),
            reason: reason.into(),
            ts,
        });
        self
    }
    pub fn split(
        mut self,
        source_id: &str,
        new_node: Node,
        edge_ids: Vec<String>,
        ts: u64,
    ) -> Self {
        self.ops.push(ChangeOp::SplitNode {
            source_id: source_id.into(),
            new_node,
            edge_ids,
            ts,
        });
        self
    }
}

/// Memory of which change set ids were already applied. The ledger is the
/// idempotency boundary; it is process state and is not serialized, so the
/// journal format stays unchanged.
#[derive(Clone, Debug, Default)]
pub struct ApplyLedger {
    applied: BTreeSet<String>,
}

impl ApplyLedger {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn contains(&self, change_set_id: &str) -> bool {
        self.applied.contains(change_set_id)
    }
    pub fn len(&self) -> usize {
        self.applied.len()
    }
    pub fn is_empty(&self) -> bool {
        self.applied.is_empty()
    }
}

/// Result of applying one change set.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ApplyReport {
    pub change_set_id: String,
    /// True when this change set id was already applied and nothing ran.
    pub duplicate: bool,
    /// Ops that changed graph state.
    pub applied: usize,
    /// Ops that were no-ops against the current graph (e.g. removing an
    /// already-absent entity). Tombstones are still recorded for skips.
    pub skipped: usize,
    /// Every entity id touched directly or via index rebuild.
    pub invalidation_set: BTreeSet<String>,
    /// Tombstone records produced by this apply, in op order.
    pub tombstones: Vec<Tombstone>,
}

fn check_id(id: &str, what: &str) -> Result<()> {
    if id.is_empty() {
        return Err(Error::Invalid(format!("change set {what}: empty id")));
    }
    Ok(())
}

fn snapshot_incident(graph: &Graph, id: &str) -> Result<Vec<Edge>> {
    let mut out = Vec::new();
    for e in graph.outgoing(id, None)? {
        out.push(e.clone());
    }
    for e in graph.incoming(id, None)? {
        out.push(e.clone());
    }
    Ok(out)
}

/// Remove one entity and its incident edges, recording the deletion. Shared by
/// the plain and the revision-fenced remove ops so both leave exactly the same
/// tombstone, invalidation set and counters.
fn remove_entity(
    graph: &mut Graph,
    entity_id: &str,
    reason: &str,
    ts: u64,
    report: &mut ApplyReport,
) -> Result<()> {
    // Tombstones are records, not erases: record before touching the
    // graph so even a skip leaves the deletion statement behind.
    report.tombstones.push(Tombstone {
        entity_id: entity_id.into(),
        reason: reason.into(),
        ts,
    });
    if graph.node(entity_id).is_none() {
        report.skipped += 1;
        report.invalidation_set.insert(entity_id.into());
        return Ok(());
    }
    for e in snapshot_incident(graph, entity_id)? {
        report.invalidation_set.insert(e.id.clone());
        if e.from != entity_id {
            report.invalidation_set.insert(e.from.clone());
        }
        if e.to != entity_id {
            report.invalidation_set.insert(e.to.clone());
        }
    }
    graph.remove_node(entity_id)?;
    report.invalidation_set.insert(entity_id.into());
    report.applied += 1;
    Ok(())
}

/// Apply one op against the graph, mutating the report as it goes.
fn apply_op(graph: &mut Graph, op: &ChangeOp, report: &mut ApplyReport) -> Result<()> {
    match op {
        ChangeOp::PutNode(n) => {
            check_id(&n.id, "PutNode")?;
            // Change-set ops may legitimately carry reserved hqkg.* record
            // properties (scoped provenance records); untrusted input must be
            // validated first via `scoped_graph::apply_scoped` or the importer.
            graph.put_node_importer(n.clone())?;
            report.invalidation_set.insert(n.id.clone());
            report.applied += 1;
        }
        ChangeOp::PutEdge(e) => {
            check_id(&e.id, "PutEdge")?;
            graph.put_edge_importer(e.clone())?;
            report.invalidation_set.insert(e.id.clone());
            report.invalidation_set.insert(e.from.clone());
            report.invalidation_set.insert(e.to.clone());
            report.applied += 1;
        }
        ChangeOp::RemoveNode {
            entity_id,
            reason,
            ts,
        } => {
            check_id(entity_id, "RemoveNode")?;
            return remove_entity(graph, entity_id, reason, *ts, report);
        }
        ChangeOp::RemoveNodeFenced {
            entity_id,
            max_revision,
            reason,
            ts,
        } => {
            check_id(entity_id, "RemoveNodeFenced")?;
            // Fail closed: an entity with no parsable provenance revision is
            // treated as newer than the fence and is never removed by it.
            let beyond_fence = graph.node(entity_id).map_or(false, |node| {
                node.properties
                    .get("hqkg.provenance.revision")
                    .and_then(|v| v.parse::<u64>().ok())
                    .map_or(true, |revision| revision > *max_revision)
            });
            if beyond_fence {
                report.tombstones.push(Tombstone {
                    entity_id: entity_id.clone(),
                    reason: format!(
                        "{reason} (held: source revision beyond fence {max_revision})"
                    ),
                    ts: *ts,
                });
                report.skipped += 1;
                report.invalidation_set.insert(entity_id.clone());
                return Ok(());
            }
            return remove_entity(graph, entity_id, reason, *ts, report);
        }
        ChangeOp::RemoveEdge {
            entity_id,
            reason,
            ts,
        } => {
            check_id(entity_id, "RemoveEdge")?;
            report.tombstones.push(Tombstone {
                entity_id: entity_id.clone(),
                reason: reason.clone(),
                ts: *ts,
            });
            match graph.edge(entity_id) {
                Some(e) => {
                    report.invalidation_set.insert(e.id.clone());
                    report.invalidation_set.insert(e.from.clone());
                    report.invalidation_set.insert(e.to.clone());
                }
                None => {
                    report.invalidation_set.insert(entity_id.clone());
                }
            }
            if graph.remove_edge(entity_id)? {
                report.applied += 1;
            } else {
                report.skipped += 1;
            }
        }
        ChangeOp::MergeNodes {
            duplicate_id,
            canonical_id,
            reason,
            ts,
        } => {
            check_id(duplicate_id, "MergeNodes")?;
            check_id(canonical_id, "MergeNodes")?;
            if duplicate_id == canonical_id {
                return Err(Error::Invalid(format!(
                    "merge: duplicate and canonical are the same node {duplicate_id}"
                )));
            }
            if graph.node(duplicate_id).is_none() {
                return Err(Error::Missing(format!("merge duplicate {duplicate_id}")));
            }
            if graph.node(canonical_id).is_none() {
                return Err(Error::Missing(format!("merge canonical {canonical_id}")));
            }
            for mut e in snapshot_incident(graph, duplicate_id)? {
                if e.from == *duplicate_id {
                    e.from = canonical_id.clone();
                }
                if e.to == *duplicate_id {
                    e.to = canonical_id.clone();
                }
                // Re-pointed edges keep their existing properties, which may
                // include reserved hqkg.* provenance on scoped records.
                graph.put_edge_importer(e.clone())?;
                report.invalidation_set.insert(e.id.clone());
            }
            graph.remove_node(duplicate_id)?;
            report.invalidation_set.insert(duplicate_id.clone());
            report.invalidation_set.insert(canonical_id.clone());
            report.tombstones.push(Tombstone {
                entity_id: duplicate_id.clone(),
                reason: reason.clone(),
                ts: *ts,
            });
            report.applied += 1;
        }
        ChangeOp::SplitNode {
            source_id,
            new_node,
            edge_ids,
            ts: _,
        } => {
            check_id(source_id, "SplitNode")?;
            check_id(&new_node.id, "SplitNode")?;
            if graph.node(source_id).is_none() {
                return Err(Error::Missing(format!("split source {source_id}")));
            }
            if graph.node(&new_node.id).is_some() {
                return Err(Error::Conflict(format!(
                    "split target {} already exists",
                    new_node.id
                )));
            }
            for edge_id in edge_ids {
                let e = graph
                    .edge(edge_id)
                    .ok_or_else(|| Error::Missing(format!("split edge {edge_id}")))?;
                if e.from != *source_id && e.to != *source_id {
                    return Err(Error::Invalid(format!(
                        "split edge {edge_id} is not incident to {source_id}"
                    )));
                }
            }
            graph.put_node_importer(new_node.clone())?;
            report.invalidation_set.insert(new_node.id.clone());
            report.invalidation_set.insert(source_id.clone());
            for edge_id in edge_ids {
                let mut e = graph.edge(edge_id).expect("validated above").clone();
                let mut touched = BTreeSet::from([e.id.clone()]);
                if e.from == *source_id {
                    e.from = new_node.id.clone();
                    touched.insert(e.to.clone());
                }
                if e.to == *source_id {
                    e.to = new_node.id.clone();
                    touched.insert(e.from.clone());
                }
                graph.put_edge_importer(e)?;
                report.invalidation_set.extend(touched);
            }
            report.applied += 1;
        }
    }
    Ok(())
}

/// Apply a change set against the graph. Idempotency: if `ledger` already
/// contains `change_set_id`, nothing is applied and the report is returned
/// with `duplicate: true`. A failed op aborts the apply with an error and the
/// change set is NOT recorded in the ledger, so it stays re-appliable after a
/// repair (ops applied before the failure may have mutated the graph; Put ops
/// are last-writer-wins, Remove ops are already-absent skips).
///
/// Internal-grade mutation path: ops are written through the importer-grade
/// write path, so reserved `hqkg.*` properties pass through unchanged. This is
/// required for scoped provenance records and merge/split preservation of
/// existing record properties; callers accepting untrusted change sets must
/// validate them first (`scoped_graph::apply_scoped`), which enforces the
/// record contract on every `hqkg.*` property.
pub fn apply(
    graph: &mut Graph,
    cs: &GraphChangeSet,
    ledger: &mut ApplyLedger,
) -> Result<ApplyReport> {
    check_id(&cs.change_set_id, "change_set_id")?;
    if ledger.contains(&cs.change_set_id) {
        return Ok(ApplyReport {
            change_set_id: cs.change_set_id.clone(),
            duplicate: true,
            applied: 0,
            skipped: 0,
            invalidation_set: BTreeSet::new(),
            tombstones: Vec::new(),
        });
    }
    let mut report = ApplyReport {
        change_set_id: cs.change_set_id.clone(),
        duplicate: false,
        applied: 0,
        skipped: 0,
        invalidation_set: BTreeSet::new(),
        tombstones: Vec::new(),
    };
    for (index, op) in cs.ops.iter().enumerate() {
        apply_op(graph, op, &mut report).map_err(|e| {
            Error::Invalid(format!(
                "change set {} op {index} ({:?}): {e}",
                cs.change_set_id, op
            ))
        })?;
    }
    ledger.applied.insert(cs.change_set_id.clone());
    Ok(report)
}

/// Walk the parent chain of `leaf_id` across `sets`, leaf first. Fails on a
/// missing parent or any cycle (including a self-parent).
pub fn lineage_chain<'a>(sets: &'a [GraphChangeSet], leaf_id: &str) -> Result<Vec<&'a str>> {
    let by_id: BTreeMap<&str, &GraphChangeSet> = sets
        .iter()
        .map(|cs| (cs.change_set_id.as_str(), cs))
        .collect();
    let mut chain = Vec::new();
    let mut seen = BTreeSet::new();
    let mut current = by_id
        .get(leaf_id)
        .ok_or_else(|| Error::Missing(format!("change set {leaf_id}")))?;
    loop {
        if !seen.insert(current.change_set_id.as_str()) {
            return Err(Error::Conflict(format!(
                "change set lineage cycle at {}",
                current.change_set_id
            )));
        }
        chain.push(current.change_set_id.as_str());
        match &current.parent_change_set_id {
            None => return Ok(chain),
            Some(parent) => {
                current = by_id
                    .get(parent.as_str())
                    .ok_or_else(|| Error::Missing(format!("parent change set {parent}")))?;
            }
        }
    }
}

/// Length of the lineage chain from `leaf_id` to its root (1 for a root).
pub fn lineage_depth(sets: &[GraphChangeSet], leaf_id: &str) -> Result<usize> {
    Ok(lineage_chain(sets, leaf_id)?.len())
}
