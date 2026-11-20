# File: apps/vivim-host/bootstrap/web-memory-auth.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/web-memory-auth.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2711 B |
| Lines | 60 |
| Hash | 41b18cb2e5ae |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 10 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-memory-auth-&#39;)); |
| ownerToken | const | 12 | no | const ownerToken = &#39;test-owner-token-abcdefghijklmnopqrstuvwxyz0123456789&#39;; |
| calls | variable | 13 | no | let calls = 0; |
| host | const | 14 | no | const host = createHostServer({ dataRoot: root, ownerToken, bootstrap: { worldId: &#39;world-local&#39;, webMemory: async () =&gt; { calls++; return { schema: &#39;vivim.web-memory-view/1&#39;, state: &#39;bridge-unavailab… |
| base | const | 22 | no | const base = &#39;http://127.0.0.1:&#39; + host.address().port; |
| endpoint | const | 23 | no | const endpoint = base + &#39;/api/host/control/web-memory&#39;; |
| auth | const | 24 | no | const auth = { authorization: &#39;Bearer &#39; + ownerToken }; |
| response | variable | 26 | no | let response = await fetch(endpoint); |
| launch | const | 48 | no | const launch = await response.json(); |
| cookie | const | 55 | no | const cookie = response.headers.get(&#39;set-cookie&#39;)?.split(&#39;;&#39;)[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:events | import | 6 | external |
| ../server.mjs | import | 7 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createHostServer } from '../server.mjs';

test('private Host web memory refuses anonymous/LAN-origin requests and supports owner UI session', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-memory-auth-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const ownerToken = 'test-owner-token-abcdefghijklmnopqrstuvwxyz0123456789';
  let calls = 0;
  const host = createHostServer({ dataRoot: root, ownerToken, bootstrap: {
    worldId: 'world-local',
    webMemory: async () => { calls++; return { schema: 'vivim.web-memory-view/1',
      state: 'bridge-unavailable', coverage: 'not_connected', items: [] }; }
  } });
  host.listen(0, '127.0.0.1');
  await once(host, 'listening');
  t.after(async () => { await new Promise(resolve => host.close(resolve)); });
  const base = 'http://127.0.0.1:' + host.address().port;
  const endpoint = base + '/api/host/control/web-memory';
  const auth = { authorization: 'Bearer ' + ownerToken };

  let response = await fetch(endpoint);
  assert.equal(response.status, 401);
  assert.equal(calls, 0);

  response = await fetch(endpoint, { headers: { ...auth, origin: 'https://untrusted.example' } });
  assert.equal(response.status, 403);
  assert.equal(calls, 0);

  response = await fetch(endpoint + '?unknown=1', { headers: auth });
  assert.equal(response.status, 400);
  assert.equal(calls, 0);

  response = await fetch(endpoint + '?limit=20', { headers: auth });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).schema, 'vivim.web-memory-view/1');
  assert.equal(calls, 1);

  // Browser capability remains HttpOnly and scoped to the existing /api/host/control path.
  response = await fetch(base + '/api/host/control/ui-session', {
    method: 'POST', headers: { ...auth, origin: base, 'x-vivim-control': '1' }
  });
  assert.equal(response.status, 201);
  const launch = await response.json();
  response = await fetch(base + '/api/host/control/ui-exchange', {
    method: 'POST',
    headers: { origin: base, 'content-type': 'application/json', 'x-vivim-control': '1' },
    body: JSON.stringify({ code: launch.code })
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie?.startsWith('vivim_control_ui='));
  response = await fetch(endpoint, { headers: { cookie } });
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
