// Host-owned, read-only adapter to the existing native HQKG graph.
// No local Rust binary or existing journal => report unavailable; never
// substitute synthetic context, accept client-selected graph IDs or spawn a shell.
import path from 'node:path';
import { lstatSync } from 'node:fs';
import { mkdir, lstat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { projectAppliedControlEffects } from './product-journal.mjs';
import { sectionId, receiptId, pageId } from './wiki-semantics.mjs';
import {execFile as execFileCb} from 'node:child_process';
import {promisify} from 'node:util';
const execFile=promisify(execFileCb);
export const CHAT_CONTEXT_SCHEMA='vivim.hqkg-chat-context/1';
const MAX_OUTPUT=32768;
const FOCUS=new Set(['today','talk','build','world','wiki','me','control']);
const unavailable=reason=>({
  schema:CHAT_CONTEXT_SCHEMA,state:'unavailable',core:'hqkg',authority:'read-only',
  reason,items:[]
});
export function createRustChatContext({
  env=process.env,execute=execFile,dataRoot=null,productJournal=null,control=null,
  executePersonal=runPersonal,repoRoot=DEFAULT_ROOT,isFile=regularFile
}={}){
  if (productJournal) return managedReader({env,dataRoot,productJournal,control,executePersonal,repoRoot,isFile});
  const binary=env.VIVIM_CHAT_CORE_BIN;
  const journal=env.VIVIM_CHAT_CORE_JOURNAL;
  const seed=env.VIVIM_CHAT_CORE_SEED;
  return async function readChatContext(focus='talk'){
    if(!FOCUS.has(focus))return unavailable('FOCUS_INVALID');
    if(typeof binary!=='string'||!path.isAbsolute(binary)||
       typeof journal!=='string'||!path.isAbsolute(journal)||
       typeof seed!=='string'||!seed||seed.length>120||/[\x00-\x1f\x7f]/.test(seed))
      return unavailable('RUST_CORE_NOT_CONFIGURED');
    let stdout;
    try{
      ({stdout}=await execute(binary,[journal,seed,'320'],{
        encoding:'utf8',shell:false,windowsHide:true,
        timeout:2500,maxBuffer:MAX_OUTPUT
      }));
    }catch{return unavailable('RUST_CORE_READ_FAILED');}
    if(typeof stdout!=='string'||Buffer.byteLength(stdout,'utf8')>MAX_OUTPUT)
      return unavailable('RUST_CORE_OUTPUT_INVALID');
    let data;try{data=JSON.parse(stdout)}catch{return unavailable('RUST_CORE_OUTPUT_INVALID')}
    if(data?.schema!==CHAT_CONTEXT_SCHEMA||data.state!=='source-backed'||
       data.core!=='hqkg'||data.authority!=='read-only'||data.seed!==seed||
       !Number.isSafeInteger(data.epoch)||data.epoch<0||
       !Number.isSafeInteger(data.tokensUsed)||data.tokensUsed>320||
       data.budgetTokens!==320||data.staleCount!==0||
       !Number.isSafeInteger(data.totalRetrieved)||data.totalRetrieved<0||
       typeof data.budgetExhausted!=='boolean'||!Array.isArray(data.items)||
       data.items.length>8||data.items.length>data.totalRetrieved)
      return unavailable('RUST_CORE_CONTRACT_INVALID');
    const items=[];
    for(const row of data.items){
      if(!row||typeof row.title!=='string'||row.title.length>100||
         /[\x00-\x1f\x7f]/.test(row.title)||
         !Number.isSafeInteger(row.depth)||row.depth<0||row.depth>3||
         !Number.isSafeInteger(row.revision)||row.revision<0||
         !Number.isSafeInteger(row.sourceCount)||row.sourceCount<0||
         !Number.isSafeInteger(row.estimatedTokens)||row.estimatedTokens<0||
         row.estimatedTokens>320)
        return unavailable('RUST_CORE_CONTRACT_INVALID');
      // Deliberately strip all Rust-provided unknown fields and file references.
      items.push({title:row.title,depth:row.depth,revision:row.revision,
        sourceCount:row.sourceCount,estimatedTokens:row.estimatedTokens});
    }
    return {
      schema:CHAT_CONTEXT_SCHEMA,state:'source-backed',core:'hqkg',
      authority:'read-only',focus,epoch:data.epoch,
      tokensUsed:data.tokensUsed,budgetTokens:320,staleCount:0,
      budgetExhausted:data.budgetExhausted,totalRetrieved:data.totalRetrieved,
      items,note:'Context is advisory. Host owns plans, approvals, execution and receipts.'
    };
  };
}



// Existing packaged runtime root and workspace Cargo outputs. No PATH probing,
// cargo invocation at runtime, browser-selected executable, or environment
// variables required for a normal Host installation/development build.
const DEFAULT_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PERSONAL_SCHEMA = 'vivim.hqkg-personal/1';
const MAX_CONTEXT_BATCH = 512;
const MAX_CONTEXT_SOURCES = 8192;
const MAX_DISCOVERED_RECEIPTS = 8192;
const MAX_CONTEXT_LINK_BATCH = 24;
const MAX_NATIVE_INPUT = 1024 * 1024;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const SHA = /^[a-f0-9]{64}$/;
const safe = (value, max) => String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ')
  .replace(/\s+/gu, ' ').trim().slice(0, max).replace(/[\uD800-\uDBFF]$/, '');
const safeUInt = n => Number.isSafeInteger(n) && n >= 0;
function regularFile(file) {
  try { const st = lstatSync(file); return st.isFile() && !st.isSymbolicLink(); }
  catch { return false; }
}

export function resolveBundledRustBinary(name,{repoRoot=DEFAULT_ROOT,isFile=regularFile,platform=process.platform}={}) {
  if(!['hqkg-personal','hqkg-chat-context','hqkg-web-feed','vivim-program-validate','vivim-vec-project','vivim-product-pure','vivim-private-shares'].includes(name))return null;
  const ext = platform === 'win32' ? '.exe' : '';
  const dirs = [path.join(repoRoot,'native','bin'), path.join(repoRoot,'target','release'),
    path.join(repoRoot,'target','debug'), path.join(repoRoot,'native','hqkg','target','release'),
    path.join(repoRoot,'native','hqkg','target','debug')];
  return dirs.map(dir => path.resolve(dir,name+ext)).find(isFile) ?? null;
}
export function resolveRustContextRuntime({env=process.env,repoRoot=DEFAULT_ROOT,isFile=regularFile,platform=process.platform}={}) {
  const choose=(name,override)=>override!==undefined
    ? (typeof override==='string'&&path.isAbsolute(override)&&isFile(override)?override:null)
    : resolveBundledRustBinary(name,{repoRoot,isFile,platform});
  return {personal:choose('hqkg-personal',env.VIVIM_PERSONAL_CORE_BIN),
    reader:choose('hqkg-chat-context',env.VIVIM_CHAT_CORE_BIN)};
}

// Source records, not authority. Current Wiki content is bounded and labelled
// as owner-authored content; receipts are historical applied effects only.
// An unverified chat observation is intentionally never ingested.
export function buildNativeKnowledge(snapshot, effects) {
  if (!snapshot || !Array.isArray(snapshot.changes?.items) || snapshot.changes.items.length > 4096 ||
      effects?.state !== 'source-backed' || !Array.isArray(effects.items) || effects.items.length > MAX_CONTEXT_SOURCES)
    throw Error('NATIVE_SOURCE_UNAVAILABLE');
  const rows = [];
  for (const e of snapshot.changes.items) {
    const relation = e.relationship;
    if (e.kind !== 'committed-wiki-edit' || e.source !== 'host-product-journal' ||
        e.status !== 'current-section-revision' || relation?.kind !== 'mutated-section' ||
        typeof e.entryId !== 'string' || !/^[0-9a-f-]{36}$/.test(e.entryId) ||
        typeof relation.page !== 'string' || typeof relation.section !== 'string' ||
        !safeUInt(e.wikiRevision) || e.wikiRevision === 0 ||
        typeof e.content !== 'string' || !SHA.test(e.contentDigest) ||
        createHash('sha256').update(e.content,'utf8').digest('hex') !== e.contentDigest)
      throw Error('NATIVE_WIKI_SOURCE_INVALID');
    rows.push({id:'vivim-context-w-'+digest([relation.page,relation.section]),kind:'wiki',
      semanticId:sectionId(relation.page,relation.section),
      sourceRef:e.entryId,digest:e.contentDigest,revision:e.wikiRevision,
      sourceRevision:e.wikiRevision,order:Date.parse(e.receivedAt),
      title:safe('Wiki: '+relation.page+'/'+relation.section,100),summary:safe(e.content,120)});
  }
  // Page nodes share the existing managed Wiki scope. Use committed structure
  // evidence (including both endpoints of a real link), never seed content.
  const structure=snapshot.context?.wikiStructure;
  const pages=new Map();
  for(const {page,role,event:e} of structure?.pageSources||[]){
    if(e.kind!=='committed-wiki-structure'||e.source!=='host-product-journal'||
       !/^[0-9a-f-]{36}$/.test(e.entryId)||!safeUInt(e.wikiRevision)||!e.wikiRevision||
       e.wikiRevision>structure.wikiRevision||digest(e.edit)!==e.contentDigest||
       typeof page!=='string'||!page||
       !(e.edit.action==='link-pages'?['from','to'].includes(role):role==='page')||
       e.edit[role]!==page||pages.has(page))
      throw Error('NATIVE_WIKI_STRUCTURE_INVALID');
    pages.set(page,{row:{id:'vivim-context-w-'+digest([page]),kind:'wiki',semanticId:pageId(page),
      sourceRef:e.entryId+'.'+role,digest:e.contentDigest,revision:e.wikiRevision,
      sourceRevision:e.wikiRevision,order:Date.parse(e.receivedAt),
      title:safe('Wiki page: '+page,100),summary:'Committed Wiki structure'},page});
  }
  // Capture pages preserve their original identity while newer committed structure wins.
  const captures=snapshot.context?.capturePages??[];
  if(!Array.isArray(captures)||captures.length>256)throw Error('NATIVE_CAPTURE_PAGE_LIMIT');
  const captureIds=new Set();
  for(const e of captures){
    if(!e||!['note','task'].includes(e.kind)||typeof e.page!=='string'||!(/^(note|task)-[a-f0-9]{32}$/).test(e.page)||!e.page.startsWith(e.kind+'-')||
       !/^[0-9a-f-]{36}$/.test(e.entryId)||!safeUInt(e.wikiRevision)||!e.wikiRevision||
       e.wikiRevision>snapshot.context.wikiRevision||!SHA.test(e.contentDigest)||!safeUInt(Date.parse(e.receivedAt))||captureIds.has(e.page))
      throw Error('NATIVE_CAPTURE_PAGE_INVALID');
    captureIds.add(e.page);
    if(pages.has(e.page))continue;
    pages.set(e.page,{page:e.page,row:{id:'vivim-context-w-'+digest([e.page]),kind:'wiki',semanticId:pageId(e.page),
      sourceRef:e.entryId+'.page',digest:e.contentDigest,revision:e.wikiRevision,sourceRevision:e.wikiRevision,
      order:Date.parse(e.receivedAt),title:safe(e.kind==='task'?'Personal task':'Personal note',100),summary:'Committed personal capture page'}});
  }
  // Preserve the existing 24 section + 24 effect allowance. At most 24
  // additional page nodes, choosing complete recent link endpoint pairs first.
  const selected=new Set();
  for(const item of [...(structure?.links||[])].reverse()){
    const pair=[item.edit.from,item.edit.to].filter(p=>!selected.has(p));
    if(selected.size+pair.length<=24)for(const p of pair)selected.add(p);
  }
  for(const {page} of [...pages.values()].sort((a,b)=>b.row.revision-a.row.revision||
    (a.page<b.page?-1:a.page>b.page?1:0))){
    if(selected.size>=24)break;
    selected.add(page);
  }
  for(const page of selected)rows.push(pages.get(page).row);
  for (const e of effects.items) {
    if (e.source !== 'host-control-receipt' || e.kind !== 'executed-effect' ||
        e.status !== 'historical-applied-receipt' ||
        typeof e.planId !== 'string' || !/^ctl-[a-f0-9]{16}$/.test(e.planId) ||
        typeof e.actionId !== 'string' || !/^[a-z0-9._-]{1,128}$/.test(e.actionId) ||
        !SHA.test(e.planDigest) || !SHA.test(e.receiptDigest) ||
        !(e.sourceRevision === null || safeUInt(e.sourceRevision)))
      throw Error('NATIVE_EFFECT_SOURCE_INVALID');
    // The immutable receipt itself has version 1; its target state revision,
    // when supplied by D4, remains separately and exactly identified.
    const wikiLink = e.wikiLink ?? null;
    if (wikiLink && (!['wiki.section.edit','wiki.capture.save'].includes(e.actionId) ||
        wikiLink.kind!=='committed-wiki-change' || typeof wikiLink.entryId!=='string' ||
        !/^[0-9a-f-]{36}$/.test(wikiLink.entryId) ||
        !safeUInt(wikiLink.wikiRevision) || wikiLink.wikiRevision===0))
      throw Error('NATIVE_EFFECT_SOURCE_LINK_INVALID');
    const sequenceLinks=e.sequenceLinks??null;
    if(sequenceLinks&& (e.actionId!=='program.write_wiki'||!Array.isArray(sequenceLinks)||!sequenceLinks.length||sequenceLinks.length>8||
        !safeUInt(e.sourceRevision)||new Set(sequenceLinks.map(s=>s.step)).size!==sequenceLinks.length||
        sequenceLinks.some(s=>!s||!['committed-wiki-edit','committed-wiki-structure'].includes(s.kind)||! /^[0-9a-f-]{36}$/.test(s.entryId)||!safeUInt(s.wikiRevision)||s.wikiRevision<1||s.wikiRevision>e.sourceRevision||!safeUInt(s.step)||s.step<1||s.step>8)))throw Error('NATIVE_WIKI_SEQUENCE_SOURCE_INVALID');
    const visual=e.visualLink??null;
    if(e.actionId==='ui.visual.apply'&&(!visual||visual.kind!=='committed-visual-revision'||
      typeof visual.surfaceId!=='string'||! /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/.test(visual.surfaceId)||
      !/^chg-[a-f0-9]{8}$/.test(visual.changeId)||!safeUInt(visual.parentRevision)||
      !safeUInt(visual.revision)||visual.revision!==visual.parentRevision+1||
      visual.revision!==e.sourceRevision||!SHA.test(visual.previewDigest)||!SHA.test(visual.projectionDigest)||
      !SHA.test(visual.semanticDigest)))throw Error('NATIVE_VISUAL_EFFECT_SOURCE_INVALID');
    if(visual&&e.actionId!=='ui.visual.apply')throw Error('NATIVE_VISUAL_EFFECT_SOURCE_INVALID');
    const linked = wikiLink ? ' · Wiki revision '+wikiLink.wikiRevision :
      sequenceLinks?' · Wiki sequence final rev '+e.sourceRevision+' · '+sequenceLinks.length+' linked records':
      visual?' · Visual '+visual.surfaceId+' rev '+visual.parentRevision+' → '+visual.revision+' · '+visual.changeId:'';
    rows.push({id:'vivim-context-e-'+digest(e.planId),kind:'effect',
      sourceRef:e.planId,digest:e.planDigest,receiptDigest:e.receiptDigest,
      revision:Math.max(1,e.sourceRevision ?? 1),
      sourceRevision:e.sourceRevision,order:Date.parse(e.receivedAt),
      semanticId:receiptId(e.planId),actionId:e.actionId,wikiLink,
      title:safe('Applied: '+e.actionId,100),summary:safe('Historical Host receipt'+linked,120)});
  }
  if (rows.some(r => !safeUInt(r.order) || r.order === 0) ||
      new Set(rows.map(r=>r.id)).size !== rows.length ||
      new Set(rows.map(r=>r.sourceRef)).size !== rows.length) throw Error('NATIVE_SOURCE_IDENTITY_INVALID');
  return rows.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}

// First-class native edges between actual managed page nodes. A bounded
// packet never includes an edge with an omitted endpoint or an unverified link.
export function buildNativeRelationships(snapshot,rows){
  const ids=new Map(rows.filter(r=>r.kind==='wiki'&&r.semanticId.startsWith('wiki:page:'))
    .map(r=>[r.semanticId,r.id]));
  const links=snapshot.context?.wikiStructure?.links||[];
  return links.flatMap(e=>{
    const from=ids.get(pageId(e.edit.from)),to=ids.get(pageId(e.edit.to));
    if(!from||!to)return [];
    if(e.status!=='current-link'||e.edit.action!=='link-pages'||from===to||
      !/^[0-9a-f-]{36}$/.test(e.entryId)||!safeUInt(e.wikiRevision)||!e.wikiRevision||
      e.wikiRevision>snapshot.context.wikiStructure.wikiRevision||digest(e.edit)!==e.contentDigest)
      throw Error('NATIVE_WIKI_RELATION_INVALID');
    return [{id:'vivim-context-p-'+digest([from,to]),from,to,kind:'wiki-page-link',
      sourceRef:e.entryId,revision:e.wikiRevision,digest:e.contentDigest}];
  }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}

function runPersonal(binary, journal, packet) {
  return new Promise((resolve,reject)=>{
    const child=execFileCb(binary,['--journal',journal],{
      encoding:'utf8',shell:false,windowsHide:true,timeout:8000,maxBuffer:MAX_OUTPUT
    },(error,stdout)=>{
      if (error) {
        let reason;
        try { reason=JSON.parse(stdout)?.error; } catch {}
        const code=typeof reason==='string' && reason.startsWith('RECOVERY_REQUIRED')
          ? 'RUST_CORE_RECOVERY_REQUIRED' : typeof reason==='string' &&
          /^(CAPACITY_HELD|COMPACTION_REQUIRED)/.test(reason) ? 'RUST_CORE_CAPACITY_HELD' :
          /^STALE_CONTEXT_(EPOCH|SOURCE)/.test(reason??'') ?
            'RUST_CORE_SOURCE_CHANGED' : 'RUST_CORE_INGEST_FAILED';
        reject(Object.assign(Error(code),{code})); return;
      }
      resolve({stdout});
    });
    child.stdin?.on('error',()=>{}); // callback owns process failure
    child.stdin?.end(JSON.stringify(packet));
  });
}

async function nativePacket(result) {
  if (typeof result?.stdout !== 'string' || Buffer.byteLength(result.stdout,'utf8') > MAX_OUTPUT)
    throw Error('RUST_CORE_OUTPUT_INVALID');
  try { return JSON.parse(result.stdout); } catch { throw Error('RUST_CORE_OUTPUT_INVALID'); }
}

// Plan bounded packets against one existing personal graph and journal. A full
// projection is used only for a first small graph. Existing graphs and larger
// first syncs use explicit source-identified deltas; omission is never deletion.
// Stages are inert descriptions until the Host invokes its already-approved CLI.
export function planNativeContextSync({scope,view,rows,relationships,last=null,hasGraph=false}) {
  if(!SHA.test(scope)||!['wiki','owner'].includes(view)||
    !Array.isArray(rows)||rows.length>MAX_CONTEXT_SOURCES||
    !Array.isArray(relationships)||relationships.length>MAX_CONTEXT_LINK_BATCH)
    throw Error('RUST_CORE_SOURCE_LIMIT');
  const current=new Map(rows.map(row=>[row.id,row]));
  const currentLinks=new Map(relationships.map(link=>[link.id,link]));
  if(current.size!==rows.length||currentLinks.size!==relationships.length)
    throw Error('RUST_CORE_SOURCE_DUPLICATE');
  const delta=last!==null||hasGraph||rows.length>MAX_CONTEXT_BATCH;
  // Order *writes* by referential dependency, not record ID. The stable
  // effect ID prefix sorts before Wiki IDs, but a receipt's exact D4 edge
  // cannot be established until its committed Wiki target is durable.
  // All Wiki sources must land before receipt batches, and page-link edges
  // are ingested after both endpoints. Active read identity order is unchanged.
  const puts=(last?rows.filter(row=>!last.rows.has(row.id)||
    digest(last.rows.get(row.id))!==digest(row)):rows).slice()
    .sort((a,b)=>(a.kind==='wiki'?0:1)-(b.kind==='wiki'?0:1)||
      a.id.localeCompare(b.id));
  const deletes=last?[...last.rows.values()].filter(row=>
    row.kind==='wiki'&&row.semanticId.startsWith('wiki:section:')&&!current.has(row.id))
    .map(row=>({op:'delete',kind:'wiki',id:row.id,
      revision:row.revision,digest:row.digest})):[];
  const linkPuts=last?relationships.filter(link=>!last.links.has(link.id)||
    digest(last.links.get(link.id))!==digest(link)):relationships;
  const linkDeletes=last?[...last.links.values()].filter(link=>!currentLinks.has(link.id))
    .map(link=>({op:'delete',id:link.id,revision:link.revision,digest:link.digest})):[];
  const changes=[...puts.map(row=>({...row,op:'put'})),...deletes];
  const linkChanges=[...linkPuts.map(link=>({...link,op:'put'})),...linkDeletes];
  const baseRevision=last?
    Math.max(0,...[...last.rows.values(),...rows].map(row=>row.revision)):
    Number.MAX_SAFE_INTEGER;
  const activeIds=rows.map(row=>row.id);
  const activeRelationshipIds=relationships.map(link=>link.id);
  const common={schema:PERSONAL_SCHEMA,scope};
  const readScope={view,activeIds,activeRelationshipIds};
  const batched=changes.length>MAX_CONTEXT_BATCH||
    linkChanges.length>MAX_CONTEXT_LINK_BATCH;
  const stages=[];
  let finalPacket,expectedWrites,expectedLinks;
  if(batched) {
    for(let offset=0;offset<changes.length;offset+=MAX_CONTEXT_BATCH)
      stages.push({...common,op:'sync-context',nodes:[],relationships:[],
        deltas:changes.slice(offset,offset+MAX_CONTEXT_BATCH),baseRevision});
    for(let offset=0;offset<linkChanges.length;offset+=MAX_CONTEXT_LINK_BATCH)
      stages.push({...common,op:'sync-context',nodes:[],relationships:[],
        deltas:[],relationshipDeltas:linkChanges.slice(offset,offset+MAX_CONTEXT_LINK_BATCH),
        baseRevision});
    finalPacket={...common,op:'sync-context-read',nodes:[],relationships:[],
      deltas:[],baseRevision,...readScope};
    expectedWrites=0;expectedLinks=0;
  } else if(delta){
    finalPacket={...common,op:'sync-context-read',nodes:[],baseRevision,
      deltas:changes,relationships:linkPuts,relationshipDeltas:linkDeletes,
      ...readScope};
    expectedWrites=puts.length;expectedLinks=linkPuts.length;
  } else {
    finalPacket={...common,op:'sync-context-read',nodes:rows,
      relationships,...readScope};
    expectedWrites=rows.length;expectedLinks=relationships.length;
  }
  const check=packet=>Buffer.byteLength(JSON.stringify(packet),'utf8')<=MAX_NATIVE_INPUT;
  if(!stages.every(check)||!check(finalPacket))
    throw Error('RUST_CORE_SOURCE_LIMIT');
  return {stages,finalPacket,delta,batched,expectedWrites,expectedLinks,
    expectedTombstones:batched?0:deletes.length,
    next:{rows:current,links:currentLinks}};
}

// Read only the receipt filenames from the existing Host control journal.
// Every candidate is resolved by the canonical dispatcher.status() read; this
// is discovery, not a new receipt parser, authority, approval or persistence.
// It never supplies receipt summaries to a phone-facing Wiki read.
export async function discoverOwnerControlReceipts(dataRoot,dispatcher) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||
    typeof dispatcher?.status!=='function')
    throw Error('NATIVE_EFFECT_SOURCE_UNAVAILABLE');
  const dir=path.join(dataRoot,'control','plans');
  let st;
  try {st=await lstat(dir);} catch(error){
    if(error?.code==='ENOENT')return [];
    throw error;
  }
  if(!st.isDirectory()||st.isSymbolicLink())
    throw Error('NATIVE_EFFECT_SOURCE_UNSAFE');
  const entries=await readdir(dir,{withFileTypes:true});
  const receipts=entries.filter(entry=>entry.name.endsWith('.receipt.json'));
  if(receipts.length>MAX_DISCOVERED_RECEIPTS)
    throw Error('NATIVE_EFFECT_SOURCE_LIMIT');
  const results=[];
  for(const entry of receipts){
    if(!/^ctl-[a-f0-9]{16}\.receipt\.json$/.test(entry.name))continue;
    if(!entry.isFile()||entry.isSymbolicLink())
      throw Error('NATIVE_EFFECT_SOURCE_UNSAFE');
    const planId=entry.name.slice(0,-'.receipt.json'.length);
    // This call exercises the Host's own risk, state and receipt read path.
    const detail=dispatcher.status(planId);
    if(detail?.planId!==planId || detail.state!=='applied')continue;
    if(detail.receipt?.planId!==planId)
      throw Error('NATIVE_EFFECT_SOURCE_INVALID');
    results.push({planId,actionId:detail.actionId,
      risk:detail.risk,state:detail.state,
      createdAt:detail.createdAt});
  }
  return results.sort((a,b)=>
    String(b.createdAt).localeCompare(String(a.createdAt))||
    a.planId.localeCompare(b.planId));
}

function managedReader({env,dataRoot,productJournal,control,executePersonal,repoRoot,isFile}) {
  const root=typeof dataRoot==='string' && path.isAbsolute(dataRoot) ? path.resolve(dataRoot) : null;
  // One Host-owned native personal journal. An existing explicit journal is
  // supported, but native namespace validation refuses an unrelated graph.
  const journal=env.VIVIM_CHAT_CORE_JOURNAL ?? (root && path.join(root,'hqkg','personal.hqj'));
  const scope=root && digest(['vivim-host-personal/1',root]);
  let queue=Promise.resolve();
  const inflight=new Map();
  // Only a verified durable readback can establish a delta base.
  let last=null;
  async function snapshot(view) {
    const current=await productJournal.readNativeKnowledge({nativeOnly:true,completeSources:true});
    const dispatcher=view==='owner'?control():null;
    const summaries=dispatcher?await discoverOwnerControlReceipts(root,dispatcher):[];
    const effects=dispatcher
      ?projectAppliedControlEffects(dispatcher,
        {items:current.context.committedHistory.items},
        current.context.wikiStructure,{
          complete:true,summaries,
          historicalStructureItems:current.context.committedHistory.structureItems
        })
      :{state:'source-backed',items:[]};
    const rows=buildNativeKnowledge(current,effects);
    return {rows,relationships:buildNativeRelationships(current,rows),
      wikiRevision:current.context.wikiRevision,
      ...(view==='owner'?{
        effectScannedPlans:effects.scannedPlans,
        latestIngestedReceiptAt:effects.items[0]?.receivedAt??null,
        receiptScanDigest:digest(summaries.map(s=>[
          s.planId,s.actionId,s.risk,s.state,s.createdAt]))
      }:{})};
  }
  async function read(view) {
    if (!root || typeof journal!=='string' || !path.isAbsolute(journal))
      return unavailable('RUST_CORE_NOT_CONFIGURED');
    const runtime=resolveRustContextRuntime({env,repoRoot,isFile});
    if (!runtime.personal) return unavailable('RUST_CORE_NOT_CONFIGURED');
    try {
      const dir=path.dirname(journal);
      await mkdir(dir,{recursive:true,mode:0o700});
      const st=await lstat(dir);
      if (!st.isDirectory() || st.isSymbolicLink()) return unavailable('RUST_CORE_UNSAFE_JOURNAL');
      // Never return an old graph when the authoritative source cannot be read.
      // Recheck the exact source projection after native ingestion/retrieval.
      // One invocation performs both operations against the existing durable graph.
      for (let attempt=0;attempt<2;attempt++) {
        const projection=await snapshot(view),{rows,relationships}=projection,fingerprint=digest(projection);
        if(!rows.some(row=>view==='owner'||row.kind==='wiki'))
          return unavailable('RUST_CORE_SOURCE_UNAVAILABLE');
        if(rows.length>MAX_CONTEXT_SOURCES||relationships.length>MAX_CONTEXT_LINK_BATCH)
          return unavailable('RUST_CORE_SOURCE_LIMIT');
        // On process restart an existing HQKG graph may contain older valid
        // receipts outside the current D4 presentation window. Bootstrap by
        // idempotent puts, never a full omission-reconciling replacement.
        let hasGraph=false;
        try {
          const st=await lstat(journal);
          if(!st.isFile()||st.isSymbolicLink())return unavailable('RUST_CORE_UNSAFE_JOURNAL');
          hasGraph=true;
        } catch(error) {
          if(error?.code!=='ENOENT')return unavailable('RUST_CORE_UNSAFE_JOURNAL');
        }
        const plan=planNativeContextSync({scope,view,rows,relationships,last,hasGraph});
        // Intermediate commits extend exactly the same native journal. Each
        // acknowledged epoch fences the next batch. No context is published
        // until the final retrieval and Host source recheck both succeed.
        let nativeEpoch=last?.epoch??null;
        let compactions=0;
        const invoke=async(input,expectedWrites,expectedLinks,expectedTombstones)=>{
          const request={...input,...(nativeEpoch!==null?{baseEpoch:nativeEpoch}:{})};
          const response=await nativePacket(await executePersonal(runtime.personal,journal,request));
          if(response?.schema!==PERSONAL_SCHEMA||response.scope!==scope||
            response.op!==request.op||!safeUInt(response.epoch)||!safeUInt(response.bytes)||
            response.mode!==(plan.delta||plan.batched?'delta':'projection')||
            response.synced!==expectedWrites||
            response.syncedRelationships!==expectedLinks||
            (response.mode==='delta'&&
              (response.ingested!==expectedWrites||response.tombstoned!==expectedTombstones))||
            typeof response.changed!=='boolean'||
            (response.compacted!==undefined&&typeof response.compacted!=='boolean'))
            throw Object.assign(Error('RUST_CORE_CONTRACT_INVALID'),
              {code:'RUST_CORE_CONTRACT_INVALID'});
          if(response.compacted===true)compactions++;
          nativeEpoch=response.epoch;
          return response;
        };
        let packet;
        try {
          for(const stage of plan.stages) {
            const n=stage.deltas.filter(row=>row.op==='put').length;
            const tombstones=stage.deltas.length-n;
            const links=stage.relationshipDeltas?.filter(row=>row.op==='put').length??0;
            await invoke(stage,n,links,tombstones);
          }
          packet=await invoke(plan.finalPacket,plan.expectedWrites,
            plan.expectedLinks,plan.expectedTombstones);
        } catch(error) {
          // Treat a partially synchronized journal as durable but not a
          // successful read. A subsequent retry bootstraps idempotent puts;
          // it cannot infer deletions from omission or reuse a stale epoch.
          if(error?.code==='RUST_CORE_SOURCE_CHANGED'&&attempt===0) {
            last=null;continue;
          }
          last=null;
          throw error;
        }
        const result=packet.context;
        if (result?.schema!==CHAT_CONTEXT_SCHEMA || result.core!=='hqkg' ||
            result.state!=='source-backed' || result.authority!=='read-only' ||
            result.seed!=='managed:'+view || result.epoch!==packet.epoch ||
            result.staleCount!==0 || result.budgetTokens!==320 || !safeUInt(result.tokensUsed) ||
            result.tokensUsed>320 || !safeUInt(result.totalRetrieved) ||
            result.totalRetrieved!==rows.filter(row=>view==='owner'||row.kind==='wiki').length ||
            typeof result.budgetExhausted!=='boolean' || !Array.isArray(result.items) ||
            result.items.length>8 || result.items.length>result.totalRetrieved)
          return unavailable('RUST_CORE_CONTRACT_INVALID');
        const nativeLinks=result.pageRelationships??[];
        if(!Array.isArray(nativeLinks)||nativeLinks.length!==relationships.length)
          return unavailable('RUST_CORE_CONTRACT_INVALID');
        const expectedLinks=new Map(relationships.map(link=>[link.id,link]));
        for(const link of nativeLinks){
          const expected=expectedLinks.get(link?.id);
          if(!expected||Object.keys(expected).some(key=>link[key]!==expected[key]))
            return unavailable('RUST_CORE_CONTRACT_INVALID');
          expectedLinks.delete(link.id);
        }
        const byRef=new Map(rows.map(row=>[row.sourceRef,row]));
        let effectRelationships=[];
        if(view==='owner'){
          // Native reports exact committed D4 edges. An effect summary alone
          // is not evidence that the corresponding Wiki lineage was ingested.
          const wikiByRef=new Map(rows.filter(row=>row.kind==='wiki')
            .map(row=>[row.sourceRef,row]));
          const expected=new Map();
          for(const effect of rows.filter(row=>row.kind==='effect'&&row.wikiLink)){
            const wiki=wikiByRef.get(effect.wikiLink.entryId);
            if(!wiki||wiki.revision!==effect.wikiLink.wikiRevision)continue;
            const id='vivim-context-l-'+effect.id.slice('vivim-context-e-'.length);
            expected.set(id,{id,from:effect.id,to:wiki.id,
              kind:'committed-wiki-change',sourceRef:effect.sourceRef,
              sourceDigest:effect.digest,receiptDigest:effect.receiptDigest,
              wikiEntryId:wiki.sourceRef,wikiRevision:wiki.revision});
          }
          const links=result.effectRelationships;
          const expectedSorted=[...expected.values()].sort((a,b)=>a.id.localeCompare(b.id));
          const proof=expectedSorted.map(e=>[e.id,e.from,e.to,e.kind,e.sourceRef,
            e.sourceDigest,e.receiptDigest,e.wikiEntryId,e.wikiRevision]);
          if(!Array.isArray(links)||links.length!==Math.min(24,expected.size)||
            result.effectRelationshipsTotal!==expected.size||
            result.omittedEffectRelationships!==Math.max(0,expected.size-24)||
            result.effectRelationshipsDigest!==digest(proof))
            return unavailable('RUST_CORE_CONTRACT_INVALID');
          const wikiById=new Map(rows.filter(row=>row.kind==='wiki').map(row=>[row.id,row]));
          const effectById=new Map(rows.filter(row=>row.kind==='effect').map(row=>[row.id,row]));
          for(let i=0;i<links.length;i++){
            const edge=links[i],wanted=expectedSorted[i];
            if(!edge||Object.keys(wanted).some(key=>edge[key]!==wanted[key]))
              return unavailable('RUST_CORE_CONTRACT_INVALID');
            const effect=effectById.get(edge.from),wiki=wikiById.get(edge.to);
            if(!effect||!wiki)return unavailable('RUST_CORE_CONTRACT_INVALID');
            effectRelationships.push({receipt:effect.semanticId,wiki:wiki.semanticId,
              sourceRef:effect.sourceRef,sourceDigest:effect.digest,
              receiptDigest:effect.receiptDigest,
              wikiEntryId:wiki.sourceRef,wikiRevision:wiki.revision});
          }
        }else if(result.effectRelationships!==undefined||
            result.effectRelationshipsTotal!==undefined||
            result.effectRelationshipsDigest!==undefined||
            result.omittedEffectRelationships!==undefined)
          return unavailable('RUST_CORE_CONTRACT_INVALID');
        const seen=new Set(), items=[];
        let sum=0;
        for (const item of result.items) {
          const expected=byRef.get(item?.sourceRef);
          if (!expected || seen.has(item.sourceRef) ||
              (view==='wiki' && expected.kind!=='wiki') || item.kind!==expected.kind ||
              item.sourceDigest!==expected.digest || item.sourceRevision!==expected.sourceRevision ||
              item.title!==expected.title || item.summary!==expected.summary ||
              (expected.kind==='effect' && item.receiptDigest!==expected.receiptDigest) ||
              item.revision!==expected.revision || item.depth!==0 || item.sourceCount!==1 ||
              !safeUInt(item.estimatedTokens) || item.estimatedTokens>320)
            return unavailable('RUST_CORE_CONTRACT_INVALID');
          seen.add(item.sourceRef); sum+=item.estimatedTokens;
          items.push({title:item.title,summary:item.summary,kind:item.kind,
            sourceRef:item.sourceRef,sourceDigest:item.sourceDigest,
            ...(expected.kind==='effect'?{receiptDigest:expected.receiptDigest}:{}),
            depth:item.depth,revision:item.revision,sourceRevision:item.sourceRevision,
            sourceCount:item.sourceCount,estimatedTokens:item.estimatedTokens});
        }
        if (sum!==result.tokensUsed) return unavailable('RUST_CORE_CONTRACT_INVALID');
        if (digest(await snapshot(view))!==fingerprint) {last=null;continue;}
        last={epoch:packet.epoch,...plan.next};
        return {schema:CHAT_CONTEXT_SCHEMA,state:'source-backed',core:'hqkg',
          authority:'read-only',epoch:result.epoch,tokensUsed:result.tokensUsed,
          budgetTokens:320,staleCount:0,budgetExhausted:result.budgetExhausted,
          totalRetrieved:result.totalRetrieved,items,
          sourceHighWater:{wikiRevision:projection.wikiRevision,graphEpoch:packet.epoch,
            ...(view==='owner'?{
              scannedAppliedPlans:projection.effectScannedPlans,
              receiptScanDigest:projection.receiptScanDigest,
              latestIngestedReceiptAt:projection.latestIngestedReceiptAt
            }:{})},
          ingestionStats:{nativeBatches:plan.stages.length+1,
            nativeCompactions:compactions},
          ...(view==='owner'?{effectRelationships,
            effectRelationshipsTotal:result.effectRelationshipsTotal,
            effectRelationshipsDigest:result.effectRelationshipsDigest}:{}),
          ...(relationships.length?{syncedRelationships:relationships.length,
            pageRelationships:relationships.map(({from,to,kind,sourceRef,revision,digest:sourceDigest})=>({
              from:rows.find(row=>row.id===from).semanticId,to:rows.find(row=>row.id===to).semanticId,
              kind,sourceRef,revision,sourceDigest}))}:{}),
          note:'Committed Wiki content and historical effects are advisory; Host retains effect authority.'};
      }
      last=null;
      return unavailable('RUST_CORE_SOURCE_CHANGED');
    } catch (error) {
      last=null;
      const reason=error?.code??error?.message;
      return unavailable(['RUST_CORE_RECOVERY_REQUIRED','RUST_CORE_CAPACITY_HELD',
        'RUST_CORE_INGEST_FAILED','RUST_CORE_CONTRACT_INVALID',
        'RUST_CORE_SOURCE_LIMIT','RUST_CORE_SOURCE_DUPLICATE',
        'RUST_CORE_SOURCE_CHANGED'].includes(reason)?reason:'RUST_CORE_READ_FAILED');
    }
  }
  // Serialize writer/read cycles for this Host; native save_checked adds a
  // file/epoch CAS under the engine's existing exclusive writer lock.
  return function readManagedContext(focus='talk', {owner=false}={}) {
    if (!FOCUS.has(focus)) return Promise.resolve(unavailable('FOCUS_INVALID'));
    const view=owner?'owner':'wiki';
    // Focus is only a presentation label: native retrieval selects by view.
    // Coalesce concurrent surfaces, never combine owner and phone scopes.
    // No completed response is cached; every later read rechecks its sources.
    let pending=inflight.get(view);
    if(!pending){
      const run=queue.then(()=>read(view));
      pending=run.finally(()=>{if(inflight.get(view)===pending)inflight.delete(view);});
      inflight.set(view,pending);
      queue=pending.catch(()=>{});
    }
    return pending.then(result=>result.state==='source-backed'?{...result,focus}:result);
  };
}
