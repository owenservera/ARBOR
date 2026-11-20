# File: apps/mobile-relay/test/redis-store.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/redis-store.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1164 B |
| Lines | 16 |
| Hash | 0223ce21f801 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| db | const | 4 | no | const db = new Map(); const calls = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| ../lib/redis-store.mjs | dynamic | 11 | [apps/mobile-relay/lib/redis-store.mjs](../lib/redis-store.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test'; import assert from 'node:assert/strict';
test('redisStore round-trips commands and status via REST', async () => {
  process.env.KV_REST_API_URL = 'https://fake'; process.env.KV_REST_API_TOKEN = 't';
  const db = new Map(); const calls = [];
  globalThis.fetch = async (_, o) => { const [c, k, ...a] = JSON.parse(o.body); calls.push(c); let result = null;
    if (c === 'HSET') { const h = db.get(k) || new Map(); h.set(a[0], a[1]); db.set(k, h); result = 1; }
    if (c === 'HVALS') result = [...(db.get(k) || new Map()).values()];
    if (c === 'SET') { db.set(k, a[0]); assert.deepEqual(a.slice(1), ['EX', 3600]); result = 'OK'; }
    if (c === 'GET') result = db.get(k) ?? null;
    return { ok: true, json: async () => ({ result }) }; };
  const { redisStore } = await import('../lib/redis-store.mjs'); const s = redisStore();
  assert.equal(await s.latestStatus(), null);
  await s.putCommand({ id: 'a', rev: 1 }); await s.putCommand({ id: 'a', rev: 2 });
  assert.deepEqual(await s.listCommands(), [{ id: 'a', rev: 2 }]);
  await s.putStatus({ at: 1 }); assert.deepEqual(await s.latestStatus(), { at: 1 });
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
