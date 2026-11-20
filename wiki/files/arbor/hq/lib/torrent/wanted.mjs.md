# File: hq/lib/torrent/wanted.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/wanted.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4593 B |
| Lines | 135 |
| Hash | 2715323a145c |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| JOURNAL_KINDS | const | 14 | no | const JOURNAL_KINDS = new Set([ &#39;wanted.added&#39;, &#39;dispatch.planned&#39;, &#39;dispatch.sent&#39;, &#39;episode.found&#39;, |
| loadWanted | function | 28 | yes | export function loadWanted(path) { |
| data | const | 30 | no | const data = JSON.parse(readFileSync(path, &#39;utf8&#39;)); |
| addWanted | function | 43 | yes | export function addWanted(path, entry) { |
| store | const | 47 | no | const store = loadWanted(path); |
| stored | const | 51 | no | const stored = { |
| updateWantedEntry | function | 69 | yes | export function updateWantedEntry(path, id, patch) { |
| store | const | 73 | no | const store = loadWanted(path); |
| row | const | 74 | no | const row = store.entries.find((e) =&gt; e.id === id); |
| removeWanted | function | 82 | yes | export function removeWanted(path, id) { |
| store | const | 83 | no | const store = loadWanted(path); |
| before | const | 84 | no | const before = store.entries.length; |
| appendJournal | function | 98 | yes | export function appendJournal(journalPath, event) { |
| rows | const | 102 | no | const rows = readJournal(journalPath); |
| row | const | 103 | no | const row = { |
| line | const | 109 | no | const line = `${JSON.stringify(row)}\\n`; |
| tmp | const | 110 | no | const tmp = `${journalPath}.tmp`; |
| readJournal | function | 117 | yes | export function readJournal(journalPath) { |
| atomicWriteJson | function | 125 | no | function atomicWriteJson(path, data) { |
| tmp | const | 127 | no | const tmp = `${path}.tmp`; |
| ensureDir | function | 132 | no | function ensureDir(path) { |
| dir | const | 133 | no | const dir = dirname(path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 10 | external |
| node:path | import | 11 | external |
| node:fs | import | 12 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/torrent/wanted.mjs |
| [hq/lib/torrent/library.mjs](./library.mjs.md) | ./wanted.mjs |
| [hq/lib/torrent/poll.mjs](./poll.mjs.md) | ./wanted.mjs |
| [hq/lib/torrent/releases.mjs](./releases.mjs.md) | ./wanted.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Wanted-list store: JSON file + append-only journal, atomic writes |
| 5 | owner | hq-agent | — | hq-agent |
| 6 | task | — | — | P54-torrent |
| 7 | see | — | hq/lib/kernel/store.mjs | hq/lib/kernel/store.mjs (provenance discipline this store mirrors) |
| 8 | invariant | — | — | no dispatch without a journal row (journal before effect). |

## Excerpt

```javascript
/**
 * @hq:context Wanted-list store: JSON file + append-only journal, atomic writes
 *   (temp + rename), provenance on every row (id, addedAt, source:"owner").
 *   Journal rows carry {seq, at, kind, ...}.
 * @hq:owner hq-agent
 * @hq:task P54-torrent
 * @hq:see hq/lib/kernel/store.mjs (provenance discipline this store mirrors)
 * @hq:invariant no dispatch without a journal row (journal before effect).
 */
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const JOURNAL_KINDS = new Set([
  'wanted.added',
  'dispatch.planned',
  'dispatch.sent',
  'episode.found',
  'library.state',
  'library.seeded',
  'favorite.set',
  'tracking.polled',
  'arrival.detected',
  'release.updated',
]);

/** Load the wanted list. Missing file → {version:1, entries:[]}. */
export function loadWanted(path) {
  if (!existsSync(path)) return { version: 1, entries: [] };
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!data || !Array.isArray(data.entries)) {
    throw new Error(`wanted store corrupt (no entries array): ${path}`);
  }
  return data;
}

/**
 * Add an entry; rejects duplicate id. Fills provenance defaults
 * (addedAt ISO timestamp, source:"owner") and returns the stored entry.
 * @param {string} path
 * @param {{id: string, title: string, type?: 'show'|'movie', minSeeders?: number, query?: string}} entry
 */
export function addWanted(path, entry) {
  if (!entry || typeof entry.id !== 'string' || !entry.id) {
    throw new Error('wanted entry requires an id');
  }
  const store = loadWanted(path);
  if (store.entries.some((e) => e.id === entry.id)) {
    throw new Error(`wanted entry duplicate id: ${entry.id}`);
  }
  const stored = {
    ...entry,
    addedAt: new Date().toISOString(),
    source: 'owner',
  };
  store.entries.push(stored);
  atomicWriteJson(path, store);
  return stored;
}

/**
 * Patch one wanted entry in place ({id, ...fields to change}). Throws when
 * the id is not present. The poll loop uses this to persist dispatch
 * baselines (lastDispatchedEpisode) and season bumps. Atomic write.
 * @param {string} path
 * @param {string} id
 * @param {Record<string, unknown>} patch
 */
export function updateWantedEntry(path, id, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('wanted patch requires an object');
  }
  const store = loadWanted(path);
  const row = store.entries.find((e) => e.id === id);
  if (!row) throw new Error(`wanted entry not found: ${id}`);
  Object.assign(row, patch);
  atomicWriteJson(path, store);
  return { ...row };
}
```

_First 80 of 136 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
