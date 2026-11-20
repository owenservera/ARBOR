# File: hq/test/context-ranking.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/context-ranking.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10316 B |
| Lines | 211 |
| Hash | e54232617c9f |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 18 | no | const NOW = &#39;2026-11-10T12:00:00.000Z&#39;; |
| memoryIndex | function | 23 | no | function memoryIndex(files) { |
| db | const | 24 | no | const db = openMemoryDb(); |
| insertFile | const | 27 | no | const insertFile = db.prepare(` INSERT INTO files(id, project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at) VALUES (?, 1, ?, ?, ?, &#39;source&#39;, ?, 0, NU… |
| insertFts | const | 30 | no | const insertFts = db.prepare(&#39;INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)&#39;); |
| id | variable | 31 | no | let id = 0; |
| lang | const | 34 | no | const lang = file.lang ?? &#39;javascript&#39;; |
| db | const | 46 | no | const db = memoryIndex([ { path: &#39;src/watcher.mjs&#39;, content: &#39;watcher debounce timer\\n&#39; }, { path: &#39;src/events.mjs&#39;, content: &#39;events coalesce log\\n&#39; }, ]); |
| question | const | 53 | no | const question = searchContent(db, { query: &#39;how does the watcher debounce coalesce events&#39; }); |
| paths | const | 55 | no | const paths = question.results.map((hit) =&gt; hit.path); |
| miss | const | 60 | no | const miss = searchContent(db, { query: &#39;zebra&#39; }); |
| db | const | 65 | no | const db = memoryIndex([ { path: &#39;src/aa-plain.ts&#39;, content: &#39;gadget gadget\\n&#39;, lang: &#39;typescript&#39; }, { path: &#39;src/zz-gadgets.ts&#39;, content: &#39;gadget gadget\\n&#39;, lang: &#39;typescript&#39; }, ]); |
| result | const | 74 | no | const result = searchContent(db, { query: &#39;gadget&#39; }); |
| db | const | 82 | no | const db = memoryIndex([ { path: &#39;src/aaa.ts&#39;, content: &#39;gadget gadget\\n&#39;, isTest: true, lang: &#39;typescript&#39; }, { path: &#39;src/zzz.ts&#39;, content: &#39;gadget gadget\\n&#39;, lang: &#39;typescript&#39; }, ]); |
| result | const | 87 | no | const result = searchContent(db, { query: &#39;gadget&#39; }); |
| projectFixture | function | 97 | no | function projectFixture(files) { |
| root | const | 98 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-ranking-&#39;)); |
| projectRoot | const | 99 | no | const projectRoot = join(root, &#39;alpha&#39;); |
| db | const | 100 | no | const db = openMemoryDb(); |
| inserted | const | 101 | no | const inserted = db.prepare(&#39;INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)&#39;) |
| projectId | const | 103 | no | const projectId = Number(inserted.lastInsertRowid); |
| insertFile | const | 105 | no | const insertFile = db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`); |
| insertFts | const | 108 | no | const insertFts = db.prepare(&#39;INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)&#39;); |
| insertSymbol | const | 109 | no | const insertSymbol = db.prepare(` INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`); |
| abs | const | 114 | no | const abs = join(projectRoot, file.rel); |
| stat | const | 118 | no | const stat = statSync(abs); |
| info | const | 119 | no | const info = insertFile.run( projectId, file.rel, abs, lang, kind, stat.size, stat.mtimeMs, sha256(file.content), file.content.split(&#39;\\n&#39;).length, file.isTest ? 1 : 0, NOW, ); |
| fileId | const | 123 | no | const fileId = Number(info.lastInsertRowid); |
| teardown | function | 135 | no | function teardown(t, db, root) { |
| bundle | const | 149 | no | const bundle = composeContext(db, { task: &#39;how does the quokka hop&#39;, project: &#39;alpha&#39;, now: NOW }); |
| paths | const | 150 | no | const paths = bundle.sources.map((source) =&gt; source.path); |
| bundle | const | 164 | no | const bundle = composeContext(db, { task: &#39;gadget power&#39;, project: &#39;alpha&#39;, now: NOW }); |
| paths | const | 165 | no | const paths = bundle.sources.map((source) =&gt; source.path); |
| bundle | const | 176 | no | const bundle = composeContext(db, { task: &#39;sync&#39;, project: &#39;alpha&#39;, now: NOW }); |
| paths | const | 177 | no | const paths = bundle.sources.map((source) =&gt; source.path); |
| bundle | const | 190 | no | const bundle = composeContext(db, { task: &#39;gadget&#39;, project: &#39;alpha&#39;, now: NOW }); |
| paths | const | 191 | no | const paths = bundle.sources.map((source) =&gt; source.path); |
| bundle | const | 206 | no | const bundle = composeContext(db, { task: &#39;quokka hop spring&#39;, project: &#39;alpha&#39;, now: NOW }); |
| paths | const | 207 | no | const paths = bundle.sources.map((source) =&gt; source.path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 7 | external |
| node:assert/strict | import | 8 | external |
| node:fs | import | 9 | external |
| node:os | import | 10 | external |
| node:path | import | 11 | external |
| ../lib/search.mjs | import | 12 | [hq/lib/search.mjs](../lib/search.mjs.md) |
| ../lib/context.mjs | import | 13 | [hq/lib/context.mjs](../lib/context.mjs.md) |
| ../lib/schema.mjs | import | 14 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/lang.mjs | import | 15 | [hq/lib/lang.mjs](../lib/lang.mjs.md) |
| ../lib/util.mjs | import | 16 | [hq/lib/util.mjs](../lib/util.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/context-ranking.test.mjs — ZAIQ-013 ranking behavior for the
// search/context read models, measured against synthetic indexes:
//   * best-match OR fallback when an implicit-AND question matches nothing,
//   * path-name promotion and indexed-test demotion in `hq search` ordering,
//   * content-word coverage, graded symbol bonuses, path bonuses, test-file
//     demotion and per-token recall in `hq context` bundles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { searchContent } from '../lib/search.mjs';
import { composeContext } from '../lib/context.mjs';
import { openMemoryDb } from '../lib/schema.mjs';
import { detectLang } from '../lib/lang.mjs';
import { sha256 } from '../lib/util.mjs';

const NOW = '2026-11-10T12:00:00.000Z';

// ---------------------------------------------------------------------------
// search fixtures: a synthetic in-memory index (same shape as search.test.mjs)
// ---------------------------------------------------------------------------
function memoryIndex(files) {
  const db = openMemoryDb();
  db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)')
    .run('alpha', 'C:/ws/alpha', NOW);
  const insertFile = db.prepare(`
    INSERT INTO files(id, project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
    VALUES (?, 1, ?, ?, ?, 'source', ?, 0, NULL, ?, ?, 0, ?)`);
  const insertFts = db.prepare('INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)');
  let id = 0;
  for (const file of files) {
    id += 1;
    const lang = file.lang ?? 'javascript';
    insertFile.run(
      id, file.path, `C:/ws/alpha/${file.path}`, lang,
      Buffer.byteLength(file.content, 'utf8'), file.content.split('\n').length,
      file.isTest ? 1 : 0, NOW,
    );
    insertFts.run(id, file.path, file.content, 'alpha', lang);
  }
  return db;
}

test('searchContent: a natural-language AND query with no full match falls back to best-match OR', () => {
  const db = memoryIndex([
    { path: 'src/watcher.mjs', content: 'watcher debounce timer\n' },
    { path: 'src/events.mjs', content: 'events coalesce log\n' },
  ]);

  // No file contains every word, so the implicit-AND MATCH is empty; the OR
  // fallback must return the files that name the actual concepts.
  const question = searchContent(db, { query: 'how does the watcher debounce coalesce events' });
  assert.equal(question.total, 2);
  const paths = question.results.map((hit) => hit.path);
  assert.ok(paths.includes('src/watcher.mjs'), paths.join(','));
  assert.ok(paths.includes('src/events.mjs'), paths.join(','));

  // A single-token miss stays empty: one token is its own OR.
  const miss = searchContent(db, { query: 'zebra' });
  assert.deepEqual(miss, { total: 0, results: [] });
});

test('searchContent: a path that names the concept outranks an equal body match', () => {
  const db = memoryIndex([
    { path: 'src/aa-plain.ts', content: 'gadget gadget\n', lang: 'typescript' },
    { path: 'src/zz-gadgets.ts', content: 'gadget gadget\n', lang: 'typescript' },
  ]);

  // Identical bodies and equal-length paths tie on bm25 (the path token is
  // "gadgets", which the FTS tokenizer keeps distinct from "gadget"), so only
  // the path-name promotion can lift zz-gadgets.ts above the alphabetical
  // tie-break winner aa-plain.ts.
  const result = searchContent(db, { query: 'gadget' });
  assert.equal(result.total, 2);
  assert.equal(result.results[0].path, 'src/zz-gadgets.ts');
  assert.equal(result.results[1].path, 'src/aa-plain.ts');
  assert.ok(result.results[0].score < result.results[1].score, 'promoted score must be more negative');
});
```

_First 80 of 212 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
