import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA, createDeviceKnowledgeSnapshotAdapter,
  type DeviceKnowledgeSnapshot,
} from '../../src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts';
import type { KnowledgeQuery, TrustedKnowledgeContext } from '../../src/visual-runtime/knowledge/client.ts';
import type { ScopedFeedCard, ScopedFeedResult, ScopedKnowledgeFeed, SourceFeedNotice } from '../../src/visual-runtime/knowledge/wave3-feed-projection.ts';

/** Explicitly synthetic boundary: no live HQ broker, token or physical device. */
const NOW = Date.parse('2026-11-07T00:00:00.000Z');
const ID = 'kn_f452af3';
const RESTRICTED = 'kn_s3_4f2e';
const card = (changes: Partial<ScopedFeedCard> = {}): ScopedFeedCard => ({
  stableId: ID, projectRef: 'project_one', kind: 'project_note', title: 'Workspace project',
  summary: 'Authorized summary only', statusLabel: 'Observed (not an authorization)',
  provenanceLabel: 'synthetic.corpus/1', sourceVersion: 'rev-3', asOf: new Date(NOW - 60000).toISOString(),
  interactive: false, availability: 'present', claimStatus: 'observed', sensitivity: 'enforced-upstream-not-disclosed',
  source: { authority: 'fixture.hq', nativeId: 'record_one', nativeVersion: 'rev-3', digest: 'sha256:synthetic-a' },
  evidenceRefs: ['fixture-evidence:one'], provenance: ['synthetic.corpus/1'], ...changes,
});
const ok = (cards: readonly ScopedFeedCard[] = [card()], overrides: Partial<ScopedFeedResult> = {}): ScopedFeedResult => ({
  state: 'ready', reason: 'NONE', cards, changes: [], removedStableIds: [],
  projectionRevision: 'fixture-epoch-1', asOf: new Date(NOW).toISOString(), ...overrides,
});
const ctx = (surface: 'pc' | 'android', overrides: Partial<TrustedKnowledgeContext> = {}): TrustedKnowledgeContext => ({
  ownerRef: 'owner_a', sessionRef: 'session_a', deviceRef: surface === 'pc' ? 'desktop_1' : 'phone_1',
  personalWorldRef: 'world_a', surface, allowedPurposes: ['task', 'help'], allowPhoneS1: false,
  policyRevision: 'policy_1', sessionExpiresAt: NOW + 60000, grantExpiresAt: NOW + 30000,
  revoked: false, offline: false, ...overrides,
});
const query = (surface: 'pc' | 'android', overrides: Partial<KnowledgeQuery> = {}): KnowledgeQuery => ({
  schema: 'vivim.knowledge-query/1', requestId: 'request_a', personalWorldRef: 'world_a',
  purpose: 'task', surface, query: 'Workspace project', limit: 50, ...overrides,
});
const boundary = (surface: 'pc' | 'android', result: ScopedFeedResult = ok()) => {
  let context: TrustedKnowledgeContext | null = ctx(surface);
  let current = result;
  let count = 0;
  let cleared = 0;
  const hints: SourceFeedNotice[] = [];
  const feed: ScopedKnowledgeFeed = {
    poll: async () => { count++; return current; },
    resnapshot: async () => { count++; return current; },
    notice: hint => { hints.push(hint); },
    clear: () => { cleared++; },
  };
  const broker = { readContext: () => context };
  const adapter = createDeviceKnowledgeSnapshotAdapter(feed, broker, { surface, now: () => NOW });
  return {
    adapter, broker, setContext: (next: TrustedKnowledgeContext | null) => { context = next; },
    setResult: (next: ScopedFeedResult) => { current = next; },
    metrics: () => ({ count, cleared, hints }), feed,
  };
};
function noPrivate(snapshot: DeviceKnowledgeSnapshot): void {
  assert.deepEqual(snapshot.cards, []);
  assert.deepEqual(snapshot.removedStableIds, []);
  assert.equal(snapshot.projectionRevision, null);
  assert.equal(snapshot.asOf, null);
  assert.equal(snapshot.expiresAt, null);
  assert.ok(!('nextCursor' in snapshot));
  assert.ok(!JSON.stringify(snapshot).includes(RESTRICTED));
  assert.ok(!JSON.stringify(snapshot).includes('owner_'));
}

test('PC and Android preserve ONE canonical project identity, native source version, evidence and provenance', async () => {
  const pc = await boundary('pc').adapter.poll(query('pc'));
  const android = await boundary('android').adapter.poll(query('android'));
  assert.equal(pc.schema, DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA);
  assert.deepEqual(android.cards, pc.cards);
  assert.equal(pc.cards[0]?.stableId, ID);
  assert.equal(pc.cards[0]?.source.nativeVersion, 'rev-3');
  assert.equal(pc.cards[0]?.source.nativeId, 'record_one');
  assert.equal(pc.cards[0]?.projectRef, 'project_one');
  assert.equal(pc.cards[0]?.source.digest, 'sha256:synthetic-a');
  assert.equal(pc.cards[0]?.evidenceRefs[0], 'fixture-evidence:one');
  assert.equal(pc.cards[0]?.interactive, false);
  assert.ok(!('execute' in pc.cards[0]!));
  assert.equal(pc.retainOffline, false);
  assert.equal(pc.replace, false);
  assert.equal(pc.expiresAt, new Date(NOW + 30000).toISOString());
  assert.ok(!JSON.stringify(pc).includes('session_a'));
});

test('changed source version is reported, never synthesized or confused with projection revision', async () => {
  const b = boundary('android');
  assert.equal((await b.adapter.poll(query('android'))).cards[0]?.sourceVersion, 'rev-3');
  b.setResult(ok([card({ sourceVersion: 'rev-4', source: { ...card().source, nativeVersion: 'rev-4' } })], { projectionRevision: 'fixture-epoch-2' }));
  const after = await b.adapter.poll(query('android'));
  assert.equal(after.cards[0]?.sourceVersion, 'rev-4');
  assert.equal(after.cards[0]?.stableId, ID);
  assert.equal(after.projectionRevision, 'fixture-epoch-2');
});

test('redaction, availability and stale observation stay explicit with no invented private marker', async () => {
  const b = boundary('pc', ok([card({ availability: 'stale', asOf: new Date(NOW - 4 * 86400000).toISOString() })], { state: 'partial' }));
  const value = await b.adapter.poll(query('pc'));
  assert.equal(value.state, 'partial');
  assert.equal(value.cards[0]?.freshness, 'stale');
  assert.equal(value.cards[0]?.availability, 'stale');
  assert.equal((await boundary('android', ok([])).adapter.poll(query('android'))).cards.length, 0);
});

test('revoked phone is a uniform empty response and never queries or leaks hidden existence/count', async () => {
  const b = boundary('android', ok([card({ stableId: RESTRICTED, title: 'Private S3 name' })]));
  b.setContext(ctx('android', { revoked: true }));
  noPrivate(await b.adapter.poll(query('android', { entityRef: RESTRICTED, query: undefined })));
  noPrivate(await b.adapter.poll(query('android', { query: 'Private S3 name' })));
  assert.equal(b.metrics().count, 0);
});

test('revocation after visible snapshot purges and never republishes stale private cache', async () => {
  const b = boundary('android');
  assert.equal((await b.adapter.poll(query('android'))).cards.length, 1);
  b.setContext(ctx('android', { revoked: true }));
  noPrivate(await b.adapter.poll(query('android')));
  assert.ok(b.metrics().cleared > 0);
});

test('phone cannot pose as desktop or query foreign world or denied purpose', async () => {
  const b = boundary('android');
  for (const req of [query('pc'), query('android', { personalWorldRef: 'world_foreign' }), query('android', { purpose: 'explain' })]) {
    noPrivate(await b.adapter.poll(req));
  }
  assert.equal(b.metrics().count, 0);
});

test('client-supplied bearer token field and unbounded query/search fail before discovery', async () => {
  const b = boundary('android');
  for (const req of [
    { ...query('android'), accessToken: 'secret_bearer' } as KnowledgeQuery,
    query('android', { limit: 51 }), query('android', { cursor: 'a'.repeat(129) }),
    query('android', { query: 'x'.repeat(257) }),
    query('android', { kinds: ['project_note', 'project_note'] }),
  ]) noPrivate(await b.adapter.poll(req));
  assert.equal(b.metrics().count, 0);
});

test('expired grant, expired session and absent trusted broker are indistinguishable from other denials', async () => {
  for (const c of [ctx('android', { grantExpiresAt: NOW }), ctx('android', { sessionExpiresAt: NOW }), null]) {
    const b = boundary('android');
    b.setContext(c);
    const snapshot = await b.adapter.poll(query('android'));
    assert.equal(snapshot.state, 'denied');
    noPrivate(snapshot);
    assert.equal(b.metrics().count, 0);
  }
});

test('offline read refuses old cards and requests UI purge, then resnapshot must re-read upstream', async () => {
  const b = boundary('android');
  await b.adapter.poll(query('android'));
  b.setContext(ctx('android', { offline: true }));
  const offline = await b.adapter.poll(query('android'));
  noPrivate(offline);
  assert.equal(offline.replace, true);
  b.setContext(ctx('android'));
  b.setResult(ok([]));
  assert.deepEqual((await b.adapter.resnapshot(query('android'))).cards, []);
});

test('policy revision, session identity and device changes mid-flight invalidate an in-flight response', async () => {
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  let context: TrustedKnowledgeContext | null = ctx('android');
  const feed: ScopedKnowledgeFeed = { poll: async () => { await gate; return ok(); }, resnapshot: async () => ok(), notice: () => {}, clear: () => {} };
  const adapter = createDeviceKnowledgeSnapshotAdapter(feed, { readContext: () => context }, { surface: 'android', now: () => NOW });
  const pending = adapter.poll(query('android'));
  context = ctx('android', { policyRevision: 'policy_2' });
  release();
  const got = await pending;
  assert.equal(got.state, 'denied');
  noPrivate(got);
  context = ctx('android', { deviceRef: 'phone_evil' });
  noPrivate(await adapter.resnapshot(query('android')));
});

test('rebind attempt to another owner/session/device requires a new trusted adapter instance', async () => {
  const b = boundary('android');
  assert.equal((await b.adapter.poll(query('android'))).state, 'ready');
  for (const next of [ctx('android', { ownerRef: 'owner_b' }), ctx('android', { sessionRef: 'session_b' }), ctx('android', { deviceRef: 'phone_2' })]) {
    b.setContext(next);
    noPrivate(await b.adapter.poll(query('android')));
  }
});

test('upstream S2/S3 and foreign-source filtering is a required read-port boundary, not a fabricated Lane F sensitivity grant', async () => {
  const b = boundary('android', ok([])); // represents already-authorized upstream fixture result
  const snapshot = await b.adapter.poll(query('android', { query: 'Private S3 name' }));
  assert.equal(snapshot.state, 'ready');
  assert.equal(snapshot.cards.length, 0);
  assert.ok(!JSON.stringify(snapshot).includes(RESTRICTED));
  assert.ok(!('totalCount' in snapshot));
});

test('a forged S2 classification through the projection port fails closed (upstream must enforce row sensitivity)', async () => {
  const b = boundary('android', ok([card({ sensitivity: 'S2' as never })]));
  noPrivate(await b.adapter.poll(query('android')));
  assert.equal(b.metrics().cleared, 1);
});

test('unexpected redacted marker and malformed provenance cannot reveal hidden item identities', async () => {
  for (const mutation of [
    { availability: 'redacted' as never }, { provenance: [] },
    { provenance: ['javascript:alert(1)'] }, { provenance: ['&lt;script&gt;bad'] },
    { source: { authority: 'fixture.hq', nativeId: 'record_one', nativeVersion: 'rev-3', digest: 'data:text/html,secret' } },
    { interactive: true as never },
  ]) {
    const b = boundary('android', ok([card(mutation)]));
    const got = await b.adapter.poll(query('android'));
    assert.equal(got.state, 'unavailable');
    noPrivate(got);
  }
});

test('malicious extra action and token fields are dropped by allowlist on otherwise authorized card', async () => {
  const injected = { ...card(), execute: () => 'bad', bearer: 'secret_bearer', grantId: 'grant_secret' } as ScopedFeedCard;
  const got = await boundary('pc', ok([injected])).adapter.poll(query('pc'));
  assert.equal(got.state, 'ready');
  for (const term of ['secret_bearer', 'grant_secret', 'execute', 'bearer', 'grantId']) assert.ok(!JSON.stringify(got).includes(term));
});

test('source version mismatch, duplicate IDs, overlapping tombstones and overlimit pages fail closed', async () => {
  const variants = [
    ok([card({ sourceVersion: 'rev-4' })]),
    ok([card(), card()]),
    ok([card()], { removedStableIds: [ID] }),
    ok(Array.from({ length: 51 }, () => card())),
  ];
  for (const value of variants) {
    const got = await boundary('android', value).adapter.poll(query('android'));
    assert.equal(got.state, 'unavailable');
    noPrivate(got);
  }
});

test('stale/future upstream projection is not shown and must purge old view', async () => {
  for (const asOf of [new Date(NOW - 61000).toISOString(), new Date(NOW + 6000).toISOString()]) {
    const b = boundary('android', ok([card()], { asOf }));
    const got = await b.adapter.poll(query('android'));
    assert.equal(got.state, 'unavailable');
    noPrivate(got);
  }
});

test('notice gaps, replay and tombstone require source-driven resnapshot rather than stale replay', async () => {
  const b = boundary('android');
  await b.adapter.poll(query('android'));
  b.adapter.notice({ sequence: 2, kind: 'tombstone' });
  b.setResult({ ...ok([]), state: 'resnapshot-required', reason: 'RESNAPSHOT_REQUIRED' });
  const gap = await b.adapter.poll(query('android'));
  assert.equal(gap.state, 'resnapshot-required');
  noPrivate(gap);
  b.setResult(ok([]));
  const snapshot = await b.adapter.resnapshot(query('android'));
  assert.equal(snapshot.state, 'ready');
  assert.equal(snapshot.replace, true);
  assert.deepEqual(snapshot.cards, []);
  b.adapter.notice({ sequence: 1, kind: 'changed' });
  assert.deepEqual(b.metrics().hints.map(h => h.sequence), [2, 1]);
});

test('removed stable IDs are scoped, bounded and omitted entirely after revocation', async () => {
  const b = boundary('pc', ok([], { removedStableIds: [ID] }));
  assert.deepEqual((await b.adapter.poll(query('pc'))).removedStableIds, [ID]);
  b.setContext(ctx('pc', { revoked: true }));
  noPrivate(await b.adapter.poll(query('pc')));
});

test('cursor passthrough is opaque and accepted only with authenticated current scope; denied result has none', async () => {
  const b = boundary('android', ok([card()], { nextCursor: 'kc_opaque' }));
  assert.equal((await b.adapter.poll(query('android'))).nextCursor, 'kc_opaque');
  b.setResult({ ...ok(), state: 'denied', reason: 'ACCESS_DENIED', nextCursor: 'kc_opaque' });
  noPrivate(await b.adapter.poll(query('android', { cursor: 'kc_opaque' })));
});

test('later read supersedes earlier read and cannot resurrect previously projected data', async () => {
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  let n = 0;
  const feed: ScopedKnowledgeFeed = {
    poll: async () => { if (++n === 1) await gate; return ok(); },
    resnapshot: async () => ok([]), notice: () => {}, clear: () => {},
  };
  const adapter = createDeviceKnowledgeSnapshotAdapter(feed, { readContext: () => ctx('pc') }, { surface: 'pc', now: () => NOW });
  const first = adapter.poll(query('pc'));
  assert.equal((await adapter.resnapshot(query('pc'))).state, 'ready');
  release();
  noPrivate(await first);
});

test('invalid constructor bounds and missing broker/read port reject immediately', () => {
  const b = boundary('pc');
  for (const value of [-1, 0, 60001, Number.NaN]) {
    assert.throws(() => createDeviceKnowledgeSnapshotAdapter(b.feed, b.broker, { surface: 'pc', maxProjectionAgeMs: value }));
  }
  assert.throws(() => createDeviceKnowledgeSnapshotAdapter({} as never, b.broker, { surface: 'pc' }));
  assert.throws(() => createDeviceKnowledgeSnapshotAdapter(b.feed, {} as never, { surface: 'pc' }));
});
