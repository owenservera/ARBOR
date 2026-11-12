import test from 'node:test';
import assert from 'node:assert/strict';
import { observePersonalLanguage } from '../control/personal-semantic-observer.mjs';
const catalog={version:6,actions:[
 {id:'vivim.status.show',language:{verbs:['status']},args:{}},
 {id:'ui.theme.set_preset',language:{verbs:['theme']},
  args:{preset:{type:'enum',values:['dusk','dawn']}}},
]};
let sequence=0;
const event=(changes={})=>({eventId:'host-feedback-'+String(++sequence).padStart(6,'0'),
 kind:'owner-confirmed-meaning',source:'trusted-host-feedback',
 phrase:'quick check',actionId:'vivim.status.show',args:{},scope:{workspaceId:'project-a'},...changes});
test('repeated explicit confirmations propose, never activate',()=>{
 const r=observePersonalLanguage({events:[event(),event(),event()],catalog});
 assert.equal(r.candidates.length,1);
 assert.equal(r.candidates[0].rule.state,'proposed');
 assert.equal(r.candidates[0].rule.source,'system-observed');
 assert.equal(r.candidates[0].executionAuthorized,false);
 assert.equal(r.activationPermitted,false);
});
test('execution receipts or model claims are not interpreted as semantic confirmation',()=>{
 const r=observePersonalLanguage({events:[
  event({kind:'receipt-applied'}),event({source:'model-assertion'}),
  event(),event()],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.skipped,2);
});
test('contradictory meanings produce conflict, not an inferred winner',()=>{
 const r=observePersonalLanguage({events:[
  event(),event(),event(),event({actionId:'ui.theme.set_preset',args:{preset:'dusk'}})
 ],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.conflicts.length,1);
 assert.equal(r.conflicts[0].distinctMeanings,2);
});
test('separate contexts learn independent meanings with no cross-scope bleed',()=>{
 const r=observePersonalLanguage({events:[
  event(),event(),event(),
  event({scope:{workspaceId:'project-b'},actionId:'ui.theme.set_preset',args:{preset:'dusk'}}),
  event({scope:{workspaceId:'project-b'},actionId:'ui.theme.set_preset',args:{preset:'dusk'}}),
  event({scope:{workspaceId:'project-b'},actionId:'ui.theme.set_preset',args:{preset:'dusk'}})
 ],catalog});
 assert.equal(r.candidates.length,2);
 assert.equal(r.conflicts.length,0);
});
test('unregistered action or invalid argument never becomes a candidate',()=>{
 const r=observePersonalLanguage({events:[
  event({actionId:'shell.exec'}),event({actionId:'shell.exec'}),event({actionId:'shell.exec'}),
  event({actionId:'ui.theme.set_preset',args:{preset:'invalid'}})
 ],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.skipped,4);
});

test('replayed event ID does not inflate semantic confirmation counts',()=>{
 const once=event({eventId:'host-feedback-same-event'});
 const r=observePersonalLanguage({events:[once,once,once],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.skipped,2);
});
