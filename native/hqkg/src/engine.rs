//! Generational in-process engine slots: existing leases remain valid after replacement.
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};
use std::time::Instant;

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
    pub fn active_generation(&self, slot: &str) -> Result<Option<u64>> {
        let map = self
            .active
            .read()
            .map_err(|_| Error::Conflict("registry poisoned".into()))?;
        Ok(map.get(slot).map(|g| g.generation))
    }
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
