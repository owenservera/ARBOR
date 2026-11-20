# File: apps/mobile-relay/test/workspace-template-wiring.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/workspace-template-wiring.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3291 B |
| Lines | 37 |
| Hash | 4d4b8f7040e0 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| base | const | 7 | no | const base=createSurface();const library=listWorkspaceTemplates();assert.equal(library.length,12); |
| r | const | 9 | no | const r=resolveBuildRequest({request:&#39;instantiate template &#39;+t.templateId+&#39; at revision 0&#39;,surface:base}); |
| body | const | 14 | no | const body=r.preview.surface.tree.children[0].children[1]; |
| base | const | 20 | no | const base=createSurface(); |
| r | const | 23 | no | const r=resolveBuildRequest({request:&#39;instantiate template FW.TASKS.NEXT&#39;,surface:base}); |
| changed | const | 24 | no | const changed=structuredClone(r.preview.surface);changed.tree.children[0].children[1].props.items=[{label:&#39;Fake task&#39;}]; |
| base | const | 29 | no | const base=createSurface();base.revision=7;base.tree.children.push({id:&#39;notes&#39;,type:&#39;collection&#39;,props:{title:&#39;Notes&#39;,items:[]},children:[]}); |
| draft | const | 30 | no | const draft=resolveBuildRequest({request:&#39;set component notes at revision 7 data-source to personal.recent-notes&#39;,surface:base}); |
| remove | const | 34 | no | const remove=resolveBuildRequest({request:&#39;set component notes at revision 7 data-source to none&#39;,surface:draft.preview.surface});assert.equal(remove.outcome,&#39;candidate&#39;);assert.equal(remove.preview.… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../build-composer.mjs | import | 4 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |
| ../generative-ui/renderer.mjs | import | 5 | [apps/mobile-relay/generative-ui/renderer.mjs](../generative-ui/renderer.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface,validateSurface} from '../generative-ui/catalog.mjs';
import {resolveBuildRequest,listWorkspaceTemplates} from '../build-composer.mjs';
import {planTierflowSurface} from '../generative-ui/renderer.mjs';
test('every incumbent template compiles into an inert Host proposal and renderable tree',()=>{
 const base=createSurface();const library=listWorkspaceTemplates();assert.equal(library.length,12);
 for(const t of library){
   const r=resolveBuildRequest({request:'instantiate template '+t.templateId+' at revision 0',surface:base});
   assert.equal(r.outcome,'candidate',t.templateId+': '+r.code);
   assert.equal(r.preview.persisted,false);assert.equal(base.tree.children.length,0);
   assert.equal(r.proposal.operations.length,1);
   assert.equal(planTierflowSurface(r.preview.surface).plan.status,'ok');
   const body=r.preview.surface.tree.children[0].children[1];
   assert.equal(body.liveBinding??null,t.liveBinding);
   if(t.liveBinding)assert.deepEqual(body.props.items,[]);
 }
});
test('unknown and stale templates reject; bindings cannot contain static injected rows',()=>{
 const base=createSurface();
 for(const text of ['instantiate template FW.UNKNOWN','instantiate template FW.TASKS.NEXT at revision 1'])
  assert.equal(resolveBuildRequest({request:text,surface:base}).outcome,'refused');
 const r=resolveBuildRequest({request:'instantiate template FW.TASKS.NEXT',surface:base});
 const changed=structuredClone(r.preview.surface);changed.tree.children[0].children[1].props.items=[{label:'Fake task'}];
 assert.throws(()=>validateSurface(changed),/live UI binding/);
});

test('live sources bind and unbind an existing empty collection at an exact revision, not via copied rows',()=>{
 const base=createSurface();base.revision=7;base.tree.children.push({id:'notes',type:'collection',props:{title:'Notes',items:[]},children:[]});
 const draft=resolveBuildRequest({request:'set component notes at revision 7 data-source to personal.recent-notes',surface:base});
 assert.equal(draft.outcome,'candidate');assert.equal(draft.preview.persisted,false);assert.equal(draft.proposal.operations[0].type,'set-live-binding');
 assert.equal(draft.preview.surface.tree.children[0].liveBinding,'personal.recent-notes');assert.deepEqual(draft.preview.surface.tree.children[0].props.items,[]);
 assert.equal(base.tree.children[0].liveBinding,undefined);assert.equal(planTierflowSurface(draft.preview.surface).plan.status,'ok');
 const remove=resolveBuildRequest({request:'set component notes at revision 7 data-source to none',surface:draft.preview.surface});assert.equal(remove.outcome,'candidate');assert.equal(remove.preview.surface.tree.children[0].liveBinding,undefined);
 for(const request of ['set component notes at revision 6 data-source to personal.open-tasks','set component notes data-source to studio.recent-outcomes','set component notes data-source to arbitrary.url'])assert.equal(resolveBuildRequest({request,surface:base}).outcome,'refused');
 base.tree.children[0].props.items=[{label:'Existing content'}];assert.equal(resolveBuildRequest({request:'set component notes data-source to personal.recent-notes',surface:base}).outcome,'refused');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
