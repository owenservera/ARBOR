# File: hq/test/catalogue-delta.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/catalogue-delta.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6222 B |
| Lines | 80 |
| Hash | 38bb78489930 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REV0 | const | 10 | no | const REV0 = &#39;aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&#39;; |
| REV1 | const | 11 | no | const REV1 = &#39;bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb&#39;; |
| source | function | 12 | no | const source = (revision = REV0, state = &#39;complete&#39;) =&gt; ({ id: &#39;repos-hq:test&#39;, revision, state, owner: &#39;repos-hq&#39; }); |
| item | function | 13 | no | const item = (n, revision = REV0, extra = {}) =&gt; ({ id: &#39;test.capability.&#39; + n + &#39;@1&#39;, kind: &#39;capability&#39;, sourceId: &#39;repos-hq:test&#39;, sourceRevision: revision, contentDigest: &#39;a&#39;.repeat(64), status: … |
| a | const | 16 | no | const a = buildCatalogueSnapshot({ sources: [source()], records: [item(2), item(1)] }); |
| b | const | 17 | no | const b = buildCatalogueSnapshot({ sources: [source()], records: [item(1), item(2)] }); |
| delta | const | 19 | no | const delta = diffCatalogueSnapshots(null, a); |
| first | const | 26 | no | const first = buildCatalogueSnapshot({ sources: [source()], records: [item(1), item(2)] }); |
| missing | const | 27 | no | const missing = buildCatalogueSnapshot({ previous: first, sources: [source(REV1, &#39;missing&#39;)] }); |
| initial | const | 36 | no | const initial = buildCatalogueSnapshot({ sources: [source()], records: [item(1)] }); |
| first | const | 45 | no | const first = buildCatalogueSnapshot({ sources: [source()], records: [item(1)] }); |
| next | const | 49 | no | const next = buildCatalogueSnapshot({ previous: first, sources: [source(REV1)] }); |
| delta | const | 50 | no | const delta = diffCatalogueSnapshots(first, next); |
| db | const | 62 | no | const db = { prepare(sql) { assert.match(sql, /FROM semantic_id/); return { all: () =&gt; [{ id: &#39;one@1&#39;, kind: &#39;capability&#39;, status: &#39;current&#39;, authority: &#39;owner&#39;, provenance: &#39;doc:1&#39; }, { id: &#39;two@2&#39;,… |
| snap | const | 63 | no | const snap = snapshotHqSemanticIds(db, { repoRevision: REV0 }); |
| rows | const | 70 | no | const rows = Array.from({ length: 10_000 }, (_, i) =&gt; item(i)); |
| start | const | 71 | no | const start = performance.now(); |
| snap | const | 72 | no | const snap = buildCatalogueSnapshot({ sources: [source()], records: rows }); |
| delta | const | 73 | no | const delta = diffCatalogueSnapshots(null, snap); |
| replayed | const | 74 | no | const replayed = replayCatalogueDelta(null, delta); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| node:perf_hooks | import | 8 | external |
| ../lib/catalogue-delta.mjs | import | 9 | [hq/lib/catalogue-delta.mjs](../lib/catalogue-delta.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | C4 HQ catalogue export acceptance, provenance, replay, denial, scale and recovery tests. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | VIVIM-C4-LANE-C |

## Excerpt

```javascript
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
```

_First 80 of 81 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
