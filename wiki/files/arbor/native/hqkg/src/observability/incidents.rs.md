# File: native/hqkg/src/observability/incidents.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/observability/incidents.rs |
| Language | Rust |
| Kind | source |
| Size | 7792 B |
| Lines | 230 |
| Hash | 7664ba59b4d5 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| IncidentPolicy | struct | 7 | yes | pub struct IncidentPolicy { |
| IncidentState | struct | 23 | yes | pub struct IncidentState { |
| initial | method | 32 | yes | pub fn initial(subject: &amp;str) -&gt; Result&lt;Self&gt; { |
| IncidentTransition | enum | 48 | yes | pub enum IncidentTransition { |
| NotificationAdvice | enum | 56 | yes | pub enum NotificationAdvice { |
| IncidentReduction | struct | 63 | yes | pub struct IncidentReduction { |
| reduce_incident | function | 70 | yes | pub fn reduce_incident( existing: &amp;IncidentState, finding: &amp;DiagnosticFinding, now_ms: u64, policy: IncidentPolicy, |
| tests | module | 139 | no | mod tests { |
| f | function | 142 | no | fn f(c: Condition, e: EvidenceStatus) -&gt; DiagnosticFinding { |
| suspected_spike_does_not_alert | function | 146 | no | fn suspected_spike_does_not_alert() { |
| three_sustained_suspicions_open_one_incident | function | 159 | no | fn three_sustained_suspicions_open_one_incident() { |
| confirmed_failure_opens_immediately | function | 183 | no | fn confirmed_failure_opens_immediately() { |
| unknown_never_closes_and_two_good_readings_resolve | function | 195 | no | fn unknown_never_closes_and_two_good_readings_resolve() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus} | use | 3 | external |
| crate::{Error, Result} | use | 4 | external |
| super::super::{finding, NextStep} | use | 140 | external |
| super::* | use | 141 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Pure incident hysteresis and de-duplication, without timers or alert delivery.
//! The owner runtime persists any desired state through its existing authority.
use super::{safe_id, Condition, DiagnosticFinding, EvidenceStatus};
use crate::{Error, Result};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct IncidentPolicy {
    pub suspected_streak: u8,
    pub healthy_clear_streak: u8,
    pub reminder_cooldown_ms: u64,
}
impl Default for IncidentPolicy {
    fn default() -> Self {
        Self {
            suspected_streak: 3,
            healthy_clear_streak: 2,
            reminder_cooldown_ms: 60_000,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IncidentState {
    pub subject: String,
    pub open: bool,
    pub bad_streak: u8,
    pub healthy_streak: u8,
    pub opened_ms: Option<u64>,
    pub last_alert_ms: Option<u64>,
}
impl IncidentState {
    pub fn initial(subject: &str) -> Result<Self> {
        if !safe_id(subject) {
            return Err(Error::Invalid("invalid incident subject".into()));
        }
        Ok(Self {
            subject: subject.into(),
            open: false,
            bad_streak: 0,
            healthy_streak: 0,
            opened_ms: None,
            last_alert_ms: None,
        })
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum IncidentTransition {
    NoChange,
    Opened,
    Resolved,
    EvidenceGap,
    StillOpen,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum NotificationAdvice {
    None,
    Alert,
    Resolution,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IncidentReduction {
    pub state: IncidentState,
    pub transition: IncidentTransition,
    /// Advisory only; does not emit a notification.
    pub notification: NotificationAdvice,
}

pub fn reduce_incident(
    existing: &IncidentState,
    finding: &DiagnosticFinding,
    now_ms: u64,
    policy: IncidentPolicy,
) -> Result<IncidentReduction> {
    if !safe_id(&existing.subject)
        || policy.suspected_streak == 0
        || policy.healthy_clear_streak == 0
        || existing.open && existing.opened_ms.map_or(true, |at| at > now_ms)
        || existing.last_alert_ms.map_or(false, |at| at > now_ms)
```

_First 80 of 231 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
