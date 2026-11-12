// hq/test/capabilities.test.mjs — capability registry: scan, persist, search, map, contracts, export.
import { afterAll, test } from 'bun:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openMemoryDb } from '../lib/schema.mjs';
import {
  CAPABILITY_REGISTRY_SCHEMA,
  capabilityStatus,
  exportCapabilityJson,
  exportCapabilitySqlite,
  listCapabilityContracts,
  loadContracts,
  loadTaxonomy,
  persistCapabilityScan,
  scanCapabilitySource,
  searchCapabilityDocuments,
} from '../lib/capabilities.mjs';

const AT_EARLY = '2026-01-01T00:00:00.000Z';
const AT_LATE = '2026-06-01T00:00:00.000Z';
const SOURCE_ID = 'fixture-source';

// Temp fixture directories that are still on disk.
const TEMP_DIRS = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Remove a temp fixture directory deterministically.
 *
 * `rmSync({ maxRetries, retryDelay })` does not work under Bun for the EBUSY case:
 * Bun releases a SQLite file handle in the finalizer rather than inside `close()`, so
 * the directory is still locked when the synchronous retry budget runs out and the
 * fixture leaks on every run. Force the collection, then retry across rounds that
 * yield to the event loop so the pending finalizer can actually run before the next
 * attempt. A leftover temp directory must never fail the suite, and a locked fixture
 * must never leak silently.
 *
 * @param {string} dir absolute path of the directory to remove
 * @returns {Promise<boolean>} true when the directory is gone
 */
async function removeTempDir(dir) {
  TEMP_DIRS.add(dir);
  for (let round = 0; round < 60; round += 1) {
    if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') Bun.gc(true);
    try {
      rmSync(dir, { recursive: true, force: true });
      // rmSync can report success while the directory is still locked, so verify.
      if (!existsSync(dir)) {
        TEMP_DIRS.delete(dir);
        return true;
      }
    } catch { /* the handle is still held; try again on the next round */ }
    await sleep(25);
  }
  return false;
}

// A last sweep for anything a test left behind: the per-fixture cleanup owns the
// normal path, this one turns a remaining directory into a visible failure instead of
// a silent leak.
afterAll(async () => {
  const leftovers = [];
  for (const dir of [...TEMP_DIRS]) {
    if (!await removeTempDir(dir)) leftovers.push(dir);
  }
  if (leftovers.length) {
    throw new Error(`temp fixture cleanup failed for: ${leftovers.join(', ')}`);
  }
});

// A minimal npm v3 tree: one package with a nested dependency, a README, source,
// a secret file that must never be indexed, and a manifest field this schema does
// not know about (it must survive verbatim in `manifest`).
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'hq-capability-'));
  TEMP_DIRS.add(root);
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };
  write('package-lock.json', JSON.stringify({
    name: 'fixture-root',
    version: '1.0.0',
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': { name: 'fixture-root', version: '1.0.0', dependencies: { a: '^1.0.0' } },
      'node_modules/a': { version: '1.2.3', license: 'MIT', integrity: 'sha512-aaa', dependencies: { b: '^2.0.0' } },
      'node_modules/a/node_modules/b': { version: '2.0.0', license: 'ISC', integrity: 'sha512-bbb' },
    },
  }, null, 2));
  write('node_modules/a/package.json', JSON.stringify({
    name: 'a',
    version: '1.2.3',
    description: 'Glob pattern matcher for fixture paths',
    main: 'index.js',
    license: 'MIT',
    keywords: ['glob', 'pattern'],
    dependencies: { b: '^2.0.0' },
    'x-unknown-field': { keep: 'verbatim' },
  }, null, 2));
  write('node_modules/a/README.md', '# Package A\n\nA fixture package that demonstrates glob pattern matching across directories.\n');
  write('node_modules/a/index.js', "const glob = require('glob');\nmodule.exports = { glob };\n");
  write('node_modules/a/.env', 'SECRET_TOKEN=do-not-index\n');
  write('node_modules/a/node_modules/b/package.json', JSON.stringify({
    name: 'b', version: '2.0.0', license: 'ISC', description: 'Nested dependency',
  }, null, 2));
  return root;
}

async function withFixture(fn) {
  const root = fixture();
  try { return await fn(root); } finally { await removeTempDir(root); }
}

const scan = (root, now = AT_EARLY) => scanCapabilitySource(root, {
  id: SOURCE_ID, now, taxonomy: loadTaxonomy(), contracts: loadContracts(),
});

const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;

test('scan counts packages, files and docs; excludes secrets; preserves unknown manifest fields', () => withFixture((root) => {
  const result = scan(root);

  assert.equal(result.source.id, SOURCE_ID);
  assert.equal(result.source.packageManager, 'npm');
  assert.equal(result.source.lockfile, 'package-lock.json');
  assert.equal(result.packages.length, 2);
  assert.deepEqual(result.packages.map((p) => p.name), ['a', 'b']);

  // a: package.json + README.md + index.js; b: package.json. The .env is excluded.
  assert.equal(result.files.length, 4);
  assert.equal(result.documents.length, 1);
  assert.ok(result.files.every((f) => !f.path.endsWith('.env')));
  assert.ok(result.files.every((f) => !f.path.startsWith('.env')));
  assert.ok(result.documents.every((d) => !d.path.endsWith('.env')));
  assert.equal(result.source.fileCount, 4);
  assert.equal(result.source.documentCount, 1);

  const readme = result.documents[0];
  assert.equal(readme.path, 'node_modules/a/README.md');
  assert.equal(readme.title, 'Package A');
  assert.match(readme.body, /demonstrates glob pattern matching/);
  assert.equal(readme.kind, 'docs');

  const pkgA = result.packages.find((p) => p.name === 'a');
  assert.equal(pkgA.version, '1.2.3');
  assert.equal(pkgA.license, 'MIT');
  assert.equal(pkgA.fileCount, 3);
  assert.equal(pkgA.main, 'index.js');
  assert.ok(pkgA.manifest, 'manifest JSON is retained');
  assert.deepEqual(JSON.parse(pkgA.manifest)['x-unknown-field'], { keep: 'verbatim' });
  assert.match(pkgA.manifestDigest, /^[0-9a-f]{64}$/);
  assert.equal(pkgA.manifestFields, Object.keys(JSON.parse(pkgA.manifest)).length);

  // a -> b runtime edge resolves to the nested copy.
  const edge = result.dependencies.find((d) => d.fromPath === 'node_modules/a' && d.toName === 'b');
  assert.ok(edge);
  assert.equal(edge.kind, 'runtime');
  assert.equal(edge.resolvedVersion, '2.0.0');
  assert.ok(result.evidence.length > 0);
}));

test('scan is deterministic across different now values', () => withFixture((root) => {
  const first = scan(root, AT_EARLY);
  const second = scan(root, AT_LATE);
  assert.equal(first.source.digest, second.source.digest);
  assert.equal(first.source.scannedAt, AT_EARLY);
  assert.equal(second.source.scannedAt, AT_LATE);
  assert.deepEqual(first.packages.map((p) => p.manifestDigest), second.packages.map((p) => p.manifestDigest));
  assert.deepEqual(first.documents.map((d) => d.sha256), second.documents.map((d) => d.sha256));
}));

test('persist is idempotent: re-persisting leaves row and FTS counts unchanged', () => withFixture((root) => {
  const db = openMemoryDb();
  try {
    const first = persistCapabilityScan(db, scan(root, AT_EARLY));
    assert.equal(first.sourceId, SOURCE_ID);
    assert.equal(first.packages, 2);
    assert.equal(first.files, 4);
    assert.equal(first.documents, 1);
    assert.equal(first.contracts, 16);

    const tables = ['capability_source', 'capability_package', 'capability_dependency', 'capability_file',
      'capability_document', 'capability_evidence', 'capability_map', 'capability_contract'];
    const before = Object.fromEntries(tables.map((t) => [t, count(db, t)]));
    const ftsBefore = [count(db, 'capability_document_fts'), count(db, 'capability_package_fts')];
    assert.deepEqual(before, {
      capability_source: 1,
      capability_package: 2,
      capability_dependency: 1,
      capability_file: 4,
      capability_document: 1,
      capability_evidence: first.evidence,
      capability_map: first.maps,
      capability_contract: 16,
    });
    assert.deepEqual(ftsBefore, [1, 2]);

    const second = persistCapabilityScan(db, scan(root, AT_LATE));
    assert.equal(second.digest, first.digest);
    const after = Object.fromEntries(tables.map((t) => [t, count(db, t)]));
    assert.deepEqual(after, before);
    assert.deepEqual([count(db, 'capability_document_fts'), count(db, 'capability_package_fts')], ftsBefore);

    const status = capabilityStatus(db);
    assert.equal(status.schema, CAPABILITY_REGISTRY_SCHEMA);
    assert.equal(status.sources, 1);
    assert.equal(status.counts.packages, 2);
    assert.equal(status.counts.files, 4);
    assert.equal(status.counts.documents, 1);
    assert.equal(status.counts.contracts, 16);
    assert.equal(status.counts.proposed, 16);
    assert.equal(status.counts.approved, 0);
  } finally { db.close(); }
}));

test('FTS search returns the README body', () => withFixture((root) => {
  const db = openMemoryDb();
  try {
    persistCapabilityScan(db, scan(root));
    const hits = searchCapabilityDocuments(db, { query: 'demonstrates' });
    assert.equal(hits.length, 1);
    assert.equal(hits[0].sourceId, SOURCE_ID);
    assert.equal(hits[0].path, 'node_modules/a/README.md');
    assert.equal(hits[0].title, 'Package A');
    assert.match(hits[0].snippet, /demonstrates/);

    const glob = searchCapabilityDocuments(db, { query: 'glob pattern' });
    assert.ok(glob.some((h) => h.path === 'node_modules/a/README.md'));
    assert.deepEqual(searchCapabilityDocuments(db, { query: '   ' }), []);
  } finally { db.close(); }
}));

test('mapping yields candidates with reasons; all 16 contracts are proposed and unconfirmed', () => withFixture((root) => {
  const result = scan(root);
  assert.ok(result.maps.length >= 1, 'at least one candidate mapping');
  const glob = result.maps.find((m) => m.nodeId === 'discovery.glob' && m.installPath === 'node_modules/a');
  assert.ok(glob, 'glob package maps to discovery.glob');
  assert.ok(glob.score >= 2.5);
  assert.ok(glob.reasons.some((r) => r.startsWith('keyword:')), 'keyword reason recorded');
  assert.equal(glob.status, 'candidate');
  assert.equal(glob.authority, 'candidate');

  assert.equal(result.contracts.length, 16);
  assert.ok(result.contracts.every((c) => c.status === 'proposed'));
  assert.ok(result.contracts.every((c) => c.ownerConfirmed === 0));
  const mapped = result.contracts.filter((c) => c.installPath !== null);
  assert.ok(mapped.length >= 1, 'at least one contract carries a source mapping');
  assert.ok(mapped.every((c) => c.sourceId === SOURCE_ID));

  const db = openMemoryDb();
  try {
    persistCapabilityScan(db, result);
    const rows = listCapabilityContracts(db, { status: 'proposed' });
    assert.equal(rows.length, 16);
    assert.equal(rows.filter((r) => r.owner_confirmed === 1).length, 0);
    assert.ok(rows.every((r) => Array.isArray(r.effects) && Array.isArray(r.scopes)));
  } finally { db.close(); }
}));

test('exportCapabilityJson returns the full registry shape', () => withFixture((root) => {
  const db = openMemoryDb();
  try {
    persistCapabilityScan(db, scan(root));
    const exported = exportCapabilityJson(db, { sourceId: SOURCE_ID });
    assert.equal(exported.schema, CAPABILITY_REGISTRY_SCHEMA);
    assert.equal(exported.source.id, SOURCE_ID);
    assert.equal(exported.packages.length, 2);
    assert.equal(exported.files.length, 4);
    assert.equal(exported.documents.length, 1);
    assert.equal(exported.dependencies.length, 1);
    // Source-scoped export keeps only contracts mapped to this source; the full
    // export still carries every proposed registry contract.
    assert.equal(exported.contracts.length, 1);
    assert.ok(exported.contracts.every((c) => c.source_id === SOURCE_ID));
    assert.equal(exported.nodes.length, 26);
    assert.ok(exported.maps.length >= 1);
    assert.ok(exported.evidence.length > 0);
    for (const key of ['packages', 'dependencies', 'files', 'documents', 'evidence', 'nodes', 'maps', 'contracts']) {
      assert.ok(Array.isArray(exported[key]), `${key} is an array`);
    }
    // Per-source export must not leak another source's rows.
    assert.ok(exported.packages.every((p) => p.source_id === SOURCE_ID));

    const full = exportCapabilityJson(db);
    assert.equal(full.source.length, 1);
    assert.equal(full.contracts.length, 16);
    assert.equal(full.packages.length, 2);
  } finally { db.close(); }
}));

// The export DB lives in its own directory so a lingering handle never fails the
// fixture; the directory is removed by the deterministic cleanup above.
function exportDir() {
  const dir = mkdtempSync(join(tmpdir(), 'hq-capability-export-'));
  TEMP_DIRS.add(dir);
  return { dir, cleanup: () => removeTempDir(dir) };
}

test('exportCapabilitySqlite writes a readable standalone database', () => withFixture(async (root) => {
  const db = openMemoryDb();
  const out = exportDir();
  const target = join(out.dir, 'capability-export.db');
  try {
    persistCapabilityScan(db, scan(root));
    const result = exportCapabilitySqlite(db, { path: target, sourceId: SOURCE_ID });
    assert.equal(result.path, target);
    assert.equal(result.packages, 2);
    assert.equal(result.documents, 1);

    const exported = new DatabaseSync(target);
    try {
      assert.equal(exported.prepare('SELECT COUNT(*) AS n FROM capability_package').get().n, 2);
      assert.equal(exported.prepare('SELECT COUNT(*) AS n FROM capability_document').get().n, 1);
      assert.equal(exported.prepare('SELECT COUNT(*) AS n FROM capability_document_fts').get().n, 1);
      assert.equal(exported.prepare('SELECT COUNT(*) AS n FROM capability_contract').get().n, 1);
      assert.equal(exported.prepare('SELECT COUNT(*) AS n FROM capability_source').get().n, 1);
      assert.equal(exported.prepare("SELECT value FROM meta WHERE key = 'capability_export'").get().value.length > 0, true);
    } finally { exported.close(); }
  } finally { db.close(); await out.cleanup(); }
}));

// Export used one autocommit per row, which timed out on the real 625-package
// tree. This fixture is large enough that the round trip must stay batched:
// MEMORY journal + synchronous OFF + a single target transaction.
function largeFixture(packageCount) {
  const root = mkdtempSync(join(tmpdir(), 'hq-capability-large-'));
  TEMP_DIRS.add(root);
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };
  const lockPackages = { '': { name: 'large-root', version: '1.0.0' } };
  for (let i = 0; i < packageCount; i++) {
    // One taxonomy-matching package gives the export at least one mapped contract.
    const name = i === 0 ? 'fixture-glob' : `fixture-pkg-${i}`;
    const installPath = `node_modules/${name}`;
    const description = i === 0 ? 'Glob pattern matching fixture' : 'Generated dependency fixture';
    lockPackages[installPath] = { version: '1.0.0', license: 'MIT' };
    write(`${installPath}/package.json`, JSON.stringify({ name, version: '1.0.0', license: 'MIT', description, main: 'index.js' }));
    write(`${installPath}/index.js`, 'module.exports = {};\n');
    write(`${installPath}/README.md`, `# ${name}\n\nGenerated fixture package number ${i} used to prove export scale.\n`);
  }
  write('package-lock.json', JSON.stringify({ name: 'large-root', version: '1.0.0', lockfileVersion: 3, requires: true, packages: lockPackages }, null, 2));
  return root;
}

test('exportCapabilitySqlite completes a large source without timing out and matches row counts', async () => {
  const PACKAGE_COUNT = 300;
  const root = largeFixture(PACKAGE_COUNT);
  const db = openMemoryDb();
  const out = exportDir();
  const target = join(out.dir, 'capability-large-export.db');
  try {
    persistCapabilityScan(db, scan(root));
    const before = db.prepare('SELECT COUNT(*) AS n FROM capability_package WHERE source_id = ?').get(SOURCE_ID).n;
    assert.equal(before, PACKAGE_COUNT);

    const started = performance.now();
    const result = exportCapabilitySqlite(db, { path: target, sourceId: SOURCE_ID });
    const elapsed = performance.now() - started;
    assert.equal(result.packages, PACKAGE_COUNT);
    assert.equal(result.documents, PACKAGE_COUNT);
    assert.ok(elapsed < 20000, `export took ${Math.round(elapsed)}ms`);

    const exported = new DatabaseSync(target);
    try {
      for (const table of ['capability_source', 'capability_package', 'capability_dependency', 'capability_file',
        'capability_document', 'capability_evidence', 'capability_map', 'capability_contract']) {
        const key = table === 'capability_source' ? 'id' : 'source_id';
        const expected = db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${key} = ?`).get(SOURCE_ID).n;
        assert.equal(count(exported, table), expected, `${table} rows match`);
      }
      assert.equal(count(exported, 'capability_node'), 26);
      assert.equal(count(exported, 'capability_document_fts'), count(exported, 'capability_document'));
      assert.equal(count(exported, 'capability_package_fts'), count(exported, 'capability_package'));
      assert.equal(count(exported, 'capability_package'), PACKAGE_COUNT);
      assert.ok(count(exported, 'capability_map') >= 1);
    } finally { exported.close(); }
  } finally { db.close(); await out.cleanup(); await removeTempDir(root); }
}, 60000);

test('missing root throws a capability root error', () => withFixture((root) => {
  const missing = join(root, 'does-not-exist');
  assert.throws(() => scanCapabilitySource(missing), /capability root not found/);
}));
