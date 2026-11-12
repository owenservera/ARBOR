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

// The scope spelling the receipt schema admits (schemas/chat-receipt.v1.json, scopes.items.pattern):
// one of the known sites, a dot, one of the three actions. A string that does not match is a typo,
// not a scope: it is refused, and the receipt records the refusal rather than a scope the schema
// forbids. The refused text itself is still named on the outcome.
const SCOPE_PATTERN = /^(chatgpt|claude|gemini|qwen|deepseek|zai|minimax|kimi)\.(draft|send|delegate)$/;

/** The scope a receipt may carry, or null when the requested scope is not a contract scope. */
function receiptScope(scope) {
  const text = typeof scope === 'string' ? scope : '';
  return SCOPE_PATTERN.test(text) ? text : null;
}

const ACTOR_KINDS = new Set(['owner', 'agent', 'phone']);

function sha256(text) {
  return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');
}
function digest(text) { return 'sha256:' + sha256(text); }
function receiptIdOf(requestId) { return sha256('channel-receipt/v1:' + requestId); }
function asText(value) { return value === null || value === undefined ? '' : String(value); }
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Actor is an attribution field, never an authority field. Missing actor is attributed to the agent. */
function asActor(actor) {
  if (!isPlainObject(actor)) return { kind: 'agent', id: 'unspecified' };
  const kind = ACTOR_KINDS.has(actor.kind) ? actor.kind : 'agent';
  const id = typeof actor.id === 'string' && actor.id.length ? actor.id : 'unspecified';
  return { kind, id };
}

/** Receipt is schema-clean: digests and decisions only, never reply bodies. See schemas/chat-receipt.v1.json. */
function baseReceipt({ requestId, taskId, actor, scope, thread, effect, promptDigest, replyDigest, journalKey, journalPath, turns, refusals, createdAt }) {
  const carriedScope = receiptScope(scope);
  return {
    schema: 'vivim.chat-receipt/1',
    receiptId: receiptIdOf(requestId),
    requestId,
    taskId: taskId ?? null,
    actor,
    scopes: carriedScope ? [carriedScope] : [],
    thread: { before: asText(thread && thread.before), after: asText(thread && thread.after) },
    effect,
    promptDigest,
    replyDigest: replyDigest ?? null,
    journalKey: journalKey ?? requestId,
    journalPath: journalPath ?? null,
    turns: Number.isInteger(turns) ? turns : 0,
    createdAt,
    refusals: refusals ? [...refusals] : [],
  };
}

export function createChatChannel({ transport, verify, store, now = () => new Date(), log, dcb = null } = {}) {
  if (!transport || typeof transport.send !== 'function' || typeof transport.createThread !== 'function') {
    throw new Error('CHANNEL_TRANSPORT_REQUIRED: transport must implement send({...}) and createThread({...})');
  }
  if (!store || typeof store.get !== 'function' || typeof store.put !== 'function'
    || typeof store.isRevoked !== 'function' || typeof store.revoke !== 'function') {
    throw new Error('CHANNEL_STORE_REQUIRED: store must implement get/put/isRevoked/revoke');
  }

  /**
   * Persist the receipt, then re-read it so a replay in this process returns the identical object
   * (invariant 5: duplicate requestId -> the ORIGINAL receipt, unchanged).
   */
  async function record(receipt, outcome) {
    await store.put(receipt);
    if (typeof store.putOutcome === 'function') await store.putOutcome(receipt.requestId, outcome);
    if (typeof store.clearPending === 'function') await store.clearPending(receipt.requestId);
    if (typeof log === 'function') log(`channel receipt ${receipt.receiptId} effect=${receipt.effect}`);
    const stored = await store.get(receipt.requestId);
    return { receipt: stored ?? receipt, outcome };
  }

  /** A replay whose outcome body was not cached: the reply body is not recoverable from digests. */
  function replayOutcome(receipt) {
    return {
      effect: receipt.effect,
      reply: '',
      solution: null,
      turns: [],
      verifiedLocally: [],
      assertedByModel: [],
      open: ['replayed stored receipt; reply body is not retained in the receipt'],
      requestId: receipt.requestId,
      threadId: receipt.thread.after || receipt.thread.before || null,
    };
  }

  async function run(input = {}) {
    const requestId = input.requestId;
    if (typeof requestId !== 'string' || !requestId.length) throw new Error('CHANNEL_REQUEST_ID_REQUIRED');

    const prompt = typeof input.prompt === 'string' ? input.prompt : '';
    const promptDigest = digest(prompt);

    // Idempotency first: a caller-stable requestId replaying returns the ORIGINAL receipt and makes
    // no transport call. Checked before scope validation so a retry of a refused task is also stable.
    const existing = await store.get(requestId);
    if (existing) {
      // Replay integrity: the same key with a different payload is a different request wearing a
      // used name. Refuse it WITHOUT persisting, so the original receipt is never overwritten.
      if (existing.promptDigest && existing.promptDigest !== promptDigest) {
        const denial = baseReceipt({
          requestId, taskId: input.taskId ?? null, actor: asActor(input.actor),
          scope: typeof input.scope === 'string' && input.scope.length ? input.scope : `${DEFAULT_SITE}.send`,
          thread: { before: '', after: '' }, effect: 'DENIED', promptDigest, replyDigest: null,
          journalKey: requestId, journalPath: null, turns: 0, refusals: [REF_DENIED],
          createdAt: now().toISOString(),
        });
        return {
          receipt: denial,
          outcome: {
            effect: 'DENIED', effort: resolveEffort(input.effort, prompt), reply: '', solution: null,
            turns: [], verifiedLocally: [], assertedByModel: [],
            open: ['requestId was already used with a different payload'], requestId, threadId: null,
          },
        };
      }
      const cached = typeof store.getOutcome === 'function' ? await store.getOutcome(requestId) : null;
      return { receipt: existing, outcome: cached ?? replayOutcome(existing) };
    }

    const requestedScope = typeof input.scope === 'string' && input.scope.length ? input.scope : `${DEFAULT_SITE}.send`;
    const resolvedScope = resolveScope(requestedScope);
    const scope = resolvedScope ? resolvedScope.scope : requestedScope;
    const taskId = input.taskId ?? null;
    const actor = asActor(input.actor);
    // Effort is routed per request: explicit, else by task shape (high for coding/brainstorm/algorithm).
    const effort = resolveEffort(input.effort, prompt);
    const wirePrompt = withEffort(prompt, effort);
    const taskThread = input.taskThread ?? (isPlainObject(input.task) ? input.task.thread : undefined);
    const budgetMs = Number.isFinite(input.timeoutMs) ? input.timeoutMs
      : Number.isFinite(input.deadlineMs) ? input.deadlineMs
        : DEFAULT_TIMEOUT_MS;
    const deadline = new Date(now().getTime() + budgetMs);
    const createdAt = now().toISOString();

    async function refuse({ effect, refusal, thread, reason, scopes }) {
      const receipt = baseReceipt({
        requestId, taskId, actor, scope: scopes === null ? null : scope,
        thread: thread ?? { before: '', after: '' },
        effect, promptDigest, replyDigest: null, journalKey: requestId, journalPath: null,
        turns: 0, refusals: refusal ? [refusal] : [], createdAt,
      });
      return record(receipt, {
        effect, reply: '', solution: null, turns: [], verifiedLocally: [], assertedByModel: [],
        open: reason ? [reason] : [], requestId, threadId: null,
      });
    }

    // --- scope enforcement -----------------------------------------------------------
    // Owner policy (2026-11-03): remove the friction, not the record. A caller that names no
    // scope is treated as a single send; only an explicitly unknown scope is refused, because a
    // typo must not silently turn into a provider send.
    if (!resolvedScope) {
      return refuse({
        effect: 'DENIED', refusal: REF_DENIED,
        reason: `unsupported scope "${String(scope)}"`,
      });
    }
    const { site, action } = resolvedScope;
    // The scope names the site; the transport is the one that speaks to it. A transport that
    // declares which site it serves must agree with the scope: a claude transport asked for a
    // chatgpt scope would otherwise dispatch to claude and record the turn under chatgpt.send, so
    // the canonical site's scope could name another site's dispatch.
    if (typeof transport.site === 'string' && transport.site.length && transport.site !== site) {
      return refuse({
        effect: 'DENIED', refusal: REF_DENIED,
        reason: `scope names site "${site}" but the transport serves "${transport.site}"`,
      });
    }
    if (action === 'draft') {
      // Preview only. Never calls transport, never sends.
      return refuse({ effect: 'OK', refusal: null, thread: { before: '', after: '' }, reason: null });
    }
    let turnsLimit = 1;
    if (action === 'delegate') {
      if (!Number.isInteger(input.maxTurns) || input.maxTurns < MIN_TURNS || input.maxTurns > MAX_TURNS) {
        return refuse({
          effect: 'DENIED', refusal: REF_DENIED,
          reason: `${site}.delegate requires maxTurns between ${MIN_TURNS} and ${MAX_TURNS}`,
        });
      }
      turnsLimit = input.maxTurns;
    }

    // --- thread resolution -----------------------------------------------------------
    const open = [];
    let before = '';
    let after = '';
    let threadId;
    if (input.thread === 'new') {
      // Creation is delegated to Studio; the channel never opens a tab (invariant 1).
      let created;
      try {
        created = await transport.createThread({ actor, site });
      } catch (error) {
        return refuse({ effect: 'FAILED', refusal: null, reason: `thread creation failed: ${String(error && error.message ? error.message : error)}` });
      }
      if (!isPlainObject(created) || typeof created.threadId !== 'string' || !created.threadId.length) {
        return refuse({ effect: 'FAILED', refusal: null, reason: 'thread creation returned no threadId' });
      }
      threadId = created.threadId;
      before = asText(taskThread);
      after = threadId;
    } else if (typeof input.thread === 'string' && input.thread.length) {
      // Owner policy (2026-11-03): a thread that differs from the task binding is a warning, not a
      // refusal. The caller is the agent, and blocking here only ever stopped legitimate work.
      if (taskThread !== undefined && taskThread !== null && String(input.thread) !== String(taskThread)) {
        open.push(`thread override: task bound to ${asText(taskThread)}, used ${input.thread}`);
      }
      threadId = input.thread;
      before = asText(taskThread);
      after = threadId;
    } else if (taskThread !== undefined && taskThread !== null && String(taskThread).length) {
      threadId = String(taskThread);
      before = threadId;
      after = threadId;
    } else {
      return refuse({
        effect: 'DENIED', refusal: REF_THREAD,
        reason: 'no thread bound to task and none requested',
      });
    }

    // --- turn loop -------------------------------------------------------------------
    const assertedByModel = [];
    const turns = [];
    const refusals = [];
    let effect = null;
    let journalKey = null;
    let journalPath = null;
    let replyText = '';
    let solution = null;

    // Write-ahead marker: if this process dies mid-dispatch, a pending entry survives without a
    // receipt, so the next reader sees unresolved uncertainty instead of a silent gap.
    if (typeof store.putPending === 'function') {
      await store.putPending({ requestId, taskId, promptDigest, effort, threadId, createdAt });
    }

    for (let turnIndex = 0; turnIndex < turnsLimit; turnIndex++) {
      // Invariant 3: revocation is re-checked immediately before EVERY send, not once per task.
      if (await store.isRevoked(taskId)) {
        effect = 'REVOKED';
        refusals.push(REF_REVOKED);
        open.push(`revoked after ${turns.length} turn(s)`);
        break;
      }
      if (now().getTime() > deadline.getTime()) {
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} deadline exceeded`);
        break;
      }

      // DCB Host facade (Lane A wiring): the same journal-input candidate compilation the
      // conversation path performs, immediately before the transport effect. The Host passes
      // only existing evidence (the exact prompt, the bound thread, the served site); the
      // facade refuses whatever it cannot evidence. The current Host has no source-disclosure
      // grant evidence store, so this runs OBSERVATION-ONLY: the outcome is recorded on the
      // run's open items and the log, and NEVER blocks the send (the receipt schema is frozen;
      // the facade is never the effect owner — isSendAuthorized is false by construction).
      if (dcb?.facade) {
        try {
          await dcb.facade.prepareJournalCandidate({
            userPrompt: prompt, threadRef: threadId,
            planInput: { taskRef: `channel:${requestId}`.slice(0, 192), taskText: prompt,
              audience: { principalRef: 'owner:studio-host', projectRef: null, activityRef: 'activity:channel',
                destinationProvider: site, destinationModelVerified: false },
              now: now().toISOString(), profile: 'continuum', purpose: 'personal_continuum' },
          });
          open.push('dcb context observation: journal-input candidate compiled (observation-only, not a send permit)');
        } catch (error) {
          open.push(`dcb context observation: not compiled (${error?.code ?? 'DCB_FACADE_UNAVAILABLE'}); send not blocked`);
        }
        if (typeof log === 'function') log(`channel ${requestId} ${open.at(-1)}`);
      }

      let result;
      const startedAt = now().toISOString();
      try {
        result = await transport.send({ threadId, prompt: wirePrompt, requestId, actor, site, deadline, attachment: input.attachment });
      } catch (error) {
        // Invariant 6: a transport failure is terminal for that turn. Recorded, never retried.
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} transport failure: ${String(error && error.message ? error.message : error)}`);
        break;
      }
      if (!isPlainObject(result)) {
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} returned no result`);
        break;
      }
      if (typeof result.journalKey === 'string' && result.journalKey.length) journalKey = result.journalKey;
      if (typeof result.journalPath === 'string' && result.journalPath.length) journalPath = result.journalPath;
      if (result.effect === 'UNVERIFIED') {
        effect = 'UNVERIFIED';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} not verified`);
        break;
      }
      if (result.effect === 'FAILED') {
        effect = 'FAILED';
        open.push(`turn ${turnIndex} failed: ${asText(result.reason)}`);
        break;
      }
      if (result.effect === 'UNCERTAIN') {
        // Invariant 6: uncertainty is terminal for that turn and is never a success.
        effect = 'UNCERTAIN';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} uncertain: ${asText(result.reason)}`);
        break;
      }

      const turnReply = typeof result.reply === 'string' ? result.reply : '';
      if (!turnReply.length && typeof result.solution !== 'string') {
        // A send that returns nothing is not a delivered turn; never journal it as OK.
        effect = 'UNVERIFIED';
        refusals.push(REF_UNCERTAIN);
        open.push(`turn ${turnIndex} returned no reply`);
        break;
      }
      replyText = turnReply;
      const turnJournalKey = typeof result.journalKey === 'string' && result.journalKey.length
        ? result.journalKey : requestId;
      // Invariant 7: model prose is only ever evidence of what the model asserted.
      assertedByModel.push({ claim: turnReply, turnIndex, verbatim: true });
      turns.push({
        schema: 'vivim.chat-turn/1',
        index: turnIndex,
        requestId,
        threadId: typeof result.threadId === 'string' && result.threadId.length ? result.threadId : threadId,
        promptDigest,
        replyDigest: digest(turnReply),
        effect: 'OK',
        journalKey: turnJournalKey,
        startedAt,
        endedAt: now().toISOString(),
        effort,
        refusal: null,
      });

      // An explicit solution from the transport ends the delegation early; prose alone never does.
      if (typeof result.solution === 'string') {
        solution = result.solution;
        effect = 'OK';
        break;
      }
    }

    if (!effect) {
      if (action === 'send') {
        effect = 'OK';
        solution = replyText;
      } else {
        // Invariant 4: budget exhaustion is a PARTIAL outcome with a reason, never a success.
        effect = 'BUDGET_EXHAUSTED';
        refusals.push(REF_BUDGET);
        open.push(`delegate budget exhausted after ${turnsLimit} turn(s) without a solution`);
      }
    }

    // --- report split ----------------------------------------------------------------
    // Invariant 7: assertedByModel comes ONLY from model reply text; verifiedLocally ONLY from the hook.
    let verifiedLocally = [];
    if (typeof verify === 'function') {
      const verdicts = await verify(assertedByModel);
      verifiedLocally = Array.isArray(verdicts)
        ? verdicts.map((v) => ({ claim: asText(v && v.claim), evidence: asText(v && v.evidence) }))
        : [];
    }

    const receipt = baseReceipt({
      requestId, taskId, actor, scope, thread: { before, after }, effect,
      promptDigest, replyDigest: replyText.length ? digest(replyText) : null,
      journalKey: journalKey ?? requestId, journalPath, turns: turns.length, refusals, createdAt,
    });
    // Typed evidence: a reply we received is OBSERVED, not VERIFIED; only the local hook promotes
    // a claim to VERIFIED. Nothing without either is CLAIMED.
    const evidenceState = verifiedLocally.length ? 'VERIFIED' : (replyText.length ? 'OBSERVED' : 'CLAIMED');
    const outcome = {
      effect,
      effort,
      evidenceState,
      reply: replyText,
      solution,
      turns,
      assertedByModel,
      verifiedLocally,
      open,
      requestId,
      threadId: after || null,
    };
    return record(receipt, outcome);
  }

  return { run };
}
