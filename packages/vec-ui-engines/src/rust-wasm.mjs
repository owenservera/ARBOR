// Same compiled Rust domain kernel as desktop and Host, run locally in PWA.
// @hq:capability vivim.rust-browser-kernel@1
// No interpreted source, dynamic code, Host grants or effect APIs.
const SCHEMA='vivim.product-pure-response/1';
const WASM_URL='/mobile/wasm/vivim_programmability_core.wasm';
const MAX=512*1024;
let instance=null,attempt=null;
const utf8=new TextEncoder(),decode=new TextDecoder('utf-8',{fatal:true});
function admit(exports){
  return exports?.memory instanceof WebAssembly.Memory&&
    ['vivim_kernel_alloc','vivim_kernel_free','vivim_kernel_dispatch']
      .every(name=>typeof exports[name]==='function');
}
export async function initializeRustUiEngine(){
  if(typeof window==='undefined'||typeof WebAssembly==='undefined'||typeof fetch!=='function')
    return false;
  if(instance)return true;
  if(attempt)return attempt;
  attempt=(async()=>{
    try{
      const response=await fetch(WASM_URL,{credentials:'same-origin',cache:'no-cache'});
      if(!response.ok||Number(response.headers.get('content-length')??0)>4*1024*1024)return false;
      const bytes=await response.arrayBuffer();
      if(bytes.byteLength<8||bytes.byteLength>4*1024*1024)return false;
      const output=await WebAssembly.instantiate(bytes,{});
      const native=output.instance?.exports??output.exports;
      if(!admit(native))return false;
      instance=native;return true;
    }catch{return false;}
  })();
  return attempt;
}
function invoke(operation,input){
  const native=instance;
  if(!native)return null;
  let request;
  try{request=utf8.encode(JSON.stringify({
    schema:'vivim.product-pure-request/1',operation,input
  }));}catch{return null;}
  if(request.byteLength<1||request.byteLength>MAX)return null;
  const pointer=native.vivim_kernel_alloc(request.byteLength);
  if(!pointer)return null;
  let outputPointer=0,outputLength=0;
  try{
    new Uint8Array(native.memory.buffer,pointer,request.byteLength).set(request);
    const packed=native.vivim_kernel_dispatch(pointer,request.byteLength);
    if(typeof packed!=='bigint')return null;
    outputPointer=Number(packed&0xffffffffn);
    outputLength=Number(packed>>32n);
    if(!outputPointer||!outputLength||outputLength>MAX)return null;
    const reply=JSON.parse(decode.decode(new Uint8Array(
      native.memory.buffer,outputPointer,outputLength
    )));
    if(reply?.schema!==SCHEMA||reply.state!=='computed'||
      reply.operation!==operation||reply.authority!=='none'||
      reply.executionAuthorized!==false||reply.effectPerformed!==false)return null;
    return reply.result??null;
  }catch{return null;}
  finally{
    if(outputPointer&&outputLength&&outputLength<=MAX)
      native.vivim_kernel_free(outputPointer,outputLength);
    native.vivim_kernel_free(pointer,request.byteLength);
  }
}
export function rustUiValue(type,value,choices){
  return invoke('ui-value',{type,value,...(choices===undefined?{}:{choices})});
}
export function rustTokenPackage(input){
  return invoke('ui-token-pack',input);
}
export function nativeBrowserKernelReady(){return instance!==null;}
