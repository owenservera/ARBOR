# File: apps/vivim-host/test/product-routes.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/product-routes.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16781 B |
| Lines | 291 |
| Hash | 9d1527f7f009 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| httpFetch | function | 10 | no | function httpFetch(base, route, opts = {}) { |
| url | const | 12 | no | const url = new URL(base + route); |
| req | const | 13 | no | const req = httpRequest({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: opts.method \|\| &#39;GET&#39;, headers: opts.headers \|\| {} }, res =&gt; { const chunks = []; |
| chunks | const | 17 | no | const chunks = []; |
| body | const | 20 | no | const body = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| testDir | const | 41 | no | const testDir = typeof __dirname === &#39;string&#39; |
| realPagesDir | const | 44 | no | const realPagesDir = path.resolve(testDir, &#39;..&#39;, &#39;public&#39;, &#39;pages&#39;); |
| makeStaticRoot | function | 47 | no | function makeStaticRoot() { |
| root | const | 48 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-product-routes-&#39;)); |
| dataRoot | const | 59 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-product-routes-data-&#39;)); |
| staticRoot | const | 60 | no | const staticRoot = makeStaticRoot(); |
| token | const | 61 | no | const token = &#39;lane-a-test-owner-token-value-12345678901234567890&#39;; |
| server | const | 62 | no | const server = createHostServer({ dataRoot, staticRoot, ownerToken: token, developmentSources: { approvedRoots: [] } }); |
| base | const | 65 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| chat | const | 68 | no | const chat = await httpFetch(base, &#39;/chat&#39;); |
| wiki | const | 72 | no | const wiki = await httpFetch(base, &#39;/wiki&#39;); |
| res | const | 77 | no | const res = await httpFetch(base, &#39;/&#39; + name); |
| contextUrl | const | 82 | no | const contextUrl = &#39;/api/host/control/wiki-context&#39;; |
| state | const | 92 | no | const state = await httpFetch(base, &#39;/api/state&#39;); |
| stateJson | const | 95 | no | const stateJson = await state.json(); |
| wikiApi | const | 99 | no | const wikiApi = await httpFetch(base, &#39;/api/wiki&#39;); |
| wikiJson | const | 101 | no | const wikiJson = await wikiApi.json(); |
| mainSections | const | 103 | no | const mainSections = wikiJson.pages &amp;&amp; wikiJson.pages.Main &amp;&amp; wikiJson.pages.Main.sections; |
| surface | const | 109 | no | const surface = await httpFetch(base, &#39;/api/file-surface&#39;, { headers: { authorization: &#39;Bearer &#39; + token } }); |
| journalBefore | const | 122 | no | const journalBefore = await httpFetch(base, &#39;/api/journal&#39;); |
| mutate | const | 128 | no | const mutate = await httpFetch(base, &#39;/api/mutate&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ schemaVersion: 1, actor: &#39;loop-agent&#39;, kind: &#39;chat-send&#39;,… |
| stored | const | 134 | no | const stored = await mutate.json(); |
| journalAfter | const | 139 | no | const journalAfter = await httpFetch(base, &#39;/api/journal&#39;); |
| entries | const | 141 | no | const entries = await journalAfter.json(); |
| stateAfter | const | 145 | no | const stateAfter = await (await httpFetch(base, &#39;/api/state&#39;)).json(); |
| beforeEdit | const | 147 | no | const beforeEdit = await (await httpFetch(base, &#39;/api/wiki&#39;)).json(); |
| editor | const | 148 | no | const editor = { |
| mutationHeaders | const | 153 | no | const mutationHeaders = { &#39;content-type&#39;: &#39;application/json&#39;, origin: base, &#39;x-vivim-control&#39;: &#39;1&#39; }; |
| sendEdit | function | 154 | no | const sendEdit = (payload, headers = mutationHeaders) =&gt; httpFetch(base, &#39;/api/mutate&#39;, { method: &#39;POST&#39;, headers, body: JSON.stringify(payload) }); |
| afterEdit | const | 169 | no | const afterEdit = await (await httpFetch(base, &#39;/api/wiki&#39;)).json(); |
| issued | const | 175 | no | const issued = await httpFetch(base, &#39;/api/host/control/ui-session&#39;, { method: &#39;POST&#39;, headers: { ...mutationHeaders, authorization: &#39;Bearer &#39; + token } }); |
| code | const | 179 | no | const code = (await issued.json()).code; |
| exchanged | const | 180 | no | const exchanged = await httpFetch(base, &#39;/api/host/control/ui-exchange&#39;, { method: &#39;POST&#39;, headers: mutationHeaders, body: JSON.stringify({ code }) }); |
| session | const | 185 | no | const session = await exchanged.json(); |
| cookie | const | 186 | no | const cookie = String(exchanged.headers.get(&#39;set-cookie&#39;)).split(&#39;;&#39;)[0]; |
| nlSentence | const | 190 | no | const nlSentence = &#39;edit wiki section main/about saying Voice notes are now our active priority&#39;; |
| interpretHeaders | const | 191 | no | const interpretHeaders = { ...mutationHeaders, cookie, &#39;x-vivim-ui-csrf&#39;: session.csrf }; |
| noOwnerInterpret | const | 192 | no | const noOwnerInterpret = await httpFetch(base, &#39;/api/host/control/interpret&#39;, { method: &#39;POST&#39;, headers: mutationHeaders, body: JSON.stringify({ text: nlSentence }) }); |
| journalBeforeInterpret | const | 196 | no | const journalBeforeInterpret = await (await httpFetch(base, &#39;/api/journal&#39;)).json(); |
| interpreted | const | 197 | no | const interpreted = await httpFetch(base, &#39;/api/host/control/interpret&#39;, { method: &#39;POST&#39;, headers: interpretHeaders, body: JSON.stringify({ text: nlSentence }) }); |
| typedMeaning | const | 201 | no | const typedMeaning = await interpreted.json(); |
| next | const | 211 | no | const next = { ...editor, expectedRevision: afterEdit.revision, |
| loggedOut | const | 217 | no | const loggedOut = await httpFetch(base, &#39;/api/host/control/ui-logout&#39;, { method: &#39;POST&#39;, headers: { ...mutationHeaders, cookie, &#39;x-vivim-ui-csrf&#39;: session.csrf } }); |
| revoked | const | 223 | no | const revoked = { ...next, expectedRevision: afterEdit.revision + 1 }; |
| gate | const | 228 | no | const gate = { schemaVersion: 1, actor: &#39;keeper&#39;, kind: &#39;gate-decision&#39;, |
| journalFinal | const | 236 | no | const journalFinal = await (await httpFetch(base, &#39;/api/journal&#39;)).json(); |
| rawFinal | const | 237 | no | const rawFinal = await (await httpFetch(base, &#39;/api/journal?format=jsonl&#39;)).text(); |
| stateFinal | const | 240 | no | const stateFinal = await (await httpFetch(base, &#39;/api/state&#39;)).json(); |
| wikiFinal | const | 241 | no | const wikiFinal = await (await httpFetch(base, &#39;/api/wiki&#39;)).json(); |
| parallelEdit | const | 247 | no | const parallelEdit = { ...editor, expectedRevision: wikiFinal.revision }; |
| race | const | 248 | no | const race = await Promise.all([sendEdit(parallelEdit, { ...mutationHeaders, authorization: &#39;Bearer &#39; + token }), sendEdit(parallelEdit, { ...mutationHeaders, authorization: &#39;Bearer &#39; + token })]); |
| wikiBeforeContext | const | 255 | no | const wikiBeforeContext = await (await httpFetch(base, &#39;/api/wiki&#39;)).json(); |
| userPost | const | 256 | no | const userPost = await httpFetch(base, &#39;/api/mutate&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ schemaVersion: 1, actor: &#39;human&#39;, kind: &#39;chat-send&#39;, te… |
| userEntry | const | 262 | no | const userEntry = await userPost.json(); |
| contextJson | const | 263 | no | const contextJson = await (await httpFetch(base, contextUrl, { headers: { authorization: &#39;Bearer &#39; + token } })).json(); |
| wikiAfterContext | const | 279 | no | const wikiAfterContext = await (await httpFetch(base, &#39;/api/wiki&#39;)).json(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| node:http | import | 9 | external |
| node:fs | import | 35 | external |
| node:os | import | 36 | external |
| node:path | import | 37 | external |
| node:url | import | 38 | external |
| ../server.mjs | import | 39 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 292 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
