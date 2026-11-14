import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveReleaseTruth, loadReleaseSources } from './evidence-truth.mjs';

test('current conflicting ledgers remain visible; never silently promote release', () => {
  const view = deriveReleaseTruth(loadReleaseSources());
  assert.equal(view.schema, 'arbor.release-truth-projection/1');
  assert.equal(view.claims.promoted.source, 'integration/beta-gates.json');
  assert.equal(view.claims.proposal.source, '.integration/proposal5/08-BETA-GATES.json');
  assert.equal(view.claims.release.source, 'integration/release-manifest.json');
  assert.equal(view.releaseReady, false, 'current release is blocked');
  assert.equal(view.disposition, 'BLOCKED_UNVERIFIED');
  assert.ok(view.blockers.length >= 1);
  assert.equal(view.evidenceIsNotReleasePermission, true);
});

test('unrun gate and missing device evidence forbid a green release even with UNBLOCKED claim', () => {
  const view = deriveReleaseTruth({
    promoted: { status: 'UNBLOCKED' },
    proposal: { status: 'PROPOSED_UNRUN',
      gates: [{ id: 'G01', status: 'UNRUN', owner_accepted: false, observed_evidence: null }] },
    release: { status: 'BLOCKED_NOT_BUILT', securityAccepted: false, deviceAccepted: false,
      noDonorBuildAccepted: false, mainConsolidation: { releaseAllowed: false } }
  });
  assert.equal(view.conflictingClaims, true);
  assert.equal(view.releaseReady, false);
  assert.deepEqual(view.blockers.find(x => x.code === 'PROPOSAL_GATES_UNRUN').gateIds, ['G01']);
});
