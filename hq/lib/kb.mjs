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
}

function toInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return clamp(Math.trunc(n), min, max);
}

function tableExists(db, name) {
  try {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE name = ? AND type IN ('table','view')",
    ).get(name);
    return Boolean(row);
  } catch {
    return false;
  }
}

function safeAll(db, sql, params = []) {
  try {
    return db.prepare(sql).all(...params);
  } catch {
    return [];
  }
}

function safeGet(db, sql, params = []) {
  try {
    return db.prepare(sql).get(...params) ?? null;
  } catch {
    return null;
  }
}

function parseList(value) {
  const parsed = safeJsonParse(value, null);
  return Array.isArray(parsed) ? parsed : [];
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (match) => '\\' + match);
}

function sameProject(left, right) {
  if (left == null || right == null) return false;
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function pathKey(project, path) {
  return `${String(project ?? '').toLowerCase()}\0${String(path ?? '').toLowerCase()}`;
}

// searchTokens — lowercase word tokens. Punctuation inside a token is split so
// the same token list can drive FTS5 and the LIKE fallback.
function searchTokens(query) {
  const out = new Set();
  for (const token of tokenize(query)) {
    for (const part of String(token).split(/[^\p{L}\p{N}_]+/u)) {
      if (part.length >= 2) out.add(part.toLowerCase());
    }
  }
  return [...out].sort();
}

// ---------------------------------------------------------------------------
// read model

const DOC_SQL = `
SELECT d.id AS row_id, d.project_id AS project_id, d.path AS path, d.family AS family,
       d.family_name AS family_name, d.role AS role, d.authority AS authority,
       d.lifecycle AS lifecycle, d.origin_type AS origin_type, d.title AS title,
       d.owner AS owner, d.hash AS hash, d.mtime_ms AS mtime_ms,
       d.last_verified AS last_verified, d.binds_to AS binds_to,
       p.name AS project_name
FROM documents d
LEFT JOIN projects p ON p.id = d.project_id
ORDER BY d.project_id ASC, d.path ASC
LIMIT ?`;

const DECISION_SQL = `
SELECT d.id AS id, d.project_id AS project_id, d.source_path AS source_path, d.title AS title,
       d.status AS status, d.authority AS authority, d.date AS date, d.rationale AS rationale,
       d.consequences AS consequences, d.alternatives AS alternatives,
       d.supersedes AS supersedes, d.evidence AS evidence, d.hash AS hash,
       d.valid_from AS valid_from, d.valid_to AS valid_to, d.recorded_at AS recorded_at,
       d.created_at AS created_at, d.updated_at AS updated_at, p.name AS project_name
FROM decisions d
LEFT JOIN projects p ON p.id = d.project_id
ORDER BY d.id ASC
LIMIT ?`;

const CANON_SQL = `
SELECT c.id AS id, c.project_id AS project_id, c.term AS term, c.definition AS definition,
       c.status AS status, c.owner AS owner, c.authority AS authority, c.evidence AS evidence,
       c.aliases AS aliases, c.contrasts AS contrasts, c.lifecycle AS lifecycle,
       c.source_path AS source_path, c.hash AS hash, c.valid_from AS valid_from,
       c.valid_to AS valid_to, c.recorded_at AS recorded_at, c.created_at AS created_at,
       c.updated_at AS updated_at, p.name AS project_name
FROM canon_terms c
LEFT JOIN projects p ON p.id = c.project_id
ORDER BY c.id ASC
LIMIT ?`;

const SESSION_SQL = `
SELECT s.id AS id, s.project_id AS project_id, s.parent_id AS parent_id, s.title AS title,
       s.directory AS directory, s.agent AS agent, s.model AS model, s.status AS status,
       s.outcome AS outcome, s.cost AS cost, s.tokens_input AS tokens_input,
       s.tokens_output AS tokens_output, s.created_at AS created_at,
       s.updated_at AS updated_at, s.source AS source, s.raw_hash AS raw_hash,
       p.name AS project_name
FROM sessions s
LEFT JOIN projects p ON p.id = s.project_id
ORDER BY s.id ASC
LIMIT ?`;

const NOTE_SQL = `
SELECT n.id AS id, n.project_id AS project_id, n.tier AS tier, n.key AS key, n.text AS text,
       n.origin AS origin, n.confidence AS confidence, n.evidence AS evidence,
       n.status AS status, n.created_at AS created_at, n.updated_at AS updated_at,
       n.version AS version, p.name AS project_name
FROM notes n
LEFT JOIN projects p ON p.id = n.project_id
WHERE n.status = 'active'
ORDER BY n.id ASC
LIMIT ?`;

const WIKI_SQL = `
SELECT w.id AS id, w.input_hash AS input_hash, w.generated_at AS generated_at, w.bytes AS bytes
FROM wiki_pages w
ORDER BY w.id ASC
LIMIT ?`;

const SESSION_FILES_SQL = `
SELECT f.session_id AS session_id, f.path AS path
FROM session_files f
ORDER BY f.session_id ASC, f.path ASC
LIMIT ?`;

function sourceState(db) {
  const present = new Set();
  const missing = [];
  for (const kind of KINDS) {
    const table = SOURCE_TABLES[kind];
    if (tableExists(db, table)) present.add(kind);
    else missing.push(table);
  }
  return { present, missing };
}

function docNodeId(row) {
  const project = row.project_name ?? (row.project_id == null ? '?' : `#${row.project_id}`);
  return `doc:${project}:${row.path}`;
}

function textOf(...parts) {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part) => part != null && part !== '')
    .map((part) => String(part))
    .join('\n');
}

function docNode(row) {
  const binds = parseList(row.binds_to)
    .filter((bind) => bind && typeof bind === 'object' && bind.path)
    .map((bind) => ({
      path: String(bind.path),
      lines: Array.isArray(bind.lines) ? bind.lines : [],
      sha256: bind.sha256 ?? null,
    }));
  const title = row.title || row.path;
  return {
    id: docNodeId(row),
    kind: 'doc',
    title: String(title),
    project: row.project_name ?? null,
    summary: textOf(row.title, row.path, row.family, row.family_name, row.role,
      row.authority, row.lifecycle, row.owner).toLowerCase(),
    data: {
      path: row.path,
      family: row.family ?? null,
      family_name: row.family_name ?? null,
      role: row.role ?? null,
      authority: row.authority ?? null,
      lifecycle: row.lifecycle ?? null,
      origin_type: row.origin_type ?? null,
      title: row.title ?? null,
      owner: row.owner ?? null,
      hash: row.hash ?? null,
      mtime_ms: Number(row.mtime_ms ?? 0),
      last_verified: row.last_verified ?? null,
      binds_to: binds,
    },
  };
}

function decisionNode(row) {
  const title = row.title || row.id;
  return {
    id: `decision:${row.id}`,
    kind: 'decision',
    title: String(title),
    project: row.project_name ?? null,
    summary: textOf(row.title, row.rationale, row.consequences, row.alternatives,
      row.source_path, row.status, row.authority, row.date).toLowerCase(),
    data: {
      id: row.id,
      source_path: row.source_path ?? null,
      status: row.status ?? null,
      authority: row.authority ?? null,
      date: row.date ?? null,
      rationale: row.rationale ?? null,
      consequences: row.consequences ?? null,
      alternatives: row.alternatives ?? null,
      supersedes: row.supersedes ?? null,
      evidence: parseList(row.evidence),
      hash: row.hash ?? null,
      valid_from: row.valid_from ?? null,
      valid_to: row.valid_to ?? null,
      recorded_at: row.recorded_at ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
    },
  };
}

function canonNode(row) {
  const title = row.term || row.id;
  return {
    id: `canon:${row.id}`,
    kind: 'canon',
    title: String(title),
    project: row.project_name ?? null,
    summary: textOf(row.term, row.definition, row.aliases, row.contrasts, row.status,
      row.owner, row.authority, row.source_path).toLowerCase(),
    data: {
      id: row.id,
      term: row.term ?? null,
      definition: row.definition ?? null,
      status: row.status ?? null,
      owner: row.owner ?? null,
      authority: row.authority ?? null,
      evidence: parseList(row.evidence),
      aliases: parseList(row.aliases),
      contrasts: parseList(row.contrasts),
      lifecycle: row.lifecycle ?? null,
      source_path: row.source_path ?? null,
      hash: row.hash ?? null,
      valid_from: row.valid_from ?? null,
      valid_to: row.valid_to ?? null,
      recorded_at: row.recorded_at ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
    },
  };
}

function sessionNode(row) {
  const title = row.title || row.id;
  return {
    id: `session:${row.id}`,
    kind: 'session',
    title: String(title),
    project: row.project_name ?? null,
    summary: textOf(row.title, row.outcome, row.agent, row.model, row.status,
      row.directory).toLowerCase(),
    data: {
      id: row.id,
      parent_id: row.parent_id ?? null,
      directory: row.directory ?? null,
      agent: row.agent ?? null,
      model: row.model ?? null,
      status: row.status ?? null,
      outcome: row.outcome ?? null,
      cost: row.cost == null ? null : Number(row.cost),
      tokens_input: row.tokens_input == null ? null : Number(row.tokens_input),
      tokens_output: row.tokens_output == null ? null : Number(row.tokens_output),
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
      source: row.source ?? null,
      raw_hash: row.raw_hash ?? null,
    },
  };
}

function noteNode(row) {
  const evidence = parseList(row.evidence);
  const title = row.key || String(row.text ?? '').slice(0, 80);
  return {
    id: `note:${row.id}`,
    kind: 'note',
    title: String(title),
    project: row.project_name ?? null,
    summary: textOf(row.text, row.key, row.tier, row.origin).toLowerCase(),
    data: {
      id: row.id,
      tier: row.tier ?? null,
      key: row.key ?? null,
      text: row.text ?? null,
      origin: row.origin ?? null,
      confidence: Number(row.confidence ?? 1),
      evidence,
      status: row.status ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
      version: Number(row.version ?? 1),
    },
  };
}

function wikiNode(row) {
  return {
    id: `wiki:${row.id}`,
    kind: 'wiki',
    title: String(row.id),
    project: null,
    summary: textOf(row.id).toLowerCase(),
    data: {
      id: row.id,
      input_hash: row.input_hash ?? null,
      generated_at: row.generated_at ?? null,
      bytes: Number(row.bytes ?? 0),
    },
  };
}

function loadModel(db, { kinds = null } = {}) {
  const state = sourceState(db);
  const want = (kind) => !kinds || kinds.includes(kind);
  const nodes = new Map();
  const docByPath = new Map();
  const docByPathAny = new Map();
  const sourceByPath = new Map();

  const add = (node) => {
    if (nodes.has(node.id)) return;
    nodes.set(node.id, node);
    if (node.kind === 'doc') {
      const key = pathKey(node.project, node.data.path);
      docByPath.set(key, node.id);
      const any = pathKey('', node.data.path);
      const list = docByPathAny.get(any) ?? [];
      list.push(node.id);
      docByPathAny.set(any, list);
      return;
    }
    if (node.kind === 'decision' || node.kind === 'canon') {
      const source = node.data.source_path;
      if (!source) return;
      const key = String(source).toLowerCase();
      const list = sourceByPath.get(key) ?? [];
      list.push(node.id);
      sourceByPath.set(key, list);
    }
  };

  if (want('doc') && state.present.has('doc')) {
    for (const row of safeAll(db, DOC_SQL, [MAX_ROWS])) add(docNode(row));
  }
  if (want('decision') && state.present.has('decision')) {
    for (const row of safeAll(db, DECISION_SQL, [MAX_ROWS])) add(decisionNode(row));
  }
  if (want('canon') && state.present.has('canon')) {
    for (const row of safeAll(db, CANON_SQL, [MAX_ROWS])) add(canonNode(row));
  }
  if (want('session') && state.present.has('session')) {
    for (const row of safeAll(db, SESSION_SQL, [MAX_ROWS])) add(sessionNode(row));
  }
  if (want('note') && state.present.has('note')) {
    for (const row of safeAll(db, NOTE_SQL, [MAX_ROWS])) add(noteNode(row));
  }
  if (want('wiki') && state.present.has('wiki')) {
    for (const row of safeAll(db, WIKI_SQL, [MAX_ROWS])) add(wikiNode(row));
  }

  const sessionFiles = [];
  if (want('session') && state.present.has('session') && tableExists(db, 'session_files')) {
    for (const row of safeAll(db, SESSION_FILES_SQL, [MAX_ROWS])) {
      if (row && row.session_id && row.path) sessionFiles.push({ session_id: String(row.session_id), path: String(row.path) });
    }
  }

  const model = { nodes, docByPath, docByPathAny, sourceByPath, sessionFiles, state };
  model.edges = buildEdges(model);
  return model;
}

// ---------------------------------------------------------------------------
// edges

function stripLineSuffix(ref) {
  const match = /^(.*?):(\d+)(?:-\d+)?$/.exec(String(ref ?? ''));
  return match && match[1] ? match[1] : String(ref ?? '');
}

function resolveDocByPath(model, project, path) {
  const direct = model.docByPath.get(pathKey(project, path));
  if (direct) return direct;
  const any = model.docByPathAny.get(pathKey('', path)) ?? [];
  return any.length === 1 ? any[0] : null;
}

function evidenceRefs(evidence) {
  const out = [];
  for (const entry of evidence) {
    if (typeof entry === 'string' && entry.trim()) out.push(entry.trim());
    else if (entry && typeof entry === 'object') {
      const ref = entry.ref ?? entry.path ?? entry.id ?? entry.source ?? null;
      if (typeof ref === 'string' && ref.trim()) out.push(ref.trim());
    }
  }
  return out;
}

function resolveRef(model, project, ref) {
  const text = String(ref ?? '').trim();
  if (!text) return null;
  if (model.nodes.has(text)) return text;
  const colon = text.indexOf(':');
  if (colon > 0) {
    const prefix = text.slice(0, colon).toLowerCase();
    if (['decision', 'canon', 'note', 'session', 'doc', 'wiki'].includes(prefix)) {
      if (model.nodes.has(text)) return text;
      const suffix = text.slice(colon + 1);
      if (prefix === 'decision') return model.nodes.has(`decision:${suffix}`) ? `decision:${suffix}` : null;
      if (prefix === 'canon') return model.nodes.has(`canon:${suffix}`) ? `canon:${suffix}` : null;
      if (prefix === 'note') return model.nodes.has(`note:${suffix}`) ? `note:${suffix}` : null;
      if (prefix === 'session') return model.nodes.has(`session:${suffix}`) ? `session:${suffix}` : null;
    }
  }
  return resolveDocByPath(model, project, stripLineSuffix(text));
}

function buildEdges(model) {
  const edges = [];
  const push = (from, to, kind) => {
    if (!from || !to || from === to) return;
    if (!model.nodes.has(from) || !model.nodes.has(to)) return;
    edges.push({ from, to, kind });
  };

  for (const node of model.nodes.values()) {
    if (node.kind === 'doc') {
      for (const bind of node.data.binds_to) {
        const target = model.docByPath.get(pathKey(node.project, bind.path));
        if (target) push(node.id, target, 'binds_to');
      }
      continue;
    }
    if (node.kind === 'decision' || node.kind === 'canon') {
      const target = model.docByPath.get(pathKey(node.project, node.data.source_path));
      if (target) push(node.id, target, 'source');
    }
  }

  for (const file of model.sessionFiles) {
    const session = model.nodes.get(`session:${file.session_id}`);
    if (!session) continue;
    const target = resolveDocByPath(model, session.project, file.path);
    if (target) push(session.id, target, 'file');
  }

  for (const node of model.nodes.values()) {
    if (node.kind !== 'note') continue;
    for (const ref of evidenceRefs(node.data.evidence)) {
      const target = resolveRef(model, node.project, ref);
      if (target) push(node.id, target, 'evidence');
    }
  }

  return sortEdges(edges);
}

function sortEdges(edges) {
  const seen = new Set();
  const out = [];
  for (const edge of edges) {
    const key = `${edge.from}\0${edge.to}\0${edge.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from: edge.from, to: edge.to, kind: edge.kind });
  }
  out.sort((a, b) => cmp(a.from, b.from) || cmp(a.to, b.to) || cmp(a.kind, b.kind));
  return out;
}

// ---------------------------------------------------------------------------
// query

const LIKE_SOURCES = {
  doc: {
    columns: ['d.title', 'd.path', 'd.family_name', 'd.role', 'd.authority', 'd.owner'],
    sql: 'SELECT d.project_id AS project_id, d.path AS path, p.name AS project_name FROM documents d LEFT JOIN projects p ON p.id = d.project_id',
  },
  decision: {
    columns: ['d.title', 'd.rationale', 'd.consequences', 'd.alternatives', 'd.source_path', 'd.status', 'd.authority'],
    sql: 'SELECT d.id AS id FROM decisions d',
  },
  canon: {
    columns: ['c.term', 'c.definition', 'c.status', 'c.owner', 'c.authority', 'c.source_path', 'c.aliases', 'c.contrasts'],
    sql: 'SELECT c.id AS id FROM canon_terms c',
  },
  session: {
    columns: ['s.title', 's.outcome', 's.agent', 's.model', 's.status', 's.directory'],
    sql: 'SELECT s.id AS id FROM sessions s',
  },
  note: {
    columns: ['n.text', 'n.key', 'n.tier'],
    sql: 'SELECT n.id AS id FROM notes n',
    extra: "n.status = 'active'",
  },
  wiki: {
    columns: ['w.id'],
    sql: 'SELECT w.id AS id FROM wiki_pages w',
  },
};

function likeClause(columns, tokens) {
  const parts = [];
  const params = [];
  for (const token of tokens) {
    const needle = `%${escapeLike(token)}%`;
    parts.push(`(${columns.map((column) => `lower(${column}) LIKE ? ESCAPE '\\'`).join(' OR ')})`);
    params.push(...columns.map(() => needle));
  }
  return { clause: parts.join(' OR '), params };
}

// ftsExpression — quoted tokens, prefix matched. FTS5 never sees user syntax.
function ftsExpression(tokens) {
  const parts = tokens
    .filter((token) => /^[\p{L}\p{N}_]+$/u.test(token))
    .map((token) => `"${token.replace(/"/g, '""')}"*`);
  return parts.length ? parts.join(' OR ') : null;
}

function likeCandidates(db, model, tokens, kinds) {
  const found = new Set();
  for (const kind of kinds) {
    const source = LIKE_SOURCES[kind];
    if (!source) continue;
    const { clause, params } = likeClause(source.columns, tokens);
    const where = source.extra ? `${source.extra} AND (${clause})` : clause;
    const rows = safeAll(db, `${source.sql} WHERE ${where} LIMIT ${MAX_ROWS}`, params);
    for (const row of rows) {
      if (kind === 'doc') {
        const node = model.nodes.get(docNodeId({
          project_id: row.project_id,
          path: row.path,
          project_name: row.project_name ?? null,
        }));
        if (node) found.add(node.id);
        continue;
      }
      const node = model.nodes.get(`${kind}:${row.id}`);
      if (node) found.add(node.id);
    }
  }
  return found;
}

function ftsCandidates(db, model, tokens, kinds) {
  const found = new Set();
  const expression = ftsExpression(tokens);
  if (!expression) return found;

  if (kinds.includes('doc') && tableExists(db, 'content_fts')) {
    const rows = safeAll(
      db,
      'SELECT path AS path, project AS project FROM content_fts WHERE content_fts MATCH ? LIMIT ?',
      [expression, FTS_LIMIT],
    );
    for (const row of rows) {
      const path = row.path == null ? '' : String(row.path);
      const project = row.project == null ? null : String(row.project);
      const direct = model.docByPath.get(pathKey(project, path));
      if (direct) found.add(direct);
      const any = model.docByPathAny.get(pathKey('', path)) ?? [];
      if (!direct && any.length === 1) found.add(any[0]);
      for (const id of model.sourceByPath.get(path.toLowerCase()) ?? []) {
        const node = model.nodes.get(id);
        if (!node) continue;
        if (project && node.project && !sameProject(node.project, project)) continue;
        found.add(node.id);
      }
    }
  }

  if (kinds.includes('session') && tableExists(db, 'session_fts')) {
    const rows = safeAll(
      db,
      'SELECT session_id AS session_id FROM session_fts WHERE session_fts MATCH ? LIMIT ?',
      [expression, FTS_LIMIT],
    );
    for (const row of rows) {
      const id = row.session_id == null ? '' : String(row.session_id);
      if (model.nodes.has(`session:${id}`)) found.add(`session:${id}`);
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// capability documents (additive layer, guarded)

function capabilityTables(db) {
  return tableExists(db, 'capability_document') && tableExists(db, 'capability_document_fts');
}

// Same term quoting as searchCapabilityDocuments (hq/lib/capabilities.mjs):
// every term double-quoted with a trailing prefix star, joined by space (FTS5
// AND). User syntax never reaches FTS5. Quoting is duplicated here so kb.mjs
// keeps reading only the tables it declares, never importing the scanner.
function capabilityExpression(tokens) {
  const terms = tokens
    .filter((token) => /[\p{L}\p{N}_]/u.test(token))
    .map((token) => `"${token.replace(/"/g, '')}"*`);
  return terms.length ? terms.join(' ') : null;
}

function capabilitySql(hasSource) {
  return `
SELECT d.source_id AS source_id, d.install_path AS install_path, d.path AS path,
       d.title AS title, ${hasSource ? 's.project' : 'NULL'} AS project,
       snippet(capability_document_fts, 5, '[', ']', '…', 12) AS snippet
FROM capability_document_fts
JOIN capability_document d
  ON d.source_id = capability_document_fts.source_id
 AND d.path = capability_document_fts.path
${hasSource ? 'LEFT JOIN capability_source s ON s.id = d.source_id' : ''}
WHERE capability_document_fts MATCH ?
ORDER BY rank ASC, d.path ASC
LIMIT ?`;
}

function capabilityScore(title, snippet, tokens) {
  const head = title.toLowerCase();
  const body = snippet.toLowerCase();
  let score = 1; // an FTS5 MATCH is a real hit; keep it visible and deterministic
  for (const token of tokens) {
    if (head.includes(token)) score += 4;
    else if (body.includes(token)) score += 1;
  }
  return score;
}

// capabilityResults — ordered by FTS5 rank then path, deduplicated later against
// documents rows. Returns [] when the capability tables are absent (old DBs).
function capabilityResults(db, tokens, max, project) {
  if (!capabilityTables(db)) return [];
  const expression = capabilityExpression(tokens);
  if (!expression) return [];
  const rows = safeAll(db, capabilitySql(tableExists(db, 'capability_source')), [expression, max]);
  const out = [];
  for (const row of rows) {
    if (project != null && !sameProject(row.project, project)) continue;
    const path = String(row.path ?? '');
    const title = String(row.title || path);
    const snippet = String(row.snippet ?? '').replace(/\s+/g, ' ').trim().slice(0, SNIPPET_CAP);
    const sourceId = String(row.source_id ?? '');
    out.push({
      id: `${CAPABILITY_KIND}:${sourceId}:${path}`,
      kind: CAPABILITY_KIND,
      title,
      snippet,
      project: row.project ?? null,
      score: capabilityScore(title, snippet, tokens),
      source: 'capability_document',
      path,
      install_path: row.install_path ?? null,
      source_id: sourceId,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// VIVIM product ledger (additive query-only layer, guarded)
// ---------------------------------------------------------------------------
// The VIVIM records table is rebuilt wholesale by every `hq vivim sync`, so it
// is joined into queries exactly like capability documents: results carry the
// `vivim:<record-kind>:<native-id>` id and the owning space as project, and the
// layer is never a graph node, never exported and never in kbHealth.counts.

function vivimSpaceName(db) {
  const row = safeGet(db, "SELECT value AS value FROM meta WHERE key = 'vivim_space'");
  const name = row && row.value ? String(row.value) : '';
  return name || null;
}

// Same scoring spirit as capabilityScore: a LIKE hit is a real hit; a title
// match outweighs an id or status match; everything stays deterministic.
function vivimScore(id, title, status, tokens) {
  const lowerId = String(id ?? '').toLowerCase();
  const lowerTitle = String(title ?? '').toLowerCase();
  const lowerStatus = String(status ?? '').toLowerCase();
  let score = 1;
  for (const token of tokens) {
    if (lowerTitle.includes(token)) score += 4;
    else if (lowerId.includes(token)) score += 2;
    else if (lowerStatus.includes(token)) score += 1;
  }
  return score;
}

function vivimSnippet(row, tokens) {
  const payload = safeJsonParse(row.payload, null) || {};
  const body = textOf(payload.acceptance, payload.spec, row.title).toLowerCase();
  for (const token of tokens) {
    const at = body.indexOf(token);
    if (at === -1) continue;
    const start = Math.max(0, at - 60);
    // One line, like capabilityResults: a snippet never breaks the CLI row.
    const slice = body.slice(start, start + SNIPPET_CAP).replace(/\s+/g, ' ').trim();
    return start > 0 ? `…${slice}` : slice;
  }
  return String(row.title ?? row.id ?? '').slice(0, SNIPPET_CAP);
}

function vivimResults(db, tokens, max, project) {
  if (!tableExists(db, 'vivim_records')) return [];
  const { clause, params } = likeClause(['v.id', 'v.title', 'v.status'], tokens);
  const rows = safeAll(
    db,
    `SELECT v.kind AS kind, v.id AS id, v.title AS title, v.status AS status, v.payload AS payload
      FROM vivim_records v WHERE ${clause} LIMIT ${MAX_ROWS}`,
    params,
  );
  const space = vivimSpaceName(db);
  const out = [];
  for (const row of rows) {
    if (project != null && !sameProject(space, project)) continue;
    const kind = String(row.kind ?? '');
    const id = String(row.id ?? '');
    out.push({
      id: `${VIVIM_KIND}:${kind}:${id}`,
      kind: VIVIM_KIND,
      title: String(row.title || id),
      snippet: vivimSnippet(row, tokens),
      project: space,
      score: vivimScore(id, row.title, row.status, tokens),
      source: 'vivim_records',
      record_kind: kind,
      native_id: id,
    });
  }
  return out;
}

// bodyText — the FTS-backed body of a node, when the index carries one.
function bodyText(db, node) {
  if (node.kind === 'doc') {
    const direct = safeGet(
      db,
      "SELECT c.content AS content FROM content_fts c WHERE c.path = ? AND c.project IS NOT NULL AND lower(c.project) = lower(?) LIMIT 1",
      [node.data.path, node.project ?? ''],
    );
    if (direct && direct.content != null) return String(direct.content).slice(0, BODY_CAP);
    const any = safeGet(
      db,
      'SELECT c.content AS content FROM content_fts c WHERE c.path = ? LIMIT 1',
      [node.data.path],
    );
    return any && any.content != null ? String(any.content).slice(0, BODY_CAP) : '';
  }
  if (node.kind === 'session') {
    const fts = safeAll(
      db,
      'SELECT text AS text FROM session_fts WHERE session_id = ? LIMIT 40',
      [node.data.id],
    );
    let text = fts.map((row) => String(row.text ?? '')).join('\n');
    if (!text.trim()) {
      const rows = safeAll(
        db,
        'SELECT m.text AS text FROM session_messages m WHERE m.session_id = ? ORDER BY m.seq ASC LIMIT 40',
        [node.data.id],
      );
      text = rows.map((row) => String(row.text ?? '')).join('\n');
    }
    return text.slice(0, BODY_CAP);
  }
  return '';
}

function scoreNode(node, body, tokens) {
  const title = node.title.toLowerCase();
  const summary = node.summary;
  const full = body.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 4;
    else if (summary.includes(token)) score += 2;
    if (full.includes(token)) score += 1;
  }
  return score;
}

function makeSnippet(node, body, tokens) {
  const title = node.title;
  const summary = node.summary;
  const full = body;
  for (const token of tokens) {
    for (const [source, from] of [[title, 'title'], [summary, 'summary'], [full, 'body']]) {
      const at = source.toLowerCase().indexOf(token);
      if (at === -1) continue;
      const start = Math.max(0, at - 60);
      const slice = source.slice(start, start + SNIPPET_CAP).trim();
      return from === 'title' ? slice : `…${slice}`;
    }
  }
  return title.slice(0, SNIPPET_CAP);
}

function resolveKinds(kind) {
  if (kind == null) return [...KINDS, CAPABILITY_KIND, VIVIM_KIND];
  const list = Array.isArray(kind) ? kind : [kind];
  const out = [];
  for (const entry of list) {
    const mapped = KIND_ALIASES.get(String(entry ?? '').trim().toLowerCase());
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

export function kbQuery(db, { query = '', kind = null, project = null, limit = 30 } = {}) {
  const tokens = searchTokens(query);
  if (!tokens.length) return [];
  const max = toInt(limit, 30, 0, MAX_LIMIT);
  if (max === 0) return [];
  const kinds = resolveKinds(kind);
  if (!kinds.length) return [];

  const model = loadModel(db, { kinds });
  const candidates = likeCandidates(db, model, tokens, kinds);
  for (const id of ftsCandidates(db, model, tokens, kinds)) candidates.add(id);

  const results = [];
  const docPaths = new Set();
  for (const id of candidates) {
    const node = model.nodes.get(id);
    if (!node) continue;
    if (project != null && !sameProject(node.project, project)) continue;
    const body = bodyText(db, node);
    const score = scoreNode(node, body, tokens);
    if (score <= 0) continue;
    if (node.kind === 'doc') docPaths.add(String(node.data.path ?? '').toLowerCase());
    results.push({
      id: node.id,
      kind: node.kind,
      title: node.title,
      snippet: makeSnippet(node, body, tokens),
      project: node.project,
      score,
    });
  }

  // Capability documents join the same result set. A path already answered by a
  // documents row is never duplicated: the KB row is the richer record.
  if (kinds.includes(CAPABILITY_KIND)) {
    for (const row of capabilityResults(db, tokens, max, project)) {
      if (docPaths.has(row.path.toLowerCase())) continue;
      results.push(row);
    }
  }

  // VIVIM product records join the same result set. They are distinct entities
  // from documents (the registry files themselves are docs; the records are the
  // projected product ledger), so no de-duplication applies.
  if (kinds.includes(VIVIM_KIND)) {
    for (const row of vivimResults(db, tokens, max, project)) results.push(row);
  }

  results.sort((a, b) => (b.score - a.score) || cmp(a.id, b.id));
  return results.slice(0, max);
}

export function kbNode(db, { id } = {}) {
  const nodeId = String(id ?? '').trim();
  if (!nodeId) return null;
  const model = loadModel(db, {});
  const node = model.nodes.get(nodeId);
  if (!node) return null;
  const edges = model.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
  return {
    id: node.id,
    kind: node.kind,
    title: node.title,
    project: node.project,
    data: node.data,
    edges,
  };
}

export function kbGraph(db, { project = null, depth = 2, limit = 200 } = {}) {
  const maxDepth = toInt(depth, 2, 0, MAX_DEPTH);
  const maxNodes = toInt(limit, 200, 1, MAX_LIMIT);
  const model = loadModel(db, {});
  const state = model.state;

  const seeds = [...model.nodes.values()]
    .filter((node) => project == null || sameProject(node.project, project))
    .sort((a, b) => cmp(a.id, b.id))
    .slice(0, maxNodes)
    .map((node) => node.id);

  const adjacency = new Map();
  for (const edge of model.edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from).push(edge.to);
    adjacency.get(edge.to).push(edge.from);
  }
  for (const list of adjacency.values()) list.sort(cmp);

  const visited = new Map();
  const queue = [];
  for (const seed of seeds) {
    if (visited.has(seed)) continue;
    visited.set(seed, 0);
    queue.push(seed);
  }

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const level = visited.get(current) ?? 0;
    if (level >= maxDepth) continue;
    for (const next of adjacency.get(current) ?? []) {
      if (visited.has(next)) continue;
      if (visited.size >= maxNodes) break;
      visited.set(next, level + 1);
      queue.push(next);
    }
  }

  const ids = [...visited.keys()].sort(cmp);
  const nodes = ids.map((id) => {
    const node = model.nodes.get(id);
    return { id: node.id, kind: node.kind, title: node.title, project: node.project };
  });
  const edges = sortEdges(model.edges.filter((edge) => visited.has(edge.from) && visited.has(edge.to)))
    .slice(0, maxNodes);

  const graph = { nodes, edges };
  if (state.missing.length === KINDS.length) graph.reason = 'not_synced';
  return graph;
}

// projectRef — a project name or id, never a path. The memory API creates a
// project row when it receives {name, path}; the KB writes to notes only, so
// the reference is narrowed before it reaches memory.mjs.
function projectRef(project) {
  if (project == null) return null;
  if (typeof project === 'number') return Number.isInteger(project) ? project : null;
  if (typeof project === 'string') return project.trim() ? project.trim() : null;
  if (typeof project === 'object') {
    if (Number.isInteger(project.id)) return project.id;
    if (typeof project.name === 'string' && project.name.trim()) return project.name.trim();
  }
  return null;
}

export function kbRemember(db, { text, tier = 'now', project = null, key = null, evidence = [] } = {}) {
  const ref = projectRef(project);
  let note;
  try {
    note = addNote(db, { text, tier, project: ref, key, evidence });
  } catch (error) {
    if (ref == null || !/no such table/i.test(String(error?.message ?? ''))) throw error;
    note = addNote(db, { text, tier, key, evidence });
  }
  return { ...note, kbId: `note:${note.id}` };
}

export function kbForget(db, { id } = {}) {
  const noteId = String(id ?? '').trim().replace(/^note:/, '');
  if (!noteId) return false;
  try {
    return archiveNote(db, { id: noteId }) === true;
  } catch {
    return false;
  }
}

export function kbExport(db, { format = 'json' } = {}) {
  const normalized = String(format ?? 'json').trim().toLowerCase();
  if (normalized !== 'json') {
    throw kbError('KB_UNSUPPORTED_FORMAT', `hq kb: unsupported export format "${format}" (json)`);
  }
  const model = loadModel(db, {});
  const nodes = [...model.nodes.values()]
    .sort((a, b) => cmp(a.id, b.id))
    .map((node) => ({
      id: node.id,
      kind: node.kind,
      title: node.title,
      project: node.project,
      data: node.data,
    }));
  return canonicalJson({ schema: KB_SCHEMA, nodes, edges: model.edges });
}

export function kbImport(db, { data } = {}) {
  const parsed = typeof data === 'string' ? safeJsonParse(data, null) : data;
  const nodes = parsed && Array.isArray(parsed.nodes) ? parsed.nodes : [];
  let imported = 0;
  let skipped = 0;
  for (const node of nodes) {
    if (!node || typeof node !== 'object' || node.kind !== 'note') {
      skipped += 1;
      continue;
    }
    const payload = node.data && typeof node.data === 'object' ? node.data : {};
    const text = String(payload.text ?? node.title ?? '').trim();
    if (!text) {
      skipped += 1;
      continue;
    }
    try {
      addNote(db, {
        text,
        tier: payload.tier ?? 'now',
        project: projectRef(node.project ?? payload.project ?? null),
        key: payload.key ?? null,
        evidence: Array.isArray(payload.evidence) ? payload.evidence : [],
      });
      imported += 1;
    } catch {
      skipped += 1;
    }
  }
  return { imported, skipped };
}

export function kbHealth(db) {
  const model = loadModel(db, {});
  const counts = { doc: 0, decision: 0, canon: 0, session: 0, note: 0, wiki: 0 };
  for (const node of model.nodes.values()) {
    counts[node.kind] = (counts[node.kind] ?? 0) + 1;
  }

  const stale = [];
  const docHashes = new Map();
  for (const node of model.nodes.values()) {
    if (node.kind !== 'doc') continue;
    docHashes.set(pathKey(node.project, node.data.path), node.data.hash ?? null);
  }
  for (const node of model.nodes.values()) {
    if (node.kind !== 'decision' && node.kind !== 'canon') continue;
    for (const entry of node.data.evidence) {
      const record = entry && typeof entry === 'object' ? entry : null;
      if (!record) continue;
      const expected = record.sha256 ?? record.hash ?? null;
      if (!expected) continue;
      const ref = record.ref ?? record.path ?? null;
      if (!ref) continue;
      const key = pathKey(node.project, stripLineSuffix(ref));
      if (!docHashes.has(key)) continue;
      const actual = docHashes.get(key);
      if (!actual || actual === expected) continue;
      stale.push({
        id: node.id,
        kind: node.kind,
        project: node.project,
        source: stripLineSuffix(ref),
        expected: String(expected),
        actual: String(actual),
        reason: 'source_hash_changed',
      });
    }
  }
  stale.sort((a, b) => cmp(a.id, b.id) || cmp(a.source, b.source));

  const connected = new Set();
  for (const edge of model.edges) {
    connected.add(edge.from);
    connected.add(edge.to);
  }
  const orphans = [...model.nodes.values()]
    .filter((node) => !connected.has(node.id))
    .sort((a, b) => cmp(a.id, b.id))
    .map((node) => ({ id: node.id, kind: node.kind, title: node.title, project: node.project }));

  const health = { counts, stale, orphans };
  if (capabilityTables(db)) {
    health.capability = {
      documents: Number(safeGet(db, 'SELECT COUNT(*) AS n FROM capability_document')?.n ?? 0),
      packages: tableExists(db, 'capability_package')
        ? Number(safeGet(db, 'SELECT COUNT(*) AS n FROM capability_package')?.n ?? 0)
        : 0,
    };
  }
  // The VIVIM product ledger is additive like capability rows: a summary count
  // is surfaced, but records never enter health.counts (query-only invariant).
  if (tableExists(db, 'vivim_records')) {
    health.vivim = {
      records: Number(safeGet(db, 'SELECT COUNT(*) AS n FROM vivim_records')?.n ?? 0),
    };
  }
  if (model.state.missing.length === KINDS.length) health.reason = 'not_synced';
  return health;
}
