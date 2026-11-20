# File: harness/test/agents/cli.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/agents/cli.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2476 B |
| Lines | 44 |
| Hash | 71e049184bec |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| read | function | 7 | no | const read = (f) =&gt; readFile(new URL(&#39;../../&#39; + f, import.meta.url), &#39;utf8&#39;); |
| router | const | 10 | no | const router = fakeRouter(), lines = []; |
| plan | const | 11 | no | const plan = await fleetCommand([&#39;--config&#39;, &#39;docs/fleet.example.json&#39;, &#39;--dry-run&#39;], { router, out: (s) =&gt; lines.push(s), read }); |
| router | const | 18 | no | const router = fakeRouter(); |
| r | const | 19 | no | const r = await fleetCommand([&#39;--config&#39;, &#39;docs/fleet.example.json&#39;, &#39;--agent&#39;, &#39;critic&#39;, &#39;--prompt&#39;, &#39;review this&#39;], { router, out: () =&gt; {}, read }); |
| router | const | 27 | no | const router = fakeRouter(), lines = []; |
| res | const | 28 | no | const res = await swarmCommand([&#39;--config&#39;, &#39;docs/swarm.example.json&#39;, &#39;--task&#39;, &#39;Q?&#39;, &#39;--members&#39;, &#39;chatgpt:gpt-6, gemini:g&#39;, &#39;--judge&#39;, &#39;claude:opus-5.5&#39;, &#39;--pattern&#39;, &#39;vote&#39;, &#39;--max-sends&#39;, &#39;3&#39;, &#39;… |
| router | const | 39 | no | const router = fakeRouter(); |
| res | const | 40 | no | const res = await swarmCommand([&#39;--task&#39;, &#39;Q?&#39;, &#39;--members&#39;, &#39;chatgpt:gpt-6,gemini:g&#39;, &#39;--judge&#39;, &#39;claude:opus-5.5&#39;], { router, out: () =&gt; {}, read }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| ../../src/agents/cli.mjs | import | 4 | [harness/src/agents/cli.mjs](../../src/agents/cli.mjs.md) |
| ./fake-router.mjs | import | 5 | [harness/test/agents/fake-router.mjs](./fake-router.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
