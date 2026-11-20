# File: harness/test/onboarding/compare-runner.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/onboarding/compare-runner.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13892 B |
| Lines | 235 |
| Hash | d8ff6998fa4c |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digest | function | 11 | no | const digest = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| PROMPT | const | 12 | no | const PROMPT = &#39;compare this onboarding prompt&#39;; |
| DIGEST | const | 13 | no | const DIGEST = digest(PROMPT); |
| POSIX | const | 14 | no | const POSIX = process.platform !== &#39;win32&#39;; |
| UUID | const | 15 | no | const UUID = &#39;0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f&#39;; |
| NATIVE | const | 16 | no | const NATIVE = `https://chatgpt.com/c/${UUID}`; |
| BASE | const | 17 | no | const BASE = &#39;https://chatgpt.com/&#39;; |
| fakeRouter | function | 21 | no | function fakeRouter({ statusFor = () =&gt; &#39;complete&#39;, replyFor = c =&gt; `reply text from ${c.provider}`, waitThreadFor = null, recordFor = c =&gt; ({ requestId: c.requestId, provider: c.provider, state: &#39;ob… |
| asks | const | 22 | no | const asks = [], waits = [], records = new Map(), attempts = []; |
| approvals | variable | 23 | no | let approvals = 0; |
| approval | const | 24 | no | const approval = { approve() { approvals++; throw new Error(&#39;runner must never approve&#39;); }, consume() { approvals++; throw new Error(&#39;runner must never approve&#39;); } }; |
| call | const | 37 | no | const call = asks.find(c =&gt; c.requestId === id); |
| status | const | 38 | no | const status = statusFor(call); |
| setup | function | 44 | no | async function setup(t, { maxSends = 5, providers = [&#39;chatgpt&#39;], issue = true } = {}) { |
| root | const | 45 | no | const root = await mkdtemp(join(tmpdir(), &#39;harness-runner-&#39;)); |
| grantDir | const | 47 | no | const grantDir = join(root, &#39;grants&#39;); |
| saveDir | const | 48 | no | const saveDir = join(root, &#39;out&#39;); |
| grants | const | 49 | no | const grants = createGrantStore({ dir: grantDir, now: () =&gt; 1000, confirm: async () =&gt; true }); |
| n | variable | 51 | no | let n = 0; |
| base | const | 52 | no | const base = { providers, prompt: PROMPT, grants, saveDir, now: () =&gt; 1000, idFor: p =&gt; `cmp-${p}-${++n}`, profile: &#39;lab&#39;, port: 9333, waitMs: 1, getRecord: null }; |
| router | const | 58 | no | const router = fakeRouter(); |
| out | const | 59 | no | const out = await runComparison({ ...base, providers: [&#39;chatgpt&#39;, &#39;claude&#39;], router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 68 | no | const router = fakeRouter(); |
| out | const | 69 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 77 | no | const router = fakeRouter(); |
| g | const | 78 | no | const g = { ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }; |
| again | const | 80 | no | const again = await runComparison({ ...g, idFor: () =&gt; &#39;cmp-second&#39; }); |
| router | const | 88 | no | const router = fakeRouter({ statusFor: c =&gt; (c.provider === &#39;chatgpt&#39; ? &#39;uncertain&#39; : &#39;complete&#39;) }); |
| out | const | 89 | no | const out = await runComparison({ ...base, providers: [&#39;chatgpt&#39;, &#39;claude&#39;], router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 97 | no | const router = fakeRouter({ askError: () =&gt; true }); |
| out | const | 98 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 106 | no | const router = fakeRouter(); |
| src | const | 109 | no | const src = await readFile(fileURLToPath(new URL(&#39;../../src/onboarding/compare-runner.mjs&#39;, import.meta.url)), &#39;utf8&#39;); |
| router | const | 115 | no | const router = fakeRouter(); |
| out | const | 116 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| requestId | const | 117 | no | const requestId = out.results[0].requestId; |
| raw | const | 119 | no | const raw = await readFile(join(saveDir, &#39;results.json&#39;), &#39;utf8&#39;); |
| router | const | 132 | no | const router = fakeRouter(); |
| out | const | 133 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 141 | no | const router = fakeRouter(); |
| out | const | 142 | no | const out = await runComparison({ ...base, providers: [&#39;no-such-site&#39;, &#39;chatgpt&#39;], router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 152 | no | const router = fakeRouter({ waitThreadFor: () =&gt; NATIVE, recordFor: c =&gt; ({ requestId: c.requestId, provider: c.provider, state: &#39;observed&#39; }) }); |
| out | const | 153 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 159 | no | const router = fakeRouter({ recordFor: c =&gt; ({ requestId: c.requestId, provider: c.provider, threadUrl: NATIVE }) }); |
| out | const | 160 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 166 | no | const router = fakeRouter({ recordFor: c =&gt; ({ requestId: c.requestId, provider: c.provider, threadUrl: BASE }) }); |
| out | const | 167 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 173 | no | const router = fakeRouter({ waitThreadFor: () =&gt; NATIVE, recordFor: () =&gt; null }); |
| out | const | 174 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 190 | no | const router = fakeRouter({ statusFor: () =&gt; &#39;pending_approval&#39; }); |
| out | const | 191 | no | const out = await runComparison({ ...base, router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 198 | no | const router = fakeRouter(); |
| out | const | 199 | no | const out = await runComparison({ ...base, providers: [&#39;chatgpt&#39;, &#39;claude&#39;], router, getRecord: async id =&gt; router.records.get(id) ?? null, saveDir }); |
| router | const | 207 | no | const router = fakeRouter(); |
| repo | const | 215 | no | const repo = join(root, &#39;repo&#39;); |
| router | const | 217 | no | const router = fakeRouter(); |
| router | const | 224 | no | const router = fakeRouter(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| node:url | import | 7 | external |
| ../../src/onboarding/grant.mjs | import | 8 | [harness/src/onboarding/grant.mjs](../../src/onboarding/grant.mjs.md) |
| ../../src/onboarding/compare-runner.mjs | import | 9 | [harness/src/onboarding/compare-runner.mjs](../../src/onboarding/compare-runner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createGrantStore } from '../../src/onboarding/grant.mjs';
import { runComparison, threadUrlKind, assertSaveDirAllowed } from '../../src/onboarding/compare-runner.mjs';

const digest = text => createHash('sha256').update(text, 'utf8').digest('hex');
const PROMPT = 'compare this onboarding prompt';
const DIGEST = digest(PROMPT);
const POSIX = process.platform !== 'win32';
const UUID = '0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f';
const NATIVE = `https://chatgpt.com/c/${UUID}`;
const BASE = 'https://chatgpt.com/';

// Local stand-in for the router's journal-backed surface. Unlike the shared fake, it honours the requestId the
// runner passes, keeps a journal-style record per request, and can return a threadUrl from wait() on purpose.
function fakeRouter({ statusFor = () => 'complete', replyFor = c => `reply text from ${c.provider}`, waitThreadFor = null, recordFor = c => ({ requestId: c.requestId, provider: c.provider, state: 'observed', submitted: 'yes' }), askError = null } = {}) {
  const asks = [], waits = [], records = new Map(), attempts = [];
  let approvals = 0;
  const approval = { approve() { approvals++; throw new Error('runner must never approve'); }, consume() { approvals++; throw new Error('runner must never approve'); } };
  return {
    asks, waits, records, attempts, approval,
    get approvalCalls() { return approvals; },
    async ask(req) {
      attempts.push(req.requestId);
      if (askError && askError(req)) { const e = new Error('journal write failed'); e.code = 'JOURNAL_FAILED'; throw e; }
      asks.push(req);
      records.set(req.requestId, recordFor({ ...req }));
      return { requestId: req.requestId, status: 'pending_approval', provider: req.provider };
    },
    async wait(id) {
      waits.push(id);
      const call = asks.find(c => c.requestId === id);
      const status = statusFor(call);
      return { requestId: id, status, ...(status === 'complete' ? { reply: replyFor(call) } : {}), ...(waitThreadFor ? { threadUrl: waitThreadFor(call) } : {}) };
    }
  };
}

async function setup(t, { maxSends = 5, providers = ['chatgpt'], issue = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'harness-runner-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const grantDir = join(root, 'grants');
  const saveDir = join(root, 'out');
  const grants = createGrantStore({ dir: grantDir, now: () => 1000, confirm: async () => true });
  if (issue) await grants.issue({ providers, profile: 'lab', port: 9333, promptDigest: DIGEST, maxSends, expiresInMs: 60000, fresh: true });
  let n = 0;
  const base = { providers, prompt: PROMPT, grants, saveDir, now: () => 1000, idFor: p => `cmp-${p}-${++n}`, profile: 'lab', port: 9333, waitMs: 1, getRecord: null };
  return { root, saveDir, grants, base, grantDir };
}

test('calls ask once per provider with threadUrl new and a unique requestId', async t => {
  const { base, saveDir } = await setup(t, { providers: ['chatgpt', 'claude'] });
  const router = fakeRouter();
  const out = await runComparison({ ...base, providers: ['chatgpt', 'claude'], router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(router.asks.length, 2);
  assert.ok(router.asks.every(a => a.threadUrl === 'new' && a.prompt === PROMPT));
  assert.notEqual(router.asks[0].requestId, router.asks[1].requestId);
  assert.deepEqual(out.results.map(r => r.status), ['complete', 'complete']);
});

test('uses a grant: a send with no grant is denied and never asked', async t => {
  const { base, saveDir } = await setup(t, { issue: false });
  const router = fakeRouter();
  const out = await runComparison({ ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir });
  assert.equal(router.attempts.length, 0);
  assert.equal(out.results[0].status, 'denied');
  assert.equal(out.results[0].error, 'NO_GRANT');
});

test('grant consumption is one-shot per provider: a second run cannot reuse the same slot', async t => {
  const { base, saveDir } = await setup(t, { maxSends: 1 });
  const router = fakeRouter();
  const g = { ...base, router, getRecord: async id => router.records.get(id) ?? null, saveDir };
  assert.equal((await runComparison(g)).results[0].status, 'complete');
  const again = await runComparison({ ...g, idFor: () => 'cmp-second' });
```

_First 80 of 236 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
