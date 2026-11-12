// @ts-check
/**
 * @hq:context The seven FSF read slices — identity, capacity, work, locks, health, policy, time — each collected behind its own guard and degraded in isolation.
 * @hq:owner hq-agent
 * @hq:task FSF-SLICES
 *
 * @hq:why A single dead feed must never blank the whole view. Every slice is
 * collected inside its own try/catch, so losing the seat feed costs exactly the
 * identity slice and nothing else.
 * @hq:invariant collectSlices never throws and always yields all seven SLICES keys.
 * @hq:invariant A degraded slice is exactly `{ tier, data: { error }, degraded: true, lastGoodAt: null }`.
 * @hq:invariant The source vocabulary is exactly seats, sessions, receipts, bus, actions.
 *   `health` and `time` are derived from the result set and the injected clock,
 *   never fed by a source, so they cannot be degraded by a source failure.
 * @hq:invariant Time is injected by the caller. The wall clock is never read here,
 * so a bundle built from the same `now` is byte-identical.
 */

/**
 * @typedef {'identity' | 'capacity' | 'work' | 'locks' | 'health' | 'policy' | 'time'} SliceName
 * @typedef {'cold' | 'warm' | 'hot'} Tier
 *
 * @typedef {object} Slice
 * @property {Tier} tier
 * @property {unknown} data
 * @property {boolean} degraded
 * @property {string | null} lastGoodAt
 *
 * @typedef {object} SliceSourceContext
 * @property {string | null} now ISO-8601 issued time, or null when the caller injected none.
 * @property {number | null} epoch Milliseconds since the epoch, or null when uninjected.
 * @property {SliceName} slice The slice this source feeds.
 * @property {string} name The key this source was bound to.
 *
 * @typedef {(context: SliceSourceContext) => unknown} SliceSource
 *
 * @typedef {object} Clock
 * @property {string | null} issuedAt
 * @property {number | null} epoch
 * @property {'injected' | 'unspecified' | 'invalid'} clock
 *
 * @typedef {object} CollectSlicesInput
 * @property {Date | number | string | null} [now]
 * @property {Partial<Record<'seats' | 'sessions' | 'receipts' | 'bus' | 'actions', SliceSource | null | undefined>>} [sources]
 */

/**
 * All seven slices, in presentation order. Every collection returns every key.
 * @type {SliceName[]}
 */
export const SLICES = ['identity', 'capacity', 'work', 'locks', 'health', 'policy', 'time'];

/**
 * Static cost tier per slice. Hot slices are read on every turn; cold slices are
 * resolved once and cached by the caller.
 * @type {Record<SliceName, Tier>}
 */
export const TIERS = {
  identity: 'cold',
  capacity: 'warm',
  work: 'hot',
  locks: 'hot',
  health: 'warm',
  policy: 'cold',
  time: 'hot',
};

/**
 * Source key -> the one slice it feeds. Five sources, five slices, so a source
 * failure has exactly one blast radius.
 * @type {ReadonlyArray<readonly [string, SliceName]>}
 */
export const SOURCE_BINDINGS = [
  ['seats', 'identity'], // who holds a seat
  ['sessions', 'capacity'], // how much is live and how loaded
  ['actions', 'work'], // what work is available and wired
  ['receipts', 'locks'], // evidence that work is claimed and joined
  ['bus', 'policy'], // standing rules carried on the coordination bus
];

/**
 * Collect all seven slices.
 *
 * Synchronous sources are answered synchronously with a plain record. When a
 * source returns a promise the same record is returned as a promise, so an async
 * feed (the action catalog) is awaited rather than stored as a pending value.
 *
 * @param {CollectSlicesInput} [input]
 * @returns {Record<SliceName, Slice> | Promise<Record<SliceName, Slice>>}
 */
export function collectSlices(input = {}) {
  try {
    const bag = /** @type {Record<string, unknown>} */ (
      input && typeof input === 'object' ? input : {}
    );

    /** @type {unknown} */
    let nowValue;
    /** @type {unknown} */
    let rawSources;
    try {
      nowValue = bag.now;
      rawSources = bag.sources;
    } catch {
      nowValue = undefined;
      rawSources = undefined;
    }

    const clock = normalizeNow(nowValue);

    /** @type {Array<Slice | Promise<Slice>>} */
    const readings = [];
    let async = false;
    for (const [sourceName, slice] of SOURCE_BINDINGS) {
      const reading = readSource(sourceName, slice, rawSources, clock);
      if (isThenable(reading)) async = true;
      readings.push(reading);
    }

    if (async) {
      return Promise.all(readings.map((reading) => Promise.resolve(reading)))
        .then((settled) => assemble(settled, clock))
        .catch((error) => allDegraded(`slice collection failed: ${errorMessage(error)}`));
    }

    return assemble(/** @type {Slice[]} */ (readings), clock);
  } catch (error) {
    // Unreachable by construction, but the contract is "never throw".
    return allDegraded(`slice collection failed: ${errorMessage(error)}`);
  }
}

/**
 * Read one source into one slice. Missing, non-callable and throwing sources all
 * degrade that slice only. An async source is awaited and its rejection degrades
 * that same slice.
 *
 * @param {string} sourceName
 * @param {SliceName} slice
 * @param {unknown} rawSources
 * @param {Clock} clock
 * @returns {Slice | Promise<Slice>}
 */
function readSource(sourceName, slice, rawSources, clock) {
  const tier = TIERS[slice];
  try {
    if (!rawSources || typeof rawSources !== 'object') {
      return degrade(tier, `source "${sourceName}" missing`);
    }
    const bag = /** @type {Record<string, unknown>} */ (rawSources);
    const candidate = bag[sourceName];
    if (candidate === undefined || candidate === null) {
      return degrade(tier, `source "${sourceName}" missing`);
    }
    if (typeof candidate !== 'function') {
      return degrade(tier, `source "${sourceName}" is not a function`);
    }
    const data = /** @type {SliceSource} */ (candidate)({
      now: clock.issuedAt,
      epoch: clock.epoch,
      slice,
      name: sourceName,
    });
    if (isThenable(data)) {
      return Promise.resolve(data).then(
        (value) => settle(tier, value, clock),
        (error) => degrade(tier, errorMessage(error)),
      );
    }
    return settle(tier, data, clock);
  } catch (error) {
    return degrade(tier, errorMessage(error));
  }
}

/**
 * Assemble the seven-key record from the five source-backed slices.
 *
 * @param {Slice[]} sourceSlices In SOURCE_BINDINGS order.
 * @param {Clock} clock
 * @returns {Record<SliceName, Slice>}
 */
function assemble(sourceSlices, clock) {
  /** @type {Map<SliceName, Slice>} */
  const collected = new Map();
  /** @type {SliceName[]} */
  const degradedSlices = [];

  SOURCE_BINDINGS.forEach(([, slice], index) => {
    const entry = sourceSlices[index] ?? degrade(TIERS[slice], `slice "${slice}" was not collected`);
    collected.set(slice, entry);
    if (entry.degraded) degradedSlices.push(slice);
  });

  collected.set('health', {
    tier: TIERS.health,
    data: {
      status: degradedSlices.length === 0 ? 'ok' : 'degraded',
      degraded: degradedSlices,
      healthy: SLICES.length - degradedSlices.length,
    },
    degraded: false,
    lastGoodAt: clock.issuedAt,
  });

  collected.set('time', {
    tier: TIERS.time,
    data: { issuedAt: clock.issuedAt, clock: clock.clock },
    degraded: false,
    lastGoodAt: clock.issuedAt,
  });

  /** @type {Record<SliceName, Slice>} */
  const out = /** @type {Record<SliceName, Slice>} */ ({});
  for (const name of SLICES) {
    out[name] = collected.get(name) ?? degrade(TIERS[name], `slice "${name}" was not collected`);
  }
  return out;
}

/**
 * @param {Tier} tier
 * @param {unknown} value
 * @param {Clock} clock
 * @returns {Slice}
 */
function settle(tier, value, clock) {
  return {
    tier,
    data: value === undefined ? null : value,
    degraded: false,
    lastGoodAt: clock.issuedAt,
  };
}

/**
 * @param {Tier} tier
 * @param {string} message
 * @returns {Slice}
 */
function degrade(tier, message) {
  return { tier, data: { error: message }, degraded: true, lastGoodAt: null };
}

/**
 * Last-resort result: all seven slices present, all five source-backed slices
 * degraded, health and time still coherent.
 *
 * @param {string} reason
 * @returns {Record<SliceName, Slice>}
 */
function allDegraded(reason) {
  const degradedSlices = SOURCE_BINDINGS.map(([, slice]) => slice);

  /** @type {Record<SliceName, Slice>} */
  const out = /** @type {Record<SliceName, Slice>} */ ({});
  for (const name of SLICES) {
    if (name === 'health') {
      out[name] = {
        tier: TIERS.health,
        data: { status: 'degraded', degraded: degradedSlices.slice(), healthy: 2 },
        degraded: false,
        lastGoodAt: null,
      };
    } else if (name === 'time') {
      out[name] = {
        tier: TIERS.time,
        data: { issuedAt: null, clock: 'invalid' },
        degraded: false,
        lastGoodAt: null,
      };
    } else {
      out[name] = degrade(TIERS[name], reason);
    }
  }
  return out;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isThenable(value) {
  try {
    return (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function') &&
      typeof (/** @type {{ then?: unknown }} */ (value).then) === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Normalize an injected clock value. Never reads the wall clock: an absent `now`
 * stays absent, so output is a pure function of input.
 *
 * @param {unknown} value
 * @returns {Clock}
 */
function normalizeNow(value) {
  try {
    if (value === undefined || value === null) {
      return { issuedAt: null, epoch: null, clock: 'unspecified' };
    }
    if (value instanceof Date) {
      const ms = value.getTime();
      if (!Number.isFinite(ms)) return { issuedAt: null, epoch: null, clock: 'invalid' };
      return { issuedAt: value.toISOString(), epoch: ms, clock: 'injected' };
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return { issuedAt: null, epoch: null, clock: 'invalid' };
      return { issuedAt: new Date(value).toISOString(), epoch: value, clock: 'injected' };
    }
    if (typeof value === 'string') {
      const ms = Date.parse(value);
      if (!Number.isFinite(ms)) return { issuedAt: null, epoch: null, clock: 'invalid' };
      return { issuedAt: new Date(ms).toISOString(), epoch: ms, clock: 'injected' };
    }
  } catch {
    // Fall through to the invalid clock.
  }
  return { issuedAt: null, epoch: null, clock: 'invalid' };
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function errorMessage(error) {
  try {
    if (error && typeof error === 'object') {
      const message = /** @type {{ message?: unknown }} */ (error).message;
      if (typeof message === 'string' && message.length > 0) return message;
    }
    if (typeof error === 'string' && error.length > 0) return error;
    const text = String(error);
    return text.length > 0 ? text : 'unknown source failure';
  } catch {
    return 'unknown source failure';
  }
}
