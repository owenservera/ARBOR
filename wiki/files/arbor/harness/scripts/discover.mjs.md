# File: harness/scripts/discover.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/scripts/discover.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4413 B |
| Lines | 50 |
| Hash | aed1d2b52b3c |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| args | const | 3 | no | const args = process.argv.slice(2); |
| option | function | 4 | no | function option(name, fallback) { |
| indices | const | 5 | no | const indices = args.flatMap((v, i) =&gt; v === name ? [i] : []); |
| main | function | 9 | no | async function main() { |
| host | const | 11 | no | const host = option(&#39;--host&#39;, &#39;127.0.0.1&#39;); |
| port | const | 12 | no | const port = Number(option(&#39;--port&#39;, &#39;9333&#39;)); |
| targetId | const | 14 | no | const targetId = option(&#39;--target&#39;); |
| authority | const | 16 | no | const authority = host.includes(&#39;:&#39;) ? &#39;[::1]&#39; : host; |
| response | const | 17 | no | const response = await fetch(`http://${authority}:${port}/json/version`, { signal: AbortSignal.timeout(5000), redirect: &#39;error&#39; }); |
| endpoint | const | 19 | no | const endpoint = new URL((await response.json()).webSocketDebuggerUrl); |
| ws | const | 21 | no | const ws = new WebSocket(endpoint.href); |
| next | variable | 23 | no | let next = 0; |
| pending | const | 24 | no | const pending = new Map(); |
| msg | const | 26 | no | const msg = JSON.parse(event.data); const item = pending.get(msg.id); if (!item) return; |
| call | function | 31 | no | const call = (method, params, sessionId) =&gt; new Promise((resolve, reject) =&gt; { const id = ++next; const timer = setTimeout(() =&gt; { pending.delete(id); reject(Error(&#39;CDP timeout&#39;)); }, 5000); pending.… |
| id | const | 32 | no | const id = ++next; const timer = setTimeout(() =&gt; { pending.delete(id); reject(Error(&#39;CDP timeout&#39;)); }, 5000); |
| expression | const | 39 | no | const expression = `(() =&gt; { const groups = { composer: &#39;textarea,[contenteditable=&quot;true&quot;],[role=&quot;textbox&quot;]&#39;, send: &#39;button,[role=&quot;button&quot;],input[type=&quot;submit&quot;]&#39;, assistant: &#39;[data-message-author-rol… |
| groups | const | 40 | no | const groups = { composer: &#39;textarea,[contenteditable=&quot;true&quot;],[role=&quot;textbox&quot;]&#39;, send: &#39;button,[role=&quot;button&quot;],input[type=&quot;submit&quot;]&#39;, assistant: &#39;[data-message-author-role=&quot;assistant&quot;],[data-testid*=… |
| clean | function | 41 | no | const clean = value =&gt; value === null ? null : value.replace(/[\\\\x00-\\\\x1f\\\\x7f]/g, &#39; &#39;).slice(0, 100); |
| describe | function | 42 | no | const describe = el =&gt; { const tag = el.tagName.toLowerCase(); const testid = clean(el.getAttribute(&#39;data-testid&#39;)); const role = clean(el.getAttribute(&#39;role&#39;)); const label = clean(el.getAttribute(&#39;… |
| result | const | 45 | no | const result = await call(&#39;Runtime.evaluate&#39;, { expression, returnByValue: true }, sessionId); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Read-only attribute discovery. Never operates on VIVIM's CDP port.
const args = process.argv.slice(2);
function option(name, fallback) {
  const indices = args.flatMap((v, i) => v === name ? [i] : []);
  if (indices.length > 1 || (indices.length && (!args[indices[0] + 1] || args[indices[0] + 1].startsWith('--')))) throw Error(`Invalid ${name}`);
  return indices.length ? args[indices[0] + 1] : fallback;
}
async function main() {
  if (args.some((v, i) => i % 2 === 0 && !['--port', '--host', '--target'].includes(v)) || args.length % 2) throw Error('Usage: --port 9333 --target <exact targetId> [--host 127.0.0.1]');
  const host = option('--host', '127.0.0.1');
  const port = Number(option('--port', '9333'));
  if (!['127.0.0.1', '::1', '[::1]'].includes(host) || !Number.isInteger(port) || port < 1 || port > 65535 || port === 9222) throw Error('CDP_PORT_REFUSED');
  const targetId = option('--target');
  if (!targetId) throw Error('Exact --target is required');
  const authority = host.includes(':') ? '[::1]' : host;
  const response = await fetch(`http://${authority}:${port}/json/version`, { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!response.ok) throw Error('CDP discovery failed');
  const endpoint = new URL((await response.json()).webSocketDebuggerUrl);
  if (endpoint.protocol !== 'ws:' || !['127.0.0.1', '[::1]'].includes(endpoint.hostname) || Number(endpoint.port) !== port || endpoint.username || endpoint.password) throw Error('CDP_PORT_REFUSED');
  const ws = new WebSocket(endpoint.href);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', () => reject(Error('CDP connection failed')), { once: true }); });
  let next = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data); const item = pending.get(msg.id); if (!item) return;
    pending.delete(msg.id); clearTimeout(item.timer);
    if (msg.error) item.reject(Error('CDP command failed')); else item.resolve(msg.result);
  });
  ws.addEventListener('close', () => { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('CDP connection closed')); } pending.clear(); });
  const call = (method, params, sessionId) => new Promise((resolve, reject) => {
    const id = ++next; const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout')); }, 5000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  try {
    const { targetInfos } = await call('Target.getTargets', {});
    if (!targetInfos.some(t => t.targetId === targetId && t.type === 'page')) throw Error('Exact page target not found');
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    const expression = `(() => {
      const groups = { composer: 'textarea,[contenteditable="true"],[role="textbox"]', send: 'button,[role="button"],input[type="submit"]', assistant: '[data-message-author-role="assistant"],[data-testid*="assistant" i],model-response,.chat-assistant' };
      const clean = value => value === null ? null : value.replace(/[\\x00-\\x1f\\x7f]/g, ' ').slice(0, 100);
      const describe = el => { const tag = el.tagName.toLowerCase(); const testid = clean(el.getAttribute('data-testid')); const role = clean(el.getAttribute('role')); const label = clean(el.getAttribute('aria-label')); const placeholder = clean(el.getAttribute('placeholder')); const selector = testid ? tag + '[data-testid="' + CSS.escape(testid) + '"]' : role ? tag + '[role="' + CSS.escape(role) + '"]' : tag; return { tag, role, 'aria-label': label, 'data-testid': testid, placeholder, selector: selector.slice(0, 160) }; };
      return Object.fromEntries(Object.entries(groups).map(([key, selector]) => [key, Array.from(document.querySelectorAll(selector)).slice(0, 100).map(describe)]));
    })()`;
    const result = await call('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
    if (result.exceptionDetails || !result.result?.value) throw Error('Discovery evaluation failed');
    console.log(JSON.stringify(result.result.value, null, 2));
  } finally { ws.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
