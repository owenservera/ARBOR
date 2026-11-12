import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createDCBComposer } from '../../src/context/dcb-composer.mjs';
import { createDcbV2Planner } from '../../src/context/dcb-v2-planner.mjs';
const T='2026-11-10T06:00:00.000Z', sha=x=>createHash('sha256').update(x).digest('hex');
const audience={principalRef:'owner:one',projectRef:null,
  activityRef:'activity:daily-planning',destinationProvider:'claude',destinationModelVerified:true};
function adapters({candidateActivity='activity:daily-planning',projectRef=null}={}) {
  const text='Confirmed appointment for Wednesday.';
  return {resolveSources:async()=>[{
    ref:'context/planning',revision:'r1',sha256:sha(text),
    classification:'source',layer:'L3Entity',trust:'owner_confirmed',
    sensitivity:'internal',keywords:['appointment','planning'],updatedAt:T,
    principalRef:'owner:one',activityRef:candidateActivity,projectRef,
  }],readSource:async()=>({revision:'r1',text,sha256:sha(text)})};
}
const request={purpose:'personal_continuum',profile:'continuum',taskRef:'task:appointment',
  taskText:'Summarize appointment planning',audience,
  scope:{allowedRefs:['context/planning'],allowedPrefixes:[],maxSensitivity:'internal'},
  maxInputTokens:1600,reservedForUserPrompt:200,reservedForOutput:200,now:T};
test('v1 composer accepts exact non-project activity scope without synthetic project',async()=>{
  const dcb=createDCBComposer(adapters());
  const result=await dcb.compose(request);
  assert.equal(result.manifest.audience.projectRef,null);
  assert.equal(result.manifest.audience.activityRef,audience.activityRef);
  assert.equal(result.manifest.sources.length,1);
  assert.equal(result.transferable,true);
});
test('activity mismatch cannot escape into a different subject',async()=>{
  const dcb=createDCBComposer(adapters({candidateActivity:'activity:unrelated'}));
  const result=await dcb.compose(request);
  assert.equal(result.manifest.sources.length,0);
  assert.ok(result.preview.omissions.some(x=>x.reason==='wrong_activity'));
});
test('project-only source remains out of scope for non-project activity',async()=>{
  const dcb=createDCBComposer(adapters({projectRef:'project:other'}));
  const result=await dcb.compose(request);
  assert.equal(result.manifest.sources.length,0);
  assert.ok(result.preview.omissions.some(x=>x.reason==='wrong_project'));
});
test('v2 planner can build transferable activity-bound packet with no projectRef',async()=>{
  const sourceAdapters=adapters();
  const planner=createDcbV2Planner({sourceAdapters,
    definitionStore:{resolve:()=>({sourceRefs:['context/planning'],
      flavorRefs:['life-planning','personal'],dependencies:[{ref:'dcb:daily',revision:1}]})}});
  const result=await planner.plan({...request,bundleId:'dcb:daily'});
  assert.equal(result.complete,true);
  assert.equal(result.transferable,true);
  assert.equal(result.manifest.audience.activityRef,audience.activityRef);
  assert.equal(result.manifest.audience.projectRef,null);
  assert.deepEqual(result.selectedFlavors,['life-planning','personal']);
});
test('unscoped audience with neither project nor activity is still rejected',async()=>{
  const composer=createDCBComposer(adapters());
  await assert.rejects(composer.compose({...request,audience:{
    ...audience,activityRef:null,
  }}),{code:'DCB_AUDIENCE'});
});
