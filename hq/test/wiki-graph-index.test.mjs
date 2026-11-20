// hq/test/wiki-graph-index.test.mjs — bundled-hqkg-import.
//
// The wiki names canonical graph nodes from the bundled HQKGX1 exchange
// (Lane E's published `repos-hq.hqkg-exchange/1`) without duplicating the
// index, keeps identity stable (ids copied verbatim), and lets the native
// SQLite query reflect registered source identities including tombstoned
// statuses. The exchange is a read model: durable ingestion (kg-export) stays
// separate from bounded retrieval (buildWiki).
//
// hq/bin/hq.mjs:1120-1123 is the production caller: it builds the graph index
// from the exchange and hands it to buildWiki, which stores it on
// model.graphIndex; renderSemanticsPage then names each identity/command via
// graphNodeRef (hq/lib/wiki.mjs:2077).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import { buildWiki } from '../lib/wiki.mjs';
import { buildGraphIndex } from '../lib/wiki-runtime/graph-index.mjs';

// ---------------------------------------------------------------------------
// Bundled HQKGX1 exchange (read model published by the assembler).
// ---------------------------------------------------------------------------

function makeExchange(rows) {
  const body = rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
  const manifest = {
    type: 'manifest',
    schema: 'repos-hq.hqkg-exchange/1',
    source: 'repos-hq/unit-test',
    authority: 'data-only; no executable code or provider actions',
    node_count: rows.filter((row) => row.type === 'node').length,
    edge_count: rows.filter((row) => row.type === 'edge').length,
    graph_sha256: createHash('sha256').update(body).digest('hex'),
  };
  const dir = mkdtempSync(join(tmpdir(), 'hqkg-wiki-unit-'));
  const path = join(dir, 'exchange.jsonl');
  writeFileSync(path, JSON.stringify(manifest) + '\n' + body, 'utf8');
  return { path, dir };
}

const SRC_NODE = 'hqg1:' + 'a'.repeat(64); // path-stable graph node id for the source file
const SEM_CURRENT = 'hq/wiki/semantic/1'; // registered identity, current
const SEM_TOMBSTONE = 'hq/wiki/semantic/2'; // registered identity, deprecated (tombstoned)

// ---------------------------------------------------------------------------
// Native index fixtures (the native SQLite query the wiki projects).
// ---------------------------------------------------------------------------

function addProject(db, { name, dir }) {
  const info = db
    .prepare(
      `INSERT INTO projects(name, path, kind, branch, head, file_count, symbol_count, added_at, indexed_at)
       VALUES (?, ?, 'dir', 'main', 'deadbeefcafe', 0, 0, '2026-01-01T00:00:00Z', '2026-01-06T00:00:00Z')`,
    )
    .run(name, dir);
  return Number(info.lastInsertRowid);
}

function addFile(db, projectId, projectDir, relPath, content) {
  const absPath = join(projectDir, ...relPath.split('/'));
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf8');
  const info = db
    .prepare(
      `INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at)
       VALUES (?, ?, ?, 'javascript', 'source', ?, 1767225600000, ?, 1, 0, 0, '2026-01-06T00:00:00Z')`,
    )
    .run(
      projectId,
      relPath,
      absPath,
      Buffer.byteLength(content, 'utf8'),
      `hash-${relPath}`,
    );
  return Number(info.lastInsertRowid);
}

function addSemanticIdentity(db, { id, kind, name, status = 'proposed' }) {
  db.prepare(
    `INSERT INTO semantic_id(id, kind, name, version, label, description, status, authority, provenance, created_at)
     VALUES (?, ?, ?, '1', ?, ?, ?, 'project_observed', 'test', '2026-01-01T00:00:00Z')`,
  ).run(id, kind, name, name, `description of ${name}`, status);
}

function addSemanticLink(db, { semanticId, path = 'hq/lib/wiki.mjs', line = 533, symbol = 'buildWiki' }) {
  db.prepare(
    `INSERT INTO semantic_link(id, semantic_id, path, line, symbol, content_hash, kind, status, observed_at)
     VALUES (?, ?, ?, ?, ?, ?, 'def', 'current', '2026-01-01T00:00:00Z')`,
  ).run(`link-${semanticId}`, semanticId, path, line, symbol, 'a'.repeat(64));
}

function buildFixture(options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'hq-wiki-graph-'));
  const db = openMemoryDb();
  const projectDir = join(root, 'demo');
  mkdirSync(projectDir, { recursive: true });
  const projectId = addProject(db, { name: 'demo', dir: projectDir });
  const fileId = addFile(db, projectId, projectDir, 'src/wiki.mjs', 'export function buildWiki() {}\n');

  addSemanticIdentity(db, { id: SEM_CURRENT, kind: 'capability', name: 'Wiki semantic identity', status: 'current' });
  addSemanticIdentity(db, { id: SEM_TOMBSTONE, kind: 'capability', name: 'Retired wiki identity', status: 'deprecated' });
  addSemanticLink(db, { semanticId: SEM_CURRENT });
  addSemanticLink(db, { semanticId: SEM_TOMBSTONE });

  return {
    root,
    db,
    projectDir,
    outDir: join(root, 'wiki'),
    options,
  };
}

function readPage(outDir, pagePath) {
  return readFileSync(join(outDir, ...pagePath.split('/')), 'utf8');
}

test('wiki names canonical graph nodes from the bundled exchange without duplicating the index', () => {
  const exchange = makeExchange([
    {
      type: 'node',
      id: SRC_NODE,
      kind: 'semantic',
      title: SEM_CURRENT,
      metadata: { semantic_id: SEM_CURRENT, domain: 'semantic', source_path: 'hq/lib/wiki.mjs' },
    },
  ]);
  try {
    const index = buildGraphIndex(exchange.path);
    // Stable identity: the graph node id is copied verbatim from the exchange.
    assert.equal(index.nodeCount, 1);
    assert.equal(index.byNodeId.get(SRC_NODE).id, SRC_NODE);
    assert.equal(index.bySemanticId.get(SEM_CURRENT)[0].id, SRC_NODE);
    // Read-only model: building it must not modify the bundled exchange bytes.
    const before = readFileSync(exchange.path, 'utf8');
    buildGraphIndex(exchange.path);
    assert.equal(readFileSync(exchange.path, 'utf8'), before);

    const fixture = buildFixture();
    try {
      const result = buildWiki({ ...fixture, graphIndex: index });
      assert.ok(result.written > 0, 'wiki build produced pages');
      const semantics = readPage(fixture.outDir, 'semantics.md');
      // The current registered source identity appears in the native query ...
      assert.ok(semantics.includes(SEM_CURRENT), 'current identity present in semantics page');
      assert.ok(semantics.includes('current'), 'current status present');
      // ... with its canonical graph node id copied verbatim (stable identity).
      assert.ok(semantics.includes(SRC_NODE), `canonical graph node id ${SRC_NODE} named`);
      // The deprecated (tombstoned) identity also appears in the native query,
      // but has no live graph node to name.
      assert.ok(semantics.includes(SEM_TOMBSTONE), 'tombstoned/deprecated identity present in native query');
    } finally {
      fixture.db.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  } finally {
    rmSync(exchange.dir, { recursive: true, force: true });
  }
});

test('bounded retrieval without a graph index names nothing (no graph authority)', () => {
  const fixture = buildFixture();
  try {
    const result = buildWiki({ ...fixture, graphIndex: null });
    assert.ok(result.written > 0, 'wiki build produced pages without a graph index');
    const semantics = readPage(fixture.outDir, 'semantics.md');
    // Both identities appear in the native query ...
    assert.ok(semantics.includes(SEM_CURRENT), 'current identity present');
    assert.ok(semantics.includes(SEM_TOMBSTONE), 'tombstoned identity present');
    // ... but no canonical graph node is named: no graph authority without the index.
    assert.ok(!semantics.includes('hqg1:'), 'no graph node id is invented without the exchange');
  } finally {
    fixture.db.close();
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
