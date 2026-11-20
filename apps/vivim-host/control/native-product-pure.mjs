// Host broker for shared, persistent and inert Rust product computations.
// @hq:capability vivim.product-pure-host-bridge@2
// Authority and effects remain in the incumbent Host dispatcher.
import {callNativeProductKernel} from './native-product-kernel.mjs';

export const NATIVE_PURE_SCHEMA='vivim.product-pure-response/1';
const OPERATIONS=new Set([
  'command-program','context-grounding','wiki-target','wiki-target-batch',
  'recovery-diagnosis','recovery-diagnosis-batch','ui-value','ui-token-pack',
  'local-navigation','vec-admission','sha256-utf8','wiki-source-stamp','wiki-source-search','wiki-source-transition'
]);
const unavailable=(operation,code)=>({schema:NATIVE_PURE_SCHEMA,
  state:'unavailable',operation,code,authority:'none',
  executionAuthorized:false,effectPerformed:false});
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
  &&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
export async function runNativeProductPure(operation,input){
  if(!OPERATIONS.has(operation)||!object(input))
    return unavailable(operation,'INVALID_NATIVE_INPUT');
  let reply;
  try{reply=await callNativeProductKernel(operation,input);}
  catch(error){
    return unavailable(operation,
      error?.code==='NATIVE_NOT_PACKAGED'?'NATIVE_NOT_PACKAGED':'RUST_KERNEL_UNAVAILABLE');
  }
  if(!object(reply)||reply.schema!==NATIVE_PURE_SCHEMA||
    reply.operation!==operation||reply.authority!=='none'||
    reply.executionAuthorized!==false||reply.effectPerformed!==false||
    !['computed','refused'].includes(reply.state)||
    (reply.state==='computed'&&!Object.hasOwn(reply,'result')))
    return unavailable(operation,'RUST_KERNEL_CONTRACT_INVALID');
  // The transport-local requestId is not a new product identity or grant.
  const {requestId:_,...result}=reply;
  return result;
}
