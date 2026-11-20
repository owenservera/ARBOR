# File: hq/aii/fixtures/HQ-090-redundant-computation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-090-redundant-computation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7752 B |
| Lines | 110 |
| Hash | 3032b02b12cf |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 35 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| OVER_OPERATIONS | const | 38 | no | const OVER_OPERATIONS = [&#39;context&#39;, &#39;verify&#39;, &#39;index&#39;, &#39;find&#39;, &#39;search&#39;]; |
| findings | const | 52 | no | const findings = []; |
| db | const | 54 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| config | const | 56 | no | const config = loadConfig(ROOT); |
| report | const | 57 | no | const report = budgetReport(db, config, {}); |
| over | const | 58 | no | const over = (report.violations ?? []).map((v) =&gt; v.operation); |
| indexViolation | const | 63 | no | const indexViolation = (report.violations ?? []).find((v) =&gt; v.operation === &#39;index&#39;); |
| okOps | const | 69 | no | const okOps = (report.rows ?? []).filter((r) =&gt; r.ok).map((r) =&gt; r.operation).sort(); |
| agg | const | 75 | no | const agg = db.prepare( &quot;SELECT operation, COUNT(*) AS c FROM timings GROUP BY operation ORDER BY c DESC&quot;, ).all(); |
| indexSpans | const | 78 | no | const indexSpans = agg.find((a) =&gt; a.operation === &#39;index&#39;); |
| plan | const | 84 | no | const plan = optimize(db, config, {}); |
| pairs | const | 85 | no | const pairs = (plan.recommendations ?? []).map((r) =&gt; r.operation); |
| unique | const | 86 | no | const unique = [...new Set(pairs)].sort(); |
| byOp | const | 90 | no | const byOp = new Map(); |
| conflicts | const | 100 | no | const conflicts = plan.conflicts ?? []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 27 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 28 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/telemetry.mjs | import | 29 | [hq/lib/telemetry.mjs](../../lib/telemetry.mjs.md) |
| ../../lib/registry.mjs | import | 30 | [hq/lib/registry.mjs](../../lib/registry.mjs.md) |
| node:fs | import | 31 | external |
| node:path | import | 32 | external |
| node:url | import | 33 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-090-redundant-computation.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-090 (group K):
// "Where are we doing redundant computation or indexing?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs timing budgets
//     -> "Budgets — profile balanced" then OVER/ok lines per operation.
//        Live: OVER context (p95 60421.891ms / 600ms, ratio 100.703),
//        OVER verify (97117.606ms / 2000ms, 48.559), OVER index (313477.767ms
//        / 15000ms, 20.899), OVER find (1836.18ms / 250ms, 7.345), OVER
//        search (289.127ms / 250ms, 1.157); ok mcp/ask/brief/wiki/lint.
//   bun hq/bin/hq.mjs timing report
//     -> "Timing report — 32 spans across 7 operations" with per-operation
//        count/errors/p50/p95/max. index ran 4 times for the same workspace
//        within the window — redundant re-indexing is the measurable waste.
//   bun hq/bin/hq.mjs timing optimize
//     -> "Optimization — profile balanced, 5 violation(s), 5 conflict(s)" and
//        per-operation raise-budget/reduce-load recommendation PAIRS that
//        conflict with each other (conflicts: context:reduce-load etc.).
//   budgetReport() (hq/lib/telemetry.mjs:169) computes the OVER/ok table from
//   PERFORMANCE_PROFILES.balanced (hq/lib/telemetry.mjs:5-18); optimize()
//   (hq/lib/telemetry.mjs:238) builds the conflict-aware plan.
//
// The five over-budget operations and the conflicting recommendation pairs are
// the pinned structure; the p95 values drift as spans accumulate, so they are
// re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { budgetReport, optimize } from '../../lib/telemetry.mjs';
import { loadConfig } from '../../lib/registry.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The operations observed over budget at lock time.
const OVER_OPERATIONS = ['context', 'verify', 'index', 'find', 'search'];

export default defineFixture({
  id: 'HQ-090',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs timing budgets printed "Budgets — profile balanced" and OVER lines for context (p95 60421.891ms / 600ms, ratio 100.703, priority 5), verify (97117.606ms / 2000ms, 48.559, priority 3), index (313477.767ms / 15000ms, 20.899, priority 3), find (1836.18ms / 250ms, 7.345, priority 5) and search (289.127ms / 250ms, 1.157, priority 5), plus ok for mcp/ask/brief/wiki/lint. bun hq/bin/hq.mjs timing report printed "Timing report — 32 spans across 7 operations" with the index operation run 4 times (redundant re-indexing of the same workspace in-window). bun hq/bin/hq.mjs timing optimize printed "Optimization — profile balanced, 5 violation(s), 5 conflict(s)" with conflicting raise-budget/reduce-load pairs per operation (e.g. context:raise-budget conflicts with context:reduce-load). budgetReport() (hq/lib/telemetry.mjs:169) computes the OVER/ok table from PERFORMANCE_PROFILES.balanced (hq/lib/telemetry.mjs:5-18); optimize() (hq/lib/telemetry.mjs:238) builds the conflict-aware plan. The five over-budget operations and the conflicting-recommendation structure are pinned; the p95 values and span counts drift as spans accumulate and are re-derived live.',
  expected: [
    { what: /^five operations are over their p95 budget: context, verify, index, find, search$/, where: 'hq/lib/telemetry.mjs budgetReport' },
    { what: 'index is the most expensive operation: p95 far above its budget, i.e. redundant re-indexing of the same workspace', where: 'hq/lib/telemetry.mjs budgetReport' },
    { what: 'the index operation ran more than once inside the timing window — redundant indexing work', where: 'hq/lib/telemetry.mjs timingReport' },
    { what: 'the optimizer proposes BOTH raise-budget and reduce-load for the same operation, and the two conflict', where: 'hq/lib/telemetry.mjs optimize' },
    { what: /^\d+ budget violations with \d+ conflicting recommendation pairs$/, where: 'hq/lib/telemetry.mjs optimize' },
    { what: 'mcp, ask, brief, wiki and lint run inside their budgets', where: 'hq/lib/telemetry.mjs budgetReport' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const config = loadConfig(ROOT);
      const report = budgetReport(db, config, {});
      const over = (report.violations ?? []).map((v) => v.operation);
      if (over.join(', ') !== OVER_OPERATIONS.join(', ')) {
        throw new Error(`unexpected over-budget set: ${over.join(', ')}`);
      }
      findings.push(finding(`five operations are over their p95 budget: ${over.join(', ')}`, 'hq/lib/telemetry.mjs budgetReport'));
      const indexViolation = (report.violations ?? []).find((v) => v.operation === 'index');
      if (!indexViolation) throw new Error('no index violation');
      if (indexViolation.ratio < 10) {
        throw new Error(`expected index ratio >= 10, got ${indexViolation.ratio}`);
      }
      findings.push(finding('index is the most expensive operation: p95 far above its budget, i.e. redundant re-indexing of the same workspace', 'hq/lib/telemetry.mjs budgetReport'));
      const okOps = (report.rows ?? []).filter((r) => r.ok).map((r) => r.operation).sort();
      if (okOps.join(', ') !== 'ask, brief, lint, mcp, wiki') {
        throw new Error(`unexpected ok set: ${okOps.join(', ')}`);
      }
      findings.push(finding('mcp, ask, brief, wiki and lint run inside their budgets', 'hq/lib/telemetry.mjs budgetReport'));

      const agg = db.prepare(
        "SELECT operation, COUNT(*) AS c FROM timings GROUP BY operation ORDER BY c DESC",
      ).all();
      const indexSpans = agg.find((a) => a.operation === 'index');
      if (!indexSpans || Number(indexSpans.c) < 2) {
        throw new Error(`expected repeated index spans, got ${JSON.stringify(indexSpans)}`);
```

_First 80 of 111 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
