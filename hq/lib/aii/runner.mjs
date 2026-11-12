// hq/lib/aii/runner.mjs — bounded execution of AII fixtures.
//
// Three properties the old runner lacked, each of which made a >30 minute run
// indistinguishable from a hung one:
//
//   1. A per-fixture wall clock. A probe that hangs is cut at its own timeout
//      and the fixture is reported as `timeout`, not as silence.
//   2. A run budget. Once spent, the remaining fixtures are reported as
//      `budget-exhausted` instead of being started, so a partial pass is a
//      truthful partial pass with a stated reason.
//   3. A probe cache. Several fixtures re-run the same expensive scan
//      (`docs health`, `conflicts`, `zcode-doctor`); inside one process the
//      result cannot have changed, so it is reused and the saving is reported.
//
// Read-only enforcement lives in the harness probe context (see
// hq/aii/fixtures/harness.mjs). The runner only opens the context; a refused
// probe surfaces as status `mutating-probe` rather than being silently allowed.
//
// This module never writes views and never mutates the journal. It returns
// results; scripts/aii-verify.mjs decides what to persist.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { AII_FIXTURE_KIND } from './registry.mjs';
import { buildFixtureReceipt, expectationsDigest } from './receipts-policy.mjs';
import { sha256Text } from './plan.mjs';
import { defineFixture, matchesFinding, probeContext } from '../../aii/fixtures/harness.mjs';
import { recordReceipt } from '../receipts.mjs';

export const DEFAULT_TIMEOUT_MS = 120_000;
export const HEAVY_TIMEOUT_MS = 300_000;

function withTimeout(promise, ms, onTimeout) {
  if (!Number.isFinite(ms) || ms <= 0) return promise;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(onTimeout ?? `fixture exceeded ${ms}ms`);
      err.code = 'AII_TIMEOUT';
      reject(err);
    }, ms);
    if (typeof timer?.unref === 'function') timer.unref();
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function brief(row) {
  if (!row) return null;
  if (row instanceof RegExp) return `re:${row.source}/${row.flags}`;
  return String(row);
}

/**
 * runOne — import and execute exactly one fixture file.
 *
 * @param {object} entry plan fixture row (id, name, path, relPath, sha, tier)
 * @param {{root: string, timeoutMs?: number, cache?: Map, allowWrites?: boolean}} options
 * @returns {Promise<object>} result row, never throws
 */
export async function runOne(entry, { root, timeoutMs = null, cache = null, allowWrites = false } = {}) {
  const startedAt = Date.now();
  const base = {
    id: entry.id,
    name: entry.name,
    relPath: entry.relPath,
    tier: entry.tier ?? 'standard',
    fixtureSha: entry.sha ?? null,
    expectedSha: null,
    findings: 0,
    missing: [],
    probes: [],
    probeCacheHits: 0,
    durationMs: 0,
    status: 'fail',
    problem: null,
    error: null,
  };
  const finish = (patch) => ({
    ...base,
    ...patch,
    durationMs: Date.now() - startedAt,
  });

  // Hash the bytes that are actually imported, not the planned hash: a fixture
  // edited between `--plan` and the run must bind its receipt to what ran.
  let text;
  try {
    text = readFileSync(entry.path, 'utf8');
  } catch (err) {
    return finish({ status: 'load', problem: 'unreadable', error: String(err?.message ?? err) });
  }
  const fixtureSha = sha256Text(text);
  const planDrift = entry.sha && entry.sha !== fixtureSha;

  let def;
  try {
    // Cache-bust so a repeated run in the same process imports current bytes.
    const mod = await import(`${pathToFileURL(entry.path).href}?sha=${fixtureSha}`);
    def = defineFixture(mod.default ?? mod);
  } catch (err) {
    const message = String(err?.message ?? err);
    const status = /^invalid fixture/.test(message) ? 'invalid' : 'load';
    return finish({ fixtureSha, status, problem: status, error: message, planDrift });
  }

  if (def.id !== entry.id) {
    return finish({
      fixtureSha,
      status: 'id-mismatch',
      problem: 'id-mismatch',
      error: `fixture id ${def.id} does not match filename ${entry.name}`,
      planDrift,
    });
  }

  const expectedSha = expectationsDigest(def.expected);
  const limit = Number(timeoutMs) > 0 ? Number(timeoutMs) : (entry.tier === 'heavy' ? HEAVY_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  const store = { cwd: root, timeoutMs: limit, cache, allowWrites, violations: [], probes: [] };

  let findings;
  try {
    findings = await probeContext(store, () => withTimeout(Promise.resolve().then(() => def.run()), limit));
  } catch (err) {
    if (err?.code === 'AII_TIMEOUT') {
      return finish({
        fixtureSha,
        expectedSha,
        status: 'timeout',
        problem: 'timeout',
        error: `exceeded ${limit}ms`,
        probes: store.probes,
        probeCacheHits: countHits(store),
        planDrift,
      });
    }
    return finish({
      fixtureSha,
      expectedSha,
      status: 'fail',
      problem: 'run',
      error: String(err?.message ?? err),
      probes: store.probes,
      probeCacheHits: countHits(store),
      planDrift,
    });
  }

  if (store.violations.length > 0) {
    return finish({
      fixtureSha,
      expectedSha,
      status: 'mutating-probe',
      problem: 'mutating-probe',
      error: `refused ${store.violations.length} write-shaped probe(s): ${store.violations.slice(0, 3).map((v) => v.join(' ')).join('; ')}`,
      probes: store.probes,
      probeCacheHits: countHits(store),
      planDrift,
    });
  }

  if (!Array.isArray(findings)) {
    return finish({
      fixtureSha,
      expectedSha,
      status: 'fail',
      problem: 'run',
      error: 'run() must return an array of findings',
      probes: store.probes,
      probeCacheHits: countHits(store),
      planDrift,
    });
  }

  const missing = def.expected.filter((exp) => !findings.some((row) => matchesFinding(exp, row)));
  return finish({
    fixtureSha,
    expectedSha,
    status: missing.length === 0 ? 'pass' : 'fail',
    problem: missing.length === 0 ? null : 'mismatch',
    findings: findings.length,
    missing: missing.map((m) => ({ what: brief(m.what), where: brief(m.where) })),
    probes: store.probes,
    probeCacheHits: countHits(store),
    planDrift,
  });
}

function countHits(store) {
  return (store.probes ?? []).filter((p) => p.cached).length;
}

/**
 * runFixtures — bounded pool over a selection.
 *
 * Results are returned in input order regardless of completion order, so two
 * identical selections produce identical report ordering.
 *
 * @param {object[]} fixtures plan fixture rows
 * @param {{root: string, jobs?: number, budgetMs?: number, cache?: Map,
 *          allowWrites?: boolean, onProgress?: Function, now?: Function}} options
 */
export async function runFixtures(fixtures, {
  root,
  jobs = 8,
  budgetMs = 0,
  cache = new Map(),
  allowWrites = false,
  onProgress = null,
  now = () => Date.now(),
} = {}) {
  const list = Array.isArray(fixtures) ? fixtures : [];
  const results = new Array(list.length);
  const startedAt = now();
  const width = Math.max(1, Math.min(Number(jobs) || 1, list.length || 1, 16));
  let next = 0;

  const budgetSpent = () => Number(budgetMs) > 0 && now() - startedAt >= Number(budgetMs);

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= list.length) return;
      const entry = list[index];
      if (budgetSpent()) {
        results[index] = {
          id: entry.id,
          name: entry.name,
          relPath: entry.relPath,
          tier: entry.tier ?? 'standard',
          fixtureSha: entry.sha ?? null,
          status: 'budget-exhausted',
          problem: 'budget-exhausted',
          error: `run budget of ${budgetMs}ms was spent before this fixture started`,
          findings: 0,
          missing: [],
          probes: [],
          probeCacheHits: 0,
          durationMs: 0,
        };
        onProgress?.(results[index], index, list.length);
        continue;
      }
      const result = await runOne(entry, { root, timeoutMs: entry.timeoutMs, cache, allowWrites });
      results[index] = result;
      onProgress?.(result, index, list.length);
    }
  }

  await Promise.all(Array.from({ length: width }, worker));
  return results;
}

/**
 * recordResults — persist a receipt for every pass. Failed attempts record
 * nothing (the journal is their evidence); a receipt is a claim of proof.
 */
export async function recordResults(db, results, { catalogSha = '', project = 'repos-hq' } = {}) {
  const recorded = [];
  const errors = [];
  for (const result of results) {
    if (result.status !== 'pass') continue;
    try {
      const receipt = await recordReceiptWithRetry(db, buildFixtureReceipt(result, { catalogSha, project }));
      recorded.push({ id: result.id, relPath: result.relPath, receiptId: receipt?.id ?? null });
    } catch (err) {
      errors.push({ id: result.id, error: String(err?.message ?? err) });
    }
  }
  return { recorded, errors };
}

// Contention on the single SQLite writer slot is not a failed fixture: the
// expectations already matched. Retry with backoff, then report honestly.
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

export { AII_FIXTURE_KIND };
