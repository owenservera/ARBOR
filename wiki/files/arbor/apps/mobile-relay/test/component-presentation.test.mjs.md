# File: apps/mobile-relay/test/component-presentation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/component-presentation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5313 B |
| Lines | 58 |
| Hash | d9ecb9918873 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 8 | no | function fixture(){const s=createSurface();s.revision=4;s.tree.children.push({id:&#39;alpha&#39;,type:&#39;card&#39;,props:{title:&#39;Alpha&#39;},children:[]},{id:&#39;beta&#39;,type:&#39;card&#39;,props:{title:&#39;Beta&#39;},children:[]});retur… |
| request | function | 9 | no | const request=(surface,request)=&gt;resolveBuildRequest({request,surface}); |
| s | const | 11 | no | const s=fixture(),read=request(s,&#39;set component alpha at revision 4 background to #123456&#39;); |
| out | const | 18 | no | const out=request(s,&#39;set component alpha &#39;+property+&#39; to &#39;+value);assert.equal(out.outcome,&#39;candidate&#39;,property); |
| s | const | 22 | no | const s=fixture(); |
| p | const | 25 | no | const p={schema:&#39;vivim.ui-proposal/1&#39;,surfaceId:s.surfaceId,baseRevision:4,operations:[{opId:&#39;edit&#39;,type:&#39;set-presentation&#39;,componentId:&#39;alpha&#39;,presentation:{css:&#39;display:none&#39;}}],explanation:&#39;Bad&#39;,a… |
| s | const | 29 | no | const s=fixture(),draft=request(s,&#39;set component alpha background to #123456&#39;); |
| styled | const | 30 | no | const styled=request(draft.preview.surface,&#39;set component alpha padding to 12px&#39;).preview.surface; |
| doc | const | 32 | no | const doc={defaultView:{innerWidth:390},createElement(tag){return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);},addEventListener(){}};}… |
| mount | const | 33 | no | const mount={ownerDocument:doc,replaceChildren(...children){this.children=children;}}; |
| instances | variable | 34 | no | let instances;renderSurface(mount,styled,{tierflow:true,onMounted:v=&gt;{instances=v}}); |
| reset | const | 38 | no | const reset=request(styled,&#39;reset component alpha appearance&#39;);assert.equal(reset.outcome,&#39;candidate&#39;);assert.equal(reset.preview.surface.tree.children[0].presentation,undefined); |
| s | const | 41 | no | const s=fixture();s.tree.children.push({id:&#39;chart&#39;,type:&#39;chart&#39;,props:{title:&#39;Values&#39;,items:[{label:&#39;Loss&#39;,value:-5},{label:&#39;Gain&#39;,value:10}]},children:[]}); |
| doc | const | 42 | no | const doc={defaultView:{innerWidth:390},createElement(tag){return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);},addEventListener(){}};}… |
| mount | const | 43 | no | const mount={ownerDocument:doc,replaceChildren(...children){this.children=children;}}; |
| before | const | 50 | no | const before=fixture(),draft=request(before,&#39;set component alpha radius to 12px&#39;); |
| committed | const | 52 | no | const committed={surfaceId:before.surfaceId,parentRevision:4,committedRevision:5}; |
| live | const | 53 | no | const live={...draft.preview.surface,revision:5}; |
| undo | const | 54 | no | const undo=buildUndoProposal({original:draft,before,committed,live}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/compiler.mjs | import | 4 | [apps/mobile-relay/generative-ui/compiler.mjs](../generative-ui/compiler.mjs.md) |
| ../build-composer.mjs | import | 5 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |
| ../generative-ui/renderer.mjs | import | 6 | [apps/mobile-relay/generative-ui/renderer.mjs](../generative-ui/renderer.mjs.md) |
| ../build-canvas.mjs | import | 7 | [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface,validateSurface} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {resolveBuildRequest} from '../build-composer.mjs';
import {planTierflowSurface,renderSurface} from '../generative-ui/renderer.mjs';
import {buildUndoProposal} from '../build-canvas.mjs';
function fixture(){const s=createSurface();s.revision=4;s.tree.children.push({id:'alpha',type:'card',props:{title:'Alpha'},children:[]},{id:'beta',type:'card',props:{title:'Beta'},children:[]});return validateSurface(s);}
const request=(surface,request)=>resolveBuildRequest({request,surface});
test('exact component config preserves sibling, scope and original; engine draft is inert',()=>{
 const s=fixture(),read=request(s,'set component alpha at revision 4 background to #123456');
 assert.equal(read.outcome,'candidate');assert.equal(read.preview.persisted,false);
 assert.equal(read.proposal.baseRevision,4);assert.equal(read.proposal.operations[0].componentId,'alpha');
 assert.deepEqual(read.preview.surface.tree.children[0].presentation,{background:'#123456'});
 assert.deepEqual(read.preview.surface.tree.children[1],s.tree.children[1]);assert.deepEqual(read.preview.surface.theme,s.theme);
 assert.equal(s.tree.children[0].presentation,undefined);
 for(const [property,value] of [['border-color','#abcdef'],['border-width','2px'],['radius','12px'],['font-size','18px'],['padding','6px'],['gap','8px']]){
  const out=request(s,'set component alpha '+property+' to '+value);assert.equal(out.outcome,'candidate',property);
 }
});
test('revision-pinned, invalid or unsafe requests refuse without fallback',()=>{
 const s=fixture();
 for(const text of ['set component alpha at revision 3 radius to 12px','set component alpha radius to 90px','set component alpha background to url(fake)','set component alpha background to #123456;delete beta','set component alpha visibility to hidden'])assert.equal(request(s,text).outcome,'refused',text);
 assert.equal(request(s,'set component missing radius to 12px').outcome,'clarification_required');
 const p={schema:'vivim.ui-proposal/1',surfaceId:s.surfaceId,baseRevision:4,operations:[{opId:'edit',type:'set-presentation',componentId:'alpha',presentation:{css:'display:none'}}],explanation:'Bad',assumptions:[],unknowns:[]};
 assert.throws(()=>compileUiProposal({proposal:p,surface:s}),/presentation/);
});
test('validated source presentation is retained on preview and committed TierFlow mounts',()=>{
 const s=fixture(),draft=request(s,'set component alpha background to #123456');
 const styled=request(draft.preview.surface,'set component alpha padding to 12px').preview.surface;
 assert.equal(planTierflowSurface(styled).plan.status,'ok');
 const doc={defaultView:{innerWidth:390},createElement(tag){return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);},addEventListener(){}};}};
 const mount={ownerDocument:doc,replaceChildren(...children){this.children=children;}};
 let instances;renderSurface(mount,styled,{tierflow:true,onMounted:v=>{instances=v}});
 const [a,b]=mount.children[0].children[0].children;
 assert.equal(a.style.backgroundColor,'#123456');assert.equal(a.style.padding,'12px');assert.equal(b.style.backgroundColor,s.theme.secondary);
 assert.equal(instances.find(x=>x.instanceId==='alpha').settings.paddingPx,12);
 const reset=request(styled,'reset component alpha appearance');assert.equal(reset.outcome,'candidate');assert.equal(reset.preview.surface.tree.children[0].presentation,undefined);
});
test('signed chart values produce bounded bars without changing labels or original values',()=>{
 const s=fixture();s.tree.children.push({id:'chart',type:'chart',props:{title:'Values',items:[{label:'Loss',value:-5},{label:'Gain',value:10}]},children:[]});
 const doc={defaultView:{innerWidth:390},createElement(tag){return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);},addEventListener(){}};}};
 const mount={ownerDocument:doc,replaceChildren(...children){this.children=children;}};
 renderSurface(mount,s,{tierflow:true});const [loss,gain]=mount.children[0].children[0].children[2].children[1].children;
 assert.equal(loss.children[0].textContent,'-5');assert.equal(gain.children[0].textContent,'10');
 assert.equal(loss.children[1].children[1].style.left,'0%');assert.ok(parseFloat(gain.children[1].children[1].style.width)>60);
});

test('appearance undo is a compensating exact Host proposal with the prior field state',()=>{
 const before=fixture(),draft=request(before,'set component alpha radius to 12px');
 assert.equal(draft.outcome,'candidate');
 const committed={surfaceId:before.surfaceId,parentRevision:4,committedRevision:5};
 const live={...draft.preview.surface,revision:5};
 const undo=buildUndoProposal({original:draft,before,committed,live});
 assert.ok(undo);assert.equal(undo.proposal.baseRevision,5);assert.equal(undo.proposal.operations[0].presentation,null);
 assert.deepEqual(undo.preview.surface,{...before,revision:5});
 assert.equal(buildUndoProposal({original:draft,before,committed,live:{...live,revision:6}}),null);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
