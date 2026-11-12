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
    {
        return Err(Error::Invalid("invalid incident history or policy".into()));
    }
    let mut state = existing.clone();
    let mut transition = IncidentTransition::NoChange;
    let mut notification = NotificationAdvice::None;
    let confirmed_failure = finding.condition == Condition::Failed
        && finding.evidence_status == EvidenceStatus::Confirmed;
    let suspected_bad = finding.condition == Condition::Degraded
        && matches!(
            finding.evidence_status,
            EvidenceStatus::Suspected | EvidenceStatus::Confirmed
        );
    let confirmed_healthy = finding.condition == Condition::Healthy
        && finding.evidence_status == EvidenceStatus::Confirmed;
    if confirmed_failure || suspected_bad {
        state.bad_streak = state.bad_streak.saturating_add(1);
        state.healthy_streak = 0;
        if !state.open && (confirmed_failure || state.bad_streak >= policy.suspected_streak) {
            state.open = true;
            state.opened_ms = Some(now_ms);
            state.last_alert_ms = Some(now_ms);
            transition = IncidentTransition::Opened;
            notification = NotificationAdvice::Alert;
        } else if state.open {
            transition = IncidentTransition::StillOpen;
            if state.last_alert_ms.map_or(true, |last| {
                now_ms.saturating_sub(last) >= policy.reminder_cooldown_ms
            }) {
                state.last_alert_ms = Some(now_ms);
                notification = NotificationAdvice::Alert;
            }
        }
    } else if confirmed_healthy {
        state.healthy_streak = state.healthy_streak.saturating_add(1);
        state.bad_streak = 0;
        if state.open && state.healthy_streak >= policy.healthy_clear_streak {
            state.open = false;
            state.opened_ms = None;
            state.last_alert_ms = None;
            transition = IncidentTransition::Resolved;
            notification = NotificationAdvice::Resolution;
        }
    } else {
        // Insufficient or conflicting evidence freezes an open incident.
        // Never resolve an incident based on observer silence.
        transition = IncidentTransition::EvidenceGap;
        state.healthy_streak = 0;
        state.bad_streak = 0;
    }
    Ok(IncidentReduction {
        state,
        transition,
        notification,
    })
}

#[cfg(test)]
mod tests {
    use super::super::{finding, NextStep};
    use super::*;
    fn f(c: Condition, e: EvidenceStatus) -> DiagnosticFinding {
        finding(c, e, "fixture", &[], &[], NextStep::Observe)
    }
    #[test]
    fn suspected_spike_does_not_alert() {
        let start = IncidentState::initial("host").unwrap();
        let once = reduce_incident(
            &start,
            &f(Condition::Degraded, EvidenceStatus::Suspected),
            100,
            IncidentPolicy::default(),
        )
        .unwrap();
        assert!(!once.state.open);
        assert_eq!(once.notification, NotificationAdvice::None);
    }
    #[test]
    fn three_sustained_suspicions_open_one_incident() {
        let mut state = IncidentState::initial("host").unwrap();
        for now in [100, 200, 300] {
            let step = reduce_incident(
                &state,
                &f(Condition::Degraded, EvidenceStatus::Suspected),
                now,
                IncidentPolicy::default(),
            )
            .unwrap();
            state = step.state;
        }
        assert!(state.open);
        assert_eq!(state.opened_ms, Some(300));
        let next = reduce_incident(
            &state,
            &f(Condition::Degraded, EvidenceStatus::Suspected),
            310,
            IncidentPolicy::default(),
        )
        .unwrap();
        assert_eq!(next.notification, NotificationAdvice::None);
    }
    #[test]
    fn confirmed_failure_opens_immediately() {
        let initial = IncidentState::initial("browser").unwrap();
        let outcome = reduce_incident(
            &initial,
            &f(Condition::Failed, EvidenceStatus::Confirmed),
            10,
            IncidentPolicy::default(),
        )
        .unwrap();
        assert_eq!(outcome.transition, IncidentTransition::Opened);
    }
    #[test]
    fn unknown_never_closes_and_two_good_readings_resolve() {
        let start = reduce_incident(
            &IncidentState::initial("browser").unwrap(),
            &f(Condition::Failed, EvidenceStatus::Confirmed),
            10,
            IncidentPolicy::default(),
        )
        .unwrap()
        .state;
        let gap = reduce_incident(
            &start,
            &f(Condition::Unknown, EvidenceStatus::Insufficient),
            20,
            IncidentPolicy::default(),
        )
        .unwrap();
        assert!(gap.state.open);
        let a = reduce_incident(
            &gap.state,
            &f(Condition::Healthy, EvidenceStatus::Confirmed),
            30,
            IncidentPolicy::default(),
        )
        .unwrap();
        assert!(a.state.open);
        let b = reduce_incident(
            &a.state,
            &f(Condition::Healthy, EvidenceStatus::Confirmed),
            40,
            IncidentPolicy::default(),
        )
        .unwrap();
        assert_eq!(b.transition, IncidentTransition::Resolved);
        assert_eq!(b.notification, NotificationAdvice::Resolution);
    }
}
