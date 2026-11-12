import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAL_RULE_SCHEMA, resolvePersonalSemantics } from '../control/personal-semantics.mjs';
const catalog={version:6,actions:[
 {id:'vivim.status.show',language:{verbs:['status']},args:{}},
]};
const baseline={outcome:'interpretation_required'};
const rules=Array.from({length:120},(_,i)=>({
 schema:PERSONAL_RULE_SCHEMA,id:'rule:synthetic-'+i,revision:1,
 phrase:'routine '+String(i).padStart(3,'0'),
 actionId:'vivim.status.show',args:{},scope:{},
 state:'accepted',source:'explicit-owner',catalogVersion:6,
}));
const resolve=text=>resolvePersonalSemantics({text,baseline,catalog,rules,scope:{surface:'desktop'}});
test('120 independent phrases remain exactly routable and repeat deterministically',()=>{
 for(let i=0;i<120;i++) {
  const text='routine '+String(i).padStart(3,'0');
  const a=resolve(text),b=resolve(text);
  assert.equal(a.outcome,'candidate');
  assert.equal(a.candidate.actionId,'vivim.status.show');
  assert.deepEqual(a,b);
 }
});
test('word-order changes and appended operations never inherit a personal alias',()=>{
 for(let i=0;i<120;i++) {
  const text='routine '+String(i).padStart(3,'0');
  for(const variant of [text+' and delete all',text+';',text+' not',
    'delete '+text,'routine '+String((i+1)%120).padStart(3,'0')+' now']) {
    assert.equal(resolve(variant).outcome,'no_match');
  }
 }
});
test('case and repeated spaces normalize without editing the stored command',()=>{
 for(let i=0;i<120;i++) {
  const text=' ROUTINE  '+String(i).padStart(3,'0')+' ';
  assert.equal(resolve(text).candidate.actionId,'vivim.status.show');
 }
});
test('a changed catalog revision abstains on all matching personal rules',()=>{
 for(const i of [0,17,64,119]) {
  const text='routine '+String(i).padStart(3,'0');
  const r=resolvePersonalSemantics({text,baseline,catalog:{...catalog,version:7},
    rules,scope:{surface:'desktop'}});
  assert.equal(r.outcome,'refused');
  assert.equal(r.reason,'STALE_CATALOG_RULE');
 }
});
