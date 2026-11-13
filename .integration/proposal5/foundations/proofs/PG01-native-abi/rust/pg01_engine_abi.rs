//! PG01 add-only integration test for the existing pinned A hqkg crate.
 //! TEMP CHECKOUT ONLY: copy into native/hqkg/tests/pg01_engine_abi.rs.
 //! No admission/sandbox/grant is implemented or implied by these tests.
use hqkg::engine::{
    Budget, CancellationToken, ComputeEngine, EngineDescriptor, EngineOutput,
    EngineRegistry, EngineRequest, Scheduler, Task,
};
use hqkg::typed_dag::{
    DagExecutor, GraphDomain, IncrementalCache, Namespace, OutputState, RevisionToken,
    RunState, SourceBinding, TransformPlan, TransformStep, PURE_INTERFACE,
};
use hqkg::Result;
use std::sync::Arc;

const SLOT: &str = "semantic.grammar";
const OPS: &[&str] = &["interpret"];

struct ReviewedGrammar {
    implementation: &'static str,
    interface: &'static str,
    ops: &'static [&'static str],
}
impl ComputeEngine for ReviewedGrammar {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new(SLOT, self.implementation, self.interface, self.ops)
    }
    fn execute(&self, req: &EngineRequest) -> Result<EngineOutput> {
        Ok(EngineOutput {
            data: format!("{}:{}", self.implementation, req.data),
        })
    }
}
fn reviewed(
    implementation: &'static str,
    interface: &'static str,
    ops: &'static [&'static str],
) -> Arc<dyn ComputeEngine> {
    Arc::new(ReviewedGrammar { implementation, interface, ops })
}
fn req() -> EngineRequest {
    EngineRequest { operation: "interpret".into(), data: "show status".into() }
}
fn registry() -> EngineRegistry {
    let registry = EngineRegistry::new();
    let r = registry.install(reviewed("reviewed-v1", PURE_INTERFACE, OPS), None).unwrap();
    assert_eq!(r.slot, SLOT);
    assert_eq!(r.previous, None);
    assert_eq!(r.generation, 1);
    registry
}
#[test]
fn v1_pin_v2_swap_old_lease_stays_v1_and_rollback_is_new_generation() {
    let registry = registry();
    let old_v1 = registry.pin(SLOT).unwrap();
    assert_eq!(old_v1.generation(), 1);
    assert_eq!(old_v1.execute(&req()).unwrap().data, "reviewed-v1:show status");
    let swapped = registry.install(reviewed("reviewed-v2", PURE_INTERFACE, OPS), Some(1)).unwrap();
    assert_eq!((swapped.previous, swapped.generation), (Some(1), 2));
    let old_v2 = registry.pin(SLOT).unwrap();
    assert_eq!(old_v2.generation(), 2);
    assert_eq!(old_v2.execute(&req()).unwrap().data, "reviewed-v2:show status");
    assert_eq!(old_v1.execute(&req()).unwrap().data, "reviewed-v1:show status");
    // Owner-reviewed old implementation is INSTALLED AGAIN; history is not rewound.
    let rollback = registry.install(reviewed("reviewed-v1", PURE_INTERFACE, OPS), Some(2)).unwrap();
    assert_eq!((rollback.previous, rollback.generation), (Some(2), 3));
    assert_eq!(registry.active_generation(SLOT).unwrap(), Some(3));
    assert_eq!(registry.pin(SLOT).unwrap().execute(&req()).unwrap().data, "reviewed-v1:show status");
    assert_eq!(old_v2.execute(&req()).unwrap().data, "reviewed-v2:show status");
    assert_eq!(old_v1.execute(&req()).unwrap().data, "reviewed-v1:show status");
}
#[test]
fn compare_and_swap_interface_and_capability_guards_are_atomic() {
    let registry = registry();
    assert!(registry.install(reviewed("v2", PURE_INTERFACE, OPS), None).is_err());
    assert!(registry.install(reviewed("v2", PURE_INTERFACE, OPS), Some(99)).is_err());
    assert!(registry.install(reviewed("v2", "hqkg.effect/1", OPS), Some(1)).is_err());
    assert!(registry.install(reviewed("v2", PURE_INTERFACE, &["other"]), Some(1)).is_err());
    assert!(registry.install(reviewed("", PURE_INTERFACE, OPS), Some(1)).is_err());
    assert!(registry.install(reviewed("v2", "", OPS), Some(1)).is_err());
    assert!(registry.install(reviewed("v2", PURE_INTERFACE, &[]), Some(1)).is_err());
    assert_eq!(registry.active_generation(SLOT).unwrap(), Some(1));
    assert_eq!(registry.pin(SLOT).unwrap().execute(&req()).unwrap().data, "reviewed-v1:show status");
}
#[test]
fn existing_scheduler_refuses_budget_and_pre_cancel() {
    let registry = registry();
    let scheduler = Scheduler::new(&registry);
    let task = Task {
        id: "t1".into(), engine: SLOT.into(), operation: "interpret".into(),
        input: "hello".into(), after: vec![],
    };
    let too_many = Budget { max_tasks: 0, max_elapsed_ms: 1000, max_output_bytes: 1024 };
    assert!(scheduler.run(&[task.clone()], too_many).is_err());
    let too_small = Budget { max_tasks: 1, max_elapsed_ms: 1000, max_output_bytes: 1 };
    assert!(scheduler.run(&[task.clone()], too_small).is_err());
    let cancel = CancellationToken::new();
    cancel.cancel();
    assert!(scheduler.run_cancellable(&[task], Budget::default(), &cancel).is_err());
}
fn ns(owner: &str) -> Namespace {
    Namespace { domain: GraphDomain::Personal, owner: owner.into() }
}
fn token(owner: &str, epoch: u64) -> RevisionToken {
    RevisionToken { namespace: ns(owner), graph_epoch: epoch }
}
fn plan(owner: &str, source_revision: u64) -> TransformPlan {
    let namespace = ns(owner);
    TransformPlan {
        namespace: namespace.clone(),
        expected: token(owner, 4),
        steps: vec![TransformStep {
            id: "lexical".into(), engine: SLOT.into(), operation: "interpret".into(),
            input: "show status".into(), after: vec![], retry_io: 0,
            sources: vec![SourceBinding {
                namespace, id: "synthetic-source".into(), revision: source_revision,
                digest: "a".repeat(64), provenance: "synthetic-owner-claim".into(),
            }],
        }],
    }
}
#[test]
fn typed_dag_cache_revision_bounds_namespace_and_cancellation() {
    let registry = registry();
    let dag = DagExecutor::new(&registry);
    let mut cache = IncrementalCache::with_limits(2, 512);
    let policy = Budget { max_tasks: 2, max_elapsed_ms: 5_000, max_output_bytes: 512 };
    let cancel = CancellationToken::new();
    let actual = token("owner-a", 4);
    let first = dag.run(&plan("owner-a", 1), &actual, &mut cache, policy, &cancel).unwrap();
    assert_eq!(first.state, RunState::Complete);
    assert!(!first.effect_authorized);
    assert_eq!(first.outputs.len(), 1);
    assert_eq!(first.outputs[0].state, OutputState::Computed);
    let reused = dag.run(&plan("owner-a", 1), &actual, &mut cache, policy, &cancel).unwrap();
    assert_eq!(reused.outputs[0].state, OutputState::Reused);
    let newer = dag.run(&plan("owner-a", 2), &actual, &mut cache, policy, &cancel).unwrap();
    assert_eq!(newer.outputs[0].state, OutputState::Computed);
    assert!(cache.approximate_bytes() <= 512);
    assert!(dag.run(&plan("owner-a", 2), &token("owner-a", 5), &mut cache, policy, &cancel).is_err());
    assert!(dag.run(&plan("owner-a", 2), &token("owner-b", 4), &mut cache, policy, &cancel).is_err());
    let mut cross = plan("owner-a", 2);
    cross.steps[0].sources[0].namespace = ns("owner-b");
    assert!(dag.run(&cross, &actual, &mut cache, policy, &cancel).is_err());
    let cancelled = CancellationToken::new();
    cancelled.cancel();
    let report = dag.run(&plan("owner-a", 2), &actual, &mut cache, policy, &cancelled).unwrap();
    assert_eq!(report.state, RunState::Cancelled);
    let constrained = Budget { max_tasks: 1, max_elapsed_ms: 5000, max_output_bytes: 1 };
    let report = dag.run(&plan("owner-a", 2), &actual, &mut cache, constrained, &cancel).unwrap();
    assert_eq!(report.state, RunState::Backpressure);
    assert!(!report.effect_authorized);
}
// Fixture-only reducer precondition: this is NOT the real E, F or B admission path.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
struct PreviewFence {
    actor: u8,
    session: u8,
    input_revision: u64,
    graph_epoch: u64,
    source_epoch: u64,
    policy_revision: u64,
    engine_generation: u64,
}
fn test_only_reducer_accepts(incoming: PreviewFence, trusted_now: PreviewFence) -> bool {
    incoming == trusted_now
}
#[test]
fn synthetic_late_results_never_override_newer_preview() {
    let current = PreviewFence {
        actor: 1, session: 2, input_revision: 7, graph_epoch: 4,
        source_epoch: 5, policy_revision: 8, engine_generation: 2,
    };
    assert!(test_only_reducer_accepts(current, current));
    for stale in [
        PreviewFence { input_revision: 6, ..current },
        PreviewFence { source_epoch: 4, ..current },
        PreviewFence { graph_epoch: 3, ..current },
        PreviewFence { policy_revision: 7, ..current },
        PreviewFence { engine_generation: 1, ..current },
        PreviewFence { actor: 9, ..current },
        PreviewFence { session: 1, ..current },
    ] {
        assert!(!test_only_reducer_accepts(stale, current));
    }
    // Only a boolean is returned; no source ID, source content or Host receipt.
}
