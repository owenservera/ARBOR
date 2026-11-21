// Read-only adapter over the first-contact PWA's EXISTING Host diagnostic log.
// It never reads typed words or promotes a diagnostic to an effect receipt.
import path from 'node:path';
import {lstat,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const MAX_BYTES=1024*1024;
const FIELDS=new Set(['schema','time','origin','stage','length','matches','revision','elapsedMs','code']);
const INPUT=new Set(['input']);
const VISUAL=new Set(['render-matches','render-empty','render-error']);
const validUInt=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
const fail=code=>Object.assign(Error(code),{code});
function clean(record) {
  if(record?.schema!=='vivim.first-contact-observation/1' ||
     Object.keys(record).some(k=>!FIELDS.has(k)) ||
     record.origin!=='owner-tailnet-http' ||
     ![...INPUT,...VISUAL].includes(record.stage) ||
     typeof record.time!=='string' ||
     !Number.isFinite(Date.parse(record.time)) ||
     (record.length!==undefined&&(!validUInt(record.length)||record.length>1000)) ||
     (record.matches!==undefined&&!validUInt(record.matches)) ||
     (record.revision!==undefined&&!validUInt(record.revision)) ||
     (record.code!==undefined&&
       (typeof record.code!=='string'||!/^[A-Z0-9_]{1,48}$/.test(record.code))))
     return null;
  // Explicit reconstruction; unknown properties (including input text)
  // are NOT transferred to the system state.
  return {stage:record.stage,time:record.time,
    ...(record.length===undefined?{}:{length:record.length}),
    ...(record.matches===undefined?{}:{matches:record.matches}),
    ...(record.revision===undefined?{}:{wikiRevision:record.revision}),
    ...(record.code===undefined?{}:{code:record.code})};
}
export function createFirstContactLiveSource({dataRoot,clock=()=>Date.now()}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot))
    throw fail('LIVE_FIRST_CONTACT_ROOT');
  const file=path.join(dataRoot,'diagnostics','first-contact-events.jsonl');
  const versions={input:{digest:null,revision:0},visual:{digest:null,revision:0}};
  async function read() {
    let stat;
    try { stat=await lstat(file); }
    catch(e) { if(e?.code==='ENOENT')return [];throw fail('LIVE_FIRST_CONTACT_READ'); }
    if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_BYTES)
      throw fail('LIVE_FIRST_CONTACT_SOURCE_INVALID');
    const text=await readFile(file,'utf8');
    if(Buffer.byteLength(text,'utf8')>MAX_BYTES)throw fail('LIVE_FIRST_CONTACT_SOURCE_INVALID');
    // A concurrent append may leave an incomplete tail. Do not treat it as
    // a completed observation; inspect only newline-terminated records.
    const complete=text.slice(0,text.lastIndexOf('\n')+1);
    const latest={input:null,visual:null};
    const lines=complete.split('\n');
    // The Host log is capped and rotated by the existing source owner.
    for(let i=lines.length-1;i>=0;i--) {
      const line=lines[i];if(!line)continue;
      if(latest.input&&latest.visual)break;
      let raw;try{raw=JSON.parse(line)}catch{continue}
      const data=clean(raw);if(!data)continue;
      const group=INPUT.has(data.stage)?'input':'visual';
      if(!latest[group])latest[group]=data;
    }
    const observedAtMs=clock();
    if(!Number.isSafeInteger(observedAtMs)||observedAtMs<=0)
      throw fail('LIVE_FIRST_CONTACT_CLOCK');
    const result=[];
    for(const [name,id,kind] of [['input','pwa.input','input'],['visual','pwa.view','visual']]) {
      const data=latest[name];if(!data)continue;
      const hash=createHash('sha256').update(JSON.stringify(data)).digest('hex');
      const version=versions[name];
      if(version.digest!==hash){
        if(version.revision===Number.MAX_SAFE_INTEGER)throw fail('LIVE_FIRST_CONTACT_OVERFLOW');
        version.revision++;
        version.digest=hash;
      }
      const age=observedAtMs-Date.parse(data.time);
      const freshness=age>=0&&age<=30_000?'current':'stale';
      result.push({id,kind,sourceId:'host.first-contact-observer',
        sourceRevision:version.revision,observedAtMs,freshness,
        exposure:'owner',data,writable:[]});
    }
    return result;
  }
  return Object.freeze({read});
}