# File: native/hqkg/examples/observability_probe.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/examples/observability_probe.rs |
| Language | Rust |
| Kind | source |
| Size | 4540 B |
| Lines | 114 |
| Hash | 215075bc8089 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| observation | function | 8 | no | fn observation(id: &amp;str, signal: Signal) -&gt; Observation { |
| hypothesis | function | 20 | no | fn hypothesis(id: &amp;&#39;static str, code: &amp;&#39;static str) -&gt; Hypothesis { |
| run | function | 28 | no | fn run() -&gt; Result&lt;()&gt; { |
| main | function | 109 | no | fn main() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::observability::{ | use | 2 | external |
| hqkg::Result | use | 6 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
// Seeded read-only ground-truth probe for HQ-064/HQ-065. No provider/Host effects.
use hqkg::observability::{
    discriminate_evidence, find_root_cause, CausalLink, CommandStage, EvidenceGrade, Expectation,
    ExpectationKind, Hypothesis, Observation, RootCauseResult, Signal, CAUSAL_CONTRACT,
};
use hqkg::Result;

fn observation(id: &str, signal: Signal) -> Observation {
    Observation {
        evidence_id: id.into(),
        subject: "seed-workflow".into(),
        producer: id.into(),
        producer_epoch: "seed-epoch".into(),
        producer_sequence: 1,
        observed_ms: 100,
        grade: EvidenceGrade::SourceVerified,
        signal,
    }
}
fn hypothesis(id: &'static str, code: &'static str) -> Hypothesis {
    Hypothesis {
        id,
        subject: "seed-workflow".into(),
        revision: "seed-candidate-2".into(),
        explains: vec![code],
    }
}
fn run() -> Result<()> {
    let exp = Expectation {
        subject: "seed-workflow".into(),
        kind: ExpectationKind::Command(CommandStage::PhoneDisplayed),
        deadline_ms: 1000,
        freshness_ms: 5000,
    };
    let a = hypothesis("delivery-completed", "required_command_stage_observed");
    let b = hypothesis("upstream-regression", "verified_command_failure");
    let input = [
        observation(
            "delivery-ack",
            Signal::Command(CommandStage::PhoneDisplayed),
        ),
        observation("failure-receipt", Signal::ExplicitFailure),
    ];
    let evidence = discriminate_evidence(&a, &b, &exp, &input, 200)?;
    println!("contract={CAUSAL_CONTRACT}");
    println!("HQ-064 discriminators={:?}", evidence.discriminators);
    println!("HQ-064 supports={:?}", evidence.supports);
    let mut hint = observation("untrusted-hint", Signal::ExplicitFailure);
    hint.grade = EvidenceGrade::UntrustedHint;
    println!(
        "HQ-064 untrusted_discriminators={}",
        discriminate_evidence(&a, &b, &exp, &[hint], 200)?
            .discriminators
            .len()
    );
    let mut foreign = observation("foreign", Signal::ExplicitFailure);
    foreign.subject = "other-workflow".into();
    println!(
        "HQ-064 foreign_subject_rejected={}",
        discriminate_evidence(&a, &b, &exp, &[foreign], 200).is_err()
    );
    let failure = [observation("failure-receipt", Signal::ExplicitFailure)];
    let hypotheses = [b];
    match find_root_cause(&exp, &failure, 200, &hypotheses, &[])? {
        RootCauseResult::Unresolved {
            diagnostic,
            hypotheses,
        } => println!(
            "HQ-065 bare_failure=UNRESOLVED diagnostic={} hypotheses={} revision={}",
            diagnostic.code,
            hypotheses.len(),
            hypotheses[0].revision
        ),
        RootCauseResult::Confirmed(_) => {
            return Err(hqkg::Error::Invalid("symptom falsely confirmed".into()))
        }
    }
    let link = CausalLink {
        evidence_id: "seed-controlled-revert".into(),
        hypothesis_id: "upstream-regression",
```

_First 80 of 115 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
