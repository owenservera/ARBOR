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
