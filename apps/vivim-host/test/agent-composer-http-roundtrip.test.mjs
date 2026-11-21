import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
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
  const initialChanges=await owner('GET','/api/host/live-system/changes?wait=0');
  assert.equal(initialChanges.status,200,JSON.stringify(initialChanges.body));
  assert.equal(initialChanges.body.schema,'vivim.host-live-system-changes/1');
  assert.equal(initialChanges.body.state,'snapshot');
  assert.equal(initialChanges.body.sequence,snapshot.body.revision);
  assert.ok(initialChanges.body.regions.some(r=>r.id==='phone.composer'));
  const idle=await owner('GET','/api/host/live-system/changes?epoch='+
    encodeURIComponent(snapshot.body.epoch)+'&after='+snapshot.body.revision+'&wait=0');
  assert.equal(idle.status,200);
  assert.equal(idle.body.state,'idle');
  assert.equal((await owner('GET','/api/host/live-system/changes?after=1')).status,400);
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
  assert.equal((await phone('GET','/mobile/api/first-contact/composer/next?sessionId='+SID+'&wait=0')).body.state,'none');
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
    const found=await phone('GET','/mobile/api/first-contact/composer/next?sessionId='+SID+'&wait=250');
    if(found.status===200&&found.body.schema==='vivim.agent-composer-delivery/1'){
      delivery=found.body;break;
    }
  }
  assert.ok(delivery,'The claimed Control plan must deliver once to the owner Direct phone');
  assert.equal(delivery.candidate.oldValue,'Hello');
  assert.equal(delivery.candidate.newValue,'Hello world');
  assert.equal(delivery.candidate.effectPerformed,false);
  assert.equal((await phone('GET','/mobile/api/first-contact/composer/next?sessionId='+SID+'&wait=0')).body.state,'none');
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
  const changeDelta=await owner('GET','/api/host/live-system/changes?epoch='+
    encodeURIComponent(snapshot.body.epoch)+'&after='+snapshot.body.revision+'&wait=0');
  assert.equal(changeDelta.status,200,JSON.stringify(changeDelta.body));
  assert.equal(changeDelta.body.state,'delta');
  assert.ok(changeDelta.body.events.some(e=>e.regionId==='phone.composer'&&
    e.region.data.draft==='Hello world'));
  const final=await owner('GET','/api/host/live-system');
  assert.equal(final.status,200,JSON.stringify(final.body));
  assert.equal(final.body.regions.find(r=>r.id==='phone.composer').data.draft,'Hello world');
  assert.ok(final.body.revision>snapshot.body.revision);
  assert.ok(final.body.regions.find(r=>r.id==='phone.composer').sourceRevision>region.sourceRevision);
  assert.equal((await phone('POST','/mobile/api/first-contact/composer/ack',{
    sessionId:SID,correlationId:CORRELATION,stage:'applied-local'
  })).status,409);

  // The owner-editable JSON is deliberately separate from refreshable current.
  const mirrorFile=path.join(root,'live-system','owner.current.json');
  const proposalFile=path.join(root,'live-system','owner.proposal.json');
  assert.equal(JSON.parse(readFileSync(mirrorFile,'utf8')).regions
    .find(r=>r.id==='phone.composer').data.draft,'Hello world');
  const rebase=await owner('POST','/api/host/live-system/proposal/rebase',{
    expectedSequence:final.body.revision,discardPending:true
  });
  assert.equal(rebase.status,200,JSON.stringify(rebase.body));
  assert.equal(rebase.body.state,'rebased');
  const edited=JSON.parse(readFileSync(proposalFile,'utf8'));
  edited.regions.find(r=>r.id==='phone.composer').data.draft='File target';
  writeFileSync(proposalFile,JSON.stringify(edited)+'\n');
  // A normal state refresh may never destroy an operator's pending JSON edit.
  const refreshed=await owner('GET','/api/host/live-system');
  assert.equal(refreshed.status,200);
  assert.equal(JSON.parse(readFileSync(proposalFile,'utf8')).regions
    .find(r=>r.id==='phone.composer').data.draft,'File target');
  assert.equal(refreshed.body.regions.find(r=>r.id==='phone.composer').data.draft,'Hello world');
  const fileStage=await owner('POST','/api/host/live-system/composer/stage-file',{confirm:true});
  assert.equal(fileStage.status,202,JSON.stringify(fileStage.body));
  assert.equal(fileStage.body.origin,'owner-file-proposal');
  assert.equal(fileStage.body.executionAuthorized,false);
  const filePlan=await owner('POST','/api/host/control/plan',{
    actionId:'pwa.composer.draft.set',args:{stage_id:fileStage.body.stageId}
  });
  assert.equal(filePlan.status,200,JSON.stringify(filePlan.body));
  assert.equal(filePlan.body.risk,'R1');
  const fileExecution=owner('POST','/api/host/control/execute',{
    planId:filePlan.body.planId,planDigest:filePlan.body.planDigest
  });
  const fileDelivery=await phone('GET',
    '/mobile/api/first-contact/composer/next?sessionId='+SID+'&wait=2000');
  assert.equal(fileDelivery.status,200,JSON.stringify(fileDelivery.body));
  assert.equal(fileDelivery.body.schema,'vivim.agent-composer-delivery/1');
  assert.equal(fileDelivery.body.candidate.oldValue,'Hello world');
  assert.equal(fileDelivery.body.candidate.newValue,'File target');
  const fileCorr=fileDelivery.body.candidate.correlationId;
  const fileObserved=await phone('POST','/mobile/api/first-contact/composer/observe',{
    sessionId:SID,revision:3,text:'File target',mode:'vivim',visible:true,
    composing:false,correlationId:fileCorr
  });
  assert.equal(fileObserved.status,200);
  const fileAck=await phone('POST','/mobile/api/first-contact/composer/ack',{
    sessionId:SID,correlationId:fileCorr,stage:'applied-local'
  });
  assert.equal(fileAck.status,200,JSON.stringify(fileAck.body));
  const fileReceipt=await fileExecution;
  assert.equal(fileReceipt.status,200,JSON.stringify(fileReceipt.body));
  assert.equal(fileReceipt.body.status,'applied');
  assert.equal(fileReceipt.body.result.draftSent,false);
  // ACK path wrote a fresh canonical mirror before the Host receipt.
  assert.equal(JSON.parse(readFileSync(mirrorFile,'utf8')).regions
    .find(r=>r.id==='phone.composer').data.draft,'File target');
});
