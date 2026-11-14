// C11 acceptance — demo shell assets served by the production Host.
// The demo integrates through apps/vivim-host/server.mjs only: GET /demo (exact
// path only — /demo/ 404s by design), the allowlisted static assets below, and
// POST /demo/feedback + POST /demo/mutate as the sole writable surfaces, each
// appending ONE JSON line per entry to public/demo/journal.jsonl (every other
// write 405; the legacy /demo/feedback/inbox.json snapshot is served frozen).
// Fixture layer provides every data read; no product API is touched.
import test from 'node:test';
import assert from 'node:assert/strict';

// Raw HTTP over node:http — immune to globalThis.fetch being replaced by
// another test file's fixture stub (the demo suite runs in one bun process).
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

import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostServer } from '../server.mjs';


// apps/vivim-host/ — public/demo and public/vivim-tokens.css live under it.
// This test's directory: bun's import.meta.url loses the filename, so prefer
// __dirname (bun ESM has it) and fall back to fileURLToPath for node.
const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const hostRoot = path.resolve(testDir, '..');

// Demo routes the server allowlists (server.mjs ASSETS/MIME, lines 62-72).
const DEMO_JSON = [
  '/demo/fixture/index.json',
  '/demo/fixture/tab-today.json',
  '/demo/fixture/tab-talk.json',
  '/demo/fixture/tab-build.json',
  '/demo/fixture/tab-world.json',
  '/demo/fixture/tab-me.json',
  '/demo/fixture/tab-control.json',
  '/demo/feedback/inbox.json',
  '/demo/journal.jsonl'
];

function demoStaticRoot() {
  // Copy only the demo parcel + tokens sheet into a temp staticRoot so the
  // feedback/mutate POSTs exercise a real journal file without touching the repo tree.
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-demo-assets-'));
  cpSync(path.join(hostRoot, 'public', 'demo'), path.join(root, 'demo'), { recursive: true });
  cpSync(path.join(hostRoot, 'public', 'vivim-tokens.css'), path.join(root, 'vivim-tokens.css'));
  return root;
}

async function withServer(run) {
  const staticRoot = demoStaticRoot();
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-demo-data-'));
  const server = createHostServer({ dataRoot, staticRoot });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    await run(base, staticRoot);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(staticRoot, { recursive: true, force: true });
    rmSync(dataRoot, { recursive: true, force: true });
  }
}

test('GET /demo serves the shell html wired to tokens, css and controller', async () => {
  await withServer(async (base) => {
    const res = await httpFetch(base, '/demo');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
    const html = await res.text();
    assert.match(html, /<link rel="stylesheet" href="\/vivim-tokens.css">/);
    assert.match(html, /<link rel="stylesheet" href="\/demo\/demo.css">/);
    assert.match(html, /<script defer src="\/demo\/controller.js"><\/script>/);
    assert.match(html, /id="demo-live-preview" src="\/mobile\/\?host-preview=1"/);
  });
});

test('demo asset routes serve exact paths with the contracted content types', async () => {
  await withServer(async (base) => {
    const expectations = [
      ['/demo/controller.js', /text\/javascript/],
      ['/demo/demo.css', /text\/css/],
      ['/vivim-tokens.css', /text\/css/],
      ...DEMO_JSON.map(p => [p, /application\/json/])
    ];
    for (const [route, type] of expectations) {
      const res = await httpFetch(base, route);
      assert.equal(res.status, 200, route);
      assert.match(res.headers.get('content-type') || '', type, route);
    }
  });
});

test('/demo/ 404s by design and unknown demo subpaths never resolve', async () => {
  await withServer(async (base) => {
    assert.equal((await httpFetch(base, '/demo/')).status, 404);
    assert.equal((await httpFetch(base, '/demo/fixture/')).status, 404);
    assert.equal((await httpFetch(base, '/demo/fixture/tab-nope.json')).status, 404);
    assert.equal((await httpFetch(base, '/demo/fixture/tab-me.json.bak')).status, 404);
    assert.equal((await httpFetch(base, '/demo/nope.txt')).status, 404);
    assert.equal((await httpFetch(base, '/demo/controller.js/extra')).status, 404);
  });
});

test('every demo write except POST /demo/feedback and POST /demo/mutate is rejected 405', async () => {
  await withServer(async (base) => {
    for (const [method, route] of [
      ['POST', '/demo'],
      ['PUT', '/demo'],
      ['DELETE', '/demo'],
      ['POST', '/demo/demo.css'],
      ['POST', '/demo/fixture/index.json'],
      ['PUT', '/demo/feedback/inbox.json'],
      ['DELETE', '/demo/feedback/inbox.json'],
      ['PUT', '/demo/journal.jsonl'],
      ['DELETE', '/demo/journal.jsonl']
    ]) {
      const res = await httpFetch(base, route, { method });
      assert.equal(res.status, 405, `${method} ${route}`);
      assert.equal(res.headers.get('allow'), 'GET, HEAD', `${method} ${route}`);
    }
  });
});

test('POST /demo/feedback and POST /demo/mutate append one journal line and return the entry', async () => {
  await withServer(async (base, staticRoot) => {
    const journalPath = path.join(staticRoot, 'demo', 'journal.jsonl');
    const inboxPath = path.join(staticRoot, 'demo', 'feedback', 'inbox.json');
    const journalLines = raw => raw.split(/\r?\n/).filter(line => line.trim().length > 0);
    const before = journalLines(readFileSync(journalPath, 'utf8')).length;
    const inboxBefore = JSON.parse(readFileSync(inboxPath, 'utf8')).length;
    const res = await httpFetch(base, '/demo/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ round: 'r-acceptance-1', approveAll: false, verdicts: [{ itemId: 'tab-today', verdict: 'approve' }] })
    });
    assert.equal(res.status, 200);
    const round = await res.json();
    assert.equal(round.round, 'r-acceptance-1');
    assert.equal(round.approveAll, false);
    assert.equal(Array.isArray(round.verdicts), true);
    assert.equal(typeof round.receivedAt, 'string');

    // The journal grew by exactly one line; the stored entry matches the echo.
    const lines = journalLines(readFileSync(journalPath, 'utf8'));
    assert.equal(lines.length, before + 1);
    const stored = JSON.parse(lines.at(-1));
    assert.equal(stored.round, 'r-acceptance-1');
    assert.equal(stored.approveAll, false);
    assert.deepEqual(stored.verdicts, [{ itemId: 'tab-today', verdict: 'approve' }]);
    assert.equal(typeof stored.receivedAt, 'string');

    // POST /demo/mutate routes to the same append-only handler (one file, one line per entry).
    const mutate = await httpFetch(base, '/demo/mutate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, actor: 'owner-browser', kind: 'chat-send', text: 'acceptance probe' })
    });
    assert.equal(mutate.status, 200);
    const entry = await mutate.json();
    assert.equal(entry.kind, 'chat-send');
    assert.equal(typeof entry.receivedAt, 'string');
    const linesAfterMutate = journalLines(readFileSync(journalPath, 'utf8'));
    assert.equal(linesAfterMutate.length, before + 2);
    assert.equal(JSON.parse(linesAfterMutate.at(-1)).text, 'acceptance probe');

    // The journal is readable back as a static asset (server.mjs ASSETS/MIME).
    const readback = await httpFetch(base, '/demo/journal.jsonl');
    assert.equal(readback.status, 200);
    assert.match(readback.headers.get('content-type') || '', /application\/jsonl/);
    assert.equal(journalLines(await readback.text()).length, before + 2);

    // The legacy inbox snapshot is still served as a static asset, frozen (no RMW writes).
    const legacy = await httpFetch(base, '/demo/feedback/inbox.json');
    assert.equal(legacy.status, 200);
    const arr = await legacy.json();
    assert.equal(Array.isArray(arr), true);
    assert.equal(arr.length, inboxBefore);

    // Malformed body is rejected, not persisted.
    const bad = await httpFetch(base, '/demo/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json'
    });
    assert.equal(bad.status, 400);
    assert.equal(journalLines(readFileSync(journalPath, 'utf8')).length, before + 2);
  });
});
