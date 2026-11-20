# File: hq/aii/fixtures/HQ-091-background-process-consumption.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-091-background-process-consumption.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18699 B |
| Lines | 251 |
| Hash | 98598da08862 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SPAN_AT | const | 65 | no | const SPAN_AT = &#39;2026-11-02T00:00:00.000Z&#39;; |
| NOW | const | 66 | no | const NOW = &#39;2026-11-04T12:00:00.000Z&#39;; |
| NOW_MS | const | 67 | no | const NOW_MS = Date.parse(NOW); |
| ago | function | 68 | no | const ago = (ms) =&gt; new Date(NOW_MS - ms).toISOString(); |
| findings | const | 100 | no | const findings = []; |
| config | const | 101 | no | const config = defaultConfig(); |
| db | const | 105 | no | const db = openMemoryDb(); |
| r | const | 113 | no | const r = wastedConsumption(db, config, {}); |
| t | const | 117 | no | const t = r.totals; |
| wasteful | const | 127 | no | const wasteful = r.wastefulOperations.map((o) =&gt; o.operation); |
| verify | const | 138 | no | const verify = r.operations.find((o) =&gt; o.operation === &#39;verify&#39;); |
| context | const | 144 | no | const context = r.operations.find((o) =&gt; o.operation === &#39;context&#39;); |
| r | const | 163 | no | const r = backgroundConsumers({ now: NOW, thresholds: { lastTurnMs: 120000, idleMs: 900000 }, seats: [ { id: &#39;seat-active&#39;, lastSeenAt: ago(60_000), tokens: 180000, results: 2 }, |
| without | const | 177 | no | const without = r.consumersWithoutResult; |
| bySeat | const | 183 | no | const bySeat = new Map(r.consumers.map((c) =&gt; [c.seat, c])); |
| idle | const | 184 | no | const idle = bySeat.get(&#39;seat-idle&#39;); |
| stale | const | 190 | no | const stale = bySeat.get(&#39;seat-stale&#39;); |
| active | const | 196 | no | const active = bySeat.get(&#39;seat-active&#39;); |
| quiet | const | 200 | no | const quiet = bySeat.get(&#39;seat-quiet&#39;); |
| unreadable | const | 206 | no | const unreadable = bySeat.get(&#39;seat-unreadable&#39;); |
| ROOT | const | 217 | no | const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| db | const | 218 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| live | const | 220 | no | const live = wastedConsumption(db, config, {}); |
| liveTotal | const | 221 | no | const liveTotal = Number(db.prepare(&#39;SELECT count(*) AS c FROM timings&#39;).get()?.c ?? 0); |
| worst | const | 235 | no | const worst = live.operations[0]; |
| top | const | 236 | no | const top = live.wastefulOperations[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 59 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 60 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/registry.mjs | import | 61 | [hq/lib/registry.mjs](../../lib/registry.mjs.md) |
| ../../lib/telemetry.mjs | import | 62 | [hq/lib/telemetry.mjs](../../lib/telemetry.mjs.md) |
| ../../lib/seat-heartbeat.mjs | import | 63 | [hq/lib/seat-heartbeat.mjs](../../lib/seat-heartbeat.mjs.md) |
| ../../lib/schema.mjs | dynamic | 214 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | dynamic | 215 | external |
| node:url | dynamic | 216 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 252 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
