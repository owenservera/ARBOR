# File: docs/product/proposals/chat-wiki-baseline/state.mjs.draft

> Generated 2026-11-19 · Other · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/product/proposals/chat-wiki-baseline/state.mjs.draft |
| Language | Other |
| Kind | other |
| Size | 2214 B |
| Lines | 46 |
| Hash | 9ebb4a502987 |
| Test | no |
| Generated | no |
| Component | docs |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```
// VIVIM demo state module — AI-use-native: the SAME state surface serves the human UI,
// the AI agent mirror, and the roadmap workstream. Machine-readable is primary.
// Paths are demo-local (backend-zero): public/demo/state.json + public/demo/wiki.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const DEMO_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const STATE_PATH = path.join(DEMO_DIR, 'state.json');
const WIKI_PATH = path.join(DEMO_DIR, 'wiki.json');

export function loadState() {
  if (!existsSync(STATE_PATH)) return { chat: [], wikiRevision: 0, at: new Date().toISOString() };
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf8')); } catch { return { chat: [], wikiRevision: 0, at: new Date().toISOString() }; }
}
export function saveState(state) {
  state.at = new Date().toISOString();
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}
export function loadWiki() {
  if (!existsSync(WIKI_PATH)) return { revision: 0, pages: {} };
  try { return JSON.parse(readFileSync(WIKI_PATH, 'utf8')); } catch { return { revision: 0, pages: {} }; }
}
export function saveWiki(wiki) {
  wiki.revision = (wiki.revision || 0) + 1;
  wiki.at = new Date().toISOString();
  writeFileSync(WIKI_PATH, JSON.stringify(wiki, null, 2), 'utf8');
  return wiki;
}
export function applyWikiEdit(edit) {
  // edit: { page, section?, action: 'set-page'|'set-section'|'delete-section', content? }
  const wiki = loadWiki();
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
  const saved = saveWiki(wiki);
  return saved;
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
