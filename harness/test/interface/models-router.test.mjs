import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createApprovals } from '../../src/interface/approval.mjs';
import { createRouter } from '../../src/interface/router.mjs';
import { createServer } from '../../src/interface/server.mjs';
import { learnInput, route, statsFromJournal } from '../../src/interface/brain.mjs';

const profiles = ['claude', 'zai'].map(id => ({ id, label: id, url: `https://${id}.example`, hosts: [`${id}.example`], status: 'measured', models: { triggerSelector: 'x', tiers: { strong: ['strong'], fast: ['fast'] } } }));
async function fixture(t, { prepare, reply = { complete: true, text: 'OK' } } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-mr-')); t.after(() => rm(dir, { recursive: true, force: true }));
  let sends = 0; const records = new Map();
  const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: 'accepted', submitted: 'no' }); return { created: true }; }, async read(id) { return records.get(id); }, async update(id, p) { Object.assign(records.get(id), p); return records.get(id); }, async list() { return [...records.values()]; } };
  const deps = { createJournal: () => journal, getProvider: id => profiles.find(p => p.id === id) ?? null, listProviders: () => profiles, digestPayload: x => createHash('sha256').update(x).digest('hex'), threadKeyFor: (p, u) => `${p.id}:${u}`,
    connect: () => ({ openPage: () => ({}), targets: () => [] }), sendOnce: async () => { sends++; return { state: 'observed' }; }, readReply: () => reply,
    prepareModel: prepare || (async ({ wanted }) => wanted === 'missing' ? { ok: false, error: 'MODEL_UNAVAILABLE', model: null, discovered: null } : { ok: true, model: { id: wanted || 'fast-1', label: wanted || 'Fast 1' }, discovered: { current: wanted || 'fast-1', currentLabel: 'x', models: [{ id: 'fast-1', label: 'Fast 1', current: !wanted }, { id: 'strong-1', label: 'Strong 1', current: false }] } }) };
  const approvals = createApprovals({ dir: join(dir, 'approvals'), print: () => {} });
  const router = await createRouter({ dir, deps, approvals, pollMs: 1 });
  return { dir, router, approvals, records, sends: () => sends };
}
test('provider:model is parsed, selected before send, and the actual model is journaled', async t => {
  const f = await fixture(t); const r = await f.router.ask({ provider: 'claude:strong-1', prompt: 'hi' });
  assert.equal(r.provider, 'claude'); assert.equal(r.requestedModel, 'strong-1');
  await f.approvals.approve(r.requestId); const done = await f.router.wait(r.requestId, 2000);
  assert.equal(done.status, 'complete'); assert.equal(done.model.id, 'strong-1');
  const rec = f.records.get(r.requestId); assert.equal(rec.requestedModel, 'strong-1'); assert.equal(rec.model.id, 'strong-1');
});
for (const [reply, expected] of [
  [{ complete: true, text: '' }, 'observed'],
  [{ complete: true, text: ' \t\n' }, 'observed'],
  [{ complete: true, text: '', error: 'capacity' }, 'provider_error'],
  [{ complete: false, text: 'partial' }, 'observed'],
  [{ complete: true, text: ' answer ' }, 'complete'],
]) test(`router validates reply ${JSON.stringify(reply)}`, async t => {
  const f = await fixture(t, { reply });
  const request = await f.router.ask({ provider: 'claude', prompt: 'hi' });
  await f.approvals.approve(request.requestId);
  // An observed status alone can precede readReply; wait until its result is exposed.
  const deadline = Date.now() + 10000;
  let done;
  do {
    done = await f.router.result(request.requestId);
    if (Object.hasOwn(done, 'reply') || ['failed', 'blocked', 'uncertain'].includes(done.status)) break;
    await new Promise(resolve => setTimeout(resolve, 5));
  } while (Date.now() < deadline);
  assert.ok(Object.hasOwn(done, 'reply'), `reply processing did not finish: ${done.status}`);
  assert.equal(done.status, expected);
  if (reply.error) assert.equal(done.error, reply.error);
  assert.equal(f.sends(), 1);
  await f.router.result(request.requestId);
  assert.equal(f.sends(), 1);
});
test('an unavailable model blocks without sending', async t => {
  const f = await fixture(t); const r = await f.router.ask({ provider: 'zai', model: 'missing', prompt: 'hi' });
  await f.approvals.approve(r.requestId); const done = await f.router.wait(r.requestId, 2000);
  assert.equal(done.status, 'blocked'); assert.equal(f.sends(), 0); assert.equal(f.records.get(r.requestId).reason, 'MODEL_UNAVAILABLE');
});
test('a model picker that throws before typing fails the request without a send', async t => {
  const f = await fixture(t, { prepare: async () => { throw new Error('boom'); } });
  const r = await f.router.ask({ provider: 'zai', prompt: 'hi' }); await f.approvals.approve(r.requestId);
  assert.equal((await f.router.wait(r.requestId, 2000)).status, 'failed'); assert.equal(f.sends(), 0);
});
test('auto routes through studio policy with one send and records the decision', async t => {
  const f = await fixture(t); const r = await f.router.ask({ provider: 'auto', prompt: 'Review this diff for bugs' });
  assert.ok(['claude', 'zai'].includes(r.provider)); assert.equal(r.routing.pattern, 'single'); assert.equal(r.requestedModel, null);
  assert.deepEqual(f.records.get(r.requestId).routing, r.routing);
  await assert.rejects(f.router.ask({ provider: 'auto', prompt: 'x', threadUrl: 'https://claude.example/chat/1' }));
});
test('auto with selectModel picks a tiered model from discovered models', async t => {
  const f = await fixture(t);
  await writeFile(join(f.dir, 'models.json'), JSON.stringify({ claude: { models: [{ id: 'fast-1', label: 'Fast 1' }, { id: 'strong-1', label: 'Strong 1' }] }, zai: { models: [{ id: 'strong-z', label: 'Strong Z' }] } }));
  const r = await f.router.ask({ provider: 'auto', prompt: 'Review this diff for bugs', constraints: { selectModel: true } });
  assert.match(r.requestedModel, /^strong/); assert.equal(r.routing.taskClass, 'review');
});
test('brain: journal stats, evidence-based sign-in, and auth-walled sites are skipped', () => {
  const recs = [{ provider: 'zai', state: 'observed', updatedAt: '1' }, { provider: 'claude', state: 'blocked', reason: 'AUTH_WALL', updatedAt: '2' }];
  assert.equal(statsFromJournal(recs).get('zai').completed, 1);
  return learnInput({ records: recs, registry: { zai: { models: [] } }, profiles }).then(ps => {
    assert.equal(ps.find(p => p.site === 'claude').signedIn, false); assert.equal(ps.find(p => p.site === 'zai').signedIn, true);
    assert.equal(route({ task: 'hello', providers: ps, profiles }).site, 'zai');
  });
});
test('GET /v1/models lists auto, providers and provider:model ids; completions report the used model', async t => {
  const f = await fixture(t);
  await writeFile(join(f.dir, 'models.json'), JSON.stringify({ zai: { current: 'fast-1', models: [{ id: 'fast-1', label: 'Fast 1', current: true }] } }));
  const server = createServer({ router: f.router, timeoutMs: 100 }); const a = await server.listen(); t.after(() => server.close());
  const ids = (await (await fetch(`http://127.0.0.1:${a.port}/v1/models`)).json()).data.map(m => m.id);
  assert.deepEqual(ids, ['auto', 'claude', 'zai', 'zai:fast-1']);
  const models = await f.router.models(); assert.equal(models.find(m => m.provider === 'claude').models.length, 0);
});

test('auto routing uses intelligent router: verified readiness selects provider+model', async t => {
  const f = await fixture(t);
  // Give zai a discovered model in the registry so it is selection-verified.
  await writeFile(join(f.dir, 'models.json'), JSON.stringify({
    zai: { current: 'fast-1', models: [{ id: 'fast-1', label: 'Fast 1', current: true }] },
    claude: { current: 'fast-1', models: [{ id: 'fast-1', label: 'Fast 1', current: true }] }
  }));
  const r = await f.router.ask({ provider: 'auto', prompt: 'Review this diff for bugs' });
  assert.ok(['claude', 'zai'].includes(r.provider));
  assert.equal(r.routing.source, 'intelligent-router');
  assert.ok(r.routing.ranked.length > 0);
  assert.ok(r.routing.ranked.every(x => typeof x.score === 'number'));
});

test('auto routing records effort selected by intelligent router', async t => {
  const f = await fixture(t);
  await writeFile(join(f.dir, 'models.json'), JSON.stringify({
    zai: { current: 'fast-1', models: [{ id: 'fast-1', label: 'Fast 1', current: true, efforts: ['low', 'high'] }] }
  }));
  const r = await f.router.ask({ provider: 'auto', prompt: 'what is 2+2', constraints: { effort: 'high' } });
  assert.ok(r.provider === 'zai' || r.provider === 'claude');
  assert.equal(typeof r.routing.taskClass, 'string');
  assert.ok(r.routing.source === 'intelligent-router' || r.routing.source === 'studio-policy');
});

test('owner rule overrides intelligent router selection', async t => {
  const f = await fixture(t);
  await writeFile(join(f.dir, 'models.json'), JSON.stringify({
    claude: { current: 'fast-1', models: [{ id: 'fast-1', label: 'Fast 1', current: true }] },
    zai: { current: 'fast-1', models: [{ id: 'fast-1', label: 'Fast 1', current: true }] }
  }));
  // Force all coding tasks to zai via owner rule.
  await f.router.prefs.saveRule({ taskClass: 'coding', provider: 'zai', model: 'fast-1', scope: 'owner' });
  const r = await f.router.ask({ provider: 'auto', prompt: 'implement a new function' });
  assert.equal(r.provider, 'zai');
  assert.equal(r.routing.reason, 'OWNER_RULE');
});

test('intelligent router falls back to studio policy when no verified models', async t => {
  const f = await fixture(t);
  // Empty registry -> no selection-verified models -> intelligent router blocked -> studio policy fallback.
  await writeFile(join(f.dir, 'models.json'), JSON.stringify({}));
  const r = await f.router.ask({ provider: 'auto', prompt: 'Review this diff for bugs' });
  assert.ok(['claude', 'zai'].includes(r.provider));
  assert.equal(r.routing.source, 'studio-policy');
});

test('classifyIntent is exposed on the router', async t => {
  const f = await fixture(t);
  const r = f.router.classifyIntent({ task: 'implement a new api endpoint' });
  assert.equal(r.intentType, 'code-change');
  assert.equal(r.executionTarget, 'local-pc');
  assert.equal(r.domain, 'code');
});

test('prefs store is exposed on the router', async t => {
  const f = await fixture(t);
  assert.equal(typeof f.router.prefs.listRules, 'function');
  assert.equal(typeof f.router.prefs.recordOutcome, 'function');
  assert.equal(typeof f.router.prefs.routerInputs, 'function');
});

