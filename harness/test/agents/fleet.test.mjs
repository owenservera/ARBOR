import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFleetConfig, planFleet, createFleet } from '../../src/agents/fleet.mjs';
import { fakeRouter } from './fake-router.mjs';

const CONFIG = { name: 'core', agents: [
  { name: 'lead', role: 'orchestrator', model: 'chatgpt:gpt-6' },
  { name: 'impl', role: 'coder', model: 'claude:opus-5.5' },
  { name: 'impl-2', role: 'builder' },
] };

test('parseFleetConfig normalizes roles and validates names, roles and models', async () => {
  const cfg = parseFleetConfig(JSON.stringify(CONFIG));
  assert.deepEqual(cfg.agents.map((a) => a.role), ['planner', 'builder', 'builder']);
  assert.equal(cfg.agents[2].model, 'claude:opus-5.5'); // role default
  assert.equal(cfg.agents[0].threadUrl, null);
  const bad = (agents) => assert.throws(() => parseFleetConfig({ agents }), { code: 'FLEET_INVALID' });
  bad([{ name: 'a', role: 'builder' }, { name: 'a', role: 'reviewer' }]);
  bad([{ name: 'a', role: 'wizard' }]);
  bad([{ name: 'a', role: 'builder', model: 'claude' }]);
  bad([{ name: 'a', role: 'builder', threadUrl: 'http://x.test/c/1' }]);
  bad([]);
  assert.throws(() => parseFleetConfig('{nope'), { code: 'FLEET_INVALID' });
  const example = await readFile(new URL('../../docs/fleet.example.json', import.meta.url), 'utf8');
  assert.ok(parseFleetConfig(example).agents.length >= 1);
});

test('planFleet is a dry run with no sends', () => {
  const plan = planFleet(CONFIG);
  assert.equal(plan.dryRun, true);
  assert.equal(plan.sends, 0);
  assert.equal(plan.agents[1].provider, 'claude');
  assert.equal(plan.agents[1].limits.mayMerge, false);
  assert.equal(plan.agents[0].thread, 'new');
});

test('fleet config and plan preserve effort while rejecting malformed models', () => {
  const config = { agents: [{ name: 'impl', role: 'builder', model: 'claude:opus@Extra High' }] };
  assert.equal(parseFleetConfig(config).agents[0].model, 'claude:opus@Extra High');
  const agent = planFleet(config).agents[0];
  assert.equal(agent.provider, 'claude');
  assert.equal(agent.model, 'claude:opus@Extra High');
  for (const model of ['claude:opus@', 'claude:opus@high@low', 'auto:opus@high']) {
    assert.throws(() => parseFleetConfig({ agents: [{ name: 'impl', role: 'builder', model }] }), { code: 'FLEET_INVALID' });
  }
});

test('send goes through router.ask, records, and persists the reply thread', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fleet-'));
  try {
    const store = join(dir, 'fleet.json');
    const router = fakeRouter({ threadFor: (c) => `https://claude.ai/chat/${c.n}` });
    const log = [];
    const fleet = createFleet({ config: CONFIG, router, append: (e) => log.push(e), store, now: () => 'T' });
    const r = await fleet.send({ agent: 'impl', prompt: 'build it' });
    assert.equal(r.status, 'complete');
    assert.equal(r.reply, 'reply 1 from claude:opus-5.5');
    assert.deepEqual(router.calls[0].threadUrl, 'new');
    assert.equal(router.calls[0].provider, 'claude:opus-5.5');
    assert.deepEqual(log, [{ agent: 'impl', requestId: 'r1', at: 'T' }]);
    assert.deepEqual(JSON.parse(await readFile(store, 'utf8')).threads, { impl: 'https://claude.ai/chat/1' });
    // second send continues the same thread; a new fleet reloads it from the store
    await fleet.send({ agent: 'impl', prompt: 'next' });
    assert.equal(router.calls[1].threadUrl, 'https://claude.ai/chat/1');
    const again = createFleet({ config: CONFIG, router, store });
    const st = await again.status();
    assert.equal(st.agents.find((a) => a.name === 'impl').threadUrl, 'https://claude.ai/chat/2');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('at most one in-flight send per agent (FLEET_BUSY), others unaffected', async () => {
  const router = fakeRouter({ hold: true });
  const fleet = createFleet({ config: CONFIG, router });
  const first = fleet.send({ agent: 'impl', prompt: 'a' });
  await assert.rejects(fleet.send({ agent: 'impl', prompt: 'b' }), { code: 'FLEET_BUSY' });
  assert.equal(fleet.assign('builder').name, 'impl-2'); // idle sibling picked
  await new Promise((r) => setImmediate(r));
  assert.equal(fleet.agents().find((a) => a.name === 'impl').busy, true);
  router.release('r1');
  assert.equal((await first).status, 'complete');
  assert.equal(router.calls.length, 1);
  assert.equal(fleet.agents().find((a) => a.name === 'impl').busy, false);
});

test('assign, unknown agents and per-task limits', async () => {
  const fleet = createFleet({ config: CONFIG, router: fakeRouter() });
  assert.equal(fleet.assign('lead').name, 'lead');
  assert.equal(fleet.assign('planner').name, 'lead');
  assert.throws(() => fleet.assign('reviewer'), { code: 'FLEET_NO_AGENT' });
  assert.throws(() => fleet.assign('ghost'), { code: 'FLEET_UNKNOWN_AGENT' });
  await assert.rejects(fleet.send({ agent: 'ghost', prompt: 'x' }), { code: 'FLEET_UNKNOWN_AGENT' });
  for (let i = 0; i < 3; i++) await fleet.send({ agent: 'lead', prompt: 'p' + i, task: 't1' }); // planner max 3
  await assert.rejects(fleet.send({ agent: 'lead', prompt: 'p4', task: 't1' }), { code: 'FLEET_LIMIT' });
  assert.equal(fleet.agents().find((a) => a.name === 'lead').busy, false);
});

test('orphaned in-flight send (router has no record) is uncertain and never resends', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fleet-orphan-'));
  try {
    const store = join(dir, 'fleet.json');
    await writeFile(store, JSON.stringify({ fleet: 'core', threads: {}, inFlight: { impl: { requestId: 'r-orphan', prompt: 'build it', startedAt: 'T' } } }));
    const orphanRouter = {
      ask: async () => ({ requestId: 'r2', status: 'pending_approval', provider: 'claude' }),
      wait: async () => ({ status: 'complete', reply: 'ok' }),
      result: async () => null, // no record => orphaned after a crash
    };
    const fleet = createFleet({ config: CONFIG, router: orphanRouter, store });
    const st = await fleet.status();
    const impl = st.agents.find((a) => a.name === 'impl');
    assert.equal(impl.busy, false);
    assert.equal(impl.lastStatus, 'uncertain');
    // Never resend: send should succeed (not FLEET_BUSY)
    const r = await fleet.send({ agent: 'impl', prompt: 'retry' });
    assert.equal(r.status, 'complete');
    assert.equal(r.reply, 'ok');
  } finally { 
    try { await rm(dir, { recursive: true, force: true }); } catch {} 
  }
});

test('in-flight send restored from store is reconciled via router.result', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fleet-restore-'));
  try {
    const store = join(dir, 'fleet.json');
    await writeFile(store, JSON.stringify({ fleet: 'core', threads: {}, inFlight: { impl: { requestId: 'r1', prompt: 'build it', startedAt: 'T' } } }));
    const completeRouter = {
      ask: async () => ({ requestId: 'r2', status: 'pending_approval', provider: 'claude' }),
      wait: async () => ({ status: 'complete', reply: 'done' }),
      result: async (id) => ({ requestId: id, status: 'complete', threadUrl: 'https://claude.ai/chat/1' }),
    };
    const fleet = createFleet({ config: CONFIG, router: completeRouter, store });
    const st = await fleet.status();
    const impl = st.agents.find((a) => a.name === 'impl');
    assert.equal(impl.busy, false);
    assert.equal(impl.lastStatus, 'complete');
    assert.equal(impl.threadUrl, 'https://claude.ai/chat/1');
  } finally { 
    try { await rm(dir, { recursive: true, force: true }); } catch {} 
  }
});
