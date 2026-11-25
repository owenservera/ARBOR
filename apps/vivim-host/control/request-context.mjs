// Request-scoped, inert VLANG context. No new store, inference engine, command
// parser or grants. Context is compiled from the Host's existing typed result,
// never from a client-supplied candidate, path, identity list or permission.
import { createHash } from 'node:crypto';
import { sectionId } from '../chat/wiki-semantics.mjs';
import { loadControlCatalog, validateControlCatalog } from './intent-planner.mjs';

export const REQUEST_CONTEXT_SCHEMA = 'vivim.request-context/1';
const MAX_PAGES = 6, MAX_SECTIONS = 8;
const SOURCE_IDS = new Set(['vivim.vec-compile@0.1','vivim.command-intent@0.1']);
const unavailable = () => ({status:'unavailable'});
const compare = (a,b) => a<b?-1:a>b?1:0;
const idPattern = /(?:^|[\s(\x60"'])(([a-z0-9][a-z0-9._-]*)@\d+(?:\.\d+)*)(?=$|[\s)\x60"',;?!])/g;

export function requestSourceIds(text, plan) {
  const compiled=plan?.language?.vec;
  if(compiled?.schema==='vivim.vec-compile/0.1' && compiled.domain==='command' &&
     compiled.outcome==='candidate' && compiled.authorization==='none' &&
     compiled.executed===false && compiled.persisted===false &&
     compiled.proposal?.schema==='vivim.command-intent/0.1' &&
     compiled.proposal.actionId===plan.actionId &&
     Array.isArray(compiled.sourceSemanticIds))
    return [...new Set(compiled.sourceSemanticIds.filter(id=>SOURCE_IDS.has(id)))].sort(compare);
  // For unresolved *source lookups*, only a literal versioned source reference
  // can ground the request. This is identity extraction, not a second interpreter.
  if(plan?.outcome!=='interpretation_required' || typeof text!=='string')return [];
  return [...new Set([...text.matchAll(idPattern)].map(m=>m[1]).filter(id=>id.length<=160))].sort(compare).slice(0,4);
}

// Read-only catalog projection, bound to the actual canonical VEC candidate.
// The catalog declares argument constraints and required scopes. It does not
// independently verify the handler, effective access policy or current grant.
export function selectRequestActionContract(plan,catalog) {
  const compiled=plan?.language?.vec, intent=compiled?.proposal, provenance=intent?.provenance;
  if(compiled?.schema!=='vivim.vec-compile/0.1'||compiled.domain!=='command'||
     compiled.outcome!=='candidate'||compiled.authorization!=='none'||
     compiled.executed!==false||compiled.persisted!==false||
     intent?.schema!=='vivim.command-intent/0.1'||intent.outcome!=='candidate'||
     intent.actionId!==plan.actionId||provenance?.authority!=='none'||
     !Number.isSafeInteger(provenance.catalogRevision)||!Number.isSafeInteger(provenance.worldRevision))return null;
  try{validateControlCatalog(catalog)}catch{return unavailable()}
  if(catalog.version!==provenance.catalogRevision)return {status:'stale'};
  const action=catalog.actions.find(a=>a.id===intent.actionId);
  if(!action||action.risk!==intent.risk||action.readiness!==intent.readiness||action.owner!==intent.owner)return unavailable();
  const args=intent.args,planArgs=plan.args;
  if(!args||!planArgs||Object.keys(args).length!==Object.keys(action.args).length||
     Object.keys(planArgs).length!==Object.keys(action.args).length)return unavailable();
  const slots=[];
  for(const name of Object.keys(action.args).sort(compare)){
    const constraint=action.args[name],value=args[name];
    if(!Object.hasOwn(args,name)||!Object.hasOwn(planArgs,name)||value!==planArgs[name]||
       typeof value!=='string'||!value||value!==value.trim()||
       (constraint.type==='enum'?!constraint.values.includes(value):value.length<constraint.min||value.length>constraint.max))return unavailable();
    // Never include argument values (which may be owner-private text).
    slots.push({name,type:constraint.type,required:true,...(constraint.type==='enum'?
      {values:[...constraint.values]}:{min:constraint.min,max:constraint.max})});
  }
  const requiredScopes=[...(action.requiredScopes??[])].sort(compare);
  if(!Array.isArray(intent.requiredScopes)||JSON.stringify([...intent.requiredScopes].sort(compare))!==JSON.stringify(requiredScopes))return unavailable();
  const declaration={actionId:action.id,catalogRevision:catalog.version,risk:action.risk,
    owner:action.owner,readiness:action.readiness,slots,requiredScopes};
  return {status:'declared',authority:'read-only',planningEligible:false,
    ...declaration,declarationDigest:createHash('sha256').update(JSON.stringify(declaration)).digest('hex'),
    worldRevision:provenance.worldRevision,missing:['verified-action-contract','effective-access-policy']};
}

function resolvePage(wiki, value) {
  if(typeof value!=='string')return null;
  const matches=Object.keys(wiki.pages).filter(p=>p.toLowerCase()===value.toLowerCase());
  return matches.length===1?matches[0]:null;
}
function resolveSection(wiki,page,value) {
  if(typeof value!=='string')return null;
  const matches=Object.keys(wiki.pages[page].sections).filter(s=>s.toLowerCase()===value.toLowerCase());
  return matches.length===1?matches[0]:null;
}
function linkTargets(wiki,page) {
  return [...new Set([
    ...(wiki.pages[page].links||[]).filter(p=>Object.hasOwn(wiki.pages,p)),
    ...Object.keys(wiki.pages).filter(p=>wiki.pages[p].links?.includes(page))
  ])].sort(compare);
}
export function selectRequestWiki(wiki, plan) {
  const action=plan?.actionId;
  if(typeof action!=='string' || !action.startsWith('wiki.'))return null;
  if(!['approval_required','done','incomplete','clarification_required'].includes(plan.outcome))return null;
  if(!Number.isSafeInteger(wiki?.revision)||!wiki.pages)return unavailable();
  const expected=plan.preview?.expectedRevision??plan.result?.wikiRevision;
  if(expected!==undefined&&expected!==wiki.revision)return {status:'stale'};
  const args=plan.args??{}, targets=[];
  const [editPage,editSection]=typeof args.target==='string'?args.target.split('/'):[];
  const add=(name,section)=>{
    const page=resolvePage(wiki,name);
    if(page&&!targets.some(t=>t.page===page))
      targets.push({page,section:resolveSection(wiki,page,section)});
  };
  if(action!=='wiki.page.create'){
    add(editPage,editSection);
    add(args.page,args.section);
    add(args.from); add(args.to);
  }
  const selected=new Map(targets.map(t=>[t.page,{...t,relation:'exact-target'}]));
  for(const {page} of targets)
    for(const related of linkTargets(wiki,page)){
      if(selected.size>=MAX_PAGES)break;
      if(!selected.has(related))selected.set(related,{page:related,section:null,relation:'linked-page'});
    }
  if(!selected.size && (action==='wiki.pages.list'||plan.outcome==='incomplete'||plan.outcome==='clarification_required')) {
    // Names only when a target is missing; no fabricated target or auto-selection.
    for(const page of Object.keys(wiki.pages).slice(0,MAX_PAGES))
      selected.set(page,{page,section:null,relation:'available-target'});
  }
  const journalLinks=wiki.wikiStructure?.wikiRevision===wiki.revision?wiki.wikiStructure.links||[]:[];
  const pages=[...selected.values()].map(({page,section,relation})=>{
    const names=Object.keys(wiki.pages[page].sections);
    const items=names.slice(0,MAX_SECTIONS);
    if(section&&!items.includes(section))items[items.length-1]=section;
    const evidence=relation==='linked-page'?journalLinks.find(e=>
      e.status==='current-link'&&((e.edit.from===page&&targets.some(t=>t.page===e.edit.to))||
        (e.edit.to===page&&targets.some(t=>t.page===e.edit.from)))):null;
    return {page,semanticId:'wiki:page:'+encodeURIComponent(page),relation,
      ...(evidence?{relationshipSource:{authority:'host-product-journal',ref:evidence.entryId,
        wikiRevision:evidence.wikiRevision,digest:evidence.contentDigest,
        from:evidence.edit.from,to:evidence.edit.to}}:{}),
      sections:items,omittedSections:Math.max(0,names.length-items.length),
      ...(section?{section:{name:section,semanticId:sectionId(page,section),
        contentDigest:createHash('sha256').update(wiki.pages[page].sections[section],'utf8').digest('hex')}}:{})};
  });
  return {status:pages.length?'source-backed':'empty',wikiRevision:wiki.revision,
    authority:'read-only',pages};
}

export async function attachRequestContext(plan,{text,readWiki,compileSources,readCatalog=loadControlCatalog}={}) {
  if(typeof text!=='string'||!text.trim()||text.length>1000||
      !plan||plan.outcome==='refused')return plan;
  let wiki=null,source=null,action=null;
  if(typeof readWiki==='function'&&plan.actionId?.startsWith('wiki.')&&
     ['approval_required','done','incomplete','clarification_required'].includes(plan.outcome)){
    try{wiki=selectRequestWiki(await readWiki(),plan)}catch{wiki=unavailable()}
  }
  if(typeof compileSources==='function'){
    const sourceSemanticIds=requestSourceIds(text,plan);
    if(sourceSemanticIds.length){
      try{source=await compileSources({task:text,sourceSemanticIds})}catch{source=unavailable()}
    }
  }
  // Recheck the Wiki revision after asynchronous work; do not attach stale context.
  if(source&&wiki?.wikiRevision!==undefined){
    try{if((await readWiki()).revision!==wiki.wikiRevision)wiki={status:'stale'}}
    catch{wiki=unavailable()}
  }
  // Read catalog after async source/Wiki work to catch catalog revision drift.
  // This metadata stays on the owner source-context path, not paired-phone Wiki.
  if(typeof compileSources==='function'&&plan.language?.vec?.proposal?.provenance?.authority==='none'){
    try{action=selectRequestActionContract(plan,readCatalog())}catch{action=unavailable()}
  }
  if(!wiki&&!source&&!action)return plan;
  return {...plan,requestContext:{schema:REQUEST_CONTEXT_SCHEMA,authority:'read-only',
    ...(wiki?{wiki}:{}),...(source?{source}:{}),...(action?{action}:{})}};
}
