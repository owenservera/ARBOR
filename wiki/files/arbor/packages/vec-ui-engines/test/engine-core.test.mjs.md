# File: packages/vec-ui-engines/test/engine-core.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/test/engine-core.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8662 B |
| Lines | 143 |
| Hash | 4362d717ca0e |
| Test | yes |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| cardKind | const | 11 | no | const cardKind=getUiComponent(&#39;vivim.ui.foundation.surface.card@1&#39;); |
| card | function | 12 | no | const card=()=&gt;({...cardKind,id:&#39;researchCard&#39;,implementations:[]}); |
| c | const | 35 | no | const c=card(); |
| out | const | 37 | no | const out=inspectUiEngineApplicability({component:c,engineId:id,sourceSchema:&#39;vivim.ui-surface/1&#39;}); |
| malicious | const | 71 | no | const malicious=Object.defineProperty({},&#39;value&#39;,{get(){throw new Error(&#39;DO NOT INVOKE&#39;);}}); |
| cyclic | const | 73 | no | const cyclic={};cyclic.self=cyclic; |
| id | const | 80 | no | const id=&#39;vivim.ui-engine.border.style@1&#39;; |
| unknownChoices | const | 84 | no | const unknownChoices=&#39;vivim.ui-engine.assets.quality@1&#39;; |
| before | const | 88 | no | const before=card(); |
| out | const | 89 | no | const out=compileUiConfiguration({component:before,baseRevision:7,sourceSchema:&#39;vivim.ui-surface/1&#39;, changes:[ {capabilityId:&#39;vivim.ui-engine.color.background@1&#39;,value:&#39;#124678&#39;}, {capabilityId:&#39;vivi… |
| res | const | 111 | no | const res=compileUiConfiguration({component:card(),baseRevision:1, changes:[{capabilityId:&#39;vivim.ui-engine.color.background@1&#39;,value:&#39;#123456&#39;}, {capabilityId:&#39;vivim.ui-engine.border.width@1&#39;,value:&#39;… |
| valid | const | 120 | no | const valid={schema:&#39;vivim.ui-engine-extension/1&#39;,domain:&#39;color&#39;,name:&#39;extra-gradient&#39;, |
| out | const | 122 | no | const out=inspectEngineExtension(valid); |
| c | const | 132 | no | const c=ENGINE_CAPABILITIES[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../src/index.mjs | import | 3 | [packages/vec-ui-engines/src/index.mjs](../src/index.mjs.md) |
| ../../../apps/mobile-relay/vec/ui-taxonomy/registry.mjs | import | 9 | [apps/mobile-relay/vec/ui-taxonomy/registry.mjs](../../../apps/mobile-relay/vec/ui-taxonomy/registry.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 144 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
