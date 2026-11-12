// @ts-check
/**
 * @hq:context ChatGPT coordination broker — a queue/dispatcher ADAPTER over the existing Studio
 *   chat channel and journal: many logical seats submit bounded requests, one serialized send path
 * @hq:owner channel-manager
 * @hq:task ADR-CHATGPT-COORDINATION-BROKER (Phase 2, launch-2026-11-08 handoff @48fc6e6)
 * @hq:invariant one Studio browser owner, one drive lease, one canonical ChatGPT transport: this
 *   module spawns no CDP client and opens no HTTP to ChatGPT; actual sends go only through the
 *   injected transport (the existing `studio chat ask` command path), constructed only when a
 *   caller explicitly passes an owner authorization reference
 * @hq:invariant one send attempt per requestId; a timeout is UNCERTAIN and is never auto-resent
 * @hq:invariant revoked scope is refused at the send boundary; an unknown thread identity fails
 *   closed — 'chatgpt-live-tab' is not durable thread identity
 * @hq:invariant a model reply is parsed into proposals only and is never routed to a shell,
 *   GitHub, or a provider send
 * @hq:invariant the request record and the receipt are written once (wx) and never rewritten; the
 *   journal is append-only JSONL, so a crash between intent and receipt reconciles determinately
 * @hq:invariant the registry migration refuses to run while the two channel-manager mirrors
 *   differ by hash (adversarial matrix #12)
 * @hq:see doc:docs/architecture/ADR-CHATGPT-COORDINATION-BROKER.md
 * @hq:see doc:docs/orchestration/intelligence-upgrade/VIVIM-LAUNCH-CHATGPT-COORDINATION-HANDOFF.md
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nowISO, sha256, sha256File } from './util.mjs';
import { DEFAULT_CHANNEL_ROOT, loadSeats, promptCarriesSecret, roster } from './channel-seats.mjs';

export const BROKER_SCHEMA = 'vivim.channel-broker/1';
export const RECEIPT_SCHEMA = 'vivim.channel-broker/1.receipt';
export const PROPOSALS_SCHEMA = 'vivim.channel-broker/1.proposals';
export const LOGICAL_SEATS_SCHEMA = 'vivim.channel-broker/1.logical-seats';
export { DEFAULT_CHANNEL_ROOT };

/** Thread keys that were never durable identity. Always refused, even if somehow registered. */
export const NON_DURABLE_THREAD_KEYS = ['chatgpt-live-tab'];

/** The four logical seats the ADR admits. No provider-send or push authority, by name. */
export const LOGICAL_SEATS = [
  {
    id: 'lead-research', title: 'LEAD RESEARCH (ChatGPT)', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['chatgpt.research.request', 'chatgpt.review.request', 'coordination.submit'],
    denied: ['provider-send', 'push', 'shell-exec', 'approval'],
  },
  {
    id: 'local-supervisor', title: 'LOCAL SUPERVISOR', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['coordination.submit', 'coordination.execute-approved', 'receipts.publish'],
    denied: ['provider-send', 'push'],
  },
  {
    id: 'channel-broker', title: 'CHATGPT COORDINATION BROKER', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['coordination.queue', 'coordination.route', 'coordination.serialize-send'],
    denied: ['provider-send', 'direct-provider-send', 'push'],
  },
  {
    id: 'evidence-verifier', title: 'EVIDENCE VERIFIER', kind: 'logical', site: null, session: null,
    submitsVia: 'channel-broker',
    scopes: ['evidence.verify', 'tests.run', 'coordination.review-proposals'],
    denied: ['provider-send', 'push'],
  },
];

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function repoMirrorPath() {
  return join(REPO_ROOT, '.opencode', 'agent', 'channel-manager.md');
}

export function liveMirrorPath() {
  return join(homedir(), '.zcode', 'agents', 'channel-manager.md');
}

// ------------------------------------------------------------------ paths ----

export function brokerDir(root = DEFAULT_CHANNEL_ROOT) {
  return join(root, 'broker');
}

function requestsDir(root) {
  return join(brokerDir(root), 'requests');
}

function journalDir(root) {
  return join(brokerDir(root), 'journal');
}

function receiptsDir(root) {
  return join(brokerDir(root), 'receipts');
}

function proposalsDir(root) {
  return join(brokerDir(root), 'proposals');
}

function brokerThreadsFile(root) {
  return join(brokerDir(root), 'threads.json');
}

// ------------------------------------------------------------- identities ----

/**
 * The deterministic request id: the same logical request from the same seat, task and thread
 * always lands on the same id, so a resubmit is an idempotent read, never a second send.
 * Time is deliberately not an input.
 */
export function brokerRequestId({ originSeat, taskId, threadKey, promptDigest }) {
  const digest = sha256([originSeat ?? '', taskId ?? '', threadKey ?? '', promptDigest ?? ''].join('|'));
  return `CB-${digest.slice(0, 20)}`;
}

/**
 * Durable thread identity. A thread key must be registered in the CNP thread registry
 * (`channel/threads.json`, schema cnp/1, `byKey`) or the broker's own registry
 * (`channel/broker/threads.json`). A key in NON_DURABLE_THREAD_KEYS is refused outright.
 */
export function knownThreadKey(root, threadKey) {
  const key = String(threadKey ?? '').trim();
  if (!key) return { known: false, code: 'THREAD_IDENTITY_MISSING', detail: 'a request needs a durable thread key' };
  if (NON_DURABLE_THREAD_KEYS.includes(key)) {
    return { known: false, code: 'THREAD_IDENTITY_NOT_DURABLE', detail: `"${key}" is a live-tab handle, not durable thread identity` };
  }
  for (const file of [join(root, 'threads.json'), brokerThreadsFile(root)]) {
    if (!existsSync(file)) continue;
    try {
      const doc = JSON.parse(readFileSync(file, 'utf8'));
      const byKey = doc?.byKey ?? {};
      if (byKey[key]) return { known: true, code: 'THREAD_KNOWN', detail: `registered in ${file}`, source: file };
    } catch { /* an unreadable registry cannot vouch for a thread */ }
  }
  return { known: false, code: 'THREAD_IDENTITY_UNKNOWN', detail: `"${key}" is not in any thread registry; fail closed` };
}

/**
 * Register a durable thread key in the broker's own registry (never the CNP registry).
 *
 * @param {string} root
 * @param {{threadKey?: string, authorizationRef?: string|null, note?: string|null, at?: string}} opts
 */
export function registerThread(root, { threadKey, authorizationRef, note = null, at = nowISO() } = {}) {
  const check = knownThreadKey(root, threadKey);
  if (check.known) return { decision: 'DUPLICATE', threadKey, source: check.source };
  if (!check.known && check.code !== 'THREAD_IDENTITY_UNKNOWN') {
    return { decision: 'DENIED', code: check.code, detail: check.detail };
  }
  mkdirSync(brokerDir(root), { recursive: true });
  const file = brokerThreadsFile(root);
  const doc = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { schema: BROKER_SCHEMA, byKey: {} };
  doc.byKey = doc.byKey ?? {};
  doc.byKey[threadKey] = { registeredAt: at, authorizationRef: authorizationRef ?? null, note };
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  return { decision: 'REGISTERED', threadKey, file };
}

// ------------------------------------------------------------- revocation ----

/**
 * Revocations live in `channel/revocations/<taskId>.json` — the Studio CLI's own store.
 * Fail closed: an unreadable revocation file cannot prove the revocation absent, so it is
 * returned as a malformed entry that matches EVERY request until the file is repaired.
 */
export function loadRevocations(root) {
  if (!root) return [];
  const dir = join(root, 'revocations');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return { file: f, ...JSON.parse(readFileSync(join(dir, f), 'utf8')) };
      } catch (error) {
        return { file: f, malformed: true, reason: `unreadable revocation file (${error.message})` };
      }
    });
}

/** A revocation matches on taskId, requestId, seat or scope — whichever it names. A malformed revocation file matches everything (fail closed). */
export function revocationFor(request, revocations = loadRevocations(request?.channelRoot)) {
  return revocations.find((r) =>
    r.malformed === true
    || (r.taskId && r.taskId === request.taskId)
    || (r.requestId && r.requestId === request.requestId)
    || (r.seat && r.seat === request.originSeat)
    || (r.scope && r.scope === request.scope)
    || (r.taskId && r.taskId === request.requestId)
  ) ?? null;
}

// ------------------------------------------------------------------ grants ----

export const GRANT_SCHEMA = 'vivim.channel-broker/1.grant';

/**
 * Pure grant validation — leg 1 of the three JOINT send legs (grant, fence, thread).
 * A real Host trusted grant must be bound to the origin seat, this requestId or this
 * scope, the provider account, the provider thread key, a future expiry, a live
 * non-revocation, and exactly ONE effect owner (the single Studio/drive owner).
 *
 * @param {any} grant
 * @param {any} request
 * @param {{at?: string, revocations?: any[], expectedOwner?: string|null}} opts
 */
export function validateGrant(grant, request, { at = nowISO(), revocations = [], expectedOwner = null } = {}) {
  if (grant === null || grant === undefined) {
    return { ok: false, code: 'GRANT_MISSING', detail: 'the transport requires a trusted Host grant and none was presented' };
  }
  if (typeof grant !== 'object' || Array.isArray(grant)) {
    return { ok: false, code: 'GRANT_INVALID', detail: 'a grant is a single object, not this shape' };
  }
  if (typeof grant.owner !== 'string' || !grant.owner.trim()) {
    return { ok: false, code: 'GRANT_INVALID', detail: 'a grant names exactly ONE effect owner' };
  }
  if (typeof grant.expiresAt !== 'string' || !Number.isFinite(Date.parse(grant.expiresAt))) {
    return { ok: false, code: 'GRANT_INVALID', detail: `grant expiry ${JSON.stringify(grant.expiresAt ?? null)} is not a parseable ISO-8601 timestamp` };
  }
  if (Date.parse(grant.expiresAt) <= Date.parse(at)) {
    return { ok: false, code: 'GRANT_EXPIRED', detail: `the grant expired at ${grant.expiresAt}` };
  }
  const revocation = revocationFor({
    requestId: grant.requestId ?? request?.requestId,
    scope: grant.scope,
    originSeat: grant.originSeat,
    taskId: grant.taskId ?? null,
  }, revocations);
  if (revocation) {
    return { ok: false, code: 'GRANT_REVOKED', detail: `revocation ${revocation.file} covers this grant (${revocation.reason ?? 'no reason recorded'})` };
  }
  const mismatches = [];
  if (request) {
    if (grant.originSeat !== request.originSeat) mismatches.push(`originSeat ${JSON.stringify(grant.originSeat ?? null)} does not match the request seat ${JSON.stringify(request.originSeat ?? null)}`);
    if (grant.threadKey !== request.thread?.key) mismatches.push(`threadKey ${JSON.stringify(grant.threadKey ?? null)} does not match the request thread ${JSON.stringify(request.thread?.key ?? null)}`);
    if (grant.account !== (request.account ?? request.site)) mismatches.push(`account ${JSON.stringify(grant.account ?? null)} does not match the request account ${JSON.stringify(request.account ?? request.site ?? null)}`);
    if (!(grant.requestId === request.requestId || (grant.scope && grant.scope === request.scope))) {
      mismatches.push('the grant names neither this requestId nor this scope');
    }
  }
  if (expectedOwner != null && grant.owner !== expectedOwner) {
    mismatches.push(`grant owner ${JSON.stringify(grant.owner)} is not the transport's single owner ${JSON.stringify(expectedOwner)}`);
  }
  if (mismatches.length) {
    return { ok: false, code: 'GRANT_MISMATCH', detail: mismatches.join('; ') };
  }
  return { ok: true, code: 'GRANT_OK', owner: grant.owner, grantDigest: sha256(JSON.stringify(grant)) };
}

// ------------------------------------------------------------- send fence ----

export const SEND_FENCE_SCHEMA = 'vivim.channel-broker/1.fence';

function fencesDir(root) {
  return join(brokerDir(root), 'fences');
}

/** The global cross-process send claim for one requestId. */
export function sendFencePath(root, requestId) {
  return join(fencesDir(root), `${requestId}.claim`);
}

/**
 * Leg 2 of the three JOINT send legs: one global effect writer. The claim is created
 * with 'wx' (O_EXCL) so exactly one process anywhere on the machine can hold it; the
 * loser never calls the transport. A dead or unprovable holder fails conservative:
 * reconcile UNCERTAIN, keep the claim, never resend, never take over.
 *
 * @param {string} root
 * @param {string} requestId
 * @param {{grantDigest?: string|null, pid?: number, at?: string}} opts
 */
export function acquireSendFence(root, requestId, { grantDigest = null, pid = process.pid, at = nowISO() } = {}) {
  mkdirSync(fencesDir(root), { recursive: true });
  const file = sendFencePath(root, requestId);
  const fence = {
    schema: SEND_FENCE_SCHEMA,
    requestId,
    holderPid: pid,
    holderStartedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    at,
    grantDigest,
  };
  try {
    writeFileSync(file, `${JSON.stringify(fence, null, 2)}\n`, { flag: 'wx' });
    // `detail: null` keeps the ok/refused union uniform for the drain's journal + receipt
    // writes, which read `fence.detail` on either branch (never persisted to the fence file).
    return { ok: true, code: 'FENCE_ACQUIRED', fencePath: file, fence, detail: null };
  } catch {
    return { ok: false, ...describeHeldFence(file, requestId) };
  }
}

function describeHeldFence(file, requestId) {
  let holder = null;
  try { holder = JSON.parse(readFileSync(file, 'utf8')); } catch { holder = null; }
  const pid = holder?.holderPid;
  let alive = null; // null = liveness cannot be proven
  if (Number.isInteger(pid) && pid > 0) {
    try {
      process.kill(pid, 0);
      alive = true;
    } catch (error) {
      const code = /** @type {any} */ (error).code;
      alive = code === 'ESRCH' ? false : (code === 'EPERM' ? true : null); // EPERM proves existence
    }
  }
  if (alive === true) {
    return { ok: false, code: 'SEND_FENCE_HELD', fencePath: file, holder, detail: `the send fence for ${requestId} is held by live process ${pid}; a send may be in flight — UNCERTAIN, never resent` };
  }
  return { ok: false, code: 'SEND_FENCE_ORPHANED', fencePath: file, holder, detail: `the send fence for ${requestId} is orphaned (holder ${String(pid ?? 'unknown')} ${alive === false ? 'is gone' : 'liveness unprovable'}); reconciled UNCERTAIN, never resent, never taken over` };
}

/** Release the claim this process holds. A crash before release is reconciled conservatively. */
export function releaseSendFence(root, requestId) {
  try {
    unlinkSync(sendFencePath(root, requestId));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- journal ----

function appendJournal(root, requestId, event, extra = {}) {
  const dir = journalDir(root);
  mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({ at: nowISO(), requestId, event, ...extra });
  // Append-only: one JSONL line per transition, never rewritten.
  appendFileSync(join(dir, `${requestId}.jsonl`), `${line}\n`);
}

function readJournal(root, requestId) {
  const file = join(journalDir(root), `${requestId}.jsonl`);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

const TERMINAL_STATES = ['SENT', 'UNCERTAIN', 'REFUSED', 'CANCELLED'];

/** Current state = the last state-bearing journal event. Derives; never trusts a cache. */
export function requestState(root, requestId) {
  const events = readJournal(root, requestId);
  const stateEvent = [...events].reverse().find((e) => TERMINAL_STATES.includes(e.event) || e.event === 'QUEUED' || e.event === 'send-attempt');
  if (!stateEvent) return { state: 'UNJOURNALED', events };
  if (TERMINAL_STATES.includes(stateEvent.event)) return { state: stateEvent.event, events, at: stateEvent.at };
  if (stateEvent.event === 'send-attempt') return { state: 'SEND_ATTEMPTED', events, at: stateEvent.at };
  return { state: 'QUEUED', events, at: stateEvent.at };
}

function readRequest(root, requestId) {
  const file = join(requestsDir(root), `${requestId}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeReceiptOnce(root, requestId, receipt) {
  const dir = receiptsDir(root);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${requestId}.json`);
  // wx: the first terminal record wins; a later event can never rewrite history.
  try {
    writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
    return file;
  } catch {
    return null; // receipt already on disk — original stands unchanged
  }
}

// ------------------------------------------------------------------ guards ----

function resolveOriginSeat(root, originSeat) {
  const doc = loadSeats(root);
  const logical = Array.isArray(doc.logicalSeats) ? doc.logicalSeats : [];
  const seat = roster(doc).find((s) => String(s.id).toLowerCase() === String(originSeat).toLowerCase())
    ?? logical.find((s) => String(s.id).toLowerCase() === String(originSeat).toLowerCase());
  return seat ? { doc, seat } : null;
}

/**
 * The whole submit policy in one place. Returns a decision, never booleans.
 * Submit alone never sends: it queues, journals, and returns.
 *
 * @param {{
 *   root?: string, originSeat?: string, taskId?: string, threadKey?: string, prompt?: string,
 *   priority?: number, deadline?: string|null, maxTurns?: number, expectedReplyShape?: string,
 *   contextSnapshotRef?: string|null, ownerAuthorizationRef?: string|null, grant?: any,
 *   scope?: string, site?: string, account?: string|null, at?: string,
 * }} opts
 */
export function submitRequest({
  root = DEFAULT_CHANNEL_ROOT,
  originSeat,
  taskId,
  threadKey,
  prompt,
  priority = 5,
  deadline = null,
  maxTurns = 1,
  expectedReplyShape = 'prose',
  contextSnapshotRef = null,
  ownerAuthorizationRef = null,
  grant = null,
  scope = 'chatgpt.send',
  site = 'chatgpt',
  account = null,
  at = nowISO(),
} = {}) {
  if (!originSeat) return deny('ORIGIN_SEAT_MISSING', 'a request names the logical seat that submitted it');
  const resolved = resolveOriginSeat(root, originSeat);
  if (!resolved) return deny('ORIGIN_SEAT_UNKNOWN', `"${originSeat}" is not a registered seat; submit from a seat in the registry`);
  if (!taskId) return deny('TASK_ID_MISSING', 'a request carries the task id it serves');
  const text = String(prompt ?? '').trim();
  if (!text) return deny('EMPTY_PROMPT', 'the prompt is what the canonical channel would send; it may not be empty');
  if (promptCarriesSecret(text)) return deny('SECRET_IN_PROMPT', 'the prompt carries a credential shape; name where to read it instead');
  const thread = knownThreadKey(root, threadKey);
  if (!thread.known) return deny(thread.code, thread.detail);

  const promptDigest = sha256(text);
  const requestId = brokerRequestId({ originSeat, taskId, threadKey, promptDigest });
  // Queue-time revocation and deadline checks mirror the send boundary: a request that can
  // never be sent is refused at the queue, not left to rot until a drain runs.
  const queuedRevocation = revocationFor({ taskId, requestId, originSeat, scope, channelRoot: root }, loadRevocations(root));
  if (queuedRevocation) {
    return deny('SCOPE_REVOKED', `revocation ${queuedRevocation.file} covers this request (${queuedRevocation.reason ?? 'no reason recorded'})`);
  }
  if (deadline != null) {
    const deadlineTs = Date.parse(String(deadline));
    if (!Number.isFinite(deadlineTs)) return deny('DEADLINE_INVALID', `deadline "${deadline}" is not a parseable ISO-8601 timestamp`);
    if (deadlineTs < Date.parse(at)) return deny('DEADLINE_PASSED', `deadline ${deadline} already passed at queue time`);
  }
  const existing = readRequest(root, requestId);
  if (existing) {
    const state = requestState(root, requestId).state;
    return {
      decision: 'DUPLICATE', code: 'REQUEST_ALREADY_ON_RECORD', requestId, state,
      detail: 'the identical request is already on record; the original receipt stands, nothing is sent again',
      requestPath: join(requestsDir(root), `${requestId}.json`),
    };
  }

  const record = {
    schema: BROKER_SCHEMA,
    requestId,
    createdAt: at,
    originSeat,
    ownerAuthorizationRef,
    grant,
    taskId,
    thread: { key: threadKey, source: thread.source ?? null },
    site,
    account,
    scope,
    priority,
    deadline,
    maxTurns,
    prompt: text,
    promptDigest,
    expectedReplyShape,
    contextSnapshotRef,
    sendAttemptsAllowed: 1,
  };

  mkdirSync(requestsDir(root), { recursive: true });
  try {
    writeFileSync(join(requestsDir(root), `${requestId}.json`), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  } catch (error) {
    return deny('REQUEST_WRITE_FAILED', `could not journal the request: ${error.message}`);
  }
  appendJournal(root, requestId, 'QUEUED', { originSeat, taskId, threadKey, priority, authorizationRef: ownerAuthorizationRef ? 'present' : null });
  return { decision: 'QUEUED', code: 'REQUEST_QUEUED', requestId, requestPath: join(requestsDir(root), `${requestId}.json`), detail: 'queued; nothing is sent until a drain runs with a transport' };
}

function deny(code, detail) {
  return { decision: 'DENIED', code, detail };
}

/**
 * Invariant 4: re-validate everything at the send boundary, after queueing and immediately
 * before the single send attempt.
 */
export function sendBoundary(root, request, { at = nowISO(), revocations = null } = {}) {
  const thread = knownThreadKey(root, request.thread?.key);
  if (!thread.known) return { ok: false, code: thread.code, detail: thread.detail };
  const revocation = revocationFor(request, revocations ?? loadRevocations(root));
  if (revocation) {
    return { ok: false, code: 'SCOPE_REVOKED', detail: `revocation ${revocation.file} covers this request (${revocation.reason ?? 'no reason recorded'})`, revocation };
  }
  if (request.deadline && (!Number.isFinite(Date.parse(request.deadline)) || Date.parse(request.deadline) < Date.parse(at))) {
    return { ok: false, code: Number.isFinite(Date.parse(request.deadline)) ? 'DEADLINE_PASSED' : 'DEADLINE_INVALID', detail: `deadline ${request.deadline} is ${Number.isFinite(Date.parse(request.deadline)) ? 'passed before the send boundary' : 'not a parseable ISO-8601 timestamp'}` };
  }
  return { ok: true, code: 'BOUNDARY_OK', detail: 'scope, revocation, thread and deadline validated' };
}

// ------------------------------------------------------------------ queue ----

function queuedRequests(root) {
  const dir = requestsDir(root);
  if (!existsSync(dir)) return [];
  const rows = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const request = readRequest(root, f.replace(/\.json$/, ''));
    if (!request) continue;
    const { state } = requestState(root, request.requestId);
    rows.push({ request, state });
  }
  return rows;
}

function compareQueue(a, b) {
  const p = (Number(a.request.priority) || 0) - (Number(b.request.priority) || 0);
  if (p !== 0) return p;
  const t = String(a.request.createdAt).localeCompare(String(b.request.createdAt));
  if (t !== 0) return t;
  return String(a.request.requestId).localeCompare(String(b.request.requestId));
}

// One drain at a time per channel root, even if two callers race. The promise chain
// is the serialization: the second drain starts only after the first finished.
const drainLocks = new Map();

/**
 * Dispatch queued requests head-by-head through the one injected transport.
 * `transport` is injectable: a mock in tests, the existing Studio chat command in production.
 * With no transport, every request stays QUEUED — a queue-only drain sends nothing.
 *
 * @param {{root?: string, transport?: any, at?: string}} opts
 */
export function drain(opts = {}) {
  const root = opts.root ?? DEFAULT_CHANNEL_ROOT;
  const key = String(root);
  const prev = drainLocks.get(key) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(() => drainNow({ ...opts, root }));
  // A failed drain must not poison the chain for the next caller.
  drainLocks.set(key, next.catch(() => {}));
  return next;
}

/**
 * @param {{root?: string, transport?: any, at?: string, reloadRevocations?: null | (() => any[])}} opts
 */
async function drainNow({ root, transport = null, at = nowISO(), reloadRevocations = null } = {}) {
  // Revocations are re-read fresh from disk at every check; tests may inject a reader
  // to prove the ordering (boundary read, then a second read after the fence is held).
  const rereadRevocations = reloadRevocations ?? (() => loadRevocations(root));
  const summary = { at, attempted: 0, sent: 0, uncertain: 0, refused: 0, stillQueued: 0, results: [] };
  const queued = queuedRequests(root).filter((r) => r.state === 'QUEUED').sort(compareQueue);
  for (const { request } of queued) {
    const state = requestState(root, request.requestId).state;
    if (state !== 'QUEUED') {
      // A concurrent terminal event won; never re-decide it. But the drain summary
      // must still account for this request: a late loser whose fence was already
      // released by the winner used to be silently skipped here, leaving the
      // caller with no result entry (heldBy undefined) for a queued request.
      summary.results.push({
        requestId: request.requestId,
        state: 'ALREADY_TERMINAL',
        code: 'REQUEST_ALREADY_TERMINAL',
        detail: `request is ${state} before this drain attempt; concurrent terminal event owns the outcome`,
      });
      continue;
    }

    const boundary = sendBoundary(root, request, { at, revocations: rereadRevocations() });
    if (!boundary.ok) {
      appendJournal(root, request.requestId, 'REFUSED', { code: boundary.code, detail: boundary.detail, stage: 'send-boundary' });
      writeReceiptOnce(root, request.requestId, {
        schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: 'REFUSED', effect: 'REFUSED',
        code: boundary.code, detail: boundary.detail, promptDigest: request.promptDigest, sendAttempts: 0,
      });
      summary.refused += 1;
      summary.results.push({ requestId: request.requestId, state: 'REFUSED', code: boundary.code });
      continue;
    }

    if (!transport || typeof transport.send !== 'function') {
      summary.stillQueued += 1;
      summary.results.push({ requestId: request.requestId, state: 'QUEUED', code: 'NO_TRANSPORT' });
      continue;
    }

    // One send attempt per requestId, enforced against the journal itself: a request
    // that already has a send-attempt line can never reach the transport again.
    const priorAttempt = requestState(root, request.requestId).events.some((e) => e.event === 'send-attempt');
    if (priorAttempt) {
      summary.results.push({ requestId: request.requestId, state: 'UNCERTAIN', code: 'SEND_ALREADY_ATTEMPTED' });
      continue;
    }

    // A2 leg 1 — proof of grant. A transport that declares requiresGrant sends only on a
    // grant bound to this seat, requestId-or-scope, account, thread, a future expiry, a
    // live non-revocation, and ONE effect owner matching the transport's own owner.
    let grantDigest = null;
    if (transport.requiresGrant === true) {
      const grantVerdict = validateGrant(request.grant ?? null, request, { at, revocations: rereadRevocations(), expectedOwner: transport.owner ?? null });
      if (!grantVerdict.ok) {
        appendJournal(root, request.requestId, 'REFUSED', { code: grantVerdict.code, detail: grantVerdict.detail, stage: 'grant' });
        writeReceiptOnce(root, request.requestId, {
          schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: 'REFUSED', effect: 'REFUSED',
          code: grantVerdict.code, transport: transport.name ?? 'injected', promptDigest: request.promptDigest,
          sendAttempts: 0, detail: grantVerdict.detail,
        });
        summary.refused += 1;
        summary.results.push({ requestId: request.requestId, state: 'REFUSED', code: grantVerdict.code });
        continue;
      }
      grantDigest = grantVerdict.grantDigest;
    }

    // A2 leg 2 — one global effect writer: the cross-process send fence, acquired 'wx'
    // before the send-attempt journal line. A loser never calls the transport; a dead or
    // unprovable holder reconciles conservatively (UNCERTAIN, never resent).
    const fence = acquireSendFence(root, request.requestId, { grantDigest });
    if (!fence.ok) {
      appendJournal(root, request.requestId, 'UNCERTAIN', { code: fence.code, detail: fence.detail, stage: 'send-fence' });
      writeReceiptOnce(root, request.requestId, {
        schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: 'UNCERTAIN', effect: 'UNVERIFIED',
        code: fence.code, transport: transport.name ?? 'injected', promptDigest: request.promptDigest,
        sendAttempts: 0, detail: fence.detail,
      });
      summary.uncertain += 1;
      summary.results.push({ requestId: request.requestId, state: 'UNCERTAIN', code: fence.code });
      continue;
    }

    try {
      // Conservative re-reads now that this process holds the claim: another process may
      // have journaled a send attempt in the race window, or a revocation may have landed.
      if (requestState(root, request.requestId).events.some((e) => e.event === 'send-attempt')) {
        summary.results.push({ requestId: request.requestId, state: 'UNCERTAIN', code: 'SEND_ALREADY_ATTEMPTED' });
        continue;
      }
      const postFenceRevocation = revocationFor(request, rereadRevocations());
      if (postFenceRevocation) {
        appendJournal(root, request.requestId, 'REFUSED', { code: 'SCOPE_REVOKED', detail: `revocation ${postFenceRevocation.file} covers this request (${postFenceRevocation.reason ?? 'no reason recorded'})`, stage: 'post-fence' });
        writeReceiptOnce(root, request.requestId, {
          schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: 'REFUSED', effect: 'REFUSED',
          code: 'SCOPE_REVOKED', transport: transport.name ?? 'injected', promptDigest: request.promptDigest,
          sendAttempts: 0, detail: 'a revocation landed while the send fence was held; refused before any send',
        });
        summary.refused += 1;
        summary.results.push({ requestId: request.requestId, state: 'REFUSED', code: 'SCOPE_REVOKED' });
        continue;
      }
      appendJournal(root, request.requestId, 'send-attempt', { transport: transport.name ?? 'injected', authorizationRef: request.ownerAuthorizationRef ? 'present' : null });
      summary.attempted += 1;

      let answer = null;
      let threw = null;
      try {
        answer = await transport.send(request);
      } catch (error) {
        threw = error;
      }

      const pending = threw || answer?.pending === true || (answer && answer.accepted !== true && answer.pending === undefined && isTimeout(answer));
      if (answer?.accepted === true) {
        const proposals = parseReplyProposals(String(answer.reply ?? ''));
        appendJournal(root, request.requestId, 'SENT', {
          transport: transport.name ?? 'injected', threadId: answer.threadId ?? null,
          receiptId: answer.receiptId ?? null, promptDigest: request.promptDigest,
          proposalCount: proposals.proposals.length,
        });
        const receiptPath = writeReceiptOnce(root, request.requestId, {
          schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: 'SENT', effect: answer.effect ?? 'SENT',
          transport: transport.name ?? 'injected', threadId: answer.threadId ?? null,
          providerReceiptRef: answer.receiptId ?? null, promptDigest: request.promptDigest,
          reply: String(answer.reply ?? ''), proposals, sendAttempts: 1, detail: answer.detail ?? null,
        });
        summary.sent += 1;
        summary.results.push({ requestId: request.requestId, state: 'SENT', receiptPath });
      } else if (pending) {
        // Timeout or unknown outcome after the send may have left: UNCERTAIN is terminal,
        // and nothing ever re-sends.
        appendJournal(root, request.requestId, 'UNCERTAIN', {
          transport: transport.name ?? 'injected',
          detail: threw ? String(threw.message) : (answer?.detail ?? 'transport reported the outcome unknown'),
        });
        const receiptPath = writeReceiptOnce(root, request.requestId, {
          schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: 'UNCERTAIN', effect: 'UNVERIFIED',
          transport: transport.name ?? 'injected', promptDigest: request.promptDigest, sendAttempts: 1,
          detail: threw ? String(threw.message) : (answer?.detail ?? 'the send outcome is unknown; reconcile by observation, never by resend'),
        });
        summary.uncertain += 1;
        summary.results.push({ requestId: request.requestId, state: 'UNCERTAIN', receiptPath });
      } else {
        // The transport answered with an explicit refusal before any send left.
        appendJournal(root, request.requestId, 'REFUSED', { code: 'TRANSPORT_REFUSED', detail: answer?.detail ?? 'the transport refused before any send', stage: 'transport' });
        const receiptPath = writeReceiptOnce(root, request.requestId, {
          schema: RECEIPT_SCHEMA, requestId: request.requestId, at, state: 'REFUSED', effect: 'REFUSED',
          code: 'TRANSPORT_REFUSED', transport: transport.name ?? 'injected', promptDigest: request.promptDigest,
          sendAttempts: 1, detail: answer?.detail ?? 'the transport refused before any send',
        });
        summary.refused += 1;
        summary.results.push({ requestId: request.requestId, state: 'REFUSED', receiptPath });
      }
    } finally {
      // The claim is released only after a terminal event is journaled; a crash before
      // that leaves the claim for conservative reconciliation (never a resend).
      releaseSendFence(root, request.requestId);
    }
  }
  return summary;
}

function isTimeout(answer) {
  return typeof answer?.detail === 'string' && /timeout|timed out|ETIMEDOUT/i.test(answer.detail);
}

// ------------------------------------------------------------------ cancel ----

/**
 * Only a QUEUED request can be cancelled. Once a send was attempted, cancel would lie.
 *
 * @param {{root?: string, requestId?: string, actor?: string|null, at?: string}} opts
 */
export function cancelPending({ root = DEFAULT_CHANNEL_ROOT, requestId, actor = null, at = nowISO() } = {}) {
  const request = readRequest(root, requestId);
  if (!request) return deny('REQUEST_UNKNOWN', `"${requestId}" is not on record`);
  const { state } = requestState(root, requestId);
  if (state !== 'QUEUED') {
    return deny('CANCEL_REFUSED_NOT_QUEUED', `the request is ${state}, not QUEUED; a send may already have left, so it cannot be cancelled`);
  }
  appendJournal(root, requestId, 'CANCELLED', { actor });
  return { decision: 'CANCELLED', code: 'REQUEST_CANCELLED', requestId, detail: 'the queued request was cancelled before any send' };
}

// ----------------------------------------------------------------- replies ----

const DANGEROUS_PATTERNS = [
  { re: /\brm\s+-rf\b/i, label: 'shell-delete' },
  { re: /\bgit\s+push\b/i, label: 'git-push' },
  { re: /\bgit\s+reset\s+--hard\b/i, label: 'git-reset' },
  { re: /\bcurl\b[^|]*\|\s*(ba)?sh\b/i, label: 'remote-exec' },
  { re: /\b(bash|sh|powershell|cmd)\s+-c\b/i, label: 'shell-exec' },
  { re: /\b(send|post|submit)\s+(to\s+)?(chatgpt|provider|github)\b/i, label: 'provider-send' },
  { re: /\bapprove\b|\bauthorization\b/i, label: 'self-approval' },
];

/**
 * Invariant 6: the reply of the model is untrusted input. It becomes a proposal document
 * that requires owner approval. Nothing here executes, spawns, or routes anywhere.
 */
export function parseReplyProposals(replyText) {
  const text = String(replyText ?? '');
  const proposals = [];
  const fence = /```([A-Za-z0-9_-]*)\r?\n([\s\S]*?)```/g;
  let m = null;
  while ((m = fence.exec(text)) !== null) {
    const content = m[2] ?? '';
    proposals.push({
      index: proposals.length,
      kind: 'code-block',
      language: m[1] || null,
      content,
      sha256: sha256(content),
      dangerous: DANGEROUS_PATTERNS.some((p) => p.re.test(content)),
      execution: 'none',
      requiresOwnerApproval: true,
    });
    if (proposals.length > 100) break; // a bounded parse, never an unbounded one
  }
  return {
    schema: PROPOSALS_SCHEMA,
    parsedAt: nowISO(),
    execution: 'none',
    requiresOwnerApproval: true,
    note: 'parsed from an untrusted model reply; proposals are inert until a locally authorized contract accepts them',
    proposals,
  };
}

/**
 * Record a captured reply: parse to proposals, journal, and store — never execute.
 *
 * @param {{root?: string, requestId?: string, replyText?: string, at?: string}} opts
 */
export function recordReply({ root = DEFAULT_CHANNEL_ROOT, requestId, replyText, at = nowISO() } = {}) {
  const request = readRequest(root, requestId);
  if (!request) return deny('REQUEST_UNKNOWN', `"${requestId}" is not on record`);
  const parsed = parseReplyProposals(replyText);
  const dir = proposalsDir(root);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${requestId}.json`);
  try {
    writeFileSync(file, `${JSON.stringify({ requestId, at, ...parsed }, null, 2)}\n`, { flag: 'wx' });
  } catch {
    return { decision: 'DUPLICATE', code: 'PROPOSALS_ALREADY_RECORDED', requestId, path: file, parsed };
  }
  appendJournal(root, requestId, 'reply-parsed', { proposals: parsed.proposals.length, dangerous: parsed.proposals.filter((p) => p.dangerous).length });
  return { decision: 'RECORDED', code: 'PROPOSALS_RECORDED', requestId, path: file, parsed, execution: 'none' };
}

// ------------------------------------------------------------- transports ----

/**
 * The dry-run/mock transport contract. `send(request)` resolves:
 *   { accepted: true,  reply, threadId, receiptId, effect }  → SENT
 *   { accepted: false, pending: true, detail }               → UNCERTAIN
 *   { accepted: false, detail }                              → REFUSED (before any send)
 * throws                                                    → UNCERTAIN
 */

const CHAT_ASK_SCHEMA = 'vivim.chat-ask-result/1';
const CHAT_ASK_EFFECTS = new Set(['OK', 'UNVERIFIED', 'FAILED']);

/**
 * The win32 ACL plan for the prompt file: inheritance off, then a single grant for the
 * current user only. Exported pure so tests can assert the invocation shape without
 * ever running icacls against a live path.
 *
 * @param {string} promptFile
 * @param {string} userName
 */
export function promptAclCommand(promptFile, userName = process.env.USERNAME || process.env.USER || '') {
  return { command: 'icacls', args: [promptFile, '/inheritance:r', '/grant:r', `${userName}:F`] };
}

/** Default prompt-file hardening: icacls on win32, chmod 0600 elsewhere. */
function defaultPromptAcl(promptFile) {
  if (process.platform === 'win32') {
    const { command, args } = promptAclCommand(promptFile);
    const r = spawnSync(command, args, { windowsHide: true });
    if (r.error || r.status !== 0) {
      throw new Error(`could not restrict the prompt file (${command} exit ${r.status ?? String(/** @type {any} */ (r.error)?.code)})`);
    }
  } else {
    chmodSync(promptFile, 0o600);
  }
}

/**
 * The real transport: the EXISTING Studio chat command path (`studio chat ask --json`),
 * invoked as a one-shot child process. Constructed only when a caller explicitly passes an owner
 * authorization reference; this module never builds it on its own path.
 *
 * The SENT verdict is earned, never fabricated: the whole child stdout must be ONE
 * vivim.chat-ask-result/1 object naming THIS requestId, with a contract effect value;
 * an OK verdict additionally needs a durable threadId, a receiptId and exit status 0.
 * Anything else is pending (UNCERTAIN) when a send may have happened, or a plain refusal.
 *
 * @param {{harnessRoot?: string, studioBin?: string, timeoutSec?: number, nodeBin?: string,
 *          promptAcl?: (promptFile: string) => void}} opts
 */
export function studioChatTransport({ harnessRoot = process.env.VIVIM_HARNESS_ROOT || 'C:/0-BlackBoxProject-0/vivim-web-harness', studioBin, timeoutSec = 120, nodeBin = process.env.HQ_NODE || 'node', promptAcl = defaultPromptAcl } = {}) {
  const bin = studioBin ?? join(harnessRoot, 'studio', 'bin', 'studio.mjs');
  return {
    name: 'studio-chat-ask',
    // A2: the production transport sends nothing without a trusted Host grant bound to a
    // single Studio/drive effect owner — the grant leg is not an independent toggle.
    requiresGrant: true,
    owner: 'studio-drive',
    /** @param {any} request */
    send(request) {
      const promptFile = join(tmpdir(), `hq-broker-${request.requestId}.prompt.txt`);
      writeFileSync(promptFile, String(request.prompt ?? ''), 'utf8');
      try {
        promptAcl(promptFile);
        const args = [
          bin, 'chat', 'ask',
          '--site', String(request.site ?? 'chatgpt'),
          '--thread', String(request.thread?.key ?? ''),
          '--prompt-file', promptFile,
          '--request-id', String(request.requestId),
          '--timeout', String(timeoutSec),
          // One real provider turn, authorized twice: this transport is constructed only when a
          // caller passes an owner authorization reference AND the drain validated a trusted
          // Host grant (requiresGrant). Without these two flags studio runs an offline preview
          // and every send fails closed.
          '--execute',
          '--accept-sends',
          '--json',
        ];
        const r = spawnSync(nodeBin, args, { encoding: 'utf8', timeout: (timeoutSec + 30) * 1000, windowsHide: true });
        if (r.error && /** @type {any} */ (r.error).code === 'ETIMEDOUT') {
          return { accepted: false, pending: true, detail: `studio chat ask outran ${timeoutSec}s; the turn continues detached — UNCERTAIN, never resent` };
        }
        let parsed = null;
        const stdoutText = String(r.stdout ?? '').trim();
        if (stdoutText) {
          try { parsed = JSON.parse(stdoutText); } catch { /* non-JSON output: the child stdout is not one payload object */ }
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.schema !== CHAT_ASK_SCHEMA) {
          return { accepted: false, pending: true, detail: `studio chat ask printed no ${CHAT_ASK_SCHEMA} payload (exit ${r.status ?? 'none'})` };
        }
        if (parsed.requestId !== request.requestId) {
          return { accepted: false, pending: true, detail: `studio chat ask answered for requestId ${JSON.stringify(parsed.requestId ?? null)}, not ${request.requestId}; the outcome for this request is unknown` };
        }
        if (!CHAT_ASK_EFFECTS.has(parsed.effect)) {
          return { accepted: false, pending: true, detail: `studio reported unknown effect ${JSON.stringify(parsed.effect)} for ${request.requestId}; the outcome is unknown` };
        }
        if (parsed.effect === 'OK') {
          if (r.status !== 0) {
            return { accepted: false, pending: true, detail: `studio reported OK but exited ${r.status} for ${request.requestId}; the OK verdict is not trustworthy` };
          }
          if (typeof parsed.threadId !== 'string' || !parsed.threadId.trim() || typeof parsed.receiptId !== 'string' || !parsed.receiptId.trim()) {
            return { accepted: false, pending: true, detail: `studio reported OK without a durable threadId and receiptId for ${request.requestId}; a SENT verdict is never fabricated` };
          }
          return { accepted: true, reply: String(parsed.reply ?? ''), threadId: parsed.threadId, receiptId: parsed.receiptId, effect: 'SENT' };
        }
        if (parsed.effect === 'UNVERIFIED') {
          return { accepted: false, pending: true, detail: `studio reported UNVERIFIED for ${request.requestId}; reconcile by observation` };
        }
        return { accepted: false, detail: `studio reported FAILED for ${request.requestId}` };
      } finally {
        // The prompt file never outlives the send attempt, whatever the child did.
        try { unlinkSync(promptFile); } catch { /* already gone */ }
      }
    },
  };
}

// --------------------------------------------------------------- migration ----

function atomicWrite(file, content) {
  const tmp = `${file}.tmp-${Date.now()}`;
  writeFileSync(tmp, content);
  renameSync(tmp, file);
}

/**
 * Registry migration: append the four logical seats as a compatible, versioned extension.
 * The existing `vivim.channel-seats/1` roster, manager and rules are untouched; `roster()`
 * and `loadSeats()` keep reading exactly what they read before.
 *
 * Gate: the two channel-manager mirrors must hash equal, or the migration refuses
 * (adversarial matrix #12) — a seat contract that differs by copy is two seats.
 *
 * @param {{channelRoot?: string, repoMirror?: string, liveMirror?: string,
 *          backupPath?: string|null, at?: string, actor?: string}} opts
 */
export function migrateRegistry({ channelRoot = DEFAULT_CHANNEL_ROOT, repoMirror = repoMirrorPath(), liveMirror = liveMirrorPath(), backupPath = null, at = nowISO(), actor = 'channel-broker-migration' } = {}) {
  let repoHash = null;
  let liveHash = null;
  try {
    repoHash = sha256File(repoMirror);
    liveHash = sha256File(liveMirror);
  } catch (error) {
    return { decision: 'REFUSED', code: 'MIRROR_UNREADABLE', detail: `could not hash the mirrors: ${error.message}` };
  }
  if (repoHash !== liveHash) {
    return {
      decision: 'REFUSED', code: 'MIRROR_MISMATCH',
      detail: 'channel-manager mirrors differ by hash; reconcile both copies identically before the broker seats join the registry',
      mirrors: { repo: repoHash, live: liveHash, repoPath: repoMirror, livePath: liveMirror },
    };
  }

  const file = join(channelRoot, 'seats.json');
  if (!existsSync(file)) {
    return { decision: 'REFUSED', code: 'REGISTRY_MISSING', detail: `no seat registry at ${file}` };
  }
  const raw = readFileSync(file, 'utf8');
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (error) {
    return { decision: 'REFUSED', code: 'REGISTRY_UNREADABLE', detail: error.message };
  }
  if (doc.schema !== 'vivim.channel-seats/1') {
    return { decision: 'REFUSED', code: 'SCHEMA_UNSUPPORTED', detail: `registry schema is ${doc.schema}, expected vivim.channel-seats/1` };
  }

  const existing = Array.isArray(doc.logicalSeats) ? doc.logicalSeats : [];
  const existingIds = new Set(existing.map((s) => s.id));
  const added = [];
  for (const seat of LOGICAL_SEATS) {
    if (!existingIds.has(seat.id)) {
      existing.push(seat);
      added.push(seat.id);
    }
  }

  const changed = added.length > 0;
  if (changed) {
    if (backupPath) {
      mkdirSync(dirname(backupPath), { recursive: true });
      writeFileSync(backupPath, raw, 'utf8');
    }
    doc.logicalSeats = existing;
    doc.logicalSeatsSchema = LOGICAL_SEATS_SCHEMA;
    doc.logicalSeatsMigratedAt = at;
    doc.logicalSeatsActor = actor;
    doc.updatedAt = at;
    atomicWrite(file, `${JSON.stringify(doc, null, 2)}\n`);
  }

  return {
    decision: changed ? 'MIGRATED' : 'ALREADY_MIGRATED',
    code: changed ? 'LOGICAL_SEATS_ADDED' : 'IDEMPOTENT_NO_CHANGE',
    added,
    changed,
    schema: doc.schema,
    logicalSeatsSchema: LOGICAL_SEATS_SCHEMA,
    logicalSeats: (doc.logicalSeats ?? existing).map((s) => s.id),
    backupPath: changed ? backupPath : null,
    mirrors: { repo: repoHash, live: liveHash, equal: true, repoPath: repoMirror, livePath: liveMirror },
    registryPath: file,
  };
}

// ------------------------------------------------------------------- view ----

export function renderQueueTable(root) {
  const rows = queuedRequests(root).sort(compareQueue).map(({ request, state }) => ({
    requestId: request.requestId,
    originSeat: request.originSeat,
    taskId: request.taskId,
    thread: request.thread?.key ?? null,
    priority: request.priority,
    state,
    createdAt: request.createdAt,
    deadline: request.deadline,
  }));
  const width = Math.max(10, ...rows.map((r) => r.requestId.length));
  const lines = ['REQUEST'.padEnd(width) + '  SEAT               STATE          TASK'];
  for (const r of rows) {
    lines.push(
      r.requestId.padEnd(width) + '  ' + String(r.originSeat).padEnd(18) + ' ' +
      String(r.state).padEnd(14) + ' ' + String(r.taskId),
    );
  }
  return { schema: 'hq.channel-broker-queue/1', requests: rows, lines: rows.length ? lines.join('\n') : 'Queue is empty.' };
}
