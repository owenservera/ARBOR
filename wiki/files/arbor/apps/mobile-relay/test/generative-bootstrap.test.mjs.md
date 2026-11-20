# File: apps/mobile-relay/test/generative-bootstrap.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/generative-bootstrap.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4735 B |
| Lines | 30 |
| Hash | d3d637bd6a1c |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| worldId | const | 6 | no | const worldId=&#39;world-local&#39;,requestId=&#39;req-a&#39;,surfaceId=&#39;my-space&#39;; |
| surface | function | 7 | no | const surface=()=&gt;createSurface({surfaceId}); |
| plan | const | 8 | no | const plan={schema:&#39;vivim.render-plan/1&#39;,pass:&#39;F02&#39;,worldId,requestId,theme:{palette:{background:&#39;#112233&#39;,secondary:&#39;#223344&#39;,accent:&#39;#6699dd&#39;},appearance:&#39;dark&#39;,texture:&#39;solid&#39;,mood:&#39;focused&#39;,densi… |
| f01 | const | 9 | no | const f01={schema:&#39;vivim.bootstrap-profile/1&#39;,passId:&#39;F01&#39;,worldId,requestId, |
| deep | function | 12 | no | const deep=(pass)=&gt;({schema:&#39;vivim.bootstrap-output/1&#39;,passId:pass,worldId,requestId,viewProposals:[{id:&#39;viw-test&#39;,kind:&#39;card&#39;,title:&#39;Possible view&#39;,reason:&#39;Owner may want this&#39;}],schemaProposals:[]}… |
| adapt | const | 13 | no | const adapt=(pass,compiled,s=surface())=&gt;adaptCompiledBootstrap({pass,compiled,surface:s,worldId,requestId}); |
| preview | const | 14 | no | const preview=(a,s=surface(),refs=[])=&gt;compileUiProposal({proposal:a.proposal,surface:s,approvedRefs:[...refs,...a.approvedRefs]}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/compiler.mjs | import | 4 | [apps/mobile-relay/generative-ui/compiler.mjs](../generative-ui/compiler.mjs.md) |
| ../generative-ui/bootstrap-adapters.mjs | import | 5 | [apps/mobile-relay/generative-ui/bootstrap-adapters.mjs](../generative-ui/bootstrap-adapters.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface,projectSurface,DEFAULT_THEME} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {provisionalBootstrapSurface,adaptCompiledBootstrap} from '../generative-ui/bootstrap-adapters.mjs';
const worldId='world-local',requestId='req-a',surfaceId='my-space';
const surface=()=>createSurface({surfaceId});
const plan={schema:'vivim.render-plan/1',pass:'F02',worldId,requestId,theme:{palette:{background:'#112233',secondary:'#223344',accent:'#6699dd'},appearance:'dark',texture:'solid',mood:'focused',density:'comfortable',motion:'still'},typography:{fontFamily:'system',fontSizePx:15,headingSizePx:28,radiusPx:14,spacingScale:1}};
const f01={schema:'vivim.bootstrap-profile/1',passId:'F01',worldId,requestId,
  claims:[{id:'clm-abc',section:'focus',label:'Local app',kind:'project',statement:'Work in progress',basis:'provider_memory_report',freshness:'current'}],
  cards:[{id:'clm-card1',title:'Current project',focus:'Local app'},{id:'clm-card2',title:'Unlinked card'}],unknowns:[]};
const deep=(pass)=>({schema:'vivim.bootstrap-output/1',passId:pass,worldId,requestId,viewProposals:[{id:'viw-test',kind:'card',title:'Possible view',reason:'Owner may want this'}],schemaProposals:[]});
const adapt=(pass,compiled,s=surface())=>adaptCompiledBootstrap({pass,compiled,surface:s,worldId,requestId});
const preview=(a,s=surface(),refs=[])=>compileUiProposal({proposal:a.proposal,surface:s,approvedRefs:[...refs,...a.approvedRefs]});
test('BF00 provisional theme uses same surface and no model',()=>{const a=provisionalBootstrapSurface({renderPlan:plan});assert.equal(a.surfaceId,'my-space');assert.equal(a.tree.children.length,0);assert.equal(a.theme.background,'#112233');});
test('F02 adapts locally validated render plan to set-theme',()=>{const a=adapt('F02',plan);assert.equal(a.proposal.operations[0].type,'set-theme');assert.equal(preview(a).surface.theme.accent,'#6699dd');assert.equal(a.persisted,false);});
test('F01 creates only evidence-linked grounded project card',()=>{const a=adapt('F01',f01);assert.equal(a.proposal.operations.length,1);const p=preview(a);assert.equal(p.surface.tree.children[0].type,'project-card');assert.equal(p.surface.tree.children[0].props.sourceRef,'clm-abc');});
test('F01 with no linked facts stays empty (never invents identity)',()=>{const a=adapt('F01',{...f01,claims:[]});assert.equal(a.proposal,null);assert.equal(a.decision,'no-grounded-components');});
test('F01 cannot be spoofed with mismatched world',()=>assert.throws(()=>adapt('F01',{...f01,worldId:'other-world'}),/UI_REJECTED/));
test('deep D03 proposes optional component',()=>{const a=adapt('D03',deep('D03'));assert.equal(preview(a).surface.tree.children[0].visibility,'phone');assert.equal(a.decision,'preview-required');});
test('deep D04 proposals preserve same shared surface',()=>{const s=surface();const a=adapt('D04',deep('D04'),s);assert.equal(preview(a,s).surface.surfaceId,s.surfaceId);});
test('deep D05 produces safe optional workflow view',()=>assert.equal(adapt('D05',deep('D05')).proposal.operations[0].type,'insert'));
test('D06 strictly PC-private and never appears on phone',()=>{const a=adapt('D06',deep('D06'));const result=preview(a);assert.equal(a.visibility,'pc-private');assert.equal(projectSurface(result.surface,{audience:'phone',refs:new Set(a.approvedRefs)}).tree.children.length,0);});
test('D07 contradictions and schema proposals remain review-only',()=>{const a=adapt('D07',{...deep('D07'),schemaProposals:[{id:'sch-untrusted',type:'my_type'}]});assert.equal(a.visibility,'pc-private');assert.equal(a.proposal.operations.length,1);assert.equal(a.decision,'preview-required');});
test('reject untrusted deep-pass schema',()=>assert.throws(()=>adapt('D03',{...deep('D03'),schema:'anything'}),/UI_REJECTED/));
test('reject mismatched deep pass',()=>assert.throws(()=>adapt('D03',deep('D06')),/UI_REJECTED/));
test('replay proposes replacement under same stable ID',()=>{const a=adapt('F01',f01);const s=preview(a).surface;const again=adapt('F01',f01,s);assert.equal(again.proposal.operations[0].type,'replace-props');});
test('F02 theme never activates by itself',()=>{const a=adapt('F02',plan);assert.equal(a.decision,'preview-required');assert.equal(a.proposal.baseRevision,0);assert.equal(surface().revision,0);});
test('empty deep view returns no suggestion',()=>assert.equal(adapt('D04',{...deep('D04'),viewProposals:[]}).proposal,null));
test('tentative F01 guesses never become a personal card',()=>{const a=adapt('F01',{...f01,claims:[{...f01.claims[0],basis:'tentative_inference'}]});assert.equal(a.proposal,null);});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
