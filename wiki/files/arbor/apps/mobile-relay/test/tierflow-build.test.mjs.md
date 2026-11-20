# File: apps/mobile-relay/test/tierflow-build.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/tierflow-build.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7242 B |
| Lines | 110 |
| Hash | 6d7b8593ac30 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| mount | function | 8 | no | function mount(width) { |
| doc | const | 9 | no | const doc={defaultView:{innerWidth:width},createElement(tag){ |
| cardPreview | function | 15 | no | function cardPreview() { |
| surface | const | 16 | no | const surface=createSurface(); |
| proposal | const | 17 | no | const proposal={schema:&#39;vivim.ui-proposal/1&#39;,surfaceId:surface.surfaceId,baseRevision:0, |
| surface | const | 27 | no | const surface=cardPreview(); |
| narrow | const | 28 | no | const narrow=planTierflowSurface(surface,{viewportPx:390}); |
| wide | const | 29 | no | const wide=planTierflowSurface(surface,{viewportPx:1280}); |
| committed | const | 39 | no | const committed={...cardPreview(),revision:7}; |
| screen | const | 40 | no | const screen=mount(390); |
| container | const | 42 | no | const container=screen.children[0],grid=container.children[0].children[0]; |
| source | const | 53 | no | const source=cardPreview(); |
| screen | const | 56 | no | const screen=mount(390); |
| surface | const | 69 | no | const surface=createSurface(); |
| plan | const | 75 | no | const plan=planTierflowSurface(surface); |
| screen | const | 78 | no | const screen=mount(390);renderSurface(screen,surface,{tierflow:true}); |
| out | const | 87 | no | const out=compileVecUiRequest({text:&#39;Add a &#39;+type+&#39; called Example&#39;,surface:createSurface()}); |
| plan | const | 89 | no | const plan=planTierflowSurface(out.preview.surface); |
| surface | const | 95 | no | const surface=createSurface(); |
| mapped | const | 98 | no | const mapped=planTierflowSurface(surface,{approvedRefs:[&#39;source.one&#39;]}); |
| s | const | 106 | no | const s=createSurface();s.tree.children.push({id:&#39;select&#39;,type:&#39;button&#39;,props:{label:&#39;Select&#39;,intent:&#39;select-component&#39;,targetId:&#39;root&#39;},children:[]}); |
| screen | const | 107 | no | const screen=mount(390),seen=[];const orig=screen.ownerDocument.createElement;screen.ownerDocument.createElement=function(tag){const node=orig(tag);node.addEventListener=(name,fn)=&gt;{node[name]=fn;};r… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/compiler.mjs | import | 4 | [apps/mobile-relay/generative-ui/compiler.mjs](../generative-ui/compiler.mjs.md) |
| ../generative-ui/renderer.mjs | import | 5 | [apps/mobile-relay/generative-ui/renderer.mjs](../generative-ui/renderer.mjs.md) |
| ../vec/ui-adapter.mjs | import | 6 | [apps/mobile-relay/vec/ui-adapter.mjs](../vec/ui-adapter.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {planTierflowSurface,renderSurface} from '../generative-ui/renderer.mjs';
import {compileVecUiRequest} from '../vec/ui-adapter.mjs';

function mount(width) {
  const doc={defaultView:{innerWidth:width},createElement(tag){
    return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},
      appendChild(child){this.children.push(child);},addEventListener(){throw Error('unexpected interactive handler');}};
  }};
  return {ownerDocument:doc,children:[],replaceChildren(...children){this.children=children;}};
}
function cardPreview() {
  const surface=createSurface();
  const proposal={schema:'vivim.ui-proposal/1',surfaceId:surface.surfaceId,baseRevision:0,
    operations:[{opId:'insert.1',type:'insert',parentId:'root',component:{
      id:'layout',type:'grid',props:{columns:3,gap:'md'},children:[
        {id:'card.one',type:'card',props:{title:'My card',description:'Plain description'},children:[]},
        {id:'heading.one',type:'text',props:{value:'Heading',variant:'heading'},children:[]}
      ]
    }}],explanation:'Add a layout',assumptions:[],unknowns:[]};
  return compileUiProposal({surface,proposal,audience:'phone',approvedRefs:[]}).surface;
}
test('existing proposal compiler feeds actual TierFlow document, identity and responsive plan',()=>{
  const surface=cardPreview();
  const narrow=planTierflowSurface(surface,{viewportPx:390});
  const wide=planTierflowSurface(surface,{viewportPx:1280});
  assert.equal(narrow.plan.status,'ok');
  assert.equal(narrow.document.revision,surface.revision);
  assert.equal(narrow.document.rootId,'root');
  assert.equal(narrow.identities.get('card.one'),'vivim.ui.foundation.surface.card@1');
  assert.equal(narrow.identities.get('heading.one'),'vivim.ui.foundation.typography.heading@1');
  assert.equal(narrow.plan.root.children[0].children[0].layout.columns,1);
  assert.equal(wide.plan.root.children[0].children[0].layout.columns,3);
});
test('existing renderer mounts the validated plan and retains Host theme, content and instance IDs',()=>{
  const committed={...cardPreview(),revision:7};
  const screen=mount(390);
  renderSurface(screen,committed,{tierflow:true});
  const container=screen.children[0],grid=container.children[0].children[0];
  assert.equal(container.attrs['data-tierflow-status'],'ok');
  assert.equal(container.attrs['data-tierflow-revision'],'7');
  assert.equal(container.style.backgroundColor,committed.theme.background);
  assert.equal(grid.style.gridTemplateColumns,'repeat(1,minmax(0,1fr))');
  assert.equal(grid.children[0].attrs['data-component-id'],'card.one');
  assert.equal(grid.children[0].children[0].textContent,'My card');
  assert.equal(grid.children[0].children[1].textContent,'Plain description');
  assert.equal(grid.children[1].tag,'h2');
});
test('private nodes are excluded; unsupported and invalid public documents refuse before mount',()=>{
  const source=cardPreview();
  source.tree.children.push({id:'private',type:'text',props:{value:'Private'},visibility:'pc-private',children:[]});
  assert.equal(planTierflowSurface(source).nodes.has('private'),false);
  const screen=mount(390);
  source.tree.children.push({id:'action',type:'button',props:{label:'Do it',intent:'preview-only'},children:[]});
  renderSurface(screen,source,{tierflow:true});
  assert.equal(screen.children[0].children[0].children.at(-1).disabled,true);
  screen.replaceChildren();
  source.tree.children.pop();
  source.tree.children.push({id:'bad',type:'text',props:{value:'<script>alert(1)</script>'},children:[]});
  assert.throws(()=>renderSurface(screen,source,{tierflow:true}),/UI_REJECTED/);
  assert.equal(screen.children.length,0);
});


test('structured source values and ordered TierFlow item plans paint together',()=>{
  const surface=createSurface();
  surface.tree.children.push(
    {id:'items',type:'collection',props:{title:'Collection',items:[{label:'A',detail:'Detail'}]},children:[]},
    {id:'timeline',type:'timeline',props:{title:'Sequence',items:[{label:'First'},{label:'Next'}]},children:[]},
    {id:'chart',type:'chart',props:{title:'Values',items:[{label:'Revenue',value:42}]},children:[]}
  );
  const plan=planTierflowSurface(surface);
  assert.equal(plan.plan.status,'ok');
  assert.equal(plan.identities.get('chart'),'vivim.ui.data.charts.chart@1');
  const screen=mount(390);renderSurface(screen,surface,{tierflow:true});
  const [items,timeline,chart]=screen.children[0].children[0].children;
  assert.equal(items.children[1].children[0].children[0].textContent,'Detail');
```

_First 80 of 111 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
