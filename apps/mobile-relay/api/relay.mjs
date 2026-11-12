// grokbot-authored. Single Vercel function; vercel.json rewrites /api/<path> here.
import { createRelay } from '../lib/relay-core.mjs';
import { redisStore } from '../lib/redis-store.mjs';
let relay;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const path = String(new URL(req.url, 'http://x').searchParams.get('path') || '').replace(/^\/+|\/+$/g, '');
    if (req.method === 'POST' && !String(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('JSON required'), { status: 415 });
    relay ??= createRelay({ store: redisStore(), env: process.env });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const out = await relay({ method: req.method, path, req, body });
    if (out.cookie) res.setHeader('Set-Cookie', out.cookie);
    res.statusCode = out.status; res.end(out.status === 204 ? '' : JSON.stringify(out.body));
  } catch (e) { if (!e.status) console.error('relay error', e?.name, String(e?.message || e).slice(0, 300)); res.statusCode = e.status || 500; res.end(JSON.stringify({ error: e.status ? e.message : 'Relay error' })); }
}
