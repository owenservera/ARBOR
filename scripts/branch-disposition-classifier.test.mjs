import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyBranch, classifyInventory } from './branch-disposition-classifier.mjs';
const A = 'a'.repeat(40), B = 'b'.repeat(40);
const row = (name, status, ahead_by, behind_by, base=A) => ({
  name, tipSha:B, comparison:{status, ahead_by, behind_by, base_commit:{sha:base}}
});
test('behind branch is only a preservation-safe review candidate',()=>{
  const x=classifyBranch({...row('work/old','behind',0,15),baseSha:A});
  assert.equal(x.disposition,'ANCESTOR_REVIEW_ONLY'); assert.equal(x.canDelete,false);
});
test('ahead and diverged commits are never automatically archived or discarded',()=>{
  for(const [status,ahead,behind] of [['ahead',2,0],['diverged',2,4]]){
    const x=classifyBranch({...row('work/safety',status,ahead,behind),baseSha:A});
    assert.equal(x.disposition,'UNIQUE_COMMITS_PRESERVE');assert.equal(x.canDelete,false);
  }
});
test('unknown or failed GitHub comparison is preserved',()=>{
  const x=classifyBranch({name:'work/unreachable',tipSha:B,baseSha:A,comparison:null});
  assert.equal(x.disposition,'UNKNOWN_PRESERVE');assert.equal(x.ahead,null);
});
test('stale comparison base cannot certify old ancestry against new main',()=>{
  const x=classifyBranch({...row('work/stale','behind',0,5,B),baseSha:A});
  assert.equal(x.disposition,'UNKNOWN_PRESERVE');
});
test('contradictory status/count metadata fails closed',()=>{
  const x=classifyBranch({...row('work/contradiction','behind',1,5),baseSha:A});
  assert.equal(x.disposition,'UNKNOWN_PRESERVE');
});
test('inventory sorts, counts and never enables deletion',()=>{
  const x=classifyInventory({baseSha:A,branches:[row('z','behind',0,2),row('a','diverged',3,5),row('x','ahead',1,0)]});
  assert.deepEqual(x.branches.map(v=>v.name),['a','x','z']);
  assert.deepEqual(x.summary,{total:3,uniquePreserve:2,ancestorReview:1,unknownPreserve:0});
  assert.equal(x.deletionAuthorized,false);
});
test('duplicate name and invalid branch identity fail closed',()=>{
  assert.throws(()=>classifyInventory({baseSha:A,branches:[row('a','behind',0,1),row('a','behind',0,2)]}),/DUPLICATE_BRANCH/);
  assert.throws(()=>classifyBranch({name:'bad\nbranch',tipSha:B,baseSha:A}),/INVALID_BRANCH_IDENTITY/);
});
test('empty or missing inventory is not accepted',()=>{
  assert.throws(()=>classifyInventory({baseSha:A,branches:[]}),/INVALID_INVENTORY/);
});
