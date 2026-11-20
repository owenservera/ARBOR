// One persistent, local Rust application computation process per Host.
// @hq:capability vivim.rust-product-kernel-host-transport@1
// Only typed pure operations. No HTTP listener, shell, grants or effect dispatch.
import {spawn} from 'node:child_process';
import {resolveBundledRustBinary} from '../chat/rust-context.mjs';

const MAX_WIRE=512*1024;
const MAX_JOURNAL_WIRE=12*1024*1024;
const MAX_WIKI_CHANGES_WIRE=4*1024*1024;
const isJournal=operation=>operation==='wiki-journal-replay'||operation==='wiki-change-projection';
const wireLimit=operation=>operation==='wiki-journal-replay'?MAX_JOURNAL_WIRE:
  operation==='wiki-change-projection'?MAX_WIKI_CHANGES_WIRE:MAX_WIRE;
const MAX_PENDING=32;
const DEADLINE_MS=4000;
// Large read-model work must not block the short-lived command fence lane.
const activeByLane=new Map();
let sequence=0;
class NativeKernel {
  constructor(binary){this.binary=binary;this.child=null;this.parts=[];this.frameBytes=0;this.pending=new Map();}
  discard(code){
    const child=this.child;
    this.child=null;
    this.parts=[];
    this.frameBytes=0;
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
    for(let offset=0;offset<payload.length;){
      const at=payload.indexOf(10,offset);
      const end=at<0?payload.length:at+1;
      const len=end-offset;
      if(this.frameBytes+len>MAX_JOURNAL_WIRE+512){
        this.discard('RUST_KERNEL_FRAME_LIMIT');return;
      }
      this.parts.push(payload.subarray(offset,end));
      this.frameBytes+=len;
      offset=end;
      if(at<0)break;
      const frame=Buffer.concat(this.parts,this.frameBytes).subarray(0,this.frameBytes-1);
      this.parts=[];
      this.frameBytes=0;
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
    if(Buffer.byteLength(frame,'utf8')>wireLimit(operation))
      throw Object.assign(Error('RUST_KERNEL_INPUT_LIMIT'),{code:'RUST_KERNEL_INPUT_LIMIT'});
    this.ensure();
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        if(this.pending.has(id))this.discard('RUST_KERNEL_TIMEOUT');
      },isJournal(operation)?12000:DEADLINE_MS);
      this.pending.set(id,{resolve,reject,timer,operation});
      try{this.child.stdin.write(frame+'\n');}
      catch{this.discard('RUST_KERNEL_PIPE_FAILED');}
    });
  }
}
export async function callNativeProductKernel(operation,input){
  const binary=resolveBundledRustBinary('vivim-product-pure');
  if(!binary)throw Object.assign(Error('NATIVE_NOT_PACKAGED'),{code:'NATIVE_NOT_PACKAGED'});
  const lane=isJournal(operation)?'journal':'control';
  let active=activeByLane.get(lane);
  if(active&&active.binary!==binary){
    active.discard('RUST_KERNEL_BINARY_REPLACED');
    activeByLane.delete(lane);
    active=null;
  }
  if(!active){active=new NativeKernel(binary);activeByLane.set(lane,active);}
  return active.request(operation,input);
}
export function closeNativeProductKernel(){
  for(const active of activeByLane.values())active.discard('RUST_KERNEL_CLOSED');
  activeByLane.clear();
}
