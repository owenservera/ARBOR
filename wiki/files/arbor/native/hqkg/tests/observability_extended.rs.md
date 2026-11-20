# File: native/hqkg/tests/observability_extended.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/observability_extended.rs |
| Language | Rust |
| Kind | source |
| Size | 10467 B |
| Lines | 306 |
| Hash | 8d0bcd88c997 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| expectation | function | 14 | no | fn expectation() -&gt; Expectation { |
| observation | function | 22 | no | fn observation(id: &amp;str, producer: &amp;str, seq: u64, stage: CommandStage) -&gt; Observation { |
| admission | function | 34 | no | fn admission() -&gt; AdmissionPolicy { |
| full_command_progress_to_verified_display | function | 54 | no | fn full_command_progress_to_verified_display() { |
| a_reply_without_phone_display_is_not_delivered | function | 67 | no | fn a_reply_without_phone_display_is_not_delivered() { |
| a_fake_ack_from_the_journal_role_is_rejected | function | 77 | no | fn a_fake_ack_from_the_journal_role_is_rejected() { |
| confirmed_duplicate_effect_advises_investigation_not_auto_execution | function | 87 | no | fn confirmed_duplicate_effect_advises_investigation_not_auto_execution() { |
| real_consistent_recent_metric_window_survives_ring_retention | function | 111 | no | fn real_consistent_recent_metric_window_survives_ring_retention() { |
| cursor_before_overwritten_ring_is_not_green | function | 147 | no | fn cursor_before_overwritten_ring_is_not_green() { |
| drift_then_repeated_incidents_then_recovery_is_all_advisory | function | 169 | no | fn drift_then_repeated_incidents_then_recovery_is_all_advisory() { |
| window | function | 172 | no | fn window&lt;&#39;a&gt;(values: &amp;&#39;a [u64]) -&gt; DriftWindow&lt;&#39;a&gt; { |
| causal_hypothesis_not_allowed_to_execute_repair | function | 201 | no | fn causal_hypothesis_not_allowed_to_execute_repair() { |
| aggregate_report_refuses_green_when_critical_component_is_unknown | function | 228 | no | fn aggregate_report_refuses_green_when_critical_component_is_unknown() { |
| command_quality_safety_regression_remains_visible_despite_accuracy_gain | function | 261 | no | fn command_quality_safety_regression_remains_visible_despite_accuracy_gain() { |
| independent_ack_and_journal_same_time_do_not_look_like_stage_regression | function | 291 | no | fn independent_ack_and_journal_same_time_do_not_look_like_stage_regression() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::control::{MetricEvent, Outcome, Telemetry} | use | 2 | external |
| hqkg::observability::admission::* | use | 3 | external |
| hqkg::observability::correlation::* | use | 4 | external |
| hqkg::observability::drift::* | use | 5 | external |
| hqkg::observability::effects::* | use | 6 | external |
| hqkg::observability::incidents::* | use | 7 | external |
| hqkg::observability::quality::* | use | 8 | external |
| hqkg::observability::recovery::* | use | 9 | external |
| hqkg::observability::synthesis::* | use | 10 | external |
| hqkg::observability::* | use | 11 | external |
| hqkg::{Edge, Graph, Node, NodeKind} | use | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 307 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
