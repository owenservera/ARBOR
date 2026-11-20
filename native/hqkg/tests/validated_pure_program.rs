//! NEXT:D03 — a validated pure VLANG program through the native DAG.
//!
//! Proves the acceptance: the program identity and dependency order that
//! core/programmability validated reach native execution through the existing
//! DagExecutor, IncrementalCache, scheduler, cancellation and generation
//! leases, and nothing is ever effect authorized.
use hqkg::engine::{
    install_pure_engine, Budget, CancellationToken, ComputeEngine, EngineRegistry, EngineRequest,
    PureTransformEngine, PURE_ENGINE_SLOT, PURE_INTERFACE, PURE_OPERATIONS,
};
use hqkg::typed_dag::{
    DagExecutor, GraphDomain, IncrementalCache, Namespace, OutputState, ProgramIdentity,
    RevisionToken, RunState, SourceBinding, TransformStep, ValidatedPureProgram, CONTRACT,
};
use hqkg::Result;

fn namespace() -> Namespace {
    Namespace {
        domain: GraphDomain::Development,
        owner: "owner-1".into(),
    }
}
fn revision(ns: &Namespace, epoch: u64) -> RevisionToken {
    RevisionToken {
        namespace: ns.clone(),
        graph_epoch: epoch,
    }
}
/// The length framing the typed DAG and the pure engine agree on.
fn frame(fields: &[&str]) -> String {
    let mut out = String::new();
    for field in fields {
        out.push_str(&field.len().to_string());
        out.push(':');
        out.push_str(field);
    }
    out
}
fn identity(revision: u64) -> ProgramIdentity {
    ProgramIdentity::new("mission", revision, 3).unwrap()
}
fn source(ns: &Namespace) -> SourceBinding {
    SourceBinding {
        namespace: ns.clone(),
        id: "context".into(),
        revision: 1,
        digest: "a".repeat(64),
        provenance: "native-program/mission@7".into(),
    }
}
fn step(id: &str, operation: &str, after: &[&str], ns: &Namespace) -> TransformStep {
    TransformStep {
        id: id.into(),
        engine: PURE_ENGINE_SLOT.into(),
        operation: operation.into(),
        input: operation.into(),
        sources: vec![source(ns)],
        after: after.iter().map(|s| (*s).to_string()).collect(),
        retry_io: 0,
    }
}
/// Authored out of order, exactly as a validated program may be; the validated
/// program carries the topological order.
fn program(ns: &Namespace) -> ValidatedPureProgram {
    ValidatedPureProgram::new(
        identity(7),
        ns.clone(),
        revision(ns, 1),
        vec![
            step("publish", "project", &["transform"], ns),
            step("transform", "evaluate", &["read"], ns),
            step("read", "normalize", &[], ns),
        ],
    )
    .unwrap()
}
fn registry() -> EngineRegistry {
    let registry = EngineRegistry::new();
    let receipt = install_pure_engine(&registry, "builtin-vlang-pure-v1", None).unwrap();
    assert_eq!(receipt.slot, PURE_ENGINE_SLOT);
    assert_eq!((receipt.previous, receipt.generation), (None, 1));
    registry
}
fn run(
    registry: &EngineRegistry,
    program: &ValidatedPureProgram,
    cache: &mut IncrementalCache,
    budget: Budget,
    cancel: &CancellationToken,
) -> Result<hqkg::typed_dag::DagReport> {
    DagExecutor::new(registry).run_validated(
        program,
        &program.expected,
        cache,
        budget,
        cancel,
    )
}

#[test]
fn pure_contract_literals_are_the_shared_hqkg_contract() {
    assert_eq!(PURE_ENGINE_SLOT, "vlang.pure");
    assert_eq!(PURE_INTERFACE, "hqkg.transform.pure/1");
    assert_eq!(CONTRACT, "hqkg.typed-dag/1");
    assert_eq!(
        PURE_OPERATIONS,
        &[
            "normalize",
            "select-context",
            "interpret",
            "compile",
            "evaluate",
            "project"
        ]
    );
}

#[test]
fn identity_and_dependencies_reach_the_dag_without_effect_authorization() {
    let registry = registry();
    let ns = namespace();
    let validated = program(&ns);
    let mut cache = IncrementalCache::new();
    let report = run(
        &registry,
        &validated,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )
    .unwrap();

    assert_eq!(report.state, RunState::Complete);
    assert_eq!(report.schema, CONTRACT);
    assert!(!report.effect_authorized);
    assert!(report.failed_step.is_none() && report.failure.is_none());
    // Dependency order, not authoring order, is what executed.
    assert_eq!(
        report
            .outputs
            .iter()
            .map(|o| o.step_id.as_str())
            .collect::<Vec<_>>(),
        vec!["read", "transform", "publish"]
    );
    // The validated program identity is framed into every materialized output,
    // so cache entries and outputs stay bound to that exact program revision.
    let stamp = validated.identity.stamp();
    assert_eq!(stamp, "mission@7#3");
    for output in &report.outputs {
        assert!(
            output.input_stamp.contains(&stamp),
            "missing identity in {}",
            output.input_stamp
        );
        assert_eq!(output.state, OutputState::Computed);
        assert_eq!(output.generation, 1);
        assert!(output.data.starts_with(PURE_INTERFACE));
        assert!(!output.provenance.is_empty());
    }
    // Downstream input really is the upstream materialized output.
    let published = report
        .outputs
        .iter()
        .find(|o| o.step_id == "publish")
        .unwrap();
    let transformed = report
        .outputs
        .iter()
        .find(|o| o.step_id == "transform")
        .unwrap();
    assert!(published.input_stamp.contains(&transformed.data));
}

#[test]
fn incremental_cache_reuses_materialized_outputs() {
    let registry = registry();
    let ns = namespace();
    let validated = program(&ns);
    let mut cache = IncrementalCache::new();
    let first = run(
        &registry,
        &validated,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )
    .unwrap();
    let second = run(
        &registry,
        &validated,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )
    .unwrap();

    assert_eq!(first.outputs.len(), 3);
    assert_eq!(cache.len(), 3);
    assert!(second
        .outputs
        .iter()
        .all(|o| o.state == OutputState::Reused));
    assert_eq!(
        second
            .outputs
            .iter()
            .map(|o| o.data.clone())
            .collect::<Vec<_>>(),
        first
            .outputs
            .iter()
            .map(|o| o.data.clone())
            .collect::<Vec<_>>()
    );
    assert!(!second.effect_authorized);
}

#[test]
fn program_identity_change_recomputes_instead_of_reusing() {
    let registry = registry();
    let ns = namespace();
    let mut cache = IncrementalCache::new();
    let first = run(
        &registry,
        &program(&ns),
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )
    .unwrap();
    let bumped = ValidatedPureProgram::new(
        identity(8),
        ns.clone(),
        revision(&ns, 1),
        program(&ns).steps,
    )
    .unwrap();
    let second = run(
        &registry,
        &bumped,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )
    .unwrap();

    assert!(second
        .outputs
        .iter()
        .all(|o| o.state == OutputState::Computed));
    assert!(second
        .outputs
        .iter()
        .all(|o| o.input_stamp.contains("mission@8#3")));
    assert_ne!(
        second.outputs[0].data,
        first.outputs[0].data,
        "identity must be part of the pure fingerprint"
    );
}

#[test]
fn generation_swap_recomputes_and_leases_stay_valid() {
    let registry = registry();
    let ns = namespace();
    let validated = program(&ns);
    let old_lease = registry.pin(PURE_ENGINE_SLOT).unwrap();
    let mut cache = IncrementalCache::new();
    let first = run(
        &registry,
        &validated,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )
    .unwrap();
    assert!(first.outputs.iter().all(|o| o.generation == 1));

    let swapped = install_pure_engine(&registry, "builtin-vlang-pure-v2", Some(1)).unwrap();
    assert_eq!((swapped.previous, swapped.generation), (Some(1), 2));
    // The pre-swap lease still executes against its own generation.
    assert_eq!(old_lease.descriptor().implementation, "builtin-vlang-pure-v1");
    assert_eq!(old_lease.generation(), 1);
    assert!(old_lease
        .execute(&EngineRequest {
            operation: "evaluate".into(),
            data: "1:a".into(),
        })
        .is_ok());

    let second = run(
        &registry,
        &validated,
        &mut cache,
        Budget::default(),
        &CancellationToken::new(),
    )
    .unwrap();
    // New generation invalidates the cache stamp, so every step recomputes.
    assert!(second
        .outputs
        .iter()
        .all(|o| o.state == OutputState::Computed));
    assert!(second.outputs.iter().all(|o| o.generation == 2));
    assert_eq!(registry.active_generation(PURE_ENGINE_SLOT).unwrap(), Some(2));
}

#[test]
fn cancellation_and_backpressure_stay_bounded() {
    let registry = registry();
    let ns = namespace();
    let validated = program(&ns);
    let cancel = CancellationToken::new();
    cancel.cancel();
    let mut cache = IncrementalCache::new();
    let cancelled = run(
        &registry,
        &validated,
        &mut cache,
        Budget::default(),
        &cancel,
    )
    .unwrap();
    assert_eq!(cancelled.state, RunState::Cancelled);
    assert_eq!(cancelled.failed_step.as_deref(), Some("read"));
    assert_eq!(cache.len(), 0);

    let timed_out = run(
        &registry,
        &validated,
        &mut IncrementalCache::new(),
        Budget {
            max_elapsed_ms: 0,
            ..Budget::default()
        },
        &CancellationToken::new(),
    )
    .unwrap();
    assert_eq!(timed_out.state, RunState::Backpressure);
}

#[test]
fn non_pure_programs_are_refused_before_any_engine_runs() {
    let ns = namespace();

    let effect = step("publish", "effect", &[], &ns);
    assert!(ValidatedPureProgram::new(
        identity(7),
        ns.clone(),
        revision(&ns, 1),
        vec![effect]
    )
    .is_err());

    let mut foreign = step("read", "normalize", &[], &ns);
    foreign.engine = "other".into();
    assert!(ValidatedPureProgram::new(
        identity(7),
        ns.clone(),
        revision(&ns, 1),
        vec![foreign]
    )
    .is_err());

    let zero_revision = ProgramIdentity {
        id: "mission".into(),
        revision: 0,
        policy_revision: 3,
    };
    assert!(ValidatedPureProgram::new(
        zero_revision,
        ns.clone(),
        revision(&ns, 1),
        vec![step("read", "normalize", &[], &ns)]
    )
    .is_err());

    let cyclic = ValidatedPureProgram::new(
        identity(7),
        ns.clone(),
        revision(&ns, 1),
        vec![
            step("a", "evaluate", &["b"], &ns),
            step("b", "evaluate", &["a"], &ns),
        ],
    );
    assert!(cyclic.is_err());

    // A stale actual revision token is refused by the executor, not by new().
    let validated = program(&ns);
    let registry = registry();
    let stale = DagExecutor::new(&registry).run(
        &validated.plan(),
        &revision(&ns, 2),
        &mut IncrementalCache::new(),
        Budget::default(),
        &CancellationToken::new(),
    );
    assert!(stale.is_err());
}

#[test]
fn pure_engine_is_deterministic_effect_free_and_framing_bounded() {
    let engine = PureTransformEngine::new("builtin-vlang-pure-v1");
    let descriptor = engine.descriptor();
    assert_eq!(descriptor.slot, PURE_ENGINE_SLOT);
    assert_eq!(descriptor.interface, PURE_INTERFACE);
    assert_eq!(descriptor.implementation, "builtin-vlang-pure-v1");
    assert_eq!(descriptor.capabilities.len(), PURE_OPERATIONS.len());

    let request = EngineRequest {
        operation: "evaluate".into(),
        data: frame(&["hqkg.typed-dag/1", "evaluate-local", "context"]),
    };
    let first = engine.execute(&request).unwrap();
    let second = engine.execute(&request).unwrap();
    assert_eq!(first.data, second.data);
    assert!(first.data.starts_with(&format!("{PURE_INTERFACE} evaluate fields=")));

    // Reordered framing is a different computation, not a cache hit.
    let reordered = engine
        .execute(&EngineRequest {
            operation: "evaluate".into(),
            data: frame(&["evaluate-local", "hqkg.typed-dag/1", "context"]),
        })
        .unwrap();
    assert_ne!(first.data, reordered.data);

    // Effects are outside the pure capability set.
    assert!(engine
        .execute(&EngineRequest {
            operation: "effect".into(),
            data: String::new(),
        })
        .is_err());
    // Truncated / malformed framing fails closed.
    assert!(engine
        .execute(&EngineRequest {
            operation: "evaluate".into(),
            data: "999:short".into(),
        })
        .is_err());
}