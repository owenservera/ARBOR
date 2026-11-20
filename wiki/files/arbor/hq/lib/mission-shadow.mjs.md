# File: hq/lib/mission-shadow.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/mission-shadow.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8957 B |
| Lines | 136 |
| Hash | 7913f4ccdb53 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SHADOW_SCHEMA | const | 9 | yes | export const SHADOW_SCHEMA = &#39;hq.mission-shadow/1&#39;; |
| REVISION_SCHEMA | const | 10 | yes | export const REVISION_SCHEMA = &#39;hq.mission-revision-proposal/1&#39;; |
| ID | const | 11 | no | const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/; |
| HEX | const | 12 | no | const HEX=/^[0-9a-f]{64}$/; |
| STATUSES | const | 13 | no | const STATUSES=new Set([&#39;READY&#39;,&#39;RUNNING&#39;,&#39;WAITING_DEPENDENCY&#39;,&#39;STALE&#39;,&#39;AWAITING_VERIFICATION&#39;, &#39;RECOVERY_REQUIRED&#39;,&#39;BLOCKED&#39;,&#39;VERIFIED&#39;]); |
| PHASES | const | 15 | no | const PHASES=new Set([&#39;plan&#39;,&#39;execute&#39;,&#39;review&#39;,&#39;verify&#39;,&#39;deliver&#39;]); |
| red | function | 16 | no | const red=(code,detail)=&gt;({ok:false,code,detail,mode:&#39;SHADOW&#39;}); |
| sha | function | 17 | no | const sha=x=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(x)).digest(&#39;hex&#39;); |
| canonical | function | 18 | no | const canonical=x=&gt;Array.isArray(x)?x.map(canonical):x&amp;&amp;typeof x===&#39;object&#39;?Object.fromEntries(Object.entries(x).sort(([a],[b])=&gt;a.localeCompare(b)).map(([k,v])=&gt;[k,canonical(v)])):x; |
| MAX | const | 19 | no | const MAX=2048; |
| assertGraph | function | 20 | no | function assertGraph(steps){ |
| nodes | const | 22 | no | const nodes=new Map(); |
| pending | const | 33 | no | const pending=new Set(),seen=new Set(); |
| visit | function | 34 | no | function visit(id){if(pending.has(id))return &#39;DEPENDENCY_CYCLE&#39;;if(seen.has(id))return null; |
| trust | function | 42 | no | function trust(m,e){ |
| criticalPath | function | 55 | no | function criticalPath(id,steps,memo){ |
| dependents | const | 57 | no | const dependents=steps.filter(s=&gt;s.dependsOn.includes(id)); |
| n | const | 58 | no | const n=1+(dependents.length?Math.max(...dependents.map(s=&gt;criticalPath(s.id,steps,memo))):0); |
| decideMissionNext | function | 67 | yes | export function decideMissionNext({mission,evaluation,now,capacity=1,activeLanes=0,remainingBudget=Infinity}={}){ |
| nowMs | const | 68 | no | const nowMs=Date.parse(now??&#39;&#39;); |
| index | const | 73 | no | const index=new Map(mission.steps.map((s,i)=&gt;[s.id,i])); |
| candidates | const | 74 | no | const candidates=evaluation.steps.map(v=&gt;({...v,spec:mission.steps[index.get(v.id)]})); |
| choose | function | 75 | no | const choose=(status)=&gt;candidates.filter(x=&gt;x.status===status).sort((a,b)=&gt;{ const m=new Map(),d=criticalPath(b.id,mission.steps,m)-criticalPath(a.id,mission.steps,m); return d\|\|index.get(a.id)-index… |
| m | const | 76 | no | const m=new Map(),d=criticalPath(b.id,mission.steps,m)-criticalPath(a.id,mission.steps,m); |
| action | variable | 79 | no | let action=&#39;OBSERVE&#39;,step=null,reason=&#39;mission-progress-active&#39;,requiresApproval=false; |
| complete | const | 98 | no | const complete=candidates.filter(x=&gt;x.status===&#39;VERIFIED&#39;).length; |
| next | const | 99 | no | const next={schema:SHADOW_SCHEMA,ok:true,mode:&#39;SHADOW&#39;,missionId:mission.id,missionRevision:mission.revision, |
| proposeMissionRevision | function | 112 | yes | export function proposeMissionRevision({mission,expectedRevision,steps,reason}={}){ |
| problem | const | 117 | no | const problem=assertGraph(steps); |
| old | const | 119 | no | const old=new Map(mission.steps.map(s=&gt;[s.id,s])); |
| updated | const | 120 | no | const updated=steps.map(s=&gt;{ const prior=old.get(s.id); if(!prior)return {...structuredClone(s),revision:1}; const {revision:_,...oldFields}=prior,{revision:__,...newFields}=s; const identical=sha(ca… |
| prior | const | 121 | no | const prior=old.get(s.id); |
| identical | const | 124 | no | const identical=sha(canonical(oldFields))===sha(canonical(newFields)); |
| changed | const | 127 | no | const changed=updated.filter(s=&gt;!old.has(s.id)\|\|s.revision!==old.get(s.id).revision).map(s=&gt;s.id); |
| removed | const | 128 | no | const removed=[...old.keys()].filter(id=&gt;!updated.some(s=&gt;s.id===id)); |
| next | const | 129 | no | const next={...structuredClone(mission),revision:mission.revision+1,steps:updated}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | M3 shadow-only mission decision and revision proposal. |
| 3 | owner | mission-intelligence | — | mission-intelligence |
| 4 | invariant | — | — | No shell, agent dispatch, source writes, approvals, model calls or delivery effects. |
| 5 | invariant | — | — | Requires a source-bound evaluation; AI task claims cannot become instructions. |
| 6 | invariant | — | — | Replanning never silently changes the owner&#39;s objective or reuses old proof. |

## Excerpt

```javascript
/**
 * @hq:context M3 shadow-only mission decision and revision proposal.
 * @hq:owner mission-intelligence
 * @hq:invariant No shell, agent dispatch, source writes, approvals, model calls or delivery effects.
 * @hq:invariant Requires a source-bound evaluation; AI task claims cannot become instructions.
 * @hq:invariant Replanning never silently changes the owner's objective or reuses old proof.
 */
import { createHash } from 'node:crypto';
export const SHADOW_SCHEMA = 'hq.mission-shadow/1';
export const REVISION_SCHEMA = 'hq.mission-revision-proposal/1';
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const HEX=/^[0-9a-f]{64}$/;
const STATUSES=new Set(['READY','RUNNING','WAITING_DEPENDENCY','STALE','AWAITING_VERIFICATION',
 'RECOVERY_REQUIRED','BLOCKED','VERIFIED']);
const PHASES=new Set(['plan','execute','review','verify','deliver']);
const red=(code,detail)=>({ok:false,code,detail,mode:'SHADOW'});
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)])):x;
const MAX=2048;
function assertGraph(steps){
 if(!Array.isArray(steps)||steps.length<1||steps.length>MAX)return 'INVALID_STEPS';
 const nodes=new Map();
 for(const s of steps){
  if(!s||!ID.test(s.id??'')||typeof s.title!=='string'||!s.title.trim()||
    !PHASES.has(s.phase)||!Number.isSafeInteger(s.revision)||s.revision<1||
    !Array.isArray(s.dependsOn)||s.dependsOn.length>MAX||!Array.isArray(s.requirements)||
    s.requirements.length===0||s.requirements.length>64||
    s.requirements.some(r=>!ID.test(r?.kind??'')||!ID.test(r?.source??''))||
    ![s.workOrderId,s.taskId,s.laneId].some(Boolean)||
    (s.effectClass!==undefined&&!['internal','external'].includes(s.effectClass)))return 'INVALID_STEP';
  if(nodes.has(s.id))return 'DUPLICATE_STEP';nodes.set(s.id,s);
 }
 const pending=new Set(),seen=new Set();
 function visit(id){if(pending.has(id))return 'DEPENDENCY_CYCLE';if(seen.has(id))return null;
  pending.add(id);
  for(const dep of nodes.get(id).dependsOn){if(!nodes.has(dep))return 'MISSING_DEPENDENCY';const err=visit(dep);if(err)return err;}
  pending.delete(id);seen.add(id);return null;
 }
 for(const id of nodes.keys()){const err=visit(id);if(err)return err;}
 return null;
}
function trust(m,e){
 return m?.schema==='hq.mission/1'&&ID.test(m?.id??'')&&
  Number.isSafeInteger(m.revision)&&m.revision>0&&
  e?.ok===true&&e.schema==='hq.mission-view/1'&&
  e.evaluationSchema==='hq.mission-evaluation/1'&&e.missionId===m.id&&
  e.missionRevision===m.revision&&HEX.test(e.sourceFingerprint??'')&&
  Array.isArray(e.steps)&&e.steps.length===m.steps?.length&&
  e.steps.every(x=>STATUSES.has(x.status)&&ID.test(x.id??''))&&
  new Set(e.steps.map(x=>x.id)).size===e.steps.length&&
  m.steps.every(s=>e.steps.some(x=>x.id===s.id))&&
  (!e.readyToDeliver||e.steps.every(x=>x.status==='VERIFIED'))&&
  (!e.delivered||(e.deliveryVerified===true&&e.readyToDeliver===true));
}
function criticalPath(id,steps,memo){
 if(memo.has(id))return memo.get(id);
 const dependents=steps.filter(s=>s.dependsOn.includes(id));
 const n=1+(dependents.length?Math.max(...dependents.map(s=>criticalPath(s.id,steps,memo))):0);
 memo.set(id,n);return n;
}
/**
 * Propose a *single* next action from authenticated evaluation; Host owns admission
 * and effects. 
 * @param {{mission:object,evaluation:object,now:string,capacity?:number,
 *   activeLanes?:number,remainingBudget?:number}} input
 */
export function decideMissionNext({mission,evaluation,now,capacity=1,activeLanes=0,remainingBudget=Infinity}={}){
 const nowMs=Date.parse(now??'');
 if(!Number.isFinite(nowMs)||!Number.isSafeInteger(capacity)||capacity<0||
    !Number.isSafeInteger(activeLanes)||activeLanes<0||
    (remainingBudget!==Infinity&&(!Number.isFinite(remainingBudget)||remainingBudget<0)))return red('POLICY_INVALID');
 if(!trust(mission,evaluation)||assertGraph(mission.steps))return red('EVALUATION_UNTRUSTED');
 const index=new Map(mission.steps.map((s,i)=>[s.id,i]));
 const candidates=evaluation.steps.map(v=>({...v,spec:mission.steps[index.get(v.id)]}));
 const choose=(status)=>candidates.filter(x=>x.status===status).sort((a,b)=>{
   const m=new Map(),d=criticalPath(b.id,mission.steps,m)-criticalPath(a.id,mission.steps,m);
   return d||index.get(a.id)-index.get(b.id);
 })[0];
 let action='OBSERVE',step=null,reason='mission-progress-active',requiresApproval=false;
 if(evaluation.delivered===true&&evaluation.deliveryVerified===true){action='NONE';reason='delivery-authenticated';}
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
