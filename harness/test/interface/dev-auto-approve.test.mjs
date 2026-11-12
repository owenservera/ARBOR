import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { devAutoApprove, confirmAndApprove, DEV_AUTO_APPROVE_ENV } from '../../src/interface/dev-auto-approve.mjs';
import { createApprovals } from '../../src/interface/approval.mjs';
import { createStanding } from '../../src/interface/standing.mjs';
import { createRouter } from '../../src/interface/router.mjs';

const ON = { [DEV_AUTO_APPROVE_ENV]: '1' };
const OFF = {};

test('only the exact value "1" turns the dev flag on', () => {
  assert.equal(devAutoApprove(ON), true);
  for (const v of [undefined, '', '0', 'true', 'yes', ' 1', '1 ']) assert.equal(devAutoApprove({ [DEV_AUTO_APPROVE_ENV]: v }), false);
  assert.equal(devAutoApprove({}), false);
});

async function pending(t, id = 'req-1') {
  const dir = await mkdtemp(join(tmpdir(), 'wh-devauto-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const approvals = createApprovals({ dir, print: () => {} });
  await approvals.request({ requestId: id, provider: 'test', threadUrl: 'new', payloadDigest: 'd', preview: 'hello' });
  return approvals;
}

test('wh approve: flag off still needs an interactive terminal and the typed id', async t => {
  const approvals = await pending(t);
  await assert.rejects(confirmAndApprove({ approvals, requestId: 'req-1', env: OFF, isTTY: false, log: () => {} }), /Interactive terminal required/);
  await assert.rejects(confirmAndApprove({ approvals, requestId: 'req-1', env: OFF, isTTY: true, prompt: async () => 'wrong', log: () => {} }), /Confirmation did not match/);
  assert.ok(await approvals.pending('req-1'), 'still pending after refusals');
  await confirmAndApprove({ approvals, requestId: 'req-1', env: OFF, isTTY: true, prompt: async () => 'req-1', log: () => {} });
  assert.equal(await approvals.pending('req-1'), null);
});

test('wh approve: flag on approves without a terminal or prompt, but a missing request still fails', async t => {
  const approvals = await pending(t);
  let prompted = false;
  await confirmAndApprove({ approvals, requestId: 'req-1', env: ON, isTTY: false, prompt: async () => { prompted = true; return ''; }, log: () => {} });
  assert.equal(prompted, false);
  assert.equal(await approvals.pending('req-1'), null);
  await assert.rejects(confirmAndApprove({ approvals, requestId: 'nope', env: ON, isTTY: false, log: () => {} }), /Pending request not found/);
});

test('standing enable: confirmation text required unless the flag is on', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'wh-devauto-standing-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const args = { provider: 'test', hours: 1, maxSends: 2, threads: [] };
  await assert.rejects(createStanding({ dir, env: OFF }).enable(args), { code: 'STANDING_CONFIRM_MISMATCH' });
  await assert.rejects(createStanding({ dir, env: OFF }).enable({ ...args, confirmText: 'nope' }), { code: 'STANDING_CONFIRM_MISMATCH' });
  const record = await createStanding({ dir, env: ON }).enable(args);
  assert.equal(record.provider, 'test');
});

async function routerFixture(t, env) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-devauto-router-')); t.after(() => rm(dir, { recursive: true, force: true }));
  let sends = 0; const records = new Map();
  const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: 'accepted', submitted: 'no' }); return { created: true }; }, async read(id) { return records.get(id); }, async update(id, p) { Object.assign(records.get(id), p); return records.get(id); }, async list() { return [...records.values()]; } };
  const deps = { createJournal: () => journal, getProvider: id => ({ id, url: 'https://example.com', status: 'seeded-unverified' }), listProviders: () => [], digestPayload: text => createHash('sha256').update(text).digest('hex'), threadKeyFor: (p, url) => `${p.id}:${url}`, connect: () => ({ openPage: () => ({}) }), sendOnce: async () => { sends++; return { state: 'uncertain' }; }, readReply: () => ({ complete: true, text: 'answer' }) };
  const approvals = createApprovals({ dir: join(dir, 'approvals'), print: () => {} });
  const router = await createRouter({ dir, deps, approvals, pollMs: 1, env });
  return { router, approvals, sends: () => sends };
}

test('router: flag off leaves a new request pending until a human approves', async t => {
  const f = await routerFixture(t, OFF);
  const r = await f.router.ask({ provider: 'test', prompt: 'hello' });
  assert.equal((await f.router.wait(r.requestId, 50)).status, 'pending_approval');
  assert.equal(f.sends(), 0);
});

test('router: flag on approves the request itself and sends exactly once; uncertainty is never resent', async t => {
  const f = await routerFixture(t, ON);
  const r = await f.router.ask({ provider: 'test', prompt: 'hello' });
  assert.equal((await f.router.wait(r.requestId, 1000)).status, 'uncertain');
  await f.router.result(r.requestId); await f.router.result(r.requestId);
  assert.equal(f.sends(), 1);
});
