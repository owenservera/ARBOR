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
        revision: "seed-candidate-2".into(),
        baseline_revision: "seed-baseline-1".into(),
        symptom_id: "failure-receipt".into(),
        producer: "independent-seed-lab".into(),
        producer_epoch: "seed-trial-1".into(),
        observed_ms: 150,
        grade: EvidenceGrade::IndependentVerified,
        reproduced_on_candidate: true,
        recovered_on_revert: true,
    };
    match find_root_cause(&exp,&failure,200,&hypotheses,&[link])? {
        RootCauseResult::Confirmed(root) => println!("HQ-065 linked=CONFIRMED cause={} revision={} baseline={} symptom={} causal_evidence={}", root.hypothesis.id, root.hypothesis.revision, root.causal_links[0].baseline_revision, root.evidence_ids[0], root.causal_links[0].evidence_id),
        RootCauseResult::Unresolved { .. } => return Err(hqkg::Error::Invalid("controlled linkage unresolved".into())),
    }
    let healthy = [observation(
        "healthy",
        Signal::Command(CommandStage::PhoneDisplayed),
    )];
    println!(
        "HQ-065 healthy_unresolved={}",
        matches!(
            find_root_cause(&exp, &healthy, 200, &hypotheses, &[])?,
            RootCauseResult::Unresolved { .. }
        )
    );
    println!("HQ-065 scope=synthetic-trusted-adapter-attestations-not-production-causality");
    Ok(())
}
fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}
