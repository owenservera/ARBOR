# File: studio/bin/lib/relay-chat-studio.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/relay-chat-studio.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9312 B |
| Lines | 121 |
| Hash | 56223c7e3602 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| code | function | 5 | no | const code = value =&gt; typeof value === &#39;string&#39; &amp;&amp; /^[A-Z][A-Z0-9_]{0,79}$/.test(value) ? value : null; |
| pause | function | 6 | no | const pause = ms =&gt; new Promise(resolve =&gt; setTimeout(resolve, ms)); |
| providerOf | function | 7 | no | const providerOf = record =&gt; record.target?.provider ?? record.text?.match(/^@(chatgpt\|claude\|qwen\|zai)(?::[\\w.-]+)?(?:@[\\w.-]+)?\\s/)?.[1] ?? &#39;chatgpt&#39;; |
| safeFailure | function | 8 | no | const safeFailure = record =&gt; record.status === &#39;failed&#39; &amp;&amp; /^(DRAFT_PRESENT\|UNSUPPORTED_STUDIO_TARGET\|UNSUPPORTED_STUDIO_CONTINUATION\|STUDIO_CONVERSATION_BLOCKED)(?:\\b\|:)/.test(record.result ?? &#39;&#39;); |
| previousCommand | function | 11 | no | function previousCommand(store, cmd, provider) { |
| records | const | 13 | no | const records = new Map(); |
| previous | variable | 18 | no | let previous = null, count = 0; |
| createStudioRelayChat | function | 26 | yes | export function createStudioRelayChat({ url, store, fetchImpl = fetch }) { |
| base | variable | 27 | no | let base; |
| stopped | variable | 30 | no | let stopped = false; |
| request | function | 31 | no | async function request(route, body) { |
| response | const | 32 | no | const response = await fetchImpl(base.origin + &#39;/api/v1&#39; + route, { method: body === undefined ? &#39;GET&#39; : &#39;POST&#39;, redirect: &#39;error&#39;, signal: AbortSignal.timeout(30000), ...(body === undefined ? {} : {… |
| result | variable | 36 | no | let result; try { result = await response.json(); } catch { throw new Error(&#39;STUDIO_INVALID_RESPONSE&#39;); } |
| finish | function | 40 | no | const finish = async id =&gt; { try { await request(`/conversations/${encodeURIComponent(id)}/finish`, { closeTab: false }); } catch { /* Keep the recorded outcome; never retry a send. */ } }; |
| handle | function | 41 | no | async function handle({ cmd, rec, provider, model, effort, prompt }) { |
| id | variable | 42 | no | let id = null, submitted = false, safeToFinish = false; |
| key | const | 43 | no | const key = cmd.studioRequestKey; |
| fail | function | 44 | no | const fail = text =&gt; store.reply(cmd.id, text, { status: &#39;failed&#39; }); |
| canonical | const | 52 | no | const canonical = parseRelayChatIntent(cmd); |
| created | variable | 59 | no | let created; |
| blockedInitial | variable | 60 | no | let blockedInitial = false; |
| prior | const | 62 | no | const prior = await request(`/conversations/${encodeURIComponent(previous.studioConversationId)}`); |
| prior | const | 67 | no | const prior = await request(`/conversations/${encodeURIComponent(previous.studioConversationId)}`); |
| turn | const | 68 | no | const turn = prior?.turns?.find(item =&gt; item.key === previous.studioTurnKey); |
| targetId | const | 69 | no | const targetId = prior?.binding?.targetId, expectedThread = prior?.binding?.thread?.ref; |
| reason | const | 85 | no | const reason = code(created.readiness?.reason) ?? &#39;STUDIO_CONVERSATION_BLOCKED&#39;; |
| submitError | variable | 90 | no | let submitError = null; |
| deadline | const | 93 | no | const deadline = Date.now() + 600000; |
| snapshot | variable | 95 | no | let snapshot; |
| turn | const | 98 | no | const turn = snapshot?.turns?.find(a =&gt; a.key === key); |
| reason | const | 103 | no | const reason = code(turn.reason) ?? code(snapshot.readiness?.reason) ?? &#39;STUDIO_TURN_BLOCKED&#39;; |
| reason | const | 113 | no | const reason = code(error?.code) ?? code(error?.message) ?? &#39;STUDIO_REQUEST_FAILED&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| ../../src/studio/relay-chat-intent.mjs | import | 3 | [studio/src/studio/relay-chat-intent.mjs](../../src/studio/relay-chat-intent.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/relay-chat-mvp.mjs](../relay-chat-mvp.mjs.md) | ./lib/relay-chat-studio.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 122 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
