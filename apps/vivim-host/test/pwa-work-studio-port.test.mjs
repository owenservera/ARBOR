// PY-001: Existing Studio Work CAS behind the incumbent Host-private Studio
// port. No new server, Studio process, browser controller, Host effect or model.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudioPort } from '../onboarding/studio-port.mjs';
import { createPwaWorkAdmission, WORK_REQUEST_SCHEMA }
  from '../control/pwa-work-admission.mjs';
import { createWork } from '../../../studio/src/agents/personal-agent-work.mjs';

const FINGERPRINT='local-dir-sha256:'+'a'.repeat(64);
const NOW='2026-11-23T21:30:00.000Z';
const HASH='a'.repeat(64);
const input=()=>({expectedVersion:1,title:'Build a Wiki',objective:'Prepare a draft for my approval',idempotencyKey:'work-explicit:20261123:1'});
const request=()=>({
  schema:WORK_REQUEST_SCHEMA,action:'submit-work',title:input().title,
  objective:input().objective,idempotencyKey:input().idempotencyKey,
  expectedWorkVersion:1,expectedEpoch:'epoch-1',expectedRevision:4,
  expectedRegionRevision:2,expectedRegionDigest:HASH
});
const snapshot=()=>({
  schema:'vivim.host-live-system/1',state:'source-backed',
  authority:'read-only-projection',executionAuthorized:false,effectPerformed:false,
  epoch:'epoch-1',revision:4,regions:[{id:'pwa.view',exposure:'owner',
    digest:HASH,viewRevision:2,freshness:'current'}]
});
function fixture(overrides={}){
  let version=1,state={work:[]}; const calls=[];
  const response=(status,payload)=>({ok:status>=200&&status<300,status,json:async()=>payload});
  const fetchImpl=async(url,options)=>{
    const route=new URL(url).pathname,method=options.method;
    calls.push({route,method,options});
    if(overrides.fetch) return overrides.fetch(route,method,options,calls);
    if(route==='/api/v1/personal-agent/status'&&method==='GET')
      return response(200,{initialized:true,scope:'local-data-directory',
        scopeFingerprint:FINGERPRINT,version});
    if(route==='/api/v1/personal-agent/work'&&method==='GET')
      return response(200,{version,items:state.work,execution:'not-dispatched'});
    if(route==='/api/v1/personal-agent/work'&&method==='POST'){
      const body=JSON.parse(options.body);
      const result=createWork(state,{...body,now:NOW});
      if(result.changed&&body.expectedVersion!==version)
        return response(409,{code:'PERSONAL_AGENT_VERSION_CONFLICT'});
      if(result.changed){state=result.state;version++;}
      return response(200,{initialized:true,scope:'local-data-directory',
        scopeFingerprint:FINGERPRINT,version,item:result.item,replayed:!result.changed});
    }
    throw Error('Unexpected simulated Studio path '+route);
  };
  return {port:createStudioPort({url:'http://127.0.0.1:38730',token:'owner-token',fetchImpl}),
    calls,work:()=>state.work,version:()=>version,response};
}
const rejects=(promise,code)=>assert.rejects(promise,{code});

test('bound Work status is one private GET, no Studio bootstrap or side effects',async()=>{
  const f=fixture(),s=await f.port.workStatus();
  assert.equal(s.schema,'vivim.studio-work-status/1');
  assert.equal(s.version,1);assert.equal(s.execution,'not-dispatched');
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].method,'GET');
  assert.equal(f.calls[0].route,'/api/v1/personal-agent/status');
});
test('one Work POST uses existing Studio CAS and verifies one exact readback',async()=>{
  const f=fixture(),v=await f.port.workCreate(input());
  assert.equal(v.version,2);assert.equal(v.item.status,'queued');
  assert.equal(v.execution,'not-dispatched');assert.equal(v.replayed,false);
  assert.match(v.item.id,/^work-[a-f0-9]{32}$/);
  assert.deepEqual(f.calls.map(x=>[x.method,x.route]),[
    ['GET','/api/v1/personal-agent/status'],
    ['POST','/api/v1/personal-agent/work'],
    ['GET','/api/v1/personal-agent/work']
  ]);
  assert.deepEqual(Object.keys(JSON.parse(f.calls[1].options.body)).sort(),
    ['expectedVersion','idempotencyKey','objective','title']);
  assert(f.calls.every(x=>x.options.headers['x-studio-token']==='owner-token'));
  assert(f.calls.every(x=>x.options.redirect==='error'));
  assert.equal(f.work().length,1);
});
test('repeated same key returns one item via existing CAS, no duplicate Work',async()=>{
  const f=fixture();
  const a=await f.port.workCreate(input()),b=await f.port.workCreate(input());
  assert.equal(a.item.id,b.item.id);assert.equal(b.replayed,true);
  assert.equal(f.work().length,1);
  assert.equal(f.calls.filter(x=>x.method==='POST').length,2);
});
test('empty, malformed, forged and oversized Work input is refused pre-network',async()=>{
  const f=fixture();
  for(const bad of [
    {...input(),extra:'approve'},
    {...input(),title:''},
    {...input(),objective:'xx\nxx'},
    {...input(),title:'a'.repeat(161)},
    {...input(),idempotencyKey:'invalid key'},
    {...input(),expectedVersion:0}
  ])await rejects(f.port.workCreate(bad),'STUDIO_WORK_INPUT_INVALID');
  assert.equal(f.calls.length,0);
});
test('Studio local instance must already be initialized and have valid scope',async()=>{
  const f=fixture({fetch:(route)=>f.response(200,{initialized:false})});
  await rejects(f.port.workCreate(input()),'STUDIO_WORK_NOT_READY');
  assert.equal(f.calls.length,1);
});
test('Studio CAS version conflict is definite, never an auto retry',async()=>{
  const f=fixture({fetch:(route,method)=>method==='POST'
    ?f.response(409,{code:'PERSONAL_AGENT_VERSION_CONFLICT'})
    :f.response(200,{initialized:true,scope:'local-data-directory',
      scopeFingerprint:FINGERPRINT,version:1})});
  await rejects(f.port.workCreate(input()),'PERSONAL_AGENT_VERSION_CONFLICT');
  assert.equal(f.calls.filter(x=>x.method==='POST').length,1);
});
test('lost POST response is uncertain, never a hidden retry or false failure',async()=>{
  const f=fixture({fetch:(route,method)=>method==='POST'
    ?Promise.reject(Error('socket reset'))
    :f.response(200,{initialized:true,scope:'local-data-directory',
      scopeFingerprint:FINGERPRINT,version:1})});
  await rejects(f.port.workCreate(input()),'STUDIO_WORK_POST_UNCERTAIN');
  assert.equal(f.calls.filter(x=>x.method==='POST').length,1);
});
test('unverified Studio receipt is uncertain even after successful HTTP response',async()=>{
  const f=fixture({fetch:(route,method)=>method==='POST'
    ?f.response(200,{initialized:true,scope:'local-data-directory',
      scopeFingerprint:FINGERPRINT,version:2,item:{id:'bad',status:'queued',
        title:input().title,objective:input().objective},replayed:false})
    :f.response(200,{initialized:true,scope:'local-data-directory',
      scopeFingerprint:FINGERPRINT,version:1})});
  await rejects(f.port.workCreate(input()),'STUDIO_WORK_POST_UNCERTAIN');
  assert.equal(f.calls.filter(x=>x.method==='POST').length,1);
});
test('missing stored readback is uncertain and creates no success claim',async()=>{
  const f=fixture({fetch:(route,method)=>{
    if(method==='POST')return f.response(200,{initialized:true,
      scope:'local-data-directory',scopeFingerprint:FINGERPRINT,version:2,
      item:{id:'work-'+'b'.repeat(32),status:'queued',
        title:input().title,objective:input().objective},replayed:false});
    if(route==='/api/v1/personal-agent/work')return f.response(200,{version:2,
      items:[],execution:'not-dispatched'});
    return f.response(200,{initialized:true,scope:'local-data-directory',
      scopeFingerprint:FINGERPRINT,version:1});
  }});
  await rejects(f.port.workCreate(input()),'STUDIO_WORK_READBACK_UNCERTAIN');
  assert.equal(f.calls.filter(x=>x.method==='POST').length,1);
});
test('Host-reviewed admission composes with SAME Studio CAS, without a second store',async()=>{
  const f=fixture(),t=Date.parse('2026-11-23T21:30:00.000Z');
  const submit=createPwaWorkAdmission({
    readHostSnapshot:async()=>snapshot(),
    reviewHostAction:async ({requestDigest})=>({
      schema:'vivim.host-reviewed-work-action/1',actionId:'personal.work.create',
      state:'reviewed',effectOwner:'host',userConfirmed:true,
      requestDigest,actorId:'device-1',grantId:'grant-1',
      sourceEpoch:'epoch-1',sourceRevision:4,
      expiresAt:new Date(t+15000).toISOString()
    }),
    writeExistingWork:f.port.workCreate,clock:()=>t,
  });
  const result=await submit.submit(request(),{paired:true});
  assert.equal(result.workStatus,'queued');assert.equal(result.execution,'not-dispatched');
  assert.equal(result.providerSends,0);assert.equal(result.workPersisted,true);
  assert.equal(f.work().length,1);
  assert.equal(f.calls.filter(x=>x.method==='POST').length,1);
});
