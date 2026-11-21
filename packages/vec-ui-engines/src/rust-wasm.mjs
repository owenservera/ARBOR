// Existing shared Rust product kernel, no second visual compiler or Host effect APIs.
// @hq:capability vivim.rust-browser-kernel@1
// @hq:consumes vivim.rust-wiki-source-stamp@1
// @hq:consumes vivim.rust-wiki-source-search@1
// @hq:consumes vivim.rust-wiki-source-transition@1
// @hq:consumes vivim.rust-wiki-source-delta@1
// @hq:consumes vivim.rust-control-receipt-presentation@1
const SCHEMA='vivim.product-pure-response/1';
const WASM_URL='/mobile/wasm/vivim_programmability_core.wasm';
const MAX=512*1024, MAX_MODULE_BYTES=12*1024*1024,MAX_MEMORY=64*1024*1024;
let instance=null,attempt=null,reason='WASM_NOT_INITIALIZED',lastOperation='NOT_RUN',everReady=false;
const utf8=new TextEncoder(),decode=new TextDecoder('utf-8',{fatal:true});
function admit(exports){
  return exports?.memory instanceof WebAssembly.Memory&&
    ['vivim_kernel_alloc','vivim_kernel_free','vivim_kernel_dispatch']
      .every(name=>typeof exports[name]==='function');
}
const region=(native,pointer,length)=>Number.isSafeInteger(pointer)&&Number.isSafeInteger(length)&&
  pointer>0&&length>0&&length<=MAX&&native.memory.buffer.byteLength<=MAX_MEMORY&&
  pointer+length<=native.memory.buffer.byteLength;
function unavailable(code){instance=null;reason=code;lastOperation='FAILED';return null;}
export function rustUiEngineStatus(){
  return {state:instance?'ready':'unavailable',code:instance?'NONE':reason,
    fallback:instance||everReady||attempt||
      !['NON_BROWSER_RUNTIME','WASM_NOT_INITIALIZED','WASM_FETCH_UNAVAILABLE'].includes(reason)
      ?'none':'trusted-js',lastOperation};
}
// Enforce the wire ceiling while the real response is read; never consume an
// unchecked response.arrayBuffer() or turn a broken artifact into a projection.
async function readBoundedModule(response){
  if(!response.body||typeof response.body.getReader!=='function'){
    reason='WASM_STREAM_UNAVAILABLE';return null;
  }
  const reader=response.body.getReader();let total=0,count=0;const chunks=[];
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      if(++count>16384){reason='WASM_STREAM_CHUNKS_EXCEEDED';await reader.cancel().catch(()=>{});return null;}
      if(!(value instanceof Uint8Array)){
        reason='WASM_MODULE_INVALID_CHUNK';await reader.cancel().catch(()=>{});return null;
      }
      total+=value.byteLength;
      if(total>MAX_MODULE_BYTES){
        reason='WASM_MODULE_OVERSIZED';await reader.cancel().catch(()=>{});return null;
      }
      chunks.push(value);
    }
  }catch{
    reason='WASM_MODULE_STREAM_FAILED';
    try{await reader.cancel();}catch{}
    return null;
  }finally{try{reader.releaseLock();}catch{}}
  if(total<8){reason='WASM_MODULE_INVALID_SIZE';return null;}
  const bytes=new Uint8Array(total);let at=0;
  for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}
  if(bytes[0]!==0||bytes[1]!==97||bytes[2]!==115||bytes[3]!==109||
     bytes[4]!==1||bytes[5]!==0||bytes[6]!==0||bytes[7]!==0){
    reason='WASM_MODULE_BAD_MAGIC';return null;
  }
  return bytes;
}
export async function initializeRustUiEngine(){
  if(typeof window==='undefined'||typeof WebAssembly==='undefined'||typeof fetch!=='function'){
    reason='NON_BROWSER_RUNTIME';return false;
  }
  if(instance)return true;
  if(attempt)return attempt;
  attempt=(async()=>{
    try{
      const response=await fetch(WASM_URL,{credentials:'same-origin',cache:'no-cache'});
      if(!response.ok){reason='WASM_FETCH_UNAVAILABLE';return false;}
      const declared=Number(response.headers.get('content-length')??0);
      if(!Number.isSafeInteger(declared)||declared<0||declared>MAX_MODULE_BYTES){
        reason='WASM_MODULE_OVERSIZED';return false;
      }
      const bytes=await readBoundedModule(response);
      if(!bytes)return false;
      const output=await WebAssembly.instantiate(bytes,{});
      const native=output.instance?.exports??output.exports;
      if(!admit(native)){reason='WASM_ABI_UNAVAILABLE';return false;}
      if(native.memory.buffer.byteLength>MAX_MEMORY){reason='WASM_MEMORY_LIMIT';return false;}
      instance=native;everReady=true;reason='NONE';return true;
    }catch{reason='WASM_INITIALIZATION_FAILED';return false;}
  })().finally(()=>{attempt=null;});
  return attempt;
}
function invoke(operation,input){
  const native=instance;
  if(!native){lastOperation='UNAVAILABLE';return null;}
  let request;
  try{request=utf8.encode(JSON.stringify({
    schema:'vivim.product-pure-request/1',operation,input
  }));}catch{lastOperation='INVALID_INPUT';return null;}
  if(request.byteLength<1||request.byteLength>MAX){
    lastOperation='REQUEST_TOO_LARGE';return null;
  }
  if(native.memory.buffer.byteLength>MAX_MEMORY)return unavailable('WASM_MEMORY_LIMIT');
  let pointer=0,outputPointer=0,outputLength=0,result=null;
  try{
    pointer=native.vivim_kernel_alloc(request.byteLength);
    if(!region(native,pointer,request.byteLength))return unavailable('WASM_INPUT_POINTER_INVALID');
    new Uint8Array(native.memory.buffer,pointer,request.byteLength).set(request);
    const packed=native.vivim_kernel_dispatch(pointer,request.byteLength);
    if(typeof packed!=='bigint')return unavailable('WASM_ABI_RESPONSE_INVALID');
    outputPointer=Number(packed&0xffffffffn);
    outputLength=Number(packed>>32n);
    if(!region(native,outputPointer,outputLength))return unavailable('WASM_OUTPUT_POINTER_INVALID');
    // The Rust ABI owns two distinct boxed allocations. An aliased output
    // could otherwise cause the browser to free the same address twice.
    if(outputPointer<pointer+request.byteLength&&pointer<outputPointer+outputLength){
      outputPointer=0;outputLength=0;
      return unavailable('WASM_OUTPUT_ALIASES_INPUT');
    }
    const reply=JSON.parse(decode.decode(new Uint8Array(native.memory.buffer,outputPointer,outputLength)));
    if(reply?.schema!==SCHEMA||reply.state!=='computed'||
      reply.operation!==operation||reply.authority!=='none'||
      reply.executionAuthorized!==false||reply.effectPerformed!==false)
      return unavailable('WASM_RESPONSE_INVALID');
    result=reply.result??null;
  }catch{return unavailable('WASM_DISPATCH_FAILED');}
  finally{
    let releaseFailed=false;
    if(region(native,outputPointer,outputLength)){
      try{native.vivim_kernel_free(outputPointer,outputLength);}
      catch{releaseFailed=true;}
    }
    if(region(native,pointer,request.byteLength)){
      try{native.vivim_kernel_free(pointer,request.byteLength);}
      catch{releaseFailed=true;}
    }
    if(releaseFailed)unavailable('WASM_RELEASE_FAILED');
  }
  // A valid response is not usable until both owned WASM allocations have
  // been released. Failed release never yields a native candidate to VEC.
  if(instance!==native)return null;
  lastOperation='COMPUTED';
  return result;
}
export function rustUiValue(type,value,choices){
  return invoke('ui-value',{type,value,...(choices===undefined?{}:{choices})});
}
export function rustTokenPackage(input){
  return invoke('ui-token-pack',input);
}
export function rustNavigation(text){
  const value=invoke('local-navigation',{text});
  if(!value||value.schema!=='vivim.local-destination/1'||
    value.authority!=='none'||!(value.destination===null||
      ['today','wiki','world','build','talk','control','me','pocket','shares'].includes(value.destination)))
    return undefined;
  return value.destination;
}
export function rustVecAdmission(input){
  const value=invoke('vec-admission',input);
  if(!value||value.schema!=='vivim.vec-compile/0.1'||
    value.authorization!=='none'||value.executed!==false||value.persisted!==false)
    return undefined;
  return value;
}
export function rustDigest(text){
  const value=invoke('sha256-utf8',{text});
  if(!value||value.schema!=='vivim.sha256-utf8/1'||
    value.outcome!=='computed'||value.authority!=='none'||
    typeof value.digest!=='string'||!/^[a-f0-9]{64}$/.test(value.digest))
    return undefined;
  return value.digest;
}
// Inert source identity of a Host-authorized Wiki response. No persistence.
export function rustWikiSourceStamp(wiki){
  const value=invoke('wiki-source-stamp',{wiki});
  if(!value||value.schema!=='vivim.wiki-source-stamp/1'||
    value.state!=='computed'||value.authority!=='none'||
    value.executionAuthorized!==false||value.effectPerformed!==false||
    !Number.isSafeInteger(value.revision)||value.revision<0||
    !Number.isSafeInteger(value.pagesTotal)||value.pagesTotal<0||
    typeof value.digest!=='string'||!/^[a-f0-9]{64}$/.test(value.digest))
    return undefined;
  return {revision:value.revision,digest:value.digest,pagesTotal:value.pagesTotal};
}
// Optional bounded Rust-only search over an already-authorized Host Wiki read.
export function rustWikiSearch(wiki,query){
  const value=invoke('wiki-source-search',{wiki,query});
  if(!value||value.schema!=='vivim.wiki-source-search/1'||
    value.outcome!=='computed'||value.authority!=='none'||
    value.scope!=='bounded-source-index'||
    value.executionAuthorized!==false||value.effectPerformed!==false||
    !Number.isSafeInteger(value.wikiRevision)||value.wikiRevision<0||
    typeof value.wikiDigest!=='string'||!/^[0-9a-f]{64}$/.test(value.wikiDigest)||
    !Number.isSafeInteger(value.scannedPages)||value.scannedPages<0||
    !Number.isSafeInteger(value.totalPages)||value.totalPages<value.scannedPages||
    !Number.isSafeInteger(value.indexedSections)||value.indexedSections<0||value.indexedSections>512||
    typeof value.indexTruncated!=='boolean'||
    !Number.isSafeInteger(value.matches)||value.matches<0||
    !Array.isArray(value.results)||value.results.length>24||
    value.results.length>value.matches||
    value.results.some(row=>typeof row?.page!=='string'||!row.page||
      row.section!==null&&typeof row.section!=='string'||
      typeof row.excerpt!=='string'||Array.from(row.excerpt).length>240))
    return undefined;
  return value;
}
export function rustWikiSourceTransition(previous,current){
  const result=invoke('wiki-source-transition',{previous:previous??null,current});
  if(!result||result.schema!=='vivim.wiki-source-transition/1'||
    result.authority!=='none'||result.executionAuthorized!==false||
    result.effectPerformed!==false||!['accepted','refused'].includes(result.outcome))
    return undefined;
  return result.outcome==='accepted';
}
// Full Host-observed source delta; no content or writable state is emitted.
export function rustWikiSourceDelta(previous,current){
  const value=invoke('wiki-source-delta',{previous:previous??null,current});
  if(!value||value.schema!=='vivim.wiki-source-delta/1'||
    !['baseline','unchanged','changed'].includes(value.outcome)||
    value.authority!=='none'||value.executionAuthorized!==false||
    value.effectPerformed!==false||
    !value.to||!Number.isSafeInteger(value.to.revision)||value.to.revision<0||
    !Number.isSafeInteger(value.to.pagesTotal)||value.to.pagesTotal<0||
    typeof value.to.digest!=='string'||!/^[a-f0-9]{64}$/.test(value.to.digest)||
    (previous!=null&&(!value.from||!Number.isSafeInteger(value.from.revision)||
      typeof value.from.digest!=='string'||!/^[a-f0-9]{64}$/.test(value.from.digest)))||
    !['changedPages','addedPages','removedPages','changedSections','changedLinks','totalEvents','omittedEvents']
      .every(key=>Number.isSafeInteger(value[key])&&value[key]>=0)||
    !Array.isArray(value.events)||value.events.length>48||
    value.totalEvents!==value.events.length+value.omittedEvents||
    value.events.some(event=>!['page-added','page-removed','section-added','section-removed',
      'section-changed','links-changed'].includes(event?.kind)||
      typeof event.page!=='string'||event.page.length>160||
      (event.section!==undefined&&(typeof event.section!=='string'||event.section.length>160))))
    return undefined;
  return value;
}
// UI-only exact Host receipt binding. Host authorization is unchanged.
export function rustControlReceiptPreview(plan,receipt){
  if(typeof plan?.planId!=='string'||typeof plan?.planDigest!=='string'||
     typeof plan?.actionId!=='string')return undefined;
  const value=invoke('control-receipt-preview',{
    receipt,binding:{planId:plan.planId,planDigest:plan.planDigest,
      actionId:plan.actionId,source:'mobile'}
  });
  if(!value||value.schema!=='vivim.control-receipt-presentation/1'||
    value.outcome!=='computed'||value.authority!=='none'||
    value.executionAuthorized!==false||value.effectPerformed!==false||
    !['applied','failed','uncertain'].includes(value.status)||
    value.status!==receipt?.status||typeof value.text!=='string')
    return undefined;
  return {status:value.status,readOnly:true};
}
export function nativeBrowserKernelReady(){return instance!==null;}
