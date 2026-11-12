//! Native Lane C cross-module fault tests (synthetic, never physical device proof).
use hqkg::control::{MetricEvent, Outcome, Telemetry};
use hqkg::observability::admission::*;
use hqkg::observability::correlation::*;
use hqkg::observability::drift::*;
use hqkg::observability::effects::*;
use hqkg::observability::incidents::*;
use hqkg::observability::quality::*;
use hqkg::observability::recovery::*;
use hqkg::observability::synthesis::*;
use hqkg::observability::*;
use hqkg::{Edge, Graph, Node, NodeKind};

fn expectation() -> Expectation {
    Expectation {
        subject: "cmd-10".into(),
        kind: ExpectationKind::Command(CommandStage::PhoneDisplayed),
        deadline_ms: 1_000,
        freshness_ms: 5_000,
    }
}
fn observation(id: &str, producer: &str, seq: u64, stage: CommandStage) -> Observation {
    Observation {
        evidence_id: id.into(),
        subject: "cmd-10".into(),
        producer: producer.into(),
        producer_epoch: "boot-a".into(),
        producer_sequence: seq,
        observed_ms: 100 + seq,
        grade: EvidenceGrade::SourceVerified,
        signal: Signal::Command(stage),
    }
}
fn admission() -> AdmissionPolicy {
    AdmissionPolicy::new(vec![
        SourceBinding {
            producer: "host-journal".into(),
            expected_epoch: "boot-a".into(),
            subject_prefix: "cmd-".into(),
            role: SourceRole::HostJournal,
            maximum_grade: EvidenceGrade::SourceVerified,
        },
        SourceBinding {
            producer: "verified-ack".into(),
            expected_epoch: "boot-a".into(),
            subject_prefix: "cmd-".into(),
            role: SourceRole::HostVerifiedDeliveryAck,
            maximum_grade: EvidenceGrade::SourceVerified,
        },
    ])
    .unwrap()
}
#[test]
fn full_command_progress_to_verified_display() {
    let input = [
        observation("a", "host-journal", 1, CommandStage::Accepted),
        observation("b", "host-journal", 2, CommandStage::Authorized),
        observation("c", "host-journal", 3, CommandStage::SendObserved),
        observation("d", "host-journal", 4, CommandStage::ReplyObserved),
        observation("e", "verified-ack", 1, CommandStage::PhoneDisplayed),
    ];
    let finding = diagnose_admitted(&admission(), &expectation(), &input, 200).unwrap();
    assert_eq!(finding.condition, Condition::Healthy);
    assert_eq!(finding.evidence_status, EvidenceStatus::Confirmed);
}
#[test]
fn a_reply_without_phone_display_is_not_delivered() {
    let input = [
        observation("a", "host-journal", 1, CommandStage::SendObserved),
        observation("b", "host-journal", 2, CommandStage::ReplyObserved),
    ];
    let d = diagnose_admitted(&admission(), &expectation(), &input, 200).unwrap();
    assert_eq!(d.condition, Condition::Unknown);
    assert_eq!(d.evidence_status, EvidenceStatus::Pending);
}
#[test]
fn a_fake_ack_from_the_journal_role_is_rejected() {
    let input = [observation(
        "fake",
        "host-journal",
        1,
        CommandStage::PhoneDisplayed,
    )];
    assert!(diagnose_admitted(&admission(), &expectation(), &input, 200).is_err());
}
#[test]
fn confirmed_duplicate_effect_advises_investigation_not_auto_execution() {
    let effects = [
        EffectClaim {
            command_id: "cmd-10",
            effect_id: "effect-1",
            receipt_id: "receipt-1",
            kind: EffectKind::ProviderSend,
            source_verified: true,
        },
        EffectClaim {
            command_id: "cmd-10",
            effect_id: "effect-2",
            receipt_id: "receipt-2",
            kind: EffectKind::ProviderSend,
            source_verified: true,
        },
    ];
    let finding = audit_effect_uniqueness("cmd-10", EffectKind::ProviderSend, &effects).unwrap();
    assert_eq!(finding.condition, Condition::Failed);
    let handoff = prepare_lane_d_handoff("cmd-10", &finding, Impact::Critical).unwrap();
    assert!(!handoff.may_execute);
    assert_eq!(handoff.advice, RecoveryAdvice::OperatorInvestigation);
}
#[test]
fn real_consistent_recent_metric_window_survives_ring_retention() {
    let mut t = Telemetry::new(16).unwrap();
    for _ in 0..16 {
        t.emit(MetricEvent {
            sequence: 0,
            slot: "graph-main".into(),
            operation: "read".into(),
            outcome: Outcome::Success,
            elapsed_ms: 5,
            generation: None,
            config_revision: 1,
        })
        .unwrap();
    }
    let cursor = MetricCursor::at_current(&t);
    for _ in 0..5 {
        t.emit(MetricEvent {
            sequence: 0,
            slot: "graph-main".into(),
            operation: "read".into(),
            outcome: Outcome::Success,
            elapsed_ms: 6,
            generation: None,
            config_revision: 1,
        })
        .unwrap();
    }
    assert!(t.dropped() > 0);
    assert_eq!(
        diagnose_metric_window_since(&t, "graph-main", cursor, 5, 10)
            .unwrap()
            .condition,
        Condition::Healthy
    );
}
#[test]
fn cursor_before_overwritten_ring_is_not_green() {
    let mut t = Telemetry::new(16).unwrap();
    for _ in 0..20 {
        t.emit(MetricEvent {
            sequence: 0,
            slot: "graph-main".into(),
            operation: "read".into(),
            outcome: Outcome::Success,
            elapsed_ms: 5,
            generation: None,
            config_revision: 1,
        })
        .unwrap();
    }
    assert_eq!(
        diagnose_metric_window_since(&t, "graph-main", MetricCursor { after_sequence: 1 }, 5, 10)
            .unwrap()
            .code,
        "metric_cursor_overrun"
    );
}
#[test]
fn drift_then_repeated_incidents_then_recovery_is_all_advisory() {
    let baseline = [10; 32];
    let degraded = [50; 32];
    fn window<'a>(values: &'a [u64]) -> DriftWindow<'a> {
        DriftWindow {
            cohort: "graph-query",
            source_epoch: "boot-1",
            instrument_revision: "v3",
            values,
            lost_samples: false,
        }
    }
    let issue = assess_drift(
        &window(&baseline),
        &window(&degraded),
        DriftPolicy::default(),
    )
    .unwrap()
    .finding;
    assert_eq!(issue.condition, Condition::Degraded);
    let mut state = IncidentState::initial("graph-query").unwrap();
    for i in 0..3 {
        state = reduce_incident(&state, &issue, 100 + 10 * i, IncidentPolicy::default())
            .unwrap()
            .state;
    }
    assert!(state.open);
    let handoff = prepare_lane_d_handoff("graph-query", &issue, Impact::Medium).unwrap();
    assert_eq!(handoff.advice, RecoveryAdvice::ReadOnlyReverify);
    assert!(!handoff.may_execute);
}
#[test]
fn causal_hypothesis_not_allowed_to_execute_repair() {
    let mut g = Graph::new();
    for id in ["phone", "transport"] {
        g.put_node(Node::new(id, NodeKind::Other("component".into()), id))
            .unwrap();
    }
    g.put_edge(Edge::new("e1", "phone", "depends_on", "transport"))
        .unwrap();
    let candidates = rank_causes(
        &g,
        &[Symptom {
            subject: "phone".into(),
            evidence_id: "evidence-1".into(),
            kind: SymptomKind::ConfirmedFailure,
        }],
        3,
        4,
    )
    .unwrap();
    let culprit = candidates
        .iter()
        .find(|c| c.subject == "transport")
        .unwrap();
    assert!(!culprit.directly_observed_failure);
    assert!(!culprit.supporting_evidence.is_empty());
}
#[test]
fn aggregate_report_refuses_green_when_critical_component_is_unknown() {
    let healthy = DiagnosticFinding {
        condition: Condition::Healthy,
        evidence_status: EvidenceStatus::Confirmed,
        code: "ready",
        evidence_ids: vec!["e1".into()],
        missing: vec![],
        next_step: NextStep::Observe,
    };
    let unknown = DiagnosticFinding {
        condition: Condition::Unknown,
        evidence_status: EvidenceStatus::Insufficient,
        code: "unverified",
        evidence_ids: vec![],
        missing: vec!["probe"],
        next_step: NextStep::VerifyReadOnly,
    };
    let result = synthesize_system(&[
        RequiredCapability {
            component: "host".into(),
            required: true,
            finding: healthy,
        },
        RequiredCapability {
            component: "chrome".into(),
            required: true,
            finding: unknown,
        },
    ])
    .unwrap();
    assert_eq!(result.condition, Condition::Unknown);
}
#[test]
fn command_quality_safety_regression_remains_visible_despite_accuracy_gain() {
    let baseline = QualitySuite {
        lane: IntelligenceLane::CommandUnderstanding,
        cohort: "es-local".into(),
        aggregate: QualityWindow {
            corpus_revision: "g1".into(),
            intelligence_revision: "a".into(),
            trials: 100,
            correct: 90,
        },
        abstained: 5,
        unsafe_accepts: 0,
    };
    let candidate = QualitySuite {
        aggregate: QualityWindow {
            intelligence_revision: "b".into(),
            correct: 94,
            ..baseline.aggregate.clone()
        },
        abstained: 3,
        unsafe_accepts: 2,
        ..baseline.clone()
    };
    let finding = assess_intelligence_quality(&baseline, &candidate, QualityPolicy::default())
        .unwrap()
        .finding;
    assert_eq!(finding.code, "labeled_unsafe_acceptance_regression");
}

#[test]
fn independent_ack_and_journal_same_time_do_not_look_like_stage_regression() {
    let mut reply = observation(
        "journal-reply",
        "host-journal",
        1,
        CommandStage::ReplyObserved,
    );
    let mut ack = observation("phone-ack", "verified-ack", 1, CommandStage::PhoneDisplayed);
    // Different producers can have independent sequence numbers and equal
    // timestamps. Neither source's events may establish backward progress.
    reply.observed_ms = 100;
    ack.observed_ms = 100;
    let output = diagnose_admitted(&admission(), &expectation(), &[reply, ack], 110).unwrap();
    assert_eq!(output.condition, Condition::Healthy);
    assert_eq!(output.evidence_status, EvidenceStatus::Confirmed);
}
