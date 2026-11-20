# File: apps/vivim-host/test/recovery-host-adapter.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/recovery-host-adapter.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3235 B |
| Lines | 53 |
| Hash | 70c07fcc591c |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 4 | no | const NOW=&#39;2026-11-10T05:00:00.000Z&#39;; |
| snap | function | 5 | no | function snap(services={},recent=[]) { return {schema:&#39;vivim.host-status/1&#39;,observedAt:NOW, |
| out | const | 9 | no | const out=projectHostRecovery(snap()); |
| out | const | 16 | no | const out=projectHostRecovery(snap({relay:{state:&#39;blocked&#39;,diagnosticCode:&#39;WORKER_CYCLE_FAILED&#39;,lastHeartbeatAt:NOW}})); |
| out | const | 21 | no | const out=projectHostRecovery(snap({relay:{state:&#39;stale&#39;,diagnosticCode:&#39;HEARTBEAT_STALE&#39;,lastHeartbeatAt:NOW}})); |
| id | const | 26 | no | const id=&#39;cmd-0123456789abcdef&#39;; |
| out | const | 27 | no | const out=projectHostRecovery(snap({},[{id,currentStage:&#39;send_outcome_uncertain&#39;,updatedAt:NOW, text:&#39;SECRET PROMPT&#39;,result:&#39;SECRET RESPONSE&#39;}])); |
| uncertain | const | 29 | no | const uncertain=out.findings.find(f=&gt;f.code===&#39;SEND_OUTCOME_UNCERTAIN&#39;); |
| out | const | 36 | no | const out=projectHostRecovery(snap({},[{id:&#39;../danger&#39;,currentStage:&#39;send_outcome_uncertain&#39;,updatedAt:NOW}, {id:&#39;cmd-0123456789abcdef&#39;,currentStage:&#39;waiting_for_cloud_update&#39;,updatedAt:NOW}])); |
| rows | const | 43 | no | const rows=Array.from({length:30},(_,i)=&gt;({id:&#39;cmd-&#39;+i.toString(16).padStart(16,&#39;0&#39;),currentStage:&#39;send_outcome_uncertain&#39;,updatedAt:NOW})); |
| out | const | 44 | no | const out=projectHostRecovery(snap({},rows),{maxFindings:4}); |
| future | const | 49 | no | const future=&#39;2026-11-10T05:30:00.000Z&#39;; |
| out | const | 50 | no | const out=projectHostRecovery(snap({relay:{state:&#39;blocked&#39;,diagnosticCode:&#39;WORKER_CYCLE_FAILED&#39;,lastHeartbeatAt:future}})); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../recovery/host-adapter.mjs | import | 3 | [apps/vivim-host/recovery/host-adapter.mjs](../recovery/host-adapter.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { projectHostRecovery } from '../recovery/host-adapter.mjs';
const NOW='2026-11-10T05:00:00.000Z';
function snap(services={},recent=[]) { return {schema:'vivim.host-status/1',observedAt:NOW,
  services:{relay:{state:'unknown',diagnosticCode:'NO_HEARTBEAT'},chatWorker:{state:'online',diagnosticCode:'WORKER_CYCLE_OK'},...services},
  journey:{recent}}; }
test('missing heartbeat remains missing observability, never process death',()=>{
  const out=projectHostRecovery(snap());
  assert.equal(out.findings.length,1);
  assert.equal(out.findings[0].classification,'missing_observability');
  assert.equal(out.findings[0].recommendedRead.effect,'read');
  assert.equal(out.automaticMutations,0);
});
test('failed worker cycle yields read-only diagnosis, not executable action',()=>{
  const out=projectHostRecovery(snap({relay:{state:'blocked',diagnosticCode:'WORKER_CYCLE_FAILED',lastHeartbeatAt:NOW}}));
  assert.equal(out.findings[0].classification,'confirmed_failure_signal');
  assert.equal(out.findings[0].autoExecute,false);
});
test('stale worker is suspected and matched to existing owner inspection',()=>{
  const out=projectHostRecovery(snap({relay:{state:'stale',diagnosticCode:'HEARTBEAT_STALE',lastHeartbeatAt:NOW}}));
  assert.equal(out.findings[0].classification,'suspected');
  assert.match(out.findings[0].recommendedRead.existingExecutor,/worker-supervisor/);
});
test('uncertain provider outcome never becomes successful or retryable',()=>{
  const id='cmd-0123456789abcdef';
  const out=projectHostRecovery(snap({},[{id,currentStage:'send_outcome_uncertain',updatedAt:NOW,
    text:'SECRET PROMPT',result:'SECRET RESPONSE'}]));
  const uncertain=out.findings.find(f=>f.code==='SEND_OUTCOME_UNCERTAIN');
  assert.equal(uncertain.classification,'confirmed_state_not_effect_outcome');
  assert.equal(uncertain.autoExecute,false);
  assert.equal(out.automaticProviderResends,0);
  assert.doesNotMatch(JSON.stringify(out),/SECRET/);
});
test('invalid and unverified journal entries do not fabricate an observed send',()=>{
  const out=projectHostRecovery(snap({},[{id:'../danger',currentStage:'send_outcome_uncertain',updatedAt:NOW},
    {id:'cmd-0123456789abcdef',currentStage:'waiting_for_cloud_update',updatedAt:NOW}]));
  assert.equal(out.findings.length,1);
});
test('finding bounds and malformed timestamps fail closed',()=>{
  assert.throws(()=>projectHostRecovery({...snap(),observedAt:'tomorrow'}));
  assert.throws(()=>projectHostRecovery(snap(),{maxFindings:999}));
  const rows=Array.from({length:30},(_,i)=>({id:'cmd-'+i.toString(16).padStart(16,'0'),currentStage:'send_outcome_uncertain',updatedAt:NOW}));
  const out=projectHostRecovery(snap({},rows),{maxFindings:4});
  assert.equal(out.findings.length,4);
});

test('future-dated heartbeat cannot prove a failed cycle',()=>{
  const future='2026-11-10T05:30:00.000Z';
  const out=projectHostRecovery(snap({relay:{state:'blocked',diagnosticCode:'WORKER_CYCLE_FAILED',lastHeartbeatAt:future}}));
  assert.equal(out.findings[0].classification,'missing_observability');
  assert.deepEqual(out.findings[0].evidenceRefs,[]);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
