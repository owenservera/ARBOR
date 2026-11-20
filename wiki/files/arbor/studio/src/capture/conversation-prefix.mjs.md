# File: studio/src/capture/conversation-prefix.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-prefix.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14524 B |
| Lines | 191 |
| Hash | 209666f1cbde |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha256 | function | 15 | no | const sha256 = (text) =&gt; createHash(&#39;sha256&#39;).update(String(text), &#39;utf8&#39;).digest(&#39;hex&#39;); |
| hex64 | function | 16 | no | const hex64 = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(value); |
| id | function | 17 | no | const id = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; value.length &gt; 0 &amp;&amp; value.length &lt;= 200 &amp;&amp; !/[\\u0000-\\u001f\\u007f]/.test(value); |
| int | function | 18 | no | const int = (value) =&gt; Number.isSafeInteger(value) &amp;&amp; value &gt;= 0; |
| date | function | 19 | no | const date = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; Number.isFinite(Date.parse(value)); |
| code | function | 20 | no | const code = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; /^[A-Z][A-Z0-9_]{0,79}$/.test(value); |
| failure | function | 21 | no | const failure = (value) =&gt; Object.assign(new Error(value), { code: value }); |
| PREFIX_ORIGINS | const | 23 | yes | export const PREFIX_ORIGINS = Object.freeze([&#39;https://chatgpt.com&#39;, &#39;https://chat.openai.com&#39;]); |
| PREFIX_STATES | const | 24 | yes | export const PREFIX_STATES = Object.freeze([&#39;pending&#39;, &#39;active&#39;, &#39;invalidated&#39;]); |
| PREFIX_PROMPT_SOURCES | const | 25 | yes | export const PREFIX_PROMPT_SOURCES = Object.freeze([&#39;capture-kv&#39;, &#39;page+snapshot-digest&#39;, &#39;owner-attested&#39;]); |
| PREFIX_CORROBORATION | const | 26 | yes | export const PREFIX_CORROBORATION = Object.freeze([&#39;terminal-complete&#39;, &#39;terminal-incomplete&#39;]); |
| PREFIX_SEND_ACTOR | const | 27 | yes | export const PREFIX_SEND_ACTOR = &#39;unknown&#39;; |
| PREFIX_DISPATCH | const | 28 | yes | export const PREFIX_DISPATCH = &#39;unknown&#39;; |
| PREFIX_ACCOUNT | const | 29 | yes | export const PREFIX_ACCOUNT = &#39;unknown&#39;; |
| PREFIX_ARRIVAL | const | 30 | yes | export const PREFIX_ARRIVAL = &#39;page-observed&#39;; |
| PREFIX_COMPLETION | const | 31 | yes | export const PREFIX_COMPLETION = &#39;observed-complete&#39;; |
| PREFIX_CODES | const | 34 | yes | export const PREFIX_CODES = Object.freeze([ // Target &#39;PREFIX_TARGET_NOT_FOUND&#39;, &#39;PREFIX_TARGET_NOT_PAGE&#39;, &#39;PREFIX_TARGET_ORIGIN_MISMATCH&#39;, &#39;PREFIX_TARGET_URL_UNSUPPORTED&#39;, &#39;PREFIX_TARGET_AMBIGUOUS&#39;,… |
| isPrefixCode | function | 55 | yes | export const isPrefixCode = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; PREFIX_CODES.includes(value); |
| sha256Hex | const | 56 | yes | export const sha256Hex = sha256; |
| prefixId | function | 59 | yes | export function prefixId({ conversationId, attemptId, threadRef, promptDigest } = {}) { |
| preimageParts | function | 66 | no | const preimageParts = (p) =&gt; [p.source?.conversationId, p.source?.attemptId, p.prompt?.digest, p.thread?.ref, |
| preimageDigest | function | 69 | yes | export const preimageDigest = (prefix) =&gt; sha256(JSON.stringify(preimageParts(prefix))); |
| readSignature | function | 72 | yes | export function readSignature(read) { |
| user | const | 73 | no | const user = read?.messages?.[0], assistant = read?.messages?.[1]; |
| comparePrefixRead | function | 81 | yes | export function comparePrefixRead(prefix, read) { |
| user | const | 83 | no | const user = read?.messages?.[0]; |
| assistant | const | 85 | no | const assistant = read?.messages?.[1]; |
| validPrefixRecord | function | 92 | yes | export function validPrefixRecord(p) { |
| resolvePromptTier | function | 118 | yes | export function resolvePromptTier({ digest, kv = null, pageUserText = &#39;&#39;, attestation = null, corroboration = &#39;terminal-complete&#39; } = {}) { |
| text | const | 120 | no | const text = String(pageUserText ?? &#39;&#39;); |
| pageMatches | const | 121 | no | const pageMatches = sha256(text) === digest; |
| kvMatches | const | 122 | no | const kvMatches = !!kv &amp;&amp; kv.payloadDigest === digest; |
| checkPrefixPage | function | 135 | yes | export function checkPrefixPage(read) { |
| messages | const | 136 | no | const messages = read?.messages; |
| c | const | 152 | no | const c = read.controls; |
| comparePrefixReads | function | 160 | yes | export function comparePrefixReads(first, second) { |
| a | const | 161 | no | const a = readSignature(first), b = readSignature(second); |
| prefixDescriptor | function | 169 | yes | export const prefixDescriptor = (p) =&gt; ({ userMessageId: p?.userMessage?.id, userMessageDigest: p?.userMessage?.digest, assistantMessageId: p?.assistant?.id, assistantDigest: p?.assistant?.digest, as… |
| prefixGuardSource | function | 174 | yes | export function prefixGuardSource({ prefixSource = null, sourceSnapshot = null, prefixRecords = [], origin, threadRef } = {}) { |
| snapshot | const | 176 | no | const snapshot = sourceSnapshot; |
| attempt | const | 178 | no | const attempt = snapshot.attempts[0]; |
| sha256 | export | 191 | yes | export { sha256 } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 12 | external |
| ./conversation-thread.mjs | import | 13 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./conversation-prefix.mjs |
| [studio/src/capture/conversation-service.mjs](./conversation-service.mjs.md) | ./conversation-prefix.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Observed-prefix recovery (spec: docs/product/OBSERVED-PREFIX-RECOVERY-SPEC-2026-10-27.md).
 *
 * Pure helpers only: refusal-code vocabulary, the prefix identity/preimage digests, strict prefix
 * record validation, prompt-tier resolution, page-evidence checks and the narrow §11.3 guard
 * predicate. No filesystem, browser, network, recorder or journal access here, and no dependency on
 * conversation-service (the service imports this module, never the other way round).
 *
 * A prefix records a turn that already existed on the page before adoption. It is page-observed,
 * never journal-attributed: sendActor/dispatch/account are permanently "unknown".
 */
import { createHash } from 'node:crypto';
import { validThread } from './conversation-thread.mjs';

const sha256 = (text) => createHash('sha256').update(String(text), 'utf8').digest('hex');
const hex64 = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const id = (value) => typeof value === 'string' && value.length > 0 && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
const int = (value) => Number.isSafeInteger(value) && value >= 0;
const date = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const code = (value) => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value);
const failure = (value) => Object.assign(new Error(value), { code: value });

export const PREFIX_ORIGINS = Object.freeze(['https://chatgpt.com', 'https://chat.openai.com']);
export const PREFIX_STATES = Object.freeze(['pending', 'active', 'invalidated']);
export const PREFIX_PROMPT_SOURCES = Object.freeze(['capture-kv', 'page+snapshot-digest', 'owner-attested']);
export const PREFIX_CORROBORATION = Object.freeze(['terminal-complete', 'terminal-incomplete']);
export const PREFIX_SEND_ACTOR = 'unknown';
export const PREFIX_DISPATCH = 'unknown';
export const PREFIX_ACCOUNT = 'unknown';
export const PREFIX_ARRIVAL = 'page-observed';
export const PREFIX_COMPLETION = 'observed-complete';

// §8 refusal vocabulary. Every helper in this module throws one of these; nothing else.
export const PREFIX_CODES = Object.freeze([
  // Target
  'PREFIX_TARGET_NOT_FOUND', 'PREFIX_TARGET_NOT_PAGE', 'PREFIX_TARGET_ORIGIN_MISMATCH', 'PREFIX_TARGET_URL_UNSUPPORTED',
  'PREFIX_TARGET_AMBIGUOUS', 'PREFIX_TARGET_CHANGED', 'PREFIX_PAGE_THREAD_MISMATCH', 'PREFIX_THREAD_ID_MISMATCH',
  // Source
  'PREFIX_SOURCE_MISSING', 'PREFIX_SOURCE_CORRUPT', 'PREFIX_SOURCE_ATTEMPT_MISSING', 'PREFIX_SOURCE_ATTEMPT_NOT_CREATION',
  'PREFIX_SOURCE_ATTEMPTS_AMBIGUOUS', 'PREFIX_SOURCE_DIGEST_INVALID', 'PREFIX_SOURCE_KV_MISMATCH', 'PREFIX_SOURCE_STATE_UNEXPECTED',
  'PREFIX_SOURCE_ALREADY_ADOPTED',
  // Session
  'PREFIX_SESSION_OWNER_MISMATCH', 'PREFIX_SESSION_STILL_RECORDING', 'PREFIX_SESSION_METADATA_INVALID',
  // Page
  'PREFIX_PAGE_UNREADABLE', 'PREFIX_PAGE_SHAPE_MISMATCH', 'PREFIX_PAGE_HISTORY_INCOMPLETE', 'PREFIX_USER_TURN_MISSING',
  'PREFIX_USER_TURN_ID_MISSING', 'PREFIX_REPLY_MISSING', 'PREFIX_PAGE_TEXT_MISMATCH', 'PREFIX_PROMPT_UNVERIFIED',
  'PREFIX_CONTROLS_NOT_IDLE', 'PREFIX_DRAFT_PRESENT', 'PREFIX_REPLY_UNSTABLE', 'PREFIX_THREAD_DENYLISTED',
  'PREFIX_THREAD_BOUND_ELSEWHERE',
  // Lifecycle
  'PREFIX_WRITER_BUSY', 'PREFIX_IDEMPOTENCY_CONFLICT', 'PREFIX_PENDING_UNRESOLVED', 'PREFIX_NOT_ACTIVE', 'PREFIX_INVALIDATED',
  'PREFIX_CORRUPT_OR_UNREADABLE_SNAPSHOT', 'PREFIX_PERSISTENCE_FAILED_REOPEN_REQUIRED',
  // Continuation
  'PREFIX_AUDIT_REQUIRED', 'PREFIX_AUDIT_FAILED', 'PREFIX_REPLY_CHANGED', 'PREFIX_USER_MESSAGE_MISSING',
]);
export const isPrefixCode = (value) => typeof value === 'string' && PREFIX_CODES.includes(value);
export const sha256Hex = sha256;

// §10.4: one adoption identity per (source conversation, source attempt, thread, prompt digest).
export function prefixId({ conversationId, attemptId, threadRef, promptDigest } = {}) {
  if (!id(conversationId) || !id(attemptId) || !id(threadRef) || !hex64(promptDigest)) throw failure('PREFIX_SOURCE_DIGEST_INVALID');
  return sha256(`${conversationId}:${attemptId}:${threadRef}:${promptDigest}`);
}

// The immutable tuple that defines an adoption. Any drift between the staged record and a fresh
// read refuses continuation (PREFIX_PENDING_UNRESOLVED / PREFIX_INVALIDATED), never auto-activates.
const preimageParts = (p) => [p.source?.conversationId, p.source?.attemptId, p.prompt?.digest, p.thread?.ref,
  p.target?.targetId, p.target?.origin, p.userMessage?.id, p.userMessage?.digest, p.userMessage?.chars,
  p.assistant?.id, p.assistant?.digest, p.assistant?.chars];
export const preimageDigest = (prefix) => sha256(JSON.stringify(preimageParts(prefix)));

// The same tuple derived from one page read, so a read can be compared with a staged record.
export function readSignature(read) {
  const user = read?.messages?.[0], assistant = read?.messages?.[1];
  return { source: null, prompt: null,
    thread: { ref: read?.thread?.ref }, target: { targetId: read?.targetId, origin: read?.origin },
    userMessage: { id: user?.id, digest: sha256(user?.text ?? ''), chars: String(user?.text ?? '').length },
    assistant: { id: assistant?.id, digest: sha256(assistant?.text ?? ''), chars: String(assistant?.text ?? '').length } };
}

// null when the read still shows exactly the observed prefix; otherwise the specific refusal code.
```

_First 80 of 192 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
