import { mkdir, readFile, writeFile, rename, unlink, link } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

// Publish a file exclusively and with complete contents. The body is written to a private temp file,
// then hard-linked to the final name, which fails with EEXIST if the name exists. A concurrent reader
// therefore never sees a partially written approval (which previously surfaced as a failed send).
async function createExclusive(file, body) {
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, body, { mode: 0o600 });
  try { await link(temp, file); } finally { await unlink(temp).catch(() => {}); }
}

export function createApprovals({ dir, ttlMs = 600000, now = Date.now, print = console.log }) {
  const path = (id, state) => {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid requestId');
    return join(dir, `${id}.${state}.json`);
  };
  const read = async (id, state) => { try { return JSON.parse(await readFile(path(id, state), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  return {
    async request({ requestId, provider, threadUrl, payloadDigest, preview }) {
      await mkdir(dir, { recursive: true });
      const text = String(preview); const record = { requestId, provider, threadUrl, payloadDigest, preview: text.slice(0, 200), charCount: text.length, expiresAt: now() + ttlMs };
      await createExclusive(path(requestId, 'pending'), JSON.stringify(record));
      print(`Provider: ${provider}\nThread: ${threadUrl}\nPreview: ${record.preview}\nCharacters: ${record.charCount}`);
      return record;
    },
    pending: id => read(id, 'pending'),
    async approve(id) {
      const record = await read(id, 'pending');
      if (!record || record.expiresAt <= now()) throw new Error('Approval missing or expired');
      // Exclusive creation prevents a second grant, including concurrent CLI processes.
      await createExclusive(path(id, 'approved'), JSON.stringify({ ...record, approved: true, approvedAt: now() }));
      await unlink(path(id, 'pending')).catch(() => {});
      return record;
    },
    async consume({ requestId, payloadDigest, threadUrl }) {
      const record = await read(requestId, 'approved');
      if (!record || record.expiresAt <= now() || record.payloadDigest !== payloadDigest || record.threadUrl !== threadUrl || record.requestId !== requestId) return null;
      // Rename is not exclusive on all platforms; exclusive claim is the synchronization point.
      try { await writeFile(path(requestId, 'used'), '', { flag: 'wx', mode: 0o600 }); } catch (e) { if (e.code === 'EEXIST') return null; throw e; }
      await rename(path(requestId, 'approved'), path(requestId, 'consumed'));
      return record;
    }
  };
}
