# File: hq/lib/fsf/client.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/fsf/client.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11151 B |
| Lines | 262 |
| Hash | fb100e05aedc |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| toEpochMs | function | 34 | yes | export function toEpochMs(value) { |
| ms | const | 37 | no | const ms = value.getTime(); |
| ms | const | 41 | no | const ms = Date.parse(value); |
| windowMs | function | 55 | no | function windowMs(value) { |
| n | const | 56 | no | const n = typeof value === &#39;number&#39; ? value : (typeof value === &#39;string&#39; ? Number(value) : NaN); |
| clockMs | function | 64 | no | function clockMs(now) { |
| hasVersion | function | 73 | no | function hasVersion(snapshot) { |
| isCurrent | function | 91 | yes | export function isCurrent(snapshot, now) { |
| issuedAt | const | 94 | no | const issuedAt = toEpochMs(snapshot.issuedAt); |
| window | const | 96 | no | const window = windowMs(snapshot.refreshAfterMs); |
| at | const | 98 | no | const at = clockMs(now); |
| age | const | 101 | no | const age = at - issuedAt; |
| nextRefreshMs | function | 118 | yes | export function nextRefreshMs(snapshot, now) { |
| issuedAt | const | 120 | no | const issuedAt = toEpochMs(snapshot.issuedAt); |
| window | const | 122 | no | const window = windowMs(snapshot.refreshAfterMs); |
| at | const | 124 | no | const at = clockMs(now); |
| age | const | 127 | no | const age = at - issuedAt; |
| remaining | const | 129 | no | const remaining = window - age; |
| applyDelta | function | 150 | yes | export function applyDelta(snapshot, delta) { |
| version | const | 157 | no | const version = delta.version !== undefined ? delta.version : delta.to; |
| next | const | 158 | no | const next = { ...snapshot }; |
| slices | const | 166 | no | const slices = { ...(snapshot.slices ?? {}) }; |
| current | const | 169 | no | const current = slices[change.slice]; |
| enveloped | const | 170 | no | const enveloped = Boolean(current &amp;&amp; current.keys); |
| inner | const | 175 | no | const inner = enveloped |
| source | const | 178 | no | const source = inner.data; |
| data | const | 179 | no | const data = source &amp;&amp; typeof source === &#39;object&#39; &amp;&amp; !Array.isArray(source) |
| normalizeSnapshot | function | 201 | yes | export function normalizeSnapshot(snapshot) { |
| slices | const | 204 | no | const slices = {}; |
| readSnapshot | function | 229 | yes | export async function readSnapshot(url, options = {}) { |
| fetchImpl | const | 230 | no | const fetchImpl = options ? options.fetchImpl : undefined; |
| headers | const | 234 | no | const headers = { accept: &#39;application/json&#39; }; |
| token | const | 235 | no | const token = options ? options.token : undefined; |
| response | variable | 238 | no | let response; |
| status | const | 247 | no | const status = Number(response.status); |
| body | variable | 253 | no | let body; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/fsf/client.mjs |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/fsf/client.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | FSF snapshot freshness — decide from the values alone whether a cached snapshot is current, how long remains before it must be refreshed, how a delta resolves, and how one HTTP read maps to a result. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | fsf-client |
| 6 | invariant | — | — | read-only: this module performs no I/O unless a fetchImpl is injected, never mutates a snapshot or a delta, and never emits a token into a result |
| 7 | invariant | — | — | a future issuedAt is clock skew, not freshness: skew beyond refreshAfterMs is stale, never current |
| 8 | invariant | — | — | applyDelta advances only along the exact edge delta.from === snapshot.version; anything else is MISMATCH, and a GAP signal stays GAP |
| 9 | why | — | — | the freshness verdict must be computable without I/O, so a caller can cache, replay and test a snapshot without a provider |
| 10 | see | — | hq/lib/lane-health.mjs | hq/lib/lane-health.mjs · doc:docs/NORTH-STARS.md |

## Excerpt

```javascript
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
```

_First 80 of 263 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
