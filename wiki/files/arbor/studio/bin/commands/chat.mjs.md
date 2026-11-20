# File: studio/bin/commands/chat.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/chat.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 31665 B |
| Lines | 515 |
| Hash | 0e0512114b71 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| runChat | function | 19 | yes | export async function runChat(ctx, { factory = defaultConversationRuntime, sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)), now = Date.now, launch = launchChrome, env = process.env } = {}) { |
| connect | const | 29 | no | const connect = validateConversationBody(&#39;connect&#39;, { site: args[0], ...(flags.target ? { targetId: flags.target } : {}), freshTab: flags.fresh ?? !flags.target }); |
| prompt | const | 31 | no | const prompt = flags.prompt; |
| timeout | const | 32 | no | const timeout = flags.timeout ?? 120; |
| emit | function | 35 | no | const emit = (result) =&gt; out.emit(result, (o) =&gt; o.line(JSON.stringify(result, null, 2))); |
| runtime | const | 45 | no | const runtime = await factory({ paths: ctx.paths, profileStore: ctx.profiles(), familyStore: ctx.families(), port: ctx.port }); |
| conversation | variable | 46 | no | let conversation, finalized = false; |
| deadline | const | 50 | no | const deadline = now() + timeout * 1000; |
| terminal | function | 51 | no | const terminal = (c) =&gt; [&#39;ready&#39;, &#39;failed&#39;].includes(c.reply?.state) |
| timedOut | const | 59 | no | const timedOut = now() &gt;= deadline &amp;&amp; !terminal(conversation); |
| stopped | const | 60 | no | const stopped = { state: conversation.state, phase: conversation.turn?.phase, send: conversation.turn?.send?.state }; |
| error | const | 64 | no | const error = [&#39;blocked&#39;, &#39;needs-reconciliation&#39;].includes(stopped.state) \|\| [&#39;blocked&#39;, &#39;uncertain&#39;, &#39;needs-reconciliation&#39;].includes(stopped.phase) |
| ID_SAFE | const | 86 | no | const ID_SAFE = /^[A-Za-z0-9._-]+$/; |
| safeName | function | 88 | no | function safeName(value, what) { |
| emitJson | function | 95 | no | function emitJson(out, data) { |
| sha256 | function | 99 | no | function sha256(text) { |
| stripProviderPrefix | function | 105 | no | function stripProviderPrefix(text) { |
| BOILERPLATE_RE | const | 113 | no | const BOILERPLATE_RE = /^(chatgpt (puede cometer errores\|can make mistakes)\|comprueba la informaci[oó]n\|check important info)/i; |
| sanitizeReply | function | 115 | no | function sanitizeReply(text) { |
| clean | const | 116 | no | const clean = stripProviderPrefix(text); |
| createFileStore | function | 123 | no | function createFileStore({ dataDir }) { |
| receiptsDir | const | 124 | no | const receiptsDir = path.join(dataDir, &#39;channel&#39;, &#39;receipts&#39;); |
| revocationsDir | const | 125 | no | const revocationsDir = path.join(dataDir, &#39;channel&#39;, &#39;revocations&#39;); |
| outcomesDir | const | 126 | no | const outcomesDir = path.join(dataDir, &#39;channel&#39;, &#39;outcomes&#39;); |
| pendingDir | const | 127 | no | const pendingDir = path.join(dataDir, &#39;channel&#39;, &#39;pending&#39;); |
| runStats | function | 181 | no | function runStats(dataDir, out) { |
| base | const | 182 | no | const base = path.join(dataDir, &#39;channel&#39;); |
| readAll | function | 183 | no | const readAll = (dir) =&gt; { |
| receipts | const | 191 | no | const receipts = readAll(path.join(base, &#39;receipts&#39;)); |
| pending | const | 192 | no | const pending = readAll(path.join(base, &#39;pending&#39;)); |
| outcomes | const | 193 | no | const outcomes = readAll(path.join(base, &#39;outcomes&#39;)); |
| byEffect | const | 195 | no | const byEffect = {}; |
| samples | const | 199 | no | const samples = []; |
| turns | const | 201 | no | const turns = Array.isArray(o.turns) ? o.turns : []; |
| start | const | 203 | no | const start = Date.parse(turns[0].startedAt); |
| pct | function | 208 | no | const pct = (p) =&gt; (samples.length ? samples[Math.min(samples.length - 1, Math.floor((p / 100) * samples.length))] : null); |
| attempted | const | 211 | no | const attempted = receipts.length + pending.length; |
| uncertaintyRate | const | 212 | no | const uncertaintyRate = attempted ? Number((pending.length / attempted).toFixed(4)) : 0; |
| createDriveTransport | function | 230 | no | function createDriveTransport({ binPath, timeoutSeconds = 120, exec = spawnSync }) { |
| remaining | const | 240 | no | const remaining = Math.max(5, Math.min(600, Math.ceil((deadline.getTime() - Date.now()) / 1000))); |
| driveArgs | const | 241 | no | const driveArgs = [ |
| result | const | 249 | no | const result = exec(process.execPath, driveArgs, { encoding: &#39;utf8&#39;, timeout: (remaining + 45) * 1000, maxBuffer: 8 * 1024 * 1024 }); |
| parsed | variable | 253 | no | let parsed; |
| clean | const | 262 | no | const clean = sanitizeReply(parsed.reply); |
| createStudioChatTransport | function | 271 | no | function createStudioChatTransport({ port, fetchImpl = globalThis.fetch }) { |
| origin | const | 273 | no | const origin = `http://127.0.0.1:${port}`; |
| requestTimeoutMs | const | 274 | no | const requestTimeoutMs = 30000; |
| request | function | 275 | no | async function request(route, body) { |
| controller | const | 276 | no | const controller = new AbortController(); |
| timer | const | 277 | no | const timer = setTimeout(() =&gt; controller.abort(), requestTimeoutMs); |
| response | const | 279 | no | const response = await fetchImpl(origin + &#39;/api/v1&#39; + route, { method: body === undefined ? &#39;GET&#39; : &#39;POST&#39;, redirect: &#39;error&#39;, signal: controller.signal, headers: { accept: &#39;application/json&#39;, ...(bo… |
| data | variable | 286 | no | let data; |
| conversationOf | function | 292 | no | async function conversationOf(threadId) { |
| conversation | const | 293 | no | const conversation = await request(`/conversations/${encodeURIComponent(threadId)}`, undefined); |
| conversation | const | 299 | no | const conversation = await request(&#39;/conversations/create&#39;, { site }); |
| revision | variable | 306 | no | let revision = 0; |
| conversation | const | 308 | no | const conversation = await conversationOf(threadId); |
| conversation | const | 323 | no | const conversation = await conversationOf(threadId); |
| turn | const | 324 | no | const turn = Array.isArray(conversation.turns) ? conversation.turns.find((t) =&gt; t.key === requestId) : undefined; |
| STUDIO_BIN | const | 342 | no | const STUDIO_BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;studio.mjs&#39;); |
| traceFrame | function | 346 | no | function traceFrame({ kind, receipt, outcome, startedAt, thread }) { |
| header | const | 348 | no | const header = encodeHeader({ id: String(receipt.receiptId).slice(0, 8), rid: receipt.requestId, parent: null, src: &#39;cli&#39;, dst: &#39;chatgpt&#39;, kind, thread: String(thread ?? receipt.thread?.after ?? &#39;-&#39;)… |
| footer | const | 355 | no | const footer = encodeFooter({ status: receipt.effect === &#39;OK&#39; ? &#39;ok&#39; : receipt.effect === &#39;BUDGET_EXHAUSTED&#39; ? &#39;partial&#39; : receipt.effect === &#39;UNCERTAIN&#39; ? &#39;uncertain&#39; : receipt.effect === &#39;DENIED&#39; \|… |
| runChannelCommand | function | 374 | no | function runChannelCommand(ctx, sub, flags) { |
| store | const | 376 | no | const store = createFileStore({ dataDir: paths.root }); |
| site | const | 377 | no | const site = typeof flags.site === &#39;string&#39; &amp;&amp; flags.site.length ? flags.site : &#39;chatgpt&#39;; |
| transport | const | 378 | no | const transport = channelTransportFor(site, settings); |
| channel | const | 379 | no | const channel = createChatChannel({ transport, store, now: () =&gt; new Date(), // Trace goes to stderr so --json keeps stdout machine-readable. |
| channelTransportFor | function | 396 | no | function channelTransportFor(site, settings) { |
| runAsk | function | 407 | no | function runAsk(channel, flags, out, site) { |
| thread | const | 408 | no | const thread = flags.thread; |
| promptFile | const | 410 | no | const promptFile = flags[&#39;prompt-file&#39;]; |
| prompt | variable | 412 | no | let prompt; |
| requestId | variable | 418 | no | let requestId = flags[&#39;request-id&#39;]; |
| taskId | const | 426 | no | const taskId = sha256(&#39;ask-task:&#39; + requestId); |
| startedAt | const | 427 | no | const startedAt = Date.now(); |
| timeoutMs | const | 429 | no | const timeoutMs = Number.isFinite(flags.timeout) ? Math.max(1000, flags.timeout * 1000) : 90000; |
| runWork | function | 445 | no | function runWork(channel, flags, out, site) { |
| taskFile | const | 446 | no | const taskFile = flags[&#39;task-file&#39;]; |
| task | variable | 448 | no | let task; |
| taskId | const | 454 | no | const taskId = typeof task.taskId === &#39;string&#39; &amp;&amp; task.taskId.length ? task.taskId : task.id; |
| prompt | const | 456 | no | const prompt = typeof task.problem === &#39;string&#39; ? task.problem : typeof task.prompt === &#39;string&#39; ? task.prompt : &#39;&#39;; |
| actor | const | 457 | no | const actor = isPlainObject(task.actor) ? task.actor : { kind: &#39;agent&#39;, id: &#39;cli&#39; }; |
| scopes | const | 459 | no | const scopes = Array.isArray(task.scopes) ? task.scopes : (typeof task.scope === &#39;string&#39; ? [task.scope] : []); |
| delegateScope | const | 460 | no | const delegateScope = `${site}.delegate`; |
| scope | const | 461 | no | const scope = scopes.includes(delegateScope) ? delegateScope : (scopes.length ? scopes[0] : `${site}.send`); |
| threadRaw | const | 462 | no | const threadRaw = task.thread; |
| thread | const | 463 | no | const thread = threadRaw === &#39;new&#39; ? &#39;new&#39; : undefined; |
| taskThread | const | 464 | no | const taskThread = typeof threadRaw === &#39;string&#39; &amp;&amp; threadRaw !== &#39;new&#39; ? threadRaw : undefined; |
| deadlineMs | variable | 466 | no | let deadlineMs = task.deadlineMs; |
| parsed | const | 468 | no | const parsed = Date.parse(task.deadline); |
| requestId | variable | 471 | no | let requestId = task.requestId; |
| runRevoke | function | 481 | no | function runRevoke(store, flags, out) { |
| taskId | const | 482 | no | const taskId = flags.task; |
| isPlainObject | function | 488 | no | function isPlainObject(value) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| node:child_process | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ../lib/registry.mjs | import | 7 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 8 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/config.mjs | import | 9 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/studio/conversation-api.mjs | import | 10 | [studio/src/studio/conversation-api.mjs](../../src/studio/conversation-api.mjs.md) |
| ../../src/studio/chat-channel.mjs | import | 11 | [studio/src/studio/chat-channel.mjs](../../src/studio/chat-channel.mjs.md) |
| ../../src/studio/message-index.mjs | import | 12 | [studio/src/studio/message-index.mjs](../../src/studio/message-index.mjs.md) |
| ../../src/studio/drive-output.mjs | import | 13 | [studio/src/studio/drive-output.mjs](../../src/studio/drive-output.mjs.md) |
| ../../src/studio/channels/gemini.mjs | import | 14 | [studio/src/studio/channels/gemini.mjs](../../src/studio/channels/gemini.mjs.md) |
| ../../src/studio/channels/claude.mjs | import | 15 | [studio/src/studio/channels/claude.mjs](../../src/studio/channels/claude.mjs.md) |
| ../../src/chrome/launch.mjs | import | 16 | [studio/src/chrome/launch.mjs](../../src/chrome/launch.mjs.md) |
| ../lib/dev-auto-approve.mjs | import | 17 | [studio/bin/lib/dev-auto-approve.mjs](../lib/dev-auto-approve.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/chat.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 516 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
