# File: hq/lib/session-parts.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/session-parts.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14783 B |
| Lines | 375 |
| Hash | 7e4c769a7fb0 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| nodeRequire | const | 29 | no | const nodeRequire = createRequire(import.meta.url); |
| SCHEMA | const | 31 | yes | export const SCHEMA = &#39;hq.session-parts/1&#39;; |
| DEFAULT_LIMIT | const | 34 | yes | export const DEFAULT_LIMIT = 20; |
| FILE_INPUT_FIELDS | const | 37 | yes | export const FILE_INPUT_FIELDS = Object.freeze([&#39;file_path&#39;, &#39;path&#39;, &#39;notebook_path&#39;]); |
| openReadOnly | function | 51 | no | function openReadOnly(dbPath) { |
| releaseStatement | function | 61 | no | function releaseStatement(stmt) { |
| queryRow | function | 79 | no | function queryRow(db, sql, params = []) { |
| stmt | const | 80 | no | const stmt = db.prepare(sql); |
| queryRows | function | 96 | no | function queryRows(db, sql, params = []) { |
| stmt | const | 97 | no | const stmt = db.prepare(sql); |
| releaseDatabase | function | 116 | no | function releaseDatabase(db) { |
| toMs | function | 128 | no | function toMs(value) { |
| text | const | 132 | no | const text = value.trim(); |
| t | const | 134 | no | const t = Date.parse(text); |
| result | function | 146 | no | function result(session, turns, unparseable) { |
| parseStoredPart | function | 157 | no | function parseStoredPart(raw) { |
| value | const | 162 | no | const value = JSON.parse(raw); |
| normalizePart | function | 178 | no | function normalizePart(value, fallbackAt) { |
| state | const | 182 | no | const state = value.state &amp;&amp; typeof value.state === &#39;object&#39; ? value.state : {}; |
| input | const | 183 | no | const input = state.input &amp;&amp; typeof state.input === &#39;object&#39; ? state.input : {}; |
| tool | const | 184 | no | const tool = typeof value.tool === &#39;string&#39; &amp;&amp; value.tool ? value.tool : &#39;unknown&#39;; |
| callID | const | 185 | no | const callID = typeof value.callID === &#39;string&#39; ? value.callID : null; |
| start | const | 186 | no | const start = toMs(state.time?.start) ?? fallbackAt; |
| out | const | 189 | no | const out = [{ |
| hasOutput | const | 199 | no | const hasOutput = Object.prototype.hasOwnProperty.call(state, &#39;output&#39;) &amp;&amp; state.output !== undefined; |
| readSessionParts | function | 234 | yes | export function readSessionParts(opts = {}) { |
| dbPath | const | 235 | no | const dbPath = opts.dbPath \|\| DEFAULT_SESSION_DB; |
| sessionId | const | 236 | no | const sessionId = opts.sessionId; |
| nowMs | const | 241 | no | const nowMs = toMs(opts.now) ?? Date.now(); |
| requested | const | 242 | no | const requested = Number.isFinite(Number(opts.limit)) ? Math.floor(Number(opts.limit)) : DEFAULT_LIMIT; |
| limit | const | 243 | no | const limit = requested &gt; 0 ? requested : DEFAULT_LIMIT; |
| db | variable | 246 | no | let db; |
| row | const | 250 | no | const row = queryRow(db, &#39;SELECT id, title, time_updated FROM session WHERE id = ?&#39;, [sessionId]); |
| updated | const | 253 | no | const updated = toMs(row.time_updated); |
| session | const | 255 | no | const session = { |
| messages | const | 262 | no | const messages = queryRows(db, &#39;SELECT id, data, sequence FROM message WHERE session_id = ? ORDER BY sequence ASC, time_created ASC&#39;, [sessionId]); |
| partsByMessage | const | 265 | no | const partsByMessage = new Map(); |
| partRows | const | 266 | no | const partRows = queryRows(db, &#39;SELECT message_id, data, sequence, time_created FROM part WHERE session_id = ? ORDER BY sequence ASC, time_created ASC&#39;, [sessionId]); |
| key | const | 268 | no | const key = String(p.message_id); |
| bucket | const | 269 | no | const bucket = partsByMessage.get(key); |
| unparseable | variable | 274 | no | let unparseable = 0; |
| allTurns | const | 276 | no | const allTurns = []; |
| messageData | variable | 278 | no | let messageData = {}; |
| role | const | 286 | no | const role = typeof messageData.role === &#39;string&#39; &amp;&amp; messageData.role |
| parts | const | 291 | no | const parts = []; |
| parsed | const | 293 | no | const parsed = parseStoredPart(p.data); |
| text | const | 302 | no | const text = parts |
| turns | const | 310 | no | const turns = allTurns.length &gt; limit ? allTurns.slice(allTurns.length - limit) : allTurns; |
| firstAt | function | 325 | no | function firstAt(parts) { |
| toolCalls | function | 336 | yes | export function toolCalls(turns) { |
| out | const | 338 | no | const out = []; |
| touchedFiles | function | 360 | yes | export function touchedFiles(turns) { |
| out | const | 362 | no | const out = []; |
| seen | const | 363 | no | const seen = new Set(); |
| value | const | 366 | no | const value = call.input[field]; |
| path | const | 368 | no | const path = value.trim(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 22 | external |
| node:module | import | 23 | external |
| ./team-panel.mjs | import | 24 | [hq/lib/team-panel.mjs](./team-panel.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/dogfood.mjs](../bin/dogfood.mjs.md) | ../lib/session-parts.mjs |
| [hq/lib/dogfood.mjs](./dogfood.mjs.md) | ./session-parts.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Read one ZCode session from the local session DB with every part preserved, so a tool_use keeps its command/file input and its tool_result keeps its output instead of being filtered to plain text |
| 4 | owner | autonomy-dispatcher | — | autonomy-dispatcher |
| 5 | task | — | — | WO-001 |
| 6 | invariant | — | — | read-only: the DB is opened with `{ readonly: true }` and this module never writes, spawns, or reaches the network |
| 7 | invariant | — | — | no hidden clock: `now` is an injected argument. The single default read at the entry point exists only so a caller may omit it; every age computation uses the resolved value |
| 8 | invariant | — | — | a part that cannot be parsed is REPORTED in place as `type: &#39;unparseable&#39;` and counted on `unparseable`, never silently dropped. Dropping non-text parts is the defect this module exists to fix |
| 9 | invariant | — | — | `text` is the concatenation of `text` parts only; reasoning text never leaks into it |
| 10 | invariant | — | — | `touchedFiles` names only paths an actual tool_use input carried, never paths guessed from prose |
| 11 | invariant | — | — | deterministic release (WO-038): every statement is finalized and the connection is closed before the read returns, so the reader never leaves a lock on the live session DB |
| 12 | why | — | — | a cached statement outlives `close()`: SQLite defers the real close to the GC finalizer, and until that finalizer runs the OS handle is still open. Measured 2026-11-05 on Windows: an open reader make… |
| 13 | see | — | hq/lib/team-panel.mjs | hq/lib/team-panel.mjs |
| 14 | see | — | — | WO-038 |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Read one ZCode session from the local session DB with every part preserved, so a tool_use keeps its command/file input and its tool_result keeps its output instead of being filtered to plain text
 * @hq:owner autonomy-dispatcher
 * @hq:task WO-001
 * @hq:invariant read-only: the DB is opened with `{ readonly: true }` and this module never writes, spawns, or reaches the network
 * @hq:invariant no hidden clock: `now` is an injected argument. The single default read at the entry point exists only so a caller may omit it; every age computation uses the resolved value
 * @hq:invariant a part that cannot be parsed is REPORTED in place as `type: 'unparseable'` and counted on `unparseable`, never silently dropped. Dropping non-text parts is the defect this module exists to fix
 * @hq:invariant `text` is the concatenation of `text` parts only; reasoning text never leaks into it
 * @hq:invariant `touchedFiles` names only paths an actual tool_use input carried, never paths guessed from prose
 * @hq:invariant deterministic release (WO-038): every statement is finalized and the connection is closed before the read returns, so the reader never leaves a lock on the live session DB
 * @hq:why a cached statement outlives `close()`: SQLite defers the real close to the GC finalizer, and until that finalizer runs the OS handle is still open. Measured 2026-11-05 on Windows: an open reader makes the session DB unlinkable, which blocks the session writer from committing
 * @hq:see hq/lib/team-panel.mjs
 * @hq:see WO-038
 *
 * Storage vocabulary note: this ZCode build stores a whole tool exchange as one row with
 * `type: 'tool'`, `tool`, and a `state` object holding `input`, `output`, `status` and `time`.
 * Anthropic-style stores use separate `tool_use` / `tool_result` blocks. Both forms are accepted
 * on read and both are emitted in the `tool_use` / `tool_result` vocabulary, with the stored
 * `state` preserved verbatim on the `tool_use` side so nothing is lost in the mapping.
 */
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DEFAULT_SESSION_DB } from './team-panel.mjs';

// Loaded through createRequire so this module still loads under Node, where bun:sqlite is absent
// and the reader degrades to an empty result instead of a load-time crash. Same convention as
// team-panel.mjs, which owns the single answer to "where is the DB".
const nodeRequire = createRequire(import.meta.url);

export const SCHEMA = 'hq.session-parts/1';

/** Turns returned when the caller does not bound the read. */
export const DEFAULT_LIMIT = 20;

/** Input fields a tool call uses to name a file. Only these are read; nothing is inferred. */
export const FILE_INPUT_FIELDS = Object.freeze(['file_path', 'path', 'notebook_path']);

/**
 * @typedef {{ type: string, at: number|null, [key: string]: any }} Part
 * @typedef {{ role: string, at: number|null, text: string, parts: Part[] }} Turn
 * @typedef {{ id: string, title: string|null, updated: number|null, ageMinutes: number|null }} SessionInfo
 * @typedef {{ schema: string, session: SessionInfo|null, turns: Turn[], unparseable: number }} SessionParts
 * @typedef {{ tool: string, input: Record<string, any>, at: number|null, callID: string|null }} ToolCall
 */

/**
 * @param {string} dbPath
 * @returns {any}
 */
function openReadOnly(dbPath) {
  const { Database } = nodeRequire('bun:sqlite');
  return new Database(dbPath, { readonly: true });
}

/**
 * Finalize one statement so it cannot outlive the connection.
 *
 * @param {any} stmt
 */
function releaseStatement(stmt) {
  try { stmt?.finalize(); } catch { /* already finalized */ }
}

/**
 * Run one query and release its statement before returning.
 *
 * `db.query()` caches the statement on the connection, and a cached statement outlives
 * `close()`: SQLite defers the real close to the GC finalizer, so the OS handle stays open
 * until the collector runs — on Windows that keeps a lock on the live session DB and can
 * block the session writer from committing. `prepare()` is uncached and `finalize()` is
 * synchronous, so nothing is left for the collector to clean up.
 *
 * @param {any} db
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {any}
 */
function queryRow(db, sql, params = []) {
  const stmt = db.prepare(sql);
```

_First 80 of 376 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
