#!/usr/bin/env node
// A00 evidence-truth projection: compare existing immutable ledgers.
// It does not rewrite gates, grant release authority, or infer passing CI from source.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function deriveReleaseTruth({ promoted, proposal, release }) {
  if (!promoted || !proposal || !release) throw new TypeError('All source ledgers required');
  const claims = {
    promoted: { source: 'integration/beta-gates.json', status: promoted.status, decision: promoted.decision || null },
    proposal: { source: '.integration/proposal5/08-BETA-GATES.json', status: proposal.status },
    release: { source: 'integration/release-manifest.json', status: release.status }
  };
  const proposalUnrun = (proposal.gates || []).filter(g =>
    g.status === 'UNRUN' || g.owner_accepted === false || !g.observed_evidence);
  const blockers = [];
  if (proposalUnrun.length) blockers.push({
    code: 'PROPOSAL_GATES_UNRUN', count: proposalUnrun.length,
    gateIds: proposalUnrun.map(x => x.id)
  });
  if (release.status !== 'BUILT_ACCEPTED' || release.securityAccepted !== true ||
      release.deviceAccepted !== true || release.noDonorBuildAccepted !== true ||
      release.mainConsolidation?.releaseAllowed !== true) {
    blockers.push({ code: 'RELEASE_NOT_ACCEPTED', manifestStatus: release.status,
      securityAccepted: release.securityAccepted === true,
      deviceAccepted: release.deviceAccepted === true,
      noDonorBuildAccepted: release.noDonorBuildAccepted === true,
      releaseAllowed: release.mainConsolidation?.releaseAllowed === true });
  }
  const conflictingClaims = promoted.status === 'UNBLOCKED' && blockers.length > 0;
  return {
    schema: 'arbor.release-truth-projection/1',
    nature: 'READ_ONLY_CONFLICT_PROJECTION',
    // Source ledgers alone never confer release permission; an independent
    // runtime/security/device acceptance is required outside this projection.
    releaseReady: false,
    sourceClaimsSatisfied: blockers.length === 0,
    disposition: blockers.length ? 'BLOCKED_UNVERIFIED' : 'EVIDENCE_REVIEW_REQUIRED',
    claims, conflictingClaims, blockers,
    evidenceIsNotReleasePermission: true,
    note: 'Status is derived from existing ledgers, never an independent acceptance or permission to deploy'
  };
}

export function loadReleaseSources(root = ROOT) {
  const read = rel => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
  return {
    promoted: read('integration/beta-gates.json'),
    proposal: read('.integration/proposal5/08-BETA-GATES.json'),
    release: read('integration/release-manifest.json')
  };
}
function main() {
  if (process.argv.length > 2 && process.argv[2] !== '--check') {
    process.stderr.write('Usage: node scripts/roadmap/evidence-truth.mjs [--check]\n');
    process.exitCode = 2; return;
  }
  try {
    const result = deriveReleaseTruth(loadReleaseSources());
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    // A blocked release is an accurate outcome, not an execution error.
    // Exit failure only when source truth cannot be read/validated.
    if (!['BLOCKED_UNVERIFIED', 'EVIDENCE_REVIEW_REQUIRED'].includes(result.disposition)) process.exitCode = 1;
  } catch (e) {
    process.stderr.write('Release truth unavailable: ' + String(e.stack || e) + '\n');
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
