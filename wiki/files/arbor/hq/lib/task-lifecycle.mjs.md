# File: hq/lib/task-lifecycle.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/task-lifecycle.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14397 B |
| Lines | 416 |
| Hash | baf7be207ceb |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TASK_SCHEMA | const | 16 | yes | export const TASK_SCHEMA = &#39;hq.task-lifecycle/1&#39;; |
| VIEW_SCHEMA | const | 17 | yes | export const VIEW_SCHEMA = &#39;hq.task-lifecycle-view/1&#39;; |
| TASK_STATES | const | 20 | yes | export const TASK_STATES = /** @type {readonly string[]} */ ([&#39;open&#39;, &#39;claimed&#39;, &#39;working&#39;, &#39;done&#39;, &#39;failed&#39;]); |
| MOVES | const | 27 | yes | export const MOVES = /** @type {Record&lt;string, readonly string[]&gt;} */ ({ open: [&#39;claimed&#39;], claimed: [&#39;working&#39;, &#39;failed&#39;], working: [&#39;done&#39;, &#39;failed&#39;], done: [], |
| TaskLifecycleError | class | 40 | yes | export class TaskLifecycleError extends Error { |
| constructor | method | 45 | yes | constructor(code, message) { |
| ledgerFile | function | 58 | no | function ledgerFile(target) { |
| p | const | 59 | no | const p = String(target ?? &#39;&#39;).trim(); |
| text | function | 65 | no | function text(value) { |
| refuse | function | 77 | no | function refuse(code, detail, extra = {}) { |
| taskId | function | 87 | yes | export function taskId({ title, target, at, seq = 0 } = {}) { |
| stamp | const | 88 | no | const stamp = String(at).replace(/[-:]/g, &#39;&#39;).replace(/\\.\\d+Z$/, &#39;Z&#39;); |
| digest | const | 89 | no | const digest = sha256(`${title}\|${target}\|${at}\|${seq}`).slice(0, 8); |
| open | function | 103 | yes | export function open({ file, task, at = nowISO() } = /** @type {any} */ ({})) { |
| ledger | const | 104 | no | const ledger = ledgerFile(file); |
| t | const | 105 | no | const t = task &amp;&amp; typeof task === &#39;object&#39; ? task : {}; |
| title | const | 107 | no | const title = text(t.title); |
| target | const | 110 | no | const target = text(t.target); |
| atISO | const | 115 | no | const atISO = normalizeAt(at); |
| seq | const | 116 | no | const seq = readLedger(ledger).length; |
| transition | function | 148 | yes | export function transition({ file, id, to, by, note, evidence, at = nowISO() } = /** @type {any} */ ({})) { |
| ledger | const | 149 | no | const ledger = ledgerFile(file); |
| taskText | const | 150 | no | const taskText = text(id); |
| own | const | 153 | no | const own = readLedger(ledger).filter((row) =&gt; row.id === taskText); |
| toState | const | 157 | no | const toState = text(to).toLowerCase(); |
| legal | const | 158 | no | const legal = MOVES[from] ?? []; |
| atISO | const | 171 | no | const atISO = normalizeAt(at); |
| byText | const | 172 | no | const byText = text(by) \|\| &#39;unattributed&#39;; |
| entries | const | 173 | no | const entries = normalizeEvidence(evidence, { at: atISO, by: byText }); |
| recorded | const | 174 | no | const recorded = own.reduce((n, row) =&gt; n + (Array.isArray(row.evidence) ? row.evidence.length : 0), 0); |
| have | const | 175 | no | const have = recorded + entries.length; |
| view | function | 222 | yes | export function view({ file, state } = /** @type {any} */ ({})) { |
| ledger | const | 223 | no | const ledger = ledgerFile(file); |
| rows | const | 224 | no | const rows = readLedger(ledger); |
| want | const | 225 | no | const want = text(state).toLowerCase() \|\| &#39;all&#39;; |
| tasks | const | 232 | no | const tasks = project(rows); |
| counts | const | 234 | no | const counts = { total: tasks.length, open: 0, claimed: 0, working: 0, done: 0, failed: 0 }; |
| ordered | const | 237 | no | const ordered = tasks |
| visible | const | 241 | no | const visible = want === &#39;all&#39; ? ordered : ordered.filter((task) =&gt; task.state === want); |
| currentState | function | 256 | no | function currentState(rows) { |
| state | variable | 257 | no | let state = &#39;open&#39;; |
| project | function | 269 | no | function project(rows) { |
| tasks | const | 271 | no | const tasks = []; |
| byId | const | 272 | no | const byId = new Map(); |
| task | const | 276 | no | const task = { |
| task | const | 294 | no | const task = byId.get(row.id); |
| publicTask | function | 309 | no | function publicTask(task) { |
| normalizeEvidence | function | 333 | no | function normalizeEvidence(evidence, { at, by }) { |
| list | const | 334 | no | const list = evidence === undefined \|\| evidence === null ? [] : Array.isArray(evidence) ? evidence : [evidence]; |
| entries | const | 336 | no | const entries = []; |
| value | const | 339 | no | const value = item.trim(); |
| appendRecord | function | 356 | no | function appendRecord(ledger, record) { |
| existing | const | 359 | no | const existing = readFileSync(ledger, &#39;utf8&#39;); |
| readLedger | function | 374 | no | function readLedger(ledger) { |
| lines | const | 376 | no | const lines = readFileSync(ledger, &#39;utf8&#39;).split(/\\r?\\n/); |
| rows | const | 378 | no | const rows = []; |
| value | const | 380 | no | const value = line.trim(); |
| doc | variable | 383 | no | let doc; |
| normalizeAt | function | 405 | no | function normalizeAt(at) { |
| parsed | const | 406 | no | const parsed = at instanceof Date ? at : new Date(String(at)); |
| timeOf | function | 412 | no | function timeOf(at) { |
| t | const | 413 | no | const t = Date.parse(String(at)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 12 | external |
| node:path | import | 13 | external |
| ./util.mjs | import | 14 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/comms-roof.mjs](./comms-roof.mjs.md) | ./task-lifecycle.mjs |
| [hq/lib/mission-sources.mjs](./mission-sources.mjs.md) | ./task-lifecycle.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Typed task lifecycle between agents — open, claim, work, close — one append-only JSONL ledger where the current state is the last transition |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | task-lifecycle |
| 6 | invariant | — | — | append-only: a row is written once and never rewritten; state is derived from the tail of the ledger, never stored and patched |
| 7 | invariant | — | — | a task closes on evidence, not on a claim: `done` without at least one evidence entry is refused (NO_EVIDENCE) |
| 8 | invariant | — | — | only the declared moves are legal; an illegal move is refused and writes nothing (ILLEGAL_TRANSITION) |
| 9 | invariant | — | — | this module owns the one file the caller names; nothing here sends, approves, or touches receipts |
| 10 | see | — | doc:docs/AGENT-BUS.md | doc:docs/AGENT-BUS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Typed task lifecycle between agents — open, claim, work, close — one append-only JSONL ledger where the current state is the last transition
 * @hq:owner channel-manager
 * @hq:task task-lifecycle
 * @hq:invariant append-only: a row is written once and never rewritten; state is derived from the tail of the ledger, never stored and patched
 * @hq:invariant a task closes on evidence, not on a claim: `done` without at least one evidence entry is refused (NO_EVIDENCE)
 * @hq:invariant only the declared moves are legal; an illegal move is refused and writes nothing (ILLEGAL_TRANSITION)
 * @hq:invariant this module owns the one file the caller names; nothing here sends, approves, or touches receipts
 * @hq:see doc:docs/AGENT-BUS.md
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { nowISO, sha256 } from './util.mjs';

export const TASK_SCHEMA = 'hq.task-lifecycle/1';
export const VIEW_SCHEMA = 'hq.task-lifecycle-view/1';

/** Every state a task can hold. `done` and `failed` are terminal because they have no legal move out. */
export const TASK_STATES = /** @type {readonly string[]} */ (['open', 'claimed', 'working', 'done', 'failed']);

/**
 * The whole policy in one table. A state whose list is empty is terminal.
 * `claimed -> done` is absent on purpose: work that never started cannot be
 * finished, so it must pass through `working` or report `failed`.
 */
export const MOVES = /** @type {Record<string, readonly string[]>} */ ({
  open: ['claimed'],
  claimed: ['working', 'failed'],
  working: ['done', 'failed'],
  done: [],
  failed: [],
});

/**
 * A ledger that cannot be read must not read as "nothing happened". Every
 * refusal the caller can act on carries a code so a UI branches on the code,
 * not on prose.
 */
export class TaskLifecycleError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'TaskLifecycleError';
    this.code = code;
  }
}

/**
 * The ledger file is named by the caller — no default location, so nothing
 * writes anywhere by omission.
 *
 * @param {string} target
 */
function ledgerFile(target) {
  const p = String(target ?? '').trim();
  if (!p) throw new TaskLifecycleError('NO_FILE', 'a task ledger path is required; pass the .jsonl file the caller owns');
  return p;
}

/** @param {any} value */
function text(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

/**
 * A refusal the caller can branch on. Nothing is written on this path.
 *
 * @param {string} code
 * @param {string} detail
 * @param {Record<string, any>} [extra]
 */
function refuse(code, detail, extra = {}) {
  return { ok: false, code, detail, ...extra };
}
```

_First 80 of 417 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
