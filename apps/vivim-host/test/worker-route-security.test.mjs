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
