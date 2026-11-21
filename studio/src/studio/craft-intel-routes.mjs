// Craft Anything -> VIVIM Studio. Read-only development connector.
// Keep this wire boundary stable when evidence projection moves to Rust.
// Files are operator configured: NO request path is ever accepted.
import {readFileSync,statSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {problem} from './http.mjs';

export const CRAFT_INTEL_SCHEMA = 'vivim.studio-craft-intelligence/1';
export const CRAFT_SOURCE_INDEX_SCHEMA = 'vivim.craft-intelligence-sources/1';
export const CRAFT_DELTA_SCHEMA = 'vivim.studio-craft-observation-delta/1';
const ATLAS='vivim.application-surface-atlas/0.1';
const RECON='vivim.application-surface-reconciliation/1';
const EVID=/^ev_[a-f0-9]{64}$/;
const SITE=/^[a-z0-9][a-z0-9-]{0,79}$/;
const ROLE=/^[a-z][a-z0-9-]{0,31}$/;
const SHA=/^[a-f0-9]{64}$/;
const OP=/^[a-z0-9_:-]{1,100}$/;
const KINDS=new Set(['website-capture','capture-artifact','state-capture','interaction-state','state-artifact','walkthrough','walkthrough-step','accessibility-summary']);
const QUALIFIERS=new Set(['observed','derived','inferred']);
const COVERAGE=new Set(['complete','partial','unknown']);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const sorted=(a,b)=>a<b?-1:a>b?1:0;
const deny=(code,message)=>{throw problem(422,message,code);};
const inert=a=>a?.executionAuthorized===false&&a?.activationPermitted===false&&a?.sendPermission===false;

function validOrigin(value){
  try {const u=new URL(value); return ['http:','https:'].includes(u.protocol)&&u.origin===value&&!u.username&&!u.password;}
  catch{return false;}
}
function localPath(value){
  return typeof value==='string'&&value.length>0&&value.length<=2048&&isAbsolute(value)&&!/[\x00-\x1f]/.test(value);
}
function loadLocal(file,max=4*1024*1024){
  if(!localPath(file))throw problem(503,'Craft source requires an absolute operator-configured path','CRAFT_PATH_INVALID');
  let raw;
  try {
    const info=statSync(file);
    if(!info.isFile()||info.size<2||info.size>max)throw problem(413,'Craft source too large or empty','CRAFT_SIZE_INVALID');
    raw=readFileSync(file,'utf8');
    if(Buffer.byteLength(raw)>max)throw problem(413,'Craft source too large','CRAFT_SIZE_INVALID');
  } catch(e){if(e.status)throw e;throw problem(404,'Configured Craft source unavailable','CRAFT_SOURCE_MISSING');}
  try {return JSON.parse(raw);}catch{throw problem(422,'Craft source is not JSON','CRAFT_SOURCE_INVALID');}
}

export function parseCraftSourceIndex(index){
  if(!obj(index)||index.schema!==CRAFT_SOURCE_INDEX_SCHEMA||!Array.isArray(index.targets)||
     index.targets.length===0||index.targets.length>24)deny('CRAFT_INDEX_REJECTED','Craft source index rejected');
  const ids=new Set();
  return index.targets.map(entry=>{
    if(!obj(entry)||!SITE.test(entry.siteId??'')||ids.has(entry.siteId)||
       !localPath(entry.atlasPath)||
       (entry.reconciliationPath!=null&&!localPath(entry.reconciliationPath))||
       (entry.previousAtlasPath!=null&&!localPath(entry.previousAtlasPath))||
       Object.keys(entry).some(k=>!['siteId','atlasPath','reconciliationPath','previousAtlasPath'].includes(k)))
      deny('CRAFT_INDEX_REJECTED','Craft source index rejected');
    ids.add(entry.siteId);
    return {siteId:entry.siteId,atlasPath:entry.atlasPath,
      reconciliationPath:entry.reconciliationPath??null,
      previousAtlasPath:entry.previousAtlasPath??null};
  }).sort((a,b)=>sorted(a.siteId,b.siteId));
}

// This projection deliberately does not emit control labels, selectors, paths, unknown text,
// URLs beyond a scope origin, or raw Craft results. Rust will own this pure function later.
export function projectCraftIntelligence(atlas,reconciliation=null){
  if(!obj(atlas)||atlas.schema!==ATLAS||!obj(atlas.target)||!SITE.test(atlas.target.siteId??'')||
     !validOrigin(atlas.target.origin)||!obj(atlas.source)||atlas.source.producer!=='craft-anything'||atlas.source.version!==1||
     !Array.isArray(atlas.evidence)||atlas.evidence.length>2500||!Array.isArray(atlas.controls)||atlas.controls.length>5000||
     !Array.isArray(atlas.observations)||atlas.observations.length>10000||!Array.isArray(atlas.unknownIds)||atlas.unknownIds.length>2500||
     !inert(atlas.authority))deny('CRAFT_ATLAS_REJECTED','Craft atlas rejected');
  if(atlas.source.bundleDigest!=null&&!SHA.test(atlas.source.bundleDigest))
    deny('CRAFT_ATLAS_REJECTED','Craft digest invalid');
  if(reconciliation!==null&&(!obj(reconciliation)||reconciliation.schema!==RECON||
     reconciliation.target?.siteId!==atlas.target.siteId||reconciliation.target?.origin!==atlas.target.origin||
     !Array.isArray(reconciliation.features)||reconciliation.features.length>400||
     !Array.isArray(reconciliation.divergences)||reconciliation.divergences.length>400||
     reconciliation.authority?.executionAuthorized!==false||reconciliation.authority?.activationPermitted!==false||
     reconciliation.authority?.sendPermission===true))
    deny('CRAFT_RECONCILIATION_REJECTED','Craft reconciliation rejected');

  const ids=new Set(),operations=new Map(),roles=new Map(),confidence=new Map(),coverage=new Map(),kinds=new Map();
  const evidence=[];
  for(const x of atlas.evidence){
    if(!obj(x)||!EVID.test(x.evidenceId??'')||ids.has(x.evidenceId)||!OP.test(x.operation??''))
      deny('CRAFT_ATLAS_REJECTED','Craft evidence rejected');
    if(x.confidence!=null&&!QUALIFIERS.has(x.confidence))deny('CRAFT_ATLAS_REJECTED','Craft confidence rejected');
    if(x.coverage!=null&&!COVERAGE.has(x.coverage))deny('CRAFT_ATLAS_REJECTED','Craft coverage rejected');
    ids.add(x.evidenceId);
    operations.set(x.operation,(operations.get(x.operation)||0)+1);
    const q=x.confidence??'unknown',cv=x.coverage??'unknown';
    confidence.set(q,(confidence.get(q)||0)+1);
    coverage.set(cv,(coverage.get(cv)||0)+1);
    evidence.push({evidenceId:x.evidenceId,operation:x.operation,confidence:q,coverage:cv,
      limitations:Array.isArray(x.limitationCodes)?Math.min(x.limitationCodes.length,25):0,
      cleanRoom:x.cleanRoom===true});
  }
  for(const x of atlas.controls){
    if(!obj(x)||!EVID.test(x.sourceEvidenceId??'')||!ids.has(x.sourceEvidenceId)||
       !ROLE.test(x.role??'')||x.effectAuthorized!==false||x.locatorVerified!==false)
      deny('CRAFT_ATLAS_REJECTED','Craft control rejected');
    roles.set(x.role,(roles.get(x.role)||0)+1);
  }
  for(const x of atlas.observations){
    if(!obj(x)||!EVID.test(x.evidenceId??'')||!ids.has(x.evidenceId)||x.effectAuthorized!==false||
       !KINDS.has(x.kind))deny('CRAFT_ATLAS_REJECTED','Craft observation rejected');
    kinds.set(x.kind,(kinds.get(x.kind)||0)+1);
  }
  const rows=map=>[...map].sort((a,b)=>sorted(a[0],b[0])).map(([key,count])=>({key,count}));
  const features=reconciliation===null?[]:reconciliation.features.map(f=>({
    owner:f?.owner==='harness'?'harness':f?.owner==='studio'?'studio':'unknown',
    featureId:typeof f?.featureId==='string'&&/^[a-z0-9.-]{1,100}$/.test(f.featureId)?f.featureId:'unknown',
    observationStatus:['label-correspondence-unverified','not-observed-in-scoped-capture'].includes(f?.observationStatus)
      ?f.observationStatus:'unknown',
    evidenceCount:Array.isArray(f?.evidenceRefs)?new Set(f.evidenceRefs.slice(0,2500)
      .filter(r=>obj(r)&&ids.has(r.evidenceId)).map(r=>r.evidenceId+':'+String(r.position??''))).size:0,
  }));
  return {
    schema:CRAFT_INTEL_SCHEMA,status:'external-evidence-readonly',
    target:{siteId:atlas.target.siteId,origin:atlas.target.origin},
    source:{producer:'craft-anything',bundleDigest:atlas.source.bundleDigest??null,
      // This is only an external producer's assertion. Studio does NOT independently attest it.
      nativeVerified:atlas.source.nativeVerified===true,verificationAuthority:'unattested-external-report',
      coverage:'bounded-observations-only'},
    counts:{evidence:atlas.evidence.length,controls:atlas.controls.length,observations:atlas.observations.length,
      states:(kinds.get('interaction-state')||0)+(kinds.get('state-capture')||0),unknowns:atlas.unknownIds.length},
    roles:rows(roles).map(x=>({role:x.key,count:x.count})),
    operations:rows(operations).map(x=>({operation:x.key,count:x.count})),
    observationKinds:rows(kinds).map(x=>({kind:x.key,count:x.count})),
    confidence:rows(confidence).map(x=>({confidence:x.key,count:x.count})),
    coverage:rows(coverage).map(x=>({coverage:x.key,count:x.count})),
    evidence, // IDs, codes and counts only. No target strings or paths.
    reconciliation:reconciliation===null?{status:'not-provided',sourceDivergences:0,unmappedCount:0,features:[]}:
      {status:'source-reconciled-not-runtime-verified',sourceDivergences:reconciliation.divergences.length,
       unmappedCount:Array.isArray(reconciliation.unmapped)?reconciliation.unmapped.length:0,features},
    authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false},
    note:'Discovery only; no labels, selectors, private content or executable operations are returned.'
  };
}

export function projectCraftDelta(before,after){
  const b=projectCraftIntelligence(before),a=projectCraftIntelligence(after);
  if(b.target.siteId!==a.target.siteId||b.target.origin!==a.target.origin)
    deny('CRAFT_DELTA_SCOPE_MISMATCH','Craft atlas scopes do not match');
  const roleCount=p=>new Map(p.roles.map(x=>[x.role,x.count]));
  const old=roleCount(b),next=roleCount(a);
  const idsBefore=new Set(b.evidence.map(x=>x.evidenceId));
  const idsAfter=new Set(a.evidence.map(x=>x.evidenceId));
  return {schema:CRAFT_DELTA_SCHEMA,target:a.target,
    snapshots:{before:b.source.bundleDigest,after:a.source.bundleDigest},
    observedEvidence:{added:[...idsAfter].filter(x=>!idsBefore.has(x)).length,
      notPresentInAfter:[...idsBefore].filter(x=>!idsAfter.has(x)).length},
    roleCounts:[...new Set([...old.keys(),...next.keys()])].sort(sorted).map(role=>({
      role,before:old.get(role)||0,after:next.get(role)||0,delta:(next.get(role)||0)-(old.get(role)||0)
    })),
    states:{before:b.counts.states,after:a.counts.states},
    status:'observation-difference-only',
    authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false},
    note:'Different capture counts do not prove a product feature was added, removed, or broken.'};
}

export function registerCraftIntelRoutes({add,
  atlasPath=()=>process.env.VIVIM_CRAFT_ATLAS_FILE,
  reconciliationPath=()=>process.env.VIVIM_CRAFT_RECONCILIATION_FILE,
  previousAtlasPath=()=>process.env.VIVIM_CRAFT_PREVIOUS_ATLAS_FILE,
  indexPath=()=>process.env.VIVIM_CRAFT_INDEX_FILE}={}){
  const configured=()=>{
    const file=indexPath();
    if(file)return parseCraftSourceIndex(loadLocal(file,64*1024));
    const atlas=atlasPath();
    if(!atlas)return [];
    const raw=loadLocal(atlas);
    if(!obj(raw.target)||!SITE.test(raw.target.siteId??''))deny('CRAFT_ATLAS_REJECTED','Atlas target invalid');
    return [{siteId:raw.target.siteId,atlasPath:atlas,
      reconciliationPath:reconciliationPath()??null,
      previousAtlasPath:previousAtlasPath()??null}];
  };
  const readTarget=(siteId)=>{
    if(!SITE.test(siteId??''))deny('CRAFT_TARGET_INVALID','Invalid target identifier');
    const target=configured().find(t=>t.siteId===siteId);
    if(!target)throw problem(404,'Craft target is not configured','CRAFT_TARGET_MISSING');
    const atlas=loadLocal(target.atlasPath);
    if(atlas?.target?.siteId!==target.siteId)deny('CRAFT_TARGET_MISMATCH','Craft source target does not match registration');
    const other=target.reconciliationPath?loadLocal(target.reconciliationPath):null;
    return {atlas,other,target};
  };
  const meta={annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}};
  add('GET','/dev/craft-intelligence','Read sanitized external Craft application evidence',()=>{
    // Original single-target API stays stable. An index requires explicit site selection.
    if(indexPath())return {schema:CRAFT_INTEL_SCHEMA,status:'index-configured',
      nextStep:'Use /api/v1/dev/craft-intelligence/targets and select a siteId.',
      authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}};
    if(!atlasPath())return {schema:CRAFT_INTEL_SCHEMA,status:'not-configured',
      nextStep:'Set VIVIM_CRAFT_ATLAS_FILE or VIVIM_CRAFT_INDEX_FILE to an operator-owned absolute path.',
      authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}};
    const targets=configured();
    const {atlas,other}=readTarget(targets[0].siteId);
    return projectCraftIntelligence(atlas,other);
  },{tool:'read_craft_intelligence',...meta});
  add('GET','/dev/craft-intelligence/targets','List only operator-configured Craft target identities',()=>({
    schema:CRAFT_SOURCE_INDEX_SCHEMA,status:'read-only',targets:configured().map(x=>({siteId:x.siteId,
      reconciliationConfigured:!!x.reconciliationPath,deltaConfigured:!!x.previousAtlasPath})),
    authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}
  }),{tool:'list_craft_intelligence_targets',...meta});
  add('GET','/dev/craft-intelligence/targets/{siteId}','Read one configured Craft target projection',({p})=>{
    const {atlas,other}=readTarget(p.siteId);
    return projectCraftIntelligence(atlas,other);
  },{tool:'read_craft_intelligence_target',...meta});
  add('GET','/dev/craft-intelligence/targets/{siteId}/delta','Compare two configured captures without product change claims',({p})=>{
    const {atlas,target}=readTarget(p.siteId);
    if(!target.previousAtlasPath)throw problem(404,'No previous atlas configured','CRAFT_DELTA_UNAVAILABLE');
    return projectCraftDelta(loadLocal(target.previousAtlasPath),atlas);
  },{tool:'read_craft_intelligence_delta',...meta});
}
