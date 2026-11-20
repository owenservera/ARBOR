# File: hq/lib/seat-heartbeat.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/seat-heartbeat.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14884 B |
| Lines | 420 |
| Hash | c592377759a3 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HEARTBEAT_SCHEMA | const | 17 | yes | export const HEARTBEAT_SCHEMA = &#39;hq.seat-heartbeat/1&#39;; |
| CONSUMER_SCHEMA | const | 20 | yes | export const CONSUMER_SCHEMA = &#39;hq.seat-consumers/1&#39;; |
| STATES | const | 23 | yes | export const STATES = /** @type {const} */ ([&#39;busy&#39;, &#39;idle&#39;, &#39;stale&#39;, &#39;unknown&#39;]); |
| STATE_SET | const | 27 | no | const STATE_SET = new Set(STATES); |
| DEFAULT_TURN_MS | const | 34 | yes | export const DEFAULT_TURN_MS = 2 * 60_000; |
| DEFAULT_IDLE_MS | const | 35 | yes | export const DEFAULT_IDLE_MS = 15 * 60_000; |
| toMs | function | 45 | no | function toMs(value) { |
| t | const | 47 | no | const t = value.getTime(); |
| text | const | 52 | no | const text = value.trim(); |
| t | const | 54 | no | const t = Date.parse(text); |
| windowMs | function | 68 | no | function windowMs(value, fallback) { |
| n | const | 70 | no | const n = Number(value); |
| heartbeat | function | 96 | yes | export function heartbeat({ now = nowISO(), lastSeenAt, lastTurnMs = DEFAULT_TURN_MS, idleMs = DEFAULT_IDLE_MS, |
| turnMs | const | 102 | no | const turnMs = windowMs(lastTurnMs, DEFAULT_TURN_MS); |
| quietMs | const | 103 | no | const quietMs = windowMs(idleMs, DEFAULT_IDLE_MS); |
| windows | const | 104 | no | const windows = { lastTurnMs: turnMs, idleMs: quietMs }; |
| seenMs | const | 105 | no | const seenMs = toMs(lastSeenAt); |
| at | const | 119 | no | const at = new Date(seenMs).toISOString(); |
| nowMs | const | 120 | no | const nowMs = toMs(now); |
| ageMs | const | 132 | no | const ageMs = Math.max(0, nowMs - seenMs); |
| summarize | function | 179 | yes | export function summarize({ seats = [], now = nowISO(), thresholds = {} } = {}) { |
| turnMs | const | 180 | no | const turnMs = windowMs(thresholds?.lastTurnMs, DEFAULT_TURN_MS); |
| quietMs | const | 181 | no | const quietMs = windowMs(thresholds?.idleMs, DEFAULT_IDLE_MS); |
| rows | const | 183 | no | const rows = (Array.isArray(seats) ? seats : []).map((seat, index) =&gt; { const result = heartbeat({ now, lastSeenAt: seat?.lastSeenAt, lastTurnMs: windowMs(seat?.lastTurnMs, turnMs), |
| result | const | 184 | no | const result = heartbeat({ now, lastSeenAt: seat?.lastSeenAt, lastTurnMs: windowMs(seat?.lastTurnMs, turnMs), idleMs: windowMs(seat?.idleMs, quietMs), |
| counts | const | 210 | no | const counts = { busy: 0, idle: 0, stale: 0, unknown: 0, total: rows.length }; |
| nowMs | const | 213 | no | const nowMs = toMs(now); |
| seatId | function | 222 | no | function seatId(seat) { |
| id | const | 223 | no | const id = String(seat?.id ?? seat?.seat ?? seat?.name ?? &#39;&#39;).trim(); |
| CONSUMER_VERDICTS | const | 230 | yes | export const CONSUMER_VERDICTS = /** @type {const} */ ([ &#39;working&#39;, &#39;consumer-without-result&#39;, &#39;delivered&#39;, &#39;idle&#39;, |
| consumptionOf | function | 246 | no | function consumptionOf(seat) { |
| tokens | const | 247 | no | const tokens = Number(seat?.tokens ?? 0); |
| cpuMs | const | 248 | no | const cpuMs = Number(seat?.cpuMs ?? 0); |
| cost | const | 249 | no | const cost = Number(seat?.cost ?? 0); |
| safe | function | 250 | no | const safe = (n) =&gt; (Number.isFinite(n) &amp;&amp; n &gt; 0 ? n : 0); |
| t | const | 251 | no | const t = safe(tokens); |
| c | const | 252 | no | const c = safe(cpuMs); |
| m | const | 253 | no | const m = safe(cost); |
| backgroundConsumers | function | 292 | yes | export function backgroundConsumers({ seats = [], now = nowISO(), thresholds = {} } = {}) { |
| turnMs | const | 293 | no | const turnMs = windowMs(thresholds?.lastTurnMs, DEFAULT_TURN_MS); |
| quietMs | const | 294 | no | const quietMs = windowMs(thresholds?.idleMs, DEFAULT_IDLE_MS); |
| rows | const | 296 | no | const rows = (Array.isArray(seats) ? seats : []).map((seat) =&gt; { const beat = heartbeat({ now, lastSeenAt: seat?.lastSeenAt, lastTurnMs: windowMs(seat?.lastTurnMs, turnMs), |
| beat | const | 297 | no | const beat = heartbeat({ now, lastSeenAt: seat?.lastSeenAt, lastTurnMs: windowMs(seat?.lastTurnMs, turnMs), idleMs: windowMs(seat?.idleMs, quietMs), |
| consumption | const | 303 | no | const consumption = consumptionOf(seat); |
| delivered | const | 304 | no | const delivered = Number(seat?.results ?? seat?.delivered ?? 0); |
| results | const | 305 | no | const results = Number.isFinite(delivered) &amp;&amp; delivered &gt; 0 ? delivered : 0; |
| verdict | variable | 308 | no | let verdict; |
| counts | const | 333 | no | const counts = { total: rows.length, working: 0, &#39;consumer-without-result&#39;: 0, delivered: 0, idle: 0, unknown: 0 }; |
| nowMs | const | 336 | no | const nowMs = toMs(now); |
| id | const | 362 | no | const id = String(seat ?? &#39;&#39;).trim(); |
| atMs | const | 367 | no | const atMs = toMs(at); |
| line | const | 371 | no | const line = { schema: HEARTBEAT_SCHEMA, at: new Date(atMs).toISOString(), seat: id, state }; |
| history | function | 387 | yes | export function history({ file, seat = null } = {}) { |
| want | const | 390 | no | const want = seat === null \|\| seat === undefined \|\| seat === &#39;&#39; ? null : String(seat).trim().toLowerCase(); |
| rows | const | 392 | no | const rows = []; |
| index | variable | 393 | no | let index = 0; |
| text | const | 395 | no | const text = raw.trim(); |
| doc | variable | 397 | no | let doc; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 13 | external |
| node:path | import | 14 | external |
| ./util.mjs | import | 15 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-091-background-consumption.mjs](../aii/fixtures/HQ-091-background-consumption.mjs.md) | ../../lib/seat-heartbeat.mjs |
| [hq/aii/fixtures/HQ-091-background-process-consumption.mjs](../aii/fixtures/HQ-091-background-process-consumption.mjs.md) | ../../lib/seat-heartbeat.mjs |
| [hq/lib/autonomy.mjs](./autonomy.mjs.md) | ./seat-heartbeat.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Seat heartbeat — classify seat liveness from how old the last observation is against the turn and idle windows, |
| 5 | owner | hq-agent | — | hq-agent |
| 6 | task | — | — | seat-heartbeat |
| 7 | invariant | — | — | the clock is injected as `now`; no branch in the classification reads the wall clock |
| 8 | invariant | — | — | a missing or unparseable timestamp is `unknown`, never `idle`: evidence is not inference |
| 9 | invariant | — | — | the heartbeat ledger is append-only; `record()` never rewrites a line |
| 10 | invariant | — | — | a busy seat is not judged: a running turn may still deliver, so no verdict is drawn about its result |
| 11 | see | — | hq/lib/channel-seats.mjs | hq/lib/channel-seats.mjs |

## Excerpt

```javascript
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
```

_First 80 of 421 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
