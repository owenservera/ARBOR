// hq/test/graph.test.mjs — dependency traversal and project graph over a synthetic index.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { openMemoryDb } from '../lib/schema.mjs';
import { deps, impact, projectGraph, scopedProjection } from '../lib/graph.mjs';

const PROJECTS = [
  { name: 'alpha', path: 'C:/ws/alpha' },
  { name: 'beta', path: 'C:/ws/beta' },
];

const FILES = [
  { id: 1, project: 'alpha', path: 'src/index.mjs' },
  { id: 2, project: 'alpha', path: 'src/util.mjs' },
  { id: 3, project: 'alpha', path: 'src/legacy.mjs' },
  { id: 4, project: 'alpha', path: 'src/cycle_a.mjs' },
  { id: 5, project: 'alpha', path: 'src/cycle_b.mjs' },
  { id: 6, project: 'alpha', path: 'src/isolated.mjs' },
  { id: 7, project: 'alpha', path: 'src/deep/one.mjs' },
  { id: 8, project: 'beta', path: 'lib/util.mjs' },
  { id: 9, project: 'beta', path: 'src/entry.mjs' },
];

// [file_id, specifier, resolved_file_id, resolved_project_id]
const IMPORTS = [
  [1, './util.mjs', 2, 1],
  [2, './legacy.mjs', 3, 1],
  [3, './index.mjs', 1, 1],
  [4, './cycle_b.mjs', 5, 1],
  [5, './cycle_a.mjs', 4, 1],
  [9, './util.mjs', 8, 2],
  [9, 'alpha/src/util.mjs', 2, 1],
  [1, 'node:fs', null, null],
  [7, 'missing-package', null, null],
];

const SYMBOLS = [
  [1, 'alpha', 'main'],
  [1, 'alpha', 'run'],
  [2, 'alpha', 'util'],
  [3, 'alpha', 'legacy'],
  [8, 'beta', 'util'],
];

function seed() {
  const db = openMemoryDb();
  const insertProject = db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)');
  for (const project of PROJECTS) insertProject.run(project.name, project.path, '2026-01-01T00:00:00Z');

  const insertFile = db.prepare(`
INSERT INTO files(id, project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, ?, 'javascript', 'source', 100, 0, ?, 5, 0, 0, '2026-01-01T00:00:00Z')`);
  for (const file of FILES) {
    insertFile.run(file.id, file.project, file.path, `C:/ws/${file.project}/${file.path}`, `hash-${file.id}`);
  }

  const insertImport = db.prepare(`
INSERT INTO imports(file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, 'import', ?, ?, 1)`);
  for (const [fileId, specifier, resolvedFileId, resolvedProjectId] of IMPORTS) {
    const project = FILES.find((file) => file.id === fileId).project;
    insertImport.run(fileId, project, specifier, resolvedFileId, resolvedProjectId);
  }

  const insertSymbol = db.prepare(`
INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc)
VALUES (?, (SELECT id FROM projects WHERE name = ?), ?, 'function', 1, 1, ?, 1, NULL)`);
  for (const [fileId, project, name] of SYMBOLS) insertSymbol.run(fileId, project, name, `function ${name}()`);

  return db;
}

test('deps walks resolved imports forward with depth-first discovery order', () => {
  const db = seed();
  const forward = deps(db, { target: 'src/index.mjs', project: 'alpha', depth: 2 });
  assert.deepEqual(forward.root, { path: 'src/index.mjs', project: 'alpha' });
  assert.equal(forward.direction, 'forward');
  assert.deepEqual(forward.nodes, [
    { path: 'src/index.mjs', project: 'alpha', depth: 0, via: null },
    { path: 'src/util.mjs', project: 'alpha', depth: 1, via: './util.mjs' },
    { path: 'src/legacy.mjs', project: 'alpha', depth: 2, via: './legacy.mjs' },
  ]);
  assert.deepEqual(forward.edges, [
    { from: 'src/index.mjs', to: 'src/util.mjs', specifier: './util.mjs' },
    { from: 'src/util.mjs', to: 'src/legacy.mjs', specifier: './legacy.mjs' },
  ]);

  const shallow = deps(db, { target: 'src/index.mjs', project: 'alpha', depth: 1 });
  assert.equal(shallow.nodes.length, 2);
  assert.equal(shallow.edges.length, 1);
});

test('deps is cycle-safe and stops at the depth cap', () => {
  const db = seed();
  const deep = deps(db, { target: 'src/index.mjs', project: 'alpha', depth: 10 });
  assert.deepEqual(deep.nodes.map((node) => node.path), [
    'src/index.mjs', 'src/util.mjs', 'src/legacy.mjs',
  ]);
  assert.deepEqual(deep.edges, [
    { from: 'src/index.mjs', to: 'src/util.mjs', specifier: './util.mjs' },
    { from: 'src/legacy.mjs', to: 'src/index.mjs', specifier: './index.mjs' },
    { from: 'src/util.mjs', to: 'src/legacy.mjs', specifier: './legacy.mjs' },
  ]);

  const pair = deps(db, { target: 'src/cycle_a.mjs', project: 'alpha', depth: 25 });
  assert.equal(pair.nodes.length, 2);
  assert.deepEqual(pair.edges, [
    { from: 'src/cycle_a.mjs', to: 'src/cycle_b.mjs', specifier: './cycle_b.mjs' },
    { from: 'src/cycle_b.mjs', to: 'src/cycle_a.mjs', specifier: './cycle_a.mjs' },
  ]);
});

test('deps reverse follows importers and keeps edges importer -> imported', () => {
  const db = seed();
  const reverse = deps(db, {
    target: 'src/index.mjs', project: 'alpha', depth: 1, reverse: true,
  });
  assert.equal(reverse.direction, 'reverse');
  assert.deepEqual(reverse.nodes, [
    { path: 'src/index.mjs', project: 'alpha', depth: 0, via: null },
    { path: 'src/legacy.mjs', project: 'alpha', depth: 1, via: './index.mjs' },
  ]);
  assert.deepEqual(reverse.edges, [
    { from: 'src/legacy.mjs', to: 'src/index.mjs', specifier: './index.mjs' },
  ]);
});

test('impact is a deeper reverse walk across projects', () => {
  const db = seed();
  const result = impact(db, { target: 'src/util.mjs', project: 'alpha', depth: 1 });
  assert.equal(result.direction, 'reverse');
  assert.deepEqual(result.nodes, [
    { path: 'src/util.mjs', project: 'alpha', depth: 0, via: null },
    { path: 'src/entry.mjs', project: 'beta', depth: 1, via: 'alpha/src/util.mjs' },
    { path: 'src/index.mjs', project: 'alpha', depth: 1, via: './util.mjs' },
  ]);
  assert.deepEqual(result.edges, [
    { from: 'src/entry.mjs', to: 'src/util.mjs', specifier: 'alpha/src/util.mjs' },
    { from: 'src/index.mjs', to: 'src/util.mjs', specifier: './util.mjs' },
  ]);

  const defaulted = impact(db, { target: 'src/index.mjs', project: 'alpha' });
  assert.deepEqual(defaulted.nodes.map((node) => node.depth), [0, 1, 2, 3]);
  assert.equal(defaulted.nodes.at(-1).path, 'src/entry.mjs');
  assert.equal(defaulted.nodes.at(-1).project, 'beta');
});

test('deps resolves exact paths, suffixes and unique basenames', () => {
  const db = seed();

  const suffix = deps(db, { target: 'deep/one.mjs', depth: 0 });
  assert.deepEqual(suffix.root, { path: 'src/deep/one.mjs', project: 'alpha' });

  const basename = deps(db, { target: 'legacy.mjs', depth: 0 });
  assert.deepEqual(basename.root, { path: 'src/legacy.mjs', project: 'alpha' });

  const rooted = deps(db, { target: './src/legacy.mjs', depth: 0 });
  assert.deepEqual(rooted.root, { path: 'src/legacy.mjs', project: 'alpha' });
});

test('deps returns an empty result for ambiguous or missing targets', () => {
  const db = seed();
  const ambiguous = deps(db, { target: 'util.mjs' });
  assert.deepEqual(ambiguous, { root: null, direction: 'forward', nodes: [], edges: [] });

  const missing = deps(db, { target: 'nope/missing.mjs' });
  assert.deepEqual(missing, { root: null, direction: 'forward', nodes: [], edges: [] });

  const disambiguated = deps(db, { target: 'util.mjs', project: 'beta', depth: 0 });
  assert.deepEqual(disambiguated.root, { path: 'lib/util.mjs', project: 'beta' });
});

test('deps caps nodes at the limit and drops edges beyond the cap', () => {
  const db = seed();
  const capped = deps(db, { target: 'src/index.mjs', project: 'alpha', depth: 10, limit: 2 });
  assert.equal(capped.nodes.length, 2);
  assert.deepEqual(capped.nodes.map((node) => node.path), ['src/index.mjs', 'src/util.mjs']);
  assert.deepEqual(capped.edges, [
    { from: 'src/index.mjs', to: 'src/util.mjs', specifier: './util.mjs' },
  ]);
});

test('projectGraph counts files, symbols and cross-project imports', () => {
  const db = seed();
  const graph = projectGraph(db);
  assert.deepEqual(graph.nodes, [
    { project: 'alpha', files: 7, symbols: 4, incoming: 1, outgoing: 0 },
    { project: 'beta', files: 2, symbols: 1, incoming: 0, outgoing: 1 },
  ]);
  assert.deepEqual(graph.edges, [{ from: 'beta', to: 'alpha', count: 1 }]);
});

test('graph output is deterministic and empty for an empty index', () => {
  const db = seed();
  assert.deepEqual(deps(db, { target: 'src/index.mjs', project: 'alpha' }), deps(db, { target: 'src/index.mjs', project: 'alpha' }));
  assert.deepEqual(projectGraph(db), projectGraph(db));

  const empty = openMemoryDb();
  assert.deepEqual(projectGraph(empty), { nodes: [], edges: [] });
  assert.deepEqual(deps(empty, { target: 'anything' }), {
    root: null, direction: 'forward', nodes: [], edges: [],
  });
});

test('scopedProjection returns path-stable nodes, edges and tombstones', () => {
  const db = seed();
  const projection = scopedProjection(db, { project: 'alpha' });

  // Stable, path-stable node identity (matches kg-export / native HQKG convention).
  const byPath = new Map(projection.nodes.map((n) => [n.metadata.source_path, n]));
  assert.ok(byPath.has('alpha/src/index.mjs'));
  assert.ok(byPath.has('alpha/src/util.mjs'));
  assert.equal(byPath.get('alpha/src/index.mjs').kind, 'source-file');
  assert.equal(byPath.get('alpha/src/index.mjs').metadata.namespace, 'alpha');
  assert.match(byPath.get('alpha/src/index.mjs').id, /^hqg1:[a-f0-9]{64}$/);

  // Stable identity: same project + path yields the same id on re-query.
  const again = scopedProjection(db, { project: 'alpha' });
  const againByPath = new Map(again.nodes.map((n) => [n.metadata.source_path, n]));
  assert.equal(againByPath.get('alpha/src/index.mjs').id, byPath.get('alpha/src/index.mjs').id);

  // Edges connect resolved in-universe endpoints (stored by stable node id).
  const indexNode = byPath.get('alpha/src/index.mjs');
  const utilNode = byPath.get('alpha/src/util.mjs');
  const indexEdge = projection.edges.find(
    (e) => e.from === indexNode.id && e.to === utilNode.id,
  );
  assert.ok(indexEdge, 'expected index.mjs -> util.mjs edge');
  assert.equal(indexEdge.relation, 'imports');
  assert.equal(indexEdge.weight, 1);
  assert.match(indexEdge.id, /^hqg1:[a-f0-9]{64}$/);

  // Every edge endpoint is a known node (no dangling references).
  const nodeIds = new Set(projection.nodes.map((n) => n.id));
  assert.ok(projection.edges.every((e) => nodeIds.has(e.from) && nodeIds.has(e.to)));

  // Tombstones: files in the previous state that are absent now are tombstoned.
  const previous = {
    'alpha/src/removed.mjs': { id: graphNodeIdForTest('alpha', 'src/removed.mjs'), content_sha256: 'hash-99' },
    'alpha/src/index.mjs': { id: byPath.get('alpha/src/index.mjs').id, content_sha256: 'hash-1' },
  };
  const withTombstones = scopedProjection(db, { project: 'alpha', previous });
  const tombstoneIds = withTombstones.tombstones.map((t) => t.id);
  assert.ok(tombstoneIds.includes(graphNodeIdForTest('alpha', 'src/removed.mjs')));
  assert.equal(withTombstones.tombstones.filter((t) => t.reason === 'deleted').length, 1);
  // index.mjs is still present, so it is NOT a tombstone.
  assert.ok(!tombstoneIds.includes(byPath.get('alpha/src/index.mjs').id));

  // Empty index yields an empty projection.
  const empty = openMemoryDb();
  assert.deepEqual(scopedProjection(empty), { nodes: [], edges: [], tombstones: [] });
});

// Test-only helper mirroring graphNodeId so the test asserts the real identity.
function graphNodeIdForTest(project, path) {
  return `hqg1:${createHash('sha256').update(`source-file\0${project}\0${path}`).digest('hex')}`;
}
