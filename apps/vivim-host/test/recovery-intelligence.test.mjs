import test from 'node:test';
import assert from 'node:assert/strict';
import { FAILURE_SIGNATURES, RECOVERY_ACTIONS, validateFinding, diagnoseRecovery,
  planRecovery, proposeManualRecovery, beginRecovery, transitionRecovery, learnRecovery, rankRecoveryActions,
  recoveryHistoryView } from '../recovery/intelligence.mjs';

const AT='2026-11-10T05:00:00.000Z';
const ctx={ now:AT, policyVersion:'policy-3', authorityEpoch:'epoch-27', worldRevision:'world-rev-10',environmentKey:'android15-host-v1' };
let count=0;
function finding(code, kind, evidenceKinds=[], other={}) {
  return {schema:'vivim.diagnostic-finding/1',id:`finding-${++count}`,code,severity:'medium',confidence:.95,
    target:{kind,id:kind==='worker'?'relay':kind==='control'?'ctl-abc':'world-1'},observedAt:AT,
    evidence:evidenceKinds.map((k,i)=>({ref:`evidence-${count}-${i}`,kind:k,at:AT})),...other};
}
function event(type, more={}) {return {id:`event-${++count}`,type,at:AT,...more};}
function confirmed(code,kind,kindEvidence){return finding(code,kind,[kindEvidence]);}
const auth=(plan)=>event('authorize',{planDigest:plan.planDigest,policyVersion:plan.policyVersion,authorityEpoch:plan.authorityEpoch,hostAuthorizationVerified:true});
const dispatch=(plan)=>event('dispatch',{actionId:plan.operations[0].actionId,targetId:plan.target.id,policyVersion:plan.policyVersion,authorityEpoch:plan.authorityEpoch,hostAuthorizationVerified:true});

test('action metadata points to known existing owners, without executable function handles',()=>{
  assert.equal(RECOVERY_ACTIONS['host.worker.lease.recover'].admission,'blocked_pending_route_authorization_proof');
  assert.equal(RECOVERY_ACTIONS['host.world.revision.undo'].level,'R3');
  assert.equal(typeof RECOVERY_ACTIONS['host.worker.lease.recover'].existing,'string');
  assert.equal(Object.values(RECOVERY_ACTIONS).every(x=>!('run' in x || 'execute' in x)) ,true);
  assert.equal(FAILURE_SIGNATURES.version,1);
});

test('source-linked stale heartbeat yields R0 inspect and never a restart',()=>{
  const f=confirmed('HEARTBEAT_STALE','worker','stale_heartbeat');
  const d=diagnoseRecovery(f);
  assert.equal(d.classification,'confirmed_failure_signal');
  const p=planRecovery(f,ctx);
  assert.equal(p.operations[0].actionId,'host.worker.lease.inspect');
  assert.equal(p.operations[0].level,'R0');
  assert.equal(p.operations[0].retryBudget,0);
  assert.equal(p.automaticEffectsAllowed,false);
  assert.equal(p.externalEffectRetryBudget,0);
  assert.equal(p.grantsPermission,false);
});

test('same finding and context create exact same plan digest and identity',()=>{
  const f=confirmed('WORKER_CYCLE_FAILED','worker','worker_cycle_error');
  assert.deepEqual(planRecovery(f,ctx),planRecovery(f,ctx));
  const p=planRecovery(f,ctx);
  assert.match(p.planDigest,/^[0-9a-f]{64}$/);
  assert.equal(p.planId,'rpl-'+p.planDigest.slice(0,24));
});

test('unknown, target-mismatched and no-evidence findings fail closed',()=>{
  const unknown=planRecovery(finding('BRAND_NEW_FAILURE','worker',['stale_heartbeat']),ctx);
  assert.equal(unknown.operations.length,0);
  assert.equal(unknown.escalation,'no_safe_action_proven');
  const mismatch=planRecovery(finding('HEARTBEAT_STALE','world',['stale_heartbeat']),ctx);
  assert.equal(mismatch.operations.length,0);
  const absent=diagnoseRecovery(finding('HEARTBEAT_STALE','worker',[]));
  assert.equal(absent.classification,'missing_observability');
  assert.equal(absent.hypotheses[0].confidence,0);
});

test('provider-send uncertainty permits status inspection but no replay',()=>{
  const p=planRecovery(confirmed('SEND_OUTCOME_UNCERTAIN','control','send_outcome_uncertain'),ctx);
  assert.deepEqual(p.operations.map(o=>o.actionId),['host.control.outcome.inspect']);
  assert.match(p.escalation,/owner_review/);
  assert.ok(p.safeguards.includes('no_provider_resend'));
  assert.equal(p.externalEffectRetryBudget,0);
});

test('revoked permission never restores cached data or proposes effects',()=>{
  const f=confirmed('GRANT_REVOKED','world','grant_revocation');
  const p=planRecovery(f,ctx);
  assert.equal(p.operations.length,0);
  assert.equal(p.classification,'confirmed_state_not_effect_outcome');
  assert.equal(beginRecovery(p).state,'escalated');
  assert.ok(p.safeguards.includes('no_revoked_data_restore'));
});

test('stale phone projection first inspects authoritative World (no blind cache reset)',()=>{
  const p=planRecovery(confirmed('PHONE_PROJECTION_STALE','world','revision_gap'),ctx);
  assert.equal(p.operations[0].expectedObservation,'authoritative_world_revision_observed');
  assert.equal(p.operations[0].effect,'read');
  assert.equal(p.worldRevision,'world-rev-10');
});

test('a healthy authoritative observation can mark a failure already recovered',()=>{
  const f=finding('HEARTBEAT_STALE','worker',['stale_heartbeat','authoritative_healthy']);
  f.evidence[1].at='2026-11-10T05:01:00.000Z';
  assert.equal(diagnoseRecovery(f).classification,'already_recovered');
  assert.equal(planRecovery(f,ctx).operations.length,0);
});

test('unbounded or unsafe inputs are rejected rather than accidentally echoed',()=>{
  const f=finding('HEARTBEAT_STALE','worker',['stale_heartbeat']);
  assert.throws(()=>validateFinding({...f,evidence:[{...f.evidence[0],secret:'password'}]}),/RECOVERY_FINDING_INVALID/);
  assert.throws(()=>planRecovery(f,{...ctx,authorityEpoch:'bad epoch with spaces'}),/RECOVERY_CONTEXT_INVALID/);
  assert.throws(()=>planRecovery(f,{...ctx,now:'yesterday'}),/RECOVERY_CONTEXT_INVALID/);
});

test('acknowledgement is not verified success; independent observation required',()=>{
  const p=planRecovery(confirmed('HEARTBEAT_STALE','worker','stale_heartbeat'),ctx);
  let h=beginRecovery(p);
  assert.equal(h.state,'proposed');
  assert.throws(()=>transitionRecovery(h,p,dispatch(p)),/RECOVERY_DISPATCH_REFUSED/);
  assert.throws(()=>transitionRecovery(h,p,event('authorize',{planDigest:p.planDigest,policyVersion:p.policyVersion,authorityEpoch:p.authorityEpoch})),/RECOVERY_AUTHORIZATION_REQUIRED/);
  h=transitionRecovery(h,p,auth(p));
  h=transitionRecovery(h,p,dispatch(p));
  assert.equal(h.state,'dispatched');
  h=transitionRecovery(h,p,event('acknowledge',{receiptRef:'receipt-1'}));
  assert.equal(h.state,'observing');
  assert.equal(recoveryHistoryView(p,h).verification,'not_verified');
  assert.throws(()=>transitionRecovery(h,p,event('verify',{observer:'owner1',executor:'owner1',observationRef:'obs-1',expectedObservation:p.operations[0].expectedObservation,result:'satisfied'})),/RECOVERY_VERIFY_INVALID/);
  h=transitionRecovery(h,p,event('verify',{observer:'independent-probe',executor:'host-owner',observationRef:'obs-1',expectedObservation:p.operations[0].expectedObservation,result:'satisfied'}));
  assert.equal(h.state,'verified');
  assert.equal(recoveryHistoryView(p,h).verification,'independently_observed');
  assert.throws(()=>transitionRecovery(h,p,event('dispatch')),/RECOVERY_TERMINAL/);
});

test('policy epochs and target identities cannot silently drift at dispatch',()=>{
  const p=planRecovery(confirmed('HEARTBEAT_STALE','worker','stale_heartbeat'),ctx);
  const h=transitionRecovery(beginRecovery(p),p,auth(p));
  assert.throws(()=>transitionRecovery(h,p,{...dispatch(p),authorityEpoch:'epoch-revoked'}),/RECOVERY_DISPATCH_REFUSED/);
  assert.throws(()=>transitionRecovery(h,p,{...dispatch(p),targetId:'other-worker'}),/RECOVERY_DISPATCH_REFUSED/);
});

test('interrupted operation is uncertain and can never be replayed',()=>{
  const p=planRecovery(confirmed('PROCESS_ENDED','worker','process_exit'),ctx);
  let h=transitionRecovery(beginRecovery(p),p,auth(p));
  h=transitionRecovery(h,p,dispatch(p));
  h=transitionRecovery(h,p,event('interrupt'));
  assert.equal(h.state,'uncertain');
  assert.equal(h.attempts,1);
  assert.throws(()=>transitionRecovery(h,p,dispatch(p)),/RECOVERY_TERMINAL/);
});

test('negative and unavailable verification never count as recovery',()=>{
  for(const result of ['not_satisfied','unknown']) {
    const p=planRecovery(confirmed('HEARTBEAT_STALE','worker','stale_heartbeat'),ctx);
    let h=transitionRecovery(beginRecovery(p),p,auth(p));
    h=transitionRecovery(h,p,dispatch(p));
    h=transitionRecovery(h,p,event('acknowledge',{receiptRef:'receipt-2'}));
    h=transitionRecovery(h,p,event('verify',{observer:'probe',executor:'host',observationRef:`evidence-${++count}`,expectedObservation:p.operations[0].expectedObservation,result}));
    assert.equal(h.state,result==='unknown'?'uncertain':'failed');
    assert.equal(recoveryHistoryView(p,h).verification,'not_verified');
  }
});

test('event IDs are idempotent and tampered plans are refused',()=>{
  const p=planRecovery(confirmed('HEARTBEAT_STALE','worker','stale_heartbeat'),ctx);
  const e=auth(p);const h=transitionRecovery(beginRecovery(p),p,e);
  assert.equal(transitionRecovery(h,p,e),h);
  assert.throws(()=>beginRecovery({...p,automaticEffectsAllowed:true}),/RECOVERY_PLAN_TAMPERED/);
});

test('read-path does not allow unsafe R2 action dispatch via forged action ID',()=>{
  const p=planRecovery(confirmed('WORKER_CYCLE_FAILED','worker','worker_cycle_error'),ctx);
  const h=transitionRecovery(beginRecovery(p),p,auth(p));
  assert.throws(()=>transitionRecovery(h,p,event('dispatch',{...dispatch(p),actionId:'host.worker.lease.recover'})),/RECOVERY_DISPATCH_REFUSED/);
});

test('only independently evidenced outcomes grow memory; duplicates do not',()=>{
  const evidence={signature:'HEARTBEAT_STALE',actionId:'host.worker.lease.inspect',environmentKey:'android15',
    observationRef:'observation-1',independentObserver:'qa-probe',executor:'host',result:'verified_success'};
  const first=learnRecovery([],evidence);
  assert.equal(first[0].successes,1);
  assert.deepEqual(learnRecovery(first,evidence),first);
  assert.throws(()=>learnRecovery([],{...evidence,independentObserver:'host'}),/RECOVERY_LEARNING_EVIDENCE_REQUIRED/);
  assert.throws(()=>learnRecovery([],{...evidence,result:'acknowledged'}),/RECOVERY_LEARNING_EVIDENCE_REQUIRED/);
});

test('harmful memory downranks but never expands the authorized action set',()=>{
  let memory=[];
  const base={signature:'HEARTBEAT_STALE',environmentKey:'android15',independentObserver:'qa',executor:'host'};
  for(let i=0;i<6;i++) memory=learnRecovery(memory,{...base,actionId:'host.worker.lease.inspect',observationRef:`harm-${i}`,result:'verified_harm',unsafeCondition:'active_lease'});
  const ranked=rankRecoveryActions(['host.worker.lease.inspect','host.worker.heartbeat.inspect'],{signature:'HEARTBEAT_STALE',environmentKey:'android15',memory});
  assert.equal(ranked[0].actionId,'host.worker.heartbeat.inspect');
  assert.equal(ranked[1].sampleCount,6);
  assert.ok(ranked[1].score<0);
  assert.ok(memory[0].unsafeConditions.includes('active_lease'));
  assert.equal(ranked.every(x=>RECOVERY_ACTIONS[x.actionId].level==='R0'),true);
});


test('healthy evidence before failure cannot falsely close the incident',()=>{
  const f=finding('HEARTBEAT_STALE','worker',['authoritative_healthy','stale_heartbeat']);
  f.evidence[0].at='2026-11-10T04:59:00.000Z';
  assert.notEqual(diagnoseRecovery(f).classification,'already_recovered');
});

test('R2 lease repair can only be proposed with two pieces of evidence, never dispatched by v1',()=>{
  const f=finding('PROCESS_ENDED','worker',['process_exit','lease_invalid']);
  const p=proposeManualRecovery(f,'host.worker.lease.recover',ctx);
  assert.equal(p.operations[0].level,'R2');
  assert.equal(p.operations[0].retryBudget,0);
  assert.equal(p.automaticEffectsAllowed,false);
  const h=transitionRecovery(beginRecovery(p),p,auth(p));
  assert.throws(()=>transitionRecovery(h,p,dispatch(p)),/RECOVERY_EXECUTOR_NOT_ADMITTED/);
  assert.throws(()=>proposeManualRecovery(finding('PROCESS_ENDED','worker',['process_exit']),'host.worker.lease.recover',ctx),/RECOVERY_MANUAL_PLAN_REFUSED/);
});

test('R3 owner rollback proposal demands snapshot evidence and exact World revision',()=>{
  const f=finding('WORLD_REVISION_CONFLICT','world',['revision_conflict','snapshot_verified']);
  const p=proposeManualRecovery(f,'host.world.revision.undo',ctx);
  assert.equal(p.operations[0].level,'R3');
  assert.equal(p.rollback,'none_without_separate_owner_authorized_plan');
  assert.throws(()=>proposeManualRecovery(f,'host.world.revision.undo',{...ctx,worldRevision:null}),/RECOVERY_MANUAL_PLAN_REFUSED/);
  assert.throws(()=>transitionRecovery(transitionRecovery(beginRecovery(p),p,auth(p)),p,dispatch(p)),/RECOVERY_EXECUTOR_NOT_ADMITTED/);
});

test('authorization after the fixed plan TTL is rejected',()=>{
  const p=planRecovery(confirmed('HEARTBEAT_STALE','worker','stale_heartbeat'),ctx);
  const tooLate={...auth(p),at:'2026-11-10T05:05:01.000Z'};
  assert.throws(()=>transitionRecovery(beginRecovery(p),p,tooLate),/RECOVERY_PLAN_EXPIRED/);
});

test('network disconnect and schema mismatch select observation and escalation, not blind mutation',()=>{
  const network=planRecovery(confirmed('HOST_TRANSPORT_DISCONNECTED','worker','transport_disconnected'),ctx);
  assert.equal(network.operations[0].effect,'read');
  assert.equal(network.externalEffectRetryBudget,0);
  const schema=planRecovery(confirmed('SCHEMA_MISMATCH','world','schema_mismatch'),ctx);
  assert.equal(schema.operations[0].actionId,'host.world.projection.inspect');
  assert.equal(schema.escalation,'read_only_reconciliation_then_owner_review');
});
