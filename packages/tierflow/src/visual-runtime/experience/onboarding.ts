/** Inert, broker-sourced first-use projection. Not a login verifier or effect executor. */
export const ONBOARDING_SCHEMA = 'OnboardingJourney/1' as const;
export const PAIRING_QR_ACCESSIBLE_NAME =
  'Scan with the existing VIVIM mobile app to begin private device pairing. The code expires.';
export const PRIVACY_EXPLANATION =
  'VIVIM can keep its workspace data on this computer. Approved requests may be sent to signed-in AI provider websites in the dedicated browser, and authorized information may be shared with a paired phone. Review each permission and connection before continuing.';

export type StepId = 'privacy' | 'desktop' | 'provider' | 'owner' | 'pairing' |
  'discover' | 'preview' | 'receipt' | 'resume';
export type Readiness = 'yes' | 'no' | 'unknown';
export type StepStatus = 'ready' | 'blocked' | 'completed' | 'skipped' | 'locked';
export type OnboardingEvent = 'acknowledge_privacy' | 'next' | 'back' | 'skip' | 'cancel' | 'resume' | 'help';
export interface JourneyState {
  readonly schema: typeof ONBOARDING_SCHEMA;
  readonly current: StepId;
  readonly privacyAcknowledged: boolean;
  readonly pairingSkipped: boolean;
  readonly cancelled: boolean;
}
/** Evidence is supplied by a trusted integration broker; never accept it from browser JSON. */
export interface OnboardingEvidence {
  readonly desktop?: { readonly computerReady: Readiness; readonly dedicatedBrowserReady: Readiness };
  readonly provider?: {
    readonly source: 'studio' | 'other';
    readonly proof: 'provider_authenticated' | 'tab_ready' | 'unknown' | 'signed_out';
    readonly observedAtMs: number;
  };
  readonly owner?: { readonly source: 'host' | 'other'; readonly selectionConfirmed: Readiness };
  readonly phone?: { readonly source: 'host' | 'other'; readonly enrolled: Readiness; readonly permission: Readiness };
  readonly capability?: { readonly source: 'host' | 'ui' | 'other'; readonly supported: Readiness; readonly permitted: Readiness };
  readonly preview?: { readonly source: 'ui'; readonly safePreviewVerified: boolean };
  readonly outcome?: {
    readonly source: 'host' | 'ui' | 'other';
    readonly state: 'applied' | 'uncertain' | 'denied' | 'failed' | 'pending';
    readonly evidenceRef?: string;
  };
  readonly restart?: { readonly reconciled: boolean };
}
export interface StepAction {
  readonly event: OnboardingEvent;
  readonly label: string;
  readonly textEquivalent: string;
}
export interface JourneyStep {
  readonly id: StepId;
  readonly title: string;
  readonly status: StepStatus;
  readonly whyBlocked?: string;
  readonly helpTopic: string;
  readonly accessibleName: string;
  readonly actions: readonly StepAction[];
}
export interface JourneyView {
  readonly schema: typeof ONBOARDING_SCHEMA;
  readonly current: StepId;
  readonly cancelled: boolean;
  readonly progress: { readonly completed: number; readonly total: number };
  readonly steps: readonly JourneyStep[];
  readonly privacyExplanation: string;
  readonly pairingQrAccessibleName: string;
  readonly focus: { readonly regionRole: 'navigation'; readonly returnFocusTo: 'onboarding-current-step'; readonly statusLive: 'polite' };
}
const ORDER: readonly StepId[] = [
  'privacy', 'desktop', 'provider', 'owner', 'pairing', 'discover', 'preview', 'receipt', 'resume',
];
const TITLES: Record<StepId, string> = {
  privacy: 'Understand privacy and consent',
  desktop: 'Prepare this computer and the dedicated browser',
  provider: 'Verify provider sign-in',
  owner: 'Confirm your choice as owner',
  pairing: 'Pair your existing phone (optional)',
  discover: 'Find a supported, permitted action',
  preview: 'Review a safe preview',
  receipt: 'Inspect the committed outcome',
  resume: 'Check recovery and safe resumption',
};
const HELPS: Record<StepId, string> = {
  privacy: 'privacy-and-sharing', desktop: 'desktop-readiness', provider: 'provider-authentication',
  owner: 'owner-consent', pairing: 'phone-pairing', discover: 'capability-discovery',
  preview: 'preview-and-approval', receipt: 'outcome-and-receipts', resume: 'restart-and-recovery',
};
const at = (s: StepId): number => ORDER.indexOf(s);
const action = (event: OnboardingEvent, label: string): StepAction => ({
  event, label, textEquivalent: `onboarding ${event.replaceAll('_', '-')}`,
});
export function newJourney(): JourneyState {
  return { schema: ONBOARDING_SCHEMA, current: 'privacy', privacyAcknowledged: false, pairingSkipped: false, cancelled: false };
}
function requirement(id: StepId, state: JourneyState, ev: OnboardingEvidence, nowMs: number): string | null {
  switch (id) {
    case 'privacy': return state.privacyAcknowledged ? null : 'Read and acknowledge the privacy and provider-sharing explanation.';
    case 'desktop': return ev.desktop?.computerReady === 'yes' && ev.desktop.dedicatedBrowserReady === 'yes'
      ? null : 'Start or repair the desktop Host and dedicated browser, then check readiness again.';
    case 'provider': return ev.provider?.source === 'studio' && ev.provider.proof === 'provider_authenticated' &&
      Number.isFinite(ev.provider.observedAtMs) && ev.provider.observedAtMs <= nowMs &&
      nowMs - ev.provider.observedAtMs <= 5 * 60_000
      ? null : 'Opening a provider tab does not prove sign-in. Verify authentication in Studio.';
    case 'owner': return ev.owner?.source === 'host' && ev.owner.selectionConfirmed === 'yes'
      ? null : 'An owner-confirmed selection is required; a UI selection is not a grant.';
    case 'pairing': return state.pairingSkipped || (ev.phone?.source === 'host' && ev.phone.enrolled === 'yes' && ev.phone.permission === 'yes')
      ? null : 'Phone pairing is optional. A scanned QR alone does not prove owner-scoped enrollment.';
    case 'discover': return (ev.capability?.source === 'host' || ev.capability?.source === 'ui') &&
      ev.capability.supported === 'yes' && ev.capability.permitted === 'yes'
      ? null : 'Choose an actually supported and permitted action; a catalogue entry is insufficient.';
    case 'preview': return ev.preview?.source === 'ui' && ev.preview.safePreviewVerified
      ? null : 'Review a verified effect-free preview before continuing.';
    case 'receipt': return (ev.outcome?.source === 'host' || ev.outcome?.source === 'ui') &&
      ev.outcome.state === 'applied' && /^[A-Za-z0-9_.:-]{1,100}$/.test(ev.outcome.evidenceRef ?? '')
      ? null : 'No committed outcome is proven. Inspect the owner-issued outcome or reconcile uncertainty; never resend blindly.';
    case 'resume': return ev.restart?.reconciled === true
      ? null : 'Check restored state from the owning service; never assume a previous action completed.';
  }
}
/** Read-only, deterministic view. Does not open tabs, publish documents or store anything. */
export function projectJourney(state: JourneyState, evidence: OnboardingEvidence, nowMs: number): JourneyView {
  if (state.schema !== ONBOARDING_SCHEMA || !ORDER.includes(state.current) || !Number.isFinite(nowMs)) throw new TypeError('Invalid journey state/time');
  const steps = ORDER.map((id): JourneyStep => {
    const problem = requirement(id, state, evidence, nowMs);
    const skipped = id === 'pairing' && state.pairingSkipped;
    const status: StepStatus = skipped ? 'skipped' : problem === null ? 'completed'
      : at(id) > at(state.current) ? 'locked' : id === state.current ? 'blocked' : 'ready';
    const actions: StepAction[] = id !== state.current ? [] : state.cancelled ? [action('resume', 'Resume setup'), action('help', 'Explain this step')] : [
      ...(at(id) > 0 ? [action('back', 'Back')] : []),
      ...(id === 'privacy' && !state.privacyAcknowledged ? [action('acknowledge_privacy', 'Acknowledge and continue')] : []),
      ...(id === 'pairing' && !state.pairingSkipped ? [action('skip', 'Skip phone pairing')] : []),
      ...(problem === null && id !== 'resume' ? [action('next', 'Continue')] : []),
      { event: 'help', label: 'Explain this step', textEquivalent: `help ${HELPS[id]}` },
      action('cancel', 'Cancel setup'),
    ];
    return { id, title: TITLES[id], status, ...(problem ? { whyBlocked: problem } : {}),
      helpTopic: HELPS[id], accessibleName: `Step ${at(id) + 1} of ${ORDER.length}: ${TITLES[id]}`, actions };
  });
  return { schema: ONBOARDING_SCHEMA, current: state.current, cancelled: state.cancelled,
    progress: { completed: steps.filter(s => s.status === 'completed' || s.status === 'skipped').length, total: ORDER.length },
    steps, privacyExplanation: PRIVACY_EXPLANATION, pairingQrAccessibleName: PAIRING_QR_ACCESSIBLE_NAME,
    focus: { regionRole: 'navigation', returnFocusTo: 'onboarding-current-step', statusLive: 'polite' } };
}
export interface JourneyTransition { readonly state: JourneyState; readonly accepted: boolean; readonly reason?: string }
/** Only changes navigation intent. It cannot mint trusted evidence or perform an effect. */
export function transitionJourney(
  state: JourneyState, event: OnboardingEvent, evidence: OnboardingEvidence, nowMs: number,
): JourneyTransition {
  if (state.schema !== ONBOARDING_SCHEMA || !ORDER.includes(state.current) || !Number.isFinite(nowMs)) throw new TypeError('Invalid journey state/time');
  if (state.cancelled && event !== 'resume') return { state, accepted: false, reason: 'Resume or restart before navigating.' };
  if (event === 'help') return { state, accepted: true }; // display-only, Integration 2 resolves the scoped topic
  if (event === 'cancel') return { state: { ...state, cancelled: true }, accepted: true };
  if (event === 'resume') return { state: { ...state, cancelled: false }, accepted: true };
  if (event === 'back') return at(state.current) > 0
    ? { state: { ...state, current: ORDER[at(state.current) - 1]! }, accepted: true }
    : { state, accepted: false, reason: 'Already at the beginning.' };
  if (event === 'acknowledge_privacy') return state.current === 'privacy'
    ? { state: { ...state, privacyAcknowledged: true }, accepted: true }
    : { state, accepted: false, reason: 'Privacy can be acknowledged only at the privacy step.' };
  if (event === 'skip') return state.current === 'pairing'
    ? { state: { ...state, pairingSkipped: true, current: 'discover' }, accepted: true }
    : { state, accepted: false, reason: 'Only optional phone pairing can be skipped.' };
  if (event === 'next') {
    const missing = requirement(state.current, state, evidence, nowMs);
    if (missing) return { state, accepted: false, reason: missing };
    if (state.current === 'resume') return { state, accepted: false, reason: 'Journey complete; no further step.' };
    return { state: { ...state, current: ORDER[at(state.current) + 1]! }, accepted: true };
  }
  return { state, accepted: false, reason: 'Unknown navigation event.' };
}
