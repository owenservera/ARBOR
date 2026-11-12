// @ts-check
/**
 * @hq:context Seat heartbeat — classify seat liveness from how old the last observation is against the turn and idle windows,
 *   and join that liveness to the resources a seat consumed to name the background consumers that produced no result
 * @hq:owner hq-agent
 * @hq:task seat-heartbeat
 * @hq:invariant the clock is injected as `now`; no branch in the classification reads the wall clock
 * @hq:invariant a missing or unparseable timestamp is `unknown`, never `idle`: evidence is not inference
 * @hq:invariant the heartbeat ledger is append-only; `record()` never rewrites a line
 * @hq:invariant a busy seat is not judged: a running turn may still deliver, so no verdict is drawn about its result
 * @hq:see hq/lib/channel-seats.mjs
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { nowISO } from './util.mjs';

export const HEARTBEAT_SCHEMA = 'hq.seat-heartbeat/1';

/** The schema of a background-consumer report (AII scenario HQ-091). */
export const CONSUMER_SCHEMA = 'hq.seat-consumers/1';

/** The whole vocabulary. A state outside this list is refused by `record()`. */
export const STATES = /** @type {const} */ (['busy', 'idle', 'stale', 'unknown']);

/** The set is widened to string so a caller-supplied state can be refused at runtime, not only by the compiler. */
/** @type {Set<string>} */
const STATE_SET = new Set(STATES);

/**
 * Default windows. A turn is treated as plausibly still running for two
 * minutes; a seat with no observation for fifteen minutes is stale. Both are
 * policy, so callers override them rather than rediscover them.
 */
export const DEFAULT_TURN_MS = 2 * 60_000;
export const DEFAULT_IDLE_MS = 15 * 60_000;

/**
 * Read any timestamp shape we accept (ISO string, epoch ms, Date) as epoch ms.
 * Returns null for anything we cannot read — the caller turns that into
 * `unknown` instead of guessing an age.
 *
 * @param {any} value
 * @returns {number|null}
 */
function toMs(value) {
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const t = Date.parse(text);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/**
 * A window is a duration, so zero is legal (it disables that window) and a
 * negative or unreadable value falls back rather than inverting the test.
 *
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function windowMs(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Classify one seat.
 *
 * `busy` outranks the other states on purpose: a turn that is still inside its
 * window is plausibly running even when the idle window is the shorter one, so
 * the test is tried first and the result is read as "do not conclude anything".
 *
 * @param {{
 *   now?: any,
 *   lastSeenAt?: any,
 *   lastTurnMs?: number|string|null,
 *   idleMs?: number|string|null,
 * }} [opts]
 * @returns {{
 *   state: 'busy'|'idle'|'stale'|'unknown',
 *   ageMs: number|null,
 *   at: string|null,
 *   lastTurnMs: number,
 *   idleMs: number,
 *   detail: string,
 * }}
 */
export function heartbeat({
  now = nowISO(),
  lastSeenAt,
  lastTurnMs = DEFAULT_TURN_MS,
  idleMs = DEFAULT_IDLE_MS,
} = {}) {
  const turnMs = windowMs(lastTurnMs, DEFAULT_TURN_MS);
  const quietMs = windowMs(idleMs, DEFAULT_IDLE_MS);
  const windows = { lastTurnMs: turnMs, idleMs: quietMs };
  const seenMs = toMs(lastSeenAt);

  if (seenMs === null) {
    return {
      state: 'unknown',
      ageMs: null,
      at: null,
      ...windows,
      detail: lastSeenAt === undefined || lastSeenAt === null
        ? 'no last observation for this seat'
        : `last observation "${String(lastSeenAt)}" is not a timestamp we can read`,
    };
  }

  const at = new Date(seenMs).toISOString();
  const nowMs = toMs(now);
  if (nowMs === null) {
    return {
      state: 'unknown',
      ageMs: null,
      at,
      ...windows,
      detail: `the injected clock "${String(now)}" is not a timestamp we can read`,
    };
  }

  // A timestamp ahead of the clock is clock skew, not negative elapsed time.
  const ageMs = Math.max(0, nowMs - seenMs);

  if (ageMs < turnMs) {
    return {
      state: 'busy',
      ageMs,
      at,
      ...windows,
      detail: `${ageMs}ms since the last observation, inside the ${turnMs}ms turn window`,
    };
  }
  if (ageMs >= quietMs) {
    return {
      state: 'stale',
      ageMs,
      at,
      ...windows,
      detail: `quiet for ${ageMs}ms, past the ${quietMs}ms idle window`,
    };
  }
  return {
    state: 'idle',
    ageMs,
    at,
    ...windows,
    detail: `quiet for ${ageMs}ms, past the ${turnMs}ms turn window and inside the ${quietMs}ms idle window`,
  };
}

/**
 * Classify a roster in one pass and count the states.
 *
 * Newest first: a seat whose observation cannot be read has no place on the
 * timeline, so it sorts last rather than pretending to be the oldest.
 *
 * @param {{
 *   seats?: Array<any>,
 *   now?: any,
 *   thresholds?: {lastTurnMs?: number|string|null, idleMs?: number|string|null},
 * }} [opts]
 * @returns {{
 *   schema: string,
 *   now: string|null,
 *   counts: {busy: number, idle: number, stale: number, unknown: number, total: number},
 *   seats: Array<{seat: string, state: string, ageMs: number|null, at: string|null, detail: string}>,
 * }}
 */
export function summarize({ seats = [], now = nowISO(), thresholds = {} } = {}) {
  const turnMs = windowMs(thresholds?.lastTurnMs, DEFAULT_TURN_MS);
  const quietMs = windowMs(thresholds?.idleMs, DEFAULT_IDLE_MS);

  const rows = (Array.isArray(seats) ? seats : []).map((seat, index) => {
    const result = heartbeat({
      now,
      lastSeenAt: seat?.lastSeenAt,
      lastTurnMs: windowMs(seat?.lastTurnMs, turnMs),
      idleMs: windowMs(seat?.idleMs, quietMs),
    });
    return {
      seat: seatId(seat),
      state: result.state,
      ageMs: result.ageMs,
      at: result.at,
      detail: result.detail,
      seenMs: toMs(seat?.lastSeenAt),
      index,
    };
  });

  rows.sort((a, b) => {
    if (a.seenMs === null && b.seenMs === null) return a.index - b.index;
    if (a.seenMs === null) return 1;
    if (b.seenMs === null) return -1;
    if (b.seenMs !== a.seenMs) return b.seenMs - a.seenMs;
    return a.index - b.index;
  });

  /** @type {Record<string, number>} */
  const counts = { busy: 0, idle: 0, stale: 0, unknown: 0, total: rows.length };
  for (const row of rows) counts[row.state] += 1;

  const nowMs = toMs(now);
  return {
    schema: HEARTBEAT_SCHEMA,
    now: nowMs === null ? null : new Date(nowMs).toISOString(),
    counts: /** @type {{busy: number, idle: number, stale: number, unknown: number, total: number}} */ (counts),
    seats: rows.map(({ seenMs, index, ...row }) => row),
  };
}

function seatId(seat) {
  const id = String(seat?.id ?? seat?.seat ?? seat?.name ?? '').trim();
  return id || '(unnamed)';
}

// --- background consumers (HQ-091) -------------------------------------------

/** The whole vocabulary of a consumer verdict. */
export const CONSUMER_VERDICTS = /** @type {const} */ ([
  'working',
  'consumer-without-result',
  'delivered',
  'idle',
  'unknown',
]);

/**
 * The resources a seat is recorded as having consumed. Consumption is what a
 * seat took (tokens, CPU time, money); it is not the same thing as the seat
 * having produced anything.
 *
 * @param {any} seat
 * @returns {{tokens: number, cpuMs: number, cost: number, consumed: boolean}}
 */
function consumptionOf(seat) {
  const tokens = Number(seat?.tokens ?? 0);
  const cpuMs = Number(seat?.cpuMs ?? 0);
  const cost = Number(seat?.cost ?? 0);
  const safe = (n) => (Number.isFinite(n) && n > 0 ? n : 0);
  const t = safe(tokens);
  const c = safe(cpuMs);
  const m = safe(cost);
  return { tokens: t, cpuMs: c, cost: m, consumed: t > 0 || c > 0 || m > 0 };
}

/**
 * backgroundConsumers — which seats consume resources without delivering a
 * useful result (AII scenario HQ-091).
 *
 * A seat on its own says only whether it is alive. This function joins that
 * liveness to what the seat consumed and what it delivered, so the answer
 * names the background consumers that took resources and produced nothing:
 *
 *   - `working`        — busy: a turn is plausibly still running, so nothing
 *                        is concluded about its result;
 *   - `unknown`        — the observation could not be read: evidence is not
 *                        inference, so no verdict is drawn (the same rule the
 *                        heartbeat classification already follows);
 *   - `delivered`      — idle or stale, but it did deliver results;
 *   - `consumer-without-result` — idle or stale, it consumed resources and
 *                        delivered no result: a background consumer whose cost
 *                        bought nothing;
 *   - `idle`           — idle or stale and it consumed nothing either.
 *
 * Pure and deterministic: the clock is injected, the roster and its resource
 * figures are passed in, and nothing is read or written.
 *
 * @param {{
 *   seats?: Array<any>,
 *   now?: any,
 *   thresholds?: {lastTurnMs?: number|string|null, idleMs?: number|string|null},
 * }} [opts]
 * @returns {{
 *   schema: string,
 *   now: string|null,
 *   counts: Record<string, number>,
 *   consumers: Array<object>,
 *   consumersWithoutResult: string[],
 * }}
 */
export function backgroundConsumers({ seats = [], now = nowISO(), thresholds = {} } = {}) {
  const turnMs = windowMs(thresholds?.lastTurnMs, DEFAULT_TURN_MS);
  const quietMs = windowMs(thresholds?.idleMs, DEFAULT_IDLE_MS);

  const rows = (Array.isArray(seats) ? seats : []).map((seat) => {
    const beat = heartbeat({
      now,
      lastSeenAt: seat?.lastSeenAt,
      lastTurnMs: windowMs(seat?.lastTurnMs, turnMs),
      idleMs: windowMs(seat?.idleMs, quietMs),
    });
    const consumption = consumptionOf(seat);
    const delivered = Number(seat?.results ?? seat?.delivered ?? 0);
    const results = Number.isFinite(delivered) && delivered > 0 ? delivered : 0;

    /** @type {'working'|'consumer-without-result'|'delivered'|'idle'|'unknown'} */
    let verdict;
    if (beat.state === 'busy') verdict = 'working';
    else if (beat.state === 'unknown') verdict = 'unknown';
    else if (results > 0) verdict = 'delivered';
    else if (consumption.consumed) verdict = 'consumer-without-result';
    else verdict = 'idle';

    return {
      seat: seatId(seat),
      state: beat.state,
      ageMs: beat.ageMs,
      at: beat.at,
      results,
      tokens: consumption.tokens,
      cpuMs: consumption.cpuMs,
      cost: consumption.cost,
      consumed: consumption.consumed,
      verdict,
      detail: beat.detail,
    };
  });

  rows.sort((a, b) => (a.seat < b.seat ? -1 : a.seat > b.seat ? 1 : 0));

  /** @type {Record<string, number>} */
  const counts = { total: rows.length, working: 0, 'consumer-without-result': 0, delivered: 0, idle: 0, unknown: 0 };
  for (const row of rows) counts[row.verdict] += 1;

  const nowMs = toMs(now);
  return {
    schema: CONSUMER_SCHEMA,
    now: nowMs === null ? null : new Date(nowMs).toISOString(),
    counts,
    consumers: rows,
    consumersWithoutResult: rows.filter((r) => r.verdict === 'consumer-without-result').map((r) => r.seat),
  };
}

/**
 * Append one heartbeat. The ledger only grows: the line is appended, never
 * rewritten, so a lost observation is visible as a gap rather than a changed
 * history.
 *
 * @param {{
 *   file?: string,
 *   seat?: string,
 *   at?: any,
 *   state?: string,
 *   ageMs?: number|null,
 * }} opts
 * @returns {{schema: string, at: string, seat: string, state: string, ageMs?: number, file: string}}
 */
export function record({ file, seat, at = nowISO(), state, ageMs = null } = {}) {
  if (!file) throw new Error('record needs a file path for the heartbeat ledger');
  const id = String(seat ?? '').trim();
  if (!id) throw new Error('record needs the seat the heartbeat belongs to');
  if (!STATE_SET.has(state)) {
    throw new Error(`heartbeat state "${String(state)}" is not one of ${STATES.join(', ')}`);
  }
  const atMs = toMs(at);
  if (atMs === null) throw new Error(`record needs a readable "at" timestamp, got "${String(at)}"`);

  /** @type {{schema: string, at: string, seat: string, state: string, ageMs?: number}} */
  const line = { schema: HEARTBEAT_SCHEMA, at: new Date(atMs).toISOString(), seat: id, state };
  if (typeof ageMs === 'number' && Number.isFinite(ageMs)) line.ageMs = ageMs;

  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(line)}\n`);
  return { ...line, file };
}

/**
 * Read the ledger back, newest first. A line that does not parse is skipped: a
 * corrupt line is not a heartbeat we can read. Omitting `seat` returns every
 * seat's lines.
 *
 * @param {{file?: string, seat?: string|null}} [opts]
 * @returns {Array<{schema?: string, at?: string, seat?: string, state?: string, ageMs?: number}>}
 */
export function history({ file, seat = null } = {}) {
  if (!file) throw new Error('history needs a file path for the heartbeat ledger');
  if (!existsSync(file)) return [];
  const want = seat === null || seat === undefined || seat === '' ? null : String(seat).trim().toLowerCase();

  const rows = [];
  let index = 0;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const text = raw.trim();
    if (!text) continue;
    let doc;
    try {
      doc = JSON.parse(text);
    } catch {
      index += 1;
      continue;
    }
    index += 1;
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) continue;
    if (want !== null && String(doc.seat ?? '').trim().toLowerCase() !== want) continue;
    rows.push({ doc, atMs: toMs(doc.at), index });
  }

  rows.sort((a, b) => {
    if (a.atMs === null && b.atMs === null) return b.index - a.index;
    if (a.atMs === null) return 1;
    if (b.atMs === null) return -1;
    if (b.atMs !== a.atMs) return b.atMs - a.atMs;
    // Equal timestamps: the later append is the newer observation.
    return b.index - a.index;
  });

  return rows.map((row) => row.doc);
}
