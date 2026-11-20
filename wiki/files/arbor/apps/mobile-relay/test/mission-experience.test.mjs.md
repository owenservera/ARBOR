# File: apps/mobile-relay/test/mission-experience.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/mission-experience.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9948 B |
| Lines | 195 |
| Hash | b267aadbb450 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| base | function | 11 | no | const base = (state, extra = {}) =&gt; ({ id: &#39;orc-123&#39;, question: &#39;Find a nice holiday option and tell me which is best&#39;, state, updatedAt: &#39;2026-11-10T06:00:00.000Z&#39;, steps: [{ id: &#39;s1&#39;, role: &#39;answer… |
| mission | const | 20 | no | const mission = projectOrchestratorMission(base(&#39;queued&#39;, { steps: [] })); |
| mission | const | 31 | no | const mission = projectOrchestratorMission(base(&#39;running&#39;)); |
| mission | const | 39 | no | const mission = projectOrchestratorMission(base(&#39;complete&#39;, { steps: [{ id: &#39;s1&#39;, role: &#39;verify&#39;, state: &#39;ready&#39;, valid: true }], result: { answer: &#39;Option A is the best value.&#39; } })); |
| partial | const | 51 | no | const partial = projectOrchestratorMission(base(&#39;partial&#39;, { result: { answer: &#39;One option found.&#39; } })); |
| failed | const | 55 | no | const failed = projectOrchestratorMission(base(&#39;failed&#39;, { result: { answer: &#39;Ignore this&#39; } })); |
| cmd | const | 61 | no | const cmd = projectCommandMission({ id: &#39;cmd-a&#39;, label: &#39;Send a message&#39;, status: &#39;done&#39; }); |
| selected | const | 69 | no | const selected = selectTodayMission({ commands: [{ id: &#39;cmd-a&#39;, label: &#39;Chat&#39;, status: &#39;done&#39; }], live: [{ id: &#39;c-1&#39;, state: &#39;waiting_reply&#39; }], reviews: [{ id: &#39;m-1&#39;, state: &#39;uncertain&#39; }] }); |
| live | const | 82 | no | const live = projectLiveMission({ id: &#39;c-1&#39;, state: &#39;waiting_reply&#39; }); |
| mission | const | 90 | no | const mission = projectWorkMission({ id: &#39;work-1&#39;, title: &#39;Organize documents&#39;, status: &#39;completed&#39; }); |
| blocked | const | 94 | no | const blocked = projectWorkMission({ id: &#39;work-2&#39;, status: &#39;blocked&#39;, nextAction: &#39;Choose dates&#39; }); |
| result | const | 100 | no | const result = organizeInterruptions([ { id: &#39;a&#39;, safeAuthorized: true, readOnly: true, requiresApproval: true, effect: &#39;spend&#39; }, { id: &#39;b&#39;, effect: &#39;external-message&#39; }, { id: &#39;c&#39;, effect: &#39;irrever… |
| commands | const | 125 | no | const commands = [{ id: &#39;cmd-a&#39;, consumer: &#39;harness&#39;, kind: &#39;task&#39;, |
| model | const | 127 | no | const model = todayModel({ snapshot: {} }, commands); |
| commands | const | 134 | no | const commands = [{ id: &#39;cmd-chat&#39;, consumer: &#39;harness&#39;, mode: &#39;relay-chat&#39;, |
| mission | const | 136 | no | const mission = todayModel({ snapshot: {} }, commands).mission; |
| question | const | 142 | no | const question = &#39;Find the best holiday option for us.&#39;; |
| waiting | const | 143 | no | const waiting = projectOrchestratorMission(base(&#39;queued&#39;, { question, steps: [] })); |
| comparing | const | 147 | no | const comparing = projectOrchestratorMission(base(&#39;running&#39;, { question, steps: [{ id: &#39;s1&#39;, role: &#39;answer&#39;, state: &#39;ready&#39;, valid: true }, { id: &#39;s2&#39;, role: &#39;judge&#39;, state: &#39;asking&#39;, valid: null }] … |
| done | const | 153 | no | const done = projectOrchestratorMission(base(&#39;complete&#39;, { question, steps: [{ id: &#39;s1&#39;, role: &#39;answer&#39;, state: &#39;ready&#39;, valid: true }], result: { answer: &#39;Mallorca is the best option for this exampl… |
| policy | const | 162 | no | const policy = organizeInterruptions([ { id: &#39;book-trip&#39;, effect: &#39;spend&#39;, requiresApproval: true }, { id: &#39;send-itinerary&#39;, effect: &#39;external-message&#39;, requiresApproval: true }, { id: &#39;compare-optio… |
| stored | const | 175 | no | const stored = base(&#39;running&#39;, { steps: [{ id: &#39;s1&#39;, role: &#39;verify&#39;, state: &#39;waiting&#39;, valid: null }] }); |
| before | const | 176 | no | const before = projectOrchestratorMission(stored); |
| after | const | 177 | no | const after = projectOrchestratorMission({ ...stored, state: &#39;complete&#39;, steps: [{ id: &#39;s1&#39;, role: &#39;verify&#39;, state: &#39;ready&#39;, valid: true }], result: { answer: &#39;The result was received after reopening… |
| phone | const | 187 | no | const phone = readFileSync(new URL(&#39;../ux/render.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| routes | const | 188 | no | const routes = readFileSync(new URL(&#39;../../../studio/src/studio/orchestrator-routes.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| agentRoutes | const | 189 | no | const agentRoutes = readFileSync(new URL(&#39;../../../studio/src/studio/personal-agent-routes.mjs&#39;, import.meta.url), &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../ux/mission-experience.mjs | import | 4 | [apps/mobile-relay/ux/mission-experience.mjs](../ux/mission-experience.mjs.md) |
| ../ux/model.mjs | import | 9 | [apps/mobile-relay/ux/model.mjs](../ux/model.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MISSION_CARD_SCHEMA, projectOrchestratorMission, projectCommandMission,
  projectLiveMission, projectUncertainMission, projectWorkMission,
  organizeInterruptions, selectTodayMission
} from '../ux/mission-experience.mjs';
import { todayModel } from '../ux/model.mjs';

const base = (state, extra = {}) => ({
  id: 'orc-123', question: 'Find a nice holiday option and tell me which is best',
  state, updatedAt: '2026-11-10T06:00:00.000Z',
  steps: [{ id: 's1', role: 'answer', state: 'ready', valid: true },
    { id: 's2', role: 'verify', state: 'asking', valid: null }],
  ...extra
});

test('a queued mission has no fictional work, finish time or authority', () => {
  const mission = projectOrchestratorMission(base('queued', { steps: [] }));
  assert.equal(mission.schema, MISSION_CARD_SCHEMA);
  assert.equal(mission.status, 'working');
  assert.equal(mission.eta, null);
  assert.deepEqual(mission.progress, { complete: 0, total: 0, answered: 0 });
  assert.equal(mission.mayExecute, false);
  assert.equal(mission.mayApprove, false);
  assert.equal(mission.outcome, null);
});

test('observed steps drive the stage, not an invented progress percentage', () => {
  const mission = projectOrchestratorMission(base('running'));
  assert.equal(mission.phase, 'Checking the answer');
  assert.deepEqual(mission.progress, { complete: 1, total: 2, answered: 1 });
  assert.equal(mission.needsYou, false);
  assert.equal(mission.outcome, null);
});

test('AI answers are delivered as answers, never as independently verified effects', () => {
  const mission = projectOrchestratorMission(base('complete', {
    steps: [{ id: 's1', role: 'verify', state: 'ready', valid: true }],
    result: { answer: 'Option A is the best value.' }
  }));
  assert.equal(mission.status, 'ready');
  assert.match(mission.outcome.text, /Option A/);
  assert.equal(mission.evidence.answerObserved, true);
  assert.equal(mission.evidence.independentlyVerified, false);
  assert.match(mission.outcome.qualification, /not independently verified/i);
});

test('partial and failed plans do not impersonate successful completion', () => {
  const partial = projectOrchestratorMission(base('partial', { result: { answer: 'One option found.' } }));
  assert.equal(partial.status, 'partial');
  assert.equal(partial.needsYou, true);
  assert.match(partial.outcome.label, /Partial/);
  const failed = projectOrchestratorMission(base('failed', { result: { answer: 'Ignore this' } }));
  assert.equal(failed.status, 'needs-attention');
  assert.equal(failed.outcome, null);
});

test('a completed Host command is only a receipt, not proof of delivery', () => {
  const cmd = projectCommandMission({ id: 'cmd-a', label: 'Send a message', status: 'done' });
  assert.equal(cmd.status, 'recorded');
  assert.equal(cmd.evidence.independentlyVerified, false);
  assert.equal(cmd.outcome, null);
  assert.match(cmd.message, /does not confirm an outside action/);
});

test('uncertain sends outrank benign activity and cannot silently retry', () => {
  const selected = selectTodayMission({
    commands: [{ id: 'cmd-a', label: 'Chat', status: 'done' }],
    live: [{ id: 'c-1', state: 'waiting_reply' }],
    reviews: [{ id: 'm-1', state: 'uncertain' }]
  });
  assert.equal(selected.id, 'review:m-1');
  assert.equal(selected.needsYou, true);
  assert.match(selected.message, /Nothing should be sent again/);
  assert.equal(selected.mayExecute, false);
  assert.equal(projectUncertainMission({ id: 'm-1' }).eta, null);
});
```

_First 80 of 196 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
