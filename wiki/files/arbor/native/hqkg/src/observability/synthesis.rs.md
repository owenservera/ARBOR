# File: native/hqkg/src/observability/synthesis.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/synthesis.rs |
| Language | Rust |
| Kind | source |
| Size | 7543 B |
| Lines | 222 |
| Hash | bc248b89d33e |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RequiredCapability | struct | 7 | yes | pub struct RequiredCapability { |
| SystemSynthesis | struct | 14 | yes | pub struct SystemSynthesis { |
| synthesize_system | function | 31 | yes | pub fn synthesize_system(components: &amp;[RequiredCapability]) -&gt; Result&lt;SystemSynthesis&gt; { |
| tests | module | 131 | no | mod tests { |
| cap | function | 134 | no | fn cap( name: &amp;str, required: bool, condition: Condition, evidence: EvidenceStatus, |
| missing_required_browser_observation_prevents_green_host | function | 154 | no | fn missing_required_browser_observation_prevents_green_host() { |
| confirmed_failure_is_visible_even_if_other_evidence_missing | function | 169 | no | fn confirmed_failure_is_visible_even_if_other_evidence_missing() { |
| suspected_green_does_not_count_as_healthy | function | 183 | no | fn suspected_green_does_not_count_as_healthy() { |
| healthy_requires_explicit_complete_required_inventory | function | 194 | no | fn healthy_requires_explicit_complete_required_inventory() { |
| no_required_components_cannot_be_green | function | 209 | no | fn no_required_components_cannot_be_green() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus} | use | 2 | external |
| crate::{Error, Result} | use | 3 | external |
| std::collections::BTreeSet | use | 4 | external |
| super::super::{finding, NextStep} | use | 132 | external |
| super::* | use | 133 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 223 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
