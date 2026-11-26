'use strict';
// Device peer transport: HTTPS only, no direct inbound access to a phone.
// A local operator supplies an authenticated, independently hosted relay.
// R001 deliberately implements the fixed-probe operation, not remote shell.
const {timingSafeEqual}=require('node:crypto');
const {createServer}=require('node:https');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const exec=promisify(execFile);
const operations=new Set(['vivim_android_health','vivim_android_probe']);
const validId=x=>typeof x==='string'&&/^[0-9a-f-]{36}$/.test(x);
const validToken=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const equal=(a,b)=>typeof a==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function createRelay({tls,token,ttlMs=15000}){
 if(!validToken(token)||!Number.isSafeInteger(ttlMs)||ttlMs<100||ttlMs>30000)throw Error('INVALID_RELAY_CONFIG');
 const pending=new Map();
 const settle=(id,error,value)=>{const p=pending.get(id);if(!p)return false;pending.delete(id);clearTimeout(p.timer);p.signal?.removeEventListener('abort',p.abort);error?p.reject(error):p.resolve(value);return true;};
 const send=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));};
 const server=createServer(tls,async(req,res)=>{
  try{
   if(req.method!=='POST'||!equal(req.headers.authorization,'Bearer '+token)){send(res,403,{});return;}
   if(req.url==='/poll'){
    const entry=[...pending.entries()].find(([,p])=>!p.claimed);
    if(!entry){send(res,200,{job:null});return;}
    const [requestId,p]=entry;p.claimed=true;send(res,200,{job:{requestId,tool:p.tool}});return;
   }
   if(req.url==='/result'){
    let bytes=0,chunks=[];for await(const b of req){bytes+=b.length;if(bytes>8192){send(res,413,{});return;}chunks.push(b);}
    const v=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!validId(v?.requestId)||!pending.get(v.requestId)?.claimed||typeof v.ok!=='boolean'){send(res,409,{});return;}
    settle(v.requestId,v.ok?null:Error('DEVICE_PROBE_FAILED'),v.value);send(res,200,{accepted:true});return;
   }
   send(res,404,{});
  }catch{if(!res.headersSent)send(res,400,{});else res.end();}
 });
 server.requestTimeout=10000;server.headersTimeout=5000;server.maxHeadersCount=32;
 const adapter={call(tool,args,{signal,requestId}={}){
  if(!operations.has(tool)||!args||Object.keys(args).length||!validId(requestId)||pending.has(requestId)||pending.size>=8||signal?.aborted)return Promise.reject(Error('PEER_REQUEST_DENIED'));
  return new Promise((resolve,reject)=>{
   const abort=()=>settle(requestId,Error('PEER_ABORTED'));
   const timer=setTimeout(()=>settle(requestId,Error('PEER_TIMEOUT')),ttlMs);
   pending.set(requestId,{tool,resolve,reject,timer,signal,abort,claimed:false});
   signal?.addEventListener('abort',abort,{once:true});
  });
 }};
 function close(){for(const id of pending.keys())settle(id,Error('RELAY_CLOSED'));server.close();}
 return {server,adapter,close};
}
async function runNativeProbe(tool,{prefix=process.env.PREFIX,platform=process.platform}={}){
 if(!operations.has(tool)||platform!=='android'||prefix!=='/data/data/com.termux/files/usr')throw Error('NOT_NATIVE_TERMUX');
 if(tool==='vivim_android_health')return {schema:'vivim.android-health/1',status:'ready',profile:'termux-fixed-probe',platform};
 const {stdout}=await exec(prefix+'/bin/uname',['-m'],{timeout:3000,maxBuffer:1024,env:{PATH:prefix+'/bin',HOME:process.env.HOME||''}});
 return {schema:'vivim.android-probe/1',platform,machine:stdout.trim(),exitCode:0};
}
async function pollOnce({origin,token,fetcher=fetch,probe=runNativeProbe}){
 const u=new URL(origin);
 if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash||!validToken(token))throw Error('INVALID_PEER_CONFIG');
 const post=async(path,value)=>{
  const r=await fetcher(new URL(path,u),{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(value),redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!r.ok)throw Error('RELAY_REQUEST_FAILED');
  const raw=await r.text();if(Buffer.byteLength(raw)>8192)throw Error('RELAY_RESPONSE_TOO_LARGE');
  return JSON.parse(raw);
 };
 const {job}=await post('/poll',{});
 if(!job)return false;
 if(!validId(job.requestId)||!operations.has(job.tool))throw Error('UNSUPPORTED_PEER_JOB');
 let result;try{result={requestId:job.requestId,ok:true,value:await probe(job.tool)};}catch{result={requestId:job.requestId,ok:false};}
 await post('/result',result);return true;
}
module.exports={createRelay,pollOnce,runNativeProbe};
if(require.main===module){
 const origin=process.env.VIVIM_RELAY_ORIGIN,token=process.env.VIVIM_DEVICE_TOKEN;
 if(process.platform!=='android'){console.error('Native Termux required');process.exitCode=1;}
 else (async()=>{while(true){try{await pollOnce({origin,token});}catch{console.error('Peer relay unavailable or denied');}await new Promise(r=>setTimeout(r,750));}})();
}
