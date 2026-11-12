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
