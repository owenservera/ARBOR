# File: native/hqkg/src/observability/observer.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/observer.rs |
| Language | Rust |
| Kind | source |
| Size | 5209 B |
| Lines | 164 |
| Hash | b43c4130fe71 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ObserverSnapshot | struct | 7 | yes | pub struct ObserverSnapshot&lt;&#39;a&gt; { |
| assess_observer | function | 22 | yes | pub fn assess_observer(sample: ObserverSnapshot&lt;&#39;_&gt;, now_ms: u64) -&gt; Result&lt;DiagnosticFinding&gt; { |
| tests | module | 106 | no | mod tests { |
| snapshot | function | 108 | no | fn snapshot() -&gt; ObserverSnapshot&lt;&#39;static&gt; { |
| freshness_is_bounded_by_real_cadence | function | 121 | no | fn freshness_is_bounded_by_real_cadence() { |
| missing_and_dropped_evidence_abstain | function | 132 | no | fn missing_and_dropped_evidence_abstain() { |
| corrupted_evidence_never_turns_green | function | 147 | no | fn corrupted_evidence_never_turns_green() { |
| explicitly_expected_offline_is_not_error | function | 156 | no | fn explicitly_expected_offline_is_not_error() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep} | use | 3 | external |
| crate::{Error, Result} | use | 4 | external |
| super::* | use | 107 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Observer-of-observers: pure evidence sufficiency checks.
//! Missing instrumentation is never interpreted as healthy software.
use super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep};
use crate::{Error, Result};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ObserverSnapshot<'a> {
    pub observer_ref: &'a str,
    pub producer_epoch: &'a str,
    pub last_sample_ms: Option<u64>,
    pub last_sequence: Option<u64>,
    /// Expected cadence of an *already existing* passive observer.
    pub expected_period_ms: u64,
    /// Gap/drop counters from the original observer, not a second collector.
    pub lost_samples: u64,
    pub corrupt_samples: u64,
    pub expected_offline: bool,
}

/// "Healthy" here means **the observer is currently producing valid evidence**,
/// not that the component it monitors is healthy. No active probes are performed.
pub fn assess_observer(sample: ObserverSnapshot<'_>, now_ms: u64) -> Result<DiagnosticFinding> {
    if !safe_id(sample.observer_ref)
        || !safe_id(sample.producer_epoch)
        || sample.expected_period_ms == 0
        || sample.expected_period_ms > 3_600_000
        || sample
            .last_sample_ms
            .map_or(false, |at| at > now_ms.saturating_add(2_000))
    {
        return Err(Error::Invalid("invalid observer snapshot".into()));
    }
    if sample.expected_offline {
        return Ok(finding(
            Condition::ExpectedOffline,
            EvidenceStatus::Confirmed,
            "observer_expected_offline",
            &[],
            &[],
            NextStep::Observe,
        ));
    }
    if sample.corrupt_samples > 0 {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Conflicting,
            "observer_corrupt_evidence",
            &[],
            &["valid_observer_evidence"],
            NextStep::OperatorReview,
        ));
    }
    if sample.lost_samples > 0 {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "observer_dropped_evidence",
            &[],
            &["complete_observation_window"],
            NextStep::VerifyReadOnly,
        ));
    }
    let Some(last) = sample.last_sample_ms else {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "observer_never_seen",
            &[],
            &["first_valid_observation"],
            NextStep::VerifyReadOnly,
        ));
    };
    if sample.last_sequence.unwrap_or(0) == 0 {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "observer_sequence_unverified",
            &[],
            &["valid_source_sequence"],
            NextStep::VerifyReadOnly,
```

_First 80 of 165 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
