// hq/aii/fixtures/HQ-103-strongest-model-only-components.mjs
// AII scenario HQ-103 (group M): "Which components are critical enough that only my strongest model should touch them?"
// Engine: hq/lib/model-router.mjs scoreCandidate (model-router.mjs:346) + routeTask (:413) —
// the context-window and reliability gates decide which components only the strongest model can serve.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - scoreCandidate rejects a candidate whose context window is below the task's requirement
//     (model-router.mjs:367-368) and enforces minReliability (model-router.mjs:361-362).
//   - Exercised on a seeded catalog with three component classes: kernel-contract work
//     (needs 400k-token context + 0.98 reliability), graph-migration work (needs 200k), and
//     routine edits (fits any window). Only the strongest model survives the kernel class.

import { defineFixture, finding } from './harness.mjs';
import { scoreCandidate, routeTask, DEFAULT_POLICY } from '../../lib/model-router.mjs';

const CATALOG = [
  { key: 'strong/apex', provider: 'strong', model: 'apex', isFree: false, contextWindowTokens: 1000000, price: { inputPerMillion: 5, outputPerMillion: 25, priceKnown: true }, health: { state: 'healthy', reliability: 0.99, avgLatencyMs: 1200 } },
  { key: 'mid/standard', provider: 'mid', model: 'standard', isFree: false, contextWindowTokens: 200000, price: { inputPerMillion: 1, outputPerMillion: 5, priceKnown: true }, health: { state: 'healthy', reliability: 0.96, avgLatencyMs: 1600 } },
  { key: 'light/mini', provider: 'light', model: 'mini', isFree: true, contextWindowTokens: 32000, price: { priceKnown: true, inputPerMillion: 0, outputPerMillion: 0 }, health: { state: 'healthy', reliability: 0.9, avgLatencyMs: 2200 } },
];

const COMPONENT_CLASSES = [
  { component: 'rust-knowledge-graph HQKG kernel contracts', task: { estInputTokens: 60000, estOutputTokens: 8000, minContextTokens: 400000 }, minReliability: 0.98 },
  // minReliability is 0.85 here so the context gate (which fires after the reliability
  // floor, model-router.mjs:361-368) is what rejects light/mini.
  { component: 'repo-wide import-graph migration', task: { estInputTokens: 40000, estOutputTokens: 4000, minContextTokens: 200000 }, minReliability: 0.85 },
  { component: 'docs touch-ups and copy edits', task: { estInputTokens: 4000, estOutputTokens: 1000 }, minReliability: 0.85 },
];

export default defineFixture({
  id: 'HQ-103',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/model-router.mjs exercised on a seeded catalog. The gates that ' +
    'decide "strongest model only" are real engine behavior: context-window shortfall rejection (model-router.mjs:367-368) ' +
    'and minReliability floor (model-router.mjs:361-362); routeTask (:413-458) then picks the sole survivor and explains ' +
    'it. Component classes and their context/reliability requirements are pinned as the fixture\'s classification input. ' +
    'No workspace writes.',
  expected: [
    { what: 'rust-knowledge-graph HQKG kernel contracts: only strong/apex survives the 400k context + 0.98 reliability gates', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'repo-wide import-graph migration: strong/apex and mid/standard are eligible, light/mini is context-rejected', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'docs touch-ups and copy edits: every tier is eligible — the cheapest eligible wins', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'context window shortfall rejection names the shortfall (model-router.mjs:367)', where: 'hq/lib/model-router.mjs scoreCandidate' },
    { what: 'reliability below the floor rejects even a context-fitting model (model-router.mjs:361-362)', where: 'hq/lib/model-router.mjs scoreCandidate' },
  ],
  run: async () => {
    const findings = [];
    const score = (task, minReliability) => CATALOG.map((c) => ({
      key: c.key,
      scored: scoreCandidate({
        key: c.key, provider: c.provider, isFree: c.isFree, price: c.price,
        contextWindowTokens: c.contextWindowTokens, health: c.health, task,
        policy: { ...DEFAULT_POLICY, minReliability },
      }),
    }));

    const kernel = score(COMPONENT_CLASSES[0].task, 0.98);
    const kernelEligible = kernel.filter((s) => s.scored.eligible).map((s) => s.key);
    if (kernelEligible.join('|') !== 'strong/apex') throw new Error(`kernel survivors: ${kernelEligible.join(', ')}`);
    findings.push(finding('rust-knowledge-graph HQKG kernel contracts: only strong/apex survives the 400k context + 0.98 reliability gates', 'hq/lib/model-router.mjs scoreCandidate'));

    const migration = score(COMPONENT_CLASSES[1].task, 0.85);
    const migrationEligible = migration.filter((s) => s.scored.eligible).map((s) => s.key);
    if (migrationEligible.join('|') !== 'strong/apex|mid/standard') {
      throw new Error(`migration survivors: ${migrationEligible.join(', ')}`);
    }
    const lightRejected = migration.find((s) => s.key === 'light/mini');
    if (lightRejected.scored.eligible || !/context window/.test(lightRejected.scored.reason)) {
      throw new Error(`light/mini rejection wrong: ${JSON.stringify(lightRejected.scored)}`);
    }
    findings.push(finding('repo-wide import-graph migration: strong/apex and mid/standard are eligible, light/mini is context-rejected', 'hq/lib/model-router.mjs scoreCandidate'));
    findings.push(finding('context window shortfall rejection names the shortfall (model-router.mjs:367)', 'hq/lib/model-router.mjs scoreCandidate'));

    const docs = score(COMPONENT_CLASSES[2].task, 0.85);
    const docsEligible = docs.filter((s) => s.scored.eligible).map((s) => s.key);
    if (docsEligible.length !== 3) throw new Error(`docs survivors: ${docsEligible.join(', ')}`);
    const docsDecision = routeTask({ task: COMPONENT_CLASSES[2].task, policy: DEFAULT_POLICY, candidates: CATALOG });
    if (docsDecision.chosen.key !== 'light/mini') throw new Error(`docs choice wrong: ${docsDecision.chosen.key}`);
    findings.push(finding('docs touch-ups and copy edits: every tier is eligible — the cheapest eligible wins', 'hq/lib/model-router.mjs routeTask'));

    const reliabilityGate = score({ estInputTokens: 1000, estOutputTokens: 500 }, 0.985);
    const midBlocked = reliabilityGate.find((s) => s.key === 'mid/standard');
    if (midBlocked.scored.eligible || !/reliability below floor/.test(midBlocked.scored.reason)) {
      throw new Error(`reliability gate wrong: ${JSON.stringify(midBlocked.scored)}`);
    }
    findings.push(finding('reliability below the floor rejects even a context-fitting model (model-router.mjs:361-362)', 'hq/lib/model-router.mjs scoreCandidate'));
    return findings;
  },
});
