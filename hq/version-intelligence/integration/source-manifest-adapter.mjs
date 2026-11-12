/**
 * G1 explicit immutable A -> C bridge. Never alias the native A digest as C's.
 * The complete native A manifest is returned separately, not silently discarded.
 * No Git, filesystem, network, Host or effect access here.
 */
import { manifestDigestOf } from '../sources/snapshots.mjs';
import { MANIFEST_SCHEMA as A_SCHEMA, SOURCE_SCHEMA as A_PIN_SCHEMA, safePath, sensitivePath, canonicalRepo, digest } from '../sources/common.mjs';
import { MANIFEST_SCHEMA as C_SCHEMA, digestManifest } from '../compare/index.mjs';

export const SOURCE_BRIDGE_SCHEMA = 'arbor.hvi.adapter.source-manifest/1';
function reject(code, why) {
  const e = new Error('HVI_BRIDGE_' + code + ': ' + why); e.code = code; throw e;
}
const sha40 = v => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const sha64 = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const BLOCKED_PART = /^(?:\.env[^/]*|\.npmrc|\.netrc|\.pypirc|\.ssh|secrets?|credentials?(?:\.[^/]*)?|tokens?(?:\.[^/]*)?|cookies?(?:\.[^/]*)?|login[ -]?data|session(?:\.[^/]*)?|storage-state\.json|release-profile\.json|private|personal|profiles?|.*\.(?:pem|p12|pfx|key|keystore))$/i;
const restricted = name => sensitivePath(name) || name.split('/').some(part => BLOCKED_PART.test(part));

/** Input must be an actual Lane-A snapshotAt result, including its pinned source. */
export function bridgeSourceManifest(native) {
  if (!native || native.schema !== A_SCHEMA || !Array.isArray(native.entries) ||
      !native.pin || native.pin.schema !== A_PIN_SCHEMA) reject('INCOMPLETE_SCAN', 'native_manifest_required');
  const p = native.pin;
  if (p.scope !== 'development' || p.provider !== 'github') reject('SOURCE_UNAUTHORIZED', 'development_only');
  if (canonicalRepo(p.repoIdentity, p.provider) !== p.repoIdentity) reject('ID_CONFLICT', 'noncanonical_repo');
  safePath(p.subPath || '', { allowEmpty: true });
  const expectedPinId = digest({ provider: p.provider, repoIdentity: p.repoIdentity,
    commitSha: p.resolvedCommitSha, subPath: p.subPath || '' });
  if (p.pinId !== expectedPinId) reject('ID_CONFLICT', 'pin_identity_not_derived_from_revision');
  if (!sha40(p.resolvedCommitSha) || !sha40(p.rootTreeSha) || !sha64(p.pinId) ||
      !sha64(native.manifestDigest)) reject('PIN_NOT_FOUND', 'native_sha');
  if (native.pinId !== p.pinId || native.repoIdentity !== p.repoIdentity ||
      native.resolvedCommitSha !== p.resolvedCommitSha ||
      native.rootTreeSha !== p.rootTreeSha || (native.subPath || '') !== (p.subPath || '')) {
    reject('ID_CONFLICT', 'native_pin_binding');
  }
  if (native.completeness !== p.completeness ||
      !['complete','partial','blocked','missing'].includes(native.completeness) ||
      typeof native.truncated !== 'boolean' ||
      !Number.isSafeInteger(native.observedEntries) ||
      native.observedEntries !== native.entries.length ||
      !Number.isSafeInteger(native.omittedMinimum) || native.omittedMinimum < 0 ||
      !Array.isArray(native.errors) || native.entries.length > 50000) reject('INCOMPLETE_SCAN', 'native_coverage');
  if (native.truncated && native.completeness === 'complete') reject('INCOMPLETE_SCAN', 'false_completeness');
  const aDigest = manifestDigestOf(native);
  if (aDigest !== native.manifestDigest || p.manifestDigest !== aDigest) reject('DIGEST_CONFLICT', 'native_digest');
  let previous = null, redacted = 0;
  const entries = [];
  for (const original of native.entries) {
    if (!original || typeof original !== 'object') reject('INCOMPLETE_SCAN', 'entry_shape');
    const name = safePath(original.path);
    if (previous !== null && cmp(previous, name) >= 0) reject('ID_CONFLICT', 'unsorted_or_duplicate_entry');
    previous = name;
    if (!sha40(original.blobSha) || !/^[0-7]{6}$/.test(original.mode) ||
        !['file','symlink','submodule'].includes(original.kind)) reject('INCOMPLETE_SCAN', 'native_entry');
    if (original.excludedReason && !['sensitive_path','large_blob'].includes(original.excludedReason)) reject('INCOMPLETE_SCAN', 'unknown_exclusion');
    if (!['gitlink_only','uninspected','symlink_metadata','lfs_pointer','binary','text','oversized','inspection_deferred'].includes(original.parseStatus)) reject('INCOMPLETE_SCAN', 'unknown_parse_status');
    if (restricted(name)) { redacted++; continue; }
    const unsupported = original.kind === 'symlink' ? 'SYMLINK_NOT_FOLLOWED'
      : original.kind === 'submodule' ? 'SUBMODULE_NOT_FOLLOWED'
      : original.parseStatus === 'lfs_pointer' ? 'LFS_POINTER_NOT_CONTENT'
      : original.parseStatus === 'binary' ? 'BINARY_NOT_INTERPRETED' : null;
    // Keep all harmless native metadata in the separately versioned C projection.
    entries.push({ path: name, mode: original.mode, blobSha: original.blobSha,
      kind: original.kind, capabilityIds: [], excludedReason: original.excludedReason || unsupported,
      nativeMetadata: { bytes: original.bytes, parseStatus: original.parseStatus,
        symlinkTarget: original.kind === 'symlink' ? null : original.symlinkTarget,
        exclusion: original.excludedReason || null } });
  }
  const incomplete = native.completeness !== 'complete' || native.truncated || redacted > 0;
  const completeness = incomplete ? 'partial' : 'complete';
  const truncated = native.truncated || redacted > 0;
  const manifest = { schema: C_SCHEMA, pinId: p.pinId, completeness, truncated, entries,
    digest: null, sourceManifest: { schema: A_SCHEMA, digest: aDigest,
      observedEntries: native.observedEntries, omittedMinimum: native.omittedMinimum,
      policyOmissions: redacted, sourceErrors: native.errors } };
  // C's digest covers the normalized projection body, not the original A bytes.
  manifest.digest = digestManifest(manifest);
  if (!sha64(manifest.digest)) reject('DIGEST_CONFLICT', 'projection_digest');
  const pin = Object.freeze({ ...p, completeness, manifestDigest: manifest.digest });
  const receipt = Object.freeze({ schema: SOURCE_BRIDGE_SCHEMA, aDigest,
    cProjectionDigest: manifest.digest, pinId: p.pinId, repoIdentity: p.repoIdentity,
    commitSha: p.resolvedCommitSha, rootTreeSha: p.rootTreeSha,
    transformVersion: SOURCE_BRIDGE_SCHEMA, policyOmissions: redacted,
    observedEntries: native.observedEntries, projectedEntries: entries.length,
    completeness, truncated, losses: [] });
  return Object.freeze({ pin, manifest: Object.freeze(manifest),
    receipt, nativeManifest: native });
}

export function bridgeSourceManifests(manifests) {
  if (!Array.isArray(manifests) || manifests.length < 2 || manifests.length > 16) {
    reject('RESOURCE_LIMIT', 'expected_2_to_16');
  }
  const out = manifests.map(bridgeSourceManifest), ids = new Set(), revisions = new Map();
  for (const x of out) {
    const key = x.pin.repoIdentity + '@' + x.pin.resolvedCommitSha;
    const prior = revisions.get(key);
    if (prior && (prior.aDigest !== x.receipt.aDigest ||
      prior.cProjectionDigest !== x.receipt.cProjectionDigest ||
      prior.tree !== x.pin.rootTreeSha)) reject('DIGEST_CONFLICT', 'same_revision_conflicting_source');
    revisions.set(key, { aDigest: x.receipt.aDigest,
      cProjectionDigest: x.receipt.cProjectionDigest, tree: x.pin.rootTreeSha });
    if (ids.has(x.pin.pinId)) reject('ID_CONFLICT', 'duplicate_pin');
    ids.add(x.pin.pinId);
  }
  return out;
}
