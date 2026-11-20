# File: hq/lib/kb-intake.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/kb-intake.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 58745 B |
| Lines | 1597 |
| Hash | 3802cd226a2a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INTAKE_SCHEMA | const | 34 | yes | export const INTAKE_SCHEMA = &#39;hq.vivim-kb-intake/1&#39;; |
| PACKAGE_SCHEMA | const | 35 | no | const PACKAGE_SCHEMA = &#39;hq.vivim-kb/1&#39;; |
| META_KEY | const | 36 | no | const META_KEY = &#39;vivim.kb.intake&#39;; |
| MAX_FILES | const | 38 | no | const MAX_FILES = 4000; |
| MAX_BYTES | const | 39 | no | const MAX_BYTES = 64 * 1024 * 1024; |
| ALLOWED_AUTHORITIES | const | 42 | no | const ALLOWED_AUTHORITIES = new Set([&#39;project_observed&#39;, &#39;local_custom&#39;]); |
| DECISION_STATUS | const | 46 | no | const DECISION_STATUS = &#39;proposed&#39;; |
| TERM_STATUS | const | 47 | no | const TERM_STATUS = &#39;provisional&#39;; |
| PACKAGE_AUTHORITY | const | 48 | no | const PACKAGE_AUTHORITY = &#39;project_observed&#39;; |
| DOCUMENT_AUTHORITIES | const | 50 | no | const DOCUMENT_AUTHORITIES = [ |
| KB_TYPE_TARGETS | const | 58 | no | const KB_TYPE_TARGETS = new Map([ [&#39;KB-DECISION&#39;, &#39;decision&#39;], [&#39;KB-VOCABULARY&#39;, &#39;term&#39;], [&#39;KB-TERM&#39;, &#39;term&#39;], [&#39;KB-CANON&#39;, &#39;term&#39;], |
| KB_MARKER | const | 66 | no | const KB_MARKER = &#39;KB-(?:DECISION\|VOCABULARY\|TERM\|CANON\|PROJECT)&#39;; |
| KB_MARKER_RE | const | 67 | no | const KB_MARKER_RE = new RegExp(`\\\\b${KB_MARKER}\\\\b`, &#39;i&#39;); |
| KB_LEADING_RE | const | 68 | no | const KB_LEADING_RE = new RegExp(`^(?:#{1,6}\\\\s*)?(?:\\\\[\|\\\\()?(${KB_MARKER})\\\\b`, &#39;i&#39;); const KB_TITLE_PREFIX_RE = new RegExp(`^${KB_MARKER}\\\\b\\\\s*[:\\\\u2014-]?\\\\s*`, &#39;i&#39;); const SECRET_BASENAMES = ne… |
| KB_TITLE_PREFIX_RE | const | 69 | no | const KB_TITLE_PREFIX_RE = new RegExp(`^${KB_MARKER}\\\\b\\\\s*[:\\\\u2014-]?\\\\s*`, &#39;i&#39;); |
| SECRET_BASENAMES | const | 71 | no | const SECRET_BASENAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, &#39;login data&#39;, ]); |
| SECRET_CONTENT | const | 75 | no | const SECRET_CONTENT = [ |
| cmpStr | function | 88 | no | const cmpStr = (a, b) =&gt; (a === b ? 0 : a &lt; b ? -1 : 1); |
| asArray | function | 90 | no | function asArray(value) { |
| normalizeRelPath | function | 94 | no | function normalizeRelPath(value) { |
| path | variable | 95 | no | let path = toPosix(String(value ?? &#39;&#39;)).trim(); |
| isUnsafePath | function | 103 | no | function isUnsafePath(value) { |
| path | const | 104 | no | const path = normalizeRelPath(value); |
| baseNameOf | function | 110 | no | function baseNameOf(value) { |
| path | const | 111 | no | const path = normalizeRelPath(value); |
| at | const | 112 | no | const at = path.lastIndexOf(&#39;/&#39;); |
| stripRoot | function | 116 | no | function stripRoot(path, root) { |
| prefix | const | 117 | no | const prefix = normalizeRelPath(root); |
| isSecretPath | function | 124 | no | function isSecretPath(value) { |
| name | const | 125 | no | const name = baseNameOf(value).toLowerCase(); |
| secretContentHit | function | 132 | no | function secretContentHit(text) { |
| value | const | 133 | no | const value = String(text ?? &#39;&#39;); |
| titleFallback | function | 140 | no | function titleFallback(path) { |
| sameValue | function | 144 | no | function sameValue(a, b) { |
| sameRow | function | 148 | no | function sameRow(prior, next, fields) { |
| cleanTitle | function | 156 | no | function cleanTitle(value, cap = 300) { |
| cleanField | function | 160 | no | function cleanField(value, cap = 4000) { |
| text | const | 161 | no | const text = String(value ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| kbUnquote | function | 165 | no | function kbUnquote(value) { |
| text | const | 166 | no | const text = String(value ?? &#39;&#39;).trim(); |
| kbFrontmatter | function | 174 | no | function kbFrontmatter(text) { |
| lines | const | 175 | no | const lines = String(text ?? &#39;&#39;).split(/\\r?\\n/); |
| meta | const | 176 | no | const meta = {}; |
| kbTypeOf | function | 192 | no | function kbTypeOf(path, text) { |
| declared | const | 194 | no | const declared = String(meta.type ?? &#39;&#39;).trim().toUpperCase().replace(/[_\\s]+/g, &#39;-&#39;); |
| lines | const | 198 | no | const lines = String(text ?? &#39;&#39;).split(/\\r?\\n/).slice(bodyStart); |
| trimmed | const | 200 | no | const trimmed = line.trim(); |
| marker | const | 204 | no | const marker = match[1].toUpperCase(); |
| base | const | 209 | no | const base = baseNameOf(path).replace(/\\.[A-Za-z0-9]+$/, &#39;&#39;); |
| marker | const | 212 | no | const marker = match[0].toUpperCase(); |
| kbParts | function | 219 | no | function kbParts(path, text) { |
| lines | const | 221 | no | const lines = String(text ?? &#39;&#39;).split(/\\r?\\n/).slice(bodyStart); |
| title | variable | 222 | no | let title = cleanTitle(meta.title, 300); |
| body | const | 232 | no | const body = []; |
| started | variable | 233 | no | let started = false; |
| trimmed | const | 235 | no | const trimmed = line.trim(); |
| heading | const | 241 | no | const heading = cleanTitle(trimmed.replace(/^#{1,6}\\s*/, &#39;&#39;), 300); |
| kbDate | function | 251 | no | function kbDate(value) { |
| kbDateFromPath | function | 257 | no | function kbDateFromPath(path) { |
| claimedStatus | function | 264 | no | function claimedStatus(meta) { |
| raw | const | 265 | no | const raw = String(meta?.status ?? meta?.state ?? &#39;&#39;).trim(); |
| decisionIdOf | function | 270 | no | function decisionIdOf(project, title, sourcePath) { |
| termIdOf | function | 274 | no | function termIdOf(project, term, sourcePath) { |
| listOf | function | 278 | no | function listOf(value) { |
| raw | const | 280 | no | const raw = String(value ?? &#39;&#39;).trim(); |
| kbDecisionRecord | function | 288 | no | function kbDecisionRecord({ project, file, typeInfo }) { |
| claimed | const | 290 | no | const claimed = claimedStatus(meta); |
| date | const | 291 | no | const date = kbDate(meta.date ?? meta.decided ?? meta.updated) ?? kbDateFromPath(file.path); |
| evidence | const | 292 | no | const evidence = { |
| splitTableRow | function | 324 | no | function splitTableRow(line) { |
| value | variable | 325 | no | let value = String(line).trim(); |
| TERM_TABLE_COLUMNS | const | 331 | no | const TERM_TABLE_COLUMNS = { |
| kbTermRows | function | 339 | no | function kbTermRows(text) { |
| lines | const | 340 | no | const lines = String(text ?? &#39;&#39;).split(/\\r?\\n/); |
| out | const | 341 | no | const out = []; |
| header | const | 345 | no | const header = splitTableRow(lines[i]).map((cell) =&gt; cell.toLowerCase().replace(/[*_`]/g, &#39;&#39;).trim()); |
| cols | const | 346 | no | const cols = {}; |
| j | variable | 352 | no | let j = i + 2; |
| cells | const | 355 | no | const cells = splitTableRow(lines[j]); |
| term | const | 356 | no | const term = cleanTitle(cells[cols.term], 200); |
| kbTermRecords | function | 366 | no | function kbTermRecords({ project, file, typeInfo }) { |
| claimed | const | 368 | no | const claimed = claimedStatus(meta); |
| make | function | 369 | no | const make = (term, definition, aliases = [], contrasts = []) =&gt; { |
| cleanTerm | const | 370 | no | const cleanTerm = cleanTitle(term, 200); |
| cleanDefinition | const | 372 | no | const cleanDefinition = cleanField(definition); |
| evidence | const | 373 | no | const evidence = { |
| declaredTerm | const | 403 | no | const declaredTerm = cleanTitle(meta.term ?? meta.concept ?? &#39;&#39;, 200); |
| rows | const | 412 | no | const rows = kbTermRows(file.text); |
| kbProjectDeclaration | function | 425 | no | function kbProjectDeclaration({ file, typeInfo }) { |
| declaredPath | variable | 427 | no | let declaredPath = String(meta.path ?? meta.project_path ?? meta.root ?? &#39;&#39;).trim(); |
| mergeRouted | function | 441 | no | function mergeRouted(base, extra, anchorOf) { |
| items | const | 442 | no | const items = [...base]; |
| ids | const | 443 | no | const ids = new Set(base.map((entry) =&gt; entry.id)); |
| anchors | const | 444 | no | const anchors = new Set(base.map(anchorOf)); |
| added | variable | 445 | no | let added = 0; |
| anchor | const | 447 | no | const anchor = anchorOf(entry); |
| projectEntryAt | function | 461 | no | function projectEntryAt(workspace, abs) { |
| root | const | 462 | no | const root = workspaceRootOf(workspace); |
| data | variable | 463 | no | let data = null; |
| stored | const | 467 | no | const stored = String(entry.path ?? &#39;&#39;); |
| isDirectory | function | 474 | no | function isDirectory(abs) { |
| planProjectRegistration | function | 478 | no | function planProjectRegistration(db, workspace, decl) { |
| declared | const | 479 | no | const declared = String(decl.path ?? &#39;&#39;).trim(); |
| resolvedPath | const | 488 | no | const resolvedPath = isAbsolute(declared) ? resolve(declared) : resolve(workspaceRootOf(workspace), declared); |
| name | const | 489 | no | const name = decl.name \|\| baseNameOf(resolvedPath); |
| existing | const | 499 | no | const existing = projectEntryAt(workspace, resolvedPath); |
| projectView | function | 512 | no | function projectView(plan) { |
| registerPlannedProject | function | 523 | no | function registerPlannedProject(db, workspace, plan) { |
| root | const | 524 | no | const root = workspaceRootOf(workspace); |
| entry | const | 525 | no | const entry = registerProject(root, { name: plan.name, path: plan.resolvedPath }); |
| stored | const | 526 | no | const stored = entry?.path ?? storedPath(root, plan.resolvedPath); |
| row | const | 527 | no | const row = db.prepare(&#39;SELECT id, name FROM projects WHERE name = ?&#39;).get(plan.name); |
| fileRecord | function | 539 | no | function fileRecord(path, text, bytes) { |
| buffer | const | 540 | no | const buffer = bytes ?? Buffer.from(String(text ?? &#39;&#39;), &#39;utf8&#39;); |
| normalizeFiles | function | 551 | no | function normalizeFiles(files, root) { |
| byPath | const | 552 | no | const byPath = new Map(); |
| raw | const | 555 | no | const raw = entry.path ?? entry.rel ?? entry.name; |
| path | const | 556 | no | const path = stripRoot(normalizeRelPath(raw), root); |
| text | const | 558 | no | const text = typeof entry.text === &#39;string&#39; ? entry.text : undefined; |
| bytes | const | 559 | no | const bytes = Buffer.isBuffer(entry.bytes) ? entry.bytes : undefined; |
| walkPackage | function | 565 | no | function walkPackage(dir, prefix = &#39;&#39;) { |
| out | const | 566 | no | const out = []; |
| ARTIFACTS | const | 570 | no | const ARTIFACTS = new Set([&#39;manifest.json&#39;, &#39;files.json&#39;, &#39;manifest.digest&#39;]); |
| entries | variable | 571 | no | let entries; |
| rel | const | 578 | no | const rel = prefix ? `${prefix}/${entry.name}` : entry.name; |
| size | variable | 585 | no | let size = 0; |
| readDirectoryPackage | function | 597 | no | function readDirectoryPackage(dir) { |
| abs | const | 598 | no | const abs = resolve(String(dir)); |
| manifestPath | const | 599 | no | const manifestPath = join(abs, &#39;manifest.json&#39;); |
| manifest | variable | 603 | no | let manifest; |
| entries | const | 610 | no | const entries = walkPackage(abs).filter((entry) =&gt; entry.rel !== &#39;manifest.json&#39;); |
| files | const | 611 | no | const files = []; |
| bytes | variable | 613 | no | let bytes; |
| lifecycleFor | function | 628 | no | function lifecycleFor(path, cls) { |
| lower | const | 629 | no | const lower = normalizeRelPath(path).toLowerCase(); |
| segments | const | 630 | no | const segments = lower.split(&#39;/&#39;); |
| name | const | 631 | no | const name = segments[segments.length - 1] \|\| &#39;&#39;; |
| fromRegistry | const | 638 | no | const fromRegistry = cls &amp;&amp; cls.lifecycle ? String(cls.lifecycle) : &#39;&#39;; |
| classifyFile | function | 642 | no | function classifyFile(registry, path, ceiling = &#39;project_observed&#39;) { |
| cls | const | 643 | no | const cls = registry ? classifyPath(registry, path) : null; |
| family | const | 644 | no | const family = cls &amp;&amp; cls.family &amp;&amp; String(cls.family) !== &#39;00&#39; ? String(cls.family) : null; |
| authority | const | 645 | no | const authority = cls &amp;&amp; cls.authority ? String(cls.authority) : &#39;&#39;; |
| labelled | const | 646 | no | const labelled = DOCUMENT_AUTHORITIES.includes(authority) ? authority : ceiling; |
| landed | const | 649 | no | const landed = labelled === &#39;vendor_documented&#39; ? ceiling : labelled; |
| packageDigest | function | 668 | no | function packageDigest(manifest, files) { |
| rest | const | 669 | no | const rest = { ...((manifest &amp;&amp; typeof manifest === &#39;object&#39;) ? manifest : {}) }; |
| payload | const | 671 | no | const payload = { |
| stagePackage | function | 682 | no | function stagePackage(files) { |
| dir | const | 683 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-kb-intake-&#39;)); |
| abs | const | 685 | no | const abs = join(dir, file.path); |
| claimsOf | function | 692 | no | function claimsOf(record) { |
| out | const | 693 | no | const out = []; |
| claimed | const | 695 | no | const claimed = entry &amp;&amp; entry.claimed ? String(entry.claimed).trim() : &#39;&#39;; |
| buildReport | function | 705 | no | function buildReport({ ok, manifest, digest, project, counts, byFamily, changed, unchanged, added, missingFromPackage, reasons, evidence, notices, kbTypes, projects, }) { |
| emptyCounts | function | 745 | no | function emptyCounts() { |
| projectNameOf | function | 753 | no | function projectNameOf(project, manifest) { |
| registeredProject | function | 760 | no | function registeredProject(db, name) { |
| row | const | 762 | no | const row = db.prepare(&#39;SELECT id, name, path FROM projects WHERE name = ?&#39;).get(String(name)); |
| findWorkspaceRoot | function | 768 | no | function findWorkspaceRoot(start = process.cwd()) { |
| dir | variable | 769 | no | let dir = resolve(start); |
| parent | const | 772 | no | const parent = dirname(dir); |
| workspaceRootOf | function | 778 | no | function workspaceRootOf(workspace) { |
| workspaceProjectNames | function | 782 | no | function workspaceProjectNames(workspace) { |
| names | const | 783 | no | const names = new Set(); |
| data | variable | 784 | no | let data = null; |
| name | const | 787 | no | const name = typeof entry === &#39;string&#39; ? entry : String(entry?.name ?? &#39;&#39;); |
| isRegisteredProject | function | 796 | no | function isRegisteredProject(db, name, workspace) { |
| resolveRegistry | function | 802 | no | function resolveRegistry(registry) { |
| DOCUMENT_UPSERT | const | 815 | no | const DOCUMENT_UPSERT = ` |
| DOCUMENT_COMPARE | const | 835 | no | const DOCUMENT_COMPARE = [ |
| DECISION_UPSERT | const | 840 | no | const DECISION_UPSERT = ` |
| DECISION_COMPARE | const | 864 | no | const DECISION_COMPARE = [ |
| TERM_UPSERT | const | 870 | no | const TERM_UPSERT = ` |
| TERM_COMPARE | const | 894 | no | const TERM_COMPARE = [ |
| documentChanged | function | 899 | no | function documentChanged(prior, doc) { |
| writeDocuments | function | 904 | no | function writeDocuments(db, projectId, documents, now) { |
| upsert | const | 905 | no | const upsert = db.prepare(DOCUMENT_UPSERT); |
| prior | const | 906 | no | const prior = new Map( db.prepare(&#39;SELECT * FROM documents WHERE project_id = ?&#39;).all(projectId) .map((row) =&gt; [row.path, row]), ); |
| added | variable | 910 | no | let added = 0; |
| changed | variable | 911 | no | let changed = 0; |
| unchanged | variable | 912 | no | let unchanged = 0; |
| existing | const | 914 | no | const existing = prior.get(doc.path); |
| binds | const | 915 | no | const binds = JSON.stringify(doc.binds_to ?? []); |
| writeDecisions | function | 939 | no | function writeDecisions(db, projectId, decisions, now) { |
| upsert | const | 940 | no | const upsert = db.prepare(DECISION_UPSERT); |
| prior | const | 941 | no | const prior = new Map( db.prepare(&#39;SELECT * FROM decisions WHERE project_id = ?&#39;).all(projectId) .map((row) =&gt; [row.id, row]), ); |
| added | variable | 945 | no | let added = 0; |
| changed | variable | 946 | no | let changed = 0; |
| existing | const | 948 | no | const existing = prior.get(decision.id) \|\| null; |
| locked | const | 950 | no | const locked = Boolean(existing &amp;&amp; (existing.status === &#39;accepted&#39; \|\| existing.status === &#39;superseded&#39;)); |
| params | const | 951 | no | const params = { |
| writeTerms | function | 995 | no | function writeTerms(db, projectId, terms, now) { |
| upsert | const | 996 | no | const upsert = db.prepare(TERM_UPSERT); |
| prior | const | 997 | no | const prior = new Map( db.prepare(&#39;SELECT * FROM canon_terms WHERE project_id = ?&#39;).all(projectId) .map((row) =&gt; [row.id, row]), ); |
| added | variable | 1001 | no | let added = 0; |
| changed | variable | 1002 | no | let changed = 0; |
| existing | const | 1004 | no | const existing = prior.get(term.id) \|\| null; |
| locked | const | 1006 | no | const locked = Boolean(existing &amp;&amp; (existing.status === &#39;current&#39; \|\| existing.status === &#39;deprecated&#39;)); |
| params | const | 1007 | no | const params = { |
| ingestKbPackage | function | 1062 | yes | export function ingestKbPackage(db, { manifest = null, files = [], project = null, root = null, |
| reasons | const | 1071 | no | const reasons = []; |
| projectName | const | 1072 | no | const projectName = projectNameOf(project, manifest); |
| empty | const | 1073 | no | const empty = emptyCounts(); |
| manifestProject | const | 1081 | no | const manifestProject = manifest &amp;&amp; typeof manifest === &#39;object&#39; ? String(manifest.project ?? &#39;&#39;).trim() : &#39;&#39;; |
| requestedProject | const | 1082 | no | const requestedProject = typeof project === &#39;string&#39; |
| authority | const | 1094 | no | const authority = String(manifest.authority ?? &#39;&#39;); |
| normalized | const | 1100 | no | const normalized = normalizeFiles(files, root ?? (manifest &amp;&amp; manifest.root) ?? &#39;&#39;); |
| totalBytes | const | 1101 | no | const totalBytes = normalized.reduce((sum, file) =&gt; sum + file.size, 0); |
| secretFiles | const | 1109 | no | const secretFiles = new Set(); |
| hit | const | 1120 | no | const hit = secretContentHit(file.text); |
| hit | const | 1127 | no | const hit = secretContentHit(manifest.notes); |
| digest | const | 1151 | no | const digest = packageDigest(manifest, normalized); |
| activeRegistry | const | 1152 | no | const activeRegistry = resolveRegistry(registry); |
| packageAuthority | const | 1155 | no | const packageAuthority = ALLOWED_AUTHORITIES.has(String(manifest?.authority ?? &#39;&#39;)) |
| classified | const | 1158 | no | const classified = normalized.map((file) =&gt; ({ file, cls: classifyFile(activeRegistry, file.path, packageAuthority), })); |
| familyCounts | const | 1163 | no | const familyCounts = {}; |
| byFamily | const | 1168 | no | const byFamily = {}; |
| decisions | variable | 1172 | no | let decisions = []; |
| terms | variable | 1173 | no | let terms = []; |
| scanned | variable | 1174 | no | let scanned = new Map(); |
| staging | const | 1175 | no | const staging = stagePackage(normalized); |
| scoped | const | 1177 | no | const scoped = { name: projectName, path: staging }; |
| kbTypes | const | 1189 | no | const kbTypes = { decision: 0, term: 0, project: 0 }; |
| kbDecisions | const | 1190 | no | const kbDecisions = []; |
| kbTerms | const | 1191 | no | const kbTerms = []; |
| kbProjectDocs | const | 1192 | no | const kbProjectDocs = []; |
| typeInfo | const | 1194 | no | const typeInfo = kbTypeOf(entry.file.path, entry.file.text); |
| routedDecisions | const | 1205 | no | const routedDecisions = mergeRouted(decisions, kbDecisions, (entry) =&gt; `${entry.source_path}\\0${entry.title}`); |
| routedTerms | const | 1206 | no | const routedTerms = mergeRouted(terms, kbTerms, (entry) =&gt; `${entry.source_path}\\0${entry.term}`); |
| projectRow | const | 1250 | no | const projectRow = registeredProject(db, projectName); |
| projectId | const | 1277 | no | const projectId = projectRow.id; |
| projectPlans | const | 1279 | no | const projectPlans = kbProjectDocs.map((decl) =&gt; planProjectRegistration(db, workspace, decl)); |
| notices | const | 1280 | no | const notices = projectPlans |
| documents | const | 1290 | no | const documents = classified.map(({ file, cls }) =&gt; { const scan = scanned.get(file.path) \|\| null; return { path: file.path, family: cls.family, |
| scan | const | 1291 | no | const scan = scanned.get(file.path) \|\| null; |
| evidence | const | 1308 | no | const evidence = normalized |
| priorPaths | const | 1313 | no | const priorPaths = db.prepare(&#39;SELECT path FROM documents WHERE project_id = ?&#39;).all(projectId) |
| packagePaths | const | 1315 | no | const packagePaths = new Set(normalized.map((file) =&gt; file.path)); |
| missingFromPackage | const | 1316 | no | const missingFromPackage = priorPaths.filter((path) =&gt; !packagePaths.has(path)).sort(cmpStr); |
| counts | const | 1318 | no | const counts = { |
| diff | const | 1333 | no | const diff = dryRunDiff(db, projectId, documents); |
| now | const | 1353 | no | const now = nowISO(); |
| written | const | 1354 | no | const written = transaction(db, () =&gt; { const docs = writeDocuments(db, projectId, documents, now); const decs = writeDecisions(db, projectId, decisions, now); const trms = writeTerms(db, projectId, … |
| docs | const | 1355 | no | const docs = writeDocuments(db, projectId, documents, now); |
| decs | const | 1356 | no | const decs = writeDecisions(db, projectId, decisions, now); |
| trms | const | 1357 | no | const trms = writeTerms(db, projectId, terms, now); |
| projectResults | const | 1382 | no | const projectResults = []; |
| stored | const | 1389 | no | const stored = registerPlannedProject(db, workspace, plan); |
| reason | const | 1398 | no | const reason = `project_register_failed: &quot;${plan.docPath}&quot; could not register &quot;${plan.name}&quot;: ${error instanceof Error ? error.message : String(error)}`; |
| ingestKbDirectory | function | 1441 | yes | export function ingestKbDirectory(db, { dir, project = null, registry = null, dryRun = false, workspace = null } = {}) { |
| read | const | 1458 | no | const read = readDirectoryPackage(dir); |
| dryRunDiff | function | 1486 | no | function dryRunDiff(db, projectId, documents) { |
| prior | const | 1487 | no | const prior = new Map( db.prepare(&#39;SELECT * FROM documents WHERE project_id = ?&#39;).all(projectId) .map((row) =&gt; [row.path, row]), ); |
| added | variable | 1491 | no | let added = 0; |
| changed | variable | 1492 | no | let changed = 0; |
| unchanged | variable | 1493 | no | let unchanged = 0; |
| existing | const | 1495 | no | const existing = prior.get(doc.path); |
| intakePlan | function | 1509 | yes | export function intakePlan(db, { project = null, registry = null, workspace = null } = {}) { |
| steps | const | 1510 | no | const steps = [ |
| blockers | const | 1522 | no | const blockers = []; |
| projectName | const | 1523 | no | const projectName = projectNameOf(project, null); |
| intakeStatus | function | 1547 | yes | export function intakeStatus(db) { |
| raw | const | 1548 | no | const raw = getMeta(db, META_KEY, null); |
| parsed | const | 1552 | no | const parsed = safeJsonParse(raw, null) \|\| {}; |
| intakeVerify | function | 1565 | yes | export function intakeVerify(db, { manifest = null, files = [], project = null, root = null } = {}) { |
| projectName | const | 1566 | no | const projectName = projectNameOf(project, manifest); |
| row | const | 1567 | no | const row = registeredProject(db, projectName); |
| normalized | const | 1571 | no | const normalized = normalizeFiles(files, root ?? (manifest &amp;&amp; manifest.root) ?? &#39;&#39;); |
| prior | const | 1572 | no | const prior = new Map( db.prepare(&#39;SELECT path, hash FROM documents WHERE project_id = ?&#39;).all(row.id) .map((entry) =&gt; [String(entry.path), entry]), ); |
| packagePaths | const | 1576 | no | const packagePaths = new Set(normalized.map((file) =&gt; file.path)); |
| changed | variable | 1577 | no | let changed = 0; |
| unchanged | variable | 1578 | no | let unchanged = 0; |
| added | variable | 1579 | no | let added = 0; |
| existing | const | 1581 | no | const existing = prior.get(file.path); |
| missing | const | 1589 | no | const missing = [...prior.keys()].filter((path) =&gt; !packagePaths.has(path)).sort(cmpStr); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 17 | external |
| node:os | import | 20 | external |
| node:path | import | 21 | external |
| ./canon.mjs | import | 23 | [hq/lib/canon.mjs](./canon.mjs.md) |
| ./filetypes.mjs | import | 24 | [hq/lib/filetypes.mjs](./filetypes.mjs.md) |
| ./memory.mjs | import | 25 | [hq/lib/memory.mjs](./memory.mjs.md) |
| ./registry.mjs | import | 26 | [hq/lib/registry.mjs](./registry.mjs.md) |
| ./schema.mjs | import | 27 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./util.mjs | import | 28 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kb-intake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kb-intake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/kb-intake.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | VIVIM KB handover intake: classify an incoming KB package, |
| 4 | owner | hq | — | hq |
| 5 | task | — | — | lane-U |
| 6 | invariant | — | — | An incoming KB is evidence, never authority. Decisions land |
| 9 | invariant | — | — | A refusal is a receipt, not an exception: a refused package |
| 11 | invariant | — | — | The package digest is content-addressed over the manifest |
| 14 | see | — | docs/VIVIM-KB-INTAKE.md | docs/VIVIM-KB-INTAKE.md |
| 15 | see | — | hq/CONTRACT.md | hq/CONTRACT.md |

## Excerpt

```javascript
/**
 * @hq:context VIVIM KB handover intake: classify an incoming KB package,
 *   record it with provenance, refuse secrets, stay idempotent.
 * @hq:owner hq
 * @hq:task lane-U
 * @hq:invariant An incoming KB is evidence, never authority. Decisions land
 *   `proposed`, CANON terms land `provisional`, and nothing inside a package
 *   can grant authority, confirm a decision or cause an effect.
 * @hq:invariant A refusal is a receipt, not an exception: a refused package
 *   writes nothing. One package is one transaction; an error rolls it back.
 * @hq:invariant The package digest is content-addressed over the manifest
 *   without `producedAt` plus the ordered file hashes. Timestamps live
 *   outside the digestible payload, so the same package always hashes the same.
 * @hq:see docs/VIVIM-KB-INTAKE.md
 * @hq:see hq/CONTRACT.md
 */
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import { extractCanonTerms, extractDecisions, scanDocuments } from './canon.mjs';
import { classifyPath, loadRegistry } from './filetypes.mjs';
import { addNote } from './memory.mjs';
import { loadProjects, registerProject, resolveProjectPath, storedPath } from './registry.mjs';
import { getMeta, setMeta, transaction } from './schema.mjs';
import { digestOf, nowISO, safeJsonParse, sha256, toPosix } from './util.mjs';

// ---------------------------------------------------------------------------
// contract constants
// ---------------------------------------------------------------------------

export const INTAKE_SCHEMA = 'hq.vivim-kb-intake/1';
const PACKAGE_SCHEMA = 'hq.vivim-kb/1';
const META_KEY = 'vivim.kb.intake';

const MAX_FILES = 4000;
const MAX_BYTES = 64 * 1024 * 1024;

// An incoming package may claim observation-level authority and nothing above.
const ALLOWED_AUTHORITIES = new Set(['project_observed', 'local_custom']);

// The landing status of every decision and every CANON term the package
// brings. Owner confirmation is the only path past these values.
const DECISION_STATUS = 'proposed';
const TERM_STATUS = 'provisional';
const PACKAGE_AUTHORITY = 'project_observed';

const DOCUMENT_AUTHORITIES = [
  'vendor_documented', 'project_observed', 'local_custom', 'proposed', 'historical',
];

// A KB document may declare its own kind through frontmatter `type: KB-…`, a
// leading `KB-…` marker, or its filename. The type decides which register owns
// the row; it never decides authority. Routed rows still pass through the same
// writers, which force `proposed` / `provisional` and `project_observed`.
const KB_TYPE_TARGETS = new Map([
  ['KB-DECISION', 'decision'],
  ['KB-VOCABULARY', 'term'],
  ['KB-TERM', 'term'],
  ['KB-CANON', 'term'],
  ['KB-PROJECT', 'project'],
]);

const KB_MARKER = 'KB-(?:DECISION|VOCABULARY|TERM|CANON|PROJECT)';
const KB_MARKER_RE = new RegExp(`\\b${KB_MARKER}\\b`, 'i');
const KB_LEADING_RE = new RegExp(`^(?:#{1,6}\\s*)?(?:\\[|\\()?(${KB_MARKER})\\b`, 'i');
const KB_TITLE_PREFIX_RE = new RegExp(`^${KB_MARKER}\\b\\s*[:\\u2014-]?\\s*`, 'i');

const SECRET_BASENAMES = new Set([
  'session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'login data',
]);

const SECRET_CONTENT = [
  { id: 'sk-token', re: /sk-[A-Za-z0-9]{16,}/ },
  { id: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'password-assignment', re: /password\s*=\s*\S+/i },
  { id: 'credential-assignment', re: /\b(?:api[_-]?key|secret|token|cookie|authorization)\s*[:=]\s*\S{8,}/i },
  { id: 'bearer-token', re: /\bBearer\s+[A-Za-z0-9._-]{20,}/ },
```

_First 80 of 1598 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
