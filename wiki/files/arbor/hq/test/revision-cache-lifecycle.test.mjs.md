# File: hq/test/revision-cache-lifecycle.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/revision-cache-lifecycle.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14777 B |
| Lines | 312 |
| Hash | f974b765ad64 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO | const | 25 | no | const REPO = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| CAP | const | 26 | no | const CAP = &#39;demo.cap@1&#39;; |
| fixture | function | 28 | no | function fixture(files) { |
| root | const | 29 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-revision-cache-&#39;)); |
| project | const | 30 | no | const project = join(root, &#39;demo&#39;); |
| openIndex | function | 36 | no | function openIndex(root, project) { |
| db | const | 37 | no | const db = openMemoryDb(); |
| row | const | 44 | no | const row = db.prepare(&#39;SELECT id, path, hash FROM files WHERE path = ?&#39;).get(path); |
| exchangeRows | function | 51 | no | function exchangeRows(db, root) { |
| dir | const | 52 | no | const dir = join(root, &#39;.hq&#39;); |
| outPath | const | 54 | no | const outPath = join(dir, &#39;kg-exchange.jsonl&#39;); |
| statePath | const | 55 | no | const statePath = join(dir, &#39;kg-export-state.json&#39;); |
| exported | const | 56 | no | const exported = exportGraphExchange({ db, outPath, statePath }); |
| text | const | 57 | no | const text = readFileSync(outPath, &#39;utf8&#39;); |
| eol | const | 58 | no | const eol = text.indexOf(&#39;\\n&#39;); |
| rows | const | 59 | no | const rows = text.slice(eol + 1).trim().split(&#39;\\n&#39;).filter(Boolean).map((line) =&gt; JSON.parse(line)); |
| f | const | 68 | no | const f = fixture({ &#39;src/one.mjs&#39;: `/** @hq:capability ${CAP} */\\nexport const alpha = 1;\\n` }); |
| index | const | 69 | no | const index = openIndex(f.root, f.project); |
| first | const | 71 | no | const first = index.run(); |
| second | const | 82 | no | const second = index.run(); |
| node | const | 105 | no | const node = rows.find((row) =&gt; row.type === &#39;node&#39; &amp;&amp; row.metadata.source_path === &#39;demo/src/one.mjs&#39;); |
| f | const | 116 | no | const f = fixture({ &#39;src/one.mjs&#39;: `/** @hq:capability ${CAP} */\\nexport const alpha = 1;\\n` }); |
| index | const | 117 | no | const index = openIndex(f.root, f.project); |
| again | const | 120 | no | const again = index.run(); |
| f | const | 131 | no | const f = fixture({ &#39;src/one.mjs&#39;: `/** @hq:capability ${CAP} */\\nexport const alpha = 1;\\n` }); |
| index | const | 132 | no | const index = openIndex(f.root, f.project); |
| first | const | 136 | no | const first = exchangeRows(index.db, f.root); |
| nodeId | const | 139 | no | const nodeId = first.rows.find((row) =&gt; row.type === &#39;node&#39;).id; |
| removed | const | 142 | no | const removed = index.run(); |
| after | const | 157 | no | const after = exchangeRows(index.db, f.root); |
| tombstone | const | 160 | no | const tombstone = after.rows.find((row) =&gt; row.type === &#39;tombstone&#39;); |
| body | const | 174 | no | const body = `/** @hq:capability ${CAP} */\\nexport const big = &#39;${&#39;x&#39;.repeat(400)}&#39;;\\n`; |
| f | const | 175 | no | const f = fixture({ &#39;src/big.mjs&#39;: body }); |
| index | const | 176 | no | const index = openIndex(f.root, f.project); |
| first | const | 178 | no | const first = index.run({ maxFileBytes: 100_000 }); |
| second | const | 185 | no | const second = index.run({ maxFileBytes: 100 }); |
| third | const | 195 | no | const third = index.run({ maxFileBytes: 100_000 }); |
| f | const | 207 | no | const f = fixture({ &#39;src/big.mjs&#39;: `/** @hq:capability ${CAP} */\\nexport const big = &#39;${&#39;x&#39;.repeat(400)}&#39;;\\n`, &#39;src/doomed.mjs&#39;: `/** @hq:capability demo.doomed@1 */\\nexport const doomed = 1;\\n`, }); |
| index | const | 211 | no | const index = openIndex(f.root, f.project); |
| run | const | 218 | no | const run = index.run({ maxFileBytes: 100 }); |
| delta | const | 221 | no | const delta = run.semanticChanges.find((change) =&gt; change.path === &#39;src/doomed.mjs&#39;); |
| anchors | const | 240 | no | const anchors = [{ anchorId: &#39;a&#39;, semanticId: CAP, annotationKind: &#39;capability&#39;, fingerprint: &#39;f1&#39;, contentHash: &#39;h1&#39;, state: &#39;indexed&#39; }]; |
| nativeBin | function | 252 | no | function nativeBin(name) { |
| exts | const | 253 | no | const exts = process.platform === &#39;win32&#39; ? [&#39;.exe&#39;, &#39;&#39;] : [&#39;&#39;, &#39;.exe&#39;]; |
| dirs | const | 254 | no | const dirs = [ |
| candidate | const | 263 | no | const candidate = join(dir, name + ext); |
| importer | const | 271 | no | const importer = nativeBin(&#39;hqkg-import&#39;); |
| query | const | 272 | no | const query = nativeBin(&#39;hqkg&#39;); |
| f | const | 277 | no | const f = fixture({ &#39;src/one.mjs&#39;: `/** @hq:capability ${CAP} */\\nexport const alpha = 1;\\n` }); |
| index | const | 278 | no | const index = openIndex(f.root, f.project); |
| journal | const | 281 | no | const journal = join(f.root, &#39;graph.hqj&#39;); |
| run | function | 282 | no | const run = () =&gt; { |
| out | const | 284 | no | const out = execFileSync(importer, [journal, join(f.root, &#39;.hq&#39;, &#39;kg-exchange.jsonl&#39;)], { encoding: &#39;utf8&#39; }); |
| nodes | const | 286 | no | const nodes = execFileSync(query, [journal, &#39;nodes&#39;], { encoding: &#39;utf8&#39; }).trim(); |
| first | const | 290 | no | const first = run(); |
| nodeId | const | 291 | no | const nodeId = first.rows.find((row) =&gt; row.type === &#39;node&#39;).id; |
| edited | const | 297 | no | const edited = run(); |
| deleted | const | 304 | no | const deleted = run(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 13 | external |
| node:assert/strict | import | 14 | external |
| node:fs | import | 15 | external |
| node:os | import | 16 | external |
| node:path | import | 17 | external |
| node:url | import | 18 | external |
| node:child_process | import | 19 | external |
| ../lib/schema.mjs | import | 20 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/indexer.mjs | import | 21 | [hq/lib/indexer.mjs](../lib/indexer.mjs.md) |
| ../lib/semantic-registry.mjs | import | 22 | [hq/lib/semantic-registry.mjs](../lib/semantic-registry.mjs.md) |
| ../lib/kg-export.mjs | import | 23 | [hq/lib/kg-export.mjs](../lib/kg-export.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 4 | context | — | — | A registered source change must reach the native graph as an |
| 7 | invariant | — | — | The active `.hq/index.db` is never touched; every database is |
| 9 | invariant | — | — | No new graph, journal or parser: the projection is read from the |
| 12 | see | — | hq/lib/indexer.mjs | hq/lib/indexer.mjs · hq/lib/semantic-registry.mjs · hq/lib/kg-export.mjs |

## Excerpt

```javascript
// hq/test/revision-cache-lifecycle.test.mjs — the indexer's semantic delta as a
// scoped, revision-fenced projection the native graph can consume.
//
// @hq:context A registered source change must reach the native graph as an
//   update of the SAME identity, and a deletion as a tombstone of that exact
//   former identity. A path the bounded walk could not see is not a deletion.
// @hq:invariant The active `.hq/index.db` is never touched; every database is
//   in-memory and every fixture lives under a disposable temp directory.
// @hq:invariant No new graph, journal or parser: the projection is read from the
//   existing index and published through the incumbent exchange
//   (hq/lib/kg-export.mjs), which the native importer admits.
// @hq:see hq/lib/indexer.mjs · hq/lib/semantic-registry.mjs · hq/lib/kg-export.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import { indexedSemanticAnchors, semanticAnchorChanges } from '../lib/semantic-registry.mjs';
import { acknowledgeGraphExport, exportGraphExchange } from '../lib/kg-export.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CAP = 'demo.cap@1';

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'hq-revision-cache-'));
  const project = join(root, 'demo');
  mkdirSync(join(project, 'src'), { recursive: true });
  for (const [rel, text] of Object.entries(files)) writeFileSync(join(project, rel), text, 'utf8');
  return { root, project, file: (rel) => join(project, rel) };
}

function openIndex(root, project) {
  const db = openMemoryDb();
  return {
    db,
    run: (options = {}) => indexProject({
      root, db, project: { name: 'demo', path: project }, options: { useGit: false, ...options },
    }),
    anchors: (path = 'src/one.mjs') => {
      const row = db.prepare('SELECT id, path, hash FROM files WHERE path = ?').get(path);
      return row ? indexedSemanticAnchors(db, { fileId: row.id, project: 'demo', path: row.path, hash: row.hash }) : [];
    },
    close: () => db.close(),
  };
}

function exchangeRows(db, root) {
  const dir = join(root, '.hq');
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'kg-exchange.jsonl');
  const statePath = join(dir, 'kg-export-state.json');
  const exported = exportGraphExchange({ db, outPath, statePath });
  const text = readFileSync(outPath, 'utf8');
  const eol = text.indexOf('\n');
  const rows = text.slice(eol + 1).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return { exported, statePath, rows, text };
}

// ---------------------------------------------------------------------------
// Revisioned projection: stable identity, tombstone, no spurious invalidation
// ---------------------------------------------------------------------------

test('a registered source change updates one identity and carries its revision', () => {
  const f = fixture({ 'src/one.mjs': `/** @hq:capability ${CAP} */\nexport const alpha = 1;\n` });
  const index = openIndex(f.root, f.project);
  try {
    const first = index.run();
    assert.equal(first.errors.length, 0);
    const [before] = index.anchors();
    assert.ok(before, 'the capability annotation is indexed as an anchor');
    assert.equal(before.semanticId, CAP);
    assert.equal(before.state, 'indexed');
    const [added] = first.semanticChanges;
    assert.equal(added.change, 'added');
    assert.equal(added.anchorId, before.anchorId);
```

_First 80 of 312 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
