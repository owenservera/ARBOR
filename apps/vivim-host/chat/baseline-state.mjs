// VIVIM Host chat baseline state — AI-use-native: the SAME state surface serves
// the human UI and AI actors through one typed envelope { text, actor, schemaVersion }.
// Machine-readable is primary: readState (chat + live wiki revision) is the product
// read surface; applyWrite appends a typed chat message; applyWikiEdit revisions the wiki.
// Paths default to module-relative state.json + wiki.json (backend-zero, like the demo
// state draft); pass statePath/wikiPath to scope a server or test to a temp dir.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url).replace(/^\/([A-Za-z]:)/, '$1'));
const DEFAULT_STATE_PATH = path.join(HERE, 'state.json');
const DEFAULT_WIKI_PATH = path.join(HERE, 'wiki.json');

export const SCHEMA_VERSION = 1;
const ACTORS = new Set(['human', 'ai']);
const WRITE_LIMIT = 4000;

function loadJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try { return JSON.parse(readFileSync(filePath, 'utf8')); } catch { return fallback; }
}

// ---- draft-compat surface (state.mjs.draft:4-46, module-relative defaults) ----

export function loadState(statePath = DEFAULT_STATE_PATH) {
  const s = loadJson(statePath, { chat: [], wikiRevision: 0, at: new Date().toISOString() });
  return { chat: Array.isArray(s.chat) ? s.chat : [], wikiRevision: Number(s.wikiRevision) || 0, at: s.at || new Date().toISOString() };
}

export function saveState(state, statePath = DEFAULT_STATE_PATH) {
  state.at = new Date().toISOString();
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  return state;
}

export function loadWiki(wikiPath = DEFAULT_WIKI_PATH) {
  return loadJson(wikiPath, { revision: 0, pages: {} });
}

export function saveWiki(wiki, wikiPath = DEFAULT_WIKI_PATH) {
  wiki.revision = (wiki.revision || 0) + 1;
  wiki.at = new Date().toISOString();
  writeFileSync(wikiPath, JSON.stringify(wiki, null, 2), 'utf8');
  return wiki;
}

export function applyWikiEdit(edit, wikiPath = DEFAULT_WIKI_PATH) {
  // edit: { page, section?, action: 'set-page'|'set-section'|'delete-section', content? }
  const wiki = loadWiki(wikiPath);
  const page = String(edit.page || 'Main');
  const pages = wiki.pages ?? (wiki.pages = {});
  const current = pages[page] ?? { sections: {} };
  if (edit.action === 'set-page') {
    pages[page] = { sections: typeof edit.content === 'object' && edit.content ? edit.content : { Main: String(edit.content ?? '') } };
  } else if (edit.action === 'set-section') {
    current.sections[String(edit.section || 'Main')] = String(edit.content ?? '');
    pages[page] = current;
  } else if (edit.action === 'delete-section') {
    delete current.sections[String(edit.section || '')];
    pages[page] = current;
  } else return null;
  return saveWiki(wiki, wikiPath);
}

// ---- typed write handling for the single product write endpoint ----

function fail(code, status) { const e = new Error(code); e.code = code; e.status = status; return e; }

export function validWriteEnvelope(envelope) {
  return envelope && typeof envelope === 'object' && !Array.isArray(envelope)
    && typeof envelope.text === 'string' && envelope.text.trim() && envelope.text.length <= WRITE_LIMIT
    && ACTORS.has(envelope.actor)
    && Number.isInteger(envelope.schemaVersion) && envelope.schemaVersion === SCHEMA_VERSION;
}

export function applyWrite(envelope, statePath = DEFAULT_STATE_PATH, wikiPath = DEFAULT_WIKI_PATH) {
  if (!validWriteEnvelope(envelope)) throw fail('CHAT_WRITE_INVALID', 400);
  const state = loadState(statePath);
  const message = {
    id: 'msg-' + String(Date.now()) + '-' + Math.random().toString(16).slice(2, 8),
    actor: envelope.actor,
    text: envelope.text.trim(),
    at: new Date().toISOString(),
    schemaVersion: envelope.schemaVersion
  };
  state.chat.push(message);
  saveState(state, statePath);
  return readState(statePath, wikiPath);
}

// ---- machine-readable read endpoints ----

export function readState(statePath = DEFAULT_STATE_PATH, wikiPath = DEFAULT_WIKI_PATH) {
  const state = loadState(statePath);
  const wiki = loadWiki(wikiPath);
  return { schemaVersion: SCHEMA_VERSION, chat: state.chat, wikiRevision: wiki.revision || 0, at: state.at || new Date().toISOString() };
}

export function readWiki(wikiPath = DEFAULT_WIKI_PATH) {
  return loadWiki(wikiPath);
}

// ---- factory for servers/tests that own their own state files ----

export function createBaselineState({ statePath = DEFAULT_STATE_PATH, wikiPath = DEFAULT_WIKI_PATH } = {}) {
  return {
    readState: () => readState(statePath, wikiPath),
    readWiki: () => readWiki(wikiPath),
    applyWrite: (envelope) => applyWrite(envelope, statePath, wikiPath),
    applyWikiEdit: (edit) => applyWikiEdit(edit, wikiPath)
  };
}
