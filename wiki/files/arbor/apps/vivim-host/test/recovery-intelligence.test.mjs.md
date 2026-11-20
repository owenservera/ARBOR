# File: apps/vivim-host/test/recovery-intelligence.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/recovery-intelligence.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13617 B |
| Lines | 221 |
| Hash | 1855e7998b2c |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 7 | no | const AT=&#39;2026-11-10T05:00:00.000Z&#39;; |
| ctx | const | 8 | no | const ctx={ now:AT, policyVersion:&#39;policy-3&#39;, authorityEpoch:&#39;epoch-27&#39;, worldRevision:&#39;world-rev-10&#39;,environmentKey:&#39;android15-host-v1&#39; }; |
| count | variable | 9 | no | let count=0; |
| finding | function | 10 | no | function finding(code, kind, evidenceKinds=[], other={}) { |
| event | function | 15 | no | function event(type, more={}) {return {id:`event-${++count}`,type,at:AT,...more};} |
| confirmed | function | 16 | no | function confirmed(code,kind,kindEvidence){return finding(code,kind,[kindEvidence]);} |
| auth | function | 17 | no | const auth=(plan)=&gt;event(&#39;authorize&#39;,{planDigest:plan.planDigest,policyVersion:plan.policyVersion,authorityEpoch:plan.authorityEpoch,hostAuthorizationVerified:true}); |
| dispatch | function | 18 | no | const dispatch=(plan)=&gt;event(&#39;dispatch&#39;,{actionId:plan.operations[0].actionId,targetId:plan.target.id,policyVersion:plan.policyVersion,authorityEpoch:plan.authorityEpoch,hostAuthorizationVerified:tru… |
| f | const | 29 | no | const f=confirmed(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,&#39;stale_heartbeat&#39;); |
| d | const | 30 | no | const d=diagnoseRecovery(f); |
| p | const | 32 | no | const p=planRecovery(f,ctx); |
| f | const | 42 | no | const f=confirmed(&#39;WORKER_CYCLE_FAILED&#39;,&#39;worker&#39;,&#39;worker_cycle_error&#39;); |
| p | const | 44 | no | const p=planRecovery(f,ctx); |
| unknown | const | 50 | no | const unknown=planRecovery(finding(&#39;BRAND_NEW_FAILURE&#39;,&#39;worker&#39;,[&#39;stale_heartbeat&#39;]),ctx); |
| mismatch | const | 53 | no | const mismatch=planRecovery(finding(&#39;HEARTBEAT_STALE&#39;,&#39;world&#39;,[&#39;stale_heartbeat&#39;]),ctx); |
| absent | const | 55 | no | const absent=diagnoseRecovery(finding(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,[])); |
| p | const | 61 | no | const p=planRecovery(confirmed(&#39;SEND_OUTCOME_UNCERTAIN&#39;,&#39;control&#39;,&#39;send_outcome_uncertain&#39;),ctx); |
| f | const | 69 | no | const f=confirmed(&#39;GRANT_REVOKED&#39;,&#39;world&#39;,&#39;grant_revocation&#39;); |
| p | const | 70 | no | const p=planRecovery(f,ctx); |
| p | const | 78 | no | const p=planRecovery(confirmed(&#39;PHONE_PROJECTION_STALE&#39;,&#39;world&#39;,&#39;revision_gap&#39;),ctx); |
| f | const | 85 | no | const f=finding(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,[&#39;stale_heartbeat&#39;,&#39;authoritative_healthy&#39;]); |
| f | const | 92 | no | const f=finding(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,[&#39;stale_heartbeat&#39;]); |
| p | const | 99 | no | const p=planRecovery(confirmed(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,&#39;stale_heartbeat&#39;),ctx); |
| h | variable | 100 | no | let h=beginRecovery(p); |
| p | const | 118 | no | const p=planRecovery(confirmed(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,&#39;stale_heartbeat&#39;),ctx); |
| h | const | 119 | no | const h=transitionRecovery(beginRecovery(p),p,auth(p)); |
| p | const | 125 | no | const p=planRecovery(confirmed(&#39;PROCESS_ENDED&#39;,&#39;worker&#39;,&#39;process_exit&#39;),ctx); |
| h | variable | 126 | no | let h=transitionRecovery(beginRecovery(p),p,auth(p)); |
| p | const | 136 | no | const p=planRecovery(confirmed(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,&#39;stale_heartbeat&#39;),ctx); |
| h | variable | 137 | no | let h=transitionRecovery(beginRecovery(p),p,auth(p)); |
| p | const | 147 | no | const p=planRecovery(confirmed(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,&#39;stale_heartbeat&#39;),ctx); |
| e | const | 148 | no | const e=auth(p);const h=transitionRecovery(beginRecovery(p),p,e); |
| p | const | 154 | no | const p=planRecovery(confirmed(&#39;WORKER_CYCLE_FAILED&#39;,&#39;worker&#39;,&#39;worker_cycle_error&#39;),ctx); |
| h | const | 155 | no | const h=transitionRecovery(beginRecovery(p),p,auth(p)); |
| evidence | const | 160 | no | const evidence={signature:&#39;HEARTBEAT_STALE&#39;,actionId:&#39;host.worker.lease.inspect&#39;,environmentKey:&#39;android15&#39;, |
| first | const | 162 | no | const first=learnRecovery([],evidence); |
| memory | variable | 170 | no | let memory=[]; |
| base | const | 171 | no | const base={signature:&#39;HEARTBEAT_STALE&#39;,environmentKey:&#39;android15&#39;,independentObserver:&#39;qa&#39;,executor:&#39;host&#39;}; |
| ranked | const | 173 | no | const ranked=rankRecoveryActions([&#39;host.worker.lease.inspect&#39;,&#39;host.worker.heartbeat.inspect&#39;],{signature:&#39;HEARTBEAT_STALE&#39;,environmentKey:&#39;android15&#39;,memory}); |
| f | const | 183 | no | const f=finding(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,[&#39;authoritative_healthy&#39;,&#39;stale_heartbeat&#39;]); |
| f | const | 189 | no | const f=finding(&#39;PROCESS_ENDED&#39;,&#39;worker&#39;,[&#39;process_exit&#39;,&#39;lease_invalid&#39;]); |
| p | const | 190 | no | const p=proposeManualRecovery(f,&#39;host.worker.lease.recover&#39;,ctx); |
| h | const | 194 | no | const h=transitionRecovery(beginRecovery(p),p,auth(p)); |
| f | const | 200 | no | const f=finding(&#39;WORLD_REVISION_CONFLICT&#39;,&#39;world&#39;,[&#39;revision_conflict&#39;,&#39;snapshot_verified&#39;]); |
| p | const | 201 | no | const p=proposeManualRecovery(f,&#39;host.world.revision.undo&#39;,ctx); |
| p | const | 209 | no | const p=planRecovery(confirmed(&#39;HEARTBEAT_STALE&#39;,&#39;worker&#39;,&#39;stale_heartbeat&#39;),ctx); |
| tooLate | const | 210 | no | const tooLate={...auth(p),at:&#39;2026-11-10T05:05:01.000Z&#39;}; |
| network | const | 215 | no | const network=planRecovery(confirmed(&#39;HOST_TRANSPORT_DISCONNECTED&#39;,&#39;worker&#39;,&#39;transport_disconnected&#39;),ctx); |
| schema | const | 218 | no | const schema=planRecovery(confirmed(&#39;SCHEMA_MISMATCH&#39;,&#39;world&#39;,&#39;schema_mismatch&#39;),ctx); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../recovery/intelligence.mjs | import | 3 | [apps/vivim-host/recovery/intelligence.mjs](../recovery/intelligence.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { FAILURE_SIGNATURES, RECOVERY_ACTIONS, validateFinding, diagnoseRecovery,
  planRecovery, proposeManualRecovery, beginRecovery, transitionRecovery, learnRecovery, rankRecoveryActions,
  recoveryHistoryView } from '../recovery/intelligence.mjs';

const AT='2026-11-10T05:00:00.000Z';
const ctx={ now:AT, policyVersion:'policy-3', authorityEpoch:'epoch-27', worldRevision:'world-rev-10',environmentKey:'android15-host-v1' };
let count=0;
function finding(code, kind, evidenceKinds=[], other={}) {
  return {schema:'vivim.diagnostic-finding/1',id:`finding-${++count}`,code,severity:'medium',confidence:.95,
    target:{kind,id:kind==='worker'?'relay':kind==='control'?'ctl-abc':'world-1'},observedAt:AT,
    evidence:evidenceKinds.map((k,i)=>({ref:`evidence-${count}-${i}`,kind:k,at:AT})),...other};
}
function event(type, more={}) {return {id:`event-${++count}`,type,at:AT,...more};}
function confirmed(code,kind,kindEvidence){return finding(code,kind,[kindEvidence]);}
const auth=(plan)=>event('authorize',{planDigest:plan.planDigest,policyVersion:plan.policyVersion,authorityEpoch:plan.authorityEpoch,hostAuthorizationVerified:true});
const dispatch=(plan)=>event('dispatch',{actionId:plan.operations[0].actionId,targetId:plan.target.id,policyVersion:plan.policyVersion,authorityEpoch:plan.authorityEpoch,hostAuthorizationVerified:true});

test('action metadata points to known existing owners, without executable function handles',()=>{
  assert.equal(RECOVERY_ACTIONS['host.worker.lease.recover'].admission,'blocked_pending_route_authorization_proof');
  assert.equal(RECOVERY_ACTIONS['host.world.revision.undo'].level,'R3');
  assert.equal(typeof RECOVERY_ACTIONS['host.worker.lease.recover'].existing,'string');
  assert.equal(Object.values(RECOVERY_ACTIONS).every(x=>!('run' in x || 'execute' in x)) ,true);
  assert.equal(FAILURE_SIGNATURES.version,1);
});

test('source-linked stale heartbeat yields R0 inspect and never a restart',()=>{
  const f=confirmed('HEARTBEAT_STALE','worker','stale_heartbeat');
  const d=diagnoseRecovery(f);
  assert.equal(d.classification,'confirmed_failure_signal');
  const p=planRecovery(f,ctx);
  assert.equal(p.operations[0].actionId,'host.worker.lease.inspect');
  assert.equal(p.operations[0].level,'R0');
  assert.equal(p.operations[0].retryBudget,0);
  assert.equal(p.automaticEffectsAllowed,false);
  assert.equal(p.externalEffectRetryBudget,0);
  assert.equal(p.grantsPermission,false);
});

test('same finding and context create exact same plan digest and identity',()=>{
  const f=confirmed('WORKER_CYCLE_FAILED','worker','worker_cycle_error');
  assert.deepEqual(planRecovery(f,ctx),planRecovery(f,ctx));
  const p=planRecovery(f,ctx);
  assert.match(p.planDigest,/^[0-9a-f]{64}$/);
  assert.equal(p.planId,'rpl-'+p.planDigest.slice(0,24));
});

test('unknown, target-mismatched and no-evidence findings fail closed',()=>{
  const unknown=planRecovery(finding('BRAND_NEW_FAILURE','worker',['stale_heartbeat']),ctx);
  assert.equal(unknown.operations.length,0);
  assert.equal(unknown.escalation,'no_safe_action_proven');
  const mismatch=planRecovery(finding('HEARTBEAT_STALE','world',['stale_heartbeat']),ctx);
  assert.equal(mismatch.operations.length,0);
  const absent=diagnoseRecovery(finding('HEARTBEAT_STALE','worker',[]));
  assert.equal(absent.classification,'missing_observability');
  assert.equal(absent.hypotheses[0].confidence,0);
});

test('provider-send uncertainty permits status inspection but no replay',()=>{
  const p=planRecovery(confirmed('SEND_OUTCOME_UNCERTAIN','control','send_outcome_uncertain'),ctx);
  assert.deepEqual(p.operations.map(o=>o.actionId),['host.control.outcome.inspect']);
  assert.match(p.escalation,/owner_review/);
  assert.ok(p.safeguards.includes('no_provider_resend'));
  assert.equal(p.externalEffectRetryBudget,0);
});

test('revoked permission never restores cached data or proposes effects',()=>{
  const f=confirmed('GRANT_REVOKED','world','grant_revocation');
  const p=planRecovery(f,ctx);
  assert.equal(p.operations.length,0);
  assert.equal(p.classification,'confirmed_state_not_effect_outcome');
  assert.equal(beginRecovery(p).state,'escalated');
  assert.ok(p.safeguards.includes('no_revoked_data_restore'));
});

test('stale phone projection first inspects authoritative World (no blind cache reset)',()=>{
  const p=planRecovery(confirmed('PHONE_PROJECTION_STALE','world','revision_gap'),ctx);
  assert.equal(p.operations[0].expectedObservation,'authoritative_world_revision_observed');
  assert.equal(p.operations[0].effect,'read');
```

_First 80 of 222 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
