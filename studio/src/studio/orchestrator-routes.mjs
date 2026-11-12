import { createOrchestrator, PATTERN_CHOICES } from './ai-orchestrator.mjs';
import { ORCHESTRATE_SITES } from './orchestrator-patterns.mjs';
import { projectOrchestratorMission, MISSION_CARD_SCHEMA } from '../../../apps/mobile-relay/ux/mission-experience.mjs';

// /api/v1/orchestrate — every multi-AI pattern through the ONE shared conversation runtime.
export function registerOrchestratorRoutes({ add, paths, conversationRuntime }) {
  if (!conversationRuntime) return;
  const orchestrator = createOrchestrator({ paths, conversations: conversationRuntime });
  add('GET', '/orchestrate', 'Ways to ask several of your AIs, and your recent questions', () => orchestrator.list());
  add('POST', '/orchestrate', 'Ask your own AI accounts using a pattern (single, fanout, race, fallback, hedge, council, judge, relay, critique, verify, auto)',
    ({ body }) => orchestrator.start(body ?? {}), {
      body: { type: 'object', properties: {
        pattern: { enum: PATTERN_CHOICES }, question: { type: 'string', minLength: 1, maxLength: 10000 },
        sites: { type: 'array', minItems: 1, maxItems: ORCHESTRATE_SITES.length, items: { enum: ORCHESTRATE_SITES } },
        options: { type: 'object', properties: {
          by: { enum: ORCHESTRATE_SITES, description: 'The AI that combines (council) or judges (judge)' },
          rounds: { type: 'integer', minimum: 1, maximum: 3 }, hedgeAfterSeconds: { type: 'integer', minimum: 5, maximum: 900 },
          deadlineMinutes: { type: 'integer', minimum: 1, maximum: 120 }, expect: { enum: ['text', 'json'] },
          instructions: { type: 'array', items: { type: 'string', maxLength: 2000 } },
          role: { type: 'string', description: 'With pattern auto: developer role that hints at the task kind' },
          constraints: { type: 'object', properties: { maxSends: { type: 'integer', minimum: 1, maximum: 6 },
            maxWaitMs: { type: 'integer', minimum: 1000 }, mustInclude: { type: 'array', items: { enum: ORCHESTRATE_SITES } },
            exclude: { type: 'array', items: { enum: ORCHESTRATE_SITES } } } } } } },
        required: ['pattern', 'question', 'sites'] }, successStatus: 202 });
  // Lane M: same durable orchestrator, presentation-only and no additional mission store.
  // Register the static route before the parameter route so "outcomes" is not a plan ID.
  add('GET', '/orchestrate/outcomes', 'Understand recent requests in plain language (read-only)',
    () => ({ schema: 'vivim.mission-experience/1', cardSchema: MISSION_CARD_SCHEMA,
      items: orchestrator.list().plans.map(p => projectOrchestratorMission(orchestrator.get(p.id).plan)).filter(Boolean) }),
    { annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false } });
  add('GET', '/orchestrate/{planId}/outcome', 'Read one understandable request card (read-only)',
    ({ p }) => ({ schema: 'vivim.mission-experience/1', card: projectOrchestratorMission(orchestrator.get(p.planId).plan) }),
    { annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false } });
  add('GET', '/orchestrate/{planId}', 'Read a saved multi-AI question and its progress', ({ p }) => orchestrator.get(p.planId));
  add('POST', '/orchestrate/{planId}/cancel', 'Stop waiting without repeating any question', ({ p }) => orchestrator.cancel(p.planId), { body: { type: 'object', properties: {} } });
}
