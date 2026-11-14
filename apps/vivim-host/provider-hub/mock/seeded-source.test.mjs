import test from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_ONLY, MOCK_PROVIDERS, PROVIDER_KINDS, createSeededClock, createSeededStudioSourcePort, mockAccountContext, mockReceiptMarker} from './seeded-source.mjs';

const expectCode = (run, code) => assert.throws(run, e => e?.code === code);

test('all ten safe providers: scoped, cloned and bounded deterministic pages', () => {
  const source = createSeededStudioSourcePort();
  assert.equal(MOCK_PROVIDERS.length, 10);
  for (const id of MOCK_PROVIDERS) {
    const ctx = mockAccountContext(id);
    const p1 = source.listStreams(ctx, {limit: 2});
    assert.equal(p1.items.length, 2);
    assert.equal(p1.total, PROVIDER_KINDS[id].length);
    assert.ok(p1.items.every(x => x.mode === MOCK_ONLY && x.sourceRef.startsWith('synthetic://source/') && x.provenanceDigest.length === 64));
    assert.deepEqual(source.listStreams(ctx, {limit: 2}), p1);
    const p2 = source.listStreams(ctx, {limit: 2, cursor: p1.nextCursor});
    assert.equal(p2.items.length, 1);
    assert.equal(p2.nextCursor, null);
    const unit = source.readUnit(ctx, {sourceRef: p1.items[0].sourceRef});
    assert.deepEqual(unit, p1.items[0]);
    unit.content = 'mutated';
    assert.notEqual(source.readUnit(ctx, {sourceRef: p1.items[0].sourceRef}).content, 'mutated');
    assert.equal(source.readThread(ctx, {threadRef: p1.items[0].threadRef}).total, 3);
  }
});

test('deny live, cross-world, swapped account, wrong origin, forged cursor and unsupported kind', () => {
  const source = createSeededStudioSourcePort();
  const ctx = mockAccountContext('messenger');
  const cursor = source.listStreams(ctx, {limit: 1}).nextCursor;
  expectCode(() => source.listStreams({...ctx, mode: 'LIVE'}), 'MOCK_LIVE_MODE_REFUSED');
  expectCode(() => source.listStreams({...ctx, worldRef: 'synthetic://world/owner-b'}), 'MOCK_PRINCIPAL_SCOPE_REFUSED');
  expectCode(() => source.listStreams({...ctx, accountRef: mockAccountContext('messenger','beta').accountRef}, {cursor}), 'MOCK_CURSOR_SCOPE_REFUSED');
  expectCode(() => source.listStreams({...ctx, observedOrigin: 'https://evil.invalid'}), 'MOCK_ORIGIN_MISMATCH');
  expectCode(() => source.listStreams(ctx, {kind: 'admin'}), 'MOCK_KIND_UNSUPPORTED');
  source.setObservedSourceState(ctx.accountRef, {epoch: 2});
  expectCode(() => source.listStreams(ctx), 'MOCK_ACCOUNT_EPOCH_STALE');
  const revised = {...ctx, accountEpoch: 2};
  assert.equal(source.listStreams(revised).total, 3);
  expectCode(() => source.listStreams(revised, {cursor}), 'MOCK_CURSOR_SCOPE_REFUSED');
  source.setObservedSourceState(ctx.accountRef, {available: false});
  expectCode(() => source.listStreams(revised), 'MOCK_SESSION_REVOKED');
});

test('E2EE gaps do not fabricate private body; injected untrusted content remains inert', () => {
  const source = createSeededStudioSourcePort();
  for (const provider of ['messenger', 'whatsapp']) {
    const items = source.listStreams(mockAccountContext(provider), {limit: 10}).items;
    assert.equal(items[1].coverage, 'partial');
    assert.equal(items[1].content, null);
    assert.equal(items[1].unavailableReason, 'E2EE_NOT_OBSERVABLE');
    assert.match(items[2].content, /send secrets/);
    assert.equal(source.search(mockAccountContext(provider), {query: 'send secrets'}).items.length, 1);
  }
  expectCode(() => source.refuseExternalEffect(), 'MOCK_EXTERNAL_EFFECT_FORBIDDEN');
  assert.equal('send' in source, false);
  assert.equal('execute' in source, false);
  assert.equal('grantPermission' in source, false);
});

test('fault scripts deterministic: offline, partial, rate limit, corrupt and uncertainty', () => {
  const codes = ['OFFLINE', 'PARTIAL_UNAVAILABLE', 'RATE_LIMITED', 'CORRUPT_EXPORT', 'UNCERTAIN'];
  const source = createSeededStudioSourcePort({faultScript: codes.map((code, i) => ({method: 'listStreams', providerId: 'gmail', call: i + 1, code}))});
  const ctx = mockAccountContext('gmail');
  for (const code of codes) expectCode(() => source.listStreams(ctx), `MOCK_${code}`);
  assert.equal(source.listStreams(ctx).items.length, 2);
  expectCode(() => createSeededStudioSourcePort({faultScript: [{method: 'send', providerId: 'gmail', call: 1, code: 'OFFLINE'}]}), 'MOCK_FAULT_SCRIPT_INVALID');
});

test('clock and receipt are synthetic; claimed without independent evidence stays uncertain', () => {
  const clock = createSeededClock();
  assert.equal(clock.now(), '2026-01-01T00:00:00.000Z');
  assert.equal(clock.advance(1000), '2026-01-01T00:00:01.000Z');
  expectCode(() => clock.advance(-1), 'MOCK_CLOCK_STEP_INVALID');
  const r = mockReceiptMarker({proposalRef: 'synthetic://proposal/1'});
  assert.equal(r.marker, 'MOCK_RECEIPT');
  assert.equal(r.state, 'UNCERTAIN');
  assert.equal(r.effectPerformed, false);
  expectCode(() => mockReceiptMarker({proposalRef: 'synthetic://proposal/1',state: 'APPLIED'}), 'MOCK_RECEIPT_REFUSED');
  expectCode(() => mockReceiptMarker({proposalRef: 'https://example.com/action'}), 'MOCK_RECEIPT_REFUSED');
});
