use hqkg::utility_adapter::UtilityCompute;
use hqkg::{ComputeEngine, EngineRegistry, EngineRequest};
use std::sync::Arc;

fn run(engine: &UtilityCompute, operation: &str, data: &str) -> hqkg::Result<String> {
    Ok(engine
        .execute(&EngineRequest {
            operation: operation.into(),
            data: data.into(),
        })?
        .data)
}

#[test]
fn utility_engine_reuses_the_native_registry() {
    let registry = EngineRegistry::new();
    let engine = UtilityCompute::new("utility").unwrap();
    let desc = engine.descriptor();
    assert_eq!(desc.interface, "hqkg.utility.v1");
    assert_eq!(desc.capabilities.len(), 4);
    let receipt = registry.install(Arc::new(engine), None).unwrap();
    let pinned_old = registry.pin("utility").unwrap();
    let next = registry
        .install(
            Arc::new(UtilityCompute::new("utility").unwrap()),
            Some(receipt.generation),
        )
        .unwrap();
    assert_eq!(next.generation, receipt.generation + 1);
    assert_eq!(pinned_old.generation(), receipt.generation);
    let request = EngineRequest {
        operation: "upper".into(),
        data: "hello".into(),
    };
    assert_eq!(pinned_old.execute(&request).unwrap().data, "HELLO");
    assert_eq!(
        registry
            .pin("utility")
            .unwrap()
            .execute(&request)
            .unwrap()
            .data,
        "HELLO"
    );
}

#[test]
fn echo_upper_sum_work_without_optional_dependencies() {
    let engine = UtilityCompute::new("utility").unwrap();
    assert_eq!(run(&engine, "echo", "hello world").unwrap(), "hello world");
    assert_eq!(run(&engine, "upper", "hello café").unwrap(), "HELLO CAFÉ");
    assert_eq!(run(&engine, "sum", "1.25, 2.75\t6.5").unwrap(), "10.5");
    for invalid in ["", "1 NaN", "1 Infinity", "1 not-a-number", "1e308 1e308"] {
        assert!(run(&engine, "sum", invalid).is_err(), "{invalid}");
    }
}

#[test]
fn scripted_transformations_are_bounded_and_stateless() {
    let engine = UtilityCompute::new("utility").unwrap();
    assert_eq!(
        run(
            &engine,
            "script",
            "set x 1; add x 2.5; emit x; concat x hello world; emit x"
        )
        .unwrap(),
        "3.5\n3.5 hello world"
    );
    assert_eq!(
        run(&engine, "script", "set z two; set a one").unwrap(),
        "a=one\nz=two"
    );
    // Each call receives a fresh variable table: no implicit state or persistence.
    assert_eq!(run(&engine, "script", "emit x").unwrap(), "x");
    assert!(run(&engine, "script", "set x NaN; add x 1").is_err());
    assert!(run(&engine, "script", "shell echo hi").is_err());
    assert!(run(&engine, "script", "emit").is_err());
}

#[test]
fn resource_limits_and_bad_requests_fail_closed() {
    let engine = UtilityCompute::new("utility").unwrap();
    assert!(UtilityCompute::new("").is_err());
    assert!(UtilityCompute::new("bad\nslot").is_err());
    assert!(run(&engine, "upper", &"a".repeat(65_537)).is_err());
    assert!(run(&engine, "script", &"set x value;".repeat(129)).is_err());
    assert!(run(&engine, "script", &"emit a;".repeat(129)).is_err());
    let program = format!("set x {}; emit x; emit x", "a".repeat(40_000));
    assert!(run(&engine, "script", &program).is_err());
    assert!(run(&engine, "missing", "test").is_err());
}

#[test]
fn utility_adapter_can_join_existing_scheduler() {
    use hqkg::{Budget, Scheduler, Task};
    let registry = EngineRegistry::new();
    registry
        .install(Arc::new(UtilityCompute::new("utility").unwrap()), None)
        .unwrap();
    let receipts = Scheduler::new(&registry)
        .run(
            &[
                Task {
                    id: "a".into(),
                    engine: "utility".into(),
                    operation: "echo".into(),
                    input: "hello".into(),
                    after: vec![],
                },
                Task {
                    id: "b".into(),
                    engine: "utility".into(),
                    operation: "upper".into(),
                    input: "world".into(),
                    after: vec!["a".into()],
                },
            ],
            Budget::default(),
        )
        .unwrap();
    assert_eq!(receipts.len(), 2);
    assert_eq!(receipts[0].output, "hello");
    assert_eq!(receipts[1].output, "WORLD");
}
