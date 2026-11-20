# File: apps/vivim-host/chat/baseline-state.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/chat/baseline-state.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4880 B |
| Lines | 113 |
| Hash | f9cda2f9d65e |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 11 | no | const HERE = path.dirname(fileURLToPath(import.meta.url).replace(/^\\/([A-Za-z]:)/, &#39;$1&#39;)); |
| DEFAULT_STATE_PATH | const | 12 | no | const DEFAULT_STATE_PATH = path.join(HERE, &#39;state.json&#39;); |
| DEFAULT_WIKI_PATH | const | 13 | no | const DEFAULT_WIKI_PATH = path.join(HERE, &#39;wiki.json&#39;); |
| SCHEMA_VERSION | const | 15 | yes | export const SCHEMA_VERSION = 1; |
| ACTORS | const | 16 | no | const ACTORS = new Set([&#39;human&#39;, &#39;ai&#39;]); |
| WRITE_LIMIT | const | 17 | no | const WRITE_LIMIT = 4000; |
| loadJson | function | 19 | no | function loadJson(filePath, fallback) { |
| loadState | function | 26 | yes | export function loadState(statePath = DEFAULT_STATE_PATH) { |
| s | const | 27 | no | const s = loadJson(statePath, { chat: [], wikiRevision: 0, at: new Date().toISOString() }); |
| saveState | function | 31 | yes | export function saveState(state, statePath = DEFAULT_STATE_PATH) { |
| loadWiki | function | 37 | yes | export function loadWiki(wikiPath = DEFAULT_WIKI_PATH) { |
| saveWiki | function | 41 | yes | export function saveWiki(wiki, wikiPath = DEFAULT_WIKI_PATH) { |
| applyWikiEdit | function | 48 | yes | export function applyWikiEdit(edit, wikiPath = DEFAULT_WIKI_PATH) { |
| wiki | const | 50 | no | const wiki = loadWiki(wikiPath); |
| page | const | 51 | no | const page = String(edit.page \|\| &#39;Main&#39;); |
| pages | const | 52 | no | const pages = wiki.pages ?? (wiki.pages = {}); |
| current | const | 53 | no | const current = pages[page] ?? { sections: {} }; |
| fail | function | 68 | no | function fail(code, status) { const e = new Error(code); e.code = code; e.status = status; return e; } |
| validWriteEnvelope | function | 70 | yes | export function validWriteEnvelope(envelope) { |
| applyWrite | function | 77 | yes | export function applyWrite(envelope, statePath = DEFAULT_STATE_PATH, wikiPath = DEFAULT_WIKI_PATH) { |
| state | const | 79 | no | const state = loadState(statePath); |
| message | const | 80 | no | const message = { |
| readState | function | 94 | yes | export function readState(statePath = DEFAULT_STATE_PATH, wikiPath = DEFAULT_WIKI_PATH) { |
| state | const | 95 | no | const state = loadState(statePath); |
| wiki | const | 96 | no | const wiki = loadWiki(wikiPath); |
| readWiki | function | 100 | yes | export function readWiki(wikiPath = DEFAULT_WIKI_PATH) { |
| createBaselineState | function | 106 | yes | export function createBaselineState({ statePath = DEFAULT_STATE_PATH, wikiPath = DEFAULT_WIKI_PATH } = {}) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| node:url | import | 9 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 114 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
