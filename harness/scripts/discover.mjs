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
