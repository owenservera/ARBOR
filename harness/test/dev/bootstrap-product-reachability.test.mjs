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