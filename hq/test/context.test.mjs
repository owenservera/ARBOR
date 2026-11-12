// hq/test/context.test.mjs — task bundles against a real temp project.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { composeContext, verifyContext } from '../lib/context.mjs';
import { detectLang } from '../lib/lang.mjs';
import { openMemoryDb } from '../lib/schema.mjs';
import { sha256 } from '../lib/util.mjs';

const NOW = '2026-11-02T12:00:00.000Z';
const TASK = 'compose context bundle knapsack';

const A_SOURCE = [
  '// @hq:context Demo entry point for the compose context bundle knapsack task.',
  "import { helper } from './b.mjs';",
  '',
  'export function composeContext(task, budget) {',
  '  const context = helper(task);',
  '  return { context, budget, tokens: context.length };',
  '}',
  '',
  'export const BUNDLE_BUDGET = 6000;',
  '',
  'class BundlePlanner {',
  '  plan(task) {',
  '    return composeContext(task, BUNDLE_BUDGET);',
  '  }',
  '}',
  '',
].join('\n');

const B_SOURCE = [
  'export function helper(task) {',
  "  return String(task ?? '').toUpperCase();",
  '}',
  '',
].join('\n');

const README_SOURCE = [
  '# Alpha project',
  '',
  'The compose context bundle knapsack demo keeps every evidence record small.',
  'Read this first, then the docs folder.',
  '',
].join('\n');

const DOCS_SOURCE = [
  '# Alpha docs',
  '',
  'The knapsack budget keeps context bundles honest.',
  '',
].join('\n');

const SECRET_SOURCE = 'API_KEY=super-secret-compose-context-bundle-knapsack\n';

function countLines(text) {
  if (!text) return 0;
  const parts = text.split('\n');
  return text.endsWith('\n') ? parts.length - 1 : parts.length;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'hq-context-'));
  const projectRoot = join(root, 'alpha');
  const files = new Map();

  const write = (rel, text) => {
    const abs = join(projectRoot, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text, 'utf8');
    files.set(rel, { abs, text });
  };

  write('src/a.mjs', A_SOURCE);
  write('src/b.mjs', B_SOURCE);
  write('README.md', README_SOURCE);
  write('docs/README.md', DOCS_SOURCE);
  write('src/secret.env', SECRET_SOURCE);

  const db = openMemoryDb();
  const inserted = db.prepare('INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)')
    .run('alpha', projectRoot, 'dir', NOW);
  const projectId = Number(inserted.lastInsertRowid);

  const insertFile = db.prepare(`
    INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`);
  const insertFts = db.prepare('INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)');

  const ids = {};
  for (const [rel, entry] of files) {
    const { lang, kind } = detectLang(rel);
    const stat = statSync(entry.abs);
    const info = insertFile.run(
      projectId, rel, entry.abs, lang, kind, stat.size, stat.mtimeMs,
      sha256(entry.text), countLines(entry.text), NOW,
    );
    ids[rel] = Number(info.lastInsertRowid);
    insertFts.run(ids[rel], rel, entry.text, 'alpha', lang);
  }

  const insertSymbol = db.prepare(`
    INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertSymbol.run(ids['src/a.mjs'], projectId, 'composeContext', 'function', 4, 7, 'export function composeContext(task, budget)', 1, null);
  insertSymbol.run(ids['src/a.mjs'], projectId, 'BundlePlanner', 'class', 11, 15, 'class BundlePlanner', 0, null);
  insertSymbol.run(ids['src/b.mjs'], projectId, 'helper', 'function', 1, 3, 'export function helper(task)', 1, null);

  db.prepare(`
    INSERT INTO imports(file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(ids['src/a.mjs'], projectId, './b.mjs', 'import', ids['src/b.mjs'], projectId, 2);

  db.prepare(`
    INSERT INTO commits(sha, project_id, author, date, subject, type, scope, files_changed, inserted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('c1', projectId, 'Owner', '2026-10-30T09:00:00.000Z', 'feat(demo): keep context small', 'feat', 'demo', 1, NOW);
  db.prepare('INSERT INTO commit_files(sha, path, status) VALUES (?, ?, ?)')
    .run('c1', 'src/a.mjs', 'M');

  return { db, root, projectRoot, ids };
}

function teardown(t, db, root) {
  t.after(() => {
    try { db.close(); } catch { /* already closed */ }
    rmSync(root, { recursive: true, force: true });
  });
}

test('composeContext returns a verifiable, budgeted bundle', (t) => {
  const { db, root } = fixture();
  teardown(t, db, root);

  const bundle = composeContext(db, { task: TASK, project: 'alpha', now: NOW });

  assert.equal(bundle.schema, 'hq.context-bundle/1');
  assert.equal(bundle.authority, 'read_only_projection');
  assert.deepEqual(bundle.labels, { aperture: 'Discover', evidence: 'Activity Record' });
  assert.equal(bundle.task, TASK);
  assert.equal(bundle.project, 'alpha');
  assert.equal(bundle.generatedAt, NOW);
  assert.equal(bundle.budget.maxTokens, 6000);
  assert.equal(bundle.budget.reserved, 800);
  assert.equal(bundle.budget.capacity, 6000 - 800 - 80);
  assert.equal(bundle.budget.estimator, 'utf8-bytes/3');
  assert.ok(bundle.sources.length > 0);
  assert.ok(bundle.budget.used <= bundle.budget.capacity);

  const refs = bundle.sources.map((source) => source.ref);
  assert.ok(refs.includes('alpha:src/a.mjs'), refs.join(','));
  for (const source of bundle.sources) {
    assert.match(source.sha256, /^[0-9a-f]{64}$/);
    assert.match(source.digest, /^[0-9a-f]{64}$/);
    assert.equal(source.lines.length, 2);
    assert.ok(source.lines[0] >= 1);
    assert.ok(source.lines[1] >= source.lines[0]);
    assert.ok(source.estimatedTokens >= 1);
    assert.ok(source.reason.length > 0);
  }

  assert.ok(bundle.symbols.some((symbol) => symbol.name === 'composeContext'), 'symbols should include composeContext');
  assert.ok(bundle.fragment.includes('SOURCE {'));
  assert.ok(bundle.fragment.includes('alpha:src/a.mjs'));

  const verification = verifyContext(bundle);
  assert.equal(verification.valid, true);
  assert.deepEqual(verification.changed, []);
  assert.equal(verification.expected, bundle.digest);
  assert.equal(verification.current, bundle.digest);
});

test('composeContext is deterministic for the same inputs and task-sensitive', (t) => {
  const { db, root } = fixture();
  teardown(t, db, root);

  const first = composeContext(db, { task: TASK, project: 'alpha', now: NOW });
  const second = composeContext(db, { task: TASK, project: 'alpha', now: NOW });
  assert.equal(first.digest, second.digest);
  assert.deepEqual(first.sources.map((source) => source.ref), second.sources.map((source) => source.ref));
  assert.equal(first.fragment, second.fragment);

  const other = composeContext(db, { task: 'unrelated zebra migration', project: 'alpha', now: NOW });
  assert.notEqual(first.digest, other.digest);
});

test('verifyContext flags a file modified after the bundle was written', (t) => {
  const { db, root } = fixture();
  teardown(t, db, root);

  const bundle = composeContext(db, { task: TASK, project: 'alpha', now: NOW });
  const refs = bundle.sources.map((source) => source.ref);
  assert.ok(refs.includes('alpha:README.md'), refs.join(','));
  assert.equal(verifyContext(bundle).valid, true);

  // Simulate a bundle written to disk and loaded again.
  const written = JSON.parse(JSON.stringify(bundle));
  writeFileSync(join(root, 'alpha', 'README.md'), '# Alpha project\n\nRewritten after the bundle was taken.\n', 'utf8');

  const result = verifyContext(written);
  assert.equal(result.valid, false);
  assert.ok(result.changed.includes('alpha:README.md'), result.changed.join(','));
  assert.notEqual(result.current, result.expected);
});

test('secret paths are never candidates', (t) => {
  const { db, root } = fixture();
  teardown(t, db, root);

  const bundle = composeContext(db, { task: TASK, project: 'alpha', now: NOW, budgetTokens: 20_000 });
  const known = [
    ...bundle.sources.map((source) => source.ref),
    ...bundle.omissions.map((omission) => omission.ref),
  ];
  assert.ok(known.length > 0);
  assert.ok(!known.some((ref) => ref.includes('secret.env')), known.join(','));
  assert.ok(!bundle.fragment.includes('super-secret'));
  assert.ok(!bundle.fragment.includes('secret.env'));
});

test('a tiny budget never overflows and maxFiles is respected', (t) => {
  const { db, root } = fixture();
  teardown(t, db, root);

  const tiny = composeContext(db, {
    task: TASK, project: 'alpha', now: NOW, budgetTokens: 1000, maxFiles: 2,
  });
  assert.equal(tiny.budget.capacity, 1000 - 800 - 80);
  assert.ok(tiny.budget.used <= tiny.budget.capacity);
  assert.ok(tiny.sources.length <= 2);

  const single = composeContext(db, {
    task: TASK, project: 'alpha', now: NOW, budgetTokens: 20_000, maxFiles: 1,
  });
  assert.equal(single.sources.length, 1);
});

test('an unknown project or empty task yields an empty bundle', (t) => {
  const { db, root } = fixture();
  teardown(t, db, root);

  const missing = composeContext(db, { task: TASK, project: 'nope', now: NOW });
  assert.deepEqual(missing.sources, []);
  assert.equal(missing.project, 'nope');
  assert.equal(missing.budget.used, 0);

  const empty = composeContext(db, { task: '   ', project: 'alpha', now: NOW });
  assert.deepEqual(empty.sources, []);
  assert.equal(empty.budget.used, 0);
  assert.match(empty.digest, /^[0-9a-f]{64}$/);
});
