# File: scripts/roadmap/a05-cycle.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/roadmap/a05-cycle.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10656 B |
| Lines | 207 |
| Hash | 88b3dad7940d |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 39 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 40 | no | const REPO_ROOT = resolve(HERE, &#39;..&#39;, &#39;..&#39;); |
| ARTIFACTS_DIR | const | 41 | no | const ARTIFACTS_DIR = join(HERE, &#39;artifacts&#39;); |
| ITEM | const | 42 | no | const ITEM = &#39;A05&#39;; |
| DEP_IDS | const | 43 | no | const DEP_IDS = [&#39;A01&#39;, &#39;A02&#39;, &#39;A03&#39;]; |
| POLL_ROUND | const | 44 | no | const POLL_ROUND = join(REPO_ROOT, &#39;demo&#39;, &#39;host-legacy&#39;, &#39;poll-round.mjs&#39;); |
| isoNow | function | 48 | no | function isoNow() { return new Date().toISOString(); } |
| selectStage | function | 53 | no | function selectStage(itemId) { |
| roadmap | const | 54 | no | const roadmap = loadRoadmap(); |
| checked | const | 55 | no | const checked = validateRoadmap(roadmap); |
| item | const | 56 | no | const item = roadmap.layers.L2.find(x =&gt; x.id === itemId); |
| row | const | 57 | no | const row = roadmap.buildQueue.find(q =&gt; q.itemId === itemId); |
| depsOk | const | 59 | no | const depsOk = DEP_IDS.every(id =&gt; isIndependentlyAccepted(roadmap.layers.L2.find(x =&gt; x.id === id))); |
| unrun | const | 64 | no | const unrun = DEP_IDS.filter(id =&gt; { const dep = roadmap.layers.L2.find(x =&gt; x.id === id); return !isIndependentlyAccepted(dep); }); |
| dep | const | 65 | no | const dep = roadmap.layers.L2.find(x =&gt; x.id === id); |
| frontier | variable | 70 | no | let frontier = []; |
| pick | const | 74 | no | const pick = frontier.find(x =&gt; x.itemId === itemId) \|\| frontier[0] \|\| null; |
| executeStage | function | 80 | no | function executeStage(itemId, runGate) { |
| tests | const | 82 | no | const tests = discoverTests().filter(t =&gt; t.gate === &#39;roadmap-acceleration&#39; &amp;&amp; t.path.startsWith(&#39;scripts/&#39;) &amp;&amp; testCoversFile(t, &#39;scripts/roadmap/a05-cycle.mjs&#39;) === false &amp;&amp; (testCoversFile(t, `scr… |
| receipts | const | 85 | no | const receipts = []; |
| startedAt | const | 87 | no | const startedAt = isoNow(); |
| start | const | 88 | no | const start = Date.now(); |
| exitCode | variable | 89 | no | let exitCode = null; |
| ok | const | 100 | no | const ok = receipts.length &gt; 0 &amp;&amp; receipts.every(r =&gt; r.exitCode === 0); |
| verifyStage | function | 106 | no | function verifyStage() { |
| truth | const | 107 | no | const truth = deriveReleaseTruth(loadReleaseSources()); |
| demoStage | function | 119 | no | function demoStage() { |
| startedAt | const | 120 | no | const startedAt = isoNow(); |
| start | const | 121 | no | const start = Date.now(); |
| exitCode | variable | 122 | no | let exitCode = null, rounds = []; |
| out | const | 124 | no | const out = execFileSync(&#39;node&#39;, [POLL_ROUND], { cwd: REPO_ROOT, encoding: &#39;utf8&#39;, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;] }); |
| requeueStage | function | 141 | no | function requeueStage(select) { |
| remaining | const | 143 | no | const remaining = (select.frontier \|\| []).filter(x =&gt; x.itemId !== select.pick.itemId); |
| runA05Cycle | function | 150 | yes | export function runA05Cycle({ itemId = ITEM, runGate = false, writeArtifact = true } = {}) { |
| startedAt | const | 151 | no | const startedAt = isoNow(); |
| start | const | 152 | no | const start = Date.now(); |
| sha | const | 153 | no | const sha = commitSha(); |
| checks | const | 155 | no | const checks = []; |
| execution | variable | 157 | no | let execution = { ok: select.ok, skipped: !select.ok, reason: select.ok ? &#39;not authorized&#39; : select.reason }; |
| verify | const | 160 | no | const verify = verifyStage(); |
| demo | const | 162 | no | const demo = select.ok ? demoStage() : { mode: &#39;none&#39;, skipped: true, reason: select.reason }; |
| requeue | const | 164 | no | const requeue = requeueStage(select); |
| receipt | const | 166 | no | const receipt = { |
| cli | function | 192 | no | function cli() { |
| args | const | 193 | no | const args = process.argv.slice(2); |
| itemIdx | const | 194 | no | const itemIdx = args.indexOf(&#39;--item&#39;); |
| itemId | const | 195 | no | const itemId = itemIdx &gt; -1 ? args[itemIdx + 1] : ITEM; |
| runGate | const | 196 | no | const runGate = args.includes(&#39;--run-gate&#39;); |
| receipt | const | 202 | no | const receipt = runA05Cycle({ itemId, runGate }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 28 | external |
| node:fs | import | 29 | external |
| node:path | import | 30 | external |
| node:url | import | 31 | external |
| ./acceleration-queue.mjs | import | 32 | [scripts/roadmap/acceleration-queue.mjs](./acceleration-queue.mjs.md) |
| ./evidence-truth.mjs | import | 35 | [scripts/roadmap/evidence-truth.mjs](./evidence-truth.mjs.md) |
| ../lib/test-manifest.mjs | import | 36 | [scripts/lib/test-manifest.mjs](../lib/test-manifest.mjs.md) |
| ../lib/test-receipt.mjs | import | 37 | [scripts/lib/test-receipt.mjs](../lib/test-receipt.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/batch-evidence/A05.test.mjs](../batch-evidence/A05.test.mjs.md) | ../roadmap/a05-cycle.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env bun
// scripts/roadmap/a05-cycle.mjs
//
// A05 cycle driver — "Authorized build, verify, demonstrate and requeue" (build).
// Connects the EXISTING keeper/demo execution contracts to one cycle that carries
// a scoped repair to an independent executed receipt, a demo rewalk and a next
// queue decision. No new orchestration runtime, no second queue, no roadmap
// write: the keeper stays the sole roadmap writer (acceleration-queue.mjs:2-3).
//
// Reused contracts (read-only imports, nothing re-implemented):
//   scripts/roadmap/acceleration-queue.mjs -> loadRoadmap, validateRoadmap,
//     readyFrontier, isIndependentlyAccepted (keeper selection, deterministic)
//   scripts/roadmap/evidence-truth.mjs      -> loadReleaseSources, deriveReleaseTruth
//     (independent verifier; refuses acceptance while releaseReady is false)
//   scripts/lib/test-manifest.mjs           -> discoverTests, testCoversFile
//   scripts/lib/test-receipt.mjs            -> commitSha, binaryVersion (real
//     dispatched runtime version, never the gate's own process.version)
//   demo/host-legacy/poll-round.mjs -> disk-only one-shot demo
//     feedback inbox poller, spawned read-only as a child process (demo rewalk)
//
// Fail-closed: if the roadmap is invalid or the selected item's dependencies are
// not independently accepted, the cycle refuses to execute and exits nonzero.
// Receipts land under scripts/roadmap/artifacts/ (A05 writeScope: scripts/),
// never at the repository root.
//
//   bun scripts/roadmap/a05-cycle.mjs [--item A05] [--run-gate]

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRoadmap, validateRoadmap, readyFrontier, isIndependentlyAccepted
} from './acceleration-queue.mjs';
import { loadReleaseSources, deriveReleaseTruth } from './evidence-truth.mjs';
import { discoverTests, testCoversFile } from '../lib/test-manifest.mjs';
import { commitSha, binaryVersion } from '../lib/test-receipt.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const ARTIFACTS_DIR = join(HERE, 'artifacts');
const ITEM = 'A05';
const DEP_IDS = ['A01', 'A02', 'A03'];
const POLL_ROUND = join(REPO_ROOT, 'demo', 'host-legacy', 'poll-round.mjs');

// --- cycle stages ------------------------------------------------------------

function isoNow() { return new Date().toISOString(); }

// Stage 1 — keeper selection (read-only). Refuses when the roadmap is invalid or
// the item's dependencies are not independently accepted (EXECUTED +
// INDEPENDENT_PASS + ACCEPTED).
function selectStage(itemId) {
  const roadmap = loadRoadmap();
  const checked = validateRoadmap(roadmap);
  const item = roadmap.layers.L2.find(x => x.id === itemId);
  const row = roadmap.buildQueue.find(q => q.itemId === itemId);
  if (!item || !row) return { ok: false, reason: 'item ' + itemId + ' missing from roadmap/queue' };
  const depsOk = DEP_IDS.every(id => isIndependentlyAccepted(roadmap.layers.L2.find(x => x.id === id)));
  if (!checked.ok) {
    return { ok: false, reason: 'Invalid roadmap: ' + checked.errors.join('; '), depsOk };
  }
  if (!depsOk) {
    const unrun = DEP_IDS.filter(id => {
      const dep = roadmap.layers.L2.find(x => x.id === id);
      return !isIndependentlyAccepted(dep);
    });
    return { ok: false, reason: 'dependencies not independently accepted: ' + unrun.join(','), depsOk };
  }
  let frontier = [];
  try { frontier = readyFrontier(roadmap); } catch (error) {
    return { ok: false, reason: String(error?.message || error), depsOk };
  }
  const pick = frontier.find(x => x.itemId === itemId) || frontier[0] || null;
  return { ok: true, item, row, pick, frontier, depsOk };
}

// Stage 2 — scoped execution: run only manifest-registered tests covering the
// item's own files, as REAL child processes; record exit code + real runtime.
function executeStage(itemId, runGate) {
```

_First 80 of 208 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
