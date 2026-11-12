/**
 * Final Wave Lane E: inert, Host-bound presentation of permission and effect truth.
 * NOT an approval, executor, journal, broker or live Host attestation.
 * The trusted Host supplies the Wave 4 read port and cryptographic verifier.
 * Never route a browser/provider command through this module.
 */
import type {
  HostStatusQuery, Wave4HostStatus,
} from '../../host/wave4-h-host-status-contract.ts';
import type {HostSurface} from '../../host/port.ts';

export const LANE_E_SCHEMA = 'vivim.final-wave.host-journey/1' as const;
export type LaneERoute = 'host-control' | 'legacy-phone-build';
export type LaneEPhase = 'unavailable' | 'available' | 'permitted_read_only' |
  'awaiting_owner' | 'approved_not_claimed' | 'claimed_unconfirmed' |
  'reported_applied' | 'host_attested' | 'reported_failed' | 'uncertain' | 'denied';

export interface LaneEJourney {
  readonly schema: typeof LANE_E_SCHEMA;
  readonly phase: LaneEPhase;
  readonly reasonCode: string;
  readonly risk: 'R0' | 'R1' | 'R2' | 'R3' | 'unknown';
  readonly approval: 'none' | 'pending' | 'approved' | 'denied';
  readonly receiptTruth: 'none' | 'claim_only' | 'unsigned' | 'unverified' | 'host_attested';
  readonly provenance: 'synthetic_fixture' | 'host_port_claim_unproven';
  readonly route: LaneERoute;
  readonly routeGate: 'host_only' | 'legacy_unfenced';
  readonly next: 'inspect_host' | 'desktop_owner' | 'owner_reconcile' | 'no_action';
  readonly accessibility: Readonly<{role: 'status' | 'alert'; text: string}>;
  readonly effectInvoked: false;
  readonly canApprove: false;
  readonly canExecute: false;
  readonly canRetry: false;
  readonly canPublish: false;
  readonly liveHostAcceptance: 'unproven';
}

const phases: Readonly<Record<string, LaneEPhase>> = Object.freeze({
  available: 'available', permitted: 'permitted_read_only',
  pending_approval: 'awaiting_owner', denied: 'denied',
  uncertain: 'uncertain', applied: 'reported_applied', verified: 'host_attested',
});
const validRisks = ['R0','R1','R2','R3'];
const receiptStates = ['none','claimed_unconfirmed','reported_applied','verified_by_host','reported_failed','uncertain'];
const verificationStates = ['not_present','unsigned','unverified','host_verified'];
const safeCodes = /^[A-Z][A-Z0-9_]{0,95}$/;

/** Pure display projection. All inputs are read-only observations, never authority.
 * No owner/device/plan/receipt identifiers, bearer tokens or args are copied out.
 */
export function projectLaneEHostJourney(
  status: Wave4HostStatus,
  surface: HostSurface,
  route: LaneERoute = 'host-control',
): LaneEJourney {
  const s = status as unknown as Record<string, unknown> | null;
  const source = s && typeof s.source === 'object' && s.source !== null &&
    !Array.isArray(s.source) ? s.source as Record<string, unknown> : null;
  const trustworthyShape = Boolean(s && s.schema === 'vivim.wave4-host-status/1' &&
    s.effectInvoked === false && s.canExecute === false && s.automaticRetryAllowed === false &&
    source?.authority === 'host-read-port' && source.liveHostAcceptance === 'unproven' &&
    ['synthetic_fixture','authenticated_host'].includes(String(source.evidenceClass)) &&
    typeof s.state === 'string' && Object.hasOwn(phases,s.state) &&
    typeof s.reasonCode === 'string' && safeCodes.test(s.reasonCode) &&
    receiptStates.includes(String(s.receiptState)) &&
    verificationStates.includes(String(s.receiptVerification)));
  const validRoute = route === 'host-control' || route === 'legacy-phone-build';
  const validSurface = surface === 'desktop' || surface === 'phone';
  // `phases[s.state]` is defined whenever trustworthyShape holds (Object.hasOwn was
  // checked above), so the fallback is unreachable and only satisfies the type.
  let phase: LaneEPhase = trustworthyShape ? (phases[s!.state as string] ?? 'denied') : 'denied';
  let reasonCode = trustworthyShape ? s!.reasonCode as string : 'UNTRUSTED_STATUS_PROJECTION';
  const risk = trustworthyShape && validRisks.includes(String(s!.risk)) ? s!.risk as LaneEJourney['risk'] : 'unknown';
  let receiptTruth: LaneEJourney['receiptTruth'] = 'none';
  if (trustworthyShape && s!.receiptState === 'claimed_unconfirmed') receiptTruth = 'claim_only';
  if (trustworthyShape && s!.receiptState === 'reported_applied')
    receiptTruth = s!.receiptVerification === 'unsigned' ? 'unsigned' : 'unverified';
  if (trustworthyShape && s!.receiptState === 'uncertain') receiptTruth = 'unverified';
  if (trustworthyShape && s!.receiptState === 'reported_failed') receiptTruth = 'unverified';
  // A signed flag, plan field or displayed receipt is never cryptographic proof.
  const verified = trustworthyShape && s!.state === 'verified' &&
    s!.receiptState === 'verified_by_host' && s!.receiptVerification === 'host_verified' &&
    source?.evidenceClass === 'authenticated_host';
  if (verified) receiptTruth = 'host_attested';
  else if (phase === 'host_attested') {
    phase = 'uncertain'; reasonCode = 'HOST_VERIFICATION_NOT_ATTESTED';
    receiptTruth = 'unverified';
  }
  if (phase === 'uncertain' && trustworthyShape && s!.receiptState === 'claimed_unconfirmed')
    phase = 'claimed_unconfirmed';
  if (phase === 'denied' && trustworthyShape && s!.receiptState === 'reported_failed')
    phase = 'reported_failed';
  if (phase === 'permitted_read_only' && trustworthyShape && s!.approval === 'approved')
    phase = 'approved_not_claimed';
  // Defense in depth even if status producer regresses or caller changes route.
  if (!validSurface || !validRoute) {phase = 'denied';reasonCode = 'INVALID_DISPLAY_SURFACE';receiptTruth = 'none';}
  else if (risk === 'R3') {phase = 'denied';reasonCode = 'R3_REFUSED';receiptTruth = 'none';}
  else if (risk === 'R2' && surface === 'phone') {
    phase = 'denied';reasonCode = 'R2_DESKTOP_REQUIRED';receiptTruth = 'none';
  }
  // Legacy Build tap -> relay queue -> bootstrap worker is NOT an attested
  // Host Control plan. Do not re-label its ACK as a verified effect receipt.
  if (route === 'legacy-phone-build' && phase !== 'denied' && phase !== 'reported_failed') {
    phase = 'uncertain';reasonCode = 'LEGACY_PHONE_ROUTE_UNFENCED';receiptTruth = 'none';
  }
  const approval: LaneEJourney['approval'] = phase === 'awaiting_owner' ? 'pending' :
    phase === 'denied' || phase === 'reported_failed' ? 'denied' :
    phase === 'approved_not_claimed' || phase === 'claimed_unconfirmed' ||
    phase === 'reported_applied' || phase === 'host_attested' ? 'approved' : 'none';
  const next: LaneEJourney['next'] = phase === 'denied' && risk === 'R2' && surface === 'phone' ? 'desktop_owner' :
    ['claimed_unconfirmed','uncertain','reported_applied','host_attested'].includes(phase) ? 'owner_reconcile' :
    phase === 'denied' || phase === 'reported_failed' ? 'no_action' : 'inspect_host';
  const text = phase === 'host_attested' ? 'Host reports a verified receipt. This screen cannot execute actions.' :
    phase === 'reported_applied' ? 'Host reports an outcome; receipt is not verified here.' :
    phase === 'claimed_unconfirmed' ? 'The effect was claimed but no receipt is confirmed. Do not retry.' :
    phase === 'awaiting_owner' ? 'Awaiting owner decision in the authorized Host.' :
    phase === 'denied' || phase === 'reported_failed' ? 'Host action unavailable or refused.' :
    phase === 'uncertain' ? 'Outcome or legacy route is uncertain. Reconcile with Host; do not resend.' :
    'Read-only Host status. Approval and execution stay in Host.';
  return Object.freeze({schema:LANE_E_SCHEMA,phase,reasonCode,risk,approval,receiptTruth,
    provenance:source?.evidenceClass === 'authenticated_host' && trustworthyShape ? 'host_port_claim_unproven':'synthetic_fixture',
    route:validRoute ? route : 'host-control',
    routeGate:route === 'legacy-phone-build' ? 'legacy_unfenced':'host_only',next,
    accessibility:Object.freeze({role:phase === 'denied' || phase === 'uncertain' || phase === 'claimed_unconfirmed' ? 'alert':'status',text}),
    effectInvoked:false,canApprove:false,canExecute:false,canRetry:false,canPublish:false,
    liveHostAcceptance:'unproven'});
}

/** Adapter over the actual Wave 4 Host readStatus contract, never its broker. */
export function createLaneEHostReadProjection(
  wave4: Readonly<{readStatus(query: HostStatusQuery): Wave4HostStatus}>,
) {
  if (!wave4 || typeof wave4.readStatus !== 'function') throw new TypeError('WAVE4_HOST_READ_REQUIRED');
  return Object.freeze({
    read(query: HostStatusQuery, surface: HostSurface, route: LaneERoute = 'host-control'): LaneEJourney {
      // Wave 4 checks scope, grant, session, catalog, policy, plan,
      // risk and signature via Host-supplied read port. No second authority.
      try {return projectLaneEHostJourney(wave4.readStatus(query),surface,route);}
      catch {return projectLaneEHostJourney(null as unknown as Wave4HostStatus,surface,route);}
    },
  });
}
