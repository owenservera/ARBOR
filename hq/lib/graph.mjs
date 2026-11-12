// hq/lib/graph.mjs — dependency traversal and project-level graph summaries.
//
// Edges come from imports.resolved_file_id, so only imports that the indexer
// actually resolved into files participate. Traversal is breadth-first,
// cycle-safe, capped and deterministically ordered (depth, then path).
import { toPosix } from './util.mjs';

function toCount(value, fallback, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.trunc(n));
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (m) => '\\' + m);
}

function normalizeTarget(target) {
  return toPosix(String(target ?? '').trim())
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
}

// resolveRoot — exact relative path, then suffix match, then unique basename.
// More than one candidate at the first matching stage means ambiguity, which
// returns null so callers never guess.
function resolveRoot(db, target, project) {
  const wanted = normalizeTarget(target);
  if (!wanted) return null;

  const projectClause = project ? ' AND lower(p.name) = lower(?)' : '';
  const projectParams = project ? [project] : [];
  const head = 'SELECT f.id AS id, f.path AS path, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE ';
  const tail = ' ORDER BY p.name ASC, f.path ASC LIMIT 20';
  const lower = wanted.toLowerCase();
  const basename = lower.split('/').pop();

  const stages = [
    { sql: `lower(f.path) = lower(?)${projectClause}`, params: [wanted, ...projectParams] },
    { sql: `lower(f.path) LIKE ? ESCAPE '\\'${projectClause}`, params: [`%/${escapeLike(lower)}`, ...projectParams] },
  ];
  if (basename && basename !== lower) {
    stages.push({
      sql: `(lower(f.path) = ? OR lower(f.path) LIKE ? ESCAPE '\\')${projectClause}`,
      params: [basename, `%/${escapeLike(basename)}`, ...projectParams],
    });
  }

  for (const stage of stages) {
    const rows = db.prepare(head + stage.sql + tail).all(...stage.params);
    if (rows.length === 1) return { id: Number(rows[0].id), path: rows[0].path, project: rows[0].project };
    if (rows.length > 1) return null;
  }
  return null;
}

export function deps(db, options = {}) {
  const reverse = options.reverse === true;
  const direction = reverse ? 'reverse' : 'forward';
  const depth = toCount(options.depth, 2, 0);
  const limit = toCount(options.limit, 200, 1);
  const empty = { root: null, direction, nodes: [], edges: [] };

  const root = resolveRoot(db, options.target, options.project ?? null);
  if (!root) return empty;

  const forwardStmt = db.prepare(`
SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier
FROM imports i
JOIN files f ON f.id = i.resolved_file_id
JOIN projects p ON p.id = f.project_id
WHERE i.file_id = ? AND i.resolved_file_id IS NOT NULL
ORDER BY f.path ASC, p.name ASC, i.specifier ASC`);
  const reverseStmt = db.prepare(`
SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier
FROM imports i
JOIN files f ON f.id = i.file_id
JOIN projects p ON p.id = f.project_id
WHERE i.resolved_file_id = ?
ORDER BY f.path ASC, p.name ASC, i.specifier ASC`);
  const stmt = reverse ? reverseStmt : forwardStmt;

  const byId = new Map();
  const nodes = [];
  const rootNode = { id: root.id, path: root.path, project: root.project, depth: 0, via: null };
  byId.set(root.id, rootNode);
  nodes.push(rootNode);

  const edges = [];
  const edgeSeen = new Set();
  const queue = [rootNode];
  let cursor = 0;

  while (cursor < queue.length) {
    const node = queue[cursor++];
    if (node.depth >= depth) continue;
    if (nodes.length >= limit) break;

    const rows = stmt.all(node.id);
    for (const row of rows) {
      const childId = Number(row.id);
      let child = byId.get(childId);
      if (!child) {
        if (nodes.length >= limit) break;
        child = { id: childId, path: row.path, project: row.project, depth: node.depth + 1, via: row.specifier };
        byId.set(childId, child);
        nodes.push(child);
        queue.push(child);
      }

      const fromId = reverse ? childId : node.id;
      const toId = reverse ? node.id : childId;
      const edgeKey = `${fromId}\0${toId}\0${row.specifier}`;
      if (edgeSeen.has(edgeKey)) continue;
      edgeSeen.add(edgeKey);
      edges.push({
        from: reverse ? row.path : node.path,
        to: reverse ? node.path : row.path,
        specifier: row.specifier,
      });
    }
  }

  nodes.sort((a, b) => (
    a.depth - b.depth
    || a.path.localeCompare(b.path)
    || a.project.localeCompare(b.project)
  ));
  edges.sort((a, b) => (
    a.from.localeCompare(b.from)
    || a.to.localeCompare(b.to)
    || a.specifier.localeCompare(b.specifier)
  ));

  return {
    root: { path: root.path, project: root.project },
    direction,
    nodes: nodes.slice(0, limit).map(({ path, project, depth: d, via }) => ({ path, project, depth: d, via })),
    edges,
  };
}

export function impact(db, options = {}) {
  return deps(db, {
    ...options,
    depth: options.depth ?? 3,
    limit: options.limit ?? 500,
    reverse: true,
  });
}

export function projectGraph(db) {
  const projects = db.prepare('SELECT id, name FROM projects ORDER BY name ASC').all();
  const fileCounts = new Map(
    db.prepare('SELECT project_id, COUNT(*) AS c FROM files GROUP BY project_id').all()
      .map((row) => [Number(row.project_id), Number(row.c)]),
  );
  const symbolCounts = new Map(
    db.prepare('SELECT project_id, COUNT(*) AS c FROM symbols GROUP BY project_id').all()
      .map((row) => [Number(row.project_id), Number(row.c)]),
  );

  const edgeRows = db.prepare(`
SELECT p1.name AS src, p2.name AS dst, COUNT(*) AS c
FROM imports i
JOIN projects p1 ON p1.id = i.project_id
LEFT JOIN files rf ON rf.id = i.resolved_file_id
LEFT JOIN projects p2 ON p2.id = COALESCE(i.resolved_project_id, rf.project_id)
WHERE p2.id IS NOT NULL AND p2.id <> p1.id
GROUP BY p1.name, p2.name
ORDER BY p1.name ASC, p2.name ASC`).all();

  const incoming = new Map();
  const outgoing = new Map();
  const edges = edgeRows.map((row) => {
    const count = Number(row.c);
    outgoing.set(row.src, (outgoing.get(row.src) ?? 0) + count);
    incoming.set(row.dst, (incoming.get(row.dst) ?? 0) + count);
    return { from: row.src, to: row.dst, count };
  });

  const nodes = projects.map((project) => ({
    project: project.name,
    files: fileCounts.get(Number(project.id)) ?? 0,
    symbols: symbolCounts.get(Number(project.id)) ?? 0,
    incoming: incoming.get(project.name) ?? 0,
    outgoing: outgoing.get(project.name) ?? 0,
  }));

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Orphan / reachability analysis.
//
// An "orphan" here is a source file that has NO inbound resolved import edge
// (nothing imports it statically) yet still exports symbols. Two questions
// follow, and both need more than the import table alone:
//
//   HQ-023  which modules have no verified runtime consumer at all?
//   HQ-029  which orphans are actually loaded dynamically (import()) and so
//           must NOT be retired?
//
// Static orphanhood alone is not proof of death: a dynamic import() has no
// static inbound edge, and a runtime/execution allowlist is not derivable
// from the source index. These helpers therefore report the STATIC facts
// (orphan set, dynamic-load set) and let the caller decide, rather than
// asserting a runtime conclusion the index cannot support.
// ---------------------------------------------------------------------------

const DEFAULT_ORPHAN_LIMIT = 500;

// Import-edge kinds. A STATIC edge (`import`, `export_from`, `use`,
// `require`) means the importer loads the target unconditionally when the
// importer itself loads. A DYNAMIC edge (`import(...)`) is a runtime load
// that static analysis does not follow — precisely the case HQ-029 exists to
// catch, so a dynamic edge must NOT count as a static inbound edge.
const STATIC_EDGE_KINDS = "('import','export_from','use','require','include')";

/**
 * staticOrphans — source files that export symbols and have no inbound
 * STATIC import edge from a different file.
 *
 * A module reached only through a dynamic import() call site still appears
 * here: to a static reader it looks unreferenced, which is exactly the
 * apparently-orphaned case HQ-029 asks about. Use orphanStatus() to tell
 * those apart from genuinely unreferenced modules.
 *
 * FILE-level view, one row per file. NOT the same vocabulary as orphans()
 * (the symbol-level view below): orphans() counts ANY inbound import —
 * including a dynamic import() — as a consumer, so a dynamically-loaded file
 * never appears in orphans() but still appears here.
 *
 * @param {object} db
 * @param {{project?: string|null, limit?: number, includeTests?: boolean}} options
 * @returns {Array<{path:string, project:string, exports:number, is_test:number}>}
 */
export function staticOrphans(db, options = {}) {
  const project = options.project ?? null;
  const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1);
  const includeTests = options.includeTests !== false;
  const projectClause = project ? ' AND p.name = ?' : '';
  const params = project ? [project] : [];
  const testClause = includeTests ? '' : ' AND f.is_test = 0';
  const rows = db.prepare(`
SELECT f.path AS path, p.name AS project, COUNT(*) AS exports, f.is_test AS is_test
FROM files f
JOIN projects p ON p.id = f.project_id
JOIN symbols s ON s.file_id = f.id AND s.exported = 1
WHERE NOT EXISTS (
  SELECT 1 FROM imports i
  WHERE i.resolved_file_id = f.id AND i.file_id <> f.id
    AND i.kind IN ${STATIC_EDGE_KINDS}
)${testClause}${projectClause}
GROUP BY f.id
ORDER BY p.name ASC, f.path ASC
LIMIT ?`).all(...params, limit);
  return rows.map((r) => ({
    path: r.path,
    project: r.project,
    exports: Number(r.exports),
    is_test: Number(r.is_test),
  }));
}

/**
 * dynamicLoads — resolved import() call sites, i.e. the load edges that do
 * NOT appear as static inbound imports.
 *
 * @param {object} db
 * @param {{project?: string|null, limit?: number}} options
 * @returns {Array<{from:string, fromProject:string, to:string, toProject:string, specifier:string, line:number}>}
 */
export function dynamicLoads(db, options = {}) {
  const project = options.project ?? null;
  const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1);
  const projectClause = project ? ' AND sp.name = ?' : '';
  const params = project ? [project] : [];
  const rows = db.prepare(`
SELECT sf.path AS from_path, sp.name AS from_project,
       tf.path AS to_path, tp.name AS to_project,
       i.specifier AS specifier, i.line AS line
FROM imports i
JOIN files sf ON sf.id = i.file_id
JOIN projects sp ON sp.id = sf.project_id
JOIN files tf ON tf.id = i.resolved_file_id
JOIN projects tp ON tp.id = tf.project_id
WHERE i.kind = 'dynamic' AND sp.name IS NOT NULL${projectClause}
ORDER BY sp.name ASC, sf.path ASC, i.line ASC
LIMIT ?`).all(...params, limit);
  return rows.map((r) => ({
    from: r.from_path,
    fromProject: r.from_project,
    to: r.to_path,
    toProject: r.to_project,
    specifier: r.specifier,
    line: Number(r.line),
  }));
}

/**
 * orphanStatus — classify every static orphan as DYNAMICALLY_LOADED (a
 * dynamic import() names it, so it must not be retired) or UNREFERENCED
 * (no static and no dynamic inbound edge at all).
 *
 * @param {object} db
 * @param {{project?: string|null, limit?: number, includeTests?: boolean}} options
 * @returns {{orphans: Array<object>, dynamicallyLoaded: Array<object>, unreferenced: Array<object>}}
 */
export function orphanStatus(db, options = {}) {
  const project = options.project ?? null;
  const orphans = staticOrphans(db, options);
  const loads = dynamicLoads(db, { ...options, limit: toCount(options.loadLimit, 5000, 1) });
  const loadedPaths = new Set(loads.map((l) => `${l.toProject}\u0000${l.to}`));
  const dynamicallyLoaded = [];
  const unreferenced = [];
  for (const orphan of orphans) {
    const key = `${orphan.project}\u0000${orphan.path}`;
    if (loadedPaths.has(key)) {
      dynamicallyLoaded.push({
        ...orphan,
        loadedBy: loads.filter((l) => l.to === orphan.path && l.toProject === orphan.project),
      });
    } else {
      unreferenced.push(orphan);
    }
  }
  return { orphans, dynamicallyLoaded, unreferenced };
}

/**
 * reachableRoutes — for every route symbol in the index, report whether the
 * file that declares it is reachable by an actual user.
 *
 * Reachability is computed over resolved import edges starting from the
 * PRODUCTION entry points: non-test files that no other file imports. A route
 * declared in a test file is never user-reachable (it is exercised only by
 * the test harness), and a route declared in a file that no production entry
 * point reaches is unreachable too. A route is REACHABLE when its declaring
 * file is a non-test file inside the forward closure of those roots.
 *
 * @param {object} db
 * @param {{project?: string|null, depth?: number, limit?: number}} options
 * @returns {Array<{path:string, project:string, route:string, method:string, line:number, isTest:boolean, reachable:boolean}>}
 */
export function reachableRoutes(db, options = {}) {
  const project = options.project ?? null;
  const depth = toCount(options.depth, 6, 0);
  const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1);
  const projectClause = project ? ' AND p.name = ?' : '';
  const params = project ? [project] : [];

  const routeRows = db.prepare(`
SELECT f.id AS file_id, f.path AS path, p.name AS project, f.is_test AS is_test,
       s.name AS route, s.signature AS signature, s.line AS line
FROM symbols s
JOIN files f ON f.id = s.file_id
JOIN projects p ON p.id = f.project_id
WHERE s.kind = 'route'${projectClause}
ORDER BY p.name ASC, f.path ASC, s.line ASC
LIMIT ?`).all(...params, limit);

  // Roots are the PRODUCTION entry points: non-test files that no other file
  // imports. A test file is never a root — a route declared only inside a
  // test fixture is not reachable by an actual user.
  const rootRows = db.prepare(`
SELECT f.id AS id, f.path AS path, p.name AS project
FROM files f
JOIN projects p ON p.id = f.project_id
WHERE f.is_test = 0
  AND NOT EXISTS (
    SELECT 1 FROM imports i
    WHERE i.resolved_file_id = f.id AND i.file_id <> f.id
  )${projectClause}
ORDER BY p.name ASC, f.path ASC`).all(...params);

  const reachableIds = forwardClosure(db, rootRows, { depth, limit: 5000 });

  return routeRows.map((r) => ({
    path: r.path,
    project: r.project,
    route: r.route,
    method: String(r.signature ?? '').split(' ')[0],
    line: Number(r.line),
    isTest: Number(r.is_test) === 1,
    reachable: Number(r.is_test) === 0 && reachableIds.has(Number(r.file_id)),
  }));
}

/**
 * forwardClosure — set of file ids reachable from the given roots over
 * resolved import edges (breadth-first, depth-capped, cycle-safe).
 */
function forwardClosure(db, roots, { depth, limit }) {
  const seen = new Set();
  const queue = [];
  for (const root of roots) {
    const id = Number(root.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    queue.push({ id, depth: 0 });
  }
  const stmt = db.prepare(`
SELECT i.resolved_file_id AS id
FROM imports i
WHERE i.file_id = ? AND i.resolved_file_id IS NOT NULL`);
  let cursor = 0;
  while (cursor < queue.length && seen.size < limit) {
    const node = queue[cursor++];
    if (node.depth >= depth) continue;
    for (const row of stmt.all(node.id)) {
      const id = Number(row.id);
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push({ id, depth: node.depth + 1 });
    }
  }
  return seen;
}

/**
 * agentToolCoupling — import edges where an agent-tool file is pulled into
 * product runtime code (or vice versa).
 *
 * An agent tool is a file that lives under an agent-tool directory
 * (`.opencode/`, `.zcode/`, `plugins/`, `agents/`) or whose name marks it as
 * agent tooling. Coupling is reported only when the two sides sit in
 * DIFFERENT roles: an agent tool imported by a product file (or a product
 * file imported by an agent tool) is accidental coupling. Edges inside one
 * role are normal and are not reported.
 *
 * @param {object} db
 * @param {{project?: string|null, limit?: number, includeTests?: boolean}} options
 * @returns {Array<{from:string, fromProject:string, fromRole:string, to:string, toProject:string, toRole:string, specifier:string, line:number}>}
 */
export function agentToolCoupling(db, options = {}) {
  const project = options.project ?? null;
  const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1);
  const includeTests = options.includeTests !== false;
  const projectClause = project ? ' AND sp.name = ?' : '';
  const params = project ? [project] : [];

  // The cross-role predicate is applied IN SQL so the LIMIT bounds the
  // COUPLING EDGES, not the first N import edges of the whole workspace.
  const agentTool = AGENT_TOOL_SQL;
  const rows = db.prepare(`
SELECT sf.path AS from_path, sp.name AS from_project, sf.is_test AS from_test,
       tf.path AS to_path, tp.name AS to_project, tf.is_test AS to_test,
       i.specifier AS specifier, i.line AS line
FROM imports i
JOIN files sf ON sf.id = i.file_id
JOIN projects sp ON sp.id = sf.project_id
JOIN files tf ON tf.id = i.resolved_file_id
JOIN projects tp ON tp.id = tf.project_id
WHERE i.resolved_file_id IS NOT NULL
  AND ((${agentTool('sf.path')}) <> (${agentTool('tf.path')}))
  ${includeTests ? '' : 'AND sf.is_test = 0 AND tf.is_test = 0'}
  ${projectClause}
ORDER BY sp.name ASC, sf.path ASC, i.line ASC
LIMIT ?`).all(...params, limit);

  return rows.map((row) => ({
    from: row.from_path,
    fromProject: row.from_project,
    fromRole: classifyRole(row.from_path),
    to: row.to_path,
    toProject: row.to_project,
    toRole: classifyRole(row.to_path),
    specifier: row.specifier,
    line: Number(row.line),
  }));
}

const AGENT_TOOL_DIRS = ['.opencode/', '.zcode/', 'plugins/', 'agents/'];

/**
 * AGENT_TOOL_SQL — SQL predicate matching a dev-agent-tool path.
 *
 * Top-level anchoring only: the path must START with one of the agent-tool
 * roots. A nested `agents/` (e.g. `studio/src/agents/...`) is product
 * runtime code that happens to be about agents, not agent tooling.
 */
const AGENT_TOOL_SQL = (col) =>
  `(${AGENT_TOOL_DIRS.map((dir) => `${col} LIKE '${dir.replace(/'/g, "''")}%'`).join(' OR ')})`;

/**
 * classifyRole — 'agent_tool' for development-agent tooling, 'product' for
 * everything else.
 *
 * Classification is DIRECTORY-based only, and top-level anchored: the agent
 * tool installations in this workspace live at the repository root under
 * `.opencode/`, `.zcode/`, `plugins/` and `agents/`. A name-based rule
 * ("agent.ts") would misclassify product code that merely happens to be
 * ABOUT agents (e.g. a connector's agent client), turning a real product
 * import into a false coupling finding.
 *
 * Pure path classification; no filesystem access.
 */
export function classifyRole(path) {
  const p = toPosix(String(path ?? ''));
  for (const dir of AGENT_TOOL_DIRS) {
    if (p.startsWith(dir)) return 'agent_tool';
  }
  return 'product';
}

// ---------------------------------------------------------------------------
// AII gap engines (PRD HQ-PRD-AII-001). All read-only SQLite probes over the
// existing index; they add capability without changing any existing export.
// ---------------------------------------------------------------------------

// unresolvedImports — imports from a target file that did not resolve to any
// indexed file (resolved_file_id IS NULL). Ground truth for "which missing
// dependency prevents this feature from activating" (HQ-063).
export function unresolvedImports(db, options = {}) {
  const root = resolveRoot(db, options.target, options.project ?? null);
  if (!root) return { root: null, imports: [] };
  const rows = db.prepare(`
    SELECT i.specifier AS specifier, i.line AS line, f.path AS file_path
    FROM imports i
    JOIN files f ON f.id = i.file_id
    WHERE i.file_id = ? AND i.resolved_file_id IS NULL
    ORDER BY i.line ASC, i.specifier ASC
  `).all(root.id);
  return {
    root: { path: root.path, project: root.project },
    imports: rows.map((row) => ({
      specifier: row.specifier,
      line: Number(row.line),
      file: row.file_path,
    })),
  };
}

// orphans — exported symbols with no inbound import from a different file.
// Mirrors hq dead's candidate surface but returns structured rows. Ground
// truth for orphan-repair analyses (HQ-074, HQ-076).
//
// SYMBOL-level view, one row per exported symbol. NOT the same vocabulary as
// staticOrphans() (the file-level view above): staticOrphans() only counts
// STATIC edge kinds as consumers, so a file loaded solely via a dynamic
// import() still appears there — here the NOT EXISTS accepts ANY inbound
// import kind, so a dynamically-loaded file never appears at all.
export function orphans(db, options = {}) {
  const projectClause = options.project ? ' AND lower(p.name) = lower(?)' : '';
  const params = options.project ? [options.project] : [];
  const rows = db.prepare(`
    SELECT s.name AS name, s.kind AS kind, s.line AS line,
           f.path AS path, p.name AS project
    FROM symbols s
    JOIN files f ON f.id = s.file_id
    JOIN projects p ON p.id = s.project_id
    WHERE s.exported = 1
      AND NOT EXISTS (
        SELECT 1 FROM imports i
        WHERE i.resolved_file_id = s.file_id AND i.file_id <> s.file_id
      )
      ${projectClause}
    ORDER BY p.name ASC, f.path ASC, s.line ASC
  `).all(...params);
  return rows.map((row) => ({
    name: row.name,
    kind: row.kind,
    line: Number(row.line),
    path: row.path,
    project: row.project,
  }));
}

// reachable — forward transitive closure of resolved imports from a root file.
// Returns the set of file paths reachable (excluding the root) plus edges, for
// change-independence and connection analyses.
export function reachable(db, options = {}) {
  const root = resolveRoot(db, options.target, options.project ?? null);
  if (!root) return { root: null, paths: [], edges: [] };
  const depth = toCount(options.depth, 50, 0);
  const forwardStmt = db.prepare(`
    SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier
    FROM imports i
    JOIN files f ON f.id = i.resolved_file_id
    JOIN projects p ON p.id = f.project_id
    WHERE i.file_id = ? AND i.resolved_file_id IS NOT NULL
    ORDER BY f.path ASC, p.name ASC, i.specifier ASC`);
  const byId = new Map();
  const paths = [];
  const edges = [];
  const edgeSeen = new Set();
  const queue = [{ id: root.id, path: root.path, depth: 0 }];
  byId.set(root.id, root.path);
  let cursor = 0;
  while (cursor < queue.length) {
    const node = queue[cursor++];
    if (node.depth >= depth) continue;
    const rows = forwardStmt.all(node.id);
    for (const row of rows) {
      const childId = Number(row.id);
      const childPath = row.path;
      if (!byId.has(childId)) {
        byId.set(childId, childPath);
        paths.push(childPath);
        queue.push({ id: childId, path: childPath, depth: node.depth + 1 });
      }
      const edgeKey = `${node.path}\0${childPath}\0${row.specifier}`;
      if (edgeSeen.has(edgeKey)) continue;
      edgeSeen.add(edgeKey);
      edges.push({ from: node.path, to: childPath, specifier: row.specifier });
    }
  }
  return { root: { path: root.path, project: root.project }, paths, edges };
}

// minimalConnection — smallest edge set that makes an orphaned file reachable
// from a consumer file. If already connected, the edit set is empty. Otherwise
// a single direct import (consumer -> orphan) is necessary and sufficient.
// Ground truth for "smallest safe change to connect this orphaned capability" (HQ-074).
export function minimalConnection(db, options = {}) {
  const orphan = resolveRoot(db, options.orphan, options.project ?? null);
  const consumer = resolveRoot(db, options.consumer, options.project ?? null);
  if (!orphan || !consumer) {
    return { orphan: options.orphan, consumer: options.consumer, connected: false, edges: [], error: 'target_not_found' };
  }
  const forward = reachable(db, { target: options.consumer, project: options.project, depth: 50 });
  const already = forward.paths.includes(orphan.path);
  const edges = already ? [] : [{ from: consumer.path, to: orphan.path }];
  return { orphan: orphan.path, consumer: consumer.path, connected: already, edges };
}

// dependencyAffectedSystems — projects (transitively) importing files owned by
// the project that provides the given package. Ground truth for "which systems
// are affected by upgrading this dependency" (HQ-075).
export function dependencyAffectedSystems(db, options = {}) {
  const pkg = String(options.package ?? '').trim();
  if (!pkg) return { package: '', provider: null, affected: [] };
  const projectClause = ' AND lower(p.name) = lower(?)';
  const providerRow = db.prepare(`
    SELECT id, name FROM projects WHERE lower(name) = lower(?) LIMIT 1
  `).get(pkg);
  if (!providerRow) {
    // Also match by declared package name in package.json is not indexed here;
    // fall back to no provider.
    return { package: pkg, provider: null, affected: [] };
  }
  const providerId = Number(providerRow.id);
  const providerFiles = new Set(
    db.prepare('SELECT id FROM files WHERE project_id = ?').all(providerId).map((r) => Number(r.id)),
  );
  if (providerFiles.size === 0) {
    return { package: pkg, provider: providerRow.name, affected: [] };
  }
  // Transitive reverse walk over projects. The frontier starts at the
  // provider's whole file set (thousands of ids in a real workspace), so every
  // IN-list is chunked to at most 900 placeholders per query — SQLite's hard
  // cap is 32,766 host parameters, and the provider file count grows with the
  // workspace. Per-chunk results are merged; `seen` deduplicates across
  // chunks, so the merged output is identical to a single-query walk.
  const SQL_IN_CHUNK = 900;
  const importerRows = (ids) => {
    const ph = ids.map(() => '?').join(',');
    return db.prepare(`
      SELECT DISTINCT i.file_id AS importer_id, i.resolved_file_id AS target_id
      FROM imports i
      WHERE i.resolved_file_id IN (${ph}) AND i.resolved_file_id IS NOT NULL
    `).all(...ids);
  };
  const affectedProjects = new Set();
  const frontier = [...providerFiles];
  const seen = new Set(providerFiles);
  while (frontier.length) {
    const next = [];
    for (let i = 0; i < frontier.length; i += SQL_IN_CHUNK) {
      const rows = importerRows(frontier.slice(i, i + SQL_IN_CHUNK));
      for (const row of rows) {
        const importerId = Number(row.importer_id);
        if (seen.has(importerId)) continue;
        seen.add(importerId);
        const frow = db.prepare('SELECT project_id FROM files WHERE id = ?').get(importerId);
        if (frow) {
          const pid = Number(frow.project_id);
          if (pid !== providerId) affectedProjects.add(pid);
        }
        next.push(importerId);
      }
    }
    frontier.length = 0;
    for (let i = 0; i < next.length; i += SQL_IN_CHUNK) frontier.push(...next.slice(i, i + SQL_IN_CHUNK));
  }
  const affected = [];
  for (const pid of affectedProjects) {
    const prow = db.prepare('SELECT name FROM projects WHERE id = ?').get(pid);
    if (prow) affected.push(prow.name);
  }
  affected.sort();
  return { package: pkg, provider: providerRow.name, affected };
}

// migrationRisks — hidden couplings around an implementation file that a
// static import graph does not show: annotation-driven wiring and tests that
// import the implementation. Ground truth for "hidden migration risks" (HQ-076).
export function migrationRisks(db, options = {}) {
  const root = resolveRoot(db, options.implementation, options.project ?? null);
  if (!root) return { implementation: options.implementation, risks: [] };
  const implId = root.id;
  const risks = [];
  // Annotation-driven wiring on the implementation itself.
  const annRows = db.prepare(`
    SELECT a.kind AS kind, a.text AS text, a.line AS line, f.path AS path
    FROM annotations a JOIN files f ON f.id = a.file_id
    WHERE a.file_id = ?
    ORDER BY a.line ASC
  `).all(implId);
  for (const row of annRows) {
    risks.push({
      kind: 'annotation',
      detail: `${row.kind}: ${row.text}`,
      file: row.path,
      line: Number(row.line),
    });
  }
  // Test files that import the implementation (mock surface).
  const testRows = db.prepare(`
    SELECT DISTINCT f.path AS path, i.specifier AS specifier
    FROM imports i
    JOIN files f ON f.id = i.file_id
    WHERE i.resolved_file_id = ? AND f.is_test = 1
    ORDER BY f.path ASC
  `).all(implId);
  for (const row of testRows) {
    risks.push({
      kind: 'test_import',
      detail: `test imports implementation via ${row.specifier}`,
      file: row.path,
    });
  }
  return { implementation: root.path, risks };
}

// dependents — reverse transitive closure: the files that transitively import
// a root file. This is the DOWNSTREAM surface of a change: the code that has
// to be re-verified when the root changes.
export function dependents(db, options = {}) {
  const root = resolveRoot(db, options.target, options.project ?? null);
  if (!root) return { root: null, paths: [], edges: [] };
  const depth = toCount(options.depth, 50, 0);
  const reverseStmt = db.prepare(`
    SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier
    FROM imports i
    JOIN files f ON f.id = i.file_id
    JOIN projects p ON p.id = f.project_id
    WHERE i.resolved_file_id = ?
    ORDER BY f.path ASC, p.name ASC, i.specifier ASC`);
  const byId = new Map();
  const paths = [];
  const edges = [];
  const edgeSeen = new Set();
  const queue = [{ id: root.id, path: root.path, depth: 0 }];
  byId.set(root.id, root.path);
  let cursor = 0;
  while (cursor < queue.length) {
    const node = queue[cursor++];
    if (node.depth >= depth) continue;
    const rows = reverseStmt.all(node.id);
    for (const row of rows) {
      const childId = Number(row.id);
      if (!byId.has(childId)) {
        byId.set(childId, row.path);
        paths.push(row.path);
        queue.push({ id: childId, path: row.path, depth: node.depth + 1 });
      }
      const edgeKey = `${row.path}\0${node.path}\0${row.specifier}`;
      if (edgeSeen.has(edgeKey)) continue;
      edgeSeen.add(edgeKey);
      edges.push({ from: row.path, to: node.path, specifier: row.specifier });
    }
  }
  return { root: { path: root.path, project: root.project }, paths, edges };
}

// changeIndependence — given proposed file edits, report which pairs are
// independent. Two edits CONFLICT when either file transitively imports the
// other (an edit to a dependency can change what the dependent sees); they are
// INDEPENDENT when neither reaches the other in either direction.
// Ground truth for "which changes can be implemented independently in parallel" (HQ-077).
export function changeIndependence(db, options = {}) {
  const edits = Array.isArray(options.edits) ? options.edits.map(String) : [];
  const project = options.project ?? null;
  const reach = new Map();
  for (const edit of edits) {
    const root = resolveRoot(db, edit, project);
    if (!root) {
      reach.set(edit, { down: new Set([edit]), up: new Set([edit]) });
      continue;
    }
    const down = new Set([...reachable(db, { target: edit, project, depth: 50 }).paths, root.path]);
    const up = new Set([...dependents(db, { target: edit, project, depth: 50 }).paths, root.path]);
    reach.set(edit, { down, up });
  }
  const independent = [];
  const conflicting = [];
  for (let i = 0; i < edits.length; i++) {
    for (let j = i + 1; j < edits.length; j++) {
      const a = edits[i];
      const b = edits[j];
      const ra = reach.get(a) || { down: new Set(), up: new Set() };
      const rb = reach.get(b) || { down: new Set(), up: new Set() };
      // a depends on b (b is upstream of a), or b depends on a.
      const aReachesB = ra.down.has(b) || ra.up.has(b);
      const bReachesA = rb.down.has(a) || rb.up.has(a);
      if (aReachesB || bReachesA) conflicting.push([a, b]);
      else independent.push([a, b]);
    }
  }
  return { edits, independent, conflicting };
}

// integrationRanking — candidate integration points ranked by downstream
// fan-out: how many files transitively IMPORT the candidate, i.e. how much
// downstream work the integration unblocks. Ground truth for "which integration
// should happen first to unblock the most downstream work" (HQ-078).
export function integrationRanking(db, options = {}) {
  const candidates = Array.isArray(options.candidates) ? options.candidates.map(String) : [];
  const project = options.project ?? null;
  const ranked = [];
  for (const candidate of candidates) {
    const root = resolveRoot(db, candidate, project);
    if (!root) continue;
    const down = dependents(db, { target: candidate, project, depth: 50 });
    ranked.push({
      path: candidate,
      project: root.project,
      downstreamFanOut: down.paths.length,
      downstream: down.paths,
    });
  }
  ranked.sort((a, b) => b.downstreamFanOut - a.downstreamFanOut || a.path.localeCompare(b.path));
  return { candidates, ranked };
}

// sharedAssumptions — assumption strings documented (as annotations) in common
// by two components. Ground truth for "shared assumptions across components in a failure" (HQ-062).
export function sharedAssumptions(db, options = {}) {
  const a = resolveRoot(db, options.componentA, options.project ?? null);
  const b = resolveRoot(db, options.componentB, options.project ?? null);
  if (!a || !b) return { componentA: options.componentA, componentB: options.componentB, shared: [] };
  const annByFile = (fileId) => {
    const rows = db.prepare(
      `SELECT text FROM annotations WHERE file_id = ? ORDER BY line ASC`,
    ).all(fileId);
    return new Set(rows.map((r) => String(r.text)));
  };
  const setA = annByFile(a.id);
  const setB = annByFile(b.id);
  const shared = [...setA].filter((t) => setB.has(t)).sort();
  return { componentA: a.path, componentB: b.path, shared };
}
