# File: apps/vivim-host/media/playback.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/media/playback.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7618 B |
| Lines | 148 |
| Hash | a15367710074 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PLAYBACK_SCHEMA | const | 10 | yes | export const PLAYBACK_SCHEMA = &#39;vivim.media-playback/1&#39;; |
| DEFAULT_STORE | const | 11 | no | const DEFAULT_STORE = process.platform === &#39;win32&#39; ? &#39;C:/VIVIM/channel/vivim/torrent-store&#39; : null; |
| TYPES | const | 12 | no | const TYPES = new Map([ [&#39;.mp4&#39;, &#39;video/mp4&#39;], [&#39;.m4v&#39;, &#39;video/mp4&#39;], [&#39;.webm&#39;, &#39;video/webm&#39;], [&#39;.mp3&#39;, &#39;audio/mpeg&#39;], [&#39;.m4a&#39;, &#39;audio/mp4&#39;], [&#39;.ogg&#39;, &#39;audio/ogg&#39;] ]); |
| error | function | 16 | no | const error = (code, status = 404) =&gt; Object.assign(new Error(code), { code, status }); |
| safeAbsolute | function | 17 | no | const safeAbsolute = value =&gt; typeof value === &#39;string&#39; &amp;&amp; path.isAbsolute(value) &amp;&amp; |
| relativeParts | function | 20 | no | function relativeParts(value) { |
| pieces | const | 24 | no | const pieces = value.split(&#39;/&#39;); |
| parseMediaRange | function | 31 | yes | export function parseMediaRange(header, size) { |
| start | const | 37 | no | const start = match[1] ? Number(match[1]) : null; |
| limit | const | 38 | no | const limit = match[2] ? Number(match[2]) : null; |
| requirePlainFile | function | 49 | no | async function requirePlainFile(filename, maxBytes) { |
| stat | const | 50 | no | const stat = await lstat(filename); |
| createMediaPlaybackService | function | 56 | yes | export function createMediaPlaybackService({ storeDir = process.env.VIVIM_MEDIA_STORE_DIR \|\| DEFAULT_STORE, filesRoot = process.env.VIVIM_MEDIA_FILES_ROOT \|\| null } = {}) { |
| configured | const | 60 | no | const configured = safeAbsolute(storeDir) &amp;&amp; safeAbsolute(filesRoot); |
| mapping | function | 61 | no | async function mapping() { |
| root | const | 63 | no | const root = await lstat(storeDir); |
| directory | const | 65 | no | const directory = await lstat(filesRoot); |
| json | const | 67 | no | const json = await requirePlainFile(path.join(storeDir, &#39;playback.json&#39;), 512 * 1024); |
| map | const | 70 | no | const map = new Map(); |
| id | const | 72 | no | const id = mediaIdFor(row?.libraryId); |
| parts | const | 74 | no | const parts = relativeParts(row.relativePath); |
| safeFile | function | 81 | no | async function safeFile(parts, id, wantedFingerprint = null) { |
| root | const | 82 | no | const root = path.resolve(filesRoot); |
| current | variable | 83 | no | let current = root; |
| info | const | 86 | no | const info = await lstat(current); |
| mime | const | 91 | no | const mime = TYPES.get(path.extname(current).toLowerCase()); |
| handle | const | 93 | no | const handle = await open(current, constants.O_RDONLY \| (constants.O_NOFOLLOW \|\| 0)); |
| info | const | 95 | no | const info = await handle.stat(); |
| disk | const | 96 | no | const disk = await lstat(current); |
| fingerprint | const | 101 | no | const fingerprint = createHash(&#39;sha256&#39;).update([ id, info.dev, info.ino, info.size, info.mtimeMs ].join(&#39;:&#39;)).digest(&#39;hex&#39;); |
| resolve | function | 110 | no | async function resolve(mediaId, wantedFingerprint = null) { |
| item | const | 115 | no | const item = await findPlayableMediaEntry({storeDir, mediaId}); |
| map | const | 117 | no | const map = await mapping(); |
| parts | const | 118 | no | const parts = map.get(mediaId); |
| list | function | 122 | no | async function list({offset = 0} = {}) { |
| index | const | 123 | no | const index = await readMediaLibrarySummary({ storeDir, offset }); |
| map | variable | 127 | no | let map = null; |
| items | const | 131 | no | const items = []; |
| any | variable | 132 | no | let any = false; |
| playable | variable | 134 | no | let playable = false, mime = null; |
| parts | const | 135 | no | const parts = row.state === &#39;complete&#39; ? map?.get(row.mediaId) : null; |
| info | const | 138 | no | const info = await safeFile(parts, row.mediaId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:fs/promises | import | 5 | external |
| node:path | import | 6 | external |
| node:crypto | import | 7 | external |
| ./library-summary.mjs | import | 8 | [apps/vivim-host/media/library-summary.mjs](./library-summary.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./media/playback.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./media/playback.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](../test/direct-phone.test.mjs.md) | ../media/playback.mjs |
| [apps/vivim-host/test/media-playback.test.mjs](../test/media-playback.test.mjs.md) | ../media/playback.mjs |
| [apps/vivim-host/test/media-stream-http.test.mjs](../test/media-stream-http.test.mjs.md) | ../media/playback.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host-owned, explicitly mapped media files. HQ's catalog remains the sole title
// authority. A torrent completion state is NOT evidence of a playable local file.
// Never accept file paths from the phone or serve a URL/magnet from HQ records.
import { constants } from 'node:fs';
import { readFile, lstat, open } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readMediaLibrarySummary, findPlayableMediaEntry, mediaIdFor } from './library-summary.mjs';

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
```

_First 80 of 149 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
