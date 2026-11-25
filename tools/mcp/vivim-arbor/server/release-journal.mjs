// Private local release evidence journal. Never callable through MCP.
// Records observations from the incumbent Host/operator; never grants authority,
// runs an effect, clears a claim, or infers health from an event name.
import {createHash,randomBytes} from 'node:crypto';
import {mkdirSync,realpathSync,lstatSync,readdirSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync,linkSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {releaseNext} from './release-sequence.mjs';
const fail=()=>{throw Error('WORKSTATION_RELEASE_JOURNAL_INVALID')};
const hex=(s,n)=>typeof s==='string'&&s.length===n&&/^[a-f0-9]+$/.test(s);
const canonical=x=>Array.isArray(x)?x.map(canonical):x!==null&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const equal=(a,b)=>digest(a)===digest(b);
function read(file){
 const st=lstatSync(file);
 if(!st.isFile()||st.isSymbolicLink()||st.size>65536)fail();
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(file)));
}
function exclusive(file,value){
 const tmp=file+'.'+randomBytes(8).toString('hex')+'.tmp';
 let fd;
 try{
  fd=openSync(tmp,'wx',0o600);writeFileSync(fd,JSON.stringify(value)+'\n');fsyncSync(fd);closeSync(fd);fd=undefined;
  linkSync(tmp,file);return true;
 }catch(e){if(e.code==='EEXIST')return false;throw e;}
 finally{if(fd!==undefined)closeSync(fd);try{unlinkSync(tmp)}catch(e){if(e.code!=='ENOENT')throw e;}}
}
export function openReleaseJournal(privateRoot,transactionId){
 if(typeof privateRoot!=='string'||!path.isAbsolute(privateRoot)||!hex(transactionId,32))fail();
 // Caller supplies an already provisioned, ACL-protected root. Do not create
 // or change owner access policies here. Junctions/symlinks are refused.
 const root=realpathSync(privateRoot);
 if(!lstatSync(privateRoot).isDirectory()||lstatSync(privateRoot).isSymbolicLink())fail();
 const dir=path.join(root,transactionId);
 try{mkdirSync(dir,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}
 if(!lstatSync(dir).isDirectory()||lstatSync(dir).isSymbolicLink()||realpathSync(dir)!==dir)fail();
 const planFile=path.join(dir,'plan.json');
 function load(){
  const envelope=read(planFile);
  if(envelope?.schema!=='vivim.workstation-release-journal/1'||envelope.transactionId!==transactionId||
     !hex(envelope.planDigest,64)||digest(envelope.plan)!==envelope.planDigest)fail();
  releaseNext(envelope.plan,[]);
  const files=readdirSync(dir).filter(n=>n.endsWith('.event.json')).sort();
  if(files.length>40)fail();
  const events=[];let previous=envelope.planDigest;
  for(let i=0;i<files.length;i++){
   const name=String(i+1).padStart(3,'0')+'.event.json';
   if(files[i]!==name)fail();
   const record=read(path.join(dir,name)),{recordDigest,...body}=record;
   if(body.schema!=='vivim.workstation-release-event/1'||body.transactionId!==transactionId||
      body.planDigest!==envelope.planDigest||body.previousDigest!==previous||
      !hex(recordDigest,64)||digest(body)!==recordDigest)fail();
   events.push(body.event);previous=recordDigest;
  }
  return {plan:envelope.plan,planDigest:envelope.planDigest,events,headDigest:previous,progress:releaseNext(envelope.plan,events)};
 }
 return Object.freeze({
  initialize(plan){
   releaseNext(plan,[]);
   const envelope={schema:'vivim.workstation-release-journal/1',transactionId,planDigest:digest(plan),plan};
   if(!exclusive(planFile,envelope)&&!equal(read(planFile),envelope))fail();
   return load();
  },
  status:load,
  observe({expectedHead,kind,evidenceDigest}){
   if(!hex(expectedHead,64)||!hex(evidenceDigest,64)||typeof kind!=='string')fail();
   const before=load();
   if(before.headDigest!==expectedHead)throw Error('WORKSTATION_RELEASE_JOURNAL_STALE');
   const event={sequence:before.events.length+1,kind,activeTree:before.plan.activeTree,candidateTree:before.plan.candidateTree,evidenceDigest};
   releaseNext(before.plan,[...before.events,event]);
   const body={schema:'vivim.workstation-release-event/1',transactionId,planDigest:before.planDigest,previousDigest:before.headDigest,event};
   const record={...body,recordDigest:digest(body)};
   // Exclusive publication prevents two writers from advancing the same slot.
   // A crash after an effect claim leaves an unresolved claim; never rerun it.
   if(!exclusive(path.join(dir,String(event.sequence).padStart(3,'0')+'.event.json'),record))
    throw Error('WORKSTATION_RELEASE_JOURNAL_STALE');
   return load();
  }
 });
}
