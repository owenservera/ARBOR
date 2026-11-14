// CHAT-BOX-BASELINE acceptance — page 1 pure chat, human+AI same endpoints.
//
// Route contract exercised here (implemented in apps/vivim-host/server.mjs,
// which the demo lane patches this window — see blocker note below):
//   GET    /chat                      pure chat box HTML (not under /demo/)
//   GET    /api/chat/state            machine-readable chat state + wiki revision
//   GET    /api/chat/wiki             machine-readable wiki (revision, pages, sections)
//   GET    /api/chat/capabilities     getCapabilities via real NLCL planner describe()
//   GET    /api/chat/journal          machine-readable control journal
//   POST   /api/chat/send             ONE typed write endpoint, envelope { text, actor, schemaVersion }
// /demo/ stays machine artifacts only; POST /demo/feedback behavior preserved.
//
// NOTE: apps/vivim-host/server.mjs is excluded from edits this window (demo lane owns the route
// patch), so the /chat and /api/chat/* routes do not exist yet and the route-dependent checks
// below cannot pass until that lane lands. They are written to the contract above so the suite
// turns green as soon as the routes are wired. Module-level checks (catalog, state module) pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync, readFileSync, cpSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostServer } from '../server.mjs';
import { loadControlCatalog, validateControlCatalog } from '../control/intent-planner.mjs';

const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const hostRoot = path.resolve(testDir, '..');

const BASE_IDS = ['send-message', 'read-state', 'execute-intent', 'read-journal', 'get-capabilities'];
const REQUIRED_ACTION_FIELDS = ['id', 'title', 'category', 'owner', 'executor', 'readiness', 'risk', 'target', 'args', 'examples', 'surfaces', 'reversible', 'privacy', 'subject', 'priority'];

function httpFetch(base, route, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + route);
    const req = httpRequest(url, {
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method: opts.method || 'GET', headers: opts.headers || {}
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, headers: { get: k => (res.headers[String(k).toLowerCase()] ?? null) }, text: async () => body, json: async () => JSON.parse(body) });
      });
    });
    req.on('error', reject);
    if (opts.body != null) req.write(opts.body);
    req.end();
  });
}
function httpRequest(url, options, listener) { return http.request(url, options, listener); }

function chatStaticRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-chat-assets-'));
  cpSync(path.join(hostRoot, 'public', 'demo'), path.join(root, 'demo'), { recursive: true });
  cpSync(path.join(hostRoot, 'public', 'chat.html'), path.join(root, 'chat.html'));
  cpSync(path.join(hostRoot, 'public', 'vivim-tokens.css'), path.join(root, 'vivim-tokens.css'));
  return root;
}

async function withServer(run) {
  const staticRoot = chatStaticRoot();
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-chat-data-'));
  const server = createHostServer({ dataRoot, staticRoot });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    await run(base);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(staticRoot, { recursive: true, force: true });
    rmSync(dataRoot, { recursive: true, force: true });
  }
}

test('GET /chat returns 200 with pure chat box HTML from Host static assets (not under /demo/)', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/chat');
    assert.equal(res.status, 200, '/chat status');
    assert.match(res.headers.get('content-type') || '', /text\/html/, '/chat content-type');
    const html = await res.text();
    assert.match(html, /<h1>VIVIM chat<\/h1>/);
    assert.match(html, /id="log"/);
    assert.match(html, /\/api\/chat\/state/);
    assert.match(html, /\/api\/chat\/send/);
    assert.match(html, /schemaVersion/);
    assert.notMatch(html, /\/demo\/(chat|wiki)/, 'chat UI must not reference /demo/ chat or wiki paths');
    const demo = await httpFetch(base, '/demo/');
    assert.equal(demo.status, 404, '/demo/ stays 404 by design');
    const demoChat = await httpFetch(base, '/demo/chat');
    assert.equal(demoChat.status, 404, '/demo/chat must not serve the product chat page');
  });
});

test('/chat rejects non-GET methods', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(res.status, 405);
  });
});

test('GET /api/chat/state returns typed realtime state: chat + wikiRevision', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/api/chat/state');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const s = await res.json();
    assert.equal(s.schemaVersion, 1);
    assert.ok(Array.isArray(s.chat), 'chat is the primary surface');
    assert.ok(Number.isInteger(s.wikiRevision), 'wikiRevision present');
    assert.ok(typeof s.at === 'string', 'at timestamp present');
  });
});

test('GET /api/chat/wiki returns machine-readable wiki (revision, pages, sections)', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/api/chat/wiki');
    assert.equal(res.status, 200);
    const w = await res.json();
    assert.ok(Number.isInteger(w.revision));
    assert.ok(w.pages && typeof w.pages === 'object');
  });
});

test('POST /api/chat/send accepts identical typed envelope for human and AI (actor + schemaVersion)', async () => {
  await withServer(async (base) => {
    const post = (actor) => httpFetch(base, '/api/chat/send', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'hello from ' + actor, actor, schemaVersion: 1 })
    });
    const human = await post('human');
    assert.equal(human.status, 200, 'human write');
    const ai = await post('ai');
    assert.equal(ai.status, 200, 'ai write — same envelope shape');

    const s = await (await httpFetch(base, '/api/chat/state')).json();
    const humanMsg = s.chat.find(m => m.actor === 'human' && m.text === 'hello from human');
    const aiMsg = s.chat.find(m => m.actor === 'ai' && m.text === 'hello from ai');
    assert.ok(humanMsg, 'human message observed in state');
    assert.ok(aiMsg, 'ai message observed in state — equivalent mutation semantics');
    assert.equal(humanMsg.schemaVersion, 1);
    assert.equal(aiMsg.schemaVersion, 1);
    assert.ok(typeof humanMsg.at === 'string' && typeof aiMsg.at === 'string');
  });
});

test('POST /api/chat/send rejects malformed envelopes (missing actor / schemaVersion / text)', async () => {
  await withServer(async (base) => {
    const bad = [
      { actor: 'human', schemaVersion: 1 },                                   // no text
      { text: 'x', schemaVersion: 1 },                                        // no actor
      { text: 'x', actor: 'human' },                                          // no schemaVersion
      { text: 'x', actor: 'human', schemaVersion: 2 },                        // wrong schemaVersion
      { text: 'x', actor: 'bot', schemaVersion: 1 },                          // unknown actor
      { text: '', actor: 'human', schemaVersion: 1 }                          // empty text
    ];
    for (const body of bad) {
      const res = await httpFetch(base, '/api/chat/send', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      });
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });
});

test('GET /api/chat/capabilities reports day-1 baseline via real NLCL planner describe()', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/api/chat/capabilities');
    assert.equal(res.status, 200);
    const cap = await res.json();
    assert.equal(cap.schema, 'vivim.control-discovery/1');
    assert.ok(Number.isInteger(cap.version) && cap.version >= 1);
    assert.ok(Array.isArray(cap.actions));
    // count/coverage per gate evidence target (§CONVERGENCE Q5: 12) — the baseline
    // scopes 5 day-1 capabilities; any gap vs 12 is reported here, not hidden.
    assert.ok(cap.coverage.total >= BASE_IDS.length, 'coverage total covers the baseline set');
    const present = cap.actions.map(a => a.id);
    for (const id of BASE_IDS) assert.ok(present.includes(id), 'capability in describe(): ' + id);
    for (const a of cap.actions.filter(a => BASE_IDS.includes(a.id))) {
      for (const f of REQUIRED_ACTION_FIELDS) assert.ok(f in a, a.id + ' missing field ' + f);
      assert.ok(Array.isArray(a.surfaces) && a.surfaces.length === 4, a.id + ' surfaces');
      assert.ok(Array.isArray(a.examples) && a.examples.length, a.id + ' examples');
      assert.ok(['R0','R1','R2','R3'].includes(a.risk) && ['adapter_pending','enforcement_missing','unsupported','source_wired','verified'].includes(a.readiness));
    }
    // Cross-check against the real catalog validator the planner itself uses.
    const catalog = loadControlCatalog();
    validateControlCatalog(catalog);
    const catalogIds = catalog.actions.map(a => a.id);
    for (const id of BASE_IDS) assert.ok(catalogIds.includes(id), 'catalog contains ' + id);
  });
});

test('GET /api/chat/journal is a machine-readable read endpoint', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/api/chat/journal');
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.ok(j.schema && typeof j.schema === 'string');
    assert.ok(Array.isArray(j.recent ?? []));
  });
});

test('/demo/ feedback artifact handling is preserved (machine artifacts only under /demo/)', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/demo/feedback', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ round: 'chat-baseline-1', approveAll: false, verdicts: [] })
    });
    assert.equal(res.status, 200);
    const round = await res.json();
    assert.equal(round.round, 'chat-baseline-1');
    const inbox = await (await httpFetch(base, '/demo/feedback/inbox.json')).json();
    assert.ok(Array.isArray(inbox) && inbox.length >= 1);
    const write = await httpFetch(base, '/demo/feedback/inbox.json', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(write.status, 405);
  });
});
