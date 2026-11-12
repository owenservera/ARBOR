import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fleetCommand, swarmCommand } from '../../src/agents/cli.mjs';
import { fakeRouter } from './fake-router.mjs';

const read = (f) => readFile(new URL('../../' + f, import.meta.url), 'utf8');

test('fleet --dry-run prints the plan and never sends', async () => {
  const router = fakeRouter(), lines = [];
  const plan = await fleetCommand(['--config', 'docs/fleet.example.json', '--dry-run'], { router, out: (s) => lines.push(s), read });
  assert.equal(plan.sends, 0);
  assert.equal(router.calls.length, 0);
  assert.equal(JSON.parse(lines[0]).fleet, 'harness-core');
});

test('fleet --agent role --prompt sends once to an agent of that role', async () => {
  const router = fakeRouter();
  const r = await fleetCommand(['--config', 'docs/fleet.example.json', '--agent', 'critic', '--prompt', 'review this'], { router, out: () => {}, read });
  assert.equal(r.agent, 'critic-1');
  assert.equal(router.calls.length, 1);
  await assert.rejects(fleetCommand([], { router, out: () => {}, read }), { code: 'CLI_USAGE' });
  await assert.rejects(fleetCommand(['--config', 'docs/fleet.example.json', '--bogus'], { router, out: () => {}, read }), { code: 'CLI_USAGE' });
});

test('swarm flags override config; --dry-run makes no sends', async () => {
  const router = fakeRouter(), lines = [];
  const res = await swarmCommand(['--config', 'docs/swarm.example.json', '--task', 'Q?', '--members', 'chatgpt:gpt-6, gemini:g', '--judge', 'claude:opus-5.5', '--pattern', 'vote', '--max-sends', '3', '--dry-run'],
    { router, out: (s) => lines.push(s), read });
  assert.equal(router.calls.length, 0);
  assert.equal(res.plan.task, 'Q?');
  assert.equal(res.plan.pattern, 'vote');
  assert.equal(res.plan.steps.length, 3);
  assert.equal(JSON.parse(lines[0]).dryRun, true);
  await assert.rejects(swarmCommand(['--task', 'Q?', '--members', 'a:1,b:1', '--judge', 'c:1', '--max-sends', '2'], { router, read }), { code: 'SWARM_BUDGET' });
});

test('swarm runs through the router when not a dry run', async () => {
  const router = fakeRouter();
  const res = await swarmCommand(['--task', 'Q?', '--members', 'chatgpt:gpt-6,gemini:g', '--judge', 'claude:opus-5.5'], { router, out: () => {}, read });
  assert.equal(res.status, 'complete');
  assert.equal(router.calls.length, 3);
  assert.ok(res.verdict.text);
});
