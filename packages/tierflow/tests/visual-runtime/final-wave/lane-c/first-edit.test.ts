import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectFirstEdit,transitionFirstEdit} from '../../../../src/visual-runtime/final-wave/lane-c/first-edit.ts';
import type {FirstEditInput,FirstEditStage} from '../../../../src/visual-runtime/final-wave/lane-c/first-edit.ts';
/**
 * A DELIBERATELY partial external observation. The lane must refuse it, so the
 * fixture is intentionally not a complete view; this helper keeps the cast in
 * one named place instead of scattering it through the suite.
 */
function partialExternal<T>(value: unknown): T { return value as T; }
function input(stage:FirstEditStage='discover',viewport:320|360|1280=320):FirstEditInput{return {stage,viewport,shell:viewport===1280?'desktop':'android',onboarding:partialExternal<FirstEditInput['onboarding']>({schema:'vivim.wave4-founder-onboarding/1',pairing:{qrAccessibleName:'token=THIS_IS_A_SECRET_123456789'} }),preview:{ok:true} as FirstEditInput['preview'],help:null};}
for(const viewport of [320,360,1280] as const)test(`first edit reachable at ${viewport}, keyboard order and 44px controls`,()=>{
 const v=projectFirstEdit(input('discover',viewport));assert.equal(v.schema,'vivim.ui-first-edit/1');assert.equal(v.stage,'discover');assert.equal(v.firstFocusId,'first-edit.open');assert.deepEqual(v.focusOrder,v.controls.map(x=>x.id));
 assert.ok(v.controls.every(x=>x.minTouchPx>=44));assert.equal(v.effectInvoked,false);assert.equal(v.applied,false);
 assert.equal(transitionFirstEdit(v,'open'),'choose');assert.equal(transitionFirstEdit(v,'request-publish'),'discover');
 assert.ok(!JSON.stringify(v).includes('THIS_IS_A_SECRET'));
});
for(const [stage,event,expected] of [
 ['choose','choose-template','preview'],['preview','show-preview','review'],['review','request-publish','review'],
 ['review','back','preview'],['preview','back','choose'],['choose','back','discover'],
 ['review','escape','preview'],['preview','escape','choose'],['choose','escape','discover'],
 ['choose','cancel','cancelled'],['review','cancel','cancelled'],
] as const)test(`navigation ${stage}/${event} => ${expected}`,()=>{
 const v=projectFirstEdit(input(stage));assert.equal(transitionFirstEdit(v,event),expected);
 assert.equal(v.canRequestPublish,false);assert.equal(v.ownerReviewRequired,true);assert.equal(v.hostEffectAllowed,false);
});
test('missing preview cannot imply review or publish',()=>{const i={...input('review'),preview:null};const v=projectFirstEdit(i);assert.equal(v.stage,'choose');assert.equal(v.applied,false);});
test('unknown onboarding schema is refused',()=>{assert.throws(()=>projectFirstEdit({...input(),onboarding:partialExternal<FirstEditInput['onboarding']>({schema:'fake'})}));});
test('unsafe external help is suppressed',()=>{const i={...input(),help:{visible:true,runnable:false,explanation:'token=SUPERSECRET'} as FirstEditInput['help']};const v=projectFirstEdit(i);assert.ok(!v.helpText.includes('SUPERSECRET'));});
test('read-only help cannot silently authorize an effect',()=>{const i={...input(),help:{visible:true,runnable:false,explanation:'Review the changes'} as FirstEditInput['help']};const v=projectFirstEdit(i);assert.equal(v.helpText,'Review the changes');assert.equal(v.canRequestPublish,false);});
test('cancelled view has no controls and safe focus',()=>{const v=projectFirstEdit(input('cancelled'));assert.equal(v.firstFocusId,'first-edit.heading');assert.deepEqual(v.controls,[]);});
