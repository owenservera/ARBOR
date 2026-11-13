// Semantic UI style and behavior configuration compiler. No renderer writes.
import {getEngineCapability,inspectUiEngineApplicability,validateEngineSetting} from './registry.mjs';
import {plain,inertData} from './validators.mjs';
export const UI_CONFIG_PROPOSAL_SCHEMA='vivim.ui-config-proposal/1';
const TARGET_ID=/^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const MAX_SETTINGS=48;
export function compileUiConfiguration({component,sourceSchema,baseRevision,changes}={}){
  const reject=(code,detail)=>({schema:UI_CONFIG_PROPOSAL_SCHEMA,outcome:'refused',code,
    ...(detail?{detail}:{}),authorized:false,applied:false,persisted:false});
  if(!plain(component)||typeof component.id!=='string'||!TARGET_ID.test(component.id)||
    !Number.isSafeInteger(baseRevision)||baseRevision<0||
    !Array.isArray(changes)||changes.length===0||changes.length>MAX_SETTINGS||
    !inertData(changes,2048))return reject('INVALID_CONFIG_REQUEST');
  const seen=new Set(),edits=[];
  for(const item of changes){
    if(!plain(item)||Object.keys(item).some(k=>!['capabilityId','value'].includes(k)))
      return reject('INVALID_CHANGE');
    if(typeof item.capabilityId!=='string'||seen.has(item.capabilityId))return reject('DUPLICATE_OR_INVALID_CAPABILITY');
    seen.add(item.capabilityId);
    const capability=getEngineCapability(item.capabilityId);
    if(!capability)return reject('UNKNOWN_CAPABILITY');
    const applicable=inspectUiEngineApplicability({component,engineId:capability.id,sourceSchema});
    if(!applicable.applicable)return reject('SEMANTICALLY_INAPPLICABLE',capability.id);
    const checked=validateEngineSetting(item);
    if(checked.outcome!=='valid')return reject(checked.code,capability.id);
    edits.push({engineId:capability.engineId,capabilityId:capability.id,value:checked.value,
      semanticTarget:component.id,kind:'typed-config'});
  }
  return {schema:UI_CONFIG_PROPOSAL_SCHEMA,outcome:'candidate',componentId:component.id,
    baseRevision,sourceSchema:sourceSchema??null,changes:edits,
    authorization:'required-from-Host',authorized:false,applied:false,persisted:false,
    rendererStatus:'NO_ADAPTER_INSTALLED',effect:'none',schemaVersion:1};
}
