# File: native/hqkg/src/adapters/research.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/adapters/research.rs |
| Language | Rust |
| Kind | source |
| Size | 5870 B |
| Lines | 157 |
| Hash | 4aa14f5a53bb |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ResearchCatalogCompute | struct | 8 | yes | pub struct ResearchCatalogCompute { |
| kind | method | 19 | no | fn kind(n: &amp;Node) -&gt; &amp;str { |
| field | method | 25 | no | fn field&lt;&#39;a&gt;(n: &amp;&#39;a Node, key: &amp;str) -&gt; &amp;&#39;a str { |
| filtered | function | 28 | no | fn filtered(g: &amp;Graph, kind: &amp;str) -&gt; Vec&lt;String&gt; { |
| score | function | 38 | no | fn score(g: &amp;Graph, file: &amp;str) -&gt; Result&lt;String&gt; { |
| resource | function | 68 | no | fn resource(g: &amp;Graph, id: &amp;str) -&gt; Result&lt;String&gt; { |
| descriptor | method | 88 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 105 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest} | use | 4 | external |
| crate::{Error, Graph, Node, NodeKind, Result} | use | 5 | external |
| std::sync::{Arc, RwLock} | use | 6 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Data-only compute adapter exposing three research catalogs as bounded read-only queries. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | Research data is inert metadata. This adapter never runs papers, tools, models or provider actions. |

## Excerpt

```rust
//! @hq:context Data-only compute adapter exposing three research catalogs as bounded read-only queries.
//! @hq:owner repos-hq
//! @hq:invariant Research data is inert metadata. This adapter never runs papers, tools, models or provider actions.
use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest};
use crate::{Error, Graph, Node, NodeKind, Result};
use std::sync::{Arc, RwLock};

pub struct ResearchCatalogCompute {
    pub graph: Arc<RwLock<Graph>>,
    pub implementation: String,
}
impl ResearchCatalogCompute {
    pub fn new(graph: Arc<RwLock<Graph>>) -> Self {
        Self {
            graph,
            implementation: "hqkg-catalog-read-v1".into(),
        }
    }
    fn kind(n: &Node) -> &str {
        match &n.kind {
            NodeKind::Other(s) => s.as_str(),
            x => x.as_str(),
        }
    }
    fn field<'a>(n: &'a Node, key: &str) -> &'a str {
        n.properties.get(key).map(String::as_str).unwrap_or("")
    }
    fn filtered(g: &Graph, kind: &str) -> Vec<String> {
        let mut rows = g
            .nodes()
            .filter(|n| Self::kind(n) == kind)
            .map(|n| format!("{}\t{}\t{}", n.id, n.title, Self::field(n, "status")))
            .collect::<Vec<_>>();
        rows.sort();
        rows.truncate(1000);
        rows
    }
    fn score(g: &Graph, file: &str) -> Result<String> {
        if file.is_empty() || file.len() > 128 {
            return Err(Error::Invalid(
                "expected bounded source file semantic ID".into(),
            ));
        }
        let record = g
            .nodes()
            .find(|n| {
                Self::kind(n) == "scoring-observation"
                    && n.properties.get("file_id").map(String::as_str) == Some(file)
            })
            .ok_or_else(|| {
                Error::Missing(format!("no provisional score observation for {file}"))
            })?;
        let mut result = vec![
            format!("file={file}"),
            "status=provisional_metadata_only".into(),
        ];
        for i in 1..=10 {
            let key = format!("F{i:02}");
            let value = record
                .properties
                .get(&key)
                .map(String::as_str)
                .unwrap_or("unknown");
            result.push(format!("{key}={value}"));
        }
        Ok(result.join("\n"))
    }
    fn resource(g: &Graph, id: &str) -> Result<String> {
        let n = g
            .nodes()
            .find(|n| {
                Self::kind(n) == "language-resource"
                    && n.properties.get("resource_id").map(String::as_str) == Some(id)
            })
            .ok_or_else(|| Error::Missing(format!("language resource not found: {id}")))?;
        Ok(format!(
            "resource={}\nfamily={}\nasset_mode={}\nasset_kinds={}\nstatus={}\ninstalled={}",
            n.title,
            Self::field(n, "family"),
            Self::field(n, "asset_mode"),
```

_First 80 of 158 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
