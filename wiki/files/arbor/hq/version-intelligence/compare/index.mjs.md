# File: hq/version-intelligence/compare/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/compare/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18773 B |
| Lines | 297 |
| Hash | 32d2984d65ff |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMPARISON_SCHEMA | const | 10 | yes | export const COMPARISON_SCHEMA = &#39;arbor.hvi.version-comparison/1&#39;; |
| MANIFEST_SCHEMA | const | 11 | yes | export const MANIFEST_SCHEMA = &#39;arbor.hvi.source-manifest/1&#39;; |
| SOURCE_STATES | const | 12 | yes | export const SOURCE_STATES = Object.freeze([ &#39;EXACT_BLOB&#39;, &#39;SAME_PATH_CHANGED&#39;, &#39;EXACT_RELOCATION&#39;, &#39;SPLIT_CANDIDATE&#39;, &#39;COMBINE_CANDIDATE&#39;, &#39;SIMILARITY_CANDIDATE&#39;, &#39;MISSING_AT_TARGET&#39;, &#39;NEW_AT_TARGET… |
| HEX40 | const | 17 | no | const HEX40 = /^[a-f0-9]{40}$/; |
| HEX64 | const | 18 | no | const HEX64 = /^[a-f0-9]{64}$/; |
| SAFE_ID | const | 19 | no | const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/; |
| UNSAFE | const | 20 | no | const UNSAFE = /^(?:\\.env[^/]*\|.*\\.env\|.*\\.(?:pem\|p12\|keystore)\|cookies\|login data\|session\\.json\|storage-state\\.json\|release-profile\\.json)$/i; |
| COMPLETENESS | const | 21 | no | const COMPLETENESS = new Set([&#39;complete&#39;, &#39;partial&#39;, &#39;blocked&#39;, &#39;missing&#39;]); |
| DEFAULT_LIMITS | const | 22 | no | const DEFAULT_LIMITS = Object.freeze({ maxPins: 16, maxEntries: 100_000, maxFindings: 20_000, maxPairs: 120 }); |
| HviCompareError | class | 24 | yes | export class HviCompareError extends Error { |
| constructor | method | 25 | yes | constructor(code, detail = &#39;&#39;) { |
| fail | function | 31 | no | const fail = (code, detail) =&gt; { throw new HviCompareError(code, detail); }; |
| cmp | function | 32 | no | const cmp = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0; |
| ordered | function | 33 | no | const ordered = (rows, selector) =&gt; [...rows].sort((a, b) =&gt; cmp(selector(a), selector(b))); |
| canonical | function | 34 | no | function canonical(v) { |
| out | const | 37 | no | const out = {}; |
| hash | function | 45 | no | const hash = (v) =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(v))).digest(&#39;hex&#39;); |
| requiredId | function | 46 | no | function requiredId(v, label = &#39;id&#39;) { |
| hex | function | 50 | no | function hex(v, label, size = 40) { |
| path | function | 54 | no | function path(v) { |
| bounded | function | 59 | no | function bounded(v, fallback, maximum) { |
| assertNotCancelled | function | 64 | no | function assertNotCancelled(signal) { |
| digestManifest | function | 69 | yes | export function digestManifest({ schema = MANIFEST_SCHEMA, pinId, completeness = &#39;complete&#39;, entries = [], truncated = false } = {}) { |
| validatePin | function | 73 | no | function validatePin(p) { |
| pinId | const | 75 | no | const pinId = requiredId(p.pinId, &#39;pinId&#39;); |
| repoIdentity | const | 76 | no | const repoIdentity = requiredId(p.repoIdentity, &#39;repoIdentity&#39;); |
| provider | const | 77 | no | const provider = requiredId(p.provider, &#39;provider&#39;); |
| resolvedCommitSha | const | 79 | no | const resolvedCommitSha = hex(p.resolvedCommitSha, &#39;commit sha&#39;); |
| rootTreeSha | const | 80 | no | const rootTreeSha = hex(p.rootTreeSha, &#39;tree sha&#39;); |
| manifestDigest | const | 81 | no | const manifestDigest = hex(p.manifestDigest, &#39;manifest digest&#39;, 64); |
| validateEntry | function | 85 | no | function validateEntry(e) { |
| name | const | 87 | no | const name = path(e.path); |
| kind | const | 89 | no | const kind = e.kind ?? &#39;file&#39;; |
| capabilities | const | 93 | no | const capabilities = e.capabilityIds ?? []; |
| capabilityIds | const | 95 | no | const capabilityIds = [...new Set(capabilities.map(x =&gt; requiredId(x, &#39;capabilityId&#39;)))].sort(cmp); |
| validateManifest | function | 99 | no | function validateManifest(manifest, pin, maxEntries) { |
| entries | const | 104 | no | const entries = ordered(manifest.entries.map(validateEntry), x =&gt; x.path); |
| digest | const | 106 | no | const digest = digestManifest({ pinId: pin.pinId, completeness: manifest.completeness, truncated: manifest.truncated, entries: manifest.entries }); |
| evidence | function | 112 | no | function evidence(pin, e) { |
| scopePrefixes | function | 118 | no | function scopePrefixes(scope) { |
| prefixes | const | 120 | no | const prefixes = scope.prefixes ?? [&#39;&#39;]; |
| inScope | function | 127 | no | const inScope = (name, prefixes) =&gt; prefixes.some(p =&gt; !p \|\| name.startsWith(p)); |
| observable | function | 128 | no | const observable = e =&gt; Boolean(e?.blobSha) &amp;&amp; !e.excludedReason &amp;&amp; ![&#39;unknown&#39;].includes(e.kind); |
| sourceKey | function | 129 | no | const sourceKey = p =&gt; p.repoIdentity + &#39;@&#39; + p.resolvedCommitSha; |
| classify | function | 132 | no | function classify(origin, same, blobMatches, candidateMatches, bothComplete) { |
| row | function | 144 | no | function row(source, target, originEntry, targets, state) { |
| targetPaths | const | 145 | no | const targetPaths = targets.map(x =&gt; x.path).sort(cmp); |
| refs | const | 146 | no | const refs = [originEntry &amp;&amp; evidence(source, originEntry), ...targets.map(e =&gt; evidence(target, e))].filter(Boolean); |
| stableKey | const | 147 | no | const stableKey = { source: sourceKey(source), target: sourceKey(target), originPath: originEntry?.path ?? null, targetPaths, state }; |
| comparePair | function | 155 | no | function comparePair(source, target, prefixes, signal, emit, emitCandidate) { |
| left | const | 156 | no | const left = source.entries.filter(e =&gt; inScope(e.path, prefixes)); |
| right | const | 157 | no | const right = target.entries.filter(e =&gt; inScope(e.path, prefixes)); |
| byPath | const | 158 | no | const byPath = new Map(right.map(e =&gt; [e.path, e])); |
| byBlob | const | 159 | no | const byBlob = new Map(); |
| used | const | 164 | no | const used = new Set(); |
| candidateContributors | const | 165 | no | const candidateContributors = new Map(); |
| byCapability | const | 166 | no | const byCapability = new Map(); |
| related | const | 172 | no | const related = new Set(l.capabilityIds.flatMap(id =&gt; [...(byCapability.get(id) ?? [])])); |
| counts | const | 175 | no | const counts = Object.fromEntries(SOURCE_STATES.map(s =&gt; [s, 0])); |
| observed | variable | 176 | no | let observed = 0; |
| same | const | 179 | no | const same = byPath.get(l.path); |
| relocation | const | 180 | no | const relocation = same ? [] : (byBlob.get(l.blobSha) ?? []); |
| candidatePaths | const | 181 | no | const candidatePaths = new Set(l.capabilityIds.flatMap(id =&gt; [...(byCapability.get(id) ?? [])])); |
| candidates | const | 182 | no | const candidates = same \|\| relocation.length ? [] : [...candidatePaths].map(name =&gt; byPath.get(name)).sort((a,b) =&gt; cmp(a.path,b.path)); |
| outcome | const | 183 | no | const outcome = classify(l, same, relocation, candidates, source.complete &amp;&amp; target.complete); |
| state | variable | 184 | no | let state = outcome.state; |
| targets | const | 186 | no | const targets = outcome.matched; |
| state | variable | 198 | no | let state = source.complete &amp;&amp; target.complete &amp;&amp; observable(r) ? &#39;NEW_AT_TARGET&#39; : &#39;UNOBSERVABLE&#39;; |
| comparePinned | function | 211 | yes | export function comparePinned({ pins, manifests, targetPinId, pairwise = false, scope, budgets = {}, identityDecisions = [], signal } = {}) { |
| limits | const | 213 | no | const limits = { maxPins: bounded(budgets.maxPins, DEFAULT_LIMITS.maxPins, 128), |
| prefixes | const | 223 | no | const prefixes = scopePrefixes(scope); |
| cleanPins | const | 224 | no | const cleanPins = ordered(pins.map(validatePin), x =&gt; x.pinId); |
| ids | const | 225 | no | const ids = new Set(), revisions = new Map(); |
| rev | const | 229 | no | const rev = sourceKey(p), old = revisions.get(rev); |
| manifestMap | const | 234 | no | const manifestMap = new Map(); |
| all | const | 239 | no | const all = cleanPins.map(p =&gt; validateManifest(manifestMap.get(p.pinId), p, limits.maxEntries)); |
| totalEntries | const | 240 | no | const totalEntries = all.reduce((n, p) =&gt; n + p.entries.length, 0); |
| target | const | 242 | no | const target = all.find(p =&gt; p.pinId === targetPinId); |
| evidenceMap | const | 243 | no | const evidenceMap = new Map(), deltas = [], candidates = [], pairResults = []; |
| pathMaps | const | 244 | no | const pathMaps = new Map(all.map(p =&gt; [p.pinId, new Map(p.entries.map(e =&gt; [e.path, e]))])); |
| emitted | variable | 245 | no | let emitted = 0, candidateTotal = 0, findingsTotal = 0; |
| addEvidence | function | 246 | no | const addEvidence = (r) =&gt; { |
| index | const | 248 | no | const index = pathMaps.get(p.pinId); |
| entries | const | 249 | no | const entries = r.originPinId === p.pinId &amp;&amp; r.originPath ? [index.get(r.originPath)] : |
| push | function | 254 | no | const push = (r, collection) =&gt; { |
| pushCandidate | function | 259 | no | const pushCandidate = c =&gt; { |
| coverage | const | 264 | no | const coverage = []; |
| pairCount | const | 269 | no | const pairCount = all.length * (all.length - 1) / 2; |
| pairDeltas | const | 272 | no | const pairDeltas = []; |
| comparison | const | 273 | no | const comparison = comparePair(all[i], all[j], prefixes, signal, r =&gt; push(r, pairDeltas), () =&gt; {}); |
| sortRows | function | 277 | no | const sortRows = rows =&gt; ordered(rows, x =&gt; x.id); |
| sourceDeltas | const | 278 | no | const sourceDeltas = sortRows(deltas); |
| identityCandidates | const | 279 | no | const identityCandidates = sortRows(candidates); |
| summaryCounts | const | 280 | no | const summaryCounts = Object.fromEntries(SOURCE_STATES.map(s =&gt; [s, coverage.reduce((n, x) =&gt; n + x.counts[s], 0)])); |
| truncated | const | 281 | no | const truncated = findingsTotal &gt; emitted \|\| candidateTotal &gt; identityCandidates.length; |
| report | const | 282 | no | const report = { schema: COMPARISON_SCHEMA, targetPinId, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| ../sources/common.mjs | import | 8 | [hq/version-intelligence/sources/common.mjs](../sources/common.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/version-intelligence/compare/index.test.mjs](./index.test.mjs.md) | ./index.mjs |
| [hq/version-intelligence/integration/comparison-report-adapter.mjs](../integration/comparison-report-adapter.mjs.md) | ../compare/index.mjs |
| [hq/version-intelligence/integration/index.mjs](../integration/index.mjs.md) | ../compare/index.mjs |
| [hq/version-intelligence/integration/source-manifest-adapter.mjs](../integration/source-manifest-adapter.mjs.md) | ../compare/index.mjs |
| [tests/hq-version-intelligence/g1-v2-schema.test.mjs](../../../tests/hq-version-intelligence/g1-v2-schema.test.mjs.md) | ../../hq/version-intelligence/compare/index.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../hq/version-intelligence/compare/index.mjs |
| [tests/hq-version-intelligence/integrated-nway.test.mjs](../../../tests/hq-version-intelligence/integrated-nway.test.mjs.md) | ../../hq/version-intelligence/compare/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 298 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
