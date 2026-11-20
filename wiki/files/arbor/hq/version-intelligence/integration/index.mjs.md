# File: hq/version-intelligence/integration/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/integration/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9257 B |
| Lines | 169 |
| Hash | 64eecdc2816c |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HVI_CAPABILITY_ID | const | 13 | yes | export const HVI_CAPABILITY_ID = &#39;arbor.hvi.compare.pinned/1&#39;; |
| HVI_TOOL_REQUEST_SCHEMA | const | 14 | yes | export const HVI_TOOL_REQUEST_SCHEMA = &#39;arbor.hvi.tool-request/1&#39;; |
| HVI_SOURCE_SELECTION_SCHEMA | const | 15 | yes | export const HVI_SOURCE_SELECTION_SCHEMA = &#39;arbor.hvi.source-selection/1&#39;; |
| HVI_TOOL_RESULT_SCHEMA | const | 16 | yes | export const HVI_TOOL_RESULT_SCHEMA = &#39;arbor.hvi.tool-result/1&#39;; |
| HVI_TOOL_DEFINITION | const | 17 | yes | export const HVI_TOOL_DEFINITION = Object.freeze({ id: HVI_CAPABILITY_ID, kind: &#39;read_only_development_analysis&#39;, description: &#39;Compare 2..N explicitly pinned Git-object source manifests; source fact… |
| fail | function | 31 | no | function fail(code) { const e = new Error(&#39;HVI_TOOL_&#39; + code); e.code = code; throw e; } |
| bound | function | 32 | no | function bound(value, fallback, max) { |
| validatePrefixes | function | 37 | no | function validatePrefixes(scope) { |
| prefixes | const | 38 | no | const prefixes = scope?.prefixes ?? [&#39;&#39;]; |
| runHviTool | function | 46 | yes | export async function runHviTool(input, { authorize, signal, context } = {}) { |
| maxPins | const | 51 | no | const maxPins = bound(input.budgets?.maxPins, 16, 16); |
| maxEntries | const | 52 | no | const maxEntries = bound(input.budgets?.maxEntries, 100000, 1000000); |
| maxFindings | const | 53 | no | const maxFindings = bound(input.budgets?.maxFindings, 20000, 100000); |
| totalNative | const | 55 | no | const totalNative = input.sourceManifests.reduce((a, m) =&gt; a + (Array.isArray(m?.entries) ? m.entries.length : 0), 0); |
| bridges | const | 57 | no | const bridges = bridgeSourceManifests(input.sourceManifests); |
| decision | const | 60 | no | const decision = await authorize({ operation: &#39;hvi.source.compare&#39;, scope: &#39;development&#39;, capabilityId: HVI_CAPABILITY_ID, pinId: b.pin.pinId, repoIdentity: b.pin.repoIdentity, resolvedCommitSha: b.p… |
| comparison | const | 68 | no | const comparison = comparePinned({ pins: bridges.map(b =&gt; b.pin), manifests: bridges.map(b =&gt; b.manifest), targetPinId: input.targetPinId, pairwise: input.pairwise ?? false, scope: validatePrefixes(i… |
| evidenceReport | const | 76 | no | const evidenceReport = projectIntegratedReport(comparison, input.reportOptions \|\| {}); |
| identity | variable | 77 | no | let identity = null; |
| parity | variable | 87 | no | let parity = null; |
| target | const | 89 | no | const target = bridges.find(b =&gt; b.pin.pinId === input.targetPinId); |
| validateSourceSelection | function | 107 | no | function validateSourceSelection(input) { |
| seen | const | 118 | no | const seen = new Set(); |
| key | const | 128 | no | const key = String(source.repo) + &#39;\\u0000&#39; + String(source.ref ?? &#39;&#39;) + &#39;\\u0000&#39; + |
| runHviSelectedSources | function | 143 | yes | export async function runHviSelectedSources(input, { adapter, approvedRepositories, authorize, signal, context, limits, inspectContent, acquiredAt, } = {}) { |
| sources | const | 146 | no | const sources = validateSourceSelection(input); |
| acquired | const | 149 | no | const acquired = []; |
| selection | const | 152 | no | const selection = await acquirePinnedSnapshot(source, { adapter, authorize, approvedRepositories, limits, inspectContent: inspectContent === true, signal, acquiredAt, }); |
| target | const | 158 | no | const target = acquired[input.targetIndex]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./source-manifest-adapter.mjs | import | 5 | [hq/version-intelligence/integration/source-manifest-adapter.mjs](./source-manifest-adapter.mjs.md) |
| ../compare/index.mjs | import | 6 | [hq/version-intelligence/compare/index.mjs](../compare/index.mjs.md) |
| ./comparison-report-adapter.mjs | import | 7 | [hq/version-intelligence/integration/comparison-report-adapter.mjs](./comparison-report-adapter.mjs.md) |
| ./parity-evidence-adapter.mjs | import | 8 | [hq/version-intelligence/integration/parity-evidence-adapter.mjs](./parity-evidence-adapter.mjs.md) |
| ../identity/index.mjs | import | 9 | [hq/version-intelligence/identity/index.mjs](../identity/index.mjs.md) |
| ../sources/snapshots.mjs | import | 10 | [hq/version-intelligence/sources/snapshots.mjs](../sources/snapshots.mjs.md) |
| ../sources/adapters.mjs | import | 11 | [hq/version-intelligence/sources/adapters.mjs](../sources/adapters.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/hvi-capability.mjs](../../../apps/vivim-host/control/hvi-capability.mjs.md) | ../../../hq/version-intelligence/integration/index.mjs |
| [hq/lib/mcp.mjs](../../lib/mcp.mjs.md) | ../version-intelligence/integration/index.mjs |
| [hq/test/hvi-live-source-composition.test.mjs](../../test/hvi-live-source-composition.test.mjs.md) | ../version-intelligence/integration/index.mjs |
| [hq/version-intelligence/integration/cli.mjs](./cli.mjs.md) | ./index.mjs |
| [tests/hq-version-intelligence/integrated-nway.test.mjs](../../../tests/hq-version-intelligence/integrated-nway.test.mjs.md) | ../../hq/version-intelligence/integration/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * ARBOR HVI G1 native library/service boundary. Deterministic source analysis
 * only; Host registration and live actor/session grants belong to Lane H.
 */
import { bridgeSourceManifests } from './source-manifest-adapter.mjs';
import { comparePinned } from '../compare/index.mjs';
import { projectIntegratedReport } from './comparison-report-adapter.mjs';
import { joinParityEvidence } from './parity-evidence-adapter.mjs';
import { buildPinnedIdentityCrosswalk } from '../identity/index.mjs';
import { acquirePinnedSnapshot } from '../sources/snapshots.mjs';
import { assertVerifiedAdapter } from '../sources/adapters.mjs';

export const HVI_CAPABILITY_ID = 'arbor.hvi.compare.pinned/1';
export const HVI_TOOL_REQUEST_SCHEMA = 'arbor.hvi.tool-request/1';
export const HVI_SOURCE_SELECTION_SCHEMA = 'arbor.hvi.source-selection/1';
export const HVI_TOOL_RESULT_SCHEMA = 'arbor.hvi.tool-result/1';
export const HVI_TOOL_DEFINITION = Object.freeze({
  id: HVI_CAPABILITY_ID, kind: 'read_only_development_analysis',
  description: 'Compare 2..N explicitly pinned Git-object source manifests; source facts are not runtime proof.',
  triggers: ['compare repository versions','compare three commits','explain source lineage','show migration source differences'],
  inputs: { schema: HVI_TOOL_REQUEST_SCHEMA, sourceManifests: 'arbor.hvi.manifest/1[]',
    sourceSelection: HVI_SOURCE_SELECTION_SCHEMA, targetPinId: 'sha256 pin ID', pairwise: 'boolean', scope: 'bounded prefixes',
    budgets: 'resource ceilings', includeParity: 'boolean', identityRecords: 'source declarations only' },
  outputs: { schema: HVI_TOOL_RESULT_SCHEMA, comparison: 'arbor.hvi.version-comparison/1',
    evidenceReport: 'arbor.hvi.adapter.comparison-report/1',
    adapters: 'dual source manifest receipts', authority: 'source-only unverified' },
  authority: 'Host grants and actor/session enforcement REQUIRED before remote exposure',
  liveRegistered: false, effects: 'none', hiddenAutoScan: false,
  immediateLaunchMode: 'synthetic_fixture_or_explicit_operator_only',
});
function fail(code) { const e = new Error('HVI_TOOL_' + code); e.code = code; throw e; }
function bound(value, fallback, max) {
  if (value == null) return fallback;
  if (!Number.isSafeInteger(value) || value < 1 || value > max) fail('RESOURCE_LIMIT');
  return value;
}
function validatePrefixes(scope) {
  const prefixes = scope?.prefixes ?? [''];
  if (!Array.isArray(prefixes) || prefixes.length < 1 || prefixes.length > 32 ||
      prefixes.some(p => typeof p !== 'string' || p.includes('..') || p.includes('\\') ||
        p.startsWith('/') || p.includes('\0'))) fail('SCOPE_ESCAPE');
  return { prefixes };
}

/** Caller grant callback is NOT independently attested Host authority. */
export async function runHviTool(input, { authorize, signal, context } = {}) {
  if (input?.schema !== HVI_TOOL_REQUEST_SCHEMA ||
      !Array.isArray(input.sourceManifests)) fail('INVALID_REQUEST');
  if (typeof authorize !== 'function') fail('SOURCE_UNAUTHORIZED');
  if (signal?.aborted) fail('RESOURCE_LIMIT');
  const maxPins = bound(input.budgets?.maxPins, 16, 16);
  const maxEntries = bound(input.budgets?.maxEntries, 100000, 1000000);
  const maxFindings = bound(input.budgets?.maxFindings, 20000, 100000);
  if (input.sourceManifests.length < 2 || input.sourceManifests.length > maxPins) fail('RESOURCE_LIMIT');
  const totalNative = input.sourceManifests.reduce((a, m) => a + (Array.isArray(m?.entries) ? m.entries.length : 0), 0);
  if (totalNative > maxEntries) fail('RESOURCE_LIMIT');
  const bridges = bridgeSourceManifests(input.sourceManifests);
  for (const b of bridges) {
    if (signal?.aborted) fail('RESOURCE_LIMIT');
    const decision = await authorize({ operation: 'hvi.source.compare', scope: 'development',
      capabilityId: HVI_CAPABILITY_ID, pinId: b.pin.pinId,
      repoIdentity: b.pin.repoIdentity, resolvedCommitSha: b.pin.resolvedCommitSha,
      sourceGrantRef: b.pin.sourceGrantRef || null, context: context || null });
    if (decision !== true) fail('SOURCE_UNAUTHORIZED');
  }
  if (!bridges.some(b => b.pin.pinId === input.targetPinId)) fail('PIN_NOT_FOUND');
  if (input.identityDecisions?.length) fail('EQUIVALENCE_UNPROVEN');
  const comparison = comparePinned({
    pins: bridges.map(b => b.pin), manifests: bridges.map(b => b.manifest),
    targetPinId: input.targetPinId, pairwise: input.pairwise ?? false,
    scope: validatePrefixes(input.scope), signal,
    budgets: { maxPins, maxEntries, maxFindings,
      maxPairs: bound(input.budgets?.maxPairs, 120, 8128) },
    identityDecisions: [],
  });
  const evidenceReport = projectIntegratedReport(comparison, input.reportOptions || {});
  let identity = null;
  if (input.identityRecords != null || input.identityLinks != null) {
    if (!Array.isArray(input.identityRecords ?? []) ||
        !Array.isArray(input.identityLinks ?? []) ||
```

_First 80 of 170 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
