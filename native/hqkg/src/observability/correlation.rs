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
    let mut candidates: BTreeMap<String, Acc> = BTreeMap::new();
    let mut visits = 0usize;
    for symptom in symptoms {
        if symptom.kind == SymptomKind::InsufficientEvidence {
            continue;
        }
        let mut work = VecDeque::from([(symptom.subject.clone(), 0usize)]);
        let mut seen = BTreeSet::new();
        while let Some((node, depth)) = work.pop_front() {
            if !seen.insert(node.clone()) {
                continue;
            }
            visits += 1;
            if visits > MAX_VISITS {
                return Err(Error::Invalid(
                    "diagnostic graph traversal exceeds budget".into(),
                ));
            }
            let entry = candidates.entry(node.clone()).or_insert_with(|| Acc {
                distance: depth,
                ..Acc::default()
            });
            entry.distance = entry.distance.min(depth);
            match symptom.kind {
                SymptomKind::ConfirmedFailure => {
                    // Direct evidence ranks highly; two independent failing dependents
                    // can rank a common dependency above either leaf.
                    entry.score = entry.score.saturating_add(if depth == 0 {
                        75
                    } else {
                        65 / (depth as i32)
                    });
                    entry.support.insert(symptom.evidence_id.clone());
                    if depth == 0 {
                        entry.direct = true;
                    }
                }
                SymptomKind::SuspectedDegradation => {
                    entry.score = entry.score.saturating_add(if depth == 0 {
                        30
                    } else {
                        18 / (depth as i32)
                    });
                    entry.support.insert(symptom.evidence_id.clone());
                }
                SymptomKind::VerifiedHealthy => {
                    // A healthy dependency is counterevidence, not absolute proof
                    // that the dependency cannot have an intermittent defect.
                    entry.score = entry.score.saturating_sub(if depth == 0 {
                        100
                    } else {
                        30 / (depth as i32)
                    });
                    entry.oppose.insert(symptom.evidence_id.clone());
                }
                SymptomKind::InsufficientEvidence => {}
            }
            if depth < max_depth {
                for edge in graph.outgoing(&node, Some("depends_on"))? {
                    if edge.to != node && !seen.contains(&edge.to) {
                        work.push_back((edge.to.clone(), depth + 1));
                    }
                }
            }
        }
    }
    let mut ranked = candidates
        .into_iter()
        .filter(|(_, c)| !c.support.is_empty())
        .map(|(subject, acc)| CauseHypothesis {
            subject,
            graph_epoch: graph.epoch(),
            supporting_evidence: acc.support.into_iter().collect(),
            opposing_evidence: acc.oppose.into_iter().collect(),
            score: acc.score,
            shortest_dependency_distance: acc.distance,
            directly_observed_failure: acc.direct,
        })
        .collect::<Vec<_>>();
    ranked.sort_by(|a, b| {
        b.score
            .cmp(&a.score)
            .then(
                b.supporting_evidence
                    .len()
                    .cmp(&a.supporting_evidence.len()),
            )
            .then(a.subject.cmp(&b.subject))
    });
    ranked.truncate(max_candidates);
    Ok(ranked)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Edge, Node, NodeKind};
    fn graph() -> Graph {
        let mut g = Graph::new();
        for id in ["phone", "world", "transport", "provider"] {
            g.put_node(Node::new(id, NodeKind::Other("component".into()), id))
                .unwrap();
        }
        g.put_edge(Edge::new("d1", "phone", "depends_on", "transport"))
            .unwrap();
        g.put_edge(Edge::new("d2", "world", "depends_on", "transport"))
            .unwrap();
        g.put_edge(Edge::new("unrelated", "phone", "mentions", "provider"))
            .unwrap();
        g
    }
    fn symptom(id: &str, reference: &str, kind: SymptomKind) -> Symptom {
        Symptom {
            subject: id.into(),
            evidence_id: reference.into(),
            kind,
        }
    }
    #[test]
    fn shared_dependency_ranks_as_hypothesis_not_causality() {
        let g = graph();
        let symptoms = [
            symptom("phone", "e-phone", SymptomKind::ConfirmedFailure),
            symptom("world", "e-world", SymptomKind::ConfirmedFailure),
        ];
        let out = rank_causes(&g, &symptoms, 3, 8).unwrap();
        assert_eq!(out[0].subject, "transport");
        assert_eq!(out[0].supporting_evidence.len(), 2);
        assert!(!out[0].directly_observed_failure);
        assert!(!out.iter().any(|n| n.subject == "provider"));
    }
    #[test]
    fn healthy_dependency_is_counterevidence() {
        let g = graph();
        let symptoms = [
            symptom("phone", "failure1", SymptomKind::ConfirmedFailure),
            symptom("transport", "healthy1", SymptomKind::VerifiedHealthy),
        ];
        let out = rank_causes(&g, &symptoms, 2, 8).unwrap();
        let transport = out.iter().find(|x| x.subject == "transport").unwrap();
        assert_eq!(transport.opposing_evidence, vec!["healthy1".to_string()]);
        assert!(transport.score < out[0].score);
    }
    #[test]
    fn missing_graph_identity_is_explicit_error() {
        assert!(rank_causes(
            &graph(),
            &[symptom("unknown", "f1", SymptomKind::ConfirmedFailure)],
            3,
            8
        )
        .is_err());
    }
    #[test]
    fn rank_is_stable_regardless_of_symptom_order() {
        let g = graph();
        let a = symptom("phone", "p", SymptomKind::ConfirmedFailure);
        let b = symptom("world", "w", SymptomKind::ConfirmedFailure);
        assert_eq!(
            rank_causes(&g, &[a.clone(), b.clone()], 3, 8).unwrap(),
            rank_causes(&g, &[b, a], 3, 8).unwrap()
        );
    }
}
