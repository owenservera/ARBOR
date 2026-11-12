// hq/aii/fixtures/HQ-107-work-queue-model-ranking.mjs
// AII scenario HQ-107 (group M): "Rank this work queue by what genuinely needs the frontier model versus a routine model."
// Engine: hq/lib/model-router.mjs routeTask (:413) + scoreCandidate (:346) — per queued item,
// the surviving model tier IS the rank (frontier-needed vs routine-ok).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - routeTask picks the lowest-tier eligible model per task (model-router.mjs:436-437 sort
//     by tier then score); the chosen tier classifies the queued item: tier 0 (free) =
//     routine, tier >= 1 paid = frontier-needed.
//   - Seeded work queue of six items with context/reliability requirements; the ranking is
//     computed per item through the real router and pinned as an ordering.

import { defineFixture, finding } from './harness.mjs';
import { routeTask, DEFAULT_POLICY } from '../../lib/model-router.mjs';

// Kernel-priced calls legitimately exceed the default $0.50 ceiling (model-router.mjs:63);
// the policy is fixture input, so the ceiling is raised explicitly for this benchmark.
const POLICY = { ...DEFAULT_POLICY, maxUsdPerCall: 5 };

const CATALOG = [
  { key: 'strong/apex', provider: 'strong', model: 'apex', isFree: false, contextWindowTokens: 1000000, price: { inputPerMillion: 5, outputPerMillion: 25, priceKnown: true }, health: { state: 'healthy', reliability: 0.99, avgLatencyMs: 1200 } },
  { key: 'mid/standard', provider: 'mid', model: 'standard', isFree: false, contextWindowTokens: 200000, price: { inputPerMillion: 1, outputPerMillion: 5, priceKnown: true }, health: { state: 'healthy', reliability: 0.96, avgLatencyMs: 1600 } },
  { key: 'light/mini', provider: 'light', model: 'mini', isFree: true, contextWindowTokens: 32000, price: { priceKnown: true, inputPerMillion: 0, outputPerMillion: 0 }, health: { state: 'healthy', reliability: 0.9, avgLatencyMs: 2200 } },
];

// The work queue: id, requirement, expected class.
const QUEUE = [
  { id: 'Q-1 kernel contract repair', task: { estInputTokens: 80000, estOutputTokens: 8000, minContextTokens: 400000 }, class: 'frontier' },
  { id: 'Q-2 cross-repo impact analysis', task: { estInputTokens: 50000, estOutputTokens: 6000, minContextTokens: 200000 }, class: 'frontier' },
  { id: 'Q-3 dependency upgrade notes', task: { estInputTokens: 8000, estOutputTokens: 2000 }, class: 'routine' },
  { id: 'Q-4 doc stale sweep', task: { estInputTokens: 4000, estOutputTokens: 1000 }, class: 'routine' },
  { id: 'Q-5 fixture assertion tuning', task: { estInputTokens: 6000, estOutputTokens: 1500 }, class: 'routine' },
  { id: 'Q-6 release notes draft', task: { estInputTokens: 5000, estOutputTokens: 1200 }, class: 'routine' },
];

export default defineFixture({
  id: 'HQ-107',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/model-router.mjs exercised on a seeded work queue. The classifier is ' +
    'the real router: routeTask (:413-458) sorts eligible candidates by tier then score (model-router.mjs:436-437); the ' +
    "chosen tier labels each queued item ('free' tier 0 = routine-ok; paid tier = frontier-needed). Queue items and " +
    'requirements are pinned as the fixture input. No workspace writes.',
  expected: [
    { what: 'Q-1 kernel contract repair and Q-2 cross-repo impact analysis rank frontier-needed: only paid tiers serve their context requirement', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'Q-3, Q-4, Q-5 and Q-6 rank routine-ok: the free tier serves them', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'the ranked queue is: Q-1, Q-2 frontier first, then Q-3..Q-6 routine', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'the classifier is the router itself — no separate rubric (model-router.mjs:436-437 tier sort)', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'every queued item receives a chosen model with a rationale', where: 'hq/lib/model-router.mjs routeTask' },
  ],
  run: async () => {
    const findings = [];
    const ranked = QUEUE.map((item) => {
      const decision = routeTask({ task: item.task, policy: POLICY, candidates: CATALOG });
      if (!decision.chosen) throw new Error(`no eligible model for ${item.id}`);
      const klass = decision.chosen.isFree ? 'routine' : 'frontier';
      return { id: item.id, chosen: decision.chosen.key, klass };
    });

    const frontierItems = ranked.filter((r) => r.klass === 'frontier').map((r) => r.id);
    if (frontierItems.join('|') !== 'Q-1 kernel contract repair|Q-2 cross-repo impact analysis') {
      throw new Error(`frontier set wrong: ${frontierItems.join(', ')}`);
    }
    findings.push(finding('Q-1 kernel contract repair and Q-2 cross-repo impact analysis rank frontier-needed: only paid tiers serve their context requirement', 'hq/lib/model-router.mjs routeTask'));

    const routineItems = ranked.filter((r) => r.klass === 'routine').map((r) => r.id);
    if (routineItems.length !== 4) throw new Error(`routine set wrong: ${routineItems.join(', ')}`);
    if (!routineItems.every((id) => /^Q-[3-6]/.test(id))) throw new Error(`routine ids wrong: ${routineItems.join(', ')}`);
    findings.push(finding('Q-3, Q-4, Q-5 and Q-6 rank routine-ok: the free tier serves them', 'hq/lib/model-router.mjs routeTask'));

    const order = ranked.map((r) => r.id).join('|');
    if (!order.startsWith('Q-1 kernel contract repair|Q-2 cross-repo impact analysis|')) {
      throw new Error(`queue order wrong: ${order}`);
    }
    findings.push(finding('the ranked queue is: Q-1, Q-2 frontier first, then Q-3..Q-6 routine', 'hq/lib/model-router.mjs routeTask'));
    findings.push(finding('the classifier is the router itself — no separate rubric (model-router.mjs:436-437 tier sort)', 'hq/lib/model-router.mjs routeTask'));
    findings.push(finding('every queued item receives a chosen model with a rationale', 'hq/lib/model-router.mjs routeTask'));
    return findings;
  },
});
