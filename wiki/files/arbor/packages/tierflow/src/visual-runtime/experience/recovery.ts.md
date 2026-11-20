# File: packages/tierflow/src/visual-runtime/experience/recovery.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/experience/recovery.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5841 B |
| Lines | 83 |
| Hash | 090e41f01e62 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RECOVERY_SCHEMA | const | 2 | yes | export const RECOVERY_SCHEMA = &#39;RecoveryView/1&#39; as const; |
| RecoveryAuthority | type | 3 | yes | export type RecoveryAuthority = &#39;ui&#39; \| &#39;host&#39; \| &#39;kb&#39; \| &#39;platform&#39;; |
| RecoveryStage | type | 4 | yes | export type RecoveryStage = &#39;pending&#39; \| &#39;applied&#39; \| &#39;failed&#39; \| &#39;denied&#39; \| &#39;uncertain&#39; \| &#39;offline&#39; \| &#39;revoked&#39; \| &#39;deleted&#39; \| &#39;stale&#39;; |
| RetryPolicy | type | 5 | yes | export type RetryPolicy = &#39;safe_read&#39; \| &#39;idempotent_command&#39; \| &#39;owner_reconcile_only&#39; \| &#39;never_retry&#39;; |
| RecoveryInput | interface | 6 | yes | export interface RecoveryInput { |
| RecoveryAction | interface | 19 | yes | export interface RecoveryAction { |
| RecoveryView | interface | 25 | yes | export interface RecoveryView { |
| validRef | function | 38 | no | const validRef = (s: string): boolean =&gt; /^[A-Za-z0-9_.:-]{1,100}$/.test(s); |
| act | function | 39 | no | const act = (kind: RecoveryAction[&#39;kind&#39;], label: string, auth = false): RecoveryAction =&gt; ({ kind, label, textEquivalent: `recovery ${kind.replaceAll(&#39;_&#39;, &#39;-&#39;)}`, requiresNewAuthorization: auth, }); |
| projectRecovery | function | 42 | yes | export function projectRecovery(input: RecoveryInput): RecoveryView { |
| uncertain | const | 48 | no | const uncertain = input.stage === &#39;uncertain&#39; \|\| input.stage === &#39;pending&#39;; |
| sensitiveRevoked | const | 49 | no | const sensitiveRevoked = input.stage === &#39;revoked&#39; \|\| input.stage === &#39;deleted&#39;; |
| effect | const | 50 | no | const effect = input.operationKind === &#39;provider_send&#39; \|\| input.operationKind === &#39;host_effect&#39;; |
| retryPolicy | const | 52 | no | const retryPolicy: RetryPolicy = sensitiveRevoked ? &#39;never_retry&#39; : |
| descriptions | const | 54 | no | const descriptions: Record&lt;RecoveryStage, string&gt; = { |
| receipt | const | 65 | no | const receipt = input.receipt &amp;&amp; validRef(input.receipt.ref) ? { |
| actions | const | 69 | no | const actions: RecoveryAction[] = [act(&#39;inspect_status&#39;, &#39;Check authoritative status (read only)&#39;)]; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](./wave3-journey-fixture.ts.md) | ./recovery.ts |
| [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](../host/wave3-read-gateway-fixture.ts.md) | ../experience/recovery.ts |
| [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../host/wave4-h-host-status-contract.ts.md) | ../experience/recovery.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../experience/recovery.ts |
| [packages/tierflow/tests/visual-runtime/experience.test.ts](../../../tests/visual-runtime/experience.test.ts.md) | ../../src/visual-runtime/experience/recovery.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/experience/recovery.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Inert recovery display projection. Never retries or invokes Host/browser/UI effects. */
export const RECOVERY_SCHEMA = 'RecoveryView/1' as const;
export type RecoveryAuthority = 'ui' | 'host' | 'kb' | 'platform';
export type RecoveryStage = 'pending' | 'applied' | 'failed' | 'denied' | 'uncertain' | 'offline' | 'revoked' | 'deleted' | 'stale';
export type RetryPolicy = 'safe_read' | 'idempotent_command' | 'owner_reconcile_only' | 'never_retry';
export interface RecoveryInput {
  readonly authority: RecoveryAuthority;
  readonly stage: RecoveryStage;
  readonly operationKind: 'ui_revision' | 'provider_send' | 'host_effect' | 'knowledge_read' | 'device_pair';
  readonly reasonCode?: string;
  readonly receipt?: { readonly ref: string; readonly signatureState: 'verified' | 'unsigned' | 'unknown' | 'invalid' };
  readonly lastKnownRevision?: string;
  readonly offline: boolean;
  readonly canCancel: boolean;
  /** A verified owner-authorized UI rollback option, not an effect permission. */
  readonly canRequestUndo: boolean;
  readonly statusCheckedByAuthority: boolean;
}
export interface RecoveryAction {
  readonly kind: 'inspect_status' | 'request_help' | 'cancel_local' | 'request_undo' | 'return_to_safe_screen';
  readonly label: string;
  readonly textEquivalent: string;
  readonly requiresNewAuthorization: boolean;
}
export interface RecoveryView {
  readonly schema: typeof RECOVERY_SCHEMA;
  readonly stage: RecoveryStage;
  readonly title: string;
  readonly explanation: string;
  readonly retryPolicy: RetryPolicy;
  readonly automaticRetryAllowed: false;
  readonly actions: readonly RecoveryAction[];
  readonly receipt?: { readonly ref: string; readonly signatureState: 'verified' | 'unsigned' | 'unknown' | 'invalid'; readonly signedReceiptProven: boolean };
  readonly revision?: string;
  readonly hideCachedSensitiveContent: boolean;
  readonly focus: { readonly role: 'alert' | 'status'; readonly initialFocus: 'recovery-heading'; readonly escape: 'return_to_safe_screen'; readonly restoreFocus: true };
}
const validRef = (s: string): boolean => /^[A-Za-z0-9_.:-]{1,100}$/.test(s);
const act = (kind: RecoveryAction['kind'], label: string, auth = false): RecoveryAction => ({
  kind, label, textEquivalent: `recovery ${kind.replaceAll('_', '-')}`, requiresNewAuthorization: auth,
});
export function projectRecovery(input: RecoveryInput): RecoveryView {
  if (!input || !['ui', 'host', 'kb', 'platform'].includes(input.authority) ||
    !['pending', 'applied', 'failed', 'denied', 'uncertain', 'offline', 'revoked', 'deleted', 'stale'].includes(input.stage) ||
    !['ui_revision', 'provider_send', 'host_effect', 'knowledge_read', 'device_pair'].includes(input.operationKind)) {
    throw new TypeError('Invalid recovery input; no action may be inferred');
  }
  const uncertain = input.stage === 'uncertain' || input.stage === 'pending';
  const sensitiveRevoked = input.stage === 'revoked' || input.stage === 'deleted';
  const effect = input.operationKind === 'provider_send' || input.operationKind === 'host_effect';
  const readOnly = input.operationKind === 'knowledge_read';
  const retryPolicy: RetryPolicy = sensitiveRevoked ? 'never_retry' :
    uncertain || effect || input.offline ? 'owner_reconcile_only' : readOnly ? 'safe_read' : 'owner_reconcile_only';
  const descriptions: Record<RecoveryStage, string> = {
    pending: 'An operation is still pending. Check its authoritative status before trying anything else.',
    applied: 'The owning service reports an applied outcome. Receipt verification is shown separately.',
    failed: 'The owning service reported failure. Review the cause before requesting any new action.',
    denied: 'The action was refused. Permission cannot be changed from this recovery screen.',
    uncertain: 'The result is uncertain, possibly after an external send. Never automatically resend; reconcile read-only with the owner.',
    offline: 'The owner service is offline. Current permission and results cannot be verified.',
    revoked: 'Access was revoked. Previously cached sensitive information must be withheld until reauthorized.',
    deleted: 'The source was deleted or tombstoned. Do not restore old cached information.',
    stale: 'This result is stale. Request a new authorized snapshot before deciding what to do.',
  };
  const receipt = input.receipt && validRef(input.receipt.ref) ? {
    ref: input.receipt.ref, signatureState: input.receipt.signatureState,
    signedReceiptProven: input.receipt.signatureState === 'verified',
  } : undefined;
  const actions: RecoveryAction[] = [act('inspect_status', 'Check authoritative status (read only)')];
  if (input.canCancel && !uncertain && !effect) actions.push(act('cancel_local', 'Cancel local draft'));
  if (input.canRequestUndo && input.authority === 'ui' && input.operationKind === 'ui_revision' &&
      input.stage === 'applied' && input.statusCheckedByAuthority && !input.offline) {
    actions.push(act('request_undo', 'Request a newly authorized rollback', true));
  }
  actions.push(act('request_help', 'Explain this outcome'), act('return_to_safe_screen', 'Return to a safe screen'));
  return { schema: RECOVERY_SCHEMA, stage: input.stage, title: `Recovery: ${input.stage}`,
    explanation: descriptions[input.stage], retryPolicy, automaticRetryAllowed: false, actions,
    ...(receipt ? { receipt } : {}),
    ...(input.lastKnownRevision && validRef(input.lastKnownRevision) ? { revision: input.lastKnownRevision } : {}),
    hideCachedSensitiveContent: sensitiveRevoked || (input.offline && input.authority === 'kb'),
```

_First 80 of 84 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
