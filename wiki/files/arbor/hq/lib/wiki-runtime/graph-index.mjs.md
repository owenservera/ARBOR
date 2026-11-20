# File: hq/lib/wiki-runtime/graph-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/wiki-runtime/graph-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7403 B |
| Lines | 162 |
| Hash | b63f5c4c393b |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GRAPH_INDEX_SCHEMA | const | 24 | yes | export const GRAPH_INDEX_SCHEMA = &#39;vivim.wave1.wiki-graph-index/1&#39;; |
| EXCHANGE_SCHEMA | const | 25 | no | const EXCHANGE_SCHEMA = &#39;repos-hq.hqkg-exchange/1&#39;; |
| MAX_BYTES | const | 26 | no | const MAX_BYTES = 128 * 1024 * 1024; |
| MAX_NODES | const | 27 | no | const MAX_NODES = 250000; |
| MAX_EDGES | const | 28 | no | const MAX_EDGES = 1000000; |
| ID_RE | const | 29 | no | const ID_RE = /^hqg1:[a-f0-9]{64}$/; |
| sha256 | function | 31 | no | const sha256 = value =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| buildGraphIndex | function | 33 | yes | export function buildGraphIndex(exchangePath) { |
| text | const | 34 | no | const text = readFileSync(exchangePath, &#39;utf8&#39;); |
| eol | const | 36 | no | const eol = text.indexOf(&#39;\\n&#39;); |
| body | const | 38 | no | const body = text.slice(eol + 1); |
| manifest | const | 39 | no | const manifest = JSON.parse(text.slice(0, eol)); |
| bySemanticId | const | 55 | no | const bySemanticId = new Map(); |
| byActionId | const | 56 | no | const byActionId = new Map(); |
| bySourceFile | const | 57 | no | const bySourceFile = new Map(); |
| ambiguousSourceFiles | const | 58 | no | const ambiguousSourceFiles = new Set(); |
| byNodeId | const | 59 | no | const byNodeId = new Map(); |
| push | function | 60 | no | const push = (map, key, entry) =&gt; { |
| list | const | 61 | no | const list = map.get(key) ?? []; |
| nodes | variable | 65 | no | let nodes = 0; |
| edges | variable | 66 | no | let edges = 0; |
| seenEdges | variable | 67 | no | let seenEdges = false; |
| edgeIds | const | 68 | no | const edgeIds = new Set(); |
| endpoints | const | 69 | no | const endpoints = []; |
| validId | function | 70 | no | const validId = id =&gt; typeof id === &#39;string&#39; &amp;&amp; ID_RE.test(id); |
| validName | function | 71 | no | const validName = value =&gt; typeof value === &#39;string&#39; &amp;&amp; value.length &gt; 0 |
| validMetadata | function | 73 | no | const validMetadata = meta =&gt; { |
| keys | const | 75 | no | const keys = Object.keys(meta); |
| size | variable | 77 | no | let size = 0; |
| lower | const | 79 | no | const lower = key.toLowerCase(); |
| value | const | 83 | no | const value = meta[key]; |
| rendered | const | 86 | no | const rendered = String(value); |
| row | variable | 96 | no | let row; |
| meta | const | 117 | no | const meta = row.metadata ?? {}; |
| entry | const | 119 | no | const entry = { |
| key | const | 137 | no | const key = entry.sourcePath + &#39;\\u0000&#39; + entry.sourceSha256; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 21 | external |
| node:fs | import | 22 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/wiki-runtime/graph-index.mjs |
| [hq/test/kg-export.test.mjs](../../test/kg-export.test.mjs.md) | ../lib/wiki-runtime/graph-index.mjs |
| [hq/test/native-graph-wiki-admission.test.mjs](../../test/native-graph-wiki-admission.test.mjs.md) | ../lib/wiki-runtime/graph-index.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 12 | context | — | — | Graph-linked wiki projection over Lane E&#39;s published exchange. |
| 13 | owner | hq-agent | — | hq-agent |
| 14 | task | — | — | wave1-wiki-graph-index |
| 15 | invariant | — | — | Read only. No graph write, no journal write, no second identity |
| 17 | invariant | — | — | The exchange body must match the manifest&#39;s own graph_sha256, or |
| 19 | see | — | hq/live-graph/wave1/master/README.md | hq/live-graph/wave1/master/README.md |

## Excerpt

```javascript
/**
 * Graph identity index for the wiki writer.
 *
 * Reads the published `repos-hq.hqkg-exchange/1` file that Lane E's assembler
 * produced, verifies the manifest's own SHA-256 over the body, and returns a
 * bounded read model that lets the existing wiki writer name the canonical graph
 * id of a source file, a semantic identity and a registered command.
 *
 * It is a READ MODEL over the graph. It creates no identity, computes no
 * canonical id of its own, and stores nothing.
 *
 * @hq:context Graph-linked wiki projection over Lane E's published exchange.
 * @hq:owner hq-agent
 * @hq:task wave1-wiki-graph-index
 * @hq:invariant Read only. No graph write, no journal write, no second identity
 *   authority: every id in the index is copied from the exchange verbatim.
 * @hq:invariant The exchange body must match the manifest's own graph_sha256, or
 *   the index is refused.
 * @hq:see hq/live-graph/wave1/master/README.md
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const GRAPH_INDEX_SCHEMA = 'vivim.wave1.wiki-graph-index/1';
const EXCHANGE_SCHEMA = 'repos-hq.hqkg-exchange/1';
const MAX_BYTES = 128 * 1024 * 1024;
const MAX_NODES = 250000;
const MAX_EDGES = 1000000;
const ID_RE = /^hqg1:[a-f0-9]{64}$/;

const sha256 = value => createHash('sha256').update(value).digest('hex');

export function buildGraphIndex(exchangePath) {
  const text = readFileSync(exchangePath, 'utf8');
  if (!text || Buffer.byteLength(text) > MAX_BYTES) throw new Error('BAD_EXCHANGE_BYTES');
  const eol = text.indexOf('\n');
  if (eol <= 0) throw new Error('MISSING_MANIFEST');
  const body = text.slice(eol + 1);
  const manifest = JSON.parse(text.slice(0, eol));
  if (manifest.schema !== EXCHANGE_SCHEMA || manifest.type !== 'manifest') throw new Error('BAD_EXCHANGE_MANIFEST');
  if (manifest.graph_sha256 !== sha256(body)) throw new Error('BAD_EXCHANGE_SHA');
  // Match the existing native importer admission rules before exposing records to
  // the wiki. The hash authenticates bytes against this manifest, not structure.
  if (manifest.authority !== 'data-only; no executable code or provider actions'
    || typeof manifest.source !== 'string' || !manifest.source || Buffer.byteLength(manifest.source) > 256
    || /[\x00-\x1f\x7f]/.test(manifest.source)) throw new Error('BAD_EXCHANGE_AUTHORITY');
  if (!Number.isSafeInteger(manifest.node_count) || manifest.node_count < 0 || manifest.node_count > MAX_NODES
    || !Number.isSafeInteger(manifest.edge_count) || manifest.edge_count < 0 || manifest.edge_count > MAX_EDGES) {
    throw new Error('BAD_EXCHANGE_COUNTS');
  }
  if (!body.endsWith('\n')) throw new Error('BAD_EXCHANGE_NEWLINE');

  // One semantic identity can name several graph nodes (the knowledge record and
  // the command that carries it), so every key keeps a list, never a single winner.
  const bySemanticId = new Map();
  const byActionId = new Map();
  const bySourceFile = new Map();
  const ambiguousSourceFiles = new Set();
  const byNodeId = new Map();
  const push = (map, key, entry) => {
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  };
  let nodes = 0;
  let edges = 0;
  let seenEdges = false;
  const edgeIds = new Set();
  const endpoints = [];
  const validId = id => typeof id === 'string' && ID_RE.test(id);
  const validName = value => typeof value === 'string' && value.length > 0
    && Buffer.byteLength(value) <= 256 && !/[\x00-\x1f\x7f]/.test(value);
  const validMetadata = meta => {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false;
    const keys = Object.keys(meta);
    if (keys.length > 256) return false;
    let size = 0;
    for (const key of keys) {
      const lower = key.toLowerCase();
      if (!validName(key) || key.startsWith('hqkg.')
```

_First 80 of 163 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
