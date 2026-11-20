# File: hq/version-intelligence/integration/source-manifest-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/integration/source-manifest-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7440 B |
| Lines | 109 |
| Hash | eede162eb9e2 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SOURCE_BRIDGE_SCHEMA | const | 10 | yes | export const SOURCE_BRIDGE_SCHEMA = &#39;arbor.hvi.adapter.source-manifest/1&#39;; |
| reject | function | 11 | no | function reject(code, why) { |
| e | const | 12 | no | const e = new Error(&#39;HVI_BRIDGE_&#39; + code + &#39;: &#39; + why); e.code = code; throw e; |
| sha40 | function | 14 | no | const sha40 = v =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-f0-9]{40}$/.test(v); |
| sha64 | function | 15 | no | const sha64 = v =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(v); |
| cmp | function | 16 | no | const cmp = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0; |
| BLOCKED_PART | const | 17 | no | const BLOCKED_PART = /^(?:\\.env[^/]*\|\\.npmrc\|\\.netrc\|\\.pypirc\|\\.ssh\|secrets?\|credentials?(?:\\.[^/]*)?\|tokens?(?:\\.[^/]*)?\|cookies?(?:\\.[^/]*)?\|login[ -]?data\|session(?:\\.[^/]*)?\|storage-state\\.json\|r… |
| restricted | function | 18 | no | const restricted = name =&gt; sensitivePath(name) \|\| name.split(&#39;/&#39;).some(part =&gt; BLOCKED_PART.test(part)); |
| bridgeSourceManifest | function | 21 | yes | export function bridgeSourceManifest(native) { |
| p | const | 24 | no | const p = native.pin; |
| expectedPinId | const | 28 | no | const expectedPinId = digest({ provider: p.provider, repoIdentity: p.repoIdentity, commitSha: p.resolvedCommitSha, subPath: p.subPath \|\| &#39;&#39; }); |
| aDigest | const | 46 | no | const aDigest = manifestDigestOf(native); |
| previous | variable | 48 | no | let previous = null, redacted = 0; |
| entries | const | 49 | no | const entries = []; |
| name | const | 52 | no | const name = safePath(original.path); |
| unsupported | const | 60 | no | const unsupported = original.kind === &#39;symlink&#39; ? &#39;SYMLINK_NOT_FOLLOWED&#39; |
| incomplete | const | 71 | no | const incomplete = native.completeness !== &#39;complete&#39; \|\| native.truncated \|\| redacted &gt; 0; |
| completeness | const | 72 | no | const completeness = incomplete ? &#39;partial&#39; : &#39;complete&#39;; |
| truncated | const | 73 | no | const truncated = native.truncated \|\| redacted &gt; 0; |
| manifest | const | 74 | no | const manifest = { schema: C_SCHEMA, pinId: p.pinId, completeness, truncated, entries, |
| pin | const | 81 | no | const pin = Object.freeze({ ...p, completeness, manifestDigest: manifest.digest }); |
| receipt | const | 82 | no | const receipt = Object.freeze({ schema: SOURCE_BRIDGE_SCHEMA, aDigest, cProjectionDigest: manifest.digest, pinId: p.pinId, repoIdentity: p.repoIdentity, commitSha: p.resolvedCommitSha, rootTreeSha: p… |
| bridgeSourceManifests | function | 92 | yes | export function bridgeSourceManifests(manifests) { |
| out | const | 96 | no | const out = manifests.map(bridgeSourceManifest), ids = new Set(), revisions = new Map(); |
| key | const | 98 | no | const key = x.pin.repoIdentity + &#39;@&#39; + x.pin.resolvedCommitSha; |
| prior | const | 99 | no | const prior = revisions.get(key); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../sources/snapshots.mjs | import | 6 | [hq/version-intelligence/sources/snapshots.mjs](../sources/snapshots.mjs.md) |
| ../sources/common.mjs | import | 7 | [hq/version-intelligence/sources/common.mjs](../sources/common.mjs.md) |
| ../compare/index.mjs | import | 8 | [hq/version-intelligence/compare/index.mjs](../compare/index.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/version-intelligence/integration/index.mjs](./index.mjs.md) | ./source-manifest-adapter.mjs |
| [tests/hq-version-intelligence/g1-v2-schema.test.mjs](../../../tests/hq-version-intelligence/g1-v2-schema.test.mjs.md) | ../../hq/version-intelligence/integration/source-manifest-adapter.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../hq/version-intelligence/integration/source-manifest-adapter.mjs |
| [tests/hq-version-intelligence/integrated-nway.test.mjs](../../../tests/hq-version-intelligence/integrated-nway.test.mjs.md) | ../../hq/version-intelligence/integration/source-manifest-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
