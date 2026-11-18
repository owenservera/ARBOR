// Fixed local composition over incumbent typed Wiki reads. A native validation
// is not a grant. The dispatcher alone supplies authenticated read ports.
import {createHash} from 'node:crypto';
export const WIKI_RECIPE_SCHEMA='vivim.wiki-read-recipe/1';
const READS=new Set(['wiki.pages.list','wiki.section.read']);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function compileWikiReadRecipe(commands,planCommand,catalog){
  if(typeof commands!=='string'||commands.length>950)return null;
  const lines=commands.split(/\r?\n/).map(s=>s.trim());
  if(lines.length<2||lines.length>8||lines.some(s=>!s||s.length>240))return null;
  let plans;try{plans=lines.map(planCommand)}catch{return null;}
  if(plans.some(p=>p?.outcome!=='ready'||p.risk!=='R0'||p.origin!=='deterministic'||!READS.has(p.actionId)))return null;
  const steps=plans.map(p=>({actionId:p.actionId,args:p.args}));
  const dependencies=[...new Set(['program.read_wiki',...steps.map(p=>p.actionId)])].sort().map(id=>({id,digest:hash(catalog.actions.find(a=>a.id===id)??null)}));
  return {schema:WIKI_RECIPE_SCHEMA,steps,dependencies,commandDigest:hash(commands)};
}
export function validWikiRecipe(recipe,commands,catalog){
  if(!recipe||recipe.schema!==WIKI_RECIPE_SCHEMA||Object.keys(recipe).sort().join(',')!=='commandDigest,dependencies,schema,steps'||
    typeof commands!=='string'||commands.length>950||recipe.commandDigest!==hash(commands)||!Array.isArray(recipe.steps)||recipe.steps.length<2||recipe.steps.length>8||!Array.isArray(recipe.dependencies))return false;
  for(const p of recipe.steps){if(!p||Object.keys(p).sort().join(',')!=='actionId,args'||!READS.has(p.actionId)||!p.args||Array.isArray(p.args)||typeof p.args!=='object')return false;
    const a=catalog.actions.find(a=>a.id===p.actionId);if(!a||a.risk!=='R0'||!['source_wired','verified'].includes(a.readiness)||Object.keys(p.args).length!==Object.keys(a.args).length)return false;
    for(const [key,s] of Object.entries(a.args)){const v=p.args[key];if(typeof v!=='string'||v!==v.trim()||v.length<s.min||v.length>s.max)return false;}}
  const expected=[...new Set(['program.read_wiki',...recipe.steps.map(p=>p.actionId)])].sort().map(id=>({id,digest:hash(catalog.actions.find(a=>a.id===id)??null)}));
  return hash(recipe.dependencies)===hash(expected);
}
const refusal=(reasonCode,outcome='refused')=>({schema:'vivim.wiki-read-program/1',outcome,reasonCode,effectPerformed:false,mutationPerformed:false});
export async function runWikiReadProgram({commands,planCommand,readWiki,nativeProgram,readAction,recipe=null,catalog=null,planTyped=null,stillCurrent=()=>true,readEvidence=null,resolveTarget=null}={}){
  if(typeof commands!=='string'||commands.length>950)return refusal('PROGRAM_INPUT_INVALID');
  const lines=commands.split(/\r?\n/).map(s=>s.trim());
  if(lines.length<2||lines.length>8||lines.some(s=>!s||s.length>240))return refusal('PROGRAM_INPUT_INVALID');
  let plans;
  try{
    if(recipe){if(!catalog||!validWikiRecipe(recipe,commands,catalog)||typeof planTyped!=='function')return refusal('PROGRAM_RECIPE_STALE');
      plans=recipe.steps.map(step=>planTyped(step));
    }else plans=lines.map(text=>planCommand(text));
  }catch{return refusal('PROGRAM_CHILD_INVALID');}
  if(plans.some(p=>p?.outcome!=='ready'||p.risk!=='R0'||p.origin!==(recipe?'typed':'deterministic')||!READS.has(p.actionId)))
    return refusal('PROGRAM_CHILD_NOT_READ_ONLY');
  if(!stillCurrent())return refusal('PROGRAM_RECIPE_STALE');
  let wiki;try{wiki=await readWiki();}catch{return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');}
  if(!Number.isSafeInteger(wiki?.revision)||!wiki.pages)return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');
  const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
  const planDigest=digest(plans.map(p=>({actionId:p.actionId,args:p.args})));
  // Resolve canonical section names using the incumbent read function, without releasing contents.
  let targets;try{targets=plans.map(p=>{if(p.actionId!=='wiki.section.read')return null;return typeof resolveTarget==='function'?resolveTarget(p,wiki):{page:p.args.page,section:p.args.section};});}
  catch{return refusal('PROGRAM_WIKI_TARGET_UNKNOWN');}
  let evidence=targets.map(()=>null);
  if(typeof readEvidence==='function'){
    const selected=targets.filter(Boolean);let response;
    try{response=await readEvidence(selected,wiki.revision);}catch(error){return refusal(error?.status===409?'PROGRAM_WIKI_STALE':'PROGRAM_SOURCE_UNAVAILABLE','unavailable');}
    if(response?.schema!=='vivim.wiki-program-evidence/1'||response.authority!=='host-product-journal'||response.wikiRevision!==wiki.revision||
      !Array.isArray(response.items)||response.items.length!==selected.length)return refusal('PROGRAM_SOURCE_UNAVAILABLE','unavailable');
    let index=0;for(let i=0;i<targets.length;i++){if(!targets[i])continue;
      const row=response.items[index++],target=targets[i],source=row?.source;
      if(row?.page!==target.page||row.section!==target.section)return refusal('PROGRAM_SOURCE_UNAVAILABLE','unavailable');
      if(source!==null&&(!source||source.kind!=='committed-wiki-edit'||source.status!=='current-section-revision'||
        !/^[a-f0-9-]{36}$/.test(source.entryId??'')||!Number.isSafeInteger(source.wikiRevision)||source.wikiRevision<1||source.wikiRevision>wiki.revision||
        !/^[a-f0-9]{64}$/.test(source.contentDigest??'')||
        createHash('sha256').update(wiki.pages[target.page].sections[target.section],'utf8').digest('hex')!==source.contentDigest))
        return refusal('PROGRAM_SOURCE_UNAVAILABLE','unavailable');
      evidence[i]=source;
    }
  }
  const snapshotDigest=hash({wikiRevision:wiki.revision,pages:wiki.pages,planDigest,evidence});
  const id='wiki-read-'+snapshotDigest.slice(0,24);
  const steps=plans.map((p,i)=>({id:'read-'+(i+1),kind:'evaluate',dependencies:i?['read-'+i]:[],
    inputs:evidence[i]?[{source_id:evidence[i].entryId,revision:evidence[i].wikiRevision,digest:evidence[i].contentDigest,data_class:'private'}]:[],
    output_data_class:'private',risk:'R0',destination:null}));
  let validated;try{validated=await nativeProgram({program:JSON.stringify({id,revision:1,steps})});}catch{return refusal('PROGRAM_NATIVE_UNAVAILABLE','unavailable');}
  if(validated?.outcome!=='compiled')return refusal(validated?.reasonCode??'PROGRAM_NATIVE_UNAVAILABLE',validated?.outcome==='refused'?'refused':'unavailable');
  if(validated.programId!==id||validated.programRevision!==1||validated.executionAuthorized!==false||validated.effectPerformed!==false||
     !/^[a-f0-9]{64}$/.test(validated.programDigest??'')||(evidence.some(Boolean)&&validated.sourceReferencesVerified!==evidence.filter(Boolean).length)||
     JSON.stringify(validated.orderedStepIds)!==JSON.stringify(steps.map(s=>s.id)))return refusal('PROGRAM_NATIVE_CONTRACT_INVALID','unavailable');
  let latest;try{latest=await readWiki();}catch{return refusal('PROGRAM_WIKI_UNAVAILABLE','unavailable');}
  if(!stillCurrent())return refusal('PROGRAM_RECIPE_STALE');
  if(latest.revision!==wiki.revision||digest(latest.pages)!==digest(wiki.pages))return refusal('PROGRAM_WIKI_STALE');
  let results;try{results=plans.map((p,i)=>({stepId:steps[i].id,actionId:p.actionId,args:p.args,result:readAction(p,wiki),sourceEvidence:evidence[i]?{state:'committed-section',...evidence[i]}:{state:'snapshot-only'}}));}
  catch{return refusal('PROGRAM_WIKI_TARGET_UNKNOWN');}
  if(results.some(r=>r.result?.wikiRevision!==wiki.revision))return refusal('PROGRAM_WIKI_STALE');
  // The native validator checks dependency structure; actual Wiki results are
  // produced by existing Host read functions on the same verified snapshot.
  return {schema:'vivim.wiki-read-program/1',outcome:'completed',programId:id,planDigest,nativeProgramDigest:validated.programDigest,
    wikiRevision:wiki.revision,snapshotDigest,steps:results,reusedRecipe:!!recipe,effectPerformed:false,mutationPerformed:false,authority:'read-only'};
}
