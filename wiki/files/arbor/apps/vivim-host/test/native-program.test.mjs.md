# File: apps/vivim-host/test/native-program.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/native-program.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4151 B |
| Lines | 42 |
| Hash | 5aa6d57b4445 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| step | const | 5 | no | const step={id:&#39;read&#39;,kind:&#39;evaluate&#39;,dependencies:[],inputs:[],output_data_class:&#39;private&#39;,risk:&#39;R0&#39;,destination:null}; |
| draft | const | 6 | no | const draft={id:&#39;example&#39;,revision:1,steps:[step]}; |
| compiled | const | 7 | no | const compiled={schema:&#39;vivim.native-program/1&#39;,outcome:&#39;compiled&#39;,programId:&#39;example&#39;,programRevision:1,policyRevision:1,orderedStepIds:[&#39;read&#39;],lineage:{schema:&#39;vivim.native-transform-lineage/1&#39;,no… |
| arg | function | 8 | no | const arg=program=&gt;({program:JSON.stringify(program)}); |
| called | variable | 10 | no | let called=0; |
| validate | const | 11 | no | const validate=createNativeProgramValidator({resolveBinary:()=&gt;&#39;/trusted/native&#39;,run:async (binary,raw)=&gt;{ called++;assert.equal(binary,&#39;/trusted/native&#39;);const wire=JSON.parse(raw); assert.equal(wir… |
| out | const | 17 | no | const out=await validate(arg(draft));assert.equal(out.outcome,&#39;compiled&#39;);assert.equal(out.executionAuthorized,false); |
| entryId | const | 23 | no | const entryId=&#39;11111111-1111-1111-1111-111111111111&#39;,content=&#39;Reviewed note&#39;,digest=createHash(&#39;sha256&#39;).update(content).digest(&#39;hex&#39;); |
| productJournal | const | 24 | no | const productJournal={readProgramSources:async ids=&gt;{assert.deepEqual(ids,[entryId]);return {schema:&#39;vivim.program-wiki-sources/1&#39;,authority:&#39;host-product-journal&#39;,wikiRevision:30,items:[{entryId,con… |
| validate | const | 25 | no | const validate=createNativeProgramValidator({productJournal,resolveBinary:()=&gt;&#39;/trusted/native&#39;,run:async()=&gt;JSON.stringify(compiled)}); |
| input | const | 26 | no | const input={source_id:entryId,revision:2,digest,data_class:&#39;private&#39;}; |
| entryId | const | 37 | no | const entryId=&#39;22222222-2222-2222-2222-222222222222&#39;,digest=&#39;a&#39;.repeat(64);let reads=0; |
| productJournal | const | 38 | no | const productJournal={readProgramSources:async()=&gt;({schema:&#39;vivim.program-wiki-sources/1&#39;,authority:&#39;host-product-journal&#39;,wikiRevision:30,items:++reads===1?[{entryId,contentDigest:digest,wikiRevisio… |
| validate | const | 39 | no | const validate=createNativeProgramValidator({productJournal,resolveBinary:()=&gt;&#39;/trusted/native&#39;,run:async()=&gt;JSON.stringify(compiled)}); |
| result | const | 40 | no | const result=await validate(arg({...draft,steps:[{...step,inputs:[{source_id:entryId,revision:1,digest,data_class:&#39;private&#39;}]}]})); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../control/native-program.mjs | import | 4 | [apps/vivim-host/control/native-program.mjs](../control/native-program.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createNativeProgramValidator} from '../control/native-program.mjs';
const step={id:'read',kind:'evaluate',dependencies:[],inputs:[],output_data_class:'private',risk:'R0',destination:null};
const draft={id:'example',revision:1,steps:[step]};
const compiled={schema:'vivim.native-program/1',outcome:'compiled',programId:'example',programRevision:1,policyRevision:1,orderedStepIds:['read'],lineage:{schema:'vivim.native-transform-lineage/1',nodes:[],edges:[],executionAuthorized:false,effectPerformed:false},executionAuthorized:false,effectPerformed:false};
const arg=program=>({program:JSON.stringify(program)});
test('real Host adapter supplies fixed policy, never accepts a caller policy or authorizes execution',async()=>{
 let called=0;
 const validate=createNativeProgramValidator({resolveBinary:()=>'/trusted/native',run:async (binary,raw)=>{
  called++;assert.equal(binary,'/trusted/native');const wire=JSON.parse(raw);
  assert.equal(wire.policy.max_risk,'R0');assert.deepEqual(wire.policy.allowed_destinations,[]);
  assert.equal(wire.policy.allow_effect_candidates,false);assert.equal(wire.program.policy_id,wire.policy.id);
  return JSON.stringify(compiled);
 }});
 const out=await validate(arg(draft));assert.equal(out.outcome,'compiled');assert.equal(out.executionAuthorized,false);
 for(const bad of [{...draft,policy:{}},{...draft,steps:[{...step,risk:'R1'}]},{...draft,steps:[{...step,destination:'external'}]},{...draft,steps:[{...step,kind:'effect_candidate'}]}])
  assert.equal((await validate(arg(bad))).outcome,'refused');
 assert.equal(called,1);
});
test('current Wiki source references must match exact committed digest and revision',async()=>{
 const entryId='11111111-1111-1111-1111-111111111111',content='Reviewed note',digest=createHash('sha256').update(content).digest('hex');
 const productJournal={readProgramSources:async ids=>{assert.deepEqual(ids,[entryId]);return {schema:'vivim.program-wiki-sources/1',authority:'host-product-journal',wikiRevision:30,items:[{entryId,contentDigest:digest,wikiRevision:2,kind:'committed-wiki-edit',status:'current-section-revision'}]};}};
 const validate=createNativeProgramValidator({productJournal,resolveBinary:()=>'/trusted/native',run:async()=>JSON.stringify(compiled)});
 const input={source_id:entryId,revision:2,digest,data_class:'private'};
 assert.equal((await validate(arg({...draft,steps:[{...step,inputs:[input]}]}))).sourceReferencesVerified,1);
 assert.equal((await validate(arg({...draft,steps:[{...step,inputs:[{...input,revision:1}]}]}))).reasonCode,'PROGRAM_SOURCE_STALE');
 assert.equal((await validate(arg({...draft,steps:[{...step,inputs:[{...input,data_class:'public'}]}]}))).outcome,'refused');
});
test('missing native binary and forged authorization fail closed',async()=>{
 assert.equal((await createNativeProgramValidator({resolveBinary:()=>null})(arg(draft))).reasonCode,'NATIVE_PROGRAM_NOT_PACKAGED');
 assert.equal((await createNativeProgramValidator({resolveBinary:()=>'/trusted/native',run:async()=>JSON.stringify({...compiled,executionAuthorized:true})})(arg(draft))).reasonCode,'NATIVE_PROGRAM_CONTRACT_INVALID');
});

test('native validation rechecks exact journal evidence after native work and refuses changes',async()=>{
 const entryId='22222222-2222-2222-2222-222222222222',digest='a'.repeat(64);let reads=0;
 const productJournal={readProgramSources:async()=>({schema:'vivim.program-wiki-sources/1',authority:'host-product-journal',wikiRevision:30,items:++reads===1?[{entryId,contentDigest:digest,wikiRevision:1,kind:'committed-wiki-edit',status:'current-section-revision'}]:[]})};
 const validate=createNativeProgramValidator({productJournal,resolveBinary:()=>'/trusted/native',run:async()=>JSON.stringify(compiled)});
 const result=await validate(arg({...draft,steps:[{...step,inputs:[{source_id:entryId,revision:1,digest,data_class:'private'}]}]}));
 assert.equal(result.reasonCode,'PROGRAM_SOURCE_STALE');assert.equal(reads,2);assert.equal(result.executionAuthorized,false);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
