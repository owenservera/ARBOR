import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_THEME,TYPES,CATALOG_VERSION} from '../generative-ui/catalog.mjs';
import {composeDesignContext,DESIGN_CONTEXT_SCHEMA} from '../generative-ui/design-composer.mjs';

const tree=(extra=[])=>({id:'root',type:'stack',props:{direction:'vertical',gap:'md'},children:[
  {id:'projects',type:'card',props:{title:'Projects',description:'Selected work stays local'},children:[]},
  {id:'talk',type:'text',props:{value:'Talk stays protected'},children:[]},
  ...extra]});
const surface=(over={})=>({schema:'vivim.ui-surface/1',surfaceId:'my-space',revision:12,catalogVersion:1,
  theme:DEFAULT_THEME,tree:tree(),...over});
const base=(over={})=>({surface:surface(),selectedComponentIds:['projects'],baseRevision:12,
  userRequest:'Make my project area more visual',constraints:['Preserve Talk'],sessionId:'design-local-1',taskId:'change-42',...over});

test('valid context composes every documented field',()=>{
  const s=surface();
  const ctx=composeDesignContext(base({surface:s}));
  assert.equal(ctx.schema,DESIGN_CONTEXT_SCHEMA);
  assert.equal(ctx.schema,'vivim.design-context/1');
  assert.equal(ctx.sessionId,'design-local-1');
  assert.equal(ctx.taskId,'change-42');
  assert.equal(ctx.surfaceId,'my-space');
  assert.equal(ctx.baseRevision,12);
  assert.equal(ctx.baseRevision,s.revision);
  assert.deepEqual(ctx.selectedComponentIds,['projects']);
  assert.equal(ctx.deviceClass,'phone');
  assert.equal(ctx.rendererCatalogVersion,CATALOG_VERSION);
  assert.deepEqual(ctx.allowedComponents,[...TYPES]);
  assert.deepEqual(ctx.constraints,['Preserve Talk']);
  assert.equal(ctx.userRequest,'Make my project area more visual');
  assert.deepEqual(Object.keys(ctx),['schema','sessionId','taskId','surfaceId','baseRevision',
    'selectedComponentIds','deviceClass','rendererCatalogVersion','allowedComponents',
    'constraints','userRequest','contextSummary']);
});

test('contextSummary is presentation scope with selected labels only',()=>{
  const ctx=composeDesignContext(base({selectedComponentIds:['projects','talk'],surfaceId:'my-space'}));
  assert.equal(ctx.contextSummary.scope,'presentation');
  assert.deepEqual(ctx.contextSummary.items.map(i=>[i.componentId,i.type,i.label]),
    [['projects','card','Projects'],['talk','text','Talk stays protected']]);
  assert.deepEqual(ctx.contextSummary.omitted,['private-memory']);
  // No description, no children tree, no theme escapes into the outbound prompt.
  const wire=JSON.stringify(ctx);
  assert.equal(wire.includes('Selected work stays local'),false);
  assert.equal(wire.includes('"tree"'),false);
  assert.equal(wire.includes('"theme"'),false);
});

test('stale baseRevision is rejected (compare-and-swap)',()=>{
  for(const stale of [11,13]){
    assert.throws(()=>composeDesignContext(base({baseRevision:stale})),/UI_REJECTED/);
    assert.throws(()=>composeDesignContext(base({baseRevision:stale})),e=>e.code==='UI_REJECTED');
  }
  assert.throws(()=>composeDesignContext(base({baseRevision:undefined})),/UI_REJECTED/);
});

test('selected component id must exist in the surface',()=>{
  assert.throws(()=>composeDesignContext(base({selectedComponentIds:['ghost']})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({selectedComponentIds:['../root']})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({selectedComponentIds:['root','ghost']})),/UI_REJECTED/);
});

test('disallowed component in allowedComponents is rejected',()=>{
  assert.throws(()=>composeDesignContext(base({allowedComponents:['card','html']})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({allowedComponents:['script']})),/UI_REJECTED/);
  const ok=composeDesignContext(base({allowedComponents:['card','text']}));
  assert.deepEqual(ok.allowedComponents,['card','text']);
});

test('private memory and sensitive refs are omitted, never forwarded',()=>{
  const refs=[{id:'clm-private',sensitive:true}];
  const s=surface({tree:tree([{id:'sourced',type:'card',props:{title:'Health',description:'Secret detail',sourceRef:'clm-private'},children:[]}])});
  const ctx=composeDesignContext(base({surface:s,approvedRefs:refs,selectedComponentIds:['sourced']}));
  assert.deepEqual(ctx.contextSummary.omitted,['private-memory','ref:clm-private']);
  const wire=JSON.stringify(ctx);
  assert.equal(wire.includes('Secret detail'),false);
  assert.equal(wire.includes('clm-private'),true,'ref is named, its content never inlined');
  assert.equal(ctx.contextSummary.items.length,1);
  // An explicitly withheld ref is still named, never inlined.
  const withheld=composeDesignContext(base({surface:surface(),approvedRefs:[{id:'clm-other',approved:false}]}));
  assert.deepEqual(withheld.contextSummary.omitted,['private-memory','ref:clm-other']);
  // Unapproved evidence cannot enter at all.
  const unapproved=surface({tree:tree([{id:'leak',type:'card',props:{title:'Leak',sourceRef:'clm-secret'},children:[]}])});
  assert.throws(()=>composeDesignContext(base({surface:unapproved,selectedComponentIds:['leak']})),/UI_REJECTED/);
});

test('userRequest length cap and emptiness enforced',()=>{
  assert.throws(()=>composeDesignContext(base({userRequest:'x'.repeat(401)})),/UI_REJECTED/);
  assert.equal(composeDesignContext(base({userRequest:'x'.repeat(400)})).userRequest.length,400);
  assert.throws(()=>composeDesignContext(base({userRequest:''})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({userRequest:'   '})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({userRequest:42})),/UI_REJECTED/);
  assert.equal(composeDesignContext(base({userRequest:'  taller cards  '})).userRequest,'taller cards');
});

test('control characters in userRequest rejected, URLs tolerated as intent text',()=>{
  assert.throws(()=>composeDesignContext(base({userRequest:'bad\u0000text'})),/UI_REJECTED/);
  assert.equal(composeDesignContext(base({userRequest:'use https://example.test cards'})).userRequest,
    'use https://example.test cards');
});

test('surfaceId, deviceClass and catalog version agree with the surface',()=>{
  assert.throws(()=>composeDesignContext(base({surfaceId:'other-space'})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({deviceClass:'toaster'})),/UI_REJECTED/);
  assert.equal(composeDesignContext(base({deviceClass:'mobile'})).deviceClass,'mobile');
  assert.throws(()=>composeDesignContext(base({rendererCatalogVersion:2})),/UI_REJECTED/);
});

test('constraints are bounded, non-empty and deduplicated',()=>{
  const ctx=composeDesignContext(base({constraints:['Preserve Talk','Preserve Talk','No code execution']}));
  assert.deepEqual(ctx.constraints,['Preserve Talk','No code execution']);
  assert.throws(()=>composeDesignContext(base({constraints:['ok','']})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({constraints:['x'.repeat(161)]})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({constraints:new Array(13).fill('x')})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({constraints:'Preserve Talk'})),/UI_REJECTED/);
});

test('composition is immutable and never mutates the input surface',()=>{
  const s=surface();
  const before=JSON.stringify(s);
  const ctx=composeDesignContext(base({surface:s}));
  assert.equal(JSON.stringify(s),before);
  assert.equal(Object.isFrozen(ctx),true);
  assert.equal(Object.isFrozen(ctx.selectedComponentIds),true);
  assert.equal(Object.isFrozen(ctx.allowedComponents),true);
  assert.equal(Object.isFrozen(ctx.constraints),true);
  assert.equal(Object.isFrozen(ctx.contextSummary),true);
  assert.equal(Object.isFrozen(ctx.contextSummary.items),true);
  assert.equal(Object.isFrozen(ctx.contextSummary.items[0]),true);
  assert.equal(Object.isFrozen(ctx.contextSummary.omitted),true);
  assert.throws(()=>{ctx.baseRevision=1;},TypeError);
  assert.throws(()=>{ctx.contextSummary.items.push({componentId:'talk'});},TypeError);
  assert.throws(()=>{ctx.contextSummary.items[0].label='x';},TypeError);
});
