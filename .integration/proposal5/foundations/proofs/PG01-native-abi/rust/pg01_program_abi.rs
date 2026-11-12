//! Add-only PG01 test; copy to core/programmability/tests/pg01_program_abi.rs
//! in a disposable checkout of the frozen A commit. No Host effect executed.
use std::collections::BTreeSet;
use vivim_programmability_core::{
    validate_program, DataClass, PolicyLimits, Program, Refusal, Risk,
    SourceRef, TransformKind, TransformStep,
};
fn limits(allow: bool) -> PolicyLimits {
    PolicyLimits {
        id: "owner-policy".into(), revision: 4, max_risk: Risk::R1,
        max_input_class: DataClass::Internal,
        max_output_class: DataClass::Internal,
        allowed_destinations: BTreeSet::new(), allow_effect_candidates: allow,
    }
}
fn program(kind: TransformKind) -> Program {
    Program {
        id: "synthetic-pure".into(), revision: 1, policy_id: "owner-policy".into(),
        policy_revision: 4,
        steps: vec![TransformStep {
            id: "step1".into(), kind, dependencies: vec![],
            inputs: vec![SourceRef {
                source_id: "synthetic-evidence".into(), revision: 1,
                digest: "a".repeat(64), data_class: DataClass::Internal,
            }],
            output_data_class: DataClass::Internal, risk: Risk::R0, destination: None,
        }],
    }
}
#[test]
fn effect_candidate_policy_cannot_mint_host_authority() {
    let p = program(TransformKind::EffectCandidate);
    assert_eq!(validate_program(&p, &limits(false)).unwrap_err(), Refusal::EffectCandidateDisabled);
    let inert = validate_program(&p, &limits(true)).unwrap();
    assert!(!inert.execution_authorized);
    assert!(!inert.effect_performed);
}
#[test]
fn policy_revision_and_provenance_shape_fail_closed() {
    let mut stale = program(TransformKind::Interpret);
    stale.policy_revision = 3;
    assert_eq!(validate_program(&stale, &limits(true)).unwrap_err(), Refusal::PolicyStale);
    let mut forged_shape = program(TransformKind::Interpret);
    forged_shape.steps[0].inputs[0].digest = "caller-says-verified".into();
    assert_eq!(validate_program(&forged_shape, &limits(true)).unwrap_err(), Refusal::InvalidDigest);
    let accepted = validate_program(&program(TransformKind::Interpret), &limits(true)).unwrap();
    assert!(!accepted.execution_authorized && !accepted.effect_performed);
    // Valid SHA shape is NOT proof that actual bytes/owner/actor were checked.
}
