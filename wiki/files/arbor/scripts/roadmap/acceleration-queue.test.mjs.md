# File: scripts/roadmap/acceleration-queue.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/roadmap/acceleration-queue.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5752 B |
| Lines | 128 |
| Hash | 5f8d19a2e02d |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| clone | function | 8 | no | const clone = value =&gt; JSON.parse(JSON.stringify(value)); |
| markAccepted | function | 10 | no | function markAccepted(roadmap, id) { |
| item | const | 11 | no | const item = roadmap.layers.L2.find(x =&gt; x.id === id); |
| row | const | 12 | no | const row = roadmap.buildQueue.find(x =&gt; x.itemId === id); |
| data | const | 21 | no | const data = loadRoadmap(); |
| result | const | 22 | no | const result = validateRoadmap(data); |
| data | const | 38 | no | const data = clone(loadRoadmap()); |
| item | const | 39 | no | const item = data.layers.L2.find(x =&gt; x.id === &#39;A00&#39;); |
| row | const | 40 | no | const row = data.buildQueue.find(x =&gt; x.itemId === &#39;A00&#39;); |
| data | const | 48 | no | const data = clone(loadRoadmap()); |
| data | const | 55 | no | const data = clone(loadRoadmap()); |
| base | const | 63 | no | const base = loadRoadmap(); |
| falseGreen | const | 64 | no | const falseGreen = clone(base); |
| a00 | const | 65 | no | const a00 = falseGreen.layers.L2.find(x =&gt; x.id === &#39;A00&#39;); |
| row00 | const | 66 | no | const row00 = falseGreen.buildQueue.find(x =&gt; x.itemId === &#39;A00&#39;); |
| duplicate | const | 70 | no | const duplicate = clone(base); |
| cyclic | const | 74 | no | const cyclic = clone(base); |
| a | const | 75 | no | const a = cyclic.layers.L2.find(x =&gt; x.id === &#39;A00&#39;); |
| q | const | 76 | no | const q = cyclic.buildQueue.find(x =&gt; x.itemId === &#39;A00&#39;); |
| item | const | 82 | no | const item = loadRoadmap().layers.L2.find(x =&gt; x.id === &#39;A02&#39;); |
| data | const | 88 | no | const data = loadRoadmap(); |
| a00 | const | 89 | no | const a00 = data.layers.L2.find(x =&gt; x.id === &#39;A00&#39;); |
| row | const | 90 | no | const row = data.buildQueue.find(x =&gt; x.itemId === &#39;A00&#39;); |
| data | const | 111 | no | const data = loadRoadmap(); |
| batch | const | 112 | no | const batch = data.archivedBuildBatches.find(b =&gt; b.batchId === &#39;BATCH-1&#39;); |
| byId | const | 116 | no | const byId = new Map(batch.items.map(i =&gt; [i.itemId, i])); |
| chat | const | 117 | no | const chat = byId.get(&#39;CHAT-BOX-BASELINE&#39;); |
| wiki | const | 118 | no | const wiki = byId.get(&#39;WIKI-BASELINE&#39;); |
| rdcb | const | 119 | no | const rdcb = byId.get(&#39;RDCB-BASELINE&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ./acceleration-queue.mjs | import | 3 | [scripts/roadmap/acceleration-queue.mjs](./acceleration-queue.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadRoadmap, validateRoadmap, readyFrontier,
  accelerationScore, isIndependentlyAccepted
} from './acceleration-queue.mjs';

const clone = value => JSON.parse(JSON.stringify(value));

function markAccepted(roadmap, id) {
  const item = roadmap.layers.L2.find(x => x.id === id);
  const row = roadmap.buildQueue.find(x => x.itemId === id);
  assert.ok(item && row, 'known task');
  item.status = row.status = 'executed';
  item.verification = row.verification = 'INDEPENDENT_PASS';
  item.ownerAcceptance = row.ownerAcceptance = 'ACCEPTED';
  item.execution = 'EXECUTED';
}

test('R002 canonical schema, 89 baseline + nine work orders, and history survive', () => {
  const data = loadRoadmap();
  const result = validateRoadmap(data);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(data.layers.L2.length, 98);
  assert.equal(data.buildQueue.length, 9);
  assert.deepEqual(data.buildQueue.map(x => x.itemId),
    ['A00', 'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08']);
  assert.equal(data.archivedBuildBatches[0].items.length, 3);
  assert.equal(data.layers.L1.find(x => x.id === 'L1-DEMO-LOOP').status, 'active');
});

test('initial ready frontier only includes independent A00, A01 and A02', () => {
  assert.deepEqual(readyFrontier(loadRoadmap()).map(x => x.itemId),
    ['A00', 'A01', 'A02']);
});

test('merely executed, source-wired or UNRUN dependency does not unlock A03', () => {
  const data = clone(loadRoadmap());
  const item = data.layers.L2.find(x => x.id === 'A00');
  const row = data.buildQueue.find(x => x.itemId === 'A00');
  item.status = row.status = 'executed';
  item.execution = 'EXECUTED';
  assert.equal(isIndependentlyAccepted(item), false);
  assert.ok(!readyFrontier(data).some(x => x.itemId === 'A03'));
});

test('independently verified and accepted A00 opens A03, not A05', () => {
  const data = clone(loadRoadmap());
  markAccepted(data, 'A00');
  assert.ok(readyFrontier(data).some(x => x.itemId === 'A03'));
  assert.ok(!readyFrontier(data).some(x => x.itemId === 'A05'));
});

test('A05 requires A01, A02 and A03 all independently accepted', () => {
  const data = clone(loadRoadmap());
  for (const id of ['A01', 'A02']) markAccepted(data, id);
  assert.ok(!readyFrontier(data).some(x => x.itemId === 'A05'));
  markAccepted(data, 'A03');
  assert.ok(readyFrontier(data).some(x => x.itemId === 'A05'));
});

test('false green, duplicate queue and dependency cycles are rejected', () => {
  const base = loadRoadmap();
  const falseGreen = clone(base);
  const a00 = falseGreen.layers.L2.find(x => x.id === 'A00');
  const row00 = falseGreen.buildQueue.find(x => x.itemId === 'A00');
  a00.ownerAcceptance = row00.ownerAcceptance = 'ACCEPTED';
  assert.equal(validateRoadmap(falseGreen).ok, false);

  const duplicate = clone(base);
  duplicate.buildQueue[1].itemId = 'A00';
  assert.equal(validateRoadmap(duplicate).ok, false);

  const cyclic = clone(base);
  const a = cyclic.layers.L2.find(x => x.id === 'A00');
  const q = cyclic.buildQueue.find(x => x.itemId === 'A00');
  a.dependsOn = q.dependsOn = ['A03'];
  assert.equal(validateRoadmap(cyclic).ok, false);
});
```

_First 80 of 129 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
