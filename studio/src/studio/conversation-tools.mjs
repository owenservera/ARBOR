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
  { name: 'chatgpt_surface', method: 'POST', path: '/chatgpt-surface', runtime: 'chatgptSurface', kind: 'chatgptSurface',
    body: schema({targetId:string(256)},['targetId']),
    inputSchema: schema({targetId:string(256)},['targetId']), annotations:annotations(true),
    description:'Observe fixed ChatGPT semantic control candidates in the current verified browser target. No navigation, locator verification, settings changes, plugin actions, or account entitlement assertion.' },
  { name: 'search_chatgpt_visible', method: 'POST', path: '/chatgpt-visible-search', runtime: 'searchVisibleChatGPT', kind: 'searchVisibleChatGPT',
    body: schema({targetId:string(256),query:string(300),...Object.fromEntries(Object.entries(CHAT_INDEX_LIMITS).map(([name,spec])=>[name,bounds(spec)]))},['targetId','query']),
    inputSchema: schema({targetId:string(256),query:string(300),...Object.fromEntries(Object.entries(CHAT_INDEX_LIMITS).map(([name,spec])=>[name,bounds(spec)]))},['targetId','query']),
    annotations:annotations(true), description:'Locally filter the bounded rendered ChatGPT chat-index by title or thread reference. No provider search, page input, or complete history claim.' },
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
// no turn for this key. The two are different facts and must not be collapsed.
const journalTurnFor = (conversationRuntime, conversationId, key) => {
  try {
    const journal = conversationRuntime?.journalSnapshot?.(conversationId);
    if (!journal || !Array.isArray(journal.turns)) return undefined;
    return journal.turns.find((t) => t?.key === key) ?? null;
  } catch { return undefined; }
};

// The blocking composer draft, by presence and length only. The owner's draft text never
// leaves the browser and is never carried into a result, a receipt or a log.
const blockingDraft = (view) => {
  const draft = view?.readiness?.draft;
  if (!draft || typeof draft !== 'object') return null;
  const chars = Number.isSafeInteger(draft.chars) ? draft.chars : null;
  const present = typeof draft.present === 'boolean' ? draft.present : chars !== null && chars > 0;
  if (!present && chars === 0) return null;
  return { present, chars };
};

const outcomeFrom = (turn, attempt, view) => {
  const phase = typeof turn?.phase === 'string' ? turn.phase : null;
  const deliveryState = typeof turn?.delivery?.state === 'string' ? turn.delivery.state : null;
  const sendState = typeof attempt?.send?.state === 'string' ? attempt.send.state : null;
  const reason = attempt?.reason ?? (typeof turn?.reason === 'string' ? turn.reason : null);
  const base = { turnId: typeof turn?.id === 'string' ? turn.id : null, phase, deliveryState, sendState,
    reason, draft: null, sent: null, state: 'unknown' };
  if (phase === 'blocked') {
    // A blocked journal turn carries the actuator's own pre-effect proof: nothing was typed
    // and nothing was dispatched. If the attempt claims otherwise, the two records disagree
    // and the verdict stays unproven rather than picking a winner.
    if (sendState !== null && sendState !== 'not-attempted') return base;
    return { ...base, state: 'not-sent', sent: false, draft: blockingDraft(view) };
  }
  if (phase === 'delivered' && deliveryState === 'observed') {
    if (sendState !== null && sendState !== 'observed') return base;
    return { ...base, state: 'delivery-observed', sent: true };
  }
  if (phase === 'unknown') return base; // uncertain delivery: never claimed as sent
  return { ...base, state: 'in-flight' }; // preparing | typing | dispatching
};

// Synchronous read of the journal's own verdict for one durable request key.
// Returns null when there is nothing to judge (no runtime, unreadable journal, no turn).
export function readSendOutcome(conversationRuntime, conversationId, key) {
  if (!conversationRuntime || !conversationId || !key) return null;
  if (typeof conversationRuntime.journalSnapshot !== 'function') return null;
  const turn = journalTurnFor(conversationRuntime, conversationId, key);
  if (!turn) return null;
  return outcomeFrom(turn, null, null);
}

// Wait (bounded, read-only) for the journal to close this turn, then report what happened.
// The wait never sends and never retries: it only watches the journal the runtime owns.
export async function resolveSendOutcome(conversationRuntime, conversationId, key, options = {}) {
  if (!conversationRuntime || !conversationId || !key) return null;
  if (typeof conversationRuntime.journalSnapshot !== 'function') return null;
  const timeoutMs = Number.isSafeInteger(options.timeoutMs) ? Math.max(0, options.timeoutMs) : SEND_OUTCOME_TIMEOUT_MS;
  const pollMs = Number.isSafeInteger(options.pollMs) ? Math.max(1, options.pollMs) : SEND_OUTCOME_POLL_MS;
  const started = Date.now();
  let turn;
  for (;;) {
    turn = journalTurnFor(conversationRuntime, conversationId, key);
    if (turn === undefined) return null; // the journal is unreadable: no verdict is possible
    if (turn && TERMINAL_SEND_PHASES.has(turn.phase)) break;
    const elapsed = Date.now() - started;
    if (elapsed >= timeoutMs) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(pollMs, timeoutMs - elapsed)));
  }
  let view = null;
  try { view = await conversationRuntime.get(conversationId); } catch { view = null; }
  const attempts = Array.isArray(view?.turns) ? view.turns : [];
  const attempt = attempts.find((t) => t?.key === key) ?? null;
  if (!turn) {
    // The journal has no turn for this key yet. A creation turn reserves its journal turn only
    // after the send, so journal silence is not proof of a no-send: report it as unproven.
    return { state: 'in-flight', sent: null, reason: null, draft: null, turnId: null, phase: null,
      deliveryState: null, sendState: typeof attempt?.send?.state === 'string' ? attempt.send.state : null };
  }
  return outcomeFrom(turn, attempt, view);
}

export function validateConversationTool(name, args = {}) {
  const definition = CONVERSATION_TOOLS.find((tool) => tool.name === name);
  if (!definition) throw problem(404, 'Unknown conversation tool', 'UNKNOWN_CONVERSATION_TOOL');
  object(args, 'arguments');
  for (const required of definition.inputSchema.required) if (args[required] === undefined) throw problem(400, 'Missing tool argument', 'INVALID_TOOL_ARGUMENTS');
  if (Object.keys(args).some((key) => !Object.hasOwn(definition.inputSchema.properties, key))) throw problem(400, 'Unknown tool argument', 'INVALID_TOOL_ARGUMENTS');
  if (Object.hasOwn(definition.inputSchema.properties, 'conversation') && (typeof args.conversation !== 'string' || !new RegExp(conversation.pattern).test(args.conversation))) throw problem(400, 'Invalid conversation id', 'INVALID_TOOL_ARGUMENTS');
  const body = Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'conversation'));
  if (definition.kind) validateConversationBody(definition.kind, body);
  if (definition.kind === 'connect' && (body.site !== 'chatgpt' || typeof body.targetId !== 'string' || !body.targetId.trim()
    || typeof body.expectedThread !== 'string' || !new RegExp(threadPattern).test(body.expectedThread) || body.freshTab !== undefined && body.freshTab !== false)) throw problem(400, 'An existing exact thread is required', 'INVALID_TOOL_ARGUMENTS');
  if (definition.kind === 'submit' && /[\u0000-\u001f\u007f]/.test(body.key)) throw problem(400, 'Invalid request key', 'INVALID_TOOL_ARGUMENTS');
  return { definition, body, conversation: args.conversation };
}

// One execution path for conversation tools, shared by the MCP/HTTP tool registry and the
// harness run executor: validate through the same schema, dispatch to the same runtime owner.
export async function executeConversationTool(conversationRuntime, name, args = {}) {
  const definition = CONVERSATION_TOOLS.find((tool) => tool.name === name);
  if (!definition) throw problem(404, 'Unknown conversation tool', 'UNKNOWN_CONVERSATION_TOOL');
  const valid = validateConversationTool(name, args);
  const handler = conversationRuntime[definition.runtime];
  if (typeof handler !== 'function') throw problem(501, 'Owning runtime capability unavailable', 'CONVERSATION_CAPABILITY_UNAVAILABLE');
  // Fresh creation is the SAME runtime.connect implementation. The caller cannot override
  // freshTab/targetId; this never instantiates an extra driver or invokes a provider send.
  const argsForOwner = definition.kind === 'create' ? [{ site: valid.body.site, freshTab: true }]
    : valid.conversation !== undefined
      ? definition.kind ? [valid.conversation, valid.body] : [valid.conversation]
      : definition.kind ? [valid.body] : [];
  return handler.apply(conversationRuntime, argsForOwner);
}

export function registerConversationTools({ add, conversationRuntime }) {
  if (!conversationRuntime) return; // Do not advertise a missing owner or construct a replacement.
  for (const tool of CONVERSATION_TOOLS) add(tool.method, tool.path, tool.description, async ({ p = {}, body = {} }) => {
    const args = { ...body, ...(p.conversation !== undefined ? { conversation: p.conversation } : {}) };
    const value = await executeConversationTool(conversationRuntime, tool.name, args);
    return tool.wrapper ? { [tool.wrapper]: value } : value;
  }, { body: tool.body, tool: tool.name, annotations: tool.annotations, inputSchema: tool.inputSchema,
    pathParameters: { conversation }, successStatus: tool.status ?? 200 });
}
