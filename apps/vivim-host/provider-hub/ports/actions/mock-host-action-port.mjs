// Provider Hub W1/D: injected, memory-only test double for the EXISTING Host action boundary.
// NO browser, network, command, live send, durable journal or permission-grant capability.
// Live integration MUST bind to apps/vivim-host/control/dispatcher.mjs and its journal.
import { createHash } from 'node:crypto';

export const ACTION_PORT_SCHEMA = 'vivim.provider-hub.action-port/1';
export const ACTION_CONTEXT_SCHEMA = 'vivim.provider-hub.action-context/1';
export const ACTION_PLAN_SCHEMA = 'vivim.provider-hub.action-plan/1';
export const MOCK_RECEIPT_SCHEMA = 'vivim.provider-hub.mock-receipt/1';
export const MOCK_MODE = 'MOCK_ONLY';

const REF = /^synthetic:\/\/[a-z0-9][a-z0-9/._:-]{1,120}$/;
const ID = /^[a-z][a-z0-9-]{1,31}$/;
const HEX = /^[a-f0-9]{64}$/;
const KEY = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/;
const fail = code => Object.assign(new Error(code), { code });
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const exact = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj)
  && Object.keys(obj).every(key => keys.includes(key)) && keys.every(key => Object.hasOwn(obj, key));
const ref = value => typeof value === 'string' && REF.test(value);
const rev = value => Number.isSafeInteger(value) && value >= 0;
const contextKeys = ['schema', 'principalRef', 'worldRef', 'providerId', 'accountRef', 'accountEpoch', 'grantVersion', 'sourceRevision'];
const intentKeys = ['actionKind', 'recipientRef', 'threadRef', 'draftRef', 'draftSha256', 'attachmentDigests', 'expectedSourceRevision', 'idempotencyKey'];
const hostKeys = ['principalRef', 'worldRef', 'providerId', 'accountRef', 'accountEpoch', 'grantVersion', 'sourceRevision',
  'recipientRef', 'threadRef', 'draftSha256', 'grantState', 'privacyState', 'sessionState', 'capabilityState'];

function validContext(context) {
  if (!exact(context, contextKeys) || context.schema !== ACTION_CONTEXT_SCHEMA ||
      !['principalRef', 'worldRef', 'accountRef'].every(k => ref(context[k])) ||
      !ID.test(context.providerId) ||
      !['accountEpoch', 'grantVersion', 'sourceRevision'].every(k => rev(context[k]))) {
    throw fail('ACTION_CONTEXT_INVALID');
  }
  return { ...context };
}

function validIntent(intent) {
  if (!exact(intent, intentKeys) || intent.actionKind !== 'message.send' ||
      !['recipientRef', 'threadRef', 'draftRef'].every(k => ref(intent[k])) ||
      !HEX.test(intent.draftSha256) || !Array.isArray(intent.attachmentDigests) ||
      intent.attachmentDigests.length > 8 || !intent.attachmentDigests.every(x => typeof x === 'string' && HEX.test(x)) ||
      !rev(intent.expectedSourceRevision) || typeof intent.idempotencyKey !== 'string' || !KEY.test(intent.idempotencyKey)) {
    throw fail('ACTION_INTENT_INVALID');
  }
  return { ...intent, attachmentDigests: [...intent.attachmentDigests] };
}

// hostSnapshot is a mandatory injected MOCK Host authority. Caller claims are NEVER
// accepted as grants. In live mode it MUST be replaced with an owner-verified Host path.
export function createMockHostActionPort({ hostSnapshot, now, mockOutcome, ttlMs = 600_000 } = {}) {
  if (typeof hostSnapshot !== 'function' || typeof now !== 'function' || typeof mockOutcome !== 'function' ||
      !Number.isSafeInteger(ttlMs) || ttlMs < 1) throw fail('ACTION_MOCK_DEPENDENCIES_REQUIRED');
  const plans = new Map(); // disposable fixture state; NOT a Host ledger
  const idempotency = new Map();
  let sequence = 0;

  function current(context, intent = null) {
    const snapshot = hostSnapshot();
    if (!exact(snapshot, hostKeys) ||
        !['principalRef', 'worldRef', 'accountRef', 'recipientRef', 'threadRef'].every(k => ref(snapshot[k])) ||
        !ID.test(snapshot.providerId) || !HEX.test(snapshot.draftSha256) ||
        !['accountEpoch', 'grantVersion', 'sourceRevision'].every(k => rev(snapshot[k]))) {
      throw fail('ACTION_MOCK_HOST_SNAPSHOT_INVALID');
    }
    for (const key of contextKeys.slice(1)) {
      if (snapshot[key] !== context[key]) throw fail('ACTION_SCOPE_CHANGED');
    }
    if (snapshot.grantState !== 'active') throw fail('ACTION_GRANT_DENIED');
    if (snapshot.privacyState !== 'allow') throw fail('ACTION_PRIVACY_REFUSED');
    if (snapshot.sessionState !== 'mock_active') throw fail('ACTION_SESSION_UNAVAILABLE');
    if (snapshot.capabilityState !== 'mock_enabled') throw fail('ACTION_UNSUPPORTED');
    if (intent) {
      if (intent.expectedSourceRevision !== snapshot.sourceRevision) throw fail('ACTION_SOURCE_REVISION_CHANGED');
      if (intent.recipientRef !== snapshot.recipientRef || intent.threadRef !== snapshot.threadRef)
        throw fail('ACTION_TARGET_CHANGED');
      if (intent.draftSha256 !== snapshot.draftSha256) throw fail('ACTION_DRAFT_CHANGED');
    }
    return snapshot;
  }

  function stored(planId, context) {
    if (typeof planId !== 'string' || !REF.test(planId)) throw fail('ACTION_PLAN_INVALID');
    const record = plans.get(planId);
    if (!record) throw fail('ACTION_PLAN_UNKNOWN');
    current(context, record.intent);
    if (record.context.schema !== context.schema || contextKeys.slice(1).some(k => record.context[k] !== context[k]))
      throw fail('ACTION_SCOPE_CHANGED');
    return record;
  }

  function proposeAction({ context: rawContext, intent: rawIntent } = {}) {
    const context = validContext(rawContext);
    const intent = validIntent(rawIntent);
    current(context, intent);
    const scopedKey = digest([context.principalRef, context.worldRef, context.providerId, context.accountRef, intent.idempotencyKey]);
    const fingerprint = digest({ context, intent });
    if (idempotency.has(scopedKey)) {
      const existing = plans.get(idempotency.get(scopedKey));
      if (existing.fingerprint !== fingerprint) throw fail('ACTION_IDEMPOTENCY_CONFLICT');
      return { ...structuredClone(existing.plan), replayed: true };
    }
    const createdMs = now();
    if (!Number.isFinite(createdMs)) throw fail('ACTION_CLOCK_INVALID');
    const body = { schema: ACTION_PLAN_SCHEMA, mode: MOCK_MODE,
      planId: 'synthetic://host-action/plan-' + String(++sequence).padStart(6, '0'),
      actionKind: intent.actionKind, target: { providerId: context.providerId, accountRef: context.accountRef,
        recipientRef: intent.recipientRef, threadRef: intent.threadRef },
      draft: { draftRef: intent.draftRef, draftSha256: intent.draftSha256,
        attachmentDigests: [...intent.attachmentDigests] },
      expected: { principalRef: context.principalRef, worldRef: context.worldRef,
        accountEpoch: context.accountEpoch, grantVersion: context.grantVersion, sourceRevision: context.sourceRevision },
      createdAt: new Date(createdMs).toISOString(), expiresAt: new Date(createdMs + ttlMs).toISOString(),
      approvalPolicy: { ownerReviewRequired: true, channels: ['desktop-owner-token'], evidence: 'MOCK_ONLY' } };
    const plan = { ...body, planDigest: digest(body) };
    plans.set(plan.planId, { plan, context, intent, fingerprint, reviewDigest: null,
      state: 'proposed', claimed: false, receipt: null });
    idempotency.set(scopedKey, plan.planId);
    return structuredClone(plan);
  }

  function readback({ context: rawContext, planId } = {}) {
    const context = validContext(rawContext);
    const record = stored(planId, context);
    if (now() >= Date.parse(record.plan.expiresAt)) throw fail('ACTION_PLAN_EXPIRED');
    if (record.receipt) return { schema: ACTION_PORT_SCHEMA, mode: MOCK_MODE,
      planId, state: record.state, receipt: structuredClone(record.receipt) };
    record.reviewDigest = digest({ planDigest: record.plan.planDigest, context: record.context,
      recipientRef: record.intent.recipientRef, threadRef: record.intent.threadRef,
      draftSha256: record.intent.draftSha256 });
    return { schema: ACTION_PORT_SCHEMA, mode: MOCK_MODE, state: 'awaiting_mock_owner_review',
      plan: structuredClone(record.plan), reviewDigest: record.reviewDigest };
  }

  function mockReceipt(record, status, code = null) {
    const receipt = { schema: MOCK_RECEIPT_SCHEMA, marker: 'MOCK_RECEIPT', mode: MOCK_MODE,
      planId: record.plan.planId, planDigest: record.plan.planDigest, actionKind: record.intent.actionKind,
      status, at: new Date(now()).toISOString(), externalEffectPerformed: false,
      liveVerification: 'UNRUN', sourceRef: 'synthetic://host-action/receipt',
      ...(code ? { reasonCode: code } : {}) };
    record.receipt = receipt;
    record.state = status === 'applied' ? 'mock_applied' : status === 'failed' ? 'mock_failed' : 'uncertain';
    return structuredClone(receipt);
  }

  function approve({ context: rawContext, planId, planDigest, reviewDigest, approval } = {}) {
    const context = validContext(rawContext);
    const record = stored(planId, context);
    if (record.receipt) return { ...structuredClone(record.receipt), replayed: true };
    if (record.claimed) return mockReceipt(record, 'uncertain', 'CLAIM_WITHOUT_RECEIPT');
    if (now() >= Date.parse(record.plan.expiresAt)) throw fail('ACTION_PLAN_EXPIRED');
    if (planDigest !== record.plan.planDigest) throw fail('ACTION_PLAN_DIGEST_MISMATCH');
    if (!record.reviewDigest || record.reviewDigest !== reviewDigest) throw fail('ACTION_READBACK_REQUIRED');
    if (!exact(approval, ['channel', 'actor', 'decision']) || approval.channel !== 'desktop-owner-token' ||
        approval.actor !== 'mock-owner' || !['approve', 'deny'].includes(approval.decision)) {
      throw fail('ACTION_MOCK_OWNER_APPROVAL_REQUIRED');
    }
    if (approval.decision === 'deny') return mockReceipt(record, 'failed', 'OWNER_DENIED');
    // Simulates the Host claim fence ONLY. No actual dispatcher/journal/executor/send exists here.
    // Once claimed, a crash, partial result or exception stays UNCERTAIN; never rerun.
    record.claimed = true;
    record.state = 'mock_claimed';
    try {
      const simulated = mockOutcome({ plan: structuredClone(record.plan), context: structuredClone(context) });
      if (simulated?.kind === 'mock_applied') return mockReceipt(record, 'applied');
      if (simulated?.kind === 'mock_failed') return mockReceipt(record, 'failed', 'MOCK_PRECONDITION_FAILED');
      if (simulated?.kind === 'mock_partial') return mockReceipt(record, 'uncertain', 'MOCK_PARTIAL_UNVERIFIED');
      return mockReceipt(record, 'uncertain', 'MOCK_OUTCOME_UNVERIFIED');
    } catch {
      return mockReceipt(record, 'uncertain', 'MOCK_CLAIM_INTERRUPTED');
    }
  }

  function actionStatus({ context: rawContext, planId } = {}) {
    const context = validContext(rawContext);
    const record = stored(planId, context);
    return { schema: ACTION_PORT_SCHEMA, mode: MOCK_MODE, planId,
      state: record.claimed && !record.receipt ? 'uncertain' : record.state,
      receipt: record.receipt ? structuredClone(record.receipt) : null };
  }

  return Object.freeze({ schema: ACTION_PORT_SCHEMA, mode: MOCK_MODE,
    proposeAction, readback, approve, actionStatus });
}
