# File: harness/src/agents/cli.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/agents/cli.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6526 B |
| Lines | 95 |
| Hash | 4b24aacb8701 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| usage | function | 9 | no | const usage = (m) =&gt; Object.assign(new Error(m), { code: &#39;CLI_USAGE&#39; }); |
| defaultOut | function | 10 | no | const defaultOut = (s) =&gt; process.stdout.write(s + &#39;\\n&#39;); |
| defaultRead | function | 11 | no | const defaultRead = (f) =&gt; readFile(f, &#39;utf8&#39;); |
| parse | function | 12 | no | function parse(args, options) { |
| waitMsOf | function | 15 | no | function waitMsOf(v) { |
| n | const | 17 | no | const n = Number(v); |
| fleetCommand | function | 23 | yes | export async function fleetCommand(args = [], { router = null, out = defaultOut, read = defaultRead, append = null, store = null } = {}) { |
| v | const | 24 | no | const v = parse(args, { config: { type: &#39;string&#39; }, &#39;dry-run&#39;: { type: &#39;boolean&#39; }, agent: { type: &#39;string&#39; }, prompt: { type: &#39;string&#39; }, task: { type: &#39;string&#39; }, store: { type: &#39;string&#39; }, &#39;wait-s… |
| config | const | 27 | no | const config = parseFleetConfig(await read(v.config)); |
| waitMs | const | 30 | no | const waitMs = waitMsOf(v[&#39;wait-seconds&#39;]); |
| fleet | const | 31 | no | const fleet = createFleet({ config, router, append, store: v.store ?? store, ...(waitMs ? { waitMs } : {}) }); |
| target | const | 34 | no | const target = fleet.assign(v.agent); |
| result | const | 36 | no | const result = await fleet.send({ agent: target.name, prompt: v.prompt, task: v.task ?? null }); |
| swarmCommand | function | 42 | yes | export async function swarmCommand(args = [], { router = null, out = defaultOut, read = defaultRead, approve = null } = {}) { |
| v | const | 43 | no | const v = parse(args, { config: { type: &#39;string&#39; }, task: { type: &#39;string&#39; }, pattern: { type: &#39;string&#39; }, members: { type: &#39;string&#39; }, judge: { type: &#39;string&#39; }, &#39;max-sends&#39;: { type: &#39;string&#39; }, &#39;dr… |
| spec | const | 45 | no | const spec = v.config ? parseSwarmConfig(await read(v.config)) : {}; |
| n | const | 51 | no | const n = Number(v[&#39;max-sends&#39;]); |
| plan | const | 55 | no | const plan = planSwarm(spec); |
| waitMs | const | 58 | no | const waitMs = waitMsOf(v[&#39;wait-seconds&#39;]); |
| result | const | 59 | no | const result = await runSwarm({ plan, router, approve, ...(waitMs ? { waitMs } : {}) }); |
| roundrobinCommand | function | 68 | yes | export async function roundrobinCommand(args = [], { router = null, out = defaultOut, store = null, journal = null, readBack = null } = {}) { |
| v | const | 69 | no | const v = parse(args, { task: { type: &#39;string&#39; }, members: { type: &#39;string&#39; }, rounds: { type: &#39;string&#39; }, seed: { type: &#39;string&#39; }, &#39;max-sends&#39;: { type: &#39;string&#39; }, store: { type: &#39;string&#39; }, &#39;wait-… |
| members | const | 74 | no | const members = v.members.split(&#39;,&#39;).map((m) =&gt; m.trim()).filter(Boolean); |
| intOf | function | 75 | no | const intOf = (name, val) =&gt; { |
| n | const | 76 | no | const n = Number(val); |
| spec | const | 80 | no | const spec = { task: v.task, members }; |
| plan | const | 84 | no | const plan = planRoundRobin(spec); |
| storePath | const | 86 | no | const storePath = v.store ?? (typeof store === &#39;string&#39; ? store : store?.path) ?? defaultStorePath(plan.digest); |
| waitMs | const | 90 | no | const waitMs = waitMsOf(v[&#39;wait-seconds&#39;]); |
| stateStore | const | 91 | no | const stateStore = typeof store === &#39;object&#39; &amp;&amp; store &amp;&amp; typeof store.load === &#39;function&#39; ? store : createFileStore({ path: storePath }); |
| result | const | 92 | no | const result = await runRoundRobin({ plan, router, store: stateStore, journal, readBack, ...(waitMs ? { waitMs } : {}) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:util | import | 3 | external |
| node:fs/promises | import | 4 | external |
| ./fleet.mjs | import | 5 | [harness/src/agents/fleet.mjs](./fleet.mjs.md) |
| ./swarm.mjs | import | 6 | [harness/src/agents/swarm.mjs](./swarm.mjs.md) |
| ./roundrobin.mjs | import | 7 | [harness/src/agents/roundrobin.mjs](./roundrobin.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/agents/cli.mjs |
| [harness/test/agents/cli.test.mjs](../../test/agents/cli.test.mjs.md) | ../../src/agents/cli.mjs |
| [harness/test/agents/roundrobin.test.mjs](../../test/agents/roundrobin.test.mjs.md) | ../../src/agents/cli.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// CLI entry points for `wh fleet` and `wh swarm` (wired by bin/wh.mjs). Each returns the result object
// and prints it as JSON through `out`. --dry-run never touches the router.
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { createFleet, planFleet, parseFleetConfig } from './fleet.mjs';
import { parseSwarmConfig, planSwarm, runSwarm } from './swarm.mjs';
import { planRoundRobin, runRoundRobin, createFileStore, defaultStorePath } from './roundrobin.mjs';

const usage = (m) => Object.assign(new Error(m), { code: 'CLI_USAGE' });
const defaultOut = (s) => process.stdout.write(s + '\n');
const defaultRead = (f) => readFile(f, 'utf8');
function parse(args, options) {
  try { return parseArgs({ args, options, strict: true, allowPositionals: false }).values; } catch (e) { throw usage(e.message); }
}
function waitMsOf(v) {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < 1 || n > 3600) throw usage('--wait-seconds must be a whole number from 1 to 3600');
  return n * 1000;
}

// wh fleet --config f [--dry-run] | [--agent name|role --prompt "..." [--task id]] [--store file]
export async function fleetCommand(args = [], { router = null, out = defaultOut, read = defaultRead, append = null, store = null } = {}) {
  const v = parse(args, { config: { type: 'string' }, 'dry-run': { type: 'boolean' }, agent: { type: 'string' }, prompt: { type: 'string' },
    task: { type: 'string' }, store: { type: 'string' }, 'wait-seconds': { type: 'string' } });
  if (!v.config) throw usage('fleet needs --config <file>');
  const config = parseFleetConfig(await read(v.config));
  if (v['dry-run']) { const plan = planFleet(config); out(JSON.stringify(plan, null, 2)); return plan; }
  if (!router) throw usage('fleet needs a router (or use --dry-run)');
  const waitMs = waitMsOf(v['wait-seconds']);
  const fleet = createFleet({ config, router, append, store: v.store ?? store, ...(waitMs ? { waitMs } : {}) });
  if (v.agent === undefined && v.prompt === undefined) { const s = await fleet.status(); out(JSON.stringify(s, null, 2)); return s; }
  if (!v.agent || !v.prompt) throw usage('fleet send needs --agent <name|role> and --prompt "..."');
  const target = fleet.assign(v.agent);
  if (!target) throw Object.assign(new Error(`Every ${v.agent} agent is busy.`), { code: 'FLEET_BUSY' });
  const result = await fleet.send({ agent: target.name, prompt: v.prompt, task: v.task ?? null });
  out(JSON.stringify(result, null, 2));
  return result;
}

// wh swarm [--config f] --task "..." [--pattern p] [--members a,b] [--judge c] [--max-sends N] [--dry-run]
export async function swarmCommand(args = [], { router = null, out = defaultOut, read = defaultRead, approve = null } = {}) {
  const v = parse(args, { config: { type: 'string' }, task: { type: 'string' }, pattern: { type: 'string' }, members: { type: 'string' },
    judge: { type: 'string' }, 'max-sends': { type: 'string' }, 'dry-run': { type: 'boolean' }, 'wait-seconds': { type: 'string' } });
  const spec = v.config ? parseSwarmConfig(await read(v.config)) : {};
  if (v.task !== undefined) spec.task = v.task;
  if (v.pattern !== undefined) spec.pattern = v.pattern;
  if (v.members !== undefined) spec.members = v.members.split(',').map((m) => m.trim()).filter(Boolean);
  if (v.judge !== undefined) spec.judge = v.judge;
  if (v['max-sends'] !== undefined) {
    const n = Number(v['max-sends']);
    if (!Number.isSafeInteger(n)) throw usage('--max-sends must be a whole number');
    spec.budget = { ...spec.budget, maxSends: n };
  }
  const plan = planSwarm(spec);
  if (v['dry-run']) { const res = { dryRun: true, sends: 0, plan }; out(JSON.stringify(res, null, 2)); return res; }
  if (!router) throw usage('swarm needs a router (or use --dry-run)');
  const waitMs = waitMsOf(v['wait-seconds']);
  const result = await runSwarm({ plan, router, approve, ...(waitMs ? { waitMs } : {}) });
  out(JSON.stringify(result, null, 2));
  return result;
}

// wh roundrobin --task "..." --members a,b[,c] [--rounds N] [--seed s] [--max-sends N] [--store file]
//               [--wait-seconds N] [--dry-run]
// Every turn is one journaled request through router.ask, so the per-request approval still applies to each
// turn. --dry-run only builds and prints the plan; it never touches the router.
export async function roundrobinCommand(args = [], { router = null, out = defaultOut, store = null, journal = null, readBack = null } = {}) {
  const v = parse(args, { task: { type: 'string' }, members: { type: 'string' }, rounds: { type: 'string' },
    seed: { type: 'string' }, 'max-sends': { type: 'string' }, store: { type: 'string' },
    'wait-seconds': { type: 'string' }, 'dry-run': { type: 'boolean' } });
  if (!v.task) throw usage('roundrobin needs --task "..."');
  if (!v.members) throw usage('roundrobin needs --members a,b[,c]');
  const members = v.members.split(',').map((m) => m.trim()).filter(Boolean);
  const intOf = (name, val) => {
    const n = Number(val);
    if (!Number.isSafeInteger(n)) throw usage(`${name} must be a whole number`);
    return n;
  };
  const spec = { task: v.task, members };
```

_First 80 of 96 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
