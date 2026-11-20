# File: hq/lib/fsf/store.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/fsf/store.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15503 B |
| Lines | 397 |
| Hash | d837e0932691 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FSF_SCHEMA | const | 27 | yes | export const FSF_SCHEMA = &#39;fsf/1&#39;; |
| FSF_DEFAULT_REFRESH_MS | const | 30 | yes | export const FSF_DEFAULT_REFRESH_MS = 5000; |
| FSF_DEFAULT_HISTORY | const | 33 | yes | export const FSF_DEFAULT_HISTORY = 100; |
| FSF_SLICE_DATA | const | 36 | yes | export const FSF_SLICE_DATA = &#39;data&#39;; |
| isPlainObject | function | 66 | no | function isPlainObject(value) { |
| proto | const | 68 | no | const proto = Object.getPrototypeOf(value); |
| isObjectLike | function | 73 | no | function isObjectLike(value) { |
| deepCopy | function | 84 | no | function deepCopy(value) { |
| clone | const | 86 | no | const clone = /** @type {{ structuredClone?: (input: unknown) =&gt; unknown }} */ (globalThis).structuredClone; |
| canon | function | 103 | no | function canon(value) { |
| keys | const | 110 | no | const keys = Object.keys(record).sort(); |
| copyRecord | function | 120 | no | function copyRecord(record) { |
| out | const | 122 | no | const out = {}; |
| normalizeSlices | function | 141 | no | function normalizeSlices(input) { |
| entries | variable | 143 | no | let entries; |
| name | const | 149 | no | const name = /** @type {KeyMap} */ (record).name; |
| out | const | 162 | no | const out = []; |
| seen | const | 164 | no | const seen = new Set(); |
| canonical | const | 176 | no | const canonical = Object.prototype.hasOwnProperty.call(record, FSF_SLICE_DATA); |
| data | variable | 178 | no | let data; |
| extra | const | 180 | no | const extra = {}; |
| rawData | const | 182 | no | const rawData = record[FSF_SLICE_DATA]; |
| toIsoTimestamp | function | 211 | no | function toIsoTimestamp(now) { |
| date | variable | 216 | no | let date; |
| buildSnapshot | function | 232 | no | function buildSnapshot(normalized, meta) { |
| slices | const | 234 | no | const slices = {}; |
| diffSlices | function | 256 | no | function diffSlices(prev, next) { |
| changes | const | 258 | no | const changes = []; |
| prevSlices | const | 259 | no | const prevSlices = prev ? prev.slices : {}; |
| names | const | 260 | no | const names = Array.from(new Set([...Object.keys(prevSlices), ...Object.keys(next.slices)])).sort(); |
| before | const | 262 | no | const before = prevSlices[name]; |
| after | const | 263 | no | const after = next.slices[name]; |
| beforeData | const | 264 | no | const beforeData = before &amp;&amp; isObjectLike(before.data) ? before.data : {}; |
| afterData | const | 265 | no | const afterData = after &amp;&amp; isObjectLike(after.data) ? after.data : {}; |
| keys | const | 266 | no | const keys = Array.from(new Set([...Object.keys(beforeData), ...Object.keys(afterData)])).sort(); |
| hadBefore | const | 268 | no | const hadBefore = Object.prototype.hasOwnProperty.call(beforeData, key); |
| hasAfter | const | 269 | no | const hasAfter = Object.prototype.hasOwnProperty.call(afterData, key); |
| FeedStore | class | 285 | yes | export class FeedStore { |
| constructor | method | 289 | yes | constructor({ history = FSF_DEFAULT_HISTORY } = {}) { |
| _newest | method | 317 | yes | _newest() { |
| publish | method | 327 | yes | publish({ slices, now, refreshAfterMs = FSF_DEFAULT_REFRESH_MS } = {}) { |
| issuedAt | const | 334 | no | const issuedAt = toIsoTimestamp(now); |
| normalized | const | 335 | no | const normalized = normalizeSlices(slices); |
| next | const | 337 | no | const next = buildSnapshot(normalized, { generation: this._generation + 1, version: this._version + 1, issuedAt, refreshAfterMs, |
| snapshot | method | 356 | yes | snapshot() { |
| newest | const | 357 | no | const newest = this._newest(); |
| delta | method | 366 | yes | delta(sinceVersion) { |
| newest | const | 367 | no | const newest = this._newest(); |
| oldest | const | 371 | no | const oldest = this._snapshots[0]; |
| changes | const | 386 | no | const changes = []; |
| next | const | 388 | no | const next = this._snapshots[index]; |
| prev | const | 390 | no | const prev = this._snapshots[index - 1]; |
| FeedStore | export | 397 | yes | export default FeedStore; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/fsf/store.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | FSF feed store — an in-memory, versioned snapshot ring that publishes slice maps and |
| 5 | owner | hq | — | hq |
| 6 | task | — | — | fsf-store |
| 7 | invariant | — | — | publish is the only writer: every snapshot it hands out is a deep copy, so a caller |
| 9 | invariant | — | — | version strictly increases by one per publish and is the delta cursor; generation |
| 11 | invariant | — | — | delta never guesses: a cursor outside retention is GAP (with the retained bounds), a |
| 13 | invariant | — | — | the key container is `data`, matching hq/lib/fsf/slices.mjs and the `changes` path of |
| 16 | invariant | — | — | a delta carries key-level changes only. Metadata-only transitions (`degraded`, |
| 19 | invariant | — | — | pruning removes the oldest snapshot only, and never removes the newest, so the |
| 21 | why | — | — | Deltas are recomputed from adjacent retained snapshots instead of stored per step: one |
| 23 | see | — | hq/lib/fsf/slices.mjs | hq/lib/fsf/slices.mjs · hq/lib/fsf/client.mjs |

## Excerpt

```javascript
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
```

_First 80 of 398 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
