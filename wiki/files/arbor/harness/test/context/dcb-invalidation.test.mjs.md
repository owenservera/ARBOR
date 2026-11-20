# File: harness/test/context/dcb-invalidation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-invalidation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2990 B |
| Lines | 60 |
| Hash | 7f5163fe4950 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| T | const | 5 | no | const T=&#39;2026-11-10T06:00:00.000Z&#39;; |
| d | function | 6 | no | const d=(id,sourceRefs=[],parentRefs=[],other={})=&gt;({ id,sourceRefs,parentRefs,revision:1,status:&#39;active&#39;,expiresAt:null,...other, }); |
| records | const | 9 | no | const records=[ |
| store | function | 16 | no | const store=(items=records,truncated=false)=&gt;({list:({limit})=&gt;({items:items.slice(0,limit),truncated})}); |
| plan | function | 17 | no | const plan=(args={})=&gt;planDcbInvalidations({definitionStore:store(),at:T,...args}); |
| result | const | 20 | no | const result=plan({changedSourceRefs:[&#39;source:one&#39;]}); |
| result | const | 28 | no | const result=plan({revokedSourceRefs:[&#39;source:one&#39;]}); |
| result | const | 35 | no | const result=plan({changedSourceRefs:[&#39;source:two&#39;,&#39;source:one&#39;,&#39;source:two&#39;]}); |
| result | const | 40 | no | const result=plan({changedSourceRefs:[&#39;source:one&#39;],revokedSourceRefs:[&#39;source:two&#39;]}); |
| expiring | const | 46 | no | const expiring=d(&#39;dcb:expired&#39;,[&#39;source:x&#39;],[],{expiresAt:T}); |
| suspended | const | 47 | no | const suspended=d(&#39;dcb:suspended&#39;,[&#39;source:y&#39;],[],{status:&#39;suspended&#39;}); |
| result | const | 48 | no | const result=planDcbInvalidations({definitionStore:store([expiring,suspended]),at:T}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/context/dcb-invalidation.mjs | import | 3 | [harness/src/context/dcb-invalidation.mjs](../../src/context/dcb-invalidation.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { planDcbInvalidations } from '../../src/context/dcb-invalidation.mjs';

const T='2026-11-10T06:00:00.000Z';
const d=(id,sourceRefs=[],parentRefs=[],other={})=>({
  id,sourceRefs,parentRefs,revision:1,status:'active',expiresAt:null,...other,
});
const records=[
  d('dcb:a',['source:one']),
  d('dcb:b',['source:two']),
  d('dcb:ab',[],['dcb:a','dcb:b']),
  d('dcb:outer',[],['dcb:ab']),
  d('dcb:other',['source:other']),
];
const store=(items=records,truncated=false)=>({list:({limit})=>({items:items.slice(0,limit),truncated})});
const plan=(args={})=>planDcbInvalidations({definitionStore:store(),at:T,...args});

test('source change invalidates only dependent DCB ancestry',()=>{
  const result=plan({changedSourceRefs:['source:one']});
  assert.equal(result.status,'planning_only');
  assert.deepEqual(result.jobs.map(j=>[j.bundleId,j.status]),[
    ['dcb:a','stale'],['dcb:ab','stale'],['dcb:outer','stale'],
  ]);
  assert.equal(result.isSendAuthorized,false);
});
test('source revocation blocks ancestors and composites, never creates a grant',()=>{
  const result=plan({revokedSourceRefs:['source:one']});
  assert.deepEqual(result.jobs.map(j=>[j.bundleId,j.status]),[
    ['dcb:a','blocked'],['dcb:ab','blocked'],['dcb:outer','blocked'],
  ]);
  assert.deepEqual(result.jobs.find(j=>j.bundleId==='dcb:ab').reasons,['blocked_parent']);
});
test('multi-parent changes remain stable and deduplicated',()=>{
  const result=plan({changedSourceRefs:['source:two','source:one','source:two']});
  assert.deepEqual(result.jobs.map(j=>j.bundleId),['dcb:a','dcb:ab','dcb:b','dcb:outer']);
  assert.equal(result.jobCount,4);
});
test('blocked parent overrides stale child through dependency graph',()=>{
  const result=plan({changedSourceRefs:['source:one'],revokedSourceRefs:['source:two']});
  assert.equal(result.jobs.find(j=>j.bundleId==='dcb:ab').status,'blocked');
  assert.equal(result.jobs.find(j=>j.bundleId==='dcb:outer').status,'blocked');
});
test('no changes produces no work, but expiry and suspension still block',()=>{
  assert.equal(plan().jobCount,0);
  const expiring=d('dcb:expired',['source:x'],[],{expiresAt:T});
  const suspended=d('dcb:suspended',['source:y'],[],{status:'suspended'});
  const result=planDcbInvalidations({definitionStore:store([expiring,suspended]),at:T});
  assert.deepEqual(result.jobs.map(j=>j.status),['blocked','blocked']);
});
test('missing ancestry, incomplete enumeration and excessive work fail closed',()=>{
  assert.throws(()=>planDcbInvalidations({
    definitionStore:store([d('dcb:orphan',[],['dcb:missing'])]),at:T,
  }),{code:'DCB_INVALIDATION_PARENT'});
  assert.throws(()=>planDcbInvalidations({
    definitionStore:store(records,true),at:T,
  }),{code:'DCB_INVALIDATION_STORE'});
  assert.throws(()=>plan({changedSourceRefs:['source:one'],limit:1}),
    {code:'DCB_INVALIDATION_LIMIT'});
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
