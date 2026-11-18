//! HQ knowledge graph: std-only core, durable journal, graph algorithms.
//! Compute runtime and optional external databases are separate modules.
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fmt;
use std::fs::{self, OpenOptions};
use std::io::{self, Cursor, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

pub mod adapters;
pub mod algorithm_adapter;
pub mod apply_ledger;
pub mod builtins;
pub mod context_retrieval;
pub mod control;
pub mod database;
pub mod durable_dag;
pub mod engine;
pub mod graph_change_set;
#[cfg(feature = "importer")]
pub mod import;
pub mod invalidate;
pub mod observability;
pub mod reconcile;
pub mod scoped_graph;
pub mod typed_dag;
pub mod utility_adapter;
#[cfg(feature = "importer")]
pub mod web_memory;
pub use algorithm_adapter::{
    algorithm_by_id, algorithm_node_id, algorithm_slot, ensure_algorithm_node,
    record_algorithm_engine_swap, seed_algorithm_nodes, AlgorithmCompute, AlgorithmDriver,
    AlgorithmSpec, ALGORITHMS, ALGORITHM_INTERFACE,
};
pub use database::{DataTable, DatabaseKind, DatabaseSpec};
pub use engine::{
    Budget, CancellationToken, ComputeEngine, EngineDescriptor, EngineLease, EngineOutput,
    EngineRegistry, EngineRequest, Scheduler, SwapReceipt, Task,
};

#[derive(Debug)]
pub enum Error {
    Invalid(String),
    Missing(String),
    Conflict(String),
    Corrupt(String),
    Unsupported(String),
    Locked { holder: u32 },
    Io(io::Error),
}
pub type Result<T> = std::result::Result<T, Error>;
impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Invalid(s)
            | Self::Missing(s)
            | Self::Conflict(s)
            | Self::Corrupt(s)
            | Self::Unsupported(s) => write!(f, "{s}"),
            Self::Locked { holder } => write!(f, "apply ledger locked by pid {holder}"),
            Self::Io(e) => write!(f, "{e}"),
        }
    }
}
impl std::error::Error for Error {}
impl From<io::Error> for Error {
    fn from(e: io::Error) -> Self {
        Self::Io(e)
    }
}

pub type Properties = BTreeMap<String, String>;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum NodeKind {
    Fact,
    Concept,
    Document,
    Dataset,
    ComputeEngine,
    EngineSlot,
    Database,
    Other(String),
}
impl NodeKind {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Fact => "fact",
            Self::Concept => "concept",
            Self::Document => "document",
            Self::Dataset => "dataset",
            Self::ComputeEngine => "compute-engine",
            Self::EngineSlot => "engine-slot",
            Self::Database => "database",
            Self::Other(s) => s,
        }
    }
    pub fn from_str(s: &str) -> Self {
        match s {
            "fact" => Self::Fact,
            "concept" => Self::Concept,
            "document" => Self::Document,
            "dataset" => Self::Dataset,
            "compute-engine" => Self::ComputeEngine,
            "engine-slot" => Self::EngineSlot,
            "database" => Self::Database,
            x => Self::Other(x.to_owned()),
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Node {
    pub id: String,
    pub kind: NodeKind,
    pub title: String,
    pub properties: Properties,
    pub sources: BTreeSet<String>,
    pub version: u64,
}
impl Node {
    pub fn new(id: &str, kind: NodeKind, title: &str) -> Self {
        Self {
            id: id.into(),
            kind,
            title: title.into(),
            properties: Properties::new(),
            sources: BTreeSet::new(),
            version: 0,
        }
    }
    pub fn property(mut self, key: &str, value: &str) -> Self {
        self.properties.insert(key.into(), value.into());
        self
    }
    pub fn source(mut self, citation: &str) -> Self {
        self.sources.insert(citation.into());
        self
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Edge {
    pub id: String,
    pub from: String,
    pub to: String,
    pub relation: String,
    pub weight: u32,
    pub properties: Properties,
}
impl Edge {
    pub fn new(id: &str, from: &str, relation: &str, to: &str) -> Self {
        Self {
            id: id.into(),
            from: from.into(),
            to: to.into(),
            relation: relation.into(),
            weight: 1,
            properties: Properties::new(),
        }
    }
}
fn identity(id: &str) -> Result<()> {
    if id.is_empty() || id.len() > 256 || id.chars().any(char::is_control) {
        return Err(Error::Invalid(
            "identifier must be 1..256 bytes with no control characters".into(),
        ));
    }
    Ok(())
}
/// Reserved property namespace for crate-internal record contracts (exchange
/// ownership `hqkg.exchange.*`, scoped provenance `hqkg.provenance.*`, record
/// contracts). Only the importer-grade write path may mint these keys, so an
/// ordinary graph writer can never forge exchange ownership of an entity.
pub const RESERVED_PROPERTY_PREFIX: &str = "hqkg.";
fn validate_public_properties(props: &Properties) -> Result<()> {
    for key in props.keys() {
        if key.starts_with(RESERVED_PROPERTY_PREFIX) {
            return Err(Error::Invalid(format!(
                "property key {key:?} uses the reserved hqkg. prefix"
            )));
        }
    }
    Ok(())
}
#[derive(Clone, Debug, Default)]
pub struct Graph {
    nodes: BTreeMap<String, Node>,
    edges: BTreeMap<String, Edge>,
    // Derived indexes only; never serialized as independent source of truth.
    outgoing_ids: BTreeMap<String, BTreeSet<String>>,
    incoming_ids: BTreeMap<String, BTreeSet<String>>,
    epoch: u64,
}
impl Graph {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn epoch(&self) -> u64 {
        self.epoch
    }
    pub fn nodes(&self) -> impl Iterator<Item = &Node> {
        self.nodes.values()
    }
    pub fn edges(&self) -> impl Iterator<Item = &Edge> {
        self.edges.values()
    }
    pub fn node(&self, id: &str) -> Option<&Node> {
        self.nodes.get(id)
    }
    pub fn edge(&self, id: &str) -> Option<&Edge> {
        self.edges.get(id)
    }
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }
    pub fn edge_count(&self) -> usize {
        self.edges.len()
    }
    fn bump(&mut self) -> Result<()> {
        self.epoch = self
            .epoch
            .checked_add(1)
            .ok_or_else(|| Error::Invalid("epoch overflow".into()))?;
        Ok(())
    }
    pub fn put_node(&mut self, n: Node) -> Result<()> {
        validate_public_properties(&n.properties)?;
        self.put_node_importer(n)
    }
    /// Importer-grade node write: the only path allowed to set reserved
    /// `hqkg.*` properties. Used by the exchange importer, the change-set
    /// engine (whose scoped records are validated by `scoped_graph` before
    /// apply) and journal replay of already-verified frames.
    pub(crate) fn put_node_importer(&mut self, mut n: Node) -> Result<()> {
        identity(&n.id)?;
        if n.title.len() > 65536 {
            return Err(Error::Invalid("title too long".into()));
        }
        n.version = match self.nodes.get(&n.id) {
            Some(old) => old
                .version
                .checked_add(1)
                .ok_or_else(|| Error::Invalid("version overflow".into()))?,
            None => 1,
        };
        self.bump()?;
        self.nodes.insert(n.id.clone(), n);
        Ok(())
    }
    fn index_edge(&mut self, e: &Edge) {
        self.outgoing_ids
            .entry(e.from.clone())
            .or_default()
            .insert(e.id.clone());
        self.incoming_ids
            .entry(e.to.clone())
            .or_default()
            .insert(e.id.clone());
    }
    fn unindex_edge(&mut self, e: &Edge) {
        if let Some(ids) = self.outgoing_ids.get_mut(&e.from) {
            ids.remove(&e.id);
            if ids.is_empty() {
                self.outgoing_ids.remove(&e.from);
            }
        }
        if let Some(ids) = self.incoming_ids.get_mut(&e.to) {
            ids.remove(&e.id);
            if ids.is_empty() {
                self.incoming_ids.remove(&e.to);
            }
        }
    }
    pub fn put_edge(&mut self, e: Edge) -> Result<()> {
        validate_public_properties(&e.properties)?;
        self.put_edge_importer(e)
    }
    /// Importer-grade edge write: the only path allowed to set reserved
    /// `hqkg.*` properties. See `put_node_importer` for the allowed callers.
    pub(crate) fn put_edge_importer(&mut self, e: Edge) -> Result<()> {
        identity(&e.id)?;
        identity(&e.relation)?;
        if !self.nodes.contains_key(&e.from) || !self.nodes.contains_key(&e.to) {
            return Err(Error::Invalid(format!(
                "edge {} has a missing endpoint",
                e.id
            )));
        }
        self.bump()?;
        if let Some(old) = self.edges.insert(e.id.clone(), e.clone()) {
            self.unindex_edge(&old);
        }
        self.index_edge(&e);
        Ok(())
    }
    pub fn remove_edge(&mut self, id: &str) -> Result<bool> {
        if !self.edges.contains_key(id) {
            return Ok(false);
        }
        self.bump()?;
        if let Some(old) = self.edges.remove(id) {
            self.unindex_edge(&old);
        }
        Ok(true)
    }
    pub fn remove_node(&mut self, id: &str) -> Result<bool> {
        if !self.nodes.contains_key(id) {
            return Ok(false);
        }
        self.bump()?;
        let mut ids = BTreeSet::new();
        if let Some(out) = self.outgoing_ids.get(id) {
            ids.extend(out.iter().cloned());
        }
        if let Some(inc) = self.incoming_ids.get(id) {
            ids.extend(inc.iter().cloned());
        }
        for edge_id in ids {
            if let Some(old) = self.edges.remove(&edge_id) {
                self.unindex_edge(&old);
            }
        }
        self.nodes.remove(id);
        self.outgoing_ids.remove(id);
        self.incoming_ids.remove(id);
        Ok(true)
    }
    pub fn outgoing(&self, id: &str, relation: Option<&str>) -> Result<Vec<&Edge>> {
        if self.node(id).is_none() {
            return Err(Error::Missing(id.into()));
        }
        Ok(self
            .outgoing_ids
            .get(id)
            .into_iter()
            .flat_map(|ids| ids.iter())
            .filter_map(|key| self.edges.get(key))
            .filter(|e| relation.map_or(true, |r| r == e.relation))
            .collect())
    }
    pub fn incoming(&self, id: &str, relation: Option<&str>) -> Result<Vec<&Edge>> {
        if self.node(id).is_none() {
            return Err(Error::Missing(id.into()));
        }
        Ok(self
            .incoming_ids
            .get(id)
            .into_iter()
            .flat_map(|ids| ids.iter())
            .filter_map(|key| self.edges.get(key))
            .filter(|e| relation.map_or(true, |r| r == e.relation))
            .collect())
    }
    /// Integrity audit for every derived index, including deserialized snapshots.
    pub fn check_indexes(&self) -> Result<()> {
        for e in self.edges.values() {
            if !self.nodes.contains_key(&e.from)
                || !self.nodes.contains_key(&e.to)
                || !self
                    .outgoing_ids
                    .get(&e.from)
                    .map_or(false, |v| v.contains(&e.id))
                || !self
                    .incoming_ids
                    .get(&e.to)
                    .map_or(false, |v| v.contains(&e.id))
            {
                return Err(Error::Corrupt(format!("unindexed graph edge {}", e.id)));
            }
        }
        for (node, edges) in &self.outgoing_ids {
            for id in edges {
                if self.edges.get(id).map_or(true, |e| &e.from != node) {
                    return Err(Error::Corrupt(format!("stale outgoing edge index: {id}")));
                }
            }
        }
        for (node, edges) in &self.incoming_ids {
            for id in edges {
                if self.edges.get(id).map_or(true, |e| &e.to != node) {
                    return Err(Error::Corrupt(format!("stale incoming edge index: {id}")));
                }
            }
        }
        Ok(())
    }
    pub fn shortest_path(
        &self,
        start: &str,
        end: &str,
        relation: Option<&str>,
    ) -> Result<Option<Vec<String>>> {
        if self.node(start).is_none() || self.node(end).is_none() {
            return Err(Error::Missing("path endpoint".into()));
        }
        let mut pending = VecDeque::from([start.to_owned()]);
        let mut parents: BTreeMap<String, Option<String>> = BTreeMap::from([(start.into(), None)]);
        while let Some(id) = pending.pop_front() {
            if id == end {
                let mut p = id;
                let mut path = Vec::new();
                loop {
                    path.push(p.clone());
                    match &parents[&p] {
                        Some(prev) => p = prev.clone(),
                        None => break,
                    }
                }
                path.reverse();
                return Ok(Some(path));
            }
            for e in self.outgoing(&id, relation)? {
                if !parents.contains_key(&e.to) {
                    parents.insert(e.to.clone(), Some(id.clone()));
                    pending.push_back(e.to.clone());
                }
            }
        }
        Ok(None)
    }
    pub fn reachable(
        &self,
        start: &str,
        relation: Option<&str>,
        max: usize,
    ) -> Result<Vec<String>> {
        if self.node(start).is_none() {
            return Err(Error::Missing(start.into()));
        }
        if max == 0 {
            return Err(Error::Invalid("max must be positive".into()));
        }
        let mut found = BTreeSet::from([start.to_owned()]);
        let mut pending = VecDeque::from([start.to_owned()]);
        let mut order = Vec::new();
        while let Some(id) = pending.pop_front() {
            order.push(id.clone());
            for e in self.outgoing(&id, relation)? {
                if found.len() < max && found.insert(e.to.clone()) {
                    pending.push_back(e.to.clone());
                }
            }
        }
        Ok(order)
    }
    pub fn topological(&self, relation: &str) -> Result<Vec<String>> {
        let mut degree: BTreeMap<String, usize> =
            self.nodes.keys().map(|s| (s.clone(), 0)).collect();
        for e in self.edges.values().filter(|e| e.relation == relation) {
            *degree.get_mut(&e.to).unwrap() += 1;
        }
        let mut ready: BTreeSet<String> = degree
            .iter()
            .filter(|(_, n)| **n == 0)
            .map(|(id, _)| id.clone())
            .collect();
        let mut result = Vec::new();
        while let Some(id) = ready.pop_first() {
            for e in self.outgoing(&id, Some(relation))? {
                let n = degree.get_mut(&e.to).unwrap();
                *n -= 1;
                if *n == 0 {
                    ready.insert(e.to.clone());
                }
            }
            result.push(id);
        }
        if result.len() != self.nodes.len() {
            return Err(Error::Conflict(format!("cycle in {relation} edges")));
        }
        Ok(result)
    }
    pub fn least_cost_path(&self, start: &str, end: &str) -> Result<Option<(u64, Vec<String>)>> {
        if self.node(start).is_none() || self.node(end).is_none() {
            return Err(Error::Missing("path endpoint".into()));
        }
        let mut remain: BTreeSet<String> = self.nodes.keys().cloned().collect();
        let mut dist = BTreeMap::from([(start.to_owned(), 0u64)]);
        let mut parent: BTreeMap<String, String> = BTreeMap::new();
        loop {
            let candidate = remain
                .iter()
                .filter_map(|id| dist.get(id).map(|v| (id.clone(), *v)))
                .min_by(|a, b| (a.1, &a.0).cmp(&(b.1, &b.0)));
            let (id, cost) = match candidate {
                Some(v) => v,
                None => break,
            };
            remain.remove(&id);
            if id == end {
                let mut p = id;
                let mut path = vec![p.clone()];
                while let Some(prev) = parent.get(&p) {
                    path.push(prev.clone());
                    p = prev.clone();
                }
                path.reverse();
                return Ok(Some((cost, path)));
            }
            for e in self.outgoing(&id, None)? {
                if !remain.contains(&e.to) {
                    continue;
                }
                let next = cost.saturating_add(e.weight.max(1) as u64);
                if next < *dist.get(&e.to).unwrap_or(&u64::MAX) {
                    dist.insert(e.to.clone(), next);
                    parent.insert(e.to.clone(), id.clone());
                }
            }
        }
        Ok(None)
    }
    pub fn search(&self, needle: &str, limit: usize) -> Vec<&Node> {
        let needle = needle.to_lowercase();
        self.nodes
            .values()
            .filter(|n| {
                n.id.to_lowercase().contains(&needle)
                    || n.title.to_lowercase().contains(&needle)
                    || n.properties
                        .values()
                        .any(|v| v.to_lowercase().contains(&needle))
            })
            .take(limit)
            .collect()
    }
    pub fn page_rank(&self, iterations: usize, damping: f64) -> Result<BTreeMap<String, f64>> {
        if !damping.is_finite() || !(0.0..1.0).contains(&damping) {
            return Err(Error::Invalid("damping must be in [0,1)".into()));
        }
        let n = self.nodes.len();
        if n == 0 {
            return Ok(BTreeMap::new());
        }
        let base = 1.0 / n as f64;
        let mut rank: BTreeMap<String, f64> =
            self.nodes.keys().map(|k| (k.clone(), base)).collect();
        let mut outs: BTreeMap<String, Vec<String>> =
            self.nodes.keys().map(|k| (k.clone(), Vec::new())).collect();
        for e in self.edges.values() {
            outs.get_mut(&e.from).unwrap().push(e.to.clone());
        }
        for _ in 0..iterations.min(1000) {
            let dangling: f64 = outs
                .iter()
                .filter(|(_, v)| v.is_empty())
                .map(|(k, _)| rank[k])
                .sum();
            let mut next: BTreeMap<String, f64> = self
                .nodes
                .keys()
                .map(|k| {
                    (
                        k.clone(),
                        (1.0 - damping) * base + damping * dangling * base,
                    )
                })
                .collect();
            for (from, to) in &outs {
                if to.is_empty() {
                    continue;
                }
                let share = damping * rank[from] / to.len() as f64;
                for id in to {
                    *next.get_mut(id).unwrap() += share;
                }
            }
            rank = next;
        }
        Ok(rank)
    }
    /// Preserve engine lineage and the unique active slot edge inside the graph.
    pub fn record_engine_swap(
        &mut self,
        desc: &EngineDescriptor,
        receipt: &SwapReceipt,
    ) -> Result<()> {
        if desc.slot != receipt.slot {
            return Err(Error::Invalid("slot mismatch".into()));
        }
        let slot_id = format!("engine-slot:{}", desc.slot);
        let rev_id = format!("engine:{}:{}", desc.slot, receipt.generation);
        let mut slot = Node::new(&slot_id, NodeKind::EngineSlot, &desc.slot);
        slot.properties
            .insert("interface".into(), desc.interface.clone());
        slot.properties
            .insert("active_generation".into(), receipt.generation.to_string());
        self.put_node(slot)?;
        let mut revision = Node::new(&rev_id, NodeKind::ComputeEngine, &desc.implementation);
        revision
            .properties
            .insert("interface".into(), desc.interface.clone());
        revision.properties.insert(
            "capabilities".into(),
            desc.capabilities
                .iter()
                .cloned()
                .collect::<Vec<_>>()
                .join(","),
        );
        revision
            .properties
            .insert("generation".into(), receipt.generation.to_string());
        self.put_node(revision)?;
        let active_id = format!("engine-active:{}", desc.slot);
        self.remove_edge(&active_id)?;
        self.put_edge(Edge::new(&active_id, &slot_id, "active_engine", &rev_id))?;
        if let Some(old) = receipt.previous {
            let old_id = format!("engine:{}:{}", desc.slot, old);
            if self.node(&old_id).is_some() {
                self.put_edge(Edge::new(
                    &format!("engine-supersedes:{}:{}", desc.slot, receipt.generation),
                    &rev_id,
                    "supersedes",
                    &old_id,
                ))?;
            }
        }
        Ok(())
    }
}

// Deterministic, length-prefixed binary payload, with bounded fields.
const FRAME: &[u8; 4] = b"HQJ1";
// Incremental additive graph mutations. Legacy HQJ1 snapshot frames stay readable.
const DELTA_FRAME: &[u8; 4] = b"HQD1";
const MAX_FRAME: usize = 128 * 1024 * 1024;
fn hash(buf: &[u8]) -> u64 {
    let mut h = 0xcbf29ce484222325u64;
    for x in buf {
        h = (h ^ *x as u64).wrapping_mul(0x100000001b3);
    }
    h
}
fn put_str(b: &mut Vec<u8>, s: &str) -> Result<()> {
    let n: u32 = s
        .len()
        .try_into()
        .map_err(|_| Error::Invalid("oversized field".into()))?;
    b.extend_from_slice(&n.to_le_bytes());
    b.extend_from_slice(s.as_bytes());
    Ok(())
}
fn read_u32(r: &mut Cursor<&[u8]>) -> Result<u32> {
    let mut b = [0; 4];
    r.read_exact(&mut b)
        .map_err(|_| Error::Corrupt("truncated u32".into()))?;
    Ok(u32::from_le_bytes(b))
}
fn read_u64(r: &mut Cursor<&[u8]>) -> Result<u64> {
    let mut b = [0; 8];
    r.read_exact(&mut b)
        .map_err(|_| Error::Corrupt("truncated u64".into()))?;
    Ok(u64::from_le_bytes(b))
}
fn read_str(r: &mut Cursor<&[u8]>) -> Result<String> {
    let n = read_u32(r)? as usize;
    if n > MAX_FRAME {
        return Err(Error::Corrupt("oversized field".into()));
    }
    let mut v = vec![0; n];
    r.read_exact(&mut v)
        .map_err(|_| Error::Corrupt("truncated string".into()))?;
    String::from_utf8(v).map_err(|_| Error::Corrupt("invalid utf8".into()))
}
fn count(b: &mut Vec<u8>, n: usize) -> Result<()> {
    let n: u32 = n
        .try_into()
        .map_err(|_| Error::Invalid("oversized collection".into()))?;
    b.extend_from_slice(&n.to_le_bytes());
    Ok(())
}
fn read_count(r: &mut Cursor<&[u8]>, max: u32) -> Result<usize> {
    let n = read_u32(r)?;
    if n > max {
        Err(Error::Corrupt("oversized collection".into()))
    } else {
        Ok(n as usize)
    }
}
fn write_props(b: &mut Vec<u8>, p: &Properties) -> Result<()> {
    count(b, p.len())?;
    for (k, v) in p {
        put_str(b, k)?;
        put_str(b, v)?;
    }
    Ok(())
}
fn read_props(r: &mut Cursor<&[u8]>) -> Result<Properties> {
    let mut p = Properties::new();
    for _ in 0..read_count(r, 1_000_000)? {
        p.insert(read_str(r)?, read_str(r)?);
    }
    Ok(p)
}
pub fn serialize(g: &Graph) -> Result<Vec<u8>> {
    let mut b = b"KG01".to_vec();
    b.extend_from_slice(&g.epoch.to_le_bytes());
    count(&mut b, g.nodes.len())?;
    for n in g.nodes.values() {
        put_str(&mut b, &n.id)?;
        put_str(&mut b, n.kind.as_str())?;
        put_str(&mut b, &n.title)?;
        b.extend_from_slice(&n.version.to_le_bytes());
        write_props(&mut b, &n.properties)?;
        count(&mut b, n.sources.len())?;
        for s in &n.sources {
            put_str(&mut b, s)?;
        }
    }
    count(&mut b, g.edges.len())?;
    for e in g.edges.values() {
        put_str(&mut b, &e.id)?;
        put_str(&mut b, &e.from)?;
        put_str(&mut b, &e.to)?;
        put_str(&mut b, &e.relation)?;
        b.extend_from_slice(&e.weight.to_le_bytes());
        write_props(&mut b, &e.properties)?;
    }
    Ok(b)
}
pub fn deserialize(data: &[u8]) -> Result<Graph> {
    let mut r = Cursor::new(data);
    let mut magic = [0; 4];
    r.read_exact(&mut magic)?;
    if &magic != b"KG01" {
        return Err(Error::Corrupt("unrecognized graph format".into()));
    }
    let epoch = read_u64(&mut r)?;
    let mut g = Graph::new();
    for _ in 0..read_count(&mut r, 1_000_000)? {
        let id = read_str(&mut r)?;
        identity(&id)?;
        let kind = NodeKind::from_str(&read_str(&mut r)?);
        let title = read_str(&mut r)?;
        let version = read_u64(&mut r)?;
        let properties = read_props(&mut r)?;
        let mut sources = BTreeSet::new();
        for _ in 0..read_count(&mut r, 1_000_000)? {
            sources.insert(read_str(&mut r)?);
        }
        if g.nodes
            .insert(
                id.clone(),
                Node {
                    id,
                    kind,
                    title,
                    properties,
                    sources,
                    version,
                },
            )
            .is_some()
        {
            return Err(Error::Corrupt("duplicate node".into()));
        }
    }
    for _ in 0..read_count(&mut r, 4_000_000)? {
        let id = read_str(&mut r)?;
        identity(&id)?;
        let from = read_str(&mut r)?;
        let to = read_str(&mut r)?;
        let relation = read_str(&mut r)?;
        identity(&relation)?;
        let weight = read_u32(&mut r)?;
        let properties = read_props(&mut r)?;
        if g.node(&from).is_none() || g.node(&to).is_none() {
            return Err(Error::Corrupt("dangling edge".into()));
        }
        let edge = Edge {
            id: id.clone(),
            from,
            to,
            relation,
            weight,
            properties,
        };
        if g.edges.insert(id, edge.clone()).is_some() {
            return Err(Error::Corrupt("duplicate edge".into()));
        }
        g.index_edge(&edge);
    }
    if r.position() != data.len() as u64 {
        return Err(Error::Corrupt("trailing bytes".into()));
    }
    g.epoch = epoch;
    Ok(g)
}
/// Integrity report: valid frame prefix is recovered but unexpected trailing bytes
/// must not be silently mistaken for a clean journal.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct JournalStatus {
    pub exists: bool,
    pub epoch: u64,
    pub total_bytes: u64,
    pub verified_bytes: u64,
    pub trailing_bytes: u64,
}
#[derive(Clone, Debug)]
pub struct Journal {
    path: PathBuf,
}
// Keep the lock handle in the guard so Windows closes it before removing the file.
struct WriteLock {
    path: PathBuf,
    file: Option<std::fs::File>,
}
impl Drop for WriteLock {
    fn drop(&mut self) {
        self.file.take(); // close handle before unlink (important on Windows)
        let _ = fs::remove_file(&self.path);
    }
}
/// Apply a complete additive delta without changing existing graph facts.
/// Validation happens before any mutation, so a corrupt delta is never partially replayed.
fn merge_additive(graph: &mut Graph, delta: &Graph) -> Result<()> {
    for n in delta.nodes() {
        if let Some(old) = graph.node(&n.id) {
            if old.kind != n.kind
                || old.title != n.title
                || old.properties != n.properties
                || old.sources != n.sources
            {
                return Err(Error::Corrupt(format!(
                    "delta changes existing node {}",
                    n.id
                )));
            }
        }
    }
    for e in delta.edges() {
        if let Some(old) = graph.edge(&e.id) {
            if old != e {
                return Err(Error::Corrupt(format!(
                    "delta changes existing edge {}",
                    e.id
                )));
            }
        } else if (graph.node(&e.from).is_none() && delta.node(&e.from).is_none())
            || (graph.node(&e.to).is_none() && delta.node(&e.to).is_none())
        {
            return Err(Error::Corrupt(format!(
                "delta edge {} has missing endpoints",
                e.id
            )));
        }
    }
    // Replay of frames already verified against the journal digest may carry
    // reserved hqkg.* properties from earlier accepted imports, so it uses the
    // importer-grade write path instead of the public reserved-prefix checks.
    for n in delta.nodes() {
        if graph.node(&n.id).is_none() {
            graph.put_node_importer(n.clone())?;
        }
    }
    for e in delta.edges() {
        if graph.edge(&e.id).is_none() {
            graph.put_edge_importer(e.clone())?;
        }
    }
    Ok(())
}
impl Journal {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }
    pub fn path(&self) -> &Path {
        &self.path
    }
    fn scan(&self) -> Result<(Graph, usize, bool)> {
        if !self.path.exists() {
            return Ok((Graph::new(), 0, false));
        }
        let bytes = fs::read(&self.path)?;
        let mut pos = 0;
        let mut found = false;
        let mut g = Graph::new();
        while bytes.len().saturating_sub(pos) >= 20 {
            let magic = &bytes[pos..pos + 4];
            if magic != FRAME && magic != DELTA_FRAME {
                break;
            }
            let len = u64::from_le_bytes(bytes[pos + 4..pos + 12].try_into().unwrap());
            let digest = u64::from_le_bytes(bytes[pos + 12..pos + 20].try_into().unwrap());
            if len > MAX_FRAME as u64 || len > bytes.len().saturating_sub(pos + 20) as u64 {
                break;
            }
            let end = pos + 20 + len as usize;
            let payload = &bytes[pos + 20..end];
            if hash(payload) != digest {
                break;
            }
            match deserialize(payload) {
                Ok(next) => {
                    if magic == FRAME {
                        g = next;
                    } else if merge_additive(&mut g, &next).is_err() {
                        break;
                    }
                    found = true;
                    pos = end;
                }
                Err(_) => break,
            }
        }
        if !found && !bytes.is_empty() {
            // A crash during the very first incremental append has no committed
            // prefix yet. Surface it as a repairable torn tail, not a valid graph.
            let torn_first_delta = if bytes.len() < 4 {
                DELTA_FRAME.starts_with(&bytes)
            } else {
                &bytes[..4] == DELTA_FRAME
            };
            if !torn_first_delta {
                return Err(Error::Corrupt("no valid journal frame".into()));
            }
            return Ok((Graph::new(), 0, true));
        }
        Ok((g, pos, found))
    }
    pub fn load(&self) -> Result<Graph> {
        Ok(self.scan()?.0)
    }
    pub fn status(&self) -> Result<JournalStatus> {
        let (graph, verified, exists) = self.scan()?;
        let total = if self.path.exists() {
            fs::metadata(&self.path)?.len()
        } else {
            0
        };
        Ok(JournalStatus {
            exists,
            epoch: graph.epoch(),
            total_bytes: total,
            verified_bytes: verified as u64,
            trailing_bytes: total.saturating_sub(verified as u64),
        })
    }
    /// Explicit, safe local repair for an already-verified journal prefix.
    /// Never rewrites committed frames or removes stale locks; caller must pass
    /// the observed epoch and explicitly opt into applying the repair.
    pub fn repair_torn_tail(&self, expected_epoch: u64) -> Result<u64> {
        let lock = self.path.with_extension("hqkg.lock");
        let handle = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock)
            .map_err(|e| {
                if e.kind() == io::ErrorKind::AlreadyExists {
                    Error::Conflict(format!("writer lock: {}", lock.display()))
                } else {
                    Error::Io(e)
                }
            })?;
        let _guard = WriteLock {
            path: lock,
            file: Some(handle),
        };
        let (graph, valid, exists) = self.scan()?;
        if !exists || graph.epoch() != expected_epoch {
            return Err(Error::Conflict(
                "journal missing or epoch changed since inspection".into(),
            ));
        }
        let file = OpenOptions::new().write(true).open(&self.path)?;
        let original = file.metadata()?.len();
        if original < valid as u64 {
            return Err(Error::Corrupt("file shrank during inspection".into()));
        }
        if original == valid as u64 {
            return Ok(0);
        }
        file.set_len(valid as u64)?;
        file.sync_all()?;
        Ok(original - valid as u64)
    }
    /// Atomic additive frame with file-length CAS. Callers MUST load + inspect
    /// status first and refuse trailing bytes; a changed file length fails closed.
    /// No graph snapshot is reserialized on this hot path.
    pub fn append_delta(&self, delta: &Graph, expected_bytes: u64) -> Result<u64> {
        if delta.node_count() == 0 && delta.edge_count() == 0 {
            return Ok(expected_bytes);
        }
        let payload = serialize(delta)?;
        if payload.len() > MAX_FRAME {
            return Err(Error::Invalid("delta frame too large".into()));
        }
        if let Some(parent) = self.path.parent().filter(|p| !p.as_os_str().is_empty()) {
            fs::create_dir_all(parent)?;
        }
        let lock = self.path.with_extension("hqkg.lock");
        let handle = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock)
            .map_err(|e| {
                if e.kind() == io::ErrorKind::AlreadyExists {
                    Error::Conflict(format!("writer lock: {}", lock.display()))
                } else {
                    Error::Io(e)
                }
            })?;
        let _guard = WriteLock {
            path: lock,
            file: Some(handle),
        };
        let present = match fs::metadata(&self.path) {
            Ok(m) => m.len(),
            Err(e) if e.kind() == io::ErrorKind::NotFound => 0,
            Err(e) => return Err(Error::Io(e)),
        };
        if present != expected_bytes {
            return Err(Error::Conflict(
                "journal changed or has an unrepaired torn tail".into(),
            ));
        }
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)?;
        file.write_all(DELTA_FRAME)?;
        file.write_all(&(payload.len() as u64).to_le_bytes())?;
        file.write_all(&hash(&payload).to_le_bytes())?;
        file.write_all(&payload)?;
        file.sync_all()?;
        Ok(expected_bytes + 20 + payload.len() as u64)
    }
    /// Single-writer append. A lock prevents concurrent writers. A stale crash lock
    /// requires operator inspection; never delete it automatically.
    pub fn save(&self, g: &Graph) -> Result<()> {
        self.save_snapshot(g, None)
    }
    /// Strict snapshot CAS for derived source synchronization. Unlike legacy
    /// save(), a checked writer never truncates a torn or changed journal.
    pub fn save_checked(&self, g: &Graph, expected_bytes: u64, expected_epoch: u64) -> Result<()> {
        self.save_snapshot(g, Some((expected_bytes, expected_epoch)))
    }
    fn save_snapshot(&self, g: &Graph, expected: Option<(u64, u64)>) -> Result<()> {
        if let Some(parent) = self.path.parent().filter(|p| !p.as_os_str().is_empty()) {
            fs::create_dir_all(parent)?;
        }
        let lock = self.path.with_extension("hqkg.lock");
        let _file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock)
            .map_err(|e| {
                if e.kind() == io::ErrorKind::AlreadyExists {
                    Error::Conflict(format!("writer lock: {}", lock.display()))
                } else {
                    Error::Io(e)
                }
            })?;
        let _guard = WriteLock {
            path: lock,
            file: Some(_file),
        };
        let (previous, end, exists) = self.scan()?;
        if let Some((bytes, epoch)) = expected {
            let total = match fs::symlink_metadata(&self.path) {
                Ok(m) if m.is_file() && !m.file_type().is_symlink() => m.len(),
                Ok(_) => return Err(Error::Invalid("unsafe checked journal".into())),
                Err(e) if e.kind() == io::ErrorKind::NotFound => 0,
                Err(e) => return Err(Error::Io(e)),
            };
            if total != bytes || total != end as u64 || previous.epoch() != epoch {
                return Err(Error::Conflict("checked journal head changed or torn".into()));
            }
        }
        // Legacy snapshot writers may recover their old HQJ1 tails, but must
        // not discard an interrupted web delta without explicit operator repair.
        if self.path.exists() && fs::metadata(&self.path)?.len() > end as u64 {
            let mut reader = fs::File::open(&self.path)?;
            reader.seek(SeekFrom::Start(end as u64))?;
            let mut prefix = [0u8; 4];
            let n = reader.read(&mut prefix)?;
            if n > 0 && DELTA_FRAME.starts_with(&prefix[..n]) {
                return Err(Error::Corrupt(
                    "web delta tail requires explicit repair".into(),
                ));
            }
        }
        if exists && previous.epoch >= g.epoch {
            return Err(Error::Conflict("stale or unchanged graph epoch".into()));
        }
        let bytes = serialize(g)?;
        if bytes.len() > MAX_FRAME {
            return Err(Error::Invalid("graph exceeds 128 MiB per revision".into()));
        }
        let mut options = OpenOptions::new();
        options.create(true).write(true).read(true);
        #[cfg(unix)]
        if expected.is_some() {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut file = options.open(&self.path)?;
        file.set_len(end as u64)?;
        file.seek(SeekFrom::End(0))?;
        file.write_all(FRAME)?;
        file.write_all(&(bytes.len() as u64).to_le_bytes())?;
        file.write_all(&hash(&bytes).to_le_bytes())?;
        file.write_all(&bytes)?;
        file.sync_all()?;
        Ok(())
    }
}

/// Atomic snapshot compaction report. No permission or effect authority.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct JournalCompactionReceipt {
    pub epoch: u64,
    pub old_bytes: u64,
    pub new_bytes: u64,
}
impl Journal {
    /// Explicit crash-consistent compaction of verified HQJ1/HQD1 frames into
    /// one HQJ1 snapshot. The caller must provide the exact observed byte count
    /// and graph epoch. Uses the same single-writer lock as append_delta.
    ///
    /// A crash before rename leaves the old journal intact and possibly an
    /// orphan .compact.tmp file (never silently removed). A crash after rename
    /// leaves a complete, fsynced snapshot. No external side effects are replayed.
    pub fn compact_verified(
        &self,
        expected_bytes: u64,
        expected_epoch: u64,
    ) -> Result<JournalCompactionReceipt> {
        if !self.path.exists() {
            return Err(Error::Missing("journal to compact".into()));
        }
        let lock = self.path.with_extension("hqkg.lock");
        let handle = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock)
            .map_err(|e| {
                if e.kind() == io::ErrorKind::AlreadyExists {
                    Error::Conflict(format!("writer lock: {}", lock.display()))
                } else {
                    Error::Io(e)
                }
            })?;
        let _guard = WriteLock {
            path: lock,
            file: Some(handle),
        };
        let status = self.status()?;
        if status.total_bytes != expected_bytes || status.epoch != expected_epoch {
            return Err(Error::Conflict(
                "stale compaction expected bytes or epoch".into(),
            ));
        }
        if status.trailing_bytes != 0 || !status.exists {
            return Err(Error::Corrupt(
                "cannot compact unverified/torn journal".into(),
            ));
        }
        let graph = self.load()?;
        graph.check_indexes()?;
        let payload = serialize(&graph)?;
        if payload.len() > MAX_FRAME {
            return Err(Error::Invalid("snapshot exceeds max frame".into()));
        }
        let tmp = self.path.with_extension("hqkg.compact.tmp");
        // create_new intentionally refuses a left-behind crash artifact.
        let mut file = OpenOptions::new().write(true).create_new(true).open(&tmp)?;
        file.write_all(FRAME)?;
        file.write_all(&(payload.len() as u64).to_le_bytes())?;
        file.write_all(&hash(&payload).to_le_bytes())?;
        file.write_all(&payload)?;
        file.sync_all()?;
        drop(file);
        // Same-directory rename is atomic when supported by the filesystem.
        // A Windows sharing violation fails without replacing the original.
        fs::rename(&tmp, &self.path)?;
        #[cfg(unix)]
        {
            // Relative filenames have an empty parent; sync "." in that case.
            let parent = self
                .path
                .parent()
                .filter(|p| !p.as_os_str().is_empty())
                .unwrap_or_else(|| Path::new("."));
            fs::File::open(parent)?.sync_all()?;
        }
        let new_bytes = (20 + payload.len()) as u64;
        Ok(JournalCompactionReceipt {
            epoch: expected_epoch,
            old_bytes: expected_bytes,
            new_bytes,
        })
    }
}
