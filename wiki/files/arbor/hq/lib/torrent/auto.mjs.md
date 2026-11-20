# File: hq/lib/torrent/auto.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/auto.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6083 B |
| Lines | 141 |
| Hash | 05fcc14d6971 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EPISODE_RE | const | 15 | no | const EPISODE_RE = /\\bS(\\d{1,2})E(\\d{1,3})\\b/i; |
| planDispatches | function | 23 | yes | export function planDispatches(wanted, { resultsByQuery = {}, existingHashes = [], lastDispatchedEpisode = {} } = {}) { |
| existing | const | 24 | no | const existing = existingHashes instanceof Set ? existingHashes : new Set(existingHashes); |
| plans | const | 25 | no | const plans = []; |
| results | const | 27 | no | const results = resultsFor(resultsByQuery, entry); |
| minSeeders | const | 28 | no | const minSeeders = typeof entry.minSeeders === &#39;number&#39; ? entry.minSeeders : 1; |
| isShow | const | 29 | no | const isShow = (entry.type ?? &#39;movie&#39;) === &#39;show&#39;; |
| last | const | 30 | no | const last = lastDispatchedEpisode[entry.id] ?? null; |
| eligible | const | 31 | no | const eligible = []; |
| hash | const | 33 | no | const hash = candidateHash(r); |
| seeders | const | 35 | no | const seeders = typeof r.seeders === &#39;number&#39; ? r.seeders : 0; |
| ep | const | 38 | no | const ep = parseEpisode(r.title); |
| pick | const | 55 | no | const pick = eligible[0]; |
| magnet | const | 56 | no | const magnet = pick.magnet ?? (pick.infoHash ? magnetFromHash(pick.infoHash, pick.title) : &#39;&#39;); |
| orderFavoritesFirst | function | 77 | no | function orderFavoritesFirst(wanted) { |
| trackingPolledEvent | function | 91 | yes | export function trackingPolledEvent({ checked = 0, planned = 0, baselinesSet = 0 } = {}) { |
| resultsFor | function | 101 | no | function resultsFor(resultsByQuery, entry) { |
| key | const | 103 | no | const key = entry.query ?? entry.title; |
| candidateHash | function | 107 | no | function candidateHash(result) { |
| m | const | 109 | no | const m = /xt=urn:btih:([A-Za-z0-9]+)/i.exec(String(result.magnet ?? &#39;&#39;)); |
| magnetFromHash | function | 113 | no | function magnetFromHash(hash, title) { |
| parseEpisode | function | 118 | yes | export function parseEpisode(title) { |
| m | const | 119 | no | const m = EPISODE_RE.exec(String(title ?? &#39;&#39;)); |
| compareEpisode | function | 123 | no | function compareEpisode(a, b) { |
| titlesMatch | function | 129 | no | function titlesMatch(candidateTitle, wantedTitle) { |
| c | const | 130 | no | const c = norm(candidateTitle); |
| w | const | 131 | no | const w = norm(wantedTitle); |
| norm | function | 135 | no | function norm(s) { |
| pad | function | 139 | no | function pad(n) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/torrent/poll.mjs](./poll.mjs.md) | ./auto.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Pure dispatch planning for wanted media. planDispatches(wanted, |
| 6 | owner | hq-agent | — | hq-agent |
| 7 | task | — | — | P54-torrent |
| 8 | see | — | hq/work/goals/2026-11-08-torrent-media-goal.md | hq/work/goals/2026-11-08-torrent-media-goal.md (S3/S4 rules) |
| 9 | invariant | — | — | planning never effects; dispatch happens only via journaled sender. |

## Excerpt

```javascript
/**
 * @hq:context Pure dispatch planning for wanted media. planDispatches(wanted,
 *   {resultsByQuery, existingHashes, lastDispatchedEpisode}) → plans, enforcing
 *   hash dedup, minSeeders gate (default 1), SxxEyy episode ordering for shows,
 *   best-seeded exact-title pick for movies. 100% deterministic, no I/O.
 * @hq:owner hq-agent
 * @hq:task P54-torrent
 * @hq:see hq/work/goals/2026-11-08-torrent-media-goal.md (S3/S4 rules)
 * @hq:invariant planning never effects; dispatch happens only via journaled sender.
 *   Favorites are polled first: entries with favorite:true sort ahead of the
 *   rest (stable, ties by id). trackingPolledEvent builds the `tracking.polled`
 *   journal payload; appendJournal (wanted.mjs) stamps `at`.
 */

const EPISODE_RE = /\bS(\d{1,2})E(\d{1,3})\b/i;

/**
 * Plan dispatches for a wanted list against search results.
 * @param {Array<{id:string, title:string, type?:'show'|'movie', minSeeders?:number, query?:string}>} wanted
 * @param {{resultsByQuery: Record<string, Array<{title:string, detailHref?:string, size?:string, seeders?:number, leeches?:number, magnet?:string, infoHash?:string}>>, existingHashes?: Set<string>|string[], lastDispatchedEpisode?: Record<string, {season:number, episode:number}>}} ctx
 * @returns {Array<{id:string, magnet:string, episode?:string, reason:string}>}
 */
export function planDispatches(wanted, { resultsByQuery = {}, existingHashes = [], lastDispatchedEpisode = {} } = {}) {
  const existing = existingHashes instanceof Set ? existingHashes : new Set(existingHashes);
  const plans = [];
  for (const entry of orderFavoritesFirst(wanted)) {
    const results = resultsFor(resultsByQuery, entry);
    const minSeeders = typeof entry.minSeeders === 'number' ? entry.minSeeders : 1;
    const isShow = (entry.type ?? 'movie') === 'show';
    const last = lastDispatchedEpisode[entry.id] ?? null;
    const eligible = [];
    for (const r of results) {
      const hash = candidateHash(r);
      if (hash && existing.has(hash)) continue; // dedup: hash already in client
      const seeders = typeof r.seeders === 'number' ? r.seeders : 0;
      if (seeders < minSeeders) continue;
      if (isShow) {
        const ep = parseEpisode(r.title);
        if (!ep) continue;
        if (last && compareEpisode(ep, last) <= 0) continue; // already dispatched
        eligible.push({ ...r, _ep: ep });
      } else {
        if (!titlesMatch(r.title, entry.title)) continue; // exact title only
        eligible.push({ ...r, _ep: undefined });
      }
    }
    if (eligible.length === 0) continue;
    // Deterministic pick: most seeders, then title asc, then detailHref asc.
    eligible.sort(
      (a, b) =>
        (b.seeders ?? 0) - (a.seeders ?? 0) ||
        String(a.title).localeCompare(String(b.title)) ||
        String(a.detailHref ?? '').localeCompare(String(b.detailHref ?? ''))
    );
    const pick = eligible[0];
    const magnet = pick.magnet ?? (pick.infoHash ? magnetFromHash(pick.infoHash, pick.title) : '');
    if (!magnet) continue;
    plans.push({
      id: entry.id,
      magnet,
      ...(isShow ? { episode: `S${pad(pick._ep.season)}E${pad(pick._ep.episode)}` } : {}),
      reason: isShow ? 'new-episode' : 'movie-best-seeded',
      // Present only when the picked result carries it (live search rows do):
      // the dispatch adapter clicks the magnet button on this detail page.
      ...(pick.detailHref ? { detailHref: String(pick.detailHref) } : {}),
      ...(candidateHash(pick) ? { infoHash: candidateHash(pick) } : {}),
    });
  }
  return plans;
}

/**
 * Favorites are polled FIRST: favorite:true entries sort ahead of the rest;
 * ties (equal favorite flag) break by id. Array.sort is stable, so original
 * order is preserved within equal keys.
 */
function orderFavoritesFirst(wanted) {
  return [...wanted].sort(
    (a, b) =>
      (b.favorite === true) - (a.favorite === true) ||
```

_First 80 of 142 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
