import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHmac} from 'node:crypto';
import {createWave3ReadGatewayFixture} from '../../src/visual-runtime/host/wave3-read-gateway-fixture.ts';
import {fixtureReceiptPayload} from '../../src/visual-runtime/host/outcome.ts';
import type {
  HostActionDescriptor, HostClaimSnapshot, HostGeneralJournalReceipt,
  HostReceiptObservation, TrustedFixtureHostContext,
} from '../../src/visual-runtime/host/port.ts';

const digest = 'a'.repeat(64);
const actions: HostActionDescriptor[] = [
  {actionId:'vivim.status.show',catalogVersion:6,risk:'R0',readiness:'source_wired',
    requiredScopes:['control:read'],argsSchema:{},evidence:'verified',prerequisites:['owner sign-in']},
  {actionId:'ui.theme.set_preset',catalogVersion:6,risk:'R1',readiness:'source_wired',
    requiredScopes:['control:execute'],argsSchema:{preset:'string'},evidence:'verified',prerequisites:['owner approval']},
  {actionId:'privacy.hard_no.add',catalogVersion:6,risk:'R2',readiness:'source_wired',
    requiredScopes:['control:execute'],argsSchema:{trait:'string'},evidence:'verified',prerequisites:['desktop owner']},
  {actionId:'machine.network.disable_all',catalogVersion:6,risk:'R3',readiness:'unsupported',
    requiredScopes:['control:execute'],argsSchema:{},evidence:'unknown',prerequisites:[]},
  {actionId:'devices.summary',catalogVersion:6,risk:'R0',readiness:'source_wired',
    requiredScopes:['control:read'],argsSchema:{},evidence:'source_inspected',prerequisites:[]},
];
const gateway = () => createWave3ReadGatewayFixture({actions,catalogVersion:6,catalogDigest:digest,
  testReceiptVerifier:{keyId:'fixture-key',secret:'TEST_ONLY_not_a_real_Host_signature'}});
function context(overrides: Partial<TrustedFixtureHostContext> = {}): TrustedFixtureHostContext {
  const base: TrustedFixtureHostContext = {
    schema:'fixture.trusted-host-context/1',authenticated:true,
    ownerRef:'owner-A',actorRef:'actor-A',deviceRef:'pc-A',sessionRef:'session-A',
    worldRef:'world-A',surface:'desktop',nowMs:1700000000000,sessionExpiresAtMs:1700000600000,
    worldRevision:'world-v3',policyRevision:'policy-v2',catalogVersion:6,catalogDigest:digest,
    availabilityByAction:Object.fromEntries(actions.map(a=>[a.actionId,'yes' as const])),
    grant:{grantRef:'grant-A',status:'active',ownerRef:'owner-A',actorRef:'actor-A',
      deviceRef:'pc-A',sessionRef:'session-A',worldRef:'world-A',revision:'grant-rev-1',
      expiresAtMs:1700000500000,scopes:['control:read','control:execute']},
  };
  return {...base,...overrides};
}
function claim(overrides: Partial<HostClaimSnapshot> = {}): HostClaimSnapshot {
  return {planId:'ctl-00001',planDigest:digest,actionId:'vivim.status.show',
    ownerRef:'owner-A',actorRef:'actor-A',deviceRef:'pc-A',sessionRef:'session-A',
    worldRef:'world-A',worldRevision:'world-v3',state:'claimed',...overrides};
}
function receipt(overrides: Partial<HostGeneralJournalReceipt> = {}): HostGeneralJournalReceipt {
  return {schema:'vivim.control-receipt/1',planId:'ctl-00001',planDigest:digest,
    actionId:'vivim.status.show',status:'applied',receiptRef:'receipt-1',worldRevision:'world-v3',...overrides};
}
function unsigned(r = receipt()): HostReceiptObservation {
  return {receipt:r,evidence:{kind:'unsigned-general-journal'}};
}
function syntheticSigned(r = receipt()): HostReceiptObservation {
  return {receipt:r,evidence:{kind:'test-hmac',keyId:'fixture-key',
    macHex:createHmac('sha256','TEST_ONLY_not_a_real_Host_signature').update(fixtureReceiptPayload(r)).digest('hex')}};
}

function neverEffects(v: ReturnType<ReturnType<typeof gateway>['readCapability']>) {
  assert.equal(v.effectInvoked,false);
  assert.equal(v.canExecute,false);
  assert.equal(v.automaticRetryAllowed,false);
  assert.equal(v.source.proof,'fixture_only');
  assert.equal(v.source.liveHostVerified,false);
  assert.equal(v.recovery.automaticRetryAllowed,false);
  assert.equal(v.recovery.retryPolicy,'owner_reconcile_only');
  assert.equal(v.recovery.focus.initialFocus,'recovery-heading');
  assert.ok(v.accessibility.textEquivalent.includes('read only'));
}

test('R0 owner/world/device scoped capability is only a display projection',()=>{
  const g=gateway(), v=g.readCapability(context(),'vivim.status.show');
  assert.equal(v.state,'display_only');
  assert.deepEqual([v.capability?.supportedByBuild,v.capability?.availableNow,
    v.capability?.permittedForActor,v.capability?.verifiedByEvidence],['yes','yes','yes','yes']);
  assert.equal(v.capability?.catalogVersion,6);
  neverEffects(v);
  for (const forbidden of ['execute','dispatch','prepare','evaluateApprovalInert','grant','send'])
    assert.equal(forbidden in g,false,forbidden);
});

test('missing, pending, revoked, expired and wrong-principal grants fail closed',()=>{
  const g=gateway(), base=context(), grant=base.grant!;
  const cases = [
    [context({grant:null}),'GRANT_MISSING'],
    [context({grant:{...grant,status:'pending'}}),'GRANT_NOT_ACTIVE'],
    [context({grant:{...grant,status:'revoked'}}),'GRANT_REVOKED'],
    [context({grant:{...grant,expiresAtMs:base.nowMs}}),'GRANT_EXPIRED'],
    [context({grant:{...grant,ownerRef:'forged-owner'}}),'GRANT_PRINCIPAL_MISMATCH'],
    [context({grant:{...grant,deviceRef:'other-phone'}}),'GRANT_PRINCIPAL_MISMATCH'],
    [context({grant:{...grant,sessionRef:'old-session'}}),'GRANT_PRINCIPAL_MISMATCH'],
  ] as const;
  for(const [c,reason] of cases){const v=g.readCapability(c,'vivim.status.show');
    assert.equal(v.state,'denied');assert.equal(v.reasonCode,reason);assert.equal(v.capability,undefined);neverEffects(v);}
});

test('forged principal, expired session and malformed context do not leak catalog details',()=>{
  const g=gateway();
  const forged=context({authenticated:false,ownerRef:'other-owner'});
  const v=g.readCapability(forged,'privacy.hard_no.add');
  assert.equal(v.reasonCode,'AUTHENTICATED_PRINCIPAL_REQUIRED');
  assert.equal(v.capability,undefined);
  assert.equal(g.readCapability(context({sessionExpiresAtMs:1700000000000}),'vivim.status.show').reasonCode,'SESSION_EXPIRED');
  assert.equal(g.readCapability(null as unknown as TrustedFixtureHostContext,'vivim.status.show').state,'denied');
  neverEffects(v);
});

test('grant with execute-only scope cannot use the read gateway',()=>{
  const c=context(), g=gateway();
  const v=g.readCapability(context({grant:{...c.grant!,scopes:['control:execute']}}),'ui.theme.set_preset');
  assert.equal(v.reasonCode,'READ_SCOPE_DENIED');
  assert.equal(v.capability,undefined);
  neverEffects(v);
});

test('R2 phone and R3 every surface are denied even with synthetic available yes',()=>{
  const g=gateway();
  const phone=g.readCapability(context({surface:'phone'}),'privacy.hard_no.add');
  assert.equal(phone.state,'denied');assert.equal(phone.reasonCode,'R2_DESKTOP_REQUIRED');
  const r3=g.readCapability(context(),'machine.network.disable_all');
  assert.equal(r3.state,'denied');assert.equal(r3.reasonCode,'R3_REFUSED');
  neverEffects(phone);neverEffects(r3);
});

test('unknown action, unsupported build, stale catalog and unavailable observations never turn into yes',()=>{
  const g=gateway();
  assert.equal(g.readCapability(context(),'not-listed').reasonCode,'ACTION_UNKNOWN');
  assert.equal(g.readCapability(context(),'<script>').reasonCode,'ACTION_ID_INVALID');
  assert.equal(g.readCapability(context({catalogDigest:'b'.repeat(64)}),'vivim.status.show').state,'denied');
  const missing=g.readCapability(context({availabilityByAction:{}}),'vivim.status.show');
  assert.equal(missing.state,'uncertain');neverEffects(missing);
  const unavailable=g.readCapability(context({availabilityByAction:{'vivim.status.show':'no'}}),'vivim.status.show');
  assert.equal(unavailable.state,'denied');neverEffects(unavailable);
  const insufficient=g.readCapability(context(),'devices.summary');
  assert.equal(insufficient.state,'uncertain');neverEffects(insufficient);
});

test('no receipt after claim is uncertain, never a reason to execute again',()=>{
  const v=gateway().readReceiptStatus(context(),claim(),null);
  assert.equal(v.state,'uncertain');assert.equal(v.reasonCode,'CLAIM_WITHOUT_RECEIPT');
  assert.equal(v.receipt,undefined);neverEffects(v);
});

test('unclaimed plan cannot gain receipt status',()=>{
  const v=gateway().readReceiptStatus(context(),claim({state:'approved'}),unsigned());
  assert.equal(v.state,'denied');assert.equal(v.reasonCode,'EFFECT_NOT_CLAIMED');
  assert.equal(v.receipt,undefined);neverEffects(v);
});

test('unsigned applied/failed receipts never become signed or confirmed outcomes',()=>{
  for (const status of ['applied','failed','uncertain'] as const) {
    const v=gateway().readReceiptStatus(context(),claim(),unsigned(receipt({status})));
    assert.equal(v.state,'uncertain');
    assert.equal(v.receipt,undefined);
    assert.equal(v.reasonCode,'UNSIGNED_RECEIPT_NOT_AUTHORITATIVE');neverEffects(v);
  }
});

test('even correctly test-HMAC signed receipt remains fixture-only observation',()=>{
  const v=gateway().readReceiptStatus(context(),claim(),syntheticSigned());
  assert.equal(v.state,'observed_fixture_only');
  assert.equal(v.receipt?.reportedStatus,'applied');
  assert.equal(v.receipt?.signatureState,'verified');
  assert.equal(v.receipt?.verification,'synthetic_test_only');
  assert.equal(v.recovery.receipt,undefined,'test HMAC must not appear as signed live Host receipt');
  neverEffects(v);
});

test('bad HMAC and forged signature status are denied and reveal no receipt identifiers',()=>{
  const bad=syntheticSigned();
  const forged={...bad,evidence:{...bad.evidence,macHex:'0'.repeat(64)}} as HostReceiptObservation;
  const g=gateway();
  const v=g.readReceiptStatus(context(),claim(),forged);
  assert.equal(v.state,'denied');assert.equal(v.reasonCode,'RECEIPT_SIGNATURE_INVALID');
  assert.equal(v.receipt,undefined);neverEffects(v);
  const injected={...unsigned(),signatureState:'verified'} as unknown as HostReceiptObservation;
  const x=g.readReceiptStatus(context(),claim(),injected);
  assert.equal(x.reasonCode,'RECEIPT_CLAIMED_SIGNATURE_STATUS');
  assert.equal(x.receipt,undefined);neverEffects(x);
});

test('unknown provenance, wrong receipt digest and missing verifier fail closed',()=>{
  const g=gateway(), c=context(), p=claim();
  const unknown=g.readReceiptStatus(c,p,{receipt:receipt(),evidence:{kind:'unknown'}});
  assert.equal(unknown.state,'uncertain');assert.equal(unknown.receipt,undefined);
  const wrong=g.readReceiptStatus(c,p,unsigned(receipt({planDigest:'b'.repeat(64)})));
  assert.equal(wrong.state,'denied');assert.equal(wrong.reasonCode,'RECEIPT_CONTEXT_MISMATCH');
  const withoutVerifier=createWave3ReadGatewayFixture({actions,catalogVersion:6,catalogDigest:digest});
  const unverifiable=withoutVerifier.readReceiptStatus(c,p,syntheticSigned());
  assert.equal(unverifiable.state,'uncertain');assert.equal(unverifiable.receipt,undefined);
});

test('receipt lookups are scoped to exact actor/device/world and revoked current grant',()=>{
  const g=gateway(), c=context();
  for(const p of [claim({ownerRef:'other'}),claim({actorRef:'other'}),claim({deviceRef:'phone-2'}),
    claim({sessionRef:'other'}),claim({worldRef:'foreign'})]) {
    const v=g.readReceiptStatus(c,p,syntheticSigned());
    assert.equal(v.reasonCode,'PRINCIPAL_SCOPE_MISMATCH');
    assert.equal(v.receipt,undefined);neverEffects(v);
  }
  const revoked=g.readReceiptStatus(context({grant:{...c.grant!,status:'revoked'}}),claim(),syntheticSigned());
  assert.equal(revoked.reasonCode,'GRANT_REVOKED');assert.equal(revoked.receipt,undefined);neverEffects(revoked);
});

test('world revision changed, phone R2 and every R3 receipt lookup refuse',()=>{
  const g=gateway();
  const stale=g.readReceiptStatus(context(),claim({worldRevision:'world-old'}),syntheticSigned());
  assert.equal(stale.state,'uncertain');assert.equal(stale.receipt,undefined);
  const r2=g.readReceiptStatus(context({surface:'phone'}),claim({actionId:'privacy.hard_no.add'}),null);
  assert.equal(r2.reasonCode,'R2_DESKTOP_REQUIRED');
  const r3=g.readReceiptStatus(context(),claim({actionId:'machine.network.disable_all'}),null);
  assert.equal(r3.reasonCode,'R3_REFUSED');
});

test('UI text/touch/keyboard hostile inputs cannot dispatch any effect',()=>{
  const g=gateway();
  for(const input of [
    'send message', {modality:'touch',action:'execute',grant:'admin'},
    {modality:'keyboard',approve:true,planDigest:digest},
    {schema:'vivim.visual-command/1',target:{owner:'host_effect',actionId:'privacy.hard_no.add'}},
    Object.create(null), null,
  ]) {
    const v=g.refuseUiEffect(input);
    assert.equal(v.kind,'ui_effect_refused');assert.equal(v.state,'denied');
    assert.equal(v.reasonCode,'EFFECT_DISPATCH_NOT_SUPPORTED');neverEffects(v);
  }
});
