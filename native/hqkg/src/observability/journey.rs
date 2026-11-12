//! Strict, end-to-end command proof. A phone display ACK alone can prove
//! that stage, but cannot certify every preceding Host/Studio journal hop.
use super::admission::AdmissionPolicy;
use super::{
    diagnose, finding, CommandStage, Condition, DiagnosticFinding, EvidenceGrade, EvidenceStatus,
    Expectation, ExpectationKind, NextStep, Observation, Signal,
};
use crate::{Error, Result};
use std::collections::BTreeMap;

const ORDER: [CommandStage; 5] = [
    CommandStage::Accepted,
    CommandStage::Authorized,
    CommandStage::SendObserved,
    CommandStage::ReplyObserved,
    CommandStage::PhoneDisplayed,
];

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct JourneyEvidence {
    pub finding: DiagnosticFinding,
    pub observed: Vec<(CommandStage, String)>,
    pub missing_stages: Vec<CommandStage>,
}

/// Does not replay commands, contact providers or poll the phone.
pub fn diagnose_journey(
    policy: &AdmissionPolicy,
    expectation: &Expectation,
    observations: &[Observation],
    now_ms: u64,
) -> Result<JourneyEvidence> {
    policy.validate(observations)?;
    let ExpectationKind::Command(required) = expectation.kind else {
        return Err(Error::Invalid(
            "journey verification requires command expectation".into(),
        ));
    };
    let base = diagnose(expectation, observations, now_ms)?;
    let mut found: BTreeMap<CommandStage, (String, u64)> = BTreeMap::new();
    let limit = ORDER
        .iter()
        .position(|stage| *stage == required)
        .ok_or_else(|| Error::Invalid("unsupported command journey stage".into()))?;
    for observation in observations {
        if observation.subject != expectation.subject
            || observation.grade < EvidenceGrade::SourceVerified
            || observation.observed_ms > now_ms
            || now_ms - observation.observed_ms > expectation.freshness_ms
        {
            continue;
        }
        if let Signal::Command(stage) = observation.signal {
            if ORDER.iter().take(limit + 1).any(|x| *x == stage) {
                let previous = found.get(&stage);
                if previous.map_or(true, |(_, t)| observation.observed_ms >= *t) {
                    found.insert(
                        stage,
                        (observation.evidence_id.clone(), observation.observed_ms),
                    );
                }
            }
        }
    }
    let observed = ORDER
        .iter()
        .take(limit + 1)
        .filter_map(|s| found.get(s).map(|(id, _)| (*s, id.clone())))
        .collect::<Vec<_>>();
    let missing = ORDER
        .iter()
        .take(limit + 1)
        .filter(|s| !found.contains_key(s))
        .copied()
        .collect::<Vec<_>>();
    let definitive_problem = base.condition == Condition::Failed
        || base.evidence_status == EvidenceStatus::Conflicting
        || base.code == "producer_sequence_gap"
        || base.code == "producer_epoch_transition"
        || base.code == "observer_unavailable"
        || base.condition == Condition::ExpectedOffline;
    let diagnosis = if definitive_problem || base.condition != Condition::Healthy {
        base
    } else if !missing.is_empty() {
        finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "end_to_end_journey_incomplete",
            &[],
            &["all_source_verified_journey_stages"],
            NextStep::VerifyReadOnly,
        )
    } else {
        finding(
            Condition::Healthy,
            EvidenceStatus::Confirmed,
            "end_to_end_journey_verified",
            &[],
            &[],
            NextStep::Observe,
        )
    };
    Ok(JourneyEvidence {
        finding: diagnosis,
        observed,
        missing_stages: missing,
    })
}

#[cfg(test)]
mod tests {
    use super::super::admission::{SourceBinding, SourceRole};
    use super::*;
    fn policy() -> AdmissionPolicy {
        AdmissionPolicy::new(vec![
            SourceBinding {
                producer: "host".into(),
                expected_epoch: "a".into(),
                subject_prefix: "cmd-".into(),
                role: SourceRole::HostJournal,
                maximum_grade: EvidenceGrade::SourceVerified,
            },
            SourceBinding {
                producer: "ack".into(),
                expected_epoch: "a".into(),
                subject_prefix: "cmd-".into(),
                role: SourceRole::HostVerifiedDeliveryAck,
                maximum_grade: EvidenceGrade::SourceVerified,
            },
        ])
        .unwrap()
    }
    fn exp() -> Expectation {
        Expectation {
            subject: "cmd-1".into(),
            kind: ExpectationKind::Command(CommandStage::PhoneDisplayed),
            deadline_ms: 250,
            freshness_ms: 1_000,
        }
    }
    fn obs(id: &str, producer: &str, seq: u64, stage: CommandStage) -> Observation {
        Observation {
            evidence_id: id.into(),
            subject: "cmd-1".into(),
            producer: producer.into(),
            producer_epoch: "a".into(),
            producer_sequence: seq,
            observed_ms: 100 + seq,
            grade: EvidenceGrade::SourceVerified,
            signal: Signal::Command(stage),
        }
    }
    #[test]
    fn isolated_phone_ack_is_not_complete_chain() {
        let ack = obs("r5", "ack", 1, CommandStage::PhoneDisplayed);
        let output = diagnose_journey(&policy(), &exp(), &[ack], 130).unwrap();
        assert_eq!(output.finding.condition, Condition::Unknown);
        assert_eq!(output.missing_stages.len(), 4);
    }
    #[test]
    fn all_five_verified_stages_certify_journey() {
        let inputs = [
            obs("r1", "host", 1, CommandStage::Accepted),
            obs("r2", "host", 2, CommandStage::Authorized),
            obs("r3", "host", 3, CommandStage::SendObserved),
            obs("r4", "host", 4, CommandStage::ReplyObserved),
            obs("r5", "ack", 1, CommandStage::PhoneDisplayed),
        ];
        let output = diagnose_journey(&policy(), &exp(), &inputs, 130).unwrap();
        assert_eq!(output.finding.condition, Condition::Healthy);
        assert_eq!(output.observed.len(), 5);
    }
    #[test]
    fn missing_send_receipt_is_not_e2e_success() {
        let inputs = [
            obs("r1", "host", 1, CommandStage::Accepted),
            obs("r2", "host", 2, CommandStage::Authorized),
            obs("r4", "ack", 1, CommandStage::PhoneDisplayed),
        ];
        let out = diagnose_journey(&policy(), &exp(), &inputs, 130).unwrap();
        assert_eq!(out.finding.condition, Condition::Unknown);
        assert!(out.missing_stages.contains(&CommandStage::SendObserved));
    }
}
