# File: apps/vivim-host/test/native-capture-wiring.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/native-capture-wiring.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2573 B |
| Lines | 29 |
| Hash | 8da3337bd1ce |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dataRoot | const | 9 | no | const dataRoot=await mkdtemp(path.join(tmpdir(),&#39;native-capture-&#39;)); |
| journal | const | 11 | no | const journal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}}); |
| draft | const | 12 | no | const draft=previewWikiCapture(await journal.readPhoneWiki(),{capture_id:&#39;note-0001&#39;,kind:&#39;task&#39;,content:&#39;Ship the revised view&#39;}); |
| entry | const | 13 | no | const entry=await journal.append({kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:0,edit:draft.edit}); |
| receipt | const | 14 | no | const receipt={schema:&#39;vivim.control-receipt/1&#39;,planId:&#39;ctl-0123456789abcdef&#39;,planDigest:&#39;a&#39;.repeat(64),actionId:&#39;wiki.capture.save&#39;,risk:&#39;R1&#39;,source:&#39;mobile&#39;,status:&#39;applied&#39;,executionPerformed:true… |
| ctl | const | 16 | no | const ctl={recent:()=&gt;[{planId:receipt.planId,actionId:receipt.actionId,risk:&#39;R1&#39;,state:&#39;applied&#39;,source:&#39;mobile&#39;}], |
| snapshot | variable | 18 | no | let snapshot=await journal.readNativeKnowledge({nativeOnly:true}); |
| effects | variable | 19 | no | let effects=projectAppliedControlEffects(ctl,snapshot.context.wikiChanges,snapshot.context.wikiStructure); |
| rows | const | 20 | no | const rows=buildNativeKnowledge(snapshot,effects); |
| after | const | 25 | no | const after=buildNativeKnowledge(snapshot,projectAppliedControlEffects(ctl,snapshot.context.wikiChanges,snapshot.context.wikiStructure)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../chat/product-journal.mjs | import | 6 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/rust-context.mjs | import | 7 | [apps/vivim-host/chat/rust-context.mjs](../chat/rust-context.mjs.md) |

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
import {createProductJournal,previewWikiCapture,projectAppliedControlEffects} from '../chat/product-journal.mjs';
import {buildNativeKnowledge} from '../chat/rust-context.mjs';
test('committed capture creates a durable page/section and matching native receipt link',async()=>{
 const dataRoot=await mkdtemp(path.join(tmpdir(),'native-capture-'));
 try{
  const journal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{}}});
  const draft=previewWikiCapture(await journal.readPhoneWiki(),{capture_id:'note-0001',kind:'task',content:'Ship the revised view'});
  const entry=await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:0,edit:draft.edit});
  const receipt={schema:'vivim.control-receipt/1',planId:'ctl-0123456789abcdef',planDigest:'a'.repeat(64),actionId:'wiki.capture.save',risk:'R1',source:'mobile',status:'applied',executionPerformed:true,approvedVia:'direct-phone',at:entry.receivedAt,
   result:{page:draft.page,section:draft.section,entryId:entry.entryId,sequence:entry.sequence,previousRevision:0,wikiRevision:1,content:draft.edit.content}};
  const ctl={recent:()=>[{planId:receipt.planId,actionId:receipt.actionId,risk:'R1',state:'applied',source:'mobile'}],
    status:()=>({state:'applied',receipt})};
  let snapshot=await journal.readNativeKnowledge({nativeOnly:true});
  let effects=projectAppliedControlEffects(ctl,snapshot.context.wikiChanges,snapshot.context.wikiStructure);
  const rows=buildNativeKnowledge(snapshot,effects);
  assert.equal(rows.length,3);assert.equal(rows.find(r=>r.kind==='effect').wikiLink.entryId,entry.entryId);
  assert.equal(rows.find(r=>r.semanticId.startsWith('wiki:page:')).sourceRef,entry.entryId+'.page');
  await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:1,edit:{action:'set-section',page:draft.page,section:'Task',content:'Revised task'}});
  snapshot=await journal.readNativeKnowledge({nativeOnly:true});
  const after=buildNativeKnowledge(snapshot,projectAppliedControlEffects(ctl,snapshot.context.wikiChanges,snapshot.context.wikiStructure));
  assert.equal(after.find(r=>r.semanticId.startsWith('wiki:page:')).sourceRef,entry.entryId+'.page');
  assert.equal(after.find(r=>r.semanticId.startsWith('wiki:section:')).revision,2);
 }finally{await rm(dataRoot,{recursive:true,force:true})}
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
