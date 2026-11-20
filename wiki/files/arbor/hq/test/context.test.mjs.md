# File: hq/test/context.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/context.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9956 B |
| Lines | 253 |
| Hash | 1efd11261fb0 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 12 | no | const NOW = &#39;2026-11-02T12:00:00.000Z&#39;; |
| TASK | const | 13 | no | const TASK = &#39;compose context bundle knapsack&#39;; |
| A_SOURCE | const | 15 | no | const A_SOURCE = [ |
| B_SOURCE | const | 34 | no | const B_SOURCE = [ |
| README_SOURCE | const | 41 | no | const README_SOURCE = [ |
| DOCS_SOURCE | const | 49 | no | const DOCS_SOURCE = [ |
| SECRET_SOURCE | const | 56 | no | const SECRET_SOURCE = &#39;API_KEY=super-secret-compose-context-bundle-knapsack\\n&#39;; |
| countLines | function | 58 | no | function countLines(text) { |
| parts | const | 60 | no | const parts = text.split(&#39;\\n&#39;); |
| fixture | function | 64 | no | function fixture() { |
| root | const | 65 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-context-&#39;)); |
| projectRoot | const | 66 | no | const projectRoot = join(root, &#39;alpha&#39;); |
| files | const | 67 | no | const files = new Map(); |
| write | function | 69 | no | const write = (rel, text) =&gt; { |
| abs | const | 70 | no | const abs = join(projectRoot, rel); |
| db | const | 82 | no | const db = openMemoryDb(); |
| inserted | const | 83 | no | const inserted = db.prepare(&#39;INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)&#39;) |
| projectId | const | 85 | no | const projectId = Number(inserted.lastInsertRowid); |
| insertFile | const | 87 | no | const insertFile = db.prepare(` INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, is_test, is_generated, indexed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`); |
| insertFts | const | 90 | no | const insertFts = db.prepare(&#39;INSERT INTO content_fts(rowid, path, content, project, lang) VALUES (?, ?, ?, ?, ?)&#39;); |
| ids | const | 92 | no | const ids = {}; |
| stat | const | 95 | no | const stat = statSync(entry.abs); |
| info | const | 96 | no | const info = insertFile.run( projectId, rel, entry.abs, lang, kind, stat.size, stat.mtimeMs, sha256(entry.text), countLines(entry.text), NOW, ); |
| insertSymbol | const | 104 | no | const insertSymbol = db.prepare(` INSERT INTO symbols(file_id, project_id, name, kind, line, end_line, signature, exported, doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`); |
| teardown | function | 126 | no | function teardown(t, db, root) { |
| bundle | const | 137 | no | const bundle = composeContext(db, { task: TASK, project: &#39;alpha&#39;, now: NOW }); |
| refs | const | 152 | no | const refs = bundle.sources.map((source) =&gt; source.ref); |
| verification | const | 168 | no | const verification = verifyContext(bundle); |
| first | const | 179 | no | const first = composeContext(db, { task: TASK, project: &#39;alpha&#39;, now: NOW }); |
| second | const | 180 | no | const second = composeContext(db, { task: TASK, project: &#39;alpha&#39;, now: NOW }); |
| other | const | 185 | no | const other = composeContext(db, { task: &#39;unrelated zebra migration&#39;, project: &#39;alpha&#39;, now: NOW }); |
| bundle | const | 193 | no | const bundle = composeContext(db, { task: TASK, project: &#39;alpha&#39;, now: NOW }); |
| refs | const | 194 | no | const refs = bundle.sources.map((source) =&gt; source.ref); |
| written | const | 199 | no | const written = JSON.parse(JSON.stringify(bundle)); |
| result | const | 202 | no | const result = verifyContext(written); |
| bundle | const | 212 | no | const bundle = composeContext(db, { task: TASK, project: &#39;alpha&#39;, now: NOW, budgetTokens: 20_000 }); |
| known | const | 213 | no | const known = [ |
| tiny | const | 227 | no | const tiny = composeContext(db, { task: TASK, project: &#39;alpha&#39;, now: NOW, budgetTokens: 1000, maxFiles: 2, }); |
| single | const | 234 | no | const single = composeContext(db, { task: TASK, project: &#39;alpha&#39;, now: NOW, budgetTokens: 20_000, maxFiles: 1, }); |
| missing | const | 244 | no | const missing = composeContext(db, { task: TASK, project: &#39;nope&#39;, now: NOW }); |
| empty | const | 249 | no | const empty = composeContext(db, { task: &#39; &#39;, project: &#39;alpha&#39;, now: NOW }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../lib/context.mjs | import | 7 | [hq/lib/context.mjs](../lib/context.mjs.md) |
| ../lib/lang.mjs | import | 8 | [hq/lib/lang.mjs](../lib/lang.mjs.md) |
| ../lib/schema.mjs | import | 9 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/util.mjs | import | 10 | [hq/lib/util.mjs](../lib/util.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/context.test.mjs — task bundles against a real temp project.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { composeContext, verifyContext } from '../lib/context.mjs';
import { detectLang } from '../lib/lang.mjs';
import { openMemoryDb } from '../lib/schema.mjs';
import { sha256 } from '../lib/util.mjs';

const NOW = '2026-11-02T12:00:00.000Z';
const TASK = 'compose context bundle knapsack';

const A_SOURCE = [
  '// @hq:context Demo entry point for the compose context bundle knapsack task.',
  "import { helper } from './b.mjs';",
  '',
  'export function composeContext(task, budget) {',
  '  const context = helper(task);',
  '  return { context, budget, tokens: context.length };',
  '}',
  '',
  'export const BUNDLE_BUDGET = 6000;',
  '',
  'class BundlePlanner {',
  '  plan(task) {',
  '    return composeContext(task, BUNDLE_BUDGET);',
  '  }',
  '}',
  '',
].join('\n');

const B_SOURCE = [
  'export function helper(task) {',
  "  return String(task ?? '').toUpperCase();",
  '}',
  '',
].join('\n');

const README_SOURCE = [
  '# Alpha project',
  '',
  'The compose context bundle knapsack demo keeps every evidence record small.',
  'Read this first, then the docs folder.',
  '',
].join('\n');

const DOCS_SOURCE = [
  '# Alpha docs',
  '',
  'The knapsack budget keeps context bundles honest.',
  '',
].join('\n');

const SECRET_SOURCE = 'API_KEY=super-secret-compose-context-bundle-knapsack\n';

function countLines(text) {
  if (!text) return 0;
  const parts = text.split('\n');
  return text.endsWith('\n') ? parts.length - 1 : parts.length;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'hq-context-'));
  const projectRoot = join(root, 'alpha');
  const files = new Map();

  const write = (rel, text) => {
    const abs = join(projectRoot, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text, 'utf8');
    files.set(rel, { abs, text });
  };

  write('src/a.mjs', A_SOURCE);
  write('src/b.mjs', B_SOURCE);
  write('README.md', README_SOURCE);
  write('docs/README.md', DOCS_SOURCE);
  write('src/secret.env', SECRET_SOURCE);
```

_First 80 of 254 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
