# File: packages/tierflow/src/visual-runtime/host/outcome.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/host/outcome.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5373 B |
| Lines | 79 |
| Hash | b3bcf74e195b |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| source | const | 8 | no | const source = {authority: &#39;host-control-journal-fixture&#39;, proof: &#39;fixture_only&#39;} as const; |
| outcome | function | 9 | no | function outcome(status: HostActionOutcome[&#39;status&#39;], reasonCode: string, signatureState: HostActionOutcome[&#39;signatureState&#39;] = &#39;unknown&#39;, receipt?: HostGeneralJournalReceipt): HostActionOutcome { |
| fixtureReceiptPayload | function | 20 | yes | export function fixtureReceiptPayload(r: HostGeneralJournalReceipt): string { |
| projectObservedHostOutcome | function | 24 | yes | export function projectObservedHostOutcome( claim: HostClaimSnapshot, observed: HostReceiptObservation \| null, context: TrustedFixtureHostContext, testVerifier?: Readonly&lt;{keyId: string; secret: stri… |
| grant | const | 35 | no | const grant = context.grant; |
| r | const | 51 | no | const r = observed.receipt; |
| signatureState | variable | 59 | no | let signatureState: HostActionOutcome[&#39;signatureState&#39;] = &#39;unknown&#39;; |
| ev | const | 60 | no | const ev = observed.evidence; |
| actual | const | 69 | no | const actual = createHmac(&#39;sha256&#39;, testVerifier.secret).update(fixtureReceiptPayload(r)).digest(); |
| supplied | const | 70 | no | const supplied = Buffer.from(ev.macHex, &#39;hex&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ./port.ts | import | 3 | [packages/tierflow/src/visual-runtime/host/port.ts](./port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/host/fixture.ts](./fixture.ts.md) | ./outcome.ts |
| [packages/tierflow/tests/visual-runtime/host-security.test.ts](../../../tests/visual-runtime/host-security.test.ts.md) | ../../src/visual-runtime/host/outcome.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/host/outcome.ts |
| [packages/tierflow/tests/visual-runtime/wave3-h-host.test.ts](../../../tests/visual-runtime/wave3-h-host.test.ts.md) | ../../src/visual-runtime/host/outcome.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Read-only observation of Host journal evidence. No signature status is accepted from a receipt payload. */
import {createHmac, timingSafeEqual} from 'node:crypto';
import type {
  HostActionOutcome, HostClaimSnapshot, HostGeneralJournalReceipt,
  HostReceiptObservation, TrustedFixtureHostContext,
} from './port.ts';

const source = {authority: 'host-control-journal-fixture', proof: 'fixture_only'} as const;
function outcome(status: HostActionOutcome['status'], reasonCode: string,
  signatureState: HostActionOutcome['signatureState'] = 'unknown',
  receipt?: HostGeneralJournalReceipt): HostActionOutcome {
  return {
    schema: 'vivim.host-action-outcome/1', status, reasonCode, signatureState, source,
    ...(receipt ? {receiptRef: receipt.receiptRef, worldRevision: receipt.worldRevision} : {}),
    requiresReadOnlyReconcile: status === 'uncertain' || status === 'denied', effectInvoked: false,
  };
}

/** Exact canonical bytes for *synthetic* test-HMAC evidence; not a Host protocol or signer. */
export function fixtureReceiptPayload(r: HostGeneralJournalReceipt): string {
  return JSON.stringify([r.schema, r.planId, r.planDigest, r.actionId, r.status, r.receiptRef, r.worldRevision]);
}

export function projectObservedHostOutcome(
  claim: HostClaimSnapshot, observed: HostReceiptObservation | null,
  context: TrustedFixtureHostContext, testVerifier?: Readonly<{keyId: string; secret: string}>,
): HostActionOutcome {
  if (!context.authenticated || context.schema !== 'fixture.trusted-host-context/1' ||
      !context.ownerRef || !context.actorRef || !context.deviceRef || !context.sessionRef || !context.worldRef ||
      claim.ownerRef !== context.ownerRef || claim.actorRef !== context.actorRef ||
      claim.deviceRef !== context.deviceRef || claim.sessionRef !== context.sessionRef ||
      claim.worldRef !== context.worldRef) return outcome('denied', 'PRINCIPAL_SCOPE_MISMATCH');
  // An observation may only be shown to the still-authorized principal. Revoked phone
  // grants cannot use historical receipt references as a discovery side channel.
  const grant = context.grant;
  if (!grant || grant.status !== 'active' || !Number.isSafeInteger(context.nowMs) ||
      context.nowMs >= grant.expiresAtMs || context.nowMs >= context.sessionExpiresAtMs ||
      grant.ownerRef !== context.ownerRef || grant.actorRef !== context.actorRef ||
      grant.deviceRef !== context.deviceRef || grant.sessionRef !== context.sessionRef ||
      grant.worldRef !== context.worldRef ||
      !grant.scopes.some(scope => scope === 'control:read' || scope === 'control:execute'))
    return outcome('denied', 'RECONCILE_SCOPE_DENIED');
  if (claim.worldRevision !== context.worldRevision)
    return outcome('uncertain', 'WORLD_REVISION_CHANGED');
  if (claim.state !== 'claimed' && claim.state !== 'receipt') return outcome('denied', 'EFFECT_NOT_CLAIMED');
  if (!observed) return outcome('uncertain', 'CLAIM_WITHOUT_RECEIPT');
  if (!observed || typeof observed !== 'object' || !observed.receipt || !observed.evidence ||
      Object.hasOwn(observed, 'signatureState') || Object.hasOwn(observed.receipt, 'signatureState'))
    return outcome('denied', 'RECEIPT_CLAIMED_SIGNATURE_STATUS', 'invalid');

  const r = observed.receipt;
  if (r.schema !== 'vivim.control-receipt/1' ||
      !['applied','failed','uncertain'].includes(r.status) ||
      typeof r.receiptRef !== 'string' || r.receiptRef.length < 1 || r.receiptRef.length > 160 ||
      r.planId !== claim.planId || r.planDigest !== claim.planDigest ||
      r.actionId !== claim.actionId || r.worldRevision !== claim.worldRevision)
    return outcome('denied', 'RECEIPT_CONTEXT_MISMATCH', 'invalid');

  let signatureState: HostActionOutcome['signatureState'] = 'unknown';
  const ev = observed.evidence;
  if (ev.kind === 'unsigned-general-journal') {
    if (Object.keys(ev).length !== 1) return outcome('denied', 'RECEIPT_EVIDENCE_INVALID', 'invalid');
    signatureState = 'unsigned';
  } else if (ev.kind === 'test-hmac') {
    if (typeof ev.macHex !== 'string' || !/^[a-f0-9]{64}$/.test(ev.macHex) ||
        typeof ev.keyId !== 'string' || Object.keys(ev).length !== 3)
      return outcome('denied', 'RECEIPT_EVIDENCE_INVALID', 'invalid');
    if (!testVerifier || testVerifier.keyId !== ev.keyId) return outcome('uncertain', 'SIGNATURE_VERIFIER_UNAVAILABLE');
    const actual = createHmac('sha256', testVerifier.secret).update(fixtureReceiptPayload(r)).digest();
    const supplied = Buffer.from(ev.macHex, 'hex');
    if (!timingSafeEqual(actual, supplied)) return outcome('denied', 'RECEIPT_SIGNATURE_INVALID', 'invalid');
    signatureState = 'verified'; // only within the named TEST verifier, never a production Host signature
  } else if (ev.kind === 'unknown' && Object.keys(ev).length === 1) {
    return outcome('uncertain', 'RECEIPT_PROVENANCE_UNKNOWN');
  } else return outcome('denied', 'RECEIPT_EVIDENCE_INVALID', 'invalid');
  if (r.status === 'uncertain') return outcome('uncertain', 'HOST_EFFECT_UNCERTAIN', signatureState, r);
  if (observed.replayed === true && r.status === 'applied') return outcome('replayed', 'READ_ONLY_REPLAY_OBSERVED', signatureState, r);
  return outcome(r.status, r.status === 'applied' ? 'HOST_RECEIPT_OBSERVED' : 'HOST_RECEIPT_FAILED', signatureState, r);
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
