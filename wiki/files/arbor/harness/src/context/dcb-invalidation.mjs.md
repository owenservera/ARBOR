# File: harness/src/context/dcb-invalidation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-invalidation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4380 B |
| Lines | 84 |
| Hash | 4688a75db16c |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_INVALIDATION_SCHEMA | const | 4 | yes | export const DCB_INVALIDATION_SCHEMA=&#39;vivim.dcb-invalidation-plan/1&#39;; |
| REF | const | 5 | no | const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| fail | function | 6 | no | const fail=(code,message)=&gt;Object.assign(new Error(message),{code}); |
| refs | function | 7 | no | function refs(arr,label) { |
| planDcbInvalidations | function | 12 | yes | export function planDcbInvalidations({ definitionStore, changedSourceRefs=[], revokedSourceRefs=[], revokedBundleIds=[], changedBundleIds=[], at, limit=500 }={}) { |
| changed | const | 18 | no | const changed=new Set(refs(changedSourceRefs,&#39;changedSourceRefs&#39;)); |
| revoked | const | 19 | no | const revoked=new Set(refs(revokedSourceRefs,&#39;revokedSourceRefs&#39;)); |
| revokedBundles | const | 20 | no | const revokedBundles=new Set(refs(revokedBundleIds,&#39;revokedBundleIds&#39;)); |
| changedBundles | const | 21 | no | const changedBundles=new Set(refs(changedBundleIds,&#39;changedBundleIds&#39;)); |
| listed | const | 22 | no | const listed=definitionStore.list({limit:500}); |
| nodes | const | 25 | no | const nodes=new Map(), children=new Map(); |
| arr | const | 34 | no | const arr=children.get(p)??[]; |
| states | const | 39 | no | const states=new Map(), queue=[]; |
| mark | function | 40 | no | const mark=(id,status,reason)=&gt;{ |
| old | const | 41 | no | const old=states.get(id); |
| id | const | 61 | no | const id=queue.shift(); |
| state | const | 62 | no | const state=states.get(id); |
| next | const | 64 | no | const next=state.status===&#39;blocked&#39;?&#39;blocked&#39;:&#39;stale&#39;; |
| prev | const | 65 | no | const prev=states.get(child); |
| prevStatus | const | 66 | no | const prevStatus=prev?.status; |
| reason | const | 67 | no | const reason=next===&#39;blocked&#39;?&#39;blocked_parent&#39;:&#39;changed_parent&#39;; |
| jobs | const | 75 | no | const jobs=[...states].map(([bundleId,value])=&gt;({ bundleId,status:value.status,reasons:[...value.reasons].sort(), definitionRevision:nodes.get(bundleId).revision, })).sort((a,b)=&gt;a.bundleId.localeCom… |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/context/dcb-maintenance.mjs](./dcb-maintenance.mjs.md) | ./dcb-invalidation.mjs |
| [harness/test/context/dcb-graph-lineage.test.mjs](../../test/context/dcb-graph-lineage.test.mjs.md) | ../../src/context/dcb-invalidation.mjs |
| [harness/test/context/dcb-invalidation.test.mjs](../../test/context/dcb-invalidation.test.mjs.md) | ../../src/context/dcb-invalidation.mjs |
| [studio/src/agents/dcb-context-runtime.mjs](../../../studio/src/agents/dcb-context-runtime.mjs.md) | ../../../harness/src/context/dcb-invalidation.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure DCB background invalidation planner. No polling, timers, source reads,
// persistence, graph writer or provider effects. Host owns authenticated source
// observations, enqueue/replay, disclosure and execution of recomputation.
export const DCB_INVALIDATION_SCHEMA='vivim.dcb-invalidation-plan/1';
const REF=/^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const fail=(code,message)=>Object.assign(new Error(message),{code});
function refs(arr,label) {
  if(!Array.isArray(arr)||arr.length>500||arr.some(x=>typeof x!=='string'||!REF.test(x)))
    throw fail('DCB_INVALIDATION_INPUT','Invalid '+label);
  return [...new Set(arr)].sort();
}
export function planDcbInvalidations({ definitionStore, changedSourceRefs=[],
  revokedSourceRefs=[], revokedBundleIds=[], changedBundleIds=[], at, limit=500 }={}) {
  if(typeof definitionStore?.list!=='function') throw fail('DCB_INVALIDATION_STORE','Scoped definition store required');
  if(typeof at!=='string'||!Number.isFinite(Date.parse(at))||new Date(at).toISOString()!==at)
    throw fail('DCB_INVALIDATION_TIME','Pinned UTC timestamp required');
  if(!Number.isSafeInteger(limit)||limit<1||limit>500) throw fail('DCB_INVALIDATION_LIMIT','Bounded limit required');
  const changed=new Set(refs(changedSourceRefs,'changedSourceRefs'));
  const revoked=new Set(refs(revokedSourceRefs,'revokedSourceRefs'));
  const revokedBundles=new Set(refs(revokedBundleIds,'revokedBundleIds'));
  const changedBundles=new Set(refs(changedBundleIds,'changedBundleIds'));
  const listed=definitionStore.list({limit:500});
  if(!listed || listed.truncated || !Array.isArray(listed.items))
    throw fail('DCB_INVALIDATION_STORE','Incomplete definition enumeration');
  const nodes=new Map(), children=new Map();
  for(const d of listed.items) {
    if(typeof d.id!=='string'||!REF.test(d.id)||nodes.has(d.id))
      throw fail('DCB_INVALIDATION_STORE','Invalid or duplicate definition');
    nodes.set(d.id,d);
  }
  for(const d of nodes.values()) {
    for(const p of d.parentRefs??[]) {
      if(!nodes.has(p)) throw fail('DCB_INVALIDATION_PARENT','Missing parent definition');
      const arr=children.get(p)??[];
      arr.push(d.id);
      children.set(p,arr);
    }
  }
  const states=new Map(), queue=[];
  const mark=(id,status,reason)=>{
    const old=states.get(id);
    if(!old) {
      states.set(id,{status,reasons:new Set([reason])});
      queue.push(id);
    } else {
      if(status==='blocked') old.status='blocked';
      old.reasons.add(reason);
    }
  };
  for(const d of nodes.values()) {
    if(d.status!=='active') mark(d.id,'blocked',d.status);
    if(d.expiresAt && at>=d.expiresAt) mark(d.id,'blocked','expired');
    if(revokedBundles.has(d.id)) mark(d.id,'blocked','bundle_revoked');
    if(changedBundles.has(d.id)) mark(d.id,'stale','bundle_changed');
    if((d.sourceRefs??[]).some(x=>revoked.has(x))) mark(d.id,'blocked','source_revoked');
    if((d.sourceRefs??[]).some(x=>changed.has(x))) mark(d.id,'stale','source_changed');
  }
  // Graph propagation: a changed parent dirties descendants. A blocked parent
  // blocks descendants. No alternative path can widen a permission.
  while(queue.length) {
    const id=queue.shift();
    const state=states.get(id);
    for(const child of (children.get(id)??[]).sort()) {
      const next=state.status==='blocked'?'blocked':'stale';
      const prev=states.get(child);
      const prevStatus=prev?.status;
      const reason=next==='blocked'?'blocked_parent':'changed_parent';
      mark(child,next,reason);
      // Only re-enqueue when a previously stale child becomes blocked. mark()
      // already enqueues new nodes.
      if(prev && prevStatus!=='blocked' && state.status==='blocked') queue.push(child);
    }
    if(queue.length>500*500) throw fail('DCB_INVALIDATION_CYCLE','Unbounded propagation');
  }
  const jobs=[...states].map(([bundleId,value])=>({
    bundleId,status:value.status,reasons:[...value.reasons].sort(),
    definitionRevision:nodes.get(bundleId).revision,
  })).sort((a,b)=>a.bundleId.localeCompare(b.bundleId));
  if(jobs.length>limit) throw fail('DCB_INVALIDATION_LIMIT','Plan exceeds requested limit');
  return Object.freeze({
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
