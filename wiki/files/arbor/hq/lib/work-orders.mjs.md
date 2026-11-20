# File: hq/lib/work-orders.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/work-orders.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15892 B |
| Lines | 438 |
| Hash | c95a010bf5c0 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORK_ORDER_SCHEMA | const | 16 | yes | export const WORK_ORDER_SCHEMA = &#39;hq.work-order/1&#39;; |
| WORK_ORDER_STATUSES | const | 19 | yes | export const WORK_ORDER_STATUSES = Object.freeze([&#39;open&#39;, &#39;claimed&#39;, &#39;done&#39;, &#39;blocked&#39;, &#39;cancelled&#39;]); |
| DEAD_STATUSES | const | 22 | no | const DEAD_STATUSES = new Set([&#39;blocked&#39;, &#39;cancelled&#39;]); |
| FINAL_STATUSES | const | 25 | no | const FINAL_STATUSES = new Set([&#39;done&#39;, &#39;blocked&#39;, &#39;cancelled&#39;]); |
| UNBOUND_SEATS | const | 28 | no | const UNBOUND_SEATS = new Set([&#39;&#39;, &#39;unbound&#39;, &#39;any&#39;, &#39;*&#39;, &#39;none&#39;]); |
| WORK_ORDER_CODES | const | 34 | yes | export const WORK_ORDER_CODES = Object.freeze([ &#39;BAD_ORDER&#39;, &#39;MISSING_ID&#39;, &#39;DUPLICATE_ID&#39;, &#39;MISSING_TASK&#39;, |
| PROOF_COMMAND_RE | const | 61 | no | const PROOF_COMMAND_RE = /^(?:bun\|bunx\|node\|npm\|npx\|pnpm\|yarn\|deno\|python[0-9.]*\|py\|cargo\|rustc\|go\|dotnet\|tsc\|git\|gh\|curl\|wget\|pwsh\|powershell\|cmd\|sh\|bash\|hq\|zcode\|es\|du\|handle\|fclones\|sqlite3)(?:\\.(… |
| textOf | function | 64 | no | function textOf(value) { |
| toMs | function | 75 | no | function toMs(value) { |
| text | const | 79 | no | const text = value.trim(); |
| parsed | const | 81 | no | const parsed = Date.parse(text); |
| isTimestamp | function | 88 | no | function isTimestamp(value) { |
| ordersOf | function | 99 | no | function ordersOf(doc) { |
| depsOf | function | 104 | no | function depsOf(order) { |
| indexOrders | function | 115 | no | function indexOrders(orders) { |
| index | const | 117 | no | const index = new Map(); |
| id | const | 119 | no | const id = textOf(order?.id); |
| hit | const | 121 | no | const hit = index.get(id); |
| normalizeSeat | function | 129 | no | function normalizeSeat(seat) { |
| text | const | 132 | no | const text = seat.trim(); |
| fail | function | 138 | no | function fail(code, message) { |
| validateOrder | function | 151 | yes | export function validateOrder(order, doc) { |
| errors | const | 153 | no | const errors = []; |
| add | function | 155 | no | const add = (code) =&gt; { |
| id | const | 164 | no | const id = textOf(order.id); |
| proof | const | 169 | no | const proof = textOf(order.proofCommand); |
| deps | const | 177 | no | const deps = order.dependsOn; |
| depsWellFormed | variable | 178 | no | let depsWellFormed = true; |
| index | const | 187 | no | const index = indexOrders(ordersOf(doc)); |
| key | const | 189 | no | const key = textOf(dep); |
| hit | const | 190 | no | const hit = index.get(key); |
| state | const | 195 | no | const state = textOf(hit.order?.status); |
| validateDoc | function | 211 | yes | export function validateDoc(doc) { |
| errors | const | 213 | no | const errors = []; |
| duplicateIds | const | 215 | no | const duplicateIds = []; |
| add | function | 217 | no | const add = (code) =&gt; { |
| openOrders | function | 251 | yes | export function openOrders(doc) { |
| orders | const | 252 | no | const orders = ordersOf(doc); |
| index | const | 253 | no | const index = indexOrders(orders); |
| satisfied | function | 255 | no | const satisfied = (dep) =&gt; { |
| hit | const | 256 | no | const hit = index.get(textOf(dep)); |
| openOrdersDuplicatingCompleted | function | 276 | yes | export function openOrdersDuplicatingCompleted(doc) { |
| orders | const | 277 | no | const orders = ordersOf(doc); |
| done | const | 278 | no | const done = orders.filter((order) =&gt; textOf(order?.status) === &#39;done&#39;); |
| open | const | 279 | no | const open = orders.filter((order) =&gt; textOf(order?.status) === &#39;open&#39;); |
| dupes | const | 282 | no | const dupes = []; |
| seen | const | 283 | no | const seen = new Set(); |
| openId | const | 286 | no | const openId = textOf(openOrder.id); |
| doneId | const | 288 | no | const doneId = textOf(doneOrder.id); |
| on | variable | 289 | no | let on = null; |
| toTask | function | 309 | yes | export function toTask(order) { |
| renderOrders | function | 328 | yes | export function renderOrders(doc) { |
| orders | const | 329 | no | const orders = ordersOf(doc); |
| lines | const | 330 | no | const lines = orders.map((order) =&gt; [ textOf(order?.id) \|\| &#39;(no id)&#39;, textOf(order?.status) \|\| &#39;(no status)&#39;, normalizeSeat(order?.seat) ?? &#39;any&#39;, textOf(order?.file) \|\| &#39;(no file)&#39;, |
| counts | const | 337 | no | const counts = WORK_ORDER_STATUSES |
| formatDoc | function | 345 | yes | export function formatDoc(doc) { |
| pickOrder | function | 356 | no | function pickOrder(doc, id) { |
| matches | const | 357 | no | const matches = ordersOf(doc).filter((order) =&gt; textOf(order?.id) === id); |
| replaceOrder | function | 369 | no | function replaceOrder(doc, id, next) { |
| orders | const | 370 | no | const orders = ordersOf(doc).map((order) =&gt; (textOf(order?.id) === id ? next : order)); |
| stampOf | function | 381 | no | function stampOf(at, fn) { |
| ms | const | 382 | no | const ms = toMs(at); |
| claimOrder | function | 396 | yes | export function claimOrder(doc, id, { at, seat } = /** @type {any} */ ({})) { |
| orderId | const | 397 | no | const orderId = textOf(id); |
| atIso | const | 399 | no | const atIso = stampOf(at, &#39;claimOrder&#39;); |
| order | const | 400 | no | const order = pickOrder(doc, orderId); |
| state | const | 401 | no | const state = textOf(order.status); |
| next | const | 405 | no | const next = { |
| completeOrder | function | 423 | yes | export function completeOrder(doc, id, { at, status = &#39;done&#39; } = /** @type {any} */ ({})) { |
| orderId | const | 424 | no | const orderId = textOf(id); |
| atIso | const | 430 | no | const atIso = stampOf(at, &#39;completeOrder&#39;); |
| order | const | 431 | no | const order = pickOrder(doc, orderId); |
| state | const | 432 | no | const state = textOf(order.status); |
| next | const | 436 | no | const next = { ...order, status: final, completedAt: atIso }; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-084-duplicate-completed-work.mjs](../aii/fixtures/HQ-084-duplicate-completed-work.mjs.md) | ../../lib/work-orders.mjs |
| [hq/bin/autonomy.mjs](../bin/autonomy.mjs.md) | ../lib/work-orders.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/work-orders.mjs |
| [hq/lib/mission-sources.mjs](./mission-sources.mjs.md) | ./work-orders.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Authored typed work-order queue — the dispatchable record of what to build, every order naming the one file it may write and the command that proves it |
| 4 | owner | autonomy-dispatcher | — | autonomy-dispatcher |
| 5 | task | — | — | work-orders-w1 |
| 6 | invariant | — | — | pure: no fs, no spawn, no clock read. `at` is an argument wherever a transition stamps a time. |
| 7 | invariant | — | — | an authored order is not an observation: only this document names `file` and `proofCommand`, because transcripts discard the tool calls that would have supplied them |
| 8 | invariant | — | — | every refusal is a stable code from WORK_ORDER_CODES, never free prose; the same input always yields the same code list in the same order |
| 9 | invariant | — | — | transitions return a NEW document and never mutate the argument; an ambiguous (duplicated) id is refused rather than guessed |
| 10 | invariant | — | — | `dependsOn` gates dispatch, not validity: a pending dependency is a normal authored plan, only a dead one (blocked/cancelled/self) is a defect |
| 11 | see | — | hq/lib/autonomy.mjs | hq/lib/autonomy.mjs — buildPromptSlice is the consumer of toTask() |
| 12 | see | — | hq/work/orders.json | hq/work/orders.json — the live queue this module validates |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Authored typed work-order queue — the dispatchable record of what to build, every order naming the one file it may write and the command that proves it
 * @hq:owner autonomy-dispatcher
 * @hq:task work-orders-w1
 * @hq:invariant pure: no fs, no spawn, no clock read. `at` is an argument wherever a transition stamps a time.
 * @hq:invariant an authored order is not an observation: only this document names `file` and `proofCommand`, because transcripts discard the tool calls that would have supplied them
 * @hq:invariant every refusal is a stable code from WORK_ORDER_CODES, never free prose; the same input always yields the same code list in the same order
 * @hq:invariant transitions return a NEW document and never mutate the argument; an ambiguous (duplicated) id is refused rather than guessed
 * @hq:invariant `dependsOn` gates dispatch, not validity: a pending dependency is a normal authored plan, only a dead one (blocked/cancelled/self) is a defect
 * @hq:see hq/lib/autonomy.mjs — buildPromptSlice is the consumer of toTask()
 * @hq:see hq/work/orders.json — the live queue this module validates
 */

/** The only schema id this module understands. */
export const WORK_ORDER_SCHEMA = 'hq.work-order/1';

/** The whole legal status vocabulary. A status outside this list is BAD_STATUS. */
export const WORK_ORDER_STATUSES = Object.freeze(['open', 'claimed', 'done', 'blocked', 'cancelled']);

/** Statuses a dependency can never leave, so a dependent order can never become dispatchable. */
const DEAD_STATUSES = new Set(['blocked', 'cancelled']);

/** The statuses completeOrder may land on: finishing is done, blocked or cancelled, never open. */
const FINAL_STATUSES = new Set(['done', 'blocked', 'cancelled']);

/** A seat marker meaning "any seat". Mirrors the UNBOUND_SEATS set autonomy applies. */
const UNBOUND_SEATS = new Set(['', 'unbound', 'any', '*', 'none']);

/**
 * The whole refusal vocabulary. A code outside this list is a bug, and a code is
 * the contract: it is stable across wording changes.
 */
export const WORK_ORDER_CODES = Object.freeze([
  'BAD_ORDER',
  'MISSING_ID',
  'DUPLICATE_ID',
  'MISSING_TASK',
  'MISSING_FILE',
  'MISSING_PROOF',
  'BAD_PROOF_COMMAND',
  'BAD_STATUS',
  'BAD_CREATED_AT',
  'BAD_SEAT',
  'MISSING_DEP',
  'DEP_NOT_FOUND',
  'DEP_NOT_DONE',
  'BAD_SCHEMA',
  'BAD_ORDERS',
  'ORDER_NOT_FOUND',
  'ILLEGAL_TRANSITION',
  'MISSING_AT',
]);

/**
 * A proof must be a command, not prose. Same prefix set autonomy applies
 * (including its extra tool aliases), with two deliberate tightenings: a real
 * separator must follow the tool name, so `google-chrome` is not read as `go`;
 * and a Windows executable suffix (`pwsh.exe`) is accepted rather than refused.
 */
const PROOF_COMMAND_RE = /^(?:bun|bunx|node|npm|npx|pnpm|yarn|deno|python[0-9.]*|py|cargo|rustc|go|dotnet|tsc|git|gh|curl|wget|pwsh|powershell|cmd|sh|bash|hq|zcode|es|du|handle|fclones|sqlite3)(?:\.(?:exe|cmd|bat))?(?=\s|$)/i;

/** @param {any} value */
function textOf(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Read a timestamp as epoch ms. Anything unreadable is null, never a guess — the
 * same rule autonomy and seat-heartbeat apply to an observation.
 *
 * @param {any} value
 * @returns {number|null}
 */
function toMs(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
```

_First 80 of 439 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
