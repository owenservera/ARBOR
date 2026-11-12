// grokbot-authored. Upstash Redis (REST) store, same interface as blob-store.mjs. Uses KV_REST_API_URL/TOKEN (Vercel Upstash integration).
// Commands: one hash field per command id (latest rev only, written atomically, rev-guarded by caller); status: one key with TTL.
const env = process.env;
const url = () => env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const token = () => env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
async function cmd(...args) {
  const r = await fetch(url(), { method: 'POST', headers: { authorization: `Bearer ${token()}`, 'content-type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json(); if (!r.ok || j.error) throw new Error(`Redis: ${j.error || r.status}`); return j.result;
}
export function redisStore() {
  return {
    async listCommands() { const h = await cmd('HVALS', 'vivim:cmd') || []; return h.map(v => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean); },
    async putCommand(r) { await cmd('HSET', 'vivim:cmd', r.id, JSON.stringify(r)); },
    async putStatus(s) { await cmd('SET', 'vivim:status', JSON.stringify(s), 'EX', 3600); },
    async latestStatus() { const v = await cmd('GET', 'vivim:status'); return v ? JSON.parse(v) : null; },
  };
}
