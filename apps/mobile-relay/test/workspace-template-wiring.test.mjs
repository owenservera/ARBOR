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
