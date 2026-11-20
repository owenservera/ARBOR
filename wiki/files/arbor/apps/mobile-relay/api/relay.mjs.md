# File: apps/mobile-relay/api/relay.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/api/relay.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1286 B |
| Lines | 16 |
| Hash | b121f8143ade |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| relay | variable | 4 | no | let relay; |
| handler | function | 5 | yes | export default async function handler(req, res) { |
| path | const | 8 | no | const path = String(new URL(req.url, &#39;http://x&#39;).searchParams.get(&#39;path&#39;) \|\| &#39;&#39;).replace(/^\\/+\|\\/+$/g, &#39;&#39;); |
| body | const | 11 | no | const body = typeof req.body === &#39;string&#39; ? JSON.parse(req.body \|\| &#39;{}&#39;) : (req.body ?? {}); |
| out | const | 12 | no | const out = await relay({ method: req.method, path, req, body }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../lib/relay-core.mjs | import | 2 | [apps/mobile-relay/lib/relay-core.mjs](../lib/relay-core.mjs.md) |
| ../lib/redis-store.mjs | import | 3 | [apps/mobile-relay/lib/redis-store.mjs](../lib/redis-store.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored. Single Vercel function; vercel.json rewrites /api/<path> here.
import { createRelay } from '../lib/relay-core.mjs';
import { redisStore } from '../lib/redis-store.mjs';
let relay;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const path = String(new URL(req.url, 'http://x').searchParams.get('path') || '').replace(/^\/+|\/+$/g, '');
    if (req.method === 'POST' && !String(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('JSON required'), { status: 415 });
    relay ??= createRelay({ store: redisStore(), env: process.env });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const out = await relay({ method: req.method, path, req, body });
    if (out.cookie) res.setHeader('Set-Cookie', out.cookie);
    res.statusCode = out.status; res.end(out.status === 204 ? '' : JSON.stringify(out.body));
  } catch (e) { if (!e.status) console.error('relay error', e?.name, String(e?.message || e).slice(0, 300)); res.statusCode = e.status || 500; res.end(JSON.stringify({ error: e.status ? e.message : 'Relay error' })); }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
