// hq/test/foundation.test.mjs — schema, util, lang, registry invariants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb, transaction, SCHEMA_VERSION } from '../lib/schema.mjs';
import { digestOf, canonicalJson, tokenize, globToRegExp, toPosix } from '../lib/util.mjs';
import { detectLang, isTestPath, isGeneratedPath, componentOf } from '../lib/lang.mjs';
import { discoverFiles } from '../lib/walk.mjs';
import { registerProject, loadProjects, findProject } from '../lib/registry.mjs';

test('schema creates every expected table', () => {
  const db = openMemoryDb();
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name")
    .all().map((r) => r.name);
  for (const expected of [
    'meta', 'projects', 'files', 'symbols', 'imports', 'commits', 'commit_files',
    'events', 'instructions', 'notes', 'receipts', 'annotations', 'wiki_pages', 'content_fts',
  ]) {
    assert.ok(names.includes(expected), `missing table ${expected}`);
  }
  const version = db.prepare("SELECT value FROM meta WHERE key='schema_version'").get();
  assert.equal(Number(version.value), SCHEMA_VERSION);
});

test('transaction rolls back on throw', () => {
  const db = openMemoryDb();
  assert.throws(() => transaction(db, () => {
    db.prepare('INSERT INTO projects(name,path,added_at) VALUES (?,?,?)').run('x', 'C:/x', '2026-01-01T00:00:00Z');
    throw new Error('boom');
  }));
  assert.equal(db.prepare('SELECT count(*) c FROM projects').get().c, 0);
});

test('fts5 indexes and searches identifiers', () => {
  const db = openMemoryDb();
  db.prepare('INSERT INTO content_fts(rowid,path,content,project,lang) VALUES (?,?,?,?,?)')
    .run(1, 'src/user_service.mjs', 'export function createUserService(){ return fetchUserProfile() }', 'demo', 'javascript');
  const rows = db.prepare("SELECT path FROM content_fts WHERE content_fts MATCH ?").all('createUserService');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, 'src/user_service.mjs');
});

test('canonical digests are key-order independent', () => {
  assert.equal(digestOf({ b: 2, a: [1, { z: 1, y: 2 }] }), digestOf({ a: [1, { y: 2, z: 1 }], b: 2 }));
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{\n  "a": 2,\n  "b": 1\n}\n');
});

test('tokenize is deterministic and deduped', () => {
  assert.deepEqual(tokenize('The user-service uses UserService, the user-service!'), [
    'the', 'user-service', 'userservice', 'uses',
  ]);
});

test('glob matching handles **, *, and braces', () => {
  assert.ok(globToRegExp('src/**/*.mjs').test('src/lib/deep/x.mjs'));
  assert.ok(!globToRegExp('src/*.mjs').test('src/lib/x.mjs'));
  assert.ok(globToRegExp('**/*.{md,mdx}').test('README.md'));
  assert.ok(globToRegExp('**/*.{md,mdx}').test('docs/x.mdx'));
});

test('language and path classification', () => {
  assert.deepEqual(detectLang('a/b/c.tsx'), { lang: 'typescript', kind: 'source', ext: '.tsx' });
  assert.equal(detectLang('README.md').kind, 'doc');
  assert.equal(detectLang('package.json').kind, 'config');
  assert.equal(detectLang('logo.png').kind, 'binary');
  assert.ok(isTestPath('test/x.test.mjs'));
  assert.ok(isTestPath('src/__tests__/x.js'));
  assert.ok(!isTestPath('src/contest.mjs'));
  assert.ok(isGeneratedPath('node_modules/x/index.js'));
  assert.ok(isGeneratedPath('dist/app.min.js'));
  assert.equal(componentOf('apps/vivim-host/server.mjs'), 'vivim-host');
  assert.equal(componentOf('harness/src/x.mjs'), 'harness');
  assert.equal(componentOf('README.md'), 'root');
});

test('discoverFiles walks a non-git project and skips ignored/binary/large', () => {
  const root = mkdtempSync(join(tmpdir(), 'hq-foundation-'));
  try {
    writeFileSync(join(root, 'a.mjs'), 'export const a = 1;\n');
    writeFileSync(join(root, 'README.md'), '# Demo\n');
    writeFileSync(join(root, 'big.mjs'), 'x'.repeat(2000));
    writeFileSync(join(root, 'bin.mjs'), Buffer.from([0, 1, 2, 3]));
    mkdirSync(join(root, 'node_modules'));
    writeFileSync(join(root, 'node_modules', 'skip.mjs'), 'export const skip = 1;\n');
    const entries = discoverFiles(root, { useGit: false, maxFileBytes: 1000 });
    const rels = entries.map((e) => e.rel).sort();
    assert.deepEqual(rels, ['README.md', 'a.mjs']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('registry stores relative paths and dedupes projects', () => {
  const root = mkdtempSync(join(tmpdir(), 'hq-reg-'));
  try {
    const projectDir = join(root, 'harvest', 'demo');
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, 'package.json'), '{"name":"demo"}');
    registerProject(root, { name: 'demo', path: projectDir, tags: ['work'] });
    registerProject(root, { name: 'demo', path: projectDir, tags: ['favorite'] });
    const data = loadProjects(root);
    assert.equal(data.projects.length, 1);
    assert.deepEqual(data.projects[0].tags, ['favorite', 'work']);
    assert.equal(data.projects[0].path, 'harvest/demo');
    assert.equal(findProject(data, 'demo').name, 'demo');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('posix normalization never leaves backslashes', () => {
  assert.equal(toPosix('a\\b\\c'), 'a/b/c');
});
