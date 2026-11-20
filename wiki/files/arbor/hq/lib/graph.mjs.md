# File: hq/lib/graph.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/graph.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 35202 B |
| Lines | 854 |
| Hash | 4f0e2fbc45c3 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| toCount | function | 8 | no | function toCount(value, fallback, min = 0) { |
| n | const | 9 | no | const n = Number(value); |
| escapeLike | function | 14 | no | function escapeLike(value) { |
| normalizeTarget | function | 18 | no | function normalizeTarget(target) { |
| resolveRoot | function | 27 | no | function resolveRoot(db, target, project) { |
| wanted | const | 28 | no | const wanted = normalizeTarget(target); |
| projectClause | const | 31 | no | const projectClause = project ? &#39; AND lower(p.name) = lower(?)&#39; : &#39;&#39;; |
| projectParams | const | 32 | no | const projectParams = project ? [project] : []; |
| head | const | 33 | no | const head = &#39;SELECT f.id AS id, f.path AS path, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE &#39;; |
| tail | const | 34 | no | const tail = &#39; ORDER BY p.name ASC, f.path ASC LIMIT 20&#39;; |
| lower | const | 35 | no | const lower = wanted.toLowerCase(); |
| basename | const | 36 | no | const basename = lower.split(&#39;/&#39;).pop(); |
| stages | const | 38 | no | const stages = [ |
| rows | const | 50 | no | const rows = db.prepare(head + stage.sql + tail).all(...stage.params); |
| deps | function | 57 | yes | export function deps(db, options = {}) { |
| reverse | const | 58 | no | const reverse = options.reverse === true; |
| direction | const | 59 | no | const direction = reverse ? &#39;reverse&#39; : &#39;forward&#39;; |
| depth | const | 60 | no | const depth = toCount(options.depth, 2, 0); |
| limit | const | 61 | no | const limit = toCount(options.limit, 200, 1); |
| empty | const | 62 | no | const empty = { root: null, direction, nodes: [], edges: [] }; |
| root | const | 64 | no | const root = resolveRoot(db, options.target, options.project ?? null); |
| forwardStmt | const | 67 | no | const forwardStmt = db.prepare(` SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier FROM imports i JOIN files f ON f.id = i.resolved_file_id JOIN projects p ON p.id = f.pr… |
| reverseStmt | const | 74 | no | const reverseStmt = db.prepare(` SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier FROM imports i JOIN files f ON f.id = i.file_id JOIN projects p ON p.id = f.project_id |
| stmt | const | 81 | no | const stmt = reverse ? reverseStmt : forwardStmt; |
| byId | const | 83 | no | const byId = new Map(); |
| nodes | const | 84 | no | const nodes = []; |
| rootNode | const | 85 | no | const rootNode = { id: root.id, path: root.path, project: root.project, depth: 0, via: null }; |
| edges | const | 89 | no | const edges = []; |
| edgeSeen | const | 90 | no | const edgeSeen = new Set(); |
| queue | const | 91 | no | const queue = [rootNode]; |
| cursor | variable | 92 | no | let cursor = 0; |
| node | const | 95 | no | const node = queue[cursor++]; |
| rows | const | 99 | no | const rows = stmt.all(node.id); |
| childId | const | 101 | no | const childId = Number(row.id); |
| child | variable | 102 | no | let child = byId.get(childId); |
| fromId | const | 111 | no | const fromId = reverse ? childId : node.id; |
| toId | const | 112 | no | const toId = reverse ? node.id : childId; |
| edgeKey | const | 113 | no | const edgeKey = `${fromId}\\0${toId}\\0${row.specifier}`; |
| impact | function | 143 | yes | export function impact(db, options = {}) { |
| projectGraph | function | 152 | yes | export function projectGraph(db) { |
| projects | const | 153 | no | const projects = db.prepare(&#39;SELECT id, name FROM projects ORDER BY name ASC&#39;).all(); |
| fileCounts | const | 154 | no | const fileCounts = new Map( db.prepare(&#39;SELECT project_id, COUNT(*) AS c FROM files GROUP BY project_id&#39;).all() .map((row) =&gt; [Number(row.project_id), Number(row.c)]), ); |
| symbolCounts | const | 158 | no | const symbolCounts = new Map( db.prepare(&#39;SELECT project_id, COUNT(*) AS c FROM symbols GROUP BY project_id&#39;).all() .map((row) =&gt; [Number(row.project_id), Number(row.c)]), ); |
| edgeRows | const | 163 | no | const edgeRows = db.prepare(` SELECT p1.name AS src, p2.name AS dst, COUNT(*) AS c FROM imports i JOIN projects p1 ON p1.id = i.project_id LEFT JOIN files rf ON rf.id = i.resolved_file_id |
| incoming | const | 173 | no | const incoming = new Map(); |
| outgoing | const | 174 | no | const outgoing = new Map(); |
| edges | const | 175 | no | const edges = edgeRows.map((row) =&gt; { const count = Number(row.c); outgoing.set(row.src, (outgoing.get(row.src) ?? 0) + count); incoming.set(row.dst, (incoming.get(row.dst) ?? 0) + count); return { f… |
| count | const | 176 | no | const count = Number(row.c); |
| nodes | const | 182 | no | const nodes = projects.map((project) =&gt; ({ project: project.name, files: fileCounts.get(Number(project.id)) ?? 0, symbols: symbolCounts.get(Number(project.id)) ?? 0, incoming: incoming.get(project.na… |
| DEFAULT_ORPHAN_LIMIT | const | 211 | no | const DEFAULT_ORPHAN_LIMIT = 500; |
| STATIC_EDGE_KINDS | const | 218 | no | const STATIC_EDGE_KINDS = &quot;(&#39;import&#39;,&#39;export_from&#39;,&#39;use&#39;,&#39;require&#39;,&#39;include&#39;)&quot;; |
| staticOrphans | function | 238 | yes | export function staticOrphans(db, options = {}) { |
| project | const | 239 | no | const project = options.project ?? null; |
| limit | const | 240 | no | const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1); |
| includeTests | const | 241 | no | const includeTests = options.includeTests !== false; |
| projectClause | const | 242 | no | const projectClause = project ? &#39; AND p.name = ?&#39; : &#39;&#39;; |
| params | const | 243 | no | const params = project ? [project] : []; |
| testClause | const | 244 | no | const testClause = includeTests ? &#39;&#39; : &#39; AND f.is_test = 0&#39;; |
| rows | const | 245 | no | const rows = db.prepare(` SELECT f.path AS path, p.name AS project, COUNT(*) AS exports, f.is_test AS is_test FROM files f JOIN projects p ON p.id = f.project_id JOIN symbols s ON s.file_id = f.id AN… |
| dynamicLoads | function | 274 | yes | export function dynamicLoads(db, options = {}) { |
| project | const | 275 | no | const project = options.project ?? null; |
| limit | const | 276 | no | const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1); |
| projectClause | const | 277 | no | const projectClause = project ? &#39; AND sp.name = ?&#39; : &#39;&#39;; |
| params | const | 278 | no | const params = project ? [project] : []; |
| rows | const | 279 | no | const rows = db.prepare(` SELECT sf.path AS from_path, sp.name AS from_project, tf.path AS to_path, tp.name AS to_project, i.specifier AS specifier, i.line AS line FROM imports i |
| orphanStatus | function | 310 | yes | export function orphanStatus(db, options = {}) { |
| project | const | 311 | no | const project = options.project ?? null; |
| orphans | const | 312 | no | const orphans = staticOrphans(db, options); |
| loads | const | 313 | no | const loads = dynamicLoads(db, { ...options, limit: toCount(options.loadLimit, 5000, 1) }); |
| loadedPaths | const | 314 | no | const loadedPaths = new Set(loads.map((l) =&gt; `${l.toProject}\\u0000${l.to}`)); |
| dynamicallyLoaded | const | 315 | no | const dynamicallyLoaded = []; |
| unreferenced | const | 316 | no | const unreferenced = []; |
| key | const | 318 | no | const key = `${orphan.project}\\u0000${orphan.path}`; |
| reachableRoutes | function | 346 | yes | export function reachableRoutes(db, options = {}) { |
| project | const | 347 | no | const project = options.project ?? null; |
| depth | const | 348 | no | const depth = toCount(options.depth, 6, 0); |
| limit | const | 349 | no | const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1); |
| projectClause | const | 350 | no | const projectClause = project ? &#39; AND p.name = ?&#39; : &#39;&#39;; |
| params | const | 351 | no | const params = project ? [project] : []; |
| routeRows | const | 353 | no | const routeRows = db.prepare(` SELECT f.id AS file_id, f.path AS path, p.name AS project, f.is_test AS is_test, s.name AS route, s.signature AS signature, s.line AS line FROM symbols s JOIN files f O… |
| rootRows | const | 366 | no | const rootRows = db.prepare(` SELECT f.id AS id, f.path AS path, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.is_test = 0 |
| reachableIds | const | 377 | no | const reachableIds = forwardClosure(db, rootRows, { depth, limit: 5000 }); |
| forwardClosure | function | 394 | no | function forwardClosure(db, roots, { depth, limit }) { |
| seen | const | 395 | no | const seen = new Set(); |
| queue | const | 396 | no | const queue = []; |
| id | const | 398 | no | const id = Number(root.id); |
| stmt | const | 403 | no | const stmt = db.prepare(` SELECT i.resolved_file_id AS id FROM imports i WHERE i.file_id = ? AND i.resolved_file_id IS NOT NULL`); |
| cursor | variable | 407 | no | let cursor = 0; |
| node | const | 409 | no | const node = queue[cursor++]; |
| id | const | 412 | no | const id = Number(row.id); |
| agentToolCoupling | function | 436 | yes | export function agentToolCoupling(db, options = {}) { |
| project | const | 437 | no | const project = options.project ?? null; |
| limit | const | 438 | no | const limit = toCount(options.limit, DEFAULT_ORPHAN_LIMIT, 1); |
| includeTests | const | 439 | no | const includeTests = options.includeTests !== false; |
| projectClause | const | 440 | no | const projectClause = project ? &#39; AND sp.name = ?&#39; : &#39;&#39;; |
| params | const | 441 | no | const params = project ? [project] : []; |
| agentTool | const | 445 | no | const agentTool = AGENT_TOOL_SQL; |
| rows | const | 446 | no | const rows = db.prepare(` SELECT sf.path AS from_path, sp.name AS from_project, sf.is_test AS from_test, tf.path AS to_path, tp.name AS to_project, tf.is_test AS to_test, i.specifier AS specifier, i.… |
| AGENT_TOOL_DIRS | const | 474 | no | const AGENT_TOOL_DIRS = [&#39;.opencode/&#39;, &#39;.zcode/&#39;, &#39;plugins/&#39;, &#39;agents/&#39;]; |
| AGENT_TOOL_SQL | function | 483 | no | const AGENT_TOOL_SQL = (col) =&gt; |
| classifyRole | function | 499 | yes | export function classifyRole(path) { |
| p | const | 500 | no | const p = toPosix(String(path ?? &#39;&#39;)); |
| unresolvedImports | function | 515 | yes | export function unresolvedImports(db, options = {}) { |
| root | const | 516 | no | const root = resolveRoot(db, options.target, options.project ?? null); |
| rows | const | 518 | no | const rows = db.prepare(` SELECT i.specifier AS specifier, i.line AS line, f.path AS file_path FROM imports i JOIN files f ON f.id = i.file_id WHERE i.file_id = ? AND i.resolved_file_id IS NULL |
| orphans | function | 544 | yes | export function orphans(db, options = {}) { |
| projectClause | const | 545 | no | const projectClause = options.project ? &#39; AND lower(p.name) = lower(?)&#39; : &#39;&#39;; |
| params | const | 546 | no | const params = options.project ? [options.project] : []; |
| rows | const | 547 | no | const rows = db.prepare(` SELECT s.name AS name, s.kind AS kind, s.line AS line, f.path AS path, p.name AS project FROM symbols s JOIN files f ON f.id = s.file_id |
| reachable | function | 573 | yes | export function reachable(db, options = {}) { |
| root | const | 574 | no | const root = resolveRoot(db, options.target, options.project ?? null); |
| depth | const | 576 | no | const depth = toCount(options.depth, 50, 0); |
| forwardStmt | const | 577 | no | const forwardStmt = db.prepare(` SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier FROM imports i JOIN files f ON f.id = i.resolved_file_id JOIN projects p ON p.id = f.pr… |
| byId | const | 584 | no | const byId = new Map(); |
| paths | const | 585 | no | const paths = []; |
| edges | const | 586 | no | const edges = []; |
| edgeSeen | const | 587 | no | const edgeSeen = new Set(); |
| queue | const | 588 | no | const queue = [{ id: root.id, path: root.path, depth: 0 }]; |
| cursor | variable | 590 | no | let cursor = 0; |
| node | const | 592 | no | const node = queue[cursor++]; |
| rows | const | 594 | no | const rows = forwardStmt.all(node.id); |
| childId | const | 596 | no | const childId = Number(row.id); |
| childPath | const | 597 | no | const childPath = row.path; |
| edgeKey | const | 603 | no | const edgeKey = `${node.path}\\0${childPath}\\0${row.specifier}`; |
| minimalConnection | function | 616 | yes | export function minimalConnection(db, options = {}) { |
| orphan | const | 617 | no | const orphan = resolveRoot(db, options.orphan, options.project ?? null); |
| consumer | const | 618 | no | const consumer = resolveRoot(db, options.consumer, options.project ?? null); |
| forward | const | 622 | no | const forward = reachable(db, { target: options.consumer, project: options.project, depth: 50 }); |
| already | const | 623 | no | const already = forward.paths.includes(orphan.path); |
| edges | const | 624 | no | const edges = already ? [] : [{ from: consumer.path, to: orphan.path }]; |
| dependencyAffectedSystems | function | 631 | yes | export function dependencyAffectedSystems(db, options = {}) { |
| pkg | const | 632 | no | const pkg = String(options.package ?? &#39;&#39;).trim(); |
| projectClause | const | 634 | no | const projectClause = &#39; AND lower(p.name) = lower(?)&#39;; |
| providerRow | const | 635 | no | const providerRow = db.prepare(` SELECT id, name FROM projects WHERE lower(name) = lower(?) LIMIT 1 `).get(pkg); |
| providerId | const | 643 | no | const providerId = Number(providerRow.id); |
| providerFiles | const | 644 | no | const providerFiles = new Set( db.prepare(&#39;SELECT id FROM files WHERE project_id = ?&#39;).all(providerId).map((r) =&gt; Number(r.id)), ); |
| SQL_IN_CHUNK | const | 656 | no | const SQL_IN_CHUNK = 900; |
| importerRows | function | 657 | no | const importerRows = (ids) =&gt; { |
| ph | const | 658 | no | const ph = ids.map(() =&gt; &#39;?&#39;).join(&#39;,&#39;); |
| affectedProjects | const | 665 | no | const affectedProjects = new Set(); |
| frontier | const | 666 | no | const frontier = [...providerFiles]; |
| seen | const | 667 | no | const seen = new Set(providerFiles); |
| next | const | 669 | no | const next = []; |
| rows | const | 671 | no | const rows = importerRows(frontier.slice(i, i + SQL_IN_CHUNK)); |
| importerId | const | 673 | no | const importerId = Number(row.importer_id); |
| frow | const | 676 | no | const frow = db.prepare(&#39;SELECT project_id FROM files WHERE id = ?&#39;).get(importerId); |
| pid | const | 678 | no | const pid = Number(frow.project_id); |
| affected | const | 687 | no | const affected = []; |
| prow | const | 689 | no | const prow = db.prepare(&#39;SELECT name FROM projects WHERE id = ?&#39;).get(pid); |
| migrationRisks | function | 699 | yes | export function migrationRisks(db, options = {}) { |
| root | const | 700 | no | const root = resolveRoot(db, options.implementation, options.project ?? null); |
| implId | const | 702 | no | const implId = root.id; |
| risks | const | 703 | no | const risks = []; |
| annRows | const | 705 | no | const annRows = db.prepare(` SELECT a.kind AS kind, a.text AS text, a.line AS line, f.path AS path FROM annotations a JOIN files f ON f.id = a.file_id WHERE a.file_id = ? ORDER BY a.line ASC |
| testRows | const | 720 | no | const testRows = db.prepare(` SELECT DISTINCT f.path AS path, i.specifier AS specifier FROM imports i JOIN files f ON f.id = i.file_id WHERE i.resolved_file_id = ? AND f.is_test = 1 |
| dependents | function | 740 | yes | export function dependents(db, options = {}) { |
| root | const | 741 | no | const root = resolveRoot(db, options.target, options.project ?? null); |
| depth | const | 743 | no | const depth = toCount(options.depth, 50, 0); |
| reverseStmt | const | 744 | no | const reverseStmt = db.prepare(` SELECT f.id AS id, f.path AS path, p.name AS project, i.specifier AS specifier FROM imports i JOIN files f ON f.id = i.file_id JOIN projects p ON p.id = f.project_id |
| byId | const | 751 | no | const byId = new Map(); |
| paths | const | 752 | no | const paths = []; |
| edges | const | 753 | no | const edges = []; |
| edgeSeen | const | 754 | no | const edgeSeen = new Set(); |
| queue | const | 755 | no | const queue = [{ id: root.id, path: root.path, depth: 0 }]; |
| cursor | variable | 757 | no | let cursor = 0; |
| node | const | 759 | no | const node = queue[cursor++]; |
| rows | const | 761 | no | const rows = reverseStmt.all(node.id); |
| childId | const | 763 | no | const childId = Number(row.id); |
| edgeKey | const | 769 | no | const edgeKey = `${row.path}\\0${node.path}\\0${row.specifier}`; |
| changeIndependence | function | 783 | yes | export function changeIndependence(db, options = {}) { |
| edits | const | 784 | no | const edits = Array.isArray(options.edits) ? options.edits.map(String) : []; |
| project | const | 785 | no | const project = options.project ?? null; |
| reach | const | 786 | no | const reach = new Map(); |
| root | const | 788 | no | const root = resolveRoot(db, edit, project); |
| down | const | 793 | no | const down = new Set([...reachable(db, { target: edit, project, depth: 50 }).paths, root.path]); |
| up | const | 794 | no | const up = new Set([...dependents(db, { target: edit, project, depth: 50 }).paths, root.path]); |
| independent | const | 797 | no | const independent = []; |
| conflicting | const | 798 | no | const conflicting = []; |
| a | const | 801 | no | const a = edits[i]; |
| b | const | 802 | no | const b = edits[j]; |
| ra | const | 803 | no | const ra = reach.get(a) \|\| { down: new Set(), up: new Set() }; |
| rb | const | 804 | no | const rb = reach.get(b) \|\| { down: new Set(), up: new Set() }; |
| aReachesB | const | 806 | no | const aReachesB = ra.down.has(b) \|\| ra.up.has(b); |
| bReachesA | const | 807 | no | const bReachesA = rb.down.has(a) \|\| rb.up.has(a); |
| integrationRanking | function | 819 | yes | export function integrationRanking(db, options = {}) { |
| candidates | const | 820 | no | const candidates = Array.isArray(options.candidates) ? options.candidates.map(String) : []; |
| project | const | 821 | no | const project = options.project ?? null; |
| ranked | const | 822 | no | const ranked = []; |
| root | const | 824 | no | const root = resolveRoot(db, candidate, project); |
| down | const | 826 | no | const down = dependents(db, { target: candidate, project, depth: 50 }); |
| sharedAssumptions | function | 840 | yes | export function sharedAssumptions(db, options = {}) { |
| a | const | 841 | no | const a = resolveRoot(db, options.componentA, options.project ?? null); |
| b | const | 842 | no | const b = resolveRoot(db, options.componentB, options.project ?? null); |
| annByFile | function | 844 | no | const annByFile = (fileId) =&gt; { |
| rows | const | 845 | no | const rows = db.prepare( `SELECT text FROM annotations WHERE file_id = ? ORDER BY line ASC`, ).all(fileId); |
| setA | const | 850 | no | const setA = annByFile(a.id); |
| setB | const | 851 | no | const setB = annByFile(b.id); |
| shared | const | 852 | no | const shared = [...setA].filter((t) =&gt; setB.has(t)).sort(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 6 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-005-repository-dependencies.mjs](../aii/fixtures/HQ-005-repository-dependencies.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-014-service-consumers.mjs](../aii/fixtures/HQ-014-service-consumers.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-015-module-dependencies.mjs](../aii/fixtures/HQ-015-module-dependencies.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-019-boundary-crossings.mjs](../aii/fixtures/HQ-019-boundary-crossings.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-022-reachable-by-users.mjs](../aii/fixtures/HQ-022-reachable-by-users.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-023-no-runtime-consumers.mjs](../aii/fixtures/HQ-023-no-runtime-consumers.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-029-dynamically-loaded.mjs](../aii/fixtures/HQ-029-dynamically-loaded.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-062-shared-assumptions.mjs](../aii/fixtures/HQ-062-shared-assumptions.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-063-missing-dependency.mjs](../aii/fixtures/HQ-063-missing-dependency.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-069-agent-tool-coupling.mjs](../aii/fixtures/HQ-069-agent-tool-coupling.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-072-module-migration-consumers.mjs](../aii/fixtures/HQ-072-module-migration-consumers.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-074-minimal-orphan-connection.mjs](../aii/fixtures/HQ-074-minimal-orphan-connection.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-075-dependency-upgrade-impact.mjs](../aii/fixtures/HQ-075-dependency-upgrade-impact.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-076-migration-risks.mjs](../aii/fixtures/HQ-076-migration-risks.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-077-change-independence.mjs](../aii/fixtures/HQ-077-change-independence.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-078-integration-sequencing.mjs](../aii/fixtures/HQ-078-integration-sequencing.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs](../aii/fixtures/HQ-102-core-vs-peripheral.mjs.md) | ../../lib/graph.mjs |
| [hq/aii/fixtures/HQ-104-high-impact-code.mjs](../aii/fixtures/HQ-104-high-impact-code.mjs.md) | ../../lib/graph.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/graph.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/graph.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/graph.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/graph.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./graph.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./graph.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./graph.mjs |
| [hq/test/graph.test.mjs](../test/graph.test.mjs.md) | ../lib/graph.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 855 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
