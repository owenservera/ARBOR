import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseSwarmConfig, planSwarm, runSwarm, fence, renderPrompt } from '../../src/agents/swarm.mjs';
import { fakeRouter } from './fake-router.mjs';

const BASE = { task: 'Why is the sky blue?', members: ['chatgpt:gpt-6', 'gemini:gemini-3-pro'], judge: 'claude:opus-5.5' };

test('planSwarm builds steps per pattern', () => {
  const par = planSwarm({ ...BASE, pattern: 'parallel' });
  assert.deepEqual(par.steps.map((s) => [s.id, s.role, s.dependsOn]), [['s1', 'answer', []], ['s2', 'answer', []], ['s3', 'synthesize', ['s1', 's2']]]);
  assert.equal(par.budget.maxSends, 4);
  assert.equal(planSwarm({ ...BASE, pattern: 'vote' }).steps.at(-1).role, 'judge');
  const pipe = planSwarm({ ...BASE, pattern: 'pipeline' });
  assert.deepEqual(pipe.steps[1].dependsOn, ['s1']);
  assert.match(pipe.steps[1].promptTemplate, /\{\{answer:s1\}\}/);
  const deb = planSwarm({ ...BASE, pattern: 'debate', budget: { maxSends: 5 } });
  assert.deepEqual(deb.steps.map((s) => s.role), ['answer', 'answer', 'revise', 'revise', 'synthesize']);
  assert.deepEqual(deb.steps[4].dependsOn, ['s3', 's4']);
});

test('planSwarm enforces budget and judge-provider rule', () => {
  assert.throws(() => planSwarm({ ...BASE, pattern: 'debate' }), { code: 'SWARM_BUDGET' }); // 5 > 4
  assert.throws(() => planSwarm({ ...BASE, members: ['a:1', 'b:1', 'c:1', 'd:1'] }), { code: 'SWARM_BUDGET' });
  assert.throws(() => planSwarm({ ...BASE, budget: { maxSends: 2 } }), { code: 'SWARM_BUDGET' });
  assert.throws(() => planSwarm({ ...BASE, members: ['claude:a', 'claude:b'], judge: 'claude:c' }), { code: 'SWARM_INVALID' });
  assert.ok(planSwarm({ ...BASE, members: ['claude:a', 'chatgpt:b'], judge: 'claude:c' }));
  assert.throws(() => planSwarm({ ...BASE, members: ['chatgpt:gpt-6'] }), { code: 'SWARM_INVALID' });
  assert.throws(() => planSwarm({ ...BASE, pattern: 'mob' }), { code: 'SWARM_INVALID' });
  assert.throws(() => planSwarm({ ...BASE, task: '  ' }), { code: 'SWARM_INVALID' });
});

test('parseSwarmConfig reads the example config', async () => {
  const cfg = parseSwarmConfig(await readFile(new URL('../../docs/swarm.example.json', import.meta.url), 'utf8'));
  assert.equal(planSwarm(cfg).steps.length, 4);
  assert.throws(() => parseSwarmConfig({ members: ['x'] }), { code: 'SWARM_INVALID' });
});

test('swarm config and plan preserve effort on members and judge', () => {
  const cfg = parseSwarmConfig({ ...BASE, members: ['chatgpt:gpt-6@high', 'gemini:pro@2'], judge: 'claude:opus@Extra High' });
  const plan = planSwarm(cfg);
  assert.deepEqual(plan.members, cfg.members);
  assert.equal(plan.judge, cfg.judge);
  assert.deepEqual(plan.steps.map((step) => step.model), [...cfg.members, cfg.judge]);
  for (const model of ['claude:opus@', 'claude:opus@high@low', 'auto:opus@high']) {
    assert.throws(() => parseSwarmConfig({ ...cfg, judge: model }), { code: 'SWARM_INVALID' });
    assert.throws(() => planSwarm({ ...cfg, members: [model, cfg.members[1]] }), { code: 'SWARM_INVALID' });
  }
  assert.throws(() => planSwarm({ ...cfg, members: ['claude:a@high', 'claude:b@2'] }), { code: 'SWARM_INVALID' });
});

test('runSwarm passes effort-bearing model references unchanged to the mock router', async () => {
  const members = ['chatgpt:gpt-6@high', 'gemini:pro@2'];
  const judge = 'claude:opus@Extra High';
  const router = fakeRouter();
  const result = await runSwarm({ plan: planSwarm({ ...BASE, members, judge }), router });
  assert.equal(result.status, 'complete');
  assert.deepEqual(router.calls.map((call) => call.provider), [...members, judge]);
});

test('runSwarm runs members before the judge and fences their answers in the judge prompt', async () => {
  const router = fakeRouter({ replyFor: (c) => c.n === 1 ? 'uses ``` inside' : c.n === 3 ? 'FINAL ANSWER' : `answer ${c.n}` });
  const res = await runSwarm({ plan: planSwarm(BASE), router });
  assert.equal(res.status, 'complete');
  assert.equal(res.sends.length, 3);
  assert.deepEqual(router.calls.map((c) => c.provider), ['chatgpt:gpt-6', 'gemini:gemini-3-pro', 'claude:opus-5.5']);
  assert.ok(router.calls.every((c) => c.threadUrl === 'new'));
  const judgePrompt = router.calls[2].prompt;
  assert.ok(judgePrompt.includes('Why is the sky blue?'));
  assert.ok(judgePrompt.includes('Answer 1:\n````\nuses ``` inside\n````'));
  assert.ok(judgePrompt.includes('Answer 2:\n```\nanswer 2\n```'));
  assert.match(judgePrompt, /final answer/i);
  assert.deepEqual(res.verdict, { step: 's3', model: 'claude:opus-5.5', text: 'FINAL ANSWER', winner: null });
});

test('vote verdict parses WINNER and FINAL', async () => {
  const router = fakeRouter({ replyFor: (c) => c.n === 3 ? 'WINNER: 2\nFINAL: Rayleigh scattering.' : 'x' });
  const res = await runSwarm({ plan: planSwarm({ ...BASE, pattern: 'vote' }), router });
  assert.equal(res.verdict.winner, 2);
  assert.equal(res.verdict.text, 'Rayleigh scattering.');
});

test('an uncertain step stops the run and is never resent', async () => {
  const router = fakeRouter({ statusFor: (c) => c.n === 2 ? 'uncertain' : 'complete' });
  const res = await runSwarm({ plan: planSwarm(BASE), router });
  assert.equal(res.status, 'uncertain');
  assert.equal(res.stoppedAt, 's2');
  assert.equal(res.verdict, null);
  assert.equal(router.calls.length, 2); // judge never sent, s2 never retried
  assert.equal(res.answers.s1, 'reply 1 from chatgpt:gpt-6');
});

test('a declined approval sends nothing in that wave', async () => {
  const router = fakeRouter();
  const res = await runSwarm({ plan: planSwarm(BASE), router, approve: ({ step }) => step.role !== 'synthesize' });
  assert.equal(res.status, 'declined');
  assert.equal(res.stoppedAt, 's3');
  assert.equal(router.calls.length, 2);
});

test('pipeline passes the previous answer forward', async () => {
  const router = fakeRouter();
  await runSwarm({ plan: planSwarm({ ...BASE, pattern: 'pipeline' }), router });
  assert.ok(router.calls[1].prompt.includes('```\nreply 1 from chatgpt:gpt-6\n```'));
});

test('renderPrompt is single-pass and fence outgrows inner backticks', () => {
  assert.equal(renderPrompt('{{task}}', { task: 'say {{answers}}' }), 'say {{answers}}');
  assert.equal(fence('a ````` b').split('\n')[0], '``````');
  assert.throws(() => renderPrompt('{{answer:s9}}', { task: 't' }), { code: 'SWARM_INVALID' });
});

test('a non-complete step stops the rest of its wave (no further sends)', async () => {
  const { planSwarm, runSwarm } = await import('../../src/agents/swarm.mjs');
  const plan = planSwarm({ task: 't', pattern: 'parallel', members: ['chatgpt:gpt-6', 'claude:opus-5.5'], judge: 'gemini:pro', budget: { maxSends: 3 } });
  const asked = [];
  const router = { ask: async (o) => { asked.push(o.provider); return { requestId: `r${asked.length}` }; }, wait: async () => ({ status: 'uncertain' }) };
  const r = await runSwarm({ plan, router });
  // Parallel wave: both independent steps dispatch concurrently before any result returns.
  assert.equal(asked.length, 2); assert.equal(r.status, 'uncertain'); assert.equal(Object.keys(r.answers).length, 0);
});
