import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENGINE_FAMILIES,ENGINE_CAPABILITIES,ENGINE_COUNTS,listEngineFamilies,
  listEngineCapabilities,getEngineFamily,getEngineCapability,
  inspectUiEngineApplicability,validateEngineSetting,inspectEngineExtension,
  validateUiValue,compileUiConfiguration
} from '../src/index.mjs';
import {getUiComponent} from '../../../apps/mobile-relay/vec/ui-taxonomy/registry.mjs';

const cardKind=getUiComponent('vivim.ui.foundation.surface.card@1');
const card=()=>({...cardKind,id:'researchCard',implementations:[]});
test('exactly 37 engine families and 461 uniquely versioned capabilities',()=>{
  assert.equal(ENGINE_COUNTS.families,37);
  assert.equal(ENGINE_COUNTS.capabilities,461);
  assert.equal(new Set(ENGINE_FAMILIES.map(x=>x.id)).size,37);
  assert.equal(new Set(ENGINE_CAPABILITIES.map(x=>x.id)).size,461);
  for(const c of ENGINE_CAPABILITIES){
    assert.match(c.id,/^vivim\.ui-engine\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*@1$/);
    assert.equal(c.effect,'none');
    assert.deepEqual(c.rendererBindings,[]);
    assert.equal(c.availability,'DESCRIBED_NOT_INSTALLED');
    assert.ok(getEngineFamily(c.engineId));
    assert.strictEqual(getEngineCapability(c.id).id,c.id);
  }
});
test('catalog discovery is bounded and does not claim runtime support',()=>{
  assert.equal(listEngineFamilies().length,37);
  assert.equal(listEngineCapabilities({limit:500}).length,461);
  assert.equal(listEngineCapabilities({domain:'color'}).length>10,true);
  assert.equal(listEngineCapabilities({limit:2000}).length,0);
  assert.equal(getEngineCapability('vivim.ui-engine.does-not-exist@1'),null);
});
test('one component can ask whether the color and border engines semantically apply',()=>{
  const c=card();
  for(const id of ['vivim.ui-engine.color.background@1','vivim.ui-engine.border.width@1']){
    const out=inspectUiEngineApplicability({component:c,engineId:id,sourceSchema:'vivim.ui-surface/1'});
    assert.equal(out.applicable,true);
    assert.equal(out.installed,false);
    assert.equal(out.authorized,false);
    assert.equal(out.implementation,'MISSING_RENDERER_ADAPTER');
  }
});
test('unmatched component and engine cannot pretend applicability',()=>{
  assert.equal(inspectUiEngineApplicability({component:null,engineId:'vivim.ui-engine.color.background@1'}).applicable,false);
  assert.equal(inspectUiEngineApplicability({component:card(),engineId:'fake'}).outcome,'unknown_engine');
  assert.equal(inspectUiEngineApplicability({component:card(),engineId:'vivim.ui-engine.spatial.position@1'}).applicable,false);
});
test('Color Engine accepts typed hex and structured modern color, rejects CSS injection',()=>{
  assert.equal(validateUiValue('color','#A0c0EE').value,'#a0c0ee');
  assert.equal(validateUiValue('color',{colorSpace:'oklch',components:[.65,.20,255]}).ok,true);
  assert.equal(validateUiValue('color',{colorSpace:'display-p3',components:[.2,.5,.1],alpha:.4}).ok,true);
  for(const s of ['red','rgb(1,1,1)','var(--x)','url(https://bad.example/x)', '#111111;position:fixed'])
    assert.equal(validateUiValue('color',s).ok,false);
});
test('numeric, dimension, vector, range and gradient are strongly bounded',()=>{
  assert.equal(validateUiValue('length',{value:12,unit:'px'}).ok,true);
  assert.equal(validateUiValue('length',{value:12,unit:'expression(alert(1))'}).ok,false);
  assert.equal(validateUiValue('duration',1000).ok,true);
  assert.equal(validateUiValue('duration',-1).ok,false);
  assert.equal(validateUiValue('vector3',{x:1,y:2,z:3}).ok,true);
  assert.equal(validateUiValue('vector3',{x:1,y:2,z:Infinity}).ok,false);
  assert.equal(validateUiValue('range',{min:0,max:100,value:20,step:5}).ok,true);
  assert.equal(validateUiValue('range',{min:20,max:10,value:15}).ok,false);
  assert.equal(validateUiValue('gradient',{kind:'linear',angle:30,stops:[
    {at:0,color:'#000000'},{at:1,color:'#ffffff'}]}).ok,true);
  assert.equal(validateUiValue('gradient',{kind:'linear',stops:[
    {at:1,color:'#000000'},{at:0,color:'#ffffff'}]}).ok,false);
});
test('unsafe objects, accessors and code-bearing values reject rather than execute',()=>{
  const malicious=Object.defineProperty({},'value',{get(){throw new Error('DO NOT INVOKE');}});
  assert.equal(validateUiValue('map',malicious).ok,false);
  const cyclic={};cyclic.self=cyclic;
  assert.equal(validateUiValue('map',cyclic).ok,false);
  assert.equal(validateUiValue('map',{__proto__:{}}).ok,false); // JS literal changes object prototype; fail closed
  assert.equal(validateUiValue('map',Object.assign(Object.create(null),{'constructor':'danger'})).ok,false);
  assert.equal(validateUiValue('boolean','true').ok,false);
});
test('caller cannot inject new allowed enum values',()=>{
  const id='vivim.ui-engine.border.style@1';
  assert.equal(validateEngineSetting({capabilityId:id,value:'solid'}).outcome,'valid');
  assert.equal(validateEngineSetting({capabilityId:id,value:'run-code'}).outcome,'refused');
  assert.equal(validateEngineSetting({capabilityId:id,value:'run-code',choices:['run-code']}).outcome,'refused');
  const unknownChoices='vivim.ui-engine.assets.quality@1';
  assert.equal(validateEngineSetting({capabilityId:unknownChoices,value:'anything'}).outcome,'refused');
});
test('multi-engine configuration is atomic, inert and revision bound',()=>{
  const before=card();
  const out=compileUiConfiguration({component:before,baseRevision:7,sourceSchema:'vivim.ui-surface/1',
    changes:[
      {capabilityId:'vivim.ui-engine.color.background@1',value:'#124678'},
      {capabilityId:'vivim.ui-engine.border.width@1',value:{value:2,unit:'px'}},
      {capabilityId:'vivim.ui-engine.corners.radius@1',value:{value:12,unit:'px'}}
    ]});
  assert.equal(out.outcome,'candidate');
  assert.equal(out.baseRevision,7);
  assert.equal(out.authorized,false);
  assert.equal(out.applied,false);
  assert.equal(out.persisted,false);
  assert.equal(out.rendererStatus,'NO_ADAPTER_INSTALLED');
  assert.equal(out.changes.length,3);
  assert.deepEqual(before,card());
  assert.deepEqual(out,compileUiConfiguration({component:before,baseRevision:7,sourceSchema:'vivim.ui-surface/1',
    changes:[
      {capabilityId:'vivim.ui-engine.color.background@1',value:'#124678'},
      {capabilityId:'vivim.ui-engine.border.width@1',value:{value:2,unit:'px'}},
      {capabilityId:'vivim.ui-engine.corners.radius@1',value:{value:12,unit:'px'}}
    ]}));
});
test('invalid typed change means zero proposal, not partial mutation',()=>{
  const res=compileUiConfiguration({component:card(),baseRevision:1,
    changes:[{capabilityId:'vivim.ui-engine.color.background@1',value:'#123456'},
      {capabilityId:'vivim.ui-engine.border.width@1',value:'2px; url(javascript:1)'}]});
  assert.equal(res.outcome,'refused');
  assert.equal(Object.hasOwn(res,'changes'),false);
  assert.equal(compileUiConfiguration({component:card(),baseRevision:-1,changes:[{capabilityId:'vivim.ui-engine.color.background@1',value:'#123456'}]}).outcome,'refused');
  assert.equal(compileUiConfiguration({component:card(),baseRevision:1,changes:[{capabilityId:'vivim.ui-engine.color.background@1',value:'#123456',choices:['anything']}]}).outcome,'refused');
});
test('unreviewed engine contributions remain inert',()=>{
  const valid={schema:'vivim.ui-engine-extension/1',domain:'color',name:'extra-gradient',
    type:'gradient',description:'A future gradient',dependencies:[],version:1};
  const out=inspectEngineExtension(valid);
  assert.equal(out.outcome,'candidate');
  assert.equal(out.installed,false);
  assert.equal(out.authorized,false);
  assert.equal(getEngineCapability(out.identity),null);
  assert.equal(inspectEngineExtension({...valid,name:'background'}).outcome,'refused');
  assert.equal(inspectEngineExtension({...valid,code:'eval(1)'}).outcome,'refused');
});
