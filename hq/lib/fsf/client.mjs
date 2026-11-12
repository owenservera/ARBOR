// @ts-check
/**
 * @hq:context FSF snapshot freshness — decide from the values alone whether a cached snapshot is current, how long remains before it must be refreshed, how a delta resolves, and how one HTTP read maps to a result.
 * @hq:owner hq-agent
 * @hq:task fsf-client
 * @hq:invariant read-only: this module performs no I/O unless a fetchImpl is injected, never mutates a snapshot or a delta, and never emits a token into a result
 * @hq:invariant a future issuedAt is clock skew, not freshness: skew beyond refreshAfterMs is stale, never current
 * @hq:invariant applyDelta advances only along the exact edge delta.from === snapshot.version; anything else is MISMATCH, and a GAP signal stays GAP
 * @hq:why the freshness verdict must be computable without I/O, so a caller can cache, replay and test a snapshot without a provider
 * @hq:see hq/lib/lane-health.mjs · doc:docs/NORTH-STARS.md
 */

/**
 * A snapshot is any object carrying `version`, `issuedAt` and `refreshAfterMs`
 * plus whatever payload the caller wants to cache. Extra keys are preserved.
 *
 * @typedef {{ version?: any, issuedAt?: any, refreshAfterMs?: any, [key: string]: any }} Snapshot
 */

/**
 * @typedef {{ ok: true, snapshot: Snapshot } | { ok: false, code: string }} ApplyResult
 * @typedef {{ ok: true, snapshot: Snapshot } | { ok: false, code: string, status: number }} ReadResult
 * @typedef {{ token?: string, fetchImpl?: (url: string, init?: any) => Promise<any> }} ReadOptions
 */

/**
 * Normalise a clock reading to epoch milliseconds.
 * Accepts a finite number (already epoch ms), a Date, or an ISO-8601 string.
 * Everything else — including a missing value — is "no reading".
 *
 * @param {number|string|Date|null|undefined} value
 * @returns {number|null}
 */
export function toEpochMs(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

/**
 * The freshness window in milliseconds, or null when the snapshot does not
 * declare a usable one. A window of zero or less can never be current: it is a
 * statement that the value must be refreshed on every read, not a lifetime.
 *
 * @param {any} value
 * @returns {number|null}
 */
function windowMs(value) {
  const n = typeof value === 'number' ? value : (typeof value === 'string' ? Number(value) : NaN);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {number|string|Date|null|undefined} [now]
 * @returns {number|null}
 */
function clockMs(now) {
  if (now === undefined || now === null) return Date.now();
  return toEpochMs(now);
}

/**
 * @param {any} snapshot
 * @returns {boolean}
 */
function hasVersion(snapshot) {
  return snapshot.version !== undefined && snapshot.version !== null && snapshot.version !== '';
}

/**
 * Is this cached snapshot still inside its freshness window at `now`?
 *
 * False for: no snapshot, a missing/unparseable `issuedAt`, a missing `version`,
 * and `refreshAfterMs <= 0`.
 *
 * A future `issuedAt` is clock skew, not freshness. Tolerance is the window
 * itself: skew up to `refreshAfterMs` leaves the snapshot current, skew beyond
 * it does not — an absurd future timestamp cannot make a snapshot immortal.
 *
 * @param {Snapshot|null|undefined} snapshot
 * @param {number|string|Date|null} [now]
 * @returns {boolean}
 */
export function isCurrent(snapshot, now) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (!hasVersion(snapshot)) return false;
  const issuedAt = toEpochMs(snapshot.issuedAt);
  if (issuedAt === null) return false;
  const window = windowMs(snapshot.refreshAfterMs);
  if (window === null) return false;
  const at = clockMs(now);
  if (at === null) return false;

  const age = at - issuedAt;
  if (age > window) return false;          // aged out
  if (-age > window) return false;         // skew beyond the tolerated window
  return true;
}

/**
 * Milliseconds until the snapshot must be refreshed. Never negative: an expired
 * or unusable snapshot reports 0, which reads as "refresh now".
 *
 * A tolerated future `issuedAt` reports the full window, because the window has
 * not started yet; a skew beyond the window reports 0, matching `isCurrent`.
 *
 * @param {Snapshot|null|undefined} snapshot
 * @param {number|string|Date|null} [now]
 * @returns {number}
 */
export function nextRefreshMs(snapshot, now) {
  if (!snapshot || typeof snapshot !== 'object') return 0;
  const issuedAt = toEpochMs(snapshot.issuedAt);
  if (issuedAt === null) return 0;
  const window = windowMs(snapshot.refreshAfterMs);
  if (window === null) return 0;
  const at = clockMs(now);
  if (at === null) return 0;

  const age = at - issuedAt;
  if (age < 0) return -age > window ? 0 : window;
  const remaining = window - age;
  return remaining > 0 ? remaining : 0;
}

/**
 * Apply a delta to a snapshot.
 *
 * Success requires the exact edge `delta.from === snapshot.version`; a delta
 * built on any other version is `MISMATCH`, never a silent re-base. A `GAP`
 * signal (an object carrying `code: 'GAP'`, or the string `'GAP'`) passes
 * through unchanged — the caller refetches a whole snapshot instead.
 *
 * On success the returned snapshot is a new object: the payload is merged from
 * `delta.patch` (when it is an object) and the version advances to
 * `delta.version`, falling back to `delta.to`, then to the previous version.
 * Neither input is mutated.
 *
 * @param {Snapshot|null|undefined} snapshot
 * @param {{ from?: any, version?: any, to?: any, patch?: any, changes?: any[], code?: string }|string|null|undefined} delta
 * @returns {ApplyResult}
 */
export function applyDelta(snapshot, delta) {
  if (delta === 'GAP') return { ok: false, code: 'GAP' };
  if (delta && typeof delta === 'object' && delta.code === 'GAP') return { ok: false, code: 'GAP' };
  if (!snapshot || typeof snapshot !== 'object' || !hasVersion(snapshot)) return { ok: false, code: 'MISMATCH' };
  if (!delta || typeof delta !== 'object') return { ok: false, code: 'MISMATCH' };
  if (!('from' in delta) || delta.from !== snapshot.version) return { ok: false, code: 'MISMATCH' };

  const version = delta.version !== undefined ? delta.version : delta.to;
  const next = { ...snapshot };
  if (version !== undefined) next.version = version;

  // The store's canonical delta is `changes:[{slice,key,op,value}]`. Applying an
  // empty `patch` instead would advance the version while the state stood still —
  // the feed would claim to be current and be wrong.
  if (Array.isArray(delta.changes)) {
    /** @type {Record<string, any>} */
    const slices = { ...(snapshot.slices ?? {}) };
    for (const change of delta.changes) {
      if (!change || !change.slice) continue;
      const current = slices[change.slice];
      const enveloped = Boolean(current && current.keys);
      // A change may name a slice the base snapshot has never seen (the producer
      // published a new slice). The slice is materialised here rather than dropped:
      // dropping it would advance the version while the state stood still, and the
      // feed would claim to be current while missing the slice entirely.
      const inner = enveloped
        ? { ...current.keys }
        : { ...(current ?? { degraded: false, data: {} }) };
      const source = inner.data;
      const data = source && typeof source === 'object' && !Array.isArray(source)
        ? { ...source }
        : {};
      if (change.op === 'unset') delete data[change.key];
      else data[change.key] = change.value;
      inner.data = data;
      slices[change.slice] = enveloped ? { ...current, keys: inner } : inner;
    }
    next.slices = slices;
  } else if (delta.patch && typeof delta.patch === 'object') {
    Object.assign(next, delta.patch);
  }
  return { ok: true, snapshot: next };
}

/**
 * Unwrap the store's `{degraded, keys:{...}}` envelope so a consumer reads the
 * shape the contract promises: `snap.slices[name] = { tier, data, degraded, lastGoodAt }`.
 *
 * @param {any} snapshot
 * @returns {any}
 */
export function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.slices) return snapshot;
  /** @type {Record<string, any>} */
  const slices = {};
  for (const [name, value] of Object.entries(snapshot.slices)) {
    slices[name] = value && /** @type {any} */ (value).keys
      ? { .../** @type {any} */ (value).keys, degraded: /** @type {any} */ (value).degraded ?? /** @type {any} */ (value).keys.degraded }
      : value;
  }
  return { ...snapshot, slices };
}

/**
 * Read one snapshot over HTTP.
 *
 * `fetchImpl` is injected so tests never touch the network; with none, the call
 * fails closed as `NO_FETCH`. A `token` becomes `Authorization: Bearer <token>`
 * and never appears in a result — network failures are reported by code, not by
 * echoing an error message that could carry the URL or the credential.
 *
 * Status mapping: 401 -> UNAUTHORIZED, 503 -> NO_SNAPSHOT, 410 -> GAP, any other
 * non-ok -> HTTP_ERROR. A 2xx body must be an object carrying `version`, else
 * INVALID_SNAPSHOT; unparseable JSON is INVALID_JSON.
 *
 * @param {string} url
 * @param {ReadOptions} [options]
 * @returns {Promise<ReadResult>}
 */
export async function readSnapshot(url, options = {}) {
  const fetchImpl = options ? options.fetchImpl : undefined;
  if (typeof fetchImpl !== 'function') return { ok: false, code: 'NO_FETCH', status: 0 };

  /** @type {Record<string, string>} */
  const headers = { accept: 'application/json' };
  const token = options ? options.token : undefined;
  if (typeof token === 'string' && token.length > 0) headers.authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetchImpl(url, { method: 'GET', headers });
  } catch {
    // Deliberately message-free: an error string can carry the URL or the token.
    return { ok: false, code: 'NETWORK', status: 0 };
  }
  if (!response || typeof response !== 'object') return { ok: false, code: 'NETWORK', status: 0 };

  const status = Number(response.status);
  if (status === 401) return { ok: false, code: 'UNAUTHORIZED', status };
  if (status === 503) return { ok: false, code: 'NO_SNAPSHOT', status };
  if (status === 410) return { ok: false, code: 'GAP', status };
  if (!response.ok) return { ok: false, code: 'HTTP_ERROR', status };

  let body;
  try {
    body = await response.json();
  } catch {
    return { ok: false, code: 'INVALID_JSON', status };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, code: 'INVALID_SNAPSHOT', status };
  if (!hasVersion(body)) return { ok: false, code: 'INVALID_SNAPSHOT', status };
  return { ok: true, snapshot: body };
}
