// Reconstructible owner-scoped JSON file view of the Rust LiveSystemState.
// NO effect execution, permission grants, new journal, or source-of-truth store.
// Future watcher can submit candidates only through Rust + existing Host plans.
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {mkdir,lstat,open,rename} from 'node:fs/promises';
import {constants} from 'node:fs';
import {runNativeProductPure} from './native-product-pure.mjs';

const MAX_FILE=512*1024;
const FILE_SCHEMA='vivim.live-system-state/1';
const VIEW_SCHEMA='vivim.host-live-system/1';
const ALLOWED=new Set(['host.health','wiki.summary','pwa.input','pwa.view']);
const fail=code=>Object.assign(Error(code),{code});
const own=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
  Object.getPrototypeOf(o)===Object.prototype;
const boundedInt=n=>Number.isSafeInteger(n)&&n>=0;
function safeView(view){
  if(view?.schema!==VIEW_SCHEMA||view.state!=='source-backed'||
     view.authority!=='read-only-projection'||view.executionAuthorized!==false||
     view.effectPerformed!==false||view.coverage?.complete!==false||
     !/^[a-zA-Z0-9._:-]{1,128}$/.test(view.epoch||'')||
     !boundedInt(view.revision)||!Array.isArray(view.regions)||
     view.regions.length>4||view.regions.some(r=>!ALLOWED.has(r?.id)||
       r?.exposure!=='owner'||!Array.isArray(r?.writable)||r.writable.length!==0))
    throw fail('LIVE_MIRROR_UNTRUSTED_VIEW');
  const state={schema:FILE_SCHEMA,epoch:view.epoch,sequence:view.revision,
    regions:view.regions};
  const bytes=Buffer.from(JSON.stringify(state,null,2)+'\n','utf8');
  if(bytes.length>MAX_FILE)throw fail('LIVE_MIRROR_SIZE_LIMIT');
  return {state,bytes};
}
export function createLiveSystemFileMirror({
  dataRoot, compute=runNativeProductPure
}={}){
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||typeof compute!=='function')
    throw fail('LIVE_MIRROR_DEPENDENCY');
  const dir=path.join(dataRoot,'live-system');
  const file=path.join(dir,'owner.current.json');
  let canonical=null;
  let work=Promise.resolve();
  async function prepare(){
    await mkdir(dir,{recursive:true,mode:0o700});
    const st=await lstat(dir);
    if(!st.isDirectory()||st.isSymbolicLink())throw fail('LIVE_MIRROR_UNSAFE_DIRECTORY');
  }
  async function writeAtomic(bytes){
    await prepare();
    const tmp=path.join(dir,'.owner.'+randomBytes(12).toString('hex')+'.tmp');
    let handle;
    try {
      handle=await open(tmp,'wx',0o600);
      await handle.writeFile(bytes);
      await handle.sync();
      await handle.close();handle=null;
      // Rename over the old projection. A crash can leave a stray temp file,
      // never a partially overwritten canonical JSON document.
      await rename(tmp,file);
    } finally {
      if(handle)await handle.close();
      // Stray temps are not necessary for reconstruction; avoid deleting an
      // unknown path here (the Host can clean its own temp files later).
    }
  }
  function publish(view){
    // Serialize writers and preserve the canonical in-memory snapshot even
    // across rapidly repeated Host reads.
    const operation=work.then(async()=>{
      const {state,bytes}=safeView(view);
      await writeAtomic(bytes);
      canonical=state;
      return {state:'written',schema:FILE_SCHEMA,sequence:state.sequence};
    });
    work=operation.then(()=>{},()=>{});
    return operation;
  }
  function admitEdited() {
    // Serialize reads against snapshot exports. The file cannot race a Host
    // writer while admission is constructing the exact canonical comparison.
    const operation=work.then(async()=>{
    // No caller-selected path, no browser-visible filesystem API. This is
    // inert admission against the LAST Host-emitted canonical state.
    if(!canonical)throw fail('LIVE_MIRROR_NOT_PUBLISHED');
    await prepare();
    let st;
    try{st=await lstat(file)}catch{throw fail('LIVE_MIRROR_FILE_MISSING')}
    if(!st.isFile()||st.isSymbolicLink()||st.size>MAX_FILE)
      throw fail('LIVE_MIRROR_FILE_INVALID');
    const fd=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
    let bytes;try{
      const opened=await fd.stat();
      if(!opened.isFile()||opened.size>MAX_FILE)throw fail('LIVE_MIRROR_FILE_INVALID');
      bytes=await fd.readFile();
    }finally{await fd.close();}
    if(bytes.length>MAX_FILE)throw fail('LIVE_MIRROR_SIZE_LIMIT');
    let edited;try{edited=JSON.parse(bytes.toString('utf8'))}
    catch{throw fail('LIVE_MIRROR_INVALID_JSON')}
    if(!own(edited)||edited.schema!==FILE_SCHEMA)
      throw fail('LIVE_MIRROR_INVALID_DOCUMENT');
    const response=await compute('live-system',{schema:'vivim.live-system-request/1',
      operation:'admit-edit',state:canonical,edited,correlationId:'file.edit'});
    if(response?.schema!=='vivim.product-pure-response/1'||
       response.operation!=='live-system'||
       response.authority!=='none'||response.executionAuthorized!==false||
       response.effectPerformed!==false ||
       response.result?.schema!=='vivim.live-system-computation/1' ||
       response.result.authority!=='none' ||
       response.result.executionAuthorized!==false ||
       response.result.effectPerformed!==false)
      throw fail('LIVE_MIRROR_NATIVE_UNAVAILABLE');
    if(response.result.state==='refused')
      return {state:'refused',reason:String(response.result.reason||'INVALID_EDIT').slice(0,80),
        executionAuthorized:false,effectPerformed:false};
    if(response.result.state!=='computed'||!Array.isArray(response.result.result?.commands))
      throw fail('LIVE_MIRROR_NATIVE_INVALID');
    return {state:'candidate',commands:response.result.result.commands,
      executionAuthorized:false,effectPerformed:false};
    });
    work=operation.then(()=>{},()=>{});
    return operation;
  }
  return Object.freeze({file,publish,admitEdited});
}