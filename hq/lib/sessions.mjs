/**
 * @hq:context OpenCode 2.2.5 session ingestion: normalize, redact, persist, summarize, budget evidence.
 * @hq:owner hq
 * @hq:task LAB-01
 * @hq:invariant Read-only toward OpenCode. Writes only the passed db. Never stores secrets or raw auth material.
 * @hq:invariant Writes are idempotent: deterministic event ids, INSERT OR IGNORE, upsert by natural key.
 * @hq:see docs/LABS/LAB-01-REALTIME-DOGFEED.md
 * @hq:see hq/CONTRACT.md
 */
import { nowISO, sha256, canonicalJson, digestOf, estimateTokens, safeJsonParse } from './util.mjs';

export const SESSION_SCHEMA = 'hq.sessions/1';

/** Hard cap for one stored part (100 KB). Larger content keeps a hash + head summary. */
const MAX_PART_BYTES = 100 * 1024;
const FTS_TEXT_CAP = 20_000;
const WORKSPACE_SESSION = 'workspace';

export const SESSION_EVENT_TYPES = Object.freeze([
  'session.created',
  'session.text.started',
  'session.text.delta',
  'session.text.ended',
  'session.reasoning.started',
  'session.reasoning.delta',
  'session.reasoning.ended',
  'session.tool.input.started',
  'session.tool.input.delta',
  'session.tool.input.ended',
  'session.tool.called',
  'session.tool.progress',
  'session.tool.success',
  'session.tool.failed',
  'session.execution.started',
  'session.execution.succeeded',
  'session.execution.failed',
  'session.execution.interrupted',
  'session.step.started',
  'session.step.streamed',
  'session.step.ended',
  'session.compaction.started',
  'session.compaction.delta',
  'session.compaction.ended',
  'session.compaction.failed',
  'session.status',
  'session.idle',
  'session.forked',
  'session.archived',
  'session.unarchived',
  'session.usage.updated',
  'permission.asked',
  'permission.replied',
  'filesystem.changed',
]);

const SESSION_COLUMNS = Object.freeze([
  'id', 'project_id', 'parent_id', 'title', 'directory', 'agent', 'model',
  'status', 'outcome', 'cost', 'tokens_input', 'tokens_output',
  'tokens_reasoning', 'tokens_cache_read', 'tokens_cache_write',
  'created_at', 'updated_at', 'ingested_at', 'source', 'raw_hash',
]);

const SESSION_WRITE_COLUMNS = SESSION_COLUMNS.filter((c) => c !== 'id');

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const SECRET_BASENAMES = [
  /^\.env(\..+)?$/i,
  /\.keystore$/i,
  /^session\.json$/i,
  /^storage-state\.json$/i,
  /^release-profile\.json$/i,
  /^cookies$/i,
  /^login data$/i,
];

const SECRET_KEYS = /^(password|passwd|api[_-]?key|apikey|secret|token|bearer|authorization|auth|access[_-]?token|refresh[_-]?token|private[_-]?key)$/i;

const ASSIGNMENT_QUOTED = /\b(password|passwd|api[_-]?key|secret|token|bearer)(["']?\s{0,4}[:=]\s{0,4})(["'])(?!\[REDACTED\])([^"']{1,})\3/gi;
const ASSIGNMENT = /\b(password|passwd|api[_-]?key|secret|token|bearer)(["']?\s{0,4}[:=]\s{0,4}["']?)(?!\[REDACTED\])([^\s,;)}"']{1,})/gi;
const BEARER_VALUE = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g;
const TOKEN_SPLIT = /[^\s]+/g;

function isSecretPath(value) {
  const base = String(value ?? '').split(/[\\/]/).pop() ?? '';
  return SECRET_BASENAMES.some((re) => re.test(base));
}

function redactToken(token) {
  const leadMatch = String(token).match(/^["'`(\[{<]+/);
  const lead = leadMatch ? leadMatch[0] : '';
  const rest = token.slice(lead.length);
  const trailMatch = rest.match(/["'`)\]}>,.;:!?]+$/);
  const trail = trailMatch ? trailMatch[0] : '';
  const core = rest.slice(0, rest.length - trail.length);
  if (!core) return token;
  if (isSecretPath(core)) return lead + '[REDACTED_PATH]' + trail;
  return token;
}

/**
 * redactSecrets — strips credential assignments, bearer values and secret file
 * paths. Deterministic and idempotent: running it twice yields the same text.
 */
export function redactSecrets(text) {
  if (text === null || text === undefined) return text;
  let out = String(text);
  out = out.replace(/Login Data/g, '[REDACTED_PATH]');
  out = out.replace(BEARER_VALUE, 'Bearer [REDACTED]');
  out = out.replace(ASSIGNMENT_QUOTED, '$1$2$3[REDACTED]$3');
  out = out.replace(ASSIGNMENT, '$1$2[REDACTED]');
  out = out.replace(TOKEN_SPLIT, redactToken);
  return out;
}

function redactDeep(value, depth = 0) {
  if (depth > 8) return '[REDACTED_DEPTH]';
  if (value === null || value === undefined) return value;
  const type = typeof value;
  if (type === 'string') return redactSecrets(value);
  if (type === 'number' || type === 'boolean') return value;
  if (type !== 'object') return String(value);
  if (Array.isArray(value)) return value.map((item) => redactDeep(item, depth + 1));
  const out = {};
  for (const key of Object.keys(value).sort()) {
    out[key] = SECRET_KEYS.test(key) ? '[REDACTED]' : redactDeep(value[key], depth + 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function numOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isoOf(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' || (typeof value === 'string' && /^\d{10,14}$/.test(value))) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const ms = String(Math.trunc(Math.abs(n))).length <= 10 ? n * 1000 : n;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function minIso(a, b) {
  if (!a) return b ?? null;
  if (!b) return a;
  return a <= b ? a : b;
}

function maxIso(a, b) {
  if (!a) return b ?? null;
  if (!b) return a;
  return a >= b ? a : b;
}

function jsonish(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function capText(text) {
  const value = String(text ?? '');
  const bytes = Buffer.byteLength(value, 'utf8');
  if (bytes <= MAX_PART_BYTES) return { text: value, truncated: false, sha256: sha256(value), bytes };
  const hash = sha256(value);
  return {
    text: `${value.slice(0, 2000)}\n[hq:truncated sha256=${hash} bytes=${bytes}]`,
    truncated: true,
    sha256: hash,
    bytes,
  };
}

function ensureString(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function uniqueInOrder(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const key = String(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function tokenShape(source) {
  if (!source || typeof source !== 'object') return null;
  const raw = source.tokens ?? source.usage ?? source;
  if (!raw || typeof raw !== 'object') return null;
  const input = numOrNull(raw.input ?? raw.prompt ?? raw.inputTokens);
  const output = numOrNull(raw.output ?? raw.completion ?? raw.outputTokens);
  const reasoning = numOrNull(raw.reasoning ?? raw.reasoningTokens);
  const cache = raw.cache && typeof raw.cache === 'object' ? raw.cache : {};
  const cacheRead = numOrNull(cache.read ?? raw.cacheRead ?? raw.cache_read);
  const cacheWrite = numOrNull(cache.write ?? raw.cacheWrite ?? raw.cache_write);
  if ([input, output, reasoning, cacheRead, cacheWrite].every((v) => v === null)) return null;
  return {
    input: input ?? 0,
    output: output ?? 0,
    reasoning: reasoning ?? 0,
    cacheRead: cacheRead ?? 0,
    cacheWrite: cacheWrite ?? 0,
  };
}

function addTokens(a, b) {
  if (!b) return a;
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    reasoning: a.reasoning + b.reasoning,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheWrite: a.cacheWrite + b.cacheWrite,
  };
}

function zeroTokens() {
  return { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 };
}

function totalTokens(t) {
  if (!t) return 0;
  return t.input + t.output + t.reasoning;
}

// ---------------------------------------------------------------------------
// Event normalization
// ---------------------------------------------------------------------------

function payloadOf(event) {
  if (!event || typeof event !== 'object') return {};
  const candidate = event.properties ?? event.data ?? event.payload ?? null;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {};
  const nested = candidate.data && typeof candidate.data === 'object' && !Array.isArray(candidate.data)
    ? candidate.data
    : null;
  const merged = nested ? { ...nested, ...candidate } : { ...candidate };
  delete merged.data;
  return merged;
}

function sessionIDOf(props, envelope) {
  const chain = [
    props.sessionID, props.sessionId, props.session_id,
    envelope?.sessionID, envelope?.sessionId,
    props.session?.id, props.session?.sessionID,
    props.info?.sessionID,
    props.info?.id,
  ];
  for (const value of chain) {
    const s = ensureString(value);
    if (s) return s;
  }
  return null;
}

function seqOfValue(data) {
  if (!data || typeof data !== 'object') return null;
  for (const key of ['seq', 'sequence', 'stepSeq']) {
    const n = numOrNull(data[key]);
    if (n !== null) return Math.trunc(n);
  }
  return null;
}

/**
 * normalizeEvent — maps an OpenCode 2.2.5 V2 event envelope onto the HQ shape.
 * Accepts `{type, properties}`, `{type, data}` and flat synthetic envelopes.
 */
export function normalizeEvent(event, { project = null } = {}) {
  const envelope = event && typeof event === 'object' ? event : {};
  const kind = ensureString(envelope.type ?? envelope.kind ?? envelope.event) ?? 'unknown';
  const props = redactDeep(payloadOf(envelope));
  const sessionID = sessionIDOf(props, envelope) ?? (kind === 'filesystem.changed' ? WORKSPACE_SESSION : null);
  const at = isoOf(
    props.time?.started ?? props.time?.created ?? props.time
    ?? props.at ?? props.timestamp ?? envelope.time ?? envelope.at,
  );
  const seq = seqOfValue(props);
  const idBase = [String(sessionID ?? ''), kind, seq === null ? '' : String(seq), canonicalJson(props)].join('\0');
  const explicitId = ensureString(envelope.id ?? props.eventID ?? props.eventId);
  return {
    sessionID,
    kind,
    at,
    data: props,
    id: explicitId ?? `evt_${sha256(idBase).slice(0, 24)}`,
    project: project ?? null,
  };
}

// ---------------------------------------------------------------------------
// Session rows
// ---------------------------------------------------------------------------

function readSessionRow(db, id) {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) ?? null;
}

function ensureSession(db, id, { at = null, source = null, ingest = true } = {}) {
  const existing = readSessionRow(db, id);
  if (existing) return existing;
  const iso = at ?? nowISO();
  db.prepare(`
    INSERT INTO sessions(id, status, created_at, updated_at, ingested_at, source)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO NOTHING
  `).run(id, 'active', iso, iso, ingest ? nowISO() : iso, source ?? null);
  return readSessionRow(db, id);
}

function patchSession(db, id, patch = {}) {
  const existing = readSessionRow(db, id);
  if (!existing) return null;
  const next = { ...existing };
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (!SESSION_WRITE_COLUMNS.includes(key)) continue;
    if ((next[key] ?? null) === value) continue;
    next[key] = value;
    changed = true;
  }
  if (patch.created_at) next.created_at = minIso(existing.created_at, patch.created_at);
  if (patch.updated_at) next.updated_at = maxIso(existing.updated_at, patch.updated_at);
  if ((existing.created_at ?? null) !== (next.created_at ?? null)) changed = true;
  if ((existing.updated_at ?? null) !== (next.updated_at ?? null)) changed = true;
  if (!changed) return next;
  db.prepare(`
    UPDATE sessions SET ${SESSION_WRITE_COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?
  `).run(...SESSION_WRITE_COLUMNS.map((c) => next[c] ?? null), id);
  return next;
}

function touchSession(db, id, at) {
  if (!at) return;
  patchSession(db, id, { updated_at: at });
}

function sessionInfoOf(data) {
  if (!data || typeof data !== 'object') return {};
  if (data.info && typeof data.info === 'object') return data.info;
  if (data.session && typeof data.session === 'object') return data.session;
  return data;
}

function sessionPatchFromInfo(info) {
  if (!info || typeof info !== 'object') return {};
  const tokens = tokenShape(info);
  const patch = {
    title: ensureString(info.title ?? info.name),
    directory: ensureString(info.directory ?? info.cwd ?? info.path),
    parent_id: ensureString(info.parentID ?? info.parent_id ?? info.parent?.id),
    agent: ensureString(info.agent ?? info.agentID ?? info.mode),
    model: ensureString(
      (info.model && typeof info.model === 'object' ? info.model.id ?? info.model.modelID : info.model)
      ?? info.modelID,
    ),
    cost: numOrNull(info.cost),
    tokens_input: tokens ? tokens.input : null,
    tokens_output: tokens ? tokens.output : null,
    tokens_reasoning: tokens ? tokens.reasoning : null,
    tokens_cache_read: tokens ? tokens.cacheRead : null,
    tokens_cache_write: tokens ? tokens.cacheWrite : null,
    created_at: isoOf(info.time?.created ?? info.created ?? info.createdAt),
    updated_at: isoOf(info.time?.updated ?? info.updated ?? info.updatedAt),
  };
  return patch;
}

function resolveProjectIdRef(db, ref) {
  if (ref === null || ref === undefined || ref === '') return null;
  const asNumber = Number(ref);
  if (Number.isInteger(asNumber) && String(asNumber) === String(ref).trim()) {
    const row = db.prepare('SELECT id FROM projects WHERE id = ?').get(asNumber);
    return row ? row.id : null;
  }
  const name = String(ref);
  const row = db.prepare('SELECT id FROM projects WHERE name = ? OR lower(name) = lower(?)')
    .get(name, name);
  return row ? row.id : null;
}

function resolveProjectIdByPath(db, directory) {
  const dir = ensureString(directory);
  if (!dir) return null;
  const normalize = (value) => String(value ?? '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  const target = normalize(dir);
  let best = null;
  for (const row of db.prepare('SELECT id, path FROM projects').all()) {
    const projectPath = normalize(row.path);
    if (!projectPath) continue;
    if (target === projectPath || target.startsWith(`${projectPath}/`)) {
      if (!best || projectPath.length > best.path.length) best = { id: row.id, path: projectPath };
    }
  }
  return best ? best.id : null;
}

// ---------------------------------------------------------------------------
// Event rows
// ---------------------------------------------------------------------------

function insertEventRow(db, evt, at) {
  const durable = isDurableEvent(evt.kind) ? 1 : 0;
  const result = db.prepare(`
    INSERT INTO session_events(id, session_id, seq, type, at, data, durable)
    VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    evt.id,
    evt.sessionID ?? WORKSPACE_SESSION,
    seqOfValue(evt.data),
    evt.kind,
    at,
    canonicalJson(evt.data ?? {}),
    durable,
  );
  return Number(result.changes) > 0;
}

function isDurableEvent(kind) {
  if (kind.endsWith('.delta') || kind.endsWith('.started')) return false;
  if (kind.endsWith('.progress') || kind.endsWith('.streamed')) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Messages and parts
// ---------------------------------------------------------------------------

function messageIDOf(data, sessionID, role) {
  const explicit = ensureString(
    data.messageID ?? data.messageId ?? data.message_id
    ?? data.message?.id ?? data.part?.messageID,
  );
  if (explicit) return explicit;
  return `msg_${sha256([String(sessionID), String(role)].join('\0')).slice(0, 24)}`;
}

function ordinalOf(data) {
  const explicit = numOrNull(data.ordinal ?? data.index ?? data.part?.index);
  if (explicit !== null) return Math.trunc(explicit);
  const callID = ensureString(data.callID ?? data.toolCallID ?? data.tool_call_id);
  if (callID) return parseInt(sha256(callID).slice(0, 8), 16) % 1_000_000;
  return 0;
}

function toolNameOf(data) {
  return ensureString(
    data.tool ?? data.toolName ?? data.name ?? data.part?.tool ?? data.part?.toolName,
  );
}

function readMessageRow(db, id) {
  return db.prepare('SELECT * FROM session_messages WHERE id = ?').get(id) ?? null;
}

function ensureMessage(db, { sessionID, messageID, role = 'assistant', type = 'message', seq = null, at = null }) {
  const existing = readMessageRow(db, messageID);
  if (existing) {
    const patchRole = existing.role ? null : role;
    const patchSeq = existing.seq === null || existing.seq === undefined ? seq : null;
    if (patchRole || patchSeq !== null) {
      db.prepare('UPDATE session_messages SET role = COALESCE(?, role), seq = COALESCE(?, seq) WHERE id = ?')
        .run(patchRole, patchSeq, messageID);
    }
    return readMessageRow(db, messageID);
  }
  db.prepare(`
    INSERT INTO session_messages(id, session_id, role, type, seq, created_at)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO NOTHING
  `).run(messageID, sessionID, role, type, seq, at ?? nowISO());
  return readMessageRow(db, messageID);
}

function findPart(db, { sessionID, messageID, type, toolName = null, ordinal = 0 }) {
  return db.prepare(`
    SELECT * FROM session_parts
    WHERE session_id = ? AND message_id = ? AND type = ?
      AND IFNULL(tool_name, '') = ? AND IFNULL(ordinal, 0) = ?
    ORDER BY id LIMIT 1
  `).get(sessionID, messageID, type, toolName ?? '', ordinal) ?? null;
}

function upsertPart(db, {
  sessionID, messageID, type, ordinal = 0, toolName = null, toolState = null,
  input = null, output = null, filePath = null, error = null,
  createdAt = null, completedAt = null, appendOutput = null, appendInput = null,
}) {
  const existing = findPart(db, { sessionID, messageID, type, toolName, ordinal });
  const nextOutputRaw = appendOutput !== null
    ? `${existing?.output ?? ''}${appendOutput}`
    : (output !== null ? output : existing?.output ?? null);
  const cappedOutput = nextOutputRaw === null ? null : capText(nextOutputRaw).text;
  const nextInputRaw = appendInput !== null
    ? `${existing?.input ?? ''}${appendInput}`
    : (input !== null ? input : existing?.input ?? null);
  const cappedInput = nextInputRaw === null ? null : capText(nextInputRaw).text;
  const nextState = toolState ?? existing?.tool_state ?? null;
  const nextError = error ?? existing?.error ?? null;
  const nextFile = filePath ?? existing?.file_path ?? null;
  const nextCreated = existing?.created_at ?? createdAt ?? null;
  const nextCompleted = completedAt ?? existing?.completed_at ?? null;

  if (existing) {
    const unchanged = (existing.output ?? null) === cappedOutput
      && (existing.input ?? null) === cappedInput
      && (existing.tool_state ?? null) === nextState
      && (existing.error ?? null) === nextError
      && (existing.file_path ?? null) === nextFile
      && (existing.completed_at ?? null) === nextCompleted;
    if (unchanged) return { id: existing.id, inserted: false, output: cappedOutput };
    db.prepare(`
      UPDATE session_parts SET tool_name = ?, tool_state = ?, input = ?, output = ?,
        file_path = ?, error = ?, created_at = ?, completed_at = ? WHERE id = ?
    `).run(toolName ?? existing.tool_name ?? null, nextState, cappedInput, cappedOutput,
      nextFile, nextError, nextCreated, nextCompleted, existing.id);
    return { id: existing.id, inserted: false, output: cappedOutput };
  }

  const result = db.prepare(`
    INSERT INTO session_parts(message_id, session_id, ordinal, type, tool_name, tool_state,
      input, output, file_path, error, created_at, completed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(messageID, sessionID, ordinal, type, toolName, nextState, cappedInput, cappedOutput,
    nextFile, nextError, nextCreated, nextCompleted);
  return { id: Number(result.lastInsertRowid), inserted: true, output: cappedOutput };
}

function syncMessageText(db, { sessionID, messageID, type }) {
  const column = type === 'reasoning' ? 'reasoning' : 'text';
  const rows = db.prepare(`
    SELECT output FROM session_parts
    WHERE session_id = ? AND message_id = ? AND type = ?
    ORDER BY ordinal ASC, id ASC
  `).all(sessionID, messageID, type);
  const joined = rows.map((row) => row.output ?? '').join('');
  const capped = capText(joined);
  db.prepare(`UPDATE session_messages SET ${column} = ?, raw_hash = ? WHERE id = ?`)
    .run(capped.text, sha256(`${column}\0${capped.text}`), messageID);
}

// ---------------------------------------------------------------------------
// Files, todos, timings, FTS
// ---------------------------------------------------------------------------

function writeSessionFile(db, { sessionID, path, action = 'changed', messageID = null }) {
  const cleanPath = ensureString(path);
  if (!cleanPath) return false;
  if (cleanPath.includes('[REDACTED_PATH]')) return false;
  if (isSecretPath(cleanPath)) return false;
  const safePath = cleanPath.replace(/\\/g, '/');
  const result = db.prepare(`
    INSERT INTO session_files(session_id, path, action, message_id)
    VALUES (?,?,?,?)
    ON CONFLICT(session_id, path, action, message_id) DO NOTHING
  `).run(sessionID, safePath, action || 'changed', messageID ?? '');
  return Number(result.changes) > 0;
}

function writeSessionTodo(db, { sessionID, id, content, status, priority }) {
  const todoID = ensureString(id) ?? `todo_${sha256([sessionID, String(content ?? '')].join('\0')).slice(0, 16)}`;
  db.prepare(`
    INSERT INTO session_todos(session_id, id, content, status, priority)
    VALUES (?,?,?,?,?)
    ON CONFLICT(session_id, id) DO UPDATE SET
      content = excluded.content,
      status = excluded.status,
      priority = excluded.priority
  `).run(sessionID, todoID, redactSecrets(String(content ?? '')), status ?? 'pending', priority ?? null);
  return todoID;
}

function recordSessionSpan(db, {
  sessionID, operation, startedAt, durationMs, ok = true, bytes = 0, tokens = 0, meta = {},
}) {
  const iso = isoOf(startedAt) ?? nowISO();
  const duration = Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0;
  const metaJson = canonicalJson({ sessionID, ...meta });
  const existing = db.prepare(`
    SELECT id FROM timings WHERE operation = ? AND started_at = ? AND IFNULL(meta, '') = ?
  `).get(operation, iso, metaJson);
  if (existing) return false;
  db.prepare(`
    INSERT INTO timings(operation, project, started_at, duration_ms, ok, bytes, tokens, meta)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(operation, null, iso, Math.round(duration * 1000) / 1000, ok ? 1 : 0,
    Number(bytes) || 0, Number(tokens) || 0, metaJson);
  return true;
}

function lastEventOfType(db, sessionID, type) {
  return db.prepare(`
    SELECT * FROM session_events WHERE session_id = ? AND type = ?
    ORDER BY at DESC, seq DESC, id DESC LIMIT 1
  `).get(sessionID, type) ?? null;
}

function reindexSessionFts(db, sessionID) {
  db.prepare('DELETE FROM session_fts WHERE session_id = ?').run(sessionID);
  const insert = db.prepare('INSERT INTO session_fts(session_id, kind, text) VALUES (?,?,?)');
  const push = (kind, text) => {
    const value = String(text ?? '').trim();
    if (!value) return;
    insert.run(sessionID, kind, value.slice(0, FTS_TEXT_CAP));
  };
  const messages = db.prepare(`
    SELECT role, type, text, reasoning, error FROM session_messages
    WHERE session_id = ? ORDER BY seq, created_at, id
  `).all(sessionID);
  for (const message of messages) {
    if (message.text) push(message.type === 'compaction' ? 'compaction' : (message.role === 'user' ? 'user' : 'assistant'), message.text);
    if (message.reasoning) push('reasoning', message.reasoning);
    if (message.error) push('error', message.error);
  }
  const parts = db.prepare(`
    SELECT tool_name, tool_state, error FROM session_parts
    WHERE session_id = ? AND type IN ('tool', 'tool-input') ORDER BY id
  `).all(sessionID);
  for (const part of parts) {
    if (part.tool_name) push('tool', [part.tool_name, part.tool_state].filter(Boolean).join(' '));
    if (part.error) push('error', part.error);
  }
}

// ---------------------------------------------------------------------------
// Event application
// ---------------------------------------------------------------------------

function pickDelta(data) {
  for (const key of ['delta', 'chunk', 'textDelta']) {
    if (data[key] !== undefined && data[key] !== null) return String(data[key]);
  }
  return null;
}

function pickFull(data) {
  for (const key of ['text', 'content', 'value']) {
    if (typeof data[key] === 'string') return data[key];
  }
  return null;
}

function applyStreamText(db, { sessionID, kind, data, at, type, role }) {
  const phase = kind.split('.').pop();
  const messageID = messageIDOf(data, sessionID, role);
  ensureMessage(db, { sessionID, messageID, role, seq: seqOfValue(data), at });
  const existing = findPart(db, { sessionID, messageID, type, toolName: null, ordinal: 0 });
  const delta = pickDelta(data);
  const full = pickFull(data);
  let next;
  if (phase === 'delta') {
    next = delta !== null ? `${existing?.output ?? ''}${delta}` : (full ?? existing?.output ?? '');
  } else {
    next = full ?? existing?.output ?? '';
  }
  upsertPart(db, {
    sessionID, messageID, type, ordinal: 0,
    output: next,
    createdAt: existing?.created_at ?? at,
    completedAt: phase === 'ended' ? at : existing?.completed_at ?? null,
    toolState: phase === 'ended' ? 'complete' : 'streaming',
  });
  syncMessageText(db, { sessionID, messageID, type });
  if (phase === 'ended') {
    db.prepare('UPDATE session_messages SET completed_at = COALESCE(completed_at, ?) WHERE id = ?')
      .run(at, messageID);
  }
  return { messageID, phase };
}

function applyToolEvent(db, { sessionID, kind, data, at }) {
  const toolName = toolNameOf(data);
  const role = data.role ?? 'assistant';
  const messageID = messageIDOf(data, sessionID, role);
  ensureMessage(db, { sessionID, messageID, role, seq: seqOfValue(data), at });
  const phase = kind.split('.').pop();
  const ordinal = ordinalOf(data);
  const state = phase === 'called' ? 'called'
    : phase === 'progress' ? 'running'
      : phase === 'success' ? 'success' : 'failed';
  const input = data.input !== undefined ? jsonish(redactDeep(data.input)) : null;
  const output = data.output !== undefined ? jsonish(redactDeep(data.output))
    : (data.result !== undefined ? jsonish(redactDeep(data.result)) : null);
  const error = data.error !== undefined ? jsonish(redactDeep(data.error)) : null;
  const filePath = ensureString(
    data.filePath ?? data.path ?? data.file ?? data.input?.filePath ?? data.input?.path,
  );
  upsertPart(db, {
    sessionID, messageID, type: 'tool', ordinal, toolName, toolState: state,
    input, output, filePath, error,
    createdAt: at,
    completedAt: phase === 'success' || phase === 'failed' ? at : null,
  });
  if (/todo/i.test(toolName ?? '')) applyTodoTool(db, sessionID, data.input ?? data.todos);
  if (filePath && (phase === 'success' || phase === 'called')) {
    const action = /write|edit|patch|create/i.test(toolName ?? '') ? 'edit'
      : /read|view|cat/i.test(toolName ?? '') ? 'read' : 'touch';
    writeSessionFile(db, { sessionID, path: filePath, action, messageID });
  }
  return { messageID, toolName, state, error };
}

function applyTodoTool(db, sessionID, input) {
  const value = typeof input === 'string' ? safeJsonParse(input, null) : input;
  const list = Array.isArray(value) ? value : (Array.isArray(value?.todos) ? value.todos : null);
  if (!list) return 0;
  let count = 0;
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    writeSessionTodo(db, {
      sessionID,
      id: item.id,
      content: item.content ?? item.text ?? '',
      status: item.status,
      priority: item.priority,
    });
    count += 1;
  }
  return count;
}

function applyExecutionEvent(db, { sessionID, kind, data, at }) {
  const phase = kind.split('.').pop();
  if (phase === 'started') {
    return { phase };
  }
  const ok = phase === 'succeeded';
  const start = lastEventOfType(db, sessionID, 'session.execution.started');
  const durationMs = numOrNull(data.durationMs ?? data.duration ?? data.ms)
    ?? (start?.at && at ? Math.max(0, Date.parse(at) - Date.parse(start.at)) : 0);
  recordSessionSpan(db, {
    sessionID,
    operation: 'session.execution',
    startedAt: start?.at ?? at,
    durationMs,
    ok,
    meta: { executionID: ensureString(data.executionID ?? data.id) ?? null, phase },
  });
  const patch = {};
  if (phase === 'failed') { patch.outcome = 'failed'; patch.status = 'error'; }
  if (phase === 'interrupted') { patch.outcome = 'interrupted'; patch.status = 'idle'; }
  return { phase, durationMs, patch };
}

function applyStepEvent(db, { sessionID, kind, data, at }) {
  const phase = kind.split('.').pop();
  const tokens = tokenShape(data);
  if (phase === 'streamed' || phase === 'ended') {
    const patch = {};
    if (data.cost !== undefined) patch.cost = numOrNull(data.cost);
    if (tokens) {
      patch.tokens_input = tokens.input;
      patch.tokens_output = tokens.output;
      patch.tokens_reasoning = tokens.reasoning;
      patch.tokens_cache_read = tokens.cacheRead;
      patch.tokens_cache_write = tokens.cacheWrite;
    }
    if (Object.keys(patch).length) patchSession(db, sessionID, patch);
    const files = Array.isArray(data.files) ? data.files : [];
    for (const entry of files) {
      const path = typeof entry === 'string' ? entry : entry?.path;
      const action = typeof entry === 'string' ? 'changed' : entry?.action ?? 'changed';
      writeSessionFile(db, { sessionID, path, action });
    }
  }
  if (phase === 'ended') {
    const start = lastEventOfType(db, sessionID, 'session.step.started');
    const durationMs = numOrNull(data.durationMs ?? data.duration ?? data.ms)
      ?? (start?.at && at ? Math.max(0, Date.parse(at) - Date.parse(start.at)) : 0);
    recordSessionSpan(db, {
      sessionID,
      operation: 'session.step',
      startedAt: start?.at ?? at,
      durationMs,
      ok: true,
      tokens: totalTokens(tokens),
      meta: { stepID: ensureString(data.stepID ?? data.step ?? data.id) ?? null },
    });
  }
  return { phase, tokens };
}

function applyCompactionEvent(db, { sessionID, kind, data, at }) {
  const phase = kind.split('.').pop();
  const messageID = ensureString(data.messageID ?? data.message?.id)
    ?? `cmp_${sha256([sessionID, 'compaction', String(data.compactionID ?? data.id ?? '0')].join('\0')).slice(0, 24)}`;
  ensureMessage(db, { sessionID, messageID, role: 'system', type: 'compaction', seq: seqOfValue(data), at });
  const existing = findPart(db, { sessionID, messageID, type: 'compaction', toolName: null, ordinal: 0 });
  const delta = pickDelta(data);
  const full = data.summary ?? data.text ?? data.content ?? null;
  let next;
  if (phase === 'delta') {
    next = delta !== null ? `${existing?.output ?? ''}${delta}` : (full ?? existing?.output ?? '');
  } else {
    next = full ?? existing?.output ?? '';
  }
  if (next) {
    upsertPart(db, {
      sessionID, messageID, type: 'compaction', ordinal: 0, output: String(next),
      createdAt: existing?.created_at ?? at,
      completedAt: phase === 'ended' || phase === 'failed' ? at : null,
      toolState: phase,
      error: phase === 'failed' ? jsonish(redactDeep(data.error ?? 'compaction failed')) : null,
    });
    syncMessageText(db, { sessionID, messageID, type: 'compaction' });
  }
  if (phase === 'ended') {
    const tokens = tokenShape(data);
    if (tokens) {
      patchSession(db, sessionID, {
        tokens_input: tokens.input,
        tokens_output: tokens.output,
        tokens_reasoning: tokens.reasoning,
      });
    }
  }
  return { messageID, phase };
}

function applyFilesystemEvent(db, { sessionID, data, at }) {
  const entries = Array.isArray(data.files) ? data.files
    : (Array.isArray(data.paths) ? data.paths : [data]);
  const action = ensureString(data.action ?? data.change ?? data.event ?? data.kind ?? data.type) ?? 'changed';
  let written = 0;
  for (const entry of entries) {
    const path = typeof entry === 'string' ? entry : entry?.path ?? entry?.file;
    const entryAction = typeof entry === 'string' ? action : ensureString(entry?.action) ?? action;
    if (writeSessionFile(db, { sessionID, path, action: entryAction, messageID: null })) written += 1;
  }
  return { written, at };
}

function applySessionEvent(db, { sessionID, kind, data, at, source }) {
  let needsFts = false;
  let finalize = false;

  if (kind === 'session.created') {
    const info = sessionInfoOf(data);
    const fromInfo = sessionPatchFromInfo(info);
    patchSession(db, sessionID, fromInfo);
    patchSession(db, sessionID, {
      raw_hash: digestOf({ id: sessionID, ...fromInfo }),
      source: source ?? null,
    });
    const directory = fromInfo.directory ?? ensureString(data.directory);
    if (directory) {
      const projectId = resolveProjectIdByPath(db, directory);
      if (projectId) patchSession(db, sessionID, { project_id: projectId });
    }
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'session.text.started' || kind === 'session.text.delta' || kind === 'session.text.ended') {
    const { phase } = applyStreamText(db, { sessionID, kind, data, at, type: 'text', role: data.role ?? 'assistant' });
    needsFts = phase === 'ended';
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'session.reasoning.started' || kind === 'session.reasoning.delta' || kind === 'session.reasoning.ended') {
    const { phase } = applyStreamText(db, { sessionID, kind, data, at, type: 'reasoning', role: data.role ?? 'assistant' });
    needsFts = phase === 'ended';
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind.startsWith('session.tool.input.')) {
    const phase = kind.split('.').pop();
    const messageID = messageIDOf(data, sessionID, data.role ?? 'assistant');
    const toolName = toolNameOf(data);
    ensureMessage(db, { sessionID, messageID, role: data.role ?? 'assistant', seq: seqOfValue(data), at });
    const existing = findPart(db, { sessionID, messageID, type: 'tool-input', toolName, ordinal: ordinalOf(data) });
    const delta = pickDelta(data);
    const full = pickFull(data);
    const next = phase === 'delta'
      ? (delta !== null ? `${existing?.input ?? ''}${delta}` : (full ?? existing?.input ?? ''))
      : (full ?? existing?.input ?? '');
    upsertPart(db, {
      sessionID, messageID, type: 'tool-input', ordinal: ordinalOf(data), toolName,
      input: next,
      toolState: phase === 'ended' ? 'complete' : 'streaming',
      createdAt: existing?.created_at ?? at,
      completedAt: phase === 'ended' ? at : null,
    });
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind.startsWith('session.tool.')) {
    const { state } = applyToolEvent(db, { sessionID, kind, data, at });
    needsFts = state === 'success' || state === 'failed';
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind.startsWith('session.execution.')) {
    const { phase, patch: outcomePatch } = applyExecutionEvent(db, { sessionID, kind, data, at });
    if (outcomePatch) patchSession(db, sessionID, outcomePatch);
    touchSession(db, sessionID, at);
    if (phase === 'succeeded' || phase === 'failed' || phase === 'interrupted') finalize = true;
    return { needsFts, finalize };
  }

  if (kind.startsWith('session.step.')) {
    applyStepEvent(db, { sessionID, kind, data, at });
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind.startsWith('session.compaction.')) {
    const { phase } = applyCompactionEvent(db, { sessionID, kind, data, at });
    needsFts = phase === 'ended' || phase === 'failed';
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'session.status') {
    const status = ensureString(
      typeof data.status === 'string' ? data.status : data.status?.type ?? data.state ?? data.value,
    );
    if (status) patchSession(db, sessionID, { status });
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'session.idle') {
    patchSession(db, sessionID, { status: 'idle' });
    touchSession(db, sessionID, at);
    return { needsFts: true, finalize: true };
  }

  if (kind === 'session.forked') {
    const parentID = ensureString(data.parentID ?? data.parent_id ?? data.parent?.id ?? data.forkedFrom);
    if (parentID) patchSession(db, sessionID, { parent_id: parentID });
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'session.archived') {
    patchSession(db, sessionID, { status: 'archived', outcome: 'archived' });
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'session.unarchived') {
    patchSession(db, sessionID, { status: 'active' });
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'session.usage.updated') {
    const tokens = tokenShape(data);
    if (tokens) {
      patchSession(db, sessionID, {
        tokens_input: tokens.input,
        tokens_output: tokens.output,
        tokens_reasoning: tokens.reasoning,
        tokens_cache_read: tokens.cacheRead,
        tokens_cache_write: tokens.cacheWrite,
      });
    }
    if (data.cost !== undefined) patchSession(db, sessionID, { cost: numOrNull(data.cost) });
    touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  if (kind === 'filesystem.changed') {
    applyFilesystemEvent(db, { sessionID, data, at });
    if (sessionID !== WORKSPACE_SESSION) touchSession(db, sessionID, at);
    return { needsFts, finalize };
  }

  // permission.asked / permission.replied and unknown types: recorded, never acted on.
  if (sessionID !== WORKSPACE_SESSION) touchSession(db, sessionID, at);
  return { needsFts, finalize };
}

// ---------------------------------------------------------------------------
// Public ingestion API
// ---------------------------------------------------------------------------

export function ingestEvent(db, event, { project = null, source = 'plugin' } = {}) {
  const evt = normalizeEvent(event, { project });
  if (!evt.sessionID) {
    return { sessionID: null, kind: evt.kind, inserted: false, eventId: null };
  }
  const at = evt.at
    ?? (evt.kind === 'session.created'
      ? isoOf(sessionInfoOf(evt.data ?? {}).time?.created ?? sessionInfoOf(evt.data ?? {}).createdAt)
      : null)
    ?? nowISO();
  const isWorkspace = evt.sessionID === WORKSPACE_SESSION;
  if (!isWorkspace) {
    ensureSession(db, evt.sessionID, { at, source });
    if (project !== null && project !== undefined) {
      const projectId = resolveProjectIdRef(db, project);
      if (projectId) patchSession(db, evt.sessionID, { project_id: projectId });
    }
  }
  const inserted = insertEventRow(db, evt, at);
  if (!inserted) {
    return { sessionID: evt.sessionID, kind: evt.kind, inserted: false, eventId: evt.id };
  }
  const result = applySessionEvent(db, {
    sessionID: evt.sessionID,
    kind: evt.kind,
    data: evt.data ?? {},
    at,
    source,
  });
  if (result.needsFts) reindexSessionFts(db, evt.sessionID);
  if (result.finalize) finalizeSession(db, { id: evt.sessionID, now: at });
  return {
    sessionID: evt.sessionID,
    kind: evt.kind,
    inserted: true,
    eventId: evt.id,
  };
}

function normalizeImportInfo(session) {
  if (!session || typeof session !== 'object') return {};
  if (session.info && typeof session.info === 'object') return session.info;
  return session;
}

function importPart(db, { sessionID, messageID, part, at, ordinal }) {
  if (!part || typeof part !== 'object') return { inserted: false, type: null };
  const type = ensureString(part.type) ?? 'unknown';
  const partAt = isoOf(part.time?.start ?? part.time?.created ?? part.createdAt) ?? at;
  const completedAt = isoOf(part.time?.end ?? part.time?.completed ?? part.completedAt);
  if (type === 'text' || type === 'reasoning') {
    const existing = findPart(db, { sessionID, messageID, type, toolName: null, ordinal });
    const text = capText(part.text ?? '').text;
    const result = upsertPart(db, {
      sessionID, messageID, type, ordinal,
      output: text,
      createdAt: existing?.created_at ?? partAt,
      completedAt: completedAt ?? existing?.completed_at ?? null,
      toolState: 'complete',
    });
    syncMessageText(db, { sessionID, messageID, type });
    return { inserted: result.inserted, type };
  }
  if (type === 'tool') {
    const state = part.state && typeof part.state === 'object' ? part.state : {};
    const result = upsertPart(db, {
      sessionID, messageID, type: 'tool', ordinal,
      toolName: ensureString(part.tool ?? part.toolName),
      toolState: ensureString(state.status) ?? 'called',
      input: state.input !== undefined ? jsonish(redactDeep(state.input)) : null,
      output: state.output !== undefined ? jsonish(redactDeep(state.output)) : null,
      error: state.error !== undefined ? jsonish(redactDeep(state.error)) : null,
      filePath: ensureString(state.input?.filePath ?? state.input?.path ?? state.metadata?.filePath),
      createdAt: partAt,
      completedAt: isoOf(state.time?.end) ?? completedAt,
    });
    const path = ensureString(state.input?.filePath ?? state.input?.path);
    if (path) writeSessionFile(db, { sessionID, path, action: 'edit', messageID });
    if (/todo/i.test(part.tool ?? part.toolName ?? '')) applyTodoTool(db, sessionID, state.input ?? state.output);
    return { inserted: result.inserted, type: 'tool' };
  }
  if (type === 'file') {
    writeSessionFile(db, {
      sessionID,
      path: part.filename ?? part.path ?? part.url,
      action: 'read',
      messageID,
    });
    return { inserted: false, type };
  }
  const result = upsertPart(db, {
    sessionID, messageID, type, ordinal,
    output: part.text ? capText(part.text).text : null,
    createdAt: partAt,
    completedAt,
    toolState: type,
  });
  return { inserted: result.inserted, type };
}

function importMessage(db, { sessionID, entry, at }) {
  if (!entry || typeof entry !== 'object') return { inserted: false, parts: 0, messageID: null };
  const info = entry.info && typeof entry.info === 'object' ? entry.info : entry;
  const fallbackRole = ensureString(info.role) ?? 'assistant';
  const messageID = ensureString(info.id) ?? messageIDOf(info, sessionID, fallbackRole);
  const tokens = tokenShape(info);
  const role = fallbackRole;
  const type = info.summary === true ? 'compaction' : 'message';
  const seq = numOrNull(info.seq ?? info.sequence);
  const created = isoOf(info.time?.created ?? info.createdAt) ?? at;
  const completed = isoOf(info.time?.completed ?? info.completedAt);
  const existing = readMessageRow(db, messageID);
  const text = capText(typeof info.text === 'string' ? redactSecrets(info.text) : '').text;
  const reasoning = capText(typeof info.reasoning === 'string' ? redactSecrets(info.reasoning) : '').text;
  const error = info.error ? jsonish(redactDeep(info.error)) : null;
  const model = ensureString(info.model?.id ?? info.modelID ?? info.model);
  const agent = ensureString(info.agent ?? info.mode);
  const cost = numOrNull(info.cost);
  const finish = ensureString(info.finish ?? info.stop);

  let inserted = false;
  if (!existing) {
    db.prepare(`
      INSERT INTO session_messages(id, session_id, role, type, seq, agent, model, cost,
        tokens_input, tokens_output, text, reasoning, finish, error, created_at, completed_at, raw_hash)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO NOTHING
    `).run(
      messageID, sessionID, role, type, seq === null ? null : Math.trunc(seq), agent, model, cost,
      tokens ? tokens.input : null, tokens ? tokens.output : null,
      text || null, reasoning || null, finish, error, created, completed,
      sha256(canonicalJson({ role, type, text, reasoning, error, finish })),
    );
    inserted = true;
  } else {
    const nextHash = sha256(canonicalJson({ role, type, text, reasoning, error, finish, completed }));
    if (existing.raw_hash !== nextHash) {
      const patchParts = [];
      const params = [];
      if (text && text !== (existing.text ?? '')) { patchParts.push('text = ?'); params.push(text); }
      if (reasoning && reasoning !== (existing.reasoning ?? '')) { patchParts.push('reasoning = ?'); params.push(reasoning); }
      if (error && error !== (existing.error ?? null)) { patchParts.push('error = ?'); params.push(error); }
      if (completed && completed !== (existing.completed_at ?? null)) { patchParts.push('completed_at = ?'); params.push(completed); }
      db.prepare(`UPDATE session_messages SET ${patchParts.length ? `${patchParts.join(', ')}, ` : ''}raw_hash = ? WHERE id = ?`)
        .run(...params, nextHash, messageID);
    }
  }

  let parts = 0;
  const partList = Array.isArray(entry.parts) ? entry.parts : [];
  partList.forEach((part, index) => {
    const ordinal = numOrNull(part?.index) ?? index;
    const result = importPart(db, { sessionID, messageID, part, at: created, ordinal: Math.trunc(ordinal) });
    if (result.inserted) parts += 1;
  });
  return { inserted, parts, messageID };
}

/**
 * ingestSession — imports an OpenCode export shape (`{info, messages}`) or a
 * flat session record. Idempotent: re-importing the same export inserts nothing.
 */
export function ingestSession(db, {
  session = null, messages = null, parts = null, events = null, project = null, source = 'import',
} = {}) {
  const info = normalizeImportInfo(session);
  const sessionID = ensureString(info.id ?? info.sessionID ?? session?.sessionID);
  if (!sessionID) throw new Error('SESSION_ID_REQUIRED');
  const at = isoOf(info.time?.created ?? info.created ?? info.createdAt) ?? nowISO();

  const projectIdFromArg = resolveProjectIdRef(db, project);
  const projectIdFromDirectory = resolveProjectIdByPath(db, info.directory ?? info.cwd ?? info.path);
  ensureSession(db, sessionID, { at, source });
  const fromInfo = sessionPatchFromInfo(info);
  let created = null;
  let updated = null;
  for (const key of ['created_at', 'updated_at']) {
    if (fromInfo[key]) fromInfo[key] = isoOf(fromInfo[key]) ?? fromInfo[key];
  }
  created = fromInfo.created_at ?? at;
  updated = fromInfo.updated_at ?? at;
  patchSession(db, sessionID, {
    ...fromInfo,
    project_id: projectIdFromArg ?? projectIdFromDirectory,
    raw_hash: digestOf({ ...fromInfo, at }),
    source: source ?? null,
  });
  patchSession(db, sessionID, { created_at: created, updated_at: updated });

  const messageList = Array.isArray(messages) ? messages : (Array.isArray(session?.messages) ? session.messages : []);
  let messageCount = 0;
  let partCount = 0;
  const seenMessages = [];
  for (const entry of messageList) {
    const result = importMessage(db, { sessionID, entry, at });
    if (result.inserted) messageCount += 1;
    partCount += result.parts;
    if (result.messageID) seenMessages.push(result.messageID);
  }

  const flatParts = Array.isArray(parts) ? parts : [];
  for (const part of flatParts) {
    const messageID = ensureString(part?.messageID ?? part?.message_id) ?? seenMessages[0];
    if (!messageID) continue;
    ensureMessage(db, { sessionID, messageID, role: ensureString(part?.role) ?? 'assistant', at });
    const result = importPart(db, { sessionID, messageID, part, at, ordinal: ordinalOf(part) });
    if (result.inserted) partCount += 1;
  }

  const eventList = Array.isArray(events) ? events : [];
  let eventCount = 0;
  for (const event of eventList) {
    const result = ingestEvent(db, { sessionID, ...event }, { project: project ?? null, source });
    if (result.inserted) eventCount += 1;
  }

  reindexSessionFts(db, sessionID);
  return {
    sessionID,
    messages: messageCount,
    parts: partCount,
    events: eventCount,
    inserted: messageCount + partCount + eventCount,
  };
}

// ---------------------------------------------------------------------------
// Read surfaces
// ---------------------------------------------------------------------------

function mapSessionRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id ?? null,
    project: row.project ?? null,
    parentId: row.parent_id ?? null,
    title: row.title ?? null,
    directory: row.directory ?? null,
    agent: row.agent ?? null,
    model: row.model ?? null,
    status: row.status ?? null,
    outcome: row.outcome ?? null,
    cost: row.cost ?? 0,
    tokens: {
      input: row.tokens_input ?? 0,
      output: row.tokens_output ?? 0,
      reasoning: row.tokens_reasoning ?? 0,
      cacheRead: row.tokens_cache_read ?? 0,
      cacheWrite: row.tokens_cache_write ?? 0,
    },
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    source: row.source ?? null,
    rawHash: row.raw_hash ?? null,
  };
}

export function listSessions(db, { project = null, query = null, status = null, limit = 50 } = {}) {
  const where = [];
  const params = [];
  if (project !== null && project !== undefined && project !== '') {
    const projectId = resolveProjectIdRef(db, project);
    if (projectId === null) return [];
    where.push('s.project_id = ?');
    params.push(projectId);
  }
  if (status) {
    where.push('s.status = ?');
    params.push(String(status));
  }
  if (query) {
    const like = `%${String(query).toLowerCase()}%`;
    where.push(`(
      lower(s.id) LIKE ? OR lower(IFNULL(s.title, '')) LIKE ?
      OR EXISTS (SELECT 1 FROM session_messages m WHERE m.session_id = s.id AND lower(IFNULL(m.text, '')) LIKE ?)
      OR EXISTS (SELECT 1 FROM session_fts f WHERE f.session_id = s.id AND lower(f.text) LIKE ?)
    )`);
    params.push(like, like, like, like);
  }
  const max = Math.min(500, Math.max(1, Number(limit) || 50));
  const sql = `
    SELECT s.*, p.name AS project FROM sessions s
    LEFT JOIN projects p ON p.id = s.project_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY s.updated_at DESC, s.id ASC
    LIMIT ?
  `;
  return db.prepare(sql).all(...params, max).map(mapSessionRow);
}

export function getSession(db, { id } = {}) {
  if (!id) return { session: null, messages: [], parts: [], events: [], files: [], todos: [] };
  const row = db.prepare(`
    SELECT s.*, p.name AS project FROM sessions s
    LEFT JOIN projects p ON p.id = s.project_id
    WHERE s.id = ?
  `).get(String(id));
  if (!row) return { session: null, messages: [], parts: [], events: [], files: [], todos: [] };
  const messages = db.prepare(`
    SELECT * FROM session_messages WHERE session_id = ?
    ORDER BY seq ASC, created_at ASC, id ASC
  `).all(row.id).map((m) => ({
    id: m.id,
    sessionId: m.session_id,
    role: m.role,
    type: m.type,
    seq: m.seq,
    agent: m.agent,
    model: m.model,
    cost: m.cost ?? 0,
    tokens: {
      input: m.tokens_input ?? 0,
      output: m.tokens_output ?? 0,
    },
    text: m.text ?? '',
    reasoning: m.reasoning ?? '',
    finish: m.finish ?? null,
    error: m.error ?? null,
    createdAt: m.created_at ?? null,
    completedAt: m.completed_at ?? null,
  }));
  const parts = db.prepare(`
    SELECT * FROM session_parts WHERE session_id = ?
    ORDER BY message_id ASC, ordinal ASC, id ASC
  `).all(row.id).map((p) => ({
    id: p.id,
    messageId: p.message_id,
    sessionId: p.session_id,
    ordinal: p.ordinal ?? 0,
    type: p.type,
    toolName: p.tool_name ?? null,
    toolState: p.tool_state ?? null,
    input: p.input ?? null,
    output: p.output ?? null,
    filePath: p.file_path ?? null,
    error: p.error ?? null,
    createdAt: p.created_at ?? null,
    completedAt: p.completed_at ?? null,
  }));
  const events = db.prepare(`
    SELECT * FROM session_events WHERE session_id = ?
    ORDER BY at ASC, seq ASC, id ASC
  `).all(row.id).map((e) => ({
    id: e.id,
    sessionId: e.session_id,
    seq: e.seq,
    type: e.type,
    at: e.at ?? null,
    data: safeJsonParse(e.data, {}) ?? {},
    durable: Number(e.durable) === 1,
  }));
  const files = db.prepare(`
    SELECT path, action, message_id FROM session_files
    WHERE session_id = ? ORDER BY path ASC, action ASC
  `).all(row.id).map((f) => ({ path: f.path, action: f.action, messageId: f.message_id ?? null }));
  const todos = db.prepare(`
    SELECT id, content, status, priority FROM session_todos
    WHERE session_id = ? ORDER BY id ASC
  `).all(row.id).map((t) => ({
    id: t.id, content: t.content ?? '', status: t.status ?? 'pending', priority: t.priority ?? null,
  }));
  return { session: mapSessionRow(row), messages, parts, events, files, todos };
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function deriveSummary(db, id) {
  const session = readSessionRow(db, id);
  if (!session) return null;
  const messages = db.prepare(`
    SELECT role, text, reasoning, error, cost, tokens_input, tokens_output, created_at, completed_at
    FROM session_messages WHERE session_id = ? ORDER BY seq, created_at, id
  `).all(id);
  const parts = db.prepare(`
    SELECT type, tool_name, tool_state, error FROM session_parts WHERE session_id = ? ORDER BY id
  `).all(id);
  const events = db.prepare(`
    SELECT type, at, data FROM session_events WHERE session_id = ? ORDER BY at, seq, id
  `).all(id);
  const fileRows = db.prepare('SELECT path FROM session_files WHERE session_id = ? ORDER BY path').all(id);
  const todoRows = db.prepare('SELECT id, content, status, priority FROM session_todos WHERE session_id = ? ORDER BY id').all(id);

  const toolMap = new Map();
  for (const part of parts) {
    if (part.type !== 'tool' || !part.tool_name) continue;
    const entry = toolMap.get(part.tool_name) ?? { name: part.tool_name, calls: 0, failed: 0 };
    entry.calls += 1;
    if (part.tool_state === 'failed') entry.failed += 1;
    toolMap.set(part.tool_name, entry);
  }
  const tools = [...toolMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const errors = uniqueInOrder([
    ...parts.map((p) => p.error),
    ...messages.map((m) => m.error),
    ...events
      .filter((e) => e.type === 'session.execution.failed' || e.type === 'session.execution.interrupted')
      .map((e) => {
        const data = safeJsonParse(e.data, {}) ?? {};
        return data.error ?? data.message ?? (e.type === 'session.execution.interrupted' ? 'interrupted' : 'execution failed');
      }),
  ]);

  let stepTokens = null;
  let stepCost = null;
  let usageTokens = null;
  let usageCost = null;
  let lastExecution = null;
  for (const event of events) {
    if (event.type === 'session.usage.updated') {
      const data = safeJsonParse(event.data, {}) ?? {};
      const t = tokenShape(data);
      if (t) usageTokens = t;
      if (data.cost !== undefined) usageCost = numOrNull(data.cost);
    }
    if (event.type === 'session.step.ended') {
      const data = safeJsonParse(event.data, {}) ?? {};
      const t = tokenShape(data);
      if (t) stepTokens = addTokens(stepTokens ?? zeroTokens(), t);
      const cost = numOrNull(data.cost);
      if (cost !== null) stepCost = (stepCost ?? 0) + cost;
    }
    if (event.type.startsWith('session.execution.') && event.type !== 'session.execution.started') {
      lastExecution = { type: event.type, at: event.at };
    }
  }

  let messageTokens = zeroTokens();
  let messageHasTokens = false;
  let messageCost = 0;
  let messageHasCost = false;
  for (const message of messages) {
    const input = numOrNull(message.tokens_input);
    const output = numOrNull(message.tokens_output);
    if (input !== null || output !== null) {
      messageHasTokens = true;
      messageTokens = addTokens(messageTokens, { input: input ?? 0, output: output ?? 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 });
    }
    const cost = numOrNull(message.cost);
    if (cost !== null) { messageHasCost = true; messageCost += cost; }
  }

  const rowTokens = {
    input: numOrNull(session.tokens_input) ?? 0,
    output: numOrNull(session.tokens_output) ?? 0,
    reasoning: numOrNull(session.tokens_reasoning) ?? 0,
    cacheRead: numOrNull(session.tokens_cache_read) ?? 0,
    cacheWrite: numOrNull(session.tokens_cache_write) ?? 0,
  };
  const rowHasTokens = Object.values(rowTokens).some((v) => v !== 0);

  const messageTokensMerged = {
    input: messageTokens.input,
    output: messageTokens.output,
    reasoning: Math.max(messageTokens.reasoning, rowTokens.reasoning),
    cacheRead: Math.max(messageTokens.cacheRead, rowTokens.cacheRead),
    cacheWrite: Math.max(messageTokens.cacheWrite, rowTokens.cacheWrite),
  };

  const tokens = usageTokens ?? stepTokens ?? (messageHasTokens ? messageTokensMerged : (rowHasTokens ? rowTokens : zeroTokens()));
  const cost = usageCost ?? stepCost ?? (messageHasCost ? messageCost : (numOrNull(session.cost) ?? 0));

  const files = uniqueInOrder([
    ...fileRows.map((f) => f.path),
    ...events
      .filter((e) => e.type === 'session.step.ended')
      .flatMap((e) => {
        const data = safeJsonParse(e.data, {}) ?? {};
        return Array.isArray(data.files)
          ? data.files.map((entry) => (typeof entry === 'string' ? entry : entry?.path))
          : [];
      }),
  ]);

  let outcome = ensureString(session.outcome);
  if (lastExecution) {
    if (lastExecution.type === 'session.execution.failed') outcome = 'failed';
    else if (lastExecution.type === 'session.execution.interrupted') outcome = 'interrupted';
    else if (lastExecution.type === 'session.execution.succeeded') outcome = 'completed';
  }
  if (ensureString(session.status) === 'archived') outcome = 'archived';
  if (!outcome) {
    outcome = session.status === 'idle' ? (errors.length ? 'error' : 'completed') : 'active';
  }

  const startedAt = session.created_at ?? null;
  const updatedAt = session.updated_at ?? null;
  const started = startedAt ? Date.parse(startedAt) : NaN;
  const ended = updatedAt ? Date.parse(updatedAt) : NaN;
  const durationMs = Number.isFinite(started) && Number.isFinite(ended) ? Math.max(0, ended - started) : 0;

  return {
    id: session.id,
    title: session.title ?? null,
    status: session.status ?? null,
    outcome,
    durationMs,
    tokens: {
      input: tokens.input,
      output: tokens.output,
      reasoning: tokens.reasoning,
      cacheRead: tokens.cacheRead,
      cacheWrite: tokens.cacheWrite,
      total: totalTokens(tokens),
    },
    cost,
    tools,
    files,
    errors,
    todos: todoRows.map((t) => ({
      id: t.id, content: t.content ?? '', status: t.status ?? 'pending', priority: t.priority ?? null,
    })),
    startedAt,
    updatedAt,
  };
}

export function sessionSummary(db, { id } = {}) {
  return deriveSummary(db, id);
}

export function finalizeSession(db, { id, now = null } = {}) {
  const session = readSessionRow(db, id);
  if (!session) return null;
  if (now) {
    const iso = isoOf(now) ?? ensureString(now);
    if (iso) patchSession(db, id, { updated_at: iso });
  }
  const first = deriveSummary(db, id);
  if (!first) return null;
  patchSession(db, id, {
    outcome: first.outcome,
    cost: first.cost,
    tokens_input: first.tokens.input,
    tokens_output: first.tokens.output,
    tokens_reasoning: first.tokens.reasoning,
    tokens_cache_read: first.tokens.cacheRead,
    tokens_cache_write: first.tokens.cacheWrite,
  });
  return deriveSummary(db, id);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CONTEXT_PRIORITY = {
  task: 0, decision: 1, error: 2, file: 3, todo: 4, tool: 5, assistant: 6, reasoning: 7,
};

function contextCandidates(db, data) {
  const { session, messages, parts, files, todos, events } = data;
  const id = session.id;
  const candidates = [];

  const userMessages = messages.filter((m) => m.role === 'user' && m.text && m.text.trim());
  const lastUser = userMessages[userMessages.length - 1];
  if (lastUser) {
    candidates.push({ kind: 'task', ref: `${id}:message:${lastUser.id}:user`, text: lastUser.text.trim() });
  } else {
    const firstAssistant = messages.find((m) => m.text && m.text.trim());
    if (firstAssistant) {
      candidates.push({ kind: 'task', ref: `${id}:message:${firstAssistant.id}:first`, text: firstAssistant.text.trim() });
    }
  }

  const decisions = [];
  for (const message of messages) {
    for (const line of String(message.text ?? '').split('\n')) {
      if (/@hq:why|\bdecision\b|\bdecided\b/i.test(line)) decisions.push(line.trim());
    }
  }
  if (decisions.length) {
    candidates.push({ kind: 'decision', ref: `${id}:decisions`, text: uniqueInOrder(decisions).slice(0, 20).join('\n') });
  }

  const errors = uniqueInOrder([
    ...parts.map((p) => p.error),
    ...messages.map((m) => m.error),
  ]);
  if (errors.length) {
    candidates.push({ kind: 'error', ref: `${id}:errors`, text: errors.slice(0, 20).join('\n') });
  }

  const paths = uniqueInOrder(files.map((f) => f.path));
  if (paths.length) {
    candidates.push({ kind: 'file', ref: `${id}:files`, text: paths.slice(0, 60).join('\n') });
  }

  const openTodos = todos.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  if (openTodos.length) {
    candidates.push({
      kind: 'todo',
      ref: `${id}:todos`,
      text: openTodos.map((t) => `[${t.status}] ${t.content}`).join('\n'),
    });
  }

  const toolNames = uniqueInOrder(parts.filter((p) => p.type === 'tool').map((p) => p.toolName));
  if (toolNames.length) {
    candidates.push({ kind: 'tool', ref: `${id}:tools`, text: toolNames.join('\n') });
  }

  const assistantMessages = messages.filter((m) => m.role !== 'user' && m.text && m.text.trim());
  const lastAssistant = assistantMessages[assistantMessages.length - 1];
  if (lastAssistant) {
    candidates.push({
      kind: 'assistant',
      ref: `${id}:message:${lastAssistant.id}:assistant`,
      text: lastAssistant.text.trim(),
    });
  }
  const reasoningMessages = messages.filter((m) => m.reasoning && m.reasoning.trim());
  const lastReasoning = reasoningMessages[reasoningMessages.length - 1];
  if (lastReasoning) {
    candidates.push({
      kind: 'reasoning',
      ref: `${id}:message:${lastReasoning.id}:reasoning`,
      text: lastReasoning.reasoning.trim(),
    });
  }

  const executionErrors = events
    .filter((e) => e.type.startsWith('session.execution.') && e.type !== 'session.execution.started')
    .map((e) => `${e.type} ${e.at ?? ''}`.trim());
  if (executionErrors.length > 1) {
    candidates.push({ kind: 'error', ref: `${id}:timeline`, text: executionErrors.join('\n') });
  }

  return candidates.map((candidate) => ({
    ...candidate,
    priority: CONTEXT_PRIORITY[candidate.kind] ?? 99,
  }));
}

function renderContextText(sources) {
  return sources.map((source) => `SOURCE ${source.ref} (${source.kind}, ~${source.tokens} tokens)\n${source.text}`).join('\n\n');
}

/**
 * sessionContext — bounded, provenance-linked evidence for reuse in a new task.
 * Deterministic: same rows always produce the same sources, text and digest.
 */
export function sessionContext(db, { id, budgetTokens = 3000 } = {}) {
  const data = getSession(db, { id });
  const budget = Math.min(24_000, Math.max(256, Number(budgetTokens) || 3000));
  const capacity = budget - 80;
  if (!data.session) {
    return { sources: [], text: '', digest: digestOf({ schema: SESSION_SCHEMA, id: id ?? null, sources: [] }) };
  }

  const candidates = contextCandidates(db, data)
    .sort((a, b) => (a.priority - b.priority) || a.ref.localeCompare(b.ref));

  const sources = [];
  let used = 0;
  for (const candidate of candidates) {
    const text = String(candidate.text ?? '').trim();
    if (!text) continue;
    let tokens = estimateTokens(text);
    let body = text;
    if (used + tokens > capacity) {
      const remaining = capacity - used;
      if (remaining < 60) continue;
      const chars = Math.max(0, remaining * 3);
      body = text.slice(0, chars);
      if (!body.trim()) continue;
      tokens = estimateTokens(body);
    }
    if (used + tokens > capacity) continue;
    used += tokens;
    sources.push({
      ref: candidate.ref,
      kind: candidate.kind,
      text: body,
      tokens,
      sha256: sha256(body),
    });
  }

  const text = renderContextText(sources);
  const digest = digestOf({
    schema: SESSION_SCHEMA,
    id: data.session.id,
    sources: sources.map((s) => ({ ref: s.ref, kind: s.kind, sha256: s.sha256, tokens: s.tokens })),
  });
  return { sources, text, digest };
}

// ---------------------------------------------------------------------------
// Linking
// ---------------------------------------------------------------------------

export function linkSessionProject(db, { id, projectId } = {}) {
  if (!id) return false;
  const session = readSessionRow(db, id);
  if (!session) return false;
  const resolved = resolveProjectIdRef(db, projectId);
  if (resolved === null) return false;
  const result = db.prepare('UPDATE sessions SET project_id = ? WHERE id = ?').run(resolved, String(id));
  return Number(result.changes) > 0;
}
