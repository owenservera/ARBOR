# File: native/hqkg/src/observability/correlation.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/correlation.rs |
| Language | Rust |
| Kind | source |
| Size | 9032 B |
| Lines | 244 |
| Hash | acf8c0a748a3 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_SYMPTOMS | const | 7 | no | const MAX_SYMPTOMS: usize = 128; |
| MAX_VISITS | const | 8 | no | const MAX_VISITS: usize = 8_192; |
| SymptomKind | enum | 11 | yes | pub enum SymptomKind { |
| Symptom | struct | 18 | yes | pub struct Symptom { |
| CauseHypothesis | struct | 24 | yes | pub struct CauseHypothesis { |
| Acc | struct | 36 | no | struct Acc { |
| rank_causes | function | 48 | yes | pub fn rank_causes( graph: &amp;Graph, symptoms: &amp;[Symptom], max_depth: usize, max_candidates: usize, |
| tests | module | 175 | no | mod tests { |
| graph | function | 178 | no | fn graph() -&gt; Graph { |
| symptom | function | 192 | no | fn symptom(id: &amp;str, reference: &amp;str, kind: SymptomKind) -&gt; Symptom { |
| shared_dependency_ranks_as_hypothesis_not_causality | function | 200 | no | fn shared_dependency_ranks_as_hypothesis_not_causality() { |
| healthy_dependency_is_counterevidence | function | 213 | no | fn healthy_dependency_is_counterevidence() { |
| missing_graph_identity_is_explicit_error | function | 225 | no | fn missing_graph_identity_is_explicit_error() { |
| rank_is_stable_regardless_of_symptom_order | function | 235 | no | fn rank_is_stable_regardless_of_symptom_order() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::safe_id | use | 3 | external |
| crate::{Error, Graph, Result} | use | 4 | external |
| std::collections::{BTreeMap, BTreeSet, VecDeque} | use | 5 | external |
| super::* | use | 176 | external |
| crate::{Edge, Node, NodeKind} | use | 177 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Read-only dependency-based fault hypothesis ranking on the existing HQKG Graph.
//! An edge says "depends_on", not "this caused the failure". Never certifies causality.
use super::safe_id;
use crate::{Error, Graph, Result};
use std::collections::{BTreeMap, BTreeSet, VecDeque};

const MAX_SYMPTOMS: usize = 128;
const MAX_VISITS: usize = 8_192;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SymptomKind {
    ConfirmedFailure,
    SuspectedDegradation,
    VerifiedHealthy,
    InsufficientEvidence,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Symptom {
    pub subject: String,
    pub evidence_id: String,
    pub kind: SymptomKind,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CauseHypothesis {
    pub subject: String,
    /// The graph version that produced this read-only candidate.
    pub graph_epoch: u64,
    pub supporting_evidence: Vec<String>,
    pub opposing_evidence: Vec<String>,
    /// Deterministic diagnostic ranking ONLY. Not a calibrated probability.
    pub score: i32,
    pub shortest_dependency_distance: usize,
    pub directly_observed_failure: bool,
}
#[derive(Default)]
struct Acc {
    support: BTreeSet<String>,
    oppose: BTreeSet<String>,
    score: i32,
    distance: usize,
    direct: bool,
}

/// Uses only typed "depends_on" edges from the *existing* canonical graph.
/// Traverses from failing components to dependencies, not from arbitrary "related"
/// edges. Multiple failed dependents can suggest a shared cause, but no recommendation
/// is an authorization, and no unobserved candidate is claimed confirmed.
pub fn rank_causes(
    graph: &Graph,
    symptoms: &[Symptom],
    max_depth: usize,
    max_candidates: usize,
) -> Result<Vec<CauseHypothesis>> {
    if symptoms.len() > MAX_SYMPTOMS
        || max_depth == 0
        || max_depth > 6
        || max_candidates == 0
        || max_candidates > 128
    {
        return Err(Error::Invalid(
            "invalid diagnostic correlation bounds".into(),
        ));
    }
    let mut refs = BTreeSet::new();
    for symptom in symptoms {
        if !safe_id(&symptom.subject)
            || !safe_id(&symptom.evidence_id)
            || !refs.insert(symptom.evidence_id.as_str())
        {
            return Err(Error::Invalid(
                "invalid or duplicate diagnostic evidence id".into(),
            ));
        }
        if graph.node(&symptom.subject).is_none() {
            return Err(Error::Missing(format!(
                "unindexed diagnostic subject: {}",
                symptom.subject
            )));
        }
    }
```

_First 80 of 245 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
