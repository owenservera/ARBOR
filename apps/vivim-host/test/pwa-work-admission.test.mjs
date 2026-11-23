// Source-backed PY-001 contract tests; no server, browser, provider, phone,
// Host effect, external Work writer or second persistence store is started.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPwaWorkAdmission, WORK_ADMISSION_SCHEMA, WORK_REQUEST_SCHEMA }
  from '../control/pwa-work-admission.mjs';
import { createWork } from '../../../studio/src/agents/personal-agent-work.mjs';

const TIME=Date.parse('2026-11-23T21:00:00.000Z');
const HASH='a'.repeat(64);
const request=(extra={})=>({
  schema:WORK_REQUEST_SCHEMA,action:'submit-work',
  title:'Build my personal Wiki',
  objective:'Prepare a page and ask me before publishing',
  idempotencyKey:'pwa-build:owner:r003',expectedWorkVersion:1,
  expectedEpoch:'host-epoch-1',expectedRevision:4,
  expectedRegionRevision:2,expectedRegionDigest:HASH,...extra
});
const snapshot=(extra={})=>({
  schema:'vivim.host-live-system/1',state:'source-backed',
  authority:'read-only-projection',executionAuthorized:false,
  effectPerformed:false,epoch:'host-epoch-1',revision:4,
  regions:[{id:'pwa.view',kind:'view',exposure:'owner',
    digest:HASH,viewRevision:2,sourceRevision:2,freshness:'current'}],
  ...extra
});
const raises=(promise,code)=>assert.rejects(promise,{code});
function setup(config={}){
  const events={reads:0,reviews:[],writes:[]};
  let state={work:[]},version=1;
  const review=async args=>{
    events.reviews.push(args);
    return {schema:'vivim.host-reviewed-work-action/1',
      actionId:'personal.work.create',state:'reviewed',effectOwner:'host',
      userConfirmed:true,actorId:'device-1',grantId:'grant-1',
      requestDigest:args.requestDigest,sourceEpoch:'host-epoch-1',
      sourceRevision:4,expiresAt:new Date(TIME+10000).toISOString(),
      ...config.approval};
  };
  const read=async()=>{
    events.reads++;
    return config.snapshots?.[events.reads-1]??snapshot();
  };
  const write=async (w,auth)=>{
    events.writes.push({w,auth});
    if(config.writerError)throw Object.assign(Error(config.writerError),{code:config.writerError});
    const next=createWork(state,{...w,now:'2026-11-23T21:00:00.000Z'});
    if(next.changed&&w.expectedVersion!==version)
      throw Object.assign(Error('CAS'),{code:'PERSONAL_AGENT_VERSION_CONFLICT'});
    if(next.changed){state=next.state;version++;}
    return {item:next.item,version,replayed:!next.changed,...config.result};
  };
  const admission=createPwaWorkAdmission({
    readHostSnapshot:config.read??read,
    reviewHostAction:config.review??review,
    writeExistingWork:config.write??write,clock:()=>TIME});
  return {admission,events,work:()=>state.work,version:()=>version};
}

test('no Host reviewer, source observer or existing Work CAS means no admission',()=>{
  assert.throws(()=>createPwaWorkAdmission(),{code:'WORK_AUTHORITY_NOT_WIRED'});
  assert.throws(()=>createPwaWorkAdmission({readHostSnapshot:()=>snapshot()}),
    {code:'WORK_AUTHORITY_NOT_WIRED'});
});
test('typing, preview, malformed and forged client authority fields cannot write',async()=>{
  const x=setup();
  for(const patch of [
    {action:'draft'}, {action:'preview'}, {approved:true}, {grantId:'forged'},
    {actorId:'owner'},{provider:'chatgpt'},{title:' '},{objective:''},
    {objective:'contains\nnewline'}, {expectedWorkVersion:0},
    {idempotencyKey:'bad key with spaces'},{expectedRegionDigest:'not-a-digest'}
  ])await raises(x.admission.submit(request(patch),{device:'paired'}),'WORK_REQUEST_INVALID');
  assert.equal(x.events.reads,0);assert.equal(x.events.writes.length,0);
});
test('nonexistent caller never reaches Host review or Work writer',async()=>{
  const x=setup();
  await raises(x.admission.submit(request(),null),'WORK_OWNER_APPROVAL_REQUIRED');
  assert.equal(x.events.reviews.length,0);assert.equal(x.events.writes.length,0);
});
test('Host projection must be current, unique, owner-private and unchanged',async()=>{
  const row=snapshot().regions[0];
  for(const bad of [
    snapshot({state:'absent'}),snapshot({authority:'client'}),
    snapshot({effectPerformed:true}),snapshot({epoch:'old'}),
    snapshot({revision:3}),snapshot({regions:[]}),
    snapshot({regions:[row,row]}),
    snapshot({regions:[{...row,exposure:'public'}]}),
    snapshot({regions:[{...row,freshness:'stale'}]}),
    snapshot({regions:[{...row,digest:'b'.repeat(64)}]}),
    snapshot({regions:[{...row,viewRevision:3}]})
  ]){
    const x=setup({snapshots:[bad]});
    await assert.rejects(x.admission.submit(request(),{}),e=>
      ['WORK_SOURCE_STALE','WORK_SOURCE_UNTRUSTED'].includes(e.code));
    assert.equal(x.events.writes.length,0);
  }
});
test('only verified and unexpired matching Host owner action can persist',async()=>{
  for(const approval of [
    {state:'pending'}, {userConfirmed:false}, {effectOwner:'studio'},
    {requestDigest:'b'.repeat(64)},{actorId:' '},{grantId:' '},
    {sourceEpoch:'old'},{sourceRevision:3},
    {expiresAt:new Date(TIME-1).toISOString()}
  ]){
    const x=setup({approval});
    await raises(x.admission.submit(request(),{}),'WORK_OWNER_APPROVAL_REQUIRED');
    assert.equal(x.events.writes.length,0);
  }
});
test('private Work text never enters the Host action approval attestor',async()=>{
  const x=setup();
  const receipt=await x.admission.submit(request(),{device:'paired'});
  assert.match(receipt.requestDigest,/^[a-f0-9]{64}$/);
  assert.equal(x.events.reviews[0].actionId,'personal.work.create');
  assert.equal(Object.hasOwn(x.events.reviews[0],'title'),false);
  assert.equal(Object.hasOwn(x.events.reviews[0],'objective'),false);
  assert.equal(x.events.reads,2);
});
test('revision changes between review and commit refuse, with zero writes',async()=>{
  const x=setup({snapshots:[snapshot(),snapshot({revision:5})]});
  await raises(x.admission.submit(request(),{}),'WORK_SOURCE_STALE');
  assert.equal(x.events.writes.length,0);
});
test('one explicit action saves using existing Work reducer, no provider dispatch',async()=>{
  const x=setup(),receipt=await x.admission.submit(request(),{device:'paired'});
  assert.equal(receipt.schema,WORK_ADMISSION_SCHEMA);
  assert.equal(receipt.workStatus,'queued');assert.equal(receipt.workVersion,2);
  assert.equal(receipt.replayed,false);assert.equal(receipt.execution,'not-dispatched');
  assert.equal(receipt.providerSends,0);assert.equal(x.work().length,1);
  assert.match(receipt.workId,/^work-[a-f0-9]{32}$/);
  assert.equal(x.events.writes[0].auth.grantId,'grant-1');
});
test('duplicate same-key same-body gets same Work ID from existing reducer',async()=>{
  const x=setup();
  const a=await x.admission.submit(request(),{});
  const b=await x.admission.submit(request(),{});
  assert.equal(a.workId,b.workId);
  assert.equal(b.replayed,true);
  assert.equal(x.work().length,1);
  assert.equal(x.events.writes.length,2); // second CAS reads same item, no new Work
});
test('conflicting payload with same idempotency key never overwrites Work',async()=>{
  const x=setup();
  await x.admission.submit(request(),{});
  await raises(x.admission.submit(request({objective:'Publish private things'}),{}),
    'WORK_CAS_CONFLICT');
  assert.equal(x.work().length,1);
  assert.equal(x.work()[0].objective,request().objective);
});
test('CAS conflict distinct; lost response uncertain, no automatic retry',async()=>{
  const cas=setup({writerError:'PERSONAL_AGENT_VERSION_CONFLICT'});
  await raises(cas.admission.submit(request(),{}),'WORK_CAS_CONFLICT');
  assert.equal(cas.events.writes.length,1);
  const lost=setup({writerError:'ECONNRESET'});
  await raises(lost.admission.submit(request(),{}),'WORK_COMMIT_UNCERTAIN');
  assert.equal(lost.events.writes.length,1);
});
test('uninitialized Studio preflight is definite; ambiguous POST is uncertain',async()=>{
  const unavailable=setup({writerError:'STUDIO_WORK_NOT_READY'});
  await raises(unavailable.admission.submit(request(),{}),'WORK_STORE_NOT_READY');
  assert.equal(unavailable.events.writes.length,1); // adapter invoked; no underlying POST
  const uncertain=setup({writerError:'STUDIO_WORK_POST_UNCERTAIN'});
  await raises(uncertain.admission.submit(request(),{}),'WORK_COMMIT_UNCERTAIN');
  assert.equal(uncertain.events.writes.length,1);
});
test('unexpected Work writer receipt cannot certify a persisted Work',async()=>{
  const x=setup({result:{version:0}});
  await raises(x.admission.submit(request(),{}),'WORK_COMMIT_UNCERTAIN');
  assert.equal(x.events.writes.length,1);
});
