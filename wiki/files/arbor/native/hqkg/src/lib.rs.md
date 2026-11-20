# File: native/hqkg/src/lib.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/lib.rs |
| Language | Rust |
| Kind | source |
| Size | 43905 B |
| Lines | 1205 |
| Hash | bea737b30705 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| adapters | module | 9 | yes | pub mod adapters; |
| algorithm_adapter | module | 10 | yes | pub mod algorithm_adapter; |
| apply_ledger | module | 11 | yes | pub mod apply_ledger; |
| builtins | module | 12 | yes | pub mod builtins; |
| context_retrieval | module | 13 | yes | pub mod context_retrieval; |
| managed_context | module | 15 | yes | pub mod managed_context; |
| control | module | 16 | yes | pub mod control; |
| database | module | 17 | yes | pub mod database; |
| durable_dag | module | 18 | yes | pub mod durable_dag; |
| engine | module | 19 | yes | pub mod engine; |
| graph_change_set | module | 20 | yes | pub mod graph_change_set; |
| invalidate | module | 23 | yes | pub mod invalidate; |
| observability | module | 24 | yes | pub mod observability; |
| reconcile | module | 25 | yes | pub mod reconcile; |
| scoped_graph | module | 26 | yes | pub mod scoped_graph; |
| typed_dag | module | 27 | yes | pub mod typed_dag; |
| utility_adapter | module | 28 | yes | pub mod utility_adapter; |
| web_memory | module | 30 | yes | pub mod web_memory; |
| Error | enum | 43 | yes | pub enum Error { |
| Result | type | 52 | yes | pub type Result&lt;T&gt; = std::result::Result&lt;T, Error&gt;; |
| fmt | method | 54 | no | fn fmt(&amp;self, f: &amp;mut fmt::Formatter&lt;&#39;_&gt;) -&gt; fmt::Result { |
| Properties | type | 73 | yes | pub type Properties = BTreeMap&lt;String, String&gt;; |
| NodeKind | enum | 76 | yes | pub enum NodeKind { |
| as_str | method | 87 | yes | pub fn as_str(&amp;self) -&gt; &amp;str { |
| from_str | method | 99 | yes | pub fn from_str(s: &amp;str) -&gt; Self { |
| Node | struct | 113 | yes | pub struct Node { |
| property | method | 132 | yes | pub fn property(mut self, key: &amp;str, value: &amp;str) -&gt; Self { |
| source | method | 136 | yes | pub fn source(mut self, citation: &amp;str) -&gt; Self { |
| Edge | struct | 142 | yes | pub struct Edge { |
| identity | function | 162 | no | fn identity(id: &amp;str) -&gt; Result&lt;()&gt; { |
| RESERVED_PROPERTY_PREFIX | const | 174 | yes | pub const RESERVED_PROPERTY_PREFIX: &amp;str = &quot;hqkg.&quot;; |
| validate_public_properties | function | 175 | no | fn validate_public_properties(props: &amp;Properties) -&gt; Result&lt;()&gt; { |
| Graph | struct | 186 | yes | pub struct Graph { |
| epoch | method | 198 | yes | pub fn epoch(&amp;self) -&gt; u64 { |
| nodes | method | 201 | yes | pub fn nodes(&amp;self) -&gt; impl Iterator&lt;Item = &amp;Node&gt; { |
| edges | method | 204 | yes | pub fn edges(&amp;self) -&gt; impl Iterator&lt;Item = &amp;Edge&gt; { |
| node | method | 207 | yes | pub fn node(&amp;self, id: &amp;str) -&gt; Option&lt;&amp;Node&gt; { |
| edge | method | 210 | yes | pub fn edge(&amp;self, id: &amp;str) -&gt; Option&lt;&amp;Edge&gt; { |
| node_count | method | 213 | yes | pub fn node_count(&amp;self) -&gt; usize { |
| edge_count | method | 216 | yes | pub fn edge_count(&amp;self) -&gt; usize { |
| bump | method | 219 | no | fn bump(&amp;mut self) -&gt; Result&lt;()&gt; { |
| put_node | method | 226 | yes | pub fn put_node(&amp;mut self, n: Node) -&gt; Result&lt;()&gt; { |
| put_node_importer | method | 234 | yes | pub(crate) fn put_node_importer(&amp;mut self, mut n: Node) -&gt; Result&lt;()&gt; { |
| index_edge | method | 250 | no | fn index_edge(&amp;mut self, e: &amp;Edge) { |
| unindex_edge | method | 260 | no | fn unindex_edge(&amp;mut self, e: &amp;Edge) { |
| put_edge | method | 274 | yes | pub fn put_edge(&amp;mut self, e: Edge) -&gt; Result&lt;()&gt; { |
| put_edge_importer | method | 280 | yes | pub(crate) fn put_edge_importer(&amp;mut self, e: Edge) -&gt; Result&lt;()&gt; { |
| remove_edge | method | 296 | yes | pub fn remove_edge(&amp;mut self, id: &amp;str) -&gt; Result&lt;bool&gt; { |
| remove_node | method | 306 | yes | pub fn remove_node(&amp;mut self, id: &amp;str) -&gt; Result&lt;bool&gt; { |
| outgoing | method | 328 | yes | pub fn outgoing(&amp;self, id: &amp;str, relation: Option&lt;&amp;str&gt;) -&gt; Result&lt;Vec&lt;&amp;Edge&gt;&gt; { |
| incoming | method | 341 | yes | pub fn incoming(&amp;self, id: &amp;str, relation: Option&lt;&amp;str&gt;) -&gt; Result&lt;Vec&lt;&amp;Edge&gt;&gt; { |
| check_indexes | method | 355 | yes | pub fn check_indexes(&amp;self) -&gt; Result&lt;()&gt; { |
| shortest_path | method | 387 | yes | pub fn shortest_path( &amp;self, start: &amp;str, end: &amp;str, relation: Option&lt;&amp;str&gt;, |
| reachable | method | 421 | yes | pub fn reachable( &amp;self, start: &amp;str, relation: Option&lt;&amp;str&gt;, max: usize, |
| topological | method | 446 | yes | pub fn topological(&amp;self, relation: &amp;str) -&gt; Result&lt;Vec&lt;String&gt;&gt; { |
| least_cost_path | method | 473 | yes | pub fn least_cost_path(&amp;self, start: &amp;str, end: &amp;str) -&gt; Result&lt;Option&lt;(u64, Vec&lt;String&gt;)&gt;&gt; { |
| search | method | 513 | yes | pub fn search(&amp;self, needle: &amp;str, limit: usize) -&gt; Vec&lt;&amp;Node&gt; { |
| page_rank | method | 527 | yes | pub fn page_rank(&amp;self, iterations: usize, damping: f64) -&gt; Result&lt;BTreeMap&lt;String, f64&gt;&gt; { |
| record_engine_swap | method | 573 | yes | pub fn record_engine_swap( &amp;mut self, desc: &amp;EngineDescriptor, receipt: &amp;SwapReceipt, ) -&gt; Result&lt;()&gt; { |
| FRAME | const | 624 | no | const FRAME: &amp;[u8; 4] = b&quot;HQJ1&quot;; |
| DELTA_FRAME | const | 626 | no | const DELTA_FRAME: &amp;[u8; 4] = b&quot;HQD1&quot;; |
| MAX_FRAME | const | 627 | no | const MAX_FRAME: usize = 128 * 1024 * 1024; |
| hash | function | 628 | no | fn hash(buf: &amp;[u8]) -&gt; u64 { |
| put_str | function | 635 | no | fn put_str(b: &amp;mut Vec&lt;u8&gt;, s: &amp;str) -&gt; Result&lt;()&gt; { |
| read_u32 | function | 644 | no | fn read_u32(r: &amp;mut Cursor&lt;&amp;[u8]&gt;) -&gt; Result&lt;u32&gt; { |
| read_u64 | function | 650 | no | fn read_u64(r: &amp;mut Cursor&lt;&amp;[u8]&gt;) -&gt; Result&lt;u64&gt; { |
| read_str | function | 656 | no | fn read_str(r: &amp;mut Cursor&lt;&amp;[u8]&gt;) -&gt; Result&lt;String&gt; { |
| count | function | 666 | no | fn count(b: &amp;mut Vec&lt;u8&gt;, n: usize) -&gt; Result&lt;()&gt; { |
| read_count | function | 673 | no | fn read_count(r: &amp;mut Cursor&lt;&amp;[u8]&gt;, max: u32) -&gt; Result&lt;usize&gt; { |
| write_props | function | 681 | no | fn write_props(b: &amp;mut Vec&lt;u8&gt;, p: &amp;Properties) -&gt; Result&lt;()&gt; { |
| read_props | function | 689 | no | fn read_props(r: &amp;mut Cursor&lt;&amp;[u8]&gt;) -&gt; Result&lt;Properties&gt; { |
| serialize | function | 696 | yes | pub fn serialize(g: &amp;Graph) -&gt; Result&lt;Vec&lt;u8&gt;&gt; { |
| deserialize | function | 722 | yes | pub fn deserialize(data: &amp;[u8]) -&gt; Result&lt;Graph&gt; { |
| JournalStatus | struct | 793 | yes | pub struct JournalStatus { |
| Journal | struct | 801 | yes | pub struct Journal { |
| WriteLock | struct | 805 | no | struct WriteLock { |
| drop | method | 810 | no | fn drop(&amp;mut self) { |
| merge_additive | function | 817 | no | fn merge_additive(graph: &amp;mut Graph, delta: &amp;Graph) -&gt; Result&lt;()&gt; { |
| path | method | 868 | yes | pub fn path(&amp;self) -&gt; &amp;Path { |
| scan | method | 871 | no | fn scan(&amp;self) -&gt; Result&lt;(Graph, usize, bool)&gt; { |
| load | method | 922 | yes | pub fn load(&amp;self) -&gt; Result&lt;Graph&gt; { |
| status | method | 925 | yes | pub fn status(&amp;self) -&gt; Result&lt;JournalStatus&gt; { |
| load_with_status | method | 931 | yes | pub fn load_with_status(&amp;self) -&gt; Result&lt;(Graph, JournalStatus)&gt; { |
| repair_torn_tail | method | 953 | yes | pub fn repair_torn_tail(&amp;self, expected_epoch: u64) -&gt; Result&lt;u64&gt; { |
| append_delta | method | 991 | yes | pub fn append_delta(&amp;self, delta: &amp;Graph, expected_bytes: u64) -&gt; Result&lt;u64&gt; { |
| save | method | 1041 | yes | pub fn save(&amp;self, g: &amp;Graph) -&gt; Result&lt;()&gt; { |
| save_checked | method | 1046 | yes | pub fn save_checked(&amp;self, g: &amp;Graph, expected_bytes: u64, expected_epoch: u64) -&gt; Result&lt;()&gt; { |
| save_snapshot | method | 1049 | no | fn save_snapshot(&amp;self, g: &amp;Graph, expected: Option&lt;(u64, u64)&gt;) -&gt; Result&lt;()&gt; { |
| JournalCompactionReceipt | struct | 1122 | yes | pub struct JournalCompactionReceipt { |
| compact_verified | method | 1135 | yes | pub fn compact_verified( &amp;self, expected_bytes: u64, expected_epoch: u64, ) -&gt; Result&lt;JournalCompactionReceipt&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::{BTreeMap, BTreeSet, VecDeque} | use | 3 | external |
| std::fmt | use | 4 | external |
| std::fs::{self, OpenOptions} | use | 5 | external |
| std::io::{self, Cursor, Read, Seek, SeekFrom, Write} | use | 6 | external |
| std::path::{Path, PathBuf} | use | 7 | external |
| adapters | use | 9 | external |
| algorithm_adapter | use | 10 | external |
| apply_ledger | use | 11 | external |
| builtins | use | 12 | external |
| context_retrieval | use | 13 | external |
| managed_context | use | 15 | external |
| control | use | 16 | external |
| database | use | 17 | external |
| durable_dag | use | 18 | external |
| engine | use | 19 | external |
| graph_change_set | use | 20 | external |
| import | use | 22 | external |
| invalidate | use | 23 | external |
| observability | use | 24 | external |
| reconcile | use | 25 | external |
| scoped_graph | use | 26 | external |
| typed_dag | use | 27 | external |
| utility_adapter | use | 28 | external |
| web_memory | use | 30 | external |
| algorithm_adapter::{ | use | 31 | external |
| database::{DataTable, DatabaseKind, DatabaseSpec} | use | 36 | external |
| engine::{ | use | 37 | external |
| std::os::unix::fs::OpenOptionsExt | use | 1105 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
#[cfg(feature = "importer")]
pub mod managed_context;
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
```

_First 80 of 1206 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
