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
        ));
    }
    let age = now_ms.saturating_sub(last);
    let limit = sample.expected_period_ms.saturating_mul(3);
    if age > limit {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "observer_stale",
            &[],
            &["fresh_observer_evidence"],
            NextStep::VerifyReadOnly,
        ));
    }
    Ok(finding(
        Condition::Healthy,
        EvidenceStatus::Confirmed,
        "observer_fresh",
        &[],
        &[],
        NextStep::Observe,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn snapshot() -> ObserverSnapshot<'static> {
        ObserverSnapshot {
            observer_ref: "host:bridge",
            producer_epoch: "boot-1",
            last_sample_ms: Some(100),
            last_sequence: Some(2),
            expected_period_ms: 20,
            lost_samples: 0,
            corrupt_samples: 0,
            expected_offline: false,
        }
    }
    #[test]
    fn freshness_is_bounded_by_real_cadence() {
        assert_eq!(
            assess_observer(snapshot(), 140).unwrap().condition,
            Condition::Healthy
        );
        assert_eq!(
            assess_observer(snapshot(), 180).unwrap().code,
            "observer_stale"
        );
    }
    #[test]
    fn missing_and_dropped_evidence_abstain() {
        let mut s = snapshot();
        s.last_sample_ms = None;
        assert_eq!(
            assess_observer(s, 140).unwrap().condition,
            Condition::Unknown
        );
        s = snapshot();
        s.lost_samples = 2;
        assert_eq!(
            assess_observer(s, 140).unwrap().code,
            "observer_dropped_evidence"
        );
    }
    #[test]
    fn corrupted_evidence_never_turns_green() {
        let mut s = snapshot();
        s.corrupt_samples = 1;
        assert_eq!(
            assess_observer(s, 140).unwrap().evidence_status,
            EvidenceStatus::Conflicting
        );
    }
    #[test]
    fn explicitly_expected_offline_is_not_error() {
        let mut s = snapshot();
        s.expected_offline = true;
        assert_eq!(
            assess_observer(s, 140).unwrap().condition,
            Condition::ExpectedOffline
        );
    }
}
