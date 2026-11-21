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
  /** Visual-only pacing of an already Host-approved draft. Defaults to one update. */
  typingIntervalMs?: number;
}

export function createComposerDraftAdapter(options: ComposerBinding) {
  if (!options.field || !options.currentFence || !options.isAuthorizedDelivery ||
      !options.onLocalApplied || !options.maxLength) throw Error('COMPONENT_BRIDGE_UNBOUND');
  const field = options.field;
  let composing = false;
  let stopped = false;
  let applying = false;
  let humanInputVersion = 0;
  const ownEvents = new WeakSet<Event>();
  const onInput = (event: Event) => {
    if (!ownEvents.has(event)) humanInputVersion++;
  };
  field.addEventListener('input', onInput as EventListener);
  function emitInput() {
    const event = options.createInputEvent?.() ?? new Event('input', { bubbles: true });
    ownEvents.add(event);
    field.dispatchEvent(event);
  }
  async function applyVisibleDraft(oldText: string, newText: string, fence: ComposerFence) {
    const pace = options.typingIntervalMs;
    if (pace === undefined) {
      field.value = newText;
      emitInput();
      return true;
    }
    if (!Number.isSafeInteger(pace) || pace < 0 || pace > 300)
      throw Error('INVALID_TYPING_INTERVAL');
    // Only the one Host-admitted result is authoritative. Intermediate frames
    // are visual previews in the same textarea, never individual Host edits.
    let prefix = 0;
    while (prefix < oldText.length && prefix < newText.length &&
           oldText[prefix] === newText[prefix]) prefix++;
    const tail = newText.slice(prefix);
    const frames = Math.min(12, Math.max(1, Math.ceil(tail.length / 8)));
    const humanBefore = humanInputVersion;
    let visible = oldText;
    for (let i = 1; i <= frames; i++) {
      const now = options.currentFence();
      if (stopped || composing || humanInputVersion !== humanBefore ||
          field.value !== visible || !field.isConnected ||
          field.disabled || field.readOnly || !now ||
          now.epoch !== fence.epoch || now.sequence !== fence.sequence ||
          now.viewRevision !== fence.viewRevision ||
          now.sourceRevision !== fence.sourceRevision) return false;
      const to = i === frames ? tail.length : Math.floor(tail.length * i / frames);
      visible = newText.slice(0, prefix) + tail.slice(0, to);
      field.value = visible;
      emitInput(); // The existing AutoWiki input listener handles this.
      if (i < frames && pace)
        await new Promise<void>(resolve => setTimeout(resolve, pace));
    }
    return humanInputVersion === humanBefore && field.value === newText;
  }
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
        if (candidate.newValue.length > maxLength ||
            new TextEncoder().encode(candidate.newValue).byteLength > maxLength ||
            candidate.newValue.includes('\0'))
          return refusal('DRAFT_TOO_LARGE', correlation);
        if (field.value !== candidate.oldValue) return refusal('HUMAN_DRAFT_CONFLICT', correlation);
        if (field.value === candidate.newValue) return refusal('NO_CHANGE', correlation);
        // PWA composer and native human input share this same semantic input handler.
        // Do NOT synthesize keydown/Enter/click/submit (those may SEND).
        if (!(await applyVisibleDraft(candidate.oldValue, candidate.newValue, fence)))
          return refusal('HUMAN_DRAFT_CONFLICT', correlation);
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
      field.removeEventListener('input', onInput as EventListener);
    }
  };
}
