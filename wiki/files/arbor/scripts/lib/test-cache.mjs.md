# File: scripts/lib/test-cache.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/lib/test-cache.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3115 B |
| Lines | 90 |
| Hash | 3e5cd6ddd7c4 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 15 | no | const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| CACHE_PATH | const | 16 | no | const CACHE_PATH = join(REPO_ROOT, &#39;.hq&#39;, &#39;test-cache&#39;, &#39;v1.json&#39;); |
| CACHE_VERSION | const | 17 | no | const CACHE_VERSION = 1; |
| repoPath | function | 19 | no | function repoPath(...parts) { |
| loadCache | function | 23 | no | function loadCache() { |
| json | const | 25 | no | const json = JSON.parse(readFileSync(CACHE_PATH, &#39;utf8&#39;)); |
| fingerprintFor | function | 37 | yes | export function fingerprintFor(runtime, closure) { |
| h | const | 38 | no | const h = createHash(&#39;sha256&#39;); |
| content | variable | 44 | no | let content = &#39;[missing]&#39;; |
| cacheGet | function | 58 | yes | export function cacheGet(fingerprint) { |
| cache | const | 59 | no | const cache = loadCache(); |
| entry | const | 60 | no | const entry = cache.entries[fingerprint]; |
| cachePut | function | 67 | yes | export function cachePut(fingerprint, proof) { |
| cache | const | 69 | no | const cache = loadCache(); |
| writeCache | function | 84 | no | function writeCache(cache) { |
| dir | const | 85 | no | const dir = dirname(CACHE_PATH); |
| tmp | const | 87 | no | const tmp = `${CACHE_PATH}.tmp.${process.pid}`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 10 | external |
| node:fs | import | 11 | external |
| node:path | import | 12 | external |
| node:url | import | 13 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/test-gate.mjs](../test-gate.mjs.md) | ./lib/test-cache.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
