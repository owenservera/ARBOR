// grokbot-authored. Vercel Blob (private) store: append-only revision blobs, no overwrites (no stale CDN reads).
import { list, get, put, del } from '@vercel/blob';
const read = async pathname => { const r = await get(pathname, { access: 'private' }); return r ? JSON.parse(await new Response(r.stream).text()) : null; };
const all = async prefix => { const out = []; let cursor; do { const p = await list({ prefix, cursor, limit: 1000 }); out.push(...p.blobs); cursor = p.hasMore ? p.cursor : undefined; } while (cursor); return out; };
const opts = { access: 'private', contentType: 'application/json', addRandomSuffix: false };
export function blobStore() {
  return {
    async listCommands() { return (await Promise.all((await all('cmd/')).map(b => read(b.pathname).catch(() => null)))).filter(Boolean); },
    async putCommand(r) { await put(`cmd/${r.id}/${String(r.rev).padStart(4, '0')}.json`, JSON.stringify(r), opts); },
    async putStatus(s) {
      await put(`status/${Date.now().toString().padStart(15, '0')}.json`, JSON.stringify(s), opts);
      if (Math.random() > 0.1) return; // prune occasionally: list+del on every write burns Blob ops
      const old = (await all('status/')).sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(5); if (old.length) await del(old.map(b => b.url));
    },
    async latestStatus() { const b = (await all('status/')).sort((a, b) => b.pathname.localeCompare(a.pathname))[0]; return b ? read(b.pathname) : null; },
  };
}
