# File: apps/vivim-host/control/hvi-capability.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/hvi-capability.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9978 B |
| Lines | 154 |
| Hash | ba3829ed9e75 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HVI_HOST_ACTION_ID | const | 9 | yes | export const HVI_HOST_ACTION_ID=&#39;versions.compare.pinned&#39;; |
| HVI_HOST_BINDING_SCHEMA | const | 10 | yes | export const HVI_HOST_BINDING_SCHEMA=&#39;vivim.host.hvi-read-port/2&#39;; |
| HVI_HOST_REQUEST_SCHEMA | const | 11 | yes | export const HVI_HOST_REQUEST_SCHEMA=&#39;vivim.host.hvi-source-request/1&#39;; |
| HVI_HOST_REPORT_SCHEMA | const | 12 | yes | export const HVI_HOST_REPORT_SCHEMA=&#39;vivim.host.hvi-safe-report/1&#39;; |
| fail | function | 13 | no | const fail=code=&gt;{const e=new Error(&#39;HVI_HOST_&#39;+code);e.code=code;throw e;}; |
| id | function | 14 | no | const id=x=&gt;typeof x===&#39;string&#39;&amp;&amp;x.length&gt;0&amp;&amp;x.length&lt;=128&amp;&amp;/^[A-Za-z0-9._:@-]+$/.test(x); |
| plain | function | 15 | no | const plain=x=&gt;x!==null&amp;&amp;typeof x===&#39;object&#39;&amp;&amp;!Array.isArray(x)&amp;&amp;Object.getPrototypeOf(x)===Object.prototype; |
| keys | function | 16 | no | const keys=(x,allowed)=&gt;plain(x)&amp;&amp;Object.keys(x).every(k=&gt;allowed.includes(k)); |
| selected | function | 17 | no | function selected(input){ |
| sources | const | 22 | no | const sources=input.sources.map(s=&gt;{ if(!keys(s,[&#39;repo&#39;,&#39;ref&#39;,&#39;sha&#39;,&#39;subPath&#39;,&#39;sourceGrantRef&#39;])\|\| (s.ref==null&amp;&amp;s.sha==null)\|\|typeof s.repo!==&#39;string&#39;)fail(&#39;INVALID_SOURCE&#39;); const repo=canonicalRep… |
| repo | const | 25 | no | const repo=canonicalRepo(s.repo,&#39;github&#39;); |
| subPath | const | 26 | no | const subPath=safePath(s.subPath??&#39;&#39;,{allowEmpty:true}); |
| createHviHostReadPort | function | 41 | yes | export function createHviHostReadPort({actorId,sessionId,verifySession,verifyGrant, approvedRepositories=[],enabled=false,observeUiRevision=null}={}){ |
| approved | const | 47 | no | const approved=new Set(approvedRepositories.map(r=&gt;canonicalRepo(r,&#39;github&#39;))); |
| catalog | const | 48 | no | const catalog=loadControlCatalog(); |
| rows | const | 49 | no | const rows=catalog.actions.filter(a=&gt;a.id===HVI_HOST_ACTION_ID); |
| action | const | 54 | no | const action=rows[0],planner=createControlPlanner({catalog}); |
| discover | function | 55 | no | const discover=text=&gt;{ |
| p | const | 56 | no | const p=typeof text===&#39;string&#39;&amp;&amp;text.trim()&amp;&amp;text.length&lt;=1000? |
| found | const | 58 | no | const found=p?.actionId===HVI_HOST_ACTION_ID; |
| live | function | 67 | no | const live=async ctx=&gt;{ |
| trusted | const | 70 | no | const trusted={...ctx,actorId,sessionId,sourceDomain:&#39;development&#39;, |
| invoke | const | 76 | no | const invoke=async(input,{adapter,signal}={})=&gt;{ |
| observed | const | 83 | no | const observed=observeUiRevision?await observeUiRevision():null; |
| uiRevision | const | 84 | no | const uiRevision=observed&amp;&amp;Number.isSafeInteger(observed.revision)?observed:null; |
| sources | const | 85 | no | const sources=selected(input),manifests=[];let checks=0; |
| check | function | 86 | no | const check=async ctx=&gt;{checks++;return live(ctx);}; |
| auth | function | 88 | no | const auth=ctx=&gt;check({...ctx,repoIdentity:s.repo, resolvedCommitSha:ctx.commitSha??ctx.resolvedCommitSha??null, sourceGrantRef:s.sourceGrantRef}); |
| pin | const | 92 | no | const pin=await resolvePin(s,{adapter,authorize:auth}); |
| result | const | 96 | no | const result=await runHviTool({ schema:HVI_TOOL_REQUEST_SCHEMA,sourceManifests:manifests, targetPinId:manifests[input.targetIndex].pin.pinId, scope:input.scope,budgets:input.budgets,pairwise:input.pa… |
| inspector | const | 105 | no | const inspector=await projectAuthorizedHviInspector(result,{verifyCurrentGrant:check, signal,maxRows:Math.min(input.budgets?.maxFindings??200,200)}); |
| createHviLocalOwnerGate | function | 131 | yes | export function createHviLocalOwnerGate({ request, ownerTokenFor, uiSessions, verifyDevelopmentSourceGrant, }={}){ |
| verifySession | function | 136 | no | function verifySession(){ |
| h | const | 137 | no | const h=request?.headers; |
| token | variable | 142 | no | let token=null; |
| verifyGrant | function | 148 | no | async function verifyGrant(ctx){ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./intent-planner.mjs | import | 3 | [apps/vivim-host/control/intent-planner.mjs](./intent-planner.mjs.md) |
| ../../../hq/version-intelligence/integration/index.mjs | import | 4 | [hq/version-intelligence/integration/index.mjs](../../../hq/version-intelligence/integration/index.mjs.md) |
| ../../../hq/version-intelligence/sources/snapshots.mjs | import | 5 | [hq/version-intelligence/sources/snapshots.mjs](../../../hq/version-intelligence/sources/snapshots.mjs.md) |
| ../bootstrap/owner-auth.mjs | import | 6 | [apps/vivim-host/bootstrap/owner-auth.mjs](../bootstrap/owner-auth.mjs.md) |
| ../../../hq/version-intelligence/integration/host-inspector-projection.mjs | import | 7 | [hq/version-intelligence/integration/host-inspector-projection.mjs](../../../hq/version-intelligence/integration/host-inspector-projection.mjs.md) |
| ../../../hq/version-intelligence/sources/common.mjs | import | 8 | [hq/version-intelligence/sources/common.mjs](../../../hq/version-intelligence/sources/common.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/development-read-port.mjs](./development-read-port.mjs.md) | ./hvi-capability.mjs |
| [apps/vivim-host/test/hvi-capability.test.mjs](../test/hvi-capability.test.mjs.md) | ../control/hvi-capability.mjs |
| [apps/vivim-host/test/hvi-source-grant.test.mjs](../test/hvi-source-grant.test.mjs.md) | ../control/hvi-capability.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../apps/vivim-host/control/hvi-capability.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// HVI: native read-only port. Catalog is the canonical Host registry.
// This file creates no new network endpoint, scheduler, source grant or executor.
import { loadControlCatalog, createControlPlanner } from './intent-planner.mjs';
import { runHviTool, HVI_CAPABILITY_ID, HVI_TOOL_REQUEST_SCHEMA } from '../../../hq/version-intelligence/integration/index.mjs';
import { resolvePin, snapshotAt } from '../../../hq/version-intelligence/sources/snapshots.mjs';
import { verifyOwnerToken } from '../bootstrap/owner-auth.mjs';
import { projectAuthorizedHviInspector } from '../../../hq/version-intelligence/integration/host-inspector-projection.mjs';
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
  approvedRepositories=[],enabled=false,observeUiRevision=null}={}){
  if(!id(actorId)||!id(sessionId)||typeof verifySession!=='function'||
    typeof verifyGrant!=='function'||!Array.isArray(approvedRepositories)||
    approvedRepositories.length>16)fail('AUTHORITY_REQUIRED');
  if(observeUiRevision!==null&&typeof observeUiRevision!=='function')fail('INVALID_REQUEST');
  const approved=new Set(approvedRepositories.map(r=>canonicalRepo(r,'github')));
  const catalog=loadControlCatalog();
  const rows=catalog.actions.filter(a=>a.id===HVI_HOST_ACTION_ID);
  // The port may serve a declared (not yet executable) or a wired row, but never a
  // live-accepted one: 'verified' asserts real Windows Host and paired-phone receipts
  // that this branch does not hold. Readiness is read from the catalog, never assumed.
  if(rows.length!==1||rows[0].risk!=='R0'||rows[0].readiness==='verified')fail('REGISTRATION_INVALID');
  const action=rows[0],planner=createControlPlanner({catalog});
  const discover=text=>{
    const p=typeof text==='string'&&text.trim()&&text.length<=1000?
      planner.planText(text,{source:'desktop'}):null;
    const found=p?.actionId===HVI_HOST_ACTION_ID;
    // Report what is actually true: the catalog readiness, whether this port is enabled
    // and whether a live development-source grant is required. Never claim execution.
    return {schema:HVI_HOST_BINDING_SCHEMA,outcome:found?(enabled?'DECLARED_ENABLED':'DECLARED_DISABLED'):'NO_MATCH',
      actions:found?[{id:HVI_HOST_ACTION_ID,capabilityId:HVI_CAPABILITY_ID,
        readiness:action.readiness,enabled,requiresLiveGrant:true,
        executable:action.readiness==='source_wired'||action.readiness==='verified'}]:[],
      executionAuthorized:false,remoteAccessible:false};
  };
  const live=async ctx=>{
    if(!approved.has(canonicalRepo(ctx.repoIdentity,'github')))fail('SOURCE_UNAUTHORIZED');
    if(ctx.path&&sensitivePath(ctx.path))fail('SOURCE_UNAUTHORIZED');
    const trusted={...ctx,actorId,sessionId,sourceDomain:'development',
      capabilityId:HVI_CAPABILITY_ID};
    if(await verifySession(trusted)!==true||await verifyGrant(trusted)!==true)
      fail('SOURCE_UNAUTHORIZED');
    return true;
  };
  const invoke=async(input,{adapter,signal}={})=>{
    if(!enabled)fail('HOST_FEATURE_DISABLED');
    if(adapter?.authorizedDevelopmentSource!==true)fail('SOURCE_UNAUTHORIZED');
    if(signal?.aborted)fail('CANCELLED');
    // The current UI revision is OBSERVED from the canonical Host owner, never taken
```

_First 80 of 155 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
