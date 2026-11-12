// hq/aii/fixtures/HQ-091-background-process-consumption.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-091 (group K, era 2, P1):
// "Which background processes consume resources without delivering useful results?"
//
// Engines: the two existing engines this scenario's gap named, extended in place:
//   - hq/lib/seat-heartbeat.mjs backgroundConsumers() — joins seat liveness to
//     what a seat consumed and what it delivered, so a seat that took resources
//     and produced nothing is named a background consumer;
//   - hq/lib/telemetry.mjs wastedConsumption() — attributes the same question to
//     HQ's own background operations, separating spans that failed from spans
//     that recorded no result evidence, and names the operations that exceeded
//     their budget while doing so.
// Existing exports and behavior unchanged; both functions are additive, no new
// authoritative engine.
//
// Provenance — ground truth LOCKED 2026-11-11 by running the real engines
// (bun <temp>/hq-gt-p1-perf.mjs, read-only, in-memory DB) over a seeded ledger
// and a seeded roster. Pinned live output:
//
//   Case 1 — wastedConsumption over a seeded ledger (5 spans):
//     totals: spans 5, failedSpans 1 (failedMs 9000), noResultEvidenceSpans 2
//       (noResultEvidenceMs 20300), deliveredSpans 2 (deliveredMs 16200),
//       wastedMs 29300, wastedSpans 3
//     operations:
//       index    p95 20000ms budget 15000ms overBudget true ratio 1.333
//                noResultEvidenceSpans 1, noResultEvidenceMs 20000
//       verify   p95  9000ms budget  2000ms overBudget true ratio 4.5
//                failedSpans 1, failedMs 9000
//       search   p95   300ms budget   250ms overBudget true ratio 1.2
//                noResultEvidenceSpans 1, noResultEvidenceMs 300
//       context  p95  1200ms budget   600ms overBudget true ratio 2
//                but it DELIVERED (bytes + tokens) so it is not wasteful
//     wastefulOperations: index (p95 20000ms, budget 15000ms, ratio 1.333) and
//       search (p95 300ms, budget 250ms, ratio 1.2) — both exceeded their
//       budget while recording no result evidence. verify is excluded from that
//       list because its waste is a failure, not an absence of result evidence.
//
//   Case 2 — backgroundConsumers over a seeded roster (now 2026-11-04T12:00:00Z,
//     thresholds lastTurnMs 120000 / idleMs 900000):
//     counts: total 5, working 1, consumer-without-result 2, delivered 0,
//       idle 1, unknown 1
//     seat-active      busy   60000ms  tokens 180000 results 2 -> working
//       (a running turn may still deliver: no verdict is drawn about its result)
//     seat-idle        idle  300000ms  tokens  45000 results 0 -> consumer-without-result
//     seat-stale       stale 1200000ms  tokens  90000 results 0 -> consumer-without-result
//     seat-quiet       idle  300000ms  tokens      0 results 0 -> idle
//     seat-unreadable  unknown (no observation) -> unknown, never blamed
//     consumersWithoutResult: seat-idle, seat-stale
//
//   Case 3 — the LIVE workspace ledger (.hq/index.db, 36 spans at lock time):
//     the live ledger holds operations over budget that recorded no result
//     evidence (index p95 313477.767ms against a 15000ms budget at lock time),
//     and 2 spans that recorded ok = 0 (verify, 143969.659ms). The exact live
//     numbers move as concurrent lanes record spans, so the live expectations
//     pin the SHAPE and the counts are re-derived live.
//
// Synthetic/seeded data only — no credentials, no private session content.
// The live case only READS .hq/index.db.
import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { defaultConfig } from '../../lib/registry.mjs';
import { recordTiming, wastedConsumption } from '../../lib/telemetry.mjs';
import { backgroundConsumers } from '../../lib/seat-heartbeat.mjs';

const SPAN_AT = '2026-11-02T00:00:00.000Z';
const NOW = '2026-11-04T12:00:00.000Z';
const NOW_MS = Date.parse(NOW);
const ago = (ms) => new Date(NOW_MS - ms).toISOString();

export default defineFixture({
  id: 'HQ-091',
  provenance: `Ground truth locked 2026-11-11 by running the real hq/lib/telemetry.mjs wastedConsumption() and hq/lib/seat-heartbeat.mjs backgroundConsumers() engines (read-only, in-memory DB) over a seeded ledger and a seeded roster, plus a live read of .hq/index.db. Pinned live output: case 1 (seeded ledger, 5 spans) — totals spans 5, failedSpans 1 (failedMs 9000), noResultEvidenceSpans 2 (noResultEvidenceMs 20300), deliveredSpans 2 (deliveredMs 16200), wastedMs 29300, wastedSpans 3; operations index p95 20000ms / budget 15000ms / ratio 1.333 / noResultEvidenceMs 20000, verify p95 9000ms / budget 2000ms / ratio 4.5 / failedMs 9000, search p95 300ms / budget 250ms / ratio 1.2 / noResultEvidenceMs 300, context p95 1200ms / budget 600ms over budget but DELIVERED so not wasteful; wastefulOperations = index and search. Case 2 (seeded roster, now 2026-11-04T12:00:00.000Z, thresholds 120000/900000) — counts total 5, working 1, consumer-without-result 2, delivered 0, idle 1, unknown 1; seat-active busy 60000ms tokens 180000 results 2 -> working, seat-idle idle 300000ms tokens 45000 results 0 -> consumer-without-result, seat-stale stale 1200000ms tokens 90000 results 0 -> consumer-without-result, seat-quiet idle 300000ms tokens 0 results 0 -> idle, seat-unreadable -> unknown and never blamed; consumersWithoutResult = seat-idle, seat-stale. Case 3 (live .hq/index.db, 36 spans at lock time) — the live ledger carries operations over budget that recorded no result evidence (index p95 313477.767ms against a 15000ms budget) and 2 spans recorded ok = 0 (verify, 143969.659ms); live counts move as concurrent lanes record spans, so the live expectations pin shape and re-derive counts. Synthetic/seeded spans and seats only, no credentials, no private session content.`,
  expected: [
    // --- case 1: operation-side consumption attribution ---
    { what: 'hq.timing-wasted-consumption/1', where: 'hq/lib/telemetry.mjs' },
    { what: '1 seeded span recorded ok = 0 and is reported as failed, not as an absence of result', where: 'hq/lib/telemetry.mjs' },
    { what: '2 seeded spans recorded no output bytes, tokens or structured evidence', where: 'hq/lib/telemetry.mjs' },
    { what: '2 seeded spans delivered a result and are not counted as waste', where: 'hq/lib/telemetry.mjs' },
    { what: '29300ms of seeded span time was consumed without delivering a result', where: 'hq/lib/telemetry.mjs' },
    { what: 'index is wasteful: it exceeded its 15000ms budget (p95 20000ms) while recording no result evidence', where: 'hq/lib/telemetry.mjs' },
    { what: 'search is wasteful: it exceeded its 250ms budget (p95 300ms) while recording no result evidence', where: 'hq/lib/telemetry.mjs' },
    { what: 'verify wasted 9000ms on a span that failed, which is reported separately from absent result evidence', where: 'hq/lib/telemetry.mjs' },
    { what: 'context exceeded its 600ms budget (p95 1200ms) but delivered a result, so it is not reported as wasteful', where: 'hq/lib/telemetry.mjs' },
    // --- case 2: seat-side consumption attribution ---
    { what: 'hq.seat-consumers/1', where: 'hq/lib/seat-heartbeat.mjs' },
    { what: 'seat-idle and seat-stale are the background consumers that consumed resources without delivering a result', where: 'hq/lib/seat-heartbeat.mjs' },
    { what: 'seat-idle consumed 45000 tokens and delivered 0 results while idle for 300000ms', where: 'hq/lib/seat-heartbeat.mjs' },
    { what: 'seat-stale consumed 90000 tokens and delivered 0 results while stale for 1200000ms', where: 'hq/lib/seat-heartbeat.mjs' },
    { what: 'seat-active is busy and is not judged: a running turn may still deliver a result', where: 'hq/lib/seat-heartbeat.mjs' },
    { what: 'seat-quiet is idle but consumed nothing, so it is not a consumer', where: 'hq/lib/seat-heartbeat.mjs' },
    { what: 'seat-unreadable has no readable observation and stays unknown, never blamed', where: 'hq/lib/seat-heartbeat.mjs' },
    // --- case 3: the live workspace ledger, re-derived live ---
    { what: /^\d+ live spans are recorded in the workspace timing ledger$/, where: 'hq/lib/telemetry.mjs' },
    { what: /^\d+ live spans recorded ok = 0 and consumed \d+(\.\d+)?ms without succeeding$/, where: 'hq/lib/telemetry.mjs' },
    { what: /^\d+ live spans recorded no output bytes, tokens or structured evidence$/, where: 'hq/lib/telemetry.mjs' },
    { what: /^\d+ live operations exceeded their budget while recording no result evidence$/, where: 'hq/lib/telemetry.mjs' },
    { what: 'the live ledger attributes its wasted time to index, the operation over budget with the largest wasted time', where: 'hq/lib/telemetry.mjs' },
  ],
  run: async () => {
    const findings = [];
    const config = defaultConfig();

    // --- case 1: operation-side consumption attribution -----------------------
    {
      const db = openMemoryDb();
      try {
        recordTiming(db, { operation: 'index', project: 'repos-hq', durationMs: 20000, startedAt: SPAN_AT, ok: true });
        recordTiming(db, { operation: 'index.project', project: 'vivim-ui', durationMs: 15000, startedAt: SPAN_AT, ok: true, meta: { added: 3, changed: 0, removed: 0 } });
        recordTiming(db, { operation: 'verify', project: null, durationMs: 9000, startedAt: SPAN_AT, ok: false });
        recordTiming(db, { operation: 'context', project: null, durationMs: 1200, startedAt: SPAN_AT, ok: true, bytes: 1700, tokens: 4500 });
        recordTiming(db, { operation: 'search', project: null, durationMs: 300, startedAt: SPAN_AT, ok: true });

        const r = wastedConsumption(db, config, {});
        if (r.schema !== 'hq.timing-wasted-consumption/1') throw new Error(`unexpected schema: ${r.schema}`);
        findings.push(finding(r.schema, 'hq/lib/telemetry.mjs'));

        const t = r.totals;
        if (t.failedSpans !== 1) throw new Error(`expected 1 failed span, got ${t.failedSpans}`);
        findings.push(finding(`${t.failedSpans} seeded span recorded ok = 0 and is reported as failed, not as an absence of result`, 'hq/lib/telemetry.mjs'));
        if (t.noResultEvidenceSpans !== 2) throw new Error(`expected 2 spans with no result evidence, got ${t.noResultEvidenceSpans}`);
        findings.push(finding(`${t.noResultEvidenceSpans} seeded spans recorded no output bytes, tokens or structured evidence`, 'hq/lib/telemetry.mjs'));
        if (t.deliveredSpans !== 2) throw new Error(`expected 2 delivered spans, got ${t.deliveredSpans}`);
        findings.push(finding(`${t.deliveredSpans} seeded spans delivered a result and are not counted as waste`, 'hq/lib/telemetry.mjs'));
        if (t.wastedMs !== 29300) throw new Error(`expected 29300ms of wasted time, got ${t.wastedMs}`);
        findings.push(finding(`${t.wastedMs}ms of seeded span time was consumed without delivering a result`, 'hq/lib/telemetry.mjs'));

        const wasteful = r.wastefulOperations.map((o) => o.operation);
        if (wasteful.length !== 2 || wasteful[0] !== 'index' || wasteful[1] !== 'search') {
          throw new Error(`expected index and search to be the wasteful operations, got ${JSON.stringify(wasteful)}`);
        }
        for (const op of r.wastefulOperations) {
          findings.push(finding(
            `${op.operation} is wasteful: it exceeded its ${op.budgetMs}ms budget (p95 ${op.p95Ms}ms) while recording no result evidence`,
            'hq/lib/telemetry.mjs',
          ));
        }

        const verify = r.operations.find((o) => o.operation === 'verify');
        if (!verify || verify.failedSpans !== 1 || verify.failedMs !== 9000) {
          throw new Error(`verify was expected to carry one failed span of 9000ms, got ${JSON.stringify(verify)}`);
        }
        findings.push(finding(`verify wasted ${verify.failedMs}ms on a span that failed, which is reported separately from absent result evidence`, 'hq/lib/telemetry.mjs'));

        const context = r.operations.find((o) => o.operation === 'context');
        if (!context || !context.overBudget) throw new Error(`context was expected to be over budget: ${JSON.stringify(context)}`);
        if (context.noResultEvidenceSpans !== 0 || context.wastedMs !== 0) {
          throw new Error(`context was expected to have delivered: ${JSON.stringify(context)}`);
        }
        if (r.wastefulOperations.some((o) => o.operation === 'context')) {
          throw new Error('context was expected not to be reported as wasteful');
        }
        findings.push(finding(
          `context exceeded its ${context.budgetMs}ms budget (p95 ${context.p95Ms}ms) but delivered a result, so it is not reported as wasteful`,
          'hq/lib/telemetry.mjs',
        ));
      } finally {
        db.close();
      }
    }

    // --- case 2: seat-side consumption attribution ----------------------------
    {
      const r = backgroundConsumers({
        now: NOW,
        thresholds: { lastTurnMs: 120000, idleMs: 900000 },
        seats: [
          { id: 'seat-active', lastSeenAt: ago(60_000), tokens: 180000, results: 2 },
          { id: 'seat-idle', lastSeenAt: ago(300_000), tokens: 45000, results: 0 },
          { id: 'seat-stale', lastSeenAt: ago(1_200_000), tokens: 90000, results: 0 },
          { id: 'seat-quiet', lastSeenAt: ago(300_000), tokens: 0, results: 0 },
          { id: 'seat-unreadable' },
        ],
      });
      if (r.schema !== 'hq.seat-consumers/1') throw new Error(`unexpected consumer schema: ${r.schema}`);
      findings.push(finding(r.schema, 'hq/lib/seat-heartbeat.mjs'));

      const without = r.consumersWithoutResult;
      if (without.length !== 2 || without[0] !== 'seat-idle' || without[1] !== 'seat-stale') {
        throw new Error(`expected seat-idle and seat-stale to be the consumers without a result, got ${JSON.stringify(without)}`);
      }
      findings.push(finding(`${without.join(' and ')} are the background consumers that consumed resources without delivering a result`, 'hq/lib/seat-heartbeat.mjs'));

      const bySeat = new Map(r.consumers.map((c) => [c.seat, c]));
      const idle = bySeat.get('seat-idle');
      if (idle.tokens !== 45000 || idle.results !== 0 || idle.state !== 'idle' || idle.ageMs !== 300000) {
        throw new Error(`seat-idle was expected to be idle 300000ms with 45000 tokens and 0 results: ${JSON.stringify(idle)}`);
      }
      findings.push(finding(`seat-idle consumed ${idle.tokens} tokens and delivered ${idle.results} results while idle for ${idle.ageMs}ms`, 'hq/lib/seat-heartbeat.mjs'));

      const stale = bySeat.get('seat-stale');
      if (stale.tokens !== 90000 || stale.results !== 0 || stale.state !== 'stale' || stale.ageMs !== 1_200_000) {
        throw new Error(`seat-stale was expected to be stale 1200000ms with 90000 tokens and 0 results: ${JSON.stringify(stale)}`);
      }
      findings.push(finding(`seat-stale consumed ${stale.tokens} tokens and delivered ${stale.results} results while stale for ${stale.ageMs}ms`, 'hq/lib/seat-heartbeat.mjs'));

      const active = bySeat.get('seat-active');
      if (active.verdict !== 'working') throw new Error(`seat-active was expected to be working, got ${active.verdict}`);
      findings.push(finding('seat-active is busy and is not judged: a running turn may still deliver a result', 'hq/lib/seat-heartbeat.mjs'));

      const quiet = bySeat.get('seat-quiet');
      if (quiet.verdict !== 'idle' || quiet.consumed !== false) {
        throw new Error(`seat-quiet was expected to be an idle non-consumer: ${JSON.stringify(quiet)}`);
      }
      findings.push(finding('seat-quiet is idle but consumed nothing, so it is not a consumer', 'hq/lib/seat-heartbeat.mjs'));

      const unreadable = bySeat.get('seat-unreadable');
      if (unreadable.verdict !== 'unknown') throw new Error(`seat-unreadable was expected to be unknown, got ${unreadable.verdict}`);
      if (r.consumersWithoutResult.includes('seat-unreadable')) throw new Error('seat-unreadable was expected not to be blamed');
      findings.push(finding('seat-unreadable has no readable observation and stays unknown, never blamed', 'hq/lib/seat-heartbeat.mjs'));
    }

    // --- case 3: the live workspace ledger, re-derived live -------------------
    {
      const { openDb } = await import('../../lib/schema.mjs');
      const { resolve, dirname, join } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
      const db = openDb(join(ROOT, '.hq', 'index.db'));
      try {
        const live = wastedConsumption(db, config, {});
        const liveTotal = Number(db.prepare('SELECT count(*) AS c FROM timings').get()?.c ?? 0);
        if (live.totals.spans !== liveTotal) {
          throw new Error(`live accounting covered ${live.totals.spans} of ${liveTotal} live spans`);
        }
        findings.push(finding(`${liveTotal} live spans are recorded in the workspace timing ledger`, 'hq/lib/telemetry.mjs'));
        findings.push(finding(`${live.totals.failedSpans} live spans recorded ok = 0 and consumed ${live.totals.failedMs}ms without succeeding`, 'hq/lib/telemetry.mjs'));
        findings.push(finding(`${live.totals.noResultEvidenceSpans} live spans recorded no output bytes, tokens or structured evidence`, 'hq/lib/telemetry.mjs'));

        if (!live.wastefulOperations.length) {
          throw new Error('the live ledger was expected to carry at least one wasteful operation');
        }
        findings.push(finding(`${live.wastefulOperations.length} live operations exceeded their budget while recording no result evidence`, 'hq/lib/telemetry.mjs'));

        // The largest wasted time in the live ledger names the operation to look at.
        const worst = live.operations[0];
        const top = live.wastefulOperations[0];
        if (worst.operation !== top.operation) {
          throw new Error(`the largest live consumer (${worst.operation}) was expected to be the top wasteful operation (${top.operation})`);
        }
        findings.push(finding(
          `the live ledger attributes its wasted time to ${top.operation}, the operation over budget with the largest wasted time`,
          'hq/lib/telemetry.mjs',
        ));
      } finally {
        db.close();
      }
    }

    return findings;
  },
});
