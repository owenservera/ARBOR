/**
 * @hq:context claude site transport: one local agent turn to a signed-in claude.ai through Studio's drive owner.
 * @hq:owner claude-channel
 * @hq:task VC-1-CLAUDE
 * @hq:see docs/chatgpt-channel/CONTRACT.md
 * @hq:see src/studio/chat-channel.mjs
 * @hq:invariant Studio is the only browser owner: this module spawns Studio's own `drive` command; it never opens a CDP socket, tab, recorder or cookie store.
 * @hq:invariant one site, one sender: SITE is the constant 'claude'. A site hint from a caller is IGNORED, never honoured.
 * @hq:invariant fail closed: no browser, a login wall or an unconfirmed dispatch is reported as an effect; a reply is never invented.
 * @hq:invariant a pinned thread is continued by its /chat/<uuid> address, never by reusing an arbitrary tab.
 */
// A SITE TRANSPORT, not a second channel. `createChatChannel` (src/studio/chat-channel.mjs) owns the
// policy — scopes, revocation, budget, replay, receipts — and reaches the outside world only through
// the transport it is handed. This module is that transport for claude.ai.
//
// Why the drive path and not the pinned-thread conversation API: Studio's `/api/v1/conversations/*`
// runtime is the better path where a site pins a thread id (it returns Studio's own thread-turn
// journal and a per-turn send state), but it needs a long-lived Studio holding the machine-wide CDP
// owner lock. The drive command takes the drive lease for one invocation and releases it, so a claude
// channel can run beside another agent's Studio session without contending for the browser owner.
// The trade, recorded rather than hidden: on this path `journalPath` is null and `journalKey` is the
// caller's requestId — the send-once record lives in the channel's receipt store, not in a Studio
// thread journal. Same trade the ChatGPT channel records in src/studio/chat-channel.mjs's sibling
// transport (studio/bin/commands/chat.mjs, createDriveTransport).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'claude';

/** The only scopes this site answers to. The site identity lives in the scope string (frozen contract). */
export const SCOPES = Object.freeze({
  draft: 'claude.draft',
  send: 'claude.send',
  delegate: 'claude.delegate',
});

/**
 * A claude.ai chat is pinned at /chat/<uuid> (src/capture/conversation-thread.mjs, CLAUDE_CHAT).
 * The ref shape mirrors that module's `claude-chat:<uuid>`; it is duplicated here only to keep this
 * module free of capture imports, and a unit test asserts the two agree on real URLs.
 */
const THREAD_UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PINNED_THREAD = new RegExp(`^claude-chat:(${THREAD_UUID})$`, 'i');

/**
 * The handle returned before a fresh chat has produced a thread. claude.ai keeps a brand-new chat on
 * `/new` (or `/`, which redirects there) and only earns a `/chat/<uuid>` address after the first
 * message is sent, so no pinned identity exists yet — naming one would be a fabrication.
 */
export const FRESH_THREAD = 'claude-new';

/** The address a drive must open to continue `threadId`, or claude's home for a fresh chat. */
export function driveUrlFor(threadId) {
  const pinned = PINNED_THREAD.exec(String(threadId ?? ''));
  return pinned ? `https://claude.ai/chat/${pinned[1].toLowerCase()}` : 'https://claude.ai/';
}

/** A thread ref this transport can continue, as opposed to a fresh-chat sentinel. */
export const isPinnedThread = (threadId) => PINNED_THREAD.test(String(threadId ?? ''));

/** Seconds left before `deadline`, clamped to the drive's accepted range. Never a negative budget. */
export function remainingSeconds(deadline, nowMs = Date.now(), { min = 5, max = 900 } = {}) {
  const end = deadline instanceof Date ? deadline.getTime() : Number(deadline);
  if (!Number.isFinite(end)) return min;
  return Math.max(min, Math.min(max, Math.ceil((end - nowMs) / 1000)));
}

/**
 * Map one `studio drive ... --json` payload onto the transport result the channel expects:
 * { effect, reply, threadId, journalKey, journalPath, send: { state }, reason }.
 *
 * Pure and total: every branch returns a decision, and the only branch that returns a reply is the
 * one where the drive both reported ok AND carried a non-empty reply string. A drive that settled
 * with no text is a failure, not an empty answer.
 *
 * `send.state` uses Studio's own vocabulary for the dispatch itself:
 *   not-sent    nothing reached the composer (blocked, no composer, prompt mismatch, type failure)
 *   failed      the dispatch was attempted and rejected
 *   uncertain   a dispatch may have happened and the outcome is unknown; never retried here
 *   delivered   the drive observed its own send and read a reply back
 *
 * @hq:invariant uncertainty is reported as effect UNVERIFIED, not UNCERTAIN.
 * @hq:why the policy core (src/studio/chat-channel.mjs) branches on UNVERIFIED and FAILED only: a
 *   transport effect of UNCERTAIN misses every branch and is recorded as effect OK with an empty
 *   reply. Returning UNCERTAIN today would turn an unknown dispatch into a fabricated success, so
 *   this transport reports UNVERIFIED (which the core records as CHANNEL_UNCERTAIN, terminal and
 *   never retried) and carries the uncertainty itself in send.state + reason. When the core grows a
 *   real UNCERTAIN branch, switch this back; the unit test names the exact defect.
 */
export function classifyDriveResult(parsed, { threadId, requestId, prompt = '' } = {}) {
  const journalKey = requestId ?? null;
  const base = { threadId: threadId ?? null, journalKey, journalPath: null, reply: null };
  const result = (effect, state, reason, extra = {}) => ({ ...base, effect, reason: reason ?? null, send: { state }, ...extra });

  if (!parsed || typeof parsed !== 'object') {
    return result('UNVERIFIED', 'uncertain', 'drive returned no parsable result');
  }
  // A browser we could not reach sent nothing. This is the promised fail-closed path.
  if (parsed.reason === 'no-browser') {
    return result('FAILED', 'not-sent', 'BROWSER_UNAVAILABLE: the capture browser is not reachable');
  }
  if (parsed.authWall && parsed.authWall.blocked) {
    return result('FAILED', 'not-sent', `AUTH_WALL: ${String(parsed.authWall.reason ?? 'sign-in required')}`);
  }
  if (parsed.blocked) {
    return result('FAILED', 'not-sent', `BLOCKED: ${String(parsed.reason ?? 'site refused the drive')}`);
  }

  // Reasons that are decided BEFORE anything is typed. Each of these provably sent nothing.
  const NOT_SENT = new Set([
    'no-composer', 'not-a-new-chat', 'thread-not-open', 'thread-not-rendered', 'page-unreadable',
    'draft-not-cleared', 'composer-unreadable', 'prompt-mismatch', 'type-failed',
    'attachment-missing', 'attachment-not-a-file', 'no-file-input', 'set-file-failed',
  ]);
  const reason = String(parsed.reason ?? (Array.isArray(parsed.errors) ? parsed.errors[0] : '') ?? '');
  // The multi-line trap: the composer's text no longer matches what was typed, so the drive refuses
  // to press send. Measured on ChatGPT and re-measured here rather than assumed.
  if (reason === 'prompt-mismatch') {
    return result('FAILED', 'not-sent', `PROMPT_MISMATCH: the composer did not hold the prompt verbatim (${prompt.includes('\n') ? 'prompt contained line breaks' : 'composer rewrote the text'}); nothing was sent`);
  }
  if (NOT_SENT.has(reason)) {
    return result('FAILED', 'not-sent', `${reason.toUpperCase()}: ${reason}`);
  }

  // The dispatch reached the provider and the provider refused to answer (quota exhausted, rate
  // limit, outage banner). That is a definitive failure with a known cause, not an unknown outcome:
  // driveSite marks every post-dispatch failure `uncertain`, but here the site said exactly why, so
  // the reason is carried forward as the site's own notice rather than offered as model prose.
  if (reason === 'site-failure') {
    const notice = Array.isArray(parsed.errors) ? parsed.errors.find((e) => typeof e === 'string' && e !== 'site-failure') : null;
    return result('FAILED', 'failed', `SITE_REFUSAL: ${String(notice ?? 'the provider refused the turn').slice(0, 300)}`);
  }

  if (parsed.uncertain === true || reason === 'timeout' || reason === 'thread-changed') {
    // A turn may have reached the model. Terminal for this turn, never retried automatically.
    // UNVERIFIED rather than UNCERTAIN: see the @hq:why above — the core has no UNCERTAIN branch.
    return result('UNVERIFIED', 'uncertain', `UNCERTAIN: ${reason || 'dispatch outcome unknown'}`);
  }

  if (parsed.ok === true && typeof parsed.reply === 'string' && parsed.reply.length) {
    // The drive reports the thread it observed. A pinned ref from the page beats the one we asked
    // for; with none, the requested thread stands (a fresh chat that never pinned stays FRESH_THREAD).
    const observed = typeof parsed.threadRef === 'string' && PINNED_THREAD.test(parsed.threadRef)
      ? parsed.threadRef.toLowerCase()
      : (threadId ?? null);
    return result('OK', 'delivered', null, { reply: parsed.reply, threadId: observed });
  }
  // ok=true with an empty reply means the page settled without an answer: no reply to report.
  return result('FAILED', 'failed', `DRIVE_NO_REPLY: ${reason || 'the drive settled without reply text'}`);
}

const DEFAULT_DEADLINE_MS = 90000;
const STUDIO_BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'bin', 'studio.mjs');

/**
 * Build the claude transport. `exec` is injected so the unit tests prove every refusal path with no
 * browser and no child process at all.
 */
export function createClaudeTransport({
  binPath = STUDIO_BIN,
  exec = spawnSync,
  nodePath = process.execPath,
  maxOutputBytes = 8 * 1024 * 1024,
} = {}) {
  if (typeof exec !== 'function') throw new Error('CLAUDE_EXEC_REQUIRED: exec must be a function');
  if (typeof binPath !== 'string' || !binPath.length) throw new Error('CLAUDE_BIN_REQUIRED: a studio.mjs path is required');

  return {
    // The site this transport speaks to. The policy core reads it: a scope naming another site is
    // refused before any dispatch, so this file can never write a receipt under another site's
    // scope (the canonical chatgpt scope included).
    site: SITE,
    /**
     * A fresh Studio-owned claude chat. Studio creates the tab during the drive itself, so creation
     * is decided here without touching a browser — the address is passed to `send`.
     *
     * `site` is accepted and IGNORED on purpose: one site per sender is the frozen rule, and the
     * policy layer currently passes its own site hint. Honouring it would let one channel module
     * speak for another site.
     */
    async createThread(_options = {}) {
      return { threadId: FRESH_THREAD };
    },

    async send({ threadId, prompt, requestId, deadline, attachment } = {}) {
      if (typeof requestId !== 'string' || !requestId.length) throw new Error('CLAUDE_REQUEST_ID_REQUIRED');
      if (typeof prompt !== 'string' || !prompt.length) {
        return { effect: 'FAILED', reason: 'EMPTY_PROMPT: nothing was typed', reply: null, threadId: threadId ?? null,
          journalKey: requestId, journalPath: null, send: { state: 'not-sent' } };
      }
      // A thread we were told to continue but cannot address is a caller bug, not a licence to open
      // an arbitrary claude tab and type into whatever conversation it happens to show.
      if (threadId !== undefined && threadId !== null && threadId !== FRESH_THREAD && !isPinnedThread(threadId)) {
        return { effect: 'FAILED', reason: `THREAD_UNKNOWN: "${String(threadId)}" is not a claude /chat/<uuid> thread and no tab is guessed`, reply: null,
          threadId: null, journalKey: requestId, journalPath: null, send: { state: 'not-sent' } };
      }

      const seconds = Math.max(5, Math.min(900, remainingSeconds(deadline ?? Date.now() + DEFAULT_DEADLINE_MS)));
      const target = driveUrlFor(threadId);
      const args = [binPath, 'drive', target, '--prompt', prompt, '--timeout', String(seconds), '--no-record', '--json'];
      if (typeof attachment === 'string' && attachment.length) args.push('--attach', attachment);

      let child;
      try {
        child = exec(nodePath, args, { encoding: 'utf8', timeout: (seconds + 45) * 1000, maxBuffer: maxOutputBytes });
      } catch (error) {
        // The child never started: nothing was typed.
        return { effect: 'FAILED', reason: `DRIVE_SPAWN_FAILED: ${String(error?.message ?? error)}`, reply: null,
          threadId: threadId ?? null, journalKey: requestId, journalPath: null, send: { state: 'not-sent' } };
      }

      // A killed drive may have already dispatched. That is uncertainty, never a failure to retry.
      if (child?.error && (child.error.code === 'ETIMEDOUT' || child.signal)) {
        return { effect: 'UNVERIFIED', reason: 'UNCERTAIN: DRIVE_TIMEOUT - the drive was stopped after it may have dispatched', reply: null,
          threadId: threadId ?? null, journalKey: requestId, journalPath: null, send: { state: 'uncertain' } };
      }

      let parsed;
      try {
        parsed = JSON.parse(String(child?.stdout ?? '').trim());
      } catch {
        // No parsable payload: the drive can still have sent. Never report this as "nothing happened".
        return { effect: 'UNVERIFIED', reason: 'DRIVE_INVALID_RESPONSE: the drive produced no parsable result', reply: null,
          threadId: threadId ?? null, journalKey: requestId, journalPath: null, send: { state: 'uncertain' } };
      }

      const mapped = classifyDriveResult(parsed, { threadId, requestId, prompt });
      // Keep the transport result inside the shape the channel reads.
      return {
        effect: mapped.effect,
        reply: mapped.reply,
        threadId: mapped.threadId,
        journalKey: mapped.journalKey,
        journalPath: mapped.journalPath,
        send: mapped.send,
        reason: mapped.reason,
      };
    },
  };
}
