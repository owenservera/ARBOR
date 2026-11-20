# File: harness/test/interface/tabs-router.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/tabs-router.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5901 B |
| Lines | 75 |
| Hash | 514cb8cf44e6 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| selectors | const | 10 | no | const selectors = [&#39;#composer&#39;]; |
| provider | const | 11 | no | const provider = { id: &#39;zai&#39;, label: &#39;zai&#39;, url: &#39;https://zai.example/&#39;, hosts: [&#39;zai.example&#39;], status: &#39;measured&#39;, composer: { selectors } }; |
| fixture | function | 13 | no | async function fixture(t, { draft = &#39;&#39;, live = [] } = {}) { |
| dir | const | 14 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-tabs-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| records | const | 15 | no | const records = new Map(); const calls = []; const closed = []; |
| journal | const | 16 | no | const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: &#39;accepted&#39;, submitted: &#39;no&#39; })… |
| page | const | 17 | no | const page = { targetId: &#39;new-1&#39;, draft, async evaluate(expr) { if (expr === clearComposerExpression(selectors)) { calls.push(&#39;clear&#39;); const n = this.draft.length; this.draft = &#39;&#39;; return n; } calls… |
| browser | const | 18 | no | const browser = { openPage: async () =&gt; page, targets: async () =&gt; [...live, { id: &#39;new-1&#39;, type: &#39;page&#39;, url: provider.url }], closeTarget: async id =&gt; { closed.push(id); } }; |
| deps | const | 19 | no | const deps = { createJournal: () =&gt; journal, getProvider: id =&gt; (id === provider.id ? provider : null), listProviders: () =&gt; [provider], digestPayload: x =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex… |
| approvals | const | 23 | no | const approvals = { async request() {}, async approve() {}, async consume(job) { return { requestId: job.requestId }; } }; |
| standing | const | 24 | no | const standing = { async check() { return { ok: false }; }, async recordSend() {} }; |
| tabs | const | 25 | no | const tabs = createTabRegistry({ file: join(dir, &#39;tabs.json&#39;) }); |
| router | const | 26 | no | const router = await createRouter({ dir, deps, approvals, standing, tabs, pollMs: 1, draftPolls: 1, draftPollMs: 0, target: { mode: &#39;lab&#39;, host: &#39;127.0.0.1&#39;, port: 9333 }, verifyTarget: () =&gt; {} }); |
| run | function | 27 | no | const run = async prompt =&gt; { const r = await router.ask({ provider: &#39;zai&#39;, prompt }); return router.wait(r.requestId, 2000); }; |
| f | const | 32 | no | const f = await fixture(t); |
| f | const | 41 | no | const f = await fixture(t, { draft: &#39;Hello, world!\\n&#39; }); |
| f | const | 48 | no | const f = await fixture(t, { draft: &#39;my own notes&#39; }); |
| f | const | 56 | no | const f = await fixture(t, { live: [{ id: &#39;mine&#39;, type: &#39;page&#39; }, { id: &#39;foreign&#39;, type: &#39;page&#39; }] }); |
| listed | const | 58 | no | const listed = await f.router.tabs(); |
| dir | const | 72 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-tk-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| reg | const | 73 | no | const reg = createTabRegistry({ file: join(dir, &#39;tabs.json&#39;) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../../src/interface/router.mjs | import | 7 | [harness/src/interface/router.mjs](../../src/interface/router.mjs.md) |
| ../../src/core/tabs.mjs | import | 8 | [harness/src/core/tabs.mjs](../../src/core/tabs.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
