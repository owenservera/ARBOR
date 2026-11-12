/** Wave 4 H — typed, inert projection of Host-owned reads; never an effect gateway.
 * The broker/Host adapter MUST authenticate scope and verify signatures. A caller-supplied
 * object or TierFlow fixture is not authentication, a grant, or proof of execution.
 */
import {projectRecovery, type RecoveryView} from '../experience/recovery.ts';
import type {HostCapabilityView, HostRisk, HostSurface} from './port.ts';

export const WAVE4_HOST_STATUS_SCHEMA = 'vivim.wave4-host-status/1' as const;
export type Wave4HostState = 'available' | 'permitted' | 'pending_approval' | 'denied' |
  'uncertain' | 'applied' | 'verified';
export type HostPurpose = 'founder_workspace' | 'recovery' | 'owner_audit';
export type ReceiptState = 'none' | 'claimed_unconfirmed' | 'reported_applied' |
  'verified_by_host' | 'reported_failed' | 'uncertain';

export interface HostReadScope {
  readonly schema: 'vivim.host-authorized-read-scope/1';
  readonly authenticated: boolean;
  readonly ownerRef: string;
  readonly actorRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly surface: HostSurface;
  readonly purpose: HostPurpose;
  readonly nowMs: number;
  readonly sessionExpiresAtMs: number;
  readonly worldRevision: string;
  readonly policyRevision: string;
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  /** Must be fetched fresh, not cached on the device. */
  readonly grant: null | Readonly<{
    grantRef: string; revision: string;
    status: 'active' | 'pending' | 'expired' | 'revoked';
    ownerRef: string; actorRef: string; worldRef: string; deviceRef: string; sessionRef: string;
    purpose: HostPurpose;
    expiresAtMs: number;
    scopes: readonly string[];
  }>;
}

export interface HostStatusQuery {
  readonly actionId: string;
  readonly purpose: HostPurpose;
  readonly planId?: string;
  readonly expected: Readonly<{
    worldRevision: string; policyRevision: string;
    catalogVersion: number; catalogDigest: string;
  }>;
}

/** A normalized read of the existing exclusive Host journal. Never accepted from UI text. */
export interface HostPlanRead {
  readonly schema: 'vivim.wave4-host-plan-read/1';
  readonly planId: string; readonly planDigest: string; readonly actionId: string;
  readonly risk: HostRisk;
  readonly ownerRef: string; readonly actorRef: string; readonly worldRef: string;
  readonly deviceRef: string; readonly sessionRef: string; readonly purpose: HostPurpose;
  readonly grantRef: string; readonly grantRevision: string;
  readonly worldRevision: string; readonly policyRevision: string;
  readonly catalogVersion: number; readonly catalogDigest: string;
  readonly expiresAtMs: number;
  readonly state: 'planned' | 'approved' | 'claimed' | 'receipt' | 'denied';
  readonly claimed: boolean;
  readonly receipt: null | Readonly<{
    schema: 'vivim.control-receipt/1';
    planId: string; planDigest: string; actionId: string;
    status: 'applied' | 'failed' | 'uncertain';
    /** A general journal is unsigned. Signature claims inside this object are untrusted. */
    evidence: 'unsigned_general_journal' | 'signed_host_envelope';
    receiptRef: string;
    signatureEnvelope?: Readonly<{keyId: string; signatureBase64: string}>;
    worldRevision: string; policyRevision: string;
    ownerRef: string; actorRef: string; worldRef: string;
    deviceRef: string; sessionRef: string; purpose: HostPurpose;
  }>;
}

/** Only the existing authenticated Host may implement this read port. No execute/send.
 * `authenticated_host` is an integration CLAIM until a live owner-approved adapter exists.
 */
export interface Wave4HostReadPort {
  readonly evidenceClass: 'synthetic_fixture' | 'authenticated_host';
  currentScope(): HostReadScope | null;
  readCapability(scope: HostReadScope, actionId: string): HostCapabilityView | null;
  readPlan(scope: HostReadScope, planId: string): HostPlanRead | null;
  /** Must perform real Host-owned cryptographic verification, never trust a receipt field. */
  verifyReceipt?(scope: HostReadScope, plan: HostPlanRead, receipt: NonNullable<HostPlanRead['receipt']>): boolean;
}

export interface Wave4HostStatus {
  readonly schema: typeof WAVE4_HOST_STATUS_SCHEMA;
  readonly state: Wave4HostState;
  readonly reasonCode: string;
  readonly actionId?: string;
  readonly risk?: HostRisk;
  readonly availability: 'yes' | 'no' | 'unknown';
  readonly permission: 'yes' | 'no' | 'unknown';
  readonly approval: 'none' | 'pending' | 'approved' | 'denied';
  readonly receiptState: ReceiptState;
  readonly receiptVerification: 'not_present' | 'unsigned' | 'unverified' | 'host_verified';
  readonly effectInvoked: false;
  readonly canExecute: false;
  readonly automaticRetryAllowed: false;
  readonly source: Readonly<{
    authority: 'host-read-port'; evidenceClass: Wave4HostReadPort['evidenceClass'];
    liveHostAcceptance: 'unproven';
  }>;
  readonly recovery: RecoveryView;
  readonly accessibility: Readonly<{role: 'status' | 'alert'; initialFocus: 'recovery-heading'; textEquivalent: string}>;
}

const ref = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_.:-]{1,160}$/.test(v);
const digest = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' &&
  !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null) &&
  Object.values(Object.getOwnPropertyDescriptors(v)).every(d => 'value' in d);
const exact = (a: unknown, b: unknown): boolean => ref(a) && a === b;
const purposes: readonly HostPurpose[] = ['founder_workspace','recovery','owner_audit'];
const identity = ['ownerRef','actorRef','worldRef','deviceRef','sessionRef'] as const;

function scopeError(s: HostReadScope | null, purpose: HostPurpose): string | null {
  if (!record(s) || s.schema !== 'vivim.host-authorized-read-scope/1' || s.authenticated !== true ||
      !identity.every(k => ref(s[k])) || !purposes.includes(s.purpose) || s.purpose !== purpose ||
      !['desktop','phone'].includes(s.surface)) return 'AUTHENTICATED_HOST_SCOPE_REQUIRED';
  if (!Number.isSafeInteger(s.nowMs) || !Number.isSafeInteger(s.sessionExpiresAtMs) ||
      s.nowMs >= s.sessionExpiresAtMs) return 'SESSION_EXPIRED';
  if (!ref(s.worldRevision) || !ref(s.policyRevision) || !digest(s.catalogDigest) ||
      !Number.isSafeInteger(s.catalogVersion) || s.catalogVersion < 1) return 'HOST_SOURCE_INVALID';
  const grant = s.grant;
  if (!record(grant)) return 'GRANT_MISSING';
  if (grant.status === 'revoked') return 'GRANT_REVOKED';
  if (grant.status !== 'active') return 'GRANT_NOT_ACTIVE';
  if (!Number.isSafeInteger(grant.expiresAtMs) || s.nowMs >= grant.expiresAtMs) return 'GRANT_EXPIRED';
  if (!ref(grant.grantRef) || !ref(grant.revision) ||
      !identity.every(k => exact(grant[k],s[k])) || grant.purpose !== s.purpose)
    return 'GRANT_PRINCIPAL_MISMATCH';
  if (!Array.isArray(grant.scopes) || !grant.scopes.every(ref) || !grant.scopes.includes('control:read'))
    return 'READ_SCOPE_DENIED';
  return null;
}

function planError(p: HostPlanRead, s: HostReadScope, q: HostStatusQuery, risk: HostRisk): string | null {
  if (!record(p) || p.schema !== 'vivim.wave4-host-plan-read/1' || p.planId !== q.planId ||
      !digest(p.planDigest) || p.actionId !== q.actionId || p.risk !== risk ||
      !identity.every(k => exact(p[k],s[k])) || p.purpose !== s.purpose ||
      !exact(p.grantRef,s.grant?.grantRef) || !exact(p.grantRevision,s.grant?.revision))
    return 'PLAN_ACTOR_OR_GRANT_MISMATCH';
  if (p.worldRevision !== s.worldRevision || p.policyRevision !== s.policyRevision ||
      p.catalogVersion !== s.catalogVersion || p.catalogDigest !== s.catalogDigest)
    return 'PLAN_SOURCE_STALE';
  if (!Number.isSafeInteger(p.expiresAtMs) || s.nowMs >= p.expiresAtMs)
    return 'PLAN_EXPIRED';
  if (!['planned','approved','claimed','receipt','denied'].includes(p.state) || typeof p.claimed !== 'boolean')
    return 'PLAN_STATE_INVALID';
  return null;
}

function receiptError(r: NonNullable<HostPlanRead['receipt']>, p: HostPlanRead): string | null {
  if (!record(r) || r.schema !== 'vivim.control-receipt/1' ||
      Object.hasOwn(r,'signatureState') || Object.hasOwn(r,'verified') || Object.hasOwn(r,'signed') ||
      !ref(r.receiptRef) || r.planId !== p.planId || r.planDigest !== p.planDigest ||
      r.actionId !== p.actionId || r.worldRevision !== p.worldRevision ||
      r.policyRevision !== p.policyRevision || !identity.every(k => exact(r[k],p[k])) ||
      r.purpose !== p.purpose || !['applied','failed','uncertain'].includes(r.status) ||
      !['unsigned_general_journal','signed_host_envelope'].includes(r.evidence) ||
      (r.evidence === 'signed_host_envelope' && (!record(r.signatureEnvelope) ||
        !ref(r.signatureEnvelope.keyId) || typeof r.signatureEnvelope.signatureBase64 !== 'string' ||
        !/^[A-Za-z0-9+/]{16,}={0,2}$/.test(r.signatureEnvelope.signatureBase64))) ||
      (r.evidence === 'unsigned_general_journal' && r.signatureEnvelope !== undefined))
    return 'RECEIPT_CONTEXT_OR_PROVENANCE_INVALID';
  return null;
}

/** Data-only output. No raw owner IDs, grant IDs, plan digest, journal body or tokens. */
export function createWave4HostStatusContract(port: Wave4HostReadPort) {
  function project(state: Wave4HostState, reasonCode: string,
    details: Partial<Pick<Wave4HostStatus,'actionId'|'risk'|'availability'|'permission'|'approval'|'receiptState'|'receiptVerification'>> = {}): Wave4HostStatus {
    const stage = state === 'denied' ? 'denied' : state === 'pending_approval' ? 'pending' :
      state === 'applied' || state === 'verified' ? 'applied' : 'uncertain';
    const recovery = projectRecovery({authority:'host',stage,operationKind:'host_effect',
      reasonCode,offline:false,canCancel:false,canRequestUndo:false,statusCheckedByAuthority:false});
    return Object.freeze({schema:WAVE4_HOST_STATUS_SCHEMA,state,reasonCode,
      availability:'unknown',permission:'unknown',approval:'none',receiptState:'none',
      receiptVerification:'not_present',...details,
      effectInvoked:false,canExecute:false,automaticRetryAllowed:false,
      source:{authority:'host-read-port' as const,evidenceClass:port.evidenceClass,liveHostAcceptance:'unproven' as const},
      recovery,accessibility:{role:(state === 'denied' || state === 'uncertain' ? 'alert':'status') as 'alert' | 'status',
        initialFocus:'recovery-heading' as const,textEquivalent:
        'Host status is read only. Inspect the authoritative Host before any newly approved action.'},
    });
  }

  function readStatus(query: HostStatusQuery): Wave4HostStatus {
    if (!record(query) || Object.keys(query).some(k=>!['actionId','planId','purpose','expected'].includes(k)) ||
        !ref(query.actionId) || !purposes.includes(query.purpose) ||
        (query.planId !== undefined && !/^ctl-[a-f0-9]{16}$/.test(query.planId)) ||
        !record(query.expected) || !ref(query.expected.worldRevision) ||
        !ref(query.expected.policyRevision) || !Number.isSafeInteger(query.expected.catalogVersion) ||
        !digest(query.expected.catalogDigest)) return project('denied','STATUS_QUERY_INVALID');
    let scope: HostReadScope | null;
    try { scope = port.currentScope(); } catch { return project('uncertain','HOST_SCOPE_UNAVAILABLE'); }
    const blocked = scopeError(scope,query.purpose);
    if (blocked || !scope) return project('denied',blocked ?? 'HOST_SCOPE_UNAVAILABLE');
    if (query.expected.worldRevision !== scope.worldRevision ||
        query.expected.policyRevision !== scope.policyRevision ||
        query.expected.catalogVersion !== scope.catalogVersion ||
        query.expected.catalogDigest !== scope.catalogDigest)
      return project('uncertain','SOURCE_VERSION_CHANGED');
    let cap: HostCapabilityView | null;
    try { cap = port.readCapability(scope,query.actionId); }
    catch { return project('uncertain','HOST_CAPABILITY_READ_FAILED'); }
    if (!record(cap) || cap.schema !== 'vivim.host-capability/1' || cap.actionId !== query.actionId ||
        cap.catalogVersion !== scope.catalogVersion || cap.catalogDigest !== scope.catalogDigest ||
        !['R0','R1','R2','R3'].includes(cap.risk) ||
        !['yes','no','unknown'].includes(cap.supportedByBuild) ||
        !['yes','no','unknown'].includes(cap.availableNow) ||
        !['yes','no','unknown'].includes(cap.permittedForActor) ||
        !Array.isArray(cap.requiredScopes) || !cap.requiredScopes.every(ref))
      return project('uncertain','HOST_CAPABILITY_INVALID');
    const d = {actionId:query.actionId,risk:cap.risk,availability:cap.availableNow,
      permission:cap.permittedForActor};
    if (cap.risk === 'R3') return project('denied','R3_REFUSED',d);
    if (cap.risk === 'R2' && scope.surface === 'phone') return project('denied','R2_DESKTOP_REQUIRED',d);
    if (cap.supportedByBuild === 'no' || cap.availableNow === 'no')
      return project('denied','HOST_ACTION_UNAVAILABLE',d);
    if (cap.permittedForActor === 'no' || cap.requiredScopes.some(x=>!scope.grant?.scopes.includes(x)))
      return project('denied','HOST_SCOPE_DENIED',{...d,permission:'no'});
    if (cap.supportedByBuild !== 'yes' || cap.availableNow !== 'yes')
      return project('uncertain','HOST_AVAILABILITY_UNVERIFIED',d);
    if (cap.permittedForActor === 'unknown') return project('available','PERMISSION_UNCONFIRMED',d);
    if (query.planId === undefined) return project('permitted','HOST_PERMITTED_READ_ONLY',d);
    let p: HostPlanRead | null;
    try { p = port.readPlan(scope,query.planId); }
    catch { return project('uncertain','HOST_PLAN_READ_FAILED',d); }
    // No disclosure whether a foreign plan ID exists.
    if (!p) return project('denied','PLAN_NOT_ACCESSIBLE');
    const error = planError(p,scope,query,cap.risk);
    if (error) return project('denied',error === 'PLAN_ACTOR_OR_GRANT_MISMATCH' ? 'PLAN_NOT_ACCESSIBLE' : error);
    if ((p.state === 'planned' || p.state === 'approved' || p.state === 'denied') &&
        (p.claimed || p.receipt)) return project('uncertain','JOURNAL_STATE_INCONSISTENT',d);
    if (p.state === 'denied') return project('denied','HOST_PLAN_DENIED',d);
    if (p.state === 'planned') return project('pending_approval','OWNER_APPROVAL_PENDING',
      {...d,approval:'pending'});
    if (p.state === 'approved' && !p.claimed) return project('permitted','APPROVED_NOT_CLAIMED',
      {...d,approval:'approved'});
    if (!p.claimed) return project('uncertain','JOURNAL_STATE_INCONSISTENT',d);
    if (!p.receipt || p.state === 'claimed') return project('uncertain','CLAIM_WITHOUT_RECEIPT',
      {...d,approval:'approved',receiptState:'claimed_unconfirmed'});
    const r = p.receipt;
    if (receiptError(r,p)) return project('denied','RECEIPT_CONTEXT_OR_PROVENANCE_INVALID');
    if (r.status === 'uncertain') return project('uncertain','HOST_RECEIPT_UNCERTAIN',
      {...d,approval:'approved',receiptState:'uncertain',receiptVerification:'unverified'});
    if (r.status === 'failed') return project('denied','HOST_REPORTED_FAILED',
      {...d,approval:'approved',receiptState:'reported_failed',receiptVerification:'unverified'});
    // The current Harness general journal is NOT signed. Never accept a signatureState
    // or verified flag inside a payload; only a Host-owned verification callback may attest.
    let verified = false;
    if (port.evidenceClass === 'authenticated_host' && r.evidence === 'signed_host_envelope' &&
        typeof port.verifyReceipt === 'function') {
      try { verified = port.verifyReceipt(scope,p,r) === true; } catch { verified = false; }
    }
    return verified ? project('verified','HOST_SIGNATURE_VERIFIED',
      {...d,approval:'approved',receiptState:'verified_by_host',receiptVerification:'host_verified'}) :
      project('applied','HOST_REPORTED_APPLIED_UNVERIFIED',
        {...d,approval:'approved',receiptState:'reported_applied',
          receiptVerification:r.evidence === 'unsigned_general_journal' ? 'unsigned':'unverified'});
  }
  return Object.freeze({readStatus});
}
