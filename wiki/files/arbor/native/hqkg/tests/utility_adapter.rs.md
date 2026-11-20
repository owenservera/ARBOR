# File: native/hqkg/tests/utility_adapter.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/utility_adapter.rs |
| Language | Rust |
| Kind | source |
| Size | 4486 B |
| Lines | 125 |
| Hash | fb3179cbfc94 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| run | function | 5 | no | fn run(engine: &amp;UtilityCompute, operation: &amp;str, data: &amp;str) -&gt; hqkg::Result&lt;String&gt; { |
| utility_engine_reuses_the_native_registry | function | 15 | no | fn utility_engine_reuses_the_native_registry() { |
| echo_upper_sum_work_without_optional_dependencies | function | 48 | no | fn echo_upper_sum_work_without_optional_dependencies() { |
| scripted_transformations_are_bounded_and_stateless | function | 59 | no | fn scripted_transformations_are_bounded_and_stateless() { |
| resource_limits_and_bad_requests_fail_closed | function | 82 | no | fn resource_limits_and_bad_requests_fail_closed() { |
| utility_adapter_can_join_existing_scheduler | function | 95 | no | fn utility_adapter_can_join_existing_scheduler() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::utility_adapter::UtilityCompute | use | 1 | external |
| hqkg::{ComputeEngine, EngineRegistry, EngineRequest} | use | 2 | external |
| std::sync::Arc | use | 3 | external |
| hqkg::{Budget, Scheduler, Task} | use | 96 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 126 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
