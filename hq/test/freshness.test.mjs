// hq/test/freshness.test.mjs — focused test for hq/lib/freshness.mjs
//
// @hq:context Freshness classification: a row the bounded walk did not return is
//   not proof of deletion; only the filesystem can prove a source is gone. A
//   source that outgrew the bounded walk is `over_file_cap`, never `deleted`.
// @hq:invariant Every database is in-memory and every fixture lives under a
//   disposable temp directory. The active `.hq/index.db` is never touched.
// @hq:see hq/lib/freshness.mjs · hq/lib/walk.mjs · hq/lib/schema.mjs · hq/lib/indexer.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import { collectStaleFiles } from '../lib/freshness.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'hq-freshness-'));
  const project = join(root, 'demo');
  mkdirSync(join(project, 'src'), { recursive: true });
  for (const [rel, text] of Object.entries(files)) writeFileSync(join(project, rel), text, 'utf8');
  return { root, project, file: (rel) => join(project, rel) };
}

function openIndex(root, project) {
  const db = openMemoryDb();
  return {
    db,
    run: (options = {}) => indexProject({
      root, db, project: { name: 'demo', path: project }, options: { useGit: false, ...options },
    }),
    close: () => db.close(),
  };
}

test('freshness is quiet on an unchanged tree', async () => {
  const f = fixture({ 'src/one.mjs': 'export const alpha = 1;\n' });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    const config = { maxFileBytes: 100_000, ignores: [] };
    const projects = [{ name: 'demo', path: f.project }];
    assert.deepEqual(await collectStaleFiles({ db: index.db, config, projects }), []);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('freshness names a real edit as changed', async () => {
  const f = fixture({ 'src/one.mjs': 'export const alpha = 1;\n' });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    writeFileSync(f.file('src/one.mjs'), 'export const alpha = 2;\n', 'utf8');
    const config = { maxFileBytes: 100_000, ignores: [] };
    const projects = [{ name: 'demo', path: f.project }];
    const stale = await collectStaleFiles({ db: index.db, config, projects });
    assert.deepEqual(stale, [{ project: 'demo', path: 'src/one.mjs', reason: 'changed' }]);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('freshness reports a source that outgrew the bounded walk as omitted, not deleted', async () => {
  const body = 'export const big = \'' + 'x'.repeat(400) + '\';\n';
  const f = fixture({ 'src/big.mjs': body });
  const index = openIndex(f.root, f.project);
  try {
    index.run({ maxFileBytes: 100_000 });
    const config = { maxFileBytes: 100, ignores: [] };
    const projects = [{ name: 'demo', path: f.project }];

    const grown = await collectStaleFiles({ db: index.db, config, projects });
    assert.deepEqual(grown, [{ project: 'demo', path: 'src/big.mjs', reason: 'over_file_cap' }],
      'a live source the bounded walk cannot see is never named deleted');

    // A real deletion is still proven by the filesystem.
    rmSync(f.file('src/big.mjs'));
    const gone = await collectStaleFiles({ db: index.db, config: { maxFileBytes: 100_000, ignores: [] }, projects });
    assert.deepEqual(gone, [{ project: 'demo', path: 'src/big.mjs', reason: 'deleted' }]);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('freshness reports a brand-new file as new', async () => {
  const f = fixture({ 'src/one.mjs': 'export const alpha = 1;\n' });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    writeFileSync(f.file('src/two.mjs'), 'export const beta = 2;\n', 'utf8');
    const config = { maxFileBytes: 100_000, ignores: [] };
    const projects = [{ name: 'demo', path: f.project }];
    const stale = await collectStaleFiles({ db: index.db, config, projects });
    assert.deepEqual(stale, [{ project: 'demo', path: 'src/two.mjs', reason: 'new' }]);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

