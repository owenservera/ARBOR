# File: studio/src/capture/chatgpt-chat-index-reader.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/chatgpt-chat-index-reader.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10860 B |
| Lines | 173 |
| Hash | d961b966ec04 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ALLOWED_ORIGINS | const | 16 | no | const ALLOWED_ORIGINS = Object.freeze([CHATGPT_CANONICAL_ORIGIN]); |
| REQUEST_KEYS | const | 17 | no | const REQUEST_KEYS = [&#39;targetId&#39;, &#39;site&#39;, &#39;maxEntries&#39;, &#39;maxTitleChars&#39;, &#39;scanLimit&#39;, &#39;containers&#39;]; |
| OPTION_KEYS | const | 18 | no | const OPTION_KEYS = [&#39;maxEntries&#39;, &#39;maxTitleChars&#39;, &#39;scanLimit&#39;, &#39;containers&#39;]; |
| EVAL_TIMEOUT_MS | const | 19 | no | const EVAL_TIMEOUT_MS = 5000; |
| fail | function | 21 | no | const fail = (status, code) =&gt; Object.assign(new Error(code), { code, status }); |
| IDENTITY_EXPRESSION | const | 23 | no | const IDENTITY_EXPRESSION = &#39;(() =&gt; ({ origin: String(location.origin), path: String(location.pathname) }))()&#39;; |
| wrapIndex | function | 25 | no | const wrapIndex = (expression) =&gt; `(() =&gt; { const id = () =&gt; ({ origin: String(location.origin), path: String(location.pathname) }); const before = id(); const result = ${expression}; const after = i… |
| before | const | 26 | no | const before = id(); const result = ${expression}; const after = id(); return { before, after, result }; })()`; |
| validate | function | 29 | no | function validate(request, deps) { |
| port | const | 34 | no | const port = deps?.port; |
| options | const | 36 | no | const options = Object.fromEntries(OPTION_KEYS.filter((key) =&gt; request[key] !== undefined).map((key) =&gt; [key, request[key]])); |
| expression | const | 37 | no | const expression = chatIndexExpression(options); // validates the bounds; throws a coded 400 |
| describePage | function | 43 | no | function describePage(url) { |
| parsed | variable | 44 | no | let parsed; |
| classifyTab | function | 50 | no | function classifyTab(tab) { |
| page | const | 52 | no | const page = describePage(tab.url); |
| pageIdentity | function | 57 | no | function pageIdentity(value) { |
| page | const | 59 | no | const page = describePage(`${value.origin}${value.path.startsWith(&#39;/&#39;) ? &#39;&#39; : &#39;/&#39;}${value.path}`); |
| samePage | function | 64 | no | const samePage = (a, b) =&gt; a.origin === b.origin &amp;&amp; a.path === b.path; |
| unchanged | function | 65 | no | const unchanged = (a, b) =&gt; { if (!samePage(a, b)) throw fail(409, &#39;BINDING_CHANGED&#39;); }; |
| mapOpenError | function | 67 | no | function mapOpenError(error) { |
| text | const | 69 | no | const text = String(error?.message ?? &#39;&#39;); |
| defaultEvaluate | function | 74 | no | async function defaultEvaluate(session, expression) { |
| reply | const | 76 | no | const reply = await session.send(&#39;Runtime.evaluate&#39;, { expression, returnByValue: true, awaitPromise: false, timeout: EVAL_TIMEOUT_MS }); |
| createDefaultOpenSession | function | 83 | yes | export function createDefaultOpenSession({ browserWsUrl: resolveWsUrl = browserWsUrl, connect = (url, options) =&gt; CdpConnection.connect(url, options) } = {}) { |
| connection | const | 85 | no | const connection = await connect(await resolveWsUrl({ port }), { timeoutMs: 5000, requestTimeoutMs: 8000 }); |
| session | variable | 86 | no | let session; |
| closed | variable | 89 | no | let closed = false; |
| pathKind | function | 98 | no | const pathKind = (page) =&gt; (page.path === &#39;/&#39; \|\| page.path === &#39;&#39; \|\| /^\\/new\\/?$/.test(page.path) ? &#39;root&#39; : parseThread(&#39;chatgpt&#39;, `${page.origin}${page.path}`) ? &#39;thread&#39; : &#39;other&#39;); |
| readChatIndex | function | 110 | yes | export async function readChatIndex(request, deps = {}) { |
| listTargets | const | 112 | no | const listTargets = deps.listTargets ?? discoveredTargets; |
| evaluate | const | 113 | no | const evaluate = deps.evaluate ?? defaultEvaluate; |
| open | const | 114 | no | const open = deps.openSession ?? createDefaultOpenSession(); |
| listed | function | 115 | no | const listed = async () =&gt; { |
| tabs | variable | 116 | no | let tabs; |
| tab | const | 118 | no | const tab = Array.isArray(tabs) ? tabs.find((t) =&gt; t &amp;&amp; t.id === targetId) : undefined; |
| run | function | 122 | no | const run = async (session, source) =&gt; { |
| listedBefore | const | 130 | no | const listedBefore = await listed(); // preflight: nothing is attached for a missing or foreign target |
| handle | variable | 131 | no | let handle; |
| session | const | 134 | no | const session = handle?.session; |
| pageBefore | const | 136 | no | const pageBefore = pageIdentity(await run(session, IDENTITY_EXPRESSION)); |
| wrapped | const | 139 | no | const wrapped = await run(session, wrapIndex(expression)); // the ONE index expression |
| normalized | const | 149 | no | const normalized = normalizeChatIndex({ ...wrapped.result, origin: pageBefore.origin }, options); |
| merged | const | 153 | no | const merged = new Map(); |
| foreignOriginDropped | variable | 154 | no | let foreignOriginDropped = 0; |
| seen | const | 157 | no | const seen = merged.get(entry.threadRef); |
| entries | const | 161 | no | const entries = [...merged.values()]; |
| threadRef | const | 162 | no | const threadRef = parseThread(&#39;chatgpt&#39;, `${pageBefore.origin}${pageBefore.path}`)?.ref ?? null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../cdp/discovery.mjs | import | 10 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |
| ../cdp/client.mjs | import | 11 | [studio/src/cdp/client.mjs](../cdp/client.mjs.md) |
| ./chatgpt-chat-index.mjs | import | 12 | [studio/src/capture/chatgpt-chat-index.mjs](./chatgpt-chat-index.mjs.md) |
| ./conversation-thread.mjs | import | 13 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./chatgpt-chat-index-reader.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Read-only reader for the rendered ChatGPT chat index. One explicit target, one index expression.
//
// This is a bounded function for the Studio runtime to call later; it is not a driver, recorder or
// capture. It creates no session directory, raw log, lease or snapshot, and never focuses, scrolls,
// clicks, navigates, types or issues a page/private HTTP request. Its only browser operations are:
// list tabs over the loopback DevTools HTTP endpoint, attach ONE flatten session to the exact target,
// evaluate three read-only expressions (page identity, the index, page identity) and detach the session
// it created. It never closes a target. The reader enforces page origin and path itself and treats every
// returned thread as a rendered-link CANDIDATE, never as a verified binding.
import { listTargets as discoveredTargets, browserWsUrl } from '../cdp/discovery.mjs';
import { CdpConnection } from '../cdp/client.mjs';
import { chatIndexExpression, normalizeChatIndex, CHATGPT_CANONICAL_ORIGIN, CHAT_INDEX_IDENTITY, CHAT_INDEX_LIVE_BINDING } from './chatgpt-chat-index.mjs';
import { parseThread } from './conversation-thread.mjs';

// Exactly the canonical origin the shared index module accepts: no www or legacy alias, port or credentials.
const ALLOWED_ORIGINS = Object.freeze([CHATGPT_CANONICAL_ORIGIN]);
const REQUEST_KEYS = ['targetId', 'site', 'maxEntries', 'maxTitleChars', 'scanLimit', 'containers'];
const OPTION_KEYS = ['maxEntries', 'maxTitleChars', 'scanLimit', 'containers'];
const EVAL_TIMEOUT_MS = 5000;

const fail = (status, code) => Object.assign(new Error(code), { code, status });

const IDENTITY_EXPRESSION = '(() => ({ origin: String(location.origin), path: String(location.pathname) }))()';
// The page identity is read in the same synchronous task, on both sides of the index expression.
const wrapIndex = (expression) => `(() => { const id = () => ({ origin: String(location.origin), path: String(location.pathname) });
  const before = id(); const result = ${expression}; const after = id(); return { before, after, result }; })()`;

// Everything that can be rejected without touching the browser is rejected here.
function validate(request, deps) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw fail(400, 'INVALID_CHAT_INDEX_REQUEST');
  if (Object.keys(request).some((key) => !REQUEST_KEYS.includes(key))) throw fail(400, 'INVALID_CHAT_INDEX_REQUEST');
  const { targetId, site = 'chatgpt' } = request;
  if (site !== 'chatgpt' || typeof targetId !== 'string' || !targetId || targetId.length > 256) throw fail(400, 'INVALID_CHAT_INDEX_REQUEST');
  const port = deps?.port;
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw fail(400, 'INVALID_CHAT_INDEX_REQUEST');
  const options = Object.fromEntries(OPTION_KEYS.filter((key) => request[key] !== undefined).map((key) => [key, request[key]]));
  const expression = chatIndexExpression(options); // validates the bounds; throws a coded 400
  normalizeChatIndex(null, options); // same validation for the normaliser, with the same options
  return { targetId, port, options, expression };
}

// Trusted identity of a page: https, one of the allowed ChatGPT origins, and its path. Titles are never read.
function describePage(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !ALLOWED_ORIGINS.includes(parsed.origin)) return null;
  return { origin: parsed.origin, path: parsed.pathname };
}

function classifyTab(tab) {
  if (tab.type && tab.type !== 'page') throw fail(409, 'TARGET_SITE_MISMATCH');
  const page = describePage(tab.url);
  if (!page) throw fail(409, 'TARGET_SITE_MISMATCH');
  return page;
}

function pageIdentity(value) {
  if (!value || typeof value !== 'object' || typeof value.origin !== 'string' || typeof value.path !== 'string') throw fail(409, 'INDEX_READ_FAILED');
  const page = describePage(`${value.origin}${value.path.startsWith('/') ? '' : '/'}${value.path}`);
  if (!page || page.origin !== value.origin) throw fail(409, 'TARGET_SITE_MISMATCH');
  return page;
}

const samePage = (a, b) => a.origin === b.origin && a.path === b.path;
const unchanged = (a, b) => { if (!samePage(a, b)) throw fail(409, 'BINDING_CHANGED'); };

function mapOpenError(error) {
  if (error?.status && error?.code) return error;
  const text = String(error?.message ?? '');
  if (error?.code === -32602 || /no target|target.{0,20}not found|invalid target/i.test(text)) return fail(404, 'TARGET_NOT_FOUND');
  return fail(503, 'BROWSER_UNAVAILABLE');
}

async function defaultEvaluate(session, expression) {
  // No user gesture and no promise awaiting: pure synchronous observation.
  const reply = await session.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: false, timeout: EVAL_TIMEOUT_MS });
  if (reply?.exceptionDetails) throw fail(409, 'INDEX_EVAL_FAILED');
  return reply?.result?.value;
}
```

_First 80 of 174 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
