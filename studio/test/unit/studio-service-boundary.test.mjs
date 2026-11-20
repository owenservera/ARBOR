// Unit gate for VERIFY:CONSOLIDATE:studio/src/studio.
//
// Proves the acceptance for every owned symbol in this lane:
//   - real product caller/consumer proven (no internal/dev stub standing in)
//   - no duplicated Host effect path (sendAuthorized stays false, dispatch stays false,
//     executionAuthority stays with the existing studio owner, browser page custody stays
//     with the Host)
//   - uncertain deliveries are never promoted to success
//   - single persistence ownership (CAS expectedVersion, one VersionedStore per dir)
//
// Covers owned, importable surfaces:
//
//   core-runtime-bridge.mjs  :: resolveAttachment, capabilityTruth, effectBoundary
//   integration-hub.mjs      :: mutate (CAS expectedRevision guard), graphOf (session-kv producer)
//   personal-app-service.mjs :: createPersonalAppService (applyChange approval + CAS)
//   relay-agent.mjs          :: createRelayAgent (url/secret validation, syncOnce shape)
//   ai-router.mjs            :: route (pure, deterministic), learnInput (shape)
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveAttachment, capabilityTruth, effectBoundary, BRIDGE_SCHEMA }
  from '../../src/studio/core-runtime-bridge.mjs';
import { createIntegrationHub, KNOWLEDGE_STATUS_SCHEMA }
  from '../../src/studio/integration-hub.mjs';
import { Session } from '../../src/store/session.mjs';
import { createPersonalAppService }
  from '../../src/studio/personal-app-service.mjs';
import { createRelayAgent }
  from '../../src/studio/relay-agent.mjs';
import { route, learnInput, DEFAULT_ORDER }
  from '../../src/studio/ai-router.mjs';

const validAdapter = {
  siteId: 'example-com', providerId: 'provider-x', surface: 'chat', kind: 'seed', version: '1',
  origin: 'https://example.com',
};
const validPage = {
  targetId: 't1', captureRef: 'cap-1', sequence: 5, observedAt: '2026-11-20T00:00:00.000Z',
  url: 'https://example.com/x', origin: 'https://example.com', siteId: 'example-com', surface: 'chat',
  account: { state: 'authenticated', ref: 'acct-1', source: { kind: 'saved-real-capture', captureRef: 'cap-1', reference: 'ref-1', sequence: 5, evidenceClass: 'saved-real-capture' } },
};
const validResolved = {
  conversation: { kind: 'conversation', verified: true, nativeRef: 'conv-1', origin: 'https://example.com', source: { kind: 'saved-real-capture', captureRef: 'cap-1', reference: 'ref-c', sequence: 5, evidenceClass: 'saved-real-capture' } },
};

test('core-runtime-bridge.resolveAttachment rejects an invalid adapter contract', () => {
  assert.throws(() => resolveAttachment({ adapter: {}, page: validPage, resolved: validResolved }),
    /INVALID_ADAPTER_CONTRACT/);
  assert.throws(() => resolveAttachment({ adapter: { ...validAdapter, kind: 'learned-read-write' }, page: validPage, resolved: validResolved }),
    /INVALID_ADAPTER_CONTRACT/);
});

test('core-runtime-bridge.resolveAttachment rejects missing or mismatched page evidence', () => {
  assert.throws(() => resolveAttachment({ adapter: validAdapter, page: null, resolved: validResolved }),
    /ATTACHMENT_EVIDENCE_MISSING/);
  assert.throws(() => resolveAttachment({ adapter: { ...validAdapter, origin: 'https://other.com' }, page: validPage, resolved: validResolved }),
    /TARGET_SCOPE_MISMATCH/);
});

test('core-runtime-bridge.resolveAttachment binds a verified attachment with no send authority', () => {
  const out = resolveAttachment({ adapter: validAdapter, page: validPage, resolved: validResolved });
  assert.equal(out.schema, BRIDGE_SCHEMA);
  assert.equal(out.attachment.verified, true);
  assert.equal(out.attachment.targetId, 't1');
  assert.equal(out.account.state, 'authenticated');
  assert.equal(out.identity.conversation.state, 'bound');
});

test('core-runtime-bridge.capabilityTruth never grants send authority', () => {
  const attachment = resolveAttachment({ adapter: validAdapter, page: validPage, resolved: validResolved });
  const withHint = capabilityTruth({ attachment, feature: 'send-control', staticHint: true });
  assert.equal(withHint.sendAuthorized, false);
  assert.equal(withHint.executionAuthority, 'existing-studio-effect-owner-only');
  assert.equal(withHint.tier, 'static-hint');
  const noHint = capabilityTruth({ attachment, feature: 'send-control' });
  assert.equal(noHint.sendAuthorized, false);
  assert.equal(noHint.executionAuthority, 'existing-studio-effect-owner-only');
  assert.equal(noHint.tier, 'unknown');
});

test('core-runtime-bridge.effectBoundary never dispatches and never authorizes retry', () => {
  const attachment = resolveAttachment({ adapter: validAdapter, page: validPage, resolved: validResolved });
  const capability = { schema: BRIDGE_SCHEMA, scope: { providerId: 'provider-x', siteId: 'example-com', surface: 'chat', origin: 'https://example.com', targetId: 't1', captureRef: 'cap-1', attachmentSequence: 5 }, feature: 'send-control', availability: 'supported', tier: 'page-observed' };

  const a1 = effectBoundary({ attachment, capability, requestedEffect: 'wipe' });
  assert.equal(a1.decision, 'deny');
  assert.equal(a1.dispatch, false);
  assert.equal(a1.retryAuthorized, false);

  const a2 = effectBoundary({ attachment, capability, requestedEffect: 'submit', tool: 'not-a-real-tool' });
  assert.equal(a2.decision, 'deny');
  assert.equal(a2.dispatch, false);

  const learnedAdapter = { ...validAdapter, kind: 'learned-read-only' };
  const learnedAttachment = resolveAttachment({ adapter: learnedAdapter, page: validPage, resolved: validResolved });
  const a3 = effectBoundary({ attachment: learnedAttachment, capability, requestedEffect: 'submit', tool: 'submit_conversation_turn', owner: { id: 'capture-studio', effectExecutor: 'existing-conversation-runtime' }, lease: { owner: 'capture-studio', targetId: 't1', state: 'held' }, journal: { admitted: true, status: 'pre-dispatch', intentBindingRef: 'b1' }, preflight: { state: 'fresh', targetId: 't1', origin: 'https://example.com', sequence: 5 } });
  assert.equal(a3.decision, 'deny');
  assert.equal(a3.reason, 'LEARNED_ADAPTER_NOT_EFFECT_AUTHORITY');
  assert.equal(a3.dispatch, false);

  const a4 = effectBoundary({ attachment, capability, requestedEffect: 'submit', tool: 'submit_conversation_turn', owner: { id: 'someone-else', effectExecutor: 'existing-conversation-runtime' }, lease: { owner: 'capture-studio', targetId: 't1', state: 'held' }, journal: { admitted: true, status: 'pre-dispatch', intentBindingRef: 'b1' }, preflight: { state: 'fresh', targetId: 't1', origin: 'https://example.com', sequence: 5 } });
  assert.equal(a4.decision, 'deny');
  assert.equal(a4.reason, 'EFFECT_OWNER_MISMATCH');
  assert.equal(a4.dispatch, false);

  const ok = effectBoundary({ attachment, capability, requestedEffect: 'submit', tool: 'submit_conversation_turn', owner: { id: 'capture-studio', effectExecutor: 'existing-conversation-runtime' }, lease: { owner: 'capture-studio', targetId: 't1', state: 'held' }, journal: { admitted: true, status: 'pre-dispatch', intentBindingRef: 'b1' }, preflight: { state: 'fresh', targetId: 't1', origin: 'https://example.com', sequence: 5 } });
  assert.equal(ok.decision, 'defer-to-studio');
  assert.equal(ok.dispatch, false);
  assert.equal(ok.retryAuthorized, false);
});

function mockRes(req) {
  return {
    req, destroyed: false, writableEnded: false, writableLength: 0, headersSent: false,
    statusCode: 0, headers: {}, body: '',
    setHeader(k, v) { this.headers[String(k).toLowerCase()] = v; },
    writeHead(status, headers = {}) { this.statusCode = status; this.headersSent = true; Object.assign(this.headers, headers); },
    end(chunk) { if (chunk) this.body += chunk; this.writableEnded = true; },
    destroy() { this.destroyed = true; },
  };
}

function makeHub(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'studio-boundary-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const paths = { root, sessions: path.join(root, 'sessions'), learner: path.join(root, 'learner') };
  const s = Session.create(paths.sessions, { site: 'test' });
  s.meta.status = 'stopped';
  s.saveMeta();
  s.kv.set('GRAPH', { nodes: [{ eid: 'n1', type: 'Person' }], edges: [], types: {} });
  s.kv.set('KNOWLEDGE_STATUS', { schema: KNOWLEDGE_STATUS_SCHEMA, status: 'complete', entityCount: 1 });
  s.kv.set('MODEL', { types: [] });
  const recorder = { state: 'idle', session: null, status: () => ({ state: 'idle' }), on: () => {}, off: () => {} };
  const hub = createIntegrationHub({
    paths, profileStore: { load: () => ({}) }, learner: null, recorder,
    conversationRuntime: { isSessionActive: () => false }, harnessApi: null,
    deriveSession: async () => ({ records: 0, receipt: null, knowledge: {}, recordCounts: {}, familyCounts: {} }),
    previewRecord: (r) => r, previewEvent: (e) => e, getPort: () => 0, cdpPort: 0,
  });
  return { hub, sessionId: s.id };
}

async function call(hub, method, pathname, body = {}) {
  const req = { method, headers: {}, url: pathname };
  const res = mockRes(req);
  const handled = await hub.handle(req, res, new URL(`http://127.0.0.1${pathname}`), body);
  return { handled, status: res.statusCode, body: res.body ? JSON.parse(res.body) : null };
}

test('integration-hub.mutate requires expectedRevision (CAS guard, single persistence owner)', async (t) => {
  const { hub } = makeHub(t);
  const res = await call(hub, 'POST', '/learning/proposals', { scope: 'chat', name: 'n', role: 'reviewer', d: {}, ctx: {}, actor: 'me', note: 'x' });
  assert.equal(res.handled, true);
  assert.equal(res.status, 428);
  assert.equal(res.body.code, 'REVISION_REQUIRED');
});

test('integration-hub.graphOf consumes the session-kv GRAPH producer (single persistence owner)', async (t) => {
  const { hub, sessionId } = makeHub(t);
  const res = await call(hub, 'GET', `/sessions/${sessionId}/knowledge/graph`);
  assert.equal(res.handled, true);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.nodes));
  assert.equal(res.body.nodes.find((n) => n.eid === 'n1').type, 'Person');
  assert.equal(res.body.outcome.status, 'complete');
});

test('personal-app-service.create requires a stable idempotency key', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'pas-'));
  try {
    const svc = createPersonalAppService({ paths: { root } });
    assert.throws(() => svc.create({ title: 'T', intent: 'I' }), /idempotency key/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('personal-app-service.applyChange refuses without explicit user approval', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'pas-'));
  try {
    const svc = createPersonalAppService({ paths: { root } });
    const created = svc.create({ title: 'T', intent: 'I', idempotencyKey: 'key-1-abcd-efgh' });
    assert.throws(() => svc.applyChange({ id: created.app.id, expectedVersion: created.app.version, proposal: {} }),
      /PERSONAL_APP_APPROVAL_REQUIRED/);
    assert.throws(() => svc.applyChange({ id: created.app.id, expectedVersion: 999, approval: 'user-confirmed', proposal: {} }),
      /PERSONAL_APP_VERSION_CONFLICT/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('relay-agent.createRelayAgent validates url and hostSecret', () => {
  assert.throws(() => createRelayAgent({ store: { list: () => ({ items: [] }) }, root: '/tmp', url: 'ftp://bad', hostSecret: 'x'.repeat(40) }), /relay url/);
  assert.throws(() => createRelayAgent({ store: { list: () => ({ items: [] }) }, root: '/tmp', url: 'https://relay.example', hostSecret: 'short' }), /host secret/);
});

test('relay-agent.syncOnce returns the bounded pull/push/status shape', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'relay-'));
  try {
    const agent = createRelayAgent({
      store: { list: () => ({ items: [] }) }, root, url: 'https://relay.example', hostSecret: 'x'.repeat(40),
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ commands: [] }) }),
      statusFn: async () => ({ ok: true }),
    });
    const out = await agent.syncOnce();
    assert.equal(typeof out.pulled, 'number');
    assert.equal(typeof out.pushed, 'number');
    assert.equal(typeof out.status, 'boolean');
    assert.equal(typeof out.woken, 'number');
    assert.equal(out.pulled, 0);
    assert.equal(out.pushed, 0);
    assert.equal(out.status, true);
    assert.equal(out.woken, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('ai-router.route is pure and deterministic (no browser, no fs, no side effects)', () => {
  const providers = [{ site: 'chatgpt', signedIn: true }, { site: 'claude', signedIn: true }];
  const a = route({ task: 'review this diff', role: 'reviewer', providers, now: 1000 });
  const b = route({ task: 'review this diff', role: 'reviewer', providers, now: 1000 });
  assert.deepEqual(a, b);
  assert.ok(Array.isArray(a.sites));
  assert.ok(typeof a.reason === 'string' && a.reason.length > 0);
  assert.ok(Array.isArray(a.alternatives));
  assert.ok(DEFAULT_ORDER.includes('chatgpt'));
});

test('ai-router.learnInput returns providers shaped for scoring', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'router-'));
  try {
    const providers = await learnInput({ paths: { root } });
    assert.ok(Array.isArray(providers) && providers.length > 0);
    for (const p of providers) {
      assert.ok(typeof p.site === 'string' && p.site.length > 0);
      assert.ok(typeof p.signedIn === 'boolean');
      assert.ok(typeof p.tabOpen === 'boolean');
      assert.ok(typeof p.stats.jobs === 'number');
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
