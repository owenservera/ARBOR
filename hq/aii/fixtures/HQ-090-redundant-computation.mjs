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
      }
      findings.push(finding(`the index operation ran more than once inside the timing window — redundant indexing work (${indexSpans.c} spans)`.replace(/\s+\(\d+ spans\)$/, ''), 'hq/lib/telemetry.mjs timingReport'));

      const plan = optimize(db, config, {});
      const pairs = (plan.recommendations ?? []).map((r) => r.operation);
      const unique = [...new Set(pairs)].sort();
      if (unique.join(', ') !== 'context, find, index, search, verify') {
        throw new Error(`unexpected recommendation operations: ${unique.join(', ')}`);
      }
      const byOp = new Map();
      for (const r of plan.recommendations ?? []) {
        if (!byOp.has(r.operation)) byOp.set(r.operation, new Set());
        byOp.get(r.operation).add(r.action);
      }
      for (const [op, actions] of byOp) {
        if (!actions.has('raise-budget') || !actions.has('reduce-load')) {
          throw new Error(`expected raise-budget and reduce-load for ${op}, got ${[...actions].join(', ')}`);
        }
      }
      const conflicts = plan.conflicts ?? [];
      if (!conflicts.length) throw new Error('optimizer reported no conflicts');
      findings.push(finding('the optimizer proposes BOTH raise-budget and reduce-load for the same operation, and the two conflict', 'hq/lib/telemetry.mjs optimize'));
      findings.push(finding(`${(plan.recommendations ?? []).length} budget violations with ${conflicts.length} conflicting recommendation pairs`, 'hq/lib/telemetry.mjs optimize'));
    } finally {
      db.close();
    }

    return findings;
  },
});
