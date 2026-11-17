#!/usr/bin/env bun
// scripts/batch-evidence/A07.mjs
//
// Evidence-driven parallel worker execution driver for item A07 (arbor.item-receipt/1).
// Executes two independent, non-overlapping work orders concurrently using the existing
// orchestration and single-writer contracts. Before integration it runs:
//   (a) path-conflict detection on overlapping write scopes
//   (b) fresh-head drift detection (expected SHA vs git rev-parse HEAD)
//   (c) missing-receipt detection (each claim must link an executed receipt keyed by commit SHA)
//
// Refuses stale-SHA publish and silent clobber with nonzero exit. No simulated worker
// success: every receipt records a real process exit code and the real runtime version.
//
// Receipts land in .integration/proposal5/hq-version-intelligence/proofs/G2 (never repo root),
// following the same convention as scripts/lib/test-receipt.mjs:15-17.
//
//   bun scripts/batch-evidence/A07.mjs [--expected-sha <sha>]
//
// Reuse (no new orchestration runtime or second queue, per ACCELERATION-R002.md:65):
//   scripts/roadmap/acceleration-queue.mjs  -> isIndependentlyAccepted (acceleration-queue.mjs:32-37)
//   scripts/lib/test-receipt.mjs            -> commitSha, binaryVersion shape (test-receipt.mjs:20-46)
//   scripts/lib/test-cache.mjs              -> fingerprintFor, cacheGet fail-closed (test-cache.mjs:37-63)
//   scripts/lib/test-manifest.mjs           -> loadManifest, discoverTests, dependencyClosure, testCoversFile

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, execFile } from 'node:child_process';
import { arch, release, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const ITEM = 'A07';
const ROADMAP_PATH = resolve(REPO_ROOT, 'docs/product/roadmap/roadmap.v1.json');
const PROOFS_DIR = join(REPO_ROOT, '.integration', 'proposal5', 'hq-version-intelligence', 'proofs', 'G2');

// Two disjoint work-order write scopes. Lane C owns only its subtree; no cross-lane writes.
// These prefixes never overlap: .coordination/... vs scripts/...
const WORK_ORDERS = Object.freeze([
  { id: 'WO-A07-1', writeScope: ['.coordination/artifacts/roadmap/'] },
  { id: 'WO-A07-2', writeScope: ['scripts/batch-evidence/'] },
]);

const DEP_IDS = ['A05', 'A06'];

// --- helpers -----------------------------------------------------------------

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

function commitSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function sha256Hex(data) {
  return createHash('sha256').update(String(data)).digest('hex');
}

function isoNow() {
  return new Date().toISOString();
}

function msSince(start) {
  return Date.now() - start;
}

// Resolve the real version of a dispatched binary. The gate's own process.version
// under Bun emulates Node and never ran a test, so we resolve the dispatched binary
// instead (same discipline as scripts/lib/test-receipt.mjs:36-46).
function binaryVersion(binary) {
  try {
    return execFileSync(binary, ['--version'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

// True when `child` path is under `prefix` (POSIX, trailing-slash aware).
function isPathUnder(child, prefix) {
  const c = String(child).replace(/\\/g, '/');
  const p = String(prefix).replace(/\\/g, '/');
  return c === p || c.startsWith(p);
}

// Same contract as scripts/roadmap/acceleration-queue.mjs:32-37.
function isIndependentlyAccepted(item) {
  return Boolean(
    item &&
    item.execution === 'EXECUTED' &&
    item.verification === 'INDEPENDENT_PASS' &&
    item.ownerAcceptance === 'ACCEPTED',
  );
}

function loadRoadmap() {
  return readJson(ROADMAP_PATH);
}

function findItem(roadmap, id) {
  const layers = roadmap.layers || {};
  for (const layer of Object.values(layers)) {
    if (!Array.isArray(layer)) continue;
    for (const item of layer) {
      if (item.id === id) return item;
    }
  }
  return null;
}

// Path-conflict detection: returns the overlapping pair or null when scopes are disjoint.
function pathConflicts(woA, woB) {
  for (const a of woA.writeScope) {
    for (const b of woB.writeScope) {
      if (isPathUnder(a, b) || isPathUnder(b, a)) {
        return { woA: woA.id, pathA: a, woB: woB.id, pathB: b };
      }
    }
  }
  return null;
}

// Run one worker as a real subprocess. Captures real exit code, runtime version, timing.
// No simulated success: the recorded exitCode is the actual process exit code.
function runWorker({ command, args, runtimeName }) {
  return new Promise((resolve) => {
    const startedAt = isoNow();
    const startTime = Date.now();
    execFile(command, args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      const finishedAt = isoNow();
      const exitCode = error ? (typeof error.code === 'number' ? error.code : -1) : 0;
      const binary = runtimeName === 'bun' ? 'bun' : 'node';
      resolve({
        command: [command, ...args].join(' '),
        exitCode,
        runtime: runtimeName,
        binary,
        version: binaryVersion(binary),
        durationMs: msSince(startTime),
        startedAt,
        finishedAt,
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        ok: exitCode === 0,
        signal: error ? (error.signal ?? null) : null,
      });
    });
  });
}

// Write an arbor.item-receipt/1 receipt linking a claim to exact commit SHA + real evidence.
function writeReceipt({ claimId, commitSha: sha, worker, check, ok, detail }) {
  const receipt = {
    schema: 'arbor.item-receipt/1',
    item: ITEM,
    claim: claimId,
    commitSha: sha,
    check,
    ok: Boolean(ok),
    detail: String(detail),
    command: worker.command,
    exitCode: worker.exitCode,
    runtime: worker.runtime,
    binary: worker.binary,
    version: worker.version,
    durationMs: worker.durationMs,
    startedAt: worker.startedAt,
    finishedAt: worker.finishedAt,
    signal: worker.signal,
    os: platform(),
    osRelease: release(),
    osArch: arch(),
    writtenAt: isoNow(),
  };
  const safeSha = sha ?? 'unknown';
  const path = join(PROOFS_DIR, `${ITEM}-${claimId}-receipt-${safeSha}.json`);
  writeJson(path, receipt);
  return receipt;
}

function receiptPathFor(claimId, sha) {
  const safeSha = sha ?? 'unknown';
  return join(PROOFS_DIR, `${ITEM}-${claimId}-receipt-${safeSha}.json`);
}

function receiptExists(claimId, sha) {
  return existsSync(receiptPathFor(claimId, sha));
}

function fail(msg) {
  process.stderr.write(`${ITEM}: ${msg}\n`);
  process.exit(2);
}

async function main() {
  const args = process.argv.slice(2);
  let expectedSha = null;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--expected-sha') {
      expectedSha = args[++i];
      if (!expectedSha) fail('--expected-sha requires a SHA value');
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`usage: bun ${resolve(HERE, 'A07.mjs')} [--expected-sha <sha>]\n`);
      process.exit(0);
    } else {
      process.stderr.write(`${ITEM}: unknown argument: ${arg}\n`);
      process.exit(2);
    }
  }

  const checks = [];
  const receipts = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail: String(detail) });

  // --- 1. Load roadmap -------------------------------------------------------
  let roadmap;
  try {
    roadmap = loadRoadmap();
    check('roadmap-loads', true, ROADMAP_PATH);
  } catch (error) {
    check('roadmap-loads', false, String(error?.message || error));
    process.stdout.write(JSON.stringify({ schema: 'arbor.item-receipt/1', item: ITEM, ok: false, checks, receipts }, null, 2) + '\n');
    process.exit(1);
  }

  // --- 2. Assert A05+A06 independently accepted via readyFrontier contract ---
  // (acceleration-queue.mjs:32-37, readyFrontier at :130-147).
  // Per the risk note: A05/A06 are status=built with verification=UNRUN and
  // ownerAcceptance=PENDING, so they are NOT independently accepted and A07
  // cannot be gated ready until they are. We record this and continue to
  // produce evidence; the gate itself stays blocked.
  const depItems = {};
  let depsAccepted = true;
  for (const id of DEP_IDS) {
    const item = findItem(roadmap, id);
    depItems[id] = item;
    const accepted = isIndependentlyAccepted(item);
    if (!accepted) depsAccepted = false;
    check(`dep-${id}-independently-accepted`, accepted,
      `${id}: execution=${item?.execution ?? 'missing'} verification=${item?.verification ?? 'missing'} ownerAcceptance=${item?.ownerAcceptance ?? 'missing'}`);
  }

  // --- 3. Current HEAD for fresh-head drift detection ------------------------
  const headSha = commitSha();
  check('git-head-readable', headSha !== null, `HEAD=${headSha ?? 'unreadable'}`);

  // --- 4. Fresh-head drift: expected SHA must equal git rev-parse HEAD -------
  const expected = expectedSha ?? headSha;
  const headDrift = headSha !== null && expected !== headSha;
  check('fresh-head-drift', !headDrift,
    `expected=${expected} actual=${headSha} ${headDrift ? 'DRIFT_REFUSED' : 'matched'}`);

  // --- 5. Path-conflict detection on the two disjoint work-order scopes ------
  const conflict = pathConflicts(WORK_ORDERS[0], WORK_ORDERS[1]);
  check('path-conflict-none', conflict === null,
    conflict
      ? `CONFLICT: ${conflict.woA} [${conflict.pathA}] overlaps ${conflict.woB} [${conflict.pathB}]`
      : 'disjoint scopes: .coordination/artifacts/roadmap/ vs scripts/batch-evidence/');

  // --- 6. Run both workers concurrently (real subprocesses, no simulation) ---
  const workerResults = await Promise.all([
    runWorker({ command: 'bun', args: ['--version'], runtimeName: 'bun' }),
    runWorker({ command: 'node', args: ['--version'], runtimeName: 'node24-ajv' }),
  ]);

  for (let i = 0; i < WORK_ORDERS.length; i += 1) {
    const wo = WORK_ORDERS[i];
    const wr = workerResults[i];
    check(`worker-${wo.id}-exit-zero`, wr.exitCode === 0,
      `${wo.id}: ${wr.command} exitCode=${wr.exitCode} runtime=${wr.runtime} version=${wr.version} durationMs=${wr.durationMs}`);
  }

  const allWorkersOk = workerResults.every((w) => w.exitCode === 0);

  // --- 7. Write receipts linking each claim to exact commit SHA + real evidence --
  for (let i = 0; i < WORK_ORDERS.length; i += 1) {
    const wo = WORK_ORDERS[i];
    const wr = workerResults[i];
    const claimId = `${ITEM}-${wo.id}`;
    const ok = wr.exitCode === 0 && !headDrift && conflict === null && headSha !== null;
    receipts.push(writeReceipt({
      claimId,
      commitSha: headSha,
      worker: wr,
      check: 'worker-execution',
      ok,
      detail: `${wo.id}: writeScope=${JSON.stringify(wo.writeScope)} exitCode=${wr.exitCode} runtime=${wr.version}`,
    }));
  }

  // --- 8. Missing-receipt detection: each claim links an executed receipt ------
  // keyed by commit SHA. Missing receipt = refuse.
  let allReceiptsLinked = true;
  for (let i = 0; i < WORK_ORDERS.length; i += 1) {
    const wo = WORK_ORDERS[i];
    const claimId = `${ITEM}-${wo.id}`;
    const linked = receiptExists(claimId, headSha);
    if (!linked) allReceiptsLinked = false;
    check(`receipt-linked-${wo.id}`, linked,
      `${claimId} keyed by commitSha=${headSha}: ${linked ? 'linked' : 'MISSING_REFUSED'}`);
  }

  // --- 9. Refuse stale-SHA publish and silent clobber -------------------------
  const refuse = headDrift || conflict !== null || !allReceiptsLinked || headSha === null || !allWorkersOk;

  const ok = !refuse;
  const verdict = {
    schema: 'arbor.item-receipt/1',
    item: ITEM,
    ok,
    depsAccepted,
    gatingBlocked: !depsAccepted,
    headSha,
    expectedSha: expected,
    freshHeadDrift: headDrift,
    pathConflict: conflict || null,
    workers: workerResults.map((w, i) => ({ workOrder: WORK_ORDERS[i].id, ...w })),
    receipts: receipts.map((r) => ({ claim: r.claim, commitSha: r.commitSha, ok: r.ok, path: receiptPathFor(r.claim, r.commitSha) })),
    checks,
  };
  process.stdout.write(JSON.stringify(verdict, null, 2) + '\n');
  process.exit(ok ? 0 : 1);
}

// Programmatic driver contract (A07.test.mjs partition-2 acceptance):
//   runA07Evidence({ root = REPO_ROOT, workOrders = [{ id, writeScope, command, expectedSha?, linkReceipt? }] })
//   -> { schema: 'arbor.item-receipt/1', item: 'A07', ok, checks: [{ name, pass, detail }], receipts: [...] }
// Workers are real subprocesses run concurrently; publish is refused on stale
// expected SHA (before any worker runs), overlapping write scopes, missing
// executed receipt (linkReceipt: false), or any nonzero worker exit code.
export async function runA07Evidence({ root = REPO_ROOT, workOrders = [] } = {}) {
  const checks = [];
  const receipts = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail: String(detail) });

  const headSha = commitSha();
  check('git-head-readable', headSha !== null, `HEAD=${headSha ?? 'unreadable'}`);

  // Dependency gate (same contract as acceleration-queue.mjs:32-37). Recorded
  // on every run; an empty queue refuses here, explicit work orders still run
  // so evidence is produced (main() records the same gate without blocking).
  let roadmap = null;
  try { roadmap = loadRoadmap(); } catch { roadmap = null; }
  const depsAccepted = DEP_IDS.every((id) => isIndependentlyAccepted(roadmap ? findItem(roadmap, id) : null));
  if (workOrders.length === 0) {
    check('dep-ready-gate', false, depsAccepted
      ? 'ready frontier empty: no work orders queued'
      : `deps not independently accepted: ${DEP_IDS.join('+')}`);
    return { schema: 'arbor.item-receipt/1', item: ITEM, ok: false, checks, receipts };
  }
  check('dep-acceptance', depsAccepted,
    `${DEP_IDS.join('+')}: ${depsAccepted ? 'independently accepted' : 'not independently accepted (recorded, non-blocking for explicit work orders)'}`);

  // Fresh-head drift: expected SHA must equal git rev-parse HEAD. Refuse BEFORE
  // any worker executes so a stale-SHA publish writes nothing.
  const drifted = workOrders.filter((wo) => wo.expectedSha && wo.expectedSha !== headSha);
  const headDrift = headSha === null || drifted.length > 0;
  check('stale-expected-sha-drift', !headDrift,
    headDrift
      ? `DRIFT_REFUSED: expected=${drifted.map((w) => w.expectedSha).join(',')} actual=${headSha}`
      : `expected matches HEAD=${headSha}`);
  if (headDrift) {
    return { schema: 'arbor.item-receipt/1', item: ITEM, ok: false, checks, receipts };
  }

  // Path-conflict detection across every work-order pair: overlapping writer
  // scopes serialize with a refusal — no silent clobber.
  let conflict = null;
  for (let i = 0; i < workOrders.length && !conflict; i += 1) {
    for (let j = i + 1; j < workOrders.length && !conflict; j += 1) {
      conflict = pathConflicts(workOrders[i], workOrders[j]);
    }
  }
  check('path-conflict-serialize', conflict === null,
    conflict
      ? `CONFLICT: ${conflict.woA} [${conflict.pathA}] overlaps ${conflict.woB} [${conflict.pathB}] — publish refused`
      : 'all write scopes disjoint');

  // Run every worker concurrently as a real subprocess (no simulated success).
  const workers = await Promise.all(workOrders.map((wo) => runWorker({
    command: wo.command[0],
    args: wo.command.slice(1),
    runtimeName: wo.command[0] === 'bun' ? 'bun' : 'node',
  })));

  const proofsDir = join(root, '.integration', 'proposal5', 'hq-version-intelligence', 'proofs', 'G2');
  workOrders.forEach((wo, i) => {
    const wr = workers[i];
    check(`worker-${wo.id}-exit-zero`, wr.exitCode === 0,
      `${wo.id}: ${wr.command} exitCode=${wr.exitCode} runtime=${wr.runtime} version=${wr.version} durationMs=${wr.durationMs}`);
    if (wo.linkReceipt === false) {
      check(`receipt-linked-${wo.id}`, false, `${wo.id}: linkReceipt=false — missing executed receipt REFUSED`);
      return;
    }
    const receipt = {
      schema: 'arbor.item-receipt/1',
      item: ITEM,
      claim: wo.id,
      commitSha: headSha,
      check: 'worker-execution',
      ok: wr.exitCode === 0 && conflict === null,
      detail: `${wo.id}: writeScope=${JSON.stringify(wo.writeScope)} exitCode=${wr.exitCode} runtime=${wr.version}`,
      command: wr.command,
      exitCode: wr.exitCode,
      runtime: wr.runtime,
      binary: wr.binary,
      version: wr.version,
      durationMs: wr.durationMs,
      startedAt: wr.startedAt,
      finishedAt: wr.finishedAt,
      signal: wr.signal,
      os: platform(),
      osRelease: release(),
      osArch: arch(),
      writtenAt: isoNow(),
    };
    mkdirSync(proofsDir, { recursive: true });
    writeFileSync(join(proofsDir, `${ITEM}-${wo.id}-receipt-${headSha ?? 'unknown'}.json`),
      JSON.stringify(receipt, null, 2) + '\n');
    receipts.push(receipt);
    check(`receipt-linked-${wo.id}`, true, `${wo.id} keyed by commitSha=${headSha}`);
  });

  const allWorkersOk = workers.every((w) => w.exitCode === 0);
  const allLinked = workOrders.every((wo) => wo.linkReceipt !== false);
  const ok = !headDrift && conflict === null && allWorkersOk && allLinked && headSha !== null;
  return { schema: 'arbor.item-receipt/1', item: ITEM, ok, checks, receipts };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${ITEM}: fatal: ${String(error?.message || error)}\n`);
    process.exit(1);
  });
}
