# File: native/hqkg/src/bin/hqkg-personal.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/bin/hqkg-personal.rs |
| Language | Rust |
| Kind | source |
| Size | 36266 B |
| Lines | 556 |
| Hash | 4af502ce0cc0 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MIB | const | 25 | no | const MIB: u64 = 1024 * 1024; |
| MAX_CONTEXT_RECORDS | const | 31 | no | const MAX_CONTEXT_RECORDS: usize = 512; |
| MAX_CONTEXT_DELTAS | const | 32 | no | const MAX_CONTEXT_DELTAS: usize = 512; |
| text | function | 33 | no | fn text&lt;&#39;a&gt;(v: &amp;&#39;a Value, key: &amp;str) -&gt; Result&lt;&amp;&#39;a str, String&gt; { v[key].as_str().ok_or_else(\|\| format!(&quot;missing {key}&quot;)) } |
| hex | function | 34 | no | fn hex(s: &amp;str) -&gt; bool { s.len()==64 &amp;&amp; s.bytes().all(\|b\| b.is_ascii_digit() \|\| (b&#39;a&#39;..=b&#39;f&#39;).contains(&amp;b)) } |
| err | function | 35 | no | fn err(e: impl std::fmt::Display) -&gt; String { e.to_string() } |
| quarantine | function | 38 | no | fn quarantine(e: Error) -&gt; String { match e { Error::Corrupt(m) =&gt; format!(&quot;RECOVERY_REQUIRED {m}&quot;), other =&gt; err(other) } } |
| ContextRecord | struct | 43 | no | struct ContextRecord { |
| context_record | function | 54 | no | fn context_record(ns: &amp;Namespace, n: &amp;Value) -&gt; Result&lt;ContextRecord, String&gt; { |
| stage_record | function | 130 | no | fn stage_record(g: &amp;Graph, changes: GraphChangeSet, record: &amp;ContextRecord) -&gt; Result&lt;GraphChangeSet, String&gt; { |
| stage_tombstone | function | 160 | no | fn stage_tombstone(g: &amp;Graph, ns: &amp;Namespace, changes: GraphChangeSet, d: &amp;Value) |
| sync_context | function | 199 | no | fn sync_context(v: &amp;Value, ns: &amp;Namespace, journal: &amp;Journal, g: &amp;mut Graph, before: u64, scope: &amp;str) -&gt; Result&lt;Value, String&gt; { |
| run | function | 427 | no | fn run() -&gt; Result&lt;Value, String&gt; { |
| main | function | 556 | no | fn main() {match run(){Ok(v)=&gt;println!(&quot;{v}&quot;),Err(e)=&gt;{println!(&quot;{}&quot;,json!({&quot;schema&quot;:&quot;vivim.hqkg-personal/1&quot;,&quot;error&quot;:e}));std::process::exit(1);}}} |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::{Error, Graph, Journal, Node, NodeKind} | use | 17 | external |
| hqkg::graph_change_set::{ApplyLedger, GraphChangeSet} | use | 18 | external |
| hqkg::scoped_graph::{self, Provenance} | use | 19 | external |
| hqkg::managed_context::{check_managed_head, project_managed_graph} | use | 20 | external |
| hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken} | use | 21 | external |
| serde_json::{json, Value} | use | 22 | external |
| sha2::{Digest, Sha256} | use | 23 | external |
| std::{collections::{BTreeMap, BTreeSet}, fs, io::{self, Read}, path::PathBuf} | use | 24 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Host-invoked bounded adapter over the existing scoped graph and Journal.
//!
//! Durable ingestion has two modes that share one record parser and one change
//! set:
//!
//! * **complete projection** (`nodes`, no `deltas`): the packet is the caller's
//!   whole managed context snapshot, so a record the snapshot no longer carries
//!   is reconciled away.
//! * **explicit delta** (`deltas` + `baseRevision`): every record carries its
//!   own `put` / `delete` operation and the source revision it was projected
//!   from. Omission is never deletion here — only an explicit tombstone
//!   removes, and only while the live source has not moved past that revision.
//!
//! Neither mode is a receipt marker, a second source journal or a mutation
//! authority: identical observations are a no-op, stale revisions are refused,
//! and records owned by other personal capabilities survive.
use hqkg::{Error, Graph, Journal, Node, NodeKind};
use hqkg::graph_change_set::{ApplyLedger, GraphChangeSet};
use hqkg::scoped_graph::{self, Provenance};
use hqkg::managed_context::{check_managed_head, project_managed_graph};
use hqkg::typed_dag::{GraphDomain, Namespace, RevisionToken};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{collections::{BTreeMap, BTreeSet}, fs, io::{self, Read}, path::PathBuf};
const MIB: u64 = 1024 * 1024;
// Per-batch bound on one authorized durable ingestion. It bounds one Host
// packet, not the durable graph: a projection larger than one batch is ingested
// in successive batches, and the graph itself stays bounded by the capacity
// checks below (20000 nodes / 16 MiB). Bounded retrieval stays at 8 items in
// `managed_context`, so ingestion is deliberately independent of the read window.
const MAX_CONTEXT_RECORDS: usize = 512;
const MAX_CONTEXT_DELTAS: usize = 512;
fn text<'a>(v: &'a Value, key: &str) -> Result<&'a str, String> { v[key].as_str().ok_or_else(|| format!("missing {key}")) }
fn hex(s: &str) -> bool { s.len()==64 && s.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) }
fn err(e: impl std::fmt::Display) -> String { e.to_string() }
// Engine Corrupt results mean the managed journal needs explicit recovery; the Host
// classifies on the RECOVERY_REQUIRED prefix (never auto-repairs or steals locks).
fn quarantine(e: Error) -> String { match e { Error::Corrupt(m) => format!("RECOVERY_REQUIRED {m}"), other => err(other) } }

// One authoritative managed observation, parsed once and shared by both
// ingestion modes so a delta and a complete projection admit exactly the same
// records through exactly the same validation.
struct ContextRecord {
    node: Node,
    local: String,
    kind: String,
    source_ref: String,
    digest: String,
    revision: u64,
    page: bool,
    link: Option<(String, u64)>,
    provenance: Provenance,
}
fn context_record(ns: &Namespace, n: &Value) -> Result<ContextRecord, String> {
    let kind = text(n, "kind")?;
    let id = text(n, "id")?;
    let valid_id = match kind {
        "wiki" => id.strip_prefix("vivim-context-w-"),
        "effect" => id.strip_prefix("vivim-context-e-"),
        _ => None,
    };
    if !valid_id.map_or(false, hex) { return Err("invalid managed context identity".into()); }
    let source_ref = text(n, "sourceRef")?;
    if source_ref.is_empty() || source_ref.len() > 128 ||
        !source_ref.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'.') {
        return Err("invalid context source identity".into());
    }
    let digest = text(n, "digest")?;
    let title = text(n, "title")?;
    let summary = text(n, "summary")?;
    let order = n["order"].as_u64().ok_or("invalid context order")?;
    let revision = n["revision"].as_u64().ok_or("invalid context revision")?;
    if !hex(digest) || revision == 0 || title.is_empty() || title.chars().count() > 100 ||
        summary.chars().count() > 120 || title.chars().any(char::is_control) ||
        summary.chars().any(char::is_control) || order == 0 {
        return Err("invalid bounded context observation".into());
    }
    let source_revision = match n.get("sourceRevision") {
        Some(Value::Null) if kind == "effect" => String::new(),
        Some(x) if x.as_u64().is_some() => x.as_u64().unwrap().to_string(),
```

_First 80 of 556 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
