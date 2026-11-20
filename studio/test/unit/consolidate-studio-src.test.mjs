// Unit tests for the NEXT:CONSOLIDATE:studio/src/studio build unit (ARBOR).
//
// Owned anchors covered here:
//  - studio/src/studio/core-runtime-bridge.mjs :: reconcileLifecycle (AT-ECC846F6B5BA)
//      the uncertain-outcome boundary: an uncertain step is never promoted to 'executed'
//      without a proven durable binding<->journal join, and nothing ever dispatches/retries.
//  - studio/src/studio/integration-hub.mjs :: knowledge (AT-EE5630007A77)
//      producer (session kv, written by replay/derive.mjs) -> knowledgeView guard -> the
//      versioned /sessions/{id}/knowledge and /sessions/{id}/derive routes (real consumers).
//  - studio/src/studio/world-control-lineage.mjs :: projectControlLineageSnapshot (AT-5E05C518128E)
//      exact Host receipt references (plan id + Host-recorded status), no false effect claim.
//  - studio/src/studio/server.mjs :: deriveSession (AT-64713736D0D1) is NOT imported here:
//      server.mjs currently cannot be loaded in this tree because
//      apps/browser-companion/protocol.mjs (imported by browser-companion/ingress.mjs) is
//      absent; that missing dependency is reported in the unit result, not worked around.
//      Its hub wiring is proven instead through createIntegrationHub's derive route below,
//      which is exactly the call server.mjs makes (server.mjs L164 -> integration-hub L157).
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { reconcileLifecycle } from '../../src/studio/core-runtime-bridge.mjs';
import { CONTROL_LINEAGE_SCHEMA, projectControlLineageSnapshot } from '../../src/studio/world-control-lineage.mjs';
import { KNOWLEDGE_STATUS_SCHEMA, createIntegrationHub, knowledgeView } from '../../src/studio/integration-hub.mjs';
import { Session } from '../../src/store/session.mjs';

const hex64 = (c) => c.repeat(64);

// ---- core-runtime-bridge.mjs :: reconcileLifecycle --------------------------------

const runWith = (status = 'uncertain') => ({
  id: 'run-1', conversationId: 'conv-1',
  steps: [{ key: 's1', tool: 'submit_conversation_turn', argsDigest: hex64('a'), status }],
});
const reconciler = (verdict) => () => ({ verdict, reason: 'TEST_RECONCILER' });
const fullBinding = {
  source: 'trusted-pre-effect', runId: 'run-1', stepKey: 's1',
  stepTool: 'submit_conversation_turn', argsDigest: hex64('a'), conversationId: 'conv-1',
  threadKey: 'th-1', journalTurnKey: 'turn-1', journalPayloadDigest: hex64('b'),
};
const fullJournal = {
  version: 2, threadKey: 'th-1',
  turns: [{ key: 'turn-1', id: 't1', conversationId: 'conv-1', payloadDigest: hex64('b'),
    boundary: { sessionId: 'sess-1', sequence: 5 } }],
};

test('reconcileLifecycle never promotes an uncertain step to executed without the proven durable join', () => {
  const result = reconcileLifecycle({ run: runWith(), stepKey: 's1', journal: { version: 2, threadKey: 'th-1', turns: [] },
    binding: null, reconcileUncertainStep: reconciler('executed'), origin: 'https://chat.example' });
  // The injected reconciler said 'executed', but with no durable join the projection must not.
  assert.equal(result.effect.verdict, 'still_unknown');
  assert.equal(result.effect.reason, 'DURABLE_JOIN_MISSING_OR_MISMATCHED');
  assert.equal(result.effect.retryAuthorized, false);
  assert.equal(result.dispatched, false);
  assert.equal(result.readOnly, true);
  assert.equal(result.delivery.state, 'unknown');
});

test('reconcileLifecycle projects an executed verdict only with the proven binding-journal join, and never dispatches', () => {
  const result = reconcileLifecycle({ run: runWith(), stepKey: 's1', journal: fullJournal, binding: fullBinding,
    reconcileUncertainStep: reconciler('executed'), origin: 'https://chat.example' });
  assert.equal(result.effect.verdict, 'executed'); // proven join: verified evidence resolves status
  assert.equal(result.effect.retryAuthorized, false);
  assert.equal(result.dispatched, false);
  assert.equal(result.readOnly, true);
});

test('reconcileLifecycle keeps a non-success verdict and never authorizes retry for an unresolved step', () => {
  const result = reconcileLifecycle({ run: runWith(), stepKey: 's1', journal: fullJournal, binding: fullBinding,
    reconcileUncertainStep: reconciler('not_executed'), origin: 'https://chat.example' });
  assert.equal(result.effect.verdict, 'not_executed');
  assert.equal(result.effect.reason, 'UNRESOLVED_EFFECT_NOT_POSITIVELY_RECONCILED');
  assert.equal(result.effect.retryAuthorized, false);
  assert.equal(result.dispatched, false);
  assert.equal(result.readOnly, true);
});

// ---- integration-hub.mjs :: knowledge / knowledgeView ------------------------------

const fakeSession = (store) => ({ kv: { get: (k, d) => (Object.hasOwn(store, k) ? store[k] : d) } });

test('knowledgeView reads only the session-kv producer and returns its source identity', () => {
  const view = knowledgeView(fakeSession({
    KNOWLEDGE_STATUS: { schema: KNOWLEDGE_STATUS_SCHEMA, status: 'complete', completedAt: '2026-11-20T00:00:00.000Z', entityCount: 0 },
    MODEL: { types: [] },
  }));
  assert.equal(view.outcome.status, 'complete');
  assert.deepEqual(view.model, { types: [] });
  assert.equal(view.source.owner, 'studio-session-kv');
  assert.deepEqual(view.source.keys, ['KNOWLEDGE_STATUS', 'MODEL']);
  assert.equal(view.source.schema, KNOWLEDGE_STATUS_SCHEMA);
});

test('knowledgeView refuses stale, foreign-schema and failed derivations (no cross-scope consumption)', () => {
  const code = (e) => e.code === 'KNOWLEDGE_UNAVAILABLE';
  assert.throws(() => knowledgeView(fakeSession({
    KNOWLEDGE_STATUS: { schema: KNOWLEDGE_STATUS_SCHEMA, status: 'deriving' }, MODEL: { types: [] } })), code);
  assert.throws(() => knowledgeView(fakeSession({
    KNOWLEDGE_STATUS: { schema: 'someone-else/1', status: 'complete' }, MODEL: { types: [] } })), code);
  assert.throws(() => knowledgeView(fakeSession({
    KNOWLEDGE_STATUS: { schema: KNOWLEDGE_STATUS_SCHEMA, status: 'complete' }, MODEL: { error: 'boom' } })), code);
});

test('knowledgeView keeps the legacy-unverified marker for pre-schema sessions', () => {
  const view = knowledgeView(fakeSession({ MODEL: { types: [] } }));
  assert.equal(view.outcome.status, 'legacy-unverified');
  assert.equal(view.source.schema, null);
});

// ---- integration-hub.mjs :: real product routes over a fixture session -------------

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

function makeHub(t, { knowledgeStatus, model } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'studio-consolidate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const paths = { root, sessions: path.join(root, 'sessions'), learner: path.join(root, 'learner') };
  const s = Session.create(paths.sessions, { site: 'test' });
  s.meta.status = 'stopped';
  s.saveMeta();
  if (knowledgeStatus !== undefined) s.kv.set('KNOWLEDGE_STATUS', knowledgeStatus);
  if (model !== undefined) s.kv.set('MODEL', model);
  const recorder = Object.assign(new EventEmitter(), { state: 'idle', session: null, status: () => ({ state: 'idle' }) });
  const calls = [];
  const deriveSession = async (session, profileName) => {
    calls.push({ id: session.id, profileName });
    return { records: 0, receipt: null, knowledge: { types: 0 }, recordCounts: {}, familyCounts: {} };
  };
  const hub = createIntegrationHub({
    paths, profileStore: { load: () => ({}) }, learner: null, recorder,
    conversationRuntime: { isSessionActive: () => false }, harnessApi: null, deriveSession,
    previewRecord: (r) => r, previewEvent: (e) => e, getPort: () => 0, cdpPort: 0,
  });
  return { hub, sessionId: s.id, calls };
}

async function call(hub, method, pathname, body = {}) {
  const req = { method, headers: {}, url: pathname };
  const res = mockRes(req);
  const handled = await hub.handle(req, res, new URL(`http://127.0.0.1${pathname}`), body);
  return { handled, status: res.statusCode, body: res.body ? JSON.parse(res.body) : null };
}

test('the versioned derive route calls the injected deriveSession (the server.mjs wiring)', async (t) => {
  const { hub, sessionId, calls } = makeHub(t);
  const res = await call(hub, 'POST', `/api/v1/sessions/${sessionId}/derive`, {});
  assert.equal(res.handled, true);
  assert.equal(res.status, 200);
  assert.deepEqual(calls, [{ id: sessionId, profileName: undefined }]);
  assert.deepEqual(res.body.knowledge, { types: 0 });
  assert.equal(res.body.session, sessionId);
});

test('the versioned knowledge route consumes the session-kv producer through knowledgeView', async (t) => {
  const { hub, sessionId } = makeHub(t, {
    knowledgeStatus: { schema: KNOWLEDGE_STATUS_SCHEMA, status: 'complete', completedAt: '2026-11-20T00:00:00.000Z', entityCount: 0 },
    model: { types: [] },
  });
  const res = await call(hub, 'GET', `/api/v1/sessions/${sessionId}/knowledge`, {});
  assert.equal(res.status, 200);
  assert.equal(res.body.outcome.status, 'complete');
  assert.deepEqual(res.body.model, { types: [] });
});

test('the knowledge route fails closed on a stale derivation marker', async (t) => {
  const { hub, sessionId } = makeHub(t, {
    knowledgeStatus: { schema: KNOWLEDGE_STATUS_SCHEMA, status: 'deriving' },
    model: { types: [] },
  });
  const res = await call(hub, 'GET', `/api/v1/sessions/${sessionId}/knowledge`, {});
  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'KNOWLEDGE_UNAVAILABLE');
});

// ---- world-control-lineage.mjs :: projectControlLineageSnapshot -------------------

test('projectControlLineageSnapshot maps the exact Host receipt (plan id + recorded status) with no effect claim', () => {
  const planId = 'ctl-0123456789abcdef';
  const out = projectControlLineageSnapshot({ plans: [{
    planId, actionId: 'send.reply', risk: 'R1', state: 'applied', source: 'host-ui',
    createdAt: '2026-11-20T00:00:00.000Z' }] });
  assert.equal(out.schema, CONTROL_LINEAGE_SCHEMA);
  assert.equal(out.authority, 'read-only-projection');
  assert.equal(out.effectsAuthorized, false);
  assert.equal(out.complete, true);
  const plan = out.nodes.find((n) => n.kind === 'control-plan');
  assert.deepEqual(plan.receipt, { id: planId, status: 'applied' });
  assert.equal(plan.executionVerified, false);
  assert.equal(plan.owner, 'host-control');
  assert.ok(out.edges.some((e) => e.kind === 'proposes_action' && e.from === plan.id));
});

test('projectControlLineageSnapshot accepts an explicit matching receipt and rejects a mismatched one', () => {
  const planId = 'ctl-0123456789abcdef';
  const base = { planId, actionId: 'send.reply', risk: 'R2', state: 'failed', source: 'host-ui' };
  const ok = projectControlLineageSnapshot({ plans: [{ ...base, receipt: { id: planId, status: 'failed' } }] });
  assert.deepEqual(ok.nodes.find((n) => n.kind === 'control-plan').receipt, { id: planId, status: 'failed' });
  assert.throws(() => projectControlLineageSnapshot({ plans: [{ ...base, receipt: { id: planId, status: 'applied' } }] }),
    /CONTROL_LINEAGE_BAD_PLAN/);
  assert.throws(() => projectControlLineageSnapshot({ plans: [{ ...base, receipt: { id: 'ctl-ffffffffffffffff', status: 'failed' } }] }),
    /CONTROL_LINEAGE_BAD_PLAN/);
});

test('projectControlLineageSnapshot keeps uncertain plans receipt-free and preserves rule revisions', () => {
  const out = projectControlLineageSnapshot({
    plans: [{ planId: 'ctl-0123456789abcdef', actionId: 'send.reply', risk: 'R3', state: 'uncertain', source: 'host-ui' }],
    rules: [{ id: 'rule-1', actionId: 'send.reply', state: 'accepted', revision: 3 }],
    journalAvailable: false,
  });
  const plan = out.nodes.find((n) => n.kind === 'control-plan');
  assert.equal(plan.receipt, null);
  const rule = out.nodes.find((n) => n.kind === 'personal-command-rule');
  assert.equal(rule.revision, 3);
  assert.equal(rule.authority, 'interpretation_only');
  assert.equal(out.complete, false);
  assert.equal(out.sourceAvailability.hostJournal, 'unavailable');
  assert.ok(out.nodes.every((n) => n.executionVerified === false));
  assert.equal(out.effectsAuthorized, false);
});

test('projectControlLineageSnapshot still enforces its input bounds', () => {
  const plans = Array.from({ length: 101 }, (_, i) => ({
    planId: `ctl-${String(i).padStart(16, '0')}`, actionId: 'a.b', risk: 'R0', state: 'planned', source: 'x' }));
  assert.throws(() => projectControlLineageSnapshot({ plans }), /CONTROL_LINEAGE_BOUNDS/);
});
