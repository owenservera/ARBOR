// VIVIM-owned phone session route (WO-034).
//
// This module replaces the former OpenCode CLI bridge. It never spawns
// @opencode/cli, opencode.exe or any other child process: session reads and
// prompt admission run entirely on VIVIM-owned local state.
//
//   - the canonical bridge ledger (<dataRoot>/bridge/commands.jsonl),
//   - the source-verified live projection (<dataRoot>/live-state/<worldId>),
//   - the Studio thread-turn journal (reply evidence only).
//
// A prompt is admitted as one relay-chat command. The Studio executor claims
// it and owns the signed-in provider send; the Host never sends, approves or
// executes a provider action, and an ambiguous admission is never repeated.
//
// The former OpenCode-named file is now phone-sessions.mjs (WO-040: no OpenCode
// naming on shipped surfaces). The legacy `opencode/sessions*` relay path is
// kept only as a client-compatibility alias for already-deployed phone PWAs;
// both it and the VIVIM-native `sessions*` path resolve to this route.
import { createHash } from 'node:crypto';
import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';

const CONVERSATION = /^c-[a-f0-9]{16}$/;
const MESSAGE = /^msg_[a-zA-Z0-9]{1,120}$/;
const MODEL = /^[\w.-]{1,40}$/;
const EFFORT = /^[\w.-]{1,24}$/;
const MAX_TEXT = 4000;
const MAX_REPLY = 16000;
const MAX_TITLE = 300;
const MAX_SESSIONS = 20;
const MAX_MESSAGES = 40;
const fail = (status, message) => Object.assign(new Error(message), { status });
const text = (value, limit) => (typeof value === 'string' ? value.slice(0, limit) : '');
// The relay-chat routing prefix (@provider[:model][@effort]) is transport syntax,
// never user content. Studio publishes a reply as "[provider] <reply>".
const PREFIX = /^@([a-z]+)(?::([\w.-]+))?(?:@([\w.-]+))?\s+([\s\S]+)$/;
const stripPrefix = (value) => {
  const match = typeof value === 'string' ? PREFIX.exec(value) : null;
  return match ? match[4] : text(value, MAX_TEXT);
};
const stripProviderTag = (value, provider) => {
  const raw = text(value, MAX_REPLY);
  const tag = typeof provider === 'string' && provider ? `[${provider}] ` : '';
  return tag && raw.startsWith(tag) ? raw.slice(tag.length) : raw;
};

export function createPhoneSessions({ dataRoot, worldId = 'world-local', bridge, live, store } = {}) {
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot)) throw new TypeError('Absolute dataRoot required');
  if (!bridge || typeof bridge.list !== 'function') throw new TypeError('VIVIM bridge ledger required');
  if (!live || typeof live.worldTimeline !== 'function') throw new TypeError('VIVIM live projection required');
  if (!store || typeof store.putCommand !== 'function') throw new TypeError('VIVIM command store required');
  const admissionDir = path.join(dataRoot, 'bridge', 'phone-sessions');

  // Only relay-chat commands are VIVIM conversations. Anything else in the
  // ledger (bootstrap, grokbot) is never exposed on the phone session route.
  const commands = () => bridge.list({ limit: 200 }).items
    .filter(record => record.origin === 'relay' && record.mode === 'relay-chat' &&
      CONVERSATION.test(record.conversationId ?? ''))
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')) || a.id.localeCompare(b.id));

  function timeline() {
    try { return live.worldTimeline() ?? { conversations: [] }; }
    catch { return { conversations: [] }; }
  }

  // Conversations are the VIVIM-owned read model: the bridge ledger is the
  // canonical record, the source-verified projection supplies provider identity.
  function conversations() {
    const map = new Map();
    for (const record of commands()) {
      let entry = map.get(record.conversationId);
      if (!entry) {
        entry = { id: record.conversationId, provider: null, model: null, effort: null, title: '', updatedAt: null, records: [] };
        map.set(record.conversationId, entry);
      }
      entry.records.push(record);
      const target = record.target;
      if (target && typeof target === 'object' && !Array.isArray(target)) {
        if (typeof target.provider === 'string') entry.provider = target.provider;
        if (typeof target.model === 'string') entry.model = target.model;
        if (typeof target.effort === 'string') entry.effort = target.effort;
      }
      const stamp = record.updatedAt || record.createdAt || null;
      if (stamp && (!entry.updatedAt || stamp > entry.updatedAt)) entry.updatedAt = stamp;
      if (!entry.title) entry.title = stripPrefix(record.text).trim().slice(0, MAX_TITLE);
    }
    for (const conversation of timeline().conversations) {
      const entry = map.get(conversation.id);
      if (!entry) continue;
      if (!entry.provider && conversation.provider) entry.provider = conversation.provider;
      if (!entry.model && conversation.model) entry.model = conversation.model;
    }
    return [...map.values()];
  }

  function sessionList() {
    return conversations()
      .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
      .slice(0, MAX_SESSIONS)
      .map(entry => ({
        id: entry.id, title: entry.title || entry.id,
        provider: entry.provider, model: entry.model, updatedAt: entry.updatedAt,
      }));
  }

  // A transcript is the exact queued bytes plus the reply the Studio executor
  // posted for that same command. A queued or claimed command has no reply yet.
  function messagesOf(conversationId) {
    const entry = conversations().find(candidate => candidate.id === conversationId);
    if (!entry) return null;
    const messages = [];
    for (const record of entry.records) {
      const prompt = stripPrefix(record.text).trim();
      if (!prompt) continue;
      const messageId = MESSAGE.test(record.messageId ?? '') ? record.messageId : `msg-${record.id.slice(4)}`;
      messages.push({ id: messageId, type: 'user', text: prompt, createdAt: record.createdAt ?? null, completed: true });
      const reply = typeof record.result === 'string' ? record.result : null;
      if (reply !== null && record.status !== 'queued' && record.status !== 'claimed') {
        const failed = record.status === 'failed';
        messages.push({
          id: `${messageId}-reply`, type: 'assistant', text: stripProviderTag(reply, entry.provider),
          createdAt: record.doneAt ?? record.updatedAt ?? null, completed: true,
          ...(failed ? { error: true } : {}),
        });
      }
    }
    return messages.slice(-MAX_MESSAGES);
  }

  async function admitPrompt({ method, conversationId, body }) {
    if (method !== 'POST') throw fail(405, 'Method not allowed');
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['id', 'text'].includes(key)) ||
      !MESSAGE.test(body.id ?? '') || typeof body.text !== 'string' ||
      !body.text.trim() || body.text.length > MAX_TEXT) throw fail(400, 'Invalid phone prompt');
    const entry = conversations().find(candidate => candidate.id === conversationId);
    if (!entry) throw fail(404, 'Unknown conversation');
    if (!entry.provider) throw fail(409, 'Conversation has no provider target');
    if (entry.model != null && !MODEL.test(entry.model)) throw fail(409, 'Conversation target is not routable');
    if (entry.effort != null && !EFFORT.test(entry.effort)) throw fail(409, 'Conversation target is not routable');
    const key = createHash('sha256').update(`${conversationId}\0${body.id}`).digest('hex');
    // The command id is derived from the owner message, so an ambiguous repeat
    // is refused by the ledger itself as well as by the admission marker.
    const commandId = `cmd-${key.slice(0, 16)}`;
    // Journal before effect: admission is durable and exclusive before the
    // command is queued, so an uncertain send is never repeated.
    await mkdir(admissionDir, { recursive: true, mode: 0o700 });
    let marker;
    try { marker = await open(path.join(admissionDir, key), 'wx', 0o600); }
    catch (error) {
      if (error.code === 'EEXIST') throw fail(409, 'Prompt already admitted or uncertain; do not resend');
      throw fail(503, 'Phone admission unavailable');
    }
    try { await marker.writeFile(JSON.stringify({ conversationId, id: body.id, commandId, admittedAt: new Date().toISOString() })); }
    finally { await marker.close(); }
    const target = { provider: entry.provider, model: entry.model ?? null, effort: entry.effort ?? null };
    const prefix = '@' + target.provider + (target.model ? ':' + target.model : '') + (target.effort ? '@' + target.effort : '') + ' ';
    try {
      // One relay-chat command. The Studio executor claims it and owns the
      // signed-in provider send; the Host never performs a provider effect.
      await store.putCommand({
        id: commandId, text: prefix + body.text.trim(), kind: 'command', consumer: 'harness',
        mode: 'relay-chat', conversationId, target, messageId: body.id,
      });
    } catch {
      throw fail(503, 'VIVIM prompt outcome uncertain; do not resend');
    }
    return { accepted: true, id: body.id, sessionId: conversationId };
  }

  return async function route({ method, relayPath, body }) {
    const normalized = String(relayPath ?? '').replace(/^opencode\//, '');
    if (normalized === 'sessions') {
      if (method !== 'GET') throw fail(405, 'Method not allowed');
      return { sessions: sessionList() };
    }
    const match = /^sessions\/([^/]+)\/(messages|prompt)$/.exec(normalized);
    if (!match || !CONVERSATION.test(match[1])) throw fail(404, 'Not found');
    if (match[2] === 'messages') {
      if (method !== 'GET') throw fail(405, 'Method not allowed');
      const messages = messagesOf(match[1]);
      if (!messages) throw fail(404, 'Unknown conversation');
      return { messages };
    }
    return admitPrompt({ method, conversationId: match[1], body });
  };
}
