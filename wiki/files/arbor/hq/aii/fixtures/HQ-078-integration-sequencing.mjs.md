# File: hq/aii/fixtures/HQ-078-integration-sequencing.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-078-integration-sequencing.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6452 B |
| Lines | 125 |
| Hash | 3a95c456ab1e |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 35 | no | const AT = &#39;2026-11-11T00:00:00.000Z&#39;; |
| seedIndex | function | 37 | no | function seedIndex(db) { |
| addProject | function | 38 | no | const addProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| addFile | function | 41 | no | const addFile = (pid, path, isTest = 0) =&gt; Number( db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, indexed_at) VALUES (?, ?, ?, &#39;javascrip… |
| addImport | function | 47 | no | const addImport = (fid, pid, specifier, resolvedFileId = null, resolvedProjectId = null, line = 1) =&gt; { |
| addSymbol | function | 53 | no | const addSymbol = (fid, pid, name) =&gt; { |
| alpha | const | 60 | no | const alpha = addProject(&#39;alpha&#39;, &#39;C:/ws/alpha&#39;); |
| beta | const | 61 | no | const beta = addProject(&#39;beta&#39;, &#39;C:/ws/beta&#39;); |
| aCore | const | 63 | no | const aCore = addFile(alpha, &#39;src/core.mjs&#39;); |
| aUtil | const | 64 | no | const aUtil = addFile(alpha, &#39;src/util.mjs&#39;); |
| aOrphan | const | 65 | no | const aOrphan = addFile(alpha, &#39;src/orphan.mjs&#39;); |
| bMain | const | 70 | no | const bMain = addFile(beta, &#39;src/main.mjs&#39;); |
| bSide | const | 71 | no | const bSide = addFile(beta, &#39;src/side.mjs&#39;); |
| bTest | const | 72 | no | const bTest = addFile(beta, &#39;test/main.test.mjs&#39;, 1); |
| db | const | 93 | no | const db = openMemoryDb(); |
| findings | const | 96 | no | const findings = []; |
| result | const | 98 | no | const result = integrationRanking(db, { candidates: [&#39;src/util.mjs&#39;, &#39;src/core.mjs&#39;, &#39;src/main.mjs&#39;, &#39;src/orphan.mjs&#39;], }); |
| first | const | 101 | no | const first = result.ranked[0]; |
| last | const | 114 | no | const last = result.ranked[result.ranked.length - 1]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 31 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 32 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 33 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-078-integration-sequencing.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-078 (group I): "Which integration should
// happen first to unblock the most downstream work?"
// Engine: hq/lib/graph.mjs integrationRanking — candidate integration points
// ranked by DOWNSTREAM fan-out: how many files transitively IMPORT the
// candidate, i.e. how much downstream work the integration unblocks.
//
// Ground truth locked 2026-11-11 by running the live module against a seeded
// in-memory index (synthetic two-project workspace, read-only probe, no
// credentials, no private session content):
//
//   alpha/src/util.mjs     imported by alpha/src/core.mjs, beta/src/side.mjs,
//                          beta/src/main.mjs and beta/test/main.test.mjs
//   alpha/src/core.mjs     imported by beta/src/main.mjs and beta/test/main.test.mjs
//   beta/src/main.mjs      imported by beta/test/main.test.mjs
//   alpha/src/orphan.mjs   imported by nobody
//
// Pinned live output for integrationRanking(db, {candidates:['src/util.mjs',
// 'src/core.mjs','src/main.mjs','src/orphan.mjs']}):
//   ranked[0] src/util.mjs   downstreamFanOut 4
//             downstream [src/core.mjs, src/side.mjs, src/main.mjs, test/main.test.mjs]
//   ranked[1] src/core.mjs   downstreamFanOut 2
//             downstream [src/main.mjs, test/main.test.mjs]
//   ranked[2] src/main.mjs   downstreamFanOut 1
//             downstream [test/main.test.mjs]
//   ranked[3] src/orphan.mjs downstreamFanOut 0, downstream []
//
// Integrating src/util.mjs first unblocks the most downstream work (4 files);
// the orphan unblocks nothing and ranks last.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { integrationRanking } from '../../lib/graph.mjs';

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

  const alpha = addProject('alpha', 'C:/ws/alpha');
  const beta = addProject('beta', 'C:/ws/beta');

  const aCore = addFile(alpha, 'src/core.mjs');
  const aUtil = addFile(alpha, 'src/util.mjs');
  const aOrphan = addFile(alpha, 'src/orphan.mjs');
  addSymbol(aCore, alpha, 'coreService');
  addSymbol(aUtil, alpha, 'utilHelper');
  addSymbol(aOrphan, alpha, 'orphanCapability');

  const bMain = addFile(beta, 'src/main.mjs');
  const bSide = addFile(beta, 'src/side.mjs');
  const bTest = addFile(beta, 'test/main.test.mjs', 1);
  addSymbol(bMain, beta, 'mainEntry');
  addSymbol(bSide, beta, 'sideEntry');

  addImport(aCore, alpha, './util.mjs', aUtil);
  addImport(bMain, beta, 'alpha/src/core.mjs', aCore);
  addImport(bSide, beta, 'alpha/src/util.mjs', aUtil);
  addImport(bTest, beta, '../src/main.mjs', bMain);
  // alpha/src/orphan.mjs is imported by nobody.
```

_First 80 of 126 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
