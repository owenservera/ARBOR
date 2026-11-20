# File: apps/vivim-host/phone-sessions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/vivim-host/phone-sessions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10090 B |
| Lines | 187 |
| Hash | fc9d5f2ba796 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONVERSATION | const | 23 | no | const CONVERSATION = /^c-[a-f0-9]{16}$/; |
| MESSAGE | const | 24 | no | const MESSAGE = /^msg_[a-zA-Z0-9]{1,120}$/; |
| MODEL | const | 25 | no | const MODEL = /^[\\w.-]{1,40}$/; |
| EFFORT | const | 26 | no | const EFFORT = /^[\\w.-]{1,24}$/; |
| MAX_TEXT | const | 27 | no | const MAX_TEXT = 4000; |
| MAX_REPLY | const | 28 | no | const MAX_REPLY = 16000; |
| MAX_TITLE | const | 29 | no | const MAX_TITLE = 300; |
| MAX_SESSIONS | const | 30 | no | const MAX_SESSIONS = 20; |
| MAX_MESSAGES | const | 31 | no | const MAX_MESSAGES = 40; |
| fail | function | 32 | no | const fail = (status, message) =&gt; Object.assign(new Error(message), { status }); |
| text | function | 33 | no | const text = (value, limit) =&gt; (typeof value === &#39;string&#39; ? value.slice(0, limit) : &#39;&#39;); |
| PREFIX | const | 36 | no | const PREFIX = /^@([a-z]+)(?::([\\w.-]+))?(?:@([\\w.-]+))?\\s+([\\s\\S]+)$/; |
| stripPrefix | function | 37 | no | const stripPrefix = (value) =&gt; { |
| stripProviderTag | function | 41 | no | const stripProviderTag = (value, provider) =&gt; { |
| raw | const | 42 | no | const raw = text(value, MAX_REPLY); |
| tag | const | 43 | no | const tag = typeof provider === &#39;string&#39; &amp;&amp; provider ? `[${provider}] ` : &#39;&#39;; |
| createPhoneSessions | function | 47 | yes | export function createPhoneSessions({ dataRoot, worldId = &#39;world-local&#39;, bridge, live, store } = {}) { |
| admissionDir | const | 52 | no | const admissionDir = path.join(dataRoot, &#39;bridge&#39;, &#39;phone-sessions&#39;); |
| commands | function | 56 | no | const commands = () =&gt; bridge.list({ limit: 200 }).items |
| timeline | function | 61 | no | function timeline() { |
| conversations | function | 68 | no | function conversations() { |
| map | const | 69 | no | const map = new Map(); |
| entry | variable | 71 | no | let entry = map.get(record.conversationId); |
| target | const | 77 | no | const target = record.target; |
| stamp | const | 83 | no | const stamp = record.updatedAt \|\| record.createdAt \|\| null; |
| entry | const | 88 | no | const entry = map.get(conversation.id); |
| sessionList | function | 96 | no | function sessionList() { |
| messagesOf | function | 108 | no | function messagesOf(conversationId) { |
| entry | const | 109 | no | const entry = conversations().find(candidate =&gt; candidate.id === conversationId); |
| messages | const | 111 | no | const messages = []; |
| prompt | const | 113 | no | const prompt = stripPrefix(record.text).trim(); |
| messageId | const | 115 | no | const messageId = MESSAGE.test(record.messageId ?? &#39;&#39;) ? record.messageId : `msg-${record.id.slice(4)}`; |
| reply | const | 117 | no | const reply = typeof record.result === &#39;string&#39; ? record.result : null; |
| failed | const | 119 | no | const failed = record.status === &#39;failed&#39;; |
| admitPrompt | function | 130 | no | async function admitPrompt({ method, conversationId, body }) { |
| entry | const | 136 | no | const entry = conversations().find(candidate =&gt; candidate.id === conversationId); |
| key | const | 141 | no | const key = createHash(&#39;sha256&#39;).update(`${conversationId}\\0${body.id}`).digest(&#39;hex&#39;); |
| commandId | const | 144 | no | const commandId = `cmd-${key.slice(0, 16)}`; |
| marker | variable | 148 | no | let marker; |
| target | const | 156 | no | const target = { provider: entry.provider, model: entry.model ?? null, effort: entry.effort ?? null }; |
| prefix | const | 157 | no | const prefix = &#39;@&#39; + target.provider + (target.model ? &#39;:&#39; + target.model : &#39;&#39;) + (target.effort ? &#39;@&#39; + target.effort : &#39;&#39;) + &#39; &#39;; |
| normalized | const | 172 | no | const normalized = String(relayPath ?? &#39;&#39;).replace(/^opencode\\//, &#39;&#39;); |
| messages | const | 181 | no | const messages = messagesOf(match[1]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 19 | external |
| node:fs/promises | import | 20 | external |
| node:path | import | 21 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](./direct-phone.mjs.md) | ./phone-sessions.mjs |
| [apps/vivim-host/test/phone-sessions.test.mjs](./test/phone-sessions.test.mjs.md) | ../phone-sessions.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 188 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
