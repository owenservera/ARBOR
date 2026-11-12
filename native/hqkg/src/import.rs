//! @hq:context Deterministic HQKGX1 JSONL importer; optional dependencies stay out of std-only kernel.
//! @hq:owner repos-hq
//! @hq:invariant Data-only transport cannot install engines, approve actions or overwrite manually owned nodes.
//! @hq:invariant Validate all transport bytes before changing the graph; one journal snapshot per accepted import.
use crate::{Edge, Error, Graph, Node, NodeKind, Properties, Result};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

pub const SCHEMA: &str = "repos-hq.hqkg-exchange/1";
pub const MAX_BYTES: usize = 128 * 1024 * 1024;
pub const MAX_NODES: usize = 250_000;
pub const MAX_EDGES: usize = 1_000_000;
pub const MAX_TOMBSTONES: usize = 250_000;
const OWNER_KEY: &str = "hqkg.exchange.source";
const SCHEMA_KEY: &str = "hqkg.exchange.schema";
const KIND_KEY: &str = "hqkg.exchange.kind";

/// Monotone record phase within one exchange body: nodes, then edges, then
/// tombstones. A record may only appear in its own phase or a later one.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Phase {
    Nodes,
    Edges,
    Tombstones,
}

#[derive(Clone, Debug)]
pub struct Manifest {
    pub source: String,
    pub digest: String,
    pub node_count: usize,
    pub edge_count: usize,
    /// Optional in the transport (older manifests omit it); enforced when present.
    pub tombstone_count: usize,
    /// Optional in the transport; false unless the manifest opts in. When true,
    /// apply() deletes this source's own edges that the exchange omits (edge
    /// reconciliation). Nodes are never auto-removed by reconciliation.
    pub reconcile_edges: bool,
}
#[derive(Clone, Debug)]
pub struct Exchange {
    pub manifest: Manifest,
    pub nodes: BTreeMap<String, Node>,
    pub edges: BTreeMap<String, Edge>,
    /// Source-owned deletions. Record phases are monotone (nodes, then edges,
    /// then tombstones), so deletion rows come last; each targets exactly one
    /// previously imported node of this same source namespace.
    pub tombstones: BTreeSet<String>,
}
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ImportStats {
    pub nodes_inserted: usize,
    pub nodes_updated: usize,
    pub nodes_unchanged: usize,
    pub nodes_deleted: usize,
    pub edges_inserted: usize,
    pub edges_updated: usize,
    pub edges_unchanged: usize,
    pub edges_deleted: usize,
}
impl ImportStats {
    pub fn changed(&self) -> bool {
        self.nodes_inserted
            + self.nodes_updated
            + self.nodes_deleted
            + self.edges_inserted
            + self.edges_updated
            + self.edges_deleted
            > 0
    }
}

fn obj<'a>(v: &'a Value, label: &str) -> Result<&'a Map<String, Value>> {
    v.as_object()
        .ok_or_else(|| Error::Invalid(format!("{label} must be a JSON object")))
}
fn req_str<'a>(m: &'a Map<String, Value>, k: &str) -> Result<&'a str> {
    m.get(k)
        .and_then(Value::as_str)
        .ok_or_else(|| Error::Invalid(format!("required string field: {k}")))
}
fn req_usize(m: &Map<String, Value>, k: &str, max: usize) -> Result<usize> {
    let n = m
        .get(k)
        .and_then(Value::as_u64)
        .ok_or_else(|| Error::Invalid(format!("required integer field: {k}")))?;
    if n > max as u64 {
        return Err(Error::Invalid(format!("{k} exceeds limit")));
    }
    Ok(n as usize)
}
fn string_id(s: &str) -> Result<()> {
    if s.is_empty() || s.len() > 256 || s.chars().any(char::is_control) {
        return Err(Error::Invalid("invalid or oversized graph identity".into()));
    }
    Ok(())
}
fn source(s: &str) -> Result<()> {
    if s.is_empty() || s.len() > 256 || s.chars().any(char::is_control) {
        return Err(Error::Invalid("invalid source namespace".into()));
    }
    Ok(())
}
fn meta(m: &Map<String, Value>) -> Result<Properties> {
    let mut props = Properties::new();
    let values = match m.get("metadata") {
        Some(v) => obj(v, "metadata")?,
        None => return Ok(props),
    };
    if values.len() > 256 {
        return Err(Error::Invalid("metadata key count limit".into()));
    }
    let mut length = 0usize;
    for (k, v) in values {
        let lower = k.to_ascii_lowercase();
        if k.starts_with("hqkg.")
            || [
                "password",
                "credential",
                "token",
                "cookie",
                "secret",
                "api_key",
                "private_key",
                "authorization",
            ]
            .iter()
            .any(|p| lower.contains(p))
        {
            return Err(Error::Invalid(format!(
                "reserved or sensitive metadata key: {k}"
            )));
        }
        if k.is_empty() || k.len() > 256 || k.chars().any(char::is_control) {
            return Err(Error::Invalid("invalid metadata key".into()));
        }
        let value = match v {
            Value::String(s) => s.clone(),
            Value::Number(n) => n.to_string(),
            Value::Bool(v) => v.to_string(),
            _ => {
                return Err(Error::Invalid(
                    "metadata values must be scalar strings, numbers, or booleans".into(),
                ))
            }
        };
        length = length.saturating_add(k.len()).saturating_add(value.len());
        if value.len() > 1024 || length > 65536 {
            return Err(Error::Invalid("metadata size limit".into()));
        }
        props.insert(k.clone(), value);
    }
    Ok(props)
}
pub fn parse(data: &[u8]) -> Result<Exchange> {
    if data.is_empty() || data.len() > MAX_BYTES {
        return Err(Error::Invalid("exchange byte size out of bounds".into()));
    }
    let text =
        std::str::from_utf8(data).map_err(|_| Error::Corrupt("exchange is not UTF-8".into()))?;
    if !text.ends_with('\n') {
        return Err(Error::Corrupt("exchange must end in newline".into()));
    }
    let first_newline = text
        .find('\n')
        .ok_or_else(|| Error::Corrupt("missing manifest newline".into()))?;
    let head = &text[..first_newline];
    let body = &text[first_newline + 1..];
    let manifest_value: Value = serde_json::from_str(head)
        .map_err(|e| Error::Corrupt(format!("invalid manifest JSON: {e}")))?;
    let manifest_obj = obj(&manifest_value, "manifest")?;
    if req_str(manifest_obj, "type")? != "manifest" || req_str(manifest_obj, "schema")? != SCHEMA {
        return Err(Error::Unsupported(
            "unsupported HQKG exchange schema".into(),
        ));
    }
    let source_id = req_str(manifest_obj, "source")?.to_owned();
    source(&source_id)?;
    if req_str(manifest_obj, "authority")? != "data-only; no executable code or provider actions" {
        return Err(Error::Invalid(
            "exchange must explicitly be data-only".into(),
        ));
    }
    let digest = req_str(manifest_obj, "graph_sha256")?.to_owned();
    if digest.len() != 64
        || !digest
            .bytes()
            .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
    {
        return Err(Error::Invalid(
            "manifest SHA-256 digest not lowercase hex".into(),
        ));
    }
    let actual = format!("{:x}", Sha256::digest(body.as_bytes()));
    if digest != actual {
        return Err(Error::Corrupt("SHA-256 record payload mismatch".into()));
    }
    let node_count = req_usize(manifest_obj, "node_count", MAX_NODES)?;
    let edge_count = req_usize(manifest_obj, "edge_count", MAX_EDGES)?;
    // Older exchanges predate tombstones; the field stays optional in transport.
    let tombstone_count = match manifest_obj.get("tombstone_count") {
        Some(Value::Null) | None => 0,
        Some(_) => req_usize(manifest_obj, "tombstone_count", MAX_TOMBSTONES)?,
    };
    // Older exchanges predate edge reconciliation; the field stays optional and
    // defaults to false so legacy manifests behave exactly as before. A true
    // flag still faces the same MAX_EDGES count enforcement above.
    let reconcile_edges = match manifest_obj.get("reconcile_edges") {
        Some(Value::Null) | None => false,
        Some(Value::Bool(b)) => *b,
        Some(_) => return Err(Error::Invalid("reconcile_edges must be a boolean".into())),
    };
    let manifest = Manifest {
        source: source_id.clone(),
        digest,
        node_count,
        edge_count,
        tombstone_count,
        reconcile_edges,
    };
    let mut nodes = BTreeMap::new();
    let mut edges = BTreeMap::new();
    let mut tombstones = BTreeSet::new();
    // Record phases are monotone: nodes, then edges, then tombstones. A record
    // may never re-open an earlier phase, so an edge can never follow a
    // tombstone and a node can never follow either.
    let mut phase = Phase::Nodes;
    for line in body.split_terminator('\n') {
        if line.is_empty() || line.ends_with('\r') {
            return Err(Error::Corrupt("unexpected blank or CRLF record".into()));
        }
        let value: Value = serde_json::from_str(line)
            .map_err(|e| Error::Corrupt(format!("invalid record JSON: {e}")))?;
        let map = obj(&value, "exchange record")?;
        let kind = req_str(map, "type")?;
        let id = req_str(map, "id")?;
        string_id(id)?;
        if !id.starts_with("hqg1:")
            || id.len() != 69
            || !id[5..]
                .bytes()
                .all(|x| x.is_ascii_hexdigit() && !x.is_ascii_uppercase())
        {
            return Err(Error::Invalid(format!("noncanonical bridge ID: {id}")));
        }
        match kind {
            "node" => {
                // Symmetric identity collision: a node may not re-declare an
                // identity this exchange already tombstoned, in either order.
                if tombstones.contains(id) {
                    return Err(Error::Conflict(format!(
                        "node redeclares an identity tombstoned in same exchange: {id}"
                    )));
                }
                if phase != Phase::Nodes {
                    return Err(Error::Invalid(
                        "nodes must precede edges and tombstones".into(),
                    ));
                }
                if nodes.len() >= MAX_NODES {
                    return Err(Error::Invalid("too many nodes".into()));
                }
                let node_kind = req_str(map, "kind")?;
                string_id(node_kind)?;
                let title = req_str(map, "title")?;
                if title.len() > 65536 {
                    return Err(Error::Invalid("oversized title".into()));
                }
                let mut n = Node::new(id, NodeKind::Other(node_kind.into()), title);
                n.properties = meta(map)?;
                n.properties.insert(OWNER_KEY.into(), source_id.clone());
                n.properties.insert(SCHEMA_KEY.into(), SCHEMA.into());
                n.properties.insert(KIND_KEY.into(), node_kind.into());
                n.sources.insert(format!("exchange:{}", source_id));
                if nodes.insert(id.to_string(), n).is_some() {
                    return Err(Error::Conflict(format!("duplicate node ID {id}")));
                }
            }
            "edge" => {
                if phase == Phase::Tombstones {
                    return Err(Error::Invalid("edges must precede tombstones".into()));
                }
                phase = Phase::Edges;
                if edges.len() >= MAX_EDGES {
                    return Err(Error::Invalid("too many edges".into()));
                }
                let from = req_str(map, "from")?;
                let to = req_str(map, "to")?;
                let relation = req_str(map, "relation")?;
                string_id(from)?;
                string_id(to)?;
                string_id(relation)?;
                let weight = req_usize(map, "weight", u32::MAX as usize)? as u32;
                if weight == 0 {
                    return Err(Error::Invalid("edge weight must be positive".into()));
                }
                let mut e = Edge::new(id, from, relation, to);
                e.weight = weight;
                e.properties = meta(map)?;
                e.properties.insert(OWNER_KEY.into(), source_id.clone());
                if edges.insert(id.to_string(), e).is_some() {
                    return Err(Error::Conflict(format!("duplicate edge ID {id}")));
                }
            }
            "tombstone" => {
                // Deletion of one source-owned node. Must not also re-declare the
                // node in this same projection, in either record order.
                if tombstones.len() >= MAX_TOMBSTONES {
                    return Err(Error::Invalid("too many tombstones".into()));
                }
                if nodes.contains_key(id) {
                    return Err(Error::Conflict(format!(
                        "tombstone targets node declared in same exchange: {id}"
                    )));
                }
                if !tombstones.insert(id.to_string()) {
                    return Err(Error::Conflict(format!("duplicate tombstone ID {id}")));
                }
                phase = Phase::Tombstones;
            }
            _ => {
                return Err(Error::Unsupported(format!(
                    "unknown HQKG record type: {kind}"
                )))
            }
        }
    }
    if nodes.len() != manifest.node_count
        || edges.len() != manifest.edge_count
        || tombstones.len() != manifest.tombstone_count
    {
        return Err(Error::Corrupt(format!(
            "count mismatch: expected {}/{}/{} got {}/{}/{}",
            manifest.node_count,
            manifest.edge_count,
            manifest.tombstone_count,
            nodes.len(),
            edges.len(),
            tombstones.len()
        )));
    }
    // Every exported edge must point to a node in this source projection.
    // This catches source drift, not just missing endpoints in an existing runtime.
    for e in edges.values() {
        if !nodes.contains_key(&e.from) || !nodes.contains_key(&e.to) {
            return Err(Error::Corrupt(format!(
                "unresolved exchange endpoints: {}",
                e.id
            )));
        }
    }
    Ok(Exchange {
        manifest,
        nodes,
        edges,
        tombstones,
    })
}
impl Exchange {
    /// Apply to a temporary clone; caller saves the resulting journal exactly once.
    /// Source ownership checks forbid overwriting handwritten or other-producer IDs.
    pub fn apply(&self, graph: &mut Graph) -> Result<ImportStats> {
        let mut counts = ImportStats::default();
        for n in self.nodes.values() {
            if let Some(old) = graph.node(&n.id) {
                if old.properties.get(OWNER_KEY) != Some(&self.manifest.source) {
                    return Err(Error::Conflict(format!(
                        "source collision on node {}",
                        n.id
                    )));
                }
                if old.kind == n.kind
                    && old.title == n.title
                    && old.properties == n.properties
                    && old.sources == n.sources
                {
                    counts.nodes_unchanged += 1;
                    continue;
                }
                counts.nodes_updated += 1;
            } else {
                counts.nodes_inserted += 1;
            }
            // Importer-grade write: exchange records legitimately own the
            // reserved hqkg.exchange.* ownership properties.
            graph.put_node_importer(n.clone())?;
        }
        for e in self.edges.values() {
            if let Some(old) = graph.edge(&e.id) {
                if old.properties.get(OWNER_KEY) != Some(&self.manifest.source) {
                    return Err(Error::Conflict(format!(
                        "source collision on edge {}",
                        e.id
                    )));
                }
                if old == e {
                    counts.edges_unchanged += 1;
                    continue;
                }
                counts.edges_updated += 1;
            } else {
                counts.edges_inserted += 1;
            }
            graph.put_edge_importer(e.clone())?;
        }
        // Edge reconciliation (opt-in): the exchange is the authoritative full
        // projection of this source's edges, so any graph edge owned by this
        // source but absent from the exchange is stale and gets removed. Only
        // edges carrying this manifest's owner property are touched; other
        // producers' edges and all nodes are never auto-removed here (nodes go
        // through explicit tombstones only). Idempotent: on replay every stale
        // edge is already gone, so nothing is deleted and no epoch bump occurs.
        if self.manifest.reconcile_edges {
            let stale: Vec<String> = graph
                .edges()
                .filter(|e| {
                    e.properties.get(OWNER_KEY) == Some(&self.manifest.source)
                        && !self.edges.contains_key(&e.id)
                })
                .map(|e| e.id.clone())
                .collect();
            for id in stale {
                graph.remove_edge(&id)?;
                counts.edges_deleted += 1;
            }
        }
        // Tombstones last: a deletion only removes this source's own nodes, so a
        // renamed handwritten graph node can never be destroyed by an index export.
        for id in self.tombstones.iter() {
            let Some(old) = graph.node(id) else {
                continue; // already absent: idempotent no-op
            };
            if old.properties.get(OWNER_KEY) != Some(&self.manifest.source) {
                return Err(Error::Conflict(format!(
                    "tombstone targets node owned by another producer: {id}"
                )));
            }
            graph.remove_node(id)?;
            counts.nodes_deleted += 1;
        }
        Ok(counts)
    }
    pub fn verify_source_projection(&self, graph: &Graph) -> Result<()> {
        let node_ids: BTreeSet<&str> = self.nodes.keys().map(String::as_str).collect();
        for id in node_ids {
            if graph.node(id).is_none() {
                return Err(Error::Corrupt(format!("missing imported node {id}")));
            }
        }
        for id in self.edges.keys() {
            if graph.edge(id).is_none() {
                return Err(Error::Corrupt(format!("missing imported edge {id}")));
            }
        }
        Ok(())
    }
}
