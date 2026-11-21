// Bounded diagnostic evidence for the read-only first-customer Wiki experience.
// This is NOT the product journal, an effect receipt, an agent transcript, or
// proof a human saw the screen. The LiveSystemState project can ingest these
// observations without acquiring a second execution authority.
import {mkdir,appendFile,stat,rename} from 'node:fs/promises';
import path from 'node:path';

const STAGES=new Set(['input','wasm-ready','wasm-error','search-start','source-ok',
  'source-error','rust-ok','rust-error','render-matches','render-empty',
  'render-error','read-only-send-blocked']);
const MAX_EVENT_BYTES=768,MAX_LOG_BYTES=1024*1024;
const UINT=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
let queue=Promise.resolve();
export function validateFirstContactObservation(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||
      Object.keys(value).some(k=>!['stage','length','matches','revision','elapsedMs','code'].includes(k))||
      !STAGES.has(value.stage)||
      (value.length!==undefined&&(!UINT(value.length)||value.length>1000))||
      (value.matches!==undefined&&!UINT(value.matches))||
      (value.revision!==undefined&&!UINT(value.revision))||
      (value.elapsedMs!==undefined&&!UINT(value.elapsedMs))||
      (value.code!==undefined&&
        (typeof value.code!=='string'||!/^[A-Z0-9_]{1,48}$/.test(value.code))))return null;
  return Object.freeze({...value});
}
export function createFirstContactObservations(dataRoot){
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot))
    throw Error('OBSERVATION_DATA_ROOT_INVALID');
  const file=path.join(dataRoot,'diagnostics','first-contact-events.jsonl');
  const append=input=>{
    const event=validateFirstContactObservation(input);
    if(!event)return Promise.reject(Object.assign(Error('OBSERVATION_INVALID'),{status:400}));
    const record=JSON.stringify({schema:'vivim.first-contact-observation/1',
      time:new Date().toISOString(),origin:'owner-tailnet-http', // Transport identity only; NOT proof of a physical phone.
      ...event})+'\n';
    if(Buffer.byteLength(record)>MAX_EVENT_BYTES)
      return Promise.reject(Object.assign(Error('OBSERVATION_INVALID'),{status:400}));
    // Serialize log rotation and writes. No text, bearer, IP, browser key,
    // session token, Wiki content or control authorization is persisted.
    const task=queue.catch(()=>{}).then(async()=>{
      await mkdir(path.dirname(file),{recursive:true});
      const size=await stat(file).then(s=>s.size).catch(e=>{
        if(e.code==='ENOENT')return 0;throw e;
      });
      if(size+Buffer.byteLength(record)>MAX_LOG_BYTES)
        await rename(file,file+'.previous').catch(e=>{
          if(e.code!=='ENOENT')throw e;
        });
      await appendFile(file,record,{encoding:'utf8',mode:0o600});
    });
    queue=task;return task;
  };
  return {append,file};
}
