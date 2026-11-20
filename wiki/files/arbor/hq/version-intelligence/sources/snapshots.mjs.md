# File: hq/version-intelligence/sources/snapshots.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/sources/snapshots.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17163 B |
| Lines | 358 |
| Hash | c3e383a0f053 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_LIMITS | const | 9 | yes | export const DEFAULT_LIMITS = Object.freeze({ maxEntries: 50000, maxPages: 1000, pageSize: 500, maxDepth: 64, maxBlobBytes: 1500000, maxInspectBytes: 4096, maxInspectTotalBytes: 4000000, }); |
| limitsFor | function | 14 | no | function limitsFor(input = {}) { |
| out | const | 15 | no | const out = {}; |
| raw | const | 17 | no | const raw = input[name] ?? ceiling; |
| authorized | function | 23 | no | async function authorized(adapter, authorize, operation, scope, context = {}) { |
| checkPin | function | 35 | no | function checkPin(pin) { |
| expected | const | 45 | no | const expected = digest({ provider: pin.provider, repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha, subPath: pin.subPath \|\| &#39;&#39;, }); |
| commitAt | function | 52 | no | async function commitAt(pin, adapter) { |
| commit | const | 53 | no | const commit = await adapter.readCommit({ repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha, }); |
| resolvePin | function | 66 | yes | export async function resolvePin(source, { adapter, authorize, acquiredAt } = {}) { |
| provider | const | 67 | no | const provider = source?.provider; |
| repoIdentity | const | 68 | no | const repoIdentity = canonicalRepo(source?.repo, provider); |
| requestedRef | const | 71 | no | const requestedRef = source.ref == null ? null : safeRef(source.ref); |
| specifiedSha | const | 72 | no | const specifiedSha = source.sha == null ? null : assertSha(source.sha); |
| subPath | const | 74 | no | const subPath = safePath(source.subPath ?? &#39;&#39;, { allowEmpty: true }); |
| refCommit | const | 75 | no | const refCommit = requestedRef |
| resolvedCommitSha | const | 79 | no | const resolvedCommitSha = assertSha(requestedRef ? refCommit.commitSha : specifiedSha); |
| commit | const | 81 | no | const commit = await adapter.readCommit({ repoIdentity, commitSha: resolvedCommitSha }); |
| rootTreeSha | const | 83 | no | const rootTreeSha = assertSha(commit.treeSha); |
| pinId | const | 84 | no | const pinId = digest({ provider, repoIdentity, commitSha: resolvedCommitSha, subPath }); |
| verifyPin | function | 99 | yes | export async function verifyPin(pin, { adapter, authorize, manifest, checkRef = true } = {}) { |
| tip | const | 106 | no | const tip = await adapter.resolveRef({ repoIdentity: pin.repoIdentity, ref: pin.requestedRef }); |
| actual | const | 113 | no | const actual = manifestDigestOf(manifest); |
| acquirePinnedSnapshot | function | 128 | yes | export async function acquirePinnedSnapshot(source, { adapter, authorize, approvedRepositories, limits, inspectContent = false, signal, acquiredAt, } = {}) { |
| provider | const | 134 | no | const provider = source?.provider ?? &#39;github&#39;; |
| repoIdentity | const | 135 | no | const repoIdentity = canonicalRepo(source?.repo, provider); |
| approved | const | 136 | no | const approved = approvedRepositories.map(repo =&gt; canonicalRepo(repo, provider)); |
| pin | const | 139 | no | const pin = await resolvePin({ ...source, provider, repoIdentity, approvedScope: &#39;development&#39; }, { adapter, authorize, acquiredAt }); |
| manifest | const | 143 | no | const manifest = await snapshotAt(pin, { adapter, authorize, limits, inspectContent, signal }); |
| normalizedEntry | function | 158 | no | function normalizedEntry(record, pin, lim) { |
| path | const | 159 | no | const path = safePath(record?.path); |
| mode | const | 163 | no | const mode = String(record.mode \|\| &#39;&#39;); |
| kind | const | 164 | no | const kind = record.type === &#39;commit&#39; &amp;&amp; mode === &#39;160000&#39; ? &#39;submodule&#39; |
| blobSha | const | 169 | no | const blobSha = assertSha(record.sha); |
| bytes | const | 170 | no | const bytes = record.size === undefined \|\| record.size === null ? null : record.size; |
| manifestPayload | function | 181 | no | function manifestPayload(manifest) { |
| manifestDigestOf | function | 197 | yes | export function manifestDigestOf(manifest) { return digest(manifestPayload(manifest)); } |
| note | function | 198 | no | function note(errors, code, detail) { |
| bufferFrom | function | 201 | no | function bufferFrom(value) { |
| readVerifiedBlob | function | 206 | no | async function readVerifiedBlob(adapter, pin, sha, maxBytes) { |
| raw | const | 207 | no | const raw = bufferFrom(await adapter.readBlob({ repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha, blobSha: sha, maxBytes, })); |
| inspect | function | 215 | no | function inspect(entry, data) { |
| snapshotAt | function | 233 | yes | export async function snapshotAt(pin, { adapter, authorize, limits = {}, inspectContent = false, signal, } = {}) { |
| lim | const | 241 | no | const lim = limitsFor(limits); |
| entries | const | 242 | no | const entries = new Map(); |
| errors | const | 243 | no | const errors = []; |
| cursors | const | 244 | no | const cursors = new Set(); |
| pages | variable | 245 | no | let pages = 0, omittedMinimum = 0, inspectBytes = 0, cursor = null, truncated = false; |
| page | variable | 256 | no | let page; |
| entry | const | 274 | no | const entry = normalizedEntry(page.entries[i], pin, lim); |
| data | const | 294 | no | const data = await readVerifiedBlob(adapter, pin, entry.blobSha, lim.maxInspectBytes); |
| ordered | const | 317 | no | const ordered = [...entries.values()].sort((a, b) =&gt; a.path &lt; b.path ? -1 : a.path &gt; b.path ? 1 : 0); |
| completeness | const | 319 | no | const completeness = truncated ? &#39;partial&#39; : &#39;complete&#39;; |
| manifest | const | 320 | no | const manifest = { |
| readPinnedBlob | function | 336 | yes | export async function readPinnedBlob(pin, path, { adapter, authorize, manifest, maxBytes = DEFAULT_LIMITS.maxBlobBytes, } = {}) { |
| rel | const | 348 | no | const rel = safePath(path); |
| entry | const | 349 | no | const entry = manifest.entries.find(e =&gt; e.path === rel); |
| bytes | const | 355 | no | const bytes = await readVerifiedBlob(adapter, pin, entry.blobSha, maxBytes); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./common.mjs | import | 3 | [hq/version-intelligence/sources/common.mjs](./common.mjs.md) |
| ./adapters.mjs | import | 7 | [hq/version-intelligence/sources/adapters.mjs](./adapters.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/hvi-capability.mjs](../../../apps/vivim-host/control/hvi-capability.mjs.md) | ../../../hq/version-intelligence/sources/snapshots.mjs |
| [hq/test/hvi-live-source-composition.test.mjs](../../test/hvi-live-source-composition.test.mjs.md) | ../version-intelligence/sources/snapshots.mjs |
| [hq/test/hvi-mcp-tool.test.mjs](../../test/hvi-mcp-tool.test.mjs.md) | ../version-intelligence/sources/snapshots.mjs |
| [hq/version-intelligence/integration/index.mjs](../integration/index.mjs.md) | ../sources/snapshots.mjs |
| [hq/version-intelligence/integration/source-manifest-adapter.mjs](../integration/source-manifest-adapter.mjs.md) | ../sources/snapshots.mjs |
| [hq/version-intelligence/sources/index.mjs](./index.mjs.md) | ./snapshots.mjs |
| [hq/version-intelligence/sources/snapshots.test.mjs](./snapshots.test.mjs.md) | ./snapshots.mjs |
| [tests/hq-version-intelligence/g1-v2-schema.test.mjs](../../../tests/hq-version-intelligence/g1-v2-schema.test.mjs.md) | ../../hq/version-intelligence/sources/snapshots.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../hq/version-intelligence/sources/snapshots.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../hq/version-intelligence/sources/snapshots.mjs |
| [tests/hq-version-intelligence/integrated-nway.test.mjs](../../../tests/hq-version-intelligence/integrated-nway.test.mjs.md) | ../../hq/version-intelligence/sources/snapshots.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// HVI Lane A: deterministic, read-only, immutable Git-object snapshots.
// No working-tree HEAD, Git CLI, checkout, automatic network or effect authority.
import {
  SOURCE_SCHEMA, MANIFEST_SCHEMA, assertSha, canonicalRepo, safePath, safeRef,
  digest, gitBlobSha, sensitivePath, checkCancel, fail, SourceError,
} from './common.mjs';
import { assertVerifiedAdapter } from './adapters.mjs';

export const DEFAULT_LIMITS = Object.freeze({
  maxEntries: 50000, maxPages: 1000, pageSize: 500, maxDepth: 64,
  maxBlobBytes: 1500000, maxInspectBytes: 4096, maxInspectTotalBytes: 4000000,
});

function limitsFor(input = {}) {
  const out = {};
  for (const [name, ceiling] of Object.entries(DEFAULT_LIMITS)) {
    const raw = input[name] ?? ceiling;
    if (!Number.isSafeInteger(raw) || raw < 1 || raw > ceiling) fail('RESOURCE_LIMIT', 'invalid_limit');
    out[name] = raw;
  }
  return out;
}
async function authorized(adapter, authorize, operation, scope, context = {}) {
  if (scope !== 'development' || typeof authorize !== 'function') {
    fail('SOURCE_UNAUTHORIZED', 'development_grant_required');
  }
  // A partial or caller-forged boolean adapter is never authority.
  assertVerifiedAdapter(adapter);
  // It is the trusted caller's responsibility to re-evaluate live Host grants.
  // No cached boolean grants or source registry records constitute permission.
  if (await authorize({ operation, scope: 'development', ...context }) !== true) {
    fail('SOURCE_UNAUTHORIZED', 'grant_denied');
  }
}
function checkPin(pin) {
  if (pin?.schema !== SOURCE_SCHEMA || pin.scope !== 'development' ||
      pin.provider !== 'github') fail('SOURCE_UNAUTHORIZED', 'invalid_pin');
  if (canonicalRepo(pin.repoIdentity, pin.provider) !== pin.repoIdentity) {
    fail('ID_CONFLICT', 'noncanonical_repo_identity');
  }
  assertSha(pin.resolvedCommitSha);
  assertSha(pin.rootTreeSha);
  safePath(pin.subPath ?? '', { allowEmpty: true });
  if (pin.requestedRef !== null && pin.requestedRef !== undefined) safeRef(pin.requestedRef);
  const expected = digest({
    provider: pin.provider, repoIdentity: pin.repoIdentity,
    commitSha: pin.resolvedCommitSha, subPath: pin.subPath || '',
  });
  if (pin.pinId !== expected) fail('ID_CONFLICT', 'pin_identity_mismatch');
  return pin;
}
async function commitAt(pin, adapter) {
  const commit = await adapter.readCommit({
    repoIdentity: pin.repoIdentity, commitSha: pin.resolvedCommitSha,
  });
  if (!commit || commit.sha !== pin.resolvedCommitSha ||
      commit.treeSha !== pin.rootTreeSha) fail('PIN_MOVED', 'commit_tree_mismatch');
  return commit;
}

/**
 * resolvePin(source, {adapter, authorize}) freezes a single authorized ref.
 * Adapters MUST read verified committed Git objects and resolve refs once.
 * source = {repo, provider:'github', ref|sha, subPath?, approvedScope:'development'}
 */
export async function resolvePin(source, { adapter, authorize, acquiredAt } = {}) {
  const provider = source?.provider;
  const repoIdentity = canonicalRepo(source?.repo, provider);
  await authorized(adapter, authorize, 'source.pin.resolve', source?.approvedScope,
    { repoIdentity, sourceGrantRef: source.sourceGrantRef ?? null });
  const requestedRef = source.ref == null ? null : safeRef(source.ref);
  const specifiedSha = source.sha == null ? null : assertSha(source.sha);
  if (!requestedRef && !specifiedSha) fail('PIN_NOT_FOUND', 'ref_or_sha_required');
  const subPath = safePath(source.subPath ?? '', { allowEmpty: true });
  const refCommit = requestedRef
    ? await adapter.resolveRef({ repoIdentity, ref: requestedRef })
    : null;
  if (requestedRef && !refCommit?.commitSha) fail('PIN_NOT_FOUND', 'ref_unavailable');
  const resolvedCommitSha = assertSha(requestedRef ? refCommit.commitSha : specifiedSha);
  if (specifiedSha && resolvedCommitSha !== specifiedSha) fail('PIN_MOVED', 'ref_changed_from_expected_sha');
```

_First 80 of 359 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
