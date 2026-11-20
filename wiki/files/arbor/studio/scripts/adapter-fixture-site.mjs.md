# File: studio/scripts/adapter-fixture-site.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/adapter-fixture-site.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9088 B |
| Lines | 188 |
| Hash | d8fb310faefe |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| V2 | const | 20 | no | const V2 = process.env.FIXTURE_V2 === &#39;1&#39;; |
| ATTR | const | 21 | no | const ATTR = V2 ? &#39;data-msg-role&#39; : &#39;data-role&#39;; |
| PORT | const | 22 | no | const PORT = Number(process.env.FIXTURE_PORT ?? 8443); |
| REPLIES | const | 24 | no | const REPLIES = [ |
| replyFor | function | 29 | no | const replyFor = (prompt) =&gt; REPLIES[[...prompt].reduce((a, c) =&gt; a + c.charCodeAt(0), 0) % REPLIES.length]; |
| page | function | 31 | no | const page = (threadId) =&gt; `&lt;!doctype html&gt; |
| ATTR | const | 58 | no | const ATTR = ${JSON.stringify(ATTR)}; |
| threadId0 | const | 59 | no | const threadId0 = ${JSON.stringify(threadId)}; |
| KEY | const | 60 | no | const KEY = &#39;nimbuschat.thread.v1&#39;; |
| thread | const | 61 | no | const thread = document.getElementById(&#39;thread&#39;); |
| form | const | 62 | no | const form = document.getElementById(&#39;composer&#39;); |
| ta | const | 63 | no | const ta = form.querySelector(&#39;textarea&#39;); |
| load | function | 65 | no | const load = () =&gt; { |
| save | function | 68 | no | const save = (t) =&gt; { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {} }; |
| state | variable | 69 | no | let state = load(); |
| render | function | 77 | no | const render = (msg) =&gt; { |
| el | const | 78 | no | const el = document.createElement(&#39;div&#39;); |
| assignThread | function | 86 | no | const assignThread = () =&gt; { |
| send | function | 92 | no | const send = async (text) =&gt; { |
| res | const | 98 | no | const res = await fetch(&#39;/api/chat&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ chatId: state.chatId, prompt: text }) }); |
| reader | const | 99 | no | const reader = res.body.getReader(); |
| dec | const | 100 | no | const dec = new TextDecoder(); |
| buf | variable | 101 | no | let buf = &#39;&#39;, full = &#39;&#39;; |
| el | const | 103 | no | const el = render(state.messages[state.messages.length - 1]); |
| i | variable | 108 | no | let i; |
| frame | const | 110 | no | const frame = buf.slice(0, i); buf = buf.slice(i + 2); |
| evt | const | 113 | no | const evt = JSON.parse(frame.slice(6)); |
| demo | const | 125 | no | const demo = new URLSearchParams(location.search).get(&#39;autodemo&#39;); |
| tlsKeyFile | const | 131 | no | const tlsKeyFile = process.env.FIXTURE_TLS_KEY_FILE ?? &#39;&#39;; |
| tlsCertFile | const | 132 | no | const tlsCertFile = process.env.FIXTURE_TLS_CERT_FILE ?? &#39;&#39;; |
| viaHttp | const | 133 | no | const viaHttp = process.env.FIXTURE_VIA_HTTP === &#39;1&#39;; |
| TLS | const | 134 | no | const TLS = tlsKeyFile &amp;&amp; tlsCertFile ? { key: fs.readFileSync(tlsKeyFile), cert: fs.readFileSync(tlsCertFile) } : null; |
| server | const | 135 | no | const server = (TLS ? https : http).createServer(TLS ?? {}, (req, res) =&gt; { const u = new URL(req.url, `https://127.0.0.1:${PORT}`); if (u.pathname === &#39;/api/health&#39;) { res.writeHead(200, { &#39;content-… |
| u | const | 136 | no | const u = new URL(req.url, `https://127.0.0.1:${PORT}`); |
| body | variable | 146 | no | let body = &#39;&#39;; |
| prompt | variable | 149 | no | let prompt = &#39;&#39;; |
| reply | const | 151 | no | const reply = replyFor(prompt); |
| words | const | 153 | no | const words = reply.split(/(?&lt;= )/); |
| i | variable | 154 | no | let i = 0; |
| timer | const | 155 | no | const timer = setInterval(() =&gt; { if (i &lt; words.length) { res.write(`data: ${JSON.stringify({ delta: words[i++] })}\\n\\n`); } else { res.write(`data: ${JSON.stringify({ done: true })}\\n\\n`); |
| chatID | const | 171 | no | const chatID = u.searchParams.get(&#39;chatID&#39;); |
| _threadIdHelper | export | 188 | yes | export { randomUUID as _threadIdHelper } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:https | import | 15 | external |
| node:http | import | 16 | external |
| node:fs | import | 17 | external |
| node:crypto | import | 18 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Adapter-factory demo fixture: an UNREGISTERED synthetic AI chat webapp.
//
// This is the "previously unseen webapp" of the Agent 14 Round 8 acceptance flow. It is a real,
// served, executing webapp (HTTPS + SSE streaming + URL thread identity + localStorage restore)
// that no handwritten adapter in src/profiles/sites knows about. Capture Studio's own generic
// path must be able to operate it, and the adapter factory must learn it from observed evidence.
//
//   FIXTURE_VIA_HTTP=1  serve plain HTTP instead of HTTPS (only for offline unit-style checks)
//   FIXTURE_V2=1        UI mutation: role attributes renamed data-role -> data-msg-role
//                       (the drift/relearn trigger; localStorage shape is unchanged)
//
// The webapp's own behavior (what it renders, what it streams) is entirely its own; nothing in
// it is a simulation of Capture Studio. The demo prompt → canned reply mapping is the fixture's
// product logic, like any demo mode a real site might ship.
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const V2 = process.env.FIXTURE_V2 === '1';
const ATTR = V2 ? 'data-msg-role' : 'data-role';
const PORT = Number(process.env.FIXTURE_PORT ?? 8443);

const REPLIES = [
  'Sure — here is the deterministic fixture answer: alpha bravo charlie delta echo foxtrot.',
  'The fixture webapp streamed this reply token by token over SSE, exactly like a real provider.',
  'Thread state lives in the URL chatID parameter and localStorage, so reloads restore the conversation.',
];
const replyFor = (prompt) => REPLIES[[...prompt].reduce((a, c) => a + c.charCodeAt(0), 0) % REPLIES.length];

const page = (threadId) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>NimbusChat — a friendly AI notepad</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #faf7f2; color: #26221c; }
  header { padding: 12px 20px; background: #2f7d5d; color: #fff; font-weight: 600; }
  main { max-width: 720px; margin: 0 auto; padding: 16px; }
  .turn { margin: 10px 0; padding: 10px 14px; border-radius: 10px; max-width: 85%; white-space: pre-wrap; }
  .turn.user { background: #e8f0eb; margin-left: auto; }
  .turn.assistant { background: #fff; border: 1px solid #e2dccf; }
  .composer { display: flex; gap: 8px; padding: 12px; position: sticky; bottom: 0; background: #faf7f2; }
  .composer textarea { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #cfc8b8; font: inherit; }
  .composer button { padding: 10px 18px; border: 0; border-radius: 8px; background: #2f7d5d; color: #fff; }
  .markdown-body p { margin: 0; }
</style>
</head>
<body>
<header>NimbusChat${V2 ? ' (v2 UI)' : ''}</header>
<main id="thread"></main>
<form class="composer" id="composer">
  <textarea ${ATTR}="composer-input" rows="2" placeholder="Message NimbusChat"></textarea>
  <button type="submit">Send</button>
</form>
<script>
  const ATTR = ${JSON.stringify(ATTR)};
  const threadId0 = ${JSON.stringify(threadId)};
  const KEY = 'nimbuschat.thread.v1';
  const thread = document.getElementById('thread');
  const form = document.getElementById('composer');
  const ta = form.querySelector('textarea');

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  };
  const save = (t) => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {} };
  let state = load();
  if (!threadId0) {
    // A fresh "/" always starts a new conversation (and becomes the stored thread) — like a
    // real chatapp landing page. Restores only happen through /chat?chatID=<id> reloads.
    state = { chatId: null, messages: [] };
  } else if (!state || state.chatId !== threadId0) {
    state = { chatId: threadId0, messages: [] };
  }
  const render = (msg) => {
    const el = document.createElement('div');
    el.className = 'turn ' + msg.role + (msg.role === 'assistant' ? ' markdown-body' : '');
    el.setAttribute(ATTR, msg.role);
```

_First 80 of 189 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
