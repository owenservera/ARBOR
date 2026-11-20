# File: studio/bin/commands/platform.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/platform.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16753 B |
| Lines | 258 |
| Hash | 55fe34cda669 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| readInput | function | 14 | no | function readInput(ref) { |
| file | const | 18 | no | const file = path.resolve(ref); |
| ROW_KEYS | const | 24 | no | const ROW_KEYS = [&#39;tables&#39;, &#39;sections&#39;, &#39;candidates&#39;, &#39;detections&#39;, &#39;fields&#39;, &#39;items&#39;, &#39;rows&#39;, &#39;entities&#39;, &#39;findings&#39;, &#39;matches&#39;, &#39;clusters&#39;, &#39;phrases&#39;]; |
| firstRows | function | 25 | no | function firstRows(result, keys = ROW_KEYS) { |
| cell | function | 31 | no | const cell = (v) =&gt; (v === null \|\| v === undefined ? &#39;&#39; : typeof v === &#39;object&#39; ? JSON.stringify(v) : String(v)); |
| columnsFor | function | 32 | no | function columnsFor(rows, max = 6) { |
| keys | const | 33 | no | const keys = [...new Set(rows.slice(0, 5).flatMap((r) =&gt; (r &amp;&amp; typeof r === &#39;object&#39; ? Object.keys(r) : [])))].slice(0, max); |
| findingsOf | function | 37 | no | function findingsOf(scan) { |
| mod | const | 54 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;platformStats&#39;], &#39;Platform statistics&#39;); |
| stats | const | 55 | no | const stats = await mod.platformStats(); |
| rows | const | 59 | no | const rows = firstRows(stats); |
| mod | const | 69 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;registrySnapshot&#39;], &#39;Platform registry&#39;); |
| snapshot | const | 70 | no | const snapshot = await mod.registrySnapshot(); |
| rows | const | 72 | no | const rows = firstRows(snapshot, [&#39;entries&#39;, &#39;items&#39;, &#39;plugins&#39;, &#39;sources&#39;, &#39;rows&#39;]); |
| text | const | 85 | no | const text = readInput(ctx.args[0]); |
| mod | const | 86 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;detectAndScan&#39;], &#39;Document detection&#39;); |
| result | const | 87 | no | const result = await mod.detectAndScan(text); |
| rows | const | 88 | no | const rows = firstRows(result) ?? []; |
| scan | const | 92 | no | const scan = result?.securityScan; |
| text | const | 105 | no | const text = readInput(ctx.args[0]); |
| mod | const | 106 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;detectAndScan&#39;], &#39;Security scan&#39;); |
| result | const | 107 | no | const result = await mod.detectAndScan(text, ctx.flags.pii ? { pii: true } : undefined); |
| scan | const | 108 | no | const scan = result?.securityScan ?? result; |
| findings | const | 109 | no | const findings = findingsOf(scan); |
| found | const | 110 | no | const found = findings.length \|\| Number(scan?.count ?? scan?.total ?? scan?.found ?? 0); |
| text | const | 124 | no | const text = readInput(ctx.args[0]); |
| mod | const | 125 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;csvAnalyze&#39;], &#39;CSV analysis&#39;); |
| result | const | 126 | no | const result = await mod.csvAnalyze(text); |
| cols | const | 127 | no | const cols = Array.isArray(result?.header) ? result.header : Array.isArray(result?.columns) ? result.columns : []; |
| rawRows | const | 128 | no | const rawRows = Array.isArray(result?.records) ? result.records : Array.isArray(result?.rows) ? result.rows : []; |
| rows | const | 129 | no | const rows = rawRows.slice(0, ctx.flags.limit).map((r) =&gt; (Array.isArray(r) ? Object.fromEntries(cols.map((c, i) =&gt; [typeof c === &#39;string&#39; ? c : c?.name ?? `c${i}`, r[i]])) : r)); |
| stats | const | 131 | no | const stats = result?.stats ?? result?.summary; |
| colRows | const | 133 | no | const colRows = cols.filter((c) =&gt; c &amp;&amp; typeof c === &#39;object&#39;); |
| columnsFromStrings | function | 142 | no | function columnsFromStrings(rows, cols) { |
| keys | const | 143 | no | const keys = Object.keys(rows[0] ?? {}); |
| session | const | 159 | no | const session = ctx.session(ctx.args[0]); |
| mod | const | 160 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;dedupeSession&#39;], &#39;Duplicate detection&#39;); |
| result | const | 161 | no | const result = await mod.dedupeSession(session, { max: ctx.flags.max, threshold: ctx.flags.threshold }); |
| clusters | const | 162 | no | const clusters = Array.isArray(result) ? result : result?.clusters ?? []; |
| stats | const | 163 | no | const stats = Array.isArray(result) ? { clusters: clusters.length } : result?.stats ?? {}; |
| rows | const | 164 | no | const rows = clusters.map((c, i) =&gt; ({ id: c.id ?? c.key ?? `c${i + 1}`, size: c.size ?? c.members?.length ?? 0, members: (c.members ?? []).slice(0, 5).map((m) =&gt; (typeof m === &#39;string&#39; ? m : m.id ??… |
| session | const | 179 | no | const session = ctx.session(ctx.args[0]); |
| mod | const | 180 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;analyzeSessionGraph&#39;], &#39;Graph analysis&#39;); |
| result | const | 181 | no | const result = await mod.analyzeSessionGraph(session); |
| stats | const | 182 | no | const stats = result?.stats ?? (Array.isArray(result) ? {} : result) ?? {}; |
| rank | variable | 183 | no | let rank = result?.pagerank ?? result?.rank ?? []; |
| ranked | const | 185 | no | const ranked = [...(Array.isArray(rank) ? rank : [])].sort((a, b) =&gt; (b.score ?? b.rank ?? 0) - (a.score ?? a.rank ?? 0)).slice(0, ctx.flags.limit) |
| communities | const | 187 | no | const communities = result?.communities ?? result?.communitySummary ?? null; |
| commCount | const | 188 | no | const commCount = Array.isArray(communities) ? communities.length : communities?.count ?? communities?.length ?? 0; |
| commSizes | const | 189 | no | const commSizes = Array.isArray(communities) ? communities.map((c) =&gt; c.size ?? c.members?.length ?? 0) : communities?.sizes ?? []; |
| entries | const | 192 | no | const entries = Object.entries(stats).filter(([, v]) =&gt; v !== null &amp;&amp; typeof v !== &#39;object&#39;); |
| session | const | 206 | no | const session = ctx.session(ctx.args[0]); |
| mod | const | 207 | no | const mod = await capability(&#39;../../src/intel/platform.mjs&#39;, [&#39;keyphrasesSession&#39;], &#39;Keyphrase extraction&#39;); |
| raw | const | 208 | no | const raw = await mod.keyphrasesSession(session, { limit: ctx.flags.limit }); |
| list | const | 209 | no | const list = Array.isArray(raw) ? raw : raw?.keyphrases ?? raw?.phrases ?? []; |
| rows | const | 210 | no | const rows = list.slice(0, ctx.flags.limit).map((p) =&gt; (typeof p === &#39;string&#39; ? { phrase: p } : { phrase: p.phrase ?? p.term ?? p.text ?? &#39;&#39;, score: p.score ?? p.weight ?? p.count })); |
| targetDir | function | 224 | no | function targetDir(ctx, ref, kind) { |
| asPath | const | 226 | no | const asPath = path.resolve(ref); |
| dir | const | 235 | no | const dir = targetDir(ctx, ctx.args[0], &#39;build&#39;); |
| mod | const | 236 | no | const mod = await capability(&#39;../../src/store/integrity.mjs&#39;, [&#39;buildManifest&#39;, &#39;verifyManifest&#39;], &#39;Integrity manifest&#39;); |
| manifest | const | 237 | no | const manifest = mod.buildManifest(dir); |
| dir | const | 246 | no | const dir = targetDir(ctx, ctx.args[0], &#39;verify&#39;); |
| mod | const | 247 | no | const mod = await capability(&#39;../../src/store/integrity.mjs&#39;, [&#39;verifyManifest&#39;], &#39;Integrity verification&#39;); |
| report | variable | 248 | no | let report; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../../src/config.mjs | import | 4 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../lib/registry.mjs | import | 5 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 6 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/capabilities.mjs | import | 7 | [studio/bin/lib/capabilities.mjs](../lib/capabilities.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/platform.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// detect, scan, csv, dedupe, kb graph-stats|keyphrases, integrity build|verify, platform stats|registry
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { EXIT } from '../../src/config.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, notFound, fmtBytes } from '../lib/ui.mjs';
import { capability } from '../lib/capabilities.mjs';

// ---------------------------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------------------------

// Read a file argument, or stdin for "-" / no argument.
function readInput(ref) {
  if (!ref || ref === '-') {
    try { return readFileSync(0, 'utf8'); } catch { throw usageError('No input on stdin.', 'Pipe text in: cat page.json | studio detect -'); }
  }
  const file = path.resolve(ref);
  try { statSync(file); } catch { throw notFound(`No file "${ref}".`); }
  return readFileSync(file, 'utf8');
}

// First array of objects found on a result document (engines differ in naming).
const ROW_KEYS = ['tables', 'sections', 'candidates', 'detections', 'fields', 'items', 'rows', 'entities', 'findings', 'matches', 'clusters', 'phrases'];
function firstRows(result, keys = ROW_KEYS) {
  if (Array.isArray(result)) return result;
  for (const k of keys) if (Array.isArray(result?.[k]) && result[k].length) return result[k];
  return null;
}

const cell = (v) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));
function columnsFor(rows, max = 6) {
  const keys = [...new Set(rows.slice(0, 5).flatMap((r) => (r && typeof r === 'object' ? Object.keys(r) : [])))].slice(0, max);
  return keys.map((k) => ({ title: k.toUpperCase(), get: (r) => cell(r?.[k]), max: 40 }));
}

function findingsOf(scan) {
  if (!scan) return [];
  if (Array.isArray(scan)) return scan;
  for (const k of ['findings', 'secrets', 'credentials', 'matches', 'hits', 'items']) if (Array.isArray(scan[k])) return scan[k];
  return [];
}

// ---------------------------------------------------------------------------------------------
defineGroup('platform', {
  section: 'System', default: 'stats',
  summary: 'Local platform capabilities, statistics and registry snapshot',
  description: 'Read-only views of the platform layer: what this build can do and how the local registry is composed.',
});

define({
  name: 'platform stats', section: 'System', summary: 'Platform capability and usage statistics',
  async run(ctx) {
    const mod = await capability('../../src/intel/platform.mjs', ['platformStats'], 'Platform statistics');
    const stats = await mod.platformStats();
    ctx.out.emit(stats, (o) => {
      if (stats && typeof stats === 'object' && !Array.isArray(stats)) {
        o.kv(Object.entries(stats).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]));
        const rows = firstRows(stats);
        if (rows) { o.line(''); o.table(rows, columnsFor(rows)); }
      } else o.result(JSON.stringify(stats, null, 2));
    });
  },
});

define({
  name: 'platform registry', section: 'System', summary: 'Snapshot of the local platform registry',
  async run(ctx) {
    const mod = await capability('../../src/intel/platform.mjs', ['registrySnapshot'], 'Platform registry');
    const snapshot = await mod.registrySnapshot();
    ctx.out.emit(snapshot, (o) => {
      const rows = firstRows(snapshot, ['entries', 'items', 'plugins', 'sources', 'rows']);
      if (rows) { o.table(rows, columnsFor(rows)); return; }
      o.result(JSON.stringify(snapshot, null, 2));
    });
  },
});

// ---------------------------------------------------------------------------------------------
define({
```

_First 80 of 259 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
