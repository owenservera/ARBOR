// @ts-check
/**
 * @hq:context Autonomy dispatch planner — decide which seat may take which open task this cycle, as a pure function of roster, queue, provider funding, journal and an injected clock
 * @hq:owner autonomy-dispatcher
 * @hq:task autonomy-lane-a1
 * @hq:invariant pure: no fs, no spawn, no clock read. `now` is an argument and is required.
 * @hq:invariant liveness is owned by seat-heartbeat.mjs; this module never compares an age to a window of its own invention
 * @hq:invariant an `unknown` heartbeat is not `idle`: evidence is not inference, so it never becomes a wake
 * @hq:invariant one slice per seat per cycle; a task is consumed by exactly one wake decision
 * @hq:invariant every refusal is a stable code, never free text alone
 * @hq:see hq/lib/seat-heartbeat.mjs
 * @hq:see hq/lib/channel-seats.mjs
 */
import { heartbeat, DEFAULT_IDLE_MS } from './seat-heartbeat.mjs';
import { DEFAULT_POLICY } from './model-router.mjs';
import { composeContext, verifyContext } from './context.mjs';
import { routeAsk } from './ask.mjs';

export const PLAN_SCHEMA = 'hq.autonomy-plan/1';
export const JOURNAL_SCHEMA = 'hq.autonomy-journal/1';

/** Two idle windows: after that a journaled attempt is a leak, not a live wake. */
export const DEFAULT_STALE_MS = 2 * DEFAULT_IDLE_MS;

/** The whole refusal vocabulary. A decision outside this list is a bug. */
export const CODES = Object.freeze([
  'NO_OPEN_TASK',
  'SEAT_ACTIVE',
  'SEAT_UNKNOWN',
  'SEAT_UNKNOWN_EVIDENCE',
  'NO_FUNDED_MODEL',
  'ALREADY_IN_FLIGHT',
  'EMPTY_SLICE',
  'CAP_REACHED',
  'WAKE',
  'NO_BUILDER',
  'ORDER_NOT_BUILDER',
  'SEAT_NOT_BUILDER',
]);

/**
 * The builder worker roster (WO-005): the ids allowed to receive an authored
 * work order. It is an EXPLICIT list, never a default-open classification —
 * a channel chat seat without a role is a web-channel seat, not a code builder,
 * so it is excluded. A builder is named either by a seat whose `role` is
 * `builder` or by the roster document's `builders` array (a string id or an
 * object with an id — a builder may be an agent type like forge, which is not
 * a chat seat at all). Accepts the raw roster document or a bare seats array.
 *
 * @param {any} seatData
 * @returns {string[]}
 */
export function builderWorkers(seatData) {
  const seats = Array.isArray(seatData) ? seatData : Array.isArray(seatData?.seats) ? seatData.seats : [];
  const declared = Array.isArray(seatData?.builders) ? seatData.builders : [];
  /** @type {string[]} */
  const ids = [];
  const push = (value) => {
    const id = String(value ?? '').trim().toLowerCase();
    if (id && !ids.includes(id)) ids.push(id);
  };
  for (const entry of declared) push(typeof entry === 'string' ? entry : entry?.id);
  for (const seat of seats) {
    if (seat && typeof seat === 'object' && seat.role === 'builder') push(seat.id ?? seat.seat ?? seat.name);
  }
  return ids;
}

export const TERMINAL_STATES = /** @type {const} */ (['got-reply', 'no-reply', 'recovered', 'failed', 'cancelled']);
export const OPEN_STATES = /** @type {const} */ (['pending', 'sent']);

const DONE_STATUS = new Set(['done', 'closed', 'complete', 'completed', 'verified', 'shipped', 'cancelled', 'canceled']);
const UNBOUND_SEATS = new Set(['', 'unbound', 'any', '*', 'none']);

/**
 * Read a timestamp as epoch ms. Anything unreadable is null, never a guess —
 * the same rule seat-heartbeat applies to a missing observation.
 *
 * @param {any} value
 * @returns {number|null}
 */
function toMs(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const t = Date.parse(text);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function numberOr(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function isoAt(ms) {
  return ms === null ? null : new Date(ms).toISOString();
}

function entriesOf(journal) {
  if (Array.isArray(journal)) return journal;
  if (Array.isArray(journal?.events)) return journal.events;
  return [];
}

/**
 * Fold an append-only journal into the current attempt per id. The last event
 * wins for state; the first readable timestamp is the attempt's start.
 *
 * @param {any} journal An event array, or a `{ events }` document.
 * @returns {Map<string, {id: string, seat: string|null, taskId: string|null, cycle: string|null, state: string, startedAt: string|null, updatedAt: string|null, reason: string|null, events: number}>}
 */
export function foldJournal(journal) {
  /** @type {Map<string, any>} */
  const out = new Map();
  for (const event of entriesOf(journal)) {
    if (!event || typeof event !== 'object') continue;
    const id = String(event.id ?? '').trim();
    if (!id) continue;
    const at = toMs(event.at);
    const prev = out.get(id);
    if (!prev) {
      out.set(id, {
        id,
        seat: event.seat ?? null,
        taskId: event.taskId ?? null,
        cycle: event.cycle ?? null,
        state: String(event.state ?? ''),
        startedAt: isoAt(at),
        updatedAt: isoAt(at),
        reason: event.reason ?? null,
        events: 1,
      });
      continue;
    }
    prev.state = String(event.state ?? prev.state);
    if (event.seat !== undefined && event.seat !== null) prev.seat = event.seat;
    if (event.taskId !== undefined && event.taskId !== null) prev.taskId = event.taskId;
    if (event.cycle !== undefined && event.cycle !== null) prev.cycle = event.cycle;
    if (at !== null) prev.updatedAt = isoAt(at);
    if (event.reason !== undefined) prev.reason = event.reason;
    prev.events += 1;
  }
  return out;
}

function providerList(providers) {
  if (Array.isArray(providers)) return providers;
  if (Array.isArray(providers?.providers)) return providers.providers;
  return [];
}

/**
 * The first provider that can actually carry a call. Funding must be stated,
 * not assumed: an empty list is NO_FUNDED_MODEL, never a silent default.
 *
 * @param {any} providers
 * @param {{minReliability?: number, maxUsdPerCall?: number, blockedProviders?: string[]}} [opts]
 * @returns {{provider: any, policy: {minReliability: number, maxUsdPerCall: number}}|null}
 */
export function findFundedProvider(providers, opts = {}) {
  const minReliability = numberOr(opts.minReliability, Number(DEFAULT_POLICY.minReliability) || 0.5);
  const maxUsdPerCall = numberOr(opts.maxUsdPerCall, Number(DEFAULT_POLICY.maxUsdPerCall) || 0.5);
  const blocked = new Set((opts.blockedProviders ?? DEFAULT_POLICY.blockedProviders ?? []).map((id) => String(id).toLowerCase()));
  const policy = { minReliability, maxUsdPerCall };

  for (const provider of providerList(providers)) {
    if (!provider || typeof provider !== 'object') continue;
    if (provider.funded === true) return { provider, policy };
    if (provider.funded === false || provider.blocked === true || provider.disabled === true) continue;
    const id = String(provider.id ?? provider.provider ?? provider.provider_id ?? '').toLowerCase();
    if (id && blocked.has(id)) continue;
    const state = String(provider.state ?? provider.health ?? '').toLowerCase();
    if (['down', 'unhealthy', 'failed', 'blocked', 'exhausted', 'suspended', 'retired'].includes(state)) continue;
    const reliability = Number(provider.reliability);
    if (Number.isFinite(reliability) && reliability < minReliability) continue;
    const cost = Number(provider.usdPerCall);
    if (Number.isFinite(cost) && cost > maxUsdPerCall && provider.free !== true) continue;
    return { provider, policy };
  }
  return null;
}

function taskIdOf(task) {
  return String(task?.id ?? task?.taskId ?? task?.task_id ?? '').trim();
}

function taskSeatOf(task) {
  const seat = String(task?.seat ?? task?.owner ?? '').trim().toLowerCase();
  return UNBOUND_SEATS.has(seat) ? null : seat;
}

function deliverableOf(task) {
  return String(task?.task ?? task?.deliverable ?? task?.title ?? '').trim();
}

function fileOf(task) {
  return String(task?.file ?? task?.path ?? task?.write ?? '').trim();
}

/**
 * A proof must be runnable. The queue stores prose in `proof`, and an authored
 * order stores it in `proofCommand`, so both fields meet the same rule here:
 * one line, starting like a command. A session id, a filename or a sentence in
 * backticks is not a proof and must not become one — this reader fails closed
 * even when a caller forgets to validate first.
 */
const PROOF_COMMAND_RE = /^(?:bun|bunx|node|npm|npx|pnpm|yarn|deno|python[0-9.]*|py|cargo|rustc|go|dotnet|tsc|git|gh|curl|wget|pwsh|powershell|cmd|sh|bash|hq|zcode|es|du|handle|fclones|sqlite3)\b/i;

/** One command-shaped line, or nothing. @param {string} text */
function isProofCommand(text) {
  const candidate = String(text).trim();
  if (!candidate || /[\r\n]/.test(candidate)) return false;
  return PROOF_COMMAND_RE.test(candidate);
}

/**
 * The proving command: an explicit field wins, else the first command-shaped
 * backticked span in `proof`. An explicit field that is present but is not a
 * command is refused outright, never silently replaced by the backticked span:
 * a prose proof is a contradiction, not a fallback opportunity.
 */
function proofCommandOf(task) {
  const explicit = String(task?.proofCommand ?? task?.command ?? '').trim();
  if (explicit) return isProofCommand(explicit) ? explicit : '';
  const match = String(task?.proof ?? '').match(/`([^`\n]+)`/);
  if (!match) return '';
  const candidate = match[1].trim();
  return isProofCommand(candidate) ? candidate : '';
}

/**
 * Refuse a task only by a stated STATE. `kind` is a description of what the
 * observation is about ("here is something that needs unblocking"), never a
 * dispatch decision: a `blocked`/`mismatch` row that names a file and a
 * proving command is the most actionable row in the queue. An incomplete row
 * is refused later, by `buildPromptSlice` returning null.
 *
 * @param {any} task
 * @returns {boolean}
 */
export function isBlockedTask(task) {
  if (!task || typeof task !== 'object') return true;
  if (task.blocked === true) return true;
  const status = String(task.status ?? task.state ?? '').toLowerCase();
  return status === 'blocked' || DONE_STATUS.has(status);
}

/**
 * Build the self-contained slice a seat receives. Returns null when the task
 * cannot supply every part: a slice missing its file or its proof is not a
 * slice, and it is never sent as one.
 *
 * @param {any} task
 * @returns {string|null}
 */
export function buildPromptSlice(task) {
  const id = taskIdOf(task);
  const deliverable = deliverableOf(task);
  const file = fileOf(task);
  const prove = proofCommandOf(task);
  if (!id || !deliverable || !file || !prove) return null;
  return [
    `Task: ${id}`,
    `Deliverable: ${deliverable}`,
    `Write only: ${file}`,
    `Prove with: ${prove}`,
    'Scope: one file; no git, no network, no other paths.',
    'Report first line: DONE|BLOCKED|RUNNING — <reason>.',
  ].join('\n');
}

/**
 * The last observation for a seat. Seat fields win; `opts.live` accepts a
 * `{ lastSeenAt }` record, an epoch/ISO timestamp, or an `ageMinutes` value
 * adapted against the injected `now`. It never decides a state — heartbeat does.
 *
 * @param {any} seat
 * @param {any} live
 * @param {number} nowMs
 * @returns {any}
 */
function lastSeenFor(seat, live, nowMs) {
  const direct = seat?.lastSeenAt ?? seat?.at ?? seat?.observedAt;
  if (direct !== undefined && direct !== null && direct !== '') return direct;
  const keys = [seat?.session, seat?.id, seat?.seat, seat?.name].filter(Boolean);
  for (const key of keys) {
    const value = live instanceof Map ? live.get(key) : live?.[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'object') {
      if (value.lastSeenAt !== undefined && value.lastSeenAt !== null) return value.lastSeenAt;
      if (value.at !== undefined && value.at !== null) return value.at;
      if (typeof value.ageMinutes === 'number' && Number.isFinite(value.ageMinutes)) {
        return new Date(nowMs - value.ageMinutes * 60_000).toISOString();
      }
      return null;
    }
    return value;
  }
  if (typeof seat?.ageMinutes === 'number' && Number.isFinite(seat.ageMinutes)) {
    return new Date(nowMs - seat.ageMinutes * 60_000).toISOString();
  }
  return null;
}

function decision({ seat, taskId = null, action, code, reason, promptSlice = null }) {
  return {
    seat: seat ?? null,
    taskId: taskId ?? null,
    action,
    code,
    promptSlice,
    reason: String(reason ?? ''),
  };
}

/**
 * Plan one dispatch cycle. Pure: everything it knows arrives as an argument and
 * everything it decides comes back as data.
 *
 * @param {{
 *   seats?: any,
 *   tasks?: any,
 *   providers?: any,
 *   journal?: any,
 *   now?: any,
 *   opts?: {
 *     cycle?: string,
 *     maxWakes?: number,
 *     force?: boolean,
 *     idleMs?: number,
 *     lastTurnMs?: number,
 *     staleMs?: number,
 *     live?: any,
 *     minReliability?: number,
 *     maxUsdPerCall?: number,
 *     blockedProviders?: string[],
 *     builderIds?: string[] | Iterable<string>,
 *   },
 * }} input
 * @returns {{
 *   schema: string,
 *   cycle: string,
 *   now: string,
 *   decisions: Array<{seat: string|null, taskId: string|null, action: 'WAKE'|'SKIP', code: string, promptSlice: string|null, reason: string}>,
 *   summary: {wakes: number, skips: number, pending: number, recovered: number},
 *   recovered: Array<{id: string, seat: string|null, taskId: string|null, state: string, at: string|null, ageMinutes: number|null, reason: string}>,
 * }}
 */
export function planDispatch({ seats, tasks, providers, journal, now, opts = {} } = {}) {
  if (now === undefined || now === null || now === '') {
    throw new TypeError('planDispatch needs `now`: the clock is an argument, never a read');
  }
  const nowMs = toMs(now);
  if (nowMs === null) throw new TypeError(`planDispatch: now "${String(now)}" is not a timestamp`);
  const nowIso = new Date(nowMs).toISOString();
  const cycle = String(opts.cycle ?? nowIso);
  const idleMs = numberOr(opts.idleMs, DEFAULT_IDLE_MS);
  const staleMs = numberOr(opts.staleMs, 2 * idleMs);
  const maxWakes = opts.maxWakes === undefined || opts.maxWakes === null ? Infinity : numberOr(opts.maxWakes, Infinity);
  const force = opts.force === true;
  const staleMinutes = Math.round(staleMs / 60_000);

  const seatList = Array.isArray(seats) ? seats : Array.isArray(seats?.seats) ? seats.seats : [];
  const taskList = (Array.isArray(tasks) ? tasks : Array.isArray(tasks?.tasks) ? tasks.tasks : [])
    .filter((task) => task && typeof task === 'object');
  const folded = foldJournal(journal);

  // WO-005: an authored work order is builder work. When the caller supplies a
  // builder roster, an order is eligible only for a seat on that roster — the
  // channel seat roster alone never makes a chat seat a code builder. `null`
  // (no roster supplied) keeps the pure function's prior behavior for callers
  // that plan non-order tasks only.
  const builderIdList = opts.builderIds === undefined || opts.builderIds === null
    ? null
    : (Array.isArray(opts.builderIds) ? opts.builderIds : [...opts.builderIds])
      .map((value) => String(value ?? '').trim().toLowerCase()).filter(Boolean);
  const builderIds = builderIdList === null ? null : new Set(builderIdList);
  const isAuthoredOrder = (task) => task?.kind === 'work-order' || task?.pool === 'orders';

  // ---- recovery: close attempts no cycle can still be waiting on -----------------
  const recovered = [];
  const recoveredIds = new Set();
  const recoveredTaskIds = new Set();
  for (const attempt of folded.values()) {
    if (!OPEN_STATES.includes(/** @type {any} */ (attempt.state))) continue;
    const startedMs = toMs(attempt.startedAt);
    const ageMs = startedMs === null ? null : Math.max(0, nowMs - startedMs);
    const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000);
    let reason = null;
    if (attempt.state === 'pending' && attempt.cycle !== cycle) {
      reason = `pending intent ${attempt.id} was left by cycle ${attempt.cycle ?? 'unknown'} with no sent record; the wake was interrupted before a result — closing it as no-reply, not retrying the same slice`;
    } else if (ageMs !== null && ageMs >= staleMs) {
      reason = `${attempt.state} attempt ${attempt.id} has no result after ${ageMinutes}m, past 2x the ${Math.round(idleMs / 60_000)}m idle window (${staleMinutes}m) — closing it as no-reply instead of retrying forever`;
    }
    if (!reason) continue;
    recoveredIds.add(attempt.id);
    if (attempt.taskId) recoveredTaskIds.add(String(attempt.taskId));
    recovered.push({
      id: attempt.id,
      seat: attempt.seat,
      taskId: attempt.taskId,
      state: attempt.state,
      at: attempt.startedAt,
      ageMinutes,
      reason,
    });
  }

  // ---- in-flight: a fresh attempt holds its seat and its task ----------------------
  /** @type {Map<string, any>} */
  const inflightBySeat = new Map();
  const inflightTaskIds = new Set();
  let pendingCount = 0;
  for (const attempt of folded.values()) {
    if (!OPEN_STATES.includes(/** @type {any} */ (attempt.state))) continue;
    if (recoveredIds.has(attempt.id)) continue;
    const startedMs = toMs(attempt.startedAt);
    const ageMs = startedMs === null ? null : Math.max(0, nowMs - startedMs);
    if (ageMs !== null && ageMs >= staleMs) continue;
    const seatKey = String(attempt.seat ?? '').trim().toLowerCase();
    inflightBySeat.set(seatKey, attempt);
    if (attempt.taskId) inflightTaskIds.add(String(attempt.taskId));
    pendingCount += 1;
  }

  const decisions = [];
  const consumed = new Set();
  const reportedEmpty = new Set();
  const rosterIds = new Set();
  const seenSeats = new Set();
  let wakes = 0;

  for (const seat of seatList) {
    if (!seat || typeof seat !== 'object') continue;
    const seatId = String(seat.id ?? seat.seat ?? seat.name ?? '').trim().toLowerCase();
    if (!seatId || seenSeats.has(seatId)) continue;
    seenSeats.add(seatId);
    rosterIds.add(seatId);

    if (!seat.session) {
      decisions.push(decision({
        seat: seatId,
        action: 'SKIP',
        code: 'SEAT_UNKNOWN',
        reason: `seat "${seatId}" has no session id in the roster, so it cannot be woken`,
      }));
      continue;
    }

    const flight = inflightBySeat.get(seatId);
    if (flight) {
      decisions.push(decision({
        seat: seatId,
        taskId: flight.taskId ?? null,
        action: 'SKIP',
        code: 'ALREADY_IN_FLIGHT',
        reason: `attempt ${flight.id} is ${flight.state} and younger than the ${staleMinutes}m stale window; one slice per seat, and it is not this one`,
      }));
      continue;
    }

    const beat = heartbeat({
      now: nowIso,
      lastSeenAt: lastSeenFor(seat, opts.live, nowMs),
      idleMs: opts.idleMs,
      lastTurnMs: opts.lastTurnMs,
    });
    if (beat.state === 'unknown') {
      decisions.push(decision({
        seat: seatId,
        action: 'SKIP',
        code: 'SEAT_UNKNOWN_EVIDENCE',
        reason: `liveness is unknown: ${beat.detail}; evidence is not inference, so this seat is not woken`,
      }));
      continue;
    }
    if (beat.state === 'busy' && !force) {
      decisions.push(decision({
        seat: seatId,
        action: 'SKIP',
        code: 'SEAT_ACTIVE',
        reason: `the seat is inside its turn window (${beat.detail}); leave it working, or pass --force only if it is stuck`,
      }));
      continue;
    }

    // A task that cannot supply a deliverable, a file and a proof is not a
    // candidate at all: letting it win selection would starve every good task
    // behind it. It is still reported — once per cycle — as EMPTY_SLICE.
    const eligible = (task) => {
      if (isBlockedTask(task)) return false;
      const id = taskIdOf(task);
      if (!id) return false;
      if (consumed.has(id) || inflightTaskIds.has(id) || recoveredTaskIds.has(id)) return false;
      const bound = taskSeatOf(task);
      if (bound !== null && bound !== seatId) return false;
      if (isAuthoredOrder(task) && builderIds !== null && !builderIds.has(seatId)) return false;
      return true;
    };
    const candidates = taskList.filter((task) => eligible(task) && buildPromptSlice(task) !== null);
    const task = candidates.find((candidate) => taskSeatOf(candidate) === seatId) ?? candidates[0] ?? null;
    if (!task) {
      const unusable = taskList.find((candidate) => eligible(candidate) && buildPromptSlice(candidate) === null);
      const unusableId = unusable ? taskIdOf(unusable) : null;
      if (unusableId && !reportedEmpty.has(unusableId)) {
        reportedEmpty.add(unusableId);
        decisions.push(decision({
          seat: seatId,
          taskId: unusableId,
          action: 'SKIP',
          code: 'EMPTY_SLICE',
          reason: 'the task does not name a deliverable, an exact file, and the command that proves it, so the slice would not be self-contained and the queue cannot use it',
        }));
      } else {
        const unusableCount = taskList.filter((candidate) => eligible(candidate) && buildPromptSlice(candidate) === null).length;
        decisions.push(decision({
          seat: seatId,
          action: 'SKIP',
          code: 'NO_OPEN_TASK',
          reason: unusableId
            ? `no usable task is waiting for this seat; ${unusableCount} eligible task(s) cannot form a self-contained slice, and task ${unusableId} already carries the EMPTY_SLICE decision`
            : 'no open, unblocked task is waiting for this seat',
        }));
      }
      continue;
    }
    const id = taskIdOf(task);
    const slice = buildPromptSlice(task);

    const funded = findFundedProvider(providers, opts);
    if (!funded) {
      decisions.push(decision({
        seat: seatId,
        taskId: id,
        action: 'SKIP',
        code: 'NO_FUNDED_MODEL',
        reason: 'no provider is funded: every route is blocked, unhealthy, below the reliability floor, or over the per-call ceiling',
      }));
      continue;
    }

    if (wakes >= maxWakes) {
      decisions.push(decision({
        seat: seatId,
        taskId: id,
        action: 'SKIP',
        code: 'CAP_REACHED',
        reason: `the ${maxWakes}-wake budget for this cycle is spent; this seat waits for the next one`,
      }));
      continue;
    }

    consumed.add(id);
    wakes += 1;
    decisions.push(decision({
      seat: seatId,
      taskId: id,
      action: 'WAKE',
      code: 'WAKE',
      promptSlice: slice,
      reason: `funded by ${funded.provider.id ?? funded.provider.provider ?? 'unknown'}; ${beat.detail}`,
    }));
  }

  // A task bound to a seat that is not in the roster has no owner; say so once.
  // An authored order bound to a seat that is not on the builder roster is the
  // same failure one level up: the order names a worker that must never take it.
  for (const task of taskList) {
    if (isBlockedTask(task)) continue;
    const bound = taskSeatOf(task);
    const id = taskIdOf(task);
    if (!id || consumed.has(id) || inflightTaskIds.has(id) || recoveredTaskIds.has(id)) continue;
    if (bound && builderIds !== null && isAuthoredOrder(task) && !builderIds.has(bound)) {
      decisions.push(decision({
        seat: bound,
        taskId: id,
        action: 'SKIP',
        code: 'ORDER_NOT_BUILDER',
        reason: `authored order ${id} names seat "${bound}", which is not on the builder roster; a DISPATCH line for builder work never names a chat seat as the worker`,
      }));
      continue;
    }
    if (!bound || rosterIds.has(bound)) continue;
    decisions.push(decision({
      seat: bound,
      taskId: id,
      action: 'SKIP',
      code: 'SEAT_UNKNOWN',
      reason: `the task names seat "${bound}", which is not in the roster; nobody can take it`,
    }));
  }

  // An authored order that no builder could take because the builder roster is
  // EMPTY is its own defect signal: silently planning nothing reads as a quiet
  // fleet when the truth is that no builder is rostered. Say it once, with the
  // order id, so the next reader knows the queue is healthy and the roster is not.
  if (builderIds !== null && builderIds.size === 0) {
    const waiting = taskList.find((task) => {
      if (isBlockedTask(task) || !isAuthoredOrder(task)) return false;
      const id = taskIdOf(task);
      return id && !consumed.has(id) && !inflightTaskIds.has(id) && !recoveredTaskIds.has(id);
    });
    if (waiting) {
      decisions.push(decision({
        seat: null,
        taskId: taskIdOf(waiting),
        action: 'SKIP',
        code: 'NO_BUILDER',
        reason: 'the builder roster is empty; an authored work order is never handed to a chat seat, so it waits until a builder is rostered (a seat with role "builder" or a builders list in the roster document)',
      }));
    }
  }

  if (!decisions.length && taskList.some((task) => !isBlockedTask(task))) {
    decisions.push(decision({
      seat: null,
      action: 'SKIP',
      code: 'SEAT_UNKNOWN',
      reason: 'the roster lists no wakeable seat, so no task can be dispatched',
    }));
  }

  const wakeCount = decisions.filter((d) => d.action === 'WAKE').length;
  return {
    schema: PLAN_SCHEMA,
    cycle,
    now: nowIso,
    decisions,
    summary: {
      wakes: wakeCount,
      skips: decisions.length - wakeCount,
      pending: pendingCount,
      recovered: recovered.length,
    },
    recovered,
  };
}

/**
 * @hq:context Autonomous investigation — given a complex objective, independently
 * determine what to investigate (compose an evidence bundle), verify the findings
 * against current disk, route the ask to an HQ command, and deliver a defensible
 * answer anchored to file:line. Pure: the DB handle and the compose/verify/route
 * callables are injected arguments; this module opens nothing, spawns nothing and
 * reads no clock. The caller (a fixture or the dispatch loop) binds the real
 * modules and proves each step.
 *
 * HQ-100 engine surface: extends hq/lib/autonomy.mjs without touching any existing
 * export. planDispatch() and every gate code are unchanged.
 * @hq:invariant every finding carries a `where` anchor (file:line ref) so the
 *   answer is defensible, never an assertion of faith.
 * @hq:invariant verification is a pass/fail on recomputed digests, never trusted
 *   retained text.
 * @hq:see hq/lib/context.mjs composeContext/verifyContext
 * @hq:see hq/lib/ask.mjs routeAsk
 */
export const INVESTIGATION_SCHEMA = 'hq.autonomy-investigation/1';

/**
 * Investigate one objective autonomously.
 *
 * @param {{
 *   task: string,
 *   db: any,                          // open HQ index handle (injected, not opened here)
 *   compose?: (db: any, options: object) => object,   // defaults to composeContext
 *   verify?: (bundle: object) => {valid: boolean, changed: string[], expected: string|null, current: string},
 *   routeAskFn?: (question: string) => object,        // defaults to routeAsk
 *   budgetTokens?: number,
 *   maxFiles?: number,
 *   now?: string|number|Date|null,                     // injected clock, passed to the composer
 * }} options
 * @returns {{
 *   schema: string,
 *   objective: string,
 *   composed: boolean,
 *   verification: {valid: boolean, changed: string[], expected: string|null, current: string}|null,
 *   route: {intent: string, command: string, confidence: number}|null,
 *   findings: Array<{what: string, where: string, digest: string|null}>,
 *   trail: Array<{step: string, ok: boolean, detail: string}>,
 *   verdict: string,
 *   digest: string|null,
 *   sources: number,
 * }}
 */
export function investigateObjective({
  task,
  db,
  compose = composeContext,
  verify = verifyContext,
  routeAskFn = routeAsk,
  budgetTokens = 6000,
  maxFiles = 24,
  now = undefined,
} = {}) {
  const objective = String(task ?? '').trim();
  if (!objective) throw new TypeError('investigateObjective needs a task/objective');
  if (db === null || db === undefined) throw new TypeError('investigateObjective needs an injected db handle');

  const findings = [];
  const trail = [];

  // 1. Compose the evidence bundle — a read-only, line-anchored projection of the index.
  let bundle = null;
  let composed = false;
  try {
    const composer = compose ?? composeContext;
    bundle = composer(db, { task: objective, budgetTokens, maxFiles, now });
    composed = true;
    trail.push({
      step: 'compose',
      ok: true,
      detail: `${bundle.sources?.length ?? 0} sources, ${bundle.budget?.used ?? 0}/${bundle.budget?.capacity ?? 0} tokens, digest ${bundle.digest ? bundle.digest.slice(0, 16) : 'none'}`,
    });
  } catch (error) {
    trail.push({ step: 'compose', ok: false, detail: String(error?.message ?? error) });
  }

  // 2. Verify the bundle against current disk (recompute digests, never trust retained text).
  let verification = null;
  if (bundle) {
    const verifier = verify ?? verifyContext;
    verification = verifier(bundle);
    trail.push({
      step: 'verify',
      ok: verification.valid === true,
      detail: verification.valid === true
        ? 'bundle matches current disk — every source digest recomputed and equal'
        : `changed sources: ${verification.changed.join(', ')}`,
    });
  }

  // 3. Route the ask to an HQ command so the next step is a concrete action, not a guess.
  let route = null;
  if (routeAskFn) {
    try {
      route = routeAskFn(objective);
      trail.push({
        step: 'route',
        ok: route.ok !== false,
        detail: `${route.intent ?? 'unknown'} -> ${route.command ?? 'none'} (confidence ${route.confidence ?? 0})`,
      });
    } catch (error) {
      trail.push({ step: 'route', ok: false, detail: String(error?.message ?? error) });
    }
  }

  // 4. Defensible findings: every claim anchored to a file:line ref from the bundle.
  const sources = Array.isArray(bundle?.sources) ? bundle.sources : [];
  const sourceDetails = sources.map((source) => ({
    ref: String(source.ref ?? ''),
    path: String(source.path ?? ''),
    lines: Array.isArray(source.lines) ? source.lines : [1, 1],
    reason: String(source.reason ?? ''),
    sha256: String(source.sha256 ?? ''),
  }));
  for (const source of sourceDetails) {
    findings.push({
      what: `${source.reason || 'source'}: ${source.ref} lines ${source.lines[0]}-${source.lines[1]}`,
      where: source.ref,
      digest: source.sha256 || null,
    });
  }

  const verdict = composed && verification ? (verification.valid === true
    ? (sources.length === 0
      ? 'incomplete: bundle verified but gathered no source to anchor a claim to'
      : 'defensible: composed and verified against current disk; every claim anchored to file:line')
    : 'unverifiable: bundle sources changed since composition — re-investigate before acting')
    : composed
      ? 'incomplete: bundle composed but not verified'
      : 'incomplete: could not compose the evidence bundle';

  return {
    schema: INVESTIGATION_SCHEMA,
    objective,
    composed,
    verification,
    route,
    findings,
    sourceDetails,
    trail,
    verdict,
    digest: bundle?.digest ?? null,
    sources: sources.length,
  };
}

/**
 * Render one investigation as a self-contained text report (read-only, no effects).
 *
 * @param {object} investigation the result of investigateObjective()
 * @returns {string}
 */
export function summarizeInvestigation(investigation) {
  if (!investigation || typeof investigation !== 'object') {
    return 'Investigation: (no investigation result)';
  }
  const lines = [];
  lines.push(`Investigation: ${investigation.objective}`);
  lines.push(`schema: ${investigation.schema ?? INVESTIGATION_SCHEMA}`);
  lines.push(`verdict: ${investigation.verdict}`);
  lines.push(`digest: ${investigation.digest ?? 'none'}`);
  lines.push(`sources: ${investigation.sources ?? 0}`);
  const v = investigation.verification;
  lines.push(`verification: ${v ? (v.valid === true ? 'valid' : `changed(${Array.isArray(v.changed) ? v.changed.length : 0})`) : 'none'}`);
  const r = investigation.route;
  lines.push(`route: ${r ? `${r.intent ?? 'unknown'} -> ${r.command ?? 'none'} confidence=${r.confidence ?? 0}` : 'none'}`);
  for (const t of Array.isArray(investigation.trail) ? investigation.trail : []) {
    lines.push(`  [${t.step}] ${t.ok === true ? 'ok' : 'fail'} — ${t.detail}`);
  }
  for (const f of Array.isArray(investigation.findings) ? investigation.findings : []) {
    lines.push(`  FINDING ${f.what} @ ${f.where}`);
  }
  return lines.join('\n');
}

/**
 * Autonomous investigation: given a complex objective, determine what to
 * investigate, verify the findings, and deliver a defensible answer.
 *
 * Pure orchestrator: autonomy.mjs performs no fs, spawn, or clock reads
 * itself. Every engine is injected (composeContext, verifyContext, routeAsk)
 * and `now` is an argument, so the same inputs always yield the same trail
 * and verdict. It closes the HQ-100 gap by reusing the existing engines
 * instead of building a new authoritative one. Existing exports and the
 * planDispatch builder are untouched.
 *
 * This is the compatibility surface of investigateObjective(), which is the
 * single implementation of the capability; the two differ only in shape.
 *
 * @param {{objective: string, composeContext: (db, opts) => object,
 *          verifyContext: (bundle) => {valid: boolean, changed: string[]},
 *          routeAsk: (question: string) => {intent: string, command: string,
 *          confidence: number}, db: any, now?: string|number|Date|null}} input
 * @returns {{objective: string, trail: Array<{ref: string, path: string,
 *   lines: Array<number>, reason: string, sha256: string}>, verdict: {valid:
 *   boolean, changed: string[]}, route: {intent: string, command: string,
 *   confidence: number}, anchored: boolean}}
 */
export function autonomousInvestigate({
  objective, composeContext: compose, verifyContext: verify, routeAsk: route, db, now,
} = {}) {
  if (typeof objective !== 'string' || !objective.trim()) {
    throw new TypeError('autonomousInvestigate needs a non-empty objective');
  }
  if (typeof compose !== 'function') {
    throw new TypeError('autonomousInvestigate needs composeContext');
  }
  if (typeof verify !== 'function') {
    throw new TypeError('autonomousInvestigate needs verifyContext');
  }
  if (typeof route !== 'function') {
    throw new TypeError('autonomousInvestigate needs routeAsk');
  }
  if (db === null || db === undefined) {
    throw new TypeError('autonomousInvestigate needs db');
  }

  const result = investigateObjective({
    task: objective,
    db,
    compose,
    verify,
    routeAskFn: route,
    budgetTokens: 6000,
    maxFiles: 24,
    now,
  });

  const trail = result.sourceDetails.map((s) => ({
    ref: s.ref,
    path: s.path,
    lines: s.lines,
    reason: s.reason,
    sha256: s.sha256,
  }));

  // An empty bundle has nothing to verify and nothing to anchor: report the
  // failure rather than a vacuous pass.
  if (trail.length === 0) {
    return { objective: objective.trim(), trail: [], verdict: { valid: false, changed: [] }, route: result.route, anchored: false };
  }

  const verification = result.verification;
  const valid = verification && verification.valid === true;
  const changed = Array.isArray(verification?.changed) ? verification.changed : [];
  const anchored = trail.every((t) => Boolean(t.ref) && Boolean(t.path) && Boolean(t.sha256));

  return {
    objective: objective.trim(),
    trail,
    verdict: { valid, changed },
    route: result.route,
    anchored,
  };
}
