# File: hq/aii/fixtures/HQ-106-expensive-areas.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-106-expensive-areas.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6923 B |
| Lines | 83 |
| Hash | e11ed6f34bf7 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| POLICY | const | 18 | no | const POLICY = { ...DEFAULT_POLICY, maxUsdPerCall: 5 }; |
| CATALOG | const | 20 | no | const CATALOG = [ |
| AREAS | const | 26 | no | const AREAS = [ |
| findings | const | 49 | no | const findings = []; |
| costOf | function | 50 | no | const costOf = (area) =&gt; { |
| decision | const | 51 | no | const decision = routeTask({ task: area.task, policy: POLICY, candidates: CATALOG }); |
| costs | const | 56 | no | const costs = AREAS.map((a) =&gt; ({ area: a.area, ...costOf(a) })); |
| reliable | const | 70 | no | const reliable = scoreCandidate({ key: &#39;x/solid&#39;, provider: &#39;x&#39;, isFree: false, price: { inputPerMillion: 1, outputPerMillion: 2, priceKnown: true }, contextWindowTokens: 200000, health: { state: &#39;he… |
| flaky | const | 71 | no | const flaky = scoreCandidate({ key: &#39;x/flaky&#39;, provider: &#39;x&#39;, isFree: false, price: { inputPerMillion: 1, outputPerMillion: 2, priceKnown: true }, contextWindowTokens: 200000, health: { state: &#39;healt… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 13 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/model-router.mjs | import | 14 | [hq/lib/model-router.mjs](../../lib/model-router.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-106-expensive-areas.mjs
// AII scenario HQ-106 (group M): "Which areas of the codebase are the most expensive to work on, and why?"
// Engine: hq/lib/model-router.mjs budgetPlanRoutes (model-router.mjs:754) + scoreCandidate
// (:346) — the per-task effective cost is the priced answer to "expensive".
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - scoreCandidate computes rawCostUsd from estInputTokens/estOutputTokens against
//     per-million pricing (model-router.mjs:370) and effectiveCostUsd = raw / reliability
//     (model-router.mjs:375). routeTask (:413) reports the chosen cost in its rationale.
//   - Exercised on a seeded catalog and three work areas: kernel-contract work (frontier
//     context requirement) prices an order of magnitude above docs edits (free tier).

import { defineFixture, finding } from './harness.mjs';
import { routeTask, scoreCandidate, DEFAULT_POLICY } from '../../lib/model-router.mjs';

// Kernel-priced calls legitimately exceed the default $0.50 ceiling (model-router.mjs:63);
// the policy is fixture input, so the ceiling is raised explicitly for this benchmark.
const POLICY = { ...DEFAULT_POLICY, maxUsdPerCall: 5 };

const CATALOG = [
  { key: 'strong/apex', provider: 'strong', model: 'apex', isFree: false, contextWindowTokens: 1000000, price: { inputPerMillion: 5, outputPerMillion: 25, priceKnown: true }, health: { state: 'healthy', reliability: 0.99, avgLatencyMs: 1200 } },
  { key: 'mid/standard', provider: 'mid', model: 'standard', isFree: false, contextWindowTokens: 200000, price: { inputPerMillion: 1, outputPerMillion: 5, priceKnown: true }, health: { state: 'healthy', reliability: 0.96, avgLatencyMs: 1600 } },
  { key: 'light/mini', provider: 'light', model: 'mini', isFree: true, contextWindowTokens: 32000, price: { priceKnown: true, inputPerMillion: 0, outputPerMillion: 0 }, health: { state: 'healthy', reliability: 0.9, avgLatencyMs: 2200 } },
];

const AREAS = [
  { area: 'kernel contracts (rust-knowledge-graph)', task: { estInputTokens: 120000, estOutputTokens: 16000, minContextTokens: 400000 } },
  { area: 'import-graph migrations (repo-wide)', task: { estInputTokens: 60000, estOutputTokens: 8000, minContextTokens: 200000 } },
  { area: 'docs and copy edits', task: { estInputTokens: 6000, estOutputTokens: 1200 } },
];

export default defineFixture({
  id: 'HQ-106',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/model-router.mjs exercised on a seeded catalog. Cost is real engine ' +
    'output: scoreCandidate rawCostUsd = (estInput x inputPerMillion + estOutput x outputPerMillion) / 1e6 ' +
    '(model-router.mjs:370), effectiveCostUsd = raw / reliability (model-router.mjs:375); routeTask (:413-458) reports ' +
    'the chosen cost per call in its rationale. The three work areas and their context requirements are pinned as the ' +
    'classification input. No workspace writes.',
  expected: [
    { what: 'kernel contracts are the most expensive area: only strong/apex can serve the 400k context, at frontier per-call pricing', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'import-graph migrations price mid-tier: mid/standard serves the 200k context', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'docs and copy edits price at zero: the free tier serves them', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'the effective cost divides by reliability (model-router.mjs:375) — cheap-but-unreliable is not cheap', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'the area cost ranking is: kernel contracts > import-graph migrations > docs edits', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'routeTask rationale names the per-call cost of the chosen model', where: 'hq/lib/model-router.mjs routeTask' },
  ],
  run: async () => {
    const findings = [];
    const costOf = (area) => {
      const decision = routeTask({ task: area.task, policy: POLICY, candidates: CATALOG });
      if (!decision.chosen) throw new Error(`no eligible model for ${area.area}`);
      return { key: decision.chosen.key, effectiveCostUsd: decision.chosen.effectiveCostUsd, rationale: decision.rationale };
    };

    const costs = AREAS.map((a) => ({ area: a.area, ...costOf(a) }));
    if (costs[0].key !== 'strong/apex') throw new Error(`kernel area chose ${costs[0].key}`);
    if (costs[1].key !== 'mid/standard') throw new Error(`migration area chose ${costs[1].key}`);
    if (costs[2].key !== 'light/mini') throw new Error(`docs area chose ${costs[2].key}`);
    findings.push(finding('kernel contracts are the most expensive area: only strong/apex can serve the 400k context, at frontier per-call pricing', 'hq/lib/model-router.mjs scoreCandidate'));
    findings.push(finding('import-graph migrations price mid-tier: mid/standard serves the 200k context', 'hq/lib/model-router.mjs routeTask'));
    findings.push(finding('docs and copy edits price at zero: the free tier serves them', 'hq/lib/model-router.mjs routeTask'));

    if (!(costs[0].effectiveCostUsd > costs[1].effectiveCostUsd && costs[1].effectiveCostUsd > costs[2].effectiveCostUsd)) {
      throw new Error(`cost ordering wrong: ${costs.map((c) => `${c.area}=${c.effectiveCostUsd}`).join(', ')}`);
    }
    findings.push(finding('the area cost ranking is: kernel contracts > import-graph migrations > docs edits', 'hq/lib/model-router.mjs scoreCandidate'));

    // Reliability divisor is visible: same pricing, worse reliability → higher effective cost.
    const reliable = scoreCandidate({ key: 'x/solid', provider: 'x', isFree: false, price: { inputPerMillion: 1, outputPerMillion: 2, priceKnown: true }, contextWindowTokens: 200000, health: { state: 'healthy', reliability: 1.0, avgLatencyMs: 100 }, task: AREAS[1].task, policy: DEFAULT_POLICY });
    const flaky = scoreCandidate({ key: 'x/flaky', provider: 'x', isFree: false, price: { inputPerMillion: 1, outputPerMillion: 2, priceKnown: true }, contextWindowTokens: 200000, health: { state: 'healthy', reliability: 0.5, avgLatencyMs: 100 }, task: AREAS[1].task, policy: DEFAULT_POLICY });
    if (!(flaky.effectiveCostUsd > reliable.effectiveCostUsd)) {
      throw new Error(`reliability divisor not visible: ${reliable.effectiveCostUsd} vs ${flaky.effectiveCostUsd}`);
    }
    findings.push(finding('the effective cost divides by reliability (model-router.mjs:375) — cheap-but-unreliable is not cheap', 'hq/lib/model-router.mjs scoreCandidate'));

    if (!/\$/.test(costs[0].rationale) || !/free/.test(costs[2].rationale)) {
      throw new Error(`rationale lacks cost: ${costs[0].rationale} | ${costs[2].rationale}`);
    }
    findings.push(finding('routeTask rationale names the per-call cost of the chosen model', 'hq/lib/model-router.mjs routeTask'));
```

_First 80 of 84 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
