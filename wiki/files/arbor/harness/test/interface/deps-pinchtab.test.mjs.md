# File: harness/test/interface/deps-pinchtab.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/deps-pinchtab.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3691 B |
| Lines | 88 |
| Hash | f954b2a7e865 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KEYS | const | 5 | no | const KEYS = [&#39;WH_DRIVER&#39;, &#39;PINCHTAB_BASE_URL&#39;, &#39;PINCHTAB_INSTANCE_ID&#39;, &#39;PINCHTAB_TOKEN&#39;]; |
| withEnv | function | 8 | no | async function withEnv(env, fn) { |
| saved | const | 9 | no | const saved = Object.fromEntries(KEYS.map(k =&gt; [k, process.env[k]])); |
| countGlobalFetch | function | 23 | no | async function countGlobalFetch(fn) { |
| original | const | 24 | no | const original = globalThis.fetch; |
| count | variable | 25 | no | let count = 0; |
| deps | const | 37 | no | const deps = await dependencies(); |
| deps | const | 44 | no | const deps = await dependencies(); |
| deps | const | 51 | no | const deps = await dependencies(); |
| fetches | const | 52 | no | const fetches = await countGlobalFetch(async () =&gt; { await assert.rejects(deps.connect({ host: &#39;127.0.0.1&#39;, port: 9222 }), { code: &#39;CDP_PORT_REFUSED&#39; }); }); |
| deps | const | 61 | no | const deps = await dependencies(); |
| fetches | const | 62 | no | const fetches = await countGlobalFetch(async () =&gt; { await assert.rejects(deps.connect({ host: &#39;192.168.1.5&#39;, port: 9333 }), { code: &#39;CDP_PORT_REFUSED&#39; }); }); |
| deps | const | 71 | no | const deps = await dependencies(); |
| fetches | const | 72 | no | const fetches = await countGlobalFetch(async () =&gt; { const err = await deps.connect({ host: &#39;127.0.0.1&#39;, port: 9333 }).then(() =&gt; null, e =&gt; e); assert.ok(err, &#39;must reject&#39;); assert.equal(typeof err… |
| err | const | 73 | no | const err = await deps.connect({ host: &#39;127.0.0.1&#39;, port: 9333 }).then(() =&gt; null, e =&gt; e); |
| fake | function | 84 | no | const fake = async () =&gt; &#39;fake-browser&#39;; |
| deps | const | 85 | no | const deps = await dependencies({ connect: fake }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/interface/deps.mjs | import | 3 | [harness/src/interface/deps.mjs](../../src/interface/deps.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { dependencies } from '../../src/interface/deps.mjs';

const KEYS = ['WH_DRIVER', 'PINCHTAB_BASE_URL', 'PINCHTAB_INSTANCE_ID', 'PINCHTAB_TOKEN'];

// Sets the given env vars (others unset), runs fn, then restores the originals.
async function withEnv(env, fn) {
  const saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
  try {
    for (const k of KEYS) delete process.env[k];
    for (const [k, v] of Object.entries(env)) process.env[k] = v;
    return await fn();
  } finally {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

// Counts every global fetch call made while fn runs. Restores global fetch afterwards.
async function countGlobalFetch(fn) {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async () => { count += 1; throw new Error('network must not be used in this test'); };
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
  return count;
}

test('default driver (WH_DRIVER unset): connect refuses port 9222 with CDP_PORT_REFUSED', async () => {
  await withEnv({}, async () => {
    const deps = await dependencies();
    await assert.rejects(deps.connect({ host: '127.0.0.1', port: 9222 }), { code: 'CDP_PORT_REFUSED' });
  });
});

test('WH_DRIVER=other keeps raw CDP default: connect refuses port 9222 with CDP_PORT_REFUSED', async () => {
  await withEnv({ WH_DRIVER: 'cdp' }, async () => {
    const deps = await dependencies();
    await assert.rejects(deps.connect({ host: '127.0.0.1', port: 9222 }), { code: 'CDP_PORT_REFUSED' });
  });
});

test('WH_DRIVER=pinchtab: connect refuses port 9222 with CDP_PORT_REFUSED and makes no fetch', async () => {
  await withEnv({ WH_DRIVER: 'pinchtab', PINCHTAB_INSTANCE_ID: 'inst_1', PINCHTAB_TOKEN: 'tok-SECRET-123' }, async () => {
    const deps = await dependencies();
    const fetches = await countGlobalFetch(async () => {
      await assert.rejects(deps.connect({ host: '127.0.0.1', port: 9222 }), { code: 'CDP_PORT_REFUSED' });
    });
    assert.equal(fetches, 0);
  });
});

test('WH_DRIVER=pinchtab: connect refuses non-loopback host with CDP_PORT_REFUSED and makes no fetch', async () => {
  await withEnv({ WH_DRIVER: 'pinchtab', PINCHTAB_INSTANCE_ID: 'inst_1', PINCHTAB_TOKEN: 'tok-SECRET-123' }, async () => {
    const deps = await dependencies();
    const fetches = await countGlobalFetch(async () => {
      await assert.rejects(deps.connect({ host: '192.168.1.5', port: 9333 }), { code: 'CDP_PORT_REFUSED' });
    });
    assert.equal(fetches, 0);
  });
});

test('WH_DRIVER=pinchtab with PINCHTAB_INSTANCE_ID / PINCHTAB_TOKEN unset: connect(9333) rejects with a coded error and makes no network call', async () => {
  await withEnv({ WH_DRIVER: 'pinchtab' }, async () => {
    const deps = await dependencies();
    const fetches = await countGlobalFetch(async () => {
      const err = await deps.connect({ host: '127.0.0.1', port: 9333 }).then(() => null, e => e);
      assert.ok(err, 'must reject');
      assert.equal(typeof err.code, 'string');
      assert.ok(err.code.startsWith('PINCHTAB_'), `unexpected code ${err.code}`);
    });
    assert.equal(fetches, 0);
  });
});
```

_First 80 of 89 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
