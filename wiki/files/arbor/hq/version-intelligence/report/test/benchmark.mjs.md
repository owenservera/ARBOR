# File: hq/version-intelligence/report/test/benchmark.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/report/test/benchmark.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1374 B |
| Lines | 15 |
| Hash | 3adb66934271 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| pins | const | 4 | no | const pins = [1, 2, 3, 4, 5].map(i =&gt; ({ pinId:&#39;p&#39;+i, repoIdentity: `owenservera/repo${i}`, resolvedCommitSha: String(i).repeat(40), completeness: &#39;complete&#39;, manifestDigest: &#39;a&#39;.repeat(64) })); |
| findings | const | 5 | no | const findings = Array.from({ length: 10_000 }, (_, i) =&gt; ({ id:&#39;unit&#39;+String(i).padStart(5, &#39;0&#39;), sourcePinId:&#39;p1&#39;, category:&#39;MISSING_AT_TARGET&#39;, sourcePath: `hq/units/u${i}.mjs`, owner:&#39;hq&#39;, eviden… |
| t0 | const | 7 | no | const t0 = performance.now(); |
| out | const | 8 | no | const out = projectVersionComparison({schema:&#39;arbor.hvi.version-comparison/1&#39;,targetPinId:&#39;p5&#39;,sourcePins:pins,sourceDeltas:findings}); |
| elapsedMs | const | 9 | no | const elapsedMs = Math.round((performance.now()-t0)*1000)/1000; |
| observed | const | 10 | no | const observed = {rows:findings.length, pins:pins.length, elapsedMs, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:perf_hooks | import | 2 | external |
| ../index.mjs | import | 3 | [hq/version-intelligence/report/index.mjs](../index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/** Explicit synthetic 10k-row projection benchmark; no pass threshold. */
import { performance } from 'node:perf_hooks';
import { projectVersionComparison } from '../index.mjs';
const pins = [1, 2, 3, 4, 5].map(i => ({ pinId:'p'+i, repoIdentity: `owenservera/repo${i}`, resolvedCommitSha: String(i).repeat(40), completeness: 'complete', manifestDigest: 'a'.repeat(64) }));
const findings = Array.from({ length: 10_000 }, (_, i) => ({ id:'unit'+String(i).padStart(5, '0'), sourcePinId:'p1', category:'MISSING_AT_TARGET',
  sourcePath: `hq/units/u${i}.mjs`, owner:'hq', evidenceRefs:[] }));
const t0 = performance.now();
const out = projectVersionComparison({schema:'arbor.hvi.version-comparison/1',targetPinId:'p5',sourcePins:pins,sourceDeltas:findings});
const elapsedMs = Math.round((performance.now()-t0)*1000)/1000;
const observed = {rows:findings.length, pins:pins.length, elapsedMs,
  rssBytes:process.memoryUsage().rss, heapUsedBytes:process.memoryUsage().heapUsed,
  pageReturned:out.table.returned, pageTruncated:out.table.truncated, planReturned:out.mergePlan.returned, planTruncated:out.mergePlan.truncated,
  evidenceCompleteness:out.coverage.completeness, runtimeAcceptance:out.runtimeAcceptance,
  reproducibilityDigest:out.reproducibilityDigest, platform:process.platform, node:process.version};
console.log(JSON.stringify(observed, null, 2));
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
