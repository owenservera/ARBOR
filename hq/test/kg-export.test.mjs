// hq/test/kg-export.test.mjs — the operational HQ -> HQKGX1 producer.
// @hq:invariant The exporter is data-only: it never mutates the index, and every
//   emitted exchange must be admitted by the same checker the wiki uses
//   (buildGraphIndex) and by the native importer's recorded behavior.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { exportGraphExchange, acknowledgeGraphExport, lastGraphExport } from '../lib/kg-export.mjs';
import { buildGraphIndex } from '../lib/wiki-runtime/graph-index.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(REPO, 'hq', 'bin', 'hq.mjs');

function makeWorkspace() {
  const ws = mkdtempSync(join(tmpdir(), 'hq-kg-export-'));
  mkdirSync(join(ws, '.hq'), { recursive: true });
  writeFileSync(join(ws, '.hq', 'config.json'), JSON.stringify({ db: '.hq/index.db', maxFileBytes: 200000, ignores: [] }));
  writeFileSync(join(ws, 'projects.json'), JSON.stringify({
    version: 1,
    projects: [{ name: 'demo', path: 'demo', tags: [], addedAt: '2026-11-10T00:00:00.000Z' }],
  }));
  mkdirSync(join(ws, 'demo', 'src'), { recursive: true });
  writeFileSync(join(ws, 'demo', 'src', 'one.mjs'), 'export function alpha() { return 1; }\n');
  writeFileSync(join(ws, 'demo', 'src', 'two.mjs'), "import { alpha } from './one.mjs';\nexport const beta = alpha;\n");
  return ws;
}

function indexWorkspace(ws) {
  execFileSync(process.execPath, [CLI, 'index', '--json'], { cwd: ws, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return new DatabaseSync(join(ws, '.hq', 'index.db'), { readOnly: true });
}

function exportOf(ws, db, outPath, statePath) {
  return exportGraphExchange({ db, outPath, statePath });
}

function parseExchange(path) {
  const text = readFileSync(path, 'utf8');
  const [head, ...lines] = text.split('\n');
  return { manifest: JSON.parse(head), rows: lines.filter((l) => l).map((l) => JSON.parse(l)), text };
}

test('first export emits a deterministic admitted universe with content claims', () => {
  const ws = makeWorkspace();
  try {
    const db = indexWorkspace(ws);
    const outPath = join(ws, '.hq', 'kg-exchange.jsonl');
    const statePath = join(ws, '.hq', 'kg-export-state.json');
    const first = exportOf(ws, db, outPath, statePath);
    db.close();

    assert.equal(first.stats.nodes, 2);
    assert.equal(first.stats.edges, 1);
    assert.equal(first.stats.tombstones, 0);
    // Wiki admission (the exact checker buildWiki consumes) must accept it.
    const index = buildGraphIndex(outPath);
    assert.equal(index.nodeCount, 2);
    assert.equal(index.edgeCount, 1);
    // The wiki join key resolves for the indexed file: path + '\0' + content hash.
    const raw = parseExchange(outPath);
    const oneNode = raw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/one.mjs');
    assert.ok(oneNode, 'node for demo/src/one.mjs present');
    assert.match(oneNode.id, /^hqg1:[a-f0-9]{64}$/);
    assert.match(oneNode.metadata.content_sha256, /^[a-f0-9]{64}$/);
    const edge = raw.rows.find((r) => r.type === 'edge');
    assert.equal(edge.relation, 'imports');
    assert.equal(edge.from, raw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/two.mjs').id);
    assert.equal(edge.to, oneNode.id);
    // Deterministic: identical index state produces byte-identical output.
    const db2 = new DatabaseSync(join(ws, '.hq', 'index.db'), { readOnly: true });
    const out2 = join(ws, '.hq', 'kg-exchange-2.jsonl');
    exportOf(ws, db2, out2, null);
    db2.close();
    assert.equal(readFileSync(out2, 'utf8'), readFileSync(outPath, 'utf8'));
  } finally {
    try { rmSync(ws, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* leftover temp: spawned CLI child may hold index.db on Windows */ }
  }
});

test('mutation updates the node in place; deletion emits a tombstone; rename is delete+insert', () => {
  const ws = makeWorkspace();
  try {
    const db = indexWorkspace(ws);
    const outPath = join(ws, '.hq', 'kg-exchange.jsonl');
    const statePath = join(ws, '.hq', 'kg-export-state.json');
    const first = exportOf(ws, db, outPath, statePath);
    const firstRaw = parseExchange(outPath);
    const oneBefore = firstRaw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/one.mjs');
    const twoBefore = firstRaw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/two.mjs');
    db.close();

    // 1. Mutation: edit one.mjs content; identity (node id) is path-stable.
    writeFileSync(join(ws, 'demo', 'src', 'one.mjs'), 'export function alpha() { return 2; }\n');
    let db2 = indexWorkspace(ws);
    const second = exportOf(ws, db2, outPath, statePath);
    db2.close();
    assert.equal(second.stats.nodes, 2, 'mutation does not change the node universe');
    assert.equal(second.stats.tombstones, 0);
    // The importer acknowledged this exchange: state may advance.
    assert.equal(acknowledgeGraphExport({ statePath, digest: second.digest, acknowledgment: { epochBefore: 3, epochAfter: 4 } }).acked, true);
    const secondRaw = parseExchange(outPath);
    const oneAfter = secondRaw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/one.mjs');
    assert.equal(oneAfter.id, oneBefore.id, 'path-stable identity survives content edits');
    assert.notEqual(oneAfter.metadata.content_sha256, oneBefore.metadata.content_sha256, 'content claim updates');

    // 2. Deletion: remove two.mjs; the exporter emits a tombstone for it.
    rmSync(join(ws, 'demo', 'src', 'two.mjs'));
    db2 = indexWorkspace(ws);
    const third = exportOf(ws, db2, outPath, statePath);
    db2.close();
    assert.equal(third.stats.nodes, 1);
    assert.equal(third.stats.tombstones, 1);
    assert.deepEqual(third.tombstonedPaths, ['demo/src/two.mjs']);
    const thirdRaw = parseExchange(outPath);
    const tomb = thirdRaw.rows.find((r) => r.type === 'tombstone');
    assert.equal(tomb.id, twoBefore.id, 'tombstone targets the exact former identity');
    assert.ok(!thirdRaw.rows.some((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/two.mjs'));
    assert.equal(acknowledgeGraphExport({ statePath, digest: third.digest, acknowledgment: { epochBefore: 4, epochAfter: 5 } }).acked, true);

    // 3. Rename one.mjs -> three.mjs: old identity tombstoned, new identity inserted.
    writeFileSync(join(ws, 'demo', 'src', 'three.mjs'), readFileSync(join(ws, 'demo', 'src', 'one.mjs'), 'utf8'));
    rmSync(join(ws, 'demo', 'src', 'one.mjs'));
    db2 = indexWorkspace(ws);
    const fourth = exportOf(ws, db2, outPath, statePath);
    db2.close();
    assert.equal(fourth.stats.nodes, 1);
    assert.equal(fourth.stats.tombstones, 1);
    assert.deepEqual(fourth.tombstonedPaths, ['demo/src/one.mjs']);
    const fourthRaw = parseExchange(outPath);
    const renamed = fourthRaw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/three.mjs');
    assert.ok(renamed, 'renamed file gets a fresh identity');
    assert.notEqual(renamed.id, oneBefore.id, 'rename mints a new graph identity');
  } finally {
    try { rmSync(ws, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* leftover temp: spawned CLI child may hold index.db on Windows */ }
  }
});

test('acknowledgment gating: unacked tombstones survive, stale digests refused, ack commits', () => {
  const ws = makeWorkspace();
  try {
    const db = indexWorkspace(ws);
    const outPath = join(ws, '.hq', 'kg-exchange.jsonl');
    const statePath = join(ws, '.hq', 'kg-export-state.json');
    const first = exportOf(ws, db, outPath, statePath);
    assert.ok(lastGraphExport(statePath)?.digest === first.digest, 'last-export record binds the digest');
    db.close();

    // Deletion BEFORE any acknowledgment: there is no acked delta base yet, so
    // the exporter emits the full universe with no tombstones (fresh-journal
    // semantics — the importer treats the universe as authoritative on first import).
    rmSync(join(ws, 'demo', 'src', 'two.mjs'));
    let db2 = indexWorkspace(ws);
    const unacked1 = exportOf(ws, db2, outPath, statePath);
    db2.close();
    assert.equal(unacked1.stats.tombstones, 0, 'no acked base: full universe, no tombstones');
    assert.equal(acknowledgeGraphExport({ statePath, digest: unacked1.digest }).acked, true);
    // Base now = post-deletion universe. A further deletion derives a tombstone.
    rmSync(join(ws, 'demo', 'src', 'one.mjs'));

    // Import failed after export: no ack. Next export re-emits the tombstone.
    db2 = indexWorkspace(ws);
    const failedImport = exportOf(ws, db2, outPath, statePath);
    db2.close();
    assert.equal(failedImport.stats.tombstones, 1, 'tombstone re-emitted while unacked');
    assert.equal(acknowledgeGraphExport({ statePath, digest: '0'.repeat(64) }).acked, false, 'wrong digest refused');
    assert.equal(acknowledgeGraphExport({ statePath, digest: failedImport.digest, acknowledgment: { epochBefore: 7, epochAfter: 5 } }).acked, false, 'epoch regression refused');
    assert.equal(acknowledgeGraphExport({ statePath, digest: failedImport.digest, acknowledgment: { epochBefore: 7, epochAfter: 9 } }).acked, true, 'verified acknowledgment commits');
    // After the ack, the next export has no tombstones: the delta base moved.
    db2 = indexWorkspace(ws);
    const settled = exportOf(ws, db2, outPath, statePath);
    db2.close();
    assert.equal(settled.stats.tombstones, 0, 'acked tombstones never re-emitted');
  } finally {
    try { rmSync(ws, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* leftover temp */ }
  }
});

test('hq kg export CLI writes the exchange and reports counts', () => {
  const ws = makeWorkspace();
  try {
    indexWorkspace(ws); // leaves a readable db; open in read-only for the CLI? CLI opens its own.
    const out = execFileSync(process.execPath, [CLI, 'kg', 'export', '--json'], {
      cwd: ws, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    const payload = JSON.parse(out);
    assert.equal(payload.schema, 'hq.kg-export/1');
    assert.equal(payload.stats.nodes, 2);
    assert.equal(payload.stats.edges, 1);
    assert.ok(existsSync(join(ws, '.hq', 'kg-exchange.jsonl')));
  } finally {
    try { rmSync(ws, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* leftover temp: spawned CLI child may hold index.db on Windows */ }
  }
});
