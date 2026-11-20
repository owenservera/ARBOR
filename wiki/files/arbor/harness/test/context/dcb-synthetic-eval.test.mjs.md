# File: harness/test/context/dcb-synthetic-eval.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-synthetic-eval.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1223 B |
| Lines | 24 |
| Hash | 9bcde556698d |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| report | const | 6 | no | const report=runDcbSyntheticBenchmark({iterations:120,maxSources:8}); |
| a | const | 15 | no | const a=runDcbSyntheticBenchmark({iterations:36,maxSources:4}); |
| b | const | 16 | no | const b=runDcbSyntheticBenchmark({iterations:36,maxSources:4}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../bench/dcb-synthetic-eval.mjs | import | 3 | [harness/bench/dcb-synthetic-eval.mjs](../../bench/dcb-synthetic-eval.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { runDcbSyntheticBenchmark } from '../../bench/dcb-synthetic-eval.mjs';

test('synthetic six-flavor retrieval has no revoked source leakage',()=>{
  const report=runDcbSyntheticBenchmark({iterations:120,maxSources:8});
  assert.equal(report.schema,'vivim.dcb-synthetic-benchmark/1');
  assert.equal(report.availableSources,192);
  assert.equal(report.forbiddenSelectedCount,0);
  assert.equal(report.cases,120);
  assert.ok(report.targetRecallAtK>0.95);
  assert.ok(report.latencyMs.p95>=0);
});
test('retrieval metrics are deterministic apart from measured wall-clock latency',()=>{
  const a=runDcbSyntheticBenchmark({iterations:36,maxSources:4});
  const b=runDcbSyntheticBenchmark({iterations:36,maxSources:4});
  for(const key of ['targetRecallAtK','irrelevantSelectedFraction',
    'forbiddenSelectedCount','averageOmittedSources'])
    assert.equal(a[key],b[key]);
});
test('bench is bounded and cannot read arbitrary unbounded corpus',()=>{
  assert.throws(()=>runDcbSyntheticBenchmark({iterations:5000}),RangeError);
  assert.throws(()=>runDcbSyntheticBenchmark({iterations:10,maxSources:1000}),RangeError);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
