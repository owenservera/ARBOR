// Host-owned broker for five bounded, inert native Rust transformations.
// @hq:capability vivim.product-pure-host-bridge@1
// No filesystem paths, grants, browser control, external network or effects.
import {spawn} from 'node:child_process';
import {resolveBundledRustBinary} from '../chat/rust-context.mjs';

export const NATIVE_PURE_SCHEMA='vivim.product-pure-response/1';
const REQUEST_SCHEMA='vivim.product-pure-request/1';
const OPERATIONS=new Set(['command-program','context-grounding','wiki-target',
  'recovery-diagnosis','recovery-diagnosis-batch','ui-value']);
const LIMIT=512*1024;
const unavailable=(operation,code)=>({schema:NATIVE_PURE_SCHEMA,
  state:'unavailable',operation,code,authority:'none',
  executionAuthorized:false,effectPerformed:false});
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
  &&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
function runNative(binary,wire){
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,[],{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
    let size=0,done=false;const chunks=[];
    const finish=(error,result)=>{
      if(done)return;done=true;clearTimeout(timer);
      if(error)reject(error);else resolve(result);
    };
    const timer=setTimeout(()=>{child.kill();finish(Error('RUST_PURE_TIMEOUT'));},4000);
    child.on('error',e=>finish(e));
    child.stdout.on('data',chunk=>{
      size+=chunk.length;
      if(size>LIMIT){child.kill();finish(Error('RUST_PURE_OUTPUT_LIMIT'));}
      else chunks.push(chunk);
    });
    child.stderr.on('data',()=>{});
    child.stdin.on('error',error=>finish(error));
    child.on('close',code=>finish(code===0?null:Error('RUST_PURE_EXIT'),
      Buffer.concat(chunks).toString('utf8')));
    child.stdin.end(wire,'utf8');
  });
}
export async function runNativeProductPure(operation,input){
  if(!OPERATIONS.has(operation)||!object(input))
    return unavailable(operation,'INVALID_NATIVE_INPUT');
  const wire=JSON.stringify({schema:REQUEST_SCHEMA,operation,input});
  if(Buffer.byteLength(wire,'utf8')>LIMIT)return unavailable(operation,'NATIVE_INPUT_TOO_LARGE');
  let binary;
  try{binary=resolveBundledRustBinary('vivim-product-pure');}
  catch{return unavailable(operation,'NATIVE_NOT_PACKAGED');}
  if(!binary)return unavailable(operation,'NATIVE_NOT_PACKAGED');
  let response;
  try{response=JSON.parse(await runNative(binary,wire));}
  catch{return unavailable(operation,'RUST_PURE_READ_FAILED');}
  if(!object(response)||response.schema!==NATIVE_PURE_SCHEMA||
    response.operation!==operation||response.authority!=='none'||
    response.executionAuthorized!==false||response.effectPerformed!==false||
    !['computed','refused'].includes(response.state)||
    (response.state==='computed'&&!Object.hasOwn(response,'result')))
    return unavailable(operation,'RUST_PURE_CONTRACT_INVALID');
  return response;
}
