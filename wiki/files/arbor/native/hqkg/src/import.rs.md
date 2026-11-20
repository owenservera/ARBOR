# File: native/hqkg/src/import.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/import.rs |
| Language | Rust |
| Kind | source |
| Size | 19035 B |
| Lines | 458 |
| Hash | 3872b15497c3 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 10 | yes | pub const SCHEMA: &amp;str = &quot;repos-hq.hqkg-exchange/1&quot;; |
| MAX_BYTES | const | 11 | yes | pub const MAX_BYTES: usize = 128 * 1024 * 1024; |
| MAX_NODES | const | 12 | yes | pub const MAX_NODES: usize = 250_000; |
| MAX_EDGES | const | 13 | yes | pub const MAX_EDGES: usize = 1_000_000; |
| MAX_TOMBSTONES | const | 14 | yes | pub const MAX_TOMBSTONES: usize = 250_000; |
| OWNER_KEY | const | 15 | no | const OWNER_KEY: &amp;str = &quot;hqkg.exchange.source&quot;; |
| SCHEMA_KEY | const | 16 | no | const SCHEMA_KEY: &amp;str = &quot;hqkg.exchange.schema&quot;; |
| KIND_KEY | const | 17 | no | const KIND_KEY: &amp;str = &quot;hqkg.exchange.kind&quot;; |
| Phase | enum | 22 | no | enum Phase { |
| Manifest | struct | 29 | yes | pub struct Manifest { |
| Exchange | struct | 42 | yes | pub struct Exchange { |
| ImportStats | struct | 52 | yes | pub struct ImportStats { |
| changed | method | 63 | yes | pub fn changed(&amp;self) -&gt; bool { |
| obj | function | 74 | no | fn obj&lt;&#39;a&gt;(v: &amp;&#39;a Value, label: &amp;str) -&gt; Result&lt;&amp;&#39;a Map&lt;String, Value&gt;&gt; { |
| req_str | function | 78 | no | fn req_str&lt;&#39;a&gt;(m: &amp;&#39;a Map&lt;String, Value&gt;, k: &amp;str) -&gt; Result&lt;&amp;&#39;a str&gt; { |
| req_usize | function | 83 | no | fn req_usize(m: &amp;Map&lt;String, Value&gt;, k: &amp;str, max: usize) -&gt; Result&lt;usize&gt; { |
| string_id | function | 93 | no | fn string_id(s: &amp;str) -&gt; Result&lt;()&gt; { |
| source | function | 99 | no | fn source(s: &amp;str) -&gt; Result&lt;()&gt; { |
| meta | function | 105 | no | fn meta(m: &amp;Map&lt;String, Value&gt;) -&gt; Result&lt;Properties&gt; { |
| parse | function | 156 | yes | pub fn parse(data: &amp;[u8]) -&gt; Result&lt;Exchange&gt; { |
| apply | method | 363 | yes | pub fn apply(&amp;self, graph: &amp;mut Graph) -&gt; Result&lt;ImportStats&gt; { |
| verify_source_projection | method | 444 | yes | pub fn verify_source_projection(&amp;self, graph: &amp;Graph) -&gt; Result&lt;()&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::{Edge, Error, Graph, Node, NodeKind, Properties, Result} | use | 5 | external |
| serde_json::{Map, Value} | use | 6 | external |
| sha2::{Digest, Sha256} | use | 7 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 8 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Deterministic HQKGX1 JSONL importer; optional dependencies stay out of std-only kernel. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | Data-only transport cannot install engines, approve actions or overwrite manually owned nodes. |
| 4 | invariant | — | — | Validate all transport bytes before changing the graph; one journal snapshot per accepted import. |

## Excerpt

```rust
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
```

_First 80 of 459 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
