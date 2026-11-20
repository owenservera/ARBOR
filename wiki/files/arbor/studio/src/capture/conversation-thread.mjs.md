# File: studio/src/capture/conversation-thread.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-thread.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19612 B |
| Lines | 271 |
| Hash | f3ddd1ae61b8 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UUID | const | 8 | no | const UUID = &#39;[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}&#39;; |
| CHATGPT_C | const | 9 | no | const CHATGPT_C = new RegExp(`^/c/(${UUID})/?$`, &#39;i&#39;); |
| UUID_ONLY | const | 10 | no | const UUID_ONLY = new RegExp(`^${UUID}$`); |
| CLAUDE_CHAT | const | 14 | no | const CLAUDE_CHAT = new RegExp(`^/chat/(${UUID})/?$`, &#39;i&#39;); |
| SITE_THREADS | const | 15 | no | const SITE_THREADS = Object.freeze({ chatgpt: { kind: &#39;chatgpt-c&#39;, hosts: [&#39;chatgpt.com&#39;, &#39;chat.openai.com&#39;], path: CHATGPT_C, newChatPaths: [&#39;/&#39;] }, claude: { kind: &#39;claude-chat&#39;, hosts: [&#39;claude.ai… |
| THREAD_KINDS | const | 19 | yes | export const THREAD_KINDS = Object.freeze(Object.values(SITE_THREADS).map((s) =&gt; s.kind)); |
| THREAD_HOSTS_BY_KIND | const | 21 | yes | export const THREAD_HOSTS_BY_KIND = Object.freeze(Object.fromEntries(Object.values(SITE_THREADS).map((s) =&gt; [s.kind, Object.freeze([...s.hosts])]))); |
| THREAD_REF_PATTERN | const | 22 | yes | export const THREAD_REF_PATTERN = new RegExp(`^(?:${THREAD_KINDS.join(&#39;\|&#39;)}):${UUID}$`); |
| THREAD_SITES | const | 24 | yes | export const THREAD_SITES = Object.freeze(Object.keys(SITE_THREADS)); |
| threadSupported | function | 25 | yes | export const threadSupported = (siteId) =&gt; THREAD_SITES.includes(siteId); |
| SITE_NEW_CHAT_PATHS | const | 29 | no | const SITE_NEW_CHAT_PATHS = Object.freeze({ ...Object.fromEntries(Object.entries(SITE_THREADS).map(([id, site]) =&gt; [id, site.newChatPaths])), // Measured 2026-10-30 on the owner&#39;s signed-in tab: the … |
| isNewChatPath | function | 37 | yes | export const isNewChatPath = (siteId, pathname) =&gt; (SITE_NEW_CHAT_PATHS[siteId] ?? [&#39;/&#39;]).includes(pathname); |
| parseThread | function | 40 | yes | export function parseThread(siteId, url) { |
| site | const | 41 | no | const site = SITE_THREADS[siteId]; |
| parsed | variable | 43 | no | let parsed; |
| id | const | 49 | no | const id = match[1].toLowerCase(); |
| sameThread | function | 53 | yes | export const sameThread = (a, b) =&gt; (a?.ref ?? null) === (b?.ref ?? null); |
| validThread | function | 55 | yes | export function validThread(thread) { |
| IDENTITY_STATES | const | 60 | yes | export const IDENTITY_STATES = Object.freeze([&#39;bound&#39;, &#39;unbound&#39;, &#39;unverified&#39;]); |
| validIdentity | function | 61 | yes | export function validIdentity(identity, thread) { |
| TRANSCRIPT_LIMITS | const | 67 | yes | export const TRANSCRIPT_LIMITS = Object.freeze({ maxMessages: { min: 1, max: 200, default: 40 }, maxChars: { min: 1, max: 200000, default: 60000 }, perMessageCap: 20000, scanLimit: 400 }); |
| TRANSCRIPT_SELECTORS | const | 71 | yes | export const TRANSCRIPT_SELECTORS = Object.freeze({ user: [&#39;[data-message-author-role=&quot;user&quot;]&#39;, &#39;[data-content-search-unit-key$=&quot;user&quot;]&#39;, &#39;[data-chatgpt-search-unit-key$=&quot;user&quot;]&#39;, &#39;[data-testid=&quot;user… |
| transcriptSpec | function | 81 | yes | export function transcriptSpec(adapter) { |
| t | const | 82 | no | const t = adapter?.transcript ?? {}; |
| idleControlSelectors | function | 91 | yes | export const idleControlSelectors = (adapter) =&gt; [...(adapter?.send?.buttonSelectors ?? []), ...(adapter?.send?.idleSelectors ?? [])]; |
| turnObservationExpression | function | 95 | yes | export function turnObservationExpression(adapter = {}) { |
| spec | const | 96 | no | const spec = transcriptSpec(adapter); |
| ID_ATTR | const | 98 | no | const ID_ATTR=${JSON.stringify(spec.idAttribute)}, TEXT_SEL=${JSON.stringify(spec.textSelector)}; |
| visible | function | 101 | no | const visible = (el) =&gt; { |
| rect | const | 103 | no | const rect = el.getBoundingClientRect(); |
| style | const | 107 | no | const style = getComputedStyle(node); |
| all | function | 114 | no | const all = sels =&gt; { const out=[]; for(const sel of sels) { try { for(const el of document.querySelectorAll(sel)) if(visible(el)&amp;&amp;!out.includes(el)) out.push(el); } catch {} } return out; }; |
| users | const | 115 | no | const users=all(${JSON.stringify(spec.user)}), assistants=all(${JSON.stringify(spec.assistant)}); |
| nodes | const | 116 | no | const nodes=[...new Set([...users,...assistants])].filter(el=&gt;!users.includes(el)\|\|!assistants.includes(el)); |
| kept | const | 117 | no | const kept=nodes.filter(el=&gt;!nodes.some(other=&gt;other!==el&amp;&amp;other.contains(el))); |
| idOf | function | 119 | no | const idOf=el=&gt;{ const owner=el.closest(&#39;[data-message-id]&#39;); if(owner) return owner.getAttribute(&#39;data-message-id&#39;)\|\|null; |
| unit | const | 121 | no | const unit=el.getAttribute(&#39;data-chatgpt-search-message-ids&#39;); if(unit&amp;&amp;unit.trim()) return unit.trim().split(/\\\\s+/)[0]; |
| inner | const | 122 | no | const inner=el.querySelector(&#39;[data-chatgpt-selection-message-id],[data-dil-source-message-id]&#39;); |
| textOf | function | 124 | no | const textOf=el=&gt;{ const body=TEXT_SEL?el.querySelector(TEXT_SEL):null; const src=body\|\|el; return String(src.innerText??src.textContent??&#39;&#39;).replace(/\\\\r\\\\n/g,&#39;\\\\n&#39;); }; |
| messages | const | 125 | no | const messages=kept.map(el=&gt;{ return {role:users.includes(el)?&#39;user&#39;:&#39;assistant&#39;,id:idOf(el),text:textOf(el)}; }); |
| composer | const | 126 | no | const composer=all(${JSON.stringify(adapter.composer?.selectors ?? [])})[0]; |
| text | const | 127 | no | const text=composer?String(composer.value??composer.innerText??composer.textContent??&#39;&#39;).replace(/\\\\r\\\\n/g,&#39;\\\\n&#39;):null; |
| stop | const | 128 | no | const stop=all(${JSON.stringify(adapter.assistant?.streamingSelectors ?? [])}).length&gt;0; |
| sendBtn | const | 129 | no | const sendBtn=all(${JSON.stringify(idleControlSelectors(adapter))}).length&gt;0; |
| idle | const | 132 | no | const idle=sendBtn; |
| enabled | const | 133 | no | const enabled=!!composer &amp;&amp; composer.disabled!==true &amp;&amp; composer.getAttribute(&#39;aria-disabled&#39;)!==&#39;true&#39;; |
| transcriptExpression | function | 144 | yes | export function transcriptExpression({ userSelectors = TRANSCRIPT_SELECTORS.user, assistantSelectors = TRANSCRIPT_SELECTORS.assistant, composerSelectors = [], streamingSelectors = [], sendSelectors =… |
| ID_ATTR | const | 148 | no | const ID_ATTR = ${JSON.stringify(idAttribute)}, TEXT_SEL = ${JSON.stringify(textSelector)}; |
| USER | const | 149 | no | const USER = ${JSON.stringify(userSelectors)}, ASSISTANT = ${JSON.stringify(assistantSelectors)}, COMPOSER = ${JSON.stringify(composerSelectors)}; |
| STREAMING | const | 150 | no | const STREAMING = ${JSON.stringify(streamingSelectors)}, SEND = ${JSON.stringify(sendSelectors)}; |
| CAP | const | 151 | no | const CAP = ${Math.trunc(perMessageCap)}, SCAN = ${Math.trunc(scanLimit)}; |
| all | function | 152 | no | const all = (sels) =&gt; { const out = []; for (const sel of sels) { let list = []; try { list = Array.from(document.querySelectorAll(sel)); } catch (e) { list = []; } for (const el of list) if (!out.in… |
| visible | function | 154 | no | const visible = (el) =&gt; { |
| rect | const | 156 | no | const rect = el.getBoundingClientRect(); |
| style | const | 160 | no | const style = getComputedStyle(node); |
| users | const | 167 | no | const users = all(USER), assistants = all(ASSISTANT); |
| hiddenSkipped | variable | 168 | no | let hiddenSkipped = 0, nestedDropped = 0, ambiguousSkipped = 0; |
| tagged | const | 169 | no | const tagged = []; |
| kept | const | 175 | no | const kept = tagged.filter((x) =&gt; { const nested = tagged.some((o) =&gt; o.el !== x.el &amp;&amp; o.el.contains(x.el)); if (nested) nestedDropped++; return !nested; }); |
| total | const | 177 | no | const total = kept.length, slice = kept.slice(-SCAN); |
| messages | const | 178 | no | const messages = slice.map((x) =&gt; { const bodyEl = (TEXT_SEL &amp;&amp; x.el.querySelector(TEXT_SEL)) \|\| x.el; const text = String(bodyEl.innerText ?? bodyEl.textContent ?? &#39;&#39;).replace(/\\\\r\\\\n/g, &#39;\\\\n&#39;); con… |
| scroll | variable | 179 | no | let scroll = { found: false, topReached: null, bottomReached: null }; |
| overflow | const | 182 | no | const overflow = getComputedStyle(node).overflowY; |
| draft | variable | 188 | no | let draft = { present: null, chars: null }, composerEl = null; |
| el | variable | 190 | no | let el = null; try { el = document.querySelector(sel); } catch (e) { el = null; } |
| value | const | 192 | no | const value = typeof el.value === &#39;string&#39; ? el.value : String(el.innerText ?? el.textContent ?? &#39;&#39;); |
| chars | const | 193 | no | const chars = value.replace(/\\\\s+/g, &#39; &#39;).trim().length; draft = { present: chars &gt; 0, chars }; composerEl = el; break; |
| stop | const | 195 | no | const stop = all(STREAMING).some(visible); |
| sendBtn | const | 196 | no | const sendBtn = all(SEND).some(visible); |
| idle | const | 198 | no | const idle = sendBtn; |
| enabled | const | 199 | no | const enabled = !!composerEl &amp;&amp; composerEl.disabled !== true &amp;&amp; composerEl.getAttribute(&#39;aria-disabled&#39;) !== &#39;true&#39;; |
| controls | const | 200 | no | const controls = { observed: !!composerEl &amp;&amp; idle, state: stop ? &#39;busy&#39; : (idle &amp;&amp; enabled ? &#39;idle&#39; : &#39;unknown&#39;), |
| ID_SOURCES | const | 207 | no | const ID_SOURCES = Object.freeze([&#39;data-message-id&#39;, &#39;data-turn-key&#39;]); |
| count | function | 208 | no | const count = (n) =&gt; (Number.isSafeInteger(n) &amp;&amp; n &gt;= 0 ? n : 0); |
| boundTranscript | function | 212 | yes | export function boundTranscript(rawResult, { maxMessages = TRANSCRIPT_LIMITS.maxMessages.default, maxChars = TRANSCRIPT_LIMITS.maxChars.default, perMessageCap = TRANSCRIPT_LIMITS.perMessageCap } = {}… |
| source | const | 214 | no | const source = Array.isArray(rawResult?.messages) ? rawResult.messages : []; |
| renderedTotal | const | 215 | no | const renderedTotal = Number.isSafeInteger(rawResult?.renderedTotal) &amp;&amp; rawResult.renderedTotal &gt;= source.length ? rawResult.renderedTotal : source.length; |
| offset | const | 216 | no | const offset = renderedTotal - source.length; |
| valid | const | 217 | no | const valid = []; let invalid = 0; |
| ok | const | 219 | no | const ok = m &amp;&amp; (m.role === &#39;user&#39; \|\| m.role === &#39;assistant&#39;) &amp;&amp; typeof m.text === &#39;string&#39; &amp;&amp; Number.isSafeInteger(m.chars) &amp;&amp; m.chars &gt;= m.text.length; |
| kept | const | 224 | no | const kept = []; let budget = maxChars, tails = 0, richBudget = Math.min(16000, maxChars); |
| m | const | 226 | no | const m = valid[i], cap = Math.min(perMessageCap, budget), text = m.text.length &gt; cap ? m.text.slice(0, cap) : m.text; |
| rich | const | 227 | no | const rich = boundRichParts(m.parts, {completeText:text.length===m.chars,maxChars:richBudget}); |
| keptIndexes | const | 237 | no | const keptIndexes = new Set(kept.map((m) =&gt; m.index)); |
| omittedChars | const | 238 | no | const omittedChars = valid.filter((m) =&gt; !keptIndexes.has(m.index)).reduce((n, m) =&gt; n + m.chars, 0) + tails; |
| scroll | const | 239 | no | const scroll = rawResult?.scroll; |
| draft | const | 240 | no | const draft = rawResult?.draft &amp;&amp; typeof rawResult.draft.present === &#39;boolean&#39; &amp;&amp; Number.isSafeInteger(rawResult.draft.chars) &amp;&amp; rawResult.draft.chars &gt;= 0 |
| indicators | const | 244 | no | const indicators = rawResult?.controls; |
| stopPresent | const | 245 | no | const stopPresent = indicators?.stopPresent === true; |
| idleControlPresent | const | 246 | no | const idleControlPresent = indicators?.idleControlPresent === true; |
| composerEnabled | const | 247 | no | const composerEnabled = indicators?.composerEnabled === true; |
| idleProven | const | 248 | no | const idleProven = idleControlPresent &amp;&amp; composerEnabled; |
| controls | const | 249 | no | const controls = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./conversation-rich.mjs | import | 1 | [studio/src/capture/conversation-rich.mjs](./conversation-rich.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/drive.mjs](../../bin/commands/drive.mjs.md) | ../../src/capture/conversation-thread.mjs |
| [studio/src/capture/actions.mjs](./actions.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/chatgpt-chat-index-reader.mjs](./chatgpt-chat-index-reader.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/chatgpt-chat-index.mjs](./chatgpt-chat-index.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/conversation-browser-adapter.mjs](./conversation-browser-adapter.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/conversation-capsule.mjs](./conversation-capsule.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/conversation-prefix.mjs](./conversation-prefix.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/conversation-service.mjs](./conversation-service.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/thread-identity.mjs](./thread-identity.mjs.md) | ./conversation-thread.mjs |
| [studio/src/capture/thread-turn-journal.mjs](./thread-turn-journal.mjs.md) | ./conversation-thread.mjs |
| [studio/src/shapes/observation.mjs](../shapes/observation.mjs.md) | ../capture/conversation-thread.mjs |
| [studio/src/studio/adapter-probes.mjs](../studio/adapter-probes.mjs.md) | ../capture/conversation-thread.mjs |
| [studio/src/studio/conversation-api.mjs](../studio/conversation-api.mjs.md) | ../capture/conversation-thread.mjs |
| [studio/src/studio/conversation-tools.mjs](../studio/conversation-tools.mjs.md) | ../capture/conversation-thread.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { richPartReaderSource, boundRichParts } from './conversation-rich.mjs';
// Thread identity and bounded, read-only transcript shaping for the conversation lifecycle.
// No browser access here: the adapter evaluates `transcriptExpression` and passes the raw result to
// `boundTranscript`. Only the ChatGPT `/c/<uuid>` and Claude `/chat/<uuid>` forms are threads; any other
// path (home, project or custom-GPT forms, which are not observed in saved sessions or source) is unverified.
// A tab title is never an input.

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const CHATGPT_C = new RegExp(`^/c/(${UUID})/?$`, 'i');
const UUID_ONLY = new RegExp(`^${UUID}$`);

// Per-site thread identity. Claude.ai: a chat is exactly `/chat/<uuid>`; a fresh chat lives on the
// home route `/new` (or `/`, which redirects there) and has no thread until the first message is sent.
const CLAUDE_CHAT = new RegExp(`^/chat/(${UUID})/?$`, 'i');
const SITE_THREADS = Object.freeze({
  chatgpt: { kind: 'chatgpt-c', hosts: ['chatgpt.com', 'chat.openai.com'], path: CHATGPT_C, newChatPaths: ['/'] },
  claude: { kind: 'claude-chat', hosts: ['claude.ai', 'www.claude.ai'], path: CLAUDE_CHAT, newChatPaths: ['/', '/new'] },
});
export const THREAD_KINDS = Object.freeze(Object.values(SITE_THREADS).map((s) => s.kind));
// A thread kind may only be keyed under its own provider's hosts (no cross-provider thread identity).
export const THREAD_HOSTS_BY_KIND = Object.freeze(Object.fromEntries(Object.values(SITE_THREADS).map((s) => [s.kind, Object.freeze([...s.hosts])])));
export const THREAD_REF_PATTERN = new RegExp(`^(?:${THREAD_KINDS.join('|')}):${UUID}$`);

export const THREAD_SITES = Object.freeze(Object.keys(SITE_THREADS));
export const threadSupported = (siteId) => THREAD_SITES.includes(siteId);
// The exact blank-composer routes of a site, before any thread exists. Unknown sites: only `/`.
// Declared separately from SITE_THREADS: a site can have a known blank-composer route (Gemini's
// /app) without the harness yet having a measured thread-URL identity for its chats.
const SITE_NEW_CHAT_PATHS = Object.freeze({
  ...Object.fromEntries(Object.entries(SITE_THREADS).map(([id, site]) => [id, site.newChatPaths])),
  // Measured 2026-10-30 on the owner's signed-in tab: the fresh Gemini chat is /app.
  gemini: ['/', '/app'],
  deepseek: ['/'],
  zai: ['/'],
  qwen: ['/'],
});
export const isNewChatPath = (siteId, pathname) => (SITE_NEW_CHAT_PATHS[siteId] ?? ['/']).includes(pathname);

// @serves 003,009,013,100
export function parseThread(siteId, url) {
  const site = SITE_THREADS[siteId];
  if (!site) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || !site.hosts.includes(parsed.hostname)
    || parsed.username || parsed.password || parsed.port) return null;
  const match = site.path.exec(parsed.pathname);
  if (!match) return null;
  const id = match[1].toLowerCase();
  return { kind: site.kind, id, ref: `${site.kind}:${id}` };
}

export const sameThread = (a, b) => (a?.ref ?? null) === (b?.ref ?? null);

export function validThread(thread) {
  if (thread === null || thread === undefined) return true;
  return typeof thread === 'object' && THREAD_KINDS.includes(thread.kind) && typeof thread.id === 'string' && UUID_ONLY.test(thread.id) && thread.ref === `${thread.kind}:${thread.id}`;
}

export const IDENTITY_STATES = Object.freeze(['bound', 'unbound', 'unverified']);
export function validIdentity(identity, thread) {
  if (!identity || typeof identity !== 'object' || !IDENTITY_STATES.includes(identity.state)) return false;
  if (identity.reason !== null && identity.reason !== undefined && !/^[A-Z][A-Z0-9_]{0,59}$/.test(identity.reason)) return false;
  return (identity.state === 'bound') === !!thread;
}

export const TRANSCRIPT_LIMITS = Object.freeze({ maxMessages: { min: 1, max: 200, default: 40 }, maxChars: { min: 1, max: 200000, default: 60000 }, perMessageCap: 20000, scanLimit: 400 });

// Specific, role-labelled message nodes only. Generic containers are deliberately not used because
// one container can hold both roles.
export const TRANSCRIPT_SELECTORS = Object.freeze({
  user: ['[data-message-author-role="user"]', '[data-content-search-unit-key$="user"]', '[data-chatgpt-search-unit-key$="user"]', '[data-testid="user-message"]'],
  assistant: ['[data-message-author-role="assistant"]', '[data-content-search-unit-key$="assistant"]', '[data-chatgpt-search-unit-key$="assistant"]'],
});

// Per-site message locators. ChatGPT is the default. A site profile may declare `transcript` =
// { userSelectors, assistantSelectors, textSelector, idAttribute }: the role-labelled message nodes, an
// optional descendant holding only the message body (excluding sr-only headings, timestamps and action
// bars), and the OBSERVED attribute carrying the provider's own stable message identity (Claude:
// `data-turn-key`). Ids still come only from observed attributes, never from position or text.
```

_First 80 of 272 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
