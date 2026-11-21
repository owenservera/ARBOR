import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { createProductJournal, projectAppliedControlEffects } from '../chat/product-journal.mjs';
import { buildNativeKnowledge, createRustChatContext, discoverOwnerControlReceipts, planNativeContextSync, resolveRustContextRuntime } from '../chat/rust-context.mjs';

async function setup(t) {
  const dataRoot=await mkdtemp(path.join(os.tmpdir(),'vivim-native-context-'));
  t.after(()=>rm(dataRoot,{recursive:true,force:true}));
  const journal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{
    revision:1,pages:{Main:{sections:{About:'seed must never be indexed',Other:''}}}
  }});
  const edit=(content,expectedRevision,section='About')=>journal.append({
    kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision,
    edit:{action:'set-section',page:'Main',section,content}
  });
  return {dataRoot,journal,edit};
}
const controls={recent:()=>[],status:()=>null};
const emptyEffects={state:'source-backed',items:[]};

test('native input uses persisted source identities, current revision and exact content',async t=>{
  const {journal,edit}=await setup(t);
  assert.deepEqual(buildNativeKnowledge(await journal.readNativeKnowledge(),emptyEffects),[]);
  await journal.append({kind:'chat-send',actor:'human',schemaVersion:1,text:'unverified private chat'});
  await edit('First committed text',1);
  const first=buildNativeKnowledge(await journal.readNativeKnowledge(),emptyEffects)[0];
  assert.equal(first.summary,'First committed text');
  await edit('Updated committed text',2);
  const rows=buildNativeKnowledge(await journal.readNativeKnowledge(),emptyEffects);
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,first.id);
  assert.equal(rows[0].semanticId,'wiki:section:Main/About');
  assert.notEqual(rows[0].sourceRef,first.sourceRef);
  assert.equal(rows[0].sourceRevision,3);
  assert.equal(rows[0].digest,createHash('sha256').update('Updated committed text').digest('hex'));
  assert.equal(rows[0].summary,'Updated committed text');
  assert.doesNotMatch(JSON.stringify(rows),/unverified private chat|First committed text|seed must never/);
  const invalid=await journal.readNativeKnowledge();
  invalid.changes.items[0].content='not the committed source';
  assert.throws(()=>buildNativeKnowledge(invalid,emptyEffects),/NATIVE_WIKI_SOURCE_INVALID/);
});
test('D4 exact receipt/Wiki relation retains canonical action identity',async t=>{
  const {journal,edit}=await setup(t);
  await edit('Committed text',1);
  const snap=await journal.readNativeKnowledge(), e=snap.changes.items[0];
  const planId='ctl-0000000000000001',actionId='wiki.section.edit';
  const receipt={schema:'vivim.control-receipt/1',status:'applied',executionPerformed:true,
    planId,actionId,risk:'R1',planDigest:'a'.repeat(64),at:e.receivedAt,approvedVia:'desktop-owner-token',
    result:{entryId:e.entryId,sequence:e.sequence,wikiRevision:e.wikiRevision,
      previousRevision:e.previousWikiRevision,page:e.relationship.page,section:e.relationship.section,
      content:e.content,revision:e.wikiRevision}};
  const control={recent:()=>[{state:'applied',actionId,planId,risk:'R1'}],
    status:()=>({state:'applied',receipt})};
  const rows=buildNativeKnowledge(snap,projectAppliedControlEffects(control,snap.context.wikiChanges));
  const effect=rows.find(r=>r.kind==='effect');
  assert.equal(effect.actionId,actionId);
  assert.equal(effect.semanticId,'receipt:'+planId);
  assert.equal(effect.sourceRef,planId);
  assert.equal(effect.digest,receipt.planDigest);
  assert.equal(effect.receiptDigest,
    createHash('sha256').update(JSON.stringify(receipt)).digest('hex'));
  assert.equal(effect.wikiLink.entryId,e.entryId);
  assert.equal(effect.wikiLink.wikiRevision,e.wikiRevision);
  receipt.result.content='unmatched';
  assert.equal(buildNativeKnowledge(snap,projectAppliedControlEffects(control,snap.context.wikiChanges))
    .filter(r=>r.kind==='effect').length,0);
});
test('binary discovery uses packaged or workspace paths, no env seed or PATH',()=>{
  const root=path.resolve('repo'),dir=path.join(root,'native','bin');
  const names=['hqkg-personal','hqkg-chat-context'].map(n=>path.join(dir,n));
  assert.deepEqual(resolveRustContextRuntime({env:{},repoRoot:root,platform:'linux',isFile:p=>names.includes(p)}),
    {personal:names[0],reader:names[1]});
  assert.equal(resolveRustContextRuntime({env:{VIVIM_CHAT_CORE_BIN:'relative'},repoRoot:root,platform:'linux',
    isFile:p=>names.includes(p)}).reader,null);
});
test('missing native runtime and mismatching epoch fail closed',async t=>{
  const {journal,dataRoot,edit}=await setup(t);
  const unavailable=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=>controls,
    isFile:()=>false,execute:()=>{throw Error('must not execute')},executePersonal:()=>{throw Error('must not execute')}});
  assert.equal((await unavailable('wiki')).reason,'RUST_CORE_NOT_CONFIGURED');
  await edit('Owner content',1);
  let sent;
  const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=>controls,
    isFile:()=>true,executePersonal:async(_bin,_journal,packet)=>{
      sent=packet;
      assert.equal(packet.op,'sync-context-read');
      assert.equal(packet.view,'wiki');
      return {stdout:JSON.stringify({schema:'vivim.hqkg-personal/1',scope:packet.scope,op:packet.op,
        epoch:7,bytes:2000,synced:packet.nodes.length,syncedRelationships:0,changed:true,
        context:{schema:'vivim.hqkg-chat-context/1',state:'source-backed',
        core:'hqkg',authority:'read-only',seed:'managed:wiki',epoch:6,tokensUsed:0,budgetTokens:320,
        staleCount:0,budgetExhausted:false,totalRetrieved:1,items:[],pageRelationships:[]}})};
    },execute:async()=>{throw Error('legacy reader must not be launched')}});
  assert.equal((await managed('wiki')).reason,'RUST_CORE_CONTRACT_INVALID');
  assert.equal(sent.nodes.length,1);
  assert.equal(sent.nodes[0].summary,'Owner content');
});
const binaries=resolveRustContextRuntime({env:{}});
test('real Node → actual Rust CLIs → persisted native Wiki readback',
  {skip: !binaries.personal ? 'Native personal binary not built; build with Cargo importer feature' : false},async t=>{
  const {journal,dataRoot,edit}=await setup(t);
  const make=()=>createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=>controls});
  await edit('Real persisted Wiki value',1);
  const first=await make()('wiki');
  assert.equal(first.state,'source-backed',first.reason);
  assert.equal(first.items[0].summary,'Real persisted Wiki value');
  const again=await make()('wiki');
  assert.equal(again.epoch,first.epoch,'restart/read must not add unchanged frame');
  await edit('Real updated Wiki value',2);
  const next=await make()('wiki');
  assert.equal(next.state,'source-backed',next.reason);
  assert.ok(next.epoch>first.epoch);
  assert.equal(next.items[0].summary,'Real updated Wiki value');
  assert.equal(next.items[0].sourceRevision,3);
});

test('managed reads share one native invocation per concurrent authorized view and never cache completed results',async t=>{
  const {journal,dataRoot,edit}=await setup(t);
  await edit('Current owner text',1);
  const packets=[];
  const durable=new Map();
  const result=packet=>{
    if(Array.isArray(packet.deltas)){
      for(const delta of packet.deltas){
        if(delta.op==='put')durable.set(delta.id,delta);
        else if(delta.op==='delete')durable.delete(delta.id);
      }
    }else{
      durable.clear();
      for(const row of packet.nodes)durable.set(row.id,row);
    }
    const active=new Set(packet.activeIds??[...durable.keys()]);
    const visible=[...durable.values()].filter(row=>
      active.has(row.id)&&(packet.view==='owner'||row.kind==='wiki'));
    const items=visible.slice(0,1).map(row=>({title:row.title,summary:row.summary,kind:row.kind,
      sourceRef:row.sourceRef,sourceDigest:row.digest,sourceRevision:row.sourceRevision,
      ...(row.kind==='effect'?{receiptDigest:row.receiptDigest}:{}),
      revision:row.revision,depth:0,sourceCount:1,estimatedTokens:30}));
    return {stdout:JSON.stringify({schema:'vivim.hqkg-personal/1',scope:packet.scope,op:packet.op,
      epoch:7,bytes:2000,synced:packet.deltas?packet.deltas.filter(d=>d.op==='put').length:packet.nodes.length,
      syncedRelationships:packet.relationships.length,changed:false,reconciledSections:0,
      ...(packet.deltas?{mode:'delta',ingested:packet.deltas.filter(d=>d.op==='put').length,
        tombstoned:packet.deltas.filter(d=>d.op==='delete').length}:{mode:'projection'}),
      context:{schema:'vivim.hqkg-chat-context/1',state:'source-backed',core:'hqkg',authority:'read-only',
        seed:'managed:'+packet.view,epoch:7,staleCount:0,budgetTokens:320,tokensUsed:items.length*30,
        budgetExhausted:false,totalRetrieved:visible.length,items,pageRelationships:packet.relationships,
        ...(packet.view==='owner'?{effectRelationships:[],effectRelationshipsTotal:0,
          effectRelationshipsDigest:createHash('sha256').update('[]').digest('hex'),
          omittedEffectRelationships:0}:{})}})};
  };
  const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=>controls,
    isFile:p=>p.includes('hqkg-personal'),execute:async()=>{throw Error('legacy reader must not be launched')},
    executePersonal:async(_bin,_journal,packet)=>{packets.push(packet);return result(packet);}});
  const [talk,wiki,owner]=await Promise.all([managed('talk'),managed('wiki'),managed('wiki',{owner:true})]);
  assert.equal(talk.state,'source-backed',talk.reason);
  assert.equal(wiki.state,'source-backed',wiki.reason);
  assert.equal(owner.state,'source-backed',owner.reason);
  assert.equal(owner.sourceHighWater.scannedAppliedPlans,0);
  assert.equal(owner.sourceHighWater.indexedAppliedReceipts,0);
  assert.equal(owner.sourceHighWater.productJournalEntries,1);
  assert.equal(owner.sourceHighWater.productJournalDigest,
    createHash('sha256').update(await journal.rawJournal()).digest('hex'));
  assert.equal(owner.sourceHighWater.receiptEvidenceDigest,
    createHash('sha256').update('[]').digest('hex'));
  assert.equal(owner.sourceHighWater.receiptScanDigest,
    createHash('sha256').update('[]').digest('hex'));
  assert.equal(owner.sourceHighWater.latestIngestedReceiptAt,null);
  assert.equal(owner.ingestionStats.nativeBatches,1);
  assert.equal(owner.ingestionStats.nativeCompactions,0);
  assert.equal(talk.focus,'talk');assert.equal(wiki.focus,'wiki');
  assert.equal(talk.items[0].summary,'Current owner text');
  assert.deepEqual(packets.map(p=>[p.op,p.view]),[['sync-context-read','wiki'],['sync-context-read','owner']]);
  await edit('Updated owner text',2);
  const fresh=await managed('wiki');
  assert.equal(fresh.items[0].summary,'Updated owner text');
  assert.equal(packets.length,3);
  const nativeOnly=await journal.readNativeKnowledge({nativeOnly:true});
  const full=await journal.readNativeKnowledge();
  assert.deepEqual(nativeOnly.changes,full.changes);
  assert.deepEqual(nativeOnly.context.wikiChanges,full.context.wikiChanges);
  assert.deepEqual(nativeOnly.context.wikiStructure,full.context.wikiStructure);
  assert.equal(Object.hasOwn(nativeOnly.context,'semantics'),false);
  assert.equal(Object.hasOwn(nativeOnly.context,'items'),false);
  assert.deepEqual(await journal.readProjection(),await journal.readProjection());
});

test('combined native read detects source edits during execution and retries from new committed records',async t=>{
  const {journal,dataRoot,edit}=await setup(t);
  await edit('Before native read',1);
  let calls=0;
  const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=>controls,isFile:()=>true,
    executePersonal:async(_bin,_journal,p)=>{
      const row=p.nodes[0],epoch=++calls;
      if(calls===1)await edit('Changed while native read was running',2);
      return {stdout:JSON.stringify({schema:'vivim.hqkg-personal/1',scope:p.scope,op:p.op,epoch,bytes:10,
        synced:p.nodes.length,syncedRelationships:0,changed:true,mode:'projection',
        reconciledSections:0,
        context:{schema:'vivim.hqkg-chat-context/1',state:'source-backed',core:'hqkg',authority:'read-only',
          seed:'managed:'+p.view,epoch,tokensUsed:40,budgetTokens:320,staleCount:0,budgetExhausted:false,
          totalRetrieved:1,pageRelationships:[],items:[{...row,sourceDigest:row.digest,sourceCount:1,depth:0,estimatedTokens:40}]}})};
    }});
  const out=await managed('wiki');
  assert.equal(out.state,'source-backed',out.reason);
  assert.equal(calls,2);
  assert.equal(out.items[0].summary,'Changed while native read was running');
});


test('native ingestion receives every current committed section beyond presentation window',async t=>{
  const {journal}=await setup(t);
  let revision=1;
  for(let i=0;i<28;i++){
    const page='Source'+i;
    await journal.append({kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,
      expectedRevision:revision++,edit:{action:'create-page',page}});
    await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,
      expectedRevision:revision++,edit:{action:'set-section',page,section:'About',
        content:'Owner committed section '+i}});
  }
  const projected=await journal.readNativeKnowledge({nativeOnly:true});
  const complete=await journal.readNativeKnowledge({nativeOnly:true,completeSources:true});
  assert.ok(projected.changes.items.length<=24,'presentation remains bounded');
  assert.equal(complete.changes.items.length,28);
  assert.equal(complete.changes.omitted,0);
  const rows=buildNativeKnowledge(complete,emptyEffects);
  const sectionRows=rows.filter(row=>row.semanticId.startsWith('wiki:section:'));
  assert.equal(sectionRows.length,28);
  assert.ok(sectionRows.some(row=>row.semanticId==='wiki:section:Source0/About'&&
    row.summary==='Owner committed section 0'));
  assert.ok(sectionRows.some(row=>row.semanticId==='wiki:section:Source27/About'));
  assert.ok(sectionRows.every(row=>row.sourceRef&&row.digest&&row.sourceRevision>0));
});


test('restart probes durable epoch before source writes and fenced complete inventory',async t=>{
  const {journal,dataRoot,edit}=await setup(t);
  await edit('Current committed section',1);
  const hq=path.join(dataRoot,'hqkg');
  await mkdir(hq,{recursive:true});
  // An existing native journal with no verified RAM baseline must be probed
  // first. These are protocol mock responses, not a replacement for native CLI
  // acceptance, which is covered separately by the Rust integration tests.
  await writeFile(path.join(hq,'personal.hqj'),'existing-native-journal');
  const sent=[];
  const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,
    control:()=>controls,isFile:()=>true,
    executePersonal:async(_bin,_journal,packet)=>{
      sent.push(packet);
      if(packet.op==='sync-context')return {stdout:JSON.stringify({
        schema:'vivim.hqkg-personal/1',scope:packet.scope,op:packet.op,
        epoch:5,bytes:1234,mode:'delta',ingested:0,tombstoned:0,
        synced:0,syncedRelationships:0,changed:false,reconciledSections:0
      })};
      const row=packet.deltas.find(d=>d.op==='put');
      const item={title:row.title,summary:row.summary,kind:row.kind,
        sourceRef:row.sourceRef,sourceDigest:row.digest,sourceRevision:row.sourceRevision,
        revision:row.revision,depth:0,sourceCount:1,estimatedTokens:20};
      return {stdout:JSON.stringify({schema:'vivim.hqkg-personal/1',scope:packet.scope,
        op:packet.op,epoch:6,bytes:2345,mode:'delta',ingested:1,
        tombstoned:0,synced:1,syncedRelationships:0,changed:true,reconciledSections:0,
        context:{schema:'vivim.hqkg-chat-context/1',state:'source-backed',
          core:'hqkg',authority:'read-only',seed:'managed:wiki',epoch:6,
          tokensUsed:20,budgetTokens:320,staleCount:0,budgetExhausted:false,
          totalRetrieved:1,items:[item],pageRelationships:[]}})};
    }});
  const out=await managed('wiki');
  assert.equal(out.state,'source-backed',out.reason);
  assert.equal(out.items[0].summary,'Current committed section');
  assert.equal(out.ingestionStats.reconciledWikiSections,0);
  assert.equal(sent.length,2,'cold restart requires epoch read then mutation');
  assert.equal(sent[0].op,'sync-context');
  assert.deepEqual(sent[0].deltas,[]);
  assert.equal(Object.hasOwn(sent[0],'baseEpoch'),false);
  assert.equal(sent[1].op,'sync-context-read');
  assert.deepEqual(sent[1].nodes,[]);
  assert.equal(sent[1].deltas.length,1);
  assert.equal(sent[1].deltas[0].op,'put');
  assert.equal(sent[1].baseRevision,Number.MAX_SAFE_INTEGER);
  assert.equal(sent[1].baseEpoch,5);
  assert.equal(sent[1].completeWikiRevision,2);
  assert.deepEqual(sent[1].activeIds,[sent[1].deltas[0].id]);
});

test('large native source projections use sequential bounded deltas and one scoped read',()=>{
  const scope='b'.repeat(64);
  // The transport planner receives already-admitted source identities; these
  // records are protocol fixtures, never runtime Wiki seeds or fallback context.
  const rows=Array.from({length:601},(_,i)=>({
    id:'vivim-context-w-'+(i+1).toString(16).padStart(64,'0'),
    kind:'wiki',semanticId:'wiki:section:Page'+i+'/About',
    sourceRef:'entry-'+i,digest:'a'.repeat(64),revision:i+1,
    sourceRevision:i+1,order:i+1,title:'Wiki: '+i,summary:'Committed '+i
  }));
  const plan=planNativeContextSync({scope,view:'wiki',rows,relationships:[]});
  assert.equal(plan.delta,true);
  assert.equal(plan.batched,true);
  assert.equal(plan.stages.length,2);
  assert.deepEqual(plan.stages.map(p=>p.deltas.length),[512,89]);
  assert.ok(plan.stages.every(p=>p.op==='sync-context'&&
    p.nodes.length===0&&p.relationships.length===0));
  assert.equal(plan.finalPacket.op,'sync-context-read');
  assert.equal(plan.finalPacket.deltas.length,0);
  assert.equal(plan.finalPacket.activeIds.length,601);
  assert.deepEqual(plan.finalPacket.activeRelationshipIds,[]);
  assert.equal(plan.expectedWrites,0);
  assert.equal(plan.expectedTombstones,0);
  const last={epoch:45,rows:new Map(rows.map(r=>[r.id,r])),links:new Map()};
  const unchanged=planNativeContextSync({scope,view:'wiki',rows,relationships:[],last,hasGraph:true});
  assert.equal(unchanged.stages.length,0);
  assert.equal(unchanged.finalPacket.deltas.length,0);
  assert.equal(unchanged.finalPacket.activeIds.length,601);
  assert.equal(unchanged.delta,true);
});

test('incremental planner tombstones only absent current sections, not historical receipts',()=>{
  const scope='c'.repeat(64);
  const wiki={id:'vivim-context-w-'+'1'.repeat(64),kind:'wiki',
    semanticId:'wiki:section:Main/About',revision:4,digest:'a'.repeat(64)};
  const receipt={id:'vivim-context-e-'+'2'.repeat(64),kind:'effect',
    semanticId:'receipt:ctl-0000000000000001',revision:5,digest:'b'.repeat(64)};
  const page={id:'vivim-context-w-'+'3'.repeat(64),kind:'wiki',
    semanticId:'wiki:page:Main',revision:2,digest:'c'.repeat(64)};
  const last={epoch:18,rows:new Map([wiki,receipt,page].map(r=>[r.id,r])),
    links:new Map()};
  const plan=planNativeContextSync({scope,view:'owner',rows:[],
    relationships:[],last,hasGraph:true});
  assert.equal(plan.finalPacket.deltas.length,1);
  assert.deepEqual(plan.finalPacket.deltas[0],{
    op:'delete',kind:'wiki',id:wiki.id,revision:4,digest:wiki.digest
  });
  assert.equal(plan.finalPacket.activeIds.length,0);
  assert.equal(plan.expectedTombstones,1);
});


test('owner reads discover applied receipts beyond the dispatchers 100-plan window',async t=>{
  const {dataRoot}=await setup(t);
  const dir=path.join(dataRoot,'control','plans');
  await mkdir(dir,{recursive:true});
  const statuses=new Map();
  for(let i=0;i<125;i++){
    const planId='ctl-'+(i+1).toString(16).padStart(16,'0');
    await writeFile(path.join(dir,planId+'.receipt.json'),'{}');
    statuses.set(planId,{planId,state:'applied',actionId:'wiki.section.edit',
      risk:'R1',createdAt:new Date(1000+i*1000).toISOString(),receipt:{planId}});
  }
  const calls=[];
  const dispatcher={recent:()=>{throw Error('bounded recent must not be used')},
    status:id=>{calls.push(id);return statuses.get(id);}};
  const found=await discoverOwnerControlReceipts(dataRoot,dispatcher);
  assert.equal(found.length,125);
  assert.equal(calls.length,125);
  assert.equal(found[0].planId,'ctl-000000000000007d');
  assert.equal(found.at(-1).planId,'ctl-0000000000000001');
  assert.equal(found.every(v=>v.state==='applied'),true);
});

test('D4 historical receipts survive supersession without acquiring live Wiki edges',async t=>{
  const {journal,edit}=await setup(t);
  await edit('First committed source',1);
  const first=(await journal.readNativeKnowledge({completeSources:true})).changes.items[0];
  await edit('Current committed source',2);
  const snap=await journal.readNativeKnowledge({nativeOnly:true,completeSources:true});
  const history=snap.context.committedHistory;
  assert.equal(history.items.length,2);
  assert.deepEqual(history.items.map(item=>item.status),
    ['superseded-section-revision','current-section-revision']);
  assert.equal(Object.hasOwn(history.items[0],'content'),false);
  const summaries=[],records=new Map();
  for(const [i,entry] of history.items.entries()){
    const planId='ctl-'+(i+1).toString(16).padStart(16,'0');
    const actionId='wiki.section.edit',risk='R1';
    const content=i===0?'First committed source':'Current committed source';
    const receipt={schema:'vivim.control-receipt/1',status:'applied',
      executionPerformed:true,planId,actionId,risk,planDigest:'c'.repeat(64),
      at:new Date(1000+i*1000).toISOString(),approvedVia:'desktop-owner-token',
      result:{entryId:entry.entryId,sequence:entry.sequence,
        wikiRevision:entry.wikiRevision,previousRevision:entry.previousWikiRevision,
        page:entry.relationship.page,section:entry.relationship.section,content}};
    records.set(planId,{state:'applied',receipt});
    summaries.push({planId,state:'applied',actionId,risk});
  }
  const control={status:id=>records.get(id),
    recent:()=>{throw Error('native owner source must not use recent')}}
  const complete=projectAppliedControlEffects(control,{items:history.items},
    snap.context.wikiStructure,{complete:true,summaries,
      historicalStructureItems:history.structureItems});
  assert.equal(complete.items.length,2);
  const byPlan=new Map(complete.items.map(item=>[item.planId,item]));
  assert.equal(byPlan.get('ctl-0000000000000001').wikiLink,undefined);
  assert.equal(byPlan.get('ctl-0000000000000001').sourceRevision,2);
  assert.match(byPlan.get('ctl-0000000000000001').receiptDigest,/^[a-f0-9]{64}$/);
  assert.equal(byPlan.get('ctl-0000000000000002').wikiLink.entryId,history.items[1].entryId);
  const rows=buildNativeKnowledge(snap,complete);
  assert.equal(rows.filter(row=>row.kind==='effect').length,2);
  assert.equal(rows.find(row=>row.semanticId==='receipt:ctl-0000000000000001').wikiLink,null);
  assert.equal(first.entryId,history.items[0].entryId);
});

test('a multi-step D4 write must match every durable sequence binding',()=>{
  const planId='ctl-0000000000000001',planDigest='a'.repeat(64),actionId='program.write_wiki';
  const entries=Array.from({length:2},(_,i)=>({
    kind:'wiki-edit',entryId:'e'+String(i).padStart(35,'0'),
    sequence:i+1,wikiRevision:i+2,edit:{page:'Main',section:'About',content:'step '+i}
  }));
  const receipt={schema:'vivim.control-receipt/1',status:'applied',
    executionPerformed:true,planId,actionId,risk:'R1',planDigest,
    at:new Date(3000).toISOString(),approvedVia:'desktop-owner-token',
    result:{schema:'vivim.wiki-change-result/1',sequenceVerified:true,
      previousRevision:1,wikiRevision:3,entries}};
  const wikiChanges={items:entries.map((entry,i)=>({
    ...entry,kind:'committed-wiki-edit',
    relationship:{page:'Main',section:'About'},
    sequenceBinding:{planId,planDigest,step:i+1,total:2},
    contentDigest:createHash('sha256').update(entry.edit.content).digest('hex')
  }))};
  const control={recent:()=>[{state:'applied',actionId,risk:'R1',planId}],
    status:()=>({state:'applied',receipt})};
  assert.equal(projectAppliedControlEffects(control,wikiChanges).items.length,1);
  wikiChanges.items.pop();
  assert.equal(projectAppliedControlEffects(control,wikiChanges).items.length,0);
});


test('cold multi-batch owner bootstrap durably admits Wiki targets before D4 receipts',()=>{
  const scope='d'.repeat(64);
  const effects=Array.from({length:190},(_,i)=>({
    id:'vivim-context-e-'+(i+1).toString(16).padStart(64,'0'),
    kind:'effect',semanticId:'receipt:ctl-'+(i+1).toString(16).padStart(16,'0'),
    sourceRef:'ctl-'+(i+1).toString(16).padStart(16,'0'),
    digest:'a'.repeat(64),revision:2,sourceRevision:2,order:2,
    title:'Applied: wiki.section.edit',summary:'Committed historical receipt'
  }));
  const wiki=Array.from({length:600},(_,i)=>({
    id:'vivim-context-w-'+(i+1).toString(16).padStart(64,'0'),
    kind:'wiki',semanticId:'wiki:section:Page'+i+'/About',
    sourceRef:'journal-'+i,digest:'b'.repeat(64),revision:2,
    sourceRevision:2,order:2,title:'Wiki: '+i,summary:'Committed'
  }));
  const plan=planNativeContextSync({scope,view:'owner',
    rows:[...effects,...wiki],relationships:[]});
  assert.equal(plan.delta,true);
  assert.equal(plan.batched,true);
  const ordered=plan.stages.flatMap(p=>p.deltas);
  assert.equal(ordered.length,790);
  assert.equal(ordered.filter(r=>r.kind==='wiki').length,600);
  assert.ok(ordered.slice(0,600).every(row=>row.kind==='wiki'),
    'all committed Wiki sources must land before any receipt');
  assert.ok(ordered.slice(600).every(row=>row.kind==='effect'));
  assert.equal(plan.finalPacket.activeIds.length,790);
  assert.ok(plan.stages.every(p=>p.deltas.length<=512));
});


test('alternating phone and owner reads retain verified receipts without repeated D4 puts',async t=>{
  const {journal,dataRoot,edit}=await setup(t);
  await edit('Current committed Wiki section',1);
  const e=(await journal.readNativeKnowledge({nativeOnly:true,completeSources:true})).changes.items[0];
  const planId='ctl-abcdef0123456789',actionId='wiki.section.edit',risk='R1';
  const receipt={schema:'vivim.control-receipt/1',status:'applied',
    executionPerformed:true,planId,actionId,risk,planDigest:'a'.repeat(64),
    at:e.receivedAt,approvedVia:'desktop-owner-token',
    result:{entryId:e.entryId,sequence:e.sequence,wikiRevision:e.wikiRevision,
      previousRevision:e.previousWikiRevision,page:e.relationship.page,
      section:e.relationship.section,content:e.content}};
  const dir=path.join(dataRoot,'control','plans');await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,planId+'.receipt.json'),JSON.stringify(receipt));
  const dispatcher={recent:()=>{throw Error('owner must use durable receipt scan')},
    status:id=>{
      assert.equal(id,planId);
      return {planId,state:'applied',actionId,risk,receipt,
        createdAt:e.receivedAt};
    }};
  const packets=[],durable=new Map();
  const h=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const executePersonal=async(_bin,_journal,packet)=>{
    packets.push(packet);
    if(packet.deltas)for(const delta of packet.deltas){
      if(delta.op==='put')durable.set(delta.id,delta);
      if(delta.op==='delete')durable.delete(delta.id);
    } else for(const row of packet.nodes)durable.set(row.id,row);
    const active=new Set(packet.activeIds||[...durable.keys()]);
    const visible=[...durable.values()].filter(row=>active.has(row.id)&&
      (packet.view==='owner'||row.kind==='wiki'));
    const links=[...durable.values()].filter(row=>row.kind==='effect'&&row.wikiLink&&
      active.has(row.id)).flatMap(effect=>{
        const wiki=[...durable.values()].find(row=>row.kind==='wiki'&&active.has(row.id)&&
          row.sourceRef===effect.wikiLink.entryId&&row.revision===effect.wikiLink.wikiRevision);
        if(!wiki)return [];
        return [{id:'vivim-context-l-'+effect.id.slice('vivim-context-e-'.length),
          from:effect.id,to:wiki.id,kind:'committed-wiki-change',
          sourceRef:effect.sourceRef,sourceDigest:effect.digest,
          receiptDigest:effect.receiptDigest,
          wikiEntryId:wiki.sourceRef,wikiRevision:wiki.revision}];
      }).sort((a,b)=>a.id.localeCompare(b.id));
    const proof=links.map(link=>[link.id,link.from,link.to,link.kind,
      link.sourceRef,link.sourceDigest,link.receiptDigest,
      link.wikiEntryId,link.wikiRevision]);
    const putCount=packet.deltas?
      packet.deltas.filter(row=>row.op==='put').length:packet.nodes.length;
    return {stdout:JSON.stringify({schema:'vivim.hqkg-personal/1',scope:packet.scope,
      op:packet.op,epoch:9,bytes:100,changed:putCount>0,compacted:false,
      synced:putCount,syncedRelationships:packet.relationships.length,
      reconciledSections:0,mode:packet.deltas?'delta':'projection',
      ...(packet.deltas?{ingested:putCount,
        tombstoned:packet.deltas.length-putCount}:{}),
      context:{schema:'vivim.hqkg-chat-context/1',state:'source-backed',
        core:'hqkg',authority:'read-only',seed:'managed:'+packet.view,
        epoch:9,staleCount:0,budgetTokens:320,tokensUsed:0,
        totalRetrieved:visible.length,budgetExhausted:visible.length>0,
        items:[],pageRelationships:[],
        ...(packet.view==='owner'?{effectRelationships:links.slice(0,24),
          effectRelationshipsTotal:links.length,
          omittedEffectRelationships:Math.max(0,links.length-24),
          effectRelationshipsDigest:h(proof)}:{})}})};
  };
  const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,
    control:()=>dispatcher,isFile:p=>p.includes('hqkg-personal'),
    executePersonal});
  const first=await managed('wiki',{owner:true});
  assert.equal(first.state,'source-backed',first.reason);
  assert.equal(first.effectRelationshipsTotal,1);
  assert.equal(first.effectRelationships.length,1);
  assert.equal(first.sourceHighWater.scannedAppliedPlans,1);
  assert.equal(first.sourceHighWater.indexedAppliedReceipts,1);
  assert.equal(first.sourceHighWater.productJournalEntries,1);
  assert.match(first.sourceHighWater.productJournalDigest,/^[0-9a-f]{64}$/);
  assert.match(first.sourceHighWater.receiptEvidenceDigest,/^[0-9a-f]{64}$/);
  const phone=await managed('wiki');
  assert.equal(phone.state,'source-backed',phone.reason);
  assert.equal(Object.hasOwn(phone,'effectRelationships'),false);
  assert.equal(Object.hasOwn(phone.sourceHighWater,'productJournalDigest'),false);
  assert.equal(Object.hasOwn(phone.sourceHighWater,'receiptEvidenceDigest'),false);
  assert.equal(phone.totalRetrieved,1);
  const again=await managed('wiki',{owner:true});
  assert.equal(again.state,'source-backed',again.reason);
  assert.equal(again.effectRelationshipsTotal,1);
  assert.deepEqual(packets.map(p=>p.view),['owner','wiki','owner']);
  const retransmitted=packets.at(-1).deltas.filter(delta=>
    delta.op==='put'&&delta.kind==='effect');
  assert.equal(retransmitted.length,0,
    'phone reads must not evict the verified owner receipt delta baseline');
  assert.equal(packets.at(-1).completeWikiRevision,e.wikiRevision);
});

test('bounded native planner only authorizes inventory on the final source-complete read',()=>{
  const scope='e'.repeat(64);
  const rows=Array.from({length:580},(_,i)=>({
    id:'vivim-context-w-'+(i+1).toString(16).padStart(64,'0'),
    kind:'wiki',semanticId:'wiki:section:Main/'+i,
    sourceRef:'entry-'+i,digest:'f'.repeat(64),
    revision:400,sourceRevision:400,order:i+1,
    title:'Wiki '+i,summary:'Current source'
  }));
  const plan=planNativeContextSync({scope,view:'wiki',rows,
    relationships:[],hasGraph:true,completeWikiRevision:400});
  assert.equal(plan.stages.length,3);
  assert.deepEqual(plan.stages.map(stage=>stage.deltas.length),[0,512,68]);
  assert.ok(plan.stages.every(stage=>!Object.hasOwn(stage,'completeWikiRevision')));
  assert.ok(plan.stages.every(stage=>!Object.hasOwn(stage,'activeIds')));
  assert.equal(plan.finalPacket.completeWikiRevision,400);
  assert.equal(plan.finalPacket.deltas.length,0);
  assert.equal(plan.finalPacket.activeIds.length,580);
  assert.equal(plan.expectedTombstones,0);
});


test('owner receipt discovery refuses malformed and replaced journal receipts',async t=>{
  const {dataRoot}=await setup(t),dir=path.join(dataRoot,'control','plans');
  await mkdir(dir,{recursive:true});
  const malformed=path.join(dir,'unidentified.receipt.json');
  await writeFile(malformed,'{}');
  const dispatcher={status:()=>{throw Error('must not read malformed receipt')}};
  await assert.rejects(()=>discoverOwnerControlReceipts(dataRoot,dispatcher),
    /NATIVE_EFFECT_SOURCE_UNSAFE/);
  await rm(malformed);
  const planId='ctl-0000000000000001',file=path.join(dir,planId+'.receipt.json');
  await writeFile(file,'{"status":"applied"}');
  const changed={status:id=>{
    assert.equal(id,planId);
    writeFileSync(file,'{"status":"changed after source read"}');
    return {planId,state:'applied',actionId:'wiki.section.edit',risk:'R1',
      createdAt:'2026-11-21T01:00:00Z',receipt:{planId}};
  }};
  await assert.rejects(()=>discoverOwnerControlReceipts(dataRoot,changed),
    /NATIVE_EFFECT_SOURCE_CHANGED/);
});


test('native product journal stamps all committed source revisions without exporting chat bodies',async t=>{
  const {journal,edit}=await setup(t);
  await edit('Wiki source unchanged',1);
  const before=await journal.readNativeKnowledge({nativeOnly:true,completeSources:true});
  assert.equal(before.sourceStamp.journalEntries,1);
  assert.equal(before.sourceStamp.wikiRevision,2);
  assert.match(before.sourceStamp.committedJournalDigest,/^[a-f0-9]{64}$/);
  await journal.append({kind:'chat-send',actor:'human',schemaVersion:1,
    text:'private observation must not become Wiki fact'});
  const after=await journal.readNativeKnowledge({nativeOnly:true,completeSources:true});
  assert.equal(after.sourceStamp.journalEntries,2);
  assert.equal(after.sourceStamp.wikiRevision,2);
  assert.notEqual(after.sourceStamp.committedJournalDigest,
    before.sourceStamp.committedJournalDigest);
  assert.deepEqual(after.changes.items,before.changes.items);
  assert.doesNotMatch(JSON.stringify(after.sourceStamp),
    /private observation|Wiki source unchanged/);
  assert.equal(after.sourceStamp.committedJournalDigest,
    createHash('sha256').update(await journal.rawJournal()).digest('hex'));
});
