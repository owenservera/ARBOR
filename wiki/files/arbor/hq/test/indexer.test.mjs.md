# File: hq/test/indexer.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/indexer.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16470 B |
| Lines | 401 |
| Hash | 5b376211beb3 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 15 | no | function fixture(files) { |
| dir | const | 16 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-indexer-&#39;)); |
| abs | const | 18 | no | const abs = join(dir, rel); |
| count | function | 25 | no | function count(db, sql, ...params) { |
| dir | const | 30 | no | const dir = fixture({ &#39;src/app.mjs&#39;: &#39;export const quantumBadger = 1;\\n&#39;, &#39;src/util.ts&#39;: &#39;export function frobnicator(a, b) {\\n return a + b;\\n}\\n&#39;, &#39;README.md&#39;: &#39;# Demo\\n\\nLocal only.\\n&#39;, }); |
| db | const | 35 | no | const db = openMemoryDb(); |
| res | const | 37 | no | const res = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir } }); |
| row | const | 52 | no | const row = db.prepare(&#39;SELECT * FROM files WHERE path = ?&#39;).get(&#39;src/app.mjs&#39;); |
| abs | const | 53 | no | const abs = join(dir, &#39;src/app.mjs&#39;); |
| stat | const | 54 | no | const stat = statSync(abs); |
| doc | const | 65 | no | const doc = db.prepare(&#39;SELECT * FROM files WHERE path = ?&#39;).get(&#39;README.md&#39;); |
| hits | const | 69 | no | const hits = db.prepare(&#39;SELECT path FROM content_fts WHERE content_fts MATCH ?&#39;).all(&#39;quantumbadger&#39;); |
| dir | const | 79 | no | const dir = fixture({ &#39;a.mjs&#39;: &#39;export const one = 1;\\n&#39;, &#39;b.md&#39;: &#39;# B\\n&#39;, }); |
| db | const | 83 | no | const db = openMemoryDb(); |
| first | const | 85 | no | const first = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir } }); |
| second | const | 87 | no | const second = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir } }); |
| dir | const | 101 | no | const dir = fixture({ &#39;src/a.mjs&#39;: &#39;const alpha = 1;\\n&#39;, &#39;src/b.mjs&#39;: &#39;const bravo = 2;\\n&#39;, &#39;src/unique.mjs&#39;: &#39;const zzzuniquetoken = 3;\\n&#39;, }); |
| db | const | 106 | no | const db = openMemoryDb(); |
| first | const | 108 | no | const first = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir } }); |
| target | const | 113 | no | const target = join(dir, &#39;src/a.mjs&#39;); |
| before | const | 114 | no | const before = statSync(target); |
| removedRow | const | 118 | no | const removedRow = db.prepare(&#39;SELECT id FROM files WHERE path = ?&#39;).get(&#39;src/unique.mjs&#39;); |
| second | const | 121 | no | const second = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir } }); |
| a | const | 127 | no | const a = db.prepare(&#39;SELECT hash FROM files WHERE path = ?&#39;).get(&#39;src/a.mjs&#39;); |
| gone | const | 129 | no | const gone = db.prepare(&#39;SELECT id FROM files WHERE path = ?&#39;).get(&#39;src/unique.mjs&#39;); |
| hits | const | 132 | no | const hits = db.prepare(&#39;SELECT path FROM content_fts WHERE content_fts MATCH ?&#39;).all(&#39;zzzuniquetoken&#39;); |
| demo | const | 142 | no | const demo = fixture({ &#39;src/a.mjs&#39;: &#39;import &quot;./b.mjs&quot;;\\n&#39;, &#39;src/b.mjs&#39;: &#39;export const b = 1;\\n&#39;, &#39;src/mod/index.ts&#39;: &#39;export const mod = 1;\\n&#39;, }); |
| lib | const | 147 | no | const lib = fixture({ &#39;package.json&#39;: JSON.stringify({ name: &#39;@acme/core&#39;, main: &#39;index.mjs&#39; }), &#39;index.mjs&#39;: &#39;export const core = 1;\\n&#39;, }); |
| db | const | 151 | no | const db = openMemoryDb(); |
| demoId | const | 156 | no | const demoId = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(&#39;demo&#39;).id; |
| libId | const | 157 | no | const libId = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(&#39;libpkg&#39;).id; |
| fileIndex | const | 158 | no | const fileIndex = new Map( db.prepare(&#39;SELECT path, id FROM files WHERE project_id = ?&#39;).all(demoId).map((r) =&gt; [r.path, r.id]), ); |
| importer | const | 161 | no | const importer = { path: &#39;src/a.mjs&#39; }; |
| bId | const | 162 | no | const bId = fileIndex.get(&#39;src/b.mjs&#39;); |
| modId | const | 163 | no | const modId = fileIndex.get(&#39;src/mod/index.ts&#39;); |
| dir | const | 202 | no | const dir = fixture({ &#39;ok.mjs&#39;: &#39;export const fine = true;\\n&#39;, &#39;broken.mjs&#39;: &#39;export const broken = true;\\n&#39;, }); |
| db | const | 206 | no | const db = openMemoryDb(); |
| res | const | 208 | no | const res = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir }, options: { |
| failingDb | function | 233 | no | function failingDb(db, { match, failOn }) { |
| calls | variable | 234 | no | let calls = 0; |
| stmt | const | 239 | no | const stmt = target.prepare(sql); |
| value | const | 250 | no | const value = inner[key]; |
| value | const | 256 | no | const value = target[prop]; |
| dir | const | 263 | no | const dir = fixture({ &#39;a.mjs&#39;: &#39;const alpha = 1;\\n&#39;, &#39;b.mjs&#39;: &#39;const bravo = 2;\\n&#39;, }); |
| db | const | 267 | no | const db = openMemoryDb(); |
| before | const | 270 | no | const before = db.prepare(&#39;SELECT path, hash FROM files ORDER BY path&#39;).all(); |
| beforeFts | const | 271 | no | const beforeFts = db.prepare(&#39;SELECT rowid, content FROM content_fts ORDER BY rowid&#39;).all(); |
| broken | const | 277 | no | const broken = failingDb(db, { match: &#39;INSERT INTO content_fts&#39;, failOn: 2 }); |
| after | const | 283 | no | const after = db.prepare(&#39;SELECT path, hash FROM files ORDER BY path&#39;).all(); |
| dir | const | 293 | no | const dir = fixture({ &#39;a.mjs&#39;: &#39;// @hq:context demo\\nconst a = 1;\\n&#39; }); |
| db | const | 294 | no | const db = openMemoryDb(); |
| extractors | function | 298 | no | const extractors = (annotations) =&gt; ({ extractAnnotations: () =&gt; annotations, }); |
| first | const | 302 | no | const first = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir }, options: { extractors: extractors([ { line: 1, kind: &#39;context&#39;, text: &#39;first&#39;, owner: null, ref: null }, { line: 1, k… |
| second | const | 312 | no | const second = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir }, options: { force: true, extractors: extractors([]) }, }); |
| third | const | 319 | no | const third = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir }, options: { force: true, extractors: extractors([{ line: 1, kind: &#39;todo&#39;, text: &#39;only&#39;, owner: null, ref: null }]) }, … |
| rows | const | 324 | no | const rows = db.prepare(&#39;SELECT kind, text FROM annotations&#39;).all() |
| alpha | const | 334 | no | const alpha = fixture({ &#39;a.mjs&#39;: &#39;const a = 1;\\n&#39; }); |
| beta | const | 335 | no | const beta = fixture({ &#39;b.mjs&#39;: &#39;const b = 2;\\n&#39;, &#39;c.md&#39;: &#39;# C\\n&#39; }); |
| db | const | 336 | no | const db = openMemoryDb(); |
| res | const | 338 | no | const res = indexWorkspace({ root: tmpdir(), db, projects: [ { name: &#39;alpha&#39;, path: alpha }, |
| again | const | 355 | no | const again = indexWorkspace({ root: tmpdir(), db, projects: [{ name: &#39;alpha&#39;, path: alpha }, { name: &#39;beta&#39;, path: beta }], }); |
| dir | const | 378 | no | const dir = fixture({ &#39;src/app.mjs&#39;: &#39;export const quantumBadger = 1;\\n&#39;, }); |
| db | const | 381 | no | const db = openMemoryDb(); |
| noop | const | 386 | no | const noop = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir } }); |
| row | variable | 388 | no | let row = db.prepare(&#39;SELECT indexed_at FROM projects WHERE name = ?&#39;).get(&#39;demo&#39;); |
| changed | const | 393 | no | const changed = indexProject({ root: dir, db, project: { name: &#39;demo&#39;, path: dir } }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 9 | external |
| node:path | import | 10 | external |
| ../lib/schema.mjs | import | 11 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/util.mjs | import | 12 | [hq/lib/util.mjs](../lib/util.mjs.md) |
| ../lib/indexer.mjs | import | 13 | [hq/lib/indexer.mjs](../lib/indexer.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/indexer.test.mjs — incremental indexing, FTS, import resolution.
// Lane B owns this file. Extraction is lane A and may still be the stub
// returning [], so no assertion here depends on real symbol/import extraction.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, writeFileSync, mkdirSync, rmSync, unlinkSync, statSync, utimesSync, readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import { sha256File } from '../lib/util.mjs';
import { indexProject, indexWorkspace, resolveImport } from '../lib/indexer.mjs';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'hq-indexer-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
  return dir;
}

function count(db, sql, ...params) {
  return Number(db.prepare(sql).get(...params)?.c || 0);
}

test('indexes a new project: file rows, hash, lines, fts', () => {
  const dir = fixture({
    'src/app.mjs': 'export const quantumBadger = 1;\n',
    'src/util.ts': 'export function frobnicator(a, b) {\n  return a + b;\n}\n',
    'README.md': '# Demo\n\nLocal only.\n',
  });
  const db = openMemoryDb();
  try {
    const res = indexProject({ root: dir, db, project: { name: 'demo', path: dir } });

    assert.equal(res.added, 3);
    assert.equal(res.changed, 0);
    assert.equal(res.unchanged, 0);
    assert.equal(res.removed, 0);
    assert.equal(res.errors.length, 0);
    assert.ok(res.ms >= 0);
    assert.equal(res.project.name, 'demo');
    assert.equal(res.project.path, dir);
    assert.equal(res.project.kind, 'dir');
    assert.equal(res.project.file_count, 3);
    assert.ok(res.project.added_at);
    assert.ok(res.project.indexed_at);

    const row = db.prepare('SELECT * FROM files WHERE path = ?').get('src/app.mjs');
    const abs = join(dir, 'src/app.mjs');
    const stat = statSync(abs);
    assert.equal(row.lang, 'javascript');
    assert.equal(row.kind, 'source');
    assert.equal(row.size, stat.size);
    assert.equal(row.mtime_ms, Math.floor(stat.mtimeMs));
    assert.equal(row.hash, sha256File(abs));
    assert.equal(row.lines, 1);
    assert.equal(row.is_test, 0);
    assert.equal(row.is_generated, 0);
    assert.equal(row.abs_path, abs);

    const doc = db.prepare('SELECT * FROM files WHERE path = ?').get('README.md');
    assert.equal(doc.lang, 'markdown');
    assert.equal(doc.kind, 'doc');

    const hits = db.prepare('SELECT path FROM content_fts WHERE content_fts MATCH ?').all('quantumbadger');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].path, 'src/app.mjs');
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('second index with unchanged files counts unchanged and adds nothing', () => {
  const dir = fixture({
    'a.mjs': 'export const one = 1;\n',
```

_First 80 of 402 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
