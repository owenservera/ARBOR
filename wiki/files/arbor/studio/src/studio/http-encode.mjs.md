# File: studio/src/studio/http-encode.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/http-encode.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7942 B |
| Lines | 193 |
| Hash | 82ed2687aebf |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MIN_COMPRESS_BYTES | const | 17 | yes | export const MIN_COMPRESS_BYTES = 1024; |
| GZIP_LEVEL | const | 19 | no | const GZIP_LEVEL = 6; |
| BROTLI_QUALITY | const | 20 | no | const BROTLI_QUALITY = 4; |
| MAX_CACHED_FILES | const | 21 | no | const MAX_CACHED_FILES = 64; |
| etagFor | function | 24 | yes | export function etagFor(bytes) { |
| hash | const | 25 | no | const hash = createHash(&#39;sha1&#39;).update(bytes).digest(&#39;base64url&#39;).slice(0, 27); |
| qualityMap | function | 33 | no | function qualityMap(header) { |
| out | const | 34 | no | const out = new Map(); |
| params | const | 37 | no | const params = part.split(&#39;;&#39;); |
| token | const | 38 | no | const token = (params.shift() ?? &#39;&#39;).trim().toLowerCase(); |
| q | variable | 40 | no | let q = 1; |
| eq | const | 42 | no | const eq = param.indexOf(&#39;=&#39;); |
| n | const | 45 | no | const n = Number(param.slice(eq + 1).trim()); |
| qualityOf | function | 54 | no | function qualityOf(map, name, fallback) { |
| acceptWeights | function | 61 | yes | export function acceptWeights(header) { |
| map | const | 62 | no | const map = qualityMap(header); |
| pickEncoding | function | 71 | yes | export function pickEncoding(weights, byteLength, compress = true) { |
| best | const | 73 | no | const best = weights.br &gt; 0 &amp;&amp; weights.br &gt;= weights.gzip ? &#39;br&#39; : weights.gzip &gt; 0 ? &#39;gzip&#39; : null; |
| ifNoneMatchMatches | function | 79 | no | function ifNoneMatchMatches(header, tag) { |
| bare | const | 82 | no | const bare = tag.replace(/^W\\//, &#39;&#39;); |
| candidate | const | 84 | no | const candidate = raw.trim(); |
| compress | function | 90 | no | function compress(encoding, bytes, variants) { |
| out | const | 92 | no | const out = encoding === &#39;br&#39; |
| sendEncoded | function | 106 | yes | export function sendEncoded(res, { status = 200, contentType, body, headers = {}, |
| req | const | 117 | no | const req = res.req; |
| method | const | 118 | no | const method = (req &amp;&amp; req.method) \|\| &#39;GET&#39;; |
| bytes | const | 119 | no | const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body == null ? &#39;&#39; : String(body), &#39;utf8&#39;); |
| tag | const | 120 | no | const tag = etag &amp;&amp; bytes.length &gt; 0 ? etagFor(bytes) : null; |
| negotiable | const | 123 | no | const negotiable = allowCompression === true &amp;&amp; bytes.length &gt; 0; |
| vary | const | 124 | no | const vary = negotiable; |
| weights | const | 125 | no | const weights = negotiable ? acceptWeights(req &amp;&amp; req.headers &amp;&amp; req.headers[&#39;accept-encoding&#39;]) : null; |
| encoding | const | 126 | no | const encoding = negotiable ? pickEncoding(weights, bytes.length, allowCompression) : null; |
| out | const | 128 | no | const out = { &#39;cache-control&#39;: cacheControl }; |
| bodyless | const | 132 | no | const bodyless = status === 204 \|\| status === 304; |
| payload | const | 153 | no | const payload = encoding ? compress(encoding, bytes, variants) : bytes; |
| staticCache | const | 163 | no | const staticCache = new Map(); |
| clearStaticCache | function | 166 | yes | export function clearStaticCache() { |
| staticFile | function | 175 | yes | export function staticFile(res, { path: filePath, contentType, cacheControl = &#39;no-store&#39;, headers = {} } = {}) { |
| abs | const | 176 | no | const abs = filePath instanceof URL ? fileURLToPath(filePath) : path.resolve(String(filePath)); |
| stat | const | 177 | no | const stat = statSync(abs); |
| entry | variable | 178 | no | let entry = staticCache.get(abs); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 10 | external |
| node:fs | import | 11 | external |
| node:zlib | import | 12 | external |
| node:path | import | 13 | external |
| node:url | import | 14 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/http.mjs](./http.mjs.md) | ./http-encode.mjs |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./http-encode.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// One shared response encoder for the Studio's local HTTP surface.
//
// Why: Studio used to write every response uncompressed with `cache-control: no-store`, and to re-read
// static assets from disk on every request. On the measured baseline that meant ~626 KB of identity
// bytes for the world first paint. This module adds one negotiation path (br, then gzip), a stable weak
// ETag with 304 revalidation, correct `content-length`, HEAD support, and a per-process static cache
// that keeps the identity body AND the compressed variants, so repeat requests do no compression work.
//
// Zero dependencies: node:crypto, node:fs, node:zlib only.
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Below this size the framing cost outweighs the win, so the body goes out as identity.
export const MIN_COMPRESS_BYTES = 1024;
// Fixed, low-cost compression settings: local loopback latency, not ratio, is the scarce resource.
const GZIP_LEVEL = 6;
const BROTLI_QUALITY = 4;
const MAX_CACHED_FILES = 64;

/** Weak ETag over the identity body: stable across encodings, 27 base64url chars of SHA-1. */
export function etagFor(bytes) {
  const hash = createHash('sha1').update(bytes).digest('base64url').slice(0, 27);
  return `W/"${hash}"`;
}

/**
 * Parse an `accept-encoding` value into quality weights. Never throws: garbage tokens and unparseable
 * q-values are treated as q=0 (the client did not ask for that coding), not as a server error.
 */
function qualityMap(header) {
  const out = new Map();
  if (typeof header !== 'string' || !header.trim()) return out;
  for (const part of header.split(',')) {
    const params = part.split(';');
    const token = (params.shift() ?? '').trim().toLowerCase();
    if (!token) continue;
    let q = 1;
    for (const param of params) {
      const eq = param.indexOf('=');
      if (eq < 0) continue;
      if (param.slice(0, eq).trim().toLowerCase() !== 'q') continue;
      const n = Number(param.slice(eq + 1).trim());
      q = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
      break;
    }
    out.set(token, Math.max(out.get(token) ?? 0, q));
  }
  return out;
}

function qualityOf(map, name, fallback) {
  if (map.has(name)) return map.get(name);
  if (map.has('*')) return map.get('*');
  return fallback;
}

/** Negotiated weights for the three codings this server can speak. `identity` defaults to acceptable. */
export function acceptWeights(header) {
  const map = qualityMap(header);
  return { br: qualityOf(map, 'br', 0), gzip: qualityOf(map, 'gzip', 0), identity: qualityOf(map, 'identity', 1) };
}

/**
 * Best coding for this body: brotli wins ties, gzip is the fallback. Returns null for identity.
 * Bodies under MIN_COMPRESS_BYTES stay identity unless the client refused identity outright
 * (`identity;q=0`), in which case an allowed coding is used so the response stays acceptable.
 */
export function pickEncoding(weights, byteLength, compress = true) {
  if (!compress) return null;
  const best = weights.br > 0 && weights.br >= weights.gzip ? 'br' : weights.gzip > 0 ? 'gzip' : null;
  if (!best) return null;
  if (byteLength >= MIN_COMPRESS_BYTES) return best;
  return weights.identity === 0 ? best : null;
}

function ifNoneMatchMatches(header, tag) {
  if (typeof header !== 'string' || !header) return false;
```

_First 80 of 194 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
