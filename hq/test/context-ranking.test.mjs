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

test('searchContent: indexed test files rank behind equal body matches', () => {
  const db = memoryIndex([
    { path: 'src/aaa.ts', content: 'gadget gadget\n', isTest: true, lang: 'typescript' },
    { path: 'src/zzz.ts', content: 'gadget gadget\n', lang: 'typescript' },
  ]);

  const result = searchContent(db, { query: 'gadget' });
  assert.equal(result.total, 2);
  assert.equal(result.results[0].path, 'src/zzz.ts');
  assert.equal(result.results[1].path, 'src/aaa.ts');
  assert.ok(result.results[0].score < result.results[1].score, 'demoted score must be less negative');
});

// ---------------------------------------------------------------------------
// context fixtures: a real temp project on disk (same shape as context.test.mjs)
// ---------------------------------------------------------------------------
function projectFixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'hq-ranking-'));
  const projectRoot = join(root, 'alpha');
  const db = openMemoryDb();
  const inserted = db.prepare('INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)')
    .run('alpha', projectRoot, 'dir', NOW);
  const projectId = Number(inserted.lastInsertRowid);

  const insertFile = db.prepare(`
    INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`);
  const insertFts = db.prepare('INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)');
  const insertSymbol = db.prepare(`
    INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const file of files) {
    const abs = join(projectRoot, file.rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.content, 'utf8');
    const { lang, kind } = detectLang(file.rel);
    const stat = statSync(abs);
    const info = insertFile.run(
      projectId, file.rel, abs, lang, kind, stat.size, stat.mtimeMs,
      sha256(file.content), file.content.split('\n').length, file.isTest ? 1 : 0, NOW,
    );
    const fileId = Number(info.lastInsertRowid);
    insertFts.run(fileId, file.rel, file.content, 'alpha', lang);
    for (const symbol of file.symbols ?? []) {
      insertSymbol.run(
        fileId, projectId, symbol.name, symbol.kind ?? 'function',
        symbol.line, symbol.endLine ?? symbol.line, symbol.signature ?? '', 1, null,
      );
    }
  }
  return { db, root, projectRoot };
}

function teardown(t, db, root) {
  t.after(() => {
    try { db.close(); } catch { /* already closed */ }
    rmSync(root, { recursive: true, force: true });
  });
}

test('composeContext coverage runs over content words, not function words', (t) => {
  const { db, root } = projectFixture([
    { rel: 'src/real.mjs', content: 'export const quokka = hop();\n' },
    { rel: 'src/filler.mjs', content: 'export const filler = 1; // how does the quokka\n' },
  ]);
  teardown(t, db, root);

  const bundle = composeContext(db, { task: 'how does the quokka hop', project: 'alpha', now: NOW });
  const paths = bundle.sources.map((source) => source.path);
  assert.ok(paths.includes('src/real.mjs'), paths.join(','));
  assert.ok(paths.includes('src/filler.mjs'), paths.join(','));
  // "how does the" live in both files; only real.mjs covers the content words.
  assert.equal(bundle.sources[0].path, 'src/real.mjs');
});

test('composeContext boosts a file whose path names the task concept', (t) => {
  const { db, root } = projectFixture([
    { rel: 'src/plain.mjs', content: 'export const other = 1; // gadget power\n' },
    { rel: 'src/zz-gadget.mjs', content: 'export const gadget = power;\n' },
  ]);
  teardown(t, db, root);

  const bundle = composeContext(db, { task: 'gadget power', project: 'alpha', now: NOW });
  const paths = bundle.sources.map((source) => source.path);
  assert.deepEqual(paths, ['src/zz-gadget.mjs', 'src/plain.mjs']);
});

test('composeContext grades symbol matches: exact name beats substring', (t) => {
  const { db, root } = projectFixture([
    { rel: 'src/async.mjs', content: 'export function synchronize() { return 1 }\n', symbols: [{ name: 'synchronize', line: 1 }] },
    { rel: 'src/bus.mjs', content: 'export function sync() { return 2 }\n', symbols: [{ name: 'sync', line: 1 }] },
  ]);
  teardown(t, db, root);

  const bundle = composeContext(db, { task: 'sync', project: 'alpha', now: NOW });
  const paths = bundle.sources.map((source) => source.path);
  assert.ok(paths.includes('src/async.mjs'), paths.join(','));
  assert.ok(paths.includes('src/bus.mjs'), paths.join(','));
  assert.equal(bundle.sources[0].path, 'src/bus.mjs');
});

test('composeContext demotes indexed test files below equal implementation files', (t) => {
  const { db, root } = projectFixture([
    { rel: 'src/aa-gadget.mjs', content: 'export const gadget = 1;\n', isTest: true },
    { rel: 'src/zz-impl.mjs', content: 'export const gadget = 1;\n' },
  ]);
  teardown(t, db, root);

  const bundle = composeContext(db, { task: 'gadget', project: 'alpha', now: NOW });
  const paths = bundle.sources.map((source) => source.path);
  // Demoted, not removed: the test file stays available, just never first.
  assert.ok(paths.includes('src/aa-gadget.mjs'), paths.join(','));
  assert.equal(bundle.sources[0].path, 'src/zz-impl.mjs');
});

test('composeContext recalls files that match only some task concepts', (t) => {
  const { db, root } = projectFixture([
    { rel: 'src/all.mjs', content: 'export const all = "quokka hop spring";\n' },
    { rel: 'src/runner.mjs', content: 'export function runner() { return "quokka hop"; }\n' },
  ]);
  teardown(t, db, root);

  // src/all.mjs satisfies the implicit-AND MATCH on its own; src/runner.mjs
  // misses "spring" and only enters through the per-token content pass.
  const bundle = composeContext(db, { task: 'quokka hop spring', project: 'alpha', now: NOW });
  const paths = bundle.sources.map((source) => source.path);
  assert.ok(paths.includes('src/all.mjs'), paths.join(','));
  assert.ok(paths.includes('src/runner.mjs'), paths.join(','));
  assert.equal(bundle.sources[0].path, 'src/all.mjs');
});
