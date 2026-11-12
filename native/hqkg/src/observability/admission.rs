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
            ));
        }
        let mut by_producer = BTreeMap::new();
        for b in bindings {
            if !safe_id(&b.producer)
                || !safe_id(&b.expected_epoch)
                || !safe_id(&b.subject_prefix)
                || (b.role == SourceRole::UntrustedDeviceHint
                    && b.maximum_grade >= EvidenceGrade::SourceVerified)
                || by_producer.insert(b.producer.clone(), b).is_some()
            {
                return Err(Error::Invalid(
                    "invalid or duplicate observation binding".into(),
                ));
            }
        }
        Ok(Self {
            bindings: by_producer,
        })
    }
    pub fn validate(&self, observations: &[Observation]) -> Result<()> {
        for o in observations {
            let binding = self
                .bindings
                .get(&o.producer)
                .ok_or_else(|| Error::Invalid("unregistered observation producer".into()))?;
            if o.producer_epoch != binding.expected_epoch
                || !o.subject.starts_with(&binding.subject_prefix)
                || o.grade > binding.maximum_grade
                || !role_allows(binding.role, o.signal)
            {
                return Err(Error::Conflict(
                    "observation source binding mismatch".into(),
                ));
            }
        }
        Ok(())
    }
}

/// Preferred product-facing Rust entrypoint. It refuses unregistered producers,
/// subject scope confusion, epoch changes, unauthorized signal kinds and grade
/// escalation before invoking the pure evaluator. It never performs I/O or effects.
pub fn diagnose_admitted(
    policy: &AdmissionPolicy,
    exp: &Expectation,
    observations: &[Observation],
    now_ms: u64,
) -> Result<DiagnosticFinding> {
    policy.validate(observations)?;
    diagnose(exp, observations, now_ms)
}

#[cfg(test)]
mod tests {
    use super::super::{Condition, EvidenceStatus, ExpectationKind};
    use super::*;
    fn obs(source: &str, grade: EvidenceGrade, signal: Signal) -> Observation {
        Observation {
            evidence_id: "e1".into(),
            subject: "cmd-abc".into(),
            producer: source.into(),
            producer_epoch: "boot-1".into(),
            producer_sequence: 1,
            observed_ms: 100,
            grade,
            signal,
        }
    }
    fn policy(role: SourceRole, grade: EvidenceGrade) -> AdmissionPolicy {
        AdmissionPolicy::new(vec![SourceBinding {
            producer: "host".into(),
            expected_epoch: "boot-1".into(),
            subject_prefix: "cmd-".into(),
            role,
            maximum_grade: grade,
        }])
        .unwrap()
    }
    fn expectation() -> Expectation {
        Expectation {
            subject: "cmd-abc".into(),
            kind: ExpectationKind::Command(CommandStage::PhoneDisplayed),
            deadline_ms: 200,
            freshness_ms: 1_000,
        }
    }
    #[test]
    fn raw_journal_cannot_claim_phone_display() {
        let p = policy(SourceRole::HostJournal, EvidenceGrade::SourceVerified);
        let o = obs(
            "host",
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::PhoneDisplayed),
        );
        assert!(diagnose_admitted(&p, &expectation(), &[o], 120).is_err());
    }
    #[test]
    fn authorized_host_ack_can_establish_delivery_stage() {
        let p = policy(
            SourceRole::HostVerifiedDeliveryAck,
            EvidenceGrade::SourceVerified,
        );
        let o = obs(
            "host",
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::PhoneDisplayed),
        );
        assert_eq!(
            diagnose_admitted(&p, &expectation(), &[o], 120)
                .unwrap()
                .condition,
            Condition::Healthy
        );
    }
    #[test]
    fn phone_hints_cannot_promote_themselves_to_source_verified() {
        let bad = AdmissionPolicy::new(vec![SourceBinding {
            producer: "android".into(),
            expected_epoch: "boot-1".into(),
            subject_prefix: "cmd-".into(),
            role: SourceRole::UntrustedDeviceHint,
            maximum_grade: EvidenceGrade::SourceVerified,
        }]);
        assert!(bad.is_err());
    }
    #[test]
    fn rejects_epoch_and_scope_confusion() {
        let p = policy(SourceRole::HostJournal, EvidenceGrade::SourceVerified);
        let mut o = obs(
            "host",
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Authorized),
        );
        o.producer_epoch = "boot-new".into();
        assert!(diagnose_admitted(&p, &expectation(), &[o.clone()], 120).is_err());
        o.producer_epoch = "boot-1".into();
        o.subject = "other-cmd".into();
        assert!(diagnose_admitted(&p, &expectation(), &[o], 120).is_err());
    }
    #[test]
    fn unregistered_source_is_rejected() {
        let p = policy(SourceRole::HostJournal, EvidenceGrade::SourceVerified);
        let o = obs(
            "attacker",
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Authorized),
        );
        assert!(diagnose_admitted(&p, &expectation(), &[o], 120).is_err());
    }
    #[test]
    fn incomplete_ack_remains_unknown_under_policy() {
        let p = policy(SourceRole::HostJournal, EvidenceGrade::SourceVerified);
        let o = obs(
            "host",
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Authorized),
        );
        let d = diagnose_admitted(&p, &expectation(), &[o], 120).unwrap();
        assert_eq!(d.condition, Condition::Unknown);
        assert_eq!(d.evidence_status, EvidenceStatus::Pending);
    }
}
