import test from 'node:test';
import assert from 'node:assert/strict';
import { KNOWLEDGE_PRESENTATION_SCHEMA, createKnowledgePresentation } from '../../../../src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts';
import type { KnowledgeQuery, TrustedKnowledgeContext } from '../../../../src/visual-runtime/knowledge/client.ts';
import type { ScopedFeedCard, ScopedFeedResult, ScopedKnowledgeFeed, SourceFeedNotice } from '../../../../src/visual-runtime/knowledge/wave3-feed-projection.ts';
import type { CapabilityDescriptor } from '../../../../src/visual-runtime/experience/help.ts';

/** Fixture facts are synthetic. No live HQ, Host, device or user-data claims. */
const NOW = Date.parse('2026-11-07T00:00:00.000Z');
const SECRET = 'PRIVATE_ONLY_MARKER_739';
const fact = (patch: Partial<ScopedFeedCard> = {}): ScopedFeedCard => ({
  stableId: 'kn_allowed', projectRef: 'project_a', kind: 'project_note', title: 'Public project',
  summary: 'Source-backed, authorized summary', statusLabel: 'Observed (not an authorization)',
  provenanceLabel: 'synthetic.corpus/1', sourceVersion: 'revision_3', asOf: new Date(NOW - 1000).toISOString(),
  availability: 'present', claimStatus: 'observed', sensitivity: 'enforced-upstream-not-disclosed',
  source: { authority: 'hq_fixture', nativeId: 'native_1', nativeVersion: 'revision_3', digest: 'sha256:fixture-1' },
  evidenceRefs: ['fixture_evidence_1'], provenance: ['synthetic.corpus/1'], interactive: false,
  ...patch,
});
const page = (cards: readonly ScopedFeedCard[] = [fact()], patch: Partial<ScopedFeedResult> = {}): ScopedFeedResult => ({
  state: 'ready', reason: 'NONE', cards, changes: [], removedStableIds: [],
  projectionRevision: 'projection_1', asOf: new Date(NOW).toISOString(), ...patch,
});
const context = (surface: 'pc' | 'android', patch: Partial<TrustedKnowledgeContext> = {}): TrustedKnowledgeContext => ({
  ownerRef: 'owner_a', personalWorldRef: 'world_a', sessionRef: 'session_a',
  deviceRef: surface === 'pc' ? 'pc_a' : 'android_a', surface,
  allowedPurposes: ['task', 'help', 'explain'], policyRevision: 'policy_1',
  sessionExpiresAt: NOW + 90000, grantExpiresAt: NOW + 60000,
  revoked: false, offline: false, allowPhoneS1: false, ...patch,
});
const request = (surface: 'pc' | 'android', patch: Partial<KnowledgeQuery> = {}): KnowledgeQuery => ({
  schema: 'vivim.knowledge-query/1', requestId: 'req_1', personalWorldRef: 'world_a',
  surface, purpose: 'task', query: 'project', limit: 10, ...patch,
});
const capability = (patch: Partial<CapabilityDescriptor> = {}): CapabilityDescriptor => ({
  actionId: 'ui.publish', title: 'Publish UI', explanation: 'Publish requires a reviewed owner grant.',
  authority: 'host', sourceVersion: 'catalog_5', sourceDigest: 'catalog_digest_5',
  observedAt: new Date(NOW).toISOString(), surface: 'both', risk: 'R1', disclosure: 'public',
  readiness: { supportedByBuild: 'yes', availableNow: 'yes', permittedForActor: 'no', verifiedByEvidence: 'no' },
  prerequisites: ['Review preview'], requiredScopes: ['ui.publish'], errorCodes: ['OWNER_APPROVAL_REQUIRED'],
  textCommand: 'preview panel', ...patch,
});
function fixture(surface: 'pc' | 'android', initial = page()) {
  let bound: TrustedKnowledgeContext | null = context(surface);
  let current = initial;
  let polls = 0;
  let clears = 0;
  let capabilityReads = 0;
  const notices: SourceFeedNotice[] = [];
  const feed: ScopedKnowledgeFeed = {
    poll: async () => { polls++; return current; },
    resnapshot: async () => { polls++; return current; },
    notice: hint => { notices.push(hint); }, clear: () => { clears++; },
  };
  const broker = { readContext: () => bound };
  const port = createKnowledgePresentation(feed, broker, {
    surface, now: () => NOW, capabilityReader: {
      read: async id => { capabilityReads++; return id === 'ui.publish' ? capability() : null; },
    },
  });
  return { port, broker, feed, setContext: (x: TrustedKnowledgeContext | null) => { bound = x; },
    setPage: (x: ScopedFeedResult) => { current = x; },
    metrics: () => ({ polls, clears, capabilityReads, notices }) };
}
function opaque(v: unknown): void {
  const s = JSON.stringify(v);
  assert.ok(!s.includes(SECRET));
  assert.ok(!s.includes('owner_a'));
  assert.ok(!s.includes('session_a'));
  assert.ok(!s.includes('PRIVATE'));
  assert.ok(!s.includes('totalCount'));
  assert.ok(!s.includes('removedStableIds'));
}
function blank(v: Awaited<ReturnType<ReturnType<typeof fixture>['port']['read']>>): void {
  assert.deepEqual(v.cards, []); assert.equal(v.help, null); assert.equal(v.source, null);
  assert.equal(v.replace, true); assert.equal(v.retainOffline, false);
  assert.ok(!('nextCursor' in v)); opaque(v);
}

test('D01 canonical PC/Android read parity: exact stable and source native identity', async () => {
  const pc = await fixture('pc').port.read(request('pc'));
  const phone = await fixture('android').port.read(request('android'));
  assert.equal(pc.schema, KNOWLEDGE_PRESENTATION_SCHEMA);
  assert.equal(pc.state, 'ready');
  assert.deepEqual(pc.cards, phone.cards);
  assert.equal(pc.cards[0]?.stableId, 'kn_allowed');
  assert.equal(pc.cards[0]?.source.nativeId, 'native_1');
  assert.equal(pc.cards[0]?.source.nativeVersion, 'revision_3');
  assert.equal(pc.cards[0]?.source.digest, 'sha256:fixture-1');
  assert.equal(pc.source?.projectionRevision, 'projection_1');
  assert.equal(pc.runnable, false); opaque(pc);
});
test('D02 source version changes without changing stable ID or fabricating revision', async () => {
  const f = fixture('pc');
  await f.port.read(request('pc'));
  f.setPage(page([fact({ sourceVersion: 'revision_4', source: { ...fact().source, nativeVersion: 'revision_4' } })], { projectionRevision: 'projection_2' }));
  const next = await f.port.read(request('pc'));
  assert.equal(next.cards[0]?.stableId, 'kn_allowed');
  assert.equal(next.cards[0]?.source.nativeVersion, 'revision_4');
  assert.equal(next.source?.projectionRevision, 'projection_2');
});
test('D03 negative: revoked phone never discovers or counts hidden records', async () => {
  const f = fixture('android', page([fact({ stableId: 'kn_secret', title: SECRET })]));
  f.setContext(context('android', { revoked: true }));
  const r = await f.port.read(request('android', { query: SECRET }));
  assert.equal(r.state, 'denied'); blank(r); assert.equal(f.metrics().polls, 0);
});
test('D04 negative: foreign world and surface refuse before source read', async () => {
  const f = fixture('android');
  for (const q of [request('android', { personalWorldRef: 'world_foreign' }), request('pc')]) blank(await f.port.read(q));
  assert.equal(f.metrics().polls, 0);
});
test('D05 negative: denied help purpose never queries source or capability', async () => {
  const f = fixture('android');
  f.setContext(context('android', { allowedPurposes: ['task'] }));
  blank(await f.port.read(request('android', { purpose: 'help' }), { actionId: 'ui.publish' }));
  assert.equal(f.metrics().polls, 0); assert.equal(f.metrics().capabilityReads, 0);
});
test('D06 negative: offline existing fact must be purged, never retained', async () => {
  const f = fixture('android');
  assert.equal((await f.port.read(request('android'))).cards.length, 1);
  f.setContext(context('android', { offline: true }));
  blank(await f.port.read(request('android')));
  assert.ok(f.metrics().clears >= 1);
});
test('D07 negative: grant/session expiry and missing broker are opaque', async () => {
  for (const next of [context('pc', { grantExpiresAt: NOW }), context('pc', { sessionExpiresAt: NOW }), null]) {
    const f = fixture('pc'); f.setContext(next);
    blank(await f.port.read(request('pc')));
    assert.equal(f.metrics().polls, 0);
  }
});
test('D08 tombstone notice and source deletion replace view without deleted-ID disclosure', async () => {
  const f = fixture('pc');
  await f.port.read(request('pc'));
  f.port.notice({ sequence: 1, kind: 'tombstone' });
  f.setPage(page([], { removedStableIds: ['kn_allowed'] }));
  const r = await f.port.read(request('pc'));
  assert.equal(r.cards.length, 0);
  assert.ok(!('removedStableIds' in r));
  assert.equal(r.replace, true);
  assert.equal(f.metrics().notices.length, 1);
});
test('D09 stale evidence is explicitly partial, not silently current', async () => {
  const f = fixture('pc', page([fact({ asOf: new Date(NOW - 9 * 86400000).toISOString(), availability: 'stale' })], { state: 'partial' }));
  const r = await f.port.read(request('pc'));
  assert.equal(r.state, 'partial');
  assert.equal(r.cards[0]?.freshness, 'stale');
  assert.equal(r.runnable, false);
});
test('D10 forged S2/S3 row classification from feed fails closed upstream', async () => {
  const f = fixture('android', page([fact({ sensitivity: 'S3' as never })]));
  const r = await f.port.read(request('android'));
  assert.equal(r.state, 'unavailable'); blank(r);
});
test('D11 malformed provenance and script URL fail closed upstream', async () => {
  for (const patch of [ { provenance: [] }, { provenance: ['javascript:alert(1)'] },
    { source: { ...fact().source, digest: 'data:text/html,token' } }]) {
    const f = fixture('pc', page([fact(patch)]));
    blank(await f.port.read(request('pc')));
  }
});
test('D12 extra executable and bearer fields are dropped at trusted upstream boundary', async () => {
  const f = fixture('pc', page([{ ...fact(), execute: () => 'bad', bearer: SECRET } as ScopedFeedCard]));
  const r = await f.port.read(request('pc'));
  assert.equal(r.state, 'ready'); opaque(r);
  assert.equal('execute' in r.cards[0]!, false);
  assert.equal('bearer' in r.cards[0]!, false);
});
test('D13 invalid client-controlled token and malformed filters refuse before discovery', async () => {
  const f = fixture('android');
  for (const q of [ { ...request('android'), token: SECRET } as KnowledgeQuery,
    request('android', { limit: 999 }), request('android', { query: SECRET, kinds: ['project_note', 'project_note'] }) ]) blank(await f.port.read(q));
  assert.equal(f.metrics().polls, 0);
});
test('D14 source reset signals resnapshot; no old cached card in new response', async () => {
  const f = fixture('android');
  await f.port.read(request('android'));
  f.port.notice({ sequence: 2, kind: 'source-reset' });
  f.setPage(page([]));
  const r = await f.port.read(request('android'));
  assert.deepEqual(r.cards, []);
  assert.equal(r.source?.projectionRevision, 'projection_1');
});
test('D15 denied publisher help is explanatory only and cannot grant execution', async () => {
  const f = fixture('pc');
  const r = await f.port.read(request('pc', { purpose: 'explain' }), { actionId: 'ui.publish', kbStableId: 'kn_allowed' });
  assert.equal(r.help?.visible, true); assert.equal(r.help?.runnable, false);
  assert.equal(r.help?.canRequestPreview, false);
  assert.match(r.help?.whyUnavailable ?? '', /permission/i);
  assert.equal(r.help?.provenance?.kbStableId, 'kn_allowed');
  assert.equal(r.runnable, false);
});
test('D16 fake KB ref cannot probe private evidence or counts in help', async () => {
  const f = fixture('android');
  const r = await f.port.read(request('android', { purpose: 'help' }), { actionId: 'ui.publish', kbStableId: 'kn_private' });
  assert.equal(r.help?.visible, true);
  assert.equal(r.help?.provenance?.kbStableId, undefined);
  assert.equal(JSON.stringify(r).includes('kn_private'), false);
});
test('D17 restricted descriptor without actor permission reveals no help', async () => {
  const f = fixture('pc');
  const port = createKnowledgePresentation(f.feed, f.broker, { surface: 'pc', now: () => NOW,
    capabilityReader: { read: async () => capability({ disclosure: 'restricted' }) } });
  const r = await port.read(request('pc', { purpose: 'help' }), { actionId: 'ui.publish' });
  assert.equal(r.help, null);
});
test('D18 mismatched capability ID and untrusted help request fields cannot leak catalog', async () => {
  const f = fixture('pc');
  const r = await f.port.read(request('pc', { purpose: 'help' }), { actionId: 'other' });
  assert.equal(r.help, null);
  blank(await f.port.read(request('pc'), { actionId: 'ui.publish', secret: SECRET } as never));
});
test('D19 source/projection read with no approved capability reader remains data-only', async () => {
  const f = fixture('pc');
  const p = createKnowledgePresentation(f.feed, f.broker, { surface: 'pc', now: () => NOW });
  const r = await p.read(request('pc', { purpose: 'help' }), { actionId: 'ui.publish' });
  assert.equal(r.help, null); assert.equal(r.runnable, false);
});
test('D20 revoke after feed response, before capability lookup resolution, purges in-flight view', async () => {
  let release!: (v: CapabilityDescriptor) => void;
  const pending = new Promise<CapabilityDescriptor>(r => { release = r; });
  const f = fixture('android');
  const p = createKnowledgePresentation(f.feed, f.broker, { surface: 'android', now: () => NOW,
    capabilityReader: { read: async () => pending } });
  const future = p.read(request('android', { purpose: 'help' }), { actionId: 'ui.publish' });
  await new Promise(resolve => setImmediate(resolve));
  f.setContext(context('android', { revoked: true }));
  release(capability());
  const r = await future;
  assert.equal(r.state, 'denied'); blank(r);
});
test('D21 clear invalidates pending read without replaying disclosure', async () => {
  let release!: (r: ScopedFeedResult) => void;
  const pending = new Promise<ScopedFeedResult>(r => { release = r; });
  const f = fixture('pc');
  const feed: ScopedKnowledgeFeed = { poll: async () => pending, resnapshot: async () => pending,
    notice: () => {}, clear: () => {} };
  const p = createKnowledgePresentation(feed, f.broker, { surface: 'pc', now: () => NOW });
  const outcome = p.read(request('pc'));
  p.clear(); release(page());
  blank(await outcome);
});
test('D22 capability reader throwing leaves no forged help or authority', async () => {
  const f = fixture('pc');
  const p = createKnowledgePresentation(f.feed, f.broker, { surface: 'pc', now: () => NOW,
    capabilityReader: { read: async () => { throw new Error('source unavailable'); } } });
  const r = await p.read(request('pc', { purpose: 'explain' }), { actionId: 'ui.publish' });
  assert.equal(r.help, null); assert.equal(r.runnable, false);
});
test('D23 output retains no deletion list, total rows, effect handle or native grant token', async () => {
  const f = fixture('pc', page([fact()], { removedStableIds: ['kn_removed'], nextCursor: 'cursor_1' }));
  const r = await f.port.read(request('pc'));
  assert.equal(r.nextCursor, 'cursor_1');
  assert.equal('removedStableIds' in r, false);
  assert.equal('grant' in r, false);
  assert.equal('publish' in r, false);
  assert.equal('execute' in r, false);
  opaque(r);
});
