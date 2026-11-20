# File: native/hqkg/src/typed_dag.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/typed_dag.rs |
| Language | Rust |
| Kind | source |
| Size | 25620 B |
| Lines | 677 |
| Hash | 37eeee8e25d8 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONTRACT | const | 14 | yes | pub const CONTRACT: &amp;str = &quot;hqkg.typed-dag/1&quot;; |
| GraphDomain | enum | 17 | yes | pub enum GraphDomain { |
| validate | method | 28 | yes | pub fn validate(&amp;self) -&gt; Result&lt;()&gt; { |
| label | method | 31 | yes | pub fn label(&amp;self) -&gt; String { |
| RevisionToken | struct | 43 | yes | pub struct RevisionToken { |
| ProgramIdentity | struct | 52 | yes | pub struct ProgramIdentity { |
| validate | method | 71 | yes | pub fn validate(&amp;self) -&gt; Result&lt;()&gt; { |
| stamp | method | 76 | yes | pub fn stamp(&amp;self) -&gt; String { |
| ValidatedPureProgram | struct | 89 | yes | pub struct ValidatedPureProgram { |
| plan | method | 146 | yes | pub fn plan(&amp;self) -&gt; TransformPlan { |
| SourceBinding | struct | 164 | yes | pub struct SourceBinding { |
| TransformStep | struct | 174 | yes | pub struct TransformStep { |
| TransformPlan | struct | 187 | yes | pub struct TransformPlan { |
| RunState | enum | 193 | yes | pub enum RunState { |
| OutputState | enum | 201 | yes | pub enum OutputState { |
| MaterializedOutput | struct | 206 | yes | pub struct MaterializedOutput { |
| DagReport | struct | 217 | yes | pub struct DagReport { |
| Cached | struct | 229 | no | struct Cached { |
| IncrementalCache | struct | 237 | yes | pub struct IncrementalCache { |
| with_limits | method | 253 | yes | pub fn with_limits(max_entries: usize, max_bytes: usize) -&gt; Self { |
| len | method | 260 | yes | pub fn len(&amp;self) -&gt; usize { |
| approximate_bytes | method | 263 | yes | pub fn approximate_bytes(&amp;self) -&gt; usize { |
| enforce_limits | method | 276 | no | fn enforce_limits(&amp;mut self) { |
| invalidate | method | 293 | yes | pub fn invalidate(&amp;mut self, ns: &amp;Namespace, ids: &amp;BTreeSet&lt;String&gt;) -&gt; usize { |
| clear_namespace | method | 299 | yes | pub fn clear_namespace(&amp;mut self, ns: &amp;Namespace) { |
| invalidate_changes | method | 306 | yes | pub fn invalidate_changes( &amp;mut self, ns: &amp;Namespace, report: &amp;crate::graph_change_set::ApplyReport, ) -&gt; usize { |
| valid_id | function | 319 | no | fn valid_id(s: &amp;str, max: usize) -&gt; Result&lt;()&gt; { |
| field | function | 327 | no | fn field(out: &amp;mut String, s: &amp;str) { |
| is_sha256 | function | 332 | no | fn is_sha256(s: &amp;str) -&gt; bool { |
| validate | function | 337 | no | fn validate(plan: &amp;TransformPlan, actual: &amp;RevisionToken, budget: Budget) -&gt; Result&lt;Vec&lt;String&gt;&gt; { |
| DagExecutor | struct | 418 | yes | pub struct DagExecutor&lt;&#39;a&gt; { |
| run_validated | function | 429 | yes | pub fn run_validated( &amp;self, program: &amp;ValidatedPureProgram, actual: &amp;RevisionToken, cache: &amp;mut IncrementalCache, |
| run | function | 443 | yes | pub fn run( &amp;self, plan: &amp;TransformPlan, actual: &amp;RevisionToken, cache: &amp;mut IncrementalCache, |
| fail | function | 673 | no | fn fail(r: &amp;mut DagReport, id: &amp;str, state: RunState, error: Error) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::engine::{Budget, CancellationToken, EngineRegistry, Scheduler, Task} | use | 8 | external |
| crate::{Error, Result} | use | 9 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 10 | external |
| crate::engine::{PURE_ENGINE_SLOT, PURE_INTERFACE, PURE_OPERATIONS} | use | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Versioned, in-process typed transformation DAG built on the existing EngineRegistry
//! and Scheduler. No graph store, effect authority, or independent runtime.
//!
//! An engine using PURE_INTERFACE promises deterministic, effect-free computation.
//! This is a trusted Rust integration contract, NOT a security sandbox or grant.
//! Source provenance and revision tokens must be authenticated by the owner.
//! Raw outputs are ephemeral; never send personal outputs to the HQ index.
use crate::engine::{Budget, CancellationToken, EngineRegistry, Scheduler, Task};
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};

pub use crate::engine::{PURE_ENGINE_SLOT, PURE_INTERFACE, PURE_OPERATIONS};

pub const CONTRACT: &str = "hqkg.typed-dag/1";

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum GraphDomain {
    Development,
    Personal,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Namespace {
    pub domain: GraphDomain,
    pub owner: String,
}
impl Namespace {
    pub fn validate(&self) -> Result<()> {
        valid_id(&self.owner, 80)
    }
    pub fn label(&self) -> String {
        format!(
            "{}:{}",
            match self.domain {
                GraphDomain::Development => "development",
                GraphDomain::Personal => "personal",
            },
            self.owner
        )
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RevisionToken {
    pub namespace: Namespace,
    pub graph_epoch: u64,
}

/// Inert identity of a program that already passed core/programmability policy
/// validation. It is carried into the DAG so cached and materialized outputs
/// stay bound to the exact program revision. Never a grant.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ProgramIdentity {
    pub id: String,
    pub revision: u64,
    pub policy_revision: u64,
}
impl ProgramIdentity {
    pub fn new(id: &str, revision: u64, policy_revision: u64) -> Result<Self> {
        valid_id(id, 128)?;
        if revision == 0 || policy_revision == 0 {
            return Err(Error::Invalid(
                "program identity revision must be non-zero".into(),
            ));
        }
        Ok(Self {
            id: id.into(),
            revision,
            policy_revision,
        })
    }
    pub fn validate(&self) -> Result<()> {
        Self::new(&self.id, self.revision, self.policy_revision).map(|_| ())
    }
    /// Deterministic stamp framed into every step input, so the cache key,
    /// materialized stamp and engine fingerprint all bind to this revision.
    pub fn stamp(&self) -> String {
        format!("{}@{}#{}", self.id, self.revision, self.policy_revision)
    }
}
```

_First 80 of 678 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
