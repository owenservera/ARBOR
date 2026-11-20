# File: hq/aii/fixtures/HQ-089-performance-regression-components.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-089-performance-regression-components.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13982 B |
| Lines | 202 |
| Hash | b1ea73ef820a |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BASELINE_AT | const | 48 | no | const BASELINE_AT = &#39;2026-11-01T00:00:00.000Z&#39;; |
| CURRENT_AT | const | 49 | no | const CURRENT_AT = &#39;2026-11-02T00:00:00.000Z&#39;; |
| SPLIT | const | 50 | no | const SPLIT = &#39;2026-11-01T12:00:00.000Z&#39;; |
| findings | const | 74 | no | const findings = []; |
| config | const | 75 | no | const config = defaultConfig(); |
| db | const | 79 | no | const db = openMemoryDb(); |
| r | const | 94 | no | const r = componentAttribution(db, config, { operation: &#39;index&#39;, baselineSince: SPLIT }); |
| byName | const | 99 | no | const byName = new Map(r.components.map((c) =&gt; [c.component, c])); |
| indexer | const | 100 | no | const indexer = byName.get(&#39;hq/lib/indexer.mjs&#39;); |
| blamed | const | 102 | no | const blamed = r.responsible.map((x) =&gt; x.component); |
| c | const | 113 | no | const c = byName.get(name); |
| db | const | 134 | no | const db = openMemoryDb(); |
| r | const | 145 | no | const r = componentAttribution(db, config, { operation: &#39;search&#39;, baselineSince: SPLIT }); |
| blamed | const | 149 | no | const blamed = r.responsible.map((x) =&gt; x.component); |
| rank | const | 158 | no | const rank = byNameOf(r, &#39;hq/lib/rank.mjs&#39;); |
| ROOT | const | 172 | no | const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| db | const | 173 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| live | const | 175 | no | const live = componentAttribution(db, config, {}); |
| liveTotal | const | 176 | no | const liveTotal = Number(db.prepare(&#39;SELECT count(*) AS c FROM timings&#39;).get()?.c ?? 0); |
| named | const | 182 | no | const named = live.components.reduce((sum, c) =&gt; sum + c.currentSpans, 0); |
| byNameOf | function | 198 | no | function byNameOf(report, name) { |
| row | const | 199 | no | const row = report.components.find((c) =&gt; c.component === name); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 43 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 44 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/registry.mjs | import | 45 | [hq/lib/registry.mjs](../../lib/registry.mjs.md) |
| ../../lib/telemetry.mjs | import | 46 | [hq/lib/telemetry.mjs](../../lib/telemetry.mjs.md) |
| ../../lib/schema.mjs | dynamic | 169 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | dynamic | 170 | external |
| node:url | dynamic | 171 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 203 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
