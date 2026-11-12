// The Studio process owns the browser. This adapter only uses its conversation HTTP API.
import { appendFileSync, readFileSync } from 'node:fs';
import { parseRelayChatIntent } from '../../src/studio/relay-chat-intent.mjs';

const code = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value) ? value : null;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const providerOf = record => record.target?.provider ?? record.text?.match(/^@(chatgpt|claude|qwen|zai)(?::[\w.-]+)?(?:@[\w.-]+)?\s/)?.[1] ?? 'chatgpt';
const safeFailure = record => record.status === 'failed' && /^(DRAFT_PRESENT|UNSUPPORTED_STUDIO_TARGET|UNSUPPORTED_STUDIO_CONTINUATION|STUDIO_CONVERSATION_BLOCKED)(?:\b|:)/.test(record.result ?? '');

// Read every latest bridge revision; a 200-record preview cannot prove that an older binding is absent.
function previousCommand(store, cmd, provider) {
  if (!cmd.conversationId) return { previous: null, count: 0 };
  const records = new Map();
  for (const line of readFileSync(store.file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const record = JSON.parse(line); if (/^cmd-[0-9a-f]{16}$/.test(record?.id)) records.set(record.id, record); } catch { /* A torn tail has no usable record. */ }
  }
  let previous = null, count = 0;
  for (const record of records.values()) {
    if (record.id === cmd.id) return { previous, count };
    if (record.conversationId === cmd.conversationId && record.transport === cmd.transport && providerOf(record) === provider) { previous = record; count++; }
  }
  throw new Error('BRIDGE_COMMAND_MISSING');
}

export function createStudioRelayChat({ url, store, fetchImpl = fetch }) {
  let base;
  try { base = new URL(url); } catch { throw new Error('Studio URL must be a loopback HTTP origin'); }
  if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) || base.origin !== url || base.username || base.password) throw new Error('Studio URL must be a loopback HTTP origin');
  let stopped = false;
  async function request(route, body) {
    const response = await fetchImpl(base.origin + '/api/v1' + route, {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    });
    let result; try { result = await response.json(); } catch { throw new Error('STUDIO_INVALID_RESPONSE'); }
    if (!response.ok) throw Object.assign(new Error(code(result?.code) ?? 'STUDIO_HTTP_ERROR'), { code: code(result?.code), status: response.status, conversationId: result?.conversationId });
    return result.conversation;
  }
  const finish = async id => { try { await request(`/conversations/${encodeURIComponent(id)}/finish`, { closeTab: false }); } catch { /* Keep the recorded outcome; never retry a send. */ } };
  async function handle({ cmd, rec, provider, model, effort, prompt }) {
    let id = null, submitted = false, safeToFinish = false;
    const key = cmd.studioRequestKey;
    const fail = text => store.reply(cmd.id, text, { status: 'failed' });
    try {
      // The key and prompt bytes MUST originate from this exact claimed bridge
      // record. No inferred key and no separately modified prompt can send.
      if (!/^cmd-[a-f0-9]{16}$/.test(cmd.id ?? '') ||
          key !== 'relay-' + cmd.id || rec.studioRequestKey !== key ||
          rec.id !== cmd.id || rec.consumer !== 'harness' || rec.status !== 'claimed')
        { fail('STUDIO_RELAY_BINDING_MISSING'); return; }
      const canonical = parseRelayChatIntent(cmd);
      if (canonical.provider !== provider || canonical.model !== model ||
          canonical.effort !== effort || canonical.prompt !== prompt)
        { fail('STUDIO_RELAY_INTENT_CHANGED'); return; }
      if (provider !== 'chatgpt' || model || effort || cmd.attachments?.length) { fail('UNSUPPORTED_STUDIO_TARGET: Studio mode supports default ChatGPT text only'); return; }
      const { previous, count } = previousCommand(store, cmd, provider);
      if (previous && previous.status !== 'done' && !safeFailure(previous)) { fail('STUDIO_PRIOR_OUTCOME_UNCERTAIN: prior command must be reconciled'); return; }
      let created;
      let blockedInitial = false;
      if (previous && !cmd.newChat && count === 1 && previous.status === 'failed' && previous.result === 'DRAFT_PRESENT' && previous.studioConversationId && previous.studioTurnKey) {
        const prior = await request(`/conversations/${encodeURIComponent(previous.studioConversationId)}`);
        blockedInitial = prior?.id === previous.studioConversationId && prior.site === provider && ['closed', 'blocked'].includes(prior.state) && prior.readiness?.reason === 'DRAFT_PRESENT' && Array.isArray(prior.turns) && prior.turns.length === 0;
      }
      if (previous && !cmd.newChat && !blockedInitial) {
        if (previous.status !== 'done' || !previous.studioConversationId || !previous.studioTurnKey) { fail('UNSUPPORTED_STUDIO_CONTINUATION: no verified previous binding'); return; }
        const prior = await request(`/conversations/${encodeURIComponent(previous.studioConversationId)}`);
        const turn = prior?.turns?.find(item => item.key === previous.studioTurnKey);
        const targetId = prior?.binding?.targetId, expectedThread = prior?.binding?.thread?.ref;
        if (prior?.site !== provider || prior.identity?.state !== 'bound' || !/^chatgpt-c:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(expectedThread ?? '') || typeof targetId !== 'string' || !targetId || turn?.reply?.verified !== true || turn.reply.settled !== true) throw new Error('STUDIO_BINDING_UNVERIFIED');
        if (prior.state === 'ready' && !prior.recovery?.pending) created = prior;
        else if (prior.state === 'closed') {
          created = await request('/conversations', { site: provider, targetId, expectedThread, freshTab: false });
          if (created?.binding?.targetId !== targetId || created?.binding?.thread?.ref !== expectedThread || created?.identity?.state !== 'bound') throw new Error('STUDIO_BINDING_CHANGED');
        } else throw new Error('STUDIO_CONTINUATION_NOT_READY');
      } else {
        created = await request('/conversations/create', { site: provider });
      }
      id = created?.id;
      if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(id) || !Number.isSafeInteger(created.revision)) throw new Error('STUDIO_INVALID_CONVERSATION');
      safeToFinish = true;
      // The durable claimed revision binds the caller-owned key and conversation before any submit.
      appendFileSync(store.file, JSON.stringify({ ...rec, studioConversationId: id, studioTurnKey: key, result: 'Studio conversation bound; preparing turn', updatedAt: new Date().toISOString(), rev: rec.rev + 1 }) + '\n', { mode: 0o600 });
      if (created.state === 'blocked') {
        const reason = code(created.readiness?.reason) ?? 'STUDIO_CONVERSATION_BLOCKED';
        if (reason === 'DRAFT_PRESENT') stopped = true;
        fail(reason); return;
      }
      submitted = true; safeToFinish = false;
      let submitError = null;
      try { await request(`/conversations/${encodeURIComponent(id)}/turns`, { key, prompt, confirm: true, expectedRevision: created.revision }); }
      catch (error) { submitError = error; }
      const deadline = Date.now() + 600000;
      while (Date.now() < deadline) {
        let snapshot;
        try { snapshot = await request(`/conversations/${encodeURIComponent(id)}`); }
        catch { await pause(2000); continue; }
        const turn = snapshot?.turns?.find(a => a.key === key);
        if (turn?.reply?.verified === true && turn.reply.settled === true && typeof turn.reply.text === 'string' && turn.reply.text.length) {
          safeToFinish = true; store.reply(cmd.id, `[${provider}] ${turn.reply.text}`.slice(0, 60000)); return;
        }
        if (turn?.phase === 'blocked' && turn.send?.state === 'not-attempted') {
          const reason = code(turn.reason) ?? code(snapshot.readiness?.reason) ?? 'STUDIO_TURN_BLOCKED';
          if (reason === 'DRAFT_PRESENT') stopped = true;
          safeToFinish = true; fail(reason); return;
        }
        if (!turn && submitError?.code && submitError.status >= 400 && submitError.status < 500 && ![408, 429].includes(submitError.status)) { safeToFinish = true; fail(submitError.code); return; }
        if (turn?.send?.state === 'uncertain' || ['uncertain', 'needs-reconciliation'].includes(turn?.phase) || snapshot?.state === 'needs-reconciliation') break;
        await pause(2000);
      }
      fail(`uncertain, not resent (Studio conversation ${id}; key ${key})`);
    } catch (error) {
      const reason = code(error?.code) ?? code(error?.message) ?? 'STUDIO_REQUEST_FAILED';
      if (reason === 'DRAFT_PRESENT') stopped = true;
      try { fail(submitted ? `uncertain, not resent (${reason}; key ${key})` : reason); } catch { /* A claimed command remains claimed on persistence failure. */ }
    } finally {
      if (id && safeToFinish) await finish(id);
    }
  }
  return { handle, halted: () => stopped };
}
