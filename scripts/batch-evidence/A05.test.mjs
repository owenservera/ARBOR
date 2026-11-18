import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadRoadmap, validateRoadmap, readyFrontier, isIndependentlyAccepted
} from '../roadmap/acceleration-queue.mjs';
import { discoverTests, testCoversFile } from '../lib/test-manifest.mjs';

// ============================================================================
// scripts/batch-evidence/A05.test.mjs
// Acceptance tests for item A05 "Authorized build, verify, demonstrate and requeue"
// (ACCELERATION-R002.md §3 row A05: prove = one actual repair reaches an
// independent executed receipt, demo rewalk and next queue decision; deps A01,A02,A03).
//
// CONFIRMED DEFECTS supplied with this work order: none — no defect-regression
// cases exist to write; this suite covers the acceptance criteria only.
//
// Driver contract (scripts/batch-evidence/A05.mjs — GREENFIELD, not yet present).
// Imported lazily with try/catch so this suite loads and its static/manifest
// tests pass now; driver-dependent tests SKIP with a clear reason until the
// driver lands.
//
// Expected driver contract:
//   export async function runA05Evidence({ root = REPO_ROOT } = {})
//   Returns { schema: 'arbor.item-receipt/1', ok, item: 'A05', checks: [],
//     repair: {...}, receipts: [], rewalk: {...}, nextQueue: {...} }
//
// Behavior the driver must implement:
//   * Selects a ready work order via readyFrontier() gating only — A05 runs
//     only when A01+A02+A03 are independently accepted
//     (EXECUTED/INDEPENDENT_PASS/ACCEPTED, acceleration-queue.mjs:32-37).
//   * Carries ONE actual scoped repair from demo failure to committed diff,
//     independent executed test receipts, demo rewalk and next queue decision.
//   * Unrun/failed verifier cannot mark acceptance; original evidence immutable.
//   * Stale expected SHA refuses publish, nonzero exit.
//   * Missing executed receipt refuses publish — no simulated success.
//   * No new orchestration runtime or second queue; no Host effect.
// ============================================================================

const REPO_ROOT = process.cwd();
const RECEIPT_PATH = join(REPO_ROOT, 'docs/product/roadmap/receipts/A05.receipt.json');

function headSha() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

// Lazily load the A05 cycle driver (scripts/roadmap/a05-cycle.mjs, landed by the
// fixer lane). Returns { driver, error }.
let driverPromise = null;
function a05Driver() {
  if (!driverPromise) {
    driverPromise = (async () => {
      try {
        const mod = await import('../roadmap/a05-cycle.mjs');
        return { driver: mod.runA05Cycle, error: null };
      } catch (error) {
        return { driver: null, error: String(error?.message || error) };
      }
    })();
  }
  return driverPromise;
}

// Deep clone of the real roadmap with L2/queue status drift harmonized, so
// validateRoadmap/readyFrontier can run deterministically in-process.
function sanitizedRoadmap() {
  const roadmap = JSON.parse(JSON.stringify(loadRoadmap()));
  const byId = new Map(roadmap.layers.L2.map(x => [x.id, x]));
  for (const row of roadmap.buildQueue) {
    const item = byId.get(row.itemId);
    if (!item) continue;
    item.status = row.status;
    item.verification = row.verification;
    item.ownerAcceptance = row.ownerAcceptance;
  }
  return roadmap;
}

test('A05 acceptance contract in roadmap.v1.json: deps A01+A02+A03, lane B, scoped writeScope, no false-green', () => {
  const roadmap = loadRoadmap();
  const a05 = roadmap.layers.L2.find(x => x.id === 'A05');
  assert.ok(a05, 'A05 present in roadmap L2');
  assert.deepEqual(a05.dependsOn, ['A01', 'A02', 'A03']);
  assert.equal(a05.lane, 'B');
  assert.deepEqual(a05.writeScope, ['.coordination/', 'docs/product/roadmap/', 'scripts/']);
  assert.ok(Array.isArray(a05.acceptance) && a05.acceptance.length >= 3,
    'A05 must carry an executable acceptance contract');
  const joined = a05.acceptance.join(' ');
  assert.ok(/repair/i.test(joined) && /receipt/i.test(joined) && /rewalk/i.test(joined) && /queue/i.test(joined),
    'acceptance must span repair, independent receipt, rewalk and queue update');
  assert.equal(a05.verification, 'UNRUN', 'A05 verification stays UNRUN — no independent result yet');
  assert.equal(a05.ownerAcceptance, 'PENDING', 'no owner acceptance claimed');
  assert.equal(a05.releaseClaim, false, 'A05 must not claim release authority');
  const row = roadmap.buildQueue.find(q => q.itemId === 'A05');
  assert.ok(row, 'A05 must have a buildQueue row');
  assert.equal(row.verification, 'RECEIPT_VERIFICATION_FAILED',
    'queue row records the failed receipt verification, not a pass');
  assert.equal(row.ownerAcceptance, 'PENDING');
});

test('A05 dependencies A01+A02+A03 are not independently accepted (real roadmap)', () => {
  const roadmap = loadRoadmap();
  for (const id of ['A01', 'A02', 'A03']) {
    const item = roadmap.layers.L2.find(x => x.id === id);
    assert.ok(item, id + ' present in roadmap L2');
    assert.equal(isIndependentlyAccepted(item), false,
      id + ' not independently accepted: execution=' + item.execution +
      ' verification=' + item.verification + ' ownerAcceptance=' + item.ownerAcceptance);
    assert.equal(item.verification, 'UNRUN', id + '.verification must be UNRUN');
    assert.equal(item.ownerAcceptance, 'PENDING', id + '.ownerAcceptance must be PENDING');
  }
});

test('A05 is not in the ready frontier while A01/A02/A03 are unaccepted; accepted deps make A05 the next queue decision', () => {
  // Real roadmap today: status drift makes validateRoadmap invalid and
  // readyFrontier throws — A05 must not be selectable either way.
  const real = loadRoadmap();
  const check = validateRoadmap(real);
  if (!check.ok) {
    assert.throws(() => readyFrontier(real), /Invalid roadmap/,
      'readyFrontier must refuse an invalid roadmap');
  } else {
    assert.ok(!readyFrontier(real).some(r => r.itemId === 'A05'),
      'A05 must not be ready while deps are unaccepted');
  }
  // Synthetic: deps independently accepted -> A05 becomes eligible (next queue decision).
  const synth = sanitizedRoadmap();
  const byId = new Map(synth.layers.L2.map(x => [x.id, x]));
  for (const id of ['A01', 'A02', 'A03']) {
    const item = byId.get(id);
    item.status = 'executed';
    item.execution = 'EXECUTED';
    item.verification = 'INDEPENDENT_PASS';
    item.ownerAcceptance = 'ACCEPTED';
    const row = synth.buildQueue.find(q => q.itemId === id);
    row.status = 'executed';
    row.verification = 'INDEPENDENT_PASS';
    row.ownerAcceptance = 'ACCEPTED';
  }
  const result = validateRoadmap(synth);
  assert.equal(result.ok, true, 'sanitized roadmap must validate: ' + result.errors.join('; '));
  const ready = readyFrontier(synth).map(r => r.itemId);
  assert.ok(ready.includes('A05'),
    'with A01+A02+A03 independently accepted, A05 must enter the ready frontier; got: ' + ready.join(','));
});

test('A05 receipt on disk claims no acceptance evidence; confirmedDefects empty (no defect regressions to write)', () => {
  const rec = JSON.parse(readFileSync(RECEIPT_PATH, 'utf8'));
  assert.equal(rec.schema, 'arbor.item-receipt/1');
  assert.equal(rec.itemId, 'A05');
  assert.equal(rec.status, 'queued');
  assert.equal(rec.verification, 'RECEIPT_VERIFICATION_FAILED');
  assert.deepEqual(rec.evidence.confirmedDefects, [],
    'work order carried zero confirmed defects — nothing to regress');
  assert.equal(rec.evidence.independentVerification, 'NOT_RUN');
  assert.equal(rec.evidence.ownerAcceptance, 'PENDING');
  assert.equal(rec.evidence.acceptanceEvidenceClaimed, false,
    'no acceptance evidence may be claimed from a pick record');
});

test('driver exists and exports runA05Cycle (build-verify-demo-requeue cycle)', async () => {
  const { driver, error } = await a05Driver();
  assert.ok(driver, 'scripts/roadmap/a05-cycle.mjs must export runA05Cycle: ' + error);
  assert.equal(typeof driver, 'function');
});

test('driver fail-closed: deps A01/A02/A03 unaccepted -> cycle refuses, blocked, nonzero gate exit, no acceptance claimed', async () => {
  const { driver, error } = await a05Driver();
  assert.ok(driver, 'driver missing: ' + error);
  const receipt = await driver({ itemId: 'A05', runGate: false, writeArtifact: false });
  assert.equal(receipt.schema, 'arbor.item-receipt/1');
  assert.equal(receipt.itemId, 'A05');
  assert.equal(receipt.cycle, 'build-verify-demo-requeue');
  assert.equal(receipt.status, 'blocked', 'cycle must refuse while keeper gate blocks');
  assert.equal(receipt.gate.exit, 1, 'fail-closed gate exit must be nonzero');
  const select = receipt.checks.find(c => c.stage === 'select');
  assert.equal(select.ok, false, 'select stage must refuse');
  assert.ok(/Invalid roadmap|dependencies not independently accepted/.test(select.reason || ''),
    'refusal reason must cite the invalid roadmap or unaccepted deps: ' + select.reason);
  assert.equal(receipt.verification, 'INDEPENDENT_REFUSED',
    'verifier stage never self-passes; an unrun verifier cannot mark acceptance');
  assert.equal(receipt.truth.releaseReady, false);
  assert.equal(receipt.evidence.independentVerification, 'NOT_RUN');
  assert.equal(receipt.evidence.ownerAcceptance, 'PENDING');
  assert.equal(receipt.evidence.acceptanceEvidenceClaimed, false, 'no false-green acceptance');
  assert.deepEqual(receipt.evidence.confirmedDefects, []);
  assert.ok(/^[a-f0-9]{40}$/.test(receipt.commitSha), 'receipt pinned to real commit SHA ' + receipt.commitSha);
  assert.equal(receipt.commitSha, headSha(), 'receipt SHA must equal git rev-parse HEAD');
});

test('driver CLI: bun scripts/roadmap/a05-cycle.mjs exits 1 with blocked receipt on real process', () => {
  let run;
  try {
    const stdout = execFileSync('bun', ['scripts/roadmap/a05-cycle.mjs'], {
      cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    run = { exitCode: 0, stdout: String(stdout) };
  } catch (error) {
    run = { exitCode: typeof error.status === 'number' ? error.status : 1, stdout: String(error.stdout ?? '') };
  }
  assert.equal(run.exitCode, 1, 'blocked cycle must exit nonzero (real process exit)');
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.itemId, 'A05');
  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.cycle, 'build-verify-demo-requeue');
  assert.equal(receipt.verification, 'INDEPENDENT_REFUSED');
  assert.equal(receipt.evidence.acceptanceEvidenceClaimed, false);
});

test('test-manifest registers scripts/batch-evidence/A05.test.mjs (roadmap-acceleration gate)', () => {
  const tests = discoverTests();
  const mine = tests.find(t => t.path === 'scripts/batch-evidence/A05.test.mjs');
  assert.ok(mine, 'A05.test.mjs must be registered in scripts/test-manifest.json');
  assert.equal(mine.root, 'scripts/batch-evidence');
  assert.equal(mine.runtime, 'node24-ajv');
  assert.equal(mine.gate, 'roadmap-acceleration');
  assert.equal(testCoversFile(mine, 'scripts/batch-evidence/A05.test.mjs'), true);
  assert.equal(testCoversFile(mine, 'scripts/roadmap/acceleration-queue.mjs'), true);
  assert.equal(testCoversFile(mine, 'scripts/roadmap/a05-cycle.mjs'), true,
    'A05.test.mjs dynamically imports the landed cycle driver, so the fail-closed gap is closed');
  assert.equal(testCoversFile(mine, 'scripts/lib/test-manifest.mjs'), true);
});
