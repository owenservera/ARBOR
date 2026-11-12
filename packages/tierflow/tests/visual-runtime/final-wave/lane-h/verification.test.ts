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
  assert.equal(r.gate6.checks.find(x=>x.id===p.id)?.status,'fail');
});
test('H-09: unknown/fake device ID does not satisfy a physical acceptance check',()=>{
  const b=base();const p=b.proofs.find(x=>x.id==='android-apk-back-a11y')!;
  const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=>x===p?{...x,equipmentId:'fixture-phone'}:x)});
  assert.equal(r.gate6.checks.find(x=>x.id===p.id)?.status,'fail');
});
test('H-10: missing raw command/log/exit is a failed assertion',()=>{
  const b=base();const p=b.proofs[0]!;
  const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=>x===p?{...x,exitCode:null,rawLog:''}:x)});
  assert.equal(r.gate5.checks[0]?.status,'fail');
});
test('H-11: known security failure hard blocks both gates',()=>{
  const b=base();const witnesses={...b.negativeWitnesses,
    r3ExecutionAllowed:{tested:true,forbiddenObserved:true,proofId:'injection-and-foreign-scope' as const}};
  const r=evaluateFinalWave({...b,negativeWitnesses:witnesses});
  assert.ok(r.gate5.missing.some(x=>x.includes('SECURITY FAILURE: r3ExecutionAllowed')));
});
test('H-12: missing security witness is UNRUN, not a pass',()=>{
  const b=base();const w={...b.negativeWitnesses};delete w.unsignedClaimCalledVerified;
  const r=evaluateFinalWave({...b,negativeWitnesses:w});
  assert.ok(r.gate5.missing.some(x=>x.includes('security witness UNRUN: unsignedClaimCalledVerified')));
});
test('H-13: a negative witness tied to an unrun test does not prove refusal',()=>{
  const b=base();const proofs=b.proofs.map(p=>p.id==='injection-and-foreign-scope'?{...p,outcome:'unrun' as const}:p);
  const witnesses={...b.negativeWitnesses,r3ExecutionAllowed:{tested:true,forbiddenObserved:false,proofId:'injection-and-foreign-scope' as const}};
  const r=evaluateFinalWave({...b,proofs,negativeWitnesses:witnesses});
  assert.ok(r.gate5.missing.some(x=>x.includes('security witness UNRUN: r3ExecutionAllowed')));
});
test('H-14: a physical-proof row with no real build/broker ID cannot pass',()=>{
  const b=base();const p=b.proofs.find(x=>x.id==='host-receipt-truth')!;
  const r=evaluateFinalWave({...b,proofs:b.proofs.map(x=>x===p?{...x,equipmentId:undefined}:x)});
  assert.equal(r.gate6.checks.find(x=>x.id===p.id)?.status,'fail');
});
test('H-15: unowned effect route and incomplete consumers separately block Gate 6',()=>{
  const b=base();const r=evaluateFinalWave({...b,unownedActiveRoutes:1,consumerCoveragePct:99});
  assert.ok(r.gate6.missing.some(x=>x.includes('zero unowned')));
  assert.ok(r.gate6.missing.some(x=>x.includes('100%')));
});
test('H-16: explicit unrun case is reported as unrun (never pass)',()=>{
  const b=base();const r=evaluateFinalWave({...b,proofs:b.proofs.filter(x=>x.id!=='novice-first-task-observation')});
  assert.equal(r.gate6.checks.find(x=>x.id==='novice-first-task-observation')?.status,'unrun');
});
test('H-17: source IDs and check IDs are unique',()=>{
  assert.equal(new Set([...REQUIRED_5,...REQUIRED_6].map(x=>x.id)).size,REQUIRED_5.length+REQUIRED_6.length);
});
test('H-18: all four modalities with same semantic pins and document hash agree',()=>{
  const r=verifyFourInputParity(['text','touch','keyboard','studio'].map(x=>row(x as SemanticObservation['modality'])));
  assert.equal(r.ok,true);
});
test('H-19: missing Studio does not pass semantic parity',()=>{
  const r=verifyFourInputParity(['text','touch','keyboard'].map(x=>row(x as SemanticObservation['modality'])));
  assert.equal(r.ok,false);
});
test('H-20: repeated touch cannot masquerade as Studio',()=>{
  const r=verifyFourInputParity(['text','touch','touch','keyboard'].map(x=>row(x as SemanticObservation['modality'])));
  assert.equal(r.ok,false);
});
test('H-21: changed owner, world, policy or source pin breaks parity',()=>{
  for(const key of ['ownerRef','worldRef','policyVersion','sourceVersion'] as const) {
    const rows=['text','touch','keyboard','studio'].map(x=>row(x as SemanticObservation['modality']));
    rows[2]={...rows[2]!,[key]:'foreign'};
    assert.equal(verifyFourInputParity(rows).ok,false,key);
  }
});
test('H-22: risk or document hash disagreement breaks parity',()=>{
  for(const key of ['risk','documentHash','argsDigest','semanticRef','targetRef'] as const) {
    const rows=['text','touch','keyboard','studio'].map(x=>row(x as SemanticObservation['modality']));
    rows[3]={...rows[3]!,[key]:key==='risk'?'R2':'different'};
    assert.equal(verifyFourInputParity(rows).ok,false,key);
  }
});
test('H-23: R3 is never a successful parity/permission claim',()=>{
  const rows=['text','touch','keyboard','studio'].map(x=>({...row(x as SemanticObservation['modality']),risk:'R3' as const}));
  assert.equal(verifyFourInputParity(rows).ok,false);
});
test('H-24: rollback plan has no executable production side effects',()=>{
  const steps=offlineRollbackDrillPlan();
  assert.ok(steps.length>=6);
  assert.ok(steps.some(x=>x.includes('owner approval')));
  assert.equal(steps.some(x=>/git push|rm -rf|DROP TABLE|curl -X|execute effect/.test(x)),false);
});
test('H-25: invalid input fails closed',()=>{
  assert.throws(()=>evaluateFinalWave({...base(),schema:'bad' as never}),/INVALID_FINAL_H_INPUT/);
});
test('H-26: even synthetic complete I4/I5/approval inputs are never a release declaration',()=>{
  const b=base();const r=evaluateFinalWave({...b,integration4:'GO',integration5Decision:'GO',acceptedOwnerScope:true,
    separateProductionApproval:true,duplicateActiveAuthorities:0,unownedActiveRoutes:0,consumerCoveragePct:100});
  assert.equal(r.releaseAuthority,'none');
  assert.equal(r.activatedPublisher,false);
  assert.equal(r.effectInvoked,false);
});