// scripts/lib/test-cache.mjs — content-addressed proof cache for the HVI test gate.
//
// Cache lives at .hq/test-cache/v1.json (gitignored, local-only, no network).
//
// Fail-closed rule: a cached proof is reused only when the fingerprint matches
// exactly AND the cached exit code was 0. Proofs for failed or interrupted runs
// are NEVER written: cachePut() bails on any nonzero exit code, and an
// interrupted run never reaches cachePut() at all.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_PATH = join(REPO_ROOT, '.hq', 'test-cache', 'v1.json');
const CACHE_VERSION = 1;

function repoPath(...parts) {
  return join(REPO_ROOT, ...parts).replace(/\\/g, '/');
}

function loadCache() {
  try {
    const json = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
    if (json && json.version === CACHE_VERSION && json.entries && typeof json.entries === 'object') {
      return json;
    }
  } catch {
    // missing, empty or corrupt cache -> start fresh (never fail the gate on cache trouble)
  }
  return { version: CACHE_VERSION, entries: {} };
}

// Fingerprint = sha256(runtime + dependency closure file contents). A missing
// closure file hashes as '[missing]' so deletions are detectable.
export function fingerprintFor(runtime, closure) {
  const h = createHash('sha256');
  h.update(String(runtime));
  h.update('\0');
  for (const file of closure) {
    h.update(file);
    h.update('\0');
    let content = '[missing]';
    try {
      content = readFileSync(repoPath(file), 'utf8');
    } catch {
      // [missing]
    }
    h.update(content);
    h.update('\0');
  }
  return h.digest('hex');
}

// Reuse a cached proof only when exit code was 0. Failed runs never grant a
// proof (such entries are never created — see cachePut).
export function cacheGet(fingerprint) {
  const cache = loadCache();
  const entry = cache.entries[fingerprint];
  if (!entry || entry.exitCode !== 0) return null;
  return entry;
}

// Write a cache entry only for a fully successful run (exit code 0).
// Atomic: write a temp file, then rename over v1.json.
export function cachePut(fingerprint, proof) {
  if (proof.exitCode !== 0) return false; // never cache a failed/interrupted run
  const cache = loadCache();
  cache.entries[fingerprint] = {
    fingerprint,
    exitCode: 0,
    totals: proof.totals,
    durationMs: proof.durationMs,
    command: proof.command,
    gate: proof.gate,
    path: proof.path,
    cachedAt: new Date().toISOString(),
  };
  writeCache(cache);
  return true;
}

function writeCache(cache) {
  const dir = dirname(CACHE_PATH);
  mkdirSync(dir, { recursive: true });
  const tmp = `${CACHE_PATH}.tmp.${process.pid}`;
  writeFileSync(tmp, JSON.stringify(cache, null, 2) + '\n');
  renameSync(tmp, CACHE_PATH);
}
