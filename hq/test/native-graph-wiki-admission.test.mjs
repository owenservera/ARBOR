/**
 * Contract parity: HQ wiki's read-only hqkg-exchange/1 admission must not accept
 * a projection that the existing native Rust importer would reject.
 * No indexing, graph journal, private data or Host effects.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraphIndex } from '../lib/wiki-runtime/graph-index.mjs';

const id = char => 'hqg1:' + char.repeat(64);
const A = id('a');
const B = id('b');
const E = id('e');
const node = (nodeId, metadata = {}) => ({
  type: 'node', id: nodeId, kind: 'source-file', title: 'fixture',
  metadata,
});
const edge = (from = A, to = B, edgeId = E) => ({
  type: 'edge', id: edgeId, from, to, relation: 'imports', weight: 1, metadata: {},
});
const hash = text => createHash('sha256').update(text).digest('hex');

function withExchange(rows, check, changes = {}) {
  const body = rows.map(row => typeof row === 'string' ? row : JSON.stringify(row)).join('\n') + '\n';
  const manifest = {
    type: 'manifest',
    schema: 'repos-hq.hqkg-exchange/1',
    source: 'repos-hq/unit-test',
    authority: 'data-only; no executable code or provider actions',
    node_count: rows.filter(row => row?.type === 'node').length,
    edge_count: rows.filter(row => row?.type === 'edge').length,
    graph_sha256: hash(body),
    ...changes,
  };
  const dir = mkdtempSync(join(tmpdir(), 'hqkg-wiki-admission-'));
  const path = join(dir, 'exchange.jsonl');
  try {
    writeFileSync(path, JSON.stringify(manifest) + '\n' + body);
    return check(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('valid imported source projection remains consumable by the existing wiki', () => {
  withExchange([node(A, { source_path: 'hq/lib/a.mjs', content_sha256: '1'.repeat(64) }), node(B), edge()], path => {
    const index = buildGraphIndex(path);
    assert.equal(index.nodeCount, 2);
    assert.equal(index.edgeCount, 1);
    assert.equal(index.byNodeId.size, 2);
    assert.equal(index.bySourceFile.size, 1);
    assert.equal(index.exchangeDigest.length, 64);
  });
});

test('manifest authenticity and admission are both required', () => {
  withExchange([node(A)], path => assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_SHA/),
    { graph_sha256: '0'.repeat(64) });
  withExchange([node(A)], path => assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_AUTHORITY/),
    { authority: 'anything can execute' });
  withExchange([node(A)], path => assert.throws(() => buildGraphIndex(path), /EXCHANGE_COUNT_MISMATCH/),
    { node_count: 2 });
});

test('digest-valid malformed and unknown records fail closed, not silently skipped', () => {
  withExchange([node(A), '{"type":"node",no-json}'], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_JSON/));
  withExchange([node(A), { type: 'surprise', id: B }], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_NODE/));
  withExchange([node(A), ''], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_RECORD/));
});

test('duplicate node IDs and duplicate edge IDs are rejected', () => {
  withExchange([node(A), node(A)], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_NODE/));
  withExchange([node(A), node(B), edge(), edge()], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_EDGE/));
});

test('endpoints, canonical IDs, ordering and positive edge weights are verified', () => {
  withExchange([node(A), edge(A, B)], path =>
    assert.throws(() => buildGraphIndex(path), /UNRESOLVED_EXCHANGE_EDGE/));
  withExchange([node(A), node(B), edge(), node(id('c'))], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_NODE/));
  withExchange([node('not-canonical')], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_RECORD/));
  withExchange([node(A), node(B), { ...edge(), weight: 0 }], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_EDGE/));
});

test('duplicate unscoped path+digest never picks an arbitrary repository winner', () => {
  const metadata = { source_path: 'src/index.mjs', content_sha256: 'a'.repeat(64) };
  withExchange([node(A, metadata), node(B, metadata)], path => {
    const index = buildGraphIndex(path);
    const key = 'src/index.mjs' + '\u0000' + 'a'.repeat(64);
    assert.equal(index.bySourceFile.has(key), false);
    assert.equal(index.ambiguousSourceFiles.has(key), true);
    assert.equal(index.byNodeId.size, 2);
  });
});

test('metadata accepted by the wiki cannot bypass native scalar or secret checks', () => {
  withExchange([node(A, { hidden: { nested: 'not native' } })], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_METADATA/));
  withExchange([node(A, { authorization_header: 'do-not-index' })], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_METADATA/));
  withExchange([node(A), node(B), { ...edge(), metadata: { hqkg_exploit: 'safe' } }], path => {
    assert.equal(buildGraphIndex(path).edgeCount, 1);
  });
  withExchange([node(A), node(B), { ...edge(), metadata: { 'hqkg.owner': 'forged' } }], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_METADATA/));
});
