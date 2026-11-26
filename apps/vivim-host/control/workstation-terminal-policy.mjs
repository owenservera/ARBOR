// Explicit local policy for general argv sessions. The old recipe grant never
// confers terminal authority. This is a developer capability, not a sandbox.
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync,lstatSync,statSync} from 'node:fs';
import {isAbsolute,resolve,relative,sep,extname} from 'node:path';
import {validateMachineScope,resolveMachineCwd,resolveMachineProgram} from './workstation-machine-path.mjs';
import {normalizeTerminalRequest} from './workstation-terminal-request.mjs';
const fail=code=>Object.assign(Error(code),{code,status:409});
const hash=b=>createHash('sha256').update(b).digest('hex');
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(v,keys)=>obj(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const programId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(x);
const rootId=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(x);
const envNames=new Set(['SYSTEMROOT','WINDIR','PATH','PATHEXT','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','TEMP','TMP','CARGO_HOME','RUSTUP_HOME','RUSTUP_TOOLCHAIN','CARGO_TARGET_DIR','GIT_CONFIG_NOSYSTEM','LANG','LC_ALL','TERM','NO_COLOR','RUST_BACKTRACE']);
function pinned(path,expected,max){
 if(typeof path!=='string'||!isAbsolute(path)||!sha(expected))throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
 const before=lstatSync(path);if(!before.isFile()||before.isSymbolicLink()||before.size<1||before.size>max)throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
 const canonical=realpathSync(path),bytes=readFileSync(canonical);
 if(bytes.length>max||hash(bytes)!==expected)throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
 return {path:canonical,bytes,sha:expected};
}
export function validateTerminalPolicy(p,now){
 const fields=['schema','enabled','expiresAt','programs','roots','maxTimeoutMs','allowInteractive'];
 if(!(exact(p,fields)||exact(p,[...fields,'machineScope']))||
    p.schema!=='vivim.workstation-terminal-policy/1'||p.enabled!==true||
    !(p.expiresAt===null?p.machineScope!==undefined:Number.isSafeInteger(p.expiresAt)&&p.expiresAt>now&&p.expiresAt-now<=86400000)||
    !Number.isSafeInteger(p.maxTimeoutMs)||p.maxTimeoutMs<100||p.maxTimeoutMs>1800000||
    typeof p.allowInteractive!=='boolean'||!Array.isArray(p.programs)||p.programs.length<1||p.programs.length>64||
    !Array.isArray(p.roots)||p.roots.length<1||p.roots.length>16)throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
 if(p.machineScope!==undefined){try{validateMachineScope(p.machineScope,now);if(p.machineScope.expiresAt!==p.expiresAt)throw Error()}catch{throw fail('WORKSTATION_TERMINAL_POLICY_INVALID')}}
 const programs=new Set(),roots=new Set();
 for(const v of p.programs){
  if(!(exact(v,['id','path','sha256','environment'])||exact(v,['id','path','sha256','environment','toolchain']))||!programId(v.id)||programs.has(v.id.toLowerCase())||
    typeof v.path!=='string'||!isAbsolute(v.path)||!sha(v.sha256)||!Array.isArray(v.environment)||v.environment.length>32||
    v.environment.some(n=>typeof n!=='string'||!envNames.has(n.toUpperCase()))||
    new Set(v.environment.map(n=>n.toUpperCase())).size!==v.environment.length)throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
  if(v.toolchain!==undefined&&(!exact(v.toolchain,['rustc','rustdoc'])||!['rustc','rustdoc'].every(n=>exact(v.toolchain[n],['path','sha256'])&&typeof v.toolchain[n].path==='string'&&isAbsolute(v.toolchain[n].path)&&sha(v.toolchain[n].sha256))))throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
  programs.add(v.id.toLowerCase());
 }
 for(const v of p.roots){
  if(!exact(v,['id','path'])||!rootId(v.id)||roots.has(v.id)||typeof v.path!=='string'||!isAbsolute(v.path))throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
  roots.add(v.id);
 }
 return p;
}
function inside(root,candidate){
 const rel=relative(root,candidate);
 return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep));
}
export function createTerminalPolicy({env=process.env,now=Date.now}={}){
 function load(){
  if(!env.VIVIM_WORKSTATION_TERMINAL_POLICY||!env.VIVIM_WORKSTATION_TERMINAL_POLICY_SHA256)throw fail('WORKSTATION_TERMINAL_DISABLED');
  try{
   const f=pinned(env.VIVIM_WORKSTATION_TERMINAL_POLICY,env.VIVIM_WORKSTATION_TERMINAL_POLICY_SHA256,65536);
   if(process.platform!=='win32'&&(lstatSync(f.path).mode&0o077))throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
   const p=validateTerminalPolicy(JSON.parse(f.bytes.toString('utf8')),now());
   return {policy:p,configSha:f.sha};
  }catch(e){if(e?.code?.startsWith('WORKSTATION_TERMINAL_'))throw e;throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');}
 }
 function bind(input){
  const request=normalizeTerminalRequest(input),{policy,configSha}=load();
  const program=policy.programs.find(p=>p.id===request.program),root=policy.roots.find(r=>r.id===request.root_id);
  if(request.root_id==='machine'){
   if(!policy.machineScope||request.timeout_ms>policy.maxTimeoutMs||(policy.expiresAt!==null&&request.timeout_ms>policy.expiresAt-now())||request.interactive&&!policy.allowInteractive)throw fail('WORKSTATION_TERMINAL_NOT_GRANTED');
   try{
    const workspace=resolveMachineCwd(request.cwd,policy.machineScope,now());
    const executable=resolveMachineProgram(program?.path??request.program,policy.machineScope,env,now());
    if(program&&executable.sha!==program.sha256)throw Error();
    return {request,configSha,executable,workspace,environmentNames:program?.environment??['SystemRoot','WINDIR','PATH','PATHEXT','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','TEMP','TMP','LANG','TERM','NO_COLOR'],toolchain:program?.toolchain??null,expiresAt:policy.expiresAt};
   }catch{throw fail('WORKSTATION_TERMINAL_CWD_INVALID')}
  }
  if(!program||!root||request.timeout_ms>policy.maxTimeoutMs||(policy.expiresAt!==null&&request.timeout_ms>policy.expiresAt-now())||request.interactive&&!policy.allowInteractive)throw fail('WORKSTATION_TERMINAL_NOT_GRANTED');
  try{
   const executable=pinned(program.path,program.sha256,256*1024*1024);
   if(process.platform==='win32'&&extname(executable.path).toLowerCase()!=='.exe')throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
   const rootPath=realpathSync(root.path);
   if(!statSync(rootPath).isDirectory())throw fail('WORKSTATION_TERMINAL_POLICY_INVALID');
   // Reject symlink/junction traversal at the initial cwd. The admitted
   // program itself has local-user privileges; this is not sandboxing.
   let current=rootPath;
   if(request.cwd!=='.')for(const component of request.cwd.split('/')){
    const next=resolve(current,component),st=lstatSync(next),actual=realpathSync(next);
    if(st.isSymbolicLink()||!st.isDirectory()||!inside(rootPath,actual))throw fail('WORKSTATION_TERMINAL_CWD_INVALID');
    current=actual;
   }
   if(!inside(rootPath,current))throw fail('WORKSTATION_TERMINAL_CWD_INVALID');
   return {request,configSha,executable:{path:executable.path,sha:executable.sha},workspace:current,environmentNames:[...program.environment],toolchain:program.toolchain??null,expiresAt:policy.expiresAt};
  }catch(e){if(e?.code?.startsWith('WORKSTATION_TERMINAL_'))throw e;throw fail('WORKSTATION_TERMINAL_CWD_INVALID');}
 }
 return Object.freeze({bind,current:()=>load().configSha});
}
