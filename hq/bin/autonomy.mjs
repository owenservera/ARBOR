#!/usr/bin/env node
// @ts-check
/**
 * @hq:context Autonomy dispatcher CLI — plan one dispatch cycle from the seat roster and the open queue, journal the intent before the effect, and either wake a seat or emit a subagent work order
 * @hq:owner autonomy-dispatcher
 * @hq:task autonomy-lane-a1
 * @hq:invariant --dry-run is the default; only --apply may cause an effect
 * @hq:invariant the pending record is on disk before the transport is called, so a crash is recoverable
 * @hq:invariant --transport agent never spawns and never writes the journal: it prints DISPATCH lines for the caller
 * @hq:invariant exit 1 when a wake was attempted and failed; exit 2 on a usage or source error
 * @hq:invariant the pool follows the transport: a chat seat is never handed authored builder work, and a transcript row is never printed as a DISPATCH
 * @hq:invariant an invalid authored queue is refused before planning, and a missing one is a defect (ORDERS_MISSING), never an empty pool
 * @hq:invariant read-only toward hq/work/orders.json: this command plans, it never claims or completes an order
 * @hq:see hq/lib/autonomy.mjs
 * @hq:see hq/lib/work-orders.mjs
 * @hq:see hq/lib/channel-seats.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { planDispatch, foldJournal, builderWorkers, JOURNAL_SCHEMA, OPEN_STATES } from '../lib/autonomy.mjs';
import { validateDoc, openOrders, toTask } from '../lib/work-orders.mjs';
import { loadSeats, roster, wakeSeat, verifySeat, DEFAULT_CHANNEL_ROOT, DEFAULT_IDLE_MINUTES } from '../lib/channel-seats.mjs';
import { readLivenessMap, resumeSession, confirmWake, LIVENESS_UNREADABLE } from '../lib/channel-transport.mjs';

const USAGE = [
  'usage:',
  '  bun hq/bin/autonomy.mjs [--apply] [--transport seat|agent] [--max-wakes <n>] [--force]',
  '                          [--journal <path>] [--seats <path>] [--tasks <path>] [--providers <path>]',
  '                          [--root <dir>] [--idle-minutes <n>]',
  '                          [--pool observations|orders|both] [--orders <path|none>]',
  '',
  'Two queues, and they are not interchangeable:',
  '  observations  dogfood/active-tasks.json — transcript rows; delivered by waking the seat they name',
  '  orders        hq/work/orders.json — authored work naming a file and a proving command; delivered as DISPATCH lines',
  'The pool follows the transport (seat -> observations, agent -> orders). --pool overrides it explicitly,',
  '--orders none disables the authored queue, and an invalid authored queue is refused before planning.',
  '',
  'Reading it:',
  '  dry run (default)        plans only; no journal, no wake, no DISPATCH line',
  '  --apply --transport seat journals pending -> sent -> got-reply|no-reply around `hq seat wake` + `hq seat verify`',
  '  --apply --transport agent prints one self-contained `DISPATCH <worker> <taskId> :: ...` line per planned wake;',
  '                            it spawns nothing and leaves the journal empty, so the caller spawns what it approves',
  '',
  'The journal is the recovery record: a pending intent with no sent record is closed as `recovered` by the next',
  'cycle instead of being retried forever. Any attempt older than 2x the idle window is closed the same way.',
  '',
  'Funding: by default this assumes the local zcode-acp route is funded. Pass --providers <file> with observed',
  'provider health (or `--providers none`) to let NO_FUNDED_MODEL refuse dispatch instead.',
].join('\n');

/** The only legal values for `--pool`. A value outside it is a usage error. */
const POOLS = new Set(['observations', 'orders', 'both']);

/** @param {string} text */
function compact(text) {
  return String(text).replace(/\D/g, '').slice(0, 17);
}

/**
 * Parse the small flag surface. Unknown flags are a usage error, not ignored:
 * a typo must not silently change what a dispatcher does.
 *
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const flags = {
    apply: false,
    transport: 'seat',
    journalPath: null,
    seatsPath: null,
    tasksPath: null,
    providersPath: null,
    ordersPath: null,
    pool: null,
    root: null,
    maxWakes: null,
    idleMinutes: null,
    waitSec: 180,
    force: false,
    help: false,
  };
  const args = Array.isArray(argv) ? argv.slice() : [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = String(args[i]);
    const [name, inline] = arg.includes('=') ? arg.split(/=(.*)/s, 2) : [arg, undefined];
    const value = () => {
      if (inline !== undefined) return inline;
      i += 1;
      return args[i];
    };
    switch (name) {
      case '--apply': flags.apply = true; break;
      case '--dry-run': flags.apply = false; break;
      case '--transport': {
        const transport = String(value() ?? '').toLowerCase();
        if (transport !== 'seat' && transport !== 'agent') throw new Error(`--transport must be seat or agent, got "${transport}"`);
        flags.transport = transport;
        break;
      }
      case '--journal': flags.journalPath = String(value() ?? ''); break;
      case '--seats': flags.seatsPath = String(value() ?? ''); break;
      case '--tasks': flags.tasksPath = String(value() ?? ''); break;
      case '--providers': flags.providersPath = String(value() ?? ''); break;
      case '--orders': flags.ordersPath = String(value() ?? ''); break;
      case '--pool': {
        const pool = String(value() ?? '').trim().toLowerCase();
        if (!POOLS.has(pool)) throw new Error(`--pool must be observations, orders or both, got "${pool}"`);
        flags.pool = pool;
        break;
      }
      case '--root': flags.root = String(value() ?? ''); break;
      case '--max-wakes': flags.maxWakes = Number(value()); break;
      case '--idle-minutes': flags.idleMinutes = Number(value()); break;
      case '--wait': flags.waitSec = Number(value()); break;
      case '--force': flags.force = true; break;
      case '--help': case '-h': flags.help = true; break;
      default: throw new Error(`unknown flag "${arg}"`);
    }
  }
  return flags;
}

/** @param {any} value @param {string} what */
function readJson(value, what) {
  let text;
  try {
    text = readFileSync(value, 'utf8');
  } catch (error) {
    throw new Error(`cannot read ${what} at ${value}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${what} at ${value} is not JSON: ${error.message}`);
  }
}

function journalEvents(journalPath) {
  if (!journalPath || !existsSync(journalPath)) return [];
  const doc = readJson(journalPath, 'journal');
  if (Array.isArray(doc)) return doc;
  if (Array.isArray(doc?.events)) return doc.events;
  throw new Error(`journal at ${journalPath} has no events array`);
}

/**
 * The cycle. Everything effectful is injected, so the same function serves the
 * CLI and a test that must prove nothing was spawned or woken.
 *
 * @param {{
 *   argv?: string[],
 *   cwd?: string,
 *   now?: string|(() => string),
 *   seats?: any,
 *   tasks?: any,
 *   providers?: any,
 *   journalPath?: string|null,
 *   root?: string,
 *   live?: any,
 *   spawn?: ((line: string) => void)|null,
 *   wake?: ((decision: any, ctx: any) => any)|null,
 *   verify?: ((decision: any, ctx: any) => any)|null,
 *   stdout?: ((line: string) => void)|null,
 *   stderr?: ((line: string) => void)|null,
 * }} [options]
 * @returns {{ code: number, lines: string[], plan: any, failures: Array<{seat: string|null, taskId: string|null, error: string}>, pool?: string, sources?: {observations: number, orders: number} }}
 */
export function runAutonomy(options = {}) {
  const {
    argv = [],
    cwd = process.cwd(),
    now = () => new Date().toISOString(),
    journalPath = null,
    root = null,
    live = null,
    spawn = null,
    wake = null,
    verify = null,
    stdout = null,
    stderr = null,
  } = options;
  /** @type {string[]} */
  const lines = [];
  const out = (line) => { lines.push(line); if (stdout) stdout(line); };
  const err = (line) => { if (stderr) stderr(line); };
  /** @type {Array<{seat: string|null, taskId: string|null, error: string}>} */
  const failures = [];
  let flags;
  try {
    flags = parseArgs(argv);
  } catch (error) {
    out(`autonomy: ${error.message}`);
    return { code: 2, lines, plan: null, failures };
  }
  if (flags.help) { out(USAGE); return { code: 0, lines, plan: null, failures }; }
  if (flags.maxWakes !== null && !Number.isFinite(flags.maxWakes)) { out('autonomy: --max-wakes must be a number'); return { code: 2, lines, plan: null, failures }; }
  if (flags.idleMinutes !== null && !Number.isFinite(flags.idleMinutes)) { out('autonomy: --idle-minutes must be a number'); return { code: 2, lines, plan: null, failures }; }

  const channelRoot = String(flags.root ?? root ?? process.env.HQ_CHANNEL_ROOT ?? DEFAULT_CHANNEL_ROOT);
  const idleMinutes = flags.idleMinutes ?? DEFAULT_IDLE_MINUTES;
  const idleMs = idleMinutes * 60_000;
  const nowValue = typeof now === 'function' ? now() : now;
  const nowIso = new Date(Date.parse(String(nowValue))).toISOString();
  const cycle = nowIso;
  const settlePath = flags.journalPath ?? journalPath ?? join(cwd, '.hq', 'autonomy', 'journal.json');

  let seatData;
  // WO-005: the raw roster document is kept alongside the flattened seat list,
  // because a document-level `builders` list (agent types like forge, which are
  // not chat seats) is lost by roster()'s flattening and the builder roster is
  // exactly what authored orders must be planned against.
  let seatSource;
  try {
    if (options.seats) { seatSource = options.seats; seatData = options.seats; }
    else if (flags.seatsPath) { seatSource = readJson(resolve(cwd, flags.seatsPath), 'seat roster'); seatData = roster(seatSource); }
    else { seatSource = loadSeats(channelRoot); seatData = roster(seatSource); }
  } catch (error) {
    out(`autonomy: ${error.message}`);
    return { code: 2, lines, plan: null, failures };
  }
  const builderIds = builderWorkers(seatSource);

  // ---- the two pools --------------------------------------------------------
  // An observation (dogfood/active-tasks.json) names a live seat and is delivered
  // by waking it. An authored order (hq/work/orders.json) names one file and the
  // command that proves it, and is delivered as a DISPATCH line for a builder to
  // be spawned. Handing a chat seat builder work, or spawning a forge for a
  // transcript row, is the failure this split exists to prevent — so the pool
  // follows the transport, and only an explicit --pool overrides it.
  //
  // An injected `tasks` array is the observation queue a caller resolved for us
  // (the test seam). It is exactly what the seat transport would read, so it must
  // not also cause a live read of the authored queue it never asked for.
  const injectedObservations = options.tasks !== undefined && options.tasks !== null;
  const derivedPool = flags.transport === 'agent' ? 'orders' : 'observations';
  const requestedPool = flags.pool
    ?? (injectedObservations && flags.ordersPath === null ? 'observations' : derivedPool);
  const ordersDisabled = flags.ordersPath === 'none';
  if (ordersDisabled && requestedPool === 'orders') {
    out('autonomy: --orders none disables the only pool this transport would read; pass --pool observations or --pool both');
    return { code: 2, lines, plan: null, failures };
  }
  const wantsOrders = !ordersDisabled && (requestedPool === 'orders' || requestedPool === 'both');
  const wantsObservations = requestedPool === 'observations' || requestedPool === 'both';
  const pool = wantsOrders ? requestedPool : 'observations';
  let observationsCount = 0;
  let ordersCount = 0;
  /** Order ids in this cycle's authored queue. Authored orders are builder-only work and
   *  must never be handed to a seat whose roster role is not `builder`. */
  let orderIds = new Set();

  /** @type {any[]} */
  const taskData = [];
  if (wantsObservations) {
    try {
      let list;
      if (injectedObservations) {
        const doc = options.tasks;
        list = Array.isArray(doc) ? doc : doc?.tasks;
        if (!Array.isArray(list)) throw new Error('the injected task queue has no tasks array');
      } else {
        const tasksPath = flags.tasksPath ?? join(cwd, 'dogfood', 'active-tasks.json');
        const doc = readJson(tasksPath, 'task queue');
        list = Array.isArray(doc) ? doc : doc?.tasks;
        if (!Array.isArray(list)) throw new Error(`task queue at ${tasksPath} has no tasks array`);
      }
      observationsCount = list.length;
      taskData.push(...list);
    } catch (error) {
      out(`autonomy: ${error.message}`);
      return { code: 2, lines, plan: null, failures };
    }
  }

  if (wantsOrders) {
    const ordersPath = flags.ordersPath && !ordersDisabled
      ? resolve(cwd, flags.ordersPath)
      : join(cwd, 'hq', 'work', 'orders.json');
    let text;
    try {
      text = readFileSync(ordersPath, 'utf8');
    } catch (error) {
      // A queue that vanished is a defect, not an empty pool: a dispatcher that
      // plans nothing because its source is gone reports success for the wrong
      // reason, and the clock would keep doing it.
      out(`autonomy: ORDERS_MISSING — cannot read the authored work queue at ${ordersPath}: ${error.message}`);
      return { code: 2, lines, plan: null, failures };
    }
    let doc = null;
    try { doc = JSON.parse(text); } catch { doc = null; }
    const check = validateDoc(doc);
    if (!check.ok) {
      // Fail closed. A queue with a prose proof or a bad status must never reach
      // the planner, because the slice it would print is not a contract.
      out(`autonomy: ORDERS_INVALID — ${check.errors.join(',')}`);
      for (const id of check.duplicateIds) out(`autonomy: duplicate id ${id}`);
      return { code: 2, lines, plan: null, failures };
    }
    const dispatchable = openOrders(doc);
    for (const order of dispatchable) taskData.push(toTask(order));
    ordersCount = dispatchable.length;
    orderIds = new Set(dispatchable.map((order) => String(order.id)));
  }

  const sources = { observations: observationsCount, orders: ordersCount };
  // stdout is the machine contract: one line per decision, then the summary. The
  // pool is a diagnostic, so it goes to stderr and the summary stays byte-identical
  // for every caller that already parses it.
  err(`autonomy: pool=${pool} orders=${ordersCount} observations=${observationsCount}`);

  let providerData;
  if (options.providers) {
    providerData = options.providers;
  } else if (flags.providersPath === 'none') {
    providerData = [];
  } else if (flags.providersPath) {
    try {
      const doc = readJson(resolve(cwd, flags.providersPath), 'provider health');
      providerData = Array.isArray(doc) ? doc : doc?.providers;
      if (!Array.isArray(providerData)) throw new Error('provider file has no providers array');
    } catch (error) {
      out(`autonomy: ${error.message}`);
    return { code: 2, lines, plan: null, failures };
    }
  } else {
    // Stated assumption, not a discovered fact: the local route is available
    // until an observed provider file says otherwise.
    providerData = [{ id: 'zcode-acp', state: 'healthy', free: true, reliability: 1, usdPerCall: 0 }];
  }

  let journal;
  try {
    journal = journalEvents(resolve(cwd, settlePath));
  } catch (error) {
    out(`autonomy: ${error.message}`);
    return { code: 2, lines, plan: null, failures };
  }

  // Liveness is read only for the real roster. Injected seats bring their own
  // observations, and a test must never touch the live session store.
  let liveMap = live ?? null;
  if (!liveMap && !options.seats) {
    try {
      liveMap = readLivenessMap();
    } catch (error) {
      // A failed read is not "no sessions". Planning on a null map would turn
      // a broken reader into a silent fleet of unknown seats, so stop here.
      out(`autonomy: ${LIVENESS_UNREADABLE} — ${error?.message ?? String(error)}`);
      return { code: 2, lines, plan: null, failures };
    }
  }

  let plan;
  try {
    plan = planDispatch({
      seats: seatData,
      tasks: taskData,
      providers: providerData,
      journal,
      now: nowIso,
      opts: {
        cycle,
        maxWakes: flags.maxWakes ?? undefined,
        force: flags.force,
        idleMs,
        live: liveMap,
        builderIds,
      },
    });
  } catch (error) {
    out(`autonomy: ${error.message}`);
    return { code: 2, lines, plan: null, failures };
  }

  // An authored work order is builder-only work. Since WO-005 the planner itself
  // plans orders against the builder roster (builderWorkers: an explicit role or
  // builders list — a chat seat without a role is NOT a builder), so this gate is
  // now defense in depth: it still refuses anything a future planner change
  // might let through whose roster role is not `builder`.
  if (plan && orderIds.size > 0) {
    const roleOf = (seatId) => {
      const seat = Array.isArray(seatData)
        ? seatData.find((s) => String(s?.id ?? '').toLowerCase() === String(seatId ?? '').toLowerCase())
        : null;
      return seat ? seat.role : null;
    };
    for (const decision of plan.decisions) {
      if (decision.action !== 'WAKE' || !orderIds.has(String(decision.taskId))) continue;
      const role = roleOf(decision.seat);
      if (role !== undefined && role !== 'builder') {
        decision.action = 'SKIP';
        decision.code = 'SEAT_NOT_BUILDER';
        decision.promptSlice = null;
        decision.reason = `authored order ${decision.taskId} is builder-only work; seat "${decision.seat}" is not a builder`;
      }
    }
    plan.summary.wakes = plan.decisions.filter((d) => d.action === 'WAKE').length;
    plan.summary.skips = plan.decisions.length - plan.summary.wakes;
  }

  if (!flags.apply) {
    for (const decision of plan.decisions) {
      out(`autonomy: ${decision.action} ${decision.code} seat=${decision.seat ?? '-'} task=${decision.taskId ?? '-'} | ${decision.reason}`);
    }
    const line = `autonomy: planned=${plan.decisions.length} woke=0 skipped=${plan.summary.skips} pending=${plan.summary.pending} recovered=${plan.summary.recovered}`;
    out(line);
    return { code: 0, lines, plan, failures, pool, sources };
  }

  const writes = flags.transport === 'seat';
  const events = journal.slice();
  const persist = () => {
    if (!writes) return;
    mkdirSync(dirname(settlePath), { recursive: true });
    writeFileSync(settlePath, `${JSON.stringify({ schema: JOURNAL_SCHEMA, events }, null, 2)}\n`);
  };
  const append = (event) => { events.push(event); persist(); };

  if (writes) {
    for (const recovered of plan.recovered) {
      append({ id: recovered.id, at: nowIso, cycle, seat: recovered.seat, taskId: recovered.taskId, state: 'recovered', reason: recovered.reason });
    }
  }

  const planned = plan.decisions.filter((decision) => decision.action === 'WAKE');
  let woke = 0;

  if (flags.transport === 'agent') {
    for (const decision of planned) {
      const line = `DISPATCH ${decision.seat} ${decision.taskId} :: ${String(decision.promptSlice ?? '').replace(/\n/g, ' | ')}`;
      if (spawn) spawn(line);
      out(line);
    }
  } else {
    const wakeFn = wake ?? defaultWake({ channelRoot, liveMap, force: flags.force, idleMinutes, waitSec: flags.waitSec });
    const verifyFn = verify ?? defaultVerify({ channelRoot });
    let index = 0;
    for (const decision of planned) {
      index += 1;
      const attempt = {
        id: `AUT-${compact(nowIso)}-${decision.seat}${index > 1 ? `-${index}` : ''}`,
        cycle,
        seat: decision.seat,
        taskId: decision.taskId,
      };
      // Journal before effect. A throw below leaves this pending record as the
      // last event, which is exactly what the next cycle recovers.
      append({ ...attempt, at: nowIso, state: 'pending', reason: decision.reason });
      let result;
      try {
        result = wakeFn(decision, { attempt, root: channelRoot });
      } catch (error) {
        failures.push({ seat: decision.seat, taskId: decision.taskId, error: error?.message ?? String(error) });
        err(`autonomy: wake ${decision.seat}/${decision.taskId} failed: ${error?.message ?? error}`);
        continue;
      }
      if (result?.accepted !== true) {
        append({ ...attempt, at: nowIso, state: 'no-reply', reason: `transport refused: ${result?.code ?? 'unknown'} — ${result?.detail ?? 'no detail'}` });
        failures.push({ seat: decision.seat, taskId: decision.taskId, error: String(result?.code ?? 'TRANSPORT_REFUSED') });
        err(`autonomy: wake ${decision.seat}/${decision.taskId} refused: ${result?.code ?? 'unknown'} ${result?.detail ?? ''}`.trim());
        continue;
      }
      woke += 1;
      append({ ...attempt, at: nowIso, state: 'sent', wakeId: result.id ?? null, reason: String(result.detail ?? 'transport accepted') });
      let proof;
      try {
        proof = verifyFn(decision, { attempt, wakeId: result.id ?? null, root: channelRoot });
      } catch (error) {
        failures.push({ seat: decision.seat, taskId: decision.taskId, error: `verify failed: ${error?.message ?? String(error)}` });
        err(`autonomy: verify ${decision.seat} failed: ${error?.message ?? error}`);
        continue;
      }
      append({
        ...attempt,
        at: nowIso,
        state: proof?.seen ? 'got-reply' : 'no-reply',
        wakeId: result.id ?? null,
        reason: String(proof?.detail ?? (proof?.seen ? 'the seat transcript carries the wake' : 'no reply in the transcript yet')),
      });
    }
  }

  let pending = plan.summary.pending;
  if (writes) {
    pending = [...foldJournal(events).values()]
      .filter((attempt) => OPEN_STATES.includes(/** @type {any} */ (attempt.state))).length;
  }

  const summaryLine = `autonomy: planned=${plan.decisions.length} woke=${woke} skipped=${plan.summary.skips} pending=${pending} recovered=${plan.summary.recovered}`;
  out(summaryLine);
  return { code: failures.length ? 1 : 0, lines, plan, failures, pool, sources };
}

function defaultWake({ channelRoot, liveMap, force, idleMinutes, waitSec }) {
  return (decision, ctx) => {
    const result = wakeSeat({
      root: channelRoot,
      seatId: decision.seat,
      prompt: decision.promptSlice,
      reason: decision.reason,
      force,
      idleMinutes,
      probe: (sessionId) => (liveMap ? liveMap.get(sessionId) ?? null : null),
      send: (sessionId, text) => resumeSession(sessionId, text, {
        timeoutMs: Math.max(10, Number(waitSec) || 180) * 1000,
        cwd: liveMap?.get?.(sessionId)?.directory,
      }),
    });
    if (result.decision === 'DENIED') {
      return { accepted: false, code: result.code, detail: result.detail };
    }
    return {
      accepted: true,
      pending: result.code === 'WAKE_PENDING',
      id: result.id ?? null,
      detail: `${result.code} — ${result.detail}`,
    };
  };
}

function defaultVerify({ channelRoot }) {
  return (decision, ctx) => {
    const proof = verifySeat({
      root: channelRoot,
      seatId: decision.seat,
      id: ctx?.wakeId ?? null,
      confirm: (sessionId, wakeId) => confirmWake(sessionId, wakeId),
    });
    return { seen: proof.decision === 'ACCEPTED', detail: proof.detail };
  };
}

function main() {
  const result = runAutonomy({
    argv: process.argv.slice(2),
    stdout: (line) => console.log(line),
    stderr: (line) => console.error(line),
  });
  process.exit(result.code);
}

if (import.meta.main) main();
