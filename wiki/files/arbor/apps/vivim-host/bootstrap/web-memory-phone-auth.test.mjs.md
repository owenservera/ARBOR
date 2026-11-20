# File: apps/vivim-host/bootstrap/web-memory-phone-auth.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/web-memory-phone-auth.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1989 B |
| Lines | 45 |
| Hash | f7ce3a9febc1 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dataRoot | const | 11 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-phone-memory-&#39;)); |
| origin | const | 13 | no | const origin = &#39;https://pc.example.ts.net&#39;; |
| user | const | 14 | no | const user = &#39;owner@example.com&#39;; |
| sourceReads | variable | 15 | no | let sourceReads = 0; |
| handler | const | 16 | no | const handler = createDirectPhoneHandler({ origin, user, dataRoot, projection: () =&gt; ({}), webMemory: async () =&gt; { sourceReads++; return { items: [{ url: &#39;https://example.org/&#39; }] }; } }); |
| server | const | 20 | no | const server = http.createServer(handler); |
| url | const | 24 | no | const url = new URL(&#39;http://127.0.0.1:&#39; + server.address().port + &#39;/mobile/api/memory/recent&#39;); |
| trustedProxy | const | 25 | no | const trustedProxy = { host: &#39;pc.example.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, |
| request | function | 27 | no | const request = (headers = {}) =&gt; new Promise((resolve, reject) =&gt; { const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers }, res =&gt; { res.resume… |
| req | const | 28 | no | const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers }, res =&gt; { res.resume(); res.on(&#39;end&#39;, () =&gt; resolve(res)); }); |
| result | variable | 37 | no | let result = await request(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:http | import | 3 | external |
| node:events | import | 4 | external |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |
| ../direct-phone.mjs | import | 8 | [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDirectPhoneHandler } from '../direct-phone.mjs';

test('Direct phone web memory never exposes owner history without a device grant', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-phone-memory-'));
  t.after(() => rmSync(dataRoot, { recursive: true, force: true }));
  const origin = 'https://pc.example.ts.net';
  const user = 'owner@example.com';
  let sourceReads = 0;
  const handler = createDirectPhoneHandler({
    origin, user, dataRoot, projection: () => ({}),
    webMemory: async () => { sourceReads++; return { items: [{ url: 'https://example.org/' }] }; }
  });
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); });
  const url = new URL('http://127.0.0.1:' + server.address().port + '/mobile/api/memory/recent');
  const trustedProxy = { host: 'pc.example.ts.net', 'x-forwarded-proto': 'https',
    'tailscale-user-login': user };
  const request = (headers = {}) => new Promise((resolve, reject) => {
    const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers }, res => {
      res.resume();
      res.on('end', () => resolve(res));
    });
    req.on('error', reject);
    req.end();
  });

  // Arbitrary LAN caller is rejected before any history read.
  let result = await request();
  assert.equal(result.statusCode, 403);
  assert.equal(sourceReads, 0);

  // Even a trusted Tailscale identity has no device-read privilege by itself.
  result = await request(trustedProxy);
  assert.equal(result.statusCode, 401);
  assert.equal(sourceReads, 0);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
