/**
 * G1 pairwise parity evidence join. D's physical source state and capability
 * state remain distinct, with no invented owner decision or runtime receipts.
 */
import { buildParityAtlas } from '../parity/atlas.mjs';
export const PARITY_BRIDGE_SCHEMA = 'arbor.hvi.adapter.parity-evidence/1';
function fail(code) { const e = new Error('HVI_PARITY_BRIDGE_' + code); e.code = code; throw e; }
const key = (repo, commit, path, blob) => [repo, commit, path, blob].join('|');
function asD(x) {
  const { pin, nativeManifest: native } = x ?? {};
  if (!pin || !native || pin.pinId !== native.pinId ||
      pin.resolvedCommitSha !== native.resolvedCommitSha ||
      pin.rootTreeSha !== native.rootTreeSha) fail('PIN_CONFLICT');
  // D cannot parse sensitive filenames; redaction is a completeness event,
  // not license to pretend the original repository is fully observed.
  const files = native.entries.filter(e => e.kind === 'file' &&
    !e.excludedReason && e.parseStatus !== 'lfs_pointer' &&
    e.parseStatus !== 'binary' && e.blobSha && e.path);
  return { repo: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
    completeness: pin.completeness === 'complete' && files.length === native.entries.length
      ? 'complete' : 'partial', scope: 'development',
    entries: files.map(e => ({ path: e.path, blobSha: e.blobSha, kind: e.kind })) };
}
export function joinParityEvidence({ donorBridge, targetBridge, comparison } = {}) {
  if (!donorBridge || !targetBridge || !comparison ||
      !Array.isArray(comparison.sourceDeltas)) fail('INVALID_INPUT');
  const donor = asD(donorBridge), target = asD(targetBridge);
  if (comparison.targetPinId !== targetBridge.pin.pinId ||
      !comparison.sourcePins.some(p => p.pinId === donorBridge.pin.pinId)) fail('PIN_CONFLICT');
  // D's sourceEvidence, ownerDecisions and testReceipts are intentionally empty.
  // Granting trust to caller-provided evidence is reserved for Host H.
  const atlas = buildParityAtlas({ donor, target, sourceEvidence: [],
    ownerDecisions: [], owners: [], testReceipts: [] });
  const lookup = new Map(comparison.sourceDeltas.filter(r =>
    r.originPinId === donorBridge.pin.pinId && r.targetPinId === targetBridge.pin.pinId &&
    r.originPath && r.originBlob).map(r =>
      [key(r.originRepo, r.originSha, r.originPath, r.originBlob), r]));
  const joinedRows = atlas.rows.map(r => {
    const match = lookup.get(key(r.origin_repo, r.origin_sha, r.origin_path, r.origin_blob));
    if (!match) fail('UNMATCHED_SOURCE_EVIDENCE');
    return { pinId: donorBridge.pin.pinId, targetPinId: targetBridge.pin.pinId,
      repo: r.origin_repo, commitSha: r.origin_sha, path: r.origin_path,
      blobSha: r.origin_blob, sourceState: donor.completeness === 'complete' &&
        target.completeness === 'complete' ? r.source_state :
        r.source_state === 'MISSING_AT_TARGET' ? 'UNOBSERVABLE' : r.source_state,
      capabilityState: r.capability_state, inspected: r.inspected,
      evidenceRefs: r.evidence_refs, testStatus: r.tests,
      runtimeEvidence: 'UNRUN', ownerDecision: 'UNKNOWN_UNREVIEWED',
      classification: r.source_state === 'MISSING_AT_TARGET' ?
        'PHYSICAL_PATH_ABSENCE_ONLY' : 'SOURCE_PROJECTION',
      comparisonFindingId: match.id };
  });
  return Object.freeze({ schema: PARITY_BRIDGE_SCHEMA,
    donorPinId: donorBridge.pin.pinId, targetPinId: targetBridge.pin.pinId,
    coverage: atlas.coverage, sourceCounts: atlas.sourceCounts,
    joinedRows, runtimeAccepted: false, ownerAcceptance: 'UNRUN' });
}
