import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const digestPayload = value => createHash('sha256').update(value, 'utf8').digest('hex');
export function threadKeyFor(provider, threadUrl) {
  const id = typeof provider === 'string' ? provider : provider.id;
  return `${id}:${threadUrl === 'new' || threadUrl == null ? 'new' : new URL(threadUrl).href}`;
}
const fields = new Set(['requestId','provider','threadKey','payloadDigest','state','submitted','boundary','replyDigest','threadUrl','createdAt','updatedAt','reason','requestedModel','model','routing']);
function clean(rec) {
  const out = {};
  for (const [k,v] of Object.entries(rec)) if (fields.has(k)) out[k] = v;
  if (out.boundary) out.boundary = { userTurns: out.boundary.userTurns, assistantTurns: out.boundary.assistantTurns };
  return out;
}
export function createJournal({ dir }) {
  const file = id => {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid requestId');
    return join(dir, `${id}.json`);
  };
  async function read(id) { try { return JSON.parse(await readFile(file(id), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
  return {
    async create(rec) {
      const path = file(rec.requestId); await mkdir(dir, { recursive: true });
      const now = new Date().toISOString();
      const data = clean({ state:'accepted', submitted:'no', boundary:null, replyDigest:null, reason:null, ...rec, createdAt:now, updatedAt:now });
      try { const h = await open(path, 'wx', 0o600); try { await h.writeFile(JSON.stringify(data)); } finally { await h.close(); } return { created:true, existing:null }; }
      catch (e) { if (e.code === 'EEXIST') return { created:false, existing:await read(rec.requestId) }; throw e; }
    },
    async update(id, patch) {
      const old = await read(id); if (!old) throw new Error('Journal request not found');
      const data = clean({ ...old, ...patch, requestId:id, updatedAt:new Date().toISOString() });
      const temp = `${file(id)}.${randomUUID()}.tmp`;
      try { const h = await open(temp, 'wx', 0o600); try { await h.writeFile(JSON.stringify(data)); } finally { await h.close(); } await rename(temp, file(id)); }
      finally { await unlink(temp).catch(() => {}); }
      return data;
    }, read,
    async list() { await mkdir(dir, { recursive:true }); const names = await readdir(dir); return Promise.all(names.filter(n => /^[A-Za-z0-9_-]{1,128}\.json$/.test(n)).map(n => read(n.slice(0,-5)))); }
  };
}
