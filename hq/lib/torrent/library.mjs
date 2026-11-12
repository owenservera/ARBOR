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
      receipt: entry.receipt ?? null,
    },
  };
  store.entries.push(stored);
  atomicWriteJson(path, store);
  if (journalPath) {
    appendJournal(journalPath, {
      kind: 'library.state',
      id: stored.id,
      from: null,
      to: 'dispatched',
      evidence: 'dispatch',
      provenance: stored.provenance,
    });
  }
  return stored;
}

/**
 * Add a history-seeded library row (chrome-history provenance, no dispatch
 * receipt behind it): state 'seeded' (nothing matched in the downloads dir)
 * or 'folder-detected' (a downloads-dir name matched the release title —
 * arrivedAt is stamped on the matched row). Journals `library.seeded` when
 * journalPath is given. Rejects duplicate id like addLibraryEntry.
 * @param {string} path library store JSON path
 * @param {{id: string, kind: 'show'|'movie', title: string, sourceUrl?: string,
 *   state?: 'seeded'|'folder-detected', visitCount?: number, matchedName?: string}} entry
 * @param {{journalPath?: string}} [opts]
 */
export function addSeededLibraryEntry(path, entry, { journalPath } = {}) {
  if (!entry || typeof entry.id !== 'string' || !entry.id) {
    throw new Error('library entry requires an id');
  }
  if (!LIBRARY_KINDS.has(entry.kind)) {
    throw new Error(`library entry requires kind 'show' or 'movie', got: ${entry && entry.kind}`);
  }
  if (typeof entry.title !== 'string' || !entry.title) {
    throw new Error('library entry requires a title');
  }
  const state = entry.state ?? 'seeded';
  if (state !== 'seeded' && state !== 'folder-detected') {
    throw new Error(`seeded library entry state must be 'seeded' or 'folder-detected', got: ${state}`);
  }
  const store = loadLibrary(path);
  if (store.entries.some((e) => e.id === entry.id)) {
    throw new Error(`library entry duplicate id: ${entry.id}`);
  }
  const provenance = {
    source: 'chrome-history',
    visitCount: typeof entry.visitCount === 'number' ? entry.visitCount : null,
    ...(entry.matchedName ? { matchedName: entry.matchedName } : {}),
  };
  const stored = {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    infoHash: null,
    size: null,
    sourceUrl: entry.sourceUrl ?? null,
    state,
    dispatchedAt: null,
    arrivedAt: state === 'folder-detected' ? new Date().toISOString() : null,
    provenance,
  };
  store.entries.push(stored);
  atomicWriteJson(path, store);
  if (journalPath) {
    appendJournal(journalPath, {
      kind: 'library.seeded',
      id: stored.id,
      title: stored.title,
      state: stored.state,
      sourceUrl: stored.sourceUrl,
      provenance,
    });
  }
  return stored;
}

/** Remove a library row by id. Throws when the id is not present. */
export function removeLibraryEntry(path, id, { journalPath } = {}) {
  const store = loadLibrary(path);
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.id !== id);
  if (store.entries.length === before) {
    throw new Error(`library entry not found: ${id}`);
  }
  atomicWriteJson(path, store);
  return true;
}

/** List library rows (fresh copy from disk). */
export function listLibrary(path) {
  return loadLibrary(path).entries.map((e) => ({ ...e }));
}

/**
 * Transition a row's state (dispatched → folder-detected → complete).
 * Stamps arrivedAt on first arrival evidence; journals `library.state`
 * {id, from, to, evidence, provenance} when journalPath is given.
 * @param {string} path
 * @param {string} id
 * @param {'dispatched'|'folder-detected'|'complete'} to
 * @param {{journalPath?: string, evidence?: string}} [opts]
 */
export function updateLibraryState(path, id, to, { journalPath, evidence } = {}) {
  if (!LIBRARY_STATES.includes(to)) {
    throw new Error(`unknown library state: ${to}`);
  }
  const store = loadLibrary(path);
  const row = store.entries.find((e) => e.id === id);
  if (!row) throw new Error(`library entry not found: ${id}`);
  const from = row.state;
  row.state = to;
  if ((to === 'folder-detected' || to === 'complete') && !row.arrivedAt) {
    row.arrivedAt = new Date().toISOString();
  }
  atomicWriteJson(path, store);
  if (journalPath) {
    appendJournal(journalPath, {
      kind: 'library.state',
      id,
      from,
      to,
      evidence: evidence ?? null,
      provenance: row.provenance,
    });
  }
  return row;
}

/**
 * Set/unset the favorite flag for a title id (idempotent; favorite:false on
 * an unknown id is a no-op that still journals). Journals `favorite.set`
 * {id, favorite, provenance}.
 * @param {string} path favorites store JSON path
 * @param {string} id
 * @param {boolean} favorite
 * @param {{journalPath?: string}} [opts]
 */
export function setFavorite(path, id, favorite, { journalPath } = {}) {
  if (typeof id !== 'string' || !id) throw new Error('favorite requires an id');
  const store = loadFavorites(path);
  store.entries = store.entries.filter((e) => e.id !== id);
  if (favorite) {
    store.entries.push({ id, favoriteAt: new Date().toISOString(), source: 'owner' });
  }
  store.entries.sort((a, b) => a.id.localeCompare(b.id));
  atomicWriteJson(path, store);
  if (journalPath) {
    appendJournal(journalPath, {
      kind: 'favorite.set',
      id,
      favorite: Boolean(favorite),
      provenance: { mechanism: 'owner-surface', source: 'owner' },
    });
  }
  return true;
}

/** List favorite ids' rows: [{id, favoriteAt, source}] sorted by id. */
export function listFavorites(path) {
  return loadFavorites(path).entries.map((e) => ({ ...e }));
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
