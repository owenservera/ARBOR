# File: harness/test/interface/standing-unlimited.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/standing-unlimited.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3547 B |
| Lines | 64 |
| Hash | cc0d4d263ac4 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| YEARS | const | 8 | no | const YEARS = 10 * 365 * 24 * 3600000; |
| setup | function | 10 | no | async function setup(t, { clock = { t: 1000 } } = {}) { |
| dir | const | 11 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-standing-unl-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| standing | const | 12 | no | const standing = createStanding({ dir, now: () =&gt; clock.t, verifyLabProfile: async () =&gt; true }); |
| dir | const | 48 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-standing-unl-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| standing | const | 49 | no | const standing = createStanding({ dir, now: () =&gt; 1000, verifyLabProfile: async () =&gt; false }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../src/interface/standing.mjs | import | 6 | [harness/src/interface/standing.mjs](../../src/interface/standing.mjs.md) |

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
import { createStanding } from '../../src/interface/standing.mjs';

const YEARS = 10 * 365 * 24 * 3600000;

async function setup(t, { clock = { t: 1000 } } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-standing-unl-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const standing = createStanding({ dir, now: () => clock.t, verifyLabProfile: async () => true });
  return { dir, standing, clock };
}

test('unlimited hours and sends record no expiry and no send cap', async t => {
  const { standing } = await setup(t);
  const record = await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  assert.equal(record.expiresAt, null);
  assert.equal(record.maxSends, null);
  assert.equal((await standing.status()).active, true);
});

test('unlimited standing still passes check years later', async t => {
  const { standing, clock } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  clock.t += YEARS;
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'hi' }), { ok: true });
});

test('provider * matches every provider id', async t => {
  const { standing } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  for (const provider of ['qwen', 'chatgpt', 'claude', 'gemini']) {
    assert.deepEqual(await standing.check({ provider, threadUrl: 'new', prompt: 'hi' }), { ok: true });
  }
});

test('unlimited sends keep counting without a cap', async t => {
  const { standing } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  for (let i = 0; i < 25; i++) await standing.recordSend();
  assert.equal((await standing.status()).record.sent, 25);
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'hi' }), { ok: true });
});

test('lab profile check still applies to unlimited standing', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'wh-standing-unl-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const standing = createStanding({ dir, now: () => 1000, verifyLabProfile: async () => false });
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'hi' }), { ok: false, reason: 'LAB_PROFILE_NOT_VERIFIED' });
});

test('bounded enable still validates hours and max sends', async t => {
  const { standing } = await setup(t);
  await assert.rejects(standing.enable({ provider: 'qwen', hours: 0, maxSends: 5, confirmText: 'ENABLE qwen' }), { code: 'STANDING_BAD_HOURS' });
  await assert.rejects(standing.enable({ provider: 'qwen', hours: 8, maxSends: 0, confirmText: 'ENABLE qwen' }), { code: 'STANDING_BAD_MAX' });
});

test('draft-free and prompt-length rules still apply to unlimited standing', async t => {
  const { standing } = await setup(t);
  await standing.enable({ provider: '*', hours: null, maxSends: null, confirmText: 'ENABLE *' });
  assert.deepEqual(await standing.check({ provider: 'qwen', threadUrl: 'new', prompt: 'x'.repeat(2001) }), { ok: false, reason: 'PROMPT_TOO_LONG' });
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
