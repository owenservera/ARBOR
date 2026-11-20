# File: native/hqkg/tests/bench_vertical.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/bench_vertical.rs |
| Language | Rust |
| Kind | source |
| Size | 25069 B |
| Lines | 641 |
| Hash | bc97e1f2d747 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WARMUP | const | 34 | no | const WARMUP: usize = 2; |
| ITERS | const | 35 | no | const ITERS: usize = 6; |
| CHANGESET_PUT_NODES | const | 36 | no | const CHANGESET_PUT_NODES: usize = 100; |
| CHANGESET_PUT_EDGES | const | 37 | no | const CHANGESET_PUT_EDGES: usize = 50; |
| RETRIEVE_SEEDS | const | 38 | no | const RETRIEVE_SEEDS: usize = 3; |
| RETRIEVE_BUDGET | const | 39 | no | const RETRIEVE_BUDGET: u64 = 8000; |
| Lcg | struct | 45 | no | struct Lcg(u64); |
| next_u64 | method | 50 | no | fn next_u64(&amp;mut self) -&gt; u64 { |
| below | method | 57 | no | fn below(&amp;mut self, n: usize) -&gt; usize { |
| ADJECTIVES | const | 62 | no | const ADJECTIVES: [&amp;str; 12] = [ |
| NOUNS | const | 76 | no | const NOUNS: [&amp;str; 12] = [ |
| RELATIONS | const | 90 | no | const RELATIONS: [&amp;str; 4] = [&quot;depends_on&quot;, &quot;references&quot;, &quot;feeds&quot;, &quot;derived_from&quot;]; |
| synthetic_node | function | 92 | no | fn synthetic_node(i: usize, rng: &amp;mut Lcg) -&gt; Node { |
| build_dag | function | 108 | no | fn build_dag(nodes: usize, edges: usize, seed: u64) -&gt; Graph { |
| bench_change_set | function | 132 | no | fn bench_change_set(tag: &amp;str) -&gt; GraphChangeSet { |
| context_request | function | 151 | no | fn context_request(g: &amp;Graph, watermark: Option&lt;BTreeMap&lt;String, u64&gt;&gt;) -&gt; ContextRequest { |
| watermark_of | function | 167 | no | fn watermark_of(bundle: &amp;ContextBundle) -&gt; BTreeMap&lt;String, u64&gt; { |
| Stats | struct | 179 | no | struct Stats { |
| median | function | 188 | no | fn median(samples: &amp;mut [f64]) -&gt; f64 { |
| time_ms | function | 198 | no | fn time_ms&lt;F: FnMut()&gt;(mut f: F) -&gt; Vec&lt;f64&gt; { |
| report | function | 211 | no | fn report(label: &amp;str, mut samples: Vec&lt;f64&gt;, ops_per_iter: Option&lt;f64&gt;, extra: &amp;str) -&gt; Stats { |
| print_stats | function | 225 | no | fn print_stats(s: &amp;Stats) { |
| header | function | 241 | no | fn header(title: &amp;str) { |
| temp_path | function | 246 | no | fn temp_path(kind: &amp;str) -&gt; std::path::PathBuf { |
| COUNTER | const | 247 | no | static COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0); |
| cleanup | function | 256 | no | fn cleanup(path: &amp;std::path::Path) { |
| bench_bulk_put | function | 269 | no | fn bench_bulk_put() { |
| bench_changeset_apply | function | 316 | no | fn bench_changeset_apply() { |
| bench_durable_apply | function | 357 | no | fn bench_durable_apply() { |
| bench_retrieve | function | 410 | no | fn bench_retrieve() { |
| bench_cache_roundtrip | function | 439 | no | fn bench_cache_roundtrip() { |
| bench_journal_save | function | 510 | no | fn bench_journal_save() { |
| bench_journal_save_scaling | function | 551 | no | fn bench_journal_save_scaling() { |
| bench_all | function | 608 | no | fn bench_all() { |
| rustc_version | function | 629 | no | fn rustc_version() -&gt; String { |
| chrono_utc | function | 635 | no | fn chrono_utc() -&gt; String { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::{BTreeMap, BTreeSet} | use | 24 | external |
| std::fs | use | 25 | external |
| std::time::Instant | use | 26 | external |
| hqkg::apply_ledger::{apply_durable, FileApplyLedger} | use | 28 | external |
| hqkg::context_retrieval::{retrieve, ContextBundle, ContextRequest} | use | 29 | external |
| hqkg::graph_change_set::{apply, ApplyLedger, ApplyReport, GraphChangeSet} | use | 30 | external |
| hqkg::invalidate::InvalidateCache | use | 31 | external |
| hqkg::{Edge, Graph, Journal, Node, NodeKind} | use | 32 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 20 | owner | hq-agent | — | hq-agent |
| 21 | task | — | — | OVN-B lane 6 (benchmark half) |
| 22 | invariant | — | — | No src/ changes: landed modules are consumed via public API only. |

## Excerpt

```rust
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
```

_First 80 of 642 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
