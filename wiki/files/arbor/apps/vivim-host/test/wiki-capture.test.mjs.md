# File: apps/vivim-host/test/wiki-capture.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/wiki-capture.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9571 B |
| Lines | 102 |
| Hash | d39d648bb822 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| input | const | 7 | no | const input={capture_id:&#39;capture-0001&#39;,kind:&#39;task&#39;,content:&#39;Call the supplier\\nConfirm order&#39;}; |
| root | const | 9 | no | const root=await mkdtemp(path.join(tmpdir(),&#39;vivim-capture-&#39;)); |
| journal | const | 11 | no | const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}}); |
| before | const | 12 | no | const before=await journal.readPhoneWiki(),draft=previewWikiCapture(before,input); |
| payload | const | 15 | no | const payload={kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:0,edit:draft.edit}; |
| entry | const | 16 | no | const entry=await journal.append(payload),after=await journal.readPhoneWiki(); |
| native | const | 21 | no | const native=await journal.readNativeKnowledge({nativeOnly:true}); |
| statusEdit | const | 26 | no | const statusEdit={kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:1,edit:{action:&#39;set-section&#39;,page:draft.page,section:&#39;Status&#39;,content:&#39;Done&#39;}}; |
| done | const | 29 | no | const done=await journal.readPhoneWiki();assert.equal(done.personalCaptures.items[0].status,&#39;Done&#39;);assert.equal(done.personalCaptures.items[0].entryId,entry.entryId); |
| wiki | const | 35 | no | const wiki={revision:0,pages:{}}; |
| records | const | 41 | no | const records=[],pages={};for(let i=1;i&lt;=400;i++){ |
| kind | const | 42 | no | const kind=i&lt;50?&#39;task&#39;:i&lt;100?&#39;note&#39;:&#39;task&#39;,page=kind+&#39;-&#39;+i.toString(16).padStart(32,&#39;0&#39;),section=kind===&#39;note&#39;?&#39;Note&#39;:&#39;Task&#39;; |
| result | const | 46 | no | const result=projectPersonalCaptures(records,{revision:400,pages});assert.equal(result.total,400);assert.equal(result.items.length,256);assert.equal(result.omitted,144); |
| root | const | 52 | no | const root=await mkdtemp(path.join(tmpdir(),&#39;vivim-program-source-&#39;)); |
| journal | const | 54 | no | const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}}); |
| first | variable | 55 | no | let first=null,page=null; |
| draft | const | 57 | no | const draft=previewWikiCapture(await journal.readPhoneWiki(),{capture_id:&#39;program-source-&#39;+i,kind:&#39;note&#39;,content:&#39;Note number &#39;+i}); |
| entry | const | 58 | no | const entry=await journal.append({kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:i,edit:draft.edit}); |
| recent | const | 61 | no | const recent=await journal.readNativeKnowledge({nativeOnly:true});assert.equal(recent.changes.items.some(r=&gt;r.entryId===first.entryId),false); |
| exact | const | 62 | no | const exact=await journal.readProgramSources([first.entryId]);assert.equal(exact.wikiRevision,26);assert.equal(exact.items.length,1);assert.equal(exact.items[0].wikiRevision,1);assert.equal(Object.ha… |
| root | const | 69 | no | const root=await mkdtemp(path.join(tmpdir(),&#39;vivim-program-evidence-&#39;)); |
| targets | const | 71 | no | const targets=[{page:&#39;main&#39;,section:&#39;about&#39;}];assert.equal((await journal.readProgramEvidence(targets,0)).items[0].source,null); |
| entry | const | 72 | no | const entry=await journal.append({kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:0,edit:{action:&#39;set-section&#39;,page:&#39;main&#39;,section:&#39;about&#39;,content:&#39;Committed&#39;}}); |
| view | const | 73 | no | const view=await journal.readProgramEvidence(targets,1);assert.equal(view.items[0].source.entryId,entry.entryId);assert.equal(Object.hasOwn(view.items[0].source,&#39;content&#39;),false); |
| root | const | 80 | no | const root=await mkdtemp(path.join(tmpdir(),&#39;vivim-sequence-&#39;)); |
| a | const | 82 | no | const a={kind:&#39;wiki-structure&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:0,edit:{action:&#39;create-page&#39;,page:&#39;research&#39;}},b={kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expected… |
| before | const | 83 | no | const before=await journal.readPhoneWiki(),projected=previewWikiPayload(previewWikiPayload(before,a),b),hash=createHash(&#39;sha256&#39;).update(JSON.stringify(projected.pages)).digest(&#39;hex&#39;); |
| out | const | 86 | no | const out=await journal.appendWikiSequence([a,b],hash);assert.equal(out.entries.length,2);assert.equal(out.wikiRevision,2);assert.equal((await journal.readPhoneWiki()).pages.research.sections.About,&#39;… |
| root | const | 92 | no | const root=await mkdtemp(path.join(tmpdir(),&#39;vivim-sequence-proof-&#39;)); |
| a | const | 94 | no | const a={kind:&#39;wiki-structure&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:0,edit:{action:&#39;create-page&#39;,page:&#39;research&#39;}},b={kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expected… |
| binding | const | 95 | no | const binding={planId:&#39;ctl-0123456789abcdef&#39;,planDigest:&#39;a&#39;.repeat(64)},before=await journal.readPhoneWiki(),projected=previewWikiPayload(previewWikiPayload(before,a),b),digest=createHash(&#39;sha256&#39;).u… |
| phone | const | 98 | no | const phone=await journal.readPhoneWiki();assert.equal(JSON.stringify(phone).includes(binding.planId),false);assert.equal(JSON.stringify(phone).includes(binding.planDigest),false); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../chat/product-journal.mjs | import | 6 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/product-journal.mjs | dynamic | 79 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| node:crypto | dynamic | 79 | external |
| ../chat/product-journal.mjs | dynamic | 91 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| node:crypto | dynamic | 91 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createProductJournal,previewWikiCapture,projectPersonalCaptures,projectProgramSources} from '../chat/product-journal.mjs';
const input={capture_id:'capture-0001',kind:'task',content:'Call the supplier\nConfirm order'};
test('reviewed capture is one durable Wiki append, native source record, and cannot overwrite existing page',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'vivim-capture-'));
 try{
  const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
  const before=await journal.readPhoneWiki(),draft=previewWikiCapture(before,input);
  assert.equal(before.revision,0);assert.equal(draft.edit.section,'Task');assert.match(draft.page,/^task-[a-f0-9]{32}$/);
  assert.equal((await journal.readPhoneWiki()).revision,0);
  const payload={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:draft.edit};
  const entry=await journal.append(payload),after=await journal.readPhoneWiki();
  assert.equal(after.revision,1);assert.equal(after.pages[draft.page].sections.Task,input.content);
  assert.equal(after.pages[draft.page].sections.Status,'Open');
  assert.equal(after.personalCaptures.items[0].status,'Open');
  assert.equal(after.autoWiki.items[0].entryId,entry.entryId);
  const native=await journal.readNativeKnowledge({nativeOnly:true});
  assert.equal(native.changes.items[0].content,input.content);
  await assert.rejects(journal.append(payload),/Stale Wiki revision/);
  assert.throws(()=>previewWikiCapture(after,{...input,content:'Overwrite'}),/Capture already exists/);
  assert.equal((await journal.readRecords()).length,1);
  const statusEdit={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:1,edit:{action:'set-section',page:draft.page,section:'Status',content:'Done'}};
  await assert.rejects(journal.append({...statusEdit,edit:{...statusEdit.edit,content:'Unknown'}}),/Task status/);
  await journal.append(statusEdit);
  const done=await journal.readPhoneWiki();assert.equal(done.personalCaptures.items[0].status,'Done');assert.equal(done.personalCaptures.items[0].entryId,entry.entryId);
  await journal.append({...statusEdit,expectedRevision:2,edit:{...statusEdit.edit,content:'Open'}});
  assert.equal((await journal.readPhoneWiki()).personalCaptures.items[0].status,'Open');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reject malformed ids, blank or oversized text before a plan is saved',()=>{
 const wiki={revision:0,pages:{}};
 for(const bad of [{...input,capture_id:'../../x'},{...input,kind:'unknown'},{...input,content:'   '},{...input,content:'x'.repeat(1201)}])
   assert.throws(()=>previewWikiCapture(wiki,bad));
});

test('large capture histories retain exact totals and prioritize open tasks and notes without growing the client window',()=>{
 const records=[],pages={};for(let i=1;i<=400;i++){
  const kind=i<50?'task':i<100?'note':'task',page=kind+'-'+i.toString(16).padStart(32,'0'),section=kind==='note'?'Note':'Task';
  pages[page]={sections:{[section]:'Recorded '+i,...(kind==='task'?{Status:i<50?'Open':'Done'}:{})}};
  records.push({kind:'wiki-edit',entryId:'00000000-0000-0000-0000-'+String(i).padStart(12,'0'),expectedRevision:i-1,edit:{action:'capture-'+kind,page,section}});
 }
 const result=projectPersonalCaptures(records,{revision:400,pages});assert.equal(result.total,400);assert.equal(result.items.length,256);assert.equal(result.omitted,144);
 assert.deepEqual(result.counts,{notes:50,openTasks:49,doneTasks:301,unknownTasks:0});
 assert.equal(result.items.filter(r=>r.status==='Open').length,49);assert.equal(result.items.filter(r=>r.kind==='note').length,50);
});

test('exact program inputs resolve older current sections beyond the recent window, but refuse superseded content',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'vivim-program-source-'));
 try{
  const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
  let first=null,page=null;
  for(let i=0;i<26;i++){
   const draft=previewWikiCapture(await journal.readPhoneWiki(),{capture_id:'program-source-'+i,kind:'note',content:'Note number '+i});
   const entry=await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:i,edit:draft.edit});
   if(i===0){first=entry;page=draft.page;}
  }
  const recent=await journal.readNativeKnowledge({nativeOnly:true});assert.equal(recent.changes.items.some(r=>r.entryId===first.entryId),false);
  const exact=await journal.readProgramSources([first.entryId]);assert.equal(exact.wikiRevision,26);assert.equal(exact.items.length,1);assert.equal(exact.items[0].wikiRevision,1);assert.equal(Object.hasOwn(exact.items[0],'content'),false);
  await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:26,edit:{action:'set-section',page,section:'Note',content:'Updated'}});
  assert.deepEqual((await journal.readProgramSources([first.entryId])).items,[]);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('program evidence distinguishes committed section identities from seed content without exporting raw data',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'vivim-program-evidence-'));
 try{const journal=createProductJournal({dataRoot:root,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{about:'Seed'}}}}});
 const targets=[{page:'main',section:'about'}];assert.equal((await journal.readProgramEvidence(targets,0)).items[0].source,null);
 const entry=await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:{action:'set-section',page:'main',section:'about',content:'Committed'}});
 const view=await journal.readProgramEvidence(targets,1);assert.equal(view.items[0].source.entryId,entry.entryId);assert.equal(Object.hasOwn(view.items[0].source,'content'),false);
 await assert.rejects(journal.readProgramEvidence(targets,0),/Stale Wiki revision/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Wiki sequence preflights every ordinary record before writing any prefix',async()=>{
 const {previewWikiPayload}=await import('../chat/product-journal.mjs');const {createHash}=await import('node:crypto');
 const root=await mkdtemp(path.join(tmpdir(),'vivim-sequence-'));
```

_First 80 of 103 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
