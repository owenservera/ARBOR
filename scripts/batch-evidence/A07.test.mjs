import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import {
  loadRoadmap, isIndependentlyAccepted
} from '../roadmap/acceleration-queue.mjs';

// ============================================================================
// scripts/batch-evidence/A07.test.mjs
// Acceptance tests for item A07 "Evidence-driven parallel worker execution".
//
// Driver contract (partition 2, scripts/batch-evidence/A07.mjs — GREENFIELD, not
// yet present in this partition). Imported lazily with try/catch so this suite
// loads and its static/manifest tests pass now; driver-dependent tests SKIP with
// a clear reason until partition 2 delivers scripts/batch-evidence/A07.mjs.
//
// Expected driver contract:
//   export async function runA07Evidence({
//     root = REPO_ROOT,
//     workOrders = [],  // [{ id, writeScope: string[], command: string[], expectedSha?, linkReceipt? }]
//   } = {})
//   Returns { schema: 'arbor.item-receipt/1', ok, item: 'A07', checks: [], receipts: [] }
//   Each receipt: { schema: 'arbor.item-receipt/1', claim, commitSha, exitCode,
//     runtime, durationMs, startedAt, finishedAt } keyed by exact commit SHA.
//
// Behavior the driver must implement (ACCELERATION-R002.md §2/§6/§41):
//   * Reuses existing readyFrontier() gating: A07 runs only when A05+A06 are
//     independently accepted (EXECUTED/INDEPENDENT_PASS/ACCEPTED).
//   * Two disjoint write scopes run concurrently and converge; receipts link each
//     claim to the exact same commit SHA.
//   * Overlapping writer scopes block/serialize — no silent clobber.
//   * Stale expected SHA (expected != git rev-parse HEAD) refuses publish,
//     nonzero exit.
//   * Missing executed receipt (keyed by commit SHA) refuses publish.
//   * Receipts record REAL process exit code + runtime version — no simulated
//     worker success. No new orchestration runtime or second queue.
// ============================================================================

const REPO_ROOT = process.cwd();

function headSha() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

// Lazily load the A07 driver (partition 2). Returns { driver, error }.
let driverPromise = null;
function a07Driver() {
  if (!driverPromise) {
    driverPromise = (async () => {
      try {
        // eslint-disable-next-line no-underscore-dangle
        const mod = await import('./A07.mjs');
        return { driver: mod.runA07Evidence, error: null };
      } catch (error) {
        return { driver: null, error: String(error?.message || error) };
      }
    })();
  }
  return driverPromise;
}

test('A07 dependencies A05+A06 are not independently accepted (real roadmap)', () => {
  const roadmap = loadRoadmap();
  const a05 = roadmap.layers.L2.find(x => x.id === 'A05');
  const a06 = roadmap.layers.L2.find(x => x.id === 'A06');
  assert.ok(a05 && a06, 'A05 and A06 present in roadmap L2');
  assert.equal(isIndependentlyAccepted(a05), false,
    'A05 not independently accepted: execution=' + a05.execution + ' verification=' + a05.verification + ' ownerAcceptance=' + a05.ownerAcceptance);
  assert.equal(isIndependentlyAccepted(a06), false,
    'A06 not independently accepted: execution=' + a06.execution + ' verification=' + a06.verification + ' ownerAcceptance=' + a06.ownerAcceptance);
});

test('independently accepting A05+A06 satisfies A07 dependency gate (isIndependentlyAccepted)', () => {
  const roadmap = loadRoadmap();
  const a05 = roadmap.layers.L2.find(x => x.id === 'A05');
  const a06 = roadmap.layers.L2.find(x => x.id === 'A06');
  const accepted = (item) => {
    item.execution = 'EXECUTED';
    item.verification = 'INDEPENDENT_PASS';
    item.ownerAcceptance = 'ACCEPTED';
  };
  accepted(a05); accepted(a06);
  assert.ok(isIndependentlyAccepted(a05), 'A05 independently accepted');
  assert.ok(isIndependentlyAccepted(a06), 'A06 independently accepted');
  // readyFrontier() (acceleration-queue.mjs:130-147) requires every dep of a
  // queued row to be independently accepted; with A05+A06 accepted, A07's deps
  // are satisfied and A07 becomes eligible for the ready frontier.
});

test('driver dependency gating refuses to run when A05/A06 are not accepted', async t => {
  const { driver, error } = await a07Driver();
  if (!driver) {
    t.skip('A07 driver (scripts/batch-evidence/A07.mjs) not implemented by partition 2 yet: ' + error);
    return;
  }
  const root = mkdtempSync(join(os.tmpdir(), 'arbor-a07-gate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = await driver({ root, workOrders: [] });
  assert.equal(result.ok, false);
  assert.ok(result.checks.some(c => /dep|accept|ready/.test(String(c.name).toLowerCase())),
    'driver must refuse on unaccepted deps, checks=' + JSON.stringify(result.checks));
});

test('two disjoint write orders converge with receipts linked to same commit SHA', async t => {
  const { driver, error } = await a07Driver();
  if (!driver) {
    t.skip('A07 driver (scripts/batch-evidence/A07.mjs) not implemented by partition 2 yet: ' + error);
    return;
  }
  const head = headSha();
  const root = mkdtempSync(join(os.tmpdir(), 'arbor-a07-disjoint-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fs = await import('node:fs');
  const a = join(root, 'wo-a.out'); const b = join(root, 'wo-b.out');
  const result = await driver({
    root,
    workOrders: [
      { id: 'WO-A', writeScope: [a], command: ['node', '-e', `import {writeFileSync} from 'node:fs'; writeFileSync('${a}','A')`], expectedSha: head },
      { id: 'WO-B', writeScope: [b], command: ['node', '-e', `import {writeFileSync} from 'node:fs'; writeFileSync('${b}','B')`], expectedSha: head },
    ]
  });
  assert.equal(result.ok, true, JSON.stringify(result.checks.filter(c => !c.pass)));
  assert.equal(result.receipts.length, 2, 'one receipt per work order');
  const shas = new Set(result.receipts.map(r => r.commitSha));
  assert.equal(shas.size, 1, 'all receipts keyed to the exact same commit SHA');
  assert.equal([...shas][0], head, 'receipt commit SHA equals git rev-parse HEAD');
  assert.ok(result.receipts.every(r => /arbor\.item-receipt\/1/.test(r.schema)),
    'every receipt uses arbor.item-receipt/1 schema');
  assert.ok(result.receipts.every(r =>
    Number.isInteger(r.exitCode) && r.runtime && r.durationMs >= 0),
    'receipts record real exit code, runtime version, duration (not simulated)');
  assert.ok(fs.existsSync(a) && fs.existsSync(b),
    'both disjoint work orders wrote their output files');
});

test('overlapping write scopes serialize and refuse without silent clobber', async t => {
  const { driver, error } = await a07Driver();
  if (!driver) {
    t.skip('A07 driver (scripts/batch-evidence/A07.mjs) not implemented by partition 2 yet: ' + error);
    return;
  }
  const head = headSha();
  const root = mkdtempSync(join(os.tmpdir(), 'arbor-a07-overlap-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fs = await import('node:fs');
  const shared = join(root, 'shared.out');
  const result = await driver({
    root,
    workOrders: [
      { id: 'WO-X', writeScope: [shared], command: ['node', '-e', `import {writeFileSync} from 'node:fs'; writeFileSync('${shared}','X')`], expectedSha: head },
      { id: 'WO-Y', writeScope: [shared], command: ['node', '-e', `import {writeFileSync} from 'node:fs'; writeFileSync('${shared}','Y')`], expectedSha: head },
    ]
  });
  assert.equal(result.ok, false, 'overlapping scopes must not both succeed');
  assert.ok(result.checks.some(c => /conflict|overlap|serialize|clobber/.test(String(c.name).toLowerCase())),
    'driver must report path-conflict serialization, checks=' + JSON.stringify(result.checks));
  const content = fs.readFileSync(shared, 'utf8');
  assert.ok(content === '' || content === 'X' || content === 'Y',
    'shared file must not contain clobbered/merged garbage: ' + JSON.stringify(content));
});

test('stale expected SHA refuses publish with nonzero exit', async t => {
  const { driver, error } = await a07Driver();
  if (!driver) {
    t.skip('A07 driver (scripts/batch-evidence/A07.mjs) not implemented by partition 2 yet: ' + error);
    return;
  }
  const head = headSha();
  const stale = '0000000000000000000000000000000000000000000000000000000000000000';
  assert.notEqual(stale, head);
  const root = mkdtempSync(join(os.tmpdir(), 'arbor-a07-stale-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fs = await import('node:fs');
  const out = join(root, 'out.txt');
  const result = await driver({
    root,
    workOrders: [{ id: 'WO-STALE', writeScope: [out], command: ['node', '-e', `import {writeFileSync} from 'node:fs'; writeFileSync('${out}','ok')`], expectedSha: stale }]
  });
  assert.equal(result.ok, false, 'stale SHA must refuse publish');
  assert.ok(result.checks.some(c => /stale|fresh.head|drift|expectedSha/.test(String(c.name).toLowerCase())),
    'driver must report fresh-head drift, checks=' + JSON.stringify(result.checks));
  assert.equal(fs.existsSync(out), false, 'stale-SHA publish must not write the file');
});

test('missing executed receipt refuses publish', async t => {
  const { driver, error } = await a07Driver();
  if (!driver) {
    t.skip('A07 driver (scripts/batch-evidence/A07.mjs) not implemented by partition 2 yet: ' + error);
    return;
  }
  const head = headSha();
  const root = mkdtempSync(join(os.tmpdir(), 'arbor-a07-receipt-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fs = await import('node:fs');
  const out = join(root, 'out.txt');
  const result = await driver({
    root,
    workOrders: [{ id: 'WO-NORECEIPT', writeScope: [out], command: ['node', '-e', `import {writeFileSync} from 'node:fs'; writeFileSync('${out}','ok')`], expectedSha: head, linkReceipt: false }]
  });
  assert.equal(result.ok, false, 'missing receipt must refuse publish');
  assert.ok(result.checks.some(c => /receipt|missing|executed/.test(String(c.name).toLowerCase())),
    'driver must report missing receipt, checks=' + JSON.stringify(result.checks));
});

test('driver records real process exit code and runtime version (not simulated success)', async t => {
  const { driver, error } = await a07Driver();
  if (!driver) {
    t.skip('A07 driver (scripts/batch-evidence/A07.mjs) not implemented by partition 2 yet: ' + error);
    return;
  }
  const head = headSha();
  const root = mkdtempSync(join(os.tmpdir(), 'arbor-a07-real-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const out = join(root, 'out.txt');
  const result = await driver({
    root,
    workOrders: [{ id: 'WO-REAL', writeScope: [out], command: ['node', '-e', 'process.exit(3)'], expectedSha: head }]
  });
  assert.equal(result.ok, false, 'real nonzero exit must not be reported as success');
  const receipt = result.receipts.find(r => r.claim === 'WO-REAL') || result.receipts[0];
  assert.ok(receipt, 'a receipt must be emitted for the executed worker');
  assert.equal(receipt.exitCode, 3, 'receipt must record the REAL exit code (3), not simulate 0');
  assert.ok(receipt.runtime, 'receipt must record the runtime version used');
  assert.ok(typeof receipt.durationMs === 'number' && receipt.durationMs >= 0,
    'receipt must record real durationMs');
});

test('manifest entry for A07 is present and well-formed', () => {
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, 'scripts/test-manifest.json'), 'utf8'));
  const entry = manifest.find(e => e.path === 'scripts/batch-evidence/A07.test.mjs');
  assert.ok(entry, 'A07 test entry missing from scripts/test-manifest.json');
  assert.equal(entry.root, 'scripts/batch-evidence');
  assert.equal(entry.runtime, 'node24-ajv');
  assert.equal(entry.gate, 'roadmap-acceleration');
});
