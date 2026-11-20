# File: packages/tierflow/tests/visual-runtime/wave3-h-host.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-h-host.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 13048 B |
| Lines | 224 |
| Hash | 39e8fa9e2e8e |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digest | const | 11 | no | const digest = &#39;a&#39;.repeat(64); |
| actions | const | 12 | no | const actions: HostActionDescriptor[] = [ |
| gateway | function | 24 | no | const gateway = () =&gt; createWave3ReadGatewayFixture({actions,catalogVersion:6,catalogDigest:digest, testReceiptVerifier:{keyId:&#39;fixture-key&#39;,secret:&#39;TEST_ONLY_not_a_real_Host_signature&#39;}}); |
| context | function | 26 | no | function context(overrides: Partial&lt;TrustedFixtureHostContext&gt; = {}): TrustedFixtureHostContext { |
| base | const | 27 | no | const base: TrustedFixtureHostContext = { |
| claim | function | 39 | no | function claim(overrides: Partial&lt;HostClaimSnapshot&gt; = {}): HostClaimSnapshot { |
| receipt | function | 44 | no | function receipt(overrides: Partial&lt;HostGeneralJournalReceipt&gt; = {}): HostGeneralJournalReceipt { |
| unsigned | function | 48 | no | function unsigned(r = receipt()): HostReceiptObservation { |
| syntheticSigned | function | 51 | no | function syntheticSigned(r = receipt()): HostReceiptObservation { |
| neverEffects | function | 56 | no | function neverEffects(v: ReturnType&lt;ReturnType&lt;typeof gateway&gt;[&#39;readCapability&#39;]&gt;) { |
| g | const | 69 | no | const g=gateway(), v=g.readCapability(context(),&#39;vivim.status.show&#39;); |
| g | const | 80 | no | const g=gateway(), base=context(), grant=base.grant!; |
| cases | const | 81 | no | const cases = [ |
| g | const | 95 | no | const g=gateway(); |
| forged | const | 96 | no | const forged=context({authenticated:false,ownerRef:&#39;other-owner&#39;}); |
| v | const | 97 | no | const v=g.readCapability(forged,&#39;privacy.hard_no.add&#39;); |
| c | const | 106 | no | const c=context(), g=gateway(); |
| v | const | 107 | no | const v=g.readCapability(context({grant:{...c.grant!,scopes:[&#39;control:execute&#39;]}}),&#39;ui.theme.set_preset&#39;); |
| g | const | 114 | no | const g=gateway(); |
| phone | const | 115 | no | const phone=g.readCapability(context({surface:&#39;phone&#39;}),&#39;privacy.hard_no.add&#39;); |
| r3 | const | 117 | no | const r3=g.readCapability(context(),&#39;machine.network.disable_all&#39;); |
| g | const | 123 | no | const g=gateway(); |
| missing | const | 127 | no | const missing=g.readCapability(context({availabilityByAction:{}}),&#39;vivim.status.show&#39;); |
| unavailable | const | 129 | no | const unavailable=g.readCapability(context({availabilityByAction:{&#39;vivim.status.show&#39;:&#39;no&#39;}}),&#39;vivim.status.show&#39;); |
| insufficient | const | 131 | no | const insufficient=g.readCapability(context(),&#39;devices.summary&#39;); |
| v | const | 136 | no | const v=gateway().readReceiptStatus(context(),claim(),null); |
| v | const | 142 | no | const v=gateway().readReceiptStatus(context(),claim({state:&#39;approved&#39;}),unsigned()); |
| v | const | 149 | no | const v=gateway().readReceiptStatus(context(),claim(),unsigned(receipt({status}))); |
| v | const | 157 | no | const v=gateway().readReceiptStatus(context(),claim(),syntheticSigned()); |
| bad | const | 167 | no | const bad=syntheticSigned(); |
| forged | const | 168 | no | const forged={...bad,evidence:{...bad.evidence,macHex:&#39;0&#39;.repeat(64)}} as HostReceiptObservation; |
| g | const | 169 | no | const g=gateway(); |
| v | const | 170 | no | const v=g.readReceiptStatus(context(),claim(),forged); |
| injected | const | 173 | no | const injected={...unsigned(),signatureState:&#39;verified&#39;} as unknown as HostReceiptObservation; |
| x | const | 174 | no | const x=g.readReceiptStatus(context(),claim(),injected); |
| g | const | 180 | no | const g=gateway(), c=context(), p=claim(); |
| unknown | const | 181 | no | const unknown=g.readReceiptStatus(c,p,{receipt:receipt(),evidence:{kind:&#39;unknown&#39;}}); |
| wrong | const | 183 | no | const wrong=g.readReceiptStatus(c,p,unsigned(receipt({planDigest:&#39;b&#39;.repeat(64)}))); |
| withoutVerifier | const | 185 | no | const withoutVerifier=createWave3ReadGatewayFixture({actions,catalogVersion:6,catalogDigest:digest}); |
| unverifiable | const | 186 | no | const unverifiable=withoutVerifier.readReceiptStatus(c,p,syntheticSigned()); |
| g | const | 191 | no | const g=gateway(), c=context(); |
| v | const | 194 | no | const v=g.readReceiptStatus(c,p,syntheticSigned()); |
| revoked | const | 198 | no | const revoked=g.readReceiptStatus(context({grant:{...c.grant!,status:&#39;revoked&#39;}}),claim(),syntheticSigned()); |
| g | const | 203 | no | const g=gateway(); |
| stale | const | 204 | no | const stale=g.readReceiptStatus(context(),claim({worldRevision:&#39;world-old&#39;}),syntheticSigned()); |
| r2 | const | 206 | no | const r2=g.readReceiptStatus(context({surface:&#39;phone&#39;}),claim({actionId:&#39;privacy.hard_no.add&#39;}),null); |
| r3 | const | 208 | no | const r3=g.readReceiptStatus(context(),claim({actionId:&#39;machine.network.disable_all&#39;}),null); |
| g | const | 213 | no | const g=gateway(); |
| v | const | 220 | no | const v=g.refuseUiEffect(input); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert | import | 2 | external |
| node:crypto | import | 3 | external |
| ../../src/visual-runtime/host/wave3-read-gateway-fixture.ts | import | 4 | [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](../../src/visual-runtime/host/wave3-read-gateway-fixture.ts.md) |
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
```

_First 80 of 225 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
