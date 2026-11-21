/**
 * Native/browser-safe adapter. Browser binding for the EXISTING #text composer in app.js.
 * No public window event, CLI or implicit submission.
 * Never call apply() from untrusted browser input. Host must admit every message.
 */
export type ComposerFence = Readonly<{
  epoch: string;
  sequence: number;
  regionId: string;
  viewRevision: number;
  sourceRevision: number;
}>;
export type AgentComposerCandidate = Readonly<{
  regionId: string;
  expectedSystemSequence: number;
  expectedRegionRevision: number;
  expectedSourceRevision: number;
  pointer: string;
  oldValue: string;
  newValue: string;
  correlationId: string;
  effectPerformed: false;
}>;
export type AuthorizedDraftDelivery = Readonly<{
  schema: 'vivim.agent-composer-delivery/1';
  epoch: string;
  actorId: string;
  candidate: AgentComposerCandidate;
}>;
export type LocalApplyOutcome =
  | { stage: 'applied-local'; correlationId: string; readbackMatches: true }
  | { stage: 'refused'; code: string; correlationId: string | null };
export interface ComposerField {
  value: string;
  disabled: boolean;
  readOnly: boolean;
  isConnected: boolean;
  dispatchEvent(event: Event): boolean;
  addEventListener(type: string, callback: EventListener): void;
  removeEventListener(type: string, callback: EventListener): void;
  focus?: () => void;
}
export interface ComposerBinding {
  field: ComposerField;
  currentFence: () => ComposerFence | null;
  /** Must verify fresh Host admission AND authenticated actor/grant/scope. */
  isAuthorizedDelivery: (message: AuthorizedDraftDelivery) => Promise<boolean>;
  /** Emit source-backed observation through incumbent Host ingress; no raw logs. */
  onLocalApplied: (args: {
    correlationId: string;
    actorId: string;
    text: string;
    priorFence: ComposerFence;
  }) => Promise<void>;
  maxLength: () => number;
  createInputEvent?: () => Event;
  focusOnApply?: boolean;
}

export function createComposerDraftAdapter(options: ComposerBinding) {
  if (!options.field || !options.currentFence || !options.isAuthorizedDelivery ||
      !options.onLocalApplied || !options.maxLength) throw Error('COMPONENT_BRIDGE_UNBOUND');
  const field = options.field;
  let composing = false;
  let stopped = false;
  let applying = false;
  const start = () => { composing = true; };
  const end = () => { composing = false; };
  field.addEventListener('compositionstart', start as EventListener);
  field.addEventListener('compositionend', end as EventListener);
  const refusal = (code: string, correlationId: string | null = null): LocalApplyOutcome =>
    ({ stage: 'refused', code, correlationId });
  return {
    async apply(message: AuthorizedDraftDelivery): Promise<LocalApplyOutcome> {
      const candidate = message?.candidate;
      const correlation = typeof candidate?.correlationId === 'string' ? candidate.correlationId : null;
      if (stopped || applying) return refusal('ADAPTER_NOT_READY', correlation);
      if (message?.schema !== 'vivim.agent-composer-delivery/1' ||
          !message.actorId || !message.epoch || !candidate ||
          candidate.effectPerformed !== false || !candidate.correlationId ||
          typeof candidate.oldValue !== 'string' || typeof candidate.newValue !== 'string')
        return refusal('INVALID_DELIVERY', correlation);
      applying = true;
      try {
        // No callback or failed Host verification -> fail closed.
        if (!(await options.isAuthorizedDelivery(message))) return refusal('HOST_NOT_AUTHORIZED', correlation);
        const fence = options.currentFence();
        if (!fence || fence.epoch !== message.epoch ||
            fence.regionId !== candidate.regionId ||
            fence.sequence !== candidate.expectedSystemSequence ||
            fence.viewRevision !== candidate.expectedRegionRevision ||
            fence.sourceRevision !== candidate.expectedSourceRevision)
          return refusal('STALE_REVISION_OR_SCOPE', correlation);
        if (!field.isConnected || field.disabled || field.readOnly || composing)
          return refusal('FIELD_NOT_EDITABLE', correlation);
        const maxLength = options.maxLength();
        if (!Number.isInteger(maxLength) || maxLength < 1 || maxLength > 4000)
          return refusal('BAD_COMPOSER_LIMIT', correlation);
        if (candidate.newValue.length > maxLength || candidate.newValue.includes('\0'))
          return refusal('DRAFT_TOO_LARGE', correlation);
        if (field.value !== candidate.oldValue) return refusal('HUMAN_DRAFT_CONFLICT', correlation);
        if (field.value === candidate.newValue) return refusal('NO_CHANGE', correlation);
        // PWA composer and native human input share this same semantic input handler.
        // Do NOT synthesize keydown/Enter/click/submit (those may SEND).
        field.value = candidate.newValue;
        field.dispatchEvent(options.createInputEvent?.() ?? new Event('input', { bubbles: true }));
        if (options.focusOnApply) field.focus?.();
        if (field.value !== candidate.newValue)
          return refusal('RENDER_READBACK_MISMATCH', correlation);
        // The only proof here is a local draft readback. Source/Host verification is later.
        await options.onLocalApplied({
          correlationId: candidate.correlationId, actorId: message.actorId,
          text: field.value, priorFence: fence
        });
        return { stage: 'applied-local', correlationId: candidate.correlationId, readbackMatches: true };
      } catch {
        // A callback may fail AFTER application: outcome is uncertain to the caller.
        return refusal('LOCAL_OUTCOME_UNCERTAIN', correlation);
      } finally {
        applying = false;
      }
    },
    dispose() {
      stopped = true;
      field.removeEventListener('compositionstart', start as EventListener);
      field.removeEventListener('compositionend', end as EventListener);
    }
  };
}
