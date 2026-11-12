// GUI03: bounded, scoped design-context composer for Build design turns.
// Outbound vivim.design-context/1 is presentation scope only: selected structure,
// catalog constraints and owner intent. No memory content, credentials, cookies,
// session state, full component tree, network call or provider effect.
// Pure and browser-safe: imports only the closed catalog vocabulary.
import {CATALOG_VERSION,TYPES,validateSurface,id,str,int,en,keys,plain,invalid} from './catalog.mjs';

export const DESIGN_CONTEXT_SCHEMA='vivim.design-context/1';
export const DEVICE_CLASSES=Object.freeze(['phone','mobile','tablet','pc']);
export const MAX_USER_REQUEST=400;
export const MAX_CONSTRAINT=160;
export const MAX_CONSTRAINTS=12;
export const MAX_SELECTION=25;
export const MAX_APPROVED_REFS=64;
export const MAX_LABEL=80;
const OMITTED_PRIVATE='private-memory';
const REF_TAG='ref:';
// Only C0/C1 noise is refused here. A user request may legitimately contain a URL;
// it is owner-authored intent, not model-authored UI text.
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function deepFreeze(v) {
  if(v!==null&&typeof v==='object'){for(const k of Object.keys(v))deepFreeze(v[k]);Object.freeze(v);}
  return v;
}
function listOf(v,label,max) {
  if(!Array.isArray(v)||v.length>max)invalid(label+' must be a bounded array');
  return v;
}
// Approved references may be bare ids or explicit {id,sensitive,approved} records.
// Only approved ids unseal the surface; flagged sensitive refs are never forwarded.
function approvalOf(refs) {
  const ids=new Set(),sensitive=new Set(),withheld=new Set();
  for(const ref of listOf(refs,'approved references',MAX_APPROVED_REFS)){
    if(typeof ref==='string'){ids.add(id(ref));continue;}
    keys(ref,['id','sensitive','approved'],'approved reference');
    const rid=id(ref.id);
    if(ref.approved===false){withheld.add(rid);continue;}
    ids.add(rid);
    if(ref.sensitive===true)sensitive.add(rid);
  }
  return {ids,sensitive,withheld};
}
function userRequestText(v) {
  if(typeof v!=='string')invalid('user request must be a string');
  const text=v.trim();
  if(!text||text.length>MAX_USER_REQUEST)invalid('user request must be 1..'+MAX_USER_REQUEST+' characters');
  if(CONTROL.test(text))invalid('user request contains control characters');
  return text;
}
function allowedTypes(input) {
  const source=listOf(input,'allowed components',TYPES.length);
  if(!source.length)return Object.freeze([...TYPES]);
  const out=[];
  for(const type of source){
    if(!TYPES.includes(type))invalid('component type outside catalog');
    if(!out.includes(type))out.push(type);
  }
  return Object.freeze(out);
}
function boundedConstraints(input) {
  const out=[];
  for(const raw of listOf(input,'constraints',MAX_CONSTRAINTS)){
    const text=str(raw,MAX_CONSTRAINT);
    if(!out.includes(text))out.push(text);
  }
  return Object.freeze(out);
}
// Component ids and short display labels only. Descriptions, refs and content stay local.
function indexTree(node,index) {
  const props=node.props??{};
  const label=props.title??props.label??props.value;
  index.set(node.id,Object.freeze({componentId:node.id,type:node.type,
    label:typeof label==='string'?label.slice(0,MAX_LABEL):node.type}));
  for(const child of node.children)indexTree(child,index);
  return index;
}

export function composeDesignContext({
  surface, surfaceId, selectedComponentIds=[], baseRevision, userRequest,
  deviceClass='phone', rendererCatalogVersion=CATALOG_VERSION,
  allowedComponents=[], constraints=[], approvedRefs=[], sessionId, taskId
}={}) {
  const approval=approvalOf(approvedRefs);
  const validated=validateSurface(surface,{refs:approval.ids});
  const session=id(sessionId),task=id(taskId);
  const declared=surfaceId===undefined?validated.surfaceId:id(surfaceId);
  if(declared!==validated.surfaceId)invalid('surfaceId does not match surface');
  const revision=int(baseRevision,0,1e9);
  if(revision!==validated.revision)invalid('base revision does not match surface revision');
  const catalogVersion=int(rendererCatalogVersion,0,1e9);
  if(catalogVersion!==CATALOG_VERSION||catalogVersion!==validated.catalogVersion)invalid('renderer catalog version mismatch');
  const device=en(deviceClass,DEVICE_CLASSES);
  const allowed=allowedTypes(allowedComponents);
  const limits=boundedConstraints(constraints);
  const request=userRequestText(userRequest);
  const index=indexTree(validated.tree,new Map());
  const picked=[];
  for(const raw of listOf(selectedComponentIds,'selected components',MAX_SELECTION*4)){
    const cid=id(raw);
    if(!index.has(cid))invalid('selected component is not in the surface');
    if(!picked.includes(cid))picked.push(cid);
  }
  if(picked.length>MAX_SELECTION)invalid('too many selected components');
  const items=picked.map(cid=>index.get(cid));
  const refs=[...new Set([...approval.sensitive,...approval.withheld])].sort();
  const omitted=[OMITTED_PRIVATE,...refs.map(ref=>REF_TAG+ref)];
  return deepFreeze({
    schema:DESIGN_CONTEXT_SCHEMA, sessionId:session, taskId:task, surfaceId:validated.surfaceId,
    baseRevision:revision, selectedComponentIds:Object.freeze(picked), deviceClass:device,
    rendererCatalogVersion:catalogVersion, allowedComponents:allowed, constraints:limits,
    userRequest:request, contextSummary:Object.freeze({scope:'presentation',items:Object.freeze(items),omitted:Object.freeze(omitted)})
  });
}
