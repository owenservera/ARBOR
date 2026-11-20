# File: harness/test/context/dcb-graph-lineage.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-graph-lineage.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4532 B |
| Lines | 84 |
| Hash | 789b6d975a36 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| at | const | 6 | no | const at = &#39;2026-11-10T06:00:00.000Z&#39;; |
| fixture | function | 7 | no | function fixture(ownerRef=&#39;owner:one&#39;) { |
| defs | const | 8 | no | const defs = new Map([ [&#39;dcb:one&#39;, {id:&#39;dcb:one&#39;,ownerRef,mode:&#39;persistent&#39;,revision:1,status:&#39;active&#39;,sourceRefs:[&#39;fact:alpha&#39;],parentRefs:[]}], [&#39;dcb:two&#39;, {id:&#39;dcb:two&#39;,ownerRef,mode:&#39;session&#39;,rev… |
| store | const | 13 | no | const store = { |
| f | const | 21 | no | const f=fixture(); |
| result | const | 22 | no | const result=projectDcbGraphLineage(f.input); |
| serialized | const | 29 | no | const serialized=JSON.stringify(result); |
| root | const | 32 | no | const root=result.rootId; |
| a | const | 36 | no | const a=projectDcbGraphLineage(fixture().input), again=projectDcbGraphLineage(fixture().input); |
| b | const | 37 | no | const b=projectDcbGraphLineage(fixture(&#39;owner:two&#39;).input); |
| f | const | 44 | no | const f=fixture(); |
| reads | variable | 45 | no | let reads=0; |
| f | const | 52 | no | const f=fixture();f.defs.get(&#39;dcb:two&#39;).ownerRef=&#39;owner:other&#39;; |
| f | const | 56 | no | const f=fixture();f.defs.get(&#39;dcb:one&#39;).sourceRefs=[]; |
| f | const | 62 | no | const f=fixture(); |
| out | const | 65 | no | const out=projectDcbGraphLineage(f.input); |
| f | const | 71 | no | const f=fixture(); |
| graph | const | 73 | no | const graph=projectDcbGraphLineage(f.input); |
| updated | const | 75 | no | const updated=planDcbInvalidations({definitionStore:f.store,changedSourceRefs:[&#39;fact:alpha&#39;],at}); |
| revoked | const | 79 | no | const revoked=planDcbInvalidations({definitionStore:f.store,revokedSourceRefs:[&#39;fact:alpha&#39;],at}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/context/dcb-graph-lineage.mjs | import | 3 | [harness/src/context/dcb-graph-lineage.mjs](../../src/context/dcb-graph-lineage.mjs.md) |
| ../../src/context/dcb-invalidation.mjs | import | 4 | [harness/src/context/dcb-invalidation.mjs](../../src/context/dcb-invalidation.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { projectDcbGraphLineage } from '../../src/context/dcb-graph-lineage.mjs';
import { planDcbInvalidations } from '../../src/context/dcb-invalidation.mjs';

const at = '2026-11-10T06:00:00.000Z';
function fixture(ownerRef='owner:one') {
  const defs = new Map([
    ['dcb:one', {id:'dcb:one',ownerRef,mode:'persistent',revision:1,status:'active',sourceRefs:['fact:alpha'],parentRefs:[]}],
    ['dcb:two', {id:'dcb:two',ownerRef,mode:'session',revision:1,status:'active',sourceRefs:['fact:beta'],parentRefs:[]}],
    ['dcb:combined', {id:'dcb:combined',ownerRef,mode:'composite',revision:1,status:'active',sourceRefs:[],parentRefs:['dcb:one','dcb:two']}],
  ]);
  const store = {
    get: id => defs.get(id),
    resolve: id => ({bundleId:id,sourceRefs:['fact:alpha','fact:beta'],flavorRefs:[],
      dependencies:[...defs.values()].map(d=>({ref:d.id,revision:d.revision}))}),
  };
  return {defs,store, input:{definitionStore:store,bundleId:'dcb:combined',ownerRef,at}};
}
test('projects source -> leaf -> composite invalidation edges without exporting private refs',()=>{
  const f=fixture();
  const result=projectDcbGraphLineage(f.input);
  assert.equal(result.nodes.length,5);
  assert.equal(result.edges.length,4);
  assert.equal(result.nodes.filter(n=>n.kind==='context-source').length,2);
  assert.equal(result.effectsAuthorized,false);
  assert.equal(result.authority,'read_only_projection');
  assert.equal(result.complete,true);
  const serialized=JSON.stringify(result);
  for (const secret of ['owner:one','fact:alpha','fact:beta','dcb:one','dcb:two','dcb:combined'])
    assert.equal(serialized.includes(secret),false,secret);
  const root=result.rootId;
  assert.equal(result.edges.filter(e=>e.to===root).length,2);
});
test('opaque graph identities are deterministic and owner-separated',()=>{
  const a=projectDcbGraphLineage(fixture().input), again=projectDcbGraphLineage(fixture().input);
  const b=projectDcbGraphLineage(fixture('owner:two').input);
  assert.deepEqual(a,again);
  assert.notEqual(a.namespaceId,b.namespaceId);
  assert.notEqual(a.rootId,b.rootId);
  assert.notEqual(a.revisionDigest,b.revisionDigest);
});
test('changed definition revision fails instead of publishing stale lineage',()=>{
  const f=fixture();
  let reads=0;
  f.store.resolve=()=>{reads++;if(reads===2) f.defs.get('dcb:one').revision=2;
    return {sourceRefs:['fact:alpha','fact:beta'],flavorRefs:[],
      dependencies:[...f.defs.values()].map(d=>({ref:d.id,revision:d.revision}))};};
  assert.throws(()=>projectDcbGraphLineage(f.input),{code:'DCB_GRAPH_DRIFT'});
});
test('cross-owner dependency fails closed',()=>{
  const f=fixture();f.defs.get('dcb:two').ownerRef='owner:other';
  assert.throws(()=>projectDcbGraphLineage(f.input),{code:'DCB_GRAPH_OWNER'});
});
test('missing source ancestry and inactive bundle refuse graph projection',()=>{
  const f=fixture();f.defs.get('dcb:one').sourceRefs=[];
  assert.throws(()=>projectDcbGraphLineage(f.input),{code:'DCB_GRAPH_DEPENDENCY'});
  f.defs.get('dcb:one').sourceRefs=['fact:alpha'];f.defs.get('dcb:one').status='retired';
  assert.throws(()=>projectDcbGraphLineage(f.input),{code:'DCB_GRAPH_DRIFT'});
});
test('inputs are bounded and no callback can authorize effects',()=>{
  const f=fixture();
  assert.throws(()=>projectDcbGraphLineage({...f.input,ownerRef:''}),{code:'DCB_GRAPH_INPUT'});
  assert.throws(()=>projectDcbGraphLineage({...f.input,at:'not-a-time'}),{code:'DCB_GRAPH_INPUT'});
  const out=projectDcbGraphLineage(f.input);
  assert.equal(Object.hasOwn(out,'send'),false);
  assert.equal(Object.hasOwn(out,'authorize'),false);
});

test('one changed personal fact dirties its leaf and composite, never unrelated sibling',()=>{
  const f=fixture();
  f.store.list=()=>({items:[...f.defs.values()],truncated:false});
  const graph=projectDcbGraphLineage(f.input);
  assert.equal(graph.edges.length,4);
  const updated=planDcbInvalidations({definitionStore:f.store,changedSourceRefs:['fact:alpha'],at});
  assert.deepEqual(updated.jobs.map(j=>[j.bundleId,j.status]),[
    ['dcb:combined','stale'],['dcb:one','stale'],
  ]);
  const revoked=planDcbInvalidations({definitionStore:f.store,revokedSourceRefs:['fact:alpha'],at});
  assert.deepEqual(revoked.jobs.map(j=>[j.bundleId,j.status]),[
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
