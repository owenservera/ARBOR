# File: apps/vivim-host/test/wiki-living-knowledge.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/wiki-living-knowledge.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7682 B |
| Lines | 105 |
| Hash | 6832951eac38 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 12 | no | const root=mkdtempSync(join(tmpdir(),&#39;vivim-living-wiki-&#39;)); |
| journal | const | 14 | no | const journal=createProductJournal({dataRoot:root}); |
| append | function | 15 | no | const append=(edit,expectedRevision)=&gt;journal.append({kind:&#39;wiki-structure&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,edit,expectedRevision}); |
| initial | const | 16 | no | const initial=(await journal.readPhoneWiki()).revision; |
| committed | const | 18 | no | const committed=await append({action:&#39;link-pages&#39;,from:&#39;Main&#39;,to:&#39;project&#39;},initial+1); |
| moved | const | 19 | no | const moved=await append({action:&#39;move-page&#39;,page:&#39;project&#39;,position:&#39;top&#39;},initial+2); |
| observed | const | 20 | no | const observed=await journal.append({kind:&#39;chat-send&#39;,actor:&#39;human&#39;,schemaVersion:1,text:&#39;An unverified task statement&#39;, intent:{outcome:&#39;candidate&#39;,candidate:{actionId:&#39;wiki.page.move&#39;,args:{page:&#39;P… |
| reopened | const | 22 | no | const reopened=createProductJournal({dataRoot:root}); |
| context | const | 23 | no | const context=await reopened.readWikiContext(); |
| graph | const | 24 | no | const graph=context.semantics; |
| relation | const | 26 | no | const relation=graph.relationships.find(x=&gt;x.kind===&#39;wiki-page-link&#39;); |
| statement | const | 35 | no | const statement=graph.nodes.find(n=&gt;n.id===&#39;journal:&#39;+observed.entryId); |
| inferred | const | 39 | no | const inferred=graph.relationships.find(r=&gt;r.kind===&#39;candidate-target&#39;); |
| phone | const | 45 | no | const phone=await reopened.readPhoneWiki(); |
| request | const | 49 | no | const request=selectRequestWiki(phone,{actionId:&#39;wiki.section.read&#39;,outcome:&#39;done&#39;, args:{page:&#39;project&#39;,section:&#39;About&#39;},result:{wikiRevision:phone.revision}}); |
| related | const | 51 | no | const related=request.pages.find(p=&gt;p.page===&#39;Main&#39;); |
| receipt | const | 54 | no | const receipt={schema:&#39;vivim.control-receipt/1&#39;,planId:&#39;ctl-0123456789abcdef&#39;,actionId:&#39;wiki.pages.link&#39;, |
| control | const | 59 | no | const control={recent:()=&gt;[{state:&#39;applied&#39;,planId:receipt.planId,actionId:receipt.actionId,risk:&#39;R1&#39;}], |
| effects | const | 61 | no | const effects=projectAppliedControlEffects(control,context.wikiChanges,context.wikiStructure); |
| observedGraph | const | 65 | no | const observedGraph=projectWikiSemantics({...context,applicationEffects:effects}); |
| snapshot | const | 72 | no | const snapshot=await reopened.readNativeKnowledge(); |
| rows | const | 73 | no | const rows=buildNativeKnowledge(snapshot,effects); |
| edges | const | 74 | no | const edges=buildNativeRelationships(snapshot,rows); |
| wiki | const | 88 | no | const wiki={revision:33,pages:{Main:{sections:{About:&#39;&#39;},links:[&#39;project&#39;]},project:{sections:{About:&#39;&#39;}}}}; |
| event | function | 89 | no | const event=(i,edit)=&gt;({kind:&#39;wiki-structure&#39;,entryId:String(i).padStart(36,&#39;0&#39;), sequence:i,expectedRevision:i,receivedAt:&#39;2026-11-18T00:00:00Z&#39;,edit}); |
| records | const | 91 | no | const records=[event(1,{action:&#39;create-page&#39;,page:&#39;project&#39;}),event(2,{action:&#39;link-pages&#39;,from:&#39;Main&#39;,to:&#39;project&#39;})]; |
| structure | const | 93 | no | const structure=projectWikiStructure(records,wiki); |
| without | const | 99 | no | const without=projectWikiStructure(records,{...wiki,pages:{Main:{sections:{About:&#39;&#39;}},project:{sections:{About:&#39;&#39;}}}}); |
| graph | const | 101 | no | const graph=projectWikiSemantics({revision:records.length,wikiRevision:wiki.revision,wikiStructure:structure}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../chat/product-journal.mjs | import | 6 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/wiki-semantics.mjs | import | 7 | [apps/vivim-host/chat/wiki-semantics.mjs](../chat/wiki-semantics.mjs.md) |
| ../chat/rust-context.mjs | import | 8 | [apps/vivim-host/chat/rust-context.mjs](../chat/rust-context.mjs.md) |
| ../control/request-context.mjs | import | 9 | [apps/vivim-host/control/request-context.mjs](../control/request-context.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createProductJournal,projectAppliedControlEffects} from '../chat/product-journal.mjs';
import {projectWikiSemantics,projectWikiStructure,pageId} from '../chat/wiki-semantics.mjs';
import {buildNativeKnowledge,buildNativeRelationships} from '../chat/rust-context.mjs';
import {selectRequestWiki} from '../control/request-context.mjs';

test('committed page graph is reconstructed, source-linked and exposed to authorized request context',async t=>{
  const root=mkdtempSync(join(tmpdir(),'vivim-living-wiki-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const journal=createProductJournal({dataRoot:root});
  const append=(edit,expectedRevision)=>journal.append({kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,edit,expectedRevision});
  const initial=(await journal.readPhoneWiki()).revision;
  await append({action:'create-page',page:'project'},initial);
  const committed=await append({action:'link-pages',from:'Main',to:'project'},initial+1);
  const moved=await append({action:'move-page',page:'project',position:'top'},initial+2);
  const observed=await journal.append({kind:'chat-send',actor:'human',schemaVersion:1,text:'An unverified task statement',
    intent:{outcome:'candidate',candidate:{actionId:'wiki.page.move',args:{page:'PROJECT',position:'bottom'}}}});
  const reopened=createProductJournal({dataRoot:root});
  const context=await reopened.readWikiContext();
  const graph=context.semantics;
  assert.deepEqual(context,await journal.readWikiContext());
  const relation=graph.relationships.find(x=>x.kind==='wiki-page-link');
  assert.equal(relation.from,pageId('Main'));
  assert.equal(relation.to,pageId('project'));
  assert.equal(relation.source.ref,committed.entryId);
  assert.equal(relation.source.wikiRevision,committed.wikiRevision);
  assert.equal(relation.classification,'observed-state');
  assert.equal(relation.evidence.assurance,'verified');
  assert.equal(relation.evidence.claim,'journal-backed-structure');
  assert.equal(relation.evidence.planningEligible,false);
  const statement=graph.nodes.find(n=>n.id==='journal:'+observed.entryId);
  assert.equal(statement.evidence.origin,'declared');
  assert.equal(statement.evidence.assurance,'attested');
  assert.equal(Object.hasOwn(statement.source,'digest'),false);
  const inferred=graph.relationships.find(r=>r.kind==='candidate-target');
  assert.equal(inferred.evidence.assurance,'proposed');
  assert.equal(inferred.evidence.planningEligible,false);
  assert.ok(graph.relationships.some(x=>x.kind==='moved-page'&&x.from==='journal:'+moved.entryId));
  assert.ok(graph.relationships.some(x=>x.kind==='candidate-target'&&x.from==='journal:'+observed.entryId&&x.classification==='inferred-relationship'));
  assert.ok(!graph.nodes.some(n=>n.kind==='project'||n.kind==='task'));
  const phone=await reopened.readPhoneWiki();
  assert.equal(phone.semantics,undefined);
  assert.ok(!JSON.stringify(phone.wikiStructure).includes('"sequence"'));
  assert.ok(!JSON.stringify(phone).includes('unverified task statement'));
  const request=selectRequestWiki(phone,{actionId:'wiki.section.read',outcome:'done',
    args:{page:'project',section:'About'},result:{wikiRevision:phone.revision}});
  const related=request.pages.find(p=>p.page==='Main');
  assert.equal(related.relationshipSource.ref,committed.entryId);
  assert.equal(related.relationshipSource.wikiRevision,committed.wikiRevision);
  const receipt={schema:'vivim.control-receipt/1',planId:'ctl-0123456789abcdef',actionId:'wiki.pages.link',
    risk:'R1',status:'applied',executionPerformed:true,approvedVia:'desktop-owner-token',
    planDigest:'a'.repeat(64),at:committed.receivedAt,
    result:{entryId:committed.entryId,sequence:committed.sequence,wikiRevision:committed.wikiRevision,
      previousRevision:committed.expectedRevision,edit:committed.edit}};
  const control={recent:()=>[{state:'applied',planId:receipt.planId,actionId:receipt.actionId,risk:'R1'}],
    status:()=>({state:'applied',receipt})};
  const effects=projectAppliedControlEffects(control,context.wikiChanges,context.wikiStructure);
  assert.equal(effects.items[0].structureLink.entryId,committed.entryId);
  assert.ok(projectWikiSemantics({...context,applicationEffects:effects}).relationships.some(r=>
    r.kind==='confirmed-change'&&r.to==='journal:'+committed.entryId));
  const observedGraph=projectWikiSemantics({...context,applicationEffects:effects});
  assert.equal(observedGraph.nodes.find(n=>n.kind==='applied-effect').evidence.claim,'applied-receipt-occurrence');
  assert.equal(observedGraph.nodes.find(n=>n.kind==='control-action').evidence.assurance,'proposed');
  assert.equal(projectAppliedControlEffects({...control,recent:()=>[
    ...control.recent(),...control.recent(),{state:'uncertain',actionId:receipt.actionId,risk:'R1',planId:'uncertain'},
    {state:'applied',actionId:'control.rule.remember',risk:'R2',planId:'private-rule'}
  ]},context.wikiChanges,context.wikiStructure).items.length,1);
  const snapshot=await reopened.readNativeKnowledge();
  const rows=buildNativeKnowledge(snapshot,effects);
  const edges=buildNativeRelationships(snapshot,rows);
  assert.equal(edges.length,1);
  assert.equal(edges[0].sourceRef,committed.entryId);
  assert.ok(rows.some(r=>r.id===edges[0].from&&r.semanticId===pageId('Main')));
  assert.ok(rows.some(r=>r.id===edges[0].to&&r.semanticId===pageId('project')&&r.sourceRevision===moved.wikiRevision));
  assert.ok(!JSON.stringify(rows).includes('unverified task statement'));
  receipt.result.edit={...receipt.result.edit,to:'wrong'};
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
