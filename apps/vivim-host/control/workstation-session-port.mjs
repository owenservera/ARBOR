// Host-owned native session port. Registered recipes or explicitly enabled
// terminal policy; never implicit authority. Host journal owns approval.
// Windows workers contain descendant trees in their own creation-time jobs.
import {createHash,randomBytes} from 'node:crypto';
import {readFileSync,realpathSync,statSync,lstatSync} from 'node:fs';
import {isAbsolute,basename,dirname} from 'node:path';
import {spawn} from 'node:child_process';
import {decodeWorkstationText} from './workstation-text-codec.mjs';
import {createTerminalPolicy} from './workstation-terminal-policy.mjs';
import {decodeTerminalAction} from './workstation-terminal-request.mjs';
export const TERMINAL_START='workstation.session.terminal_start';
export const SESSION_START='workstation.session.start',SESSION_STATUS='workstation.session.status',
 SESSION_OUTPUT='workstation.session.output',SESSION_CANCEL='workstation.session.cancel',SESSION_INPUT='workstation.session.input';
export const WORKSTATION_SESSION_ACTIONS=new Set([SESSION_START,SESSION_STATUS,SESSION_OUTPUT,SESSION_CANCEL,SESSION_INPUT,TERMINAL_START]);
const fail=(code,status=409)=>Object.assign(Error(code),{code,status});
const hash=b=>createHash('sha256').update(b).digest('hex');
const digest=x=>hash(JSON.stringify(x));
const hex=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const id=x=>typeof x==='string'&&/^ctl-[a-f0-9]{16}$/.test(x);
const recipeId=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{2,63}$/.test(x);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(o,allowed)=>record(o)&&Object.keys(o).every(k=>allowed.includes(k));
const envNames=new Set(['SYSTEMROOT','WINDIR','PATH','PATHEXT','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','TEMP','TMP','CARGO_HOME','RUSTUP_HOME','RUSTUP_TOOLCHAIN','CARGO_TARGET_DIR','GIT_CONFIG_NOSYSTEM','LANG','LC_ALL','TERM','NO_COLOR','RUST_BACKTRACE']);
function regular(file,max){
 if(typeof file!=='string'||!isAbsolute(file))throw fail('WORKSTATION_SESSION_BINDING_INVALID');
 const p=realpathSync(file),st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||st.size<1||st.size>max)throw fail('WORKSTATION_SESSION_BINDING_INVALID');
 return {path:p,sha:hash(readFileSync(p))};
}
function exactFile(file,sha,max){
 const b=regular(file,max);if(!hex(sha)||b.sha!==sha)throw fail('WORKSTATION_SESSION_BINDING_INVALID');return b;
}
function resolveCargoToolchain(recipe,exe){
 if(recipe.toolchain===undefined)return null;
 const t=recipe.toolchain;
 if(!/^cargo(?:\.exe)?$/i.test(basename(exe.path))||
    !keys(t,['rustc','rustdoc']))throw fail('WORKSTATION_SESSION_BINDING_INVALID');
 const result={};
 for(const name of ['rustc','rustdoc']){
  const v=t[name];
  if(!keys(v,['path','sha256'])||typeof v.path!=='string'||!hex(v.sha256))
   throw fail('WORKSTATION_SESSION_BINDING_INVALID');
  const pinned=exactFile(v.path,v.sha256,256*1024*1024);
  const expected=process.platform==='win32'?name+'.exe':name;
  const normalize=s=>process.platform==='win32'?s.toLowerCase():s;
  if(normalize(basename(pinned.path))!==expected||
     normalize(dirname(pinned.path))!==normalize(dirname(exe.path)))
   throw fail('WORKSTATION_SESSION_BINDING_INVALID');
  result[name]=pinned;
 }
 return result;
}
function envValue(env,name){
 if(process.platform!=='win32')return env[name];
 // A copied process.env becomes a case-sensitive JS object. Windows itself
 // treats environment names as case-insensitive; reject conflicting aliases.
 const matches=Object.entries(env).filter(([k])=>k.toUpperCase()===name.toUpperCase());
 if(matches.some(([,v])=>v!==matches[0][1]))throw fail('WORKSTATION_ENV_AMBIGUOUS');
 return matches[0]?.[1];
}
function windowsRuntimeEnvironment(env){
 if(process.platform!=='win32')return {};
 const root=envValue(env,'SystemRoot');
 if(typeof root!=='string'||!isAbsolute(root)||!statSync(root).isDirectory())throw fail('WORKSTATION_WINDOWS_RUNTIME_ENV_REQUIRED');
 return {SystemRoot:root,WINDIR:root};
}
function cursor(s){if(typeof s!=='string'||!/^(0|[1-9][0-9]{0,14})$/.test(s))throw fail('WORKSTATION_CURSOR_INVALID');return Number(s);}
export function createWorkstationSessionPort({env=process.env,spawnWorker=spawn,now=Date.now}={}){
 let worker=null,dead=false,sequence=0,admissionClosed=false;const pending=new Map(),sessions=new Map(),generation=randomBytes(16).toString('hex');
 const terminal=createTerminalPolicy({env,now});
 function config(){
  if(!env.VIVIM_WORKSTATION_RECIPES||!env.VIVIM_WORKSTATION_RECIPES_SHA256||
     !env.VIVIM_WORKSTATION_SESSION_EXE||!env.VIVIM_WORKSTATION_SESSION_SHA256)throw fail('WORKSTATION_SESSIONS_DISABLED');
  try{
   const f=exactFile(env.VIVIM_WORKSTATION_RECIPES,env.VIVIM_WORKSTATION_RECIPES_SHA256,65536);
   const raw=readFileSync(f.path);if(hash(raw)!==f.sha)throw Error();
   const c=JSON.parse(raw);
   if(!keys(c,['schema','recipes'])||c.schema!=='vivim.workstation-recipes/1'||!Array.isArray(c.recipes)||!c.recipes.length||c.recipes.length>32)throw Error();
   const ids=new Set();
   for(const r of c.recipes){
    if(!keys(r,['id','executable','executableSha256','workspace','args','environment','interactive','timeoutMs','toolchain'])||
      !recipeId(r.id)||ids.has(r.id)||!isAbsolute(r.executable)||!hex(r.executableSha256)||!isAbsolute(r.workspace)||
      !Array.isArray(r.args)||r.args.length>64||r.args.some(a=>typeof a!=='string'||a.length>4096||a.includes('\0'))||
      !Array.isArray(r.environment)||r.environment.length>32||r.environment.some(n=>typeof n!=='string'||!envNames.has(n.toUpperCase()))||
      typeof r.interactive!=='boolean'||!Number.isSafeInteger(r.timeoutMs)||r.timeoutMs<100||r.timeoutMs>1800000)throw Error();
    ids.add(r.id);
   }
   return {configSha:f.sha,recipes:c.recipes};
  }catch{throw fail('WORKSTATION_SESSION_BINDING_INVALID');}
 }
 function resolve(recipe){
  const c=config(),r=c.recipes.find(x=>x.id===recipe);if(!r)throw fail('WORKSTATION_RECIPE_UNKNOWN');
  const helper=exactFile(env.VIVIM_WORKSTATION_SESSION_EXE,env.VIVIM_WORKSTATION_SESSION_SHA256,64*1024*1024);
  if(!/^vivim-workstation-session(?:\.exe)?$/i.test(basename(helper.path)))throw fail('WORKSTATION_SESSION_BINDING_INVALID');
  const exe=exactFile(r.executable,r.executableSha256,256*1024*1024),workspace=realpathSync(r.workspace);
  if(!statSync(workspace).isDirectory()||(process.platform==='win32'&&!/\.exe$/i.test(exe.path)))throw fail('WORKSTATION_SESSION_BINDING_INVALID');
  const environment=windowsRuntimeEnvironment(env);for(const n of r.environment){if(process.platform==='win32'&&['SYSTEMROOT','WINDIR'].includes(n.toUpperCase()))continue;const v=envValue(env,n);if(v!==undefined){if(typeof v!=='string'||v.length>32768||v.includes('\0'))throw fail('WORKSTATION_SESSION_BINDING_INVALID');environment[n]=v;}}
  const toolchain=resolveCargoToolchain(r,exe);
  // Values come from the exact local recipe, never from remote args or ambient wrappers.
  if(toolchain){environment.RUSTC=toolchain.rustc.path;environment.RUSTDOC=toolchain.rustdoc.path;}
  const spec={executable:exe.path,workspace,args:r.args,environment,interactive:r.interactive,timeoutMs:r.timeoutMs};
  return {helper,configSha:c.configSha,recipe,spec,binding:{schema:'vivim.workstation-session-binding/1',recipe,configSha:c.configSha,bindingDigest:digest({helper,exe,recipe,spec,toolchain,configSha:c.configSha})}};
 }
 function resolveTerminal(args){
  const t=terminal.bind(decodeTerminalAction(args));
  const helper=exactFile(env.VIVIM_WORKSTATION_SESSION_EXE,env.VIVIM_WORKSTATION_SESSION_SHA256,64*1024*1024);
  if(!/^vivim-workstation-session(?:\.exe)?$/i.test(basename(helper.path)))throw fail('WORKSTATION_SESSION_BINDING_INVALID');
  const environment=windowsRuntimeEnvironment(env);
  for(const n of t.environmentNames){
   if(process.platform==='win32'&&['SYSTEMROOT','WINDIR'].includes(n.toUpperCase()))continue;
   const v=envValue(env,n);
   if(v!==undefined){if(typeof v!=='string'||v.length>32768||v.includes('\0'))throw fail('WORKSTATION_SESSION_BINDING_INVALID');environment[n]=v;}
  }
  const spec={executable:t.executable.path,workspace:t.workspace,args:t.request.args,environment,interactive:t.request.interactive,timeoutMs:t.request.timeout_ms};
  return {helper,configSha:t.configSha,mode:'terminal',spec,binding:{schema:'vivim.workstation-terminal-binding/1',configSha:t.configSha,bindingDigest:digest({helper,t,spec})}};
 }
 function resolveStart(action,args){
  if(action===TERMINAL_START)return resolveTerminal(args);
  if(action!==SESSION_START||!keys(args,['recipe'])||!recipeId(args.recipe))throw fail('WORKSTATION_RECIPE_INVALID');
  return resolve(args.recipe);
 }
 function known(sessionId,requireCurrent=true){
  if(!id(sessionId))throw fail('WORKSTATION_SESSION_UNKNOWN');
  const s=sessions.get(sessionId);if(!s||dead||!worker||now()>s.expiresAt)throw fail('WORKSTATION_SESSION_UNKNOWN');
  if(requireCurrent&&(s.mode==='terminal'?terminal.current():config().configSha)!==s.configSha)throw fail('WORKSTATION_SESSION_REVOKED');
  return s;
 }
 function prepare(action,args){
  if(action===SESSION_START||action===TERMINAL_START){
   if(admissionClosed)throw fail('WORKSTATION_SESSION_DRAINING',503);
   return resolveStart(action,args).binding;
  }
  const s=known(args?.session_id,action!==SESSION_CANCEL);
  if(action===SESSION_INPUT&&(!s.interactive||!decodeWorkstationText(args.input,4096)))throw fail('WORKSTATION_INPUT_INVALID');
  if(action!==SESSION_CANCEL&&action!==SESSION_INPUT)throw fail('WORKSTATION_SESSION_OPERATION_INVALID');
  return {schema:'vivim.workstation-session-mutation/1',generation,sessionId:args.session_id,action,bindingDigest:digest({args,generation,sessionId:args.session_id,configSha:s.configSha})};
 }
 function terminate(){
  dead=true;const w=worker;worker=null;
  for(const p of pending.values()){clearTimeout(p.timer);p.reject(fail('WORKSTATION_SESSION_OUTCOME_UNCERTAIN',503));}pending.clear();
  if(w&&!w.killed){
   // Closing the pipe first lets the native worker reap owned children. Only
   // force-stop the worker if it fails to exit. Windows job handles close on worker exit.
   try{w.stdin.end();}catch{}
   const timer=setTimeout(()=>{if(w.exitCode===null&&!w.killed)try{w.kill()}catch{}},2000);timer.unref?.();
   w.once('exit',()=>clearTimeout(timer));
  }
 }
 function boot(helper){
  if(dead)throw fail('WORKSTATION_SESSION_RECOVERY_REQUIRED',503);
  if(worker){if(worker.helperSha!==helper.sha||worker.helperPath!==helper.path)throw fail('WORKSTATION_SESSION_RECOVERY_REQUIRED',503);return;}
  const clean=windowsRuntimeEnvironment(env);
  const w=spawnWorker(helper.path,[],{env:clean,stdio:['pipe','pipe','ignore'],shell:false,windowsHide:true});
  worker=w;w.helperSha=helper.sha;w.helperPath=helper.path;
  let buffer='';
  w.on('error',terminate);w.on('exit',terminate);w.stdin.on('error',terminate);
  w.stdout.setEncoding('utf8');w.stdout.on('data',chunk=>{
   buffer+=chunk;if(buffer.length>262144){terminate();return;}
   let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);let r;
    try{r=JSON.parse(line);}catch{terminate();return;}
    const p=pending.get(r?.id);if(!p||typeof r.ok!=='boolean'){terminate();return;}
    pending.delete(r.id);clearTimeout(p.timer);
    if(r.ok&&record(r.result))p.resolve(r.result);
    else p.reject(fail('WORKSTATION_NATIVE_'+(/^[A-Z_]{3,64}$/.test(r.code||'')?r.code:'FAILED'),503));
   }
  });
  // Host exit closes stdin; the native worker drops owned children. Timers for
  // pending calls keep the event loop alive. No automatic worker restart/replay.
  w.unref?.();w.stdin.unref?.();w.stdout.unref?.();
 }
 function rpc(body){
  if(dead||!worker||pending.size>=16)throw fail('WORKSTATION_SESSION_RECOVERY_REQUIRED',503);
  const requestId=++sequence,line=JSON.stringify({id:requestId,...body})+'\n';
  if(Buffer.byteLength(line)>262144)throw fail('WORKSTATION_SESSION_REQUEST_TOO_LARGE');
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>terminate(),10000);pending.set(requestId,{resolve,reject,timer});
   worker.stdin.write(line,error=>{if(error)terminate();});
  });
 }
 function validate(r,sessionId){if(!record(r)||r.sessionId!==sessionId)throw fail('WORKSTATION_SESSION_OUTCOME_UNCERTAIN',503);return r;}
 async function start(args,binding,sessionId,action=SESSION_START){
  if(admissionClosed)throw fail('WORKSTATION_SESSION_DRAINING',503);
  if(!id(sessionId)||sessions.has(sessionId))throw fail('WORKSTATION_SESSION_UNKNOWN');
  const r=resolveStart(action,args);if(digest(r.binding)!==digest(binding))throw fail('WORKSTATION_SESSION_BINDING_STALE');
  for(const [k,v]of sessions)if(now()>v.expiresAt)sessions.delete(k);
  if(sessions.size>=64)throw fail('WORKSTATION_SESSION_LIMIT');
  boot(r.helper);
  // Record intent before calling native worker; ambiguous start is never retried.
  sessions.set(sessionId,{mode:r.mode??'recipe',configSha:r.configSha,interactive:r.spec.interactive,expiresAt:now()+r.spec.timeoutMs+600000});
  return validate(await rpc({op:'start',sessionId,...r.spec}),sessionId);
 }
 // Trusted-local lifecycle interface, not an MCP action or an authorization.
 // Fence new admissions synchronously before observing worker state. Previously
 // authorized output/status/cancel remain available. Host-wide drain is separate.
 function beginDrain(){admissionClosed=true;}
 async function inventory(){
  const schema='vivim.workstation-host-session-inventory/1';
  const snapshotOnly=!admissionClosed;
  if(dead)return {schema,generation,state:'unknown',reason:'worker-lost',admissionClosed,snapshotOnly:true};
  if(!worker)return {schema,generation,state:'idle',running:0,retained:0,unsettledOutput:0,sessions:[],admissionClosed,snapshotOnly};
  if(pending.size)return {schema,generation,state:'unknown',reason:'requests-in-flight',admissionClosed,snapshotOnly:true};
  const r=await rpc({op:'inventory'});
  if(r.schema!=='vivim.workstation-session-inventory/1'||!Array.isArray(r.sessions)||
    r.sessions.length>64||r.retained!==r.sessions.length||
    !Number.isSafeInteger(r.running)||r.running<0||r.running>r.retained||
    !Number.isSafeInteger(r.unsettledOutput)||r.unsettledOutput<0||r.unsettledOutput>r.retained||
    r.maxRunning!==8||r.maxRetained!==64)throw fail('WORKSTATION_SESSION_OUTCOME_UNCERTAIN',503);
  const seen=new Set();let running=0,unsettled=0;
  for(const row of r.sessions){
   const s=row?.status;
   if(!id(s?.sessionId)||seen.has(s.sessionId)||!sessions.has(s.sessionId)||
     !['running','exited','timed-out'].includes(s.state)||
     !['windows-job','direct-child'].includes(s.containment)||
     !['stdoutClosed','stderrClosed','stdoutReadFailed','stderrReadFailed'].every(k=>typeof row[k]==='boolean'))
    throw fail('WORKSTATION_SESSION_OUTCOME_UNCERTAIN',503);
   seen.add(s.sessionId);if(s.state==='running')running++;
   if(!row.stdoutClosed||!row.stderrClosed||row.stdoutReadFailed||row.stderrReadFailed)unsettled++;
  }
  if(running!==r.running||unsettled!==r.unsettledOutput)throw fail('WORKSTATION_SESSION_OUTCOME_UNCERTAIN',503);
  return {schema,generation,state:pending.size?'unknown':running||unsettled?'busy':'idle',
   running,retained:r.retained,unsettledOutput:unsettled,maxRunning:r.maxRunning,maxRetained:r.maxRetained,
   sessions:r.sessions,admissionClosed,snapshotOnly:snapshotOnly||pending.size>0};
 }
 async function read(action,args){
  known(args?.session_id);const sessionId=args.session_id;
  if(action===SESSION_STATUS){const r=validate(await rpc({op:'status',sessionId}),sessionId);known(sessionId);return r;}
  if(action!==SESSION_OUTPUT)throw fail('WORKSTATION_SESSION_OPERATION_INVALID');
  const result=await rpc({op:'output',sessionId,stdoutCursor:cursor(args.stdout_cursor),stderrCursor:cursor(args.stderr_cursor)});
  validate(result.status,sessionId);known(sessionId);return result;
 }
 async function mutate(action,args,binding){
  if(digest(prepare(action,args))!==digest(binding))throw fail('WORKSTATION_SESSION_BINDING_STALE');
  const sessionId=args.session_id;
  return validate(await rpc(action===SESSION_CANCEL?{op:'cancel',sessionId}:{op:'input',sessionId,input:decodeWorkstationText(args.input,4096)}),sessionId);
 }
 return Object.freeze({prepare,start,read,mutate,beginDrain,inventory,close:terminate});
}
