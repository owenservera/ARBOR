// Read-only adapter for the existing HQ media library. It never scans media paths,
// dispatches downloads, serves bytes, or infers that a completed torrent is playable.
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const MEDIA_SUMMARY_SCHEMA = 'vivim.media-library-summary/1';
// Opaque stable catalog address; never expose HQ's source ID, URL or info hash.
export const mediaIdFor = id => typeof id === 'string' && id.length > 0 && id.length <= 256
  ? createHash('sha256').update('vivim.media/1:' + id).digest('hex').slice(0, 32) : null;
const MAX_BYTES = 1024 * 1024;
const MAX_ITEMS = 25;
export const MEDIA_PAGE_SIZE = MAX_ITEMS;
export const MAX_MEDIA_OFFSET = 100000;
const VALID_STATES = new Set(['dispatched', 'folder-detected', 'complete', 'seeded']);
const VALID_KINDS = new Set(['movie', 'show']);
const noStore = reason => ({
  schema: MEDIA_SUMMARY_SCHEMA, state: 'unavailable', reason,
  total: 0, shown: 0, hasMore: false, favorites: 0, items: [],
  playback: 'not-integrated'
});
const bounded = (value, max) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

async function collection(dir, file, required = false) {
  const full = path.join(dir, file);
  let info;
  try { info = await lstat(full); }
  catch (error) {
    if (error.code === 'ENOENT' && !required) return { entries: [] };
    throw error;
  }
  if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_BYTES)
    throw new Error('MEDIA_COLLECTION_UNSAFE');
  const value = JSON.parse(await readFile(full, 'utf8'));
  if (!value || typeof value !== 'object' || !Array.isArray(value.entries))
    throw new Error('MEDIA_COLLECTION_INVALID');
  return value;
}

/**
 * The same owner-configured store used by repos-hq/hq/lib/torrent/library.mjs.
 * No filesystem path, source URL, info hash, magnet, or downloaded bytes leave the Host.
 * Reading a missing store returns an explicit unavailable state, never invented content.
 */
export async function readMediaLibrarySummary({
  storeDir = process.env.VIVIM_MEDIA_STORE_DIR ||
    (process.platform === 'win32' ? 'C:/VIVIM/channel/vivim/torrent-store' : null),
  offset = 0
} = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > MAX_MEDIA_OFFSET)
    return noStore('MEDIA_OFFSET_INVALID');
  if (typeof storeDir !== 'string' || !path.isAbsolute(storeDir) || storeDir.includes('\u0000'))
    return noStore('MEDIA_STORE_NOT_CONFIGURED');
  try {
    const dir = await lstat(storeDir);
    if (!dir.isDirectory() || dir.isSymbolicLink()) return noStore('MEDIA_STORE_UNSAFE');
    const library = await collection(storeDir, 'library.json', true);
    const favorites = await collection(storeDir, 'favorites.json');
    const favoriteIds = new Set(favorites.entries
      .map(row => typeof row?.id === 'string' ? row.id : '').filter(Boolean));
    const rows = library.entries.filter(row => row && VALID_KINDS.has(row.kind) &&
      VALID_STATES.has(row.state) && bounded(row.title, 160));
    const normalized = rows.map(row => ({
      title: bounded(row.title, 160),
      ...(mediaIdFor(row.id) ? { mediaId: mediaIdFor(row.id) } : {}),
      kind: row.kind,
      state: row.state,
      favorite: typeof row.id === 'string' && favoriteIds.has(row.id)
    }));
    normalized.sort((a, b) => Number(b.favorite) - Number(a.favorite) ||
      a.title.localeCompare(b.title) || a.kind.localeCompare(b.kind));
    const items = normalized.slice(offset, offset + MAX_ITEMS);
    return {
      schema: MEDIA_SUMMARY_SCHEMA, state: 'ready', reason: null,
      total: rows.length, offset, pageSize: MAX_ITEMS, shown: items.length,
      hasMore: rows.length > offset + items.length,
      favorites: normalized.filter(row => row.favorite).length,
      items, playback: 'not-integrated'
    };
  } catch (error) {
    return noStore(error.code === 'ENOENT' ? 'MEDIA_STORE_MISSING' : 'MEDIA_STORE_UNREADABLE');
  }
}


// A stream resolves an opaque media ID against the *full* bounded HQ catalog.
// Listing is paged, but the first page is never an authorization boundary.
// Return only a sanitized row; never a torrent source, magnet, info hash or path.
export async function findPlayableMediaEntry({storeDir, mediaId} = {}) {
  if (typeof mediaId !== 'string' || !/^[a-f0-9]{32}$/.test(mediaId) ||
      typeof storeDir !== 'string' || !path.isAbsolute(storeDir) || storeDir.includes('\0'))
    return null;
  try {
    const root = await lstat(storeDir);
    if (!root.isDirectory() || root.isSymbolicLink()) return null;
    const library = await collection(storeDir, 'library.json', true);
    const found = library.entries.filter(row => row && VALID_KINDS.has(row.kind) &&
      row.state === 'complete' && bounded(row.title, 160) &&
      mediaIdFor(row.id) === mediaId);
    if (found.length !== 1) return null; // duplicate IDs are ambiguous, never stream
    const row = found[0];
    return {mediaId, title: bounded(row.title,160), kind: row.kind, state:'complete'};
  } catch { return null; }
}
