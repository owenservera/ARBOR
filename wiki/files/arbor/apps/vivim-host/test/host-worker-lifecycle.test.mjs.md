# File: apps/vivim-host/test/host-worker-lifecycle.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/host-worker-lifecycle.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9517 B |
| Lines | 196 |
| Hash | 296d6860edd6 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| withRoot | function | 13 | no | const withRoot = async fn =&gt; { |
| root | const | 14 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-worker-lifecycle-&#39;)); |
| ownerToken | const | 17 | no | const ownerToken = &#39;fixed-test-owner-capability-&#39;.repeat(2); |
| DEAD_PID | const | 18 | no | const DEAD_PID = 2147483647; |
| leaseFile | function | 19 | no | const leaseFile = (root, role) =&gt; path.join(root, &#39;bridge&#39;, &#39;supervisor&#39;, `${role}.lease.json`); |
| writeLease | function | 20 | no | function writeLease(root, role, lease) { |
| stubWorker | function | 24 | no | function stubWorker() { |
| state | const | 25 | no | const state = { starts: 0 }; |
| startServer | function | 28 | no | async function startServer(root, worker) { |
| server | const | 29 | no | const server = createHostServer({ dataRoot: root, ownerToken, worker }); |
| status | function | 37 | no | const status = (base, role) =&gt; fetch(`${base}/api/host/worker/${role}/status`, { headers: { authorization: `Bearer ${ownerToken}` } }); |
| first | const | 41 | no | const first = stubWorker(); |
| a | const | 42 | no | const a = await startServer(root, first); |
| second | const | 45 | no | const second = stubWorker(); |
| b | const | 46 | no | const b = await startServer(root, second); |
| res | const | 49 | no | const res = await status(a.base, &#39;bootstrap&#39;); |
| body | const | 51 | no | const body = await res.json(); |
| worker | const | 65 | no | const worker = stubWorker(); |
| host | const | 66 | no | const host = await startServer(root, worker); |
| res | const | 69 | no | const res = await status(host.base, &#39;bootstrap&#39;); |
| body | const | 70 | no | const body = await res.json(); |
| lease | const | 75 | no | const lease = JSON.parse(readFileSync(leaseFile(root, &#39;bootstrap&#39;), &#39;utf8&#39;)); |
| worker | const | 85 | no | const worker = stubWorker(); |
| host | const | 86 | no | const host = await startServer(root, worker); |
| res | const | 89 | no | const res = await status(host.base, &#39;bootstrap&#39;); |
| body | const | 90 | no | const body = await res.json(); |
| s | const | 99 | no | const s = createWorkerSupervisor({ dataRoot: root }); |
| st | variable | 107 | no | let st = s.status(&#39;relay&#39;); |
| beat | const | 112 | no | const beat = createWorkerHeartbeat({ root, worker: &#39;relay&#39;, now: () =&gt; new Date(Date.now() - 60_000).toISOString() }); |
| future | const | 119 | no | const future = createWorkerHeartbeat({ root, worker: &#39;relay&#39;, now: () =&gt; new Date(Date.now() + 60_000).toISOString() }); |
| fresh | const | 125 | no | const fresh = createWorkerHeartbeat({ root, worker: &#39;relay&#39;, now: () =&gt; new Date().toISOString() }); |
| probe | variable | 136 | no | let probe = { state: &#39;unknown&#39;, diagnosticCode: &#39;NO_HEARTBEAT&#39; }; |
| s | const | 137 | no | const s = createWorkerSupervisor({ dataRoot: root, diagnostics: () =&gt; probe }); |
| st | variable | 140 | no | let st = s.status(&#39;bootstrap&#39;); |
| healthyRoot | const | 165 | no | const healthyRoot = root; |
| host | const | 166 | no | const host = await startServer(healthyRoot, null); |
| res | variable | 168 | no | let res = await status(host.base, &#39;relay&#39;); |
| body | variable | 170 | no | let body = await res.json(); |
| beat | const | 175 | no | const beat = createWorkerHeartbeat({ root: healthyRoot, worker: &#39;relay&#39; }); |
| first | const | 187 | no | const first = createWorkerSupervisor({ dataRoot: root }); |
| second | const | 188 | no | const second = createWorkerSupervisor({ dataRoot: root }); |
| out | const | 190 | no | const out = second.takeover(&#39;bootstrap&#39;, process.pid); |
| lease | const | 193 | no | const lease = JSON.parse(readFileSync(leaseFile(root, &#39;bootstrap&#39;), &#39;utf8&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |
| node:path | import | 8 | external |
| ../server.mjs | import | 9 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../bootstrap/worker-supervisor.mjs | import | 10 | [apps/vivim-host/bootstrap/worker-supervisor.mjs](../bootstrap/worker-supervisor.mjs.md) |
| ../../../studio/src/studio/worker-heartbeat.mjs | import | 11 | [studio/src/studio/worker-heartbeat.mjs](../../../studio/src/studio/worker-heartbeat.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// NEXT:B-F01-B14 — Host worker lifecycle and native health feed.
// Proves lease admission precedes the bootstrap poller, uncertain leases are never
// implicitly resumed, and missing native evidence is never reported as a failure.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHostServer } from '../server.mjs';
import { createWorkerSupervisor } from '../bootstrap/worker-supervisor.mjs';
import { createWorkerHeartbeat } from '../../../studio/src/studio/worker-heartbeat.mjs';

const withRoot = async fn => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-worker-lifecycle-'));
  try { return await fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
};
const ownerToken = 'fixed-test-owner-capability-'.repeat(2);
const DEAD_PID = 2147483647;
const leaseFile = (root, role) => path.join(root, 'bridge', 'supervisor', `${role}.lease.json`);
function writeLease(root, role, lease) {
  mkdirSync(path.dirname(leaseFile(root, role)), { recursive: true });
  writeFileSync(leaseFile(root, role), JSON.stringify(lease));
}
function stubWorker() {
  const state = { starts: 0 };
  return { state, start() { state.starts += 1; }, stop() {} };
}
async function startServer(root, worker) {
  const server = createHostServer({ dataRoot: root, ownerToken, worker });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    server,
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}
const status = (base, role) => fetch(`${base}/api/host/worker/${role}/status`, { headers: { authorization: `Bearer ${ownerToken}` } });

test('lease admission precedes the poller; a second live Host never starts a second poller', async () => {
  await withRoot(async root => {
    const first = stubWorker();
    const a = await startServer(root, first);
    try {
      assert.equal(first.state.starts, 1, 'the admitted Host runs the bootstrap poller');
      const second = stubWorker();
      const b = await startServer(root, second);
      try {
        assert.equal(second.state.starts, 0, 'an already-owned role must not start another poller');
        const res = await status(a.base, 'bootstrap');
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.state, 'online');
        assert.equal(body.pid, process.pid, 'the live lease still names the first owner');
        assert.equal(body.evidence.state, 'missing', 'an in-process worker has no heartbeat file yet');
        assert.notEqual(body.evidence.state, 'failed', 'missing evidence is not a failure');
      } finally { await b.close(); }
    } finally { await a.close(); }
  });
});

test('a stale external lease refuses admission and is preserved for owner recovery', async () => {
  await withRoot(async root => {
    writeLease(root, 'bootstrap', { role: 'bootstrap', pid: DEAD_PID, worldId: 'world-local',
      startedAt: new Date().toISOString(), schema: 'vivim.worker-lease/1' });
    const worker = stubWorker();
    const host = await startServer(root, worker);
    try {
      assert.equal(worker.state.starts, 0, 'an uncertain lease is never implicitly resumed');
      const res = await status(host.base, 'bootstrap');
      const body = await res.json();
      assert.equal(body.state, 'uncertain');
      assert.equal(body.reason, 'process_ended');
      assert.equal(body.evidence.state, 'missing');
      assert.ok(existsSync(leaseFile(root, 'bootstrap')), 'R0 inspection never rewrites durable evidence');
      const lease = JSON.parse(readFileSync(leaseFile(root, 'bootstrap'), 'utf8'));
      assert.equal(lease.pid, DEAD_PID);
    } finally { await host.close(); }
  });
});
```

_First 80 of 196 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
