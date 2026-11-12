// Bootstrap bridge: durable command queue from the phone (/mobile) to a consumer that executes it.
// Today the consumer is Grok Bot (via `studio bridge list|claim|reply`); later the harness/fleet
// ('harness'). No provider API is ever called here: this module only stores records.
// Storage: append-only JSONL of full record snapshots under <data>/bridge/commands.jsonl; the latest
// snapshot per id wins, so a crash mid-write loses at most the last line.
import { appendFileSync, mkdirSync, readFileSync, existsSync, openSync, closeSync, readSync, statSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { problem } from './http.mjs';

export const CONSUMERS = ['grokbot', 'harness', 'bootstrap'];
export const KINDS = ['command', 'intent', 'stage'];
const ID = /^cmd-[a-f0-9]{16}$/;
const MAX_TEXT = 8000, MAX_RESULT = 64000;

// Parsed queue cache, keyed by the absolute JSONL path. The bridge file is append-only, so a
// request that sees a larger file parses only the appended tail; a rewritten, truncated or
// fingerprint-mismatched file falls back to a full read. The map is the same one the old
// per-call parse built, just retained between calls.
const queueCache = new Map();
const TAIL_BYTES = 64;
let cacheHits = 0, cacheMisses = 0, cacheIncremental = 0;

// Test/audit view only. Never used by product paths.
export function bridgeStoreCacheStats() {
  return { entries: queueCache.size, hits: cacheHits, misses: cacheMisses, incremental: cacheIncremental };
}

// Parse complete lines from a byte region; return the map plus how many bytes were consumed
// (a non-newline-terminated tail is left for the next append instead of being treated as a record).
function parseLines(map, bytes) {
  const lastNewline = bytes.lastIndexOf(0x0a);
  if (lastNewline < 0) return { consumed: 0 };
  const text = bytes.subarray(0, lastNewline + 1).toString('utf8');
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (ID.test(r?.id)) map.set(r.id, r); } catch { /* torn tail line */ }
  }
  return { consumed: lastNewline + 1 };
}

function fingerprint(bytes, end, length = TAIL_BYTES) {
  const from = Math.max(0, end - length);
  return Buffer.from(bytes.subarray(from, end));
}

function readRegion(fd, start, length) {
  const buf = Buffer.allocUnsafe(length);
  let read = 0;
  while (read < length) {
    const n = readSync(fd, buf, read, length - read, start + read);
    if (n <= 0) break;
    read += n;
  }
  return read === length ? buf : buf.subarray(0, read);
}

export function createBridgeStore({ root }) {
  const dir = path.join(root, 'bridge'), file = path.join(dir, 'commands.jsonl');
  const load = () => {
    if (!existsSync(file)) { queueCache.delete(file); return new Map(); }
    const st = statSync(file);
    const cached = queueCache.get(file);
    if (cached && cached.size === st.size && cached.mtimeMs === st.mtimeMs) {
      cacheHits++;
      return cached.map;
    }
    // Append-only path: the file grew and the bytes before the old end still match the fingerprint.
    if (cached && st.size > cached.size && st.mtimeMs !== cached.mtimeMs) {
      const fd = openSync(file, 'r');
      let result = null;
      try {
        const before = fingerprint(readRegion(fd, 0, cached.size), cached.size);
        if (before.equals(cached.tail)) {
          const appended = readRegion(fd, cached.size, st.size - cached.size);
          const { consumed } = parseLines(cached.map, appended);
          if (consumed > 0) {
            const end = cached.size + consumed;
            const head = readRegion(fd, 0, end);
            result = { size: end, mtimeMs: st.mtimeMs, map: cached.map, tail: fingerprint(head, end) };
          }
        }
      } catch {
        result = null;
      } finally { closeSync(fd); }
      if (result) {
        cacheIncremental++;
        queueCache.set(file, result);
        return result.map;
      }
    }
    cacheMisses++;
    const map = new Map();
    const bytes = readFileSync(file);
    const { consumed } = parseLines(map, bytes);
    queueCache.set(file, { size: consumed, mtimeMs: st.mtimeMs, map, tail: fingerprint(bytes, consumed) });
    return map;
  };
  const write = (rec) => { mkdirSync(dir, { recursive: true, mode: 0o700 }); appendFileSync(file, JSON.stringify(rec) + '\n', { mode: 0o600 }); return rec; };
  // Cross-process claim fence. Crash-left locks must be investigated, never silently stolen.
  const claimLock = path.join(dir, 'claim.lock');
  const withClaimLock = fn => {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const fd = openSync(claimLock, 'wx', 0o600);
    try { return fn(); }
    finally { try { closeSync(fd); } finally { unlinkSync(claimLock); } }
  };
  const get = (id) => {
    if (!ID.test(id ?? '')) throw problem(400, 'Invalid command id', 'BRIDGE_INVALID');
    const r = load().get(id); if (!r) throw problem(404, 'No such bridge command', 'NOT_FOUND'); return r;
  };
  const now = () => new Date().toISOString();
  // The only supported Studio conversation request key for this relay record.
  // A Studio executor must pass this exact key and the unchanged command text
  // to the existing send-once runtime; the bridge itself never submits.
  const studioKey=id=>'relay-'+id;

  return {
    file,
    list({ status, consumer, limit = 50 } = {}) {
      let items = [...load().values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (status) items = items.filter(r => r.status === status);
      if (consumer) items = items.filter(r => r.consumer === consumer);
      return { items: items.slice(0, Math.max(1, Math.min(200, Number(limit) || 50))) };
    },
    get,
    // Local source-evidence inspection only; no HTTP route publishes raw history.
    // Full snapshots are already stored in this append-only ledger. Keeping each
    // revision available prevents a fast claim/reply from erasing queue evidence.
    histories(ids) {
      if(!Array.isArray(ids)||ids.length>200||ids.some(id=>!ID.test(id??'')))
        throw problem(400,'Invalid command ids','BRIDGE_INVALID');
      const entries=new Map(ids.map(id=>[id,[]]));
      if(!existsSync(file))return entries;
      for(const line of readFileSync(file,'utf8').split('\n')) {
        if(!line.trim())continue;
        let r;try{r=JSON.parse(line);}catch{continue;}
        if(entries.has(r?.id)&&Number.isSafeInteger(r.rev)&&r.rev>=1)
          entries.get(r.id).push(r);
      }
      return entries;
    },
    history(id) {
      return this.histories([id]).get(id);
    },
    create({ text, kind = 'command', consumer = 'grokbot', stage, id, origin, chat } = {}) {
      // id/origin are only set by the relay agent (HTTP route whitelists text/kind/consumer/stage).
      if (id !== undefined && (!ID.test(id) || load().has(id))) throw problem(409, 'Invalid or duplicate id', 'BRIDGE_INVALID');
      if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) throw problem(400, `text must be 1-${MAX_TEXT} characters`, 'BRIDGE_INVALID');
      if (!KINDS.includes(kind)) throw problem(400, 'kind must be one of ' + KINDS.join(', '), 'BRIDGE_INVALID');
      if (!CONSUMERS.includes(consumer)) throw problem(400, 'consumer must be one of ' + CONSUMERS.join(', '), 'BRIDGE_INVALID');
      if (stage !== undefined && (typeof stage !== 'string' || !/^[a-z0-9-]{1,64}$/.test(stage))) throw problem(400, 'Invalid stage', 'BRIDGE_INVALID');
      const t = now();
      const commandId=id ?? 'cmd-'+randomBytes(8).toString('hex');
      return write({ schema: 'vivim.bridge-command/1', id: commandId, kind, text: text.trim(),
        ...(stage ? { stage } : {}), consumer, status: 'queued', createdAt: t, updatedAt: t, claimedBy: null, claimedAt: null, result: null, doneAt: null, rev: 1,
        ...(origin === 'relay' ? { origin, ...(chat && typeof chat === 'object' ? chat : {}),
          ...(chat?.mode === 'relay-chat' ? { studioRequestKey:studioKey(commandId) } : {}) } : {}) }); // chat: relay-validated relay-chat fields (grokbot-authored)
    },
    claim(id, { by = 'grokbot', token = null } = {}) { return withClaimLock(() => {
      const items = [...load().values()].filter(r => r.status === 'queued' && r.consumer === by).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const r = id ? get(id) : items[0];
      if (!r) return null;
      if (r.status !== 'queued') throw problem(409, `Command is ${r.status}, not queued`, 'BRIDGE_STATE');
      if (by !== r.consumer) throw problem(409, 'Consumer does not own this command', 'BRIDGE_OWNER');
      const t = now();
      return write({ ...r, status: 'claimed', claimedBy: by, claimToken: token ?? randomBytes(8).toString('hex'), claimedAt: t, updatedAt: t, rev: r.rev + 1 });
    }); },
    reply(id, text, { status = 'done' } = {}) {
      const r = get(id);
      if (!['done', 'failed'].includes(status)) throw problem(400, 'status must be done or failed', 'BRIDGE_INVALID');
      if (typeof text !== 'string' || !text.length || text.length > MAX_RESULT) throw problem(400, `result must be 1-${MAX_RESULT} characters`, 'BRIDGE_INVALID');
      if (r.status === 'done' || r.status === 'failed') throw problem(409, `Command already ${r.status}`, 'BRIDGE_STATE');
      const t = now();
      return write({ ...r, status, result: text, doneAt: t, updatedAt: t, claimedBy: r.claimedBy ?? 'grokbot', claimedAt: r.claimedAt ?? t, rev: r.rev + 1 });
    },
  };
}

export function registerBridgeRoutes({ add, paths }) {
  const store = createBridgeStore({ root: paths.root });
  const only = (body, keys) => {
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) throw problem(400, 'Unexpected bridge request fields', 'BRIDGE_INVALID');
    return body;
  };
  add('GET', '/bridge/commands', 'List bootstrap bridge commands (phone -> Grok Bot/harness), newest first',
    ({ q }) => store.list({ status: q?.status, consumer: q?.consumer, limit: q?.limit }),
    { query: { status: { type: 'string', enum: ['queued', 'claimed', 'done', 'failed'] }, consumer: { type: 'string', enum: CONSUMERS }, limit: { type: 'integer' } } });
  add('POST', '/bridge/commands', 'Queue a bootstrap command/intent for the bridge consumer; stores only, executes nothing',
    ({ body }) => store.create(only(body, ['text', 'kind', 'consumer', 'stage'])),
    { body: { type: 'object', properties: { text: { type: 'string', maxLength: MAX_TEXT }, kind: { type: 'string', enum: KINDS }, consumer: { type: 'string', enum: CONSUMERS }, stage: { type: 'string' } }, required: ['text'], additionalProperties: false }, successStatus: 201 });
  add('GET', '/bridge/commands/{id}', 'Read one bridge command with its result', ({ p }) => store.get(p.id));
  add('POST', '/bridge/commands/{id}/claim', 'Consumer claims a queued command',
    ({ p, body }) => store.claim(p.id, only(body ?? {}, ['by'])), { body: { type: 'object', properties: { by: { type: 'string', enum: CONSUMERS } }, additionalProperties: false } });
  add('POST', '/bridge/commands/{id}/reply', 'Consumer posts the result text (done|failed)',
    ({ p, body }) => { const b = only(body, ['result', 'status']); return store.reply(p.id, b.result, { status: b.status }); },
    { body: { type: 'object', properties: { result: { type: 'string' }, status: { type: 'string', enum: ['done', 'failed'] } }, required: ['result'], additionalProperties: false } });
  return store;
}
