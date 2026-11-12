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
    ['dcb:combined','blocked'],['dcb:one','blocked'],
  ]);
  assert.equal(updated.isSendAuthorized,false);
});
