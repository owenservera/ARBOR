# File: hq/lib/torrent/poll.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/poll.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21176 B |
| Lines | 544 |
| Hash | 8c8646ee2826 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STORE_FILES | const | 33 | yes | export const STORE_FILES = { |
| storePaths | function | 42 | yes | export function storePaths(storeDir) { |
| errText | function | 46 | no | function errText(err) { |
| entryKind | function | 51 | no | function entryKind(entry) { |
| kind | const | 52 | no | const kind = entry ? (entry.type ?? entry.kind) : null; |
| normTitle | function | 56 | no | function normTitle(s) { |
| queryFor | function | 62 | no | function queryFor(entry) { |
| hashFromMagnet | function | 70 | no | function hashFromMagnet(magnet) { |
| m | const | 71 | no | const m = /xt=urn:btih:([A-Za-z0-9]+)/i.exec(String(magnet ?? &#39;&#39;)); |
| runMediaPoll | function | 85 | yes | export async function runMediaPoll({ storeDir, backupDir = null, releasesFetch = globalThis.fetch, searchFn = null, |
| paths | const | 95 | no | const paths = storePaths(storeDir); |
| errors | const | 96 | no | const errors = []; |
| summary | const | 97 | no | const summary = { planned: 0, dispatched: 0, arrivals: 0, baselinesSet: 0, releasesUpdated: 0, errors }; |
| wanted | const | 105 | no | const wanted = loadWanted(paths.wanted); |
| library | const | 106 | no | const library = listLibrary(paths.library); |
| journal | const | 107 | no | const journal = readJournal(paths.journal); |
| seenHashes | const | 108 | no | const seenHashes = new Set( [ ...journal.filter((r) =&gt; r.kind === &#39;arrival.detected&#39;).map((r) =&gt; r.infoHash), ...library.filter((r) =&gt; r.state !== &#39;dispatched&#39;).map((r) =&gt; r.infoHash), ] |
| knownHashes | const | 116 | no | const knownHashes = new Set([ ...seenHashes, ...library.map((r) =&gt; r.infoHash), ...journal.filter((r) =&gt; r.kind === &#39;dispatch.sent&#39;).map((r) =&gt; r.infoHash), ].filter(Boolean).map((h) =&gt; String(h).toL… |
| arrivals | variable | 122 | no | let arrivals = []; |
| row | const | 136 | no | const row = library.find((r) =&gt; r.infoHash === a.infoHash); |
| favIds | const | 155 | no | const favIds = new Set(listFavorites(paths.favorites).map((f) =&gt; f.id)); |
| isFav | function | 156 | no | const isFav = (e) =&gt; e.favorite === true \|\| favIds.has(e.id); |
| showEntries | const | 157 | no | const showEntries = wanted.entries.filter((e) =&gt; entryKind(e) === &#39;show&#39;); |
| libraryShowTitles | const | 158 | no | const libraryShowTitles = new Map( library .filter((r) =&gt; r.kind === &#39;show&#39; &amp;&amp; r.infoHash) .map((r) =&gt; [normTitle(r.title), r.title]) ); |
| titles | const | 164 | no | const titles = [ |
| rows | const | 170 | no | const rows = await updateReleases(paths.releases, titles, releasesFetch, { now, journalPath: paths.journal }); |
| baselinedIds | const | 181 | no | const baselinedIds = new Set(); |
| releases | const | 183 | no | const releases = loadReleases(paths.releases); |
| relByTitle | const | 184 | no | const relByTitle = new Map(releases.entries.map((r) =&gt; [normTitle(r.title), r])); |
| row | const | 187 | no | const row = relByTitle.get(normTitle(e.title)); |
| la | const | 188 | no | const la = row &amp;&amp; row.latestAired; |
| fresh | const | 204 | no | const fresh = loadWanted(paths.wanted); |
| plannable | const | 205 | no | const plannable = fresh.entries |
| resultsByQuery | const | 208 | no | const resultsByQuery = {}; |
| q | const | 215 | no | const q = e.query; |
| lastMap | const | 225 | no | const lastMap = {}; |
| plans | const | 227 | no | const plans = planDispatches(plannable, { resultsByQuery, existingHashes: knownHashes, lastDispatchedEpisode: lastMap, }); |
| toExecute | const | 245 | no | const toExecute = Number.isFinite(limit) &amp;&amp; limit &gt; 0 ? plans.slice(0, Math.floor(limit)) : []; |
| byId | const | 246 | no | const byId = new Map(fresh.entries.map((e) =&gt; [e.id, e])); |
| res | const | 253 | no | const res = await dispatchFn(p); |
| infoHash | const | 258 | no | const infoHash = String(res.infoHash ?? hashFromMagnet(p.magnet) ?? &#39;&#39;).toLowerCase(); |
| entry | const | 267 | no | const entry = byId.get(p.id); |
| ep | const | 281 | no | const ep = parseEpisode(p.episode); |
| patch | const | 283 | no | const patch = { lastDispatchedEpisode: ep }; |
| SEARCH_URL_RE | const | 309 | no | const SEARCH_URL_RE = /1337x\\.to\\/search\\/([^/?#]+)/i; |
| SHOW_QUERY_RE | const | 310 | no | const SHOW_QUERY_RE = /^(.+?)\\s+s(\\d{1,2})(?:e(\\d{1,3}))?$/; |
| parseHistorySearchUrl | function | 319 | yes | export function parseHistorySearchUrl(url) { |
| m | const | 320 | no | const m = SEARCH_URL_RE.exec(String(url ?? &#39;&#39;)); |
| query | variable | 322 | no | let query; |
| sm | const | 330 | no | const sm = SHOW_QUERY_RE.exec(query); |
| seedWantedFromHistory | function | 353 | yes | export function seedWantedFromHistory(rawHistoryPath, storeDir) { |
| raw | const | 354 | no | const raw = JSON.parse(readFileSync(rawHistoryPath, &#39;utf8&#39;)); |
| rows | const | 355 | no | const rows = Array.isArray(raw.rows1337x) ? raw.rows1337x : []; |
| byQuery | const | 356 | no | const byQuery = new Map(); |
| parsed | const | 358 | no | const parsed = parseHistorySearchUrl(row &amp;&amp; row.url); |
| visits | const | 360 | no | const visits = typeof row.visit_count === &#39;number&#39; ? row.visit_count : 0; |
| candidates | const | 363 | no | const candidates = new Map(); |
| parsed | const | 365 | no | const parsed = parseHistorySearchUrl(row &amp;&amp; row.url); |
| visits | const | 367 | no | const visits = byQuery.get(parsed.query) ?? 0; |
| prev | const | 369 | no | const prev = candidates.get(parsed.title); |
| better | const | 370 | no | const better = |
| paths | const | 376 | no | const paths = storePaths(storeDir); |
| existing | const | 377 | no | const existing = new Set(loadWanted(paths.wanted).entries.map((e) =&gt; e.id)); |
| seeded | const | 378 | no | const seeded = []; |
| id | const | 380 | no | const id = `show:${title.replace(/\\s+/g, &#39;-&#39;)}`; |
| DETAIL_URL_RE | const | 402 | no | const DETAIL_URL_RE = /1337x\\.to(\\/torrent\\/(\\d+)\\/([^/?#]*))/i; |
| SHOW_SLUG_RE | const | 403 | no | const SHOW_SLUG_RE = /(?:^\|[^a-z0-9])s(\\d{2})(?:e(\\d{2,3}))?(?:[^a-z0-9]\|$)/i; |
| parseHistoryDetailUrl | function | 411 | yes | export function parseHistoryDetailUrl(url) { |
| m | const | 412 | no | const m = DETAIL_URL_RE.exec(String(url ?? &#39;&#39;)); |
| slugRaw | const | 414 | no | const slugRaw = m[3]; |
| slug | variable | 415 | no | let slug; |
| listDownloadNames | function | 437 | yes | export function listDownloadNames(downloadsDir) { |
| names | const | 438 | no | const names = []; |
| top | variable | 440 | no | let top; |
| normReleaseName | function | 462 | yes | export function normReleaseName(s) { |
| matchDownloads | function | 474 | yes | export function matchDownloads(title, names) { |
| tokens | const | 475 | no | const tokens = normReleaseName(title).split(&#39; &#39;).filter(Boolean).slice(0, 4); |
| needed | const | 477 | no | const needed = tokens.length &gt;= 3 ? 3 : tokens.length; |
| normalizedTitle | const | 478 | no | const normalizedTitle = normReleaseName(title); |
| n | const | 480 | no | const n = normReleaseName(name); |
| nameTokens | const | 483 | no | const nameTokens = new Set(n.split(&#39; &#39;)); |
| hit | const | 484 | no | const hit = tokens.filter((t) =&gt; nameTokens.has(t)).length; |
| seedLibraryFromHistory | function | 503 | yes | export function seedLibraryFromHistory(rawHistoryPath, storeDir, downloadsDir) { |
| raw | const | 504 | no | const raw = JSON.parse(readFileSync(rawHistoryPath, &#39;utf8&#39;)); |
| rows | const | 505 | no | const rows = Array.isArray(raw.rows1337x) ? raw.rows1337x : []; |
| paths | const | 506 | no | const paths = storePaths(storeDir); |
| names | const | 507 | no | const names = listDownloadNames(downloadsDir); |
| existing | const | 508 | no | const existing = new Set(listLibrary(paths.library).map((e) =&gt; e.id)); |
| visitsById | const | 509 | no | const visitsById = new Map(); |
| order | const | 510 | no | const order = []; |
| parsed | const | 512 | no | const parsed = parseHistoryDetailUrl(row &amp;&amp; row.url); |
| visits | const | 514 | no | const visits = typeof row.visit_count === &#39;number&#39; ? row.visit_count : 0; |
| seeded | const | 521 | no | const seeded = []; |
| id | const | 523 | no | const id = `hist-${torrentId}`; |
| matchedName | const | 526 | no | const matchedName = matchDownloads(parsed.slug, names); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 19 | external |
| node:path | import | 20 | external |
| ./wanted.mjs | import | 21 | [hq/lib/torrent/wanted.mjs](./wanted.mjs.md) |
| ./library.mjs | import | 22 | [hq/lib/torrent/library.mjs](./library.mjs.md) |
| ./releases.mjs | import | 29 | [hq/lib/torrent/releases.mjs](./releases.mjs.md) |
| ./qbittorrent.mjs | import | 30 | [hq/lib/torrent/qbittorrent.mjs](./qbittorrent.mjs.md) |
| ./auto.mjs | import | 31 | [hq/lib/torrent/auto.mjs](./auto.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/torrent/poll.mjs |
| [hq/lib/automation.mjs](../automation.mjs.md) | ./torrent/poll.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The media poll loop (P60): detectArrivals → library state |
| 10 | owner | hq-agent | — | hq-agent |
| 11 | task | — | — | P60-torrent-poll |
| 12 | see | — | hq/work/goals/2026-11-08-torrent-media-goal.md | hq/work/goals/2026-11-08-torrent-media-goal.md (state of record) |
| 13 | see | — | hq/lib/torrent/auto.mjs | hq/lib/torrent/auto.mjs (planner) · hq/lib/torrent/qbittorrent.mjs (detectArrivals) |
| 14 | invariant | — | — | limit 0 (the default) is plan-only: dispatchFn is NEVER |

## Excerpt

```javascript
/**
 * @hq:context The media poll loop (P60): detectArrivals → library state
 *   transitions → updateReleases (TVMaze) → baseline rule → planDispatches
 *   (favorites first) → dispatch up to `limit` through an injectable
 *   adapter, every step journaled. Also the two one-time history seeds:
 *   seedWantedFromHistory (watchlist from show-shaped Chrome-history search
 *   queries) and seedLibraryFromHistory (library rows from visited detail
 *   pages, downloads-dir matched). Store defaults to
 *   C:/VIVIM/channel/vivim/torrent-store/ (outside the repo).
 * @hq:owner hq-agent
 * @hq:task P60-torrent-poll
 * @hq:see hq/work/goals/2026-11-08-torrent-media-goal.md (state of record)
 * @hq:see hq/lib/torrent/auto.mjs (planner) · hq/lib/torrent/qbittorrent.mjs (detectArrivals)
 * @hq:invariant limit 0 (the default) is plan-only: dispatchFn is NEVER
 *   called. No dispatch without a journal row; a baseline is recorded
 *   WITHOUT planning a dispatch (no back-catalog spam). detectArrivals and
 *   the history file are read-only; tests use fixture dirs only.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { appendJournal, addWanted, loadWanted, readJournal, updateWantedEntry } from './wanted.mjs';
import {
  addLibraryEntry,
  addSeededLibraryEntry,
  listFavorites,
  listLibrary,
  updateLibraryState,
} from './library.mjs';
import { loadReleases, updateReleases } from './releases.mjs';
import { detectArrivals } from './qbittorrent.mjs';
import { parseEpisode, planDispatches, trackingPolledEvent } from './auto.mjs';

export const STORE_FILES = {
  wanted: 'wanted.json',
  library: 'library.json',
  favorites: 'favorites.json',
  releases: 'releases.json',
  journal: 'journal.jsonl',
};

/** Absolute paths of the five store files under storeDir. */
export function storePaths(storeDir) {
  return Object.fromEntries(Object.entries(STORE_FILES).map(([k, f]) => [k, join(storeDir, f)]));
}

function errText(err) {
  return (err && err.message) ? String(err.message) : String(err);
}

/** Wanted entries may declare type ('show'|'movie') or kind — both accepted. */
function entryKind(entry) {
  const kind = entry ? (entry.type ?? entry.kind) : null;
  return kind === 'show' ? 'show' : 'movie';
}

function normTitle(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Search query for a wanted entry: explicit query wins; the owner's own
 *  measured pattern ("title sNN") for shows with a season; bare title else. */
function queryFor(entry) {
  if (entry.query) return entry.query;
  if (entryKind(entry) === 'show' && typeof entry.season === 'number') {
    return `${entry.title} s${String(entry.season).padStart(2, '0')}`;
  }
  return entry.title;
}

function hashFromMagnet(magnet) {
  const m = /xt=urn:btih:([A-Za-z0-9]+)/i.exec(String(magnet ?? ''));
  return m ? m[1].toLowerCase() : null;
}

/**
 * One media poll. Order: detectArrivals → library state transitions →
 * updateReleases (TVMaze) → planDispatches (favorites first) → dispatch up
 * to `limit`. Returns a plain summary
 * {planned, dispatched, arrivals, baselinesSet, releasesUpdated, errors}.
 * @param {{storeDir: string, backupDir?: string|null, releasesFetch?: typeof fetch,
```

_First 80 of 545 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
