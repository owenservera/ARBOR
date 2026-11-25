//! Generational in-process engine slots: existing leases remain valid after replacement.
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};
use std::time::Instant;

/// Marker interface of a trusted, deterministic, effect-free transform engine.
/// This is a Rust integration contract, not a sandbox and not a grant.
pub const PURE_INTERFACE: &str = "hqkg.transform.pure/1";
/// Registry slot occupied by the native VLANG pure transform engine.
pub const PURE_ENGINE_SLOT: &str = "vlang.pure";
/// Operations the pure engine serves: one per pure `TransformKind` of
/// core/programmability. Effect candidates are deliberately absent.
pub const PURE_OPERATIONS: &[&str] = &[
    "normalize",
    "select-context",
    "interpret",
    "compile",
    "evaluate",
    "project",
];

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EngineDescriptor {
    pub slot: String,
    pub implementation: String,
    pub interface: String,
    pub capabilities: BTreeSet<String>,
}
impl EngineDescriptor {
    pub fn new(slot: &str, implementation: &str, interface: &str, ops: &[&str]) -> Self {
        Self {
            slot: slot.into(),
            implementation: implementation.into(),
            interface: interface.into(),
            capabilities: ops.iter().map(|s| s.to_string()).collect(),
        }
    }
}
#[derive(Clone, Debug)]
pub struct EngineRequest {
    pub operation: String,
    pub data: String,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EngineOutput {
    pub data: String,
}
pub trait ComputeEngine: Send + Sync {
    fn descriptor(&self) -> EngineDescriptor;
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput>;
}
struct Generation {
    generation: u64,
    // A slot's numeric generation is local to its registry. This allocation
    // is unique even when a second registry installs the same descriptor.
    cache_identity: Arc<()>,
    desc: EngineDescriptor,
    engine: Arc<dyn ComputeEngine>,
}
pub struct EngineLease {
    inner: Arc<Generation>,
}
impl EngineLease {
    pub fn generation(&self) -> u64 {
        self.inner.generation
    }
    pub(crate) fn cache_identity(&self) -> Arc<()> {
        Arc::clone(&self.inner.cache_identity)
    }
    pub fn descriptor(&self) -> &EngineDescriptor {
        &self.inner.desc
    }
    pub fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        if !self.inner.desc.capabilities.contains(&request.operation) {
            return Err(Error::Unsupported(format!(
                "operation {} not supported by {}",
                request.operation, self.inner.desc.slot
            )));
        }
        self.inner.engine.execute(request)
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SwapReceipt {
    pub slot: String,
    pub previous: Option<u64>,
    pub generation: u64,
}
#[derive(Default)]
pub struct EngineRegistry {
    active: RwLock<BTreeMap<String, Arc<Generation>>>,
}
impl EngineRegistry {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn pin(&self, slot: &str) -> Result<EngineLease> {
        let map = self
            .active
            .read()
            .map_err(|_| Error::Conflict("registry poisoned".into()))?;
        let current = map
            .get(slot)
            .ok_or_else(|| Error::Missing(format!("engine {slot}")))?;
        Ok(EngineLease {
            inner: Arc::clone(current),
        })
    }
    /// CAS-style replacement. Existing leases continue on their former Arc.
    /// ABI/interface must match; the replacement must retain every previous capability.
    pub fn install(
        &self,
        engine: Arc<dyn ComputeEngine>,
        expected: Option<u64>,
    ) -> Result<SwapReceipt> {
        let desc = engine.descriptor();
        if desc.slot.is_empty()
            || desc.interface.is_empty()
            || desc.implementation.is_empty()
            || desc.capabilities.is_empty()
        {
            return Err(Error::Invalid("incomplete engine descriptor".into()));
        }
        let mut map = self
            .active
            .write()
            .map_err(|_| Error::Conflict("registry poisoned".into()))?;
        let old = map.get(&desc.slot);
        let prev = old.map(|g| g.generation);
        if prev != expected {
            return Err(Error::Conflict(format!(
                "engine generation conflict: expected {expected:?}, actual {prev:?}"
            )));
        }
        if let Some(g) = old {
            if g.desc.interface != desc.interface
                || !g.desc.capabilities.is_subset(&desc.capabilities)
            {
                return Err(Error::Conflict(
                    "replacement changes interface or removes capabilities".into(),
                ));
            }
        }
        let generation = prev
            .unwrap_or(0)
            .checked_add(1)
            .ok_or_else(|| Error::Invalid("generation overflow".into()))?;
        let slot = desc.slot.clone();
        map.insert(
            slot.clone(),
            Arc::new(Generation {
                generation,
                cache_identity: Arc::new(()),
                desc,
                engine,
            }),
        );
        Ok(SwapReceipt {
            slot,
            previous: prev,
            generation,
        })
    }
    /// One read lock gives the DAG a coherent completion observation of all
    /// participating slots, even if another thread replaces engines.
    pub(crate) fn cache_identities_current(&self, identities: &BTreeMap<String, Arc<()>>) -> Result<bool> {
        let map = self.active.read().map_err(|_| Error::Conflict("registry poisoned".into()))?;
        Ok(identities.iter().all(|(slot, identity)| {
            map.get(slot).is_some_and(|generation| Arc::ptr_eq(identity, &generation.cache_identity))
        }))
    }
    pub fn active_generation(&self, slot: &str) -> Result<Option<u64>> {
        let map = self
            .active
            .read()
            .map_err(|_| Error::Conflict("registry poisoned".into()))?;
        Ok(map.get(slot).map(|g| g.generation))
    }
}

/// Actual pure transform engine behind `PURE_ENGINE_SLOT`.
///
/// It decodes the length-framed request the typed DAG builds and returns a
/// deterministic canonical fingerprint. No storage, clock, provider, network or
/// effect, and no IO error path, so scheduler retries, cancellation and
/// generation leases stay trivially bounded.
pub struct PureTransformEngine {
    implementation: String,
}
impl PureTransformEngine {
    pub fn new(implementation: &str) -> Self {
        Self {
            implementation: implementation.into(),
        }
    }
    pub fn implementation(&self) -> &str {
        &self.implementation
    }
}
impl ComputeEngine for PureTransformEngine {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new(
            PURE_ENGINE_SLOT,
            &self.implementation,
            PURE_INTERFACE,
            PURE_OPERATIONS,
        )
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        let operation = request.operation.as_str();
        if !PURE_OPERATIONS.contains(&operation) {
            return Err(Error::Unsupported(format!(
                "operation {operation} is not a pure transform"
            )));
        }
        let fields = decode_fields(&request.data)?;
        let canonical = fields.join("\u{1f}");
        Ok(EngineOutput {
            data: format!(
                "{PURE_INTERFACE} {operation} fields={} fingerprint={}",
                fields.len(),
                fnv1a_hex(canonical.as_bytes())
            ),
        })
    }
}

/// Register the real pure transform engine in an existing registry, so the DAG
/// executor, scheduler, cancellation and generation leases are reused as-is.
/// `expected` is the compare-and-swap guard for replacement.
pub fn install_pure_engine(
    registry: &EngineRegistry,
    implementation: &str,
    expected: Option<u64>,
) -> Result<SwapReceipt> {
    registry.install(
        Arc::new(PureTransformEngine::new(implementation)),
        expected,
    )
}

/// Inverse of the typed DAG's length framing: `len:bytes` repeated.
fn decode_fields(data: &str) -> Result<Vec<&str>> {
    let bytes = data.as_bytes();
    let mut fields = Vec::new();
    let mut offset = 0usize;
    while offset < bytes.len() {
        let relative = bytes[offset..]
            .iter()
            .position(|b| *b == b':')
            .ok_or_else(|| Error::Invalid("malformed transform frame".into()))?;
        let colon = offset + relative;
        let len: usize = data[offset..colon]
            .parse()
            .map_err(|_| Error::Invalid("malformed transform frame length".into()))?;
        let start = colon + 1;
        let end = start
            .checked_add(len)
            .ok_or_else(|| Error::Invalid("transform frame overflow".into()))?;
        if end > bytes.len() || !data.is_char_boundary(start) || !data.is_char_boundary(end) {
            return Err(Error::Invalid("truncated transform frame".into()));
        }
        fields.push(&data[start..end]);
        offset = end;
    }
    Ok(fields)
}

/// FNV-1a over the canonical field sequence: std-only and deterministic.
fn fnv1a_hex(bytes: &[u8]) -> String {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in bytes {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{hash:016x}")
}

/// Cooperative cancellation across synchronous task boundaries. This cannot
/// interrupt an engine that is blocked inside ComputeEngine::execute.
#[derive(Clone, Default)]
pub struct CancellationToken {
    cancelled: Arc<AtomicBool>,
}
impl CancellationToken {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }
    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }
}
#[derive(Clone, Debug)]
pub struct Task {
    pub id: String,
    pub engine: String,
    pub operation: String,
    pub input: String,
    pub after: Vec<String>,
}
#[derive(Clone, Copy, Debug)]
pub struct Budget {
    pub max_tasks: usize,
    pub max_elapsed_ms: u128,
    pub max_output_bytes: usize,
}
impl Default for Budget {
    fn default() -> Self {
        Self {
            max_tasks: 100,
            max_elapsed_ms: 30_000,
            max_output_bytes: 4 * 1024 * 1024,
        }
    }
}
#[derive(Clone, Debug)]
pub struct TaskReceipt {
    pub id: String,
    pub engine: String,
    pub generation: u64,
    pub output: String,
    pub elapsed_ms: u128,
}
pub struct Scheduler<'a> {
    registry: &'a EngineRegistry,
}
impl<'a> Scheduler<'a> {
    pub fn new(registry: &'a EngineRegistry) -> Self {
        Self { registry }
    }
    /// Fail closed on missing tasks, duplicates, cycles, exceeded budgets or engine failure.
    /// Execution is synchronous; deadline is checked between calls and cannot preempt a hung plugin.
    pub fn run(&self, tasks: &[Task], budget: Budget) -> Result<Vec<TaskReceipt>> {
        self.run_cancellable(tasks, budget, &CancellationToken::new())
    }
    /// Cooperative, bounded, fail-closed scheduler entrypoint. No parallel queue
    /// or second runtime. Cancellation before/after an uninterruptible call
    /// means its output is discarded rather than accepted as completion.
    pub fn run_cancellable(
        &self,
        tasks: &[Task],
        budget: Budget,
        cancel: &CancellationToken,
    ) -> Result<Vec<TaskReceipt>> {
        if tasks.len() > budget.max_tasks {
            return Err(Error::Invalid("task budget exceeded".into()));
        }
        let mut pending: BTreeMap<String, &Task> = BTreeMap::new();
        for task in tasks {
            if pending.insert(task.id.clone(), task).is_some() || task.id.is_empty() {
                return Err(Error::Invalid("duplicate or empty task id".into()));
            }
        }
        for task in tasks {
            for dep in &task.after {
                if !pending.contains_key(dep) {
                    return Err(Error::Missing(format!("dependency {dep}")));
                }
            }
        }
        let start = Instant::now();
        let mut completed = BTreeSet::new();
        let mut output_bytes = 0usize;
        let mut receipts = Vec::new();
        while !pending.is_empty() {
            if cancel.is_cancelled() {
                return Err(Error::Conflict("execution cancelled".into()));
            }
            if start.elapsed().as_millis() > budget.max_elapsed_ms {
                return Err(Error::Conflict("execution time budget exceeded".into()));
            }
            let id = pending
                .iter()
                .find(|(_, task)| task.after.iter().all(|d| completed.contains(d)))
                .map(|(id, _)| id.clone())
                .ok_or_else(|| Error::Conflict("task dependency cycle".into()))?;
            let task = pending.remove(&id).unwrap();
            let lease = self.registry.pin(&task.engine)?;
            let started = Instant::now();
            let output = lease.execute(&EngineRequest {
                operation: task.operation.clone(),
                data: task.input.clone(),
            })?;
            if cancel.is_cancelled() {
                return Err(Error::Conflict("execution cancelled".into()));
            }
            output_bytes = output_bytes
                .checked_add(output.data.len())
                .ok_or_else(|| Error::Invalid("output budget overflow".into()))?;
            if output_bytes > budget.max_output_bytes {
                return Err(Error::Conflict("output budget exceeded".into()));
            }
            receipts.push(TaskReceipt {
                id: id.clone(),
                engine: task.engine.clone(),
                generation: lease.generation(),
                output: output.data,
                elapsed_ms: started.elapsed().as_millis(),
            });
            completed.insert(id);
        }
        Ok(receipts)
    }
}
