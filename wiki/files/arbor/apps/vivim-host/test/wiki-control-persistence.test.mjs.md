# File: apps/vivim-host/test/wiki-control-persistence.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/wiki-control-persistence.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6835 B |
| Lines | 136 |
| Hash | 2edff76f5d4f |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dataRoot | const | 11 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-wiki-control-&#39;)); |
| ownerToken | const | 12 | no | const ownerToken = &#39;wiki-owner-test-token-&#39;.repeat(3); |
| server | variable | 13 | no | let server = null; |
| start | function | 14 | no | const start = async () =&gt; { |
| instance | const | 15 | no | const instance = createHostServer({ dataRoot, ownerToken, autoPump: false }); |
| stop | function | 22 | no | const stop = async () =&gt; { |
| request | function | 31 | no | const request = (url, { method = &#39;GET&#39;, headers = {}, body } = {}) =&gt; new Promise((resolve, reject) =&gt; { const req = http.request({ hostname: &#39;127.0.0.1&#39;, port: server.address().port, path: url, meth… |
| req | const | 32 | no | const req = http.request({ hostname: &#39;127.0.0.1&#39;, port: server.address().port, path: url, method, headers: { host: &#39;localhost&#39;, ...headers } }, res =&gt; { const chunks = []; |
| chunks | const | 36 | no | const chunks = []; |
| raw | const | 39 | no | const raw = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| json | variable | 40 | no | let json = null; |
| bearer | const | 48 | no | const bearer = { authorization: &#39;Bearer &#39; + ownerToken }; |
| desktop | const | 49 | no | const desktop = { ...bearer, origin: &#39;http://localhost&#39;, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39; }; |
| post | function | 50 | no | const post = (url, headers, body) =&gt; request(url, { method: &#39;POST&#39;, headers, body: JSON.stringify(body) }); |
| plan | function | 51 | no | const plan = body =&gt; post(&#39;/api/host/control/plan&#39;, desktop, body); |
| execute | function | 52 | no | const execute = body =&gt; post(&#39;/api/host/control/execute&#39;, desktop, body); |
| wiki | function | 53 | no | const wiki = async () =&gt; { |
| response | const | 54 | no | const response = await request(&#39;/api/wiki&#39;); |
| records | function | 58 | no | const records = async () =&gt; { |
| response | const | 59 | no | const response = await request(&#39;/api/journal&#39;); |
| before | const | 66 | no | const before = await wiki(); |
| original | const | 67 | no | const original = before.pages.Main.sections.About; |
| text | const | 68 | no | const text = &#39;Updated from VIVIM&#39;; |
| proposed | const | 69 | no | const proposed = await plan({ text: &#39;edit wiki section main/about saying &#39; + text }); |
| unknown | const | 80 | no | const unknown = await plan({ actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;Main/NoSuchSection&#39;, content: &#39;must not create a section&#39; } }); |
| approval | const | 86 | no | const approval = { planId: proposed.json.planId, planDigest: proposed.json.planDigest }; |
| applied | const | 94 | no | const applied = await execute(approval); |
| after | const | 100 | no | const after = await wiki(); |
| replay | const | 105 | no | const replay = await execute(approval); |
| stale | const | 112 | no | const stale = await plan({ actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;Main/About&#39;, content: &#39;stale overwrite&#39; } }); |
| current | const | 114 | no | const current = await plan({ actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;Main/About&#39;, content: &#39;Latest approved revision&#39; } }); |
| staleAttempt | const | 121 | no | const staleAttempt = await execute({ planId: stale.json.planId, planDigest: stale.json.planDigest }); |
| committedRevision | const | 128 | no | const committedRevision = (await wiki()).revision; |
| restored | const | 131 | no | const restored = await wiki(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:http | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../server.mjs | import | 7 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';

// Actual Host HTTP routes and actual persistent product/control journals; no mock Wiki writer.
test('natural-language Wiki edit: approval, CAS, once-only append and persistent readback', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-wiki-control-'));
  const ownerToken = 'wiki-owner-test-token-'.repeat(3);
  let server = null;
  const start = async () => {
    const instance = createHostServer({ dataRoot, ownerToken, autoPump: false });
    await new Promise((resolve, reject) => {
      instance.once('error', reject);
      instance.listen(0, '127.0.0.1', resolve);
    });
    server = instance;
  };
  const stop = async () => {
    if (server?.listening) await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    server = null;
  };
  t.after(async () => {
    await stop();
    try { rmSync(dataRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 }); }
    catch { /* SQLite handles may linger on Windows. Do not hide an assertion failure. */ }
  });
  const request = (url, { method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port: server.address().port, path: url, method,
      headers: { host: 'localhost', ...headers }
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, json, raw });
      });
    });
    req.on('error', reject);
    req.end(body);
  });
  const bearer = { authorization: 'Bearer ' + ownerToken };
  const desktop = { ...bearer, origin: 'http://localhost', 'x-vivim-control': '1', 'content-type': 'application/json' };
  const post = (url, headers, body) => request(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const plan = body => post('/api/host/control/plan', desktop, body);
  const execute = body => post('/api/host/control/execute', desktop, body);
  const wiki = async () => {
    const response = await request('/api/wiki');
    assert.equal(response.status, 200);
    return response.json;
  };
  const records = async () => {
    const response = await request('/api/journal');
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.json));
    return response.json;
  };

  await start();
  const before = await wiki();
  const original = before.pages.Main.sections.About;
  const text = 'Updated from VIVIM';
  const proposed = await plan({ text: 'edit wiki section main/about saying ' + text });
  assert.equal(proposed.status, 200, JSON.stringify(proposed.json));
  assert.equal(proposed.json.actionId, 'wiki.section.edit');
  assert.equal(proposed.json.outcome, 'approval_required');
  assert.equal(proposed.json.executionPerformed, false);
  assert.deepEqual(proposed.json.preview, {
    target: 'Main/About', before: original, after: text, expectedRevision: before.revision
  });
  assert.deepEqual(await wiki(), before, 'planning and preview must never modify the Wiki');
  assert.equal((await records()).filter(e => e.kind === 'wiki-edit').length, 0);

  const unknown = await plan({ actionId: 'wiki.section.edit',
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
