// Fixed local composition over incumbent typed Wiki reads. A native validation
// is not a grant. The dispatcher alone supplies authenticated read ports.
import {createHash} from 'node:crypto';
const READS=new Set(['wiki.pages.list','wiki.section.read']);
const refusal=(reasonCode,outcome='refused')=>({schema:'vivim.wiki-read-program/1',outcome,reasonCode,effectPerformed:false,mutationPerformed:false});
export async function runWikiReadProgram({commands,planCommand,readWiki,nativeProgram,readAction}={}){
  if(typeof commands!=='string'||commands.length>950)return refusal('PROGRAM_INPUT_INVALID');
  const lines=commands.split(/\r?\n/).map(s=>s.trim());
  if(lines.length<2||lines.length>8||lines.some(s=>!s||s.length>240))return refusal('PROGRAM_INPUT_INVALID');
  let plans;
  try{plans=lines.map(text=>planCommand(text));}catch{return refusal('PROGRAM_CHILD_INVALID');}
  if(plans.some(p=>p?.outcome!=='ready'||p.risk!=='R0'||p.origin!=='deterministic'||!READS.has(p.actionId)))
    return refusal('PROGRAM_CHILD_NOT_READ_ONLY');
  let wiki;try{wiki=await readWiki();}catch{return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');}
  if(!Number.isSafeInteger(wiki?.revision)||!wiki.pages)return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');
  const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
  const planDigest=digest(plans.map(p=>({actionId:p.actionId,args:p.args})));
  const id='wiki-read-'+planDigest.slice(0,24);
  const steps=plans.map((p,i)=>({id:'read-'+(i+1),kind:'evaluate',dependencies:i?['read-'+i]:[],inputs:[],output_data_class:'private',risk:'R0',destination:null}));
  let validated;try{validated=await nativeProgram({program:JSON.stringify({id,revision:1,steps})});}catch{return refusal('PROGRAM_NATIVE_UNAVAILABLE','unavailable');}
  if(validated?.outcome!=='compiled')return refusal(validated?.reasonCode??'PROGRAM_NATIVE_UNAVAILABLE',validated?.outcome==='refused'?'refused':'unavailable');
  if(validated.programId!==id||validated.programRevision!==1||validated.executionAuthorized!==false||validated.effectPerformed!==false||
     JSON.stringify(validated.orderedStepIds)!==JSON.stringify(steps.map(s=>s.id)))return refusal('PROGRAM_NATIVE_CONTRACT_INVALID','unavailable');
  let latest;try{latest=await readWiki();}catch{return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');}
  if(latest.revision!==wiki.revision||digest(latest.pages)!==digest(wiki.pages))return refusal('PROGRAM_WIKI_STALE');
  let results;try{results=plans.map((p,i)=>({stepId:steps[i].id,actionId:p.actionId,args:p.args,result:readAction(p,wiki)}));}
  catch{return refusal('PROGRAM_WIKI_TARGET_UNKNOWN');}
  if(results.some(r=>r.result?.wikiRevision!==wiki.revision))return refusal('PROGRAM_WIKI_STALE');
  // The native validator checks dependency structure; actual Wiki results are
  // produced by existing Host read functions on the same verified snapshot.
  return {schema:'vivim.wiki-read-program/1',outcome:'completed',programId:id,planDigest,nativeProgramDigest:validated.programDigest,
    wikiRevision:wiki.revision,steps:results,effectPerformed:false,mutationPerformed:false,authority:'read-only'};
}
