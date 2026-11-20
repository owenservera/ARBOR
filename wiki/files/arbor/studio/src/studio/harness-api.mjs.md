# File: studio/src/studio/harness-api.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/harness-api.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12201 B |
| Lines | 174 |
| Hash | ec27fc9c6e1c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HARNESS_RETRYABLE_TOOLS | const | 14 | yes | export const HARNESS_RETRYABLE_TOOLS = Object.freeze( CONVERSATION_TOOLS.filter((t) =&gt; t.annotations?.readOnlyHint === true).map((t) =&gt; t.name)); |
| str | const | 17 | no | const str = { type: &#39;string&#39; }; |
| objectSchema | function | 18 | no | const objectSchema = (properties = {}, required = []) =&gt; ({ type: &#39;object&#39;, properties, ...(required.length ? { required } : {}) }); |
| runBody | const | 19 | no | const runBody = objectSchema({ task: { oneOf: [{ ...str, minLength: 1, maxLength: 2000 }, objectSchema({ description: { ...str, minLength: 1, maxLength: 2000 } }, [&#39;description&#39;])] }, conversationId:… |
| stepBody | const | 23 | no | const stepBody = objectSchema({ key: { ...str, minLength: 1, maxLength: 200 }, tool: { type: &#39;string&#39;, enum: CONVERSATION_TOOLS.map((t) =&gt; t.name) }, arguments: { type: &#39;object&#39;, default: {} }, }, [&#39;… |
| finishBody | const | 28 | no | const finishBody = objectSchema({ status: { type: &#39;string&#39;, enum: [&#39;succeeded&#39;, &#39;failed&#39;, &#39;interrupted&#39;] } }, [&#39;status&#39;]); |
| noteBody | const | 29 | no | const noteBody = objectSchema({ context: { type: &#39;object&#39; } }, [&#39;context&#39;]); |
| runView | function | 31 | no | const runView = (run) =&gt; ({ ...run }); |
| createHarnessApi | function | 33 | yes | export function createHarnessApi({ runs, intentBindings = null, conversationRuntime = null } = {}) { |
| recordSubmitIntent | function | 39 | no | const recordSubmitIntent = (runId, body) =&gt; { |
| conversationId | const | 41 | no | const conversationId = body.arguments?.conversation; |
| threadKey | variable | 43 | no | let threadKey = null; |
| completeSubmitIntent | function | 52 | no | const completeSubmitIntent = (binding, runId, body) =&gt; { |
| conversationId | const | 54 | no | const conversationId = body.arguments?.conversation; |
| requestKey | const | 55 | no | const requestKey = body.arguments?.key; |
| turn | const | 60 | no | const turn = conversationRuntime.journalSnapshot(conversationId)?.turns?.find((t) =&gt; t?.key === requestKey) ?? null; |
| binding | const | 73 | no | const binding = recordSubmitIntent(id, body); |
| out | variable | 77 | no | let out; |
| run | const | 98 | no | const run = runs.get(runId); |
| binding | const | 99 | no | const binding = intentBindings.find({ runId, stepKey }); |
| journal | variable | 100 | no | let journal = null; |
| reconciliation | const | 104 | no | const reconciliation = reconcileUncertainStep({ run, stepKey, journal, intentBinding: binding }); |
| lifecycle | const | 105 | no | const lifecycle = reconcileLifecycle({ run, stepKey, journal, binding, reconcileUncertainStep, baseline: null, attachment: null, capture: null, acceptance: null, goal: null, origin: journal?.origin ?… |
| registerHarnessTools | function | 118 | yes | export function registerHarnessTools({ add, harnessApi }) { |
| runParameter | const | 120 | no | const runParameter = { run: { type: &#39;string&#39;, minLength: 10, maxLength: 64, pattern: &#39;^[a-f0-9-]{10,64}$&#39; } }; |
| out | const | 139 | no | const out = harnessApi.reconcileStep(p.run, body.stepKey); |
| conversationToolExecutor | function | 159 | yes | export function conversationToolExecutor(conversationRuntime) { |
| validateHarnessStepBody | function | 168 | yes | export function validateHarnessStepBody(body) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./http.mjs | import | 4 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./conversation-tools.mjs | import | 5 | [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) |
| ./harness-executor-preflight.mjs | import | 6 | [studio/src/studio/harness-executor-preflight.mjs](./harness-executor-preflight.mjs.md) |
| ./uncertain-step-reconciler.mjs | import | 7 | [studio/src/studio/uncertain-step-reconciler.mjs](./uncertain-step-reconciler.mjs.md) |
| ./core-runtime-bridge.mjs | import | 8 | [studio/src/studio/core-runtime-bridge.mjs](./core-runtime-bridge.mjs.md) |
| ../capture/harness-runs.mjs | import | 9 | [studio/src/capture/harness-runs.mjs](../capture/harness-runs.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/run.mjs](../../bin/commands/run.mjs.md) | ../../src/studio/harness-api.mjs |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./harness-api.mjs |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./harness-api.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Harness run surfaces over the EXISTING runtime owner: one durable run identity per task, with
// steps executed through the same conversation tools and the same conversation runtime that serve
// every other client. No second browser actor, no second evidence store, no new write path.
import { problem } from './http.mjs';
import { CONVERSATION_TOOLS, executeConversationTool, validateConversationTool } from './conversation-tools.mjs';
import { withDispatchPreflight } from './harness-executor-preflight.mjs';
import { reconcileUncertainStep } from './uncertain-step-reconciler.mjs';
import { reconcileLifecycle } from './core-runtime-bridge.mjs';
import { argsDigestOf } from '../capture/harness-runs.mjs';

// Same-key retry after a PROVEN not-dispatched failure is allowed only for tools the registry
// itself marks read-only. The policy is derived from the single tool surface — never hand-maintained
// here — so a future read-only tool is automatically covered and an effectful tool can never slip in.
export const HARNESS_RETRYABLE_TOOLS = Object.freeze(
  CONVERSATION_TOOLS.filter((t) => t.annotations?.readOnlyHint === true).map((t) => t.name));

const str = { type: 'string' };
const objectSchema = (properties = {}, required = []) => ({ type: 'object', properties, ...(required.length ? { required } : {}) });
const runBody = objectSchema({
  task: { oneOf: [{ ...str, minLength: 1, maxLength: 2000 }, objectSchema({ description: { ...str, minLength: 1, maxLength: 2000 } }, ['description'])] },
  conversationId: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$' },
}, ['task']);
const stepBody = objectSchema({
  key: { ...str, minLength: 1, maxLength: 200 },
  tool: { type: 'string', enum: CONVERSATION_TOOLS.map((t) => t.name) },
  arguments: { type: 'object', default: {} },
}, ['key', 'tool']);
const finishBody = objectSchema({ status: { type: 'string', enum: ['succeeded', 'failed', 'interrupted'] } }, ['status']);
const noteBody = objectSchema({ context: { type: 'object' } }, ['context']);

const runView = (run) => ({ ...run });

export function createHarnessApi({ runs, intentBindings = null, conversationRuntime = null } = {}) {
  if (!runs) return null;
  // Round 7 seam: submit steps get a durable pre-effect intent binding recorded BEFORE the store
  // dispatches, and completed with the OBSERVED journal turn identity after the executor returns.
  // A crash between the two leaves an incomplete binding, which the read-only reconcile query
  // honestly classifies as still_unknown — never a guess, never a resend authorization.
  const recordSubmitIntent = (runId, body) => {
    if (!intentBindings || !conversationRuntime || body.tool !== 'submit_conversation_turn') return null;
    const conversationId = body.arguments?.conversation;
    if (typeof conversationId !== 'string' || !conversationId) return null;
    let threadKey = null;
    try { threadKey = conversationRuntime.journalSnapshot?.(conversationId)?.threadKey ?? null; } catch { threadKey = null; }
    if (!threadKey) return null; // no durable thread identity observable pre-effect: no binding claim
    return intentBindings.record({
      runId, stepKey: body.key, stepTool: body.tool,
      argsDigest: argsDigestOf(body.arguments ?? {}),
      conversationId, threadKey,
    });
  };
  const completeSubmitIntent = (binding, runId, body) => {
    if (!binding || !intentBindings || !conversationRuntime) return;
    const conversationId = body.arguments?.conversation;
    const requestKey = body.arguments?.key;
    if (typeof conversationId !== 'string' || typeof requestKey !== 'string' || !requestKey) return;
    try {
      // The journal owns turn identity: the submit args' durable request key IS the journal
      // turn key, so the join is read from the journal itself (not from a summarized result).
      const turn = conversationRuntime.journalSnapshot(conversationId)?.turns?.find((t) => t?.key === requestKey) ?? null;
      if (turn?.key && turn?.payloadDigest) {
        intentBindings.complete({ runId: binding.runId, stepKey: binding.stepKey, journalTurnKey: turn.key, journalPayloadDigest: turn.payloadDigest });
      }
      // No journal turn under that key: the dispatch never reached the journal. The binding
      // stays incomplete; the reconcile query classifies it honestly as still_unknown.
    } catch { /* journal unreadable: reconcile classifies the incomplete binding honestly */ }
  };
  return {
    create: (body) => ({ run: runView(runs.create(body)) }),
    list: () => ({ runs: runs.list() }),
    get: (id) => ({ run: runView(runs.get(id)) }),
    step: async (id, body) => {
      const binding = recordSubmitIntent(id, body);
      // The completion runs in `finally`: an uncertain step THROWS (STEP_UNCERTAIN) and that is
      // precisely the case the binding must survive for — the journal-side join is read after
      // the store has durably recorded the attempt, success or failure alike.
      let out;
      try {
        out = await runs.step(id, { key: body.key, tool: body.tool, args: body.arguments ?? {} });
      } finally {
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
