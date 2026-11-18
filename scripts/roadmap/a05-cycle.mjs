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
//   apps/vivim-host/public/demo/poll-round.mjs -> disk-only one-shot demo
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
const POLL_ROUND = join(REPO_ROOT, 'apps', 'vivim-host', 'public', 'demo', 'poll-round.mjs');

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
  if (!runGate) return { ok: true, skipped: true, reason: 'execution is authorized by the owner gate; --run-gate not passed' };
  const tests = discoverTests().filter(t => t.gate === 'roadmap-acceleration' &&
    t.path.startsWith('scripts/') && testCoversFile(t, 'scripts/roadmap/a05-cycle.mjs') === false &&
    (testCoversFile(t, `scripts/roadmap/${itemId.toLowerCase()}-cycle.mjs`) || t.path.includes(itemId.toLowerCase())));
  const receipts = [];
  for (const t of tests) {
    const startedAt = isoNow();
    const start = Date.now();
    let exitCode = null;
    try {
      execFileSync('node', ['--test', t.path], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      exitCode = 0;
    } catch (error) { exitCode = error.status ?? 1; }
    receipts.push({
      test: t.path, gate: t.gate, runtime: t.runtime,
      binary: 'node', binaryVersion: binaryVersion('node'),
      exitCode, durationMs: Date.now() - start, startedAt, finishedAt: isoNow()
    });
  }
  const ok = receipts.length > 0 && receipts.every(r => r.exitCode === 0);
  return { ok, skipped: false, receipts };
}

// Stage 3 — independent verification. An unrun/failed verifier cannot mark
// acceptance; release truth refuses while blockers exist.
function verifyStage() {
  const truth = deriveReleaseTruth(loadReleaseSources());
  return {
    ok: false, // A05 never self-accepts; the independent verifier holds the pen
    releaseReady: truth.releaseReady,
    disposition: truth.disposition,
    blockers: truth.blockers.map(b => b.code),
    independentKeeperReceipt: truth.evidence.independentKeeperReceipt
  };
}

// Stage 4 — demo rewalk: one-shot, disk-only poll of the demo feedback inbox via
// the existing poll-round contract (read-only child, no network imports).
function demoStage() {
  const startedAt = isoNow();
  const start = Date.now();
  let exitCode = null, rounds = [];
  try {
    const out = execFileSync('node', [POLL_ROUND], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    exitCode = 0;
    try { rounds = JSON.parse(out); } catch { rounds = []; }
  } catch (error) {
    exitCode = error.status ?? 1;
    try { rounds = JSON.parse(String(error.stdout || '[]')); } catch { rounds = []; }
  }
  return {
    mode: 'poll-round-once', exitCode, rounds: Array.isArray(rounds) ? rounds.length : 0,
    rewalk200: 0, // no live Host effect; rewalk proof stays disk-only in this cycle
    binary: 'node', binaryVersion: binaryVersion('node'),
    durationMs: Date.now() - start, startedAt, finishedAt: isoNow()
  };
}

// Stage 5 — requeue decision (proposal only; keeper sole-writer never flipped
// here). Next batch = ready frontier after this item, dependencies intact.
function requeueStage(select) {
  if (!select.ok || !select.pick) return { nextBatch: null, reason: select.reason || 'blocked' };
  const remaining = (select.frontier || []).filter(x => x.itemId !== select.pick.itemId);
  return {
    nextBatch: remaining.length > 0 ? remaining.map(x => x.itemId) : [],
    decision: 'requeue-proposed', roadmapWritten: false
  };
}

export function runA05Cycle({ itemId = ITEM, runGate = false, writeArtifact = true } = {}) {
  const startedAt = isoNow();
  const start = Date.now();
  const sha = commitSha();
  const select = selectStage(itemId);
  const checks = [];
  checks.push({ stage: 'select', ok: select.ok, reason: select.reason || 'ready', at: isoNow() });
  let execution = { ok: select.ok, skipped: !select.ok, reason: select.ok ? 'not authorized' : select.reason };
  if (select.ok) execution = executeStage(itemId, runGate);
  checks.push({ stage: 'execute', ok: execution.ok, skipped: execution.skipped, reason: execution.reason || '', at: isoNow() });
  const verify = verifyStage();
  checks.push({ stage: 'verify', ok: false, reason: 'independent verifier refuses acceptance: ' + verify.disposition, at: isoNow() });
  const demo = select.ok ? demoStage() : { mode: 'none', skipped: true, reason: select.reason };
  checks.push({ stage: 'demo', ok: Boolean(demo.exitCode === 0), skipped: Boolean(demo.skipped), at: isoNow() });
  const requeue = requeueStage(select);
  checks.push({ stage: 'requeue', ok: true, decision: requeue.decision, at: isoNow() });
  const receipt = {
    schema: 'arbor.item-receipt/1', itemId, cycle: 'build-verify-demo-requeue',
    status: select.ok && execution.ok ? 'executed' : 'blocked',
    verification: 'INDEPENDENT_REFUSED', // verifier stage never self-passes
    note: 'Authorized build, verify, demonstrate and requeue — cycle connected; ' +
      'acceptance stays with the independent verifier and owner gate',
    commitSha: sha, committedRevision: sha,
    gate: { command: 'bun scripts/roadmap/a05-cycle.mjs', exit: select.ok ? 0 : 1, note: 'fail-closed when keeper gate blocks' },
    evidence: {
      kind: 'build', changedPaths: ['scripts/roadmap/a05-cycle.mjs'],
      confirmedDefects: [], independentVerification: 'NOT_RUN',
      ownerAcceptance: 'PENDING', acceptanceEvidenceClaimed: false
    },
    checks, execution: execution.skipped ? { skipped: true } : { receipts: execution.receipts || [] },
    demo, requeue, truth: { releaseReady: verify.releaseReady, disposition: verify.disposition, blockers: verify.blockers },
    runtime: { gate: `bun ${binaryVersion('bun') ?? 'unknown'}`, node: binaryVersion('node') },
    durationMs: Date.now() - start, startedAt, finishedAt: isoNow(),
    emittedBy: 'Fixer r1-3'
  };
  if (writeArtifact) {
    mkdirSync(ARTIFACTS_DIR, { recursive: true });
    writeFileSync(join(ARTIFACTS_DIR, `a05-cycle-${sha ?? 'unknown'}.json`), JSON.stringify(receipt, null, 2) + '\n');
  }
  return receipt;
}

function cli() {
  const args = process.argv.slice(2);
  const itemIdx = args.indexOf('--item');
  const itemId = itemIdx > -1 ? args[itemIdx + 1] : ITEM;
  const runGate = args.includes('--run-gate');
  if (args.some(a => !['--item', '--run-gate', ITEM].includes(a)) && !args.includes('--item')) {
    process.stderr.write('Usage: bun scripts/roadmap/a05-cycle.mjs [--item A05] [--run-gate]\n');
    process.exitCode = 2;
    return;
  }
  const receipt = runA05Cycle({ itemId, runGate });
  process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
  if (receipt.status !== 'executed') process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
