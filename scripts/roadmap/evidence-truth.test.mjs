import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveReleaseTruth, loadReleaseSources } from './evidence-truth.mjs';

function gates(status = 'UNRUN', owner = false, observed = null) {
  return ['G00','G01','G12'].map(id => ({
    id, status, owner_accepted: owner, observed_evidence: observed
  }));
}
function ledgers() {
  return {
    promoted: {status:'UNBLOCKED', gates:gates('ACCEPTED',true,'claim only'),
      mainConsolidation:{ciConclusion:'startup_failure',ciJobs:0,ciRunId:43334607434,
        betaGo:true,toolchainTests:'EXECUTED',deploymentAuthorized:true,mergeCommit:'aaa'}},
    proposal: {status:'PROPOSED_UNRUN',gates:gates()},
    release: {status:'BLOCKED_NOT_BUILT',securityAccepted:false,
      deviceAccepted:false,noDonorBuildAccepted:false,platforms:{androidPwa:'UNRUN'},
      mainConsolidation:{releaseAllowed:false,ciConclusion:'startup_failure',
        ciJobs:0,mergeCommit:'bbb'}}
  };
}

test('actual source ledgers preserve contradictory claims without release promotion', () => {
  const view = deriveReleaseTruth(loadReleaseSources());
  assert.equal(view.schema, 'arbor.release-truth-projection/2');
  assert.equal(view.claims.promoted.source, 'integration/beta-gates.json');
  assert.equal(view.claims.proposal.source, '.integration/proposal5/08-BETA-GATES.json');
  assert.equal(view.claims.release.source, 'integration/release-manifest.json');
  assert.equal(view.claims.promoted.status, 'UNBLOCKED');
  assert.equal(view.claims.proposal.status, 'PROPOSED_UNRUN');
  assert.equal(view.claims.release.status, 'BLOCKED_NOT_BUILT');
  assert.equal(view.releaseReady, false);
  assert.equal(view.disposition, 'BLOCKED_UNVERIFIED');
  assert.equal(view.conflictingClaims, true);
  assert.ok(view.conflicts.some(c => c.code === 'PROMOTED_GATES_VS_UNRUN_PROPOSAL'));
  assert.ok(view.blockers.some(c => c.code === 'CI_STARTUP_FAILURE_ZERO_JOBS'));
  assert.ok(view.blockers.some(c => c.code === 'PHYSICAL_DEVICE_EVIDENCE_UNRUN'));
  assert.equal(view.evidence.browserDom, 'UNRUN');
  assert.equal(view.evidence.independentKeeperReceipt, 'UNRUN');
  assert.equal(view.historicalReceiptsPreserved, true);
  assert.equal(view.evidenceIsNotReleasePermission, true);
});

test('unrun proposal and missing device proof block even if promoted ledger says UNBLOCKED', () => {
  const view = deriveReleaseTruth(ledgers());
  assert.deepEqual(view.blockers.find(x => x.code === 'PROPOSAL_GATES_UNRUN').gateIds,
    ['G00','G01','G12']);
  assert.equal(view.releaseReady,false);
  assert.ok(view.conflicts.some(c => c.code === 'EXECUTED_OR_RELEASE_CLAIM_VS_ZERO_CI_JOBS'));
  assert.ok(view.conflicts.some(c => c.code === 'INCONSISTENT_MERGE_SHA'));
});

test('zero CI jobs are not Node test process execution or release permission', () => {
  const view=deriveReleaseTruth(ledgers());
  const block=view.blockers.find(x=>x.code==='CI_STARTUP_FAILURE_ZERO_JOBS');
  assert.ok(block);
  assert.equal(view.evidence.ci,'LEDGERS_REPORT_STARTUP_FAILURE_ZERO_JOBS');
  assert.equal(view.evidence.nodeTests,'NOT_EXECUTED_BY_THIS_READ_ONLY_PROJECTION');
});

test('G12 accepted claim that admits UNRUN must stay contradictory', () => {
  const input=ledgers();
  input.promoted.gates.find(g=>g.id==='G12').observed_evidence='runner authored, not executed';
  const view=deriveReleaseTruth(input);
  assert.ok(view.conflicts.some(x=>x.code==='G12_ACCEPTED_CLAIM_ADMITS_UNRUN'));
});

test('even perfectly aligned green ledgers do not confer independent acceptance', () => {
  const input=ledgers();
  input.promoted.status='UNBLOCKED';
  input.promoted.mainConsolidation={
    ciConclusion:'success',ciJobs:4,toolchainTests:'EXECUTED',betaGo:true,releaseAllowed:true
  };
  input.proposal.status='ACCEPTED';
  input.proposal.gates=gates('ACCEPTED',true,'claimed receipt');
  input.release={
    status:'BUILT_ACCEPTED',securityAccepted:true,deviceAccepted:true,
    noDonorBuildAccepted:true,platforms:{androidPwa:'ACCEPTED'},
    mainConsolidation:{releaseAllowed:true,ciConclusion:'success',ciJobs:4}
  };
  const view=deriveReleaseTruth(input);
  assert.equal(view.claimsConsistent,true);
  assert.equal(view.sourceClaimsSatisfied,true);
  assert.equal(view.disposition,'EVIDENCE_REVIEW_REQUIRED');
  assert.equal(view.releaseReady,false);
  assert.equal(view.evidence.ownerAcceptance,'UNRUN');
});

test('missing gates, malformed sources and duplicate IDs fail closed', () => {
  const input=ledgers();
  assert.throws(()=>deriveReleaseTruth({...input,proposal:null}),/Malformed or missing/);
  assert.throws(()=>deriveReleaseTruth({...input,proposal:{status:'UNRUN'}}),/gates array/);
  input.proposal.gates.push({...input.proposal.gates[0]});
  assert.throws(()=>deriveReleaseTruth(input),/duplicate proposal gate/);
});
