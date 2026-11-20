# File: apps/mobile-relay/lib/blob-store.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/lib/blob-store.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1497 B |
| Lines | 17 |
| Hash | d6018c5e4de8 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| read | function | 3 | no | const read = async pathname =&gt; { const r = await get(pathname, { access: &#39;private&#39; }); return r ? JSON.parse(await new Response(r.stream).text()) : null; }; |
| all | function | 4 | no | const all = async prefix =&gt; { const out = []; let cursor; do { const p = await list({ prefix, cursor, limit: 1000 }); out.push(...p.blobs); cursor = p.hasMore ? p.cursor : undefined; } while (cursor)… |
| opts | const | 5 | no | const opts = { access: &#39;private&#39;, contentType: &#39;application/json&#39;, addRandomSuffix: false }; |
| blobStore | function | 6 | yes | export function blobStore() { |
| old | const | 13 | no | const old = (await all(&#39;status/&#39;)).sort((a, b) =&gt; b.pathname.localeCompare(a.pathname)).slice(5); if (old.length) await del(old.map(b =&gt; b.url)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| @vercel/blob | import | 2 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored. Vercel Blob (private) store: append-only revision blobs, no overwrites (no stale CDN reads).
import { list, get, put, del } from '@vercel/blob';
const read = async pathname => { const r = await get(pathname, { access: 'private' }); return r ? JSON.parse(await new Response(r.stream).text()) : null; };
const all = async prefix => { const out = []; let cursor; do { const p = await list({ prefix, cursor, limit: 1000 }); out.push(...p.blobs); cursor = p.hasMore ? p.cursor : undefined; } while (cursor); return out; };
const opts = { access: 'private', contentType: 'application/json', addRandomSuffix: false };
export function blobStore() {
  return {
    async listCommands() { return (await Promise.all((await all('cmd/')).map(b => read(b.pathname).catch(() => null)))).filter(Boolean); },
    async putCommand(r) { await put(`cmd/${r.id}/${String(r.rev).padStart(4, '0')}.json`, JSON.stringify(r), opts); },
    async putStatus(s) {
      await put(`status/${Date.now().toString().padStart(15, '0')}.json`, JSON.stringify(s), opts);
      if (Math.random() > 0.1) return; // prune occasionally: list+del on every write burns Blob ops
      const old = (await all('status/')).sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(5); if (old.length) await del(old.map(b => b.url));
    },
    async latestStatus() { const b = (await all('status/')).sort((a, b) => b.pathname.localeCompare(a.pathname))[0]; return b ? read(b.pathname) : null; },
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
