// Unit gate for NEXT:D06-C-VERIFIED-TURN-PROJECTION.
//
// Acceptance: "Real product caller and consumer proven; no duplicated Host effect path."
//
// Covers the harness caller + consumer seam over owned surfaces:
//   - studio/src/capture/harness-runs.mjs   :: createHarnessRunStore  (durable step ledger; uncertain is never succeeded)
//   - studio/src/studio/intent-bindings.mjs :: createIntentBindingStore (pre-effect intent binding + journal-turn completion)
//   - studio/src/studio/uncertain-step-reconciler.mjs :: reconcileUncertainStep (durable binding<->journal join required)
//
// These are pure over durable records plus an injected executor: no browser, no Host effect,
// no second persistence owner, no send/retry authorization. An uncertain step stays uncertain;
// a successful verdict requires the proven durable join; nothing dispatches.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createHarnessRunStore, argsDigestOf } from '../../src/capture/harness-runs.mjs';
import { createIntentBindingStore } from '../../src/studio/intent-bindings.mjs';
import { reconcileUncertainStep } from '../../src/studio/uncertain-step-reconciler.mjs';

const DIGEST = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const submitArgs = { conversation: 'conv-1', key: 'req-1', prompt: 'turn one', confirm: true, expectedRevision: 0 };

function tmpRoot(t, prefix) {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

// ---- harness-runs.mjs :: uncertain delivery is never promoted to success ----

test('harness run store succeeds a proven effect and never promotes an uncertain/unknown effect to success', async (t) => {
  const root = tmpRoot(t, 'harness-run-');
  let effectCalls = 0;
  const executor = async ({ tool }) => {
    effectCalls++;
    return { ok: true, tool };
  };
  const runs = createHarnessRunStore({ dir: path.join(root, 'runs'), toolExecutor: executor, retryableTools: [] });
  const run = runs.create({ task: 'submit one turn', conversationId: 'conv-1' });

  // A real executor success -> step is 'succeeded', exactly one effect invocation.
  const out = await runs.step(run.id, { key: 'k1', tool: 'submit_conversation_turn', args: submitArgs });
  assert.equal(out.step.status, 'succeeded');
  assert.equal(effectCalls, 1);
  assert.equal(out.result.ok, true);

  // Same key + same args replays the recorded outcome: no second effect dispatch.
  const replay = await runs.step(run.id, { key: 'k1', tool: 'submit_conversation_turn', args: submitArgs });
  assert.equal(replay.replayed, true);
  assert.equal(replay.step.status, 'succeeded');
  assert.equal(effectCalls, 1, 'replay must not re-invoke the effect owner');

  // Unknown effect (thrown without not_dispatched) -> step fenced 'uncertain', never 'succeeded'.
  const unknownEffect = async () => { throw Object.assign(new Error('lost'), { code: 'ACK_LOST', effectState: 'unknown' }); };
  const runs2 = createHarnessRunStore({ dir: path.join(root, 'runs2'), toolExecutor: unknownEffect, retryableTools: [] });
  const run2 = runs2.create({ task: 'uncertain turn' });
  let threw;
  try { await runs2.step(run2.id, { key: 'k2', tool: 'submit_conversation_turn', args: { ...submitArgs, key: 'k2' } }); }
  catch (e) { threw = e; }
  assert.ok(threw, 'unknown effect must surface to the caller');
  // The store fences the step as uncertain; it never records 'succeeded' for an unknown effect.
  const step2 = runs2.get(run2.id).steps.find((s) => s.key === 'k2');
  assert.equal(step2.status, 'uncertain', 'unknown effect stays uncertain, never succeeded');
  assert.equal(step2.summary.effectState, 'unknown');

  // Proven not-dispatched (read-only-safe failure) -> 'failed', safe to record, still not success.
  const notDispatched = async () => { throw Object.assign(new Error('refused'), { code: 'SEND_REFUSED', effectState: 'not_dispatched' }); };
  const runs3 = createHarnessRunStore({ dir: path.join(root, 'runs3'), toolExecutor: notDispatched, retryableTools: [] });
  const run3 = runs3.create({ task: 'refused turn' });
  try { await runs3.step(run3.id, { key: 'k3', tool: 'submit_conversation_turn', args: { ...submitArgs, key: 'k3' } }); }
  catch (e) { assert.equal(e.code, 'SEND_REFUSED'); }
  const step3 = runs3.get(run3.id).steps.find((s) => s.key === 'k3');
  assert.equal(step3.status, 'failed');
  assert.equal(step3.summary.effectState, 'not_dispatched');
});

// ---- intent-bindings.mjs :: pre-effect binding completed with journal turn identity ----

test('intent binding records same intent once and completes with the journal turn identity', async (t) => {
  const root = tmpRoot(t, 'intent-bind-');
  const store = createIntentBindingStore({ dir: path.join(root, 'bindings') });

  const a = store.record({ runId: 'run-1', stepKey: 's1', stepTool: 'submit_conversation_turn', argsDigest: DIGEST, conversationId: 'conv-1', threadKey: 'th-1' });
  assert.equal(a.source, 'trusted-pre-effect');
  assert.equal(a.journalTurnKey, null);
  assert.equal(a.journalPayloadDigest, null);

  // Same intent again is a read-only replay of the same record: no second effect grant.
  const b = store.record({ runId: 'run-1', stepKey: 's1', stepTool: 'submit_conversation_turn', argsDigest: DIGEST, conversationId: 'conv-1', threadKey: 'th-1' });
  assert.equal(b.recordedAt, a.recordedAt);
  assert.equal(b.journalTurnKey, null);

  // Different intent for the same step key conflicts (fail closed).
  assert.throws(() => store.record({ runId: 'run-1', stepKey: 's1', stepTool: 'submit_conversation_turn', argsDigest: 'b'.repeat(64), conversationId: 'conv-1', threadKey: 'th-1' }),
    /INTENT_BINDING_CONFLICT/);

  // Completion joins the binding to the observed journal turn identity.
  const completed = store.complete({ runId: 'run-1', stepKey: 's1', journalTurnKey: 'turn-1', journalPayloadDigest: DIGEST });
  assert.equal(completed.journalTurnKey, 'turn-1');
  assert.equal(completed.journalPayloadDigest, DIGEST);
  assert.ok(completed.completedAt);

  // Re-completion with the same identity is idempotent; mismatched identity is refused.
  const again = store.complete({ runId: 'run-1', stepKey: 's1', journalTurnKey: 'turn-1', journalPayloadDigest: DIGEST });
  assert.equal(again.journalTurnKey, 'turn-1');
  assert.throws(() => store.complete({ runId: 'run-1', stepKey: 's1', journalTurnKey: 'turn-other', journalPayloadDigest: DIGEST }),
    /INTENT_BINDING_CONFLICT/);

  const found = store.find({ runId: 'run-1', stepKey: 's1' });
  assert.ok(found && found.journalTurnKey === 'turn-1');
  assert.ok(store.verify(found, { runId: 'run-1', stepKey: 's1', stepTool: 'submit_conversation_turn', argsDigest: DIGEST, conversationId: 'conv-1' }));
});

// ---- uncertain-step-reconciler.mjs :: durable join required, no promotion, no dispatch ----

test('reconciler requires the proven durable binding<->journal join and never authorizes retry or dispatch', () => {
  const run = {
    schema: 'capture-studio.harness-run/1', id: 'run-1', conversationId: 'conv-1',
    steps: [{ key: 's1', tool: 'submit_conversation_turn', argsDigest: DIGEST, status: 'uncertain' }],
  };
  const executedReconciler = () => ({ verdict: 'executed', reason: 'TEST' });

  // No durable intent binding at all -> still_unknown, even though the injected reconciler says executed.
  const noBinding = reconcileUncertainStep({ run, stepKey: 's1', journal: { version: 2, threadKey: 'th-1', turns: [] }, intentBinding: null, reconcileUncertainStep: executedReconciler, origin: 'https://chat.example' });
  assert.equal(noBinding.verdict, 'still_unknown');
  assert.equal(noBinding.reason, 'DURABLE_INTENT_BINDING_MISSING_OR_MISMATCHED');
  assert.equal(noBinding.retryAuthorized, false);
  assert.equal(noBinding.mutates, false);

  // Durable binding but empty/wrong journal -> still_unknown (join not proven).
  const noJournal = reconcileUncertainStep({ run, stepKey: 's1', journal: { version: 2, threadKey: 'th-1', turns: [] },
    intentBinding: { source: 'trusted-pre-effect', runId: 'run-1', stepKey: 's1', stepTool: 'submit_conversation_turn', argsDigest: DIGEST, conversationId: 'conv-1', threadKey: 'th-1', journalTurnKey: 'turn-1', journalPayloadDigest: DIGEST },
    reconcileUncertainStep: executedReconciler, origin: 'https://chat.example' });
  assert.equal(noJournal.verdict, 'still_unknown');
  assert.equal(noJournal.reason, 'JOURNAL_TURN_NOT_UNIQUE_OR_MISSING');
  assert.equal(noJournal.retryAuthorized, false);

  // Proven durable join + reconciler verdict executed -> projected executed, but retryAuthorized stays false and mutates stays false.
  const deliveredJournal = { version: 2, threadKey: 'th-1', turns: [{ key: 'turn-1', id: 't1', conversationId: 'conv-1', payloadDigest: DIGEST,
    boundary: { sessionId: 'sess-1', sequence: 5, transcriptCount: 0 },
    delivery: { state: 'observed', evidence: { turnId: 't1', payloadDigest: DIGEST, sessionId: 'sess-1', sequence: 6, kind: 'outgoing-request', source: 'network', identity: 'out-1' } },
    reply: { state: 'unknown', evidence: null }, completion: { state: 'unknown', evidence: null }, readiness: { state: 'unknown', evidence: null }, preEffect: null, reason: null }] };
  const fullBinding = { source: 'trusted-pre-effect', runId: 'run-1', stepKey: 's1', stepTool: 'submit_conversation_turn', argsDigest: DIGEST, conversationId: 'conv-1', threadKey: 'th-1', journalTurnKey: 'turn-1', journalPayloadDigest: DIGEST };
  const joined = reconcileUncertainStep({ run, stepKey: 's1', journal: deliveredJournal, intentBinding: fullBinding, reconcileUncertainStep: executedReconciler, origin: 'https://chat.example' });
  assert.equal(joined.verdict, 'executed');
  assert.equal(joined.retryAuthorized, false);
  assert.equal(joined.mutates, false);

  // A turn with a trusted pre-effect proof (nothing typed/dispatched) and no delivery -> not_executed, never retried.
  const noEffectJournal = { version: 2, threadKey: 'th-1', turns: [{ key: 'turn-1', id: 't1', conversationId: 'conv-1', payloadDigest: DIGEST, phase: 'blocked',
    boundary: { sessionId: 'sess-1', sequence: 5, transcriptCount: 0 },
    delivery: { state: 'unknown', evidence: null }, reply: { state: 'unknown', evidence: null }, completion: { state: 'unknown', evidence: null }, readiness: { state: 'unknown', evidence: null },
    preEffect: { turnId: 't1', payloadDigest: DIGEST, kind: 'pre-effect-blocked', source: 'actuator-audit', reference: 'service-preflight:t1', typing: 'not-executed', dispatch: 'not-executed' }, reason: null }] };
  const unresolved = reconcileUncertainStep({ run, stepKey: 's1', journal: noEffectJournal, intentBinding: fullBinding, reconcileUncertainStep: executedReconciler, origin: 'https://chat.example' });
  assert.equal(unresolved.verdict, 'not_executed');
  assert.equal(unresolved.reason, 'TRUSTED_PRE_EFFECT_AUDIT');
  assert.equal(unresolved.retryAuthorized, false);
});

// argsDigestOf is canonical and order-independent (the harness keys steps by intent, not insertion order).
test('argsDigestOf is canonical and order-independent', () => {
  const a = argsDigestOf({ b: 2, a: 1 });
  const b = argsDigestOf({ a: 1, b: 2 });
  assert.equal(a, b);
  assert.notEqual(a, argsDigestOf({ a: 1, b: 3 }));
});
