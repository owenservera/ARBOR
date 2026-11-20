# File: harness/src/interface/server.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/server.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3055 B |
| Lines | 32 |
| Hash | c6fe895d225c |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createServer | function | 3 | yes | export function createServer({ router, host = &#39;127.0.0.1&#39;, timeoutMs = 30000 } = {}) { |
| server | const | 5 | no | const server = http.createServer(async (req, res) =&gt; { const send = (status, body) =&gt; { res.writeHead(status, { &#39;content-type&#39;: &#39;application/json&#39; }); res.end(JSON.stringify(body)); }; try { const ur… |
| send | function | 6 | no | const send = (status, body) =&gt; { res.writeHead(status, { &#39;content-type&#39;: &#39;application/json&#39; }); res.end(JSON.stringify(body)); }; |
| url | const | 8 | no | const url = new URL(req.url, &#39;http://127.0.0.1&#39;); |
| list | const | 11 | no | const list = await router.models({ refresh: url.searchParams.get(&#39;refresh&#39;) === &#39;1&#39; }); |
| data | const | 12 | no | const data = [{ id: &#39;auto&#39;, object: &#39;model&#39;, created: 0, owned_by: &#39;web-harness&#39; }]; |
| raw | variable | 20 | no | let raw = &#39;&#39;; for await (const chunk of req) { raw += chunk; if (raw.length &gt; 1024 * 1024) throw new Error(&#39;Request too large&#39;); } |
| body | const | 21 | no | const body = JSON.parse(raw); |
| prompt | const | 24 | no | const prompt = body.messages?.filter(m =&gt; m.role === &#39;user&#39;).map(m =&gt; m.content).join(&#39;\\n&#39;); |
| pending | const | 25 | no | const pending = await router.ask({ provider: body.model, prompt, threadUrl: body.threadUrl \|\| &#39;new&#39;, ...(body.constraints ? { constraints: body.constraints } : {}) }); |
| result | const | 26 | no | const result = await router.wait(pending.requestId, timeoutMs); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 1 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/server.mjs |
| [harness/test/interface/interface.test.mjs](../../test/interface/interface.test.mjs.md) | ../../src/interface/server.mjs |
| [harness/test/interface/models-router.test.mjs](../../test/interface/models-router.test.mjs.md) | ../../src/interface/server.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import http from 'node:http';

export function createServer({ router, host = '127.0.0.1', timeoutMs = 30000 } = {}) {
  if (host !== '127.0.0.1') throw new Error('Only 127.0.0.1 is allowed');
  const server = http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'GET' && /^\/v1\/requests\/[A-Za-z0-9_-]+$/.test(url.pathname)) { const result = await router.result(url.pathname.split('/').pop()); return send(result ? 200 : 404, result || { error: 'Not found' }); }
      if (req.method === 'GET' && url.pathname === '/v1/models') {
        const list = await router.models({ refresh: url.searchParams.get('refresh') === '1' });
        const data = [{ id: 'auto', object: 'model', created: 0, owned_by: 'web-harness' }];
        for (const p of list) {
          data.push({ id: p.provider, object: 'model', created: 0, owned_by: p.provider, current: p.current });
          for (const m of p.models) data.push({ id: `${p.provider}:${m.id}`, object: 'model', created: 0, owned_by: p.provider, label: m.label, current: m.current });
        }
        return send(200, { object: 'list', data });
      }
      if (req.method !== 'POST' || !['/v1/ask', '/v1/chat/completions'].includes(url.pathname)) return send(404, { error: 'Not found' });
      let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 1024 * 1024) throw new Error('Request too large'); }
      const body = JSON.parse(raw);
      if (url.pathname === '/v1/ask') return send(202, await router.ask(body));
      if (body.stream) return send(400, { error: { message: 'Streaming is not supported' } });
      const prompt = body.messages?.filter(m => m.role === 'user').map(m => m.content).join('\n');
      const pending = await router.ask({ provider: body.model, prompt, threadUrl: body.threadUrl || 'new', ...(body.constraints ? { constraints: body.constraints } : {}) });
      const result = await router.wait(pending.requestId, timeoutMs);
      if (result?.status !== 'complete') return send(202, { error: { message: 'Request not complete', status: result?.status, requestId: pending.requestId } });
      return send(200, { id: pending.requestId, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: result.model ? `${result.provider}:${result.model.id}` : (result.provider || body.model), choices: [{ index: 0, message: { role: 'assistant', content: result.reply }, finish_reason: 'stop' }] });
    } catch (error) { return send(400, { error: { message: error.message } }); }
  });
  return { server, listen(port = 0) { return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => { server.off('error', reject); resolve(server.address()); }); }); }, close() { return new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve())); } };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
