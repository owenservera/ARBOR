//! @hq:context Algorithm-as-node adapter for HQKG's existing compute engine runtime.
//! @hq:owner hq-rust-knowledge-graph
//! @hq:invariant Reuse native EngineRegistry/EngineLease; never start a parallel scheduler.
//! @hq:invariant Catalog nodes are inert research metadata until a driver is installed.
//! @hq:invariant The canonical graph stays the owner of identities and evidence.
//!
//! The 30 algorithm records are a materialized copy of repos-hq's research
//! catalog (2026-11-03). This module uses only std and HQKG's own types.
//! The adapter supports additional custom algorithms without changing the trait.

use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest, SwapReceipt};
use crate::{Edge, Error, Graph, Node, NodeKind, Result};
use std::collections::BTreeSet;
use std::sync::{Arc, RwLock};

pub const ALGORITHM_INTERFACE: &str = "hqkg.algorithm.v1";
pub const CATALOG_SOURCE: &str = "owenservera/repos-hq:research/knowledge-base-network-graph-signal-intelligence/algorithms.v1.json";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AlgorithmSpec {
    pub id: &'static str,
    pub name: &'static str,
    pub family: &'static str,
    pub source: &'static str,
}

/// Research identities, not executable implementations.
pub const ALGORITHMS: [AlgorithmSpec; 30] = [
    AlgorithmSpec { id: "KGSI-001", name: "EdgeMem", family: "agent_memory", source: "https://arxiv.org/abs/2609.05553" },
    AlgorithmSpec { id: "KGSI-002", name: "Zep / Graphiti", family: "temporal_graph", source: "https://arxiv.org/abs/2501.13956" },
    AlgorithmSpec { id: "KGSI-003", name: "MiniRAG", family: "retrieval", source: "https://arxiv.org/abs/2501.06713" },
    AlgorithmSpec { id: "KGSI-004", name: "PolyG", family: "retrieval", source: "https://arxiv.org/abs/2504.02112" },
    AlgorithmSpec { id: "KGSI-005", name: "PathRAG", family: "retrieval", source: "https://arxiv.org/abs/2502.14902" },
    AlgorithmSpec { id: "KGSI-006", name: "RAKG", family: "construction", source: "https://arxiv.org/abs/2504.09823" },
    AlgorithmSpec { id: "KGSI-007", name: "KGGen", family: "construction", source: "https://arxiv.org/abs/2502.09956" },
    AlgorithmSpec { id: "KGSI-008", name: "HippoRAG 2", family: "retrieval", source: "https://proceedings.mlr.press/v267/gutierrez25a.html" },
    AlgorithmSpec { id: "KGSI-009", name: "MAGMA", family: "agent_memory", source: "https://aclanthology.org/2026.acl-long.1709/" },
    AlgorithmSpec { id: "KGSI-010", name: "PGR", family: "verification", source: "https://aclanthology.org/2025.findings-emnlp.293/" },
    AlgorithmSpec { id: "KGSI-011", name: "TFGAD", family: "anomaly", source: "https://doi.org/10.1145/3696410.3714776" },
    AlgorithmSpec { id: "KGSI-012", name: "BFQ*", family: "signal_detection", source: "https://doi.org/10.1145/3709737" },
    AlgorithmSpec { id: "KGSI-013", name: "KARMA", family: "construction", source: "https://proceedings.neurips.cc/paper_files/paper/2025/hash/517f9b9c227b9dd51dba4560f37165ed-Abstract-Conference.html" },
    AlgorithmSpec { id: "KGSI-014", name: "AutoSchemaKG", family: "construction", source: "https://aclanthology.org/2026.acl-long.942/" },
    AlgorithmSpec { id: "KGSI-015", name: "D-SMART", family: "verification", source: "https://arxiv.org/abs/2510.13363" },
    AlgorithmSpec { id: "KGSI-016", name: "A-MEM", family: "agent_memory", source: "https://proceedings.neurips.cc/paper_files/paper/2025/hash/19909c36f51abc4856b4560aff3d36d6-Abstract-Conference.html" },
    AlgorithmSpec { id: "KGSI-017", name: "Mem0g", family: "agent_memory", source: "https://arxiv.org/abs/2504.19413" },
    AlgorithmSpec { id: "KGSI-018", name: "HyperGraphRAG", family: "retrieval", source: "https://papers.nips.cc/paper_files/paper/2025/hash/df55ee6e59f8ac4a625219e11fe9ddba-Abstract-Conference.html" },
    AlgorithmSpec { id: "KGSI-019", name: "GFM-RAG", family: "retrieval", source: "https://papers.neurips.cc/paper_files/paper/2025/hash/33ca0b1102b54c191a9a45a05adafaf4-Abstract-Conference.html" },
    AlgorithmSpec { id: "KGSI-020", name: "CausalRAG", family: "causal_reasoning", source: "https://arxiv.org/abs/2503.19878" },
    AlgorithmSpec { id: "KGSI-021", name: "MemoTime", family: "temporal_reasoning", source: "https://arxiv.org/abs/2510.13614" },
    AlgorithmSpec { id: "KGSI-022", name: "TTGFN", family: "temporal_reasoning", source: "https://ijcai.org/proceedings/2026/727" },
    AlgorithmSpec { id: "KGSI-023", name: "POSTRA", family: "temporal_reasoning", source: "https://arxiv.org/abs/2506.06367" },
    AlgorithmSpec { id: "KGSI-024", name: "GraphOracle", family: "graph_foundation", source: "https://ojs.aaai.org/index.php/AAAI/article/view/38978" },
    AlgorithmSpec { id: "KGSI-025", name: "IA-GGAD", family: "anomaly", source: "https://proceedings.neurips.cc/paper_files/paper/2025/hash/788f9787ec93e3e1f34658fb003a1f44-Abstract-Conference.html" },
    AlgorithmSpec { id: "KGSI-026", name: "MEGAD", family: "anomaly", source: "https://www.ijcai.org/proceedings/2025/406" },
    AlgorithmSpec { id: "KGSI-027", name: "CausalTRACE", family: "anomaly", source: "https://doi.org/10.1109/JIOT.2026.3740807" },
    AlgorithmSpec { id: "KGSI-028", name: "GraphPFN", family: "graph_foundation", source: "https://proceedings.mlr.press/v306/eremeev26a.html" },
    AlgorithmSpec { id: "KGSI-029", name: "GraphBFF", family: "graph_foundation", source: "https://arxiv.org/abs/2602.04768" },
    AlgorithmSpec { id: "KGSI-030", name: "RippleMem", family: "agent_memory", source: "https://arxiv.org/abs/2608.13334" },
];

pub fn algorithm_by_id(id: &str) -> Option<&'static AlgorithmSpec> {
    ALGORITHMS.iter().find(|spec| spec.id == id)
}

/// Canonical graph node for a researched or custom algorithm.
/// The graph's EngineSlot and generation nodes are separate entities.
pub fn algorithm_node_id(algorithm_id: &str) -> String {
    format!("engine:{algorithm_id}")
}
pub fn algorithm_slot(algorithm_id: &str) -> String {
    format!("algorithm:{algorithm_id}")
}

/// Add an inert algorithm definition. Existing matching nodes are never
/// replaced: this prevents a catalog refresh erasing owner-curated metadata.
pub fn ensure_algorithm_node(
    graph: &mut Graph,
    algorithm_id: &str,
    title: &str,
    family: &str,
    source_url: &str,
) -> Result<bool> {
    if algorithm_id.is_empty()
        || title.is_empty()
        || family.is_empty()
        || algorithm_id.len() > 128
        || !algorithm_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err(Error::Invalid("invalid algorithm identity or title".into()));
    }
    let id = algorithm_node_id(algorithm_id);
    if let Some(old) = graph.node(&id) {
        if old.kind != NodeKind::Other("algorithm".into())
            || old.properties.get("algorithm_id").map(String::as_str) != Some(algorithm_id)
        {
            return Err(Error::Conflict(format!(
                "node {id} has a different canonical identity"
            )));
        }
        return Ok(false);
    }
    let mut node = Node::new(&id, NodeKind::Other("algorithm".into()), title);
    node.properties
        .insert("algorithm_id".into(), algorithm_id.into());
    node.properties.insert("family".into(), family.into());
    node.properties
        .insert("engine_slot".into(), algorithm_slot(algorithm_id));
    node.properties
        .insert("interface".into(), ALGORITHM_INTERFACE.into());
    node.properties
        .insert("status".into(), "research_only".into());
    node.properties.insert("executable".into(), "false".into());
    if !source_url.is_empty() {
        node.properties
            .insert("source_url".into(), source_url.into());
        node.sources.insert(source_url.into());
    }
    graph.put_node(node)?;
    Ok(true)
}

/// Seed catalog nodes into the actual HQKG graph without activating them.
pub fn seed_algorithm_nodes(graph: &mut Graph) -> Result<usize> {
    let mut inserted = 0;
    for spec in ALGORITHMS {
        if ensure_algorithm_node(graph, spec.id, spec.name, spec.family, spec.source)? {
            inserted += 1;
        }
    }
    Ok(inserted)
}

/// Persist the native engine-generation lineage AND a typed edge from the
/// algorithm definition to the logical engine slot. Call only after successful
/// EngineRegistry::install; this is not an atomic registry+journal transaction.
pub fn record_algorithm_engine_swap(
    graph: &mut Graph,
    algorithm_id: &str,
    descriptor: &EngineDescriptor,
    receipt: &SwapReceipt,
) -> Result<()> {
    let id = algorithm_node_id(algorithm_id);
    let node = graph.node(&id).ok_or_else(|| Error::Missing(id.clone()))?;
    let slot = algorithm_slot(algorithm_id);
    if node.kind != NodeKind::Other("algorithm".into())
        || node.properties.get("algorithm_id").map(String::as_str) != Some(algorithm_id)
        || descriptor.slot != slot
        || descriptor.interface != ALGORITHM_INTERFACE
        || receipt.slot != slot
    {
        return Err(Error::Conflict(
            "algorithm/slot/descriptor identity mismatch".into(),
        ));
    }
    let link_id = format!("algorithm-slot-link:{algorithm_id}");
    if link_id.len() > 256 {
        return Err(Error::Invalid(
            "algorithm slot link exceeds ID limit".into(),
        ));
    }
    graph.record_engine_swap(descriptor, receipt)?;
    let slot_node_id = format!("engine-slot:{slot}");
    graph.put_edge(Edge::new(
        &link_id,
        &id,
        "configured_engine_slot",
        &slot_node_id,
    ))?;
    Ok(())
}

/// Universal implementation contract. Drivers operate on the current,
/// host-scoped read-only graph; they do not own graph storage or engine slots.
/// This in-process trait is for trusted local Rust, not untrusted plugins.
pub trait AlgorithmDriver: Send + Sync + 'static {
    fn operations(&self) -> BTreeSet<String>;
    fn execute(&self, request: &EngineRequest, graph: &Graph) -> Result<EngineOutput>;
}

/// Bridges any AlgorithmDriver to the *existing* ComputeEngine interface.
/// Native EngineRegistry handles generation CAS and in-flight Arc pinning.
pub struct AlgorithmCompute {
    descriptor: EngineDescriptor,
    graph: Arc<RwLock<Graph>>,
    driver: Arc<dyn AlgorithmDriver>,
}
impl AlgorithmCompute {
    pub fn new(
        algorithm_id: &str,
        implementation: &str,
        graph: Arc<RwLock<Graph>>,
        driver: Arc<dyn AlgorithmDriver>,
    ) -> Result<Self> {
        if implementation.trim().is_empty() {
            return Err(Error::Invalid("implementation identity is empty".into()));
        }
        let slot = algorithm_slot(algorithm_id);
        {
            let graph_view = graph
                .read()
                .map_err(|_| Error::Conflict("graph lock poisoned".into()))?;
            let id = algorithm_node_id(algorithm_id);
            let node = graph_view
                .node(&id)
                .ok_or_else(|| Error::Missing(format!("algorithm node {id}")))?;
            if node.kind != NodeKind::Other("algorithm".into())
                || node.properties.get("algorithm_id").map(String::as_str) != Some(algorithm_id)
                || node.properties.get("engine_slot").map(String::as_str) != Some(slot.as_str())
            {
                return Err(Error::Conflict(
                    "algorithm identity or engine slot mismatch".into(),
                ));
            }
        }
        let capabilities = driver.operations();
        if capabilities.is_empty() || capabilities.iter().any(|op| op.trim().is_empty()) {
            return Err(Error::Invalid(
                "algorithm driver requires non-empty operations".into(),
            ));
        }
        let descriptor = EngineDescriptor {
            slot,
            implementation: implementation.into(),
            interface: ALGORITHM_INTERFACE.into(),
            capabilities,
        };
        Ok(Self {
            descriptor,
            graph,
            driver,
        })
    }
}
impl ComputeEngine for AlgorithmCompute {
    fn descriptor(&self) -> EngineDescriptor {
        self.descriptor.clone()
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        if !self.descriptor.capabilities.contains(&request.operation) {
            return Err(Error::Unsupported(format!(
                "operation {} not supported by {}",
                request.operation, self.descriptor.slot
            )));
        }
        let graph = self
            .graph
            .read()
            .map_err(|_| Error::Conflict("graph lock poisoned".into()))?;
        self.driver.execute(request, &graph)
    }
}
