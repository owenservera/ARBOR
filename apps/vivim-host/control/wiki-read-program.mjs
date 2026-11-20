// Fixed local composition over incumbent typed Wiki reads. A native validation
// is not a grant. The dispatcher alone supplies authenticated read ports.
import {createHash} from 'node:crypto';
import {runNativeProductPureSync} from './native-product-pure-sync.mjs';
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

// Reuse the same canonical contract fingerprinting for owner-reviewed mutation recipes.
// Parameterization is over typed fields only; literal content is never interpolated.
export const WIKI_WRITE_RECIPE_SCHEMA='vivim.wiki-write-recipe/1';
// Compiled Rust recipe operations are inert. Older/unpackaged kernels retain
// the current JS contracts; current kernel refusals remain refusals.
function nativeWikiWriteRecipe(mode,commands,catalog,details={}){
  const reply=runNativeProductPureSync('wiki-write-recipe',{
    schema:'vivim.wiki-write-recipe-request/1',mode,commands,
    actions:catalog?.actions??[],...details
  });
  if(!reply)return null;
  if(reply.authority!=='none'||reply.executionAuthorized!==false||
    reply.effectPerformed!==false||
    !['compiled','valid','bound','refused'].includes(reply.outcome))
    return {outcome:'refused'};
  return reply;
}

const WRITES=new Set(['wiki.page.create','wiki.section.edit','wiki.page.move','wiki.pages.link']);
export const wikiProgramSlug=v=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,62}$/.test(v)&&!['constructor','prototype','__proto__'].includes(v);
function writeDependencies(steps,catalog){
  return [...new Set(['program.write_wiki',...steps.map(p=>p.actionId)])].sort().map(id=>({id,digest:hash(catalog.actions.find(a=>a.id===id)??null)}));
}
function writeArgsValid(step,catalog){
  if(!step||Object.keys(step).sort().join(',')!=='actionId,args'||!WRITES.has(step.actionId)||!step.args||Array.isArray(step.args)||typeof step.args!=='object')return false;
  const a=catalog.actions.find(a=>a.id===step.actionId);
  return !!a&&a.risk==='R1'&&['source_wired','verified'].includes(a.readiness)&&Object.keys(a.args).length===Object.keys(step.args).length&&
    Object.entries(a.args).every(([key,s])=>{const v=step.args[key];return typeof v==='string'&&v.length&&v===v.trim()&&(s.type==='enum'?s.values.includes(v):s.type==='string'&&v.length>=s.min&&v.length<=s.max);});
}
function hasPageSlot(steps,page){
  return wikiProgramSlug(page)&&steps.filter(s=>s.actionId==='wiki.page.create'&&s.args.page===page).length===1&&
    steps.filter(s=>s.actionId==='wiki.page.create').length===1;
}
export function compileWikiWriteRecipe(commands,planCommand,catalog,page=null){
  if(typeof commands!=='string'||commands.length>950)return null;
  const lines=commands.split(/\r?\n/).map(s=>s.trim());
  if(lines.length<2||lines.length>8||lines.some(s=>!s||s.length>240))return null;
  let plans;try{plans=lines.map(planCommand);}catch{return null;}
  const native=nativeWikiWriteRecipe('compile',commands,catalog,{plans,page});
  if(native){
    if(native.outcome==='compiled'&&native.recipe?.schema===WIKI_WRITE_RECIPE_SCHEMA&&
      Array.isArray(native.recipe.steps)&&native.recipe.steps.length===plans.length&&
      native.recipe.steps.every((step,i)=>step.actionId===plans[i].actionId&&
        hash(step.args)===hash(plans[i].args)))return native.recipe;
    return null;
  }
  if(plans.some(p=>p?.outcome!=='approval_required'||p.origin!=='deterministic'||p.risk!=='R1'||!WRITES.has(p.actionId)))return null;
  const steps=plans.map(p=>({actionId:p.actionId,args:p.args}));
  if(!steps.every(s=>writeArgsValid(s,catalog))||(page!==null&&!hasPageSlot(steps,page)))return null;
  return {schema:WIKI_WRITE_RECIPE_SCHEMA,steps,dependencies:writeDependencies(steps,catalog),commandDigest:hash(commands),
    slot:page===null?null:{name:'page',type:'wiki-page-slug',example:page}};
}
export function validWikiWriteRecipe(recipe,commands,catalog){
  const native=nativeWikiWriteRecipe('validate',commands,catalog,{recipe});
  if(native)return native.outcome==='valid';
  return !!recipe&&recipe.schema===WIKI_WRITE_RECIPE_SCHEMA&&Object.keys(recipe).sort().join(',')==='commandDigest,dependencies,schema,slot,steps'&&
    typeof commands==='string'&&commands.length<=950&&recipe.commandDigest===hash(commands)&&Array.isArray(recipe.steps)&&recipe.steps.length>=2&&recipe.steps.length<=8&&
    recipe.steps.every(s=>writeArgsValid(s,catalog))&&Array.isArray(recipe.dependencies)&&hash(recipe.dependencies)===hash(writeDependencies(recipe.steps,catalog))&&
    (recipe.slot===null||recipe.slot&&Object.keys(recipe.slot).sort().join(',')==='example,name,type'&&recipe.slot.name==='page'&&recipe.slot.type==='wiki-page-slug'&&hasPageSlot(recipe.steps,recipe.slot.example));
}
export function bindWikiWriteRecipe(recipe,commands,catalog,page=null){
  const native=nativeWikiWriteRecipe('bind',commands,catalog,{recipe,page});
  if(native){
    if(native.outcome==='bound'&&Array.isArray(native.steps)&&
      native.steps.length===recipe?.steps?.length&&
      native.steps.every(step=>writeArgsValid(step,catalog)))return native.steps;
    return null;
  }
  if(!validWikiWriteRecipe(recipe,commands,catalog))return null;
  if(recipe.slot===null)return page===null?recipe.steps.map(s=>({actionId:s.actionId,args:{...s.args}})):null;
  if(!wikiProgramSlug(page))return null;
  const example=recipe.slot.example,steps=recipe.steps.map(s=>{
    const args={...s.args};
    for(const key of ['page','from','to'])if(typeof args[key]==='string'&&args[key].toLowerCase()===example)args[key]=page;
    if(s.actionId==='wiki.section.edit'&&typeof args.target==='string'){
      const slash=args.target.indexOf('/');
      if(slash>0&&args.target.slice(0,slash).toLowerCase()===example)args.target=page+args.target.slice(slash);
    }
    return {actionId:s.actionId,args};
  });
  return steps.every(s=>writeArgsValid(s,catalog))?steps:null;
}
