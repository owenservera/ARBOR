# File: native/hqkg/tests/benchmark_typed_dag.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/benchmark_typed_dag.rs |
| Language | Rust |
| Kind | source |
| Size | 3972 B |
| Lines | 109 |
| Hash | b34c1cd4d289 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ShortOutput | struct | 12 | no | struct ShortOutput(Arc&lt;AtomicUsize&gt;); |
| descriptor | method | 14 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 17 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| rss_kib | function | 24 | no | fn rss_kib() -&gt; Option&lt;u64&gt; { |
| benchmark_1k | function | 102 | no | fn benchmark_1k() { |
| benchmark_10k | function | 107 | no | fn benchmark_10k() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::engine::* | use | 3 | external |
| hqkg::typed_dag::* | use | 4 | external |
| hqkg::Result | use | 5 | external |
| std::sync::{ | use | 6 | external |
| std::time::Instant | use | 10 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Manual, ignored benchmark. It emits actual timings only when cargo runs it;
//! checked-in source is NOT a performance measurement or acceptance receipt.
use hqkg::engine::*;
use hqkg::typed_dag::*;
use hqkg::Result;
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};
use std::time::Instant;

struct ShortOutput(Arc<AtomicUsize>);
impl ComputeEngine for ShortOutput {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("bench-pure", "bench-v1", PURE_INTERFACE, &["summarize"])
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        self.0.fetch_add(1, Ordering::SeqCst);
        Ok(EngineOutput {
            data: format!("bytes:{}", request.data.len()),
        })
    }
}
fn rss_kib() -> Option<u64> {
    let s = std::fs::read_to_string("/proc/self/status").ok()?;
    let line = s.lines().find(|line| line.starts_with("VmRSS:"))?;
    line.split_whitespace().nth(1)?.parse().ok()
}
fn case(count: usize) {
    let scope = Namespace {
        domain: GraphDomain::Development,
        owner: "bench-local".into(),
    };
    let rev = RevisionToken {
        namespace: scope.clone(),
        graph_epoch: 1,
    };
    let mut steps = Vec::with_capacity(count);
    for i in 0..count {
        steps.push(TransformStep {
            id: format!("n{i}"),
            engine: "bench-pure".into(),
            operation: "summarize".into(),
            input: "x".repeat(128),
            after: if i > 0 && i % 100 == 1 {
                vec![format!("n{}", i - 1)]
            } else {
                vec![]
            },
            sources: vec![SourceBinding {
                namespace: scope.clone(),
                id: format!("source-{i}"),
                revision: 1,
                digest: "a".repeat(64),
                provenance: "fixture".into(),
            }],
            retry_io: 0,
        });
    }
    let mut plan = TransformPlan {
        namespace: scope,
        expected: rev.clone(),
        steps,
    };
    let registry = EngineRegistry::new();
    let calls = Arc::new(AtomicUsize::new(0));
    registry
        .install(Arc::new(ShortOutput(calls.clone())), None)
        .unwrap();
    let mut cache = IncrementalCache::new();
    let budget = Budget {
        max_tasks: count,
        max_elapsed_ms: 120_000,
        max_output_bytes: 16 * 1024 * 1024,
    };
    let executor = DagExecutor::new(&registry);
    let start = Instant::now();
    let cold = executor
        .run(&plan, &rev, &mut cache, budget, &CancellationToken::new())
        .unwrap();
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
