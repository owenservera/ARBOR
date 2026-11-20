# File: native/hqkg/src/observability/journey.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/journey.rs |
| Language | Rust |
| Kind | source |
| Size | 6879 B |
| Lines | 184 |
| Hash | 17b70c6e77f1 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ORDER | const | 11 | no | const ORDER: [CommandStage; 5] = [ |
| JourneyEvidence | struct | 20 | yes | pub struct JourneyEvidence { |
| diagnose_journey | function | 27 | yes | pub fn diagnose_journey( policy: &amp;AdmissionPolicy, expectation: &amp;Expectation, observations: &amp;[Observation], now_ms: u64, |
| tests | module | 111 | no | mod tests { |
| policy | function | 114 | no | fn policy() -&gt; AdmissionPolicy { |
| exp | function | 133 | no | fn exp() -&gt; Expectation { |
| obs | function | 141 | no | fn obs(id: &amp;str, producer: &amp;str, seq: u64, stage: CommandStage) -&gt; Observation { |
| isolated_phone_ack_is_not_complete_chain | function | 154 | no | fn isolated_phone_ack_is_not_complete_chain() { |
| all_five_verified_stages_certify_journey | function | 161 | no | fn all_five_verified_stages_certify_journey() { |
| missing_send_receipt_is_not_e2e_success | function | 174 | no | fn missing_send_receipt_is_not_e2e_success() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::admission::AdmissionPolicy | use | 3 | external |
| super::{ | use | 4 | external |
| crate::{Error, Result} | use | 8 | external |
| std::collections::BTreeMap | use | 9 | external |
| super::super::admission::{SourceBinding, SourceRole} | use | 112 | external |
| super::* | use | 113 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 185 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
