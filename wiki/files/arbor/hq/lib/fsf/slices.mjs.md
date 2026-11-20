# File: hq/lib/fsf/slices.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/fsf/slices.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11276 B |
| Lines | 343 |
| Hash | e76293535afc |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SLICES | const | 51 | yes | export const SLICES = [&#39;identity&#39;, &#39;capacity&#39;, &#39;work&#39;, &#39;locks&#39;, &#39;health&#39;, &#39;policy&#39;, &#39;time&#39;]; |
| TIERS | const | 58 | yes | export const TIERS = { |
| SOURCE_BINDINGS | const | 73 | yes | export const SOURCE_BINDINGS = [ |
| collectSlices | function | 91 | yes | export function collectSlices(input = {}) { |
| bag | const | 93 | no | const bag = /** @type {Record&lt;string, unknown&gt;} */ ( input &amp;&amp; typeof input === &#39;object&#39; ? input : {} ); |
| nowValue | variable | 98 | no | let nowValue; |
| rawSources | variable | 100 | no | let rawSources; |
| clock | const | 109 | no | const clock = normalizeNow(nowValue); |
| readings | const | 112 | no | const readings = []; |
| reading | const | 115 | no | const reading = readSource(sourceName, slice, rawSources, clock); |
| readSource | function | 144 | no | function readSource(sourceName, slice, rawSources, clock) { |
| tier | const | 145 | no | const tier = TIERS[slice]; |
| bag | const | 150 | no | const bag = /** @type {Record&lt;string, unknown&gt;} */ (rawSources); |
| candidate | const | 151 | no | const candidate = bag[sourceName]; |
| data | const | 158 | no | const data = /** @type {SliceSource} */ (candidate)({ now: clock.issuedAt, epoch: clock.epoch, slice, name: sourceName, |
| assemble | function | 183 | no | function assemble(sourceSlices, clock) { |
| collected | const | 185 | no | const collected = new Map(); |
| degradedSlices | const | 187 | no | const degradedSlices = []; |
| entry | const | 190 | no | const entry = sourceSlices[index] ?? degrade(TIERS[slice], `slice &quot;${slice}&quot; was not collected`); |
| out | const | 214 | no | const out = /** @type {Record&lt;SliceName, Slice&gt;} */ ({}); |
| settle | function | 227 | no | function settle(tier, value, clock) { |
| degrade | function | 241 | no | function degrade(tier, message) { |
| allDegraded | function | 252 | no | function allDegraded(reason) { |
| degradedSlices | const | 253 | no | const degradedSlices = SOURCE_BINDINGS.map(([, slice]) =&gt; slice); |
| out | const | 256 | no | const out = /** @type {Record&lt;SliceName, Slice&gt;} */ ({}); |
| isThenable | function | 283 | no | function isThenable(value) { |
| normalizeNow | function | 302 | no | function normalizeNow(value) { |
| ms | const | 308 | no | const ms = value.getTime(); |
| ms | const | 317 | no | const ms = Date.parse(value); |
| errorMessage | function | 331 | no | function errorMessage(error) { |
| message | const | 334 | no | const message = /** @type {{ message?: unknown }} */ (error).message; |
| text | const | 338 | no | const text = String(error); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/fsf/slices.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The seven FSF read slices — identity, capacity, work, locks, health, policy, time — each collected behind its own guard and degraded in isolation. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | FSF-SLICES |
| 7 | why | — | — | A single dead feed must never blank the whole view. Every slice is |
| 10 | invariant | — | — | collectSlices never throws and always yields all seven SLICES keys. |
| 11 | invariant | — | — | A degraded slice is exactly `{ tier, data: { error }, degraded: true, lastGoodAt: null }`. |
| 12 | invariant | — | — | The source vocabulary is exactly seats, sessions, receipts, bus, actions. |
| 15 | invariant | — | — | Time is injected by the caller. The wall clock is never read here, |

## Excerpt

```javascript
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
```

_First 80 of 344 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
