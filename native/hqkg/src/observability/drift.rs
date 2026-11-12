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
        || policy.minimum_samples > MAX_DRIFT_SAMPLES
        || policy.minimum_shift_bps > 10_000
        || policy.mad_multiplier == 0
        || policy.mad_multiplier > 20
        || baseline.values.len() > MAX_DRIFT_SAMPLES
        || candidate.values.len() > MAX_DRIFT_SAMPLES
    {
        return Err(Error::Invalid("invalid drift window or policy".into()));
    }
    let counts = (baseline.values.len(), candidate.values.len());
    let incomplete = |code, reason| DriftAssessment {
        finding: finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            code,
            &[],
            &[reason],
            NextStep::VerifyReadOnly,
        ),
        baseline_median: None,
        candidate_median: None,
        baseline_mad: None,
        threshold: None,
        sample_counts: counts,
    };
    if baseline.cohort != candidate.cohort
        || baseline.instrument_revision != candidate.instrument_revision
        || baseline.source_epoch != candidate.source_epoch
    {
        return Ok(incomplete(
            "drift_incomparable_cohort",
            "matching_workload_instrument_epoch",
        ));
    }
    if baseline.lost_samples || candidate.lost_samples {
        return Ok(incomplete(
            "drift_window_incomplete",
            "complete_observation_window",
        ));
    }
    if counts.0 < policy.minimum_samples || counts.1 < policy.minimum_samples {
        return Ok(incomplete("drift_warmup", "sufficient_versioned_samples"));
    }
    let base = median(baseline.values);
    let current = median(candidate.values);
    let deviations = baseline
        .values
        .iter()
        .map(|v| v.abs_diff(base))
        .collect::<Vec<_>>();
    let mad = median(&deviations);
    let relative =
        ((base as u128) * (policy.minimum_shift_bps as u128) / 10_000).min(u64::MAX as u128) as u64;
    let noise = mad.saturating_mul(policy.mad_multiplier as u64);
    let threshold = policy.absolute_floor.max(relative).max(noise);
    let shift = match policy.worse {
        WorseDirection::Higher => current.saturating_sub(base),
        WorseDirection::Lower => base.saturating_sub(current),
    };
    let finding = if shift > threshold {
        finding(
            Condition::Degraded,
            EvidenceStatus::Suspected,
            "robust_median_drift_detected",
            &[],
            &["independent_regression_confirmation"],
            NextStep::VerifyReadOnly,
        )
    } else {
        // Within-window consistency, not global functionality or proof of quality.
        finding(
            Condition::Healthy,
            EvidenceStatus::Confirmed,
            "robust_median_within_policy",
            &[],
            &[],
            NextStep::Observe,
        )
    };
    Ok(DriftAssessment {
        finding,
        baseline_median: Some(base),
        candidate_median: Some(current),
        baseline_mad: Some(mad),
        threshold: Some(threshold),
        sample_counts: counts,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn window<'a>(v: &'a [u64]) -> DriftWindow<'a> {
        DriftWindow {
            cohort: "context-retrieval",
            source_epoch: "boot-1",
            instrument_revision: "v2",
            values: v,
            lost_samples: false,
        }
    }
    #[test]
    fn detects_sustained_shift_but_not_single_spike() {
        let base = [10; 32];
        let mut spiky = [10; 32];
        spiky[0] = 100_000;
        let slow = [30; 32];
        let policy = DriftPolicy::default();
        assert_eq!(
            assess_drift(&window(&base), &window(&spiky), policy)
                .unwrap()
                .finding
                .condition,
            Condition::Healthy
        );
        assert_eq!(
            assess_drift(&window(&base), &window(&slow), policy)
                .unwrap()
                .finding
                .condition,
            Condition::Degraded
        );
    }
    #[test]
    fn abstains_for_mixed_instrument_or_lost_evidence() {
        let samples = [10; 20];
        let mut current = window(&samples);
        current.instrument_revision = "v3";
        assert_eq!(
            assess_drift(&window(&samples), &current, DriftPolicy::default())
                .unwrap()
                .finding
                .condition,
            Condition::Unknown
        );
        current.instrument_revision = "v2";
        current.lost_samples = true;
        assert_eq!(
            assess_drift(&window(&samples), &current, DriftPolicy::default())
                .unwrap()
                .finding
                .code,
            "drift_window_incomplete"
        );
    }
    #[test]
    fn detects_lower_is_worse_and_handles_large_values() {
        let base = [u64::MAX - 100; 32];
        let low = [u64::MAX - 5_000; 32];
        let policy = DriftPolicy {
            minimum_samples: 8,
            minimum_shift_bps: 0,
            absolute_floor: 500,
            mad_multiplier: 3,
            worse: WorseDirection::Lower,
        };
        assert_eq!(
            assess_drift(&window(&base), &window(&low), policy)
                .unwrap()
                .finding
                .condition,
            Condition::Degraded
        );
    }
    #[test]
    fn no_confident_claim_from_tiny_windows() {
        let a = [1; 3];
        let out = assess_drift(&window(&a), &window(&a), DriftPolicy::default()).unwrap();
        assert_eq!(out.finding.code, "drift_warmup");
    }
}
