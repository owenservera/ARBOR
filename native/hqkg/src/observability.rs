//! Lane C: native, std-only, effect-free diagnostic reasoning inside HQKG.
//! This is not an observer daemon, telemetry writer, recovery executor, or Host status API.
//! Trusted host-side adapters retain authorization and source-verification responsibilities.
//! A hash, an ID or a reported grade alone does not authenticate a device or provider event.
use crate::control::{HealthMonitor, HealthStatus, Telemetry};
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};

pub mod admission;
pub mod correlation;
pub mod drift;
pub mod effects;
pub mod forecast;
pub mod incidents;
pub mod journey;
pub mod observer;
pub mod quality;
pub mod recovery;
pub mod synthesis;

pub const CONTRACT: &str = "vivim.rust-observability/1";
const MAX_EVENTS: usize = 4_096;
const MAX_EVIDENCE_REFS: usize = 16;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum EvidenceGrade {
    UntrustedHint,
    LocalMeasured,
    SourceVerified,
    IndependentVerified,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum CommandStage {
    Accepted,
    Authorized,
    SendObserved,
    ReplyObserved,
    PhoneDisplayed,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Signal {
    Command(CommandStage),
    ExplicitFailure,
    ObserverAvailable,
    ObserverUnavailable,
    ExpectedOffline,
    WorldHead(u64),
    DeviceHead(u64),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Observation {
    pub evidence_id: String,
    pub subject: String,
    pub producer: String,
    pub producer_epoch: String,
    pub producer_sequence: u64,
    /// Milliseconds on the same clock supplied to diagnose().
    pub observed_ms: u64,
    /// Asserted by an already trusted adapter; NOT self-asserted by a browser or phone.
    pub grade: EvidenceGrade,
    pub signal: Signal,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ExpectationKind {
    Command(CommandStage),
    RevisionParity,
    ObserverLive,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Expectation {
    pub subject: String,
    pub kind: ExpectationKind,
    pub deadline_ms: u64,
    pub freshness_ms: u64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Condition {
    Healthy,
    Degraded,
    Failed,
    ExpectedOffline,
    Unknown,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EvidenceStatus {
    Confirmed,
    Suspected,
    Pending,
    Insufficient,
    Conflicting,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum NextStep {
    Observe,
    VerifyReadOnly,
    OperatorReview,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DiagnosticFinding {
    pub condition: Condition,
    pub evidence_status: EvidenceStatus,
    pub code: &'static str,
    pub evidence_ids: Vec<String>,
    pub missing: Vec<&'static str>,
    /// A suggestion, not permission to execute anything.
    pub next_step: NextStep,
}

fn finding(
    condition: Condition,
    evidence_status: EvidenceStatus,
    code: &'static str,
    ids: &[&str],
    missing: &[&'static str],
    next_step: NextStep,
) -> DiagnosticFinding {
    DiagnosticFinding {
        condition,
        evidence_status,
        code,
        evidence_ids: ids
            .iter()
            .take(MAX_EVIDENCE_REFS)
            .map(|id| (*id).to_string())
            .collect(),
        missing: missing.to_vec(),
        next_step,
    }
}

fn safe_id(v: &str) -> bool {
    !v.is_empty()
        && v.len() <= 128
        && v.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}
fn fresh(at: u64, now: u64, max_age: u64) -> bool {
    at <= now && now - at <= max_age
}

/// Pure, deterministic evaluation of caller-verified evidence. No I/O, timers,
/// process control, network calls, browser effects or durable independent ledger.
/// Missing/expired evidence is NEVER promoted to confirmed failure.
pub fn diagnose(
    exp: &Expectation,
    input: &[Observation],
    now_ms: u64,
) -> Result<DiagnosticFinding> {
    if !safe_id(&exp.subject)
        || exp.freshness_ms == 0
        || exp.freshness_ms > 86_400_000
        || input.len() > MAX_EVENTS
    {
        return Err(Error::Invalid(
            "invalid diagnostic expectation or input budget".into(),
        ));
    }
    let mut seen_ids = BTreeSet::new();
    let mut streams: BTreeMap<(&str, &str), u64> = BTreeMap::new();
    let mut epochs: BTreeMap<&str, &str> = BTreeMap::new();
    let mut stream_gap = false;
    let mut epoch_changed = false;
    let mut records = Vec::new();
    for observation in input {
        if !safe_id(&observation.evidence_id)
            || !safe_id(&observation.subject)
            || !safe_id(&observation.producer)
            || !safe_id(&observation.producer_epoch)
            || observation.producer_sequence == 0
            || observation.observed_ms > now_ms.saturating_add(2_000)
            || !seen_ids.insert(observation.evidence_id.as_str())
        {
            return Err(Error::Invalid(
                "invalid, duplicated or future diagnostic observation".into(),
            ));
        }
        let key = (
            observation.producer.as_str(),
            observation.producer_epoch.as_str(),
        );
        if observation.subject == exp.subject {
            if let Some(previous_epoch) = epochs.insert(
                observation.producer.as_str(),
                observation.producer_epoch.as_str(),
            ) {
                if previous_epoch != observation.producer_epoch.as_str() {
                    epoch_changed = true;
                }
            }
        }
        if let Some(previous) = streams.insert(key, observation.producer_sequence) {
            if observation.producer_sequence <= previous {
                return Err(Error::Conflict(
                    "duplicate or reordered producer sequence".into(),
                ));
            }
            if observation.producer_sequence > previous.saturating_add(1)
                && observation.subject == exp.subject
            {
                stream_gap = true;
            }
        }
        if observation.subject == exp.subject
            && observation.grade >= EvidenceGrade::SourceVerified
            && fresh(observation.observed_ms, now_ms, exp.freshness_ms)
        {
            records.push(observation);
        }
    }
    records.sort_by(|a, b| {
        a.observed_ms
            .cmp(&b.observed_ms)
            .then(a.producer_sequence.cmp(&b.producer_sequence))
            .then(a.evidence_id.cmp(&b.evidence_id))
    });
    if stream_gap {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "producer_sequence_gap",
            &[],
            &["missing_producer_evidence"],
            NextStep::VerifyReadOnly,
        ));
    }
    if epoch_changed {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "producer_epoch_transition",
            &[],
            &["verified_epoch_reconciliation"],
            NextStep::VerifyReadOnly,
        ));
    }

    // Detect stage regression within a single authoritative producer stream.
    // Cross-producer event clocks may differ; a phone ACK and journal reply
    // observed at the same instant must not be treated as backward progress.
    let mut stream_stages = records.clone();
    stream_stages.sort_by(|a, b| {
        a.producer
            .cmp(&b.producer)
            .then(a.producer_epoch.cmp(&b.producer_epoch))
            .then(a.producer_sequence.cmp(&b.producer_sequence))
    });
    let mut prior_stages: BTreeMap<(&str, &str), CommandStage> = BTreeMap::new();
    let mut stage_regression = false;
    for record in stream_stages {
        if let Signal::Command(stage) = record.signal {
            if let Some(previous) = prior_stages.insert(
                (record.producer.as_str(), record.producer_epoch.as_str()),
                stage,
            ) {
                if stage < previous {
                    stage_regression = true;
                }
            }
        }
    }
    let mut last_stage: Option<(CommandStage, &str, u64)> = None;
    let mut revision_regression = false;
    let mut failure: Option<(&str, u64)> = None;
    let mut observer_ok: Option<(&str, u64)> = None;
    let mut observer_lost: Option<(&str, u64)> = None;
    let mut offline: Option<(&str, u64)> = None;
    let mut world: Option<(u64, &str, u64)> = None;
    let mut device: Option<(u64, &str, u64)> = None;
    for record in records {
        let id = record.evidence_id.as_str();
        match record.signal {
            Signal::Command(stage) => {
                if last_stage.map_or(true, |(previous, _, _)| stage >= previous) {
                    last_stage = Some((stage, id, record.observed_ms));
                }
            }
            Signal::ExplicitFailure => failure = Some((id, record.observed_ms)),
            Signal::ObserverAvailable => observer_ok = Some((id, record.observed_ms)),
            Signal::ObserverUnavailable => observer_lost = Some((id, record.observed_ms)),
            Signal::ExpectedOffline => offline = Some((id, record.observed_ms)),
            Signal::WorldHead(revision) => {
                if world.map_or(false, |(previous, _, _)| revision < previous) {
                    revision_regression = true;
                }
                world = Some((revision, id, record.observed_ms));
            }
            Signal::DeviceHead(revision) => {
                if device.map_or(false, |(previous, _, _)| revision < previous) {
                    revision_regression = true;
                }
                device = Some((revision, id, record.observed_ms));
            }
        }
    }
    let last_ok = last_stage
        .map(|(_, _, at)| at)
        .unwrap_or(0)
        .max(observer_ok.map(|(_, at)| at).unwrap_or(0))
        .max(world.map(|(_, _, at)| at).unwrap_or(0))
        .max(device.map(|(_, _, at)| at).unwrap_or(0));
    if stage_regression && failure.is_none() {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Conflicting,
            "command_stage_regression",
            &[],
            &["authoritative_reconciliation"],
            NextStep::OperatorReview,
        ));
    }
    if revision_regression && failure.is_none() {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Conflicting,
            "revision_head_regression",
            &[],
            &["authoritative_revision_reconciliation"],
            NextStep::OperatorReview,
        ));
    }
    if let Some((id, at)) = offline {
        if failure.is_none() && at >= last_ok {
            return Ok(finding(
                Condition::ExpectedOffline,
                EvidenceStatus::Confirmed,
                "authorized_offline",
                &[id],
                &[],
                NextStep::Observe,
            ));
        }
    }
    if let Some((id, at)) = observer_lost {
        if failure.is_none() && at >= last_ok {
            return Ok(finding(
                Condition::Unknown,
                EvidenceStatus::Insufficient,
                "observer_unavailable",
                &[id],
                &["fresh_authoritative_observation"],
                NextStep::VerifyReadOnly,
            ));
        }
    }
    match exp.kind {
        ExpectationKind::Command(required) => {
            let met = last_stage.filter(|(stage, _, _)| *stage >= required);
            if let (Some((_, ok_id, _)), Some((failed, _))) = (met, failure) {
                return Ok(finding(
                    Condition::Unknown,
                    EvidenceStatus::Conflicting,
                    "contradictory_command_evidence",
                    &[ok_id, failed],
                    &["authoritative_reconciliation"],
                    NextStep::OperatorReview,
                ));
            }
            if let Some((id, _)) = failure {
                return Ok(finding(
                    Condition::Failed,
                    EvidenceStatus::Confirmed,
                    "verified_command_failure",
                    &[id],
                    &[],
                    NextStep::OperatorReview,
                ));
            }
            if let Some((_, id, _)) = met {
                return Ok(finding(
                    Condition::Healthy,
                    EvidenceStatus::Confirmed,
                    "required_command_stage_observed",
                    &[id],
                    &[],
                    NextStep::Observe,
                ));
            }
            let pending = now_ms <= exp.deadline_ms;
            Ok(finding(
                Condition::Unknown,
                if pending {
                    EvidenceStatus::Pending
                } else {
                    EvidenceStatus::Insufficient
                },
                if pending {
                    "command_in_flight"
                } else {
                    "command_outcome_unverified"
                },
                &[],
                &["verified_required_command_stage"],
                NextStep::VerifyReadOnly,
            ))
        }
        ExpectationKind::RevisionParity => match (world, device) {
            (Some((_, h, ht)), Some((_, p, pt))) if ht.abs_diff(pt) > 2_000 => Ok(finding(
                Condition::Unknown,
                EvidenceStatus::Insufficient,
                "revision_watermarks_not_coobserved",
                &[h, p],
                &["coobserved_authoritative_watermarks"],
                NextStep::VerifyReadOnly,
            )),
            (Some((host, h, _)), Some((phone, p, _))) if host == phone => Ok(finding(
                Condition::Healthy,
                EvidenceStatus::Confirmed,
                "revision_parity_verified",
                &[h, p],
                &[],
                NextStep::Observe,
            )),
            (Some((_, h, _)), Some((_, p, _))) => Ok(finding(
                Condition::Degraded,
                EvidenceStatus::Suspected,
                "revision_drift_suspected",
                &[h, p],
                &["fresh_authorized_resnapshot"],
                NextStep::VerifyReadOnly,
            )),
            _ => Ok(finding(
                Condition::Unknown,
                EvidenceStatus::Insufficient,
                "revision_evidence_incomplete",
                &[],
                &["world_head", "device_head"],
                NextStep::VerifyReadOnly,
            )),
        },
        ExpectationKind::ObserverLive => {
            if let Some((id, _)) = failure {
                return Ok(finding(
                    Condition::Failed,
                    EvidenceStatus::Confirmed,
                    "verified_observer_failure",
                    &[id],
                    &[],
                    NextStep::OperatorReview,
                ));
            }
            if let Some((id, _)) = observer_ok {
                Ok(finding(
                    Condition::Healthy,
                    EvidenceStatus::Confirmed,
                    "observer_recently_available",
                    &[id],
                    &[],
                    NextStep::Observe,
                ))
            } else {
                Ok(finding(
                    Condition::Unknown,
                    EvidenceStatus::Insufficient,
                    "observer_not_verified",
                    &[],
                    &["fresh_observer_probe"],
                    NextStep::VerifyReadOnly,
                ))
            }
        }
    }
}

/// Reuses HQKG's existing bounded telemetry; no second collector or event store.
/// This only evaluates the named metric window, never global system health.
pub fn diagnose_metric_window(
    telemetry: &Telemetry,
    slot: &str,
    minimum_samples: usize,
    latency_budget_ms: u128,
) -> Result<DiagnosticFinding> {
    if !safe_id(slot) || !(1..=100_000).contains(&minimum_samples) || latency_budget_ms == 0 {
        return Err(Error::Invalid(
            "invalid metric diagnostic parameters".into(),
        ));
    }
    if telemetry.dropped() > 0 {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "metric_window_dropped_events",
            &[],
            &["complete_metric_window"],
            NextStep::VerifyReadOnly,
        ));
    }
    let sample = telemetry.summary(slot);
    if sample.count < minimum_samples {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "metric_window_under_sampled",
            &[],
            &["minimum_metric_samples"],
            NextStep::Observe,
        ));
    }
    if sample.errors > 0 || sample.p95_ms > latency_budget_ms {
        return Ok(finding(
            Condition::Degraded,
            EvidenceStatus::Suspected,
            "metric_window_anomaly",
            &[],
            &["independent_failure_confirmation"],
            NextStep::VerifyReadOnly,
        ));
    }
    Ok(finding(
        Condition::Healthy,
        EvidenceStatus::Confirmed,
        "metric_window_within_budget",
        &[],
        &[],
        NextStep::Observe,
    ))
}

/// A cursor into the ALREADY EXISTING in-memory HQKG telemetry ring.
/// Window completeness is determined from retained sequence coverage, not
/// lifetime drop counts (which can increase even while new windows are complete).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct MetricCursor {
    pub after_sequence: u64,
}
impl MetricCursor {
    pub fn at_current(telemetry: &Telemetry) -> Self {
        Self {
            after_sequence: telemetry.sequence(),
        }
    }
}

/// Prefer this to diagnosing all historical telemetry if the Host is measuring
/// a bounded current operation window. No extra collector or persistent storage.
pub fn diagnose_metric_window_since(
    telemetry: &Telemetry,
    slot: &str,
    cursor: MetricCursor,
    minimum_samples: usize,
    latency_budget_ms: u128,
) -> Result<DiagnosticFinding> {
    if !safe_id(slot) || !(1..=100_000).contains(&minimum_samples) || latency_budget_ms == 0 {
        return Err(Error::Invalid("invalid metric cursor diagnostic".into()));
    }
    if cursor.after_sequence > telemetry.sequence() {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "metric_source_epoch_reset",
            &[],
            &["fresh_metric_cursor"],
            NextStep::VerifyReadOnly,
        ));
    }
    if telemetry.events().next().map_or(false, |first| {
        first.sequence > cursor.after_sequence.saturating_add(1)
    }) {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "metric_cursor_overrun",
            &[],
            &["complete_recent_metric_window"],
            NextStep::VerifyReadOnly,
        ));
    }
    let mut values = telemetry
        .events()
        .filter(|e| e.sequence > cursor.after_sequence && e.slot == slot)
        .collect::<Vec<_>>();
    let count = values.len();
    if count < minimum_samples {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "metric_cursor_under_sampled",
            &[],
            &["more_source_measurements"],
            NextStep::Observe,
        ));
    }
    let bad = values
        .iter()
        .any(|e| e.outcome != crate::control::Outcome::Success);
    values.sort_by_key(|e| e.elapsed_ms);
    let p95 = values[((count - 1) * 95) / 100].elapsed_ms;
    if bad || p95 > latency_budget_ms {
        return Ok(finding(
            Condition::Degraded,
            EvidenceStatus::Suspected,
            "recent_metric_anomaly",
            &[],
            &["independent_failure_confirmation"],
            NextStep::VerifyReadOnly,
        ));
    }
    Ok(finding(
        Condition::Healthy,
        EvidenceStatus::Confirmed,
        "recent_metric_window_within_budget",
        &[],
        &[],
        NextStep::Observe,
    ))
}

/// A fixed, labeled golden-corpus window supplied by Lane A or B.
/// Only aggregate integers enter the core; prompts and responses do not.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct QualityWindow {
    pub corpus_revision: String,
    pub intelligence_revision: String,
    pub trials: u32,
    pub correct: u32,
}

pub fn diagnose_quality(
    baseline: &QualityWindow,
    candidate: &QualityWindow,
    minimum_trials: u32,
    permitted_drop_bps: u32,
) -> Result<DiagnosticFinding> {
    if !safe_id(&baseline.corpus_revision)
        || !safe_id(&candidate.corpus_revision)
        || !safe_id(&baseline.intelligence_revision)
        || !safe_id(&candidate.intelligence_revision)
        || baseline.corpus_revision != candidate.corpus_revision
        || baseline.correct > baseline.trials
        || candidate.correct > candidate.trials
        || minimum_trials == 0
        || permitted_drop_bps > 10_000
    {
        return Err(Error::Invalid(
            "invalid quality comparison or mismatched golden corpus".into(),
        ));
    }
    if baseline.trials < minimum_trials || candidate.trials < minimum_trials {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "quality_evaluation_insufficient",
            &[],
            &["matched_labeled_trials"],
            NextStep::Observe,
        ));
    }
    let a = u64::from(baseline.correct) * 10_000 / u64::from(baseline.trials);
    let b = u64::from(candidate.correct) * 10_000 / u64::from(candidate.trials);
    if a.saturating_sub(b) > u64::from(permitted_drop_bps) {
        return Ok(finding(
            Condition::Degraded,
            EvidenceStatus::Suspected,
            "intelligence_quality_regression",
            &[],
            &["independent_regression_confirmation"],
            NextStep::OperatorReview,
        ));
    }
    Ok(finding(
        Condition::Healthy,
        EvidenceStatus::Confirmed,
        "labeled_quality_window_within_tolerance",
        &[],
        &[],
        NextStep::Observe,
    ))
}

/// Existing core HealthMonitor has Ready as its default for unseen slots.
/// An explicit observed flag prevents that default from becoming false health evidence.
pub fn diagnose_core_health(
    monitor: &HealthMonitor,
    slot: &str,
    was_observed: bool,
) -> Result<DiagnosticFinding> {
    if !safe_id(slot) {
        return Err(Error::Invalid("invalid health slot".into()));
    }
    if !was_observed {
        return Ok(finding(
            Condition::Unknown,
            EvidenceStatus::Insufficient,
            "core_health_unobserved",
            &[],
            &["measured_health_source"],
            NextStep::VerifyReadOnly,
        ));
    }
    Ok(match monitor.state(slot).status {
        HealthStatus::Ready => finding(
            Condition::Healthy,
            EvidenceStatus::Confirmed,
            "core_reported_ready",
            &[],
            &[],
            NextStep::Observe,
        ),
        HealthStatus::Degraded => finding(
            Condition::Degraded,
            EvidenceStatus::Confirmed,
            "core_reported_degraded",
            &[],
            &[],
            NextStep::VerifyReadOnly,
        ),
        HealthStatus::Quarantined => finding(
            Condition::Failed,
            EvidenceStatus::Confirmed,
            "core_quarantined",
            &[],
            &[],
            NextStep::OperatorReview,
        ),
    })
}

/// Additive causal contract. Existing diagnostic and exchange contracts are unchanged.
pub const CAUSAL_CONTRACT: &str = "vivim.rust-causal-attribution/1";
const MAX_HYPOTHESES: usize = 128;
const MAX_PREDICTIONS: usize = 32;

/// A caller-proposed explanation, scoped to a workflow and a pinned revision.
/// Predictions use canonical `diagnose` finding codes, not raw signal names.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Hypothesis {
    pub id: &'static str,
    pub subject: String,
    pub revision: String,
    pub explains: Vec<&'static str>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Discrimination {
    pub discriminators: Vec<String>,
    pub supports: Vec<(String, &'static str)>,
}

fn canonical_diagnostic_code(code: &str) -> bool {
    matches!(
        code,
        "producer_sequence_gap"
            | "producer_epoch_transition"
            | "command_stage_regression"
            | "revision_head_regression"
            | "authorized_offline"
            | "observer_unavailable"
            | "contradictory_command_evidence"
            | "verified_command_failure"
            | "required_command_stage_observed"
            | "command_in_flight"
            | "command_outcome_unverified"
            | "revision_watermarks_not_coobserved"
            | "revision_parity_verified"
            | "revision_drift_suspected"
            | "revision_evidence_incomplete"
            | "verified_observer_failure"
            | "observer_recently_available"
            | "observer_not_verified"
    )
}

fn validate_hypotheses<'a>(
    exp: &Expectation,
    hypotheses: impl IntoIterator<Item = &'a Hypothesis>,
) -> Result<()> {
    let mut ids = BTreeSet::new();
    for (index, hypothesis) in hypotheses.into_iter().enumerate() {
        if index >= MAX_HYPOTHESES {
            return Err(Error::Invalid("causal hypothesis budget exceeded".into()));
        }
        if !safe_id(hypothesis.id)
            || hypothesis.subject != exp.subject
            || !safe_id(&hypothesis.revision)
            || !ids.insert(hypothesis.id)
            || hypothesis.explains.len() > MAX_PREDICTIONS
            || hypothesis
                .explains
                .iter()
                .any(|code| !canonical_diagnostic_code(code))
        {
            return Err(Error::Invalid(
                "invalid, duplicate or unscoped causal hypothesis".into(),
            ));
        }
    }
    Ok(())
}

fn validate_causal_observations(
    exp: &Expectation,
    input: &[Observation],
    now_ms: u64,
) -> Result<DiagnosticFinding> {
    // Preserve the single evaluator's bounds, IDs, sequence/epoch checks and clock rules.
    let diagnostic = diagnose(exp, input, now_ms)?;
    if input
        .iter()
        .any(|observation| observation.subject != exp.subject)
    {
        return Err(Error::Invalid(
            "causal evidence belongs to another subject".into(),
        ));
    }
    Ok(diagnostic)
}

/// Bounded read-only discrimination. Only fresh caller-verified observations count.
/// Each observation is evaluated by `diagnose` in the same expectation context;
/// aggregate regressions/conflicts remain the responsibility of `diagnose`.
/// Results are sorted by evidence ID, independent of valid cross-producer ordering.
pub fn discriminate_evidence(
    a: &Hypothesis,
    b: &Hypothesis,
    exp: &Expectation,
    input: &[Observation],
    now_ms: u64,
) -> Result<Discrimination> {
    validate_hypotheses(exp, [a, b])?;
    validate_causal_observations(exp, input, now_ms)?;
    let mut supports = BTreeMap::new();
    for observation in input {
        if observation.grade < EvidenceGrade::SourceVerified
            || !fresh(observation.observed_ms, now_ms, exp.freshness_ms)
        {
            continue;
        }
        let diagnostic = diagnose(exp, std::slice::from_ref(observation), now_ms)?;
        // An observation that contributes no evidence cannot discriminate.
        if !diagnostic.evidence_ids.contains(&observation.evidence_id) {
            continue;
        }
        match (
            a.explains.contains(&diagnostic.code),
            b.explains.contains(&diagnostic.code),
        ) {
            (true, false) => {
                supports.insert(observation.evidence_id.clone(), a.id);
            }
            (false, true) => {
                supports.insert(observation.evidence_id.clone(), b.id);
            }
            _ => {}
        }
    }
    if supports.len() > MAX_EVIDENCE_REFS {
        return Err(Error::Invalid(
            "causal discriminator reference budget exceeded".into(),
        ));
    }
    Ok(Discrimination {
        discriminators: supports.keys().cloned().collect(),
        supports: supports.into_iter().collect(),
    })
}

/// Trusted-adapter attestation of an independently verified controlled intervention.
/// The adapter must authenticate the producer and experiment, including reproduction
/// at `revision` and recovery after reverting to `baseline_revision`. These fields,
/// grades and IDs do NOT authenticate themselves. Mere temporal/dependency linkage
/// must never be encoded as this evidence. The kernel performs no experiment/effect.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CausalLink {
    pub evidence_id: String,
    pub hypothesis_id: &'static str,
    pub revision: String,
    pub baseline_revision: String,
    pub symptom_id: String,
    pub producer: String,
    pub producer_epoch: String,
    pub observed_ms: u64,
    pub grade: EvidenceGrade,
    pub reproduced_on_candidate: bool,
    pub recovered_on_revert: bool,
}

/// Constructed only for a confirmed failed diagnostic with unique supported causality.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RootCause {
    pub code: &'static str,
    pub condition: Condition,
    pub evidence_status: EvidenceStatus,
    pub evidence_ids: Vec<String>,
    pub hypothesis: Hypothesis,
    pub causal_links: Vec<CausalLink>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RootCauseResult {
    Confirmed(RootCause),
    Unresolved {
        diagnostic: DiagnosticFinding,
        hypotheses: Vec<Hypothesis>,
    },
}

/// A verified failure is a symptom, not causal proof. Without one uniquely supported
/// revision-bound explanation, return unresolved hypotheses and the intact diagnostic
/// (including missing evidence/next step), never manufacture a RootCause.
pub fn find_root_cause(
    exp: &Expectation,
    input: &[Observation],
    now_ms: u64,
    hypotheses: &[Hypothesis],
    links: &[CausalLink],
) -> Result<RootCauseResult> {
    validate_hypotheses(exp, hypotheses)?;
    let diagnostic = validate_causal_observations(exp, input, now_ms)?;
    if links.len() > MAX_EVIDENCE_REFS {
        return Err(Error::Invalid(
            "causal link reference budget exceeded".into(),
        ));
    }
    let mut ids: BTreeSet<&str> = input
        .iter()
        .map(|observation| observation.evidence_id.as_str())
        .collect();
    let mut supported: BTreeMap<&str, (&Hypothesis, Vec<CausalLink>)> = BTreeMap::new();
    for link in links {
        let hypothesis = hypotheses.iter().find(|h| h.id == link.hypothesis_id);
        if !safe_id(&link.evidence_id)
            || !safe_id(&link.symptom_id)
            || !safe_id(&link.producer)
            || !safe_id(&link.producer_epoch)
            || !safe_id(&link.revision)
            || !safe_id(&link.baseline_revision)
            || link.revision == link.baseline_revision
            || link.observed_ms > now_ms.saturating_add(2_000)
            || !ids.insert(&link.evidence_id)
            || hypothesis.is_none()
            || !input
                .iter()
                .any(|observation| observation.evidence_id == link.symptom_id)
        {
            return Err(Error::Invalid(
                "invalid, duplicate or unbound causal link".into(),
            ));
        }
        if let Some(hypothesis) = hypothesis {
            if link.grade >= EvidenceGrade::IndependentVerified
                && fresh(link.observed_ms, now_ms, exp.freshness_ms)
                && link.reproduced_on_candidate
                && link.recovered_on_revert
                && hypothesis.revision == link.revision
                && hypothesis.explains.contains(&diagnostic.code)
                && diagnostic.evidence_ids.contains(&link.symptom_id)
            {
                supported
                    .entry(hypothesis.id)
                    .or_insert_with(|| (hypothesis, Vec::new()))
                    .1
                    .push(link.clone());
            }
        }
    }
    if diagnostic.condition == Condition::Failed
        && diagnostic.evidence_status == EvidenceStatus::Confirmed
        && !diagnostic.evidence_ids.is_empty()
        && supported.len() == 1
    {
        if let Some((_, (hypothesis, mut causal_links))) = supported.into_iter().next() {
            causal_links.sort_by(|a, b| a.evidence_id.cmp(&b.evidence_id));
            return Ok(RootCauseResult::Confirmed(RootCause {
                code: diagnostic.code,
                condition: diagnostic.condition,
                evidence_status: diagnostic.evidence_status,
                evidence_ids: diagnostic.evidence_ids,
                hypothesis: hypothesis.clone(),
                causal_links,
            }));
        }
    }
    let mut hypotheses = hypotheses.to_vec();
    hypotheses.sort_by(|a, b| a.id.cmp(b.id));
    Ok(RootCauseResult::Unresolved {
        diagnostic,
        hypotheses,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn obs(id: &str, signal: Signal) -> Observation {
        Observation {
            evidence_id: id.into(),
            subject: "cmd-1".into(),
            producer: id.into(),
            producer_epoch: "boot-1".into(),
            producer_sequence: 1,
            observed_ms: 100,
            grade: EvidenceGrade::SourceVerified,
            signal,
        }
    }
    fn exp_command(required: CommandStage) -> Expectation {
        Expectation {
            subject: "cmd-1".into(),
            kind: ExpectationKind::Command(required),
            deadline_ms: 1_000,
            freshness_ms: 5_000,
        }
    }
    fn hypothesis(id: &'static str, codes: &[&'static str]) -> Hypothesis {
        Hypothesis {
            id,
            subject: "cmd-1".into(),
            revision: "candidate-2".into(),
            explains: codes.to_vec(),
        }
    }
    fn link(id: &str, hypothesis_id: &'static str) -> CausalLink {
        CausalLink {
            evidence_id: id.into(),
            hypothesis_id,
            revision: "candidate-2".into(),
            baseline_revision: "baseline-1".into(),
            symptom_id: "f1".into(),
            producer: "independent-lab".into(),
            producer_epoch: "trial-1".into(),
            observed_ms: 150,
            grade: EvidenceGrade::IndependentVerified,
            reproduced_on_candidate: true,
            recovered_on_revert: true,
        }
    }
    #[test]
    fn discriminator_present_under_only_one_hypothesis_is_reported() {
        let a = hypothesis("h-a", &["required_command_stage_observed"]);
        let b = hypothesis("h-b", &["verified_command_failure"]);
        let input = [
            obs("d1", Signal::Command(CommandStage::PhoneDisplayed)),
            obs("d2", Signal::ExplicitFailure),
            obs("both", Signal::Command(CommandStage::Authorized)),
        ];
        let d = discriminate_evidence(
            &a,
            &b,
            &exp_command(CommandStage::PhoneDisplayed),
            &input,
            200,
        )
        .unwrap();
        assert_eq!(d.discriminators, vec!["d1", "d2"]);
        assert_eq!(d.supports, vec![("d1".into(), "h-a"), ("d2".into(), "h-b")]);
    }
    #[test]
    fn observation_under_both_hypotheses_is_not_a_discriminator() {
        let a = hypothesis("h-a", &["required_command_stage_observed"]);
        let b = hypothesis(
            "h-b",
            &[
                "required_command_stage_observed",
                "verified_command_failure",
            ],
        );
        let exp = exp_command(CommandStage::SendObserved);
        let d = discriminate_evidence(
            &a,
            &b,
            &exp,
            &[obs("s1", Signal::Command(CommandStage::SendObserved))],
            200,
        )
        .unwrap();
        assert!(d.discriminators.is_empty());
        assert!(d.supports.is_empty());
        assert!(matches!(
            discriminate_evidence(&a, &b, &exp, &[obs("", Signal::ExplicitFailure)], 200),
            Err(Error::Invalid(_))
        ));
    }
    #[test]
    fn explicit_failure_yields_confirmed_root_cause_with_evidence_ids() {
        let exp = exp_command(CommandStage::PhoneDisplayed);
        let input = [obs("f1", Signal::ExplicitFailure)];
        let hypotheses = [hypothesis("h-a", &["verified_command_failure"])];
        assert!(matches!(
            find_root_cause(&exp, &input, 200, &hypotheses, &[]).unwrap(),
            RootCauseResult::Unresolved { .. }
        ));
        let result = find_root_cause(
            &exp,
            &input,
            200,
            &hypotheses,
            &[link("experiment-1", "h-a")],
        )
        .unwrap();
        let RootCauseResult::Confirmed(root) = result else {
            panic!("expected controlled causal confirmation");
        };
        assert_eq!(root.code, "verified_command_failure");
        assert_eq!(root.condition, Condition::Failed);
        assert_eq!(root.evidence_status, EvidenceStatus::Confirmed);
        assert_eq!(root.evidence_ids, vec!["f1"]);
        assert_eq!(root.hypothesis.revision, "candidate-2");
        assert_eq!(root.causal_links[0].baseline_revision, "baseline-1");
        assert_eq!(root.causal_links[0].evidence_id, "experiment-1");
    }
    #[test]
    fn no_confirmed_failure_returns_unresolved_hypotheses() {
        let hypotheses = [hypothesis("h-a", &["verified_command_failure"])];
        let result = find_root_cause(
            &exp_command(CommandStage::PhoneDisplayed),
            &[obs("s1", Signal::Command(CommandStage::Authorized))],
            200,
            &hypotheses,
            &[],
        )
        .unwrap();
        let RootCauseResult::Unresolved {
            diagnostic,
            hypotheses: unresolved,
        } = result
        else {
            panic!("unfinished workflow cannot produce a root cause");
        };
        assert_ne!(diagnostic.code, "verified_command_failure");
        assert_ne!(diagnostic.condition, Condition::Failed);
        assert_eq!(unresolved, hypotheses);
    }
    #[test]
    fn causal_regression_untrusted_observation_is_not_discriminating_evidence() {
        let a = hypothesis("a", &["verified_command_failure"]);
        let b = hypothesis("b", &[]);
        let mut hint = obs("hint", Signal::ExplicitFailure);
        hint.grade = EvidenceGrade::UntrustedHint;
        assert!(discriminate_evidence(
            &a,
            &b,
            &exp_command(CommandStage::PhoneDisplayed),
            &[hint],
            200
        )
        .unwrap()
        .discriminators
        .is_empty());
    }
    #[test]
    fn causal_regression_invalid_discriminator_id_is_rejected() {
        let a = hypothesis("a", &["verified_command_failure"]);
        let b = hypothesis("b", &[]);
        let exp = exp_command(CommandStage::PhoneDisplayed);
        for mut bad in [
            obs("", Signal::ExplicitFailure),
            obs("bad", Signal::ExplicitFailure),
        ] {
            if bad.evidence_id == "bad" {
                bad.subject = "foreign".into();
            }
            assert!(matches!(
                discriminate_evidence(&a, &b, &exp, &[bad], 200),
                Err(Error::Invalid(_))
            ));
        }
    }
    #[test]
    fn causal_regression_discriminator_budget_is_enforced() {
        let a = hypothesis("a", &["verified_command_failure"]);
        let b = hypothesis("b", &[]);
        let input = vec![obs("f1", Signal::ExplicitFailure); MAX_EVENTS + 1];
        assert!(matches!(
            discriminate_evidence(
                &a,
                &b,
                &exp_command(CommandStage::PhoneDisplayed),
                &input,
                200
            ),
            Err(Error::Invalid(_))
        ));
    }
    #[test]
    fn competing_causal_links_remain_unresolved() {
        let hypotheses = [
            hypothesis("h-a", &["verified_command_failure"]),
            hypothesis("h-b", &["verified_command_failure"]),
        ];
        let result = find_root_cause(
            &exp_command(CommandStage::PhoneDisplayed),
            &[obs("f1", Signal::ExplicitFailure)],
            200,
            &hypotheses,
            &[link("trial-a", "h-a"), link("trial-b", "h-b")],
        )
        .unwrap();
        assert!(matches!(result,RootCauseResult::Unresolved{hypotheses,..} if hypotheses.len()==2));
    }
    #[test]
    fn stale_weak_wrong_revision_or_incomplete_link_never_confirms() {
        let hypotheses = [hypothesis("h-a", &["verified_command_failure"])];
        for variant in 0..4 {
            let mut evidence = link("trial", "h-a");
            match variant {
                0 => evidence.grade = EvidenceGrade::SourceVerified,
                1 => evidence.revision = "other-revision".into(),
                2 => evidence.recovered_on_revert = false,
                _ => evidence.observed_ms = 201,
            }
            assert!(matches!(
                find_root_cause(
                    &exp_command(CommandStage::PhoneDisplayed),
                    &[obs("f1", Signal::ExplicitFailure)],
                    200,
                    &hypotheses,
                    &[evidence]
                )
                .unwrap(),
                RootCauseResult::Unresolved { .. }
            ));
        }
    }
    #[test]
    fn discriminator_rejects_duplicate_future_sequence_and_vocabulary_errors() {
        let a = hypothesis("a", &["verified_command_failure"]);
        let b = hypothesis("b", &[]);
        let exp = exp_command(CommandStage::PhoneDisplayed);
        for variant in 0..4 {
            let mut bad = obs("bad", Signal::ExplicitFailure);
            match variant {
                0 => bad.producer_sequence = 0,
                1 => bad.observed_ms = 2201,
                2 => bad.producer_epoch = "".into(),
                _ => bad.producer = "".into(),
            }
            assert!(matches!(
                discriminate_evidence(&a, &b, &exp, &[bad], 200),
                Err(Error::Invalid(_))
            ));
        }
        let duplicate = obs("same", Signal::ExplicitFailure);
        assert!(matches!(
            discriminate_evidence(&a, &b, &exp, &[duplicate.clone(), duplicate], 200),
            Err(Error::Invalid(_))
        ));
        let mut raw = a.clone();
        raw.explains = vec!["explicit_failure"];
        assert!(matches!(
            discriminate_evidence(&raw, &b, &exp, &[], 200),
            Err(Error::Invalid(_))
        ));
    }
    #[test]
    fn healthy_and_conflicting_diagnostics_never_construct_root_cause() {
        let exp = exp_command(CommandStage::PhoneDisplayed);
        let hypotheses = [hypothesis("h-a", &["verified_command_failure"])];
        for input in [
            vec![obs("ok", Signal::Command(CommandStage::PhoneDisplayed))],
            vec![
                obs("ok", Signal::Command(CommandStage::PhoneDisplayed)),
                obs("f1", Signal::ExplicitFailure),
            ],
        ] {
            assert!(matches!(
                find_root_cause(&exp, &input, 200, &hypotheses, &[]).unwrap(),
                RootCauseResult::Unresolved { .. }
            ));
        }
    }
}
