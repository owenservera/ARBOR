# File: harness/src/core/cdp.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/cdp.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5137 B |
| Lines | 34 |
| Hash | 0c2b43cbc279 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| refused | function | 1 | no | function refused() { return Object.assign(new Error(&#39;CDP endpoint refused&#39;), { code:&#39;CDP_PORT_REFUSED&#39; }); } |
| notFound | function | 2 | no | function notFound() { return Object.assign(new Error(&#39;Target not found&#39;), { code:&#39;CDP_TARGET_NOT_FOUND&#39; }); } |
| connect | function | 3 | yes | export async function connect({ port, host = &#39;127.0.0.1&#39; }) { |
| address | const | 5 | no | const address = host === &#39;::1&#39; ? &#39;[::1]&#39; : host; |
| base | const | 6 | no | const base = `http://${address}:${Number(port)}`; |
| get | function | 7 | no | async function get(path) { const r = await fetch(base + path); if (!r.ok) throw new Error(`CDP HTTP ${r.status}`); return r.json(); } |
| targets | function | 8 | no | const targets = async () =&gt; (await get(&#39;/json/list&#39;)).map(({ id,url,title,type }) =&gt; ({ id,url,title,type })); |
| isPage | function | 9 | no | const isPage = async id =&gt; typeof id === &#39;string&#39; &amp;&amp; (await targets()).some(t =&gt; t.id === id &amp;&amp; t.type === &#39;page&#39;); |
| checkEndpoint | function | 11 | no | async function checkEndpoint() { |
| version | const | 12 | no | const version = await get(&#39;/json/version&#39;); const u = new URL(version.webSocketDebuggerUrl); |
| attach | function | 16 | no | async function attach(id) { |
| wsUrl | const | 19 | no | const wsUrl = await checkEndpoint(); |
| ws | const | 20 | no | const ws = new WebSocket(wsUrl.href); await new Promise((resolve,reject) =&gt; { ws.addEventListener(&#39;open&#39;,resolve,{once:true}); ws.addEventListener(&#39;error&#39;,reject,{once:true}); }); |
| seq | variable | 21 | no | let seq = 0; const pending = new Map(); |
| call | function | 24 | no | const call = (method, params = {}, sessionId) =&gt; new Promise((resolve,reject) =&gt; { const id = ++seq; pending.set(id,{resolve,reject}); try { ws.send(JSON.stringify({ id,method,params,...(sessionId ? … |
| cmd | function | 26 | no | const cmd = (method,params) =&gt; call(method,params,sessionId); |
| evaluate | function | 27 | no | const evaluate = async expression =&gt; { const r = await cmd(&#39;Runtime.evaluate&#39;, { expression, returnByValue:true, awaitPromise:true }); if (r.exceptionDetails) throw new Error(&#39;Page evaluation failed&#39;… |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/core/cdp.mjs |
| [harness/scripts/signin-check.mjs](../../scripts/signin-check.mjs.md) | ../src/core/cdp.mjs |
| [harness/test/core/core.test.mjs](../../test/core/core.test.mjs.md) | ../../src/core/cdp.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
function refused() { return Object.assign(new Error('CDP endpoint refused'), { code:'CDP_PORT_REFUSED' }); }
function notFound() { return Object.assign(new Error('Target not found'), { code:'CDP_TARGET_NOT_FOUND' }); }
export async function connect({ port, host = '127.0.0.1' }) {
  if (Number(port) === 9222 || !['127.0.0.1','localhost','::1'].includes(host) || !Number.isInteger(Number(port)) || Number(port) < 1 || Number(port) > 65535) throw refused();
  const address = host === '::1' ? '[::1]' : host;
  const base = `http://${address}:${Number(port)}`;
  async function get(path) { const r = await fetch(base + path); if (!r.ok) throw new Error(`CDP HTTP ${r.status}`); return r.json(); }
  const targets = async () => (await get('/json/list')).map(({ id,url,title,type }) => ({ id,url,title,type }));
  const isPage = async id => typeof id === 'string' && (await targets()).some(t => t.id === id && t.type === 'page');
  // The browser websocket must be on our selected loopback endpoint; checked before any mutating HTTP call.
  async function checkEndpoint() {
    const version = await get('/json/version'); const u = new URL(version.webSocketDebuggerUrl);
    if (!['127.0.0.1','localhost','[::1]','::1'].includes(u.hostname) || Number(u.port) !== Number(port)) throw refused();
    return u;
  }
  async function attach(id) {
    if (!(await isPage(id))) throw notFound();
    // The browser websocket is obtained from our selected loopback endpoint, not from a page URL.
    const wsUrl = await checkEndpoint();
    const ws = new WebSocket(wsUrl.href); await new Promise((resolve,reject) => { ws.addEventListener('open',resolve,{once:true}); ws.addEventListener('error',reject,{once:true}); });
    let seq = 0; const pending = new Map();
    ws.addEventListener('message', event => { const m = JSON.parse(event.data); if (!m.id) return; const p = pending.get(m.id); if (!p) return; pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); });
    ws.addEventListener('close', () => { for (const p of pending.values()) p.reject(new Error('CDP closed')); pending.clear(); });
    const call = (method, params = {}, sessionId) => new Promise((resolve,reject) => { const id = ++seq; pending.set(id,{resolve,reject}); try { ws.send(JSON.stringify({ id,method,params,...(sessionId ? { sessionId } : {}) })); } catch (e) { pending.delete(id); reject(e); } });
    const { sessionId } = await call('Target.attachToTarget', { targetId:id, flatten:true });
    const cmd = (method,params) => call(method,params,sessionId);
    const evaluate = async expression => { const r = await cmd('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true }); if (r.exceptionDetails) throw new Error('Page evaluation failed'); return r.result.value; };
    return { targetId:id, url:() => evaluate('location.href'), evaluate, insertText:text => cmd('Input.insertText',{text}), bringToFront:() => cmd('Page.bringToFront'), pressEscape:async () => { await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}); await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}); }, pressEnter:async () => { await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13}); await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); }, click:async selector => { /* One DOM click (same as PinchTab submit:true): synthetic mouse input is not delivered to tabs opened in the background. Never retried. */ const ok = await evaluate(`(async () => { /* wait (bounded) for frameworks to enable the button after typing, then click exactly once */ const sel = ${JSON.stringify(selector)}; const ready = e => e && !e.disabled && e.getAttribute('aria-disabled') !== 'true'; for (let i = 0; i < 30 && !ready(document.querySelector(sel)); i++) await new Promise(r => setTimeout(r, 100)); const e = document.querySelector(sel); if (!e) return false; e.click(); return true; })()`); if (!ok) throw new Error('Send button missing'); }, close:async () => { try { await call('Target.closeTarget',{targetId:id}); } finally { ws.close(); } } };
  }
  return { targets, attach,
    async openPage(url) { await checkEndpoint(); const r = await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method:'PUT' }); if (!r.ok) throw new Error(`CDP HTTP ${r.status}`); const page = await attach((await r.json()).id); for (let i = 0; i < 40; i++) { try { if (await page.evaluate('document.readyState') === 'complete') break; } catch { /* navigating */ } await new Promise(res => setTimeout(res, 500)); } await new Promise(res => setTimeout(res, 1500)); return page; },
    // G4: closes one page target via the DevTools HTTP endpoint. Ownership is enforced by the tab registry.
    async closeTarget(id) { await checkEndpoint(); if (!(await isPage(id))) throw notFound(); const r = await fetch(`${base}/json/close/${encodeURIComponent(id)}`); if (!r.ok) throw new Error(`CDP HTTP ${r.status}`); return true; } };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
