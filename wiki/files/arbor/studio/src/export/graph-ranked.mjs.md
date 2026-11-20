# File: studio/src/export/graph-ranked.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/export/graph-ranked.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1500 B |
| Lines | 18 |
| Hash | cbc6453822e4 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| exportGraphRanked | function | 4 | yes | export async function exportGraphRanked(session, outFile, { format = &#39;json&#39;, limit = 100, seeds = [] } = {}) { |
| rankGraphNodes | const | 7 | no | const rankGraphNodes = await exportCapability(&#39;../intel/graph.mjs&#39;, &#39;rankGraphNodes&#39;, &#39;Graph ranking&#39;); |
| graph | const | 8 | no | const graph = session.kv.get(&#39;GRAPH&#39;, null); |
| nodes | const | 10 | no | const nodes = new Map((graph.nodes ?? []).map((node) =&gt; [node.eid ?? node.id, node])); |
| ranked | const | 11 | no | const ranked = await rankGraphNodes(graph, { seeds }); |
| rows | const | 12 | no | const rows = ranked.slice(0, limit).map((item, index) =&gt; ({ rank: index + 1, ...nodes.get(item.eid), ...item })); |
| text | const | 13 | no | const text = format === &#39;json&#39; ? JSON.stringify({ session: session.id, algorithm: &#39;confidence-weighted-pagerank&#39;, seeds, total: ranked.length, rows }, null, 2) + &#39;\\n&#39; |
| sink | const | 15 | no | const sink = openSink(outFile); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./capabilities.mjs | import | 1 | [studio/src/export/capabilities.mjs](./capabilities.mjs.md) |
| ./export.mjs | import | 2 | [studio/src/export/export.mjs](./export.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/export/export.mjs](./export.mjs.md) | ./graph-ranked.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { exportCapability } from './capabilities.mjs';
import { openSink, formatRows, DATASET_FORMATS, ExportError } from './export.mjs';

export async function exportGraphRanked(session, outFile, { format = 'json', limit = 100, seeds = [] } = {}) {
  if (!DATASET_FORMATS.includes(format)) throw new ExportError(`Unknown ranked graph format ${format}.`, 'BAD_FORMAT');
  if (!Number.isInteger(limit) || limit < 1) throw new ExportError('Ranked graph limit must be a positive integer.', 'BAD_FORMAT');
  const rankGraphNodes = await exportCapability('../intel/graph.mjs', 'rankGraphNodes', 'Graph ranking');
  const graph = session.kv.get('GRAPH', null);
  if (!graph) throw new ExportError(`No graph for ${session.id}. Run "studio derive ${session.id}" first.`, 'NO_KNOWLEDGE');
  const nodes = new Map((graph.nodes ?? []).map((node) => [node.eid ?? node.id, node]));
  const ranked = await rankGraphNodes(graph, { seeds });
  const rows = ranked.slice(0, limit).map((item, index) => ({ rank: index + 1, ...nodes.get(item.eid), ...item }));
  const text = format === 'json' ? JSON.stringify({ session: session.id, algorithm: 'confidence-weighted-pagerank', seeds, total: ranked.length, rows }, null, 2) + '\n'
    : await formatRows(rows, format, { title: `Ranked graph ${session.id}` });
  const sink = openSink(outFile);
  await sink.write(text); await sink.end();
  return { file: sink.path, format, bytes: Buffer.byteLength(text), nodes: rows.length, total: ranked.length };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
