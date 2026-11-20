# File: hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5600 B |
| Lines | 111 |
| Hash | 7eafdd017bcc |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 27 | no | const AT = &#39;2026-11-11T00:00:00.000Z&#39;; |
| seedIndex | function | 29 | no | function seedIndex(db) { |
| addProject | function | 30 | no | const addProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| addFile | function | 33 | no | const addFile = (pid, path) =&gt; Number( db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at) VALUES (?, ?, ?, &#39;javascript&#39;, &#39;source&#39;… |
| addImport | function | 39 | no | const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) =&gt; { |
| addSymbol | function | 45 | no | const addSymbol = (fid, pid, name) =&gt; { |
| alpha | const | 52 | no | const alpha = addProject(&#39;alpha&#39;, &#39;C:/ws/alpha&#39;); |
| beta | const | 53 | no | const beta = addProject(&#39;beta&#39;, &#39;C:/ws/beta&#39;); |
| aCore | const | 55 | no | const aCore = addFile(alpha, &#39;src/core.mjs&#39;); |
| aUtil | const | 56 | no | const aUtil = addFile(alpha, &#39;src/util.mjs&#39;); |
| bMain | const | 60 | no | const bMain = addFile(beta, &#39;src/main.mjs&#39;); |
| bSide | const | 61 | no | const bSide = addFile(beta, &#39;src/side.mjs&#39;); |
| db | const | 81 | no | const db = openMemoryDb(); |
| findings | const | 84 | no | const findings = []; |
| result | const | 86 | no | const result = dependencyAffectedSystems(db, { package: &#39;alpha&#39; }); |
| control | const | 100 | no | const control = dependencyAffectedSystems(db, { package: &#39;no-such-dependency&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 23 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 24 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 25 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-075 (group I): "Which systems are affected
// by upgrading this dependency?"
// Engine: hq/lib/graph.mjs dependencyAffectedSystems — the projects that
// transitively import files owned by the project that provides the dependency.
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   project alpha (the provider being upgraded): src/core.mjs, src/util.mjs
//   project beta  (the consumer system):
//     src/main.mjs imports 'alpha/src/core.mjs'  -> alpha's src/core.mjs
//     src/side.mjs imports 'alpha/src/util.mjs'  -> alpha's src/util.mjs
//
// Pinned live output for dependencyAffectedSystems(db, { package: 'alpha' }):
//   { package:'alpha', provider:'alpha', affected:['beta'] }
//
// beta is affected because it imports alpha's code directly; alpha itself is
// the provider, not an affected system. The control query for a package with
// no provider project returns provider:null and an empty affected set.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { dependencyAffectedSystems } from '../../lib/graph.mjs';

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
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');

  const bMain = addFile(beta, 'src/main.mjs');
  const bSide = addFile(beta, 'src/side.mjs');
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  // beta consumes alpha across the project boundary.
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  addImport(aCore, alpha, './util.mjs', aUtil);
}

export default defineFixture({
  id: 'HQ-075',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/graph.mjs dependencyAffectedSystems against a seeded in-memory index (synthetic two-project workspace: provider alpha with src/core.mjs + src/util.mjs; consumer beta whose src/main.mjs and src/side.mjs import alpha files; read-only probe, no credentials). Pinned live output: { package: "alpha", provider: "alpha", affected: ["beta"] } — beta is the affected system, alpha is the provider and is not listed; the control query for a package with no provider project returns provider:null and affected:[]. run() re-derives the same findings live.',
  expected: [
    { what: 'dependency alpha is provided by project alpha', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
    { what: '1 system is affected by upgrading alpha: beta', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
    { what: 'the provider alpha is not itself an affected system', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
    { what: 'control: a dependency with no provider project affects 0 systems', where: 'hq/lib/graph.mjs dependencyAffectedSystems' },
  ],
  run: async () => {
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
