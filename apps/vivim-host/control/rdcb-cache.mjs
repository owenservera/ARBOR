// rdcb-cache.mjs — persistent source/revision-scoped bundle cache for RDCB v1.
//
// Keys bundles by sha256 of each seeded file's CURRENT bytes (not the
// file-surface registry sourceDigest, which drifts — see rdcb-gen.mjs:208-209
// and the baseline run that reported status=stale due to drift).
//
// On a cache hit (current sha256 == cached revision) the stored bundle is
// served verbatim and a reuse receipt is emitted:
//   { reusedBytes, reusedTokensEstimate, providerCostsMeasured, servedFromCache:true }
// reusedBytes / reusedTokensEstimate describe the source excerpt being reused
// and are reported SEPARATELY from providerCostsMeasured (no provider is
// invoked in v1 format-only generation, so providerCostsMeasured is 0).
//
// On a changed source revision the affected entry is invalidated (dropped)
// so only affected bundles are invalidated, never unrelated ones.
//
// All writes are atomic: tmp file + renameSync.
//
// v1 contract: format + generator only, no VLang execution, no provider
// integration. providerCostsMeasured stays 0 until VLang execution has
// independent accepted proof (roadmap §7).

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const CACHE_SCHEMA = 'vivim.rdcb-cache/1';
const CACHE_SUBDIR = '.cache';
const INDEX_FILE = 'index.json';
const TMP_SUFFIX = '.tmp';

// sha256 hex of raw bytes (current source bytes — the cache key / revision).
function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

function cacheDirFor(rdcbDir) {
  return join(rdcbDir, CACHE_SUBDIR);
}

function bundleFileFor(cacheDir, relPath) {
  const base = relPath.slice(relPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
  return join(cacheDir, base + '.bundle.v1.json');
}

function indexPath(cacheDir) {
  return join(cacheDir, INDEX_FILE);
}

function atomicWriteJson(filePath, value) {
  const tmp = filePath + TMP_SUFFIX;
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n');
  renameSync(tmp, filePath);
}

function readJsonOrNull(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// Load (or create) the cache index: Map<relPath, { revision, bundleFile,
// sizeBytes, estimatedTokens, cachedAt }>.
function loadIndex(cacheDir) {
  const idx = readJsonOrNull(indexPath(cacheDir));
  if (!idx || typeof idx !== 'object' || Array.isArray(idx)) return new Map();
  const entries = idx.entries && typeof idx.entries === 'object' && !Array.isArray(idx.entries)
    ? idx.entries
    : idx;
  return new Map(Object.entries(entries));
}

// Persist the index atomically.
function saveIndex(cacheDir, index) {
  const obj = Object.fromEntries(index);
  atomicWriteJson(indexPath(cacheDir), { schema: CACHE_SCHEMA, entries: obj });
}

// Look up a cache entry for relPath. Returns { revision, bundle } when the
// cached revision equals currentDigest (cache hit), else null (miss).
function cacheHit(cacheDir, relPath, currentDigest) {
  const index = loadIndex(cacheDir);
  const entry = index.get(relPath);
  if (!entry) return null;
  if (entry.revision !== currentDigest) return null; // revision changed -> miss
  const bundle = readJsonOrNull(entry.bundleFile);
  if (!bundle) return null;
  return { revision: entry.revision, bundle };
}

// Store a composed bundle under its source revision, atomically, and update
// the index. Returns the revision stored.
function storeBundle(cacheDir, relPath, currentDigest, bundle) {
  mkdirSync(cacheDir, { recursive: true });
  const bundleFile = bundleFileFor(cacheDir, relPath);
  const bytes = Buffer.from(JSON.stringify(bundle, null, 2) + '\n', 'utf8');
  atomicWriteJson(bundleFile, bundle);
  const index = loadIndex(cacheDir);
  index.set(relPath, {
    revision: currentDigest,
    bundleFile,
    sizeBytes: bytes.length,
    estimatedTokens: bundle.sources?.[0]?.estimatedTokens ?? 0,
    cachedAt: new Date().toISOString()
  });
  saveIndex(cacheDir, index);
  return currentDigest;
}

// Drop the cache entry for relPath (called when its source revision changed).
// Only this entry is removed — unrelated entries are untouched.
function invalidateEntry(cacheDir, relPath) {
  const index = loadIndex(cacheDir);
  const entry = index.get(relPath);
  if (entry) {
    try { unlinkSync(entry.bundleFile); } catch { /* already gone */ }
    index.delete(relPath);
    saveIndex(cacheDir, index);
  }
  return !index.has(relPath);
}

// Build a reuse receipt for a cache hit. reusedBytes / reusedTokensEstimate
// describe the reused source excerpt; providerCostsMeasured is reported
// separately (0 in v1 — no provider invoked).
function reuseReceipt(bundle, sourceBytes) {
  const source = Array.isArray(bundle.sources) && bundle.sources.length > 0
    ? bundle.sources[0]
    : {};
  const excerptText = source.excerpt && typeof source.excerpt.text === 'string'
    ? source.excerpt.text
    : '';
  const reusedBytes = Buffer.byteLength(excerptText, 'utf8');
  const reusedTokensEstimate = typeof source.estimatedTokens === 'number'
    ? source.estimatedTokens
    : Math.ceil(reusedBytes / 3);
  return {
    reusedBytes,
    reusedTokensEstimate,
    providerCostsMeasured: 0,
    servedFromCache: true,
    sourcePath: source.path ?? null,
    sourceRevision: source.sha256 ?? null
  };
}

export {
  CACHE_SUBDIR,
  cacheDirFor,
  cacheHit,
  storeBundle,
  invalidateEntry,
  reuseReceipt,
  sha256Hex,
  atomicWriteJson
};
