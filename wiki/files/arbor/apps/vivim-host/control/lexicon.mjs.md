# File: apps/vivim-host/control/lexicon.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/lexicon.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4808 B |
| Lines | 86 |
| Hash | 36f47d1e3dce |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LEXICON_SCHEMA | const | 9 | yes | export const LEXICON_SCHEMA = &#39;vivim.control-lexicon/1&#39;; |
| WORD | const | 10 | no | const WORD = /^[a-z][a-z0-9-]{1,39}$/; |
| MAX_ENTRIES | const | 11 | no | const MAX_ENTRIES = 200, MAX_HISTORY = 1000; |
| fail | function | 12 | no | const fail = code =&gt; Object.assign(new Error(code), { code }); |
| createLexiconStore | function | 14 | yes | export function createLexiconStore({ dataRoot, catalog, now = () =&gt; new Date().toISOString() }) { |
| file | const | 15 | no | const file = path.join(dataRoot, &#39;control&#39;, &#39;lexicon.json&#39;); |
| spoken | const | 16 | no | const spoken = new Set(catalog.actions.filter(a =&gt; a.language).map(a =&gt; a.id)); |
| reserved | const | 18 | no | const reserved = new Set(catalog.actions.flatMap(a =&gt; [...(a.language?.verbs ?? []), ...(a.language?.scope ?? []), ...(a.language?.objects ?? [])])); |
| load | function | 20 | no | function load() { |
| raw | const | 22 | no | const raw = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| save | function | 27 | no | function save(next, expectedVersion) { |
| lockFile | const | 30 | no | const lockFile = `${file}.lock`; |
| lockTemp | const | 32 | no | const lockTemp = `${lockFile}.${process.pid}.${randomBytes(6).toString(&#39;hex&#39;)}.tmp`; |
| lockHeld | variable | 34 | no | let lockHeld = false; |
| current | const | 45 | no | const current = load(); |
| temp | const | 47 | no | const temp = `${file}.${process.pid}.${randomBytes(6).toString(&#39;hex&#39;)}.tmp`; |
| word | function | 55 | no | const word = w =&gt; { const v = String(w ?? &#39;&#39;).trim().toLowerCase(); if (!WORD.test(v)) throw fail(&#39;CONTROL_WORD_INVALID&#39;); return v; }; |
| v | const | 61 | no | const v = word(w); |
| cur | const | 64 | no | const cur = load(); |
| previous | const | 66 | no | const previous = cur.entries.find(e =&gt; e.word === v) ?? null; |
| at | const | 67 | no | const at = now(); |
| next | const | 68 | no | const next = { ...cur, version: cur.version + 1, |
| v | const | 75 | no | const v = word(w); |
| cur | const | 76 | no | const cur = load(); |
| existing | const | 77 | no | const existing = cur.entries.find(e =&gt; e.word === v); |
| at | const | 79 | no | const at = now(); |
| next | const | 80 | no | const next = { ...cur, version: cur.version + 1, entries: cur.entries.filter(e =&gt; e.word !== v), |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:crypto | import | 6 | external |
| node:path | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./lexicon.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Taught words (Omega director.teach semantics, as DATA — never generated code).
// "teach blitz means undo" → { word: "blitz", actionId: "ui.theme.undo" }. The word only
// changes how text is READ; the action it reaches keeps its own risk, approval and executor.
// Versioned with compare-and-save; every change is kept in history (forget never erases it).
import { mkdirSync, readFileSync, renameSync, writeFileSync, linkSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

export const LEXICON_SCHEMA = 'vivim.control-lexicon/1';
const WORD = /^[a-z][a-z0-9-]{1,39}$/;
const MAX_ENTRIES = 200, MAX_HISTORY = 1000;
const fail = code => Object.assign(new Error(code), { code });

export function createLexiconStore({ dataRoot, catalog, now = () => new Date().toISOString() }) {
  const file = path.join(dataRoot, 'control', 'lexicon.json');
  const spoken = new Set(catalog.actions.filter(a => a.language).map(a => a.id));
  // Builtin verbs/scope words are reserved: teaching cannot silently re-route "stop".
  const reserved = new Set(catalog.actions.flatMap(a => [...(a.language?.verbs ?? []), ...(a.language?.scope ?? []), ...(a.language?.objects ?? [])]));
  for (const w of ['teach', 'forget', 'unteach', 'help', 'means', 'and', 'then']) reserved.add(w);
  function load() {
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8'));
      if (raw?.schema !== LEXICON_SCHEMA || !Number.isInteger(raw.version) || !Array.isArray(raw.entries) || !Array.isArray(raw.history)) throw fail('CONTROL_LEXICON_CORRUPT');
      return raw;
    } catch (e) { if (e.code === 'ENOENT') return { schema: LEXICON_SCHEMA, version: 0, entries: [], history: [] }; throw e; }
  }
  function save(next, expectedVersion) {
    // Exclusive lock across processes: load->validate->write must be atomic.
    // A lock file is created with linkSync (exclusive); only the holder proceeds.
    const lockFile = `${file}.lock`;
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const lockTemp = `${lockFile}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    writeFileSync(lockTemp, '', { mode: 0o600 });
    let lockHeld = false;
    try {
      linkSync(lockTemp, lockFile);
      lockHeld = true;
    } catch (e) {
      if (e.code === 'EEXIST') throw fail('CONTROL_LEXICON_BUSY');
      throw e;
    } finally {
      try { unlinkSync(lockTemp); } catch { /* already gone */ }
    }
    try {
      const current = load();
      if (current.version !== expectedVersion) throw fail('CONTROL_LEXICON_STALE');
      const temp = `${file}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
      writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
      renameSync(temp, file);
      return next;
    } finally {
      if (lockHeld) { try { unlinkSync(lockFile); } catch { /* already gone */ } }
    }
  }
  const word = w => { const v = String(w ?? '').trim().toLowerCase(); if (!WORD.test(v)) throw fail('CONTROL_WORD_INVALID'); return v; };
  return {
    schema: LEXICON_SCHEMA, file,
    entries: () => load().entries.map(e => ({ word: e.word, actionId: e.actionId })),
    version: () => load().version,
    teach({ word: w, actionId, planId = null }) {
      const v = word(w);
      if (reserved.has(v)) throw fail('CONTROL_WORD_RESERVED');
      if (!spoken.has(actionId)) throw fail('CONTROL_TEACH_TARGET_INVALID');
      const cur = load();
      if (cur.entries.length >= MAX_ENTRIES && !cur.entries.some(e => e.word === v)) throw fail('CONTROL_LEXICON_FULL');
      const previous = cur.entries.find(e => e.word === v) ?? null;
      const at = now();
      const next = { ...cur, version: cur.version + 1,
        entries: [...cur.entries.filter(e => e.word !== v), { word: v, actionId, at, planId }].sort((a, b) => a.word.localeCompare(b.word)),
        history: [...cur.history, { op: 'teach', word: v, actionId, previous: previous?.actionId ?? null, at, planId }].slice(-MAX_HISTORY) };
      save(next, cur.version);
      return { word: v, actionId, previous: previous?.actionId ?? null, version: next.version };
    },
    forget({ word: w, planId = null }) {
      const v = word(w);
      const cur = load();
      const existing = cur.entries.find(e => e.word === v);
      if (!existing) throw fail('CONTROL_WORD_UNKNOWN');
      const at = now();
      const next = { ...cur, version: cur.version + 1, entries: cur.entries.filter(e => e.word !== v),
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
