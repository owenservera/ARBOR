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
      String(a.id ?? '').localeCompare(String(b.id ?? ''))
  );
}

/**
 * Pure payload for the `tracking.polled` journal event: how many tracked
 * entries were checked, how many dispatches were planned and how many
 * baselines were set. appendJournal stamps seq + at.
 * @param {{checked?: number, planned?: number, baselinesSet?: number}} poll
 */
export function trackingPolledEvent({ checked = 0, planned = 0, baselinesSet = 0 } = {}) {
  return {
    kind: 'tracking.polled',
    checked,
    planned,
    baselinesSet,
    provenance: { mechanism: 'heartbeat-poll', source: 'auto' },
  };
}

function resultsFor(resultsByQuery, entry) {
  if (entry.id && Array.isArray(resultsByQuery[entry.id])) return resultsByQuery[entry.id];
  const key = entry.query ?? entry.title;
  return Array.isArray(resultsByQuery[key]) ? resultsByQuery[key] : [];
}

function candidateHash(result) {
  if (result.infoHash) return String(result.infoHash).toLowerCase();
  const m = /xt=urn:btih:([A-Za-z0-9]+)/i.exec(String(result.magnet ?? ''));
  return m ? m[1].toLowerCase() : null;
}

function magnetFromHash(hash, title) {
  return `magnet:?xt=urn:btih:${hash}${title ? `&dn=${encodeURIComponent(title)}` : ''}`;
}

/** Parse "SxxEyy" from a release title → {season, episode} or null. */
export function parseEpisode(title) {
  const m = EPISODE_RE.exec(String(title ?? ''));
  return m ? { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) } : null;
}

function compareEpisode(a, b) {
  return a.season - b.season || a.episode - b.episode;
}

/** Exact-title match: candidate must start with the wanted title
 *  (real release titles carry year/quality suffixes), case/whitespace-insensitive. */
function titlesMatch(candidateTitle, wantedTitle) {
  const c = norm(candidateTitle);
  const w = norm(wantedTitle);
  return c === w || c.startsWith(`${w} `) || c.startsWith(`${w} (`);
}

function norm(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function pad(n) {
  return String(n).padStart(2, '0');
}
