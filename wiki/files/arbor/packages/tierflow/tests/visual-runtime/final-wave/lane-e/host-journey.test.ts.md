# File: packages/tierflow/tests/visual-runtime/final-wave/lane-e/host-journey.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-e/host-journey.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 8934 B |
| Lines | 55 |
| Hash | e16a0810d2d8 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| base | const | 6 | no | const base = { |
| status | function | 13 | no | const status = (o:Record&lt;string,unknown&gt;={}) =&gt; ({...base,...o}) as unknown as Wave4HostStatus; |
| project | function | 14 | no | const project = (o:Record&lt;string,unknown&gt;={},surface:&#39;desktop&#39;\|&#39;phone&#39;=&#39;desktop&#39;,route:&#39;host-control&#39;\|&#39;legacy-phone-build&#39;=&#39;host-control&#39;) =&gt; projectLaneEHostJourney(status(o),surface,route); |
| invariant | function | 15 | no | const invariant = (v:ReturnType&lt;typeof project&gt;) =&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert | import | 2 | external |
| ../../../../src/visual-runtime/final-wave/lane-e/host-journey.ts | import | 3 | [packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts](../../../../src/visual-runtime/final-wave/lane-e/host-journey.ts.md) |
| ../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts | import | 4 | [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {projectLaneEHostJourney,createLaneEHostReadProjection} from '../../../../src/visual-runtime/final-wave/lane-e/host-journey.ts';
import type {Wave4HostStatus} from '../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts';

const base = {
  schema:'vivim.wave4-host-status/1',state:'permitted',reasonCode:'HOST_PERMITTED_READ_ONLY',
  actionId:'vivim.status.show',risk:'R0',availability:'yes',permission:'yes',approval:'none',
  receiptState:'none',receiptVerification:'not_present',effectInvoked:false,canExecute:false,
  automaticRetryAllowed:false,
  source:{authority:'host-read-port',evidenceClass:'synthetic_fixture',liveHostAcceptance:'unproven'},
};
const status = (o:Record<string,unknown>={}) => ({...base,...o}) as unknown as Wave4HostStatus;
const project = (o:Record<string,unknown>={},surface:'desktop'|'phone'='desktop',route:'host-control'|'legacy-phone-build'='host-control') => projectLaneEHostJourney(status(o),surface,route);
const invariant = (v:ReturnType<typeof project>) => {
  assert.equal(v.effectInvoked,false);assert.equal(v.canApprove,false);assert.equal(v.canExecute,false);
  assert.equal(v.canPublish,false);assert.equal(v.canRetry,false);assert.equal(v.liveHostAcceptance,'unproven');
  for(const secret of ['owner-private','grant-private','ctl-0123456789abcdef','receipt-private','raw-token'])
    assert.equal(JSON.stringify(v).includes(secret),false);
};

test('E01 permitted read is not executable',()=>{const v=project();assert.equal(v.phase,'permitted_read_only');invariant(v);});
test('E02 available differs from permission',()=>{const v=project({state:'available',reasonCode:'PERMISSION_UNCONFIRMED'});assert.equal(v.phase,'available');invariant(v);});
test('E03 planned is approval pending',()=>{const v=project({state:'pending_approval',reasonCode:'OWNER_APPROVAL_PENDING',approval:'pending'});assert.equal(v.phase,'awaiting_owner');invariant(v);});
test('E04 approved but not claimed is not applied',()=>{const v=project({approval:'approved'});assert.equal(v.phase,'approved_not_claimed');assert.equal(v.receiptTruth,'none');invariant(v);});
test('E05 claim without receipt is uncertain, no resend',()=>{const v=project({state:'uncertain',reasonCode:'CLAIM_WITHOUT_RECEIPT',receiptState:'claimed_unconfirmed'});assert.equal(v.phase,'claimed_unconfirmed');assert.equal(v.receiptTruth,'claim_only');assert.equal(v.next,'owner_reconcile');invariant(v);});
test('E06 uncertain receipt is never verified',()=>{const v=project({state:'uncertain',reasonCode:'HOST_RECEIPT_UNCERTAIN',receiptState:'uncertain',receiptVerification:'unverified'});assert.equal(v.phase,'uncertain');invariant(v);});
test('E07 unsigned applied remains reported, never verified',()=>{const v=project({state:'applied',reasonCode:'HOST_REPORTED_APPLIED_UNVERIFIED',receiptState:'reported_applied',receiptVerification:'unsigned'});assert.equal(v.phase,'reported_applied');assert.equal(v.receiptTruth,'unsigned');invariant(v);});
test('E08 a signed field without verified Host scope cannot attest',()=>{const v=project({state:'verified',reasonCode:'HOST_SIGNATURE_VERIFIED',receiptState:'verified_by_host',receiptVerification:'host_verified'});assert.equal(v.phase,'uncertain');assert.equal(v.receiptTruth,'unverified');invariant(v);});
test('E09 Host attested signed report stays unproven for native release',()=>{const v=project({state:'verified',reasonCode:'HOST_SIGNATURE_VERIFIED',receiptState:'verified_by_host',receiptVerification:'host_verified',source:{...base.source,evidenceClass:'authenticated_host'}});assert.equal(v.phase,'host_attested');assert.equal(v.receiptTruth,'host_attested');assert.equal(v.liveHostAcceptance,'unproven');invariant(v);});
test('E10 forged receipt verification on claimed state is not verification',()=>{const v=project({state:'uncertain',reasonCode:'CLAIM_WITHOUT_RECEIPT',receiptState:'claimed_unconfirmed',receiptVerification:'host_verified'});assert.notEqual(v.phase,'host_attested');invariant(v);});
test('E11 receipt failed is distinct from denied approval',()=>{const v=project({state:'denied',reasonCode:'HOST_REPORTED_FAILED',receiptState:'reported_failed'});assert.equal(v.phase,'reported_failed');invariant(v);});
test('E12 explicit denial is inert',()=>{const v=project({state:'denied',reasonCode:'GRANT_REVOKED'});assert.equal(v.phase,'denied');invariant(v);});
test('E13 phone R2 is refused even if bad port says permitted',()=>{const v=project({risk:'R2'},'phone');assert.equal(v.phase,'denied');assert.equal(v.reasonCode,'R2_DESKTOP_REQUIRED');invariant(v);});
test('E14 desktop R2 remains read-only',()=>{const v=project({risk:'R2'},'desktop');assert.equal(v.phase,'permitted_read_only');invariant(v);});
test('E15 R3 desktop is refused',()=>{const v=project({risk:'R3'},'desktop');assert.equal(v.phase,'denied');invariant(v);});
test('E16 R3 phone is refused',()=>{const v=project({risk:'R3'},'phone');assert.equal(v.phase,'denied');invariant(v);});
test('E17 legacy phone Build ACK is not an attested Host effect',()=>{const v=project({},'phone','legacy-phone-build');assert.equal(v.phase,'uncertain');assert.equal(v.reasonCode,'LEGACY_PHONE_ROUTE_UNFENCED');assert.equal(v.routeGate,'legacy_unfenced');invariant(v);});
test('E18 legacy route cannot launder signed Host status',()=>{const v=project({state:'verified',reasonCode:'HOST_SIGNATURE_VERIFIED',receiptState:'verified_by_host',receiptVerification:'host_verified',source:{...base.source,evidenceClass:'authenticated_host'}},'phone','legacy-phone-build');assert.equal(v.phase,'uncertain');assert.equal(v.receiptTruth,'none');invariant(v);});
test('E19 legacy route honors R2 denial ahead of uncertain fallback',()=>{const v=project({risk:'R2'},'phone','legacy-phone-build');assert.equal(v.reasonCode,'R2_DESKTOP_REQUIRED');invariant(v);});
test('E20 unknown schema is denied',()=>{const v=project({schema:'attacker/1'});assert.equal(v.phase,'denied');invariant(v);});
test('E21 no source attestation is denied',()=>{const v=project({source:{authority:'phone',evidenceClass:'authenticated_host'}});assert.equal(v.phase,'denied');invariant(v);});
test('E22 fake canExecute=true is denied',()=>{const v=project({canExecute:true});assert.equal(v.phase,'denied');invariant(v);});
test('E23 fake automatic retry is denied',()=>{const v=project({automaticRetryAllowed:true});assert.equal(v.phase,'denied');invariant(v);});
test('E24 untrusted raw reason is not echoed',()=>{const v=project({reasonCode:'owner-private raw-token'});assert.equal(v.reasonCode,'UNTRUSTED_STATUS_PROJECTION');invariant(v);});
test('E25 private plan/grant fields never copied to display',()=>{const v=project({planId:'ctl-0123456789abcdef',grantRef:'grant-private',ownerRef:'owner-private',receiptRef:'receipt-private',args:{token:'raw-token'}});invariant(v);});
test('E26 absence of read-only port throws',()=>{assert.throws(()=>createLaneEHostReadProjection(null as never),/WAVE4_HOST_READ_REQUIRED/);});
test('E27 adapter reads one status and never exposes execute',()=>{let calls=0;const port={readStatus(){calls++;return status();},execute(){throw Error('must not execute')}};const adapter=createLaneEHostReadProjection(port);const v=adapter.read({} as never,'desktop');assert.equal(calls,1);assert.equal('execute' in adapter,false);invariant(v);});
test('E28 read port exceptions fail closed',()=>{const adapter=createLaneEHostReadProjection({readStatus(){throw new Error('raw-token')}});const v=adapter.read({} as never,'desktop');assert.equal(v.phase,'denied');assert.equal(JSON.stringify(v).includes('raw-token'),false);invariant(v);});
test('E29 forged host_verified on applied is not attested',()=>{const v=project({state:'applied',receiptState:'reported_applied',receiptVerification:'host_verified',source:{...base.source,evidenceClass:'authenticated_host'}});assert.equal(v.phase,'reported_applied');assert.notEqual(v.receiptTruth,'host_attested');invariant(v);});
test('E30 invalid route rejects display',()=>{const v=projectLaneEHostJourney(status(),'desktop','admin' as never);assert.equal(v.phase,'denied');invariant(v);});
test('E31 invalid surface rejects display',()=>{const v=projectLaneEHostJourney(status(),'privileged' as never);assert.equal(v.phase,'denied');invariant(v);});
test('E32 cross-session missing auth yields denial from Wave 4',()=>{const v=project({state:'denied',reasonCode:'SESSION_EXPIRED'});assert.equal(v.phase,'denied');invariant(v);});
test('E33 stale catalog/policy yields uncertain, not approval',()=>{const v=project({state:'uncertain',reasonCode:'SOURCE_VERSION_CHANGED'});assert.equal(v.phase,'uncertain');invariant(v);});
test('E34 malformed plan denied without revealing plan existence',()=>{const v=project({state:'denied',reasonCode:'PLAN_NOT_ACCESSIBLE',planId:'ctl-0123456789abcdef'});assert.equal(v.phase,'denied');invariant(v);});
```

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
