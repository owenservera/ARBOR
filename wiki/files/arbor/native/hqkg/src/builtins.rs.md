# File: native/hqkg/src/builtins.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/builtins.rs |
| Language | Rust |
| Kind | source |
| Size | 5638 B |
| Lines | 159 |
| Hash | c64e85501d03 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GraphCompute | struct | 8 | yes | pub struct GraphCompute { |
| capabilities | method | 21 | no | fn capabilities() -&gt; BTreeSet&lt;String&gt; { |
| descriptor | method | 37 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 45 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| DatabaseCompute | struct | 99 | yes | pub struct DatabaseCompute { |
| table_text | method | 112 | no | fn table_text(table: DataTable) -&gt; String { |
| safe | method | 113 | no | fn safe(s: &amp;str) -&gt; String { |
| descriptor | method | 136 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 144 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest} | use | 3 | external |
| crate::{DataTable, DatabaseKind, DatabaseSpec, Error, Graph, Result} | use | 4 | external |
| std::collections::BTreeSet | use | 5 | external |
| std::sync::{Arc, RwLock} | use | 6 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Built-in graph and database compute engines, ready for generational swapping.
//! Register these via EngineRegistry::install and materialize their receipts in the graph.
use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest};
use crate::{DataTable, DatabaseKind, DatabaseSpec, Error, Graph, Result};
use std::collections::BTreeSet;
use std::sync::{Arc, RwLock};

pub struct GraphCompute {
    pub slot: String,
    pub implementation: String,
    pub graph: Arc<RwLock<Graph>>,
}
impl GraphCompute {
    pub fn new(slot: &str, graph: Arc<RwLock<Graph>>) -> Self {
        Self {
            slot: slot.into(),
            implementation: "hqkg-graph-std-v1".into(),
            graph,
        }
    }
    fn capabilities() -> BTreeSet<String> {
        [
            "path",
            "neighbors",
            "reachable",
            "topological",
            "rank",
            "search",
            "stats",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect()
    }
}
impl ComputeEngine for GraphCompute {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor {
            slot: self.slot.clone(),
            implementation: self.implementation.clone(),
            interface: "hqkg.graph-query.v1".into(),
            capabilities: Self::capabilities(),
        }
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        let g = self
            .graph
            .read()
            .map_err(|_| Error::Conflict("graph lock poisoned".into()))?;
        let result = match request.operation.as_str() {
            "stats" => format!(
                "epoch={} nodes={} edges={}",
                g.epoch(),
                g.node_count(),
                g.edge_count()
            ),
            "search" => g
                .search(&request.data, 100)
                .iter()
                .map(|n| format!("{}\t{}", n.id, n.title))
                .collect::<Vec<_>>()
                .join("\n"),
            "path" => {
                let (from, to) = request
                    .data
                    .split_once('\t')
                    .ok_or_else(|| Error::Invalid("path input must be FROM<TAB>TO".into()))?;
                g.shortest_path(from, to, None)?
                    .map_or_else(|| "NO_PATH".into(), |p| p.join(" -> "))
            }
            "neighbors" => g
                .outgoing(&request.data, None)?
                .iter()
                .map(|e| format!("{}\t{}\t{}", e.relation, e.to, e.weight))
                .collect::<Vec<_>>()
                .join("\n"),
            "reachable" => g.reachable(&request.data, None, 10_000)?.join("\n"),
            "topological" => g.topological(&request.data)?.join("\n"),
            "rank" => {
                let mut values = g.page_rank(40, 0.85)?.into_iter().collect::<Vec<_>>();
```

_First 80 of 160 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
