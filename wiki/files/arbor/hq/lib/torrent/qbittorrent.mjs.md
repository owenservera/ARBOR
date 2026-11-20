# File: hq/lib/torrent/qbittorrent.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/qbittorrent.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5434 B |
| Lines | 129 |
| Hash | 7e353dfb47b2 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| login | function | 18 | yes | export async function login({ baseUrl, username, password, fetch: fetchImpl = globalThis.fetch }) { |
| res | const | 19 | no | const res = await fetchImpl(`${baseUrl}/api/v2/auth/login`, { method: &#39;POST&#39;, headers: { &#39;Content-Type&#39;: &#39;application/x-www-form-urlencoded&#39; }, body: `username=${encodeURIComponent(username)}&amp;passwor… |
| text | const | 24 | no | const text = await res.text(); |
| sid | const | 28 | no | const sid = extractSid(res); |
| extractSid | function | 34 | no | function extractSid(res) { |
| cookies | const | 35 | no | const cookies = typeof res.headers.getSetCookie === &#39;function&#39; ? res.headers.getSetCookie() : [res.headers.get(&#39;set-cookie&#39;)]; |
| m | const | 38 | no | const m = /SID=([^;]+)/.exec(c); |
| addMagnet | function | 45 | yes | export async function addMagnet(session, magnet, { savepath, category } = {}) { |
| form | const | 46 | no | const form = new FormData(); |
| res | const | 50 | no | const res = await session.fetch(`${session.baseUrl}/api/v2/torrents/add`, { method: &#39;POST&#39;, headers: { Cookie: `SID=${session.sid}` }, body: form, }); |
| text | const | 55 | no | const text = await res.text(); |
| listTorrents | function | 63 | yes | export async function listTorrents(session) { |
| res | const | 64 | no | const res = await session.fetch(`${session.baseUrl}/api/v2/torrents/info`, { headers: { Cookie: `SID=${session.sid}` }, }); |
| data | const | 68 | no | const data = await res.json(); |
| isAlive | function | 77 | yes | export async function isAlive(baseUrl, fetchImpl = globalThis.fetch) { |
| res | const | 79 | no | const res = await fetchImpl(`${baseUrl}/`); |
| EVIDENCE_RANK | const | 87 | no | const EVIDENCE_RANK = { queue: 0, torrent: 1, fastresume: 2 }; |
| HASH_RE | const | 88 | no | const HASH_RE = /^[0-9a-f]{40}$/; |
| detectArrivals | function | 100 | yes | export function detectArrivals(backupDir, knownHashes) { |
| known | const | 101 | no | const known = new Set([...(knownHashes ?? [])].map((h) =&gt; String(h).toLowerCase())); |
| best | const | 102 | no | const best = new Map(); // hash → strongest evidence seen |
| consider | function | 103 | no | const consider = (rawHash, evidence) =&gt; { |
| hash | const | 104 | no | const hash = String(rawHash ?? &#39;&#39;).trim().toLowerCase(); |
| prev | const | 106 | no | const prev = best.get(hash); |
| queuePath | const | 110 | no | const queuePath = join(backupDir, &#39;queue&#39;); |
| m | variable | 117 | no | let m = /^([0-9A-Fa-f]{40})\\.fastresume$/.exec(name); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 10 | external |
| node:path | import | 11 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/torrent/poll.mjs](./poll.mjs.md) | ./qbittorrent.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | qBittorrent WebUI API v2 client: login (SID cookie), addMagnet, |
| 5 | owner | hq-agent | — | hq-agent |
| 6 | task | — | — | P54-torrent |
| 7 | see | — | hq/work/goals/2026-11-08-torrent-media-recon.md | hq/work/goals/2026-11-08-torrent-media-recon.md (port 8081, never 8080) |
| 8 | invariant | — | — | localhost-only dispatch target; no password ever stored here. |

## Excerpt

```javascript
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
```

_First 80 of 130 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
