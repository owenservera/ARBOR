//! Native Lane C fault injection. These are source fixtures, not physical-device proof.
use hqkg::control::{HealthMonitor, MetricEvent, Outcome, Telemetry};
use hqkg::observability::*;

fn event(
    id: &str,
    subject: &str,
    producer: &str,
    sequence: u64,
    time: u64,
    grade: EvidenceGrade,
    signal: Signal,
) -> Observation {
    Observation {
        evidence_id: id.into(),
        subject: subject.into(),
        producer: producer.into(),
        producer_epoch: "boot-1".into(),
        producer_sequence: sequence,
        observed_ms: time,
        grade,
        signal,
    }
}
fn command() -> Expectation {
    Expectation {
        subject: "cmd-0123".into(),
        kind: ExpectationKind::Command(CommandStage::PhoneDisplayed),
        deadline_ms: 200,
        freshness_ms: 1_000,
    }
}
#[test]
fn missing_delivery_is_not_a_confirmed_failure() {
    let exp = command();
    let pending = diagnose(&exp, &[], 150).unwrap();
    assert_eq!(pending.condition, Condition::Unknown);
    assert_eq!(pending.evidence_status, EvidenceStatus::Pending);
    let overdue = diagnose(&exp, &[], 201).unwrap();
    assert_eq!(overdue.condition, Condition::Unknown);
    assert_eq!(overdue.evidence_status, EvidenceStatus::Insufficient);
    assert_eq!(overdue.code, "command_outcome_unverified");
}
#[test]
fn a_phone_hint_cannot_certify_display() {
    let exp = command();
    let inputs = [event(
        "e1",
        "cmd-0123",
        "android",
        1,
        100,
        EvidenceGrade::UntrustedHint,
        Signal::Command(CommandStage::PhoneDisplayed),
    )];
    let output = diagnose(&exp, &inputs, 150).unwrap();
    assert_ne!(output.condition, Condition::Healthy);
    assert_eq!(output.evidence_status, EvidenceStatus::Pending);
}
#[test]
fn source_verified_delivery_certifies_only_the_expected_stage() {
    let exp = command();
    let inputs = [event(
        "e1",
        "cmd-0123",
        "host",
        1,
        100,
        EvidenceGrade::SourceVerified,
        Signal::Command(CommandStage::PhoneDisplayed),
    )];
    let output = diagnose(&exp, &inputs, 120).unwrap();
    assert_eq!(output.condition, Condition::Healthy);
    assert_eq!(output.evidence_status, EvidenceStatus::Confirmed);
    assert_eq!(output.evidence_ids, vec!["e1".to_string()]);
}
#[test]
fn explicit_verified_failure_does_not_imply_resend_permission() {
    let inputs = [event(
        "f1",
        "cmd-0123",
        "host",
        1,
        100,
        EvidenceGrade::SourceVerified,
        Signal::ExplicitFailure,
    )];
    let output = diagnose(&command(), &inputs, 130).unwrap();
    assert_eq!(output.condition, Condition::Failed);
    assert_eq!(output.evidence_status, EvidenceStatus::Confirmed);
    assert_eq!(output.next_step, NextStep::OperatorReview);
}
#[test]
fn conflicting_terminal_evidence_is_not_arbitrarily_green() {
    let inputs = [
        event(
            "e1",
            "cmd-0123",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::PhoneDisplayed),
        ),
        event(
            "e2",
            "cmd-0123",
            "host",
            2,
            101,
            EvidenceGrade::SourceVerified,
            Signal::ExplicitFailure,
        ),
    ];
    let output = diagnose(&command(), &inputs, 110).unwrap();
    assert_eq!(output.condition, Condition::Unknown);
    assert_eq!(output.evidence_status, EvidenceStatus::Conflicting);
    assert_eq!(output.evidence_ids.len(), 2);
}
#[test]
fn explicitly_offline_device_is_not_broken() {
    let inputs = [
        event(
            "e1",
            "cmd-0123",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Authorized),
        ),
        event(
            "e2",
            "cmd-0123",
            "host",
            2,
            110,
            EvidenceGrade::SourceVerified,
            Signal::ExpectedOffline,
        ),
    ];
    let output = diagnose(&command(), &inputs, 115).unwrap();
    assert_eq!(output.condition, Condition::ExpectedOffline);
    assert_eq!(output.next_step, NextStep::Observe);
}
#[test]
fn newer_observer_loss_revokes_older_health_claim() {
    let exp = Expectation {
        subject: "studio".into(),
        kind: ExpectationKind::ObserverLive,
        deadline_ms: 200,
        freshness_ms: 500,
    };
    let inputs = [
        event(
            "e1",
            "studio",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::ObserverAvailable,
        ),
        event(
            "e2",
            "studio",
            "host",
            2,
            150,
            EvidenceGrade::SourceVerified,
            Signal::ObserverUnavailable,
        ),
    ];
    let output = diagnose(&exp, &inputs, 160).unwrap();
    assert_eq!(output.condition, Condition::Unknown);
    assert_eq!(output.code, "observer_unavailable");
}
#[test]
fn stale_green_evidence_cannot_claim_current_health() {
    let exp = Expectation {
        subject: "studio".into(),
        kind: ExpectationKind::ObserverLive,
        deadline_ms: 200,
        freshness_ms: 30,
    };
    let input = [event(
        "e1",
        "studio",
        "host",
        1,
        100,
        EvidenceGrade::SourceVerified,
        Signal::ObserverAvailable,
    )];
    assert_eq!(
        diagnose(&exp, &input, 200).unwrap().condition,
        Condition::Unknown
    );
}
#[test]
fn revision_mismatch_is_suspected_not_proven_root_cause() {
    let exp = Expectation {
        subject: "world-main".into(),
        kind: ExpectationKind::RevisionParity,
        deadline_ms: 200,
        freshness_ms: 500,
    };
    let inputs = [
        event(
            "w1",
            "world-main",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::WorldHead(12),
        ),
        event(
            "p1",
            "world-main",
            "android",
            1,
            101,
            EvidenceGrade::SourceVerified,
            Signal::DeviceHead(11),
        ),
    ];
    let output = diagnose(&exp, &inputs, 110).unwrap();
    assert_eq!(output.condition, Condition::Degraded);
    assert_eq!(output.evidence_status, EvidenceStatus::Suspected);
    assert_eq!(output.next_step, NextStep::VerifyReadOnly);
}
#[test]
fn equal_source_verified_revisions_pass() {
    let exp = Expectation {
        subject: "world-main".into(),
        kind: ExpectationKind::RevisionParity,
        deadline_ms: 200,
        freshness_ms: 500,
    };
    let inputs = [
        event(
            "w1",
            "world-main",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::WorldHead(12),
        ),
        event(
            "p1",
            "world-main",
            "android",
            1,
            101,
            EvidenceGrade::SourceVerified,
            Signal::DeviceHead(12),
        ),
    ];
    assert_eq!(
        diagnose(&exp, &inputs, 110).unwrap().condition,
        Condition::Healthy
    );
}
#[test]
fn duplicate_or_reordered_producer_sequences_are_rejected() {
    let inputs = [
        event(
            "e1",
            "cmd-0123",
            "host",
            5,
            100,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Accepted),
        ),
        event(
            "e2",
            "cmd-0123",
            "host",
            5,
            101,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Authorized),
        ),
    ];
    assert!(diagnose(&command(), &inputs, 120).is_err());
}
#[test]
fn missing_sequence_yields_unknown_even_if_later_event_claims_success() {
    let inputs = [
        event(
            "e1",
            "cmd-0123",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Accepted),
        ),
        event(
            "e2",
            "cmd-0123",
            "host",
            3,
            101,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::PhoneDisplayed),
        ),
    ];
    let output = diagnose(&command(), &inputs, 120).unwrap();
    assert_eq!(output.condition, Condition::Unknown);
    assert_eq!(output.code, "producer_sequence_gap");
}
#[test]
fn inappropriate_identifiers_are_rejected_without_exporting_private_data() {
    let inputs = [event(
        "prompt user secret",
        "cmd-0123",
        "host",
        1,
        100,
        EvidenceGrade::SourceVerified,
        Signal::Command(CommandStage::PhoneDisplayed),
    )];
    assert!(diagnose(&command(), &inputs, 110).is_err());
}
#[test]
fn telemetry_reuses_existing_bounded_core_collector() {
    let mut telemetry = Telemetry::new(16).unwrap();
    let unknown = diagnose_metric_window(&telemetry, "graph-main", 3, 20).unwrap();
    assert_eq!(unknown.condition, Condition::Unknown);
    for i in 0..3 {
        telemetry
            .emit(MetricEvent {
                sequence: 0,
                slot: "graph-main".into(),
                operation: "query".into(),
                outcome: Outcome::Success,
                elapsed_ms: 10 + i,
                generation: Some(2),
                config_revision: 1,
            })
            .unwrap();
    }
    let ok = diagnose_metric_window(&telemetry, "graph-main", 3, 20).unwrap();
    assert_eq!(ok.code, "metric_window_within_budget");
    assert_eq!(
        diagnose_metric_window(&telemetry, "graph-main", 3, 5)
            .unwrap()
            .condition,
        Condition::Degraded
    );
}
#[test]
fn quality_regression_is_detected_only_on_same_labeled_cohort() {
    let baseline = QualityWindow {
        corpus_revision: "golden-es-v3".into(),
        intelligence_revision: "command-v10".into(),
        trials: 100,
        correct: 97,
    };
    let candidate = QualityWindow {
        corpus_revision: "golden-es-v3".into(),
        intelligence_revision: "command-v11".into(),
        trials: 100,
        correct: 75,
    };
    let outcome = diagnose_quality(&baseline, &candidate, 50, 300).unwrap();
    assert_eq!(outcome.condition, Condition::Degraded);
    assert_eq!(outcome.evidence_status, EvidenceStatus::Suspected);
    let mut mismatched = candidate.clone();
    mismatched.corpus_revision = "different".into();
    assert!(diagnose_quality(&baseline, &mismatched, 50, 300).is_err());
}
#[test]
fn unobserved_health_is_unknown_not_default_ready() {
    let monitor = HealthMonitor::default();
    assert_eq!(
        diagnose_core_health(&monitor, "graph-main", false)
            .unwrap()
            .condition,
        Condition::Unknown
    );
    assert_eq!(
        diagnose_core_health(&monitor, "graph-main", true)
            .unwrap()
            .condition,
        Condition::Healthy
    );
}

#[test]
fn producer_epoch_change_requires_explicit_reconciliation() {
    let mut reboot = event(
        "e2",
        "cmd-0123",
        "host",
        1,
        110,
        EvidenceGrade::SourceVerified,
        Signal::Command(CommandStage::PhoneDisplayed),
    );
    reboot.producer_epoch = "boot-2".into();
    let inputs = [
        event(
            "e1",
            "cmd-0123",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Accepted),
        ),
        reboot,
    ];
    let output = diagnose(&command(), &inputs, 120).unwrap();
    assert_eq!(output.condition, Condition::Unknown);
    assert_eq!(output.code, "producer_epoch_transition");
}
#[test]
fn stage_regression_is_conflicting_evidence() {
    let inputs = [
        event(
            "e1",
            "cmd-0123",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Authorized),
        ),
        event(
            "e2",
            "cmd-0123",
            "host",
            2,
            101,
            EvidenceGrade::SourceVerified,
            Signal::Command(CommandStage::Accepted),
        ),
    ];
    let output = diagnose(&command(), &inputs, 110).unwrap();
    assert_eq!(output.evidence_status, EvidenceStatus::Conflicting);
}
#[test]
fn stale_pair_of_watermarks_cannot_establish_parity() {
    let exp = Expectation {
        subject: "world-main".into(),
        kind: ExpectationKind::RevisionParity,
        deadline_ms: 5_000,
        freshness_ms: 5_000,
    };
    let inputs = [
        event(
            "w1",
            "world-main",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::WorldHead(12),
        ),
        event(
            "p1",
            "world-main",
            "android",
            1,
            3_100,
            EvidenceGrade::SourceVerified,
            Signal::DeviceHead(12),
        ),
    ];
    let output = diagnose(&exp, &inputs, 3_200).unwrap();
    assert_eq!(output.condition, Condition::Unknown);
    assert_eq!(output.code, "revision_watermarks_not_coobserved");
}
#[test]
fn a_later_offline_notice_does_not_hide_verified_command_failure() {
    let inputs = [
        event(
            "e1",
            "cmd-0123",
            "host",
            1,
            100,
            EvidenceGrade::SourceVerified,
            Signal::ExplicitFailure,
        ),
        event(
            "e2",
            "cmd-0123",
            "host",
            2,
            110,
            EvidenceGrade::SourceVerified,
            Signal::ExpectedOffline,
        ),
    ];
    let output = diagnose(&command(), &inputs, 120).unwrap();
    assert_eq!(output.condition, Condition::Failed);
    assert_eq!(output.evidence_status, EvidenceStatus::Confirmed);
}
