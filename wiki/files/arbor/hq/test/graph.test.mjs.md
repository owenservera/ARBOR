# File: hq/test/graph.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/graph.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8951 B |
| Lines | 203 |
| Hash | 05e30e682414 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROJECTS | const | 7 | no | const PROJECTS = [ |
| FILES | const | 12 | no | const FILES = [ |
| IMPORTS | const | 25 | no | const IMPORTS = [ |
| SYMBOLS | const | 37 | no | const SYMBOLS = [ |
| seed | function | 45 | no | function seed() { |
| db | const | 46 | no | const db = openMemoryDb(); |
| insertProject | const | 47 | no | const insertProject = db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;); |
| insertFile | const | 50 | no | const insertFile = db.prepare(` INSERT INTO files(id, project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at) VALUES (?, (SELECT id FROM projects WHERE… |
| insertImport | const | 57 | no | const insertImport = db.prepare(` INSERT INTO imports(file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line) VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, &#39;impor… |
| project | const | 61 | no | const project = FILES.find((file) =&gt; file.id === fileId).project; |
| insertSymbol | const | 65 | no | const insertSymbol = db.prepare(` INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc) VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, &#39;function&#39;, 1,… |
| db | const | 74 | no | const db = seed(); |
| forward | const | 75 | no | const forward = deps(db, { target: &#39;src/index.mjs&#39;, project: &#39;alpha&#39;, depth: 2 }); |
| shallow | const | 88 | no | const shallow = deps(db, { target: &#39;src/index.mjs&#39;, project: &#39;alpha&#39;, depth: 1 }); |
| db | const | 94 | no | const db = seed(); |
| deep | const | 95 | no | const deep = deps(db, { target: &#39;src/index.mjs&#39;, project: &#39;alpha&#39;, depth: 10 }); |
| pair | const | 105 | no | const pair = deps(db, { target: &#39;src/cycle_a.mjs&#39;, project: &#39;alpha&#39;, depth: 25 }); |
| db | const | 114 | no | const db = seed(); |
| reverse | const | 115 | no | const reverse = deps(db, { target: &#39;src/index.mjs&#39;, project: &#39;alpha&#39;, depth: 1, reverse: true, }); |
| db | const | 129 | no | const db = seed(); |
| result | const | 130 | no | const result = impact(db, { target: &#39;src/util.mjs&#39;, project: &#39;alpha&#39;, depth: 1 }); |
| defaulted | const | 142 | no | const defaulted = impact(db, { target: &#39;src/index.mjs&#39;, project: &#39;alpha&#39; }); |
| db | const | 149 | no | const db = seed(); |
| suffix | const | 151 | no | const suffix = deps(db, { target: &#39;deep/one.mjs&#39;, depth: 0 }); |
| basename | const | 154 | no | const basename = deps(db, { target: &#39;legacy.mjs&#39;, depth: 0 }); |
| rooted | const | 157 | no | const rooted = deps(db, { target: &#39;./src/legacy.mjs&#39;, depth: 0 }); |
| db | const | 162 | no | const db = seed(); |
| ambiguous | const | 163 | no | const ambiguous = deps(db, { target: &#39;util.mjs&#39; }); |
| missing | const | 166 | no | const missing = deps(db, { target: &#39;nope/missing.mjs&#39; }); |
| disambiguated | const | 169 | no | const disambiguated = deps(db, { target: &#39;util.mjs&#39;, project: &#39;beta&#39;, depth: 0 }); |
| db | const | 174 | no | const db = seed(); |
| capped | const | 175 | no | const capped = deps(db, { target: &#39;src/index.mjs&#39;, project: &#39;alpha&#39;, depth: 10, limit: 2 }); |
| db | const | 184 | no | const db = seed(); |
| graph | const | 185 | no | const graph = projectGraph(db); |
| db | const | 194 | no | const db = seed(); |
| empty | const | 198 | no | const empty = openMemoryDb(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/schema.mjs | import | 4 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/graph.mjs | import | 5 | [hq/lib/graph.mjs](../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/graph.test.mjs — dependency traversal and project graph over a synthetic index.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openMemoryDb } from '../lib/schema.mjs';
import { deps, impact, projectGraph } from '../lib/graph.mjs';

const PROJECTS = [
  { name: 'alpha', path: 'C:/ws/alpha' },
  { name: 'beta', path: 'C:/ws/beta' },
];

const FILES = [
  { id: 1, project: 'alpha', path: 'src/index.mjs' },
  { id: 2, project: 'alpha', path: 'src/util.mjs' },
  { id: 3, project: 'alpha', path: 'src/legacy.mjs' },
  { id: 4, project: 'alpha', path: 'src/cycle_a.mjs' },
  { id: 5, project: 'alpha', path: 'src/cycle_b.mjs' },
  { id: 6, project: 'alpha', path: 'src/isolated.mjs' },
  { id: 7, project: 'alpha', path: 'src/deep/one.mjs' },
  { id: 8, project: 'beta', path: 'lib/util.mjs' },
  { id: 9, project: 'beta', path: 'src/entry.mjs' },
];

// [file_id, specifier, resolved_file_id, resolved_project_id]
const IMPORTS = [
  [1, './util.mjs', 2, 1],
  [2, './legacy.mjs', 3, 1],
  [3, './index.mjs', 1, 1],
  [4, './cycle_b.mjs', 5, 1],
  [5, './cycle_a.mjs', 4, 1],
  [9, './util.mjs', 8, 2],
  [9, 'alpha/src/util.mjs', 2, 1],
  [1, 'node:fs', null, null],
  [7, 'missing-package', null, null],
];

const SYMBOLS = [
  [1, 'alpha', 'main'],
  [1, 'alpha', 'run'],
  [2, 'alpha', 'util'],
  [3, 'alpha', 'legacy'],
  [8, 'beta', 'util'],
];

function seed() {
  const db = openMemoryDb();
  const insertProject = db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)');
  for (const project of PROJECTS) insertProject.run(project.name, project.path, '2026-01-01T00:00:00Z');

  const insertFile = db.prepare(`
INSERT INTO files(id, project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, ?, 'javascript', 'source', 100, 0, NULL, 5, 0, 0, '2026-01-01T00:00:00Z')`);
  for (const file of FILES) {
    insertFile.run(file.id, file.project, file.path, `C:/ws/${file.project}/${file.path}`);
  }

  const insertImport = db.prepare(`
INSERT INTO imports(file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, 'import', ?, ?, 1)`);
  for (const [fileId, specifier, resolvedFileId, resolvedProjectId] of IMPORTS) {
    const project = FILES.find((file) => file.id === fileId).project;
    insertImport.run(fileId, project, specifier, resolvedFileId, resolvedProjectId);
  }

  const insertSymbol = db.prepare(`
INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, 'function', 1, 1, ?, 1, NULL)`);
  for (const [fileId, project, name] of SYMBOLS) insertSymbol.run(fileId, project, name, `function ${name}()`);

  return db;
}

test('deps walks resolved imports forward with depth-first discovery order', () => {
  const db = seed();
  const forward = deps(db, { target: 'src/index.mjs', project: 'alpha', depth: 2 });
  assert.deepEqual(forward.root, { path: 'src/index.mjs', project: 'alpha' });
  assert.equal(forward.direction, 'forward');
  assert.deepEqual(forward.nodes, [
    { path: 'src/index.mjs', project: 'alpha', depth: 0, via: null },
    { path: 'src/util.mjs', project: 'alpha', depth: 1, via: './util.mjs' },
```

_First 80 of 204 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
