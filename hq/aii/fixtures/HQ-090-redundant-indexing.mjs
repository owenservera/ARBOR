// AII scenario HQ-090 (group K, P1): "Where are we doing redundant computation or indexing?"
// Status: covered_unverified (hq/aii/assessments/lane-9.json) — capability exists in
// hq/lib/telemetry.mjs timingReport/budgetReport; this fixture verifies it, promoting to
// covered_verified via the receipt.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - `bun hq/bin/hq.mjs timing budgets` (exit 0): OVER index p95 313477.767ms / 15000ms
//     budget ratio 20.899; OVER context 92986.599ms / 600ms; OVER verify 97117.606ms / 2000ms;
//     OVER find 1836.18ms / 250ms; OVER search 338.72ms / 250ms. Indexing is by far the most
//     expensive operation — that is the "redundant computation or indexing" answer.
//   - `bun hq/bin/hq.mjs timing report` (exit 0): index span max 313477.767ms across 4 operations /
//     673431.369ms total.
//
// run() re-derives both reports live against the real .hq/index.db (read-only) and asserts indexing
// dominates runtime computation and exceeds its budget. No writes, no seeds, no credentials.

import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { timingReport, budgetReport } from '../../lib/telemetry.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CONFIG = {
  performance: {
    profile: 'balanced',
    budgets: { index: 15000, context: 600, verify: 2000, find: 250, search: 250 },
  },
};

export default defineFixture({
  id: 'HQ-090',
  provenance:
    'Locked 2026-11-11 (this session) from live output of `bun hq/bin/hq.mjs timing budgets` and ' +
    '`bun hq/bin/hq.mjs timing report` against the real .hq/index.db: index p95 313477.767ms vs a ' +
    '15000ms budget (ratio 20.899) — indexing is the dominant, over-budget computation; context, ' +
    'verify, find and search are also over budget but far smaller. run() re-derives both reports live; ' +
    'the index p95 value itself is left free (the index grows as lanes run), only the dominance and ' +
    'budget-violation facts are pinned.',
  expected: [
    { what: /indexing dominates runtime computation: index p95 [\d.]+ms exceeds its 15000ms budget and is the highest p95 of all operations$/, where: 'hq/lib/telemetry.mjs timingReport/budgetReport' },
    { what: 'budgetReport flags at least one over-budget operation (index p95 > 15000ms budget)', where: 'hq/lib/telemetry.mjs budgetReport' },
  ],
  run: async () => {
    const findings = [];
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const report = timingReport(db);
      const budgets = budgetReport(db, CONFIG);
      if (!Array.isArray(report.aggregates) || report.aggregates.length === 0) {
        throw new Error(`timing report returned no aggregates: ${JSON.stringify(report.totals)}`);
      }
      const byOp = new Map(report.aggregates.map((a) => [a.operation, a]));
      const index = byOp.get('index');
      if (!index) throw new Error('timing report has no index operation');
      if (index.count === 0) throw new Error('index operation has no spans');
      const maxP95 = Math.max(...report.aggregates.map((a) => a.p95Ms));
      if (index.p95Ms <= 15000) {
        throw new Error(`index p95 ${index.p95Ms}ms does not exceed the 15000ms budget`);
      }
      if (index.p95Ms !== maxP95) {
        throw new Error(`index p95 ${index.p95Ms}ms is not the highest (max ${maxP95}ms)`);
      }
      const violations = budgets.violations.filter((v) => v.operation === 'index');
      if (violations.length === 0 || violations[0].p95Ms !== index.p95Ms) {
        throw new Error(`budgetReport does not flag index over budget: ${JSON.stringify(budgets.violations)}`);
      }

      findings.push(finding(`indexing dominates runtime computation: index p95 ${index.p95Ms}ms exceeds its 15000ms budget and is the highest p95 of all operations`, 'hq/lib/telemetry.mjs timingReport/budgetReport'));
      findings.push(finding('budgetReport flags at least one over-budget operation (index p95 > 15000ms budget)', 'hq/lib/telemetry.mjs budgetReport'));
      return findings;
    } finally {
      db.close();
    }
  },
});
