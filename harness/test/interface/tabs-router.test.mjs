import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createRouter } from '../../src/interface/router.mjs';
import { createTabRegistry, clearComposerExpression, typedKeyFor } from '../../src/core/tabs.mjs';

const selectors = ['#composer'];
const provider = { id: 'zai', label: 'zai', url: 'https://zai.example/', hosts: ['zai.example'], status: 'measured', composer: { selectors } };

async function fixture(t, { draft = '', live = [] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-tabs-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const records = new Map(); const calls = []; const closed = [];
  const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: 'accepted', submitted: 'no' }); return { created: true }; }, async read(id) { return records.get(id); }, async update(id, p) { Object.assign(records.get(id), p); return records.get(id); }, async list() { return [...records.values()]; } };
  const page = { targetId: 'new-1', draft, async evaluate(expr) { if (expr === clearComposerExpression(selectors)) { calls.push('clear'); const n = this.draft.length; this.draft = ''; return n; } calls.push('snapshot'); return this.draft; } };
  const browser = { openPage: async () => page, targets: async () => [...live, { id: 'new-1', type: 'page', url: provider.url }], closeTarget: async id => { closed.push(id); } };
  const deps = { createJournal: () => journal, getProvider: id => (id === provider.id ? provider : null), listProviders: () => [provider], digestPayload: x => createHash('sha256').update(x).digest('hex'), threadKeyFor: (p, u) => `${p.id}:${u}`,
    connect: () => browser, readReply: () => ({ complete: true, text: 'OK' }),
    prepareModel: async () => { calls.push('prepare'); return { ok: true, model: null, discovered: null }; },
    sendOnce: async ({ page: p }) => { calls.push(`send:${p.draft}`); return { state: 'observed' }; } };
  const approvals = { async request() {}, async approve() {}, async consume(job) { return { requestId: job.requestId }; } };
  const standing = { async check() { return { ok: false }; }, async recordSend() {} };
  const tabs = createTabRegistry({ file: join(dir, 'tabs.json') });
  const router = await createRouter({ dir, deps, approvals, standing, tabs, pollMs: 1, draftPolls: 1, draftPollMs: 0, target: { mode: 'lab', host: '127.0.0.1', port: 9333 }, verifyTarget: () => {} });
  const run = async prompt => { const r = await router.ask({ provider: 'zai', prompt }); return router.wait(r.requestId, 2000); };
  return { router, tabs, page, calls, closed, run };
}

test('a new tab is recorded as owned and the typed prompt is noted by key only', async t => {
  const f = await fixture(t);
  assert.equal((await f.run('Say hi')).status, 'complete');
  const [entry] = await f.tabs.owned();
  assert.equal(entry.id, 'new-1'); assert.equal(entry.provider, 'zai'); assert.equal(entry.url, provider.url);
  assert.equal(entry.typedKey, typedKeyFor('Say hi')); assert.ok(!JSON.stringify(entry).includes('Say hi'));
  assert.deepEqual(f.calls, ['snapshot', 'prepare', 'send:']);
});

test('a stale harness-typed draft is cleared before the model step and send', async t => {
  const f = await fixture(t, { draft: 'Hello,   world!\n' });
  await f.tabs.record({ id: 'old-1', provider: 'zai', url: provider.url, typedKey: typedKeyFor('**Hello** world') });
  assert.equal((await f.run('Next prompt')).status, 'complete');
  assert.deepEqual(f.calls, ['snapshot', 'clear', 'prepare', 'send:']);
});

test('a foreign draft is not cleared', async t => {
  const f = await fixture(t, { draft: 'my own notes' });
  await f.tabs.record({ id: 'old-1', provider: 'zai', url: provider.url, typedKey: typedKeyFor('something else') });
  await f.run('Next prompt');
  assert.ok(!f.calls.includes('clear')); assert.equal(f.page.draft, 'my own notes');
  assert.deepEqual(f.calls, ['snapshot', 'prepare', 'send:my own notes']);
});

test('closeTabs refuses a non-owned id and never closes it; tabs() reports and prunes stale entries', async t => {
  const f = await fixture(t, { live: [{ id: 'mine', type: 'page' }, { id: 'foreign', type: 'page' }] });
  await f.tabs.record({ id: 'mine', provider: 'zai' }); await f.tabs.record({ id: 'gone', provider: 'zai' });
  const listed = await f.router.tabs();
  assert.deepEqual(listed.owned.map(x => x.id), ['mine']); assert.deepEqual(listed.stale.map(x => x.id), ['gone']);
  assert.equal(await f.tabs.isOwned('gone'), false);
  assert.deepEqual(await f.router.closeTabs({ ids: ['foreign', 'mine'] }), { closed: ['mine'], refused: ['foreign'] });
  assert.deepEqual(f.closed, ['mine']); assert.equal(await f.tabs.isOwned('mine'), false);
});

test('typedKeyFor ignores whitespace and punctuation differences but not letter changes', async t => {
  assert.equal(typedKeyFor('Hello, world!'), typedKeyFor('  hello world '.replace('h', 'H')));
  assert.equal(typedKeyFor('# Title\n\n- item *one*'), typedKeyFor('Title item one'));
  assert.equal(typedKeyFor('ｆｕｌｌ width 1'), typedKeyFor('full width 1'));
  assert.notEqual(typedKeyFor('Hello world'), typedKeyFor('Hello word'));
  assert.notEqual(typedKeyFor('Hello world'), typedKeyFor('hello world'));
  assert.match(typedKeyFor('x'), /^[0-9a-f]{64}$/);
  const dir = await mkdtemp(join(tmpdir(), 'wh-tk-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const reg = createTabRegistry({ file: join(dir, 'tabs.json') });
  assert.equal(await reg.noteTyped('unknown', typedKeyFor('x')), false); assert.deepEqual(await reg.typedKeys(), []);
});
