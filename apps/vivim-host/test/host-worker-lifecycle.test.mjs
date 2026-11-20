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

test('a restarted Host reclaims its own dead in-process lease and resumes', async () => {
  await withRoot(async root => {
    writeLease(root, 'bootstrap', { role: 'bootstrap', pid: DEAD_PID, worldId: 'world-local',
      startedAt: new Date().toISOString(), schema: 'vivim.worker-lease/1', inProcess: true });
    const worker = stubWorker();
    const host = await startServer(root, worker);
    try {
      assert.equal(worker.state.starts, 1, 'a provably gone previous owner may be reclaimed');
      const res = await status(host.base, 'bootstrap');
      const body = await res.json();
      assert.equal(body.state, 'online');
      assert.equal(body.pid, process.pid);
    } finally { await host.close(); }
  });
});

test('heartbeat evidence is tri-state: future and stale samples are rejected, missing is not a failure', async () => {
  await withRoot(async root => {
    const s = createWorkerSupervisor({ dataRoot: root });
    s.takeover('relay', process.pid);
    assert.equal(s.status('relay').state, 'online');
    assert.equal(s.status('relay').evidence.state, 'missing');

    // Externally-spawned role: liveness now requires a current heartbeat.
    writeLease(root, 'relay', { role: 'relay', pid: process.pid, worldId: 'world-local',
      startedAt: new Date().toISOString(), schema: 'vivim.worker-lease/1' });
    let st = s.status('relay');
    assert.equal(st.state, 'uncertain');
    assert.equal(st.reason, 'lease_expired');
    assert.equal(st.evidence.state, 'missing');

    const beat = createWorkerHeartbeat({ root, worker: 'relay', now: () => new Date(Date.now() - 60_000).toISOString() });
    beat.record();
    st = s.status('relay');
    assert.equal(st.state, 'uncertain');
    assert.equal(st.evidence.state, 'stale');
    assert.equal(st.evidence.diagnosticCode, 'HEARTBEAT_STALE');

    const future = createWorkerHeartbeat({ root, worker: 'relay', now: () => new Date(Date.now() + 60_000).toISOString() });
    future.record();
    st = s.status('relay');
    assert.equal(st.evidence.state, 'failed', 'a future timestamp is not fresh evidence');
    assert.equal(st.evidence.diagnosticCode, 'HEARTBEAT_FROM_FUTURE');

    const fresh = createWorkerHeartbeat({ root, worker: 'relay', now: () => new Date().toISOString() });
    fresh.record();
    st = s.status('relay');
    assert.equal(st.state, 'online', 'a current heartbeat verifies recovery');
    assert.equal(st.evidence.state, 'ok');
    assert.equal(st.evidence.diagnosticCode, 'HEARTBEAT_CURRENT');
  });
});

test('native diagnostics feed distinguishes missing evidence from a real fault and recovery', async () => {
  await withRoot(async root => {
    let probe = { state: 'unknown', diagnosticCode: 'NO_HEARTBEAT' };
    const s = createWorkerSupervisor({ dataRoot: root, diagnostics: () => probe });
    s.takeover('bootstrap', process.pid);

    let st = s.status('bootstrap');
    assert.equal(st.state, 'online', 'missing evidence alone must not fail a live lease');
    assert.equal(st.evidence.state, 'missing');

    probe = { state: 'blocked', diagnosticCode: 'WORKER_CYCLE_FAILED' };
    st = s.status('bootstrap');
    assert.equal(st.state, 'uncertain');
    assert.equal(st.reason, 'native_health_failed', 'a real native fault is observable');
    assert.equal(st.evidence.state, 'failed');
    assert.equal(st.evidence.diagnosticCode, 'WORKER_CYCLE_FAILED');

    probe = { state: 'online', diagnosticCode: 'WORKER_CYCLE_OK' };
    st = s.status('bootstrap');
    assert.equal(st.state, 'online', 'verified recovery returns the role to online');
    assert.equal(st.evidence.state, 'ok');

    probe = null;
    st = s.status('bootstrap');
    assert.equal(st.evidence.state, 'missing');
    assert.equal(st.state, 'online');
  });
});

test('Host status surface feeds real native health and never turns absent evidence into failure', async () => {
  await withRoot(async root => {
    const healthyRoot = root;
    const host = await startServer(healthyRoot, null);
    try {
      let res = await status(host.base, 'relay');
      assert.equal(res.status, 200);
      let body = await res.json();
      assert.equal(body.state, 'not_started');
      assert.equal(body.evidence.state, 'missing', 'no heartbeat file is missing evidence');
      assert.notEqual(body.evidence.diagnosticCode, 'WORKER_CYCLE_FAILED');

      const beat = createWorkerHeartbeat({ root: healthyRoot, worker: 'relay' });
      beat.record('error');
      res = await status(host.base, 'relay');
      body = await res.json();
      assert.equal(body.evidence.state, 'failed', 'a real native fault reaches the owner surface');
      assert.equal(body.evidence.diagnosticCode, 'WORKER_CYCLE_FAILED');
    } finally { await host.close(); }
  });
});

test('lease admission is exclusive: a second supervisor cannot claim a live role', async () => {
  await withRoot(async root => {
    const first = createWorkerSupervisor({ dataRoot: root });
    const second = createWorkerSupervisor({ dataRoot: root });
    assert.equal(first.takeover('bootstrap', process.pid).state, 'started');
    const out = second.takeover('bootstrap', process.pid);
    assert.equal(out.state, 'already_running');
    assert.equal(out.pid, process.pid);
    const lease = JSON.parse(readFileSync(leaseFile(root, 'bootstrap'), 'utf8'));
    assert.equal(lease.pid, process.pid, 'the existing lease is never overwritten');
  });
});