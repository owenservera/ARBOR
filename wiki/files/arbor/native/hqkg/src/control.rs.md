# File: native/hqkg/src/control.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/control.rs |
| Language | Rust |
| Kind | source |
| Size | 33863 B |
| Lines | 933 |
| Hash | 3cd2c1c0646e |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Version | struct | 13 | yes | pub struct Version { |
| parse | method | 26 | yes | pub fn parse(value: &amp;str) -&gt; Result&lt;Self&gt; { |
| label | method | 47 | yes | pub fn label(&amp;self) -&gt; String { |
| VersionRange | struct | 52 | yes | pub struct VersionRange { |
| accepts | method | 57 | yes | pub fn accepts(&amp;self, v: Version) -&gt; bool { |
| validate | method | 60 | yes | pub fn validate(&amp;self) -&gt; Result&lt;()&gt; { |
| ResourceKind | enum | 71 | yes | pub enum ResourceKind { |
| Resource | struct | 80 | yes | pub struct Resource { |
| Dependency | struct | 91 | yes | pub struct Dependency { |
| DependencyPlan | struct | 101 | yes | pub struct DependencyPlan { |
| valid_sha | function | 106 | no | fn valid_sha(s: &amp;str) -&gt; bool { |
| valid_key | function | 111 | no | fn valid_key(s: &amp;str) -&gt; bool { |
| telemetry_label | function | 114 | no | fn telemetry_label(s: &amp;str) -&gt; bool { |
| resolve_dependencies | function | 122 | yes | pub fn resolve_dependencies( requirements: &amp;[Dependency], resources: &amp;BTreeMap&lt;String, Resource&gt;, production: bool, ) -&gt; Result&lt;DependencyPlan&gt; { |
| Mode | enum | 226 | yes | pub enum Mode { |
| as_str | method | 231 | yes | pub fn as_str(&amp;self) -&gt; &amp;&#39;static str { |
| CoreConfig | struct | 239 | yes | pub struct CoreConfig { |
| ConfigPatch | struct | 264 | yes | pub struct ConfigPatch { |
| ConfigReceipt | struct | 274 | yes | pub struct ConfigReceipt { |
| validate | method | 281 | yes | pub fn validate(&amp;self) -&gt; Result&lt;()&gt; { |
| patch | method | 300 | yes | pub fn patch(&amp;mut self, expected_revision: u64, patch: ConfigPatch) -&gt; Result&lt;ConfigReceipt&gt; { |
| snapshot_node | method | 344 | yes | pub fn snapshot_node(&amp;self) -&gt; Node { |
| from_snapshot_node | method | 359 | yes | pub fn from_snapshot_node(node: &amp;Node) -&gt; Result&lt;Self&gt; { |
| latest_from_graph | method | 409 | yes | pub fn latest_from_graph(g: &amp;Graph) -&gt; Result&lt;Self&gt; { |
| record_snapshot | method | 424 | yes | pub fn record_snapshot(&amp;self, g: &amp;mut Graph) -&gt; Result&lt;bool&gt; { |
| Outcome | enum | 442 | yes | pub enum Outcome { |
| MetricEvent | struct | 449 | yes | pub struct MetricEvent { |
| MetricSummary | struct | 459 | yes | pub struct MetricSummary { |
| Telemetry | struct | 467 | yes | pub struct Telemetry { |
| emit | method | 485 | yes | pub fn emit(&amp;mut self, mut e: MetricEvent) -&gt; Result&lt;()&gt; { |
| events | method | 503 | yes | pub fn events(&amp;self) -&gt; impl Iterator&lt;Item = &amp;MetricEvent&gt; { |
| dropped | method | 506 | yes | pub fn dropped(&amp;self) -&gt; u64 { |
| sequence | method | 509 | yes | pub fn sequence(&amp;self) -&gt; u64 { |
| export_tsv | method | 514 | yes | pub fn export_tsv&lt;W: Write&gt;(&amp;self, out: &amp;mut W) -&gt; Result&lt;()&gt; { |
| summary | method | 533 | yes | pub fn summary(&amp;self, slot: &amp;str) -&gt; MetricSummary { |
| HealthStatus | enum | 562 | yes | pub enum HealthStatus { |
| ServiceHealth | struct | 568 | yes | pub struct ServiceHealth { |
| RecoveryPlan | enum | 585 | yes | pub enum RecoveryPlan { |
| HealthMonitor | struct | 591 | yes | pub struct HealthMonitor { |
| state | method | 595 | yes | pub fn state(&amp;self, slot: &amp;str) -&gt; ServiceHealth { |
| ensure_runnable | method | 598 | yes | pub fn ensure_runnable(&amp;self, slot: &amp;str) -&gt; Result&lt;()&gt; { |
| success | method | 605 | yes | pub fn success(&amp;mut self, slot: &amp;str) { |
| failure | method | 613 | yes | pub fn failure(&amp;mut self, slot: &amp;str, code: &amp;str, quarantine_after: u32) -&gt; RecoveryPlan { |
| release_after_verified_probe | method | 628 | yes | pub fn release_after_verified_probe(&amp;mut self, slot: &amp;str, passed: bool) -&gt; Result&lt;()&gt; { |
| RepairScope | enum | 640 | yes | pub enum RepairScope { |
| RepairAdapter | trait | 645 | yes | pub trait RepairAdapter: Send + Sync { |
| scope | function | 646 | no | fn scope(&amp;self) -&gt; RepairScope; |
| repair | function | 648 | no | fn repair(&amp;self) -&gt; Result&lt;()&gt;; |
| probe | function | 650 | no | fn probe(&amp;self) -&gt; Result&lt;bool&gt;; |
| RepairReceipt | struct | 653 | yes | pub struct RepairReceipt { |
| HealingController | struct | 661 | yes | pub struct HealingController { |
| receipts | method | 666 | yes | pub fn receipts(&amp;self) -&gt; impl Iterator&lt;Item = &amp;RepairReceipt&gt; { |
| attempts | method | 669 | yes | pub fn attempts(&amp;self, slot: &amp;str) -&gt; u32 { |
| attempt_safe | method | 674 | yes | pub fn attempt_safe( &amp;mut self, slot: &amp;str, adapter: &amp;dyn RepairAdapter, health: &amp;mut HealthMonitor, |
| reset_after_verified_probe | method | 716 | yes | pub fn reset_after_verified_probe( &amp;mut self, slot: &amp;str, health: &amp;mut HealthMonitor, passed: bool, |
| SupervisedReceipt | struct | 729 | yes | pub struct SupervisedReceipt { |
| SupervisedOutput | struct | 740 | yes | pub struct SupervisedOutput { |
| EnginePolicy | struct | 745 | yes | pub struct EnginePolicy { |
| CoreSupervisor | struct | 752 | yes | pub struct CoreSupervisor&lt;&#39;a&gt; { |
| register_ephemeral_cache_repair | function | 777 | yes | pub fn register_ephemeral_cache_repair( &amp;mut self, slot: &amp;str, adapter: std::sync::Arc&lt;dyn RepairAdapter&gt;, ) -&gt; Result&lt;()&gt; { |
| execute_read_only | function | 790 | yes | pub fn execute_read_only( &amp;mut self, slot: &amp;str, request: &amp;EngineRequest, ) -&gt; Result&lt;SupervisedOutput&gt; { |
| execute_inner | function | 813 | no | fn execute_inner(&amp;mut self, slot: &amp;str, request: &amp;EngineRequest) -&gt; Result&lt;SupervisedOutput&gt; { |
| readiness | function | 915 | yes | pub fn readiness(&amp;self, slot: &amp;str) -&gt; Result&lt;()&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::engine::{EngineOutput, EngineRegistry, EngineRequest} | use | 5 | external |
| crate::{Error, Graph, Node, NodeKind, Result} | use | 6 | external |
| std::collections::{BTreeMap, BTreeSet, VecDeque} | use | 7 | external |
| std::io::Write | use | 8 | external |
| std::time::Instant | use | 9 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | HQKG&#39;s std-only operational contract: dependencies, config, telemetry, health and guarded execution. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | This layer wraps the existing EngineRegistry. It does not create a competing scheduler. |
| 4 | invariant | — | — | Graph metadata and research catalogs never grant provider, OS or browser permissions. |

## Excerpt

```rust
//! @hq:context HQKG's std-only operational contract: dependencies, config, telemetry, health and guarded execution.
//! @hq:owner repos-hq
//! @hq:invariant This layer wraps the existing EngineRegistry. It does not create a competing scheduler.
//! @hq:invariant Graph metadata and research catalogs never grant provider, OS or browser permissions.
use crate::engine::{EngineOutput, EngineRegistry, EngineRequest};
use crate::{Error, Graph, Node, NodeKind, Result};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::io::Write;
use std::time::Instant;

// One intentional, strict wire/version comparator. The default core has no semver dependency.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}
impl Version {
    pub const fn new(major: u32, minor: u32, patch: u32) -> Self {
        Self {
            major,
            minor,
            patch,
        }
    }
    pub fn parse(value: &str) -> Result<Self> {
        let parts = value.split('.').collect::<Vec<_>>();
        if parts.len() != 3
            || parts.iter().any(|s| {
                s.is_empty()
                    || !s.bytes().all(|b| b.is_ascii_digit())
                    || (s.len() > 1 && s.starts_with('0'))
            })
        {
            return Err(Error::Invalid(format!("invalid strict version: {value}")));
        }
        let parse = |s: &str| {
            s.parse::<u32>()
                .map_err(|_| Error::Invalid("version overflow".into()))
        };
        Ok(Self::new(
            parse(parts[0])?,
            parse(parts[1])?,
            parse(parts[2])?,
        ))
    }
    pub fn label(&self) -> String {
        format!("{}.{}.{}", self.major, self.minor, self.patch)
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VersionRange {
    pub min_inclusive: Version,
    pub max_exclusive: Option<Version>,
}
impl VersionRange {
    pub fn accepts(&self, v: Version) -> bool {
        v >= self.min_inclusive && self.max_exclusive.map_or(true, |max| v < max)
    }
    pub fn validate(&self) -> Result<()> {
        if self
            .max_exclusive
            .map_or(false, |max| max <= self.min_inclusive)
        {
            return Err(Error::Invalid("empty dependency version range".into()));
        }
        Ok(())
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ResourceKind {
    Engine,
    Database,
    Dataset,
    Capability,
    Schema,
    Other(String),
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Resource {
```

_First 80 of 934 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
