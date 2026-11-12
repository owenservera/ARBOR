/**
 * ARBOR HVI Lane C: deterministic, source-only 2..N pinned manifest comparator.
 * No network, filesystem, writes, effects, graph authority, or remote code execution.
 * Snapshot acquisition belongs to Lane A; source/capability crosswalk to Lane B;
 * runtime/Host claims belong to later reviewed owners.
 */
import { createHash } from 'node:crypto';
import { sensitivePath } from '../sources/common.mjs';

export const COMPARISON_SCHEMA = 'arbor.hvi.version-comparison/1';
export const MANIFEST_SCHEMA = 'arbor.hvi.source-manifest/1';
export const SOURCE_STATES = Object.freeze([
  'EXACT_BLOB', 'SAME_PATH_CHANGED', 'EXACT_RELOCATION', 'SPLIT_CANDIDATE',
  'COMBINE_CANDIDATE', 'SIMILARITY_CANDIDATE', 'MISSING_AT_TARGET',
  'NEW_AT_TARGET', 'UNOBSERVABLE',
]);
const HEX40 = /^[a-f0-9]{40}$/;
const HEX64 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/;
const UNSAFE = /^(?:\.env[^/]*|.*\.env|.*\.(?:pem|p12|keystore)|cookies|login data|session\.json|storage-state\.json|release-profile\.json)$/i;
const COMPLETENESS = new Set(['complete', 'partial', 'blocked', 'missing']);
const DEFAULT_LIMITS = Object.freeze({ maxPins: 16, maxEntries: 100_000, maxFindings: 20_000, maxPairs: 120 });

export class HviCompareError extends Error {
  constructor(code, detail = '') {
    super(code + (detail ? ': ' + detail : ''));
    this.name = 'HviCompareError';
    this.code = code;
  }
}
const fail = (code, detail) => { throw new HviCompareError(code, detail); };
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const ordered = (rows, selector) => [...rows].sort((a, b) => cmp(selector(a), selector(b)));
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') {
    const out = {};
    for (const key of Object.keys(v).sort()) {
      if (v[key] !== undefined) out[key] = canonical(v[key]);
    }
    return out;
  }
  return v;
}
const hash = (v) => createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
function requiredId(v, label = 'id') {
  if (typeof v !== 'string' || !SAFE_ID.test(v) || v.includes('..')) fail('ID_CONFLICT', label);
  return v;
}
function hex(v, label, size = 40) {
  if (typeof v !== 'string' || !(size === 40 ? HEX40 : HEX64).test(v)) fail('PIN_NOT_FOUND', label);
  return v;
}
function path(v) {
  if (typeof v !== 'string' || !v || v.length > 1024 || v.startsWith('/') || v.includes('\\') || /[\x00-\x1f]/.test(v) || v.split('/').some(x => !x || x === '.' || x === '..')) fail('SCOPE_ESCAPE', 'invalid path');
  if (sensitivePath(v) || v.split('/').some(x => UNSAFE.test(x))) fail('SOURCE_UNAUTHORIZED', 'restricted path');
  return v;
}
function bounded(v, fallback, maximum) {
  if (v === undefined) return fallback;
  if (!Number.isSafeInteger(v) || v < 1 || v > maximum) fail('RESOURCE_LIMIT', 'invalid bound');
  return v;
}
function assertNotCancelled(signal) {
  if (signal?.aborted === true) fail('RESOURCE_LIMIT', 'cancelled');
}

/** Digest over the normalized manifest body, independent of incoming entry order. */
export function digestManifest({ schema = MANIFEST_SCHEMA, pinId, completeness = 'complete', entries = [], truncated = false } = {}) {
  if (schema !== MANIFEST_SCHEMA || !Array.isArray(entries)) fail('INCOMPLETE_SCAN', 'manifest schema');
  return hash({ schema, pinId, completeness, truncated, entries: ordered(entries, e => e.path) });
}
function validatePin(p) {
  if (!p || typeof p !== 'object') fail('PIN_NOT_FOUND', 'pin required');
  const pinId = requiredId(p.pinId, 'pinId');
  const repoIdentity = requiredId(p.repoIdentity, 'repoIdentity');
  const provider = requiredId(p.provider, 'provider');
  if (p.scope !== 'development') fail('SOURCE_UNAUTHORIZED', 'development only');
  const resolvedCommitSha = hex(p.resolvedCommitSha, 'commit sha');
  const rootTreeSha = hex(p.rootTreeSha, 'tree sha');
  const manifestDigest = hex(p.manifestDigest, 'manifest digest', 64);
  if (!COMPLETENESS.has(p.completeness)) fail('INCOMPLETE_SCAN', 'pin completeness');
  return { pinId, provider, repoIdentity, resolvedCommitSha, rootTreeSha, manifestDigest, completeness: p.completeness, scope: 'development' };
}
function validateEntry(e) {
  if (!e || typeof e !== 'object') fail('INCOMPLETE_SCAN', 'manifest entry');
  const name = path(e.path);
  if (!/^[0-7]{6}$/.test(e.mode ?? '100644')) fail('INCOMPLETE_SCAN', 'entry mode');
  const kind = e.kind ?? 'file';
  if (!['file', 'symlink', 'submodule', 'binary', 'lfs-pointer', 'unknown'].includes(kind)) fail('INCOMPLETE_SCAN', 'kind');
  if (e.blobSha !== undefined && e.blobSha !== null) hex(e.blobSha, 'entry blob');
  if (!e.blobSha && !e.excludedReason) fail('INCOMPLETE_SCAN', 'missing blob');
  const capabilities = e.capabilityIds ?? [];
  if (!Array.isArray(capabilities) || capabilities.length > 64) fail('RESOURCE_LIMIT', 'capability IDs');
  const capabilityIds = [...new Set(capabilities.map(x => requiredId(x, 'capabilityId')))].sort(cmp);
  return { path: name, mode: e.mode ?? '100644', kind, blobSha: e.blobSha ?? null,
    capabilityIds, excludedReason: e.excludedReason ? 'NOT_OBSERVABLE' : null };
}
function validateManifest(manifest, pin, maxEntries) {
  if (!manifest || manifest.schema !== MANIFEST_SCHEMA || manifest.pinId !== pin.pinId || !Array.isArray(manifest.entries)) fail('INCOMPLETE_SCAN', 'manifest adapter missing or incompatible');
  if (!COMPLETENESS.has(manifest.completeness) || manifest.completeness !== pin.completeness) fail('INCOMPLETE_SCAN', 'completeness mismatch');
  if (typeof manifest.truncated !== 'boolean') fail('INCOMPLETE_SCAN', 'explicit truncated required');
  if (manifest.entries.length > maxEntries) fail('RESOURCE_LIMIT', 'manifest entries');
  const entries = ordered(manifest.entries.map(validateEntry), x => x.path);
  for (let i = 1; i < entries.length; i++) if (entries[i - 1].path === entries[i].path) fail('ID_CONFLICT', 'duplicate manifest path');
  const digest = digestManifest({ pinId: pin.pinId, completeness: manifest.completeness,
    truncated: manifest.truncated, entries: manifest.entries });
  if (manifest.digest !== digest || pin.manifestDigest !== digest) fail('DIGEST_CONFLICT', 'manifest digest');
  return { ...pin, entries, complete: pin.completeness === 'complete' && !manifest.truncated,
    truncated: manifest.truncated };
}
function evidence(pin, e) {
  if (!e?.blobSha) return { id: 'git:' + pin.repoIdentity + '@' + pin.resolvedCommitSha + ':' + e.path, type: 'source_blob',
    repo: pin.repoIdentity, commitSha: pin.resolvedCommitSha, path: e.path, blobSha: null };
  return { id: 'git:' + pin.repoIdentity + '@' + pin.resolvedCommitSha + ':' + e.path + '#' + e.blobSha,
    type: 'source_blob', repo: pin.repoIdentity, commitSha: pin.resolvedCommitSha, path: e.path, blobSha: e.blobSha };
}
function scopePrefixes(scope) {
  if (scope === undefined || scope === null) return [''];
  const prefixes = scope.prefixes ?? [''];
  if (!Array.isArray(prefixes) || prefixes.length < 1 || prefixes.length > 32) fail('SCOPE_ESCAPE', 'invalid prefixes');
  return [...new Set(prefixes.map(s => {
    if (s === '') return '';
    return path(s.endsWith('/') ? s.slice(0, -1) : s) + '/';
  }))].sort(cmp);
}
const inScope = (name, prefixes) => prefixes.some(p => !p || name.startsWith(p));
const observable = e => Boolean(e?.blobSha) && !e.excludedReason && !['unknown'].includes(e.kind);
const sourceKey = p => p.repoIdentity + '@' + p.resolvedCommitSha;

/** Source identity hints are not semantic-equivalence decisions. Every ambiguous row stays review-required. */
function classify(origin, same, blobMatches, candidateMatches, bothComplete) {
  if (!observable(origin)) return { state: 'UNOBSERVABLE', matched: [] };
  if (same) {
    if (!observable(same)) return { state: 'UNOBSERVABLE', matched: [same] };
    return { state: same.blobSha === origin.blobSha && same.mode === origin.mode && same.kind === origin.kind ? 'EXACT_BLOB' : 'SAME_PATH_CHANGED', matched: [same] };
  }
  if (blobMatches.length) return { state: 'EXACT_RELOCATION', matched: blobMatches };
  if (!bothComplete) return { state: 'UNOBSERVABLE', matched: candidateMatches };
  if (candidateMatches.length > 1) return { state: 'SPLIT_CANDIDATE', matched: candidateMatches };
  if (candidateMatches.length === 1) return { state: 'SIMILARITY_CANDIDATE', matched: candidateMatches };
  return { state: 'MISSING_AT_TARGET', matched: [] };
}
function row(source, target, originEntry, targets, state) {
  const targetPaths = targets.map(x => x.path).sort(cmp);
  const refs = [originEntry && evidence(source, originEntry), ...targets.map(e => evidence(target, e))].filter(Boolean);
  const stableKey = { source: sourceKey(source), target: sourceKey(target), originPath: originEntry?.path ?? null, targetPaths, state };
  return { id: 'src-' + hash(stableKey).slice(0, 24), originPinId: source.pinId, targetPinId: target.pinId,
    originRepo: source.repoIdentity, originSha: source.resolvedCommitSha, originPath: originEntry?.path ?? null,
    originBlob: originEntry?.blobSha ?? null, targetPaths, targetBlobs: targets.map(x => x.blobSha),
    state, sourceLineage: state === 'EXACT_BLOB' || state === 'EXACT_RELOCATION' ? 'EXACT_BLOB_IDENTITY' : 'UNVERIFIED',
    certainty: state === 'UNOBSERVABLE' ? 'unknown' : state.includes('CANDIDATE') ? 'candidate' : 'source_verified',
    decision: 'REVIEW_REQUIRED', owner: 'HQ_REVIEW', evidenceRefs: refs.map(x => x.id).sort(cmp) };
}
function comparePair(source, target, prefixes, signal, emit, emitCandidate) {
  const left = source.entries.filter(e => inScope(e.path, prefixes));
  const right = target.entries.filter(e => inScope(e.path, prefixes));
  const byPath = new Map(right.map(e => [e.path, e]));
  const byBlob = new Map();
  for (const r of right) if (observable(r)) {
    if (!byBlob.has(r.blobSha)) byBlob.set(r.blobSha, []);
    byBlob.get(r.blobSha).push(r);
  }
  const used = new Set();
  const candidateContributors = new Map();
  const byCapability = new Map();
  for (const r of right) for (const id of r.capabilityIds) {
    if (!byCapability.has(id)) byCapability.set(id, new Set());
    byCapability.get(id).add(r.path);
  }
  for (const l of left) {
    const related = new Set(l.capabilityIds.flatMap(id => [...(byCapability.get(id) ?? [])]));
    for (const relatedPath of related) candidateContributors.set(relatedPath, (candidateContributors.get(relatedPath) ?? 0) + 1);
  }
  const counts = Object.fromEntries(SOURCE_STATES.map(s => [s, 0]));
  let observed = 0;
  for (const l of left) {
    assertNotCancelled(signal);
    const same = byPath.get(l.path);
    const relocation = same ? [] : (byBlob.get(l.blobSha) ?? []);
    const candidatePaths = new Set(l.capabilityIds.flatMap(id => [...(byCapability.get(id) ?? [])]));
    const candidates = same || relocation.length ? [] : [...candidatePaths].map(name => byPath.get(name)).sort((a,b) => cmp(a.path,b.path));
    const outcome = classify(l, same, relocation, candidates, source.complete && target.complete);
    let state = outcome.state;
    if (state === 'SIMILARITY_CANDIDATE' && candidateContributors.get(outcome.matched[0].path) > 1) state = 'COMBINE_CANDIDATE';
    const targets = outcome.matched;
    if (targets.length && !['UNOBSERVABLE'].includes(state)) for (const t of targets) used.add(t.path);
    if (state === 'SIMILARITY_CANDIDATE' || state === 'SPLIT_CANDIDATE' || state === 'COMBINE_CANDIDATE') {
      emitCandidate({ originPinId: source.pinId, targetPinId: target.pinId, originPath: l.path,
        targetPaths: targets.map(t => t.path), capabilityIds: l.capabilityIds.filter(id => targets.some(t => t.capabilityIds.includes(id))),
        verdict: 'REVIEW_REQUIRED', certainty: 'candidate', evidenceRefs: [evidence(source, l).id, ...targets.map(t => evidence(target, t).id)].sort(cmp) });
    }
    counts[state]++; observed++; emit(row(source, target, l, targets, state));
  }
  for (const r of right) {
    assertNotCancelled(signal);
    if (used.has(r.path)) continue;
    let state = source.complete && target.complete && observable(r) ? 'NEW_AT_TARGET' : 'UNOBSERVABLE';
    // A target file absent from the source cannot count as novel when either scan is incomplete.
    counts[state]++; observed++; emit(row(source, target, null, [r], state));
  }
  return { sourcePinId: source.pinId, targetPinId: target.pinId, sourceCompleteness: source.completeness,
    targetCompleteness: target.completeness, totalCompared: observed, counts };
}

/**
 * Pure N-way comparison of already-resolved sources. Input `manifests` is an array
 * from an injected, explicit Lane-A adapter: no implicit HEAD or Git checkout.
 * Comparator never treats candidate equivalence or file presence as runtime proof.
 */
export function comparePinned({ pins, manifests, targetPinId, pairwise = false, scope, budgets = {}, identityDecisions = [], signal } = {}) {
  if (!Array.isArray(pins) || pins.length < 2) fail('PIN_NOT_FOUND', '2..N immutable pins required');
  const limits = { maxPins: bounded(budgets.maxPins, DEFAULT_LIMITS.maxPins, 128),
    maxEntries: bounded(budgets.maxEntries, DEFAULT_LIMITS.maxEntries, 1_000_000),
    maxFindings: bounded(budgets.maxFindings, DEFAULT_LIMITS.maxFindings, 100_000),
    maxPairs: bounded(budgets.maxPairs, DEFAULT_LIMITS.maxPairs, 8128) };
  if (pins.length > limits.maxPins) fail('RESOURCE_LIMIT', 'pin count');
  if (pairwise !== true && pairwise !== false) fail('INCOMPLETE_SCAN', 'pairwise must be boolean');
  if (!Array.isArray(manifests) || manifests.length !== pins.length) fail('INCOMPLETE_SCAN', 'explicit manifests required');
  if (!Array.isArray(identityDecisions)) fail('EQUIVALENCE_UNPROVEN', 'identity decisions adapter');
  if (identityDecisions.some(x => x?.decision === 'equivalent' || x?.status === 'confirmed')) fail('EQUIVALENCE_UNPROVEN', 'unverified equivalence; G1 needs owner-authenticated decisions');
  if (identityDecisions.length) fail('EQUIVALENCE_UNPROVEN', 'decision verifier not supplied');
  const prefixes = scopePrefixes(scope);
  const cleanPins = ordered(pins.map(validatePin), x => x.pinId);
  const ids = new Set(), revisions = new Map();
  for (const p of cleanPins) {
    if (ids.has(p.pinId)) fail('ID_CONFLICT', 'duplicate pinId');
    ids.add(p.pinId);
    const rev = sourceKey(p), old = revisions.get(rev);
    if (old && (old.manifestDigest !== p.manifestDigest || old.rootTreeSha !== p.rootTreeSha)) fail('DIGEST_CONFLICT', 'same revision, different source');
    revisions.set(rev, p);
  }
  if (!ids.has(targetPinId)) fail('PIN_NOT_FOUND', 'targetPinId');
  const manifestMap = new Map();
  for (const m of manifests) {
    if (!m?.pinId || manifestMap.has(m.pinId)) fail('ID_CONFLICT', 'duplicate/unidentified manifest');
    manifestMap.set(m.pinId, m);
  }
  const all = cleanPins.map(p => validateManifest(manifestMap.get(p.pinId), p, limits.maxEntries));
  const totalEntries = all.reduce((n, p) => n + p.entries.length, 0);
  if (totalEntries > limits.maxEntries) fail('RESOURCE_LIMIT', 'total entries');
  const target = all.find(p => p.pinId === targetPinId);
  const evidenceMap = new Map(), deltas = [], candidates = [], pairResults = [];
  const pathMaps = new Map(all.map(p => [p.pinId, new Map(p.entries.map(e => [e.path, e]))]));
  let emitted = 0, candidateTotal = 0, findingsTotal = 0;
  const addEvidence = (r) => {
    for (const p of [all.find(x => x.pinId === r.originPinId), all.find(x => x.pinId === r.targetPinId)]) {
      const index = pathMaps.get(p.pinId);
      const entries = r.originPinId === p.pinId && r.originPath ? [index.get(r.originPath)] :
        r.targetPinId === p.pinId ? r.targetPaths.map(name => index.get(name)) : [];
      for (const e of entries.filter(Boolean)) { const ev = evidence(p, e); evidenceMap.set(ev.id, ev); }
    }
  };
  const push = (r, collection) => {
    findingsTotal++;
    if (emitted >= limits.maxFindings) return;
    collection.push(r); emitted++; addEvidence(r);
  };
  const pushCandidate = c => {
    candidateTotal++;
    if (candidates.length >= limits.maxFindings) return;
    candidates.push({ ...c, id: 'identity-' + hash(c).slice(0, 24) });
  };
  const coverage = [];
  for (const source of all) if (source.pinId !== targetPinId) {
    coverage.push(comparePair(source, target, prefixes, signal, r => push(r, deltas), pushCandidate));
  }
  if (pairwise) {
    const pairCount = all.length * (all.length - 1) / 2;
    if (pairCount > limits.maxPairs) fail('RESOURCE_LIMIT', 'pair count');
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const pairDeltas = [];
      const comparison = comparePair(all[i], all[j], prefixes, signal, r => push(r, pairDeltas), () => {});
      pairResults.push({ ...comparison, sourceDeltas: pairDeltas });
    }
  }
  const sortRows = rows => ordered(rows, x => x.id);
  const sourceDeltas = sortRows(deltas);
  const identityCandidates = sortRows(candidates);
  const summaryCounts = Object.fromEntries(SOURCE_STATES.map(s => [s, coverage.reduce((n, x) => n + x.counts[s], 0)]));
  const truncated = findingsTotal > emitted || candidateTotal > identityCandidates.length;
  const report = { schema: COMPARISON_SCHEMA, targetPinId,
    sourcePins: cleanPins, pairwise: pairwise ? pairResults : null, coverage,
    summary: { counts: summaryCounts, observedFindings: findingsTotal, emittedFindings: emitted,
      candidatesObserved: candidateTotal, semanticParity: 'UNVERIFIED', runtimeParity: 'UNVERIFIED' },
    sourceDeltas, capabilityDeltas: identityCandidates.map(c => ({ id: 'cap-' + c.id, capabilityIds: c.capabilityIds,
      originPinId: c.originPinId, targetPinId: c.targetPinId, state: 'UNKNOWN', certainty: 'candidate',
      decision: 'REVIEW_REQUIRED', owner: 'HQ_REVIEW', evidenceRefs: c.evidenceRefs })),
    identityCandidates, authorityConflicts: [],
    unported: sourceDeltas.filter(r => r.state === 'MISSING_AT_TARGET'), intentionallyExcluded: [],
    unobserved: sourceDeltas.filter(r => r.state === 'UNOBSERVABLE'), runtimeProof: [], mergePlan: [],
    evidenceIndex: sortRows([...evidenceMap.values()]),
    limits: { ...limits, totalEntries, truncated, omittedFindings: findingsTotal - emitted,
      omittedCandidates: candidateTotal - identityCandidates.length, scopedPrefixes: prefixes },
    errors: truncated ? [{ code: 'RESOURCE_LIMIT', message: 'report truncated; no missing-capability inference permitted' }] : [] };
  return { ...report, reproducibilityDigest: hash(report) };
}
