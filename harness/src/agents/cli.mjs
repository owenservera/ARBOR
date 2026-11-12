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
  if (v.rounds !== undefined) spec.rounds = intOf('--rounds', v.rounds);
  if (v.seed !== undefined) spec.seed = v.seed;
  if (v['max-sends'] !== undefined) spec.budget = { maxSends: intOf('--max-sends', v['max-sends']) };
  const plan = planRoundRobin(spec);
  // The state file is per plan digest, so a resumed run finds its own progress and refuses another plan's.
  const storePath = v.store ?? (typeof store === 'string' ? store : store?.path) ?? defaultStorePath(plan.digest);
  if (v['dry-run']) { const res = { dryRun: true, sends: 0, store: storePath, plan }; out(JSON.stringify(res, null, 2)); return res; }
  if (!router) throw usage('roundrobin needs a router (or use --dry-run)');
  if (typeof journal !== 'function' || typeof readBack !== 'function') throw usage('roundrobin needs a journal(requestId) reader and a readBack({provider, threadUrl}) function');
  const waitMs = waitMsOf(v['wait-seconds']);
  const stateStore = typeof store === 'object' && store && typeof store.load === 'function' ? store : createFileStore({ path: storePath });
  const result = await runRoundRobin({ plan, router, store: stateStore, journal, readBack, ...(waitMs ? { waitMs } : {}) });
  out(JSON.stringify(result, null, 2));
  return result;
}
