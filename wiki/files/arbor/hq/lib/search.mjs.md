# File: hq/lib/search.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/search.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21875 B |
| Lines | 530 |
| Hash | 8a9cd5896d56 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEMANTIC_KINDS | const | 11 | no | const SEMANTIC_KINDS = [&#39;type&#39;, &#39;capability&#39;, &#39;contract&#39;, &#39;emits&#39;, &#39;consumes&#39;, &#39;action&#39;]; |
| SEMANTIC_ROW_LIMIT | const | 12 | no | const SEMANTIC_ROW_LIMIT = 100; |
| SEMANTIC_SOURCE_BYTES | const | 13 | no | const SEMANTIC_SOURCE_BYTES = 1_500_000; |
| isSensitiveSourcePath | function | 15 | yes | export function isSensitiveSourcePath(path) { |
| name | const | 17 | no | const name = part.trim().toLowerCase(); |
| semanticIdsIn | function | 25 | no | function semanticIdsIn(text) { |
| ids | const | 26 | no | const ids = String(text ?? &#39;&#39;).match(/(?&lt;![a-zA-Z0-9._@-])[a-z0-9][a-z0-9._-]*@\\d+(?:\\.\\d+)*(?![a-zA-Z0-9_@-]\|\\.[a-zA-Z0-9])/g) \|\| []; |
| searchSemanticReferences | function | 32 | yes | export function searchSemanticReferences(db, options = {}) { |
| ids | const | 33 | no | const ids = semanticIdsIn(options.query); |
| limit | const | 34 | no | const limit = Math.min(SEMANTIC_ROW_LIMIT, toCount(options.limit, 40)); |
| filters | const | 36 | no | const filters = []; |
| params | const | 37 | no | const params = [...ids, ...SEMANTIC_KINDS.map(kind =&gt; &#39;v2:&#39; + kind)]; |
| rows | const | 41 | no | const rows = db.prepare(` SELECT a.line, a.kind AS annotation_kind, a.ref AS semantic_id, f.id AS file_id, f.project_id, f.path, f.lang, f.kind, f.hash, p.name AS project FROM annotations a JOIN file… |
| content | const | 53 | no | const content = db.prepare(&#39;SELECT content FROM content_fts WHERE rowid=?&#39;); |
| results | const | 54 | no | const results = []; |
| priorFile | variable | 55 | no | let priorFile = null; |
| parts | variable | 56 | no | let parts = null; |
| anchors | variable | 57 | no | let anchors=[]; |
| source | const | 62 | no | const source = content.get(row.file_id)?.content; |
| annotationKind | const | 67 | no | const annotationKind = row.annotation_kind.slice(3); |
| anchor | const | 68 | no | const anchor=anchors.find(a=&gt;a.annotationKind===annotationKind&amp;&amp;a.semanticId===row.semantic_id); |
| start | const | 71 | no | const start = Math.max(1, row.line - 2); |
| DEFAULT_CONTENT_LIMIT | const | 85 | no | const DEFAULT_CONTENT_LIMIT = 20; |
| DEFAULT_SYMBOL_LIMIT | const | 86 | no | const DEFAULT_SYMBOL_LIMIT = 30; |
| DEFAULT_FILE_LIMIT | const | 87 | no | const DEFAULT_FILE_LIMIT = 50; |
| toCount | function | 89 | no | function toCount(value, fallback, min = 0) { |
| n | const | 90 | no | const n = Number(value); |
| escapeLike | function | 96 | no | function escapeLike(value) { |
| queryTokens | function | 101 | no | function queryTokens(text) { |
| raw | const | 102 | no | const raw = String(text ?? &#39;&#39;).match(/[\\p{L}\\p{N}_]+(?:[_.-][\\p{L}\\p{N}_]+)*/gu) ?? []; |
| safeFtsExpression | function | 108 | no | function safeFtsExpression(text) { |
| tokens | const | 109 | no | const tokens = queryTokens(text); |
| CONTENT_STOPWORDS | const | 118 | yes | export const CONTENT_STOPWORDS = new Set([ &#39;a&#39;, &#39;an&#39;, &#39;the&#39;, &#39;and&#39;, &#39;or&#39;, &#39;but&#39;, &#39;if&#39;, &#39;then&#39;, &#39;else&#39;, &#39;when&#39;, &#39;while&#39;, &#39;of&#39;, &#39;to&#39;, &#39;in&#39;, &#39;on&#39;, &#39;at&#39;, &#39;as&#39;, &#39;by&#39;, &#39;for&#39;, &#39;with&#39;, &#39;from&#39;, &#39;into&#39;, &#39;onto&#39;… |
| contentTokens | function | 136 | yes | export function contentTokens(text) { |
| pathSegments | function | 143 | yes | export function pathSegments(path) { |
| posix | const | 144 | no | const posix = toPosix(String(path ?? &#39;&#39;)).toLowerCase(); |
| segments | const | 145 | no | const segments = []; |
| pathTokenMatch | function | 158 | yes | export function pathTokenMatch(tokens, path) { |
| words | const | 159 | no | const words = (tokens ?? []).filter((token) =&gt; ( token.length &gt;= 3 &amp;&amp; !CONTENT_STOPWORDS.has(String(token).toLowerCase()) )); |
| segments | const | 163 | no | const segments = pathSegments(path); |
| prefix | variable | 164 | no | let prefix = false; |
| isNoisyPath | function | 177 | yes | export function isNoisyPath(path) { |
| posix | const | 178 | no | const posix = toPosix(String(path ?? &#39;&#39;)).toLowerCase(); |
| parseInlineFilters | function | 188 | no | function parseInlineFilters(query) { |
| filters | const | 189 | no | const filters = {}; |
| text | const | 190 | no | const text = String(query ?? &#39;&#39;) |
| value | const | 192 | no | const value = String(quoted ?? bare ?? &#39;&#39;).trim(); |
| matchLine | function | 201 | no | function matchLine(content, tokens) { |
| haystack | const | 203 | no | const haystack = String(content).toLowerCase(); |
| best | variable | 204 | no | let best = -1; |
| idx | const | 206 | no | const idx = haystack.indexOf(String(token).toLowerCase()); |
| line | variable | 211 | no | let line = 1; |
| roundScore | function | 216 | no | function roundScore(value) { |
| n | const | 217 | no | const n = Number(value); |
| contentFilterSql | function | 222 | no | function contentFilterSql({ project, lang, kind }) { |
| clauses | const | 223 | no | const clauses = []; |
| params | const | 224 | no | const params = []; |
| TEST_RANK_DEMOTE | const | 248 | no | const TEST_RANK_DEMOTE = 0.75; |
| PATH_RANK_PROMOTE | const | 249 | no | const PATH_RANK_PROMOTE = 1.25; |
| runContentQuery | function | 251 | no | function runContentQuery(db, matchText, filters, limit, offset, pathPatterns = [], excludeIds = []) { |
| hasMatch | const | 252 | no | const hasMatch = Boolean(matchText); |
| conditions | const | 254 | no | const conditions = []; |
| bind | const | 255 | no | const bind = []; |
| whereSql | const | 266 | no | const whereSql = conditions.length ? `WHERE ${conditions.join(&#39; AND &#39;)}` : &#39;&#39;; |
| countSql | const | 268 | no | const countSql = `SELECT COUNT(*) AS c FROM content_fts LEFT JOIN files f ON f.id = content_fts.rowid ${whereSql}`; |
| total | const | 269 | no | const total = Number(db.prepare(countSql).get(...bind).c); |
| scoreExpr | variable | 271 | no | let scoreExpr = &#39;0&#39;; |
| factors | const | 273 | no | const factors = [&#39;content_fts.rank&#39;, `(CASE WHEN f.is_test = 1 THEN ${TEST_RANK_DEMOTE} ELSE 1 END)`]; |
| likes | const | 275 | no | const likes = pathPatterns.map(() =&gt; `(lower(content_fts.path) LIKE ? ESCAPE &#39;\\\\&#39;)`).join(&#39; OR &#39;); |
| scoreBind | const | 282 | no | const scoreBind = hasMatch ? [...pathPatterns] : []; |
| rowsSql | const | 284 | no | const rowsSql = ` |
| rows | const | 298 | no | const rows = db.prepare(rowsSql).all(...scoreBind, ...bind, limit, offset); |
| searchContent | function | 302 | yes | export function searchContent(db, options = {}) { |
| parsed | const | 304 | no | const parsed = parseInlineFilters(query); |
| filters | const | 305 | no | const filters = { |
| pageLimit | const | 310 | no | const pageLimit = toCount(limit, DEFAULT_CONTENT_LIMIT, 0); |
| pageOffset | const | 311 | no | const pageOffset = toCount(offset, 0, 0); |
| text | const | 312 | no | const text = parsed.text; |
| tokens | const | 319 | no | const tokens = queryTokens(text); |
| pathPatterns | const | 321 | no | const pathPatterns = contentTokens(text) |
| semantic | const | 325 | no | const semantic = searchSemanticReferences(db, { ...filters, query: text, limit: SEMANTIC_ROW_LIMIT }); |
| matchedFiles | const | 326 | no | const matchedFiles = new Map(); |
| file | variable | 328 | no | let file = matchedFiles.get(hit.fileId); |
| prefix | const | 337 | no | const prefix = [...matchedFiles.values()]; |
| semanticPage | const | 338 | no | const semanticPage = prefix.slice(pageOffset, pageOffset + pageLimit); |
| textLimit | const | 339 | no | const textLimit = Math.max(0, pageLimit - semanticPage.length); |
| textOffset | const | 340 | no | const textOffset = Math.max(0, pageOffset - prefix.length); |
| excludeIds | const | 341 | no | const excludeIds = [...matchedFiles.keys()]; |
| attempt | variable | 342 | no | let attempt; |
| safe | const | 346 | no | const safe = text ? safeFtsExpression(text) : null; |
| safe | const | 361 | no | const safe = safeFtsExpression(text); |
| results | const | 369 | no | const results = attempt.rows.map((row) =&gt; ({ path: row.path, project: row.project ?? null, lang: row.lang ?? null, kind: row.kind ?? &#39;other&#39;, |
| symbolFilterSql | function | 381 | no | function symbolFilterSql({ kind, project }) { |
| clauses | const | 382 | no | const clauses = []; |
| params | const | 383 | no | const params = []; |
| searchSymbols | function | 395 | yes | export function searchSymbols(db, options = {}) { |
| limit | const | 397 | no | const limit = toCount(options.limit, DEFAULT_SYMBOL_LIMIT, 0); |
| raw | const | 398 | no | const raw = String(query ?? &#39;&#39;).trim(); |
| qLower | const | 401 | no | const qLower = raw.toLowerCase(); |
| likeBase | const | 402 | no | const likeBase = escapeLike(qLower); |
| predicate | variable | 405 | no | let predicate; |
| predicateParams | variable | 406 | no | let predicateParams; |
| whereSql | const | 414 | no | const whereSql = [predicate, ...clauses].join(&#39; AND &#39;); |
| countSql | const | 416 | no | const countSql = ` |
| total | const | 422 | no | const total = Number(db.prepare(countSql).get(...predicateParams, ...params).c); |
| rankSql | const | 424 | no | const rankSql = exact |
| rankParams | const | 427 | no | const rankParams = exact ? [] : [qLower, `${likeBase}%`]; |
| orderSql | const | 428 | no | const orderSql = exact |
| rowsSql | const | 432 | no | const rowsSql = ` |
| rows | const | 448 | no | const rows = db.prepare(rowsSql).all(...rankParams, ...predicateParams, ...params, limit); |
| results | const | 450 | no | const results = rows.map((row) =&gt; ({ name: row.name, kind: row.kind, path: row.path, project: row.project, |
| FILE_COLUMNS | const | 463 | no | const FILE_COLUMNS = ` |
| fileFilterSql | function | 474 | no | function fileFilterSql({ project, lang }) { |
| clauses | const | 475 | no | const clauses = []; |
| params | const | 476 | no | const params = []; |
| fileRow | function | 488 | no | function fileRow(row) { |
| findFiles | function | 500 | yes | export function findFiles(db, options = {}) { |
| pattern | const | 501 | no | const pattern = String(options.pattern ?? &#39;&#39;); |
| limit | const | 502 | no | const limit = toCount(options.limit, DEFAULT_FILE_LIMIT, 0); |
| isGlob | const | 504 | no | const isGlob = pattern.includes(&#39;*&#39;) \|\| pattern.includes(&#39;?&#39;); |
| orderSql | const | 505 | no | const orderSql = &#39;p.name ASC, f.path ASC&#39;; |
| needle | const | 508 | no | const needle = pattern.toLowerCase(); |
| whereSql | const | 511 | no | const whereSql = where.length ? `WHERE ${where.join(&#39; AND &#39;)}` : &#39;&#39;; |
| needleParams | const | 512 | no | const needleParams = needle ? [needle] : []; |
| total | const | 513 | no | const total = Number(db.prepare(`SELECT COUNT(*) AS c FROM files f JOIN projects p ON p.id = f.project_id ${whereSql}`) .get(...needleParams, ...params).c); |
| rows | const | 515 | no | const rows = db.prepare(`${FILE_COLUMNS} ${whereSql} ORDER BY ${orderSql} LIMIT ?`) |
| whereSql | const | 520 | no | const whereSql = clauses.length ? `WHERE ${clauses.join(&#39; AND &#39;)}` : &#39;&#39;; |
| patternPosix | const | 521 | no | const patternPosix = toPosix(pattern); |
| exactRe | const | 522 | no | const exactRe = globToRegExp(patternPosix); |
| lowerRe | const | 523 | no | const lowerRe = globToRegExp(patternPosix.toLowerCase()); |
| rows | const | 524 | no | const rows = db.prepare(`${FILE_COLUMNS} ${whereSql} ORDER BY ${orderSql}`).all(...params); |
| matched | const | 525 | no | const matched = rows.filter((row) =&gt; { const path = toPosix(row.path); return exactRe.test(path) \|\| lowerRe.test(path.toLowerCase()); }); |
| path | const | 526 | no | const path = toPosix(row.path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 7 | [hq/lib/util.mjs](./util.mjs.md) |
| ./semantic-registry.mjs | import | 8 | [hq/lib/semantic-registry.mjs](./semantic-registry.mjs.md) |
| ./annotation-v2.mjs | import | 9 | [hq/lib/annotation-v2.mjs](./annotation-v2.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/search.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/search.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/search.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/search.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./search.mjs |
| [hq/lib/context.mjs](./context.mjs.md) | ./search.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./search.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./search.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./search.mjs |
| [hq/test/context-ranking.test.mjs](../test/context-ranking.test.mjs.md) | ../lib/search.mjs |
| [hq/test/search.test.mjs](../test/search.test.mjs.md) | ../lib/search.mjs |
| [hq/test/semantic-source-context.test.mjs](../test/semantic-source-context.test.mjs.md) | ../lib/search.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/search.mjs — deterministic search over the local HQ index.
//
// Three read-only entry points share one SQLite database: full-text content
// search (FTS5), symbol search and file search. Every function returns a total
// match count plus a page of results, and every ordering is explicit so the
// same index always produces the same output.
import { globToRegExp, toPosix, sha256 } from './util.mjs';
import { indexedSemanticAnchors, indexedAnnotationEvidence, annotationResolution } from './semantic-registry.mjs';
import { isVersionedId } from './annotation-v2.mjs';

const SEMANTIC_KINDS = ['type', 'capability', 'contract', 'emits', 'consumes', 'action'];
const SEMANTIC_ROW_LIMIT = 100;
const SEMANTIC_SOURCE_BYTES = 1_500_000;

export function isSensitiveSourcePath(path) {
  return toPosix(path).split('/').some(part => {
    const name = part.trim().toLowerCase();
    return name.startsWith('.env') || name.endsWith('.env') ||
      ['.private', 'private', 'secrets', 'credentials', 'session-dumps', 'chat-exports'].includes(name) ||
      /\.(?:keystore|pem|p12)$/.test(name) ||
      ['session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'login data'].includes(name);
  });
}

function semanticIdsIn(text) {
  const ids = String(text ?? '').match(/(?<![a-zA-Z0-9._@-])[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*(?![a-zA-Z0-9_@-]|\.[a-zA-Z0-9])/g) || [];
  return [...new Set(ids.filter(isVersionedId))].slice(0, 12);
}

// Read-only, exact semantic ID lookup over the existing indexed snapshot.
// No disk reads here: arbor-service's search authority is index-only.
export function searchSemanticReferences(db, options = {}) {
  const ids = semanticIdsIn(options.query);
  const limit = Math.min(SEMANTIC_ROW_LIMIT, toCount(options.limit, 40));
  if (!ids.length || !limit) return { total: 0, results: [] };
  const filters = [];
  const params = [...ids, ...SEMANTIC_KINDS.map(kind => 'v2:' + kind)];
  if (options.project) { filters.push('lower(p.name) = lower(?)'); params.push(options.project); }
  if (options.lang) { filters.push('lower(f.lang) = lower(?)'); params.push(options.lang); }
  if (options.kind) { filters.push('lower(f.kind) = lower(?)'); params.push(options.kind); }
  const rows = db.prepare(`
    SELECT a.line, a.kind AS annotation_kind, a.ref AS semantic_id, f.id AS file_id,
      f.project_id, f.path, f.lang, f.kind, f.hash, p.name AS project
    FROM annotations a JOIN files f ON f.id=a.file_id AND f.project_id=a.project_id
    JOIN projects p ON p.id=f.project_id
    WHERE a.ref IN (${ids.map(() => '?').join(',')})
      AND a.kind IN (${SEMANTIC_KINDS.map(() => '?').join(',')})
      AND f.kind='source' AND f.is_generated=0 AND f.size <= ?
      ${filters.length ? 'AND ' + filters.join(' AND ') : ''}
    ORDER BY p.name, f.path, a.line, a.kind, a.ref LIMIT ?`)
    .all(...params.slice(0, ids.length + SEMANTIC_KINDS.length), SEMANTIC_SOURCE_BYTES,
      ...params.slice(ids.length + SEMANTIC_KINDS.length), SEMANTIC_ROW_LIMIT);
  const content = db.prepare('SELECT content FROM content_fts WHERE rowid=?');
  const results = [];
  let priorFile = null;
  let parts = null;
  let anchors=[];
  for (const row of rows) {
    if (isSensitiveSourcePath(row.path) || !row.hash) continue;
    if (priorFile !== row.file_id) {
      priorFile = row.file_id;
      const source = content.get(row.file_id)?.content;
      parts = typeof source === 'string' && sha256(source) === row.hash ? source.split(/\r?\n/) : null;
      anchors=parts?indexedSemanticAnchors(db,{fileId:row.file_id,project:row.project,path:row.path,hash:row.hash}):[];
    }
    if (!parts || row.line < 1 || row.line > parts.length) continue;
    const annotationKind = row.annotation_kind.slice(3);
    const anchor=anchors.find(a=>a.annotationKind===annotationKind&&a.semanticId===row.semantic_id);
    if(!anchor)continue;
    const {entry,resolution}=annotationResolution(db,row.semantic_id,annotationKind);
    const start = Math.max(1, row.line - 2);
    const end = Math.min(parts.length, row.line + 8);
    results.push({
      path: row.path, project: row.project, lang: row.lang, kind: row.kind,
      fileId: row.file_id, projectId: row.project_id, line: row.line,
      semanticId: row.semantic_id, annotationKind, schemaVersion: '2',
      registryStatus: entry?.status ?? null, registryKind: entry?.kind ?? null, resolution,
      contentHash: row.hash, snapshot: 'indexed', semanticAnchor:anchor, evidence:indexedAnnotationEvidence(anchor,resolution), lines: [start, end],
      snippet: parts.slice(start - 1, end).join('\n').slice(0, 4096),
    });
```

_First 80 of 531 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
