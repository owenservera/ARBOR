# File: studio/src/recipes/service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/recipes/service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14682 B |
| Lines | 226 |
| Hash | 5da83839298b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fail | function | 10 | no | const fail = (status, code) =&gt; Object.assign(new Error(code), { status, code }); |
| validOperation | function | 11 | no | const validOperation = (v) =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99}$/.test(v); |
| toView | function | 12 | no | const toView = (r) =&gt; { |
| step | const | 13 | no | const step = r.steps?.at(-1) ?? null; |
| open | const | 14 | no | const open = r.status === &#39;running&#39;; |
| effectStateFor | function | 25 | no | const effectStateFor = (outcome, effectful) =&gt; { |
| sendStatusFor | function | 35 | no | const sendStatusFor = (outcome) =&gt; ({ &#39;not-sent&#39;: &#39;failed&#39;, &#39;delivery-observed&#39;: &#39;succeeded&#39;, &#39;in-flight&#39;: &#39;in_flight&#39;, &#39;unknown&#39;: &#39;uncertain&#39;, |
| createRecipeService | function | 42 | yes | export function createRecipeService({ harnessApi, conversationRuntime, sendOutcomeTimeoutMs = SEND_OUTCOME_TIMEOUT_MS } = {}) { |
| sendOutcomeFor | function | 48 | no | const sendOutcomeFor = (run) =&gt; { |
| persisted | const | 49 | no | const persisted = run?.context?.sendOutcome ?? null; |
| step | const | 50 | no | const step = run?.steps?.at(-1) ?? null; |
| fresh | const | 52 | no | const fresh = readSendOutcome(conversationRuntime, run.conversationId, step.key); |
| status | function | 59 | no | const status = (runId) =&gt; { |
| run | const | 60 | no | const run = harnessApi.get(runId).run; |
| label | const | 61 | no | const label = /^recipe:([a-z]+\\.[a-z-]+):operation:([a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99})$/.exec(run.task?.description ?? &#39;&#39;); |
| outcome | const | 63 | no | const outcome = sendOutcomeFor(run); |
| view | const | 64 | no | const view = toView(run); |
| plan | const | 82 | no | const plan = planRecipe(id, input, { execute, authorizeSend }); |
| recipe | const | 84 | no | const recipe = recipeDefinition(id); |
| effectful | const | 87 | no | const effectful = recipe.effects.some((e) =&gt; e !== &#39;read&#39;); |
| result | const | 92 | no | const result = await executeConversationTool(conversationRuntime, recipe.tool, input); |
| identity | const | 100 | no | const identity = operationId ?? (recipe.effects.includes(&#39;provider-send&#39;) ? input.key : null); |
| op | const | 104 | no | const op = identity ?? randomUUID(); |
| task | const | 105 | no | const task = &#39;recipe:&#39; + id + &#39;:operation:&#39; + op; |
| prior | function | 109 | no | const prior = () =&gt; { |
| existing | const | 110 | no | const existing = harnessApi.list().runs.find((r) =&gt; r.taskDescription === task); |
| saved | const | 112 | no | const saved = harnessApi.get(existing.id).run; |
| last | const | 113 | no | const last = saved.steps.at(-1); |
| originalDigest | const | 114 | no | const originalDigest = saved.context?.recipeIntentDigest |
| found | const | 121 | no | const found = prior(); |
| nativeArgs | variable | 123 | no | let nativeArgs = input; |
| current | const | 125 | no | const current = await conversationRuntime.get(input.conversation); |
| raced | const | 135 | no | const raced = prior(); |
| created | const | 137 | no | const created = harnessApi.create({ task, ...(input.conversation ? { conversationId: input.conversation } : {}) }).run; |
| key | const | 138 | no | const key = recipe.effects.includes(&#39;provider-send&#39;) ? input.key : &#39;recipe-step:&#39; + op; |
| result | const | 144 | no | const result = await harnessApi.step(created.id, { key, tool: recipe.tool, arguments: nativeArgs }); |
| outcome | const | 152 | no | const outcome = recipe.effects.includes(&#39;provider-send&#39;) |
| latest | const | 160 | no | const latest = status(created.id); |
| source | variable | 163 | no | let source = result.result; |
| current | const | 170 | no | const current = status(created.id); |
| notSent | const | 172 | no | const notSent = current.send?.state === &#39;not-sent&#39;; |
| run | const | 180 | no | const run = harnessApi.get(runId).run; |
| step | const | 182 | no | const step = run.steps.find((s) =&gt; s.key === stepKey); |
| result | const | 186 | no | const result = harnessApi.reconcileStep(runId, stepKey); |
| prior | const | 192 | no | const prior = status(runId); |
| run | const | 197 | no | const run = harnessApi.get(runId).run; |
| recipe | const | 198 | no | const recipe = recipeDefinition(prior.recipe); |
| step | const | 199 | no | const step = run.steps.at(-1); |
| snapshot | const | 204 | no | const snapshot = await conversationRuntime.get(run.conversationId); |
| turn | const | 205 | no | const turn = snapshot.turns?.find((t) =&gt; t.key === step.key); |
| out | const | 214 | no | const out = harnessApi.finish(runId, { status: state }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |
| ./catalog.mjs | import | 4 | [studio/src/recipes/catalog.mjs](./catalog.mjs.md) |
| ./plan.mjs | import | 5 | [studio/src/recipes/plan.mjs](./plan.mjs.md) |
| ../capture/harness-runs.mjs | import | 6 | [studio/src/capture/harness-runs.mjs](../capture/harness-runs.mjs.md) |
| ../studio/conversation-tools.mjs | import | 7 | [studio/src/studio/conversation-tools.mjs](../studio/conversation-tools.mjs.md) |
| ../studio/tool-result.mjs | import | 8 | [studio/src/studio/tool-result.mjs](../studio/tool-result.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/recipe-routes.mjs](../studio/recipe-routes.mjs.md) | ../recipes/service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Recipe-facing orchestration over the ONE existing Studio harness API.
// No independent CDP, provider sender, parser or persistent run store.
import { randomUUID } from 'node:crypto';
import { listRecipes, recipeDefinition } from './catalog.mjs';
import { planRecipe } from './plan.mjs';
import { summarizeResult, argsDigestOf } from '../capture/harness-runs.mjs';
import { executeConversationTool, readSendOutcome, resolveSendOutcome, SEND_OUTCOME_TIMEOUT_MS } from '../studio/conversation-tools.mjs';
import { metadataOnly } from '../studio/tool-result.mjs';

const fail = (status, code) => Object.assign(new Error(code), { status, code });
const validOperation = (v) => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99}$/.test(v);
const toView = (r) => {
  const step = r.steps?.at(-1) ?? null;
  const open = r.status === 'running';
  return { runId: r.id, status: r.status, conversationId: r.conversationId ?? null,
    lastStep: step ? { key: step.key, tool: step.tool, status: step.status, summary: step.summary ?? null } : null,
    retryAllowed: false,
    nextSafeAction: !open ? 'none' : step?.status === 'uncertain' || step?.status === 'in_flight'
      ? 'reconcile-original-step' : step?.status === 'failed' ? 'inspect-failure'
        : 'inspect-conversation-and-close-run' };
};

// The effect state of a run whose tool call COMPLETED. A tool call that returned is not a
// send: the send verdict below decides whether the prompt actually reached the provider.
const effectStateFor = (outcome, effectful) => {
  if (!effectful) return 'none';
  if (outcome?.state === 'not-sent') return 'not-sent';
  if (outcome?.state === 'delivery-observed') return 'delivery-observed';
  return 'tool-completed-outcome-unverified';
};

// The send verdict in the step vocabulary. `lastStep.status` stays what the harness store
// recorded — the tool call completed — and `lastStep.sendStatus` states what happened to the
// PROMPT, so a reader of the step never mistakes one for the other.
const sendStatusFor = (outcome) => ({
  'not-sent': 'failed',
  'delivery-observed': 'succeeded',
  'in-flight': 'in_flight',
  'unknown': 'uncertain',
}[outcome?.state] ?? null);

export function createRecipeService({ harnessApi, conversationRuntime, sendOutcomeTimeoutMs = SEND_OUTCOME_TIMEOUT_MS } = {}) {
  if (!harnessApi || !conversationRuntime) throw fail(503, 'RECIPE_OWNER_UNAVAILABLE');
  // The SEND verdict, read fresh from the journal on every status read: a run that was still
  // in flight when it was created must not keep reporting "in flight" once the journal has
  // closed the turn. The persisted copy carries what only the live view can prove — the coded
  // reason and the size of a blocking composer draft.
  const sendOutcomeFor = (run) => {
    const persisted = run?.context?.sendOutcome ?? null;
    const step = run?.steps?.at(-1) ?? null;
    if (!run?.conversationId || step?.tool !== 'submit_conversation_turn') return persisted;
    const fresh = readSendOutcome(conversationRuntime, run.conversationId, step.key);
    if (!fresh) return persisted;
    return { ...fresh,
      reason: fresh.reason ?? persisted?.reason ?? null,
      draft: fresh.draft ?? persisted?.draft ?? null,
      sendState: fresh.sendState ?? persisted?.sendState ?? null };
  };
  const status = (runId) => {
    const run = harnessApi.get(runId).run;
    const label = /^recipe:([a-z]+\.[a-z-]+):operation:([a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99})$/.exec(run.task?.description ?? '');
    if (!label || !recipeDefinition(label[1])) throw fail(404, 'RECIPE_RUN_NOT_FOUND');
    const outcome = sendOutcomeFor(run);
    const view = toView(run);
    if (outcome && view.lastStep) view.lastStep = { ...view.lastStep, sendStatus: sendStatusFor(outcome) };
    if (outcome?.state === 'not-sent') {
      // A proven no-send is never closed as a success. The same key stays consumed: the owner
      // clears the composer and a NEW key is used, exactly like any other refused turn.
      view.nextSafeAction = outcome.draft?.present
        ? 'owner-clears-composer-draft-then-send-new-key'
        : 'inspect-blocked-turn-then-send-new-key';
    }
    return { schema: 'vivim.recipe-run/1', recipe: label[1], ...view,
      ...(outcome ? { send: outcome, sent: outcome.sent ?? null } : {}) };
  };
  return {
    list(family) { return { schema: 'vivim.recipe-catalog/1', recipes: listRecipes(family ? { family } : {}) }; },
    show(id) { const recipe = recipeDefinition(id); if (!recipe) throw fail(404, 'RECIPE_NOT_FOUND'); return recipe; },
    plan(id, input, flags = {}) { return planRecipe(id, input, flags); },
    status,
```

_First 80 of 227 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
