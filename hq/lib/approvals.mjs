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

export function approvalId(at = nowISO()) {
  return `AP-${String(at).replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${randomBytes(3).toString('hex')}`;
}

// Append, never rewrite: one JSON object per line, always newline-terminated.
// A tail without a terminator is a truncated write, so a newline is added
// before the next record rather than splicing the old line.
function appendLine(file, record) {
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file)) {
    const existing = readFileSync(file, 'utf8');
    if (existing.length && !existing.endsWith('\n')) appendFileSync(file, '\n', 'utf8');
  }
  appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf8');
  return file;
}

/**
 * Read the whole queue. An unreadable line is counted and skipped: it holds no
 * decision, and a queue that throws on one bad byte hides every good record.
 *
 * @param {string} file
 * @returns {{ exists: boolean, lines: any[], corrupt: number }}
 */
function readLines(file) {
  if (!existsSync(file)) return { exists: false, lines: [], corrupt: 0 };
  /** @type {any[]} */
  const lines = [];
  let corrupt = 0;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    if (!raw.trim()) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') lines.push(parsed);
      else corrupt += 1;
    } catch {
      corrupt += 1;
    }
  }
  return { exists: true, lines, corrupt };
}

/** @param {any} request @param {string} now */
function isExpired(request, now) {
  const expires = Date.parse(String(request?.expiresAt ?? ''));
  if (!Number.isFinite(expires)) return false; // an unreadable expiry is not evidence of one
  return expires <= Date.parse(now);
}

/**
 * One row: the request as written, plus the read-time verdict. A decision, when
 * one exists, outranks expiry — the record says what actually happened.
 *
 * @param {any} request
 * @param {any} decision
 * @param {string} now
 * @returns {ApprovalRow}
 */
function rowOf(request, decision, now) {
  const expired = isExpired(request, now);
  /** @type {string} */
  let state = 'pending';
  if (decision) state = decision.decision === 'allow' ? 'allowed' : 'denied';
  else if (expired) state = 'expired';
  return {
    id: String(request.id),
    at: request.at ?? null,
    requestedBy: request.requestedBy ?? null,
    action: request.action ?? null,
    target: request.target ?? null,
    scope: request.scope ?? null,
    expiresAt: request.expiresAt ?? null,
    state,
    expired,
    decidedAt: decision?.at ?? null,
    decidedBy: decision?.by ?? null,
    note: decision?.note ?? null,
  };
}

/**
 * Fold the ledger into requests and their first decision. Order is the file's
 * order, so "newest first" is the newest appended, not the newest clock.
 *
 * @param {string} file
 * @param {string} now
 */
function fold(file, now) {
  const read = readLines(file);
  /** @type {Map<string, any>} */
  const requests = new Map();
  /** @type {Map<string, any>} */
  const decisions = new Map();
  /** @type {any[]} */
  const order = [];
  for (const record of read.lines) {
    const id = text(record.id);
    if (!id) continue;
    if (record.kind === 'decision' || record.decision) {
      if (!decisions.has(id)) decisions.set(id, record); // the first decision is the decision
      continue;
    }
    if (requests.has(id)) continue;
    requests.set(id, record);
    order.push(record);
  }
  let orphans = 0;
  for (const id of decisions.keys()) if (!requests.has(id)) orphans += 1;
  /** @type {ApprovalRow[]} */
  const rows = order.map((request) => rowOf(request, decisions.get(String(request.id)) ?? null, now)).reverse();
  return { rows, requests, decisions, corrupt: read.corrupt, orphans };
}

/** @param {ApprovalRequestInput} request @param {string} at */
function expiryOf(request, at) {
  const explicit = text(request.expiresAt);
  if (explicit) {
    const parsed = Date.parse(explicit);
    if (!Number.isFinite(parsed)) return refuse('BAD_TTL', `expiresAt "${explicit}" is not an ISO timestamp`);
    return { ok: true, value: new Date(parsed).toISOString() };
  }
  const raw = request.expiresInMinutes ?? request.ttlMinutes ?? DEFAULT_TTL_MINUTES;
  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes < 0) {
    return refuse('BAD_TTL', 'expiresInMinutes must be a number of minutes >= 0');
  }
  return { ok: true, value: new Date(Date.parse(at) + minutes * 60000).toISOString() };
}

// ---------------------------------------------------------------------------
// the queue
// ---------------------------------------------------------------------------

/**
 * Put a request on the queue. A request with no action or no target cannot be
 * approved meaningfully, so it is refused instead of stored.
 *
 * @param {{ file?: string, request?: ApprovalRequestInput, now?: string|Date, id?: string }} [input]
 */
export function enqueue({ file, request = {}, now = nowISO(), id } = {}) {
  const queue = requireFile(file, 'enqueue');
  const action = text(request.action);
  if (!action) return refuse('NO_ACTION', 'a request must name the action it would perform');
  const target = text(request.target);
  if (!target) return refuse('NO_TARGET', 'a request must name the target the action would touch');

  const at = stamp(now);
  const expires = expiryOf(request, at);
  if (!expires.ok) return expires;

  const record = {
    schema: APPROVAL_SCHEMA,
    kind: 'request',
    id: text(id) || approvalId(at),
    at,
    requestedBy: text(request.requestedBy) || null,
    action,
    target,
    scope: text(request.scope) || null,
    state: 'pending',
    expiresAt: expires.value,
  };
  appendLine(queue, record);
  return { ok: true, code: 'ENQUEUED', id: record.id, request: record, file: queue };
}

/**
 * Record the decision. A request is decided once: a second decision is refused
 * rather than appended over the first, and a stale request cannot be approved.
 *
 * @param {{ file?: string, id?: string, decision?: string, by?: string|null, note?: string|null, now?: string|Date }} [input]
 */
export function decide({ file, id, decision, by = null, note = null, now = nowISO() } = {}) {
  const queue = requireFile(file, 'decide');
  const wanted = text(id);
  if (!wanted) return refuse('NO_ID', 'a decision must name the request it decides');
  const verdict = text(decision);
  if (verdict !== 'allow' && verdict !== 'deny') {
    return refuse('BAD_DECISION', 'decision must be "allow" or "deny"');
  }

  const at = stamp(now);
  const folded = fold(queue, at);
  const request = folded.requests.get(wanted);
  if (!request) return refuse('NOT_FOUND', `no request ${wanted} in ${queue}`);

  const prior = folded.decisions.get(wanted);
  if (prior) {
    return refuse(
      'ALREADY_DECIDED',
      `${wanted} was already ${prior.decision} by ${prior.by ?? 'an unnamed decider'} at ${prior.at}; a decision is not rewritten`,
    );
  }
  if (isExpired(request, at)) {
    return refuse(
      'EXPIRED',
      `${wanted} expired at ${request.expiresAt}; enqueue the action again instead of approving a stale request`,
    );
  }

  const record = {
    schema: APPROVAL_SCHEMA,
    kind: 'decision',
    id: wanted,
    at,
    decision: verdict,
    by: text(by) || null,
    note: text(note) || null,
    action: request.action ?? null,
    target: request.target ?? null,
  };
  appendLine(queue, record);
  return { ok: true, code: verdict === 'allow' ? 'ALLOWED' : 'DENIED', id: wanted, decision: record, file: queue };
}

/**
 * The queue as of `now`, newest first. `state` narrows the view: one of STATES,
 * `decided` for a decided request of either outcome, or `all` (the default).
 * Expiry is applied here, at read time, so a request that went stale between
 * enqueue and read is reported as expired rather than pending.
 *
 * @param {{ file?: string, state?: string|null, now?: string|Date }} [input]
 */
export function list({ file, state: filter = null, now = nowISO() } = {}) {
  const queue = requireFile(file, 'list');
  const at = stamp(now);
  const wanted = text(filter).toLowerCase() || 'all';
  const known = ['all', 'decided', ...STATES];
  if (!known.includes(wanted)) return refuse('BAD_STATE', `unknown state "${wanted}" (known: ${known.join(', ')})`);

  const folded = fold(queue, at);
  const rows = folded.rows.filter((row) => {
    if (wanted === 'all') return true;
    if (wanted === 'decided') return row.state === 'allowed' || row.state === 'denied';
    return row.state === wanted;
  });
  return { ok: true, now: at, state: wanted, count: rows.length, approvals: rows };
}

/**
 * Counts for the whole queue, plus the evidence that the fold did not silently
 * drop anything: unreadable lines and decisions that name no request.
 *
 * @param {{ file?: string, now?: string|Date }} [input]
 */
export function state({ file, now = nowISO() } = {}) {
  const queue = requireFile(file, 'state');
  const at = stamp(now);
  const folded = fold(queue, at);
  /** @type {Record<string, number>} */
  const counts = { total: folded.rows.length, pending: 0, allowed: 0, denied: 0, expired: 0 };
  for (const row of folded.rows) counts[row.state] += 1;
  return {
    ok: true,
    file: queue,
    now: at,
    total: counts.total,
    pending: counts.pending,
    allowed: counts.allowed,
    denied: counts.denied,
    expired: counts.expired,
    decided: counts.allowed + counts.denied,
    corrupt: folded.corrupt,
    orphans: folded.orphans,
    newestAt: folded.rows[0]?.at ?? null,
  };
}
