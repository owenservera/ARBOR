# File: apps/vivim-host/test/rdcb-reuse.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/rdcb-reuse.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11024 B |
| Lines | 279 |
| Hash | 9bcb1bff5eb7 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 51 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 52 | no | const REPO_ROOT = resolve(HERE, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| GEN | const | 53 | no | const GEN = resolve(REPO_ROOT, &#39;apps/vivim-host/control/rdcb-gen.mjs&#39;); |
| OUT_DIR | const | 54 | no | const OUT_DIR = resolve(REPO_ROOT, &#39;apps/vivim-host/data/demo-baseline/rdcb&#39;); |
| SEED_FILES | const | 55 | no | const SEED_FILES = [ |
| readRepoFile | function | 61 | no | function readRepoFile(relPath) { |
| runGen | function | 65 | no | function runGen() { |
| bundlePath | function | 73 | no | function bundlePath(name) { |
| readBundle | function | 76 | no | function readBundle(name) { |
| baseName | function | 79 | no | function baseName(relPath) { |
| assertReceiptShape | function | 83 | no | function assertReceiptShape(receipt) { |
| r1 | const | 121 | no | const r1 = runGen(); |
| r2 | const | 123 | no | const r2 = runGen(); |
| name | const | 129 | no | const name = baseName(rel); |
| b1 | const | 130 | no | const b1 = readBundle(name); |
| b2 | const | 131 | no | const b2 = readBundle(name); |
| receipt | const | 140 | no | const receipt = reuseReceipt(b2, readRepoFile(rel)); |
| bundles | const | 148 | no | const bundles = SEED_FILES.map((rel) =&gt; ({ rel, doc: readBundle(baseName(rel)) })); |
| receipt | const | 152 | no | const receipt = reuseReceipt(doc, readRepoFile(rel)); |
| cacheDir | const | 166 | no | const cacheDir = mkdtempSync(join(tmpdir(), &#39;arbor-a06-cache-&#39;)); |
| revisions | const | 169 | no | const revisions = {}; |
| doc | const | 171 | no | const doc = readBundle(baseName(rel)); |
| changed | const | 186 | no | const changed = SEED_FILES[0]; |
| fakeChangedDigest | const | 187 | no | const fakeChangedDigest = sha256Hex(Buffer.from(&#39;changed-revision-bytes-&#39; + changed)); |
| cacheDir | const | 219 | no | const cacheDir = mkdtempSync(join(tmpdir(), &#39;arbor-a06-fc-&#39;)); |
| callerA | const | 221 | no | const callerA = { caller: &#39;user-a&#39;, namespace: &#39;ns-a&#39; }; |
| callerB | const | 222 | no | const callerB = { caller: &#39;user-b&#39;, namespace: &#39;ns-b&#39; }; |
| rel | const | 223 | no | const rel = SEED_FILES[0]; |
| doc | const | 224 | no | const doc = readBundle(baseName(rel)); |
| revision | const | 225 | no | const revision = sha256Hex(readRepoFile(rel)); |
| name | const | 251 | no | const name = baseName(rel); |
| b | const | 252 | no | const b = readBundle(name); |
| source | const | 255 | no | const source = b.sources[0]; |
| workOrder | const | 260 | no | const workOrder = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 30 | external |
| node:assert/strict | import | 31 | external |
| node:crypto | import | 32 | external |
| node:fs | import | 33 | external |
| node:os | import | 40 | external |
| node:path | import | 41 | external |
| node:url | import | 42 | external |
| ../control/rdcb-cache.mjs | import | 43 | [apps/vivim-host/control/rdcb-cache.mjs](../control/rdcb-cache.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// apps/vivim-host/test/rdcb-reuse.test.mjs
//
// Partition 4 of roadmap item A06 (Incremental RDCB context with reuse receipts).
// Write scope: THIS FILE ONLY.
//
// Covers the A06 acceptance criteria:
//   1. Two unchanged runs reuse the same verified bundle digest; reuse receipt
//      reports reusedBytes/reusedTokensEstimate separately from provider costs.
//   2. A changed source revision invalidates only affected bundles.
//   3. Selected context (source excerpt + bundle digest) is attached to work
//      orders.
//   4. False / cross-user / unauthorized context reuse is rejected fail-closed.
//   5. vlangExecution stays false; fresh/stale status is honestly computed.
//
// Reads the production contract from partitions 0–3 (read-only, not modified):
//   apps/vivim-host/control/rdcb-cache.mjs — cacheHit, storeBundle,
//     invalidateEntry, reuseReceipt, sha256Hex
//   apps/vivim-host/control/rdcb-gen.mjs — the generator (invoked via
//     Bun.spawnSync, pattern from scripts/batch-evidence/RDCB-BASELINE.mjs).
//
// Grounding (this session):
//   rdcb-gen.mjs:208-209 — status computed from current sha256 vs sourceDigest.
//   rdcb-gen.mjs:273 — vlangExecution: false.
//   rdcb-gen.mjs:298-302 — digest excludes generatedAt (and itself).
//   rdcb-cache.mjs:128-147 — reuseReceipt reports reusedBytes +
//     reusedTokensEstimate separately from providerCostsMeasured (0 in v1).
//   RDCB-REUSE.mjs:176-193 — fail-closed: caller mismatch + fingerprint drift
//     both reject reuse; only the affected bundle is invalidated.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cacheHit,
  storeBundle,
  invalidateEntry,
  reuseReceipt,
  sha256Hex,
} from '../control/rdcb-cache.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const GEN = resolve(REPO_ROOT, 'apps/vivim-host/control/rdcb-gen.mjs');
const OUT_DIR = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/rdcb');
const SEED_FILES = [
  'apps/vivim-host/public/demo/controller.js',
  'apps/vivim-host/public/demo/demo.html',
  'apps/vivim-host/public/demo/poll-round.mjs',
];

function readRepoFile(relPath) {
  return readFileSync(join(REPO_ROOT, ...relPath.replace(/^apps\/vivim-host\/public\/demo\//, 'demo/host-legacy/').split('/')));
}

function runGen() {
  return Bun.spawnSync(['bun', GEN], {
    cwd: REPO_ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  });
}

function bundlePath(name) {
  return join(OUT_DIR, name + '.rdcb.v1.json');
}
function readBundle(name) {
  return JSON.parse(readFileSync(bundlePath(name), 'utf8'));
}
function baseName(relPath) {
  return relPath.slice(relPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
```

_First 80 of 280 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
