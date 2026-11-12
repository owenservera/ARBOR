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
    out
}

/// Detect duplicate candidates using exact signals only. Output is
/// deterministic: pairs sorted by `(id_a, id_b)`, signals in a fixed order
/// (title, property keys, shared neighbors). O(n^2) over node count for the
/// shared-neighbor pass; suitable for the current graph sizes.
pub fn find_duplicates(g: &Graph) -> Vec<DuplicateCandidate> {
    // id -> normalized title / sorted property keys.
    let mut by_title: BTreeMap<String, Vec<String>> = BTreeMap::new();
    let mut by_keys: BTreeMap<Vec<String>, Vec<String>> = BTreeMap::new();
    let ids: Vec<String> = g.nodes().map(|n| n.id.clone()).collect();
    for id in &ids {
        let n = g.node(id).expect("id came from the graph");
        by_title
            .entry(normalize_title(&n.title))
            .or_default()
            .push(id.clone());
        if !n.properties.is_empty() {
            by_keys
                .entry(n.properties.keys().cloned().collect())
                .or_default()
                .push(id.clone());
        }
    }

    let mut candidates: BTreeMap<(String, String), Vec<DuplicateSignal>> = BTreeMap::new();
    let record = |a: &str,
                  b: &str,
                  s: DuplicateSignal,
                  out: &mut BTreeMap<(String, String), Vec<DuplicateSignal>>| {
        let key = if a <= b {
            (a.to_string(), b.to_string())
        } else {
            (b.to_string(), a.to_string())
        };
        out.entry(key).or_default().push(s);
    };

    for (title, group) in &by_title {
        if group.len() < 2 {
            continue;
        }
        for i in 0..group.len() {
            for j in i + 1..group.len() {
                record(
                    &group[i],
                    &group[j],
                    DuplicateSignal::TitleMatch {
                        normalized_title: title.clone(),
                    },
                    &mut candidates,
                );
            }
        }
    }
    for (keys, group) in &by_keys {
        if group.len() < 2 {
            continue;
        }
        for i in 0..group.len() {
            for j in i + 1..group.len() {
                record(
                    &group[i],
                    &group[j],
                    DuplicateSignal::PropertyKeySetMatch { keys: keys.clone() },
                    &mut candidates,
                );
            }
        }
    }

    let neighbors: BTreeMap<&str, BTreeSet<String>> = ids
        .iter()
        .map(|id| (id.as_str(), neighbor_set(g, id)))
        .collect();
    for i in 0..ids.len() {
        for j in i + 1..ids.len() {
            let shared = neighbors[ids[i].as_str()]
                .intersection(&neighbors[ids[j].as_str()])
                .count();
            if shared >= SHARED_NEIGHBOR_THRESHOLD {
                record(
                    &ids[i],
                    &ids[j],
                    DuplicateSignal::SharedNeighbors { count: shared },
                    &mut candidates,
                );
            }
        }
    }

    candidates
        .into_iter()
        .map(|((a, b), signals)| DuplicateCandidate {
            id_a: a,
            id_b: b,
            signals,
        })
        .collect()
}

/// Node ids with zero incident edges (both derived indexes empty), sorted,
/// excluding kinds in `allowlist` that are legitimately standalone.
pub fn find_orphans(g: &Graph, allowlist: &[NodeKind]) -> Vec<String> {
    let mut orphans = Vec::new();
    for n in g.nodes() {
        if allowlist.iter().any(|k| k == &n.kind) {
            continue;
        }
        if g.outgoing(&n.id, None).map_or(true, |e| e.is_empty())
            && g.incoming(&n.id, None).map_or(true, |e| e.is_empty())
        {
            orphans.push(n.id.clone());
        }
    }
    orphans
}

/// Deterministic winner: highest `version`, ties broken by smallest id.
fn canonical_of<'a>(members: &[&'a String], g: &'a Graph) -> Result<&'a str> {
    let mut best: Option<(&str, u64)> = None;
    for id in members {
        let n = g
            .node(id)
            .ok_or_else(|| Error::Missing(format!("reconcile node {id}")))?;
        let better = match best {
            None => true,
            Some((bid, bv)) => n.version > bv || (n.version == bv && n.id.as_str() < bid),
        };
        if better {
            best = Some((n.id.as_str(), n.version));
        }
    }
    best.map(|(id, _)| id)
        .ok_or_else(|| Error::Invalid("empty duplicate cluster".into()))
}

/// Build a merge plan from detected duplicates. Candidates referencing
/// nodes absent from `g` (stale detection) are skipped, not an error.
/// Duplicates are grouped into clusters (transitively), so every op merges
/// a live loser into a live canonical and `graph_change_set::apply` runs
/// with zero Err. `change_set_id` is deterministic on the graph epoch.
pub fn reconciliation_plan(g: &Graph, dups: &[DuplicateCandidate]) -> Result<GraphChangeSet> {
    // Union-find over candidate pairs, restricted to nodes still present.
    let mut parent: BTreeMap<String, String> = BTreeMap::new();
    fn find(parent: &mut BTreeMap<String, String>, mut x: String) -> String {
        while let Some(p) = parent.get(&x) {
            if *p == x {
                break;
            }
            x = p.clone();
        }
        x
    }
    let union = |parent: &mut BTreeMap<String, String>, a: &str, b: &str| {
        let (ra, rb) = (find(parent, a.to_string()), find(parent, b.to_string()));
        if ra != rb {
            let (lo, hi) = if ra <= rb { (ra, rb) } else { (rb, ra) };
            parent.insert(hi, lo);
        }
    };
    for c in dups {
        if c.id_a == c.id_b {
            continue;
        }
        if g.node(&c.id_a).is_none() || g.node(&c.id_b).is_none() {
            continue; // stale candidate: skip, never fail the plan
        }
        for id in [&c.id_a, &c.id_b] {
            parent.entry(id.clone()).or_insert(id.clone());
        }
        union(&mut parent, &c.id_a, &c.id_b);
    }

    // Cluster members keyed by root.
    let mut clusters: BTreeMap<String, Vec<String>> = BTreeMap::new();
    let keys: Vec<String> = parent.keys().cloned().collect();
    for id in keys {
        let root = find(&mut parent, id.clone());
        clusters.entry(root).or_default().push(id);
    }

    let mut cs = GraphChangeSet::new(format!("reconcile-{}", g.epoch()), "reconcile://local");
    let ts = g.epoch();
    for (_root, mut members) in clusters {
        members.sort();
        let canonical = canonical_of(&members.iter().collect::<Vec<_>>(), g)?;
        for member in &members {
            if member == canonical {
                continue;
            }
            let signals: Vec<DuplicateSignal> = dups
                .iter()
                .filter(|c| {
                    (c.id_a == *member || c.id_b == *member)
                        && (g.node(&c.id_a).is_some() && g.node(&c.id_b).is_some())
                })
                .flat_map(|c| c.signals.clone())
                .collect();
            let reason = format!(
                "reconcile: merged duplicate {member} into canonical {canonical} (signals: {signals:?})"
            );
            cs = cs.merge(member, canonical, &reason, ts);
        }
    }
    Ok(cs)
}
