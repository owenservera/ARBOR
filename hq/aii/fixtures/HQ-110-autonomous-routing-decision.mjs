// hq/aii/fixtures/HQ-110-autonomous-routing-decision.mjs
// AII scenario HQ-110 (group M): "Given this objective, decide autonomously which work is core enough to deserve my best model, and route it with minimal assistance from me."
// Engine: hq/lib/model-router.mjs routeTask (:413) + planRoutes (:568) + shouldApply (:104) —
// the router decides autonomously and stays propose-only: it is "trusted enough to choose;
// it is not trusted to act because nobody asked it to" (model-router.mjs:92-93).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - routeTask on a seeded catalog + policy makes the full decision (chosen + rationale +
//     rejected-with-reasons) with no human input beyond the policy.
//   - shouldApply (model-router.mjs:104-106) returns true ONLY for an explicit
//     `--apply`; a bare route plan writes nothing (model-router.mjs:92-100 documents the
//     2026-11-04 incident where a bare route-model rewrote 31 agent definitions).
//   - planRoutes routes an `inherit` agent autonomously with inherited:true.

import { defineFixture, finding } from './harness.mjs';
import { routeTask, planRoutes, shouldApply, DEFAULT_POLICY } from '../../lib/model-router.mjs';

const CATALOG = {
  'strong/apex': { isFree: false, inputPerMillion: 5, outputPerMillion: 25, contextWindowTokens: 1000000, priceKnown: true },
  'light/mini': { isFree: true, inputPerMillion: 0, outputPerMillion: 0, contextWindowTokens: 32000, priceKnown: true },
};

const HEALTHY = { state: 'healthy', reliability: 0.99, avgLatencyMs: 1200 };
const POLICY = { ...DEFAULT_POLICY, maxUsdPerCall: 5 };

export default defineFixture({
  id: 'HQ-110',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/model-router.mjs exercised on seeded inputs. routeTask (:413-458) ' +
    'produces the autonomous decision (chosen + rationale + rejected reasons) from the policy alone; shouldApply ' +
    '(model-router.mjs:104-106) gates any write behind an explicit --apply and its doc comment (:92-100) records the ' +
    '2026-11-04 bare-route incident; planRoutes (:568-743) routes an `inherit` agent with inherited:true and a rationale. ' +
    'Catalog, roster and policy are seeded; no workspace writes.',
  expected: [
    { what: 'the core objective (400k-token contract work) autonomously routes to strong/apex with a cost/health rationale', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'the rejected candidates carry reasons — the decision is explainable without a human in the loop', where: 'hq/lib/model-router.mjs routeTask' },
    { what: 'the router is propose-only: shouldApply is false without an explicit --apply (model-router.mjs:104-106)', where: 'hq/lib/model-router.mjs shouldApply' },
    { what: 'shouldApply is true only for {apply: true} without dry-run — the write gate (model-router.mjs:92-100)', where: 'hq/lib/model-router.mjs shouldApply' },
    { what: 'planRoutes routes an inherit agent autonomously, marking inherited:true and explaining the choice', where: 'hq/lib/model-router.mjs planRoutes' },
  ],
  run: async () => {
    const findings = [];

    const decision = routeTask({
      task: { estInputTokens: 120000, estOutputTokens: 16000, minContextTokens: 400000 },
      policy: POLICY,
      candidates: [
        { key: 'strong/apex', provider: 'strong', model: 'apex', isFree: false, price: CATALOG['strong/apex'], contextWindowTokens: 1000000, health: HEALTHY },
        { key: 'light/mini', provider: 'light', model: 'mini', isFree: true, price: CATALOG['light/mini'], contextWindowTokens: 32000, health: HEALTHY },
      ],
    });
    if (!decision.chosen || decision.chosen.key !== 'strong/apex') {
      throw new Error(`autonomous choice wrong: ${JSON.stringify(decision.chosen?.key ?? null)}`);
    }
    findings.push(finding('the core objective (400k-token contract work) autonomously routes to strong/apex with a cost/health rationale', 'hq/lib/model-router.mjs routeTask'));

    const miniRejected = decision.rejected.find((r) => r.key === 'light/mini');
    if (!miniRejected || miniRejected.eligible !== false || !/context window/.test(miniRejected.reason)) {
      throw new Error(`mini rejection missing: ${JSON.stringify(decision.rejected)}`);
    }
    findings.push(finding('the rejected candidates carry reasons — the decision is explainable without a human in the loop', 'hq/lib/model-router.mjs routeTask'));

    if (shouldApply({}) !== false || shouldApply({ apply: false }) !== false || shouldApply({ apply: true, 'dry-run': true }) !== false) {
      throw new Error('shouldApply must be false without explicit apply and no dry-run');
    }
    if (shouldApply({ apply: true }) !== true) throw new Error('shouldApply({apply:true}) must be true');
    findings.push(finding('the router is propose-only: shouldApply is false without an explicit --apply (model-router.mjs:104-106)', 'hq/lib/model-router.mjs shouldApply'));
    findings.push(finding('shouldApply is true only for {apply: true} without dry-run — the write gate (model-router.mjs:92-100)', 'hq/lib/model-router.mjs shouldApply'));

    const plan = planRoutes({
      agents: [{ name: 'core-integration-architect', model: 'inherit' }],
      catalog: CATALOG,
      // Recent completed usage for both models — without it classifyHealth marks every
      // candidate unproven (model-router.mjs:284,359) and nothing is routable.
      usage: [
        { provider_id: 'strong', model_id: 'apex', started_at: Date.parse('2026-11-11T11:00:00.000Z'), status: 'completed', duration_ms: 1200, input_tokens: 5000, output_tokens: 800 },
        { provider_id: 'light', model_id: 'mini', started_at: Date.parse('2026-11-11T11:00:00.000Z'), status: 'completed', duration_ms: 2200, input_tokens: 3000, output_tokens: 600 },
      ],
      policy: POLICY,
      now: Date.parse('2026-11-11T12:00:00.000Z'),
      task: { estInputTokens: 60000, estOutputTokens: 6000, minContextTokens: 200000 },
    });
    const inheritRoute = plan.routes.find((r) => r.agent === 'core-integration-architect');
    if (!inheritRoute || inheritRoute.inherited !== true || inheritRoute.to !== 'strong/apex' || !/inherits the session model/.test(inheritRoute.reason)) {
      throw new Error(`inherit route wrong: ${JSON.stringify(inheritRoute ?? plan)}`);
    }
    findings.push(finding('planRoutes routes an inherit agent autonomously, marking inherited:true and explaining the choice', 'hq/lib/model-router.mjs planRoutes'));
    return findings;
  },
});
