// DCB v2 background maintenance reducer, designed to be invoked by an EXISTING
// Host event loop. No scheduler, timer, I/O, separate journal, browser or provider
// effects. Host persists each new state using its canonical CAS store and supplies
// monotonically sequenced events from its authenticated event source.
import { createHash } from 'node:crypto';
import { planDcbInvalidations } from './dcb-invalidation.mjs';

export const DCB_MAINTENANCE_SCHEMA='vivim.dcb-maintenance-state/1';
export const DCB_MAINTENANCE_EVENT_SCHEMA='vivim.dcb-maintenance-event/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const SHA=/^[a-f0-9]{64}$/;
const STATES=new Set(['queued','claimed','prepared','blocked','failed']);
const KINDS=new Set(['change','tick','job.claim','job.prepared','job.failed']);
const fail=(code,msg)=>Object.assign(new Error(msg),{code});
const checkRef=(x,name)=>{if(typeof x!=='string'||!REF.test(x))throw fail('DCB_MAINTENANCE_REF','Invalid '+name);return x};
const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const sorted=x=>[...new Set(x)].sort();
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?
  Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const MAX_JOBS=500;
function checkState(state) {
  if(!state||state.schema!==DCB_MAINTENANCE_SCHEMA
    ||!Number.isSafeInteger(state.revision)||state.revision<1
    ||!Number.isSafeInteger(state.cursor?.sequence)||state.cursor.sequence<0
    ||(state.cursor.sequence>0&&!SHA.test(state.cursor.digest??''))
    ||!Array.isArray(state.jobs)||state.jobs.length>MAX_JOBS||!iso(state.updatedAt))
    throw fail('DCB_MAINTENANCE_STATE','Invalid maintenance state');
  const seen=new Set();
  for(const job of state.jobs){
    if(!job||!REF.test(job.bundleId)||seen.has(job.bundleId)
      ||!STATES.has(job.status)||!Number.isSafeInteger(job.definitionRevision)
      ||job.definitionRevision<1||!Number.isSafeInteger(job.attempts)||job.attempts<0
      ||job.attempts>3||!Array.isArray(job.reasons)
      ||job.reasons.length>30||job.reasons.some(x=>typeof x!=='string'||!REF.test(x))
      ||(job.status==='claimed'&&!REF.test(job.leaseRef??'')))
      throw fail('DCB_MAINTENANCE_STATE','Invalid queued job');
    seen.add(job.bundleId);
  }
  return state;
}
export function createDcbMaintenanceState({at}={}) {
  if(!iso(at))throw fail('DCB_MAINTENANCE_TIME','Pinned UTC time required');
  return {schema:DCB_MAINTENANCE_SCHEMA,revision:1,
    cursor:{sequence:0,digest:null},jobs:[],updatedAt:at};
}
function validEvent(event) {
  if(!event||event.schema!==DCB_MAINTENANCE_EVENT_SCHEMA||!KINDS.has(event.kind)
    ||!Number.isSafeInteger(event.sequence)||event.sequence<1||!iso(event.at))
    throw fail('DCB_MAINTENANCE_EVENT','Invalid sequenced Host event');
  const names=['changedSourceRefs','revokedSourceRefs','changedBundleIds','revokedBundleIds'];
  if(event.kind==='change')for(const name of names){
    const items=event[name]??[];
    if(!Array.isArray(items)||items.length>500)throw fail('DCB_MAINTENANCE_EVENT','Invalid change refs');
    for(const item of items)checkRef(item,name);
  }
  if(event.kind.startsWith('job.')){
    checkRef(event.bundleId,'bundleId');
    checkRef(event.leaseRef,'leaseRef');
  }
  if(event.kind==='job.claim'){
    if(!Number.isSafeInteger(event.expectedDefinitionRevision)||event.expectedDefinitionRevision<1)
      throw fail('DCB_MAINTENANCE_EVENT','Expected definition revision required');
  }
  if(event.kind==='job.prepared'){
    if(!SHA.test(event.materializationDigest??'')||!REF.test(event.proofRef??''))
      throw fail('DCB_MAINTENANCE_EVENT','Materialization receipt digest/ID required');
  }
  if(event.kind==='job.failed'&&!['source_unavailable','stale_revision','hash_mismatch',
    'over_budget','permission_revoked','unknown_error'].includes(event.reason))
    throw fail('DCB_MAINTENANCE_EVENT','Unknown failure category');
  return event;
}
function jobIndex(jobs,id){return jobs.findIndex(j=>j.bundleId===id)}
function touch(jobs,row){
  let ix=jobIndex(jobs,row.bundleId);
  if(ix<0){
    if(jobs.length>=MAX_JOBS)throw fail('DCB_MAINTENANCE_FULL','Backpressure: queue full');
    jobs.push({...row,status:row.status==='stale'?'queued':row.status,reasons:sorted(row.reasons),attempts:0,leaseRef:null,
      materializationDigest:null,proofRef:null});
    return;
  }
  const prev=jobs[ix];
  // Invalidation supersedes claims of prepared work and closes stale leases.
  // A globally blocked item is not silently unblocked by a source-change event.
  const status=prev.status==='blocked'||row.status==='blocked'?'blocked':'queued';
  jobs[ix]={...prev,status,definitionRevision:row.definitionRevision,
    reasons:sorted([...prev.reasons,...row.reasons]),attempts:0,
    leaseRef:null,materializationDigest:null,proofRef:null};
}
export function reduceDcbMaintenance(state,event,{definitionStore}={}) {
  checkState(state);validEvent(event);
  if(event.at<state.updatedAt)throw fail('DCB_MAINTENANCE_TIME','Out-of-order observation time');
  const eventDigest=digest(event);
  if(event.sequence===state.cursor.sequence){
    if(eventDigest===state.cursor.digest)return state;
    throw fail('DCB_MAINTENANCE_REPLAY','Conflicting same-sequence event');
  }
  if(event.sequence!==state.cursor.sequence+1)
    throw fail('DCB_MAINTENANCE_GAP','Missing Host journal event');
  const jobs=state.jobs.map(x=>({...x,reasons:[...x.reasons]}));
  if(event.kind==='change'||event.kind==='tick'){
    const plan=planDcbInvalidations({
      definitionStore,at:event.at,limit:MAX_JOBS,
      changedSourceRefs:event.changedSourceRefs??[],
      revokedSourceRefs:event.revokedSourceRefs??[],
      changedBundleIds:event.changedBundleIds??[],
      revokedBundleIds:event.revokedBundleIds??[],
    });
    for(const row of plan.jobs)touch(jobs,row);
  } else {
    const ix=jobIndex(jobs,event.bundleId);
    if(ix<0)throw fail('DCB_MAINTENANCE_MISSING','Unknown work item');
    const job=jobs[ix];
    if(event.kind==='job.claim'){
      if(job.status!=='queued'||job.definitionRevision!==event.expectedDefinitionRevision)
        throw fail('DCB_MAINTENANCE_CONFLICT','Claim stale or item not queued');
      if(job.attempts>=3)throw fail('DCB_MAINTENANCE_ATTEMPTS','Retry cap exhausted');
      job.status='claimed';job.leaseRef=event.leaseRef;job.attempts++;
    } else {
      if(job.status!=='claimed'||job.leaseRef!==event.leaseRef)
        throw fail('DCB_MAINTENANCE_CONFLICT','Lease or status changed');
      if(event.kind==='job.prepared'){
        job.status='prepared';job.materializationDigest=event.materializationDigest;
        job.proofRef=event.proofRef;job.leaseRef=null;
      } else {
        job.reasons=sorted([...job.reasons,event.reason]);
        job.status=event.reason==='permission_revoked'?'blocked':
          job.attempts>=3?'failed':'queued';
        job.leaseRef=null;job.materializationDigest=null;job.proofRef=null;
      }
    }
  }
  jobs.sort((a,b)=>a.bundleId.localeCompare(b.bundleId));
  return {schema:DCB_MAINTENANCE_SCHEMA,revision:state.revision+1,
    cursor:{sequence:event.sequence,digest:eventDigest},
    jobs,updatedAt:event.at};
}
export function recoverDcbMaintenance(state,{at}={}) {
  checkState(state);
  if(!iso(at)||at<state.updatedAt)throw fail('DCB_MAINTENANCE_TIME','Invalid recovery time');
  // Never replay provider sends; this only resets local computation claims.
  let changed=false;
  const jobs=state.jobs.map(row=>{
    if(row.status!=='claimed')return {...row,reasons:[...row.reasons]};
    changed=true;
    return {...row,status:row.attempts>=3?'failed':'queued',
      leaseRef:null,materializationDigest:null,proofRef:null,
      reasons:sorted([...row.reasons,'recovered_local_computation'])};
  });
  return changed?{...state,revision:state.revision+1,jobs,updatedAt:at}:state;
}
export function pendingDcbMaintenance(state,{limit=20}={}) {
  checkState(state);
  if(!Number.isSafeInteger(limit)||limit<1||limit>100)
    throw fail('DCB_MAINTENANCE_LIMIT','Invalid worker batch');
  // A worker may compute these read-only projections, but must still claim each
  // job through the Host-owned CAS/journal before committing a receipt.
  return {schema:'vivim.dcb-maintenance-pending/1',
    jobs:state.jobs.filter(j=>j.status==='queued').slice(0,limit).map(j=>({
      bundleId:j.bundleId,definitionRevision:j.definitionRevision,reasons:[...j.reasons],
    })),authority:'local_computation_only',isSendAuthorized:false};
}
