import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createApprovals } from '../../src/interface/approval.mjs';
import { createRouter } from '../../src/interface/router.mjs';
import { createServer } from '../../src/interface/server.mjs';
import { buildLaunchCommand } from '../../src/interface/launch.mjs';
import { handleRpc } from '../../bin/wh-mcp.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-interface-')); t.after(() => rm(dir, { recursive: true, force: true }));
  let sends = 0; const records = new Map();
  const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: 'accepted', submitted: 'no' }); return { created: true }; }, async read(id) { return records.get(id); }, async update(id, p) { Object.assign(records.get(id), p); return records.get(id); }, async list() { return [...records.values()]; } };
  const deps = { createJournal: () => journal, getProvider: id => ({ id, url: 'https://example.com', status: 'seeded-unverified' }), listProviders: () => [], digestPayload: text => createHash('sha256').update(text).digest('hex'), threadKeyFor: (p, url) => `${p.id}:${url}`, connect: () => ({ openPage: () => ({}) }), sendOnce: async () => { sends++; return { state: 'uncertain' }; }, readReply: () => ({ complete: true, text: 'answer' }) };
  const approvals = createApprovals({ dir: join(dir, 'approvals'), print: () => {} });
  const router = await createRouter({ dir, deps, approvals, pollMs: 1 });
  return { dir, approvals, router, sends: () => sends };
}
test('ask does not send before confirmation and uncertainty never resends', async t => {
  const f = await fixture(t); const r = await f.router.ask({ provider: 'test', prompt: 'hello' });
  assert.equal(r.status, 'pending_approval'); assert.equal((await f.router.result(r.requestId)).status, 'pending_approval'); assert.equal(f.sends(), 0);
  await f.approvals.approve(r.requestId); assert.equal((await f.router.wait(r.requestId, 1000)).status, 'uncertain'); await f.router.result(r.requestId); assert.equal(f.sends(), 1);
});
test('approval is bound, single use, and expires', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'wh-approval-')); t.after(() => rm(dir, { recursive: true, force: true })); let now = 100;
  const a = createApprovals({ dir, now: () => now, ttlMs: 10, print: () => {} });
  const r = { requestId: 'one', provider: 'x', threadUrl: 'new', payloadDigest: 'digest', preview: 'hello' };
  await a.request(r); await a.approve('one'); assert.equal(await a.consume({ ...r, payloadDigest: 'different' }), null); assert.equal(await a.consume({ ...r, threadUrl: 'other' }), null); assert.ok(await a.consume(r)); assert.equal(await a.consume(r), null); await assert.rejects(a.approve('one'));
  await a.request({ ...r, requestId: 'two' }); now = 111; await assert.rejects(a.approve('two'));
});
test('HTTP refuses unsafe hosts and has no confirmation route', async t => {
  const f = await fixture(t); assert.throws(() => createServer({ router: f.router, host: '0.0.0.0' }));
  const server = createServer({ router: f.router }); const address = await server.listen(); t.after(() => server.close());
  const base = `http://127.0.0.1:${address.port}`;
  const ask = await fetch(`${base}/v1/ask`, { method: 'POST', body: JSON.stringify({ provider: 'test', prompt: 'hello' }) }); assert.equal(ask.status, 202); const result = await ask.json();
  const response = await fetch(`${base}/v1/requests/${result.requestId}/approve`, { method: 'POST' }); assert.equal(response.status, 404); assert.equal(f.sends(), 0);
});
test('MCP exposes exactly four tools and no confirmation surface', async t => {
  const f = await fixture(t); const list = await handleRpc({ id: 1, method: 'tools/list' }, f.router);
  assert.deepEqual(list.result.tools.map(x => x.name), ['web_ai_providers', 'web_ai_status', 'web_ai_ask', 'web_ai_result', 'web_ai_context']);
  const bad = await handleRpc({ id: 2, method: 'tools/call', params: { name: 'approve', arguments: {} } }, f.router); assert.ok(bad.error);
  for (const path of ['../../src/interface/server.mjs', '../../bin/wh-mcp.mjs']) assert.doesNotMatch(await readFile(new URL(path, import.meta.url), 'utf8'), /\bapprove\b/);
});
test('launch refuses unsafe port and profile', () => {
  assert.throws(() => buildLaunchCommand({ port: 9222 })); assert.throws(() => buildLaunchCommand({ host: '0.0.0.0' })); assert.throws(() => buildLaunchCommand({ userDataDir: tmpdir() }));
  assert.ok(buildLaunchCommand().args.includes('--remote-debugging-port=9333'));
});
