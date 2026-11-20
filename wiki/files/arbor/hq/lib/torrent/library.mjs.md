# File: hq/lib/torrent/library.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/library.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9514 B |
| Lines | 256 |
| Hash | 5d5115606639 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LIBRARY_STATES | const | 24 | yes | export const LIBRARY_STATES = [&#39;dispatched&#39;, &#39;folder-detected&#39;, &#39;complete&#39;, &#39;seeded&#39;]; |
| LIBRARY_KINDS | const | 25 | no | const LIBRARY_KINDS = new Set([&#39;show&#39;, &#39;movie&#39;]); |
| loadLibrary | function | 28 | yes | export function loadLibrary(path) { |
| loadFavorites | function | 33 | yes | export function loadFavorites(path) { |
| loadCollection | function | 37 | no | function loadCollection(path, name) { |
| data | const | 39 | no | const data = JSON.parse(readFileSync(path, &#39;utf8&#39;)); |
| addLibraryEntry | function | 55 | yes | export function addLibraryEntry(path, entry, { journalPath } = {}) { |
| store | const | 65 | no | const store = loadLibrary(path); |
| stored | const | 69 | no | const stored = { |
| addSeededLibraryEntry | function | 110 | yes | export function addSeededLibraryEntry(path, entry, { journalPath } = {}) { |
| state | const | 120 | no | const state = entry.state ?? &#39;seeded&#39;; |
| store | const | 124 | no | const store = loadLibrary(path); |
| provenance | const | 128 | no | const provenance = { |
| stored | const | 133 | no | const stored = { |
| removeLibraryEntry | function | 161 | yes | export function removeLibraryEntry(path, id, { journalPath } = {}) { |
| store | const | 162 | no | const store = loadLibrary(path); |
| before | const | 163 | no | const before = store.entries.length; |
| listLibrary | function | 173 | yes | export function listLibrary(path) { |
| updateLibraryState | function | 186 | yes | export function updateLibraryState(path, id, to, { journalPath, evidence } = {}) { |
| store | const | 190 | no | const store = loadLibrary(path); |
| row | const | 191 | no | const row = store.entries.find((e) =&gt; e.id === id); |
| setFavorite | function | 221 | yes | export function setFavorite(path, id, favorite, { journalPath } = {}) { |
| store | const | 223 | no | const store = loadFavorites(path); |
| listFavorites | function | 242 | yes | export function listFavorites(path) { |
| atomicWriteJson | function | 246 | no | function atomicWriteJson(path, data) { |
| tmp | const | 248 | no | const tmp = `${path}.tmp`; |
| ensureDir | function | 253 | no | function ensureDir(path) { |
| dir | const | 254 | no | const dir = dirname(path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 20 | external |
| node:path | import | 21 | external |
| ./wanted.mjs | import | 22 | [hq/lib/torrent/wanted.mjs](./wanted.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/torrent/library.mjs |
| [hq/lib/torrent/poll.mjs](./poll.mjs.md) | ./library.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Personal media library + favorites store: one durable row per |
| 12 | owner | hq-agent | — | hq-agent |
| 13 | task | — | — | P58-torrent-store |
| 14 | see | — | hq/lib/torrent/wanted.mjs | hq/lib/torrent/wanted.mjs (appendJournal, journal-before-effect) |
| 15 | see | — | hq/lib/torrent/qbittorrent.mjs | hq/lib/torrent/qbittorrent.mjs (detectArrivals feeds state changes) |
| 16 | invariant | — | — | journal before effect: every state/favorite change appends its |

## Excerpt

```javascript
/**
 * @hq:context Personal media library + favorites store: one durable row per
 *   dispatched title ({id, kind, title, infoHash, size, sourceUrl, state:
 *   dispatched→folder-detected→complete, dispatchedAt, arrivedAt,
 *   provenance:{mechanism:'magnet-button-click', receipt}}), plus history-
 *   seeded rows in the 'seeded'/'folder-detected' states added by
 *   addSeededLibraryEntry (provenance {source:'chrome-history', visitCount}).
 *   Atomic writes (temp+rename), journal events library.state /
 *   library.seeded / favorite.set via appendJournal. Favorites are a
 *   separate id-keyed collection the auto planner and release tracker poll
 *   first.
 * @hq:owner hq-agent
 * @hq:task P58-torrent-store
 * @hq:see hq/lib/torrent/wanted.mjs (appendJournal, journal-before-effect)
 * @hq:see hq/lib/torrent/qbittorrent.mjs (detectArrivals feeds state changes)
 * @hq:invariant journal before effect: every state/favorite change appends its
 *   journal row; this store never contacts qBittorrent or the network and
 *   never writes into BT_backup.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { appendJournal } from './wanted.mjs';

export const LIBRARY_STATES = ['dispatched', 'folder-detected', 'complete', 'seeded'];
const LIBRARY_KINDS = new Set(['show', 'movie']);

/** Load the library. Missing file → {version:1, entries:[]}. */
export function loadLibrary(path) {
  return loadCollection(path, 'library');
}

/** Load the favorites collection. Missing file → {version:1, entries:[]}. */
export function loadFavorites(path) {
  return loadCollection(path, 'favorites');
}

function loadCollection(path, name) {
  if (!existsSync(path)) return { version: 1, entries: [] };
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!data || !Array.isArray(data.entries)) {
    throw new Error(`${name} store corrupt (no entries array): ${path}`);
  }
  return data;
}

/**
 * Add a library row. Fills state:'dispatched', dispatchedAt, arrivedAt:null
 * and provenance {mechanism:'magnet-button-click', receipt}; rejects
 * duplicate id. Optionally journals `library.state` (from:null → dispatched).
 * @param {string} path library store JSON path
 * @param {{id: string, kind: 'show'|'movie', title: string, infoHash?: string,
 *   size?: string|number, sourceUrl?: string, receipt?: string}} entry
 * @param {{journalPath?: string}} [opts]
 */
export function addLibraryEntry(path, entry, { journalPath } = {}) {
  if (!entry || typeof entry.id !== 'string' || !entry.id) {
    throw new Error('library entry requires an id');
  }
  if (!LIBRARY_KINDS.has(entry.kind)) {
    throw new Error(`library entry requires kind 'show' or 'movie', got: ${entry && entry.kind}`);
  }
  if (typeof entry.title !== 'string' || !entry.title) {
    throw new Error('library entry requires a title');
  }
  const store = loadLibrary(path);
  if (store.entries.some((e) => e.id === entry.id)) {
    throw new Error(`library entry duplicate id: ${entry.id}`);
  }
  const stored = {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    infoHash: entry.infoHash ? String(entry.infoHash).toLowerCase() : null,
    size: entry.size ?? null,
    sourceUrl: entry.sourceUrl ?? null,
    state: 'dispatched',
    dispatchedAt: new Date().toISOString(),
    arrivedAt: null,
    provenance: {
      mechanism: 'magnet-button-click',
```

_First 80 of 257 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
