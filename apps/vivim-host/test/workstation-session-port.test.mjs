import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';
import {createControlDispatcher} from '../control/dispatcher.mjs';
import {createWorkstationSessionPort,SESSION_START,SESSION_STATUS,SESSION_OUTPUT,SESSION_INPUT,SESSION_CANCEL} from '../control/workstation-session-port.mjs';
import {encodeWorkstationText as enc} from '../control/workstation-text-codec.mjs';
const owner={source:'desktop',actor:'desktop-owner'},approval={channel:'desktop-owner-token',actor:'desktop-owner'};
const hash=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
function fixture(t){
 const root=mkdtempSync(path.join(os.tmpdir(),'vivim-native-session-'));
 const file=path.join(root,'recipes.json'),exe=process.execPath;
 const worker=process.env.VIVIM_WORKSTATION_SESSION_EXE;
 const make=(id,args,interactive=false,timeoutMs=15000)=>({id,executable:exe,executableSha256:hash(exe),workspace:root,args,environment:process.platform==='win32'?['SystemRoot']:[],interactive,timeoutMs});
 writeFileSync(file,JSON.stringify({schema:'vivim.workstation-recipes/1',recipes:[
 make('node-version',['--version']),make('node-interactive',['-e','process.stdin.on("data",b=>{process.stdout.write("ECHO:"+b.toString().trim()+"\\n",()=>process.exit(0))})'],true),
 make('node-sleep',['-e','setInterval(()=>{},1000)']),make('node-timeout',['-e','setInterval(()=>{},1000)'],false,150)]}));
 const env={...process.env,VIVIM_WORKSTATION_RECIPES:file,VIVIM_WORKSTATION_RECIPES_SHA256:hash(file),VIVIM_WORKSTATION_SESSION_EXE:worker,VIVIM_WORKSTATION_SESSION_SHA256:hash(worker)};
 const session=createWorkstationSessionPort({env}),runtime=createBootstrapRuntime({dataRoot:root,file:':memory:'});
 const control=createControlDispatcher({dataRoot:root,runtime,workstationSession:session});
 t.after(()=>{session.close();runtime.close();try{rmSync(root,{recursive:true,force:true})}catch{}});
 const plan=(actionId,args)=>control.plan({actionId,args},owner);
 const execute=async(actionId,args)=>{const p=plan(actionId,args);assert.equal(p.outcome,'approval_required');const r=await control.execute({planId:p.planId,planDigest:p.planDigest,approval});assert.equal(r.status,'applied',JSON.stringify(r.error));return r;};
 const read=async(actionId,args)=>{const r=await plan(actionId,args);assert.equal(r.outcome,'done');return r.result;};
 return {control,plan,execute,read,env,file,session};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function output(f,sessionId,marker){
 let stdout='',stderr='',last=null;let c='0',e='0';
 for(let i=0;i<80;i++){const r=await f.read(SESSION_OUTPUT,{session_id:sessionId,stdout_cursor:c,stderr_cursor:e});stdout+=r.stdout.text;stderr+=r.stderr.text;last=r.status;c=String(r.stdout.next);e=String(r.stderr.next);
 if(stdout.includes(marker)&&r.status.state==='exited'&&r.stdout.closed)return {stdout,r};await sleep(50);}
 throw Error('Output did not settle: '+JSON.stringify({stdout,stderr,last}));
}
test('disabled configuration cannot plan a start',()=>{assert.throws(()=>createWorkstationSessionPort({env:{}}).prepare(SESSION_START,{recipe:'node-version'}),/WORKSTATION_SESSIONS_DISABLED/)});
test('real native worker: Host approval, version, cursors, replay, interactive input, cancel and timeout',{skip:!process.env.VIVIM_WORKSTATION_SESSION_EXE,timeout:90000},async t=>{
 const f=fixture(t);
 assert.equal(f.control.plan({actionId:SESSION_START,args:{recipe:'node-version'}},{source:'mobile',actor:'owner'}).outcome,'unavailable');
 const p=f.plan(SESSION_START,{recipe:'node-version'});assert.equal(p.outcome,'approval_required');
 assert.throws(()=>f.control.execute({planId:p.planId,planDigest:p.planDigest,approval:{channel:'direct-phone',actor:'desktop-owner'}}),/CONTROL_WORKSTATION_DESKTOP_APPROVAL_REQUIRED/);
 const first=await f.control.execute({planId:p.planId,planDigest:p.planDigest,approval});assert.equal(first.status,'applied');assert.equal(first.result.sessionId,p.planId);
 const replay=await f.control.execute({planId:p.planId,planDigest:p.planDigest,approval});assert.equal(replay.replayed,true);
 const result=await output(f,p.planId,process.version);assert.equal(result.r.status.exitCode,0);
 const more=await f.read(SESSION_OUTPUT,{session_id:p.planId,stdout_cursor:String(result.r.stdout.next),stderr_cursor:String(result.r.stderr.next)});assert.equal(more.stdout.hex,'');
 assert.equal(f.control.plan({actionId:SESSION_STATUS,args:{session_id:p.planId}},{source:'mobile'}).outcome,'unavailable');
 const interactive=await f.execute(SESSION_START,{recipe:'node-interactive'});const queued=await f.execute(SESSION_INPUT,{session_id:interactive.planId,input:enc('hello\n')});assert.equal(queued.result.queuedBytes,6);
 assert.ok((await output(f,interactive.planId,'ECHO:hello')).stdout.includes('ECHO:hello'));
 const long=await f.execute(SESSION_START,{recipe:'node-sleep'});assert.equal((await f.read(SESSION_STATUS,{session_id:long.planId})).state,'running');
 const stopped=await f.execute(SESSION_CANCEL,{session_id:long.planId});assert.equal(stopped.result.state,'exited');
 const ttl=await f.execute(SESSION_START,{recipe:'node-timeout'});await sleep(400);assert.equal((await f.read(SESSION_STATUS,{session_id:ttl.planId})).state,'timed-out');
 const stale=f.plan(SESSION_START,{recipe:'node-version'});writeFileSync(f.file,'changed');
 assert.throws(()=>f.control.execute({planId:stale.planId,planDigest:stale.planDigest,approval}),/WORKSTATION_SESSION_BINDING_INVALID/);
 assert.throws(()=>f.control.status(p.planId,{source:'mobile'}),/CONTROL_PLAN_UNKNOWN/);
 console.log('NATIVE_SESSION_RECEIPT='+JSON.stringify({planId:p.planId,status:first.status,version:result.stdout.trim(),interactive:true,cancelled:true,timeout:true}));
});

test('cargo recipe binds exact compiler and documentation tools, refuses changes and foreign paths',t=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'vivim-toolchain-'));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const suffix=process.platform==='win32'?'.exe':'';
 const helper=path.join(root,'vivim-workstation-session'+suffix),cargo=path.join(root,'cargo'+suffix),
  rustc=path.join(root,'rustc'+suffix),rustdoc=path.join(root,'rustdoc'+suffix);
 for(const file of [helper,cargo,rustc,rustdoc])writeFileSync(file,path.basename(file));
 const config=path.join(root,'recipes.json');
 const recipe={id:'cargo-host-tests',executable:cargo,executableSha256:hash(cargo),workspace:root,args:['test','--offline','--locked'],
  environment:[],interactive:false,timeoutMs:1000,toolchain:{rustc:{path:rustc,sha256:hash(rustc)},rustdoc:{path:rustdoc,sha256:hash(rustdoc)}}};
 const env={...process.env,VIVIM_WORKSTATION_RECIPES:config,VIVIM_WORKSTATION_SESSION_EXE:helper,VIVIM_WORKSTATION_SESSION_SHA256:hash(helper)};
 function prepare(){writeFileSync(config,JSON.stringify({schema:'vivim.workstation-recipes/1',recipes:[recipe]}));env.VIVIM_WORKSTATION_RECIPES_SHA256=hash(config);return createWorkstationSessionPort({env}).prepare(SESSION_START,{recipe:recipe.id});}
 const before=prepare();assert.equal(before.recipe,recipe.id);
 writeFileSync(rustc,'changed');assert.throws(prepare,/WORKSTATION_SESSION_BINDING_INVALID/);
 recipe.toolchain.rustc.sha256=hash(rustc);assert.notEqual(prepare().bindingDigest,before.bindingDigest);
 recipe.toolchain.rustdoc={path:rustc,sha256:hash(rustc)};assert.throws(prepare,/WORKSTATION_SESSION_BINDING_INVALID/);
});
