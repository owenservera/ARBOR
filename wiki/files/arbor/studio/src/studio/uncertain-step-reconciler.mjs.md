# File: studio/src/studio/uncertain-step-reconciler.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/uncertain-step-reconciler.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5012 B |
| Lines | 72 |
| Hash | b3d9760fea5b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RECONCILER_SCHEMA | const | 6 | yes | export const RECONCILER_SCHEMA = &#39;aion.harness-step-reconciliation/1&#39;; |
| hex64 | function | 7 | no | const hex64 = (s) =&gt; typeof s === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(s); |
| nonempty | function | 8 | no | const nonempty = (s) =&gt; typeof s === &#39;string&#39; &amp;&amp; s.length &gt; 0; |
| action | const | 9 | no | const action = { |
| outcome | function | 14 | no | const outcome = (verdict, reason, evidence = []) =&gt; Object.freeze({ schema: RECONCILER_SCHEMA, verdict, reason, evidence: evidence.map(x =&gt; ({ ...x })), operatorAction: action[verdict], mutates: fals… |
| reconcileUncertainStep | function | 25 | yes | export function reconcileUncertainStep({ run, stepKey, journal, intentBinding } = {}) { |
| steps | const | 28 | no | const steps = run.steps.filter(x =&gt; x?.key === stepKey); |
| step | const | 30 | no | const step = steps[0]; |
| b | const | 38 | no | const b = intentBinding; |
| matches | const | 47 | no | const matches = journal.turns.filter(t =&gt; t?.key === b.journalTurnKey); |
| t | const | 49 | no | const t = matches[0]; |
| d | const | 53 | no | const d = t.delivery, e = d?.evidence, boundary = t.boundary; |
| positiveDelivery | const | 54 | no | const positiveDelivery = d?.state === &#39;observed&#39; &amp;&amp; e &amp;&amp; boundary &amp;&amp; |
| proof | const | 59 | no | const proof = t.preEffect; |
| positiveNoEffect | const | 60 | no | const positiveNoEffect = t.phase === &#39;blocked&#39; &amp;&amp; proof?.kind === &#39;pre-effect-blocked&#39; &amp;&amp; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/harness-api.mjs](./harness-api.mjs.md) | ./uncertain-step-reconciler.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// AION Agent 14 / Round 7. Pure, read-only classification; NEVER dispatches or mutates.
// Contract source: Capture Studio src/capture/thread-turn-journal.mjs schema v2,
// Z.ai Round 6 src/capture/harness-runs.mjs schema capture-studio.harness-run/1.
// A caller MUST supply an independently persisted, trustworthy exact intentBinding.
// Neither run/step timestamps nor prompt text nor matching conversation IDs are a join key.
export const RECONCILER_SCHEMA = 'aion.harness-step-reconciliation/1';
const hex64 = (s) => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);
const nonempty = (s) => typeof s === 'string' && s.length > 0;
const action = {
  executed: 'Inspect journal evidence and current page; do not resend the effect. Qualify downstream response separately.',
  not_executed: 'Reconcile the owning journal and effect owner first; this read-only verdict is not authorization to retry.',
  still_unknown: 'Keep the existing run and journal effect fences. Collect authoritative evidence; never auto-resend.'
};
const outcome = (verdict, reason, evidence = []) => Object.freeze({
  schema: RECONCILER_SCHEMA, verdict, reason,
  evidence: evidence.map(x => ({ ...x })), operatorAction: action[verdict],
  mutates: false, retryAuthorized: false
});

// Inputs are parsed snapshots; journal's checksum/shape verification belongs to its owner.
// Binding MUST have been durably recorded before effect dispatch, not reconstructed afterward.
// Bindings marked `trusted-pre-effect` are a claimed trust boundary; the caller must verify
// their provenance from local durable effect-owner records before invoking this function.
// @serves 096
export function reconcileUncertainStep({ run, stepKey, journal, intentBinding } = {}) {
  if (run?.schema !== 'capture-studio.harness-run/1' || !Array.isArray(run.steps))
    return outcome('still_unknown', 'RUN_INVALID_OR_UNAVAILABLE');
  const steps = run.steps.filter(x => x?.key === stepKey);
  if (steps.length !== 1) return outcome('still_unknown', steps.length ? 'MULTIPLE_STEP_ATTEMPTS' : 'STEP_NOT_FOUND');
  const step = steps[0];
  if (!['in_flight', 'uncertain'].includes(step.status))
    return outcome('still_unknown', 'STEP_NOT_UNRESOLVED');
  if (step.tool !== 'submit_conversation_turn')
    return outcome('still_unknown', 'TOOL_NOT_SUPPORTED');
  if (!hex64(step.argsDigest) || !nonempty(run.id) || !nonempty(run.conversationId))
    return outcome('still_unknown', 'STEP_IDENTITY_INCOMPLETE');

  const b = intentBinding;
  if (b?.source !== 'trusted-pre-effect' || b?.runId !== run.id || b?.stepKey !== step.key ||
      b?.stepTool !== step.tool || b?.argsDigest !== step.argsDigest ||
      b?.conversationId !== run.conversationId || !nonempty(b?.threadKey) ||
      !nonempty(b?.journalTurnKey) || !hex64(b?.journalPayloadDigest))
    return outcome('still_unknown', 'DURABLE_INTENT_BINDING_MISSING_OR_MISMATCHED');

  if (journal?.version !== 2 || journal?.threadKey !== b.threadKey || !Array.isArray(journal.turns))
    return outcome('still_unknown', 'JOURNAL_MISSING_OR_WRONG_THREAD');
  const matches = journal.turns.filter(t => t?.key === b.journalTurnKey);
  if (matches.length !== 1) return outcome('still_unknown', 'JOURNAL_TURN_NOT_UNIQUE_OR_MISSING');
  const t = matches[0];
  if (t.payloadDigest !== b.journalPayloadDigest || t.conversationId !== b.conversationId || !nonempty(t.id))
    return outcome('still_unknown', 'JOURNAL_INTENT_MISMATCH');

  const d = t.delivery, e = d?.evidence, boundary = t.boundary;
  const positiveDelivery = d?.state === 'observed' && e && boundary &&
    e.turnId === t.id && e.payloadDigest === t.payloadDigest && e.sessionId === boundary.sessionId &&
    Number.isSafeInteger(e.sequence) && Number.isSafeInteger(boundary.sequence) && e.sequence > boundary.sequence &&
    nonempty(e.identity) && ((e.source === 'network' && e.kind === 'outgoing-request') ||
    (e.source === 'page' && e.kind === 'new-user-turn'));
  const proof = t.preEffect;
  const positiveNoEffect = t.phase === 'blocked' && proof?.kind === 'pre-effect-blocked' &&
    proof?.source === 'actuator-audit' && proof?.turnId === t.id && proof?.payloadDigest === t.payloadDigest &&
    proof?.typing === 'not-executed' && proof?.dispatch === 'not-executed' && nonempty(proof?.reference);
  if (positiveDelivery && positiveNoEffect) return outcome('still_unknown', 'CONTRADICTORY_JOURNAL_PROOFS');
  if (positiveDelivery) return outcome('executed', 'JOURNAL_CONFIRMS_DELIVERY', [
    { source: e.source, kind: e.kind, sessionId: e.sessionId, sequence: e.sequence, identity: e.identity,
      journalTurnId: t.id, journalKey: t.key }
  ]);
  if (positiveNoEffect && d?.state !== 'observed') return outcome('not_executed', 'TRUSTED_PRE_EFFECT_AUDIT', [
    { source: proof.source, kind: proof.kind, reference: proof.reference, journalTurnId: t.id, journalKey: t.key }
  ]);
  return outcome('still_unknown', 'NO_POSITIVE_DISPATCH_OR_PRE_EFFECT_PROOF');
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
