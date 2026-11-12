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
