import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHostServer} from '../server.mjs';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';
import {closeNativeProductKernel} from '../control/native-product-kernel.mjs';

const KEY='test_owner_supervised_composer_12345678';
const USER='owner@example.test';
const ORIGIN='https://owned-phone.ts.net';
const SID='1234567890abcdef1234567890abcdef';
const CORRELATION='ow009.real-host-roundtrip';
function runRequest(host,method,uri,body=null,{direct=false,owner=true,extra={}}={}){
  return new Promise((resolve,reject)=>{
    const headers={
      host:direct?new URL(ORIGIN).host:'127.0.0.1:'+host.address().port,
      ...(direct?{'x-forwarded-proto':'https','tailscale-user-login':USER,
        ...(method==='POST'?{origin:ORIGIN}:{}),'x-vivim-composer':'1'}:
        {...(owner?{authorization:'Bearer '+KEY}:{}),
          ...(method==='POST'?{origin:'http://127.0.0.1:'+host.address().port,
            'x-vivim-control':'1'}:{})}),
      ...(body!==null?{'content-type':'application/json'}:{}),...extra
    };
    const req=http.request({host:'127.0.0.1',port:host.address().port,
      path:uri,method,headers},res=>{
      const parts=[];res.on('data',chunk=>parts.push(chunk));res.on('end',()=>{
        const text=Buffer.concat(parts).toString('utf8');
        let body=text;try{body=text?JSON.parse(text):null;}catch{}
        resolve({status:res.statusCode,body,headers:res.headers});
      });
    });
    req.on('error',reject);req.setTimeout(20000,()=>req.destroy(Error('HOST_COMPOSER_TEST_TIMEOUT')));
    req.end(body===null?undefined:JSON.stringify(body));
  });
}
test('real Rust Host Control plan -> one-use Direct phone draft -> source receipt, without Send',async t=>{
  const root=mkdtempSync(path.join(tmpdir(),'vivim-owner-composer-'));
  const runtime=createBootstrapRuntime({dataRoot:root});
  const host=createHostServer({dataRoot:root,bootstrap:runtime,ownerToken:KEY,
    directPhone:{origin:ORIGIN,user:USER},onboarding:{
      phoneSeen:()=>{},primary:()=>null,providerSnapshot:()=>[],providerRefresh:async()=>[]
    }});
  await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{
    host.closeAllConnections();
    await new Promise(resolve=>host.close(resolve));
    runtime.close();closeNativeProductKernel();
    rmSync(root,{recursive:true,force:true});
  });
  const request=(m,p,b,options)=>runRequest(host,m,p,b,options);
  const phone=(m,p,b,extra)=>request(m,p,b,{direct:true,extra});
  const owner=(m,p,b,extra)=>request(m,p,b,{extra});
  const firstContact=await phone('GET','/mobile/first-contact-composer.ts',null);
  assert.equal(firstContact.status,200,'Direct must actually serve TS module as browser JS');
  assert.match(firstContact.headers['content-type'],/javascript/);
  assert.match(firstContact.body,/mountFirstContactComposer/);
  assert.equal((await phone('POST','/mobile/api/first-contact/composer/observe',{
    sessionId:SID,revision:1,text:'Hello',mode:'vivim',visible:true,composing:false
  },{origin:'https://attacker.invalid'})).status,403);
  const observation=await phone('POST','/mobile/api/first-contact/composer/observe',{
    sessionId:SID,revision:1,text:'Hello',mode:'vivim',visible:true,composing:false
  });
  assert.equal(observation.status,200,JSON.stringify(observation.body));
  assert.equal(observation.body.schema,'vivim.composer-observation-receipt/1');
  const snapshot=await owner('GET','/api/host/live-system');
  assert.equal(snapshot.status,200,JSON.stringify(snapshot.body));
  const region=snapshot.body.regions.find(r=>r.id==='phone.composer');
  assert.equal(region.data.draft,'Hello');
  assert.equal(region.writable[0].actionId,'pwa.composer.draft.set');
  const stage=await owner('POST','/api/host/live-system/composer/stage',{
    sessionId:SID,intent:{epoch:snapshot.body.epoch,
      regionId:'phone.composer',pointer:'/draft',
      expectedSequence:snapshot.body.revision,
      expectedViewRevision:region.viewRevision,
      expectedSourceRevision:region.sourceRevision,
      correlationId:CORRELATION,operation:'append',text:' world'}
  });
  assert.equal(stage.status,202,JSON.stringify(stage.body));
  assert.equal(stage.body.state,'staged');
  assert.equal(stage.body.executionAuthorized,false);
  assert.equal(stage.body.effectPerformed,false);
  assert.equal((await phone('GET','/mobile/api/first-contact/composer/next?sessionId='+SID)).body.state,'none');
  const plan=await owner('POST','/api/host/control/plan',{
    actionId:'pwa.composer.draft.set',args:{stage_id:stage.body.stageId}
  });
  assert.equal(plan.status,200,JSON.stringify(plan.body));
  assert.equal(plan.body.actionId,'pwa.composer.draft.set');
  assert.equal(plan.body.risk,'R1');
  assert.equal(plan.body.outcome,'approval_required');
  assert.equal((await owner('GET','/api/host/control/plan/'+plan.body.planId,null)).status,404);
  // Existing Control route claims one owner-approved effect. The test's
  // authenticated desktop actor explicitly invokes the normal execute API.
  const execution=owner('POST','/api/host/control/execute',{
    planId:plan.body.planId,planDigest:plan.body.planDigest
  });
  let delivery=null;
  for(let attempt=0;attempt<16;attempt++){
    await new Promise(resolve=>setTimeout(resolve,15));
    const found=await phone('GET','/mobile/api/first-contact/composer/next?sessionId='+SID);
    if(found.status===200&&found.body.schema==='vivim.agent-composer-delivery/1'){
      delivery=found.body;break;
    }
  }
  assert.ok(delivery,'The claimed Control plan must deliver once to the owner Direct phone');
  assert.equal(delivery.candidate.oldValue,'Hello');
  assert.equal(delivery.candidate.newValue,'Hello world');
  assert.equal(delivery.candidate.effectPerformed,false);
  assert.equal((await phone('GET','/mobile/api/first-contact/composer/next?sessionId='+SID)).body.state,'none');
  const newObservation=await phone('POST','/mobile/api/first-contact/composer/observe',{
    sessionId:SID,revision:2,text:'Hello world',mode:'vivim',visible:true,
    composing:false,correlationId:CORRELATION
  });
  assert.equal(newObservation.status,200,JSON.stringify(newObservation.body));
  const ack=await phone('POST','/mobile/api/first-contact/composer/ack',{
    sessionId:SID,correlationId:CORRELATION,stage:'applied-local'
  });
  assert.equal(ack.status,200,JSON.stringify(ack.body));
  assert.equal(ack.body.state,'verified');
  const executed=await execution;
  assert.equal(executed.status,200,JSON.stringify(executed.body));
  assert.equal(executed.body.schema,'vivim.control-receipt/1');
  assert.equal(executed.body.status,'applied');
  assert.equal(executed.body.result?.status,'verified');
  assert.equal(executed.body.result.draftSent,false);
  assert.equal(executed.body.result.providerEffect,false);
  const final=await owner('GET','/api/host/live-system');
  assert.equal(final.status,200,JSON.stringify(final.body));
  assert.equal(final.body.regions.find(r=>r.id==='phone.composer').data.draft,'Hello world');
  assert.ok(final.body.revision>snapshot.body.revision);
  assert.ok(final.body.regions.find(r=>r.id==='phone.composer').sourceRevision>region.sourceRevision);
  assert.equal((await phone('POST','/mobile/api/first-contact/composer/ack',{
    sessionId:SID,correlationId:CORRELATION,stage:'applied-local'
  })).status,409);
});
