/**
 * @hq:context Wave 1 Lane B: bounded, read-only KB/semantic identity export.
 * @hq:invariant Never promotes, indexes, repairs, creates tables or writes to HQ SQLite.
 * @hq:invariant No code/command edge without an exact path AND SHA-256 match to a source manifest.
 * @hq:invariant Sessions, notes and content bodies are excluded from the DEV interchange.
 */
import { createHash } from 'node:crypto';

export const WAVE1_KB_SCHEMA = 'vivim.wave1.kb-semantic/1';
const MAX = 500;
const SECRET = /(^|\/)(?:\.env[^/]*|[^/]*\.env|[^/]*\.(?:pem|p12|keystore)|cookies|login data|session\.json|storage-state\.json|release-profile\.json)(?:\/|$)/i;
const VALID_ID = /^[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*$/;
const cmp = (a, b) => String(a).localeCompare(String(b), 'en');
const pathOf = value => typeof value === 'string' ? value.replaceAll('\\', '/').replace(/^\.\//, '') : '';
const goodPath = value => !!value && !value.startsWith('/') && !/^[a-z]:\//i.test(value) && !value.split('/').includes('..') && !SECRET.test(value);
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
function parseArray(value) { try { const x = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(x) ? x : []; } catch { return []; } }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort(cmp).map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
function table(db, name) { return !!db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name=?").get(name); }
function rows(db, name, fields, where, values, cap) {
  if (!table(db, name)) return { missing: true, items: [], truncated: false };
  const result = db.prepare(`SELECT ${fields} FROM ${name} ${where} LIMIT ?`).all(...values, cap + 1);
  return { missing: false, items: result.slice(0, cap), truncated: result.length > cap };
}
function refusal(code, detail) { const error = new Error(`${code}: ${detail}`); error.code = code; throw error; }

/**
 * A sourceManifest entry is {path,sha256} where sha256 comes from read source bytes,
 * not Git's SHA-1 blob hash. Paths are scoped to one root and never guessed.
 * This returns data only: Lane E owns HQKGX1 import and the Rust journal.
 */
export function exportWave1KbSemantic(db, {
  projectId, projectName, rootId, sourceRevision, sourceManifest = [], limit = 200,
} = {}) {
  if (!db || typeof db.prepare !== 'function') refusal('INVALID_DB', 'read-only SQLite connection required');
  if (!Number.isSafeInteger(projectId) || projectId < 1) refusal('INVALID_SCOPE', 'numeric HQ projectId is required');
  if (typeof projectName !== 'string' || !projectName.trim() || typeof rootId !== 'string' || !rootId.trim()) refusal('INVALID_SCOPE', 'projectName and rootId required');
  if (!/^[a-f0-9]{40}$/i.test(sourceRevision ?? '')) refusal('INVALID_REVISION', '40-character git source revision required');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX) refusal('INVALID_LIMIT', '1..500');
  if (!Array.isArray(sourceManifest) || sourceManifest.length > 20000) refusal('INVALID_MANIFEST', 'bounded source manifest required');

  const manifest = new Map();
  for (const entry of sourceManifest) {
    const path = pathOf(entry?.path), hash = sha(entry?.sha256);
    if (!goodPath(path) || !hash) refusal('INVALID_MANIFEST', 'invalid source path or SHA-256');
    if (manifest.has(path) && manifest.get(path) !== hash) refusal('SOURCE_COLLISION', path);
    manifest.set(path, hash);
  }
  const project = { id: projectId, name: projectName, root: rootId, revision: sourceRevision.toLowerCase() };
  const records = [], links = [], unknowns = [];
  const seen = new Map(), docs = new Map(), bindings = [], anchorByPath = new Map();
  const missingTables = [], truncatedTables = [];
  const read = (name, fields, clause = '', args = []) => {
    const result = rows(db, name, fields, clause, args, limit);
    if (result.missing) missingTables.push(name);
    if (result.truncated) truncatedTables.push(name);
    return result.items;
  };
  const add = record => {
    const prior = seen.get(record.id);
    const encoded = canonical(record);
    if (prior !== undefined && prior !== encoded) refusal('IDENTITY_COLLISION', record.id);
    if (prior === undefined) { seen.set(record.id, encoded); records.push(record); }
  };
  const edge = (from, to, relation, evidence) => links.push({ from, to, relation, evidence });
  const locate = (p, expected) => {
    if (!goodPath(p) || !sha(expected)) return 'missing_source_pin';
    if (!manifest.has(p)) return 'unverified_source';
    return manifest.get(p) === sha(expected) ? 'verified' : 'stale_source';
  };
  const descriptor = (type, id, label, state, authority, revision, source) => ({
    id, type, label: String(label ?? '').slice(0, 160), state: String(state ?? 'unknown'),
    authority: String(authority ?? 'unknown'), revision: String(revision ?? 'unknown'),
    source, writer: type.startsWith('semantic_') ? 'hq.semantic-registry/SQLite' : 'hq.kb/SQLite',
    verifiedRuntime: false,
  });

  for (const row of read('documents', 'path,title,authority,lifecycle,hash,binds_to', 'WHERE project_id=? ORDER BY path', [projectId])) {
    const path = pathOf(row.path);
    if (!goodPath(path)) { unknowns.push({ kind: 'secret_or_invalid_path', source: 'documents', path: null }); continue; }
    const id = `kb:doc:${rootId}:${encodeURIComponent(path)}`;
    const rec = descriptor('kb_document', id, row.title || path, row.lifecycle, row.authority, sha(row.hash) || 'unknown', { path, hash: sha(row.hash), evidence: 'hq.documents' });
    add(rec); docs.set(path, id);
    for (const b of parseArray(row.binds_to)) {
      const target = pathOf(b?.path), hash = sha(b?.sha256);
      if (!goodPath(target)) { unknowns.push({ kind: 'secret_or_invalid_binding', from: id }); continue; }
      bindings.push({ from: id, path: target, hash, origin: 'hq.documents.binds_to' });
    }
  }
  for (const [tableName, kind, labelField] of [['decisions','kb_decision','title'], ['canon_terms','kb_canon','term']]) {
    const fields = tableName === 'decisions' ? 'id,source_path,title,status,authority,hash,valid_from,valid_to,recorded_at,updated_at,evidence' : 'id,source_path,term,status,authority,hash,valid_from,valid_to,recorded_at,updated_at,evidence,aliases';
    for (const row of read(tableName, fields, 'WHERE project_id=? ORDER BY id', [projectId])) {
      const path = pathOf(row.source_path);
      if (!goodPath(path)) { unknowns.push({ kind: 'missing_or_sensitive_source', source: tableName, id: String(row.id).slice(0,120) }); continue; }
      const id = `kb:${kind}:${rootId}:${encodeURIComponent(String(row.id))}`;
      const rec = descriptor(kind, id, row[labelField], row.status, row.authority, row.updated_at || row.recorded_at || row.valid_from || sha(row.hash) || 'unknown', {
        path, hash: sha(row.hash), validFrom: row.valid_from, validTo: row.valid_to, recordedAt: row.recorded_at,
        evidenceRefs: parseArray(row.evidence).filter(x => typeof x === 'object' && goodPath(pathOf(x?.ref || x?.path))).map(x => ({ path: pathOf(x.ref || x.path), sha256: sha(x.sha256) })).slice(0,20),
      });
      add(rec);
      if (docs.has(path)) edge(id, docs.get(path), 'source_document', 'hq.source_path');
      else unknowns.push({ kind: 'source_document_not_indexed', id, path });
      // CANON aliases are vocabulary candidates only, not semantic aliases.
      if (kind === 'kb_canon') for (const alias of parseArray(row.aliases).slice(0,20)) {
        if (typeof alias === 'string' && alias.trim()) unknowns.push({ kind: 'canon_alias_candidate', id, value: alias.slice(0,120) });
      }
    }
  }
  const knownSourcePaths = new Set([...manifest.keys(), ...docs.keys(), ...bindings.map(b => b.path)]);
  const semanticLinks = read('semantic_link', 'id,semantic_id,path,line,symbol,content_hash,kind,status,observed_at', 'ORDER BY id');
  const eligible = new Map();
  for (const row of semanticLinks) {
    const path = pathOf(row.path), hash = sha(row.content_hash);
    if (!goodPath(path)) { unknowns.push({ kind: 'secret_or_invalid_semantic_anchor', id: String(row.id).slice(0,120) }); continue; }
    if (!knownSourcePaths.has(path)) continue; // avoid importing foreign project's semantic identities
    const state = locate(path, hash);
    if (state !== 'verified') unknowns.push({ kind: state, semanticId: row.semantic_id, path });
    if (!VALID_ID.test(row.semantic_id)) { unknowns.push({ kind: 'malformed_semantic_id', path }); continue; }
    const list = eligible.get(row.semantic_id) ?? [];
    list.push({ path, hash, line: row.line, symbol: row.symbol, status: row.status, observedAt: row.observed_at, evidenceStatus: state });
    eligible.set(row.semantic_id, list);
    const existing = anchorByPath.get(path) ?? [];
    if (state === 'verified') existing.push(row.semantic_id);
    anchorByPath.set(path, existing);
  }
  const ids = eligible.size ? read('semantic_id', 'id,kind,name,version,label,description,status,authority,provenance,created_at', 'ORDER BY id') : [];
  const found = new Set();
  for (const row of ids) {
    if (!eligible.has(row.id)) continue;
    found.add(row.id);
    const id = `semantic:${row.id}`;
    add(descriptor('semantic_id', id, row.label || row.name, row.status, row.authority, row.version, { id: row.id, kind: row.kind, provenance: row.provenance || null }));
    for (const anchor of eligible.get(row.id)) {
      if (anchor.evidenceStatus !== 'verified') continue;
      edge(id, `source:${rootId}:${encodeURIComponent(anchor.path)}`, 'source_anchor', { path: anchor.path, sha256: anchor.hash, line: anchor.line, status: anchor.status, observedAt: anchor.observedAt });
    }
  }
  for (const id of eligible.keys()) if (!found.has(id)) unknowns.push({ kind: 'semantic_target_not_registered', semanticId: id });
  const aliasRows = found.size ? read('semantic_alias', 'alias,target_id,kind', 'ORDER BY alias,target_id') : [];
  const aliasTargets = new Map();
  for (const row of aliasRows) {
    if (!found.has(row.target_id)) continue;
    const alias = String(row.alias ?? '').trim();
    if (!alias || alias.length > 160 || SECRET.test(alias)) continue;
    const targets = aliasTargets.get(alias) ?? new Set(); targets.add(row.target_id); aliasTargets.set(alias, targets);
    const id = `semantic:alias:${rootId}:${encodeURIComponent(alias)}:${encodeURIComponent(row.target_id)}`;
    add(descriptor('semantic_alias', id, alias, 'candidate', 'hq.semantic-registry/SQLite', 'unknown', { targetId: row.target_id, kind: row.kind }));
    edge(id, `semantic:${row.target_id}`, 'alias_candidate', 'hq.semantic_alias');
  }
  for (const [alias, targets] of aliasTargets) if (targets.size > 1) unknowns.push({ kind: 'ambiguous_alias', alias, targets: [...targets].sort(cmp) });
  for (const b of bindings) {
    const state = locate(b.path, b.hash);
    if (state !== 'verified') { unknowns.push({ kind: state, from: b.from, path: b.path }); continue; }
    edge(b.from, `source:${rootId}:${encodeURIComponent(b.path)}`, 'documented_source_binding', { path: b.path, sha256: b.hash, origin: b.origin });
    for (const sid of anchorByPath.get(b.path) ?? []) if (found.has(sid)) {
      edge(b.from, `semantic:${sid}`, 'source_pinned_semantic_crosswalk', { path: b.path, sha256: b.hash, origin: b.origin });
    }
  }
  records.sort((a,b) => cmp(a.id,b.id));
  links.sort((a,b) => cmp(a.from,b.from) || cmp(a.to,b.to) || cmp(a.relation,b.relation));
  unknowns.sort((a,b) => cmp(canonical(a),canonical(b)));
  const payload = { schema: WAVE1_KB_SCHEMA, project, records, links, unknowns,
    coverage: { manifestSources: manifest.size, records: records.length, links: links.length, missingTables, truncatedTables,
      excludedDomains: ['notes', 'sessions', 'wiki_pages', 'raw_knowledge_bodies'],
      completeness: missingTables.length || truncatedTables.length ? 'partial' : 'bounded' },
    effectsAllowed: false,
  };
  return { ...payload, digest: digest(payload) };
}
