# File: studio/src/capture/conversation-browser-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-browser-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 55304 B |
| Lines | 780 |
| Hash | 36ae34ca837e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| norm | function | 12 | no | const norm = (s) =&gt; String(s ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| problem | function | 13 | no | const problem = (code) =&gt; Object.assign(new Error(code), { code, status: 409 }); |
| digest | function | 14 | no | const digest = (text) =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| HUMAN_TYPE_MAX_CHARS | const | 21 | no | const HUMAN_TYPE_MAX_CHARS = 400; |
| typeOptions | function | 22 | no | const typeOptions = (prompt) =&gt; ({ human: true, chunked: String(prompt ?? &#39;&#39;).length &gt; HUMAN_TYPE_MAX_CHARS }); |
| canon | function | 30 | no | const canon = (s) =&gt; s.replace(/\\r\\n/g, &#39;\\n&#39;).replace(/[\\u00A0\\u202F\\u2007]/g, &#39; &#39;).replace(/[\\u200B-\\u200D\\u2060\\uFEFF]/g, &#39;&#39;) |
| readbackMatches | function | 32 | no | const readbackMatches = (readback, prompt) =&gt; { |
| want | const | 34 | no | const want = canon(prompt), got = canon(readback); |
| TYPING_READBACK_ATTEMPTS | const | 45 | no | const TYPING_READBACK_ATTEMPTS = 3; |
| TYPING_READBACK_DELAY_MS | const | 46 | no | const TYPING_READBACK_DELAY_MS = 250; |
| settleTypingReadback | function | 47 | no | const settleTypingReadback = async (read, prompt) =&gt; { |
| after | const | 50 | no | const after = await read(); |
| transcriptArgs | function | 55 | no | const transcriptArgs = (adapter) =&gt; { const s = transcriptSpec(adapter); |
| readTurnPage | function | 57 | yes | export const readTurnPage = (page, adapter) =&gt; evaluate(page, turnObservationExpression(adapter)); |
| readPrefixPage | function | 60 | yes | export const readPrefixPage = (page, adapter) =&gt; evaluate(page, transcriptExpression({ ...transcriptArgs(adapter), composerSelectors: adapter?.composer?.selectors ?? [], streamingSelectors: adapter?.… |
| turnCursor | function | 65 | yes | export function turnCursor(messages, streamSequence) { |
| list | const | 66 | no | const list = Array.isArray(messages) ? messages : []; |
| count | function | 67 | no | const count = (role) =&gt; list.filter((m) =&gt; m?.role === role).length; |
| readUserTurns | function | 78 | yes | export async function readUserTurns(page) { |
| sels | const | 80 | no | const sels = &#39;[data-message-author-role=&quot;user&quot;],[data-content-search-unit-key$=&quot;user&quot;],[data-chatgpt-search-unit-key$=&quot;user&quot;],[data-testid=&quot;user-message&quot;]&#39;; |
| nodes | const | 81 | no | const nodes = [...document.querySelectorAll(sels)].filter(el =&gt; { const r = el.getBoundingClientRect(); return r.width &gt; 1 &amp;&amp; r.height &gt; 1; }); |
| r | const | 82 | no | const r = el.getBoundingClientRect(); return r.width &gt; 1 &amp;&amp; r.height &gt; 1; |
| createConversationBrowserAdapter | function | 89 | yes | export function createConversationBrowserAdapter({ paths, profileStore, familyStore, port, siteAdapter, targetId, freshTab, conversationId, ownerToken, maxBytes = 0, dependencies = {} } = {}) { |
| d | const | 95 | no | const d = { listTargets, listSessions, Recorder, CdpConnection, browserWsUrl, fetch: globalThis.fetch, evaluate, findComposer, focusComposer, clearComposer, |
| recorder | variable | 101 | no | let recorder, binding, pending, stopResult, tap, idlePage, idleConn, connectHooks; |
| attempts | const | 102 | no | const attempts = new Map(); |
| mayOwnResources | variable | 103 | no | let mayOwnResources = false; |
| submissionStopped | variable | 104 | no | let submissionStopped = false, connectAborted = false, finalized = false, createdTargetId = null, tabRequested = false; |
| waiting | const | 105 | no | const waiting = new AbortController(); |
| bounded | function | 108 | no | function bounded(run, ms, code) { |
| controller | const | 109 | no | const controller = new AbortController(); let timer; |
| timeout | const | 110 | no | const timeout = new Promise((_, reject) =&gt; { timer = setTimeout(() =&gt; { controller.abort(); reject(problem(code)); }, ms); }); |
| httpFetch | function | 113 | no | const httpFetch = (url, init) =&gt; bounded((signal) =&gt; d.fetch(url, { ...init, signal }), d.fetchTimeoutMs, &#39;BROWSER_HTTP_TIMEOUT&#39;); |
| closeCreatedTab | function | 114 | no | async function closeCreatedTab(targetId) { |
| response | const | 115 | no | const response = await httpFetch(`http://127.0.0.1:${port}/json/close/${encodeURIComponent(targetId)}`); |
| threadMatches | function | 119 | no | const threadMatches = (url) =&gt; !binding.thread \|\| sameThread(parseThread(siteAdapter.id, url), binding.thread); |
| originOf | function | 122 | no | const originOf = (url) =&gt; { try { return new URL(url).origin; } catch { return null; } }; |
| livePage | function | 123 | no | const livePage = () =&gt; recorder?.page ?? idlePage; |
| pageThreadMatches | function | 124 | no | async function pageThreadMatches() { |
| openIdlePage | function | 130 | no | async function openIdlePage(targetId) { |
| ws | const | 138 | no | const ws = await d.browserWsUrl({ port }); |
| creationLocation | function | 146 | no | async function creationLocation() { |
| page | const | 147 | no | const page = livePage(); |
| target | const | 148 | no | const target = (await d.listTargets({ port })).find((t) =&gt; t.id === binding.targetId); |
| parsed | variable | 150 | no | let parsed; try { parsed = new URL(target.url); } catch { throw problem(&#39;BINDING_CHANGED&#39;); } |
| pathname | const | 152 | no | const pathname = String(await d.evaluate(page, &#39;location.pathname&#39;) ?? &#39;&#39;); |
| requireRecording | function | 156 | no | function requireRecording() { |
| clearOwnText | function | 162 | no | async function clearOwnText() { |
| page | const | 163 | no | const page = livePage(); |
| focus | const | 166 | no | const focus = await d.focusComposer(page, siteAdapter); |
| cleared | const | 168 | no | const cleared = await d.clearComposer(page); |
| reclaimResidue | function | 173 | no | async function reclaimResidue(draftText) { |
| mine | variable | 175 | no | let mine = false; |
| cleanupTypedFailure | function | 183 | no | async function cleanupTypedFailure(prompt) { |
| page | const | 186 | no | const page = await d.readTurnPage(livePage(), siteAdapter); |
| text | const | 190 | no | const text = page?.draft?.text; |
| ledgerTyped | function | 195 | no | const ledgerTyped = (prompt) =&gt; { try { d.recordTypedPrompt(paths?.root, prompt); } catch { /* ledger is best-effort protection */ } }; |
| readiness | function | 197 | no | async function readiness(end) { |
| blocked | function | 202 | no | const blocked = (reason, draft = { present: null, chars: null }, diagnostic = null) =&gt; |
| lastReason | variable | 204 | no | let lastReason = null; // Reset every tick: an earlier sample must never become the timeout verdict. |
| residueTries | variable | 205 | no | let residueTries = 0; |
| target | const | 208 | no | const target = (await d.listTargets({ port })).find((t) =&gt; t.id === binding.targetId); |
| actual | variable | 210 | no | let actual; try { actual = new URL(target.url).origin; } catch { actual = &#39;null&#39;; } |
| pageOrigin | const | 218 | no | const pageOrigin = await d.evaluate(livePage(), &#39;location.origin&#39;); |
| loc | variable | 228 | no | let loc = null; |
| code | const | 231 | no | const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(e?.code ?? &#39;&#39;) ? e.code : &#39;BINDING_CHANGED&#39;; |
| targetOrigin | variable | 238 | no | let targetOrigin = null; |
| now | const | 240 | no | const now = (await d.listTargets({ port })).find((t) =&gt; t.id === binding.targetId); |
| composer | const | 251 | no | const composer = await d.findComposer(livePage(), siteAdapter); |
| auth | const | 252 | no | const auth = await d.detectAuthWall(livePage(), siteAdapter); |
| gate | const | 254 | no | const gate = await d.detectSiteFailure(livePage(), siteAdapter); |
| state | const | 257 | no | const state = await d.sendState(livePage(), siteAdapter); |
| page | const | 258 | no | const page = await d.readTurnPage(livePage(), siteAdapter); |
| composer | const | 272 | no | const composer = await d.findComposer(livePage(), siteAdapter); |
| auth | const | 273 | no | const auth = await d.detectAuthWall(livePage(), siteAdapter); |
| gate | const | 277 | no | const gate = await d.detectSiteFailure(livePage(), siteAdapter); |
| state | const | 280 | no | const state = await d.sendState(livePage(), siteAdapter); |
| draft | const | 282 | no | const draft = { present: state.draftChars &gt; 0, chars: state.draftChars }; |
| check | function | 294 | no | async function check() { |
| targets | const | 296 | no | const targets = await d.listTargets({ port }); |
| target | const | 297 | no | const target = targets.find((t) =&gt; t.id === binding.targetId); |
| targetPath | function | 304 | no | const targetPath = (() =&gt; { try { return new URL(target.url).pathname; } catch { return null; } })(); |
| pagePath | const | 305 | no | const pagePath = await d.evaluate(livePage(), &#39;location.pathname&#39;); |
| pageState | function | 310 | no | async function pageState() { |
| page | const | 313 | no | const page = await d.readTurnPage(recorder.page, siteAdapter); |
| idleControls | function | 320 | no | const idleControls = (c) =&gt; c?.observed === true &amp;&amp; [&#39;idle&#39;, &#39;terminal&#39;].includes(c.state) |
| freshComposerReady | function | 325 | no | const freshComposerReady = (page) =&gt; page?.controls?.composerEnabled === true |
| samePrefix | function | 328 | no | const samePrefix = (page, saved) =&gt; saved.baseline.every((m, i) =&gt; page.messages[i]?.id === m.id &amp;&amp; page.messages[i]?.role === m.role &amp;&amp; page.messages[i]?.text === m.text); |
| persist | function | 330 | no | const persist = (record) =&gt; recorder.recordConversationObservation({ ...record, binding: structuredClone(binding) }); |
| observation | function | 331 | no | async function observation(args) { |
| page | const | 332 | no | const page = await pageState(), saved = attempts.get(args.turnId); |
| user | const | 334 | no | const user = page.messages[saved.baseline.length]; |
| sequence | const | 338 | no | const sequence = persist({ source: &#39;page&#39;, kind: &#39;new-user-turn&#39;, identity: user.id, turnId: saved.turnId, payloadDigest: saved.payloadDigest, text: user.text, baselineSequence: saved.boundary.sequen… |
| sampleReply | function | 344 | no | function sampleReply(saved, message, controls) { |
| contentDigest | const | 345 | no | const contentDigest = digest(message.text), prior = saved.reply; |
| revision | const | 347 | no | const revision = prior ? prior.revision + (prior.contentDigest !== contentDigest ? 1 : 0) : 1; |
| metadata | const | 348 | no | const metadata = { identity: message.id, revision, contentDigest, chars: message.text.length }; |
| sequence | const | 349 | no | const sequence = persist({ source: &#39;page&#39;, kind: &#39;reply-sample&#39;, turnId: saved.turnId, payloadDigest: saved.payloadDigest, ...metadata, text: message.text, controls }); |
| evidence | const | 351 | no | const evidence = { turnId: saved.turnId, payloadDigest: saved.payloadDigest, sessionId: recorder.session.id, |
| auditReplies | function | 358 | no | function auditReplies(page) { |
| updates | const | 359 | no | const updates = []; |
| message | const | 362 | no | const message = page.messages.find((m) =&gt; m.id === saved.reply.identity &amp;&amp; m.role === &#39;assistant&#39;); |
| effectPreflight | function | 368 | no | async function effectPreflight(saved, beforeEffect, empty) { |
| page | const | 370 | no | const page = await pageState(), priorReplies = auditReplies(page); |
| trailing | function | 374 | no | const trailing = (t) =&gt; canon(String(t)).replace(/\\n$/, &#39;&#39;); |
| connectSteps | function | 380 | no | async function connectSteps(initial, hooks, startedAt) { |
| aborted | function | 381 | no | const aborted = () =&gt; { if (connectAborted) throw problem(&#39;CONNECT_ABORTED&#39;); }; |
| response | const | 385 | no | const response = await httpFetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: &#39;PUT&#39; }); |
| target | const | 387 | no | const target = await bounded(() =&gt; response.json(), d.fetchTimeoutMs, &#39;BROWSER_HTTP_TIMEOUT&#39;); |
| target | const | 393 | no | const target = (await d.listTargets({ port })).find((t) =&gt; t.id === targetId); |
| profile | variable | 400 | no | let profile = siteAdapter.id; |
| ready | const | 412 | no | const ready = await readiness(startedAt + d.readinessTimeoutMs); |
| captureProfile | variable | 416 | no | let captureProfile = siteAdapter.id; |
| armCapture | function | 417 | no | async function armCapture() { |
| mine | const | 424 | no | const mine = recorder; |
| run | const | 425 | no | const run = recorder.start({ target: binding.targetId, exactTarget: true, profile: captureProfile, label: siteAdapter.id, follow: false, owner: { conversationId, pid: process.pid, token: ownerToken, … |
| timer | variable | 429 | no | let timer; |
| timeout | const | 430 | no | const timeout = new Promise((_, reject) =&gt; { timer = setTimeout(() =&gt; reject(problem(&#39;CONNECT_TIMEOUT&#39;)), d.readinessTimeoutMs + d.connectGraceMs); }); |
| stopRecorder | function | 437 | no | async function stopRecorder(reason) { |
| stopCapture | function | 452 | no | async function stopCapture() { |
| stopTurnCapture | function | 459 | no | async function stopTurnCapture() { |
| stopped | const | 461 | no | const stopped = await stopRecorder(&#39;conversation_turn&#39;); |
| targetCheck | function | 474 | no | const targetCheck = async () =&gt; { |
| targets | variable | 475 | no | let targets; |
| selected | const | 478 | no | const selected = targets.filter((t) =&gt; t.id === requested); |
| target | const | 480 | no | const target = selected[0]; |
| url | variable | 482 | no | let url; try { url = new URL(target.url); } catch { throw problem(&#39;PREFIX_TARGET_ORIGIN_MISMATCH&#39;); } |
| thread | const | 484 | no | const thread = parseThread(siteAdapter.id, target.url); |
| thread | const | 492 | no | const thread = await targetCheck(); |
| result | variable | 493 | no | let result; |
| startedAt | const | 508 | no | const startedAt = Date.now(), run = connectSteps(initial, hooks, startedAt); let timer; |
| timeout | const | 509 | no | const timeout = new Promise((_, reject) =&gt; { timer = setTimeout(() =&gt; { connectAborted = true; reject(problem(&#39;CONNECT_TIMEOUT&#39;)); }, d.readinessTimeoutMs + d.connectGraceMs); }); |
| loc | const | 517 | no | const loc = await creationLocation(); |
| saved | const | 523 | no | const saved = attempts.get(fromId); |
| turns | const | 533 | no | const turns = await recorder.domTurns(); |
| count | function | 534 | no | const count = (role) =&gt; turns.filter((t) =&gt; t?.role === role).length; |
| result | const | 543 | no | const result = await readiness(Date.now() + d.checkAgainTimeoutMs); |
| loc | const | 551 | no | const loc = await creationLocation(); |
| composer | const | 554 | no | const composer = await d.findComposer(recorder.page, siteAdapter); |
| state | variable | 558 | no | let state = await d.sendState(recorder.page, siteAdapter); |
| page | variable | 560 | no | let page = await d.readTurnPage(recorder.page, siteAdapter); |
| boundary | const | 573 | no | const boundary = { sessionId: recorder.session.id, sequence: recorder.session.raw.seq, transcriptCount: 0 }; |
| composer | const | 581 | no | const composer = await d.findComposer(recorder.page, siteAdapter); |
| state | const | 585 | no | const state = await d.sendState(recorder.page, siteAdapter); |
| page | const | 587 | no | const page = await pageState(), priorReplies = auditReplies(page); |
| invalidatedTurnIds | const | 588 | no | const invalidatedTurnIds = priorTurns.filter((t) =&gt; t.reply.state === &#39;observed&#39; &amp;&amp; (!attempts.has(t.id) \|\| attempts.get(t.id)?.reply?.sessionId !== recorder.session.id)).filter((t) =&gt; { const r = t.… |
| r | const | 589 | no | const r = t.reply.evidence, message = page.messages.find((m) =&gt; m.id === r.identity &amp;&amp; m.role === &#39;assistant&#39;); |
| missing | const | 598 | no | const missing = priorTurns.filter((t) =&gt; t.delivery?.state === &#39;observed&#39; &amp;&amp; t.delivery.evidence?.kind === &#39;new-user-turn&#39; &amp;&amp; !page.messages.some((m) =&gt; m.id === t.delivery.evidence.identity &amp;&amp; m.rol… |
| boundary | const | 604 | no | const boundary = { sessionId: recorder.session.id, sequence: recorder.session.raw.seq, transcriptCount: page.messages.length }; |
| user | const | 606 | no | const user = page.messages[0], assistant = page.messages[1]; |
| prefixAudit | const | 607 | no | const prefixAudit = prefix ? (!user \|\| user.role !== &#39;user&#39; \|\| user.id !== prefix.userMessageId \|\| digest(user.text) !== prefix.userMessageDigest ? { ok: false, reason: &#39;PREFIX_USER_MESSAGE_MISSING&#39; … |
| guard | function | 620 | no | const guard = async () =&gt; { |
| loc | const | 621 | no | const loc = await creationLocation(); |
| focus | const | 626 | no | const focus = await d.focusComposer(recorder.page, siteAdapter); |
| state | variable | 628 | no | let state = await d.sendState(recorder.page, siteAdapter); |
| page | const | 630 | no | const page = await d.readTurnPage(recorder.page, siteAdapter); |
| saved | const | 634 | no | const saved = { ...pending, turnId, prompt, payloadDigest: digest(prompt), samples: [], creation: true }; |
| typed | const | 639 | no | const typed = await d.typeText(recorder.page, prompt, { ...typeOptions(prompt), beforeInsert: async () =&gt; { await guard(); beforeEffect?.(); } }); |
| after | const | 641 | no | const after = await settleTypingReadback(async () =&gt; { const page = await d.readTurnPage(recorder.page, siteAdapter); if (parseThread(siteAdapter.id, `${binding.origin}${page?.pathname ?? &#39;&#39;}`)) thro… |
| page | const | 642 | no | const page = await d.readTurnPage(recorder.page, siteAdapter); |
| focus | const | 652 | no | const focus = await d.focusComposer(recorder.page, siteAdapter); |
| state | const | 654 | no | const state = await d.sendState(recorder.page, siteAdapter); |
| saved | const | 656 | no | const saved = { ...pending, turnId, prompt, payloadDigest: digest(prompt), samples: [] }; |
| typed | const | 661 | no | const typed = await d.typeText(recorder.page, prompt, { ...typeOptions(prompt), beforeInsert: () =&gt; effectPreflight(saved, beforeEffect, true) }); |
| saved | const | 671 | no | const saved = attempts.get(args.turnId); |
| guard | function | 675 | no | const guard = async () =&gt; { |
| loc | const | 676 | no | const loc = await creationLocation(); |
| result | const | 679 | no | const result = await d.sendMessage(recorder.page, siteAdapter, { canDispatch: () =&gt; !submissionStopped, beforeDispatch: async () =&gt; { await guard(); args.beforeEffect?.(); } }); |
| loc | variable | 687 | no | let loc = await creationLocation(); |
| result | const | 694 | no | const result = await d.sendMessage(recorder.page, siteAdapter, { canDispatch: () =&gt; !submissionStopped, beforeDispatch: () =&gt; effectPreflight(saved, args.beforeEffect, false) }); |
| saved | const | 712 | no | const saved = attempts.get(args.turnId); |
| page | const | 719 | no | const page = await pageState(), index = page.messages.findIndex((m) =&gt; m.id === saved.outgoing.identity &amp;&amp; m.role === &#39;user&#39;); |
| candidate | const | 723 | no | const candidate = index &lt; 0 ? null : page.messages[index + 1]; |
| update | const | 725 | no | const update = sampleReply(saved, candidate, page.controls); |
| stamp | const | 726 | no | const stamp = d.now(), contentDigest = update.evidence.contentDigest; |
| idle | const | 727 | no | const idle = idleControls(page.controls); |
| quietFor | const | 731 | no | const quietFor = saved.stable ? stamp - saved.stable.since : 0; |
| settled | const | 732 | no | const settled = saved.samples.length &gt;= 2 &amp;&amp; saved.stable?.polls &gt;= d.replySettlePolls |
| result | const | 751 | no | const result = await d.evaluate(livePage(), transcriptExpression({ ...transcriptArgs(siteAdapter), composerSelectors: siteAdapter.composer?.selectors ?? [], streamingSelectors: siteAdapter.assistant?… |
| after | const | 754 | no | const after = await check(); |
| out | const | 767 | no | const out = { captureFinalized: true, tab: &#39;none&#39;, targetId: createdTargetId }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ../cdp/discovery.mjs | import | 3 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |
| ../cdp/client.mjs | import | 4 | [studio/src/cdp/client.mjs](../cdp/client.mjs.md) |
| ../store/session.mjs | import | 5 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ./recorder.mjs | import | 6 | [studio/src/capture/recorder.mjs](./recorder.mjs.md) |
| ./actions.mjs | import | 7 | [studio/src/capture/actions.mjs](./actions.mjs.md) |
| ./typed-prompt-ledger.mjs | import | 8 | [studio/src/capture/typed-prompt-ledger.mjs](./typed-prompt-ledger.mjs.md) |
| node:timers/promises | import | 9 | external |
| ./conversation-thread.mjs | import | 10 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./conversation-browser-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Real browser seam; runtime tests inject an adapter instead. No network/body decoder here.
import { createHash } from 'node:crypto';
import { browserWsUrl, listTargets } from '../cdp/discovery.mjs';
import { CdpConnection } from '../cdp/client.mjs';
import { listSessions } from '../store/session.mjs';
import { Recorder } from './recorder.mjs';
import { evaluate, findComposer, focusComposer, clearComposer, typeText, sendMessage, sendState, readTranscript, waitForCompletion, detectAuthWall, detectSiteFailure } from './actions.mjs';
import { recordTypedPrompt, matchesTypedPrompt, isPrefixOfTyped } from './typed-prompt-ledger.mjs';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseThread, sameThread, isNewChatPath, idleControlSelectors, transcriptSpec, transcriptExpression, turnObservationExpression, boundTranscript, TRANSCRIPT_LIMITS } from './conversation-thread.mjs';

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const problem = (code) => Object.assign(new Error(code), { code, status: 409 });
const digest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
// Key-by-key typing costs ~0.1s per character and holds the one shared writer window the whole time:
// a 5,000-character prompt blocked every other AI for 10+ minutes (live fan-out, 2026-10-30). Only short
// prompts keep the human pauses; longer ones are typed at machine speed.
// A single bulk insertion is NOT an option for long prompts: rich editors (ChatGPT, Claude) rewrite
// newlines and code blocks on insertText, the strict read-back then fails (TYPING_UNCONFIRMED). So
// long prompts are inserted one line at a time (see `chunked` in human.mjs), newlines one by one.
const HUMAN_TYPE_MAX_CHARS = 400;
const typeOptions = (prompt) => ({ human: true, chunked: String(prompt ?? '').length > HUMAN_TYPE_MAX_CHARS });
// Typed-text readback contract for rich composers. A contenteditable (ProseMirror/Lexical) reports
// the trailing block break as one extra newline, so the readback may carry exactly ONE appended
// newline beyond the payload. Only the readback is normalized/trimmed; the payload is never
// altered, so a prompt that already ends in a newline still needs its own exact match first.
// Anything else — mid-payload drift, two appended newlines, a non-string readback — does not match.
// Editors also rewrite typography without changing the words: nbsp, zero-width characters and curly
// quotes. Both sides are canonicalised for those only; newlines and every other character stay exact.
const canon = (s) => s.replace(/\r\n/g, '\n').replace(/[\u00A0\u202F\u2007]/g, ' ').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
  .replace(/[\u2018\u2019\u201A\u2032]/g, "'").replace(/[\u201C\u201D\u201E\u2033]/g, '"');
const readbackMatches = (readback, prompt) => {
  if (typeof readback !== 'string' || typeof prompt !== 'string') return false;
  const want = canon(prompt), got = canon(readback);
  return got === want || got === `${want}\n`;
};
// The composer DOM settles after an insert: an immediate read of a multiline payload can report
// doubled, dropped or otherwise transient separators while the outbound text is already correct.
// Re-read a bounded number of times before refusing, well inside the per-turn envelope.
//
// Acceptance requires the freshly read PAGE DRAFT to match. The owner snapshot (`typed.typed`) is a
// single read of the same editor taken at insertion time and can be as transient as the page read,
// so it may prove the payload landed but may never substitute for the draft: a stale matching
// snapshot next to persistently drifted composer content must not authorize a send.
const TYPING_READBACK_ATTEMPTS = 3;
const TYPING_READBACK_DELAY_MS = 250;
const settleTypingReadback = async (read, prompt) => {
  for (let attempt = 0; attempt < TYPING_READBACK_ATTEMPTS; attempt++) {
    if (attempt) await sleep(TYPING_READBACK_DELAY_MS);
    const after = await read();
    if (readbackMatches(after?.draft?.text, prompt)) return after;
  }
  return null;
};
const transcriptArgs = (adapter) => { const s = transcriptSpec(adapter);
  return { userSelectors: s.user, assistantSelectors: s.assistant, textSelector: s.textSelector, idAttribute: s.idAttribute }; };
export const readTurnPage = (page, adapter) => evaluate(page, turnObservationExpression(adapter));
// Read-only observed-prefix page read: one evaluation, same shaper, reports the positive-idle
// controls alongside the transcript so idle and empty composer describe the same instant.
export const readPrefixPage = (page, adapter) => evaluate(page, transcriptExpression({ ...transcriptArgs(adapter), composerSelectors: adapter?.composer?.selectors ?? [],
  streamingSelectors: adapter?.assistant?.streamingSelectors ?? [], sendSelectors: idleControlSelectors(adapter) }));

// Pre-send per-turn cursor: what already exists on the page (count, role split, ordered ids, content
// digest) and the prior stream cursor (raw-log sequence). Metadata only; never message bodies.
export function turnCursor(messages, streamSequence) {
  const list = Array.isArray(messages) ? messages : [];
  const count = (role) => list.filter((m) => m?.role === role).length;
  return { messageCount: list.length, userCount: count('user'), assistantCount: count('assistant'),
    // JSON tuples delimit each field unambiguously; ids may contain colons/newlines.
    // Null and missing ids remain distinct from an actual string "undefined".
    idsDigest: digest(JSON.stringify(list.map((m) => [m?.role ?? null, m?.id ?? null]))),
    contentDigest: digest(JSON.stringify(list.map((m) => [m?.role ?? null, m?.id ?? null, digest(String(m?.text ?? ''))]))),
    streamSequence };
}

// Specific user-authored nodes, not generic markdown/sidebar text. Keep duplicate text: two
// identical prompts are two turns. Require the entire old prefix unchanged before attributing one.
export async function readUserTurns(page) {
  return evaluate(page, `(() => {
    const sels = '[data-message-author-role="user"],[data-content-search-unit-key$="user"],[data-chatgpt-search-unit-key$="user"],[data-testid="user-message"]';
```

_First 80 of 781 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
