# File: hq/lib/approvals.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/approvals.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13226 B |
| Lines | 348 |
| Hash | e16e6613cd38 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| APPROVAL_SCHEMA | const | 18 | yes | export const APPROVAL_SCHEMA = &#39;hq.approval/1&#39;; |
| DEFAULT_TTL_MINUTES | const | 21 | yes | export const DEFAULT_TTL_MINUTES = 60; |
| STATES | const | 25 | yes | export const STATES = [&#39;pending&#39;, &#39;allowed&#39;, &#39;denied&#39;, &#39;expired&#39;]; |
| refuse | function | 58 | no | function refuse(code, detail) { |
| text | function | 62 | no | function text(value) { |
| stamp | function | 68 | no | function stamp(now) { |
| requireFile | function | 75 | no | function requireFile(file, fn) { |
| approvalId | function | 82 | yes | export function approvalId(at = nowISO()) { |
| appendLine | function | 89 | no | function appendLine(file, record) { |
| existing | const | 92 | no | const existing = readFileSync(file, &#39;utf8&#39;); |
| readLines | function | 106 | no | function readLines(file) { |
| lines | const | 109 | no | const lines = []; |
| corrupt | variable | 110 | no | let corrupt = 0; |
| parsed | const | 114 | no | const parsed = JSON.parse(raw); |
| isExpired | function | 125 | no | function isExpired(request, now) { |
| expires | const | 126 | no | const expires = Date.parse(String(request?.expiresAt ?? &#39;&#39;)); |
| rowOf | function | 140 | no | function rowOf(request, decision, now) { |
| expired | const | 141 | no | const expired = isExpired(request, now); |
| state | variable | 143 | no | let state = &#39;pending&#39;; |
| fold | function | 169 | no | function fold(file, now) { |
| read | const | 170 | no | const read = readLines(file); |
| requests | const | 172 | no | const requests = new Map(); |
| decisions | const | 174 | no | const decisions = new Map(); |
| order | const | 176 | no | const order = []; |
| id | const | 178 | no | const id = text(record.id); |
| orphans | variable | 188 | no | let orphans = 0; |
| rows | const | 191 | no | const rows = order.map((request) =&gt; rowOf(request, decisions.get(String(request.id)) ?? null, now)).reverse(); |
| expiryOf | function | 196 | no | function expiryOf(request, at) { |
| explicit | const | 197 | no | const explicit = text(request.expiresAt); |
| parsed | const | 199 | no | const parsed = Date.parse(explicit); |
| raw | const | 203 | no | const raw = request.expiresInMinutes ?? request.ttlMinutes ?? DEFAULT_TTL_MINUTES; |
| minutes | const | 204 | no | const minutes = Number(raw); |
| enqueue | function | 221 | yes | export function enqueue({ file, request = {}, now = nowISO(), id } = {}) { |
| queue | const | 222 | no | const queue = requireFile(file, &#39;enqueue&#39;); |
| action | const | 223 | no | const action = text(request.action); |
| target | const | 225 | no | const target = text(request.target); |
| at | const | 228 | no | const at = stamp(now); |
| expires | const | 229 | no | const expires = expiryOf(request, at); |
| decide | function | 254 | yes | export function decide({ file, id, decision, by = null, note = null, now = nowISO() } = {}) { |
| queue | const | 255 | no | const queue = requireFile(file, &#39;decide&#39;); |
| wanted | const | 256 | no | const wanted = text(id); |
| verdict | const | 258 | no | const verdict = text(decision); |
| at | const | 263 | no | const at = stamp(now); |
| folded | const | 264 | no | const folded = fold(queue, at); |
| request | const | 265 | no | const request = folded.requests.get(wanted); |
| prior | const | 268 | no | const prior = folded.decisions.get(wanted); |
| list | function | 305 | yes | export function list({ file, state: filter = null, now = nowISO() } = {}) { |
| queue | const | 306 | no | const queue = requireFile(file, &#39;list&#39;); |
| at | const | 307 | no | const at = stamp(now); |
| wanted | const | 308 | no | const wanted = text(filter).toLowerCase() \|\| &#39;all&#39;; |
| known | const | 309 | no | const known = [&#39;all&#39;, &#39;decided&#39;, ...STATES]; |
| folded | const | 312 | no | const folded = fold(queue, at); |
| rows | const | 313 | no | const rows = folded.rows.filter((row) =&gt; { if (wanted === &#39;all&#39;) return true; if (wanted === &#39;decided&#39;) return row.state === &#39;allowed&#39; \|\| row.state === &#39;denied&#39;; return row.state === wanted; }); |
| state | function | 327 | yes | export function state({ file, now = nowISO() } = {}) { |
| queue | const | 328 | no | const queue = requireFile(file, &#39;state&#39;); |
| at | const | 329 | no | const at = stamp(now); |
| folded | const | 330 | no | const folded = fold(queue, at); |
| counts | const | 332 | no | const counts = { total: folded.rows.length, pending: 0, allowed: 0, denied: 0, expired: 0 }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 13 | external |
| node:crypto | import | 14 | external |
| node:path | import | 15 | external |
| ./util.mjs | import | 16 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/comms-roof.mjs](./comms-roof.mjs.md) | ./approvals.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Approval queue for agent actions — append-only JSONL of requests and decisions, expiry applied when the queue is read |
| 4 | owner | owner | — | owner |
| 5 | task | — | — | approvals |
| 6 | why | — | — | An action that needs owner consent needs a record of who asked, what it would touch, and who decided. |
| 7 | invariant | — | — | the file is append-only: a request and a decision are new lines, never a rewrite of an earlier one |
| 8 | invariant | — | — | a request is decided once; a second decision on the same id is refused, never overwritten |
| 9 | invariant | — | — | expiry is evaluated at read time, so a request that went stale cannot be approved afterwards |
| 10 | invariant | — | — | recording an approval is not an effect: nothing here sends, approves, executes or mutates provider state |
| 11 | see | — | doc:docs/SYNC-BUS.md | doc:docs/SYNC-BUS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Approval queue for agent actions — append-only JSONL of requests and decisions, expiry applied when the queue is read
 * @hq:owner owner
 * @hq:task approvals
 * @hq:why An action that needs owner consent needs a record of who asked, what it would touch, and who decided.
 * @hq:invariant the file is append-only: a request and a decision are new lines, never a rewrite of an earlier one
 * @hq:invariant a request is decided once; a second decision on the same id is refused, never overwritten
 * @hq:invariant expiry is evaluated at read time, so a request that went stale cannot be approved afterwards
 * @hq:invariant recording an approval is not an effect: nothing here sends, approves, executes or mutates provider state
 * @hq:see doc:docs/SYNC-BUS.md
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname } from 'node:path';
import { nowISO } from './util.mjs';

export const APPROVAL_SCHEMA = 'hq.approval/1';

// A request that sits unanswered for a day is stale consent, not consent.
export const DEFAULT_TTL_MINUTES = 60;

// Read-time states. `pending` and `expired` are derived, never written back:
// the request line records `state: 'pending'` as it was at enqueue time.
export const STATES = ['pending', 'allowed', 'denied', 'expired'];

/**
 * @typedef {object} ApprovalRequestInput
 * @property {string} [action] What the agent would do ("send", "push", "delete").
 * @property {string} [target] What it would touch.
 * @property {string|null} [requestedBy] The agent that asked.
 * @property {string|null} [scope] The boundary the grant covers, when narrower than the target.
 * @property {string} [expiresAt] Explicit ISO expiry; overrides the TTL.
 * @property {number} [expiresInMinutes] TTL from the enqueue time.
 * @property {number} [ttlMinutes] Alias for `expiresInMinutes`.
 */

/**
 * @typedef {object} ApprovalRow
 * @property {string} id
 * @property {string|null} at
 * @property {string|null} requestedBy
 * @property {string|null} action
 * @property {string|null} target
 * @property {string|null} scope
 * @property {string|null} expiresAt
 * @property {string} state One of STATES, as of the moment the queue was read.
 * @property {boolean} expired
 * @property {string|null} decidedAt
 * @property {string|null} decidedBy
 * @property {string|null} note
 */

// ---------------------------------------------------------------------------
// small primitives — the same shapes scripts/sync.mjs uses for its ledger
// ---------------------------------------------------------------------------

function refuse(code, detail) {
  return { ok: false, code, detail };
}

function text(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

/** An injected clock is an ISO string or a Date; anything else means "now". */
function stamp(now) {
  if (now instanceof Date) return now.toISOString();
  if (typeof now === 'string' && now) return now;
  return nowISO();
}

/** The queue path is injected by the caller, so this module owns no location. */
function requireFile(file, fn) {
  if (typeof file !== 'string' || !file.trim()) {
    throw new Error(`${fn} needs a file path for the approval queue`);
  }
  return file;
}
```

_First 80 of 349 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
