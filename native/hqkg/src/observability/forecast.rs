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
        return Ok(abstain("trend_time_invalid", "monotonic_source_timestamp"));
    }
    let n = samples.len() / 2;
    let earlier = median(&samples[..n].iter().map(|s| s.value).collect::<Vec<_>>());
    let recent = median(&samples[n..].iter().map(|s| s.value).collect::<Vec<_>>());
    let left_time = samples[n / 2].at_ms;
    let right_time = samples[n + (samples.len() - n) / 2].at_ms;
    let span = right_time.saturating_sub(left_time);
    let delta = recent.saturating_sub(earlier);
    let no_trend = || TrendForecast {
        finding: finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "trend_no_actionable_projection",
            &[],
            &["independent_trend_confirmation"],
            NextStep::Observe,
        ),
        projected_crossing_ms: None,
        first_half_median: Some(earlier),
        second_half_median: Some(recent),
    };
    if span == 0 || delta < policy.minimum_delta || recent >= policy.threshold {
        // A value already over the threshold is a present-time metric check,
        // not a forecast; this function deliberately does not declare failure.
        return Ok(no_trend());
    }
    let remaining = policy.threshold - recent;
    let ms = (u128::from(remaining) * u128::from(span)) / u128::from(delta);
    if ms == 0 || ms > u128::from(policy.horizon_ms) {
        return Ok(no_trend());
    }
    let ms = ms.min(u128::from(u64::MAX)) as u64;
    let crossing = now_ms.saturating_add(ms);
    Ok(TrendForecast {
        finding: finding(
            Condition::Degraded,
            EvidenceStatus::Suspected,
            "threshold_crossing_forecast_shadow",
            &[],
            &["measured_confirmation", "calibrated_predictive_accuracy"],
            NextStep::Observe,
        ),
        projected_crossing_ms: Some(crossing),
        first_half_median: Some(earlier),
        second_half_median: Some(recent),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn policy() -> TrendPolicy {
        TrendPolicy {
            min_samples: 8,
            threshold: 100,
            horizon_ms: 200,
            minimum_delta: 5,
        }
    }
    #[test]
    fn predicts_steady_capacity_deterioration_as_suspicion_only() {
        let samples = (1..=12)
            .map(|i| TrendSample {
                at_ms: i * 10,
                value: i * 7,
            })
            .collect::<Vec<_>>();
        let f = forecast_degradation("v1", &samples, 130, policy()).unwrap();
        assert_eq!(f.finding.evidence_status, EvidenceStatus::Suspected);
        assert!(f.projected_crossing_ms.is_some());
    }
    #[test]
    fn flat_readings_do_not_predict() {
        let samples = (1..=12)
            .map(|i| TrendSample {
                at_ms: i * 10,
                value: 10,
            })
            .collect::<Vec<_>>();
        let f = forecast_degradation("v1", &samples, 130, policy()).unwrap();
        assert_eq!(f.projected_crossing_ms, None);
    }
    #[test]
    fn shuffled_time_series_abstains() {
        let mut samples = (1..=12)
            .map(|i| TrendSample {
                at_ms: i * 10,
                value: i * 7,
            })
            .collect::<Vec<_>>();
        samples[2].at_ms = 5;
        let f = forecast_degradation("v1", &samples, 130, policy()).unwrap();
        assert_eq!(f.finding.condition, Condition::Unknown);
    }
    #[test]
    fn no_prediction_on_inadequate_samples() {
        let f = forecast_degradation("v1", &[TrendSample { at_ms: 1, value: 2 }], 100, policy())
            .unwrap();
        assert_eq!(f.finding.code, "trend_warmup");
    }
}
