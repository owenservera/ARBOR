# File: apps/vivim-host/control/rdcb-cache.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/rdcb-cache.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5549 B |
| Lines | 158 |
| Hash | 7320e0de4e28 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CACHE_SCHEMA | const | 27 | no | const CACHE_SCHEMA = &#39;vivim.rdcb-cache/1&#39;; |
| CACHE_SUBDIR | const | 28 | no | const CACHE_SUBDIR = &#39;.cache&#39;; |
| INDEX_FILE | const | 29 | no | const INDEX_FILE = &#39;index.json&#39;; |
| TMP_SUFFIX | const | 30 | no | const TMP_SUFFIX = &#39;.tmp&#39;; |
| sha256Hex | function | 33 | no | function sha256Hex(data) { |
| cacheDirFor | function | 37 | no | function cacheDirFor(rdcbDir) { |
| bundleFileFor | function | 41 | no | function bundleFileFor(cacheDir, relPath) { |
| base | const | 42 | no | const base = relPath.slice(relPath.lastIndexOf(&#39;/&#39;) + 1).replace(/\\.[^.]+$/, &#39;&#39;); |
| indexPath | function | 46 | no | function indexPath(cacheDir) { |
| atomicWriteJson | function | 50 | no | function atomicWriteJson(filePath, value) { |
| tmp | const | 51 | no | const tmp = filePath + TMP_SUFFIX; |
| readJsonOrNull | function | 56 | no | function readJsonOrNull(filePath) { |
| loadIndex | function | 66 | no | function loadIndex(cacheDir) { |
| idx | const | 67 | no | const idx = readJsonOrNull(indexPath(cacheDir)); |
| entries | const | 69 | no | const entries = idx.entries &amp;&amp; typeof idx.entries === &#39;object&#39; &amp;&amp; !Array.isArray(idx.entries) |
| saveIndex | function | 76 | no | function saveIndex(cacheDir, index) { |
| obj | const | 77 | no | const obj = Object.fromEntries(index); |
| cacheHit | function | 83 | no | function cacheHit(cacheDir, relPath, currentDigest) { |
| index | const | 84 | no | const index = loadIndex(cacheDir); |
| entry | const | 85 | no | const entry = index.get(relPath); |
| bundle | const | 88 | no | const bundle = readJsonOrNull(entry.bundleFile); |
| storeBundle | function | 95 | no | function storeBundle(cacheDir, relPath, currentDigest, bundle) { |
| bundleFile | const | 97 | no | const bundleFile = bundleFileFor(cacheDir, relPath); |
| bytes | const | 98 | no | const bytes = Buffer.from(JSON.stringify(bundle, null, 2) + &#39;\\n&#39;, &#39;utf8&#39;); |
| index | const | 100 | no | const index = loadIndex(cacheDir); |
| invalidateEntry | function | 114 | no | function invalidateEntry(cacheDir, relPath) { |
| index | const | 115 | no | const index = loadIndex(cacheDir); |
| entry | const | 116 | no | const entry = index.get(relPath); |
| reuseReceipt | function | 128 | no | function reuseReceipt(bundle, sourceBytes) { |
| source | const | 129 | no | const source = Array.isArray(bundle.sources) &amp;&amp; bundle.sources.length &gt; 0 |
| excerptText | const | 132 | no | const excerptText = source.excerpt &amp;&amp; typeof source.excerpt.text === &#39;string&#39; |
| reusedBytes | const | 135 | no | const reusedBytes = Buffer.byteLength(excerptText, &#39;utf8&#39;); |
| reusedTokensEstimate | const | 136 | no | const reusedTokensEstimate = typeof source.estimatedTokens === &#39;number&#39; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 23 | external |
| node:fs | import | 24 | external |
| node:path | import | 25 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/rdcb-gen.mjs](./rdcb-gen.mjs.md) | ./rdcb-cache.mjs |
| [apps/vivim-host/test/rdcb-reuse.test.mjs](../test/rdcb-reuse.test.mjs.md) | ../control/rdcb-cache.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 159 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
