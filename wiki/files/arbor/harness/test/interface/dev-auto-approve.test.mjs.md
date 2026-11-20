# File: harness/test/interface/dev-auto-approve.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/dev-auto-approve.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5302 B |
| Lines | 78 |
| Hash | 040aefe61ee7 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ON | const | 12 | no | const ON = { [DEV_AUTO_APPROVE_ENV]: &#39;1&#39; }; |
| OFF | const | 13 | no | const OFF = {}; |
| pending | function | 21 | no | async function pending(t, id = &#39;req-1&#39;) { |
| dir | const | 22 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-devauto-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| approvals | const | 23 | no | const approvals = createApprovals({ dir, print: () =&gt; {} }); |
| approvals | const | 29 | no | const approvals = await pending(t); |
| approvals | const | 38 | no | const approvals = await pending(t); |
| prompted | variable | 39 | no | let prompted = false; |
| dir | const | 47 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-devauto-standing-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| args | const | 48 | no | const args = { provider: &#39;test&#39;, hours: 1, maxSends: 2, threads: [] }; |
| routerFixture | function | 55 | no | async function routerFixture(t, env) { |
| dir | const | 56 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-devauto-router-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| sends | variable | 57 | no | let sends = 0; const records = new Map(); |
| journal | const | 58 | no | const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: &#39;accepted&#39;, submitted: &#39;no&#39; })… |
| deps | const | 59 | no | const deps = { createJournal: () =&gt; journal, getProvider: id =&gt; ({ id, url: &#39;https://example.com&#39;, status: &#39;seeded-unverified&#39; }), listProviders: () =&gt; [], digestPayload: text =&gt; createHash(&#39;sha256&#39;)… |
| approvals | const | 60 | no | const approvals = createApprovals({ dir: join(dir, &#39;approvals&#39;), print: () =&gt; {} }); |
| router | const | 61 | no | const router = await createRouter({ dir, deps, approvals, pollMs: 1, env }); |
| f | const | 66 | no | const f = await routerFixture(t, OFF); |
| r | const | 67 | no | const r = await f.router.ask({ provider: &#39;test&#39;, prompt: &#39;hello&#39; }); |
| f | const | 73 | no | const f = await routerFixture(t, ON); |
| r | const | 74 | no | const r = await f.router.ask({ provider: &#39;test&#39;, prompt: &#39;hello&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../../src/interface/dev-auto-approve.mjs | import | 7 | [harness/src/interface/dev-auto-approve.mjs](../../src/interface/dev-auto-approve.mjs.md) |
| ../../src/interface/approval.mjs | import | 8 | [harness/src/interface/approval.mjs](../../src/interface/approval.mjs.md) |
| ../../src/interface/standing.mjs | import | 9 | [harness/src/interface/standing.mjs](../../src/interface/standing.mjs.md) |
| ../../src/interface/router.mjs | import | 10 | [harness/src/interface/router.mjs](../../src/interface/router.mjs.md) |

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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
