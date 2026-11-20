// hq/test/revision-cache-lifecycle.test.mjs — the indexer's semantic delta as a
// scoped, revision-fenced projection the native graph can consume.
//
// @hq:context A registered source change must reach the native graph as an
//   update of the SAME identity, and a deletion as a tombstone of that exact
//   former identity. A path the bounded walk could not see is not a deletion.
// @hq:invariant The active `.hq/index.db` is never touched; every database is
//   in-memory and every fixture lives under a disposable temp directory.
// @hq:invariant No new graph, journal or parser: the projection is read from the
//   existing index and published through the incumbent exchange
//   (hq/lib/kg-export.mjs), which the native importer admits.
// @hq:see hq/lib/indexer.mjs · hq/lib/semantic-registry.mjs · hq/lib/kg-export.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import { indexedSemanticAnchors, semanticAnchorChanges } from '../lib/semantic-registry.mjs';
import { acknowledgeGraphExport, exportGraphExchange } from '../lib/kg-export.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CAP = 'demo.cap@1';

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'hq-revision-cache-'));
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

function exchangeRows(db, root) {
  const dir = join(root, '.hq');
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'kg-exchange.jsonl');
  const statePath = join(dir, 'kg-export-state.json');
  const exported = exportGraphExchange({ db, outPath, statePath });
  const text = readFileSync(outPath, 'utf8');
  const eol = text.indexOf('\n');
  const rows = text.slice(eol + 1).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return { exported, statePath, rows, text };
}

// ---------------------------------------------------------------------------
// Revisioned projection: stable identity, tombstone, no spurious invalidation
// ---------------------------------------------------------------------------

test('a registered source change updates one identity and carries its revision', () => {
  const f = fixture({ 'src/one.mjs': `/** @hq:capability ${CAP} */\nexport const alpha = 1;\n` });
  const index = openIndex(f.root, f.project);
  try {
    const first = index.run();
    assert.equal(first.errors.length, 0);
    const [before] = index.anchors();
    assert.ok(before, 'the capability annotation is indexed as an anchor');
    assert.equal(before.semanticId, CAP);
    assert.equal(before.state, 'indexed');
    const [added] = first.semanticChanges;
    assert.equal(added.change, 'added');
    assert.equal(added.anchorId, before.anchorId);

    writeFileSync(f.file('src/one.mjs'), `/** @hq:capability ${CAP} */\nexport const alpha = 2;\nexport const beta = 3;\n`, 'utf8');
    const second = index.run();
    assert.equal(second.changed, 1);
    assert.equal(second.semanticChangeComplete, true);

    const [after] = index.anchors();
    // Stable identity: the anchor id is a function of project/path/kind/id, never
    // of bytes or lines, so a content edit cannot mint a new identity.
    assert.equal(after.anchorId, before.anchorId, 'anchor identity survives the edit');
    assert.notEqual(after.fingerprint, before.fingerprint, 'the fingerprint tracks the revision');
    assert.notEqual(after.contentHash, before.contentHash);

    const [delta] = second.semanticChanges;
    assert.equal(delta.change, 'changed');
    assert.equal(delta.anchorId, before.anchorId);
    assert.equal(delta.previousFingerprint, before.fingerprint);
    assert.equal(delta.fingerprint, after.fingerprint);
    // The revision the delta was computed against travels with it, so a
    // revision-fenced native consumer never has to re-deriving the bytes.
    assert.equal(delta.previousContentHash, before.contentHash);
    assert.equal(delta.contentHash, after.contentHash);

    // The same identity is what the incumbent exchange publishes for the file.
    const { rows } = exchangeRows(index.db, f.root);
    const node = rows.find((row) => row.type === 'node' && row.metadata.source_path === 'demo/src/one.mjs');
    assert.ok(node);
    assert.match(node.id, /^hqg1:[a-f0-9]{64}$/);
    assert.equal(node.metadata.content_sha256, after.contentHash);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('unchanged anchors emit no change, so only dependent outputs invalidate', () => {
  const f = fixture({ 'src/one.mjs': `/** @hq:capability ${CAP} */\nexport const alpha = 1;\n` });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    const again = index.run();
    assert.equal(again.unchanged, 1);
    assert.deepEqual(again.semanticChanges, [], 'a no-op reindex invalidates nothing');
    assert.equal(again.semanticChangeComplete, true);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('deleting a registered source tombstones the exact former anchor identity', () => {
  const f = fixture({ 'src/one.mjs': `/** @hq:capability ${CAP} */\nexport const alpha = 1;\n` });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    const [before] = index.anchors();
    const first = exchangeRows(index.db, f.root);
    assert.equal(first.exported.stats.tombstones, 0);
    assert.equal(acknowledgeGraphExport({ statePath: first.statePath, digest: first.exported.digest, acknowledgment: {} }).acked, true);
    const nodeId = first.rows.find((row) => row.type === 'node').id;

    rmSync(f.file('src/one.mjs'));
    const removed = index.run();
    assert.equal(removed.removed, 1);
    assert.equal(removed.semanticChangeComplete, true);

    const [delta] = removed.semanticChanges;
    assert.equal(delta.change, 'removed');
    assert.equal(delta.anchorId, before.anchorId, 'the tombstone targets the former identity');
    assert.equal(delta.state, 'removed');
    assert.equal(delta.fingerprint, null);
    assert.equal(delta.contentHash, null);
    assert.equal(delta.previousFingerprint, before.fingerprint);
    assert.equal(delta.previousContentHash, before.contentHash);
    assert.deepEqual(index.anchors(), [], 'no anchor survives the deletion');

    // The incumbent exchange turns that into a graph tombstone for the same id.
    const after = exchangeRows(index.db, f.root);
    assert.equal(after.exported.stats.tombstones, 1);
    assert.deepEqual(after.exported.tombstonedIds, [nodeId]);
    const tombstone = after.rows.find((row) => row.type === 'tombstone');
    assert.equal(tombstone.id, nodeId, 'tombstone targets the exact former graph identity');
    assert.ok(!after.rows.some((row) => row.type === 'node' && row.metadata.source_path === 'demo/src/one.mjs'));
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// The bounded walk must never be mistaken for a deletion
// ---------------------------------------------------------------------------

test('a source the bounded walk omits is kept and reported incomplete, never tombstoned', () => {
  const body = `/** @hq:capability ${CAP} */\nexport const big = '${'x'.repeat(400)}';\n`;
  const f = fixture({ 'src/big.mjs': body });
  const index = openIndex(f.root, f.project);
  try {
    const first = index.run({ maxFileBytes: 100_000 });
    assert.equal(first.added, 1);
    assert.equal(first.semanticChangeComplete, true);
    const [before] = index.anchors('src/big.mjs');
    assert.ok(before);

    // The same file, now over the cap: the bounded walk silently drops it.
    const second = index.run({ maxFileBytes: 100 });
    assert.equal(second.removed, 0, 'an omitted file is not a deletion');
    assert.equal(second.incomplete.length, 1);
    assert.deepEqual(second.incomplete[0], { project: 'demo', path: 'src/big.mjs', reason: 'over_file_cap' });
    assert.equal(second.semanticChangeComplete, false, 'an incomplete scan is never published as complete');
    assert.deepEqual(second.semanticChanges, [], 'no tombstone is issued for a path the walk could not see');
    assert.equal(index.db.prepare('SELECT count(*) AS c FROM files').get().c, 1, 'the row survives');
    assert.deepEqual(index.anchors('src/big.mjs'), [before], 'its anchor identity is untouched');

    // A later complete scan is quiet again: nothing was lost, nothing to emit.
    const third = index.run({ maxFileBytes: 100_000 });
    assert.equal(third.removed, 0);
    assert.equal(third.unchanged, 1);
    assert.equal(third.semanticChangeComplete, true);
    assert.deepEqual(third.semanticChanges, []);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a deletion proven by the filesystem still tombstones when another path was omitted', () => {
  const f = fixture({
    'src/big.mjs': `/** @hq:capability ${CAP} */\nexport const big = '${'x'.repeat(400)}';\n`,
    'src/doomed.mjs': `/** @hq:capability demo.doomed@1 */\nexport const doomed = 1;\n`,
  });
  const index = openIndex(f.root, f.project);
  try {
    index.run({ maxFileBytes: 100_000 });
    const [doomedAnchor] = index.anchors('src/doomed.mjs');
    assert.ok(doomedAnchor);

    rmSync(f.file('src/doomed.mjs'));
    const run = index.run({ maxFileBytes: 100 });
    assert.equal(run.removed, 1, 'the missing path is deleted from the index');
    assert.deepEqual(run.incomplete.map((item) => item.path), ['src/big.mjs']);
    const delta = run.semanticChanges.find((change) => change.path === 'src/doomed.mjs');
    assert.ok(delta, 'absence from disk is proof, so its tombstone is still emitted');
    assert.equal(delta.change, 'removed');
    assert.equal(delta.anchorId, doomedAnchor.anchorId);
    assert.ok(!run.semanticChanges.some((change) => change.path === 'src/big.mjs'));
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// semanticAnchorChanges contract
// ---------------------------------------------------------------------------

test('semanticAnchorChanges fails closed and never throws', () => {
  for (const bad of [null, undefined, 0, 'x', {}, [null], [{}], [{ anchorId: '' }]]) {
    assert.deepEqual(semanticAnchorChanges(bad, bad), []);
  }
  const anchors = [{ anchorId: 'a', semanticId: CAP, annotationKind: 'capability', fingerprint: 'f1', contentHash: 'h1', state: 'indexed' }];
  assert.deepEqual(semanticAnchorChanges(anchors, anchors), [], 'identical projections are a no-op');
  const [removed] = semanticAnchorChanges(anchors, []);
  assert.equal(removed.change, 'removed');
  assert.equal(removed.previousContentHash, 'h1');
  assert.equal(removed.contentHash, null);
});

// ---------------------------------------------------------------------------
// Native round-trip (skipped when the native importer is not built)
// ---------------------------------------------------------------------------

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

test('a source change and its tombstone appear in a native graph query', (t) => {
  const importer = nativeBin('hqkg-import');
  const query = nativeBin('hqkg');
  if (!importer || !query) {
    t.skip('native hqkg importer not built (set VIVIM_HQKG_BIN_DIR to run this check)');
    return;
  }
  const f = fixture({ 'src/one.mjs': `/** @hq:capability ${CAP} */\nexport const alpha = 1;\n` });
  const index = openIndex(f.root, f.project);
  try {
    index.run();
    const journal = join(f.root, 'graph.hqj');
    const run = () => {
      const { exported, statePath, rows } = exchangeRows(index.db, f.root);
      const out = execFileSync(importer, [journal, join(f.root, '.hq', 'kg-exchange.jsonl')], { encoding: 'utf8' });
      acknowledgeGraphExport({ statePath, digest: exported.digest, acknowledgment: {} });
      const nodes = execFileSync(query, [journal, 'nodes'], { encoding: 'utf8' }).trim();
      return { exported, rows, out, nodes: nodes ? nodes.split('\n') : [] };
    };

    const first = run();
    const nodeId = first.rows.find((row) => row.type === 'node').id;
    assert.equal(first.nodes.length, 1);
    assert.ok(first.nodes[0].startsWith(nodeId + '\t'), 'the node is queryable under its exchange identity');

    writeFileSync(f.file('src/one.mjs'), `/** @hq:capability ${CAP} */\nexport const alpha = 2;\n`, 'utf8');
    index.run();
    const edited = run();
    assert.deepEqual(edited.nodes.map((line) => line.split('\t')[0]), [nodeId], 'the edit updates one identity');
    assert.equal(edited.nodes[0].split('\t')[3], 'v2', 'the graph revision advanced');
    assert.match(edited.out, /updated=1/);

    rmSync(f.file('src/one.mjs'));
    index.run();
    const deleted = run();
    assert.deepEqual(deleted.nodes, [], 'the tombstone removed the node from the native graph');
    assert.match(deleted.out, /deleted=1/);
    assert.deepEqual(deleted.exported.tombstonedIds, [nodeId]);
  } finally {
    index.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});