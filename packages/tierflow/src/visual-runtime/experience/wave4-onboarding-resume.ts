/**
 * Wave 4 E — one read-only Founder Workspace onboarding/resumption projection.
 * This is NOT a second onboarding store, pairing verifier, Host publisher, or action executor.
 * Inputs must come from trusted, owner-scoped existing Host/Studio brokers. Raw HTTP JSON,
 * QR URLs and UI assertions must never be promoted into these trusted inputs.
 */
import type { FounderJourneyView } from './wave3-journey-fixture.ts';
import type { Wave3HostReadResult } from '../host/wave3-read-gateway-fixture.ts';

export const WAVE4_ONBOARDING_SCHEMA = 'vivim.wave4-founder-onboarding/1' as const;
export const SAFE_QR_ACCESSIBLE_NAME =
  'Scan using the VIVIM Android app to start private pairing. This code is temporary and single-use.';

export type Shell = 'desktop' | 'android';
export type Truth = 'yes' | 'no' | 'unknown';
export type Stage = 'install' | 'pair' | 'readiness' | 'projects' | 'help' | 'action' | 'disconnect' | 'resume';
export type PairTokenStatus = 'none' | 'issued' | 'redeemed' | 'expired' | 'replayed';
export type ActionState = 'none' | 'pending' | 'denied' | 'uncertain' | 'failed' | 'applied-verified';
export type SafeIntent = 'open-contextual-help' | 'return-to-workspace' | 'cancel-local' |
  'inspect-host-status' | 'request-new-pairing' | 'resume-from-authority';

export interface JourneyPrincipal {
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
}
/** A trusted Host reader must bind this snapshot to the current session and grant. */
export interface HostJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly connected: boolean;
  readonly observedAtMs: number;
  readonly worldRevision: string;
  readonly grant: {
    readonly status: 'active' | 'pending' | 'expired' | 'revoked' | 'none';
    readonly ownerApproved: boolean;
    readonly expiresAtMs: number;
    readonly scopes: readonly string[];
  };
}
/** QR redemption alone is not enrollment or a device authorization. No raw token is needed. */
export interface PairJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly enrollment: 'active' | 'enrollment-required' | 'none' | 'revoked';
  readonly enrollmentExpiresAtMs: number;
  readonly tokenStatus: PairTokenStatus;
  readonly tokenExpiresAtMs?: number;
  /** Untrusted raw token extensions, if present at runtime, are deliberately ignored. */
}
export interface ProviderJourneyEvidence {
  readonly source: 'studio' | 'ui';
  readonly proof: 'provider_authenticated' | 'tab_ready' | 'signed_out' | 'unknown';
  readonly observedAtMs: number;
}
/** The Host receipt reader, not Wave 3 H's synthetic fixture, supplies receipt truth. */
export interface ActionJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly state: 'none' | 'pending' | 'denied' | 'uncertain' | 'failed' | 'applied';
  readonly observedAtMs: number;
  readonly worldRevision: string;
  readonly signatureState: 'verified' | 'unsigned' | 'unknown' | 'invalid';
  readonly receiptRef?: string;
}
export interface ReconnectJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly state: 'not-needed' | 'resnapshot-required' | 'reconciled';
  readonly worldRevision: string;
  readonly observedAtMs: number;
}
export interface Wave4OnboardingInput {
  readonly shell: Shell;
  readonly viewportPx: number;
  readonly nowMs: number;
  readonly principal: JourneyPrincipal;
  /** Real Wave 3 E projection; it is synthetic, not live provider evidence. */
  readonly founder: FounderJourneyView;
  /** Real Wave 3 H read-only status projection; never a live signature verifier. */
  readonly hostRead: Wave3HostReadResult;
  readonly installation: Readonly<{ desktopReady: boolean; androidInstalled: boolean; dedicatedBrowserReady: boolean }>;
  readonly host: HostJourneyEvidence | null;
  readonly pairing: PairJourneyEvidence | null;
  readonly provider: ProviderJourneyEvidence | null;
  readonly action: ActionJourneyEvidence | null;
  readonly reconnect: ReconnectJourneyEvidence | null;
}
export interface JourneyAction {
  readonly intent: SafeIntent;
  readonly label: string;
  readonly accessibleName: string;
  readonly effectInvoked: false;
}
export interface Wave4OnboardingView {
  readonly schema: typeof WAVE4_ONBOARDING_SCHEMA;
  readonly kind: 'read-only-existing-shell-projection';
  readonly shell: Shell;
  readonly layout: 'compact' | 'wide';
  readonly stage: Stage;
  readonly readiness: Readonly<{
    tabReady: Truth; paired: Truth; signedIn: Truth; permitted: Truth; verified: Truth;
  }>;
  readonly pairing: Readonly<{ qrAccessibleName: typeof SAFE_QR_ACCESSIBLE_NAME; tokenStatus: PairTokenStatus; needsNewToken: boolean }>;
  readonly projectCards: readonly Readonly<{ stableId: string; title: string; summary: string; statusLabel: string }>[];
  readonly help: Readonly<{ visible: boolean; title: string; explanation: string; availableVia: 'one-action-or-query' | 'not-available'; runnable: false }>;
  readonly action: Readonly<{ state: ActionState; receiptVerified: boolean; reason: string; automaticRetryAllowed: false }>;
  readonly recovery: Readonly<{ needed: boolean; reason: string; mustResnapshot: boolean; resumeAllowed: boolean; automaticRetryAllowed: false }>;
  readonly accessibility: Readonly<{
    role: 'main'; live: 'polite' | 'assertive';
    heading: string; focusTarget: 'journey-heading' | 'recovery-heading';
    returnFocusTo: 'onboarding-current-step';
    pairQrIsDecorativeUntilScanned: true;
  }>;
  readonly actions: readonly JourneyAction[];
  readonly worldRevision: string | null;
  readonly effectInvoked: false;
  readonly publisherCreated: false;
  readonly storeCreated: false;
}

const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const RECEIPT = /^[A-Za-z][A-Za-z0-9._:-]{0,99}$/;
const SECRET_OR_UNSAFE = /(?:[a-f0-9]{64}|[A-Za-z0-9_-]{42,}|<|>|&lt;|&gt;|https?:\/\/|javascript:|data:|onerror\s*=|onclick\s*=|(?:bearer|token|secret|password|authorization)\s*[:=])/i;
const validId = (v: unknown): v is string => typeof v === 'string' && ID.test(v) &&
  !['__proto__', 'constructor', 'prototype'].includes(v);
const safeLabel = (v: unknown, max: number): v is string => typeof v === 'string' &&
  v.length > 0 && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v) && !SECRET_OR_UNSAFE.test(v);
const freshness = (observedAt: number, now: number, maxAge: number): boolean =>
  Number.isSafeInteger(observedAt) && observedAt <= now && now - observedAt <= maxAge;
const samePrincipal = (a: JourneyPrincipal | undefined, b: JourneyPrincipal): boolean =>
  !!a && a.ownerRef === b.ownerRef && a.worldRef === b.worldRef &&
  a.deviceRef === b.deviceRef && a.sessionRef === b.sessionRef;
const action = (intent: SafeIntent, label: string): JourneyAction =>
  ({ intent, label, accessibleName: label, effectInvoked: false });
const textFor = (state: ActionState): string => ({
  none: 'No authoritative outcome has been observed.',
  pending: 'The action is pending; check the Host before doing anything else.',
  denied: 'The Host denied the action. Reconnecting cannot grant permission.',
  uncertain: 'The result is uncertain. Check authoritative status; never resend automatically.',
  failed: 'The Host reported failure. Review status before a newly authorized action.',
  'applied-verified': 'The scoped Host receipt was reported verified.',
})[state];

/** Total bounded projection; never invokes a Host command, mutates onboarding, or reads a pairing token. */
export function projectWave4OnboardingResume(input: Wave4OnboardingInput): Wave4OnboardingView {
  if (!input || !['desktop', 'android'].includes(input.shell) ||
      !Number.isSafeInteger(input.nowMs) || input.nowMs < 0 ||
      !Number.isSafeInteger(input.viewportPx) || input.viewportPx < 320 || input.viewportPx > 3840 ||
      !input.principal || !Object.values(input.principal).every(validId) ||
      !input.founder || input.founder.schema !== 'vivim.founder-journey-fixture/1' ||
      !input.hostRead || input.hostRead.schema !== 'vivim.wave3-host-read-fixture/1') {
    throw new TypeError('Invalid Wave 4 E projection input');
  }
  const { nowMs: now, principal: p, founder: f } = input;
  const host = input.host;
  const trustedHost = !!host && host.source === 'host' && host.connected &&
    samePrincipal(host.principal, p) && validId(host.worldRevision) &&
    freshness(host.observedAtMs, now, 30_000);
  const connected = trustedHost;
  const pairing = input.pairing;
  const exactPairing = !!pairing && pairing.source === 'host' && samePrincipal(pairing.principal, p);
  const tokenStatus: PairTokenStatus = exactPairing &&
    ['none', 'issued', 'redeemed', 'expired', 'replayed'].includes(pairing.tokenStatus) ? pairing.tokenStatus : 'none';
  const expiredToken = tokenStatus === 'issued' &&
    (!Number.isSafeInteger(pairing?.tokenExpiresAtMs) || (pairing?.tokenExpiresAtMs ?? 0) <= now);
  const tokenStatusDisplayed = expiredToken ? 'expired' : tokenStatus;
  const paired: Truth = !connected ? 'unknown' : exactPairing && pairing.enrollment === 'active' &&
    Number.isSafeInteger(pairing.enrollmentExpiresAtMs) && pairing.enrollmentExpiresAtMs > now ? 'yes' : 'no';
  const provider = input.provider;
  const tabReady: Truth = !connected ? 'unknown' : provider?.proof === 'tab_ready' ||
    provider?.proof === 'provider_authenticated' ? 'yes' : 'no';
  const signedIn: Truth = !connected ? 'unknown' : provider?.source === 'studio' &&
    provider.proof === 'provider_authenticated' && freshness(provider.observedAtMs, now, 300_000) ? 'yes' : 'no';
  const grant = host?.grant;
  const permitted: Truth = !connected ? 'unknown' : grant?.status === 'active' && grant.ownerApproved &&
    Number.isSafeInteger(grant.expiresAtMs) && grant.expiresAtMs > now &&
    Array.isArray(grant.scopes) && grant.scopes.includes('project:read') &&
    grant.scopes.includes('control:plan') ? 'yes' : 'no';
  const reconnect = input.reconnect;
  const exactReconnect = !!reconnect && reconnect.source === 'host' && samePrincipal(reconnect.principal, p) &&
    freshness(reconnect.observedAtMs, now, 30_000) && reconnect.worldRevision === host?.worldRevision;
  const mustResnapshot = !connected || (exactReconnect && reconnect.state === 'resnapshot-required') ||
    (!!reconnect && !exactReconnect);
  const resumeAllowed = connected && !mustResnapshot && exactReconnect && reconnect.state === 'reconciled' &&
    f.onboarding.cancelled === false;
  const outcome = input.action;
  const exactOutcome = connected && !!outcome && outcome.source === 'host' && samePrincipal(outcome.principal, p) &&
    outcome.worldRevision === host?.worldRevision && freshness(outcome.observedAtMs, now, 60_000);
  const pendingTooLong = !!outcome && outcome.state === 'pending' &&
    (!freshness(outcome.observedAtMs, now, 60_000));
  let actionState: ActionState = !exactOutcome ? 'none' : outcome.state === 'applied'
    ? outcome.signatureState === 'verified' && validId(outcome.receiptRef) && permitted === 'yes' &&
      paired === 'yes' && signedIn === 'yes' && !mustResnapshot ? 'applied-verified' : 'uncertain'
    : outcome.state;
  if (pendingTooLong || (!connected && !!outcome && outcome.state !== 'none')) actionState = 'uncertain';
  // Inert Wave 3 H cannot independently make an external receipt signed or an effect approved.
  if (input.hostRead.kind === 'receipt' && input.hostRead.receipt?.signatureState === 'invalid' &&
      actionState === 'applied-verified') actionState = 'uncertain';
  const receiptVerified = actionState === 'applied-verified';
  const verified: Truth = !connected ? 'unknown' : receiptVerified ? 'yes' : 'no';
  const installed = input.shell === 'desktop' ? input.installation.desktopReady && input.installation.dedicatedBrowserReady :
    input.installation.androidInstalled;
  // Only the validated Wave 3 document and non-hostile visible project labels can be rendered.
  const doc = f.document;
  const authorizedProjects = connected && !mustResnapshot && permitted === 'yes' && paired === 'yes' &&
    doc.ok && doc.document.scope.ownerRef === p.ownerRef && f.render.status !== 'unavailable' &&
    ['ready', 'partial'].includes(f.state);
  const projectCards = authorizedProjects ? f.projects.slice(0, 8).filter(card =>
    validId(card.stableId) && safeLabel(card.title, 80) && safeLabel(card.summary, 240) &&
    safeLabel(card.statusLabel, 120) && card.interactive === false).map(card => ({
      stableId: card.stableId, title: card.title, summary: card.summary, statusLabel: card.statusLabel,
    })) : [];
  const canShowHelp = connected && permitted === 'yes' && !!f.help.visible &&
    safeLabel(f.help.title, 160) && safeLabel(f.help.explanation, 600);
  const help = canShowHelp ? { visible: true, title: f.help.title, explanation: f.help.explanation,
    availableVia: 'one-action-or-query' as const, runnable: false as const } :
    { visible: false, title: 'Contextual help unavailable',
      explanation: 'Check device access or return to your safe workspace. No action will be sent.',
      availableVia: 'not-available' as const, runnable: false as const };
  let stage: Stage = !installed ? 'install' : !connected ? 'disconnect' : paired !== 'yes' ? 'pair' :
    signedIn !== 'yes' || permitted !== 'yes' ? 'readiness' :
    mustResnapshot || resumeAllowed ? 'resume' :
    actionState !== 'none' ? 'action' : projectCards.length === 0 ? 'projects' : 'help';
  const recoveryNeeded = !connected || mustResnapshot || f.onboarding.cancelled ||
    ['pending','uncertain','denied','failed'].includes(actionState);
  const recoveryReason = !connected ? 'Host disconnected; prior status is not current.' :
    mustResnapshot ? 'Revision reconciliation is required before resumption.' :
    f.onboarding.cancelled ? 'Setup was cancelled; resume only after authoritative status review.' :
    ['pending','uncertain'].includes(actionState) ? 'The previous action has no confirmed final outcome.' :
    actionState === 'denied' ? 'The previous denial remains in force after resumption.' :
    actionState === 'failed' ? 'The last Host action failed; inspect status.' : 'No recovery is required.';
  const recovery = { needed: recoveryNeeded, reason: recoveryReason, mustResnapshot,
    resumeAllowed, automaticRetryAllowed: false as const };
  const actions: JourneyAction[] = [];
  if (f.onboarding.cancelled) {
    actions.push(action('resume-from-authority', 'Review current status to resume setup'));
  } else {
    if (stage === 'pair') actions.push(action('request-new-pairing', 'Request a new private pairing code'));
    if (canShowHelp) actions.push(action('open-contextual-help', 'Explain this workspace step'));
    if (recoveryNeeded || stage === 'action') actions.push(action('inspect-host-status', 'Inspect authoritative Host status'));
    if (resumeAllowed) actions.push(action('resume-from-authority', 'Resume from verified Host state'));
    actions.push(action('return-to-workspace', 'Return to safe Founder Workspace'));
    actions.push(action('cancel-local', 'Cancel local onboarding view'));
  }
  const recoveryHeading = recoveryNeeded && (stage === 'disconnect' || stage === 'resume' ||
    ['uncertain','pending','denied'].includes(actionState));
  const heading = recoveryHeading ? 'Recover Founder Workspace safely' : ({
    install: 'Prepare VIVIM on this device', pair: 'Pair your approved phone',
    readiness: 'Verify sign-in and owner permission', projects: 'Explore your projects',
    help: 'Your Founder Workspace', action: 'Review Host outcome',
    disconnect: 'Recover Founder Workspace safely', resume: 'Recover Founder Workspace safely',
  })[stage];
  return {
    schema: WAVE4_ONBOARDING_SCHEMA, kind: 'read-only-existing-shell-projection', shell: input.shell,
    layout: input.viewportPx <= 600 ? 'compact' : 'wide', stage,
    readiness: { tabReady, paired, signedIn, permitted, verified },
    pairing: { qrAccessibleName: SAFE_QR_ACCESSIBLE_NAME, tokenStatus: tokenStatusDisplayed,
      needsNewToken: tokenStatusDisplayed === 'expired' || tokenStatusDisplayed === 'replayed' },
    projectCards, help, action: { state: actionState, receiptVerified, reason: textFor(actionState), automaticRetryAllowed: false },
    recovery, accessibility: { role: 'main', live: recoveryHeading ? 'assertive' : 'polite', heading,
      focusTarget: recoveryHeading ? 'recovery-heading' : 'journey-heading',
      returnFocusTo: 'onboarding-current-step', pairQrIsDecorativeUntilScanned: true },
    actions, worldRevision: connected ? host!.worldRevision : null,
    effectInvoked: false, publisherCreated: false, storeCreated: false,
  };
}
