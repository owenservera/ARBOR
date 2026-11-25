// ARBOR-local HQ development intelligence boundary.
// Owns only rebuildable development index and generated wiki; never Host World.
import { mkdirSync, realpathSync, readFileSync, statSync, existsSync, lstatSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { openDb } from './schema.mjs';
import { loadProjects, projectsForIndex, registerProject, unregisterProject } from './registry.mjs';
import { indexWorkspace } from './indexer.mjs';
import { searchContent, searchSymbols, findFiles, isSensitiveSourcePath } from './search.mjs';
import { isVersionedId } from './annotation-v2.mjs';
import { composeContext, verifyContext as verifyHqContext } from './context.mjs';
import { deps, impact, projectGraph } from './graph.mjs';
import { buildWiki } from './wiki.mjs';
import { listSemanticIds, getSemanticId, indexedSemanticAnchors, indexedAnnotationEvidence, annotationResolution } from './semantic-registry.mjs';
import { scanCapabilitySource, persistCapabilityScan, capabilityStatus } from './capabilities.mjs';
import { head as gitHead } from './git.mjs';
import { sha256 } from './util.mjs';
import { exportGraphExchange, importGraphExchange, acknowledgeGraphExport, queryDevelopmentGraph, validDevelopmentGraphRead, SOURCE_NAMESPACE } from './kg-export.mjs';

export const DEV_INTELLIGENCE_CONTRACT = 'arbor.dev-intelligence/1';
export const DEVELOPMENT_DOMAIN = 'development';
export const DEV_SOURCE_EVIDENCE_CONTRACT = 'arbor.dev-source-evidence/1';
const MAX_FILE_BYTES = 1_500_000;
const MAX_CONTEXT_TOKENS = 10000;
const MAX_WIKI_PAGES = 5000;
const SURFACE_SCHEMA = 'vivim.file-surface/1';
const SURFACE_GENERATOR = 'hq.source-index/1';
// Only executable, non-fixture source can appear in this product projection.
// The registered roots are the authority; a path or annotation never grants it.
function surfacePath(path) {
  return !isSensitiveSourcePath(path) &&
    !String(path).split('/').some(part => part.startsWith('.') ||
      /^(?:demo|demo-baseline|test|tests|__tests__|fixtures?|samples?|examples?|evidence|private|secrets?|credentials?|node_modules)(?:$|\.)/i.test(part)) &&
    /\.(?:mjs|cjs|js|mts|cts|ts|tsx|jsx|rs|py|go|java|kt|swift|c|cpp|h|hpp)$/i.test(path);
}
const surfaceKinds = ['v2:type','v2:capability','v2:contract','v2:emits','v2:consumes','v2:action'];


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
    for (const path of [join(root, 'projects.json'), dbDir, database, database + '-wal', database + '-shm', wikiDir, ...['kg-exchange.jsonl','kg-export-state.json','kg-export-state.json.pending','kg-export-state.json.last-export','kg-journal.hqj'].map(n=>join(dbDir,n))]) {
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
  function index({ force = false, useGit = true } = {}) {
    return withDatabase(db => indexWorkspace({
      root, db, projects: projectsForIndex(root),
      options: { force: Boolean(force), maxFileBytes: MAX_FILE_BYTES, useGit: useGit !== false, ignores: [] },
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
        const file = db.prepare('SELECT f.id,f.abs_path,f.hash FROM files f JOIN projects p ON p.id=f.project_id WHERE p.name=? AND f.path=?').get(source.project, path);
        if (!file) throw new Error('HQ_CONTEXT_SOURCE_NOT_INDEXED');
        return { ...source, absPath: authorizedFile(source.project, path, file.abs_path, registered) };
      });
      return verifyIndexedDependencies(db,{ ...bundle, sources: scoped });
    }, 'source.context', true);
  }
  // Recheck registry lifecycle and anchor identity in the same authorized
  // read as the source bytes. A retained bundle cannot attest to itself.
  function verifyIndexedDependencies(db,bundle){
    const proof=verifyHqContext(bundle);
    const changed=new Set(proof.changed);
    for(const source of bundle.sources||[]){
      if(!source.contentHash)continue;
      const row=db.prepare('SELECT f.id,f.hash FROM files f JOIN projects p ON p.id=f.project_id WHERE p.name=? AND f.path=?').get(source.project,source.path);
      if(!row||row.hash!==source.contentHash){changed.add(source.ref);continue;}
      const anchors=indexedSemanticAnchors(db,{fileId:row.id,project:source.project,path:source.path,hash:row.hash});
      for(const reference of source.semanticReferences||[]){
        const anchor=anchors.find(a=>a.semanticId===reference.semanticId&&a.annotationKind===reference.annotationKind&&a.lines.includes(reference.line));
        const {resolution}=annotationResolution(db,reference.semanticId,reference.annotationKind);
        if(!anchor||resolution!==reference.resolution||
          (reference.semanticAnchor&&(reference.semanticAnchor.anchorId!==anchor.anchorId||
            reference.semanticAnchor.fingerprint!==anchor.fingerprint||
            reference.semanticAnchor.state!==anchor.state)))changed.add(source.ref);
      }
    }
    return {...proof,valid:proof.valid&&changed.size===0,changed:[...changed].sort()};
  }
  function graph({ kind = 'projects', project, target, depth = 3 } = {}) {
    return withDatabase(db => {
      if (kind === 'projects') return projectGraph(db);
      if (kind === 'deps') return deps(db, { project, target, depth });
      if (kind === 'impact') return impact(db, { project, target, depth });
      throw new Error('HQ_UNSUPPORTED_GRAPH_QUERY');
    });
  }
  // Same development index and same Rust journal as HQ kg sync.
  // Only registered, approved source roots are admitted; nothing from World.
  function syncNativeGraph() {
    return withDatabase(db => {
      const outPath=join(dbDir,'kg-exchange.jsonl');
      const statePath=join(dbDir,'kg-export-state.json');
      const journal=join(dbDir,'kg-journal.hqj');
      const exported=exportGraphExchange({db,outPath,statePath});
      const imported=importGraphExchange({root,journal,exchange:outPath,
        namespace:SOURCE_NAMESPACE,expectedDigest:exported.digest});
      if(!imported.ok)return {schema:'hqkg.development-sync/1',state:'unavailable',
        reason:imported.reason,exported:exported.stats,imported:false};
      const ack=acknowledgeGraphExport({statePath,digest:exported.digest,
        acknowledgment:{epochBefore:imported.epochBefore,epochAfter:imported.epochAfter,
          stats:imported.statsLine??undefined}});
      if(!ack.acked)return {schema:'hqkg.development-sync/1',state:'unavailable',
        reason:ack.reason,exported:exported.stats,imported:true,acked:false};
      return {schema:'hqkg.development-sync/1',state:'source-backed',
        epoch:imported.epochAfter,exported:exported.stats,imported:true,acked:true};
    },'source.index',true);
  }
  function nativeGraphQuery(input={}) {
    if(!validDevelopmentGraphRead(input))throw new Error('HQ_GRAPH_QUERY_INVALID');
    return withDatabase(db => {
      return queryDevelopmentGraph({root,journal:join(dbDir,'kg-journal.hqj'),...input});
    },'source.read',true);
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
      // Git-independent source admission: a source's evidence is current when its
      // indexed content hash matches the live bytes. Git HEAD is never a freshness
      // grant here, so no second journal or parallel interpreter is introduced.
      const stale = currentHash !== indexedHash;
      const lines = buffer.toString('utf8').split(/\r?\n/u);
      const from = Math.max(1, Math.min(lines.length, Math.trunc(Number(startLine) || 1)));
      const to = Math.max(from, Math.min(lines.length, from + 499, Math.trunc(Number(endLine) || 60)));
      return {
        schema: DEV_SOURCE_EVIDENCE_CONTRACT, status: stale ? 'stale' : 'indexed',
        domain: DEVELOPMENT_DOMAIN, sourceId: String(project) + ':' + rel,
        devSourceId: stableSourceId(sourceRoot), project, path: rel,
        projectRevision: row.project_head,
        indexWatermark: row.index_watermark, indexedHash, currentHash,
        lineStart: from, lineEnd: to, text: lines.slice(from - 1, to).join('\n'),
      };
    }, 'source.read');
  }
  // Read the existing annotations/files/imports tables. No filesystem crawler,
  // separate cache, or second registration store is introduced.
  function projectSurfaces(db, records, { project, query = '', path, ids = [], limit = 24 } = {}) {
    if (project != null) ensureName(project);
    if (typeof query !== 'string' || query.length > 240 || ids.length > 12)
      throw new Error('HQ_SOURCE_QUERY_INVALID');
    const cap = Math.max(1, Math.min(48, Math.trunc(Number(limit)) || 24));
    const exactPath = path == null ? null : relativeSourcePath(path);
    const where = ["f.kind='source'", 'f.is_generated=0', 'f.is_test=0', 'f.size<=?',
      `EXISTS (SELECT 1 FROM annotations a WHERE a.file_id=f.id AND a.ref IS NOT NULL
        AND a.kind IN (${surfaceKinds.map(() => '?').join(',')}))`];
    const args = [MAX_FILE_BYTES, ...surfaceKinds];
    if (project) { where.push('p.name=?'); args.push(project); }
    if (exactPath) { where.push('f.path=?'); args.push(exactPath); }
    if (query.trim()) {
      where.push(`(instr(lower(f.path),lower(?))>0
        OR EXISTS (SELECT 1 FROM annotations a WHERE a.file_id=f.id AND a.ref=? AND a.kind LIKE 'v2:%')
        OR EXISTS (SELECT 1 FROM symbols s WHERE s.file_id=f.id AND instr(lower(s.name),lower(?))>0))`);
      args.push(query.trim(), query.trim(), query.trim());
    }
    if (ids.length) {
      where.push(`EXISTS (SELECT 1 FROM annotations a WHERE a.file_id=f.id AND a.kind LIKE 'v2:%'
        AND a.ref IN (${ids.map(() => '?').join(',')}))`);
      args.push(...ids);
    }
    const rows = db.prepare(`SELECT f.*, p.name AS project, p.indexed_at AS watermark, p.head AS project_revision
      FROM files f JOIN projects p ON p.id=f.project_id WHERE ${where.join(' AND ')}
      ORDER BY p.name,f.path LIMIT 257`).all(...args);
    const tags = db.prepare(`SELECT line,kind,ref FROM annotations WHERE file_id=?
      AND kind IN (${surfaceKinds.map(() => '?').join(',')}) AND ref IS NOT NULL
      ORDER BY line,kind,ref LIMIT 65`);
    const imports = db.prepare(`SELECT i.line,f.path,p.name AS project FROM imports i
      JOIN files f ON f.id=i.resolved_file_id JOIN projects p ON p.id=f.project_id
      WHERE i.file_id=? AND f.kind='source' AND f.is_generated=0 AND f.is_test=0
      ORDER BY p.name,f.path,i.line LIMIT 32`);
    const files = [];
    let omitted = false;
    for (const row of rows.slice(0,256)) {
      if (!surfacePath(row.path) || !row.hash) continue;
      if (files.length >= cap) { omitted = true; break; }
      let currentHash = null;
      try {
        const absolute = authorizedFile(row.project, row.path, row.abs_path, records);
        if (statSync(absolute).size <= MAX_FILE_BYTES) currentHash = sha256(readFileSync(absolute));
      } catch { /* missing or revoked path never serves source metadata */ continue; }
      if (!currentHash) continue;
      const observations = tags.all(row.id, ...surfaceKinds)
        .filter(tag => isVersionedId(tag.ref) && tag.ref.length <= 160);
      const anchors=indexedSemanticAnchors(db,{fileId:row.id,project:row.project,path:row.path,hash:row.hash});
      const annotations = observations.slice(0,64).map(tag => {
        const kind = tag.kind.slice(3);
        const {resolution}=annotationResolution(db,tag.ref,kind);
        const anchor=anchors.find(a=>a.semanticId===tag.ref&&a.annotationKind===kind);
        return { semanticId: tag.ref, kind, line: tag.line,resolution,
          semanticAnchor:anchor??null,
          evidence:indexedAnnotationEvidence(anchor,resolution,{live:true,stale:row.hash!==currentHash}) };
      });
      if (!annotations.length) continue;
      const semanticIds = [...new Set(annotations.map(a => a.semanticId))].sort();
      const fresh = row.hash === currentHash;
      const relationships = [
        ...annotations.filter(a => ['emits','consumes'].includes(a.kind))
          .map(a => ({ kind: a.kind, semanticId: a.semanticId, line: a.line })),
        ...imports.all(row.id).filter(i => surfacePath(i.path))
          .map(i => ({ kind: 'imports', ref: i.project + ':' + i.path, line: i.line })),
      ];
      files.push({
        project: row.project, path: row.path, sourceId: row.project + ':' + row.path,
        surface: 'Indexed executable source',
        commentIds: semanticIds, actionIds: annotations.filter(a => a.kind === 'action').map(a => a.semanticId),
        annotations, relationships, annotationTruncated: observations.length > 64,
        generatorVersion: SURFACE_GENERATOR, sourceDigest: row.hash, currentDigest: currentHash,
        freshness: fresh ? 'indexed' : 'stale', indexWatermark: row.watermark,
        projectRevision: row.project_revision ?? null,
      });
    }
    return { schema: SURFACE_SCHEMA, generatorVersion: SURFACE_GENERATOR,
      status: !files.length ? 'empty' : files.every(file => file.freshness === 'indexed') ? 'indexed' : 'stale', authority: 'read_only_projection',
      truncated: omitted || rows.length > 256, files };
  }
  function fileSurface(options = {}) {
    return withDatabase((db, records) => projectSurfaces(db, records, options));
  }
  function fileSurfaceContext({ project, path, task = '', anchorId, fingerprint } = {}) {
    ensureName(project);
    const exact=anchorId!==undefined||fingerprint!==undefined;
    if (!path || typeof task !== 'string' || task.length > 1000 ||
        (exact&&(!/^hq:file-anchor:[a-f0-9]{64}$/.test(anchorId||'')||! /^[a-f0-9]{64}$/.test(fingerprint||''))))
      throw new Error('HQ_SOURCE_QUERY_INVALID');
    return withDatabase((db, records) => {
      const selected = projectSurfaces(db, records, { project, path, limit: 1 }).files[0];
      if (!selected || selected.freshness !== 'indexed')
        return { schema: 'vivim.source-context/1', status: selected ? 'stale' : 'empty', context: null };
      const exactAnchor=exact?selected.annotations.find(a=>a.semanticAnchor?.anchorId===anchorId&&
        a.semanticAnchor.fingerprint===fingerprint&&a.semanticAnchor.state==='indexed'&&
        a.evidence?.assurance==='verified'&&!a.evidence.conflict&&!['invalid_kind','deprecated'].includes(a.resolution)):null;
      if(exact&&!exactAnchor)return {schema:'vivim.source-context/1',status:'stale',context:null};
      const ids = exact?[exactAnchor.semanticId]:selected.commentIds.slice(0,12);
      const related = (exact?[]:projectSurfaces(db, records, { project, ids, limit: 16 }).files)
        .filter(file => file.freshness === 'indexed');
      const observed = new Map([...related, selected].map(file => [file.sourceId, file]));
      const allowedSourceRefs = new Set(observed.keys());
      const anchor = exactAnchor??selected.annotations.find(a => ['emits','consumes','action','capability'].includes(a.kind) && ids.includes(a.semanticId))
        ?? selected.annotations.find(a => ids.includes(a.semanticId));
      const preferredSemanticAnchor = { ref: selected.sourceId, line: anchor.line, semanticId: anchor.semanticId };
      const bundle = composeContext(db, { task: task.trim() || 'Explain ' + selected.path,
        project, sourceSemanticIds: ids, allowedSourceRefs, preferredSemanticAnchor, budgetTokens: 5000, maxFiles: exact?1:16 });
      // Reject ranked free-text fallback or a changed source. Every returned
      // excerpt must be grounded in the same verified indexed bytes.
      if (!bundle.sources.some(source => source.ref === selected.sourceId &&
            source.semanticReferences?.some(ref => ref.line === anchor.line && ref.semanticId === anchor.semanticId&&
              (!exact||(ref.semanticAnchor?.anchorId===anchorId&&ref.semanticAnchor.fingerprint===fingerprint)))) ||
          bundle.sources.some(source => source.contentHash !== observed.get(source.ref)?.sourceDigest ||
            !source.contentHash) || !verifyIndexedDependencies(db,bundle).valid)
        return { schema: 'vivim.source-context/1', status: 'unavailable', context: null };
      // Re-read the exact anchor after context construction, including registry lifecycle.
      if(exact){const head=projectSurfaces(db,records,{project,path,limit:1}).files[0];
        if(!head||head.freshness!=='indexed'||head.sourceDigest!==selected.sourceDigest||
          !head.annotations.some(a=>a.semanticAnchor?.anchorId===anchorId&&a.semanticAnchor.fingerprint===fingerprint&&
            a.resolution===anchor.resolution&&a.evidence?.assurance==='verified'&&!a.evidence.conflict))
          return {schema:'vivim.source-context/1',status:'stale',context:null};
      }
      // Machine-local absolute paths are not part of the context digest.
      const sources = bundle.sources.map(({ absPath, ...source }) => source);
      const { vivim, ...publicBundle } = bundle;
      return { schema: 'vivim.source-context/1', status: 'indexed',
        sourceId: selected.sourceId, sourceDigest: selected.sourceDigest,
        ...(exact?{anchor:{anchorId,fingerprint,line:anchor.line,semanticId:anchor.semanticId,resolution:anchor.resolution,authority:'read_only_projection'}}:{}),
        context: { ...publicBundle, sources } };
    }, 'source.context');
  }
  // Compile only current, authorized, executable sources carrying an exact
  // contract identity. Free-text relevance ranks within that scope, never grants it.
  function compiledContext({ task, sourceSemanticIds = [], budgetTokens=2400 } = {}) {
    if (typeof task !== 'string' || !task.trim() || task.length > 1000 ||
        !Array.isArray(sourceSemanticIds) || sourceSemanticIds.length < 1 ||
        sourceSemanticIds.length > 12 || sourceSemanticIds.some(id =>
          typeof id !== 'string' || id.length > 160 || !isVersionedId(id)))
      throw new Error('HQ_SOURCE_QUERY_INVALID');
    const ids = [...new Set(sourceSemanticIds)].sort();
    if(!Number.isSafeInteger(budgetTokens)||budgetTokens<0||budgetTokens>2400)throw new Error('HQ_SOURCE_QUERY_INVALID');
    const none = (status,packet) => ({ schema: 'vivim.source-context/1', status, context: null,
      ...(packet?{semanticPacket:packet}:{}) });
    return withDatabase((db, records) => {
      const surface=projectSurfaces(db, records, { ids, limit: 16 });
      if(surface.truncated)return none('incomplete');
      const matches=surface.files;
      const fresh = matches.filter(file => file.freshness === 'indexed');
      if (!fresh.length) return none(matches.length ? 'stale' : 'incomplete');
      const observed = new Map(fresh.map(file => [file.sourceId, file]));
      const bundle = composeContext(db, { task, sourceSemanticIds: ids,
        allowedSourceRefs: new Set(observed.keys()), budgetTokens,
        reservedForOutput: Math.min(400,budgetTokens), maxFiles: 3, requireSemanticCoverage:true });
      if(bundle.semanticPacket?.status!=='complete')return none(bundle.semanticPacket?.status??'incomplete',bundle.semanticPacket);
      if (!bundle.sources.length) return none('incomplete');
      if (bundle.sources.some(source => !source.contentHash ||
          source.contentHash !== observed.get(source.ref)?.sourceDigest ||
          !source.semanticReferences?.some(ref => ids.includes(ref.semanticId))) ||
          !verifyIndexedDependencies(db,bundle).valid) return none('unavailable');
      // Verify full file identity, not merely the selected excerpt, once more.
      for (const source of bundle.sources) {
        const current = projectSurfaces(db, records, { project:source.project,
          path:source.path, limit:1 }).files[0];
        if (!current || current.freshness !== 'indexed' ||
            current.sourceDigest !== source.contentHash || source.semanticReferences.some(r=>
              !current.annotations.some(a=>a.semanticId===r.semanticId&&a.kind===r.annotationKind&&a.line===r.line&&
                a.semanticAnchor?.fingerprint===r.semanticAnchor?.fingerprint&&a.evidence.assurance==='verified'&&
                a.resolution===r.resolution))) return none('stale');
      }
      const { vivim, ...publicBundle } = bundle;
      return { schema:'vivim.source-context/1', status:'indexed',
        context: { ...publicBundle, sources:bundle.sources.map(({absPath,...source})=>source) } };
    }, 'source.context');
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
    graph, syncNativeGraph, nativeGraphQuery, wiki, indexWatermarks, sourceEvidence, fileSurface, fileSurfaceContext, compiledContext, semanticIds, semanticId, scanCapabilities, status,
    verifyContext,
  });
}
