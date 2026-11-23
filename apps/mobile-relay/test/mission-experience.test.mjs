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

test('real in-flight Host conversations are shown without invented provider names', () => {
  const live = projectLiveMission({ id: 'c-1', state: 'waiting_reply' });
  assert.equal(live.status, 'working');
  assert.equal(live.phase, 'Waiting for an answer');
  assert.equal(live.title, 'Your conversation');
  assert.equal(projectLiveMission({ id: 'c-2', state: 'delivered' }), null);
});

test('saved Work reflects user-attested state without implying an agent dispatched it', () => {
  const mission = projectWorkMission({ id: 'work-1', title: 'Organize documents', status: 'completed' });
  assert.equal(mission.status, 'recorded');
  assert.match(mission.message, /not proof of execution/i);
  assert.equal(mission.evidence.independentlyVerified, false);
  const blocked = projectWorkMission({ id: 'work-2', status: 'blocked', nextAction: 'Choose dates' });
  assert.equal(blocked.needsYou, true);
  assert.equal(blocked.action, 'Choose dates');
});

test('approval, money, messages, uncertainty, and irreversible effects are never batched away', () => {
  const result = organizeInterruptions([
    { id: 'a', safeAuthorized: true, readOnly: true, requiresApproval: true, effect: 'spend' },
    { id: 'b', effect: 'external-message' },
    { id: 'c', effect: 'irreversible' },
    { id: 'd', effect: 'permission' },
    { id: 'e', outcomeUncertain: true },
    { id: 'f', safeAuthorized: true, readOnly: true },
    { id: 'g', reason: 'Choose window seat' },
    { id: 'g', reason: 'duplicate' },
    { id: 'h', reason: 'Choose hotel style' }
  ]);
  assert.deepEqual(result.immediate.map(i => i.id), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(result.automatic.map(i => i.id), ['f']);
  assert.deepEqual(result.batch.map(i => i.id), ['g', 'h']);
  assert.deepEqual(result.grants, []);
});

test('unknown or malformed command effect cannot be silently automatic', () => {
  const requests = [
    { id: 'unknown-write', effect: 'file-system-write', safeAuthorized: true, readOnly: true },
    { id: 'malformed-effect', effect: { kind: 'read' }, safeAuthorized: true, readOnly: true },
    { id: 'null-effect', effect: null, safeAuthorized: true, readOnly: true },
    { id: 'known-external', effect: 'external-message', safeAuthorized: true, readOnly: true },
    { id: 'known-read', effect: 'read', safeAuthorized: true, readOnly: true },
    { id: 'known-none', effect: 'none', safeAuthorized: true, readOnly: true },
    { id: 'unspecified', safeAuthorized: true, readOnly: true }
  ];
  const policy = organizeInterruptions(requests);
  assert.deepEqual(policy.immediate.map(r => r.id),
    ['unknown-write', 'malformed-effect', 'null-effect', 'known-external']);
  assert.deepEqual(policy.automatic.map(r => r.id), ['known-read', 'known-none', 'unspecified']);
  assert.deepEqual(policy.batch, []);
  assert.deepEqual(policy.grants, []);
  assert.ok(policy.immediate.every(r => r.requiresApproval === false),
    'categorization must not forge Host permission claims');
});

test('malformed inputs cannot manufacture missions', () => {
  assert.equal(projectOrchestratorMission({ state: 'complete', result: { answer: 'hello' } }), null);
  assert.equal(projectCommandMission({ status: 'done' }), null);
  assert.equal(projectWorkMission(null), null);
  assert.equal(selectTodayMission({}), null);
});

test('existing Android Today displays the real receipt as one mission card', () => {
  const commands = [{ id: 'cmd-a', consumer: 'harness', kind: 'task',
    status: 'claimed', updatedAt: '2026-11-10T06:00:00.000Z' }];
  const model = todayModel({ snapshot: {} }, commands);
  assert.equal(model.mission.source, 'host-command');
  assert.equal(model.mission.status, 'working');
  assert.equal(model.mission.eta, null);
});

test('the phone prefers user wording without exposing provider routing as the mission title', () => {
  const commands = [{ id: 'cmd-chat', consumer: 'harness', mode: 'relay-chat',
    text: 'Organize my holiday', status: 'queued', target: { provider: 'chatgpt' } }];
  const mission = todayModel({ snapshot: {} }, commands).mission;
  assert.equal(mission.title, 'Organize my holiday');
  assert.equal(mission.status, 'working');
});

test('grandmother scenario: a holiday request stays understandable from start to result', () => {
  const question = 'Find the best holiday option for us.';
  const waiting = projectOrchestratorMission(base('queued', { question, steps: [] }));
  assert.equal(waiting.title, question);
  assert.equal(waiting.eta, null);
  assert.match(waiting.phase, /Preparing/);
  const comparing = projectOrchestratorMission(base('running', { question,
    steps: [{ id: 's1', role: 'answer', state: 'ready', valid: true },
      { id: 's2', role: 'judge', state: 'asking', valid: null }] }));
  assert.equal(comparing.phase, 'Comparing the answers');
  assert.equal(comparing.needsYou, false);
  assert.doesNotMatch(comparing.message, /ChatGPT|Claude|agent|harness|context bundle/i);
  const done = projectOrchestratorMission(base('complete', { question,
    steps: [{ id: 's1', role: 'answer', state: 'ready', valid: true }],
    result: { answer: 'Mallorca is the best option for this example.' } }));
  assert.equal(done.status, 'ready');
  assert.match(done.outcome.text, /Mallorca/);
  assert.equal(done.evidence.independentlyVerified, false);
});

test('grandmother scenario: spending and external messaging remain explicitly gated', () => {
  const policy = organizeInterruptions([
    { id: 'book-trip', effect: 'spend', requiresApproval: true },
    { id: 'send-itinerary', effect: 'external-message', requiresApproval: true },
    { id: 'compare-options', safeAuthorized: true, readOnly: true },
    { id: 'hotel-style', reason: 'Which hotel style?' }
  ]);
  assert.deepEqual(policy.immediate.map(x => x.id), ['book-trip', 'send-itinerary']);
  assert.deepEqual(policy.automatic.map(x => x.id), ['compare-options']);
  assert.deepEqual(policy.batch.map(x => x.id), ['hotel-style']);
  assert.deepEqual(policy.grants, []);
});

test('grandmother scenario: a resumed mission keeps the same identity and honest state', () => {
  const stored = base('running', { steps: [{ id: 's1', role: 'verify', state: 'waiting', valid: null }] });
  const before = projectOrchestratorMission(stored);
  const after = projectOrchestratorMission({ ...stored, state: 'complete',
    steps: [{ id: 's1', role: 'verify', state: 'ready', valid: true }],
    result: { answer: 'The result was received after reopening Studio.' } });
  assert.equal(before.id, after.id);
  assert.equal(before.outcome, null);
  assert.equal(after.status, 'ready');
  assert.match(after.outcome.text, /after reopening/);
});

test('the Studio and phone source wiring keep the presentation policy read-only', () => {
  const phone = readFileSync(new URL('../ux/render.mjs', import.meta.url), 'utf8');
  const routes = readFileSync(new URL('../../../studio/src/studio/orchestrator-routes.mjs', import.meta.url), 'utf8');
  const agentRoutes = readFileSync(new URL('../../../studio/src/studio/personal-agent-routes.mjs', import.meta.url), 'utf8');
  assert.match(phone, /mission\.schema|mission\?\.schema/);
  assert.match(phone, /textContent/);
  assert.match(routes, /orchestrate\/outcomes/);
  assert.match(agentRoutes, /personal-agent\/outcomes/);
  assert.doesNotMatch(phone, /innerHTML\s*=/);
});
