# File: apps/vivim-host/test/chat-box-baseline.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/chat-box-baseline.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9062 B |
| Lines | 171 |
| Hash | d572521f20d5 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| request | function | 14 | no | async function request(base, route, opts = {}) { |
| u | const | 16 | no | const u = new URL(base + route); |
| req | const | 17 | no | const req = httpRequest({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: opts.method \|\| &#39;GET&#39;, headers: opts.headers \|\| {} }, res =&gt; { const chunks = []; |
| chunks | const | 21 | no | const chunks = []; |
| text | const | 24 | no | const text = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| withHost | function | 34 | no | async function withHost(fn) { |
| dataRoot | const | 35 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-chat-baseline-&#39;)); |
| ownerToken | const | 40 | no | const ownerToken = randomBytes(32).toString(&#39;hex&#39;); |
| server | const | 41 | no | const server = createHostServer({ dataRoot, autoPump: false, ownerToken }); |
| post | function | 57 | no | const post = (base, body, headers = {}) =&gt; request(base, &#39;/api/mutate&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, ...headers }, body }); |
| page | const | 64 | no | const page = await request(base, route); |
| state | const | 82 | no | const state = (await request(base, &#39;/api/state&#39;)).json(); |
| wiki | const | 83 | no | const wiki = (await request(base, &#39;/api/wiki&#39;)).json(); |
| sent | const | 94 | no | const sent = await post(base, { kind: &#39;chat-send&#39;, actor, schemaVersion: 1, text: &#39;hello from &#39; + actor }); |
| messages | const | 101 | no | const messages = (await request(base, &#39;/api/state&#39;)).json().chat; |
| cases | const | 110 | no | const cases = [ |
| wiki | const | 124 | no | const wiki = (await request(base, &#39;/api/wiki&#39;)).json(); |
| edit | const | 125 | no | const edit = { kind: &#39;wiki-edit&#39;, actor: &#39;owner-browser&#39;, schemaVersion: 1, |
| projected | const | 140 | no | const projected = (await request(base, &#39;/api/wiki&#39;)).json(); |
| catalog | const | 147 | no | const catalog = loadControlCatalog(); |
| ids | const | 149 | no | const ids = new Set(catalog.actions.map(x =&gt; x.id)); |
| headers | const | 159 | no | const headers = { &#39;content-type&#39;: &#39;application/json&#39;, origin: base, &#39;x-vivim-control&#39;: &#39;1&#39;, |
| feedback | const | 161 | no | const feedback = { kind: &#39;feedback-round&#39;, schemaVersion: 1, actor: &#39;loop-agent&#39;, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:http | import | 6 | external |
| node:fs | import | 7 | external |
| node:crypto | import | 8 | external |
| node:os | import | 9 | external |
| node:path | import | 10 | external |
| ../server.mjs | import | 11 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../control/intent-planner.mjs | import | 12 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 172 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
