# File: hq/lib/canon.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/canon.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 98526 B |
| Lines | 2559 |
| Hash | b27a9c77dc38 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FAMILY_CODES | const | 28 | no | const FAMILY_CODES = [ |
| FAMILY_DEFS | const | 38 | no | const FAMILY_DEFS = [ |
| DOCUMENT_FAMILIES | const | 81 | yes | export const DOCUMENT_FAMILIES = Object.freeze(Object.fromEntries( FAMILY_DEFS.map(([code, name, role, patterns]) =&gt; [code, Object.freeze({ name, role, patterns: Object.freeze([...patterns]), })]), )… |
| DECISION_STATUS | const | 88 | yes | export const DECISION_STATUS = Object.freeze([ &#39;proposed&#39;, &#39;accepted&#39;, &#39;rejected&#39;, &#39;superseded&#39;, &#39;deprecated&#39;, &#39;observed&#39;, ]); |
| AUTHORITY | const | 93 | yes | export const AUTHORITY = Object.freeze([ &#39;owner&#39;, &#39;architecture&#39;, &#39;team&#39;, &#39;agent_proposed&#39;, &#39;source_annotation&#39;, ]); |
| DOCUMENT_AUTHORITY | const | 99 | no | const DOCUMENT_AUTHORITY = [&#39;vendor_documented&#39;, &#39;project_observed&#39;, &#39;local_custom&#39;, &#39;proposed&#39;, &#39;historical&#39;]; |
| DECISION_ROOT_FILES | const | 101 | no | const DECISION_ROOT_FILES = new Set([ &#39;decisions.md&#39;, &#39;decision_log.md&#39;, &#39;adr.md&#39;, &#39;conflict-register.md&#39;, &#39;change-request.md&#39;, ]); |
| CANON_ROOT_FILES | const | 104 | no | const CANON_ROOT_FILES = new Set([ &#39;canon-dictionary.md&#39;, &#39;canon.md&#39;, &#39;glossary.md&#39;, &#39;invariants.md&#39;, ]); |
| DECISION_PATH_RE | const | 107 | no | const DECISION_PATH_RE = /^(?:adr\|docs\\/adr\|docs\\/decisions)\\/.+\\.(?:md\|mdx\|ya?ml)$/i; |
| CANON_PATH_RE | const | 108 | no | const CANON_PATH_RE = /^docs\\/canon\\/.+\\.md$/i; |
| MD_EXTS | const | 110 | no | const MD_EXTS = [&#39;.md&#39;, &#39;.mdx&#39;, &#39;.markdown&#39;]; |
| ADR_EXTS | const | 111 | no | const ADR_EXTS = [&#39;.md&#39;, &#39;.mdx&#39;, &#39;.yaml&#39;, &#39;.yml&#39;]; |
| DOC_READ_CAP | const | 112 | no | const DOC_READ_CAP = 600_000; |
| ANNOTATION_SCAN_CAP | const | 113 | no | const ANNOTATION_SCAN_CAP = 5_000; |
| BIND_CAP | const | 114 | no | const BIND_CAP = 60; |
| SECRET_BASENAMES | const | 116 | no | const SECRET_BASENAMES = new Set([&#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, &#39;login data&#39;]); |
| ARCHIVE_SEGMENTS | const | 118 | no | const ARCHIVE_SEGMENTS = new Set([&#39;archive&#39;, &#39;archived&#39;, &#39;history&#39;, &#39;historical&#39;, &#39;donor&#39;]); |
| GENERATED_SEGMENTS | const | 119 | no | const GENERATED_SEGMENTS = new Set([&#39;wiki&#39;, &#39;generated&#39;]); |
| cmpStr | function | 121 | no | const cmpStr = (a, b) =&gt; (a === b ? 0 : a &lt; b ? -1 : 1); |
| asArray | function | 126 | no | function asArray(value) { |
| baseName | function | 130 | no | function baseName(value) { |
| path | const | 131 | no | const path = toPosix(String(value ?? &#39;&#39;)); |
| at | const | 132 | no | const at = path.lastIndexOf(&#39;/&#39;); |
| normalizePath | function | 136 | no | function normalizePath(value) { |
| path | variable | 137 | no | let path = toPosix(String(value ?? &#39;&#39;)).trim(); |
| isSecretPath | function | 145 | no | function isSecretPath(value) { |
| name | const | 146 | no | const name = baseName(value); |
| isDir | function | 153 | no | function isDir(path) { |
| isFile | function | 157 | no | function isFile(path) { |
| absOf | function | 161 | no | function absOf(root, path) { |
| base | const | 162 | no | const base = root ? resolve(String(root)) : process.cwd(); |
| readText | function | 167 | no | function readText(absPath, cap = DOC_READ_CAP) { |
| text | const | 169 | no | const text = readFileSync(absPath, &#39;utf8&#39;); |
| fileHash | function | 176 | no | function fileHash(absPath) { |
| statOf | function | 180 | no | function statOf(absPath) { |
| stripQuotes | function | 184 | no | function stripQuotes(value) { |
| s | const | 185 | no | const s = String(value ?? &#39;&#39;).trim(); |
| parseListValue | function | 192 | no | function parseListValue(value) { |
| raw | const | 193 | no | const raw = stripQuotes(value); |
| splitLines | function | 201 | no | function splitLines(text) { |
| cleanText | function | 205 | no | function cleanText(value, cap = 400) { |
| listFiles | function | 214 | no | function listFiles(absDir, exts) { |
| entries | variable | 215 | no | let entries; |
| explicitProjectDir | function | 226 | no | function explicitProjectDir(project, base) { |
| direct | const | 229 | no | const direct = isAbsolute(project) ? project : resolve(base, project); |
| abs | const | 235 | no | const abs = isAbsolute(String(candidate)) ? String(candidate) : resolve(String(project.root \|\| base), String(candidate)); |
| named | const | 239 | no | const named = resolve(base, String(project.name)); |
| projectNameOf | function | 245 | no | function projectNameOf(project, dir) { |
| posix | const | 250 | no | const posix = toPosix(dir); |
| at | const | 251 | no | const at = posix.lastIndexOf(&#39;/&#39;); |
| resolveDocDir | function | 255 | no | function resolveDocDir(root, project) { |
| base | const | 256 | no | const base = root ? resolve(String(root)) : process.cwd(); |
| findProjectId | function | 260 | no | function findProjectId(db, project) { |
| row | const | 263 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(project); |
| row | const | 270 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(String(project.name)); |
| ensureProjectRow | function | 276 | no | function ensureProjectRow(db, name, dir) { |
| byName | const | 277 | no | const byName = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(String(name)); |
| byPath | const | 279 | no | const byPath = db.prepare(&#39;SELECT id FROM projects WHERE path = ?&#39;).get(String(dir)); |
| info | const | 281 | no | const info = db.prepare( &#39;INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)&#39;, ).run(String(name), String(dir), &#39;dir&#39;, nowISO()); |
| projectContext | function | 287 | no | function projectContext(db, project) { |
| dir | variable | 288 | no | let dir = explicitProjectDir(project, process.cwd()); |
| name | variable | 289 | no | let name = projectNameOf(project, dir \|\| process.cwd()); |
| id | variable | 290 | no | let id = findProjectId(db, project); |
| row | const | 292 | no | const row = db.prepare(&#39;SELECT name, path FROM projects WHERE id = ?&#39;).get(id); |
| registryCache | const | 306 | no | const registryCache = new Map(); |
| registryPathFor | function | 308 | no | function registryPathFor(dir) { |
| current | variable | 309 | no | let current = resolve(String(dir \|\| process.cwd())); |
| candidate | const | 311 | no | const candidate = join(current, &#39;hq&#39;, &#39;registry&#39;, &#39;agentic-file-registry.v1.json&#39;); |
| parent | const | 313 | no | const parent = resolve(current, &#39;..&#39;); |
| cwdCandidate | const | 317 | no | const cwdCandidate = join(resolve(process.cwd()), &#39;hq&#39;, &#39;registry&#39;, &#39;agentic-file-registry.v1.json&#39;); |
| registryFor | function | 321 | no | function registryFor(dir) { |
| path | const | 322 | no | const path = registryPathFor(dir); |
| registry | variable | 325 | no | let registry = null; |
| root | const | 326 | no | const root = resolve(path, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| fallbackFamily | function | 338 | no | function fallbackFamily(relPath) { |
| path | const | 339 | no | const path = normalizePath(relPath).toLowerCase(); |
| name | const | 340 | no | const name = baseName(path); |
| re | variable | 352 | no | let re; |
| classifyDocument | function | 360 | no | function classifyDocument(registry, relPath) { |
| cls | const | 361 | no | const cls = registry ? classifyPath(registry, relPath) : null; |
| mapped | const | 362 | no | const mapped = Boolean(cls &amp;&amp; cls.mapped === true &amp;&amp; cls.family &amp;&amp; cls.family !== &#39;00&#39;); |
| family | const | 363 | no | const family = mapped ? cls.family : fallbackFamily(relPath); |
| meta | const | 364 | no | const meta = DOCUMENT_FAMILIES[family] \|\| null; |
| authority | const | 365 | no | const authority = mapped &amp;&amp; cls.authority ? String(cls.authority) : &#39;project_observed&#39;; |
| lifecycleFor | function | 377 | no | function lifecycleFor(relPath) { |
| path | const | 378 | no | const path = normalizePath(relPath).toLowerCase(); |
| segments | const | 379 | no | const segments = path.split(&#39;/&#39;); |
| name | const | 380 | no | const name = segments[segments.length - 1] \|\| &#39;&#39;; |
| originTypeFor | function | 388 | no | function originTypeFor(lifecycle) { |
| parseFrontmatter | function | 399 | no | function parseFrontmatter(text) { |
| lines | const | 400 | no | const lines = splitLines(text); |
| meta | const | 401 | no | const meta = {}; |
| line | const | 409 | no | const line = lines[i]; |
| key | const | 413 | no | const key = match[1].toLowerCase(); |
| value | const | 414 | no | const value = match[2].trim(); |
| items | const | 416 | no | const items = []; |
| j | variable | 417 | no | let j = i + 1; |
| item | const | 419 | no | const item = /^\\s*-\\s+(.*)$/.exec(lines[j]); |
| parseYamlMapping | function | 434 | no | function parseYamlMapping(text) { |
| meta | const | 435 | no | const meta = {}; |
| lines | const | 436 | no | const lines = splitLines(text); |
| line | const | 438 | no | const line = lines[i]; |
| key | const | 442 | no | const key = match[1].toLowerCase(); |
| value | const | 443 | no | const value = match[2].trim(); |
| items | const | 445 | no | const items = []; |
| j | variable | 446 | no | let j = i + 1; |
| item | const | 448 | no | const item = /^\\s*-\\s+(.*)$/.exec(lines[j]); |
| parts | const | 458 | no | const parts = []; |
| j | variable | 459 | no | let j = i + 1; |
| titleOf | function | 470 | no | function titleOf(text, relPath) { |
| lines | const | 473 | no | const lines = splitLines(text); |
| start | const | 474 | no | const start = endLine &gt;= 0 ? endLine + 1 : 0; |
| ownerOf | function | 482 | no | function ownerOf(text) { |
| value | const | 487 | no | const value = cleanText(match[1] \|\| match[2] \|\| &#39;&#39;, 120); |
| SEE_LINE_RE | const | 493 | no | const SEE_LINE_RE = /@hq:see\\s+(?!(?:doc\|decision\|canon):)([\\w./-]+\\.[A-Za-z0-9]+)(?::(\\d+)(?:-(\\d+))?)?/i; |
| INLINE_REF_RE | const | 494 | no | const INLINE_REF_RE = /(?:^\|[\\s(`&#39;&quot;[])((?:[\\w.-]+\\/)+[\\w.-]+\\.[A-Za-z0-9]+)(?::(\\d+)(?:-(\\d+))?)?/gm; // A real annotation is a single `@hq:` tag inside a comment (or alone on a // line). Protocol li… |
| TAG_PREFIX_RE | const | 499 | no | const TAG_PREFIX_RE = /^\\s*(?:(?:\\/\\/+\|#+\|\\/\\*+\|\\*+\|&lt;!--\|--+\|;+\|%+)\\s*)?$/; |
| TAG_ANY_RE | const | 500 | no | const TAG_ANY_RE = /@hq:[a-z]+/gi; |
| TAG_TARGET_RE | const | 501 | no | const TAG_TARGET_RE = /@hq:(see\|why\|invariant\|feature)\\b/i; |
| tagLines | function | 503 | no | function tagLines(text) { |
| lines | const | 504 | no | const lines = splitLines(text); |
| out | const | 505 | no | const out = []; |
| fenced | variable | 506 | no | let fenced = false; |
| line | const | 508 | no | const line = lines[i]; |
| singleTag | function | 516 | no | function singleTag(line) { |
| tags | const | 517 | no | const tags = [...line.matchAll(TAG_ANY_RE)]; |
| target | const | 519 | no | const target = TAG_TARGET_RE.exec(line); |
| addBind | function | 525 | no | function addBind(map, dir, ownPath, rawPath, start, end) { |
| rel | const | 526 | no | const rel = normalizePath(rawPath); |
| abs | const | 529 | no | const abs = join(dir, rel); |
| lineStart | const | 531 | no | const lineStart = Number(start) &gt; 0 ? Number(start) : 1; |
| lineEnd | const | 532 | no | const lineEnd = Number(end) &gt; 0 ? Math.max(Number(end), lineStart) : lineStart; |
| key | const | 533 | no | const key = `${rel}\\0${lineStart}\\0${lineEnd}`; |
| bindsTo | function | 538 | no | function bindsTo(dir, relPath, text) { |
| found | const | 539 | no | const found = new Map(); |
| rootDocPaths | function | 557 | no | function rootDocPaths(dir) { |
| out | const | 558 | no | const out = []; |
| names | const | 559 | no | const names = [ |
| absDir | const | 567 | no | const absDir = join(dir, dirName); |
| discoveredDocPaths | function | 573 | no | function discoveredDocPaths(dir, entries = null) { |
| list | const | 574 | no | const list = entries \|\| discoveryFor(dir); |
| out | const | 575 | no | const out = []; |
| rel | const | 577 | no | const rel = toPosix(entry.rel); |
| lower | const | 578 | no | const lower = rel.toLowerCase(); |
| discoveryFor | function | 584 | no | function discoveryFor(dir) { |
| scanDocPaths | function | 588 | no | function scanDocPaths(dir, entries = null) { |
| seen | const | 589 | no | const seen = new Set(); |
| out | const | 590 | no | const out = []; |
| path | const | 592 | no | const path = normalizePath(rel); |
| buildDocument | function | 600 | no | function buildDocument(dir, relPath, registry) { |
| abs | const | 601 | no | const abs = join(dir, relPath); |
| text | const | 602 | no | const text = readText(abs); |
| cls | const | 604 | no | const cls = classifyDocument(registry, relPath); |
| lifecycle | const | 605 | no | const lifecycle = lifecycleFor(relPath); |
| authority | const | 606 | no | const authority = lifecycle === &#39;historical&#39; ? &#39;historical&#39; : cls.authority; |
| scanDocuments | function | 624 | yes | export function scanDocuments(root = process.cwd(), project = null) { |
| dir | const | 625 | no | const dir = resolveDocDir(root, project); |
| registry | const | 626 | no | const registry = registryFor(dir); |
| entries | const | 627 | no | const entries = discoveryFor(dir); |
| out | const | 628 | no | const out = []; |
| doc | const | 630 | no | const doc = buildDocument(dir, rel, registry); |
| DOCUMENT_UPSERT | const | 639 | no | const DOCUMENT_UPSERT = ` |
| documentComparable | function | 659 | no | function documentComparable(row) { |
| indexDocuments | function | 666 | yes | export function indexDocuments(db, project) { |
| documents | const | 668 | no | const documents = scanDocuments(dir, null); |
| priorRows | const | 671 | no | const priorRows = db.prepare(&#39;SELECT * FROM documents WHERE project_id = ?&#39;).all(projectId); |
| prior | const | 672 | no | const prior = new Map(priorRows.map((row) =&gt; [row.path, row])); |
| upsert | const | 673 | no | const upsert = db.prepare(DOCUMENT_UPSERT); |
| now | const | 674 | no | const now = nowISO(); |
| seen | const | 675 | no | const seen = new Set(); |
| added | variable | 676 | no | let added = 0; |
| changed | variable | 677 | no | let changed = 0; |
| binds | const | 681 | no | const binds = JSON.stringify(doc.binds_to); |
| existing | const | 682 | no | const existing = prior.get(doc.path); |
| candidate | const | 683 | no | const candidate = { |
| same | const | 704 | no | const same = documentComparable(existing) === documentComparable(candidate); |
| removed | variable | 714 | no | let removed = 0; |
| del | const | 715 | no | const del = db.prepare(&#39;DELETE FROM documents WHERE project_id = ? AND path = ?&#39;); |
| documentStatusOf | function | 729 | no | function documentStatusOf(raw) { |
| value | const | 730 | no | const value = String(raw ?? &#39;&#39;).trim().toLowerCase().replace(/[._-]+/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;); |
| termStatusOf | function | 747 | no | function termStatusOf(raw) { |
| value | const | 748 | no | const value = String(raw ?? &#39;&#39;).trim().toLowerCase(); |
| normalizeAuthorityValue | function | 759 | no | function normalizeAuthorityValue(raw, fallback = &#39;architecture&#39;) { |
| value | const | 760 | no | const value = String(raw ?? &#39;&#39;).trim().toLowerCase().replace(/[-\\s]+/g, &#39;_&#39;); |
| parseDate | function | 769 | no | function parseDate(raw) { |
| value | const | 770 | no | const value = String(raw ?? &#39;&#39;).trim(); |
| iso | const | 772 | no | const iso = /(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})/.exec(value); |
| month | const | 774 | no | const month = iso[2].padStart(2, &#39;0&#39;); |
| day | const | 775 | no | const day = iso[3].padStart(2, &#39;0&#39;); |
| yearMonth | const | 778 | no | const yearMonth = /^(\\d{4})[-/](\\d{1,2})$/.exec(value); |
| dateFromPath | function | 783 | no | function dateFromPath(relPath) { |
| name | const | 784 | no | const name = baseName(relPath); |
| decisionId | function | 789 | no | function decisionId(project, title, sourcePath) { |
| termId | function | 793 | no | function termId(project, term, sourcePath) { |
| isDecisionPath | function | 800 | no | function isDecisionPath(relPath) { |
| path | const | 801 | no | const path = normalizePath(relPath).toLowerCase(); |
| isCanonPath | function | 806 | no | function isCanonPath(relPath) { |
| path | const | 807 | no | const path = normalizePath(relPath).toLowerCase(); |
| isAdrPath | function | 812 | no | function isAdrPath(relPath) { |
| path | const | 813 | no | const path = normalizePath(relPath).toLowerCase(); |
| isYamlPath | function | 817 | no | function isYamlPath(relPath) { |
| name | const | 818 | no | const name = baseName(relPath); |
| evidenceEntry | function | 822 | no | function evidenceEntry(relPath, hash, extra = {}) { |
| entry | const | 823 | no | const entry = { ref: relPath, sha256: hash ?? null }; |
| makeDecision | function | 830 | no | function makeDecision({ project, sourcePath, title, statusInfo, authority, date, rationale, consequences, alternatives, supersedes = null, evidence, hash, line = 0, }) { |
| cleanTitle | const | 834 | no | const cleanTitle = cleanText(title, 300); |
| decisionHash | function | 857 | no | function decisionHash(parts) { |
| SECTION_SKIP | const | 861 | no | const SECTION_SKIP = new Set([ &#39;status&#39;, &#39;context&#39;, &#39;context and problem statement&#39;, &#39;decision&#39;, &#39;decision outcome&#39;, &#39;considered options&#39;, &#39;considered options and tradeoffs&#39;, &#39;consequences&#39;, &#39;decisio… |
| FIELD_ALIASES | const | 870 | no | const FIELD_ALIASES = { |
| fieldKey | function | 881 | no | function fieldKey(label) { |
| value | const | 882 | no | const value = String(label ?? &#39;&#39;).trim().toLowerCase().replace(/[.*_`]/g, &#39;&#39;).replace(/\\s+/g, &#39; &#39;); |
| collectSections | function | 889 | no | function collectSections(lines) { |
| sections | const | 890 | no | const sections = new Map(); |
| heads | const | 891 | no | const heads = []; |
| head | const | 898 | no | const head = heads[i]; |
| next | const | 899 | no | const next = heads[i + 1]; |
| body | const | 900 | no | const body = lines.slice(head.index + 1, next ? next.index : lines.length).join(&#39;\\n&#39;).trim(); |
| key | const | 901 | no | const key = head.text.toLowerCase(); |
| firstNonEmptyLine | function | 907 | no | function firstNonEmptyLine(text) { |
| trimmed | const | 909 | no | const trimmed = cleanText(line, 200); |
| firstHeadingText | function | 915 | no | function firstHeadingText(lines) { |
| sectionValue | function | 923 | no | function sectionValue(sections, ...names) { |
| entry | const | 925 | no | const entry = sections.get(name); |
| value | const | 927 | no | const value = firstNonEmptyLine(entry.text); |
| madrDecision | function | 934 | no | function madrDecision({ project, relPath, lines, meta, hash }) { |
| sections | const | 935 | no | const sections = collectSections(lines); |
| statusSection | const | 936 | no | const statusSection = sectionValue(sections, &#39;status&#39;); |
| outcome | const | 937 | no | const outcome = sectionValue(sections, &#39;decision outcome&#39;, &#39;decision&#39;); |
| context | const | 938 | no | const context = sectionValue(sections, &#39;context&#39;, &#39;context and problem statement&#39;, &#39;background&#39;); |
| consequences | const | 939 | no | const consequences = sectionValue(sections, &#39;consequences&#39;, &#39;impact&#39;); |
| alternatives | const | 940 | no | const alternatives = sectionValue(sections, &#39;considered options&#39;, &#39;considered options and tradeoffs&#39;, &#39;options&#39;); |
| statusInfo | const | 943 | no | const statusInfo = documentStatusOf(statusSection?.value \|\| meta.status \|\| &#39;proposed&#39;); |
| title | const | 944 | no | const title = (meta.title ? cleanText(meta.title, 200) : &#39;&#39;) |
| yadrDecision | function | 964 | no | function yadrDecision({ project, relPath, lines, meta, hash }) { |
| statusInfo | const | 965 | no | const statusInfo = documentStatusOf(meta.status \|\| meta.state \|\| &#39;proposed&#39;); |
| title | const | 966 | no | const title = (meta.title ? cleanText(meta.title, 200) : &#39;&#39;) |
| rationale | const | 969 | no | const rationale = [meta.context, meta.decision].filter(Boolean).map((part) =&gt; String(part).trim()).join(&#39;\\n\\n&#39;); |
| splitRow | function | 987 | no | function splitRow(line) { |
| value | variable | 988 | no | let value = String(line).trim(); |
| parseTables | function | 994 | no | function parseTables(lines) { |
| tables | const | 995 | no | const tables = []; |
| separator | const | 998 | no | const separator = lines[i + 1]; |
| headerCells | const | 1000 | no | const headerCells = splitRow(lines[i]); |
| rows | const | 1001 | no | const rows = []; |
| j | variable | 1002 | no | let j = i + 2; |
| DECISION_COLUMNS | const | 1013 | no | const DECISION_COLUMNS = { |
| CANON_COLUMNS | const | 1025 | no | const CANON_COLUMNS = { |
| mapColumns | function | 1036 | no | function mapColumns(headerCells, mapping) { |
| keys | const | 1037 | no | const keys = headerCells.map((cell) =&gt; String(cell).trim().toLowerCase().replace(/[*_`]/g, &#39;&#39;)); |
| out | const | 1038 | no | const out = {}; |
| tableKind | function | 1048 | no | function tableKind(headerCells) { |
| keys | const | 1049 | no | const keys = headerCells.map((cell) =&gt; String(cell).trim().toLowerCase().replace(/[*_`]/g, &#39;&#39;)); |
| tableDecisions | function | 1055 | no | function tableDecisions({ project, relPath, lines, hash }) { |
| out | const | 1056 | no | const out = []; |
| cols | const | 1059 | no | const cols = mapColumns(table.headerCells, DECISION_COLUMNS); |
| title | const | 1062 | no | const title = cleanText(row.cells[cols.title], 300); |
| statusInfo | const | 1064 | no | const statusInfo = documentStatusOf(cols.status != null ? row.cells[cols.status] : &#39;proposed&#39;); |
| date | const | 1065 | no | const date = parseDate(cols.date != null ? row.cells[cols.date] : &#39;&#39;) \|\| dateFromPath(relPath); |
| rationale | const | 1066 | no | const rationale = cols.rationale != null ? row.cells[cols.rationale] : &#39;&#39;; |
| consequences | const | 1067 | no | const consequences = cols.consequences != null ? row.cells[cols.consequences] : &#39;&#39;; |
| alternatives | const | 1068 | no | const alternatives = cols.alternatives != null ? row.cells[cols.alternatives] : &#39;&#39;; |
| rowText | const | 1069 | no | const rowText = row.cells.join(&#39; \| &#39;); |
| headingDecisions | function | 1090 | no | function headingDecisions({ project, relPath, lines, hash }) { |
| out | const | 1091 | no | const out = []; |
| heads | const | 1092 | no | const heads = []; |
| head | const | 1098 | no | const head = heads[h]; |
| lower | const | 1099 | no | const lower = head.text.toLowerCase(); |
| idLike | const | 1101 | no | const idLike = /^(?:(?:DEC\|ADR\|DR)[-_ ]?\\d+\|D-\\d+)\\b/i.test(head.text); |
| decisionWord | const | 1102 | no | const decisionWord = /\\bdecision\\b/i.test(lower); |
| body | const | 1106 | no | const body = lines.slice(head.index + 1, end ? end.index : lines.length); |
| fields | const | 1107 | no | const fields = {}; |
| key | const | 1111 | no | const key = fieldKey(match[1]); |
| statusInfo | const | 1117 | no | const statusInfo = documentStatusOf(fields.status?.value \|\| &#39;proposed&#39;); |
| date | const | 1118 | no | const date = parseDate(fields.date?.value) \|\| dateFromPath(relPath); |
| title | const | 1119 | no | const title = head.text; |
| parseDecisionDocument | function | 1139 | no | function parseDecisionDocument({ project, relPath, text, hash }) { |
| lines | const | 1140 | no | const lines = splitLines(text); |
| isYaml | const | 1141 | no | const isYaml = isYamlPath(relPath); |
| meta | variable | 1142 | no | let meta = {}; |
| bodyLines | variable | 1143 | no | let bodyLines = lines; |
| frontmatter | const | 1147 | no | const frontmatter = parseFrontmatter(text); |
| hasMadrSections | const | 1152 | no | const hasMadrSections = /^\\s{0,3}#{2,4}\\s+(status\|context\|decision outcome\|considered options\|consequences)\\b/im.test(text); |
| madr | const | 1154 | no | const madr = madrDecision({ project, relPath, lines: bodyLines, meta, hash }); |
| decision | const | 1158 | no | const decision = yadrDecision({ project, relPath, lines, meta, hash }); |
| madr | const | 1162 | no | const madr = madrDecision({ project, relPath, lines: bodyLines, meta, hash }); |
| WHY_RE | const | 1171 | no | const WHY_RE = /@hq:why\\b(?:\\s*\\(([^)]*)\\))?\\s*:?\\s*(.*)$/i; |
| annotationDecisions | function | 1173 | no | function annotationDecisions({ project, relPath, text, hash }) { |
| out | const | 1174 | no | const out = []; |
| value | const | 1179 | no | const value = cleanText(match[2] \|\| match[1] \|\| &#39;&#39;, 300); |
| statusInfo | const | 1181 | no | const statusInfo = { status: &#39;observed&#39;, claimed: null }; |
| projectSourceFiles | function | 1200 | no | function projectSourceFiles(dir, entries = null) { |
| list | const | 1201 | no | const list = entries \|\| discoveryFor(dir); |
| dedupeDecisions | function | 1209 | no | function dedupeDecisions(list) { |
| byId | const | 1210 | no | const byId = new Map(); |
| prior | const | 1213 | no | const prior = byId.get(decision.id); |
| score | function | 1216 | no | const score = (d) =&gt; (d.rationale ? 2 : 0) + (d.consequences ? 1 : 0) + (d.alternatives ? 1 : 0); |
| extractDecisionsAt | function | 1224 | no | function extractDecisionsAt(dir, project) { |
| entries | const | 1225 | no | const entries = discoveryFor(dir); |
| decisions | const | 1226 | no | const decisions = []; |
| text | const | 1229 | no | const text = readText(join(dir, relPath)); |
| text | const | 1234 | no | const text = readText(join(dir, relPath)); |
| extractDecisions | function | 1242 | yes | export function extractDecisions({ root = process.cwd(), project = null } = {}) { |
| dir | const | 1243 | no | const dir = resolveDocDir(root, project); |
| DECISION_UPSERT | const | 1250 | no | const DECISION_UPSERT = ` |
| DECISION_COMPARE | const | 1274 | no | const DECISION_COMPARE = [ |
| sameRow | function | 1280 | no | function sameRow(prior, next, fields) { |
| decisionParams | function | 1284 | no | function decisionParams(projectId, decision, prior, now) { |
| status | variable | 1285 | no | let status = decision.status; |
| authority | variable | 1286 | no | let authority = decision.authority; |
| validTo | variable | 1287 | no | let validTo = decision.valid_to ?? null; |
| supersedes | variable | 1290 | no | let supersedes = decision.supersedes ?? prior?.supersedes ?? null; |
| indexDecisions | function | 1320 | yes | export function indexDecisions(db, project) { |
| decisions | const | 1322 | no | const decisions = extractDecisionsAt(dir, name); |
| priorRows | const | 1325 | no | const priorRows = db.prepare(&#39;SELECT * FROM decisions WHERE project_id = ?&#39;).all(projectId); |
| prior | const | 1326 | no | const prior = new Map(priorRows.map((row) =&gt; [row.id, row])); |
| upsert | const | 1327 | no | const upsert = db.prepare(DECISION_UPSERT); |
| now | const | 1328 | no | const now = nowISO(); |
| seen | const | 1329 | no | const seen = new Set(); |
| added | variable | 1330 | no | let added = 0; |
| changed | variable | 1331 | no | let changed = 0; |
| existing | const | 1335 | no | const existing = prior.get(decision.id) \|\| null; |
| params | const | 1336 | no | const params = decisionParams(projectId, decision, existing, now); |
| removed | variable | 1359 | no | let removed = 0; |
| del | const | 1360 | no | const del = db.prepare(&#39;DELETE FROM decisions WHERE project_id = ? AND id = ?&#39;); |
| makeTerm | function | 1374 | no | function makeTerm({ project, sourcePath, term, definition, statusInfo, owner = null, authority = &#39;architecture&#39;, aliases = [], contrasts = [], lifecycle = &#39;current&#39;, evidence, hash, validFrom = null,… |
| cleanTerm | const | 1379 | no | const cleanTerm = cleanText(term, 120).replace(/[.:;,]+$/, &#39;&#39;).trim(); |
| cleanDefinition | const | 1381 | no | const cleanDefinition = cleanText(definition, 600); |
| contrastList | const | 1382 | no | const contrastList = [...new Set(asArray(contrasts).map((value) =&gt; cleanText(value, 300)).filter(Boolean))].sort(cmpStr); |
| aliasList | const | 1383 | no | const aliasList = [...new Set(asArray(aliases).map((value) =&gt; cleanText(value, 80)).filter(Boolean))].sort(cmpStr); |
| splitContrasts | function | 1405 | no | function splitContrasts(definition) { |
| contrasts | const | 1406 | no | const contrasts = []; |
| value | const | 1407 | no | const value = String(definition ?? &#39;&#39;); |
| cleaned | const | 1410 | no | const cleaned = cleanText(part, 300); |
| notMatch | const | 1414 | no | const notMatch = /\\b([A-Za-z][\\w -]{1,60})\\s+(?:is\|are)\\s+(?:not\|never)\\s+([\\w -]{1,60})/i.exec(value); |
| tableTerms | function | 1419 | no | function tableTerms({ project, relPath, lines, hash }) { |
| out | const | 1420 | no | const out = []; |
| cols | const | 1423 | no | const cols = mapColumns(table.headerCells, CANON_COLUMNS); |
| term | const | 1426 | no | const term = cleanText(row.cells[cols.term], 120); |
| definition | const | 1428 | no | const definition = cols.definition != null ? row.cells[cols.definition] : &#39;&#39;; |
| statusInfo | const | 1429 | no | const statusInfo = termStatusOf(cols.status != null ? row.cells[cols.status] : &#39;provisional&#39;); |
| boundary | const | 1430 | no | const boundary = cols.contrasts != null ? row.cells[cols.contrasts] : &#39;&#39;; |
| contrasts | const | 1431 | no | const contrasts = [...splitContrasts(definition), ...splitContrasts(boundary)]; |
| aliases | const | 1433 | no | const aliases = cols.aliases != null ? parseListValue(row.cells[cols.aliases]) : []; |
| rowText | const | 1434 | no | const rowText = row.cells.join(&#39; \| &#39;); |
| BOLD_BULLET_RE | const | 1456 | no | const BOLD_BULLET_RE = /^\\s*[-*]\\s+\\*\\*(.+?)\\*\\*\\s*(?:[—–:-]\\s*)(.+)$/; |
| PLAIN_BULLET_RE | const | 1457 | no | const PLAIN_BULLET_RE = /^\\s*[-*]\\s+([A-Z][\\w .&#39;’/-]{1,60}?)\\s+[—–]\\s+(.+)$/; |
| DEFINITION_LINE_RE | const | 1458 | no | const DEFINITION_LINE_RE = /^\\s*:\\s+(.+)$/; |
| bulletTerms | function | 1460 | no | function bulletTerms({ project, relPath, lines, hash }) { |
| out | const | 1461 | no | const out = []; |
| line | const | 1463 | no | const line = lines[i]; |
| term | variable | 1464 | no | let term = null; |
| definition | variable | 1465 | no | let definition = null; |
| bold | const | 1466 | no | const bold = BOLD_BULLET_RE.exec(line); |
| plain | const | 1471 | no | const plain = PLAIN_BULLET_RE.exec(line); |
| next | const | 1476 | no | const next = DEFINITION_LINE_RE.exec(lines[i + 1]); |
| statusInfo | const | 1484 | no | const statusInfo = termStatusOf(&#39;provisional&#39;); |
| INVARIANT_RE | const | 1501 | no | const INVARIANT_RE = /@hq:invariant\\b(?:\\s*\\(([^)]*)\\))?\\s*:?\\s*(.*)$/i; |
| annotationTerms | function | 1503 | no | function annotationTerms({ project, relPath, text, hash }) { |
| out | const | 1504 | no | const out = []; |
| value | const | 1509 | no | const value = cleanText(match[2] \|\| match[1] \|\| &#39;&#39;, 300); |
| split | const | 1511 | no | const split = /^(.+?)\\s+(?:≠\|is not\|is never)\\s+(.+)$/i.exec(value); |
| term | const | 1512 | no | const term = split ? split[1] : value; |
| contrasts | const | 1513 | no | const contrasts = split ? [value] : []; |
| dedupeTerms | function | 1531 | no | function dedupeTerms(list) { |
| byKey | const | 1532 | no | const byKey = new Map(); |
| key | const | 1535 | no | const key = `${term.id}`; |
| prior | const | 1536 | no | const prior = byKey.get(key); |
| score | function | 1538 | no | const score = (t) =&gt; (t.definition ? 2 : 0) + (t.contrasts.length ? 1 : 0); |
| extractCanonTermsAt | function | 1546 | no | function extractCanonTermsAt(dir, project) { |
| entries | const | 1547 | no | const entries = discoveryFor(dir); |
| terms | const | 1548 | no | const terms = []; |
| text | const | 1551 | no | const text = readText(join(dir, relPath)); |
| hash | const | 1553 | no | const hash = sha256(text); |
| lines | const | 1554 | no | const lines = splitLines(text); |
| text | const | 1560 | no | const text = readText(join(dir, relPath)); |
| extractCanonTerms | function | 1568 | yes | export function extractCanonTerms({ root = process.cwd(), project = null } = {}) { |
| dir | const | 1569 | no | const dir = resolveDocDir(root, project); |
| TERM_UPSERT | const | 1576 | no | const TERM_UPSERT = ` |
| TERM_COMPARE | const | 1600 | no | const TERM_COMPARE = [ |
| termParams | function | 1605 | no | function termParams(projectId, term, prior, now) { |
| status | variable | 1606 | no | let status = term.status; |
| authority | variable | 1607 | no | let authority = term.authority; |
| lifecycle | variable | 1608 | no | let lifecycle = term.lifecycle; |
| validTo | variable | 1609 | no | let validTo = term.valid_to ?? null; |
| indexCanonTerms | function | 1639 | yes | export function indexCanonTerms(db, project) { |
| terms | const | 1641 | no | const terms = extractCanonTermsAt(dir, name); |
| priorRows | const | 1644 | no | const priorRows = db.prepare(&#39;SELECT * FROM canon_terms WHERE project_id = ?&#39;).all(projectId); |
| prior | const | 1645 | no | const prior = new Map(priorRows.map((row) =&gt; [row.id, row])); |
| upsert | const | 1646 | no | const upsert = db.prepare(TERM_UPSERT); |
| now | const | 1647 | no | const now = nowISO(); |
| seen | const | 1648 | no | const seen = new Set(); |
| added | variable | 1649 | no | let added = 0; |
| changed | variable | 1650 | no | let changed = 0; |
| existing | const | 1654 | no | const existing = prior.get(term.id) \|\| null; |
| params | const | 1655 | no | const params = termParams(projectId, term, existing, now); |
| removed | variable | 1678 | no | let removed = 0; |
| del | const | 1679 | no | const del = db.prepare(&#39;DELETE FROM canon_terms WHERE project_id = ? AND id = ?&#39;); |
| decisionRow | function | 1693 | no | function decisionRow(row) { |
| termRow | function | 1716 | no | function termRow(row) { |
| boundedLimit | function | 1739 | no | function boundedLimit(value, fallback = 50) { |
| requested | const | 1740 | no | const requested = Number(value); |
| queryClause | function | 1745 | no | function queryClause(columns, query) { |
| text | const | 1747 | no | const text = String(query); |
| parts | const | 1748 | no | const parts = columns.map((column) =&gt; `instr(lower(COALESCE(${column}, &#39;&#39;)), lower(?)) &gt; 0`); |
| decisionRegister | function | 1752 | yes | export function decisionRegister(db, { project = null, status = null, query = null, limit = 50 } = {}) { |
| params | const | 1754 | no | const params = []; |
| clause | const | 1757 | no | const clause = queryClause([&#39;d.title&#39;, &#39;d.rationale&#39;, &#39;d.consequences&#39;, &#39;d.alternatives&#39;, &#39;d.source_path&#39;], query); |
| rows | const | 1759 | no | const rows = db.prepare( `SELECT d.*, p.name AS project FROM decisions d JOIN projects p ON p.id = d.project_id ${where.length ? `WHERE ${where.join(&#39; AND &#39;)}` : &#39;&#39;} |
| canonRegister | function | 1770 | yes | export function canonRegister(db, { project = null, status = null, query = null, limit = 50 } = {}) { |
| params | const | 1772 | no | const params = []; |
| clause | const | 1775 | no | const clause = queryClause([&#39;c.term&#39;, &#39;c.definition&#39;, &#39;c.aliases&#39;, &#39;c.contrasts&#39;, &#39;c.source_path&#39;], query); |
| rows | const | 1777 | no | const rows = db.prepare( `SELECT c.*, p.name AS project FROM canon_terms c JOIN projects p ON p.id = c.project_id ${where.length ? `WHERE ${where.join(&#39; AND &#39;)}` : &#39;&#39;} |
| requireOwner | function | 1791 | no | function requireOwner(ownerConfirmed) { |
| loadDecision | function | 1797 | no | function loadDecision(db, id) { |
| row | const | 1798 | no | const row = db.prepare( &#39;SELECT d.*, p.name AS project FROM decisions d JOIN projects p ON p.id = d.project_id WHERE d.id = ?&#39;, ).get(String(id)); |
| loadTerm | function | 1804 | no | function loadTerm(db, id) { |
| row | const | 1805 | no | const row = db.prepare( &#39;SELECT c.*, p.name AS project FROM canon_terms c JOIN projects p ON p.id = c.project_id WHERE c.id = ?&#39;, ).get(String(id)); |
| confirmDecision | function | 1811 | yes | export function confirmDecision(db, { id, ownerConfirmed = false } = {}) { |
| decision | const | 1813 | no | const decision = loadDecision(db, id); |
| supersedeDecision | function | 1820 | yes | export function supersedeDecision(db, { id, by, ownerConfirmed = false } = {}) { |
| old | const | 1822 | no | const old = loadDecision(db, id); |
| next | const | 1824 | no | const next = loadDecision(db, by); |
| validTo | const | 1828 | no | const validTo = next.valid_from \|\| next.date \|\| nowISO().slice(0, 10); |
| at | const | 1829 | no | const at = nowISO(); |
| confirmTerm | function | 1841 | yes | export function confirmTerm(db, { id, ownerConfirmed = false } = {}) { |
| term | const | 1843 | no | const term = loadTerm(db, id); |
| deprecateTerm | function | 1850 | yes | export function deprecateTerm(db, { id, ownerConfirmed = false } = {}) { |
| term | const | 1852 | no | const term = loadTerm(db, id); |
| validTo | const | 1854 | no | const validTo = term.valid_to \|\| nowISO().slice(0, 10); |
| selectedProjects | function | 1863 | no | function selectedProjects(db, root, projects) { |
| rows | const | 1864 | no | const rows = db.prepare(&#39;SELECT id, name, path FROM projects ORDER BY name ASC, id ASC&#39;).all(); |
| byName | const | 1865 | no | const byName = new Map(); |
| name | const | 1871 | no | const name = typeof entry === &#39;string&#39; ? entry : entry?.name; |
| abs | const | 1873 | no | const abs = typeof entry === &#39;object&#39; &amp;&amp; entry |
| current | const | 1876 | no | const current = byName.get(name); |
| wanted | const | 1880 | no | const wanted = new Set(projects.map((entry) =&gt; (typeof entry === &#39;string&#39; ? entry : entry?.name)).filter(Boolean)); |
| healthDocs | function | 1886 | no | function healthDocs(db, names) { |
| rows | const | 1887 | no | const rows = db.prepare( `SELECT d.*, p.name AS project FROM documents d JOIN projects p ON p.id = d.project_id ORDER BY p.name ASC, d.path ASC`, |
| healthDecisions | function | 1896 | no | function healthDecisions(db, names) { |
| rows | const | 1897 | no | const rows = db.prepare( `SELECT d.*, p.name AS project FROM decisions d JOIN projects p ON p.id = d.project_id ORDER BY p.name ASC, d.id ASC`, |
| healthTerms | function | 1906 | no | function healthTerms(db, names) { |
| rows | const | 1907 | no | const rows = db.prepare( `SELECT c.*, p.name AS project FROM canon_terms c JOIN projects p ON p.id = c.project_id ORDER BY p.name ASC, c.id ASC`, |
| parseBinds | function | 1916 | no | function parseBinds(value) { |
| parsed | const | 1917 | no | const parsed = safeJsonParse(value, []); |
| documentHealth | function | 1922 | yes | export function documentHealth(db, { root = process.cwd(), projects = null } = {}) { |
| selected | const | 1923 | no | const selected = selectedProjects(db, root, projects); |
| names | const | 1924 | no | const names = new Set(selected.map((project) =&gt; project.name)); |
| dirs | const | 1925 | no | const dirs = new Map(selected.map((project) =&gt; [project.name, project.dir])); |
| docs | const | 1927 | no | const docs = healthDocs(db, names); |
| decisions | const | 1928 | no | const decisions = healthDecisions(db, names); |
| terms | const | 1929 | no | const terms = healthTerms(db, names); |
| byFamily | const | 1931 | no | const byFamily = {}; |
| code | const | 1935 | no | const code = String(doc.family ?? &#39;00&#39;); |
| missingFamilies | const | 1940 | no | const missingFamilies = FAMILY_CODES.filter((code) =&gt; (byFamily[code] \|\| 0) === 0); |
| referenced | const | 1942 | no | const referenced = new Set(); |
| rootDocs | const | 1948 | no | const rootDocs = new Set([&#39;agents.md&#39;, &#39;readme.md&#39;, &#39;claude.md&#39;, &#39;gemini.md&#39;]); |
| orphanDocs | const | 1949 | no | const orphanDocs = docs |
| staleDocs | const | 1955 | no | const staleDocs = []; |
| dir | const | 1957 | no | const dir = dirs.get(doc.project); |
| changed | const | 1959 | no | const changed = []; |
| abs | const | 1960 | no | const abs = join(dir, doc.path); |
| reason | variable | 1961 | no | let reason = &#39;reference_changed&#39;; |
| current | const | 1963 | no | const current = fileHash(abs); |
| target | const | 1970 | no | const target = join(dir, bind.path); |
| current | const | 1971 | no | const current = isFile(target) ? fileHash(target) : null; |
| expected | const | 1972 | no | const expected = bind.sha256 ?? null; |
| byTitleHash | const | 1983 | no | const byTitleHash = new Map(); |
| key | const | 1986 | no | const key = `${String(doc.title ?? &#39;&#39;).toLowerCase()}\\0${doc.hash}`; |
| duplicateDocs | const | 1990 | no | const duplicateDocs = [...byTitleHash.entries()] |
| staleDecisions | const | 1999 | no | const staleDecisions = []; |
| dir | const | 2001 | no | const dir = dirs.get(decision.project); |
| evidence | const | 2003 | no | const evidence = safeJsonParse(decision.evidence, []) \|\| []; |
| expected | const | 2004 | no | const expected = Array.isArray(evidence) ? evidence.find((item) =&gt; item &amp;&amp; item.sha256)?.sha256 : null; |
| abs | const | 2005 | no | const abs = join(dir, decision.source_path); |
| current | const | 2006 | no | const current = isFile(abs) ? fileHash(abs) : null; |
| staleTerms | const | 2016 | no | const staleTerms = []; |
| dir | const | 2018 | no | const dir = dirs.get(term.project); |
| evidence | const | 2020 | no | const evidence = safeJsonParse(term.evidence, []) \|\| []; |
| expected | const | 2021 | no | const expected = Array.isArray(evidence) ? evidence.find((item) =&gt; item &amp;&amp; item.sha256)?.sha256 : null; |
| abs | const | 2022 | no | const abs = join(dir, term.source_path); |
| current | const | 2023 | no | const current = isFile(abs) ? fileHash(abs) : null; |
| conflicts | const | 2033 | no | const conflicts = []; |
| termGroups | const | 2035 | no | const termGroups = new Map(); |
| key | const | 2037 | no | const key = String(term.term ?? &#39;&#39;).toLowerCase(); |
| sources | const | 2043 | no | const sources = [...new Set(group.map((term) =&gt; term.source_path).filter(Boolean))].sort(cmpStr); |
| acceptedGroups | const | 2064 | no | const acceptedGroups = new Map(); |
| key | const | 2075 | no | const key = String(decision.title ?? &#39;&#39;).trim().toLowerCase(); |
| readSourceFile | function | 2120 | no | function readSourceFile(root, relPath) { |
| normalizeWords | function | 2124 | no | function normalizeWords(text) { |
| wordSet | function | 2132 | no | function wordSet(text) { |
| hasStem | function | 2138 | no | function hasStem(words, stem) { |
| CAPABILITY_STEMS | const | 2146 | no | const CAPABILITY_STEMS = [&#39;capabilit&#39;, &#39;implement&#39;, &#39;featur&#39;]; |
| IMPL_EXTS | const | 2149 | no | const IMPL_EXTS = new Set([&#39;.mjs&#39;, &#39;.js&#39;, &#39;.ts&#39;, &#39;.mts&#39;, &#39;.cts&#39;, &#39;.rs&#39;, &#39;.py&#39;, &#39;.go&#39;, &#39;.java&#39;]); |
| PRODUCT_ROOTS | const | 2153 | no | const PRODUCT_ROOTS = [&#39;hq/&#39;, &#39;scripts/&#39;, &#39;vivim-core/&#39;, &#39;plugins/&#39;, &#39;kernel/&#39;, &#39;contracts/&#39;]; |
| extOf | function | 2155 | no | function extOf(relPath) { |
| name | const | 2156 | no | const name = baseName(relPath); |
| at | const | 2157 | no | const at = name.lastIndexOf(&#39;.&#39;); |
| isImplementationPath | function | 2161 | no | function isImplementationPath(relPath) { |
| isProductPath | function | 2165 | no | function isProductPath(relPath) { |
| path | const | 2166 | no | const path = normalizePath(relPath); |
| productSourceFiles | function | 2172 | no | function productSourceFiles(root) { |
| out | const | 2173 | no | const out = []; |
| base | const | 2175 | no | const base = join(root, prefix); |
| stack | const | 2176 | no | const stack = [base]; |
| dir | const | 2178 | no | const dir = stack.pop(); |
| entries | variable | 2179 | no | let entries; |
| abs | const | 2183 | no | const abs = join(dir, entry.name); |
| text | const | 2187 | no | const text = readText(abs); |
| ownTreeOf | function | 2198 | no | function ownTreeOf(relPath) { |
| path | const | 2199 | no | const path = normalizePath(relPath); |
| at | const | 2200 | no | const at = path.lastIndexOf(&#39;/&#39;); |
| implementationAnchors | function | 2206 | no | function implementationAnchors(doc) { |
| productAnchors | function | 2212 | no | function productAnchors(doc) { |
| statesCapability | function | 2218 | no | function statesCapability(doc, text) { |
| words | const | 2220 | no | const words = wordSet(`${doc.title \|\| &#39;&#39;} ${text}`); |
| extractDocumentedCapabilities | function | 2225 | no | function extractDocumentedCapabilities(root = process.cwd()) { |
| claims | const | 2226 | no | const claims = []; |
| docs | const | 2227 | no | const docs = scanDocuments(root, null); |
| docByPath | const | 2228 | no | const docByPath = new Map(docs.map((doc) =&gt; [normalizePath(doc.path), doc])); |
| text | const | 2230 | no | const text = readSourceFile(root, doc.path); |
| anchorsFor | function | 2244 | no | const anchorsFor = (sourcePath) =&gt; { |
| path | const | 2245 | no | const path = normalizePath(sourcePath \|\| &#39;&#39;); |
| doc | const | 2248 | no | const doc = docByPath.get(path); |
| terms | const | 2252 | no | const terms = extractCanonTerms({ root, project: null }); |
| words | const | 2254 | no | const words = wordSet(`${term.term} ${term.definition \|\| &#39;&#39;}`); |
| decisions | const | 2265 | no | const decisions = extractDecisions({ root, project: null }); |
| words | const | 2267 | no | const words = wordSet(`${decision.title} ${decision.rationale \|\| &#39;&#39;} ${decision.consequences \|\| &#39;&#39;}`); |
| documentedCapabilitiesWithoutImplementation | function | 2288 | yes | export function documentedCapabilitiesWithoutImplementation(root = process.cwd()) { |
| claims | const | 2289 | no | const claims = extractDocumentedCapabilities(root); |
| unimplemented | const | 2290 | no | const unimplemented = claims.filter((claim) =&gt; claim.anchors.length === 0); |
| extractLabsDesigns | function | 2302 | no | function extractLabsDesigns(root = process.cwd()) { |
| designs | const | 2303 | no | const designs = []; |
| path | const | 2305 | no | const path = normalizePath(doc.path); |
| labsDesignsImplementedElsewhere | function | 2324 | yes | export function labsDesignsImplementedElsewhere(root = process.cwd()) { |
| designs | const | 2325 | no | const designs = extractLabsDesigns(root); |
| out | const | 2326 | no | const out = []; |
| elsewhere | const | 2328 | no | const elsewhere = design.anchors.filter((path) =&gt; { if (ownTreeOf(path) === design.tree) return false; return isProductPath(path); }); |
| prototypePromotionCandidates | function | 2354 | yes | export function prototypePromotionCandidates(root = process.cwd()) { |
| designs | const | 2355 | no | const designs = extractLabsDesigns(root); |
| productSource | const | 2356 | no | const productSource = productSourceFiles(root); |
| out | const | 2357 | no | const out = []; |
| own | const | 2360 | no | const own = design.anchors.filter((path) =&gt; ownTreeOf(path) === design.tree); |
| product | const | 2361 | no | const product = design.anchors.filter((path) =&gt; isProductPath(path)); |
| maturity | const | 2362 | no | const maturity = own.length ? &#39;mature&#39; : product.length ? &#39;partial&#39; : &#39;nascent&#39;; |
| reachable | const | 2363 | no | const reachable = productSource.some((file) =&gt; file.text.includes(design.where)); |
| duplicated | const | 2364 | no | const duplicated = product.length &gt; 0; |
| consolidationSequence | function | 2390 | yes | export function consolidationSequence(db, { project = null, limit = 50 } = {}) { |
| rows | const | 2391 | no | const rows = db.prepare( `SELECT c.*, p.name AS project FROM canon_terms c JOIN projects p ON p.id = c.project_id ${project ? &#39;WHERE p.name = ?&#39; : &#39;&#39;} |
| docs | const | 2399 | no | const docs = db.prepare( `SELECT d.*, p.name AS project FROM documents d JOIN projects p ON p.id = d.project_id ${project ? &#39;WHERE p.name = ?&#39; : &#39;&#39;}`, |
| byTerm | const | 2407 | no | const byTerm = new Map(); |
| key | const | 2409 | no | const key = String(row.term ?? &#39;&#39;).toLowerCase(); |
| docsByPath | const | 2416 | no | const docsByPath = new Map(); |
| key | const | 2418 | no | const key = `${String(doc.project ?? &#39;&#39;)}\\0${normalizePath(doc.path)}`; |
| dependentCount | function | 2423 | no | function dependentCount(relPath, projName) { |
| target | const | 2424 | no | const target = normalizePath(relPath); |
| prefix | const | 2425 | no | const prefix = `${String(projName ?? &#39;&#39;)}\\0`; |
| count | variable | 2426 | no | let count = 0; |
| groups | const | 2438 | no | const groups = []; |
| sources | const | 2440 | no | const sources = [...new Set(entries.map((e) =&gt; e.source_path).filter(Boolean))].sort(cmpStr); |
| projNames | const | 2444 | no | const projNames = [...new Set(entries.map((e) =&gt; e.project).filter(Boolean))].sort(cmpStr); |
| perSource | const | 2447 | no | const perSource = []; |
| sourceProj | const | 2449 | no | const sourceProj = entries.find((e) =&gt; e.source_path === source)?.project ?? null; |
| dc | variable | 2450 | no | let dc = 0; |
| FEATURE_RE | const | 2495 | no | const FEATURE_RE = /@hq:feature\\b(?:\\s*\\(([^)]*)\\))?\\s*:?\\s*(.*)$/i; |
| featureClaimsInText | function | 2497 | no | function featureClaimsInText(text) { |
| out | const | 2498 | no | const out = []; |
| feature | const | 2503 | no | const feature = cleanText(match[2] \|\| match[1] \|\| &#39;&#39;, 120); |
| sourceVsManifest | function | 2520 | yes | export function sourceVsManifest({ root = process.cwd(), manifest = [] } = {}) { |
| manifestIds | const | 2521 | no | const manifestIds = Array.isArray(manifest) |
| manifestSet | const | 2524 | no | const manifestSet = new Set(manifestIds); |
| implemented | const | 2525 | no | const implemented = []; |
| seen | const | 2526 | no | const seen = new Set(); |
| entries | const | 2527 | no | const entries = discoveryFor(root); |
| rel | const | 2529 | no | const rel = toPosix(entry.rel); |
| text | const | 2531 | no | const text = readText(join(root, rel)); |
| compared | const | 2540 | no | const compared = manifestIds.length &gt; 0; |
| missingFromDeployed | const | 2544 | no | const missingFromDeployed = compared |
| manifestOnly | const | 2547 | no | const manifestOnly = compared ? manifestIds.filter((id) =&gt; !seen.has(id)) : []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 16 | external |
| node:path | import | 17 | external |
| ./schema.mjs | import | 18 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./filetypes.mjs | import | 19 | [hq/lib/filetypes.mjs](./filetypes.mjs.md) |
| ./walk.mjs | import | 20 | [hq/lib/walk.mjs](./walk.mjs.md) |
| ./util.mjs | import | 21 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs](../aii/fixtures/HQ-009-indexing-coverage-gaps.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-018-same-responsibility.mjs](../aii/fixtures/HQ-018-same-responsibility.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-034-source-features-vs-manifest.mjs](../aii/fixtures/HQ-034-source-features-vs-manifest.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs](../aii/fixtures/HQ-036-documented-capabilities-without-implementation.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs](../aii/fixtures/HQ-037-labs-designs-implemented-elsewhere.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-038-research-prototype-promotion.mjs](../aii/fixtures/HQ-038-research-prototype-promotion.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-041-superseded-decisions.mjs](../aii/fixtures/HQ-041-superseded-decisions.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-042-decision-provenance.mjs](../aii/fixtures/HQ-042-decision-provenance.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-044-conflicting-specs.mjs](../aii/fixtures/HQ-044-conflicting-specs.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-045-archival-knowledge-loss.mjs](../aii/fixtures/HQ-045-archival-knowledge-loss.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-080-consolidation-sequence.mjs](../aii/fixtures/HQ-080-consolidation-sequence.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-095-unknowns-investigation.mjs](../aii/fixtures/HQ-095-unknowns-investigation.mjs.md) | ../../lib/canon.mjs |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](../aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | ../../lib/canon.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/canon.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/canon.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/canon.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/canon.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/canon.mjs |
| [hq/lib/kb-intake.mjs](./kb-intake.mjs.md) | ./canon.mjs |
| [hq/test/taxonomy.test.mjs](../test/taxonomy.test.mjs.md) | ../lib/canon.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Document intelligence: the 21-family document inventory, the |
| 4 | owner | hq | — | hq |
| 5 | task | — | — | lane-J |
| 6 | invariant | — | — | Documents never grant execution authority. Extraction records |
| 9 | invariant | — | — | Supersession and deprecation keep both rows. History is never |
| 11 | invariant | — | — | Indexing is idempotent: identical input produces identical |
| 13 | see | — | hq/CONTRACT.md | hq/CONTRACT.md |
| 14 | see | — | docs/CANON-DECISIONS.md | docs/CANON-DECISIONS.md |
| 2491 | see | — | / | / |
| 2491 | why | — | — | / |
| 2492 | invariant | — | — | ): the tag must be the only @hq: tag on the line and sit in a |

## Excerpt

```javascript
/**
 * @hq:context Document intelligence: the 21-family document inventory, the
 *   dated decision register and the CANON term register. Read-only projection.
 * @hq:owner hq
 * @hq:task lane-J
 * @hq:invariant Documents never grant execution authority. Extraction records
 *   what a document claims; only an explicit owner confirmation can produce
 *   `accepted` status or `owner` authority.
 * @hq:invariant Supersession and deprecation keep both rows. History is never
 *   rewritten or deleted.
 * @hq:invariant Indexing is idempotent: identical input produces identical
 *   rows and reports zero changes on the second run.
 * @hq:see hq/CONTRACT.md
 * @hq:see docs/CANON-DECISIONS.md
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { transaction } from './schema.mjs';
import { classifyPath, loadRegistry } from './filetypes.mjs';
import { discoverFiles } from './walk.mjs';
import {
  globToRegExp, nowISO, safeJsonParse, sha256, sha256File, toPosix,
} from './util.mjs';

// ---------------------------------------------------------------------------
// taxonomy constants (contract exports)

const FAMILY_CODES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
  '12', '13', '14', '15', '16', '17', '18', '19', '20', '21',
];

// [code, name, role, patterns] — the AION core-library 21-family map.
// Patterns are lowercase basenames or project-relative globs. They are a
// fallback only: when the 217/133 registry classifies a path, the registry
// wins. The registry does not carry patterns for ADR directories or CANON
// dictionaries, so those paths rely on this map.
const FAMILY_DEFS = [
  ['01', 'Agent entry & bootstrap', 'instruction', ['agents.md', 'bootstrap.md', 'start-here.md']],
  ['02', 'Provider-native rules', 'instruction', [
    'claude.md', 'gemini.md', '.cursorrules', '.cursor/rules/*.mdc',
    '.github/copilot-instructions.md', '.github/instructions/*.instructions.md',
    '.opencode/agents/*.md', '.claude/rules/*.md', '.claude/agents/*.md',
  ]],
  ['03', 'Roles & identity', 'identity', ['role.md', 'persona.md', 'charter.md', 'genome.md', 'fleet.md']],
  ['04', 'Context & retrieval', 'context', [
    'context.md', 'project-context.md', 'glossary.md', 'knowledge-map.md',
    'world.md', 'aperture.md', 'canon.md', 'canon-dictionary.md',
    'docs/canon/*.md',
  ]],
  ['05', 'Law, policy & guardrails', 'law', [
    'rules.md', 'policy.md', 'invariants.md', 'authority.md', 'guardrails.md', 'autonomy.md',
  ]],
  ['06', 'Goals & product intent', 'intent', ['vision.md', 'goals.md', 'prd.md', 'spec.md', 'north-stars.md']],
  ['07', 'Architecture & interfaces', 'architecture', ['architecture.md', 'contract.md', 'api.md', 'schema.md']],
  ['08', 'Capabilities & discovery', 'capability', ['capabilities.md', 'tools.md', 'mcp.md', 'integrations.md']],
  ['09', 'Skills & reusable methods', 'skill', ['skill.md', 'playbook.md', 'recipes.md']],
  ['10', 'Tool configuration & hooks', 'config', [
    'opencode.json', 'opencode.jsonc', 'hooks.json', '.mcp.json', 'settings.json',
  ]],
  ['11', 'Memory & durable learning', 'memory', ['memory.md', 'notes.md', 'preferences.md', 'lessons.md', 'facts.md']],
  ['12', 'State, status & telemetry', 'state', ['state.md', 'sitrep.md', 'health.md', 'metrics.md', 'timing.md']],
  ['13', 'Session boundaries & recovery', 'continuity', ['handoff.md', 'checkpoint.md', 'resume.md']],
  ['14', 'Work inventory & scheduling', 'work', ['tasks.md', 'todo.md', 'backlog.md', 'milestones.md']],
  ['15', 'Planning & decomposition', 'plan', ['plan.md', 'roadmap.md', 'workstream.md', 'workstreams.md']],
  ['16', 'Execution & operations', 'operations', ['runbook.md', 'commands.md', 'deploy.md', 'worklog.md']],
  ['17', 'Testing & validation', 'validation', ['test-plan.md', 'verify.md', 'eval.md', 'benchmarks.md']],
  ['18', 'Proof, lineage & audit', 'evidence', ['evidence.md', 'provenance.md', 'receipts.md']],
  ['19', 'Collaboration & handoffs', 'collaboration', ['inbox.md', 'escalation.md', 'decisions-needed.md']],
  ['20', 'Decision & governance', 'decision', [
    'decisions.md', 'decision_log.md', 'adr.md', 'conflict-register.md',
    'change-request.md', 'adr/*.md', 'adr/*.yaml', 'adr/*.yml',
    'docs/adr/*.md', 'docs/adr/*.yaml', 'docs/adr/*.yml',
    'docs/decisions/*.md',
  ]],
  ['21', 'Closeout, release & retirement', 'closeout', [
    'closeout.md', 'closeout_protocol.md', 'release.md', 'rollback.md', 'postmortem.md',
  ]],
];
```

_First 80 of 2560 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
