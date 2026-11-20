# File: scripts/feedback-loop/a03-verify.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/feedback-loop/a03-verify.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3823 B |
| Lines | 73 |
| Hash | 6f87e8a37282 |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 11 | no | const HERE = path.dirname(fileURLToPath(import.meta.url)); |
| ROOT | const | 12 | no | const ROOT = path.resolve(HERE, &#39;../..&#39;); |
| RECEIPT | const | 13 | no | const RECEIPT = &#39;docs/product/roadmap/receipts/A03.receipt.json&#39;; |
| FIXTURE | const | 14 | no | const FIXTURE = &#39;scripts/feedback-loop/fixtures/wiki-baseline.failed.json&#39;; |
| SHA | const | 15 | no | const SHA = &#39;9947bf32828f2cea2442748529e6595221128250&#39;; |
| CLI_ARGS | const | 16 | no | const CLI_ARGS = [&#39;scripts/feedback-loop/compile.mjs&#39;, &#39;--receipt&#39;, FIXTURE, |
| runCli | function | 19 | no | function runCli(extra = []) { |
| p | const | 20 | no | const p = spawnSync(process.execPath, [...CLI_ARGS, ...extra], { encoding: &#39;utf8&#39;, cwd: ROOT }); |
| r | const | 25 | no | const r = JSON.parse(readFileSync(path.join(ROOT, RECEIPT), &#39;utf8&#39;)); |
| c | const | 34 | no | const c = out.candidate; |
| dup | const | 42 | no | const dup = runCli([&#39;--condition&#39;, &#39;wiki-page-renders&#39;, &#39;--receipt&#39;, FIXTURE]); |
| none | const | 45 | no | const none = runCli([&#39;--condition&#39;, &#39;nonexistent-check&#39;]); |
| rm | const | 61 | no | const rm = JSON.parse(readFileSync(path.join(ROOT, &#39;docs/product/roadmap/roadmap.v1.json&#39;), &#39;utf8&#39;)); |
| l2 | const | 62 | no | const l2 = rm.layers.L2.find(x =&gt; x.id === &#39;A03&#39;); |
| q | const | 63 | no | const q = rm.buildQueue.find(x =&gt; x.itemId === &#39;A03&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 3 | external |
| node:assert/strict | import | 4 | external |
| node:fs | import | 5 | external |
| node:url | import | 6 | external |
| node:path | import | 7 | external |
| node:child_process | import | 8 | external |
| ./compiler.mjs | import | 9 | [scripts/feedback-loop/compiler.mjs](./compiler.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// A03 (verify) regression tests: acceptance criteria from roadmap.v1.json A03 entry
// plus the confirmed receipt-digest defect (A03.receipt.json:44 stale digest).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { stableDigest } from './compiler.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const RECEIPT = 'docs/product/roadmap/receipts/A03.receipt.json';
const FIXTURE = 'scripts/feedback-loop/fixtures/wiki-baseline.failed.json';
const SHA = '9947bf32828f2cea2442748529e6595221128250';
const CLI_ARGS = ['scripts/feedback-loop/compile.mjs', '--receipt', FIXTURE,
  '--source-sha', SHA, '--current-sha', SHA, '--revision', 'R002', '--current-revision', 'R002'];

function runCli(extra = []) {
  const p = spawnSync(process.execPath, [...CLI_ARGS, ...extra], { encoding: 'utf8', cwd: ROOT });
  return { status: p.status, stderr: p.stderr, out: p.stdout ? JSON.parse(p.stdout) : null };
}

test('DEFECT A03.receipt.json:44 — nlclReplay.digest matches sha256 over sorted checks', () => {
  const r = JSON.parse(readFileSync(path.join(ROOT, RECEIPT), 'utf8'));
  assert.equal(r.nlclReplay.digest, stableDigest(r.nlclReplay.checks),
    'stored digest is stale: verificationRun edit rewrote check details without re-digesting');
});

test('acceptance 1 — failed demo check yields one reproducible source-pinned work order', () => {
  const { status, out } = runCli(['--condition', 'wiki-page-renders']);
  assert.equal(status, 0);
  assert.equal(out.decision, 'CANDIDATE_REQUIRES_REVIEW');
  const c = out.candidate;
  assert.ok(c.existingRoadmapItemId && c.ownerLane && Array.isArray(c.narrowPaths) && c.narrowPaths.length >= 1);
  assert.ok(Array.isArray(c.dependencyIds) && typeof c.reproduction.command === 'string');
  assert.equal(c.reproduction.executed, 'UNRUN');
  assert.ok(c.sourcePin.sourceSha === SHA && c.acceptanceCondition.length > 0);
});

test('acceptance 2 — duplicate reports reconcile to one candidate; unknown check becomes bounded question', () => {
  const dup = runCli(['--condition', 'wiki-page-renders', '--receipt', FIXTURE]);
  assert.equal(dup.out.distinctFailedConditions, 1);
  assert.equal(dup.out.candidate.evidenceRefs.length, 1);
  const none = runCli(['--condition', 'nonexistent-check']);
  assert.equal(none.out.candidate, null);
  assert.equal(none.out.reviewRequired[0].reason, 'CONDITION_NOT_FOUND');
  assert.ok(none.out.reviewRequired[0].question.length > 0);
});

test('acceptance 3 — demo dry-run performs no source effects and no roadmap writes', () => {
  const { out } = runCli(['--condition', 'wiki-page-renders']);
  assert.equal(out.mode, 'DRY_RUN_READ_ONLY');
  assert.equal(out.noSourceEffects, true);
  assert.equal(out.noRoadmapWrites, true);
  assert.equal(out.candidate.kind, 'REVIEW_ONLY_NOT_EXECUTABLE');
  assert.equal(out.a03Activation, 'BLOCKED_A00_INDEPENDENT_ACCEPTANCE_PENDING');
});

test('roadmap A03 entry consistent between layers.L2 and buildQueue', () => {
  const rm = JSON.parse(readFileSync(path.join(ROOT, 'docs/product/roadmap/roadmap.v1.json'), 'utf8'));
  const l2 = rm.layers.L2.find(x => x.id === 'A03');
  const q = rm.buildQueue.find(x => x.itemId === 'A03');
  assert.equal(l2.lane, 'B');
  assert.deepEqual(l2.dependsOn, ['A00']);
  assert.equal(l2.acceptance.length, 3);
  assert.equal(l2.verification, 'UNRUN');
  assert.equal(l2.ownerAcceptance, 'PENDING');
  assert.equal(q.lane, l2.lane);
  assert.equal(q.verification, l2.verification);
  assert.equal(q.ownerAcceptance, l2.ownerAcceptance);
  for (const p of l2.integrationEvidence) readFileSync(path.join(ROOT, p));
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
