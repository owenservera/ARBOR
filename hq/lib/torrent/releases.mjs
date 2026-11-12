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
 * @param {{now?: number|Date, journalPath?: string}} [opts]
 * @returns {Promise<Array<object>>} the upserted rows, in processed order
 */
export async function updateReleases(storePath, titles, fetchImpl = globalThis.fetch, { now, journalPath } = {}) {
  const ordered = [...(titles ?? [])].sort(
    (a, b) =>
      (b.favorite === true) - (a.favorite === true) ||
      titleOf(a).localeCompare(titleOf(b))
  );
  const store = loadReleases(storePath);
  const nowIso = new Date(now === undefined ? Date.now() : new Date(now)).toISOString();
  const rows = [];
  for (const item of ordered) {
    const title = titleOf(item);
    let row;
    try {
      const show = await findShow(title, fetchImpl);
      if (!show) {
        row = { title, tvmazeId: null, name: null, next: null, latestAired: null, reason: 'show-not-found', fetchedAt: nowIso };
      } else {
        const { latestAired, next } = await episodeWindow(show.tvmazeId, fetchImpl, now);
        row = { title, tvmazeId: show.tvmazeId, name: show.name, next, latestAired, fetchedAt: nowIso };
      }
    } catch (err) {
      row = { title, tvmazeId: null, name: null, next: null, latestAired: null, error: String((err && err.message) || err), fetchedAt: nowIso };
    }
    upsertByTitle(store, row);
    rows.push(row);
    if (journalPath) {
      appendJournal(journalPath, {
        kind: 'release.updated',
        title: row.title,
        tvmazeId: row.tvmazeId,
        next: row.next,
        latestAired: row.latestAired,
        ...(row.reason ? { reason: row.reason } : {}),
        ...(row.error ? { error: row.error } : {}),
        provenance: { source: 'tvmaze', showId: row.tvmazeId },
      });
    }
  }
  atomicWriteJson(storePath, store);
  return rows;
}

/** Load the releases collection. Missing file → {version:1, entries:[]}. */
export function loadReleases(path) {
  if (!existsSync(path)) return { version: 1, entries: [] };
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!data || !Array.isArray(data.entries)) {
    throw new Error(`releases store corrupt (no entries array): ${path}`);
  }
  return data;
}

function titleOf(item) {
  return typeof item === 'string' ? item : String(item && item.title);
}

function upsertByTitle(store, row) {
  const i = store.entries.findIndex((e) => e.title === row.title);
  if (i >= 0) store.entries[i] = row;
  else store.entries.push(row);
}

function atomicWriteJson(path, data) {
  ensureDir(path);
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  renameSync(tmp, path);
}

function ensureDir(path) {
  const dir = dirname(path);
  if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
}
