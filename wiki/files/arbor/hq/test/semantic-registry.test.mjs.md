# File: hq/test/semantic-registry.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/semantic-registry.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15793 B |
| Lines | 322 |
| Hash | c27009baebbb |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| db | function | 27 | no | const db = () =&gt; openMemoryDb(); |
| TEMP_DIRS | const | 30 | no | const TEMP_DIRS = new Set(); |
| sleep | function | 32 | no | const sleep = (ms) =&gt; new Promise((resolve) =&gt; setTimeout(resolve, ms)); |
| cleanup | function | 48 | no | async function cleanup(path) { |
| leftovers | const | 69 | no | const leftovers = []; |
| fixture | function | 78 | no | function fixture(t) { |
| root | const | 79 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-semantic-registry-&#39;)); |
| d | const | 93 | no | const d = db(); |
| res | const | 94 | no | const res = registerSemanticId(d, { id: &#39;widget@1&#39;, kind: &#39;type&#39;, label: &#39;Widget&#39;, description: &#39;A widget.&#39; }); |
| row | const | 96 | no | const row = getSemanticId(d, &#39;widget@1&#39;); |
| d | const | 106 | no | const d = db(); |
| d | const | 116 | no | const d = db(); |
| dup | const | 118 | no | const dup = registerSemanticId(d, { id: &#39;widget@1&#39;, kind: &#39;type&#39;, label: &#39;Other widget&#39; }); |
| d | const | 127 | no | const d = db(); |
| again | const | 129 | no | const again = registerSemanticId(d, { id: &#39;widget@1&#39;, kind: &#39;type&#39;, label: &#39;Widget&#39; }); |
| d | const | 137 | no | const d = db(); |
| res | const | 138 | no | const res = registerSemanticId(d, { id: &#39;widget@1&#39;, kind: &#39;type&#39;, status: &#39;current&#39; }); |
| d | const | 146 | no | const d = db(); |
| refused | const | 148 | no | const refused = promoteSemanticId(d, &#39;widget@1&#39;, { ownerConfirmed: false }); |
| promoted | const | 154 | no | const promoted = promoteSemanticId(d, &#39;widget@1&#39;, { ownerConfirmed: true }); |
| d | const | 162 | no | const d = db(); |
| res | const | 166 | no | const res = promoteSemanticId(d, &#39;widget@1&#39;, { ownerConfirmed: true }); |
| d | const | 173 | no | const d = db(); |
| res | const | 177 | no | const res = deprecateSemanticId(d, &#39;widget@1&#39;, { ownerConfirmed: true }); |
| row | const | 180 | no | const row = getSemanticId(d, &#39;widget@1&#39;); |
| d | const | 190 | no | const d = db(); |
| unknown | const | 192 | no | const unknown = registerSemanticAlias(d, { alias: &#39;widget&#39;, targetId: &#39;missing@1&#39; }); |
| d | const | 202 | no | const d = db(); |
| exact | const | 208 | no | const exact = resolveSemanticAlias(d, &#39; WIDGET &#39;); |
| collided | const | 213 | no | const collided = registerSemanticAlias(d, { alias: &#39;widget&#39;, targetId: &#39;gadget@1&#39; }); |
| ambiguous | const | 215 | no | const ambiguous = resolveSemanticAlias(d, &#39;widget&#39;); |
| d | const | 227 | no | const d = db(); |
| unknown | const | 229 | no | const unknown = linkSemanticSource(d, { semanticId: &#39;missing@1&#39;, path: &#39;src/a.mjs&#39; }); |
| res | const | 234 | no | const res = linkSemanticSource(d, { semanticId: &#39;widget@1&#39;, path }); |
| ok | const | 238 | no | const ok = linkSemanticSource(d, { semanticId: &#39;widget@1&#39;, path: &#39;src/widget.mjs&#39;, line: 12 }); |
| f | const | 245 | no | const f = fixture(t); |
| d | const | 246 | no | const d = db(); |
| stable | const | 248 | no | const stable = f.write(&#39;stable.mjs&#39;, &#39;export const widget = 1;\\n&#39;); |
| moving | const | 249 | no | const moving = f.write(&#39;moving.mjs&#39;, &#39;export const widget = 2;\\n&#39;); |
| doomed | const | 250 | no | const doomed = f.write(&#39;doomed.mjs&#39;, &#39;export const widget = 3;\\n&#39;); |
| report | const | 259 | no | const report = detectSemanticDrift(d, { root: f.root }); |
| byId | const | 261 | no | const byId = new Map(report.map((row) =&gt; [row.id, row])); |
| d | const | 273 | no | const d = db(); |
| d | const | 285 | no | const d = db(); |
| res | const | 287 | no | const res = registerSemanticId(d, bad); |
| drift | const | 305 | no | const drift = detectSemanticDrift(null, null); |
| f | const | 311 | no | const f = fixture(t); |
| path | const | 312 | no | const path = join(f.root, &#39;index.db&#39;); |
| tables | const | 313 | no | const tables = [&#39;semantic_alias&#39;, &#39;semantic_id&#39;, &#39;semantic_link&#39;, &#39;wiki_program_version&#39;]; |
| first | const | 314 | no | const first = openDb(path); |
| names | const | 315 | no | const names = first.prepare(&quot;SELECT name FROM sqlite_master WHERE type = &#39;table&#39;&quot;).all().map((row) =&gt; row.name); |
| second | const | 318 | no | const second = openDb(path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 13 | external |
| node:assert/strict | import | 14 | external |
| node:fs | import | 15 | external |
| node:os | import | 16 | external |
| node:path | import | 17 | external |
| ../lib/schema.mjs | import | 18 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/util.mjs | import | 19 | [hq/lib/util.mjs](../lib/util.mjs.md) |
| ../lib/semantic-registry.mjs | import | 20 | [hq/lib/semantic-registry.mjs](../lib/semantic-registry.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Conformance tests for the versioned semantic registry: stable IDs, |
| 4 | owner | hq | — | hq |
| 5 | task | — | — | semantic-registry-v1 |
| 6 | invariant | — | — | A real temp directory is used for drift fixtures; the active |
| 8 | invariant | — | — | Temp fixtures are removed deterministically under Bun: the SQLite |
| 11 | see | — | hq/lib/semantic-registry.mjs | hq/lib/semantic-registry.mjs |

## Excerpt

```javascript
/**
 * @hq:context Conformance tests for the versioned semantic registry: stable IDs,
 *   owner-confirmed promotion, alias referential integrity and source drift.
 * @hq:owner hq
 * @hq:task semantic-registry-v1
 * @hq:invariant A real temp directory is used for drift fixtures; the active
 *   `.hq/index.db` is never touched. The database is in-memory.
 * @hq:invariant Temp fixtures are removed deterministically under Bun: the SQLite
 *   handle is released by the GC finalizer, so cleanup forces `Bun.gc(true)` and
 *   yields to the event loop between retries.
 * @hq:see hq/lib/semantic-registry.mjs
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, openMemoryDb } from '../lib/schema.mjs';
import { sha256File } from '../lib/util.mjs';
import {
  SEMANTIC_KINDS, SEMANTIC_REGISTRY_SCHEMA, SEMANTIC_STATUS,
  deprecateSemanticId, detectSemanticDrift, getSemanticId, linkSemanticSource,
  listSemanticAliases, listSemanticIds, listSemanticLinks, promoteSemanticId,
  registerSemanticAlias, registerSemanticId, resolveSemanticAlias,
} from '../lib/semantic-registry.mjs';

const db = () => openMemoryDb();

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
 * @param {string} path absolute path of the directory to remove
 * @returns {Promise<boolean>} true when the directory is gone
 */
async function cleanup(path) {
  TEMP_DIRS.add(path);
  for (let round = 0; round < 60; round += 1) {
    if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') Bun.gc(true);
    try {
      rmSync(path, { recursive: true, force: true });
      // rmSync can report success while the directory is still locked, so verify.
      if (!existsSync(path)) {
        TEMP_DIRS.delete(path);
        return true;
      }
    } catch { /* the handle is still held; try again on the next round */ }
    await sleep(25);
  }
  return false;
}

// A last sweep for anything a test left behind: the per-fixture hook owns the normal
// path, this one turns a remaining directory into a visible failure instead of a
// silent leak.
after(async () => {
  const leftovers = [];
  for (const path of [...TEMP_DIRS]) {
    if (!await cleanup(path)) leftovers.push(path);
  }
  if (leftovers.length) {
    throw new Error(`temp fixture cleanup failed for: ${leftovers.join(', ')}`);
  }
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'hq-semantic-registry-'));
  TEMP_DIRS.add(root);
```

_First 80 of 323 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
