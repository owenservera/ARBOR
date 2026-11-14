// Host-local, append-only product journal. Never grants privileged control effects.
import { constants } from 'node:fs';
import { mkdir, readFile, lstat, open } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const MAX_JOURNAL_BYTES = 8 * 1024 * 1024;
const MAX_ENTRY_BYTES = 4096;
const MAX_CHAT_TEXT = 1000;
const MAX_WIKI_TEXT = 3072; // record (including metadata and UTF-8) must fit one 4KB append
const SAFE_NAME = /^[A-Za-z][A-Za-z0-9 _.-]{0,79}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/;
const ACTORS = new Set(['human', 'ai', 'owner-browser', 'loop-agent']);
const queues = new Map(); // serializes distinct journal objects sharing one path in this process

function copy(value) { return JSON.parse(JSON.stringify(value)); }
function invalid(message, status = 400) { return Object.assign(new Error(message), { status }); }
function ownKeys(value, allowed) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).every(key => allowed.includes(key));
}
function requireShape(ok, message, status) { if (!ok) throw invalid(message, status); }
function byteSize(value) { return Buffer.byteLength(JSON.stringify(value), 'utf8'); }

function validateEnvelope(entry, { stored = false } = {}) {
  const fault = stored ? 503 : 400;
  const base = ['kind', 'actor', 'schemaVersion'];
  const meta = stored ? ['receivedAt', 'entryId', 'sequence'] : [];
  const allowed = {
    'chat-send': [...base, 'text', 'intent', ...meta],
    'wiki-edit': [...base, 'expectedRevision', 'edit', ...meta],
    'gate-decision': [...base, 'itemId', 'decision', ...meta],
    'feedback-round': [...base, 'round', 'approveAll', 'verdicts', ...meta]
  };
  requireShape(entry && typeof entry === 'object' && !Array.isArray(entry) &&
    Object.hasOwn(allowed, entry.kind) && ownKeys(entry, allowed[entry.kind]), 'Invalid journal envelope', fault);
  const legacyGate = stored && entry.kind === 'gate-decision' && entry.schemaVersion === undefined && entry.actor === undefined;
  requireShape(entry.schemaVersion === 1 || legacyGate, 'Invalid journal schema version', fault);
  if (!legacyGate) {
    const actorOK = entry.kind === 'wiki-edit' ? entry.actor === 'owner-browser' :
      entry.kind === 'gate-decision' ? entry.actor === 'keeper' :
      entry.kind === 'feedback-round' ? entry.actor === 'loop-agent' : ACTORS.has(entry.actor);
    requireShape(actorOK, 'Invalid mutation actor scope', fault);
  }
  if (entry.kind === 'chat-send') {
    requireShape(typeof entry.text === 'string' && entry.text.trim().length > 0 &&
      entry.text.length <= MAX_CHAT_TEXT, 'Invalid chat text', fault);
    if (entry.intent !== undefined) requireShape(
      (entry.intent === null || (typeof entry.intent === 'object' && !Array.isArray(entry.intent))) &&
      byteSize(entry.intent) <= 2048, 'Invalid bounded intent projection', fault);
  } else if (entry.kind === 'wiki-edit') {
    const e = entry.edit;
    requireShape(ownKeys(e, ['action','page','section','content']) &&
      e.action === 'set-section' && typeof e.page === 'string' && SAFE_NAME.test(e.page) &&
      typeof e.section === 'string' && SAFE_NAME.test(e.section) &&
      typeof e.content === 'string' && Buffer.byteLength(e.content, 'utf8') <= MAX_WIKI_TEXT,
      'Invalid bounded Wiki set-section edit', fault);
    requireShape(Number.isSafeInteger(entry.expectedRevision) && entry.expectedRevision >= 0,
      'Wiki edit requires expectedRevision', stored ? 503 : 428);
  } else if (entry.kind === 'gate-decision') {
    requireShape(typeof entry.itemId === 'string' && SAFE_ID.test(entry.itemId) &&
      ['approve','reject','defer'].includes(entry.decision), 'Invalid gate-decision record', fault);
  } else {
    requireShape(typeof entry.round === 'string' && SAFE_ID.test(entry.round) &&
      typeof entry.approveAll === 'boolean' && Array.isArray(entry.verdicts) && entry.verdicts.length <= 32 &&
      entry.verdicts.every(v => ownKeys(v, ['id','itemId','verdict','decision']) &&
        typeof (v.id ?? v.itemId) === 'string' && SAFE_ID.test(v.id ?? v.itemId) &&
        ['approve','reject','defer','pass','fail'].includes(v.verdict ?? v.decision)),
      'Invalid bounded feedback round', fault);
  }
  if (stored) {
    requireShape(typeof entry.receivedAt === 'string' && !Number.isNaN(Date.parse(entry.receivedAt)),
      'Invalid receivedAt', 503);
    const hasId = Object.hasOwn(entry, 'entryId');
    const hasSeq = Object.hasOwn(entry, 'sequence');
    requireShape(hasId === hasSeq && (!hasId ||
      (typeof entry.entryId === 'string' && /^[0-9a-f-]{36}$/.test(entry.entryId) &&
       Number.isSafeInteger(entry.sequence) && entry.sequence >= 1)), 'Invalid journal identity', 503);
  }
  requireShape(byteSize(entry) <= MAX_ENTRY_BYTES, 'Entry exceeds 4KB', stored ? 503 : 413);
}
function normalizeLegacy(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  // Older demo feedback writes had no kind; preserve their bytes and read-only semantics.
  if (!Object.hasOwn(record, 'kind') && ownKeys(record, ['round','approveAll','verdicts','receivedAt'])) {
    return { ...record, kind: 'feedback-round', actor: 'loop-agent', schemaVersion: 1 };
  }
  return record;
}

export function replayProductJournal(seedState, seedWiki, records) {
  const wiki = copy(seedWiki);
  const chat = copy(seedState.chat || []);
  let lastAt = seedState.at || new Date(0).toISOString();
  let productRevision = 0;
  const ids = new Set();
  for (let i = 0; i < records.length; i++) {
    const e = normalizeLegacy(records[i]);
    validateEnvelope(e, { stored: true });
    if (e.entryId) {
      requireShape(!ids.has(e.entryId) && e.sequence === i + 1, 'Duplicate or out-of-order journal entry', 503);
      ids.add(e.entryId);
    }
    if (e.kind === 'chat-send') {
      chat.push({ actor: e.actor, who: e.actor === 'owner-browser' || e.actor === 'human' ? 'user' : 'system',
        text: e.text, schemaVersion: e.schemaVersion, at: e.receivedAt, intent: e.intent || null,
        revision: ++productRevision });
      lastAt = e.receivedAt;
    } else if (e.kind === 'wiki-edit') {
      requireShape(wiki.pages?.[e.edit.page]?.sections &&
        Object.hasOwn(wiki.pages[e.edit.page].sections, e.edit.section) &&
        e.expectedRevision === wiki.revision, 'Invalid or stale journal Wiki edit', 503);
      wiki.pages[e.edit.page].sections[e.edit.section] = e.edit.content;
      wiki.revision++;
      productRevision++;
      lastAt = e.receivedAt;
    }
  }
  wiki.at = lastAt;
  return { state: { schemaVersion: 1, chat, wikiRevision: wiki.revision, revision: productRevision, at: lastAt },
    wiki, journalRevision: records.length };
}

export function validateProductEdit(payload, wiki) {
  validateEnvelope(payload);
  requireShape(wiki.pages?.[payload.edit.page]?.sections &&
    Object.hasOwn(wiki.pages[payload.edit.page].sections, payload.edit.section), 'Wiki target does not exist', 404);
  requireShape(payload.expectedRevision === wiki.revision, 'Stale Wiki revision', 409);
}

export function createProductJournal({ dataRoot, seedState, seedWiki }) {
  const journalPath = path.resolve(dataRoot, 'product-state', 'journal.jsonl');
  const directory = path.dirname(journalPath);
  async function snapshot() {
    let bytes;
    try {
      const st = await lstat(journalPath);
      requireShape(st.isFile() && !st.isSymbolicLink() && st.size <= MAX_JOURNAL_BYTES,
        'Unsafe or oversized product journal', 503);
      bytes = await readFile(journalPath);
    } catch (error) {
      if (error?.code === 'ENOENT') return { records: [], committed: '', tornTail: false, size: 0 };
      throw error;
    }
    requireShape(bytes.length <= MAX_JOURNAL_BYTES, 'Product journal exceeds read limit', 503);
    const finalLF = bytes.lastIndexOf(10);
    const committedBytes = bytes.subarray(0, finalLF + 1);
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(committedBytes); }
    catch { throw invalid('Invalid journal UTF-8', 503); }
    const records = [];
    for (const line of text.split('\n').slice(0, -1)) {
      requireShape(line !== '' && Buffer.byteLength(line, 'utf8') <= MAX_ENTRY_BYTES,
        'Empty or oversized committed journal entry', 503);
      let record;
      try { record = JSON.parse(line); }
      catch { throw invalid('Corrupt committed journal segment', 503); }
      records.push(record);
    }
    replayProductJournal(seedState, seedWiki, records);
    return { records, committed: text, tornTail: finalLF !== bytes.length - 1, size: bytes.length };
  }
  async function readRecords() { return (await snapshot()).records; }
  async function readProjection() { return replayProductJournal(seedState, seedWiki, await readRecords()); }
  function append(payload) {
    const run = async () => {
      validateEnvelope(payload);
      const current = await snapshot();
      requireShape(!current.tornTail, 'Torn journal tail requires explicit owner repair', 503);
      const projected = replayProductJournal(seedState, seedWiki, current.records);
      if (payload.kind === 'wiki-edit') validateProductEdit(payload, projected.wiki);
      const entry = { ...copy(payload), receivedAt: new Date().toISOString(), entryId: randomUUID(),
        sequence: current.records.length + 1 };
      validateEnvelope(entry, { stored: true });
      const line = JSON.stringify(entry) + '\n';
      const length = Buffer.byteLength(line, 'utf8');
      requireShape(length <= MAX_ENTRY_BYTES && current.size + length <= MAX_JOURNAL_BYTES,
        'Product journal capacity reached', 507);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const dirStat = await lstat(directory);
      requireShape(dirStat.isDirectory() && !dirStat.isSymbolicLink(), 'Unsafe journal directory', 503);
      // No temp-file replacement: one append, then fsync before acknowledging a commit.
      const handle = await open(journalPath, constants.O_APPEND | constants.O_WRONLY |
        constants.O_CREAT | (constants.O_NOFOLLOW || 0), 0o600);
      try {
        const st = await handle.stat();
        requireShape(st.isFile() && st.size === current.size, 'Journal changed outside Host writer', 503);
        const { bytesWritten } = await handle.write(Buffer.from(line));
        requireShape(bytesWritten === length, 'Partial journal append; outcome uncertain', 503);
        await handle.sync();
      } finally { await handle.close(); }
      const next = replayProductJournal(seedState, seedWiki, [...current.records, entry]);
      return { ...entry, revision: next.state.revision, wikiRevision: next.wiki.revision };
    };
    const before = queues.get(journalPath) || Promise.resolve();
    const pending = before.then(run, run);
    const settled = pending.then(() => {}, () => {});
    queues.set(journalPath, settled);
    void settled.then(() => { if (queues.get(journalPath) === settled) queues.delete(journalPath); });
    return pending;
  }
  async function rawJournal() { return (await snapshot()).committed; }
  return { journalPath, readRecords, readProjection, append, rawJournal };
}
