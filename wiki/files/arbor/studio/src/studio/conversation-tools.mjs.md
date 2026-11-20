# File: studio/src/studio/conversation-tools.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/conversation-tools.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17531 B |
| Lines | 203 |
| Hash | 22ce15cadea0 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| string | function | 8 | no | const string = (maxLength, description) =&gt; ({ type: &#39;string&#39;, minLength: 1, maxLength, ...(description ? { description } : {}) }); |
| schema | function | 9 | no | const schema = (properties = {}, required = []) =&gt; ({ type: &#39;object&#39;, properties, required, additionalProperties: false }); |
| conversation | const | 10 | no | const conversation = { ...string(128), pattern: &#39;^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$&#39; }; |
| revision | const | 11 | no | const revision = { type: &#39;integer&#39;, minimum: 0, maximum: Number.MAX_SAFE_INTEGER }; |
| threadPattern | const | 12 | no | const threadPattern = &#39;^chatgpt-c:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$&#39;; |
| bounds | function | 13 | no | const bounds = (spec) =&gt; ({ type: &#39;integer&#39;, minimum: spec.min, maximum: spec.max, default: spec.default }); |
| indexBody | const | 14 | no | const indexBody = schema({ targetId: string(256), site: { type: &#39;string&#39;, enum: [&#39;chatgpt&#39;, &#39;claude&#39;], default: &#39;chatgpt&#39; }, ...Object.fromEntries(Object.entries(CHAT_INDEX_LIMITS).map(([name, spec])… |
| createBody | const | 17 | no | const createBody = schema({ site: { type: &#39;string&#39;, enum: [...CREATE_SITES] } }, [&#39;site&#39;]); |
| connectBody | const | 19 | no | const connectBody = schema({ site: { type: &#39;string&#39;, enum: [&#39;chatgpt&#39;] }, targetId: string(256), expectedThread: { ...string(200), pattern: threadPattern }, freshTab: { type: &#39;boolean&#39;, const: false … |
| readBody | const | 21 | no | const readBody = schema({ maxMessages: bounds(TRANSCRIPT_LIMITS.maxMessages), maxChars: bounds(TRANSCRIPT_LIMITS.maxChars) }); |
| submitBody | const | 22 | no | const submitBody = schema({ key: string(200, &#39;Caller-owned durable request key. Never generate a replacement key on timeout/unknown effect.&#39;), prompt: string(250000, &#39;Private prompt body; never inclu… |
| reconcileBody | const | 24 | no | const reconcileBody = schema({ expectedRevision: revision, turnId: string(200, &#39;Optional exact historical turn to inspect. No user delivery assertions accepted.&#39;) }, [&#39;expectedRevision&#39;]); |
| finishBody | const | 25 | no | const finishBody = schema({ closeTab: { type: &#39;boolean&#39;, default: false, description: &#39;Explicit optional close of a Studio-owned tab only; never an owner-selected tab.&#39; } }); |
| withConversation | const | 26 | no | const withConversation = (body = schema()) =&gt; schema({ conversation, ...body.properties }, [&#39;conversation&#39;, ...body.required]); |
| annotations | function | 27 | no | const annotations = (readOnlyHint, openWorldHint = true) =&gt; ({ readOnlyHint, destructiveHint: false, idempotentHint: readOnlyHint, openWorldHint }); |
| evidence | const | 28 | no | const evidence = &#39;reply.verified means saved text matches attributed delivery/reply journal evidence; reply.settled means matching interactive-readiness evidence, not network completion. Non-settled … |
| CONVERSATION_TOOLS | const | 30 | yes | export const CONVERSATION_TOOLS = Object.freeze([ { name: &#39;conversation_targets&#39;, method: &#39;GET&#39;, path: &#39;/conversation-targets&#39;, runtime: &#39;targets&#39;, description: &#39;Read available browser target metadat… |
| TERMINAL_SEND_PHASES | const | 76 | no | const TERMINAL_SEND_PHASES = new Set([&#39;blocked&#39;, &#39;delivered&#39;, &#39;unknown&#39;]); |
| SEND_OUTCOME_TIMEOUT_MS | const | 77 | yes | export const SEND_OUTCOME_TIMEOUT_MS = 15000; |
| SEND_OUTCOME_POLL_MS | const | 78 | yes | export const SEND_OUTCOME_POLL_MS = 100; |
| journalTurnFor | function | 82 | no | const journalTurnFor = (conversationRuntime, conversationId, key) =&gt; { |
| journal | const | 84 | no | const journal = conversationRuntime?.journalSnapshot?.(conversationId); |
| blockingDraft | function | 92 | no | const blockingDraft = (view) =&gt; { |
| draft | const | 93 | no | const draft = view?.readiness?.draft; |
| chars | const | 95 | no | const chars = Number.isSafeInteger(draft.chars) ? draft.chars : null; |
| present | const | 96 | no | const present = typeof draft.present === &#39;boolean&#39; ? draft.present : chars !== null &amp;&amp; chars &gt; 0; |
| outcomeFrom | function | 101 | no | const outcomeFrom = (turn, attempt, view) =&gt; { |
| phase | const | 102 | no | const phase = typeof turn?.phase === &#39;string&#39; ? turn.phase : null; |
| deliveryState | const | 103 | no | const deliveryState = typeof turn?.delivery?.state === &#39;string&#39; ? turn.delivery.state : null; |
| sendState | const | 104 | no | const sendState = typeof attempt?.send?.state === &#39;string&#39; ? attempt.send.state : null; |
| reason | const | 105 | no | const reason = attempt?.reason ?? (typeof turn?.reason === &#39;string&#39; ? turn.reason : null); |
| base | const | 106 | no | const base = { turnId: typeof turn?.id === &#39;string&#39; ? turn.id : null, phase, deliveryState, sendState, |
| readSendOutcome | function | 125 | yes | export function readSendOutcome(conversationRuntime, conversationId, key) { |
| turn | const | 128 | no | const turn = journalTurnFor(conversationRuntime, conversationId, key); |
| resolveSendOutcome | function | 135 | yes | export async function resolveSendOutcome(conversationRuntime, conversationId, key, options = {}) { |
| timeoutMs | const | 138 | no | const timeoutMs = Number.isSafeInteger(options.timeoutMs) ? Math.max(0, options.timeoutMs) : SEND_OUTCOME_TIMEOUT_MS; |
| pollMs | const | 139 | no | const pollMs = Number.isSafeInteger(options.pollMs) ? Math.max(1, options.pollMs) : SEND_OUTCOME_POLL_MS; |
| started | const | 140 | no | const started = Date.now(); |
| turn | variable | 141 | no | let turn; |
| elapsed | const | 146 | no | const elapsed = Date.now() - started; |
| view | variable | 150 | no | let view = null; |
| attempts | const | 152 | no | const attempts = Array.isArray(view?.turns) ? view.turns : []; |
| attempt | const | 153 | no | const attempt = attempts.find((t) =&gt; t?.key === key) ?? null; |
| validateConversationTool | function | 163 | yes | export function validateConversationTool(name, args = {}) { |
| definition | const | 164 | no | const definition = CONVERSATION_TOOLS.find((tool) =&gt; tool.name === name); |
| body | const | 170 | no | const body = Object.fromEntries(Object.entries(args).filter(([key]) =&gt; key !== &#39;conversation&#39;)); |
| executeConversationTool | function | 180 | yes | export async function executeConversationTool(conversationRuntime, name, args = {}) { |
| definition | const | 181 | no | const definition = CONVERSATION_TOOLS.find((tool) =&gt; tool.name === name); |
| valid | const | 183 | no | const valid = validateConversationTool(name, args); |
| handler | const | 184 | no | const handler = conversationRuntime[definition.runtime]; |
| argsForOwner | const | 188 | no | const argsForOwner = definition.kind === &#39;create&#39; ? [{ site: valid.body.site, freshTab: true }] |
| registerConversationTools | function | 195 | yes | export function registerConversationTools({ add, conversationRuntime }) { |
| args | const | 198 | no | const args = { ...body, ...(p.conversation !== undefined ? { conversation: p.conversation } : {}) }; |
| value | const | 199 | no | const value = await executeConversationTool(conversationRuntime, tool.name, args); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./conversation-api.mjs | import | 3 | [studio/src/studio/conversation-api.mjs](./conversation-api.mjs.md) |
| ./http.mjs | import | 4 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ../capture/conversation-thread.mjs | import | 5 | [studio/src/capture/conversation-thread.mjs](../capture/conversation-thread.mjs.md) |
| ../capture/chatgpt-chat-index.mjs | import | 6 | [studio/src/capture/chatgpt-chat-index.mjs](../capture/chatgpt-chat-index.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/recipes/catalog.mjs](../recipes/catalog.mjs.md) | ../studio/conversation-tools.mjs |
| [studio/src/recipes/plan.mjs](../recipes/plan.mjs.md) | ../studio/conversation-tools.mjs |
| [studio/src/recipes/service.mjs](../recipes/service.mjs.md) | ../studio/conversation-tools.mjs |
| [studio/src/studio/ai-orchestrator.mjs](./ai-orchestrator.mjs.md) | ./conversation-tools.mjs |
| [studio/src/studio/compare-service.mjs](./compare-service.mjs.md) | ./conversation-tools.mjs |
| [studio/src/studio/harness-api.mjs](./harness-api.mjs.md) | ./conversation-tools.mjs |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./conversation-tools.mjs |
| [studio/src/studio/personal-app-ai-design.mjs](./personal-app-ai-design.mjs.md) | ./conversation-tools.mjs |
| [studio/src/studio/tool-client.mjs](./tool-client.mjs.md) | ./conversation-tools.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Registration only: every handler delegates to the Studio server's EXISTING runtime owner.
// This module never constructs a runtime, recorder, CDP connection, or MCP actor.
import { validateConversationBody, CREATE_SITES } from './conversation-api.mjs';
import { object, problem } from './http.mjs';
import { TRANSCRIPT_LIMITS } from '../capture/conversation-thread.mjs';
import { CHAT_INDEX_LIMITS } from '../capture/chatgpt-chat-index.mjs';

const string = (maxLength, description) => ({ type: 'string', minLength: 1, maxLength, ...(description ? { description } : {}) });
const schema = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const conversation = { ...string(128), pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$' };
const revision = { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER };
const threadPattern = '^chatgpt-c:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';
const bounds = (spec) => ({ type: 'integer', minimum: spec.min, maximum: spec.max, default: spec.default });
const indexBody = schema({ targetId: string(256), site: { type: 'string', enum: ['chatgpt', 'claude'], default: 'chatgpt' },
  ...Object.fromEntries(Object.entries(CHAT_INDEX_LIMITS).map(([name, spec]) => [name, bounds(spec)])),
  containers: { type: 'array', maxItems: 8, items: schema({ label: { ...string(40), pattern: '^(?!unknown$)[a-z][a-z-]{0,39}$' }, selector: string(200) }, ['label', 'selector']) } }, ['targetId']);
const createBody = schema({ site: { type: 'string', enum: [...CREATE_SITES] } }, ['site']);
// Exact-thread attach is ChatGPT-only; the connect guard below refuses every other site, so the schema says the same.
const connectBody = schema({ site: { type: 'string', enum: ['chatgpt'] }, targetId: string(256),
  expectedThread: { ...string(200), pattern: threadPattern }, freshTab: { type: 'boolean', const: false } }, ['site', 'targetId', 'expectedThread']);
const readBody = schema({ maxMessages: bounds(TRANSCRIPT_LIMITS.maxMessages), maxChars: bounds(TRANSCRIPT_LIMITS.maxChars) });
const submitBody = schema({ key: string(200, 'Caller-owned durable request key. Never generate a replacement key on timeout/unknown effect.'),
  prompt: string(250000, 'Private prompt body; never included in diagnostic logs.'), confirm: { type: 'boolean', const: true }, expectedRevision: revision }, ['key', 'prompt', 'confirm', 'expectedRevision']);
const reconcileBody = schema({ expectedRevision: revision, turnId: string(200, 'Optional exact historical turn to inspect. No user delivery assertions accepted.') }, ['expectedRevision']);
const finishBody = schema({ closeTab: { type: 'boolean', default: false, description: 'Explicit optional close of a Studio-owned tab only; never an owner-selected tab.' } });
const withConversation = (body = schema()) => schema({ conversation, ...body.properties }, ['conversation', ...body.required]);
const annotations = (readOnlyHint, openWorldHint = true) => ({ readOnlyHint, destructiveHint: false, idempotentHint: readOnlyHint, openWorldHint });
const evidence = 'reply.verified means saved text matches attributed delivery/reply journal evidence; reply.settled means matching interactive-readiness evidence, not network completion. Non-settled saved text is partial. Page readiness, network protocol completion and capture acceptance are independent; no account or live capability availability is implied.';

export const CONVERSATION_TOOLS = Object.freeze([
  { name: 'conversation_targets', method: 'GET', path: '/conversation-targets', runtime: 'targets',
    description: 'Read available browser target metadata only; no attachment or account-availability assertion. Titles are not thread identities.',
    inputSchema: schema(), annotations: annotations(true) },
  { name: 'chat_index', method: 'POST', path: '/chat-index', runtime: 'chatIndex', kind: 'chatIndex', body: indexBody,
    description: 'Explicit read-only rendered ChatGPT link index from one canonical-origin target. candidatesOnly=true, complete=false; entries are NOT verified live bindings. No search, pagination, creation or click.',
    inputSchema: indexBody, annotations: annotations(true) },
  { name: 'list_conversations', method: 'GET', path: '/conversations', runtime: 'list',
    description: 'Read stored conversation summaries and turn metadata; strips reply bodies. No browser action or snapshot recovery.',
    inputSchema: schema(), annotations: annotations(true, false), wrapper: 'conversations' },
  { name: 'get_conversation', method: 'GET', path: '/conversations/{conversation}', runtime: 'get',
    description: `Read a stored conversation snapshot including current/historical turn replies. No browser action or recovery. ${evidence}`,
    inputSchema: withConversation(), annotations: annotations(true, false), wrapper: 'conversation' },
  { name: 'conversation_capsule', method: 'GET', path: '/conversations/{conversation}/capsule', runtime: 'capsule',
    description: 'Read the existing runtime-owned capability capsule for one conversation. Advisory evidence only, not provider availability or authorization for effects.',
    inputSchema: withConversation(), annotations: annotations(true), wrapper: 'capsule' },
  { name: 'create_conversation', method: 'POST', path: '/conversations/create', runtime: 'connect', kind: 'create', body: createBody, status: 201,
    description: 'Create a fresh Studio-owned ChatGPT tab through the EXISTING single browser/runtime owner; never submits a turn or attaches an existing tab. Returns an unbound NEW_CHAT until a new exact /c/ thread is proven.',
    inputSchema: createBody, annotations: annotations(false), wrapper: 'conversation' },
  { name: 'connect_conversation', method: 'POST', path: '/conversations', runtime: 'connect', kind: 'connect', body: connectBody, status: 201,
    description: 'Attach capture to the selected EXISTING exact /c/ thread, expectedThread required. Acquires resources/drive lease; never submits. Tool intentionally excludes fresh/root creation. No account readiness guarantee.',
    inputSchema: connectBody, annotations: annotations(false), wrapper: 'conversation' },
  { name: 'read_conversation', method: 'POST', path: '/conversations/{conversation}/read', runtime: 'read', kind: 'read', body: readBody,
    description: 'Read bounded currently rendered transcript from a live exact-bound conversation. Read-only: no focus, scrolling, insertion or send; coverage is incomplete and page-visible only.',
    inputSchema: withConversation(readBody), annotations: annotations(true), wrapper: 'transcript' },
  { name: 'submit_conversation_turn', method: 'POST', path: '/conversations/{conversation}/turns', runtime: 'submit', kind: 'submit', body: submitBody, status: 202,
    description: `EXTERNAL EFFECT: insert/submit one confirmed keyed turn, subject to durable exact-thread fencing and expectedRevision. Registration acknowledgement is not delivery or reply completion; observe get_conversation, then reconcile uncertainty. Same key+payload replays read-only. NEVER automatically retry or replace the key after timeout/unknown delivery. ${evidence}`,
    inputSchema: withConversation(submitBody), annotations: annotations(false), wrapper: 'conversation' },
  { name: 'reconcile_conversation', method: 'POST', path: '/conversations/{conversation}/reconcile', runtime: 'reconcile', kind: 'reconcile', body: reconcileBody,
    description: 'Explicit reconciliation of the current or selected historical turn: may inspect browser and persist evidence; NEVER inserts or submits. Not-found/timeout/user assertions cannot clear unknown delivery.',
    inputSchema: withConversation(reconcileBody), annotations: annotations(false), wrapper: 'conversation' },
  { name: 'finish_conversation', method: 'POST', path: '/conversations/{conversation}/finish', runtime: 'finish', kind: 'finish', body: finishBody,
    description: `Stop/flush owned capture and release resources. Does not resend, erase unknown-delivery fences or assert capture acceptance. Optional closeTab is explicit and ownership checked. ${evidence}`,
    inputSchema: withConversation(finishBody), annotations: annotations(false), wrapper: 'conversation' },
]);

// ---------------------------------------------------------------------------
// Send truthfulness.
//
// A send tool call returns a REGISTRATION ACKNOWLEDGEMENT: it proves the runtime accepted
// the request, never that a prompt reached the provider. Only the turn journal knows what
// happened to the prompt. Every send verdict below is derived from the journal's own phase
// and delivery state, cross-checked against the attempt's own send state, and fails closed
// to "unproven" whenever those two records disagree. Nothing here sends, types or mutates.
// ---------------------------------------------------------------------------

const TERMINAL_SEND_PHASES = new Set(['blocked', 'delivered', 'unknown']);
export const SEND_OUTCOME_TIMEOUT_MS = 15000;
export const SEND_OUTCOME_POLL_MS = 100;

// undefined = the journal could not be read at all; null = the journal is readable and has
```

_First 80 of 204 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
