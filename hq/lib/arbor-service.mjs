// ARBOR-local HQ development intelligence boundary.
// Owns only rebuildable development index and generated wiki; never Host World.
import { mkdirSync, realpathSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { openDb } from './schema.mjs';
import { dbPath, loadConfig, loadProjects, projectsForIndex, registerProject, unregisterProject } from './registry.mjs';
import { indexWorkspace } from './indexer.mjs';
import { searchContent, searchSymbols, findFiles } from './search.mjs';
import { composeContext, verifyContext } from './context.mjs';
import { deps, impact, projectGraph } from './graph.mjs';
import { buildWiki } from './wiki.mjs';
import { listSemanticIds, getSemanticId } from './semantic-registry.mjs';
import { scanCapabilitySource, persistCapabilityScan, capabilityStatus } from './capabilities.mjs';

export const DEV_INTELLIGENCE_CONTRACT = 'arbor.dev-intelligence/1';
export const DEVELOPMENT_DOMAIN = 'development';
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
export function createDevIntelligence({ dataDir = defaultDevDataDir(), approvedRoots = [] } = {}) {
  if (!Array.isArray(approvedRoots)) throw new TypeError('approvedRoots must be an array');
  const root = resolve(dataDir);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const canonicalRoot = canonicalDir(root);
  const approved = approvedRoots.map(canonicalDir);
  if (approved.some(path => sameDir(path, canonicalRoot))) throw new Error('HQ_DATA_DIR_NOT_SOURCE');
  function requireApproved(path) {
    const candidate = canonicalDir(path);
    if (!approved.some(grant => sameDir(grant, candidate))) {
      throw new Error('HQ_SOURCE_NOT_APPROVED');
    }
    return candidate;
  }
  function guardedProjects() {
    const records = loadProjects(canonicalRoot).projects;
    for (const record of records) requireApproved(isAbsolute(record.path) ? record.path : resolve(canonicalRoot, record.path));
    return records;
  }
  function withDatabase(fn) {
    guardedProjects();
    const db = openDb(dbPath(canonicalRoot, loadConfig(canonicalRoot)));
    try { return fn(db); } finally { db.close(); }
  }
  function registerSource({ name, path }) {
    const resolved = requireApproved(path);
    ensureName(name);
    return registerProject(canonicalRoot, { name, path: resolved, tags: ['development'] });
  }
  function removeSource(name) {
    const value = ensureName(name);
    guardedProjects();
    // Purge index rows before unregistering to prevent revoked source retrieval.
    const deleted = withDatabase(db => {
      const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(value);
      if (row) db.prepare('DELETE FROM projects WHERE id = ?').run(row.id);
      return Boolean(row);
    });
    const unregistered = unregisterProject(canonicalRoot, value);
    return deleted || unregistered;
  }
  function index({ force = false } = {}) {
    const projects = guardedProjects();
    return withDatabase(db => indexWorkspace({
      root: canonicalRoot, db, projects: projectsForIndex(canonicalRoot),
      options: { force: Boolean(force), maxFileBytes: MAX_FILE_BYTES, useGit: true, ignores: [] },
    }));
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
  function context({ task, project, budgetTokens = 6000, maxFiles = 24 } = {}) {
    return withDatabase(db => composeContext(db, {
      task, project, budgetTokens: Math.min(MAX_CONTEXT_TOKENS, Math.max(0, Number(budgetTokens) || 0)),
      maxFiles: Math.min(100, Math.max(0, Number(maxFiles) || 0)),
    }));
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
      db, root: canonicalRoot, projects: projectsForIndex(canonicalRoot),
      outDir: join(canonicalRoot, 'wiki'), force: Boolean(force),
      maxFilePages: Math.min(MAX_WIKI_PAGES, Math.max(0, Number(maxFilePages) || 0)),
    }));
  }
  function indexWatermarks() {
    return withDatabase(db => db.prepare(
      'SELECT name, head, branch, indexed_at, file_count, symbol_count FROM projects ORDER BY name'
    ).all());
  }
  function sourceEvidence({ project, path, startLine = 1, endLine = 60 } = {}) {
    if (!project || !path) throw new Error('HQ_SOURCE_REF_REQUIRED');
    return withDatabase(db => {
      const row = db.prepare(
        'SELECT f.*, p.head AS project_head, p.indexed_at AS index_watermark'
        + ' FROM files f JOIN projects p ON p.id = f.project_id'
        + ' WHERE p.name = ? AND f.path = ?'
      ).get(project, path);
      if (!row) return { status: 'unavailable', project, path };
      const absolute = canonicalDir(row.abs_path);
      if (!approved.some(dir => sameDir(absolute, dir) || absolute.startsWith(dir + sep))) {
        throw new Error('HQ_SOURCE_NOT_APPROVED');
      }
      if (statSync(absolute).size > MAX_FILE_BYTES) return { status: 'oversized', project, path };
      const lines = readFileSync(absolute, 'utf8').split(/\r?\n/u);
      const from = Math.max(1, Math.min(lines.length, Math.trunc(Number(startLine) || 1)));
      const to = Math.max(from, Math.min(lines.length, from + 499, Math.trunc(Number(endLine) || 60)));
      return {
        schema: 'arbor.dev-source-evidence/1', status: 'indexed', domain: DEVELOPMENT_DOMAIN,
        sourceId: String(project) + ':' + String(path), project, path,
        projectRevision: row.project_head, indexWatermark: row.index_watermark,
        indexedHash: row.sha256 || row.hash || null,
        lineStart: from, lineEnd: to, text: lines.slice(from - 1, to).join('\n'),
      };
    });
  }
  function semanticIds(options = {}) {
    return withDatabase(db => listSemanticIds(db, options));
  }
  function semanticId(id) {
    return withDatabase(db => getSemanticId(db, id));
  }
  function scanCapabilities({ path, id } = {}) {
    const source = requireApproved(path);
    return withDatabase(db => {
      const snapshot = scanCapabilitySource(source, { id });
      const result = persistCapabilityScan(db, snapshot);
      return { source: snapshot.source, result };
    });
  }
  function status() {
    const sources = guardedProjects().map(({ name, path }) => ({ name, path }));
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
