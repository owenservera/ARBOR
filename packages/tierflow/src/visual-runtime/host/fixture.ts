/** Inert HostCapabilityPort/1: all calls return values; no Host, KB, device or browser IO. */
import {createHash} from 'node:crypto';
import type {
  HostActionDescriptor, HostCapabilityPort, HostCapabilityView, HostFixtureDenial,
  HostPrepareResult, HostApprovalResult, HostRisk, InertHostCommand,
  InertHostPlan, InertApproval, JsonArgument, TrustedFixtureHostContext,
  TriState, HostReceiptObservation, HostClaimSnapshot,
} from './port.ts';
import {projectObservedHostOutcome} from './outcome.ts';

const deny = (reasonCode: string, reconcile = false): HostFixtureDenial => ({
  kind: 'denied', reasonCode, effectInvoked: false,
  next: reconcile ? 'read_only_reconcile' : 'explain_refusal',
});
const nonempty = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 160;
const plain = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' &&
  !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);

function canonical(x: unknown): string {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (plain(x)) return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
const sha = (x: unknown): string => createHash('sha256').update(canonical(x)).digest('hex');
const binding = (context: TrustedFixtureHostContext) => ({
  ownerRef: context.ownerRef, actorRef: context.actorRef, deviceRef: context.deviceRef,
  sessionRef: context.sessionRef, worldRef: context.worldRef,
});

function principalReason(context: TrustedFixtureHostContext): string | null {
  if (context.schema !== 'fixture.trusted-host-context/1' || !context.authenticated ||
      !Object.values(binding(context)).every(nonempty)) return 'AUTHENTICATED_PRINCIPAL_REQUIRED';
  if (!Number.isSafeInteger(context.nowMs) || !Number.isSafeInteger(context.sessionExpiresAtMs) ||
      context.nowMs >= context.sessionExpiresAtMs) return 'SESSION_EXPIRED';
  if (context.surface !== 'desktop' && context.surface !== 'phone') return 'SURFACE_INVALID';
  if (!context.grant) return 'GRANT_MISSING';
  const g = context.grant;
  if (g.status !== 'active') return g.status === 'revoked' ? 'GRANT_REVOKED' : 'GRANT_NOT_ACTIVE';
  if (context.nowMs >= g.expiresAtMs) return 'GRANT_EXPIRED';
  if (!nonempty(g.grantRef) || !nonempty(g.revision)) return 'GRANT_INVALID';
  if (Object.entries(binding(context)).some(([k, v]) => g[k as keyof typeof g] !== v)) return 'GRANT_PRINCIPAL_MISMATCH';
  if (!Array.isArray(g.scopes) || g.scopes.some(s => !nonempty(s))) return 'GRANT_INVALID';
  return null;
}
function validateArgs(args: unknown, schema: HostActionDescriptor['argsSchema']): args is Record<string, JsonArgument> {
  if (!plain(args) || Object.keys(args).length !== Object.keys(schema).length ||
      JSON.stringify(args).length > 2048) return false;
  for (const [key, rule] of Object.entries(schema)) {
    const spec = typeof rule === 'string' ? {type: rule} : rule;
    if (!spec || typeof spec !== 'object' || !Object.hasOwn(args, key)) return false;
    const value = args[key];
    if (spec.type === 'enum') {
      if (typeof value !== 'string' || !('values' in spec) || !Array.isArray(spec.values) ||
          !spec.values.includes(value)) return false;
    } else if (typeof value !== spec.type) return false;
    if (spec.type === 'string' && (typeof value !== 'string' || value.length > 800)) return false;
    if (spec.type === 'number' && !Number.isSafeInteger(value)) return false;
    if ('min' in spec && typeof spec.min === 'number' &&
        (typeof value === 'string' ? value.length < spec.min : typeof value === 'number' ? value < spec.min : true)) return false;
    if ('max' in spec && typeof spec.max === 'number' &&
        (typeof value === 'string' ? value.length > spec.max : typeof value === 'number' ? value > spec.max : true)) return false;
  }
  return Object.keys(args).every(k => Object.hasOwn(schema, k) && !/^(?:actor|owner|device|grant|approval|token|bearer|argv|shell|command)$/i.test(k));
}
function planBody(p: InertHostPlan): Omit<InertHostPlan, 'planId' | 'planDigest'> {
  const {planId: _id, planDigest: _digest, ...body} = p;
  return body;
}

export interface HostFixtureOptions {
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  readonly actions: readonly HostActionDescriptor[];
  readonly testReceiptVerifier?: Readonly<{keyId: string; secret: string}>;
}

/** Does not implement Host execute. TrustedFixtureHostContext is an explicit synthetic test boundary. */
export function createHostCapabilityFixture(options: HostFixtureOptions): HostCapabilityPort {
  if (!Number.isSafeInteger(options.catalogVersion) || options.catalogVersion < 1 ||
      !/^[a-f0-9]{64}$/.test(options.catalogDigest)) throw new Error('FIXTURE_CATALOG_INVALID');
  const actions = new Map<string, HostActionDescriptor>();
  for (const original of options.actions) {
    if (!nonempty(original.actionId) || original.catalogVersion !== options.catalogVersion ||
        actions.has(original.actionId) || !['R0','R1','R2','R3'].includes(original.risk) ||
        !Array.isArray(original.requiredScopes) || !plain(original.argsSchema))
      throw new Error('FIXTURE_ACTION_INVALID');
    const copied: HostActionDescriptor = {
      ...original, requiredScopes: Object.freeze([...original.requiredScopes]),
      prerequisites: Object.freeze([...original.prerequisites]), argsSchema: Object.freeze({...original.argsSchema}),
    };
    actions.set(copied.actionId, Object.freeze(copied));
  }

  function describeForPrincipal(context: TrustedFixtureHostContext, actionId: string): HostCapabilityView {
    const a = actions.get(actionId);
    const source = {authority: 'host-catalog-fixture', proof: 'fixture_only', observedAtMs: context.nowMs} as const;
    const stale = context.catalogVersion !== options.catalogVersion || context.catalogDigest !== options.catalogDigest;
    const supportedByBuild: TriState = !a ? 'unknown' : stale ? 'unknown' :
      ['verified','source_wired'].includes(a.readiness) ? 'yes' :
      a.readiness === 'unsupported' || a.readiness === 'enforcement_missing' || a.readiness === 'adapter_pending' ? 'no' : 'unknown';
    const available: TriState = context.availabilityByAction?.[actionId] ?? 'unknown';
    const availableNow: TriState = supportedByBuild !== 'yes' ? (supportedByBuild === 'no' ? 'no' : 'unknown') :
      ['yes','no','unknown'].includes(available) ? available : 'unknown';
    const principal = principalReason(context);
    const requiredScopes = a?.requiredScopes ?? [];
    const permittedForActor: TriState = principal || stale || !a ||
      requiredScopes.some(s => !context.grant?.scopes.includes(s)) ? 'no' : 'yes';
    const verifiedByEvidence: TriState = !a || stale || a.evidence === 'unknown' ? 'unknown' :
      a.evidence === 'verified' ? 'yes' : 'no';
    const reasons = [
      ...(!a ? ['ACTION_UNKNOWN'] : []), ...(stale ? ['CATALOG_STALE'] : []),
      ...(principal ? [principal] : []),
      ...(a && !principal && requiredScopes.some(s => !context.grant?.scopes.includes(s)) ? ['SCOPE_DENIED'] : []),
      ...(supportedByBuild === 'no' ? ['NOT_SOURCE_WIRED'] : []),
      ...(availableNow === 'no' ? ['HOST_UNAVAILABLE'] : availableNow === 'unknown' ? ['AVAILABILITY_UNVERIFIED'] : []),
      ...(verifiedByEvidence !== 'yes' ? ['EVIDENCE_NOT_VERIFIED'] : []),
      ...(a?.risk === 'R3' ? ['R3_REFUSED'] : []),
      ...(a?.risk === 'R2' && context.surface === 'phone' ? ['R2_DESKTOP_REQUIRED'] : []),
    ];
    return {
      schema: 'vivim.host-capability/1', actionId, catalogVersion: options.catalogVersion,
      catalogDigest: options.catalogDigest, risk: a?.risk ?? 'R3',
      requiredScopes, prerequisites: a?.prerequisites ?? [],
      supportedByBuild, availableNow, permittedForActor, verifiedByEvidence,
      reasonCodes: [...new Set(reasons)], source,
    };
  }

  function prepare(command: InertHostCommand, context: TrustedFixtureHostContext): HostPrepareResult {
    if (!plain(command) || Object.keys(command).some(k => !['schema','commandId','target','args','sourceVersions'].includes(k)))
      return deny('UNTRUSTED_COMMAND_FIELDS');
    if (command.schema !== 'vivim.visual-command/1' || !nonempty(command.commandId) ||
        !plain(command.target) || !plain(command.sourceVersions) ||
        Object.keys(command.target).some(k => !['owner','actionId','catalogVersion'].includes(k)) ||
        Object.keys(command.sourceVersions).some(k => !['hostWorld','policy','catalogDigest'].includes(k)) ||
        command.target.owner !== 'host_effect') return deny('COMMAND_INVALID');
    const a = actions.get(command.target.actionId);
    if (!a) return deny('ACTION_UNKNOWN');
    if (!validateArgs(command.args, a.argsSchema)) return deny('ARGS_INVALID');
    if (command.target.catalogVersion !== options.catalogVersion ||
        command.sourceVersions.catalogDigest !== options.catalogDigest ||
        context.catalogVersion !== options.catalogVersion || context.catalogDigest !== options.catalogDigest)
      return deny('CATALOG_STALE');
    if (command.sourceVersions.hostWorld !== context.worldRevision ||
        command.sourceVersions.policy !== context.policyRevision) return deny('SOURCE_REVISION_STALE');
    const cap = describeForPrincipal(context, a.actionId);
    if (cap.permittedForActor !== 'yes') return deny(cap.reasonCodes.find(x =>
      ['AUTHENTICATED_PRINCIPAL_REQUIRED','SESSION_EXPIRED','GRANT_MISSING','GRANT_REVOKED','GRANT_NOT_ACTIVE',
       'GRANT_EXPIRED','GRANT_INVALID','GRANT_PRINCIPAL_MISMATCH','SCOPE_DENIED'].includes(x)) ?? 'PERMISSION_DENIED');
    if (a.risk === 'R3') return deny('R3_REFUSED');
    if (a.risk === 'R2' && context.surface === 'phone') return deny('R2_DESKTOP_REQUIRED');
    if (cap.supportedByBuild !== 'yes') return deny('ACTION_NOT_WIRED');
    if (cap.availableNow !== 'yes') return deny(cap.availableNow === 'no' ? 'HOST_UNAVAILABLE' : 'AVAILABILITY_UNVERIFIED');
    if (cap.verifiedByEvidence !== 'yes') return deny('EVIDENCE_NOT_VERIFIED');
    const grant = context.grant;
    if (!grant) return deny('GRANT_MISSING');
    const body = {
      schema: 'vivim.host-plan-fixture/1' as const, commandId: command.commandId,
      actionId: a.actionId, args: {...command.args}, risk: a.risk,
      ...binding(context), surface: context.surface, grantRef: grant.grantRef,
      grantRevision: grant.revision, grantScopes: [...grant.scopes].sort(),
      catalogVersion: options.catalogVersion, catalogDigest: options.catalogDigest,
      worldRevision: context.worldRevision, policyRevision: context.policyRevision,
      createdAtMs: context.nowMs, expiresAtMs: Math.min(context.nowMs + 60_000, grant.expiresAtMs, context.sessionExpiresAtMs),
      approvalRequired: a.risk !== 'R0', proof: 'fixture_only' as const,
    };
    const planDigest = sha(body);
    const plan: InertHostPlan = {...body, planDigest, planId: 'fh-' + planDigest.slice(0,32)};
    return {kind: 'prepared_inert', plan, effectInvoked: false};
  }

  function evaluateApprovalInert(plan: InertHostPlan, approval: InertApproval,
    context: TrustedFixtureHostContext): HostApprovalResult {
    if (!plain(plan) || !nonempty(plan.planId) || !/^[a-f0-9]{64}$/.test(plan.planDigest) ||
        plan.planDigest !== sha(planBody(plan)) || plan.planId !== 'fh-' + plan.planDigest.slice(0,32))
      return deny('CONTROL_PLAN_TAMPERED', true);
    if (context.nowMs >= plan.expiresAtMs || context.nowMs < plan.createdAtMs) return deny('CONTROL_PLAN_EXPIRED', true);
    const principal = principalReason(context);
    if (principal) return deny(principal);
    const g = context.grant;
    if (!g) return deny('GRANT_MISSING');
    if (Object.entries(binding(context)).some(([key, value]) => plan[key as keyof InertHostPlan] !== value) ||
        plan.surface !== context.surface || plan.grantRef !== g.grantRef ||
        plan.grantRevision !== g.revision || canonical(plan.grantScopes) !== canonical([...g.scopes].sort()))
      return deny('PLAN_PRINCIPAL_OR_GRANT_CHANGED', true);
    if (plan.worldRevision !== context.worldRevision || plan.policyRevision !== context.policyRevision ||
        plan.catalogVersion !== options.catalogVersion || plan.catalogDigest !== options.catalogDigest ||
        context.catalogVersion !== options.catalogVersion || context.catalogDigest !== options.catalogDigest)
      return deny('PLAN_SOURCE_CHANGED', true);
    const a = actions.get(plan.actionId);
    if (!a || a.risk !== plan.risk || !validateArgs(plan.args, a.argsSchema)) return deny('PLAN_ACTION_STALE', true);
    const cap = describeForPrincipal(context, a.actionId);
    if (cap.supportedByBuild !== 'yes' || cap.availableNow !== 'yes' ||
        cap.permittedForActor !== 'yes' || cap.verifiedByEvidence !== 'yes') return deny('PLAN_CAPABILITY_CHANGED', true);
    if (a.risk === 'R3') return deny('R3_REFUSED');
    if (a.risk === 'R2' && context.surface === 'phone') return deny('R2_DESKTOP_REQUIRED');
    if (!plain(approval) || approval.planDigest !== plan.planDigest) return deny('CONTROL_PLAN_MISMATCH');
    if (plan.approvalRequired !== (a.risk !== 'R0')) return deny('CONTROL_PLAN_TAMPERED', true);
    if (plan.approvalRequired && approval.ownerConfirmed !== true) return deny('OWNER_APPROVAL_REQUIRED');
    if (plan.approvalRequired &&
        (approval.channel !== (context.surface === 'desktop' ? 'desktop-owner-token' : 'direct-phone')))
      return deny('APPROVAL_SURFACE_MISMATCH');
    if (a.risk === 'R2' && approval.channel !== 'desktop-owner-token') return deny('R2_DESKTOP_REQUIRED');
    return {kind: 'approved_inert', planId: plan.planId,
      planDigest: plan.planDigest, effectInvoked: false, next: 'host_owner_gateway_required'};
  }

  function reconcileClaimReadOnly(claim: HostClaimSnapshot, observation: HostReceiptObservation | null,
    context: TrustedFixtureHostContext) {
    return projectObservedHostOutcome(claim, observation, context, options.testReceiptVerifier);
  }
  return Object.freeze({describeForPrincipal, prepare, evaluateApprovalInert, reconcileClaimReadOnly});
}
