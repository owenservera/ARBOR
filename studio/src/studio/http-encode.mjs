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
  if (header.trim() === '*') return true;
  const bare = tag.replace(/^W\//, '');
  return header.split(',').some((raw) => {
    const candidate = raw.trim();
    if (!candidate) return false;
    return candidate === tag || candidate.replace(/^W\//, '') === bare;
  });
}

function compress(encoding, bytes, variants) {
  if (variants && Buffer.isBuffer(variants[encoding])) return variants[encoding];
  const out = encoding === 'br'
    ? brotliCompressSync(bytes, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } })
    : gzipSync(bytes, { level: GZIP_LEVEL });
  if (variants) variants[encoding] = out;
  return out;
}

/**
 * Write one response with negotiation, ETag/304, correct content-length and HEAD support.
 *
 * Caller `headers` are preserved (CSP, `allow`, content-type overrides); this helper only owns
 * content-length, vary and content-encoding. `variants` is an optional cache object ({ gzip, br })
 * used by staticFile so a repeat request reuses an already-compressed buffer.
 */
export function sendEncoded(res, {
  status = 200,
  contentType,
  body,
  headers = {},
  compress: allowCompression = true,
  etag = true,
  cacheControl = 'no-store',
  variants,
} = {}) {
  if (!res || res.destroyed || res.writableEnded) return;
  const req = res.req;
  const method = (req && req.method) || 'GET';
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body == null ? '' : String(body), 'utf8');
  const tag = etag && bytes.length > 0 ? etagFor(bytes) : null;

  // `vary` is only meaningful when a coding could be chosen for this body.
  const negotiable = allowCompression === true && bytes.length > 0;
  const vary = negotiable;
  const weights = negotiable ? acceptWeights(req && req.headers && req.headers['accept-encoding']) : null;
  const encoding = negotiable ? pickEncoding(weights, bytes.length, allowCompression) : null;

  const out = { 'cache-control': cacheControl };
  if (contentType) out['content-type'] = contentType;
  Object.assign(out, headers || {});

  const bodyless = status === 204 || status === 304;
  if (tag && ifNoneMatchMatches(req && req.headers && req.headers['if-none-match'], tag)) {
    delete out['content-length'];
    delete out['content-encoding'];
    out.etag = tag;
    if (vary) out.vary = 'accept-encoding';
    res.writeHead(304, out);
    res.end();
    return;
  }

  if (tag) out.etag = tag;
  if (vary) out.vary = 'accept-encoding';
  if (bodyless) {
    delete out['content-length'];
    delete out['content-encoding'];
    res.writeHead(status, out);
    res.end();
    return;
  }

  const payload = encoding ? compress(encoding, bytes, variants) : bytes;
  if (encoding) out['content-encoding'] = encoding;
  else delete out['content-encoding'];
  out['content-length'] = String(payload.length);
  res.writeHead(status, out);
  if (method === 'HEAD') return res.end();
  res.end(payload);
}

// Absolute path -> { mtimeMs, size, body, gzip, br }. Bounded: Studio serves a small fixed asset set.
const staticCache = new Map();

/** Drop a cached file (test/ops hook); the next staticFile call re-reads it from disk. */
export function clearStaticCache() {
  staticCache.clear();
}

/**
 * Serve a static file from the per-process cache. Invalidation is statSync mtimeMs/size, so an edited
 * asset is picked up on the next request without a restart. A missing file throws the raw ENOENT error
 * and the caller maps it to its existing 404 (this never crashes the process).
 */
export function staticFile(res, { path: filePath, contentType, cacheControl = 'no-store', headers = {} } = {}) {
  const abs = filePath instanceof URL ? fileURLToPath(filePath) : path.resolve(String(filePath));
  const stat = statSync(abs);
  let entry = staticCache.get(abs);
  if (!entry || entry.mtimeMs !== stat.mtimeMs || entry.size !== stat.size) {
    entry = { mtimeMs: stat.mtimeMs, size: stat.size, body: readFileSync(abs), gzip: null, br: null };
    staticCache.delete(abs);
    staticCache.set(abs, entry);
    while (staticCache.size > MAX_CACHED_FILES) staticCache.delete(staticCache.keys().next().value);
  }
  return sendEncoded(res, {
    contentType,
    body: entry.body,
    headers,
    cacheControl,
    etag: true,
    variants: entry,
  });
}
