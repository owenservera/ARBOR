import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createDcbMaintenanceState,reduceDcbMaintenance,recoverDcbMaintenance,
  pendingDcbMaintenance,DCB_MAINTENANCE_EVENT_SCHEMA,
} from '../../src/context/dcb-maintenance.mjs';
const AT='2026-11-10T06:00:00.000Z', LATER='2026-11-10T06:01:00.000Z';
const SHA=createHash('sha256').update('verified local projection').digest('hex');
const defs=[
  {id:'dcb:a',revision:1,status:'active',sourceRefs:['source:one'],parentRefs:[],expiresAt:null},
  {id:'dcb:b',revision:1,status:'active',sourceRefs:['source:two'],parentRefs:[],expiresAt:null},
  {id:'dcb:ab',revision:1,status:'active',sourceRefs:[],parentRefs:['dcb:a','dcb:b'],expiresAt:null},
];
const definitionStore={list:()=>({items:defs,truncated:false})};
const E=(sequence,kind,extra={})=>({schema:DCB_MAINTENANCE_EVENT_SCHEMA,sequence,kind,at:AT,...extra});
const initial=()=>createDcbMaintenanceState({at:AT});
const reduce=(state,event)=>reduceDcbMaintenance(state,event,{definitionStore});
test('source change enqueues a bundle and all dependent composite projections',()=>{
  const state=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  assert.deepEqual(state.jobs.map(j=>[j.bundleId,j.status]),
    [['dcb:a','queued'],['dcb:ab','queued']]);
  assert.deepEqual(pendingDcbMaintenance(state).jobs.map(j=>j.bundleId),['dcb:a','dcb:ab']);
  assert.equal(pendingDcbMaintenance(state).isSendAuthorized,false);
});
test('identical replay is idempotent, divergent or missing sequence fails closed',()=>{
  const event=E(1,'change',{changedSourceRefs:['source:one']});
  const state=reduce(initial(),event);
  assert.strictEqual(reduce(state,event),state);
  assert.throws(()=>reduce(state,E(1,'change',{changedSourceRefs:['source:two']})),
    {code:'DCB_MAINTENANCE_REPLAY'});
  assert.throws(()=>reduce(state,E(3,'tick')),{code:'DCB_MAINTENANCE_GAP'});
});
test('claim + verified prepared metadata transitions but never authorizes sending',()=>{
  const first=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  const claimed=reduce(first,E(2,'job.claim',{bundleId:'dcb:a',
    leaseRef:'lease:one',expectedDefinitionRevision:1}));
  assert.equal(claimed.jobs.find(j=>j.bundleId==='dcb:a').status,'claimed');
  const prepared=reduce(claimed,E(3,'job.prepared',{bundleId:'dcb:a',leaseRef:'lease:one',
    materializationDigest:SHA,proofRef:'receipt:one'}));
  assert.equal(prepared.jobs.find(j=>j.bundleId==='dcb:a').status,'prepared');
  assert.ok(!Object.hasOwn(prepared,'sendAuthorized'));
  assert.deepEqual(pendingDcbMaintenance(prepared).jobs.map(j=>j.bundleId),['dcb:ab']);
});
test('revocation overrides a prior local preparation and propagates blockage',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  s=reduce(s,E(2,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:one',expectedDefinitionRevision:1}));
  s=reduce(s,E(3,'job.prepared',{bundleId:'dcb:a',leaseRef:'lease:one',
    materializationDigest:SHA,proofRef:'receipt:one'}));
  s=reduce(s,E(4,'change',{revokedSourceRefs:['source:one']}));
  assert.deepEqual(s.jobs.map(j=>j.status),['blocked','blocked']);
  assert.equal(s.jobs[0].materializationDigest,null);
});
test('restart recovers local compute lease without replaying provider actions',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  s=reduce(s,E(2,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:one',expectedDefinitionRevision:1}));
  const next=recoverDcbMaintenance(s,{at:LATER});
  assert.equal(next.jobs.find(j=>j.bundleId==='dcb:a').status,'queued');
  assert.equal(next.jobs.find(j=>j.bundleId==='dcb:a').leaseRef,null);
  assert.equal(next.cursor.sequence,2);
});
test('permission failure blocks and repeated pure computation failures stop at three',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  for(let i=0;i<3;i++){
    const lease='lease:'+i;
    s=reduce(s,E(2+i*2,'job.claim',{bundleId:'dcb:a',leaseRef:lease,expectedDefinitionRevision:1}));
    s=reduce(s,E(3+i*2,'job.failed',{bundleId:'dcb:a',leaseRef:lease,reason:'source_unavailable'}));
  }
  assert.equal(s.jobs.find(j=>j.bundleId==='dcb:a').status,'failed');
  assert.throws(()=>reduce(s,E(8,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:new',
    expectedDefinitionRevision:1})),{code:'DCB_MAINTENANCE_CONFLICT'});
});
test('stale lease cannot mark previously invalidated bundle prepared',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  s=reduce(s,E(2,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:one',expectedDefinitionRevision:1}));
  s=reduce(s,E(3,'change',{changedBundleIds:['dcb:a']}));
  assert.throws(()=>reduce(s,E(4,'job.prepared',{bundleId:'dcb:a',
    leaseRef:'lease:one',materializationDigest:SHA,proofRef:'receipt:one'})),
    {code:'DCB_MAINTENANCE_CONFLICT'});
});
test('invalid observation time or untrusted event format fails closed',()=>{
  const s=initial();
  assert.throws(()=>reduce(s,{kind:'tick',sequence:1,at:AT}),
    {code:'DCB_MAINTENANCE_EVENT'});
  assert.throws(()=>reduce(s,E(1,'tick',{at:'2026-01-01T00:00:00.000Z'})),
    {code:'DCB_MAINTENANCE_TIME'});
});
