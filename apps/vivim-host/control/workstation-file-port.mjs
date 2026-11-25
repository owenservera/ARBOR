// Thin Host bridge. Locally configured exact root and native helper.
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync,lstatSync,statSync} from 'node:fs';
import {isAbsolute,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
export const FILE_READ='workstation.file.read',FILE_INSPECT='workstation.file.inspect',DIR_LIST='workstation.directory.list',
 DIR_CREATE='workstation.directory.create',FILE_WRITE='workstation.file.write',FILE_EDIT='workstation.file.edit';
export const WORKSTATION_FILE_ACTIONS=new Set([FILE_READ,FILE_INSPECT,DIR_LIST,DIR_CREATE,FILE_WRITE,FILE_EDIT]);
export const WORKSTATION_FILE_READS=new Set([FILE_READ,FILE_INSPECT,DIR_LIST]);
const operations=new Map([[FILE_READ,'read'],[FILE_INSPECT,'inspect'],[DIR_LIST,'list'],[DIR_CREATE,'mkdir'],[FILE_WRITE,'write'],[FILE_EDIT,'edit']]);
const fail=(code,status=409)=>Object.assign(Error(code),{code,status});
const hash=b=>createHash('sha256').update(b).digest('hex'),digest=x=>hash(JSON.stringify(x));
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function pinned(file,expected,limit){
 if(typeof file!=='string'||!isAbsolute(file)||!sha(expected))throw fail('WORKSTATION_FILE_DISABLED');
 const p=realpathSync(file),st=lstatSync(p);if(!st.isFile()||st.isSymbolicLink()||st.size<1||st.size>limit)throw fail('WORKSTATION_FILE_BINDING_INVALID');
 const bytes=readFileSync(p);if(hash(bytes)!==expected)throw fail('WORKSTATION_FILE_BINDING_INVALID');return {path:p,bytes,sha:expected};
}
export function createWorkstationFilePort({env=process.env,run=spawnSync}={}){
 function resolve(rootId){
  try{
   const config=pinned(env.VIVIM_WORKSTATION_ROOTS,env.VIVIM_WORKSTATION_ROOTS_SHA256,65536);
   const helper=pinned(env.VIVIM_WORKSTATION_FILES_EXE,env.VIVIM_WORKSTATION_FILES_SHA256,64*1024*1024);
   if(!/^vivim-workstation-files(?:\.exe)?$/i.test(basename(helper.path)))throw fail('WORKSTATION_FILE_BINDING_INVALID');
   const data=JSON.parse(config.bytes.toString('utf8'));
   if(data?.schema!=='vivim.workstation-roots/1'||!Array.isArray(data.roots)||data.roots.length<1||data.roots.length>16)throw Error();
   const entries=data.roots.filter(r=>r?.id===rootId);
   if(entries.length!==1||typeof entries[0].path!=='string'||!isAbsolute(entries[0].path))throw fail('WORKSTATION_ROOT_NOT_GRANTED');
   const root=realpathSync(entries[0].path);if(!statSync(root).isDirectory())throw Error();
   return {root,rootId,configSha:config.sha,helperPath:helper.path,helperSha:helper.sha};
  }catch(e){if(e?.code?.startsWith('WORKSTATION_'))throw e;throw fail('WORKSTATION_FILE_BINDING_INVALID');}
 }
 function request(action,args,b,phase){
  const op=operations.get(action);if(!op||typeof args.path!=='string'||args.path.length>1024)throw fail('WORKSTATION_FILE_INPUT_INVALID');
  const input={root:b.root,path:args.path,op,phase};
  if(action===FILE_WRITE||action===FILE_EDIT)input.expectedDigest=args.expected_digest;
  if(action===FILE_WRITE)input.content=args.content;
  if(action===FILE_EDIT){input.oldText=args.old_text;input.newText=args.new_text;}
  const childEnv={};if(process.platform==='win32'&&process.env.SystemRoot)childEnv.SystemRoot=process.env.SystemRoot;
  const r=run(b.helperPath,[],{input:JSON.stringify(input),encoding:'utf8',env:childEnv,shell:false,windowsHide:true,timeout:10000,maxBuffer:524288});
  if(r.error||r.status!==0)throw fail('WORKSTATION_FILE_OUTCOME_UNCERTAIN',503);
  let reply;try{reply=JSON.parse(r.stdout);}catch{throw fail('WORKSTATION_FILE_OUTCOME_UNCERTAIN',503);}
  if(reply?.schema!=='vivim.workstation-file-native/1'||typeof reply.ok!=='boolean')throw fail('WORKSTATION_FILE_OUTCOME_UNCERTAIN',503);
  if(!reply.ok)throw fail('WORKSTATION_FILE_'+(/^[A-Z_]{3,64}$/.test(reply.code||'')?reply.code:'REFUSED'),phase==='apply'?503:409);
  if(!reply.result||typeof reply.result!=='object'||Array.isArray(reply.result))throw fail('WORKSTATION_FILE_OUTCOME_UNCERTAIN',503);
  return reply.result;
 }
 function prepare(action,args){
  if(WORKSTATION_FILE_READS.has(action))throw fail('WORKSTATION_FILE_INPUT_INVALID');
  const b=resolve(args.root_id),preview=request(action,args,b,'preview');
  return {schema:'vivim.workstation-file-binding/1',rootId:b.rootId,configSha:b.configSha,preview,bindingDigest:digest({b,action,args,preview})};
 }
 function read(action,args){if(!WORKSTATION_FILE_READS.has(action))throw fail('WORKSTATION_FILE_INPUT_INVALID');const b=resolve(args.root_id);return {schema:'vivim.workstation-file-read/1',rootId:b.rootId,configSha:b.configSha,path:args.path,...request(action,args,b,'read')};}
 function mutate(action,args,binding){
  const current=prepare(action,args);if(digest(current)!==digest(binding))throw fail('WORKSTATION_FILE_BINDING_STALE');
  const b=resolve(args.root_id);
  if(digest({b,action,args,preview:current.preview})!==current.bindingDigest)throw fail('WORKSTATION_FILE_BINDING_STALE');
  const result=request(action,args,b,'apply');
  if(digest(result)!==digest(current.preview))throw fail('WORKSTATION_FILE_OUTCOME_UNCERTAIN',503);
  return {schema:'vivim.workstation-file-receipt/1',rootId:b.rootId,path:args.path,...result};
 }
 return Object.freeze({prepare,read,mutate});
}
