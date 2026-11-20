# File: hq/lib/arbor-service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/arbor-service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 33493 B |
| Lines | 581 |
| Hash | 2436e722fefe |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEV_INTELLIGENCE_CONTRACT | const | 19 | yes | export const DEV_INTELLIGENCE_CONTRACT = &#39;arbor.dev-intelligence/1&#39;; |
| DEVELOPMENT_DOMAIN | const | 20 | yes | export const DEVELOPMENT_DOMAIN = &#39;development&#39;; |
| DEV_SOURCE_EVIDENCE_CONTRACT | const | 21 | yes | export const DEV_SOURCE_EVIDENCE_CONTRACT = &#39;arbor.dev-source-evidence/1&#39;; |
| MAX_FILE_BYTES | const | 22 | no | const MAX_FILE_BYTES = 1_500_000; |
| MAX_CONTEXT_TOKENS | const | 23 | no | const MAX_CONTEXT_TOKENS = 10000; |
| MAX_WIKI_PAGES | const | 24 | no | const MAX_WIKI_PAGES = 5000; |
| SURFACE_SCHEMA | const | 25 | no | const SURFACE_SCHEMA = &#39;vivim.file-surface/1&#39;; |
| SURFACE_GENERATOR | const | 26 | no | const SURFACE_GENERATOR = &#39;hq.source-index/1&#39;; |
| surfacePath | function | 29 | no | function surfacePath(path) { |
| surfaceKinds | const | 35 | no | const surfaceKinds = [&#39;v2:type&#39;,&#39;v2:capability&#39;,&#39;v2:contract&#39;,&#39;v2:emits&#39;,&#39;v2:consumes&#39;,&#39;v2:action&#39;]; |
| defaultDevDataDir | function | 38 | yes | export function defaultDevDataDir() { |
| base | const | 39 | no | const base = process.platform === &#39;win32&#39; &amp;&amp; process.env.LOCALAPPDATA |
| canonicalDir | function | 43 | no | function canonicalDir(path) { |
| sameDir | function | 47 | no | function sameDir(a, b) { |
| left | const | 48 | no | const left = resolve(a), right = resolve(b); |
| ensureName | function | 51 | no | function ensureName(value) { |
| name | const | 52 | no | const name = String(value \|\| &#39;&#39;); |
| within | function | 64 | no | function within(file, root) { |
| normalize | function | 65 | no | const normalize = value =&gt; process.platform === &#39;win32&#39; |
| candidate | const | 67 | no | const candidate = normalize(file); |
| base | const | 68 | no | const base = normalize(root); |
| stableSourceId | function | 71 | no | function stableSourceId(path) { return &#39;dev-source:&#39; + sha256(process.platform === &#39;win32&#39; ? path.toLowerCase() : path); } |
| relativeSourcePath | function | 72 | no | function relativeSourcePath(path) { |
| storageFailure | function | 80 | no | function storageFailure(error) { |
| out | const | 82 | no | const out = new Error(&#39;HQ_STORAGE_FULL&#39;); |
| createDevIntelligence | function | 88 | yes | export function createDevIntelligence({ dataDir = defaultDevDataDir(), approvedRoots = [], mode, actorId = null, sessionId = null, authorize = null, } = {}) { |
| root | const | 101 | no | const root = canonicalDir(dataDir); |
| approved | const | 102 | no | const approved = Object.freeze(approvedRoots.map(canonicalDir)); |
| dbDir | const | 106 | no | const dbDir = join(root, &#39;.hq&#39;); |
| database | const | 107 | no | const database = join(dbDir, &#39;index.db&#39;); |
| wikiDir | const | 108 | no | const wikiDir = join(root, &#39;wiki&#39;); |
| safeStorage | function | 109 | no | function safeStorage() { |
| storedRoot | function | 118 | no | function storedRoot(entry) { |
| saved | const | 119 | no | const saved = isAbsolute(entry.path) ? entry.path : resolve(root, entry.path); |
| requireApproved | function | 122 | no | function requireApproved(path) { |
| candidate | const | 123 | no | const candidate = canonicalDir(path); |
| permit | function | 127 | no | function permit(operation, path) { |
| sourceRoot | const | 128 | no | const sourceRoot = requireApproved(path); |
| guardedProjects | function | 135 | no | function guardedProjects(operation = &#39;source.read&#39;) { |
| records | const | 136 | no | const records = loadProjects(root).projects; |
| authorizedFile | function | 143 | no | function authorizedFile(project, path, absPath, records) { |
| base | const | 146 | no | const base = permit(&#39;source.read&#39;, storedRoot(record)); |
| expected | const | 147 | no | const expected = resolve(base, relativeSourcePath(path)); |
| actual | const | 151 | no | const actual = canonicalDir(expected); |
| withDatabase | function | 155 | no | function withDatabase(fn, operation = &#39;source.read&#39;, checkFiles = false) { |
| registered | const | 156 | no | const registered = guardedProjects(operation); |
| db | variable | 158 | no | let db; |
| stored | const | 162 | no | const stored = db.prepare(&#39;SELECT name,path FROM projects&#39;).all(); |
| entry | const | 164 | no | const entry = registered.find(item =&gt; item.name === row.name); |
| registerSource | function | 178 | no | function registerSource({ name, path }) { |
| resolved | const | 179 | no | const resolved = permit(&#39;source.register&#39;, path); |
| existing | const | 182 | no | const existing = loadProjects(root).projects.find(row =&gt; row.name === name); |
| removeSource | function | 186 | no | function removeSource(name) { |
| identity | const | 187 | no | const identity = ensureName(name); |
| saved | const | 191 | no | const saved = isAbsolute(record.path) ? resolve(record.path) : resolve(root, record.path); |
| db | variable | 197 | no | let db; |
| row | const | 202 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name=?&#39;).get(identity); |
| files | const | 204 | no | const files = db.prepare(&#39;SELECT id FROM files WHERE project_id=?&#39;).all(row.id); |
| clearFts | const | 205 | no | const clearFts = db.prepare(&#39;DELETE FROM content_fts WHERE rowid=?&#39;); |
| capRows | const | 210 | no | const capRows = db.prepare(&#39;SELECT id,root FROM capability_source&#39;).all(); |
| index | function | 236 | no | function index({ force = false, useGit = true } = {}) { |
| search | function | 242 | no | function search({ query, project, limit = 20, offset = 0 } = {}) { |
| symbols | function | 245 | no | function symbols({ query, project, limit = 30 } = {}) { |
| files | function | 248 | no | function files({ query, project, limit = 50 } = {}) { |
| context | function | 251 | no | function context({ task, project, budgetTokens = 6000, maxFiles = 24, sourceSemanticIds = [] } = {}) { |
| verifyContext | function | 257 | no | function verifyContext(bundle) { |
| sources | const | 259 | no | const sources = Array.isArray(bundle?.sources) ? bundle.sources : []; |
| scoped | const | 260 | no | const scoped = sources.map(source =&gt; { if (!source?.project \|\| !source?.path) throw new Error(&#39;HQ_CONTEXT_SOURCE_REQUIRED&#39;); const path = relativeSourcePath(source.path); const file = db.prepare(&#39;SEL… |
| path | const | 262 | no | const path = relativeSourcePath(source.path); |
| file | const | 263 | no | const file = db.prepare(&#39;SELECT f.id,f.abs_path,f.hash FROM files f JOIN projects p ON p.id=f.project_id WHERE p.name=? AND f.path=?&#39;).get(source.project, path); |
| verifyIndexedDependencies | function | 272 | no | function verifyIndexedDependencies(db,bundle){ |
| proof | const | 273 | no | const proof=verifyHqContext(bundle); |
| changed | const | 274 | no | const changed=new Set(proof.changed); |
| row | const | 277 | no | const row=db.prepare(&#39;SELECT f.id,f.hash FROM files f JOIN projects p ON p.id=f.project_id WHERE p.name=? AND f.path=?&#39;).get(source.project,source.path); |
| anchors | const | 279 | no | const anchors=indexedSemanticAnchors(db,{fileId:row.id,project:source.project,path:source.path,hash:row.hash}); |
| anchor | const | 281 | no | const anchor=anchors.find(a=&gt;a.semanticId===reference.semanticId&amp;&amp;a.annotationKind===reference.annotationKind&amp;&amp;a.lines.includes(reference.line)); |
| graph | function | 291 | no | function graph({ kind = &#39;projects&#39;, project, target, depth = 3 } = {}) { |
| wiki | function | 299 | no | function wiki({ force = false, maxFilePages = MAX_WIKI_PAGES } = {}) { |
| indexWatermarks | function | 306 | no | function indexWatermarks() { |
| entry | const | 310 | no | const entry = records.find(item =&gt; item.name === row.name); |
| sourceRoot | const | 311 | no | const sourceRoot = storedRoot(entry); |
| currentRevision | const | 312 | no | const currentRevision = gitHead(sourceRoot); |
| sourceEvidence | function | 325 | no | function sourceEvidence({ project, path, startLine = 1, endLine = 60 } = {}) { |
| rel | const | 327 | no | const rel = relativeSourcePath(path); |
| row | const | 329 | no | const row = db.prepare( &#39;SELECT f.*, p.head AS project_head, p.indexed_at AS index_watermark&#39; + &#39; FROM files f JOIN projects p ON p.id=f.project_id WHERE p.name=? AND f.path=?&#39; ).get(project, rel); |
| absolute | const | 334 | no | const absolute = authorizedFile(project, rel, row.abs_path, records); |
| buffer | const | 338 | no | const buffer = readFileSync(absolute); |
| indexedHash | const | 339 | no | const indexedHash = row.hash \|\| null; |
| currentHash | const | 340 | no | const currentHash = sha256(buffer); |
| sourceRoot | const | 341 | no | const sourceRoot = storedRoot(records.find(item =&gt; item.name === project)); |
| currentRevision | const | 342 | no | const currentRevision = gitHead(sourceRoot); |
| stale | const | 343 | no | const stale = currentHash !== indexedHash |
| lines | const | 345 | no | const lines = buffer.toString(&#39;utf8&#39;).split(/\\r?\\n/u); |
| to | const | 347 | no | const to = Math.max(from, Math.min(lines.length, from + 499, Math.trunc(Number(endLine) \|\| 60))); |
| projectSurfaces | function | 360 | no | function projectSurfaces(db, records, { project, query = &#39;&#39;, path, ids = [], limit = 24 } = {}) { |
| cap | const | 364 | no | const cap = Math.max(1, Math.min(48, Math.trunc(Number(limit)) \|\| 24)); |
| exactPath | const | 365 | no | const exactPath = path == null ? null : relativeSourcePath(path); |
| args | const | 369 | no | const args = [MAX_FILE_BYTES, ...surfaceKinds]; |
| rows | const | 383 | no | const rows = db.prepare(`SELECT f.*, p.name AS project, p.indexed_at AS watermark, p.head AS project_revision FROM files f JOIN projects p ON p.id=f.project_id WHERE ${where.join(&#39; AND &#39;)} ORDER BY p… |
| tags | const | 386 | no | const tags = db.prepare(`SELECT line,kind,ref FROM annotations WHERE file_id=? AND kind IN (${surfaceKinds.map(() =&gt; &#39;?&#39;).join(&#39;,&#39;)}) AND ref IS NOT NULL ORDER BY line,kind,ref LIMIT 65`); |
| imports | const | 389 | no | const imports = db.prepare(`SELECT i.line,f.path,p.name AS project FROM imports i JOIN files f ON f.id=i.resolved_file_id JOIN projects p ON p.id=f.project_id WHERE i.file_id=? AND f.kind=&#39;source&#39; AN… |
| files | const | 393 | no | const files = []; |
| omitted | variable | 394 | no | let omitted = false; |
| currentHash | variable | 398 | no | let currentHash = null; |
| absolute | const | 400 | no | const absolute = authorizedFile(row.project, row.path, row.abs_path, records); |
| observations | const | 404 | no | const observations = tags.all(row.id, ...surfaceKinds) |
| anchors | const | 406 | no | const anchors=indexedSemanticAnchors(db,{fileId:row.id,project:row.project,path:row.path,hash:row.hash}); |
| annotations | const | 407 | no | const annotations = observations.slice(0,64).map(tag =&gt; { const kind = tag.kind.slice(3); const {resolution}=annotationResolution(db,tag.ref,kind); const anchor=anchors.find(a=&gt;a.semanticId===tag.ref… |
| kind | const | 408 | no | const kind = tag.kind.slice(3); |
| anchor | const | 410 | no | const anchor=anchors.find(a=&gt;a.semanticId===tag.ref&amp;&amp;a.annotationKind===kind); |
| semanticIds | const | 416 | no | const semanticIds = [...new Set(annotations.map(a =&gt; a.semanticId))].sort(); |
| fresh | const | 417 | no | const fresh = row.hash === currentHash; |
| relationships | const | 418 | no | const relationships = [ |
| fileSurface | function | 438 | no | function fileSurface(options = {}) { |
| fileSurfaceContext | function | 441 | no | function fileSurfaceContext({ project, path, task = &#39;&#39;, anchorId, fingerprint } = {}) { |
| exact | const | 443 | no | const exact=anchorId!==undefined\|\|fingerprint!==undefined; |
| selected | const | 448 | no | const selected = projectSurfaces(db, records, { project, path, limit: 1 }).files[0]; |
| exactAnchor | const | 451 | no | const exactAnchor=exact?selected.annotations.find(a=&gt;a.semanticAnchor?.anchorId===anchorId&amp;&amp; a.semanticAnchor.fingerprint===fingerprint&amp;&amp;a.semanticAnchor.state===&#39;indexed&#39;&amp;&amp; a.evidence?.assurance===&#39;… |
| ids | const | 455 | no | const ids = exact?[exactAnchor.semanticId]:selected.commentIds.slice(0,12); |
| related | const | 456 | no | const related = (exact?[]:projectSurfaces(db, records, { project, ids, limit: 16 }).files) |
| observed | const | 458 | no | const observed = new Map([...related, selected].map(file =&gt; [file.sourceId, file])); |
| allowedSourceRefs | const | 459 | no | const allowedSourceRefs = new Set(observed.keys()); |
| anchor | const | 460 | no | const anchor = exactAnchor??selected.annotations.find(a =&gt; [&#39;emits&#39;,&#39;consumes&#39;,&#39;action&#39;,&#39;capability&#39;].includes(a.kind) &amp;&amp; ids.includes(a.semanticId)) |
| preferredSemanticAnchor | const | 462 | no | const preferredSemanticAnchor = { ref: selected.sourceId, line: anchor.line, semanticId: anchor.semanticId }; |
| bundle | const | 463 | no | const bundle = composeContext(db, { task: task.trim() \|\| &#39;Explain &#39; + selected.path, project, sourceSemanticIds: ids, allowedSourceRefs, preferredSemanticAnchor, budgetTokens: 5000, maxFiles: exact?1… |
| sources | const | 481 | no | const sources = bundle.sources.map(({ absPath, ...source }) =&gt; source); |
| compiledContext | function | 491 | no | function compiledContext({ task, sourceSemanticIds = [], budgetTokens=2400 } = {}) { |
| ids | const | 497 | no | const ids = [...new Set(sourceSemanticIds)].sort(); |
| none | function | 499 | no | const none = (status,packet) =&gt; ({ schema: &#39;vivim.source-context/1&#39;, status, context: null, ...(packet?{semanticPacket:packet}:{}) }); |
| surface | const | 502 | no | const surface=projectSurfaces(db, records, { ids, limit: 16 }); |
| matches | const | 504 | no | const matches=surface.files; |
| fresh | const | 505 | no | const fresh = matches.filter(file =&gt; file.freshness === &#39;indexed&#39;); |
| observed | const | 507 | no | const observed = new Map(fresh.map(file =&gt; [file.sourceId, file])); |
| bundle | const | 508 | no | const bundle = composeContext(db, { task, sourceSemanticIds: ids, allowedSourceRefs: new Set(observed.keys()), budgetTokens, reservedForOutput: Math.min(400,budgetTokens), maxFiles: 3, requireSemanti… |
| current | const | 519 | no | const current = projectSurfaces(db, records, { project:source.project, path:source.path, limit:1 }).files[0]; |
| semanticIds | function | 532 | no | function semanticIds(options = {}) { |
| semanticId | function | 535 | no | function semanticId(id) { |
| scanCapabilities | function | 538 | no | function scanCapabilities({ path } = {}) { |
| source | const | 539 | no | const source = permit(&#39;source.capabilities&#39;, path); |
| lock | const | 544 | no | const lock = join(source, &#39;package-lock.json&#39;); |
| metadata | const | 549 | no | const metadata = JSON.parse(readFileSync(lock, &#39;utf8&#39;)); |
| rel | const | 552 | no | const rel = relativeSourcePath(key); |
| candidate | const | 554 | no | const candidate = resolve(source, rel); |
| snapshot | const | 561 | no | const snapshot = scanCapabilitySource(source, { id: stableSourceId(source) }); |
| result | const | 562 | no | const result = persistCapabilityScan(db, snapshot); |
| status | function | 566 | no | function status() { |
| sources | const | 567 | no | const sources = guardedProjects(&#39;source.status&#39;).map(({ name, path }) =&gt; ({ name, sourceId: stableSourceId(storedRoot({ path })) })); |
| index | const | 568 | no | const index = withDatabase(db =&gt; { const files = db.prepare(&#39;SELECT COUNT(*) AS n FROM files&#39;).get().n; const symbols = db.prepare(&#39;SELECT COUNT(*) AS n FROM symbols&#39;).get().n; return { files, symbol… |
| files | const | 569 | no | const files = db.prepare(&#39;SELECT COUNT(*) AS n FROM files&#39;).get().n; |
| symbols | const | 570 | no | const symbols = db.prepare(&#39;SELECT COUNT(*) AS n FROM symbols&#39;).get().n; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ./schema.mjs | import | 6 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./registry.mjs | import | 7 | [hq/lib/registry.mjs](./registry.mjs.md) |
| ./indexer.mjs | import | 8 | [hq/lib/indexer.mjs](./indexer.mjs.md) |
| ./search.mjs | import | 9 | [hq/lib/search.mjs](./search.mjs.md) |
| ./annotation-v2.mjs | import | 10 | [hq/lib/annotation-v2.mjs](./annotation-v2.mjs.md) |
| ./context.mjs | import | 11 | [hq/lib/context.mjs](./context.mjs.md) |
| ./graph.mjs | import | 12 | [hq/lib/graph.mjs](./graph.mjs.md) |
| ./wiki.mjs | import | 13 | [hq/lib/wiki.mjs](./wiki.mjs.md) |
| ./semantic-registry.mjs | import | 14 | [hq/lib/semantic-registry.mjs](./semantic-registry.mjs.md) |
| ./capabilities.mjs | import | 15 | [hq/lib/capabilities.mjs](./capabilities.mjs.md) |
| ./git.mjs | import | 16 | [hq/lib/git.mjs](./git.mjs.md) |
| ./util.mjs | import | 17 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/live-source-surface.mjs](../../apps/vivim-host/control/live-source-surface.mjs.md) | ../../../hq/lib/arbor-service.mjs |
| [apps/vivim-host/test/live-source-surface.test.mjs](../../apps/vivim-host/test/live-source-surface.test.mjs.md) | ../../../hq/lib/arbor-service.mjs |
| [hq/bin/arbor-hq.mjs](../bin/arbor-hq.mjs.md) | ../lib/arbor-service.mjs |
| [hq/test/arbor-boundary.test.mjs](../test/arbor-boundary.test.mjs.md) | ../lib/arbor-service.mjs |
| [hq/test/arbor-service.test.mjs](../test/arbor-service.test.mjs.md) | ../lib/arbor-service.mjs |
| [hq/test/semantic-source-context.test.mjs](../test/semantic-source-context.test.mjs.md) | ../lib/arbor-service.mjs |
| [hq/test/vlang-compiled-context.test.mjs](../test/vlang-compiled-context.test.mjs.md) | ../lib/arbor-service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 582 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
