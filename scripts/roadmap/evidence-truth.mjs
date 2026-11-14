#!/usr/bin/env node
// A00 read-only release-truth projection. Ledger text is a CLAIM, never an executed receipt.
// Historical source files and keeper-owned roadmap are never modified.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCES = Object.freeze({
  promoted: 'integration/beta-gates.json',
  proposal: '.integration/proposal5/08-BETA-GATES.json',
  release: 'integration/release-manifest.json'
});
const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
const accepted = gate => gate?.status === 'ACCEPTED' && gate.owner_accepted === true &&
  Boolean(gate.observed_evidence);
const string = (value, fallback='UNSPECIFIED') =>
  typeof value === 'string' && value.length ? value : fallback;

export function deriveReleaseTruth({ promoted, proposal, release }) {
  for (const [name, ledger] of Object.entries({ promoted, proposal, release })) {
    if (!isObject(ledger) || typeof ledger.status !== 'string')
      throw new TypeError('Malformed or missing ' + name + ' status ledger');
  }
  if (!Array.isArray(proposal.gates) || !Array.isArray(promoted.gates))
    throw new TypeError('Both beta gate ledgers require a gates array');
  const ids = new Set();
  for (const gate of proposal.gates) {
    if (!isObject(gate) || typeof gate.id !== 'string' || ids.has(gate.id))
      throw new TypeError('Malformed or duplicate proposal gate ID');
    ids.add(gate.id);
  }
  for (const gate of promoted.gates) {
    if (!isObject(gate) || typeof gate.id !== 'string')
      throw new TypeError('Malformed promoted gate');
  }
  const claims = {
    promoted: { source: SOURCES.promoted, status: promoted.status,
      decision: promoted.decision || null, sourceMergeSha: promoted.sourceMergeSha || null },
    proposal: { source: SOURCES.proposal, status: proposal.status },
    release: { source: SOURCES.release, status: release.status,
      sourceMerge: release.sourceMerge || null }
  };
  const blockers = [];
  const conflicts = [];
  const proposalUnrun = proposal.gates.filter(g => !accepted(g));
  if (proposalUnrun.length) blockers.push({
    code: 'PROPOSAL_GATES_UNRUN', count: proposalUnrun.length,
    gateIds: proposalUnrun.map(g => g.id),
    detail: 'A missing/UNRUN gate, absent receipt or unaccepted owner gate is not a pass'
  });
  if (release.status !== 'BUILT_ACCEPTED' || release.securityAccepted !== true ||
      release.deviceAccepted !== true || release.noDonorBuildAccepted !== true ||
      release.mainConsolidation?.releaseAllowed !== true) {
    blockers.push({ code: 'RELEASE_NOT_ACCEPTED',
      manifestStatus: release.status,
      securityAccepted: release.securityAccepted === true,
      deviceAccepted: release.deviceAccepted === true,
      noDonorBuildAccepted: release.noDonorBuildAccepted === true,
      releaseAllowed: release.mainConsolidation?.releaseAllowed === true });
  }
  const priorCi = promoted.mainConsolidation || {};
  const releaseCi = release.mainConsolidation || {};
  const ciIsStartupFailure = [priorCi, releaseCi].some(c =>
    c.ciConclusion === 'startup_failure' && c.ciJobs === 0);
  if (ciIsStartupFailure) {
    blockers.push({ code: 'CI_STARTUP_FAILURE_ZERO_JOBS',
      sources: [SOURCES.promoted, SOURCES.release].filter((_, i) =>
        [priorCi, releaseCi][i].ciConclusion === 'startup_failure' &&
        [priorCi, releaseCi][i].ciJobs === 0),
      detail: 'Workflow never launched test jobs; do not infer a process exit or passing checks' });
  }
  const pwa = release.platforms?.androidPwa;
  if (release.deviceAccepted !== true || pwa === 'UNRUN')
    blockers.push({ code: 'PHYSICAL_DEVICE_EVIDENCE_UNRUN',
      androidPwa: string(pwa), ownerAccepted: release.deviceAccepted === true });
  if (promoted.status === 'UNBLOCKED' && proposal.status === 'PROPOSED_UNRUN')
    conflicts.push({ code: 'UNBLOCKED_VS_PROPOSAL_UNRUN',
      sources: [SOURCES.promoted, SOURCES.proposal] });
  if (promoted.status === 'UNBLOCKED' && release.status !== 'BUILT_ACCEPTED')
    conflicts.push({ code: 'UNBLOCKED_VS_RELEASE_BLOCKED',
      sources: [SOURCES.promoted, SOURCES.release] });
  const promotedById = new Map(promoted.gates.map(g => [g.id, g]));
  const gateContradictions = proposal.gates.filter(g =>
    promotedById.get(g.id)?.status === 'ACCEPTED' && !accepted(g)).map(g => g.id);
  if (gateContradictions.length)
    conflicts.push({ code: 'PROMOTED_GATES_VS_UNRUN_PROPOSAL',
      gateIds: gateContradictions, count: gateContradictions.length,
      sources: [SOURCES.promoted, SOURCES.proposal] });
  if (ciIsStartupFailure && (priorCi.betaGo === true ||
      priorCi.toolchainTests === 'EXECUTED' || priorCi.deploymentAuthorized === true ||
      priorCi.releaseAllowed === true)) {
    conflicts.push({ code: 'EXECUTED_OR_RELEASE_CLAIM_VS_ZERO_CI_JOBS',
      runId: priorCi.ciRunId ?? null, conclusion: priorCi.ciConclusion,
      jobs: priorCi.ciJobs, source: SOURCES.promoted });
  }
  if (priorCi.mergeCommit && releaseCi.mergeCommit &&
      priorCi.mergeCommit !== releaseCi.mergeCommit)
    conflicts.push({ code: 'INCONSISTENT_MERGE_SHA',
      promoted: priorCi.mergeCommit, release: releaseCi.mergeCommit,
      sources: [SOURCES.promoted, SOURCES.release] });
  const g12 = promotedById.get('G12');
  if (g12?.status === 'ACCEPTED' && /not executed|UNRUN/i.test(String(g12.observed_evidence || '')))
    conflicts.push({ code: 'G12_ACCEPTED_CLAIM_ADMITS_UNRUN',
      source: SOURCES.promoted, gateId: 'G12' });

  const internallySatisfied = blockers.length === 0 && conflicts.length === 0;
  return {
    schema: 'arbor.release-truth-projection/2',
    nature: 'READ_ONLY_CONFLICT_PROJECTION',
    releaseReady: false,
    sourceClaimsSatisfied: internallySatisfied,
    claimsConsistent: conflicts.length === 0,
    disposition: internallySatisfied ? 'EVIDENCE_REVIEW_REQUIRED' : 'BLOCKED_UNVERIFIED',
    claims, conflictingClaims: conflicts.length > 0,
    conflicts, blockers,
    evidence: {
      nodeTests: 'NOT_EXECUTED_BY_THIS_READ_ONLY_PROJECTION',
      ci: ciIsStartupFailure ? 'LEDGERS_REPORT_STARTUP_FAILURE_ZERO_JOBS' : 'NOT_INDEPENDENTLY_VERIFIED',
      browserDom: 'UNRUN', physicalDevice: 'UNRUN',
      independentKeeperReceipt: 'UNRUN', ownerAcceptance: 'UNRUN'
    },
    historicalReceiptsPreserved: true,
    evidenceIsNotReleasePermission: true,
    note: 'Consistent ledgers are not independent Node/browser/device receipts. No gate, roadmap or release manifest was mutated.'
  };
}

export function loadReleaseSources(root = ROOT) {
  const read = rel => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
  return {
    promoted: read(SOURCES.promoted),
    proposal: read(SOURCES.proposal),
    release: read(SOURCES.release)
  };
}
function main() {
  if (process.argv.slice(2).some(x => x !== '--check') || process.argv.length > 3) {
    process.stderr.write('Usage: node scripts/roadmap/evidence-truth.mjs [--check]\n');
    process.exitCode = 2; return;
  }
  try {
    const result = deriveReleaseTruth(loadReleaseSources());
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    // A truthful blocked projection is a successful read, never acceptance.
    process.exitCode = 0;
  } catch (error) {
    process.stderr.write('Release truth unavailable: ' + String(error?.stack || error) + '\n');
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
