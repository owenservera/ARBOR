/**
 * @hq:context Gemini channel: gemini.* scopes over an injected transport; the site rides on the scope.
 * @hq:owner gemini-channel
 * @hq:task gemini-channel
 * @hq:see docs/chatgpt-channel/CONTRACT.md
 * @hq:see src/studio/chat-channel.mjs
 * @hq:invariant transport is the only way out; no browser, CDP socket, tab or cookie store is opened here.
 * @hq:invariant one send per requestId; a replay returns the original receipt and calls no transport.
 * @hq:invariant UNCERTAIN is terminal for the turn: recorded, never retried, never turned into a reply.
 * @hq:why Gemini does not ride chat-channel.mjs today: this file carries its own copy of the policy
 * @hq:why (its own receipt builder, turn loop and store) instead of being a transport like
 * @hq:why channels/claude.mjs. The shared core already accepts gemini.* scopes, so the gap is not
 * @hq:why the scope table: it is that every shared invariant has to be re-stated here, and one
 * @hq:why (an empty reply is not a delivered turn) was missing until this file was checked.
 */
// Gemini's own channel. The turn loop mirrors chat-channel.mjs invariant for invariant (idempotency
// before scope validation, revocation before every send, budget as PARTIAL, terminal uncertainty,
// receipt = digests only) and differs in exactly two frozen ways: the scope strings are gemini.*,
// and the transport drives the Gemini site rather than ChatGPT.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectDriveLease } from '../../capture/drive-lease.mjs';

export const SITE = 'gemini';
// Frozen contract shared by all seven site owners: the site is carried by the scope string, never by
// a `site` field on the receipt.
export const SCOPES = Object.freeze({
  draft: 'gemini.draft',
  send: 'gemini.send',
  delegate: 'gemini.delegate',
});

// Fail-closed refusals. Every one of these is decided BEFORE any transport call, so nothing is sent.
export const REASON = Object.freeze({
  BROWSER_UNAVAILABLE: 'BROWSER_UNAVAILABLE',
  DRIVE_LEASE_BUSY: 'DRIVE_LEASE_BUSY',
  AUTH_WALL: 'AUTH_WALL',
  AUTH_UNKNOWN: 'AUTH_UNKNOWN',
  PAGE_SHAPE_UNKNOWN: 'PAGE_SHAPE_UNKNOWN',
  COMPOSER_NOT_FOUND: 'COMPOSER_NOT_FOUND',
  // The composer exists but its text cannot be read yet: a cold tab paints before it hydrates.
  // Measured 2026-11-04: drive refuses here BEFORE typing, so this failure provably sent nothing.
  COMPOSER_UNREADABLE: 'COMPOSER_UNREADABLE',
  PROMPT_MISMATCH: 'PROMPT_MISMATCH',
  SEND_FAILED: 'SEND_FAILED',
  SITE_FAILURE: 'SITE_FAILURE',
  REPLY_TIMEOUT: 'REPLY_TIMEOUT',
  REPLY_EMPTY: 'REPLY_EMPTY',
  THREAD_NOT_BOUND: 'THREAD_NOT_BOUND',
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
});

// The reused tab is the thread on the drive path: Studio's drive owns tab continuity, and the
// channel never holds a CDP connection of its own.
export const LIVE_TAB = 'gemini-live-tab';

const REF_DENIED = 'CHANNEL_DENIED';
const REF_REVOKED = 'CHANNEL_REVOKED';
const REF_BUDGET = 'CHANNEL_BUDGET_EXHAUSTED';
const REF_UNCERTAIN = 'CHANNEL_UNCERTAIN';
const REF_THREAD = 'CHANNEL_THREAD_FORBIDDEN';
const MIN_TURNS = 1;
const MAX_TURNS = 20;
const DEFAULT_TIMEOUT_MS = 90000;

export function sha256(text) { return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex'); }
function digest(text) { return 'sha256:' + sha256(text); }
function receiptIdOf(requestId) { return sha256('channel-receipt/v1:' + requestId); }
function asText(value) { return value === null || value === undefined ? '' : String(value); }
function isPlainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function asActor(actor) {
  if (!isPlainObject(actor)) return { kind: 'agent', id: 'unspecified' };
  const kind = ['owner', 'agent', 'phone'].includes(actor.kind) ? actor.kind : 'agent';
  const id = typeof actor.id === 'string' && actor.id.length ? actor.id : 'unspecified';
  return { kind, id };
}

// --- prompt shape -------------------------------------------------------------------------------
// Studio's drive types the prompt and then reads the composer back to prove the text landed; a
// prompt whose whitespace the composer rewrites is refused before submission (reason
// "prompt-mismatch", nothing sent). Newlines are the measured rewriting case, so the default path
// flattens them and the flattening is recorded on the outcome instead of being silent.
const NEWLINE_RUN = /\s*\n\s*/g;
export function singleLine(text) {
  return String(text ?? '').replace(/\r\n?/g, '\n').replace(NEWLINE_RUN, ' | ');
}

// --- effort -------------------------------------------------------------------------------------
// Parity with chat-channel.mjs: explicit value wins, then coding/brainstorm/algorithm shapes go
// high, short look-ups go instant, everything else stays medium. Expressed as ONE line of ASCII,
// because a second line is exactly what breaks composer verification.
const EFFORT_LEVELS = new Set(['instant', 'medium', 'high']);
const HIGH_EFFORT = /(\bcode\b|coding|implement|debug|algorithm|architecture|design|brainstorm|ideat|derive|proof|optimi[sz]e|refactor|test|analyse|analyze|audit|review the|plan\b)/i;
const INSTANT_SHAPE = /^(what|who|when|where|which|is|are|can|does|do|list|name|reply with|say|translate|convert)\b/i;
export function resolveEffort(requested, prompt) {
  if (typeof requested === 'string' && EFFORT_LEVELS.has(requested)) return requested;
  if (HIGH_EFFORT.test(prompt)) return 'high';
  if (prompt.length <= 160 && INSTANT_SHAPE.test(prompt.trim())) return 'instant';
  return 'medium';
}
export function withEffort(prompt, effort) {
  const instruction = effort === 'instant'
    ? '[Effort: instant - answer directly and briefly, no extended reasoning.]'
    : effort === 'high'
      ? '[Effort: high - reason deeply, check your own work, and show the key steps before the answer.]'
      : '[Effort: medium - think it through, then answer concisely.]';
  return `${instruction} ${prompt}`;
}

// --- reply shape --------------------------------------------------------------------------------
// The assistant container's rendered text starts with the site's own label ("Gemini said ..."),
// which is page chrome, not model output. chat.mjs strips the same label on the ChatGPT path.
const PROVIDER_LABEL = /^\s*(?:ChatGPT|Claude|Gemini|DeepSeek|Qwen|Grok|Z\.ai)\s+(?:dijo|said|says|a dit|sagte|ha detto)\s*:?\s*/i;
export function stripProviderLabel(text) {
  return String(text ?? '').replace(PROVIDER_LABEL, '').trim();
}

// --- thread identity ----------------------------------------------------------------------------
// Gemini's fresh chat is /app (measured 2026-10-30 in the harness's own thread map). Whether a send
// pins a per-conversation id is the open question this channel answers; both shapes are recognised
// and an unrecognised URL is reported as unpinned rather than guessed.
const GEMINI_HOSTS = new Set(['gemini.google.com']);
const GEMINI_APP_THREAD = /^\/app\/([0-9a-z]{8,})$/i;
export function geminiThreadId(url) {
  let parsed;
  try { parsed = new URL(String(url ?? '')); } catch { return null; }
  if (parsed.protocol !== 'https:' || !GEMINI_HOSTS.has(parsed.hostname)) return null;
  if (parsed.username || parsed.password || parsed.port) return null;
  const match = GEMINI_APP_THREAD.exec(parsed.pathname);
  return match ? `${SITE}-app:${match[1].toLowerCase()}` : null;
}
export function isNewChatUrl(url) {
  let parsed;
  try { parsed = new URL(String(url ?? '')); } catch { return false; }
  return GEMINI_HOSTS.has(parsed.hostname) && (parsed.pathname === '/' || parsed.pathname === '/app' || parsed.pathname === '/app/');
}

// --- transport ----------------------------------------------------------------------------------
const DRIVE_TIMEOUT_HINT = /Cannot drive|ECONNREFUSED|DevTools|remote-debugging-port|not available or not verified/i;

/**
 * Transport over Studio's own `drive gemini`. Studio stays the sole browser owner: this spawns the
 * Studio binary, which takes the drive lease on its own tab. The channel never imports CDP.
 *
 * `exec` is injectable so the unit tests drive fake pages with no network and no child process.
 */
export function createGeminiTransport({ binPath, timeoutSeconds = 120, exec = spawnSync, lease = inspectDriveLease, port,
  // How long to let a cold tab hydrate before the single permitted re-query, and the clock it waits on.
  settleMs = 2000, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  if (typeof binPath !== 'string' || !binPath.length) throw new Error('GEMINI_TRANSPORT_BIN_REQUIRED');

  function run(args, timeoutMs) {
    return exec(process.execPath, [binPath, ...args], {
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 8 * 1024 * 1024,
    });
  }

  function parseJson(result) {
    try { return JSON.parse(String(result && result.stdout ? result.stdout : '').trim()); } catch { return null; }
  }

  // Read-only: which Gemini tab is open, and does its URL pin a conversation. Studio's `targets` is
  // the sanctioned reader (it re-proves the browser owner), so this is not a second CDP client.
  async function currentThreadId() {
    const result = run(['targets', '--json'], 30000);
    let rows;
    try { rows = JSON.parse(String(result && result.stdout ? result.stdout : '').trim()); } catch { return null; }
    if (!Array.isArray(rows)) return null;
    const tabs = rows.filter((row) => { try { return new URL(String(row && row.url ? row.url : '')).hostname === 'gemini.google.com'; } catch { return false; } });
    for (const tab of tabs) {
      const threadId = geminiThreadId(tab.url);
      if (threadId) return threadId;
    }
    return null;
  }

  return {
    // The site this transport speaks to. The policy core reads it: a scope naming another site is
    // refused before any dispatch, so this file can never write a receipt under another site's
    // scope (the canonical chatgpt scope included).
    site: SITE,
    // Drive owns tab continuity: a pinned thread has no address to create, and a fresh chat is just
    // the next tab drive opens. The id is honest about that rather than inventing a uuid.
    async createThread({ actor, site = SITE } = {}) {
      if (site !== SITE) throw new Error('GEMINI_SITE_MISMATCH');
      return { threadId: LIVE_TAB, actor: asActor(actor) };
    },

    currentThreadId,

    async send({ threadId, prompt, requestId, actor, deadline, newThread = false } = {}) {
      // Preflight 1: a live driver already holds the host-wide lease. Refuse instead of contending —
      // two drivers on one tab produce UNCERTAIN receipts that cannot be untangled afterwards.
      let leaseState = null;
      try { leaseState = lease(port === undefined ? {} : { port }); } catch { leaseState = null; }
      if (leaseState && leaseState.exists && leaseState.ownerFile === 'ok' && leaseState.ownerState === 'alive') {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.DRIVE_LEASE_BUSY, send: { state: 'not-sent' } };
      }

      const remaining = Math.max(5, Math.min(timeoutSeconds, Math.ceil((deadline.getTime() - Date.now()) / 1000)));
      const args = ['drive', SITE, '--prompt', prompt, '--timeout', String(remaining), '--no-record', '--json'];

      // Continuing a pinned thread: the reused tab IS the conversation, so the binding must be
      // re-proved before anything is typed. Drive cannot do this for Gemini — its thread map has no
      // Gemini entry — so a tab that rotated to another conversation is refused here rather than
      // silently continued. A fresh thread is a fresh tab, so no proof is owed.
      if (!newThread && typeof threadId === 'string' && threadId.startsWith(`${SITE}-app:`)) {
        const current = await currentThreadId();
        if (!current) {
          return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.THREAD_NOT_BOUND, send: { state: 'not-sent' }, detail: 'no Gemini tab is on a pinned thread' };
        }
        if (current !== threadId) {
          return { effect: 'FAILED', reply: null, threadId: current, journalKey: null, journalPath: null, reason: REASON.THREAD_NOT_BOUND, send: { state: 'not-sent' }, detail: `the open tab is on ${current}, not ${threadId}` };
        }
      }
      // A fresh thread is a fresh tab. Continuing an existing conversation reuses the tab it lives in.
      if (!newThread) args.push('--reuse-tab');

      const dispatchOnce = async () => {
      let result;
      try {
        result = run(args, (remaining + 45) * 1000);
      } catch (error) {
        // The process never reported: a dispatch may or may not have happened. Terminal uncertainty.
        throw new Error(`${REASON.TRANSPORT_ERROR}: ${String(error && error.message ? error.message : error)}`);
      }
      if (result && result.error && result.error.code === 'ETIMEDOUT') {
        // Killed mid-turn: the turn may have landed. Never a FAILED (that would claim nothing was sent).
        throw new Error(`${REASON.TRANSPORT_ERROR}: drive timed out after ${remaining}s`);
      }

      const stderr = String(result && result.stderr ? result.stderr : '');
      const parsed = parseJson(result);

      // Preflight 2 (fail closed): drive could not reach a browser at all, so no page was driven.
      if (!parsed) {
        if (DRIVE_TIMEOUT_HINT.test(stderr) || (result && result.status && result.status !== 0)) {
          return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.BROWSER_UNAVAILABLE, send: { state: 'not-sent' }, detail: firstLine(stderr) };
        }
        // Output we cannot read is not evidence that nothing was sent.
        throw new Error(`${REASON.TRANSPORT_ERROR}: drive returned no readable result`);
      }

      const authWall = isPlainObject(parsed.authWall) ? parsed.authWall : null;
      // Preflight 3: signed out. The page is real but the account is not, so nothing may be typed.
      if (authWall && authWall.blocked === true) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.AUTH_WALL, send: { state: 'not-sent' }, detail: firstLine(String(authWall.reason ?? '')) };
      }
      // The auth probe itself failed. Unknown is not "signed in": refuse rather than type blind.
      if (authWall && authWall.blocked === null) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.AUTH_UNKNOWN, send: { state: 'not-sent' }, detail: firstLine(String(authWall.reason ?? '')) };
      }

      const errors = Array.isArray(parsed.errors) ? parsed.errors.map(String) : [];
      const reason = String(parsed.reason ?? '');
      // A dead handle on a composer that used to exist is a page-shape problem, not a cold read:
      // drive could not focus the composer at all, so re-querying the same page shape is pointless.
      // This is checked BEFORE the type-failed branch: a stale handle is reported by drive as
      // reason "type-failed", so the prompt-fidelity branch would otherwise claim a prompt mismatch
      // for a page whose shape the channel never learned.
      if (/could not focus the composer|stale handle|stale node/i.test([reason, ...errors].join(' '))) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.PAGE_SHAPE_UNKNOWN, send: { state: 'not-sent' }, detail: firstLine([reason, ...errors].join('; ')) };
      }
      // The typed text never landed in the composer. That is a prompt-fidelity refusal (nothing was
      // sent), not an unfamiliar page: it is the measured multi-line behaviour on this drive path.
      if (reason === 'type-failed' || errors.some((e) => /typed text not verified/i.test(e))) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.PROMPT_MISMATCH, send: { state: 'not-sent' }, detail: firstLine([reason, ...errors].join('; ')) };
      }
      // A cold tab paints before its composer can be read. Drive refuses here BEFORE typing, so this
      // is the one failure a second dispatch cannot duplicate as a send. It gets one re-query below
      // and is otherwise reported as its own refusal — never as an unknown page shape.
      if (reason === 'composer-unreadable' || errors.some((e) => /composer unreadable before submission/i.test(e))) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.COMPOSER_UNREADABLE, send: { state: 'not-sent' }, detail: firstLine([reason, ...errors].join('; ')) };
      }
      // Preflight 4: the page shape is not the one this adapter knows — no composer was found.
      if (parsed.ok !== true && /composer|type-failed|draft-not-cleared|no composer/i.test([reason, ...errors].join(' '))) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: reason === 'prompt-mismatch' ? REASON.PROMPT_MISMATCH : REASON.PAGE_SHAPE_UNKNOWN, send: { state: 'not-sent' }, detail: firstLine([reason, ...errors].join('; ')) };
      }
      // Drive proves the composer holds the prompt before it submits. A mismatch means NOTHING was
      // sent — the single most important refusal to report precisely.
      if (reason === 'prompt-mismatch' || errors.some((e) => /does not match the prompt/i.test(e))) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.PROMPT_MISMATCH, send: { state: 'not-sent' }, detail: firstLine([reason, ...errors].join('; ')) };
      }
      if (parsed.ok !== true) {
        const mapped = /timeout/i.test(reason) ? REASON.REPLY_TIMEOUT
          : /send-failed/i.test(reason) ? REASON.SEND_FAILED
            : REASON.SITE_FAILURE;
        // A send that was dispatched but not confirmed is uncertain, not failed.
        const state = parsed.uncertain === true || mapped === REASON.REPLY_TIMEOUT ? 'unknown' : 'not-sent';
        return { effect: parsed.uncertain === true ? 'UNCERTAIN' : 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: mapped, send: { state }, detail: firstLine([reason, ...errors].join('; ')) };
      }

      const reply = stripProviderLabel(typeof parsed.reply === 'string' ? parsed.reply : '');
      // Never invent a reply: a settled turn with no text is a refusal, not an empty answer.
      if (!reply.length) {
        return { effect: 'FAILED', reply: null, threadId, journalKey: null, journalPath: null, reason: REASON.REPLY_EMPTY, send: { state: 'sent' }, detail: firstLine([reason, ...errors].join('; ')) };
      }

      // The tab URL after the turn is the thread evidence (Q1): a pinned id here, otherwise the
      // reused tab. Read with `targets`, which is a read, not a second driver.
      const pinned = await currentThreadId();
      return {
        effect: 'OK',
        reply,
        threadId: pinned ?? threadId ?? LIVE_TAB,
        journalKey: requestId,
        journalPath: null,
        send: { state: 'sent', method: sentMethod(stderr), composer: composerEvidence(stderr) },
        verified: parsed.verified === true,
      };
      };

      // Exactly two outcomes for a cold tab, and no third: either the re-query lands and exactly one
      // submission happens, or the turn fails closed with COMPOSER_UNREADABLE and nothing is sent.
      let outcome = null;
      let attempts = 0;
      for (let attempt = 0; attempt < 2; attempt++) {
        attempts += 1;
        outcome = await dispatchOnce();
        const cold = outcome && outcome.effect === 'FAILED' && outcome.reason === REASON.COMPOSER_UNREADABLE;
        if (cold && attempt === 0) { await wait(settleMs); continue; }
        break;
      }
      const submissions = outcome && outcome.effect === 'OK' ? 1 : 0;
      if (outcome && isPlainObject(outcome.send)) outcome.send = { ...outcome.send, attempts, submissions };
      return outcome;
    },
  };
}

function firstLine(text) {
  const line = String(text ?? '').split('\n').map((s) => s.trim()).filter(Boolean)[0] ?? '';
  return line.slice(0, 300);
}
// Drive narrates its own handshake on stderr (kept out of stdout so --json stays machine-readable).
function sentMethod(stderr) {
  const match = /sent via (\S+)/i.exec(String(stderr ?? ''));
  return match ? match[1] : null;
}
// Which composer the drive actually used, so the site profile can be corrected from evidence rather
// than from a selector list someone guessed at.
function composerEvidence(stderr) {
  const text = String(stderr ?? '');
  const match = /composer (\S+) via ([^\n]+)/i.exec(text);
  return match ? { tag: match[1], via: match[2].trim() } : null;
}
// Measured on a live multi-turn Gemini thread (2026-11-04): the extracted reply can be two streaming
// snapshots concatenated at a word boundary ("... on your" + "Link confirmed ..."), which reads as a
// missing space after a lowercase letter. The text did appear on screen, so the turn is not failed —
// but the outcome says it is spliced instead of presenting it as one clean model message.
const SPLICED = /\p{Ll}\p{Lu}/u;
export function looksSpliced(text) {
  return SPLICED.test(String(text ?? ''));
}

// --- store --------------------------------------------------------------------------------------
// Same on-disk shape the ChatGPT channel settled on: digests in receipts, caller-facing bodies in
// outcomes, a write-ahead marker in pending. Nothing here ever holds a cookie or a token.

// A receipt id becomes a file name. An id that is not a plain name (a path, a separator, a drive
// letter) would put the receipt OUTSIDE the channel root, so it is refused before any write: every
// file in this ledger is one this store put there, under <root>/receipts, <root>/outcomes or
// <root>/pending. The same rule the Studio CLI store applies (studio/bin/commands/chat.mjs).
const ID_SAFE = /^[A-Za-z0-9._-]+$/;
function safeName(value, what) {
  if (typeof value !== 'string' || !ID_SAFE.test(value) || value === '.' || value === '..') {
    throw new Error(`CHANNEL_INVALID_ID: ${what} must be a plain name (${ID_SAFE})`);
  }
  return value;
}

export function createFileStore({ channelRoot } = {}) {
  const base = channelRoot ?? process.env.VIVIM_CHANNEL_DIR ?? 'C:/VIVIM/channel';
  const receiptsDir = path.join(base, 'receipts');
  const revocationsDir = path.join(base, 'revocations');
  const outcomesDir = path.join(base, 'outcomes');
  const pendingDir = path.join(base, 'pending');
  for (const dir of [receiptsDir, revocationsDir, outcomesDir, pendingDir]) mkdirSync(dir, { recursive: true });
  const file = (dir, id) => path.join(dir, `${safeName(id, 'id')}.json`);
  const readJson = (target) => {
    try { return JSON.parse(readFileSync(target, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  };
  const writeJson = (target, value) => writeFileSync(target, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  return {
    root: base,
    async get(requestId) { return readJson(file(receiptsDir, requestId)); },
    async put(receipt) { writeJson(file(receiptsDir, receipt.requestId), receipt); },
    async getOutcome(requestId) { return readJson(file(outcomesDir, requestId)); },
    async putOutcome(requestId, outcome) { writeJson(file(outcomesDir, requestId), outcome); },
    async putPending(entry) { writeJson(file(pendingDir, entry.requestId), entry); },
    async getPending(requestId) { return readJson(file(pendingDir, requestId)); },
    async clearPending(requestId) {
      try { unlinkSync(file(pendingDir, requestId)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    },
    async isRevoked(taskId) {
      if (!taskId) return false;
      try { readFileSync(file(revocationsDir, taskId), 'utf8'); return true; }
      catch (error) { if (error.code === 'ENOENT') return false; throw error; }
    },
    async revoke(taskId, reason = 'CLI_REVOKE') {
      writeJson(file(revocationsDir, taskId), { taskId, revokedAt: new Date().toISOString(), reason });
    },
  };
}

// --- channel ------------------------------------------------------------------------------------
// A receipt may only carry a scope this channel can actually serve. The receipt schema
// (schemas/chat-receipt.v1.json) admits every known <site>.<action>, so the schema alone would let
// this site file write a receipt under ANOTHER site's scope; the site is narrowed here to this
// site's own three scopes. A refused foreign scope is recorded as the refusal it is, and the
// refused text is still named on the outcome.
const OWN_SCOPES = new Set(Object.values(SCOPES));
function receiptScope(scope) {
  const text = typeof scope === 'string' ? scope : '';
  return OWN_SCOPES.has(text) ? text : null;
}

function receiptOf({ requestId, taskId, actor, scope, thread, effect, promptDigest, replyDigest, journalKey, journalPath, turns, refusals, createdAt }) {
  const carriedScope = receiptScope(scope);
  return {
    schema: 'vivim.chat-receipt/1',
    receiptId: receiptIdOf(requestId),
    requestId,
    taskId: taskId ?? null,
    actor,
    scopes: carriedScope ? [carriedScope] : [],
    thread: { before: asText(thread && thread.before), after: asText(thread && thread.after) },
    effect,
    promptDigest,
    replyDigest: replyDigest ?? null,
    journalKey: journalKey ?? requestId,
    journalPath: journalPath ?? null,
    turns: Number.isInteger(turns) ? turns : 0,
    createdAt,
    refusals: refusals ? [...refusals] : [],
  };
}

export function createGeminiChannel({ transport, store, verify, now = () => new Date(), log } = {}) {
  if (!transport || typeof transport.send !== 'function' || typeof transport.createThread !== 'function') {
    throw new Error('GEMINI_TRANSPORT_REQUIRED: transport must implement send({...}) and createThread({...})');
  }
  if (!store || typeof store.get !== 'function' || typeof store.put !== 'function'
    || typeof store.isRevoked !== 'function' || typeof store.revoke !== 'function') {
    throw new Error('GEMINI_STORE_REQUIRED: store must implement get/put/isRevoked/revoke');
  }

  async function record(receipt, outcome) {
    await store.put(receipt);
    if (typeof store.putOutcome === 'function') await store.putOutcome(receipt.requestId, outcome);
    if (typeof store.clearPending === 'function') await store.clearPending(receipt.requestId);
    if (typeof log === 'function') log(`gemini receipt ${receipt.receiptId} effect=${receipt.effect}`);
    const stored = await store.get(receipt.requestId);
    return { receipt: stored ?? receipt, outcome };
  }

  async function run(input = {}) {
    const requestId = input.requestId;
    if (typeof requestId !== 'string' || !requestId.length) throw new Error('GEMINI_REQUEST_ID_REQUIRED');

    const rawPrompt = typeof input.prompt === 'string' ? input.prompt : '';
    const promptDigest = digest(rawPrompt);

    // Invariant: idempotency is decided first, before scope validation, so a replay of a refused
    // task is stable too.
    const existing = await store.get(requestId);
    if (existing) {
      if (existing.promptDigest && existing.promptDigest !== promptDigest) {
        // Same key, different payload: a different request wearing a used name. Not persisted, so the
        // original receipt survives untouched.
        const denial = receiptOf({
          requestId, taskId: input.taskId ?? null, actor: asActor(input.actor),
          scope: typeof input.scope === 'string' && input.scope.length ? input.scope : SCOPES.send,
          thread: { before: '', after: '' }, effect: 'DENIED', promptDigest, replyDigest: null,
          journalKey: requestId, journalPath: null, turns: 0, refusals: [REF_DENIED],
          createdAt: now().toISOString(),
        });
        return {
          receipt: denial,
          outcome: {
            effect: 'DENIED', reply: '', solution: null, turns: [], assertedByModel: [], verifiedLocally: [],
            open: ['requestId was already used with a different payload'], requestId, threadId: null, send: { state: 'not-sent' },
          },
        };
      }
      const cached = typeof store.getOutcome === 'function' ? await store.getOutcome(requestId) : null;
      return {
        receipt: existing,
        outcome: cached ?? {
          effect: existing.effect, reply: '', solution: null, turns: [], assertedByModel: [], verifiedLocally: [],
          open: ['replayed stored receipt; reply body is not retained in the receipt'],
          requestId, threadId: existing.thread.after || existing.thread.before || null, send: { state: 'not-sent' },
        },
      };
    }

    const scope = typeof input.scope === 'string' && input.scope.length ? input.scope : SCOPES.send;
    const taskId = input.taskId ?? null;
    const actor = asActor(input.actor);
    const effort = resolveEffort(input.effort, rawPrompt);
    const createdAt = now().toISOString();
    const budgetMs = Number.isFinite(input.timeoutMs) ? input.timeoutMs
      : Number.isFinite(input.deadlineMs) ? input.deadlineMs : DEFAULT_TIMEOUT_MS;
    const deadline = new Date(now().getTime() + budgetMs);

    async function refuse({ effect, refusal, thread, reason, scopes }) {
      const receipt = receiptOf({
        requestId, taskId, actor, scope: scopes === null ? null : scope,
        thread: thread ?? { before: '', after: '' }, effect, promptDigest, replyDigest: null,
        journalKey: requestId, journalPath: null, turns: 0, refusals: refusal ? [refusal] : [], createdAt,
      });
      return record(receipt, {
        effect, effort, reply: '', solution: null, turns: [], assertedByModel: [], verifiedLocally: [],
        open: reason ? [reason] : [], requestId, threadId: null, prompt: rawPrompt, send: { state: 'not-sent' },
      });
    }

    // --- scope ------------------------------------------------------------------------------
    if (scope === SCOPES.draft) {
      // A draft is a preview: the receipt records the intent and no browser is touched.
      return refuse({ effect: 'OK', refusal: null, thread: { before: '', after: '' }, reason: null });
    }
    if (scope !== SCOPES.send && scope !== SCOPES.delegate) {
      return refuse({ effect: 'DENIED', refusal: REF_DENIED, reason: `unsupported scope "${String(scope)}"` });
    }
    let turnsLimit = 1;
    if (scope === SCOPES.delegate) {
      if (!Number.isInteger(input.maxTurns) || input.maxTurns < MIN_TURNS || input.maxTurns > MAX_TURNS) {
        return refuse({ effect: 'DENIED', refusal: REF_DENIED, reason: `gemini.delegate requires maxTurns between ${MIN_TURNS} and ${MAX_TURNS}` });
      }
      turnsLimit = input.maxTurns;
    }

    // --- thread -----------------------------------------------------------------------------
    const open = [];
    // Newline handling is a per-site measured question, not a fixed rule: the default flattens
    // (the ChatGPT-proven behaviour) and `rawNewlines` keeps the text verbatim so the composer
    // verifier can rule on it. Either way the decision is recorded on the outcome.
    const flat = input.rawNewlines === true ? rawPrompt : singleLine(rawPrompt);
    if (input.rawNewlines !== true && flat !== rawPrompt) open.push('newlines flattened to " | " for composer fidelity');
    if (input.rawNewlines === true && /[\r\n]/.test(flat)) open.push('newlines kept verbatim at the caller request; the composer verifier may refuse this prompt');
    const prompt = withEffort(flat, effort);
    let before = '';
    let after = '';
    let threadId;
    let newThread = false;
    if (input.thread === 'new') {
      // Creation is delegated to Studio's drive, which opens the tab. The channel never opens one.
      let created;
      try {
        created = await transport.createThread({ actor, site: SITE });
      } catch (error) {
        return refuse({ effect: 'FAILED', reason: `thread creation failed: ${String(error && error.message ? error.message : error)}` });
      }
      if (!isPlainObject(created) || typeof created.threadId !== 'string' || !created.threadId.length) {
        return refuse({ effect: 'FAILED', reason: 'thread creation returned no threadId' });
      }
      threadId = created.threadId;
      newThread = true;
      after = threadId;
    } else if (typeof input.thread === 'string' && input.thread.length) {
      const taskThread = input.taskThread ?? (isPlainObject(input.task) ? input.task.thread : undefined);
      if (taskThread !== undefined && taskThread !== null && String(input.thread) !== String(taskThread)) {
        open.push(`thread override: task bound to ${asText(taskThread)}, used ${input.thread}`);
      }
      threadId = input.thread;
      before = threadId;
      after = threadId;
    } else {
      return refuse({ effect: 'DENIED', refusal: REF_THREAD, reason: 'no thread bound to task and none requested' });
    }

    // Write-ahead marker: a marker without a receipt after the fact is an unresolved dispatch.
    if (typeof store.putPending === 'function') {
      await store.putPending({ requestId, taskId, promptDigest, effort, threadId, createdAt, site: SITE });
    }

    const assertedByModel = [];
    const turns = [];
    const refusals = [];
    let effect = null;
    let journalKey = null;
    let journalPath = null;
    let replyText = '';
    let solution = null;
    let sendState = { state: 'not-sent' };

    for (let turnIndex = 0; turnIndex < turnsLimit; turnIndex++) {
      // Revocation is re-proved immediately before EVERY send, not once per task.
      if (await store.isRevoked(taskId)) {
        effect = 'REVOKED';
        refusals.push(REF_REVOKED);
        open.push(`revoked after ${turns.length} turn(s)`);
        break;
      }
      if (now().getTime() > deadline.getTime()) {
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} deadline exceeded`);
        break;
      }

      const startedAt = now().toISOString();
      let result;
      try {
        result = await transport.send({ threadId, prompt, requestId, actor, deadline, attachment: input.attachment, newThread: newThread && turnIndex === 0 });
      } catch (error) {
        // A transport we cannot read is terminal for the turn: recorded, never retried.
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} transport failure: ${String(error && error.message ? error.message : error)}`);
        sendState = { state: 'unknown' };
        break;
      }
      if (!isPlainObject(result)) {
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} returned no result`);
        sendState = { state: 'unknown' };
        break;
      }
      if (isPlainObject(result.send)) sendState = result.send;
      if (typeof result.journalKey === 'string' && result.journalKey.length) journalKey = result.journalKey;
      if (typeof result.journalPath === 'string' && result.journalPath.length) journalPath = result.journalPath;
      if (typeof result.threadId === 'string' && result.threadId.length) after = result.threadId;

      if (result.effect === 'UNVERIFIED') {
        effect = 'UNVERIFIED';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} not verified`);
        break;
      }
      if (result.effect === 'UNCERTAIN') {
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} uncertain: ${asText(result.reason) || 'no reason given'}`);
        break;
      }
      if (result.effect === 'FAILED') {
        effect = 'FAILED';
        const detail = asText(result.detail) || asText(result.reason) || 'no reason given';
        open.push(`turn ${turnIndex} failed: ${asText(result.reason) || 'FAILED'}${detail ? ` (${detail})` : ''}`);
        break;
      }

      const turnReply = typeof result.reply === 'string' ? result.reply : '';
      // A send that returns nothing is not a delivered turn. This is the shared core's invariant
      // (src/studio/chat-channel.mjs: a turn with no reply and no explicit solution is never
      // journaled as OK), and it is enforced here too: the channel does not trust the transport to
      // have checked this for it. Nothing was received, so nothing is asserted and nothing is OK.
      if (!turnReply.length && typeof result.solution !== 'string') {
        effect = 'UNVERIFIED';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} returned no reply`);
        sendState = { state: 'unknown' };
        break;
      }
      replyText = turnReply;
      // Report a spliced extraction on the outcome; the text was rendered, so the turn still counts.
      if (looksSpliced(turnReply)) {
        open.push('reply extraction looks spliced (a streaming snapshot boundary); the text is what the page showed, not necessarily one clean assistant message');
      }
      const turnJournalKey = typeof result.journalKey === 'string' && result.journalKey.length ? result.journalKey : requestId;
      // Model prose is evidence of what the model asserted, never of what is true.
      assertedByModel.push({ claim: turnReply, turnIndex, verbatim: true });
      turns.push({
        schema: 'vivim.chat-turn/1',
        index: turnIndex,
        requestId,
        threadId: after || threadId,
        promptDigest,
        replyDigest: digest(turnReply),
        effect: 'OK',
        journalKey: turnJournalKey,
        startedAt,
        endedAt: now().toISOString(),
        effort,
        refusal: null,
      });

      if (typeof result.solution === 'string') {
        solution = result.solution;
        effect = 'OK';
        break;
      }
      // A single send is complete after one turn; delegate has to keep going until a solution.
      if (scope === SCOPES.send) { effect = 'OK'; solution = replyText; break; }
    }

    if (!effect) {
      if (scope === SCOPES.send) {
        effect = 'OK';
        solution = replyText;
      } else {
        // Budget exhaustion is a PARTIAL outcome with a reason, never a success.
        effect = 'BUDGET_EXHAUSTED';
        refusals.push(REF_BUDGET);
        open.push(`delegate budget exhausted after ${turnsLimit} turn(s) without a solution`);
      }
    }

    // A reply we received is OBSERVED; only the local hook may promote a claim to VERIFIED.
    let verifiedLocally = [];
    if (typeof verify === 'function') {
      const verdicts = await verify(assertedByModel);
      verifiedLocally = Array.isArray(verdicts)
        ? verdicts.map((v) => ({ claim: asText(v && v.claim), evidence: asText(v && v.evidence) }))
        : [];
    }

    const receipt = receiptOf({
      requestId, taskId, actor, scope, thread: { before, after }, effect,
      promptDigest, replyDigest: replyText.length ? digest(replyText) : null,
      journalKey: journalKey ?? requestId, journalPath, turns: turns.length, refusals, createdAt,
    });
    const evidenceState = verifiedLocally.length ? 'VERIFIED' : (replyText.length ? 'OBSERVED' : 'CLAIMED');
    const outcome = {
      schema: 'vivim.chat-ask-result/1',
      effect,
      effort,
      evidenceState,
      // The outcome is where the text lives: the receipt keeps digests only.
      prompt: rawPrompt,
      reply: replyText,
      solution,
      turns,
      assertedByModel,
      verifiedLocally,
      open,
      requestId,
      threadId: after || null,
      send: sendState,
    };
    return record(receipt, outcome);
  }

  return { run };
}

// --- CLI ----------------------------------------------------------------------------------------
// `ask` exists so this channel is usable before the shared CLI learns --site: chat.mjs currently
// hard-codes the chatgpt.send scope, so routing Gemini through it is the channel owner's change.
function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const name = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { flags[name] = true; continue; }
    flags[name] = next;
    i++;
  }
  return flags;
}

/**
 * The ask-result this CLI prints: exactly the published contract
 * (schemas/chat-ask-result.v1.json), which is closed — seven fields, nothing else. The effect is
 * mapped to the contract's three values the way the Studio CLI maps it, so an UNCERTAIN or DENIED
 * turn is reported as UNVERIFIED or FAILED instead of a value the contract does not have. The
 * detailed reason never leaves the receipt and the stderr trace.
 */
export function renderAskResult(receipt, outcome = {}, { thread = null } = {}) {
  const effect = receipt && receipt.effect;
  const effort = outcome && outcome.effort;
  return {
    schema: 'vivim.chat-ask-result/1',
    effort: EFFORT_LEVELS.has(effort) ? effort : 'medium',
    reply: (outcome && outcome.reply) ?? '',
    threadId: (receipt && receipt.thread && (receipt.thread.after || receipt.thread.before)) || thread || 'new',
    requestId: receipt.requestId,
    receiptId: receipt.receiptId,
    effect: effect === 'UNCERTAIN' ? 'UNVERIFIED' : effect === 'OK' ? 'OK' : 'FAILED',
  };
}

async function main(argv) {
  const [command, ...rest] = argv;
  if (command !== 'ask' && command !== 'probe') {
    process.stderr.write('Usage: gemini.mjs ask --prompt-file <path> --thread <new|id> [--scope gemini.send] [--effort instant] [--request-id X] [--raw-newlines] [--json]\n'
      + '       gemini.mjs probe            # read-only: is a Gemini tab open, and does its URL pin a thread\n');
    process.exitCode = 2;
    return;
  }
  const flags = parseFlags(rest);
  const store = createFileStore({ channelRoot: flags['channel-dir'] });
  const transport = createGeminiTransport({
    binPath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'bin', 'studio.mjs'),
    timeoutSeconds: Number.isFinite(Number(flags.timeout)) ? Number(flags.timeout) : 120,
  });

  if (command === 'probe') {
    // Read-only recon: no send, no transport.send call.
    const threadId = await transport.currentThreadId();
    process.stdout.write(JSON.stringify({ site: SITE, threadId, pinned: Boolean(threadId), channelRoot: store.root }, null, 2) + '\n');
    return;
  }

  if (typeof flags['prompt-file'] !== 'string' || !flags['prompt-file'].length) {
    process.stderr.write('gemini.mjs ask requires --prompt-file <path>\n');
    process.exitCode = 2;
    return;
  }
  let prompt;
  try { prompt = readFileSync(flags['prompt-file'], 'utf8'); }
  catch (error) { process.stderr.write(`cannot read --prompt-file: ${error.code ?? error.message}\n`); process.exitCode = 2; return; }
  const rawNewlines = flags['raw-newlines'] === true;
  if (typeof flags.thread !== 'string' || !flags.thread.length) {
    process.stderr.write('gemini.mjs ask requires --thread <new|id>\n');
    process.exitCode = 2;
    return;
  }
  const requestId = typeof flags['request-id'] === 'string' && flags['request-id'].length
    ? flags['request-id']
    : sha256(`gemini-ask:${flags.thread}:${prompt}`);
  const channel = createGeminiChannel({
    transport,
    store,
    now: () => new Date(),
    log: (message) => { try { process.stderr.write(`[gemini-channel] ${message}\n`); } catch { /* trace is best effort */ } },
  });
  const { receipt, outcome } = await channel.run({
    scope: typeof flags.scope === 'string' ? flags.scope : SCOPES.send,
    taskId: sha256('gemini-task:' + requestId),
    actor: { kind: 'agent', id: typeof flags.actor === 'string' ? flags.actor : 'gemini-channel' },
    thread: flags.thread,
    prompt,
    requestId,
    timeoutMs: Number.isFinite(Number(flags.timeout)) ? Number(flags.timeout) * 1000 : DEFAULT_TIMEOUT_MS,
    effort: flags.effort,
    rawNewlines,
    maxTurns: Number.isFinite(Number(flags['max-turns'])) ? Number(flags['max-turns']) : undefined,
  });
  const rendered = renderAskResult(receipt, outcome, { thread: flags.thread });
  process.stdout.write(JSON.stringify(rendered, null, 2) + '\n');
  // The diagnostics are not part of the ask-result contract (schemas/chat-ask-result.v1.json is
  // closed), so they go to stderr where the trace already lives: stdout stays machine-readable.
  try {
    process.stderr.write(`[gemini-channel] site=${SITE} scope=${receipt.scopes[0] ?? '-'} receiptEffect=${receipt.effect} send=${JSON.stringify(outcome.send ?? null)}\n`);
    for (const line of outcome.open ?? []) process.stderr.write(`[gemini-channel] ${line}\n`);
  } catch { /* the trace is best effort */ }
  if (receipt.effect !== 'OK') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${String(error && error.stack ? error.stack : error)}\n`);
    process.exitCode = 1;
  });
}
