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

/** Remove an entry by id. Throws when the id is not present. */
export function removeWanted(path, id) {
  const store = loadWanted(path);
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.id !== id);
  if (store.entries.length === before) {
    throw new Error(`wanted entry not found: ${id}`);
  }
  atomicWriteJson(path, store);
  return true;
}

/**
 * Append one journal event row: {seq, at, kind, ...event}. JSONL file.
 * @param {string} journalPath
 * @param {{kind: string, [k: string]: unknown}} event
 */
export function appendJournal(journalPath, event) {
  if (!event || typeof event.kind !== 'string' || !JOURNAL_KINDS.has(event.kind)) {
    throw new Error(`journal event requires a known kind, got: ${event && event.kind}`);
  }
  const rows = readJournal(journalPath);
  const row = {
    seq: rows.length === 0 ? 1 : rows[rows.length - 1].seq + 1,
    at: new Date().toISOString(),
    ...event,
  };
  ensureDir(journalPath);
  const line = `${JSON.stringify(row)}\n`;
  const tmp = `${journalPath}.tmp`;
  writeFileSync(tmp, (existsSync(journalPath) ? readFileSync(journalPath, 'utf8') : '') + line, 'utf8');
  renameSync(tmp, journalPath);
  return row;
}

/** Read all journal rows (JSONL). Missing file → []. */
export function readJournal(journalPath) {
  if (!existsSync(journalPath)) return [];
  return readFileSync(journalPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
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
