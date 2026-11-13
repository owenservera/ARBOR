// Host-owned, explicitly mapped media files. HQ's catalog remains the sole title
// authority. A torrent completion state is NOT evidence of a playable local file.
// Never accept file paths from the phone or serve a URL/magnet from HQ records.
import { constants } from 'node:fs';
import { readFile, lstat, open } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readMediaLibrarySummary, mediaIdFor } from './library-summary.mjs';

export const PLAYBACK_SCHEMA = 'vivim.media-playback/1';
const DEFAULT_STORE = process.platform === 'win32' ? 'C:/VIVIM/channel/vivim/torrent-store' : null;
const TYPES = new Map([
  ['.mp4', 'video/mp4'], ['.m4v', 'video/mp4'], ['.webm', 'video/webm'],
  ['.mp3', 'audio/mpeg'], ['.m4a', 'audio/mp4'], ['.ogg', 'audio/ogg']
]);
const error = (code, status = 404) => Object.assign(new Error(code), { code, status });
const safeAbsolute = value => typeof value === 'string' && path.isAbsolute(value) &&
  !value.includes('\0') && value.length < 2048;

function relativeParts(value) {
  if (typeof value !== 'string' || value.length > 1024 ||
      !value || path.posix.isAbsolute(value) || path.win32.isAbsolute(value))
    throw error('MEDIA_FILE_MAPPING_INVALID', 400);
  const pieces = value.split('/');
  if (pieces.some(p => !p || p === '.' || p === '..' ||
      /[\\\x00-\x1f\x7f:*?"<>|]/u.test(p))) throw error('MEDIA_FILE_MAPPING_INVALID', 400);
  return pieces;
}

// RFC 7233 single byte range only. Multipart and unsafe integers are refused.
export function parseMediaRange(header, size) {
  if (!Number.isSafeInteger(size) || size < 1) throw error('MEDIA_FILE_EMPTY', 409);
  if (header === undefined) return { start: 0, end: size - 1, partial: false };
  if (typeof header !== 'string' || header.length > 100) throw error('MEDIA_RANGE_INVALID', 416);
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) throw error('MEDIA_RANGE_INVALID', 416);
  const start = match[1] ? Number(match[1]) : null;
  const limit = match[2] ? Number(match[2]) : null;
  if ((start !== null && !Number.isSafeInteger(start)) ||
      (limit !== null && !Number.isSafeInteger(limit))) throw error('MEDIA_RANGE_INVALID', 416);
  if (start === null) {
    if (limit === 0) throw error('MEDIA_RANGE_INVALID', 416);
    return { start: Math.max(0, size - limit), end: size - 1, partial: true };
  }
  if (start >= size || (limit !== null && limit < start)) throw error('MEDIA_RANGE_INVALID', 416);
  return { start, end: limit === null ? size - 1 : Math.min(size - 1, limit), partial: true };
}

async function requirePlainFile(filename, maxBytes) {
  const stat = await lstat(filename);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maxBytes)
    throw error('MEDIA_MAPPING_UNAVAILABLE', 409);
  return JSON.parse(await readFile(filename, 'utf8'));
}

export function createMediaPlaybackService({
  storeDir = process.env.VIVIM_MEDIA_STORE_DIR || DEFAULT_STORE,
  filesRoot = process.env.VIVIM_MEDIA_FILES_ROOT || null
} = {}) {
  const configured = safeAbsolute(storeDir) && safeAbsolute(filesRoot);
  async function mapping() {
    if (!configured) throw error('MEDIA_PLAYBACK_NOT_CONFIGURED', 409);
    const root = await lstat(storeDir);
    if (!root.isDirectory() || root.isSymbolicLink()) throw error('MEDIA_STORE_UNAVAILABLE', 409);
    const directory = await lstat(filesRoot);
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw error('MEDIA_ROOT_UNAVAILABLE', 409);
    const json = await requirePlainFile(path.join(storeDir, 'playback.json'), 512 * 1024);
    if (json?.version !== 1 || !Array.isArray(json.entries) || json.entries.length > 1000)
      throw error('MEDIA_MAPPING_UNAVAILABLE', 409);
    const map = new Map();
    for (const row of json.entries) {
      const id = mediaIdFor(row?.libraryId);
      if (!id || map.has(id)) throw error('MEDIA_MAPPING_UNAVAILABLE', 409);
      const parts = relativeParts(row.relativePath);
      if (!TYPES.has(path.extname(parts.at(-1)).toLowerCase()))
        throw error('MEDIA_FORMAT_UNSUPPORTED', 409);
      map.set(id, parts);
    }
    return map;
  }
  async function safeFile(parts, id, wantedFingerprint = null) {
    const root = path.resolve(filesRoot);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      current = path.join(current, parts[i]);
      const info = await lstat(current);
      if (info.isSymbolicLink() || (i < parts.length - 1 && !info.isDirectory()) ||
          (i === parts.length - 1 && !info.isFile()))
        throw error('MEDIA_FILE_UNAVAILABLE', 409);
    }
    const mime = TYPES.get(path.extname(current).toLowerCase());
    // No-follow on supporting filesystems; post-open fstat also checks identity.
    const handle = await open(current, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    try {
      const info = await handle.stat();
      const disk = await lstat(current);
      if (!info.isFile() || info.size < 1 || !Number.isSafeInteger(info.size) ||
          info.dev !== disk.dev || info.ino !== disk.ino ||
          info.size !== disk.size || info.mtimeMs !== disk.mtimeMs)
        throw error('MEDIA_FILE_CHANGED', 409);
      const fingerprint = createHash('sha256').update([
        id, info.dev, info.ino, info.size, info.mtimeMs
      ].join(':')).digest('hex');
      if (wantedFingerprint && wantedFingerprint !== fingerprint)
        throw error('MEDIA_FILE_CHANGED', 409);
      return { handle, size: info.size, mime, fingerprint,
        etag: '"' + fingerprint.slice(0, 32) + '"' };
    } catch (cause) { await handle.close(); throw cause; }
  }
  async function resolve(mediaId, wantedFingerprint = null) {
    if (typeof mediaId !== 'string' || !/^[a-f0-9]{32}$/.test(mediaId))
      throw error('MEDIA_ID_INVALID', 400);
    const index = await readMediaLibrarySummary({ storeDir });
    if (index.state !== 'ready') throw error('MEDIA_STORE_UNAVAILABLE', 409);
    // Only the bounded, displayed HQ catalog is addressable. Its 'complete'
    // status alone never makes media playable: a second owner mapping is required.
    const item = index.items.find(row => row.mediaId === mediaId);
    if (!item || item.state !== 'complete') throw error('MEDIA_NOT_PLAYABLE', 404);
    const map = await mapping();
    const parts = map.get(mediaId);
    if (!parts) throw error('MEDIA_NOT_MAPPED', 404);
    return safeFile(parts, mediaId, wantedFingerprint);
  }
  async function list() {
    const index = await readMediaLibrarySummary({ storeDir });
    if (index.state !== 'ready') return index;
    const items = [];
    let any = false;
    for (const row of index.items) {
      let playable = false, mime = null;
      if (configured && row.state === 'complete' && row.mediaId) {
        try {
          const info = await resolve(row.mediaId);
          mime = info.mime; playable = true; any = true; await info.handle.close();
        } catch { /* Unmapped or changing files are not advertised as playable. */ }
      }
      items.push({ ...row, playable, ...(playable ? { mime } : {}) });
    }
    return { ...index, items, playback: any ? 'available' :
      configured ? 'none-mapped' : 'not-configured' };
  }
  return { list, resolve, configured: Boolean(configured) };
}
