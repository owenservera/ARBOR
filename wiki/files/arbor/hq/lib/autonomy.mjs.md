# File: hq/lib/autonomy.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/autonomy.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 36798 B |
| Lines | 901 |
| Hash | fb0115b44735 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PLAN_SCHEMA | const | 19 | yes | export const PLAN_SCHEMA = &#39;hq.autonomy-plan/1&#39;; |
| JOURNAL_SCHEMA | const | 20 | yes | export const JOURNAL_SCHEMA = &#39;hq.autonomy-journal/1&#39;; |
| DEFAULT_STALE_MS | const | 23 | yes | export const DEFAULT_STALE_MS = 2 * DEFAULT_IDLE_MS; |
| CODES | const | 26 | yes | export const CODES = Object.freeze([ &#39;NO_OPEN_TASK&#39;, &#39;SEAT_ACTIVE&#39;, &#39;SEAT_UNKNOWN&#39;, &#39;SEAT_UNKNOWN_EVIDENCE&#39;, |
| builderWorkers | function | 53 | yes | export function builderWorkers(seatData) { |
| seats | const | 54 | no | const seats = Array.isArray(seatData) ? seatData : Array.isArray(seatData?.seats) ? seatData.seats : []; |
| declared | const | 55 | no | const declared = Array.isArray(seatData?.builders) ? seatData.builders : []; |
| ids | const | 57 | no | const ids = []; |
| push | function | 58 | no | const push = (value) =&gt; { |
| id | const | 59 | no | const id = String(value ?? &#39;&#39;).trim().toLowerCase(); |
| TERMINAL_STATES | const | 69 | yes | export const TERMINAL_STATES = /** @type {const} */ ([&#39;got-reply&#39;, &#39;no-reply&#39;, &#39;recovered&#39;, &#39;failed&#39;, &#39;cancelled&#39;]); |
| OPEN_STATES | const | 70 | yes | export const OPEN_STATES = /** @type {const} */ ([&#39;pending&#39;, &#39;sent&#39;]); |
| DONE_STATUS | const | 72 | no | const DONE_STATUS = new Set([&#39;done&#39;, &#39;closed&#39;, &#39;complete&#39;, &#39;completed&#39;, &#39;verified&#39;, &#39;shipped&#39;, &#39;cancelled&#39;, &#39;canceled&#39;]); |
| UNBOUND_SEATS | const | 73 | no | const UNBOUND_SEATS = new Set([&#39;&#39;, &#39;unbound&#39;, &#39;any&#39;, &#39;*&#39;, &#39;none&#39;]); |
| toMs | function | 82 | no | function toMs(value) { |
| text | const | 86 | no | const text = value.trim(); |
| t | const | 88 | no | const t = Date.parse(text); |
| numberOr | function | 94 | no | function numberOr(value, fallback) { |
| n | const | 96 | no | const n = Number(value); |
| isoAt | function | 100 | no | function isoAt(ms) { |
| entriesOf | function | 104 | no | function entriesOf(journal) { |
| foldJournal | function | 117 | yes | export function foldJournal(journal) { |
| out | const | 119 | no | const out = new Map(); |
| id | const | 122 | no | const id = String(event.id ?? &#39;&#39;).trim(); |
| at | const | 124 | no | const at = toMs(event.at); |
| prev | const | 125 | no | const prev = out.get(id); |
| providerList | function | 151 | no | function providerList(providers) { |
| findFundedProvider | function | 165 | yes | export function findFundedProvider(providers, opts = {}) { |
| minReliability | const | 166 | no | const minReliability = numberOr(opts.minReliability, Number(DEFAULT_POLICY.minReliability) \|\| 0.5); |
| maxUsdPerCall | const | 167 | no | const maxUsdPerCall = numberOr(opts.maxUsdPerCall, Number(DEFAULT_POLICY.maxUsdPerCall) \|\| 0.5); |
| blocked | const | 168 | no | const blocked = new Set((opts.blockedProviders ?? DEFAULT_POLICY.blockedProviders ?? []).map((id) =&gt; String(id).toLowerCase())); |
| policy | const | 169 | no | const policy = { minReliability, maxUsdPerCall }; |
| id | const | 175 | no | const id = String(provider.id ?? provider.provider ?? provider.provider_id ?? &#39;&#39;).toLowerCase(); |
| state | const | 177 | no | const state = String(provider.state ?? provider.health ?? &#39;&#39;).toLowerCase(); |
| reliability | const | 179 | no | const reliability = Number(provider.reliability); |
| cost | const | 181 | no | const cost = Number(provider.usdPerCall); |
| taskIdOf | function | 188 | no | function taskIdOf(task) { |
| taskSeatOf | function | 192 | no | function taskSeatOf(task) { |
| seat | const | 193 | no | const seat = String(task?.seat ?? task?.owner ?? &#39;&#39;).trim().toLowerCase(); |
| deliverableOf | function | 197 | no | function deliverableOf(task) { |
| fileOf | function | 201 | no | function fileOf(task) { |
| PROOF_COMMAND_RE | const | 212 | no | const PROOF_COMMAND_RE = /^(?:bun\|bunx\|node\|npm\|npx\|pnpm\|yarn\|deno\|python[0-9.]*\|py\|cargo\|rustc\|go\|dotnet\|tsc\|git\|gh\|curl\|wget\|pwsh\|powershell\|cmd\|sh\|bash\|hq\|zcode\|es\|du\|handle\|fclones\|sqlite3)\\b/i; |
| isProofCommand | function | 215 | no | function isProofCommand(text) { |
| candidate | const | 216 | no | const candidate = String(text).trim(); |
| proofCommandOf | function | 227 | no | function proofCommandOf(task) { |
| explicit | const | 228 | no | const explicit = String(task?.proofCommand ?? task?.command ?? &#39;&#39;).trim(); |
| candidate | const | 232 | no | const candidate = match[1].trim(); |
| isBlockedTask | function | 246 | yes | export function isBlockedTask(task) { |
| status | const | 249 | no | const status = String(task.status ?? task.state ?? &#39;&#39;).toLowerCase(); |
| buildPromptSlice | function | 261 | yes | export function buildPromptSlice(task) { |
| id | const | 262 | no | const id = taskIdOf(task); |
| deliverable | const | 263 | no | const deliverable = deliverableOf(task); |
| file | const | 264 | no | const file = fileOf(task); |
| prove | const | 265 | no | const prove = proofCommandOf(task); |
| lastSeenFor | function | 287 | no | function lastSeenFor(seat, live, nowMs) { |
| direct | const | 288 | no | const direct = seat?.lastSeenAt ?? seat?.at ?? seat?.observedAt; |
| keys | const | 290 | no | const keys = [seat?.session, seat?.id, seat?.seat, seat?.name].filter(Boolean); |
| value | const | 292 | no | const value = live instanceof Map ? live.get(key) : live?.[key]; |
| decision | function | 310 | no | function decision({ seat, taskId = null, action, code, reason, promptSlice = null }) { |
| planDispatch | function | 354 | yes | export function planDispatch({ seats, tasks, providers, journal, now, opts = {} } = {}) { |
| nowMs | const | 358 | no | const nowMs = toMs(now); |
| nowIso | const | 360 | no | const nowIso = new Date(nowMs).toISOString(); |
| cycle | const | 361 | no | const cycle = String(opts.cycle ?? nowIso); |
| idleMs | const | 362 | no | const idleMs = numberOr(opts.idleMs, DEFAULT_IDLE_MS); |
| staleMs | const | 363 | no | const staleMs = numberOr(opts.staleMs, 2 * idleMs); |
| maxWakes | const | 364 | no | const maxWakes = opts.maxWakes === undefined \|\| opts.maxWakes === null ? Infinity : numberOr(opts.maxWakes, Infinity); |
| force | const | 365 | no | const force = opts.force === true; |
| staleMinutes | const | 366 | no | const staleMinutes = Math.round(staleMs / 60_000); |
| seatList | const | 368 | no | const seatList = Array.isArray(seats) ? seats : Array.isArray(seats?.seats) ? seats.seats : []; |
| taskList | const | 369 | no | const taskList = (Array.isArray(tasks) ? tasks : Array.isArray(tasks?.tasks) ? tasks.tasks : []) |
| folded | const | 371 | no | const folded = foldJournal(journal); |
| builderIdList | const | 378 | no | const builderIdList = opts.builderIds === undefined \|\| opts.builderIds === null |
| builderIds | const | 382 | no | const builderIds = builderIdList === null ? null : new Set(builderIdList); |
| isAuthoredOrder | function | 383 | no | const isAuthoredOrder = (task) =&gt; task?.kind === &#39;work-order&#39; \|\| task?.pool === &#39;orders&#39;; |
| recovered | const | 386 | no | const recovered = []; |
| recoveredIds | const | 387 | no | const recoveredIds = new Set(); |
| recoveredTaskIds | const | 388 | no | const recoveredTaskIds = new Set(); |
| startedMs | const | 391 | no | const startedMs = toMs(attempt.startedAt); |
| ageMs | const | 392 | no | const ageMs = startedMs === null ? null : Math.max(0, nowMs - startedMs); |
| ageMinutes | const | 393 | no | const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000); |
| reason | variable | 394 | no | let reason = null; |
| inflightBySeat | const | 416 | no | const inflightBySeat = new Map(); |
| inflightTaskIds | const | 417 | no | const inflightTaskIds = new Set(); |
| pendingCount | variable | 418 | no | let pendingCount = 0; |
| startedMs | const | 422 | no | const startedMs = toMs(attempt.startedAt); |
| ageMs | const | 423 | no | const ageMs = startedMs === null ? null : Math.max(0, nowMs - startedMs); |
| seatKey | const | 425 | no | const seatKey = String(attempt.seat ?? &#39;&#39;).trim().toLowerCase(); |
| decisions | const | 431 | no | const decisions = []; |
| consumed | const | 432 | no | const consumed = new Set(); |
| reportedEmpty | const | 433 | no | const reportedEmpty = new Set(); |
| rosterIds | const | 434 | no | const rosterIds = new Set(); |
| seenSeats | const | 435 | no | const seenSeats = new Set(); |
| wakes | variable | 436 | no | let wakes = 0; |
| seatId | const | 440 | no | const seatId = String(seat.id ?? seat.seat ?? seat.name ?? &#39;&#39;).trim().toLowerCase(); |
| flight | const | 455 | no | const flight = inflightBySeat.get(seatId); |
| beat | const | 467 | no | const beat = heartbeat({ now: nowIso, lastSeenAt: lastSeenFor(seat, opts.live, nowMs), idleMs: opts.idleMs, lastTurnMs: opts.lastTurnMs, |
| eligible | function | 495 | no | const eligible = (task) =&gt; { |
| id | const | 497 | no | const id = taskIdOf(task); |
| bound | const | 500 | no | const bound = taskSeatOf(task); |
| candidates | const | 505 | no | const candidates = taskList.filter((task) =&gt; eligible(task) &amp;&amp; buildPromptSlice(task) !== null); |
| task | const | 506 | no | const task = candidates.find((candidate) =&gt; taskSeatOf(candidate) === seatId) ?? candidates[0] ?? null; |
| unusable | const | 508 | no | const unusable = taskList.find((candidate) =&gt; eligible(candidate) &amp;&amp; buildPromptSlice(candidate) === null); |
| unusableId | const | 509 | no | const unusableId = unusable ? taskIdOf(unusable) : null; |
| unusableCount | const | 520 | no | const unusableCount = taskList.filter((candidate) =&gt; eligible(candidate) &amp;&amp; buildPromptSlice(candidate) === null).length; |
| id | const | 532 | no | const id = taskIdOf(task); |
| slice | const | 533 | no | const slice = buildPromptSlice(task); |
| funded | const | 535 | no | const funded = findFundedProvider(providers, opts); |
| bound | const | 575 | no | const bound = taskSeatOf(task); |
| id | const | 576 | no | const id = taskIdOf(task); |
| waiting | const | 603 | no | const waiting = taskList.find((task) =&gt; { if (isBlockedTask(task) \|\| !isAuthoredOrder(task)) return false; const id = taskIdOf(task); return id &amp;&amp; !consumed.has(id) &amp;&amp; !inflightTaskIds.has(id) &amp;&amp; !re… |
| id | const | 605 | no | const id = taskIdOf(task); |
| wakeCount | const | 628 | no | const wakeCount = decisions.filter((d) =&gt; d.action === &#39;WAKE&#39;).length; |
| INVESTIGATION_SCHEMA | const | 662 | yes | export const INVESTIGATION_SCHEMA = &#39;hq.autonomy-investigation/1&#39;; |
| investigateObjective | function | 690 | yes | export function investigateObjective({ task, db, compose = composeContext, verify = verifyContext, |
| objective | const | 700 | no | const objective = String(task ?? &#39;&#39;).trim(); |
| findings | const | 704 | no | const findings = []; |
| trail | const | 705 | no | const trail = []; |
| bundle | variable | 708 | no | let bundle = null; |
| composed | variable | 709 | no | let composed = false; |
| composer | const | 711 | no | const composer = compose ?? composeContext; |
| verification | variable | 724 | no | let verification = null; |
| verifier | const | 726 | no | const verifier = verify ?? verifyContext; |
| route | variable | 738 | no | let route = null; |
| sources | const | 753 | no | const sources = Array.isArray(bundle?.sources) ? bundle.sources : []; |
| sourceDetails | const | 754 | no | const sourceDetails = sources.map((source) =&gt; ({ ref: String(source.ref ?? &#39;&#39;), path: String(source.path ?? &#39;&#39;), lines: Array.isArray(source.lines) ? source.lines : [1, 1], reason: String(source.reas… |
| verdict | const | 769 | no | const verdict = composed &amp;&amp; verification ? (verification.valid === true ? (sources.length === 0 ? &#39;incomplete: bundle verified but gathered no source to anchor a claim to&#39; : &#39;defensible: composed and… |
| summarizeInvestigation | function | 799 | yes | export function summarizeInvestigation(investigation) { |
| lines | const | 803 | no | const lines = []; |
| v | const | 809 | no | const v = investigation.verification; |
| r | const | 811 | no | const r = investigation.route; |
| autonomousInvestigate | function | 845 | yes | export function autonomousInvestigate({ objective, composeContext: compose, verifyContext: verify, routeAsk: route, db, now, } = {}) { |
| result | const | 864 | no | const result = investigateObjective({ task: objective, db, compose, verify, |
| trail | const | 875 | no | const trail = result.sourceDetails.map((s) =&gt; ({ ref: s.ref, path: s.path, lines: s.lines, reason: s.reason, |
| verification | const | 889 | no | const verification = result.verification; |
| valid | const | 890 | no | const valid = verification &amp;&amp; verification.valid === true; |
| changed | const | 891 | no | const changed = Array.isArray(verification?.changed) ? verification.changed : []; |
| anchored | const | 892 | no | const anchored = trail.every((t) =&gt; Boolean(t.ref) &amp;&amp; Boolean(t.path) &amp;&amp; Boolean(t.sha256)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./seat-heartbeat.mjs | import | 14 | [hq/lib/seat-heartbeat.mjs](./seat-heartbeat.mjs.md) |
| ./model-router.mjs | import | 15 | [hq/lib/model-router.mjs](./model-router.mjs.md) |
| ./context.mjs | import | 16 | [hq/lib/context.mjs](./context.mjs.md) |
| ./ask.mjs | import | 17 | [hq/lib/ask.mjs](./ask.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-100-autonomous-investigation.mjs](../aii/fixtures/HQ-100-autonomous-investigation.mjs.md) | ../../lib/autonomy.mjs |
| [hq/bin/autonomy.mjs](../bin/autonomy.mjs.md) | ../lib/autonomy.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Autonomy dispatch planner — decide which seat may take which open task this cycle, as a pure function of roster, queue, provider funding, journal and an injected clock |
| 4 | owner | autonomy-dispatcher | — | autonomy-dispatcher |
| 5 | task | — | — | autonomy-lane-a1 |
| 6 | invariant | — | — | pure: no fs, no spawn, no clock read. `now` is an argument and is required. |
| 7 | invariant | — | — | liveness is owned by seat-heartbeat.mjs; this module never compares an age to a window of its own invention |
| 8 | invariant | — | — | an `unknown` heartbeat is not `idle`: evidence is not inference, so it never becomes a wake |
| 9 | invariant | — | — | one slice per seat per cycle; a task is consumed by exactly one wake decision |
| 10 | invariant | — | — | every refusal is a stable code, never free text alone |
| 11 | see | — | hq/lib/seat-heartbeat.mjs | hq/lib/seat-heartbeat.mjs |
| 12 | see | — | hq/lib/channel-seats.mjs | hq/lib/channel-seats.mjs |
| 645 | context | — | — | Autonomous investigation — given a complex objective, independently |
| 655 | invariant | — | — | every finding carries a `where` anchor (file:line ref) so the |
| 657 | invariant | — | — | verification is a pass/fail on recomputed digests, never trusted |
| 659 | see | — | hq/lib/context.mjs | hq/lib/context.mjs composeContext/verifyContext |
| 660 | see | — | hq/lib/ask.mjs | hq/lib/ask.mjs routeAsk |

## Excerpt

```javascript
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
```

_First 80 of 902 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
