# File: harness/test/context/dcb-maintenance.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-maintenance.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5331 B |
| Lines | 87 |
| Hash | 10101abeb7a7 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 8 | no | const AT=&#39;2026-11-10T06:00:00.000Z&#39;, LATER=&#39;2026-11-10T06:01:00.000Z&#39;; |
| SHA | const | 9 | no | const SHA=createHash(&#39;sha256&#39;).update(&#39;verified local projection&#39;).digest(&#39;hex&#39;); |
| defs | const | 10 | no | const defs=[ |
| definitionStore | const | 15 | no | const definitionStore={list:()=&gt;({items:defs,truncated:false})}; |
| E | function | 16 | no | const E=(sequence,kind,extra={})=&gt;({schema:DCB_MAINTENANCE_EVENT_SCHEMA,sequence,kind,at:AT,...extra}); |
| initial | function | 17 | no | const initial=()=&gt;createDcbMaintenanceState({at:AT}); |
| reduce | function | 18 | no | const reduce=(state,event)=&gt;reduceDcbMaintenance(state,event,{definitionStore}); |
| state | const | 20 | no | const state=reduce(initial(),E(1,&#39;change&#39;,{changedSourceRefs:[&#39;source:one&#39;]})); |
| event | const | 27 | no | const event=E(1,&#39;change&#39;,{changedSourceRefs:[&#39;source:one&#39;]}); |
| state | const | 28 | no | const state=reduce(initial(),event); |
| first | const | 35 | no | const first=reduce(initial(),E(1,&#39;change&#39;,{changedSourceRefs:[&#39;source:one&#39;]})); |
| claimed | const | 36 | no | const claimed=reduce(first,E(2,&#39;job.claim&#39;,{bundleId:&#39;dcb:a&#39;, leaseRef:&#39;lease:one&#39;,expectedDefinitionRevision:1})); |
| prepared | const | 39 | no | const prepared=reduce(claimed,E(3,&#39;job.prepared&#39;,{bundleId:&#39;dcb:a&#39;,leaseRef:&#39;lease:one&#39;, materializationDigest:SHA,proofRef:&#39;receipt:one&#39;})); |
| s | variable | 46 | no | let s=reduce(initial(),E(1,&#39;change&#39;,{changedSourceRefs:[&#39;source:one&#39;]})); |
| s | variable | 55 | no | let s=reduce(initial(),E(1,&#39;change&#39;,{changedSourceRefs:[&#39;source:one&#39;]})); |
| next | const | 57 | no | const next=recoverDcbMaintenance(s,{at:LATER}); |
| s | variable | 63 | no | let s=reduce(initial(),E(1,&#39;change&#39;,{changedSourceRefs:[&#39;source:one&#39;]})); |
| lease | const | 65 | no | const lease=&#39;lease:&#39;+i; |
| s | variable | 74 | no | let s=reduce(initial(),E(1,&#39;change&#39;,{changedSourceRefs:[&#39;source:one&#39;]})); |
| s | const | 82 | no | const s=initial(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../../src/context/dcb-maintenance.mjs | import | 4 | [harness/src/context/dcb-maintenance.mjs](../../src/context/dcb-maintenance.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createDcbMaintenanceState,reduceDcbMaintenance,recoverDcbMaintenance,
  pendingDcbMaintenance,DCB_MAINTENANCE_EVENT_SCHEMA,
} from '../../src/context/dcb-maintenance.mjs';
const AT='2026-11-10T06:00:00.000Z', LATER='2026-11-10T06:01:00.000Z';
const SHA=createHash('sha256').update('verified local projection').digest('hex');
const defs=[
  {id:'dcb:a',revision:1,status:'active',sourceRefs:['source:one'],parentRefs:[],expiresAt:null},
  {id:'dcb:b',revision:1,status:'active',sourceRefs:['source:two'],parentRefs:[],expiresAt:null},
  {id:'dcb:ab',revision:1,status:'active',sourceRefs:[],parentRefs:['dcb:a','dcb:b'],expiresAt:null},
];
const definitionStore={list:()=>({items:defs,truncated:false})};
const E=(sequence,kind,extra={})=>({schema:DCB_MAINTENANCE_EVENT_SCHEMA,sequence,kind,at:AT,...extra});
const initial=()=>createDcbMaintenanceState({at:AT});
const reduce=(state,event)=>reduceDcbMaintenance(state,event,{definitionStore});
test('source change enqueues a bundle and all dependent composite projections',()=>{
  const state=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  assert.deepEqual(state.jobs.map(j=>[j.bundleId,j.status]),
    [['dcb:a','queued'],['dcb:ab','queued']]);
  assert.deepEqual(pendingDcbMaintenance(state).jobs.map(j=>j.bundleId),['dcb:a','dcb:ab']);
  assert.equal(pendingDcbMaintenance(state).isSendAuthorized,false);
});
test('identical replay is idempotent, divergent or missing sequence fails closed',()=>{
  const event=E(1,'change',{changedSourceRefs:['source:one']});
  const state=reduce(initial(),event);
  assert.strictEqual(reduce(state,event),state);
  assert.throws(()=>reduce(state,E(1,'change',{changedSourceRefs:['source:two']})),
    {code:'DCB_MAINTENANCE_REPLAY'});
  assert.throws(()=>reduce(state,E(3,'tick')),{code:'DCB_MAINTENANCE_GAP'});
});
test('claim + verified prepared metadata transitions but never authorizes sending',()=>{
  const first=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  const claimed=reduce(first,E(2,'job.claim',{bundleId:'dcb:a',
    leaseRef:'lease:one',expectedDefinitionRevision:1}));
  assert.equal(claimed.jobs.find(j=>j.bundleId==='dcb:a').status,'claimed');
  const prepared=reduce(claimed,E(3,'job.prepared',{bundleId:'dcb:a',leaseRef:'lease:one',
    materializationDigest:SHA,proofRef:'receipt:one'}));
  assert.equal(prepared.jobs.find(j=>j.bundleId==='dcb:a').status,'prepared');
  assert.ok(!Object.hasOwn(prepared,'sendAuthorized'));
  assert.deepEqual(pendingDcbMaintenance(prepared).jobs.map(j=>j.bundleId),['dcb:ab']);
});
test('revocation overrides a prior local preparation and propagates blockage',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  s=reduce(s,E(2,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:one',expectedDefinitionRevision:1}));
  s=reduce(s,E(3,'job.prepared',{bundleId:'dcb:a',leaseRef:'lease:one',
    materializationDigest:SHA,proofRef:'receipt:one'}));
  s=reduce(s,E(4,'change',{revokedSourceRefs:['source:one']}));
  assert.deepEqual(s.jobs.map(j=>j.status),['blocked','blocked']);
  assert.equal(s.jobs[0].materializationDigest,null);
});
test('restart recovers local compute lease without replaying provider actions',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  s=reduce(s,E(2,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:one',expectedDefinitionRevision:1}));
  const next=recoverDcbMaintenance(s,{at:LATER});
  assert.equal(next.jobs.find(j=>j.bundleId==='dcb:a').status,'queued');
  assert.equal(next.jobs.find(j=>j.bundleId==='dcb:a').leaseRef,null);
  assert.equal(next.cursor.sequence,2);
});
test('permission failure blocks and repeated pure computation failures stop at three',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  for(let i=0;i<3;i++){
    const lease='lease:'+i;
    s=reduce(s,E(2+i*2,'job.claim',{bundleId:'dcb:a',leaseRef:lease,expectedDefinitionRevision:1}));
    s=reduce(s,E(3+i*2,'job.failed',{bundleId:'dcb:a',leaseRef:lease,reason:'source_unavailable'}));
  }
  assert.equal(s.jobs.find(j=>j.bundleId==='dcb:a').status,'failed');
  assert.throws(()=>reduce(s,E(8,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:new',
    expectedDefinitionRevision:1})),{code:'DCB_MAINTENANCE_CONFLICT'});
});
test('stale lease cannot mark previously invalidated bundle prepared',()=>{
  let s=reduce(initial(),E(1,'change',{changedSourceRefs:['source:one']}));
  s=reduce(s,E(2,'job.claim',{bundleId:'dcb:a',leaseRef:'lease:one',expectedDefinitionRevision:1}));
  s=reduce(s,E(3,'change',{changedBundleIds:['dcb:a']}));
  assert.throws(()=>reduce(s,E(4,'job.prepared',{bundleId:'dcb:a',
    leaseRef:'lease:one',materializationDigest:SHA,proofRef:'receipt:one'})),
    {code:'DCB_MAINTENANCE_CONFLICT'});
});
```

_First 80 of 88 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
