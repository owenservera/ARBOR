# File: studio/src/intel/platform.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/platform.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 20764 B |
| Lines | 561 |
| Hash | c992c1d72561 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TEXT_FIELD | const | 16 | no | const TEXT_FIELD = /text\|content\|body\|message\|prompt\|response\|caption\|title\|html\|markdown\|transcript/i; |
| FORMAT_NAMES | const | 17 | no | const FORMAT_NAMES = Object.freeze([&#39;json&#39;, &#39;ndjson&#39;, &#39;sse&#39;, &#39;csv&#39;, &#39;html&#39;, &#39;xml&#39;, &#39;yaml&#39;]); |
| BUILTIN_MIGRATION | const | 18 | no | const BUILTIN_MIGRATION = &#39;builtin:v1-&gt;v2&#39;; |
| builtinsReady | variable | 20 | no | let builtinsReady = false; |
| emptyGraph | function | 22 | no | function emptyGraph() { |
| emptyDedupe | function | 26 | no | function emptyDedupe() { |
| emptyAnalysis | function | 30 | no | function emptyAnalysis() { |
| emptyDetect | function | 40 | no | function emptyDetect(text = &#39;&#39;) { |
| emptyCsv | function | 54 | no | function emptyCsv() { |
| emptyStats | function | 58 | no | function emptyStats(dataDir = &#39;&#39;) { |
| limitOf | function | 71 | no | function limitOf(value, fallback) { |
| n | const | 72 | no | const n = Number(value); |
| tokenize | function | 77 | no | function tokenize(input) { |
| tokens | const | 78 | no | const tokens = []; |
| kvGet | function | 85 | no | function kvGet(session, key) { |
| sidOf | function | 94 | no | function sidOf(entity) { |
| sid | const | 95 | no | const sid = entity?.anchor?.sid ?? entity?.sid ?? entity?.occurrences?.[0]?.sid ?? null; |
| entityText | function | 99 | no | function entityText(entity) { |
| attrs | const | 102 | no | const attrs = entity.attrs &amp;&amp; typeof entity.attrs === &#39;object&#39; |
| preferred | const | 108 | no | const preferred = []; |
| longest | variable | 109 | no | let longest = &#39;&#39;; |
| text | const | 112 | no | const text = value.trim(); |
| pushText | function | 121 | no | function pushText(rows, seen, row, max) { |
| text | const | 122 | no | const text = String(row?.text ?? &#39;&#39;).trim(); |
| id | variable | 124 | no | let id = String(row.id ?? `t${rows.length + 1}`); |
| modelEntities | function | 130 | no | function modelEntities(model) { |
| out | const | 133 | no | const out = []; |
| savedModel | function | 143 | no | async function savedModel(session) { |
| loaded | const | 148 | no | const loaded = await loadArtifacts(session); |
| datasetEntities | function | 156 | no | async function datasetEntities(session, max) { |
| rows | const | 157 | no | const rows = []; |
| seen | const | 158 | no | const seen = new Set(); |
| ds | variable | 160 | no | let ds; |
| domAndAssembled | function | 172 | no | function domAndAssembled(session, max) { |
| rows | const | 173 | no | const rows = []; |
| seen | const | 174 | no | const seen = new Set(); |
| turns | const | 175 | no | const turns = kvGet(session, &#39;DOM_TURNS&#39;); |
| assembled | const | 181 | no | const assembled = kvGet(session, &#39;ASSEMBLED&#39;); |
| found | const | 184 | no | const found = []; |
| collectStrings | function | 194 | no | function collectStrings(value, out, depth) { |
| list | const | 201 | no | const list = Array.isArray(value) ? value : Object.values(value); |
| idOfNode | function | 205 | no | function idOfNode(node) { |
| raw | const | 208 | no | const raw = node.eid ?? node.id ?? node.name ?? null; |
| graphFromValue | function | 212 | no | function graphFromValue(value) { |
| sourceNodes | const | 214 | no | const sourceNodes = value.nodes ?? value.graph?.nodes; |
| sourceEdges | const | 215 | no | const sourceEdges = value.edges ?? value.graph?.edges; |
| nodes | const | 217 | no | const nodes = []; |
| seen | const | 218 | no | const seen = new Set(); |
| id | const | 220 | no | const id = idOfNode(node); |
| edges | const | 225 | no | const edges = []; |
| to | const | 229 | no | const to = idOfNode(edge.to ?? edge.target); |
| raw | const | 233 | no | const raw = edge.weight !== undefined ? edge.weight : edge.confidence; |
| weight | const | 234 | no | const weight = typeof raw === &#39;number&#39; ? raw : Number(raw); |
| sized | function | 242 | no | function sized(groups) { |
| newlineOf | function | 246 | no | function newlineOf(text) { |
| lf | variable | 247 | no | let lf = 0; |
| crlf | variable | 248 | no | let crlf = 0; |
| cr | variable | 249 | no | let cr = 0; |
| ch | const | 251 | no | const ch = text[i]; |
| kinds | const | 257 | no | const kinds = (lf &gt; 0 ? 1 : 0) + (crlf &gt; 0 ? 1 : 0) + (cr &gt; 0 ? 1 : 0); |
| hasBom | function | 263 | no | function hasBom(text, evidence) { |
| csvDelimiter | function | 268 | no | function csvDelimiter(kind, evidence, text) { |
| tag | const | 270 | no | const tag = (evidence ?? []).find((item) =&gt; String(item).startsWith(&#39;csv:&#39;)); |
| migrationNames | function | 276 | no | function migrationNames() { |
| listed | const | 279 | no | const listed = migrations.list(); |
| ensureBuiltins | function | 287 | no | function ensureBuiltins() { |
| layoutOf | function | 298 | no | function layoutOf(input) { |
| env | variable | 299 | no | let env = process.env; |
| flags | variable | 300 | no | let flags = {}; |
| explicit | variable | 301 | no | let explicit = null; |
| root | const | 311 | no | const root = typeof explicit === &#39;string&#39; &amp;&amp; explicit ? explicit : defaultDataDir(env); |
| paths | const | 312 | no | const paths = dataPaths(root); |
| sessionTexts | function | 317 | yes | export async function sessionTexts(session, options = {}) { |
| max | const | 319 | no | const max = limitOf(options?.max, 3000); |
| rows | const | 321 | no | const rows = []; |
| seen | const | 322 | no | const seen = new Set(); |
| sessionGraph | function | 338 | yes | export async function sessionGraph(session) { |
| temporal | const | 340 | no | const temporal = kvGet(session, &#39;GRAPH&#39;) ?? session?.graph ?? session?.artifacts?.graph ?? null; |
| built | const | 341 | no | const built = graphFromValue(temporal); |
| ranked | variable | 343 | no | let ranked = kvGet(session, &#39;GRAPH_RANKED&#39;) ?? session?.artifacts?.graphRanked ?? null; |
| loaded | const | 346 | no | const loaded = await loadArtifacts(session); |
| dedupeSession | function | 356 | yes | export async function dedupeSession(session, options = {}) { |
| max | const | 358 | no | const max = limitOf(options?.max, 3000); |
| threshold | const | 359 | no | const threshold = Number.isFinite(Number(options?.threshold)) ? Math.min(1, Math.max(0, Number(options.threshold))) : 0.8; |
| texts | const | 360 | no | const texts = await sessionTexts(session, { max }); |
| items | const | 361 | no | const items = []; |
| tokens | const | 363 | no | const tokens = tokenize(row.text); |
| found | const | 368 | no | const found = items.length ? lshClusters(items, { threshold }) : []; |
| clusters | const | 369 | no | const clusters = found.map((members, index) =&gt; ({ id: `c${index + 1}`, members, size: members.length })); |
| itemsInClusters | const | 370 | no | const itemsInClusters = clusters.reduce((sum, cluster) =&gt; sum + cluster.size, 0); |
| itemCount | const | 371 | no | const itemCount = items.length; |
| analyzeSessionGraph | function | 387 | yes | export async function analyzeSessionGraph(session) { |
| graph | const | 389 | no | const graph = await sessionGraph(session); |
| analytics | const | 390 | no | const analytics = graphAnalytics(graph); |
| rank | const | 391 | no | const rank = pagerank(graph.nodes, graph.edges); |
| center | const | 392 | no | const center = betweenness(graph.nodes, graph.edges); |
| parts | const | 393 | no | const parts = components(graph.nodes, graph.edges); |
| comm | const | 394 | no | const comm = communities(graph.nodes, graph.edges); |
| n | const | 395 | no | const n = analytics.nodes; |
| edges | const | 396 | no | const edges = analytics.edges; |
| keyphrasesSession | function | 416 | yes | export async function keyphrasesSession(session, options = {}) { |
| limit | const | 418 | no | const limit = limitOf(options?.limit, 20); |
| texts | const | 419 | no | const texts = await sessionTexts(session, { max: 3000 }); |
| body | variable | 420 | no | let body = &#39;&#39;; |
| next | const | 423 | no | const next = body ? `\\n${row.text}` : row.text; |
| detectAndScan | function | 433 | yes | export async function detectAndScan(text) { |
| source | const | 434 | no | const source = typeof text === &#39;string&#39; ? text : text == null ? &#39;&#39; : String(text); |
| detected | const | 436 | no | const detected = detectContent(source) ?? {}; |
| evidence | const | 437 | no | const evidence = Array.isArray(detected.evidence) ? detected.evidence : []; |
| format | const | 438 | no | const format = typeof detected.kind === &#39;string&#39; ? detected.kind : &#39;text&#39;; |
| hits | const | 439 | no | const hits = detectSecrets(source, { extended: true, pii: true }); |
| counts | const | 440 | no | const counts = {}; |
| matches | const | 441 | no | const matches = []; |
| name | const | 443 | no | const name = String(hit?.name ?? &#39;secret&#39;); |
| csvAnalyze | function | 463 | yes | export async function csvAnalyze(text) { |
| source | const | 465 | no | const source = typeof text === &#39;string&#39; ? text : &#39;&#39;; |
| sniffed | const | 467 | no | const sniffed = sniffDelimiter(source); |
| delimiter | const | 468 | no | const delimiter = sniffed?.delimiter \|\| &#39;,&#39;; |
| matrix | const | 469 | no | const matrix = parseCsv(source, { delimiter }); |
| score | const | 470 | no | const score = headerLikelihood(matrix); |
| parsed | const | 471 | no | const parsed = csvToObjects(source, { delimiter }); |
| header | const | 472 | no | const header = Array.isArray(parsed?.columns) ? parsed.columns : []; |
| records | const | 473 | no | const records = Array.isArray(parsed?.rows) ? parsed.rows.slice(0, 200) : []; |
| platformStats | function | 486 | yes | export async function platformStats(dataDirOrCtx) { |
| layout | variable | 487 | no | let layout = { dataDir: &#39;&#39;, sessionsDir: &#39;&#39; }; |
| listed | const | 490 | no | const listed = listSessions(layout.sessionsDir); |
| integrity | const | 491 | no | const integrity = { checked: 0, ok: 0, failed: 0 }; |
| knowledge | const | 492 | no | const knowledge = { sessions: 0, derived: 0, failed: 0, entities: 0, types: 0 }; |
| id | const | 494 | no | const id = meta?.id; |
| dir | const | 496 | no | const dir = path.join(layout.sessionsDir, id); |
| report | const | 500 | no | const report = verifyManifest(dir); |
| session | variable | 507 | no | let session = null; |
| manifest | const | 511 | no | const manifest = kvGet(session, &#39;DERIVE_MANIFEST&#39;); |
| model | const | 512 | no | const model = kvGet(session, &#39;MODEL&#39;); |
| status | const | 513 | no | const status = kvGet(session, &#39;KNOWLEDGE_STATUS&#39;); |
| failed | const | 515 | no | const failed = status?.status === &#39;failed&#39; \|\| !!model?.error \|\| (manifest != null &amp;&amp; manifest.ok === false); |
| registrySnapshot | function | 537 | yes | export async function registrySnapshot() { |
| snap | const | 540 | no | const snap = registry.snapshot(); |
| kinds | const | 541 | no | const kinds = {}; |
| meta | const | 546 | no | const meta = entry?.meta &amp;&amp; typeof entry.meta === &#39;object&#39; ? entry.meta : {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../config.mjs | import | 4 | [studio/src/config.mjs](../config.mjs.md) |
| ../decode/csv.mjs | import | 5 | [studio/src/decode/csv.mjs](../decode/csv.mjs.md) |
| ./autodetect.mjs | import | 6 | [studio/src/intel/autodetect.mjs](./autodetect.mjs.md) |
| ./graph-analytics.mjs | import | 7 | [studio/src/intel/graph-analytics.mjs](./graph-analytics.mjs.md) |
| ./rank.mjs | import | 8 | [studio/src/intel/rank.mjs](./rank.mjs.md) |
| ../profiles/migrations.mjs | import | 9 | [studio/src/profiles/migrations.mjs](../profiles/migrations.mjs.md) |
| ../plugins/registry.mjs | import | 10 | [studio/src/plugins/registry.mjs](../plugins/registry.mjs.md) |
| ../replay/derive-all.mjs | import | 11 | [studio/src/replay/derive-all.mjs](../replay/derive-all.mjs.md) |
| ../security/patterns.mjs | import | 12 | [studio/src/security/patterns.mjs](../security/patterns.mjs.md) |
| ../store/integrity.mjs | import | 13 | [studio/src/store/integrity.mjs](../store/integrity.mjs.md) |
| ../store/session.mjs | import | 14 | [studio/src/store/session.mjs](../store/session.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/selftest.mjs](../../bin/commands/selftest.mjs.md) | ../../src/intel/platform.mjs |
| [studio/src/studio/platform-x.mjs](../studio/platform-x.mjs.md) | ../intel/platform.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Read-only platform views over a saved session. Never throws: missing data is an empty shape.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { VERSION, dataPaths, defaultDataDir, resolveSettings } from '../config.mjs';
import { csvToObjects, headerLikelihood, parseCsv, sniffDelimiter } from '../decode/csv.mjs';
import { detectContent } from './autodetect.mjs';
import { betweenness, communities, components, graphAnalytics, pagerank, topK } from './graph-analytics.mjs';
import { lshClusters, rake, simhash } from './rank.mjs';
import { migrations } from '../profiles/migrations.mjs';
import { registry } from '../plugins/registry.mjs';
import { loadArtifacts } from '../replay/derive-all.mjs';
import { detectSecrets, registerPatterns } from '../security/patterns.mjs';
import { verifyManifest } from '../store/integrity.mjs';
import { Session, listSessions } from '../store/session.mjs';

const TEXT_FIELD = /text|content|body|message|prompt|response|caption|title|html|markdown|transcript/i;
const FORMAT_NAMES = Object.freeze(['json', 'ndjson', 'sse', 'csv', 'html', 'xml', 'yaml']);
const BUILTIN_MIGRATION = 'builtin:v1->v2';

let builtinsReady = false;

function emptyGraph() {
  return { nodes: [], edges: [] };
}

function emptyDedupe() {
  return { scanned: 0, clusters: [], stats: { items: 0, clusters: 0, itemsInClusters: 0, wastedShare: 0 } };
}

function emptyAnalysis() {
  return {
    stats: { nodes: 0, edges: 0, density: 0, components: 0, communities: 0, largestComponent: 0 },
    pagerank: { ranked: [], iterations: 0, converged: true },
    betweenness: { ranked: [], sampled: false },
    communities: [],
    components: [],
  };
}

function emptyDetect(text = '') {
  return {
    format: 'text',
    encoding: 'utf-8',
    hasBOM: false,
    newline: 'none',
    delimiter: null,
    candidates: [],
    evidence: [],
    text: String(text ?? '').slice(0, 2000),
    securityScan: { counts: {}, matches: [] },
  };
}

function emptyCsv() {
  return { delimiter: null, header: [], records: [], stats: { rows: 0, columns: 0 }, headerScore: { isHeader: false, score: 0 } };
}

function emptyStats(dataDir = '') {
  return {
    schema: 'capture-studio.platform-stats/1',
    version: typeof VERSION === 'string' ? VERSION : '',
    schemaVersion: 2,
    dataDir,
    sessions: 0,
    integrity: { checked: 0, ok: 0, failed: 0 },
    knowledge: { sessions: 0, derived: 0, failed: 0, entities: 0, types: 0 },
    migrations: migrationNames(),
  };
}

function limitOf(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function tokenize(input) {
  const tokens = [];
  for (const token of String(input ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (token) tokens.push(token);
```

_First 80 of 562 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
