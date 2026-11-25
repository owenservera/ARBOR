// Fixed first workstation command. Host dispatcher owns approval, claim and receipt.
// Local operator configures the exact native helper and SHA-256; no caller executable,
// command string, path, environment, or shell is accepted. Disabled by default.
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {isAbsolute,basename} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const fail=code=>Object.assign(Error(code),{code,status:409});
export const WORKSTATION_PROCESS_ACTION='workstation.process.start';
const recipe='node-version';
function bindingDigest(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
export function createWorkstationProcessPort({env=process.env, node=process.execPath, run=execute}={}){
 function resolve(){
  const binary=env.VIVIM_WORKSTATION_PROBE_EXE,expected=env.VIVIM_WORKSTATION_PROBE_SHA256;
  if(typeof binary!=='string'||!isAbsolute(binary)||typeof expected!=='string'||!/^[a-f0-9]{64}$/.test(expected))
   throw fail('WORKSTATION_PROCESS_DISABLED');
  try{
   const helper=realpathSync(binary),runtime=realpathSync(node);
   if(!/^vivim-workstation-probe(?:\.exe)?$/i.test(basename(helper))||
      !/^node(?:\.exe)?$/i.test(basename(runtime))||!statSync(runtime).isFile())throw Error();
   const stat=statSync(helper);
   if(!stat.isFile()||stat.size<1||stat.size>32*1024*1024||
      createHash('sha256').update(readFileSync(helper)).digest('hex')!==expected)throw Error();
   return {helper,runtime,expected};
  }catch{throw fail('WORKSTATION_PROCESS_BINDING_INVALID');}
 }
 function prepare(args){
  if(args?.recipe!==recipe||Object.keys(args).length!==1)throw fail('WORKSTATION_RECIPE_INVALID');
  const b=resolve();
  return {schema:'vivim.workstation-process-binding/1',recipe,bindingDigest:bindingDigest(b)};
 }
 async function start(args,binding){
  const current=prepare(args);
  if(binding?.schema!==current.schema||binding.recipe!==recipe||binding.bindingDigest!==current.bindingDigest)
   throw fail('WORKSTATION_PROCESS_BINDING_STALE');
  const b=resolve();
  if(bindingDigest(b)!==current.bindingDigest)throw fail('WORKSTATION_PROCESS_BINDING_STALE');
  // Do not forward the Host's owner token or tunnel credentials to the child.
  const childEnv={};
  if(process.platform==='win32'&&process.env.SystemRoot)childEnv.SystemRoot=process.env.SystemRoot;
  let result;
  try{result=await run(b.helper,['--node-version',b.runtime],{cwd:undefined,env:childEnv,
    shell:false,windowsHide:true,encoding:'utf8',timeout:15000,maxBuffer:16384});}
  catch{throw Object.assign(Error('WORKSTATION_PROCESS_OUTCOME_UNCERTAIN'),{code:'WORKSTATION_PROCESS_OUTCOME_UNCERTAIN'});}
  let data;
  try{data=JSON.parse(result.stdout)}catch{}
  if(data?.schema!=='vivim.workstation-probe/1'||data.recipe!==recipe||
     data.exitCode!==0||typeof data.version!=='string'||!/^v[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/.test(data.version)||
     data.version.length>80)
   throw Object.assign(Error('WORKSTATION_PROCESS_OUTCOME_UNCERTAIN'),{code:'WORKSTATION_PROCESS_OUTCOME_UNCERTAIN'});
  return {schema:'vivim.workstation-process-result/1',recipe,exitCode:0,version:data.version};
 }
 return Object.freeze({prepare,start});
}
