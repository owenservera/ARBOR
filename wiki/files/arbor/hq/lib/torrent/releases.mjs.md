# File: hq/lib/torrent/releases.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/releases.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6966 B |
| Lines | 156 |
| Hash | 1ed826b0bdc6 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TVMAZE_BASE | const | 19 | no | const TVMAZE_BASE = &#39;https://api.tvmaze.com&#39;; |
| findShow | function | 27 | yes | export async function findShow(title, fetchImpl = globalThis.fetch) { |
| url | const | 28 | no | const url = `${TVMAZE_BASE}/singlesearch/shows?q=${encodeURIComponent(String(title))}&amp;embed=nextepisode`; |
| res | const | 29 | no | const res = await fetchImpl(url); |
| data | const | 32 | no | const data = await res.json(); |
| nextRelease | function | 46 | yes | export async function nextRelease(tvmazeId, fetchImpl = globalThis.fetch, { now } = {}) { |
| episodeWindow | function | 55 | no | async function episodeWindow(tvmazeId, fetchImpl, now) { |
| url | const | 56 | no | const url = `${TVMAZE_BASE}/shows/${encodeURIComponent(String(tvmazeId))}/episodes`; |
| res | const | 57 | no | const res = await fetchImpl(url); |
| episodes | const | 60 | no | const episodes = await res.json(); |
| nowMs | const | 62 | no | const nowMs = now === undefined ? Date.now() : new Date(now).getTime(); |
| dated | const | 63 | no | const dated = episodes |
| aired | const | 68 | no | const aired = dated.filter((e) =&gt; e.at &lt;= nowMs); |
| upcoming | const | 69 | no | const upcoming = dated.filter((e) =&gt; e.at &gt; nowMs); |
| shape | function | 70 | no | const shape = (e) =&gt; (e ? { season: e.season, number: e.number, airstamp: e.airstamp } : null); |
| updateReleases | function | 84 | yes | export async function updateReleases(storePath, titles, fetchImpl = globalThis.fetch, { now, journalPath } = {}) { |
| ordered | const | 85 | no | const ordered = [...(titles ?? [])].sort( (a, b) =&gt; (b.favorite === true) - (a.favorite === true) \|\| titleOf(a).localeCompare(titleOf(b)) ); |
| store | const | 90 | no | const store = loadReleases(storePath); |
| nowIso | const | 91 | no | const nowIso = new Date(now === undefined ? Date.now() : new Date(now)).toISOString(); |
| rows | const | 92 | no | const rows = []; |
| title | const | 94 | no | const title = titleOf(item); |
| row | variable | 95 | no | let row; |
| show | const | 97 | no | const show = await findShow(title, fetchImpl); |
| loadReleases | function | 127 | yes | export function loadReleases(path) { |
| data | const | 129 | no | const data = JSON.parse(readFileSync(path, &#39;utf8&#39;)); |
| titleOf | function | 136 | no | function titleOf(item) { |
| upsertByTitle | function | 140 | no | function upsertByTitle(store, row) { |
| i | const | 141 | no | const i = store.entries.findIndex((e) =&gt; e.title === row.title); |
| atomicWriteJson | function | 146 | no | function atomicWriteJson(path, data) { |
| tmp | const | 148 | no | const tmp = `${path}.tmp`; |
| ensureDir | function | 153 | no | function ensureDir(path) { |
| dir | const | 154 | no | const dir = dirname(path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 15 | external |
| node:path | import | 16 | external |
| ./wanted.mjs | import | 17 | [hq/lib/torrent/wanted.mjs](./wanted.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/torrent/releases.mjs |
| [hq/lib/torrent/poll.mjs](./poll.mjs.md) | ./releases.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Automated release tracker over TVMaze (free, no API key, the |
| 9 | owner | hq-agent | — | hq-agent |
| 10 | task | — | — | P58-torrent-store |
| 11 | see | — | hq/lib/torrent/wanted.mjs | hq/lib/torrent/wanted.mjs (appendJournal, journal-before-effect) |
| 12 | invariant | — | — | read-only against TVMaze (GET only, no key, no secrets); a |

## Excerpt

```javascript
/**
 * @hq:context Automated release tracker over TVMaze (free, no API key, the
 *   ONLY release source per work order): findShow (singlesearch), nextRelease
 *   and updateReleases — a favorites-first batch that upserts a `releases`
 *   collection row per show title ({title, tvmazeId, name, next, latestAired,
 *   fetchedAt}) and journals `release.updated` per show with provenance
 *   {source:'tvmaze', showId}. fetch is injectable; latest-aired vs next-
 *   unaired are derived by airstamp against `now`.
 * @hq:owner hq-agent
 * @hq:task P58-torrent-store
 * @hq:see hq/lib/torrent/wanted.mjs (appendJournal, journal-before-effect)
 * @hq:invariant read-only against TVMaze (GET only, no key, no secrets); a
 *   failed show never throws the batch — it journals a row with reason/error.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { appendJournal } from './wanted.mjs';

const TVMAZE_BASE = 'https://api.tvmaze.com';

/**
 * Resolve a show title on TVMaze.
 * @param {string} title
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{tvmazeId: number, name: string}|null>} null when not found
 */
export async function findShow(title, fetchImpl = globalThis.fetch) {
  const url = `${TVMAZE_BASE}/singlesearch/shows?q=${encodeURIComponent(String(title))}&embed=nextepisode`;
  const res = await fetchImpl(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`tvmaze singlesearch failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data || typeof data.id !== 'number') throw new Error('tvmaze singlesearch failed: malformed body');
  return { tvmazeId: data.id, name: data.name ?? null };
}

/**
 * Next unaired episode for a show, derived from the TVMaze episode list by
 * airstamp vs now (earliest airstamp strictly in the future). Null when the
 * show is ended/unknown or has no future-dated episode.
 * @param {number} tvmazeId
 * @param {typeof fetch} [fetchImpl]
 * @param {{now?: number|Date}} [opts]
 * @returns {Promise<{season: number, number: number, airstamp: string}|null>}
 */
export async function nextRelease(tvmazeId, fetchImpl = globalThis.fetch, { now } = {}) {
  const { next } = await episodeWindow(tvmazeId, fetchImpl, now);
  return next;
}

/**
 * Fetch and split the TVMaze episode list into latestAired / next by airstamp.
 * @returns {Promise<{latestAired: {season:number,number:number,airstamp:string}|null, next: {season:number,number:number,airstamp:string}|null}>}
 */
async function episodeWindow(tvmazeId, fetchImpl, now) {
  const url = `${TVMAZE_BASE}/shows/${encodeURIComponent(String(tvmazeId))}/episodes`;
  const res = await fetchImpl(url);
  if (res.status === 404) throw new Error(`tvmaze episodes not found for show ${tvmazeId}: HTTP 404`);
  if (!res.ok) throw new Error(`tvmaze episodes failed: HTTP ${res.status}`);
  const episodes = await res.json();
  if (!Array.isArray(episodes)) throw new Error('tvmaze episodes failed: non-array body');
  const nowMs = now === undefined ? Date.now() : new Date(now).getTime();
  const dated = episodes
    .filter((e) => e && typeof e.airstamp === 'string')
    .map((e) => ({ season: e.season ?? null, number: e.number ?? null, airstamp: e.airstamp, at: Date.parse(e.airstamp) }))
    .filter((e) => !Number.isNaN(e.at));
  dated.sort((a, b) => a.at - b.at);
  const aired = dated.filter((e) => e.at <= nowMs);
  const upcoming = dated.filter((e) => e.at > nowMs);
  const shape = (e) => (e ? { season: e.season, number: e.number, airstamp: e.airstamp } : null);
  return { latestAired: shape(aired[aired.length - 1] ?? null), next: shape(upcoming[0] ?? null) };
}

/**
 * Favorites-first batch release refresh. For each show title, upsert a
 * `releases` row and journal `release.updated`. Show-not-found and network
 * errors become rows with reason/error — the batch never throws.
 * @param {string} storePath releases store JSON path
 * @param {Array<string|{title: string, favorite?: boolean, id?: string}>} titles
 * @param {typeof fetch} [fetchImpl]
```

_First 80 of 157 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
