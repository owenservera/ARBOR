# File: harness/test/context/dcb-v2-planner.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-v2-planner.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7656 B |
| Lines | 150 |
| Hash | ad69c394eaf1 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| T | const | 6 | no | const T=&#39;2026-11-10T06:00:00.000Z&#39;; |
| sha | function | 7 | no | const sha=text=&gt;createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| audience | const | 8 | no | const audience={principalRef:&#39;owner:one&#39;,projectRef:&#39;project:one&#39;, |
| fixture | function | 10 | no | function fixture({ classification=&#39;source&#39;, sensitivity=&#39;internal&#39; }={}) { |
| text | variable | 11 | no | let text=&#39;VIVIM decision: reuse the existing composer.&#39;; |
| revision | variable | 12 | no | let revision=&#39;rev1&#39;; |
| lookupCount | variable | 13 | no | let lookupCount=0; |
| enabled | variable | 14 | no | let enabled=true,definitionRevision=1,mutateDefinitionOnRead=false; |
| ref | const | 15 | no | const ref=&#39;notes/context&#39;; |
| definitionStore | const | 16 | no | const definitionStore={ |
| sourceAdapters | const | 23 | no | const sourceAdapters={ |
| planner | const | 33 | no | const planner=createDcbV2Planner({definitionStore,sourceAdapters}); |
| scope | const | 34 | no | const scope={allowedRefs:[ref],allowedPrefixes:[],maxSensitivity:sensitivity}; |
| request | const | 35 | no | const request={bundleId:&#39;dcb:demo&#39;,taskRef:&#39;task:demo&#39;,taskText:&#39;Research the decision&#39;, |
| out | const | 48 | no | const out=await planner.plan(request); |
| f | const | 60 | no | const f=fixture(); |
| first | const | 61 | no | const first=await f.planner.plan(f.request); |
| replay | const | 62 | no | const replay=await f.planner.plan(f.request); |
| next | const | 65 | no | const next=await f.planner.plan({...f.request,taskText:&#39;Summarize the decision&#39;}); |
| updated | const | 68 | no | const updated=await f.planner.plan(f.request); |
| f | const | 72 | no | const f=fixture(); |
| f | const | 77 | no | const f=fixture(); |
| f | const | 83 | no | const f=fixture();f.unavailable(); |
| f | const | 87 | no | const f=fixture({classification:&#39;personal&#39;,sensitivity:&#39;private&#39;}); |
| denied | const | 88 | no | const denied=await f.planner.plan(f.request); |
| approved | const | 92 | no | const approved=await f.planner.plan({...f.request,disclosure:{approved:true, principalRef:audience.principalRef,destinationProvider:audience.destinationProvider, sourceRefs:[&#39;notes/context&#39;]}}); |
| f | const | 99 | no | const f=fixture(); |
| result | const | 100 | no | const result=await f.planner.plan({...f.request,audience:{...audience,destinationModelVerified:false}}); |
| mandatory | const | 106 | no | const mandatory=&#39;notes/launch&#39;, optional=&#39;notes/old&#39;; |
| bodies | const | 107 | no | const bodies=new Map([[mandatory,&#39;Current launch decision approved.&#39;],[optional,&#39;Historical unrelated discussion.&#39;]]); |
| dcb | const | 108 | no | const dcb=createDcbV2Planner({ definitionStore:{resolve:()=&gt;({sourceRefs:[mandatory,optional], flavorRefs:[&#39;project&#39;,&#39;research&#39;],dependencies:[{ref:&#39;dcb:main&#39;,revision:1}]})}, sourceAdapters:{ resolv… |
| result | const | 121 | no | const result=await dcb.plan({ bundleId:&#39;dcb:main&#39;,taskRef:&#39;task:launch&#39;,taskText:&#39;What is the launch decision?&#39;, now:T,profile:&#39;continuum&#39;,purpose:&#39;personal_continuum&#39;,audience, scope:{allowedRefs:[m… |
| f | const | 135 | no | const f=fixture(); |
| result | const | 136 | no | const result=await f.planner.plan({...f.request, scope:{allowedRefs:[],allowedPrefixes:[],maxSensitivity:&#39;internal&#39;}, adaptiveSelection:{mandatorySourceRefs:[],maxSources:5}}); |
| f | const | 145 | no | const f=fixture(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../../src/context/dcb-v2-planner.mjs | import | 4 | [harness/src/context/dcb-v2-planner.mjs](../../src/context/dcb-v2-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createDcbV2Planner } from '../../src/context/dcb-v2-planner.mjs';

const T='2026-11-10T06:00:00.000Z';
const sha=text=>createHash('sha256').update(text).digest('hex');
const audience={principalRef:'owner:one',projectRef:'project:one',
  destinationProvider:'claude',destinationModelVerified:true};
function fixture({ classification='source', sensitivity='internal' }={}) {
  let text='VIVIM decision: reuse the existing composer.';
  let revision='rev1';
  let lookupCount=0;
  let enabled=true,definitionRevision=1,mutateDefinitionOnRead=false;
  const ref='notes/context';
  const definitionStore={
    resolve:(id,{at})=>{
      assert.equal(at,T);
      return {bundleId:id,sourceRefs:[ref],flavorRefs:['project','research'],
        dependencies:[{ref:id,revision:definitionRevision}]};
    },
  };
  const sourceAdapters={
    resolveSources:async()=>{lookupCount++;
      return enabled?[{ref,revision,sha256:sha(text),classification,sensitivity,
        layer:'L3Entity',trust:'owner_confirmed',keywords:['decision','context'],
        principalRef:audience.principalRef,projectRef:audience.projectRef,
        updatedAt:T,priority:1}]:[];
    },
    readSource:async()=>{if(mutateDefinitionOnRead)definitionRevision++;
      return {revision,text,sha256:sha(text)};},
  };
  const planner=createDcbV2Planner({definitionStore,sourceAdapters});
  const scope={allowedRefs:[ref],allowedPrefixes:[],maxSensitivity:sensitivity};
  const request={bundleId:'dcb:demo',taskRef:'task:demo',taskText:'Research the decision',
    audience,scope,disclosure:null,profile:'continuum',purpose:'personal_continuum',
    maxInputTokens:1600,reservedForUserPrompt:200,reservedForOutput:200,now:T};
  return {planner,request,
    mutate:(next)=>{text=next;revision='rev2';},
    unavailable:()=>{enabled=false;},
    driftDefinition:()=>{mutateDefinitionOnRead=true;},
    count:()=>lookupCount,
  };
}

test('complete self-sufficient packet reuses v1 composer and binds v2 ancestry',async()=>{
  const {planner,request}=fixture();
  const out=await planner.plan(request);
  assert.equal(out.schema,'vivim.dynamic-context-packet/2');
  assert.equal(out.complete,true);
  assert.equal(out.transferable,true);
  assert.equal(out.isSendAuthorized,false);
  assert.equal(out.manifest.schema,'vivim.dynamic-context-bundle/1');
  assert.deepEqual(out.selectedFlavors,['project','research']);
  assert.deepEqual(out.definitionRevisions,[{ref:'dcb:demo',revision:1}]);
  assert.equal(out.preview.included[0].ref,'notes/context');
  assert.ok(out.fragment.includes('UNTRUSTED DATA'));
});
test('same source and task are deterministic, every request re-reads context',async()=>{
  const f=fixture();
  const first=await f.planner.plan(f.request);
  const replay=await f.planner.plan(f.request);
  assert.equal(first.packetDigest,replay.packetDigest);
  assert.equal(f.count(),2);
  const next=await f.planner.plan({...f.request,taskText:'Summarize the decision'});
  assert.notEqual(first.packetDigest,next.packetDigest);
  f.mutate('New verified decision: use VIVIM World authority.');
  const updated=await f.planner.plan(f.request);
  assert.notEqual(first.packetDigest,updated.packetDigest);
});
test('a mid-read definition update invalidates the packet before any send candidate exists',async()=>{
  const f=fixture();
  f.driftDefinition();
  await assert.rejects(f.planner.plan(f.request),{code:'DCB_V2_DEFINITION_DRIFT'});
});
test('source scope absent fails before reading private source content',async()=>{
  const f=fixture();
  await assert.rejects(f.planner.plan({...f.request,scope:{...f.request.scope,allowedRefs:[]}}),
    {code:'DCB_V2_SCOPE'});
  assert.equal(f.count(),0);
```

_First 80 of 151 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
