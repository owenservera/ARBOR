# File: apps/mobile-relay/test/generative-semantic.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/generative-semantic.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4574 B |
| Lines | 44 |
| Hash | 110b7b967b5e |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| worldId | const | 6 | no | const worldId=&#39;world-local&#39;,requestId=&#39;req-a&#39;,surface=createSurface(); |
| input | function | 7 | no | const input=(pass,compiled)=&gt;({pass,compiled,worldId,requestId}); |
| f01 | const | 8 | no | const f01={schema:&#39;vivim.bootstrap-profile/1&#39;,passId:&#39;F01&#39;,worldId,requestId,claims:[{id:&#39;clm-p1&#39;,label:&#39;Project A&#39;,section:&#39;focus&#39;,statement:&#39;User-described project&#39;,kind:&#39;project&#39;,basis:&#39;provider_m… |
| deep | function | 9 | no | const deep=pass=&gt;({schema:&#39;vivim.bootstrap-output/1&#39;,passId:pass,worldId,requestId,assertions:[{id:&#39;clm-workflow&#39;,label:&#39;Research habit&#39;,section:&#39;workflow&#39;,basis:&#39;explicitly_stated&#39;,freshness:&#39;curren… |
| s | const | 11 | no | const s=projectBootstrapSemantics(input(&#39;F01&#39;,f01));assert.equal(s.objects[0].objectRef,&#39;clm-p1&#39;);assert.equal(s.views[0].componentId,&#39;f01.clm-c1&#39;);assert.equal(s.edges[0].to,&#39;k.clm-p1&#39;);assert.equal… |
| a | const | 14 | no | const a=adaptCompiledBootstrap({...input(&#39;F01&#39;,f01),surface});assert.equal(a.semantic.objects[0].objectRef,a.proposal.operations[0].component.props.sourceRef); |
| s | const | 17 | no | const s=projectBootstrapSemantics(input(&#39;D05&#39;,deep(&#39;D05&#39;)));assert.equal(s.views[0].layoutIntent,&#39;timeline&#39;);assert.deepEqual(s.views[0].objectRefs,[]);assert.deepEqual(s.edges,[]); |
| s | const | 20 | no | const s=projectBootstrapSemantics(input(&#39;D05&#39;,deep(&#39;D05&#39;)));const out=projectSemanticsForAudience(s);assert(!out.objects.some(o=&gt;o.objectRef===&#39;obs-evidence&#39;));assert.deepEqual(out.unknowns,[]); |
| s | const | 23 | no | const s=projectBootstrapSemantics(input(&#39;D06&#39;,deep(&#39;D06&#39;)));const out=projectSemanticsForAudience(s);assert.equal(out.objects.length,0);assert.equal(out.views.length,0);assert.equal(projectSemanticsF… |
| s | const | 26 | no | const s=projectBootstrapSemantics(input(&#39;D07&#39;,deep(&#39;D07&#39;)));assert.equal(s.effects,&#39;none&#39;);assert.equal(s.persisted,false); |
| semantic | const | 29 | no | const semantic=projectBootstrapSemantics(input(&#39;D04&#39;,deep(&#39;D04&#39;)));const req={semantic,targetId:&#39;d04.viw-flow&#39;,intent:&#39;preview-layout&#39;,layout:&#39;timeline&#39;}; |
| a | const | 30 | no | const a=projectVisualIntent({...req,source:&#39;tap&#39;}),b=projectVisualIntent({...req,source:&#39;language&#39;}),c=projectVisualIntent({...req,source:&#39;glyph&#39;}); |
| semantic | const | 34 | no | const semantic=projectBootstrapSemantics(input(&#39;D04&#39;,deep(&#39;D04&#39;))); |
| compiled | const | 43 | no | const compiled={...f01,cards:[...f01.cards,...f01.cards]};const s=projectBootstrapSemantics(input(&#39;F01&#39;,compiled));assert.equal(s.objects.length,1); // source uniqueness, not card-count |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/bootstrap-adapters.mjs | import | 4 | [apps/mobile-relay/generative-ui/bootstrap-adapters.mjs](../generative-ui/bootstrap-adapters.mjs.md) |
| ../generative-ui/semantic-projection.mjs | import | 5 | [apps/mobile-relay/generative-ui/semantic-projection.mjs](../generative-ui/semantic-projection.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface} from '../generative-ui/catalog.mjs';
import {adaptCompiledBootstrap} from '../generative-ui/bootstrap-adapters.mjs';
import {projectBootstrapSemantics,projectSemanticsForAudience,projectVisualIntent,LEGACY_MUTATION_COMPAT} from '../generative-ui/semantic-projection.mjs';
const worldId='world-local',requestId='req-a',surface=createSurface();
const input=(pass,compiled)=>({pass,compiled,worldId,requestId});
const f01={schema:'vivim.bootstrap-profile/1',passId:'F01',worldId,requestId,claims:[{id:'clm-p1',label:'Project A',section:'focus',statement:'User-described project',kind:'project',basis:'provider_memory_report',freshness:'current'}],cards:[{id:'clm-c1',title:'Work',focus:'Project A'}],unknowns:['Not known']};
const deep=pass=>({schema:'vivim.bootstrap-output/1',passId:pass,worldId,requestId,assertions:[{id:'clm-workflow',label:'Research habit',section:'workflow',basis:'explicitly_stated',freshness:'current',confidence:.85}],observations:[{id:'obs-evidence',category:'skill',text:'A private explanation',sensitive:true,confidence:.6}],viewProposals:[{id:'viw-flow',kind:'timeline',title:'Timeline',reason:'Review'}],unknowns:['Unverified']});
test('F01 preserves claim ID, distinct component ID, explicit presentation relationship',()=>{
  const s=projectBootstrapSemantics(input('F01',f01));assert.equal(s.objects[0].objectRef,'clm-p1');assert.equal(s.views[0].componentId,'f01.clm-c1');assert.equal(s.edges[0].to,'k.clm-p1');assert.equal(s.effects,'none');
});
test('F01 surface adapter returns same semantic identity without changing input',()=>{
  const a=adaptCompiledBootstrap({...input('F01',f01),surface});assert.equal(a.semantic.objects[0].objectRef,a.proposal.operations[0].component.props.sourceRef);
});
test('Deep view has layout intention without invented object relationship',()=>{
  const s=projectBootstrapSemantics(input('D05',deep('D05')));assert.equal(s.views[0].layoutIntent,'timeline');assert.deepEqual(s.views[0].objectRefs,[]);assert.deepEqual(s.edges,[]);
});
test('private observation never appears in phone semantic objects',()=>{
  const s=projectBootstrapSemantics(input('D05',deep('D05')));const out=projectSemanticsForAudience(s);assert(!out.objects.some(o=>o.objectRef==='obs-evidence'));assert.deepEqual(out.unknowns,[]);
});
test('D06 all private on phone, PC retains meaning',()=>{
  const s=projectBootstrapSemantics(input('D06',deep('D06')));const out=projectSemanticsForAudience(s);assert.equal(out.objects.length,0);assert.equal(out.views.length,0);assert.equal(projectSemanticsForAudience(s,{audience:'pc'}).views.length,1);
});
test('D07 cannot become active schema or grant',()=>{
  const s=projectBootstrapSemantics(input('D07',deep('D07')));assert.equal(s.effects,'none');assert.equal(s.persisted,false);
});
test('tap, language and glyph yield identical meaning digest, no effect',()=>{
  const semantic=projectBootstrapSemantics(input('D04',deep('D04')));const req={semantic,targetId:'d04.viw-flow',intent:'preview-layout',layout:'timeline'};
  const a=projectVisualIntent({...req,source:'tap'}),b=projectVisualIntent({...req,source:'language'}),c=projectVisualIntent({...req,source:'glyph'});
  assert.equal(a.meaningDigest,b.meaningDigest);assert.equal(b.meaningDigest,c.meaningDigest);assert.equal(a.effects,'none');assert.equal(a.authorization,'required-for-commit');
});
test('unsupported symbols and attempts at execution rejected',()=>{
  const semantic=projectBootstrapSemantics(input('D04',deep('D04')));
  assert.throws(()=>projectVisualIntent({semantic,source:'glyph',targetId:'d04.viw-flow',intent:'execute'}),/UI_REJECTED/);
  assert.throws(()=>projectVisualIntent({semantic,source:'gesture',targetId:'missing',intent:'preview-layout',layout:'grid'}),/UI_REJECTED/);
  assert.throws(()=>projectVisualIntent({semantic,source:'gesture',targetId:'d04.viw-flow',intent:'preview-layout',layout:'shell'}),/UI_REJECTED/);
});
test('legacy mutation comparison explicitly refuses bindings and slots',()=>{
  assert.equal(Object.keys(LEGACY_MUTATION_COMPAT).length,8);assert.equal(LEGACY_MUTATION_COMPAT.rebind.status,'unsupported');assert.equal(LEGACY_MUTATION_COMPAT.set_slot.status,'unsupported');
});
test('duplicate unstable semantic IDs are not independently minted',()=>{
  const compiled={...f01,cards:[...f01.cards,...f01.cards]};const s=projectBootstrapSemantics(input('F01',compiled));assert.equal(s.objects.length,1); // source uniqueness, not card-count
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
