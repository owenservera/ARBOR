use hqkg::engine::{
    Budget, CancellationToken, ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry,
    EngineRequest,
};
use hqkg::typed_dag::*;
use hqkg::{Error, Result};
use std::io;
use std::sync::{
    atomic::{AtomicBool, AtomicUsize, Ordering},
    Arc,
};

struct Pure {
    implementation: &'static str,
    calls: Arc<AtomicUsize>,
    fail_once: Arc<AtomicBool>,
}
impl ComputeEngine for Pure {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("pure", self.implementation, PURE_INTERFACE, &["evaluate", "interpret"])
    }
    fn execute(&self, req: &EngineRequest) -> Result<EngineOutput> {
        self.calls.fetch_add(1, Ordering::SeqCst);
        if self.fail_once.swap(false, Ordering::SeqCst) {
            return Err(Error::Io(io::Error::new(
                io::ErrorKind::Interrupted,
                "transient",
            )));
        }
        Ok(EngineOutput {
            data: req.data.clone(),
        })
    }
}
fn registry() -> (EngineRegistry, Arc<AtomicUsize>) {
    let reg = EngineRegistry::new();
    let calls = Arc::new(AtomicUsize::new(0));
    reg.install(
        Arc::new(Pure {
            implementation: "v1",
            calls: calls.clone(),
            fail_once: Arc::new(AtomicBool::new(false)),
        }),
        None,
    )
    .unwrap();
    (reg, calls)
}
fn ns(domain: GraphDomain) -> Namespace {
    Namespace {
        domain,
        owner: "owner-1".into(),
    }
}
fn rev(ns: &Namespace, epoch: u64) -> RevisionToken {
    RevisionToken {
        namespace: ns.clone(),
        graph_epoch: epoch,
    }
}
fn source(ns: &Namespace) -> SourceBinding {
    SourceBinding {
        namespace: ns.clone(),
        id: "source".into(),
        revision: 1,
        digest: "a".repeat(64),
        provenance: "trusted-source".into(),
    }
}
fn step(id: &str, after: &[&str], ns: &Namespace) -> TransformStep {
    TransformStep {
        id: id.into(),
        engine: "pure".into(),
        operation: "evaluate".into(),
        input: "example".into(),
        sources: vec![source(ns)],
        after: after.iter().map(|s| s.to_string()).collect(),
        retry_io: 0,
    }
}
fn plan(ns: Namespace) -> TransformPlan {
    TransformPlan {
        expected: rev(&ns, 1),
        namespace: ns.clone(),
        steps: vec![step("b", &["a"], &ns), step("a", &[], &ns)],
    }
}
fn execute(reg: &EngineRegistry, p: &TransformPlan, c: &mut IncrementalCache) -> DagReport {
    DagExecutor::new(reg)
        .run(
            p,
            &p.expected,
            c,
            Budget::default(),
            &CancellationToken::new(),
        )
        .unwrap()
}
#[test]
fn dependency_order_cache_hits_and_namespace_separation() {
    let (reg, calls) = registry();
    let mut cache = IncrementalCache::new();
    let p = plan(ns(GraphDomain::Development));
    let first = execute(&reg, &p, &mut cache);
    assert_eq!(first.state, RunState::Complete);
    assert_eq!(
        first
            .outputs
            .iter()
            .map(|r| r.step_id.as_str())
            .collect::<Vec<_>>(),
        vec!["a", "b"]
    );
    assert!(first
        .outputs
        .iter()
        .all(|r| r.state == OutputState::Computed));
    assert!(!first.effect_authorized);
    assert_eq!(calls.load(Ordering::SeqCst), 2);
    let second = execute(&reg, &p, &mut cache);
    assert!(second
        .outputs
        .iter()
        .all(|r| r.state == OutputState::Reused));
    assert_eq!(calls.load(Ordering::SeqCst), 2);
    let personal = plan(ns(GraphDomain::Personal));
    assert_eq!(
        execute(&reg, &personal, &mut cache).state,
        RunState::Complete
    );
    assert_eq!(calls.load(Ordering::SeqCst), 4);
    assert_eq!(cache.len(), 4);
}
#[test]
fn only_modified_source_and_dependents_recompute() {
    let (reg, calls) = registry();
    let mut cache = IncrementalCache::new();
    let mut p = plan(ns(GraphDomain::Development));
    execute(&reg, &p, &mut cache);
    p.steps.iter_mut().find(|s| s.id == "a").unwrap().sources[0].revision = 2;
    p.steps.iter_mut().find(|s| s.id == "a").unwrap().sources[0].digest = "b".repeat(64);
    let report = execute(&reg, &p, &mut cache);
    assert!(report
        .outputs
        .iter()
        .all(|x| x.state == OutputState::Computed));
    assert_eq!(calls.load(Ordering::SeqCst), 4);
}
#[test]
fn graph_revision_and_cross_namespace_sources_refused() {
    let (reg, _) = registry();
    let mut cache = IncrementalCache::new();
    let mut p = plan(ns(GraphDomain::Development));
    assert!(DagExecutor::new(&reg)
        .run(
            &p,
            &rev(&p.namespace, 2),
            &mut cache,
            Budget::default(),
            &CancellationToken::new()
        )
        .is_err());
    p.steps[0].sources[0].namespace = ns(GraphDomain::Personal);
    assert!(DagExecutor::new(&reg)
        .run(
            &p,
            &p.expected,
            &mut cache,
            Budget::default(),
            &CancellationToken::new()
        )
        .is_err());
    assert_eq!(cache.len(), 0);
}
#[test]
fn cancellation_never_commits_partial_cache() {
    let (reg, calls) = registry();
    let mut cache = IncrementalCache::new();
    let p = plan(ns(GraphDomain::Personal));
    let stop = CancellationToken::new();
    stop.cancel();
    let r = DagExecutor::new(&reg)
        .run(&p, &p.expected, &mut cache, Budget::default(), &stop)
        .unwrap();
    assert_eq!(r.state, RunState::Cancelled);
    assert_eq!(calls.load(Ordering::SeqCst), 0);
    assert_eq!(cache.len(), 0);
}
#[test]
fn generation_swap_invalidates_cached_engine_output() {
    let (reg, calls) = registry();
    let mut cache = IncrementalCache::new();
    let p = plan(ns(GraphDomain::Development));
    execute(&reg, &p, &mut cache);
    reg.install(
        Arc::new(Pure {
            implementation: "v2",
            calls: calls.clone(),
            fail_once: Arc::new(AtomicBool::new(false)),
        }),
        Some(1),
    )
    .unwrap();
    let r = execute(&reg, &p, &mut cache);
    assert!(r
        .outputs
        .iter()
        .all(|x| x.generation == 2 && x.state == OutputState::Computed));
    assert_eq!(calls.load(Ordering::SeqCst), 4);
}
#[test]
fn missing_cycle_and_duplicate_steps_are_rejected() {
    let (reg, _) = registry();
    let mut cache = IncrementalCache::new();
    let mut p = plan(ns(GraphDomain::Development));
    p.steps[0].after = vec!["missing".into()];
    assert!(DagExecutor::new(&reg)
        .run(
            &p,
            &p.expected,
            &mut cache,
            Budget::default(),
            &CancellationToken::new()
        )
        .is_err());
    p.steps[0].after = vec!["a".into()];
    p.steps[1].after = vec!["b".into()];
    assert!(DagExecutor::new(&reg)
        .run(
            &p,
            &p.expected,
            &mut cache,
            Budget::default(),
            &CancellationToken::new()
        )
        .is_err());
    p.steps[1].id = "b".into();
    p.steps[1].after.clear();
    assert!(DagExecutor::new(&reg)
        .run(
            &p,
            &p.expected,
            &mut cache,
            Budget::default(),
            &CancellationToken::new()
        )
        .is_err());
}
#[test]
fn partial_failure_is_explicit_and_does_not_commit_cache() {
    let reg = EngineRegistry::new();
    let calls = Arc::new(AtomicUsize::new(0));
    reg.install(
        Arc::new(Pure {
            implementation: "v1",
            calls: calls.clone(),
            fail_once: Arc::new(AtomicBool::new(true)),
        }),
        None,
    )
    .unwrap();
    let p = plan(ns(GraphDomain::Development));
    let mut cache = IncrementalCache::new();
    let r = execute(&reg, &p, &mut cache);
    assert_eq!(r.state, RunState::Failed);
    assert_eq!(r.failed_step.as_deref(), Some("a"));
    assert_eq!(cache.len(), 0);
}
#[test]
#[allow(non_snake_case)]
fn IO_retry_is_opt_in_bounded_and_pure_only() {
    let reg = EngineRegistry::new();
    let calls = Arc::new(AtomicUsize::new(0));
    reg.install(
        Arc::new(Pure {
            implementation: "v1",
            calls: calls.clone(),
            fail_once: Arc::new(AtomicBool::new(true)),
        }),
        None,
    )
    .unwrap();
    let mut p = plan(ns(GraphDomain::Development));
    p.steps.iter_mut().find(|x| x.id == "a").unwrap().retry_io = 1;
    let mut cache = IncrementalCache::new();
    let r = execute(&reg, &p, &mut cache);
    assert_eq!(r.state, RunState::Complete);
    assert_eq!(calls.load(Ordering::SeqCst), 3);
}
#[test]
fn bounded_tasks_refuse_before_dispatch() {
    let (reg, calls) = registry();
    let mut cache = IncrementalCache::new();
    let p = plan(ns(GraphDomain::Development));
    let result = DagExecutor::new(&reg).run(
        &p,
        &p.expected,
        &mut cache,
        Budget {
            max_tasks: 1,
            max_elapsed_ms: 1000,
            max_output_bytes: 10000,
        },
        &CancellationToken::new(),
    );
    assert!(result.is_err());
    assert_eq!(calls.load(Ordering::SeqCst), 0);
}

#[test]
fn real_graph_change_set_invalidates_only_matching_namespace() {
    let (reg, _) = registry();
    let mut cache = IncrementalCache::new();
    let development = plan(ns(GraphDomain::Development));
    let personal = plan(ns(GraphDomain::Personal));
    execute(&reg, &development, &mut cache);
    execute(&reg, &personal, &mut cache);
    let mut graph = hqkg::Graph::new();
    let mut ledger = hqkg::graph_change_set::ApplyLedger::new();
    let change = hqkg::graph_change_set::GraphChangeSet::new("cs1", "owner").put_node(
        hqkg::Node::new("source", hqkg::NodeKind::Document, "changed"),
    );
    let applied = hqkg::graph_change_set::apply(&mut graph, &change, &mut ledger).unwrap();
    assert!(applied.invalidation_set.contains("source"));
    assert_eq!(
        cache.invalidate_changes(&development.namespace, &applied),
        2
    );
    assert_eq!(cache.len(), 2);
    let personal_result = execute(&reg, &personal, &mut cache);
    assert!(personal_result
        .outputs
        .iter()
        .all(|x| x.state == OutputState::Reused));
}

#[test]
fn cache_retention_is_bounded_without_failing_valid_computation() {
    let (reg, calls) = registry();
    let mut cache = IncrementalCache::with_limits(1, 1024 * 1024);
    let p = plan(ns(GraphDomain::Development));
    let r = execute(&reg, &p, &mut cache);
    assert_eq!(r.state, RunState::Complete);
    assert_eq!(r.outputs.len(), 2);
    assert_eq!(calls.load(Ordering::SeqCst), 2);
    assert_eq!(cache.len(), 1);
    let mut no_cache = IncrementalCache::with_limits(0, 0);
    assert_eq!(execute(&reg, &p, &mut no_cache).state, RunState::Complete);
    assert_eq!(no_cache.len(), 0);
}

#[test]
fn changed_operation_and_snapshot_cannot_reuse_previous_output() {
    let (reg, calls) = registry();
    let mut cache = IncrementalCache::new();
    let mut p = plan(ns(GraphDomain::Development));
    execute(&reg, &p, &mut cache);
    p.steps.iter_mut().find(|s| s.id == "b").unwrap().operation = "interpret".into();
    let report = execute(&reg, &p, &mut cache);
    assert_eq!(report.outputs[0].state, OutputState::Reused);
    assert_eq!(report.outputs[1].state, OutputState::Computed);
    assert_eq!(calls.load(Ordering::SeqCst), 3);
    p.expected.graph_epoch += 1;
    let report = execute(&reg, &p, &mut cache);
    assert!(report.outputs.iter().all(|x| x.state == OutputState::Computed));
    assert_eq!(calls.load(Ordering::SeqCst), 5);
}

#[test]
fn source_invalidation_includes_transitive_consumers_without_direct_sources() {
    let (reg, _) = registry();
    let mut cache = IncrementalCache::new();
    let mut p = plan(ns(GraphDomain::Development));
    p.steps.iter_mut().find(|s| s.id == "b").unwrap().sources.clear();
    let mut leaf = step("c", &["b"], &p.namespace);
    leaf.sources.clear();
    p.steps.push(leaf);
    let report = execute(&reg, &p, &mut cache);
    assert_eq!(report.state, RunState::Complete);
    let mut graph = hqkg::Graph::new();
    let mut ledger = hqkg::graph_change_set::ApplyLedger::new();
    let change = hqkg::graph_change_set::GraphChangeSet::new("transitive", "owner").put_node(
        hqkg::Node::new("source", hqkg::NodeKind::Document, "changed"),
    );
    let applied = hqkg::graph_change_set::apply(&mut graph, &change, &mut ledger).unwrap();
    assert_eq!(cache.invalidate_changes(&p.namespace, &applied), 3);
    assert_eq!(cache.len(), 0);
}

#[test]
fn separate_registries_with_identical_numeric_generation_never_share_cache_hits() {
    let (first, first_calls) = registry();
    let (second, second_calls) = registry();
    let p = plan(ns(GraphDomain::Development));
    let mut cache = IncrementalCache::new();
    assert_eq!(execute(&first, &p, &mut cache).state, RunState::Complete);
    let report = execute(&second, &p, &mut cache);
    assert!(report.outputs.iter().all(|out| out.state == OutputState::Computed));
    assert_eq!(first_calls.load(Ordering::SeqCst), 2);
    assert_eq!(second_calls.load(Ordering::SeqCst), 2);
    assert!(execute(&second, &p, &mut cache).outputs.iter().all(|out| out.state == OutputState::Reused));
}

struct ReplaceEarlierEngine {
    registry: std::sync::Weak<EngineRegistry>,
}
impl ComputeEngine for ReplaceEarlierEngine {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("replace", "test", PURE_INTERFACE, &["evaluate"])
    }
    fn execute(&self, _req: &EngineRequest) -> Result<EngineOutput> {
        self.registry.upgrade().unwrap().install(Arc::new(Pure {
            implementation: "v2",
            calls: Arc::new(AtomicUsize::new(0)),
            fail_once: Arc::new(AtomicBool::new(false)),
        }), Some(1))?;
        Ok(EngineOutput { data: "replacement occurred".into() })
    }
}

#[test]
fn replacement_of_an_earlier_engine_prevents_completed_dag_and_cache_commit() {
    let (registry, _) = registry();
    let registry = Arc::new(registry);
    registry.install(Arc::new(ReplaceEarlierEngine {
        registry: Arc::downgrade(&registry),
    }), None).unwrap();
    let mut p = plan(ns(GraphDomain::Development));
    p.steps.iter_mut().find(|s| s.id == "b").unwrap().engine = "replace".into();
    let mut cache = IncrementalCache::new();
    let report = execute(&registry, &p, &mut cache);
    assert_eq!(report.state, RunState::StaleGeneration);
    assert_eq!(cache.len(), 0);
    assert!(!report.effect_authorized);
}

#[test]
fn shared_provenance_is_deduplicated_across_diamond_dependencies() {
    let (registry, _) = registry();
    let namespace = ns(GraphDomain::Development);
    let p = TransformPlan {
        expected: rev(&namespace, 1),
        namespace: namespace.clone(),
        steps: vec![
            step("d", &["b", "c"], &namespace),
            step("c", &["a"], &namespace),
            step("b", &["a"], &namespace),
            step("a", &[], &namespace),
        ],
    };
    let report = execute(&registry, &p, &mut IncrementalCache::new());
    assert_eq!(report.state, RunState::Complete);
    for out in report.outputs {
        assert_eq!(out.provenance, vec!["trusted-source".to_string()]);
    }
}

struct ConstantOutput;
impl ComputeEngine for ConstantOutput {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("pure", "constant-test", PURE_INTERFACE, &["evaluate"])
    }
    fn execute(&self, _req: &EngineRequest) -> Result<EngineOutput> {
        Ok(EngineOutput { data: "unchanged value".into() })
    }
}

#[test]
fn reused_materialization_refreshes_changed_transitive_sources_and_provenance() {
    let reg = EngineRegistry::new();
    reg.install(Arc::new(ConstantOutput), None).unwrap();
    let mut p = plan(ns(GraphDomain::Development));
    p.steps.iter_mut().find(|s| s.id == "b").unwrap().sources.clear();
    let mut cache = IncrementalCache::new();
    assert_eq!(execute(&reg, &p, &mut cache).state, RunState::Complete);
    let root = p.steps.iter_mut().find(|s| s.id == "a").unwrap();
    root.sources[0].id = "new-source".into();
    root.sources[0].provenance = "new-provenance".into();
    let report = execute(&reg, &p, &mut cache);
    assert_eq!(report.outputs[0].state, OutputState::Computed);
    assert_eq!(report.outputs[1].state, OutputState::Reused);
    assert_eq!(report.outputs[1].provenance, vec!["new-provenance".to_string()]);
    let warm = execute(&reg, &p, &mut cache);
    assert!(warm.outputs.iter().all(|out| out.state == OutputState::Reused));
    assert_eq!(warm.outputs[1].provenance, report.outputs[1].provenance);
    let mut graph = hqkg::Graph::new();
    let mut ledger = hqkg::graph_change_set::ApplyLedger::new();
    let changes = hqkg::graph_change_set::GraphChangeSet::new("new-source-change", "owner")
        .put_node(hqkg::Node::new("new-source", hqkg::NodeKind::Document, "changed"));
    let applied = hqkg::graph_change_set::apply(&mut graph, &changes, &mut ledger).unwrap();
    assert_eq!(cache.invalidate_changes(&p.namespace, &applied), 2);
    assert_eq!(cache.len(), 0);
}
