# File: native/hqkg/tests/validated_pure_program.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/validated_pure_program.rs |
| Language | Rust |
| Kind | source |
| Size | 12956 B |
| Lines | 444 |
| Hash | 6096d2c85725 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| revision | function | 23 | no | fn revision(ns: &amp;Namespace, epoch: u64) -&gt; RevisionToken { |
| frame | function | 30 | no | fn frame(fields: &amp;[&amp;str]) -&gt; String { |
| identity | function | 39 | no | fn identity(revision: u64) -&gt; ProgramIdentity { |
| source | function | 42 | no | fn source(ns: &amp;Namespace) -&gt; SourceBinding { |
| step | function | 51 | no | fn step(id: &amp;str, operation: &amp;str, after: &amp;[&amp;str], ns: &amp;Namespace) -&gt; TransformStep { |
| program | function | 64 | no | fn program(ns: &amp;Namespace) -&gt; ValidatedPureProgram { |
| registry | function | 77 | no | fn registry() -&gt; EngineRegistry { |
| run | function | 84 | no | fn run( registry: &amp;EngineRegistry, program: &amp;ValidatedPureProgram, cache: &amp;mut IncrementalCache, budget: Budget, |
| pure_contract_literals_are_the_shared_hqkg_contract | function | 101 | no | fn pure_contract_literals_are_the_shared_hqkg_contract() { |
| identity_and_dependencies_reach_the_dag_without_effect_authorization | function | 119 | no | fn identity_and_dependencies_reach_the_dag_without_effect_authorization() { |
| incremental_cache_reuses_materialized_outputs | function | 176 | no | fn incremental_cache_reuses_materialized_outputs() { |
| program_identity_change_recomputes_instead_of_reusing | function | 220 | no | fn program_identity_change_recomputes_instead_of_reusing() { |
| generation_swap_recomputes_and_leases_stay_valid | function | 264 | no | fn generation_swap_recomputes_and_leases_stay_valid() { |
| cancellation_and_backpressure_stay_bounded | function | 310 | no | fn cancellation_and_backpressure_stay_bounded() { |
| non_pure_programs_are_refused_before_any_engine_runs | function | 344 | no | fn non_pure_programs_are_refused_before_any_engine_runs() { |
| pure_engine_is_deterministic_effect_free_and_framing_bounded | function | 404 | no | fn pure_engine_is_deterministic_effect_free_and_framing_bounded() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::engine::{ | use | 7 | external |
| hqkg::typed_dag::{ | use | 11 | external |
| hqkg::Result | use | 15 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 444 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
