// VIVIM START01/START02/HOST02 — coordination kernel, NOT a Chrome driver or a daemon.
// Injected service adapters are the existing Studio/Host/relay launchers, never arbitrary shell.
// No background effects: observe(), start(), stop(), reconcile() are explicit caller actions.
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';

export const SUPERVISOR_SCHEMA = 'vivim.runtime-supervisor/1';
export const WORKSPACE_SCHEMA = 'vivim.workspace/1';
export const ORDER = Object.freeze(['studio','host','relay','chatWorker','bootstrapWorker']);
const REQUIRED = new Set(['studio','host']);
const ID = /^[a-z][a-z0-9._:-]{0,95}$/;
const err = (code, detail=code) => Object.assign(new Error(detail),{code});
const plain = x => !!x && typeof x === 'object' && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const stable = x => Array.isArray(x) ? x.map(stable) : plain(x) ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const clone = x => structuredClone(x);
const real = (p,label) => {
  if(typeof p !== 'string' || !path.isAbsolute(p) || !p.trim() || p.includes('\0')) throw err('WORKSPACE_PATH_INVALID',label);
  // Existing directories only. Startup must never silently create/rebind a profile or workspace.
  let s;try{s=fs.lstatSync(p);}catch{throw err('WORKSPACE_PATH_MISSING',label);}
  if(s.isSymbolicLink() || !s.isDirectory())throw err('WORKSPACE_PATH_INVALID',label);
  return fs.realpathSync.native(p);
};
function anchored(parent,child){const rel=path.relative(parent,child);return rel && rel !== '..' && !rel.startsWith('..'+path.sep) && !path.isAbsolute(rel);}
export function validateWorkspace(input,{platform=process.platform}={}){
  if(!plain(input)||input.schema!==WORKSPACE_SCHEMA||input.setupComplete!==true || !ID.test(input.id??''))throw err('WORKSPACE_NOT_CONFIGURED');
  if(!plain(input.chrome)|| !plain(input.components))throw err('WORKSPACE_INVALID');
  const root=real(input.root,'root'),dataRoot=real(input.dataRoot,'dataRoot'),profile=real(input.chrome.profileDir,'chrome profile');
  if(root===profile || profile===dataRoot)throw err('PROFILE_MISMATCH','Profile must be a dedicated directory, not a workspace or data root');
  if(!Number.isInteger(input.chrome.port)||input.chrome.port<1025||input.chrome.port>65535||input.chrome.port===9222)throw err('PROFILE_PORT_INVALID');
  if(typeof input.chrome.executable!=='string'||!path.isAbsolute(input.chrome.executable)||!fs.existsSync(input.chrome.executable)||!fs.statSync(input.chrome.executable).isFile())throw err('CHROME_BINARY_MISSING');
  for(const [name,component] of Object.entries(input.components)){
    if(!ORDER.includes(name)||!plain(component)||typeof component.enabled!=='boolean')throw err('WORKSPACE_COMPONENT_INVALID');
  }
  if(!input.components.studio?.enabled||!input.components.host?.enabled)throw err('WORKSPACE_REQUIRED_COMPONENT');
  if(platform==='win32' && root.toLowerCase()===profile.toLowerCase())throw err('PROFILE_MISMATCH');
  // A manifest path selection is authority for paths, NOT permission to perform browser sends.
  const manifest={schema:WORKSPACE_SCHEMA,id:input.id,root,dataRoot,setupComplete:true,
    chrome:{profileDir:profile,port:input.chrome.port,executable:path.resolve(input.chrome.executable)},
    components:Object.fromEntries(ORDER.map(k=>[k,{enabled:input.components[k]?.enabled===true}]))};
  return Object.freeze({...manifest,digest:hash(manifest)});
}
function atomic(file,body){
  const temp=file+'.'+process.pid+'.'+randomBytes(8).toString('hex')+'.tmp'; let fd;
  try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(body)+'\n');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}finally{if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
}
function safeStatus(v,name){
  if(!plain(v)||!['healthy','stopped','degraded','unknown','blocked'].includes(v.state))throw err('SUPERVISOR_PROBE_INVALID',name);
  if(v.state==='healthy' && (typeof v.instanceId!=='string' || !ID.test(v.instanceId) || v.verified!==true))throw err('SUPERVISOR_HEALTH_UNVERIFIED',name);
  if(v.state==='healthy'&&name==='studio'&&v.profileVerified!==true)throw err('PROFILE_MISMATCH');
  return {state:v.state,verified:v.verified===true,instanceId:typeof v.instanceId==='string'?v.instanceId:null,
    profileVerified:name==='studio'?v.profileVerified===true:undefined,reason:typeof v.reason==='string'?v.reason.slice(0,80):null};
}
export function createRuntimeSupervisor({workspace,adapters,authorizeLaunch,clock=()=>Date.now(),onReceipt=()=>{}}={}){
  const ws=validateWorkspace(workspace);
  if(!plain(adapters)||typeof authorizeLaunch!=='function')throw err('SUPERVISOR_DEPENDENCY');
  for(const n of ORDER.filter(n=>ws.components[n].enabled))if(!adapters[n]||typeof adapters[n].inspect!=='function'||typeof adapters[n].start!=='function'||typeof adapters[n].stop!=='function')throw err('SUPERVISOR_ADAPTER_MISSING',n);
  const dir=path.join(ws.dataRoot,'supervisor'),lock=path.join(dir,'owner.lock'),state=path.join(dir,'state.json');
  const nonce=randomBytes(12).toString('hex'), ownerId='supervisor-'+nonce;
  let ownsLock=false, closed=false, owned=new Map();
  const stamp=()=>new Date(clock()).toISOString();
  const assertActive=()=>{if(closed)throw err('SUPERVISOR_CLOSED');};
  const record=(event,detail={})=>{
    const receipt={schema:SUPERVISOR_SCHEMA,workspaceId:ws.id,workspaceDigest:ws.digest,ownerId,
      event,at:stamp(),components:Object.fromEntries([...owned].map(([k,v])=>[k,{instanceId:v.instanceId}]))};
    atomic(state,receipt);onReceipt(clone(receipt));return receipt;
  };
  function lockOwned(){if(!ownsLock)return false;try{const x=JSON.parse(fs.readFileSync(lock,'utf8'));return x.ownerId===ownerId&&x.workspaceDigest===ws.digest;}catch{return false;}}
  function takeLock(){
    assertActive();if(ownsLock){if(!lockOwned())throw err('SUPERVISOR_LOCK_LOST');return;}
    fs.mkdirSync(dir,{recursive:true,mode:0o700});
    const stat=fs.lstatSync(dir);if(!stat.isDirectory()||stat.isSymbolicLink())throw err('SUPERVISOR_DIR_UNSAFE');
    let fd;
    try{fd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({schema:SUPERVISOR_SCHEMA,workspaceId:ws.id,workspaceDigest:ws.digest,ownerId,pid:process.pid,startedAt:stamp()}));fs.fsyncSync(fd);ownsLock=true;}
    catch(e){if(e.code==='EEXIST')throw err('SUPERVISOR_ALREADY_OWNED','An existing owner lock requires inspection; never silently steal');throw e;}
    finally{if(fd!==undefined)fs.closeSync(fd);}
  }
  function release(){
    if(!ownsLock)return;if(!lockOwned())throw err('SUPERVISOR_LOCK_LOST');
    fs.unlinkSync(lock);ownsLock=false;
  }
  async function observe(){
    assertActive();const out={};for(const n of ORDER){if(!ws.components[n].enabled){out[n]={state:'disabled'};continue;}
      try{out[n]=safeStatus(await adapters[n].inspect({workspace:ws}),n);}catch(e){out[n]={state:'unknown',reason:e.code||'PROBE_FAILED'};}
    }return {schema:SUPERVISOR_SCHEMA,workspaceId:ws.id,observedAt:stamp(),components:out};
  }
  // Requires the caller's explicit launch authority. This is NOT provider-send permission.
  async function start({authorization}={}){
    assertActive();if(ownsLock)return {alreadyOwner:true,...await observe()};
    if(await authorizeLaunch({workspace:ws,authorization})!==true)throw err('SUPERVISOR_START_NOT_AUTHORIZED');
    try { takeLock(); } catch(error) {
      if(error.code!=='SUPERVISOR_ALREADY_OWNED')throw error;
      // A second CLI invocation reports observed health but never adopts the other owner's lock.
      // A stale lock remains an explicit diagnostic; no automatic takeover.
      return {alreadyOwner:true,ownership:'external_or_stale_lock',...await observe()};
    }
    try{
      const before=await observe();for(const n of ORDER){if(!ws.components[n].enabled)continue;
        const status=before.components[n];
        if(status.state==='healthy')continue; // existing process adopted read-only; never claim ownership
        if(status.state!=='stopped'){
          if(REQUIRED.has(n))throw err('SUPERVISOR_REQUIRED_UNAVAILABLE',n+': '+status.state);
          continue; // Optional components degrade without unsafe launch.
        }
        // Only the trusted existing launcher can start the exact configured service.
        const launched=await adapters[n].start({workspace:ws,authorization});
        if(!launched||typeof launched.instanceId!=='string'||!ID.test(launched.instanceId))throw err('SUPERVISOR_LAUNCH_UNVERIFIED',n);
        // Register newly launched process before health verification so shutdown can preserve authority.
        owned.set(n,{instanceId:launched.instanceId});record('component.started');
        const check=safeStatus(await adapters[n].inspect({workspace:ws}),n);
        if(check.state!=='healthy'||check.instanceId!==launched.instanceId)throw err('SUPERVISOR_LAUNCH_UNVERIFIED',n);
      }
      record('started');return {alreadyOwner:false,...await observe()};
    }catch(e){record('start.incomplete');throw e;}
  }
  async function stop({authorization}={}){
    assertActive();if(!ownsLock)return {stopped:[],refused:['not-owner']};
    if(!lockOwned())throw err('SUPERVISOR_LOCK_LOST');
    if(await authorizeLaunch({workspace:ws,authorization,operation:'stop'})!==true)throw err('SUPERVISOR_STOP_NOT_AUTHORIZED');
    const stopped=[],refused=[];
    for(const n of [...ORDER].reverse()){
      const mine=owned.get(n);if(!mine)continue;
      let v;try{v=safeStatus(await adapters[n].inspect({workspace:ws}),n);}catch{refused.push(n);continue;}
      if(v.state==='stopped'){owned.delete(n);stopped.push(n);continue;}
      if(v.state!=='healthy'||v.instanceId!==mine.instanceId){refused.push(n);continue;}
      // No kill-by-PID; adapter must verify its own immutable process identity before stopping.
      try{const result=await adapters[n].stop({workspace:ws,instanceId:mine.instanceId,authorization});
        if(result?.stopped!==true){refused.push(n);continue;}owned.delete(n);stopped.push(n);
      }catch{refused.push(n);}
    }
    record('stop.requested');
    if(!refused.length)release();return {stopped,refused};
  }
  // Explicit read-only crash analysis. No stale lock reclaim, restart or queue retry.
  function recoveryPlan({bridge=[],journal=[]}={}){
    if(!Array.isArray(bridge)||!Array.isArray(journal))throw err('SUPERVISOR_RECOVERY_INVALID');
    const uncertain=new Set(journal.filter(x=>x?.submitted==='unknown'||x?.state==='uncertain').map(x=>x.requestId).filter(Boolean));
    const claimed=bridge.filter(x=>x?.status==='claimed').map(x=>x.id).filter(Boolean);
    return {schema:SUPERVISOR_SCHEMA,workspaceId:ws.id,action:'manual_read_only_reconciliation',
      uncertainRequestIds:[...uncertain].sort(),claimedCommandIds:[...new Set(claimed)].sort(),
      automaticResends:0,automaticLockTakeovers:0};
  }
  function close(){if(closed)return;if(owned.size)throw err('SUPERVISOR_STILL_OWNS_SERVICES');if(ownsLock)release();closed=true;}
  return {schema:SUPERVISOR_SCHEMA,workspace:ws,observe,start,stop,recoveryPlan,close,
    ownerId, owned:()=>[...owned].map(([name,x])=>({name,instanceId:x.instanceId}))};
}
