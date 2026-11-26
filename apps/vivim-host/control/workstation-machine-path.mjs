// Explicit owner-machine policy, shared by incumbent Host file and terminal ports.
// Scope is locally approved; this is not an OS sandbox or an authorization issuer.
import {win32 as p} from 'node:path';
import {lstatSync,realpathSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fail=()=>{throw Error('WORKSTATION_MACHINE_PATH_REFUSED')};
const exact=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===k.length&&k.every(x=>Object.hasOwn(v,x));
const component=x=>x&&x!=='.'&&x!=='..'&&!/[. ]$/.test(x)&&!/[\\/:*?"<>|\x00-\x1f]/.test(x)&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(x);
export function machinePath(value){
 if(typeof value!=='string'||value.length>1024||! /^[a-z]:[\\/]/i.test(value))fail();
 const parts=value.slice(3).replace(/\\/g,'/').replace(/\/$/,'').split('/');
 if(parts.length===1&&parts[0]==='')return value[0].toUpperCase()+':\\';
 if(!parts.every(component))fail();
 return value[0].toUpperCase()+':\\'+parts.join('\\');
}
const key=x=>machinePath(x).replace(/\\$/,'').toLowerCase();
const within=(a,b)=>key(a)===key(b)||key(b).startsWith(key(a)+'\\');
export function validateMachineScope(scope,now=Date.now()){
 if(!exact(scope,['schema','expiresAt','protectedPaths'])||scope.schema!=='vivim.owner-machine-scope/1'||(scope.expiresAt!==null&&(!Number.isSafeInteger(scope.expiresAt)||scope.expiresAt<=now||scope.expiresAt-now>86400000))||!Array.isArray(scope.protectedPaths)||scope.protectedPaths.length<2||scope.protectedPaths.length>32)fail();
 const seen=new Set();
 for(const v of scope.protectedPaths){const k=key(v);if(k.length<=2||seen.has(k))fail();seen.add(k);}
 return scope;
}
export function machineTarget(value,scope,now=Date.now()){
 validateMachineScope(scope,now);
 const full=machinePath(value);
 if(scope.protectedPaths.some(x=>within(x,full)))fail();
 const relative=full.slice(3).replace(/\\/g,'/');
 return {full,root:p.parse(full).root,relative:relative||'.'};
}
export function machineBatchTarget(base,relative,scope,now=Date.now()){
 if(typeof relative!=='string'||!relative.split('/').every(component))fail();
 return machineTarget(p.join(machinePath(base),...relative.split('/')),scope,now);
}
// Resolve every existing component for native file operations too. An alias
// (including an 8.3 short name) must not escape the protected-path comparison.
// Only a final nonexistent component can be forwarded for create/write.
export function verifyMachineFileTarget(value,scope,now=Date.now()){
 if(process.platform!=='win32')fail();
 const target=machineTarget(value,scope,now);
 let current=target.root;
 const parts=target.full.slice(target.root.length).split('\\').filter(Boolean);
 for(let i=0;i<parts.length;i++){
  current=p.join(current,parts[i]);
  let st;
  try{st=lstatSync(current)}catch(e){if(e?.code==='ENOENT'&&i===parts.length-1)return target;fail();}
  if(st.isSymbolicLink()||key(realpathSync(current))!==key(current))fail();
  machineTarget(realpathSync(current),scope,now);
 }
 return target;
}
export function machineProgramSelector(v){
 return typeof v==='string'&&v.length<=1024&&(/^[a-z0-9][a-z0-9_.-]{0,127}$/i.test(v)||(()=>{try{return p.extname(machinePath(v)).toLowerCase()==='.exe'}catch{return false}})());
}
function existing(value,kind,scope,now){
 if(process.platform!=='win32')fail();
 const {full,root}=machineTarget(value,scope,now);
 let current=root;
 for(const part of full.slice(root.length).split('\\').filter(Boolean)){
  current=p.join(current,part);const st=lstatSync(current);
  if(st.isSymbolicLink()||key(realpathSync(current))!==key(current))fail();
 }
 const st=lstatSync(full);
 if(kind==='directory'?!st.isDirectory():!st.isFile())fail();
 return {path:realpathSync(full),stat:st};
}
export function resolveMachineCwd(value,scope,now){return existing(value,'directory',scope,now).path;}
export function resolveMachineProgram(value,scope,env,now){
 if(!machineProgramSelector(value))fail();
 const pathKey=Object.keys(env).find(k=>k.toUpperCase()==='PATH');
 const candidates=/^[a-z]:[\\/]/i.test(value)?[value]:(String(env[pathKey]??'').split(';').filter(Boolean).map(d=>p.join(d.replace(/^"|"$/g,''),value.toLowerCase().endsWith('.exe')?value:value+'.exe')));
 for(const candidate of candidates){
  try{
   const f=existing(candidate,'file',scope,now);
   if(p.extname(f.path).toLowerCase()!=='.exe'||f.stat.size<1||f.stat.size>256*1024*1024)continue;
   const bytes=readFileSync(f.path);
   const after=lstatSync(f.path);
   if(bytes.length!==f.stat.size||after.size!==f.stat.size||after.mtimeMs!==f.stat.mtimeMs)fail();
   return {path:f.path,sha:createHash('sha256').update(bytes).digest('hex')};
  }catch{}
 }
 fail();
}
