# File: apps/vivim-host/media/library-summary.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/media/library-summary.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5207 B |
| Lines | 105 |
| Hash | 93bda87dd75d |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MEDIA_SUMMARY_SCHEMA | const | 7 | yes | export const MEDIA_SUMMARY_SCHEMA = &#39;vivim.media-library-summary/1&#39;; |
| mediaIdFor | function | 9 | yes | export const mediaIdFor = id =&gt; typeof id === &#39;string&#39; &amp;&amp; id.length &gt; 0 &amp;&amp; id.length &lt;= 256 |
| MAX_BYTES | const | 11 | no | const MAX_BYTES = 1024 * 1024; |
| MAX_ITEMS | const | 12 | no | const MAX_ITEMS = 25; |
| MEDIA_PAGE_SIZE | const | 13 | yes | export const MEDIA_PAGE_SIZE = MAX_ITEMS; |
| MAX_MEDIA_OFFSET | const | 14 | yes | export const MAX_MEDIA_OFFSET = 100000; |
| VALID_STATES | const | 15 | no | const VALID_STATES = new Set([&#39;dispatched&#39;, &#39;folder-detected&#39;, &#39;complete&#39;, &#39;seeded&#39;]); |
| VALID_KINDS | const | 16 | no | const VALID_KINDS = new Set([&#39;movie&#39;, &#39;show&#39;]); |
| noStore | function | 17 | no | const noStore = reason =&gt; ({ schema: MEDIA_SUMMARY_SCHEMA, state: &#39;unavailable&#39;, reason, total: 0, shown: 0, hasMore: false, favorites: 0, items: [], playback: &#39;not-integrated&#39; }); |
| bounded | function | 22 | no | const bounded = (value, max) =&gt; typeof value === &#39;string&#39; |
| collection | function | 25 | no | async function collection(dir, file, required = false) { |
| full | const | 26 | no | const full = path.join(dir, file); |
| info | variable | 27 | no | let info; |
| value | const | 35 | no | const value = JSON.parse(await readFile(full, &#39;utf8&#39;)); |
| readMediaLibrarySummary | function | 46 | yes | export async function readMediaLibrarySummary({ storeDir = process.env.VIVIM_MEDIA_STORE_DIR \|\| (process.platform === &#39;win32&#39; ? &#39;C:/VIVIM/channel/vivim/torrent-store&#39; : null), offset = 0 } = {}) { |
| dir | const | 56 | no | const dir = await lstat(storeDir); |
| library | const | 58 | no | const library = await collection(storeDir, &#39;library.json&#39;, true); |
| favorites | const | 59 | no | const favorites = await collection(storeDir, &#39;favorites.json&#39;); |
| favoriteIds | const | 60 | no | const favoriteIds = new Set(favorites.entries .map(row =&gt; typeof row?.id === &#39;string&#39; ? row.id : &#39;&#39;).filter(Boolean)); |
| rows | const | 62 | no | const rows = library.entries.filter(row =&gt; row &amp;&amp; VALID_KINDS.has(row.kind) &amp;&amp; VALID_STATES.has(row.state) &amp;&amp; bounded(row.title, 160)); |
| normalized | const | 64 | no | const normalized = rows.map(row =&gt; ({ title: bounded(row.title, 160), ...(mediaIdFor(row.id) ? { mediaId: mediaIdFor(row.id) } : {}), kind: row.kind, state: row.state, |
| items | const | 73 | no | const items = normalized.slice(offset, offset + MAX_ITEMS); |
| findPlayableMediaEntry | function | 90 | yes | export async function findPlayableMediaEntry({storeDir, mediaId} = {}) { |
| root | const | 95 | no | const root = await lstat(storeDir); |
| library | const | 97 | no | const library = await collection(storeDir, &#39;library.json&#39;, true); |
| found | const | 98 | no | const found = library.entries.filter(row =&gt; row &amp;&amp; VALID_KINDS.has(row.kind) &amp;&amp; row.state === &#39;complete&#39; &amp;&amp; bounded(row.title, 160) &amp;&amp; mediaIdFor(row.id) === mediaId); |
| row | const | 102 | no | const row = found[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 3 | external |
| node:path | import | 4 | external |
| node:crypto | import | 5 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/media/playback.mjs](./playback.mjs.md) | ./library-summary.mjs |
| [apps/vivim-host/test/media-library-summary.test.mjs](../test/media-library-summary.test.mjs.md) | ../media/library-summary.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Read-only adapter for the existing HQ media library. It never scans media paths,
// dispatches downloads, serves bytes, or infers that a completed torrent is playable.
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const MEDIA_SUMMARY_SCHEMA = 'vivim.media-library-summary/1';
// Opaque stable catalog address; never expose HQ's source ID, URL or info hash.
export const mediaIdFor = id => typeof id === 'string' && id.length > 0 && id.length <= 256
  ? createHash('sha256').update('vivim.media/1:' + id).digest('hex').slice(0, 32) : null;
const MAX_BYTES = 1024 * 1024;
const MAX_ITEMS = 25;
export const MEDIA_PAGE_SIZE = MAX_ITEMS;
export const MAX_MEDIA_OFFSET = 100000;
const VALID_STATES = new Set(['dispatched', 'folder-detected', 'complete', 'seeded']);
const VALID_KINDS = new Set(['movie', 'show']);
const noStore = reason => ({
  schema: MEDIA_SUMMARY_SCHEMA, state: 'unavailable', reason,
  total: 0, shown: 0, hasMore: false, favorites: 0, items: [],
  playback: 'not-integrated'
});
const bounded = (value, max) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

async function collection(dir, file, required = false) {
  const full = path.join(dir, file);
  let info;
  try { info = await lstat(full); }
  catch (error) {
    if (error.code === 'ENOENT' && !required) return { entries: [] };
    throw error;
  }
  if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_BYTES)
    throw new Error('MEDIA_COLLECTION_UNSAFE');
  const value = JSON.parse(await readFile(full, 'utf8'));
  if (!value || typeof value !== 'object' || !Array.isArray(value.entries))
    throw new Error('MEDIA_COLLECTION_INVALID');
  return value;
}

/**
 * The same owner-configured store used by repos-hq/hq/lib/torrent/library.mjs.
 * No filesystem path, source URL, info hash, magnet, or downloaded bytes leave the Host.
 * Reading a missing store returns an explicit unavailable state, never invented content.
 */
export async function readMediaLibrarySummary({
  storeDir = process.env.VIVIM_MEDIA_STORE_DIR ||
    (process.platform === 'win32' ? 'C:/VIVIM/channel/vivim/torrent-store' : null),
  offset = 0
} = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > MAX_MEDIA_OFFSET)
    return noStore('MEDIA_OFFSET_INVALID');
  if (typeof storeDir !== 'string' || !path.isAbsolute(storeDir) || storeDir.includes('\u0000'))
    return noStore('MEDIA_STORE_NOT_CONFIGURED');
  try {
    const dir = await lstat(storeDir);
    if (!dir.isDirectory() || dir.isSymbolicLink()) return noStore('MEDIA_STORE_UNSAFE');
    const library = await collection(storeDir, 'library.json', true);
    const favorites = await collection(storeDir, 'favorites.json');
    const favoriteIds = new Set(favorites.entries
      .map(row => typeof row?.id === 'string' ? row.id : '').filter(Boolean));
    const rows = library.entries.filter(row => row && VALID_KINDS.has(row.kind) &&
      VALID_STATES.has(row.state) && bounded(row.title, 160));
    const normalized = rows.map(row => ({
      title: bounded(row.title, 160),
      ...(mediaIdFor(row.id) ? { mediaId: mediaIdFor(row.id) } : {}),
      kind: row.kind,
      state: row.state,
      favorite: typeof row.id === 'string' && favoriteIds.has(row.id)
    }));
    normalized.sort((a, b) => Number(b.favorite) - Number(a.favorite) ||
      a.title.localeCompare(b.title) || a.kind.localeCompare(b.kind));
    const items = normalized.slice(offset, offset + MAX_ITEMS);
    return {
      schema: MEDIA_SUMMARY_SCHEMA, state: 'ready', reason: null,
      total: rows.length, offset, pageSize: MAX_ITEMS, shown: items.length,
      hasMore: rows.length > offset + items.length,
      favorites: normalized.filter(row => row.favorite).length,
      items, playback: 'not-integrated'
    };
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
