import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

import {
  runA01Evidence,
  assertIsolatedLive,
  isFlaggedIsolatedRoot,
  bootEnvFor,
  findLine,
} from './A01.mjs';

const REPO_ROOT = process.cwd();
const A01 = join(REPO_ROOT, 'scripts/batch-evidence/A01.mjs');
const RUNNER = join(REPO_ROOT, 'scripts/acceleration/live-host-check.mjs');
const REAL_PORT = 43187;

const read = (file) => readFileSync(join(REPO_ROOT, file), 'utf8');

function cli(bin, args, timeout = 180000) {
  try {
    const stdout = execFileSync(bin, args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      timeout,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stdout: String(stdout) };
  } catch (error) {
    return {
      exitCode: typeof error.status === 'number' ? error.status : 1,
      stdout: String(error.stdout ?? ''),
      stderr: String(error.stderr ?? ''),
    };
  }
}

function hostReachable() {
  try {
    execFileSync('curl', ['-fsS', '-m', '3', `http://127.0.0.1:${REAL_PORT}/api/state`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// A01 static evidence (in-process): SOURCE_ONLY, 5/5 checks, no live boot
// ---------------------------------------------------------------------------

test('A01 static run: SOURCE_ONLY, ok:true, 5 checks, 0 fails', async () => {
  const result = await runA01Evidence({ live: false });
  assert.equal(result.schema, 'arbor.item-receipt/1');
  assert.equal(result.item, 'A01');
  assert.equal(result.scope, 'SOURCE_ONLY');
  assert.equal(result.isolation, 'NONE');
  assert.equal(result.browserDom, 'UNRUN');
  assert.equal(result.ok, true, JSON.stringify(result.checks.filter((c) => !c.pass)));
  assert.equal(result.checks.length, 5);
  const names = result.checks.map((c) => c.name);
  for (const name of [
    'host-boot-path-env',
    'readme-one-command-entry',
    'package-scripts-consistent',
    'acceptance-runner-entry',
    'port-default-consistency',
  ]) assert.ok(names.includes(name), 'missing check: ' + name);
  assert.ok(result.checks.every((c) => c.pass));
});

// ---------------------------------------------------------------------------
// A01 CLI one command: `bun scripts/batch-evidence/A01.mjs --static && --live`
// Live boots an ISOLATED scratch Host only; port 43187 is never contacted.
// ---------------------------------------------------------------------------

test('A01 CLI --static exits 0 with 5/5 checks', () => {
  const run = cli('bun', [A01, '--static']);
  assert.equal(run.exitCode, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.scope, 'SOURCE_ONLY');
  assert.equal(receipt.checks.filter((c) => c.pass).length, 5);
  assert.equal(receipt.checks.filter((c) => !c.pass).length, 0);
});

test('A01 CLI --live exits 0 with 11/11 checks on an isolated scratch Host', { timeout: 180000 }, () => {
  const run = cli('bun', [A01, '--live']);
  assert.equal(run.exitCode, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true, JSON.stringify(receipt.checks.filter((c) => !c.pass)));
  assert.equal(receipt.scope, 'SOURCE_PLUS_ISOLATED_LIVE_BOOT');
  assert.equal(receipt.isolation, 'SCRATCH_PORT_FLAGGED_TEMP_DATA_ROOT_ONLY');
  assert.equal(receipt.browserDom, 'UNRUN');
  assert.equal(receipt.checks.length, 11);
  assert.equal(receipt.checks.filter((c) => c.pass).length, 11);
  const byName = Object.fromEntries(receipt.checks.map((c) => [c.name, c]));
  // Regression pin for the journey defect "POSTs mutated the real Host on
  // 43187": the A01 live contract must stay read-only against a scratch port.
  assert.equal(byName['real-host-data-untouched'].pass, true);
  assert.equal(byName['isolated-boot-guard'].pass, true);
  assert.equal(byName['isolated-host-shutdown'].pass, true);
  assert.match(byName['isolated-boot-guard'].detail, /scratch port \d+ \(!= 43187\)/);
});

test('A01.mjs evidence transport is GET-only and never POSTs to the real port', () => {
  const src = read('scripts/batch-evidence/A01.mjs');
  assert.equal(/POST/.test(src), false, 'A01 evidence path must not issue POST requests');
  assert.equal(/method\s*:/.test(src), false, 'no fetch method override in A01.mjs');
  assert.ok(findLine(src, /REAL_PORT = 43187/), 'REAL_PORT constant present');
  // makeTransport exposes only `get`; the live block only calls io.get.
  const transport = src.slice(src.indexOf('function makeTransport'));
  assert.ok(/get:\s*async route/.test(transport), 'transport has get');
  assert.equal(/post\s*:/.test(transport), false, 'transport has no post');
});

// ---------------------------------------------------------------------------
// Isolation guard helpers
// ---------------------------------------------------------------------------

test('assertIsolatedLive accepts only explicit isolated loopback base URLs', () => {
  assertIsolatedLive('http://127.0.0.1:9257/', true);
  assertIsolatedLive('http://localhost:9257/', true);
  assert.throws(() => assertIsolatedLive('http://127.0.0.1:9257/', false));
  assert.throws(() => assertIsolatedLive('https://127.0.0.1:9257/', true));
  assert.throws(() => assertIsolatedLive('http://evil.example.com/', true));
  assert.throws(() => assertIsolatedLive('http://user:pw@127.0.0.1:9257/', true));
  assert.throws(() => assertIsolatedLive('http://127.0.0.1:9257/?x=1', true));
  assert.throws(() => assertIsolatedLive('http://127.0.0.1:9257/api', true));
});

test('isFlaggedIsolatedRoot accepts only flagged mkdtemp roots under tmpdir', () => {
  const flagged = mkdtempSync(join(os.tmpdir(), 'arbor-a01-isolated-'));
  const plain = mkdtempSync(join(os.tmpdir(), 'arbor-plain-'));
  try {
    assert.equal(isFlaggedIsolatedRoot(flagged), true);
    assert.equal(isFlaggedIsolatedRoot(plain), false);
    assert.equal(isFlaggedIsolatedRoot(join(os.tmpdir(), 'arbor-a01-isolated-does-not-exist')), false);
  } finally {
    rmSync(flagged, { recursive: true, force: true });
    rmSync(plain, { recursive: true, force: true });
  }
});

test('bootEnvFor sets the exact boot env the server entrypoint reads', () => {
  const env = bootEnvFor(9257, '/tmp/some-root', { PATH: 'x' });
  assert.equal(env.VIVIM_HOST_PORT, '9257');
  assert.equal(env.VIVIM_HOST_DATA_DIR, '/tmp/some-root');
  assert.equal(env.PATH, 'x');
});

// ---------------------------------------------------------------------------
// Port consistency: README one-command entry == server.mjs default == live Host
// (work order cited server.mjs:1121 for the port; actual constant line is the
// `VIVIM_HOST_PORT || 43187` line — pinned by value, not citation)
// ---------------------------------------------------------------------------

test('port default 43187 consistent across README, server.mjs, live Host', () => {
  const readme = read('apps/vivim-host/README.md');
  const server = read('apps/vivim-host/server.mjs');
  assert.ok(findLine(readme, /node apps\/vivim-host\/server\.mjs/), 'README one-command start line');
  const readmePort = /http:\/\/127\.0\.0\.1:(\d+)/.exec(readme);
  assert.ok(readmePort, 'README local address line');
  assert.match(readme, /VIVIM_HOST_PORT.*default 43187/, 'README VIVIM_HOST_PORT default line');
  assert.match(readme, /VIVIM_HOST_DATA_DIR/, 'README VIVIM_HOST_DATA_DIR line');
  const serverDefault = /VIVIM_HOST_PORT \|\| (\d+)/.exec(server);
  assert.ok(serverDefault, 'server.mjs VIVIM_HOST_PORT default');
  assert.ok(findLine(server, /server\.listen\(port, '127\.0\.0\.1'/), 'server.mjs loopback listen');
  assert.ok(findLine(server, /VIVIM_HOST_PORT must be 1024\.\.65535/), 'server.mjs port range guard');
  assert.equal(serverDefault[1], '43187');
  assert.equal(readmePort[1], '43187');
  assert.equal(String(REAL_PORT), '43187');
});

// ---------------------------------------------------------------------------
// action-catalog.v1.json claims (journey-verbatim, re-pinned here)
// ---------------------------------------------------------------------------

test('action-catalog.v1.json: status.show executor + readiness histogram 17/12/2/1 of 32', () => {
  const catalog = JSON.parse(read('apps/vivim-host/control/action-catalog.v1.json'));
  const status = catalog.actions.find((a) => a.id === 'vivim.status.show');
  assert.ok(status, 'vivim.status.show present');
  assert.equal(status.executor, 'apps/vivim-host/bootstrap/runtime.mjs:status');
  assert.equal(status.readiness, 'source_wired');
  assert.equal(status.risk, 'R0');
  assert.equal(status.examples[0], 'status');
  assert.equal(catalog.policy.missingAdapter, 'unavailable');
  const histogram = {};
  for (const action of catalog.actions)
    histogram[action.readiness] = (histogram[action.readiness] || 0) + 1;
  assert.deepEqual(histogram, {
    source_wired: 17,
    adapter_pending: 12,
    enforcement_missing: 2,
    unsupported: 1,
  });
  assert.equal(catalog.actions.length, 32);
});

// ---------------------------------------------------------------------------
// Acceptance runner: one command `node scripts/acceleration/live-host-check.mjs`
// boots an isolated mkdtemp Host, passes, leaves the public demo journal alone
// ---------------------------------------------------------------------------

test('acceptance runner: node scripts/acceleration/live-host-check.mjs exits 0, ok, isolated', { timeout: 420000 }, () => {
  const run = cli('node', [RUNNER], 400000);
  assert.equal(run.exitCode, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true, receipt.failure || JSON.stringify(receipt.tests?.filter((x) => !x.pass)));
  assert.equal(receipt.exitCode, 0);
  assert.equal(receipt.failedChecks, 0);
  assert.ok(receipt.passedChecks >= 37, 'expected at least 37 passing checks, got ' + receipt.passedChecks);
  assert.equal(receipt.dataIsolation.ownedTemporaryDirectory, true);
  assert.equal(receipt.dataIsolation.deletedAfterRun, true);
  assert.equal(receipt.dataIsolation.publicDemoJournalUnchanged, true);
  assert.match(receipt.dataIsolation.privateJournalSha256 || receipt.dataIsolation.publicDemoJournalBeforeSha256 || '', /^[a-f0-9]{64}$/);
  assert.equal(receipt.browserDom, 'UNRUN');
  assert.equal(receipt.subprocesses.length, 1);
  assert.equal(receipt.subprocesses[0].exitCode, 0);
  assert.equal(receipt.wikiEvidence.exitCode, 0);
  assert.equal(receipt.wikiEvidence.scope, 'SOURCE_AND_API_ONLY');
  assert.ok(receipt.wikiEvidence.passedChecks >= 10);
});

// ---------------------------------------------------------------------------
// Manifest registration: the A01 regression suite is itself gate-selected
// ---------------------------------------------------------------------------

test('scripts/test-manifest.json registers A01.test.mjs and the runner test', () => {
  const manifest = JSON.parse(read('scripts/test-manifest.json'));
  const a01 = manifest.find((t) => t.path === 'scripts/batch-evidence/A01.test.mjs');
  assert.ok(a01, 'A01.test.mjs registered');
  assert.equal(a01.root, 'scripts/batch-evidence');
  assert.equal(a01.gate, 'roadmap-acceleration');
  const runner = manifest.find((t) => t.path === 'scripts/acceleration/live-host-check.test.mjs');
  assert.ok(runner, 'live-host-check.test.mjs registered (required by A01.mjs acceptance-runner-entry)');
});

// ---------------------------------------------------------------------------
// Roadmap + receipts pins (A01 verify ask, 2026-11-17)
// ---------------------------------------------------------------------------

test('roadmap.v1.json A01 entry and receipts match the verify ask', () => {
  const roadmap = JSON.parse(read('docs/product/roadmap/roadmap.v1.json'));
  const a01 = roadmap.buildQueue.find((e) => e.itemId === 'A01');
  assert.ok(a01, 'A01 in buildQueue');
  assert.equal(a01.order, 2);
  assert.equal(a01.status, 'gated');
  assert.equal(a01.lane, 'C');
  assert.equal(a01.verification, 'UNRUN');
  assert.equal(a01.ownerAcceptance, 'PENDING');
  assert.deepEqual(a01.dependsOn, []);

  const a01Receipt = JSON.parse(read('docs/product/roadmap/receipts/A01.receipt.json'));
  // A01 was independently verified on 2026-11-17 (arbor-life lineage
  // dwfrun-61ab3096: gate exit 0, static 0 + live 0, re-test 7/7, re-walk 9/9).
  // The queue entry's verification field still reads UNRUN — known roadmap/receipt
  // drift, receipt wins per the skip rule; keeper one-writer flip outstanding.
  assert.equal(a01Receipt.status, 'verified');
  assert.ok(typeof a01Receipt.authoredAt === 'string' && a01Receipt.authoredAt.length > 0);

  // A00 skip basis: settled receipt exists (verified). Known drift, flagged by
  // the A01 verify ask and NOT fixed here: roadmap A00 entry still reads
  // verification UNRUN while the receipt is verified — receipt wins per skip
  // rule; roadmap truth sync is outstanding.
  const a00 = roadmap.buildQueue.find((e) => e.itemId === 'A00');
  assert.equal(a00.order, 1);
  assert.equal(a00.verification, 'UNRUN', 'pins the flagged roadmap/receipt drift');
  const a00Receipt = JSON.parse(read('docs/product/roadmap/receipts/A00.receipt.json'));
  assert.equal(a00Receipt.status, 'verified');
  assert.equal(a00Receipt.authoredAt, '2026-11-16T23:44:26Z');
});

// ---------------------------------------------------------------------------
// Live read-only surface on the real Host (GET only — the journey's POSTs to
// 43187 are the recorded defect; this suite never mutates the real Host).
// Skipped when no Host is listening on 43187.
// ---------------------------------------------------------------------------

test('live GET /api/state, /api/wiki, /api/journal on 127.0.0.1:43187 (read-only)', { timeout: 30000 }, async (t) => {
  if (!hostReachable()) {
    t.skip('no Host listening on 127.0.0.1:43187');
    return;
  }
  const base = `http://127.0.0.1:${REAL_PORT}`;
  const get = async (route) => {
    const res = await fetch(base + route, { signal: AbortSignal.timeout(5000) });
    assert.equal(res.status, 200, route + ' status=' + res.status);
    return res.json();
  };
  const state = await get('/api/state');
  assert.ok(Array.isArray(state.chat), '/api/state chat array');
  assert.ok(Number.isSafeInteger(state.wikiRevision), '/api/state wikiRevision int');
  assert.ok(Number.isSafeInteger(state.revision), '/api/state revision int');
  assert.equal(typeof state.at, 'string', '/api/state at string');

  const wiki = await get('/api/wiki');
  assert.ok(Number.isSafeInteger(wiki.revision), '/api/wiki revision int');
  assert.ok(wiki.pages && typeof wiki.pages === 'object', '/api/wiki pages object');
  assert.ok(wiki.pages.Main, '/api/wiki Main page present');

  const journal = await get('/api/journal');
  assert.ok(Array.isArray(journal) && journal.length > 0, '/api/journal non-empty array');
  // Live journal entries carry kind/actor/receivedAt/entryId/sequence (the
  // verify ask's "at" prose maps to receivedAt), e.g. seq 24 'status'
  // actor owner-browser entryId 599b44fb-...
  assert.equal(typeof journal[0].kind, 'string');
  assert.equal(typeof journal[0].actor, 'string');
  const last = journal[journal.length - 1];
  assert.equal(last.kind, 'chat-send');
  assert.equal(last.actor, 'owner-browser');
  assert.match(last.entryId, /^[a-f0-9-]{36}$/);
});
