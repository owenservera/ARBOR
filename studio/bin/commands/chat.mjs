// A one-shot lifecycle, not an alternate browser driver or a persistent recorder daemon.
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { define } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { EXIT } from '../../src/config.mjs';
import { defaultConversationRuntime, validateConversationBody } from '../../src/studio/conversation-api.mjs';
import { createChatChannel } from '../../src/studio/chat-channel.mjs';
import { encodeHeader, encodeFooter } from '../../src/studio/message-index.mjs';
import { extractDriveJson } from '../../src/studio/drive-output.mjs';
import { createGeminiTransport } from '../../src/studio/channels/gemini.mjs';
import { createClaudeTransport } from '../../src/studio/channels/claude.mjs';
import { launchChrome } from '../../src/chrome/launch.mjs';
import { devAutoApprove } from '../lib/dev-auto-approve.mjs';

export async function runChat(ctx, { factory = defaultConversationRuntime, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now, launch = launchChrome, env = process.env } = {}) {
  const { flags, args, out } = ctx;
  // VC-1B channel subcommands: argv[0] exactly ask|work|revoke takes the new path. Anything else
  // (a <site>) falls through to the legacy connect->submit->poll->finish path below, preserved
  // byte-for-byte: same flags, same output, randomUUID key minting.
  const [channelSub] = args;
  if (channelSub === 'ask' || channelSub === 'work' || channelSub === 'revoke' || channelSub === 'stats') {
    return runChannelCommand(ctx, channelSub, flags);
  }
  if (args.length !== 1) throw usageError('Usage: studio chat <site> --prompt TEXT [--execute]');
  const connect = validateConversationBody('connect', { site: args[0], ...(flags.target ? { targetId: flags.target } : {}), freshTab: flags.fresh ?? !flags.target });
  if (connect.freshTab && connect.targetId || !connect.freshTab && !connect.targetId) throw usageError('Choose either --target ID or a fresh tab, not both');
  const prompt = flags.prompt;
  const timeout = flags.timeout ?? 120;
  if (!Number.isFinite(timeout) || timeout < 1 || timeout > 900) throw usageError('timeout must be between 1 and 900 seconds');
  validateConversationBody('submit', { key: 'validation-only', prompt, confirm: true, expectedRevision: 0 });
  const emit = (result) => out.emit(result, (o) => o.line(JSON.stringify(result, null, 2)));
  if (!flags.execute || flags['dry-run']) {
    // Do not construct the runtime: even target discovery is forbidden in the default preview.
    emit({ dryRun: true, site: connect.site, targetId: connect.targetId ?? null, freshTab: connect.freshTab ?? false, promptChars: prompt.length, timeoutSeconds: timeout, action: 'connect-submit-poll-finish', browserAction: false });
    return;
  }
  if (!flags['accept-sends'] && !devAutoApprove(env)) throw usageError('Live sends require --execute --accept-sends. For the 100-scenario campaign, use studio live-100: never dispatch parallel studio chat workers.');
  // A single user command prepares (or verifies) the dedicated browser before any live send.
  // Injected like `factory` so an offline test can prove the one-shot lifecycle without a browser.
  await launch({ profileDir: ctx.paths.chromeProfile, port: ctx.port, dataRoot: ctx.paths.root });
  const runtime = await factory({ paths: ctx.paths, profileStore: ctx.profiles(), familyStore: ctx.families(), port: ctx.port });
  let conversation, finalized = false;
  try {
    conversation = await runtime.connect(connect);
    conversation = await runtime.submit(conversation.id, { key: randomUUID(), prompt, confirm: true, expectedRevision: conversation.revision });
    const deadline = now() + timeout * 1000;
    const terminal = (c) => ['ready', 'failed'].includes(c.reply?.state)
      || ['blocked', 'needs-reconciliation', 'closed'].includes(c.state)
      || ['blocked', 'uncertain', 'needs-reconciliation'].includes(c.turn?.phase)
      || ['uncertain', 'not-sent', 'failed'].includes(c.turn?.send?.state);
    while (now() < deadline && !terminal(conversation)) {
      await sleep(Math.min(500, Math.max(0, deadline - now())));
      conversation = await runtime.get(conversation.id);
    }
    const timedOut = now() >= deadline && !terminal(conversation);
    const stopped = { state: conversation.state, phase: conversation.turn?.phase, send: conversation.turn?.send?.state };
    // Never close a tab here, particularly after an uncertain send. Never retry dispatch.
    finalized = true;
    conversation = await runtime.finish(conversation.id, { closeTab: false });
    const error = ['blocked', 'needs-reconciliation'].includes(stopped.state) || ['blocked', 'uncertain', 'needs-reconciliation'].includes(stopped.phase)
      || ['uncertain', 'not-sent', 'failed'].includes(stopped.send)
      ? { code: stopped.phase === 'blocked' || stopped.state === 'blocked' ? 'TURN_BLOCKED' : 'TURN_NOT_CONFIRMED', ...stopped }
      : timedOut ? { code: 'LOCAL_WAIT_TIMEOUT' } : null;
    emit({ conversation, timedOut, error, resent: false, tabCloseRequested: false });
    if (error) process.exitCode = EXIT.ENVIRONMENT;
  } finally {
    try {
      if (conversation && !finalized) await runtime.finish(conversation.id, { closeTab: false });
    } finally { await runtime.close(); }
  }
}

// ---------------------------------------------------------------------------------------------
// VC-1B channel subcommands: studio chat ask | work | revoke.
//
// The legacy `studio chat <site>` path above is untouched: same flags, same output, same
// randomUUID key minting. The new path talks to a RUNNING Studio over its conversation HTTP API
// (the same loopback fetch pattern and conversation.* routes studio/bin/lib/relay-chat-studio.mjs
// uses): conversation.create for a new thread, conversation.ask equivalent with key = requestId,
// then poll for the reply until the deadline. No new HTTP client, no browser, no CDP.

const ID_SAFE = /^[A-Za-z0-9._-]+$/;

function safeName(value, what) {
  if (typeof value !== 'string' || !ID_SAFE.test(value) || value === '.' || value === '..') {
    throw usageError(`Invalid ${what}: ${String(value)}`);
  }
  return value;
}

function emitJson(out, data) {
  return out.emit(data, (o) => o.line(JSON.stringify(data, null, 2)));
}

function sha256(text) {
  return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');
}

// Providers render a UI label above the answer ("ChatGPT dijo:", "ChatGPT said:"). It is page
// chrome, not model output, so it is stripped before the reply is recorded.
function stripProviderPrefix(text) {
  return String(text ?? '')
    .replace(/^\s*(?:ChatGPT|Claude|Gemini|DeepSeek|Qwen|Grok|Z\.ai)\s+(?:dijo|said|says|a dit|sagte|ha detto)\s*:?\s*/i, '')
    .trim();
}

// UI boilerplate that is never the answer. If a "reply" is only this, the turn produced nothing
// and must be reported as a failure rather than dressed up as success.
const BOILERPLATE_RE = /^(chatgpt (puede cometer errores|can make mistakes)|comprueba la informaci[oó]n|check important info)/i;

function sanitizeReply(text) {
  const clean = stripProviderPrefix(text);
  if (BOILERPLATE_RE.test(clean)) return '';
  return clean;
}

// File-backed receipt/journal store under <dataDir>/channel/. Digests and decisions only: no
// cookies, tokens or session values are ever persisted here.
function createFileStore({ dataDir }) {
  const receiptsDir = path.join(dataDir, 'channel', 'receipts');
  const revocationsDir = path.join(dataDir, 'channel', 'revocations');
  const outcomesDir = path.join(dataDir, 'channel', 'outcomes');
  const pendingDir = path.join(dataDir, 'channel', 'pending');
  mkdirSync(receiptsDir, { recursive: true });
  mkdirSync(revocationsDir, { recursive: true });
  mkdirSync(outcomesDir, { recursive: true });
  mkdirSync(pendingDir, { recursive: true });
  return {
    async get(requestId) {
      try { return JSON.parse(readFileSync(path.join(receiptsDir, `${requestId}.json`), 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async put(receipt) {
      safeName(receipt.requestId, 'receipt id');
      writeFileSync(path.join(receiptsDir, `${receipt.requestId}.json`), JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
    },
    // The receipt keeps digests only; the caller-facing body is cached beside it so a replay can
    // return the original reply instead of an empty string.
    async getOutcome(requestId) {
      try { return JSON.parse(readFileSync(path.join(outcomesDir, `${requestId}.json`), 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async putOutcome(requestId, outcome) {
      safeName(requestId, 'request id');
      writeFileSync(path.join(outcomesDir, `${requestId}.json`), JSON.stringify(outcome, null, 2) + '\n', { mode: 0o600 });
    },
    // Write-ahead marker: written before dispatch, cleared when a receipt is recorded. A marker
    // without a receipt after the fact is an unresolved dispatch and feeds the uncertainty metric.
    async putPending(entry) {
      safeName(entry.requestId, 'request id');
      writeFileSync(path.join(pendingDir, `${entry.requestId}.json`), JSON.stringify(entry, null, 2) + '\n', { mode: 0o600 });
    },
    async getPending(requestId) {
      try { return JSON.parse(readFileSync(path.join(pendingDir, `${requestId}.json`), 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async clearPending(requestId) {
      try { unlinkSync(path.join(pendingDir, `${requestId}.json`)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    },
    async isRevoked(taskId) {
      if (!taskId) return false;
      try { readFileSync(path.join(revocationsDir, `${taskId}.json`), 'utf8'); return true; }
      catch (error) { if (error.code === 'ENOENT') return false; throw error; }
    },
    async revoke(taskId) {
      safeName(taskId, 'task id');
      writeFileSync(path.join(revocationsDir, `${taskId}.json`), JSON.stringify({ taskId, revokedAt: new Date().toISOString(), reason: 'CLI_REVOKE' }, null, 2) + '\n', { mode: 0o600 });
    },
  };
}

// Transport over the RUNNING Studio's conversation HTTP API. conversation.create for a new thread;
// the submit endpoint (conversation.ask) with key = requestId so Studio's send-once journal
// records the caller key (RECON.md section 3); poll the conversation snapshot (inspect equivalent)
// until the deadline; timeout is UNCERTAIN, never retried, never an invented reply.
function runStats(dataDir, out) {
  const base = path.join(dataDir, 'channel');
  const readAll = (dir) => {
    try {
      return readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => { try { return JSON.parse(readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } })
        .filter(Boolean);
    } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  };
  const receipts = readAll(path.join(base, 'receipts'));
  const pending = readAll(path.join(base, 'pending'));
  const outcomes = readAll(path.join(base, 'outcomes'));

  const byEffect = {};
  for (const r of receipts) byEffect[r.effect] = (byEffect[r.effect] ?? 0) + 1;

  // Latency: first turn start to last turn end, per recorded outcome.
  const samples = [];
  for (const o of outcomes) {
    const turns = Array.isArray(o.turns) ? o.turns : [];
    if (!turns.length) continue;
    const start = Date.parse(turns[0].startedAt);
    const end = Date.parse(turns[turns.length - 1].endedAt);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) samples.push(end - start);
  }
  samples.sort((a, b) => a - b);
  const pct = (p) => (samples.length ? samples[Math.min(samples.length - 1, Math.floor((p / 100) * samples.length))] : null);

  // U = dispatches still unresolved after the wait, over every dispatch attempted.
  const attempted = receipts.length + pending.length;
  const uncertaintyRate = attempted ? Number((pending.length / attempted).toFixed(4)) : 0;

  return {
    schema: 'vivim.chat-stats/1',
    receipts: receipts.length,
    pendingUnresolved: pending.length,
    byEffect,
    uncertaintyRate,
    latencyMs: { p50: pct(50), p90: pct(90), samples: samples.length },
  };
}

// Live transport over Studio's own `drive` command. Studio remains the single browser owner: this
// spawns Studio, which takes the drive lease on its own tab. Chosen over the conversation HTTP API
// because that API requires a pinned /c/<uuid> thread, and the current ChatGPT UI keeps the tab at
// the root URL (observed 2026-11-03: every create resolved to reason CREATION_UNPINNED).
// Trade recorded in docs/chatgpt-channel/CONTRACT.md: the channel keeps its own send-once receipt
// store keyed by requestId; Studio's per-thread turn journal is not reached on this path.
export function createDriveTransport({ binPath, timeoutSeconds = 120, exec = spawnSync, isolatedThreads = false, dataDir, port }) {
  return {
    async createThread() {
      // Legacy seat uses its existing tab. Explicit isolated phone sessions use
      // a fresh Studio-owned tab, and must get a real /c/<uuid> back before OK.
      return { threadId: isolatedThreads ? 'chatgpt-new-tab' : 'chatgpt-live-tab' };
    },
    async send({ threadId, prompt, requestId, deadline, attachment }) {
      // The drive child must be allowed the whole budget the caller granted. A fixed cap here cut
      // every slow high-effort send off at the cap instead of the deadline (observed: a 122.9 s
      // answer against a 120 s cap), which surfaced as an empty reply.
      const remaining = Math.max(5, Math.min(600, Math.ceil((deadline.getTime() - Date.now()) / 1000)));
      // A phone conversation cannot be safely mapped to whichever ChatGPT tab
      // happens to be active. Isolated mode always opens Studio's own tab; a
      // continuation names the proven native /c/<uuid> URL explicitly.
      const pinned = /^chatgpt-c:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.exec(threadId ?? '');
      if (isolatedThreads && threadId !== 'chatgpt-new-tab' && !pinned)
        return { effect: 'FAILED', reply: null, threadId, journalKey: requestId, reason: 'CHATGPT_THREAD_UNVERIFIED' };
      const target = isolatedThreads && pinned ? 'https://chatgpt.com/c/' + pinned[1] : 'chatgpt';
      // The parent CLI's --data-dir and --port are NOT inherited by a subprocess.
      // Without them the child may attach to a different CDP listener/profile.
      // Refuse the send instead of silently falling back to global defaults.
      if (typeof dataDir !== 'string' || !path.isAbsolute(dataDir) ||
          !Number.isSafeInteger(port) || port < 1 || port > 65535)
        return { effect: 'FAILED', reply: null, threadId, journalKey: requestId, reason: 'STUDIO_DRIVE_CONTEXT_UNVERIFIED' };
      const driveArgs = [
        binPath, 'drive', target, ...(isolatedThreads ? [] : ['--reuse-tab']), '--prompt', prompt,
        '--timeout', String(remaining), '--no-record', '--data-dir', dataDir,
        '--port', String(port), '--json',
      ];
      // Fast typing is ~2x quicker but has been seen to drop characters on long prompts, so it is
      // used only for short ones. Anything substantial types at human pace.
      if (prompt.length <= 250) driveArgs.push('--fast');
      if (typeof attachment === 'string' && attachment.length) driveArgs.push('--attach', attachment);
      const result = exec(process.execPath, driveArgs, { encoding: 'utf8', timeout: (remaining + 45) * 1000, maxBuffer: 8 * 1024 * 1024 });
      if (result.error && result.error.code === 'ETIMEDOUT') {
        throw new Error('STUDIO_DRIVE_TIMEOUT');
      }
      let parsed;
      // drive prints progress lines before its JSON result; extract the object rather than assuming
      // stdout is pure JSON. A bare parse here silently turned every noisy run into an empty reply.
      try { parsed = extractDriveJson(result.stdout); }
      catch { throw new Error('STUDIO_DRIVE_INVALID_RESPONSE'); }
      if (parsed.authWall && parsed.authWall.blocked) {
        return { effect: 'FAILED', threadId, reply: null, journalKey: requestId, reason: parsed.authWall.reason ?? 'AUTH_WALL' };
      }
      if (isolatedThreads && parsed.ok === true) {
        const proven = /^chatgpt-c:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.exec(parsed.threadRef ?? '');
        // The page may have sent despite a missing native thread identity:
        // never mark that as safe-to-retry or deliver a false positive.
        if (!proven || (pinned && parsed.threadRef !== threadId))
          return { effect: 'UNCERTAIN', threadId, reply: null, journalKey: requestId, reason: 'CHATGPT_THREAD_NOT_PROVEN' };
        const clean = sanitizeReply(parsed.reply);
        if (!clean.length)
          return { effect: 'UNCERTAIN', threadId: parsed.threadRef, reply: null, journalKey: requestId, reason: 'CHATGPT_REPLY_NOT_SETTLED' };
        return { effect: 'OK', threadId: parsed.threadRef, reply: clean, journalKey: requestId };
      }
      if (parsed.ok === true && typeof parsed.reply === 'string' && parsed.reply.length) {
        const clean = sanitizeReply(parsed.reply);
        if (!clean.length) return { effect: 'FAILED', threadId, reply: null, journalKey: requestId, reason: 'DISCLAIMER_ONLY' };
        return { effect: 'OK', threadId, reply: clean, journalKey: requestId };
      }
      if (isolatedThreads && parsed.uncertain === true)
        return { effect: 'UNCERTAIN', threadId, reply: null, journalKey: requestId, reason: 'STUDIO_DRIVE_DELIVERY_UNCERTAIN' };
      const errors = Array.isArray(parsed.errors) ? parsed.errors.filter(x => typeof x === 'string') : [];
      const refusal = errors.find(x => x.startsWith('send preflight: '));
      const first = errors[0] ?? 'DRIVE_NO_REPLY';
      // The provider-facing receipt must show the *existing* structural refusal,
      // not only the generic "send not attempted" envelope. Never include prompt
      // text or raw DOM in this diagnostic; Drive bounds these reason strings.
      const reason = refusal && first !== refusal ? first + '; ' + refusal.slice(0, 200) : first;
      return { effect: 'FAILED', threadId, reply: null, journalKey: requestId, reason };
    },
  };
}

function createStudioChatTransport({ port, fetchImpl = globalThis.fetch }) {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('CHANNEL_STUDIO_PORT_REQUIRED');
  const origin = `http://127.0.0.1:${port}`;
  const requestTimeoutMs = 30000;
  async function request(route, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetchImpl(origin + '/api/v1' + route, {
        method: body === undefined ? 'GET' : 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      let data;
      try { data = await response.json(); } catch { throw Object.assign(new Error('STUDIO_INVALID_RESPONSE'), { status: response.status }); }
      if (!response.ok) throw Object.assign(new Error(String(data?.code ?? 'STUDIO_HTTP_ERROR')), { code: data?.code, status: response.status });
      return data?.conversation ?? data;
    } finally { clearTimeout(timer); }
  }
  async function conversationOf(threadId) {
    const conversation = await request(`/conversations/${encodeURIComponent(threadId)}`, undefined);
    if (!conversation || typeof conversation.id !== 'string') throw new Error('STUDIO_INVALID_CONVERSATION');
    return conversation;
  }
  return {
    async createThread({ actor, site = 'chatgpt' }) {
      const conversation = await request('/conversations/create', { site });
      if (!conversation || typeof conversation.id !== 'string') throw new Error('STUDIO_INVALID_CONVERSATION');
      return { threadId: conversation.id };
    },
    async send({ threadId, prompt, requestId, actor, deadline }) {
      // `actor` is audited by the channel layer; Studio's submit tool arguments are a closed schema
      // (RECON.md section 6), so actor never rides the submit payload.
      let revision = 0;
      try {
        const conversation = await conversationOf(threadId);
        revision = Number.isSafeInteger(conversation.revision) ? conversation.revision : 0;
      } catch (error) {
        return { effect: 'FAILED', threadId, reply: null, journalKey: null, reason: error.code ?? 'STUDIO_CONVERSATION_NOT_FOUND' };
      }
      try {
        await request(`/conversations/${encodeURIComponent(threadId)}/turns`, { key: requestId, prompt, confirm: true, expectedRevision: revision });
      } catch (error) {
        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
          return { effect: 'FAILED', threadId, reply: null, journalKey: null, reason: error.code ?? 'STUDIO_SUBMIT_REJECTED' };
        }
        throw error;
      }
      while (Date.now() < deadline) {
        try {
          const conversation = await conversationOf(threadId);
          const turn = Array.isArray(conversation.turns) ? conversation.turns.find((t) => t.key === requestId) : undefined;
          if (turn && turn.phase === 'blocked') {
            return { effect: 'FAILED', threadId, reply: null, journalKey: turn.id ?? null, reason: turn.reason ?? 'STUDIO_TURN_BLOCKED' };
          }
          if (turn && turn.reply?.verified === true && turn.reply.settled === true && typeof turn.reply.text === 'string' && turn.reply.text.length) {
            return { effect: 'OK', threadId, reply: stripProviderPrefix(turn.reply.text), journalKey: turn.id ?? null };
          }
        } catch {
          // Transient read failure while polling: keep polling until the deadline.
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      // No delivery evidence before the deadline: uncertain, never a retry, never an invented reply.
      return { effect: 'UNVERIFIED', threadId, reply: null, journalKey: null };
    },
  };
}

const STUDIO_BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'studio.mjs');

// Every execution announces itself in the index frame on stderr, so the harness can read what ran
// without parsing the JSON result and without the frame ever contaminating stdout.
function traceFrame({ kind, receipt, outcome, startedAt, thread }) {
  try {
    const header = encodeHeader({
      id: String(receipt.receiptId).slice(0, 8), rid: receipt.requestId, parent: null,
      src: 'cli', dst: 'chatgpt', kind,
      thread: String(thread ?? receipt.thread?.after ?? '-').slice(0, 24), effort: outcome.effort,
    });
    // Only a local verification hook may promote the frame to `verified`; the CLI holds no such
    // authority on its own, so it passes harnessVerified only when the channel reported VERIFIED.
    const footer = encodeFooter({
      status: receipt.effect === 'OK' ? 'ok' : receipt.effect === 'BUDGET_EXHAUSTED' ? 'partial'
        : receipt.effect === 'UNCERTAIN' ? 'uncertain' : receipt.effect === 'DENIED' || receipt.effect === 'REVOKED' ? 'refused' : 'fail',
      evidence: outcome.evidenceState === 'VERIFIED' ? 'verified' : outcome.evidenceState === 'OBSERVED' ? 'observation' : 'claim',
      turns: receipt.turns ?? 0,
      ms: Date.now() - startedAt,
      receipt: String(receipt.receiptId).slice(0, 8),
      hash: receipt.replyDigest ?? '',
      harnessVerified: outcome.evidenceState === 'VERIFIED',
    });
    process.stderr.write(`${header} ${footer}\n`);
    // A failure that does not say why is a failure nobody can fix. Reasons go to stderr so the
    // JSON contract on stdout stays untouched.
    if (Array.isArray(outcome.open) && outcome.open.length) {
      process.stderr.write(`[chat-channel] ${outcome.effect}: ${outcome.open.join('; ')}\n`);
    }
  } catch { /* a trace must never break a send */ }
}

function runChannelCommand(ctx, sub, flags) {
  const { out, paths, settings, port } = ctx;
  const store = createFileStore({ dataDir: paths.root });
  const site = typeof flags.site === 'string' && flags.site.length ? flags.site : 'chatgpt';
  const transport = channelTransportFor(site, settings, {
    isolatedThread: flags['isolated-thread'] === true,
    dataDir: paths.root, cdpPort: port
  });
  const channel = createChatChannel({
    transport,
    store,
    now: () => new Date(),
    // Trace goes to stderr so --json keeps stdout machine-readable.
    log: (message) => { try { process.stderr.write(`[chat-channel] ${message}\n`); } catch { /* trace is best effort */ } },
  });
  if (sub === 'stats') return emitJson(out, runStats(paths.root, out));
  if (sub === 'ask') return runAsk(channel, flags, out, site);
  if (sub === 'work') return runWork(channel, flags, out, site);
  return runRevoke(store, flags, out);
}

/**
 * One browser owner (Studio), one transport per site. The site rides in the scope string; an
 * unknown site is a usage error here and a CHANNEL_DENIED in the core, so it never reaches a send.
 */
function channelTransportFor(site, settings, { isolatedThread = false, dataDir, cdpPort } = {}) {
  if (isolatedThread && site !== 'chatgpt') throw usageError('Isolated-thread channel currently supports ChatGPT only');
  if (site === 'gemini') return createGeminiTransport({ binPath: STUDIO_BIN });
  if (site === 'claude') return createClaudeTransport({ binPath: STUDIO_BIN });
  if (site !== 'chatgpt') throw usageError(`unsupported chat site "${site}"`);
  // Default is the proven drive path. VIVIM_CHAT_TRANSPORT=conversation selects the pinned-thread
  // conversation API instead, for use if the ChatGPT UI starts pinning /c/<uuid> again.
  return !isolatedThread && process.env.VIVIM_CHAT_TRANSPORT === 'conversation'
    ? createStudioChatTransport({ port: settings.studioPort })
    : createDriveTransport({ binPath: STUDIO_BIN, isolatedThreads: isolatedThread,
        dataDir, port: cdpPort });
}

function runAsk(channel, flags, out, site) {
  const thread = flags.thread;
  if (typeof thread !== 'string' || !thread.length) throw usageError('--thread <id|new> is required for "studio chat ask".');
  const promptFile = flags['prompt-file'];
  if (typeof promptFile !== 'string' || !promptFile.length) throw usageError('--prompt-file <path> is required for "studio chat ask".');
  let prompt;
  try { prompt = readFileSync(promptFile, 'utf8'); }
  catch (error) { throw usageError(`Could not read --prompt-file "${promptFile}": ${error.code ?? error.message}`); }
  // requestId is the replay key. A caller-supplied --request-id always wins. Otherwise a fresh
  // thread mints a new one (a new thread is a new logical request), while an existing thread
  // derives a stable key so a retry after a timeout replays instead of sending a second turn.
  let requestId = flags['request-id'];
  if (typeof requestId === 'string' && requestId.length) {
    safeName(requestId, 'request id');
  } else if (thread === 'new') {
    requestId = randomUUID();
  } else {
    requestId = sha256('ask:' + thread + ':' + prompt);
  }
  const taskId = sha256('ask-task:' + requestId);
  const startedAt = Date.now();
  // A live provider answer is slower than the channel default; --timeout (seconds) sets the budget.
  const timeoutMs = Number.isFinite(flags.timeout) ? Math.max(1000, flags.timeout * 1000) : 90000;
  return channel.run({ scope: `${site}.send`, taskId, actor: { kind: 'agent', id: 'cli' }, thread, prompt, requestId, timeoutMs, effort: flags.effort, attachment: flags.attach })
    .then(({ receipt, outcome }) => {
      traceFrame({ kind: 'ask', receipt, outcome, startedAt, thread });
      return emitJson(out, {
        schema: 'vivim.chat-ask-result/1',
        effort: outcome.effort,
        reply: outcome.reply ?? '',
        threadId: receipt.thread.after || receipt.thread.before || (thread === 'new' ? 'new' : thread),
        requestId: receipt.requestId,
        receiptId: receipt.receiptId,
        effect: receipt.effect === 'UNCERTAIN' ? 'UNVERIFIED' : receipt.effect === 'OK' ? 'OK' : 'FAILED',
      });
    });
}

function runWork(channel, flags, out, site) {
  const taskFile = flags['task-file'];
  if (typeof taskFile !== 'string' || !taskFile.length) throw usageError('--task-file <path> is required for "studio chat work".');
  let task;
  try { task = JSON.parse(readFileSync(taskFile, 'utf8')); }
  catch (error) { throw usageError(`Could not parse --task-file "${taskFile}": ${error.code ?? error.message}`); }
  if (!task || typeof task !== 'object' || Array.isArray(task)) throw usageError('--task-file must contain a JSON object.');
  // The task envelope names this `taskId` (schemas/chat-task.v1.json); `id` is accepted for
  // hand-written tasks.
  const taskId = typeof task.taskId === 'string' && task.taskId.length ? task.taskId : task.id;
  if (typeof taskId !== 'string' || !taskId.length) throw usageError('task file must contain a string "taskId".');  // The task envelope carries `problem`; `prompt` is accepted as the older spelling.
  const prompt = typeof task.problem === 'string' ? task.problem : typeof task.prompt === 'string' ? task.prompt : '';
  const actor = isPlainObject(task.actor) ? task.actor : { kind: 'agent', id: 'cli' };
  // The envelope carries `scopes` (array); a single `scope` is accepted for hand-written tasks.
  const scopes = Array.isArray(task.scopes) ? task.scopes : (typeof task.scope === 'string' ? [task.scope] : []);
  const delegateScope = `${site}.delegate`;
  const scope = scopes.includes(delegateScope) ? delegateScope : (scopes.length ? scopes[0] : `${site}.send`);
  const threadRaw = task.thread;
  const thread = threadRaw === 'new' ? 'new' : undefined;
  const taskThread = typeof threadRaw === 'string' && threadRaw !== 'new' ? threadRaw : undefined;
  // deadline is ISO-8601 in the envelope; the channel takes a remaining budget in milliseconds.
  let deadlineMs = task.deadlineMs;
  if (!Number.isFinite(deadlineMs) && typeof task.deadline === 'string') {
    const parsed = Date.parse(task.deadline);
    if (Number.isFinite(parsed)) deadlineMs = Math.max(0, parsed - Date.now());
  }
  let requestId = task.requestId;
  if (typeof requestId === 'string' && requestId.length) {
    if (!ID_SAFE.test(requestId)) throw usageError('task file "requestId" may only contain A-Za-z0-9._-');
  } else {
    requestId = sha256('work:' + taskId + ':' + prompt);
  }
  return channel.run({ scope, taskId, actor, thread, taskThread, prompt, maxTurns: task.maxTurns, requestId, deadlineMs, effort: task.effort ?? flags.effort })
    .then(({ receipt, outcome }) => emitJson(out, { schema: 'vivim.chat-work-result/1', effort: outcome.effort, solution: outcome.solution, turns: outcome.turns, verifiedLocally: outcome.verifiedLocally, assertedByModel: outcome.assertedByModel, open: outcome.open, receiptId: receipt.receiptId, effect: receipt.effect === 'BUDGET_EXHAUSTED' ? 'PARTIAL' : receipt.effect }));
}

function runRevoke(store, flags, out) {
  const taskId = flags.task;
  if (typeof taskId !== 'string' || !taskId.length) throw usageError('--task <taskId> is required for "studio chat revoke".');
  safeName(taskId, 'task id');
  return store.revoke(taskId).then(() => emitJson(out, { taskId, revoked: true, revokedAt: new Date().toISOString() }));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

define({
  name: 'chat', section: 'Knowledge', usage: '<site> --prompt TEXT [--execute --accept-sends] [--timeout S]',
  summary: 'Preview, or explicitly send one conversation turn and finish its capture',
  description: 'Default is an offline preview. --execute --accept-sends together authorize one real provider turn; use live-100 for campaign scenarios. No retries or persistent CLI recorder.',
  flags: {
    prompt: { type: 'string', valueName: 'TEXT', desc: 'Required prompt, at most 250000 characters' },
    execute: { type: 'boolean', desc: 'Confirm one real website send (may consume account quota)' },
    'dry-run': { type: 'boolean', desc: 'Preview without browser access, even with --execute' },
    'accept-sends': { type: 'boolean', desc: 'Second explicit acknowledgement for a live provider send' },
    timeout: { type: 'number', default: 120, valueName: 'SECONDS', desc: 'Local polling budget, 1–900 seconds' },
    target: { type: 'string', valueName: 'ID', desc: 'Bind an existing target id' },
    fresh: { type: 'boolean', desc: 'Request a new Studio-owned tab' },
    thread: { type: 'string', valueName: 'ID|new', desc: 'Thread id, or "new" to create one (chat ask / chat work)' },
    'request-id': { type: 'string', valueName: 'ID', desc: 'Replay key; repeating it returns the original receipt without sending (chat ask)' },
    'isolated-thread': { type: 'boolean', desc: 'Require fresh or exact pinned ChatGPT Studio tab; refuse ambiguous thread binding' },
    effort: { type: 'string', valueName: 'instant|medium|high', desc: 'Reasoning tier; default auto (high for coding/brainstorm/algorithm, instant for short look-ups, else medium)' },
    attach: { type: 'string', valueName: 'PATH', desc: 'Attach one file to the turn before typing the prompt (chat ask)' },
    site: { type: 'string', valueName: 'SITE', desc: 'Agent-channel target site: chatgpt (default), claude or gemini (chat ask / chat work)' },
    'prompt-file': { type: 'string', valueName: 'PATH', desc: 'File whose UTF-8 text is the prompt (chat ask)' },
    'task-file': { type: 'string', valueName: 'PATH', desc: 'Task JSON file {id, scope, maxTurns, actor, prompt, thread, requestId?} (chat work)' },
    task: { type: 'string', valueName: 'TASK_ID', desc: 'Task id to revoke; writes the revocation, makes no transport call (chat revoke)' },
  },
  examples: ['studio chat chatgpt --prompt "Hello"', 'studio chat chatgpt --prompt "Hello" --execute --accept-sends --json', 'studio chat ask --thread new --prompt-file prompt.txt --json', 'studio chat work --task-file task.json --json', 'studio chat revoke --task task-1 --json'],
  run: runChat,
});
