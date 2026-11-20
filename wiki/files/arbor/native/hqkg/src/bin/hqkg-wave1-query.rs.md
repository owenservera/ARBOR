# File: native/hqkg/src/bin/hqkg-wave1-query.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/bin/hqkg-wave1-query.rs |
| Language | Rust |
| Kind | source |
| Size | 8499 B |
| Lines | 223 |
| Hash | 9fdf06e47774 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SOURCE | const | 5 | no | const SOURCE: &amp;str = &quot;repos-hq/vivim-wave1-lane-e&quot;; |
| MAX_MATCHES | const | 6 | no | const MAX_MATCHES: usize = 32; |
| MAX_EDGES | const | 7 | no | const MAX_EDGES: usize = 256; |
| COMMUNICATION | const | 8 | no | const COMMUNICATION: &amp;[&amp;str] = &amp;[ |
| pick | function | 19 | no | fn pick&lt;&#39;a&gt;(graph: &amp;&#39;a Graph, key: &amp;str) -&gt; Result&lt;Vec&lt;&amp;&#39;a Node&gt;&gt; { |
| basic | function | 43 | no | fn basic(n: &amp;Node) -&gt; Value { |
| linked | function | 51 | no | fn linked(g: &amp;Graph, n: &amp;Node, communication_only: bool) -&gt; Value { |
| query | function | 78 | no | fn query(g: &amp;Graph, command: &amp;str, key: &amp;str) -&gt; Result&lt;Value&gt; { |
| run | function | 123 | no | fn run() -&gt; Result&lt;()&gt; { |
| main | function | 139 | no | fn main() { |
| tests | module | 147 | no | mod tests { |
| graph | function | 151 | no | fn graph() -&gt; Graph { |
| where_and_what_resolve_provenance | function | 193 | no | fn where_and_what_resolve_provenance() { |
| calls_are_static_not_observed | function | 206 | no | fn calls_are_static_not_observed() { |
| unknown_ids_refuse_and_missing_targets_remain_unknown | function | 215 | no | fn unknown_ids_refuse_and_missing_targets_remain_unknown() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::{Error, Graph, Journal, Node, Result} | use | 3 | external |
| serde_json::{json, Value} | use | 4 | external |
| super::* | use | 148 | external |
| hqkg::import::{Exchange, Manifest} | use | 149 | external |
| hqkg::{Edge, NodeKind} | use | 150 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Wave 1 Lane E: pure, read-only provenance queries over the existing HQKG journal.
//! No imports, engine execution, SQLite/Host access or authorization decisions.
use hqkg::{Error, Graph, Journal, Node, Result};
use serde_json::{json, Value};
const SOURCE: &str = "repos-hq/vivim-wave1-lane-e";
const MAX_MATCHES: usize = 32;
const MAX_EDGES: usize = 256;
const COMMUNICATION: &[&str] = &[
    "IMPORTS",
    "CALLS",
    "EMITS",
    "CONSUMES",
    "IPC",
    "WEBSOCKET",
    "TRANSPORT",
    "TALKS_TO",
];

fn pick<'a>(graph: &'a Graph, key: &str) -> Result<Vec<&'a Node>> {
    if key.len() > 256 || key.is_empty() || key.chars().any(char::is_control) {
        return Err(Error::Invalid("query identity missing or unsafe".into()));
    }
    let mut found = graph
        .nodes()
        .filter(|n| {
            n.properties.get("hqkg.exchange.source").map(String::as_str) == Some(SOURCE)
                && (n.id == key
                    || n.properties.get("source_id").map(String::as_str) == Some(key)
                    || n.properties.get("semantic_id").map(String::as_str) == Some(key))
        })
        .collect::<Vec<_>>();
    found.sort_by(|a, b| a.id.cmp(&b.id));
    if found.len() > MAX_MATCHES {
        return Err(Error::Invalid(
            "ambiguous query exceeds 32 bounded matches".into(),
        ));
    }
    if found.is_empty() {
        return Err(Error::Missing("no exact graph identity match".into()));
    }
    Ok(found)
}
fn basic(n: &Node) -> Value {
    json!({"id":n.id,"kind":n.kind.as_str(),"title":n.title,"revision":n.version,
      "sourceId":n.properties.get("source_id"),"sourceLane":n.properties.get("source_lane"),
      "semanticId":n.properties.get("semantic_id"),"status":n.properties.get("status"),
      "sourcePath":n.properties.get("source_path"),"sourceCommit":n.properties.get("source_commit"),
      "contentSha256":n.properties.get("content_sha256"),"sourceLine":n.properties.get("source_line"),
      "sourceRoot":n.properties.get("source_root")})
}
fn linked(g: &Graph, n: &Node, communication_only: bool) -> Value {
    let mut rows = Vec::new();
    for e in g.edges() {
        if e.from != n.id && e.to != n.id {
            continue;
        }
        if communication_only && !COMMUNICATION.contains(&e.relation.as_str()) {
            continue;
        }
        if e.properties.get("hqkg.exchange.source").map(String::as_str) != Some(SOURCE) {
            continue;
        }
        let other = if e.from == n.id { &e.to } else { &e.from };
        let Some(target) = g.node(other) else {
            continue;
        };
        rows.push(
            json!({"edgeId":e.id,"direction":if e.from==n.id{"out"}else{"in"},
          "relation":e.relation,"evidenceClass":e.properties.get("evidence_class"),
          "evidence":e.properties.get("evidence"),"other":basic(target)}),
        );
        if rows.len() == MAX_EDGES {
            break;
        }
    }
    Value::Array(rows)
}
fn query(g: &Graph, command: &str, key: &str) -> Result<Value> {
    if !["where", "what", "talks-to", "gap"].contains(&command) {
        return Err(Error::Invalid(
```

_First 80 of 224 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
