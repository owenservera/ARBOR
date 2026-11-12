/**
 * @hq:context M3 shadow-only mission decision and revision proposal.
 * @hq:owner mission-intelligence
 * @hq:invariant No shell, agent dispatch, source writes, approvals, model calls or delivery effects.
 * @hq:invariant Requires a source-bound evaluation; AI task claims cannot become instructions.
 * @hq:invariant Replanning never silently changes the owner's objective or reuses old proof.
 */
import { createHash } from 'node:crypto';
export const SHADOW_SCHEMA = 'hq.mission-shadow/1';
export const REVISION_SCHEMA = 'hq.mission-revision-proposal/1';
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const HEX=/^[0-9a-f]{64}$/;
const STATUSES=new Set(['READY','RUNNING','WAITING_DEPENDENCY','STALE','AWAITING_VERIFICATION',
 'RECOVERY_REQUIRED','BLOCKED','VERIFIED']);
const PHASES=new Set(['plan','execute','review','verify','deliver']);
const red=(code,detail)=>({ok:false,code,detail,mode:'SHADOW'});
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)])):x;
const MAX=2048;
function assertGraph(steps){
 if(!Array.isArray(steps)||steps.length<1||steps.length>MAX)return 'INVALID_STEPS';
 const nodes=new Map();
 for(const s of steps){
  if(!s||!ID.test(s.id??'')||typeof s.title!=='string'||!s.title.trim()||
    !PHASES.has(s.phase)||!Number.isSafeInteger(s.revision)||s.revision<1||
    !Array.isArray(s.dependsOn)||s.dependsOn.length>MAX||!Array.isArray(s.requirements)||
    s.requirements.length===0||s.requirements.length>64||
    s.requirements.some(r=>!ID.test(r?.kind??'')||!ID.test(r?.source??''))||
    ![s.workOrderId,s.taskId,s.laneId].some(Boolean)||
    (s.effectClass!==undefined&&!['internal','external'].includes(s.effectClass)))return 'INVALID_STEP';
  if(nodes.has(s.id))return 'DUPLICATE_STEP';nodes.set(s.id,s);
 }
 const pending=new Set(),seen=new Set();
 function visit(id){if(pending.has(id))return 'DEPENDENCY_CYCLE';if(seen.has(id))return null;
  pending.add(id);
  for(const dep of nodes.get(id).dependsOn){if(!nodes.has(dep))return 'MISSING_DEPENDENCY';const err=visit(dep);if(err)return err;}
  pending.delete(id);seen.add(id);return null;
 }
 for(const id of nodes.keys()){const err=visit(id);if(err)return err;}
 return null;
}
function trust(m,e){
 return m?.schema==='hq.mission/1'&&ID.test(m?.id??'')&&
  Number.isSafeInteger(m.revision)&&m.revision>0&&
  e?.ok===true&&e.schema==='hq.mission-view/1'&&
  e.evaluationSchema==='hq.mission-evaluation/1'&&e.missionId===m.id&&
  e.missionRevision===m.revision&&HEX.test(e.sourceFingerprint??'')&&
  Array.isArray(e.steps)&&e.steps.length===m.steps?.length&&
  e.steps.every(x=>STATUSES.has(x.status)&&ID.test(x.id??''))&&
  new Set(e.steps.map(x=>x.id)).size===e.steps.length&&
  m.steps.every(s=>e.steps.some(x=>x.id===s.id))&&
  (!e.readyToDeliver||e.steps.every(x=>x.status==='VERIFIED'))&&
  (!e.delivered||(e.deliveryVerified===true&&e.readyToDeliver===true));
}
function criticalPath(id,steps,memo){
 if(memo.has(id))return memo.get(id);
 const dependents=steps.filter(s=>s.dependsOn.includes(id));
 const n=1+(dependents.length?Math.max(...dependents.map(s=>criticalPath(s.id,steps,memo))):0);
 memo.set(id,n);return n;
}
/**
 * Propose a *single* next action from authenticated evaluation; Host owns admission
 * and effects. 
 * @param {{mission:object,evaluation:object,now:string,capacity?:number,
 *   activeLanes?:number,remainingBudget?:number}} input
 */
export function decideMissionNext({mission,evaluation,now,capacity=1,activeLanes=0,remainingBudget=Infinity}={}){
 const nowMs=Date.parse(now??'');
 if(!Number.isFinite(nowMs)||!Number.isSafeInteger(capacity)||capacity<0||
    !Number.isSafeInteger(activeLanes)||activeLanes<0||
    (remainingBudget!==Infinity&&(!Number.isFinite(remainingBudget)||remainingBudget<0)))return red('POLICY_INVALID');
 if(!trust(mission,evaluation)||assertGraph(mission.steps))return red('EVALUATION_UNTRUSTED');
 const index=new Map(mission.steps.map((s,i)=>[s.id,i]));
 const candidates=evaluation.steps.map(v=>({...v,spec:mission.steps[index.get(v.id)]}));
 const choose=(status)=>candidates.filter(x=>x.status===status).sort((a,b)=>{
   const m=new Map(),d=criticalPath(b.id,mission.steps,m)-criticalPath(a.id,mission.steps,m);
   return d||index.get(a.id)-index.get(b.id);
 })[0];
 let action='OBSERVE',step=null,reason='mission-progress-active',requiresApproval=false;
 if(evaluation.delivered===true&&evaluation.deliveryVerified===true){action='NONE';reason='delivery-authenticated';}
 else if((step=choose('BLOCKED'))){action='ESCALATE';reason=step.reason??'source-blocked';requiresApproval=true;}
 else if((step=choose('RECOVERY_REQUIRED'))){action='PROPOSE_RECOVERY';reason='supervisor-attempt-must-be-reviewed';requiresApproval=true;}
 else if((step=choose('STALE'))){action='RECHECK';reason='observation-stale';}
 else if((step=choose('AWAITING_VERIFICATION'))){action=step.phase==='review'?'REQUEST_REVIEW':'REQUEST_VERIFICATION';reason='independent-proof-required';}
 else if(evaluation.readyToDeliver===true){action='PREPARE_DELIVERY';reason='verified-outcome-awaits-host-delivery';requiresApproval=true;}
 else if((step=choose('READY'))){
  if(activeLanes>=capacity){action='WAIT_CAPACITY';reason='admission-capacity';}
  else if(step.spec.effectClass==='external'){action='REQUEST_EFFECT_APPROVAL';reason='external-effect';requiresApproval=true;}
  else if(step.spec.effectClass!=='internal'){action='REQUEST_EFFECT_CLASSIFICATION';reason='effect-unknown';requiresApproval=true;}
  else if(!step.spec.workOrderId){action='REQUEST_WORK_ORDER_BINDING';reason='no-authored-work-order';requiresApproval=true;}
  else if(step.spec.estimatedCost===undefined){action='REQUEST_COST_ESTIMATE';reason='cost-unknown';}
  else if(!Number.isFinite(step.spec.estimatedCost)||step.spec.estimatedCost<0)return red('POLICY_INVALID');
  else if(step.spec.estimatedCost>remainingBudget){action='ESCALATE_BUDGET';reason='budget-exhausted';requiresApproval=true;}
  else {action='PREPARE_DISPATCH';reason='candidate-subject-to-supervisor-admission';}
 }
 else if((step=choose('RUNNING'))){action='OBSERVE';reason='running-observed';}
 else if((step=choose('WAITING_DEPENDENCY'))){action='WAIT_DEPENDENCY';reason='dependency-incomplete';}
 const complete=candidates.filter(x=>x.status==='VERIFIED').length;
 const next={schema:SHADOW_SCHEMA,ok:true,mode:'SHADOW',missionId:mission.id,missionRevision:mission.revision,
  sourceFingerprint:evaluation.sourceFingerprint,at:new Date(nowMs).toISOString(),
  action,reason,stepId:step?.id??null,workOrderId:step?.spec?.workOrderId??null,
  taskId:step?.spec?.taskId??null,laneId:step?.spec?.laneId??null,
  idempotencyKey:step?`${mission.id}:${step.id}:${step.spec.revision}`:null,
  requiresApproval,progress:{verified:complete,total:candidates.length},
  canExecute:false,limitations:['SHADOW_ONLY','HOST_OWNS_AUTHORITY','NO_PROVIDER_CALLS']};
 return next;
}
/**
 * Pure compare-and-swap *proposal* — never modifies mission or proof ledger.
 * Any revision invalidates previous mission-bound proofs, even for unchanged steps.
 */
export function proposeMissionRevision({mission,expectedRevision,steps,reason}={}){
 if(mission?.schema!=='hq.mission/1'||!ID.test(mission.id??'')||
    !Number.isSafeInteger(mission.revision)||mission.revision<1)return red('MISSION_INVALID');
 if(expectedRevision!==mission.revision)return red('REVISION_CONFLICT');
 if(typeof reason!=='string'||!reason.trim()||reason.length>1000)return red('REASON_REQUIRED');
 const problem=assertGraph(steps);
 if(problem)return red(problem);
 const old=new Map(mission.steps.map(s=>[s.id,s]));
 const updated=steps.map(s=>{
  const prior=old.get(s.id);
  if(!prior)return {...structuredClone(s),revision:1};
  const {revision:_,...oldFields}=prior,{revision:__,...newFields}=s;
  const identical=sha(canonical(oldFields))===sha(canonical(newFields));
  return {...structuredClone(s),revision:identical?prior.revision:prior.revision+1};
 });
 const changed=updated.filter(s=>!old.has(s.id)||s.revision!==old.get(s.id).revision).map(s=>s.id);
 const removed=[...old.keys()].filter(id=>!updated.some(s=>s.id===id));
 const next={...structuredClone(mission),revision:mission.revision+1,steps:updated};
 return {ok:true,schema:REVISION_SCHEMA,mode:'SHADOW',missionId:mission.id,
  expectedRevision:mission.revision,proposedRevision:next.revision,
  reason:reason.trim(),proposal:next,changedStepIds:changed,removedStepIds:removed,
  invalidatedProofStepIds:[...new Set([...old.keys(),...updated.map(s=>s.id)])],
  requiresApproval:true,canCommit:false,
  limitations:['CAS_MUST_BE_ENFORCED_BY_HOST','ALL_PRIOR_MISSION_PROOFS_INVALIDATED','NO_EFFECT_AUTHORITY']};
}
