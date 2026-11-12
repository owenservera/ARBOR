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
    focus: { role: uncertain || sensitiveRevoked ? 'alert' : 'status', initialFocus: 'recovery-heading',
      escape: 'return_to_safe_screen', restoreFocus: true } };
}
