//! @hq:context HQKG's std-only operational contract: dependencies, config, telemetry, health and guarded execution.
//! @hq:owner repos-hq
//! @hq:invariant This layer wraps the existing EngineRegistry. It does not create a competing scheduler.
//! @hq:invariant Graph metadata and research catalogs never grant provider, OS or browser permissions.
use crate::engine::{EngineOutput, EngineRegistry, EngineRequest};
use crate::{Error, Graph, Node, NodeKind, Result};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::io::Write;
use std::time::Instant;

// One intentional, strict wire/version comparator. The default core has no semver dependency.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}
impl Version {
    pub const fn new(major: u32, minor: u32, patch: u32) -> Self {
        Self {
            major,
            minor,
            patch,
        }
    }
    pub fn parse(value: &str) -> Result<Self> {
        let parts = value.split('.').collect::<Vec<_>>();
        if parts.len() != 3
            || parts.iter().any(|s| {
                s.is_empty()
                    || !s.bytes().all(|b| b.is_ascii_digit())
                    || (s.len() > 1 && s.starts_with('0'))
            })
        {
            return Err(Error::Invalid(format!("invalid strict version: {value}")));
        }
        let parse = |s: &str| {
            s.parse::<u32>()
                .map_err(|_| Error::Invalid("version overflow".into()))
        };
        Ok(Self::new(
            parse(parts[0])?,
            parse(parts[1])?,
            parse(parts[2])?,
        ))
    }
    pub fn label(&self) -> String {
        format!("{}.{}.{}", self.major, self.minor, self.patch)
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VersionRange {
    pub min_inclusive: Version,
    pub max_exclusive: Option<Version>,
}
impl VersionRange {
    pub fn accepts(&self, v: Version) -> bool {
        v >= self.min_inclusive && self.max_exclusive.map_or(true, |max| v < max)
    }
    pub fn validate(&self) -> Result<()> {
        if self
            .max_exclusive
            .map_or(false, |max| max <= self.min_inclusive)
        {
            return Err(Error::Invalid("empty dependency version range".into()));
        }
        Ok(())
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ResourceKind {
    Engine,
    Database,
    Dataset,
    Capability,
    Schema,
    Other(String),
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Resource {
    pub id: String,
    pub kind: ResourceKind,
    pub version: Version,
    pub ready: bool,
    /// Mandatory for immutable dataset/schema snapshots in production.
    pub sha256: Option<String>,
    /// Concrete engine generation, if this is a registered runtime implementation.
    pub generation: Option<u64>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Dependency {
    pub id: String,
    pub kind: ResourceKind,
    pub version: VersionRange,
    pub required: bool,
    pub expected_sha256: Option<String>,
    /// Other requirement IDs in the SAME dependency plan (not a global side-effect resolver).
    pub after: Vec<String>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DependencyPlan {
    pub pinned: Vec<Resource>,
    pub omitted_optional: Vec<String>,
    pub order: Vec<String>,
}
fn valid_sha(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn valid_key(s: &str) -> bool {
    !s.is_empty() && s.len() <= 256 && !s.chars().any(char::is_control)
}
fn telemetry_label(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}
/// Dependencies are a read-only inventory reconciliation, NOT arbitrary package installation.
/// Required missing, incompatible, unknown/cyclic or stale references fail closed.
pub fn resolve_dependencies(
    requirements: &[Dependency],
    resources: &BTreeMap<String, Resource>,
    production: bool,
) -> Result<DependencyPlan> {
    let mut by_id = BTreeMap::new();
    for d in requirements {
        if !valid_key(&d.id) {
            return Err(Error::Invalid("invalid dependency id".into()));
        }
        d.version.validate()?;
        if let Some(expected) = &d.expected_sha256 {
            if !valid_sha(expected) {
                return Err(Error::Invalid("invalid expected SHA-256".into()));
            }
        }
        if by_id.insert(d.id.as_str(), d).is_some() {
            return Err(Error::Invalid(format!("duplicate dependency {}", d.id)));
        }
    }
    let mut incoming: BTreeMap<&str, usize> = by_id.keys().map(|id| (*id, 0)).collect();
    let mut successors: BTreeMap<&str, BTreeSet<&str>> = BTreeMap::new();
    for d in requirements {
        let mut unique = BTreeSet::new();
        for after in &d.after {
            if !by_id.contains_key(after.as_str()) {
                return Err(Error::Missing(format!(
                    "unregistered dependency ordering: {after}"
                )));
            }
            if !unique.insert(after.as_str()) {
                return Err(Error::Invalid(format!("duplicate prerequisite {after}")));
            }
            *incoming.get_mut(d.id.as_str()).unwrap() += 1;
            successors
                .entry(after.as_str())
                .or_default()
                .insert(d.id.as_str());
        }
    }
    let mut ready: BTreeSet<&str> = incoming
        .iter()
        .filter(|(_, degree)| **degree == 0)
        .map(|(id, _)| *id)
        .collect();
    let mut order = Vec::with_capacity(requirements.len());
    while let Some(id) = ready.pop_first() {
        order.push(id.to_owned());
        if let Some(next) = successors.get(id) {
            for child in next {
                let degree = incoming.get_mut(child).unwrap();
                *degree -= 1;
                if *degree == 0 {
                    ready.insert(child);
                }
            }
        }
    }
    if order.len() != requirements.len() {
        return Err(Error::Conflict("dependency cycle".into()));
    }
    let mut pinned = Vec::new();
    let mut omitted = BTreeSet::new();
    for id in &order {
        let spec = by_id[id.as_str()];
        let parent_missing = spec.after.iter().any(|parent| omitted.contains(parent));
        let available = resources.get(id);
        let compatible = available.filter(|r| {
            r.ready
                && r.kind == spec.kind
                && spec.version.accepts(r.version)
                && spec
                    .expected_sha256
                    .as_ref()
                    .map_or(true, |expected| r.sha256.as_ref() == Some(expected))
                && (!production
                    || !matches!(r.kind, ResourceKind::Dataset | ResourceKind::Schema)
                    || r.sha256.as_ref().map_or(false, |d| valid_sha(d)))
                && (!production || r.kind != ResourceKind::Engine || r.generation.is_some())
        });
        if parent_missing || compatible.is_none() {
            if spec.required {
                return Err(Error::Missing(format!(
                    "required dependency {} unavailable/incompatible",
                    spec.id
                )));
            }
            omitted.insert(spec.id.clone());
            continue;
        }
        pinned.push(compatible.unwrap().clone());
    }
    Ok(DependencyPlan {
        pinned,
        omitted_optional: order
            .iter()
            .filter(|id| omitted.contains(*id))
            .cloned()
            .collect(),
        order,
    })
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Mode {
    Development,
    Production,
}
impl Mode {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Development => "development",
            Self::Production => "production",
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CoreConfig {
    pub revision: u64,
    pub mode: Mode,
    pub allow_experimental: bool,
    pub require_pinned_data: bool,
    pub max_call_ms: u64,
    pub max_output_bytes: usize,
    pub telemetry_capacity: usize,
    pub quarantine_after: u32,
}
impl Default for CoreConfig {
    fn default() -> Self {
        Self {
            revision: 1,
            mode: Mode::Production,
            allow_experimental: false,
            require_pinned_data: true,
            max_call_ms: 30_000,
            max_output_bytes: 4 * 1024 * 1024,
            telemetry_capacity: 2048,
            quarantine_after: 3,
        }
    }
}
#[derive(Clone, Debug, Default)]
pub struct ConfigPatch {
    pub mode: Option<Mode>,
    pub allow_experimental: Option<bool>,
    pub require_pinned_data: Option<bool>,
    pub max_call_ms: Option<u64>,
    pub max_output_bytes: Option<usize>,
    pub telemetry_capacity: Option<usize>,
    pub quarantine_after: Option<u32>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ConfigReceipt {
    pub old_revision: u64,
    pub new_revision: u64,
    pub changed: bool,
    pub mode: Mode,
}
impl CoreConfig {
    pub fn validate(&self) -> Result<()> {
        if self.mode == Mode::Production && (self.allow_experimental || !self.require_pinned_data) {
            return Err(Error::Conflict(
                "production requires pinned data and forbids experimental engines".into(),
            ));
        }
        if self.max_call_ms == 0
            || self.max_call_ms > 600_000
            || self.max_output_bytes == 0
            || self.max_output_bytes > 128 * 1024 * 1024
            || !(16..=100_000).contains(&self.telemetry_capacity)
            || !(1..=100).contains(&self.quarantine_after)
        {
            return Err(Error::Invalid("invalid core configuration bounds".into()));
        }
        Ok(())
    }
    /// Typed CAS update, compatible with human, CLI and natural language *planning*.
    /// A proposal is never an authorization to change configuration.
    pub fn patch(&mut self, expected_revision: u64, patch: ConfigPatch) -> Result<ConfigReceipt> {
        if self.revision != expected_revision {
            return Err(Error::Conflict("configuration revision mismatch".into()));
        }
        let mut next = self.clone();
        if let Some(v) = patch.mode {
            next.mode = v;
        }
        if let Some(v) = patch.allow_experimental {
            next.allow_experimental = v;
        }
        if let Some(v) = patch.require_pinned_data {
            next.require_pinned_data = v;
        }
        if let Some(v) = patch.max_call_ms {
            next.max_call_ms = v;
        }
        if let Some(v) = patch.max_output_bytes {
            next.max_output_bytes = v;
        }
        if let Some(v) = patch.telemetry_capacity {
            next.telemetry_capacity = v;
        }
        if let Some(v) = patch.quarantine_after {
            next.quarantine_after = v;
        }
        next.validate()?;
        let old = self.revision;
        let changed = next != *self;
        if changed {
            next.revision = old
                .checked_add(1)
                .ok_or_else(|| Error::Invalid("config revision overflow".into()))?;
            *self = next;
        }
        Ok(ConfigReceipt {
            old_revision: old,
            new_revision: self.revision,
            changed,
            mode: self.mode,
        })
    }
    /// Persist only non-secret configuration metadata as a normal versioned graph node.
    /// Callers own durable journal write and approval. Old revisions are not overwritten.
    pub fn snapshot_node(&self) -> Node {
        Node::new(
            &format!("config:core:{}", self.revision),
            NodeKind::Other("core-config".into()),
            "HQKG core configuration",
        )
        .property("revision", &self.revision.to_string())
        .property("mode", self.mode.as_str())
        .property("allow_experimental", &self.allow_experimental.to_string())
        .property("require_pinned_data", &self.require_pinned_data.to_string())
        .property("max_call_ms", &self.max_call_ms.to_string())
        .property("max_output_bytes", &self.max_output_bytes.to_string())
        .property("telemetry_capacity", &self.telemetry_capacity.to_string())
        .property("quarantine_after", &self.quarantine_after.to_string())
    }
    pub fn from_snapshot_node(node: &Node) -> Result<Self> {
        if node.kind != NodeKind::Other("core-config".into()) {
            return Err(Error::Invalid("not a core configuration snapshot".into()));
        }
        let key = |field: &str| {
            node.properties
                .get(field)
                .map(String::as_str)
                .ok_or_else(|| Error::Corrupt(format!("config snapshot missing {field}")))
        };
        let number = |field: &str| -> Result<u64> {
            key(field)?
                .parse::<u64>()
                .map_err(|_| Error::Corrupt(format!("invalid config {field}")))
        };
        let boolean = |field: &str| -> Result<bool> {
            match key(field)? {
                "true" => Ok(true),
                "false" => Ok(false),
                _ => Err(Error::Corrupt(format!("invalid config {field}"))),
            }
        };
        let mode = match key("mode")? {
            "production" => Mode::Production,
            "development" => Mode::Development,
            _ => return Err(Error::Corrupt("unknown core mode".into())),
        };
        let revision = number("revision")?;
        if node.id != format!("config:core:{revision}") {
            return Err(Error::Corrupt("core config ID/revision mismatch".into()));
        }
        let c = Self {
            revision,
            mode,
            allow_experimental: boolean("allow_experimental")?,
            require_pinned_data: boolean("require_pinned_data")?,
            max_call_ms: number("max_call_ms")?,
            max_output_bytes: number("max_output_bytes")?
                .try_into()
                .map_err(|_| Error::Corrupt("output size overflow".into()))?,
            telemetry_capacity: number("telemetry_capacity")?
                .try_into()
                .map_err(|_| Error::Corrupt("telemetry capacity overflow".into()))?,
            quarantine_after: number("quarantine_after")?
                .try_into()
                .map_err(|_| Error::Corrupt("quarantine threshold overflow".into()))?,
        };
        c.validate()?;
        Ok(c)
    }
    pub fn latest_from_graph(g: &Graph) -> Result<Self> {
        let mut latest: Option<Self> = None;
        for n in g.nodes() {
            if n.id.starts_with("config:core:") {
                let cfg = Self::from_snapshot_node(n)?;
                if latest
                    .as_ref()
                    .map_or(true, |prior| prior.revision < cfg.revision)
                {
                    latest = Some(cfg);
                }
            }
        }
        Ok(latest.unwrap_or_default())
    }
    pub fn record_snapshot(&self, g: &mut Graph) -> Result<bool> {
        let n = self.snapshot_node();
        if let Some(existing) = g.node(&n.id) {
            if existing.kind == n.kind
                && existing.title == n.title
                && existing.properties == n.properties
            {
                return Ok(false);
            }
            return Err(Error::Conflict(
                "immutable configuration revision collision".into(),
            ));
        }
        g.put_node(n)?;
        Ok(true)
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Outcome {
    Success,
    Failed,
    Rejected,
    Slow,
}
#[derive(Clone, Debug)]
pub struct MetricEvent {
    pub sequence: u64,
    pub slot: String,
    pub operation: String,
    pub outcome: Outcome,
    pub elapsed_ms: u128,
    pub generation: Option<u64>,
    pub config_revision: u64,
}
#[derive(Clone, Debug)]
pub struct MetricSummary {
    pub count: usize,
    pub errors: usize,
    pub p50_ms: u128,
    pub p95_ms: u128,
    pub max_ms: u128,
}
#[derive(Clone, Debug)]
pub struct Telemetry {
    capacity: usize,
    sequence: u64,
    dropped: u64,
    events: VecDeque<MetricEvent>,
}
impl Telemetry {
    pub fn new(capacity: usize) -> Result<Self> {
        if !(16..=100_000).contains(&capacity) {
            return Err(Error::Invalid("invalid telemetry capacity".into()));
        }
        Ok(Self {
            capacity,
            sequence: 0,
            dropped: 0,
            events: VecDeque::new(),
        })
    }
    pub fn emit(&mut self, mut e: MetricEvent) -> Result<()> {
        if !telemetry_label(&e.slot) || !telemetry_label(&e.operation) {
            return Err(Error::Invalid(
                "telemetry labels must be bounded identifiers, not freeform input".into(),
            ));
        }
        self.sequence = self
            .sequence
            .checked_add(1)
            .ok_or_else(|| Error::Invalid("telemetry sequence overflow".into()))?;
        e.sequence = self.sequence;
        if self.events.len() == self.capacity {
            self.events.pop_front();
            self.dropped += 1;
        }
        self.events.push_back(e);
        Ok(())
    }
    pub fn events(&self) -> impl Iterator<Item = &MetricEvent> {
        self.events.iter()
    }
    pub fn dropped(&self) -> u64 {
        self.dropped
    }
    pub fn sequence(&self) -> u64 {
        self.sequence
    }
    /// No dependency and no user payloads: a bounded, deterministic TSV export.
    /// Caller chooses a local sink/retention. This snapshot is NOT a live telemetry daemon.
    pub fn export_tsv<W: Write>(&self, out: &mut W) -> Result<()> {
        writeln!(out,"hqkg.telemetry/1\tsequence\tslot\toperation\toutcome\telapsed_ms\tgeneration\tconfig_revision")?;
        for e in &self.events {
            let outcome = match e.outcome {
                Outcome::Success => "success",
                Outcome::Failed => "failed",
                Outcome::Rejected => "rejected",
                Outcome::Slow => "slow",
            };
            let gen = e.generation.map_or_else(|| "-".into(), |v| v.to_string());
            writeln!(
                out,
                "event\t{}\t{}\t{}\t{}\t{}\t{}\t{}",
                e.sequence, e.slot, e.operation, outcome, e.elapsed_ms, gen, e.config_revision
            )?;
        }
        Ok(())
    }

    pub fn summary(&self, slot: &str) -> MetricSummary {
        let mut values = self
            .events
            .iter()
            .filter(|e| e.slot == slot)
            .collect::<Vec<_>>();
        let errors = values
            .iter()
            .filter(|e| e.outcome != Outcome::Success)
            .count();
        let count = values.len();
        values.sort_by_key(|e| e.elapsed_ms);
        let percentile = |p: usize| {
            if count == 0 {
                0
            } else {
                values[((count - 1) * p) / 100].elapsed_ms
            }
        };
        MetricSummary {
            count,
            errors,
            p50_ms: percentile(50),
            p95_ms: percentile(95),
            max_ms: values.last().map_or(0, |e| e.elapsed_ms),
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HealthStatus {
    Ready,
    Degraded,
    Quarantined,
}
#[derive(Clone, Debug)]
pub struct ServiceHealth {
    pub status: HealthStatus,
    pub consecutive_failures: u32,
    pub total_failures: u64,
    pub last_failure_code: Option<String>,
}
impl Default for ServiceHealth {
    fn default() -> Self {
        Self {
            status: HealthStatus::Ready,
            consecutive_failures: 0,
            total_failures: 0,
            last_failure_code: None,
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RecoveryPlan {
    NoAction,
    RetryReadOnlyAfterProbe,
    QuarantineAndReview,
}
#[derive(Clone, Debug, Default)]
pub struct HealthMonitor {
    services: BTreeMap<String, ServiceHealth>,
}
impl HealthMonitor {
    pub fn state(&self, slot: &str) -> ServiceHealth {
        self.services.get(slot).cloned().unwrap_or_default()
    }
    pub fn ensure_runnable(&self, slot: &str) -> Result<()> {
        if self.state(slot).status == HealthStatus::Quarantined {
            Err(Error::Conflict(format!("engine {slot} quarantined")))
        } else {
            Ok(())
        }
    }
    pub fn success(&mut self, slot: &str) {
        let s = self.services.entry(slot.to_owned()).or_default();
        if s.status != HealthStatus::Quarantined {
            s.status = HealthStatus::Ready;
            s.consecutive_failures = 0;
            s.last_failure_code = None;
        }
    }
    pub fn failure(&mut self, slot: &str, code: &str, quarantine_after: u32) -> RecoveryPlan {
        let s = self.services.entry(slot.to_owned()).or_default();
        s.total_failures = s.total_failures.saturating_add(1);
        s.consecutive_failures = s.consecutive_failures.saturating_add(1);
        s.last_failure_code = Some(code.chars().take(64).collect());
        if s.consecutive_failures >= quarantine_after {
            s.status = HealthStatus::Quarantined;
            RecoveryPlan::QuarantineAndReview
        } else {
            s.status = HealthStatus::Degraded;
            RecoveryPlan::RetryReadOnlyAfterProbe
        }
    }
    /// A quarantined engine is never silently unquarantined. Operator must supply
    /// a successful independent readiness probe following any required repair.
    pub fn release_after_verified_probe(&mut self, slot: &str, passed: bool) -> Result<()> {
        if !passed {
            return Err(Error::Conflict("readiness probe has not passed".into()));
        }
        self.services.insert(slot.into(), ServiceHealth::default());
        Ok(())
    }
}

// Only approved, trusted in-process adapters may perform unattended repairs.
// No generic shell/process, SQL mutation, provider or network repair capability exists here.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RepairScope {
    EphemeralCache,
    DerivedProjection,
    ExternalSystem,
}
pub trait RepairAdapter: Send + Sync {
    fn scope(&self) -> RepairScope;
    /// Must be idempotent and bounded. The engine operation is NEVER replayed.
    fn repair(&self) -> Result<()>;
    /// Must independently verify readiness after repair.
    fn probe(&self) -> Result<bool>;
}
#[derive(Clone, Debug)]
pub struct RepairReceipt {
    pub slot: String,
    pub scope: RepairScope,
    pub attempt: u32,
    pub verified: bool,
    pub policy: String,
}
#[derive(Default)]
pub struct HealingController {
    attempts: BTreeMap<String, u32>,
    receipts: VecDeque<RepairReceipt>,
}
impl HealingController {
    pub fn receipts(&self) -> impl Iterator<Item = &RepairReceipt> {
        self.receipts.iter()
    }
    pub fn attempts(&self, slot: &str) -> u32 {
        *self.attempts.get(slot).unwrap_or(&0)
    }
    /// Single bounded repair attempt per failed operation, at most two attempts
    /// per slot lifetime. Explicit operator reconciliation is required to reset.
    pub fn attempt_safe(
        &mut self,
        slot: &str,
        adapter: &dyn RepairAdapter,
        health: &mut HealthMonitor,
        quarantine_after: u32,
    ) -> Result<RepairReceipt> {
        let scope = adapter.scope();
        if scope != RepairScope::EphemeralCache {
            return Err(Error::Unsupported(
                "unattended repairs limited to ephemeral in-memory cache".into(),
            ));
        }
        health.ensure_runnable(slot)?;
        if health.state(slot).status != HealthStatus::Degraded {
            return Err(Error::Conflict("no degraded state to repair".into()));
        }
        let attempts = self.attempts.entry(slot.into()).or_default();
        if *attempts >= 2 {
            return Err(Error::Conflict("automatic repair budget exhausted".into()));
        }
        *attempts += 1;
        let verified = matches!(adapter.repair().and_then(|_| adapter.probe()), Ok(true));
        if verified {
            health.success(slot);
        } else {
            health.failure(slot, "cache_repair_failed", quarantine_after);
        }
        let receipt = RepairReceipt {
            slot: slot.into(),
            scope,
            attempt: *attempts,
            verified,
            policy: "trusted_ephemeral_cache_only".into(),
        };
        if self.receipts.len() >= 128 {
            self.receipts.pop_front();
        }
        self.receipts.push_back(receipt.clone());
        Ok(receipt)
    }
    /// Only an operator-verified probe may reset the repair budget.
    pub fn reset_after_verified_probe(
        &mut self,
        slot: &str,
        health: &mut HealthMonitor,
        passed: bool,
    ) -> Result<()> {
        health.release_after_verified_probe(slot, passed)?;
        self.attempts.remove(slot);
        Ok(())
    }
}

#[derive(Clone, Debug)]
pub struct SupervisedReceipt {
    pub slot: String,
    pub operation: String,
    pub engine_generation: u64,
    pub config_revision: u64,
    pub mode: Mode,
    pub pinned_resources: Vec<Resource>,
    pub omitted_optional: Vec<String>,
    pub elapsed_ms: u128,
}
#[derive(Clone, Debug)]
pub struct SupervisedOutput {
    pub output: EngineOutput,
    pub receipt: SupervisedReceipt,
}
#[derive(Clone, Debug)]
pub struct EnginePolicy {
    pub production_ready: bool,
    pub dependencies: Vec<Dependency>,
}
/// In-process, trusted *read-only* compute orchestrator. It uses EngineRegistry::pin
/// and never runs an arbitrary process, package installer, browser action or model call.
/// Engine implementations must be trusted: a Rust trait does not sandbox native code.
pub struct CoreSupervisor<'a> {
    pub registry: &'a EngineRegistry,
    pub config: CoreConfig,
    pub inventory: BTreeMap<String, Resource>,
    pub policies: BTreeMap<String, EnginePolicy>,
    pub telemetry: Telemetry,
    pub health: HealthMonitor,
    pub healing: HealingController,
    repair_adapters: BTreeMap<String, std::sync::Arc<dyn RepairAdapter>>,
}
impl<'a> CoreSupervisor<'a> {
    pub fn new(registry: &'a EngineRegistry, config: CoreConfig) -> Result<Self> {
        config.validate()?;
        let capacity = config.telemetry_capacity;
        Ok(Self {
            registry,
            config,
            inventory: BTreeMap::new(),
            policies: BTreeMap::new(),
            telemetry: Telemetry::new(capacity)?,
            health: HealthMonitor::default(),
            healing: HealingController::default(),
            repair_adapters: BTreeMap::new(),
        })
    }
    pub fn register_ephemeral_cache_repair(
        &mut self,
        slot: &str,
        adapter: std::sync::Arc<dyn RepairAdapter>,
    ) -> Result<()> {
        if adapter.scope() != RepairScope::EphemeralCache {
            return Err(Error::Unsupported(
                "only in-memory cache repair adapters may be automatic".into(),
            ));
        }
        self.repair_adapters.insert(slot.into(), adapter);
        Ok(())
    }
    pub fn execute_read_only(
        &mut self,
        slot: &str,
        request: &EngineRequest,
    ) -> Result<SupervisedOutput> {
        let before = self.telemetry.sequence();
        let start = Instant::now();
        let result = self.execute_inner(slot, request);
        // Classify preflight deny/missing dependency separately. No health penalty
        // for a correctly rejected request and no user input in the receipt.
        if result.is_err() && self.telemetry.sequence() == before {
            let _ = self.telemetry.emit(MetricEvent {
                sequence: 0,
                slot: slot.into(),
                operation: request.operation.clone(),
                outcome: Outcome::Rejected,
                elapsed_ms: start.elapsed().as_millis(),
                generation: None,
                config_revision: self.config.revision,
            });
        }
        result
    }
    fn execute_inner(&mut self, slot: &str, request: &EngineRequest) -> Result<SupervisedOutput> {
        self.health.ensure_runnable(slot)?;
        let policy = self
            .policies
            .get(slot)
            .ok_or_else(|| Error::Missing(format!("unregistered execution policy: {slot}")))?;
        if self.config.mode == Mode::Production && !policy.production_ready {
            return Err(Error::Conflict(
                "engine has not passed production acceptance".into(),
            ));
        }
        let plan = resolve_dependencies(
            &policy.dependencies,
            &self.inventory,
            self.config.mode == Mode::Production && self.config.require_pinned_data,
        )?;
        let lease = self.registry.pin(slot)?;
        // If a dependency pins the same engine slot, require exact generation parity.
        for resource in &plan.pinned {
            if resource.id == slot
                && resource.kind == ResourceKind::Engine
                && resource.generation != Some(lease.generation())
            {
                return Err(Error::Conflict(
                    "engine dependency pinned to a different generation".into(),
                ));
            }
        }
        let start = Instant::now();
        let result = lease.execute(request);
        let elapsed_ms = start.elapsed().as_millis();
        let bounded = result.and_then(|output| {
            if elapsed_ms > self.config.max_call_ms as u128 {
                return Err(Error::Conflict(
                    "engine exceeded elapsed-time budget".into(),
                ));
            }
            if output.data.len() > self.config.max_output_bytes {
                return Err(Error::Conflict("engine exceeded output-size budget".into()));
            }
            Ok(output)
        });
        let outcome = if bounded.is_ok() {
            Outcome::Success
        } else {
            Outcome::Failed
        };
        let event = MetricEvent {
            sequence: 0,
            slot: slot.into(),
            operation: request.operation.clone(),
            outcome,
            elapsed_ms,
            generation: Some(lease.generation()),
            config_revision: self.config.revision,
        };
        self.telemetry.emit(event)?;
        match bounded {
            Ok(output) => {
                self.health.success(slot);
                Ok(SupervisedOutput {
                    output,
                    receipt: SupervisedReceipt {
                        slot: slot.into(),
                        operation: request.operation.clone(),
                        engine_generation: lease.generation(),
                        config_revision: self.config.revision,
                        mode: self.config.mode,
                        pinned_resources: plan.pinned,
                        omitted_optional: plan.omitted_optional,
                        elapsed_ms,
                    },
                })
            }
            Err(err) => {
                let code = match &err {
                    Error::Invalid(_) => "invalid",
                    Error::Missing(_) => "missing",
                    Error::Conflict(_) => "conflict",
                    Error::Corrupt(_) => "corrupt",
                    Error::Unsupported(_) => "unsupported",
                    Error::Locked { .. } => "locked",
                    Error::Io(_) => "io",
                };
                let plan = self
                    .health
                    .failure(slot, code, self.config.quarantine_after);
                if plan == RecoveryPlan::RetryReadOnlyAfterProbe {
                    if let Some(adapter) = self.repair_adapters.get(slot) {
                        let _ = self.healing.attempt_safe(
                            slot,
                            adapter.as_ref(),
                            &mut self.health,
                            self.config.quarantine_after,
                        );
                    }
                }
                // Never replay the original operation. The failed result stays failed.
                Err(err)
            }
        }
    }
    pub fn readiness(&self, slot: &str) -> Result<()> {
        self.config.validate()?;
        self.health.ensure_runnable(slot)?;
        let policy = self
            .policies
            .get(slot)
            .ok_or_else(|| Error::Missing(format!("policy {slot}")))?;
        if self.config.mode == Mode::Production && !policy.production_ready {
            return Err(Error::Conflict("engine is not production ready".into()));
        }
        resolve_dependencies(
            &policy.dependencies,
            &self.inventory,
            self.config.mode == Mode::Production,
        )?;
        self.registry.pin(slot)?;
        Ok(())
    }
}
