# File: native/hqkg/tests/typed_dag.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/typed_dag.rs |
| Language | Rust |
| Kind | source |
| Size | 11132 B |
| Lines | 350 |
| Hash | ecd264362808 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Pure | struct | 14 | no | struct Pure { |
| descriptor | method | 20 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 23 | no | fn execute(&amp;self, req: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| registry | function | 36 | no | fn registry() -&gt; (EngineRegistry, Arc&lt;AtomicUsize&gt;) { |
| ns | function | 50 | no | fn ns(domain: GraphDomain) -&gt; Namespace { |
| rev | function | 56 | no | fn rev(ns: &amp;Namespace, epoch: u64) -&gt; RevisionToken { |
| source | function | 62 | no | fn source(ns: &amp;Namespace) -&gt; SourceBinding { |
| step | function | 71 | no | fn step(id: &amp;str, after: &amp;[&amp;str], ns: &amp;Namespace) -&gt; TransformStep { |
| plan | function | 82 | no | fn plan(ns: Namespace) -&gt; TransformPlan { |
| execute | function | 89 | no | fn execute(reg: &amp;EngineRegistry, p: &amp;TransformPlan, c: &amp;mut IncrementalCache) -&gt; DagReport { |
| dependency_order_cache_hits_and_namespace_separation | function | 101 | no | fn dependency_order_cache_hits_and_namespace_separation() { |
| only_modified_source_and_dependents_recompute | function | 136 | no | fn only_modified_source_and_dependents_recompute() { |
| graph_revision_and_cross_namespace_sources_refused | function | 151 | no | fn graph_revision_and_cross_namespace_sources_refused() { |
| cancellation_never_commits_partial_cache | function | 177 | no | fn cancellation_never_commits_partial_cache() { |
| generation_swap_invalidates_cached_engine_output | function | 191 | no | fn generation_swap_invalidates_cached_engine_output() { |
| missing_cycle_and_duplicate_steps_are_rejected | function | 213 | no | fn missing_cycle_and_duplicate_steps_are_rejected() { |
| partial_failure_is_explicit_and_does_not_commit_cache | function | 251 | no | fn partial_failure_is_explicit_and_does_not_commit_cache() { |
| IO_retry_is_opt_in_bounded_and_pure_only | function | 271 | no | fn IO_retry_is_opt_in_bounded_and_pure_only() { |
| bounded_tasks_refuse_before_dispatch | function | 291 | no | fn bounded_tasks_refuse_before_dispatch() { |
| real_graph_change_set_invalidates_only_matching_namespace | function | 311 | no | fn real_graph_change_set_invalidates_only_matching_namespace() { |
| cache_retention_is_bounded_without_failing_valid_computation | function | 338 | no | fn cache_retention_is_bounded_without_failing_valid_computation() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::engine::{ | use | 1 | external |
| hqkg::typed_dag::* | use | 5 | external |
| hqkg::{Error, Result} | use | 6 | external |
| std::collections::BTreeSet | use | 7 | external |
| std::io | use | 8 | external |
| std::sync::{ | use | 9 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
use hqkg::engine::{
    Budget, CancellationToken, ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry,
    EngineRequest,
};
use hqkg::typed_dag::*;
use hqkg::{Error, Result};
use std::collections::BTreeSet;
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
        EngineDescriptor::new("pure", self.implementation, PURE_INTERFACE, &["evaluate"])
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
```

_First 80 of 351 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
