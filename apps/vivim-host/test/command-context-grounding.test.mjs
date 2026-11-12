import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMAND_CONTEXT_SCHEMA, groundCommandReferences } from '../control/command-context-grounding.mjs';
const bundle=()=>({schema:COMMAND_CONTEXT_SCHEMA,revision:'world:17',digest:'a'.repeat(64),
 entries:[
  {id:'artifact:42',type:'artifact',value:'artifact:42',revision:'rev:18',
   sourceDigest:'b'.repeat(64),status:'current',authority:'host-source'},
  {id:'artifact:43',type:'artifact',value:'artifact:43',revision:'rev:13',
   sourceDigest:'c'.repeat(64),status:'stale',authority:'host-source'},
 ],selectors:{focused:'artifact:42',latestApproved:['artifact:42']}});
const request=(kind='focused',extra={})=>({arg:'artifact_id',kind,expectedType:'artifact',...extra});
test('current focused reference resolves to source-pinned, inert value',()=>{
  const r=groundCommandReferences({bundle:bundle(),requests:[request()]});
  assert.equal(r.outcome,'resolved');
  assert.deepEqual(r.args,{artifact_id:'artifact:42'});
  assert.equal(r.pins.references[0].revision,'rev:18');
  assert.equal(r.executionAuthorized,false);
});
test('explicit references are exact, no fuzzy fallback',()=>{
  const r=groundCommandReferences({bundle:bundle(),
    requests:[request('explicit',{refId:'artifact:43'})]});
  assert.equal(r.reason,'STALE_REFERENCE');
  assert.equal(groundCommandReferences({bundle:bundle(),
    requests:[request('explicit',{refId:'artifact:unknown'})]}).reason,'UNKNOWN_REFERENCE');
});
test('latest approved requires one source-attested choice',()=>{
  const b=bundle(); b.selectors.latestApproved=['artifact:42','artifact:43'];
  assert.equal(groundCommandReferences({bundle:b,requests:[request('latestApproved')]}).reason,
    'AMBIGUOUS_REFERENCE');
});
test('wrong type and absent focus refuse safely',()=>{
  assert.equal(groundCommandReferences({bundle:bundle(),
    requests:[request('focused',{expectedType:'person'})]}).reason,'WRONG_REFERENCE_TYPE');
  const b=bundle(); delete b.selectors.focused;
  assert.equal(groundCommandReferences({bundle:b,requests:[request()]}).reason,'AMBIGUOUS_REFERENCE');
});
test('duplicate IDs or argument bindings invalidate the whole proposal',()=>{
  const b=bundle();b.entries.push({...b.entries[0]});
  assert.equal(groundCommandReferences({bundle:b,requests:[request()]}).reason,'INVALID_CONTEXT_ENTRY');
  assert.equal(groundCommandReferences({bundle:bundle(),
    requests:[request(),request('latestApproved')]}).reason,'INVALID_REFERENCE_REQUEST');
});
test('unsourced or unknown provenance cannot be used as command reference',()=>{
  const b=bundle();b.entries[0].authority='model-assertion';
  assert.equal(groundCommandReferences({bundle:b,requests:[request()]}).reason,'INVALID_CONTEXT_ENTRY');
});
