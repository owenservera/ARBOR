# File: hq/aii/fixtures/HQ-076-migration-risks.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-076-migration-risks.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6358 B |
| Lines | 127 |
| Hash | 4b45811caea5 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 36 | no | const AT = &#39;2026-11-11T00:00:00.000Z&#39;; |
| seedIndex | function | 38 | no | function seedIndex(db) { |
| addProject | function | 39 | no | const addProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| addFile | function | 42 | no | const addFile = (pid, path, isTest = 0) =&gt; Number( db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at) VALUES (?, ?, ?, &#39;javascrip… |
| addImport | function | 48 | no | const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) =&gt; { |
| addSymbol | function | 54 | no | const addSymbol = (fid, pid, name) =&gt; { |
| addAnnotation | function | 60 | no | const addAnnotation = (fid, pid, kind, text, line = 1) =&gt; { |
| alpha | const | 66 | no | const alpha = addProject(&#39;alpha&#39;, &#39;C:/ws/alpha&#39;); |
| beta | const | 67 | no | const beta = addProject(&#39;beta&#39;, &#39;C:/ws/beta&#39;); |
| aCore | const | 69 | no | const aCore = addFile(alpha, &#39;src/core.mjs&#39;); |
| bMain | const | 72 | no | const bMain = addFile(beta, &#39;src/main.mjs&#39;); |
| bTest | const | 73 | no | const bTest = addFile(beta, &#39;test/main.test.mjs&#39;, 1); |
| db | const | 92 | no | const db = openMemoryDb(); |
| findings | const | 95 | no | const findings = []; |
| result | const | 97 | no | const result = migrationRisks(db, { implementation: &#39;src/main.mjs&#39;, project: &#39;beta&#39; }); |
| control | const | 116 | no | const control = migrationRisks(db, { implementation: &#39;src/core.mjs&#39;, project: &#39;alpha&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 32 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 33 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 34 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-076-migration-risks.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-076 (group I): "What are the hidden
// migration risks of replacing this implementation?"
// Engine: hq/lib/graph.mjs migrationRisks — couplings around an implementation
// file that a static import graph does not show: annotation-driven wiring and
// test files that import the implementation (the mock surface).
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   beta/src/main.mjs          the implementation, carries the annotation
//                              'why: the index database is sqlite'
//   beta/test/main.test.mjs    a TEST file that imports the implementation
//                              via '../src/main.mjs'
//   alpha/src/core.mjs         imports NOTHING from beta/src/main.mjs — a
//                              control showing a file with no hidden coupling
//
// Pinned live output for migrationRisks(db, {implementation:'src/main.mjs', project:'beta'}):
//   risks = [
//     { kind:'annotation',   detail:'why: the index database is sqlite',
//       file:'src/main.mjs', line:1 },
//     { kind:'test_import',  detail:'test imports implementation via ../src/main.mjs',
//       file:'test/main.test.mjs' }
//   ]
//
// Both risk kinds are invisible to a plain import-graph traversal of the
// implementation's DEPENDENCIES: the annotation is documentation, and the test
// edge is a consumer rather than a dependency. The control file
// alpha/src/core.mjs has no risks at all.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { migrationRisks } from '../../lib/graph.mjs';

const AT = '2026-11-11T00:00:00.000Z';

function seedIndex(db) {
  const addProject = (name, path) => Number(
    db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)').run(name, path, AT).lastInsertRowid,
  );
  const addFile = (pid, path, isTest = 0) => Number(
    db.prepare(`
      INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at)
      VALUES (?, ?, ?, 'javascript', 'source', 10, 0, NULL, 3, ?, ?)
    `).run(pid, path, `C:/ws/${path}`, isTest, AT).lastInsertRowid,
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
  const addAnnotation = (fid, pid, kind, text, line = 1) => {
    db.prepare(`
      INSERT INTO annotations(file_id, project_id, line, kind, text) VALUES (?, ?, ?, ?, ?)
    `).run(fid, pid, line, kind, text);
  };

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  addSymbol(aCore, alpha, 'coreService');

  const bMain = addFile(beta, 'src/main.mjs');
  const bTest = addFile(beta, 'test/main.test.mjs', 1);
  addSymbol(bMain, beta, 'mainEntry');

  // The implementation carries an annotation: annotation-driven wiring.
  addAnnotation(bMain, beta, 'why', 'the index database is sqlite', 1);
  // The test file imports the implementation: the mock surface.
  addImport(bTest, beta, '../src/main.mjs', bMain);
}
```

_First 80 of 128 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
