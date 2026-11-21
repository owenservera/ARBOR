import test from 'node:test';
import assert from 'node:assert/strict';
import { committedHostSurface, createHostRevisionGuard } from '../generative-ui/host-revision-guard.mjs';

const surface = (revision, name='my-space', label='Safe') => ({
  schema:'vivim.ui-surface/1', surfaceId:name, revision, catalogVersion:1,
  theme:{background:'#111722'}, tree:{id:'root',type:'stack',props:{},children:[{id:'label',type:'text',props:{value:label},children:[]}]}
});
const host = (revision, name, label) => {
  const s = surface(revision,name,label);
  return {...s, surface:s, status:'applied', changeId:'ui-change',parentRevision:revision-1};
};

test('extracts only source-owned committed surface, not additive Host envelope', () => {
  const row=host(4);
  assert.deepEqual(committedHostSurface(row), surface(4));
  assert.equal('status' in committedHostSurface(row),false);
  assert.equal('surface' in committedHostSurface(row),false);
  assert.equal(committedHostSurface(surface(4)),null,'bare visual payload is not a Host commit');
});
test('requires an applied Host revision and matching metadata', () => {
  assert.equal(committedHostSurface({...host(4),status:'previewed'}),null);
  assert.equal(committedHostSurface({...host(4),revision:5}),null);
  assert.equal(committedHostSurface({...host(4),surfaceId:'foreign'}),null);
  assert.equal(committedHostSurface({...host(4),surface:null}),null);
});
test('same snapshot is duplicate, subsequent full snapshot advances without delta replay', () => {
  const guard=createHostRevisionGuard();
  assert.deepEqual([guard.observe(host(3)).state,guard.observe(host(3)).changed],[ 'ready', false ]);
  const next=guard.observe(host(8));
  assert.equal(next.state,'ready'); assert.equal(next.changed,true);
  assert.equal(guard.status().highRevision,8);
});
test('stale snapshot and unproved rollback clear UI, no inferred rollback activation', () => {
  const guard=createHostRevisionGuard();
  assert.equal(guard.observe(host(8)).state,'ready');
  const result=guard.observe(host(7));
  assert.equal(result.state,'blocked'); assert.equal(result.surface,null);
  assert.equal(result.reason,'ROLLBACK_PROOF_REQUIRED');
  assert.equal(guard.status().state,'blocked');
});
test('same revision with different bytes is conflict, not a silent repaint', () => {
  const guard=createHostRevisionGuard();guard.observe(host(2));
  assert.equal(guard.observe(host(2,undefined,'tamper')).reason,'SAME_REVISION_CONFLICT');
});
test('a foreign surface identity cannot silently inherit the same authorization', () => {
  const guard=createHostRevisionGuard();guard.observe(host(2));
  assert.equal(guard.observe(host(3,'foreign-world')).reason,'SCOPE_CHANGED');
});
test('offline and revoked connections do not retain renderable data; rejoin needs full Host read', () => {
  const guard=createHostRevisionGuard();guard.observe(host(9));
  assert.equal(guard.disconnect().surface,null);
  assert.equal(guard.status().state,'blocked');
  assert.equal(guard.observe(host(9)).changed,true);
  assert.equal(guard.observe(null).reason,'NO_COMMITTED_SURFACE');
});
test('untrusted revisions and prototype-shaped payloads fail closed', () => {
  const guard=createHostRevisionGuard();
  for(const bad of [[],{}, {surface: Object.create({schema:'vivim.ui-surface/1'}),status:'applied'},
    {...host(2),revision:NaN},{...host(2),status:'accepted'}]) {
    assert.equal(guard.observe(bad).state,'blocked');
  }
});
test('no executable command or effect capability escapes the surface guard', () => {
  const guard=createHostRevisionGuard();const value=guard.observe(host(2));
  assert.deepEqual(Object.keys(value).sort(), ['changed','reason','state','surface']);
  assert.equal('execute' in guard,false); assert.equal('grant' in guard,false);
});


test('explicit authenticated visual scope isolates new grants but retains same-grant high marks',()=>{
  const guard=createHostRevisionGuard();
  assert.equal(guard.bindScope('session-a:grant-a').state,'changed');
  assert.equal(guard.observe(host(8)).state,'ready');
  assert.equal(guard.disconnect().state,'blocked');
  assert.equal(guard.bindScope('session-a:grant-a').state,'unchanged');
  assert.equal(guard.observe(host(7)).reason,'ROLLBACK_PROOF_REQUIRED');
  assert.equal(guard.observe(host(9,'foreign-space')).reason,'SCOPE_CHANGED');
  assert.equal(guard.bindScope('session-b:grant-b').state,'changed');
  assert.equal(guard.status().highRevision,null);
  assert.equal(guard.observe(host(1)).state,'ready','new Host grant has independent revision domain');
  assert.equal(guard.observe(host(0)).reason,'ROLLBACK_PROOF_REQUIRED');
  guard.clearScope();
  assert.equal(guard.observe(host(2)).reason,'SOURCE_SCOPE_UNAVAILABLE');
  assert.equal(guard.bindScope('session-b:grant-b').state,'changed');
  assert.equal(guard.observe(host(2)).state,'ready');
  assert.equal(guard.bindScope('').state,'refused');
  assert.equal(guard.status().highRevision,2);
});
