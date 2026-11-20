# File: packages/tierflow/tests/visual-runtime/final-wave/lane-h/verification.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-h/verification.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9935 B |
| Lines | 172 |
| Hash | 7208cc8a7509 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| pins | const | 8 | no | const pins={ |
| fakeStamp | const | 13 | no | const fakeStamp=&#39;2026-11-07T00:00:00.000Z&#39;; |
| fixtureProofs | function | 14 | no | const fixtureProofs=():Proof[] =&gt; [...REQUIRED_5,...REQUIRED_6].map(spec=&gt;({ id:spec.id,outcome:&#39;pass&#39;,kind:spec.kind, source:{repo:&#39;tierflow&#39; as const,sha:pins.tierflow}, command:`fixture: pretend $… |
| base | function | 20 | no | function base():VerificationInput { |
| proofs | const | 21 | no | const proofs=fixtureProofs(); |
| witnesses | const | 22 | no | const witnesses=Object.fromEntries(NEGATIVE_INVARIANTS.map((key,i)=&gt;[key,{ tested:true,forbiddenObserved:false,proofId:REQUIRED_5[i % REQUIRED_5.length]!.id, }])); |
| row | function | 36 | no | const row=(modality:SemanticObservation[&#39;modality&#39;]):SemanticObservation=&gt;({ modality,semanticRef:&#39;ui.preview@1&#39;,targetRef:&#39;root&#39;,argsDigest:&#39;a&#39;.repeat(64),risk:&#39;R0&#39;, policyVersion:&#39;policy-1&#39;,sourceV… |
| r | const | 43 | no | const r=evaluateFinalWave(base()); |
| r | const | 49 | no | const r=evaluateFinalWave(base()); |
| r | const | 55 | no | const r=evaluateFinalWave(base()); |
| b | const | 61 | no | const b=base();const r=evaluateFinalWave({...b,handoffs:b.handoffs.slice(1)}); |
| b | const | 66 | no | const b=base();const r=evaluateFinalWave({...b,handoffs:[...b.handoffs,b.handoffs[0]! ]}); |
| b | const | 70 | no | const b=base();const first=b.proofs[0]!; |
| r | const | 71 | no | const r=evaluateFinalWave({...b,proofs:[{...first,source:{repo:&#39;tierflow&#39;,sha:pins.hq}},...b.proofs.slice(1)]}); |
| b | const | 75 | no | const b=base();const r=evaluateFinalWave({...b,proofs:[...b.proofs,b.proofs[0]!]}); |
| b | const | 79 | no | const b=base();const p=b.proofs.find(x=&gt;x.id===&#39;windows-install-upgrade-rollback&#39;)!; |
| r | const | 80 | no | const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=&gt;x===p?{...x,kind:&#39;real-module-fixture&#39; as const}:x)}); |
| b | const | 84 | no | const b=base();const p=b.proofs.find(x=&gt;x.id===&#39;android-apk-back-a11y&#39;)!; |
| r | const | 85 | no | const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=&gt;x===p?{...x,equipmentId:&#39;fixture-phone&#39;}:x)}); |
| b | const | 89 | no | const b=base();const p=b.proofs[0]!; |
| r | const | 90 | no | const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=&gt;x===p?{...x,exitCode:null,rawLog:&#39;&#39;}:x)}); |
| b | const | 94 | no | const b=base();const witnesses={...b.negativeWitnesses, |
| r | const | 96 | no | const r=evaluateFinalWave({...b,negativeWitnesses:witnesses}); |
| b | const | 100 | no | const b=base();const w={...b.negativeWitnesses};delete w.unsignedClaimCalledVerified; |
| r | const | 101 | no | const r=evaluateFinalWave({...b,negativeWitnesses:w}); |
| b | const | 105 | no | const b=base();const proofs=b.proofs.map(p=&gt;p.id===&#39;injection-and-foreign-scope&#39;?{...p,outcome:&#39;unrun&#39; as const}:p); |
| witnesses | const | 106 | no | const witnesses={...b.negativeWitnesses,r3ExecutionAllowed:{tested:true,forbiddenObserved:false,proofId:&#39;injection-and-foreign-scope&#39; as const}}; |
| r | const | 107 | no | const r=evaluateFinalWave({...b,proofs,negativeWitnesses:witnesses}); |
| b | const | 111 | no | const b=base();const p=b.proofs.find(x=&gt;x.id===&#39;host-receipt-truth&#39;)!; |
| r | const | 112 | no | const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=&gt;x===p?{...x,equipmentId:undefined}:x)}); |
| b | const | 116 | no | const b=base();const r=evaluateFinalWave({...b,unownedActiveRoutes:1,consumerCoveragePct:99}); |
| b | const | 121 | no | const b=base();const r=evaluateFinalWave({...b,proofs:b.proofs.filter(x=&gt;x.id!==&#39;novice-first-task-observation&#39;)}); |
| r | const | 128 | no | const r=verifyFourInputParity([&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;,&#39;studio&#39;].map(x=&gt;row(x as SemanticObservation[&#39;modality&#39;]))); |
| r | const | 132 | no | const r=verifyFourInputParity([&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;].map(x=&gt;row(x as SemanticObservation[&#39;modality&#39;]))); |
| r | const | 136 | no | const r=verifyFourInputParity([&#39;text&#39;,&#39;touch&#39;,&#39;touch&#39;,&#39;keyboard&#39;].map(x=&gt;row(x as SemanticObservation[&#39;modality&#39;]))); |
| rows | const | 141 | no | const rows=[&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;,&#39;studio&#39;].map(x=&gt;row(x as SemanticObservation[&#39;modality&#39;])); |
| rows | const | 148 | no | const rows=[&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;,&#39;studio&#39;].map(x=&gt;row(x as SemanticObservation[&#39;modality&#39;])); |
| rows | const | 154 | no | const rows=[&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;,&#39;studio&#39;].map(x=&gt;({...row(x as SemanticObservation[&#39;modality&#39;]),risk:&#39;R3&#39; as const})); |
| steps | const | 158 | no | const steps=offlineRollbackDrillPlan(); |
| b | const | 167 | no | const b=base();const r=evaluateFinalWave({...b,integration4:&#39;GO&#39;,integration5Decision:&#39;GO&#39;,acceptedOwnerScope:true, separateProductionApproval:true,duplicateActiveAuthorities:0,unownedActiveRoutes:0,… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../../../src/visual-runtime/final-wave/lane-h/verification.ts | import | 3 | [packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts](../../../../src/visual-runtime/final-wave/lane-h/verification.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FINAL_H_SCHEMA,LANES,NEGATIVE_INVARIANTS,REQUIRED_5,REQUIRED_6,
  evaluateFinalWave,verifyFourInputParity,offlineRollbackDrillPlan,
  type VerificationInput,type Proof,type SemanticObservation,
} from '../../../../src/visual-runtime/final-wave/lane-h/verification.ts';
const pins={
  tierflow:'2f2d4d623ea83c901b7666f1601162f9da975401',
  harness:'09382c61f74a304f120b05445f6dfa900b58494b',
  hq:'6679752362a5ef58aa66e2af5463f9d81077001c',
};
const fakeStamp='2026-11-07T00:00:00.000Z';
const fixtureProofs=():Proof[] => [...REQUIRED_5,...REQUIRED_6].map(spec=>({
  id:spec.id,outcome:'pass',kind:spec.kind,
  source:{repo:'tierflow' as const,sha:pins.tierflow},
  command:`fixture: pretend ${spec.id}`,rawLog:`test-fixture/${spec.id}.txt`,
  exitCode:0,observedAt:fakeStamp,equipmentId:'SIMULATED_TEST_ONLY',
}));
function base():VerificationInput {
  const proofs=fixtureProofs();
  const witnesses=Object.fromEntries(NEGATIVE_INVARIANTS.map((key,i)=>[key,{
    tested:true,forbiddenObserved:false,proofId:REQUIRED_5[i % REQUIRED_5.length]!.id,
  }]));
  return {
    schema:FINAL_H_SCHEMA,pins,integration4:'BLOCKED',integration5Decision:'UNRUN',
    acceptedOwnerScope:false,separateProductionApproval:false,
    handoffs:LANES.map(lane=>({lane,sha:pins.tierflow,
      sourcePaths:[`src/visual-runtime/final-wave/lane-${lane.toLowerCase()}/core.ts`],
      testPaths:[`tests/visual-runtime/final-wave/lane-${lane.toLowerCase()}/core.test.ts`],
      rawLogs:[`fixture:${lane}`],status:'implemented' as const})),
    proofs,negativeWitnesses:witnesses,duplicateActiveAuthorities:null,
    unownedActiveRoutes:null,consumerCoveragePct:null,
  };
}
const row=(modality:SemanticObservation['modality']):SemanticObservation=>({
  modality,semanticRef:'ui.preview@1',targetRef:'root',argsDigest:'a'.repeat(64),risk:'R0',
  policyVersion:'policy-1',sourceVersion:'ui-3',documentHash:'b'.repeat(64),
  ownerRef:'owner_a',worldRef:'world_a',
});

test('H-01: Gate 5 cannot bypass I4 BLOCKED despite synthetic green rows',()=>{
  const r=evaluateFinalWave(base());
  assert.equal(r.gate5.decision,'BLOCKED');
  assert.ok(r.gate5.missing.some(x=>x.includes('Integration 4 BLOCKED')));
  assert.equal(r.releaseAuthority,'none');
});
test('H-02: Gate 6 cannot bypass unapproved production or I5 UNRUN',()=>{
  const r=evaluateFinalWave(base());
  assert.equal(r.gate6.decision,'BLOCKED');
  assert.ok(r.gate6.missing.some(x=>x.includes('Integration 5 UNRUN')));
  assert.ok(r.gate6.missing.some(x=>x.includes('approval absent')));
});
test('H-03: no Host effect, publisher activation or auto retry in evaluator',()=>{
  const r=evaluateFinalWave(base());
  assert.equal(r.effectInvoked,false);
  assert.equal(r.activatedPublisher,false);
  assert.equal(r.automaticRetryAllowed,false);
});
test('H-04: missing one lane is a hard blocker on both gates',()=>{
  const b=base();const r=evaluateFinalWave({...b,handoffs:b.handoffs.slice(1)});
  assert.ok(r.gate5.missing.some(x=>x.includes('lane A: handoff absent')));
  assert.ok(r.gate6.missing.some(x=>x.includes('lane A: handoff absent')));
});
test('H-05: duplicate lane is rejected',()=>{
  const b=base();const r=evaluateFinalWave({...b,handoffs:[...b.handoffs,b.handoffs[0]! ]});
  assert.ok(r.gate5.missing.some(x=>x.includes('duplicate')));
});
test('H-06: source pin mismatch fails proof even when outcome=pass',()=>{
  const b=base();const first=b.proofs[0]!;
  const r=evaluateFinalWave({...b,proofs:[{...first,source:{repo:'tierflow',sha:pins.hq}},...b.proofs.slice(1)]});
  assert.equal(r.gate5.checks[0]?.status,'fail');
});
test('H-07: duplicate acceptance proofs are refused, not picked first',()=>{
  const b=base();const r=evaluateFinalWave({...b,proofs:[...b.proofs,b.proofs[0]!]});
  assert.equal(r.gate5.checks[0]?.status,'fail');
});
test('H-08: synthetic fixture cannot satisfy actual Windows native evidence',()=>{
  const b=base();const p=b.proofs.find(x=>x.id==='windows-install-upgrade-rollback')!;
  const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=>x===p?{...x,kind:'real-module-fixture' as const}:x)});
```

_First 80 of 172 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
