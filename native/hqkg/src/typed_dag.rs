//! Versioned, in-process typed transformation DAG built on the existing EngineRegistry
//! and Scheduler. No graph store, effect authority, or independent runtime.
//!
//! An engine using PURE_INTERFACE promises deterministic, effect-free computation.
//! This is a trusted Rust integration contract, NOT a security sandbox or grant.
//! Source provenance and revision tokens must be authenticated by the owner.
//! Raw outputs are ephemeral; never send personal outputs to the HQ index.
use crate::engine::{Budget, CancellationToken, EngineRegistry, Scheduler, Task};
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

pub use crate::engine::{PURE_ENGINE_SLOT, PURE_INTERFACE, PURE_OPERATIONS};

pub const CONTRACT: &str = "hqkg.typed-dag/1";

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum GraphDomain {
    Development,
    Personal,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Namespace {
    pub domain: GraphDomain,
    pub owner: String,
}
impl Namespace {
    pub fn validate(&self) -> Result<()> {
        valid_id(&self.owner, 80)
    }
    pub fn label(&self) -> String {
        format!(
            "{}:{}",
            match self.domain {
                GraphDomain::Development => "development",
                GraphDomain::Personal => "personal",
            },
            self.owner
        )
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RevisionToken {
    pub namespace: Namespace,
    pub graph_epoch: u64,
}

/// Inert identity of a program that already passed core/programmability policy
/// validation. It is carried into the DAG so cached and materialized outputs
/// stay bound to the exact program revision. Never a grant.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ProgramIdentity {
    pub id: String,
    pub revision: u64,
    pub policy_revision: u64,
}
impl ProgramIdentity {
    pub fn new(id: &str, revision: u64, policy_revision: u64) -> Result<Self> {
        valid_id(id, 128)?;
        if revision == 0 || policy_revision == 0 {
            return Err(Error::Invalid(
                "program identity revision must be non-zero".into(),
            ));
        }
        Ok(Self {
            id: id.into(),
            revision,
            policy_revision,
        })
    }
    pub fn validate(&self) -> Result<()> {
        Self::new(&self.id, self.revision, self.policy_revision).map(|_| ())
    }
    /// Deterministic stamp framed into every step input, so the cache key,
    /// materialized stamp and engine fingerprint all bind to this revision.
    pub fn stamp(&self) -> String {
        format!("{}@{}#{}", self.id, self.revision, self.policy_revision)
    }
}

/// A program whose typed steps already passed policy validation and were
/// translated to the HQKG `TransformPlan` shape (see
/// `core/programmability::to_pure_transform_program`).
///
/// Binding it to a namespace and revision token is what the DAG executes. The
/// pure interface and operation allowlist are re-checked here, so a non-pure
/// engine or an effect step can never reach `DagExecutor`.
#[derive(Clone, Debug)]
pub struct ValidatedPureProgram {
    pub identity: ProgramIdentity,
    pub namespace: Namespace,
    pub expected: RevisionToken,
    pub steps: Vec<TransformStep>,
}
impl ValidatedPureProgram {
    pub fn new(
        identity: ProgramIdentity,
        namespace: Namespace,
        expected: RevisionToken,
        steps: Vec<TransformStep>,
    ) -> Result<Self> {
        identity.validate()?;
        if expected.namespace != namespace || expected.graph_epoch == 0 {
            return Err(Error::Conflict(
                "revision token does not match program namespace".into(),
            ));
        }
        if steps.is_empty() {
            return Err(Error::Invalid("empty validated pure program".into()));
        }
        for step in &steps {
            if step.engine != PURE_ENGINE_SLOT {
                return Err(Error::Unsupported(format!(
                    "validated pure program requires engine {PURE_ENGINE_SLOT}, got {}",
                    step.engine
                )));
            }
            if !PURE_OPERATIONS.contains(&step.operation.as_str()) {
                return Err(Error::Unsupported(format!(
                    "operation {} is not a pure transform",
                    step.operation
                )));
            }
        }
        let program = Self {
            identity,
            namespace,
            expected,
            steps,
        };
        // Reuse the executor's own plan validation: ids, source revisions,
        // duplicates, missing dependencies and cycles are rejected before any
        // engine is pinned or run.
        validate(
            &program.plan(),
            &program.expected,
            Budget {
                max_tasks: 10_000,
                ..Budget::default()
            },
        )?;
        Ok(program)
    }
    /// The plan the existing `DagExecutor` runs. Program identity is framed into
    /// every step input so identity travels with the data through the DAG.
    pub fn plan(&self) -> TransformPlan {
        let mut steps = self.steps.clone();
        for step in &mut steps {
            let mut framed = String::new();
            field(&mut framed, "vlang.program-identity");
            field(&mut framed, &self.identity.stamp());
            field(&mut framed, &step.input);
            step.input = framed;
        }
        TransformPlan {
            namespace: self.namespace.clone(),
            expected: self.expected.clone(),
            steps,
        }
    }
}

#[derive(Clone, Debug)]
pub struct SourceBinding {
    pub namespace: Namespace,
    pub id: String,
    pub revision: u64,
    /// Exact, owner-verified content SHA-256 (not computed by this module).
    pub digest: String,
    /// Owner-verified reference; not a grant of access.
    pub provenance: String,
}
#[derive(Clone, Debug)]
pub struct TransformStep {
    pub id: String,
    pub engine: String,
    pub operation: String,
    /// Locally supplied input; the owner controls any classified data.
    pub input: String,
    pub sources: Vec<SourceBinding>,
    /// IDs of prerequisite steps in this plan.
    pub after: Vec<String>,
    /// At most two extra attempts, and only on IO errors from trusted pure engines.
    pub retry_io: u8,
}
#[derive(Clone, Debug)]
pub struct TransformPlan {
    pub namespace: Namespace,
    pub expected: RevisionToken,
    pub steps: Vec<TransformStep>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RunState {
    Complete,
    Cancelled,
    Failed,
    StaleGeneration,
    Backpressure,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OutputState {
    Computed,
    Reused,
}
#[derive(Clone, Debug)]
pub struct MaterializedOutput {
    pub step_id: String,
    pub engine: String,
    pub generation: u64,
    /// Exact equality stamp, intentionally not a non-cryptographic hash.
    pub input_stamp: String,
    pub data: String,
    pub provenance: Vec<String>,
    pub state: OutputState,
}
#[derive(Clone, Debug)]
pub struct DagReport {
    pub schema: &'static str,
    pub namespace: Namespace,
    pub revision: RevisionToken,
    pub state: RunState,
    pub outputs: Vec<MaterializedOutput>,
    pub failed_step: Option<String>,
    pub failure: Option<String>,
    /// Graph computation never authorizes browser, OS or provider effects.
    pub effect_authorized: bool,
}
#[derive(Clone, Debug)]
struct Cached {
    generation: u64,
    cache_identity: Arc<()>,
    engine: String,
    operation: String,
    graph_epoch: u64,
    stamp: String,
    data: String,
    provenance: Vec<String>,
    source_ids: BTreeSet<String>,
}
/// In-memory-only exact cache. Namespace and validated program identity
/// are part of each key. Bare plans retain their existing step-key scope.
type CacheKey = (Namespace, Option<String>, String);
pub struct IncrementalCache {
    values: BTreeMap<CacheKey, Cached>,
    max_entries: usize,
    max_bytes: usize,
}
impl Default for IncrementalCache {
    fn default() -> Self {
        Self::with_limits(10_000, 64 * 1024 * 1024)
    }
}
impl IncrementalCache {
    pub fn new() -> Self {
        Self::default()
    }
    /// Limit in-memory-only materializations. Eviction order is deterministic;
    /// it is not a second cache service or background daemon.
    pub fn with_limits(max_entries: usize, max_bytes: usize) -> Self {
        Self {
            values: BTreeMap::new(),
            max_entries,
            max_bytes,
        }
    }
    pub fn len(&self) -> usize {
        self.values.len()
    }
    pub fn approximate_bytes(&self) -> usize {
        self.values
            .iter()
            .map(|((scope, program, id), v)| {
                scope.owner.len()
                    + id.len()
                    + program.as_ref().map_or(0, String::len)
                    + v.engine.len()
                    + v.operation.len()
                    + v.stamp.len()
                    + v.data.len()
                    + v.provenance.iter().map(String::len).sum::<usize>()
                    + v.source_ids.iter().map(String::len).sum::<usize>()
            })
            .sum()
    }
    fn enforce_limits(&mut self) {
        let mut bytes = self.approximate_bytes();
        while self.values.len() > self.max_entries || bytes > self.max_bytes {
            match self.values.pop_first() {
                Some(((scope, program, id), v)) => {
                    let removed = scope.owner.len()
                        + id.len()
                        + program.as_ref().map_or(0, String::len)
                        + v.engine.len()
                        + v.operation.len()
                        + v.stamp.len()
                        + v.data.len()
                        + v.provenance.iter().map(String::len).sum::<usize>()
                        + v.source_ids.iter().map(String::len).sum::<usize>();
                    bytes = bytes.saturating_sub(removed);
                }
                None => break,
            }
        }
    }
    pub fn invalidate(&mut self, ns: &Namespace, ids: &BTreeSet<String>) -> usize {
        let before = self.values.len();
        self.values
            .retain(|(scope, _, id), _| scope != ns || !ids.contains(id));
        before - self.values.len()
    }
    pub fn clear_namespace(&mut self, ns: &Namespace) {
        self.values.retain(|(scope, _, _), _| scope != ns);
    }
    /// Bridge existing GraphChangeSet apply reports to namespace-scoped
    /// incremental computation. Source IDs are exact; unrelated domains
    /// and unaffected outputs stay cached. Dependent stamps are rechecked
    /// when the DAG next executes.
    pub fn invalidate_changes(
        &mut self,
        ns: &Namespace,
        report: &crate::graph_change_set::ApplyReport,
    ) -> usize {
        let before = self.values.len();
        self.values.retain(|(scope, _, _), cached| {
            scope != ns || cached.source_ids.is_disjoint(&report.invalidation_set)
        });
        before - self.values.len()
    }
}

fn valid_id(s: &str, max: usize) -> Result<()> {
    if s.is_empty() || s.len() > max || s.chars().any(char::is_control) {
        return Err(Error::Invalid(
            "empty, oversized or control-character identity".into(),
        ));
    }
    Ok(())
}
fn field(out: &mut String, s: &str) {
    out.push_str(&s.len().to_string());
    out.push(':');
    out.push_str(s);
}
fn is_sha256(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}
fn validate(plan: &TransformPlan, actual: &RevisionToken, budget: Budget) -> Result<Vec<String>> {
    plan.namespace.validate()?;
    if plan.expected != *actual || plan.expected.namespace != plan.namespace {
        return Err(Error::Conflict(
            "stale graph epoch or cross-domain revision".into(),
        ));
    }
    if plan.steps.len() > budget.max_tasks || plan.steps.len() > 10_000 {
        return Err(Error::Invalid(
            "DAG backpressure: task count exceeds budget".into(),
        ));
    }
    let mut all = BTreeMap::new();
    for s in &plan.steps {
        valid_id(&s.id, 80)?;
        valid_id(&s.engine, 80)?;
        valid_id(&s.operation, 80)?;
        if s.retry_io > 2 || s.after.len() > 128 || s.sources.len() > 256 {
            return Err(Error::Invalid("DAG step exceeds bounded contract".into()));
        }
        if all.insert(s.id.clone(), s).is_some() {
            return Err(Error::Invalid("duplicate DAG step".into()));
        }
        let mut uniq = BTreeSet::new();
        for source in &s.sources {
            if source.namespace != plan.namespace {
                return Err(Error::Conflict("cross-namespace source".into()));
            }
            valid_id(&source.id, 256)?;
            valid_id(&source.provenance, 256)?;
            if source.revision == 0
                || !is_sha256(&source.digest)
                || !uniq.insert((source.id.clone(), source.revision, source.digest.clone()))
            {
                return Err(Error::Invalid(
                    "invalid or duplicate source revision".into(),
                ));
            }
        }
    }
    let mut indegree = BTreeMap::<String, usize>::new();
    let mut dependents = BTreeMap::<String, Vec<String>>::new();
    for s in &plan.steps {
        let mut seen = BTreeSet::new();
        for dep in &s.after {
            if dep == &s.id || !seen.insert(dep) {
                return Err(Error::Invalid("duplicate or self dependency".into()));
            }
            if !all.contains_key(dep) {
                return Err(Error::Missing(format!("DAG dependency {dep}")));
            }
            dependents
                .entry(dep.clone())
                .or_default()
                .push(s.id.clone());
        }
        indegree.insert(s.id.clone(), seen.len());
    }
    let mut ready: BTreeSet<String> = indegree
        .iter()
        .filter(|(_, v)| **v == 0)
        .map(|(k, _)| k.clone())
        .collect();
    let mut ordered = Vec::with_capacity(plan.steps.len());
    while let Some(id) = ready.pop_first() {
        if let Some(next) = dependents.get(&id) {
            for consumer in next {
                let degree = indegree.get_mut(consumer).expect("validated DAG reference");
                *degree -= 1;
                if *degree == 0 {
                    ready.insert(consumer.clone());
                }
            }
        }
        ordered.push(id);
    }
    if ordered.len() != plan.steps.len() {
        return Err(Error::Conflict("DAG dependency cycle".into()));
    }
    Ok(ordered)
}
pub struct DagExecutor<'a> {
    registry: &'a EngineRegistry,
}
impl<'a> DagExecutor<'a> {
    pub fn new(registry: &'a EngineRegistry) -> Self {
        Self { registry }
    }
    /// Execute a validated pure program through the existing executor, cache,
    /// scheduler, cancellation token and generation leases. Identity and
    /// dependency order are the validated ones; nothing here is effect
    /// authorized.
    pub fn run_validated(
        &self,
        program: &ValidatedPureProgram,
        actual: &RevisionToken,
        cache: &mut IncrementalCache,
        budget: Budget,
        cancel: &CancellationToken,
    ) -> Result<DagReport> {
        self.run_scoped(&program.plan(), Some(program.identity.stamp()), actual, cache, budget, cancel)
    }
    /// All-or-nothing cache commit. A failed/cancelled plan retains the prior cache.
    /// Dependencies pass their actual output as length-framed input to downstream steps.
    /// Synchronous engine calls cannot be preempted: cancellation is checked at
    /// boundaries, including after each engine invocation.
    pub fn run(
        &self,
        plan: &TransformPlan,
        actual: &RevisionToken,
        cache: &mut IncrementalCache,
        budget: Budget,
        cancel: &CancellationToken,
    ) -> Result<DagReport> {
        self.run_scoped(plan, None, actual, cache, budget, cancel)
    }
    fn run_scoped(&self, plan: &TransformPlan, program: Option<String>, actual: &RevisionToken,
        cache: &mut IncrementalCache, budget: Budget, cancel: &CancellationToken) -> Result<DagReport> {
        let ordered = validate(plan, actual, budget)?;
        let mut report = DagReport {
            schema: CONTRACT,
            namespace: plan.namespace.clone(),
            revision: actual.clone(),
            state: RunState::Complete,
            outputs: Vec::new(),
            failed_step: None,
            failure: None,
            effect_authorized: false,
        };
        let by_id: BTreeMap<&str, &TransformStep> =
            plan.steps.iter().map(|s| (s.id.as_str(), s)).collect();
        // Report owns each output once; dependency lookup stores only its index.
        let mut resolved: BTreeMap<String, usize> = BTreeMap::new();
        let mut staged: BTreeMap<CacheKey, Cached> = BTreeMap::new();
        let mut run_generations: BTreeMap<String, Arc<()>> = BTreeMap::new();
        let start = std::time::Instant::now();
        let mut bytes = 0usize;
        for id in ordered {
            if cancel.is_cancelled() {
                report.state = RunState::Cancelled;
                report.failed_step = Some(id);
                break;
            }
            if start.elapsed().as_millis() >= budget.max_elapsed_ms {
                report.state = RunState::Backpressure;
                report.failed_step = Some(id);
                break;
            }
            let step = by_id[&id[..]];
            let lease = match self.registry.pin(&step.engine) {
                Ok(v) => v,
                Err(e) => {
                    fail(&mut report, &id, RunState::Failed, e);
                    break;
                }
            };
            let cache_identity = lease.cache_identity();
            if let Some(prior) = run_generations.get(&step.engine) {
                if !Arc::ptr_eq(prior, &cache_identity) {
                    fail(&mut report, &id, RunState::StaleGeneration,
                        Error::Conflict("engine replaced between dependent steps".into()));
                    break;
                }
            } else {
                run_generations.insert(step.engine.clone(), Arc::clone(&cache_identity));
            }
            if lease.descriptor().interface != PURE_INTERFACE {
                fail(
                    &mut report,
                    &id,
                    RunState::Failed,
                    Error::Unsupported("engine is not registered as trusted pure transform".into()),
                );
                break;
            }
            if !lease.descriptor().capabilities.contains(&step.operation) {
                fail(
                    &mut report,
                    &id,
                    RunState::Failed,
                    Error::Unsupported("unregistered transform operation".into()),
                );
                break;
            }
            let mut input = String::new();
            field(&mut input, CONTRACT);
            field(&mut input, &step.input);
            field(&mut input, "sources");
            field(&mut input, &step.sources.len().to_string());
            let mut provenance = BTreeSet::new();
            let mut source_ids: BTreeSet<String> = step.sources.iter().map(|s| s.id.clone()).collect();
            let mut sources = step.sources.iter().collect::<Vec<_>>();
            sources.sort_by(|a, b| {
                (&a.id, a.revision, &a.digest).cmp(&(&b.id, b.revision, &b.digest))
            });
            for src in sources {
                field(&mut input, &src.id);
                field(&mut input, &src.revision.to_string());
                field(&mut input, &src.digest);
                provenance.insert(src.provenance.clone());
            }
            field(&mut input, "dependencies");
            field(&mut input, &step.after.len().to_string());
            let mut deps = step.after.clone();
            deps.sort();
            for dep in deps {
                let previous = &report.outputs[resolved[&dep]];
                field(&mut input, &dep);
                field(&mut input, &previous.data);
                provenance.extend(previous.provenance.iter().cloned());
                // Inherit transitive dependencies, including for source-free steps.
                let dep_key = (plan.namespace.clone(), program.clone(), dep.clone());
                let dependency = staged.get(&dep_key).or_else(|| cache.values.get(&dep_key))
                    .expect("completed dependency has staged or retained cache metadata");
                source_ids.extend(dependency.source_ids.iter().cloned());
            }
            field(&mut input, &lease.generation().to_string());
            if input.len() > budget.max_output_bytes {
                report.state = RunState::Backpressure;
                report.failed_step = Some(id);
                report.failure = Some("framed input exceeds byte budget".into());
                break;
            }
            let provenance: Vec<String> = provenance.into_iter().collect();
            let key = (plan.namespace.clone(), program.clone(), id.clone());
            let cached = cache.values.get(&key);
            let (data, state, generation) = match cached {
                Some(c) if c.generation == lease.generation()
                    && Arc::ptr_eq(&c.cache_identity, &cache_identity)
                    && c.engine == step.engine && c.operation == step.operation
                    && c.graph_epoch == actual.graph_epoch && c.stamp == input => {
                    (c.data.clone(), OutputState::Reused, c.generation)
                }
                _ => {
                    let task = Task {
                        id: id.clone(),
                        engine: step.engine.clone(),
                        operation: step.operation.clone(),
                        input: input.clone(),
                        after: Vec::new(),
                    };
                    let mut outcome = None;
                    for attempt in 0..=step.retry_io {
                        if cancel.is_cancelled() {
                            break;
                        }
                        let remaining = budget
                            .max_elapsed_ms
                            .saturating_sub(start.elapsed().as_millis());
                        let single = Budget {
                            max_tasks: 1,
                            max_elapsed_ms: remaining,
                            max_output_bytes: budget.max_output_bytes,
                        };
                        match Scheduler::new(self.registry).run_cancellable(
                            &[task.clone()],
                            single,
                            cancel,
                        ) {
                            Ok(mut r) => {
                                outcome = Some(Ok(r.remove(0)));
                                break;
                            }
                            Err(e) => {
                                let retry = matches!(&e, Error::Io(_)) && attempt < step.retry_io;
                                if !retry {
                                    outcome = Some(Err(e));
                                    break;
                                }
                            }
                        }
                    }
                    match outcome {
                        Some(Ok(r)) => {
                            if r.generation != lease.generation() {
                                fail(
                                    &mut report,
                                    &id,
                                    RunState::StaleGeneration,
                                    Error::Conflict(
                                        "engine generation changed during dispatch".into(),
                                    ),
                                );
                                break;
                            }
                            (r.output, OutputState::Computed, r.generation)
                        }
                        Some(Err(e)) => {
                            if cancel.is_cancelled() {
                                report.state = RunState::Cancelled;
                                report.failed_step = Some(id);
                            } else {
                                fail(&mut report, &id, RunState::Failed, e);
                            }
                            break;
                        }
                        None => {
                            report.state = RunState::Cancelled;
                            report.failed_step = Some(id);
                            break;
                        }
                    }
                }
            };
            if cancel.is_cancelled() {
                report.state = RunState::Cancelled;
                report.failed_step = Some(id);
                break;
            }
            if self.registry.active_generation(&step.engine)? != Some(generation) {
                fail(
                    &mut report,
                    &id,
                    RunState::StaleGeneration,
                    Error::Conflict("engine generation stale after execution".into()),
                );
                break;
            }
            if start.elapsed().as_millis() > budget.max_elapsed_ms {
                report.state = RunState::Backpressure;
                report.failed_step = Some(id);
                report.failure = Some("execution elapsed budget exceeded".into());
                break;
            }
            bytes = match bytes.checked_add(data.len()) {
                Some(n) if n <= budget.max_output_bytes => n,
                _ => {
                    report.state = RunState::Backpressure;
                    report.failed_step = Some(id);
                    report.failure = Some("materialized outputs exceed byte budget".into());
                    break;
                }
            };
            // A reused output need not be copied back into the cache. Provenance
            // and transitive source IDs are compared independently because they
            // can change even when the dependency's materialized bytes do not.
            let unchanged = state == OutputState::Reused && cached.is_some_and(|c|
                c.provenance == provenance && c.source_ids == source_ids);
            if !unchanged {
                staged.insert(
                key,
                Cached {
                    generation,
                    cache_identity,
                    engine: step.engine.clone(),
                    operation: step.operation.clone(),
                    graph_epoch: actual.graph_epoch,
                    stamp: input.clone(),
                    data: data.clone(),
                    provenance: provenance.clone(),
                    source_ids,
                },
                );
            }
            let output = MaterializedOutput {
                step_id: id.clone(),
                engine: step.engine.clone(),
                generation,
                input_stamp: input,
                data,
                provenance,
                state,
            };
            resolved.insert(id, report.outputs.len());
            report.outputs.push(output);
        }
        // One read-lock observation fences every participating engine slot.
        if report.state == RunState::Complete
            && !self.registry.cache_identities_current(&run_generations)? {
            report.state = RunState::StaleGeneration;
            report.failure = Some("engine replaced before DAG completion".into());
        }
        if report.state == RunState::Complete && !staged.is_empty() {
            cache.values.extend(staged);
            cache.enforce_limits();
        }
        Ok(report)
    }
}
fn fail(r: &mut DagReport, id: &str, state: RunState, error: Error) {
    r.state = state;
    r.failed_step = Some(id.to_owned());
    r.failure = Some(error.to_string());
}
