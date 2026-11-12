//! Whole-system health synthesis; no hidden score that masks unknown observers.
use super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus};
use crate::{Error, Result};
use std::collections::BTreeSet;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RequiredCapability {
    pub component: String,
    pub required: bool,
    pub finding: DiagnosticFinding,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SystemSynthesis {
    /// A known failure outranks gaps; a gap otherwise prevents a green verdict.
    pub condition: Condition,
    pub epistemic: EvidenceStatus,
    pub healthy: usize,
    pub degraded: usize,
    pub failed: usize,
    pub unknown: usize,
    pub expected_offline: usize,
    pub required_count: usize,
    pub observed_required_count: usize,
    pub blocking_components: Vec<String>,
}

/// Deterministic state composition over caller-provided component evidence.
/// \`Healthy\` applies only to the explicitly enumerated required components;
/// this type cannot prove that a missing component was included in the plan.
pub fn synthesize_system(components: &[RequiredCapability]) -> Result<SystemSynthesis> {
    if components.is_empty() || components.len() > 256 {
        return Err(Error::Invalid(
            "invalid required capability inventory".into(),
        ));
    }
    let mut seen = BTreeSet::new();
    for c in components {
        if !safe_id(&c.component) || !seen.insert(c.component.as_str()) {
            return Err(Error::Invalid(
                "duplicate or invalid component identity".into(),
            ));
        }
    }
    let mut state = SystemSynthesis {
        condition: Condition::Unknown,
        epistemic: EvidenceStatus::Insufficient,
        healthy: 0,
        degraded: 0,
        failed: 0,
        unknown: 0,
        expected_offline: 0,
        required_count: 0,
        observed_required_count: 0,
        blocking_components: Vec::new(),
    };
    let mut required_failed = false;
    let mut required_degraded = false;
    let mut required_unknown = false;
    let mut required_offline = false;
    let mut required_healthy = 0usize;
    for c in components {
        if c.required {
            state.required_count += 1;
        }
        let genuinely_known = matches!(c.finding.evidence_status, EvidenceStatus::Confirmed)
            && !matches!(c.finding.condition, Condition::Unknown);
        if c.required && genuinely_known {
            state.observed_required_count += 1;
        }
        match c.finding.condition {
            Condition::Healthy if genuinely_known => {
                state.healthy += 1;
                if c.required {
                    required_healthy += 1;
                }
            }
            Condition::Failed if genuinely_known => {
                state.failed += 1;
                if c.required {
                    required_failed = true;
                }
                state.blocking_components.push(c.component.clone());
            }
            Condition::Degraded => {
                state.degraded += 1;
                if c.required {
                    required_degraded = true;
                }
                state.blocking_components.push(c.component.clone());
            }
            Condition::ExpectedOffline if genuinely_known => {
                state.expected_offline += 1;
                if c.required {
                    required_offline = true;
                }
                state.blocking_components.push(c.component.clone());
            }
            _ => {
                state.unknown += 1;
                if c.required {
                    required_unknown = true;
                }
                state.blocking_components.push(c.component.clone());
            }
        }
    }
    if state.required_count == 0 {
        state.condition = Condition::Unknown;
        state.epistemic = EvidenceStatus::Insufficient;
    } else if required_failed {
        state.condition = Condition::Failed;
        state.epistemic = EvidenceStatus::Confirmed;
    } else if required_unknown {
        state.condition = Condition::Unknown;
        state.epistemic = EvidenceStatus::Insufficient;
    } else if required_degraded {
        state.condition = Condition::Degraded;
        state.epistemic = EvidenceStatus::Suspected;
    } else if required_offline {
        state.condition = Condition::ExpectedOffline;
        state.epistemic = EvidenceStatus::Confirmed;
    } else if required_healthy == state.required_count {
        state.condition = Condition::Healthy;
        state.epistemic = EvidenceStatus::Confirmed;
    }
    Ok(state)
}

#[cfg(test)]
mod tests {
    use super::super::{finding, NextStep};
    use super::*;
    fn cap(
        name: &str,
        required: bool,
        condition: Condition,
        evidence: EvidenceStatus,
    ) -> RequiredCapability {
        RequiredCapability {
            component: name.into(),
            required,
            finding: finding(
                condition,
                evidence,
                "component_test",
                &[],
                &[],
                NextStep::Observe,
            ),
        }
    }
    #[test]
    fn missing_required_browser_observation_prevents_green_host() {
        let result = synthesize_system(&[
            cap("host", true, Condition::Healthy, EvidenceStatus::Confirmed),
            cap(
                "browser",
                true,
                Condition::Unknown,
                EvidenceStatus::Insufficient,
            ),
        ])
        .unwrap();
        assert_eq!(result.condition, Condition::Unknown);
        assert_eq!(result.observed_required_count, 1);
    }
    #[test]
    fn confirmed_failure_is_visible_even_if_other_evidence_missing() {
        let result = synthesize_system(&[
            cap("host", true, Condition::Failed, EvidenceStatus::Confirmed),
            cap(
                "android",
                true,
                Condition::Unknown,
                EvidenceStatus::Insufficient,
            ),
        ])
        .unwrap();
        assert_eq!(result.condition, Condition::Failed);
    }
    #[test]
    fn suspected_green_does_not_count_as_healthy() {
        let result = synthesize_system(&[cap(
            "host",
            true,
            Condition::Healthy,
            EvidenceStatus::Suspected,
        )])
        .unwrap();
        assert_eq!(result.condition, Condition::Unknown);
    }
    #[test]
    fn healthy_requires_explicit_complete_required_inventory() {
        let result = synthesize_system(&[
            cap("host", true, Condition::Healthy, EvidenceStatus::Confirmed),
            cap(
                "android",
                false,
                Condition::Unknown,
                EvidenceStatus::Insufficient,
            ),
        ])
        .unwrap();
        assert_eq!(result.condition, Condition::Healthy);
        assert_eq!(result.unknown, 1);
    }
    #[test]
    fn no_required_components_cannot_be_green() {
        assert_eq!(
            synthesize_system(&[cap(
                "unused",
                false,
                Condition::Healthy,
                EvidenceStatus::Confirmed
            )])
            .unwrap()
            .condition,
            Condition::Unknown
        );
    }
}
