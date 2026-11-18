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
  }
  return { total: results.length, results: results.slice(0, limit) };
}

const DEFAULT_CONTENT_LIMIT = 20;
const DEFAULT_SYMBOL_LIMIT = 30;
const DEFAULT_FILE_LIMIT = 50;

function toCount(value, fallback, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.trunc(n));
}

// escapeLike — make a user string literal inside a LIKE pattern with ESCAPE '\'.
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (m) => '\\' + m);
}

// queryTokens — word-ish tokens used for line hints and for the safe fallback.
function queryTokens(text) {
  const raw = String(text ?? '').match(/[\p{L}\p{N}_]+(?:[_.-][\p{L}\p{N}_]+)*/gu) ?? [];
  return [...new Set(raw)];
}

// safeFtsExpression — turn arbitrary text into an explicit OR of quoted tokens
// so FTS5 never sees user punctuation as query syntax.
function safeFtsExpression(text) {
  const tokens = queryTokens(text);
  if (tokens.length === 0) return null;
  return tokens.map((token) => `"${token.replace(/"/g, '""')}"`).join(' OR ');
}

// ZAIQ-013 ranking helpers — shared by `hq search` ordering and the context
// bundle scorer. Natural-language questions drag in function words ("how does
// the ...") that match almost every file; coverage and boosts below are
// computed over content words only.
export const CONTENT_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while',
  'of', 'to', 'in', 'on', 'at', 'as', 'by', 'for', 'with', 'from', 'into',
  'onto', 'about', 'after', 'before', 'between', 'during', 'through', 'under',
  'over', 'via', 'per', 'out', 'up', 'down', 'off', 'again', 'once', 'here',
  'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'not',
  'no', 'nor', 'also', 'just', 'get', 'got', 'use', 'used', 'using',
  'do', 'does', 'did', 'doing', 'done', 'be', 'been', 'being', 'am', 'is',
  'are', 'was', 'were', 'has', 'have', 'had', 'having', 'can', 'cannot',
  'could', 'should', 'would', 'may', 'might', 'must', 'shall', 'will',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their', 'this', 'that',
  'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'how', 'why',
  'where',
]);

// contentTokens — query tokens with English function words removed.
export function contentTokens(text) {
  return queryTokens(text).filter((token) => !CONTENT_STOPWORDS.has(token.toLowerCase()));
}

// pathSegments — the concept-bearing pieces of a path: directory and file
// segments split on the usual word separators ("src/zz-gadget.ts" ->
// src, zz, gadget, ts).
export function pathSegments(path) {
  const posix = toPosix(String(path ?? '')).toLowerCase();
  const segments = [];
  for (const part of posix.split('/')) {
    for (const piece of part.split(/[-._]+/)) {
      if (piece) segments.push(piece);
    }
  }
  return segments;
}

// pathTokenMatch — how strongly a path names one of the query concepts:
// 'exact' when a segment equals a content word ("freshness" in
// hq/lib/freshness.mjs), 'prefix' when one starts with the other, null when
// the path is unrelated.
export function pathTokenMatch(tokens, path) {
  const words = (tokens ?? []).filter((token) => (
    token.length >= 3 && !CONTENT_STOPWORDS.has(String(token).toLowerCase())
  ));
  if (!words.length) return null;
  const segments = pathSegments(path);
  let prefix = false;
  for (const word of words) {
    for (const segment of segments) {
      if (segment === word) return 'exact';
      if (segment.length >= 3 && (segment.startsWith(word) || word.startsWith(segment))) prefix = true;
    }
  }
  return prefix ? 'prefix' : null;
}

// isNoisyPath — test/fixture/mock locations. Files there may still be
// candidates and can still be selected, but they never outrank an equally
// matching implementation file.
export function isNoisyPath(path) {
  const posix = toPosix(String(path ?? '')).toLowerCase();
  if (/(^|\/)node_modules(\/|$)/.test(posix)) return true;
  if (/(^|\/)(tests?|__tests__|__mocks__|fixtures?|mocks|e2e|cypress|playwright)(\/|$)/.test(posix)) return true;
  if (/(^|\/)[^/]*\.(test|spec)\.[^/]+$/.test(posix)) return true;
  if (/(^|\/)[^/]*_(test|spec)(\.[^/]*)?$/.test(posix)) return true;
  return false;
}

// parseInlineFilters — pull project:<name>, lang:<lang> and kind:<kind> out of
// the query text. Quoted values may contain spaces.
function parseInlineFilters(query) {
  const filters = {};
  const text = String(query ?? '')
    .replace(/\b(project|lang|kind):(?:"([^"]*)"|(\S+))/gi, (_match, key, quoted, bare) => {
      const value = String(quoted ?? bare ?? '').trim();
      if (value) filters[key.toLowerCase()] = value;
      return ' ';
    })
    .trim();
  return { text, filters };
}

// matchLine — 1-based line of the earliest occurrence of any query token.
function matchLine(content, tokens) {
  if (!content || tokens.length === 0) return null;
  const haystack = String(content).toLowerCase();
  let best = -1;
  for (const token of tokens) {
    const idx = haystack.indexOf(String(token).toLowerCase());
    if (idx === -1) continue;
    if (best === -1 || idx < best) best = idx;
  }
  if (best < 0) return null;
  let line = 1;
  for (let i = 0; i < best; i++) if (haystack.charCodeAt(i) === 10) line++;
  return line;
}

function roundScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1e9) / 1e9;
}

function contentFilterSql({ project, lang, kind }) {
  const clauses = [];
  const params = [];
  if (project) {
    clauses.push('lower(content_fts.project) = lower(?)');
    params.push(project);
  }
  if (lang) {
    clauses.push('lower(content_fts.lang) = lower(?)');
    params.push(lang);
  }
  if (kind) {
    clauses.push('lower(f.kind) = lower(?)');
    params.push(kind);
  }
  return { clauses, params };
}

// runContentQuery — one attempt with one MATCH expression. The caller retries
// with safeFtsExpression when SQLite rejects the raw expression (and, since
// ZAIQ-013, when an implicit-AND natural-language query matches nothing).
//
// Ranking (ZAIQ-013): bm25 stays the base signal, but the effective score
// demotes indexed test files (× TEST_RANK_DEMOTE) and promotes files whose
// path names a query concept (× PATH_RANK_PROMOTE), so an implementation file
// outranks an equally-matching test and a path match outranks a body match.
const TEST_RANK_DEMOTE = 0.75;
const PATH_RANK_PROMOTE = 1.25;

function runContentQuery(db, matchText, filters, limit, offset, pathPatterns = [], excludeIds = []) {
  const hasMatch = Boolean(matchText);
  const { clauses, params } = contentFilterSql(filters);
  const conditions = [];
  const bind = [];
  if (hasMatch) {
    conditions.push('content_fts MATCH ?');
    bind.push(matchText);
  }
  for (const clause of clauses) conditions.push(clause);
  for (const param of params) bind.push(param);
  if (excludeIds.length) {
    conditions.push('content_fts.rowid NOT IN (' + excludeIds.map(() => '?').join(',') + ')');
    bind.push(...excludeIds);
  }
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS c FROM content_fts LEFT JOIN files f ON f.id = content_fts.rowid ${whereSql}`;
  const total = Number(db.prepare(countSql).get(...bind).c);

  let scoreExpr = '0';
  if (hasMatch) {
    const factors = ['content_fts.rank', `(CASE WHEN f.is_test = 1 THEN ${TEST_RANK_DEMOTE} ELSE 1 END)`];
    if (pathPatterns.length) {
      const likes = pathPatterns.map(() => `(lower(content_fts.path) LIKE ? ESCAPE '\\')`).join(' OR ');
      factors.push(`(CASE WHEN ${likes} THEN ${PATH_RANK_PROMOTE} ELSE 1 END)`);
    }
    scoreExpr = factors.join(' * ');
  }
  // The score expression's ? placeholders sit in the SELECT clause, so its
  // bind parameters come before the WHERE parameters.
  const scoreBind = hasMatch ? [...pathPatterns] : [];

  const rowsSql = `
SELECT content_fts.path AS path,
       content_fts.project AS project,
       content_fts.lang AS lang,
       f.kind AS kind,
       f.is_test AS is_test,
       snippet(content_fts, 1, '>>>', '<<<', '…', 12) AS snippet,
       ${scoreExpr} AS score,
       content_fts.content AS content
FROM content_fts
LEFT JOIN files f ON f.id = content_fts.rowid
${whereSql}
ORDER BY ${hasMatch ? 'score ASC, ' : ''}content_fts.project ASC, content_fts.path ASC
LIMIT ? OFFSET ?`;
  const rows = db.prepare(rowsSql).all(...scoreBind, ...bind, limit, offset);
  return { total, rows };
}

export function searchContent(db, options = {}) {
  const { query = '', limit = DEFAULT_CONTENT_LIMIT, offset = 0 } = options;
  const parsed = parseInlineFilters(query);
  const filters = {
    project: options.project ?? parsed.filters.project ?? null,
    lang: options.lang ?? parsed.filters.lang ?? null,
    kind: options.kind ?? parsed.filters.kind ?? null,
  };
  const pageLimit = toCount(limit, DEFAULT_CONTENT_LIMIT, 0);
  const pageOffset = toCount(offset, 0, 0);
  const text = parsed.text;

  // An empty query with no filters is a no-op; filters alone may browse a slice.
  if (!text && !filters.project && !filters.lang && !filters.kind) {
    return { total: 0, results: [] };
  }

  const tokens = queryTokens(text);
  // Path-promotion patterns: content words that also appear in file paths.
  const pathPatterns = contentTokens(text)
    .filter((token) => token.length >= 3)
    .map((token) => `%${escapeLike(token)}%`);

  const semantic = searchSemanticReferences(db, { ...filters, query: text, limit: SEMANTIC_ROW_LIMIT });
  const matchedFiles = new Map();
  for (const hit of semantic.results) {
    let file = matchedFiles.get(hit.fileId);
    if (!file) {
      file = { path: hit.path, project: hit.project, lang: hit.lang, kind: hit.kind,
        snippet: hit.snippet, line: hit.line, score: -1, semanticReferences: [] };
      matchedFiles.set(hit.fileId, file);
    }
    const { snippet, ...reference } = hit;
    file.semanticReferences.push(reference);
  }
  const prefix = [...matchedFiles.values()];
  const semanticPage = prefix.slice(pageOffset, pageOffset + pageLimit);
  const textLimit = Math.max(0, pageLimit - semanticPage.length);
  const textOffset = Math.max(0, pageOffset - prefix.length);
  const excludeIds = [...matchedFiles.keys()];
  let attempt;
  try {
    attempt = runContentQuery(db, text, filters, textLimit, textOffset, pathPatterns, excludeIds);
  } catch (error) {
    const safe = text ? safeFtsExpression(text) : null;
    if (!safe) return { total: prefix.length, results: semanticPage };
    try {
      attempt = runContentQuery(db, safe, filters, textLimit, textOffset, pathPatterns, excludeIds);
    } catch {
      throw error;
    }
  }

  // ZAIQ-013: a multi-word MATCH is an implicit AND, so a natural-language
  // question ("how does the watcher debounce coalesce events") matches only
  // files containing every single word — usually none. When the AND page is
  // empty, retry as best-match OR over the tokens; bm25 still orders the wider
  // candidate set. Single-token queries are their own OR and never retry.
  if (attempt.total === 0 && tokens.length >= 2) {
    const safe = safeFtsExpression(text);
    if (safe) {
      try {
        attempt = runContentQuery(db, safe, filters, textLimit, textOffset, pathPatterns, excludeIds);
      } catch { /* keep the empty AND result */ }
    }
  }

  const results = attempt.rows.map((row) => ({
    path: row.path,
    project: row.project ?? null,
    lang: row.lang ?? null,
    kind: row.kind ?? 'other',
    snippet: row.snippet ?? '',
    score: roundScore(row.score),
    line: matchLine(row.content, tokens),
  }));
  return { total: prefix.length + attempt.total, results: [...semanticPage, ...results] };
}

function symbolFilterSql({ kind, project }) {
  const clauses = [];
  const params = [];
  if (kind) {
    clauses.push('lower(s.kind) = lower(?)');
    params.push(kind);
  }
  if (project) {
    clauses.push('lower(p.name) = lower(?)');
    params.push(project);
  }
  return { clauses, params };
}

export function searchSymbols(db, options = {}) {
  const { query = '', exact = false } = options;
  const limit = toCount(options.limit, DEFAULT_SYMBOL_LIMIT, 0);
  const raw = String(query ?? '').trim();
  if (!raw) return { total: 0, results: [] };

  const qLower = raw.toLowerCase();
  const likeBase = escapeLike(qLower);
  const { clauses, params } = symbolFilterSql(options);

  let predicate;
  let predicateParams;
  if (exact) {
    predicate = 'lower(s.name) = ?';
    predicateParams = [qLower];
  } else {
    predicate = "(lower(s.name) = ? OR lower(s.name) LIKE ? ESCAPE '\\' OR instr(lower(s.name), ?) > 0)";
    predicateParams = [qLower, `${likeBase}%`, qLower];
  }
  const whereSql = [predicate, ...clauses].join(' AND ');

  const countSql = `
SELECT COUNT(*) AS c
FROM symbols s
JOIN files f ON f.id = s.file_id
JOIN projects p ON p.id = s.project_id
WHERE ${whereSql}`;
  const total = Number(db.prepare(countSql).get(...predicateParams, ...params).c);

  const rankSql = exact
    ? '0 AS rank'
    : "CASE WHEN lower(s.name) = ? THEN 0 WHEN lower(s.name) LIKE ? ESCAPE '\\' THEN 1 ELSE 2 END AS rank";
  const rankParams = exact ? [] : [qLower, `${likeBase}%`];
  const orderSql = exact
    ? 's.name COLLATE NOCASE ASC, s.kind ASC, p.name ASC, f.path ASC, s.line ASC'
    : 'rank ASC, s.name COLLATE NOCASE ASC, s.kind ASC, p.name ASC, f.path ASC, s.line ASC';

  const rowsSql = `
SELECT s.name AS name,
       s.kind AS kind,
       f.path AS path,
       p.name AS project,
       s.line AS line,
       s.end_line AS end_line,
       s.signature AS signature,
       s.exported AS exported,
       ${rankSql}
FROM symbols s
JOIN files f ON f.id = s.file_id
JOIN projects p ON p.id = s.project_id
WHERE ${whereSql}
ORDER BY ${orderSql}
LIMIT ?`;
  const rows = db.prepare(rowsSql).all(...rankParams, ...predicateParams, ...params, limit);

  const results = rows.map((row) => ({
    name: row.name,
    kind: row.kind,
    path: row.path,
    project: row.project,
    line: Number(row.line ?? 0),
    end_line: Number(row.end_line ?? 0),
    signature: row.signature ?? '',
    exported: Boolean(row.exported),
  }));
  return { total, results };
}

const FILE_COLUMNS = `
SELECT f.path AS path,
       p.name AS project,
       f.lang AS lang,
       f.kind AS kind,
       f.size AS size,
       f.lines AS lines,
       (SELECT COUNT(*) FROM symbols s WHERE s.file_id = f.id) AS symbols
FROM files f
JOIN projects p ON p.id = f.project_id`;

function fileFilterSql({ project, lang }) {
  const clauses = [];
  const params = [];
  if (project) {
    clauses.push('lower(p.name) = lower(?)');
    params.push(project);
  }
  if (lang) {
    clauses.push('lower(f.lang) = lower(?)');
    params.push(lang);
  }
  return { clauses, params };
}

function fileRow(row) {
  return {
    path: row.path,
    project: row.project,
    lang: row.lang,
    kind: row.kind,
    size: Number(row.size ?? 0),
    lines: Number(row.lines ?? 0),
    symbols: Number(row.symbols ?? 0),
  };
}

export function findFiles(db, options = {}) {
  const pattern = String(options.pattern ?? '');
  const limit = toCount(options.limit, DEFAULT_FILE_LIMIT, 0);
  const { clauses, params } = fileFilterSql(options);
  const isGlob = pattern.includes('*') || pattern.includes('?');
  const orderSql = 'p.name ASC, f.path ASC';

  if (!isGlob) {
    const needle = pattern.toLowerCase();
    const where = [...clauses];
    if (needle) where.push('instr(lower(f.path), ?) > 0');
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const needleParams = needle ? [needle] : [];
    const total = Number(db.prepare(`SELECT COUNT(*) AS c FROM files f JOIN projects p ON p.id = f.project_id ${whereSql}`)
      .get(...needleParams, ...params).c);
    const rows = db.prepare(`${FILE_COLUMNS} ${whereSql} ORDER BY ${orderSql} LIMIT ?`)
      .all(...needleParams, ...params, limit);
    return { total, results: rows.map(fileRow) };
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const patternPosix = toPosix(pattern);
  const exactRe = globToRegExp(patternPosix);
  const lowerRe = globToRegExp(patternPosix.toLowerCase());
  const rows = db.prepare(`${FILE_COLUMNS} ${whereSql} ORDER BY ${orderSql}`).all(...params);
  const matched = rows.filter((row) => {
    const path = toPosix(row.path);
    return exactRe.test(path) || lowerRe.test(path.toLowerCase());
  });
  return { total: matched.length, results: matched.slice(0, limit).map(fileRow) };
}
