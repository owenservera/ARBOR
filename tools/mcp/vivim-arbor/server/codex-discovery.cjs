'use strict';
// Thin local-only bridge into Codex's supported native App Server.
// No remote arguments select executable, methods, workspace or provider.
// https://github.com/openai/codex/tree/main/codex-rs/app-server
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const LIMIT=10,MAX_LINE=1024*1024,MAX_TOTAL=4*1024*1024;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const refused=code=>Object.assign(new Error(code),{code});
function createDiscoveryProtocol(){
 let phase='new';
 const start=()=>{
  if(phase!=='new')throw refused('CODEX_PROTOCOL_STATE');
  phase='initialize';
  return {id:1,method:'initialize',params:{clientInfo:{name:'vivim_arbor',title:'VIVIM ARBOR',version:'0.4.1'}}};
 };
 function receive(message){
  if(!record(message))throw refused('CODEX_PROTOCOL_FRAME');
  // Never answer server requests (including approval requests); terminate instead.
  if(typeof message.method==='string'&&Object.hasOwn(message,'id'))throw refused('CODEX_UNEXPECTED_SERVER_REQUEST');
  if(typeof message.method==='string')return {};
  const expected=phase==='initialize'?1:phase==='list'?2:null;
  if(expected===null||message.id!==expected||Object.hasOwn(message,'error')||!record(message.result))
   throw refused('CODEX_PROTOCOL_REPLY');
  if(phase==='initialize'){
   if(typeof message.result.userAgent!=='string'||!message.result.userAgent.length)throw refused('CODEX_INITIALIZE_SHAPE');
   phase='list';
   return {send:[{method:'initialized'},{id:2,method:'thread/list',params:{limit:LIMIT,archived:false}}]};
  }
  const data=message.result.data;
  if(!Array.isArray(data)||data.length>LIMIT||data.some(x=>!record(x)||typeof x.id!=='string'||!x.id.length)||
      new Set(data.map(x=>x.id)).size!==data.length||
      !(message.result.nextCursor===null||message.result.nextCursor===undefined||typeof message.result.nextCursor==='string'))
   throw refused('CODEX_LIST_SHAPE');
  phase='done';
  return {result:{schema:'vivim.codex-observation/1',adapter:'codex-app-server',initialized:true,
   threadPageCount:data.length,hasMore:typeof message.result.nextCursor==='string'&&message.result.nextCursor.length>0,
   scope:'local-history-sample',accountAuthentication:'not-tested',inference:'not-requested',effectAuthority:'none'}};
 }
 return {start,receive};
}
function resolveExecutable(env=process.env,platform=process.platform){
 const candidate=env.VIVIM_CODEX_EXE||(platform==='win32'&&env.APPDATA&&path.join(env.APPDATA,'npm','node_modules','@openai','codex','node_modules','@openai','codex-win32-x64','vendor','x86_64-pc-windows-msvc','bin','codex.exe'));
 if(typeof candidate!=='string'||!path.isAbsolute(candidate)||path.basename(candidate).toLowerCase()!==(platform==='win32'?'codex.exe':'codex'))
  throw refused('CODEX_EXECUTABLE_UNCONFIGURED');
 try{const real=fs.realpathSync(candidate);if(!fs.statSync(real).isFile())throw Error();return real;}catch{throw refused('CODEX_EXECUTABLE_UNAVAILABLE');}
}
function observeCodex({env=process.env,workspace,spawnChild=spawn,timeoutMs=15000}={}){
 return new Promise((resolve,reject)=>{
  let child,completed=false,timer,buffer=Buffer.alloc(0),total=0;
  const finish=(error,result)=>{
   if(completed)return;completed=true;clearTimeout(timer);
   if(child){child.stdin?.destroy();child.stdout?.destroy();try{child.kill();}catch{}}
   if(error)reject(error);else resolve(result);
  };
  try{
   const exe=resolveExecutable(env);
   if(typeof workspace!=='string'||!path.isAbsolute(workspace)||!fs.statSync(workspace).isDirectory())
    throw refused('CODEX_WORKSPACE_UNAVAILABLE');
   child=spawnChild(exe,['app-server','--listen','stdio://'],{cwd:workspace,env,shell:false,windowsHide:true,stdio:['pipe','pipe','ignore']});
   const protocol=createDiscoveryProtocol();
   const send=message=>child.stdin.write(JSON.stringify(message)+'\n');
   child.once('error',()=>finish(refused('CODEX_CHILD_ERROR')));
   child.once('close',()=>finish(refused('CODEX_CHILD_CLOSED')));
   child.stdin.on('error',()=>finish(refused('CODEX_INPUT_ERROR')));
   child.stdout.on('error',()=>finish(refused('CODEX_OUTPUT_ERROR')));
   child.stdout.on('data',chunk=>{
    if(completed)return;
    try{
     total+=chunk.length;if(total>MAX_TOTAL)throw refused('CODEX_OUTPUT_LIMIT');
     buffer=Buffer.concat([buffer,chunk]);
     for(let n;(n=buffer.indexOf(10))>=0;){
      if(n>MAX_LINE)throw refused('CODEX_FRAME_LIMIT');
      const frame=buffer.subarray(0,n);buffer=buffer.subarray(n+1);
      if(!frame.toString('utf8').trim())continue;
      let message;try{message=JSON.parse(frame.toString('utf8'));}catch{throw refused('CODEX_PROTOCOL_FRAME');}
      const step=protocol.receive(message);
      for(const m of step.send??[])send(m);
      if(step.result){finish(null,step.result);return;}
     }
     if(buffer.length>MAX_LINE)throw refused('CODEX_FRAME_LIMIT');
    }catch(e){finish(refused(e?.code?.startsWith('CODEX_')?e.code:'CODEX_PROTOCOL_ERROR'));}
   });
   timer=setTimeout(()=>finish(refused('CODEX_DISCOVERY_TIMEOUT')),timeoutMs);
   send(protocol.start());
  }catch(e){finish(refused(e?.code?.startsWith('CODEX_')?e.code:'CODEX_START_FAILED'));}
 });
}
function definitions(root){
 return [['vivim_codex_observe','Local-only Codex App Server initialization and bounded thread count. No transcript, prompt, model request, or effect authorization.',{type:'object',properties:{},required:[],additionalProperties:false},()=>observeCodex({workspace:path.join(root,'ARBOR')})]];
}
module.exports={createDiscoveryProtocol,resolveExecutable,observeCodex,definitions};
