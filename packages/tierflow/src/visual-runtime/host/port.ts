/** HostCapabilityPort/1. Inert, source-backed TierFlow fixture contract; NOT a Host adapter. */
export type TriState = 'yes' | 'no' | 'unknown';
export type HostRisk = 'R0' | 'R1' | 'R2' | 'R3';
export type HostReadiness = 'verified' | 'source_wired' | 'adapter_pending' | 'enforcement_missing' | 'unsupported';
export type HostSurface = 'desktop' | 'phone';
export type JsonArgument = string | number | boolean | null;
export type ArgumentType = 'string' | 'number' | 'boolean';
export type ArgumentSpec = ArgumentType | Readonly<{type: ArgumentType | 'enum'; min?: number; max?: number; values?: readonly string[]}>;

export interface HostActionDescriptor {
  readonly actionId: string;
  readonly catalogVersion: number;
  readonly risk: HostRisk;
  readonly readiness: HostReadiness;
  readonly requiredScopes: readonly string[];
  readonly argsSchema: Readonly<Record<string, ArgumentSpec>>;
  readonly evidence: 'verified' | 'source_inspected' | 'unknown';
  readonly prerequisites: readonly string[];
}

/** Only the fixture's TEST caller may manufacture this broker-injected context. No user-command fields are trusted. */
export interface TrustedFixtureHostContext {
  readonly schema: 'fixture.trusted-host-context/1';
  readonly authenticated: boolean;
  readonly ownerRef: string;
  readonly actorRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly worldRef: string;
  readonly surface: HostSurface;
  readonly nowMs: number;
  readonly sessionExpiresAtMs: number;
  readonly worldRevision: string;
  readonly policyRevision: string;
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  readonly availabilityByAction: Readonly<Record<string, TriState>>;
  readonly grant: null | Readonly<{
    grantRef: string;
    status: 'active' | 'revoked' | 'pending' | 'expired';
    ownerRef: string;
    actorRef: string;
    deviceRef: string;
    sessionRef: string;
    worldRef: string;
    expiresAtMs: number;
    revision: string;
    scopes: readonly string[];
  }>;
}

/** Visual-command subset: no claimed owner, device, approval or bearer fields. */
export interface InertHostCommand {
  readonly schema: 'vivim.visual-command/1';
  readonly commandId: string;
  readonly target: Readonly<{owner: 'host_effect'; actionId: string; catalogVersion: number}>;
  readonly args: Readonly<Record<string, JsonArgument>>;
  readonly sourceVersions: Readonly<{hostWorld: string; policy: string; catalogDigest: string}>;
}

export interface HostCapabilityView {
  readonly schema: 'vivim.host-capability/1';
  readonly actionId: string;
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  readonly risk: HostRisk;
  readonly requiredScopes: readonly string[];
  readonly prerequisites: readonly string[];
  readonly supportedByBuild: TriState;
  readonly availableNow: TriState;
  readonly permittedForActor: TriState;
  readonly verifiedByEvidence: TriState;
  readonly reasonCodes: readonly string[];
  readonly source: Readonly<{authority: 'host-catalog-fixture'; observedAtMs: number; proof: 'fixture_only'}>;
}

export interface InertHostPlan {
  readonly schema: 'vivim.host-plan-fixture/1';
  readonly planId: string;
  readonly planDigest: string;
  readonly commandId: string;
  readonly actionId: string;
  readonly args: Readonly<Record<string, JsonArgument>>;
  readonly risk: HostRisk;
  readonly ownerRef: string;
  readonly actorRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly worldRef: string;
  readonly surface: HostSurface;
  readonly grantRef: string;
  readonly grantRevision: string;
  readonly grantScopes: readonly string[];
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  readonly worldRevision: string;
  readonly policyRevision: string;
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
  readonly approvalRequired: boolean;
  readonly proof: 'fixture_only';
}

export type HostFixtureDenial = Readonly<{
  kind: 'denied';
  reasonCode: string;
  effectInvoked: false;
  next: 'explain_refusal' | 'read_only_reconcile';
}>;
export type HostPrepareResult = HostFixtureDenial | Readonly<{
  kind: 'prepared_inert'; plan: InertHostPlan; effectInvoked: false;
}>;
export interface InertApproval {
  readonly planDigest: string;
  readonly channel: 'desktop-owner-token' | 'direct-phone';
  readonly ownerConfirmed: boolean;
}
export type HostApprovalResult = HostFixtureDenial | Readonly<{
  kind: 'approved_inert'; planId: string; planDigest: string;
  effectInvoked: false; next: 'host_owner_gateway_required';
}>;

export interface HostClaimSnapshot {
  readonly planId: string;
  readonly planDigest: string;
  readonly actionId: string;
  readonly ownerRef: string;
  readonly actorRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly worldRef: string;
  readonly worldRevision: string;
  readonly state: 'planned' | 'approved' | 'claimed' | 'receipt';
}
export interface HostGeneralJournalReceipt {
  readonly schema: 'vivim.control-receipt/1';
  readonly planId: string;
  readonly planDigest: string;
  readonly actionId: string;
  readonly status: 'applied' | 'failed' | 'uncertain';
  readonly receiptRef: string;
  readonly worldRevision: string;
}
export interface HostReceiptObservation {
  readonly receipt: HostGeneralJournalReceipt;
  /** No generic Host journal signing is assumed. HMAC is a TEST-only signer, never production Host proof. */
  readonly evidence: Readonly<
    | {kind: 'unsigned-general-journal'}
    | {kind: 'test-hmac'; keyId: string; macHex: string}
    | {kind: 'unknown'}
  >;
  readonly replayed?: boolean;
}
export interface HostActionOutcome {
  readonly schema: 'vivim.host-action-outcome/1';
  readonly status: 'denied' | 'applied' | 'failed' | 'uncertain' | 'replayed';
  readonly reasonCode: string;
  readonly signatureState: 'verified' | 'unsigned' | 'unknown' | 'invalid';
  readonly source: Readonly<{authority: 'host-control-journal-fixture'; proof: 'fixture_only'}>;
  readonly receiptRef?: string;
  readonly worldRevision?: string;
  readonly requiresReadOnlyReconcile: boolean;
  readonly effectInvoked: false;
}
export interface HostCapabilityPort {
  describeForPrincipal(context: TrustedFixtureHostContext, actionId: string): HostCapabilityView;
  prepare(command: InertHostCommand, context: TrustedFixtureHostContext): HostPrepareResult;
  evaluateApprovalInert(plan: InertHostPlan, approval: InertApproval, context: TrustedFixtureHostContext): HostApprovalResult;
  reconcileClaimReadOnly(claim: HostClaimSnapshot, observation: HostReceiptObservation | null, context: TrustedFixtureHostContext): HostActionOutcome;
  /** Deliberately NO execute(), dispatch(), provider send, filesystem or network port. */
}
