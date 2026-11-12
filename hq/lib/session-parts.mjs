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
  try {
    return stmt.get(...params);
  } finally {
    releaseStatement(stmt);
  }
}

/**
 * Run one query that returns many rows and release its statement before returning.
 *
 * @param {any} db
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {any[]}
 */
function queryRows(db, sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    return stmt.all(...params);
  } finally {
    releaseStatement(stmt);
  }
}

/**
 * Release the connection and every handle it holds, deterministically.
 *
 * Order matters. The statement cache is cleared first — that finalizes the statements
 * SQLite still owns — and only then is the connection closed. Closing a connection that
 * still owns a statement does not free the file: the close is deferred to the GC
 * finalizer, and the OS handle survives it. A handle that survives is a lock on the live
 * session DB, and the session writer cannot commit while it is held.
 *
 * @param {any} db
 */
function releaseDatabase(db) {
  if (!db) return;
  try { if (typeof db.clearQueryCache === 'function') db.clearQueryCache(); } catch { /* nothing cached */ }
  try { db.close(); } catch { /* already closed */ }
}

/**
 * Read a timestamp as epoch ms. Unreadable is null, never a guess.
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
    const t = Date.parse(text);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/**
 * @param {SessionInfo|null} session
 * @param {Turn[]} turns
 * @param {number} unparseable
 * @returns {SessionParts}
 */
function result(session, turns, unparseable) {
  return { schema: SCHEMA, session, turns, unparseable };
}

/**
 * Parse one stored part row. A failure is returned as data, not swallowed: the caller turns it
 * into a reported `unparseable` part.
 *
 * @param {any} raw
 * @returns {{ ok: boolean, value?: any, error?: string }}
 */
function parseStoredPart(raw) {
  if (raw === null || raw === undefined) return { ok: false, error: 'empty part data' };
  if (typeof raw !== 'string') return { ok: true, value: raw };
  if (!raw.trim()) return { ok: false, error: 'empty part data' };
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return { ok: false, error: 'part data is not a JSON object' };
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Map one stored part to the parts a reader sees. A stored `tool` row yields a `tool_use` and,
 * when the row carries an output, a `tool_result` after it. Every other type keeps its payload.
 *
 * @param {any} value
 * @param {number|null} fallbackAt
 * @returns {Part[]}
 */
function normalizePart(value, fallbackAt) {
  const type = typeof value.type === 'string' ? value.type : 'unknown';

  if (type === 'tool') {
    const state = value.state && typeof value.state === 'object' ? value.state : {};
    const input = state.input && typeof state.input === 'object' ? state.input : {};
    const tool = typeof value.tool === 'string' && value.tool ? value.tool : 'unknown';
    const callID = typeof value.callID === 'string' ? value.callID : null;
    const start = toMs(state.time?.start) ?? fallbackAt;
    const end = toMs(state.time?.end) ?? start;
    /** @type {Part[]} */
    const out = [{
      type: 'tool_use',
      rawType: 'tool',
      tool,
      input,
      callID,
      at: start,
      status: typeof state.status === 'string' ? state.status : null,
      state,
    }];
    const hasOutput = Object.prototype.hasOwnProperty.call(state, 'output') && state.output !== undefined;
    if (hasOutput) {
      out.push({
        type: 'tool_result',
        tool,
        callID,
        output: state.output,
        isError: state.status === 'error',
        at: end,
      });
    }
    return out;
  }

  if (type === 'text') {
    return [{ type: 'text', text: String(value.text ?? ''), at: toMs(value.time) ?? fallbackAt }];
  }

  // tool_use / tool_result already in Anthropic vocabulary, plus reasoning, step-start,
  // step-finish, timeline and anything a future build adds: preserved as stored.
  return [{ ...value, type, at: toMs(value.time) ?? fallbackAt }];
}

/**
 * Read one session with its tool parts intact.
 *
 * `limit` bounds how many turns are returned: the most recent `limit` messages are chosen and
 * returned in ascending sequence order, so a bounded read still reads forward in time.
 *
 * A session id that does not exist, a DB that does not exist and an unreadable DB all return the
 * empty shape rather than throwing: a missing feed is not a crash.
 *
 * @param {{ dbPath?: string, sessionId?: string, limit?: number, now?: number|string|Date }} [opts]
 * @returns {SessionParts}
 */
export function readSessionParts(opts = {}) {
  const dbPath = opts.dbPath || DEFAULT_SESSION_DB;
  const sessionId = opts.sessionId;
  if (!sessionId) return result(null, [], 0);
  if (!dbPath || !existsSync(dbPath)) return result(null, [], 0);

  // The one clock read in this module, and only when the caller omits `now`.
  const nowMs = toMs(opts.now) ?? Date.now();
  const requested = Number.isFinite(Number(opts.limit)) ? Math.floor(Number(opts.limit)) : DEFAULT_LIMIT;
  const limit = requested > 0 ? requested : DEFAULT_LIMIT;

  /** @type {any} */
  let db;
  try {
    db = openReadOnly(dbPath);

    const row = queryRow(db, 'SELECT id, title, time_updated FROM session WHERE id = ?', [sessionId]);
    if (!row) return result(null, [], 0);

    const updated = toMs(row.time_updated);
    /** @type {SessionInfo} */
    const session = {
      id: String(row.id),
      title: typeof row.title === 'string' ? row.title : null,
      updated,
      ageMinutes: updated === null ? null : Math.round(((nowMs - updated) / 60000) * 10) / 10,
    };

    const messages = queryRows(db, 'SELECT id, data, sequence FROM message WHERE session_id = ? ORDER BY sequence ASC, time_created ASC', [sessionId]);

    /** @type {Map<string, any[]>} */
    const partsByMessage = new Map();
    const partRows = queryRows(db, 'SELECT message_id, data, sequence, time_created FROM part WHERE session_id = ? ORDER BY sequence ASC, time_created ASC', [sessionId]);
    for (const p of partRows) {
      const key = String(p.message_id);
      const bucket = partsByMessage.get(key);
      if (bucket) bucket.push(p);
      else partsByMessage.set(key, [p]);
    }

    let unparseable = 0;
    /** @type {Turn[]} */
    const allTurns = [];
    for (const m of messages) {
      let messageData = {};
      try {
        messageData = typeof m.data === 'string' && m.data.trim() ? JSON.parse(m.data) : {};
      } catch {
        // A message header we cannot parse still yields a turn: its role is unknown, its parts
        // are still read. Losing the turn would be the same defect one level up.
        messageData = {};
      }
      const role = typeof messageData.role === 'string' && messageData.role
        ? messageData.role
        : (typeof messageData.info?.role === 'string' ? messageData.info.role : 'unknown');

      /** @type {Part[]} */
      const parts = [];
      for (const p of partsByMessage.get(String(m.id)) ?? []) {
        const parsed = parseStoredPart(p.data);
        if (!parsed.ok) {
          unparseable += 1;
          parts.push({ type: 'unparseable', error: parsed.error ?? 'unparseable part', raw: typeof p.data === 'string' ? p.data : null, at: toMs(p.time_created) });
          continue;
        }
        parts.push(...normalizePart(parsed.value, toMs(p.time_created)));
      }

      const text = parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n');

      allTurns.push({ role, at: toMs(messageData.time) ?? firstAt(parts), text, parts });
    }

    const turns = allTurns.length > limit ? allTurns.slice(allTurns.length - limit) : allTurns;
    return result(session, turns, unparseable);
  } catch {
    return result(null, [], 0);
  } finally {
    // The handle is released here, before the caller sees a result: a reader that returns
    // while it still holds the DB keeps the live session DB locked on Windows.
    releaseDatabase(db);
  }
}

/**
 * @param {Part[]} parts
 * @returns {number|null}
 */
function firstAt(parts) {
  for (const part of parts) if (typeof part.at === 'number') return part.at;
  return null;
}

/**
 * Every `tool_use` across the turns, flattened in sequence order.
 *
 * @param {Turn[]} turns
 * @returns {ToolCall[]}
 */
export function toolCalls(turns) {
  /** @type {ToolCall[]} */
  const out = [];
  for (const turn of Array.isArray(turns) ? turns : []) {
    for (const part of turn?.parts ?? []) {
      if (part?.type !== 'tool_use') continue;
      out.push({
        tool: typeof part.tool === 'string' ? part.tool : 'unknown',
        input: part.input && typeof part.input === 'object' ? part.input : {},
        at: typeof part.at === 'number' ? part.at : (typeof turn.at === 'number' ? turn.at : null),
        callID: typeof part.callID === 'string' ? part.callID : null,
      });
    }
  }
  return out;
}

/**
 * Distinct file paths the tool calls actually named, in first-seen order. Nothing is inferred
 * from prose: a path appears here only because a call's input carried it.
 *
 * @param {Turn[]} turns
 * @returns {string[]}
 */
export function touchedFiles(turns) {
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const call of toolCalls(turns)) {
    for (const field of FILE_INPUT_FIELDS) {
      const value = call.input[field];
      if (typeof value !== 'string') continue;
      const path = value.trim();
      if (!path || seen.has(path)) continue;
      seen.add(path);
      out.push(path);
    }
  }
  return out;
}
