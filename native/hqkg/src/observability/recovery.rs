//! Typed, read-only Lane C -> Lane D handoff. No executor, permission grants or effects.
use super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus};
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
            vec!["acquire_independent_read_only_evidence"],
        ),
        (_, Condition::Degraded, _) => (
            RecoveryAdvice::ReadOnlyReverify,
            vec![
                "validate_diagnostic_hypothesis",
                "verify_recovery_preconditions",
            ],
        ),
        _ => (RecoveryAdvice::Observe, vec![]),
    };
    Ok(RecoveryCandidate {
        contract: HANDOFF_CONTRACT,
        subject: subject.to_string(),
        diagnostic_code: finding.code,
        impact,
        evidence_status: finding.evidence_status,
        evidence_ids: finding.evidence_ids.clone(),
        advice,
        requires_host_authorization: !matches!(advice, RecoveryAdvice::Observe),
        may_execute: false,
        preconditions,
    })
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Verification {
    VerifiedRecovered,
    StillUnhealthy,
    Unverified,
    Contradictory,
}

/// Checks evidence of an independent *post*-intervention evaluation.
/// The caller must have performed the independent verification through the
/// Host's authorized read ports. It does not perform or approve a repair.
pub fn verify_recovery_result(
    before: &DiagnosticFinding,
    after: &DiagnosticFinding,
    independent_source_verified: bool,
) -> Verification {
    if !independent_source_verified
        || after.evidence_ids.is_empty()
        || after
            .evidence_ids
            .iter()
            .any(|id| before.evidence_ids.contains(id))
    {
        return Verification::Unverified;
    }
    if after.evidence_status == EvidenceStatus::Conflicting {
        return Verification::Contradictory;
    }
    if after.condition == Condition::Healthy
        && after.evidence_status == EvidenceStatus::Confirmed
        && before.condition != Condition::Healthy
    {
        return Verification::VerifiedRecovered;
    }
    if matches!(after.condition, Condition::Failed | Condition::Degraded) {
        return Verification::StillUnhealthy;
    }
    Verification::Unverified
}

#[cfg(test)]
mod tests {
    use super::super::finding;
    use super::super::NextStep;
    use super::*;
    fn observation(code: &'static str, condition: Condition, evidence: &str) -> DiagnosticFinding {
        finding(
            condition,
            EvidenceStatus::Confirmed,
            code,
            &[evidence],
            &[],
            NextStep::VerifyReadOnly,
        )
    }
    #[test]
    fn unknown_command_outcome_never_recommends_resend() {
        let d = observation("command_outcome_unverified", Condition::Unknown, "ref-1");
        let recommendation = prepare_lane_d_handoff("cmd-1", &d, Impact::High).unwrap();
        assert_eq!(
            recommendation.advice,
            RecoveryAdvice::NeverRetryUncertainSend
        );
        assert!(!recommendation.may_execute);
        assert!(recommendation.requires_host_authorization);
    }
    #[test]
    fn revision_drift_proposes_host_owned_resolution_only() {
        let d = observation("revision_drift_suspected", Condition::Degraded, "ref-2");
        let handoff = prepare_lane_d_handoff("world", &d, Impact::Medium).unwrap();
        assert_eq!(handoff.advice, RecoveryAdvice::HostAuthorizedResnapshot);
        assert!(handoff.preconditions.contains(&"verify_device_grant"));
        assert!(!handoff.may_execute);
    }
    #[test]
    fn a_self_reported_recovery_is_not_verified() {
        let before = observation("core_quarantined", Condition::Failed, "before");
        let after = observation("core_reported_ready", Condition::Healthy, "after");
        assert_eq!(
            verify_recovery_result(&before, &after, false),
            Verification::Unverified
        );
        assert_eq!(
            verify_recovery_result(&before, &after, true),
            Verification::VerifiedRecovered
        );
        assert_eq!(
            verify_recovery_result(&before, &before, true),
            Verification::Unverified
        );
    }
    #[test]
    fn diagnostic_advice_does_not_grant_any_execution_capability() {
        let all = [
            observation("verified_command_failure", Condition::Failed, "e1"),
            observation("revision_drift_suspected", Condition::Degraded, "e2"),
            observation("observer_unavailable", Condition::Unknown, "e3"),
        ];
        for d in &all {
            let r = prepare_lane_d_handoff("host", d, Impact::Critical).unwrap();
            assert!(!r.may_execute);
        }
    }
}
