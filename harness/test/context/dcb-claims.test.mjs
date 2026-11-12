import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { reconcileDcbClaims } from '../../src/context/dcb-claims.mjs';
const T='2026-11-10T06:00:00.000Z';
const EARLY='2026-11-09T06:00:00.000Z';
const LATER='2026-11-11T06:00:00.000Z';
const dig=t=>createHash('sha256').update(t).digest('hex');
const claim=(id,value,over={})=>({id,subjectRef:'product:one',predicate:'launch',
  valueDigest:dig(value),sourceRef:'source:one',sourceRevision:'v1',
  evidenceClass:'observed',observedAt:EARLY,supersedes:[],...over});
const run=(claims,allowedSourceRefs=['source:one','source:two'])=>
  reconcileDcbClaims({claims,allowedSourceRefs,now:T});
test('same semantic claim from two sources deduplicates without losing canonical provenance',()=>{
  const a=claim('claim:a','yes');
  const b=claim('claim:b','yes',{sourceRef:'source:two',evidenceClass:'verified'});
  const r=run([a,b]);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:b']);
  assert.deepEqual(r.duplicates,[{id:'claim:a',representedBy:'claim:b'}]);
  assert.equal(r.isSendAuthorized,false);
});
test('contradictory live claims persist as explicit conflicts, not false consensus',()=>{
  const r=run([claim('claim:a','yes'),claim('claim:b','no')]);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:a','claim:b']);
  assert.deepEqual(r.contradictions[0].claimIds,['claim:a','claim:b']);
  assert.equal(r.contradictions[0].status,'unresolved_conflict');
});
test('owner-confirmed correction supersedes a previous observation only when declared',()=>{
  const old=claim('claim:old','yes');
  const next=claim('claim:new','no',{evidenceClass:'owner_confirmed',observedAt:T,
    supersedes:['claim:old']});
  const r=run([old,next]);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:new']);
  assert.ok(r.excluded.some(x=>x.id==='claim:old'&&x.reason==='superseded'));
});
test('provider claim cannot replace stronger verified decision',()=>{
  const old=claim('claim:old','yes',{evidenceClass:'owner_confirmed'});
  const next=claim('claim:ai','no',{evidenceClass:'provider_reported',observedAt:T,
    supersedes:['claim:old']});
  assert.throws(()=>run([old,next]),{code:'DCB_CLAIM_UNTRUSTED_SUPERSESSION'});
});
test('source permissions filter claims before reconciliation and suppression',()=>{
  const old=claim('claim:old','yes');
  const next=claim('claim:new','no',{sourceRef:'source:two',evidenceClass:'owner_confirmed',
    observedAt:T,supersedes:['claim:old']});
  const r=run([old,next],['source:one']);
  assert.deepEqual(r.selected.map(x=>x.id),['claim:old']);
  assert.equal(r.filteredCount,1);
});
test('historical, revoked and future claims excluded without inventing current truth',()=>{
  const r=run([claim('claim:past','yes',{validUntil:T}),
    claim('claim:revoked','no',{revoked:true}),
    claim('claim:future','maybe',{validFrom:LATER})]);
  assert.deepEqual(r.selected,[]);
  assert.deepEqual(r.excluded.map(x=>x.reason),['not_yet_valid','historical','revoked']);
});
test('cycles, wrong-subject supersession, duplicate IDs and malformed evidence fail closed',()=>{
  const a=claim('claim:a','yes',{supersedes:['claim:b']});
  const b=claim('claim:b','no',{supersedes:['claim:a']});
  assert.throws(()=>run([a,b]),{code:'DCB_CLAIM_CYCLE'});
  assert.throws(()=>run([claim('claim:a','x'),claim('claim:a','y')]),{code:'DCB_CLAIM_ID_COLLISION'});
  assert.throws(()=>run([claim('claim:a','x',{evidenceClass:'untrusted'})]),{code:'DCB_CLAIM_EVIDENCE'});
  assert.throws(()=>run([claim('claim:a','x'),claim('claim:b','y',{
    subjectRef:'product:two',supersedes:['claim:a']})]),{code:'DCB_CLAIM_SUPERSESSION_SCOPE'});
});
test('permutation-invariant selected claims and contradictions',()=>{
  const rows=[claim('claim:a','yes'),claim('claim:b','no'),claim('claim:c','yes',{sourceRef:'source:two'})];
  assert.deepEqual(run(rows),run([...rows].reverse()));
});
