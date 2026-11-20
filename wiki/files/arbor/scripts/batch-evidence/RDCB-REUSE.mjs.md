# File: scripts/batch-evidence/RDCB-REUSE.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/batch-evidence/RDCB-REUSE.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11917 B |
| Lines | 252 |
| Hash | 66d1507ee707 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 27 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 28 | no | const REPO_ROOT = resolve(HERE, &#39;..&#39;, &#39;..&#39;); |
| ITEM | const | 29 | no | const ITEM = &#39;RDCB-REUSE&#39;; |
| GEN | const | 30 | no | const GEN = resolve(REPO_ROOT, &#39;apps/vivim-host/control/rdcb-gen.mjs&#39;); |
| OUT_DIR | const | 31 | no | const OUT_DIR = resolve(REPO_ROOT, &#39;apps/vivim-host/data/demo-baseline/rdcb&#39;); |
| SURFACE | const | 32 | no | const SURFACE = resolve(REPO_ROOT, &#39;apps/vivim-host/data/demo-baseline/file-surface.v1.json&#39;); |
| CATALOG | const | 33 | no | const CATALOG = resolve(REPO_ROOT, &#39;apps/vivim-host/control/action-catalog.v1.json&#39;); |
| SEED_FILES | const | 36 | no | const SEED_FILES = [ |
| REPO_TAG | const | 45 | no | const REPO_TAG = createHash(&#39;sha256&#39;).update(REPO_ROOT).digest(&#39;hex&#39;).slice(0, 16); |
| CACHE_DIR | const | 46 | no | const CACHE_DIR = join(os.tmpdir(), `arbor-rdcb-cache-${REPO_TAG}`); |
| CACHE_STATE | const | 47 | no | const CACHE_STATE = join(CACHE_DIR, &#39;cache-state.json&#39;); |
| TOKENS_PER_BYTE | const | 49 | no | const TOKENS_PER_BYTE = 3; // protocol estimator &quot;utf8-bytes/3&quot; |
| checks | const | 51 | no | const checks = []; |
| receipts | const | 52 | no | const receipts = []; |
| live | variable | 53 | no | let live = false; |
| caller | variable | 54 | no | let caller = null; |
| changePath | variable | 55 | no | let changePath = null; |
| arg | const | 58 | no | const arg = process.argv[i]; |
| fail | function | 82 | no | function fail(msg) { |
| check | function | 86 | no | function check(name, pass, detail) { |
| sha256Hex | function | 89 | no | function sha256Hex(data) { |
| estimateTokens | function | 92 | no | function estimateTokens(text) { |
| readRepoFile | function | 95 | no | function readRepoFile(relPath) { |
| loadCache | function | 99 | no | function loadCache() { |
| state | const | 101 | no | const state = JSON.parse(readFileSync(CACHE_STATE, &#39;utf8&#39;)); |
| saveCache | function | 106 | no | function saveCache(state) { |
| bundlePathFor | function | 110 | no | function bundlePathFor(relPath) { |
| readCachedBundle | function | 113 | no | function readCachedBundle(relPath) { |
| p | const | 114 | no | const p = bundlePathFor(relPath); |
| storeBundle | function | 117 | no | function storeBundle(relPath, bundle) { |
| dir | const | 118 | no | const dir = join(CACHE_DIR, &#39;bundles&#39;); |
| bytes | const | 120 | no | const bytes = JSON.stringify(bundle, null, 2) + &#39;\\n&#39;; |
| p | const | 121 | no | const p = bundlePathFor(relPath); |
| runGenerator | function | 127 | no | function runGenerator() { |
| r | const | 128 | no | const r = Bun.spawnSync([&#39;bun&#39;, GEN], { cwd: REPO_ROOT, stdout: &#39;pipe&#39;, stderr: &#39;pipe&#39; }); |
| readFreshBundle | function | 134 | no | function readFreshBundle(relPath) { |
| base | const | 135 | no | const base = relPath.slice(relPath.lastIndexOf(&#39;/&#39;) + 1).replace(/\\.[^.]+$/, &#39;&#39;); |
| p | const | 136 | no | const p = join(OUT_DIR, base + &#39;.rdcb.v1.json&#39;); |
| sourceFingerprint | function | 140 | no | function sourceFingerprint(relPath) { |
| main | function | 145 | no | function main() { |
| abs | const | 150 | no | const abs = join(REPO_ROOT, ...changePath.replace(/^apps\\/vivim-host\\/public\\/demo\\//, &#39;demo/host-legacy/&#39;).split(&#39;/&#39;)); |
| cur | const | 151 | no | const cur = readFileSync(abs, &#39;utf8&#39;); |
| cache | const | 160 | no | const cache = loadCache(); |
| byCaller | const | 161 | no | const byCaller = cache.entries[caller] \|\| { entries: {} }; |
| entries | const | 162 | no | const entries = byCaller.entries; |
| fingerprints | const | 165 | no | const fingerprints = {}; |
| generatorRan | variable | 170 | no | let generatorRan = false; |
| ensureGenerator | function | 171 | no | function ensureGenerator() { |
| currentDigest | const | 177 | no | const currentDigest = fingerprints[relPath]; |
| entry | const | 178 | no | const entry = entries[relPath]; |
| hit | const | 179 | no | const hit = entry &amp;&amp; entry.fingerprint === currentDigest &amp;&amp; entry.caller === caller; |
| bundle | variable | 181 | no | let bundle, servedFromCache, reusedBytes, reusedTokensEstimate, providerCosts; |
| bundleJson | const | 186 | no | const bundleJson = JSON.stringify(bundle); |
| bundleJson | const | 201 | no | const bundleJson = JSON.stringify(bundle); |
| bytesRegenerated | const | 202 | no | const bytesRegenerated = storeBundle(relPath, bundle); |
| source | const | 210 | no | const source = Array.isArray(bundle.sources) ? bundle.sources[0] : null; |
| workOrderAttachment | const | 211 | no | const workOrderAttachment = { |
| allFresh | const | 241 | no | const allFresh = receipts.every(r =&gt; r.workOrderAttachment.reprogramming?.vlangExecution === false); |
| allDigests | const | 243 | no | const allDigests = receipts.every(r =&gt; /^[0-9a-f]{64}$/.test(r.bundleDigest \|\| &#39;&#39;)); |
| ok | const | 246 | no | const ok = checks.every(c =&gt; c.pass); |
| verdict | const | 247 | no | const verdict = { ok, item: ITEM, checks, receipts }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 21 | external |
| node:fs | import | 22 | external |
| node:path | import | 23 | external |
| node:url | import | 24 | external |
| node:os | import | 25 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env bun
// scripts/batch-evidence/RDCB-REUSE.mjs
//
// Gate-evidence driver for item A06 — "Incremental RDCB context with reuse receipts".
// Persistent source/revision-scoped bundle cache keyed by sha256 of each seeded
// file's CURRENT bytes (not registry sourceDigest, which drifts).
//
//   bun scripts/batch-evidence/RDCB-REUSE.mjs [--live] [--caller <ns>] [--change <relPath>]
//
// --live       run the generator (rdcb-gen.mjs) on cache misses instead of serving from cache.
// --caller <ns> caller namespace/identity. REQUIRED. Namespaces do NOT authenticate
//   (scoped_graph.rs does not authenticate), so caller identity is explicit and is the
//   isolation key: a cache entry is only served to the caller that stored it.
// --change <relPath> append a newline to the seeded source to simulate a changed
//   source revision, exercising selective invalidation of only the affected bundle.
//
// Prints exactly one JSON object: { ok, checks:[{name,pass,detail}], receipts:[...] }
// Exits nonzero when any check fails. Writes cache state to a temp dir (never to the
// repo) so no repo file outside this script's own path is touched.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const ITEM = 'RDCB-REUSE';
const GEN = resolve(REPO_ROOT, 'apps/vivim-host/control/rdcb-gen.mjs');
const OUT_DIR = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/rdcb');
const SURFACE = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/file-surface.v1.json');
const CATALOG = resolve(REPO_ROOT, 'apps/vivim-host/control/action-catalog.v1.json');

// Same seeded corpus as rdcb-gen.mjs (order matters, explicit list, no globbing).
const SEED_FILES = [
  'apps/vivim-host/public/demo/controller.js',
  'apps/vivim-host/public/demo/demo.html',
  'apps/vivim-host/public/demo/poll-round.mjs'
];

// Persistent cache lives outside the repo (temp dir) so this script touches no
// repo file other than its own source. Keyed per repo root so concurrent clones
// don't collide.
const REPO_TAG = createHash('sha256').update(REPO_ROOT).digest('hex').slice(0, 16);
const CACHE_DIR = join(os.tmpdir(), `arbor-rdcb-cache-${REPO_TAG}`);
const CACHE_STATE = join(CACHE_DIR, 'cache-state.json');

const TOKENS_PER_BYTE = 3; // protocol estimator "utf8-bytes/3"

const checks = [];
const receipts = [];
let live = false;
let caller = null;
let changePath = null;

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === '--live') live = true;
  else if (arg === '--help' || arg === '-h') {
    process.stdout.write(`usage: bun ${resolve(HERE, 'RDCB-REUSE.mjs')} [--live] [--caller <ns>] [--change <relPath>]\n`);
    process.exit(0);
  } else if (arg === '--caller') {
    caller = process.argv[++i];
    if (!caller) fail('--caller requires a namespace value');
  } else if (arg === '--change') {
    changePath = process.argv[++i];
    if (!changePath) fail('--change requires a relative path');
  } else {
    process.stderr.write(`${ITEM}: unknown argument: ${arg}\n`);
    process.exit(2);
  }
}

// Fail-closed: caller identity must be explicit. Namespaces do not authenticate,
// so without an explicit caller no reuse decision can be authorized.
if (!caller) {
  process.stderr.write(`${ITEM}: --caller <ns> is required (caller identity is explicit; no ambient auth)\n`);
  process.exit(2);
}
```

_First 80 of 253 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
