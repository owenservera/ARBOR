# File: apps/vivim-host/test/native-knowledge-integration.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/native-knowledge-integration.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11038 B |
| Lines | 175 |
| Hash | d5afdab8066c |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| setup | function | 10 | no | async function setup(t) { |
| dataRoot | const | 11 | no | const dataRoot=await mkdtemp(path.join(os.tmpdir(),&#39;vivim-native-context-&#39;)); |
| journal | const | 13 | no | const journal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{ revision:1,pages:{Main:{sections:{About:&#39;seed must never be indexed&#39;,Other:&#39;&#39;}}} }}); |
| edit | function | 16 | no | const edit=(content,expectedRevision,section=&#39;About&#39;)=&gt;journal.append({ kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision, edit:{action:&#39;set-section&#39;,page:&#39;Main&#39;,section,content… |
| controls | const | 22 | no | const controls={recent:()=&gt;[],status:()=&gt;null}; |
| emptyEffects | const | 23 | no | const emptyEffects={state:&#39;source-backed&#39;,items:[]}; |
| first | const | 30 | no | const first=buildNativeKnowledge(await journal.readNativeKnowledge(),emptyEffects)[0]; |
| rows | const | 33 | no | const rows=buildNativeKnowledge(await journal.readNativeKnowledge(),emptyEffects); |
| invalid | const | 42 | no | const invalid=await journal.readNativeKnowledge(); |
| snap | const | 49 | no | const snap=await journal.readNativeKnowledge(), e=snap.changes.items[0]; |
| planId | const | 50 | no | const planId=&#39;ctl-0000000000000001&#39;,actionId=&#39;wiki.section.edit&#39;; |
| receipt | const | 51 | no | const receipt={schema:&#39;vivim.control-receipt/1&#39;,status:&#39;applied&#39;,executionPerformed:true, |
| control | const | 56 | no | const control={recent:()=&gt;[{state:&#39;applied&#39;,actionId,planId,risk:&#39;R1&#39;}], |
| rows | const | 58 | no | const rows=buildNativeKnowledge(snap,projectAppliedControlEffects(control,snap.context.wikiChanges)); |
| effect | const | 59 | no | const effect=rows.find(r=&gt;r.kind===&#39;effect&#39;); |
| root | const | 70 | no | const root=path.resolve(&#39;repo&#39;),dir=path.join(root,&#39;native&#39;,&#39;bin&#39;); |
| names | const | 71 | no | const names=[&#39;hqkg-personal&#39;,&#39;hqkg-chat-context&#39;].map(n=&gt;path.join(dir,n)); |
| unavailable | const | 79 | no | const unavailable=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=&gt;controls, isFile:()=&gt;false,execute:()=&gt;{throw Error(&#39;must not execute&#39;)},executePersonal:()=&gt;{throw Error(&#39;… |
| sent | variable | 83 | no | let sent; |
| managed | const | 84 | no | const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=&gt;controls, isFile:()=&gt;true,executePersonal:async(_bin,_journal,packet)=&gt;{ sent=packet; assert.equal(packet.op,&#39;s… |
| binaries | const | 99 | no | const binaries=resolveRustContextRuntime({env:{}}); |
| make | function | 103 | no | const make=()=&gt;createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=&gt;controls}); |
| first | const | 105 | no | const first=await make()(&#39;wiki&#39;); |
| again | const | 108 | no | const again=await make()(&#39;wiki&#39;); |
| next | const | 111 | no | const next=await make()(&#39;wiki&#39;); |
| packets | const | 121 | no | const packets=[]; |
| result | function | 122 | no | const result=packet=&gt;{ |
| visible | const | 123 | no | const visible=packet.nodes.filter(row=&gt;packet.view===&#39;owner&#39;\|\|row.kind===&#39;wiki&#39;); |
| items | const | 124 | no | const items=visible.slice(0,1).map(row=&gt;({title:row.title,summary:row.summary,kind:row.kind, sourceRef:row.sourceRef,sourceDigest:row.digest,sourceRevision:row.sourceRevision, revision:row.revision,d… |
| managed | const | 133 | no | const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=&gt;controls, isFile:p=&gt;p.includes(&#39;hqkg-personal&#39;),execute:async()=&gt;{throw Error(&#39;legacy reader must not be launch… |
| fresh | const | 144 | no | const fresh=await managed(&#39;wiki&#39;); |
| nativeOnly | const | 147 | no | const nativeOnly=await journal.readNativeKnowledge({nativeOnly:true}); |
| full | const | 148 | no | const full=await journal.readNativeKnowledge(); |
| calls | variable | 160 | no | let calls=0; |
| managed | const | 161 | no | const managed=createRustChatContext({env:{},dataRoot,productJournal:journal,control:()=&gt;controls,isFile:()=&gt;true, executePersonal:async(_bin,_journal,p)=&gt;{ const row=p.nodes[0],epoch=++calls; if(call… |
| row | const | 163 | no | const row=p.nodes[0],epoch=++calls; |
| out | const | 171 | no | const out=await managed(&#39;wiki&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:crypto | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../chat/product-journal.mjs | import | 7 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/rust-context.mjs | import | 8 | [apps/vivim-host/chat/rust-context.mjs](../chat/rust-context.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 176 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
