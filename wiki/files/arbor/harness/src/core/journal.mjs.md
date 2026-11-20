# File: harness/src/core/journal.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/journal.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2676 B |
| Lines | 41 |
| Hash | 42bf2e978b54 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digestPayload | function | 5 | yes | export const digestPayload = value =&gt; createHash(&#39;sha256&#39;).update(value, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| threadKeyFor | function | 6 | yes | export function threadKeyFor(provider, threadUrl) { |
| id | const | 7 | no | const id = typeof provider === &#39;string&#39; ? provider : provider.id; |
| fields | const | 10 | no | const fields = new Set([&#39;requestId&#39;,&#39;provider&#39;,&#39;threadKey&#39;,&#39;payloadDigest&#39;,&#39;state&#39;,&#39;submitted&#39;,&#39;boundary&#39;,&#39;replyDigest&#39;,&#39;threadUrl&#39;,&#39;createdAt&#39;,&#39;updatedAt&#39;,&#39;reason&#39;,&#39;requestedModel&#39;,&#39;model&#39;,&#39;routing&#39;… |
| clean | function | 11 | no | function clean(rec) { |
| out | const | 12 | no | const out = {}; |
| createJournal | function | 17 | yes | export function createJournal({ dir }) { |
| file | function | 18 | no | const file = id =&gt; { |
| read | function | 22 | no | async function read(id) { try { return JSON.parse(await readFile(file(id), &#39;utf8&#39;)); } catch (e) { if (e.code === &#39;ENOENT&#39;) return null; throw e; } } |
| path | const | 25 | no | const path = file(rec.requestId); await mkdir(dir, { recursive: true }); |
| now | const | 26 | no | const now = new Date().toISOString(); |
| data | const | 27 | no | const data = clean({ state:&#39;accepted&#39;, submitted:&#39;no&#39;, boundary:null, replyDigest:null, reason:null, ...rec, createdAt:now, updatedAt:now }); |
| old | const | 32 | no | const old = await read(id); if (!old) throw new Error(&#39;Journal request not found&#39;); |
| data | const | 33 | no | const data = clean({ ...old, ...patch, requestId:id, updatedAt:new Date().toISOString() }); |
| temp | const | 34 | no | const temp = `${file(id)}.${randomUUID()}.tmp`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 1 | external |
| node:fs/promises | import | 2 | external |
| node:path | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/agents/roundrobin.mjs](../agents/roundrobin.mjs.md) | ../core/journal.mjs |
| [harness/src/core/reply.mjs](./reply.mjs.md) | ./journal.mjs |
| [harness/src/core/send.mjs](./send.mjs.md) | ./journal.mjs |
| [harness/src/core/send.mjs](./send.mjs.md) | ./journal.mjs |
| [harness/test/agents/roundrobin.test.mjs](../../test/agents/roundrobin.test.mjs.md) | ../../src/core/journal.mjs |
| [harness/test/core/core.test.mjs](../../test/core/core.test.mjs.md) | ../../src/core/journal.mjs |
| [harness/test/core/g3-reply.test.mjs](../../test/core/g3-reply.test.mjs.md) | ../../src/core/journal.mjs |
| [harness/test/core/reply-error.test.mjs](../../test/core/reply-error.test.mjs.md) | ../../src/core/journal.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const digestPayload = value => createHash('sha256').update(value, 'utf8').digest('hex');
export function threadKeyFor(provider, threadUrl) {
  const id = typeof provider === 'string' ? provider : provider.id;
  return `${id}:${threadUrl === 'new' || threadUrl == null ? 'new' : new URL(threadUrl).href}`;
}
const fields = new Set(['requestId','provider','threadKey','payloadDigest','state','submitted','boundary','replyDigest','threadUrl','createdAt','updatedAt','reason','requestedModel','model','routing']);
function clean(rec) {
  const out = {};
  for (const [k,v] of Object.entries(rec)) if (fields.has(k)) out[k] = v;
  if (out.boundary) out.boundary = { userTurns: out.boundary.userTurns, assistantTurns: out.boundary.assistantTurns };
  return out;
}
export function createJournal({ dir }) {
  const file = id => {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid requestId');
    return join(dir, `${id}.json`);
  };
  async function read(id) { try { return JSON.parse(await readFile(file(id), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
  return {
    async create(rec) {
      const path = file(rec.requestId); await mkdir(dir, { recursive: true });
      const now = new Date().toISOString();
      const data = clean({ state:'accepted', submitted:'no', boundary:null, replyDigest:null, reason:null, ...rec, createdAt:now, updatedAt:now });
      try { const h = await open(path, 'wx', 0o600); try { await h.writeFile(JSON.stringify(data)); } finally { await h.close(); } return { created:true, existing:null }; }
      catch (e) { if (e.code === 'EEXIST') return { created:false, existing:await read(rec.requestId) }; throw e; }
    },
    async update(id, patch) {
      const old = await read(id); if (!old) throw new Error('Journal request not found');
      const data = clean({ ...old, ...patch, requestId:id, updatedAt:new Date().toISOString() });
      const temp = `${file(id)}.${randomUUID()}.tmp`;
      try { const h = await open(temp, 'wx', 0o600); try { await h.writeFile(JSON.stringify(data)); } finally { await h.close(); } await rename(temp, file(id)); }
      finally { await unlink(temp).catch(() => {}); }
      return data;
    }, read,
    async list() { await mkdir(dir, { recursive:true }); const names = await readdir(dir); return Promise.all(names.filter(n => /^[A-Za-z0-9_-]{1,128}\.json$/.test(n)).map(n => read(n.slice(0,-5)))); }
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
