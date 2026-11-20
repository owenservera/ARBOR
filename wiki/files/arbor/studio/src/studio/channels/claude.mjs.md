# File: studio/src/studio/channels/claude.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/channels/claude.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14301 B |
| Lines | 241 |
| Hash | cc5614a6818a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SITE | const | 29 | yes | export const SITE = &#39;claude&#39;; |
| SCOPES | const | 32 | yes | export const SCOPES = Object.freeze({ draft: &#39;claude.draft&#39;, send: &#39;claude.send&#39;, delegate: &#39;claude.delegate&#39;, }); |
| THREAD_UUID | const | 43 | no | const THREAD_UUID = &#39;[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}&#39;; |
| PINNED_THREAD | const | 44 | no | const PINNED_THREAD = new RegExp(`^claude-chat:(${THREAD_UUID})$`, &#39;i&#39;); |
| FRESH_THREAD | const | 51 | yes | export const FRESH_THREAD = &#39;claude-new&#39;; |
| driveUrlFor | function | 54 | yes | export function driveUrlFor(threadId) { |
| pinned | const | 55 | no | const pinned = PINNED_THREAD.exec(String(threadId ?? &#39;&#39;)); |
| isPinnedThread | function | 60 | yes | export const isPinnedThread = (threadId) =&gt; PINNED_THREAD.test(String(threadId ?? &#39;&#39;)); |
| remainingSeconds | function | 63 | yes | export function remainingSeconds(deadline, nowMs = Date.now(), { min = 5, max = 900 } = {}) { |
| classifyDriveResult | function | 91 | yes | export function classifyDriveResult(parsed, { threadId, requestId, prompt = &#39;&#39; } = {}) { |
| journalKey | const | 92 | no | const journalKey = requestId ?? null; |
| base | const | 93 | no | const base = { threadId: threadId ?? null, journalKey, journalPath: null, reply: null }; |
| result | function | 94 | no | const result = (effect, state, reason, extra = {}) =&gt; ({ ...base, effect, reason: reason ?? null, send: { state }, ...extra }); |
| NOT_SENT | const | 111 | no | const NOT_SENT = new Set([ &#39;no-composer&#39;, &#39;not-a-new-chat&#39;, &#39;thread-not-open&#39;, &#39;thread-not-rendered&#39;, &#39;page-unreadable&#39;, &#39;draft-not-cleared&#39;, &#39;composer-unreadable&#39;, &#39;prompt-mismatch&#39;, &#39;type-failed&#39;, … |
| reason | const | 116 | no | const reason = String(parsed.reason ?? (Array.isArray(parsed.errors) ? parsed.errors[0] : &#39;&#39;) ?? &#39;&#39;); |
| notice | const | 131 | no | const notice = Array.isArray(parsed.errors) ? parsed.errors.find((e) =&gt; typeof e === &#39;string&#39; &amp;&amp; e !== &#39;site-failure&#39;) : null; |
| observed | const | 144 | no | const observed = typeof parsed.threadRef === &#39;string&#39; &amp;&amp; PINNED_THREAD.test(parsed.threadRef) |
| DEFAULT_DEADLINE_MS | const | 153 | no | const DEFAULT_DEADLINE_MS = 90000; |
| STUDIO_BIN | const | 154 | no | const STUDIO_BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;, &#39;bin&#39;, &#39;studio.mjs&#39;); |
| createClaudeTransport | function | 160 | yes | export function createClaudeTransport({ binPath = STUDIO_BIN, exec = spawnSync, nodePath = process.execPath, maxOutputBytes = 8 * 1024 * 1024, |
| seconds | const | 199 | no | const seconds = Math.max(5, Math.min(900, remainingSeconds(deadline ?? Date.now() + DEFAULT_DEADLINE_MS))); |
| target | const | 200 | no | const target = driveUrlFor(threadId); |
| args | const | 201 | no | const args = [binPath, &#39;drive&#39;, target, &#39;--prompt&#39;, prompt, &#39;--timeout&#39;, String(seconds), &#39;--no-record&#39;, &#39;--json&#39;]; |
| child | variable | 204 | no | let child; |
| parsed | variable | 219 | no | let parsed; |
| mapped | const | 228 | no | const mapped = classifyDriveResult(parsed, { threadId, requestId, prompt }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 25 | external |
| node:path | import | 26 | external |
| node:url | import | 27 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/chat.mjs](../../../bin/commands/chat.mjs.md) | ../../src/studio/channels/claude.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | claude site transport: one local agent turn to a signed-in claude.ai through Studio&#39;s drive owner. |
| 3 | owner | claude-channel | — | claude-channel |
| 4 | task | — | — | VC-1-CLAUDE |
| 5 | see | — | docs/chatgpt-channel/CONTRACT.md | docs/chatgpt-channel/CONTRACT.md |
| 6 | see | — | src/studio/chat-channel.mjs | src/studio/chat-channel.mjs |
| 7 | invariant | — | — | Studio is the only browser owner: this module spawns Studio&#39;s own `drive` command; it never opens a CDP socket, tab, recorder or cookie store. |
| 8 | invariant | — | — | one site, one sender: SITE is the constant &#39;claude&#39;. A site hint from a caller is IGNORED, never honoured. |
| 9 | invariant | — | — | fail closed: no browser, a login wall or an unconfirmed dispatch is reported as an effect; a reply is never invented. |
| 10 | invariant | — | — | a pinned thread is continued by its /chat/&lt;uuid&gt; address, never by reusing an arbitrary tab. |
| 83 | invariant | — | — | uncertainty is reported as effect UNVERIFIED, not UNCERTAIN. |
| 84 | why | — | — | the policy core (src/studio/chat-channel.mjs) branches on UNVERIFIED and FAILED only: a |
| 137 | why | — | — | above — the core has no UNCERTAIN branch. |

## Excerpt

```javascript
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
```

_First 80 of 242 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
