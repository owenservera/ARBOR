// hq/aii/fixtures/harness.mjs — shared contract for AII benchmark fixtures
// (PRD HQ-PRD-AII-001). Idiom from scripts/context-bench.mjs: ground truth is
// locked at authoring time (with a provenance note) and re-derived at run time.
//
// A fixture file hq/aii/fixtures/HQ-NNN-<slug>.mjs default-exports
// defineFixture({ id, provenance, expected, run }):
//   id          — the scenario id, HQ-NNN
//   provenance  — how/when the expected findings were locked (required)
//   expected    — non-empty array of {what, where?}; what is an exact string or
//                 RegExp, where is a path prefix or RegExp (optional)
//   run         — async () => findings[] via finding(what, where?)
//
// Fixtures are read-only probes: no provider messages, no Host-world writes,
// no approvals. Synthetic/seeded data only — no credentials, no private
// session content. Build lanes check ONE fixture at a time with this CLI;
// scripts/aii-verify.mjs is the whole-suite runner (acceptance phase only).

import { AsyncLocalStorage } from 'node:async_hooks';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openDb } from '../../lib/schema.mjs';
import { recordReceipt } from '../../lib/receipts.mjs';
import { buildFixtureReceipt, expectationsDigest } from '../../lib/aii/receipts-policy.mjs';

export function defineFixture(def) {
  const problems = [];
  if (!/^HQ-\d{3}$/.test(String(def.id ?? ''))) problems.push('id must match HQ-NNN');
  if (!Array.isArray(def.expected) || def.expected.length === 0) problems.push('expected must be a non-empty array');
  if (typeof def.run !== 'function') problems.push('run must be a function');
  if (!String(def.provenance ?? '').trim()) problems.push('provenance is required (how ground truth was locked)');
  if (problems.length) throw new Error(`invalid fixture ${def.id ?? '(no id)'}: ${problems.join('; ')}`);
  return def;
}

export function finding(what, where = null) {
  return where == null ? { what } : { what, where };
}

export function matchesFinding(expected, findingRow) {
  const whatOk = expected.what instanceof RegExp
    ? expected.what.test(String(findingRow.what))
    : String(expected.what) === String(findingRow.what);
  if (!whatOk) return false;
  if (expected.where == null) return true;
  const whereOk = expected.where instanceof RegExp
    ? expected.where.test(String(findingRow.where ?? ''))
    : String(findingRow.where ?? '').startsWith(String(expected.where));
  return whereOk;
}

// Read-only hq CLI probe helper. Never pass mutating flags (reset, do --run,
// project add/remove, hooks install...); the verifier records what it ran.
//
// Inside a verifier run the call is governed by an ambient probe context:
//   - write-shaped commands are refused before spawn (status mutating-probe),
//   - identical probes are cached for the life of the process, because the
//     result cannot change between fixtures in one run,
//   - the per-probe timeout is capped by the fixture's remaining wall clock.
// Outside a context (a bare `bun hq/aii/fixtures/harness.mjs <file>` run)
// behaviour is exactly the old one.
const probeStore = new AsyncLocalStorage();

const WRITE_HEADS = new Set([
  'reset', 'install', 'uninstall', 'sync', 'note', 'init', 'record',
  'delete', 'remove', 'apply', 'enable', 'disable', 'wake', 'spawn', 'send',
]);
const WRITE_PAIRS = new Set([
  'project add', 'project remove', 'hooks install', 'hooks uninstall',
  'kb intake', 'docs index', 'seat wake', 'seat spawn', 'comms send',
  'decisions confirm', 'canon confirm', 'decisions supersede', 'canon deprecate',
]);
const WRITE_FLAGS = new Set(['--write', '--apply', '--out', '--commit', '--run']);

export function isMutatingProbe(args) {
  const list = (Array.isArray(args) ? args : []).map(String);
  const head = list[0] ?? '';
  if (WRITE_HEADS.has(head)) return true;
  if (WRITE_PAIRS.has(`${list[0] ?? ''} ${list[1] ?? ''}`)) return true;
  if (head === 'index') {
    // `hq index` always writes unless it is explicitly a dry check.
    return !list.some((a) => a === '--check' || a === '--plan' || a === '--dry-run');
  }
  if (list.some((a) => WRITE_FLAGS.has(a))) return true;
  if (head === 'timing' && list[1] === 'optimize') return true;
  if (head === 'watch') return true;
  return false;
}

/**
 * probeContext — run `fn` with an ambient probe store. Exported so the runner
 * can bound probes by the fixture's wall clock and read the probe log back.
 */
export function probeContext(store, fn) {
  return probeStore.run({
    cwd: process.cwd(),
    timeoutMs: 120_000,
    cache: new Map(),
    allowWrites: false,
    probes: [],
    violations: [],
    ...store,
  }, fn);
}

export function runHq(args, { timeoutMs = 120_000, cwd = process.cwd() } = {}) {
  const ctx = probeStore.getStore();
  const list = (Array.isArray(args) ? args : []).map(String);
  const startedAt = Date.now();

  if (ctx) {
    if (!ctx.allowWrites && isMutatingProbe(list)) {
      ctx.violations.push(list);
      return { exit: 126, stdout: '', stderr: `aii-verify: refused write-shaped probe: hq ${list.join(' ')}` };
    }
    const key = `${cwd}\0${list.join('\0')}`;
    if (ctx.cache.has(key)) {
      const hit = ctx.cache.get(key);
      ctx.probes.push({ args: list, cached: true, exit: hit.exit, ms: 0 });
      return { ...hit };
    }
    const budgetLeft = Number.isFinite(ctx.timeoutMs) ? Math.max(1_000, ctx.timeoutMs) : timeoutMs;
    const effective = Math.min(Number(timeoutMs) || 120_000, budgetLeft);
    const result = spawnHq(list, { timeoutMs: effective, cwd });
    ctx.cache.set(key, result);
    ctx.probes.push({ args: list, cached: false, exit: result.exit, ms: Date.now() - startedAt });
    return { ...result };
  }

  return spawnHq(list, { timeoutMs, cwd });
}

function spawnHq(list, { timeoutMs, cwd }) {
  const res = spawnSync('bun', ['hq/bin/hq.mjs', ...list], {
    encoding: 'utf8',
    timeout: timeoutMs,
    cwd,
    windowsHide: true,
  });
  return { exit: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

// Legacy receipt digest: count-based, kept so anything that already imports it
// keeps working. New receipts use the content-bound fingerprint below, which
// is what makes a receipt prove *these* fixture bytes rather than "some run".
export function fixtureDigest(id, findingsCount) {
  return createHash('sha256').update(`${id}\0${findingsCount}`).digest('hex');
}

/** Content-bound receipt digest, shared with hq/lib/aii/runner.mjs. */
export function fixtureFingerprint({ id, fixtureSha, catalogSha, expectedSha, findingsCount }) {
  return buildFixtureReceipt(
    { id, fixtureSha, expectedSha, findings: findingsCount, fixtureRel: '' },
    { catalogSha },
  ).digest;
}

// --- CLI: run one fixture against its locked expectations -------------------
// bun hq/aii/fixtures/harness.mjs <HQ-NNN-<slug>.mjs>
// Records the aii-fixture receipt on pass (SQLite WAL, concurrency-safe).
if (import.meta.main) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: bun hq/aii/fixtures/harness.mjs <HQ-NNN-<slug>.mjs>');
    process.exit(2);
  }
  const fixturePath = resolve(target);
  // hq/aii/fixtures/harness.mjs -> up 3 levels is the repo root (hq/aii/fixtures
  // -> hq/aii -> hq -> root). Getting this wrong writes receipts into a stray
  // hq/.hq/index.db that the verifier never reads.
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  try {
    const mod = await import(pathToFileURL(fixturePath).href);
    const def = defineFixture(mod.default ?? mod);
    const findings = await probeContext({ cwd: ROOT }, () => def.run());
    if (!Array.isArray(findings)) throw new Error('run() must return an array of findings');
    const missing = def.expected.filter((exp) => !findings.some((f) => matchesFinding(exp, f)));
    if (missing.length > 0) {
      console.error(`FAIL ${def.id}: ${missing.length} expectation(s) unmatched:`);
      for (const m of missing) console.error(`  - ${String(m.what)}${m.where != null ? ` @ ${m.where}` : ''}`);
      process.exit(1);
    }
    const fixtureSha = createHash('sha256')
      .update(readFileSync(fixturePath, 'utf8').replace(/\r\n/g, '\n'))
      .digest('hex');
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    // Parallel fixture runs contend for the single SQLite writer slot; the
    // default 5s busy timeout expires under a fan-out, so raise it and retry
    // the write with backoff rather than failing a fixture that already
    // proved its expectations.
    db.exec('PRAGMA busy_timeout = 30000');
    const catalogSha = createHash('sha256')
      .update(readFileSync(join(ROOT, 'docs', 'AII-CATALOG.md'), 'utf8').replace(/\r\n/g, '\n'))
      .digest('hex');
    const receipt = await recordReceiptWithRetry(db, buildFixtureReceipt({
      id: def.id,
      fixtureSha,
      expectedSha: expectationsDigest(def.expected),
      findings: findings.length,
      fixtureRel: relative(ROOT, fixturePath),
    }, { catalogSha }));
    console.log(`PASS ${def.id} findings=${findings.length} receipt=${receipt?.id ?? 'unrecorded'}`);
  } catch (err) {
    console.error(`ERROR: ${err?.message ?? err}`);
    process.exit(1);
  }
}

// Bounded retry for the receipt write only. A locked database is contention,
// not a failed fixture — the expectations already passed.
async function recordReceiptWithRetry(db, receipt, attempts = 6) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return recordReceipt(db, receipt);
    } catch (err) {
      const message = String(err?.message ?? err);
      if (!/database is locked|database table is locked|SQLITE_BUSY/i.test(message)) throw err;
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError;
}
