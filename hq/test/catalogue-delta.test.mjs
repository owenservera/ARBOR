/**
 * @hq:context C4 HQ catalogue export acceptance, provenance, replay, denial, scale and recovery tests.
 * @hq:owner hq
 * @hq:task VIVIM-C4-LANE-C
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { buildCatalogueSnapshot, diffCatalogueSnapshots, replayCatalogueDelta, queryCatalogueSnapshot, snapshotHqSemanticIds } from '../lib/catalogue-delta.mjs';
const REV0 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REV1 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const source = (revision = REV0, state = 'complete') => ({ id: 'repos-hq:test', revision, state, owner: 'repos-hq' });
const item = (n, revision = REV0, extra = {}) => ({ id: 'test.capability.' + n + '@1', kind: 'capability', sourceId: 'repos-hq:test', sourceRevision: revision, contentDigest: 'a'.repeat(64), status: 'unknown', evidence: [{ type: 'source_file', ref: 'hq/lib/x.mjs:' + n }], ...extra });

test('new/unchanged snapshots have deterministic digest; replay is idempotent', () => {
  const a = buildCatalogueSnapshot({ sources: [source()], records: [item(2), item(1)] });
  const b = buildCatalogueSnapshot({ sources: [source()], records: [item(1), item(2)] });
  assert.deepEqual(a, b);
  const delta = diffCatalogueSnapshots(null, a);
  assert.deepEqual(replayCatalogueDelta(null, delta), a);
  assert.deepEqual(replayCatalogueDelta(a, delta), a);
  assert.equal(diffCatalogueSnapshots(a, a).recordUpserts.length, 0);
});

test('missing source is not destructive and no missing rows are auto tombstoned', () => {
  const first = buildCatalogueSnapshot({ sources: [source()], records: [item(1), item(2)] });
  const missing = buildCatalogueSnapshot({ previous: first, sources: [source(REV1, 'missing')] });
  assert.equal(missing.records.length, 2);
  assert.equal(missing.sources[0].state, 'missing');
  assert.equal(missing.records[0].tombstone, undefined);
  assert.deepEqual(replayCatalogueDelta(first, diffCatalogueSnapshots(first, missing)), missing);
  assert.throws(() => buildCatalogueSnapshot({ previous: missing, records: [item(3, REV1)] }), /UNAVAILABLE_SOURCE_WRITE/);
});

test('source revision changes preserve history and require explicit evidenced tombstones', () => {
  const initial = buildCatalogueSnapshot({ sources: [source()], records: [item(1)] });
  const final = buildCatalogueSnapshot({ previous: initial, sources: [source(REV1)], records: [item(1, REV1, { status: 'retired', tombstone: { reason: 'source removed', evidenceRef: 'receipt:0123' }, evidence: [{ type: 'source_file', ref: 'receipt:0123' }] })] });
  assert.equal(final.records[0].tombstone.reason, 'source removed');
  assert.deepEqual(replayCatalogueDelta(initial, diffCatalogueSnapshots(initial, final)), final);
  assert.throws(() => buildCatalogueSnapshot({ previous: final, sources: [source(REV1)], records: [item(1, REV1)] }), /TOMBSTONE_REVIVAL_REQUIRES_REVIEW/);
  assert.throws(() => buildCatalogueSnapshot({ sources: [source()], records: [item(1, REV0, { tombstone: { reason: 'x', evidenceRef: 'missing' } })] }), /UNPROVEN_TOMBSTONE/);
});

test('fail closed on ambiguous ownership, same revision collisions, duplicates and replay forks', () => {
  const first = buildCatalogueSnapshot({ sources: [source()], records: [item(1)] });
  assert.throws(() => buildCatalogueSnapshot({ sources: [source()], records: [item(1), item(1)] }), /DUPLICATE_RECORD/);
  assert.throws(() => buildCatalogueSnapshot({ previous: first, records: [item(1, REV0, { contentDigest: 'b'.repeat(64) })] }), /SAME_REVISION_CONFLICT/);
  assert.throws(() => buildCatalogueSnapshot({ previous: first, sources: [{ id: 'other:src', owner: 'other', state: 'complete', revision: REV1 }], records: [{ ...item(1, REV1), sourceId: 'other:src' }] }), /IDENTITY_AUTHORITY_CONFLICT/);
  const next = buildCatalogueSnapshot({ previous: first, sources: [source(REV1)] });
  const delta = diffCatalogueSnapshots(first, next);
  assert.throws(() => replayCatalogueDelta(null, delta), /REPLAY_FORK/);
  assert.throws(() => replayCatalogueDelta(first, { ...delta, targetDigest: 'f'.repeat(64) }), /REPLAY_CORRUPT/);
});

test('secret path, URL credential and production inference are rejected', () => {
  assert.throws(() => buildCatalogueSnapshot({ sources: [source()], records: [item(1, REV0, { evidence: [{ type: 'src', ref: '.env.local' }] })] }), /INVALID_EVIDENCE_REF/);
  assert.throws(() => buildCatalogueSnapshot({ sources: [source()], records: [item(1, REV0, { evidence: [{ type: 'src', ref: 'http:\/\/x?token=abc' }] })] }), /INVALID_EVIDENCE_REF/);
  assert.throws(() => buildCatalogueSnapshot({ sources: [source()], records: [item(1, REV0, { status: 'production_active' })] }), /INVALID_STATUS/);
});

test('semantic SQLite projection reuses existing tables, never certifies production', () => {
  const db = { prepare(sql) { assert.match(sql, /FROM semantic_id/); return { all: () => [{ id: 'one@1', kind: 'capability', status: 'current', authority: 'owner', provenance: 'doc:1' }, { id: 'two@2', kind: 'action', status: 'deprecated', authority: 'hq', provenance: null }] }; } };
  const snap = snapshotHqSemanticIds(db, { repoRevision: REV0 });
  assert.equal(snap.records[0].status, 'unknown');
  assert.equal(snap.records[1].status, 'retired');
  assert.equal(queryCatalogueSnapshot(snap, { kind: 'action' }).total, 1);
});

test('10k rows: bounded export, delta, replay and paging with stable counts', () => {
  const rows = Array.from({ length: 10_000 }, (_, i) => item(i));
  const start = performance.now();
  const snap = buildCatalogueSnapshot({ sources: [source()], records: rows });
  const delta = diffCatalogueSnapshots(null, snap);
  const replayed = replayCatalogueDelta(null, delta);
  assert.equal(replayed.digest, snap.digest);
  assert.equal(queryCatalogueSnapshot(snap, { limit: 17, offset: 9990 }).records.length, 10);
  assert.equal(queryCatalogueSnapshot(snap).total, 10_000);
  // Informational perf only; avoid falsely certifying a hardware-specific latency SLO.
  console.info('C4_BENCH', JSON.stringify({ rows: rows.length, elapsedMs: Math.round(performance.now() - start) }));
});
