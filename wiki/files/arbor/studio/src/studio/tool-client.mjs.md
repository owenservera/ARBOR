# File: studio/src/studio/tool-client.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/tool-client.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4612 B |
| Lines | 65 |
| Hash | eaa58eec21e9 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| failure | function | 5 | no | const failure = (code, status, effect = &#39;none&#39;) =&gt; Object.assign(new Error(code), { code, status, effect, retry: false }); |
| safeCode | function | 6 | no | const safeCode = (code) =&gt; typeof code === &#39;string&#39; &amp;&amp; /^[A-Z][A-Z0-9_]{0,79}$/.test(code); |
| createStudioToolClient | function | 8 | yes | export function createStudioToolClient(options = {}) { |
| origin | const | 15 | no | const origin = `http://127.0.0.1:${port}`; |
| once | function | 16 | no | async function once(route, body, effect) { |
| controller | const | 17 | no | const controller = new AbortController(); let timer; |
| timeout | const | 18 | no | const timeout = new Promise((_, reject) =&gt; { timer = setTimeout(() =&gt; { controller.abort(); reject(failure(&#39;STUDIO_REQUEST_UNKNOWN&#39;, 504, effect)); }, timeoutMs); }); |
| run | function | 21 | no | const run = (async () =&gt; { let response, data; try { response = await request(origin + route, { method: body === undefined ? &#39;GET&#39; : &#39;POST&#39;, redirect: &#39;error&#39;, credentials: &#39;omit&#39;, signal: controller… |
| response | variable | 22 | no | let response, data; |
| manifest | const | 52 | no | const manifest = await once(&#39;/api/v1/integrations/tools&#39;, undefined, &#39;none&#39;); |
| allowed | const | 54 | no | const allowed = new Set(CONVERSATION_TOOLS.map((tool) =&gt; tool.name)); |
| effect | const | 59 | no | const effect = definition.annotations.readOnlyHint ? &#39;none&#39; : &#39;unknown&#39;; |
| result | const | 60 | no | const result = await once(&#39;/api/v1/integrations/tools/call&#39;, { name, arguments: args }, effect); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./conversation-tools.mjs | import | 3 | [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/ask.mjs](../../bin/commands/ask.mjs.md) | ../../src/studio/tool-client.mjs |
| [studio/bin/commands/providers.mjs](../../bin/commands/providers.mjs.md) | ../../src/studio/tool-client.mjs |
| [studio/bin/commands/recipes.mjs](../../bin/commands/recipes.mjs.md) | ../../src/studio/tool-client.mjs |
| [studio/bin/commands/tools.mjs](../../bin/commands/tools.mjs.md) | ../../src/studio/tool-client.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Thin HTTP client for an ALREADY RUNNING, same-owner Studio. No runtime/CDP/MCP construction.
// One HTTP attempt only, including redirects, timeouts, conflicts and unknown submission outcomes.
import { CONVERSATION_TOOLS, validateConversationTool } from './conversation-tools.mjs';

const failure = (code, status, effect = 'none') => Object.assign(new Error(code), { code, status, effect, retry: false });
const safeCode = (code) => typeof code === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(code);
// @serves 095
export function createStudioToolClient(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)
    || Object.keys(options).some((key) => !['port', 'token', 'fetch', 'timeoutMs'].includes(key))) throw failure('INVALID_STUDIO_CLIENT', 400);
  const { port, token, fetch: request = globalThis.fetch, timeoutMs = 10000 } = options;
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535 || typeof request !== 'function'
    || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000
    || token !== undefined && (typeof token !== 'string' || !token.trim() || token.length > 4096 || /[\u0000-\u001f\u007f]/.test(token))) throw failure('INVALID_STUDIO_CLIENT', 400);
  const origin = `http://127.0.0.1:${port}`;
  async function once(route, body, effect) {
    const controller = new AbortController(); let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => {
      controller.abort(); reject(failure('STUDIO_REQUEST_UNKNOWN', 504, effect));
    }, timeoutMs); });
    const run = (async () => {
      let response, data;
      try {
        response = await request(origin + route, { method: body === undefined ? 'GET' : 'POST', redirect: 'error', credentials: 'omit', signal: controller.signal,
          headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token === undefined ? {} : { 'x-studio-token': token }) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
        if (response.redirected) throw failure('STUDIO_REDIRECT_REFUSED', 502, effect);
        data = await response.json();
      } catch {
        // Do not retain/print fetch messages, response bodies, tokens, prompts or replies in errors.
        throw failure('STUDIO_REQUEST_UNKNOWN', 503, effect);
      }
      if (!response.ok) throw failure(safeCode(data?.code) ? data.code : 'STUDIO_HTTP_ERROR', response.status, effect);
      return data;
    })();
    try { return await Promise.race([run, timeout]); } finally { clearTimeout(timer); }
  }
  return {
    // Recipe CLI uses this SAME one-attempt HTTP implementation; no second fetch stack.
    // Only known local recipe/agent/health routes are accepted, never arbitrary URLs.
    async recipeRequest(method, route, body) {
      if (!['GET', 'POST'].includes(method) || typeof route !== 'string'
        || !(/^(?:\/api\/v1\/(?:recipes(?:\/|\?|$)|agent\/capabilities$|health$|compare(?:\/|\?|$)|orchestrate(?:\/|\?|$)|providers\/performance$)|\/api\/status$)/.test(route))
        || /[\r\n#]/.test(route) || route.includes('..') || route.includes('://')
        || (route === '/api/status' && method !== 'GET')
        || (method === 'GET' && body !== undefined) || (method === 'POST' && (!body || typeof body !== 'object' || Array.isArray(body))))
        throw failure('INVALID_RECIPE_REQUEST', 400);
      const readOnly = method === 'GET' || route.endsWith('/plan') || route.endsWith('/reconcile');
      return once(route, method === 'GET' ? undefined : body, readOnly ? 'none' : 'unknown');
    },
    async list() {
      const manifest = await once('/api/v1/integrations/tools', undefined, 'none');
      if (!Array.isArray(manifest?.tools)) throw failure('STUDIO_INVALID_RESPONSE', 502);
      const allowed = new Set(CONVERSATION_TOOLS.map((tool) => tool.name));
      return { ...manifest, tools: manifest.tools.filter((tool) => allowed.has(tool.name)) };
    },
    async call(name, args = {}) {
      const { definition } = validateConversationTool(name, args);
      const effect = definition.annotations.readOnlyHint ? 'none' : 'unknown';
      const result = await once('/api/v1/integrations/tools/call', { name, arguments: args }, effect);
      if (!result || result.isError !== false || !Object.hasOwn(result, 'structuredContent')) throw failure('STUDIO_INVALID_RESPONSE', 502, effect);
      return result.structuredContent; // Explicit return to the caller, never an incidental diagnostic log.
    },
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
