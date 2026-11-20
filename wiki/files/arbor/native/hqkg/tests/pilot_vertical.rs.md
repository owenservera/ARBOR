# File: native/hqkg/tests/pilot_vertical.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/pilot_vertical.rs |
| Language | Rust |
| Kind | source |
| Size | 15172 B |
| Lines | 394 |
| Hash | 0f9f6ce288f8 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| case_dir | function | 54 | no | fn case_dir() -&gt; Option&lt;PathBuf&gt; { |
| out_dir | function | 58 | no | fn out_dir() -&gt; PathBuf { |
| json_str | function | 62 | no | fn json_str(v: &amp;Value, key: &amp;str) -&gt; String { |
| parse_node | function | 69 | no | fn parse_node(v: &amp;Value) -&gt; Node { |
| parse_edge | function | 97 | no | fn parse_edge(v: &amp;Value) -&gt; Edge { |
| parse_ops | function | 116 | no | fn parse_ops(v: &amp;Value) -&gt; Vec&lt;ChangeOp&gt; { |
| parse_change_set | function | 140 | no | fn parse_change_set( v: &amp;Value, id_key: &amp;str, ops_key: &amp;str, parent: Option&lt;String&gt;, |
| load_seed | function | 154 | no | fn load_seed(seed: &amp;Value) -&gt; Graph { |
| snapshot | function | 165 | no | fn snapshot(g: &amp;Graph) -&gt; Value { |
| report_json | function | 200 | no | fn report_json(r: &amp;ApplyReport) -&gt; Value { |
| state_key | function | 214 | no | fn state_key(snapshot: &amp;Value) -&gt; Value { |
| run_case | function | 223 | no | fn run_case(path: &amp;Path, out_dir: &amp;Path) { |
| pilot_vertical_cases | function | 376 | no | fn pilot_vertical_cases() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::env | use | 46 | external |
| std::fs | use | 47 | external |
| std::path::{Path, PathBuf} | use | 48 | external |
| hqkg::graph_change_set::{apply, ApplyLedger, ApplyReport, ChangeOp, GraphChangeSet} | use | 50 | external |
| hqkg::{Edge, Graph, Node, NodeKind, Properties} | use | 51 | external |
| serde_json::{json, Map, Value} | use | 52 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 41 | context | — | — | pilot vertical Rust hop: apply GraphChangeSets from the run-vertical harness and emit reports |
| 42 | owner | hq-agent | — | hq-agent |
| 43 | task | — | — | required-integrated-proof (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md) |
| 44 | see | — | src/graph_change_set.rs, | src/graph_change_set.rs, docs/orchestration/intelligence-upgrade/local-integration/pilot/ |

## Excerpt

````rust
#![cfg(feature = "importer")]
//! Pilot vertical Rust hop ("Required integrated proof" vertical,
//! docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md).
//!
//! Driven by docs/orchestration/intelligence-upgrade/local-integration/pilot/run-vertical.mjs:
//! the harness writes one `*.case.json` per case into PILOT_CASES_DIR, runs
//! `cargo test --features importer --test pilot_vertical`, and reads one
//! `*.out.json` per case from PILOT_OUT_DIR. Without PILOT_CASES_DIR set the
//! test is a no-op so the normal `cargo test --features importer` suite stays
//! green.
//!
//! Case file shape (op-level JSON; the harness separately validates the
//! contract-envelope JSON against contracts/graph-change-set.schema.json):
//!
//! ```json
//! {
//!   "case": "apply-main",
//!   "mode": "apply" | "duplicate" | "stale" | "rollback",
//!   "changeSetId": "pilot-cs-0001",
//!   "rollbackChangeSetId": "pilot-cs-0001-rollback",
//!   "source": "run-vertical",
//!   "seedGraph": { "nodes": [NodeJson], "edges": [EdgeJson] },
//!   "ops": [ChangeOpJson],
//!   "rollbackOps": [ChangeOpJson],
//!   "mutateBeforeApply": { "removeNode": "node-id" }
//! }
//! ```
//!
//! NodeJson:      { id, kind, title, properties: {..}, sources: [..] }
//! EdgeJson:      { id, from, to, relation, weight, properties: {..} }
//! ChangeOpJson:  { op: "putNode", node: NodeJson }
//!              | { op: "putEdge", edge: EdgeJson }
//!              | { op: "removeNode", entityId, reason, ts }
//!              | { op: "removeEdge", entityId, reason, ts }
//!
//! Per-mode assertions live here (a bad case fails `cargo test`, i.e. the hop
//! itself is a real test, not a silent JSON writer). The emitted out JSON
//! carries the ApplyReport(s), the final graph snapshot and mode checks for
//! the harness receipts.
//!
//! @hq:context pilot vertical Rust hop: apply GraphChangeSets from the run-vertical harness and emit reports
//! @hq:owner hq-agent
//! @hq:task required-integrated-proof (docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md)
//! @hq:see src/graph_change_set.rs, docs/orchestration/intelligence-upgrade/local-integration/pilot/

use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use hqkg::graph_change_set::{apply, ApplyLedger, ApplyReport, ChangeOp, GraphChangeSet};
use hqkg::{Edge, Graph, Node, NodeKind, Properties};
use serde_json::{json, Map, Value};

fn case_dir() -> Option<PathBuf> {
    env::var_os("PILOT_CASES_DIR").map(PathBuf::from)
}

fn out_dir() -> PathBuf {
    PathBuf::from(env::var_os("PILOT_OUT_DIR").unwrap_or_else(|| env::temp_dir().into_os_string()))
}

fn json_str(v: &Value, key: &str) -> String {
    v[key]
        .as_str()
        .unwrap_or_else(|| panic!("case field {key:?} missing or not a string"))
        .to_owned()
}

fn parse_node(v: &Value) -> Node {
    let properties: Properties = v["properties"]
        .as_object()
        .map(|m: &Map<String, Value>| {
            m.iter()
                .map(|(k, val)| (k.clone(), val.as_str().unwrap_or_default().to_owned()))
                .collect()
        })
        .unwrap_or_default();
    let sources = v["sources"]
        .as_array()
        .map(|a| {
````

_First 80 of 395 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
