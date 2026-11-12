// HVI: native read-only port. Catalog is the canonical Host registry.
// This file creates no new network endpoint, scheduler, source grant or executor.
import { loadControlCatalog, createControlPlanner } from './intent-planner.mjs';
import { runHviTool, HVI_CAPABILITY_ID, HVI_TOOL_REQUEST_SCHEMA } from '../../../hq/version-intelligence/integration/index.mjs';
import { resolvePin, snapshotAt } from '../../../hq/version-intelligence/sources/snapshots.mjs';
import { canonicalRepo, safePath, sensitivePath } from '../../../hq/version-intelligence/sources/common.mjs';
export const HVI_HOST_ACTION_ID='versions.compare.pinned';
export const HVI_HOST_BINDING_SCHEMA='vivim.host.hvi-read-port/2';
export const HVI_HOST_REQUEST_SCHEMA='vivim.host.hvi-source-request/1';
export const HVI_HOST_REPORT_SCHEMA='vivim.host.hvi-safe-report/1';
const fail=code=>{const e=new Error('HVI_HOST_'+code);e.code=code;throw e;};
const id=x=>typeof x==='string'&&x.length>0&&x.length<=128&&/^[A-Za-z0-9._:@-]+$/.test(x);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const keys=(x,allowed)=>plain(x)&&Object.keys(x).every(k=>allowed.includes(k));
function selected(input){
  if(!keys(input,['schema','sources','targetIndex','scope','budgets','pairwise','includeParity','reportOptions'])||
    input.schema!==HVI_HOST_REQUEST_SCHEMA||!Array.isArray(input.sources)||
    input.sources.length<2||input.sources.length>16||!Number.isSafeInteger(input.targetIndex)||
    input.targetIndex<0||input.targetIndex>=input.sources.length)fail('INVALID_REQUEST');
  const sources=input.sources.map(s=>{
    if(!keys(s,['repo','ref','sha','subPath','sourceGrantRef'])||
      (s.ref==null&&s.sha==null)||typeof s.repo!=='string')fail('INVALID_SOURCE');
    const repo=canonicalRepo(s.repo,'github');
    const subPath=safePath(s.subPath??'',{allowEmpty:true});
    if(sensitivePath(subPath))fail('SCOPE_ESCAPE');
    if(s.sourceGrantRef!=null&&!id(s.sourceGrantRef))fail('INVALID_SOURCE');
    return {provider:'github',repo,ref:s.ref,sha:s.sha,subPath,
      approvedScope:'development',sourceGrantRef:s.sourceGrantRef??null};
  });
  if(input.scope!==undefined&&(!keys(input.scope,['prefixes'])||
    !Array.isArray(input.scope.prefixes)||input.scope.prefixes.length<1||
    input.scope.prefixes.length>32||input.scope.prefixes.some(p=>typeof p!=='string'||
    (p!==''&&(safePath(p),sensitivePath(p))))))fail('SCOPE_ESCAPE');
  if(input.budgets!==undefined&&(!keys(input.budgets,['maxPins','maxEntries','maxFindings','maxPairs'])||
    Object.values(input.budgets).some(v=>!Number.isSafeInteger(v)||v<1)))fail('RESOURCE_LIMIT');
  return sources;
}
/** Trusted Host must inject actor/session, live callbacks and exact source allowlist. */
export function createHviHostReadPort({actorId,sessionId,verifySession,verifyGrant,
  approvedRepositories=[],enabled=false}={}){
  if(!id(actorId)||!id(sessionId)||typeof verifySession!=='function'||
    typeof verifyGrant!=='function'||!Array.isArray(approvedRepositories)||
    approvedRepositories.length>16)fail('AUTHORITY_REQUIRED');
  const approved=new Set(approvedRepositories.map(r=>canonicalRepo(r,'github')));
  const catalog=loadControlCatalog();
  const rows=catalog.actions.filter(a=>a.id===HVI_HOST_ACTION_ID);
  if(rows.length!==1||rows[0].readiness!=='enforcement_missing'||
    rows[0].risk!=='R0'||rows[0].executor!==null)fail('REGISTRATION_INVALID');
  const action=rows[0],planner=createControlPlanner({catalog});
  const discover=text=>{
    const p=typeof text==='string'&&text.trim()&&text.length<=1000?
      planner.planText(text,{source:'desktop'}):null;
    const found=p?.actionId===HVI_HOST_ACTION_ID;
    return {schema:HVI_HOST_BINDING_SCHEMA,outcome:found?'DECLARED_DISABLED':'NO_MATCH',
      actions:found?[{id:HVI_HOST_ACTION_ID,capabilityId:HVI_CAPABILITY_ID,
        readiness:action.readiness,enabled:false,requiresLiveGrant:true}]:[],
      executionAuthorized:false,remoteAccessible:false};
  };
  const live=async ctx=>{
    if(!approved.has(canonicalRepo(ctx.repoIdentity,'github')))fail('SOURCE_UNAUTHORIZED');
    if(ctx.path&&sensitivePath(ctx.path))fail('SOURCE_UNAUTHORIZED');
    const trusted={actorId,sessionId,sourceDomain:'development',
      capabilityId:HVI_CAPABILITY_ID,...ctx};
    if(await verifySession(trusted)!==true||await verifyGrant(trusted)!==true)
      fail('SOURCE_UNAUTHORIZED');
    return true;
  };
  const invoke=async(input,{adapter,signal}={})=>{
    if(!enabled)fail('HOST_FEATURE_DISABLED');
    if(adapter?.authorizedDevelopmentSource!==true)fail('SOURCE_UNAUTHORIZED');
    if(signal?.aborted)fail('CANCELLED');
    const sources=selected(input),manifests=[];let checks=0;
    const check=async ctx=>{checks++;return live(ctx);};
    for(const s of sources){
      const auth=ctx=>check({...ctx,repoIdentity:s.repo,
        resolvedCommitSha:ctx.commitSha??ctx.resolvedCommitSha??null,
        sourceGrantRef:s.sourceGrantRef});
      await check({repoIdentity:s.repo,operation:'source.select',sourceGrantRef:s.sourceGrantRef});
      const pin=await resolvePin(s,{adapter,authorize:auth});
      manifests.push(await snapshotAt(pin,{adapter,authorize:auth,signal,
        inspectContent:false,limits:{maxEntries:Math.min(input.budgets?.maxEntries??50000,50000)}}));
    }
    const result=await runHviTool({
      schema:HVI_TOOL_REQUEST_SCHEMA,sourceManifests:manifests,
      targetPinId:manifests[input.targetIndex].pin.pinId,
      scope:input.scope,budgets:input.budgets,pairwise:input.pairwise===true,
      includeParity:input.includeParity===true,reportOptions:input.reportOptions
    },{signal,authorize:ctx=>check(ctx),context:{actorId,sessionId,sourceDomain:'development'}});
    for(const m of manifests)await check({repoIdentity:m.pin.repoIdentity,
      operation:'report.project',resolvedCommitSha:m.pin.resolvedCommitSha,
      sourceGrantRef:m.pin.sourceGrantRef});
    return {schema:HVI_HOST_BINDING_SCHEMA,actionId:HVI_HOST_ACTION_ID,
      capabilityId:HVI_CAPABILITY_ID,outcome:'SOURCE_ANALYSIS_ONLY',
      report:{schema:HVI_HOST_REPORT_SCHEMA,status:result.evidenceReport.status,
        summary:result.comparison.summary,comparisonDigest:result.comparison.reproducibilityDigest,
        sourceCount:manifests.length,sourcePins:manifests.map(m=>({
          pinId:m.pin.pinId,repoIdentity:m.pin.repoIdentity,
          resolvedCommitSha:m.pin.resolvedCommitSha,completeness:m.completeness})),
        note:'source evidence only; not runtime or migration acceptance'},
      grantCheckCount:checks,remoteAccepted:false,runtimeAccepted:false,
      authority:'injected-local-Host-callbacks-not-production-attested'};
  };
  return Object.freeze({schema:HVI_HOST_BINDING_SCHEMA,action,capabilityId:HVI_CAPABILITY_ID,
    discover,invoke,enabled,remoteAccessible:false,readiness:'enforcement_missing'});
}
