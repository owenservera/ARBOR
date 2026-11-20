# File: studio/bin/commands/export.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/export.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14323 B |
| Lines | 207 |
| Hash | f7d87d8c05d1 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GRAPH_EXT | const | 16 | no | const GRAPH_EXT = { json: &#39;json&#39;, dot: &#39;dot&#39;, mermaid: &#39;mmd&#39;, graphml: &#39;graphml&#39; }; |
| outFile | function | 19 | no | const outFile = (ctx, session, what, ext) =&gt; ctx.flags.out ?? `${session.id}${what ? `-${what}` : &#39;&#39;}.${ext}`; |
| showWrite | function | 20 | no | const showWrite = (o, label, r) =&gt; o.result(`Wrote ${label} to ${r.file}${r.bytes ? ` (${fmtBytes(r.bytes)})` : &#39;&#39;}`); |
| prepared | function | 23 | no | async function prepared(ctx, ref) { |
| s | const | 24 | no | const s = ctx.session(ref); |
| f | const | 46 | no | const f = ctx.flags; |
| s | const | 47 | no | const s = await prepared(ctx, ctx.args[0]); |
| catalog | const | 49 | no | const catalog = await datasetCatalog(s, { counts: true }); |
| fmt | const | 57 | no | const fmt = f.format ?? (f.out ? inferFormat(f.out, ctx.settings.exportFormat) : ctx.settings.exportFormat); |
| dir | const | 59 | no | const dir = path.resolve(f[&#39;out-dir&#39;] ?? `${s.id}-datasets`); |
| ext | const | 60 | no | const ext = fmt === &#39;ndjson&#39; ? &#39;jsonl&#39; : fmt; |
| results | const | 61 | no | const results = []; |
| file | const | 72 | no | const file = outFile(ctx, s, f.dataset, fmt === &#39;ndjson&#39; ? &#39;jsonl&#39; : fmt); |
| r | const | 73 | no | const r = await exportDataset(s, f.dataset, fmt, file, { limit: f.limit, fields: f.fields, grep: f.grep }); |
| s | const | 91 | no | const s = ctx.session(ctx.args[0]); |
| fmt | const | 92 | no | const fmt = ctx.flags.format ?? (TRANSCRIPT_FORMATS.includes(inferFormat(ctx.flags.out, &#39;md&#39;)) ? inferFormat(ctx.flags.out, &#39;md&#39;) : &#39;md&#39;); |
| r | const | 93 | no | const r = await exportTranscript(s, outFile(ctx, s, &#39;&#39;, fmt), { format: fmt, reviewOnly: !ctx.flags.confirm \|\| !!ctx.flags.receipt, includeTechnical: !!ctx.flags[&#39;include-technical&#39;] }); |
| s | const | 114 | no | const s = await prepared(ctx, ctx.args[0]); |
| fmt | const | 115 | no | const fmt = ctx.flags.format; |
| r | const | 116 | no | const r = await exportKnowledge(s, outFile(ctx, s, &#39;knowledge&#39;, fmt === &#39;ndjson&#39; ? &#39;ndjson&#39; : fmt), { format: fmt, limit: ctx.flags.limit }); |
| f | const | 134 | no | const f = ctx.flags; |
| s | const | 135 | no | const s = await prepared(ctx, ctx.args[0]); |
| r | const | 136 | no | const r = await exportGraph(s, outFile(ctx, s, &#39;graph&#39;, GRAPH_EXT[f.format]), { format: f.format, kind: f.kind, status: f.status, minConfidence: f[&#39;min-confidence&#39;], maxNodes: f[&#39;max-nodes&#39;], edgesOn… |
| s | const | 145 | no | const s = await prepared(ctx, ctx.args[0]); |
| r | const | 146 | no | const r = await exportReport(s, outFile(ctx, s, &#39;report&#39;, &#39;html&#39;)); |
| f | const | 162 | no | const f = ctx.flags; |
| s | const | 163 | no | const s = await prepared(ctx, ctx.args[0]); |
| r | const | 164 | no | const r = await exportBundle(s, f[&#39;out-dir&#39;] ?? `${s.id}-bundle`, { format: f.format, exclude: f.exclude, includeRaw: f[&#39;with-raw&#39;], derived: f.derived }); |
| session | const | 180 | no | const session = ctx.session(ctx.args[0]); |
| result | const | 181 | no | const result = await exportSchemas(session, outFile(ctx, session, &#39;schemas&#39;, &#39;json&#39;), { type: ctx.flags.type }); |
| session | const | 195 | no | const session = ctx.session(ctx.args[0]), f = ctx.flags; |
| result | const | 196 | no | const result = await exportGraphRanked(session, outFile(ctx, session, &#39;graph-ranked&#39;, f.format), { format: f.format, limit: f.limit, seeds: f.seeds }); |
| data | const | 204 | no | const data = { dataset: DATASET_FORMATS, transcript: TRANSCRIPT_FORMATS, knowledge: KNOWLEDGE_FORMATS, graph: GRAPH_FORMATS, schemas: [&#39;json-schema&#39;], &#39;graph-ranked&#39;: DATASET_FORMATS, report: [&#39;html&#39;… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| ../../src/export/export.mjs | import | 3 | [studio/src/export/export.mjs](../../src/export/export.mjs.md) |
| ../lib/registry.mjs | import | 7 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 8 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/util.mjs | import | 9 | [studio/bin/lib/util.mjs](../lib/util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/export.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// export dataset|transcript|knowledge|graph|report|bundle|formats   (+ top-level "transcript")
import path from 'node:path';
import {
  exportDataset, exportTranscript, exportKnowledge, exportGraph, exportReport, exportBundle, exportSchemas, exportGraphRanked, datasetCatalog,
  DATASET_FORMATS, TRANSCRIPT_FORMATS, KNOWLEDGE_FORMATS, GRAPH_FORMATS, inferFormat,
} from '../../src/export/export.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { fmtBytes } from '../lib/ui.mjs';
import { looksActive, isDerived } from '../lib/util.mjs';

defineGroup('export', {
  summary: 'Export datasets, transcripts, knowledge, graphs, reports and bundles', section: 'Export', default: 'dataset', passthrough: true,
  description: 'Export saved sessions. "studio export <id> --dataset events --format csv" is shorthand for "studio export dataset …". Use --out - to write to stdout so exports compose with other tools.',
});

const GRAPH_EXT = { json: 'json', dot: 'dot', mermaid: 'mmd', graphml: 'graphml' };

// Write location: explicit --out, else <session>-<what>.<ext> in the current folder (stdout with "-").
const outFile = (ctx, session, what, ext) => ctx.flags.out ?? `${session.id}${what ? `-${what}` : ''}.${ext}`;
const showWrite = (o, label, r) => o.result(`Wrote ${label} to ${r.file}${r.bytes ? ` (${fmtBytes(r.bytes)})` : ''}`);

// Sessions whose derived data is missing are derived on the fly (not while another process records them).
async function prepared(ctx, ref) {
  const s = ctx.session(ref);
  if (!isDerived(s) && !looksActive(s)) await ctx.ensureDerived(s);
  return s;
}

// ---------------------------------------------------------------------------------------------
define({
  name: 'export dataset', section: 'Export', usage: '[id|latest] --dataset NAME [--format F] [--out FILE]', summary: 'Export one dataset (JSON, NDJSON, CSV, TSV, Markdown, HTML)',
  description: `Exports a derived dataset (events, streams, timeline, entities, records-<name>, family-<name>-<entity>) or a derived view (model-types, suggestions, dom-turns, assembled, graph-edges, …). Formats: ${DATASET_FORMATS.join(', ')}. Run with --list to see what exists for a session.`,
  flags: {
    dataset: { type: 'string', alias: 'd', valueName: 'NAME', desc: 'Dataset to export' },
    format: { type: 'string', alias: 'f', choices: DATASET_FORMATS, desc: 'Output format (default: from --out extension, else the configured exportFormat)' },
    out: { type: 'string', alias: 'o', valueName: 'FILE', desc: 'Output file; "-" writes to stdout' },
    fields: { type: 'list', valueName: 'A,B.C', desc: 'Only these columns (dotted paths into nested records)' },
    limit: { type: 'number', alias: 'n', valueName: 'N', desc: 'Stop after N rows' },
    grep: { type: 'string', valueName: 'TEXT', desc: 'Only rows containing TEXT (case-insensitive)' },
    list: { type: 'boolean', desc: 'List exportable datasets with row counts and exit' },
    all: { type: 'boolean', desc: 'Export every dataset into --out-dir' },
    'out-dir': { type: 'string', valueName: 'DIR', desc: 'Directory for --all (default ./<session>-datasets)' },
  },
  examples: ['studio export latest --dataset events --format jsonl --out events.jsonl', 'studio export latest -d entities -f csv --fields eid,typeName,key,attrs.name -o -', 'studio export latest --all --format html --out-dir ./out', 'studio export latest --list'],
  async run(ctx) {
    const f = ctx.flags;
    const s = await prepared(ctx, ctx.args[0]);
    if (f.list || (!f.dataset && !f.all)) {
      const catalog = await datasetCatalog(s, { counts: true });
      ctx.out.emit({ session: s.id, datasets: catalog }, (o) => {
        o.table(catalog, [{ title: 'DATASET', key: 'name' }, { title: 'KIND', key: 'kind' }, { title: 'ROWS', get: (d) => d.rows, align: 'right' }, { title: 'SIZE', get: (d) => (d.bytes ? fmtBytes(d.bytes) : ''), align: 'right' }, { title: 'ABOUT', get: (d) => d.description ?? '', max: 50 }], { empty: 'No datasets.' });
        if (!f.list) o.line(o.c.dim('Choose one with --dataset NAME.'));
      });
      if (!f.list) process.exitCode = 2;
      return;
    }
    const fmt = f.format ?? (f.out ? inferFormat(f.out, ctx.settings.exportFormat) : ctx.settings.exportFormat);
    if (f.all) {
      const dir = path.resolve(f['out-dir'] ?? `${s.id}-datasets`);
      const ext = fmt === 'ndjson' ? 'jsonl' : fmt;
      const results = [];
      for (const d of await datasetCatalog(s)) {
        try { results.push({ dataset: d.name, ...(await exportDataset(s, d.name, fmt, path.join(dir, `${d.name}.${ext}`), { limit: f.limit, fields: f.fields, grep: f.grep })) }); }
        catch (e) { results.push({ dataset: d.name, error: e.message }); }
      }
      ctx.out.emit({ session: s.id, dir, format: fmt, results }, (o) => {
        for (const r of results) o.result(r.error ? `${o.c.red('skip')} ${r.dataset}: ${r.error}` : `${String(r.rows).padStart(8)} rows  ${r.dataset}${r.truncated ? ' (truncated; pass --limit to choose)' : ''}`);
        o.result(`Wrote ${results.filter((r) => !r.error).length} file(s) to ${dir}`);
      });
      return;
    }
    const file = outFile(ctx, s, f.dataset, fmt === 'ndjson' ? 'jsonl' : fmt);
    const r = await exportDataset(s, f.dataset, fmt, file, { limit: f.limit, fields: f.fields, grep: f.grep });
    if (r.file === '-') { ctx.out.info(`${r.rows} row(s) written to stdout`); return; }
    ctx.out.emit(r, (o) => o.result(`Wrote ${r.rows} rows to ${r.file}${r.truncated ? ' (truncated for this format; pass --limit to choose)' : ''}`));
  },
});

// ---------------------------------------------------------------------------------------------
define({
```

_First 80 of 208 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
