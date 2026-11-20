# File: hq/aii/fixtures/HQ-092-best-verified-configuration.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-092-best-verified-configuration.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8161 B |
| Lines | 103 |
| Hash | 0f5d3337846d |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 30 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| SEED_CANDIDATES | const | 32 | no | const SEED_CANDIDATES = [ |
| findings | const | 50 | no | const findings = []; |
| policy | const | 52 | no | const policy = { ...DEFAULT_POLICY, now: 1760000000000, budgetStatus: new Map() }; |
| result | const | 53 | no | const result = routeTask({ task: { estInputTokens: 10000, estOutputTokens: 2000, minContextTokens: 1000 }, policy, candidates: SEED_CANDIDATES }); |
| rejected | const | 62 | no | const rejected = result.rejected.find((r) =&gt; r.key === expected[0]); |
| capped | const | 76 | no | const capped = scoreCandidate({ key: &#39;paid/model-c&#39;, provider: &#39;paid&#39;, model: &#39;model-c&#39;, isFree: false, price: { inputPerMillion: 0, outputPerMillion: 0, priceKnown: true }, contextWindowTokens: 4000… |
| route | const | 81 | no | const route = runHq([&#39;route-model&#39;], { cwd: ROOT }); |
| doctor | const | 91 | no | const doctor = runHq([&#39;zcode-doctor&#39;], { cwd: ROOT }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 25 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/model-router.mjs | import | 26 | [hq/lib/model-router.mjs](../../lib/model-router.mjs.md) |
| node:path | import | 27 | external |
| node:url | import | 28 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-092-best-verified-configuration.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-092 (group K):
// "Which model or agent configuration achieves the best verified outcome for
// this workload?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   routeTask() (hq/lib/model-router.mjs:413) with seeded candidates chose the
//   FREE healthy model over a paid model (over budget) and a capped model —
//   chosen: free/model-a, rationale "free/model-a: free, healthy, $0.0000 per
//   call, 12.0s avg — rejected cheaper option paid/model-b (over budget —
//   $16.0000 per call exceeds $0.5), paid/model-c (capped — daily cap or rate
//   limit observed)".
//   scoreCandidate() (hq/lib/model-router.mjs:346) rejects budget-blocked,
//   capped, broken ("rejects our request shape"), unproven, and
//   reliability-below-floor models before scoring.
//   bun hq/bin/hq.mjs route-model (live policy run) printed
//   "ROUTE MODEL 9 route(s) in 1 group(s), 53 skipped" choosing
//   minimax-m-plan/MiniMax-M3.1-Flash [think=high] for 9 agents — free,
//   healthy, $0.0000 per call — and beat the capped model.
//   bun hq/bin/hq.mjs zcode-doctor printed provider-config:ok, agents
//   compliant counts and the funded/warn/blocked model budget.
//
// The seeded routing decision is deterministic and pinned exactly; the live
// policy route and doctor counts are re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { routeTask, scoreCandidate, DEFAULT_POLICY } from '../../lib/model-router.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const SEED_CANDIDATES = [
  { key: 'free/model-a', provider: 'free', model: 'model-a', isFree: true, price: { inputPerMillion: 0, outputPerMillion: 0, priceKnown: true }, contextWindowTokens: 200000, health: { state: 'healthy', reliability: 0.9, avgLatencyMs: 12000 } },
  { key: 'paid/model-b', provider: 'paid', model: 'model-b', isFree: false, price: { inputPerMillion: 1000, outputPerMillion: 3000, priceKnown: true }, contextWindowTokens: 400000, health: { state: 'healthy', reliability: 0.99, avgLatencyMs: 8000 } },
  { key: 'paid/model-c', provider: 'paid', model: 'model-c', isFree: false, price: { inputPerMillion: 500, outputPerMillion: 1500, priceKnown: true }, contextWindowTokens: 400000, health: { state: 'capped', reliability: 0.99, avgLatencyMs: 8000 } },
];

export default defineFixture({
  id: 'HQ-092',
  provenance: 'Locked 2026-11-11 on branch main from live output: routeTask() (hq/lib/model-router.mjs:413) was run with seeded candidates (one free healthy model, one paid healthy model priced over the $0.5/call budget, one capped model) and chose free/model-a with rationale "free/model-a: free, healthy, $0.0000 per call, 12.0s avg — rejected cheaper option paid/model-b (over budget — $16.0000 per call exceeds $0.5), paid/model-c (capped — daily cap or rate limit observed)". scoreCandidate() (hq/lib/model-router.mjs:346) rejects pinned, provider-blocked, budget-blocked, capped, broken, unproven and reliability-below-floor candidates before scoring. bun hq/bin/hq.mjs route-model printed "ROUTE MODEL 9 route(s) in 1 group(s), 53 skipped" choosing minimax-m-plan/MiniMax-M3.1-Flash [think=high] for 9 agents (free, healthy, $0.0000 per call, 12.5s avg) over the capped account:zai-start-plan/GLM-5.3-Flash. bun hq/bin/hq.mjs zcode-doctor printed "provider-config:ok", agents compliance counts and a funded/warn/blocked model budget. The seeded routing decision is deterministic and pinned exactly; the live route-model choice and doctor counts drift as providers change and are re-derived live.',
  expected: [
    { what: 'the best verified route for the seeded workload is the free healthy model free/model-a', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'the paid healthy model is rejected for exceeding the per-call budget', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'the capped model is rejected regardless of price', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'the routing rationale names the chosen model, its health, its cost and its latency', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'the live policy routes the agent group to a free healthy model and beats the capped one', where: 'hq/bin/hq.mjs route-model' },
    { what: 'the doctor reports the provider config ok and a funded/warn/blocked model budget', where: 'hq/bin/hq.mjs zcode-doctor' },
  ],
  run: async () => {
    const findings = [];

    const policy = { ...DEFAULT_POLICY, now: 1760000000000, budgetStatus: new Map() };
    const result = routeTask({ task: { estInputTokens: 10000, estOutputTokens: 2000, minContextTokens: 1000 }, policy, candidates: SEED_CANDIDATES });
    if (result.chosen?.key !== 'free/model-a') {
      throw new Error(`expected free/model-a, got ${result.chosen?.key}`);
    }
    findings.push(finding('the best verified route for the seeded workload is the free healthy model free/model-a', 'hq/lib/model-router.mjs routeTask'));
    for (const expected of [
      ['paid/model-b', 'over budget'],
      ['paid/model-c', 'capped'],
    ]) {
      const rejected = result.rejected.find((r) => r.key === expected[0]);
      if (!rejected || !rejected.reason.includes(expected[1])) {
        throw new Error(`expected ${expected[0]} rejected for ${expected[1]}, got ${JSON.stringify(rejected)}`);
      }
      if (rejected.eligible !== false) throw new Error(`${expected[0]} must not be eligible`);
    }
    findings.push(finding('the paid healthy model is rejected for exceeding the per-call budget', 'hq/lib/model-router.mjs scoreCandidate'));
    findings.push(finding('the capped model is rejected regardless of price', 'hq/lib/model-router.mjs scoreCandidate'));
    if (!/free\/model-a: free, healthy, \$0\.0000 per call, \d+\.\d+s avg/.test(result.rationale)) {
      throw new Error(`unexpected rationale: ${result.rationale}`);
    }
    findings.push(finding('the routing rationale names the chosen model, its health, its cost and its latency', 'hq/lib/model-router.mjs routeTask'));

    // scoreCandidate directly: the capped candidate is ineligible even at price 0.
    const capped = scoreCandidate({ key: 'paid/model-c', provider: 'paid', model: 'model-c', isFree: false, price: { inputPerMillion: 0, outputPerMillion: 0, priceKnown: true }, contextWindowTokens: 400000, health: { state: 'capped', reliability: 0.99, avgLatencyMs: 8000 }, task: {}, policy });
    if (capped.eligible !== false || !capped.reason.includes('capped')) {
      throw new Error(`capped candidate must be rejected: ${JSON.stringify(capped)}`);
    }
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
