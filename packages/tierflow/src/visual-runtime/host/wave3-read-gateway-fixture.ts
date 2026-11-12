/** Wave 3 H: display-only Host projection. This module has no live gateway or effect path. */
import {createHostCapabilityFixture, type HostFixtureOptions} from './fixture.ts';
import {projectRecovery, type RecoveryView} from '../experience/recovery.ts';
import type {
  HostActionOutcome, HostCapabilityView, HostClaimSnapshot,
  HostReceiptObservation, TrustedFixtureHostContext,
} from './port.ts';

export const WAVE3_HOST_READ_SCHEMA = 'vivim.wave3-host-read-fixture/1' as const;
export type Wave3HostReadState = 'display_only' | 'denied' | 'uncertain' | 'observed_fixture_only';
export type Wave3HostReadKind = 'capability' | 'receipt' | 'ui_effect_refused';

/** No tokens, principal identifiers, mutable plans or raw journal bodies leave this projection. */
export interface Wave3HostReadResult {
  readonly schema: typeof WAVE3_HOST_READ_SCHEMA;
  readonly kind: Wave3HostReadKind;
  readonly state: Wave3HostReadState;
  readonly reasonCode: string;
  readonly effectInvoked: false;
  readonly canExecute: false;
  readonly automaticRetryAllowed: false;
  readonly source: Readonly<{authority: 'tierflow-host-fixture'; proof: 'fixture_only'; liveHostVerified: false}>;
  readonly capability?: Readonly<Pick<HostCapabilityView,
    'actionId' | 'risk' | 'catalogVersion' | 'catalogDigest' | 'supportedByBuild' |
    'availableNow' | 'permittedForActor' | 'verifiedByEvidence' | 'reasonCodes'>>;
  /** An observation is never presented as a confirmed live action or signed Host receipt. */
  readonly receipt?: Readonly<{
    reportedStatus: HostActionOutcome['status'];
    signatureState: HostActionOutcome['signatureState'];
    verification: 'synthetic_test_only';
  }>;
  readonly recovery: RecoveryView;
  readonly accessibility: Readonly<{
    role: 'status' | 'alert'; initialFocus: 'recovery-heading'; textEquivalent: string;
  }>;
}

const source = Object.freeze({authority: 'tierflow-host-fixture', proof: 'fixture_only', liveHostVerified: false} as const);
const own = (value: unknown): value is Record<string, unknown> => value !== null &&
  typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const ref = (value: unknown): value is string => typeof value === 'string' &&
  /^[A-Za-z0-9_.:-]{1,160}$/.test(value);
const same = (a: unknown, b: unknown): boolean => ref(a) && a === b;

/** Contexts are synthetic BROKER inputs. A caller cannot prove Host identity by manufacturing one. */
function readGuard(c: TrustedFixtureHostContext): string | null {
  if (!own(c) || c.schema !== 'fixture.trusted-host-context/1' || c.authenticated !== true ||
      ![c.ownerRef, c.actorRef, c.deviceRef, c.sessionRef, c.worldRef].every(ref))
    return 'AUTHENTICATED_PRINCIPAL_REQUIRED';
  if (!Number.isSafeInteger(c.nowMs) || !Number.isSafeInteger(c.sessionExpiresAtMs) ||
      c.nowMs >= c.sessionExpiresAtMs) return 'SESSION_EXPIRED';
  if (c.surface !== 'desktop' && c.surface !== 'phone') return 'SURFACE_INVALID';
  const g = c.grant;
  if (!own(g)) return 'GRANT_MISSING';
  if (g.status === 'revoked') return 'GRANT_REVOKED';
  if (g.status !== 'active') return 'GRANT_NOT_ACTIVE';
  if (!Number.isSafeInteger(g.expiresAtMs) || c.nowMs >= g.expiresAtMs) return 'GRANT_EXPIRED';
  if (!ref(g.grantRef) || !ref(g.revision) ||
      !same(g.ownerRef, c.ownerRef) || !same(g.actorRef, c.actorRef) ||
      !same(g.deviceRef, c.deviceRef) || !same(g.sessionRef, c.sessionRef) ||
      !same(g.worldRef, c.worldRef)) return 'GRANT_PRINCIPAL_MISMATCH';
  if (!Array.isArray(g.scopes) || !g.scopes.every(ref) || !g.scopes.includes('control:read'))
    return 'READ_SCOPE_DENIED';
  if (!ref(c.worldRevision) || !ref(c.policyRevision) || !/^[a-f0-9]{64}$/.test(c.catalogDigest) ||
      !Number.isSafeInteger(c.catalogVersion) || c.catalogVersion < 1) return 'SOURCE_CONTEXT_INVALID';
  return null;
}

const recoveryFor = (stage: 'denied' | 'uncertain', reasonCode: string): RecoveryView =>
  projectRecovery({authority: 'host', stage, operationKind: 'host_effect', reasonCode,
    offline: false, canCancel: false, canRequestUndo: false, statusCheckedByAuthority: false});

function result(kind: Wave3HostReadKind, state: Wave3HostReadState, reasonCode: string,
  extra: Pick<Wave3HostReadResult, 'capability' | 'receipt'> = {}): Wave3HostReadResult {
  // Even a positive synthetic status has an *uncertain live-effect* recovery path.
  const recovery = recoveryFor(state === 'denied' ? 'denied' : 'uncertain', reasonCode);
  const accessibility: Wave3HostReadResult['accessibility'] = {
    role: state === 'denied' || state === 'uncertain' ? 'alert' : 'status',
    initialFocus: 'recovery-heading', textEquivalent: 'Check Host status read only; never retry an effect automatically',
  };
  return Object.freeze({schema: WAVE3_HOST_READ_SCHEMA, kind, state, reasonCode,
    effectInvoked: false, canExecute: false, automaticRetryAllowed: false, source,
    ...extra, recovery,
    accessibility,
  });
}

/** Only read-only APIs are exported; supplying owner-grant fixtures is NOT authentication. */
export function createWave3ReadGatewayFixture(options: HostFixtureOptions) {
  const port = createHostCapabilityFixture(options);

  function readCapability(context: TrustedFixtureHostContext, actionId: string): Wave3HostReadResult {
    const blocked = readGuard(context);
    if (blocked) return result('capability', 'denied', blocked);
    if (!ref(actionId)) return result('capability', 'denied', 'ACTION_ID_INVALID');
    const v = port.describeForPrincipal(context, actionId);
    if (v.reasonCodes.includes('ACTION_UNKNOWN')) return result('capability', 'denied', 'ACTION_UNKNOWN');
    const capability = {
      actionId: v.actionId, risk: v.risk, catalogVersion: v.catalogVersion,
      catalogDigest: v.catalogDigest, supportedByBuild: v.supportedByBuild,
      availableNow: v.availableNow, permittedForActor: v.permittedForActor,
      verifiedByEvidence: v.verifiedByEvidence, reasonCodes: [...v.reasonCodes],
    };
    const riskDenied = v.risk === 'R3' ? 'R3_REFUSED' :
      v.risk === 'R2' && context.surface === 'phone' ? 'R2_DESKTOP_REQUIRED' : null;
    if (riskDenied) return result('capability', 'denied', riskDenied);
    if (v.permittedForActor !== 'yes') return result('capability', 'denied',
      v.reasonCodes.find(r => /^(?:GRANT_|SCOPE_|SESSION_|CATALOG_)/.test(r)) ?? 'PERMISSION_DENIED');
    if (v.supportedByBuild === 'no' || v.availableNow === 'no')
      return result('capability', 'denied', v.reasonCodes[0] ?? 'HOST_UNAVAILABLE', {capability});
    if (v.supportedByBuild !== 'yes' || v.availableNow !== 'yes' || v.verifiedByEvidence !== 'yes')
      return result('capability', 'uncertain', 'CAPABILITY_NOT_VERIFIED', {capability});
    return result('capability', 'display_only', 'FIXTURE_CAPABILITY_OBSERVED', {capability});
  }

  function readReceiptStatus(context: TrustedFixtureHostContext, claim: HostClaimSnapshot,
    observation: HostReceiptObservation | null): Wave3HostReadResult {
    const blocked = readGuard(context);
    if (blocked) return result('receipt', 'denied', blocked);
    if (!own(claim) || ![claim.planId, claim.planDigest, claim.actionId,
      claim.ownerRef, claim.actorRef, claim.deviceRef, claim.sessionRef, claim.worldRef,
      claim.worldRevision].every(ref) ||
      !same(claim.ownerRef, context.ownerRef) || !same(claim.actorRef, context.actorRef) ||
      !same(claim.deviceRef, context.deviceRef) || !same(claim.sessionRef, context.sessionRef) ||
      !same(claim.worldRef, context.worldRef)) return result('receipt', 'denied', 'PRINCIPAL_SCOPE_MISMATCH');
    // Scope and risk are re-read from the catalog. A phone cannot browse R2/R3 outcome data.
    const cap = readCapability(context, claim.actionId);
    if (cap.state === 'denied') return result('receipt', 'denied', cap.reasonCode);
    if (cap.state === 'uncertain') return result('receipt', 'uncertain', cap.reasonCode);
    if (claim.worldRevision !== context.worldRevision) return result('receipt', 'uncertain', 'WORLD_REVISION_CHANGED');
    if (claim.state !== 'claimed' && claim.state !== 'receipt')
      return result('receipt', 'denied', 'EFFECT_NOT_CLAIMED');
    const o = port.reconcileClaimReadOnly(claim, observation, context);
    if (o.status === 'denied') return result('receipt', 'denied', o.reasonCode);
    if (o.status === 'uncertain' || o.signatureState !== 'verified')
      return result('receipt', 'uncertain', o.signatureState === 'unsigned'
        ? 'UNSIGNED_RECEIPT_NOT_AUTHORITATIVE' : o.reasonCode);
    // `verified` means only the optional TEST HMAC verifier succeeded, never Host signing.
    return result('receipt', 'observed_fixture_only', 'SYNTHETIC_OBSERVATION_ONLY', {
      receipt: {reportedStatus: o.status, signatureState: o.signatureState,
        verification: 'synthetic_test_only'},
    });
  }

  /** Any text/touch/keyboard proposal is rejected here; G + the real Host own effects. */
  function refuseUiEffect(_untrustedInput: unknown): Wave3HostReadResult {
    return result('ui_effect_refused', 'denied', 'EFFECT_DISPATCH_NOT_SUPPORTED');
  }

  return Object.freeze({readCapability, readReceiptStatus, refuseUiEffect});
}
