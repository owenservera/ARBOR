# File: hq/lib/kb.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/kb.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 43224 B |
| Lines | 1185 |
| Hash | 3aafaccd2d3d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KB_SCHEMA | const | 21 | yes | export const KB_SCHEMA = &#39;hq.kb/1&#39;; |
| KINDS | const | 24 | no | const KINDS = [&#39;doc&#39;, &#39;decision&#39;, &#39;canon&#39;, &#39;session&#39;, &#39;note&#39;, &#39;wiki&#39;]; |
| CAPABILITY_KIND | const | 28 | no | const CAPABILITY_KIND = &#39;capability&#39;; |
| VIVIM_KIND | const | 35 | no | const VIVIM_KIND = &#39;vivim&#39;; |
| KIND_ALIASES | const | 37 | no | const KIND_ALIASES = new Map([ [&#39;doc&#39;, &#39;doc&#39;], [&#39;document&#39;, &#39;doc&#39;], [&#39;documents&#39;, &#39;doc&#39;], [&#39;decision&#39;, &#39;decision&#39;], [&#39;decisions&#39;, &#39;decision&#39;], [&#39;canon&#39;, &#39;canon&#39;], [&#39;canon_term&#39;, &#39;canon&#39;], [&#39;canon_ter… |
| SOURCE_TABLES | const | 52 | no | const SOURCE_TABLES = { |
| MAX_ROWS | const | 61 | no | const MAX_ROWS = 5000; // rows read per source |
| MAX_LIMIT | const | 62 | no | const MAX_LIMIT = 5000; // upper bound for limit |
| MAX_DEPTH | const | 63 | no | const MAX_DEPTH = 6; // upper bound for graph depth |
| FTS_LIMIT | const | 64 | no | const FTS_LIMIT = 2000; // rows pulled from an FTS table per query |
| BODY_CAP | const | 65 | no | const BODY_CAP = 4000; // characters of body text kept per node |
| SNIPPET_CAP | const | 66 | no | const SNIPPET_CAP = 200; // characters of snippet returned per result |
| kbError | function | 71 | no | function kbError(code, message) { |
| error | const | 72 | no | const error = new Error(`${code}: ${message}`); |
| cmp | function | 77 | no | function cmp(a, b) { |
| left | const | 78 | no | const left = String(a ?? &#39;&#39;); |
| right | const | 79 | no | const right = String(b ?? &#39;&#39;); |
| toInt | function | 83 | no | function toInt(value, fallback, min, max) { |
| n | const | 84 | no | const n = Number(value); |
| tableExists | function | 89 | no | function tableExists(db, name) { |
| row | const | 91 | no | const row = db.prepare( &quot;SELECT name FROM sqlite_master WHERE name = ? AND type IN (&#39;table&#39;,&#39;view&#39;)&quot;, ).get(name); |
| safeAll | function | 100 | no | function safeAll(db, sql, params = []) { |
| safeGet | function | 108 | no | function safeGet(db, sql, params = []) { |
| parseList | function | 116 | no | function parseList(value) { |
| parsed | const | 117 | no | const parsed = safeJsonParse(value, null); |
| escapeLike | function | 121 | no | function escapeLike(value) { |
| sameProject | function | 125 | no | function sameProject(left, right) { |
| pathKey | function | 130 | no | function pathKey(project, path) { |
| searchTokens | function | 136 | no | function searchTokens(query) { |
| out | const | 137 | no | const out = new Set(); |
| DOC_SQL | const | 149 | no | const DOC_SQL = ` |
| DECISION_SQL | const | 161 | no | const DECISION_SQL = ` |
| CANON_SQL | const | 173 | no | const CANON_SQL = ` |
| SESSION_SQL | const | 185 | no | const SESSION_SQL = ` |
| NOTE_SQL | const | 197 | no | const NOTE_SQL = ` |
| WIKI_SQL | const | 208 | no | const WIKI_SQL = ` |
| SESSION_FILES_SQL | const | 214 | no | const SESSION_FILES_SQL = ` |
| sourceState | function | 220 | no | function sourceState(db) { |
| present | const | 221 | no | const present = new Set(); |
| missing | const | 222 | no | const missing = []; |
| table | const | 224 | no | const table = SOURCE_TABLES[kind]; |
| docNodeId | function | 231 | no | function docNodeId(row) { |
| project | const | 232 | no | const project = row.project_name ?? (row.project_id == null ? &#39;?&#39; : `#${row.project_id}`); |
| textOf | function | 236 | no | function textOf(...parts) { |
| docNode | function | 244 | no | function docNode(row) { |
| binds | const | 245 | no | const binds = parseList(row.binds_to) |
| title | const | 252 | no | const title = row.title \|\| row.path; |
| decisionNode | function | 278 | no | function decisionNode(row) { |
| title | const | 279 | no | const title = row.title \|\| row.id; |
| canonNode | function | 308 | no | function canonNode(row) { |
| title | const | 309 | no | const title = row.term \|\| row.id; |
| sessionNode | function | 339 | no | function sessionNode(row) { |
| title | const | 340 | no | const title = row.title \|\| row.id; |
| noteNode | function | 367 | no | function noteNode(row) { |
| evidence | const | 368 | no | const evidence = parseList(row.evidence); |
| title | const | 369 | no | const title = row.key \|\| String(row.text ?? &#39;&#39;).slice(0, 80); |
| wikiNode | function | 392 | no | function wikiNode(row) { |
| loadModel | function | 408 | no | function loadModel(db, { kinds = null } = {}) { |
| state | const | 409 | no | const state = sourceState(db); |
| want | function | 410 | no | const want = (kind) =&gt; !kinds \|\| kinds.includes(kind); |
| nodes | const | 411 | no | const nodes = new Map(); |
| docByPath | const | 412 | no | const docByPath = new Map(); |
| docByPathAny | const | 413 | no | const docByPathAny = new Map(); |
| sourceByPath | const | 414 | no | const sourceByPath = new Map(); |
| add | function | 416 | no | const add = (node) =&gt; { |
| key | const | 420 | no | const key = pathKey(node.project, node.data.path); |
| any | const | 422 | no | const any = pathKey(&#39;&#39;, node.data.path); |
| list | const | 423 | no | const list = docByPathAny.get(any) ?? []; |
| source | const | 429 | no | const source = node.data.source_path; |
| key | const | 431 | no | const key = String(source).toLowerCase(); |
| list | const | 432 | no | const list = sourceByPath.get(key) ?? []; |
| sessionFiles | const | 457 | no | const sessionFiles = []; |
| model | const | 464 | no | const model = { nodes, docByPath, docByPathAny, sourceByPath, sessionFiles, state }; |
| stripLineSuffix | function | 472 | no | function stripLineSuffix(ref) { |
| resolveDocByPath | function | 477 | no | function resolveDocByPath(model, project, path) { |
| direct | const | 478 | no | const direct = model.docByPath.get(pathKey(project, path)); |
| any | const | 480 | no | const any = model.docByPathAny.get(pathKey(&#39;&#39;, path)) ?? []; |
| evidenceRefs | function | 484 | no | function evidenceRefs(evidence) { |
| out | const | 485 | no | const out = []; |
| ref | const | 489 | no | const ref = entry.ref ?? entry.path ?? entry.id ?? entry.source ?? null; |
| resolveRef | function | 496 | no | function resolveRef(model, project, ref) { |
| text | const | 497 | no | const text = String(ref ?? &#39;&#39;).trim(); |
| colon | const | 500 | no | const colon = text.indexOf(&#39;:&#39;); |
| prefix | const | 502 | no | const prefix = text.slice(0, colon).toLowerCase(); |
| suffix | const | 505 | no | const suffix = text.slice(colon + 1); |
| buildEdges | function | 515 | no | function buildEdges(model) { |
| edges | const | 516 | no | const edges = []; |
| push | function | 517 | no | const push = (from, to, kind) =&gt; { |
| target | const | 526 | no | const target = model.docByPath.get(pathKey(node.project, bind.path)); |
| target | const | 532 | no | const target = model.docByPath.get(pathKey(node.project, node.data.source_path)); |
| session | const | 538 | no | const session = model.nodes.get(`session:${file.session_id}`); |
| target | const | 540 | no | const target = resolveDocByPath(model, session.project, file.path); |
| target | const | 547 | no | const target = resolveRef(model, node.project, ref); |
| sortEdges | function | 555 | no | function sortEdges(edges) { |
| seen | const | 556 | no | const seen = new Set(); |
| out | const | 557 | no | const out = []; |
| key | const | 559 | no | const key = `${edge.from}\\0${edge.to}\\0${edge.kind}`; |
| LIKE_SOURCES | const | 571 | no | const LIKE_SOURCES = { |
| likeClause | function | 599 | no | function likeClause(columns, tokens) { |
| parts | const | 600 | no | const parts = []; |
| params | const | 601 | no | const params = []; |
| needle | const | 603 | no | const needle = `%${escapeLike(token)}%`; |
| ftsExpression | function | 611 | no | function ftsExpression(tokens) { |
| parts | const | 612 | no | const parts = tokens |
| likeCandidates | function | 618 | no | function likeCandidates(db, model, tokens, kinds) { |
| found | const | 619 | no | const found = new Set(); |
| source | const | 621 | no | const source = LIKE_SOURCES[kind]; |
| rows | const | 625 | no | const rows = safeAll(db, `${source.sql} WHERE ${where} LIMIT ${MAX_ROWS}`, params); |
| node | const | 628 | no | const node = model.nodes.get(docNodeId({ project_id: row.project_id, path: row.path, project_name: row.project_name ?? null, })); |
| node | const | 636 | no | const node = model.nodes.get(`${kind}:${row.id}`); |
| ftsCandidates | function | 643 | no | function ftsCandidates(db, model, tokens, kinds) { |
| found | const | 644 | no | const found = new Set(); |
| expression | const | 645 | no | const expression = ftsExpression(tokens); |
| rows | const | 649 | no | const rows = safeAll( db, &#39;SELECT path AS path, project AS project FROM content_fts WHERE content_fts MATCH ? LIMIT ?&#39;, [expression, FTS_LIMIT], ); |
| path | const | 655 | no | const path = row.path == null ? &#39;&#39; : String(row.path); |
| project | const | 656 | no | const project = row.project == null ? null : String(row.project); |
| direct | const | 657 | no | const direct = model.docByPath.get(pathKey(project, path)); |
| any | const | 659 | no | const any = model.docByPathAny.get(pathKey(&#39;&#39;, path)) ?? []; |
| node | const | 662 | no | const node = model.nodes.get(id); |
| rows | const | 671 | no | const rows = safeAll( db, &#39;SELECT session_id AS session_id FROM session_fts WHERE session_fts MATCH ? LIMIT ?&#39;, [expression, FTS_LIMIT], ); |
| id | const | 677 | no | const id = row.session_id == null ? &#39;&#39; : String(row.session_id); |
| capabilityTables | function | 688 | no | function capabilityTables(db) { |
| capabilityExpression | function | 696 | no | function capabilityExpression(tokens) { |
| terms | const | 697 | no | const terms = tokens |
| capabilitySql | function | 703 | no | function capabilitySql(hasSource) { |
| capabilityScore | function | 718 | no | function capabilityScore(title, snippet, tokens) { |
| head | const | 719 | no | const head = title.toLowerCase(); |
| body | const | 720 | no | const body = snippet.toLowerCase(); |
| score | variable | 721 | no | let score = 1; // an FTS5 MATCH is a real hit; keep it visible and deterministic |
| capabilityResults | function | 731 | no | function capabilityResults(db, tokens, max, project) { |
| expression | const | 733 | no | const expression = capabilityExpression(tokens); |
| rows | const | 735 | no | const rows = safeAll(db, capabilitySql(tableExists(db, &#39;capability_source&#39;)), [expression, max]); |
| out | const | 736 | no | const out = []; |
| path | const | 739 | no | const path = String(row.path ?? &#39;&#39;); |
| title | const | 740 | no | const title = String(row.title \|\| path); |
| snippet | const | 741 | no | const snippet = String(row.snippet ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim().slice(0, SNIPPET_CAP); |
| sourceId | const | 742 | no | const sourceId = String(row.source_id ?? &#39;&#39;); |
| vivimSpaceName | function | 767 | no | function vivimSpaceName(db) { |
| row | const | 768 | no | const row = safeGet(db, &quot;SELECT value AS value FROM meta WHERE key = &#39;vivim_space&#39;&quot;); |
| name | const | 769 | no | const name = row &amp;&amp; row.value ? String(row.value) : &#39;&#39;; |
| vivimScore | function | 775 | no | function vivimScore(id, title, status, tokens) { |
| lowerId | const | 776 | no | const lowerId = String(id ?? &#39;&#39;).toLowerCase(); |
| lowerTitle | const | 777 | no | const lowerTitle = String(title ?? &#39;&#39;).toLowerCase(); |
| lowerStatus | const | 778 | no | const lowerStatus = String(status ?? &#39;&#39;).toLowerCase(); |
| score | variable | 779 | no | let score = 1; |
| vivimSnippet | function | 788 | no | function vivimSnippet(row, tokens) { |
| payload | const | 789 | no | const payload = safeJsonParse(row.payload, null) \|\| {}; |
| body | const | 790 | no | const body = textOf(payload.acceptance, payload.spec, row.title).toLowerCase(); |
| at | const | 792 | no | const at = body.indexOf(token); |
| start | const | 794 | no | const start = Math.max(0, at - 60); |
| slice | const | 796 | no | const slice = body.slice(start, start + SNIPPET_CAP).replace(/\\s+/g, &#39; &#39;).trim(); |
| vivimResults | function | 802 | no | function vivimResults(db, tokens, max, project) { |
| rows | const | 805 | no | const rows = safeAll( db, `SELECT v.kind AS kind, v.id AS id, v.title AS title, v.status AS status, v.payload AS payload FROM vivim_records v WHERE ${clause} LIMIT ${MAX_ROWS}`, params, |
| space | const | 811 | no | const space = vivimSpaceName(db); |
| out | const | 812 | no | const out = []; |
| kind | const | 815 | no | const kind = String(row.kind ?? &#39;&#39;); |
| id | const | 816 | no | const id = String(row.id ?? &#39;&#39;); |
| bodyText | function | 833 | no | function bodyText(db, node) { |
| direct | const | 835 | no | const direct = safeGet( db, &quot;SELECT c.content AS content FROM content_fts c WHERE c.path = ? AND c.project IS NOT NULL AND lower(c.project) = lower(?) LIMIT 1&quot;, [node.data.path, node.project ?? &#39;&#39;], … |
| any | const | 841 | no | const any = safeGet( db, &#39;SELECT c.content AS content FROM content_fts c WHERE c.path = ? LIMIT 1&#39;, [node.data.path], ); |
| fts | const | 849 | no | const fts = safeAll( db, &#39;SELECT text AS text FROM session_fts WHERE session_id = ? LIMIT 40&#39;, [node.data.id], ); |
| text | variable | 854 | no | let text = fts.map((row) =&gt; String(row.text ?? &#39;&#39;)).join(&#39;\\n&#39;); |
| rows | const | 856 | no | const rows = safeAll( db, &#39;SELECT m.text AS text FROM session_messages m WHERE m.session_id = ? ORDER BY m.seq ASC LIMIT 40&#39;, [node.data.id], ); |
| scoreNode | function | 868 | no | function scoreNode(node, body, tokens) { |
| title | const | 869 | no | const title = node.title.toLowerCase(); |
| summary | const | 870 | no | const summary = node.summary; |
| full | const | 871 | no | const full = body.toLowerCase(); |
| score | variable | 872 | no | let score = 0; |
| makeSnippet | function | 881 | no | function makeSnippet(node, body, tokens) { |
| title | const | 882 | no | const title = node.title; |
| summary | const | 883 | no | const summary = node.summary; |
| full | const | 884 | no | const full = body; |
| at | const | 887 | no | const at = source.toLowerCase().indexOf(token); |
| start | const | 889 | no | const start = Math.max(0, at - 60); |
| slice | const | 890 | no | const slice = source.slice(start, start + SNIPPET_CAP).trim(); |
| resolveKinds | function | 897 | no | function resolveKinds(kind) { |
| list | const | 899 | no | const list = Array.isArray(kind) ? kind : [kind]; |
| out | const | 900 | no | const out = []; |
| mapped | const | 902 | no | const mapped = KIND_ALIASES.get(String(entry ?? &#39;&#39;).trim().toLowerCase()); |
| kbQuery | function | 908 | yes | export function kbQuery(db, { query = &#39;&#39;, kind = null, project = null, limit = 30 } = {}) { |
| tokens | const | 909 | no | const tokens = searchTokens(query); |
| max | const | 911 | no | const max = toInt(limit, 30, 0, MAX_LIMIT); |
| kinds | const | 913 | no | const kinds = resolveKinds(kind); |
| model | const | 916 | no | const model = loadModel(db, { kinds }); |
| candidates | const | 917 | no | const candidates = likeCandidates(db, model, tokens, kinds); |
| results | const | 920 | no | const results = []; |
| docPaths | const | 921 | no | const docPaths = new Set(); |
| node | const | 923 | no | const node = model.nodes.get(id); |
| body | const | 926 | no | const body = bodyText(db, node); |
| score | const | 927 | no | const score = scoreNode(node, body, tokens); |
| kbNode | function | 960 | yes | export function kbNode(db, { id } = {}) { |
| nodeId | const | 961 | no | const nodeId = String(id ?? &#39;&#39;).trim(); |
| model | const | 963 | no | const model = loadModel(db, {}); |
| node | const | 964 | no | const node = model.nodes.get(nodeId); |
| edges | const | 966 | no | const edges = model.edges.filter((edge) =&gt; edge.from === nodeId \|\| edge.to === nodeId); |
| kbGraph | function | 977 | yes | export function kbGraph(db, { project = null, depth = 2, limit = 200 } = {}) { |
| maxDepth | const | 978 | no | const maxDepth = toInt(depth, 2, 0, MAX_DEPTH); |
| maxNodes | const | 979 | no | const maxNodes = toInt(limit, 200, 1, MAX_LIMIT); |
| model | const | 980 | no | const model = loadModel(db, {}); |
| state | const | 981 | no | const state = model.state; |
| seeds | const | 983 | no | const seeds = [...model.nodes.values()] |
| adjacency | const | 989 | no | const adjacency = new Map(); |
| visited | const | 998 | no | const visited = new Map(); |
| queue | const | 999 | no | const queue = []; |
| head | variable | 1006 | no | let head = 0; |
| current | const | 1008 | no | const current = queue[head++]; |
| level | const | 1009 | no | const level = visited.get(current) ?? 0; |
| ids | const | 1019 | no | const ids = [...visited.keys()].sort(cmp); |
| nodes | const | 1020 | no | const nodes = ids.map((id) =&gt; { const node = model.nodes.get(id); return { id: node.id, kind: node.kind, title: node.title, project: node.project }; }); |
| node | const | 1021 | no | const node = model.nodes.get(id); |
| edges | const | 1024 | no | const edges = sortEdges(model.edges.filter((edge) =&gt; visited.has(edge.from) &amp;&amp; visited.has(edge.to))) |
| graph | const | 1027 | no | const graph = { nodes, edges }; |
| projectRef | function | 1035 | no | function projectRef(project) { |
| kbRemember | function | 1046 | yes | export function kbRemember(db, { text, tier = &#39;now&#39;, project = null, key = null, evidence = [] } = {}) { |
| ref | const | 1047 | no | const ref = projectRef(project); |
| note | variable | 1048 | no | let note; |
| kbForget | function | 1058 | yes | export function kbForget(db, { id } = {}) { |
| noteId | const | 1059 | no | const noteId = String(id ?? &#39;&#39;).trim().replace(/^note:/, &#39;&#39;); |
| kbExport | function | 1068 | yes | export function kbExport(db, { format = &#39;json&#39; } = {}) { |
| normalized | const | 1069 | no | const normalized = String(format ?? &#39;json&#39;).trim().toLowerCase(); |
| model | const | 1073 | no | const model = loadModel(db, {}); |
| nodes | const | 1074 | no | const nodes = [...model.nodes.values()] |
| kbImport | function | 1086 | yes | export function kbImport(db, { data } = {}) { |
| parsed | const | 1087 | no | const parsed = typeof data === &#39;string&#39; ? safeJsonParse(data, null) : data; |
| nodes | const | 1088 | no | const nodes = parsed &amp;&amp; Array.isArray(parsed.nodes) ? parsed.nodes : []; |
| imported | variable | 1089 | no | let imported = 0; |
| skipped | variable | 1090 | no | let skipped = 0; |
| payload | const | 1096 | no | const payload = node.data &amp;&amp; typeof node.data === &#39;object&#39; ? node.data : {}; |
| text | const | 1097 | no | const text = String(payload.text ?? node.title ?? &#39;&#39;).trim(); |
| kbHealth | function | 1118 | yes | export function kbHealth(db) { |
| model | const | 1119 | no | const model = loadModel(db, {}); |
| counts | const | 1120 | no | const counts = { doc: 0, decision: 0, canon: 0, session: 0, note: 0, wiki: 0 }; |
| stale | const | 1125 | no | const stale = []; |
| docHashes | const | 1126 | no | const docHashes = new Map(); |
| expected | const | 1136 | no | const expected = record.sha256 ?? record.hash ?? null; |
| ref | const | 1138 | no | const ref = record.ref ?? record.path ?? null; |
| key | const | 1140 | no | const key = pathKey(node.project, stripLineSuffix(ref)); |
| actual | const | 1142 | no | const actual = docHashes.get(key); |
| connected | const | 1157 | no | const connected = new Set(); |
| orphans | const | 1162 | no | const orphans = [...model.nodes.values()] |
| health | const | 1167 | no | const health = { counts, stale, orphans }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./memory.mjs | import | 18 | [hq/lib/memory.mjs](./memory.mjs.md) |
| ./util.mjs | import | 19 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-095-unknowns-investigation.mjs](../aii/fixtures/HQ-095-unknowns-investigation.mjs.md) | ../../lib/kb.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kb.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kb.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kb.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kb.mjs |
| [hq/test/kb-query-capability.test.mjs](../test/kb-query-capability.test.mjs.md) | ../lib/kb.mjs |
| [hq/test/semantic-convergence.test.mjs](../test/semantic-convergence.test.mjs.md) | ../lib/kb.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Unified read model over documents, decisions, CANON terms, sessions, notes, wiki pages and capability documents. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | lane-P |
| 5 | why | — | — | Six ledgers answer one question: what does this workspace know, and how is it linked? |
| 8 | invariant | — | — | Only kbRemember and kbForget write, and only to notes through hq/lib/memory.mjs. |
| 9 | invariant | — | — | Reads never write: no DDL, no UPDATE and no INSERT outside the note API. |
| 10 | invariant | — | — | Deterministic output: results by score desc then id asc, nodes by id, edges by from+to+kind. |
| 11 | invariant | — | — | A missing table degrades to empty output with a reason; it never throws. |
| 12 | invariant | — | — | Capability rows are query-only: they are never graph nodes, never exported by kbExport |
| 15 | see | — | hq/CONTRACT.md | hq/CONTRACT.md |
| 16 | see | — | hq/lib/capabilities.mjs | hq/lib/capabilities.mjs |

## Excerpt

```javascript
/**
 * @hq:context Unified read model over documents, decisions, CANON terms, sessions, notes, wiki pages and capability documents.
 * @hq:owner hq-agent
 * @hq:task lane-P
 * @hq:why Six ledgers answer one question: what does this workspace know, and how is it linked?
 *       Capability documents (package READMEs, licenses, changelogs) join the same query so a
 *       dependency question is answered without opening node_modules by hand.
 * @hq:invariant Only kbRemember and kbForget write, and only to notes through hq/lib/memory.mjs.
 * @hq:invariant Reads never write: no DDL, no UPDATE and no INSERT outside the note API.
 * @hq:invariant Deterministic output: results by score desc then id asc, nodes by id, edges by from+to+kind.
 * @hq:invariant A missing table degrades to empty output with a reason; it never throws.
 * @hq:invariant Capability rows are query-only: they are never graph nodes, never exported by kbExport
 *             and never counted in kbHealth.counts. VIVIM product records follow the same rule
 *             under the `vivim:` id namespace (native source ids preserved).
 * @hq:see hq/CONTRACT.md
 * @hq:see hq/lib/capabilities.mjs
 */
import { addNote, archiveNote } from './memory.mjs';
import { canonicalJson, clamp, safeJsonParse, tokenize } from './util.mjs';

export const KB_SCHEMA = 'hq.kb/1';

// Node kinds. The kind name is also the node id prefix.
const KINDS = ['doc', 'decision', 'canon', 'session', 'note', 'wiki'];

// Query-only kind: capability documents live in the additive capability registry
// (hq/lib/capabilities.mjs). They answer a query but are not KB graph nodes.
const CAPABILITY_KIND = 'capability';

// Query-only kind: the VIVIM product ledger (capabilities, requirements,
// journeys, tasks, gaps, goals, routes, phases) projected read-only by
// `hq vivim sync` (hq/lib/vivim.mjs). Native source ids are kept verbatim
// under a `vivim:` namespace, so they can never collide with imported package
// capability documents (`capability:<source>:<path>`) or KB node ids.
const VIVIM_KIND = 'vivim';

const KIND_ALIASES = new Map([
  ['doc', 'doc'], ['document', 'doc'], ['documents', 'doc'],
  ['decision', 'decision'], ['decisions', 'decision'],
  ['canon', 'canon'], ['canon_term', 'canon'], ['canon_terms', 'canon'], ['term', 'canon'], ['terms', 'canon'],
  ['session', 'session'], ['sessions', 'session'],
  ['note', 'note'], ['notes', 'note'],
  ['wiki', 'wiki'], ['wiki_page', 'wiki'], ['wiki_pages', 'wiki'],
  ['capability', CAPABILITY_KIND], ['capabilities', CAPABILITY_KIND],
  ['capability_document', CAPABILITY_KIND], ['capability_documents', CAPABILITY_KIND],
  ['vivim', VIVIM_KIND], ['vivim_record', VIVIM_KIND], ['vivim_records', VIVIM_KIND],
  ['product', VIVIM_KIND], ['requirement', VIVIM_KIND], ['requirements', VIVIM_KIND],
  ['journey', VIVIM_KIND], ['journeys', VIVIM_KIND],
]);

// The table each kind is read from. Absence is tolerated, never fatal.
const SOURCE_TABLES = {
  doc: 'documents',
  decision: 'decisions',
  canon: 'canon_terms',
  session: 'sessions',
  note: 'notes',
  wiki: 'wiki_pages',
};

const MAX_ROWS = 5000;      // rows read per source
const MAX_LIMIT = 5000;     // upper bound for limit
const MAX_DEPTH = 6;        // upper bound for graph depth
const FTS_LIMIT = 2000;     // rows pulled from an FTS table per query
const BODY_CAP = 4000;      // characters of body text kept per node
const SNIPPET_CAP = 200;    // characters of snippet returned per result

// ---------------------------------------------------------------------------
// primitives

function kbError(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  return error;
}

function cmp(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  return left < right ? -1 : left > right ? 1 : 0;
```

_First 80 of 1186 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
