// Read-only Host broker for the packaged Rust VEC projection. TierFlow still
// compiles the canonical source and the Host still owns committed revisions.
// @hq:capability vivim.native-vec-host-read@1
// @hq:consumes vivim.native-vec-stdio@1
// No direct UI mutation, grants, approvals, renderer installs or provider I/O.
import {spawn} from 'node:child_process';
import {resolveBundledRustBinary} from '../chat/rust-context.mjs';

const SCHEMA='vivim.vec-visual-ir/1';
const MAX_INPUT=2*1024*1024;
const MAX_OUTPUT=2*1024*1024;
const unavailable=code=>({schema:SCHEMA,state:'unavailable',authority:'none',code,
  executionAuthorized:false,effectPerformed:false});

function invoke(binary,input){
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,[],{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
    const chunks=[];let size=0,done=false;
    const finish=(error,data)=>{
      if(done)return;
      done=true;clearTimeout(timer);error?reject(error):resolve(data);
    };
    const timer=setTimeout(()=>{child.kill();finish(Error('RUST_VEC_TIMEOUT'));},4000);
    child.on('error',e=>finish(e));
    child.stdout.on('data',chunk=>{
      size+=chunk.length;
      if(size>MAX_OUTPUT){child.kill();finish(Error('RUST_VEC_RESPONSE_LIMIT'));}
      else chunks.push(chunk);
    });
    child.stderr.on('data',()=>{}); // Never echo native stderr or private bindings.
    child.stdin.on('error',e=>finish(e));
    child.on('close',code=>finish(code===0?null:Error('RUST_VEC_EXIT'),
      Buffer.concat(chunks).toString('utf8')));
    child.stdin.end(input,'utf8');
  });
}
export async function compileRustVecView(projection){
  if(!projection||projection.schema!=='vivim.native-ui-view/1'||projection.authority!=='none'
    ||!['absent','source-backed','unavailable'].includes(projection.state))
    return unavailable('INVALID_HOST_VISUAL');
  let binary;try{binary=resolveBundledRustBinary('vivim-vec-project');}catch{}
  if(!binary)return unavailable('RUST_VEC_NOT_PACKAGED');
  let input;try{input=JSON.stringify(projection);}catch{return unavailable('HOST_VISUAL_UNSERIALIZABLE');}
  if(Buffer.byteLength(input)>MAX_INPUT)return unavailable('HOST_VISUAL_TOO_LARGE');
  let value;
  try{
    const raw=await invoke(binary,input);
    value=JSON.parse(raw);
  }catch{return unavailable('RUST_VEC_UNAVAILABLE');}
  if(!value||value.schema!==SCHEMA||value.authority!=='none'
    ||value.executionAuthorized!==false||value.effectPerformed!==false)
    return unavailable('RUST_VEC_CONTRACT_INVALID');
  if(value.state==='absent')
    return projection.state==='absent'?value:unavailable('RUST_VEC_STATE_MISMATCH');
  if(value.state==='unavailable')return unavailable('RUST_VEC_REFUSED');
  if(projection.state!=='source-backed'||value.state!=='compiled'
    ||value.surfaceId!==projection.source?.surfaceId||value.revision!==projection.source?.revision
    ||!Number.isSafeInteger(value.nodeCount)||value.nodeCount<1||value.nodeCount>64
    ||!Array.isArray(value.previewActionIds)||value.previewActionIds.length>64
    ||value.root?.id!=='root'||!Array.isArray(value.root.children))
    return unavailable('RUST_VEC_SOURCE_MISMATCH');
  return value;
}
