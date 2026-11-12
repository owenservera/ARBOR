/**
 * @hq:context qBittorrent WebUI API v2 client: login (SID cookie), addMagnet,
 *   listTorrents, isAlive. Injectable fetch so tests drive a local mock.
 *   Every response is parsed; non-OK responses throw with the HTTP status.
 * @hq:owner hq-agent
 * @hq:task P54-torrent
 * @hq:see hq/work/goals/2026-11-08-torrent-media-recon.md (port 8081, never 8080)
 * @hq:invariant localhost-only dispatch target; no password ever stored here.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Login and return a session carrying the SID cookie.
 * @param {{baseUrl: string, username: string, password: string, fetch?: typeof fetch}} opts
 * @returns {Promise<{baseUrl: string, sid: string, fetch: typeof fetch}>}
 */
export async function login({ baseUrl, username, password, fetch: fetchImpl = globalThis.fetch }) {
  const res = await fetchImpl(`${baseUrl}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  const text = await res.text();
  if (!res.ok || !text.includes('Ok.')) {
    throw new Error(`qbittorrent login failed: HTTP ${res.status}`);
  }
  const sid = extractSid(res);
  if (!sid) throw new Error(`qbittorrent login failed: no SID cookie (HTTP ${res.status})`);
  return { baseUrl, sid, fetch: fetchImpl };
}

/** Extract SID value from Set-Cookie headers (Bun getSetCookie or raw header). */
function extractSid(res) {
  const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  for (const c of cookies) {
    if (!c) continue;
    const m = /SID=([^;]+)/.exec(c);
    if (m) return m[1];
  }
  return null;
}

/** POST a magnet to /torrents/add (multipart). Returns true on "Ok.". */
export async function addMagnet(session, magnet, { savepath, category } = {}) {
  const form = new FormData();
  form.set('urls', magnet);
  if (savepath) form.set('savepath', savepath);
  if (category) form.set('category', category);
  const res = await session.fetch(`${session.baseUrl}/api/v2/torrents/add`, {
    method: 'POST',
    headers: { Cookie: `SID=${session.sid}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok || !text.includes('Ok.')) {
    throw new Error(`qbittorrent addMagnet failed: HTTP ${res.status}`);
  }
  return true;
}

/** GET /torrents/info → parsed array of {hash,name,state,progress,save_path}. */
export async function listTorrents(session) {
  const res = await session.fetch(`${session.baseUrl}/api/v2/torrents/info`, {
    headers: { Cookie: `SID=${session.sid}` },
  });
  if (!res.ok) throw new Error(`qbittorrent listTorrents failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`qbittorrent listTorrents failed: non-array body`);
  return data;
}

/**
 * True iff the WebUI root answers HTTP 200 (real clients serve the login page
 * unauthenticated; /app/version is auth-gated 403). Never throws.
 */
export async function isAlive(baseUrl, fetchImpl = globalThis.fetch) {
  try {
    const res = await fetchImpl(`${baseUrl}/`);
    return res.ok;
  } catch {
    return false;
  }
}

/** Evidence precedence when one hash shows up in several BT_backup artifacts. */
const EVIDENCE_RANK = { queue: 0, torrent: 1, fastresume: 2 };
const HASH_RE = /^[0-9a-f]{40}$/;

/**
 * Arrival detection, password-free: diff the qBittorrent BT_backup directory
 * against the hashes we already know. Evidence per measured facts — a `queue`
 * file (hash list, appears within seconds) and per-torrent `<hash>.torrent` /
 * `<hash>.fastresume` pairs (appear after metadata fetch). Hashes are
 * normalized lowercase. READ-ONLY: never writes into backupDir.
 * @param {string} backupDir e.g. %LOCALAPPDATA%/qBittorrent/BT_backup
 * @param {Set<string>|string[]} knownHashes already-seen info hashes
 * @returns {Array<{infoHash: string, evidence: 'queue'|'fastresume'|'torrent', firstSeenAt: string}>}
 */
export function detectArrivals(backupDir, knownHashes) {
  const known = new Set([...(knownHashes ?? [])].map((h) => String(h).toLowerCase()));
  const best = new Map(); // hash → strongest evidence seen
  const consider = (rawHash, evidence) => {
    const hash = String(rawHash ?? '').trim().toLowerCase();
    if (!HASH_RE.test(hash) || known.has(hash)) return;
    const prev = best.get(hash);
    if (!prev || EVIDENCE_RANK[evidence] > EVIDENCE_RANK[prev]) best.set(hash, evidence);
  };
  if (existsSync(backupDir)) {
    const queuePath = join(backupDir, 'queue');
    if (existsSync(queuePath)) {
      for (const line of readFileSync(queuePath, 'utf8').split(/\r?\n/)) {
        consider(line, 'queue');
      }
    }
    for (const name of readdirSync(backupDir)) {
      let m = /^([0-9A-Fa-f]{40})\.fastresume$/.exec(name);
      if (m) {
        consider(m[1], 'fastresume');
        continue;
      }
      m = /^([0-9A-Fa-f]{40})\.torrent$/.exec(name);
      if (m) consider(m[1], 'torrent');
    }
  }
  return [...best.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([infoHash, evidence]) => ({ infoHash, evidence, firstSeenAt: new Date().toISOString() }));
}
