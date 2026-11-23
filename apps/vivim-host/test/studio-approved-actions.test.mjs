import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';
import {createControlDispatcher} from '../control/dispatcher.mjs';
import {createStudioPort} from '../onboarding/studio-port.mjs';

const TARGET='0123456789abcdef0123456789abcdef';
const JOB='11111111-1111-4111-8111-111111111111';
const SOURCE={source:'desktop',actor:'desktop-owner'};
const APPROVAL={channel:'desktop-owner-token',actor:'desktop-owner'};
const actions=[
  ['studio.capture.start',{target:TARGET},'captureStart',TARGET,'R2'],
  ['studio.capture.stop',{},'captureStop',undefined,'R2'],
  ['studio.drive.dry_run',{site:'chatgpt'},'driveDryRun','chatgpt','R1'],
  ['studio.drive.cancel',{job_id:JOB},'driveCancel',JOB,'R2'],
];
function fixture(t, studio) {
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-studio-action-'));
  const runtime=createBootstrapRuntime({dataRoot,file:':memory:'});
  runtime.grantBootstrap({scope:'full-bootstrap'});
  const c=createControlDispatcher({dataRoot,runtime,studio});
  t.after(()=>{runtime.close();rmSync(dataRoot,{recursive:true,force:true})});
  return c;
}
test('four Studio actions are typed desktop-only plans and never run before exact approval',async t=>{
  const invoked=[];
  const studio={
    captureStart:async target=>{invoked.push(['captureStart',target]);return {state:'start_requested',sessionId:'studio-source'}},
    captureStop:async()=>{invoked.push(['captureStop']);return {state:'stop_requested',sessionId:'studio-source'}},
    driveDryRun:async site=>{invoked.push(['driveDryRun',site]);return {jobId:JOB,dryRun:true}},
    driveCancel:async id=>{invoked.push(['driveCancel',id]);return {jobId:id,cancellationRequested:true}}
  };
  const c=fixture(t,studio);
  for(const[id,args,method,value,risk]of actions){
    const previousPlans=c.recent().length;
    const mobile=c.plan({actionId:id,args},{source:'mobile',actor:'phone'});
    assert.equal(mobile.outcome,'unavailable',id+' must not produce a phone executable plan');
    const ownerText=c.plan({actionId:id,args},{source:'text',actor:'owner'});
    assert.equal(ownerText.outcome,'unavailable');
    assert.equal(c.recent().length,previousPlans,'no plans for non-owner surfaces');
    const plan=c.plan({actionId:id,args},SOURCE);
    assert.equal(plan.outcome,'approval_required');
    assert.deepEqual(plan.approval.channels,['desktop-owner-token']);
    assert.equal(plan.risk,risk);
    assert.equal(invoked.length,actions.indexOf(actions.find(a=>a[0]===id)),'plan must be inert');
    assert.throws(()=>c.execute({planId:plan.planId,planDigest:plan.planDigest,
      approval:{channel:'desktop-owner-token',actor:'someone-else'}}),
      /CONTROL_STUDIO_DESKTOP_APPROVAL_REQUIRED/);
    const receipt=await c.execute({planId:plan.planId,planDigest:plan.planDigest,approval:APPROVAL});
    assert.equal(receipt.status,'applied',id+' result');
    assert.equal(receipt.actionId,id);
    assert.equal(receipt.executionPerformed,true);
    const again=await c.execute({planId:plan.planId,planDigest:plan.planDigest,approval:APPROVAL});
    assert.equal(again.replayed,true);
    assert.equal(invoked.at(-1)[0],method);
    if(value!==undefined)assert.equal(invoked.at(-1)[1],value);
  }
  assert.equal(invoked.length,4,'one and only one real attempt per approval');
});
test('Studio unavailable fails after approval without silently starting a provider browser',async t=>{
  const c=fixture(t,null);
  const plan=c.plan({actionId:'studio.capture.stop',args:{}},SOURCE);
  assert.equal(plan.outcome,'approval_required');
  const receipt=await c.execute({planId:plan.planId,planDigest:plan.planDigest,approval:APPROVAL});
  assert.equal(receipt.status,'failed');
  assert.equal(receipt.error.code,'STUDIO_UNAVAILABLE');
});
test('unknown result after Studio mutation is UNCERTAIN and must not retry',async t=>{
  let attempts=0;
  const c=fixture(t,{captureStop:async()=>{attempts++;throw Error('Response lost after Studio may have stopped')}})
  const plan=c.plan({actionId:'studio.capture.stop',args:{}},SOURCE);
  const first=await c.execute({planId:plan.planId,planDigest:plan.planDigest,approval:APPROVAL});
  assert.equal(first.status,'uncertain');
  assert.equal(first.executionPerformed,false);
  const again=await c.execute({planId:plan.planId,planDigest:plan.planDigest,approval:APPROVAL});
  assert.equal(again.replayed,true);
  assert.equal(attempts,1,'never auto-send a second Studio effect after uncertain result');
});
test('Studio port validates exact live targets and forces a one-site dry run',async()=>{
  const calls=[];
  const status={recorder:{state:'idle'},browserConnection:{state:'available',verified:true}};
  const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
  const port=createStudioPort({url:'http://127.0.0.1:38730',token:'private',fetchImpl:async(url,opts)=>{
    const path=new URL(url).pathname;
    const body=opts.body?JSON.parse(opts.body):null;
    calls.push({path,method:opts.method,body});
    if(path.endsWith('/status'))return respond(status);
    if(path.endsWith('/targets'))return respond([{id:TARGET,type:'page',title:'private'}]);
    if(path.endsWith('/record/start'))return respond({id:'session-1'});
    if(path.endsWith('/record/stop'))return respond({id:'session-1'});
    if(path.endsWith('/drive/sites'))return respond({sites:[{id:'chatgpt'},{id:'claude'}]});
    if(path.endsWith('/drive/jobs')&&opts.method==='POST')return respond({job:{id:JOB,mode:'drive',dryRun:true,state:'queued'}},202);
    if(path.endsWith('/drive/jobs/'+JOB+'/cancel'))return respond({job:{id:JOB,state:'running'}});
    if(path.endsWith('/drive/jobs/'+JOB))return respond({job:{id:JOB,state:'running'}});
    return respond({code:'NOT_FOUND'},404);
  }});
  await assert.rejects(()=>port.captureStart('anything'),/STUDIO_CAPTURE_TARGET_INVALID/);
  assert.equal(calls.length,0);
  assert.equal((await port.captureStart(TARGET)).state,'start_requested');
  assert.deepEqual(calls.slice(0,3).map(c=>[c.method,c.path]),[
    ['GET','/api/status'],['GET','/api/targets'],['POST','/api/record/start']
  ],'recording is owned by the preexisting legacy Studio API');
  status.recorder.state='recording';
  status.recorder.id='session-1';
  assert.equal((await port.captureStop()).state,'stop_requested');
  assert.deepEqual(calls.slice(3,5).map(c=>[c.method,c.path]),[
    ['GET','/api/status'],['POST','/api/record/stop']
  ]);
  const dry=await port.driveDryRun('chatgpt');
  assert.equal(dry.dryRun,true);
  const command=calls.find(x=>x.path==='/api/v1/drive/jobs'&&x.method==='POST');
  assert.ok(command, 'Drive effects remain in the existing versioned Studio API');
  const payload=command.body;
  assert.deepEqual(payload,{mode:'drive',sites:['chatgpt'],dryRun:true,confirm:false});
  assert.equal((await port.driveCancel(JOB)).cancellationRequested,true);
  assert.ok(calls.filter(x=>x.method==='POST').every(x=>!x.path.endsWith('/conversations/create')));
  assert.equal(await port.driveDryRun('claude').then(r=>r.dryRun),true);
  await assert.rejects(()=>port.driveDryRun('unknown-site'),/STUDIO_DRIVE_SITE_STALE/);
});

test('read-only Studio effect preflight failures are definite, never mutating or auto-retried',async()=>{
  const calls=[];
  const port=createStudioPort({url:'http://127.0.0.1:38730',
    fetchImpl:async(url,opts)=>{
      calls.push({path:new URL(url).pathname,method:opts.method});
      return new Response(JSON.stringify({code:'OFFLINE'}),{
        status:503,headers:{'content-type':'application/json'}
      });
    }});
  for(const run of [
    ()=>port.captureStart(TARGET),
    ()=>port.captureStop(),
    ()=>port.driveDryRun('chatgpt'),
    ()=>port.driveCancel(JOB)
  ]) {
    await assert.rejects(run(),e=>e.code==='STUDIO_UNAVAILABLE');
  }
  assert.deepEqual(calls.map(x=>x.path),[
    '/api/status','/api/status','/api/v1/drive/sites','/api/v1/drive/jobs/'+JOB
  ]);
  assert.ok(calls.every(x=>x.method==='GET'),'no Studio action may be sent after a failed preflight');
  assert.equal(calls.length,4,'one read attempt per action: no retry');
});

test('malformed Drive dry-run response remains uncertain after exactly one POST',async()=>{
  let posts=0;
  const port=createStudioPort({url:'http://127.0.0.1:38730',
    fetchImpl:async(url,opts)=>{
      const route=new URL(url).pathname;
      if(route==='/api/v1/drive/sites')
        return new Response(JSON.stringify({sites:[{id:'chatgpt'}]}),{status:200});
      if(route==='/api/v1/drive/jobs'&&opts.method==='POST'){
        posts++;
        return new Response(JSON.stringify({job:{id:JOB,mode:'drive',dryRun:true,state:'unexpected'}}),{status:202});
      }
      throw Error('unexpected Studio route');
    }});
  await assert.rejects(()=>port.driveDryRun('chatgpt'),
    e=>e.code==='STUDIO_DRIVE_POST_UNCERTAIN');
  assert.equal(posts,1,'never retry an effect with an invalid post-effect receipt');
});
