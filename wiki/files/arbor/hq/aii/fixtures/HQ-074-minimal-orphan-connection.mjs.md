# File: hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6461 B |
| Lines | 123 |
| Hash | 0920391f5736 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 31 | no | const AT = &#39;2026-11-11T00:00:00.000Z&#39;; |
| seedIndex | function | 33 | no | function seedIndex(db) { |
| addProject | function | 34 | no | const addProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| addFile | function | 37 | no | const addFile = (pid, path) =&gt; Number( db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at) VALUES (?, ?, ?, &#39;javascript&#39;, &#39;source&#39;… |
| addImport | function | 43 | no | const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) =&gt; { |
| addSymbol | function | 49 | no | const addSymbol = (fid, pid, name) =&gt; { |
| alpha | const | 56 | no | const alpha = addProject(&#39;alpha&#39;, &#39;C:/ws/alpha&#39;); |
| beta | const | 57 | no | const beta = addProject(&#39;beta&#39;, &#39;C:/ws/beta&#39;); |
| aCore | const | 59 | no | const aCore = addFile(alpha, &#39;src/core.mjs&#39;); |
| aUtil | const | 60 | no | const aUtil = addFile(alpha, &#39;src/util.mjs&#39;); |
| aOrphan | const | 61 | no | const aOrphan = addFile(alpha, &#39;src/orphan.mjs&#39;); |
| bMain | const | 66 | no | const bMain = addFile(beta, &#39;src/main.mjs&#39;); |
| db | const | 86 | no | const db = openMemoryDb(); |
| findings | const | 89 | no | const findings = []; |
| orphanRows | const | 91 | no | const orphanRows = orphans(db, {}); |
| orphan | const | 92 | no | const orphan = orphanRows.find((o) =&gt; o.path === &#39;src/orphan.mjs&#39;); |
| plan | const | 98 | no | const plan = minimalConnection(db, { orphan: &#39;src/orphan.mjs&#39;, consumer: &#39;src/main.mjs&#39; }); |
| control | const | 112 | no | const control = minimalConnection(db, { orphan: &#39;src/core.mjs&#39;, consumer: &#39;src/main.mjs&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 27 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 28 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 29 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-074 (group I): "What is the smallest safe
// change that would connect this orphaned capability?"
// Engine: hq/lib/graph.mjs minimalConnection + orphans.
//
// Ground truth locked 2026-11-11 by running the live modules against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   alpha/src/orphan.mjs  exports orphanCapability, imported by NOTHING
//   alpha/src/core.mjs    exports coreService, imported by beta/src/main.mjs
//   beta/src/main.mjs     exports mainEntry
//
// Pinned live output:
//   orphans(db, {}) -> orphanCapability at src/orphan.mjs:1 (project alpha)
//   minimalConnection(db, {orphan:'src/orphan.mjs', consumer:'src/main.mjs'})
//     -> { orphan:'src/orphan.mjs', consumer:'src/main.mjs', connected:false,
//          edges:[{from:'src/main.mjs', to:'src/orphan.mjs'}] }
//   minimalConnection(db, {orphan:'src/core.mjs', consumer:'src/main.mjs'})
//     -> { connected:true, edges:[] }   (already reachable: zero edits)
//
// The edit set is minimal by construction: the orphan is NOT already reachable
// from the consumer, so 0 edges cannot suffice, and a single consumer->orphan
// import edge does suffice. The already-connected control proves the analysis
// reports 0 edits when no change is needed.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { minimalConnection, orphans } from '../../lib/graph.mjs';

const AT = '2026-11-11T00:00:00.000Z';

function seedIndex(db) {
  const addProject = (name, path) => Number(
    db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)').run(name, path, AT).lastInsertRowid,
  );
  const addFile = (pid, path) => Number(
    db.prepare(`
      INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at)
      VALUES (?, ?, ?, 'javascript', 'source', 10, 0, NULL, 3, 0, ?)
    `).run(pid, path, `C:/ws/${path}`, AT).lastInsertRowid,
  );
  const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) => {
    db.prepare(`
      INSERT INTO imports(file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line)
      VALUES (?, ?, ?, 'import', ?, ?, ?)
    `).run(fid, pid, specifier, resolvedFileId, resolvedProjectId, line);
  };
  const addSymbol = (fid, pid, name) => {
    db.prepare(`
      INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, exported)
      VALUES (?, ?, ?, 'function', 1, 1, 1)
    `).run(fid, pid, name);
  };

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  const aUtil = addFile(alpha, 'src/util.mjs');
  const aOrphan = addFile(alpha, 'src/orphan.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');
  addSymbol(aOrphan, alpha, 'orphanCapability');

  const bMain = addFile(beta, 'src/main.mjs');
  addSymbol(bMain, beta, 'mainEntry');

  // beta already consumes alpha's core — the already-connected control.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(aCore, alpha, './util.mjs', aUtil);
  // Nothing imports src/orphan.mjs: it is the orphaned capability.
}

export default defineFixture({
  id: 'HQ-074',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs minimalConnection and orphans against a seeded in-memory index (synthetic two-project workspace; alpha/src/orphan.mjs exports orphanCapability and is imported by nothing; beta/src/main.mjs already imports alpha/src/core.mjs; read-only probe, no credentials). Pinned live output: orphan row orphanCapability@src/orphan.mjs:1 (alpha); minimalConnection(orphan=src/orphan.mjs, consumer=src/main.mjs) -> connected:false with exactly one edit edge src/main.mjs -> src/orphan.mjs; minimalConnection(orphan=src/core.mjs, consumer=src/main.mjs) -> connected:true with zero edges. run() re-derives the same findings live.',
  expected: [
    { what: 'orphaned capability detected: orphanCapability at src/orphan.mjs:1 in project alpha', where: 'hq/lib/graph.mjs orphans' },
    { what: 'src/orphan.mjs is not reachable from src/main.mjs', where: 'hq/lib/graph.mjs minimalConnection' },
```

_First 80 of 124 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
