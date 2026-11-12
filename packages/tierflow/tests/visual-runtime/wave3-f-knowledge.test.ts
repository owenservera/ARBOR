import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFixtureKnowledgeClient, type CanonicalKnowledgeRecord, type KnowledgeClient,
  type KnowledgeQuery, type TrustedKnowledgeContext,
} from '../../src/visual-runtime/knowledge/client.ts';
import { createScopedKnowledgeFeed } from '../../src/visual-runtime/knowledge/wave3-feed-projection.ts';

const NOW = Date.parse('2026-11-06T17:00:00.000Z');
const ID = { alpha: 'kn_8f3a0c71', beta: 'kn_3c6f10ba', foreign: 'kn_8d2936aa', otherWorld: 'kn_7121ddac',
  restricted: 'kn_001277c0', redacted: 'kn_877efac4', stale: 'kn_9ae15b18', secret: 'kn_4ddad7b0' } as const;
const record = (stableId: string, title: string, opts: Partial<CanonicalKnowledgeRecord> = {}): CanonicalKnowledgeRecord => ({
  stableId, ownerRef: 'owner_a', personalWorldRef: 'world_a', projectRef: 'project_one', kind: 'project_note',
  label: title, summary: `Observed fixture note for ${title}`, path: 'src/README.md',
  availability: 'present', claimStatus: 'observed', sensitivity: 'S0',
  source: { authority: 'fixture.hq', nativeId: stableId, nativeVersion: 'rev-3', digest: `sha256:synthetic-${stableId}` },
  evidenceRefs: [`fixture-evidence:${stableId}`], provenance: ['synthetic.corpus/1'],
  asOf: '2026-11-06T12:00:00.000Z', ...opts,
});
const rows = (): CanonicalKnowledgeRecord[] => [
  record(ID.alpha, 'Shared project path'),
  record(ID.beta, 'Shared project path', { projectRef: 'project_two' }),
  record(ID.foreign, 'Foreign-only marker 9347', { ownerRef: 'owner_b' }),
  record(ID.otherWorld, 'Other-world-only marker 4871', { personalWorldRef: 'world_b' }),
  record(ID.restricted, 'Device-only project', { allowedDeviceRefs: ['desktop_1'] }),
  record(ID.redacted, 'Forbidden source existence', { availability: 'redacted' }),
  record(ID.stale, 'Old project evidence', { availability: 'stale' }),
  record(ID.secret, 'Secret material', { sensitivity: 'S3' }),
];
const trusted = (overrides: Partial<TrustedKnowledgeContext> = {}): TrustedKnowledgeContext => ({
  ownerRef: 'owner_a', sessionRef: 'session_1', deviceRef: 'desktop_1', personalWorldRef: 'world_a',
  surface: 'pc', allowedPurposes: ['task', 'explain', 'help'], allowPhoneS1: false, policyRevision: 'policy_1',
  sessionExpiresAt: NOW + 1_000_000, grantExpiresAt: NOW + 1_000_000, revoked: false, offline: false, ...overrides,
});
const request = (overrides: Partial<KnowledgeQuery> = {}): KnowledgeQuery => ({
  schema: 'vivim.knowledge-query/1', requestId: 'request_1', personalWorldRef: 'world_a',
  surface: 'pc', purpose: 'task', query: 'Shared project path', limit: 50, ...overrides,
});
function setup(input = rows()) {
  let ctx: TrustedKnowledgeContext | null = trusted();
  const broker = { readContext: () => ctx };
  const client = createFixtureKnowledgeClient(input, broker, { now: () => NOW });
  const feed = createScopedKnowledgeFeed(client, broker, { now: () => NOW });
  return { feed, client, broker, setContext: (next: TrustedKnowledgeContext | null) => { ctx = next; } };
}
function noPrivateData(value: unknown): void {
  const raw = JSON.stringify(value);
  for (const term of ['Foreign-only', 'Other-world-only', 'Forbidden source', ID.foreign, ID.otherWorld, ID.redacted, 'fixture-evidence:']) {
    assert.ok(!raw.includes(term), `denial/empty response leaked ${term}`);
  }
}

test('positive: scoped Founder Workspace cards retain exact IDs, source versions, evidence and no authority handles', async () => {
  const { feed } = setup();
  const result = await feed.poll(request());
  assert.equal(result.state, 'ready');
  assert.equal(result.reason, 'NONE');
  assert.deepEqual(result.cards.map(c => c.stableId).sort(), [ID.alpha, ID.beta].sort());
  assert.deepEqual(result.cards.map(c => c.projectRef).sort(), ['project_one', 'project_two']);
  assert.ok(result.cards.every(c => c.source.nativeVersion === 'rev-3' && c.source.authority === 'fixture.hq'));
  assert.ok(result.cards.every(c => c.source.digest && c.evidenceRefs.length === 1 && c.provenance[0] === 'synthetic.corpus/1' && c.asOf));
  assert.ok(result.cards.every(c => c.interactive === false && c.sensitivity === 'enforced-upstream-not-disclosed'));
  assert.ok(result.cards.every(c => !('execute' in c) && !('permission' in c) && !('actionRefs' in c)));
  assert.equal(result.changes.length, 2);
  assert.deepEqual((await feed.poll(request())).changes, []);
});

test('positive: source-backed changed notice produces a bounded update, then explicit resnapshot', async () => {
  const { client, broker } = setup();
  let revision = 3;
  const readOnlyVersionedClient: KnowledgeClient = {
    query: async q => {
      const page = await client.query(q);
      return { ...page, items: page.items.map(item => item.stableId === ID.alpha ? {
        ...item, label: revision === 3 ? item.label : 'Project milestone observed',
        source: { ...item.source, nativeVersion: `rev-${revision}` },
      } : item) };
    },
  };
  const feed = createScopedKnowledgeFeed(readOnlyVersionedClient, broker, { now: () => NOW });
  assert.equal((await feed.poll(request())).changes.length, 2);
  revision = 4;
  feed.notice({ sequence: 1, kind: 'changed' });
  const updated = await feed.poll(request());
  assert.equal(updated.state, 'ready');
  assert.deepEqual(updated.changes.map(c => [c.kind, c.card.stableId, c.card.source.nativeVersion]), [['updated', ID.alpha, 'rev-4']]);
  assert.equal(updated.changes[0]?.card.evidenceRefs[0], `fixture-evidence:${ID.alpha}`);
  const full = await feed.resnapshot(request());
  assert.equal(full.cards.length, 2);
  assert.equal(full.changes.length, 2);
  assert.equal(full.cards.find(c => c.stableId === ID.alpha)?.source.nativeVersion, 'rev-4');
});

test('cross-owner/world facts are not surfaced or counted, including existence-only probes', async () => {
  const { feed } = setup();
  for (const term of ['Foreign-only', 'Other-world-only', 'Forbidden source']) {
    const result = await feed.poll(request({ query: term }));
    assert.equal(result.state, 'ready');
    assert.equal(result.cards.length, 0);
    noPrivateData(result);
  }
  noPrivateData(await feed.poll(request({ entityRef: ID.foreign, query: undefined })));
});

test('revoked owner, expired grant and missing broker all return uniformly empty and purge comparisons', async () => {
  const { feed, setContext } = setup();
  await feed.poll(request());
  for (const context of [trusted({ revoked: true }), trusted({ grantExpiresAt: NOW - 1 }), null]) {
    setContext(context);
    const result = await feed.poll(request());
    assert.equal(result.state, 'denied');
    assert.deepEqual(result.cards, []);
    assert.deepEqual(result.changes, []);
    assert.equal(result.projectionRevision, null);
    noPrivateData(result);
  }
  setContext(trusted());
  assert.equal((await feed.poll(request())).changes.length, 2); // not cached after revoke
});

test('revoked device, surface, purpose and personal world never call source before authorization', async () => {
  const { feed, client, setContext } = setup();
  const count = client.fixtureMetrics().discoveryScans;
  setContext(trusted({ deviceRef: '' }));
  assert.equal((await feed.poll(request())).state, 'denied');
  setContext(trusted());
  for (const q of [request({ personalWorldRef: 'world_b' }), request({ purpose: 'help', surface: 'android' })]) {
    assert.equal((await feed.poll(q)).state, 'denied');
  }
  setContext(trusted({ allowedPurposes: ['help'] }));
  assert.equal((await feed.poll(request())).state, 'denied');
  assert.equal(client.fixtureMetrics().discoveryScans, count);
});

test('android privacy: S3, S2 and device-restricted records cannot cross the trusted read port', async () => {
  const { feed, setContext } = setup();
  setContext(trusted({ deviceRef: 'phone_1', surface: 'android', allowPhoneS1: true }));
  const q = request({ surface: 'android', query: 'Secret material' });
  const response = await feed.poll(q);
  assert.equal(response.state, 'ready');
  assert.deepEqual(response.cards, []);
  assert.equal((await feed.poll(request({ surface: 'android', query: 'Device-only project' }))).cards.length, 0);
});

test('redacted marker never discloses source count or label, even with a redaction-marker policy', async () => {
  const { feed, setContext } = setup();
  assert.deepEqual((await feed.poll(request({ query: 'Forbidden source' }))).cards, []);
  setContext(trusted({ maySeeRedactedMarkers: true }));
  const output = await feed.poll(request({ query: 'Forbidden source' }));
  // Existing Wave 2 broker emits a marker; F rejects that incomplete evidence entirely.
  assert.equal(output.state, 'unavailable');
  assert.deepEqual(output.cards, []);
  noPrivateData(output);
});

test('stale source renders partial with observed as-of and never asserted as current authority', async () => {
  const { feed } = setup();
  const result = await feed.poll(request({ query: 'Old project evidence' }));
  assert.equal(result.state, 'partial');
  assert.equal(result.cards[0]?.availability, 'stale');
  assert.match(result.cards[0]?.statusLabel ?? '', /stale/i);
  assert.equal(result.cards[0]?.source.nativeVersion, 'rev-3');
});

test('offline transition cannot replay previously visible private snapshot and recovery re-queries', async () => {
  const { feed, setContext, client } = setup();
  await feed.poll(request());
  setContext(trusted({ offline: true }));
  const output = await feed.poll(request());
  assert.equal(output.state, 'unavailable');
  assert.equal(output.cards.length, 0);
  assert.equal(output.asOf, null);
  noPrivateData(output);
  client.applyFixtureSourceEvent({ type: 'tombstone', stableId: ID.alpha });
  setContext(trusted());
  assert.deepEqual((await feed.poll(request())).cards.map(c => c.stableId), [ID.beta]);
});

test('tombstone forces explicit source resnapshot; never resurrect deleted stable ID', async () => {
  const { feed, client } = setup();
  assert.equal((await feed.poll(request())).cards.length, 2);
  client.applyFixtureSourceEvent({ type: 'tombstone', stableId: ID.alpha });
  feed.notice({ sequence: 1, kind: 'tombstone' });
  const pending = await feed.poll(request());
  assert.equal(pending.state, 'resnapshot-required');
  noPrivateData(pending);
  const next = await feed.resnapshot(request());
  assert.deepEqual(next.cards.map(c => c.stableId), [ID.beta]);
  assert.equal(next.changes.length, 1);
});

test('KB record revocation and source reset force empty intermediary and re-read', async () => {
  const { feed, client } = setup();
  await feed.poll(request());
  client.applyFixtureSourceEvent({ type: 'revoke', stableId: ID.beta });
  feed.notice({ sequence: 1, kind: 'revoked' });
  assert.equal((await feed.poll(request())).state, 'resnapshot-required');
  assert.deepEqual((await feed.resnapshot(request())).cards.map(c => c.stableId), [ID.alpha]);
  client.applyFixtureSourceEvent({ type: 'source-reset' });
  feed.notice({ sequence: 2, kind: 'source-reset' });
  assert.equal((await feed.poll(request())).state, 'resnapshot-required');
  assert.equal((await feed.resnapshot(request())).cards.length, 1);
});

test('feed gap, replay and malformed notice reject all cached data until a fresh snapshot', async () => {
  const { feed } = setup();
  await feed.poll(request());
  feed.notice({ sequence: 2, kind: 'changed' });
  assert.equal((await feed.poll(request())).state, 'resnapshot-required');
  assert.equal((await feed.resnapshot(request())).cards.length, 2);
  feed.notice({ sequence: 1, kind: 'changed' }); // stale/out-of-order
  assert.equal((await feed.poll(request())).state, 'resnapshot-required');
  assert.equal((await feed.resnapshot(request())).cards.length, 2);
  feed.notice({ sequence: Number.MAX_SAFE_INTEGER + 1, kind: 'changed' });
  noPrivateData(await feed.poll(request()));
});

test('unbounded cursor, limit, token replay and changed query are rejected', async () => {
  const { feed } = setup();
  assert.equal((await feed.poll(request({ limit: 51 }))).state, 'denied');
  assert.equal((await feed.poll(request({ cursor: 'x'.repeat(129) }))).state, 'denied');
  assert.equal((await feed.poll(request({ cursor: 'made_up_token' }))).state, 'denied');
  const first = await feed.poll(request({ limit: 1 }));
  assert.ok(first.nextCursor);
  const second = await feed.poll(request({ limit: 1, cursor: first.nextCursor }));
  assert.equal(second.cards.length, 1);
  const replay = await feed.poll(request({ limit: 1, cursor: first.nextCursor }));
  assert.equal(replay.state, 'denied');
  noPrivateData(replay);
});

test('client returning forged evidence, hidden records, over-limit or wrong schema fails closed', async () => {
  const { client, broker } = setup();
  const base = await client.query(request());
  const variations = [
    { ...base, items: [{ ...base.items[0]!, provenance: [] }] },
    { ...base, items: [{ ...base.items[0]!, evidenceRefs: [] }] },
    { ...base, items: [{ ...base.items[0]!, visibility: 'redacted' as const }] },
    { ...base, items: [base.items[0]!, base.items[0]!] },
    { ...base, items: [...base.items, ...base.items] },
    { ...base, schema: 'forged' as typeof base.schema },
    { ...base, projectionRevision: null },
  ];
  for (const result of variations) {
    const feed = createScopedKnowledgeFeed({ query: async () => result }, broker, { now: () => NOW });
    const output = await feed.poll(request());
    assert.equal(output.state, 'unavailable');
    assert.deepEqual(output.cards, []);
    noPrivateData(output);
  }
});

test('inert projection HTML escaping and source provenance stay safe', async () => {
  const { feed } = setup([record(ID.alpha, '<script>alert(1)</script>', {
    summary: '<img src=x onerror=bad()>', provenance: ['origin<&>'],
  })]);
  const output = await feed.poll(request({ entityRef: ID.alpha, query: undefined }));
  assert.equal(output.state, 'ready');
  const card = output.cards[0]!;
  assert.ok(card.title.includes('&lt;script&gt;'));
  assert.ok(card.summary.includes('&lt;img'));
  assert.ok(card.provenance[0]?.includes('&lt;&amp;&gt;'));
  assert.equal(card.interactive, false);
});

test('mid-flight revocation cannot publish a response and cannot retain stale comparison', async () => {
  const { client, broker, setContext } = setup();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const feed = createScopedKnowledgeFeed({ query: async q => { await gate; return client.query(q); } }, broker, { now: () => NOW });
  const pending = feed.poll(request());
  setContext(trusted({ revoked: true }));
  release();
  const output = await pending;
  assert.equal(output.state, 'denied');
  assert.deepEqual(output.cards, []);
  setContext(trusted());
  assert.equal((await feed.poll(request())).changes.length, 2);
});

test('concurrent older response cannot overwrite a newer authorized poll', async () => {
  const { client, broker } = setup();
  let release!: () => void;
  const slow = new Promise<void>(r => { release = r; });
  let call = 0;
  const feed = createScopedKnowledgeFeed({ query: async q => { if (++call === 1) await slow; return client.query(q); } }, broker, { now: () => NOW });
  const old = feed.poll(request());
  const newest = await feed.poll(request());
  release();
  assert.equal(newest.state, 'ready');
  assert.equal((await old).state, 'denied');
  assert.equal((await feed.poll(request())).changes.length, 0);
});

test('untrusted notice payload cannot inject a KB row or action', async () => {
  const { feed } = setup();
  await feed.poll(request());
  feed.notice({ sequence: 1, kind: 'changed', injected: record('kn_injected', 'Fake authority') } as never);
  const next = await feed.poll(request());
  assert.equal(next.state, 'ready');
  assert.equal(next.cards.length, 2);
  assert.ok(!JSON.stringify(next).includes('Fake authority'));
});
