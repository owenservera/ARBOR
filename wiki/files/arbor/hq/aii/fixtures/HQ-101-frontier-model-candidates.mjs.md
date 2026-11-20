# File: hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8154 B |
| Lines | 92 |
| Hash | f6d05f54b5c6 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 17 | no | const NOW = Date.parse(&#39;2026-11-11T12:00:00.000Z&#39;); |
| CATALOG | const | 19 | no | const CATALOG = [ |
| TASK | const | 27 | no | const TASK = { estInputTokens: 20000, estOutputTokens: 4000 }; |
| findings | const | 47 | no | const findings = []; |
| scored | const | 48 | no | const scored = CATALOG.map((c) =&gt; ({ ...c, scored: scoreCandidate({ key: c.key, provider: c.provider, isFree: c.isFree, price: c.price, contextWindowTokens: c.contextWindowTokens, health: c.health, t… |
| eligible | const | 49 | no | const eligible = scored.filter((s) =&gt; s.scored.eligible).sort((a, b) =&gt; (a.scored.tier - b.scored.tier) \|\| (a.scored.score - b.scored.score)); |
| eligibleKeys | const | 50 | no | const eligibleKeys = eligible.map((s) =&gt; s.key); |
| gamma | const | 57 | no | const gamma = scored.find((s) =&gt; s.key === &#39;frontier/gamma-experimental&#39;); |
| delta | const | 63 | no | const delta = scored.find((s) =&gt; s.key === &#39;frontier/delta-capped&#39;); |
| frontierTask | const | 72 | no | const frontierTask = { estInputTokens: 60000, estOutputTokens: 8000, minContextTokens: 100000 }; |
| frontierScored | const | 73 | no | const frontierScored = CATALOG.map((c) =&gt; ({ ...c, scored: scoreCandidate({ key: c.key, provider: c.provider, isFree: c.isFree, price: c.price, contextWindowTokens: c.contextWindowTokens, health: c.h… |
| mini | const | 74 | no | const mini = frontierScored.find((s) =&gt; s.key === &#39;routine/mini-free&#39;); |
| frontierEligible | const | 78 | no | const frontierEligible = frontierScored.filter((s) =&gt; s.scored.eligible).map((s) =&gt; s.key); |
| decision | const | 84 | no | const decision = routeTask({ task: frontierTask, policy: DEFAULT_POLICY, candidates: CATALOG }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/model-router.mjs | import | 15 | [hq/lib/model-router.mjs](../../lib/model-router.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-101-frontier-model-candidates.mjs
// AII scenario HQ-101 (group M): "I need to use my top-of-the-line frontier model — show me a list of top candidates."
// Engine: hq/lib/model-router.mjs scoreCandidate (model-router.mjs:346) + routeTask (:413).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - scoreCandidate scores each catalog candidate on tier, effective cost (raw cost divided
//     by reliability, model-router.mjs:375), latency and reliability points, and rejects
//     candidates for pinned/blocked/capped/broken/unproven/unhealthy states and context-window
//     shortfalls (model-router.mjs:353-368).
//   - Exercised on a SEEDED catalog (in-memory, no workspace writes): two frontier-tier paid
//     models, one routine free model, one unproven model, one capped model. The frontier
//     candidates rank ahead of the routine one; broken ones are rejected with reasons.

import { defineFixture, finding } from './harness.mjs';
import { scoreCandidate, routeTask, DEFAULT_POLICY } from '../../lib/model-router.mjs';

const NOW = Date.parse('2026-11-11T12:00:00.000Z');

const CATALOG = [
  { key: 'frontier/alpha-max', provider: 'frontier', model: 'alpha-max', isFree: false, contextWindowTokens: 200000, price: { inputPerMillion: 3, outputPerMillion: 15, priceKnown: true }, health: { state: 'healthy', reliability: 0.99, avgLatencyMs: 900 } },
  { key: 'frontier/beta-ultra', provider: 'frontier', model: 'beta-ultra', isFree: false, contextWindowTokens: 1000000, price: { inputPerMillion: 5, outputPerMillion: 25, priceKnown: true }, health: { state: 'healthy', reliability: 0.985, avgLatencyMs: 1400 } },
  { key: 'routine/mini-free', provider: 'routine', model: 'mini-free', isFree: true, contextWindowTokens: 32000, price: { priceKnown: true, inputPerMillion: 0, outputPerMillion: 0 }, health: { state: 'healthy', reliability: 0.9, avgLatencyMs: 2500 } },
  { key: 'frontier/gamma-experimental', provider: 'frontier', model: 'gamma-experimental', isFree: false, contextWindowTokens: 200000, price: { priceKnown: true, inputPerMillion: 4, outputPerMillion: 20 }, health: { state: 'unproven', reliability: 0 } },
  { key: 'frontier/delta-capped', provider: 'frontier', model: 'delta-capped', isFree: false, contextWindowTokens: 200000, price: { priceKnown: true, inputPerMillion: 4, outputPerMillion: 20 }, health: { state: 'capped', reliability: 0.95 } },
];

const TASK = { estInputTokens: 20000, estOutputTokens: 4000 };

export default defineFixture({
  id: 'HQ-101',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/model-router.mjs exercised on a seeded catalog. scoreCandidate ' +
    '(model-router.mjs:346-405) computes effectiveCostUsd = rawCostUsd / reliability (model-router.mjs:375) and rejects ' +
    'unproven (model-router.mjs:359) and capped (model-router.mjs:356) candidates with reasons. routeTask ' +
    '(model-router.mjs:413-458) ranks eligible candidates by tier then score and emits a rationale naming the chosen ' +
    'model. Seed shapes mirror the documented candidate contract (key, provider, isFree, price, contextWindowTokens, ' +
    'health). No workspace writes.',
  expected: [
    { what: 'all three healthy candidates stay eligible for a generic task: routine/mini-free (free tier 0) ranks ahead of the paid frontier pair (tier 1)', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'frontier/gamma-experimental is rejected: unproven — no observed usage', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'frontier/delta-capped is rejected: capped — daily cap or rate limit observed', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'the ranked list orders by tier then score: free tier 0 first, paid tier 1 by effective cost (model-router.mjs:378-403)', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'routeTask explains the frontier choice with cost, health state and latency once the context requirement excludes the free model', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'a context-hungry task (minContextTokens above a model window) rejects that candidate with a context reason (model-router.mjs:367-368)', where: 'hq/lib/model-router.mjs scoreCandidate' },
  ],
  run: async () => {
    const findings = [];
    const scored = CATALOG.map((c) => ({ ...c, scored: scoreCandidate({ key: c.key, provider: c.provider, isFree: c.isFree, price: c.price, contextWindowTokens: c.contextWindowTokens, health: c.health, task: TASK, policy: DEFAULT_POLICY }) }));
    const eligible = scored.filter((s) => s.scored.eligible).sort((a, b) => (a.scored.tier - b.scored.tier) || (a.scored.score - b.scored.score));
    const eligibleKeys = eligible.map((s) => s.key);
    if (eligibleKeys.join('|') !== 'routine/mini-free|frontier/alpha-max|frontier/beta-ultra') {
      throw new Error(`unexpected eligible set: ${eligibleKeys.join(', ')}`);
    }
    findings.push(finding('all three healthy candidates stay eligible for a generic task: routine/mini-free (free tier 0) ranks ahead of the paid frontier pair (tier 1)', 'hq/lib/model-router.mjs scoreCandidate'));
    findings.push(finding('the ranked list orders by tier then score: free tier 0 first, paid tier 1 by effective cost (model-router.mjs:378-403)', 'hq/lib/model-router.mjs scoreCandidate'));

    const gamma = scored.find((s) => s.key === 'frontier/gamma-experimental');
    if (gamma.scored.eligible || gamma.scored.reason !== 'unproven — no observed usage') {
      throw new Error(`gamma rejection wrong: ${JSON.stringify(gamma.scored)}`);
    }
    findings.push(finding('frontier/gamma-experimental is rejected: unproven — no observed usage', 'hq/lib/model-router.mjs scoreCandidate'));

    const delta = scored.find((s) => s.key === 'frontier/delta-capped');
    if (delta.scored.eligible || delta.scored.reason !== 'capped — daily cap or rate limit observed') {
      throw new Error(`delta rejection wrong: ${JSON.stringify(delta.scored)}`);
    }
    findings.push(finding('frontier/delta-capped is rejected: capped — daily cap or rate limit observed', 'hq/lib/model-router.mjs scoreCandidate'));

    // Context-hungry frontier task: the free model's 32k window cannot serve it, the
    // 200k frontier model is the cheapest survivor — that is "top candidates" for
    // frontier work.
    const frontierTask = { estInputTokens: 60000, estOutputTokens: 8000, minContextTokens: 100000 };
    const frontierScored = CATALOG.map((c) => ({ ...c, scored: scoreCandidate({ key: c.key, provider: c.provider, isFree: c.isFree, price: c.price, contextWindowTokens: c.contextWindowTokens, health: c.health, task: frontierTask, policy: DEFAULT_POLICY }) }));
    const mini = frontierScored.find((s) => s.key === 'routine/mini-free');
    if (mini.scored.eligible || !/context window/.test(mini.scored.reason)) {
      throw new Error(`mini context rejection wrong: ${JSON.stringify(mini.scored)}`);
    }
    const frontierEligible = frontierScored.filter((s) => s.scored.eligible).map((s) => s.key);
    if (frontierEligible.join('|') !== 'frontier/alpha-max|frontier/beta-ultra') {
      throw new Error(`frontier eligible set wrong: ${frontierEligible.join(', ')}`);
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
