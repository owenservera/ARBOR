# File: native/hqkg/src/observability/drift.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/drift.rs |
| Language | Rust |
| Kind | source |
| Size | 8300 B |
| Lines | 251 |
| Hash | 75ba58a4e6c2 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_DRIFT_SAMPLES | const | 6 | yes | pub const MAX_DRIFT_SAMPLES: usize = 4_096; |
| WorseDirection | enum | 9 | yes | pub enum WorseDirection { |
| DriftPolicy | struct | 15 | yes | pub struct DriftPolicy { |
| DriftWindow | struct | 39 | yes | pub struct DriftWindow&lt;&#39;a&gt; { |
| DriftAssessment | struct | 49 | yes | pub struct DriftAssessment { |
| median | function | 58 | no | fn median(values: &amp;[u64]) -&gt; u64 { |
| assess_drift | function | 69 | yes | pub fn assess_drift( baseline: &amp;DriftWindow&lt;&#39;_&gt;, candidate: &amp;DriftWindow&lt;&#39;_&gt;, policy: DriftPolicy, ) -&gt; Result&lt;DriftAssessment&gt; { |
| tests | module | 171 | no | mod tests { |
| window | function | 173 | no | fn window&lt;&#39;a&gt;(v: &amp;&#39;a [u64]) -&gt; DriftWindow&lt;&#39;a&gt; { |
| detects_sustained_shift_but_not_single_spike | function | 183 | no | fn detects_sustained_shift_but_not_single_spike() { |
| abstains_for_mixed_instrument_or_lost_evidence | function | 205 | no | fn abstains_for_mixed_instrument_or_lost_evidence() { |
| detects_lower_is_worse_and_handles_large_values | function | 227 | no | fn detects_lower_is_worse_and_handles_large_values() { |
| no_confident_claim_from_tiny_windows | function | 246 | no | fn no_confident_claim_from_tiny_windows() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep} | use | 3 | external |
| crate::{Error, Result} | use | 4 | external |
| super::* | use | 172 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Deterministic, bounded, version-aware robust drift checks.
//! No model training, collector, scheduler, I/O, floating-point instability or effects.
use super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep};
use crate::{Error, Result};

pub const MAX_DRIFT_SAMPLES: usize = 4_096;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WorseDirection {
    Higher,
    Lower,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DriftPolicy {
    /// Both independent windows must contain at least this many measurements.
    pub minimum_samples: usize,
    /// Minimum relative median shift, measured in basis points.
    pub minimum_shift_bps: u32,
    /// Minimum absolute shift in the same units as the observations.
    pub absolute_floor: u64,
    /// Number of baseline median absolute deviations needed for an alert.
    pub mad_multiplier: u32,
    pub worse: WorseDirection,
}
impl Default for DriftPolicy {
    fn default() -> Self {
        Self {
            minimum_samples: 16,
            minimum_shift_bps: 1000,
            absolute_floor: 5,
            mad_multiplier: 3,
            worse: WorseDirection::Higher,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DriftWindow<'a> {
    pub cohort: &'a str,
    pub source_epoch: &'a str,
    /// Known instrument and workload revision; cross-version comparisons abstain.
    pub instrument_revision: &'a str,
    pub values: &'a [u64],
    /// True when the source knows the bounded window lost records.
    pub lost_samples: bool,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DriftAssessment {
    pub finding: DiagnosticFinding,
    pub baseline_median: Option<u64>,
    pub candidate_median: Option<u64>,
    pub baseline_mad: Option<u64>,
    pub threshold: Option<u64>,
    pub sample_counts: (usize, usize),
}

fn median(values: &[u64]) -> u64 {
    let mut v = values.to_vec();
    v.sort_unstable();
    let n = v.len();
    if n % 2 == 1 {
        v[n / 2]
    } else {
        ((v[n / 2 - 1] as u128 + v[n / 2] as u128) / 2) as u64
    }
}

pub fn assess_drift(
    baseline: &DriftWindow<'_>,
    candidate: &DriftWindow<'_>,
    policy: DriftPolicy,
) -> Result<DriftAssessment> {
    if !safe_id(baseline.cohort)
        || !safe_id(candidate.cohort)
        || !safe_id(baseline.source_epoch)
        || !safe_id(candidate.source_epoch)
        || !safe_id(baseline.instrument_revision)
        || !safe_id(candidate.instrument_revision)
        || policy.minimum_samples < 5
```

_First 80 of 252 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
