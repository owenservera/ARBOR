// PY-001/PY-002: prove existing Studio Work *reducer* reuse, not PWA ingress.
// This test never initializes a browser, Host, Studio server, provider, or dispatcher.
// Source-backed positive/negative tests; mobile authorization still UNIMPLEMENTED.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWork, transitionWork, setWorkNextAction, workSummary } from '../../src/agents/personal-agent-work.mjs';

const NOW = '2026-11-23T19:30:00.000Z';
const empty = () => ({work: [], updatedAt: NOW});
const intent = (overrides={}) => ({
  title: 'Build a personal Wiki page',
  objective: 'Create an approved draft page, then ask me before writing.',
  idempotencyKey: 'pwa-explicit-owner:sample-r001',
  now: NOW,
  ...overrides,
});

test('one explicitly requested Work record is local and queued, never a provider execution', () => {
  const {state, item, changed} = createWork(empty(), intent());
  assert.equal(changed, true);
  assert.match(item.id, /^work-[a-f0-9]{32}$/);
  assert.equal(item.status, 'queued');
  assert.equal(item.source, 'user-authored');
  assert.deepEqual(item.events, [{type:'created', at:NOW, basis:'explicit-user-request'}]);
  assert.deepEqual(item.evidence, []);
  assert.equal(item.nextAction, null);
  assert.equal(Object.hasOwn(item, 'providerReceipt'), false);
  assert.equal(Object.hasOwn(item, 'executionAuthorized'), false);
  assert.equal(workSummary(state).byStatus.queued, 1);
  assert.match(workSummary(state).authority, /not provider execution/);
});

test('same-key repeat is idempotent; same key with changed objective fails closed', () => {
  const first = createWork(empty(), intent());
  const repeated = createWork(first.state, intent());
  assert.equal(repeated.changed, false);
  assert.equal(repeated.item.id, first.item.id);
  assert.strictEqual(repeated.state, first.state);
  assert.equal(workSummary(repeated.state).total, 1);
  assert.throws(() => createWork(first.state, intent({objective:'Send this to every provider'})),
    {code:'PERSONAL_AGENT_WORK_IDEMPOTENCY_CONFLICT'});
});

test('empty or malformed owner request cannot create a Work record', () => {
  for (const change of [
    {title:' '}, {objective:''}, {idempotencyKey:'short'},
    {idempotencyKey:'invalid key with spaces'},
    {title:'x'.repeat(161)}, {objective:'x'.repeat(4001)}
  ]) {
    assert.throws(() => createWork(empty(), intent(change)),
      {code:'PERSONAL_AGENT_WORK_INVALID'});
  }
});

test('Work cannot silently complete without evidence or skip explicit active transition', () => {
  const first = createWork(empty(), intent());
  assert.throws(() => transitionWork(first.state, {id:first.item.id,to:'completed',now:NOW}),
    {code:'PERSONAL_AGENT_WORK_TRANSITION'});
  const active = transitionWork(first.state, {id:first.item.id,to:'active',now:NOW});
  assert.equal(active.item.status, 'active');
  assert.throws(() => transitionWork(active.state, {id:first.item.id,to:'completed',now:NOW}),
    {code:'PERSONAL_AGENT_WORK_EVIDENCE_REQUIRED'});
  const completed = transitionWork(active.state, {id:first.item.id,to:'completed',
    evidence:['github:owenservera/ARBOR/issues/33'],now:NOW});
  assert.equal(completed.item.status, 'completed');
  assert.deepEqual(completed.item.evidence.map(x=>x.basis),
    ['user-attested; unverified-for-live-execution']);
  assert.throws(() => transitionWork(completed.state,
    {id:first.item.id,to:'active',now:NOW}), {code:'PERSONAL_AGENT_WORK_TRANSITION'});
});

test('cancelled and blocked Work do not become dispatched or auto-resumed', () => {
  const {state,item} = createWork(empty(),intent());
  assert.throws(() => transitionWork(state,{id:item.id,to:'blocked',now:NOW}),
    {code:'PERSONAL_AGENT_WORK_INVALID'});
  const blocked=transitionWork(state,{id:item.id,to:'blocked',note:'Host grant unavailable',now:NOW});
  assert.equal(blocked.item.status,'blocked');
  assert.equal(blocked.item.nextAction,'Host grant unavailable');
  const cancelled=transitionWork(blocked.state,{id:item.id,to:'cancelled',now:NOW});
  assert.equal(cancelled.item.status,'cancelled');
  assert.throws(() => transitionWork(cancelled.state,{id:item.id,to:'active',now:NOW}),
    {code:'PERSONAL_AGENT_WORK_TRANSITION'});
});

test('user-authored next action is a plan field, not an effect or dispatch receipt', () => {
  const {state,item}=createWork(empty(),intent());
  const next=setWorkNextAction(state,{id:item.id,nextAction:'Review proposed Wiki change',now:NOW});
  assert.equal(next.item.nextAction,'Review proposed Wiki change');
  assert.equal(next.item.status,'queued');
  assert.equal(next.item.events.at(-1).basis,'user-authored-local-plan');
  assert.equal(Object.hasOwn(next.item,'providerReceipt'),false);
});
