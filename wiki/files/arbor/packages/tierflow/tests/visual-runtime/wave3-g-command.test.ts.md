# File: packages/tierflow/tests/visual-runtime/wave3-g-command.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-g-command.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12911 B |
| Lines | 174 |
| Hash | 64ca2ce4fc77 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hash | function | 9 | no | const hash = (text:string) =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| h | function | 10 | no | const h = (c:string) =&gt; c.repeat(64); |
| actions | const | 13 | no | const actions = [ |
| catalog | function | 20 | no | const catalog = () =&gt; JSON.stringify({schema:&#39;vivim.control-action-catalog/1&#39;,version:6, policy:{allUserFacingActionsRequireTextPath:true,uiSharesTypedExecutor:true, unverifiedActionsAreNotAvailable:… |
| hqText | const | 24 | no | const hqText = &#39;fixture HQ action-registry source; no canonical semantic ID is attested by this sample&#39;; |
| ids | const | 25 | no | const ids = {show:&#39;ui.theme.show@1&#39;,set:&#39;ui.theme.set@1&#39;,r2:&#39;privacy.hard_no.add@1&#39;,r3:&#39;machine.network.disable_all@1&#39;,missing:&#39;vivim.network.pause_egress@1&#39;} as const; |
| review | function | 26 | no | function review(actionId:string, semanticId:string, catalogText = catalog()):ReviewedHostBinding { |
| a | const | 27 | no | const a=actions.find(a=&gt;a.id===actionId)!; |
| ctx | function | 33 | no | function ctx(reviewIds: readonly (keyof typeof ids)[]=[&#39;show&#39;,&#39;set&#39;],deviceSurface:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;):DescriptorProofContext { |
| cat | const | 34 | no | const cat = catalog(); |
| actionByKey | const | 35 | no | const actionByKey={show:&#39;ui.theme.show&#39;,set:&#39;ui.theme.set_preset&#39;,r2:&#39;privacy.hard_no.add&#39;,r3:&#39;machine.network.disable_all&#39;,missing:&#39;vivim.network.pause_egress&#39;}; |
| input | function | 41 | no | function input(surface:&#39;text&#39;\|&#39;keyboard&#39;\|&#39;touch&#39;, semanticId:string,args:Record&lt;string,string&gt;={},expectedVersions={hostWorld:&#39;host-rev-3&#39;,policy:&#39;policy-6&#39;}) { |
| common | const | 42 | no | const common={commandId:&#39;g-1&#39;,source:{surface,inputDigest:h(&#39;a&#39;)},expectedVersions}; |
| accepted | function | 45 | no | function accepted(v:unknown,c:unknown=ctx()) { |
| result | const | 46 | no | const result=compileDescriptorProof(v,c);assert.equal(result.outcome,&#39;candidate&#39;,JSON.stringify(result)); |
| refused | function | 49 | no | function refused(v:unknown,c:unknown,code:string) { |
| result | const | 50 | no | const result=compileDescriptorProof(v,c);assert.notEqual(result.outcome,&#39;candidate&#39;,JSON.stringify(result)); |
| results | const | 58 | no | const results=([&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;] as const).map(s=&gt;accepted(input(s,id,args))); |
| semantics | function | 59 | no | const semantics=(r:typeof results[number])=&gt;({semanticRef:r.command.semanticRef,target:r.command.target, args:r.command.args,risk:r.command.risk,sourceVersions:r.command.sourceVersions,capability:r.c… |
| c | const | 74 | no | const c=ctx([&#39;r2&#39;],&#39;desktop&#39;); |
| r | const | 76 | no | const r=accepted(input(modality,ids.r2,{trait:&#39;no targeted ads&#39;}),c); |
| c | const | 82 | no | const c=ctx([&#39;r2&#39;],&#39;phone&#39;); |
| c | const | 87 | no | const c=ctx([&#39;r3&#39;]);refused(input(&#39;text&#39;,ids.r3),c,&#39;HOST_ACTION_NOT_WIRED&#39;); |
| cat | const | 88 | no | const cat=JSON.parse(c.catalogText);cat.actions.find((a:any)=&gt;a.id===&#39;machine.network.disable_all&#39;).readiness=&#39;source_wired&#39;; |
| text | const | 89 | no | const text=JSON.stringify(cat); |
| fixed | const | 90 | no | const fixed={...c,catalogText:text,expectedCatalogSha256:hash(text),reviews:[{...review(&#39;machine.network.disable_all&#39;,ids.r3,text)}]}; |
| c | const | 96 | no | const c=ctx();refused(input(&#39;keyboard&#39;,ids.show),{...c,reviews:[{...c.reviews[0],actionId:&#39;unlisted.action&#39;}]},&#39;UNSUPPORTED_HOST_ACTION&#39;); |
| c | const | 99 | no | const c=ctx();refused(input(&#39;text&#39;,ids.show),{...c,catalogText:c.catalogText+&#39; &#39;},&#39;SOURCE_DIGEST_MISMATCH&#39;); |
| c | const | 105 | no | const c=ctx([&#39;set&#39;]); |
| cat | const | 108 | no | const cat=JSON.parse(c.catalogText);cat.actions.find((a:any)=&gt;a.id===&#39;ui.theme.set_preset&#39;).args.preset.values=[&#39;lab&#39;,&#39;dusk&#39;]; |
| text | const | 109 | no | const text=JSON.stringify(cat); |
| c | const | 113 | no | const c=ctx([&#39;set&#39;]); |
| result | const | 115 | no | const result=compileDescriptorProof(input(&#39;keyboard&#39;,ids.set,args as Record&lt;string,string&gt;),c); |
| c | const | 120 | no | const c=ctx([&#39;set&#39;]); |
| v | const | 123 | no | const v={...input(&#39;text&#39;,ids.set,{preset:&#39;dusk&#39;}),text:phrase}; |
| c | const | 129 | no | const c=ctx([&#39;show&#39;]); |
| c | const | 134 | no | const c=ctx(); |
| c | const | 141 | no | const c=ctx();for(const extra of [{execute:true},{approval:true},{grant:&#39;owner&#39;},{shell:&#39;bash&#39;}, {hostCatalogSha256:h(&#39;f&#39;)},{descriptor:{risk:&#39;R0&#39;}},{deviceSurface:&#39;desktop&#39;}]) { |
| r | const | 145 | no | const r=accepted(input(&#39;touch&#39;,ids.show),c); |
| c | const | 151 | no | const c=ctx(); |
| getter | const | 154 | no | const getter=Object.defineProperty({},&#39;catalogText&#39;,{enumerable:true,get(){throw Error(&#39;should not call&#39;)}}); |
| cat | const | 156 | no | const cat=JSON.parse(c.catalogText);cat.policy.modelRole=&#39;execute_allowed&#39;;const text=JSON.stringify(cat); |
| c | const | 160 | no | const c=ctx(); |
| cat | const | 161 | no | const cat=JSON.parse(c.catalogText);cat.actions.push({...cat.actions[0]});const text=JSON.stringify(cat); |
| c2 | const | 163 | no | const c2=ctx([&#39;set&#39;]);const cat2=JSON.parse(c2.catalogText); |
| t2 | const | 165 | no | const t2=JSON.stringify(cat2);const badReview={...c2.reviews[0],argsSchemaSha256:descriptorArgsDigest({token:{type:&#39;string&#39;,min:1,max:10}})!,hostCatalogSha256:hash(t2)}; |
| c | const | 169 | no | const c=ctx([&#39;set&#39;]);const v=input(&#39;text&#39;,ids.set,{preset:&#39;dusk&#39;}); |
| before | const | 170 | no | const before=JSON.stringify({c,v});const r1=accepted(v,c);const r2=accepted(v,c); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:crypto | import | 4 | external |
| ../../src/visual-runtime/command/compile.ts | import | 5 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../src/visual-runtime/command/compile.ts.md) |
| ../../src/visual-runtime/command/wave3-descriptor-proof.ts | import | 6 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../src/visual-runtime/command/wave3-descriptor-proof.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** W3-G executable contract tests: real TierFlow compiler/IR/crosswalk, inert EXTERNAL catalog fixture. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { toExactText } from '../../src/visual-runtime/command/compile.ts';
import { compileDescriptorProof, descriptorArgsDigest, type DescriptorProofContext,
  type ReviewedHostBinding } from '../../src/visual-runtime/command/wave3-descriptor-proof.ts';

const hash = (text:string) => createHash('sha256').update(text).digest('hex');
const h = (c:string) => c.repeat(64);
// Selected action fields deliberately mirror Harness action-catalog.v1.json v6 at blob c423d593.
// Full live catalog bytes are broker-injected; THIS synthetic fixture is NOT a live Host snapshot.
const actions = [
  {id:'ui.theme.show',risk:'R0',readiness:'source_wired',args:{}},
  {id:'ui.theme.set_preset',risk:'R1',readiness:'source_wired',args:{preset:{type:'enum',values:['lab','tide','dusk','ember','grove','ink','dawn']}}},
  {id:'privacy.hard_no.add',risk:'R2',readiness:'source_wired',args:{trait:{type:'string',min:1,max:200}}},
  {id:'vivim.network.pause_egress',risk:'R2',readiness:'enforcement_missing',args:{}},
  {id:'machine.network.disable_all',risk:'R3',readiness:'unsupported',args:{}},
] as const;
const catalog = () => JSON.stringify({schema:'vivim.control-action-catalog/1',version:6,
  policy:{allUserFacingActionsRequireTextPath:true,uiSharesTypedExecutor:true,
    unverifiedActionsAreNotAvailable:true,modelRole:'candidate_only',sourceWiredIsNotLiveAcceptance:true},
  actions:structuredClone(actions)});
const hqText = 'fixture HQ action-registry source; no canonical semantic ID is attested by this sample';
const ids = {show:'ui.theme.show@1',set:'ui.theme.set@1',r2:'privacy.hard_no.add@1',r3:'machine.network.disable_all@1',missing:'vivim.network.pause_egress@1'} as const;
function review(actionId:string, semanticId:string, catalogText = catalog()):ReviewedHostBinding {
  const a=actions.find(a=>a.id===actionId)!;
  return {schema:'vivim.reviewed-host-binding-fixture/1',semanticId,
    semanticVersion:semanticId.split('@')[1]!,actionId,risk:a.risk,
    argsSchemaSha256:descriptorArgsDigest(a.args)!,hostCatalogSha256:hash(catalogText),
    hqRegistrySha256:hash(hqText),reviewed:true};
}
function ctx(reviewIds: readonly (keyof typeof ids)[]=['show','set'],deviceSurface:'desktop'|'phone'='desktop'):DescriptorProofContext {
  const cat = catalog();
  const actionByKey={show:'ui.theme.show',set:'ui.theme.set_preset',r2:'privacy.hard_no.add',r3:'machine.network.disable_all',missing:'vivim.network.pause_egress'};
  return {schema:'vivim.descriptor-proof-context-fixture/1',catalogText:cat,expectedCatalogSha256:hash(cat),
    hqRegistryText:hqText,expectedHqRegistrySha256:hash(hqText),
    reviews:reviewIds.map(k=>review(actionByKey[k],ids[k],cat)),deviceSurface,
    currentVersions:{hostWorld:'host-rev-3',policy:'policy-6',kb:'kb-9',uiRevision:'ui-17'}};
}
function input(surface:'text'|'keyboard'|'touch', semanticId:string,args:Record<string,string>={},expectedVersions={hostWorld:'host-rev-3',policy:'policy-6'}) {
  const common={commandId:'g-1',source:{surface,inputDigest:h('a')},expectedVersions};
  return surface==='text' ? {...common,text:toExactText(semanticId,args)} : {...common,selection:{semanticId,args}};
}
function accepted(v:unknown,c:unknown=ctx()) {
  const result=compileDescriptorProof(v,c);assert.equal(result.outcome,'candidate',JSON.stringify(result));
  if(result.outcome!=='candidate') throw Error('NOT_CANDIDATE');return result;
}
function refused(v:unknown,c:unknown,code:string) {
  const result=compileDescriptorProof(v,c);assert.notEqual(result.outcome,'candidate',JSON.stringify(result));
  if(result.outcome==='candidate') throw Error('UNEXPECTED_CANDIDATE');
  assert.equal(result.reasonCode,code);assert.equal(result.effectInvoked,false);assert.deepEqual(result.alternatives,[]);
}

test('W3G-01 exact tri-modal parity over R0 and all 7 real Host v6 theme enum values',()=>{
  for(const [id,variants] of [[ids.show,[{}]],[ids.set,['lab','tide','dusk','ember','grove','ink','dawn'].map(preset=>({preset}))]] as const) {
    for(const args of variants) {
      const results=(['text','touch','keyboard'] as const).map(s=>accepted(input(s,id,args)));
      const semantics=(r:typeof results[number])=>({semanticRef:r.command.semanticRef,target:r.command.target,
        args:r.command.args,risk:r.command.risk,sourceVersions:r.command.sourceVersions,capability:r.command.capability,
        evidence:{...r.evidence,deviceSurface:undefined}});
      assert.deepEqual(semantics(results[0]!),semantics(results[1]!));
      assert.deepEqual(semantics(results[1]!),semantics(results[2]!));
      assert.equal(results[0]!.command.target.catalogVersion,6);
      assert.equal(results[0]!.command.risk.sourceHash,hash(catalog()));
      assert.equal(results[0]!.command.semanticRef.sourceHash,hash(hqText));
      assert.equal(results[0]!.command.capability.permittedForActor,'unknown');
      assert.equal(results[0]!.evidence.liveHostVerified,false);
      assert.equal(results[0]!.evidence.hostAuthorizationRequired,true);
    }
  }
});
test('W3G-02 exact reviewed R2 allowed only as inert desktop candidate; touch on desktop is not phone',()=>{
  const c=ctx(['r2'],'desktop');
  for(const modality of ['text','touch','keyboard'] as const) {
    const r=accepted(input(modality,ids.r2,{trait:'no targeted ads'}),c);
    assert.equal(r.command.risk.level,'R2');assert.equal(r.evidence.deviceSurface,'desktop');
    assert.equal(r.command.capability.verifiedByEvidence,false);
  }
});
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
