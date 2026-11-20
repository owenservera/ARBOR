# File: hq/test/kg-export.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/kg-export.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11038 B |
| Lines | 198 |
| Hash | 1348a04e4d17 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO | const | 16 | no | const REPO = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| CLI | const | 17 | no | const CLI = join(REPO, &#39;hq&#39;, &#39;bin&#39;, &#39;hq.mjs&#39;); |
| makeWorkspace | function | 19 | no | function makeWorkspace() { |
| ws | const | 20 | no | const ws = mkdtempSync(join(tmpdir(), &#39;hq-kg-export-&#39;)); |
| indexWorkspace | function | 33 | no | function indexWorkspace(ws) { |
| exportOf | function | 38 | no | function exportOf(ws, db, outPath, statePath) { |
| parseExchange | function | 42 | no | function parseExchange(path) { |
| text | const | 43 | no | const text = readFileSync(path, &#39;utf8&#39;); |
| ws | const | 49 | no | const ws = makeWorkspace(); |
| db | const | 51 | no | const db = indexWorkspace(ws); |
| outPath | const | 52 | no | const outPath = join(ws, &#39;.hq&#39;, &#39;kg-exchange.jsonl&#39;); |
| statePath | const | 53 | no | const statePath = join(ws, &#39;.hq&#39;, &#39;kg-export-state.json&#39;); |
| first | const | 54 | no | const first = exportOf(ws, db, outPath, statePath); |
| index | const | 61 | no | const index = buildGraphIndex(outPath); |
| raw | const | 65 | no | const raw = parseExchange(outPath); |
| oneNode | const | 66 | no | const oneNode = raw.rows.find((r) =&gt; r.type === &#39;node&#39; &amp;&amp; r.metadata.source_path === &#39;demo/src/one.mjs&#39;); |
| edge | const | 70 | no | const edge = raw.rows.find((r) =&gt; r.type === &#39;edge&#39;); |
| db2 | const | 75 | no | const db2 = new DatabaseSync(join(ws, &#39;.hq&#39;, &#39;index.db&#39;), { readOnly: true }); |
| out2 | const | 76 | no | const out2 = join(ws, &#39;.hq&#39;, &#39;kg-exchange-2.jsonl&#39;); |
| ws | const | 86 | no | const ws = makeWorkspace(); |
| db | const | 88 | no | const db = indexWorkspace(ws); |
| outPath | const | 89 | no | const outPath = join(ws, &#39;.hq&#39;, &#39;kg-exchange.jsonl&#39;); |
| statePath | const | 90 | no | const statePath = join(ws, &#39;.hq&#39;, &#39;kg-export-state.json&#39;); |
| first | const | 91 | no | const first = exportOf(ws, db, outPath, statePath); |
| firstRaw | const | 92 | no | const firstRaw = parseExchange(outPath); |
| oneBefore | const | 93 | no | const oneBefore = firstRaw.rows.find((r) =&gt; r.type === &#39;node&#39; &amp;&amp; r.metadata.source_path === &#39;demo/src/one.mjs&#39;); |
| twoBefore | const | 94 | no | const twoBefore = firstRaw.rows.find((r) =&gt; r.type === &#39;node&#39; &amp;&amp; r.metadata.source_path === &#39;demo/src/two.mjs&#39;); |
| db2 | variable | 99 | no | let db2 = indexWorkspace(ws); |
| second | const | 100 | no | const second = exportOf(ws, db2, outPath, statePath); |
| secondRaw | const | 106 | no | const secondRaw = parseExchange(outPath); |
| oneAfter | const | 107 | no | const oneAfter = secondRaw.rows.find((r) =&gt; r.type === &#39;node&#39; &amp;&amp; r.metadata.source_path === &#39;demo/src/one.mjs&#39;); |
| third | const | 114 | no | const third = exportOf(ws, db2, outPath, statePath); |
| thirdRaw | const | 119 | no | const thirdRaw = parseExchange(outPath); |
| tomb | const | 120 | no | const tomb = thirdRaw.rows.find((r) =&gt; r.type === &#39;tombstone&#39;); |
| fourth | const | 129 | no | const fourth = exportOf(ws, db2, outPath, statePath); |
| fourthRaw | const | 134 | no | const fourthRaw = parseExchange(outPath); |
| renamed | const | 135 | no | const renamed = fourthRaw.rows.find((r) =&gt; r.type === &#39;node&#39; &amp;&amp; r.metadata.source_path === &#39;demo/src/three.mjs&#39;); |
| ws | const | 144 | no | const ws = makeWorkspace(); |
| db | const | 146 | no | const db = indexWorkspace(ws); |
| outPath | const | 147 | no | const outPath = join(ws, &#39;.hq&#39;, &#39;kg-exchange.jsonl&#39;); |
| statePath | const | 148 | no | const statePath = join(ws, &#39;.hq&#39;, &#39;kg-export-state.json&#39;); |
| first | const | 149 | no | const first = exportOf(ws, db, outPath, statePath); |
| db2 | variable | 157 | no | let db2 = indexWorkspace(ws); |
| unacked1 | const | 158 | no | const unacked1 = exportOf(ws, db2, outPath, statePath); |
| failedImport | const | 167 | no | const failedImport = exportOf(ws, db2, outPath, statePath); |
| settled | const | 175 | no | const settled = exportOf(ws, db2, outPath, statePath); |
| ws | const | 184 | no | const ws = makeWorkspace(); |
| out | const | 187 | no | const out = execFileSync(process.execPath, [CLI, &#39;kg&#39;, &#39;export&#39;, &#39;--json&#39;], { cwd: ws, encoding: &#39;utf8&#39;, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;ignore&#39;], }); |
| payload | const | 190 | no | const payload = JSON.parse(out); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:sqlite | import | 7 | external |
| node:fs | import | 8 | external |
| node:os | import | 9 | external |
| node:path | import | 10 | external |
| node:url | import | 11 | external |
| node:child_process | import | 12 | external |
| ../lib/kg-export.mjs | import | 13 | [hq/lib/kg-export.mjs](../lib/kg-export.mjs.md) |
| ../lib/wiki-runtime/graph-index.mjs | import | 14 | [hq/lib/wiki-runtime/graph-index.mjs](../lib/wiki-runtime/graph-index.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | invariant | — | — | The exporter is data-only: it never mutates the index, and every |

## Excerpt

```javascript
// hq/test/kg-export.test.mjs — the operational HQ -> HQKGX1 producer.
// @hq:invariant The exporter is data-only: it never mutates the index, and every
//   emitted exchange must be admitted by the same checker the wiki uses
//   (buildGraphIndex) and by the native importer's recorded behavior.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { exportGraphExchange, acknowledgeGraphExport, lastGraphExport } from '../lib/kg-export.mjs';
import { buildGraphIndex } from '../lib/wiki-runtime/graph-index.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(REPO, 'hq', 'bin', 'hq.mjs');

function makeWorkspace() {
  const ws = mkdtempSync(join(tmpdir(), 'hq-kg-export-'));
  mkdirSync(join(ws, '.hq'), { recursive: true });
  writeFileSync(join(ws, '.hq', 'config.json'), JSON.stringify({ db: '.hq/index.db', maxFileBytes: 200000, ignores: [] }));
  writeFileSync(join(ws, 'projects.json'), JSON.stringify({
    version: 1,
    projects: [{ name: 'demo', path: 'demo', tags: [], addedAt: '2026-11-10T00:00:00.000Z' }],
  }));
  mkdirSync(join(ws, 'demo', 'src'), { recursive: true });
  writeFileSync(join(ws, 'demo', 'src', 'one.mjs'), 'export function alpha() { return 1; }\n');
  writeFileSync(join(ws, 'demo', 'src', 'two.mjs'), "import { alpha } from './one.mjs';\nexport const beta = alpha;\n");
  return ws;
}

function indexWorkspace(ws) {
  execFileSync(process.execPath, [CLI, 'index', '--json'], { cwd: ws, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return new DatabaseSync(join(ws, '.hq', 'index.db'), { readOnly: true });
}

function exportOf(ws, db, outPath, statePath) {
  return exportGraphExchange({ db, outPath, statePath });
}

function parseExchange(path) {
  const text = readFileSync(path, 'utf8');
  const [head, ...lines] = text.split('\n');
  return { manifest: JSON.parse(head), rows: lines.filter((l) => l).map((l) => JSON.parse(l)), text };
}

test('first export emits a deterministic admitted universe with content claims', () => {
  const ws = makeWorkspace();
  try {
    const db = indexWorkspace(ws);
    const outPath = join(ws, '.hq', 'kg-exchange.jsonl');
    const statePath = join(ws, '.hq', 'kg-export-state.json');
    const first = exportOf(ws, db, outPath, statePath);
    db.close();

    assert.equal(first.stats.nodes, 2);
    assert.equal(first.stats.edges, 1);
    assert.equal(first.stats.tombstones, 0);
    // Wiki admission (the exact checker buildWiki consumes) must accept it.
    const index = buildGraphIndex(outPath);
    assert.equal(index.nodeCount, 2);
    assert.equal(index.edgeCount, 1);
    // The wiki join key resolves for the indexed file: path + '\0' + content hash.
    const raw = parseExchange(outPath);
    const oneNode = raw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/one.mjs');
    assert.ok(oneNode, 'node for demo/src/one.mjs present');
    assert.match(oneNode.id, /^hqg1:[a-f0-9]{64}$/);
    assert.match(oneNode.metadata.content_sha256, /^[a-f0-9]{64}$/);
    const edge = raw.rows.find((r) => r.type === 'edge');
    assert.equal(edge.relation, 'imports');
    assert.equal(edge.from, raw.rows.find((r) => r.type === 'node' && r.metadata.source_path === 'demo/src/two.mjs').id);
    assert.equal(edge.to, oneNode.id);
    // Deterministic: identical index state produces byte-identical output.
    const db2 = new DatabaseSync(join(ws, '.hq', 'index.db'), { readOnly: true });
    const out2 = join(ws, '.hq', 'kg-exchange-2.jsonl');
    exportOf(ws, db2, out2, null);
    db2.close();
    assert.equal(readFileSync(out2, 'utf8'), readFileSync(outPath, 'utf8'));
  } finally {
```

_First 80 of 199 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
