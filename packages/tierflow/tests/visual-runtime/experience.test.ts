import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newJourney, projectJourney, transitionJourney, PAIRING_QR_ACCESSIBLE_NAME,
  PRIVACY_EXPLANATION, type JourneyState, type OnboardingEvidence,
} from '../../src/visual-runtime/experience/onboarding.ts';
import { projectRecovery, type RecoveryInput } from '../../src/visual-runtime/experience/recovery.ts';
const NOW = Date.UTC(2026, 10, 6, 16, 0);
const evid: OnboardingEvidence = {
  desktop: { computerReady: 'yes', dedicatedBrowserReady: 'yes' },
  provider: { source: 'studio', proof: 'provider_authenticated', observedAtMs: NOW - 10_000 },
  owner: { source: 'host', selectionConfirmed: 'yes' },
  phone: { source: 'host', enrolled: 'yes', permission: 'yes' },
  capability: { source: 'host', supported: 'yes', permitted: 'yes' },
  preview: { source: 'ui', safePreviewVerified: true },
  outcome: { source: 'host', state: 'applied', evidenceRef: 'receipt-001' },
  restart: { reconciled: true },
};
const stateAt = (current: JourneyState['current']): JourneyState =>
  ({ ...newJourney(), current, privacyAcknowledged: true });

test('initial state needs owner acknowledgement, and never mutates external state', () => {
  const s = newJourney();
  assert.equal(s.current, 'privacy');
  assert.equal(projectJourney(s, evid, NOW).steps[0]?.status, 'blocked');
  assert.equal(transitionJourney(s, 'next', evid, NOW).accepted, false);
  assert.equal(s.privacyAcknowledged, false);
  const ack = transitionJourney(s, 'acknowledge_privacy', evid, NOW);
  assert.equal(ack.accepted, true);
  assert.equal(transitionJourney(ack.state, 'next', evid, NOW).state.current, 'desktop');
});
test('complete fixture first-use navigation through receipt and restart', () => {
  let s: JourneyState = newJourney();
  s = transitionJourney(s, 'acknowledge_privacy', evid, NOW).state;
  for (const expected of ['desktop', 'provider', 'owner', 'pairing', 'discover', 'preview', 'receipt', 'resume']) {
    const transition = transitionJourney(s, 'next', evid, NOW);
    assert.equal(transition.accepted, true);
    s = transition.state;
    assert.equal(s.current, expected);
  }
  const v = projectJourney(s, evid, NOW);
  assert.equal(v.progress.completed, 9);
  assert.equal(v.progress.total, 9);
  assert.equal(transitionJourney(s, 'next', evid, NOW).accepted, false);
});
test('tab ready is not login verified, even from Studio', () => {
  const bad: OnboardingEvidence = { ...evid, provider: { source: 'studio', proof: 'tab_ready', observedAtMs: NOW } };
  const t = transitionJourney(stateAt('provider'), 'next', bad, NOW);
  assert.equal(t.accepted, false);
  assert.match(t.reason ?? '', /does not prove sign-in/i);
});
test('no sign-in proof from untrusted source or stale/future observation', () => {
  for (const provider of [
    { source: 'other', proof: 'provider_authenticated', observedAtMs: NOW },
    { source: 'studio', proof: 'provider_authenticated', observedAtMs: NOW - 300_001 },
    { source: 'studio', proof: 'provider_authenticated', observedAtMs: NOW + 1 },
    { source: 'studio', proof: 'signed_out', observedAtMs: NOW },
  ] as const) {
    assert.equal(transitionJourney(stateAt('provider'), 'next', { ...evid, provider }, NOW).accepted, false);
  }
});
test('no progression from browser readiness alone, and no owner grant via UI claim', () => {
  assert.equal(transitionJourney(stateAt('desktop'), 'next', { ...evid, desktop: { computerReady: 'yes', dedicatedBrowserReady: 'unknown' } }, NOW).accepted, false);
  assert.equal(transitionJourney(stateAt('owner'), 'next', { ...evid, owner: { source: 'other', selectionConfirmed: 'yes' } }, NOW).accepted, false);
});
test('optional phone skip requires current pairing step and does not claim paired state', () => {
  assert.equal(transitionJourney(stateAt('provider'), 'skip', evid, NOW).accepted, false);
  const skipped = transitionJourney(stateAt('pairing'), 'skip', { ...evid, phone: undefined }, NOW);
  assert.equal(skipped.accepted, true);
  assert.equal(skipped.state.current, 'discover');
  assert.equal(skipped.state.pairingSkipped, true);
  assert.equal(projectJourney(skipped.state, evid, NOW).steps[4]?.status, 'skipped');
});
test('QR accessible name excludes bearer token and privacy copy acknowledges data leaving PC', () => {
  const token = 'f'.repeat(64);
  const v = projectJourney(stateAt('pairing'), evid, NOW);
  assert.equal(v.pairingQrAccessibleName, PAIRING_QR_ACCESSIBLE_NAME);
  assert.equal(v.pairingQrAccessibleName.includes(token), false);
  assert.doesNotMatch(v.pairingQrAccessibleName, /https?:\/\//);
  assert.match(PRIVACY_EXPLANATION, /provider websites/);
  assert.match(PRIVACY_EXPLANATION, /paired phone/);
  assert.doesNotMatch(PRIVACY_EXPLANATION, /everything stays on (this|the) pc/i);
});
test('no completion on unpermitted capability, preview claim or uncertain outcome', () => {
  assert.equal(transitionJourney(stateAt('discover'), 'next', { ...evid, capability: { source: 'host', supported: 'yes', permitted: 'unknown' } }, NOW).accepted, false);
  assert.equal(transitionJourney(stateAt('preview'), 'next', { ...evid, preview: { source: 'ui', safePreviewVerified: false } }, NOW).accepted, false);
  assert.equal(transitionJourney(stateAt('receipt'), 'next', { ...evid, outcome: { source: 'host', state: 'uncertain' } }, NOW).accepted, false);
  assert.equal(transitionJourney(stateAt('receipt'), 'next', { ...evid, outcome: { source: 'other', state: 'applied', evidenceRef: 'x' } }, NOW).accepted, false);
});
test('resume, back, cancel and focus affordances do not auto advance', () => {
  let s = stateAt('provider');
  assert.equal(transitionJourney(s, 'back', evid, NOW).state.current, 'desktop');
  s = transitionJourney(s, 'cancel', evid, NOW).state;
  assert.equal(transitionJourney(s, 'next', evid, NOW).accepted, false);
  assert.equal(transitionJourney(s, 'resume', {}, NOW).state.current, 'provider');
  const v = projectJourney(s, evid, NOW);
  assert.equal(v.focus.statusLive, 'polite');
  assert.equal(v.steps[2]?.accessibleName, 'Step 3 of 9: Verify provider sign-in');
  assert.deepEqual(v.steps[2]?.actions.map(a => a.event), ['resume', 'help']);
});
test('repaired view uses explicit guidance for any blocked current step', () => {
  for (const id of ['privacy', 'desktop', 'provider', 'owner', 'pairing', 'discover', 'preview', 'receipt', 'resume'] as const) {
    const s = { ...newJourney(), current: id };
    const step = projectJourney(s, {}, NOW).steps.find(s => s.id === id);
    assert.equal(step?.status, 'blocked');
    assert.ok(step?.whyBlocked?.length);
    assert.ok(step.actions.some(a => a.event === 'cancel'));
  }
});
const recovery = (overrides: Partial<RecoveryInput> = {}): RecoveryInput => ({
  authority: 'host', stage: 'uncertain', operationKind: 'provider_send', offline: false,
  canCancel: true, canRequestUndo: true, statusCheckedByAuthority: false, ...overrides,
});
test('uncertain provider send and ACK loss are read-only reconcile, never replay', () => {
  for (const stage of ['pending', 'uncertain', 'offline'] as const) {
    const v = projectRecovery(recovery({ stage }));
    assert.equal(v.automaticRetryAllowed, false);
    assert.equal(v.retryPolicy, 'owner_reconcile_only');
    assert.equal(v.actions.some(x => x.kind === 'cancel_local' || x.kind === 'request_undo'), false);
  }
});
test('failed/denied/revoked and stale states have escape/help, no auto-send', () => {
  for (const stage of ['failed', 'denied', 'revoked', 'deleted', 'stale'] as const) {
    const v = projectRecovery(recovery({ stage }));
    assert.equal(v.automaticRetryAllowed, false);
    assert.equal(v.focus.escape, 'return_to_safe_screen');
    assert.ok(v.actions.some(x => x.kind === 'request_help'));
  }
});
test('revocation, deleted or offline KB suppresses cached sensitive projections', () => {
  assert.equal(projectRecovery(recovery({ authority: 'kb', operationKind: 'knowledge_read', stage: 'revoked' })).hideCachedSensitiveContent, true);
  assert.equal(projectRecovery(recovery({ authority: 'kb', operationKind: 'knowledge_read', stage: 'deleted' })).hideCachedSensitiveContent, true);
  assert.equal(projectRecovery(recovery({ authority: 'kb', operationKind: 'knowledge_read', stage: 'offline', offline: true })).hideCachedSensitiveContent, true);
});
test('only a verified UI revision exposes newly-authorized undo request', () => {
  const base = recovery({ authority: 'ui', operationKind: 'ui_revision', stage: 'applied', statusCheckedByAuthority: true });
  assert.equal(projectRecovery(base).actions.some(x => x.kind === 'request_undo' && x.requiresNewAuthorization), true);
  assert.equal(projectRecovery({ ...base, statusCheckedByAuthority: false }).actions.some(x => x.kind === 'request_undo'), false);
  assert.equal(projectRecovery({ ...base, offline: true }).actions.some(x => x.kind === 'request_undo'), false);
  assert.equal(projectRecovery({ ...base, authority: 'host' }).actions.some(x => x.kind === 'request_undo'), false);
});
test('unsigned journal is not signed proof; invalid references are suppressed', () => {
  const unsigned = projectRecovery(recovery({ stage: 'applied', receipt: { ref: 'journal:01', signatureState: 'unsigned' } }));
  assert.equal(unsigned.receipt?.signedReceiptProven, false);
  const verified = projectRecovery(recovery({ stage: 'applied', receipt: { ref: 'receipt:01', signatureState: 'verified' } }));
  assert.equal(verified.receipt?.signedReceiptProven, true);
  assert.equal(projectRecovery(recovery({ receipt: { ref: 'https://private.example/?token=abc', signatureState: 'verified' } })).receipt, undefined);
});
test('invalid runtime recovery stages fail closed without unsafe suggestion', () => {
  // I2-C step 2: these two inputs are deliberately invalid at runtime. They are
  // built as `unknown` and narrowed only at the call boundary so the negative
  // assertion keeps exercising projectRecovery's own runtime validation, without
  // widening RecoveryInput's contract or using `any`.
  const deliberatelyInvalid = (patch: Readonly<Record<string, unknown>>): RecoveryInput =>
    ({ ...recovery(), ...patch }) as unknown as RecoveryInput;
  assert.throws(() => projectRecovery(deliberatelyInvalid({ stage: 'unverified-success' })), /Invalid recovery/);
  assert.throws(() => projectRecovery(deliberatelyInvalid({ operationKind: 'external-send' })), /Invalid recovery/);
});

test('cancelled journey always offers visible resume and contextual help; help is state-preserving', () => {
  const s = transitionJourney(stateAt('desktop'), 'cancel', evid, NOW).state;
  const actions = projectJourney(s, evid, NOW).steps[1]?.actions;
  assert.deepEqual(actions?.map(a => a.event), ['resume', 'help']);
  assert.equal(transitionJourney(s, 'help', evid, NOW).state, s);
  assert.equal(transitionJourney(s, 'resume', {}, NOW).state.cancelled, false);
});
test('revocation preempts all read and effect retry policies', () => {
  for (const operationKind of ['provider_send', 'host_effect', 'knowledge_read'] as const) {
    assert.equal(projectRecovery(recovery({ stage: 'revoked', operationKind })).retryPolicy, 'never_retry');
  }
});
