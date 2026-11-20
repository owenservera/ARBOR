// hq/test/revision-cache-projection.test.mjs — the revision cache lifecycle as the
// owned HQ capabilities see it: annotation v2 is the source of a semantic anchor,
// freshness decides what the bounded walk could not see, and both feed the one
// scoped projection the native graph consumes.
//
// @hq:context A registered source change must reach the native graph as an update
//   of the SAME identity, and a deletion as a tombstone of that exact former
//   identity. A path the bounded walk could not see is not a deletion.
// @hq:invariant The active `.hq/index.db` is never touched: every database is
//   in-memory and every fixture lives under a disposable temp directory.
// @hq:invariant No second graph, journal or parser: the projection is read from the
//   existing index and published through the incumbent exchange (hq/lib/kg-export.mjs).
// @hq:see hq/lib/annotation-v2.mjs · hq/lib/freshness.mjs · hq/lib/indexer.mjs
// @hq:see hq/lib/semantic-registry.mjs · hq/lib/kg-export.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import { indexedSemanticAnchors } from '../lib/semantic-registry.mjs';
import { parseAnnotationV2 } from '../lib/annotation-v2.mjs';
import { collectStaleFiles } from '../lib/freshness.mjs';
import { acknowledgeGraphExport, exportGraphExchange } from '../lib/kg-export.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CAP = 'demo.cap@1';
const ONE = `/** @hq:capability ${CAP} */\nexport const alpha = 1;\n`;
const ONE_EDITED = `/** @hq:capability ${CAP} */\nexport const alpha = 2;\nexport const beta = 3;\n`;

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'hq-revision-projection-'));
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
    anchors: (path = 'src/one.mjs') => {
      const row = db.prepare('SELECT id, path, hash FROM files WHERE path = ?').get(path);
      return row ? indexedSemanticAnchors(db, { fileId: row.id, project: 'demo', path: row.path, hash: row.hash }) : [];
    },
    close: () => db.close(),
  };
}

/** Publish the incumbent exchange and return its parsed rows. */
function exchangeRows(db, root) {
  const dir = join(root, '.hq');
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'kg-exchange.jsonl');
  const statePath = join(dir, 'kg-export-state.json');
  const exported = exportGraphExchange({ db, outPath, statePath });
  const text = readFileSync(outPath, 'utf8');
  const eol = text.indexOf('\n');
  const rows = text.slice(eol + 1).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return { exported, statePath, rows };
}

function nativeBin(name) {
  const exts = process.platform === 'win32' ? ['.exe', ''] : ['', '.exe'];
  const dirs = [
    process.env.VIVIM_HQKG_BIN_DIR,
    join(REPO, 'target', 'debug'),
    join(REPO, 'target', 'release'),
    join(REPO, 'native', 'hqkg', 'target', 'debug'),
    join(REPO, 'native', 'hqkg', 'target', 'release'),
  ].filter(Boolean);
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = join(dir, name + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// annotation v2 is the source of the anchor, and its revision is the fence
// ---------------------------------------------------------------------------

test('the annotation v2 record is what the semantic anchor is keyed on', () => {
  const parsed = parseAnnotationV2(ONE, { projectId: '1', path: 'src/one.mjs', contentHash: 'h1' });
  assert.deepEqual(parsed.diagnostics, [], 'a registered capability parses clean');
  const [record] = parsed.records;
  assert.equal(record.kind, 'capability');
  assert.equal(record.value, CAP);
  assert.equal(record.contentHash, 'h1', 'the record carries the revision it was read at');

  const f = fixture({ 'src/one.mjs': ONE });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    const [anchor] = index.anchors();
    assert.ok(anchor, 'the parsed capability becomes a semantic anchor');
    assert.equal(anchor.semanticId, CAP, 'the anchor identity is the registered capability id');
    assert.equal(anchor.state, 'indexed');
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a source change and its tombstone appear in a native graph query under one stable identity', (t) => {
  const importer = nativeBin('hqkg-import');
  const query = nativeBin('hqkg');
  if (!importer || !query) {
    t.skip('native hqkg importer not built (set VIVIM_HQKG_BIN_DIR to run this check)');
    return;
  }
  const f = fixture({ 'src/one.mjs': ONE });
  const index = openIndex(f.root, f.project);
  const journal = join(f.root, 'graph.hqj');
  try {
    index.run();
    const [before] = index.anchors();
    const first = exchangeRows(index.db, f.root);
    const firstOut = execFileSync(importer, [journal, join(f.root, '.hq', 'kg-exchange.jsonl')], { encoding: 'utf8' });
    acknowledgeGraphExport({ statePath: first.statePath, digest: first.exported.digest, acknowledgment: {} });
    const firstNode = first.rows.find((row) => row.type === 'node');
    assert.ok(firstNode, 'the source is published as a graph node');
    const nodeId = firstNode.id;
    assert.deepEqual(execFileSync(query, [journal, 'nodes'], { encoding: 'utf8' }).trim().split('\n').map((l) => l.split('\t')[0]), [nodeId]);

    // A registered source change: same identity, new revision, new content hash.
    writeFileSync(f.file('src/one.mjs'), ONE_EDITED, 'utf8');
    const second = index.run();
    assert.equal(second.changed, 1);
    const [after] = index.anchors();
    assert.equal(after.anchorId, before.anchorId, 'the anchor identity survives the edit');
    assert.notEqual(after.contentHash, before.contentHash, 'the content hash tracks the revision');

    const edited = exchangeRows(index.db, f.root);
    const editOut = execFileSync(importer, [journal, join(f.root, '.hq', 'kg-exchange.jsonl')], { encoding: 'utf8' });
    acknowledgeGraphExport({ statePath: edited.statePath, digest: edited.exported.digest, acknowledgment: {} });
    assert.match(editOut, /updated=1/, 'the change is an update, not a new node');
    const editedRows = execFileSync(query, [journal, 'nodes'], { encoding: 'utf8' }).trim().split('\n');
    assert.deepEqual(editedRows.map((line) => line.split('\t')[0]), [nodeId], 'one identity before and after');
    assert.equal(editedRows[0].split('\t')[3], 'v2', 'the graph revision advanced');

    // Deletion: a tombstone of that exact former identity, and no node left.
    rmSync(f.file('src/one.mjs'));
    const removed = index.run();
    assert.equal(removed.removed, 1);
    const deleted = exchangeRows(index.db, f.root);
    const delOut = execFileSync(importer, [journal, join(f.root, '.hq', 'kg-exchange.jsonl')], { encoding: 'utf8' });
    acknowledgeGraphExport({ statePath: deleted.statePath, digest: deleted.exported.digest, acknowledgment: {} });
    assert.match(delOut, /deleted=1/);
    assert.deepEqual(deleted.exported.tombstonedIds, [nodeId], 'the tombstone names the former identity');
    assert.deepEqual(execFileSync(query, [journal, 'nodes'], { encoding: 'utf8' }).trim(), '', 'no node survives the tombstone');
    assert.equal(firstOut.length > 0, true);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// freshness: a walk omission is not a deletion
// ---------------------------------------------------------------------------

test('freshness reports a source that outgrew the bounded walk as omitted, not deleted', () => {
  const body = `/** @hq:capability ${CAP} */\nexport const big = '${'x'.repeat(400)}';\n`;
  const f = fixture({ 'src/big.mjs': body });
  const index = openIndex(f.root, f.project);
  try {
    const first = index.run({ maxFileBytes: 100_000 });
    assert.equal(first.added, 1);
    const config = { maxFileBytes: 100, ignores: [] };
    const projects = [{ name: 'demo', path: f.project }];

    // The same file, now over the cap the walk is bounded by.
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

test('freshness stays quiet on an unchanged tree and names a real edit', async () => {
  const f = fixture({ 'src/one.mjs': ONE });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    const config = { maxFileBytes: 100_000, ignores: [] };
    const projects = [{ name: 'demo', path: f.project }];
    assert.deepEqual(await collectStaleFiles({ db: index.db, config, projects }), [], 'a current index is quiet');

    writeFileSync(f.file('src/one.mjs'), ONE_EDITED, 'utf8');
    const stale = await collectStaleFiles({ db: index.db, config, projects });
    assert.deepEqual(stale, [{ project: 'demo', path: 'src/one.mjs', reason: 'changed' }]);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});