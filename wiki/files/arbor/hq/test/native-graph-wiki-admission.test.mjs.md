# File: hq/test/native-graph-wiki-admission.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/native-graph-wiki-admission.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5487 B |
| Lines | 117 |
| Hash | ddf84846cfbd |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| id | function | 14 | no | const id = char =&gt; &#39;hqg1:&#39; + char.repeat(64); |
| A | const | 15 | no | const A = id(&#39;a&#39;); |
| B | const | 16 | no | const B = id(&#39;b&#39;); |
| E | const | 17 | no | const E = id(&#39;e&#39;); |
| node | function | 18 | no | const node = (nodeId, metadata = {}) =&gt; ({ type: &#39;node&#39;, id: nodeId, kind: &#39;source-file&#39;, title: &#39;fixture&#39;, metadata, }); |
| edge | function | 22 | no | const edge = (from = A, to = B, edgeId = E) =&gt; ({ type: &#39;edge&#39;, id: edgeId, from, to, relation: &#39;imports&#39;, weight: 1, metadata: {}, }); |
| hash | function | 25 | no | const hash = text =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| withExchange | function | 27 | no | function withExchange(rows, check, changes = {}) { |
| body | const | 28 | no | const body = rows.map(row =&gt; typeof row === &#39;string&#39; ? row : JSON.stringify(row)).join(&#39;\\n&#39;) + &#39;\\n&#39;; |
| manifest | const | 29 | no | const manifest = { |
| dir | const | 39 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hqkg-wiki-admission-&#39;)); |
| path | const | 40 | no | const path = join(dir, &#39;exchange.jsonl&#39;); |
| index | const | 51 | no | const index = buildGraphIndex(path); |
| metadata | const | 97 | no | const metadata = { source_path: &#39;src/index.mjs&#39;, content_sha256: &#39;a&#39;.repeat(64) }; |
| index | const | 99 | no | const index = buildGraphIndex(path); |
| key | const | 100 | no | const key = &#39;src/index.mjs&#39; + &#39;\\u0000&#39; + &#39;a&#39;.repeat(64); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| node:crypto | import | 8 | external |
| node:fs | import | 9 | external |
| node:os | import | 10 | external |
| node:path | import | 11 | external |
| ../lib/wiki-runtime/graph-index.mjs | import | 12 | [hq/lib/wiki-runtime/graph-index.mjs](../lib/wiki-runtime/graph-index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Contract parity: HQ wiki's read-only hqkg-exchange/1 admission must not accept
 * a projection that the existing native Rust importer would reject.
 * No indexing, graph journal, private data or Host effects.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraphIndex } from '../lib/wiki-runtime/graph-index.mjs';

const id = char => 'hqg1:' + char.repeat(64);
const A = id('a');
const B = id('b');
const E = id('e');
const node = (nodeId, metadata = {}) => ({
  type: 'node', id: nodeId, kind: 'source-file', title: 'fixture',
  metadata,
});
const edge = (from = A, to = B, edgeId = E) => ({
  type: 'edge', id: edgeId, from, to, relation: 'imports', weight: 1, metadata: {},
});
const hash = text => createHash('sha256').update(text).digest('hex');

function withExchange(rows, check, changes = {}) {
  const body = rows.map(row => typeof row === 'string' ? row : JSON.stringify(row)).join('\n') + '\n';
  const manifest = {
    type: 'manifest',
    schema: 'repos-hq.hqkg-exchange/1',
    source: 'repos-hq/unit-test',
    authority: 'data-only; no executable code or provider actions',
    node_count: rows.filter(row => row?.type === 'node').length,
    edge_count: rows.filter(row => row?.type === 'edge').length,
    graph_sha256: hash(body),
    ...changes,
  };
  const dir = mkdtempSync(join(tmpdir(), 'hqkg-wiki-admission-'));
  const path = join(dir, 'exchange.jsonl');
  try {
    writeFileSync(path, JSON.stringify(manifest) + '\n' + body);
    return check(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('valid imported source projection remains consumable by the existing wiki', () => {
  withExchange([node(A, { source_path: 'hq/lib/a.mjs', content_sha256: '1'.repeat(64) }), node(B), edge()], path => {
    const index = buildGraphIndex(path);
    assert.equal(index.nodeCount, 2);
    assert.equal(index.edgeCount, 1);
    assert.equal(index.byNodeId.size, 2);
    assert.equal(index.bySourceFile.size, 1);
    assert.equal(index.exchangeDigest.length, 64);
  });
});

test('manifest authenticity and admission are both required', () => {
  withExchange([node(A)], path => assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_SHA/),
    { graph_sha256: '0'.repeat(64) });
  withExchange([node(A)], path => assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_AUTHORITY/),
    { authority: 'anything can execute' });
  withExchange([node(A)], path => assert.throws(() => buildGraphIndex(path), /EXCHANGE_COUNT_MISMATCH/),
    { node_count: 2 });
});

test('digest-valid malformed and unknown records fail closed, not silently skipped', () => {
  withExchange([node(A), '{"type":"node",no-json}'], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_JSON/));
  withExchange([node(A), { type: 'surprise', id: B }], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_NODE/));
  withExchange([node(A), ''], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_RECORD/));
});

test('duplicate node IDs and duplicate edge IDs are rejected', () => {
  withExchange([node(A), node(A)], path =>
    assert.throws(() => buildGraphIndex(path), /BAD_EXCHANGE_NODE/));
```

_First 80 of 118 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
