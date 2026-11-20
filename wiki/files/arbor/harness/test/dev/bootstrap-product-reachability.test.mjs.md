# File: harness/test/dev/bootstrap-product-reachability.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/dev/bootstrap-product-reachability.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2756 B |
| Lines | 64 |
| Hash | 97ad83ffc113 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| modulePath | const | 11 | no | const modulePath = fileURLToPath(new URL(&#39;../../src/dev/bootstrap.mjs&#39;, import.meta.url)); |
| calls | const | 14 | no | const calls = []; |
| router | const | 15 | no | const router = { |
| approvals | const | 19 | no | const approvals = { |
| scheduler | const | 23 | no | const scheduler = createBootstrapScheduler({ token: &#39;x&#39;.repeat(32), router, approvals }); |
| calls | const | 29 | no | const calls = []; |
| scheduler | const | 30 | no | const scheduler = createBootstrapScheduler({ hostUrl: &#39;http://127.0.0.1:43187/&#39;, fetchImpl: async (url, init) =&gt; { calls.push({ url: String(url), method: init?.method ?? &#39;GET&#39; }); return { ok: true, … |
| state | const | 37 | no | const state = await scheduler.status(); |
| env | const | 43 | no | const env = { ...process.env }; |
| run | const | 45 | no | const run = spawnSync(process.execPath, [modulePath], { encoding: &#39;utf8&#39;, env }); |
| src | const | 51 | no | const src = await readFile(modulePath, &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs/promises | import | 6 | external |
| node:child_process | import | 7 | external |
| node:url | import | 8 | external |
| ../../src/dev/bootstrap.mjs | import | 9 | [harness/src/dev/bootstrap.mjs](../../src/dev/bootstrap.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// The harness bootstrap module is a local development helper, not a product dependency.
// These tests pin the boundary: it only reads Host state, it can never grant, approve,
// send or ingest, and it keeps no second orchestration path beside the Host scheduler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createBootstrapScheduler } from '../../src/dev/bootstrap.mjs';

const modulePath = fileURLToPath(new URL('../../src/dev/bootstrap.mjs', import.meta.url));

test('runPasses is fail-closed and never touches a router or approval store', async () => {
  const calls = [];
  const router = {
    async ask() { calls.push('ask'); return { requestId: 'req-1' }; },
    async wait() { calls.push('wait'); return null; },
  };
  const approvals = {
    async pending() { calls.push('pending'); return true; },
    async approve() { calls.push('approve'); },
  };
  const scheduler = createBootstrapScheduler({ token: 'x'.repeat(32), router, approvals });
  await assert.rejects(scheduler.runPasses({ router, approvals }), err => err.code === 'BOOTSTRAP_SCHEDULER_DISABLED');
  assert.deepEqual(calls, [], 'no send, wait or self-approval may be attempted');
});

test('status reads the existing Host bootstrap endpoint and nothing else', async () => {
  const calls = [];
  const scheduler = createBootstrapScheduler({
    hostUrl: 'http://127.0.0.1:43187/',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? 'GET' });
      return { ok: true, status: 200, json: async () => ({ state: 'ready', phase: 'ready' }) };
    },
  });
  const state = await scheduler.status();
  assert.equal(state.phase, 'ready');
  assert.deepEqual(calls, [{ url: 'http://127.0.0.1:43187/api/host/bootstrap/status', method: 'GET' }]);
});

test('direct execution fails closed instead of starting an orchestration', () => {
  const env = { ...process.env };
  delete env.BOOTSTRAP_SKIP_MAIN;
  const run = spawnSync(process.execPath, [modulePath], { encoding: 'utf8', env });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /BOOTSTRAP_SCHEDULER_DISABLED/);
});

test('the dev helper keeps no grant, approve, send or ingest path', async () => {
  const src = await readFile(modulePath, 'utf8');
  for (const forbidden of [
    'createRouter',
    'createApprovals',
    'router.ask',
    'approvals.approve',
    '/api/host/bootstrap/grant',
    '/api/host/bootstrap/f01',
    '/api/host/bootstrap/f02',
    '/api/host/bootstrap/pass',
  ]) {
    assert.equal(src.includes(forbidden), false, `dev bootstrap must not contain ${forbidden}`);
  }
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
