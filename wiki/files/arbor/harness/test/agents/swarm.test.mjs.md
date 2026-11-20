# File: harness/test/agents/swarm.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/agents/swarm.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7319 B |
| Lines | 121 |
| Hash | 6edaf0380c63 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BASE | const | 7 | no | const BASE = { task: &#39;Why is the sky blue?&#39;, members: [&#39;chatgpt:gpt-6&#39;, &#39;gemini:gemini-3-pro&#39;], judge: &#39;claude:opus-5.5&#39; }; |
| par | const | 10 | no | const par = planSwarm({ ...BASE, pattern: &#39;parallel&#39; }); |
| pipe | const | 14 | no | const pipe = planSwarm({ ...BASE, pattern: &#39;pipeline&#39; }); |
| deb | const | 17 | no | const deb = planSwarm({ ...BASE, pattern: &#39;debate&#39;, budget: { maxSends: 5 } }); |
| cfg | const | 34 | no | const cfg = parseSwarmConfig(await readFile(new URL(&#39;../../docs/swarm.example.json&#39;, import.meta.url), &#39;utf8&#39;)); |
| cfg | const | 40 | no | const cfg = parseSwarmConfig({ ...BASE, members: [&#39;chatgpt:gpt-6@high&#39;, &#39;gemini:pro@2&#39;], judge: &#39;claude:opus@Extra High&#39; }); |
| plan | const | 41 | no | const plan = planSwarm(cfg); |
| members | const | 53 | no | const members = [&#39;chatgpt:gpt-6@high&#39;, &#39;gemini:pro@2&#39;]; |
| judge | const | 54 | no | const judge = &#39;claude:opus@Extra High&#39;; |
| router | const | 55 | no | const router = fakeRouter(); |
| result | const | 56 | no | const result = await runSwarm({ plan: planSwarm({ ...BASE, members, judge }), router }); |
| router | const | 62 | no | const router = fakeRouter({ replyFor: (c) =&gt; c.n === 1 ? &#39;uses ``` inside&#39; : c.n === 3 ? &#39;FINAL ANSWER&#39; : `answer ${c.n}` }); |
| res | const | 63 | no | const res = await runSwarm({ plan: planSwarm(BASE), router }); |
| judgePrompt | const | 68 | no | const judgePrompt = router.calls[2].prompt; |
| router | const | 77 | no | const router = fakeRouter({ replyFor: (c) =&gt; c.n === 3 ? &#39;WINNER: 2\\nFINAL: Rayleigh scattering.&#39; : &#39;x&#39; }); |
| res | const | 78 | no | const res = await runSwarm({ plan: planSwarm({ ...BASE, pattern: &#39;vote&#39; }), router }); |
| router | const | 84 | no | const router = fakeRouter({ statusFor: (c) =&gt; c.n === 2 ? &#39;uncertain&#39; : &#39;complete&#39; }); |
| res | const | 85 | no | const res = await runSwarm({ plan: planSwarm(BASE), router }); |
| router | const | 94 | no | const router = fakeRouter(); |
| res | const | 95 | no | const res = await runSwarm({ plan: planSwarm(BASE), router, approve: ({ step }) =&gt; step.role !== &#39;synthesize&#39; }); |
| router | const | 102 | no | const router = fakeRouter(); |
| plan | const | 115 | no | const plan = planSwarm({ task: &#39;t&#39;, pattern: &#39;parallel&#39;, members: [&#39;chatgpt:gpt-6&#39;, &#39;claude:opus-5.5&#39;], judge: &#39;gemini:pro&#39;, budget: { maxSends: 3 } }); |
| asked | const | 116 | no | const asked = []; |
| router | const | 117 | no | const router = { ask: async (o) =&gt; { asked.push(o.provider); return { requestId: `r${asked.length}` }; }, wait: async () =&gt; ({ status: &#39;uncertain&#39; }) }; |
| r | const | 118 | no | const r = await runSwarm({ plan, router }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| ../../src/agents/swarm.mjs | import | 4 | [harness/src/agents/swarm.mjs](../../src/agents/swarm.mjs.md) |
| ./fake-router.mjs | import | 5 | [harness/test/agents/fake-router.mjs](./fake-router.mjs.md) |
| ../../src/agents/swarm.mjs | dynamic | 114 | [harness/src/agents/swarm.mjs](../../src/agents/swarm.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

`````javascript
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
`````

_First 80 of 122 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
