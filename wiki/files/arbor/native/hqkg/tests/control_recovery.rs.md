# File: native/hqkg/tests/control_recovery.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/control_recovery.rs |
| Language | Rust |
| Kind | source |
| Size | 3449 B |
| Lines | 111 |
| Hash | 52cd7d7e53a1 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Engine | struct | 9 | no | struct Engine; |
| descriptor | method | 11 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 14 | no | fn execute(&amp;self, r: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| CacheRepair | struct | 24 | no | struct CacheRepair { |
| scope | method | 30 | no | fn scope(&amp;self) -&gt; RepairScope { |
| repair | method | 33 | no | fn repair(&amp;self) -&gt; Result&lt;()&gt; { |
| probe | method | 37 | no | fn probe(&amp;self) -&gt; Result&lt;bool&gt; { |
| trusted_cache_self_heal_does_not_replay_original_op | function | 42 | no | fn trusted_cache_self_heal_does_not_replay_original_op() { |
| auto_heal_scope_and_attempt_budget_fail_closed | function | 80 | no | fn auto_heal_scope_and_attempt_budget_fail_closed() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::control::* | use | 1 | external |
| hqkg::{ | use | 2 | external |
| std::sync::{ | use | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
