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

  return db;
}

test('searchContent ranks by bm25 ascending and marks matches in the snippet', () => {
  const db = seed();
  const { total, results } = searchContent(db, { query: 'quokka' });
  assert.equal(total, 4);
  assert.equal(results[0].path, 'README.md');
  assert.equal(results.at(-1).path, 'docs/guide.md');
  assert.match(results[0].snippet, />>>quokka<<</);
  assert.match(results[0].snippet, /<<<|>>>/);
  assert.equal(results[0].kind, 'doc');
  assert.equal(results[0].lang, 'markdown');
  assert.equal(results[0].line, 3);
  const scores = results.map((hit) => hit.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => a - b));
  assert.ok(scores.every((score) => score <= 0));
});

test('searchContent parses project, lang and kind filters out of the query', () => {
  const db = seed();

  const byProject = searchContent(db, { query: 'quokka project:beta' });
  assert.equal(byProject.total, 1);
  assert.deepEqual(byProject.results.map((hit) => hit.project), ['beta']);

  const byLang = searchContent(db, { query: 'quokka lang:markdown' });
  assert.equal(byLang.total, 2);
  assert.deepEqual(byLang.results.map((hit) => hit.path).sort(), ['README.md', 'docs/guide.md']);

  const byKind = searchContent(db, { query: 'project:alpha kind:doc quokka' });
  assert.equal(byKind.total, 2);
  assert.ok(byKind.results.every((hit) => hit.kind === 'doc'));

  // Filters are stripped before the MATCH string reaches SQLite.
  assert.match(byKind.results[0].snippet, />>>quokka<<</);
  const caseInsensitive = searchContent(db, { query: 'quokka project:ALPHA' });
  assert.equal(caseInsensitive.total, 3);
});

test('searchContent reports unpaginated totals with limit and offset', () => {
  const db = seed();
  const first = searchContent(db, { query: 'shared', limit: 2 });
  assert.equal(first.total, 4);
  assert.equal(first.results.length, 2);
  const second = searchContent(db, { query: 'shared', limit: 2, offset: 2 });
  assert.equal(second.total, 4);
  assert.equal(second.results.length, 2);
  const paths = [...first.results, ...second.results].map((hit) => `${hit.project}:${hit.path}`);
  assert.equal(new Set(paths).size, 4);
  const beyond = searchContent(db, { query: 'shared', offset: 10 });
  assert.equal(beyond.total, 4);
  assert.deepEqual(beyond.results, []);
});

test('searchContent falls back to quoted tokens for malformed FTS expressions', () => {
  const db = seed();
  const recovered = searchContent(db, { query: '"quokka' });
  assert.equal(recovered.total, 4);
  assert.equal(recovered.results[0].path, 'README.md');
  const nothing = searchContent(db, { query: '(' });
  assert.deepEqual(nothing, { total: 0, results: [] });
  const empty = searchContent(db, { query: '   ' });
  assert.deepEqual(empty, { total: 0, results: [] });
});

test('searchContent supports filter-only queries without a MATCH term', () => {
  const db = seed();
  const { total, results } = searchContent(db, { query: 'project:beta' });
  assert.equal(total, 2);
  assert.deepEqual(results.map((hit) => hit.path), ['lib/user_service.mjs', 'src/index.mjs']);
  assert.ok(results.every((hit) => hit.score === 0 && hit.line === null));
});

test('searchSymbols orders exact, then prefix, then substring matches', () => {
  const db = seed();
  const { total, results } = searchSymbols(db, { query: 'user', project: 'alpha' });
  assert.equal(total, 5);
  assert.deepEqual(results.map((hit) => hit.name), [
    'user', 'userCount', 'userService', 'createUserService', 'fetchUserProfile',
  ]);
  assert.deepEqual(results[0], {
    name: 'user', kind: 'variable', path: 'src/util.mjs', project: 'alpha',
    line: 1, end_line: 1, signature: 'export const user = 1', exported: true,
  });
  assert.equal(results[3].exported, true);
  assert.equal(results[4].exported, false);
});

test('searchSymbols honors exact, kind and project filters and pagination totals', () => {
  const db = seed();

  const exact = searchSymbols(db, { query: 'userService', exact: true });
  assert.equal(exact.total, 1);
  assert.deepEqual(exact.results.map((hit) => hit.name), ['userService']);

  const loose = searchSymbols(db, { query: 'userService', project: 'alpha' });
  assert.deepEqual(loose.results.map((hit) => hit.name), ['userService', 'createUserService']);

  const constants = searchSymbols(db, { query: 'user', kind: 'const' });
  assert.deepEqual(constants.results.map((hit) => hit.name), ['userCount']);

  const beta = searchSymbols(db, { query: 'user', project: 'beta' });
  assert.deepEqual(beta.results.map((hit) => hit.path), ['lib/user_service.mjs']);

  const page = searchSymbols(db, { query: 'user', limit: 2 });
  assert.equal(page.total, 6);
  assert.deepEqual(page.results.map((hit) => hit.name), ['user', 'userCount']);

  assert.deepEqual(searchSymbols(db, { query: '' }), { total: 0, results: [] });
});

test('findFiles matches path substrings case-insensitively', () => {
  const db = seed();
  const { total, results } = findFiles(db, { pattern: 'user_service' });
  assert.equal(total, 2);
  assert.deepEqual(results.map((hit) => `${hit.project}:${hit.path}`), [
    'alpha:src/user_service.mjs',
    'beta:lib/user_service.mjs',
  ]);
  assert.deepEqual(results[0], {
    path: 'src/user_service.mjs',
    project: 'alpha',
    lang: 'javascript',
    kind: 'source',
    size: 780,
    lines: 22,
    symbols: 2,
  });

  const upper = findFiles(db, { pattern: 'README' });
  assert.deepEqual(upper.results.map((hit) => hit.path), ['README.md']);
});

test('findFiles expands glob patterns and applies filters and totals', () => {
  const db = seed();

  const mjs = findFiles(db, { pattern: 'src/*.mjs' });
  assert.equal(mjs.total, 4);
  assert.deepEqual(mjs.results.map((hit) => `${hit.project}:${hit.path}`), [
    'alpha:src/legacy_helpers.mjs',
    'alpha:src/user_service.mjs',
    'alpha:src/util.mjs',
    'beta:src/index.mjs',
  ]);

  const docs = findFiles(db, { pattern: '**/*.md', project: 'alpha' });
  assert.equal(docs.total, 2);
  assert.deepEqual(docs.results.map((hit) => hit.path), ['README.md', 'docs/guide.md']);

  const lang = findFiles(db, { pattern: '**/*.md', lang: 'markdown' });
  assert.equal(lang.total, 2);

  const capped = findFiles(db, { pattern: 'src', limit: 2 });
  assert.equal(capped.total, 5);
  assert.equal(capped.results.length, 2);
});

test('search output is deterministic across repeated calls', () => {
  const db = seed();
  assert.deepEqual(searchContent(db, { query: 'quokka' }), searchContent(db, { query: 'quokka' }));
  assert.deepEqual(searchSymbols(db, { query: 'user' }), searchSymbols(db, { query: 'user' }));
  assert.deepEqual(findFiles(db, { pattern: 'src' }), findFiles(db, { pattern: 'src' }));
});
