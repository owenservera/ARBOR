# File: harness/test/interface/standing.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/standing.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9542 B |
| Lines | 132 |
| Hash | a0810b6f816b |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOUR | const | 11 | no | const HOUR = 3600000; |
| enableArgs | const | 12 | no | const enableArgs = { provider: &#39;test&#39;, hours: 2, maxSends: 3, threads: [], confirmText: &#39;ENABLE test&#39; }; |
| okLab | function | 13 | no | const okLab = async () =&gt; true; |
| tempDir | function | 15 | no | async function tempDir(t) { |
| dir | const | 16 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-standing-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| s | const | 21 | no | const s = createStanding({ dir: await tempDir(t), verifyLabProfile: okLab }); |
| dir | const | 35 | no | const dir = await tempDir(t); let now = 1000000; |
| s | const | 36 | no | const s = createStanding({ dir, now: () =&gt; now, verifyLabProfile: okLab }); |
| dir | const | 49 | no | const dir = await tempDir(t); |
| falsy | const | 51 | no | const falsy = createStanding({ dir, verifyLabProfile: async () =&gt; false }); |
| throws | const | 52 | no | const throws = createStanding({ dir, verifyLabProfile: async () =&gt; { throw new Error(&#39;boom&#39;); } }); |
| dir | const | 58 | no | const dir = await tempDir(t); |
| s | const | 59 | no | const s = createStanding({ dir, verifyLabProfile: okLab }); |
| dir | const | 71 | no | const dir = await tempDir(t); const CANARY = &#39;PROMPT-CANARY-7f3a-do-not-store&#39;; |
| s | const | 72 | no | const s = createStanding({ dir, verifyLabProfile: okLab }); |
| raw | const | 76 | no | const raw = await readFile(join(dir, &#39;standing.json&#39;), &#39;utf8&#39;); |
| dir | const | 82 | no | const dir = await tempDir(t); const s = createStanding({ dir, verifyLabProfile: okLab }); |
| lab | const | 90 | no | const lab = resolve(&#39;C:\\\\proj\\\\web-harness\\\\runtime\\\\chrome-profile&#39;); |
| routerFixture | function | 99 | no | async function routerFixture(t, dir, standing) { |
| sends | variable | 100 | no | let sends = 0; const records = new Map(); |
| journal | const | 101 | no | const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: &#39;accepted&#39;, submitted: &#39;no&#39; })… |
| deps | const | 102 | no | const deps = { createJournal: () =&gt; journal, getProvider: id =&gt; ({ id, url: &#39;https://example.com&#39;, status: &#39;seeded-unverified&#39; }), listProviders: () =&gt; [], digestPayload: text =&gt; createHash(&#39;sha256&#39;)… |
| approvals | const | 103 | no | const approvals = createApprovals({ dir: join(dir, &#39;approvals&#39;), print: () =&gt; {} }); |
| router | const | 104 | no | const router = await createRouter({ dir, deps, approvals, pollMs: 1, standing }); |
| dir | const | 109 | no | const dir = await tempDir(t); |
| standing | const | 110 | no | const standing = createStanding({ dir: join(dir, &#39;approvals&#39;), verifyLabProfile: okLab }); |
| f | const | 112 | no | const f = await routerFixture(t, dir, standing); |
| r | const | 113 | no | const r = await f.router.ask({ provider: &#39;test&#39;, prompt: &#39;hello&#39; }); |
| dir | const | 120 | no | const dir = await tempDir(t); |
| f | const | 121 | no | const f = await routerFixture(t, dir, createStanding({ dir: join(dir, &#39;approvals&#39;), verifyLabProfile: okLab })); |
| r | const | 122 | no | const r = await f.router.ask({ provider: &#39;test&#39;, prompt: &#39;hello&#39; }); |
| dir | const | 127 | no | const dir = await tempDir(t); |
| f | const | 129 | no | const f = await routerFixture(t, dir, createStanding({ dir: join(dir, &#39;approvals&#39;), verifyLabProfile: async () =&gt; false })); |
| r | const | 130 | no | const r = await f.router.ask({ provider: &#39;test&#39;, prompt: &#39;hello&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../../src/interface/standing.mjs | import | 7 | [harness/src/interface/standing.mjs](../../src/interface/standing.mjs.md) |
| ../../src/interface/approval.mjs | import | 8 | [harness/src/interface/approval.mjs](../../src/interface/approval.mjs.md) |
| ../../src/interface/router.mjs | import | 9 | [harness/src/interface/router.mjs](../../src/interface/router.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createStanding, isLabCommandLine } from '../../src/interface/standing.mjs';
import { createApprovals } from '../../src/interface/approval.mjs';
import { createRouter } from '../../src/interface/router.mjs';

const HOUR = 3600000;
const enableArgs = { provider: 'test', hours: 2, maxSends: 3, threads: [], confirmText: 'ENABLE test' };
const okLab = async () => true;

async function tempDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-standing-')); t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('enable rejects wrong confirmation, bad hours, bad send cap, and bad threads', async t => {
  const s = createStanding({ dir: await tempDir(t), verifyLabProfile: okLab });
  await assert.rejects(s.enable({ ...enableArgs, confirmText: 'enable test' }), { code: 'STANDING_CONFIRM_MISMATCH' });
  await assert.rejects(s.enable({ ...enableArgs, confirmText: 'ENABLE' }), { code: 'STANDING_CONFIRM_MISMATCH' });
  for (const hours of [0, 25, 1.5, '2', NaN]) await assert.rejects(s.enable({ ...enableArgs, hours }), { code: 'STANDING_BAD_HOURS' });
  for (const maxSends of [0, 21, 2.5]) await assert.rejects(s.enable({ ...enableArgs, maxSends }), { code: 'STANDING_BAD_MAX' });
  await assert.rejects(s.enable({ ...enableArgs, threads: ['http://example.com/c/1'] }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, threads: ['not a url'] }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, threads: ['new'] }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, threads: Array.from({ length: 11 }, (_, i) => `https://example.com/c/${i}`) }), { code: 'STANDING_BAD_THREAD' });
  await assert.rejects(s.enable({ ...enableArgs, provider: '' , confirmText: 'ENABLE ' }), { code: 'STANDING_BAD_PROVIDER' });
  assert.deepEqual(await s.status(), { record: null, active: false });
});

test('check denies with NO_STANDING, PROVIDER_MISMATCH, THREAD_NOT_ALLOWED, PROMPT_TOO_LONG, and EXPIRED', async t => {
  const dir = await tempDir(t); let now = 1000000;
  const s = createStanding({ dir, now: () => now, verifyLabProfile: okLab });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'NO_STANDING' });
  await s.enable({ ...enableArgs, threads: ['https://example.com/c/abc'] });
  assert.deepEqual(await s.check({ provider: 'other', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'PROVIDER_MISMATCH' });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'https://example.com/c/zzz', prompt: 'hi' }), { ok: false, reason: 'THREAD_NOT_ALLOWED' });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'x'.repeat(2001) }), { ok: false, reason: 'PROMPT_TOO_LONG' });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'x'.repeat(2000) }), { ok: true });
  now += 2 * HOUR + 1;
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'EXPIRED' });
  assert.equal((await s.status()).active, false);
});

test('check denies with LAB_PROFILE_NOT_VERIFIED when verification is false or throws', async t => {
  const dir = await tempDir(t);
  await createStanding({ dir, verifyLabProfile: okLab }).enable(enableArgs);
  const falsy = createStanding({ dir, verifyLabProfile: async () => false });
  const throws = createStanding({ dir, verifyLabProfile: async () => { throw new Error('boom'); } });
  assert.deepEqual(await falsy.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'LAB_PROFILE_NOT_VERIFIED' });
  assert.deepEqual(await throws.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'LAB_PROFILE_NOT_VERIFIED' });
});

test('check allows new and listed threads; recordSend counts and SEND_LIMIT stops at maxSends', async t => {
  const dir = await tempDir(t);
  const s = createStanding({ dir, verifyLabProfile: okLab });
  await s.enable({ ...enableArgs, maxSends: 2, threads: ['https://example.com/c/abc'] });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'https://example.com/c/abc', prompt: 'hi' }), { ok: true });
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: true });
  await s.recordSend();
  assert.equal((await s.status()).record.sent, 1);
  await s.recordSend();
  assert.deepEqual(await s.check({ provider: 'test', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'SEND_LIMIT' });
  await assert.rejects(s.recordSend(), { code: 'SEND_LIMIT' });
});

test('standing.json never contains prompt text', async t => {
  const dir = await tempDir(t); const CANARY = 'PROMPT-CANARY-7f3a-do-not-store';
  const s = createStanding({ dir, verifyLabProfile: okLab });
  await s.enable(enableArgs);
  assert.equal((await s.check({ provider: 'test', threadUrl: 'new', prompt: CANARY })).ok, true);
  await s.recordSend();
  const raw = await readFile(join(dir, 'standing.json'), 'utf8');
  assert.doesNotMatch(raw, /PROMPT-CANARY/);
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ['createdAt', 'expiresAt', 'maxSends', 'provider', 'sent', 'threads']);
});
```

_First 80 of 133 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
