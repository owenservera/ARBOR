// One persistent, local Rust application computation process per Host.
// @hq:capability vivim.rust-product-kernel-host-transport@1
// Only typed pure operations. No HTTP listener, shell, grants or effect dispatch.
import {spawn} from 'node:child_process';
import {resolveBundledRustBinary} from '../chat/rust-context.mjs';

const MAX_WIRE=512*1024;
const MAX_PENDING=32;
const DEADLINE_MS=4000;
let active=null;
let sequence=0;
class NativeKernel {
  constructor(binary){this.binary=binary;this.child=null;this.buf=Buffer.alloc(0);this.pending=new Map();}
  discard(code){
    const child=this.child;
    this.child=null;
    this.buf=Buffer.alloc(0);
    if(child){try{child.kill();}catch{/* already terminated */}}
    for(const pending of this.pending.values()){
      clearTimeout(pending.timer);
      pending.reject(Object.assign(Error(code),{code}));
    }
    this.pending.clear();
  }
  admit(data){
    if(!this.child)return;
    const payload=Buffer.isBuffer(data)?data:Buffer.from(data);
    if(this.buf.length+payload.length>MAX_WIRE+512){
      this.discard('RUST_KERNEL_FRAME_LIMIT');return;
    }
    this.buf=Buffer.concat([this.buf,payload]);
    for(;;){
      const at=this.buf.indexOf(10);
      if(at<0)break;
      const frame=this.buf.subarray(0,at);
      this.buf=this.buf.subarray(at+1);
      let response;
      try{response=JSON.parse(frame.toString('utf8'));}catch{
        this.discard('RUST_KERNEL_INVALID_JSON');return;
      }
      const id=response?.requestId;
      const pending=this.pending.get(id);
      if(typeof id!=='string'||!pending||response.operation!==pending.operation){
        this.discard('RUST_KERNEL_RESPONSE_MISMATCH');return;
      }
      this.pending.delete(id);
      clearTimeout(pending.timer);
      pending.resolve(response);
    }
  }
  ensure(){
    if(this.child)return;
    const proc=spawn(this.binary,['--serve'],{
      shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']
    });
    this.child=proc;
    proc.stdout.on('data',data=>{if(this.child===proc)this.admit(data);});
    proc.stderr.on('data',()=>{}); // Native stderr may contain private context.
    proc.on('error',()=>{if(this.child===proc)this.discard('RUST_KERNEL_START_FAILED');});
    proc.on('close',()=>{if(this.child===proc)this.discard('RUST_KERNEL_STOPPED');});
    proc.stdin.on('error',()=>{if(this.child===proc)this.discard('RUST_KERNEL_PIPE_FAILED');});
  }
  async request(operation,input){
    if(this.pending.size>=MAX_PENDING)
      throw Object.assign(Error('RUST_KERNEL_BUSY'),{code:'RUST_KERNEL_BUSY'});
    const id=String(++sequence);
    const frame=JSON.stringify({
      schema:'vivim.product-pure-request/1',requestId:id,operation,input
    });
    if(Buffer.byteLength(frame,'utf8')>MAX_WIRE)
      throw Object.assign(Error('RUST_KERNEL_INPUT_LIMIT'),{code:'RUST_KERNEL_INPUT_LIMIT'});
    this.ensure();
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        if(this.pending.has(id))this.discard('RUST_KERNEL_TIMEOUT');
      },DEADLINE_MS);
      this.pending.set(id,{resolve,reject,timer,operation});
      try{this.child.stdin.write(frame+'\n');}
      catch{this.discard('RUST_KERNEL_PIPE_FAILED');}
    });
  }
}
export async function callNativeProductKernel(operation,input){
  const binary=resolveBundledRustBinary('vivim-product-pure');
  if(!binary)throw Object.assign(Error('NATIVE_NOT_PACKAGED'),{code:'NATIVE_NOT_PACKAGED'});
  if(active&&active.binary!==binary){active.discard('RUST_KERNEL_BINARY_REPLACED');active=null;}
  if(!active)active=new NativeKernel(binary);
  return active.request(operation,input);
}
export function closeNativeProductKernel(){
  if(active){active.discard('RUST_KERNEL_CLOSED');active=null;}
}
