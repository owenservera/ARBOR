//! Detects duplicate Host-owned effects from authenticated durable receipts.
//! Repeated acknowledgement of the SAME effect is not a second send. Never retry.
use super::{finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep};
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum EffectKind {
    ProviderSend,
    WorldPublish,
    FileWrite,
    OtherHostEffect,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EffectClaim<'a> {
    pub command_id: &'a str,
    pub effect_id: &'a str,
    pub receipt_id: &'a str,
    pub kind: EffectKind,
    /// True only when the Host source adapter authenticated a durable effect claim.
    pub source_verified: bool,
}

pub fn audit_effect_uniqueness(
    command_id: &str,
    kind: EffectKind,
    claims: &[EffectClaim<'_>],
) -> Result<DiagnosticFinding> {
    if !safe_id(command_id) || claims.len() > 4_096 {
        return Err(Error::Invalid(
            "invalid effect audit budget or command".into(),
        ));
    }
    let mut effect_refs: BTreeMap<&str, BTreeSet<&str>> = BTreeMap::new();
    let mut hint = false;
    let mut seen_receipts = BTreeSet::new();
    for claim in claims {
        if !safe_id(claim.command_id)
            || !safe_id(claim.effect_id)
            || !safe_id(claim.receipt_id)
            || !seen_receipts.insert(claim.receipt_id)
        {
            return Err(Error::Invalid(
                "invalid or duplicate effect receipt id".into(),
            ));
        }
        if claim.command_id != command_id || claim.kind != kind {
            continue;
        }
        if claim.source_verified {
            effect_refs
                .entry(claim.effect_id)
                .or_default()
                .insert(claim.receipt_id);
        } else {
            hint = true;
        }
    }
    if effect_refs.len() > 1 {
        let refs = effect_refs
            .values()
            .filter_map(|set| set.iter().next())
            .take(16)
            .copied()
            .collect::<Vec<_>>();
        return Ok(finding(
            Condition::Failed,
            EvidenceStatus::Confirmed,
            "multiple_verified_host_effects",
            &refs,
            &[],
            NextStep::OperatorReview,
        ));
    }
    if hint {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "effect_claims_not_all_verified",
            &[],
            &["reconcile_hint_against_host_effect_journal"],
            NextStep::VerifyReadOnly,
        ));
    }
    match effect_refs.into_values().next() {
        Some(receipts) => {
            let id = *receipts.iter().next().unwrap();
            Ok(finding(
                Condition::Healthy,
                EvidenceStatus::Confirmed,
                "single_verified_host_effect",
                &[id],
                &[],
                NextStep::Observe,
            ))
        }
        None => Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "host_effect_unobserved",
            &[],
            &["source_verified_effect_claim"],
            NextStep::VerifyReadOnly,
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn receipt<'a>(id: &'a str, effect: &'a str, verified: bool) -> EffectClaim<'a> {
        EffectClaim {
            command_id: "cmd-123",
            receipt_id: id,
            effect_id: effect,
            kind: EffectKind::ProviderSend,
            source_verified: verified,
        }
    }
    #[test]
    fn same_effect_multiple_acks_are_idempotent() {
        let result = audit_effect_uniqueness(
            "cmd-123",
            EffectKind::ProviderSend,
            &[receipt("r1", "fx1", true), receipt("r2", "fx1", true)],
        )
        .unwrap();
        assert_eq!(result.condition, Condition::Healthy);
    }
    #[test]
    fn two_distinct_verified_effects_are_confirmed_violation() {
        let result = audit_effect_uniqueness(
            "cmd-123",
            EffectKind::ProviderSend,
            &[receipt("r1", "fx1", true), receipt("r2", "fx2", true)],
        )
        .unwrap();
        assert_eq!(result.condition, Condition::Failed);
        assert_eq!(result.evidence_status, EvidenceStatus::Confirmed);
        assert_eq!(result.code, "multiple_verified_host_effects");
    }
    #[test]
    fn hint_cannot_certify_the_second_effect() {
        let result = audit_effect_uniqueness(
            "cmd-123",
            EffectKind::ProviderSend,
            &[receipt("r1", "fx1", true), receipt("r2", "fx2", false)],
        )
        .unwrap();
        assert_eq!(result.condition, Condition::Unknown);
    }
    #[test]
    fn nothing_observed_does_not_mean_no_effect() {
        assert_eq!(
            audit_effect_uniqueness("cmd-123", EffectKind::ProviderSend, &[])
                .unwrap()
                .condition,
            Condition::Unknown
        );
    }
}
