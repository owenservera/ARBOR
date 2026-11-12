import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHmac} from 'node:crypto';
import {createHostCapabilityFixture} from '../../src/visual-runtime/host/fixture.ts';
import {fixtureReceiptPayload} from '../../src/visual-runtime/host/outcome.ts';
import type {HostActionDescriptor, InertHostCommand, InertHostPlan,
  HostClaimSnapshot, HostGeneralJournalReceipt, TrustedFixtureHostContext, HostReceiptObservation} from '../../src/visual-runtime/host/port.ts';

const digest='f'.repeat(64), keyId='synthetic-test-key', secret='synthetic-only-secret-2026';
const actions: HostActionDescriptor[] = [{actionId:'ui.theme.set_preset',catalogVersion:6,risk:'R1',
  readiness:'source_wired',evidence:'verified',argsSchema:{preset:{type:'enum',values:['dusk','tide','dawn']}},
  requiredScopes:['control:execute'],prerequisites:['owner review']}];
function c(overrides:Partial<TrustedFixtureHostContext>={}): TrustedFixtureHostContext {
  const base:TrustedFixtureHostContext={schema:'fixture.trusted-host-context/1',authenticated:true,
    ownerRef:'ow-A',actorRef:'actor-A',deviceRef:'pc-A',sessionRef:'session-A',worldRef:'world-A',
    surface:'desktop',nowMs:1700000000000,sessionExpiresAtMs:1700000300000,
    worldRevision:'rev-A',policyRevision:'policy-A',catalogVersion:6,catalogDigest:digest,
    availabilityByAction:{'ui.theme.set_preset':'yes'},
    grant:{grantRef:'g-A',status:'active',ownerRef:'ow-A',actorRef:'actor-A',deviceRef:'pc-A',
      sessionRef:'session-A',worldRef:'world-A',expiresAtMs:1700000200000,
      revision:'grant-A',scopes:['control:execute']}};
  return {...base,...overrides};
}
const command:InertHostCommand={schema:'vivim.visual-command/1',commandId:'safe-cmd',
  target:{owner:'host_effect',actionId:'ui.theme.set_preset',catalogVersion:6},
  args:{preset:'dusk'},sourceVersions:{hostWorld:'rev-A',policy:'policy-A',catalogDigest:digest}};
function port(withVerifier=true){return createHostCapabilityFixture({catalogVersion:6,catalogDigest:digest,actions,
  ...(withVerifier?{testReceiptVerifier:{keyId,secret}}:{})});}
function plan(){const r=port().prepare(command,c());assert.equal(r.kind,'prepared_inert');
  if(r.kind!=='prepared_inert')throw new Error('unreachable');return r.plan;}
function approval(p:InertHostPlan){return {channel:'desktop-owner-token' as const,ownerConfirmed:true,planDigest:p.planDigest};}
function claim(p:InertHostPlan):HostClaimSnapshot{return {planId:p.planId,planDigest:p.planDigest,actionId:p.actionId,
  ownerRef:p.ownerRef,actorRef:p.actorRef,deviceRef:p.deviceRef,sessionRef:p.sessionRef,
  worldRef:p.worldRef,worldRevision:p.worldRevision,state:'claimed'};}
function receipt(p:InertHostPlan):HostGeneralJournalReceipt{return {schema:'vivim.control-receipt/1',
  planId:p.planId,planDigest:p.planDigest,actionId:p.actionId,receiptRef:'receipt-1',
  worldRevision:p.worldRevision,status:'applied'};}
function signed(r:HostGeneralJournalReceipt):HostReceiptObservation{return {receipt:r,
  evidence:{kind:'test-hmac',keyId,macHex:createHmac('sha256',secret).update(fixtureReceiptPayload(r)).digest('hex')}};}
const denial=(p:ReturnType<typeof port>,ctx:TrustedFixtureHostContext)=>{
  const result=p.prepare(command,ctx);assert.equal(result.kind,'denied',JSON.stringify(result));
  return result.kind==='denied'?result.reasonCode:'unreachable';
};

test('cross-owner, actor, World, device, session, and forged grant-binding all fail closed',()=>{
  const p=port();
  for(const field of ['ownerRef','actorRef','worldRef','deviceRef','sessionRef'] as const){
    const ctx=c({[field]:`${field}-other`});
    assert.equal(denial(p,ctx),'GRANT_PRINCIPAL_MISMATCH',field);
  }
  assert.equal(denial(p,c({authenticated:false})),'AUTHENTICATED_PRINCIPAL_REQUIRED');
  assert.equal(denial(p,c({grant:null})),'GRANT_MISSING');
});

test('revoked, pending, expired grants and expired sessions deny even with catalog and data available',()=>{
  const p=port(),g=c().grant!;
  assert.equal(denial(p,c({grant:{...g,status:'revoked'}})),'GRANT_REVOKED');
  assert.equal(denial(p,c({grant:{...g,status:'pending'}})),'GRANT_NOT_ACTIVE');
  assert.equal(denial(p,c({grant:{...g,expiresAtMs:c().nowMs}})),'GRANT_EXPIRED');
  assert.equal(denial(p,c({sessionExpiresAtMs:c().nowMs})),'SESSION_EXPIRED');
  assert.equal(denial(p,c({grant:{...g,scopes:['control:read']}})),'SCOPE_DENIED');
});

test('changed grant after prepare, including revocation, defeats approval; no effect',()=>{
  const p=port(),x=plan(),g=c().grant!;
  for(const next of [c({grant:{...g,revision:'r2'}}),c({grant:{...g,status:'revoked'}}),
    c({grant:{...g,scopes:['control:read']}}),c({deviceRef:'another-device'}),c({ownerRef:'another-owner'})]){
    const r=p.evaluateApprovalInert(x,approval(x),next);
    assert.equal(r.kind,'denied');assert.equal(r.effectInvoked,false);
  }
});

test('stale digest, catalog, World and policy are denied during approval revalidation',()=>{
  const p=port(),x=plan();
  for(const ctx of [c({worldRevision:'rev-B'}),c({policyRevision:'policy-B'}),
    c({catalogDigest:'e'.repeat(64)}),c({catalogVersion:7}),
    c({availabilityByAction:{'ui.theme.set_preset':'unknown'}})]){
    const r=p.evaluateApprovalInert(x,approval(x),ctx);
    assert.equal(r.kind,'denied');assert.equal(r.effectInvoked,false);
  }
});

test('plan digest, exact approval digest, expiry and actor/surface mismatches refuse',()=>{
  const p=port(),x=plan();
  assert.equal(p.evaluateApprovalInert({...x,args:{preset:'tide'}},approval(x),c()).kind,'denied');
  assert.equal(p.evaluateApprovalInert(x,{...approval(x),planDigest:'forged'},c()).kind,'denied');
  assert.equal(p.evaluateApprovalInert(x,approval(x),c({nowMs:x.expiresAtMs})).kind,'denied');
  assert.equal(p.evaluateApprovalInert(x,approval(x),c({surface:'phone'})).kind,'denied');
  assert.equal(p.evaluateApprovalInert(x,{...approval(x),channel:'direct-phone'},c()).kind,'denied');
});

test('claim without receipt (ACK loss / crash after claim) remains uncertain, never blind replays',()=>{
  const p=port(),x=plan();
  const out=p.reconcileClaimReadOnly(claim(x),null,c());
  assert.equal(out.status,'uncertain');assert.equal(out.reasonCode,'CLAIM_WITHOUT_RECEIPT');
  assert.equal(out.signatureState,'unknown');assert.equal(out.effectInvoked,false);
  assert.equal(out.requiresReadOnlyReconcile,true);assert.equal('execute' in p,false);
});

test('planned or merely approved operation with no claim cannot be represented as applied',()=>{
  const p=port(),x=plan();
  for(const state of ['planned','approved'] as const){
    const out=p.reconcileClaimReadOnly({...claim(x),state},signed(receipt(x)),c());
    assert.equal(out.status,'denied');assert.equal(out.reasonCode,'EFFECT_NOT_CLAIMED');
  }
});

test('general control journal applied receipt is UNSIGNED, even if observed',()=>{
  const p=port(),x=plan();
  const out=p.reconcileClaimReadOnly(claim(x),{receipt:receipt(x),evidence:{kind:'unsigned-general-journal'}},c());
  assert.equal(out.status,'applied');assert.equal(out.signatureState,'unsigned');
  assert.equal(out.source.proof,'fixture_only');assert.equal(out.effectInvoked,false);
});

test('fixture-only HMAC proof validates, but does not claim production Host signing',()=>{
  const p=port(),x=plan();
  const out=p.reconcileClaimReadOnly(claim(x),signed(receipt(x)),c());
  assert.equal(out.status,'applied');assert.equal(out.signatureState,'verified');
  assert.equal(out.source.authority,'host-control-journal-fixture');
  assert.equal(out.source.proof,'fixture_only');
});

test('forged test HMAC or forged signatureState is refused with invalid signature state',()=>{
  const p=port(),x=plan(),r=receipt(x),signedProof=signed(r);
  const bad=p.reconcileClaimReadOnly(claim(x),{receipt:r,evidence:{kind:'test-hmac',keyId,macHex:'0'.repeat(64)}},c());
  assert.deepEqual([bad.status,bad.signatureState,bad.reasonCode],['denied','invalid','RECEIPT_SIGNATURE_INVALID']);
  const spoof=p.reconcileClaimReadOnly(claim(x),{...signedProof,signatureState:'verified'} as HostReceiptObservation,c());
  assert.deepEqual([spoof.status,spoof.signatureState],['denied','invalid']);
  const spoof2=p.reconcileClaimReadOnly(claim(x),{receipt:{...r,signatureState:'verified'},evidence:{kind:'unsigned-general-journal'}} as HostReceiptObservation,c());
  assert.deepEqual([spoof2.status,spoof2.signatureState],['denied','invalid']);
});

test('unknown signer/receipt provenance is uncertain not success',()=>{
  const x=plan(),r=receipt(x);
  const unknown=port(false).reconcileClaimReadOnly(claim(x),signed(r),c());
  assert.equal(unknown.status,'uncertain');assert.equal(unknown.signatureState,'unknown');
  assert.equal(unknown.requiresReadOnlyReconcile,true);
  const unproven=port().reconcileClaimReadOnly(claim(x),{receipt:r,evidence:{kind:'unknown'}},c());
  assert.equal(unproven.status,'uncertain');
});

test('cross-owner receipt/claim and action/digest/world mismatch never leak a foreign receiptRef',()=>{
  const p=port(),x=plan();
  const alien=p.reconcileClaimReadOnly({...claim(x),ownerRef:'ow-B'},signed(receipt(x)),c());
  assert.equal(alien.status,'denied');assert.equal(alien.receiptRef,undefined);
  for(const r of [{...receipt(x),actionId:'different'},
                   {...receipt(x),planDigest:'0'.repeat(64)},
                   {...receipt(x),worldRevision:'different'}]){
    const out=p.reconcileClaimReadOnly(claim(x),signed(r),c());
    assert.equal(out.status,'denied');assert.equal(out.receiptRef,undefined);
  }
});

test('replayed observation remains a read-only receipt, not a second execution',()=>{
  const p=port(),x=plan();
  const out=p.reconcileClaimReadOnly(claim(x),{receipt:receipt(x),evidence:{kind:'unsigned-general-journal'},replayed:true},c());
  assert.equal(out.status,'replayed');assert.equal(out.signatureState,'unsigned');
  assert.equal(out.reasonCode,'READ_ONLY_REPLAY_OBSERVED');assert.equal(out.effectInvoked,false);
});

test('uncertain and failed Host journal statuses are never elevated to applied',()=>{
  const p=port(),x=plan();
  for(const status of ['uncertain','failed'] as const){
    const out=p.reconcileClaimReadOnly(claim(x),{receipt:{...receipt(x),status},evidence:{kind:'unsigned-general-journal'}},c());
    assert.equal(out.status,status);assert.equal(out.signatureState,'unsigned');
  }
});


test('revoked or expired reconciliation grant never discloses receipt references',()=>{
  const p=port(),x=plan(),g=c().grant!;
  for(const ctx of [c({grant:{...g,status:'revoked'}}),c({grant:{...g,expiresAtMs:c().nowMs}}),
    c({sessionExpiresAtMs:c().nowMs}),c({grant:{...g,scopes:[]}})]){
    const out=p.reconcileClaimReadOnly(claim(x),signed(receipt(x)),ctx);
    assert.equal(out.status,'denied');assert.equal(out.receiptRef,undefined);
  }
});

test('World moved after claim: read-only reconcile says uncertain, not applied',()=>{
  const p=port(),x=plan();
  const out=p.reconcileClaimReadOnly(claim(x),signed(receipt(x)),c({worldRevision:'new-world-revision'}));
  assert.equal(out.status,'uncertain');assert.equal(out.reasonCode,'WORLD_REVISION_CHANGED');
  assert.equal(out.effectInvoked,false);assert.equal(out.receiptRef,undefined);
});

test('bounded deterministic adversarial tamper matrix denies altered approved plans',()=>{
  const p=port(),x=plan();
  const fields: (keyof InertHostPlan)[]=['planId','commandId','actionId','ownerRef','actorRef','deviceRef',
    'sessionRef','worldRef','grantRef','grantRevision','catalogDigest','worldRevision','policyRevision'];
  for(const field of fields){
    const changed={...x,[field]:String(x[field])+'-tampered'};
    const out=p.evaluateApprovalInert(changed,approval(changed),c());
    assert.equal(out.kind,'denied',field);
    assert.equal(out.effectInvoked,false);
  }
});


test('corrupt claim state or failed-replay never becomes apparent applied success',()=>{
  const p=port(),x=plan();
  const corrupted=p.reconcileClaimReadOnly({...claim(x),state:'not-claimed' as 'claimed'},signed(receipt(x)),c());
  assert.equal(corrupted.status,'denied');
  const failed=p.reconcileClaimReadOnly(claim(x),{receipt:{...receipt(x),status:'failed'},
    evidence:{kind:'unsigned-general-journal'},replayed:true},c());
  assert.equal(failed.status,'failed');
});
