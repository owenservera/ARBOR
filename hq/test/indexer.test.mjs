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
    'b.md': '# B\n',
  });
  const db = openMemoryDb();
  try {
    const first = indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    assert.equal(first.added, 2);
    const second = indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    assert.equal(second.added, 0);
    assert.equal(second.changed, 0);
    assert.equal(second.unchanged, 2);
    assert.equal(second.removed, 0);
    assert.equal(count(db, 'SELECT count(*) AS c FROM files'), 2);
    assert.equal(count(db, 'SELECT count(*) AS c FROM content_fts'), 2);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('detects changed content with identical size via the hash path, and removes deleted files', () => {
  const dir = fixture({
    'src/a.mjs': 'const alpha = 1;\n',
    'src/b.mjs': 'const bravo = 2;\n',
    'src/unique.mjs': 'const zzzuniquetoken = 3;\n',
  });
  const db = openMemoryDb();
  try {
    const first = indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    assert.equal(first.added, 3);

    // Same byte length, newer mtime: the size+mtime fast path cannot explain
    // the change, so the hash path must detect it.
    const target = join(dir, 'src/a.mjs');
    const before = statSync(target);
    writeFileSync(target, 'const gamma = 1;\n', 'utf8');
    utimesSync(target, before.atime, new Date(before.mtime.getTime() + 1000));

    const removedRow = db.prepare('SELECT id FROM files WHERE path = ?').get('src/unique.mjs');
    unlinkSync(join(dir, 'src/unique.mjs'));

    const second = indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    assert.equal(second.changed, 1);
    assert.equal(second.removed, 1);
    assert.equal(second.unchanged, 1);
    assert.equal(second.added, 0);

    const a = db.prepare('SELECT hash FROM files WHERE path = ?').get('src/a.mjs');
    assert.equal(a.hash, sha256File(target));
    const gone = db.prepare('SELECT id FROM files WHERE path = ?').get('src/unique.mjs');
    assert.equal(gone, undefined);
    assert.equal(count(db, 'SELECT count(*) AS c FROM content_fts WHERE rowid = ?', removedRow.id), 0);
    const hits = db.prepare('SELECT path FROM content_fts WHERE content_fts MATCH ?').all('zzzuniquetoken');
    assert.equal(hits.length, 0);
    assert.equal(db.prepare('SELECT file_count FROM projects WHERE name = ?').get('demo').file_count, 2);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveImport: relative literal, extension, index, bare package, external', () => {
  const demo = fixture({
    'src/a.mjs': 'import "./b.mjs";\n',
    'src/b.mjs': 'export const b = 1;\n',
    'src/mod/index.ts': 'export const mod = 1;\n',
  });
  const lib = fixture({
    'package.json': JSON.stringify({ name: '@acme/core', main: 'index.mjs' }),
    'index.mjs': 'export const core = 1;\n',
  });
  const db = openMemoryDb();
  try {
    indexProject({ root: demo, db, project: { name: 'demo', path: demo } });
    indexProject({ root: lib, db, project: { name: 'libpkg', path: lib } });

    const demoId = db.prepare('SELECT id FROM projects WHERE name = ?').get('demo').id;
    const libId = db.prepare('SELECT id FROM projects WHERE name = ?').get('libpkg').id;
    const fileIndex = new Map(
      db.prepare('SELECT path, id FROM files WHERE project_id = ?').all(demoId).map((r) => [r.path, r.id]),
    );
    const importer = { path: 'src/a.mjs' };
    const bId = fileIndex.get('src/b.mjs');
    const modId = fileIndex.get('src/mod/index.ts');
    assert.ok(bId && modId);

    assert.deepEqual(
      resolveImport({ db, projectId: demoId, file: importer, specifier: './b.mjs', fileIndex }),
      { file_id: bId, project_id: null, kind: 'file' },
    );
    assert.deepEqual(
      resolveImport({ db, projectId: demoId, file: importer, specifier: './b', fileIndex }),
      { file_id: bId, project_id: null, kind: 'file' },
    );
    assert.deepEqual(
      resolveImport({ db, projectId: demoId, file: importer, specifier: './mod', fileIndex }),
      { file_id: modId, project_id: null, kind: 'file' },
    );
    assert.deepEqual(
      resolveImport({ db, projectId: demoId, file: importer, specifier: 'libpkg', fileIndex }),
      { file_id: null, project_id: libId, kind: 'project' },
    );
    assert.deepEqual(
      resolveImport({ db, projectId: demoId, file: importer, specifier: '@acme/core', fileIndex }),
      { file_id: null, project_id: libId, kind: 'project' },
    );
    assert.deepEqual(
      resolveImport({ db, projectId: demoId, file: importer, specifier: 'react', fileIndex }),
      { file_id: null, project_id: null, kind: 'external' },
    );
    assert.deepEqual(
      resolveImport({ db, projectId: demoId, file: importer, specifier: '../../../etc/passwd', fileIndex }),
      { file_id: null, project_id: null, kind: 'external' },
    );
  } finally {
    db.close();
    rmSync(demo, { recursive: true, force: true });
    rmSync(lib, { recursive: true, force: true });
  }
});

test('an unreadable file lands in errors without aborting the project', () => {
  const dir = fixture({
    'ok.mjs': 'export const fine = true;\n',
    'broken.mjs': 'export const broken = true;\n',
  });
  const db = openMemoryDb();
  try {
    const res = indexProject({
      root: dir,
      db,
      project: { name: 'demo', path: dir },
      options: {
        // Test seam: deterministic cross-platform stand-in for EACCES.
        readFile: (abs) => {
          if (abs.endsWith('broken.mjs')) throw new Error('EACCES: permission denied');
          return readFileSync(abs);
        },
      },
    });
    assert.equal(res.added, 1);
    assert.equal(res.errors.length, 1);
    assert.equal(res.errors[0].project, 'demo');
    assert.equal(res.errors[0].path, 'broken.mjs');
    assert.match(res.errors[0].message, /EACCES/);
    assert.equal(db.prepare('SELECT count(*) AS c FROM files WHERE path = ?').get('broken.mjs').c, 0);
    assert.equal(db.prepare('SELECT count(*) AS c FROM files WHERE path = ?').get('ok.mjs').c, 1);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

function failingDb(db, { match, failOn }) {
  let calls = 0;
  return new Proxy(db, {
    get(target, prop) {
      if (prop === 'prepare') {
        return (sql) => {
          const stmt = target.prepare(sql);
          if (!String(sql).includes(match)) return stmt;
          return new Proxy(stmt, {
            get(inner, key) {
              if (key === 'run') {
                return (...args) => {
                  calls++;
                  if (calls === failOn) throw new Error('injected write failure');
                  return inner.run(...args);
                };
              }
              const value = inner[key];
              return typeof value === 'function' ? value.bind(inner) : value;
            },
          });
        };
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

test('a failed write rolls back the whole project transaction', () => {
  const dir = fixture({
    'a.mjs': 'const alpha = 1;\n',
    'b.mjs': 'const bravo = 2;\n',
  });
  const db = openMemoryDb();
  try {
    indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    const before = db.prepare('SELECT path, hash FROM files ORDER BY path').all();
    const beforeFts = db.prepare('SELECT rowid, content FROM content_fts ORDER BY rowid').all();
    assert.equal(before.length, 2);

    writeFileSync(join(dir, 'a.mjs'), 'const alpha = 111111;\n', 'utf8');
    writeFileSync(join(dir, 'b.mjs'), 'const bravo = 222222;\n', 'utf8');

    const broken = failingDb(db, { match: 'INSERT INTO content_fts', failOn: 2 });
    assert.throws(
      () => indexProject({ root: dir, db: broken, project: { name: 'demo', path: dir } }),
      /injected write failure/,
    );

    const after = db.prepare('SELECT path, hash FROM files ORDER BY path').all();
    assert.deepEqual(after, before);
    assert.deepEqual(db.prepare('SELECT rowid, content FROM content_fts ORDER BY rowid').all(), beforeFts);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('annotations rows are replaced transactionally and counted', () => {
  const dir = fixture({ 'a.mjs': '// @hq:context demo\nconst a = 1;\n' });
  const db = openMemoryDb();
  try {
    // Lane A's extractAnnotations may still be a stub; inject a deterministic
    // extractor so the indexer's write/replace path is covered either way.
    const extractors = (annotations) => ({
      extractAnnotations: () => annotations,
    });

    const first = indexProject({
      root: dir, db, project: { name: 'demo', path: dir },
      options: { extractors: extractors([
        { line: 1, kind: 'context', text: 'first', owner: null, ref: null },
        { line: 1, kind: 'why', text: 'second', owner: 'alice', ref: 'src/a.mjs:1' },
      ]) },
    });
    assert.equal(first.annotations, 2);
    assert.equal(db.prepare('SELECT count(*) AS c FROM annotations').get().c, 2);

    const second = indexProject({
      root: dir, db, project: { name: 'demo', path: dir },
      options: { force: true, extractors: extractors([]) },
    });
    assert.equal(second.annotations, 0);
    assert.equal(db.prepare('SELECT count(*) AS c FROM annotations').get().c, 0);

    const third = indexProject({
      root: dir, db, project: { name: 'demo', path: dir },
      options: { force: true, extractors: extractors([{ line: 1, kind: 'todo', text: 'only', owner: null, ref: null }]) },
    });
    assert.equal(third.annotations, 1);
    const rows = db.prepare('SELECT kind, text FROM annotations').all()
      .map((r) => ({ kind: r.kind, text: r.text }));
    assert.deepEqual(rows, [{ kind: 'todo', text: 'only' }]);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('indexWorkspace aggregates projects and totals', () => {
  const alpha = fixture({ 'a.mjs': 'const a = 1;\n' });
  const beta = fixture({ 'b.mjs': 'const b = 2;\n', 'c.md': '# C\n' });
  const db = openMemoryDb();
  try {
    const res = indexWorkspace({
      root: tmpdir(),
      db,
      projects: [
        { name: 'alpha', path: alpha },
        { name: 'beta', path: beta },
      ],
    });
    assert.equal(res.errors.length, 0);
    assert.deepEqual(res.projects.map((p) => p.name), ['alpha', 'beta']);
    assert.deepEqual(res.projects.map((p) => p.added), [1, 2]);
    assert.equal(res.totals.files, 3);
    assert.equal(res.totals.symbols, 2);
    assert.equal(res.totals.imports, 0);
    assert.equal(res.totals.annotations, 0);
    assert.equal(res.totals.errors, 0);

    const again = indexWorkspace({
      root: tmpdir(),
      db,
      projects: [{ name: 'alpha', path: alpha }, { name: 'beta', path: beta }],
    });
    assert.deepEqual(again.projects.map((p) => p.unchanged), [1, 2]);
    assert.equal(again.totals.files, 3);
  } finally {
    db.close();
    rmSync(alpha, { recursive: true, force: true });
    rmSync(beta, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Zero-delta reindex must not bump indexed_at (Z.ai R2 regression fixture)
// ---------------------------------------------------------------------------
// The project wiki pages embed projects.indexed_at. An unconditional bump on
// a no-op reindex (watcher catch-up on an already-current tree) churned those
// pages while the zero-delta watch path schedules no wiki settle — wiki
// --check then failed after every watcher restart.

test('a zero-delta reindex leaves indexed_at untouched; real changes bump it', () => {
  const dir = fixture({
    'src/app.mjs': 'export const quantumBadger = 1;\n',
  });
  const db = openMemoryDb();
  try {
    indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    // Pin a recognizable sentinel timestamp, then reindex the unchanged tree.
    db.prepare("UPDATE projects SET indexed_at = '2001-01-01T00:00:00.000Z' WHERE name = 'demo'").run();
    const noop = indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    assert.equal(noop.added + noop.changed + noop.removed, 0);
    let row = db.prepare('SELECT indexed_at FROM projects WHERE name = ?').get('demo');
    assert.equal(row.indexed_at, '2001-01-01T00:00:00.000Z', 'no-op reindex does not bump indexed_at');

    // A real content change must bump it again.
    writeFileSync(join(dir, 'src/app.mjs'), 'export const quantumBadger = 2;\n', 'utf8');
    const changed = indexProject({ root: dir, db, project: { name: 'demo', path: dir } });
    assert.equal(changed.changed, 1);
    row = db.prepare('SELECT indexed_at FROM projects WHERE name = ?').get('demo');
    assert.notEqual(row.indexed_at, '2001-01-01T00:00:00.000Z', 'a real change bumps indexed_at');
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});


test('Rust import resolution refuses ambiguous module layouts and ancestors', () => {
  const files = new Map([['src/lib.rs',1],['src/feature.rs',2],['src/feature/mod.rs',3],['src/feature/deep.rs',4]]);
  const query = (specifier,importKind='use') => resolveImport({file:'src/lib.rs',specifier,importerLang:'rust',importKind,fileIndex:files});
  assert.equal(query('feature','mod').file_id,null);
  assert.equal(query('crate::feature::deep::run').file_id,null);
  files.delete('src/feature.rs');
  assert.equal(query('feature','mod').file_id,3);
  assert.equal(query('crate::feature::deep::run').file_id,4);
});

test('Rust reindex removes stale resolved imports on module collision and restores them on deletion', () => {
  const dir=fixture({'src/lib.rs':'pub mod feature;\n','src/feature.rs':'pub fn run() {}\n'});
  const db=openMemoryDb();
  const run=()=>indexProject({root:dir,db,project:{name:'rust-layout',path:dir},options:{useGit:false}});
  const target=()=>db.prepare("SELECT f.path AS path FROM imports i LEFT JOIN files f ON i.resolved_file_id=f.id WHERE i.specifier='feature'").get()?.path;
  try{
    assert.equal(run().errors.length,0);assert.equal(target(),'src/feature.rs');
    mkdirSync(join(dir,'src/feature'),{recursive:true});
    writeFileSync(join(dir,'src/feature/mod.rs'),'pub fn run() {}\n');
    assert.equal(run().errors.length,0);assert.equal(target(),null);
    unlinkSync(join(dir,'src/feature/mod.rs'));
    assert.equal(run().errors.length,0);assert.equal(target(),'src/feature.rs');
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
