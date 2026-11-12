/**
 * VIVIM Lane D / v1 — pure recovery decisions, NOT a recovery executor.
 * No IO, networking, shell, timers, Host mutations, provider sends or permission grants.
 * All execution remains with the existing authorized Host owners. A recovery plan is
 * advisory even if its state machine records an external authorization event.
 */
import { createHash } from 'node:crypto';

export const RECOVERY_PLAN_SCHEMA = 'vivim.recovery-plan/1';
export const RECOVERY_HISTORY_SCHEMA = 'vivim.recovery-history/1';
export const RECOVERY_MEMORY_SCHEMA = 'vivim.recovery-memory/1';
export const FAILURE_CATALOG_SCHEMA = 'vivim.failure-signatures/1';
const ID = /^[A-Za-z0-9_.:-]{1,100}$/;
const LEVELS = Object.freeze(['R0', 'R1', 'R2', 'R3', 'R4']);
const plain = x => !!x && typeof x === 'object' && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const stable = x => Array.isArray(x) ? x.map(stable) : plain(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const fail = code => { const e = new Error(code); e.code = code; throw e; };
const validId = x => typeof x === 'string' && ID.test(x);
const validTime = x => typeof x === 'string' && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x;

// Readiness and authority are reported as evidence, not inferred from a method's name.
// R0...R4 are RECOVERY levels, separate from the existing Host action R0...R3 risks.
// No registry entry directly binds an arbitrary function, URL, PID, file or command.
export const RECOVERY_ACTIONS = Object.freeze({
  'host.worker.heartbeat.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/diagnostics.mjs:workerHealth', targetKind:'worker', admission:'existing_read_only' }),
  'host.worker.lease.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/bootstrap/worker-supervisor.mjs:status', targetKind:'worker', admission:'existing_read_only' }),
  'host.control.outcome.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/control/dispatcher.mjs:status', targetKind:'control', admission:'existing_read_only' }),
  'host.world.projection.inspect': Object.freeze({ level:'R0', owner:'vivim-host', effect:'read', existing:'apps/vivim-host/bootstrap/runtime.mjs:projection', targetKind:'world', admission:'existing_read_only' }),
  'host.worker.lease.recover': Object.freeze({ level:'R2', owner:'vivim-host', effect:'lease_change', existing:'apps/vivim-host/bootstrap/worker-supervisor.mjs:recover', targetKind:'worker', admission:'blocked_pending_route_authorization_proof' }),
  'host.world.revision.undo': Object.freeze({ level:'R3', owner:'vivim-host', effect:'persistent_world_mutation', existing:'apps/vivim-host/bootstrap/runtime.mjs:undoUiRevision', targetKind:'world', admission:'owner_approved_host_path_only' }),
});

// Versioned, source-linked signature hypotheses. A code alone is never proof.
export const FAILURE_SIGNATURES = Object.freeze({
  schema: FAILURE_CATALOG_SCHEMA,
  version: 1,
  entries: Object.freeze({
    NO_HEARTBEAT: { target:'worker', evidence:'missing_heartbeat', hypothesis:'worker not observed; process death not established', first:'host.worker.heartbeat.inspect' },
    HEARTBEAT_STALE: { target:'worker', evidence:'stale_heartbeat', hypothesis:'worker may be delayed, disconnected or stopped', first:'host.worker.lease.inspect' },
    WORKER_CYCLE_FAILED: { target:'worker', evidence:'worker_cycle_error', hypothesis:'worker reported an unsuccessful cycle', first:'host.worker.lease.inspect' },
    PROCESS_ENDED: { target:'worker', evidence:'process_exit', hypothesis:'process exited; pending effects may be uncertain', first:'host.worker.lease.inspect' },
    HOST_TRANSPORT_DISCONNECTED: { target:'worker', evidence:'transport_disconnected', hypothesis:'transport may be offline, expired or owned by a dead worker', first:'host.worker.lease.inspect' },
    CONTROL_UNCERTAIN: { target:'control', evidence:'control_claim_without_receipt', hypothesis:'claimed effect has no terminal receipt; outcome unknown', first:'host.control.outcome.inspect' },
    SEND_OUTCOME_UNCERTAIN: { target:'control', evidence:'send_outcome_uncertain', hypothesis:'provider send may have occurred; do not resend', first:'host.control.outcome.inspect' },
    PHONE_PROJECTION_STALE: { target:'world', evidence:'revision_gap', hypothesis:'phone projection may lag the authoritative World', first:'host.world.projection.inspect' },
    GRANT_REVOKED: { target:'world', evidence:'grant_revocation', hypothesis:'permission is revoked; cached sensitive projections must not be restored', first:null },
    SCHEMA_MISMATCH: { target:'world', evidence:'schema_mismatch', hypothesis:'consumer and publisher schemas may be incompatible', first:'host.world.projection.inspect' },
    WORLD_REVISION_CONFLICT: { target:'world', evidence:'revision_conflict', hypothesis:'World revision conflict needs canonical state inspection', first:'host.world.projection.inspect' },
  }),
});

/** Only metadata, source references and whitelisted kinds cross this boundary. */
export function validateFinding(f) {
  if (!plain(f) || f.schema !== 'vivim.diagnostic-finding/1' || !validId(f.id) ||
      !plain(f.target) || !validId(f.target.id) || !['worker','control','world'].includes(f.target.kind) ||
      !validTime(f.observedAt) || !['low','medium','high','critical'].includes(f.severity) ||
      typeof f.code !== 'string' || f.code.length > 80 || !/^[A-Z0-9_]+$/.test(f.code) ||
      !Number.isFinite(f.confidence) || f.confidence < 0 || f.confidence > 1 ||
      !Array.isArray(f.evidence) || f.evidence.length > 16 ||
      !f.evidence.every(e => plain(e) && validId(e.ref) && validId(e.kind) && validTime(e.at) && Object.keys(e).every(k=>['ref','kind','at'].includes(k)))) fail('RECOVERY_FINDING_INVALID');
  return f;
}

/** Diagnostic state is separate from treatment readiness. */
export function diagnoseRecovery(finding) {
  const f = validateFinding(finding), signature = FAILURE_SIGNATURES.entries[f.code];
  if (!signature || signature.target !== f.target.kind) return { classification:'unknown', hypotheses:[], evidenceRefs:f.evidence.map(e=>e.ref), escalation:'unknown_or_mismatched_signature' };
  const observed = f.evidence.some(e=>e.kind === signature.evidence);
  const latestFailureAt = Math.max(0,...f.evidence.filter(e=>e.kind===signature.evidence).map(e=>Date.parse(e.at)));
  const healthy = f.evidence.some(e=>e.kind === 'authoritative_healthy' && Date.parse(e.at)>latestFailureAt);
  const classification = healthy && observed ? 'already_recovered' : !observed ? 'missing_observability' :
    ['CONTROL_UNCERTAIN','SEND_OUTCOME_UNCERTAIN','GRANT_REVOKED'].includes(f.code) ? 'confirmed_state_not_effect_outcome' :
    f.confidence >= 0.9 ? 'confirmed_failure_signal' : 'suspected';
  return { classification, hypotheses:[{ code:f.code, explanation:signature.hypothesis, confidence:observed?f.confidence:0 }],
    evidenceRefs:f.evidence.map(e=>e.ref), escalation:null };
}

/**
 * Builds a non-executing, digest-pinned suggestion. No policy object passed here
 * can grant authority. Host must independently enforce auth, current policy epoch,
 * exact revisions, and idempotency before invoking an existing owner executor.
 */
export function planRecovery(finding, { now, policyVersion, authorityEpoch, worldRevision = null, environmentKey = 'unknown' } = {}) {
  const f = validateFinding(finding);
  if (!validTime(now) || !validId(policyVersion) || !validId(authorityEpoch) ||
      !validId(environmentKey) || (worldRevision !== null && !validId(worldRevision))) fail('RECOVERY_CONTEXT_INVALID');
  const diagnosis = diagnoseRecovery(f);
  const signature = FAILURE_SIGNATURES.entries[f.code];
  const blocked = ['already_recovered','unknown'].includes(diagnosis.classification) || !signature || signature.target !== f.target.kind;
  const actionId = !blocked && signature.first ? signature.first : null;
  const action = actionId ? RECOVERY_ACTIONS[actionId] : null;
  const operations = action ? [{ actionId, owner:action.owner, existingExecutor:action.existing, level:action.level,
    target:{kind:f.target.kind,id:f.target.id}, effect:action.effect, admission:action.admission,
    preconditions:['fresh_authoritative_status','scope_and_revocation_recheck','same_world_and_policy_epoch'],
    expectedObservation: f.code === 'PHONE_PROJECTION_STALE' ? 'authoritative_world_revision_observed' :
      f.target.kind === 'control' ? 'authoritative_control_outcome_observed' : 'worker_status_observed',
    retryBudget: 0 }] : [];
  const mustEscalate = !operations.length || ['CONTROL_UNCERTAIN','SEND_OUTCOME_UNCERTAIN','GRANT_REVOKED','SCHEMA_MISMATCH'].includes(f.code);
  const body = { schema:RECOVERY_PLAN_SCHEMA, signatureVersion:FAILURE_SIGNATURES.version,
    findingId:f.id, failureCode:f.code, target:{...f.target}, createdAt:now,
    expiresAt:new Date(Date.parse(now)+5*60_000).toISOString(), policyVersion, authorityEpoch,
    worldRevision, environmentKey, classification:diagnosis.classification, evidenceRefs:diagnosis.evidenceRefs,
    operations, requiresHostAuthorization:true, grantsPermission:false, automaticEffectsAllowed:false,
    externalEffectRetryBudget:0, rollback:'none_without_separate_owner_authorized_plan',
    escalation:mustEscalate ? (!operations.length ? 'no_safe_action_proven' : 'read_only_reconciliation_then_owner_review') : null,
    safeguards:['no_provider_resend','no_lock_takeover','no_revoked_data_restore','no_unknown_effect_retry'] };
  const planDigest = hash(body);
  return Object.freeze({ ...body, planId:'rpl-'+planDigest.slice(0,24), planDigest });
}

/** High-risk proposals remain inert and are specifically rejected by the v1 reducer. */
export function proposeManualRecovery(finding, actionId, ctx) {
  const f=validateFinding(finding);
  const proposed=planRecovery(f,ctx);
  const action=RECOVERY_ACTIONS[actionId];
  if (!action || !['R2','R3'].includes(action.level) || action.targetKind!==f.target.kind ||
      !proposed.operations.length || proposed.classification==='missing_observability') fail('RECOVERY_MANUAL_PLAN_REFUSED');
  const kinds=new Set(f.evidence.map(e=>e.kind));
  if (actionId==='host.worker.lease.recover' && !(f.code==='PROCESS_ENDED' && kinds.has('lease_invalid') && kinds.has('process_exit'))) fail('RECOVERY_MANUAL_PLAN_REFUSED');
  if (actionId==='host.world.revision.undo' && !(f.code==='WORLD_REVISION_CONFLICT' && kinds.has('snapshot_verified') && kinds.has('revision_conflict') && ctx.worldRevision)) fail('RECOVERY_MANUAL_PLAN_REFUSED');
  const {planId:_id,planDigest:_digest,...base}=proposed;
  const body={...base,operations:[{actionId,owner:action.owner,existingExecutor:action.existing,level:action.level,
    target:{...f.target},effect:action.effect,admission:action.admission,
    preconditions:['fresh_authenticated_owner_approval','canonical_state_and_revocation_recheck','current_world_and_policy_epoch','verified_no_uncertain_external_effect'],
    expectedObservation:actionId==='host.world.revision.undo'?'canonical_world_revision_reconciled':'worker_lease_recovered_without_resend',retryBudget:0}],
    escalation:'owner_approval_and_existing_executor_security_review_required',automaticEffectsAllowed:false,
    requiresHostAuthorization:true,grantsPermission:false,externalEffectRetryBudget:0};
  const planDigest=hash(body);
  return Object.freeze({...body,planId:'rpl-'+planDigest.slice(0,24),planDigest});
}

export function beginRecovery(plan) {
  if (!plain(plan) || plan.schema !== RECOVERY_PLAN_SCHEMA || !Array.isArray(plan.operations) ||
      !validId(plan.planId) || plan.planDigest !== hash(Object.fromEntries(Object.entries(plan).filter(([k])=>!['planId','planDigest'].includes(k))))) fail('RECOVERY_PLAN_TAMPERED');
  return { schema:RECOVERY_HISTORY_SCHEMA, planId:plan.planId, planDigest:plan.planDigest,
    state:plan.operations.length ? 'proposed' : 'escalated', stepIndex:0, attempts:0, eventIds:[],
    receipts:[], evidenceRefs:[], reason:plan.operations.length ? null : 'no_safe_action_proven' };
}

/** Event reducer, deliberately no effects. Terminal or uncertain states never dispatch. */
export function transitionRecovery(history, plan, event) {
  if (!plain(history) || history.schema !== RECOVERY_HISTORY_SCHEMA ||
      !plain(event) || !validId(event.id) || !validTime(event.at) ||
      !['authorize','dispatch','acknowledge','verify','interrupt','escalate'].includes(event.type) ||
      history.planId !== plan.planId || history.planDigest !== plan.planDigest) fail('RECOVERY_EVENT_INVALID');
  if (history.eventIds.includes(event.id)) return history;
  if (['authorize','dispatch'].includes(event.type) && Date.parse(event.at)>Date.parse(plan.expiresAt)) fail('RECOVERY_PLAN_EXPIRED');
  if (history.eventIds.length >= 64) fail('RECOVERY_HISTORY_BOUNDED');
  const s = history.state;
  if (['verified','uncertain','escalated','failed'].includes(s)) fail('RECOVERY_TERMINAL');
  const op = plan.operations[history.stepIndex];
  const next = { ...history, eventIds:[...history.eventIds,event.id], receipts:[...history.receipts], evidenceRefs:[...history.evidenceRefs] };
  if (event.type === 'escalate') { next.state='escalated'; next.reason='owner_review'; }
  else if (event.type === 'authorize') {
    if (s !== 'proposed' || event.planDigest !== plan.planDigest || event.policyVersion !== plan.policyVersion ||
        event.authorityEpoch !== plan.authorityEpoch || event.hostAuthorizationVerified !== true) fail('RECOVERY_AUTHORIZATION_REQUIRED');
    // Validation of the authorization evidence belongs to the Host, never the model or this pure reducer.
    next.state='authorized';
  } else if (event.type === 'dispatch') {
    if (s !== 'authorized' || !op || event.actionId !== op.actionId || event.targetId !== op.target.id ||
        event.policyVersion !== plan.policyVersion || event.authorityEpoch !== plan.authorityEpoch ||
        event.hostAuthorizationVerified !== true || history.attempts >= 1) fail('RECOVERY_DISPATCH_REFUSED');
    if (op.admission !== 'existing_read_only') fail('RECOVERY_EXECUTOR_NOT_ADMITTED');
    next.state='dispatched';next.attempts++;
  } else if (event.type === 'acknowledge') {
    if (s !== 'dispatched' || !validId(event.receiptRef)) fail('RECOVERY_ACK_INVALID');
    next.state='observing'; next.receipts.push(event.receiptRef);
  } else if (event.type === 'verify') {
    if (s !== 'observing' || !validId(event.observationRef) || !validId(event.observer) ||
        !validId(event.executor) || event.observer === event.executor ||
        event.expectedObservation !== op.expectedObservation ||
        !['satisfied','not_satisfied','unknown'].includes(event.result)) fail('RECOVERY_VERIFY_INVALID');
    next.evidenceRefs.push(event.observationRef);
    if (event.result === 'satisfied') { next.state='verified'; next.reason=null; }
    else if (event.result === 'not_satisfied') { next.state='failed'; next.reason='postcondition_failed'; }
    else { next.state='uncertain'; next.reason='postcondition_unknown'; }
  } else if (event.type === 'interrupt') {
    if (!['dispatched','observing'].includes(s)) fail('RECOVERY_INTERRUPT_INVALID');
    next.state='uncertain'; next.reason='interrupted_after_dispatch_no_replay';
  }
  return next;
}

// A pure, source-linked recovery memory projection. The existing HQ index and Host
// owner-local evidence are future persistence consumers; no second state store here.
export function learnRecovery(memory = [], outcome) {
  if (!Array.isArray(memory) || memory.length > 1000 || !plain(outcome) ||
      !validId(outcome.signature) || !validId(outcome.actionId) || !RECOVERY_ACTIONS[outcome.actionId] ||
      !validId(outcome.environmentKey) || !validId(outcome.observationRef) ||
      !['verified_success','verified_failure','verified_harm'].includes(outcome.result) ||
      !Object.hasOwn(FAILURE_SIGNATURES.entries,outcome.signature) || !validId(outcome.independentObserver) ||
      !validId(outcome.executor) || outcome.independentObserver === outcome.executor) fail('RECOVERY_LEARNING_EVIDENCE_REQUIRED');
  const key = [outcome.signature,outcome.actionId,outcome.environmentKey].join('|');
  const current = memory.find(x=>x.key===key) ?? {schema:RECOVERY_MEMORY_SCHEMA,key,signature:outcome.signature,
    actionId:outcome.actionId,environmentKey:outcome.environmentKey,successes:0,failures:0,harms:0,
    evidenceRefs:[],unsafeConditions:[]};
  if (current.evidenceRefs.includes(outcome.observationRef)) return memory;
  if (current.evidenceRefs.length>=100) fail('RECOVERY_MEMORY_BOUNDED');
  const updated = { ...current,successes:current.successes+(outcome.result==='verified_success'?1:0),
    failures:current.failures+(outcome.result==='verified_failure'?1:0),
    harms:current.harms+(outcome.result==='verified_harm'?1:0),
    evidenceRefs:[...current.evidenceRefs,outcome.observationRef],
    unsafeConditions:outcome.result==='verified_harm' && validId(outcome.unsafeCondition) ?
      [...new Set([...current.unsafeConditions,outcome.unsafeCondition])].slice(0,20) : current.unsafeConditions };
  return [...memory.filter(x=>x.key!==key),updated];
}

/** Ranking NEVER changes operation registry, required authorization or admission. */
export function rankRecoveryActions(actionIds, { signature, environmentKey, memory = [] } = {}) {
  if (!Array.isArray(actionIds) || !validId(signature) || !validId(environmentKey) || !Array.isArray(memory) ||
      !actionIds.every(a=>typeof a==='string' && Object.hasOwn(RECOVERY_ACTIONS,a))) fail('RECOVERY_RANK_INVALID');
  return [...new Set(actionIds)].map(actionId=>{
    const m=memory.find(x=>x.key===[signature,actionId,environmentKey].join('|'));
    const total=m ? m.successes+m.failures+m.harms : 0;
    const score=total>=5 ? (m.successes+1)/(total+2) - 0.5*m.harms : 0;
    return {actionId, score, sampleCount:total, admission:RECOVERY_ACTIONS[actionId].admission};
  }).sort((a,b)=>b.score-a.score || a.actionId.localeCompare(b.actionId));
}

/** Phone/UI consume only metadata-safe history, not a new action endpoint. */
export function recoveryHistoryView(plan, history) {
  if (plan.planId!==history.planId || plan.planDigest!==history.planDigest) fail('RECOVERY_HISTORY_MISMATCH');
  return { schema:'vivim.recovery-history-view/1', planId:plan.planId, findingId:plan.findingId,
    state:history.state, failureCode:plan.failureCode, targetKind:plan.target.kind,
    verification:history.state==='verified'?'independently_observed':'not_verified',
    explanation:history.reason??null, requiresOwner:history.state!=='verified',
    receiptRefs:[...history.receipts], evidenceRefs:[...history.evidenceRefs],
    suggestedTierFlowStage:history.state==='verified'?'applied':history.state==='uncertain'?'uncertain':'failed' };
}
