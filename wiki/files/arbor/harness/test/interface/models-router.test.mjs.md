# File: harness/test/interface/models-router.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/models-router.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10881 B |
| Lines | 156 |
| Hash | 3740561574f3 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| profiles | const | 12 | no | const profiles = [&#39;claude&#39;, &#39;zai&#39;].map(id =&gt; ({ id, label: id, url: `https://${id}.example`, hosts: [`${id}.example`], status: &#39;measured&#39;, models: { triggerSelector: &#39;x&#39;, tiers: { strong: [&#39;strong&#39;],… |
| fixture | function | 13 | no | async function fixture(t, { prepare, reply = { complete: true, text: &#39;OK&#39; } } = {}) { |
| dir | const | 14 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-mr-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| sends | variable | 15 | no | let sends = 0; const records = new Map(); |
| journal | const | 16 | no | const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: &#39;accepted&#39;, submitted: &#39;no&#39; })… |
| deps | const | 17 | no | const deps = { createJournal: () =&gt; journal, getProvider: id =&gt; profiles.find(p =&gt; p.id === id) ?? null, listProviders: () =&gt; profiles, digestPayload: x =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;… |
| approvals | const | 20 | no | const approvals = createApprovals({ dir: join(dir, &#39;approvals&#39;), print: () =&gt; {} }); |
| router | const | 21 | no | const router = await createRouter({ dir, deps, approvals, pollMs: 1 }); |
| f | const | 25 | no | const f = await fixture(t); const r = await f.router.ask({ provider: &#39;claude:strong-1&#39;, prompt: &#39;hi&#39; }); |
| rec | const | 29 | no | const rec = f.records.get(r.requestId); assert.equal(rec.requestedModel, &#39;strong-1&#39;); assert.equal(rec.model.id, &#39;strong-1&#39;); |
| f | const | 38 | no | const f = await fixture(t, { reply }); |
| request | const | 39 | no | const request = await f.router.ask({ provider: &#39;claude&#39;, prompt: &#39;hi&#39; }); |
| deadline | const | 42 | no | const deadline = Date.now() + 10000; |
| done | variable | 43 | no | let done; |
| f | const | 57 | no | const f = await fixture(t); const r = await f.router.ask({ provider: &#39;zai&#39;, model: &#39;missing&#39;, prompt: &#39;hi&#39; }); |
| f | const | 62 | no | const f = await fixture(t, { prepare: async () =&gt; { throw new Error(&#39;boom&#39;); } }); |
| r | const | 63 | no | const r = await f.router.ask({ provider: &#39;zai&#39;, prompt: &#39;hi&#39; }); await f.approvals.approve(r.requestId); |
| f | const | 67 | no | const f = await fixture(t); const r = await f.router.ask({ provider: &#39;auto&#39;, prompt: &#39;Review this diff for bugs&#39; }); |
| f | const | 73 | no | const f = await fixture(t); |
| r | const | 75 | no | const r = await f.router.ask({ provider: &#39;auto&#39;, prompt: &#39;Review this diff for bugs&#39;, constraints: { selectModel: true } }); |
| recs | const | 79 | no | const recs = [{ provider: &#39;zai&#39;, state: &#39;observed&#39;, updatedAt: &#39;1&#39; }, { provider: &#39;claude&#39;, state: &#39;blocked&#39;, reason: &#39;AUTH_WALL&#39;, updatedAt: &#39;2&#39; }]; |
| f | const | 87 | no | const f = await fixture(t); |
| server | const | 89 | no | const server = createServer({ router: f.router, timeoutMs: 100 }); const a = await server.listen(); t.after(() =&gt; server.close()); |
| ids | const | 90 | no | const ids = (await (await fetch(`http://127.0.0.1:${a.port}/v1/models`)).json()).data.map(m =&gt; m.id); |
| models | const | 92 | no | const models = await f.router.models(); assert.equal(models.find(m =&gt; m.provider === &#39;claude&#39;).models.length, 0); |
| f | const | 96 | no | const f = await fixture(t); |
| r | const | 102 | no | const r = await f.router.ask({ provider: &#39;auto&#39;, prompt: &#39;Review this diff for bugs&#39; }); |
| f | const | 110 | no | const f = await fixture(t); |
| r | const | 114 | no | const r = await f.router.ask({ provider: &#39;auto&#39;, prompt: &#39;what is 2+2&#39;, constraints: { effort: &#39;high&#39; } }); |
| f | const | 121 | no | const f = await fixture(t); |
| r | const | 128 | no | const r = await f.router.ask({ provider: &#39;auto&#39;, prompt: &#39;implement a new function&#39; }); |
| f | const | 134 | no | const f = await fixture(t); |
| r | const | 137 | no | const r = await f.router.ask({ provider: &#39;auto&#39;, prompt: &#39;Review this diff for bugs&#39; }); |
| f | const | 143 | no | const f = await fixture(t); |
| r | const | 144 | no | const r = f.router.classifyIntent({ task: &#39;implement a new api endpoint&#39; }); |
| f | const | 151 | no | const f = await fixture(t); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../../src/interface/approval.mjs | import | 7 | [harness/src/interface/approval.mjs](../../src/interface/approval.mjs.md) |
| ../../src/interface/router.mjs | import | 8 | [harness/src/interface/router.mjs](../../src/interface/router.mjs.md) |
| ../../src/interface/server.mjs | import | 9 | [harness/src/interface/server.mjs](../../src/interface/server.mjs.md) |
| ../../src/interface/brain.mjs | import | 10 | [harness/src/interface/brain.mjs](../../src/interface/brain.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 157 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
