// Host-owned, read-only adapter to the existing native HQKG graph.
// No local Rust binary or existing journal => report unavailable; never
// substitute synthetic context, accept client-selected graph IDs or spawn a shell.
import path from 'node:path';
import { lstatSync } from 'node:fs';
import { mkdir, lstat } from 'node:fs/promises';
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
  if(!['hqkg-personal','hqkg-chat-context','hqkg-web-feed'].includes(name))return null;
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
  if (!snapshot || !Array.isArray(snapshot.changes?.items) || snapshot.changes.items.length > 24 ||
      effects?.state !== 'source-backed' || !Array.isArray(effects.items) || effects.items.length > 24)
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
        !SHA.test(e.planDigest) || !(e.sourceRevision === null || safeUInt(e.sourceRevision)))
      throw Error('NATIVE_EFFECT_SOURCE_INVALID');
    // The immutable receipt itself has version 1; its target state revision,
    // when supplied by D4, remains separately and exactly identified.
    const wikiLink = e.wikiLink ?? null;
    if (wikiLink && (e.actionId!=='wiki.section.edit' ||
        wikiLink.kind!=='committed-wiki-change' || typeof wikiLink.entryId!=='string' ||
        !/^[0-9a-f-]{36}$/.test(wikiLink.entryId) ||
        !safeUInt(wikiLink.wikiRevision) || wikiLink.wikiRevision===0))
      throw Error('NATIVE_EFFECT_SOURCE_LINK_INVALID');
    const visual=e.visualLink??null;
    if(e.actionId==='ui.visual.apply'&&(!visual||visual.kind!=='committed-visual-revision'||
      typeof visual.surfaceId!=='string'||! /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/.test(visual.surfaceId)||
      !/^chg-[a-f0-9]{8}$/.test(visual.changeId)||!safeUInt(visual.parentRevision)||
      !safeUInt(visual.revision)||visual.revision!==visual.parentRevision+1||
      visual.revision!==e.sourceRevision||!SHA.test(visual.previewDigest)||!SHA.test(visual.projectionDigest)||
      !SHA.test(visual.semanticDigest)))throw Error('NATIVE_VISUAL_EFFECT_SOURCE_INVALID');
    if(visual&&e.actionId!=='ui.visual.apply')throw Error('NATIVE_VISUAL_EFFECT_SOURCE_INVALID');
    const linked = wikiLink ? ' · Wiki revision '+wikiLink.wikiRevision :
      visual?' · Visual '+visual.surfaceId+' rev '+visual.parentRevision+' → '+visual.revision+' · '+visual.changeId:'';
    rows.push({id:'vivim-context-e-'+digest(e.planId),kind:'effect',
      sourceRef:e.planId,digest:e.planDigest,revision:Math.max(1,e.sourceRevision ?? 1),
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
          /^(CAPACITY_HELD|COMPACTION_REQUIRED)/.test(reason) ? 'RUST_CORE_CAPACITY_HELD' : 'RUST_CORE_INGEST_FAILED';
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

function managedReader({env,dataRoot,productJournal,control,executePersonal,repoRoot,isFile}) {
  const root=typeof dataRoot==='string' && path.isAbsolute(dataRoot) ? path.resolve(dataRoot) : null;
  // One Host-owned native personal journal. An existing explicit journal is
  // supported, but native namespace validation refuses an unrelated graph.
  const journal=env.VIVIM_CHAT_CORE_JOURNAL ?? (root && path.join(root,'hqkg','personal.hqj'));
  const scope=root && digest(['vivim-host-personal/1',root]);
  let queue=Promise.resolve();
  const inflight=new Map();
  async function snapshot() {
    const current=await productJournal.readNativeKnowledge({nativeOnly:true});
    const effects=projectAppliedControlEffects(control(),current.context.wikiChanges,current.context.wikiStructure);
    const rows=buildNativeKnowledge(current,effects);
    return {rows,relationships:buildNativeRelationships(current,rows)};
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
        const projection=await snapshot(),{rows,relationships}=projection,fingerprint=digest(projection);
        const packet=await nativePacket(await executePersonal(runtime.personal,journal,{
          schema:PERSONAL_SCHEMA,scope,op:'sync-context-read',view,nodes:rows,relationships
        }));
        if (packet?.schema!==PERSONAL_SCHEMA || packet.scope!==scope ||
            packet.op!=='sync-context-read' || !safeUInt(packet.epoch) ||
            !safeUInt(packet.bytes) || packet.synced!==rows.length || packet.syncedRelationships!==relationships.length ||
            typeof packet.changed!=='boolean')
          return unavailable('RUST_CORE_CONTRACT_INVALID');
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
        const seen=new Set(), items=[];
        let sum=0;
        for (const item of result.items) {
          const expected=byRef.get(item?.sourceRef);
          if (!expected || seen.has(item.sourceRef) ||
              (view==='wiki' && expected.kind!=='wiki') || item.kind!==expected.kind ||
              item.sourceDigest!==expected.digest || item.sourceRevision!==expected.sourceRevision ||
              item.title!==expected.title || item.summary!==expected.summary ||
              item.revision!==expected.revision || item.depth!==0 || item.sourceCount!==1 ||
              !safeUInt(item.estimatedTokens) || item.estimatedTokens>320)
            return unavailable('RUST_CORE_CONTRACT_INVALID');
          seen.add(item.sourceRef); sum+=item.estimatedTokens;
          items.push({title:item.title,summary:item.summary,kind:item.kind,
            depth:item.depth,revision:item.revision,sourceRevision:item.sourceRevision,
            sourceCount:item.sourceCount,estimatedTokens:item.estimatedTokens});
        }
        if (sum!==result.tokensUsed) return unavailable('RUST_CORE_CONTRACT_INVALID');
        if (digest(await snapshot())!==fingerprint) continue;
        return {schema:CHAT_CONTEXT_SCHEMA,state:'source-backed',core:'hqkg',
          authority:'read-only',epoch:result.epoch,tokensUsed:result.tokensUsed,
          budgetTokens:320,staleCount:0,budgetExhausted:result.budgetExhausted,
          totalRetrieved:result.totalRetrieved,items,
          ...(relationships.length?{syncedRelationships:relationships.length,
            pageRelationships:relationships.map(({from,to,kind,sourceRef,revision,digest:sourceDigest})=>({
              from:rows.find(row=>row.id===from).semanticId,to:rows.find(row=>row.id===to).semanticId,
              kind,sourceRef,revision,sourceDigest}))}:{}),
          note:'Committed Wiki content and historical effects are advisory; Host retains effect authority.'};
      }
      return unavailable('RUST_CORE_SOURCE_CHANGED');
    } catch (error) {
      return unavailable(['RUST_CORE_RECOVERY_REQUIRED','RUST_CORE_CAPACITY_HELD',
        'RUST_CORE_INGEST_FAILED'].includes(error?.code) ? error.code : 'RUST_CORE_READ_FAILED');
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
