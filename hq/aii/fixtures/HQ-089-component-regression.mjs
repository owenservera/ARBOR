// AII scenario HQ-089 (group K, P1): "Which components are responsible for this performance regression?"
// Engine: hq/lib/telemetry.mjs componentAttribution (hq/lib/telemetry.mjs:288) — already implemented;
// this fixture verifies it. Per hq/aii/assessments/lane-9.json HQ-089 is a gap whose fixture closes it.
//
// Ground truth LOCKED 2026-11-11 (this session) from seeded timing spans in an in-memory db:
//   - baseline window (before 2026-11-11T10:00:00Z): indexer p95 110ms over 3 index spans; router 60ms.
//   - current window (from 2026-11-11T10:00:00Z on): indexer p95 21000ms over 3 index spans
//     (19000/20000/21000) — over the 15000ms index budget; router 65ms (grew 5ms but stays within budget);
//     2 index spans name no component at all (meta null).
//   - Expected attribution: indexer responsible ("own p95 exceeds the operation budget"); router listed
//     but not blamed (blame falls on over-budget components first); untagged spans reported as
//     unattributed, never folded into a component.
//
// run() re-derives attribution from the seeded spans; no workspace writes, no ledger mutation outside
// the throwaway in-memory db.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { recordTiming, componentAttribution } from '../../lib/telemetry.mjs';

const BASELINE_SINCE = '2026-11-11T10:00:00Z';
const CONFIG = { performance: { budgets: { index: 15000 } } };

function span(db, startedAt, durationMs, component) {
  recordTiming(db, {
    operation: 'index', startedAt, durationMs, ok: true, bytes: 0, tokens: 0,
    meta: component == null ? null : { source: 'seeded-span' },
    component,
  });
}

export default defineFixture({
  id: 'HQ-089',
  provenance:
    'Locked 2026-11-11 (this session): hq/lib/telemetry.mjs componentAttribution (line 288) attributes ' +
    'performance regressions to components from the timing ledger. Ground truth is seeded in a throwaway ' +
    'in-memory db (openMemoryDb): baseline indexer p95 110ms vs current 21000ms over the 15000ms budget, ' +
    'router 60ms -> 65ms (within budget), plus 2 untagged spans. run() re-derives attribution live; nothing ' +
    'is written to any shared ledger.',
  expected: [
    { what: 'component indexer is responsible for the index regression: current p95 21000ms exceeds the 15000ms budget', where: 'hq/lib/telemetry.mjs componentAttribution' },
    { what: 'component router is listed but NOT blamed: baseline 60ms -> current 65ms, within budget; blame falls on over-budget components first', where: 'hq/lib/telemetry.mjs componentAttribution' },
    { what: 'spans naming no component are reported as unattributed: 2 spans, never folded into indexer or router', where: 'hq/lib/telemetry.mjs componentAttribution + spanComponent' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      // Baseline window: indexer 90/100/110ms (p95 110), router 60ms.
      span(db, '2026-11-11T09:00:00Z', 90, 'indexer');
      span(db, '2026-11-11T09:01:00Z', 100, 'indexer');
      span(db, '2026-11-11T09:02:00Z', 110, 'indexer');
      span(db, '2026-11-11T09:00:00Z', 60, 'router');
      // Current window: indexer regresses to 19000/20000/21000ms (p95 21000 > 15000ms budget);
      // router grows slightly to 65ms; two spans name no component.
      span(db, '2026-11-11T10:00:00Z', 19000, 'indexer');
      span(db, '2026-11-11T10:01:00Z', 20000, 'indexer');
      span(db, '2026-11-11T10:02:00Z', 21000, 'indexer');
      span(db, '2026-11-11T10:00:00Z', 65, 'router');
      span(db, '2026-11-11T10:03:00Z', 100, null);
      span(db, '2026-11-11T10:04:00Z', 120, null);

      const result = componentAttribution(db, CONFIG, {
        operation: 'index', baselineSince: BASELINE_SINCE, limit: 5000,
      });

      if (result.schema !== 'hq.timing-component-attribution/1') {
        throw new Error(`unexpected attribution schema: ${result.schema}`);
      }
      if (result.regressionMs === null || result.regressionMs !== 20890) {
        throw new Error(`expected regressionMs 20890, got ${result.regressionMs}`);
      }
      if (result.unattributed.spans !== 2) {
        throw new Error(`expected 2 unattributed spans, got ${result.unattributed.spans}`);
      }
      const byComponent = new Map(result.components.map((c) => [c.component, c]));
      const indexer = byComponent.get('indexer');
      if (!indexer || indexer.currentP95Ms !== 21000 || indexer.overBudget !== true) {
        throw new Error(`expected indexer over budget at p95 21000, got ${JSON.stringify(indexer)}`);
      }
      const router = byComponent.get('router');
      if (!router || router.currentP95Ms !== 65 || router.overBudget !== false) {
        throw new Error(`expected router within budget at 65ms, got ${JSON.stringify(router)}`);
      }
      const responsible = result.responsible.map((r) => r.component);
      if (responsible.length !== 1 || responsible[0] !== 'indexer') {
        throw new Error(`expected only indexer responsible, got ${JSON.stringify(responsible)}`);
      }
      if (result.responsible[0].reason !== 'own p95 exceeds the operation budget') {
        throw new Error(`unexpected reason: ${result.responsible[0].reason}`);
      }

      findings.push(finding('component indexer is responsible for the index regression: current p95 21000ms exceeds the 15000ms budget', 'hq/lib/telemetry.mjs componentAttribution'));
      findings.push(finding('component router is listed but NOT blamed: baseline 60ms -> current 65ms, within budget; blame falls on over-budget components first', 'hq/lib/telemetry.mjs componentAttribution'));
      findings.push(finding('spans naming no component are reported as unattributed: 2 spans, never folded into indexer or router', 'hq/lib/telemetry.mjs componentAttribution + spanComponent'));
      return findings;
    } finally {
      db.close();
    }
  },
});
