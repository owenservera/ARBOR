# File: native/hqkg/src/observability/quality.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/quality.rs |
| Language | Rust |
| Kind | source |
| Size | 7836 B |
| Lines | 223 |
| Hash | 032a28ba1b4c |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| IntelligenceLane | enum | 10 | yes | pub enum IntelligenceLane { |
| QualitySuite | struct | 16 | yes | pub struct QualitySuite { |
| QualityPolicy | struct | 27 | yes | pub struct QualityPolicy { |
| QualityAssessment | struct | 45 | yes | pub struct QualityAssessment { |
| rate | function | 54 | no | fn rate(n: u32, total: u32) -&gt; u32 { |
| assess_intelligence_quality | function | 58 | yes | pub fn assess_intelligence_quality( baseline: &amp;QualitySuite, candidate: &amp;QualitySuite, policy: QualityPolicy, ) -&gt; Result&lt;QualityAssessment&gt; { |
| tests | module | 144 | no | mod tests { |
| suite | function | 146 | no | fn suite() -&gt; QualitySuite { |
| accuracy_regression_uses_canonical_comparison | function | 161 | no | fn accuracy_regression_uses_canonical_comparison() { |
| alias_learning_cannot_hide_safety_regression | function | 174 | no | fn alias_learning_cannot_hide_safety_regression() { |
| cohort_change_is_rejected | function | 188 | no | fn cohort_change_is_rejected() { |
| sparse_labels_do_not_claim_quality | function | 196 | no | fn sparse_labels_do_not_claim_quality() { |
| increased_abstention_detected_separately_from_accuracy | function | 207 | no | fn increased_abstention_detected_separately_from_accuracy() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{ | use | 3 | external |
| crate::{Error, Result} | use | 7 | external |
| super::* | use | 145 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 224 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
