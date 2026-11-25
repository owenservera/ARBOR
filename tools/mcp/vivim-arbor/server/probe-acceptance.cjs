'use strict';
// Temporary, explicitly locally enabled acceptance profile. It invokes only
// the fixed native Node probe through an isolated instance of the real Host.
// Never reads production tokens, accepts commands, or runs a second product worker.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');
const name='vivim_workstation_probe',run=promisify(execFile);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const hex=(x,n)=>typeof x==='string'&&x.length===n&&/^[0-9a-f]+$/.test(x);
const schema={type:'object',properties:{},required:[],additionalProperties:false};
function createAcceptance({directory=path.join(__dirname,'..','acceptance'),now=Date.now,execute=run}={}){
 let initial,grant;
 const file=path.join(directory,'grant.json');
 function read(){
  const st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size>2048)throw Error('Invalid grant');
  const bytes=fs.readFileSync(file),g=JSON.parse(bytes);
  if(g.schema!=='vivim.local-probe-grant/1'||!hex(g.id,32)||!hex(g.helperSha256,64)||!hex(g.runnerSha256,64)||
     !Number.isSafeInteger(g.expiresAt)||g.expiresAt<=now()||g.expiresAt-now()>3600000||
     Object.keys(g).some(k=>!['schema','id','helperSha256','runnerSha256','expiresAt'].includes(k)))throw Error('Invalid grant');
  return {g,hash:digest(bytes)};
 }
 try{({g:grant,hash:initial}=read());}catch{return null}
 function check(){if(read().hash!==initial)throw Error('Grant changed');}
 function safeFile(relative,expected,max){
  const root=fs.realpathSync(directory),p=path.join(root,relative),real=fs.realpathSync(p);
  const rel=path.relative(root,real);if(rel.startsWith('..'+path.sep)||rel==='..'||path.isAbsolute(rel)||real!==p)throw Error('Invalid staged file');
  const st=fs.statSync(real);if(!st.isFile()||st.size<1||st.size>max||digest(fs.readFileSync(real))!==expected)throw Error('Staged file changed');
  return real;
 }
 function project(x){
  if(x?.schema!=='vivim.tunnel-workstation-receipt/1'||x.actionId!=='workstation.process.start'||x.recipe!=='node-version'||
    x.status!=='applied'||!(/^ctl-[a-f0-9]{16}$/).test(x.planId)||x.exitCode!==0||
    typeof x.version!=='string'||x.version.length>80||!/^v[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/.test(x.version))
    throw Error('Invalid receipt');
  return {schema:x.schema,planId:x.planId,actionId:x.actionId,status:x.status,recipe:x.recipe,version:x.version,exitCode:0};
 }
 async function invoke(){
  check();
  const claim=path.join(directory,grant.id+'.claimed'),receipt=path.join(directory,grant.id+'.receipt.json');
  if(fs.existsSync(claim)){
   // A claimed but missing or invalid result is uncertain: never retry.
   const stat=fs.lstatSync(receipt);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>2048)throw Error('Receipt unavailable');
   return project(JSON.parse(fs.readFileSync(receipt,'utf8')));
  }
  const helper=safeFile(process.platform==='win32'?'vivim-workstation-probe.exe':'vivim-workstation-probe',grant.helperSha256,32*1024*1024);
  const runner=safeFile(path.join('runtime','tools','mcp','vivim-arbor','server','probe-acceptance-runner.mjs'),grant.runnerSha256,65536);
  check();
  const fd=fs.openSync(claim,'wx',0o600);fs.closeSync(fd);
  const env={VIVIM_WORKSTATION_PROBE_EXE:helper,VIVIM_WORKSTATION_PROBE_SHA256:grant.helperSha256};
  if(process.platform==='win32'&&process.env.SystemRoot)env.SystemRoot=process.env.SystemRoot;
  const result=await execute(process.execPath,[runner],{cwd:directory,env,shell:false,windowsHide:true,encoding:'utf8',timeout:45000,maxBuffer:16384});
  const value=project(JSON.parse(result.stdout));
  fs.writeFileSync(receipt,JSON.stringify(value)+'\n',{flag:'wx',mode:0o600});
  check();return value;
 }
 return [name,'Run the locally authorized, time-limited fixed native Node version acceptance probe through an isolated real ARBOR Host. Replays the same receipt; no arbitrary commands.',schema,invoke];
}
module.exports={createAcceptance};
