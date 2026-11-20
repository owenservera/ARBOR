# File: harness/test/onboarding/grant.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/onboarding/grant.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10295 B |
| Lines | 176 |
| Hash | 34b6e0cb79cc |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digest | function | 10 | no | const digest = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| PROMPT | const | 11 | no | const PROMPT = &#39;SECRET ONBOARDING PROMPT&#39;; |
| DIGEST | const | 12 | no | const DIGEST = digest(PROMPT); |
| NATIVE | const | 14 | no | const NATIVE = &#39;https://chatgpt.com/c/0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f&#39;; |
| POSIX | const | 15 | no | const POSIX = process.platform !== &#39;win32&#39;; |
| setup | function | 17 | no | async function setup(t, { clock = { t: 1000 }, maxSends = 2, expiresInMs = 60000, issue = true, providers = [&#39;chatgpt&#39;] } = {}) { |
| dir | const | 18 | no | const dir = await mkdtemp(join(tmpdir(), &#39;harness-grant-&#39;)); |
| store | const | 20 | no | const store = createGrantStore({ dir, now: () =&gt; clock.t, confirm: async () =&gt; true }); |
| grant | const | 21 | no | const grant = issue ? await store.issue({ providers, profile: &#39;lab&#39;, port: 9333, promptDigest: DIGEST, maxSends, expiresInMs, fresh: true }) : null; |
| req | function | 22 | no | const req = (over = {}) =&gt; ({ provider: &#39;chatgpt&#39;, profile: &#39;lab&#39;, port: 9333, promptDigest: DIGEST, threadUrl: NEW, requestId: &#39;req-1&#39;, ...over }); |
| raw | const | 29 | no | const raw = await readFile(join(dir, &#39;onboarding-grant.json&#39;), &#39;utf8&#39;); |
| asked | variable | 44 | no | let asked = 0; |
| base | const | 45 | no | const base = { providers: [&#39;chatgpt&#39;], profile: &#39;lab&#39;, port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true, confirm: async () =&gt; { asked++; return true; } }; |
| dir | const | 54 | no | const dir = await mkdtemp(join(tmpdir(), &#39;harness-grant-confirm-&#39;)); |
| store | const | 57 | no | const store = createGrantStore({ dir, now: () =&gt; 1000, stdin: new PassThrough(), stdout: new PassThrough() }); |
| base | const | 58 | no | const base = { providers: [&#39;chatgpt&#39;], profile: &#39;lab&#39;, port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true }; |
| dir | const | 67 | no | const dir = await mkdtemp(join(tmpdir(), &#39;harness-grant-tty-&#39;)); |
| store | const | 69 | no | const store = createGrantStore({ dir, now: () =&gt; 1, stdin: new PassThrough(), stdout: new PassThrough() }); |
| mkTty | function | 76 | no | const mkTty = () =&gt; { const s = new PassThrough(); s.isTTY = true; return s; }; |
| summary | const | 77 | no | const summary = { providers: [&#39;chatgpt&#39;], profile: &#39;lab&#39;, port: 9333, maxSends: 1, expiresInMs: 1000 }; |
| out | const | 78 | no | const out = mkTty(); out.resume(); |
| good | const | 79 | no | const good = mkTty(); setTimeout(() =&gt; good.write(&#39;ISSUE chatgpt\\n&#39;), 5); |
| bad | const | 81 | no | const bad = mkTty(); setTimeout(() =&gt; bad.write(&#39;yes\\n&#39;), 5); |
| empty | const | 115 | no | const empty = await setup(t, { issue: false }); |
| results | const | 164 | no | const results = await Promise.all([1, 2, 3, 4, 5].map(i =&gt; store.consume(req({ requestId: `req-${i}` })))); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:stream | import | 6 | external |
| node:crypto | import | 7 | external |
| ../../src/onboarding/grant.mjs | import | 8 | [harness/src/onboarding/grant.mjs](../../src/onboarding/grant.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { createHash } from 'node:crypto';
import { createGrantStore, ttyConfirm } from '../../src/onboarding/grant.mjs';

const digest = text => createHash('sha256').update(text, 'utf8').digest('hex');
const PROMPT = 'SECRET ONBOARDING PROMPT';
const DIGEST = digest(PROMPT);
const NEW = 'new';
const NATIVE = 'https://chatgpt.com/c/0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f';
const POSIX = process.platform !== 'win32';

async function setup(t, { clock = { t: 1000 }, maxSends = 2, expiresInMs = 60000, issue = true, providers = ['chatgpt'] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-grant-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createGrantStore({ dir, now: () => clock.t, confirm: async () => true });
  const grant = issue ? await store.issue({ providers, profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends, expiresInMs, fresh: true }) : null;
  const req = (over = {}) => ({ provider: 'chatgpt', profile: 'lab', port: 9333, promptDigest: DIGEST, threadUrl: NEW, requestId: 'req-1', ...over });
  return { dir, store, grant, clock, req };
}

test('issue writes a grant with digest only, never prompt text', async t => {
  const { dir, store } = await setup(t, { issue: false });
  await store.issue({ providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true, prompt: PROMPT });
  const raw = await readFile(join(dir, 'onboarding-grant.json'), 'utf8');
  assert.ok(raw.includes(DIGEST));
  assert.ok(!raw.includes(PROMPT));
  assert.ok(!/"prompt"\s*:/.test(raw));
});

test('grant file is mode 0600 and written atomically (no tmp left behind)', { skip: !POSIX && 'POSIX mode bits' }, async t => {
  const { dir, store } = await setup(t, { issue: false });
  await store.issue({ providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true });
  assert.equal((await stat(join(dir, 'onboarding-grant.json'))).mode & 0o777, 0o600);
  assert.deepEqual((await readdir(dir)).filter(n => n.endsWith('.tmp')), []);
});

test('issue refuses port 9222 and bad inputs before any confirmation', async t => {
  const { store } = await setup(t, { issue: false });
  let asked = 0;
  const base = { providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true, confirm: async () => { asked++; return true; } };
  await assert.rejects(store.issue({ ...base, port: 9222 }), { code: 'GRANT_PORT_REFUSED' });
  await assert.rejects(store.issue({ ...base, fresh: false }), { code: 'GRANT_NOT_FRESH' });
  await assert.rejects(store.issue({ ...base, promptDigest: 'short' }), { code: 'GRANT_BAD_DIGEST' });
  await assert.rejects(store.issue({ ...base, maxSends: 0 }), { code: 'GRANT_BAD_MAX' });
  assert.equal(asked, 0);
});

test('issue requires confirm callback to return exactly true; otherwise nothing is written', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'harness-grant-confirm-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  // No injected confirm anywhere: the TTY default must apply, and with no TTY it throws.
  const store = createGrantStore({ dir, now: () => 1000, stdin: new PassThrough(), stdout: new PassThrough() });
  const base = { providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true };
  await assert.rejects(store.issue({ ...base, confirm: async () => false }), { code: 'GRANT_NOT_CONFIRMED' });
  await assert.rejects(store.issue({ ...base, confirm: async () => 'yes' }), { code: 'GRANT_NOT_CONFIRMED' });
  await assert.rejects(store.issue({ ...base, confirm: async () => { throw new Error('denied'); } }), { message: 'denied' });
  await assert.rejects(store.issue({ ...base, confirm: undefined }), { code: 'GRANT_NO_TTY' });
  assert.deepEqual((await readdir(dir)), []);
});

test('default confirm throws GRANT_NO_TTY without an interactive terminal', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'harness-grant-tty-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createGrantStore({ dir, now: () => 1, stdin: new PassThrough(), stdout: new PassThrough() });
  await assert.rejects(store.issue({ providers: ['chatgpt'], profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends: 1, expiresInMs: 1000, fresh: true }), { code: 'GRANT_NO_TTY' });
  await assert.rejects(ttyConfirm({ summary: { providers: ['chatgpt'] }, stdin: { isTTY: false }, stdout: { isTTY: true } }), { code: 'GRANT_NO_TTY' });
  assert.deepEqual(await readdir(dir), []);
});

test('default confirm with a TTY requires the exact typed phrase', async t => {
  const mkTty = () => { const s = new PassThrough(); s.isTTY = true; return s; };
  const summary = { providers: ['chatgpt'], profile: 'lab', port: 9333, maxSends: 1, expiresInMs: 1000 };
  const out = mkTty(); out.resume();
  const good = mkTty(); setTimeout(() => good.write('ISSUE chatgpt\n'), 5);
  assert.equal(await ttyConfirm({ summary, stdin: good, stdout: out }), true);
```

_First 80 of 177 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
