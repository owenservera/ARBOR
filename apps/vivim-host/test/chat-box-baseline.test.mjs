// Product baseline acceptance re-aligned to the ONE Host product routes.
// The superseded draft /api/chat/* contract is historical, not a live API.
// These tests use a temporary Host dataRoot; no user's journal or browser is touched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';
import { loadControlCatalog, validateControlCatalog } from '../control/intent-planner.mjs';

async function request(base, route, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(base + route);
    const req = httpRequest({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method: opts.method || 'GET', headers: opts.headers || {}
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, text, type: res.headers['content-type'],
          json: () => JSON.parse(text) });
      });
    });
    req.on('error', reject);
    if (opts.body !== undefined) req.write(JSON.stringify(opts.body));
    req.end();
  });
}
async function withHost(fn) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-chat-baseline-'));
  // Owner-gated mutations (wiki-edit, gate-decision, any claimed approval) need
  // BOTH the browser CSRF header and the Host owner capability. Tests that
  // exercise a gated write take the minted token; tests that assert a gate is
  // closed simply take no token.
  const ownerToken = randomBytes(32).toString('hex');
  const server = createHostServer({ dataRoot, autoPump: false, ownerToken });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    await fn('http://127.0.0.1:' + server.address().port, { ownerToken });
  } finally {
    await new Promise(resolve => server.close(resolve));
    // Windows: the Host's journal/sqlite handles can outlive close() by a beat, so the dataRoot
    // removal throws EBUSY and failed the WHOLE suite (fleet-wide gate exit 1, 2026-11-18).
    // Best-effort retry — same pattern scratch-host.mjs journey uses; a leaked flagged temp dir
    // under os.tmpdir() is harmless and never fails the test.
    for (let i = 0; i < 6; i++) {
      try { rmSync(dataRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); break; }
      catch { await new Promise(r => setTimeout(r, 300)); }
    }
  }
}
const post = (base, body, headers = {}) => request(base, '/api/mutate', {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body
});

test('canonical chat and Wiki pages serve external CSP-compatible JS/CSS', async () =>
  withHost(async base => {
    for (const route of ['/chat', '/wiki']) {
      const page = await request(base, route);
      assert.equal(page.status, 200);
      assert.match(page.type, /text\/html/);
      assert.match(page.text, /<h1>VIVIM/);
      assert.match(page.text, new RegExp('src="/' + route.slice(1) + '\\.js"'));
      assert.match(page.text, new RegExp('href="/' + route.slice(1) + '\\.css"'));
      assert.doesNotMatch(page.text, /<script type="module">/);
      assert.doesNotMatch(page.text, /<style>/);
    }
    for (const ext of ['/chat.js', '/wiki.js', '/chat.css', '/wiki.css']) {
      assert.equal((await request(base, ext)).status, 200);
    }
    assert.equal((await request(base, '/demo')).status, 404);
    assert.equal((await request(base, '/demo/')).status, 404);
  }));

test('state and Wiki read from one typed source-backed projection', async () =>
  withHost(async base => {
    const state = (await request(base, '/api/state')).json();
    const wiki = (await request(base, '/api/wiki')).json();
    assert.equal(state.schemaVersion, 1);
    assert.deepEqual(state.chat, []);
    assert.equal(state.wikiRevision, wiki.revision);
    assert.ok(wiki.pages.Main.sections.HowTo);
    assert.equal((await request(base, '/api/journal')).json().length, 0);
  }));

test('human and AI post same typed envelope through the single Host interpreter', async () =>
  withHost(async base => {
    for (const actor of ['human', 'ai']) {
      const sent = await post(base, {
        kind: 'chat-send', actor, schemaVersion: 1, text: 'hello from ' + actor
      });
      assert.equal(sent.status, 200, sent.text);
      assert.equal(sent.json().kind, 'chat-send');
      assert.ok(sent.json().intent);
    }
    const messages = (await request(base, '/api/state')).json().chat;
    assert.deepEqual(messages.map(m => m.actor), ['human', 'ai']);
    assert.ok(messages.every(m => m.schemaVersion === 1 && m.revision > 0));
    assert.deepEqual((await request(base, '/api/journal')).json().map(x => x.kind),
      ['chat-send', 'chat-send']);
  }));

test('invalid chat envelopes fail closed without touching state', async () =>
  withHost(async base => {
    const cases = [
      { kind: 'chat-send', actor: 'human', schemaVersion: 1 },
      { kind: 'chat-send', actor: 'human', text: 'x' },
      { kind: 'chat-send', schemaVersion: 1, text: 'x' },
      { kind: 'chat-send', actor: 'human', schemaVersion: 3, text: 'x' },
      { kind: 'chat-send', actor: 'not-a-trusted-actor', schemaVersion: 1, text: 'x' },
      { kind: 'chat-send', actor: 'human', schemaVersion: 1, text: '' }
    ];
    for (const body of cases) assert.equal((await post(base, body)).status, 400);
    assert.deepEqual((await request(base, '/api/journal')).json(), []);
  }));

test('Wiki edit needs explicit local-origin action, owner capability and a fresh revision', async () =>
  withHost(async (base, { ownerToken }) => {
    const wiki = (await request(base, '/api/wiki')).json();
    const edit = { kind: 'wiki-edit', actor: 'owner-browser', schemaVersion: 1,
      expectedRevision: wiki.revision,
      edit: { action: 'set-section', page: 'Main', section: 'HowTo', content: 'hello, wiki' } };
    // CSRF is necessary but not sufficient: each refusal below is a distinct
    // missing capability, and the Host answers them in a fixed order.
    assert.equal((await post(base, edit, { origin: 'https://evil.invalid', 'x-vivim-control': '1' })).status, 403);
    assert.equal((await post(base, edit)).status, 403);
    // Correct origin + CSRF but no owner capability -> 401 OWNER_AUTH.
    assert.equal((await post(base, edit, { origin: base, 'x-vivim-control': '1' })).status, 401);
    // Correct origin + CSRF + owner capability -> the write commits.
    assert.equal((await post(base, edit, { origin: base, 'x-vivim-control': '1',
      authorization: 'Bearer ' + ownerToken })).status, 200);
    // Same revision again -> 409 REVISION_CONFLICT.
    assert.equal((await post(base, edit, { origin: base, 'x-vivim-control': '1',
      authorization: 'Bearer ' + ownerToken })).status, 409);
    const projected = (await request(base, '/api/wiki')).json();
    assert.equal(projected.revision, wiki.revision + 1);
    assert.equal(projected.pages.Main.sections.HowTo, 'hello, wiki');
    assert.equal((await request(base, '/api/state')).json().wikiRevision, projected.revision);
  }));

test('catalog enumeration is source-backed; unavailable actions are not called executable', () => {
  const catalog = loadControlCatalog();
  validateControlCatalog(catalog);
  const ids = new Set(catalog.actions.map(x => x.id));
  for (const id of ['send-message', 'read-state', 'execute-intent', 'read-journal',
    'get-capabilities', 'wiki.section.edit', 'wiki.page.delete']) {
    assert.ok(ids.has(id), 'present in canonical catalog: ' + id);
  }
  assert.ok(catalog.actions.some(a => a.readiness === 'adapter_pending'));
});

test('retired demo and feedback writes cannot append records even with owner authority', async () =>
  withHost(async (base, { ownerToken }) => {
    const headers = { 'content-type': 'application/json', origin: base, 'x-vivim-control': '1',
      authorization: 'Bearer ' + ownerToken };
    const feedback = { kind: 'feedback-round', schemaVersion: 1, actor: 'loop-agent',
      round: 'retired', approveAll: true, verdicts: [] };
    for (const route of ['/demo/feedback', '/demo/mutate']) {
      assert.equal((await request(base, route, { method: 'POST', headers, body: feedback })).status, 404);
    }
    assert.equal((await request(base, '/api/mutate', { method: 'POST', headers, body: feedback })).status, 410);
    assert.equal((await request(base, '/api/roadmap')).status, 404);
    assert.equal((await request(base, '/demo/journal.jsonl')).status, 404);
    assert.deepEqual((await request(base, '/api/journal')).json(), []);
    assert.equal((await request(base, '/api/journal?format=jsonl')).text, '');
  }));
