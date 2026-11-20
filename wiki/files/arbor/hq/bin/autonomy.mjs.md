# File: hq/bin/autonomy.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/autonomy.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24184 B |
| Lines | 542 |
| Hash | 547eb40ca791 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| USAGE | const | 25 | no | const USAGE = [ |
| POOLS | const | 52 | no | const POOLS = new Set([&#39;observations&#39;, &#39;orders&#39;, &#39;both&#39;]); |
| compact | function | 55 | no | function compact(text) { |
| parseArgs | function | 65 | yes | export function parseArgs(argv) { |
| flags | const | 66 | no | const flags = { |
| args | const | 82 | no | const args = Array.isArray(argv) ? argv.slice() : []; |
| arg | const | 84 | no | const arg = String(args[i]); |
| value | function | 86 | no | const value = () =&gt; { |
| transport | const | 95 | no | const transport = String(value() ?? &#39;&#39;).toLowerCase(); |
| pool | const | 106 | no | const pool = String(value() ?? &#39;&#39;).trim().toLowerCase(); |
| readJson | function | 124 | no | function readJson(value, what) { |
| text | variable | 125 | no | let text; |
| journalEvents | function | 138 | no | function journalEvents(journalPath) { |
| doc | const | 140 | no | const doc = readJson(journalPath, &#39;journal&#39;); |
| runAutonomy | function | 168 | yes | export function runAutonomy(options = {}) { |
| lines | const | 183 | no | const lines = []; |
| out | function | 184 | no | const out = (line) =&gt; { lines.push(line); if (stdout) stdout(line); }; |
| err | function | 185 | no | const err = (line) =&gt; { if (stderr) stderr(line); }; |
| failures | const | 187 | no | const failures = []; |
| flags | variable | 188 | no | let flags; |
| channelRoot | const | 199 | no | const channelRoot = String(flags.root ?? root ?? process.env.HQ_CHANNEL_ROOT ?? DEFAULT_CHANNEL_ROOT); |
| idleMinutes | const | 200 | no | const idleMinutes = flags.idleMinutes ?? DEFAULT_IDLE_MINUTES; |
| idleMs | const | 201 | no | const idleMs = idleMinutes * 60_000; |
| nowValue | const | 202 | no | const nowValue = typeof now === &#39;function&#39; ? now() : now; |
| nowIso | const | 203 | no | const nowIso = new Date(Date.parse(String(nowValue))).toISOString(); |
| cycle | const | 204 | no | const cycle = nowIso; |
| settlePath | const | 205 | no | const settlePath = flags.journalPath ?? journalPath ?? join(cwd, &#39;.hq&#39;, &#39;autonomy&#39;, &#39;journal.json&#39;); |
| seatData | variable | 207 | no | let seatData; |
| seatSource | variable | 212 | no | let seatSource; |
| builderIds | const | 221 | no | const builderIds = builderWorkers(seatSource); |
| injectedObservations | const | 234 | no | const injectedObservations = options.tasks !== undefined &amp;&amp; options.tasks !== null; |
| derivedPool | const | 235 | no | const derivedPool = flags.transport === &#39;agent&#39; ? &#39;orders&#39; : &#39;observations&#39;; |
| requestedPool | const | 236 | no | const requestedPool = flags.pool |
| ordersDisabled | const | 238 | no | const ordersDisabled = flags.ordersPath === &#39;none&#39;; |
| wantsOrders | const | 243 | no | const wantsOrders = !ordersDisabled &amp;&amp; (requestedPool === &#39;orders&#39; \|\| requestedPool === &#39;both&#39;); |
| wantsObservations | const | 244 | no | const wantsObservations = requestedPool === &#39;observations&#39; \|\| requestedPool === &#39;both&#39;; |
| pool | const | 245 | no | const pool = wantsOrders ? requestedPool : &#39;observations&#39;; |
| observationsCount | variable | 246 | no | let observationsCount = 0; |
| ordersCount | variable | 247 | no | let ordersCount = 0; |
| orderIds | variable | 250 | no | let orderIds = new Set(); |
| taskData | const | 253 | no | const taskData = []; |
| list | variable | 256 | no | let list; |
| doc | const | 258 | no | const doc = options.tasks; |
| tasksPath | const | 262 | no | const tasksPath = flags.tasksPath ?? join(cwd, &#39;dogfood&#39;, &#39;active-tasks.json&#39;); |
| doc | const | 263 | no | const doc = readJson(tasksPath, &#39;task queue&#39;); |
| ordersPath | const | 276 | no | const ordersPath = flags.ordersPath &amp;&amp; !ordersDisabled |
| text | variable | 279 | no | let text; |
| doc | variable | 289 | no | let doc = null; |
| check | const | 291 | no | const check = validateDoc(doc); |
| dispatchable | const | 299 | no | const dispatchable = openOrders(doc); |
| sources | const | 305 | no | const sources = { observations: observationsCount, orders: ordersCount }; |
| providerData | variable | 311 | no | let providerData; |
| doc | const | 318 | no | const doc = readJson(resolve(cwd, flags.providersPath), &#39;provider health&#39;); |
| journal | variable | 331 | no | let journal; |
| liveMap | variable | 341 | no | let liveMap = live ?? null; |
| plan | variable | 353 | no | let plan; |
| roleOf | function | 381 | no | const roleOf = (seatId) =&gt; { |
| seat | const | 382 | no | const seat = Array.isArray(seatData) |
| role | const | 389 | no | const role = roleOf(decision.seat); |
| line | const | 405 | no | const line = `autonomy: planned=${plan.decisions.length} woke=0 skipped=${plan.summary.skips} pending=${plan.summary.pending} recovered=${plan.summary.recovered}`; |
| writes | const | 410 | no | const writes = flags.transport === &#39;seat&#39;; |
| events | const | 411 | no | const events = journal.slice(); |
| persist | function | 412 | no | const persist = () =&gt; { |
| append | function | 417 | no | const append = (event) =&gt; { events.push(event); persist(); }; |
| planned | const | 425 | no | const planned = plan.decisions.filter((decision) =&gt; decision.action === &#39;WAKE&#39;); |
| woke | variable | 426 | no | let woke = 0; |
| line | const | 430 | no | const line = `DISPATCH ${decision.seat} ${decision.taskId} :: ${String(decision.promptSlice ?? &#39;&#39;).replace(/\\n/g, &#39; \| &#39;)}`; |
| wakeFn | const | 435 | no | const wakeFn = wake ?? defaultWake({ channelRoot, liveMap, force: flags.force, idleMinutes, waitSec: flags.waitSec }); |
| verifyFn | const | 436 | no | const verifyFn = verify ?? defaultVerify({ channelRoot }); |
| index | variable | 437 | no | let index = 0; |
| attempt | const | 440 | no | const attempt = { |
| result | variable | 449 | no | let result; |
| proof | variable | 465 | no | let proof; |
| pending | variable | 483 | no | let pending = plan.summary.pending; |
| summaryLine | const | 489 | no | const summaryLine = `autonomy: planned=${plan.decisions.length} woke=${woke} skipped=${plan.summary.skips} pending=${pending} recovered=${plan.summary.recovered}`; |
| defaultWake | function | 494 | no | function defaultWake({ channelRoot, liveMap, force, idleMinutes, waitSec }) { |
| result | const | 496 | no | const result = wakeSeat({ root: channelRoot, seatId: decision.seat, prompt: decision.promptSlice, reason: decision.reason, |
| defaultVerify | function | 521 | no | function defaultVerify({ channelRoot }) { |
| proof | const | 523 | no | const proof = verifySeat({ root: channelRoot, seatId: decision.seat, id: ctx?.wakeId ?? null, confirm: (sessionId, wakeId) =&gt; confirmWake(sessionId, wakeId), |
| main | function | 533 | no | function main() { |
| result | const | 534 | no | const result = runAutonomy({ argv: process.argv.slice(2), stdout: (line) =&gt; console.log(line), stderr: (line) =&gt; console.error(line), }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 18 | external |
| node:path | import | 19 | external |
| ../lib/autonomy.mjs | import | 20 | [hq/lib/autonomy.mjs](../lib/autonomy.mjs.md) |
| ../lib/work-orders.mjs | import | 21 | [hq/lib/work-orders.mjs](../lib/work-orders.mjs.md) |
| ../lib/channel-seats.mjs | import | 22 | [hq/lib/channel-seats.mjs](../lib/channel-seats.mjs.md) |
| ../lib/channel-transport.mjs | import | 23 | [hq/lib/channel-transport.mjs](../lib/channel-transport.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](./hq.mjs.md) | ./autonomy.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 4 | context | — | — | Autonomy dispatcher CLI — plan one dispatch cycle from the seat roster and the open queue, journal the intent before the effect, and either wake a seat or emit a subagent work order |
| 5 | owner | autonomy-dispatcher | — | autonomy-dispatcher |
| 6 | task | — | — | autonomy-lane-a1 |
| 7 | invariant | — | — | --dry-run is the default; only --apply may cause an effect |
| 8 | invariant | — | — | the pending record is on disk before the transport is called, so a crash is recoverable |
| 9 | invariant | — | — | --transport agent never spawns and never writes the journal: it prints DISPATCH lines for the caller |
| 10 | invariant | — | — | exit 1 when a wake was attempted and failed; exit 2 on a usage or source error |
| 11 | invariant | — | — | the pool follows the transport: a chat seat is never handed authored builder work, and a transcript row is never printed as a DISPATCH |
| 12 | invariant | — | — | an invalid authored queue is refused before planning, and a missing one is a defect (ORDERS_MISSING), never an empty pool |
| 13 | invariant | — | — | read-only toward hq/work/orders.json: this command plans, it never claims or completes an order |
| 14 | see | — | hq/lib/autonomy.mjs | hq/lib/autonomy.mjs |
| 15 | see | — | hq/lib/work-orders.mjs | hq/lib/work-orders.mjs |
| 16 | see | — | hq/lib/channel-seats.mjs | hq/lib/channel-seats.mjs |

## Excerpt

```javascript
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
```

_First 80 of 543 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
