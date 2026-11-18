import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { createProductJournal, projectAppliedControlEffects } from '../chat/product-journal.mjs';
import { buildNativeKnowledge, createRustChatContext, resolveRustContextRuntime } from '../chat/rust-context.mjs';

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
      return {stdout:JSON.stringify({schema:'vivim.hqkg-personal/1',scope:packet.scope,op:'sync-context',
        epoch:7,bytes:2000,synced:packet.nodes.length,changed:true})};
    },execute:async(_bin,args)=>{
      assert.equal(args[1],'--managed'); assert.equal(args[4],'wiki');
      return {stdout:JSON.stringify({schema:'vivim.hqkg-chat-context/1',state:'source-backed',
        core:'hqkg',authority:'read-only',seed:'managed:wiki',epoch:6,tokensUsed:0,budgetTokens:320,
        staleCount:0,budgetExhausted:false,totalRetrieved:1,items:[]})};
    }});
  assert.equal((await managed('wiki')).reason,'RUST_CORE_CONTRACT_INVALID');
  assert.equal(sent.nodes.length,1);
  assert.equal(sent.nodes[0].summary,'Owner content');
});
const binaries=resolveRustContextRuntime({env:{}});
test('real Node → actual Rust CLIs → persisted native Wiki readback',
  {skip: !binaries.personal || !binaries.reader ? 'Native binaries not built; build both with Cargo importer feature' : false},async t=>{
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
