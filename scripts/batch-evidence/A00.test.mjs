import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  runA00Evidence,
  roadmapSelfConsistency,
  assertIsolatedLive,
} from './A00.mjs';

const REPO_ROOT = process.cwd();
const A00 = join(REPO_ROOT, 'scripts/batch-evidence/A00.mjs');
const ROADMAP = JSON.parse(
  readFileSync(join(REPO_ROOT, 'docs/product/roadmap/roadmap.v1.json'), 'utf8'),
);

// Regression pins from the A00 verification re-run (2026-11-16).
// Static digest pins defect #6: the journey wrongly pasted the live digest
// (445a1612...) as the static digest; the real static digest is 0d3d6519...
// 2026-11-17 correction appended (original comment kept): the constants below
// pin the receipt digests from docs/product/roadmap/receipts/A00.receipt.json
// gate.digests; 0d3d6519.../445a1612... were the journey's mis-pasted pair.
const STATIC_DIGEST =
  'f55364b5d65841f4afabc9637952eae5ff4404baea6ab50cbe543d62fca431ba';
const LIVE_DIGEST =
  'f3aad0d77022960638785442d9d03229869ad4a201f72ecf824415bfc4a2c2a9';

function cli(args) {
  try {
    const stdout = execFileSync('bun', [A00, ...args], {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
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
    execFileSync('curl', ['-fsS', '-m', '3', 'http://127.0.0.1:43187/api/state'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

function mockTransport(roadmap) {
  const state = { chat: [], wikiRevision: 1, revision: 1 };
  const journal = [{ kind: 'demo', actor: 'owner-browser', content: 'Hello VIVIM' }];
  const raw = journal.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
  const roadmapBody = JSON.stringify({ buildQueue: roadmap.buildQueue });
  return {
    get: async (route) => {
      if (route === '/api/state')
        return { status: 200, type: 'application/json', body: JSON.stringify(state) };
      if (route === '/api/roadmap')
        return { status: 200, type: 'application/json', body: roadmapBody };
      if (route === '/api/journal')
        return { status: 200, type: 'application/json', body: JSON.stringify(journal) };
      if (route === '/demo/journal.jsonl')
        return { status: 200, type: 'application/jsonl', body: raw };
      return { status: 404, type: 'application/json', body: JSON.stringify({ error: 'not found' }) };
    },
    post: async () => ({
      status: 405,
      type: 'application/json',
      body: JSON.stringify({ error: 'method not allowed' }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Static run (SOURCE_ONLY, no live Host, no mutation)
// ---------------------------------------------------------------------------

test('A00 static run: SOURCE_ONLY, ok:true, 8 checks, 0 fails', async () => {
  const result = await runA00Evidence({ live: false });
  assert.equal(result.schema, 'arbor.item-receipt/1');
  assert.equal(result.item, 'A00');
  assert.equal(result.scope, 'SOURCE_ONLY');
  assert.equal(result.mutation, 'NONE');
  assert.equal(result.ok, true);
  assert.equal(result.checks.length, 8);

  const byName = Object.fromEntries(result.checks.map((c) => [c.name, c]));

  // All eight checks pass against the repaired roadmap.v1.json.
  for (const name of [
    'roadmap-parses',
    'unique-item-ids',
    'depends-on-references-existing-ids',
    'statuses-in-lane-truth-vocabulary',
    'no-verified-claim-without-receipt',
    'evidence-truth-derives-clean',
    'evidence-truth-projection-shape',
    'roadmap-self-consistent',
  ]) {
    assert.equal(byName[name].pass, true, name + ' should pass');
  }

  const fails = result.checks.filter((c) => !c.pass);
  assert.equal(fails.length, 0);

  // Digest pin: static digest from the repaired run.
  assert.equal(result.digest, STATIC_DIGEST);
  assert.notEqual(result.digest, LIVE_DIGEST);
});

test('A00 CLI --static exits 0', () => {
  const out = cli(['--static']);
  assert.equal(out.exitCode, 0);
  const json = JSON.parse(out.stdout.trim());
  assert.equal(json.ok, true);
  assert.equal(json.checks.length, 8);
});

test('A00 CLI --live exits 0 with all checks passing', () => {
  if (!hostReachable()) {
    test.skip('loopback Host not reachable on http://127.0.0.1:43187');
    return;
  }
  const out = cli(['--live']);
  assert.equal(out.exitCode, 0);
  const json = JSON.parse(out.stdout.trim());
  assert.equal(json.ok, true);
  assert.equal(json.digest, LIVE_DIGEST);
  const fails = json.checks.filter((c) => !c.pass);
  assert.equal(fails.length, 0);
  for (const name of [
    'statuses-in-lane-truth-vocabulary',
    'roadmap-self-consistent',
    'live-state-api-200',
    'live-queue-projection-200',
    'live-queue-exposes-batch-items',
    'live-queue-matches-committed-roadmap',
    'live-journal-read-consistency',
    'live-reads-are-read-only',
  ]) {
    assert.ok(json.checks.some((f) => f.name === name), name + ' present');
  }
});

// ---------------------------------------------------------------------------
// Live run with mock transport (deterministic, no real Host needed)
// ---------------------------------------------------------------------------

test('A00 live run with mock transport: 14 checks pass, 0 fails', async () => {
  const result = await runA00Evidence({
    live: true,
    isolated: true,
    baseUrl: 'http://127.0.0.1:43187',
    transport: mockTransport(ROADMAP),
  });
  assert.equal(result.ok, true);
  assert.equal(result.scope, 'SOURCE_PLUS_READ_ONLY_LIVE_GETS');
  assert.equal(result.mutation, 'NONE_READ_ONLY');
  assert.equal(result.checks.length, 14);
  assert.equal(result.digest, LIVE_DIGEST);

  // All fourteen checks pass against the repaired roadmap and mock loopback Host.
  const fails = result.checks.filter((c) => !c.pass);
  assert.equal(fails.length, 0, JSON.stringify(fails));

  for (const name of [
    'live-state-api-200',
    'live-queue-projection-200',
    'live-queue-exposes-batch-items',
    'live-queue-matches-committed-roadmap',
    'live-journal-read-consistency',
    'live-reads-are-read-only',
  ]) {
    const check = result.checks.find((c) => c.name === name);
    assert.ok(check, name + ' present');
    assert.equal(check.pass, true, name + ' detail: ' + check.detail);
  }
});

// ---------------------------------------------------------------------------
// Regression: confirmed defect — live run must never issue POST /api/mutate
// (work order: read-only GETs only; no mutation on live Host)
// ---------------------------------------------------------------------------

function mutationTrackingTransport(roadmap) {
  const state = { chat: [], wikiRevision: 1, revision: 1 };
  const journal = [{ kind: 'demo', actor: 'owner-browser', content: 'Hello VIVIM' }];
  const raw = journal.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
  const roadmapBody = JSON.stringify({ buildQueue: roadmap.buildQueue });
  const calls = { get: [], post: [] };
  return {
    calls,
    get: async (route) => {
      calls.get.push(route);
      if (route === '/api/state')
        return { status: 200, type: 'application/json', body: JSON.stringify(state) };
      if (route === '/api/roadmap')
        return { status: 200, type: 'application/json', body: roadmapBody };
      if (route === '/api/journal')
        return { status: 200, type: 'application/json', body: JSON.stringify(journal) };
      if (route === '/demo/journal.jsonl')
        return { status: 200, type: 'application/jsonl', body: raw };
      return { status: 404, type: 'application/json', body: JSON.stringify({ error: 'not found' }) };
    },
    post: async (route, body, headers) => {
      calls.post.push({ route, body, headers });
      throw new Error('POST /api/mutate must never be issued by the read-only A00 live runner');
    },
  };
}

test('A00 live run with mutation-tracking transport: zero POST /api/mutate calls', async () => {
  const transport = mutationTrackingTransport(ROADMAP);
  const result = await runA00Evidence({
    live: true,
    isolated: true,
    baseUrl: 'http://127.0.0.1:43187',
    transport,
  });
  assert.equal(result.ok, true);
  assert.equal(result.mutation, 'NONE_READ_ONLY');
  // read-only GETs only: /api/state, /api/roadmap, /api/journal, /demo/journal.jsonl
  assert.ok(transport.calls.get.includes('/api/state'), 'GET /api/state issued');
  assert.ok(transport.calls.get.includes('/api/roadmap'), 'GET /api/roadmap issued');
  assert.ok(transport.calls.get.includes('/api/journal'), 'GET /api/journal issued');
  assert.ok(transport.calls.get.includes('/demo/journal.jsonl'), 'GET /demo/journal.jsonl issued');
  // The regression: no mutation POST is ever issued against the live Host.
  assert.equal(transport.calls.post.length, 0, 'zero POST calls: ' + JSON.stringify(transport.calls.post));
});

test('A00 buildQueue[0] has no releaseClaim field (journey claim uncorroborated)', () => {
  const row = ROADMAP.buildQueue.find((r) => r.itemId === 'A00');
  assert.ok(row, 'A00 present in buildQueue');
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'releaseClaim'), false,
    'releaseClaim must not be a field on A00 buildQueue[0]; keys are ' + Object.keys(row).join(','));
});

// ---------------------------------------------------------------------------
// Loopback guard (deterministic, no Host)
// ---------------------------------------------------------------------------

test('assertIsolatedLive accepts only isolated loopback http base URLs', () => {
  assert.doesNotThrow(() => assertIsolatedLive('http://127.0.0.1:43187', true));
  assert.doesNotThrow(() => assertIsolatedLive('http://localhost:43187', true));
  assert.doesNotThrow(() => assertIsolatedLive('http://[::1]:43187', true));
  for (const url of [
    'https://127.0.0.1:43187',
    'http://192.168.1.9:43187',
    'http://127.0.0.1:43187/foo',
    'http://127.0.0.1:43187?x=1',
    'http://user:pass@127.0.0.1:43187',
  ]) {
    assert.throws(() => assertIsolatedLive(url, true), /isolated/);
  }
  assert.throws(() => assertIsolatedLive('http://127.0.0.1:43187', false), /isolated/);
});

// ---------------------------------------------------------------------------
// roadmapSelfConsistency directly flags the A07 build-failed status
// ---------------------------------------------------------------------------

test('roadmapSelfConsistency passes on the repaired roadmap (A07 status=queued)', () => {
  const result = roadmapSelfConsistency(ROADMAP, () => false);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.errors.filter((e) => /vocabulary/.test(e)).length, 0, 'no lane-truth vocabulary violations');
  assert.equal(result.errors.filter((e) => /A07 status=build-failed/.test(e)).length, 0, 'A07 build-failed error gone');
});

test('roadmapSelfConsistency passes when every status is in vocabulary', () => {
  const fixed = JSON.parse(JSON.stringify(ROADMAP));
  function walk(node) {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node && typeof node === 'object') {
      if (node.id === 'A07') node.status = 'gated';
      for (const value of Object.values(node)) walk(value);
    }
  }
  walk(fixed);
  const result = roadmapSelfConsistency(fixed, () => false);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

// ---------------------------------------------------------------------------
// Confirmed-defect regressions from the A00 verify re-run (2026-11-17 ask).
// Each test pins one confirmed defect's regression. Live tests are read-only
// GETs against the loopback Host and skip when it is unreachable.
// ---------------------------------------------------------------------------

const RECEIPT = JSON.parse(
  readFileSync(join(REPO_ROOT, 'docs/product/roadmap/receipts/A00.receipt.json'), 'utf8'),
);
const CATALOG = JSON.parse(
  readFileSync(join(REPO_ROOT, 'apps/vivim-host/control/action-catalog.v1.json'), 'utf8'),
);
const SERVER_MJS = readFileSync(join(REPO_ROOT, 'apps/vivim-host/server.mjs'), 'utf8');
const LIVE_BASE = 'http://127.0.0.1:43187';

function findL2Item(node, id) {
  if (Array.isArray(node)) {
    for (const x of node) { const r = findL2Item(x, id); if (r) return r; }
    return null;
  }
  if (node && typeof node === 'object') {
    if (node.id === id && node.layer === 'L2') return node;
    for (const v of Object.values(node)) { const r = findL2Item(v, id); if (r) return r; }
  }
  return null;
}

async function liveGet(route) {
  const res = await fetch(LIVE_BASE + route, { signal: AbortSignal.timeout(5000) });
  return { status: res.status, body: await res.text() };
}

test('roadmap.v1.json A00 L2 item: gated, dependsOn [], verification UNRUN, ownerAcceptance PENDING', () => {
  const item = findL2Item(ROADMAP, 'A00');
  assert.ok(item, 'A00 L2 item present');
  assert.equal(item.status, 'gated');
  assert.deepEqual(item.dependsOn, []);
  assert.equal(item.verification, 'UNRUN');
  assert.equal(item.ownerAcceptance, 'PENDING');
  assert.equal(item.releaseClaim, false);
});

test('A00 receipt pins gate digests and flags journey step3PostChatSend as defect', () => {
  // Receipt shape as committed (read this ask): nlclReplay.checks holds the 8
  // static checks, all pass=true; gate.digests pins static+live digests; the
  // prior 5-step programmatic journey run is recorded; evidence.confirmedDefects
  // text keeps the mutation step flagged defect, never pass=true.
  assert.equal(RECEIPT.schema, 'arbor.item-receipt/1');
  assert.equal(RECEIPT.itemId, 'A00');
  assert.equal(RECEIPT.gate.command, 'bun scripts/test-gate.mjs');
  assert.equal(RECEIPT.gate.exit, 0);
  assert.equal(RECEIPT.nlclReplay.checks.length, 8, 'nlclReplay.checks holds the 8 static checks');
  for (const c of RECEIPT.nlclReplay.checks) assert.equal(c.pass, true, c.name + ' pass');
  assert.equal(RECEIPT.gate.digests.static, STATIC_DIGEST);
  assert.equal(RECEIPT.gate.digests.live, LIVE_DIGEST);
  assert.equal(RECEIPT.journey.steps, 5, 'prior 5-step run, not this run');
  assert.equal(RECEIPT.journey.mode, 'programmatic');
  // Confirmed defect: the journey POSTed /api/mutate on the live Host; the receipt
  // text must keep that step flagged defect, never pass=true.
  const defectsText = JSON.stringify(RECEIPT.evidence.confirmedDefects);
  assert.ok(defectsText.includes("step3PostChatSend.status='defect'"),
    'mutation step stays flagged defect, never pass=true');
  assert.ok(/POST \/api\/mutate/.test(defectsText), 'POST /api/mutate defect recorded');
  assert.ok(defectsText.includes('no mutation on live Host'), 'read-only acceptance note present');
  // verifyRerun records this ask's gate re-run: static 8/8, live 14/14, exit 0.
  assert.equal(RECEIPT.verifyRerun.commands.static.exit, 0);
  assert.equal(RECEIPT.verifyRerun.commands.static.checks, '8/8');
  assert.equal(RECEIPT.verifyRerun.commands.static.digest, STATIC_DIGEST);
  assert.equal(RECEIPT.verifyRerun.commands.live.exit, 0);
  assert.equal(RECEIPT.verifyRerun.commands.live.checks, '14/14');
  assert.equal(RECEIPT.verifyRerun.commands.live.digest, LIVE_DIGEST);
  assert.equal(RECEIPT.verifyRerun.commands.live.mutation, 'NONE_READ_ONLY');
});

test('action-catalog.v1.json vivim.status.show citation is verbatim-true', () => {
  const action = (CATALOG.actions || []).find((a) => a.id === 'vivim.status.show');
  assert.ok(action, 'vivim.status.show present in catalog actions');
  assert.equal(action.readiness, 'source_wired');
  assert.equal(action.executor, 'apps/vivim-host/bootstrap/runtime.mjs:status');
  assert.equal(action.risk, 'R0');
  assert.equal(action.reversible, true);
  assert.deepEqual(action.examples, ['status', 'show status', 'how is vivim doing']);
  assert.equal(action.title, 'Show VIVIM status');
  assert.equal(action.language.reading, action.title, 'interpreter reading equals title');
});

test('server.mjs chat-send envelope validation and VIVIM_HOST_PORT default present (line-agnostic)', () => {
  // Citation-drift regression: the journey cited server.mjs:1121 for the port
  // default; the constant actually lives at :1127. Pin by content, not line.
  const portMatches = SERVER_MJS.match(/process\.env\.VIVIM_HOST_PORT \|\| 43187/g) || [];
  assert.equal(portMatches.length, 1, 'VIVIM_HOST_PORT default 43187 defined exactly once');
  const portLine = SERVER_MJS.slice(0, SERVER_MJS.indexOf(portMatches[0])).split('\n').length;
  assert.ok(portLine > 0, 'port default line resolved at test time: server.mjs:' + portLine);
  // chat-send envelope validation: kind/actor/schemaVersion/text only, actor
  // enum, caller-provided IR rejected, pure interpreter (CHAT_ENVELOPE 400).
  assert.ok(/CHAT_ENVELOPE/.test(SERVER_MJS), 'CHAT_ENVELOPE rejection present');
  assert.ok(SERVER_MJS.includes("['human', 'ai', 'owner-browser', 'loop-agent']"), 'actor enum present');
  assert.ok(SERVER_MJS.includes("['kind', 'actor', 'schemaVersion', 'text']"), 'envelope key whitelist present');
  assert.ok(/Object\.hasOwn\(entry, 'intent'\)/.test(SERVER_MJS), 'caller-provided intent rejected');
});

test('live GET /api/state projects the journey tail verbatim (count derived from data)', async () => {
  if (!hostReachable()) { test.skip('loopback Host not reachable'); return; }
  // 2026-11-17 correction appended (original pinned revision 8 / chat_len 8): confirmed
  // defect — the live Host mutated after the journey (now rev 19 / chat 19), so the
  // byte/count snapshot is no longer re-readable. Counts derive from the data; the
  // journey entries are matched by actor+text, not by pinned revision position.
  const out = await liveGet('/api/state');
  assert.equal(out.status, 200);
  const state = JSON.parse(out.body);
  assert.deepEqual(Object.keys(state).sort(),
    ['at', 'chat', 'revision', 'schemaVersion', 'wikiRevision']);
  assert.equal(state.revision, state.chat.length, 'revision equals chat length');
  assert.deepEqual(state.chat.map((e) => e.revision),
    Array.from({ length: state.chat.length }, (_, i) => i + 1), 'chat revisions contiguous from 1');
  assert.equal(state.wikiRevision, 1);
  const feedbackOf = (e) => e.intent?.feedback && {
    status: e.intent.feedback.status,
    confidence: e.intent.feedback.confidence,
    canonical: e.intent.feedback.canonical,
    reading: e.intent.feedback.reading,
  };
  const journey = ['A00 verify journey ping', 'status', 'show status']
    .map((text) => state.chat.filter((e) => e.text === text && e.actor === 'human'))
    .flat();
  assert.ok(journey.length >= 3, 'journey human chat-sends present in live chat');
  const byText = (text) => {
    const hits = journey.filter((e) => e.text === text);
    assert.ok(hits.length >= 1, 'journey entry present: ' + text);
    return hits[hits.length - 1];
  };
  assert.deepEqual(feedbackOf(byText('A00 verify journey ping')),
    { status: 'unknown', confidence: 0, canonical: null, reading: null });
  assert.deepEqual(feedbackOf(byText('status')),
    { status: 'ok', confidence: 0.73, canonical: '/show', reading: 'Show VIVIM status' });
  assert.deepEqual(feedbackOf(byText('show status')),
    { status: 'ambiguous', confidence: 0.69, canonical: '/summary', reading: 'Summarize paired phone grants' });
});

test('live GET /api/wiki: HTTP 200, revision 1, pages.Main with About/HowTo/Sources', async () => {
  if (!hostReachable()) { test.skip('loopback Host not reachable'); return; }
  const out = await liveGet('/api/wiki');
  assert.equal(out.status, 200);
  const wiki = JSON.parse(out.body);
  assert.equal(wiki.revision, 1);
  assert.ok(wiki.pages?.Main, 'pages.Main present');
  for (const section of ['About', 'HowTo', 'Sources']) {
    assert.ok(wiki.pages.Main.sections?.[section], 'pages.Main.sections.' + section + ' present');
  }
});

test('live GET /api/journal: contiguous sequence, journey chat-sends present, count derived from data', async () => {
  if (!hostReachable()) { test.skip('loopback Host not reachable'); return; }
  const out = await liveGet('/api/journal');
  assert.equal(out.status, 200);
  const journal = JSON.parse(out.body);
  assert.ok(Array.isArray(journal), '/api/journal is a JSON array, not JSONL');
  // Confirmed defect: journey claimed growth 19->20; its own evidence file held
  // 17 entries and the live journal actually grew 17->20. 2026-11-17 correction
  // appended (original pinned length 20 / seq 18-20): the live Host mutated again
  // after the journey (now 31 entries), so the count snapshot is not re-readable.
  // Pin contiguity + the journey entries by kind/actor/text; count from the data.
  assert.ok(journal.length >= 20, 'journal holds at least the journey-era 20 entries, actual=' + journal.length);
  assert.deepEqual(journal.map((e) => e.sequence), Array.from({ length: journal.length }, (_, i) => i + 1),
    'sequences contiguous from 1, count=' + journal.length);
  const journeySends = journal.filter((e) => e.kind === 'chat-send' && e.actor === 'human' &&
    ['A00 verify journey ping', 'status', 'show status'].includes(e.text));
  assert.ok(journeySends.length >= 3, 'journey chat-send entries present in live journal');
  for (const text of ['A00 verify journey ping', 'status', 'show status']) {
    assert.ok(journeySends.some((e) => e.text === text), 'journey chat-send present: ' + text);
  }
  const seqs = journeySends.map((e) => e.sequence);
  assert.deepEqual([...seqs].sort((a, b) => a - b), seqs, 'journey sends recorded in ascending sequence');
});

test('live GET / (root HTML): HTTP 200, served title corroborates journey summary', async () => {
  if (!hostReachable()) { test.skip('loopback Host not reachable'); return; }
  const out = await liveGet('/');
  assert.equal(out.status, 200);
  const m = out.body.match(/<title>([^<]*)<\/title>/i);
  assert.ok(m, 'root HTML carries a <title>');
  // Confirmed defect: title corroborated via served HTML only — no browser-probe
  // facility (agent.browsers.list / in-app tab) exists in this session, so the
  // journey browser step is not reproducible here; DOM snapshot stays unproven.
  assert.equal(m[1], 'VIVIM · My machine, my data, my AI');
});

test('live determinism: every chat entry "show status" carries identical feedback', async () => {
  if (!hostReachable()) { test.skip('loopback Host not reachable'); return; }
  const state = JSON.parse((await liveGet('/api/state')).body);
  const matches = state.chat.filter((e) => e.text === 'show status');
  assert.ok(matches.length >= 2, 'baseline owner-browser and journey human entries both present');
  const feedbacks = matches.map((e) => e.intent?.feedback && {
    status: e.intent.feedback.status, confidence: e.intent.feedback.confidence,
    canonical: e.intent.feedback.canonical, reading: e.intent.feedback.reading,
  });
  for (const f of feedbacks) {
    assert.deepEqual(f, { status: 'ambiguous', confidence: 0.69, canonical: '/summary', reading: 'Summarize paired phone grants' });
  }
  // Proving determinism by re-POSTing would mutate the live Host; not executed.
});
