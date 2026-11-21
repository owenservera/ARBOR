// Inert Studio adapter for Craft Anything's normalized Labs application atlas.
// Operator-selected local files only; never browser execution, Host grants, or learned selectors.
import {readFileSync,statSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {problem} from './http.mjs';

export const CRAFT_INTEL_SCHEMA='vivim.studio-craft-intelligence/1';
const ATLAS='vivim.application-surface-atlas/0.1';
const RECON='vivim.application-surface-reconciliation/1';
const EVID=/^ev_[a-f0-9]{64}$/;
const SITE=/^[a-z0-9][a-z0-9-]{0,79}$/;
const ROLE=/^[a-z][a-z0-9-]{0,31}$/;
const SHA=/^[a-f0-9]{64}$/;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const sorted=(a,b)=>a<b?-1:a>b?1:0;

function loadLocal(path) {
  if(typeof path!=='string'||!isAbsolute(path))throw problem(503,'Craft report requires absolute operator path','CRAFT_PATH_INVALID');
  let raw;
  try{
    const s=statSync(path);
    if(!s.isFile()||s.size<2||s.size>4*1024*1024)throw problem(413,'Craft report too large or empty','CRAFT_SIZE_INVALID');
    raw=readFileSync(path,'utf8');
    if(Buffer.byteLength(raw)>4*1024*1024)throw problem(413,'Craft report too large','CRAFT_SIZE_INVALID');
  }catch(e){if(e.status)throw e;throw problem(404,'Configured Craft report is unavailable','CRAFT_SOURCE_MISSING');}
  try{return JSON.parse(raw);}catch{throw problem(422,'Craft report JSON invalid','CRAFT_SOURCE_INVALID');}
}
function validOrigin(value){
  try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&u.origin===value&&!u.username&&!u.password;}catch{return false;}
}
export function projectCraftIntelligence(atlas,reconciliation=null){
  if(!obj(atlas)||atlas.schema!==ATLAS||!obj(atlas.target)||!SITE.test(atlas.target.siteId??'')||
    !validOrigin(atlas.target.origin)||!obj(atlas.source)||atlas.source.producer!=='craft-anything'||atlas.source.version!==1||
    !Array.isArray(atlas.evidence)||atlas.evidence.length>2500||!Array.isArray(atlas.controls)||atlas.controls.length>5000||
    !Array.isArray(atlas.observations)||atlas.observations.length>10000||!Array.isArray(atlas.unknownIds)||atlas.unknownIds.length>2500||
    atlas.authority?.executionAuthorized!==false||atlas.authority?.activationPermitted!==false||atlas.authority?.sendPermission!==false)
    throw problem(422,'Craft atlas rejected','CRAFT_ATLAS_REJECTED');
  if(atlas.source.bundleDigest!=null&&!SHA.test(atlas.source.bundleDigest))
    throw problem(422,'Craft digest invalid','CRAFT_ATLAS_REJECTED');
  if(reconciliation!==null&&(!obj(reconciliation)||reconciliation.schema!==RECON||
    reconciliation.target?.siteId!==atlas.target.siteId||reconciliation.target?.origin!==atlas.target.origin||
    !Array.isArray(reconciliation.features)||reconciliation.features.length>400||
    !Array.isArray(reconciliation.divergences)||reconciliation.divergences.length>400||
    reconciliation.authority?.executionAuthorized!==false||reconciliation.authority?.activationPermitted!==false))
    throw problem(422,'Craft reconciliation rejected','CRAFT_RECONCILIATION_REJECTED');

  const ids=new Set(),operations=new Map(),roles=new Map();
  for(const x of atlas.evidence){
    if(!obj(x)||!EVID.test(x.evidenceId??'')||typeof x.operation!=='string'||!/^[a-z0-9_:-]{1,100}$/.test(x.operation))
      throw problem(422,'Craft evidence rejected','CRAFT_ATLAS_REJECTED');
    ids.add(x.evidenceId);operations.set(x.operation,(operations.get(x.operation)||0)+1);
  }
  for(const x of atlas.controls){
    if(!obj(x)||!EVID.test(x.sourceEvidenceId??'')||!ids.has(x.sourceEvidenceId)||
      !ROLE.test(x.role??'')||x.effectAuthorized!==false||x.locatorVerified!==false)
      throw problem(422,'Craft control rejected','CRAFT_ATLAS_REJECTED');
    roles.set(x.role,(roles.get(x.role)||0)+1);
  }
  if(atlas.observations.some(x=>!obj(x)||!EVID.test(x.evidenceId??'')||!ids.has(x.evidenceId)||x.effectAuthorized!==false))
    throw problem(422,'Craft observation rejected','CRAFT_ATLAS_REJECTED');
  return {
    schema:CRAFT_INTEL_SCHEMA,status:'external-evidence-readonly',
    target:{siteId:atlas.target.siteId,origin:atlas.target.origin},
    source:{producer:'craft-anything',bundleDigest:atlas.source.bundleDigest??null,
      nativeVerified:atlas.source.nativeVerified===true,coverage:'bounded-observations-only'},
    counts:{evidence:atlas.evidence.length,controls:atlas.controls.length,observations:atlas.observations.length,
      states:atlas.observations.filter(x=>x.kind==='interaction-state'||x.kind==='state-capture').length,
      unknowns:atlas.unknownIds.length},
    roles:[...roles].sort((a,b)=>sorted(a[0],b[0])).map(([role,count])=>({role,count})),
    operations:[...operations].sort((a,b)=>sorted(a[0],b[0])).map(([operation,count])=>({operation,count})),
    reconciliation:reconciliation===null?{status:'not-provided',sourceDivergences:0,features:[]}:
      {status:'source-reconciled-not-runtime-verified',sourceDivergences:reconciliation.divergences.length,
       features:reconciliation.features.map(f=>({
         owner:f.owner==='harness'?'harness':'studio',
         featureId:typeof f.featureId==='string'&&/^[a-z0-9.-]{1,100}$/.test(f.featureId)?f.featureId:'unknown',
         observationStatus:['label-correspondence-unverified','not-observed-in-scoped-capture'].includes(f.observationStatus)
           ?f.observationStatus:'unknown'}))},
    authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false},
    note:'Discovery only; no selectors, user text, credentials, account information, or executable operations.'
  };
}
export function registerCraftIntelRoutes({add,atlasPath=()=>process.env.VIVIM_CRAFT_ATLAS_FILE,reconciliationPath=()=>process.env.VIVIM_CRAFT_RECONCILIATION_FILE}){
  add('GET','/dev/craft-intelligence','Read sanitized external Craft application evidence',()=>{
    const f=atlasPath();
    if(!f)return {schema:CRAFT_INTEL_SCHEMA,status:'not-configured',
      nextStep:'Set VIVIM_CRAFT_ATLAS_FILE to an absolute private Labs atlas.json path and restart Studio',
      authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}};
    const other=reconciliationPath();
    return projectCraftIntelligence(loadLocal(f),other?loadLocal(other):null);
  },{tool:'read_craft_intelligence',annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}});
}
