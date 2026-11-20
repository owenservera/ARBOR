# File: studio/src/studio/chat-channel.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/chat-channel.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23375 B |
| Lines | 484 |
| Hash | ea4222f0328e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_SITE | const | 18 | no | const DEFAULT_SITE = &#39;chatgpt&#39;; |
| CHANNEL_SITES | const | 19 | no | const CHANNEL_SITES = new Set([&#39;chatgpt&#39;, &#39;claude&#39;, &#39;gemini&#39;, &#39;qwen&#39;, &#39;deepseek&#39;, &#39;zai&#39;, &#39;minimax&#39;, &#39;kimi&#39;]); |
| SERVED_SITES | const | 22 | no | const SERVED_SITES = new Set([&#39;chatgpt&#39;, &#39;claude&#39;, &#39;gemini&#39;]); |
| SCOPE_ACTIONS | const | 23 | no | const SCOPE_ACTIONS = new Set([&#39;draft&#39;, &#39;send&#39;, &#39;delegate&#39;]); |
| resolveScope | function | 29 | no | function resolveScope(requested) { |
| text | const | 30 | no | const text = typeof requested === &#39;string&#39; &amp;&amp; requested.length ? requested : `${DEFAULT_SITE}.send`; |
| dot | const | 31 | no | const dot = text.lastIndexOf(&#39;.&#39;); |
| site | const | 33 | no | const site = text.slice(0, dot); |
| action | const | 34 | no | const action = text.slice(dot + 1); |
| MIN_TURNS | const | 39 | no | const MIN_TURNS = 1; |
| MAX_TURNS | const | 41 | no | const MAX_TURNS = 20; |
| DEFAULT_TIMEOUT_MS | const | 42 | no | const DEFAULT_TIMEOUT_MS = 90000; |
| EFFORT_LEVELS | const | 44 | no | const EFFORT_LEVELS = new Set([&#39;instant&#39;, &#39;medium&#39;, &#39;high&#39;]); |
| HIGH_EFFORT | const | 46 | no | const HIGH_EFFORT = /(\\bcode\\b\|coding\|implement\|debug\|algorithm\|architecture\|design\|brainstorm\|ideat\|derive\|proof\|optimi[sz]e\|refactor\|test\|analyse\|analyze\|audit\|review the\|plan\\b)/i; |
| INSTANT_SHAPE | const | 48 | no | const INSTANT_SHAPE = /^(what\|who\|when\|where\|which\|is\|are\|can\|does\|do\|list\|name\|reply with\|say\|translate\|convert)\\b/i; |
| resolveEffort | function | 54 | no | function resolveEffort(requested, prompt) { |
| withEffort | function | 66 | no | function withEffort(prompt, effort) { |
| instruction | const | 67 | no | const instruction = effort === &#39;instant&#39; |
| REF_DENIED | const | 75 | no | const REF_DENIED = &#39;CHANNEL_DENIED&#39;; |
| REF_REVOKED | const | 76 | no | const REF_REVOKED = &#39;CHANNEL_REVOKED&#39;; |
| REF_BUDGET | const | 77 | no | const REF_BUDGET = &#39;CHANNEL_BUDGET_EXHAUSTED&#39;; |
| REF_UNCERTAIN | const | 78 | no | const REF_UNCERTAIN = &#39;CHANNEL_UNCERTAIN&#39;; |
| REF_THREAD | const | 79 | no | const REF_THREAD = &#39;CHANNEL_THREAD_FORBIDDEN&#39;; |
| SCOPE_PATTERN | const | 85 | no | const SCOPE_PATTERN = /^(chatgpt\|claude\|gemini\|qwen\|deepseek\|zai\|minimax\|kimi)\\.(draft\|send\|delegate)$/; |
| receiptScope | function | 88 | no | function receiptScope(scope) { |
| text | const | 89 | no | const text = typeof scope === &#39;string&#39; ? scope : &#39;&#39;; |
| ACTOR_KINDS | const | 93 | no | const ACTOR_KINDS = new Set([&#39;owner&#39;, &#39;agent&#39;, &#39;phone&#39;]); |
| sha256 | function | 95 | no | function sha256(text) { |
| digest | function | 98 | no | function digest(text) { return &#39;sha256:&#39; + sha256(text); } |
| receiptIdOf | function | 99 | no | function receiptIdOf(requestId) { return sha256(&#39;channel-receipt/v1:&#39; + requestId); } |
| asText | function | 100 | no | function asText(value) { return value === null \|\| value === undefined ? &#39;&#39; : String(value); } |
| isPlainObject | function | 101 | no | function isPlainObject(value) { |
| asActor | function | 106 | no | function asActor(actor) { |
| kind | const | 108 | no | const kind = ACTOR_KINDS.has(actor.kind) ? actor.kind : &#39;agent&#39;; |
| id | const | 109 | no | const id = typeof actor.id === &#39;string&#39; &amp;&amp; actor.id.length ? actor.id : &#39;unspecified&#39;; |
| baseReceipt | function | 114 | no | function baseReceipt({ requestId, taskId, actor, scope, thread, effect, promptDigest, replyDigest, journalKey, journalPath, turns, refusals, createdAt }) { |
| carriedScope | const | 115 | no | const carriedScope = receiptScope(scope); |
| createChatChannel | function | 135 | yes | export function createChatChannel({ transport, verify, store, now = () =&gt; new Date(), log, dcb = null } = {}) { |
| stored | const | 153 | no | const stored = await store.get(receipt.requestId); |
| replayOutcome | function | 158 | no | function replayOutcome(receipt) { |
| run | function | 172 | no | async function run(input = {}) { |
| requestId | const | 173 | no | const requestId = input.requestId; |
| prompt | const | 176 | no | const prompt = typeof input.prompt === &#39;string&#39; ? input.prompt : &#39;&#39;; |
| promptDigest | const | 177 | no | const promptDigest = digest(prompt); |
| existing | const | 181 | no | const existing = await store.get(requestId); |
| denial | const | 186 | no | const denial = baseReceipt({ requestId, taskId: input.taskId ?? null, actor: asActor(input.actor), scope: typeof input.scope === &#39;string&#39; &amp;&amp; input.scope.length ? input.scope : `${DEFAULT_SITE}.send`,… |
| cached | const | 202 | no | const cached = typeof store.getOutcome === &#39;function&#39; ? await store.getOutcome(requestId) : null; |
| requestedScope | const | 206 | no | const requestedScope = typeof input.scope === &#39;string&#39; &amp;&amp; input.scope.length ? input.scope : `${DEFAULT_SITE}.send`; |
| resolvedScope | const | 207 | no | const resolvedScope = resolveScope(requestedScope); |
| scope | const | 208 | no | const scope = resolvedScope ? resolvedScope.scope : requestedScope; |
| taskId | const | 209 | no | const taskId = input.taskId ?? null; |
| actor | const | 210 | no | const actor = asActor(input.actor); |
| effort | const | 212 | no | const effort = resolveEffort(input.effort, prompt); |
| wirePrompt | const | 213 | no | const wirePrompt = withEffort(prompt, effort); |
| taskThread | const | 214 | no | const taskThread = input.taskThread ?? (isPlainObject(input.task) ? input.task.thread : undefined); |
| budgetMs | const | 215 | no | const budgetMs = Number.isFinite(input.timeoutMs) ? input.timeoutMs |
| deadline | const | 218 | no | const deadline = new Date(now().getTime() + budgetMs); |
| createdAt | const | 219 | no | const createdAt = now().toISOString(); |
| refuse | function | 221 | no | async function refuse({ effect, refusal, thread, reason, scopes }) { |
| receipt | const | 222 | no | const receipt = baseReceipt({ requestId, taskId, actor, scope: scopes === null ? null : scope, thread: thread ?? { before: &#39;&#39;, after: &#39;&#39; }, effect, promptDigest, replyDigest: null, journalKey: reques… |
| turnsLimit | variable | 259 | no | let turnsLimit = 1; |
| open | const | 271 | no | const open = []; |
| before | variable | 272 | no | let before = &#39;&#39;; |
| after | variable | 273 | no | let after = &#39;&#39;; |
| threadId | variable | 274 | no | let threadId; |
| created | variable | 277 | no | let created; |
| assertedByModel | const | 310 | no | const assertedByModel = []; |
| turns | const | 311 | no | const turns = []; |
| refusals | const | 312 | no | const refusals = []; |
| effect | variable | 313 | no | let effect = null; |
| journalKey | variable | 314 | no | let journalKey = null; |
| journalPath | variable | 315 | no | let journalPath = null; |
| replyText | variable | 316 | no | let replyText = &#39;&#39;; |
| solution | variable | 317 | no | let solution = null; |
| result | variable | 363 | no | let result; |
| startedAt | const | 364 | no | const startedAt = now().toISOString(); |
| turnReply | const | 401 | no | const turnReply = typeof result.reply === &#39;string&#39; ? result.reply : &#39;&#39;; |
| turnJournalKey | const | 410 | no | const turnJournalKey = typeof result.journalKey === &#39;string&#39; &amp;&amp; result.journalKey.length |
| verifiedLocally | variable | 451 | no | let verifiedLocally = []; |
| verdicts | const | 453 | no | const verdicts = await verify(assertedByModel); |
| receipt | const | 459 | no | const receipt = baseReceipt({ requestId, taskId, actor, scope, thread: { before, after }, effect, promptDigest, replyDigest: replyText.length ? digest(replyText) : null, journalKey: journalKey ?? req… |
| evidenceState | const | 466 | no | const evidenceState = verifiedLocally.length ? &#39;VERIFIED&#39; : (replyText.length ? &#39;OBSERVED&#39; : &#39;CLAIMED&#39;); |
| outcome | const | 467 | no | const outcome = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 14 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/chat.mjs](../../bin/commands/chat.mjs.md) | ../../src/studio/chat-channel.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./chat-channel.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./chat-channel.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | VC-1B ChatGPT channel: replay-safe ask/delegate over an injected transport; no browser imports. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-1B |
| 5 | see | — | docs/chatgpt-channel/RECON.md | docs/chatgpt-channel/RECON.md |
| 6 | see | — | docs/chatgpt-channel/CONTRACT.md | docs/chatgpt-channel/CONTRACT.md |
| 7 | invariant | — | — | transport is the only way out; no browser, CDP, cookie or storage-state import. |
| 8 | invariant | — | — | revocation is checked immediately before every send; budget can never be exceeded. |
| 9 | invariant | — | — | a duplicate requestId returns the original receipt and performs no transport call. |

## Excerpt

```javascript
/**
 * @hq:context VC-1B ChatGPT channel: replay-safe ask/delegate over an injected transport; no browser imports.
 * @hq:owner atlas
 * @hq:task VC-1B
 * @hq:see docs/chatgpt-channel/RECON.md
 * @hq:see docs/chatgpt-channel/CONTRACT.md
 * @hq:invariant transport is the only way out; no browser, CDP, cookie or storage-state import.
 * @hq:invariant revocation is checked immediately before every send; budget can never be exceeded.
 * @hq:invariant a duplicate requestId returns the original receipt and performs no transport call.
 */
// A replay-safe, provider-agnostic channel over an INJECTED transport. This module knows nothing
// about browsers, cookies, CDP or playback; transport.send is the only way out, and it is audited
// here (revocation before every call, idempotent requestId, terminal uncertainty, no retries).
import { createHash } from 'node:crypto';

// The chatgpt.* spelling is frozen (contract invariant 2). Every other site uses <site>.<action>;
// the site rides in the scope string and no site field is added to a receipt.
const DEFAULT_SITE = 'chatgpt';
const CHANNEL_SITES = new Set(['chatgpt', 'claude', 'gemini', 'qwen', 'deepseek', 'zai', 'minimax', 'kimi']);
// A site is served only when a seat exists. A reserved site is denied until its seat is created;
// "whitelisted is not served" (chatgpt seat report, 2026-11-04).
const SERVED_SITES = new Set(['chatgpt', 'claude', 'gemini']);
const SCOPE_ACTIONS = new Set(['draft', 'send', 'delegate']);

/**
 * Resolve "<site>.<action>". Unknown sites and unknown actions resolve to null so a typo can never
 * turn into a provider send. A caller that names no scope is a single send to the frozen default.
 */
function resolveScope(requested) {
  const text = typeof requested === 'string' && requested.length ? requested : `${DEFAULT_SITE}.send`;
  const dot = text.lastIndexOf('.');
  if (dot < 1 || dot === text.length - 1) return null;
  const site = text.slice(0, dot);
  const action = text.slice(dot + 1);
  if (!CHANNEL_SITES.has(site) || !SCOPE_ACTIONS.has(action)) return null;
  if (!SERVED_SITES.has(site)) return null;
  return { site, action, scope: text };
}
const MIN_TURNS = 1;
// Owner policy: maximise delegation. The cap exists only to stop a runaway loop, not to ration use.
const MAX_TURNS = 20;
const DEFAULT_TIMEOUT_MS = 90000;

const EFFORT_LEVELS = new Set(['instant', 'medium', 'high']);
// High effort is reserved for work where reasoning depth changes the answer.
const HIGH_EFFORT = /(\bcode\b|coding|implement|debug|algorithm|architecture|design|brainstorm|ideat|derive|proof|optimi[sz]e|refactor|test|analyse|analyze|audit|review the|plan\b)/i;
// Instant is for short, look-up shaped asks.
const INSTANT_SHAPE = /^(what|who|when|where|which|is|are|can|does|do|list|name|reply with|say|translate|convert)\b/i;

/**
 * Route a request to an effort tier. Explicit input wins; otherwise coding/brainstorm/algorithm
 * work goes high, short look-up asks go instant, and everything else stays at medium.
 */
function resolveEffort(requested, prompt) {
  if (typeof requested === 'string' && EFFORT_LEVELS.has(requested)) return requested;
  if (HIGH_EFFORT.test(prompt)) return 'high';
  if (prompt.length <= 160 && INSTANT_SHAPE.test(prompt.trim())) return 'instant';
  return 'medium';
}

/**
 * Effort is expressed to the model as an explicit instruction line, since Studio has no native
 * picker. It must stay ONE line of ASCII: the drive transport types the prompt and verifies the
 * composer text matches, and newlines break that verification (observed: "prompt-mismatch").
 */
function withEffort(prompt, effort) {
  const instruction = effort === 'instant'
    ? '[Effort: instant - answer directly and briefly, no extended reasoning.]'
    : effort === 'high'
      ? '[Effort: high - reason deeply, check your own work, and show the key steps before the answer.]'
      : '[Effort: medium - think it through, then answer concisely.]';
  return `${instruction} ${prompt}`;
}

const REF_DENIED = 'CHANNEL_DENIED';
const REF_REVOKED = 'CHANNEL_REVOKED';
const REF_BUDGET = 'CHANNEL_BUDGET_EXHAUSTED';
const REF_UNCERTAIN = 'CHANNEL_UNCERTAIN';
const REF_THREAD = 'CHANNEL_THREAD_FORBIDDEN';
```

_First 80 of 485 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
