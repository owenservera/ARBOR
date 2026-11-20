# File: studio/src/studio/channels/gemini.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/channels/gemini.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 46120 B |
| Lines | 858 |
| Hash | 3a664e79655f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SITE | const | 27 | yes | export const SITE = &#39;gemini&#39;; |
| SCOPES | const | 30 | yes | export const SCOPES = Object.freeze({ draft: &#39;gemini.draft&#39;, send: &#39;gemini.send&#39;, delegate: &#39;gemini.delegate&#39;, }); |
| REASON | const | 37 | yes | export const REASON = Object.freeze({ BROWSER_UNAVAILABLE: &#39;BROWSER_UNAVAILABLE&#39;, DRIVE_LEASE_BUSY: &#39;DRIVE_LEASE_BUSY&#39;, AUTH_WALL: &#39;AUTH_WALL&#39;, AUTH_UNKNOWN: &#39;AUTH_UNKNOWN&#39;, |
| LIVE_TAB | const | 58 | yes | export const LIVE_TAB = &#39;gemini-live-tab&#39;; |
| REF_DENIED | const | 60 | no | const REF_DENIED = &#39;CHANNEL_DENIED&#39;; |
| REF_REVOKED | const | 61 | no | const REF_REVOKED = &#39;CHANNEL_REVOKED&#39;; |
| REF_BUDGET | const | 62 | no | const REF_BUDGET = &#39;CHANNEL_BUDGET_EXHAUSTED&#39;; |
| REF_UNCERTAIN | const | 63 | no | const REF_UNCERTAIN = &#39;CHANNEL_UNCERTAIN&#39;; |
| REF_THREAD | const | 64 | no | const REF_THREAD = &#39;CHANNEL_THREAD_FORBIDDEN&#39;; |
| MIN_TURNS | const | 65 | no | const MIN_TURNS = 1; |
| MAX_TURNS | const | 66 | no | const MAX_TURNS = 20; |
| DEFAULT_TIMEOUT_MS | const | 67 | no | const DEFAULT_TIMEOUT_MS = 90000; |
| sha256 | function | 69 | yes | export function sha256(text) { return createHash(&#39;sha256&#39;).update(String(text ?? &#39;&#39;), &#39;utf8&#39;).digest(&#39;hex&#39;); } |
| digest | function | 70 | no | function digest(text) { return &#39;sha256:&#39; + sha256(text); } |
| receiptIdOf | function | 71 | no | function receiptIdOf(requestId) { return sha256(&#39;channel-receipt/v1:&#39; + requestId); } |
| asText | function | 72 | no | function asText(value) { return value === null \|\| value === undefined ? &#39;&#39; : String(value); } |
| isPlainObject | function | 73 | no | function isPlainObject(value) { return value !== null &amp;&amp; typeof value === &#39;object&#39; &amp;&amp; !Array.isArray(value); } |
| asActor | function | 74 | no | function asActor(actor) { |
| kind | const | 76 | no | const kind = [&#39;owner&#39;, &#39;agent&#39;, &#39;phone&#39;].includes(actor.kind) ? actor.kind : &#39;agent&#39;; |
| id | const | 77 | no | const id = typeof actor.id === &#39;string&#39; &amp;&amp; actor.id.length ? actor.id : &#39;unspecified&#39;; |
| NEWLINE_RUN | const | 86 | no | const NEWLINE_RUN = /\\s*\\n\\s*/g; |
| singleLine | function | 87 | yes | export function singleLine(text) { |
| EFFORT_LEVELS | const | 95 | no | const EFFORT_LEVELS = new Set([&#39;instant&#39;, &#39;medium&#39;, &#39;high&#39;]); |
| HIGH_EFFORT | const | 96 | no | const HIGH_EFFORT = /(\\bcode\\b\|coding\|implement\|debug\|algorithm\|architecture\|design\|brainstorm\|ideat\|derive\|proof\|optimi[sz]e\|refactor\|test\|analyse\|analyze\|audit\|review the\|plan\\b)/i; |
| INSTANT_SHAPE | const | 97 | no | const INSTANT_SHAPE = /^(what\|who\|when\|where\|which\|is\|are\|can\|does\|do\|list\|name\|reply with\|say\|translate\|convert)\\b/i; |
| resolveEffort | function | 98 | yes | export function resolveEffort(requested, prompt) { |
| withEffort | function | 104 | yes | export function withEffort(prompt, effort) { |
| instruction | const | 105 | no | const instruction = effort === &#39;instant&#39; |
| PROVIDER_LABEL | const | 116 | no | const PROVIDER_LABEL = /^\\s*(?:ChatGPT\|Claude\|Gemini\|DeepSeek\|Qwen\|Grok\|Z\\.ai)\\s+(?:dijo\|said\|says\|a dit\|sagte\|ha detto)\\s*:?\\s*/i; |
| stripProviderLabel | function | 117 | yes | export function stripProviderLabel(text) { |
| GEMINI_HOSTS | const | 125 | no | const GEMINI_HOSTS = new Set([&#39;gemini.google.com&#39;]); |
| GEMINI_APP_THREAD | const | 126 | no | const GEMINI_APP_THREAD = /^\\/app\\/([0-9a-z]{8,})$/i; |
| geminiThreadId | function | 127 | yes | export function geminiThreadId(url) { |
| parsed | variable | 128 | no | let parsed; |
| isNewChatUrl | function | 135 | yes | export function isNewChatUrl(url) { |
| parsed | variable | 136 | no | let parsed; |
| DRIVE_TIMEOUT_HINT | const | 142 | no | const DRIVE_TIMEOUT_HINT = /Cannot drive\|ECONNREFUSED\|DevTools\|remote-debugging-port\|not available or not verified/i; |
| createGeminiTransport | function | 150 | yes | export function createGeminiTransport({ binPath, timeoutSeconds = 120, exec = spawnSync, lease = inspectDriveLease, port, // How long to let a cold tab hydrate before the single permitted re-query, a… |
| run | function | 155 | no | function run(args, timeoutMs) { |
| parseJson | function | 163 | no | function parseJson(result) { |
| currentThreadId | function | 169 | no | async function currentThreadId() { |
| result | const | 170 | no | const result = run([&#39;targets&#39;, &#39;--json&#39;], 30000); |
| rows | variable | 171 | no | let rows; |
| tabs | const | 174 | no | const tabs = rows.filter((row) =&gt; { try { return new URL(String(row &amp;&amp; row.url ? row.url : &#39;&#39;)).hostname === &#39;gemini.google.com&#39;; } catch { return false; } }); |
| threadId | const | 176 | no | const threadId = geminiThreadId(tab.url); |
| leaseState | variable | 199 | no | let leaseState = null; |
| remaining | const | 205 | no | const remaining = Math.max(5, Math.min(timeoutSeconds, Math.ceil((deadline.getTime() - Date.now()) / 1000))); |
| args | const | 206 | no | const args = [&#39;drive&#39;, SITE, &#39;--prompt&#39;, prompt, &#39;--timeout&#39;, String(remaining), &#39;--no-record&#39;, &#39;--json&#39;]; |
| current | const | 213 | no | const current = await currentThreadId(); |
| dispatchOnce | function | 224 | no | const dispatchOnce = async () =&gt; { |
| result | variable | 225 | no | let result; |
| stderr | const | 237 | no | const stderr = String(result &amp;&amp; result.stderr ? result.stderr : &#39;&#39;); |
| parsed | const | 238 | no | const parsed = parseJson(result); |
| authWall | const | 249 | no | const authWall = isPlainObject(parsed.authWall) ? parsed.authWall : null; |
| errors | const | 259 | no | const errors = Array.isArray(parsed.errors) ? parsed.errors.map(String) : []; |
| reason | const | 260 | no | const reason = String(parsed.reason ?? &#39;&#39;); |
| mapped | const | 290 | no | const mapped = /timeout/i.test(reason) ? REASON.REPLY_TIMEOUT |
| state | const | 294 | no | const state = parsed.uncertain === true \|\| mapped === REASON.REPLY_TIMEOUT ? &#39;unknown&#39; : &#39;not-sent&#39;; |
| reply | const | 298 | no | const reply = stripProviderLabel(typeof parsed.reply === &#39;string&#39; ? parsed.reply : &#39;&#39;); |
| pinned | const | 306 | no | const pinned = await currentThreadId(); |
| outcome | variable | 320 | no | let outcome = null; |
| attempts | variable | 321 | no | let attempts = 0; |
| cold | const | 325 | no | const cold = outcome &amp;&amp; outcome.effect === &#39;FAILED&#39; &amp;&amp; outcome.reason === REASON.COMPOSER_UNREADABLE; |
| submissions | const | 329 | no | const submissions = outcome &amp;&amp; outcome.effect === &#39;OK&#39; ? 1 : 0; |
| firstLine | function | 336 | no | function firstLine(text) { |
| line | const | 337 | no | const line = String(text ?? &#39;&#39;).split(&#39;\\n&#39;).map((s) =&gt; s.trim()).filter(Boolean)[0] ?? &#39;&#39;; |
| sentMethod | function | 341 | no | function sentMethod(stderr) { |
| composerEvidence | function | 347 | no | function composerEvidence(stderr) { |
| text | const | 348 | no | const text = String(stderr ?? &#39;&#39;); |
| SPLICED | const | 356 | no | const SPLICED = /\\p{Ll}\\p{Lu}/u; |
| looksSpliced | function | 357 | yes | export function looksSpliced(text) { |
| ID_SAFE | const | 369 | no | const ID_SAFE = /^[A-Za-z0-9._-]+$/; |
| safeName | function | 370 | no | function safeName(value, what) { |
| createFileStore | function | 377 | yes | export function createFileStore({ channelRoot } = {}) { |
| base | const | 378 | no | const base = channelRoot ?? process.env.VIVIM_CHANNEL_DIR ?? &#39;C:/VIVIM/channel&#39;; |
| receiptsDir | const | 379 | no | const receiptsDir = path.join(base, &#39;receipts&#39;); |
| revocationsDir | const | 380 | no | const revocationsDir = path.join(base, &#39;revocations&#39;); |
| outcomesDir | const | 381 | no | const outcomesDir = path.join(base, &#39;outcomes&#39;); |
| pendingDir | const | 382 | no | const pendingDir = path.join(base, &#39;pending&#39;); |
| file | function | 384 | no | const file = (dir, id) =&gt; path.join(dir, `${safeName(id, &#39;id&#39;)}.json`); |
| readJson | function | 385 | no | const readJson = (target) =&gt; { |
| writeJson | function | 389 | no | const writeJson = (target, value) =&gt; writeFileSync(target, JSON.stringify(value, null, 2) + &#39;\\n&#39;, { mode: 0o600 }); |
| OWN_SCOPES | const | 419 | no | const OWN_SCOPES = new Set(Object.values(SCOPES)); |
| receiptScope | function | 420 | no | function receiptScope(scope) { |
| text | const | 421 | no | const text = typeof scope === &#39;string&#39; ? scope : &#39;&#39;; |
| receiptOf | function | 425 | no | function receiptOf({ requestId, taskId, actor, scope, thread, effect, promptDigest, replyDigest, journalKey, journalPath, turns, refusals, createdAt }) { |
| carriedScope | const | 426 | no | const carriedScope = receiptScope(scope); |
| createGeminiChannel | function | 446 | yes | export function createGeminiChannel({ transport, store, verify, now = () =&gt; new Date(), log } = {}) { |
| stored | const | 460 | no | const stored = await store.get(receipt.requestId); |
| run | function | 464 | no | async function run(input = {}) { |
| requestId | const | 465 | no | const requestId = input.requestId; |
| rawPrompt | const | 468 | no | const rawPrompt = typeof input.prompt === &#39;string&#39; ? input.prompt : &#39;&#39;; |
| promptDigest | const | 469 | no | const promptDigest = digest(rawPrompt); |
| existing | const | 473 | no | const existing = await store.get(requestId); |
| denial | const | 478 | no | const denial = receiptOf({ requestId, taskId: input.taskId ?? null, actor: asActor(input.actor), scope: typeof input.scope === &#39;string&#39; &amp;&amp; input.scope.length ? input.scope : SCOPES.send, thread: { be… |
| cached | const | 493 | no | const cached = typeof store.getOutcome === &#39;function&#39; ? await store.getOutcome(requestId) : null; |
| scope | const | 504 | no | const scope = typeof input.scope === &#39;string&#39; &amp;&amp; input.scope.length ? input.scope : SCOPES.send; |
| taskId | const | 505 | no | const taskId = input.taskId ?? null; |
| actor | const | 506 | no | const actor = asActor(input.actor); |
| effort | const | 507 | no | const effort = resolveEffort(input.effort, rawPrompt); |
| createdAt | const | 508 | no | const createdAt = now().toISOString(); |
| budgetMs | const | 509 | no | const budgetMs = Number.isFinite(input.timeoutMs) ? input.timeoutMs |
| deadline | const | 511 | no | const deadline = new Date(now().getTime() + budgetMs); |
| refuse | function | 513 | no | async function refuse({ effect, refusal, thread, reason, scopes }) { |
| receipt | const | 514 | no | const receipt = receiptOf({ requestId, taskId, actor, scope: scopes === null ? null : scope, thread: thread ?? { before: &#39;&#39;, after: &#39;&#39; }, effect, promptDigest, replyDigest: null, journalKey: requestI… |
| turnsLimit | variable | 533 | no | let turnsLimit = 1; |
| open | const | 542 | no | const open = []; |
| flat | const | 546 | no | const flat = input.rawNewlines === true ? rawPrompt : singleLine(rawPrompt); |
| prompt | const | 549 | no | const prompt = withEffort(flat, effort); |
| before | variable | 550 | no | let before = &#39;&#39;; |
| after | variable | 551 | no | let after = &#39;&#39;; |
| threadId | variable | 552 | no | let threadId; |
| newThread | variable | 553 | no | let newThread = false; |
| created | variable | 556 | no | let created; |
| taskThread | const | 569 | no | const taskThread = input.taskThread ?? (isPlainObject(input.task) ? input.task.thread : undefined); |
| assertedByModel | const | 585 | no | const assertedByModel = []; |
| turns | const | 586 | no | const turns = []; |
| refusals | const | 587 | no | const refusals = []; |
| effect | variable | 588 | no | let effect = null; |
| journalKey | variable | 589 | no | let journalKey = null; |
| journalPath | variable | 590 | no | let journalPath = null; |
| replyText | variable | 591 | no | let replyText = &#39;&#39;; |
| solution | variable | 592 | no | let solution = null; |
| sendState | variable | 593 | no | let sendState = { state: &#39;not-sent&#39; }; |
| startedAt | const | 610 | no | const startedAt = now().toISOString(); |
| result | variable | 611 | no | let result; |
| detail | const | 648 | no | const detail = asText(result.detail) \|\| asText(result.reason) \|\| &#39;no reason given&#39;; |
| turnReply | const | 653 | no | const turnReply = typeof result.reply === &#39;string&#39; ? result.reply : &#39;&#39;; |
| turnJournalKey | const | 670 | no | const turnJournalKey = typeof result.journalKey === &#39;string&#39; &amp;&amp; result.journalKey.length ? result.journalKey : requestId; |
| verifiedLocally | variable | 710 | no | let verifiedLocally = []; |
| verdicts | const | 712 | no | const verdicts = await verify(assertedByModel); |
| receipt | const | 718 | no | const receipt = receiptOf({ requestId, taskId, actor, scope, thread: { before, after }, effect, promptDigest, replyDigest: replyText.length ? digest(replyText) : null, journalKey: journalKey ?? reque… |
| evidenceState | const | 723 | no | const evidenceState = verifiedLocally.length ? &#39;VERIFIED&#39; : (replyText.length ? &#39;OBSERVED&#39; : &#39;CLAIMED&#39;); |
| outcome | const | 724 | no | const outcome = { |
| parseFlags | function | 750 | no | function parseFlags(argv) { |
| flags | const | 751 | no | const flags = {}; |
| arg | const | 753 | no | const arg = argv[i]; |
| name | const | 755 | no | const name = arg.slice(2); |
| next | const | 756 | no | const next = argv[i + 1]; |
| renderAskResult | function | 771 | yes | export function renderAskResult(receipt, outcome = {}, { thread = null } = {}) { |
| effect | const | 772 | no | const effect = receipt &amp;&amp; receipt.effect; |
| effort | const | 773 | no | const effort = outcome &amp;&amp; outcome.effort; |
| main | function | 785 | no | async function main(argv) { |
| flags | const | 793 | no | const flags = parseFlags(rest); |
| store | const | 794 | no | const store = createFileStore({ channelRoot: flags[&#39;channel-dir&#39;] }); |
| transport | const | 795 | no | const transport = createGeminiTransport({ binPath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;, &#39;bin&#39;, &#39;studio.mjs&#39;), timeoutSeconds: Number.isFinite(Number(flags.time… |
| threadId | const | 802 | no | const threadId = await transport.currentThreadId(); |
| prompt | variable | 812 | no | let prompt; |
| rawNewlines | const | 815 | no | const rawNewlines = flags[&#39;raw-newlines&#39;] === true; |
| requestId | const | 821 | no | const requestId = typeof flags[&#39;request-id&#39;] === &#39;string&#39; &amp;&amp; flags[&#39;request-id&#39;].length |
| channel | const | 824 | no | const channel = createGeminiChannel({ transport, store, now: () =&gt; new Date(), log: (message) =&gt; { try { process.stderr.write(`[gemini-channel] ${message}\\n`); } catch { /* trace is best effort */ } … |
| rendered | const | 842 | no | const rendered = renderAskResult(receipt, outcome, { thread: flags.thread }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 20 | external |
| node:crypto | import | 21 | external |
| node:fs | import | 22 | external |
| node:path | import | 23 | external |
| node:url | import | 24 | external |
| ../../capture/drive-lease.mjs | import | 25 | [studio/src/capture/drive-lease.mjs](../../capture/drive-lease.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/chat.mjs](../../../bin/commands/chat.mjs.md) | ../../src/studio/channels/gemini.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Gemini channel: gemini.* scopes over an injected transport; the site rides on the scope. |
| 3 | owner | gemini-channel | — | gemini-channel |
| 4 | task | — | — | gemini-channel |
| 5 | see | — | docs/chatgpt-channel/CONTRACT.md | docs/chatgpt-channel/CONTRACT.md |
| 6 | see | — | src/studio/chat-channel.mjs | src/studio/chat-channel.mjs |
| 7 | invariant | — | — | transport is the only way out; no browser, CDP socket, tab or cookie store is opened here. |
| 8 | invariant | — | — | one send per requestId; a replay returns the original receipt and calls no transport. |
| 9 | invariant | — | — | UNCERTAIN is terminal for the turn: recorded, never retried, never turned into a reply. |
| 10 | why | — | — | Gemini does not ride chat-channel.mjs today: this file carries its own copy of the policy |
| 11 | why | its own receipt builder, turn loop and store | — | instead of being a transport like |
| 12 | why | — | — | channels/claude.mjs. The shared core already accepts gemini.* scopes, so the gap is not |
| 13 | why | — | — | the scope table: it is that every shared invariant has to be re-stated here, and one |
| 14 | why | an empty reply is not a delivered turn | — | was missing until this file was checked. |

## Excerpt

```javascript
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
```

_First 80 of 859 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
