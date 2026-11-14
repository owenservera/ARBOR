// Batch-1 product routes (oracle ack2) — /chat /wiki pages, /api/state|wiki|file-surface
// baseline seeds, /api/roadmap + /api/journal read-throughs, POST /api/mutate append.
// Modeled on demo-iframe-smoke.test.mjs: raw HTTP over node:http (immune to a
// globalThis.fetch stub from another test file — the suite runs in one bun process),
// server started on an ephemeral port via createHostServer().
import test from 'node:test';
import assert from 'node:assert/strict';

import { request as httpRequest } from 'node:http';
function httpFetch(base, route, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + route);
    const req = httpRequest({
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method: opts.method || 'GET', headers: opts.headers || {}
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: res.statusCode,
          headers: { get: k => (res.headers[String(k).toLowerCase()] ?? null) },
          text: async () => body,
          json: async () => JSON.parse(body)
        });
      });
    });
    req.on('error', reject);
    if (opts.body != null) req.write(opts.body);
    req.end();
  });
}

import { mkdirSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostServer } from '../server.mjs';

const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const realPagesDir = path.resolve(testDir, '..', 'public', 'pages');

// Temp staticRoot: the pages tree is copied so POST /api/mutate appends to a TEMP
// demo/journal.jsonl (same path the handler resolves via staticRoot) — the real
// repo journal is never touched by this test.
function makeStaticRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-product-routes-'));
  mkdirSync(path.join(root, 'pages'), { recursive: true });
  mkdirSync(path.join(root, 'demo'), { recursive: true });
  copyFileSync(path.join(realPagesDir, 'chat.html'), path.join(root, 'pages', 'chat.html'));
  copyFileSync(path.join(realPagesDir, 'wiki.html'), path.join(root, 'pages', 'wiki.html'));
  return root;
}

test('batch-1 product routes: pages, baseline JSON, read-throughs, mutate append, 404 tail', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-product-routes-data-'));
  const staticRoot = makeStaticRoot();
  const server = createHostServer({ dataRoot, staticRoot });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;

    // Pages: exact-string ASSETS entries serve the real page bodies.
    const chat = await httpFetch(base, '/chat');
    assert.equal(chat.status, 200);
    assert.match(chat.headers.get('content-type') || '', /text\/html/);
    assert.match(await chat.text(), /<h1>VIVIM chat<\/h1>/);
    const wiki = await httpFetch(base, '/wiki');
    assert.equal(wiki.status, 200);
    assert.match(wiki.headers.get('content-type') || '', /text\/html/);
    assert.match(await wiki.text(), /<h1>VIVIM realtime wiki<\/h1>/);

    // Baseline seeds: state = chat state projection shape (state.mjs.draft loadState),
    // wiki = {revision, pages{name:{sections}}} with a few sections.
    const state = await httpFetch(base, '/api/state');
    assert.equal(state.status, 200);
    assert.match(state.headers.get('content-type') || '', /application\/json/);
    const stateJson = await state.json();
    assert.ok(Array.isArray(stateJson.chat), 'state.chat must be an array');
    assert.equal(typeof stateJson.wikiRevision, 'number');

    const wikiApi = await httpFetch(base, '/api/wiki');
    assert.equal(wikiApi.status, 200);
    const wikiJson = await wikiApi.json();
    assert.equal(typeof wikiJson.revision, 'number');
    const mainSections = wikiJson.pages && wikiJson.pages.Main && wikiJson.pages.Main.sections;
    assert.ok(mainSections && Object.keys(mainSections).length >= 3, 'wiki seed must carry a few sections');

    // file-surface: the seed document ships in data/demo-baseline/, so 200.
    const surface = await httpFetch(base, '/api/file-surface');
    assert.equal(surface.status, 200);
    assert.match(surface.headers.get('content-type') || '', /application\/json/);

    // Read-throughs: roadmap from docs/product/roadmap/roadmap.v1.json (single source).
    const roadmap = await httpFetch(base, '/api/roadmap');
    assert.equal(roadmap.status, 200);
    const roadmapJson = await roadmap.json();
    assert.ok(Array.isArray(roadmapJson.buildQueue) && roadmapJson.buildQueue.length >= 1);

    // Journal read-through: temp staticRoot has no journal yet — an empty array.
    const journalBefore = await httpFetch(base, '/api/journal');
    assert.equal(journalBefore.status, 200);
    assert.match(journalBefore.headers.get('content-type') || '', /application\/json/);
    assert.deepEqual(await journalBefore.json(), []);

    // POST /api/mutate appends ONE JSON line to the journal the handler owns.
    const mutate = await httpFetch(base, '/api/mutate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, actor: 'loop-agent', kind: 'chat-send', text: 'product-routes test line' })
    });
    assert.equal(mutate.status, 200);
    const stored = await mutate.json();
    assert.equal(stored.kind, 'chat-send');
    assert.ok(stored.receivedAt, 'stored entry must carry receivedAt');

    // The append is visible through the /api/journal read-through of the SAME file.
    const journalAfter = await httpFetch(base, '/api/journal');
    assert.equal(journalAfter.status, 200);
    const entries = await journalAfter.json();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].kind, 'chat-send');
    assert.equal(entries[0].text, 'product-routes test line');

    // One handler, two route names: the demo alias hits the SAME append path.
    const alias = await httpFetch(base, '/demo/mutate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, actor: 'keeper', kind: 'gate-decision', itemId: 'CHAT-BOX-BASELINE', decision: 'approve' })
    });
    assert.equal(alias.status, 200);
    const journalFinal = await httpFetch(base, '/api/journal');
    assert.equal((await journalFinal.json()).length, 2);

    // Exact-string dispatch only: unknown /api/* paths still 404 (no catch-all).
    assert.equal((await httpFetch(base, '/api/definitely-not-a-route')).status, 404);
    assert.equal((await httpFetch(base, '/api/state/extra')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dataRoot, { recursive: true, force: true });
    rmSync(staticRoot, { recursive: true, force: true });
  }
});
