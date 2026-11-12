import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDcbSources } from '../../src/context/dcb-source-selection.mjs';
const T='2026-11-10T06:00:00.000Z';
const src=(ref,keywords,options={})=>({
  ref,keywords,classification:'source',trust:'sourced',updatedAt:T,...options,
});
const run=(options={})=>selectDcbSources({
  bundleSourceRefs:['source:launch','source:legacy','source:research','source:duplicate'],
  sourceCandidates:[
    src('source:launch',['launch','decision'],{entityRef:'entity:product',trust:'owner_confirmed'}),
    src('source:legacy',['old','history'],{status:'historical'}),
    src('source:research',['research','evidence'],{entityRef:'entity:study'}),
    src('source:duplicate',['launch','product'],{entityRef:'entity:product'}),
  ],taskText:'Launch research decision',now:T,maxSources:2,...options,
});
test('bounded adaptive selection picks relevant diverse sources',()=>{
  const result=run();
  assert.equal(result.mode,'adaptive');
  assert.equal(result.selectedCount,2);
  assert.deepEqual(result.selectedRefs,['source:launch','source:research']);
  assert.equal(result.isSendAuthorized,false);
});
test('mandatory sources win but may never leave bundle scope or violate budget',()=>{
  const one=run({maxSources:1,mandatorySourceRefs:['source:legacy']});
  assert.deepEqual(one.selectedRefs,['source:legacy']);
  assert.throws(()=>run({maxSources:1,mandatorySourceRefs:['source:launch','source:legacy']}),
    {code:'DCB_SELECTION_BUDGET'});
  assert.throws(()=>run({mandatorySourceRefs:['source:not-in-bundle']}),
    {code:'DCB_SELECTION_REQUIRED'});
});
test('revoked and superseded source refs never enter normal selection',()=>{
  const result=run({sourceCandidates:[
    src('source:launch',['launch'],{status:'revoked'}),
    src('source:research',['research']),
    src('source:legacy',['history'],{status:'superseded'}),
    src('source:duplicate',['product']),
  ]});
  assert.ok(!result.selectedRefs.includes('source:launch'));
  assert.ok(result.omissions.some(x=>x.ref==='source:launch'&&x.reason==='invalidated'));
  assert.throws(()=>run({mandatorySourceRefs:['source:launch'],sourceCandidates:[
    src('source:launch',['launch'],{status:'revoked'}),
  ]}),{code:'DCB_SELECTION_REQUIRED'});
});
test('selection is deterministic regardless of input ordering and duplicate keywords',()=>{
  const candidates=[
    src('source:research',['research','evidence','research']),
    src('source:launch',['launch','decision']),
    src('source:legacy',['history']),
    src('source:duplicate',['launch']),
  ];
  const a=run({sourceCandidates:candidates});
  const b=run({sourceCandidates:[...candidates].reverse()});
  assert.deepEqual(a,b);
});
test('missing optional source metadata is omitted but missing mandatory metadata blocks',()=>{
  const result=run({sourceCandidates:[src('source:research',['research'])]});
  assert.deepEqual(result.selectedRefs,['source:research']);
  assert.equal(result.omissions.filter(x=>x.reason==='metadata_unavailable').length,3);
  assert.throws(()=>run({mandatorySourceRefs:['source:launch'],
    sourceCandidates:[src('source:research',['research'])]}),{code:'DCB_SELECTION_REQUIRED'});
});
test('duplicate source identities and malformed timestamps fail closed',()=>{
  assert.throws(()=>run({sourceCandidates:[src('source:launch',['launch']),
    src('source:launch',['launch'])]}),{code:'DCB_SELECTION_COLLISION'});
  assert.throws(()=>run({now:'bad'}),{code:'DCB_SELECTION_TIME'});
});
