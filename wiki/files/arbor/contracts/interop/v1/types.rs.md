# File: contracts/interop/v1/types.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | contracts/interop/v1/types.rs |
| Language | Rust |
| Kind | source |
| Size | 1835 B |
| Lines | 32 |
| Hash | 7fc24027a8cd |
| Test | no |
| Generated | no |
| Component | contracts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SourceDomain | enum | 4 | yes | pub enum SourceDomain { Development, Personal, Control, Ui } |
| SourceRef | struct | 6 | yes | pub struct SourceRef { pub id: String, pub domain: SourceDomain, pub owner_ref: Option&lt;String&gt;, pub revision: u64 } |
| Confidence | enum | 8 | yes | pub enum Confidence { Rule, AcceptedPattern, SourceObserved, ModelProposed } |
| EvidenceRef | struct | 10 | yes | pub struct EvidenceRef { pub source: SourceRef, pub digest: String, pub confidence: Confidence } |
| EventKind | enum | 12 | yes | pub enum EventKind { Draft, Accept, Submit, Cancel, Approve, Receipt, Observation } |
| RevisionEvent | struct | 14 | yes | pub struct RevisionEvent { pub event_id: String, pub kind: EventKind, pub source: SourceRef, pub expected_revision: u64 } |
| HostRisk | enum | 16 | yes | pub enum HostRisk { R0, R1, R2, R3 } |
| CapabilityRef | struct | 18 | yes | pub struct CapabilityRef { pub id: String, pub owner: String, pub risk: Option&lt;HostRisk&gt;, pub source: SourceRef } |
| HostJournalState | enum | 20 | yes | pub enum HostJournalState { Planned, Approved, Uncertain, Applied, Failed } |
| ViewStatus | enum | 22 | yes | pub enum ViewStatus { Candidate, Grounded, Ambiguous, Stale, Unavailable } |
| InertViewProjection | struct | 24 | yes | pub struct InertViewProjection { pub source: SourceRef, pub status: ViewStatus, pub actions: Vec&lt;String&gt; } |
| tests | module | 26 | no | mod tests { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::* | use | 27 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Wave 1F pure contract mirror. Not linked into Cargo yet (Lane A/G ownership).
//! No authorization, source identity minting, receipt writing or I/O here.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SourceDomain { Development, Personal, Control, Ui }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceRef { pub id: String, pub domain: SourceDomain, pub owner_ref: Option<String>, pub revision: u64 }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Confidence { Rule, AcceptedPattern, SourceObserved, ModelProposed }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EvidenceRef { pub source: SourceRef, pub digest: String, pub confidence: Confidence }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventKind { Draft, Accept, Submit, Cancel, Approve, Receipt, Observation }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RevisionEvent { pub event_id: String, pub kind: EventKind, pub source: SourceRef, pub expected_revision: u64 }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRisk { R0, R1, R2, R3 }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CapabilityRef { pub id: String, pub owner: String, pub risk: Option<HostRisk>, pub source: SourceRef }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostJournalState { Planned, Approved, Uncertain, Applied, Failed }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ViewStatus { Candidate, Grounded, Ambiguous, Stale, Unavailable }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InertViewProjection { pub source: SourceRef, pub status: ViewStatus, pub actions: Vec<String> }
#[cfg(test)]
mod tests {
 use super::*;
 #[test] fn status_is_not_a_grant() {
   assert_ne!(HostJournalState::Uncertain, HostJournalState::Applied);
   assert_ne!(ViewStatus::Candidate, ViewStatus::Grounded);
 }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
