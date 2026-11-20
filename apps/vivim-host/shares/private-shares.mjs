// Host-owned private file-share store inspired by the MIT-licensed adcar/opensend.
// A share is NOT a public web endpoint: Direct/Tailscale and a live device grant
// are required by the caller before this module is reached.
import path from 'node:path';
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const HEX = /^[a-f0-9]{32}$/;
const TOKEN = /^[a-f0-9]{64}$/;
const text = (value) => typeof value === 'string' ? value : '';
const err = (status, code) => Object.assign(new Error(code), { status, code });
const hashToken = value => createHash('sha256').update(value).digest('hex');
const publicRow = row => ({
  schema: 'vivim.private-share/1', id: row.id, name: row.name,
  mime: row.mime, bytes: row.bytes, state: row.state, createdAt: row.createdAt,
  expiresAt: row.expiresAt, maxDownloads: row.maxDownloads,
  downloads: row.downloads, views: row.views, passcodeRequired: !!row.passHash,
  revokedAt: row.revokedAt || null, sha256: row.sha256 || null
});
function cleanName(raw) {
  const name = text(raw).replaceAll('\\', '/').split('/').pop().replace(/[\u0000-\u001f\u007f"<>:|?*]/g, '_').trim();
  if (!name || name.length > 180 || name === '.' || name === '..') throw err(400, 'SHARE_FILENAME_INVALID');
  return name;
}
function tokenEquals(presented, digest) {
  if (!TOKEN.test(text(presented)) || !TOKEN.test(text(digest))) return false;
  return timingSafeEqual(Buffer.from(hashToken(presented), 'hex'), Buffer.from(digest, 'hex'));
}
function checkActive(row) {
  if (!row || row.revokedAt) throw err(404, 'SHARE_NOT_FOUND');
  if (Date.parse(row.expiresAt) <= Date.now()) throw err(410, 'SHARE_EXPIRED');
  if (row.state !== 'ready') throw err(409, 'SHARE_NOT_READY');
}
function checkPasscode(row, supplied) {
  if (!row.passHash) return;
  if (!text(supplied) || text(supplied).length > 128) throw err(401, 'SHARE_PASSCODE_REQUIRED');
  const derived = scryptSync(text(supplied), Buffer.from(row.passSalt, 'hex'), 32);
  if (!timingSafeEqual(derived, Buffer.from(row.passHash, 'hex'))) throw err(403, 'SHARE_PASSCODE_INVALID');
}
export function createPrivateShares({ dataRoot }) {
  if (!dataRoot) throw new TypeError('dataRoot required');
  const root = path.join(path.resolve(dataRoot), 'private-shares');
  const locks = new Map();
  async function ensure() { await mkdir(root, { recursive: true, mode: 0o700 }); }
  const recordPath = id => path.join(root, id + '.json');
  const contentPath = id => path.join(root, id + '.bin');
  async function read(id) {
    if (!HEX.test(text(id))) throw err(400, 'SHARE_ID_INVALID');
    try {
      const row = JSON.parse(await readFile(recordPath(id), 'utf8'));
      if (row?.schema !== 'vivim.private-share-record/1' || row.id !== id) throw Error('record invalid');
      return row;
    } catch (cause) {
      if (cause.code === 'ENOENT') throw err(404, 'SHARE_NOT_FOUND');
      throw err(503, 'SHARE_STORE_UNAVAILABLE');
    }
  }
  async function save(row) {
    const temporary = path.join(root, row.id + '.' + randomBytes(8).toString('hex') + '.tmp');
    try {
      await writeFile(temporary, JSON.stringify(row), { flag: 'wx', mode: 0o600 });
      await rename(temporary, recordPath(row.id));
    } catch (cause) {
      await rm(temporary, { force: true }).catch(() => {});
      throw cause;
    }
  }
  // Serialize policy transitions per share: download limits and revocations cannot race.
  async function locked(id, action) {
    const previous = locks.get(id) || Promise.resolve();
    let release;
    const next = new Promise(resolve => { release = resolve; });
    locks.set(id, next);
    await previous;
    try { return await action(); } finally {
      release();
      if (locks.get(id) === next) locks.delete(id);
    }
  }
  async function reserve(input, ownerDeviceId) {
    if (!HEX.test(text(ownerDeviceId))) throw err(403, 'SHARE_OWNER_INVALID');
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
        Object.keys(input).some(key => !['name','mime','bytes','expiresInHours','maxDownloads','passcode'].includes(key)))
      throw err(400, 'SHARE_OPTIONS_INVALID');
    const bytes = input.bytes, hours = input.expiresInHours ?? 24, max = input.maxDownloads ?? 5;
    if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > MAX_BYTES) throw err(413, 'SHARE_SIZE_INVALID');
    if (!Number.isFinite(hours) || hours < 1 || hours * 3600000 > MAX_AGE_MS) throw err(400, 'SHARE_EXPIRY_INVALID');
    if (!Number.isInteger(max) || max < 1 || max > 100) throw err(400, 'SHARE_DOWNLOAD_LIMIT_INVALID');
    const name = cleanName(input.name);
    const mime = text(input.mime) || 'application/octet-stream';
    if (mime.length > 120 || !/^[\w.+-]+\/[\w.+-]+$/.test(mime)) throw err(400, 'SHARE_MIME_INVALID');
    const passcode = text(input.passcode);
    if (passcode && (passcode.length < 6 || passcode.length > 128)) throw err(400, 'SHARE_PASSCODE_INVALID');
    const id = randomBytes(16).toString('hex');
    const capability = randomBytes(32).toString('hex');
    const now = new Date();
    const salt = passcode ? randomBytes(16).toString('hex') : null;
    const row = {
      schema: 'vivim.private-share-record/1', id, name, mime, bytes, state: 'uploading',
      ownerDeviceId, tokenDigest: hashToken(capability),
      createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + hours * 3600000).toISOString(),
      maxDownloads: max, downloads: 0, views: 0, revokedAt: null, sha256: null,
      passSalt: salt, passHash: passcode ? scryptSync(passcode, Buffer.from(salt,'hex'), 32).toString('hex') : null
    };
    await ensure();
    await writeFile(recordPath(id), JSON.stringify(row), { flag: 'wx', mode: 0o600 });
    return { ...publicRow(row), capability };
  }
  async function finish(id, capability, ownerDeviceId, request) {
    return locked(id, async () => {
      const row = await read(id);
      if (row.ownerDeviceId !== ownerDeviceId || !tokenEquals(capability, row.tokenDigest)) throw err(403, 'SHARE_OWNER_DENIED');
      if (row.state !== 'uploading' || row.revokedAt) throw err(409, 'SHARE_ALREADY_FINALIZED');
      if (Date.parse(row.expiresAt) <= Date.now()) throw err(410, 'SHARE_EXPIRED');
      if (String(request.headers['content-type'] || '').split(';')[0].trim() !== 'application/octet-stream')
        throw err(415, 'SHARE_BINARY_REQUIRED');
      if (Number(request.headers['content-length']) !== row.bytes) throw err(400, 'SHARE_LENGTH_MISMATCH');
      const temporary = path.join(root, id + '.' + randomBytes(8).toString('hex') + '.upload');
      let count = 0;
      const digest = createHash('sha256');
      const limiter = new Transform({
        transform(chunk, encoding, callback) {
          count += chunk.length;
          if (count > row.bytes) return callback(err(413, 'SHARE_SIZE_LIMIT'));
          digest.update(chunk); callback(null, chunk);
        }
      });
      try {
        await pipeline(request, limiter, createWriteStream(temporary, { flags:'wx', mode:0o600 }));
        if (count !== row.bytes) throw err(400, 'SHARE_LENGTH_MISMATCH');
        await rename(temporary, contentPath(id));
        row.state = 'ready';
        row.sha256 = digest.digest('hex');
        await save(row);
        return publicRow(row);
      } catch (cause) {
        await rm(temporary, { force: true }).catch(() => {});
        throw cause;
      }
    });
  }
  async function list(ownerDeviceId) {
    await ensure();
    const names = await readdir(root);
    const items = [];
    for (const name of names.filter(x => /^[a-f0-9]{32}\.json$/.test(x)).slice(0, 2000)) {
      try {
        const row = await read(name.slice(0, 32));
        if (row.ownerDeviceId === ownerDeviceId) items.push(publicRow(row));
      } catch { /* record corruption does not disclose other files */ }
    }
    return { schema:'vivim.private-shares/1', items: items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)) };
  }
  async function inspect(id, capability, passcode) {
    return locked(id, async () => {
      const row = await read(id);
      if (!tokenEquals(capability, row.tokenDigest)) throw err(404, 'SHARE_NOT_FOUND');
      checkActive(row); checkPasscode(row, passcode);
      row.views += 1;
      await save(row);
      return publicRow(row);
    });
  }
  async function download(id, capability, passcode) {
    return locked(id, async () => {
      const row = await read(id);
      if (!tokenEquals(capability, row.tokenDigest)) throw err(404, 'SHARE_NOT_FOUND');
      checkActive(row); checkPasscode(row, passcode);
      if (row.downloads >= row.maxDownloads) throw err(410, 'SHARE_DOWNLOAD_LIMIT_REACHED');
      const info = await stat(contentPath(id)).catch(() => null);
      if (!info?.isFile() || info.size !== row.bytes) throw err(503, 'SHARE_CONTENT_UNAVAILABLE');
      row.downloads += 1; // download admission counts, even if client disconnects
      await save(row);
      return { ...publicRow(row), file: contentPath(id) };
    });
  }
  async function revoke(id, ownerDeviceId) {
    return locked(id, async () => {
      const row = await read(id);
      if (row.ownerDeviceId !== ownerDeviceId) throw err(403, 'SHARE_OWNER_DENIED');
      if (!row.revokedAt) {
        row.revokedAt = new Date().toISOString();
        await save(row);
        await rm(contentPath(id), { force: true }).catch(() => {});
      }
      return publicRow(row);
    });
  }
  return Object.freeze({ reserve, finish, list, inspect, download, revoke });
}
