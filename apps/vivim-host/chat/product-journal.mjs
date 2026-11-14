// Host-owned, data-root-local projection of the existing product/demo mutation journal.
// This is a UI workbench journal, NOT the privileged control dispatcher or HQKG authority.
// One append writer. No repo files and no standalone graph store are mutated.
import { mkdir, readFile, stat, appendFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_JOURNAL_BYTES = 8 * 1024 * 1024;
const MAX_CHAT_TEXT = 1000;
const MAX_WIKI_TEXT = 16 * 1024;
const SAFE_NAME = /^[A-Za-z][A-Za-z0-9 _.-]{0,79}$/;

function copy(value) { return JSON.parse(JSON.stringify(value)); }
function invalid(message, code = 400) { const e = new Error(message); e.status = code; return e; }

export function replayProductJournal(seedState, seedWiki, records) {
  const wiki = copy(seedWiki);
  const chat = [...(seedState.chat || [])];
  let lastAt = seedState.at || new Date(0).toISOString();
  let productRevision = 0;
  let appliedEdits = 0;
  for (const e of records) {
    if (!e || typeof e !== 'object') continue;
    if (e.kind === 'chat-send' && typeof e.text === 'string') {
      chat.push({
        actor: e.actor, who: e.actor === 'owner-browser' || e.actor === 'human' ? 'user' : 'system',
        text: e.text, schemaVersion: e.schemaVersion, at: e.receivedAt, intent: e.intent || null,
        revision: ++productRevision
      });
      lastAt = e.receivedAt || lastAt;
    }
    if (e.kind === 'wiki-edit' && e.edit?.action === 'set-section' &&
        typeof e.edit?.page === 'string' && typeof e.edit?.section === 'string' &&
        wiki.pages?.[e.edit.page]?.sections &&
        Object.hasOwn(wiki.pages[e.edit.page].sections, e.edit.section) &&
        typeof e.edit?.content === 'string') {
      // Only journal entries written by the server are accepted as product edits.
      // No executable Markdown, code or arbitrary source file writes.
      wiki.pages[e.edit.page].sections[e.edit.section] = e.edit.content;
      wiki.revision = Number(seedWiki.revision || 0) + ++appliedEdits;
      productRevision++;
      lastAt = e.receivedAt || lastAt;
    }
  }
  wiki.at = lastAt;
  return {
    state: { schemaVersion: 1, chat, wikiRevision: wiki.revision, revision: productRevision, at: lastAt },
    wiki,
    journalRevision: records.length
  };
}

export function validateProductEdit(payload, wiki) {
  const e = payload?.edit;
  if (!e || e.action !== 'set-section' || typeof e.page !== 'string' ||
      typeof e.section !== 'string' || typeof e.content !== 'string' ||
      !SAFE_NAME.test(e.page) || !SAFE_NAME.test(e.section) ||
      Buffer.byteLength(e.content, 'utf8') > MAX_WIKI_TEXT) {
    throw invalid('Invalid bounded Wiki set-section edit');
  }
  if (!wiki.pages?.[e.page]?.sections ||
      !Object.hasOwn(wiki.pages[e.page].sections, e.section)) {
    throw invalid('Wiki target does not exist', 404);
  }
  if (!Number.isSafeInteger(payload.expectedRevision)) {
    throw invalid('Wiki edit requires an expectedRevision', 428);
  }
  if (payload.expectedRevision !== wiki.revision) {
    throw invalid('Stale Wiki revision', 409);
  }
}

export function createProductJournal({ dataRoot, seedState, seedWiki }) {
  const journalPath = path.join(dataRoot, 'product-state', 'journal.jsonl');
  let tail = Promise.resolve(); // per-Host serial append and revision checking
  async function readRecords() {
    try {
      if ((await stat(journalPath)).size > MAX_JOURNAL_BYTES) {
        throw invalid('Product journal exceeds read limit', 503);
      }
      const text = await readFile(journalPath, 'utf8');
      return text.split('\n').filter(Boolean).flatMap(line => {
        try {
          const entry = JSON.parse(line);
          return entry && typeof entry === 'object' ? [entry] : [];
        } catch { return []; } // preserve torn bytes; never rewrite journal
      });
    } catch (error) {
      if (error?.code === 'ENOENT') return [];
      throw error;
    }
  }
  async function readProjection() {
    return replayProductJournal(seedState, seedWiki, await readRecords());
  }
  function append(payload) {
    const run = async () => {
      const records = await readRecords();
      const current = replayProductJournal(seedState, seedWiki, records);
      if (payload.kind === 'chat-send' &&
          (typeof payload.text !== 'string' || !payload.text.trim() ||
           payload.text.length > MAX_CHAT_TEXT)) {
        throw invalid('chat-send text must be 1..1000 chars');
      }
      if (payload.kind === 'wiki-edit') validateProductEdit(payload, current.wiki);
      const entry = { ...payload, receivedAt: new Date().toISOString() };
      const bytes = Buffer.byteLength(JSON.stringify(entry) + '\n');
      if (bytes > 4096) throw invalid('Entry exceeds 4KB', 413);
      const length = records.reduce((n, e) => n + Buffer.byteLength(JSON.stringify(e) + '\n'), 0);
      if (length + bytes > MAX_JOURNAL_BYTES) throw invalid('Journal capacity reached', 507);
      await mkdir(path.dirname(journalPath), { recursive: true });
      await appendFile(journalPath, JSON.stringify(entry) + '\n', 'utf8');
      const next = replayProductJournal(seedState, seedWiki, [...records, entry]);
      return { ...entry, revision: next.state.revision, wikiRevision: next.wiki.revision };
    };
    const result = tail.then(run, run);
    tail = result.then(() => undefined, () => undefined);
    return result;
  }
  async function rawJournal() {
    try { return await readFile(journalPath, 'utf8'); }
    catch (error) { if (error?.code === 'ENOENT') return ''; throw error; }
  }
  return { journalPath, readRecords, readProjection, append, rawJournal };
}
