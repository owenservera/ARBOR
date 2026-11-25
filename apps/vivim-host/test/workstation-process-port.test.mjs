import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';
import {createControlDispatcher} from '../control/dispatcher.mjs';
import {createWorkstationProcessPort,WORKSTATION_PROCESS_ACTION as actionId} from '../control/workstation-process-port.mjs';
const request={actionId,args:{recipe:'node-version'}};
const owner={source:'desktop',actor:'desktop-owner'};
const approval={channel:'desktop-owner-token',actor:'desktop-owner'};
function fixture(t,port){
 const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-process-'));
 const runtime=createBootstrapRuntime({dataRoot,file:':memory:'});
 runtime.grantBootstrap({scope:'full-bootstrap'});
 const control=createControlDispatcher({dataRoot,runtime,workstationProcess:port});
 t.after(()=>{runtime.close();rmSync(dataRoot,{recursive:true,force:true});});
 return control;
}
test('typed owner approval uses incumbent journal, runs once and replays receipt; mobile denied',async t=>{
 let launches=0;
 const binding={schema:'vivim.workstation-process-binding/1',recipe:'node-version',bindingDigest:'a'.repeat(64)};
 const control=fixture(t,{prepare:()=>binding,start:async(args,b)=>{assert.deepEqual(b,binding);launches++;return {exitCode:0,version:'v24.22.1'};}});
 assert.equal(control.plan(request,{source:'mobile',actor:'owner'}).outcome,'unavailable');
 const p=control.plan(request,owner);assert.equal(p.outcome,'approval_required');
 assert.equal(launches,0);
 assert.throws(()=>control.execute({planId:p.planId,planDigest:p.planDigest,approval:{channel:'direct-phone',actor:'desktop-owner'}}),/CONTROL_WORKSTATION_DESKTOP_APPROVAL_REQUIRED/);
 const r=await control.execute({planId:p.planId,planDigest:p.planDigest,approval});
 assert.equal(r.status,'applied');assert.equal(r.result.exitCode,0);assert.equal(launches,1);
 const replay=await control.execute({planId:p.planId,planDigest:p.planDigest,approval});assert.equal(replay.replayed,true);assert.equal(launches,1);
 assert.throws(()=>control.status(p.planId,{source:'mobile'}),/CONTROL_PLAN_UNKNOWN/);
 assert.equal(control.recent(10,{source:'mobile'}).length,0);
});
test('binding changes fail before claim; disabled config fails before effect',t=>{
 let version=0,launches=0;
 const control=fixture(t,{prepare:()=>({bindingDigest:String(version)}),start:()=>{launches++;}});
 const p=control.plan(request,owner);version++;
 assert.throws(()=>control.execute({planId:p.planId,planDigest:p.planDigest,approval}),/WORKSTATION_PROCESS_BINDING_STALE/);
 assert.equal(launches,0);assert.equal(control.status(p.planId).state,'planned');
 assert.throws(()=>createWorkstationProcessPort({env:{}}).prepare(request.args),/WORKSTATION_PROCESS_DISABLED/);
});
test('port checks helper digest and fixed arguments, does not inherit credentials',async t=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'vivim-probe-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const helper=path.join(root,process.platform==='win32'?'vivim-workstation-probe.exe':'vivim-workstation-probe');writeFileSync(helper,'fixture');
 const env={VIVIM_WORKSTATION_PROBE_EXE:helper,VIVIM_WORKSTATION_PROBE_SHA256:createHash('sha256').update('fixture').digest('hex'),CONTROL_PLANE_API_KEY:'fixture-secret'};
 let calls=0;
 const port=createWorkstationProcessPort({env,run:async(exe,args,opts)=>{calls++;assert.equal(exe,helper);assert.equal(args[0],'--node-version');assert.equal(args.length,2);assert.equal(opts.env.CONTROL_PLANE_API_KEY,undefined);assert.equal(opts.shell,false);return {stdout:JSON.stringify({schema:'vivim.workstation-probe/1',recipe:'node-version',exitCode:0,version:'v24.22.1'})};}});
 const b=port.prepare(request.args);assert.equal((await port.start(request.args,b)).version,'v24.22.1');assert.equal(calls,1);
 assert.throws(()=>port.prepare({recipe:'node-version',command:'arbitrary'}),/WORKSTATION_RECIPE_INVALID/);
 writeFileSync(helper,'changed');await assert.rejects(port.start(request.args,b),/WORKSTATION_PROCESS_BINDING_INVALID/);assert.equal(calls,1);
});
test('real native helper through existing Host plan, claim and receipt',{skip:!process.env.VIVIM_WORKSTATION_PROBE_EXE},async t=>{
 const control=fixture(t,createWorkstationProcessPort());
 const p=control.plan(request,owner);
 const r=await control.execute({planId:p.planId,planDigest:p.planDigest,approval});
 assert.equal(r.status,'applied');assert.equal(r.result.version,process.version);assert.equal(r.result.exitCode,0);
 console.log('NATIVE_WORKSTATION_RECEIPT='+JSON.stringify({planId:r.planId,status:r.status,result:r.result}));
});
