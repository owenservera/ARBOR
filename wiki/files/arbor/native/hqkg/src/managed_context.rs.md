# File: native/hqkg/src/managed_context.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/managed_context.rs |
| Language | Rust |
| Kind | source |
| Size | 8991 B |
| Lines | 157 |
| Hash | c10eee5b7ff5 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 10 | no | const SCHEMA: &amp;str = &quot;vivim.hqkg-chat-context/1&quot;; |
| MAX_JOURNAL_BYTES | const | 11 | no | const MAX_JOURNAL_BYTES: u64 = 64 * 1024 * 1024; |
| MAX_ITEMS | const | 12 | no | const MAX_ITEMS: usize = 8; |
| safe_title | function | 13 | no | fn safe_title(raw: &amp;str) -&gt; String { |
| scope_prefix | function | 17 | no | fn scope_prefix(scope: &amp;str, view: &amp;str) -&gt; Result&lt;(Namespace,String)&gt; { |
| check_managed_head | function | 28 | yes | pub fn check_managed_head(journal: &amp;Path, expected: &amp;JournalStatus) -&gt; Result&lt;()&gt; { |
| project_managed_graph | function | 45 | yes | pub fn project_managed_graph(graph: &amp;Graph, scope: &amp;str, epoch:u64, view:&amp;str) -&gt; Result&lt;Value&gt; { |
| project_managed | function | 137 | yes | pub fn project_managed(journal: &amp;Path, scope:&amp;str, epoch:u64, view:&amp;str) -&gt; Result&lt;Value&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::{Error, Graph, Journal, JournalStatus, Result} | use | 3 | external |
| crate::context_retrieval::{query_scoped, ScopedQuery} | use | 4 | external |
| crate::scoped_graph | use | 5 | external |
| crate::typed_dag::{GraphDomain, Namespace} | use | 6 | external |
| serde_json::{json, Value} | use | 7 | external |
| std::{collections::BTreeMap, fs, path::Path} | use | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Shared managed context projection. Native retrieval is reused by both
//! existing CLIs; neither creates a second graph or authorizes Host effects.
use crate::{Error, Graph, Journal, JournalStatus, Result};
use crate::context_retrieval::{query_scoped, ScopedQuery};
use crate::scoped_graph;
use crate::typed_dag::{GraphDomain, Namespace};
use serde_json::{json, Value};
use std::{collections::BTreeMap, fs, path::Path};

const SCHEMA: &str = "vivim.hqkg-chat-context/1";
const MAX_JOURNAL_BYTES: u64 = 64 * 1024 * 1024;
const MAX_ITEMS: usize = 8;
fn safe_title(raw: &str) -> String {
    raw.chars().filter(|c| !c.is_control()).take(100).collect()
}

fn scope_prefix(scope: &str, view: &str) -> Result<(Namespace,String)> {
    if scope.len() != 64 ||
       !scope.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) ||
       !matches!(view, "wiki" | "owner") {
        return Err(Error::Invalid("invalid managed context arguments".into()));
    }
    let ns=Namespace { domain:GraphDomain::Personal,owner:format!("pk-{scope}") };
    let prefix=scoped_graph::prefix(&ns)?;
    Ok((ns,prefix))
}

pub fn check_managed_head(journal: &Path, expected: &JournalStatus) -> Result<()> {
    let stat=fs::symlink_metadata(journal)?;
    if !journal.is_absolute() || !stat.is_file() || stat.file_type().is_symlink() ||
        stat.len()>MAX_JOURNAL_BYTES || stat.len()!=expected.total_bytes ||
        expected.trailing_bytes!=0 ||
        journal.with_extension("hqkg.lock").exists() ||
        journal.with_extension("hqkg.compact.tmp").exists() ||
        journal.with_extension("hqkg.preflight.tmp").exists() {
        return Err(Error::Conflict("managed journal unavailable or changed".into()));
    }
    Ok(())
}

// Project the actual replayed durable graph, not the requested input packet.
// Candidate selection is relevance-driven, not recency-driven: every context
// node of this view stays retrievable, and the scoped query budget bounds the
// output rather than the reachable set.
pub fn project_managed_graph(graph: &Graph, scope: &str, epoch:u64, view:&str) -> Result<Value> {
    let (ns,prefix)=scope_prefix(scope,view)?;
    graph.check_indexes()?;
    if graph.epoch()!=epoch ||
        graph.nodes().any(|n| !n.id.starts_with(&prefix) ||
            n.properties.get("hqkg.namespace")!=Some(&ns.label())) ||
        graph.edges().any(|e| !e.id.starts_with(&prefix)) {
        return Err(Error::Conflict("managed graph scope or epoch mismatch".into()));
    }
    let mut candidates = Vec::new();
    let mut orders: BTreeMap<String,u64> = BTreeMap::new();
    for node in graph.nodes() {
        let kind = node.properties.get("vivim.context.kind").map(String::as_str);
        if !node.id.starts_with(&format!("{prefix}vivim-context-")) ||
            !(kind == Some("wiki") || (view == "owner" && kind == Some("effect"))) {
            continue;
        }
        let order = node.properties.get("vivim.context.order")
            .and_then(|v| v.parse::<u64>().ok()).ok_or_else(|| Error::Corrupt("context order".into()))?;
        orders.insert(node.id.clone(), order);
        candidates.push(node.id.clone());
    }
    let total = candidates.len();
    // One bounded relationship scan feeds both relevance and the emitted page
    // relationships; every relationship keeps its revision and digest.
    let mut inbound: BTreeMap<String,u64> = candidates.iter().map(|id| (id.clone(),0)).collect();
    let mut outbound: BTreeMap<String,u64> = candidates.iter().map(|id| (id.clone(),0)).collect();
    let mut page_relationships = Vec::new();
    for edge in graph.edges() {
        if !edge.id.starts_with(&format!("{prefix}vivim-context-p-")) ||
            edge.properties.get("vivim.context.kind").map(String::as_str) != Some("wiki-page-link") {
            continue;
        }
        let from = graph.node(&edge.from).ok_or_else(|| Error::Corrupt("Wiki link endpoint missing".into()))?;
        let to = graph.node(&edge.to).ok_or_else(|| Error::Corrupt("Wiki link endpoint missing".into()))?;
        for node in [from,to] {
```

_First 80 of 158 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
