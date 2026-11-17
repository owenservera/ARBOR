import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

import {
  runA02Evidence,
  assertIsolatedLive,
  isFlaggedIsolatedRoot,
  bootEnvFor,
  findLine,
  projectionWiring,
  normalizeEntry,
  parityDigest,
  parseJournalResponse,
  parseRawJournal,
} from './A02.mjs';

const REPO_ROOT = process.cwd();
const A02 = join(REPO_ROOT, 'scripts/batch-evidence/A02.mjs');
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
// A02 static evidence (in-process): SOURCE_ONLY, 4/4 checks, no live boot
// ---------------------------------------------------------------------------

test('A02 static run: SOURCE_ONLY, ok:true, 4 checks, 0 fails', async () => {
  const result = await runA02Evidence({ live: false });
  assert.equal(result.schema, 'arbor.item-receipt/1');
  assert.equal(result.item, 'A02');
  assert.equal(result.scope, 'SOURCE_ONLY');
  assert.equal(result.isolation, 'NONE');
  assert.equal(result.browserDom, 'UNRUN');
  assert.equal(result.ok, true, JSON.stringify(result.checks.filter((c) => !c.pass)));
  assert.equal(result.checks.length, 4);
  const names = result.checks.map((c) => c.name);
  for (const name of [
    'projection-module-exists',
    'host-wiring-journal-projection',
    'page-surfaces-wired',
    'projection-replay-deterministic',
  ]) assert.ok(names.includes(name), 'missing check: ' + name);
  assert.ok(result.checks.every((c) => c.pass));
  // Work-order replay-determinism requirement, pinned by check detail.
  const replay = result.checks.find((c) => c.name === 'projection-replay-deterministic');
  assert.match(replay.detail, /wikiRevision unchanged=1/);
});

// ---------------------------------------------------------------------------
// A02 CLI one command: `bun scripts/batch-evidence/A02.mjs --static && --live`
// Live boots an ISOLATED scratch Host only; port 43187 is never contacted.
// ---------------------------------------------------------------------------

test('A02 CLI --static exits 0 with 4/4 checks', () => {
  const run = cli('bun', [A02, '--static']);
  assert.equal(run.exitCode, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.scope, 'SOURCE_ONLY');
  assert.equal(receipt.checks.filter((c) => c.pass).length, 4);
  assert.equal(receipt.checks.filter((c) => !c.pass).length, 0);
});

test('A02 CLI --live exits 0 on an isolated scratch Host, all checks pass', { timeout: 180000 }, () => {
  const run = cli('bun', [A02, '--live']);
  assert.equal(run.exitCode, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true, JSON.stringify(receipt.checks.filter((c) => !c.pass)));
  assert.equal(receipt.scope, 'SOURCE_PLUS_ISOLATED_LIVE_PROJECTION');
  assert.equal(receipt.isolation, 'SCRATCH_PORT_FLAGGED_TEMP_DATA_ROOT_ONLY');
  assert.equal(receipt.browserDom, 'UNRUN');
  assert.ok(receipt.checks.every((c) => c.pass), JSON.stringify(receipt.checks.filter((c) => !c.pass)));
  const byName = Object.fromEntries(receipt.checks.map((c) => [c.name, c]));
  for (const name of [
    'isolated-boot-guard',
    'isolated-host-ready',
    'chat-post-machine',
    'chat-post-owner-browser',
    'journal-records-two-deterministic-mutations',
    'journal-api-raw-parity',
    'state-projection-records-mutation',
    'wiki-projection-consistent',
    'same-envelope-parity',
    'isolated-root-only',
    'isolated-host-shutdown',
  ]) assert.ok(byName[name], 'missing live check: ' + name);
  // Regression pin for the journey defect "POSTs mutated the real Host on
  // 43187": the live evidence path must stay confined to the scratch port.
  assert.equal(byName['isolated-boot-guard'].pass, true);
  assert.match(byName['isolated-boot-guard'].detail, /scratch port \d+ \(!= 43187\)/);
  assert.equal(byName['isolated-root-only'].pass, true);
  assert.match(byName['isolated-root-only'].detail, /no request to port 43187/);
  assert.match(receipt.parityDigest, /^[a-f0-9]{64}$/);
  assert.match(byName['state-projection-records-mutation'].detail, /wikiRevision unchanged=/);
});

// ---------------------------------------------------------------------------
// Source-level isolation regression: A02.mjs never addresses port 43187.
// Every literal '43187' in the runner is the REAL_PORT guard constant or the
// guard detail string; POSTs go only to the guarded isolated baseUrl.
// ---------------------------------------------------------------------------

test('A02.mjs evidence runner never targets the real port 43187', () => {
  const src = read('scripts/batch-evidence/A02.mjs');
  assert.ok(findLine(src, /const REAL_PORT = 43187/), 'REAL_PORT constant present');
  const lines43187 = src.split(/\r?\n/).filter((l) => l.includes('43187'));
  for (const line of lines43187) {
    const code = line.replace(/\/\/.*$/, ''); // strip trailing comment; only code may reference 43187
    if (!code.includes('43187')) continue; // comment-only mention
    assert.match(code, /REAL_PORT = 43187|no request to port|port !== REAL_PORT/, 'unguarded 43187 code reference: ' + line.trim());
  }
  assert.ok(/port !== REAL_PORT/.test(src), 'scratch-port guard present');
  assert.ok(/assertIsolatedLive\(baseUrl, true\)/.test(src), 'isolated base URL asserted before any I/O');
  // POSTs carry no authorization header and go only to the scratch baseUrl —
  // this is what makes the loopback chat-send path succeed unauthenticated
  // (server.mjs OWNER_AUTH region does not gate it; product-surface gap,
  // handoff — server.mjs is outside this lane's write scope, not fixed here).
  const posts = src.match(/io\.post\('\/api\/mutate'[^)]*\)/g) || [];
  assert.equal(posts.length, 2, 'exactly two /api/mutate POSTs, both in the isolated live block');
  for (const p of posts) assert.equal(/headers/.test(p), false, 'POST carries no headers argument: ' + p);
});

// ---------------------------------------------------------------------------
// Isolation guard helpers
// ---------------------------------------------------------------------------

test('assertIsolatedLive accepts only explicit isolated loopback base URLs', () => {
  assertIsolatedLive('http://127.0.0.1:9257/', true);
  assertIsolatedLive('http://localhost:9257/', true);
  assertIsolatedLive('http://[::1]:9257/', true);
  assert.throws(() => assertIsolatedLive('http://127.0.0.1:9257/', false));
  assert.throws(() => assertIsolatedLive('https://127.0.0.1:9257/', true));
  assert.throws(() => assertIsolatedLive('http://evil.example.com/', true));
  assert.throws(() => assertIsolatedLive('http://user:pw@127.0.0.1:9257/', true));
  assert.throws(() => assertIsolatedLive('http://127.0.0.1:9257/?x=1', true));
  assert.throws(() => assertIsolatedLive('http://127.0.0.1:9257/api', true));
});

test('isFlaggedIsolatedRoot accepts only flagged mkdtemp roots under tmpdir', () => {
  const flagged = mkdtempSync(join(os.tmpdir(), 'arbor-a02-isolated-'));
  const plain = mkdtempSync(join(os.tmpdir(), 'arbor-plain-'));
  try {
    assert.equal(isFlaggedIsolatedRoot(flagged), true);
    assert.equal(isFlaggedIsolatedRoot(plain), false);
    assert.equal(isFlaggedIsolatedRoot(join(os.tmpdir(), 'arbor-a02-isolated-does-not-exist')), false);
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
// Journal normalization / parity / parsing helpers (exported surface)
// ---------------------------------------------------------------------------

test('normalizeEntry strips volatile fields and sorts keys; parityDigest stable', () => {
  const a = normalizeEntry({ revision: 2, actor: 'loop-agent', kind: 'chat-send', text: 'x', entryId: 'e1', sequence: 2 });
  const b = normalizeEntry({ sequence: 3, entryId: 'e2', actor: 'owner-browser', revision: 3, kind: 'chat-send', text: 'x' });
  assert.deepEqual(a, { kind: 'chat-send', text: 'x' });
  assert.deepEqual(a, b);
  assert.equal(parityDigest([{ revision: 1, actor: 'a' }, { revision: 2, actor: 'b' }]), parityDigest([{ actor: 'b', revision: 2 }, { actor: 'a', revision: 1 }]));
  assert.match(parityDigest([a]), /^[a-f0-9]{64}$/);
});

test('parseJournalResponse requires a JSON array of objects', () => {
  assert.deepEqual(parseJournalResponse('[{"kind":"chat-send"}]'), [{ kind: 'chat-send' }]);
  assert.deepEqual(parseJournalResponse('[]'), []);
  assert.throws(() => parseJournalResponse('{}'));
  assert.throws(() => parseJournalResponse('[1]'));
  assert.throws(() => parseJournalResponse('not json'));
});

test('parseRawJournal parses JSONL, tolerates trailing newline, rejects torn lines', () => {
  assert.deepEqual(parseRawJournal(''), []);
  assert.deepEqual(parseRawJournal('{"a":1}\n{"a":2}\n'), [{ a: 1 }, { a: 2 }]);
  assert.deepEqual(parseRawJournal('{"a":1}\n{"a":2}'), [{ a: 1 }, { a: 2 }]);
  assert.throws(() => parseRawJournal('{"a":1}\n\n'), /Empty or torn journal line 2/);
  assert.throws(() => parseRawJournal('{"a":1}\n{oops}'), /Corrupt journal line 2/);
  assert.throws(() => parseRawJournal('[1]'), /Invalid journal entry at line 1/);
});

// ---------------------------------------------------------------------------
// Static wiring pins: server.mjs routes + page surfaces (work-order citations)
// ---------------------------------------------------------------------------

test('server.mjs wires the projection: all projectionWiring lines found', () => {
  const wiring = projectionWiring(read('apps/vivim-host/server.mjs'));
  for (const [key, line] of Object.entries(wiring))
    assert.ok(line > 0, 'server.mjs wiring missing: ' + key);
  assert.ok(wiring.importLine < wiring.createLine, 'import precedes createProductJournal');
  assert.ok(wiring.mutateRouteLine < wiring.appendLine, 'POST /api/mutate region precedes productJournal.append');
});

test('chat.js and wiki.js page surfaces reference the projection APIs', () => {
  const chat = read('apps/vivim-host/public/pages/chat.js');
  const wiki = read('apps/vivim-host/public/pages/wiki.js');
  // chat.js:2-3 STATE_URL '/api/state', MUTATE_URL '/api/mutate' (work-order pin)
  assert.ok(findLine(chat, /const STATE_URL = '\/api\/state'/), 'chat.js STATE_URL /api/state');
  assert.ok(findLine(chat, /const MUTATE_URL = '\/api\/mutate'/), 'chat.js MUTATE_URL /api/mutate');
  // wiki.js:6-10 SOURCES: wiki/state/roadmap/surface/journal
  assert.ok(findLine(wiki, /wiki: \{ url: '\/api\/wiki'/), 'wiki.js /api/wiki source');
  assert.ok(findLine(wiki, /state: \{ url: '\/api\/state'/), 'wiki.js /api/state source');
  assert.ok(findLine(wiki, /roadmap: \{ url: '\/api\/roadmap'/), 'wiki.js /api/roadmap source');
  assert.ok(findLine(wiki, /surface: \{ url: '\/api\/file-surface'/), 'wiki.js /api/file-surface source');
  assert.ok(findLine(wiki, /journal: \{ url: '\/api\/journal'/), 'wiki.js /api/journal source');
});

test('product-journal.mjs exports the three projection functions', async () => {
  const mod = await import('./A02.mjs').then(() => import(new URL('../../apps/vivim-host/chat/product-journal.mjs', import.meta.url).href));
  for (const fn of ['createProductJournal', 'replayProductJournal', 'validateProductEdit'])
    assert.equal(typeof mod[fn], 'function', 'missing export ' + fn);
});

// ---------------------------------------------------------------------------
// action-catalog.v1.json executable criterion (journey NLCL pick, re-pinned)
// ---------------------------------------------------------------------------

test('action-catalog.v1.json: status -> vivim.status.show, source_wired, missingAdapter unavailable', () => {
  const catalog = JSON.parse(read('apps/vivim-host/control/action-catalog.v1.json'));
  const status = catalog.actions.find((a) => a.id === 'vivim.status.show');
  assert.ok(status, 'vivim.status.show present');
  assert.equal(status.executor, 'apps/vivim-host/bootstrap/runtime.mjs:status');
  assert.equal(status.readiness, 'source_wired');
  assert.equal(status.risk, 'R0');
  assert.equal(status.reversible, true);
  assert.equal(status.examples[0], 'status');
  assert.equal(catalog.policy.missingAdapter, 'unavailable');
  // Only source_wired is treated executable per policy missingAdapter.
  const wired = catalog.actions.filter((a) => a.readiness === 'source_wired');
  assert.ok(wired.every((a) => a.executor && a.executor.includes(':')), 'every source_wired action has an executor');
});

// ---------------------------------------------------------------------------
// Roadmap + receipts pins (A02 verify ask skip chain)
// ---------------------------------------------------------------------------

test('roadmap.v1.json buildQueue A02 entry and A00/A01/A02 receipts match the ask', () => {
  const roadmap = JSON.parse(read('docs/product/roadmap/roadmap.v1.json'));
  const a02 = roadmap.buildQueue.find((e) => e.itemId === 'A02');
  assert.ok(a02, 'A02 in buildQueue');
  assert.equal(a02.order, 3);
  assert.equal(a02.status, 'gated');
  assert.equal(a02.lane, 'A');
  assert.deepEqual(a02.dependsOn, []);
  assert.equal(a02.ownerAcceptance, 'PENDING');
  assert.equal(typeof a02.verification, 'string');

  // Skip chain: A00 and A01 receipts settled (verified) -> skipped this round.
  const a00Receipt = JSON.parse(read('docs/product/roadmap/receipts/A00.receipt.json'));
  assert.equal(a00Receipt.itemId, 'A00');
  assert.equal(a00Receipt.status, 'verified');
  assert.equal(a00Receipt.authoredAt, '2026-11-16T23:44:26Z');
  const a01Receipt = JSON.parse(read('docs/product/roadmap/receipts/A01.receipt.json'));
  assert.equal(a01Receipt.itemId, 'A01');
  assert.equal(a01Receipt.status, 'verified');
  assert.equal(a01Receipt.authoredAt, '2026-11-17T00:33:57Z');
  // A02 receipt: the verify ask read it as status 'gated' authoredAt
  // '2026-11-16T12:20:15.019Z' (unsettled, this round's target). A parallel
  // lane may settle it to 'verified' mid-run (observed: rewritten to verified
  // authoredAt 2026-11-17T00:53:12.982Z while this suite was running), so pin
  // the stable identity fields and accept either settled state.
  const a02Receipt = JSON.parse(read('docs/product/roadmap/receipts/A02.receipt.json'));
  assert.equal(a02Receipt.schema, 'arbor.item-receipt/1');
  assert.equal(a02Receipt.itemId, 'A02');
  assert.ok(['gated', 'verified'].includes(a02Receipt.status), 'unexpected A02 receipt status: ' + a02Receipt.status);
  assert.match(a02Receipt.authoredAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
});

// ---------------------------------------------------------------------------
// Manifest registration: the A02 regression suite is itself gate-selected
// ---------------------------------------------------------------------------

test('scripts/test-manifest.json registers A02.test.mjs', () => {
  const manifest = JSON.parse(read('scripts/test-manifest.json'));
  const a02 = manifest.find((t) => t.path === 'scripts/batch-evidence/A02.test.mjs');
  assert.ok(a02, 'A02.test.mjs registered');
  assert.equal(a02.root, 'scripts/batch-evidence');
  assert.equal(a02.gate, 'roadmap-acceleration');
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
  // Canonical projection keys pinned by the verify ask.
  assert.deepEqual(Object.keys(state).sort(), ['at', 'chat', 'revision', 'schemaVersion', 'wikiRevision']);
  assert.ok(Array.isArray(state.chat), '/api/state chat array');
  assert.ok(Number.isSafeInteger(state.revision), '/api/state revision int');
  assert.ok(Number.isSafeInteger(state.wikiRevision), '/api/state wikiRevision int');
  assert.equal(typeof state.at, 'string', '/api/state at string');

  const wiki = await get('/api/wiki');
  assert.ok(Number.isSafeInteger(wiki.revision), '/api/wiki revision int');
  assert.ok(wiki.pages && typeof wiki.pages === 'object', '/api/wiki pages object');
  assert.ok(wiki.pages.Main, '/api/wiki Main page present');
  assert.ok(wiki.pages.Roadmap, '/api/wiki Roadmap page present');

  const journal = await get('/api/journal');
  assert.ok(Array.isArray(journal) && journal.length > 0, '/api/journal non-empty array');
  for (const entry of journal) {
    assert.equal(typeof entry.kind, 'string');
    assert.equal(typeof entry.actor, 'string');
    assert.ok(Number.isSafeInteger(entry.sequence));
  }
  const last = journal[journal.length - 1];
  assert.equal(last.kind, 'chat-send');
});
