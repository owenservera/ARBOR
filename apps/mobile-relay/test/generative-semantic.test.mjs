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
test('audience projection drops unexpected metadata at every level',()=>{
  const base=projectBootstrapSemantics(input('F01',f01));
  const altered={...base,privateDebug:'never reach phone',
    objects:base.objects.map(o=>({...o,debugToken:'private-object'})),
    views:base.views.map(v=>({...v,internalNote:'private-view'})),
    edges:base.edges.map(e=>({...e,privateLink:'private-edge'}))};
  const before=JSON.stringify(altered);
  for(const audience of ['phone','pc']){
    const out=projectSemanticsForAudience(altered,{audience});
    const serialized=JSON.stringify(out);
    assert.doesNotMatch(serialized,/never reach phone|private-object|private-view|private-edge/);
    assert.deepEqual(out.objects.map(o=>o.objectRef),base.objects.map(o=>o.objectRef));
    assert.deepEqual(out.views.map(v=>v.componentId),base.views.map(v=>v.componentId));
    assert.deepEqual(out.edges,base.edges);
    assert.equal(out.effects,'none');
    assert.equal(out.persisted,false);
    assert.notEqual(out.views[0].objectRefs,altered.views[0].objectRefs,
      'no alias to source objectRefs');
  }
  assert.equal(JSON.stringify(altered),before,'projection never edits source data');
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
