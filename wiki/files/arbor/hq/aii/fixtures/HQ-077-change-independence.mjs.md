# File: hq/aii/fixtures/HQ-077-change-independence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-077-change-independence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6107 B |
| Lines | 119 |
| Hash | 72bdf80dee62 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 33 | no | const AT = &#39;2026-11-11T00:00:00.000Z&#39;; |
| seedIndex | function | 35 | no | function seedIndex(db) { |
| addProject | function | 36 | no | const addProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| addFile | function | 39 | no | const addFile = (pid, path) =&gt; Number( db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at) VALUES (?, ?, ?, &#39;javascript&#39;, &#39;source&#39;… |
| addImport | function | 45 | no | const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) =&gt; { |
| addSymbol | function | 51 | no | const addSymbol = (fid, pid, name) =&gt; { |
| alpha | const | 58 | no | const alpha = addProject(&#39;alpha&#39;, &#39;C:/ws/alpha&#39;); |
| beta | const | 59 | no | const beta = addProject(&#39;beta&#39;, &#39;C:/ws/beta&#39;); |
| aCore | const | 61 | no | const aCore = addFile(alpha, &#39;src/core.mjs&#39;); |
| aUtil | const | 62 | no | const aUtil = addFile(alpha, &#39;src/util.mjs&#39;); |
| aIsolated | const | 63 | no | const aIsolated = addFile(alpha, &#39;src/isolated.mjs&#39;); |
| bMain | const | 68 | no | const bMain = addFile(beta, &#39;src/main.mjs&#39;); |
| bSide | const | 69 | no | const bSide = addFile(beta, &#39;src/side.mjs&#39;); |
| db | const | 89 | no | const db = openMemoryDb(); |
| findings | const | 92 | no | const findings = []; |
| parallel | const | 94 | no | const parallel = changeIndependence(db, { edits: [&#39;src/isolated.mjs&#39;, &#39;src/side.mjs&#39;] }); |
| conflict | const | 100 | no | const conflict = changeIndependence(db, { edits: [&#39;src/util.mjs&#39;, &#39;src/main.mjs&#39;] }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 29 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 30 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 31 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-077-change-independence.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-077 (group I): "Which changes can be
// implemented independently in parallel?"
// Engine: hq/lib/graph.mjs changeIndependence — two proposed file edits
// CONFLICT when either file transitively reaches the other in either
// direction (the other imports it, or it imports the other); they are
// INDEPENDENT when neither reaches the other.
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   alpha/src/util.mjs     imported BY beta/src/side.mjs and beta/src/main.mjs
//   alpha/src/core.mjs     imported BY beta/src/main.mjs
//   alpha/src/isolated.mjs imported by NOTHING
//   beta/src/side.mjs      imports alpha/src/util.mjs
//   beta/src/main.mjs      imports alpha/src/core.mjs
//
// Pinned live output:
//   changeIndependence(db, {edits:['src/isolated.mjs','src/side.mjs']})
//     -> independent:[['src/isolated.mjs','src/side.mjs']], conflicting:[]
//   changeIndependence(db, {edits:['src/util.mjs','src/main.mjs']})
//     -> independent:[], conflicting:[['src/util.mjs','src/main.mjs']]
//
// The independent pair can be built in parallel: nothing in either file's
// import neighbourhood reaches the other. The conflicting pair cannot: main
// imports core which imports util, so editing util can change what main sees.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { changeIndependence } from '../../lib/graph.mjs';

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
  const aIsolated = addFile(alpha, 'src/isolated.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');
  addSymbol(aIsolated, alpha, 'isolatedThing');

  const bMain = addFile(beta, 'src/main.mjs');
  const bSide = addFile(beta, 'src/side.mjs');
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  addImport(aCore, alpha, './util.mjs', aUtil);
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  // src/isolated.mjs is imported by nobody.
}

export default defineFixture({
  id: 'HQ-077',
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
