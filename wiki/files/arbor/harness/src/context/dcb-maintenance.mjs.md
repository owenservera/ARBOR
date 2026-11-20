# File: harness/src/context/dcb-maintenance.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-maintenance.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8790 B |
| Lines | 163 |
| Hash | 7a80c8cdb5db |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_MAINTENANCE_SCHEMA | const | 8 | yes | export const DCB_MAINTENANCE_SCHEMA=&#39;vivim.dcb-maintenance-state/1&#39;; |
| DCB_MAINTENANCE_EVENT_SCHEMA | const | 9 | yes | export const DCB_MAINTENANCE_EVENT_SCHEMA=&#39;vivim.dcb-maintenance-event/1&#39;; |
| REF | const | 10 | no | const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| SHA | const | 11 | no | const SHA=/^[a-f0-9]{64}$/; |
| STATES | const | 12 | no | const STATES=new Set([&#39;queued&#39;,&#39;claimed&#39;,&#39;prepared&#39;,&#39;blocked&#39;,&#39;failed&#39;]); |
| KINDS | const | 13 | no | const KINDS=new Set([&#39;change&#39;,&#39;tick&#39;,&#39;job.claim&#39;,&#39;job.prepared&#39;,&#39;job.failed&#39;]); |
| fail | function | 14 | no | const fail=(code,msg)=&gt;Object.assign(new Error(msg),{code}); |
| checkRef | function | 15 | no | const checkRef=(x,name)=&gt;{if(typeof x!==&#39;string&#39;\|\|!REF.test(x))throw fail(&#39;DCB_MAINTENANCE_REF&#39;,&#39;Invalid &#39;+name);return x}; |
| iso | function | 16 | no | const iso=x=&gt;typeof x===&#39;string&#39;&amp;&amp;Number.isFinite(Date.parse(x))&amp;&amp;new Date(x).toISOString()===x; |
| sorted | function | 17 | no | const sorted=x=&gt;[...new Set(x)].sort(); |
| canonical | function | 18 | no | const canonical=x=&gt;Array.isArray(x)?x.map(canonical):x&amp;&amp;typeof x===&#39;object&#39;? |
| digest | function | 20 | no | const digest=x=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(x))).digest(&#39;hex&#39;); |
| MAX_JOBS | const | 21 | no | const MAX_JOBS=500; |
| checkState | function | 22 | no | function checkState(state) { |
| seen | const | 29 | no | const seen=new Set(); |
| createDcbMaintenanceState | function | 42 | yes | export function createDcbMaintenanceState({at}={}) { |
| validEvent | function | 47 | no | function validEvent(event) { |
| names | const | 51 | no | const names=[&#39;changedSourceRefs&#39;,&#39;revokedSourceRefs&#39;,&#39;changedBundleIds&#39;,&#39;revokedBundleIds&#39;]; |
| items | const | 53 | no | const items=event[name]??[]; |
| jobIndex | function | 74 | no | function jobIndex(jobs,id){return jobs.findIndex(j=&gt;j.bundleId===id)} |
| touch | function | 75 | no | function touch(jobs,row){ |
| ix | variable | 76 | no | let ix=jobIndex(jobs,row.bundleId); |
| prev | const | 83 | no | const prev=jobs[ix]; |
| status | const | 86 | no | const status=prev.status===&#39;blocked&#39;\|\|row.status===&#39;blocked&#39;?&#39;blocked&#39;:&#39;queued&#39;; |
| reduceDcbMaintenance | function | 91 | yes | export function reduceDcbMaintenance(state,event,{definitionStore}={}) { |
| eventDigest | const | 94 | no | const eventDigest=digest(event); |
| jobs | const | 101 | no | const jobs=state.jobs.map(x=&gt;({...x,reasons:[...x.reasons]})); |
| plan | const | 103 | no | const plan=planDcbInvalidations({ definitionStore,at:event.at,limit:MAX_JOBS, changedSourceRefs:event.changedSourceRefs??[], revokedSourceRefs:event.revokedSourceRefs??[], changedBundleIds:event.chan… |
| ix | const | 112 | no | const ix=jobIndex(jobs,event.bundleId); |
| job | const | 114 | no | const job=jobs[ix]; |
| recoverDcbMaintenance | function | 139 | yes | export function recoverDcbMaintenance(state,{at}={}) { |
| changed | variable | 143 | no | let changed=false; |
| jobs | const | 144 | no | const jobs=state.jobs.map(row=&gt;{ if(row.status!==&#39;claimed&#39;)return {...row,reasons:[...row.reasons]}; changed=true; return {...row,status:row.attempts&gt;=3?&#39;failed&#39;:&#39;queued&#39;, leaseRef:null,materializati… |
| pendingDcbMaintenance | function | 153 | yes | export function pendingDcbMaintenance(state,{limit=20}={}) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 5 | external |
| ./dcb-invalidation.mjs | import | 6 | [harness/src/context/dcb-invalidation.mjs](./dcb-invalidation.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/context/dcb-maintenance.test.mjs](../../test/context/dcb-maintenance.test.mjs.md) | ../../src/context/dcb-maintenance.mjs |
| [studio/src/agents/dcb-context-runtime.mjs](../../../studio/src/agents/dcb-context-runtime.mjs.md) | ../../../harness/src/context/dcb-maintenance.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// DCB v2 background maintenance reducer, designed to be invoked by an EXISTING
// Host event loop. No scheduler, timer, I/O, separate journal, browser or provider
// effects. Host persists each new state using its canonical CAS store and supplies
// monotonically sequenced events from its authenticated event source.
import { createHash } from 'node:crypto';
import { planDcbInvalidations } from './dcb-invalidation.mjs';

export const DCB_MAINTENANCE_SCHEMA='vivim.dcb-maintenance-state/1';
export const DCB_MAINTENANCE_EVENT_SCHEMA='vivim.dcb-maintenance-event/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const SHA=/^[a-f0-9]{64}$/;
const STATES=new Set(['queued','claimed','prepared','blocked','failed']);
const KINDS=new Set(['change','tick','job.claim','job.prepared','job.failed']);
const fail=(code,msg)=>Object.assign(new Error(msg),{code});
const checkRef=(x,name)=>{if(typeof x!=='string'||!REF.test(x))throw fail('DCB_MAINTENANCE_REF','Invalid '+name);return x};
const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const sorted=x=>[...new Set(x)].sort();
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?
  Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const MAX_JOBS=500;
function checkState(state) {
  if(!state||state.schema!==DCB_MAINTENANCE_SCHEMA
    ||!Number.isSafeInteger(state.revision)||state.revision<1
    ||!Number.isSafeInteger(state.cursor?.sequence)||state.cursor.sequence<0
    ||(state.cursor.sequence>0&&!SHA.test(state.cursor.digest??''))
    ||!Array.isArray(state.jobs)||state.jobs.length>MAX_JOBS||!iso(state.updatedAt))
    throw fail('DCB_MAINTENANCE_STATE','Invalid maintenance state');
  const seen=new Set();
  for(const job of state.jobs){
    if(!job||!REF.test(job.bundleId)||seen.has(job.bundleId)
      ||!STATES.has(job.status)||!Number.isSafeInteger(job.definitionRevision)
      ||job.definitionRevision<1||!Number.isSafeInteger(job.attempts)||job.attempts<0
      ||job.attempts>3||!Array.isArray(job.reasons)
      ||job.reasons.length>30||job.reasons.some(x=>typeof x!=='string'||!REF.test(x))
      ||(job.status==='claimed'&&!REF.test(job.leaseRef??'')))
      throw fail('DCB_MAINTENANCE_STATE','Invalid queued job');
    seen.add(job.bundleId);
  }
  return state;
}
export function createDcbMaintenanceState({at}={}) {
  if(!iso(at))throw fail('DCB_MAINTENANCE_TIME','Pinned UTC time required');
  return {schema:DCB_MAINTENANCE_SCHEMA,revision:1,
    cursor:{sequence:0,digest:null},jobs:[],updatedAt:at};
}
function validEvent(event) {
  if(!event||event.schema!==DCB_MAINTENANCE_EVENT_SCHEMA||!KINDS.has(event.kind)
    ||!Number.isSafeInteger(event.sequence)||event.sequence<1||!iso(event.at))
    throw fail('DCB_MAINTENANCE_EVENT','Invalid sequenced Host event');
  const names=['changedSourceRefs','revokedSourceRefs','changedBundleIds','revokedBundleIds'];
  if(event.kind==='change')for(const name of names){
    const items=event[name]??[];
    if(!Array.isArray(items)||items.length>500)throw fail('DCB_MAINTENANCE_EVENT','Invalid change refs');
    for(const item of items)checkRef(item,name);
  }
  if(event.kind.startsWith('job.')){
    checkRef(event.bundleId,'bundleId');
    checkRef(event.leaseRef,'leaseRef');
  }
  if(event.kind==='job.claim'){
    if(!Number.isSafeInteger(event.expectedDefinitionRevision)||event.expectedDefinitionRevision<1)
      throw fail('DCB_MAINTENANCE_EVENT','Expected definition revision required');
  }
  if(event.kind==='job.prepared'){
    if(!SHA.test(event.materializationDigest??'')||!REF.test(event.proofRef??''))
      throw fail('DCB_MAINTENANCE_EVENT','Materialization receipt digest/ID required');
  }
  if(event.kind==='job.failed'&&!['source_unavailable','stale_revision','hash_mismatch',
    'over_budget','permission_revoked','unknown_error'].includes(event.reason))
    throw fail('DCB_MAINTENANCE_EVENT','Unknown failure category');
  return event;
}
function jobIndex(jobs,id){return jobs.findIndex(j=>j.bundleId===id)}
function touch(jobs,row){
  let ix=jobIndex(jobs,row.bundleId);
  if(ix<0){
    if(jobs.length>=MAX_JOBS)throw fail('DCB_MAINTENANCE_FULL','Backpressure: queue full');
    jobs.push({...row,status:row.status==='stale'?'queued':row.status,reasons:sorted(row.reasons),attempts:0,leaseRef:null,
      materializationDigest:null,proofRef:null});
```

_First 80 of 164 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
