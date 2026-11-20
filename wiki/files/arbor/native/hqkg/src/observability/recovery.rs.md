# File: native/hqkg/src/observability/recovery.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/recovery.rs |
| Language | Rust |
| Kind | source |
| Size | 7433 B |
| Lines | 208 |
| Hash | 897dfa1c30b9 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HANDOFF_CONTRACT | const | 5 | yes | pub const HANDOFF_CONTRACT: &amp;str = &quot;vivim.rust-diagnostic-handoff/1&quot;; |
| Impact | enum | 8 | yes | pub enum Impact { |
| RecoveryAdvice | enum | 17 | yes | pub enum RecoveryAdvice { |
| RecoveryCandidate | struct | 26 | yes | pub struct RecoveryCandidate { |
| prepare_lane_d_handoff | function | 43 | yes | pub fn prepare_lane_d_handoff( subject: &amp;str, finding: &amp;DiagnosticFinding, impact: Impact, ) -&gt; Result&lt;RecoveryCandidate&gt; { |
| Verification | enum | 107 | yes | pub enum Verification { |
| verify_recovery_result | function | 117 | yes | pub fn verify_recovery_result( before: &amp;DiagnosticFinding, after: &amp;DiagnosticFinding, independent_source_verified: bool, ) -&gt; Verification { |
| tests | module | 147 | no | mod tests { |
| observation | function | 150 | no | fn observation(code: &amp;&#39;static str, condition: Condition, evidence: &amp;str) -&gt; DiagnosticFinding { |
| unknown_command_outcome_never_recommends_resend | function | 161 | no | fn unknown_command_outcome_never_recommends_resend() { |
| revision_drift_proposes_host_owned_resolution_only | function | 172 | no | fn revision_drift_proposes_host_owned_resolution_only() { |
| a_self_reported_recovery_is_not_verified | function | 180 | no | fn a_self_reported_recovery_is_not_verified() { |
| diagnostic_advice_does_not_grant_any_execution_capability | function | 197 | no | fn diagnostic_advice_does_not_grant_any_execution_capability() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep} | use | 2 | external |
| crate::{Error, Result} | use | 3 | external |
| super::super::finding | use | 148 | external |
| super::* | use | 149 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Typed, read-only Lane C -> Lane D handoff. No executor, permission grants or effects.
use super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep};
use crate::{Error, Result};

pub const HANDOFF_CONTRACT: &str = "vivim.rust-diagnostic-handoff/1";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Impact {
    Info,
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RecoveryAdvice {
    Observe,
    ReadOnlyReverify,
    HostAuthorizedResnapshot,
    OperatorInvestigation,
    NeverRetryUncertainSend,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RecoveryCandidate {
    pub contract: &'static str,
    pub subject: String,
    pub diagnostic_code: &'static str,
    pub impact: Impact,
    pub evidence_status: EvidenceStatus,
    pub evidence_ids: Vec<String>,
    pub advice: RecoveryAdvice,
    /// Always true for anything that could eventually affect Host/OS/phone state.
    pub requires_host_authorization: bool,
    /// Diagnostic findings never create any execution capability.
    pub may_execute: bool,
    pub preconditions: Vec<&'static str>,
}

/// Pure policy mapping; impact is passed by the trusted product owner, never
/// inferred from model confidence. The consumer must verify scope and authorization.
pub fn prepare_lane_d_handoff(
    subject: &str,
    finding: &DiagnosticFinding,
    impact: Impact,
) -> Result<RecoveryCandidate> {
    if !safe_id(subject)
        || finding.evidence_ids.len() > 16
        || finding.evidence_ids.iter().any(|id| !safe_id(id))
    {
        return Err(Error::Invalid(
            "invalid recovery diagnostic provenance".into(),
        ));
    }
    let (advice, preconditions) = match (finding.code, finding.condition, finding.evidence_status) {
        ("command_outcome_unverified", _, _)
        | ("contradictory_command_evidence", _, _)
        | ("verified_command_failure", _, _) => (
            RecoveryAdvice::NeverRetryUncertainSend,
            vec![
                "read_authoritative_send_receipt",
                "never_repeat_effect_from_diagnostic",
            ],
        ),
        ("revision_drift_suspected", _, _) => (
            RecoveryAdvice::HostAuthorizedResnapshot,
            vec![
                "verify_device_grant",
                "read_host_world_head",
                "verify_scope_and_revision",
                "authorize_in_host",
            ],
        ),
        (_, Condition::Failed, EvidenceStatus::Confirmed) => (
            RecoveryAdvice::OperatorInvestigation,
            vec!["verify_source", "verify_recovery_preconditions"],
        ),
        (_, Condition::Unknown, _) | (_, _, EvidenceStatus::Conflicting) => (
            RecoveryAdvice::ReadOnlyReverify,
```

_First 80 of 209 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
