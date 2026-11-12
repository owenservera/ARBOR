import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createWave4HostStatusContract, type HostPlanRead, type HostReadScope,
  type HostStatusQuery, type Wave4HostReadPort, type Wave4HostStatus} from '../../src/visual-runtime/host/wave4-h-host-status-contract.ts';
import type {HostCapabilityView, HostRisk} from '../../src/visual-runtime/host/port.ts';

const sha = 'a'.repeat(64);
const now = 1700000000000;
const planId = 'ctl-0123456789abcdef';
const identities = {ownerRef:'owner-A',actorRef:'actor-A',worldRef:'world-A',deviceRef:'pc-A',sessionRef:'session-A'};
function scope(override: Partial<HostReadScope> = {}): HostReadScope {
  const base: HostReadScope = {
    schema:'vivim.host-authorized-read-scope/1',authenticated:true,...identities,
    surface:'desktop',purpose:'founder_workspace',nowMs:now,sessionExpiresAtMs:now+600000,
    worldRevision:'world-3',policyRevision:'policy-7',catalogVersion:6,catalogDigest:sha,
    grant:{...identities,purpose:'founder_workspace',grantRef:'grant-A',revision:'grant-2',
      status:'active',expiresAtMs:now+300000,scopes:['control:read','control:execute']},
  };
  return {...base,...override};
}
function cap(risk: HostRisk = 'R0', o: Partial<HostCapabilityView> = {}): HostCapabilityView {
  return {schema:'vivim.host-capability/1',actionId:'vivim.status.show',catalogVersion:6,catalogDigest:sha,
    risk,requiredScopes:['control:read'],prerequisites:[],supportedByBuild:'yes',availableNow:'yes',
    permittedForActor:'yes',verifiedByEvidence:'yes',reasonCodes:[],
    source:{authority:'host-catalog-fixture',proof:'fixture_only',observedAtMs:now},...o};
}
function receipt(o: Partial<NonNullable<HostPlanRead['receipt']>> = {}): NonNullable<HostPlanRead['receipt']> {
  return {schema:'vivim.control-receipt/1',planId,planDigest:sha,actionId:'vivim.status.show',
    status:'applied',evidence:'unsigned_general_journal',receiptRef:'r1',
    ...identities,purpose:'founder_workspace',worldRevision:'world-3',policyRevision:'policy-7',...o};
}
function plan(o: Partial<HostPlanRead> = {}): HostPlanRead {
  return {schema:'vivim.wave4-host-plan-read/1',planId,planDigest:sha,actionId:'vivim.status.show',
    risk:'R0',...identities,purpose:'founder_workspace',grantRef:'grant-A',grantRevision:'grant-2',
    worldRevision:'world-3',policyRevision:'policy-7',catalogVersion:6,catalogDigest:sha,
    expiresAtMs:now+120000,state:'receipt',claimed:true,receipt:receipt(),...o};
}
function query(o: Partial<HostStatusQuery> = {}): HostStatusQuery {
  return {actionId:'vivim.status.show',purpose:'founder_workspace',
    expected:{worldRevision:'world-3',policyRevision:'policy-7',catalogVersion:6,catalogDigest:sha},...o};
}
function rig({s=scope(),c=cap(),p=plan(),source='synthetic_fixture',verify}:
  {s?:HostReadScope|null,c?:HostCapabilityView|null,p?:HostPlanRead|null,
   source?:Wave4HostReadPort['evidenceClass'],verify?: Wave4HostReadPort['verifyReceipt']} = {}) {
  const calls={scope:0,cap:0,plan:0,verified:0};
  const port: Wave4HostReadPort = {evidenceClass:source,
    currentScope(){calls.scope++;return s;},
    readCapability(){calls.cap++;return c;},
    readPlan(){calls.plan++;return p;},
    verifyReceipt(scope,plan,r){calls.verified++;return verify?.(scope,plan,r) ?? false;},
  };
  return {contract:createWave4HostStatusContract(port),calls};
}
const safe = (v: Wave4HostStatus) => {
  assert.equal(v.effectInvoked,false); assert.equal(v.canExecute,false);
  assert.equal(v.automaticRetryAllowed,false);assert.equal(v.recovery.automaticRetryAllowed,false);
  assert.equal(v.recovery.retryPolicy,'owner_reconcile_only');
  const text=JSON.stringify(v);
  for(const secret of ['owner-A','actor-A','world-A','pc-A','session-A','grant-A','r1',planId])
    assert.equal(text.includes(secret),false,`leaked ${secret}`);
  assert.equal(v.accessibility.initialFocus,'recovery-heading');
};

test('R0 desktop capability permitted, still inert and scoped',()=>{
  const {contract,calls}=rig();const v=contract.readStatus(query());
  assert.equal(v.state,'permitted'); assert.equal(v.permission,'yes'); assert.equal(v.availability,'yes');
  assert.equal(calls.plan,0);safe(v);
});
test('R0 phone read parity without mobile effect permission',()=>{
  const s=scope({surface:'phone',deviceRef:'phone-A',sessionRef:'phone-session-A',
    grant:{...scope().grant!,deviceRef:'phone-A',sessionRef:'phone-session-A'}});
  const v=rig({s}).contract.readStatus(query());assert.equal(v.state,'permitted');safe(v);
});
test('available is distinct from actor permission being unconfirmed',()=>{
  const v=rig({c:cap('R0',{permittedForActor:'unknown'})}).contract.readStatus(query());
  assert.equal(v.state,'available'); assert.equal(v.permission,'unknown');safe(v);
});
test('planned R1 requires owner approval and cannot become an approval',()=>{
  const v=rig({c:cap('R1'),p:plan({risk:'R1',state:'planned',claimed:false,receipt:null})}).contract.readStatus(query({planId}));
  assert.equal(v.state,'pending_approval');assert.equal(v.approval,'pending');safe(v);
});
test('approved-but-unclaimed is not an applied effect',()=>{
  const v=rig({p:plan({state:'approved',claimed:false,receipt:null})}).contract.readStatus(query({planId}));
  assert.equal(v.state,'permitted');assert.equal(v.receiptState,'none');safe(v);
});
test('applied general journal remains UNSIGNED, not verified',()=>{
  const v=rig({source:'authenticated_host',verify:()=>true}).contract.readStatus(query({planId}));
  assert.equal(v.state,'applied');assert.equal(v.receiptVerification,'unsigned');
  assert.equal(v.receiptState,'reported_applied');safe(v);
});
test('a signed Host envelope requires a trusted Host-owned verification callback',()=>{
  const p=plan({receipt:receipt({evidence:'signed_host_envelope',signatureEnvelope:{keyId:'test-key',signatureBase64:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef'}})});
  const {contract,calls}=rig({p,source:'authenticated_host',verify:()=>true});
  const v=contract.readStatus(query({planId}));assert.equal(v.state,'verified');
  assert.equal(v.receiptVerification,'host_verified');assert.equal(calls.verified,1);safe(v);
});
test('a fixture cannot claim real Host verification even if its verifier says true',()=>{
  const p=plan({receipt:receipt({evidence:'signed_host_envelope',signatureEnvelope:{keyId:'test-key',signatureBase64:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef'}})});
  const {contract,calls}=rig({p,verify:()=>true});
  const v=contract.readStatus(query({planId}));assert.equal(v.state,'applied');
  assert.equal(calls.verified,0);assert.equal(v.source.liveHostAcceptance,'unproven');safe(v);
});
test('untrusted signing fields cannot override Host verification',()=>{
  for(const field of ['signatureState','verified','signed']){
    const r={...receipt(),[field]:'verified'} as unknown as NonNullable<HostPlanRead['receipt']>;
    const v=rig({p:plan({receipt:r}),source:'authenticated_host',verify:()=>true}).contract.readStatus(query({planId}));
    assert.equal(v.state,'denied');assert.equal(v.reasonCode,'RECEIPT_CONTEXT_OR_PROVENANCE_INVALID');safe(v);
  }
});
test('cross-device plan and actor mismatch is denied before exposing status',()=>{
  const mismatches=[{deviceRef:'phone-1'},{actorRef:'other'},{ownerRef:'other'},
    {worldRef:'other'},{sessionRef:'other'},{purpose:'owner_audit' as const}];
  for(const m of mismatches){const v=rig({p:plan(m)}).contract.readStatus(query({planId}));
    assert.equal(v.state,'denied');assert.equal(v.reasonCode,'PLAN_NOT_ACCESSIBLE');safe(v);}
});
test('revoked or expired grants deny before status reads and do not reveal plan existence',()=>{
  for(const g of [ {...scope().grant!,status:'revoked' as const},
    {...scope().grant!,expiresAtMs:now-1}, {...scope().grant!,status:'pending' as const} ]){
    const {contract,calls}=rig({s:scope({grant:g})});const v=contract.readStatus(query({planId}));
    assert.equal(v.state,'denied');assert.equal(calls.cap,0);assert.equal(calls.plan,0);safe(v);
  }
});
test('phone cannot elevate R2 even when capability claims permission',()=>{
  const s=scope({surface:'phone'});const {contract,calls}=rig({s,c:cap('R2')});
  const v=contract.readStatus(query({planId}));assert.equal(v.reasonCode,'R2_DESKTOP_REQUIRED');
  assert.equal(calls.plan,0);safe(v);
});
test('R3 refused on both desktop and phone regardless of catalog readiness',()=>{
  for(const surface of ['phone','desktop'] as const){const v=rig({s:scope({surface}),c:cap('R3')}).contract.readStatus(query({planId}));
    assert.equal(v.reasonCode,'R3_REFUSED');safe(v);}
});
test('lost ACK and exclusive claim without receipt require read-only reconcile',()=>{
  for(const p of [plan({state:'claimed',claimed:true,receipt:null}),plan({state:'receipt',claimed:true,receipt:null})]){
    const v=rig({p}).contract.readStatus(query({planId}));assert.equal(v.state,'uncertain');
    assert.equal(v.reasonCode,'CLAIM_WITHOUT_RECEIPT');safe(v);
  }
});
test('duplicate status reads never retry or create a second effect',()=>{
  const {contract,calls}=rig({p:plan({state:'claimed',receipt:null})});
  const a=contract.readStatus(query({planId})),b=contract.readStatus(query({planId}));
  assert.deepEqual(a,b);assert.equal(calls.plan,2);safe(a);safe(b);
});
test('stale policy/world/catalog pins fail closed before capabilities or plans',()=>{
  for(const expected of [{policyRevision:'wrong'},{worldRevision:'wrong'},
    {catalogVersion:7},{catalogDigest:'b'.repeat(64)}]){
    const {contract,calls}=rig();const v=contract.readStatus(query({expected:{...query().expected,...expected}}));
    assert.equal(v.state,'uncertain');assert.equal(v.reasonCode,'SOURCE_VERSION_CHANGED');
    assert.equal(calls.cap,0);safe(v);
  }
});
test('wrong purpose, scope, actor, session or anonymous status fails before capability read',()=>{
  for(const s of [scope({purpose:'owner_audit'}),scope({authenticated:false}),scope({nowMs:now+700000}),
    scope({grant:{...scope().grant!,actorRef:'bad'}}),scope({grant:{...scope().grant!,purpose:'recovery'}}),
    scope({grant:{...scope().grant!,scopes:['control:execute']}})]){
    const {contract,calls}=rig({s});const v=contract.readStatus(query({planId}));
    assert.equal(v.state,'denied');assert.equal(calls.cap,0);safe(v);
  }
});
test('forged receipt actor/digest/policy/plan ID and expired plan fail closed',()=>{
  for(const r of [receipt({actorRef:'other'}),receipt({planDigest:'b'.repeat(64)}),
    receipt({policyRevision:'stale'}),receipt({planId:'ctl-0000000000000000'})]){
    const v=rig({p:plan({receipt:r})}).contract.readStatus(query({planId}));
    assert.equal(v.state,'denied');assert.equal(v.receiptState,'none');safe(v);
  }
  const v=rig({p:plan({expiresAtMs:now-1})}).contract.readStatus(query({planId}));
  assert.equal(v.reasonCode,'PLAN_EXPIRED');safe(v);
});
test('Host verifier denial or failure never promotes a claimed signature to verified',()=>{
  const p=plan({receipt:receipt({evidence:'signed_host_envelope',signatureEnvelope:{keyId:'test-key',signatureBase64:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef'}})});
  for(const verify of [()=>false,()=>{throw new Error('verifier failure');}]){
    const v=rig({source:'authenticated_host',p,verify}).contract.readStatus(query({planId}));
    assert.equal(v.state,'applied');assert.equal(v.receiptVerification,'unverified');safe(v);
  }
});
test('reported failed and uncertain receipts are not promoted to applied',()=>{
  for(const [status,expected] of [['failed','denied'],['uncertain','uncertain']] as const){
    const v=rig({p:plan({receipt:receipt({status})}),source:'authenticated_host',verify:()=>true})
      .contract.readStatus(query({planId}));
    assert.equal(v.state,expected);safe(v);
  }
});
test('missing or unreadable Host plan never creates execution permission',()=>{
  const absent=rig({p:null}).contract.readStatus(query({planId}));
  assert.equal(absent.reasonCode,'PLAN_NOT_ACCESSIBLE');safe(absent);
  const failure=createWave4HostStatusContract({evidenceClass:'synthetic_fixture',currentScope:()=>scope(),
    readCapability:()=>cap(),readPlan:()=>{throw new Error('Host offline');}}).readStatus(query({planId}));
  assert.equal(failure.state,'uncertain');safe(failure);
});
test('reject authority injection, arbitrary query keys, invalid plan ID and getter traps',()=>{
  const queries=[{...query(),grant:'admin'},query({planId:'../../etc/passwd'}),
    {...query(),expected:{...query().expected,policyRevision:'bad\nvalue'}},
    Object.defineProperty({...query()},'actionId',{get(){throw Error('getter');},enumerable:true})];
  for(const q of queries){const v=rig().contract.readStatus(q as HostStatusQuery);
    assert.equal(v.state,'denied');safe(v);}
});
test('scope-catalog disagreement, unavailable build and missing required scope never permit',()=>{
  for(const c of [cap('R0',{catalogVersion:5}),cap('R0',{supportedByBuild:'no'}),
    cap('R0',{requiredScopes:['control:admin']}),cap('R0',{availableNow:'unknown'})]){
    const v=rig({c}).contract.readStatus(query());
    assert.notEqual(v.state,'permitted');assert.notEqual(v.state,'verified');safe(v);
  }
});
