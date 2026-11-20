# File: apps/mobile-relay/ux/mission-experience.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/mission-experience.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10322 B |
| Lines | 165 |
| Hash | 7629ba34897d |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MISSION_CARD_SCHEMA | const | 4 | yes | export const MISSION_CARD_SCHEMA = &#39;vivim.mission-card/1&#39;; |
| plain | function | 5 | no | const plain = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| value | function | 6 | no | const value = (v, limit = 240) =&gt; typeof v === &#39;string&#39; |
| rows | function | 8 | no | const rows = v =&gt; Array.isArray(v) ? v : []; |
| completed | const | 9 | no | const completed = new Set([&#39;ready&#39;, &#39;failed&#39;, &#39;skipped&#39;, &#39;stopped&#39;, &#39;cancelled&#39;]); |
| liveActive | const | 10 | no | const liveActive = new Set([&#39;created&#39;, &#39;remote_queued&#39;, &#39;claimed&#39;, &#39;send_authorized&#39;, &#39;waiting_reply&#39;]); |
| stageFor | function | 11 | no | const stageFor = role =&gt; ({ answer: &#39;Gathering information&#39;, synthesize: &#39;Comparing the answers&#39;, judge: &#39;Comparing the answers&#39;, critique: &#39;Checking the answer&#39;, verify: &#39;Checking the answer&#39;, revis… |
| card | function | 17 | no | function card(fields) { |
| projectOrchestratorMission | function | 24 | yes | export function projectOrchestratorMission(plan) { |
| steps | const | 26 | no | const steps = rows(plan.steps).filter(plain); |
| done | const | 27 | no | const done = steps.filter(step =&gt; completed.has(step.state)).length; |
| answers | const | 28 | no | const answers = steps.filter(step =&gt; step.state === &#39;ready&#39; &amp;&amp; step.valid === true).length; |
| doing | const | 29 | no | const doing = steps.find(step =&gt; [&#39;asking&#39;, &#39;waiting&#39;, &#39;running&#39;].includes(step.state)); |
| state | const | 30 | no | const state = value(plan.state, 30); |
| running | const | 31 | no | const running = state === &#39;queued&#39; \|\| state === &#39;running&#39;; |
| partial | const | 32 | no | const partial = state === &#39;partial&#39;; |
| finished | const | 33 | no | const finished = state === &#39;complete&#39; \|\| partial; |
| failed | const | 34 | no | const failed = state === &#39;failed&#39;; |
| stopped | const | 35 | no | const stopped = state === &#39;cancelled&#39;; |
| pickedAnswer | const | 36 | no | const pickedAnswer = typeof plan.result?.answer === &#39;string&#39; |
| hasAnswer | const | 40 | no | const hasAnswer = finished &amp;&amp; pickedAnswer.length &gt; 0; |
| title | const | 41 | no | const title = value(plan.question, 120); |
| status | const | 42 | no | const status = failed ? &#39;needs-attention&#39; : stopped ? &#39;stopped&#39; |
| phase | const | 44 | no | const phase = running ? (doing ? stageFor(doing.role) : state === &#39;queued&#39; ? &#39;Preparing your request&#39; : &#39;Waiting for the next step&#39;) : finished |
| message | const | 47 | no | const message = failed ? &#39;I could not finish this request. Check the details before trying again.&#39; |
| projectCommandMission | function | 71 | yes | export function projectCommandMission(command) { |
| state | const | 73 | no | const state = value(command.status, 30); |
| status | const | 74 | no | const status = state === &#39;done&#39; ? &#39;recorded&#39; : state === &#39;failed&#39; |
| phase | const | 76 | no | const phase = state === &#39;queued&#39; ? &#39;Waiting for your PC&#39; |
| title | const | 80 | no | const title = value(command.request, 120) \|\| value(command.label, 120) \|\| &#39;Your request&#39;; |
| projectLiveMission | function | 95 | yes | export function projectLiveMission(item) { |
| projectUncertainMission | function | 107 | yes | export function projectUncertainMission(item) { |
| projectWorkMission | function | 120 | yes | export function projectWorkMission(item) { |
| status | const | 122 | no | const status = value(item.status, 30); |
| labels | const | 123 | no | const labels = { queued: &#39;Ready to begin&#39;, active: &#39;In progress&#39;, blocked: &#39;Waiting for you&#39;, |
| organizeInterruptions | function | 141 | yes | export function organizeInterruptions(requests) { |
| immediate | const | 142 | no | const immediate = [], batch = [], automatic = []; |
| seen | const | 143 | no | const seen = new Set(); |
| effect | const | 147 | no | const effect = [&#39;spend&#39;, &#39;external-message&#39;, &#39;irreversible&#39;, &#39;permission&#39;].includes(entry.effect); |
| urgent | const | 148 | no | const urgent = effect \|\| entry.requiresApproval === true \|\| entry.outcomeUncertain === true |
| selectTodayMission | function | 158 | yes | export function selectTodayMission({ commands = [], live = [], reviews = [] } = {}) { |
| commandCards | const | 159 | no | const commandCards = rows(commands).map(projectCommandMission).filter(Boolean); |
| liveCards | const | 160 | no | const liveCards = rows(live).map(projectLiveMission).filter(Boolean); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/test/mission-experience.test.mjs](../test/mission-experience.test.mjs.md) | ../ux/mission-experience.mjs |
| [apps/mobile-relay/ux/model.mjs](./model.mjs.md) | ./mission-experience.mjs |
| [studio/src/studio/orchestrator-routes.mjs](../../../studio/src/studio/orchestrator-routes.mjs.md) | ../../../apps/mobile-relay/ux/mission-experience.mjs |
| [studio/src/studio/personal-agent-routes.mjs](../../../studio/src/studio/personal-agent-routes.mjs.md) | ../../../apps/mobile-relay/ux/mission-experience.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Lane M — projection-only Outcome Experience Intelligence.
// Consumes existing Host/Studio facts. Never plans, approves, sends, retries, or persists missions.
// Usable unchanged by Node (Studio routes) and the existing Android phone's ESM UI.
export const MISSION_CARD_SCHEMA = 'vivim.mission-card/1';
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const value = (v, limit = 240) => typeof v === 'string'
  ? v.replace(/\s+/g, ' ').trim().slice(0, limit) : '';
const rows = v => Array.isArray(v) ? v : [];
const completed = new Set(['ready', 'failed', 'skipped', 'stopped', 'cancelled']);
const liveActive = new Set(['created', 'remote_queued', 'claimed', 'send_authorized', 'waiting_reply']);
const stageFor = role => ({
  answer: 'Gathering information', synthesize: 'Comparing the answers',
  judge: 'Comparing the answers', critique: 'Checking the answer',
  verify: 'Checking the answer', revise: 'Refining the answer',
  improve: 'Refining the answer', planner: 'Planning the next step'
}[role] || 'Working on your request');
function card(fields) {
  return {
    schema: MISSION_CARD_SCHEMA, eta: null, mayApprove: false, mayExecute: false,
    ...fields
  };
}
// The existence of an AI answer is not independent proof of real-world completion.
export function projectOrchestratorMission(plan) {
  if (!plain(plan) || !value(plan.id, 100) || !value(plan.question, 500)) return null;
  const steps = rows(plan.steps).filter(plain);
  const done = steps.filter(step => completed.has(step.state)).length;
  const answers = steps.filter(step => step.state === 'ready' && step.valid === true).length;
  const doing = steps.find(step => ['asking', 'waiting', 'running'].includes(step.state));
  const state = value(plan.state, 30);
  const running = state === 'queued' || state === 'running';
  const partial = state === 'partial';
  const finished = state === 'complete' || partial;
  const failed = state === 'failed';
  const stopped = state === 'cancelled';
  const pickedAnswer = typeof plan.result?.answer === 'string'
    ? plan.result.answer.trim()
    : rows(plan.result?.answers).filter(a => typeof a?.answer === 'string')
      .map(a => a.answer.trim()).filter(Boolean).join('\n\n');
  const hasAnswer = finished && pickedAnswer.length > 0;
  const title = value(plan.question, 120);
  const status = failed ? 'needs-attention' : stopped ? 'stopped'
    : partial ? 'partial' : finished ? 'ready' : running ? 'working' : 'unconfirmed';
  const phase = running ? (doing ? stageFor(doing.role) : state === 'queued'
    ? 'Preparing your request' : 'Waiting for the next step') : finished
      ? 'Answer received' : failed ? 'Could not finish' : stopped ? 'Stopped' : 'Status not confirmed';
  const message = failed ? 'I could not finish this request. Check the details before trying again.'
    : stopped ? 'You stopped waiting. An earlier question might still finish in its original AI tab.'
      : partial ? 'I have part of an answer, but some steps did not finish.'
        : finished ? (hasAnswer ? 'An answer is ready for you to read.' : 'The work ended, but no answer text was provided.')
          : running ? 'I am working through the steps needed for your request.'
            : 'I cannot confirm the current state of this request.';
  return card({
    id: 'orchestrate:' + value(plan.id, 100), source: 'studio-orchestrator',
    title, status, phase, message, needsYou: failed || partial,
    action: failed || partial ? 'Review the result and any missing steps' : null,
    progress: { complete: done, total: steps.length, answered: answers },
    evidence: { sourceId: value(plan.id, 100), sourceState: state,
      answerObserved: hasAnswer, independentlyVerified: false,
      updatedAt: value(plan.updatedAt, 60) || null },
    outcome: hasAnswer ? { label: partial ? 'Partial answer' : 'Answer', text: pickedAnswer.slice(0, 6000),
      qualification: 'An AI answer was observed. Real-world results were not independently verified.' } : null,
    detail: steps.map(step => ({
      id: value(step.id, 80), stage: stageFor(step.role),
      state: value(step.state, 40), observedAnswer: step.state === 'ready' && step.valid === true
    }))
  });
}
// A completed bridge command does not imply verified external delivery.
// The receipt remains authoritative; this is only an understandable reading.
export function projectCommandMission(command) {
  if (!plain(command) || !value(command.id, 120)) return null;
  const state = value(command.status, 30);
  const status = state === 'done' ? 'recorded' : state === 'failed'
    ? 'needs-attention' : ['queued', 'claimed'].includes(state) ? 'working' : 'unconfirmed';
  const phase = state === 'queued' ? 'Waiting for your PC'
    : state === 'claimed' ? 'Your PC is handling this'
      : state === 'done' ? 'PC result recorded'
        : state === 'failed' ? 'Your PC reported a problem' : 'Status not confirmed';
  const title = value(command.request, 120) || value(command.label, 120) || 'Your request';
```

_First 80 of 166 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
