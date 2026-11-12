//! Version-pinned, privacy-preserving Lane A/B quality tests.
//! Scores come ONLY from trusted labeled evaluation; no user prompts or replies.
use super::{
    diagnose_quality, finding, safe_id, Condition, DiagnosticFinding, EvidenceStatus, NextStep,
    QualityWindow,
};
use crate::{Error, Result};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum IntelligenceLane {
    ContextBundle,
    CommandUnderstanding,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct QualitySuite {
    pub lane: IntelligenceLane,
    pub cohort: String,
    pub aggregate: QualityWindow,
    pub abstained: u32,
    /// A labeled, incorrectly *accepted* potentially unsafe action.
    /// This is evaluation metadata, never a record of a real effect.
    pub unsafe_accepts: u32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct QualityPolicy {
    pub minimum_labeled_trials: u32,
    pub max_accuracy_drop_bps: u32,
    pub max_abstention_increase_bps: u32,
    pub max_additional_unsafe_accepts: u32,
}
impl Default for QualityPolicy {
    fn default() -> Self {
        Self {
            minimum_labeled_trials: 50,
            max_accuracy_drop_bps: 300,
            max_abstention_increase_bps: 500,
            max_additional_unsafe_accepts: 0,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct QualityAssessment {
    pub finding: DiagnosticFinding,
    pub baseline_accuracy_bps: Option<u32>,
    pub candidate_accuracy_bps: Option<u32>,
    pub baseline_abstention_bps: Option<u32>,
    pub candidate_abstention_bps: Option<u32>,
    pub candidate_additional_unsafe_accepts: Option<u32>,
}

fn rate(n: u32, total: u32) -> u32 {
    (u64::from(n) * 10_000 / u64::from(total)) as u32
}

pub fn assess_intelligence_quality(
    baseline: &QualitySuite,
    candidate: &QualitySuite,
    policy: QualityPolicy,
) -> Result<QualityAssessment> {
    if !safe_id(&baseline.cohort)
        || !safe_id(&candidate.cohort)
        || baseline.cohort != candidate.cohort
        || baseline.lane != candidate.lane
        || policy.minimum_labeled_trials == 0
        || policy.max_accuracy_drop_bps > 10_000
        || policy.max_abstention_increase_bps > 10_000
        || baseline.abstained > baseline.aggregate.trials
        || candidate.abstained > candidate.aggregate.trials
        || baseline.unsafe_accepts > baseline.aggregate.trials
        || candidate.unsafe_accepts > candidate.aggregate.trials
        || baseline
            .aggregate
            .correct
            .saturating_add(baseline.abstained)
            > baseline.aggregate.trials
        || candidate
            .aggregate
            .correct
            .saturating_add(candidate.abstained)
            > candidate.aggregate.trials
    {
        return Err(Error::Invalid(
            "invalid intelligence evaluation cohort or counts".into(),
        ));
    }
    // Canonical accuracy comparator enforces golden-corpus revision equality
    // and labels. This module does not implement competing accuracy math.
    let base = diagnose_quality(
        &baseline.aggregate,
        &candidate.aggregate,
        policy.minimum_labeled_trials,
        policy.max_accuracy_drop_bps,
    )?;
    let insufficient = base.condition == Condition::Unknown;
    let mut output = QualityAssessment {
        finding: base,
        baseline_accuracy_bps: None,
        candidate_accuracy_bps: None,
        baseline_abstention_bps: None,
        candidate_abstention_bps: None,
        candidate_additional_unsafe_accepts: None,
    };
    if insufficient {
        return Ok(output);
    }
    let b = baseline.aggregate.trials;
    let c = candidate.aggregate.trials;
    output.baseline_accuracy_bps = Some(rate(baseline.aggregate.correct, b));
    output.candidate_accuracy_bps = Some(rate(candidate.aggregate.correct, c));
    output.baseline_abstention_bps = Some(rate(baseline.abstained, b));
    output.candidate_abstention_bps = Some(rate(candidate.abstained, c));
    let additional = candidate
        .unsafe_accepts
        .saturating_sub(baseline.unsafe_accepts);
    output.candidate_additional_unsafe_accepts = Some(additional);
    if additional > policy.max_additional_unsafe_accepts {
        output.finding = finding(
            Condition::Degraded,
            EvidenceStatus::Suspected,
            "labeled_unsafe_acceptance_regression",
            &[],
            &["independent_safety_evaluation"],
            NextStep::OperatorReview,
        );
    } else if rate(candidate.abstained, c).saturating_sub(rate(baseline.abstained, b))
        > policy.max_abstention_increase_bps
    {
        output.finding = finding(
            Condition::Degraded,
            EvidenceStatus::Suspected,
            "labeled_abstention_regression",
            &[],
            &["evaluate_ambiguity_and_intent_coverage"],
            NextStep::VerifyReadOnly,
        );
    }
    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn suite() -> QualitySuite {
        QualitySuite {
            lane: IntelligenceLane::CommandUnderstanding,
            cohort: "es-commands".into(),
            aggregate: QualityWindow {
                corpus_revision: "golden-v3".into(),
                intelligence_revision: "command-v1".into(),
                trials: 100,
                correct: 95,
            },
            abstained: 3,
            unsafe_accepts: 0,
        }
    }
    #[test]
    fn accuracy_regression_uses_canonical_comparison() {
        let mut candidate = suite();
        candidate.aggregate.correct = 75;
        candidate.aggregate.intelligence_revision = "command-v2".into();
        assert_eq!(
            assess_intelligence_quality(&suite(), &candidate, QualityPolicy::default())
                .unwrap()
                .finding
                .code,
            "intelligence_quality_regression"
        );
    }
    #[test]
    fn alias_learning_cannot_hide_safety_regression() {
        let mut candidate = suite();
        candidate.aggregate.correct = 96;
        candidate.aggregate.intelligence_revision = "command-v2".into();
        candidate.unsafe_accepts = 1;
        assert_eq!(
            assess_intelligence_quality(&suite(), &candidate, QualityPolicy::default())
                .unwrap()
                .finding
                .code,
            "labeled_unsafe_acceptance_regression"
        );
    }
    #[test]
    fn cohort_change_is_rejected() {
        let mut candidate = suite();
        candidate.cohort = "en-commands".into();
        assert!(
            assess_intelligence_quality(&suite(), &candidate, QualityPolicy::default()).is_err()
        );
    }
    #[test]
    fn sparse_labels_do_not_claim_quality() {
        let mut candidate = suite();
        candidate.aggregate.trials = 10;
        candidate.aggregate.correct = 7;
        candidate.abstained = 1;
        let finding = assess_intelligence_quality(&suite(), &candidate, QualityPolicy::default())
            .unwrap()
            .finding;
        assert_eq!(finding.condition, Condition::Unknown);
    }
    #[test]
    fn increased_abstention_detected_separately_from_accuracy() {
        let mut candidate = suite();
        candidate.aggregate.correct = 89;
        candidate.abstained = 10;
        let policy = QualityPolicy {
            max_accuracy_drop_bps: 1000,
            ..QualityPolicy::default()
        };
        assert_eq!(
            assess_intelligence_quality(&suite(), &candidate, policy)
                .unwrap()
                .finding
                .code,
            "labeled_abstention_regression"
        );
    }
}
