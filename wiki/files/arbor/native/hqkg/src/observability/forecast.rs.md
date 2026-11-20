# File: native/hqkg/src/observability/forecast.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/forecast.rs |
| Language | Rust |
| Kind | source |
| Size | 6305 B |
| Lines | 182 |
| Hash | b0d5e3d30214 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_TREND_SAMPLES | const | 6 | no | const MAX_TREND_SAMPLES: usize = 64; |
| TrendSample | struct | 8 | yes | pub struct TrendSample { |
| TrendPolicy | struct | 14 | yes | pub struct TrendPolicy { |
| TrendForecast | struct | 23 | yes | pub struct TrendForecast { |
| median | function | 32 | no | fn median(values: &amp;[u64]) -&gt; u64 { |
| forecast_degradation | function | 43 | yes | pub fn forecast_degradation( instrument_revision: &amp;str, samples: &amp;[TrendSample], now_ms: u64, policy: TrendPolicy, |
| tests | module | 131 | no | mod tests { |
| policy | function | 133 | no | fn policy() -&gt; TrendPolicy { |
| predicts_steady_capacity_deterioration_as_suspicion_only | function | 142 | no | fn predicts_steady_capacity_deterioration_as_suspicion_only() { |
| flat_readings_do_not_predict | function | 154 | no | fn flat_readings_do_not_predict() { |
| shuffled_time_series_abstains | function | 165 | no | fn shuffled_time_series_abstains() { |
| no_prediction_on_inadequate_samples | function | 177 | no | fn no_prediction_on_inadequate_samples() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep} | use | 3 | external |
| crate::{Error, Result} | use | 4 | external |
| super::* | use | 132 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Conservative, bounded trend projection (SHADOW ONLY).
//! Forecasts are hypotheses; they never trigger an effect or prove failure.
use super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep};
use crate::{Error, Result};

const MAX_TREND_SAMPLES: usize = 64;
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TrendSample {
    pub at_ms: u64,
    pub value: u64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TrendPolicy {
    pub min_samples: usize,
    pub threshold: u64,
    pub horizon_ms: u64,
    /// Require at least this absolute increase between robust halves.
    pub minimum_delta: u64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TrendForecast {
    pub finding: DiagnosticFinding,
    /// None unless a strictly rising, time-ordered, adequately sampled trend
    /// could be projected using integer arithmetic.
    pub projected_crossing_ms: Option<u64>,
    pub first_half_median: Option<u64>,
    pub second_half_median: Option<u64>,
}

fn median(values: &[u64]) -> u64 {
    let mut v = values.to_vec();
    v.sort_unstable();
    let n = v.len();
    if n % 2 == 1 {
        v[n / 2]
    } else {
        ((u128::from(v[n / 2 - 1]) + u128::from(v[n / 2])) / 2) as u64
    }
}

pub fn forecast_degradation(
    instrument_revision: &str,
    samples: &[TrendSample],
    now_ms: u64,
    policy: TrendPolicy,
) -> Result<TrendForecast> {
    if !safe_id(instrument_revision)
        || !(8..=MAX_TREND_SAMPLES).contains(&policy.min_samples)
        || samples.len() > MAX_TREND_SAMPLES
        || policy.horizon_ms == 0
        || policy.horizon_ms > 86_400_000
        || policy.minimum_delta == 0
        || policy.threshold == 0
    {
        return Err(Error::Invalid(
            "invalid trend forecast policy or budget".into(),
        ));
    }
    let abstain = |code, missing| TrendForecast {
        finding: finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            code,
            &[],
            &[missing],
            NextStep::Observe,
        ),
        projected_crossing_ms: None,
        first_half_median: None,
        second_half_median: None,
    };
    if samples.len() < policy.min_samples {
        return Ok(abstain("trend_warmup", "minimum_timed_observations"));
    }
    if samples[0].at_ms == 0
        || samples.last().map_or(true, |s| s.at_ms > now_ms)
        || samples.windows(2).any(|w| w[0].at_ms >= w[1].at_ms)
    {
```

_First 80 of 183 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
