# File: apps/vivim-host/chat/product-baseline.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/chat/product-baseline.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4567 B |
| Lines | 80 |
| Hash | f00a7e55c614 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LEGACY_STATE | const | 7 | no | const LEGACY_STATE = { |
| LEGACY_WIKI | const | 12 | no | const LEGACY_WIKI = { |
| versions | const | 31 | no | const versions = new Set([&#39;legacy-v1&#39;, &#39;owner-v1&#39;]); |
| unavailable | function | 32 | no | const unavailable = () =&gt; Object.assign(new Error(&#39;Product baseline unavailable; preserve the journal and repair the baseline explicitly&#39;), { status: 503, code: &#39;PRODUCT_BASELINE_INVALID&#39; }); |
| copy | function | 33 | no | const copy = value =&gt; JSON.parse(JSON.stringify(value)); |
| statOrMissing | function | 35 | no | function statOrMissing(file) { |
| readMarker | function | 39 | no | function readMarker(file) { |
| stat | const | 40 | no | const stat = statOrMissing(file); |
| marker | variable | 43 | no | let marker; |
| loadProductBaseline | function | 49 | yes | export function loadProductBaseline(dataRoot) { |
| directory | const | 50 | no | const directory = path.resolve(dataRoot, &#39;product-state&#39;); |
| directoryStat | const | 52 | no | const directoryStat = lstatSync(directory); |
| file | const | 54 | no | const file = path.join(directory, &#39;baseline-version.json&#39;); |
| marker | variable | 55 | no | let marker = readMarker(file); |
| existing | const | 59 | no | const existing = statOrMissing(path.join(directory, &#39;journal.jsonl&#39;)); |
| proposed | const | 60 | no | const proposed = { version: existing ? &#39;legacy-v1&#39; : &#39;owner-v1&#39;, initializedAt: new Date().toISOString() }; |
| temporary | const | 61 | no | const temporary = file + &#39;.&#39; + randomUUID() + &#39;.tmp&#39;; |
| fd | const | 62 | no | const fd = openSync(temporary, &#39;wx&#39;, 0o600); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:crypto | import | 4 | external |
| node:path | import | 5 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/chat/product-journal.mjs](./product-journal.mjs.md) | ./product-baseline.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Immutable local baseline-format selection; not an additional Wiki store.
// Legacy journals require the exact original section identities and text for replay.
import { mkdirSync, lstatSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync, linkSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const LEGACY_STATE = {
  "chat": [],
  "wikiRevision": 0,
  "at": "2026-11-14T00:00:00.000Z"
};
const LEGACY_WIKI = {
  "revision": 1,
  "at": "2026-11-14T00:00:00.000Z",
  "pages": {
    "Main": {
      "sections": {
        "About": "VIVIM realtime wiki — the reprogrammable product surface. Every section is editable; every edit appends one journal line via POST /api/mutate.",
        "HowTo": "Click a section to edit it. Chat (at /chat) sends natural language; this wiki mirrors the resulting state. Both pages poll the same /api/* routes — machine-readable is primary.",
        "Sources": "Wiki + chat state: apps/vivim-host/data/demo-baseline/. File surface: data/demo-baseline/file-surface.v1.json. Roadmap: read-through of docs/product/roadmap/roadmap.v1.json — single source of truth, never a copy."
      }
    },
    "Roadmap": {
      "sections": {
        "BuildQueue": "R002 acceleration active queue is read through from docs/product/roadmap/roadmap.v1.json via GET /api/roadmap. The initial ready frontier is A00, A01 and A02; queued does not imply executed, verified or owner-accepted. This seed section is descriptive only, not a second queue.",
        "Acceleration": "Screen 2 projects roadmap, journal and verified source state; edits are receipts through the canonical Host. See docs/product/roadmap/ACCELERATION-R002.md for A00–A08 definitions and dependency rules. This is seeded demo content; live execution is not yet accepted."
      }
    }
  }
};
const versions = new Set(['legacy-v1', 'owner-v1']);
const unavailable = () => Object.assign(new Error('Product baseline unavailable; preserve the journal and repair the baseline explicitly'), { status: 503, code: 'PRODUCT_BASELINE_INVALID' });
const copy = value => JSON.parse(JSON.stringify(value));

function statOrMissing(file) {
  try { return lstatSync(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function readMarker(file) {
  const stat = statOrMissing(file);
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 256) throw unavailable();
  let marker;
  try { marker = JSON.parse(readFileSync(file, 'utf8')); } catch { throw unavailable(); }
  if (!marker || Object.keys(marker).length !== 2 || !versions.has(marker.version) ||
      typeof marker.initializedAt !== 'string' || !Number.isFinite(Date.parse(marker.initializedAt))) throw unavailable();
  return marker;
}
export function loadProductBaseline(dataRoot) {
  const directory = path.resolve(dataRoot, 'product-state');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const directoryStat = lstatSync(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) throw unavailable();
  const file = path.join(directory, 'baseline-version.json');
  let marker = readMarker(file);
  if (!marker) {
    // Existence (including a torn/corrupt journal) selects historical replay.
    // Never try a different base merely because replay failed.
    const existing = statOrMissing(path.join(directory, 'journal.jsonl'));
    const proposed = { version: existing ? 'legacy-v1' : 'owner-v1', initializedAt: new Date().toISOString() };
    const temporary = file + '.' + randomUUID() + '.tmp';
    const fd = openSync(temporary, 'wx', 0o600);
    try {
      try { writeFileSync(fd, JSON.stringify(proposed) + '\n'); fsyncSync(fd); }
      finally { closeSync(fd); }
      try { linkSync(temporary, file); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
    } finally { unlinkSync(temporary); }
    marker = readMarker(file);
    if (!marker) throw unavailable();
  }
  if (marker.version === 'legacy-v1') return { seedState: copy(LEGACY_STATE), seedWiki: copy(LEGACY_WIKI) };
  // Neutral editable sections preserve the set-section command contract.
  // No invented project, task, conversation, roadmap or development facts.
  return {
    seedState: { chat: [], wikiRevision: 1, at: marker.initializedAt },
    seedWiki: { revision: 1, at: marker.initializedAt,
      pages: { Main: { sections: { About: '', HowTo: '', Sources: '' } } } }
  };
}
```

_First 80 of 81 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
