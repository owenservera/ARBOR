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
    let cold_ms = start.elapsed().as_millis();
    assert_eq!(cold.state, RunState::Complete);
    let start = Instant::now();
    let warm = executor
        .run(&plan, &rev, &mut cache, budget, &CancellationToken::new())
        .unwrap();
    let warm_ms = start.elapsed().as_millis();
    assert_eq!(warm.state, RunState::Complete);
    plan.steps[0].sources[0].revision = 2;
    plan.steps[0].sources[0].digest = "b".repeat(64);
    let start = Instant::now();
    let changed = executor
        .run(&plan, &rev, &mut cache, budget, &CancellationToken::new())
        .unwrap();
    let incremental_ms = start.elapsed().as_millis();
    assert_eq!(changed.state, RunState::Complete);
    println!("{{\"schema\":\"hqkg.benchmark/1\",\"count\":{},\"cold_ms\":{},\"warm_ms\":{},\"incremental_ms\":{},\"executions\":{},\"cache_entries\":{},\"rss_kib\":{}}}",
        count,cold_ms,warm_ms,incremental_ms,calls.load(Ordering::SeqCst),cache.len(),rss_kib().map(|n|n.to_string()).unwrap_or_else(||"null".into()));
}
#[test]
#[ignore = "manual benchmark, run with --ignored --nocapture in a measured toolchain"]
fn benchmark_1k() {
    case(1_000)
}
#[test]
#[ignore = "manual benchmark, run with --ignored --nocapture in a measured toolchain"]
fn benchmark_10k() {
    case(10_000)
}
