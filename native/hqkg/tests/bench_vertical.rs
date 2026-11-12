//! OVN-B lane 6 (benchmark half): integrated graph-change -> context receipt
//! proof benchmarks for the Rust HQKG.
//! docs/orchestration/intelligence-upgrade/AUTONOMOUS-CONTINUOUS-WORK-ORDERS.md
//!
//! Correctness-guard policy: EVERY timed operation asserts its postcondition
//! (row counts, applied-op counts, bundle equality, cache hit/miss semantics).
//! A benchmark that passes with wrong results is invalid, so a failed
//! assertion fails the test even though the timings already printed.
//!
//! std-only: `Instant`-based timing, seeded LCG (no `rand`), no criterion.
//! Every test is `#[ignore]`d so the default `cargo test` gate stays fast and
//! unchanged. Run the suite explicitly with:
//!
//!   cargo test --test bench_vertical -- --ignored --nocapture
//!
//! Timing numbers are machine-local (this host, this run) and are NOT
//! cross-machine comparable. Raw output is pasted into
//! bench-vertical/BENCH-RESULTS.md.
//!
//! @hq:owner hq-agent
//! @hq:task OVN-B lane 6 (benchmark half)
//! @hq:invariant No src/ changes: landed modules are consumed via public API only.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::time::Instant;

use hqkg::apply_ledger::{apply_durable, FileApplyLedger};
use hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest};
use hqkg::graph_change_set::{apply, ApplyLedger, ApplyReport, GraphChangeSet};
use hqkg::invalidate::InvalidateCache;
use hqkg::{Edge, Graph, Journal, Node, NodeKind};

const WARMUP: usize = 2;
const ITERS: usize = 6;
const CHANGESET_PUT_NODES: usize = 100;
const CHANGESET_PUT_EDGES: usize = 50;
const RETRIEVE_SEEDS: usize = 3;
const RETRIEVE_BUDGET: u64 = 8000;

// ---------------------------------------------------------------------------
// Deterministic synthetic data (seeded LCG; no rand dependency)
// ---------------------------------------------------------------------------

struct Lcg(u64);
impl Lcg {
    fn new(seed: u64) -> Self {
        Self(seed.wrapping_mul(0x9E3779B97F4A7C15) | 1)
    }
    fn next_u64(&mut self) -> u64 {
        self.0 = self
            .0
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        self.0 >> 11
    }
    fn below(&mut self, n: usize) -> usize {
        (self.next_u64() % n as u64) as usize
    }
}

const ADJECTIVES: [&str; 12] = [
    "Incremental",
    "Deterministic",
    "Bounded",
    "Provenance",
    "Watermarked",
    "Durable",
    "Composite",
    "Retrieval",
    "Invalidated",
    "Reconciled",
    "Versioned",
    "Snapshot",
];
const NOUNS: [&str; 12] = [
    "pipeline",
    "ledger",
    "index",
    "bundle",
    "cache",
    "journal",
    "adapter",
    "engine",
    "receipt",
    "graph",
    "change-set",
    "replay",
];
const RELATIONS: [&str; 4] = ["depends_on", "references", "feeds", "derived_from"];

fn synthetic_node(i: usize, rng: &mut Lcg) -> Node {
    let title = format!(
        "{} {} #{:04}",
        ADJECTIVES[rng.below(ADJECTIVES.len())],
        NOUNS[rng.below(NOUNS.len())],
        i
    );
    Node::new(&format!("n_{i:06}"), NodeKind::Concept, &title)
        .property("status", if i % 3 == 0 { "active" } else { "draft" })
        .property("owner", &format!("team-{}", i % 7))
        .property("rev", &format!("r{}", i % 97))
        .source(&format!("bench://doc/{}", i % 512))
}

/// Deterministic DAG: every edge points from a lower index to a higher one,
/// so `topological` order exists and BFS always terminates.
fn build_dag(nodes: usize, edges: usize, seed: u64) -> Graph {
    let mut rng = Lcg::new(seed);
    let mut g = Graph::new();
    for i in 0..nodes {
        g.put_node(synthetic_node(i, &mut rng))
            .expect("bench node put must succeed");
    }
    for k in 0..edges {
        let from = rng.below(nodes - 1);
        let span = 1 + rng.below(64.min(nodes - 1 - from));
        let to = from + span;
        g.put_edge(Edge::new(
            &format!("e_{k:06}"),
            &format!("n_{from:06}"),
            RELATIONS[rng.below(RELATIONS.len())],
            &format!("n_{to:06}"),
        ))
        .expect("bench edge put must succeed");
    }
    g
}

/// The 100-node / 50-edge change set used by measurements (b) and (c).
/// `tag` differs per iteration so the durable ledger never sees a duplicate.
fn bench_change_set(tag: &str) -> GraphChangeSet {
    let mut rng = Lcg::new(0xBEEF);
    let mut cs = GraphChangeSet::new(format!("bench-cs-{tag}"), "bench_vertical");
    for i in 0..CHANGESET_PUT_NODES {
        cs = cs.put_node(synthetic_node(10_000 + i, &mut rng));
    }
    for k in 0..CHANGESET_PUT_EDGES {
        let from = 10_000 + k % CHANGESET_PUT_NODES;
        let to = 10_000 + (from - 10_000 + 1 + k % 7) % CHANGESET_PUT_NODES;
        cs = cs.put_edge(Edge::new(
            &format!("cs-e_{k:03}"),
            &format!("n_{from:06}"),
            RELATIONS[k % RELATIONS.len()],
            &format!("n_{to:06}"),
        ));
    }
    cs
}

fn context_request(g: &Graph, watermark: Option<BTreeMap<String, u64>>) -> ContextRequest {
    let seeds: Vec<String> = (0..RETRIEVE_SEEDS).map(|i| format!("n_{i:06}")).collect();
    for s in &seeds {
        assert!(
            g.node(s).is_some(),
            "seed {s} must exist in the bench graph"
        );
    }
    ContextRequest {
        seeds,
        budget_tokens: RETRIEVE_BUDGET,
        excluded: BTreeSet::new(),
        watermark,
    }
}

fn watermark_of(bundle: &ContextBundle) -> BTreeMap<String, u64> {
    bundle
        .items
        .iter()
        .map(|it| (it.id.clone(), it.version))
        .collect()
}

// ---------------------------------------------------------------------------
// Timing harness (std Instant; warmup + repeated iterations + stats)
// ---------------------------------------------------------------------------

struct Stats {
    label: String,
    min: f64,
    median: f64,
    max: f64,
    ops_per_sec: Option<f64>,
    extra: String,
}

fn median(samples: &mut [f64]) -> f64 {
    samples.sort_by(|a, b| a.partial_cmp(b).expect("no NaN timings"));
    if samples.len() % 2 == 1 {
        samples[samples.len() / 2]
    } else {
        (samples[samples.len() / 2 - 1] + samples[samples.len() / 2]) / 2.0
    }
}

/// Run `f` WARMUP times untimed, then ITERS times timed; returns ms samples.
fn time_ms<F: FnMut()>(mut f: F) -> Vec<f64> {
    for _ in 0..WARMUP {
        f();
    }
    let mut samples = Vec::with_capacity(ITERS);
    for _ in 0..ITERS {
        let t = Instant::now();
        f();
        samples.push(t.elapsed().as_secs_f64() * 1000.0);
    }
    samples
}

fn report(label: &str, mut samples: Vec<f64>, ops_per_iter: Option<f64>, extra: &str) -> Stats {
    let med = median(&mut samples);
    let stats = Stats {
        label: label.to_string(),
        min: samples[0],
        median: med,
        max: *samples.last().expect("samples non-empty"),
        ops_per_sec: ops_per_iter.map(|ops| ops / (med / 1000.0)),
        extra: extra.to_string(),
    };
    print_stats(&stats);
    stats
}

fn print_stats(s: &Stats) {
    let ops = s
        .ops_per_sec
        .map(|v| format!(" | {:>12.0} ops/s", v))
        .unwrap_or_default();
    let extra = if s.extra.is_empty() {
        String::new()
    } else {
        format!(" | {}", s.extra)
    };
    println!(
        "  {:<34} {:>10.3} {:>10.3} {:>10.3} {}{}{}",
        s.label, s.min, s.median, s.max, "ms", ops, extra
    );
}

fn header(title: &str) {
    println!("\n== {title} ==");
}

// Temp-file helper: unique per call, removed best-effort afterwards.
fn temp_path(kind: &str) -> std::path::PathBuf {
    static COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    let n = COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    std::env::temp_dir().join(format!(
        "hqkg-bench-vertical-{}-{}-{kind}",
        std::process::id(),
        n
    ))
}

fn cleanup(path: &std::path::Path) {
    let _ = fs::remove_file(path);
    let _ = fs::remove_file(path.with_extension("lock"));
    let _ = fs::remove_file(path.with_extension("hqkg.lock"));
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

/// (a) bulk_put: full graph build via put_node/put_edge.
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_bulk_put() {
    for (n, m) in [(1_000usize, 3_000usize), (5_000, 15_000)] {
        header(&format!(
            "(a) bulk_put  N={n} M={m} (warmup {WARMUP}, timed {ITERS})"
        ));
        let mut rng = Lcg::new(42);
        // Pre-build the node/edge payloads outside the timed region; the
        // measurement is the Graph put path, not string formatting.
        let nodes: Vec<Node> = (0..n).map(|i| synthetic_node(i, &mut rng)).collect();
        let mut specs = Vec::with_capacity(m);
        for k in 0..m {
            let from = rng.below(n - 1);
            let span = 1 + rng.below(64.min(n - 1 - from));
            specs.push((
                format!("e_{k:06}"),
                format!("n_{from:06}"),
                RELATIONS[rng.below(RELATIONS.len())].to_string(),
                format!("n_{:06}", from + span),
            ));
        }
        let samples = time_ms(|| {
            let mut g = Graph::new();
            for node in &nodes {
                g.put_node(node.clone()).expect("put_node");
            }
            for (id, from, rel, to) in &specs {
                let mut e = Edge::new(id, from, rel, to);
                e.weight = 1;
                g.put_edge(e).expect("put_edge");
            }
            // Postcondition: the graph really holds every row.
            assert_eq!(g.node_count(), n, "bulk_put node count");
            assert_eq!(g.edge_count(), m, "bulk_put edge count");
        });
        report(
            &format!("put_node+put_edge N={n} M={m}"),
            samples,
            Some((n + m) as f64),
            "",
        );
    }
}

/// (b) changeset_apply: 100 PutNode + 50 PutEdge through `apply` with the
/// in-memory ApplyLedger.
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_changeset_apply() {
    header(&format!(
        "(b) changeset_apply  100 PutNode + 50 PutEdge via apply (in-memory ledger; warmup {WARMUP}, timed {ITERS})"
    ));
    let base = build_dag(1_000, 3_000, 7);
    let cs = bench_change_set("mem");
    let samples = time_ms(|| {
        // The clone IS inside the timed region: apply mutates, so every
        // iteration needs a fresh base graph. Report the clone cost once
        // below so the apply-only number can be derived.
        let t0 = Instant::now();
        let mut g = base.clone();
        let _clone_ms = t0.elapsed().as_secs_f64() * 1000.0;
        let mut ledger = ApplyLedger::new();
        let rep: ApplyReport = apply(&mut g, &cs, &mut ledger).expect("in-memory changeset apply");
        assert_eq!(rep.applied, CHANGESET_PUT_NODES + CHANGESET_PUT_EDGES);
        assert_eq!(rep.skipped, 0);
        assert!(!rep.duplicate);
        assert_eq!(g.node_count(), 1_100);
        assert_eq!(g.edge_count(), 3_050);
    });
    let s = report("apply + in-memory ledger", samples, None, "");
    let per_op_us = s.median * 1000.0 / (CHANGESET_PUT_NODES + CHANGESET_PUT_EDGES) as f64;
    // One untimed clone so readers can subtract it from the per-iteration ms.
    let t0 = Instant::now();
    let _clone = base.clone();
    let clone_ms = t0.elapsed().as_secs_f64() * 1000.0;
    println!(
        "  {:<34} {:>10.3} (per op, median over {} ops) | graph clone ~{clone_ms:.3} ms",
        "per-op",
        per_op_us,
        CHANGESET_PUT_NODES + CHANGESET_PUT_EDGES
    );
}

/// (c) durable_apply: same change set through `apply_durable` + a fresh
/// FileApplyLedger per iteration (temp file). Includes FileApplyLedger::open
/// (lock acquire + recover) and `record` (append + fsync), so the delta vs
/// (b) is exactly the durability cost on this host.
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_durable_apply() {
    header(&format!(
        "(c) durable_apply  same 100+50 ops via apply_durable + FileApplyLedger (warmup {WARMUP}, timed {ITERS})"
    ));
    let base = build_dag(1_000, 3_000, 7);
    let mut ledger_paths: Vec<std::path::PathBuf> = Vec::new();
    let mut cs_ids: Vec<String> = Vec::new();
    let mut iter = 0usize;
    let samples = time_ms(|| {
        let tag = format!("durable-{}", iter);
        iter += 1;
        let path = temp_path("ledger");
        ledger_paths.push(path.clone());
        let cs = bench_change_set(&tag);
        cs_ids.push(cs.change_set_id.clone());
        let mut g = base.clone();
        let mut ledger = FileApplyLedger::open(&path).expect("open durable ledger");
        let rep = apply_durable(&mut g, &cs, &mut ledger).expect("durable apply");
        ledger.close();
        // Cheap O(1) postconditions stay in the timed region; the on-disk
        // reopen check runs untimed below so it cannot inflate the number.
        assert_eq!(rep.applied, CHANGESET_PUT_NODES + CHANGESET_PUT_EDGES);
        assert!(!rep.duplicate);
        assert_eq!(g.node_count(), 1_100);
        assert_eq!(g.edge_count(), 3_050);
    });
    // Untimed correctness guard: every recorded change-set id is durable on
    // disk and recoverable through a fresh FileApplyLedger open.
    assert_eq!(ledger_paths.len(), cs_ids.len());
    for (path, id) in ledger_paths.iter().zip(&cs_ids) {
        assert!(
            FileApplyLedger::open(path)
                .expect("reopen ledger")
                .contains(id),
            "durable ledger must recover {id} from disk"
        );
    }
    let s = report("apply_durable + open + fsync", samples, None, "");
    let per_op_us = s.median * 1000.0 / (CHANGESET_PUT_NODES + CHANGESET_PUT_EDGES) as f64;
    println!(
        "  {:<34} {:>10.3} (per op, median over {} ops)",
        "per-op",
        per_op_us,
        CHANGESET_PUT_NODES + CHANGESET_PUT_EDGES
    );
    for p in &ledger_paths {
        cleanup(p);
    }
}

/// (d) retrieve: bounded BFS context retrieval, 3 seeds, 8000-token budget.
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_retrieve() {
    for (n, m) in [(1_000usize, 3_000usize), (5_000, 15_000)] {
        header(&format!(
            "(d) retrieve  N={n} M={m}, {RETRIEVE_SEEDS} seeds, budget {RETRIEVE_BUDGET} tokens (warmup {WARMUP}, timed {ITERS})"
        ));
        let g = build_dag(n, m, 11);
        let req = context_request(&g, None);
        let samples = time_ms(|| {
            let bundle = retrieve(&g, &req).expect("retrieve");
            // Cheap O(1) postconditions inside the timed region.
            assert!(!bundle.items.is_empty(), "retrieve returned no items");
            assert!(bundle.tokens_used <= RETRIEVE_BUDGET);
            assert_eq!(bundle.epoch, g.epoch());
            assert_eq!(bundle.request_echo, req);
        });
        // Untimed correctness guard: deterministic rank — a second retrieve
        // must produce the identical bundle.
        let again = retrieve(&g, &req).expect("retrieve determinism probe");
        let first = retrieve(&g, &req).expect("retrieve");
        assert_eq!(first, again, "retrieve must be deterministic");
        report(&format!("retrieve N={n} M={m}"), samples, Some(1.0), "");
    }
}

/// (e) cache_roundtrip: store -> lookup hit -> version-bump lookup miss.
/// Asserts the hit returns the SAME bundle the miss produced, and that a
/// version bump forces a miss (never a stale hit).
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_cache_roundtrip() {
    header(&format!(
        "(e) cache_roundtrip  store -> hit -> bump -> miss, N=1000 M=3000 (warmup {WARMUP}, timed {ITERS})"
    ));
    let mut g = build_dag(1_000, 3_000, 13);
    let req = context_request(&g, None);
    let mut cache = InvalidateCache::new(64);

    // Warm the shape of the request once so the timed loop has a stable
    // watermark; the timed loop re-stores every iteration anyway.
    let bundle0 = retrieve(&g, &req).expect("initial retrieve");
    assert!(!bundle0.items.is_empty());
    let wm = watermark_of(&bundle0);
    let req_wm = ContextRequest {
        watermark: Some(wm.clone()),
        ..req.clone()
    };

    let mut miss_samples = Vec::new();
    let mut hit_samples = Vec::new();
    for _ in 0..WARMUP {
        let b = retrieve(&g, &req_wm).unwrap();
        cache.store(g.epoch(), &req_wm, &b);
        cache.lookup(g.epoch(), &wm, &req_wm).expect("warm hit");
    }
    for _ in 0..ITERS {
        let t = Instant::now();
        let b = retrieve(&g, &req_wm).expect("miss retrieve");
        cache.store(g.epoch(), &req_wm, &b);
        miss_samples.push(t.elapsed().as_secs_f64() * 1000.0);
        let t = Instant::now();
        let hit = cache.lookup(g.epoch(), &wm, &req_wm).expect("cache hit");
        hit_samples.push(t.elapsed().as_secs_f64() * 1000.0);
        // Correctness guard: the hit IS the miss's bundle, byte for byte.
        assert_eq!(hit, b, "cache hit must equal the stored bundle");
    }
    let s_miss = report("miss: retrieve + store", miss_samples, Some(1.0), "");
    let s_hit = report("hit: lookup", hit_samples, Some(1.0), "");
    let speedup = s_miss.median / s_hit.median;
    println!(
        "  {:<34} {:>10.3} (hit speedup over miss)",
        "speedup", speedup
    );

    // Version bump -> epoch bump -> forced miss (lane 5: no stale hits).
    // The caller has now observed the new epoch, so it looks up against it;
    // the cached entry (old epoch) must be rejected.
    let old_epoch = g.epoch();
    let mut bumped = synthetic_node(0, &mut Lcg::new(99));
    bumped.id = "n_000000".into();
    bumped.title = "Bumped benchmark node".into();
    let before = g.node("n_000000").expect("seed node").version;
    g.put_node(bumped).expect("bump put");
    assert_eq!(g.node("n_000000").expect("seed node").version, before + 1);
    assert_ne!(g.epoch(), old_epoch);
    let hit_after_bump = cache.lookup(g.epoch(), &wm, &req_wm);
    assert!(
        hit_after_bump.is_none(),
        "lookup after version bump must MISS, never serve a stale hit"
    );
    let fresh = retrieve(&g, &req_wm).expect("post-bump retrieve");
    assert_ne!(fresh, bundle0, "post-bump bundle must differ");
    println!(
        "  post-bump lookup returned None (no stale hit) and a fresh retrieve differs — asserted"
    );
}

/// (f) journal_save: whole-snapshot Journal::save cost at N=1000 — the
/// number that documents the known CLI-path snapshot-scaling blocker.
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_journal_save() {
    header(&format!(
        "(f) journal_save  whole-snapshot save, N=1000 M=3000 (warmup {WARMUP}, timed {ITERS})"
    ));
    let g = build_dag(1_000, 3_000, 17);
    let mut paths: Vec<std::path::PathBuf> = Vec::new();
    let samples = time_ms(|| {
        // Fresh journal file per iteration so every save pays a constant,
        // comparable whole-snapshot cost (no scan-over-previous-frames growth).
        let path = temp_path("journal");
        paths.push(path.clone());
        let journal = Journal::new(&path);
        journal.save(&g).expect("journal save");
    });
    // Untimed correctness guard: every saved snapshot loads back to the same
    // graph (same node/edge counts, same epoch).
    assert_eq!(paths.len(), WARMUP + ITERS, "one journal per iteration");
    for path in &paths {
        let loaded = Journal::new(path).load().expect("journal load");
        assert_eq!(loaded.node_count(), g.node_count());
        assert_eq!(loaded.edge_count(), g.edge_count());
        assert_eq!(loaded.epoch(), g.epoch());
    }
    report("Journal::save N=1000", samples, None, "");
    for p in &paths {
        cleanup(p);
    }
}

/// (g) journal_save_scaling: the whole-snapshot SCALING CURVE — measured
/// growth-rate evidence for the CLI-path snapshot-journal blocker. Same
/// whole-snapshot `Journal::save` measurement as (f), repeated across
/// N in [1000, 2000, 4000, 8000] (M = 3N) so the per-1k-node cost can be
/// compared directly and the growth characterized from data, not guesses.
///
/// Frame size is observable via the saved journal file length
/// (`fs::metadata(path).len()`): each iteration saves to a FRESH file, so the
/// file holds exactly one snapshot frame = 20-byte header (4 magic + 8 len +
/// 8 digest) + serialized graph payload. All 8 files per N must agree.
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_journal_save_scaling() {
    for (n, m) in [
        (1_000usize, 3_000usize),
        (2_000, 6_000),
        (4_000, 12_000),
        (8_000, 24_000),
    ] {
        header(&format!(
            "(g) journal_save_scaling  whole-snapshot save, N={n} M={m} (warmup {WARMUP}, timed {ITERS})"
        ));
        let g = build_dag(n, m, 17);
        let mut paths: Vec<std::path::PathBuf> = Vec::new();
        let samples = time_ms(|| {
            // Fresh journal file per iteration (same convention as (f)): every
            // save pays a constant, comparable whole-snapshot cost and the
            // saved file holds exactly one frame.
            let path = temp_path("journal");
            paths.push(path.clone());
            let journal = Journal::new(&path);
            journal.save(&g).expect("journal save");
        });
        // Untimed correctness guard: every saved snapshot loads back to the
        // same graph, and the frame size is captured from the file length.
        assert_eq!(paths.len(), WARMUP + ITERS, "one journal per iteration");
        let mut frame_sizes = BTreeSet::new();
        for path in &paths {
            let loaded = Journal::new(path).load().expect("journal load");
            assert_eq!(loaded.node_count(), g.node_count());
            assert_eq!(loaded.edge_count(), g.edge_count());
            assert_eq!(loaded.epoch(), g.epoch());
            let len = fs::metadata(path)
                .expect("saved journal file must exist")
                .len();
            frame_sizes.insert(len);
        }
        assert_eq!(
            frame_sizes.len(),
            1,
            "whole-snapshot frame size must be deterministic per N"
        );
        let frame_bytes = *frame_sizes.iter().next().expect("frame sizes non-empty");
        let s = report(&format!("Journal::save N={n}"), samples, None, "");
        let per_1k = s.median * 1000.0 / n as f64;
        println!(
            "  {:<34} {:>10.3} (ms per 1k nodes) | frame bytes {}",
            "per-1k-nodes", per_1k, frame_bytes
        );
        for p in &paths {
            cleanup(p);
        }
    }
}

/// Runs all six measurements in one process and prints the environment block,
/// so one paste into BENCH-RESULTS.md is a complete, coherent run.
#[test]
#[ignore = "benchmark; run with: cargo test --test bench_vertical -- --ignored --nocapture"]
fn bench_all() {
    println!("bench_vertical — OVN-B lane 6 benchmark half");
    println!(
        "environment: rustc {} | {} | {} | {} UTC",
        rustc_version(),
        std::env::consts::OS,
        std::env::consts::ARCH,
        chrono_utc()
    );
    println!(
        "harness: warmup {WARMUP} + timed {ITERS} iterations, std Instant, seeded LCG, postconditions asserted"
    );
    println!("machine-local timings; NOT cross-machine comparable");
    bench_bulk_put();
    bench_changeset_apply();
    bench_durable_apply();
    bench_retrieve();
    bench_cache_roundtrip();
    bench_journal_save();
}

fn rustc_version() -> String {
    // Avoid shelling out; the exact compiler id is pasted in BENCH-RESULTS.md
    // from `rustc --version` alongside this run.
    "see BENCH-RESULTS.md environment block (rustc --version)".to_string()
}

fn chrono_utc() -> String {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map(|s| format!("unix:{s}"))
        .unwrap_or_else(|_| "unix:unknown".into())
}
