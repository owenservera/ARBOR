# File: scripts/roadmap/acceleration-queue.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/roadmap/acceleration-queue.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7945 B |
| Lines | 174 |
| Hash | b7c8ea96e12e |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROADMAP_URL | const | 8 | yes | export const ROADMAP_URL = new URL(&#39;../../docs/product/roadmap/roadmap.v1.json&#39;, import.meta.url); |
| FACTOR_WEIGHTS | const | 9 | yes | export const FACTOR_WEIGHTS = Object.freeze({ downstreamUnlocks: 30, crossSystemReuse: 25, feedbackSpeed: 20, reasoningCostReduction: 15, |
| accelerationScore | function | 17 | yes | export function accelerationScore(inputs, weights = FACTOR_WEIGHTS) { |
| rating | const | 20 | no | const rating = inputs[factor]; |
| loadRoadmap | function | 28 | yes | export function loadRoadmap(file = ROADMAP_URL) { |
| isIndependentlyAccepted | function | 32 | yes | export function isIndependentlyAccepted(item) { |
| validateRoadmap | function | 39 | yes | export function validateRoadmap(roadmap) { |
| errors | const | 40 | no | const errors = []; |
| layers | const | 45 | no | const layers = roadmap.layers \|\| {}; |
| l2 | const | 46 | no | const l2 = Array.isArray(layers.L2) ? layers.L2 : []; |
| queue | const | 47 | no | const queue = Array.isArray(roadmap.buildQueue) ? roadmap.buildQueue : []; |
| accel | const | 48 | no | const accel = roadmap.acceleration \|\| {}; |
| byId | const | 49 | no | const byId = new Map(); |
| queueIds | const | 66 | no | const queueIds = new Set(); |
| row | const | 68 | no | const row = queue[index]; |
| item | const | 69 | no | const item = byId.get(row.itemId); |
| visiting | const | 106 | no | const visiting = new Set(); |
| visited | const | 107 | no | const visited = new Set(); |
| walk | function | 108 | no | function walk(id) { |
| item | const | 112 | no | const item = byId.get(id); |
| readyFrontier | function | 130 | yes | export function readyFrontier(roadmap) { |
| result | const | 131 | no | const result = validateRoadmap(roadmap); |
| byId | const | 133 | no | const byId = new Map(roadmap.layers.L2.map(item =&gt; [item.id, item])); |
| cli | function | 149 | no | function cli() { |
| mode | const | 150 | no | const mode = process.argv[2] \|\| &#39;--ready&#39;; |
| roadmap | const | 157 | no | const roadmap = loadRoadmap(); |
| checked | const | 158 | no | const checked = validateRoadmap(roadmap); |
| output | const | 164 | no | const output = mode === &#39;--check&#39; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/batch-evidence/A05.test.mjs](../batch-evidence/A05.test.mjs.md) | ../roadmap/acceleration-queue.mjs |
| [scripts/batch-evidence/A07.test.mjs](../batch-evidence/A07.test.mjs.md) | ../roadmap/acceleration-queue.mjs |
| [scripts/roadmap/a05-cycle.mjs](./a05-cycle.mjs.md) | ./acceleration-queue.mjs |
| [scripts/roadmap/a05-cycle.test.mjs](./a05-cycle.test.mjs.md) | ./acceleration-queue.mjs |
| [scripts/roadmap/acceleration-queue.test.mjs](./acceleration-queue.test.mjs.md) | ./acceleration-queue.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// ARBOR R002 roadmap validator and deterministic read-only ready frontier.
// This file does NOT authorize or launch workers, write the roadmap, or perform Host effects.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROADMAP_URL = new URL('../../docs/product/roadmap/roadmap.v1.json', import.meta.url);
export const FACTOR_WEIGHTS = Object.freeze({
  downstreamUnlocks: 30,
  crossSystemReuse: 25,
  feedbackSpeed: 20,
  reasoningCostReduction: 15,
  implementationSimplicity: 10
});

export function accelerationScore(inputs, weights = FACTOR_WEIGHTS) {
  if (!inputs || typeof inputs !== 'object') throw new TypeError('score inputs missing');
  return Math.round(Object.entries(weights).reduce((sum, [factor, weight]) => {
    const rating = inputs[factor];
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new TypeError('factor ' + factor + ' must be an integer 0..5');
    }
    return sum + weight * rating / 5;
  }, 0));
}

export function loadRoadmap(file = ROADMAP_URL) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function isIndependentlyAccepted(item) {
  return Boolean(item &&
    item.execution === 'EXECUTED' &&
    item.verification === 'INDEPENDENT_PASS' &&
    item.ownerAcceptance === 'ACCEPTED');
}

export function validateRoadmap(roadmap) {
  const errors = [];
  const assert = (pass, message) => { if (!pass) errors.push(message); };
  if (!roadmap || roadmap.schema !== 'arbor.product-roadmap/1') {
    return { ok: false, errors: ['Unexpected roadmap schema'] };
  }
  const layers = roadmap.layers || {};
  const l2 = Array.isArray(layers.L2) ? layers.L2 : [];
  const queue = Array.isArray(roadmap.buildQueue) ? roadmap.buildQueue : [];
  const accel = roadmap.acceleration || {};
  const byId = new Map();
  for (const item of l2) {
    assert(typeof item.id === 'string' && item.id.length > 0, 'L2 missing ID');
    assert(!byId.has(item.id), 'Duplicate L2 ID ' + item.id);
    byId.set(item.id, item);
  }
  assert(accel.revision === 'R002', 'Acceleration revision must be R002');
  assert(accel.activeBatch === 'ACCEL-A', 'Active batch mismatch');
  assert(Array.isArray(layers.L0) && layers.L0.some(x => x.id === 'L0-DEMO'), 'Missing demo pillar');
  assert(Array.isArray(layers.L0) && layers.L0.some(x => x.id === 'L0-BUILD'), 'Missing build pillar');
  assert(Array.isArray(layers.L0) && layers.L0.some(x => x.id === 'L0-WININSTALL'), 'Missing independent install pillar');
  assert(Array.isArray(layers.L1) && layers.L1.some(x => x.id === 'L1-DEMO-LOOP' && x.status === 'active'), 'Demo loop not active');
  assert(JSON.stringify(accel.scoring?.weights) === JSON.stringify(FACTOR_WEIGHTS), 'Scoring weights drift');
  assert(queue.length > 0 && queue.length <= 9, 'R002 active queue must have 1..9 items');
  assert(Array.isArray(roadmap.archivedBuildBatches) &&
    roadmap.archivedBuildBatches.some(b => b.batchId === 'BATCH-1' && b.items?.length === 3),
    'Batch-1 historical evidence was lost');
  const queueIds = new Set();
  for (let index = 0; index < queue.length; index++) {
    const row = queue[index];
    const item = byId.get(row.itemId);
    assert(!queueIds.has(row.itemId), 'Duplicate queue item ' + row.itemId);
    queueIds.add(row.itemId);
    assert(row.order === index + 1, 'Queue order must be contiguous at ' + row.itemId);
    assert(item != null, 'Queue item missing from L2: ' + row.itemId);
    if (!item) continue;
    assert(item.status === row.status, 'Status mismatch for ' + item.id);
    assert(item.priority === row.priority && row.priority === row.order,
      'Priority mismatch for ' + item.id);
    assert(item.lane === row.lane && ['A', 'B', 'C'].includes(item.lane),
      'Lane mismatch for ' + item.id);
    assert(item.verification === row.verification, 'Verification mismatch ' + item.id);
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
