# File: native/hqkg/src/algorithm_adapter.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/algorithm_adapter.rs |
| Language | Rust |
| Kind | source |
| Size | 12931 B |
| Lines | 253 |
| Hash | bc5c3e1dd5e5 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ALGORITHM_INTERFACE | const | 16 | yes | pub const ALGORITHM_INTERFACE: &amp;str = &quot;hqkg.algorithm.v1&quot;; |
| CATALOG_SOURCE | const | 17 | yes | pub const CATALOG_SOURCE: &amp;str = &quot;owenservera/repos-hq:research/knowledge-base-network-graph-signal-intelligence/algorithms.v1.json&quot;; |
| AlgorithmSpec | struct | 20 | yes | pub struct AlgorithmSpec { |
| ALGORITHMS | const | 28 | yes | pub const ALGORITHMS: [AlgorithmSpec; 30] = [ |
| algorithm_by_id | function | 61 | yes | pub fn algorithm_by_id(id: &amp;str) -&gt; Option&lt;&amp;&#39;static AlgorithmSpec&gt; { |
| algorithm_node_id | function | 67 | yes | pub fn algorithm_node_id(algorithm_id: &amp;str) -&gt; String { |
| algorithm_slot | function | 70 | yes | pub fn algorithm_slot(algorithm_id: &amp;str) -&gt; String { |
| ensure_algorithm_node | function | 76 | yes | pub fn ensure_algorithm_node( graph: &amp;mut Graph, algorithm_id: &amp;str, title: &amp;str, family: &amp;str, |
| seed_algorithm_nodes | function | 125 | yes | pub fn seed_algorithm_nodes(graph: &amp;mut Graph) -&gt; Result&lt;usize&gt; { |
| record_algorithm_engine_swap | function | 138 | yes | pub fn record_algorithm_engine_swap( graph: &amp;mut Graph, algorithm_id: &amp;str, descriptor: &amp;EngineDescriptor, receipt: &amp;SwapReceipt, |
| AlgorithmDriver | trait | 177 | yes | pub trait AlgorithmDriver: Send + Sync + &#39;static { |
| operations | function | 178 | no | fn operations(&amp;self) -&gt; BTreeSet&lt;String&gt;; |
| execute | function | 179 | no | fn execute(&amp;self, request: &amp;EngineRequest, graph: &amp;Graph) -&gt; Result&lt;EngineOutput&gt;; |
| AlgorithmCompute | struct | 184 | yes | pub struct AlgorithmCompute { |
| descriptor | method | 237 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 240 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest, SwapReceipt} | use | 11 | external |
| crate::{Edge, Error, Graph, Node, NodeKind, Result} | use | 12 | external |
| std::collections::BTreeSet | use | 13 | external |
| std::sync::{Arc, RwLock} | use | 14 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Algorithm-as-node adapter for HQKG&#39;s existing compute engine runtime. |
| 2 | owner | hq-rust-knowledge-graph | — | hq-rust-knowledge-graph |
| 3 | invariant | — | — | Reuse native EngineRegistry/EngineLease; never start a parallel scheduler. |
| 4 | invariant | — | — | Catalog nodes are inert research metadata until a driver is installed. |
| 5 | invariant | — | — | The canonical graph stays the owner of identities and evidence. |

## Excerpt

```rust
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
```

_First 80 of 254 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
