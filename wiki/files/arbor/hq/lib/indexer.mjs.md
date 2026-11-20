# File: hq/lib/indexer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/indexer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 40369 B |
| Lines | 972 |
| Hash | 60ea6ca2981b |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| supportsV2 | function | 24 | no | const supportsV2 = entry =&gt; /\\.(?:mjs\|cjs\|js\|mts\|cts\|ts)$/i.test(entry.rel) |
| DEFAULT_OPTIONS | const | 27 | no | const DEFAULT_OPTIONS = { |
| IMPORT_EXTENSIONS | const | 35 | no | const IMPORT_EXTENSIONS = [ |
| normalizeOptions | function | 40 | no | function normalizeOptions(options = {}) { |
| projectAbsPath | function | 48 | no | function projectAbsPath(root, project) { |
| raw | const | 49 | no | const raw = project?.abs \|\| project?.path \|\| project?.dir \|\| &#39;&#39;; |
| p | const | 50 | no | const p = String(raw); |
| errorMessage | function | 55 | no | function errorMessage(error) { |
| isWalkOmitted | function | 67 | no | function isWalkOmitted(row, maxFileBytes, projectRoot) { |
| cap | const | 68 | no | const cap = Number(maxFileBytes); |
| stored | const | 70 | no | const stored = typeof row?.abs_path === &#39;string&#39; ? row.abs_path : &#39;&#39;; |
| abs | const | 71 | no | const abs = stored \|\| (typeof row?.path === &#39;string&#39; ? resolve(projectRoot, row.path) : &#39;&#39;); |
| countLines | function | 82 | no | function countLines(text) { |
| n | variable | 84 | no | let n = 1; |
| readGitInfo | function | 90 | no | function readGitInfo(absPath, useGit) { |
| info | const | 91 | no | const info = { kind: &#39;dir&#39;, remote: null, branch: null, head: null }; |
| isGit | variable | 93 | no | let isGit = false; |
| upsertProject | function | 103 | no | function upsertProject(db, { name, path, git }) { |
| now | const | 104 | no | const now = nowISO(); |
| selectByName | const | 105 | no | const selectByName = db.prepare(&#39;SELECT * FROM projects WHERE name = ?&#39;); |
| selectById | const | 106 | no | const selectById = db.prepare(&#39;SELECT * FROM projects WHERE id = ?&#39;); |
| selectByPath | const | 107 | no | const selectByPath = db.prepare(&#39;SELECT * FROM projects WHERE path = ?&#39;); |
| row | variable | 108 | no | let row = selectByName.get(name); |
| info | const | 116 | no | const info = db.prepare( &#39;INSERT INTO projects(name, path, kind, remote, branch, head, added_at) VALUES (?,?,?,?,?,?,?)&#39;, ).run(name, path, git.kind, git.remote, git.branch, git.head, now); |
| prepareStatements | function | 122 | no | function prepareStatements(db) { |
| normalizeFileIndex | function | 171 | no | function normalizeFileIndex(fileIndex) { |
| out | const | 172 | no | const out = new Map(); |
| isRelativeSpecifier | function | 188 | no | function isRelativeSpecifier(spec) { |
| resolveRelativeTarget | function | 196 | no | function resolveRelativeTarget(importerPath, spec) { |
| dir | const | 197 | no | const dir = posix.dirname(toPosix(importerPath) \|\| &#39;&#39;); |
| dots | const | 199 | no | const dots = /^\\.+/.exec(spec)[0].length; |
| rest | const | 200 | no | const rest = spec.slice(dots); |
| up | const | 201 | no | const up = &#39;../&#39;.repeat(Math.max(0, dots - 1)); |
| candidatePaths | function | 207 | no | function candidatePaths(target) { |
| out | const | 209 | no | const out = [target]; |
| jsExt | const | 213 | no | const jsExt = /\\.(mjs\|cjs\|jsx\|js)$/.exec(target); |
| base | const | 215 | no | const base = target.slice(0, -jsExt[0].length); |
| bareCandidates | function | 222 | no | function bareCandidates(spec, importerPath = &#39;&#39;) { |
| clean | const | 223 | no | const clean = String(spec).replace(/^node:/, &#39;&#39;).replace(/[/\\\\]+$/, &#39;&#39;); |
| out | const | 224 | no | const out = []; |
| segs | const | 226 | no | const segs = clean.split(&#39;/&#39;).filter(Boolean); |
| buildProjectNameIndex | function | 241 | no | function buildProjectNameIndex(db) { |
| map | const | 242 | no | const map = new Map(); |
| rows | variable | 243 | no | let rows = []; |
| key | const | 246 | no | const key = String(row.name \|\| &#39;&#39;).toLowerCase(); |
| pkgPath | const | 251 | no | const pkgPath = join(row.path, &#39;package.json&#39;); |
| pkg | const | 252 | no | const pkg = JSON.parse(readFileSync(pkgPath, &#39;utf8&#39;)); |
| key | const | 253 | no | const key = String(pkg?.name \|\| &#39;&#39;).toLowerCase(); |
| resolveImport | function | 264 | yes | export function resolveImport({ db, projectId = null, file = null, specifier = &#39;&#39;, fileIndex = null, projectNames = null } = {}) { |
| miss | const | 265 | no | const miss = { file_id: null, project_id: null, kind: &#39;external&#39; }; |
| spec | const | 266 | no | const spec = String(specifier ?? &#39;&#39;).trim(); |
| importerPath | const | 268 | no | const importerPath = typeof file === &#39;string&#39; ? file : (file?.path ? String(file.path) : &#39;&#39;); |
| index | const | 269 | no | const index = normalizeFileIndex(fileIndex); |
| target | const | 272 | no | const target = resolveRelativeTarget(importerPath, spec); |
| id | const | 276 | no | const id = index.get(candidate); |
| names | variable | 284 | no | let names = projectNames; |
| id | const | 289 | no | const id = names.get(candidate.toLowerCase()); |
| indexProject | function | 308 | yes | export function indexProject({ root, db, project, options = {} }) { |
| started | const | 309 | no | const started = Date.now(); |
| opts | const | 310 | no | const opts = normalizeOptions(options); |
| name | const | 311 | no | const name = String(project?.name \|\| project?.id \|\| &#39;&#39;); |
| absPath | const | 312 | no | const absPath = projectAbsPath(root, project); |
| errors | const | 313 | no | const errors = []; |
| result | const | 314 | no | const result = { |
| readFile | const | 337 | no | const readFile = typeof opts.readFile === &#39;function&#39; ? opts.readFile : readFileSync; |
| extract | const | 338 | no | const extract = { |
| git | const | 344 | no | const git = readGitInfo(absPath, opts.useGit); |
| entries | const | 345 | no | const entries = discoverFiles(absPath, { maxFileBytes: opts.maxFileBytes, extraIgnores: opts.ignores, ignores: opts.ignores, useGit: opts.useGit, |
| finalRow | const | 353 | no | const finalRow = transaction(db, () =&gt; { // Snapshot before upsertProject overwrites head/branch: a no-op reindex // (watcher catch-up on an already-current tree, hook after a commit that // changed … |
| priorRow | const | 360 | no | const priorRow = db |
| projectRow | const | 363 | no | const projectRow = upsertProject(db, { name, path: absPath, git }); |
| stmts | const | 364 | no | const stmts = prepareStatements(db); |
| v2Key | const | 366 | no | const v2Key = &#39;annotation_v2:&#39; + projectRow.id + &#39;:&#39; + absPath; |
| backfillV2 | const | 367 | no | const backfillV2 = getMeta(db, v2Key) !== &#39;2&#39;; |
| existing | const | 369 | no | const existing = new Map(); |
| seen | const | 372 | no | const seen = new Set(); |
| anchors | function | 373 | no | const anchors=row=&gt;row&amp;&amp;row.kind===&#39;source&#39;&amp;&amp;!row.is_generated |
| changes | function | 375 | no | const changes=(path,before,after)=&gt;result.semanticChanges.push(...semanticAnchorChanges(before,after) .map(change=&gt;({path,...change}))); |
| prev | const | 380 | no | const prev = existing.get(entry.rel) \|\| null; |
| refreshV2 | const | 382 | no | const refreshV2 = backfillV2 &amp;&amp; supportsV2(entry); |
| data | variable | 388 | no | let data; |
| buffer | const | 395 | no | const buffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data), &#39;utf8&#39;); |
| hash | const | 396 | no | const hash = sha256(buffer); |
| text | const | 404 | no | const text = buffer.toString(&#39;utf8&#39;); |
| lang | const | 405 | no | const lang = entry.lang; |
| kind | const | 406 | no | const kind = entry.kind; |
| source | const | 407 | no | const source = isSourceLang(lang); |
| symbols | variable | 409 | no | let symbols = []; |
| imports | variable | 410 | no | let imports = []; |
| annotations | variable | 411 | no | let annotations = []; |
| parsed | const | 418 | no | const parsed = parseAnnotationV2(text, { projectId: String(projectRow.id), path: entry.rel, contentHash: hash, registry: { lookup: id =&gt; getSemanticId(db, id) }, }); |
| lines | const | 437 | no | const lines = countLines(text); |
| indexedAt | const | 438 | no | const indexedAt = nowISO(); |
| fileId | variable | 439 | no | let fileId; |
| info | const | 448 | no | const info = stmts.insertFile.run( projectRow.id, entry.rel, entry.abs, lang, kind, entry.size, entry.mtimeMs, hash, lines, entry.isTest ? 1 : 0, entry.isGenerated ? 1 : 0, indexedAt, ); |
| beforeAnchors | const | 456 | no | const beforeAnchors=anchors(prev); |
| stale | const | 506 | no | const stale = [...existing.values()] |
| fileIndex | const | 524 | no | const fileIndex = new Map(); |
| projectNames | const | 526 | no | const projectNames = buildProjectNameIndex(db); |
| resolution | const | 528 | no | const resolution = resolveImport({ db, projectId: projectRow.id, file: { path: imp.file_path }, specifier: imp.specifier, |
| fileCount | const | 539 | no | const fileCount = Number(stmts.countFiles.get(projectRow.id)?.c \|\| 0); |
| symbolCount | const | 540 | no | const symbolCount = Number(stmts.countSymbols.get(projectRow.id)?.c \|\| 0); |
| indexChurned | const | 541 | no | const indexChurned = (result.added + result.changed + result.removed) &gt; 0 |
| indexWorkspace | function | 575 | yes | export function indexWorkspace({ root, db, projects = [], options = {} }) { |
| list | const | 576 | no | const list = Array.isArray(projects) ? projects : []; |
| rows | const | 577 | no | const rows = []; |
| errors | const | 578 | no | const errors = []; |
| totals | const | 579 | no | const totals = { files: 0, symbols: 0, imports: 0, annotations: 0, incomplete: 0, errors: 0 }; |
| name | const | 582 | no | const name = String(project?.name \|\| project?.id \|\| &#39;&#39;); |
| result | const | 584 | no | const result = indexProject({ root, db, project, options }); |
| incomplete | const | 590 | no | const incomplete = Array.isArray(result.incomplete) ? result.incomplete : []; |
| row | const | 605 | no | const row = db.prepare(&#39;SELECT id, file_count, symbol_count FROM projects WHERE name = ?&#39;).get(result.project?.name ?? name); |
| imports | const | 609 | no | const imports = db.prepare(&#39;SELECT count(*) AS c FROM imports WHERE project_id = ?&#39;).get(row.id); |
| annotations | const | 611 | no | const annotations = db.prepare(&#39;SELECT count(*) AS c FROM annotations WHERE project_id = ?&#39;).get(row.id); |
| importConsumers | function | 653 | yes | export function importConsumers(db, options = {}) { |
| target | const | 654 | no | const target = options.target ? String(options.target) : null; |
| project | const | 655 | no | const project = options.project ?? null; |
| limit | const | 656 | no | const limit = Number(options.limit ?? 500); |
| clauses | const | 657 | no | const clauses = []; |
| params | const | 658 | no | const params = []; |
| rows | const | 668 | no | const rows = db.prepare(` SELECT sf.path AS from_path, sp.name AS from_project, sf.is_test AS from_test, i.specifier AS specifier, i.kind AS kind, i.line AS line FROM imports i JOIN files sf ON sf.id… |
| executionEvidence | function | 701 | yes | export function executionEvidence(db, options = {}) { |
| project | const | 702 | no | const project = options.project ?? null; |
| limit | const | 703 | no | const limit = Number(options.limit ?? 500); |
| projectClause | const | 704 | no | const projectClause = project ? &#39; AND sp.name = ?&#39; : &#39;&#39;; |
| params | const | 705 | no | const params = project ? [project] : []; |
| rows | const | 706 | no | const rows = db.prepare(` SELECT tf.path AS to_path, tp.name AS to_project, sf.path AS from_path, sp.name AS from_project, sf.is_test AS from_test, i.specifier AS specifier, i.kind AS kind, i.line AS… |
| byTarget | const | 719 | no | const byTarget = new Map(); |
| key | const | 721 | no | const key = `${row.to_project}\\u0000${row.to_path}`; |
| entry | const | 732 | no | const entry = byTarget.get(key); |
| consumer | const | 733 | no | const consumer = { |
| testOnlyCapabilities | function | 756 | yes | export function testOnlyCapabilities(db, options = {}) { |
| project | const | 757 | no | const project = options.project ?? null; |
| limit | const | 758 | no | const limit = Number(options.limit ?? 500); |
| projectClause | const | 759 | no | const projectClause = project ? &#39; AND p.name = ?&#39; : &#39;&#39;; |
| params | const | 760 | no | const params = project ? [project] : []; |
| rows | const | 761 | no | const rows = db.prepare(` SELECT s.name AS name, s.kind AS kind, s.line AS line, f.path AS path, p.name AS project, (SELECT COUNT(*) FROM imports i JOIN files pf ON pf.id = i.file_id |
| PLAN_STOPWORDS | const | 808 | no | const PLAN_STOPWORDS = new Set([ &#39;the&#39;, &#39;a&#39;, &#39;an&#39;, &#39;and&#39;, &#39;or&#39;, &#39;to&#39;, &#39;of&#39;, &#39;for&#39;, &#39;in&#39;, &#39;on&#39;, &#39;with&#39;, &#39;via&#39;, &#39;from&#39;, &#39;by&#39;, &#39;at&#39;, &#39;is&#39;, &#39;are&#39;, &#39;be&#39;, &#39;so&#39;, &#39;that&#39;, &#39;this&#39;, &#39;it&#39;, &#39;as&#39;, &#39;up&#39;, &#39;out&#39;, &#39;no… |
| planTerms | function | 817 | yes | export function planTerms(title) { |
| symbolTokens | function | 826 | yes | export function symbolTokens(name) { |
| plannedFeatureStatus | function | 856 | yes | export function plannedFeatureStatus(db, options = {}) { |
| features | const | 857 | no | const features = Array.isArray(options.features) ? options.features : []; |
| limit | const | 858 | no | const limit = Number(options.limit ?? 200); |
| maxMatches | const | 859 | no | const maxMatches = Number(options.maxMatches ?? 20); |
| projectClause | const | 860 | no | const projectClause = options.project ? &#39; AND p.name = ?&#39; : &#39;&#39;; |
| projectParams | const | 861 | no | const projectParams = options.project ? [options.project] : []; |
| catalogueStmt | const | 863 | no | const catalogueStmt = db.prepare(` SELECT s.name AS name, s.kind AS kind, s.line AS line, f.path AS path, p.name AS project, f.id AS file_id FROM symbols s JOIN files f ON f.id = s.file_id |
| inverted | const | 873 | no | const inverted = new Map(); |
| rows | const | 874 | no | const rows = catalogueStmt.all(...projectParams); |
| list | variable | 877 | no | let list = inverted.get(token); |
| consumersStmt | const | 884 | no | const consumersStmt = db.prepare(` SELECT COUNT(*) AS c FROM imports i JOIN files pf ON pf.id = i.file_id WHERE i.resolved_file_id = ? AND i.file_id &lt;&gt; ? AND pf.is_test = 0`); |
| consumersCache | const | 889 | no | const consumersCache = new Map(); |
| title | const | 892 | no | const title = String(feature?.title ?? &#39;&#39;); |
| terms | const | 893 | no | const terms = Array.isArray(feature?.terms) &amp;&amp; feature.terms.length |
| hits | variable | 898 | no | let hits = null; |
| list | const | 900 | no | const list = inverted.get(term) \|\| []; |
| keep | const | 903 | no | const keep = new Set(list); |
| matches | const | 909 | no | const matches = hits.map((i) =&gt; { const row = rows[i]; let consumers = consumersCache.get(row.file_id); if (consumers === undefined) { consumers = Number(consumersStmt.get(row.file_id, row.file_id).c… |
| row | const | 910 | no | const row = rows[i]; |
| consumers | variable | 911 | no | let consumers = consumersCache.get(row.file_id); |
| reachable | const | 931 | no | const reachable = matches.some((m) =&gt; m.productionConsumers &gt; 0); |
| duplicatePlannedFeatures | function | 953 | yes | export function duplicatePlannedFeatures(db, options = {}) { |
| status | const | 954 | no | const status = plannedFeatureStatus(db, options); |
| out | const | 955 | no | const out = []; |
| equivalent | const | 958 | no | const equivalent = row.matches.find((m) =&gt; m.productionConsumers &gt; 0); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| ./util.mjs | import | 7 | [hq/lib/util.mjs](./util.mjs.md) |
| ./schema.mjs | import | 8 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./walk.mjs | import | 9 | [hq/lib/walk.mjs](./walk.mjs.md) |
| ./lang.mjs | import | 10 | [hq/lib/lang.mjs](./lang.mjs.md) |
| ./git.mjs | import | 11 | [hq/lib/git.mjs](./git.mjs.md) |
| ./extract.mjs | import | 17 | [hq/lib/extract.mjs](./extract.mjs.md) |
| ./annotation-v2.mjs | import | 18 | [hq/lib/annotation-v2.mjs](./annotation-v2.mjs.md) |
| ./semantic-registry.mjs | import | 19 | [hq/lib/semantic-registry.mjs](./semantic-registry.mjs.md) |
| ./search.mjs | import | 20 | [hq/lib/search.mjs](./search.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-021-planned-features-implemented.mjs](../aii/fixtures/HQ-021-planned-features-implemented.mjs.md) | ../../lib/indexer.mjs |
| [hq/aii/fixtures/HQ-025-imported-never-executed.mjs](../aii/fixtures/HQ-025-imported-never-executed.mjs.md) | ../../lib/indexer.mjs |
| [hq/aii/fixtures/HQ-026-fixtures-only.mjs](../aii/fixtures/HQ-026-fixtures-only.mjs.md) | ../../lib/indexer.mjs |
| [hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs](../aii/fixtures/HQ-087-unnecessary-planned-features.mjs.md) | ../../lib/indexer.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/indexer.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/indexer.mjs |
| [hq/bin/wave1-lane-a.mjs](../bin/wave1-lane-a.mjs.md) | ../lib/indexer.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./indexer.mjs |
| [hq/lib/automation.mjs](./automation.mjs.md) | ./indexer.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./indexer.mjs |
| [hq/test/indexer.test.mjs](../test/indexer.test.mjs.md) | ../lib/indexer.mjs |
| [hq/test/kg-import-product.test.mjs](../test/kg-import-product.test.mjs.md) | ../lib/indexer.mjs |
| [hq/test/revision-cache-lifecycle.test.mjs](../test/revision-cache-lifecycle.test.mjs.md) | ../lib/indexer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/indexer.mjs — incremental workspace indexer.
// CONTRACT (hq/CONTRACT.md): one transaction per project, rows replaced per
// file, FTS populated from file text, imports resolved after parsing.
// Writes only to the SQLite database it is given.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, posix, resolve } from 'node:path';
import { nowISO, sha256, toPosix } from './util.mjs';
import { transaction, getMeta, setMeta } from './schema.mjs';
import { discoverFiles } from './walk.mjs';
import { isSourceLang } from './lang.mjs';
import {
  isGitRepo as isGitRepoHere,
  head as gitHead,
  branch as gitBranch,
  remote as gitRemote,
} from './git.mjs';
import { extractSymbols, extractImports, extractAnnotations } from './extract.mjs';
import { parseAnnotationV2, isVersionedId } from './annotation-v2.mjs';
import { getSemanticId, indexedSemanticAnchors, semanticAnchorChanges } from './semantic-registry.mjs';
import { isSensitiveSourcePath } from './search.mjs';

// The existing v2 scanner is a JS-style lexer, not a universal language parser.
// Do not treat JSX markup, Python strings, Rust raw strings, etc. as JS comments.
const supportsV2 = entry => /\.(?:mjs|cjs|js|mts|cts|ts)$/i.test(entry.rel)
  && (entry.lang === 'javascript' || entry.lang === 'typescript');

const DEFAULT_OPTIONS = {
  force: false,
  maxFileBytes: 1_500_000,
  ignores: [],
  useGit: true,
};

// Resolution order for extensionless specifiers (contract order).
const IMPORT_EXTENSIONS = [
  '.mjs', '.js', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.java',
  '.kt', '.cs', '.rb', '.php', '.lua', '.sh', '.ps1',
];

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options && typeof options === 'object' ? options : {}),
    ignores: Array.isArray(options?.ignores) ? options.ignores : [],
  };
}

function projectAbsPath(root, project) {
  const raw = project?.abs || project?.path || project?.dir || '';
  const p = String(raw);
  if (isAbsolute(p)) return resolve(p);
  return resolve(root || process.cwd(), p);
}

function errorMessage(error) {
  return error && error.message ? String(error.message) : String(error);
}

// isWalkOmitted — did the bounded walk skip a file that is still on disk?
//
// discoverFiles (walk.mjs) drops every file over `maxFileBytes` without a trace,
// so "absent from the walk" is not proof that a path was deleted: it is equally
// consistent with a source that grew past the cap, or with a cap that was
// lowered since the last run. A tombstone is a claim that the source is gone,
// and only the filesystem can prove that. Callers use this to keep such rows
// instead of deleting them, and to report the run as an incomplete scan.
function isWalkOmitted(row, maxFileBytes, projectRoot) {
  const cap = Number(maxFileBytes);
  if (!Number.isFinite(cap) || cap <= 0) return false;
  const stored = typeof row?.abs_path === 'string' ? row.abs_path : '';
  const abs = stored || (typeof row?.path === 'string' ? resolve(projectRoot, row.path) : '');
  if (!abs) return false;
  try {
    if (!existsSync(abs)) return false;
    return statSync(abs).size > cap;
  } catch {
    return false;
  }
}
```

_First 80 of 973 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
