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
    pub watermark: Option<BTreeMap<String, u64>>,
}

/// An incident edge retained only when both endpoints were retrieved.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ContextEdge {
    pub id: String,
    pub from: String,
    pub to: String,
    pub relation: String,
}

/// Pure retrieval result; no I/O. JSON field mapping (requestEcho, tokensUsed,
/// budgetExhausted, staleCount) stays on the Bun side, as in the pilot.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ContextBundle {
    pub request_echo: ContextRequest,
    pub items: Vec<ContextItem>,
    pub edges: Vec<ContextEdge>,
    pub tokens_used: u64,
    /// True when at least one ranked candidate was dropped because the next
    /// item would have exceeded `budget_tokens`.
    pub budget_exhausted: bool,
    pub stale_count: usize,
    /// Graph epoch captured at retrieval time.
    pub epoch: u64,
}

/// Estimated tokens for one node item:
/// `(title.len + properties serialized estimate + id.len) / 4`, minimum 1.
/// The property estimate charges key + value bytes plus 2 bytes per entry for
/// separators. This is a deterministic lower-fidelity proxy, not a tokenizer.
fn estimate_tokens(node: &Node) -> u64 {
    let props: usize = node
        .properties
        .iter()
        .map(|(k, v)| k.len() + v.len() + 2)
        .sum();
    let bytes = node.title.len() + props + node.id.len();
    (bytes as u64 / 4).max(1)
}

/// Rank rule (deterministic): depth from the nearest seed ascending, then node
/// version descending (richest history first), then id ascending as the final
/// tie-break. Same input graph + request therefore always yields the same order.
///
/// When `seed_order` is supplied, depth-0 seeds are emitted in that relevance
/// order first; every other node keeps the rule above. This keeps seed
/// relevance separate from recency without changing `retrieve`.
fn ranked_ids(
    graph: &Graph,
    depth: &BTreeMap<String, usize>,
    seed_order: Option<&BTreeMap<String, usize>>,
) -> Vec<String> {
    let mut ranked: Vec<(usize, u64, String)> = depth
        .iter()
        .map(|(id, d)| (*d, graph.node(id).map_or(0, |n| n.version), id.clone()))
        .collect();
    ranked.sort_by(|a, b| a.0.cmp(&b.0).then(b.1.cmp(&a.1)).then(a.2.cmp(&b.2)));
    let ranked: Vec<String> = ranked.into_iter().map(|(_, _, id)| id).collect();
    let order = match seed_order {
        Some(order) => order,
        None => return ranked,
    };
    let mut seeds: Vec<String> = ranked
        .iter()
        .filter(|id| depth.get(id.as_str()) == Some(&0) && order.contains_key(id.as_str()))
        .cloned()
        .collect();
    seeds.sort_by_key(|id| order[id.as_str()]);
    let rest = ranked
        .into_iter()
        .filter(|id| !(depth.get(id.as_str()) == Some(&0) && order.contains_key(id.as_str())));
    seeds.extend(rest);
    seeds
}

/// Retrieve a provenance-carrying, token-bounded context bundle for the seeds.
///
/// Fail-closed (web-feed convention): empty seeds, a zero budget, a seed that
/// is also excluded, or an unknown seed id are all errors — never an empty
/// bundle. Selection is a multi-source BFS across `outgoing` and `incoming`,
/// capped at [`MAX_DEPTH`]. Excluded ids are never visited and never appear as
/// edge endpoints.
pub fn retrieve(graph: &Graph, request: &ContextRequest) -> Result<ContextBundle> {
    retrieve_inner(graph, request, None, None)
}

/// Scoped, relevance-ordered retrieval.
///
/// Fails closed on an empty scope, an empty seed list, a zero budget, a zero
/// `max_items`, a seed outside `scope`, an excluded seed or an unknown seed.
/// Selection runs the same bounded multi-source BFS as [`retrieve`] but never
/// leaves `scope`, and the returned items are the relevance-ordered prefix that
/// fits both `budget_tokens` and `max_items`.
pub fn query_scoped(graph: &Graph, query: &ScopedQuery) -> Result<ContextBundle> {
    if query.scope.is_empty() {
        return Err(Error::Invalid("scoped query needs a non-empty scope".into()));
    }
    if query.max_items == 0 {
        return Err(Error::Invalid("max_items must be at least 1".into()));
    }
    // First occurrence wins, so the caller's relevance order is the rank.
    let mut order: BTreeMap<String, usize> = BTreeMap::new();
    for (index, seed) in query.seeds.iter().enumerate() {
        order.entry(seed.clone()).or_insert(index);
    }
    let request = ContextRequest {
        seeds: query.seeds.clone(),
        budget_tokens: query.budget_tokens,
        excluded: query.excluded.clone(),
        watermark: query.watermark.clone(),
    };
    let mut bundle = retrieve_inner(graph, &request, Some(&query.scope), Some(&order))?;
    if bundle.items.len() > query.max_items {
        bundle.items.truncate(query.max_items);
        let selected: BTreeSet<&str> = bundle.items.iter().map(|i| i.id.as_str()).collect();
        bundle
            .edges
            .retain(|e| selected.contains(e.from.as_str()) && selected.contains(e.to.as_str()));
        bundle.tokens_used = bundle.items.iter().map(|i| i.tokens).sum();
        bundle.stale_count = bundle.items.iter().filter(|i| i.stale).count();
        // A ranked candidate was dropped by the output bound, not by the graph.
        bundle.budget_exhausted = true;
    }
    Ok(bundle)
}

/// Shared bounded retrieval. `scope` restricts seeds and traversal to one
/// authorized id prefix; `seed_order` ranks depth-0 seeds by caller relevance.
fn retrieve_inner(
    graph: &Graph,
    request: &ContextRequest,
    scope: Option<&str>,
    seed_order: Option<&BTreeMap<String, usize>>,
) -> Result<ContextBundle> {
    if request.seeds.is_empty() {
        return Err(Error::Invalid(
            "context request needs at least one seed".into(),
        ));
    }
    if request.budget_tokens == 0 {
        return Err(Error::Invalid("budget_tokens must be at least 1".into()));
    }
    let in_scope = |id: &str| scope.map_or(true, |prefix| id.starts_with(prefix));
    for seed in &request.seeds {
        if request.excluded.contains(seed) {
            return Err(Error::Invalid(format!("seed {seed} is also excluded")));
        }
        if !in_scope(seed) {
            return Err(Error::Invalid(format!(
                "seed {seed} is outside the authorized scope"
            )));
        }
        if graph.node(seed).is_none() {
            return Err(Error::Missing(seed.clone()));
        }
    }
    // Bounded multi-source BFS; first visit pins the minimum depth.
    let mut depth: BTreeMap<String, usize> = BTreeMap::new();
    let mut pending: VecDeque<String> = VecDeque::new();
    for seed in &request.seeds {
        depth.insert(seed.clone(), 0);
        pending.push_back(seed.clone());
    }
    while let Some(id) = pending.pop_front() {
        let d = depth[&id];
        if d >= MAX_DEPTH {
            continue;
        }
        let mut neighbours: BTreeSet<String> = BTreeSet::new();
        for edge in graph.outgoing(&id, None)? {
            neighbours.insert(edge.to.clone());
        }
        for edge in graph.incoming(&id, None)? {
            neighbours.insert(edge.from.clone());
        }
        for next in neighbours {
            if request.excluded.contains(&next) || !in_scope(&next) {
                continue;
            }
            if !depth.contains_key(&next) {
                depth.insert(next.clone(), d + 1);
                pending.push_back(next);
            }
        }
    }
    // Greedy fill in rank order; the next item that would exceed the budget
    // stops inclusion, so items are always a prefix of the ranked list.
    let mut items: Vec<ContextItem> = Vec::new();
    let mut used: u64 = 0;
    let mut budget_exhausted = false;
    for id in ranked_ids(graph, &depth, seed_order) {
        let node = match graph.node(&id) {
            Some(n) => n,
            None => {
                return Err(Error::Corrupt(format!(
                    "node vanished during retrieval: {id}"
                )))
            }
        };
        let tokens = estimate_tokens(node);
        if used.saturating_add(tokens) > request.budget_tokens {
            budget_exhausted = true;
            break;
        }
        let (stale, watermark_version) = match request.watermark.as_ref().and_then(|w| w.get(&id)) {
            Some(&seen) if seen != node.version => (true, Some(seen)),
            Some(&seen) => (false, Some(seen)),
            None => (false, None),
        };
        used += tokens;
        items.push(ContextItem {
            id: node.id.clone(),
            title: node.title.clone(),
            depth: depth[&id],
            tokens,
            sources: node.sources.clone(),
            version: node.version,
            stale,
            watermark_version,
        });
    }
    // Edges ride along only when both endpoints were retrieved, so an excluded
    // or out-of-horizon node is never leaked through an edge endpoint.
    let selected: BTreeSet<&str> = items.iter().map(|i| i.id.as_str()).collect();
    // Walk existing outgoing indexes only for retrieved nodes rather than
    // scanning every graph edge after every bounded context request. BTreeMap
    // retains the original edge-id order, including self-loops.
    let mut indexed_edges = BTreeMap::new();
    for id in &selected {
        for e in graph.outgoing(id, None)? {
            if selected.contains(e.to.as_str()) {
                indexed_edges.insert(e.id.clone(), ContextEdge {
                    id: e.id.clone(),
                    from: e.from.clone(),
                    to: e.to.clone(),
                    relation: e.relation.clone(),
                });
            }
        }
    }
    let edges = indexed_edges.into_values().collect();
    let stale_count = items.iter().filter(|i| i.stale).count();
    Ok(ContextBundle {
        request_echo: request.clone(),
        items,
        edges,
        tokens_used: used,
        budget_exhausted,
        stale_count,
        epoch: graph.epoch(),
    })
}
