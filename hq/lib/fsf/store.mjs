// @ts-check
/**
 * @hq:context FSF feed store — an in-memory, versioned snapshot ring that publishes slice maps and
 *   serves replayable key-level deltas from a cursor, so a client can converge without a full pull.
 * @hq:owner hq
 * @hq:task fsf-store
 * @hq:invariant publish is the only writer: every snapshot it hands out is a deep copy, so a caller
 *   mutating a returned snapshot (or the input slices) can never reach stored history.
 * @hq:invariant version strictly increases by one per publish and is the delta cursor; generation
 *   tracks publishes for the life of the store and never resets, even after pruning.
 * @hq:invariant delta never guesses: a cursor outside retention is GAP (with the retained bounds), a
 *   cursor before any publish is NO_SNAPSHOT, and a non-integer or future cursor is BAD_VERSION.
 * @hq:invariant the key container is `data`, matching hq/lib/fsf/slices.mjs and the `changes` path of
 *   hq/lib/fsf/client.mjs applyDelta: a slice that owns `data` is canonical, anything else is a
 *   shorthand key map. Slice metadata (`tier`, `lastGoodAt`, ...) is preserved untouched.
 * @hq:invariant a delta carries key-level changes only. Metadata-only transitions (`degraded`,
 *   `lastGoodAt`) are visible in the snapshot, never in `changes`; a client that must see them reads
 *   the snapshot it is already obligated to re-read inside `refreshAfterMs`.
 * @hq:invariant pruning removes the oldest snapshot only, and never removes the newest, so the
 *   current snapshot is always resolvable even when history is 1.
 * @hq:why Deltas are recomputed from adjacent retained snapshots instead of stored per step: one
 *   representation of the truth, no chance of a delta log disagreeing with the snapshot it explains.
 * @hq:see hq/lib/fsf/slices.mjs · hq/lib/fsf/client.mjs
 */

/** Protocol tag carried by every snapshot. */
export const FSF_SCHEMA = 'fsf/1';

/** Refresh hint used when the producer does not supply one. */
export const FSF_DEFAULT_REFRESH_MS = 5000;

/** Snapshot retention used when the constructor does not supply one. */
export const FSF_DEFAULT_HISTORY = 100;

/** The slice field holding the key map. Shared vocabulary with slices.mjs and client.mjs. */
export const FSF_SLICE_DATA = 'data';

/**
 * @typedef {{ [key: string]: unknown }} KeyMap
 * @typedef {{ degraded: boolean, data: KeyMap, [key: string]: unknown }} SliceView
 * @typedef {{ [slice: string]: SliceView }} SliceMap
 * @typedef {{ slice: string, key: string, op: 'set' | 'unset', value: unknown }} Change
 * @typedef {{
 *   schema: string,
 *   generation: number,
 *   version: number,
 *   issuedAt: string,
 *   refreshAfterMs: number,
 *   degraded: boolean,
 *   slices: SliceMap,
 * }} Snapshot
 * @typedef {{ ok: true, from: number, to: number, changes: Change[] }} DeltaOk
 * @typedef {{ ok: false, code: 'GAP' | 'NO_SNAPSHOT' | 'BAD_VERSION', oldest: number | null, newest: number | null }} DeltaError
 * @typedef {DeltaOk | DeltaError} DeltaResult
 * @typedef {{ name: string, degraded: boolean, data: KeyMap, extra: KeyMap }} NormalizedSlice
 * @typedef {{ history?: number }} FeedStoreOptions
 * @typedef {{ slices?: unknown, now?: Date | number | string, refreshAfterMs?: number }} PublishInput
 */

/**
 * True only for an object literal (prototype `Object.prototype` or `null`): arrays, dates, maps and
 * class instances are not plain and are therefore treated as values, not as slice containers.
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** @param {unknown} value @returns {boolean} */
function isObjectLike(value) {
  return value !== null && typeof value === 'object';
}

/**
 * Deep copy of JSON-shaped data. `structuredClone` is used when the runtime has it so Dates and
 * typed arrays survive; the JSON path is the portable fallback for plain data.
 * @template T
 * @param {T} value
 * @returns {T}
 */
function deepCopy(value) {
  if (value === null || typeof value !== 'object') return value;
  const clone = /** @type {{ structuredClone?: (input: unknown) => unknown }} */ (globalThis).structuredClone;
  if (typeof clone === 'function') {
    try {
      return /** @type {T} */ (clone(value));
    } catch {
      // Not structured-cloneable: fall through to the JSON path.
    }
  }
  return /** @type {T} */ (JSON.parse(JSON.stringify(value)));
}

/**
 * Canonical, key-order-independent rendering of a value, used only for change detection so that two
 * structurally equal values never produce a spurious `set`.
 * @param {unknown} value
 * @returns {string}
 */
function canon(value) {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'number') return `number:${String(value)}`;
  if (type !== 'object') return `${type}:${String(value)}`;
  if (Array.isArray(value)) return `[${value.map((entry) => canon(entry)).join(',')}]`;
  const record = /** @type {KeyMap} */ (value);
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canon(record[key])}`).join(',')}}`;
}

/**
 * Copy an arbitrary record with keys in ascending order, so iteration and diff order are
 * deterministic. Values are deep-copied.
 * @param {KeyMap} record
 * @returns {KeyMap}
 */
function copyRecord(record) {
  /** @type {KeyMap} */
  const out = {};
  for (const key of Object.keys(record).sort()) out[key] = deepCopy(record[key]);
  return out;
}

/**
 * Normalize the accepted `slices` shapes into one canonical list.
 *
 * Accepted:
 * - `{ [name]: { data, degraded?, ...metadata } }` — canonical slice, the shape slices.mjs returns.
 * - `{ [name]: { [key]: value } }` — shorthand key map (no metadata, never degraded).
 * - `[{ name, data, degraded?, ...metadata }]` — array of canonical slice records.
 *
 * A slice is canonical when it owns a `data` property, even when that value is null (a source that
 * returned nothing). The shorthand therefore cannot express a key literally named `data`.
 *
 * @param {unknown} input
 * @returns {NormalizedSlice[]}
 */
function normalizeSlices(input) {
  /** @type {Array<[string, unknown]>} */
  let entries;
  if (Array.isArray(input)) {
    entries = input.map((record) => {
      if (!isPlainObject(record)) {
        throw new TypeError('fsf: a slice record must be a plain object');
      }
      const name = /** @type {KeyMap} */ (record).name;
      if (typeof name !== 'string' || name === '') {
        throw new TypeError('fsf: a slice record needs a non-empty string `name`');
      }
      return [name, record];
    });
  } else if (isPlainObject(input)) {
    entries = Object.entries(/** @type {Record<string, unknown>} */ (input));
  } else {
    throw new TypeError('fsf: `slices` must be an object map or an array of slice records');
  }

  /** @type {NormalizedSlice[]} */
  const out = [];
  /** @type {Set<string>} */
  const seen = new Set();
  for (const [name, raw] of entries) {
    if (typeof name !== 'string' || name === '') {
      throw new TypeError('fsf: a slice name must be a non-empty string');
    }
    if (seen.has(name)) throw new TypeError(`fsf: duplicate slice "${name}"`);
    seen.add(name);
    if (!isPlainObject(raw)) {
      throw new TypeError(`fsf: slice "${name}" must be a plain object`);
    }

    const record = /** @type {KeyMap} */ (raw);
    const canonical = Object.prototype.hasOwnProperty.call(record, FSF_SLICE_DATA);
    /** @type {KeyMap} */
    let data;
    /** @type {KeyMap} */
    const extra = {};
    if (canonical) {
      const rawData = record[FSF_SLICE_DATA];
      if (rawData !== null && !isPlainObject(rawData)) {
        throw new TypeError(`fsf: slice "${name}" has non-object \`data\``);
      }
      data = copyRecord(/** @type {KeyMap} */ (rawData ?? {}));
      for (const key of Object.keys(record)) {
        if (key === FSF_SLICE_DATA || key === 'degraded' || key === 'name') continue;
        extra[key] = deepCopy(record[key]);
      }
    } else {
      data = copyRecord(record);
    }

    out.push({
      name,
      degraded: canonical && record.degraded === true,
      data,
      extra,
    });
  }
  return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * Turn the injected clock into an ISO-8601 string. Injection is mandatory: a store that reads the
 * wall clock itself cannot be replayed or asserted on.
 * @param {Date | number | string | undefined} now
 * @returns {string}
 */
function toIsoTimestamp(now) {
  if (now === undefined || now === null) {
    throw new TypeError('fsf: publish requires an injected `now`');
  }
  /** @type {Date} */
  let date;
  if (now instanceof Date) date = now;
  else if (typeof now === 'number' || typeof now === 'string') date = new Date(now);
  else throw new TypeError('fsf: `now` must be a Date, epoch milliseconds, or an ISO string');
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('fsf: `now` is not a valid timestamp');
  }
  return date.toISOString();
}

/**
 * Build a snapshot from normalized slices and the store's counters.
 * @param {NormalizedSlice[]} normalized
 * @param {{ generation: number, version: number, issuedAt: string, refreshAfterMs: number }} meta
 * @returns {Snapshot}
 */
function buildSnapshot(normalized, meta) {
  /** @type {SliceMap} */
  const slices = {};
  for (const slice of normalized) {
    slices[slice.name] = { degraded: slice.degraded, ...copyRecord(slice.extra), data: slice.data };
  }
  return {
    schema: FSF_SCHEMA,
    generation: meta.generation,
    version: meta.version,
    issuedAt: meta.issuedAt,
    refreshAfterMs: meta.refreshAfterMs,
    degraded: normalized.some((slice) => slice.degraded),
    slices,
  };
}

/**
 * Diff two retained snapshots into one change per changed key per slice, ordered by slice then key.
 * Slice metadata is intentionally not diffed.
 * @param {Snapshot | null} prev previous snapshot, or null for the first ever publish
 * @param {Snapshot} next
 * @returns {Change[]}
 */
function diffSlices(prev, next) {
  /** @type {Change[]} */
  const changes = [];
  const prevSlices = prev ? prev.slices : {};
  const names = Array.from(new Set([...Object.keys(prevSlices), ...Object.keys(next.slices)])).sort();
  for (const name of names) {
    const before = prevSlices[name];
    const after = next.slices[name];
    const beforeData = before && isObjectLike(before.data) ? before.data : {};
    const afterData = after && isObjectLike(after.data) ? after.data : {};
    const keys = Array.from(new Set([...Object.keys(beforeData), ...Object.keys(afterData)])).sort();
    for (const key of keys) {
      const hadBefore = Object.prototype.hasOwnProperty.call(beforeData, key);
      const hasAfter = Object.prototype.hasOwnProperty.call(afterData, key);
      if (!hasAfter) {
        if (hadBefore) changes.push({ slice: name, key, op: 'unset', value: null });
        continue;
      }
      if (!hadBefore || canon(beforeData[key]) !== canon(afterData[key])) {
        changes.push({ slice: name, key, op: 'set', value: deepCopy(afterData[key]) });
      }
    }
  }
  return changes;
}

/**
 * A bounded, versioned store of feed snapshots with a replayable delta cursor.
 */
export class FeedStore {
  /**
   * @param {FeedStoreOptions} [options]
   */
  constructor({ history = FSF_DEFAULT_HISTORY } = {}) {
    if (typeof history !== 'number' || !Number.isInteger(history) || history < 1) {
      throw new RangeError('fsf: `history` must be a positive integer');
    }
    /** Maximum retained snapshots; always at least 1. @type {number} */
    this._history = history;
    /** Retained snapshots, oldest first, newest last. @type {Snapshot[]} */
    this._snapshots = [];
    /** @type {number} */
    this._generation = 0;
    /** @type {number} */
    this._version = 0;
  }

  /** Retained snapshot capacity. */
  get history() {
    return this._history;
  }

  /** Version of the newest retained snapshot, or 0 before the first publish. */
  get version() {
    return this._version;
  }

  /**
   * Newest retained snapshot, or null before the first publish.
   * @returns {Snapshot | null}
   */
  _newest() {
    return this._snapshots.length > 0 ? this._snapshots[this._snapshots.length - 1] : null;
  }

  /**
   * Publish a new snapshot, pruning the oldest when retention is exceeded.
   * A rejected publish consumes no version.
   * @param {PublishInput} [input]
   * @returns {Snapshot}
   */
  publish({ slices, now, refreshAfterMs = FSF_DEFAULT_REFRESH_MS } = {}) {
    if (slices === undefined) {
      throw new TypeError('fsf: publish requires `slices`');
    }
    if (typeof refreshAfterMs !== 'number' || !Number.isFinite(refreshAfterMs) || refreshAfterMs < 0) {
      throw new TypeError('fsf: `refreshAfterMs` must be a finite, non-negative number');
    }
    const issuedAt = toIsoTimestamp(now);
    const normalized = normalizeSlices(slices);

    const next = buildSnapshot(normalized, {
      generation: this._generation + 1,
      version: this._version + 1,
      issuedAt,
      refreshAfterMs,
    });

    this._generation = next.generation;
    this._version = next.version;
    this._snapshots.push(next);
    while (this._snapshots.length > this._history) this._snapshots.shift();

    return deepCopy(next);
  }

  /**
   * The current snapshot as a deep copy, or null before the first publish.
   * @returns {Snapshot | null}
   */
  snapshot() {
    const newest = this._newest();
    return newest ? deepCopy(newest) : null;
  }

  /**
   * Changes needed to move a client from `sinceVersion` to the newest snapshot.
   * @param {number} sinceVersion cursor previously observed from `snapshot().version`
   * @returns {DeltaResult}
   */
  delta(sinceVersion) {
    const newest = this._newest();
    if (!newest) {
      return { ok: false, code: 'NO_SNAPSHOT', oldest: null, newest: null };
    }
    const oldest = this._snapshots[0];
    if (typeof sinceVersion !== 'number' || !Number.isInteger(sinceVersion)) {
      return { ok: false, code: 'BAD_VERSION', oldest: oldest.version, newest: newest.version };
    }
    if (sinceVersion > newest.version) {
      return { ok: false, code: 'BAD_VERSION', oldest: oldest.version, newest: newest.version };
    }
    if (sinceVersion < oldest.version) {
      return { ok: false, code: 'GAP', oldest: oldest.version, newest: newest.version };
    }
    if (sinceVersion === newest.version) {
      return { ok: true, from: sinceVersion, to: newest.version, changes: [] };
    }

    /** @type {Change[]} */
    const changes = [];
    for (let index = 1; index < this._snapshots.length; index += 1) {
      const next = this._snapshots[index];
      if (next.version <= sinceVersion) continue;
      const prev = this._snapshots[index - 1];
      for (const change of diffSlices(prev, next)) changes.push(change);
    }
    return { ok: true, from: sinceVersion, to: newest.version, changes };
  }
}

export default FeedStore;
