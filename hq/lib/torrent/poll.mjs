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
 *   searchFn?: ((query: string) => Promise<Array<object>>) | null,
 *   dispatchFn?: ((plan: object) => Promise<{ok: boolean, infoHash?: string, receipt?: string, error?: string}>) | null,
 *   limit?: number, now?: number|Date}} opts
 */
export async function runMediaPoll({
  storeDir,
  backupDir = null,
  releasesFetch = globalThis.fetch,
  searchFn = null,
  dispatchFn = null,
  limit = 0,
  now,
} = {}) {
  if (!storeDir) throw new Error('runMediaPoll requires storeDir');
  const paths = storePaths(storeDir);
  const errors = [];
  const summary = { planned: 0, dispatched: 0, arrivals: 0, baselinesSet: 0, releasesUpdated: 0, errors };

  // 1 + 2. Arrivals (BT_backup diff, strictly read-only) → arrival.detected
  // receipts and dispatched → folder-detected library transitions. The diff
  // baseline is what has already been SEEN on disk (journaled arrivals +
  // rows already past 'dispatched'); a freshly dispatched hash must still be
  // able to report its first appearance. The planner dedup uses the wider
  // set: anything the library holds or any dispatch receipt ever recorded.
  const wanted = loadWanted(paths.wanted);
  const library = listLibrary(paths.library);
  const journal = readJournal(paths.journal);
  const seenHashes = new Set(
    [
      ...journal.filter((r) => r.kind === 'arrival.detected').map((r) => r.infoHash),
      ...library.filter((r) => r.state !== 'dispatched').map((r) => r.infoHash),
    ]
      .filter(Boolean)
      .map((h) => String(h).toLowerCase())
  );
  const knownHashes = new Set([
    ...seenHashes,
    ...library.map((r) => r.infoHash),
    ...journal.filter((r) => r.kind === 'dispatch.sent').map((r) => r.infoHash),
  ].filter(Boolean).map((h) => String(h).toLowerCase()));
  if (backupDir) {
    let arrivals = [];
    try {
      arrivals = detectArrivals(backupDir, seenHashes);
    } catch (err) {
      errors.push(`arrivals: ${errText(err)}`);
    }
    summary.arrivals = arrivals.length;
    for (const a of arrivals) {
      appendJournal(paths.journal, {
        kind: 'arrival.detected',
        infoHash: a.infoHash,
        evidence: a.evidence,
        provenance: { mechanism: 'bt-backup-diff', source: 'qbittorrent' },
      });
      const row = library.find((r) => r.infoHash === a.infoHash);
      if (row && row.state === 'dispatched') {
        try {
          updateLibraryState(paths.library, row.id, 'folder-detected', {
            journalPath: paths.journal,
            evidence: a.evidence,
          });
        } catch (err) {
          errors.push(`library ${row.id}: ${errText(err)}`);
        }
      }
    }
  }

  // 3. Release tracker (TVMaze, free, no key): favorites first. Wanted show
  // titles own the refresh; library shows that are real downloads (they
  // carry an infoHash from a dispatch receipt) are refreshed too — history-
  // seeded rows hold release-name titles, not show names, and never go to
  // TVMaze.
  const favIds = new Set(listFavorites(paths.favorites).map((f) => f.id));
  const isFav = (e) => e.favorite === true || favIds.has(e.id);
  const showEntries = wanted.entries.filter((e) => entryKind(e) === 'show');
  const libraryShowTitles = new Map(
    library
      .filter((r) => r.kind === 'show' && r.infoHash)
      .map((r) => [normTitle(r.title), r.title])
  );
  for (const e of showEntries) libraryShowTitles.delete(normTitle(e.title));
  const titles = [
    ...showEntries.map((e) => ({ title: e.title, favorite: isFav(e), id: e.id })),
    ...[...libraryShowTitles.values()].map((title) => ({ title, favorite: false })),
  ];
  if (titles.length > 0) {
    try {
      const rows = await updateReleases(paths.releases, titles, releasesFetch, { now, journalPath: paths.journal });
      summary.releasesUpdated = rows.length;
    } catch (err) {
      errors.push(`releases: ${errText(err)}`);
    }
  }

  // 4. Baseline rule: a wanted show with lastDispatchedEpisode null and a
  // releases row with latestAired gets the baseline recorded WITHOUT
  // planning a dispatch — no back-catalog spam; subsequent polls fetch only
  // newer episodes. A season advance bumps the stored season too.
  const baselinedIds = new Set();
  try {
    const releases = loadReleases(paths.releases);
    const relByTitle = new Map(releases.entries.map((r) => [normTitle(r.title), r]));
    for (const e of wanted.entries) {
      if (entryKind(e) !== 'show' || e.lastDispatchedEpisode) continue;
      const row = relByTitle.get(normTitle(e.title));
      const la = row && row.latestAired;
      if (!la || typeof la.season !== 'number' || typeof la.number !== 'number') continue;
      updateWantedEntry(paths.wanted, e.id, {
        lastDispatchedEpisode: { season: la.season, episode: la.number },
        ...(typeof e.season === 'number' && la.season > e.season ? { season: la.season } : {}),
      });
      baselinedIds.add(e.id);
    }
  } catch (err) {
    errors.push(`baselines: ${errText(err)}`);
  }
  summary.baselinesSet = baselinedIds.size;

  // 5. Plan (favorites first inside planDispatches). Baselined entries are
  // excluded from THIS poll entirely; from the next poll on, the planner's
  // episode ordering does the rest.
  const fresh = loadWanted(paths.wanted);
  const plannable = fresh.entries
    .filter((e) => !baselinedIds.has(e.id))
    .map((e) => ({ ...e, type: entryKind(e), query: queryFor(e), favorite: isFav(e) }));
  const resultsByQuery = {};
  if (searchFn) {
    for (const e of [...plannable].sort(
      (a, b) =>
        (b.favorite === true) - (a.favorite === true) ||
        String(a.id ?? '').localeCompare(String(b.id ?? ''))
    )) {
      const q = e.query;
      if (resultsByQuery[q]) continue;
      try {
        resultsByQuery[q] = (await searchFn(q)) ?? [];
      } catch (err) {
        resultsByQuery[q] = [];
        errors.push(`search "${q}": ${errText(err)}`);
      }
    }
  }
  const lastMap = {};
  for (const e of fresh.entries) if (e.lastDispatchedEpisode) lastMap[e.id] = e.lastDispatchedEpisode;
  const plans = planDispatches(plannable, {
    resultsByQuery,
    existingHashes: knownHashes,
    lastDispatchedEpisode: lastMap,
  });
  summary.planned = plans.length;
  for (const p of plans) {
    appendJournal(paths.journal, {
      kind: 'dispatch.planned',
      id: p.id,
      episode: p.episode ?? null,
      reason: p.reason,
      ...(p.detailHref ? { detailHref: p.detailHref } : {}),
      provenance: { mechanism: 'media-poll', source: 'auto' },
    });
  }

  // 6. Dispatch up to limit (default 0 = plan-only: dispatchFn never called).
  const toExecute = Number.isFinite(limit) && limit > 0 ? plans.slice(0, Math.floor(limit)) : [];
  const byId = new Map(fresh.entries.map((e) => [e.id, e]));
  for (const p of toExecute) {
    if (!dispatchFn) {
      errors.push(`dispatch ${p.id}: no adapter wired (plan-only)`);
      continue;
    }
    try {
      const res = await dispatchFn(p);
      if (!res || res.ok !== true) {
        errors.push(`dispatch ${p.id}: ${res && res.error ? res.error : 'adapter refused'}`);
        continue;
      }
      const infoHash = String(res.infoHash ?? hashFromMagnet(p.magnet) ?? '').toLowerCase();
      appendJournal(paths.journal, {
        kind: 'dispatch.sent',
        id: p.id,
        infoHash,
        episode: p.episode ?? null,
        receipt: res.receipt ?? null,
        provenance: { mechanism: 'magnet-button-click', source: 'studio' },
      });
      const entry = byId.get(p.id);
      addLibraryEntry(
        paths.library,
        {
          id: `${p.id}:${infoHash || 'unknown'}`,
          kind: entryKind(entry),
          title: entry ? entry.title : p.id,
          ...(infoHash ? { infoHash } : {}),
          sourceUrl: p.detailHref ?? null,
          receipt: res.receipt ?? undefined,
        },
        { journalPath: paths.journal }
      );
      if (entry && entryKind(entry) === 'show' && p.episode) {
        const ep = parseEpisode(p.episode);
        if (ep) {
          const patch = { lastDispatchedEpisode: ep };
          if (typeof entry.season === 'number' && ep.season > entry.season) patch.season = ep.season;
          updateWantedEntry(paths.wanted, p.id, patch);
        }
      }
      summary.dispatched++;
    } catch (err) {
      errors.push(`dispatch ${p.id}: ${errText(err)}`);
    }
  }

  appendJournal(
    paths.journal,
    trackingPolledEvent({
      checked: fresh.entries.length,
      planned: plans.length,
      baselinesSet: baselinedIds.size,
    })
  );
  return summary;
}

// ---------------------------------------------------------------------------
// One-time watchlist seed from the owner's measured Chrome history
// ---------------------------------------------------------------------------

const SEARCH_URL_RE = /1337x\.to\/search\/([^/?#]+)/i;
const SHOW_QUERY_RE = /^(.+?)\s+s(\d{1,2})(?:e(\d{1,3}))?$/;

/**
 * Parse a 1337x search URL into {query, title, season, episode?}. Only the
 * owner's show shape "<title> s<NN>" / "<title> s<NNeNN>" produces an entry;
 * everything else (home, detail, category pages, free-text queries) → null.
 * @param {string} url
 * @returns {{query: string, title: string, season: number, episode?: number}|null}
 */
export function parseHistorySearchUrl(url) {
  const m = SEARCH_URL_RE.exec(String(url ?? ''));
  if (!m) return null;
  let query;
  try {
    query = decodeURIComponent(m[1]);
  } catch {
    query = m[1];
  }
  query = query.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!query) return null;
  const sm = SHOW_QUERY_RE.exec(query);
  if (!sm) return null;
  return {
    query,
    title: sm[1].trim(),
    season: parseInt(sm[2], 10),
    ...(sm[3] ? { episode: parseInt(sm[3], 10) } : {}),
  };
}

/**
 * One-time watchlist seed from the owner's measured Chrome history
 * (C:/VIVIM/channel/coordination/torrent-p54/1337x-history-raw.json — read
 * only). Show-shaped search queries whose summed visit count is >= 2 become
 * wanted rows {kind:'show', title (lowercase), season,
 * lastDispatchedEpisode:null, minSeeders, id, query, addedAt,
 * provenance:{source:'chrome-history', visits}}. Dedupe by title keeps the
 * highest season (ties: the most-searched query). Idempotent: ids already
 * present in the wanted store are skipped. Returns the seeded rows.
 * @param {string} rawHistoryPath
 * @param {string} storeDir
 * @returns {Array<object>}
 */
export function seedWantedFromHistory(rawHistoryPath, storeDir) {
  const raw = JSON.parse(readFileSync(rawHistoryPath, 'utf8'));
  const rows = Array.isArray(raw.rows1337x) ? raw.rows1337x : [];
  const byQuery = new Map();
  for (const row of rows) {
    const parsed = parseHistorySearchUrl(row && row.url);
    if (!parsed) continue;
    const visits = typeof row.visit_count === 'number' ? row.visit_count : 0;
    byQuery.set(parsed.query, (byQuery.get(parsed.query) ?? 0) + visits);
  }
  const candidates = new Map();
  for (const row of rows) {
    const parsed = parseHistorySearchUrl(row && row.url);
    if (!parsed) continue;
    const visits = byQuery.get(parsed.query) ?? 0;
    if (visits < 2) continue;
    const prev = candidates.get(parsed.title);
    const better =
      !prev ||
      parsed.season > prev.season ||
      (parsed.season === prev.season && visits > prev.visits);
    if (better) candidates.set(parsed.title, { season: parsed.season, visits, query: parsed.query });
  }
  const paths = storePaths(storeDir);
  const existing = new Set(loadWanted(paths.wanted).entries.map((e) => e.id));
  const seeded = [];
  for (const [title, c] of [...candidates.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const id = `show:${title.replace(/\s+/g, '-')}`;
    if (existing.has(id)) continue;
    seeded.push(
      addWanted(paths.wanted, {
        id,
        kind: 'show',
        title,
        season: c.season,
        lastDispatchedEpisode: null,
        minSeeders: 1,
        query: `${title} s${String(c.season).padStart(2, '0')}`,
        provenance: { source: 'chrome-history', visits: c.visits },
      })
    );
  }
  return seeded;
}

// ---------------------------------------------------------------------------
// One-time library seed from visited detail pages + downloads-dir matching
// ---------------------------------------------------------------------------

const DETAIL_URL_RE = /1337x\.to(\/torrent\/(\d+)\/([^/?#]*))/i;
const SHOW_SLUG_RE = /(?:^|[^a-z0-9])s(\d{2})(?:e(\d{2,3}))?(?:[^a-z0-9]|$)/i;

/**
 * Parse a 1337x detail-page URL into {torrentId, slug (separators → spaces),
 * kind ('show' when the slug carries an Sxx(Eyy) marker), sourceUrl}.
 * @param {string} url
 * @returns {{torrentId: string, slug: string, kind: 'show'|'movie', sourceUrl: string}|null}
 */
export function parseHistoryDetailUrl(url) {
  const m = DETAIL_URL_RE.exec(String(url ?? ''));
  if (!m) return null;
  const slugRaw = m[3];
  let slug;
  try {
    slug = decodeURIComponent(slugRaw);
  } catch {
    slug = slugRaw;
  }
  slug = slug.replace(/[-.]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!slug) return null;
  return {
    torrentId: m[2],
    slug,
    kind: SHOW_SLUG_RE.test(slug) ? 'show' : 'movie',
    sourceUrl: `https://1337x.to${m[1]}${m[1].endsWith('/') ? '' : '/'}`,
  };
}

/**
 * Read-only listing of a downloads dir: file and directory names at the top
 * level plus one level inside subdirectories. Missing/unreadable dir → [].
 * @param {string} downloadsDir
 * @returns {string[]}
 */
export function listDownloadNames(downloadsDir) {
  const names = [];
  if (!downloadsDir || !existsSync(downloadsDir)) return names;
  let top;
  try {
    top = readdirSync(downloadsDir, { withFileTypes: true });
  } catch {
    return names;
  }
  for (const e of top) {
    names.push(e.name);
    if (e.isDirectory()) {
      try {
        for (const inner of readdirSync(join(downloadsDir, e.name), { withFileTypes: true })) {
          names.push(inner.name);
        }
      } catch {
        // unreadable subdir: skip, never throw the scan
      }
    }
  }
  return names;
}

/** Case- and dot/underscore-insensitive release-name normalization. */
export function normReleaseName(s) {
  return String(s ?? '').toLowerCase().replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Match a release title against downloads names by normalized token overlap
 * on the first 4 slug words: a name matches when it equals the normalized
 * title or at least 3 of the first 4 tokens appear as whole tokens in it.
 * @param {string} title
 * @param {string[]} names
 * @returns {string|null} the matched downloads name
 */
export function matchDownloads(title, names) {
  const tokens = normReleaseName(title).split(' ').filter(Boolean).slice(0, 4);
  if (tokens.length === 0) return null;
  const needed = tokens.length >= 3 ? 3 : tokens.length;
  const normalizedTitle = normReleaseName(title);
  for (const name of names) {
    const n = normReleaseName(name);
    if (!n) continue;
    if (n === normalizedTitle) return name;
    const nameTokens = new Set(n.split(' '));
    const hit = tokens.filter((t) => nameTokens.has(t)).length;
    if (hit >= needed) return name;
  }
  return null;
}

/**
 * One-time personal-library seed from the owner's measured Chrome history:
 * every unique 1337x detail page (torrent id) becomes a library row
 * {id:'hist-<id>', kind, title (slug, separators → spaces), sourceUrl,
 * state, provenance:{source:'chrome-history', visitCount}}. State is
 * 'folder-detected' when a read-only scan of the downloads dir (top level +
 * one subdir level) matches the release title, else the new 'seeded' state.
 * Idempotent: ids already present are skipped. Returns the seeded rows.
 * @param {string} rawHistoryPath
 * @param {string} storeDir
 * @param {string} downloadsDir
 * @returns {Array<object>}
 */
export function seedLibraryFromHistory(rawHistoryPath, storeDir, downloadsDir) {
  const raw = JSON.parse(readFileSync(rawHistoryPath, 'utf8'));
  const rows = Array.isArray(raw.rows1337x) ? raw.rows1337x : [];
  const paths = storePaths(storeDir);
  const names = listDownloadNames(downloadsDir);
  const existing = new Set(listLibrary(paths.library).map((e) => e.id));
  const visitsById = new Map();
  const order = [];
  for (const row of rows) {
    const parsed = parseHistoryDetailUrl(row && row.url);
    if (!parsed || !parsed.torrentId) continue;
    const visits = typeof row.visit_count === 'number' ? row.visit_count : 0;
    if (!visitsById.has(parsed.torrentId)) {
      visitsById.set(parsed.torrentId, { parsed, visits: 0 });
      order.push(parsed.torrentId);
    }
    visitsById.get(parsed.torrentId).visits += visits;
  }
  const seeded = [];
  for (const torrentId of order) {
    const id = `hist-${torrentId}`;
    if (existing.has(id)) continue;
    const { parsed, visits } = visitsById.get(torrentId);
    const matchedName = matchDownloads(parsed.slug, names);
    seeded.push(
      addSeededLibraryEntry(
        paths.library,
        {
          id,
          kind: parsed.kind,
          title: parsed.slug,
          sourceUrl: parsed.sourceUrl,
          state: matchedName ? 'folder-detected' : 'seeded',
          visitCount: visits,
          ...(matchedName ? { matchedName } : {}),
        },
        { journalPath: paths.journal }
      )
    );
  }
  return seeded;
}
