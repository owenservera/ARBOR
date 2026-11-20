# File: packages/vec-ui-engines/src/registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/src/registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6153 B |
| Lines | 88 |
| Hash | c14a4e9d674f |
| Test | no |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ENGINE_ID_SCHEMA | const | 5 | yes | export const ENGINE_ID_SCHEMA=&#39;vivim.ui-engine-registry/1&#39;; |
| groupById | const | 6 | no | const groupById=new Map(),capById=new Map(); |
| ENGINE_COUNTS | const | 16 | yes | export const ENGINE_COUNTS=Object.freeze({families:groupById.size,capabilities:capById.size}); |
| listEngineFamilies | function | 17 | yes | export function listEngineFamilies(){return [...groupById.values()];} |
| listEngineCapabilities | function | 18 | yes | export function listEngineCapabilities({domain,type,search,limit=500}={}){ |
| getEngineFamily | function | 28 | yes | export function getEngineFamily(id){return typeof id===&#39;string&#39;?groupById.get(id)??null:null;} |
| getEngineCapability | function | 29 | yes | export function getEngineCapability(id){return typeof id===&#39;string&#39;?capById.get(id)??null:null;} |
| INPUT_FACETS | const | 30 | no | const INPUT_FACETS=new Set([&#39;input&#39;,&#39;interaction&#39;,&#39;gestures&#39;,&#39;focus&#39;,&#39;forms&#39;,&#39;workflow&#39;]); |
| DATA_FACETS | const | 31 | no | const DATA_FACETS=new Set([&#39;charts&#39;,&#39;data&#39;,&#39;media&#39;,&#39;assets&#39;]); |
| TEXT_FACETS | const | 32 | no | const TEXT_FACETS=new Set([&#39;typography&#39;,&#39;text&#39;,&#39;localization&#39;]); |
| LAYOUT_FACETS | const | 33 | no | const LAYOUT_FACETS=new Set([&#39;layout&#39;,&#39;spacing&#39;,&#39;sizing&#39;,&#39;position&#39;,&#39;responsive&#39;,&#39;scroll&#39;,&#39;composition&#39;]); |
| familyFor | function | 34 | no | function familyFor(component){ |
| inspectUiEngineApplicability | function | 39 | yes | export function inspectUiEngineApplicability({component,engineId,sourceSchema}={}){ |
| capability | const | 40 | no | const capability=getEngineCapability(engineId); |
| traits | const | 43 | no | const traits=component.classification.traits; |
| interactive | const | 44 | no | const interactive=traits.includes(&#39;interactive&#39;)\|\|traits.includes(&#39;focusable&#39;)\|\|component.domain===&#39;input&#39;; |
| text | const | 45 | no | const text=traits.includes(&#39;text&#39;)\|\|component.classification.role===&#39;text&#39;\|\|component.domain===&#39;foundation&#39;; |
| hasData | const | 46 | no | const hasData=traits.includes(&#39;bindable&#39;)\|\|[&#39;data&#39;,&#39;application&#39;,&#39;media&#39;].includes(component.domain); |
| container | const | 47 | no | const container=traits.includes(&#39;container&#39;)\|\|component.classification.composition===&#39;container&#39;; |
| applicable | variable | 48 | no | let applicable=true; |
| source | const | 55 | no | const source=typeof sourceSchema===&#39;string&#39;&amp;&amp;Array.isArray(component.implementations)? |
| validateEngineSetting | function | 61 | yes | export function validateEngineSetting({capabilityId,value}={}){ |
| capability | const | 62 | no | const capability=getEngineCapability(capabilityId); |
| result | const | 64 | no | const result=validateUiValue(capability.valueSchema.type,value,{choices:ENGINE_ENUM_CHOICES[capability.id]}); |
| inspectEngineExtension | function | 71 | yes | export function inspectEngineExtension(input){ |
| fail | function | 72 | no | const fail=code=&gt;({outcome:&#39;refused&#39;,code,installed:false,authorized:false}); |
| allowed | const | 74 | no | const allowed=[&#39;schema&#39;,&#39;domain&#39;,&#39;name&#39;,&#39;type&#39;,&#39;description&#39;,&#39;dependencies&#39;,&#39;version&#39;]; |
| ENGINE_CATALOG_SCHEMA | export | 88 | yes | export {ENGINE_CATALOG_SCHEMA} |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | import | 2 | [packages/vec-ui-engines/src/catalog.mjs](./catalog.mjs.md) |
| ./validators.mjs | import | 3 | [packages/vec-ui-engines/src/validators.mjs](./validators.mjs.md) |
| ./enum-choices.mjs | import | 4 | [packages/vec-ui-engines/src/enum-choices.mjs](./enum-choices.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/vec-ui-engines/src/compiler.mjs](./compiler.mjs.md) | ./registry.mjs |
| [packages/vec-ui-engines/src/index.mjs](./index.mjs.md) | ./registry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure cross-runtime engine lookup, semantic applicability, and type validation.
import {ENGINE_CATALOG_SCHEMA,ENGINE_FAMILIES,ENGINE_CAPABILITIES} from './catalog.mjs';
import {validateUiValue,inertData,plain} from './validators.mjs';
import {ENGINE_ENUM_CHOICES} from './enum-choices.mjs';
export const ENGINE_ID_SCHEMA='vivim.ui-engine-registry/1';
const groupById=new Map(),capById=new Map();
for(const g of ENGINE_FAMILIES){
  if(groupById.has(g.id))throw new Error('ENGINE_DUPLICATE_GROUP');
  groupById.set(g.id,Object.freeze({...g}));
}
for(const c of ENGINE_CAPABILITIES){
  if(capById.has(c.id)||!groupById.has(c.engineId)||c.effect!=='none')
    throw new Error('ENGINE_CATALOG_INVALID');
  capById.set(c.id,Object.freeze({...c,valueSchema:Object.freeze({...c.valueSchema})}));
}
export const ENGINE_COUNTS=Object.freeze({families:groupById.size,capabilities:capById.size});
export function listEngineFamilies(){return [...groupById.values()];}
export function listEngineCapabilities({domain,type,search,limit=500}={}){
  if(!Number.isInteger(limit)||limit<1||limit>500)return [];
  if(domain!==undefined&&(!/^[a-z-]+$/.test(domain)||domain.length>60))return [];
  if(type!==undefined&&typeof type!=='string')return [];
  if(search!==undefined&&(typeof search!=='string'||search.length>120))return [];
  return [...capById.values()].filter(c=>(domain===undefined||c.domain===domain)&&
    (type===undefined||c.valueSchema.type===type)&&
    (search===undefined||c.name.includes(search.toLowerCase())||c.id.includes(search.toLowerCase())))
    .slice(0,limit);
}
export function getEngineFamily(id){return typeof id==='string'?groupById.get(id)??null:null;}
export function getEngineCapability(id){return typeof id==='string'?capById.get(id)??null:null;}
const INPUT_FACETS=new Set(['input','interaction','gestures','focus','forms','workflow']);
const DATA_FACETS=new Set(['charts','data','media','assets']);
const TEXT_FACETS=new Set(['typography','text','localization']);
const LAYOUT_FACETS=new Set(['layout','spacing','sizing','position','responsive','scroll','composition']);
function familyFor(component){
  if(!plain(component)||typeof component.id!=='string'||!plain(component.classification)||
    !Array.isArray(component.classification.traits)||typeof component.domain!=='string')return null;
  return component;
}
export function inspectUiEngineApplicability({component,engineId,sourceSchema}={}){
  const capability=getEngineCapability(engineId);
  if(!capability)return {outcome:'unknown_engine',applicable:false,installed:false,authorized:false};
  if(!familyFor(component))return {outcome:'unknown_component',applicable:false,installed:false,authorized:false};
  const traits=component.classification.traits;
  const interactive=traits.includes('interactive')||traits.includes('focusable')||component.domain==='input';
  const text=traits.includes('text')||component.classification.role==='text'||component.domain==='foundation';
  const hasData=traits.includes('bindable')||['data','application','media'].includes(component.domain);
  const container=traits.includes('container')||component.classification.composition==='container';
  let applicable=true;
  if(INPUT_FACETS.has(capability.domain))applicable=interactive||component.domain==='application';
  else if(DATA_FACETS.has(capability.domain))applicable=hasData;
  else if(TEXT_FACETS.has(capability.domain))applicable=text;
  else if(LAYOUT_FACETS.has(capability.domain))applicable=container||component.domain==='foundation';
  else if(capability.domain==='navigation')applicable=component.domain==='navigation';
  else if(capability.domain==='spatial')applicable=component.domain==='spatial';
  const source=typeof sourceSchema==='string'&&Array.isArray(component.implementations)?
    component.implementations.some(x=>x.schema===sourceSchema):false;
  return {outcome:applicable?'semantically_applicable':'not_applicable',
    applicable,sourceMapped:source,installed:false,authorized:false,
    implementation:'MISSING_RENDERER_ADAPTER',capabilityId:capability.id,componentId:component.id};
}
export function validateEngineSetting({capabilityId,value}={}){
  const capability=getEngineCapability(capabilityId);
  if(!capability)return {outcome:'refused',code:'UNKNOWN_ENGINE_CAPABILITY'};
  const result=validateUiValue(capability.valueSchema.type,value,{choices:ENGINE_ENUM_CHOICES[capability.id]});
  if(!result.ok)return {outcome:'refused',code:result.code,capabilityId};
  return {outcome:'valid',capabilityId,value:result.value,
    installed:false,authorization:'none'};
}
/** Candidate extension manifests MUST be reviewed and compiled into new source.
 * Runtime user data cannot mutate catalog or provide code. */
export function inspectEngineExtension(input){
  const fail=code=>({outcome:'refused',code,installed:false,authorized:false});
  if(!plain(input)||!inertData(input,256))return fail('NON_INERT_ENGINE_PACKAGE');
  const allowed=['schema','domain','name','type','description','dependencies','version'];
  if(Object.keys(input).some(k=>!allowed.includes(k))||input.schema!=='vivim.ui-engine-extension/1')return fail('INVALID_ENGINE_PACKAGE');
  if(typeof input.domain!=='string'||!groupById.has('vivim.ui-engine.'+input.domain+'@1')||
    typeof input.name!=='string'||!/^[a-z][a-z0-9-]{0,79}$/.test(input.name)||
    typeof input.type!=='string'||input.type.length>36||
    input.version!==1)return fail('UNRECOGNIZED_DOMAIN_OR_TYPE');
  if(capById.has('vivim.ui-engine.'+input.domain+'.'+input.name+'@1'))return fail('IDENTITY_COLLISION');
```

_First 80 of 89 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
