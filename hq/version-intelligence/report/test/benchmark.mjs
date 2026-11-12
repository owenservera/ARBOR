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
