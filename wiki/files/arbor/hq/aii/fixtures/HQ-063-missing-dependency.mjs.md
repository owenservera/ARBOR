# File: hq/aii/fixtures/HQ-063-missing-dependency.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-063-missing-dependency.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5520 B |
| Lines | 115 |
| Hash | 1092168b7593 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 22 | no | const AT = &#39;2026-11-11T00:00:00.000Z&#39;; |
| seedIndex | function | 26 | no | function seedIndex(db) { |
| addProject | function | 27 | no | const addProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| addFile | function | 30 | no | const addFile = (pid, path, isTest = 0) =&gt; Number( db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at) VALUES (?, ?, ?, &#39;javascrip… |
| addImport | function | 36 | no | const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) =&gt; { |
| addSymbol | function | 42 | no | const addSymbol = (fid, pid, name) =&gt; { |
| alpha | const | 49 | no | const alpha = addProject(&#39;alpha&#39;, &#39;C:/ws/alpha&#39;); |
| beta | const | 50 | no | const beta = addProject(&#39;beta&#39;, &#39;C:/ws/beta&#39;); |
| aCore | const | 52 | no | const aCore = addFile(alpha, &#39;src/core.mjs&#39;); |
| aUtil | const | 53 | no | const aUtil = addFile(alpha, &#39;src/util.mjs&#39;); |
| bMain | const | 57 | no | const bMain = addFile(beta, &#39;src/main.mjs&#39;); |
| bSide | const | 58 | no | const bSide = addFile(beta, &#39;src/side.mjs&#39;); |
| db | const | 81 | no | const db = openMemoryDb(); |
| result | const | 84 | no | const result = unresolvedImports(db, { target: &#39;src/main.mjs&#39;, project: &#39;beta&#39; }); |
| findings | const | 85 | no | const findings = []; |
| names | const | 92 | no | const names = result.imports.map((i) =&gt; i.specifier); |

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
// hq/aii/fixtures/HQ-063-missing-dependency.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-063 (group G): "Which missing dependency prevents this feature from activating?"
// Engine: hq/lib/graph.mjs unresolvedImports — imports of a target file that did
// not resolve to any indexed file (imports.resolved_file_id IS NULL).
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic data only, no credentials, no private session
// content):
//   project beta, file src/main.mjs imports:
//     'alpha/src/core.mjs'  -> resolved to alpha's src/core.mjs (file id)
//     'some-missing-pkg'    -> resolved_file_id NULL, resolved_project_id NULL
//   Pinned live output for unresolvedImports(db, {target:'src/main.mjs', project:'beta'}):
//     root  = { path: 'src/main.mjs', project: 'beta' }
//     imports = [ { specifier: 'some-missing-pkg', line: 1, file: 'src/main.mjs' } ]
//   The resolved import is NOT reported: only the unresolved specifier is, which
//   is exactly the missing dependency that prevents the feature activating.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { unresolvedImports } from '../../lib/graph.mjs';

const AT = '2026-11-11T00:00:00.000Z';

// seedIndex — build the two-project synthetic index the ground truth was
// locked against.
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

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  const aUtil = addFile(alpha, 'src/util.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');

  const bMain = addFile(beta, 'src/main.mjs');
  const bSide = addFile(beta, 'src/side.mjs');
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  // beta -> alpha, resolved to a real file.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  // beta -> a bare package that resolves to nothing: the missing dependency.
  addImport(bMain, beta, 'some-missing-pkg');
  // alpha internal edge.
  addImport(aCore, alpha, './util.mjs', aUtil);
}

export default defineFixture({
  id: 'HQ-063',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs unresolvedImports against a seeded in-memory index (synthetic two-project workspace, read-only probe, no credentials). Pinned live output: root {path: "src/main.mjs", project: "beta"}; exactly one unresolved import, specifier "some-missing-pkg" at line 1 of src/main.mjs; the resolved import "alpha/src/core.mjs" is not reported. run() re-derives the same findings live.',
  expected: [
    { what: 'feature entrypoint resolved: src/main.mjs in project beta', where: 'hq/lib/graph.mjs unresolvedImports' },
    { what: '1 missing dependency blocks activation: some-missing-pkg', where: 'src/main.mjs' },
    { what: 'missing dependency some-missing-pkg is unresolved (no indexed file, no project) at src/main.mjs:1', where: 'src/main.mjs' },
    { what: 'resolved import alpha/src/core.mjs is not reported as missing', where: 'src/main.mjs' },
  ],
  run: async () => {
```

_First 80 of 116 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
