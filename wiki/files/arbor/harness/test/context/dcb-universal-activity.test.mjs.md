# File: harness/test/context/dcb-universal-activity.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-universal-activity.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3442 B |
| Lines | 59 |
| Hash | 988c6420c431 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| T | const | 6 | no | const T=&#39;2026-11-10T06:00:00.000Z&#39;, sha=x=&gt;createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| audience | const | 7 | no | const audience={principalRef:&#39;owner:one&#39;,projectRef:null, |
| adapters | function | 9 | no | function adapters({candidateActivity=&#39;activity:daily-planning&#39;,projectRef=null}={}) { |
| text | const | 10 | no | const text=&#39;Confirmed appointment for Wednesday.&#39;; |
| request | const | 18 | no | const request={purpose:&#39;personal_continuum&#39;,profile:&#39;continuum&#39;,taskRef:&#39;task:appointment&#39;, |
| dcb | const | 23 | no | const dcb=createDCBComposer(adapters()); |
| result | const | 24 | no | const result=await dcb.compose(request); |
| dcb | const | 31 | no | const dcb=createDCBComposer(adapters({candidateActivity:&#39;activity:unrelated&#39;})); |
| result | const | 32 | no | const result=await dcb.compose(request); |
| dcb | const | 37 | no | const dcb=createDCBComposer(adapters({projectRef:&#39;project:other&#39;})); |
| result | const | 38 | no | const result=await dcb.compose(request); |
| sourceAdapters | const | 43 | no | const sourceAdapters=adapters(); |
| planner | const | 44 | no | const planner=createDcbV2Planner({sourceAdapters, definitionStore:{resolve:()=&gt;({sourceRefs:[&#39;context/planning&#39;], flavorRefs:[&#39;life-planning&#39;,&#39;personal&#39;],dependencies:[{ref:&#39;dcb:daily&#39;,revision:1}]})… |
| result | const | 47 | no | const result=await planner.plan({...request,bundleId:&#39;dcb:daily&#39;}); |
| composer | const | 55 | no | const composer=createDCBComposer(adapters()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../../src/context/dcb-composer.mjs | import | 4 | [harness/src/context/dcb-composer.mjs](../../src/context/dcb-composer.mjs.md) |
| ../../src/context/dcb-v2-planner.mjs | import | 5 | [harness/src/context/dcb-v2-planner.mjs](../../src/context/dcb-v2-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
