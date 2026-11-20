# File: native/hqkg/src/durable_dag.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/durable_dag.rs |
| Language | Rust |
| Kind | source |
| Size | 11118 B |
| Lines | 301 |
| Hash | 3148d7757b2d |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| JOURNAL_CONTRACT | const | 10 | yes | pub const JOURNAL_CONTRACT: &amp;str = &quot;hqkg.execution-descriptor/1&quot;; |
| DurableRun | struct | 12 | yes | pub struct DurableRun { |
| CommitReceipt | struct | 19 | yes | pub struct CommitReceipt { |
| run_segment | function | 25 | no | fn run_segment(id: &amp;str) -&gt; Result&lt;()&gt; { |
| scope_id | function | 38 | no | fn scope_id(ns: &amp;Namespace) -&gt; String { |
| run_id | function | 41 | no | fn run_id(ns: &amp;Namespace, run: &amp;str) -&gt; String { |
| step_id | function | 44 | no | fn step_id(ns: &amp;Namespace, run: &amp;str, step: &amp;str) -&gt; String { |
| validate_path_identity | function | 47 | no | fn validate_path_identity(ns: &amp;Namespace, run: &amp;str, report: Option&lt;&amp;DagReport&gt;) -&gt; Result&lt;()&gt; { |
| ensure_scope | function | 103 | no | fn ensure_scope(graph: &amp;Graph, ns: &amp;Namespace) -&gt; Result&lt;()&gt; { |
| commit_report | function | 128 | yes | pub fn commit_report( journal: &amp;Journal, ns: &amp;Namespace, run: &amp;str, r: &amp;DagReport, |
| recover_descriptions | function | 225 | yes | pub fn recover_descriptions(journal: &amp;Journal, ns: &amp;Namespace) -&gt; Result&lt;Vec&lt;DurableRun&gt;&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::typed_dag::{DagReport, Namespace, RunState, CONTRACT} | use | 6 | external |
| crate::{Error, Graph, Journal, Node, NodeKind, Result} | use | 7 | external |
| std::collections::BTreeMap | use | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Durable, redacted *descriptions* of graph computation, reusing HQKG's
//! existing HQD1 graph Journal. This is not a new execution log or store.
//! Computed payloads are deliberately NOT serialized. After restart, the
//! owner may replay the pure DAG against verified source revisions; it must
//! not interpret a journal description as an effect or as cached output.
use crate::typed_dag::{DagReport, Namespace, RunState, CONTRACT};
use crate::{Error, Graph, Journal, Node, NodeKind, Result};
use std::collections::BTreeMap;

pub const JOURNAL_CONTRACT: &str = "hqkg.execution-descriptor/1";
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DurableRun {
    pub run_id: String,
    pub state: String,
    pub steps: Vec<String>,
    pub failed_step: Option<String>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CommitReceipt {
    pub run_id: String,
    pub new_nodes: usize,
    pub total_bytes: u64,
}

fn run_segment(id: &str) -> Result<()> {
    if id.is_empty()
        || id.len() > 64
        || !id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err(Error::Invalid(
            "run id must be 1..64 ASCII letters/digits/-/_".into(),
        ));
    }
    Ok(())
}
fn scope_id(ns: &Namespace) -> String {
    format!("dag-scope:{}", ns.label())
}
fn run_id(ns: &Namespace, run: &str) -> String {
    format!("dag-run:{}:{}", ns.label(), run)
}
fn step_id(ns: &Namespace, run: &str, step: &str) -> String {
    format!("dag-step:{}:{}:{}", ns.label(), run, step)
}
fn validate_path_identity(ns: &Namespace, run: &str, report: Option<&DagReport>) -> Result<()> {
    ns.validate()?;
    run_segment(run)?;
    if run_id(ns, run).len() > 256 || scope_id(ns).len() > 256 {
        return Err(Error::Invalid(
            "durable identity exceeds graph limit".into(),
        ));
    }
    if let Some(r) = report {
        if r.schema != CONTRACT
            || r.namespace != *ns
            || r.revision.namespace != *ns
            || r.effect_authorized
        {
            return Err(Error::Conflict(
                "durable report/revision or effect-authority mismatch".into(),
            ));
        }
        if r.state == RunState::Complete && (r.failed_step.is_some() || r.failure.is_some()) {
            return Err(Error::Invalid("complete run cannot contain failure".into()));
        }
        let mut ids = std::collections::BTreeSet::new();
        for step in &r.outputs {
            if !ids.insert(step.step_id.as_str())
                || step.step_id.is_empty()
                || step.step_id.len() > 80
                || !step
                    .step_id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
                || step_id(ns, run, &step.step_id).len() > 256
            {
                return Err(Error::Invalid(
                    "unsafe, duplicate or oversized durable step id".into(),
```

_First 80 of 302 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
