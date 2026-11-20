# File: hq/version-intelligence/integration/comparison-report-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/integration/comparison-report-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3751 B |
| Lines | 73 |
| Hash | 7817982c1872 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPORT_BRIDGE_SCHEMA | const | 9 | yes | export const REPORT_BRIDGE_SCHEMA = &#39;arbor.hvi.adapter.comparison-report/1&#39;; |
| fail | function | 10 | no | function fail(code) { const e = new Error(&#39;HVI_REPORT_BRIDGE_&#39; + code); e.code = code; throw e; } |
| sha | function | 11 | no | const sha = x =&gt; typeof x === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(x); |
| verifiedC | function | 12 | no | function verifiedC(c) { |
| pins | const | 20 | no | const pins = new Set(c.sourcePins.map(p =&gt; p.pinId)); |
| projectIntegratedReport | function | 35 | yes | export function projectIntegratedReport(comparison, options = {}) { |
| c | const | 36 | no | const c = verifiedC(comparison); |
| candidatePath | const | 37 | no | const candidatePath = new Map(c.identityCandidates.map(x =&gt; [&#39;cap-&#39; + x.id, x.originPath])); |
| normalized | const | 39 | no | const normalized = { |
| view | const | 55 | no | const view = projectVersionComparison(normalized, options); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../sources/common.mjs | import | 5 | [hq/version-intelligence/sources/common.mjs](../sources/common.mjs.md) |
| ../compare/index.mjs | import | 6 | [hq/version-intelligence/compare/index.mjs](../compare/index.mjs.md) |
| ../report/index.mjs | import | 7 | [hq/version-intelligence/report/index.mjs](../report/index.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/version-intelligence/integration/index.mjs](./index.mjs.md) | ./comparison-report-adapter.mjs |
| [tests/hq-version-intelligence/integrated-nway.test.mjs](../../../tests/hq-version-intelligence/integrated-nway.test.mjs.md) | ../../hq/version-intelligence/integration/comparison-report-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
