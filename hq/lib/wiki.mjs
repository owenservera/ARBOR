// hq/lib/wiki.mjs — deterministic, incremental code + documentation wiki.
//
// One call turns the indexed workspace into a complete Markdown wiki plus a
// self-contained browser page. Nothing leaves the machine, no external assets
// are referenced, and every array is sorted before it is rendered so the same
// index always produces byte-identical pages.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, posix, relative } from 'node:path';
import { componentOf, languageLabel } from './lang.mjs';
import { glossaryMarkdown, VIVIM_TAXONOMY } from './nomenclature.mjs';
import { sessionRows, sessionTimeline, toolUsage } from './session-views.mjs';
import { digestOf, toPosix, tokenize, truncate, sha256 } from './util.mjs';
import { indexedSemanticAnchors, indexedAnnotationEvidence, annotationResolution } from './semantic-registry.mjs';
import { isSensitiveSourcePath } from './search.mjs';
import { buildActions } from './action-registry.mjs';
import { VERBS } from './actions/verbs.mjs';
import { DOMAINS as ACTION_DOMAINS_1 } from './actions/domains-1.mjs';
import { DOMAINS as ACTION_DOMAINS_2 } from './actions/domains-2.mjs';
import { DOMAINS as ACTION_DOMAINS_3 } from './actions/domains-3.mjs';
import { DOMAINS as ACTION_DOMAINS_4 } from './actions/domains-4.mjs';
import { HANDLERS } from './actions/handlers.mjs';

const WIKI_VERSION = 1;
const MAX_SEARCH_TOKENS = 60;

const SECRET_BASENAMES = new Set([
  'session.json',
  'storage-state.json',
  'release-profile.json',
  'cookies',
  'login data',
]);

// Secret files never reach any page, symbol table, search entry or graph.
function isSecretPath(filePath) {
  const p = toPosix(filePath).toLowerCase();
  const base = p.split('/').pop() || '';
  if (!base) return false;
  if (base.startsWith('.env')) return true;
  if (base.endsWith('.keystore')) return true;
  return SECRET_BASENAMES.has(base);
}

function cmpStr(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  return left < right ? -1 : left > right ? 1 : 0;
}

function pushMap(map, key, value) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function countBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Prose text: collapse whitespace and escape HTML entities.
function mdText(value, max = 400) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return escapeHtml(truncate(text, max));
}

// Table cell: same as prose plus escaped pipes and backslashes.
function mdCell(value, max = 240) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return escapeHtml(truncate(text, max)).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

function codeSpan(value, max = 240) {
  const text = truncate(String(value ?? '').replace(/\s+/g, ' ').trim(), max);
  if (!text) return '—';
  const escaped = escapeHtml(text);
  const runs = escaped.match(/`+/g) || [];
  let longest = 0;
  for (const run of runs) longest = Math.max(longest, run.length);
  const fence = '`'.repeat(longest + 1);
  return `${fence}${escaped}${fence}`;
}

function makeTable(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}`;
}

function dateOnly(value) {
  const text = String(value ?? '');
  if (!text) return '—';
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function slug(value) {
  const text = toPosix(String(value ?? '')).trim();
  const cleaned = text.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'x';
}

// Deterministic, collision-free path segments for an unsorted list of names.
function assignSegments(names) {
  const map = new Map();
  const used = new Set();
  for (const name of [...names].sort(cmpStr)) {
    const base = slug(name);
    let candidate = base;
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    used.add(candidate.toLowerCase());
    map.set(name, candidate);
  }
  return map;
}

function relLink(fromPath, toPath) {
  let rel = posix.relative(posix.dirname(fromPath), toPath);
  if (!rel) rel = posix.basename(toPath);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

function packageRoot(specifier) {
  const spec = String(specifier ?? '');
  if (!spec || spec.startsWith('.') || spec.startsWith('/') || spec.includes('\\')) return null;
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0] || null;
}

function fenceFor(text) {
  const runs = String(text ?? '').match(/`+/g) || [];
  let longest = 0;
  for (const run of runs) longest = Math.max(longest, run.length);
  return '`'.repeat(Math.max(3, longest + 1));
}

// ---------------------------------------------------------------------------
// Capability registry projection: inventory, licences, candidate mappings and
// proposed contracts only. Document bodies are never read or rendered, and a
// candidate row is never presented as an approval.
// ---------------------------------------------------------------------------

function sqliteTableExists(db, name) {
  try {
    return Boolean(
      db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?").get(name),
    );
  } catch {
    return false;
  }
}

// Canonical semantic registry projection: the identity rows and their source
// links. A link is only rendered with the bytes it was pinned to, so a stale
// link can never be presented as a current source of truth.
function loadSemanticModel(db) {
  if (!sqliteTableExists(db, 'semantic_id')) return [];
  const ids = db
    .prepare('SELECT id, kind, name, version, label, description, status, authority, provenance, created_at FROM semantic_id ORDER BY id')
    .all();
  const links = sqliteTableExists(db, 'semantic_link')
    ? db
      .prepare('SELECT id, semantic_id, path, line, symbol, content_hash, kind, status, observed_at FROM semantic_link ORDER BY id')
      .all()
    : [];
  const byId = new Map();
  for (const row of ids) byId.set(row.id, { ...row, links: [] });
  for (const link of links) {
    const target = byId.get(link.semantic_id);
    if (target) target.links.push(link);
  }
  return [...byId.values()];
}

// The canonical HQ action registry. This is the ONE command catalogue; the wiki
// reads it and never keeps a second copy of the command surface.
function loadCommandModel() {
  try {
    const actions = buildActions({
      domains: [...ACTION_DOMAINS_1, ...ACTION_DOMAINS_2, ...ACTION_DOMAINS_3, ...ACTION_DOMAINS_4],
      verbs: VERBS,
      handlers: HANDLERS,
    });
    return actions.map((action) => ({
      id: action.id,
      domain: action.domain,
      verb: action.verb,
      object: action.object,
      purpose: action.purpose,
      status: action.status,
      risk: action.risk,
      mutates: action.mutates,
      approval: action.approval,
      actors: action.actors,
      command: action.handler?.command ?? null,
      note: action.handler?.note ?? null,
    }));
  } catch {
    return [];
  }
}

function safeJsonList(value) {
  try {
    const parsed = JSON.parse(String(value ?? '[]'));
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

function loadSessionModel(db) {
  if (!sqliteTableExists(db, 'sessions')) return null;
  try {
    const rows = sessionRows(db, { limit: 500 });
    if (!rows.length) return { rows, days: [], tools: [], totals: null };
    const days = sessionTimeline(db, { limit: 60 });
    const tools = toolUsage(db);
    const totals = rows.reduce(
      (acc, row) => ({
        sessions: acc.sessions + 1,
        messages: acc.messages + row.messages,
        toolCalls: acc.toolCalls + row.toolCalls,
        cost: acc.cost + (row.cost ?? 0),
      }),
      { sessions: 0, messages: 0, toolCalls: 0, cost: 0 },
    );
    totals.cost = Number(totals.cost.toFixed(6));
    return { rows, days, tools, totals };
  } catch {
    return null;
  }
}

function loadCapabilityModel(db) {
  const required = ['capability_source', 'capability_package', 'capability_map', 'capability_contract'];
  if (!required.every((name) => sqliteTableExists(db, name))) return null;
  try {
    const sources = db
      .prepare(
        `SELECT id, package_count AS packages, file_count AS files, document_count AS documents,
                bytes, digest, status
         FROM capability_source ORDER BY id`,
      )
      .all();
    const licenses = db
      .prepare(
        `SELECT source_id AS sourceId, COALESCE(NULLIF(license, ''), 'UNKNOWN') AS license,
                COUNT(*) AS packages
         FROM capability_package
         GROUP BY source_id, COALESCE(NULLIF(license, ''), 'UNKNOWN')
         ORDER BY source_id, license`,
      )
      .all();
    const mappings = db
      .prepare(
        `SELECT m.node_id AS nodeId, p.name, p.version, m.score, m.status
         FROM capability_map m
         JOIN capability_package p
           ON p.source_id = m.source_id AND p.install_path = m.install_path
         ORDER BY m.node_id, m.score DESC, p.name, p.version, m.install_path`,
      )
      .all();
    const contracts = db
      .prepare(
        `SELECT id, version, node_id AS nodeId, title, effects, scopes, status, authority,
                owner_confirmed AS ownerConfirmed
         FROM capability_contract
         WHERE status = 'proposed'
         ORDER BY id, version`,
      )
      .all();
    const approved = db
      .prepare('SELECT COUNT(*) AS n FROM capability_contract WHERE owner_confirmed = 1')
      .get().n;
    const totalContracts = db.prepare('SELECT COUNT(*) AS n FROM capability_contract').get().n;
    return { sources, licenses, mappings, contracts, approved, totalContracts };
  } catch {
    // A partially migrated database renders the explanatory page instead of
    // failing the whole wiki build.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Model loading: one pass over the index, secrets removed, sorted everywhere.
// ---------------------------------------------------------------------------

function loadModel(db, root, projects, maxFilePages) {
  const wanted = Array.isArray(projects)
    ? new Set(projects.map((p) => (typeof p === 'string' ? p : p && p.name)).filter(Boolean))
    : null;

  let projectRows = db.prepare('SELECT * FROM projects ORDER BY name').all();
  if (wanted && wanted.size) projectRows = projectRows.filter((row) => wanted.has(row.name));

  const projectIds = projectRows.map((row) => row.id);
  const projectById = new Map(projectRows.map((row) => [row.id, row]));
  const projectNames = projectRows.map((row) => row.name);

  const model = {
    root,
    workspaceName: basename(toPosix(root)) || 'workspace',
    projectRows,
    projectById,
    projectNames,
    projects: [],
    allFiles: [],
    fileById: new Map(),
    symbols: [],
    importRows: [],
    annotationRows: [],
    inDegree: new Map(),
    dependents: new Map(),
    commitRows: [],
    generatedAt: 'unknown',
    generatedSource: 'unknown',
    symbolCount: 0,
    capabilities: loadCapabilityModel(db),
    sessions: loadSessionModel(db),
    semanticIds: loadSemanticModel(db),
    commands: loadCommandModel(),
  };
  if (!projectIds.length) return model;

  const placeholders = projectIds.map(() => '?').join(',');

  const fileRowsAll = db
    .prepare(`SELECT * FROM files WHERE project_id IN (${placeholders}) ORDER BY project_id, path`)
    .all(...projectIds);
  const excludedIds = new Set();
  const includedFiles = [];
  for (const file of fileRowsAll) {
    if (isSecretPath(file.path)) excludedIds.add(file.id);
    else includedFiles.push(file);
  }
  for (const file of includedFiles) {
    const project = projectById.get(file.project_id);
    file.project_name = project ? project.name : '';
    file.component = componentOf(file.path, projectNames);
  }
  const fileById = new Map(includedFiles.map((file) => [file.id, file]));

  const symbols = db
    .prepare(`SELECT * FROM symbols WHERE project_id IN (${placeholders}) ORDER BY file_id, line, name`)
    .all(...projectIds)
    .filter((symbol) => !excludedIds.has(symbol.file_id));
  for (const symbol of symbols) {
    const file = fileById.get(symbol.file_id);
    symbol.file_path = file ? file.path : '';
    symbol.project_name = file ? file.project_name : '';
  }

  const importRows = [];
  const rawImports = db
    .prepare(`SELECT * FROM imports WHERE project_id IN (${placeholders}) ORDER BY file_id, line, specifier`)
    .all(...projectIds);
  for (const imp of rawImports) {
    if (excludedIds.has(imp.file_id)) continue;
    const resolvedFile = imp.resolved_file_id ? fileById.get(imp.resolved_file_id) : null;
    const resolvedProject = resolvedFile
      ? projectById.get(resolvedFile.project_id)
      : imp.resolved_project_id
        ? projectById.get(imp.resolved_project_id)
        : null;
    importRows.push({
      ...imp,
      resolved_file_id: resolvedFile ? resolvedFile.id : null,
      resolved_path: resolvedFile ? resolvedFile.path : null,
      resolved_project_id: resolvedFile ? resolvedFile.project_id : imp.resolved_project_id || null,
      resolved_project_name: resolvedProject ? resolvedProject.name : null,
    });
  }

  const annotationRows = db
    .prepare(`SELECT * FROM annotations WHERE project_id IN (${placeholders}) ORDER BY project_id, file_id, line, kind`)
    .all(...projectIds)
    .filter((annotation) => !excludedIds.has(annotation.file_id));
  for (const annotation of annotationRows) {
    const file = fileById.get(annotation.file_id);
    annotation.file_path = file ? file.path : '';
    annotation.project_name = file ? file.project_name : '';
  }

  const commitRows = db
    .prepare(
      `SELECT c.*, p.name AS project_name FROM commits c
       JOIN projects p ON p.id = c.project_id
       WHERE c.project_id IN (${placeholders})
       ORDER BY c.date DESC, c.sha ASC`,
    )
    .all(...projectIds);

  const inDegree = new Map();
  const dependents = new Map();
  for (const imp of importRows) {
    if (!imp.resolved_file_id) continue;
    inDegree.set(imp.resolved_file_id, (inDegree.get(imp.resolved_file_id) || 0) + 1);
    const fromFile = fileById.get(imp.file_id);
    if (fromFile) pushMap(dependents, imp.resolved_file_id, { file: fromFile, specifier: imp.specifier });
  }

  const symbolCount = new Map();
  for (const symbol of symbols) symbolCount.set(symbol.file_id, (symbolCount.get(symbol.file_id) || 0) + 1);

  // Per-file page cap: symbols desc, incoming imports desc, path asc.
  const ranked = includedFiles.slice().sort((a, b) => {
    const bySymbols = (symbolCount.get(b.id) || 0) - (symbolCount.get(a.id) || 0);
    if (bySymbols) return bySymbols;
    const byIncoming = (inDegree.get(b.id) || 0) - (inDegree.get(a.id) || 0);
    if (byIncoming) return byIncoming;
    return cmpStr(a.path, b.path) || cmpStr(a.project_name, b.project_name);
  });
  const cap = Number.isFinite(maxFilePages) ? Math.max(0, Math.floor(maxFilePages)) : 5000;
  const filePageIds = new Set(ranked.slice(0, cap).map((file) => file.id));

  const projectData = projectRows.map((row) => {
    const files = includedFiles.filter((file) => file.project_id === row.id);
    const fileIds = new Set(files.map((file) => file.id));
    const projectSymbols = symbols.filter((symbol) => fileIds.has(symbol.file_id));
    const projectImports = importRows.filter((imp) => fileIds.has(imp.file_id));
    const projectAnnotations = annotationRows.filter((annotation) => fileIds.has(annotation.file_id));
    const projectCommits = commitRows.filter((commit) => commit.project_id === row.id);

    const byFileSymbols = new Map();
    for (const symbol of projectSymbols) pushMap(byFileSymbols, symbol.file_id, symbol);
    const byFileImports = new Map();
    for (const imp of projectImports) pushMap(byFileImports, imp.file_id, imp);
    const byFileAnnotations = new Map();
    for (const annotation of projectAnnotations) pushMap(byFileAnnotations, annotation.file_id, annotation);

    const componentFiles = new Map();
    for (const file of files) pushMap(componentFiles, file.component, file);
    const components = [...componentFiles.keys()].sort(cmpStr).map((name) => ({
      name,
      files: componentFiles.get(name).slice().sort((a, b) => cmpStr(a.path, b.path)),
      symbols: projectSymbols
        .filter((symbol) => {
          const file = fileById.get(symbol.file_id);
          return file && file.component === name;
        })
        .sort((a, b) => cmpStr(a.name, b.name) || cmpStr(a.file_path, b.file_path) || a.line - b.line),
    }));

    const languageMap = new Map();
    for (const file of files) {
      const entry = languageMap.get(file.lang) || { lang: file.lang, files: 0, symbols: 0 };
      entry.files += 1;
      entry.symbols += symbolCount.get(file.id) || 0;
      languageMap.set(file.lang, entry);
    }
    const languages = [...languageMap.values()].sort((a, b) => cmpStr(a.lang, b.lang));

    return {
      row,
      files,
      symbols: projectSymbols,
      imports: projectImports,
      annotations: projectAnnotations,
      commits: projectCommits,
      byFileSymbols,
      byFileImports,
      byFileAnnotations,
      components,
      languages,
      segment: null,
      componentSegment: null,
      modulePages: new Map(),
      filePagePaths: new Map(),
    };
  });

  let generatedAt = 'unknown';
  let generatedSource = 'unknown';
  if (commitRows.length) {
    const newest = commitRows.slice().sort((a, b) => cmpStr(b.date, a.date) || cmpStr(a.sha, b.sha))[0];
    if (newest && newest.date) {
      generatedAt = newest.date;
      generatedSource = 'commit';
    }
  }
  if (generatedSource === 'unknown') {
    let maxMtime = 0;
    for (const file of includedFiles) {
      const mtime = Number(file.mtime_ms) || 0;
      if (mtime > maxMtime) maxMtime = mtime;
    }
    if (maxMtime > 0 && Number.isFinite(new Date(maxMtime).getTime())) {
      generatedAt = new Date(maxMtime).toISOString();
      generatedSource = 'mtime';
    }
  }

  model.projects = projectData;
  model.allFiles = includedFiles;
  model.fileById = fileById;
  model.symbols = symbols;
  model.importRows = importRows;
  model.annotationRows = annotationRows;
  model.inDegree = inDegree;
  model.dependents = dependents;
  model.commitRows = commitRows;
  model.generatedAt = generatedAt;
  model.generatedSource = generatedSource;
  model.symbolCount = symbols.length;
  model.filePageIds = filePageIds;
  return model;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildWiki({ db, root, projects, outDir = 'wiki', force = false, maxFilePages = 5000, graphIndex = null, persistHashes = true } = {}) {
  const started = process.hrtime.bigint();
  if (!db) throw new Error('hq wiki: db is required');

  const workspaceRoot = root || process.cwd();
  const destRoot = isAbsolute(outDir) ? outDir : join(workspaceRoot, outDir);
  const model = loadModel(db, workspaceRoot, projects, maxFilePages);
  // Optional graph read model. When present, semantic identities, registered
  // commands and their source files name their canonical graph node id.
  model.graphIndex = graphIndex;
  const filePageIds = model.filePageIds || new Set();
  const titleCache = new Map();

  const pages = [];
  const pageBy = {
    global: new Map(),
    project: new Map(),
    module: new Map(),
    file: new Map(),
  };

  const dateLabel = () => (model.generatedAt === 'unknown' ? 'unknown' : dateOnly(model.generatedAt));

  function addPage(page) {
    pages.push(page);
    return page;
  }

  function displayPath(absPath) {
    if (!absPath) return '';
    const rel = toPosix(relative(workspaceRoot, absPath));
    if (rel && !rel.startsWith('..') && rel !== '') return rel;
    return basename(toPosix(absPath)) || toPosix(absPath);
  }

  function projectLink(page, project, label) {
    const target = pageBy.project.get(project.row.name);
    if (!target) return mdCell(label || project.row.name);
    return `[${mdCell(label || project.row.name)}](${relLink(page.path, target.path)})`;
  }

  function fileLink(page, file, label) {
    const target = pageBy.file.get(file.id);
    if (target) return `[${mdCell(label || file.path)}](${relLink(page.path, target.path)})`;
    const modulePage = pageBy.module.get(`${file.project_id}\0${file.component}`);
    if (modulePage) return `[${mdCell(label || file.path)}](${relLink(page.path, modulePage.path)})`;
    return mdCell(label || file.path);
  }

  function symbolLink(page, symbol) {
    const file = model.fileById.get(symbol.file_id);
    if (!file) return mdCell(symbol.name);
    return fileLink(page, file, symbol.name);
  }

  function readTextFile(file, maxLines = 0) {
    const candidates = [file.abs_path, join(workspaceRoot, file.path)];
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        const text = readFileSync(candidate, 'utf8');
        if (!maxLines) return text;
        const lines = text.split(/\r?\n/);
        return { text: lines.slice(0, maxLines).join('\n'), totalLines: lines.length };
      } catch {
        // try the next candidate path
      }
    }
    return null;
  }

  function docTitle(file) {
    if (titleCache.has(file.id)) return titleCache.get(file.id);
    let title = basename(file.path);
    const read = readTextFile(file, 60);
    if (read && typeof read === 'object') {
      const heading = read.text.split(/\r?\n/).find((line) => /^#\s+\S/.test(line));
      if (heading) title = heading.replace(/^#\s+/, '').trim();
      else {
        const first = read.text.split(/\r?\n/).find((line) => line.trim() && !line.trim().startsWith('---'));
        if (first) title = first.trim();
      }
    }
    title = truncate(title, 140);
    titleCache.set(file.id, title);
    return title;
  }

  // -------------------------------------------------------------------------
  // Page definitions: links are precomputed so every render can stay relative.
  // -------------------------------------------------------------------------

  const projectSegments = assignSegments(model.projects.map((project) => project.row.name));

  for (const project of model.projects) {
    const row = project.row;
    const projectSegment = projectSegments.get(row.name);
    project.segment = projectSegment;
    project.componentSegment = assignSegments(project.components.map((component) => component.name));

    const projectPage = addPage({
      id: `project:${row.name}`,
      path: `projects/${projectSegment}.md`,
      kind: 'project',
      project: row.name,
      title: `Project: ${row.name}`,
      keywords: [
        row.name,
        'project',
        'overview',
        row.branch || '',
        row.remote || '',
        ...project.components.map((component) => component.name),
        ...project.languages.map((language) => language.lang),
      ],
      render() {
        return renderProjectPage(projectPage, project);
      },
    });
    pageBy.project.set(row.name, projectPage);

    for (const component of project.components) {
      const componentSegment = project.componentSegment.get(component.name);
      const modulePage = addPage({
        id: `module:${row.name}:${component.name}`,
        path: `modules/${projectSegment}/${componentSegment}.md`,
        kind: 'module',
        project: row.name,
        title: `Module: ${row.name}/${component.name}`,
        keywords: [
          row.name,
          component.name,
          'module',
          ...component.files.map((file) => file.path),
          ...component.symbols.slice(0, 120).map((symbol) => symbol.name),
        ],
        render() {
          return renderModulePage(modulePage, project, component);
        },
      });
      project.modulePages.set(component.name, modulePage);
      pageBy.module.set(`${row.id}\0${component.name}`, modulePage);
    }

    const usedPaths = new Set();
    const filesForPages = project.files
      .filter((file) => filePageIds.has(file.id))
      .slice()
      .sort((a, b) => cmpStr(a.path, b.path));
    for (const file of filesForPages) {
      const basePath = file.path.split('/').map(slug).join('/') + '.md';
      let relativePath = basePath;
      let n = 2;
      while (usedPaths.has(relativePath.toLowerCase())) {
        relativePath = basePath.replace(/\.md$/, `-${n}.md`);
        n += 1;
      }
      usedPaths.add(relativePath.toLowerCase());
      const pagePath = `files/${projectSegment}/${relativePath}`;
      project.filePagePaths.set(file.id, pagePath);
      const filePage = addPage({
        id: `file:${row.name}:${file.path}`,
        path: pagePath,
        kind: 'file',
        project: row.name,
        title: `File: ${file.path}`,
        keywords: [
          row.name,
          file.path,
          file.lang,
          file.component,
          ...(project.byFileSymbols.get(file.id) || []).map((symbol) => symbol.name),
          ...(project.byFileImports.get(file.id) || []).map((imp) => imp.specifier),
        ],
        render() {
          return renderFilePage(filePage, project, file);
        },
      });
      pageBy.file.set(file.id, filePage);
    }
  }

  const globalPages = [
    ['index', 'index.md', 'index', 'HQ wiki'],
    ['symbols', 'symbols.md', 'symbols', 'Symbols'],
    ['graph', 'graph.md', 'graph', 'Dependency graph'],
    ['docs', 'docs.md', 'docs', 'Documentation'],
    ['changes', 'changes.md', 'changes', 'Changes'],
    ['todos', 'todos.md', 'todos', 'Open tasks'],
    ['deprecated', 'deprecated.md', 'deprecated', 'Deprecated'],
    ['protocol', 'protocol.md', 'protocol', 'Agent annotation protocol'],
    ['glossary', 'glossary.md', 'glossary', 'Glossary'],
    ['context', 'context.md', 'context', 'Using HQ'],
    ['capabilities', 'capabilities.md', 'capabilities', 'Capabilities'],
    ['sessions', 'sessions.md', 'sessions', 'Sessions'],
    ['semantics', 'semantics.md', 'semantics', 'Semantic identities and commands'],
  ];
  for (const [key, pagePath, kind, title] of globalPages) {
    const page = addPage({
      id: key,
      path: pagePath,
      kind,
      project: null,
      title,
      keywords: [],
      render() {
        switch (kind) {
          case 'index': return renderIndexPage(page);
          case 'symbols': return renderSymbolsPage(page);
          case 'graph': return renderGraphPage(page);
          case 'docs': return renderDocsPage(page);
          case 'changes': return renderChangesPage(page);
          case 'todos': return renderTodosPage(page);
          case 'deprecated': return renderDeprecatedPage(page);
          case 'protocol': return renderProtocolPage(page);
          case 'glossary': return renderGlossaryPage();
          case 'capabilities': return renderCapabilitiesPage(page);
          case 'sessions': return renderSessionsPage(page);
          case 'semantics': return renderSemanticsPage(page);
          default: return renderContextPage(page);
        }
      },
    });
    pageBy.global.set(key, page);
  }

  const searchPage = addPage({
    id: 'search.json',
    path: 'search.json',
    kind: 'search',
    project: null,
    title: 'Search index',
    keywords: ['search', 'json', 'index', 'client'],
    render() {
      return `${JSON.stringify(buildSearchEntries(), null, 2)}\n`;
    },
  });
  pageBy.global.set('search', searchPage);

  const htmlPage = addPage({
    id: 'index.html',
    path: 'index.html',
    kind: 'html',
    project: null,
    title: 'Browser view',
    keywords: ['html', 'browser', 'wiki', 'search', 'filter'],
    render() {
      return renderIndexHtml(htmlPage);
    },
  });
  pageBy.global.set('html', htmlPage);

  // -------------------------------------------------------------------------
  // Markdown chrome
  // -------------------------------------------------------------------------

  function navLine(page) {
    const keys = ['index', 'symbols', 'graph', 'docs', 'changes', 'todos', 'deprecated', 'protocol', 'glossary', 'context', 'capabilities', 'search', 'html'];
    const targets = keys.map((key) => pageBy.global.get(key)).filter(Boolean);
    return targets.map((target) => `[${mdText(target.title, 40)}](${relLink(page.path, target.path)})`).join(' · ');
  }

  function finishPage(page, body) {
    const text = String(body ?? '').replace(/\s+$/, '');
    if (!page.path.endsWith('.md')) return `${text}\n`;
    return `${text}\n\n---\n\n${navLine(page)}\n`;
  }

  function pageHeader(title, subtitle) {
    const line = [`# ${mdText(title, 200)}`, ''];
    line.push(`> Generated ${dateLabel()}${subtitle ? ` · ${subtitle}` : ''}`, '');
    return line;
  }

  // -------------------------------------------------------------------------
  // Index
  // -------------------------------------------------------------------------

  function renderIndexPage(page) {
    const out = [];
    out.push(...pageHeader(`HQ wiki — ${model.workspaceName}`));
    out.push('Local only. This wiki is rebuilt from the HQ index and never includes secret paths.', '');
    out.push('## Workspace summary', '');
    out.push(
      makeTable(
        ['Metric', 'Value'],
        [
          ['Projects', String(model.projects.length)],
          ['Files', String(model.allFiles.length)],
          ['Symbols', String(model.symbolCount)],
          ['Modules', String(model.projects.reduce((n, project) => n + project.components.length, 0))],
          ['Imports', String(model.importRows.length)],
          ['Annotations', String(model.annotationRows.length)],
          ['Commits', String(model.commitRows.length)],
          ['Wiki pages', String(pages.length)],
        ],
      ),
      '',
    );

    out.push('## Projects', '');
    const projectRows = model.projects.map((project) => [
      projectLink(page, project),
      String(project.files.length),
      String(project.symbols.length),
      String(project.components.length),
      project.row.branch ? mdCell(project.row.branch) : '—',
      project.row.head ? mdCell(project.row.head.slice(0, 10)) : '—',
    ]);
    out.push(
      projectRows.length
        ? makeTable(['Project', 'Files', 'Symbols', 'Modules', 'Branch', 'Head'], projectRows)
        : '_No indexed projects._',
      '',
    );

    out.push('## All pages', '');
    const rows = [];
    for (const key of ['index', 'symbols', 'graph', 'docs', 'changes', 'todos', 'deprecated', 'protocol', 'glossary', 'context', 'capabilities']) {
      const target = pageBy.global.get(key);
      const descriptions = {
        index: 'This page: workspace summary and project cards.',
        symbols: 'Global symbol index grouped by kind.',
        graph: 'Mermaid dependency graph at project and module level.',
        docs: 'Documentation catalog with titles.',
        changes: 'Recent commits, index drift and open annotations.',
        todos: 'Every open @hq:todo annotation with its owner.',
        deprecated: 'Deprecated code with replacement pointers.',
        protocol: 'Inline annotation protocol and legend.',
        glossary: 'VIVIM owner vocabulary next to the engineering term.',
        context: 'How to use HQ from the CLI and MCP.',
        capabilities: 'Scanned dependency inventory, licences and proposed contracts — candidates only.',
      };
      if (target) rows.push([`[${mdText(target.title)}](${relLink(page.path, target.path)})`, descriptions[key]]);
    }
    const search = pageBy.global.get('search');
    const html = pageBy.global.get('html');
    if (search) rows.push([`[search.json](${relLink(page.path, search.path)})`, 'Machine-readable page index used by the browser view.']);
    if (html) rows.push([`[index.html](${relLink(page.path, html.path)})`, 'Self-contained browser view with filters and search.']);
    out.push(makeTable(['Page', 'What it is'], rows), '');

    out.push('## Legend', '');
    out.push('- **Project** — one indexed repository or folder.', '');
    out.push('- **Module** — an ownership bucket inside a project (`src/`, `apps/<name>/`, and so on).', '');
    out.push('- **File** — a per-file page with symbols, imports, dependents and an excerpt.', '');
    out.push('- Generated pages are read-only; run the wiki build again after indexing changes.', '');
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Project
  // -------------------------------------------------------------------------

  function renderProjectPage(page, project) {
    const row = project.row;
    const out = [];
    out.push(...pageHeader(`Project: ${row.name}`, `${project.files.length} files · ${project.symbols.length} symbols · ${project.commits.length} commits`));

    const spaceTerm = VIVIM_TAXONOMY.userTerms.space || 'Space';
    out.push(`**${mdText(spaceTerm)}** — the owner-facing name for this registered project. Engineering headings keep "Project".`, '');

    out.push('## Overview', '');
    out.push(
      makeTable(
        ['Field', 'Value'],
        [
          ['Path', mdCell(displayPath(row.path))],
          ['Remote', row.remote ? mdCell(row.remote) : '—'],
          ['Branch', row.branch ? mdCell(row.branch) : '—'],
          ['Head', row.head ? mdCell(row.head.slice(0, 12)) : '—'],
          ['Files', String(project.files.length)],
          ['Symbols', String(project.symbols.length)],
          ['Imports', String(project.imports.length)],
          ['Annotations', String(project.annotations.length)],
          ['Indexed', row.indexed_at ? mdCell(row.indexed_at) : 'never'],
        ],
      ),
      '',
    );

    out.push('## Languages', '');
    out.push(
      project.languages.length
        ? makeTable(
            ['Language', 'Files', 'Symbols'],
            project.languages.map((language) => [
              mdCell(languageLabel(language.lang)),
              String(language.files),
              String(language.symbols),
            ]),
          )
        : '_No source files._',
      '',
    );

    out.push('## Components', '');
    const componentRows = project.components.map((component) => {
      const modulePage = project.modulePages.get(component.name);
      const label = modulePage
        ? `[${mdCell(component.name)}](${relLink(page.path, modulePage.path)})`
        : mdCell(component.name);
      return [label, String(component.files.length), String(component.symbols.length)];
    });
    out.push(
      componentRows.length
        ? makeTable(['Component', 'Files', 'Symbols'], componentRows)
        : '_No components._',
      '',
    );

    out.push('## Entrypoints', '');
    const entryFiles = project.files
      .filter((file) => {
        const base = basename(file.path);
        return /^readme(\..*)?$/i.test(base) || /^(agents|claude|context)\.md$/i.test(base);
      })
      .sort((a, b) => cmpStr(a.path, b.path));
    const entryLines = [];
    for (const file of entryFiles) entryLines.push(`- ${fileLink(page, file)} — start here`);
    const packageFile =
      project.files.find((file) => file.path === 'package.json') ||
      project.files.find((file) => file.path.endsWith('/package.json'));
    if (packageFile) {
      let pkg = null;
      const raw = readTextFile(packageFile);
      try {
        pkg = raw ? JSON.parse(raw) : null;
      } catch {
        pkg = null;
      }
      if (pkg && typeof pkg.main === 'string' && pkg.main.trim()) {
        entryLines.push(`- package.json \`main\`: ${codeSpan(pkg.main)}`);
      }
      if (pkg && pkg.bin) {
        const bins = typeof pkg.bin === 'string' ? { [row.name]: pkg.bin } : pkg.bin;
        if (bins && typeof bins === 'object') {
          for (const name of Object.keys(bins).sort(cmpStr)) {
            entryLines.push(`- package.json \`bin\`: ${codeSpan(name)} → ${codeSpan(bins[name])}`);
          }
        }
      }
    }
    if (!entryLines.length) entryLines.push('- No conventional entrypoints found.');
    out.push(...entryLines, '');

    out.push('## Top symbols', '');
    const topSymbols = project.symbols
      .slice()
      .sort(
        (a, b) =>
          (b.exported || 0) - (a.exported || 0) ||
          cmpStr(a.name, b.name) ||
          cmpStr(a.file_path, b.file_path) ||
          a.line - b.line,
      )
      .slice(0, 15);
    out.push(
      topSymbols.length
        ? makeTable(
            ['Symbol', 'Kind', 'File', 'Line'],
            topSymbols.map((symbol) => [
              symbolLink(page, symbol),
              mdCell(symbol.kind),
              fileLink(page, model.fileById.get(symbol.file_id)),
              String(symbol.line || 0),
            ]),
          )
        : '_No symbols indexed._',
      '',
    );

    out.push('## Dependencies', '');
    const incoming = project.files.reduce((sum, file) => sum + (model.dependents.get(file.id) || []).length, 0);
    const outgoing = project.imports.filter((imp) => imp.resolved_file_id).length;
    out.push(
      makeTable(
        ['Direction', 'Count'],
        [
          ['Outgoing (resolved)', String(outgoing)],
          ['Incoming (dependents)', String(incoming)],
        ],
      ),
      '',
    );
    const cross = new Map();
    const external = new Map();
    for (const imp of project.imports) {
      const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null;
      const targetProject = targetFile ? targetFile.project_name : imp.resolved_project_name;
      if (targetProject && targetProject !== row.name) {
        cross.set(targetProject, (cross.get(targetProject) || 0) + 1);
        continue;
      }
      if (!targetFile && !targetProject) {
        const root = packageRoot(imp.specifier);
        if (root) external.set(root, (external.get(root) || 0) + 1);
      }
    }
    if (cross.size) {
      out.push('### Cross-project imports', '');
      out.push(
        makeTable(
          ['Project', 'Imports'],
          [...cross.entries()]
            .sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]))
            .map(([name, count]) => [mdCell(name), String(count)]),
        ),
        '',
      );
    }
    if (external.size) {
      out.push('### External packages', '');
      out.push(
        '| Package | Imports |\n| --- | --- |\n' +
          [...external.entries()]
            .sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]))
            .slice(0, 15)
            .map(([name, count]) => `| ${mdCell(name)} | ${count} |`)
            .join('\n'),
        '',
      );
    }

    out.push('## Recent commits', '');
    const recent = project.commits.slice(0, 10);
    out.push(
      recent.length
        ? makeTable(
            ['Date', 'Commit', 'Subject'],
            recent.map((commit) => [
              mdCell(dateOnly(commit.date)),
              mdCell(String(commit.sha || '').slice(0, 8)),
              mdCell(commit.subject),
            ]),
          )
        : '_No commits ingested._',
      '',
    );

    out.push('## Annotations', '');
    const kindCounts = countBy(project.annotations, (annotation) => annotation.kind);
    if (kindCounts.size) {
      out.push(
        makeTable(
          ['Kind', 'Count'],
          [...kindCounts.entries()].sort((a, b) => cmpStr(a[0], b[0])).map(([kind, count]) => [mdCell(kind), String(count)]),
        ),
        '',
      );
      const annotationRows = project.annotations
        .slice()
        .sort((a, b) => cmpStr(a.kind, b.kind) || cmpStr(a.file_path, b.file_path) || a.line - b.line)
        .slice(0, 15);
      out.push(
        makeTable(
          ['Kind', 'File', 'Line', 'Text'],
          annotationRows.map((annotation) => [
            mdCell(annotation.kind),
            mdCell(annotation.file_path),
            String(annotation.line || 0),
            mdCell(annotation.text, 160),
          ]),
        ),
        '',
      );
    } else {
      out.push('_No annotations recorded._', '');
    }

    out.push('## Documentation', '');
    const docs = project.files
      .filter((file) => file.kind === 'doc' || file.lang === 'markdown' || file.lang === 'text')
      .sort((a, b) => cmpStr(a.path, b.path))
      .slice(0, 30);
    if (docs.length) {
      for (const file of docs) out.push(`- ${fileLink(page, file)} — ${mdText(docTitle(file), 120)}`);
      out.push('');
    } else {
      out.push('_No documentation files indexed._', '');
    }
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Module
  // -------------------------------------------------------------------------

  function renderModulePage(page, project, component) {
    const row = project.row;
    const out = [];
    out.push(...pageHeader(`Module: ${row.name}/${component.name}`, `${component.files.length} files · ${component.symbols.length} symbols`));

    out.push('## Files', '');
    out.push(
      makeTable(
        ['File', 'Language', 'Lines', 'Symbols'],
        component.files.map((file) => [
          fileLink(page, file),
          mdCell(languageLabel(file.lang)),
          String(file.lines || 0),
          String((project.byFileSymbols.get(file.id) || []).length),
        ]),
      ),
      '',
    );

    out.push('## Symbols', '');
    const moduleSymbols = component.symbols.slice(0, 250);
    out.push(
      moduleSymbols.length
        ? makeTable(
            ['Symbol', 'Kind', 'Exported', 'Line'],
            moduleSymbols.map((symbol) => [
              symbolLink(page, symbol),
              mdCell(symbol.kind),
              symbol.exported ? 'yes' : 'no',
              String(symbol.line || 0),
            ]),
          )
        : '_No symbols in this module._',
      '',
    );
    if (component.symbols.length > moduleSymbols.length) {
      out.push(`_Showing ${moduleSymbols.length} of ${component.symbols.length} symbols._`, '');
    }

    out.push('## Dependencies', '');
    const moduleKey = `${row.id}\0${component.name}`;
    const outgoing = new Map();
    const incoming = new Map();
    for (const imp of model.importRows) {
      const fromFile = model.fileById.get(imp.file_id);
      if (!fromFile) continue;
      const fromKey = `${fromFile.project_id}\0${fromFile.component}`;
      const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null;
      let targetLabel = null;
      let targetKey = null;
      if (targetFile) {
        targetKey = `${targetFile.project_id}\0${targetFile.component}`;
        targetLabel = `${targetFile.project_name}/${targetFile.component}`;
      } else if (imp.resolved_project_name) {
        targetLabel = `${imp.resolved_project_name} (project)`;
      }
      if (targetLabel) {
        if (fromKey === moduleKey) {
          if (targetKey !== moduleKey) outgoing.set(targetLabel, (outgoing.get(targetLabel) || 0) + 1);
        } else if (targetKey === moduleKey) {
          incoming.set(targetLabel, (incoming.get(targetLabel) || 0) + 1);
        }
      } else if (fromKey === moduleKey) {
        const root = packageRoot(imp.specifier);
        if (root) outgoing.set(`external:${root}`, (outgoing.get(`external:${root}`) || 0) + 1);
      }
    }
    out.push('### Outgoing', '');
    out.push(
      outgoing.size
        ? makeTable(
            ['Target', 'Imports'],
            [...outgoing.entries()]
              .sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]))
              .map(([target, count]) => [mdCell(target), String(count)]),
          )
        : '_No outgoing dependencies._',
      '',
    );
    out.push('### Incoming', '');
    out.push(
      incoming.size
        ? makeTable(
            ['Source', 'Imports'],
            [...incoming.entries()]
              .sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]))
              .map(([source, count]) => [mdCell(source), String(count)]),
          )
        : '_No incoming dependencies._',
      '',
    );

    out.push('## Context annotations', '');
    const interesting = new Set(['context', 'why', 'invariant', 'owner', 'risk', 'deprecated', 'task']);
    const annotations = component.files
      .flatMap((file) => project.byFileAnnotations.get(file.id) || [])
      .filter((annotation) => interesting.has(annotation.kind))
      .sort((a, b) => cmpStr(a.kind, b.kind) || cmpStr(a.file_path, b.file_path) || a.line - b.line)
      .slice(0, 60);
    out.push(
      annotations.length
        ? makeTable(
            ['Kind', 'File', 'Line', 'Owner', 'Text'],
            annotations.map((annotation) => [
              mdCell(annotation.kind),
              mdCell(annotation.file_path),
              String(annotation.line || 0),
              annotation.owner ? mdCell(annotation.owner) : '—',
              mdCell(annotation.text, 200),
            ]),
          )
        : '_No context annotations in this module._',
      '',
    );
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // File
  // -------------------------------------------------------------------------

  function renderFilePage(page, project, file) {
    const out = [];
    out.push(...pageHeader(`File: ${file.path}`, `${languageLabel(file.lang)} · ${project.row.name}`));

    out.push('## Metadata', '');
    out.push(
      makeTable(
        ['Field', 'Value'],
        [
          ['Project', projectLink(page, project)],
          ['Path', mdCell(file.path)],
          ['Language', mdCell(languageLabel(file.lang))],
          ['Kind', mdCell(file.kind)],
          ['Size', `${Number(file.size || 0)} B`],
          ['Lines', String(file.lines || 0)],
          ['Hash', file.hash ? mdCell(String(file.hash).slice(0, 12)) : '—'],
          ['Test', file.is_test ? 'yes' : 'no'],
          ['Generated', file.is_generated ? 'yes' : 'no'],
          ['Component', mdCell(file.component)],
        ],
      ),
      '',
    );

    out.push('## Symbols', '');
    const symbols = (project.byFileSymbols.get(file.id) || [])
      .slice()
      .sort((a, b) => a.line - b.line || cmpStr(a.name, b.name));
    out.push(
      symbols.length
        ? makeTable(
            ['Symbol', 'Kind', 'Line', 'Exported', 'Signature'],
            symbols.map((symbol) => [
              mdCell(symbol.name),
              mdCell(symbol.kind),
              String(symbol.line || 0),
              symbol.exported ? 'yes' : 'no',
              mdCell(symbol.signature || '', 200),
            ]),
          )
        : '_No symbols._',
      '',
    );

    out.push('## Imports', '');
    const imports = (project.byFileImports.get(file.id) || [])
      .slice()
      .sort((a, b) => a.line - b.line || cmpStr(a.specifier, b.specifier));
    out.push(
      imports.length
        ? makeTable(
            ['Specifier', 'Kind', 'Line', 'Resolved'],
            imports.map((imp) => {
              let target = 'external';
              if (imp.resolved_file_id) {
                const targetFile = model.fileById.get(imp.resolved_file_id);
                target = targetFile ? fileLink(page, targetFile) : mdCell(imp.resolved_path || '');
              } else if (imp.resolved_project_name) {
                const targetProject = model.projects.find((entry) => entry.row.name === imp.resolved_project_name);
                target = targetProject ? projectLink(page, targetProject) : mdCell(imp.resolved_project_name);
              }
              return [mdCell(imp.specifier), mdCell(imp.kind), String(imp.line || 0), target];
            }),
          )
        : '_No imports._',
      '',
    );

    out.push('## Dependents', '');
    const dependents = (model.dependents.get(file.id) || [])
      .slice()
      .sort((a, b) => cmpStr(a.file.path, b.file.path) || cmpStr(a.specifier, b.specifier));
    out.push(
      dependents.length
        ? makeTable(
            ['File', 'Specifier'],
            dependents.map((entry) => [fileLink(page, entry.file), mdCell(entry.specifier)]),
          )
        : '_No dependents._',
      '',
    );

    out.push('## Annotations', '');
    const annotations = (project.byFileAnnotations.get(file.id) || [])
      .slice()
      .sort((a, b) => a.line - b.line || cmpStr(a.kind, b.kind));
    out.push(
      annotations.length
        ? makeTable(
            ['Line', 'Kind', 'Owner', 'Ref', 'Text'],
            annotations.map((annotation) => [
              String(annotation.line || 0),
              mdCell(annotation.kind),
              annotation.owner ? mdCell(annotation.owner) : '—',
              annotation.ref ? mdCell(annotation.ref) : '—',
              mdCell(annotation.text, 200),
            ]),
          )
        : '_No annotations._',
      '',
    );

    out.push('## Excerpt', '');
    const read = readTextFile(file, 80);
    if (read && typeof read === 'object' && read.text.trim()) {
      const fence = fenceFor(read.text);
      out.push(`${fence}${file.lang === 'other' ? '' : file.lang}`);
      out.push(read.text.replace(/\s+$/, ''));
      out.push(fence);
      if (read.totalLines > 80) out.push('', `_First 80 of ${read.totalLines} lines._`);
    } else {
      out.push('_Source not available._');
    }
    out.push('');
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Symbols
  // -------------------------------------------------------------------------

  function renderSymbolsPage(page) {
    const out = [];
    out.push(...pageHeader('Symbols', `${model.symbols.length} symbols across ${model.projects.length} projects`));
    out.push('Global symbol index. Every symbol links to its file page when one was generated.', '');

    const byKind = new Map();
    for (const symbol of model.symbols) pushMap(byKind, symbol.kind || 'other', symbol);
    const kinds = [...byKind.keys()].sort(cmpStr);
    if (!kinds.length) out.push('_No symbols indexed._', '');
    for (const kind of kinds) {
      const symbols = byKind.get(kind).slice().sort(
        (a, b) =>
          cmpStr(a.name, b.name) ||
          cmpStr(a.project_name, b.project_name) ||
          cmpStr(a.file_path, b.file_path) ||
          a.line - b.line,
      );
      out.push(`## ${mdText(kind)} (${symbols.length})`, '');
      out.push(
        makeTable(
          ['Symbol', 'Project', 'File', 'Line', 'Exported'],
          symbols.map((symbol) => [
            symbolLink(page, symbol),
            mdCell(symbol.project_name),
            fileLink(page, model.fileById.get(symbol.file_id)),
            String(symbol.line || 0),
            symbol.exported ? 'yes' : 'no',
          ]),
        ),
        '',
      );
    }
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Graph
  // -------------------------------------------------------------------------

  function mermaidLabel(value) {
    return String(value ?? '')
      .replace(/"/g, "'")
      .replace(/[[\]]/g, '')
      .replace(/\|/g, '/')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function renderGraphPage(page) {
    const out = [];
    out.push(...pageHeader('Dependency graph', 'project and module level'));
    out.push('Edges are aggregated resolved imports. External packages are omitted.', '');

    const projectNameById = new Map(model.projects.map((project) => [project.row.id, project.row.name]));
    const projectEdges = new Map();
    for (const imp of model.importRows) {
      const fromFile = model.fileById.get(imp.file_id);
      if (!fromFile) continue;
      const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null;
      const toProject = targetFile ? targetFile.project_id : imp.resolved_project_id;
      if (!toProject || toProject === fromFile.project_id) continue;
      if (!projectNameById.has(toProject)) continue;
      const key = `${fromFile.project_id}\0${toProject}`;
      projectEdges.set(key, (projectEdges.get(key) || 0) + 1);
    }

    out.push('## Projects', '');
    const projectNodes = [...projectNameById.entries()].sort((a, b) => cmpStr(a[1], b[1]));
    if (projectNodes.length) {
      const nodeIds = new Map(projectNodes.map(([id], index) => [id, `p${index}`]));
      const mermaid = ['```mermaid', 'flowchart LR'];
      for (const [id, name] of projectNodes) {
        mermaid.push(`  ${nodeIds.get(id)}["${mermaidLabel(name)}"]`);
      }
      const edges = [...projectEdges.entries()]
        .map(([key, count]) => {
          const [from, to] = key.split('\0').map(Number);
          return { from, to, count };
        })
        .sort((a, b) => a.from - b.from || a.to - b.to);
      for (const edge of edges) {
        mermaid.push(`  ${nodeIds.get(edge.from)} -->|${edge.count}| ${nodeIds.get(edge.to)}`);
      }
      mermaid.push('```');
      out.push(mermaid.join('\n'), '');
      out.push(
        makeTable(
          ['From', 'To', 'Imports'],
          edges.map((edge) => [
            mdCell(projectNameById.get(edge.from)),
            mdCell(projectNameById.get(edge.to)),
            String(edge.count),
          ]),
        ),
        '',
      );
    } else {
      out.push('_No projects indexed._', '');
    }

    out.push('## Modules', '');
    const moduleNodes = new Map();
    for (const project of model.projects) {
      for (const component of project.components) {
        moduleNodes.set(`${project.row.id}\0${component.name}`, `${project.row.name}/${component.name}`);
      }
    }
    const moduleEdges = new Map();
    for (const imp of model.importRows) {
      const fromFile = model.fileById.get(imp.file_id);
      if (!fromFile) continue;
      const fromKey = `${fromFile.project_id}\0${fromFile.component}`;
      const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null;
      if (!targetFile) continue;
      const toKey = `${targetFile.project_id}\0${targetFile.component}`;
      if (fromKey === toKey) continue;
      const key = `${fromKey}\0${toKey}`;
      moduleEdges.set(key, (moduleEdges.get(key) || 0) + 1);
    }
    if (moduleNodes.size) {
      const sortedNodes = [...moduleNodes.entries()].sort((a, b) => cmpStr(a[1], b[1]));
      const nodeIds = new Map(sortedNodes.map(([key], index) => [key, `m${index}`]));
      const edgeList = [...moduleEdges.entries()]
        .map(([key, count]) => {
          const [from, to] = key.split('\0');
          return { from, to, count };
        })
        .sort((a, b) => cmpStr(a.from, b.from) || cmpStr(a.to, b.to));
      const edges = edgeList.slice(0, 160);
      const mermaid = ['```mermaid', 'flowchart LR'];
      for (const [key, label] of sortedNodes.slice(0, 80)) {
        mermaid.push(`  ${nodeIds.get(key)}["${mermaidLabel(label)}"]`);
      }
      for (const edge of edges) {
        if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue;
        mermaid.push(`  ${nodeIds.get(edge.from)} -->|${edge.count}| ${nodeIds.get(edge.to)}`);
      }
      mermaid.push('```');
      out.push(mermaid.join('\n'), '');
      out.push(
        makeTable(
          ['From', 'To', 'Imports'],
          edges
            .filter((edge) => moduleNodes.has(edge.from) && moduleNodes.has(edge.to))
            .map((edge) => [
              mdCell(moduleNodes.get(edge.from)),
              mdCell(moduleNodes.get(edge.to)),
              String(edge.count),
            ]),
        ),
        '',
      );
      if (moduleNodes.size > 80 || edgeList.length > edges.length) {
        out.push(`_Graph capped at 80 modules and ${edges.length} edges._`, '');
      }
    } else {
      out.push('_No modules indexed._', '');
    }
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Docs
  // -------------------------------------------------------------------------

  function renderDocsPage(page) {
    const out = [];
    const docs = model.allFiles
      .filter((file) => file.kind === 'doc' || file.lang === 'markdown' || file.lang === 'text')
      .slice()
      .sort((a, b) => cmpStr(a.project_name, b.project_name) || cmpStr(a.path, b.path));
    out.push(...pageHeader('Documentation', `${docs.length} documentation files`));
    out.push('Titles come from the first Markdown heading. Links open the generated file page when one exists.', '');
    const shown = docs.slice(0, 300);
    out.push(
      shown.length
        ? makeTable(
            ['Project', 'Document', 'Title', 'Link'],
            shown.map((file) => {
              const project = model.projects.find((entry) => entry.row.name === file.project_name);
              return [
                project ? projectLink(page, project) : mdCell(file.project_name),
                mdCell(file.path),
                mdCell(docTitle(file), 140),
                fileLink(page, file, 'open'),
              ];
            }),
          )
        : '_No documentation files indexed._',
      '',
    );
    if (docs.length > shown.length) out.push(`_Showing ${shown.length} of ${docs.length} documents._`, '');
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Capabilities
  // -------------------------------------------------------------------------

  function renderCapabilitiesPage(page) {
    const out = [];
    const cap = model.capabilities;
    out.push(...pageHeader('Capabilities', 'static inventory · candidates only'));
    out.push(
      'A candidate is not an approval. HQ reads manifests and files, never imports or executes a package, and this page never includes document bodies.',
      '',
    );

    if (!cap) {
      out.push(
        '_No capability registry tables in this index. Run `hq capabilities scan <root>` after indexing to populate them._',
        '',
      );
      return out.join('\n');
    }

    const approved = Number(cap.approved) || 0;
    const proposed = cap.contracts.length;
    out.push(
      `${proposed} proposed contract${proposed === 1 ? '' : 's'} · ${approved} approved · all rows are candidates.`,
      '',
    );

    out.push('## Sources', '');
    const sourceRows = cap.sources.map((row) => [
      codeSpan(row.id, 80),
      String(row.packages ?? 0),
      String(row.files ?? 0),
      String(row.documents ?? 0),
      codeSpan(String(row.digest || '').slice(0, 12), 12),
      mdCell(row.status || 'candidate', 40),
    ]);
    out.push(
      sourceRows.length
        ? makeTable(['Source', 'Packages', 'Files', 'Documents', 'Digest', 'Status'], sourceRows)
        : '_No scanned sources._',
      '',
    );

    out.push('## Licenses', '');
    const licenseRows = cap.licenses.map((row) => [
      codeSpan(row.sourceId, 80),
      mdCell(row.license, 60),
      String(row.packages ?? 0),
      'candidate',
    ]);
    out.push(
      licenseRows.length
        ? makeTable(['Source', 'License', 'Packages', 'Status'], licenseRows)
        : '_No package licences recorded._',
      '',
    );

    out.push('## Top candidate mappings by node', '');
    const byNode = new Map();
    for (const row of cap.mappings) {
      const group = byNode.get(row.nodeId) || [];
      if (group.length >= 3) continue;
      group.push(row);
      byNode.set(row.nodeId, group);
    }
    const mappingRows = [];
    for (const nodeId of [...byNode.keys()].sort(cmpStr)) {
      for (const row of byNode.get(nodeId)) {
        mappingRows.push([
          codeSpan(nodeId, 80),
          mdCell(row.name, 120),
          mdCell(row.version, 40),
          Number(row.score || 0).toFixed(2),
          mdCell(row.status || 'candidate', 40),
        ]);
      }
    }
    out.push(
      mappingRows.length
        ? makeTable(['Node', 'Package', 'Version', 'Score', 'Status'], mappingRows)
        : '_No candidate mappings._',
      '',
    );

    out.push('## Proposed contracts', '');
    const contractRows = cap.contracts.map((row) => [
      codeSpan(row.id, 80),
      String(row.version ?? 1),
      codeSpan(row.nodeId, 80),
      mdCell(row.title, 140),
      mdCell(safeJsonList(row.effects).join(', ') || '—', 160),
      mdCell(safeJsonList(row.scopes).join(', ') || '—', 160),
      row.ownerConfirmed === 1 || row.ownerConfirmed === true ? 'yes' : 'no',
      mdCell(row.status || 'proposed', 40),
      mdCell(row.authority || 'candidate', 40),
    ]);
    out.push(
      contractRows.length
        ? makeTable(
            ['Contract', 'Rev', 'Node', 'Title', 'Effects', 'Scopes', 'Owner confirmed', 'Status', 'Authority'],
            contractRows,
          )
        : '_No proposed contracts._',
      '',
    );
    if (approved === 0) {
      out.push('No contract is approved. VIVIM receives nothing executable from this registry.', '');
    }
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  function renderSessionsPage(page) {
    const out = [];
    const sessions = model.sessions;
    const totals = sessions?.totals;
    out.push(...pageHeader('Sessions', totals ? `${totals.sessions} absorbed sessions` : 'no sessions absorbed'));
    out.push(
      'Absorbed OpenCode session exports: what was asked, what was answered, which tools ran and what it cost. The local index is the only source.',
      '',
    );

    if (!sessions || !sessions.rows.length) {
      out.push('_No sessions absorbed yet. Run `hq sessions import <dir>`._', '');
      return out.join('\n');
    }

    out.push(
      `${totals.sessions} sessions · ${totals.messages} messages · ${totals.toolCalls} tool calls · $${totals.cost.toFixed(3)}`,
      '',
    );

    out.push('## Daily activity', '');
    out.push(
      makeTable(
        ['Day', 'Sessions', 'Messages', 'Tool calls', 'Cost'],
        sessions.days.map((day) => [
          day.day,
          String(day.sessions),
          String(day.messages),
          String(day.toolCalls),
          day.cost.toFixed(3),
        ]),
      ),
      '',
    );

    out.push('## Tools', '');
    out.push(
      makeTable(
        ['Tool', 'Calls', 'Sessions'],
        sessions.tools.map((tool) => [codeSpan(tool.name, 60), String(tool.calls), String(tool.sessions)]),
      ),
      '',
    );

    out.push('## Sessions', '');
    out.push(
      makeTable(
        ['When (UTC)', 'Session', 'Title', 'Messages', 'Tools', 'Cost', 'Ask'],
        sessions.rows.map((row) => [
          String(row.updatedAt ?? row.createdAt ?? '-').slice(0, 16).replace('T', ' '),
          codeSpan(row.id, 40),
          mdCell(row.title, 120),
          String(row.messages),
          mdCell(row.tools.map((tool) => tool.name).join(', '), 120),
          (row.cost ?? 0).toFixed(3),
          mdCell(truncate(row.ask, 200), 200),
        ]),
      ),
      '',
    );

    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Changes
  // -------------------------------------------------------------------------

  function renderChangesPage(page) {
    const out = [];
    out.push(...pageHeader('Changes', `${model.commitRows.length} commits`));
    out.push('Recent commits, index freshness and open annotations gathered from the local index.', '');

    out.push('## Recent commits', '');
    const recent = model.commitRows.slice(0, 50);
    out.push(
      recent.length
        ? makeTable(
            ['Date', 'Project', 'Commit', 'Type', 'Subject'],
            recent.map((commit) => [
              mdCell(dateOnly(commit.date)),
              mdCell(commit.project_name),
              mdCell(String(commit.sha || '').slice(0, 8)),
              commit.type ? mdCell(commit.type) : '—',
              mdCell(commit.subject, 180),
            ]),
          )
        : '_No commits ingested._',
      '',
    );

    out.push('## Index freshness', '');
    const staleRows = [];
    for (const project of model.projects) {
      const indexedAt = project.row.indexed_at ? Date.parse(project.row.indexed_at) : NaN;
      let stale = 0;
      if (!Number.isFinite(indexedAt)) stale = project.files.length;
      else stale = project.files.filter((file) => Number(file.mtime_ms) > indexedAt).length;
      staleRows.push([
        projectLink(page, project),
        project.row.indexed_at ? mdCell(project.row.indexed_at) : 'never',
        String(stale),
        String(project.files.length),
      ]);
    }
    out.push(
      staleRows.length
        ? makeTable(['Project', 'Indexed', 'Changed since index', 'Files'], staleRows)
        : '_No projects indexed._',
      '',
    );

    out.push('## Commit types', '');
    const types = countBy(model.commitRows, (commit) => commit.type || 'other');
    out.push(
      types.size
        ? makeTable(
            ['Type', 'Count'],
            [...types.entries()].sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0])).map(([type, count]) => [mdCell(type), String(count)]),
          )
        : '_No commits._',
      '',
    );

    out.push('## Open work', '');
    const todos = model.annotationRows
      .filter((annotation) => annotation.kind === 'todo')
      .sort((a, b) => cmpStr(a.project_name, b.project_name) || cmpStr(a.file_path, b.file_path) || a.line - b.line)
      .slice(0, 50);
    out.push(
      todos.length
        ? makeTable(
            ['Project', 'File', 'Line', 'Owner', 'Task'],
            todos.map((annotation) => [
              mdCell(annotation.project_name),
              mdCell(annotation.file_path),
              String(annotation.line || 0),
              annotation.owner ? mdCell(annotation.owner) : '—',
              mdCell(annotation.text, 180),
            ]),
          )
        : '_No open `@hq:todo` annotations._',
      '',
    );

    const risks = model.annotationRows
      .filter((annotation) => annotation.kind === 'risk' || annotation.kind === 'deprecated')
      .sort((a, b) => cmpStr(a.kind, b.kind) || cmpStr(a.file_path, b.file_path) || a.line - b.line)
      .slice(0, 20);
    if (risks.length) {
      out.push('## Risks and deprecations', '');
      out.push(
        makeTable(
          ['Kind', 'Project', 'File', 'Line', 'Text'],
          risks.map((annotation) => [
            mdCell(annotation.kind),
            mdCell(annotation.project_name),
            mdCell(annotation.file_path),
            String(annotation.line || 0),
            mdCell(annotation.text, 180),
          ]),
        ),
        '',
      );
    }
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Todos + deprecated
  // -------------------------------------------------------------------------

  function annotationFileCell(page, annotation) {
    const file = model.fileById.get(annotation.file_id);
    return file ? fileLink(page, file) : mdCell(annotation.file_path);
  }

  function renderTodosPage(page) {
    const todos = model.annotationRows
      .filter((annotation) => annotation.kind === 'todo')
      .slice()
      .sort(
        (a, b) =>
          cmpStr(a.project_name, b.project_name) ||
          cmpStr(a.file_path, b.file_path) ||
          a.line - b.line,
      );
    const out = [];
    out.push(...pageHeader('Open tasks', `${todos.length} @hq:todo annotations`));
    out.push('Every open `@hq:todo` annotation in the index. Add an owner when one exists (`@hq:todo(name): text`).', '');
    out.push(
      todos.length
        ? makeTable(
            ['Project', 'File', 'Line', 'Owner', 'Task'],
            todos.map((annotation) => [
              mdCell(annotation.project_name),
              annotationFileCell(page, annotation),
              String(annotation.line || 0),
              annotation.owner ? mdCell(annotation.owner) : '—',
              mdCell(annotation.text, 200),
            ]),
          )
        : '_No open `@hq:todo` annotations._',
      '',
    );
    return out.join('\n');
  }

  function renderDeprecatedPage(page) {
    const deprecated = model.annotationRows
      .filter((annotation) => annotation.kind === 'deprecated')
      .slice()
      .sort(
        (a, b) =>
          cmpStr(a.project_name, b.project_name) ||
          cmpStr(a.file_path, b.file_path) ||
          a.line - b.line,
      );
    const out = [];
    out.push(...pageHeader('Deprecated', `${deprecated.length} @hq:deprecated annotations`));
    out.push('Scheduled removals with their replacement pointer when one was recorded.', '');
    out.push(
      deprecated.length
        ? makeTable(
            ['Project', 'File', 'Line', 'Replacement', 'Text'],
            deprecated.map((annotation) => [
              mdCell(annotation.project_name),
              annotationFileCell(page, annotation),
              String(annotation.line || 0),
              annotation.ref ? mdCell(annotation.ref) : '—',
              mdCell(annotation.text, 200),
            ]),
          )
        : '_No deprecated annotations recorded._',
      '',
    );
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Glossary
  // -------------------------------------------------------------------------

  function renderGlossaryPage() {
    return glossaryMarkdown().replace(/\s+$/, '');
  }

  // -------------------------------------------------------------------------
  // Protocol
  // -------------------------------------------------------------------------

  // The semantic and command view of the SAME index. It reads the canonical
  // semantic registry and the canonical action registry; it is a projection, never
  // a second registry. A semantic identity shows the source it was pinned to and,
  // when one exists, the registered command that carries it.
  function renderSemanticsPage(page) {
    const out = [];
    out.push(...pageHeader('Semantic identities and registered commands',
      'canonical semantic registry and action registry, projected from this index'));
    const identities = model.semanticIds || [];
    const commands = model.commands || [];
    const commandById = new Map(commands.map((command) => [command.id, command]));
    const filesByPath = new Map();
    for (const file of model.allFiles || []) pushMap(filesByPath, file.path, file);
    // Registry links contain a relative path and a pinned content hash, not a
    // project ID. Never guess a project when identical paths occur in several.
    const resolveSource = link => {
      const candidates = filesByPath.get(link.path) || [];
      const pinned = typeof link.content_hash === 'string' && /^[a-f0-9]{64}$/i.test(link.content_hash);
      const matches = pinned ? candidates.filter(file => file.hash === link.content_hash) : [];
      if (link.status !== 'current') return {state:'non-current-link'};
      if (!pinned) return {state:'missing-source-pin'};
      if (!candidates.length) return {state:'source-not-in-index'};
      if (!matches.length) return {state:'stale-source-pin'};
      if (matches.length !== 1) return {state:'ambiguous-source-pin'};
      return {state:'indexed-bytes-match',file:matches[0]};
    };

    // Project actual indexed source occurrences even when the semantic
    // registry has no entry. Reuse the same conservative anchors as context
    // search, never create a registry entry or grant from a comment.
    const annotationFiles = new Set((model.annotationRows || [])
      .filter(row => ['v2:type','v2:capability','v2:contract','v2:emits','v2:consumes','v2:action'].includes(row.kind))
      .map(row => row.file_id));
    const eligibleFiles = (model.allFiles || []).filter(file => annotationFiles.has(file.id) &&
      file.kind === 'source' && !file.is_generated && !isSensitiveSourcePath(file.path))
      .sort((a,b) => cmpStr(a.project_name,b.project_name) || cmpStr(a.path,b.path));
    const occurrenceLimit = 400, fileLimit = 512;
    const occurrences = [];
    let unreadableFiles = 0, scannedFiles = 0, occurrenceCount = 0;
    const indexedContent = db.prepare('SELECT content FROM content_fts WHERE rowid=?');
    for (const file of eligibleFiles.slice(0,fileLimit)) {
      scannedFiles++;
      const content = indexedContent.get(file.id)?.content;
      if (typeof content !== 'string' || sha256(content) !== file.hash) {
        unreadableFiles++; continue;
      }
      const anchors = indexedSemanticAnchors(db,{fileId:file.id,project:file.project_name,path:file.path,hash:file.hash});
      occurrenceCount += anchors.length;
      for (const anchor of anchors) {
        if (occurrences.length >= occurrenceLimit) break;
        const {resolution} = annotationResolution(db,anchor.semanticId,anchor.annotationKind);
        occurrences.push({file,anchor,evidence:indexedAnnotationEvidence(anchor,resolution)});
      }
    }

    out.push('## Coverage', '');
    out.push(
      makeTable(
        ['Fact', 'Count'],
        [
          ['Indexed annotation anchors scanned', String(occurrenceCount)],
          ['Annotation files scanned / eligible', scannedFiles + ' / ' + eligibleFiles.length],
          ['Annotation files with unverified index bytes', String(unreadableFiles)],
          ['Semantic identities', String(identities.length)],
          ['...current', String(identities.filter((identity) => identity.status === 'current').length)],
          ['...proposed', String(identities.filter((identity) => identity.status === 'proposed').length)],
          ['...deprecated', String(identities.filter((identity) => identity.status === 'deprecated').length)],
          ['Registered commands', String(commands.length)],
          ['...wired to a handler', String(commands.filter((command) => command.status === 'wired').length)],
          ['...declared only', String(commands.filter((command) => command.status !== 'wired').length)],
        ],
      ),
      '',
    );

    if (!identities.length) {
      out.push('_No semantic identity is registered in this index._', '');
    }

    out.push('## Indexed semantic occurrences', '');
    out.push('Extracted from indexed source bytes. Unknown identities remain unknown; these are not registered commands or runtime receipts.', '');
    if (occurrences.length) {
      out.push(makeTable(['Identity','Annotation','Indexed source','Registry resolution','Assurance','Anchor ID','Fingerprint','Content hash'],
        occurrences.map(({file,anchor,evidence}) => [
          codeSpan(anchor.semanticId),mdCell(anchor.annotationKind),
          fileLink(page,file,file.project_name+':'+file.path+':'+anchor.lines.join(',')),
          mdCell(evidence.resolution),mdCell(evidence.assurance),codeSpan(anchor.anchorId),
          codeSpan(anchor.fingerprint),codeSpan(anchor.contentHash),
        ])), '');
    } else out.push('_No source-backed annotation occurrences in this bounded projection._', '');
    if (eligibleFiles.length > scannedFiles || occurrenceCount > occurrences.length || unreadableFiles)
      out.push('_Incomplete projection: '+(eligibleFiles.length-scannedFiles)+' files not scanned; '+
        (occurrenceCount-occurrences.length)+' indexed anchors not shown; '+unreadableFiles+' files lack matching indexed bytes._', '');

    out.push('## Identities', '');
    out.push(
      makeTable(
        ['Identity', 'Kind', 'Status', 'Authority', 'Meaning', 'Declared at'],
        identities.map((identity) => [
          codeSpan(identity.id),
          mdCell(identity.kind),
          mdCell(identity.status),
          mdCell(identity.authority),
          mdCell(identity.label || identity.description || ''),
          identity.links.length
            ? identity.links.map((link) => mdCell(`${link.path}:${link.line ?? '?'}`)).join('<br>')
            : '—',
        ]),
      ),
      '',
    );

    for (const identity of identities) {
      out.push(`### ${identity.id}`, '');
      const plain = identity.id.includes('@') ? identity.id.slice(0, identity.id.lastIndexOf('@')) : identity.id;
      const command = commandById.get(plain) || null;
      out.push(
        makeTable(
          ['Field', 'Value'],
          [
            ['Kind', mdCell(identity.kind)],
            ['Status', mdCell(identity.status)],
            ['Authority', mdCell(identity.authority)],
            ['Label', mdCell(identity.label || '')],
            ['Description', mdCell(identity.description || '')],
            ['Version', mdCell(identity.version || '')],
            ['Provenance', mdCell(identity.provenance || '')],
            ['Registered at', mdCell(identity.created_at || '')],
            ['Graph node', graphNodeRef(identity.id, ['semantic', 'knowledge'])],
          ],
        ),
        '',
      );
      out.push('**Source evidence**', '');
      if (!identity.links.length) {
        out.push('- No source link. This identity is declared without a pinned source location.', '');
      } else {
        for (const link of identity.links) {
          const {state,file} = resolveSource(link);
          const location = file
            ? fileLink(page, file, `${file.project_name}:${link.path}:${link.line ?? '?'}`)
            : mdCell(`${link.path}:${link.line ?? '?'}`);
          const graphNode = file ? model.graphIndex?.bySourceFile.get(`${link.path}\u0000${link.content_hash}`) : null;
          out.push(
            `- ${location} · ${mdCell(link.kind || 'link')} · registry ${mdCell(link.status || '')} · ${state}`
            + ` · bytes \`${mdCell(String(link.content_hash || '').slice(0, 12))}\``
            + (link.symbol ? ` · \`${mdCell(link.symbol)}\`` : '')
            + (graphNode ? ` · graph \`${mdCell(graphNode.id)}\`` : ''),
          );
        }
      }
      out.push('');
      out.push('**Registered command**', '');
      if (!command) {
        out.push('- No registered command carries this identity.', '');
      } else {
        out.push(
          makeTable(
            ['Field', 'Value'],
            [
              ['Action', codeSpan(command.id)],
              ['CLI syntax', codeSpan(command.command || '(no CLI)')],
              ['Registry status', mdCell(command.status)],
              ['Risk', mdCell(command.risk)],
              ['Mutates', command.mutates ? 'yes' : 'no'],
              ['Approval required', command.approval ? 'yes' : 'no'],
              ['Actors', mdCell((command.actors || []).join(', '))],
              ['Purpose', mdCell(command.purpose || '')],
              ['Handler note', mdCell(command.note || '')],
              ['Graph node', graphNodeRef(command.id, 'command')],
            ],
          ),
          '',
        );
      }
      out.push('');
    }

    out.push('## Registered commands', '');
    const shown = commands.slice(0, 400);
    out.push(
      makeTable(
        ['Action', 'CLI syntax', 'Registry', 'Risk', 'Mutates', 'Approval', 'Actors'],
        shown.map((command) => [
          codeSpan(command.id),
          codeSpan(command.command || '(no CLI)'),
          mdCell(command.status),
          mdCell(command.risk),
          command.mutates ? 'yes' : 'no',
          command.approval ? 'yes' : 'no',
          mdCell((command.actors || []).join(', ')),
        ]),
      ),
      '',
    );
    if (commands.length > shown.length) {
      out.push(`_Showing ${shown.length} of ${commands.length} commands._`, '');
    }

    out.push('## What this page does not claim', '');
    out.push('- A command is *wired* when the canonical action registry binds it to a handler. That is a source declaration, not a runtime receipt.', '');
    out.push('- A semantic identity is *current* only when the canonical semantic registry says so. A comment never creates or promotes one.', '');
    out.push('- Source links require one matching indexed path and content hash. Missing, stale, non-current or ambiguous pins remain visible without a guessed file or graph link. Indexed bytes are not a live filesystem or execution receipt.', '');
    out.push('- Generated wiki pages are read-only; edit the source or the registry and rebuild.', '');
    return out.join('\n');
  }

  // The canonical graph id of a semantic identity or a registered command, when the
  // graph index is present. It is copied verbatim from the exchange; the wiki never
  // computes an id of its own.
  function graphNodeRef(key, domains) {
    const index = model.graphIndex;
    if (!index) return '—';
    const wanted = Array.isArray(domains) ? domains : [domains];
    const candidates = index.bySemanticId.get(key) || index.byActionId.get(key) || [];
    const list = Array.isArray(candidates) ? candidates : [candidates];
    const entry = list.find((candidate) => wanted.includes(candidate.domain)) || list[0] || null;
    return entry ? codeSpan(entry.id) : '—';
  }

  function renderProtocolPage(page) {
    const out = [];
    out.push(...pageHeader('Agent annotation protocol', 'inline comments that give the index its context'));
    out.push('HQ reads structured `@hq:` tags from comments. They are the smallest durable unit of intent an agent can leave behind.', '');
    out.push('## Tags', '');
    out.push(
      makeTable(
        ['Tag', 'Use it for'],
        [
          ['`@hq:context`', 'What this file or block is for, in one line. Put it at the top of the file.'],
          ['`@hq:why`', 'A non-obvious decision, tradeoff or constraint that shaped the code.'],
          ['`@hq:invariant`', 'A rule that must stay true for correctness or safety.'],
          ['`@hq:see`', 'A pointer to another file, symbol or `path:line` anchor.'],
          ['`@hq:todo`', 'Known work. Add an owner when one exists: `@hq:todo(name): text`.'],
          ['`@hq:owner`', 'The person or team accountable for the file or block.'],
          ['`@hq:task`', 'The task or ticket this code serves.'],
          ['`@hq:risk`', 'A hazard, failure mode or security concern.'],
          ['`@hq:deprecated`', 'Scheduled removal, with a replacement pointer when possible.'],
        ],
      ),
      '',
    );
    out.push('## Shape', '');
    out.push('```js', '// @hq:context: resolves import specifiers for the local index', '// @hq:why: relative paths win over package names to keep the index local', '// @hq:todo(owner): add Windows drive-letter coverage', '```', '');
    out.push('## Rules', '');
    out.push('- Comments only (`//`, `#`, `/* */`, `--`, `<!-- -->`); ordinary `// TODO` is not an annotation.', '');
    out.push('- One line per tag. Text is capped at 500 characters.', '');
    out.push('- Never write credentials, tokens, keys or session state into a comment.', '');
    out.push('- Do not restate the signature; explain intent the code cannot show.', '');
    out.push('- `@hq:todo` without an owner is a warning in protocol lint.', '');
    out.push('- `@hq:deprecated` should pair with `@hq:see` pointing at the replacement.', '');
    out.push('- Generated wiki pages are read-only; edit the source and rebuild.', '');

    out.push('## Current annotations', '');
    const counts = countBy(model.annotationRows, (annotation) => annotation.kind);
    out.push(
      counts.size
        ? makeTable(
            ['Kind', 'Count'],
            [...counts.entries()].sort((a, b) => cmpStr(a[0], b[0])).map(([kind, count]) => [mdCell(kind), String(count)]),
          )
        : '_No annotations recorded._',
      '',
    );
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Context
  // -------------------------------------------------------------------------

  function renderContextPage(page) {
    const out = [];
    out.push(...pageHeader('Using HQ', 'CLI, MCP and task-scoped reading'));
    out.push('Everything HQ does is local: one SQLite index under `.hq/`, deterministic output, no network calls.', '');
    const userWord = (key, fallback) => mdText(VIVIM_TAXONOMY.userTerms[key] || fallback);
    const glossaryPage = pageBy.global.get('glossary');
    const glossaryLink = glossaryPage
      ? `[${mdText(glossaryPage.title)}](${relLink(page.path, glossaryPage.path)})`
      : mdText('Glossary');
    out.push(
      `Owner-facing words: **${userWord('space', 'Space')}** for a registered project, `
      + `**${userWord('aperture', 'Discover')}** for a context bundle, `
      + `**${userWord('forge', 'Build')}** for this wiki, `
      + `**${userWord('sitrep', 'Progress Report')}** for the brief and `
      + `**${userWord('evidence', 'Activity Record')}** for the receipts ledger. `
      + `Engineering pages keep the precise term; see the ${glossaryLink}.`,
      '',
    );
    out.push('## Commands', '');
    out.push(
      '```sh',
      'hq index                 # index every registered project',
      'hq index --changed       # re-index changed files only',
      'hq search "query"        # full text over indexed content',
      'hq symbols name          # symbol lookup',
      'hq context "task"        # Discover — context bundle',
      'hq brief                 # Progress Report',
      'hq receipts              # Activity Record',
      'hq wiki                  # Build — regenerate this wiki',
      'hq mcp                   # expose the index over MCP',
      '```',
      '',
    );
    out.push('## Read order', '');
    out.push('1. Start with the project page for scope and entrypoints.', '');
    out.push('2. Open the module page that owns the code you are changing.', '');
    out.push('3. Use the file page for symbols, imports, dependents and annotations.', '');
    out.push('4. Check the dependency graph before cross-module edits.', '');
    out.push('5. Read the protocol before adding or changing inline annotations.', '');
    out.push('6. For agent work, compose a context bundle instead of pasting whole files.', '');

    out.push('## Projects', '');
    out.push(
      model.projects.length
        ? makeTable(
            ['Project', 'Files', 'Symbols', 'Modules'],
            model.projects.map((project) => [
              projectLink(page, project),
              String(project.files.length),
              String(project.symbols.length),
              String(project.components.length),
            ]),
          )
        : '_No projects indexed._',
      '',
    );

    out.push('## Surfaces', '');
    const surfaces = [
      ['symbols', 'Symbol index for name-first navigation.'],
      ['graph', 'Dependency graph for impact review.'],
      ['docs', 'Documentation catalog.'],
      ['changes', 'Commit history and drift.'],
      ['todos', 'Open task annotations with owners.'],
      ['deprecated', 'Scheduled removals and replacements.'],
      ['protocol', 'Annotation tags and rules.'],
      ['glossary', 'VIVIM owner vocabulary next to the engineering term.'],
    ];
    for (const [key, description] of surfaces) {
      const target = pageBy.global.get(key);
      if (target) out.push(`- [${mdText(target.title)}](${relLink(page.path, target.path)}) — ${description}`);
    }
    out.push('');
    out.push('## Notes', '');
    out.push('- Generated pages are deterministic: the same index produces byte-identical output.', '');
    out.push('- Secret paths are excluded from pages, symbols, search and graphs.', '');
    out.push('- Rebuild the wiki after indexing; do not hand-edit generated pages.', '');
    return out.join('\n');
  }

  // -------------------------------------------------------------------------
  // Search + HTML
  // -------------------------------------------------------------------------

  function makeTokens(title, keywords) {
    const out = [];
    const seen = new Set();
    for (const token of [...tokenize(title), ...tokenize((keywords || []).join(' '))]) {
      if (seen.has(token)) continue;
      seen.add(token);
      out.push(token);
      if (out.length >= MAX_SEARCH_TOKENS) break;
    }
    return out;
  }

  for (const page of pages) {
    page.tokens = makeTokens(page.title, page.keywords);
  }

  let searchCache = null;
  function buildSearchEntries() {
    if (searchCache) return searchCache;
    searchCache = pages
      .map((page) => ({
        id: page.id,
        title: page.title,
        project: page.project || '',
        kind: page.kind,
        tokens: page.tokens,
      }))
      .sort((a, b) => cmpStr(a.id, b.id));
    return searchCache;
  }

  function renderIndexHtml(page) {
    const entries = buildSearchEntries();
    const kinds = [...new Set(entries.map((entry) => entry.kind))].sort(cmpStr);
    const projects = [...new Set(entries.map((entry) => entry.project).filter(Boolean))].sort(cmpStr);
    const fallback = JSON.stringify(entries).replace(/</g, '\\u003c');
    const kindOptions = kinds
      .map((kind) => `<option value="${escapeHtml(kind)}">${escapeHtml(kind)}</option>`)
      .join('');
    const projectOptions = projects
      .map((project) => `<option value="${escapeHtml(project)}">${escapeHtml(project)}</option>`)
      .join('');
    const css = [
      ':root{color-scheme:light dark;--bg:#f7f7f5;--fg:#1b1b19;--muted:#666660;--card:#fff;--line:#dcdcd6;--accent:#2f6f4f}',
      '@media (prefers-color-scheme:dark){:root{--bg:#161615;--fg:#ecece8;--muted:#a0a09a;--card:#1f1f1d;--line:#34342f;--accent:#7fc9a4}}',
      '*{box-sizing:border-box}body{margin:0;padding:2rem 1.25rem 4rem;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}',
      'main{max-width:60rem;margin:0 auto}header{margin-bottom:1.5rem}h1{font-size:1.7rem;margin:0 0 .25rem}p.sub{color:var(--muted);margin:.25rem 0}',
      '.controls{display:flex;flex-wrap:wrap;gap:.75rem;align-items:end;margin:1.5rem 0;padding:1rem;background:var(--card);border:1px solid var(--line);border-radius:.6rem}',
      'label{display:flex;flex-direction:column;gap:.3rem;font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}',
      'input,select{font:inherit;padding:.45rem .6rem;border:1px solid var(--line);border-radius:.4rem;background:var(--bg);color:var(--fg);min-width:11rem}',
      'input:focus,select:focus,button:focus,a:focus{outline:2px solid var(--accent);outline-offset:2px}',
      '#count{color:var(--muted);font-size:.9rem;margin:.25rem 0 1rem}',
      'ul.pages{list-style:none;margin:0;padding:0;display:grid;gap:.5rem}',
      'li.page{background:var(--card);border:1px solid var(--line);border-radius:.5rem;padding:.7rem .85rem}',
      'li.page a{color:var(--accent);text-decoration:none;font-weight:600}li.page a:hover{text-decoration:underline}',
      '.meta{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.3rem}',
      '.tag{font-size:.72rem;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:.05rem .5rem}',
      'footer{margin-top:2rem;color:var(--muted);font-size:.85rem}',
    ].join('\n');
    const js = [
      "(function(){",
      "  var fallback = JSON.parse(document.getElementById('fallback').textContent);",
      "  var data = fallback;",
      "  var q = document.getElementById('q');",
      "  var kind = document.getElementById('kind');",
      "  var project = document.getElementById('project');",
      "  var list = document.getElementById('pages');",
      "  var count = document.getElementById('count');",
      "  function esc(s){ var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }",
      "  function render(){",
      "    var term = q.value.trim().toLowerCase();",
      "    var k = kind.value; var p = project.value;",
      "    var shown = data.filter(function(d){",
      "      if (k && d.kind !== k) return false;",
      "      if (p && d.project !== p) return false;",
      "      if (!term) return true;",
      "      var hay = (d.title + ' ' + d.project + ' ' + d.kind + ' ' + (d.tokens || []).join(' ')).toLowerCase();",
      "      return hay.indexOf(term) !== -1;",
      "    });",
      "    list.innerHTML = shown.map(function(d){",
      "      var tags = '<span class=\"tag\">' + esc(d.kind) + '</span>';",
      "      if (d.project) tags += '<span class=\"tag\">' + esc(d.project) + '</span>';",
      "      return '<li class=\"page\"><a href=\"./' + encodeURI(d.path) + '\">' + esc(d.title) + '</a><div class=\"meta\">' + tags + '</div></li>';",
      "    }).join('');",
      "    count.textContent = shown.length + ' of ' + data.length + ' pages';",
      "  }",
      "  [q, kind, project].forEach(function(el){ el.addEventListener('input', render); el.addEventListener('change', render); });",
      "  render();",
      "  fetch('./search.json').then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); })",
      "    .then(function(json){ if (Array.isArray(json) && json.length) { data = json; render(); } })",
      "    .catch(function(){ /* offline file:// view keeps the embedded fallback */ });",
      "})();",
    ].join('\n');
    const html = [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>HQ wiki — ' + escapeHtml(model.workspaceName) + '</title>',
      '<style>',
      css,
      '</style>',
      '</head>',
      '<body>',
      '<main>',
      '<header>',
      '<h1>HQ wiki — ' + escapeHtml(model.workspaceName) + '</h1>',
      '<p class="sub">Generated ' + escapeHtml(dateLabel()) + ' · ' + entries.length + ' pages · Local only</p>',
      '</header>',
      '<section class="controls" aria-label="Filters">',
      '<label>Search<input id="q" type="search" placeholder="Filter pages…" autocomplete="off"></label>',
      '<label>Kind<select id="kind"><option value="">All kinds</option>' + kindOptions + '</select></label>',
      '<label>Project<select id="project"><option value="">All projects</option>' + projectOptions + '</select></label>',
      '</section>',
      '<p id="count" role="status"></p>',
      '<ul class="pages" id="pages"></ul>',
      '<footer>Everything here stays on this machine. HQ never sends your data.</footer>',
      '</main>',
      '<script id="fallback" type="application/json">' + fallback + '</script>',
      '<script>',
      js,
      '</script>',
      '</body>',
      '</html>',
    ].join('\n');
    return html;
  }

  // -------------------------------------------------------------------------
  // Render + write
  // -------------------------------------------------------------------------

  const rendered = pages.map((page) => ({
    page,
    content: finishPage(page, page.render()),
  }));
  rendered.sort((a, b) => cmpStr(a.page.id, b.page.id));

  const existingStmt = db.prepare('SELECT id, input_hash FROM wiki_pages WHERE id = ?');
  const upsertStmt = db.prepare(
    `INSERT INTO wiki_pages(id, input_hash, generated_at, bytes)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET input_hash = excluded.input_hash,
       generated_at = excluded.generated_at, bytes = excluded.bytes`,
  );

  let tmpCounter = 0;
  function writeAtomic(absPath, content) {
    mkdirSync(dirname(absPath), { recursive: true });
    const tmp = `${absPath}.tmp-${process.pid}-${tmpCounter}`;
    tmpCounter += 1;
    writeFileSync(tmp, content, 'utf8');
    try {
      renameSync(tmp, absPath);
    } catch {
      try {
        rmSync(absPath, { force: true });
      } catch {
        // ignore; the rename below reports the real failure
      }
      renameSync(tmp, absPath);
    }
  }

  let written = 0;
  let skipped = 0;
  let removedPages = 0;
  let totalBytes = 0;
  const pageResults = [];

  for (const { page, content } of rendered) {
    const bytes = Buffer.byteLength(content, 'utf8');
    totalBytes += bytes;
    const inputHash = digestOf({ version: WIKI_VERSION, content });
    const dest = join(destRoot, ...page.path.split('/'));
    const existing = existingStmt.get(page.id);
    const upToDate = !force && existing && existing.input_hash === inputHash && existsSync(dest);
    if (upToDate) {
      skipped += 1;
      pageResults.push({ id: page.id, path: page.path, bytes, generated: false });
      continue;
    }
    writeAtomic(dest, content);
    // The hash table describes the CANONICAL wiki directory. A build into a
    // foreign outDir (wiki --check's temp dir, --out exports) must never
    // upsert hashes: doing so poisons the cache and later incremental regens
    // skip pages whose on-disk content is stale (wiki --check then fails
    // until a --force).
    if (persistHashes) {
      upsertStmt.run(page.id, inputHash, model.generatedAt, bytes);
    }
    written += 1;
    pageResults.push({ id: page.id, path: page.path, bytes, generated: true });
  }

  // Orphan cleanup (canonical builds only): pages whose sources disappeared
  // (a file deleted from the index) must leave the wiki — both the hash row
  // and the generated file. Without this the incremental generator leaves
  // them forever and `wiki --check` reports them as "removed" indefinitely.
  // The wiki directory is generator-owned (read-only by protocol), so any
  // regular file under destRoot that the current page set does not declare is
  // stale by definition; emptied directories are removed best-effort.
  if (persistHashes) {
    const keepPaths = new Set(rendered.map((entry) => toPosix(entry.page.path)));
    const keepIds = new Set(rendered.map((entry) => entry.page.id));
    const deleteRow = db.prepare('DELETE FROM wiki_pages WHERE id = ?');
    for (const row of db.prepare('SELECT id FROM wiki_pages').all()) {
      if (keepIds.has(row.id)) continue;
      deleteRow.run(row.id);
      removedPages += 1;
    }
    const removeIfStale = (absDir) => {
      let empty = true;
      let items;
      try {
        items = readdirSync(absDir, { withFileTypes: true });
      } catch {
        return true;
      }
      for (const item of items) {
        const abs = join(absDir, item.name);
        if (item.isDirectory()) {
          if (!removeIfStale(abs)) empty = false;
        } else if (item.isFile()) {
          const rel = toPosix(relative(destRoot, abs));
          if (keepPaths.has(rel)) {
            empty = false;
          } else {
            try {
              rmSync(abs, { force: true });
              removedPages += 1;
            } catch {
              empty = false;
            }
          }
        } else {
          empty = false;
        }
      }
      if (empty && absDir !== destRoot) {
        try { rmdirSync(absDir); } catch { /* not empty / in use */ }
      }
      return empty;
    };
    removeIfStale(destRoot);
  }

  const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
  return {
    pages: pageResults,
    written,
    skipped,
    removed: removedPages,
    total: pageResults.length,
    bytes: totalBytes,
    ms: Math.round(elapsed),
  };
}
