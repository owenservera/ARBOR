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
