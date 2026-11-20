# File: packages/tierflow/tests/visual-runtime/wave4-h-host-status.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave4-h-host-status.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 13280 B |
| Lines | 202 |
| Hash | f27d821715fc |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | const | 7 | no | const sha = &#39;a&#39;.repeat(64); |
| now | const | 8 | no | const now = 1700000000000; |
| planId | const | 9 | no | const planId = &#39;ctl-0123456789abcdef&#39;; |
| identities | const | 10 | no | const identities = {ownerRef:&#39;owner-A&#39;,actorRef:&#39;actor-A&#39;,worldRef:&#39;world-A&#39;,deviceRef:&#39;pc-A&#39;,sessionRef:&#39;session-A&#39;}; |
| scope | function | 11 | no | function scope(override: Partial&lt;HostReadScope&gt; = {}): HostReadScope { |
| base | const | 12 | no | const base: HostReadScope = { |
| cap | function | 21 | no | function cap(risk: HostRisk = &#39;R0&#39;, o: Partial&lt;HostCapabilityView&gt; = {}): HostCapabilityView { |
| receipt | function | 27 | no | function receipt(o: Partial&lt;NonNullable&lt;HostPlanRead[&#39;receipt&#39;]&gt;&gt; = {}): NonNullable&lt;HostPlanRead[&#39;receipt&#39;]&gt; { |
| plan | function | 32 | no | function plan(o: Partial&lt;HostPlanRead&gt; = {}): HostPlanRead { |
| query | function | 38 | no | function query(o: Partial&lt;HostStatusQuery&gt; = {}): HostStatusQuery { |
| rig | function | 42 | no | function rig({s=scope(),c=cap(),p=plan(),source=&#39;synthetic_fixture&#39;,verify}: {s?:HostReadScope\|null,c?:HostCapabilityView\|null,p?:HostPlanRead\|null, source?:Wave4HostReadPort[&#39;evidenceClass&#39;],verify?… |
| calls | const | 45 | no | const calls={scope:0,cap:0,plan:0,verified:0}; |
| port | const | 46 | no | const port: Wave4HostReadPort = {evidenceClass:source, |
| safe | function | 54 | no | const safe = (v: Wave4HostStatus) =&gt; { |
| text | const | 58 | no | const text=JSON.stringify(v); |
| s | const | 70 | no | const s=scope({surface:&#39;phone&#39;,deviceRef:&#39;phone-A&#39;,sessionRef:&#39;phone-session-A&#39;, grant:{...scope().grant!,deviceRef:&#39;phone-A&#39;,sessionRef:&#39;phone-session-A&#39;}}); |
| v | const | 72 | no | const v=rig({s}).contract.readStatus(query());assert.equal(v.state,&#39;permitted&#39;);safe(v); |
| v | const | 75 | no | const v=rig({c:cap(&#39;R0&#39;,{permittedForActor:&#39;unknown&#39;})}).contract.readStatus(query()); |
| v | const | 79 | no | const v=rig({c:cap(&#39;R1&#39;),p:plan({risk:&#39;R1&#39;,state:&#39;planned&#39;,claimed:false,receipt:null})}).contract.readStatus(query({planId})); |
| v | const | 83 | no | const v=rig({p:plan({state:&#39;approved&#39;,claimed:false,receipt:null})}).contract.readStatus(query({planId})); |
| v | const | 87 | no | const v=rig({source:&#39;authenticated_host&#39;,verify:()=&gt;true}).contract.readStatus(query({planId})); |
| p | const | 92 | no | const p=plan({receipt:receipt({evidence:&#39;signed_host_envelope&#39;,signatureEnvelope:{keyId:&#39;test-key&#39;,signatureBase64:&#39;ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef&#39;}})}); |
| v | const | 94 | no | const v=contract.readStatus(query({planId}));assert.equal(v.state,&#39;verified&#39;); |
| p | const | 98 | no | const p=plan({receipt:receipt({evidence:&#39;signed_host_envelope&#39;,signatureEnvelope:{keyId:&#39;test-key&#39;,signatureBase64:&#39;ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef&#39;}})}); |
| v | const | 100 | no | const v=contract.readStatus(query({planId}));assert.equal(v.state,&#39;applied&#39;); |
| r | const | 105 | no | const r={...receipt(),[field]:&#39;verified&#39;} as unknown as NonNullable&lt;HostPlanRead[&#39;receipt&#39;]&gt;; |
| v | const | 106 | no | const v=rig({p:plan({receipt:r}),source:&#39;authenticated_host&#39;,verify:()=&gt;true}).contract.readStatus(query({planId})); |
| mismatches | const | 111 | no | const mismatches=[{deviceRef:&#39;phone-1&#39;},{actorRef:&#39;other&#39;},{ownerRef:&#39;other&#39;}, |
| s | const | 124 | no | const s=scope({surface:&#39;phone&#39;});const {contract,calls}=rig({s,c:cap(&#39;R2&#39;)}); |
| v | const | 125 | no | const v=contract.readStatus(query({planId}));assert.equal(v.reasonCode,&#39;R2_DESKTOP_REQUIRED&#39;); |
| v | const | 134 | no | const v=rig({p}).contract.readStatus(query({planId}));assert.equal(v.state,&#39;uncertain&#39;); |
| a | const | 140 | no | const a=contract.readStatus(query({planId})),b=contract.readStatus(query({planId})); |
| v | const | 162 | no | const v=rig({p:plan({receipt:r})}).contract.readStatus(query({planId})); |
| v | const | 165 | no | const v=rig({p:plan({expiresAtMs:now-1})}).contract.readStatus(query({planId})); |
| p | const | 169 | no | const p=plan({receipt:receipt({evidence:&#39;signed_host_envelope&#39;,signatureEnvelope:{keyId:&#39;test-key&#39;,signatureBase64:&#39;ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef&#39;}})}); |
| v | const | 171 | no | const v=rig({source:&#39;authenticated_host&#39;,p,verify}).contract.readStatus(query({planId})); |
| v | const | 177 | no | const v=rig({p:plan({receipt:receipt({status})}),source:&#39;authenticated_host&#39;,verify:()=&gt;true}) |
| absent | const | 183 | no | const absent=rig({p:null}).contract.readStatus(query({planId})); |
| failure | const | 185 | no | const failure=createWave4HostStatusContract({evidenceClass:&#39;synthetic_fixture&#39;,currentScope:()=&gt;scope(), readCapability:()=&gt;cap(),readPlan:()=&gt;{throw new Error(&#39;Host offline&#39;);}}).readStatus(query({p… |
| queries | const | 190 | no | const queries=[{...query(),grant:&#39;admin&#39;},query({planId:&#39;../../etc/passwd&#39;}), |
| v | const | 199 | no | const v=rig({c}).contract.readStatus(query()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert | import | 2 | external |
| ../../src/visual-runtime/host/wave4-h-host-status-contract.ts | import | 3 | [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../../src/visual-runtime/host/wave4-h-host-status-contract.ts.md) |
| ../../src/visual-runtime/host/port.ts | import | 5 | [packages/tierflow/src/visual-runtime/host/port.ts](../../src/visual-runtime/host/port.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 203 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
