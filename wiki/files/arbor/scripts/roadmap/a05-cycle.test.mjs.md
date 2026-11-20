# File: scripts/roadmap/a05-cycle.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/roadmap/a05-cycle.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14220 B |
| Lines | 264 |
| Hash | 728a91ffe023 |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 13 | no | const HERE = path.dirname(fileURLToPath(import.meta.url)); |
| ROOT | const | 14 | no | const ROOT = path.resolve(HERE, &#39;../..&#39;); |
| ROADMAP_PATH | const | 15 | no | const ROADMAP_PATH = path.join(ROOT, &#39;docs/product/roadmap/roadmap.v1.json&#39;); |
| RECEIPT_PATH | const | 16 | no | const RECEIPT_PATH = path.join(ROOT, &#39;docs/product/roadmap/receipts/A05.receipt.json&#39;); |
| GATE_CARDS_PATH | const | 17 | no | const GATE_CARDS_PATH = path.join(ROOT, &#39;.coordination/artifacts/roadmap/gate-cards.jsonl&#39;); |
| CONTROLLER_PATH | const | 18 | no | const CONTROLLER_PATH = path.join(ROOT, &#39;demo/host-legacy/controller.js&#39;); |
| POLL_ROUND_PATH | const | 19 | no | const POLL_ROUND_PATH = path.join(ROOT, &#39;demo/host-legacy/poll-round.mjs&#39;); |
| A05_WRITE_SCOPE | const | 21 | no | const A05_WRITE_SCOPE = [&#39;.coordination/&#39;, &#39;docs/product/roadmap/&#39;, &#39;scripts/&#39;]; |
| LEDGERS | const | 22 | no | const LEDGERS = [ |
| readJson | function | 28 | no | function readJson(rel) { |
| gitDirty | function | 31 | no | function gitDirty(relFiles) { |
| out | const | 32 | no | const out = execFileSync(&#39;git&#39;, [&#39;status&#39;, &#39;--porcelain&#39;, &#39;--&#39;].concat(relFiles), { cwd: ROOT, encoding: &#39;utf8&#39; }).trim(); |
| l2Item | function | 37 | no | function l2Item(id) { |
| roadmap | const | 38 | no | const roadmap = loadRoadmap(); |
| queueRow | function | 41 | no | function queueRow(roadmap, id) { |
| result | const | 47 | no | const result = validateRoadmap(roadmap); |
| it | const | 60 | no | const it = roadmap.layers.L2.find(x =&gt; x.id === id); |
| row | const | 65 | no | const row = queueRow(roadmap, &#39;A05&#39;); |
| sources | const | 73 | no | const sources = loadReleaseSources(); |
| truth | const | 74 | no | const truth = deriveReleaseTruth(sources); |
| truth | const | 97 | no | const truth = deriveReleaseTruth(loadReleaseSources()); |
| a05 | const | 99 | no | const a05 = roadmap.layers.L2.find(x =&gt; x.id === &#39;A05&#39;); |
| rec | const | 107 | no | const rec = readJson(&#39;docs/product/roadmap/receipts/&#39; + id + &#39;.receipt.json&#39;); |
| promoted | const | 116 | no | const promoted = readJson(&#39;integration/beta-gates.json&#39;); |
| proposal | const | 117 | no | const proposal = readJson(&#39;.integration/proposal5/08-BETA-GATES.json&#39;); |
| release | const | 118 | no | const release = readJson(&#39;integration/release-manifest.json&#39;); |
| dirty | const | 122 | no | const dirty = gitDirty(LEDGERS); |
| row | const | 133 | no | const row = queueRow(roadmap, &#39;A05&#39;); |
| present | variable | 140 | no | let present = false; |
| rec | variable | 141 | no | let rec; |
| truth | const | 155 | no | const truth = deriveReleaseTruth(loadReleaseSources()); |
| raw | const | 163 | no | const raw = readFileSync(GATE_CARDS_PATH, &#39;utf8&#39;); |
| lines | const | 164 | no | const lines = raw.split(/\\r?\\n/).filter(line =&gt; line.trim().length &gt; 0); |
| a05OwnerGate | variable | 166 | no | let a05OwnerGate = null; |
| card | const | 168 | no | const card = JSON.parse(line); |
| artifactsDir | const | 184 | no | const artifactsDir = path.join(ROOT, &#39;.coordination/artifacts/roadmap&#39;); |
| gateCardsRel | const | 186 | no | const gateCardsRel = &#39;.coordination/artifacts/roadmap/gate-cards.jsonl&#39;; |
| receiptRel | const | 188 | no | const receiptRel = &#39;docs/product/roadmap/receipts/A05.receipt.json&#39;; |
| inScope | function | 196 | no | const inScope = (p) =&gt; A05_WRITE_SCOPE.some(prefix =&gt; p.startsWith(prefix)); |
| outOfScope | function | 197 | no | const outOfScope = (p) =&gt; p.startsWith(&#39;apps/vivim-host/&#39;) \|\| p.startsWith(&#39;apps/mobile-relay/&#39;); |
| src | const | 207 | no | const src = readFileSync(CONTROLLER_PATH, &#39;utf8&#39;); |
| a05Index | const | 208 | no | const a05Index = src.indexOf(&quot;&#39;A05&#39;&quot;); |
| src | const | 219 | no | const src = readFileSync(POLL_ROUND_PATH, &#39;utf8&#39;); |
| tests | const | 232 | no | const tests = discoverTests(); |
| mine | const | 233 | no | const mine = tests.find(t =&gt; t.path === &#39;scripts/roadmap/a05-cycle.test.mjs&#39;); |
| tests | const | 245 | no | const tests = discoverTests(); |
| coveredBy | const | 246 | no | const coveredBy = tests.filter(t =&gt; testCoversFile(t, &#39;scripts/roadmap/a05-cycle.mjs&#39;)); |
| src | const | 261 | no | const src = readFileSync(path.join(HERE, &#39;acceleration-queue.mjs&#39;), &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:child_process | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ./acceleration-queue.mjs | import | 7 | [scripts/roadmap/acceleration-queue.mjs](./acceleration-queue.mjs.md) |
| ./evidence-truth.mjs | import | 10 | [scripts/roadmap/evidence-truth.mjs](./evidence-truth.mjs.md) |
| ../lib/test-manifest.mjs | import | 11 | [scripts/lib/test-manifest.mjs](../lib/test-manifest.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRoadmap, validateRoadmap, readyFrontier, isIndependentlyAccepted
} from './acceleration-queue.mjs';
import { deriveReleaseTruth, loadReleaseSources } from './evidence-truth.mjs';
import { discoverTests, testCoversFile } from '../lib/test-manifest.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const ROADMAP_PATH = path.join(ROOT, 'docs/product/roadmap/roadmap.v1.json');
const RECEIPT_PATH = path.join(ROOT, 'docs/product/roadmap/receipts/A05.receipt.json');
const GATE_CARDS_PATH = path.join(ROOT, '.coordination/artifacts/roadmap/gate-cards.jsonl');
const CONTROLLER_PATH = path.join(ROOT, 'demo/host-legacy/controller.js');
const POLL_ROUND_PATH = path.join(ROOT, 'demo/host-legacy/poll-round.mjs');

const A05_WRITE_SCOPE = ['.coordination/', 'docs/product/roadmap/', 'scripts/'];
const LEDGERS = [
  'integration/beta-gates.json',
  '.integration/proposal5/08-BETA-GATES.json',
  'integration/release-manifest.json'
];

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
}
function gitDirty(relFiles) {
  const out = execFileSync('git', ['status', '--porcelain', '--'].concat(relFiles), {
    cwd: ROOT, encoding: 'utf8'
  }).trim();
  return out.split(/\r?\n/).filter(Boolean);
}
function l2Item(id) {
  const roadmap = loadRoadmap();
  return { roadmap, item: roadmap.layers.L2.find(x => x.id === id) };
}
function queueRow(roadmap, id) {
  return roadmap.buildQueue.find(q => q.itemId === id);
}

test('A05 readiness gate blocks selection until A01, A02 and A03 are independently accepted', () => {
  const { roadmap, item: a05 } = l2Item('A05');
  const result = validateRoadmap(roadmap);
  assert.equal(result.ok, false, 'roadmap must be invalid today (status mismatches A01-A04)');
  assert.ok(result.errors.some(e => /Status mismatch for A0[1-4]/.test(e)),
    'expected status mismatches for A01-A04, got: ' + result.errors.join('; '));
  assert.throws(() => readyFrontier(roadmap), /Invalid roadmap/,
    'readyFrontier must throw Invalid roadmap while dependencies are not accepted');
  assert.equal(a05.status, 'queued');
  assert.equal(a05.verification, 'UNRUN');
  assert.equal(a05.ownerAcceptance, 'PENDING');
  assert.equal(a05.execution, 'NOT_STARTED');
  assert.equal(a05.releaseClaim, false);
  assert.deepEqual(a05.dependsOn, ['A01', 'A02', 'A03']);
  for (const id of ['A01', 'A02', 'A03']) {
    const it = roadmap.layers.L2.find(x => x.id === id);
    assert.equal(isIndependentlyAccepted(it), false, id + ' must not be independently accepted');
    assert.equal(it.verification, 'UNRUN', id + '.verification must be UNRUN');
    assert.equal(it.ownerAcceptance, 'PENDING', id + '.ownerAcceptance must be PENDING');
  }
  const row = queueRow(roadmap, 'A05');
  assert.ok(row, 'A05 must have a buildQueue row');
  assert.equal(row.status, 'queued');
  assert.equal(row.verification, 'UNRUN');
  assert.equal(row.ownerAcceptance, 'PENDING');
});

test('independent verifier (evidence-truth) refuses acceptance; releaseReady stays false', () => {
  const sources = loadReleaseSources();
  const truth = deriveReleaseTruth(sources);
  assert.equal(truth.schema, 'arbor.release-truth-projection/2');
  assert.equal(truth.nature, 'READ_ONLY_CONFLICT_PROJECTION');
  assert.equal(truth.releaseReady, false);
  assert.equal(truth.disposition, 'BLOCKED_UNVERIFIED');
  assert.equal(truth.conflictingClaims, true);
  assert.ok(truth.blockers.length > 0, 'at least one blocker must refuse acceptance');
```

_First 80 of 265 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
