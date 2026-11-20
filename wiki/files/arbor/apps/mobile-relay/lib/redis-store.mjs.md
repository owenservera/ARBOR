# File: apps/mobile-relay/lib/redis-store.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/lib/redis-store.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1278 B |
| Lines | 17 |
| Hash | c904ffecdf70 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| env | const | 3 | no | const env = process.env; |
| url | function | 4 | no | const url = () =&gt; env.KV_REST_API_URL \|\| env.UPSTASH_REDIS_REST_URL; |
| token | function | 5 | no | const token = () =&gt; env.KV_REST_API_TOKEN \|\| env.UPSTASH_REDIS_REST_TOKEN; |
| cmd | function | 6 | no | async function cmd(...args) { |
| r | const | 7 | no | const r = await fetch(url(), { method: &#39;POST&#39;, headers: { authorization: `Bearer ${token()}`, &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify(args) }); |
| j | const | 8 | no | const j = await r.json(); if (!r.ok \|\| j.error) throw new Error(`Redis: ${j.error \|\| r.status}`); return j.result; |
| redisStore | function | 10 | yes | export function redisStore() { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/api/relay.mjs](../api/relay.mjs.md) | ../lib/redis-store.mjs |
| [apps/mobile-relay/test/redis-store.test.mjs](../test/redis-store.test.mjs.md) | ../lib/redis-store.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored. Upstash Redis (REST) store, same interface as blob-store.mjs. Uses KV_REST_API_URL/TOKEN (Vercel Upstash integration).
// Commands: one hash field per command id (latest rev only, written atomically, rev-guarded by caller); status: one key with TTL.
const env = process.env;
const url = () => env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const token = () => env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
async function cmd(...args) {
  const r = await fetch(url(), { method: 'POST', headers: { authorization: `Bearer ${token()}`, 'content-type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json(); if (!r.ok || j.error) throw new Error(`Redis: ${j.error || r.status}`); return j.result;
}
export function redisStore() {
  return {
    async listCommands() { const h = await cmd('HVALS', 'vivim:cmd') || []; return h.map(v => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean); },
    async putCommand(r) { await cmd('HSET', 'vivim:cmd', r.id, JSON.stringify(r)); },
    async putStatus(s) { await cmd('SET', 'vivim:status', JSON.stringify(s), 'EX', 3600); },
    async latestStatus() { const v = await cmd('GET', 'vivim:status'); return v ? JSON.parse(v) : null; },
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
