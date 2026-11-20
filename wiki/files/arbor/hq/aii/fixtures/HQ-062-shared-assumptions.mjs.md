# File: hq/aii/fixtures/HQ-062-shared-assumptions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-062-shared-assumptions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5712 B |
| Lines | 111 |
| Hash | da89587023c7 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 22 | no | const AT = &#39;2026-11-11T00:00:00.000Z&#39;; |
| seedIndex | function | 24 | no | function seedIndex(db) { |
| addProject | function | 25 | no | const addProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| addFile | function | 28 | no | const addFile = (pid, path) =&gt; Number( db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at) VALUES (?, ?, ?, &#39;javascript&#39;, &#39;source&#39;… |
| addImport | function | 34 | no | const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) =&gt; { |
| addSymbol | function | 40 | no | const addSymbol = (fid, pid, name) =&gt; { |
| addAnnotation | function | 46 | no | const addAnnotation = (fid, pid, kind, text, line = 1) =&gt; { |
| alpha | const | 52 | no | const alpha = addProject(&#39;alpha&#39;, &#39;C:/ws/alpha&#39;); |
| beta | const | 53 | no | const beta = addProject(&#39;beta&#39;, &#39;C:/ws/beta&#39;); |
| aCore | const | 55 | no | const aCore = addFile(alpha, &#39;src/core.mjs&#39;); |
| aUtil | const | 56 | no | const aUtil = addFile(alpha, &#39;src/util.mjs&#39;); |
| bMain | const | 60 | no | const bMain = addFile(beta, &#39;src/main.mjs&#39;); |
| db | const | 84 | no | const db = openMemoryDb(); |
| result | const | 87 | no | const result = sharedAssumptions(db, { componentA: &#39;src/core.mjs&#39;, componentB: &#39;src/main.mjs&#39; }); |
| findings | const | 88 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 18 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 19 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 20 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-062-shared-assumptions.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-062 (group G): "Which assumptions are shared by the components involved in this failure?"
// Engine: hq/lib/graph.mjs sharedAssumptions — the assumption strings that two
// components document in common (annotation text present on BOTH files).
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic data only, no credentials, no private session
// content). Two components that fail together:
//   alpha src/core.mjs  annotations: 'why: the index database is sqlite'
//                              'context: alpha only note'
//   beta  src/main.mjs  annotations: 'why: the index database is sqlite'
// Pinned live output for sharedAssumptions(db, {componentA:'src/core.mjs', componentB:'src/main.mjs'}):
//   componentA = 'src/core.mjs', componentB = 'src/main.mjs'
//   shared = [ 'the index database is sqlite' ]
// The 'alpha only note' annotation is on one file only, so it is NOT shared —
// a shared-assumption report that listed it would be a false positive.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { sharedAssumptions } from '../../lib/graph.mjs';

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
  const addAnnotation = (fid, pid, kind, text, line = 1) => {
    db.prepare(`
      INSERT INTO annotations(file_id, project_id, line, kind, text) VALUES (?, ?, ?, ?, ?)
    `).run(fid, pid, line, kind, text);
  };

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  const aUtil = addFile(alpha, 'src/util.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');

  const bMain = addFile(beta, 'src/main.mjs');
  addSymbol(bMain, beta, 'mainEntry');

  // The two components fail together: beta imports alpha's core.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(aCore, alpha, './util.mjs', aUtil);

  // The assumption BOTH components share.
  addAnnotation(aCore, alpha, 'why', 'the index database is sqlite', 1);
  addAnnotation(bMain, beta, 'why', 'the index database is sqlite', 1);
  // A note only alpha carries — not a shared assumption.
  addAnnotation(aCore, alpha, 'context', 'alpha only note', 2);
}

export default defineFixture({
  id: 'HQ-062',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs sharedAssumptions against a seeded in-memory index (synthetic two-project workspace where beta/src/main.mjs imports alpha/src/core.mjs, read-only probe, no credentials). Pinned live output: componentA "src/core.mjs", componentB "src/main.mjs", shared = ["the index database is sqlite"] — exactly one shared assumption; the alpha-only annotation "alpha only note" is correctly excluded. run() re-derives the same findings live.',
  expected: [
    { what: 'shared assumptions between src/core.mjs and src/main.mjs: 1', where: 'hq/lib/graph.mjs sharedAssumptions' },
    { what: 'shared assumption: the index database is sqlite', where: 'hq/lib/graph.mjs sharedAssumptions' },
    { what: 'one-sided note alpha only note is not a shared assumption', where: 'hq/lib/graph.mjs sharedAssumptions' },
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
