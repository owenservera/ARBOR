# File: hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8193 B |
| Lines | 109 |
| Hash | 65fcec18b701 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 33 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| RETRIEVAL_OPS | const | 36 | no | const RETRIEVAL_OPS = [&#39;context&#39;, &#39;verify&#39;, &#39;index&#39;, &#39;find&#39;, &#39;search&#39;]; |
| findings | const | 52 | no | const findings = []; |
| report | const | 54 | no | const report = runHq([&#39;timing&#39;, &#39;report&#39;], { cwd: ROOT }); |
| db | const | 61 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| config | const | 63 | no | const config = loadConfig(ROOT); |
| budgets | const | 64 | no | const budgets = budgetReport(db, config, {}); |
| violationOps | const | 65 | no | const violationOps = (budgets.violations ?? []).map((v) =&gt; v.operation); |
| byOp | const | 70 | no | const byOp = new Map((budgets.rows ?? []).map((r) =&gt; [r.operation, r])); |
| contextRow | const | 71 | no | const contextRow = byOp.get(&#39;context&#39;); |
| indexRow | const | 72 | no | const indexRow = byOp.get(&#39;index&#39;); |
| worst | const | 74 | no | const worst = [...byOp.values()].sort((a, b) =&gt; b.ratio - a.ratio)[0]; |
| stale | const | 84 | no | const stale = await collectStaleFiles({ db, config, projects: projectsForIndex(ROOT) }); |
| reasons | const | 85 | no | const reasons = [...new Set(stale.map((s) =&gt; s.reason))].sort(); |
| dayMs | const | 93 | no | const dayMs = Date.parse(&#39;2026-11-10T00:00:00.000Z&#39;); |
| seededRows | const | 94 | no | const seededRows = [ |
| c | const | 98 | no | const c = census(seededRows, { now: Date.parse(&#39;2026-11-11T00:00:00.000Z&#39;) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 24 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 25 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/telemetry.mjs | import | 26 | [hq/lib/telemetry.mjs](../../lib/telemetry.mjs.md) |
| ../../lib/freshness.mjs | import | 27 | [hq/lib/freshness.mjs](../../lib/freshness.mjs.md) |
| ../../lib/registry.mjs | import | 28 | [hq/lib/registry.mjs](../../lib/registry.mjs.md) |
| ../../lib/context-budget.mjs | import | 29 | [hq/lib/context-budget.mjs](../../lib/context-budget.mjs.md) |
| node:path | import | 30 | external |
| node:url | import | 31 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-093 (group K):
// "Which context retrieval steps introduce unnecessary latency or stale
// information?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs timing report
//     -> per-operation p50/p95/max: search (p95 289.127ms), find (p95
//        1836.18ms), index (p95 313477.767ms), context (p95 92986.599ms),
//        verify (2 spans, 2 errors — p95 97117.606ms), wiki.check.
//        budgetReport (hq/lib/telemetry.mjs:169) shows ALL retrieval-adjacent
//        operations over budget: context ratio 100.703, verify 48.559, index
//        20.899, find 7.345, search 1.157.
//   collectStaleFiles() (hq/lib/freshness.mjs:19) diffs index rows against
//   disk and returns {project, path, reason} with reason new|changed|deleted —
//   the stale-information surface. Live: 36 stale entries across 4 projects
//   with all three reasons present.
//   census() (hq/lib/context-budget.mjs:71) and planCompactions()
//   (:206) surface token waste: non-completed requests and retries.
//
// The per-operation budget ratios and the three staleness reasons are pinned
// (structure); the p95 values drift as spans accumulate and are re-derived
// live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { budgetReport } from '../../lib/telemetry.mjs';
import { collectStaleFiles } from '../../lib/freshness.mjs';
import { loadConfig, projectsForIndex } from '../../lib/registry.mjs';
import { census, planCompactions } from '../../lib/context-budget.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The retrieval-adjacent operations observed over budget at lock time.
const RETRIEVAL_OPS = ['context', 'verify', 'index', 'find', 'search'];

export default defineFixture({
  id: 'HQ-093',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs timing report printed per-operation p50/p95/max — search p95 289.127ms, find p95 1836.18ms, index p95 313477.767ms, context p95 92986.599ms (12 spans), verify 2 spans with 2 errors (p95 97117.606ms), wiki.check p95 164073.114ms. budgetReport() (hq/lib/telemetry.mjs:169) marked ALL retrieval-adjacent operations over budget: context ratio 100.703, verify 48.559, index 20.899, find 7.345, search 1.157. collectStaleFiles() (hq/lib/freshness.mjs:19) returned 36 stale entries across the 4 indexed projects with reasons changed, new and deleted all present. census() (hq/lib/context-budget.mjs:71) over seeded rows aggregates tokens by day/model/agent, and planCompactions() (:206) flags over-ceiling and idle sessions for compaction (skipping sessions with no usage). The over-budget retrieval set and the three staleness reasons are pinned as structure; the p95 values and stale counts drift as spans and files change and are re-derived live.',
  expected: [
    { what: /^the retrieval-adjacent operations over budget are context, verify, index, find, search$/, where: 'hq/lib/telemetry.mjs budgetReport' },
    { what: /^context retrieval is the worst latency offender \(highest budget ratio\)$/, where: 'hq/lib/telemetry.mjs budgetReport' },
    { what: /^index latency is \d+x its budget — re-indexing dominates retrieval latency$/, where: 'hq/lib/telemetry.mjs budgetReport' },
    { what: 'the timing report carries per-operation p50, p95 and max latency', where: 'hq/bin/hq.mjs timing report' },
    { what: 'staleness reasons detected against the index: changed, deleted, new', where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: /^\d+ stale entries detected across the indexed projects$/, where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: 'stale sources are exactly the index-vs-disk drift: new, changed, deleted files', where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: 'the token census aggregates input, output and total tokens by day, model and agent', where: 'hq/lib/context-budget.mjs census' },
  ],
  run: async () => {
    const findings = [];

    const report = runHq(['timing', 'report'], { cwd: ROOT });
    if (report.exit !== 0) throw new Error(`hq timing report failed: exit=${report.exit} stderr=${report.stderr}`);
    if (!/Operation\s+Count\s+Errors\s+p50\s+p95\s+max/.test(report.stdout)) {
      throw new Error('timing report lacks the p50/p95/max header');
    }
    findings.push(finding('the timing report carries per-operation p50, p95 and max latency', 'hq/bin/hq.mjs timing report'));

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const config = loadConfig(ROOT);
      const budgets = budgetReport(db, config, {});
      const violationOps = (budgets.violations ?? []).map((v) => v.operation);
      if (violationOps.join(', ') !== RETRIEVAL_OPS.join(', ')) {
        throw new Error(`unexpected over-budget set: ${violationOps.join(', ')}`);
      }
      findings.push(finding(`the retrieval-adjacent operations over budget are ${violationOps.join(', ')}`, 'hq/lib/telemetry.mjs budgetReport'));
      const byOp = new Map((budgets.rows ?? []).map((r) => [r.operation, r]));
      const contextRow = byOp.get('context');
      const indexRow = byOp.get('index');
      if (!contextRow || !indexRow) throw new Error('missing context/index rows in budget report');
      const worst = [...byOp.values()].sort((a, b) => b.ratio - a.ratio)[0];
      if (worst.operation !== 'context') {
        throw new Error(`expected context as the worst ratio, got ${worst.operation}`);
      }
      findings.push(finding('context retrieval is the worst latency offender (highest budget ratio)', 'hq/lib/telemetry.mjs budgetReport'));
      if (indexRow.ratio < 10) {
        throw new Error(`expected index ratio >= 10, got ${indexRow.ratio}`);
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
