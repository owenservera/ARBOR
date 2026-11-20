# File: harness/test/agents/fleet.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/agents/fleet.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7773 B |
| Lines | 143 |
| Hash | 740dc17a002e |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONFIG | const | 9 | no | const CONFIG = { name: &#39;core&#39;, agents: [ |
| cfg | const | 16 | no | const cfg = parseFleetConfig(JSON.stringify(CONFIG)); |
| bad | function | 20 | no | const bad = (agents) =&gt; assert.throws(() =&gt; parseFleetConfig({ agents }), { code: &#39;FLEET_INVALID&#39; }); |
| example | const | 27 | no | const example = await readFile(new URL(&#39;../../docs/fleet.example.json&#39;, import.meta.url), &#39;utf8&#39;); |
| plan | const | 32 | no | const plan = planFleet(CONFIG); |
| config | const | 41 | no | const config = { agents: [{ name: &#39;impl&#39;, role: &#39;builder&#39;, model: &#39;claude:opus@Extra High&#39; }] }; |
| agent | const | 43 | no | const agent = planFleet(config).agents[0]; |
| dir | const | 52 | no | const dir = await mkdtemp(join(tmpdir(), &#39;fleet-&#39;)); |
| store | const | 54 | no | const store = join(dir, &#39;fleet.json&#39;); |
| router | const | 55 | no | const router = fakeRouter({ threadFor: (c) =&gt; `https://claude.ai/chat/${c.n}` }); |
| log | const | 56 | no | const log = []; |
| fleet | const | 57 | no | const fleet = createFleet({ config: CONFIG, router, append: (e) =&gt; log.push(e), store, now: () =&gt; &#39;T&#39; }); |
| r | const | 58 | no | const r = await fleet.send({ agent: &#39;impl&#39;, prompt: &#39;build it&#39; }); |
| again | const | 68 | no | const again = createFleet({ config: CONFIG, router, store }); |
| st | const | 69 | no | const st = await again.status(); |
| router | const | 75 | no | const router = fakeRouter({ hold: true }); |
| fleet | const | 76 | no | const fleet = createFleet({ config: CONFIG, router }); |
| first | const | 77 | no | const first = fleet.send({ agent: &#39;impl&#39;, prompt: &#39;a&#39; }); |
| fleet | const | 89 | no | const fleet = createFleet({ config: CONFIG, router: fakeRouter() }); |
| dir | const | 101 | no | const dir = await mkdtemp(join(tmpdir(), &#39;fleet-orphan-&#39;)); |
| store | const | 103 | no | const store = join(dir, &#39;fleet.json&#39;); |
| orphanRouter | const | 105 | no | const orphanRouter = { |
| fleet | const | 110 | no | const fleet = createFleet({ config: CONFIG, router: orphanRouter, store }); |
| st | const | 111 | no | const st = await fleet.status(); |
| r | const | 116 | no | const r = await fleet.send({ agent: &#39;impl&#39;, prompt: &#39;retry&#39; }); |
| dir | const | 125 | no | const dir = await mkdtemp(join(tmpdir(), &#39;fleet-restore-&#39;)); |
| store | const | 127 | no | const store = join(dir, &#39;fleet.json&#39;); |
| completeRouter | const | 129 | no | const completeRouter = { |
| fleet | const | 134 | no | const fleet = createFleet({ config: CONFIG, router: completeRouter, store }); |
| st | const | 135 | no | const st = await fleet.status(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../src/agents/fleet.mjs | import | 6 | [harness/src/agents/fleet.mjs](../../src/agents/fleet.mjs.md) |
| ./fake-router.mjs | import | 7 | [harness/test/agents/fake-router.mjs](./fake-router.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 144 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
