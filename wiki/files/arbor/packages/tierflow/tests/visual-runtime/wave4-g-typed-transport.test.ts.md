# File: packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 11711 B |
| Lines | 164 |
| Hash | f31d9920a237 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| h | function | 11 | no | const h=(s:string)=&gt;createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| CATALOG | const | 12 | no | const CATALOG=h(&#39;host-catalog-v6&#39;),HQ=h(&#39;hq-reviewed-fixture&#39;),ARG=h(&#39;reviewed-argument-schema&#39;); |
| NOW | const | 13 | no | const NOW=1_800_000_000_000; |
| ACTION | const | 14 | no | const ACTION=&#39;ui.theme.set_preset&#39;,SEMANTIC=&#39;ui.theme.set@1&#39;; |
| versions | const | 15 | no | const versions={hostWorld:&#39;host-rev-3&#39;,policy:&#39;policy-6&#39;,kb:&#39;kb-9&#39;,uiRevision:&#39;ui-17&#39;}; |
| broker | function | 16 | no | function broker(device:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;,risk:Risk=&#39;R1&#39;):TransportAuthority { |
| controls | function | 23 | no | function controls(sequence=1):TransportControls { |
| proof | function | 27 | no | function proof(surface:Modality=&#39;text&#39;,risk:Risk=&#39;R1&#39;,device:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;):DescriptorProofResult { |
| stage | function | 40 | no | function stage(p:DescriptorProofResult=proof(),b:TransportAuthority=broker(),c:TransportControls=controls()):TypedCandidateEnvelope { |
| r | const | 41 | no | const r=stageTypedCandidate(p,b,c); |
| refused | function | 47 | no | function refused(value:{outcome:string;reasonCode?:string;effectPerformed?:boolean},reason:string):void { |
| wire | function | 50 | no | function wire(e:TypedCandidateEnvelope):unknown { return JSON.parse(JSON.stringify(e)); } |
| results | const | 54 | no | const results=([&#39;desktop&#39;,&#39;phone&#39;] as const).flatMap(device=&gt; ([&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;] as const).map(surface=&gt;stage(proof(surface,&#39;R1&#39;,device),broker(device),controls()))); |
| a | const | 70 | no | const a=stage(),inbox=new TypedTransportInbox(); |
| first | const | 71 | no | const first=inbox.accept(wire(a),broker()); |
| again | const | 77 | no | const again=inbox.accept(wire(a),broker());assert.equal(again.outcome,&#39;observed&#39;); |
| a | const | 82 | no | const a=stage(); |
| a | const | 110 | no | const a=stage(); |
| edited | const | 113 | no | const edited=wire(a) as any;edited.command.args.preset=&#39;ember&#39;; |
| bad | const | 115 | no | const bad=wire(a) as any;bad.command.args={...bad.command.args,approval:&#39;yes&#39;}; |
| getter | const | 117 | no | const getter={...proof()};Object.defineProperty(getter,&#39;command&#39;,{get(){throw Error(&#39;GETTER_FIRED&#39;);},enumerable:true}); |
| inbox | const | 121 | no | const inbox=new TypedTransportInbox(); |
| second | const | 122 | no | const second=stage(proof(),broker(),controls(2)),first=stage(); |
| different | const | 126 | no | const different=stage(proof(&#39;touch&#39;),broker(),controls(2)); |
| a | const | 130 | no | const a=stage(),inbox=new TypedTransportInbox(); |
| u | const | 132 | no | const u=inbox.markUncertain(a,broker());assert.equal(u.outcome,&#39;observed&#39;); |
| dup | const | 134 | no | const dup=inbox.accept(a,broker());assert.equal(dup.outcome,&#39;observed&#39;); |
| a | const | 140 | no | const a=stage(),inbox=new TypedTransportInbox(); |
| c | const | 144 | no | const c=inbox.cancel(a,broker(),a.controls.cancelId);assert.equal(c.outcome,&#39;observed&#39;); |
| dup | const | 146 | no | const dup=inbox.accept(a,broker());assert.equal(dup.outcome,&#39;observed&#39;); |
| inbox | const | 151 | no | const inbox=new TypedTransportInbox(1);const a=stage();inbox.accept(a,broker()); |
| again | const | 153 | no | const again=inbox.accept(a,broker());assert.equal(again.outcome,&#39;observed&#39;);assert.equal(inbox.size,1); |
| p | const | 156 | no | const p=proof(); |
| a | const | 159 | no | const a=stage(); |
| mutated | const | 160 | no | const mutated=wire(a) as any;mutated.planDigest=h(&#39;fake&#39;); |
| riskDowngrade | const | 162 | no | const riskDowngrade=wire(a) as any;riskDowngrade.command.risk.level=&#39;R0&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 3 | external |
| node:assert/strict | import | 4 | external |
| node:crypto | import | 5 | external |
| ../../src/visual-runtime/command/wave4-typed-transport-adapter.ts | import | 6 | [packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts](../../src/visual-runtime/command/wave4-typed-transport-adapter.ts.md) |
| ../../src/visual-runtime/command/wave3-descriptor-proof.ts | import | 8 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../src/visual-runtime/command/wave3-descriptor-proof.ts.md) |
| ../../src/visual-runtime/command/ir.ts | import | 9 | [packages/tierflow/src/visual-runtime/command/ir.ts](../../src/visual-runtime/command/ir.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Lane G executable pure-contract tests. The source inputs match Wave 3 G descriptor-proof output;
 * no test claims to authenticate a real Host, grant, phone, APK, or provider side effect. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { stageTypedCandidate,validateTypedEnvelope,TypedTransportInbox,
  type TransportAuthority,type TransportControls,type TypedCandidateEnvelope } from '../../src/visual-runtime/command/wave4-typed-transport-adapter.ts';
import type { DescriptorProofResult } from '../../src/visual-runtime/command/wave3-descriptor-proof.ts';
import type { Risk,Modality } from '../../src/visual-runtime/command/ir.ts';

const h=(s:string)=>createHash('sha256').update(s).digest('hex');
const CATALOG=h('host-catalog-v6'),HQ=h('hq-reviewed-fixture'),ARG=h('reviewed-argument-schema');
const NOW=1_800_000_000_000;
const ACTION='ui.theme.set_preset',SEMANTIC='ui.theme.set@1';
const versions={hostWorld:'host-rev-3',policy:'policy-6',kb:'kb-9',uiRevision:'ui-17'};
function broker(device:'desktop'|'phone'='desktop',risk:Risk='R1'):TransportAuthority {
  return {ownerId:'owner-1',worldId:'world-1',deviceId:device==='phone'?'phone-1':'desktop-1',
    sessionId:'session-1',device,authenticated:true,granted:true,connected:true,nowMs:NOW,
    policyVersion:versions.policy,hostWorldVersion:versions.hostWorld,catalogVersion:6,
    catalogSha256:CATALOG,hqRegistrySha256:HQ,
    reviewed:{semanticId:SEMANTIC,actionId:ACTION,risk,argsSchemaSha256:ARG}};
}
function controls(sequence=1):TransportControls {
  return {correlationId:'corr-'+sequence,idempotencyKey:'idem-'+sequence,nonce:'nonce-'+sequence,
    cancelId:'cancel-'+sequence,sequence,issuedAtMs:NOW-1000,expiresAtMs:NOW+300_000};
}
function proof(surface:Modality='text',risk:Risk='R1',device:'desktop'|'phone'='desktop'):DescriptorProofResult {
  return {outcome:'candidate',command:{schema:'vivim.visual-command/1',commandId:'command-'+surface,
    source:{surface,inputDigest:h('raw-'+surface)},
    semanticRef:{id:SEMANTIC,version:'1',sourceHash:HQ},
    target:{owner:'host_effect',actionId:ACTION,catalogVersion:6},args:{preset:'dusk'},
    risk:{level:risk,source:'host_catalog',sourceHash:CATALOG},sourceVersions:{...versions},
    interpretation:{method:surface==='text'?'exact-text':'explicit-selector',outcome:'candidate',reasonCodes:[]},
    capability:{supportedByBuild:true,availableNow:'unknown',permittedForActor:'unknown',
      verifiedByEvidence:false,reasonCodes:['FIXTURE_ONLY','LIVE_HOST_NOT_CHECKED']}},
    evidence:{evidenceClass:'source_bound_inert_fixture',effectInvoked:false,hostAuthorizationRequired:true,
      liveHostVerified:false,catalogVersion:6,catalogSha256:CATALOG,hqRegistrySha256:HQ,
      argsSchemaSha256:ARG,deviceSurface:device}};
}
function stage(p:DescriptorProofResult=proof(),b:TransportAuthority=broker(),c:TransportControls=controls()):TypedCandidateEnvelope {
  const r=stageTypedCandidate(p,b,c);
  assert.equal(r.outcome,'candidate',JSON.stringify(r));
  if(r.outcome!=='candidate') throw Error('NOT_CANDIDATE');
  assert.equal(r.effectPerformed,false);
  return r.envelope;
}
function refused(value:{outcome:string;reasonCode?:string;effectPerformed?:boolean},reason:string):void {
  assert.equal(value.outcome,'refused');assert.equal(value.reasonCode,reason);assert.equal(value.effectPerformed,false);
}
function wire(e:TypedCandidateEnvelope):unknown { return JSON.parse(JSON.stringify(e)); }

// Three-part proof: same semantic meaning, different input modality and transport identity.
test('W4G-01 text/touch/keyboard and PC/phone preserve one canonical semantic digest',()=>{
  const results=(['desktop','phone'] as const).flatMap(device=>
    (['text','touch','keyboard'] as const).map(surface=>stage(proof(surface,'R1',device),broker(device),controls())));
  for(const r of results){
    assert.equal(r.semanticDigest,results[0]!.semanticDigest);
    assert.equal(r.command.target.actionId,ACTION);
    assert.deepEqual(r.command.args,{preset:'dusk'});
    assert.equal(r.command.risk.level,'R1');
    assert.equal(r.command.target.catalogVersion,6);
    assert.equal(r.command.sourceVersions.policy,'policy-6');
    assert.equal(r.sourceEvidence.argsSchemaSha256,ARG);
    assert.equal(r.executionAuthority,'none');assert.equal(r.approval,'not_requested');
    assert.ok(!JSON.stringify(r).includes('Approve & apply'));
  }
  assert.notEqual(results[0]!.envelopeDigest,results[1]!.envelopeDigest);
});
test('W4G-02 scoped read-only transport receipt and duplicate delivery are replay-safe within one inbox',()=>{
  const a=stage(),inbox=new TypedTransportInbox();
  const first=inbox.accept(wire(a),broker());
  assert.equal(first.outcome,'observed');
  if(first.outcome!=='observed')return;
  assert.equal(first.receipt.status,'received');assert.equal(first.receipt.replayed,false);
  assert.equal(first.receipt.hostAccepted,false);assert.equal(first.receipt.executionAuthorized,false);
  assert.equal(first.receipt.effectPerformed,false);
  const again=inbox.accept(wire(a),broker());assert.equal(again.outcome,'observed');
  if(again.outcome==='observed'){assert.equal(again.receipt.replayed,true);assert.equal(again.receipt.semanticDigest,first.receipt.semanticDigest);}
  assert.equal(inbox.size,1);
});
```

_First 80 of 165 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
