# File: native/hqkg/tests/observability.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/observability.rs |
| Language | Rust |
| Kind | source |
| Size | 14550 B |
| Lines | 504 |
| Hash | f3b03ba9de40 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| event | function | 5 | no | fn event( id: &amp;str, subject: &amp;str, producer: &amp;str, sequence: u64, |
| command | function | 25 | no | fn command() -&gt; Expectation { |
| missing_delivery_is_not_a_confirmed_failure | function | 34 | no | fn missing_delivery_is_not_a_confirmed_failure() { |
| a_phone_hint_cannot_certify_display | function | 45 | no | fn a_phone_hint_cannot_certify_display() { |
| source_verified_delivery_certifies_only_the_expected_stage | function | 61 | no | fn source_verified_delivery_certifies_only_the_expected_stage() { |
| explicit_verified_failure_does_not_imply_resend_permission | function | 78 | no | fn explicit_verified_failure_does_not_imply_resend_permission() { |
| conflicting_terminal_evidence_is_not_arbitrarily_green | function | 94 | no | fn conflicting_terminal_evidence_is_not_arbitrarily_green() { |
| explicitly_offline_device_is_not_broken | function | 121 | no | fn explicitly_offline_device_is_not_broken() { |
| newer_observer_loss_revokes_older_health_claim | function | 147 | no | fn newer_observer_loss_revokes_older_health_claim() { |
| stale_green_evidence_cannot_claim_current_health | function | 179 | no | fn stale_green_evidence_cannot_claim_current_health() { |
| revision_mismatch_is_suspected_not_proven_root_cause | function | 201 | no | fn revision_mismatch_is_suspected_not_proven_root_cause() { |
| equal_source_verified_revisions_pass | function | 234 | no | fn equal_source_verified_revisions_pass() { |
| duplicate_or_reordered_producer_sequences_are_rejected | function | 267 | no | fn duplicate_or_reordered_producer_sequences_are_rejected() { |
| missing_sequence_yields_unknown_even_if_later_event_claims_success | function | 291 | no | fn missing_sequence_yields_unknown_even_if_later_event_claims_success() { |
| inappropriate_identifiers_are_rejected_without_exporting_private_data | function | 317 | no | fn inappropriate_identifiers_are_rejected_without_exporting_private_data() { |
| telemetry_reuses_existing_bounded_core_collector | function | 330 | no | fn telemetry_reuses_existing_bounded_core_collector() { |
| quality_regression_is_detected_only_on_same_labeled_cohort | function | 357 | no | fn quality_regression_is_detected_only_on_same_labeled_cohort() { |
| unobserved_health_is_unknown_not_default_ready | function | 378 | no | fn unobserved_health_is_unknown_not_default_ready() { |
| producer_epoch_change_requires_explicit_reconciliation | function | 395 | no | fn producer_epoch_change_requires_explicit_reconciliation() { |
| stage_regression_is_conflicting_evidence | function | 423 | no | fn stage_regression_is_conflicting_evidence() { |
| stale_pair_of_watermarks_cannot_establish_parity | function | 448 | no | fn stale_pair_of_watermarks_cannot_establish_parity() { |
| a_later_offline_notice_does_not_hide_verified_command_failure | function | 480 | no | fn a_later_offline_notice_does_not_hide_verified_command_failure() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::control::{HealthMonitor, MetricEvent, Outcome, Telemetry} | use | 2 | external |
| hqkg::observability::* | use | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 505 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
