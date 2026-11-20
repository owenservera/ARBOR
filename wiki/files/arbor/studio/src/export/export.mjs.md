# File: studio/src/export/export.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/export/export.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 38296 B |
| Lines | 520 |
| Hash | f98915316c91 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| exportGraphRanked | export | 13 | yes | export { exportSchemas, exportGraphRanked } |
| exportSchemas | export | 13 | yes | export { exportSchemas, exportGraphRanked } |
| DATASET_FORMATS | const | 15 | yes | export const DATASET_FORMATS = [&#39;jsonl&#39;, &#39;ndjson&#39;, &#39;json&#39;, &#39;csv&#39;, &#39;tsv&#39;, &#39;md&#39;, &#39;html&#39;]; |
| TRANSCRIPT_FORMATS | const | 16 | yes | export const TRANSCRIPT_FORMATS = [&#39;md&#39;, &#39;html&#39;, &#39;json&#39;]; |
| KNOWLEDGE_FORMATS | const | 17 | yes | export const KNOWLEDGE_FORMATS = [&#39;json&#39;, &#39;ndjson&#39;, &#39;md&#39;, &#39;html&#39;]; |
| GRAPH_FORMATS | const | 18 | yes | export const GRAPH_FORMATS = [&#39;json&#39;, &#39;dot&#39;, &#39;mermaid&#39;, &#39;graphml&#39;]; |
| EXT_FORMAT | const | 19 | no | const EXT_FORMAT = { &#39;.jsonl&#39;: &#39;jsonl&#39;, &#39;.ndjson&#39;: &#39;jsonl&#39;, &#39;.json&#39;: &#39;json&#39;, &#39;.csv&#39;: &#39;csv&#39;, &#39;.tsv&#39;: &#39;tsv&#39;, &#39;.md&#39;: &#39;md&#39;, &#39;.markdown&#39;: &#39;md&#39;, &#39;.html&#39;: &#39;html&#39;, &#39;.htm&#39;: &#39;html&#39; }; |
| ExportError | class | 21 | yes | export class ExportError extends Error { |
| constructor | method | 22 | yes | constructor(message, code = &#39;EXPORT_ERROR&#39;, extra = {}) { super(message); this.name = &#39;ExportError&#39;; this.code = code; Object.assign(this, extra); } |
| inferFormat | function | 25 | yes | export function inferFormat(file, fallback = &#39;jsonl&#39;) { |
| flatten | function | 33 | yes | export function flatten(obj, prefix = &#39;&#39;, out = {}) { |
| key | const | 35 | no | const key = prefix ? `${prefix}.${k}` : k; |
| csvCell | function | 41 | no | const csvCell = (v, sep = &#39;,&#39;) =&gt; { |
| s | const | 43 | no | const s = String(v); |
| escapeHtml | function | 47 | yes | export const escapeHtml = (s) =&gt; String(s ?? &#39;&#39;).replace(/&amp;/g, &#39;&amp;amp;&#39;).replace(/&lt;/g, &#39;&amp;lt;&#39;).replace(/&gt;/g, &#39;&amp;gt;&#39;).replace(/&quot;/g, &#39;&amp;quot;&#39;); |
| mdCell | function | 48 | no | const mdCell = (v, max = 200) =&gt; String(v ?? &#39;&#39;).replace(/\\\|/g, &#39;\\\\\|&#39;).replace(/\\r?\\n/g, &#39; &#39;).slice(0, max); |
| clip | function | 49 | no | const clip = (v, max) =&gt; { const s = String(v ?? &#39;&#39;); return s.length &gt; max ? `${s.slice(0, max)}…` : s; }; |
| deepGet | function | 51 | no | function deepGet(obj, p) { |
| cur | variable | 52 | no | let cur = obj; |
| project | function | 56 | no | function project(row, fields) { |
| flat | const | 57 | no | const flat = flatten(row); |
| out | const | 58 | no | const out = {}; |
| countLines | function | 63 | no | async function countLines(file) { |
| n | variable | 64 | no | let n = 0; |
| openSink | function | 72 | yes | export function openSink(outFile) { |
| out | const | 81 | no | const out = createWriteStream(outFile); |
| failed | const | 82 | no | const failed = new Promise((_, reject) =&gt; out.once(&#39;error&#39;, reject)); |
| memorySink | function | 89 | no | function memorySink() { |
| parts | const | 90 | no | const parts = []; |
| kvArray | function | 97 | no | const kvArray = (s, key, pick) =&gt; { const v = s.kv.get(key, null); const x = pick ? pick(v) : v; return Array.isArray(x) ? x : null; }; |
| VIRTUAL_DATASETS | const | 98 | yes | export const VIRTUAL_DATASETS = { |
| realDatasetNames | function | 112 | yes | export function realDatasetNames(session) { |
| datasetCatalog | function | 117 | yes | export async function datasetCatalog(session, { counts = false } = {}) { |
| out | const | 118 | no | const out = []; |
| file | const | 120 | no | const file = session.dataset(name).file; |
| rows | const | 124 | no | const rows = v.rows(session); |
| rowsOf | function | 130 | yes | export async function* rowsOf(session, name) { |
| ds | const | 131 | no | const ds = session.dataset(name); |
| virt | const | 133 | no | const virt = VIRTUAL_DATASETS[name]?.rows(session); |
| available | const | 135 | no | const available = (await datasetCatalog(session)).map((d) =&gt; d.name); |
| limited | function | 139 | no | async function* limited(iter, { limit, grep, fields }) { |
| needle | const | 140 | no | const needle = grep ? String(grep).toLowerCase() : null; |
| n | variable | 141 | no | let n = 0; |
| discoverColumns | function | 149 | no | async function discoverColumns(makeIter, { maxRows = Infinity, maxCols = 200 } = {}) { |
| cols | const | 150 | no | const cols = new Set(); |
| n | variable | 151 | no | let n = 0; |
| CSS | const | 162 | no | const CSS = `body{font:14px/1.45 system-ui,sans-serif;margin:1.5rem;color:#1b1f23;background:#fff}@media(prefers-color-scheme:dark){body{color:#d7dde4;background:#14171a}th{background:#1d2227!importa… |
| FILTER_JS | const | 165 | no | const FILTER_JS = `&lt;script&gt;(function(){var q=document.getElementById(&#39;q&#39;);if(!q)return;q.addEventListener(&#39;input&#39;,function(){var t=q.value.toLowerCase();document.querySelectorAll(&#39;tbody tr&#39;).forEach(… |
| htmlPage | function | 166 | yes | export function htmlPage(title, body, { filter = false } = {}) { |
| htmlTable | function | 169 | no | const htmlTable = (headers, rows, { max = 500 } = {}) =&gt; `&lt;table&gt;&lt;thead&gt;&lt;tr&gt;${headers.map((h) =&gt; `&lt;th&gt;${escapeHtml(h)}&lt;/th&gt;`).join(&#39;&#39;)}&lt;/tr&gt;&lt;/thead&gt;&lt;tbody&gt;${rows.map((r) =&gt; `&lt;tr&gt;${r.map((c) =&gt; `&lt;td&gt;$… |
| rowWriter | function | 174 | no | function rowWriter(format, sink, { columns = [], title = &#39;Export&#39;, meta = &#39;&#39; } = {}) { |
| n | variable | 175 | no | let n = 0; |
| sep | const | 182 | no | const sep = format === &#39;tsv&#39; ? &#39;\\t&#39; : &#39;,&#39;; |
| COLUMN_CAPS | const | 206 | no | const COLUMN_CAPS = { csv: 200, tsv: 200, md: 12, html: 40 }; |
| ROW_CAPS | const | 207 | no | const ROW_CAPS = { md: 5000, html: 20000 }; |
| exportDataset | function | 211 | yes | export async function exportDataset(session, name, format, outFile, opts = {}) { |
| fields | const | 214 | no | const fields = Array.isArray(opts.fields) &amp;&amp; opts.fields.length ? opts.fields : null; |
| rowCap | const | 215 | no | const rowCap = opts.limit ?? ROW_CAPS[format] ?? 0; |
| source | function | 216 | no | const source = () =&gt; limited(rowsOf(session, name), { limit: rowCap, grep: opts.grep, fields: format === &#39;jsonl&#39; \|\| format === &#39;ndjson&#39; \|\| format === &#39;json&#39; ? fields : null }); |
| probe | const | 218 | no | const probe = rowsOf(session, name)[Symbol.asyncIterator](); |
| columns | variable | 220 | no | let columns = []; |
| sink | const | 224 | no | const sink = openSink(outFile); |
| w | const | 225 | no | const w = rowWriter(format, sink, { columns, title: opts.title ?? `${session.id} · ${name}`, meta: `${new Date().toISOString()} · dataset ${name}` }); |
| rows | const | 228 | no | const rows = await w.end(); |
| capped | const | 230 | no | const capped = !!ROW_CAPS[format] &amp;&amp; !opts.limit &amp;&amp; rows &gt;= ROW_CAPS[format]; |
| formatRows | function | 235 | yes | export async function formatRows(rows, format = &#39;jsonl&#39;, { fields, title, columns: given } = {}) { |
| list | const | 237 | no | const list = fields?.length ? rows.map((r) =&gt; project(r, fields)) : rows; |
| cols | const | 238 | no | const cols = given ?? (COLUMN_CAPS[format] ? await discoverColumns(async function* () { yield* list; }, { maxCols: COLUMN_CAPS[format] }) : []); |
| sink | const | 239 | no | const sink = memorySink(); |
| w | const | 240 | no | const w = rowWriter(format, sink, { columns: cols, title: title ?? &#39;Export&#39;, meta: new Date().toISOString() }); |
| redactExportValue | function | 250 | yes | export function redactExportValue(value, key = &#39;&#39;, stats = { changed: 0 }) { |
| text | variable | 256 | no | let text = scrubText(value).text; |
| hits | const | 258 | no | const hits = detectSecrets(text, { extended: true }); |
| buildTranscript | function | 270 | yes | export async function buildTranscript(session, { maxTimeline = 20000, topTexts = 5, includeTechnical = false } = {}) { |
| m | const | 271 | no | const m = session.meta; |
| assembled | const | 272 | no | const assembled = session.kv.get(&#39;ASSEMBLED&#39;, {}) ?? {}; |
| timeline | const | 273 | no | const timeline = includeTechnical ? await session.dataset(&#39;timeline&#39;).toArray(maxTimeline) : []; |
| t0 | const | 274 | no | const t0 = timeline[0]?.t ?? 0; |
| streams | const | 275 | no | const streams = []; |
| texts | const | 277 | no | const texts = []; |
| walk | function | 278 | no | const walk = (n, p) =&gt; { if (typeof n === &#39;string&#39; &amp;&amp; n.length &gt;= 20) texts.push([p, n]); else if (n &amp;&amp; typeof n === &#39;object&#39;) for (const [k, v] of Object.entries(n)) walk(v, `${p}/${k}`); }; |
| turns | const | 282 | no | const turns = (session.kv.get(&#39;DOM_TURNS&#39;, []) ?? []).filter((t) =&gt; t &amp;&amp; (t.text \|\| t.role)).map((t) =&gt; ({ id: t.id, role: t.role ?? &#39;&#39;, text: t.text ?? &#39;&#39; })); |
| timelineLine | function | 290 | no | function timelineLine(e) { |
| renderTranscriptMarkdown | function | 294 | yes | export function renderTranscriptMarkdown(tr) { |
| m | const | 295 | no | const m = tr.meta; |
| out | const | 296 | no | const out = [`# Saved conversation ${m.id}`, &#39;&#39;, `- Page: ${m.target?.title ?? &#39;&#39;} (${m.target?.url ?? &#39;&#39;})`, `- Browser: ${m.browser}`, `- Profile: ${m.profile?.name}@v${m.profile?.version}`, `- Sav… |
| renderTranscriptHtml | function | 311 | yes | export function renderTranscriptHtml(tr) { |
| m | const | 312 | no | const m = tr.meta; |
| body | const | 313 | no | const body = [ |
| exportTranscript | function | 326 | yes | export async function exportTranscript(session, outFile, opts = {}) { |
| format | const | 327 | no | const format = opts.format ?? (TRANSCRIPT_FORMATS.includes(inferFormat(outFile, &#39;md&#39;)) ? inferFormat(outFile, &#39;md&#39;) : &#39;md&#39;); |
| stats | const | 329 | no | const stats = { changed: 0 }; |
| tr | const | 330 | no | const tr = redactExportValue(await buildTranscript(session, opts), &#39;&#39;, stats); |
| review | const | 331 | no | const review = { session: session.id, messages: tr.turns.length, timelineEntries: tr.timeline.length, |
| text | const | 337 | no | const text = format === &#39;json&#39; ? JSON.stringify(tr, null, 2) + &#39;\\n&#39; : format === &#39;html&#39; ? renderTranscriptHtml(tr) : renderTranscriptMarkdown(tr); |
| writeText | function | 341 | no | async function writeText(outFile, text, extra = {}) { |
| loadKnowledge | function | 351 | no | async function loadKnowledge(session, { maxEntities = Infinity } = {}) { |
| status | const | 352 | no | const status = session.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| model | const | 353 | no | const model = session.kv.get(&#39;MODEL&#39;, null); |
| entities | const | 356 | no | const entities = []; |
| exportKnowledge | function | 361 | yes | export async function exportKnowledge(session, outFile, opts = {}) { |
| format | const | 362 | no | const format = opts.format ?? (KNOWLEDGE_FORMATS.includes(inferFormat(outFile, &#39;json&#39;)) ? inferFormat(outFile, &#39;json&#39;) : &#39;json&#39;); |
| k | const | 364 | no | const k = await loadKnowledge(session, { maxEntities: opts.limit }); |
| text | variable | 366 | no | let text; |
| lines | const | 370 | no | const lines = [{ kind: &#39;session&#39;, id: session.id, status, exportedAt: new Date().toISOString() }]; |
| counts | const | 377 | no | const counts = {}; for (const e of entities) counts[e.type] = (counts[e.type] ?? 0) + 1; |
| typeRows | const | 378 | no | const typeRows = (model.types ?? []).map((t) =&gt; [t.name, t.key ? `${t.key.field}${t.key.weak ? &#39; (weak)&#39; : &#39;&#39;}` : &#39;(keyless)&#39;, t.support, t.confidence, counts[t.id] ?? 0]); |
| entRows | const | 379 | no | const entRows = entities.slice(0, opts.maxRows ?? 500).map((e) =&gt; [e.eid, e.typeName ?? e.type, e.key ?? &#39;&#39;, e.observations ?? &#39;&#39;, clip(JSON.stringify(e.attrs ?? {}), 160)]); |
| relRows | const | 380 | no | const relRows = (model.relationships ?? []).map((r) =&gt; [r.kind, r.from, r.to, r.field ?? &#39;&#39;, r.confidence ?? &#39;&#39;]); |
| tbl | function | 382 | no | const tbl = (h, rows) =&gt; `\| ${h.join(&#39; \| &#39;)} \|\\n\| ${h.map(() =&gt; &#39;---&#39;).join(&#39; \| &#39;)} \|\\n${rows.map((r) =&gt; `\| ${r.map((c) =&gt; mdCell(c, 160)).join(&#39; \| &#39;)} \|`).join(&#39;\\n&#39;)}`; |
| res | const | 396 | no | const res = await writeText(outFile, text, { format }); |
| exportGraph | function | 403 | yes | export async function exportGraph(session, outFile, opts = {}) { |
| format | const | 404 | no | const format = opts.format ?? { &#39;.dot&#39;: &#39;dot&#39;, &#39;.gv&#39;: &#39;dot&#39;, &#39;.mmd&#39;: &#39;mermaid&#39;, &#39;.mermaid&#39;: &#39;mermaid&#39;, &#39;.graphml&#39;: &#39;graphml&#39;, &#39;.json&#39;: &#39;json&#39; }[path.extname(outFile ?? &#39;&#39;).toLowerCase()] ?? &#39;json&#39;; |
| graph | const | 406 | no | const graph = session.kv.get(&#39;GRAPH&#39;, null); |
| maxNodes | const | 408 | no | const maxNodes = opts.maxNodes ?? 500; |
| edges | variable | 409 | no | let edges = (graph.edges ?? []).filter((e) =&gt; (!opts.kind \|\| e.kind === opts.kind) &amp;&amp; (!opts.status \|\| e.status === opts.status) &amp;&amp; (opts.minConfidence === undefined \|\| e.confidence &gt;= opts.minConfid… |
| nodeMap | const | 411 | no | const nodeMap = new Map((graph.nodes ?? []).map((n) =&gt; [n.eid, n])); |
| used | const | 412 | no | const used = new Set(); |
| keptEdges | const | 413 | no | const keptEdges = []; |
| add | const | 415 | no | const add = [e.from, e.to].filter((id) =&gt; !used.has(id)); |
| label | function | 421 | no | const label = (id) =&gt; { const n = nodeMap.get(id); return n ? `${n.typeName ?? &#39;entity&#39;}${n.key !== null &amp;&amp; n.key !== undefined ? `: ${clip(n.key, 24)}` : &#39;&#39;}` : id; }; |
| text | variable | 422 | no | let text; |
| q | function | 426 | no | const q = (s) =&gt; `&quot;${String(s).replace(/\\\\/g, &#39;\\\\\\\\&#39;).replace(/&quot;/g, &#39;\\\\&quot;&#39;)}&quot;`; |
| ids | const | 431 | no | const ids = new Map([...used].map((id, i) =&gt; [id, `n${i}`])); |
| m | function | 432 | no | const m = (s) =&gt; String(s).replace(/[&quot;\\n\\r]/g, &#39; &#39;); |
| x | const | 436 | no | const x = escapeHtml; |
| res | const | 445 | no | const res = await writeText(outFile, text, { format }); |
| exportReport | function | 452 | yes | export async function exportReport(session, outFile) { |
| m | const | 453 | no | const m = session.meta; |
| receipt | const | 454 | no | const receipt = session.kv.get(&#39;RECEIPT&#39;, null); |
| shapes | const | 455 | no | const shapes = session.kv.get(&#39;SHAPES&#39;, null); |
| model | const | 456 | no | const model = session.kv.get(&#39;MODEL&#39;, null); |
| status | const | 457 | no | const status = session.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| streams | const | 458 | no | const streams = existsSync(session.dataset(&#39;streams&#39;).file) ? await session.dataset(&#39;streams&#39;).toArray(200) : []; |
| kv | function | 459 | no | const kv = (obj) =&gt; `&lt;table&gt;&lt;tbody&gt;${Object.entries(obj ?? {}).map(([k, v]) =&gt; `&lt;tr&gt;&lt;th&gt;${escapeHtml(k)}&lt;/th&gt;&lt;td&gt;${escapeHtml(clip(typeof v === &#39;object&#39; ? JSON.stringify(v) : v, 600))}&lt;/td&gt;&lt;/tr&gt;`).jo… |
| parts | const | 460 | no | const parts = [ |
| sha256File | function | 481 | no | const sha256File = (file) =&gt; createHash(&#39;sha256&#39;).update(readFileSync(file)).digest(&#39;hex&#39;); |
| exportBundle | function | 483 | yes | export async function exportBundle(session, outDir, opts = {}) { |
| format | const | 484 | no | const format = opts.format ?? &#39;jsonl&#39;; |
| root | const | 486 | no | const root = path.resolve(outDir); |
| exclude | const | 488 | no | const exclude = new Set(opts.exclude ?? []); |
| files | const | 489 | no | const files = []; |
| note | function | 490 | no | const note = (rel, extra = {}) =&gt; { const full = path.join(root, rel); files.push({ file: rel.replaceAll(&#39;\\\\&#39;, &#39;/&#39;), bytes: statSync(full).size, sha256: sha256File(full), ...extra }); }; |
| skipped | const | 491 | no | const skipped = []; |
| receipt | const | 494 | no | const receipt = session.kv.get(&#39;RECEIPT&#39;, null); |
| rel | const | 499 | no | const rel = path.join(&#39;datasets&#39;, `${d.name}.${format === &#39;ndjson&#39; ? &#39;jsonl&#39; : format}`); |
| manifest | const | 517 | no | const manifest = { schema: &#39;capture-studio.bundle/1&#39;, session: session.id, exportedAt: new Date().toISOString(), datasetFormat: format, rawIncluded: !!opts.includeRaw, files, skipped }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 6 | external |
| node:crypto | import | 7 | external |
| node:path | import | 8 | external |
| ../capture/redact.mjs | import | 9 | [studio/src/capture/redact.mjs](../capture/redact.mjs.md) |
| ../security/patterns.mjs | import | 10 | [studio/src/security/patterns.mjs](../security/patterns.mjs.md) |
| ./schemas.mjs | import | 11 | [studio/src/export/schemas.mjs](./schemas.mjs.md) |
| ./graph-ranked.mjs | import | 12 | [studio/src/export/graph-ranked.mjs](./graph-ranked.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/export/export.mjs |
| [studio/bin/commands/export.mjs](../../bin/commands/export.mjs.md) | ../../src/export/export.mjs |
| [studio/bin/commands/knowledge.mjs](../../bin/commands/knowledge.mjs.md) | ../../src/export/export.mjs |
| [studio/bin/commands/profiles.mjs](../../bin/commands/profiles.mjs.md) | ../../src/export/export.mjs |
| [studio/bin/commands/sessions.mjs](../../bin/commands/sessions.mjs.md) | ../../src/export/export.mjs |
| [studio/src/export/graph-ranked.mjs](./graph-ranked.mjs.md) | ./export.mjs |
| [studio/src/export/schemas.mjs](./schemas.mjs.md) | ./export.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../export/export.mjs |
| [studio/src/studio/world-transfer.mjs](../studio/world-transfer.mjs.md) | ../export/export.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Export layer. Dataset formats: jsonl (alias ndjson), json, csv, tsv, md, html.
// Plus: Markdown/HTML/JSON session transcript, knowledge export (types + entities + graph),
// graph export (json, dot, mermaid, graphml), a self-contained HTML session report, and a
// portable export bundle (manifest + datasets + transcript + report + knowledge).
// Every function is read-only over the session; nothing here touches raw or derived state.
import { createWriteStream, createReadStream, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { scrubText, redactUrl, redactHeaders } from '../capture/redact.mjs';
import { detectSecrets } from '../security/patterns.mjs';
import { exportSchemas } from './schemas.mjs';
import { exportGraphRanked } from './graph-ranked.mjs';
export { exportSchemas, exportGraphRanked };

export const DATASET_FORMATS = ['jsonl', 'ndjson', 'json', 'csv', 'tsv', 'md', 'html'];
export const TRANSCRIPT_FORMATS = ['md', 'html', 'json'];
export const KNOWLEDGE_FORMATS = ['json', 'ndjson', 'md', 'html'];
export const GRAPH_FORMATS = ['json', 'dot', 'mermaid', 'graphml'];
const EXT_FORMAT = { '.jsonl': 'jsonl', '.ndjson': 'jsonl', '.json': 'json', '.csv': 'csv', '.tsv': 'tsv', '.md': 'md', '.markdown': 'md', '.html': 'html', '.htm': 'html' };

export class ExportError extends Error {
  constructor(message, code = 'EXPORT_ERROR', extra = {}) { super(message); this.name = 'ExportError'; this.code = code; Object.assign(this, extra); }
}

export function inferFormat(file, fallback = 'jsonl') {
  if (!file || file === '-') return fallback;
  return EXT_FORMAT[path.extname(file).toLowerCase()] ?? fallback;
}

// ---------------------------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------------------------
export function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length <= 30) flatten(v, key, out);
    else out[key] = Array.isArray(v) || (v && typeof v === 'object') ? JSON.stringify(v) : v;
  }
  return out;
}
const csvCell = (v, sep = ',') => {
  if (v === undefined || v === null) return '';
  const s = String(v);
  if (sep === '\t') return s.replace(/[\t\r\n]+/g, ' ');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mdCell = (v, max = 200) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, max);
const clip = (v, max) => { const s = String(v ?? ''); return s.length > max ? `${s.slice(0, max)}…` : s; };

function deepGet(obj, p) {
  let cur = obj;
  for (const part of String(p).split('.')) { if (cur === null || cur === undefined) return undefined; cur = cur[part]; }
  return cur;
}
function project(row, fields) {
  const flat = flatten(row);
  const out = {};
  for (const f of fields) out[f] = flat[f] !== undefined ? flat[f] : deepGet(row, f);
  return out;
}

async function countLines(file) {
  let n = 0;
  for await (const chunk of createReadStream(file)) for (let i = 0; i < chunk.length; i++) if (chunk[i] === 0x0a) n++;
  return n;
}

// ---------------------------------------------------------------------------------------------
// Sinks (file or stdout or in-memory), with backpressure.
// ---------------------------------------------------------------------------------------------
export function openSink(outFile) {
  if (outFile === '-' || outFile === undefined || outFile === null) {
    return {
      path: '-',
      write: (s) => new Promise((resolve) => { if (process.stdout.write(s)) resolve(); else process.stdout.once('drain', resolve); }),
      end: async () => {},
    };
  }
  mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
```

_First 80 of 521 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
