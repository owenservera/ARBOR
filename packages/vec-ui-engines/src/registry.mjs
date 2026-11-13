// Pure cross-runtime engine lookup, semantic applicability, and type validation.
import {ENGINE_CATALOG_SCHEMA,ENGINE_FAMILIES,ENGINE_CAPABILITIES} from './catalog.mjs';
import {validateUiValue,inertData,plain} from './validators.mjs';
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
export function validateEngineSetting({capabilityId,value,choices}={}){
  const capability=getEngineCapability(capabilityId);
  if(!capability)return {outcome:'refused',code:'UNKNOWN_ENGINE_CAPABILITY'};
  const result=validateUiValue(capability.valueSchema.type,value,{choices});
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
  if(typeof input.description!=='string'||input.description.length>200||
    !Array.isArray(input.dependencies)||input.dependencies.length>12||
    input.dependencies.some(x=>!capById.has(x)))return fail('INVALID_DEPENDENCIES');
  return {outcome:'candidate',installed:false,authorized:false,
    identity:'vivim.ui-engine.'+input.domain+'.'+input.name+'@1',
    needs:['owner-review','schema-review','implementation','independent-tests','renderer-compatibility','Host-policy']};
}
export {ENGINE_CATALOG_SCHEMA};
