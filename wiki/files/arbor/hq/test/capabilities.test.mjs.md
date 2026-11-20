# File: hq/test/capabilities.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/capabilities.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18420 B |
| Lines | 393 |
| Hash | 00ff3daee3ce |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT_EARLY | const | 22 | no | const AT_EARLY = &#39;2026-01-01T00:00:00.000Z&#39;; |
| AT_LATE | const | 23 | no | const AT_LATE = &#39;2026-06-01T00:00:00.000Z&#39;; |
| SOURCE_ID | const | 24 | no | const SOURCE_ID = &#39;fixture-source&#39;; |
| TEMP_DIRS | const | 27 | no | const TEMP_DIRS = new Set(); |
| sleep | function | 29 | no | const sleep = (ms) =&gt; new Promise((resolve) =&gt; setTimeout(resolve, ms)); |
| removeTempDir | function | 45 | no | async function removeTempDir(dir) { |
| leftovers | const | 66 | no | const leftovers = []; |
| fixture | function | 78 | no | function fixture() { |
| root | const | 79 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-capability-&#39;)); |
| write | function | 81 | no | const write = (rel, content) =&gt; { |
| abs | const | 82 | no | const abs = join(root, rel); |
| withFixture | function | 116 | no | async function withFixture(fn) { |
| root | const | 117 | no | const root = fixture(); |
| scan | function | 121 | no | const scan = (root, now = AT_EARLY) =&gt; scanCapabilitySource(root, { id: SOURCE_ID, now, taxonomy: loadTaxonomy(), contracts: loadContracts(), }); |
| count | function | 125 | no | const count = (db, table) =&gt; db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n; |
| result | const | 128 | no | const result = scan(root); |
| readme | const | 145 | no | const readme = result.documents[0]; |
| pkgA | const | 151 | no | const pkgA = result.packages.find((p) =&gt; p.name === &#39;a&#39;); |
| edge | const | 162 | no | const edge = result.dependencies.find((d) =&gt; d.fromPath === &#39;node_modules/a&#39; &amp;&amp; d.toName === &#39;b&#39;); |
| first | const | 170 | no | const first = scan(root, AT_EARLY); |
| second | const | 171 | no | const second = scan(root, AT_LATE); |
| db | const | 180 | no | const db = openMemoryDb(); |
| first | const | 182 | no | const first = persistCapabilityScan(db, scan(root, AT_EARLY)); |
| tables | const | 189 | no | const tables = [&#39;capability_source&#39;, &#39;capability_package&#39;, &#39;capability_dependency&#39;, &#39;capability_file&#39;, |
| before | const | 191 | no | const before = Object.fromEntries(tables.map((t) =&gt; [t, count(db, t)])); |
| ftsBefore | const | 192 | no | const ftsBefore = [count(db, &#39;capability_document_fts&#39;), count(db, &#39;capability_package_fts&#39;)]; |
| second | const | 205 | no | const second = persistCapabilityScan(db, scan(root, AT_LATE)); |
| after | const | 207 | no | const after = Object.fromEntries(tables.map((t) =&gt; [t, count(db, t)])); |
| status | const | 211 | no | const status = capabilityStatus(db); |
| db | const | 224 | no | const db = openMemoryDb(); |
| hits | const | 227 | no | const hits = searchCapabilityDocuments(db, { query: &#39;demonstrates&#39; }); |
| glob | const | 234 | no | const glob = searchCapabilityDocuments(db, { query: &#39;glob pattern&#39; }); |
| result | const | 241 | no | const result = scan(root); |
| glob | const | 243 | no | const glob = result.maps.find((m) =&gt; m.nodeId === &#39;discovery.glob&#39; &amp;&amp; m.installPath === &#39;node_modules/a&#39;); |
| mapped | const | 253 | no | const mapped = result.contracts.filter((c) =&gt; c.installPath !== null); |
| db | const | 257 | no | const db = openMemoryDb(); |
| rows | const | 260 | no | const rows = listCapabilityContracts(db, { status: &#39;proposed&#39; }); |
| db | const | 268 | no | const db = openMemoryDb(); |
| exported | const | 271 | no | const exported = exportCapabilityJson(db, { sourceId: SOURCE_ID }); |
| full | const | 291 | no | const full = exportCapabilityJson(db); |
| exportDir | function | 300 | no | function exportDir() { |
| dir | const | 301 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-capability-export-&#39;)); |
| db | const | 307 | no | const db = openMemoryDb(); |
| out | const | 308 | no | const out = exportDir(); |
| target | const | 309 | no | const target = join(out.dir, &#39;capability-export.db&#39;); |
| result | const | 312 | no | const result = exportCapabilitySqlite(db, { path: target, sourceId: SOURCE_ID }); |
| exported | const | 317 | no | const exported = new DatabaseSync(target); |
| largeFixture | function | 332 | no | function largeFixture(packageCount) { |
| root | const | 333 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-capability-large-&#39;)); |
| write | function | 335 | no | const write = (rel, content) =&gt; { |
| abs | const | 336 | no | const abs = join(root, rel); |
| lockPackages | const | 340 | no | const lockPackages = { &#39;&#39;: { name: &#39;large-root&#39;, version: &#39;1.0.0&#39; } }; |
| name | const | 343 | no | const name = i === 0 ? &#39;fixture-glob&#39; : `fixture-pkg-${i}`; |
| installPath | const | 344 | no | const installPath = `node_modules/${name}`; |
| description | const | 345 | no | const description = i === 0 ? &#39;Glob pattern matching fixture&#39; : &#39;Generated dependency fixture&#39;; |
| PACKAGE_COUNT | const | 356 | no | const PACKAGE_COUNT = 300; |
| root | const | 357 | no | const root = largeFixture(PACKAGE_COUNT); |
| db | const | 358 | no | const db = openMemoryDb(); |
| out | const | 359 | no | const out = exportDir(); |
| target | const | 360 | no | const target = join(out.dir, &#39;capability-large-export.db&#39;); |
| before | const | 363 | no | const before = db.prepare(&#39;SELECT COUNT(*) AS n FROM capability_package WHERE source_id = ?&#39;).get(SOURCE_ID).n; |
| started | const | 366 | no | const started = performance.now(); |
| result | const | 367 | no | const result = exportCapabilitySqlite(db, { path: target, sourceId: SOURCE_ID }); |
| elapsed | const | 368 | no | const elapsed = performance.now() - started; |
| exported | const | 373 | no | const exported = new DatabaseSync(target); |
| key | const | 377 | no | const key = table === &#39;capability_source&#39; ? &#39;id&#39; : &#39;source_id&#39;; |
| expected | const | 378 | no | const expected = db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${key} = ?`).get(SOURCE_ID).n; |
| missing | const | 391 | no | const missing = join(root, &#39;does-not-exist&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| node:sqlite | import | 7 | external |
| ../lib/schema.mjs | import | 8 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| glob | require | 108 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/capabilities.test.mjs — capability registry: scan, persist, search, map, contracts, export.
import { afterAll, test } from 'bun:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openMemoryDb } from '../lib/schema.mjs';
import {
  CAPABILITY_REGISTRY_SCHEMA,
  capabilityStatus,
  exportCapabilityJson,
  exportCapabilitySqlite,
  listCapabilityContracts,
  loadContracts,
  loadTaxonomy,
  persistCapabilityScan,
  scanCapabilitySource,
  searchCapabilityDocuments,
} from '../lib/capabilities.mjs';

const AT_EARLY = '2026-01-01T00:00:00.000Z';
const AT_LATE = '2026-06-01T00:00:00.000Z';
const SOURCE_ID = 'fixture-source';

// Temp fixture directories that are still on disk.
const TEMP_DIRS = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Remove a temp fixture directory deterministically.
 *
 * `rmSync({ maxRetries, retryDelay })` does not work under Bun for the EBUSY case:
 * Bun releases a SQLite file handle in the finalizer rather than inside `close()`, so
 * the directory is still locked when the synchronous retry budget runs out and the
 * fixture leaks on every run. Force the collection, then retry across rounds that
 * yield to the event loop so the pending finalizer can actually run before the next
 * attempt. A leftover temp directory must never fail the suite, and a locked fixture
 * must never leak silently.
 *
 * @param {string} dir absolute path of the directory to remove
 * @returns {Promise<boolean>} true when the directory is gone
 */
async function removeTempDir(dir) {
  TEMP_DIRS.add(dir);
  for (let round = 0; round < 60; round += 1) {
    if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') Bun.gc(true);
    try {
      rmSync(dir, { recursive: true, force: true });
      // rmSync can report success while the directory is still locked, so verify.
      if (!existsSync(dir)) {
        TEMP_DIRS.delete(dir);
        return true;
      }
    } catch { /* the handle is still held; try again on the next round */ }
    await sleep(25);
  }
  return false;
}

// A last sweep for anything a test left behind: the per-fixture cleanup owns the
// normal path, this one turns a remaining directory into a visible failure instead of
// a silent leak.
afterAll(async () => {
  const leftovers = [];
  for (const dir of [...TEMP_DIRS]) {
    if (!await removeTempDir(dir)) leftovers.push(dir);
  }
  if (leftovers.length) {
    throw new Error(`temp fixture cleanup failed for: ${leftovers.join(', ')}`);
  }
});

// A minimal npm v3 tree: one package with a nested dependency, a README, source,
// a secret file that must never be indexed, and a manifest field this schema does
// not know about (it must survive verbatim in `manifest`).
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'hq-capability-'));
  TEMP_DIRS.add(root);
```

_First 80 of 394 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
