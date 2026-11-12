// AII scenario HQ-091 (group K, P1): "Which background processes consume resources without delivering useful results?"
// Engine: hq/lib/seat-heartbeat.mjs backgroundConsumers (line 292) + hq/lib/telemetry.mjs wastedConsumption (line 427).
// Status: gap (hq/aii/assessments/lane-10.json); this fixture closes it, promoting to covered_verified via the receipt.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - `bun hq/bin/hq.mjs seat list` (exit 0): chatgpt/gemini/claude/channel-manager all IDLE — seat liveness only,
//     no OS process inventory (that is HQ-031/HQ-032's machine probe).
//   - `bun hq/bin/hq.mjs timing budgets` (exit 0): index p95 313477.767ms over its 15000ms budget — the most
//     expensive operation, consuming time the ledger shows no result evidence for.
//   - `bun hq/bin/hq.mjs zcode-doctor` (exit 0): seats 0 active / 3 idle — confirms seat-liveness-only observability.
//
// run() re-derives findings from a synthetic seat roster (injected clock 2026-11-11T12:00:00Z) plus seeded
// timing spans in a throwaway in-memory db: chatgpt is idle but consumed 1200 tokens / 45000ms cpu with 0
// results (a background consumer without result), and the index operation exceeds budget while recording no
// result evidence (wasted consumption). Read-only probes only; nothing is written to any shared ledger.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { summarize, backgroundConsumers } from '../../lib/seat-heartbeat.mjs';
import { recordTiming, wastedConsumption } from '../../lib/telemetry.mjs';

const NOW = '2026-11-11T12:00:00Z';
const SEATS = [
  { id: 'chatgpt', lastSeenAt: '2026-11-11T11:50:00Z', tokens: 1200, cpuMs: 45000, results: 0 },
  { id: 'gemini', lastSeenAt: '2026-11-11T11:25:00Z', tokens: 0, cpuMs: 0, results: 0 },
  { id: 'claude', lastSeenAt: '2026-11-11T11:59:00Z', tokens: 0, cpuMs: 0, results: 0 },
  { id: 'channel-manager' },
];

function span(db, durationMs, ok) {
  recordTiming(db, { operation: 'index', startedAt: NOW, durationMs, ok, bytes: 0, tokens: 0, meta: null });
}

export default defineFixture({
  id: 'HQ-091',
  provenance:
    'Locked 2026-11-11 (this session): seat-heartbeat summarize/backgroundConsumers (hq/lib/seat-heartbeat.mjs:179/:292) ' +
    'join seat liveness with consumption and results; telemetry wastedConsumption (hq/lib/telemetry.mjs:427) joins budget ' +
    'violations with result evidence. Real anchors this session: `hq seat list` reports chatgpt/gemini/claude/channel-manager ' +
    'all IDLE and `hq timing budgets` reports index p95 313477.767ms over the 15000ms budget. run() re-derives findings live ' +
    'from a synthetic roster and seeded in-memory spans; nothing is written.',
  expected: [
    { what: 'seats report chatgpt idle, gemini stale, claude busy, channel-manager unknown (seat liveness, not OS process inventory)', where: 'hq/lib/seat-heartbeat.mjs summarize' },
    { what: 'background consumer without result: chatgpt consumed 1200 tokens and 45000ms cpu but delivered 0 results', where: 'hq/lib/seat-heartbeat.mjs backgroundConsumers' },
    { what: 'wasted consumption: index exceeds its 15000ms budget and records no result evidence (wasted operation)', where: 'hq/lib/telemetry.mjs wastedConsumption' },
  ],
  run: async () => {
    const findings = [];

    // Seat liveness joined to consumption: who consumed resources without delivering a result.
    const beat = summarize({ seats: SEATS, now: NOW });
    const states = new Map(beat.seats.map((s) => [s.seat, s.state]));
    if (states.get('chatgpt') !== 'idle' || states.get('gemini') !== 'stale' || states.get('claude') !== 'busy' || states.get('channel-manager') !== 'unknown') {
      throw new Error(`unexpected seat states: ${JSON.stringify(beat.seats)}`);
    }
    const consumers = backgroundConsumers({ seats: SEATS, now: NOW });
    const chatgpt = consumers.consumers.find((c) => c.seat === 'chatgpt');
    if (!chatgpt || chatgpt.verdict !== 'consumer-without-result' || chatgpt.tokens !== 1200 || chatgpt.cpuMs !== 45000 || chatgpt.results !== 0) {
      throw new Error(`expected chatgpt consumer-without-result, got ${JSON.stringify(chatgpt)}`);
    }
    if (consumers.consumersWithoutResult.join(',') !== 'chatgpt') {
      throw new Error(`expected consumersWithoutResult [chatgpt], got ${JSON.stringify(consumers.consumersWithoutResult)}`);
    }

    // Timing ledger: index spans exceed budget and record no result evidence; one span flat-out failed.
    const db = openMemoryDb();
    try {
      span(db, 20000, true);
      span(db, 21000, true);
      span(db, 19000, true);
      span(db, 5000, false);

      const waste = wastedConsumption(db, { performance: { budgets: { index: 15000 } } }, { limit: 5000 });
      if (waste.totals.failedSpans !== 1 || waste.totals.noResultEvidenceSpans !== 3) {
        throw new Error(`unexpected waste totals: ${JSON.stringify(waste.totals)}`);
      }
      const indexWaste = waste.wastefulOperations.find((o) => o.operation === 'index');
      if (!indexWaste || indexWaste.p95Ms !== 21000 || indexWaste.budgetMs !== 15000
        || indexWaste.noResultEvidenceSpans !== 3
        || indexWaste.reason !== 'the operation exceeded its budget and recorded no result evidence') {
        throw new Error(`expected index wasteful operation, got ${JSON.stringify(indexWaste)}`);
      }

      findings.push(finding('seats report chatgpt idle, gemini stale, claude busy, channel-manager unknown (seat liveness, not OS process inventory)', 'hq/lib/seat-heartbeat.mjs summarize'));
      findings.push(finding('background consumer without result: chatgpt consumed 1200 tokens and 45000ms cpu but delivered 0 results', 'hq/lib/seat-heartbeat.mjs backgroundConsumers'));
      findings.push(finding('wasted consumption: index exceeds its 15000ms budget and records no result evidence (wasted operation)', 'hq/lib/telemetry.mjs wastedConsumption'));
      return findings;
    } finally {
      db.close();
    }
  },
});
