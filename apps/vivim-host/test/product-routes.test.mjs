// Batch-1 product routes (oracle ack2) — /chat /wiki pages, /api/state|wiki|file-surface
// owner initialization and canonical /api/journal reads, POST /api/mutate append.
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

// Serve only real page assets in the isolated Host test.
function makeStaticRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-product-routes-'));
  mkdirSync(path.join(root, 'pages'), { recursive: true });
  copyFileSync(path.join(realPagesDir, 'chat.html'), path.join(root, 'pages', 'chat.html'));
  copyFileSync(path.join(realPagesDir, 'wiki.html'), path.join(root, 'pages', 'wiki.html'));
  for (const name of ['chat.js', 'wiki.js', 'chat.css', 'wiki.css']) {
    copyFileSync(path.join(realPagesDir, name), path.join(root, 'pages', name));
  }
  return root;
}

test('batch-1 product routes: pages, baseline JSON, read-throughs, mutate append, 404 tail', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-product-routes-data-'));
  const staticRoot = makeStaticRoot();
  const token = 'lane-a-test-owner-token-value-12345678901234567890';
  const server = createHostServer({ dataRoot, staticRoot, ownerToken: token, developmentSources: { approvedRoots: [] } });
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
    for (const name of ['chat.js', 'wiki.js', 'chat.css', 'wiki.css']) {
      const res = await httpFetch(base, '/' + name);
      assert.equal(res.status, 200, name + ' external CSP asset');
    }

    // Context read is owner-private despite public Wiki seed reads.
    const contextUrl = '/api/host/control/wiki-context';
    assert.equal((await httpFetch(base, contextUrl)).status, 401);
    assert.equal((await httpFetch(base, contextUrl, { headers: { authorization: 'Bearer incorrect' } })).status, 401);
    assert.equal((await httpFetch(base, contextUrl, { headers: {
      authorization: 'Bearer ' + token, origin: 'http://evil.invalid'
    } })).status, 403);
    assert.equal((await httpFetch(base, contextUrl, { headers: { authorization: 'Bearer ' + token } })).status, 200);

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

    // Development source is owner-private. A missing HQ configuration is
    // unavailable, never the historic demo corpus.
    assert.equal((await httpFetch(base, '/api/file-surface')).status, 401);
    const surface = await httpFetch(base, '/api/file-surface', {
      headers: { authorization: 'Bearer ' + token }
    });
    assert.equal(surface.status, 503);
    assert.match(surface.headers.get('content-type') || '', /application\/json/);
    assert.deepEqual((await surface.json()).files, []);

    // Historical development documents are no longer a live product source.
    assert.equal((await httpFetch(base, '/api/roadmap')).status, 404);
    assert.deepEqual(mainSections, { About: '', HowTo: '', Sources: '' });
    assert.deepEqual(Object.keys(wikiJson.pages), ['Main']);

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
    const stateAfter = await (await httpFetch(base, '/api/state')).json();
    assert.ok(stateAfter.chat.some(m => m.text === 'product-routes test line'), 'journal projected into chat');
    const beforeEdit = await (await httpFetch(base, '/api/wiki')).json();
    const editor = {
      schemaVersion: 1, actor: 'owner-browser', kind: 'wiki-edit',
      expectedRevision: beforeEdit.revision,
      edit: { action: 'set-section', page: 'Main', section: 'HowTo', content: 'edited through Host' }
    };
    const mutationHeaders = { 'content-type': 'application/json', origin: base, 'x-vivim-control': '1' };
    const sendEdit = (payload, headers = mutationHeaders) => httpFetch(base, '/api/mutate', {
      method: 'POST', headers, body: JSON.stringify(payload)
    });

    // Self-declared actors, Origin and a custom header are NOT owner grants.
    assert.equal((await sendEdit(editor)).status, 401, 'actor/header spoof alone refused');
    assert.equal((await sendEdit(editor, { ...mutationHeaders, authorization: 'Bearer incorrect' })).status, 401);
    assert.equal((await sendEdit(editor, { ...mutationHeaders, origin: 'http://evil.invalid',
      authorization: 'Bearer ' + token })).status, 403);
    assert.equal((await sendEdit({ ...editor, path: '../escape' },
      { ...mutationHeaders, authorization: 'Bearer ' + token })).status, 400);
    assert.equal((await sendEdit(editor, { ...mutationHeaders,
      authorization: 'Bearer ' + token })).status, 200, 'owner token permits bounded Wiki edit');
    assert.equal((await sendEdit(editor, { ...mutationHeaders,
      authorization: 'Bearer ' + token })).status, 409, 'stale Wiki revision rejected');
    const afterEdit = await (await httpFetch(base, '/api/wiki')).json();
    assert.equal(afterEdit.pages.Main.sections.HowTo, editor.edit.content);
    assert.equal(afterEdit.revision, beforeEdit.revision + 1);

    // The existing one-time Host control session can authenticate /api/mutate.
    // Its HttpOnly cookie is scoped to /api, not only /api/host/control.
    const issued = await httpFetch(base, '/api/host/control/ui-session', {
      method: 'POST', headers: { ...mutationHeaders, authorization: 'Bearer ' + token }
    });
    assert.equal(issued.status, 201);
    const code = (await issued.json()).code;
    const exchanged = await httpFetch(base, '/api/host/control/ui-exchange', {
      method: 'POST', headers: mutationHeaders, body: JSON.stringify({ code })
    });
    assert.equal(exchanged.status, 200);
    assert.match(String(exchanged.headers.get('set-cookie')), /HttpOnly; SameSite=Strict; Path=\/api;/);
    const session = await exchanged.json();
    const cookie = String(exchanged.headers.get('set-cookie')).split(';')[0];
    assert.equal((await httpFetch(base, contextUrl, { headers: { cookie } })).status, 200,
      'owner browser cookie may read private context');
    // Host's actual interpreter must return the original Wiki sentence verbatim and never mutate.
    const nlSentence = 'edit wiki section main/about saying Voice notes are now our active priority';
    const interpretHeaders = { ...mutationHeaders, cookie, 'x-vivim-ui-csrf': session.csrf };
    const noOwnerInterpret = await httpFetch(base, '/api/host/control/interpret', {
      method: 'POST', headers: mutationHeaders, body: JSON.stringify({ text: nlSentence })
    });
    assert.equal(noOwnerInterpret.status, 401);
    const journalBeforeInterpret = await (await httpFetch(base, '/api/journal')).json();
    const interpreted = await httpFetch(base, '/api/host/control/interpret', {
      method: 'POST', headers: interpretHeaders, body: JSON.stringify({ text: nlSentence })
    });
    assert.equal(interpreted.status, 200);
    const typedMeaning = await interpreted.json();
    assert.equal(typedMeaning.schema, 'vivim.control-language/1');
    assert.equal(typedMeaning.outcome, 'candidate');
    assert.deepEqual(typedMeaning.candidate, {
      actionId: 'wiki.section.edit',
      args: { target: 'main/about', content: 'Voice notes are now our active priority' }
    });
    assert.deepEqual(await (await httpFetch(base, '/api/journal')).json(), journalBeforeInterpret,
      'interpretation is not a write');

    const next = { ...editor, expectedRevision: afterEdit.revision,
      edit: { ...editor.edit, content: 'owner browser session update' } };
    assert.equal((await sendEdit(next, { ...mutationHeaders, cookie })).status, 401, 'missing session CSRF');
    assert.equal((await sendEdit(next, { ...mutationHeaders, cookie, 'x-vivim-ui-csrf': 'incorrect' })).status, 401);
    assert.equal((await sendEdit(next, { ...mutationHeaders, cookie,
      'x-vivim-ui-csrf': session.csrf })).status, 200);
    const loggedOut = await httpFetch(base, '/api/host/control/ui-logout', {
      method: 'POST', headers: { ...mutationHeaders, cookie, 'x-vivim-ui-csrf': session.csrf }
    });
    assert.equal(loggedOut.status, 200);
    assert.equal((await httpFetch(base, contextUrl, { headers: { cookie } })).status, 401,
      'revoked owner session cannot read context');
    const revoked = { ...next, expectedRevision: afterEdit.revision + 1 };
    assert.equal((await sendEdit(revoked, { ...mutationHeaders, cookie,
      'x-vivim-ui-csrf': session.csrf })).status, 401, 'revoked browser session refused');

    // Neither a demo alias nor an owner token may revive legacy gate writes.
    const gate = { schemaVersion: 1, actor: 'keeper', kind: 'gate-decision',
      itemId: 'CHAT-BOX-BASELINE', decision: 'approve' };
    for (const route of ['/demo/mutate', '/api/mutate']) {
      assert.equal((await httpFetch(base, route, {
        method: 'POST', headers: { ...mutationHeaders, authorization: 'Bearer ' + token },
        body: JSON.stringify(gate)
      })).status, route === '/demo/mutate' ? 404 : 410);
    }
    const journalFinal = await (await httpFetch(base, '/api/journal')).json();
    const rawFinal = await (await httpFetch(base, '/api/journal?format=jsonl')).text();
    assert.equal(journalFinal.length, 3);
    assert.deepEqual(rawFinal.split('\n').filter(Boolean).map(JSON.parse), journalFinal);
    const stateFinal = await (await httpFetch(base, '/api/state')).json();
    const wikiFinal = await (await httpFetch(base, '/api/wiki')).json();
    assert.equal(stateFinal.wikiRevision, wikiFinal.revision);
    assert.equal(stateFinal.revision, 3, 'only chat and Wiki mutations increment product revision');
    assert.equal(wikiFinal.pages.Main.sections.HowTo, 'owner browser session update');

    // Same-revision concurrent HTTP editors: one success, one conflict.
    const parallelEdit = { ...editor, expectedRevision: wikiFinal.revision };
    const race = await Promise.all([sendEdit(parallelEdit, { ...mutationHeaders,
      authorization: 'Bearer ' + token }), sendEdit(parallelEdit, { ...mutationHeaders,
      authorization: 'Bearer ' + token })]);
    assert.deepEqual(race.map(r => r.status).sort(), [200,409]);
    assert.equal((await (await httpFetch(base, '/api/journal')).json()).length, 4);

    // Real HTTP chat append becomes private context without changing the editable Wiki.
    const wikiBeforeContext = await (await httpFetch(base, '/api/wiki')).json();
    const userPost = await httpFetch(base, '/api/mutate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, actor: 'human', kind: 'chat-send',
        text: 'Voice notes to structured tasks' })
    });
    assert.equal(userPost.status, 200);
    const userEntry = await userPost.json();
    const contextJson = await (await httpFetch(base, contextUrl, {
      headers: { authorization: 'Bearer ' + token }
    })).json();
    assert.equal(contextJson.totalObserved, 1);
    assert.equal(contextJson.items[0].entryId, userEntry.entryId);
    assert.equal(contextJson.items[0].text, 'Voice notes to structured tasks');
    // D4: only committed Wiki effects, not refused or interpretation-only attempts.
    assert.equal(contextJson.wikiRevision, wikiBeforeContext.revision);
    assert.equal(contextJson.wikiChanges.total, 3);
    assert.equal(contextJson.wikiChanges.items.filter(x => x.status === 'current-section-revision').length, 1);
    assert.deepEqual(contextJson.wikiChanges.items.at(-1).relationship,
      { kind: 'mutated-section', page: 'Main', section: 'HowTo' });
    assert.equal(contextJson.wikiChanges.items.at(-1).wikiRevision, wikiBeforeContext.revision);
    assert.equal((await httpFetch(base, contextUrl)).status, 401);
    assert.equal(Object.hasOwn(wikiBeforeContext, 'wikiChanges'), false);
    assert.equal(Object.hasOwn(wikiBeforeContext, 'applicationEffects'), false);
    const wikiAfterContext = await (await httpFetch(base, '/api/wiki')).json();
    assert.equal(wikiAfterContext.revision, wikiBeforeContext.revision);
    assert.deepEqual(wikiAfterContext.pages, wikiBeforeContext.pages);

    // Exact-string dispatch only: unknown /api/* paths still 404 (no catch-all).
    assert.equal((await httpFetch(base, '/api/definitely-not-a-route')).status, 404);
    assert.equal((await httpFetch(base, '/api/state/extra')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dataRoot, { recursive: true, force: true });
    rmSync(staticRoot, { recursive: true, force: true });
  }
});
