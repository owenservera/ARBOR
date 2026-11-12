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
      }
      findings.push(finding(`index latency is ${indexRow.ratio.toFixed(0)}x its budget — re-indexing dominates retrieval latency`.replace(/\d+x/, `${Math.floor(indexRow.ratio)}x`), 'hq/lib/telemetry.mjs budgetReport'));

      const stale = await collectStaleFiles({ db, config, projects: projectsForIndex(ROOT) });
      const reasons = [...new Set(stale.map((s) => s.reason))].sort();
      if (reasons.join(', ') !== 'changed, deleted, new') {
        throw new Error(`unexpected staleness reasons: ${reasons.join(', ')}`);
      }
      findings.push(finding(`staleness reasons detected against the index: ${reasons.join(', ')}`, 'hq/lib/freshness.mjs collectStaleFiles'));
      findings.push(finding(`${stale.length} stale entries detected across the indexed projects`, 'hq/lib/freshness.mjs collectStaleFiles'));
      findings.push(finding('stale sources are exactly the index-vs-disk drift: new, changed, deleted files', 'hq/lib/freshness.mjs collectStaleFiles'));

      const dayMs = Date.parse('2026-11-10T00:00:00.000Z');
      const seededRows = [
        { session_id: 's1', model: 'm1', agent: 'a1', started_at: dayMs, input_tokens: 900000, output_tokens: 100000, reasoning_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, status: 'completed' },
        { session_id: 's1', model: 'm1', agent: 'a1', started_at: dayMs + 3600000, input_tokens: 800000, output_tokens: 50000, reasoning_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, status: 'completed' },
      ];
      const c = census(seededRows, { now: Date.parse('2026-11-11T00:00:00.000Z') });
      if (c.totalTokens !== 1850000 || !c.byDay.length || !c.byModel.length || !c.byAgent.length) {
        throw new Error(`unexpected census: ${JSON.stringify({ total: c.totalTokens, day: c.byDay.length, model: c.byModel.length, agent: c.byAgent.length })}`);
      }
      findings.push(finding('the token census aggregates input, output and total tokens by day, model and agent', 'hq/lib/context-budget.mjs census'));
    } finally {
      db.close();
    }

    return findings;
  },
});
