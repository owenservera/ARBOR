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
test('W4G-03 wrong owner, World, device, session and device surface fail closed',()=>{
  const a=stage();
  for(const changes of [{ownerId:'other'},{worldId:'world-2'},{deviceId:'other'},{sessionId:'other'},{device:'phone' as const}]) {
    refused(validateTypedEnvelope(wire(a),{...broker(),...changes}),'IDENTITY_MISMATCH');
  }
  refused(stageTypedCandidate(proof('touch','R1','phone'),broker(),controls()),'DEVICE_SURFACE_MISMATCH');
});
test('W4G-04 untrusted/ungranted/offline context and expired controls do not issue candidates',()=>{
  for(const patch of [{authenticated:false},{granted:false},{connected:false}])
    refused(stageTypedCandidate(proof(),{...broker(),...patch},controls()),'HOST_AUTHORITY_REQUIRED');
  refused(stageTypedCandidate(proof(),broker(),{...controls(),expiresAtMs:NOW-1}),'INVALID_OR_EXPIRED_CONTROLS');
  refused(validateTypedEnvelope(wire(stage()),{...broker(),nowMs:NOW+600_000}),'INVALID_OR_EXPIRED_CONTROLS');
});
test('W4G-05 stale policy, World, catalog, HQ and exact risk descriptor cannot be laundered',()=>{
  for(const patch of [{policyVersion:'policy-7'},{hostWorldVersion:'host-rev-4'},
    {catalogVersion:7},{catalogSha256:h('drift')},{hqRegistrySha256:h('drift')}])
    refused(stageTypedCandidate(proof(),{...broker(),...patch},controls()),'STALE_OR_UNREVIEWED_SOURCE');
  refused(stageTypedCandidate(proof('text','R0'),broker(),controls()),'UNREVIEWED_ACTION_OR_RISK');
  refused(stageTypedCandidate(proof(),{...broker(),reviewed:{...broker().reviewed,argsSchemaSha256:h('changed')}},controls()),'UNREVIEWED_ACTION_OR_RISK');
  refused(stageTypedCandidate(proof(),{...broker(),reviewed:{...broker().reviewed,actionId:'other.action'}},controls()),'UNREVIEWED_ACTION_OR_RISK');
});
test('W4G-06 R2 phone is NEVER a candidate; R3 is NEVER transportable',()=>{
  refused(stageTypedCandidate(proof('text','R2','phone'),broker('phone','R2'),controls()),'R2_DESKTOP_REQUIRED');
  refused(stageTypedCandidate(proof('touch','R2','phone'),broker('phone','R2'),controls()),'R2_DESKTOP_REQUIRED');
  assert.equal(stageTypedCandidate(proof('touch','R2','desktop'),broker('desktop','R2'),controls()).outcome,'candidate');
  for(const device of ['desktop','phone'] as const)
    refused(stageTypedCandidate(proof('keyboard','R3',device),broker(device,'R3'),controls()),'R3_REFUSED');
});
test('W4G-07 injection, raw text, approval material and wire mutation cannot become authority',()=>{
  const a=stage();
  refused(validateTypedEnvelope({...wire(a) as object,approval:{signed:true}},broker()),'INVALID_ENVELOPE');
  refused(validateTypedEnvelope({...wire(a) as object,text:'! execute'},broker()),'INVALID_ENVELOPE');
  const edited=wire(a) as any;edited.command.args.preset='ember';
  refused(validateTypedEnvelope(edited,broker()),'SEMANTIC_DIGEST_MISMATCH');
  const bad=wire(a) as any;bad.command.args={...bad.command.args,approval:'yes'};
  refused(validateTypedEnvelope(bad,broker()),'INVALID_TYPED_PROOF');
  const getter={...proof()};Object.defineProperty(getter,'command',{get(){throw Error('GETTER_FIRED');},enumerable:true});
  refused(stageTypedCandidate(getter as DescriptorProofResult,broker(),controls()),'NOT_A_COMPILED_CANDIDATE');
});
test('W4G-08 reordered events, conflicting idempotency and identical duplicate are not forwarded',()=>{
  const inbox=new TypedTransportInbox();
  const second=stage(proof(),broker(),controls(2)),first=stage();
  assert.equal(inbox.accept(second,broker()).outcome,'observed');
  refused(inbox.accept(first,broker()),'REORDERED_OR_REPLAYED_SEQUENCE');
  assert.equal(inbox.accept(second,broker()).outcome,'observed');
  const different=stage(proof('touch'),broker(),controls(2));
  refused(inbox.accept(different,broker()),'IDEMPOTENCY_COLLISION');
});
test('W4G-09 lost ACK / uncertain status never triggers automatic resend or definitive no-effect',()=>{
  const a=stage(),inbox=new TypedTransportInbox();
  inbox.accept(a,broker());
  const u=inbox.markUncertain(a,broker());assert.equal(u.outcome,'observed');
  if(u.outcome==='observed'){assert.equal(u.receipt.status,'uncertain');assert.equal(u.receipt.hostAccepted,false);}
  const dup=inbox.accept(a,broker());assert.equal(dup.outcome,'observed');
  if(dup.outcome==='observed'){assert.equal(dup.receipt.status,'uncertain');assert.equal(dup.receipt.replayed,true);}
  refused(inbox.cancel(a,broker(),a.controls.cancelId),'CANCEL_UNCERTAIN_CHECK_HOST');
  assert.equal(inbox.size,1);
});
test('W4G-10 cancellation requires exact correlation, is local only, and blocks revival',()=>{
  const a=stage(),inbox=new TypedTransportInbox();
  refused(inbox.cancel(a,broker(),a.controls.cancelId),'TRANSPORT_RECORD_UNKNOWN');
  inbox.accept(a,broker());
  refused(inbox.cancel(a,broker(),'other'),'CANCEL_BINDING_MISMATCH');
  const c=inbox.cancel(a,broker(),a.controls.cancelId);assert.equal(c.outcome,'observed');
  if(c.outcome==='observed'){assert.equal(c.receipt.status,'cancelled');assert.equal(c.receipt.effectPerformed,false);}
  const dup=inbox.accept(a,broker());assert.equal(dup.outcome,'observed');
  if(dup.outcome==='observed')assert.equal(dup.receipt.status,'cancelled');
  refused(inbox.markUncertain(a,broker()),'ALREADY_CANCELLED');
});
test('W4G-11 bounded ledger refuses capacity exhaustion without forgetting replay fences',()=>{
  const inbox=new TypedTransportInbox(1);const a=stage();inbox.accept(a,broker());
  refused(inbox.accept(stage(proof(),broker(),controls(2)),broker()),'TRANSPORT_LEDGER_FULL');
  const again=inbox.accept(a,broker());assert.equal(again.outcome,'observed');assert.equal(inbox.size,1);
});
test('W4G-12 no candidate for Wave 3 refusals, and no unsigned approval or Host receipt spoofing',()=>{
  const p=proof();
  refused(stageTypedCandidate({outcome:'refused',reasonCode:'R3_REFUSED',effectInvoked:false,alternatives:[]},broker(),controls()),'NOT_A_COMPILED_CANDIDATE');
  assert.equal(p.outcome,'candidate');
  const a=stage();
  const mutated=wire(a) as any;mutated.planDigest=h('fake');
  refused(validateTypedEnvelope(mutated,broker()),'INVALID_ENVELOPE');
  const riskDowngrade=wire(a) as any;riskDowngrade.command.risk.level='R0';
  refused(validateTypedEnvelope(riskDowngrade,broker()),'UNREVIEWED_ACTION_OR_RISK');
});
