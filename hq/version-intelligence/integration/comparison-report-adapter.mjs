/**
 * G1 loss-preserving C -> E report projection. This is a view, not an effect
 * or a claim of runtime acceptance. Original C evidence is retained unchanged.
 */
import { digest } from '../sources/common.mjs';
import { COMPARISON_SCHEMA as C_SCHEMA } from '../compare/index.mjs';
import { projectVersionComparison } from '../report/index.mjs';

export const REPORT_BRIDGE_SCHEMA = 'arbor.hvi.adapter.comparison-report/1';
function fail(code) { const e = new Error('HVI_REPORT_BRIDGE_' + code); e.code = code; throw e; }
const sha = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
function verifiedC(c) {
  if (c?.schema !== C_SCHEMA || !Array.isArray(c.sourcePins) || c.sourcePins.length < 2 ||
      !Array.isArray(c.sourceDeltas) || !Array.isArray(c.capabilityDeltas) ||
      !Array.isArray(c.identityCandidates) || !Array.isArray(c.evidenceIndex) ||
      !Array.isArray(c.coverage) || !c.summary || !c.limits ||
      !Array.isArray(c.errors) || !sha(c.reproducibilityDigest)) fail('INVALID_COMPARISON');
  const { reproducibilityDigest, ...body } = c;
  if (digest(body) !== reproducibilityDigest) fail('DIGEST_CONFLICT');
  const pins = new Set(c.sourcePins.map(p => p.pinId));
  if (!pins.has(c.targetPinId) || pins.size !== c.sourcePins.length ||
      c.coverage.length !== pins.size - 1) fail('COVERAGE_CONFLICT');
  for (const row of c.sourceDeltas) {
    if (!pins.has(row.originPinId) || !pins.has(row.targetPinId) ||
        !Array.isArray(row.targetPaths) || !Array.isArray(row.targetBlobs) ||
        row.targetPaths.length !== row.targetBlobs.length ||
        !Array.isArray(row.evidenceRefs) || !row.id || !row.state) fail('LOSSY_SOURCE_ROW');
    if (row.originPath && !row.originBlob) fail('LOSSY_ORIGIN_BLOB');
  }
  for (const row of c.coverage) if (!pins.has(row.sourcePinId) ||
    row.targetPinId !== c.targetPinId || !row.counts ||
    !Number.isSafeInteger(row.totalCompared)) fail('LOSSY_COVERAGE');
  return c;
}
export function projectIntegratedReport(comparison, options = {}) {
  const c = verifiedC(comparison);
  const candidatePath = new Map(c.identityCandidates.map(x => ['cap-' + x.id, x.originPath]));
  // E's native v1 aliases do not read C originPath/originBlob: bridge explicitly.
  const normalized = {
    ...c,
    sourceDeltas: c.sourceDeltas.map(r => ({
      ...r, sourcePinId: r.originPinId,
      sourcePath: r.originPath || r.targetPaths[0] || '[unprovided]',
      sourceBlob: r.originBlob || null,
      category: r.state,
      certainty: r.certainty === 'source_verified' ? 'confirmed' : r.certainty,
    })),
    capabilityDeltas: c.capabilityDeltas.map(r => ({
      ...r, sourcePinId: r.originPinId,
      sourcePath: candidatePath.get(r.id) || r.originPath || '[unprovided]',
      category: r.state,
      certainty: r.certainty === 'source_verified' ? 'confirmed' : r.certainty,
    })),
  };
  const view = projectVersionComparison(normalized, options);
  // The full C envelope, donor coverage, candidate details, and error/limit
  // semantics remain accessible; E's paginated view is not a replacement.
  return Object.freeze({
    schema: REPORT_BRIDGE_SCHEMA,
    sourceComparisonDigest: c.reproducibilityDigest,
    report: view, originalComparison: c,
    donorCoverage: c.coverage,
    identityCandidates: c.identityCandidates,
    sourceDeltas: c.sourceDeltas,
    capabilityDeltas: c.capabilityDeltas,
    evidenceIndex: c.evidenceIndex,
    limits: c.limits, errors: c.errors,
    status: c.limits.truncated || c.errors.length ||
      c.sourcePins.some(p => p.completeness !== 'complete')
      ? 'INCOMPLETE_SOURCE_EVIDENCE' : 'SOURCE_ONLY_UNVERIFIED',
    runtimeAccepted: false,
  });
}
