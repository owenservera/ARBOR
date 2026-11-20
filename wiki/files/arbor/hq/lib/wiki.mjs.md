# File: hq/lib/wiki.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/wiki.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 97931 B |
| Lines | 2480 |
| Hash | 3cedf70141c9 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WIKI_VERSION | const | 21 | no | const WIKI_VERSION = 1; |
| MAX_SEARCH_TOKENS | const | 22 | no | const MAX_SEARCH_TOKENS = 60; |
| SECRET_BASENAMES | const | 24 | no | const SECRET_BASENAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, |
| isSecretPath | function | 33 | no | function isSecretPath(filePath) { |
| p | const | 34 | no | const p = toPosix(filePath).toLowerCase(); |
| base | const | 35 | no | const base = p.split(&#39;/&#39;).pop() \|\| &#39;&#39;; |
| cmpStr | function | 42 | no | function cmpStr(a, b) { |
| left | const | 43 | no | const left = String(a ?? &#39;&#39;); |
| right | const | 44 | no | const right = String(b ?? &#39;&#39;); |
| pushMap | function | 48 | no | function pushMap(map, key, value) { |
| list | const | 49 | no | const list = map.get(key); |
| countBy | function | 54 | no | function countBy(rows, keyFn) { |
| map | const | 55 | no | const map = new Map(); |
| key | const | 57 | no | const key = keyFn(row); |
| escapeHtml | function | 63 | no | function escapeHtml(value) { |
| mdText | function | 73 | no | function mdText(value, max = 400) { |
| text | const | 74 | no | const text = String(value ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| mdCell | function | 79 | no | function mdCell(value, max = 240) { |
| text | const | 80 | no | const text = String(value ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| codeSpan | function | 84 | no | function codeSpan(value, max = 240) { |
| text | const | 85 | no | const text = truncate(String(value ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(), max); |
| escaped | const | 87 | no | const escaped = escapeHtml(text); |
| runs | const | 88 | no | const runs = escaped.match(/`+/g) \|\| []; |
| longest | variable | 89 | no | let longest = 0; |
| fence | const | 91 | no | const fence = &#39;`&#39;.repeat(longest + 1); |
| makeTable | function | 95 | no | function makeTable(headers, rows) { |
| head | const | 96 | no | const head = `\| ${headers.join(&#39; \| &#39;)} \|`; |
| sep | const | 97 | no | const sep = `\| ${headers.map(() =&gt; &#39;---&#39;).join(&#39; \| &#39;)} \|`; |
| body | const | 98 | no | const body = rows.map((row) =&gt; `\| ${row.join(&#39; \| &#39;)} \|`).join(&#39;\\n&#39;); |
| dateOnly | function | 102 | no | function dateOnly(value) { |
| text | const | 103 | no | const text = String(value ?? &#39;&#39;); |
| slug | function | 108 | no | function slug(value) { |
| text | const | 109 | no | const text = toPosix(String(value ?? &#39;&#39;)).trim(); |
| cleaned | const | 110 | no | const cleaned = text.replace(/[^A-Za-z0-9._-]+/g, &#39;-&#39;).replace(/^-+\|-+$/g, &#39;&#39;); |
| assignSegments | function | 115 | no | function assignSegments(names) { |
| map | const | 116 | no | const map = new Map(); |
| used | const | 117 | no | const used = new Set(); |
| base | const | 119 | no | const base = slug(name); |
| candidate | variable | 120 | no | let candidate = base; |
| n | variable | 121 | no | let n = 2; |
| relLink | function | 132 | no | function relLink(fromPath, toPath) { |
| rel | variable | 133 | no | let rel = posix.relative(posix.dirname(fromPath), toPath); |
| packageRoot | function | 139 | no | function packageRoot(specifier) { |
| spec | const | 140 | no | const spec = String(specifier ?? &#39;&#39;); |
| parts | const | 143 | no | const parts = spec.split(&#39;/&#39;); |
| fenceFor | function | 149 | no | function fenceFor(text) { |
| runs | const | 150 | no | const runs = String(text ?? &#39;&#39;).match(/`+/g) \|\| []; |
| longest | variable | 151 | no | let longest = 0; |
| sqliteTableExists | function | 162 | no | function sqliteTableExists(db, name) { |
| loadSemanticModel | function | 175 | no | function loadSemanticModel(db) { |
| ids | const | 177 | no | const ids = db |
| links | const | 180 | no | const links = sqliteTableExists(db, &#39;semantic_link&#39;) |
| byId | const | 185 | no | const byId = new Map(); |
| target | const | 188 | no | const target = byId.get(link.semantic_id); |
| loadCommandModel | function | 196 | no | function loadCommandModel() { |
| actions | const | 198 | no | const actions = buildActions({ domains: [...ACTION_DOMAINS_1, ...ACTION_DOMAINS_2, ...ACTION_DOMAINS_3, ...ACTION_DOMAINS_4], verbs: VERBS, handlers: HANDLERS, }); |
| safeJsonList | function | 222 | no | function safeJsonList(value) { |
| parsed | const | 224 | no | const parsed = JSON.parse(String(value ?? &#39;[]&#39;)); |
| loadSessionModel | function | 231 | no | function loadSessionModel(db) { |
| rows | const | 234 | no | const rows = sessionRows(db, { limit: 500 }); |
| days | const | 236 | no | const days = sessionTimeline(db, { limit: 60 }); |
| tools | const | 237 | no | const tools = toolUsage(db); |
| totals | const | 238 | no | const totals = rows.reduce( (acc, row) =&gt; ({ sessions: acc.sessions + 1, messages: acc.messages + row.messages, toolCalls: acc.toolCalls + row.toolCalls, |
| loadCapabilityModel | function | 254 | no | function loadCapabilityModel(db) { |
| required | const | 255 | no | const required = [&#39;capability_source&#39;, &#39;capability_package&#39;, &#39;capability_map&#39;, &#39;capability_contract&#39;]; |
| sources | const | 258 | no | const sources = db |
| licenses | const | 265 | no | const licenses = db |
| mappings | const | 274 | no | const mappings = db |
| contracts | const | 283 | no | const contracts = db |
| approved | const | 292 | no | const approved = db |
| totalContracts | const | 295 | no | const totalContracts = db.prepare(&#39;SELECT COUNT(*) AS n FROM capability_contract&#39;).get().n; |
| loadModel | function | 308 | no | function loadModel(db, root, projects, maxFilePages) { |
| wanted | const | 309 | no | const wanted = Array.isArray(projects) |
| projectRows | variable | 313 | no | let projectRows = db.prepare(&#39;SELECT * FROM projects ORDER BY name&#39;).all(); |
| projectIds | const | 316 | no | const projectIds = projectRows.map((row) =&gt; row.id); |
| projectById | const | 317 | no | const projectById = new Map(projectRows.map((row) =&gt; [row.id, row])); |
| projectNames | const | 318 | no | const projectNames = projectRows.map((row) =&gt; row.name); |
| model | const | 320 | no | const model = { |
| placeholders | const | 345 | no | const placeholders = projectIds.map(() =&gt; &#39;?&#39;).join(&#39;,&#39;); |
| fileRowsAll | const | 347 | no | const fileRowsAll = db |
| excludedIds | const | 350 | no | const excludedIds = new Set(); |
| includedFiles | const | 351 | no | const includedFiles = []; |
| project | const | 357 | no | const project = projectById.get(file.project_id); |
| fileById | const | 361 | no | const fileById = new Map(includedFiles.map((file) =&gt; [file.id, file])); |
| symbols | const | 363 | no | const symbols = db |
| file | const | 368 | no | const file = fileById.get(symbol.file_id); |
| importRows | const | 373 | no | const importRows = []; |
| rawImports | const | 374 | no | const rawImports = db |
| resolvedFile | const | 379 | no | const resolvedFile = imp.resolved_file_id ? fileById.get(imp.resolved_file_id) : null; |
| resolvedProject | const | 380 | no | const resolvedProject = resolvedFile |
| annotationRows | const | 394 | no | const annotationRows = db |
| file | const | 399 | no | const file = fileById.get(annotation.file_id); |
| commitRows | const | 404 | no | const commitRows = db |
| inDegree | const | 413 | no | const inDegree = new Map(); |
| dependents | const | 414 | no | const dependents = new Map(); |
| fromFile | const | 418 | no | const fromFile = fileById.get(imp.file_id); |
| symbolCount | const | 422 | no | const symbolCount = new Map(); |
| ranked | const | 426 | no | const ranked = includedFiles.slice().sort((a, b) =&gt; { const bySymbols = (symbolCount.get(b.id) \|\| 0) - (symbolCount.get(a.id) \|\| 0); if (bySymbols) return bySymbols; const byIncoming = (inDegree.get(… |
| bySymbols | const | 427 | no | const bySymbols = (symbolCount.get(b.id) \|\| 0) - (symbolCount.get(a.id) \|\| 0); |
| byIncoming | const | 429 | no | const byIncoming = (inDegree.get(b.id) \|\| 0) - (inDegree.get(a.id) \|\| 0); |
| cap | const | 433 | no | const cap = Number.isFinite(maxFilePages) ? Math.max(0, Math.floor(maxFilePages)) : 5000; |
| filePageIds | const | 434 | no | const filePageIds = new Set(ranked.slice(0, cap).map((file) =&gt; file.id)); |
| projectData | const | 436 | no | const projectData = projectRows.map((row) =&gt; { const files = includedFiles.filter((file) =&gt; file.project_id === row.id); const fileIds = new Set(files.map((file) =&gt; file.id)); const projectSymbols = … |
| files | const | 437 | no | const files = includedFiles.filter((file) =&gt; file.project_id === row.id); |
| fileIds | const | 438 | no | const fileIds = new Set(files.map((file) =&gt; file.id)); |
| projectSymbols | const | 439 | no | const projectSymbols = symbols.filter((symbol) =&gt; fileIds.has(symbol.file_id)); |
| projectImports | const | 440 | no | const projectImports = importRows.filter((imp) =&gt; fileIds.has(imp.file_id)); |
| projectAnnotations | const | 441 | no | const projectAnnotations = annotationRows.filter((annotation) =&gt; fileIds.has(annotation.file_id)); |
| projectCommits | const | 442 | no | const projectCommits = commitRows.filter((commit) =&gt; commit.project_id === row.id); |
| byFileSymbols | const | 444 | no | const byFileSymbols = new Map(); |
| byFileImports | const | 446 | no | const byFileImports = new Map(); |
| byFileAnnotations | const | 448 | no | const byFileAnnotations = new Map(); |
| componentFiles | const | 451 | no | const componentFiles = new Map(); |
| components | const | 453 | no | const components = [...componentFiles.keys()].sort(cmpStr).map((name) =&gt; ({ name, files: componentFiles.get(name).slice().sort((a, b) =&gt; cmpStr(a.path, b.path)), symbols: projectSymbols .filter((symb… |
| file | const | 458 | no | const file = fileById.get(symbol.file_id); |
| languageMap | const | 464 | no | const languageMap = new Map(); |
| entry | const | 466 | no | const entry = languageMap.get(file.lang) \|\| { lang: file.lang, files: 0, symbols: 0 }; |
| languages | const | 471 | no | const languages = [...languageMap.values()].sort((a, b) =&gt; cmpStr(a.lang, b.lang)); |
| generatedAt | variable | 492 | no | let generatedAt = &#39;unknown&#39;; |
| generatedSource | variable | 493 | no | let generatedSource = &#39;unknown&#39;; |
| newest | const | 495 | no | const newest = commitRows.slice().sort((a, b) =&gt; cmpStr(b.date, a.date) \|\| cmpStr(a.sha, b.sha))[0]; |
| maxMtime | variable | 502 | no | let maxMtime = 0; |
| mtime | const | 504 | no | const mtime = Number(file.mtime_ms) \|\| 0; |
| buildWiki | function | 533 | yes | export function buildWiki({ db, root, projects, outDir = &#39;wiki&#39;, force = false, maxFilePages = 5000, graphIndex = null, persistHashes = true } = {}) { |
| started | const | 534 | no | const started = process.hrtime.bigint(); |
| workspaceRoot | const | 537 | no | const workspaceRoot = root \|\| process.cwd(); |
| destRoot | const | 538 | no | const destRoot = isAbsolute(outDir) ? outDir : join(workspaceRoot, outDir); |
| model | const | 539 | no | const model = loadModel(db, workspaceRoot, projects, maxFilePages); |
| filePageIds | const | 543 | no | const filePageIds = model.filePageIds \|\| new Set(); |
| titleCache | const | 544 | no | const titleCache = new Map(); |
| pages | const | 546 | no | const pages = []; |
| pageBy | const | 547 | no | const pageBy = { |
| dateLabel | function | 554 | no | const dateLabel = () =&gt; (model.generatedAt === &#39;unknown&#39; ? &#39;unknown&#39; : dateOnly(model.generatedAt)); |
| addPage | function | 556 | no | function addPage(page) { |
| displayPath | function | 561 | no | function displayPath(absPath) { |
| rel | const | 563 | no | const rel = toPosix(relative(workspaceRoot, absPath)); |
| projectLink | function | 568 | no | function projectLink(page, project, label) { |
| target | const | 569 | no | const target = pageBy.project.get(project.row.name); |
| fileLink | function | 574 | no | function fileLink(page, file, label) { |
| target | const | 575 | no | const target = pageBy.file.get(file.id); |
| modulePage | const | 577 | no | const modulePage = pageBy.module.get(`${file.project_id}\\0${file.component}`); |
| symbolLink | function | 582 | no | function symbolLink(page, symbol) { |
| file | const | 583 | no | const file = model.fileById.get(symbol.file_id); |
| readTextFile | function | 588 | no | function readTextFile(file, maxLines = 0) { |
| candidates | const | 589 | no | const candidates = [file.abs_path, join(workspaceRoot, file.path)]; |
| text | const | 593 | no | const text = readFileSync(candidate, &#39;utf8&#39;); |
| lines | const | 595 | no | const lines = text.split(/\\r?\\n/); |
| docTitle | function | 604 | no | function docTitle(file) { |
| title | variable | 606 | no | let title = basename(file.path); |
| read | const | 607 | no | const read = readTextFile(file, 60); |
| heading | const | 609 | no | const heading = read.text.split(/\\r?\\n/).find((line) =&gt; /^#\\s+\\S/.test(line)); |
| first | const | 612 | no | const first = read.text.split(/\\r?\\n/).find((line) =&gt; line.trim() &amp;&amp; !line.trim().startsWith(&#39;---&#39;)); |
| projectSegments | const | 625 | no | const projectSegments = assignSegments(model.projects.map((project) =&gt; project.row.name)); |
| row | const | 628 | no | const row = project.row; |
| projectSegment | const | 629 | no | const projectSegment = projectSegments.get(row.name); |
| projectPage | const | 633 | no | const projectPage = addPage({ id: `project:${row.name}`, path: `projects/${projectSegment}.md`, kind: &#39;project&#39;, project: row.name, |
| componentSegment | const | 655 | no | const componentSegment = project.componentSegment.get(component.name); |
| modulePage | const | 656 | no | const modulePage = addPage({ id: `module:${row.name}:${component.name}`, path: `modules/${projectSegment}/${componentSegment}.md`, kind: &#39;module&#39;, project: row.name, |
| usedPaths | const | 677 | no | const usedPaths = new Set(); |
| filesForPages | const | 678 | no | const filesForPages = project.files |
| basePath | const | 683 | no | const basePath = file.path.split(&#39;/&#39;).map(slug).join(&#39;/&#39;) + &#39;.md&#39;; |
| relativePath | variable | 684 | no | let relativePath = basePath; |
| n | variable | 685 | no | let n = 2; |
| pagePath | const | 691 | no | const pagePath = `files/${projectSegment}/${relativePath}`; |
| filePage | const | 693 | no | const filePage = addPage({ id: `file:${row.name}:${file.path}`, path: pagePath, kind: &#39;file&#39;, project: row.name, |
| globalPages | const | 715 | no | const globalPages = [ |
| page | const | 731 | no | const page = addPage({ id: key, path: pagePath, kind, project: null, |
| searchPage | const | 759 | no | const searchPage = addPage({ id: &#39;search.json&#39;, path: &#39;search.json&#39;, kind: &#39;search&#39;, project: null, |
| htmlPage | const | 772 | no | const htmlPage = addPage({ id: &#39;index.html&#39;, path: &#39;index.html&#39;, kind: &#39;html&#39;, project: null, |
| navLine | function | 789 | no | function navLine(page) { |
| keys | const | 790 | no | const keys = [&#39;index&#39;, &#39;symbols&#39;, &#39;graph&#39;, &#39;docs&#39;, &#39;changes&#39;, &#39;todos&#39;, &#39;deprecated&#39;, &#39;protocol&#39;, &#39;glossary&#39;, &#39;context&#39;, &#39;capabilities&#39;, &#39;search&#39;, &#39;html&#39;]; |
| targets | const | 791 | no | const targets = keys.map((key) =&gt; pageBy.global.get(key)).filter(Boolean); |
| finishPage | function | 795 | no | function finishPage(page, body) { |
| text | const | 796 | no | const text = String(body ?? &#39;&#39;).replace(/\\s+$/, &#39;&#39;); |
| pageHeader | function | 801 | no | function pageHeader(title, subtitle) { |
| line | const | 802 | no | const line = [`# ${mdText(title, 200)}`, &#39;&#39;]; |
| renderIndexPage | function | 811 | no | function renderIndexPage(page) { |
| out | const | 812 | no | const out = []; |
| projectRows | const | 834 | no | const projectRows = model.projects.map((project) =&gt; [ projectLink(page, project), String(project.files.length), String(project.symbols.length), String(project.components.length), |
| rows | const | 850 | no | const rows = []; |
| target | const | 852 | no | const target = pageBy.global.get(key); |
| descriptions | const | 853 | no | const descriptions = { |
| search | const | 868 | no | const search = pageBy.global.get(&#39;search&#39;); |
| html | const | 869 | no | const html = pageBy.global.get(&#39;html&#39;); |
| renderProjectPage | function | 886 | no | function renderProjectPage(page, project) { |
| row | const | 887 | no | const row = project.row; |
| out | const | 888 | no | const out = []; |
| spaceTerm | const | 891 | no | const spaceTerm = VIVIM_TAXONOMY.userTerms.space \|\| &#39;Space&#39;; |
| componentRows | const | 929 | no | const componentRows = project.components.map((component) =&gt; { const modulePage = project.modulePages.get(component.name); const label = modulePage ? `[${mdCell(component.name)}](${relLink(page.path, … |
| modulePage | const | 930 | no | const modulePage = project.modulePages.get(component.name); |
| label | const | 931 | no | const label = modulePage |
| entryFiles | const | 944 | no | const entryFiles = project.files |
| base | const | 946 | no | const base = basename(file.path); |
| entryLines | const | 950 | no | const entryLines = []; |
| packageFile | const | 952 | no | const packageFile = |
| pkg | variable | 956 | no | let pkg = null; |
| raw | const | 957 | no | const raw = readTextFile(packageFile); |
| bins | const | 967 | no | const bins = typeof pkg.bin === &#39;string&#39; ? { [row.name]: pkg.bin } : pkg.bin; |
| topSymbols | const | 979 | no | const topSymbols = project.symbols |
| incoming | const | 1005 | no | const incoming = project.files.reduce((sum, file) =&gt; sum + (model.dependents.get(file.id) \|\| []).length, 0); |
| outgoing | const | 1006 | no | const outgoing = project.imports.filter((imp) =&gt; imp.resolved_file_id).length; |
| cross | const | 1017 | no | const cross = new Map(); |
| external | const | 1018 | no | const external = new Map(); |
| targetFile | const | 1020 | no | const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null; |
| targetProject | const | 1021 | no | const targetProject = targetFile ? targetFile.project_name : imp.resolved_project_name; |
| root | const | 1027 | no | const root = packageRoot(imp.specifier); |
| recent | const | 1057 | no | const recent = project.commits.slice(0, 10); |
| kindCounts | const | 1073 | no | const kindCounts = countBy(project.annotations, (annotation) =&gt; annotation.kind); |
| annotationRows | const | 1082 | no | const annotationRows = project.annotations |
| docs | const | 1103 | no | const docs = project.files |
| renderModulePage | function | 1120 | no | function renderModulePage(page, project, component) { |
| row | const | 1121 | no | const row = project.row; |
| out | const | 1122 | no | const out = []; |
| moduleSymbols | const | 1140 | no | const moduleSymbols = component.symbols.slice(0, 250); |
| moduleKey | const | 1160 | no | const moduleKey = `${row.id}\\0${component.name}`; |
| outgoing | const | 1161 | no | const outgoing = new Map(); |
| incoming | const | 1162 | no | const incoming = new Map(); |
| fromFile | const | 1164 | no | const fromFile = model.fileById.get(imp.file_id); |
| fromKey | const | 1166 | no | const fromKey = `${fromFile.project_id}\\0${fromFile.component}`; |
| targetFile | const | 1167 | no | const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null; |
| targetLabel | variable | 1168 | no | let targetLabel = null; |
| targetKey | variable | 1169 | no | let targetKey = null; |
| root | const | 1183 | no | const root = packageRoot(imp.specifier); |
| interesting | const | 1213 | no | const interesting = new Set([&#39;context&#39;, &#39;why&#39;, &#39;invariant&#39;, &#39;owner&#39;, &#39;risk&#39;, &#39;deprecated&#39;, &#39;task&#39;]); |
| annotations | const | 1214 | no | const annotations = component.files |
| renderFilePage | function | 1241 | no | function renderFilePage(page, project, file) { |
| out | const | 1242 | no | const out = []; |
| symbols | const | 1266 | no | const symbols = (project.byFileSymbols.get(file.id) \|\| []) |
| imports | const | 1286 | no | const imports = (project.byFileImports.get(file.id) \|\| []) |
| target | variable | 1294 | no | let target = &#39;external&#39;; |
| targetFile | const | 1296 | no | const targetFile = model.fileById.get(imp.resolved_file_id); |
| targetProject | const | 1299 | no | const targetProject = model.projects.find((entry) =&gt; entry.row.name === imp.resolved_project_name); |
| dependents | const | 1310 | no | const dependents = (model.dependents.get(file.id) \|\| []) |
| annotations | const | 1324 | no | const annotations = (project.byFileAnnotations.get(file.id) \|\| []) |
| read | const | 1344 | no | const read = readTextFile(file, 80); |
| fence | const | 1346 | no | const fence = fenceFor(read.text); |
| renderSymbolsPage | function | 1362 | no | function renderSymbolsPage(page) { |
| out | const | 1363 | no | const out = []; |
| byKind | const | 1367 | no | const byKind = new Map(); |
| kinds | const | 1369 | no | const kinds = [...byKind.keys()].sort(cmpStr); |
| symbols | const | 1372 | no | const symbols = byKind.get(kind).slice().sort( (a, b) =&gt; cmpStr(a.name, b.name) \|\| cmpStr(a.project_name, b.project_name) \|\| cmpStr(a.file_path, b.file_path) \|\| |
| mermaidLabel | function | 1401 | no | function mermaidLabel(value) { |
| renderGraphPage | function | 1410 | no | function renderGraphPage(page) { |
| out | const | 1411 | no | const out = []; |
| projectNameById | const | 1415 | no | const projectNameById = new Map(model.projects.map((project) =&gt; [project.row.id, project.row.name])); |
| projectEdges | const | 1416 | no | const projectEdges = new Map(); |
| fromFile | const | 1418 | no | const fromFile = model.fileById.get(imp.file_id); |
| targetFile | const | 1420 | no | const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null; |
| toProject | const | 1421 | no | const toProject = targetFile ? targetFile.project_id : imp.resolved_project_id; |
| key | const | 1424 | no | const key = `${fromFile.project_id}\\0${toProject}`; |
| projectNodes | const | 1429 | no | const projectNodes = [...projectNameById.entries()].sort((a, b) =&gt; cmpStr(a[1], b[1])); |
| nodeIds | const | 1431 | no | const nodeIds = new Map(projectNodes.map(([id], index) =&gt; [id, `p${index}`])); |
| mermaid | const | 1432 | no | const mermaid = [&#39;```mermaid&#39;, &#39;flowchart LR&#39;]; |
| edges | const | 1436 | no | const edges = [...projectEdges.entries()] |
| moduleNodes | const | 1463 | no | const moduleNodes = new Map(); |
| moduleEdges | const | 1469 | no | const moduleEdges = new Map(); |
| fromFile | const | 1471 | no | const fromFile = model.fileById.get(imp.file_id); |
| fromKey | const | 1473 | no | const fromKey = `${fromFile.project_id}\\0${fromFile.component}`; |
| targetFile | const | 1474 | no | const targetFile = imp.resolved_file_id ? model.fileById.get(imp.resolved_file_id) : null; |
| toKey | const | 1476 | no | const toKey = `${targetFile.project_id}\\0${targetFile.component}`; |
| key | const | 1478 | no | const key = `${fromKey}\\0${toKey}`; |
| sortedNodes | const | 1482 | no | const sortedNodes = [...moduleNodes.entries()].sort((a, b) =&gt; cmpStr(a[1], b[1])); |
| nodeIds | const | 1483 | no | const nodeIds = new Map(sortedNodes.map(([key], index) =&gt; [key, `m${index}`])); |
| edgeList | const | 1484 | no | const edgeList = [...moduleEdges.entries()] |
| edges | const | 1490 | no | const edges = edgeList.slice(0, 160); |
| mermaid | const | 1491 | no | const mermaid = [&#39;```mermaid&#39;, &#39;flowchart LR&#39;]; |
| renderDocsPage | function | 1527 | no | function renderDocsPage(page) { |
| out | const | 1528 | no | const out = []; |
| docs | const | 1529 | no | const docs = model.allFiles |
| shown | const | 1535 | no | const shown = docs.slice(0, 300); |
| project | const | 1541 | no | const project = model.projects.find((entry) =&gt; entry.row.name === file.project_name); |
| renderCapabilitiesPage | function | 1561 | no | function renderCapabilitiesPage(page) { |
| out | const | 1562 | no | const out = []; |
| cap | const | 1563 | no | const cap = model.capabilities; |
| approved | const | 1578 | no | const approved = Number(cap.approved) \|\| 0; |
| proposed | const | 1579 | no | const proposed = cap.contracts.length; |
| sourceRows | const | 1586 | no | const sourceRows = cap.sources.map((row) =&gt; [ codeSpan(row.id, 80), String(row.packages ?? 0), String(row.files ?? 0), String(row.documents ?? 0), |
| licenseRows | const | 1602 | no | const licenseRows = cap.licenses.map((row) =&gt; [ codeSpan(row.sourceId, 80), mdCell(row.license, 60), String(row.packages ?? 0), &#39;candidate&#39;, |
| byNode | const | 1616 | no | const byNode = new Map(); |
| group | const | 1618 | no | const group = byNode.get(row.nodeId) \|\| []; |
| mappingRows | const | 1623 | no | const mappingRows = []; |
| contractRows | const | 1643 | no | const contractRows = cap.contracts.map((row) =&gt; [ codeSpan(row.id, 80), String(row.version ?? 1), codeSpan(row.nodeId, 80), mdCell(row.title, 140), |
| renderSessionsPage | function | 1673 | no | function renderSessionsPage(page) { |
| out | const | 1674 | no | const out = []; |
| sessions | const | 1675 | no | const sessions = model.sessions; |
| totals | const | 1676 | no | const totals = sessions?.totals; |
| renderChangesPage | function | 1741 | no | function renderChangesPage(page) { |
| out | const | 1742 | no | const out = []; |
| recent | const | 1747 | no | const recent = model.commitRows.slice(0, 50); |
| staleRows | const | 1765 | no | const staleRows = []; |
| indexedAt | const | 1767 | no | const indexedAt = project.row.indexed_at ? Date.parse(project.row.indexed_at) : NaN; |
| stale | variable | 1768 | no | let stale = 0; |
| types | const | 1786 | no | const types = countBy(model.commitRows, (commit) =&gt; commit.type \|\| &#39;other&#39;); |
| todos | const | 1798 | no | const todos = model.annotationRows |
| risks | const | 1818 | no | const risks = model.annotationRows |
| annotationFileCell | function | 1845 | no | function annotationFileCell(page, annotation) { |
| file | const | 1846 | no | const file = model.fileById.get(annotation.file_id); |
| renderTodosPage | function | 1850 | no | function renderTodosPage(page) { |
| todos | const | 1851 | no | const todos = model.annotationRows |
| out | const | 1860 | no | const out = []; |
| renderDeprecatedPage | function | 1881 | no | function renderDeprecatedPage(page) { |
| deprecated | const | 1882 | no | const deprecated = model.annotationRows |
| out | const | 1891 | no | const out = []; |
| renderGlossaryPage | function | 1916 | no | function renderGlossaryPage() { |
| renderSemanticsPage | function | 1928 | no | function renderSemanticsPage(page) { |
| out | const | 1929 | no | const out = []; |
| identities | const | 1932 | no | const identities = model.semanticIds \|\| []; |
| commands | const | 1933 | no | const commands = model.commands \|\| []; |
| commandById | const | 1934 | no | const commandById = new Map(commands.map((command) =&gt; [command.id, command])); |
| fileByPath | const | 1935 | no | const fileByPath = new Map(); |
| plain | const | 1980 | no | const plain = identity.id.includes(&#39;@&#39;) ? identity.id.slice(0, identity.id.lastIndexOf(&#39;@&#39;)) : identity.id; |
| command | const | 1981 | no | const command = commandById.get(plain) \|\| null; |
| file | const | 2004 | no | const file = fileByPath.get(`${&#39;repos-hq&#39;}\\u0000${link.path}`) |
| location | const | 2006 | no | const location = file |
| graphNode | const | 2009 | no | const graphNode = model.graphIndex?.bySourceFile.get(`${link.path}\\u0000${link.content_hash}`); |
| shown | const | 2046 | no | const shown = commands.slice(0, 400); |
| graphNodeRef | function | 2077 | no | function graphNodeRef(key, domains) { |
| index | const | 2078 | no | const index = model.graphIndex; |
| wanted | const | 2080 | no | const wanted = Array.isArray(domains) ? domains : [domains]; |
| candidates | const | 2081 | no | const candidates = index.bySemanticId.get(key) \|\| index.byActionId.get(key) \|\| []; |
| list | const | 2082 | no | const list = Array.isArray(candidates) ? candidates : [candidates]; |
| entry | const | 2083 | no | const entry = list.find((candidate) =&gt; wanted.includes(candidate.domain)) \|\| list[0] \|\| null; |
| renderProtocolPage | function | 2087 | no | function renderProtocolPage(page) { |
| out | const | 2088 | no | const out = []; |
| counts | const | 2121 | no | const counts = countBy(model.annotationRows, (annotation) =&gt; annotation.kind); |
| renderContextPage | function | 2138 | no | function renderContextPage(page) { |
| out | const | 2139 | no | const out = []; |
| userWord | function | 2142 | no | const userWord = (key, fallback) =&gt; mdText(VIVIM_TAXONOMY.userTerms[key] \|\| fallback); |
| glossaryPage | const | 2143 | no | const glossaryPage = pageBy.global.get(&#39;glossary&#39;); |
| glossaryLink | const | 2144 | no | const glossaryLink = glossaryPage |
| surfaces | const | 2196 | no | const surfaces = [ |
| target | const | 2207 | no | const target = pageBy.global.get(key); |
| makeTokens | function | 2222 | no | function makeTokens(title, keywords) { |
| out | const | 2223 | no | const out = []; |
| seen | const | 2224 | no | const seen = new Set(); |
| searchCache | variable | 2238 | no | let searchCache = null; |
| buildSearchEntries | function | 2239 | no | function buildSearchEntries() { |
| renderIndexHtml | function | 2253 | no | function renderIndexHtml(page) { |
| entries | const | 2254 | no | const entries = buildSearchEntries(); |
| kinds | const | 2255 | no | const kinds = [...new Set(entries.map((entry) =&gt; entry.kind))].sort(cmpStr); |
| projects | const | 2256 | no | const projects = [...new Set(entries.map((entry) =&gt; entry.project).filter(Boolean))].sort(cmpStr); |
| fallback | const | 2257 | no | const fallback = JSON.stringify(entries).replace(/&lt;/g, &#39;\\\\u003c&#39;); |
| kindOptions | const | 2258 | no | const kindOptions = kinds |
| projectOptions | const | 2261 | no | const projectOptions = projects |
| css | const | 2264 | no | const css = [ |
| js | const | 2281 | no | const js = [ |
| html | const | 2315 | no | const html = [ |
| rendered | const | 2355 | no | const rendered = pages.map((page) =&gt; ({ page, content: finishPage(page, page.render()), })); |
| existingStmt | const | 2361 | no | const existingStmt = db.prepare(&#39;SELECT id, input_hash FROM wiki_pages WHERE id = ?&#39;); |
| upsertStmt | const | 2362 | no | const upsertStmt = db.prepare( `INSERT INTO wiki_pages(id, input_hash, generated_at, bytes) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET input_hash = excluded.input_hash, generated_at = excluded… |
| tmpCounter | variable | 2369 | no | let tmpCounter = 0; |
| writeAtomic | function | 2370 | no | function writeAtomic(absPath, content) { |
| tmp | const | 2372 | no | const tmp = `${absPath}.tmp-${process.pid}-${tmpCounter}`; |
| written | variable | 2387 | no | let written = 0; |
| skipped | variable | 2388 | no | let skipped = 0; |
| removedPages | variable | 2389 | no | let removedPages = 0; |
| totalBytes | variable | 2390 | no | let totalBytes = 0; |
| pageResults | const | 2391 | no | const pageResults = []; |
| bytes | const | 2394 | no | const bytes = Buffer.byteLength(content, &#39;utf8&#39;); |
| inputHash | const | 2396 | no | const inputHash = digestOf({ version: WIKI_VERSION, content }); |
| dest | const | 2397 | no | const dest = join(destRoot, ...page.path.split(&#39;/&#39;)); |
| existing | const | 2398 | no | const existing = existingStmt.get(page.id); |
| upToDate | const | 2399 | no | const upToDate = !force &amp;&amp; existing &amp;&amp; existing.input_hash === inputHash &amp;&amp; existsSync(dest); |
| keepPaths | const | 2426 | no | const keepPaths = new Set(rendered.map((entry) =&gt; toPosix(entry.page.path))); |
| keepIds | const | 2427 | no | const keepIds = new Set(rendered.map((entry) =&gt; entry.page.id)); |
| deleteRow | const | 2428 | no | const deleteRow = db.prepare(&#39;DELETE FROM wiki_pages WHERE id = ?&#39;); |
| removeIfStale | function | 2434 | no | const removeIfStale = (absDir) =&gt; { |
| empty | variable | 2435 | no | let empty = true; |
| items | variable | 2436 | no | let items; |
| abs | const | 2443 | no | const abs = join(absDir, item.name); |
| rel | const | 2447 | no | const rel = toPosix(relative(destRoot, abs)); |
| elapsed | const | 2470 | no | const elapsed = Number(process.hrtime.bigint() - started) / 1e6; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| ./lang.mjs | import | 9 | [hq/lib/lang.mjs](./lang.mjs.md) |
| ./nomenclature.mjs | import | 10 | [hq/lib/nomenclature.mjs](./nomenclature.mjs.md) |
| ./session-views.mjs | import | 11 | [hq/lib/session-views.mjs](./session-views.mjs.md) |
| ./util.mjs | import | 12 | [hq/lib/util.mjs](./util.mjs.md) |
| ./action-registry.mjs | import | 13 | [hq/lib/action-registry.mjs](./action-registry.mjs.md) |
| ./actions/verbs.mjs | import | 14 | [hq/lib/actions/verbs.mjs](./actions/verbs.mjs.md) |
| ./actions/domains-1.mjs | import | 15 | [hq/lib/actions/domains-1.mjs](./actions/domains-1.mjs.md) |
| ./actions/domains-2.mjs | import | 16 | [hq/lib/actions/domains-2.mjs](./actions/domains-2.mjs.md) |
| ./actions/domains-3.mjs | import | 17 | [hq/lib/actions/domains-3.mjs](./actions/domains-3.mjs.md) |
| ./actions/domains-4.mjs | import | 18 | [hq/lib/actions/domains-4.mjs](./actions/domains-4.mjs.md) |
| ./actions/handlers.mjs | import | 19 | [hq/lib/actions/handlers.mjs](./actions/handlers.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/wiki.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./wiki.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./wiki.mjs |
| [hq/test/capability-surfaces.test.mjs](../test/capability-surfaces.test.mjs.md) | ../lib/wiki.mjs |
| [hq/test/wiki.test.mjs](../test/wiki.test.mjs.md) | ../lib/wiki.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
import { digestOf, toPosix, tokenize, truncate } from './util.mjs';
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
```

_First 80 of 2481 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
