// ARBOR-local HQ development intelligence boundary.
// Owns only rebuildable development index and generated wiki; never Host World.
import { mkdirSync, realpathSync, readFileSync, statSync, existsSync, lstatSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { openDb } from './schema.mjs';
import { loadProjects, projectsForIndex, registerProject, unregisterProject } from './registry.mjs';
import { indexWorkspace } from './indexer.mjs';
import { searchContent, searchSymbols, findFiles } from './search.mjs';
import { composeContext, verifyContext as verifyHqContext } from './context.mjs';
import { deps, impact, projectGraph } from './graph.mjs';
import { buildWiki } from './wiki.mjs';
import { listSemanticIds, getSemanticId } from './semantic-registry.mjs';
import { scanCapabilitySource, persistCapabilityScan, capabilityStatus } from './capabilities.mjs';
import { head as gitHead } from './git.mjs';
import { sha256 } from './util.mjs';

export const DEV_INTELLIGENCE_CONTRACT = 'arbor.dev-intelligence/1';
export const DEVELOPMENT_DOMAIN = 'development';
export const DEV_SOURCE_EVIDENCE_CONTRACT = 'arbor.dev-source-evidence/1';
const MAX_FILE_BYTES = 1_500_000;
const MAX_CONTEXT_TOKENS = 10000;
const MAX_WIKI_PAGES = 5000;

export function defaultDevDataDir() {
  const base = process.platform === 'win32' && process.env.LOCALAPPDATA
    ? process.env.LOCALAPPDATA : join(homedir(), '.local', 'share');
  return join(base, 'ARBOR', 'development-intelligence');
}
function canonicalDir(path) {
  if (typeof path !== 'string' || !path.trim()) throw new Error('HQ_SOURCE_PATH_REQUIRED');
  return realpathSync(resolve(path));
}
function sameDir(a, b) {
  const left = resolve(a), right = resolve(b);
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}
function ensureName(value) {
  const name = String(value || '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name)) throw new Error('HQ_INVALID_SOURCE_NAME');
  return name;
}
/**
 * approvedRoots MUST be the exact, explicitly authorized development source roots
 * supplied by Host (or manually via the local diagnostic CLI). A path appearing
 * in the durable registry does not grant read permission.
 *
 * No user corpus, Host World, session dump, donor repo or external HQ database
 * is loaded by default. Each operation rechecks all registered source scopes.
 */
function within(file, root) {
  const normalize = value => process.platform === 'win32'
    ? resolve(value).toLowerCase() : resolve(value);
  const candidate = normalize(file);
  const base = normalize(root);
  return candidate === base || candidate.startsWith(base + sep);
}
function stableSourceId(path) { return 'dev-source:' + sha256(process.platform === 'win32' ? path.toLowerCase() : path); }
function relativeSourcePath(path) {
  if (typeof path !== 'string' || !path || path.includes('\0') || isAbsolute(path)
    || /^[a-zA-Z]:/.test(path) || path.startsWith('\\')
    || path.split(/[\\/]/).some(part => part === '..' || part === '.')) {
    throw new Error('HQ_INVALID_RELATIVE_PATH');
  }
  return path.replace(/\\/g, '/');
}
function storageFailure(error) {
  if (error?.code === 'ENOSPC' || /SQLITE_FULL|database or disk is full/i.test(String(error?.message || ''))) {
    const out = new Error('HQ_STORAGE_FULL');
    out.cause = error;
    return out;
  }
  return error;
}
export function createDevIntelligence({
  dataDir = defaultDevDataDir(), approvedRoots = [], mode,
  actorId = null, sessionId = null, authorize = null,
} = {}) {
  if (mode !== 'host' && mode !== 'diagnostic') throw new Error('HQ_MODE_REQUIRED');
  if (!Array.isArray(approvedRoots)) throw new TypeError('approvedRoots must be an array');
  if (mode === 'host' && (typeof authorize !== 'function'
    || typeof actorId !== 'string' || !actorId.trim()
    || typeof sessionId !== 'string' || !sessionId.trim())) {
    throw new Error('HQ_HOST_AUTHORITY_REQUIRED');
  }
  if (!isAbsolute(dataDir)) throw new Error('HQ_DATA_DIR_ABSOLUTE_REQUIRED');
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const root = canonicalDir(dataDir);
  const approved = Object.freeze(approvedRoots.map(canonicalDir));
  if (approved.some(path => within(root, path) || within(path, root))) {
    throw new Error('HQ_SOURCE_DATA_OVERLAP');
  }
  const dbDir = join(root, '.hq');
  const database = join(dbDir, 'index.db');
  const wikiDir = join(root, 'wiki');
  function safeStorage() {
    for (const path of [join(root, 'projects.json'), dbDir, database, database + '-wal', database + '-shm', wikiDir]) {
      try {
        if (lstatSync(path).isSymbolicLink()) throw new Error('HQ_DATA_SYMLINK');
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
  }
  function storedRoot(entry) {
    const saved = isAbsolute(entry.path) ? entry.path : resolve(root, entry.path);
    return canonicalDir(saved);
  }
  function requireApproved(path) {
    const candidate = canonicalDir(path);
    if (!approved.some(grant => sameDir(grant, candidate))) throw new Error('HQ_SOURCE_NOT_APPROVED');
    return candidate;
  }
  function permit(operation, path) {
    const sourceRoot = requireApproved(path);
    if (mode === 'host' && authorize({
      actorId, sessionId, operation, domain: DEVELOPMENT_DOMAIN,
      sourceId: stableSourceId(sourceRoot), sourceRoot,
    }) !== true) throw new Error('HQ_HOST_PERMISSION_DENIED');
    return sourceRoot;
  }
  function guardedProjects(operation = 'source.read') {
    const records = loadProjects(root).projects;
    for (const record of records) {
      ensureName(record.name);
      permit(operation, storedRoot(record));
    }
    return records;
  }
  function authorizedFile(project, path, absPath, records) {
    const record = records.find(row => row.name === project);
    if (!record) throw new Error('HQ_SOURCE_NOT_REGISTERED');
    const base = permit('source.read', storedRoot(record));
    const expected = resolve(base, relativeSourcePath(path));
    if (!within(expected, base) || !sameDir(expected, resolve(absPath))) {
      throw new Error('HQ_SOURCE_PATH_MISMATCH');
    }
    const actual = canonicalDir(expected);
    if (!within(actual, base)) throw new Error('HQ_SOURCE_SYMLINK_ESCAPE');
    return actual;
  }
  function withDatabase(fn, operation = 'source.read', checkFiles = false) {
    const registered = guardedProjects(operation);
    safeStorage();
    let db;
    try {
      // Never load a mutable donor/legacy config.db path.
      db = openDb(database);
      const stored = db.prepare('SELECT name,path FROM projects').all();
      for (const row of stored) {
        const entry = registered.find(item => item.name === row.name);
        if (!entry || !sameDir(canonicalDir(row.path), storedRoot(entry))) {
          throw new Error('HQ_INDEX_SCOPE_MISMATCH');
        }
      }
      if (checkFiles) {
        for (const file of db.prepare(
          'SELECT p.name, f.path, f.abs_path FROM files f JOIN projects p ON p.id=f.project_id'
        ).all()) authorizedFile(file.name, file.path, file.abs_path, registered);
      }
      return fn(db, registered);
    } catch (error) { throw storageFailure(error); }
    finally { if (db) db.close(); }
  }
  function registerSource({ name, path }) {
    const resolved = permit('source.register', path);
    ensureName(name);
    safeStorage();
    const existing = loadProjects(root).projects.find(row => row.name === name);
    if (existing && !sameDir(storedRoot(existing), resolved)) throw new Error('HQ_SOURCE_IDENTITY_CONFLICT');
    return { ...registerProject(root, { name, path: resolved, tags: ['development'] }), sourceId: stableSourceId(resolved) };
  }
  function removeSource(name) {
    const identity = ensureName(name);
    const record = loadProjects(root).projects.find(row => row.name === identity);
    if (!record) return false;
    // Revocation uses Host's separate revoke permission, not a read grant.
    const saved = isAbsolute(record.path) ? resolve(record.path) : resolve(root, record.path);
    if (mode === 'host' && authorize({
      actorId, sessionId, operation: 'source.revoke',
      domain: DEVELOPMENT_DOMAIN, sourceId: stableSourceId(saved), sourceRoot: saved,
    }) !== true) throw new Error('HQ_HOST_PERMISSION_DENIED');
    safeStorage();
    let db;
    try {
      db = openDb(database);
      db.exec('BEGIN IMMEDIATE');
      try {
        const row = db.prepare('SELECT id FROM projects WHERE name=?').get(identity);
        if (row) {
          const files = db.prepare('SELECT id FROM files WHERE project_id=?').all(row.id);
          const clearFts = db.prepare('DELETE FROM content_fts WHERE rowid=?');
          for (const file of files) clearFts.run(file.id);
          db.prepare('DELETE FROM projects WHERE id=?').run(row.id);
        }
        // Capability scan rows are derived from this source, not grants.
        const capRows = db.prepare('SELECT id,root FROM capability_source').all();
        for (const item of capRows) {
          if (!sameDir(resolve(item.root), saved)) continue;
          for (const table of [
            'capability_contract', 'capability_map', 'capability_evidence',
            'capability_document', 'capability_file', 'capability_dependency',
            'capability_package',
          ]) db.prepare('DELETE FROM ' + table + ' WHERE source_id=?').run(item.id);
          db.prepare('DELETE FROM capability_document_fts WHERE source_id=?').run(item.id);
          db.prepare('DELETE FROM capability_package_fts WHERE source_id=?').run(item.id);
          db.prepare('DELETE FROM capability_source WHERE id=?').run(item.id);
        }
        // Source-anchored semantic links are derived, while semantic_id
        // and its history belong to the versioned semantic registry.
        db.exec('DELETE FROM semantic_link');
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } catch (error) { throw storageFailure(error); }
    finally { if (db) db.close(); }
    unregisterProject(root, identity);
    // Generated wiki is rebuildable, and may contain revoked source text.
    safeStorage();
    try { rmSync(wikiDir, { recursive: true, force: true }); }
    catch (error) { throw storageFailure(error); }
    return true;
  }
  function index({ force = false } = {}) {
    return withDatabase(db => indexWorkspace({
      root, db, projects: projectsForIndex(root),
      options: { force: Boolean(force), maxFileBytes: MAX_FILE_BYTES, useGit: true, ignores: [] },
    }), 'source.index');
  }
  function search({ query, project, limit = 20, offset = 0 } = {}) {
    return withDatabase(db => searchContent(db, { query, project, limit: Math.min(100, Math.max(0, Number(limit) || 0)), offset }));
  }
  function symbols({ query, project, limit = 30 } = {}) {
    return withDatabase(db => searchSymbols(db, { query, project, limit: Math.min(100, Math.max(0, Number(limit) || 0)) }));
  }
  function files({ query, project, limit = 50 } = {}) {
    return withDatabase(db => findFiles(db, { query, project, limit: Math.min(100, Math.max(0, Number(limit) || 0)) }));
  }
  function context({ task, project, budgetTokens = 6000, maxFiles = 24, sourceSemanticIds = [] } = {}) {
    return withDatabase(db => composeContext(db, {
      task, project, sourceSemanticIds, budgetTokens: Math.min(MAX_CONTEXT_TOKENS, Math.max(0, Number(budgetTokens) || 0)),
      maxFiles: Math.min(100, Math.max(0, Number(maxFiles) || 0)),
    }), 'source.context', true);
  }
  function verifyContext(bundle) {
    return withDatabase((db, registered) => {
      const sources = Array.isArray(bundle?.sources) ? bundle.sources : [];
      const scoped = sources.map(source => {
        if (!source?.project || !source?.path) throw new Error('HQ_CONTEXT_SOURCE_REQUIRED');
        const path = relativeSourcePath(source.path);
        const file = db.prepare('SELECT f.abs_path FROM files f JOIN projects p ON p.id=f.project_id WHERE p.name=? AND f.path=?').get(source.project, path);
        if (!file) throw new Error('HQ_CONTEXT_SOURCE_NOT_INDEXED');
        return { ...source, absPath: authorizedFile(source.project, path, file.abs_path, registered) };
      });
      return verifyHqContext({ ...bundle, sources: scoped });
    }, 'source.context', true);
  }
  function graph({ kind = 'projects', project, target, depth = 3 } = {}) {
    return withDatabase(db => {
      if (kind === 'projects') return projectGraph(db);
      if (kind === 'deps') return deps(db, { project, target, depth });
      if (kind === 'impact') return impact(db, { project, target, depth });
      throw new Error('HQ_UNSUPPORTED_GRAPH_QUERY');
    });
  }
  function wiki({ force = false, maxFilePages = MAX_WIKI_PAGES } = {}) {
    return withDatabase(db => buildWiki({
      db, root, projects: projectsForIndex(root),
      outDir: wikiDir, force: Boolean(force),
      maxFilePages: Math.min(MAX_WIKI_PAGES, Math.max(0, Number(maxFilePages) || 0)),
    }), 'source.wiki', true);
  }
  function indexWatermarks() {
    return withDatabase((db, records) => db.prepare(
      'SELECT name, head, branch, indexed_at, file_count, symbol_count FROM projects ORDER BY name'
    ).all().map(row => {
      const entry = records.find(item => item.name === row.name);
      const sourceRoot = storedRoot(entry);
      const currentRevision = gitHead(sourceRoot);
      return {
        sourceId: stableSourceId(sourceRoot), project: row.name, domain: DEVELOPMENT_DOMAIN,
        projectRevision: row.head, currentRevision,
        indexWatermark: row.indexed_at, files: row.file_count, symbols: row.symbol_count,
        // Equal Git HEAD is not proof that uncommitted files are current.
        freshness: !row.indexed_at ? 'unindexed'
          : row.head && currentRevision && row.head !== currentRevision
            ? 'revision_changed' : (!row.head || !currentRevision)
              ? 'unversioned_not_file_verified' : 'head_only_not_file_verified',
      };
    }), 'source.status');
  }
  function sourceEvidence({ project, path, startLine = 1, endLine = 60 } = {}) {
    if (!project || !path) throw new Error('HQ_SOURCE_REF_REQUIRED');
    const rel = relativeSourcePath(path);
    return withDatabase((db, records) => {
      const row = db.prepare(
        'SELECT f.*, p.head AS project_head, p.indexed_at AS index_watermark'
        + ' FROM files f JOIN projects p ON p.id=f.project_id WHERE p.name=? AND f.path=?'
      ).get(project, rel);
      if (!row) return { schema: DEV_SOURCE_EVIDENCE_CONTRACT, status: 'unavailable', project, path: rel };
      const absolute = authorizedFile(project, rel, row.abs_path, records);
      if (statSync(absolute).size > MAX_FILE_BYTES) {
        return { schema: DEV_SOURCE_EVIDENCE_CONTRACT, status: 'oversized', project, path: rel };
      }
      const buffer = readFileSync(absolute);
      const indexedHash = row.hash || null;
      const currentHash = sha256(buffer);
      const sourceRoot = storedRoot(records.find(item => item.name === project));
      const currentRevision = gitHead(sourceRoot);
      const stale = currentHash !== indexedHash
        || Boolean(row.project_head && currentRevision && row.project_head !== currentRevision);
      const lines = buffer.toString('utf8').split(/\r?\n/u);
      const from = Math.max(1, Math.min(lines.length, Math.trunc(Number(startLine) || 1)));
      const to = Math.max(from, Math.min(lines.length, from + 499, Math.trunc(Number(endLine) || 60)));
      return {
        schema: DEV_SOURCE_EVIDENCE_CONTRACT, status: stale ? 'stale' : 'indexed',
        domain: DEVELOPMENT_DOMAIN, sourceId: String(project) + ':' + rel,
        devSourceId: stableSourceId(sourceRoot), project, path: rel,
        projectRevision: row.project_head, currentRevision,
        indexWatermark: row.index_watermark, indexedHash, currentHash,
        lineStart: from, lineEnd: to, text: lines.slice(from - 1, to).join('\n'),
      };
    }, 'source.read');
  }
  function semanticIds(options = {}) {
    return withDatabase(db => listSemanticIds(db, options));
  }
  function semanticId(id) {
    return withDatabase(db => getSemanticId(db, id));
  }
  function scanCapabilities({ path } = {}) {
    const source = permit('source.capabilities', path);
    if (!loadProjects(root).projects.some(entry => sameDir(storedRoot(entry), source))) {
      throw new Error('HQ_SOURCE_NOT_REGISTERED');
    }
    // Package locks are data, never permission to traverse outside sourceRoot.
    const lock = join(source, 'package-lock.json');
    if (existsSync(lock) && !within(canonicalDir(lock), source)) {
      throw new Error('HQ_SOURCE_SYMLINK_ESCAPE');
    }
    if (existsSync(lock)) {
      const metadata = JSON.parse(readFileSync(lock, 'utf8'));
      for (const key of Object.keys(metadata.packages || {})) {
        if (!key) continue;
        const rel = relativeSourcePath(key);
        if (!within(resolve(source, rel), source)) throw new Error('HQ_SOURCE_ESCAPE');
        const candidate = resolve(source, rel);
        if (existsSync(candidate) && !within(canonicalDir(candidate), source)) {
          throw new Error('HQ_SOURCE_SYMLINK_ESCAPE');
        }
      }
    }
    return withDatabase(db => {
      const snapshot = scanCapabilitySource(source, { id: stableSourceId(source) });
      const result = persistCapabilityScan(db, snapshot);
      return { source: snapshot.source, result };
    });
  }
  function status() {
    const sources = guardedProjects('source.status').map(({ name, path }) => ({ name, sourceId: stableSourceId(storedRoot({ path })) }));
    const index = withDatabase(db => {
      const files = db.prepare('SELECT COUNT(*) AS n FROM files').get().n;
      const symbols = db.prepare('SELECT COUNT(*) AS n FROM symbols').get().n;
      return { files, symbols, capabilities: capabilityStatus(db) };
    });
    return { schema: DEV_INTELLIGENCE_CONTRACT, domain: DEVELOPMENT_DOMAIN, sources, index };
  }
  return Object.freeze({
    contract: DEV_INTELLIGENCE_CONTRACT, domain: DEVELOPMENT_DOMAIN,
    registerSource, removeSource, index, search, symbols, files, context,
    graph, wiki, indexWatermarks, sourceEvidence, semanticIds, semanticId, scanCapabilities, status,
    verifyContext,
  });
}
