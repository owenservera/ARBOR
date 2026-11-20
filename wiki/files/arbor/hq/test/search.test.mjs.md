# File: hq/test/search.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/search.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11088 B |
| Lines | 244 |
| Hash | 2404ff5914bb |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROJECTS | const | 7 | no | const PROJECTS = [ |
| FILES | const | 12 | no | const FILES = [ |
| SYMBOLS | const | 47 | no | const SYMBOLS = [ |
| seed | function | 59 | no | function seed() { |
| db | const | 60 | no | const db = openMemoryDb(); |
| insertProject | const | 61 | no | const insertProject = db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;); |
| insertFile | const | 64 | no | const insertFile = db.prepare(` INSERT INTO files(id, project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at) VALUES (?, (SELECT id FROM projects WHERE… |
| insertFts | const | 67 | no | const insertFts = db.prepare(&#39;INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)&#39;); |
| insertSymbol | const | 76 | no | const insertSymbol = db.prepare(` INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc) VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, ?, ?, ?, ?, ?,… |
| db | const | 85 | no | const db = seed(); |
| scores | const | 95 | no | const scores = results.map((hit) =&gt; hit.score); |
| db | const | 101 | no | const db = seed(); |
| byProject | const | 103 | no | const byProject = searchContent(db, { query: &#39;quokka project:beta&#39; }); |
| byLang | const | 107 | no | const byLang = searchContent(db, { query: &#39;quokka lang:markdown&#39; }); |
| byKind | const | 111 | no | const byKind = searchContent(db, { query: &#39;project:alpha kind:doc quokka&#39; }); |
| caseInsensitive | const | 117 | no | const caseInsensitive = searchContent(db, { query: &#39;quokka project:ALPHA&#39; }); |
| db | const | 122 | no | const db = seed(); |
| first | const | 123 | no | const first = searchContent(db, { query: &#39;shared&#39;, limit: 2 }); |
| second | const | 126 | no | const second = searchContent(db, { query: &#39;shared&#39;, limit: 2, offset: 2 }); |
| paths | const | 129 | no | const paths = [...first.results, ...second.results].map((hit) =&gt; `${hit.project}:${hit.path}`); |
| beyond | const | 131 | no | const beyond = searchContent(db, { query: &#39;shared&#39;, offset: 10 }); |
| db | const | 137 | no | const db = seed(); |
| recovered | const | 138 | no | const recovered = searchContent(db, { query: &#39;&quot;quokka&#39; }); |
| nothing | const | 141 | no | const nothing = searchContent(db, { query: &#39;(&#39; }); assert.deepEqual(nothing, { total: 0, results: [] }); const empty = searchContent(db, { query: &#39; &#39; }); assert.deepEqual(empty, { total: 0, results: … |
| empty | const | 143 | no | const empty = searchContent(db, { query: &#39; &#39; }); |
| db | const | 148 | no | const db = seed(); |
| db | const | 156 | no | const db = seed(); |
| db | const | 171 | no | const db = seed(); |
| exact | const | 173 | no | const exact = searchSymbols(db, { query: &#39;userService&#39;, exact: true }); |
| loose | const | 177 | no | const loose = searchSymbols(db, { query: &#39;userService&#39;, project: &#39;alpha&#39; }); |
| constants | const | 180 | no | const constants = searchSymbols(db, { query: &#39;user&#39;, kind: &#39;const&#39; }); |
| beta | const | 183 | no | const beta = searchSymbols(db, { query: &#39;user&#39;, project: &#39;beta&#39; }); |
| page | const | 186 | no | const page = searchSymbols(db, { query: &#39;user&#39;, limit: 2 }); |
| db | const | 194 | no | const db = seed(); |
| upper | const | 211 | no | const upper = findFiles(db, { pattern: &#39;README&#39; }); |
| db | const | 216 | no | const db = seed(); |
| mjs | const | 218 | no | const mjs = findFiles(db, { pattern: &#39;src/*.mjs&#39; }); |
| docs | const | 227 | no | const docs = findFiles(db, { pattern: &#39;**/*.md&#39;, project: &#39;alpha&#39; }); |
| lang | const | 231 | no | const lang = findFiles(db, { pattern: &#39;**/*.md&#39;, lang: &#39;markdown&#39; }); |
| capped | const | 234 | no | const capped = findFiles(db, { pattern: &#39;src&#39;, limit: 2 }); |
| db | const | 240 | no | const db = seed(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/schema.mjs | import | 4 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/search.mjs | import | 5 | [hq/lib/search.mjs](../lib/search.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/search.test.mjs — content, symbol and file search over a synthetic index.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openMemoryDb } from '../lib/schema.mjs';
import { searchContent, searchSymbols, findFiles } from '../lib/search.mjs';

const PROJECTS = [
  { name: 'alpha', path: 'C:/ws/alpha' },
  { name: 'beta', path: 'C:/ws/beta' },
];

const FILES = [
  {
    id: 1, project: 'alpha', path: 'src/user_service.mjs', lang: 'javascript', kind: 'source', size: 780, lines: 22,
    content: 'export function createUserService() { return fetchUserProfile() }\n// alpha alpha alpha user toolbar\n',
  },
  {
    id: 2, project: 'alpha', path: 'src/util.mjs', lang: 'javascript', kind: 'source', size: 240, lines: 8,
    content: 'export const user = 1;\nexport const userCount = 2;\nexport function userService() {}\n// helper alpha\n',
  },
  {
    id: 3, project: 'alpha', path: 'src/legacy_helpers.mjs', lang: 'javascript', kind: 'source', size: 120, lines: 5,
    content: '// legacy user helper\nexport function legacyHelper() { return 1 }\n',
  },
  {
    id: 4, project: 'alpha', path: 'README.md', lang: 'markdown', kind: 'doc', size: 300, lines: 6,
    content: '# Alpha\n\nquokka quokka quokka\n\nQuantum notes for the alpha project.\n',
  },
  {
    id: 5, project: 'alpha', path: 'src/app.ts', lang: 'typescript', kind: 'source', size: 200, lines: 4,
    content: 'import { util } from "./util.mjs";\n// shared beta alpha\nexport const app = () => "quokka";\n',
  },
  {
    id: 6, project: 'alpha', path: 'docs/guide.md', lang: 'markdown', kind: 'doc', size: 900, lines: 12,
    content: '# Guide\n\n' + 'shared filler words keep this document long and unremarkable '.repeat(5) + 'quokka\n',
  },
  {
    id: 7, project: 'beta', path: 'lib/user_service.mjs', lang: 'javascript', kind: 'source', size: 150, lines: 4,
    content: 'export function createUserService() {}\n// shared beta quokka\n',
  },
  {
    id: 8, project: 'beta', path: 'src/index.mjs', lang: 'javascript', kind: 'source', size: 160, lines: 4,
    content: '// shared first\nimport alpha from "alpha/src/util.mjs";\n',
  },
];

const SYMBOLS = [
  [1, 'alpha', 'createUserService', 'function', 1, 1, 'export function createUserService()', 1],
  [1, 'alpha', 'fetchUserProfile', 'function', 1, 1, 'function fetchUserProfile()', 0],
  [2, 'alpha', 'user', 'variable', 1, 1, 'export const user = 1', 1],
  [2, 'alpha', 'userCount', 'const', 2, 2, 'export const userCount = 2', 1],
  [2, 'alpha', 'userService', 'function', 3, 3, 'export function userService()', 1],
  [3, 'alpha', 'legacyHelper', 'function', 2, 2, 'export function legacyHelper()', 1],
  [5, 'alpha', 'app', 'const', 3, 3, 'export const app = () => "quokka"', 1],
  [7, 'beta', 'createUserService', 'function', 1, 1, 'export function createUserService()', 1],
  [8, 'beta', 'default', 'variable', 1, 1, 'import alpha from "alpha/src/util.mjs"', 0],
];

function seed() {
  const db = openMemoryDb();
  const insertProject = db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)');
  for (const project of PROJECTS) insertProject.run(project.name, project.path, '2026-01-01T00:00:00Z');

  const insertFile = db.prepare(`
INSERT INTO files(id, project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, ?, ?, ?, ?, 0, NULL, ?, 0, 0, '2026-01-01T00:00:00Z')`);
  const insertFts = db.prepare('INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)');
  for (const file of FILES) {
    insertFile.run(
      file.id, file.project, file.path, `C:/ws/${file.project}/${file.path}`,
      file.lang, file.kind, file.size, file.lines,
    );
    insertFts.run(file.id, file.path, file.content, file.project, file.lang);
  }

  const insertSymbol = db.prepare(`
INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, ?, ?, ?, ?, ?, NULL)`);
  for (const symbol of SYMBOLS) insertSymbol.run(...symbol);
```

_First 80 of 245 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
