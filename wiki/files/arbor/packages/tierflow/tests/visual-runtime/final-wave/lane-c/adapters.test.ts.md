# File: packages/tierflow/tests/visual-runtime/final-wave/lane-c/adapters.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-c/adapters.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5150 B |
| Lines | 43 |
| Hash | 5666fa0ef34d |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| scope | const | 8 | no | const scope={ownerRef:&#39;owner1&#39;,worldRef:&#39;world1&#39;,workspaceRef:&#39;workspace1&#39;,deviceRef:&#39;device1&#39;,sessionRef:&#39;session1&#39;,policyRevision:&#39;policy1&#39;,catalogDigest:TEMPLATE_CATALOG_DIGEST}; |
| fixture | function | 9 | no | function fixture():UiDocument{return {schema:&#39;vivim.ui-document/1&#39;,documentId:&#39;founder1&#39;,scope:{ownerRef:&#39;owner1&#39;,workspaceRef:&#39;workspace1&#39;},revision:17,rootId:&#39;root1&#39;,nodes:[{id:&#39;root1&#39;,type:&#39;stack&#39;… |
| candidate | function | 12 | no | const candidate=(t=&#39;FW.EDIT.FIRST&#39;)=&gt;({schema:&#39;vivim.ui-template-candidate/1&#39;,templateId:t,templateVersion:&#39;1.0.0&#39;,documentId:&#39;founder1&#39;,instanceId:&#39;edit1&#39;,targetNodeId:&#39;root1&#39;,...scope,baseRevision:… |
| prepared | const | 14 | no | const prepared=previewTemplate(candidate(spec.templateId),fixture(),scope); |
| sourceIds | const | 19 | no | const sourceIds=prepared.projection.sourceRefs.filter(x=&gt;!x.synthesized).map(x=&gt;x.sourceId); |
| view | const | 21 | no | const view=projectTemplateViewport(prepared.projection,viewport,{authorized:true,deviceScopeValid:true,sessionFresh:true}); |
| p | const | 28 | no | const p=previewTemplate(candidate(),fixture(),scope);assert.equal(p.ok,true);if(!p.ok)return; |
| v | const | 30 | no | const v=projectTemplateViewport(p.projection,360,s);assert.equal(v.ok,false);if(!v.ok){assert.equal(v.code,&#39;PRIVATE_SCOPE&#39;);assert.deepEqual(v.semanticIds,[]);assert.deepEqual(v.talkBack,[]);assert.d… |
| b | const | 34 | no | const b=fixture();const bad={...b,nodes:[...b.nodes,{id:&#39;bad&#39;,type:&#39;webview&#39;,children:[],props:{html:&#39;&lt;script&gt;alert(1)&lt;/script&gt;&#39;},a11y:{role:&#39;main&#39;,name:&#39;bad&#39;}}]}; |
| p | const | 35 | no | const p=previewTemplate(candidate(),bad,scope);assert.equal(p.ok,false);if(!p.ok)assert.equal(p.code,&#39;INVALID_BASE&#39;); |
| d | const | 40 | no | const d:CapabilityDescriptor={actionId:&#39;ui.layout.preview&#39;,title:&#39;Preview layout&#39;,explanation:&#39;Preview the workspace before owner review&#39;,authority:&#39;ui&#39;,sourceVersion:&#39;v1&#39;,sourceDigest:&#39;digest1&#39;,obse… |
| v | const | 41 | no | const v=projectFirstEditHelp(d);assert.equal(v.runnable,false);assert.equal(v.canRequestPreview,false);assert.match(v.whyUnavailable??&#39;&#39;,/permission/i); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../../../src/visual-runtime/final-wave/lane-c/adapters.ts | import | 3 | [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](../../../../src/visual-runtime/final-wave/lane-c/adapters.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-c/templates.ts | import | 4 | [packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts](../../../../src/visual-runtime/final-wave/lane-c/templates.ts.md) |
| ../../../../src/visual-runtime/document/schema.ts | import | 5 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../../../src/visual-runtime/document/schema.ts.md) |
| ../../../../src/visual-runtime/experience/help.ts | import | 6 | [packages/tierflow/src/visual-runtime/experience/help.ts](../../../../src/visual-runtime/experience/help.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewTemplate,projectTemplateViewport,projectFirstEditHelp} from '../../../../src/visual-runtime/final-wave/lane-c/adapters.ts';
import {TEMPLATE_CATALOG,TEMPLATE_CATALOG_DIGEST} from '../../../../src/visual-runtime/final-wave/lane-c/templates.ts';
import type {UiDocument} from '../../../../src/visual-runtime/document/schema.ts';
import type {CapabilityDescriptor} from '../../../../src/visual-runtime/experience/help.ts';

const scope={ownerRef:'owner1',worldRef:'world1',workspaceRef:'workspace1',deviceRef:'device1',sessionRef:'session1',policyRevision:'policy1',catalogDigest:TEMPLATE_CATALOG_DIGEST};
function fixture():UiDocument{return {schema:'vivim.ui-document/1',documentId:'founder1',scope:{ownerRef:'owner1',workspaceRef:'workspace1'},revision:17,rootId:'root1',nodes:[{id:'root1',type:'stack',props:{direction:'vertical'},children:[],a11y:{role:'main',name:'Founder workspace'}}],bindings:[],views:[{id:'phone',version:1,kind:'2d',viewport:'phone'},{id:'pc',version:1,kind:'2d',viewport:'desktop'}]};}
// `scope` already carries the identical catalogDigest value; the candidate is compared
// by VALUE (templates.ts compares raw.catalogDigest), never by key order.
const candidate=(t='FW.EDIT.FIRST')=>({schema:'vivim.ui-template-candidate/1',templateId:t,templateVersion:'1.0.0',documentId:'founder1',instanceId:'edit1',targetNodeId:'root1',...scope,baseRevision:17,proposedBy:'owner',authority:'candidate-only'});
for(const spec of TEMPLATE_CATALOG)test(`real validator + real mapper accept ${spec.templateId}`,()=>{
 const prepared=previewTemplate(candidate(spec.templateId),fixture(),scope);
 assert.equal(prepared.ok,true,prepared.ok?'':JSON.stringify(prepared));
 if(!prepared.ok)return;
 assert.equal(prepared.document.nodes.length,4);assert.equal(prepared.effectInvoked,false);assert.equal(prepared.publish,'owner-review-required');
 assert.equal(prepared.projection.authority,'inert-display-only');
 const sourceIds=prepared.projection.sourceRefs.filter(x=>!x.synthesized).map(x=>x.sourceId);
 for(const viewport of [320,360,1280] as const){
  const view=projectTemplateViewport(prepared.projection,viewport,{authorized:true,deviceScopeValid:true,sessionFresh:true});
  assert.equal(view.ok,true,view.ok?'':JSON.stringify(view));if(!view.ok)continue;
  assert.equal(view.columns,viewport===1280?2:1);assert.deepEqual(view.semanticIds,sourceIds);
  assert.ok(view.talkBack.every(x=>x.name.length>0));assert.equal(view.effectInvoked,false);
 }
});
test('host KB denial hides node existence and accessible count',()=>{
 const p=previewTemplate(candidate(),fixture(),scope);assert.equal(p.ok,true);if(!p.ok)return;
 for(const s of [{authorized:false,sessionFresh:true,deviceScopeValid:true},{authorized:true,sessionFresh:false,deviceScopeValid:true},{authorized:true,sessionFresh:true,deviceScopeValid:false}]){
  const v=projectTemplateViewport(p.projection,360,s);assert.equal(v.ok,false);if(!v.ok){assert.equal(v.code,'PRIVATE_SCOPE');assert.deepEqual(v.semanticIds,[]);assert.deepEqual(v.talkBack,[]);assert.deepEqual(v.focusOrder,[]);}
 }
});
test('untrusted canonical source cannot smuggle script or unknown component',()=>{
 const b=fixture();const bad={...b,nodes:[...b.nodes,{id:'bad',type:'webview',children:[],props:{html:'<script>alert(1)</script>'},a11y:{role:'main',name:'bad'}}]};
 const p=previewTemplate(candidate(),bad,scope);assert.equal(p.ok,false);if(!p.ok)assert.equal(p.code,'INVALID_BASE');
});
test('wrong catalog pin is refused before mapping',()=>{const p=previewTemplate(candidate(),fixture(),{...scope,catalogDigest:'sha256:wrong'});assert.equal(p.ok,false);});
test('invalid canonical revision yields no partial preview',()=>{const p=previewTemplate(candidate(),{...fixture(),revision:-10},scope);assert.equal(p.ok,false);});
test('help reuses canonical projection, never an executor or grant',()=>{
 const d:CapabilityDescriptor={actionId:'ui.layout.preview',title:'Preview layout',explanation:'Preview the workspace before owner review',authority:'ui',sourceVersion:'v1',sourceDigest:'digest1',observedAt:'2026-11-07',surface:'both',risk:'R0',disclosure:'public',readiness:{supportedByBuild:'yes',availableNow:'yes',permittedForActor:'no',verifiedByEvidence:'unknown'},prerequisites:['Owner review'],requiredScopes:[],textCommand:'preview layout',errorCodes:['NEEDS_REVIEW']};
 const v=projectFirstEditHelp(d);assert.equal(v.runnable,false);assert.equal(v.canRequestPreview,false);assert.match(v.whyUnavailable??'',/permission/i);
});
test('R3 help cannot execute or preview',()=>{const d={actionId:'host.danger',title:'Not available',explanation:'Refused by Host',authority:'host',sourceVersion:'v1',sourceDigest:'d1',observedAt:'2026-11-07',surface:'both',risk:'R3',disclosure:'public',readiness:{supportedByBuild:'yes',availableNow:'yes',permittedForActor:'yes',verifiedByEvidence:'yes'},prerequisites:[],requiredScopes:[],errorCodes:[]} as CapabilityDescriptor;const v=projectFirstEditHelp(d);assert.equal(v.runnable,false);assert.equal(v.canRequestPreview,false);});
```

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
