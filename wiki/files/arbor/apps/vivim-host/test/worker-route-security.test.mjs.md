# File: apps/vivim-host/test/worker-route-security.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/worker-route-security.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2356 B |
| Lines | 35 |
| Hash | 6b6769b4490f |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 11 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-worker-security-&#39;)); |
| token | const | 12 | no | const token = &#39;fixed-test-owner-capability-&#39;.repeat(2); |
| worker | const | 13 | no | const worker = createWorkerSupervisor({ dataRoot: root }); |
| server | const | 15 | no | const server = createHostServer({ dataRoot: root, ownerToken: token }); |
| base | const | 18 | no | const base = `http://127.0.0.1:${server.address().port}`; |
| url | const | 19 | no | const url = base + &#39;/api/host/worker/bootstrap/recover&#39;; |
| status | const | 20 | no | const status = base + &#39;/api/host/worker/bootstrap/status&#39;; |
| auth | const | 21 | no | const auth = { authorization: &#39;Bearer &#39; + token }; |
| refused | const | 29 | no | const refused = await fetch(url, { method: &#39;POST&#39;, headers: { ...auth, origin: base, &#39;x-vivim-control&#39;: &#39;1&#39; } }); |
| body | const | 31 | no | const body = await refused.json(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../server.mjs | import | 6 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../bootstrap/worker-supervisor.mjs | import | 7 | [apps/vivim-host/bootstrap/worker-supervisor.mjs](../bootstrap/worker-supervisor.mjs.md) |

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
import { createHostServer } from '../server.mjs';
import { createWorkerSupervisor } from '../bootstrap/worker-supervisor.mjs';

// Negative HTTP regression: localhost alone grants no process/lease mutation.
test('legacy worker recover requires owner proof and remains non-executable', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-worker-security-'));
  const token = 'fixed-test-owner-capability-'.repeat(2);
  const worker = createWorkerSupervisor({ dataRoot: root });
  worker.takeover('bootstrap', process.pid);
  const server = createHostServer({ dataRoot: root, ownerToken: token });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); rmSync(root, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const url = base + '/api/host/worker/bootstrap/recover';
  const status = base + '/api/host/worker/bootstrap/status';
  const auth = { authorization: 'Bearer ' + token };
  assert.equal((await fetch(base + '/api/host/worker/InvalidRole/status')).status, 400);
  assert.equal((await fetch(status)).status, 401);
  assert.equal((await fetch(status, { headers: { ...auth, origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await fetch(status, { headers: auth })).status, 200);
  assert.equal((await fetch(url, { method: 'POST' })).status, 403);
  assert.equal((await fetch(url, { method: 'POST', headers: { ...auth, origin: 'https://untrusted.example', 'x-vivim-control': '1' } })).status, 403);
  assert.equal((await fetch(url, { method: 'POST', headers: { origin: base, 'x-vivim-control': '1', authorization: 'Bearer invalid' } })).status, 401);
  const refused = await fetch(url, { method: 'POST', headers: { ...auth, origin: base, 'x-vivim-control': '1' } });
  assert.equal(refused.status, 409);
  const body = await refused.json();
  assert.equal(body.code, 'CONTROL_ACTION_PLAN_REQUIRED');
  assert.equal(body.executionPerformed, false);
  assert.equal(worker.status('bootstrap').state, 'online', 'refusal preserves the live worker lease');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
