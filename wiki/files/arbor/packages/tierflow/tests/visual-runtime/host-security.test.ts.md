# File: packages/tierflow/tests/visual-runtime/host-security.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/host-security.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12443 B |
| Lines | 206 |
| Hash | 7987343be663 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digest | const | 9 | no | const digest=&#39;f&#39;.repeat(64), keyId=&#39;synthetic-test-key&#39;, secret=&#39;synthetic-only-secret-2026&#39;; |
| actions | const | 10 | no | const actions: HostActionDescriptor[] = [{actionId:&#39;ui.theme.set_preset&#39;,catalogVersion:6,risk:&#39;R1&#39;, |
| c | function | 13 | no | function c(overrides:Partial&lt;TrustedFixtureHostContext&gt;={}): TrustedFixtureHostContext { |
| base | const | 14 | no | const base:TrustedFixtureHostContext={schema:&#39;fixture.trusted-host-context/1&#39;,authenticated:true, |
| command | const | 24 | no | const command:InertHostCommand={schema:&#39;vivim.visual-command/1&#39;,commandId:&#39;safe-cmd&#39;, |
| port | function | 27 | no | function port(withVerifier=true){return createHostCapabilityFixture({catalogVersion:6,catalogDigest:digest,actions, ...(withVerifier?{testReceiptVerifier:{keyId,secret}}:{})});} |
| plan | function | 29 | no | function plan(){const r=port().prepare(command,c());assert.equal(r.kind,&#39;prepared_inert&#39;); |
| approval | function | 31 | no | function approval(p:InertHostPlan){return {channel:&#39;desktop-owner-token&#39; as const,ownerConfirmed:true,planDigest:p.planDigest};} |
| claim | function | 32 | no | function claim(p:InertHostPlan):HostClaimSnapshot{return {planId:p.planId,planDigest:p.planDigest,actionId:p.actionId, |
| receipt | function | 35 | no | function receipt(p:InertHostPlan):HostGeneralJournalReceipt{return {schema:&#39;vivim.control-receipt/1&#39;, |
| signed | function | 38 | no | function signed(r:HostGeneralJournalReceipt):HostReceiptObservation{return {receipt:r, |
| denial | function | 40 | no | const denial=(p:ReturnType&lt;typeof port&gt;,ctx:TrustedFixtureHostContext)=&gt;{ |
| result | const | 41 | no | const result=p.prepare(command,ctx);assert.equal(result.kind,&#39;denied&#39;,JSON.stringify(result)); |
| p | const | 46 | no | const p=port(); |
| ctx | const | 48 | no | const ctx=c({[field]:`${field}-other`}); |
| p | const | 56 | no | const p=port(),g=c().grant!; |
| p | const | 65 | no | const p=port(),x=plan(),g=c().grant!; |
| r | const | 68 | no | const r=p.evaluateApprovalInert(x,approval(x),next); |
| p | const | 74 | no | const p=port(),x=plan(); |
| r | const | 78 | no | const r=p.evaluateApprovalInert(x,approval(x),ctx); |
| p | const | 84 | no | const p=port(),x=plan(); |
| p | const | 93 | no | const p=port(),x=plan(); |
| out | const | 94 | no | const out=p.reconcileClaimReadOnly(claim(x),null,c()); |
| p | const | 101 | no | const p=port(),x=plan(); |
| out | const | 103 | no | const out=p.reconcileClaimReadOnly({...claim(x),state},signed(receipt(x)),c()); |
| p | const | 109 | no | const p=port(),x=plan(); |
| out | const | 110 | no | const out=p.reconcileClaimReadOnly(claim(x),{receipt:receipt(x),evidence:{kind:&#39;unsigned-general-journal&#39;}},c()); |
| p | const | 116 | no | const p=port(),x=plan(); |
| out | const | 117 | no | const out=p.reconcileClaimReadOnly(claim(x),signed(receipt(x)),c()); |
| p | const | 124 | no | const p=port(),x=plan(),r=receipt(x),signedProof=signed(r); |
| bad | const | 125 | no | const bad=p.reconcileClaimReadOnly(claim(x),{receipt:r,evidence:{kind:&#39;test-hmac&#39;,keyId,macHex:&#39;0&#39;.repeat(64)}},c()); |
| spoof | const | 127 | no | const spoof=p.reconcileClaimReadOnly(claim(x),{...signedProof,signatureState:&#39;verified&#39;} as HostReceiptObservation,c()); |
| spoof2 | const | 129 | no | const spoof2=p.reconcileClaimReadOnly(claim(x),{receipt:{...r,signatureState:&#39;verified&#39;},evidence:{kind:&#39;unsigned-general-journal&#39;}} as HostReceiptObservation,c()); |
| x | const | 134 | no | const x=plan(),r=receipt(x); |
| unknown | const | 135 | no | const unknown=port(false).reconcileClaimReadOnly(claim(x),signed(r),c()); |
| unproven | const | 138 | no | const unproven=port().reconcileClaimReadOnly(claim(x),{receipt:r,evidence:{kind:&#39;unknown&#39;}},c()); |
| p | const | 143 | no | const p=port(),x=plan(); |
| alien | const | 144 | no | const alien=p.reconcileClaimReadOnly({...claim(x),ownerRef:&#39;ow-B&#39;},signed(receipt(x)),c()); |
| out | const | 149 | no | const out=p.reconcileClaimReadOnly(claim(x),signed(r),c()); |
| p | const | 155 | no | const p=port(),x=plan(); |
| out | const | 156 | no | const out=p.reconcileClaimReadOnly(claim(x),{receipt:receipt(x),evidence:{kind:&#39;unsigned-general-journal&#39;},replayed:true},c()); |
| p | const | 162 | no | const p=port(),x=plan(); |
| out | const | 164 | no | const out=p.reconcileClaimReadOnly(claim(x),{receipt:{...receipt(x),status},evidence:{kind:&#39;unsigned-general-journal&#39;}},c()); |
| p | const | 171 | no | const p=port(),x=plan(),g=c().grant!; |
| out | const | 174 | no | const out=p.reconcileClaimReadOnly(claim(x),signed(receipt(x)),ctx); |
| p | const | 180 | no | const p=port(),x=plan(); |
| out | const | 181 | no | const out=p.reconcileClaimReadOnly(claim(x),signed(receipt(x)),c({worldRevision:&#39;new-world-revision&#39;})); |
| p | const | 187 | no | const p=port(),x=plan(); |
| fields | const | 188 | no | const fields: (keyof InertHostPlan)[]=[&#39;planId&#39;,&#39;commandId&#39;,&#39;actionId&#39;,&#39;ownerRef&#39;,&#39;actorRef&#39;,&#39;deviceRef&#39;, |
| changed | const | 191 | no | const changed={...x,[field]:String(x[field])+&#39;-tampered&#39;}; |
| out | const | 192 | no | const out=p.evaluateApprovalInert(changed,approval(changed),c()); |
| p | const | 200 | no | const p=port(),x=plan(); |
| corrupted | const | 201 | no | const corrupted=p.reconcileClaimReadOnly({...claim(x),state:&#39;not-claimed&#39; as &#39;claimed&#39;},signed(receipt(x)),c()); |
| failed | const | 203 | no | const failed=p.reconcileClaimReadOnly(claim(x),{receipt:{...receipt(x),status:&#39;failed&#39;}, evidence:{kind:&#39;unsigned-general-journal&#39;},replayed:true},c()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert | import | 2 | external |
| node:crypto | import | 3 | external |
| ../../src/visual-runtime/host/fixture.ts | import | 4 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../../src/visual-runtime/host/fixture.ts.md) |
| ../../src/visual-runtime/host/outcome.ts | import | 5 | [packages/tierflow/src/visual-runtime/host/outcome.ts](../../src/visual-runtime/host/outcome.ts.md) |
| ../../src/visual-runtime/host/port.ts | import | 6 | [packages/tierflow/src/visual-runtime/host/port.ts](../../src/visual-runtime/host/port.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 207 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
