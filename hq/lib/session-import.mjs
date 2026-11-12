/**
 * @hq:context Import exported OpenCode session files (`opencode.session/1`) into HQ session tables.
 * @hq:owner hq
 * @hq:task LAB-01
 * @hq:invariant Adapt only: persistence is delegated to ingestSession() in ./sessions.mjs.
 * @hq:invariant Never throw for a bad file: unreadable/invalid/foreign/oversized input becomes an error string.
 * @hq:invariant Deterministic: directory imports sort by file name; message seq order is preserved; no clock in outputs.
 * @hq:invariant Never store raw credential-shaped values: local prefix scrub + ingestSession redaction both apply.
 * @hq:see hq/lib/sessions.mjs
 * @hq:see docs/SESSION-SEARCH-RECIPE.md
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ingestSession, redactSecrets } from './sessions.mjs';

export const SESSION_IMPORT_SCHEMA = 'hq.session-import/1';

/** Export schema this importer understands. */
const EXPORT_SCHEMA = 'opencode.session/1';
/** Hard cap for one export file (64 MiB). Larger files are refused before reading. */
const MAX_IMPORT_BYTES = 64 * 1024 * 1024;
/** Only real session exports are candidates; index.json and anything else is ignored. */
const SESSION_FILE_PATTERN = /^ses_[A-Za-z0-9]+\.json$/;
/** Export message types that carry no user/assistant content. */
const NON_CONTENT_TYPES = new Set(['synthetic', 'system', 'idle', 'model-switched']);
/** Content block types mapped to session parts. */
const CONTENT_BLOCK_TYPES = new Set(['text', 'reasoning', 'tool']);
/** Deep-redaction depth guard, mirroring the sessions module. */
const MAX_REDACT_DEPTH = 8;

/**
 * @hq:why redactSecrets() (sessions.mjs) strips assignments, bearer values and
 * secret paths, but a bare provider key such as `sk-…` inside prose is not an
 * assignment. These prefix patterns close that gap before anything is stored.
 */
const SECRET_PATTERNS = Object.freeze([
  [/\bsk-[A-Za-z0-9_-]{16,}/g, 'sk-[REDACTED]'],
  [/\b(?:ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]{16,}/g, '[REDACTED_GITHUB_TOKEN]'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, '[REDACTED_SLACK_TOKEN]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED_AWS_KEY]'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]'],
]);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function numOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Epoch ms (or a parseable date string) to ISO; anything unparseable is omitted. */
function isoFrom(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (raw === '') return null;
    if (/^\d+$/.test(raw)) return isoFrom(Number(raw));
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

/** `model` may be a plain id or the export's `{ id, providerID }` object. */
function modelOf(value) {
  const direct = str(value);
  if (direct) return direct;
  if (value && typeof value === 'object') {
    return str(value.id) ?? str(value.modelID) ?? str(value.model);
  }
  return null;
}

function scrubSecrets(value) {
  if (typeof value !== 'string' || value === '') return value;
  let out = value;
  for (const [pattern, replacement] of SECRET_PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

function scrubDeep(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return scrubSecrets(value);
  if (typeof value !== 'object') return value;
  if (depth > MAX_REDACT_DEPTH) return '[REDACTED_DEPTH]';
  if (Array.isArray(value)) return value.map((item) => scrubDeep(item, depth + 1));
  const out = {};
  for (const key of Object.keys(value)) out[key] = scrubDeep(value[key], depth + 1);
  return out;
}

/**
 * @hq:why part text is stored by importPart() without redaction, so the same
 * scrubbing that protects message text must be applied here before delegation.
 */
function safeText(value) {
  if (typeof value !== 'string') return null;
  return redactSecrets(scrubSecrets(value));
}

// ---------------------------------------------------------------------------
// Adaptation (export shape -> ingestSession shape)
// ---------------------------------------------------------------------------

function adaptInfo(session) {
  const info = {
    id: str(session.id),
    title: str(session.title),
    directory: str(session.directory),
    agent: str(session.agent),
    model: modelOf(session.model),
    cost: numOrNull(session.cost),
    tokens_input: numOrNull(session.tokens_input),
    tokens_output: numOrNull(session.tokens_output),
    tokens_reasoning: numOrNull(session.tokens_reasoning),
    tokens_cache_read: numOrNull(session.tokens_cache_read),
    tokens_cache_write: numOrNull(session.tokens_cache_write),
  };
  const time = {};
  const created = isoFrom(session.time_created);
  const updated = isoFrom(session.time_updated);
  if (created) time.created = created;
  if (updated) time.updated = updated;
  info.time = time;
  return info;
}

function adaptContentBlocks(content) {
  const parts = [];
  for (const block of Array.isArray(content) ? content : []) {
    if (!block || typeof block !== 'object') continue;
    const type = str(block.type);
    if (!type || !CONTENT_BLOCK_TYPES.has(type)) continue;
    if (type === 'text' || type === 'reasoning') {
      const text = safeText(block.text);
      if (text === null) continue;
      parts.push({ type, text });
      continue;
    }
    const state = block.state && typeof block.state === 'object' ? scrubDeep(block.state) : {};
    parts.push({
      type: 'tool',
      tool: str(block.name) ?? str(block.tool),
      state,
    });
  }
  return parts;
}

function adaptMessage(entry, sessionInfo) {
  if (!entry || typeof entry !== 'object') return null;
  const type = str(entry.type);
  if (!type || NON_CONTENT_TYPES.has(type)) return null;
  if (type !== 'user' && type !== 'assistant') return null;
  const id = str(entry.id);
  if (!id) return null;

  const seq = numOrNull(entry.seq);
  const created = isoFrom(entry.timeCreated) ?? isoFrom(entry.data?.time?.created);
  const role = type === 'user' ? 'user' : 'assistant';
  const info = { id, role };
  if (seq !== null) info.seq = Math.trunc(seq);
  if (created) info.time = { created };

  if (role === 'user') {
    const text = safeText(entry.data?.text) ?? '';
    /**
     * @hq:why importMessage() reads the message body from `info.text`, while the
     * export contract describes `{ info, text }`. Both are populated so the
     * declared shape holds and the prompt actually persists.
     */
    info.text = text;
    return { info, text };
  }

  const model = modelOf(entry.data?.model) ?? sessionInfo.model;
  const agent = str(entry.data?.agent) ?? sessionInfo.agent;
  if (model) info.model = model;
  if (agent) info.agent = agent;
  return { info, parts: adaptContentBlocks(entry.data?.content) };
}

/**
 * adaptSessionExport — maps one decoded `opencode.session/1` export to the
 * `{ info, messages }` shape ingestSession() accepts.
 * Returns null when the document is not a session export.
 */
export function adaptSessionExport(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null;
  if (doc.schema !== EXPORT_SCHEMA) return null;
  const session = doc.session;
  if (!session || typeof session !== 'object') return null;
  const info = adaptInfo(session);
  if (!info.id) return null;
  const messages = [];
  for (const entry of Array.isArray(doc.messages) ? doc.messages : []) {
    const adapted = adaptMessage(entry, info);
    if (adapted) messages.push(adapted);
  }
  return { info, messages };
}

/**
 * @hq:why sessionPatchFromInfo() reads token totals through `info.tokens`, so
 * the flat `tokens_*` export fields are mirrored into that nested shape at
 * import time (adaptSessionExport stays contract-exact).
 */
function withTokenTotals(info) {
  const tokens = {
    input: info.tokens_input,
    output: info.tokens_output,
    reasoning: info.tokens_reasoning,
    cacheRead: info.tokens_cache_read,
    cacheWrite: info.tokens_cache_write,
  };
  if (Object.values(tokens).every((value) => value === null)) return info;
  return { ...info, tokens };
}

function emptyFileResult(file) {
  return {
    file, sessionId: null, title: null, messages: 0, parts: 0, inserted: 0, skipped: 0, error: null,
  };
}

function messageOf(error) {
  return String(error && error.message ? error.message : error ?? 'unknown');
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * importSessionFile — reads one export file and hands it to ingestSession().
 * Never throws for a bad file: the failure becomes `error` (a string).
 * Idempotent because ingestSession() is idempotent.
 */
export function importSessionFile(db, filePath, { project = null, source = 'session-export' } = {}) {
  const file = String(filePath ?? '');
  const result = emptyFileResult(file);
  try {
    let size = null;
    try {
      const stat = statSync(file);
      if (!stat.isFile()) return { ...result, error: 'UNREADABLE' };
      size = stat.size;
    } catch {
      return { ...result, error: 'UNREADABLE' };
    }
    if (Number(size) > MAX_IMPORT_BYTES) return { ...result, error: 'TOO_LARGE' };

    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      return { ...result, error: 'UNREADABLE' };
    }

    let doc;
    try {
      doc = JSON.parse(raw);
    } catch {
      return { ...result, error: 'INVALID_JSON' };
    }

    const adapted = adaptSessionExport(doc);
    if (!adapted) return { ...result, error: 'NOT_A_SESSION_EXPORT' };

    let ingested;
    try {
      ingested = ingestSession(db, {
        session: withTokenTotals(adapted.info),
        messages: adapted.messages,
        project,
        source,
      });
    } catch (error) {
      return {
        ...result,
        sessionId: adapted.info.id,
        title: adapted.info.title,
        error: `INGEST_FAILED: ${messageOf(error)}`,
      };
    }

    const messages = Number(ingested?.messages) || 0;
    const parts = Number(ingested?.parts) || 0;
    return {
      file,
      sessionId: adapted.info.id,
      title: adapted.info.title,
      messages,
      parts,
      inserted: messages + parts,
      skipped: Math.max(0, adapted.messages.length - messages),
      error: null,
    };
  } catch {
    return { ...result, error: 'UNREADABLE' };
  }
}

/**
 * importSessionDirectory — imports every `ses_*.json` file in a directory,
 * sorted by name. Per-file failures are collected in `errors` and never abort
 * the run. `limit` (0 = unlimited) caps how many files are processed.
 */
export function importSessionDirectory(db, dir, {
  project = null, source = 'session-export', limit = 0,
} = {}) {
  const directory = String(dir ?? '');
  const summary = {
    dir: directory,
    files: 0,
    sessions: 0,
    messages: 0,
    parts: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  let names;
  try {
    const stat = statSync(directory);
    if (!stat.isDirectory()) return { ...summary, errors: [{ file: directory, error: 'DIR_MISSING' }] };
    names = readdirSync(directory);
  } catch {
    return { ...summary, errors: [{ file: directory, error: 'DIR_MISSING' }] };
  }

  const candidates = names.filter((name) => SESSION_FILE_PATTERN.test(name)).sort();
  const max = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.floor(Number(limit)) : 0;
  const selected = max > 0 ? candidates.slice(0, max) : candidates;

  for (const name of selected) {
    const fileResult = importSessionFile(db, join(directory, name), { project, source });
    summary.files += 1;
    if (fileResult.error) {
      summary.errors.push({ file: fileResult.file, error: fileResult.error });
      continue;
    }
    summary.sessions += 1;
    summary.messages += fileResult.messages;
    summary.parts += fileResult.parts;
    summary.inserted += fileResult.inserted;
    summary.skipped += fileResult.skipped;
  }

  return summary;
}
