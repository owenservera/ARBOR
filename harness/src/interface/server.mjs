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
