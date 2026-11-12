use hqkg::control::*;
use hqkg::{
    ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry, EngineRequest, Error, Result,
};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};
struct Engine;
impl ComputeEngine for Engine {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("cache-graph", "trusted", "text-v1", &["lookup"])
    }
    fn execute(&self, r: &EngineRequest) -> Result<EngineOutput> {
        if r.data == "fail" {
            Err(Error::Conflict("simulated transient error".into()))
        } else {
            Ok(EngineOutput {
                data: r.data.clone(),
            })
        }
    }
}
struct CacheRepair {
    calls: Arc<AtomicUsize>,
    scope: RepairScope,
    passes: bool,
}
impl RepairAdapter for CacheRepair {
    fn scope(&self) -> RepairScope {
        self.scope
    }
    fn repair(&self) -> Result<()> {
        self.calls.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }
    fn probe(&self) -> Result<bool> {
        Ok(self.passes)
    }
}
#[test]
fn trusted_cache_self_heal_does_not_replay_original_op() {
    let engine = EngineRegistry::new();
    engine.install(Arc::new(Engine), None).unwrap();
    let mut sup = CoreSupervisor::new(&engine, CoreConfig::default()).unwrap();
    sup.policies.insert(
        "cache-graph".into(),
        EnginePolicy {
            production_ready: true,
            dependencies: vec![],
        },
    );
    let calls = Arc::new(AtomicUsize::new(0));
    sup.register_ephemeral_cache_repair(
        "cache-graph",
        Arc::new(CacheRepair {
            calls: calls.clone(),
            scope: RepairScope::EphemeralCache,
            passes: true,
        }),
    )
    .unwrap();
    assert!(sup
        .execute_read_only(
            "cache-graph",
            &EngineRequest {
                operation: "lookup".into(),
                data: "fail".into()
            }
        )
        .is_err());
    assert_eq!(calls.load(Ordering::SeqCst), 1);
    assert_eq!(sup.healing.receipts().count(), 1);
    assert!(sup.healing.receipts().next().unwrap().verified);
    assert_eq!(sup.health.state("cache-graph").status, HealthStatus::Ready);
    assert_eq!(sup.telemetry.summary("cache-graph").count, 1);
    // Failure did not turn into an unverified successful operation.
}
#[test]
fn auto_heal_scope_and_attempt_budget_fail_closed() {
    let calls = Arc::new(AtomicUsize::new(0));
    let mut monitor = HealthMonitor::default();
    let mut heal = HealingController::default();
    let external = CacheRepair {
        calls: calls.clone(),
        scope: RepairScope::ExternalSystem,
        passes: true,
    };
    monitor.failure("x", "io", 5);
    assert!(heal.attempt_safe("x", &external, &mut monitor, 5).is_err());
    assert_eq!(calls.load(Ordering::SeqCst), 0);
    let bad = CacheRepair {
        calls: calls.clone(),
        scope: RepairScope::EphemeralCache,
        passes: false,
    };
    assert!(
        !heal
            .attempt_safe("x", &bad, &mut monitor, 5)
            .unwrap()
            .verified
    );
    assert!(
        !heal
            .attempt_safe("x", &bad, &mut monitor, 5)
            .unwrap()
            .verified
    );
    assert!(heal.attempt_safe("x", &bad, &mut monitor, 5).is_err());
    assert_eq!(calls.load(Ordering::SeqCst), 2);
}
