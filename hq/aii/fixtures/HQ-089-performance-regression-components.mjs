// hq/aii/fixtures/HQ-089-performance-regression-components.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-089 (group K, era 2, P1):
// "Which components are responsible for this performance regression?"
//
// Engine: hq/lib/telemetry.mjs componentAttribution() — the existing timing
// ledger extended with a component tag (recordTiming({ component })) and a
// baseline-vs-current attribution pass. Existing exports and behavior are
// unchanged; componentAttribution() is additive, no new authoritative engine.
//
// Provenance — ground truth LOCKED 2026-11-11 by running the real engine
// (bun <temp>/hq-gt-p1-perf.mjs, read-only, in-memory DB) over two seeded
// ledgers. Pinned live output:
//
//   Case 1 — operation "index", budget 15000ms (defaultConfig), baseline window
//   before 2026-11-01T12:00:00.000Z:
//     baseline: 15 spans, totalMs 7530, p95Ms 904
//     current:  16 spans, totalMs 49230, p95Ms 9004
//     regressionMs 8100
//     components:
//       hq/lib/indexer.mjs  baselineP95 904  currentP95 9004  deltaP95 +8100  share 0.914
//       hq/lib/graph.mjs    baselineP95 404  currentP95  404  deltaP95     0  share 0.041
//       hq/lib/context.mjs  baselineP95 204  currentP95  204  deltaP95     0  share 0.021
//     unattributed: 1 span, 1200ms, share 0.024  (a span that names no component
//       is reported as unattributed, never folded into a component)
//     responsible: hq/lib/indexer.mjs — "own p95 grew against the baseline",
//       currentP95Ms 9004, deltaP95Ms 8100
//
//   Case 2 — operation "search", budget 250ms (defaultConfig):
//     current p95 904ms is over the 250ms budget; the attribution answers by the
//     over-budget rule rather than by growth:
//       hq/lib/find.mjs  currentP95 904  overBudget true   share 0.856  (blamed)
//       hq/lib/rank.mjs  currentP95 154  overBudget false  share 0.144  (not blamed)
//     responsible: hq/lib/find.mjs — "own p95 exceeds the operation budget",
//       currentP95Ms 904, deltaP95Ms 0
//
//   Case 3 — the LIVE workspace ledger (.hq/index.db, 36 spans at lock time):
//     componentAttribution() over the live DB reports 0 components and 36
//     unattributed spans (share 1): no production span carries a component tag
//     yet. That explicit zero is the live evidence, and it is re-derived live.
//
// Synthetic/seeded data only — no credentials, no private session content.
// Spans are seeded into an in-memory DB; the live case only READS .hq/index.db.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { defaultConfig } from '../../lib/registry.mjs';
import { recordTiming, componentAttribution } from '../../lib/telemetry.mjs';

const BASELINE_AT = '2026-11-01T00:00:00.000Z';
const CURRENT_AT = '2026-11-02T00:00:00.000Z';
const SPLIT = '2026-11-01T12:00:00.000Z';

export default defineFixture({
  id: 'HQ-089',
  provenance: `Ground truth locked 2026-11-11 by running the real hq/lib/telemetry.mjs componentAttribution() engine (read-only, in-memory DB) over two seeded ledgers and over the live .hq/index.db. Pinned live output: case 1 (operation index, budget 15000ms) — baseline 15 spans / p95 904ms, current 16 spans / p95 9004ms, regressionMs 8100, components hq/lib/indexer.mjs (baselineP95 904, currentP95 9004, deltaP95 +8100, share 0.914), hq/lib/graph.mjs (404/404, delta 0, share 0.041), hq/lib/context.mjs (204/204, delta 0, share 0.021), unattributed 1 span / 1200ms / share 0.024, responsible hq/lib/indexer.mjs with reason "own p95 grew against the baseline" (currentP95Ms 9004, deltaP95Ms 8100). Case 2 (operation search, budget 250ms) — hq/lib/find.mjs currentP95 904ms overBudget true share 0.856, hq/lib/rank.mjs currentP95 154ms overBudget false share 0.144, responsible hq/lib/find.mjs with reason "own p95 exceeds the operation budget" (currentP95Ms 904, deltaP95Ms 0). Case 3 (live .hq/index.db, 36 spans at lock time) — 0 components and 36 unattributed spans, share 1: no production span carries a component tag yet. Synthetic/seeded spans only, no credentials, no private session content; expected shapes pinned to live module output, nothing hard-coded beyond them.`,
  expected: [
    // --- case 1: a component regressed against the baseline ---
    { what: 'hq.timing-component-attribution/1', where: 'hq/lib/telemetry.mjs' },
    { what: 'operation index regressed by 8100ms of p95 against its baseline', where: 'hq/lib/telemetry.mjs' },
    { what: 'hq/lib/indexer.mjs is responsible: own p95 grew against the baseline (p95 9004ms, +8100ms)', where: 'hq/lib/telemetry.mjs' },
    { what: 'hq/lib/indexer.mjs accounts for 0.914 of the current window time', where: 'hq/lib/telemetry.mjs' },
    { what: 'hq/lib/graph.mjs did not regress (p95 404ms in both windows) and is not blamed', where: 'hq/lib/telemetry.mjs' },
    { what: 'hq/lib/context.mjs did not regress (p95 204ms in both windows) and is not blamed', where: 'hq/lib/telemetry.mjs' },
    { what: '1 span (1200ms) names no component and is reported as unattributed, not folded into a component', where: 'hq/lib/telemetry.mjs' },
    // --- case 2: a component over its own budget, with no growth ---
    { what: 'operation search is over its 250ms budget', where: 'hq/lib/telemetry.mjs' },
    { what: 'hq/lib/find.mjs is responsible: own p95 exceeds the operation budget (p95 904ms)', where: 'hq/lib/telemetry.mjs' },
    { what: 'hq/lib/rank.mjs is within budget (p95 154ms) and is not blamed', where: 'hq/lib/telemetry.mjs' },
    // --- case 3: the live ledger, re-derived live ---
    { what: /^\d+ live spans are recorded in the workspace timing ledger$/, where: 'hq/lib/telemetry.mjs' },
    { what: /^every live span is accounted for by the attribution: \d+ name a component, \d+ are unattributed$/, where: 'hq/lib/telemetry.mjs' },
    { what: /^\d+ live spans are unattributed because none names a component$/, where: 'hq/lib/telemetry.mjs' },
  ],
  run: async () => {
    const findings = [];
    const config = defaultConfig();

    // --- case 1: operation "index", one component regressed -------------------
    {
      const db = openMemoryDb();
      try {
        for (let i = 0; i < 5; i++) {
          recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 900 + i, startedAt: BASELINE_AT, ok: true, component: 'hq/lib/indexer.mjs' });
          recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 400 + i, startedAt: BASELINE_AT, ok: true, component: 'hq/lib/graph.mjs' });
          recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 200 + i, startedAt: BASELINE_AT, ok: true, component: 'hq/lib/context.mjs' });
        }
        for (let i = 0; i < 5; i++) {
          recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 9000 + i, startedAt: CURRENT_AT, ok: true, component: 'hq/lib/indexer.mjs' });
          recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 400 + i, startedAt: CURRENT_AT, ok: true, component: 'hq/lib/graph.mjs' });
          recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 200 + i, startedAt: CURRENT_AT, ok: true, component: 'hq/lib/context.mjs' });
        }
        // One span that names no component at all.
        recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 1200, startedAt: CURRENT_AT, ok: true });

        const r = componentAttribution(db, config, { operation: 'index', baselineSince: SPLIT });
        if (r.schema !== 'hq.timing-component-attribution/1') throw new Error(`unexpected attribution schema: ${r.schema}`);
        findings.push(finding(r.schema, 'hq/lib/telemetry.mjs'));
        findings.push(finding(`operation ${r.operation} regressed by ${r.regressionMs}ms of p95 against its baseline`, 'hq/lib/telemetry.mjs'));

        const byName = new Map(r.components.map((c) => [c.component, c]));
        const indexer = byName.get('hq/lib/indexer.mjs');
        if (!indexer) throw new Error('hq/lib/indexer.mjs missing from the component attribution');
        const blamed = r.responsible.map((x) => x.component);
        if (blamed.length !== 1 || blamed[0] !== 'hq/lib/indexer.mjs') {
          throw new Error(`expected hq/lib/indexer.mjs to be the only responsible component, got ${JSON.stringify(r.responsible)}`);
        }
        findings.push(finding(
          `hq/lib/indexer.mjs is responsible: ${r.responsible[0].reason} (p95 ${r.responsible[0].currentP95Ms}ms, +${r.responsible[0].deltaP95Ms}ms)`,
          'hq/lib/telemetry.mjs',
        ));
        findings.push(finding(`hq/lib/indexer.mjs accounts for ${indexer.shareOfCurrentMs} of the current window time`, 'hq/lib/telemetry.mjs'));

        for (const name of ['hq/lib/graph.mjs', 'hq/lib/context.mjs']) {
          const c = byName.get(name);
          if (!c) throw new Error(`${name} missing from the component attribution`);
          if (c.deltaP95Ms !== 0) throw new Error(`${name} was expected not to regress, deltaP95Ms=${c.deltaP95Ms}`);
          if (blamed.includes(name)) throw new Error(`${name} was expected not to be blamed`);
          findings.push(finding(`${name} did not regress (p95 ${c.baselineP95Ms}ms in both windows) and is not blamed`, 'hq/lib/telemetry.mjs'));
        }

        if (r.unattributed.spans !== 1 || r.unattributed.totalMs !== 1200) {
          throw new Error(`expected 1 unattributed span of 1200ms, got ${JSON.stringify(r.unattributed)}`);
        }
        findings.push(finding(
          `${r.unattributed.spans} span (${r.unattributed.totalMs}ms) names no component and is reported as unattributed, not folded into a component`,
          'hq/lib/telemetry.mjs',
        ));
      } finally {
        db.close();
      }
    }

    // --- case 2: operation "search", a component over its own budget ---------
    {
      const db = openMemoryDb();
      try {
        for (let i = 0; i < 5; i++) {
          recordTiming(db, { operation: 'search', project: null, durationMs: 900 + i, startedAt: BASELINE_AT, ok: true, component: 'hq/lib/find.mjs' });
          recordTiming(db, { operation: 'search', project: null, durationMs: 150 + i, startedAt: BASELINE_AT, ok: true, component: 'hq/lib/rank.mjs' });
        }
        for (let i = 0; i < 5; i++) {
          recordTiming(db, { operation: 'search', project: null, durationMs: 900 + i, startedAt: CURRENT_AT, ok: true, component: 'hq/lib/find.mjs' });
          recordTiming(db, { operation: 'search', project: null, durationMs: 150 + i, startedAt: CURRENT_AT, ok: true, component: 'hq/lib/rank.mjs' });
        }

        const r = componentAttribution(db, config, { operation: 'search', baselineSince: SPLIT });
        if (!r.overBudget) throw new Error('operation search was expected to be over its budget');
        findings.push(finding(`operation ${r.operation} is over its ${r.budgetMs}ms budget`, 'hq/lib/telemetry.mjs'));

        const blamed = r.responsible.map((x) => x.component);
        if (blamed.length !== 1 || blamed[0] !== 'hq/lib/find.mjs') {
          throw new Error(`expected hq/lib/find.mjs to be the only responsible component, got ${JSON.stringify(r.responsible)}`);
        }
        findings.push(finding(
          `hq/lib/find.mjs is responsible: ${r.responsible[0].reason} (p95 ${r.responsible[0].currentP95Ms}ms)`,
          'hq/lib/telemetry.mjs',
        ));

        const rank = byNameOf(r, 'hq/lib/rank.mjs');
        if (rank.overBudget) throw new Error('hq/lib/rank.mjs was expected to be within budget');
        if (blamed.includes('hq/lib/rank.mjs')) throw new Error('hq/lib/rank.mjs was expected not to be blamed');
        findings.push(finding(`hq/lib/rank.mjs is within budget (p95 ${rank.currentP95Ms}ms) and is not blamed`, 'hq/lib/telemetry.mjs'));
      } finally {
        db.close();
      }
    }

    // --- case 3: the live workspace ledger, re-derived live -------------------
    {
      const { openDb } = await import('../../lib/schema.mjs');
      const { resolve, dirname, join } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
      const db = openDb(join(ROOT, '.hq', 'index.db'));
      try {
        const live = componentAttribution(db, config, {});
        const liveTotal = Number(db.prepare('SELECT count(*) AS c FROM timings').get()?.c ?? 0);
        if (live.current.spans !== liveTotal) {
          throw new Error(`live attribution covered ${live.current.spans} of ${liveTotal} live spans`);
        }
        // Every live span is accounted for: named to a component or reported
        // unattributed. Nothing is dropped and nothing is invented.
        const named = live.components.reduce((sum, c) => sum + c.currentSpans, 0);
        if (named + live.unattributed.spans !== liveTotal) {
          throw new Error(`live attribution accounted for ${named + live.unattributed.spans} of ${liveTotal} live spans`);
        }
        findings.push(finding(`${liveTotal} live spans are recorded in the workspace timing ledger`, 'hq/lib/telemetry.mjs'));
        findings.push(finding(`every live span is accounted for by the attribution: ${named} name a component, ${live.unattributed.spans} are unattributed`, 'hq/lib/telemetry.mjs'));
        findings.push(finding(`${live.unattributed.spans} live spans are unattributed because none names a component`, 'hq/lib/telemetry.mjs'));
      } finally {
        db.close();
      }
    }

    return findings;
  },
});

function byNameOf(report, name) {
  const row = report.components.find((c) => c.component === name);
  if (!row) throw new Error(`${name} missing from the component attribution`);
  return row;
}
