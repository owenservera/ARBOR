# File: native/hqkg/src/observability/admission.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/admission.rs |
| Language | Rust |
| Kind | source |
| Size | 8686 B |
| Lines | 243 |
| Hash | 6eb2f73b1625 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SourceRole | enum | 12 | yes | pub enum SourceRole { |
| SourceBinding | struct | 22 | yes | pub struct SourceBinding { |
| AdmissionPolicy | struct | 31 | yes | pub struct AdmissionPolicy { |
| role_allows | function | 35 | no | fn role_allows(role: SourceRole, signal: Signal) -&gt; bool { |
| validate | method | 101 | yes | pub fn validate(&amp;self, observations: &amp;[Observation]) -&gt; Result&lt;()&gt; { |
| diagnose_admitted | function | 124 | yes | pub fn diagnose_admitted( policy: &amp;AdmissionPolicy, exp: &amp;Expectation, observations: &amp;[Observation], now_ms: u64, |
| tests | module | 135 | no | mod tests { |
| obs | function | 138 | no | fn obs(source: &amp;str, grade: EvidenceGrade, signal: Signal) -&gt; Observation { |
| policy | function | 150 | no | fn policy(role: SourceRole, grade: EvidenceGrade) -&gt; AdmissionPolicy { |
| expectation | function | 160 | no | fn expectation() -&gt; Expectation { |
| raw_journal_cannot_claim_phone_display | function | 169 | no | fn raw_journal_cannot_claim_phone_display() { |
| authorized_host_ack_can_establish_delivery_stage | function | 179 | no | fn authorized_host_ack_can_establish_delivery_stage() { |
| phone_hints_cannot_promote_themselves_to_source_verified | function | 197 | no | fn phone_hints_cannot_promote_themselves_to_source_verified() { |
| rejects_epoch_and_scope_confusion | function | 208 | no | fn rejects_epoch_and_scope_confusion() { |
| unregistered_source_is_rejected | function | 222 | no | fn unregistered_source_is_rejected() { |
| incomplete_ack_remains_unknown_under_policy | function | 232 | no | fn incomplete_ack_remains_unknown_under_policy() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{ | use | 4 | external |
| crate::{Error, Result} | use | 8 | external |
| std::collections::BTreeMap | use | 9 | external |
| super::super::{Condition, EvidenceStatus, ExpectationKind} | use | 136 | external |
| super::* | use | 137 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Strict source admission BEFORE core diagnosis.
//! A binding is installed by trusted Host bootstrap. This is NOT cryptographic
//! attestation: the Host must authenticate the transport, device and source receipt.
use super::{
    diagnose, safe_id, CommandStage, DiagnosticFinding, EvidenceGrade, Expectation, Observation,
    Signal,
};
use crate::{Error, Result};
use std::collections::BTreeMap;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SourceRole {
    HostJournal,
    HostWorldRead,
    HostVerifiedDeviceRead,
    HostVerifiedDeliveryAck,
    RustCore,
    UntrustedDeviceHint,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SourceBinding {
    pub producer: String,
    pub expected_epoch: String,
    pub subject_prefix: String,
    pub role: SourceRole,
    pub maximum_grade: EvidenceGrade,
}

#[derive(Clone, Debug)]
pub struct AdmissionPolicy {
    bindings: BTreeMap<String, SourceBinding>,
}

fn role_allows(role: SourceRole, signal: Signal) -> bool {
    match role {
        SourceRole::HostJournal => matches!(
            signal,
            Signal::Command(
                CommandStage::Accepted
                    | CommandStage::Authorized
                    | CommandStage::SendObserved
                    | CommandStage::ReplyObserved
            ) | Signal::ExplicitFailure
                | Signal::ObserverAvailable
                | Signal::ObserverUnavailable
        ),
        SourceRole::HostWorldRead => matches!(
            signal,
            Signal::WorldHead(_) | Signal::ObserverAvailable | Signal::ObserverUnavailable
        ),
        SourceRole::HostVerifiedDeviceRead => matches!(
            signal,
            Signal::DeviceHead(_)
                | Signal::ExpectedOffline
                | Signal::ObserverAvailable
                | Signal::ObserverUnavailable
        ),
        SourceRole::HostVerifiedDeliveryAck => matches!(
            signal,
            Signal::Command(CommandStage::PhoneDisplayed)
                | Signal::ObserverAvailable
                | Signal::ObserverUnavailable
        ),
        SourceRole::RustCore => matches!(
            signal,
            Signal::ObserverAvailable | Signal::ObserverUnavailable | Signal::ExplicitFailure
        ),
        SourceRole::UntrustedDeviceHint => matches!(
            signal,
            Signal::DeviceHead(_) | Signal::ObserverAvailable | Signal::ObserverUnavailable
        ),
    }
}

impl AdmissionPolicy {
    pub fn new(bindings: Vec<SourceBinding>) -> Result<Self> {
        if bindings.is_empty() || bindings.len() > 64 {
            return Err(Error::Invalid(
                "invalid observation source binding count".into(),
```

_First 80 of 244 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
