# File: hq/bin/hq.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/hq.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 222050 B |
| Lines | 4395 |
| Hash | f0e4a2bc1c07 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| collectStale | const | 47 | no | const collectStale = collectStaleFiles; |
| BOOL | const | 87 | no | const BOOL = new Set([ &#39;json&#39;, &#39;force&#39;, &#39;quiet&#39;, &#39;reverse&#39;, &#39;exact&#39;, &#39;write&#39;, &#39;check&#39;, &#39;strict&#39;, &#39;changed&#39;, &#39;all&#39;, &#39;staged&#39;, &#39;owner-confirmed&#39;, &#39;once&#39;, &#39;help&#39;, &#39;version&#39;, &#39;html&#39;, &#39;scan&#39;, &#39;index&#39;, &#39;ye… |
| REPEAT | const | 96 | no | const REPEAT = new Set([ &#39;await&#39;, ]); |
| runtimeVersion | function | 102 | no | function runtimeVersion() { |
| manifest | const | 104 | no | const manifest = JSON.parse( readFileSync(join(import.meta.dirname, &#39;..&#39;, &#39;..&#39;, &#39;package.json&#39;), &#39;utf8&#39;), ); |
| parse | function | 113 | no | function parse(argv) { |
| positional | const | 114 | no | const positional = []; |
| flags | const | 115 | no | const flags = {}; |
| arg | const | 117 | no | const arg = argv[i]; |
| eq | const | 120 | no | const eq = arg.indexOf(&#39;=&#39;); |
| key | const | 124 | no | const key = arg.slice(2); |
| v | const | 127 | no | const v = argv[++i]; |
| findRoot | function | 140 | no | function findRoot(start = process.cwd()) { |
| sandbox | const | 145 | no | const sandbox = process.env.HQ_TEST_SANDBOX; |
| dir | variable | 147 | no | let dir = resolve(start); |
| parent | const | 150 | no | const parent = dirname(dir); |
| isInsideDir | function | 157 | no | function isInsideDir(path, dir) { |
| base | const | 158 | no | const base = resolve(dir); |
| target | const | 159 | no | const target = resolve(path); |
| openWorkspace | function | 163 | no | function openWorkspace() { |
| root | const | 164 | no | const root = findRoot(); |
| config | const | 165 | no | const config = loadConfig(root); |
| db | const | 166 | no | const db = openDb(dbPath(root, config)); |
| selectProjects | function | 172 | no | function selectProjects(projects, selector) { |
| value | const | 174 | no | const value = String(selector); |
| emit | function | 178 | no | function emit(flags, value, text) { |
| fail | function | 183 | no | function fail(code, message) { |
| count | function | 188 | no | function count(db, table, where = &#39;&#39;, params = []) { |
| row | const | 189 | no | const row = db.prepare(`SELECT count(*) AS c FROM ${table}${where ? &#39; WHERE &#39; + where : &#39;&#39;}`).get(...params); |
| findFileRow | function | 193 | no | function findFileRow(db, target, project = null) { |
| p | const | 194 | no | const p = toPosix(String(target ?? &#39;&#39;)).replace(/^\\.\\//, &#39;&#39;); |
| projectRow | const | 196 | no | const projectRow = project ? db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(project) : null; |
| exact | const | 198 | no | const exact = db.prepare(&#39;SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.project_id = ? AND f.path = ?&#39;).get(projectRow.id, p); |
| exact | const | 202 | no | const exact = db.prepare(&#39;SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.path = ?&#39;).get(p); |
| resolveSince | function | 207 | no | function resolveSince(ref) { |
| value | const | 208 | no | const value = String(ref ?? &#39;&#39;).trim().toLowerCase(); |
| now | const | 209 | no | const now = Date.now(); |
| days | const | 212 | no | const days = value.match(/^(\\d+)d$/); |
| hours | const | 214 | no | const hours = value.match(/^(\\d+)h$/); |
| languageBreakdown | function | 219 | no | function languageBreakdown(rows) { |
| counts | const | 220 | no | const counts = {}; |
| projectRows | function | 226 | no | function projectRows(db) { |
| projectCard | function | 236 | no | function projectCard(db, project) { |
| last | const | 237 | no | const last = db.prepare(&#39;SELECT sha, date, subject FROM commits WHERE project_id = ? ORDER BY date DESC LIMIT 1&#39;).get(project.id); |
| langs | const | 238 | no | const langs = db.prepare(&#39;SELECT lang, count(*) AS count FROM files WHERE project_id = ? GROUP BY lang ORDER BY count DESC&#39;).all(project.id); |
| helpText | function | 258 | no | function helpText() { |
| cmdInit | function | 427 | no | async function cmdInit(flags) { |
| root | const | 428 | no | const root = flags.root ? resolve(String(flags.root)) : findRoot(process.cwd()); |
| config | const | 430 | no | const config = loadConfig(root); |
| data | const | 432 | no | const data = loadProjects(root); |
| discovered | const | 433 | no | const discovered = discoverHarvest(root); |
| added | variable | 434 | no | let added = 0; |
| indexed | variable | 443 | no | let indexed = null; |
| db | const | 445 | no | const db = openDb(dbPath(root, config)); |
| projects | const | 446 | no | const projects = projectsForIndex(root); |
| out | const | 453 | no | const out = { |
| cmdProject | function | 476 | no | async function cmdProject(positional, flags) { |
| root | const | 477 | no | const root = findRoot(); |
| action | const | 478 | no | const action = positional.shift() \|\| &#39;list&#39;; |
| name | variable | 480 | no | let name = positional[0]; |
| pathArg | variable | 481 | no | let pathArg = positional[1]; |
| entry | const | 483 | no | const entry = registerProject(root, { name, path: resolve(root, pathArg), tags: flags.tags ? String(flags.tags).split(&#39;,&#39;).map((s) =&gt; s.trim()).filter(Boolean) : [] }); |
| name | const | 489 | no | const name = positional[0]; |
| removed | const | 491 | no | const removed = unregisterProject(root, name); |
| found | const | 500 | no | const found = discoverHarvest(root); |
| data | const | 505 | no | const data = loadProjects(root); |
| rows | const | 507 | no | const rows = projectRows(db); |
| cmdIndex | function | 514 | no | async function cmdIndex(positional, flags) { |
| projects | variable | 516 | no | let projects = projectsForIndex(root); |
| result | const | 520 | no | const result = await timeAsync(db, { operation: &#39;index&#39;, project: flags.project \|\| null }, () =&gt; indexWorkspace({ root, db, projects, options: { force: flags.force === true, maxFileBytes: Number(flag… |
| instructions | variable | 538 | no | let instructions = { count: 0, added: 0, changed: 0, removed: 0 }; |
| res | const | 542 | no | const res = indexInstructions(db, project); |
| canon | const | 551 | no | const canon = await import(&#39;../lib/canon.mjs&#39;); |
| lines | const | 559 | no | const lines = [`Indexed ${result.totals?.files ?? 0} files, ${result.totals?.symbols ?? 0} symbols, ${result.totals?.imports ?? 0} imports, ${result.totals?.annotations ?? 0} annotations`]; |
| cmdStatus | function | 569 | no | async function cmdStatus(flags) { |
| rows | const | 571 | no | const rows = projectRows(db); |
| lastIndexed | const | 572 | no | const lastIndexed = db.prepare(&quot;SELECT value FROM meta WHERE key=&#39;last_index_at&#39;&quot;).get()?.value \|\| null; |
| out | const | 573 | no | const out = { |
| cmdSearch | function | 599 | no | async function cmdSearch(positional, flags) { |
| query | const | 601 | no | const query = positional.join(&#39; &#39;).trim(); |
| options | const | 604 | no | const options = profileOptions(config, &#39;search&#39;); |
| result | const | 605 | no | const result = timeSync(db, { operation: &#39;search&#39;, project: flags.project }, () =&gt; searchContent(db, { query, project: flags.project, lang: flags.lang, kind: flags.kind, limit: Number(flags.limit \|\| … |
| lines | const | 610 | no | const lines = [`${result.total} matches for &quot;${query}&quot;`]; |
| cmdFind | function | 619 | no | async function cmdFind(positional, flags) { |
| query | const | 621 | no | const query = positional.join(&#39; &#39;).trim(); |
| options | const | 624 | no | const options = profileOptions(config, &#39;find&#39;); |
| result | const | 625 | no | const result = timeSync(db, { operation: &#39;find&#39;, project: flags.project }, () =&gt; searchSymbols(db, { query, kind: flags.kind, project: flags.project, exact: flags.exact === true, limit: Number(flags.… |
| lines | const | 630 | no | const lines = [`${result.total} symbols for &quot;${query}&quot;`]; |
| cmdFile | function | 639 | no | async function cmdFile(positional, flags) { |
| target | const | 641 | no | const target = positional.join(&#39; &#39;).trim(); |
| row | const | 643 | no | const row = findFileRow(db, target, flags.project); |
| symbols | const | 645 | no | const symbols = db.prepare(&#39;SELECT name, kind, line, end_line, signature, exported FROM symbols WHERE file_id = ? ORDER BY line&#39;).all(row.id); |
| imports | const | 646 | no | const imports = db.prepare(&#39;SELECT specifier, kind, line, resolved_file_id FROM imports WHERE file_id = ? ORDER BY line&#39;).all(row.id); |
| dependents | const | 647 | no | const dependents = db.prepare(&#39;SELECT f.path AS path, p.name AS project FROM imports i JOIN files f ON f.id = i.file_id JOIN projects p ON p.id = i.project_id WHERE i.resolved_file_id = ? ORDER BY pa… |
| annotations | const | 648 | no | const annotations = db.prepare(&#39;SELECT line, kind, text, owner, ref FROM annotations WHERE file_id = ? ORDER BY line&#39;).all(row.id); |
| out | const | 649 | no | const out = { schema: &#39;hq.file/1&#39;, file: row, symbols, imports, dependents, annotations, authority: &#39;source_declarations_not_runtime&#39; }; |
| lines | const | 651 | no | const lines = [ |
| cmdDeps | function | 671 | no | async function cmdDeps(positional, flags) { |
| target | const | 673 | no | const target = positional.join(&#39; &#39;).trim(); |
| out | const | 676 | no | const out = deps(db, { target, project: flags.project, depth: Number(flags.depth \|\| 2), reverse: flags.reverse === true, limit: Number(flags.limit \|\| 200), }); |
| lines | const | 681 | no | const lines = [`${out.direction} deps for ${out.root ? out.root.project + &#39;/&#39; + out.root.path : target}`]; |
| cmdImpact | function | 688 | no | async function cmdImpact(positional, flags) { |
| target | const | 690 | no | const target = positional.join(&#39; &#39;).trim(); |
| out | const | 693 | no | const out = impact(db, { target, depth: Number(flags.depth \|\| 3), limit: Number(flags.limit \|\| 500) }); |
| lines | const | 695 | no | const lines = [`Impact of ${out.root ? out.root.project + &#39;/&#39; + out.root.path : target}: ${out.nodes.length} dependent(s)`]; |
| cmdContext | function | 702 | no | async function cmdContext(positional, flags) { |
| task | const | 704 | no | const task = (flags.task ? String(flags.task) : positional.join(&#39; &#39;)).trim(); |
| file | const | 711 | no | const file = typeof flags.verify === &#39;string&#39; ? flags.verify : positional[0]; |
| bundle | const | 713 | no | const bundle = JSON.parse(readFileSync(resolve(file), &#39;utf8&#39;)); |
| verification | const | 714 | no | const verification = timeSync(db, { operation: &#39;context.verify&#39;, project: flags.project }, () =&gt; verifyContext(bundle)); |
| options | const | 720 | no | const options = profileOptions(config, &#39;context&#39;); |
| span | const | 721 | no | const span = startSpan(db, { operation: &#39;context&#39;, project: flags.project }); |
| bundle | variable | 722 | no | let bundle; |
| outPath | const | 743 | no | const outPath = resolve(String(flags.out)); |
| lines | const | 749 | no | const lines = [ |
| cmdRoute | function | 764 | no | async function cmdRoute(positional, flags) { |
| task | const | 766 | no | const task = positional.join(&#39; &#39;).trim(); |
| out | const | 769 | no | const out = routeTask(db, { task, project: flags.project, limit: Number(flags.limit \|\| 12) }); |
| lines | const | 771 | no | const lines = [`Routing for &quot;${task}&quot;`, &#39;&#39;, &#39;Mandatory:&#39;]; |
| cmdBrief | function | 785 | no | async function cmdBrief(positional, flags) { |
| options | const | 788 | no | const options = profileOptions(config, &#39;brief&#39;); |
| projects | variable | 789 | no | let projects = projectsForIndex(root); |
| out | const | 791 | no | const out = timeSync(db, { operation: &#39;brief&#39;, project: flags.project }, () =&gt; brief(db, { root, projects, audience: flags.audience \|\| &#39;agent&#39;, maxBytes: Number(flags[&#39;max-bytes&#39;] \|\| (flags.audience … |
| cmdHandoff | function | 801 | no | async function cmdHandoff(positional, flags) { |
| projects | variable | 809 | no | let projects = projectsForIndex(root); |
| briefResult | const | 811 | no | const briefResult = brief(db, { root, projects, audience: flags.audience \|\| &#39;agent&#39;, maxBytes: 6000 }); |
| commits | const | 812 | no | const commits = queryCommits(db, { project: flags.project, limit: 15 }); |
| notes | const | 813 | no | const notes = listNotes(db, { project: flags.project, limit: 20 }); |
| task | const | 814 | no | const task = (flags.task ? String(flags.task) : &#39;session handoff&#39;).trim(); |
| bundle | const | 815 | no | const bundle = await composeContext(db, { task, project: flags.project, budgetTokens: Number(flags.budget \|\| 5000) }); |
| dirty | const | 816 | no | const dirty = []; |
| handoff | const | 822 | no | const handoff = { |
| outPath | const | 843 | no | const outPath = flags.out |
| md | const | 847 | no | const md = renderHandoffMarkdown(handoff); |
| renderHandoffMarkdown | function | 855 | no | function renderHandoffMarkdown(handoff) { |
| lines | const | 856 | no | const lines = [ |
| cmdSince | function | 894 | no | async function cmdSince(positional, flags) { |
| ref | const | 896 | no | const ref = positional[0] \|\| &#39;yesterday&#39;; |
| since | const | 897 | no | const since = resolveSince(ref); |
| commits | const | 899 | no | const commits = queryCommits(db, { project: flags.project, since, limit: Number(flags.limit \|\| 50) }); |
| projects | variable | 901 | no | let projects = projectsForIndex(root); |
| dirty | const | 903 | no | const dirty = []; |
| out | const | 908 | no | const out = { schema: &#39;hq.since/1&#39;, ref, since, commits, dirty }; |
| lines | const | 909 | no | const lines = [`Changes since ${ref} (${since})`, &#39;&#39;, `Commits: ${commits.length}`]; |
| cmdNote | function | 917 | no | async function cmdNote(positional, flags) { |
| action | const | 920 | no | const action = positional.shift() \|\| &#39;list&#39;; |
| text | const | 923 | no | const text = (flags.text ? String(flags.text) : positional.join(&#39; &#39;)).trim(); |
| note | const | 924 | no | const note = addNote(db, { text, tier: flags.tier \|\| &#39;now&#39;, project: flags.project, key: flags.key, origin: flags.origin \|\| &#39;user&#39;, confidence: Number(flags.confidence \|\| 1), evidence: flags.evidence… |
| id | const | 933 | no | const id = positional[0]; |
| note | const | 935 | no | const note = promoteNote(db, { id, toTier: flags.to, confirmedByOwner: flags[&#39;owner-confirmed&#39;] === true }); |
| id | const | 940 | no | const id = positional[0]; |
| ok | const | 942 | no | const ok = archiveNote(db, { id }); |
| notes | const | 947 | no | const notes = listNotes(db, { limit: 100000 }); |
| notes | const | 952 | no | const notes = listNotes(db, { tier: flags.tier, project: flags.project, query: flags.query, limit: Number(flags.limit \|\| 50) }); |
| cmdRecall | function | 960 | no | async function cmdRecall(positional, flags) { |
| query | const | 962 | no | const query = positional.join(&#39; &#39;).trim(); |
| notes | const | 965 | no | const notes = searchNotes(db, { query, limit: Number(flags.limit \|\| 20) }); |
| cmdTodos | function | 972 | no | async function cmdTodos(positional, flags) { |
| rows | const | 974 | no | const rows = db.prepare(` SELECT a.line, a.kind, a.text, a.owner, f.path, p.name AS project FROM annotations a JOIN files f ON f.id = a.file_id JOIN projects p ON p.id = a.project_id WHERE a.kind = &#39;… |
| lines | const | 984 | no | const lines = [`${rows.length} open tasks`]; |
| cmdLint | function | 990 | no | async function cmdLint(flags) { |
| options | const | 993 | no | const options = profileOptions(config, &#39;lint&#39;); |
| projects | variable | 994 | no | let projects = projectsForIndex(root); |
| result | const | 996 | no | const result = timeSync(db, { operation: &#39;lint&#39;, project: flags.project }, () =&gt; lintProtocol({ db, root, projects, project: flags.project, changedOnly: flags.changed === true, maxFindings: Number(fl… |
| total | const | 1002 | no | const total = result.summary.findings; |
| shown | const | 1003 | no | const shown = result.summary.reported; |
| lines | const | 1004 | no | const lines = [`Protocol lint: ${total} finding(s) across ${result.summary.files} file(s)`]; |
| cmdVerify | function | 1011 | no | async function cmdVerify(flags) { |
| options | const | 1014 | no | const options = profileOptions(config, &#39;lint&#39;); |
| projects | const | 1015 | no | const projects = selectProjects(projectsForIndex(root), flags.project); |
| verifyStarted | const | 1020 | no | const verifyStarted = performance.now(); |
| lint | const | 1021 | no | const lint = lintProtocol({ db, root, projects, maxFindings: Number(flags[&#39;max-findings&#39;] \|\| options.lintMaxFindings \|\| 200), }); |
| stale | const | 1026 | no | const stale = await collectStale({ db, config, projects, capOverride: flags[&#39;max-file-bytes&#39;] }); |
| out | const | 1027 | no | const out = { |
| lines | const | 1039 | no | const lines = [ |
| cmdKg | function | 1049 | no | async function cmdKg(positional, flags) { |
| sub | const | 1050 | no | const sub = positional.shift(); |
| kg | const | 1057 | no | const kg = await import(&#39;../lib/kg-export.mjs&#39;); |
| outPath | const | 1058 | no | const outPath = resolve(String(flags.out ?? join(root, &#39;.hq&#39;, &#39;kg-exchange.jsonl&#39;))); |
| statePath | const | 1059 | no | const statePath = flags[&#39;no-state&#39;] ? null : resolve(String(flags.state ?? join(root, &#39;.hq&#39;, &#39;kg-export-state.json&#39;))); |
| result | const | 1060 | no | const result = kg.exportGraphExchange({ db, outPath, statePath }); |
| journal | const | 1072 | no | const journal = resolve(String(flags.journal ?? join(root, &#39;.hq&#39;, &#39;kg-journal.hqj&#39;))); |
| imp | const | 1073 | no | const imp = kg.importGraphExchange({ root, journal, exchange: outPath, namespace: kg.SOURCE_NAMESPACE }); |
| detail | const | 1075 | no | const detail = imp.reason === &#39;importer_not_packaged&#39; |
| ack | const | 1084 | no | const ack = statePath ? kg.acknowledgeGraphExport({ statePath, digest: result.digest, acknowledgment: { epochBefore: imp.epochBefore, epochAfter: imp.epochAfter, stats: imp.statsLine ?? undefined } }… |
| cmdWiki | function | 1090 | no | async function cmdWiki(positional, flags) { |
| sub | const | 1091 | no | const sub = positional.shift(); |
| projects | const | 1095 | no | const projects = projectsForIndex(root); |
| options | const | 1096 | no | const options = profileOptions(config, &#39;wiki&#39;); |
| tmp | const | 1099 | no | const tmp = mkdtempSync(join(tmpdir(), &#39;hq-wiki-check-&#39;)); |
| result | const | 1102 | no | const result = timeSync(db, { operation: &#39;wiki.check&#39; }, () =&gt; buildWiki({ db, root, projects, outDir: tmp, force: true, maxFilePages: options.wikiMaxFilePages, persistHashes: false })); |
| diff | const | 1103 | no | const diff = compareDirs(join(root, &#39;wiki&#39;), tmp); |
| out | const | 1106 | no | const out = { schema: &#39;hq.wiki-check/1&#39;, current: diff.length === 0, changed: diff }; |
| outDir | const | 1111 | no | const outDir = flags.out ? resolve(String(flags.out)) : join(root, &#39;wiki&#39;); |
| persistHashes | const | 1115 | no | const persistHashes = outDir === join(root, &#39;wiki&#39;); |
| graphIndex | const | 1118 | no | const graphIndex = flags.graph |
| result | const | 1121 | no | const result = timeSync(db, { operation: &#39;wiki&#39; }, () =&gt; buildWiki({ db, root, projects, outDir, force: flags.force === true, maxFilePages: options.wikiMaxFilePages, graphIndex, persistHashes })); |
| removedNote | const | 1123 | no | const removedNote = result.removed ? `, ${result.removed} removed` : &#39;&#39;; |
| cmdAnnotateV2 | function | 1129 | no | async function cmdAnnotateV2(positional, flags) { |
| target | const | 1132 | no | const target = positional.join(&#39; &#39;).trim(); |
| row | const | 1134 | no | const row = findFileRow(db, target, flags.project); |
| source | const | 1136 | no | const source = readFileSync(row.abs_path, &#39;utf8&#39;); |
| result | const | 1137 | no | const result = parseAnnotationV2(source, { path: row.path, projectId: row.project, contentHash: row.hash, schemaVersion: &#39;2&#39;, |
| r | const | 1144 | no | const r = getSemanticId(db, id); |
| out | const | 1149 | no | const out = { schema: ANNOTATION_V2_SCHEMA, ...result }; |
| lines | const | 1151 | no | const lines = [ |
| cmdSemantic | function | 1167 | no | async function cmdSemantic(positional, flags) { |
| action | const | 1170 | no | const action = positional.shift() \|\| &#39;list&#39;; |
| rows | const | 1172 | no | const rows = listSemanticIds(db, { kind: flags.kind \|\| null, status: flags.status \|\| null, limit: Number(flags.limit \|\| 100), }); |
| out | const | 1177 | no | const out = { schema: SEMANTIC_REGISTRY_SCHEMA, action: &#39;list&#39;, semanticIds: rows }; |
| id | const | 1182 | no | const id = positional[0]; |
| row | const | 1184 | no | const row = getSemanticId(db, id); |
| out | const | 1186 | no | const out = { schema: SEMANTIC_REGISTRY_SCHEMA, action: &#39;show&#39;, semanticId: row }; |
| report | const | 1195 | no | const report = detectSemanticDrift(db, { root }); |
| out | const | 1196 | no | const out = { schema: &#39;hq.semantic-drift/1&#39;, action: &#39;drift&#39;, checked: report.checked, drift: report }; |
| lines | const | 1197 | no | const lines = [`Drift checked ${report.checked} link(s)`]; |
| cmdWikiProgram | function | 1211 | no | async function cmdWikiProgram(positional, flags) { |
| action | const | 1214 | no | const action = positional.shift() \|\| &#39;show&#39;; |
| id | const | 1216 | no | const id = positional[0]; |
| active | const | 1218 | no | const active = getActiveProgram(db, id); |
| out | const | 1220 | no | const out = { schema: WIKI_PROGRAM_SCHEMA, action: &#39;show&#39;, active }; |
| id | const | 1229 | no | const id = positional[0]; |
| rows | const | 1230 | no | const rows = listProgramVersions(db, id ? { id } : {}); |
| out | const | 1231 | no | const out = { schema: WIKI_PROGRAM_SCHEMA, action: &#39;versions&#39;, versions: rows }; |
| file | const | 1236 | no | const file = positional[0]; |
| config | const | 1238 | no | const config = JSON.parse(readFileSync(resolve(String(file)), &#39;utf8&#39;)); |
| result | const | 1239 | no | const result = previewProgram(db, config); |
| out | const | 1240 | no | const out = { schema: WIKI_PROGRAM_SCHEMA, action: &#39;preview&#39;, ...result }; |
| file | const | 1247 | no | const file = positional[0]; |
| config | const | 1249 | no | const config = JSON.parse(readFileSync(resolve(String(file)), &#39;utf8&#39;)); |
| result | const | 1250 | no | const result = activateProgram(db, config, { ownerConfirmed: true, receipt: { kind: &#39;wiki-program&#39;, source: &#39;cli&#39; } }); |
| extra | const | 1252 | no | const extra = result.errors ? &#39; &#39; + result.errors.map((e) =&gt; e.message).join(&#39;; &#39;) : &#39;&#39;; |
| out | const | 1255 | no | const out = { schema: WIKI_PROGRAM_SCHEMA, action: &#39;activate&#39;, ...result }; |
| id | const | 1261 | no | const id = flags.id; |
| toVersion | const | 1262 | no | const toVersion = flags[&#39;to-version&#39;] != null ? Number(flags[&#39;to-version&#39;]) : null; |
| result | const | 1264 | no | const result = rollbackProgram(db, { id, toVersion, ownerConfirmed: true, receipt: { kind: &#39;wiki-program&#39;, source: &#39;cli&#39; } }); |
| out | const | 1266 | no | const out = { schema: WIKI_PROGRAM_SCHEMA, action: &#39;rollback&#39;, ...result }; |
| walkFiles | function | 1276 | no | function walkFiles(dir, base = dir, acc = []) { |
| full | const | 1279 | no | const full = join(dir, entry.name); |
| compareDirs | function | 1286 | no | function compareDirs(a, b) { |
| left | const | 1287 | no | const left = new Set(walkFiles(a)); |
| right | const | 1288 | no | const right = new Set(walkFiles(b)); |
| changed | const | 1289 | no | const changed = []; |
| cmdHome | function | 1298 | no | async function cmdHome(flags) { |
| projects | const | 1304 | no | const projects = projectsForIndex(root); |
| rows | const | 1305 | no | const rows = projectRows(db); |
| briefResult | const | 1306 | no | const briefResult = brief(db, { root, projects, audience: &#39;owner&#39;, maxBytes: 4000 }); |
| recent | const | 1307 | no | const recent = queryCommits(db, { limit: 12 }); |
| notes | const | 1308 | no | const notes = listNotes(db, { limit: 20 }); |
| cards | const | 1309 | no | const cards = rows.map((p) =&gt; projectCard(db, p)); |
| data | const | 1310 | no | const data = { |
| html | const | 1320 | no | const html = renderHome(data); |
| out | const | 1322 | no | const out = flags.out ? resolve(String(flags.out)) : join(root, &#39;home.html&#39;); |
| cmdAsk | function | 1331 | no | async function cmdAsk(positional, flags) { |
| askStarted | const | 1333 | no | const askStarted = performance.now(); |
| question | const | 1334 | no | const question = positional.join(&#39; &#39;).trim(); |
| routing | const | 1336 | no | const routing = routeAsk(question, { audience: flags.audience \|\| &#39;owner&#39; }); |
| result | variable | 1337 | no | let result = null; |
| row | const | 1349 | no | const row = findFileRow(db, routing.args.path \|\| question, flags.project); |
| out | const | 1377 | no | const out = { schema: &#39;hq.ask/1&#39;, routing, result }; |
| lines | const | 1379 | no | const lines = [routing.explanation, &#39;&#39;, `Intent: ${routing.intent} — ${routing.command} ${JSON.stringify(routing.args)}`]; |
| cmdFeed | function | 1388 | no | async function cmdFeed(flags) { |
| projects | const | 1391 | no | const projects = projectsForIndex(root); |
| dir | const | 1392 | no | const dir = join(root, &#39;feed&#39;); |
| jsonPath | const | 1393 | no | const jsonPath = join(dir, &#39;hq-feed.json&#39;); |
| mdPath | const | 1394 | no | const mdPath = join(dir, &#39;HQ-FEED.md&#39;); |
| result | const | 1398 | no | const result = checkFeed(db, { root, projects, committedJson: readFileSync(jsonPath, &#39;utf8&#39;), committedMarkdown: readFileSync(mdPath, &#39;utf8&#39;) }); |
| DEFAULT_MEDIA_STORE_DIR | const | 1419 | no | const DEFAULT_MEDIA_STORE_DIR = &#39;C:/VIVIM/channel/vivim/torrent-store&#39;; |
| mediaBackupDir | function | 1421 | no | function mediaBackupDir() { |
| cmdMedia | function | 1425 | no | async function cmdMedia(positional, flags) { |
| action | const | 1426 | no | const action = positional[0] \|\| &#39;status&#39;; |
| poll | const | 1427 | no | const poll = await import(&#39;../lib/torrent/poll.mjs&#39;); |
| wantedLib | const | 1428 | no | const wantedLib = await import(&#39;../lib/torrent/wanted.mjs&#39;); |
| libraryLib | const | 1429 | no | const libraryLib = await import(&#39;../lib/torrent/library.mjs&#39;); |
| releasesLib | const | 1430 | no | const releasesLib = await import(&#39;../lib/torrent/releases.mjs&#39;); |
| storeDir | const | 1431 | no | const storeDir = flags.store ? resolve(String(flags.store)) : DEFAULT_MEDIA_STORE_DIR; |
| paths | const | 1432 | no | const paths = poll.storePaths(storeDir); |
| wanted | const | 1435 | no | const wanted = wantedLib.loadWanted(paths.wanted); |
| library | const | 1436 | no | const library = libraryLib.listLibrary(paths.library); |
| favorites | const | 1437 | no | const favorites = libraryLib.listFavorites(paths.favorites); |
| releases | const | 1438 | no | const releases = releasesLib.loadReleases(paths.releases); |
| journal | const | 1439 | no | const journal = wantedLib.readJournal(paths.journal); |
| tail | const | 1440 | no | const tail = journal.slice(-5).map((r) =&gt; { const who = r.id ? ` ${r.id}` : r.title ? ` ${r.title}` : &#39;&#39;; return ` #${r.seq} ${r.at} ${r.kind}${who}`; }); |
| who | const | 1441 | no | const who = r.id ? ` ${r.id}` : r.title ? ` ${r.title}` : &#39;&#39;; |
| text | const | 1444 | no | const text = [ |
| wanted | const | 1460 | no | const wanted = wantedLib.loadWanted(paths.wanted); |
| favorites | const | 1461 | no | const favorites = new Set(libraryLib.listFavorites(paths.favorites).map((f) =&gt; f.id)); |
| lines | const | 1462 | no | const lines = wanted.entries.map((e) =&gt; { const last = e.lastDispatchedEpisode ? `S${String(e.lastDispatchedEpisode.season).padStart(2, &#39;0&#39;)}E${String(e.lastDispatchedEpisode.episode).padStart(2, &#39;0&#39;… |
| last | const | 1463 | no | const last = e.lastDispatchedEpisode |
| source | const | 1466 | no | const source = (e.provenance &amp;&amp; e.provenance.source) \|\| e.source; |
| text | const | 1469 | no | const text = [`My Media — tracked titles (${wanted.entries.length}):`, ...(lines.length ? lines : [&#39; (none — seed with seedWantedFromHistory or add on the owner surface)&#39;])].join(&#39;\\n&#39;); |
| library | const | 1475 | no | const library = libraryLib.listLibrary(paths.library); |
| lines | const | 1476 | no | const lines = library.map((r) =&gt; { const hash = r.infoHash ? ` · ${String(r.infoHash).slice(0, 12)}` : &#39;&#39;; return ` ${r.id} · ${r.title} · ${r.state}${hash}${r.arrivedAt ? ` · arrived ${r.arrivedAt}`… |
| hash | const | 1477 | no | const hash = r.infoHash ? ` · ${String(r.infoHash).slice(0, 12)}` : &#39;&#39;; |
| text | const | 1480 | no | const text = [`My Media — library (${library.length}):`, ...(lines.length ? lines : [&#39; (empty)&#39;])].join(&#39;\\n&#39;); |
| releases | const | 1486 | no | const releases = releasesLib.loadReleases(paths.releases); |
| fmt | function | 1487 | no | const fmt = (ep) =&gt; (ep ? `S${String(ep.season).padStart(2, &#39;0&#39;)}E${String(ep.number).padStart(2, &#39;0&#39;)} @ ${ep.airstamp}` : &#39;—&#39;); |
| lines | const | 1488 | no | const lines = releases.entries.map((r) =&gt; { const note = r.error ? ` · error: ${r.error}` : r.reason ? ` · ${r.reason}` : &#39;&#39;; return ` ${r.title} · next: ${fmt(r.next)} · latest aired: ${fmt(r.latest… |
| note | const | 1489 | no | const note = r.error ? ` · error: ${r.error}` : r.reason ? ` · ${r.reason}` : &#39;&#39;; |
| text | const | 1492 | no | const text = [`My Media — next-episode tracker (${releases.entries.length}):`, ...(lines.length ? lines : [&#39; (no tracked shows yet — run: hq media poll)&#39;])].join(&#39;\\n&#39;); |
| limit | const | 1498 | no | const limit = Math.max(0, Math.floor(Number(flags.limit ?? 0) \|\| 0)); |
| port | const | 1499 | no | const port = Number(flags.port \|\| 9222); |
| adapter | variable | 1500 | no | let adapter = null; |
| adapterNote | variable | 1501 | no | let adapterNote = null; |
| summary | variable | 1508 | no | let summary; |
| text | const | 1521 | no | const text = [ |
| cmdVivim | function | 1536 | no | async function cmdVivim(positional, flags) { |
| vivim | const | 1538 | no | const vivim = await import(&#39;../lib/vivim.mjs&#39;); |
| projects | const | 1539 | no | const projects = projectsForIndex(root); |
| action | const | 1540 | no | const action = positional[0] \|\| &#39;status&#39;; |
| result | const | 1543 | no | const result = vivim.syncVivim(db, { root, projects }); |
| counts | const | 1545 | no | const counts = result.counts; |
| crosswalk | const | 1546 | no | const crosswalk = result.crosswalk |
| line | const | 1549 | no | const line = [ |
| alignment | const | 1560 | no | const alignment = vivim.readAlignment(db, { detail: flags.full ? &#39;full&#39; : &#39;summary&#39; }); |
| drift | const | 1561 | no | const drift = vivim.alignmentDrift(db, { root, projects }); |
| message | const | 1563 | no | const message = &#39;VIVIM feed not synced. Run: hq vivim sync&#39;; |
| text | const | 1567 | no | const text = [ |
| drift | const | 1577 | no | const drift = vivim.alignmentDrift(db, { root, projects }); |
| alignment | const | 1578 | no | const alignment = vivim.readAlignment(db, { detail: &#39;summary&#39; }); |
| reasons | const | 1579 | no | const reasons = [...drift.reasons]; |
| unique | const | 1587 | no | const unique = [...new Set(reasons)].sort(); |
| ok | const | 1588 | no | const ok = unique.length === 0; |
| id | const | 1595 | no | const id = positional[1]; |
| explained | const | 1598 | no | const explained = vivim.explainVivimRecord(db, { id }); |
| records | const | 1600 | no | const records = explained.records; |
| lines | const | 1601 | no | const lines = []; |
| rel | const | 1613 | no | const rel = explained.relationships; |
| shown | const | 1619 | no | const shown = rel.journeys.slice(0, 6).map((j) =&gt; `${j.id}${j.stronger ? &#39;*&#39; : &#39;&#39;}`).join(&#39;, &#39;); |
| unresolved | const | 1623 | no | const unresolved = rel.code.unresolved.length ? ` · ${rel.code.unresolved.length} unresolved` : &#39;&#39;; |
| safeJson | function | 1642 | no | function safeJson(text) { |
| kbUsage | function | 1653 | no | function kbUsage() { |
| readKbPackageDir | function | 1678 | no | function readKbPackageDir(dir) { |
| abs | const | 1679 | no | const abs = resolve(String(dir)); |
| manifestPath | const | 1680 | no | const manifestPath = join(abs, &#39;manifest.json&#39;); |
| manifest | variable | 1684 | no | let manifest; |
| files | const | 1690 | no | const files = []; |
| walk | function | 1691 | no | const walk = (current, prefix) =&gt; { |
| entries | variable | 1692 | no | let entries; |
| rel | const | 1695 | no | const rel = prefix ? `${prefix}/${entry.name}` : entry.name; |
| cmdCapabilities | function | 1711 | no | async function cmdCapabilities(positional, flags) { |
| action | const | 1712 | no | const action = positional.shift() \|\| &#39;status&#39;; |
| target | const | 1716 | no | const target = positional[0]; |
| scan | const | 1718 | no | const scan = scanCapabilitySource(resolve(String(target)), { id: flags.id \|\| null, project: flags.project \|\| null }); |
| result | const | 1719 | no | const result = persistCapabilityScan(db, scan); |
| out | const | 1720 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;scan&#39;, ...result, source: scan.source, stats: scan.stats }; |
| status | const | 1730 | no | const status = capabilityStatus(db); |
| sources | const | 1731 | no | const sources = listCapabilitySources(db); |
| out | const | 1732 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;status&#39;, ...status, sources }; |
| lines | const | 1733 | no | const lines = [`Capability registry — ${status.sources} source(s)`]; |
| rows | const | 1740 | no | const rows = listCapabilityPackages(db, { query: positional[0] \|\| null, limit: flags.limit }); |
| out | const | 1741 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;packages&#39;, packages: rows }; |
| name | const | 1746 | no | const name = positional[0]; |
| row | const | 1748 | no | const row = getCapabilityPackage(db, { sourceId: flags.source \|\| null, name }); |
| docs | const | 1750 | no | const docs = db.prepare(&#39;SELECT COUNT(*) AS n FROM capability_document WHERE source_id = ? AND install_path = ?&#39;).get(row.source_id, row.install_path).n; |
| maps | const | 1751 | no | const maps = db.prepare(&#39;SELECT node_id, score, reasons FROM capability_map WHERE source_id = ? AND install_path = ? ORDER BY score DESC&#39;).all(row.source_id, row.install_path); |
| out | const | 1752 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;package&#39;, package: row, documentCount: docs, maps }; |
| rows | const | 1764 | no | const rows = listCapabilityNodes(db, { domain: flags.domain \|\| null }); |
| out | const | 1765 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;nodes&#39;, nodes: rows }; |
| rows | const | 1770 | no | const rows = listCapabilityMaps(db, { nodeId: flags.node \|\| null, limit: flags.limit }); |
| out | const | 1771 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;map&#39;, mappings: rows }; |
| rows | const | 1776 | no | const rows = listCapabilityContracts(db, { status: flags.status \|\| null }); |
| out | const | 1777 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;contracts&#39;, contracts: rows }; |
| id | const | 1782 | no | const id = positional[0]; |
| row | const | 1784 | no | const row = getCapabilityContract(db, { id, version: flags.version \|\| null }); |
| out | const | 1786 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;contract&#39;, contract: row }; |
| query | const | 1797 | no | const query = positional.join(&#39; &#39;).trim(); |
| rows | const | 1799 | no | const rows = searchCapabilityDocuments(db, { query, limit: flags.limit }); |
| out | const | 1800 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;search&#39;, query, results: rows }; |
| result | const | 1806 | no | const result = writeCapabilitySchema(resolve(String(flags.schema))); |
| result | const | 1811 | no | const result = exportCapabilitySqlite(db, { path: resolve(String(flags.sqlite)), sourceId: flags.source \|\| null }); |
| out | const | 1815 | no | const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: &#39;export&#39;, kind: &#39;json&#39;, ...exportCapabilityJson(db, { sourceId: flags.source \|\| null }) }; |
| sessionsUsage | function | 1830 | no | function sessionsUsage() { |
| cmdSessions | function | 1845 | no | async function cmdSessions(positional, flags) { |
| action | const | 1846 | no | const action = positional.shift() \|\| &#39;list&#39;; |
| dir | const | 1852 | no | const dir = positional[0]; |
| usage | const | 1853 | no | const usage = &#39;usage: hq sessions import &lt;dir&gt; [--project &lt;name&gt;] [--limit n]&#39;; |
| importSessionDirectory | variable | 1855 | no | let importSessionDirectory; |
| report | const | 1861 | no | const report = importSessionDirectory(db, resolve(String(dir)), { project: flags.project \|\| null, limit: Number(flags.limit \|\| 0), }); |
| lines | const | 1865 | no | const lines = [ |
| rows | const | 1876 | no | const rows = sessionRows(db, { project: flags.project \|\| null, query: flags.query \|\| null, limit: Number(flags.limit \|\| 50), }); |
| out | const | 1881 | no | const out = { schema: SESSION_VIEWS_SCHEMA, count: rows.length, sessions: rows }; |
| id | const | 1887 | no | const id = positional[0]; |
| detail | const | 1889 | no | const detail = sessionDetail(db, { id }); |
| lines | const | 1891 | no | const lines = [ |
| days | const | 1906 | no | const days = sessionTimeline(db, { limit: Number(flags.limit \|\| 30) }); |
| out | const | 1907 | no | const out = { schema: &#39;hq.session-timeline/1&#39;, days }; |
| lines | const | 1908 | no | const lines = days.length |
| usage | const | 1916 | no | const usage = toolUsage(db); |
| out | const | 1917 | no | const out = { schema: &#39;hq.session-tools/1&#39;, tools: usage }; |
| lines | const | 1918 | no | const lines = usage.length |
| cmdTeam | function | 1935 | no | async function cmdTeam(positional, flags) { |
| usage | const | 1936 | no | const usage = &#39;usage: hq team [--json] [--verbose] [--write-state] [--state-file &lt;path&gt;] [--agents-dir &lt;dir&gt;] [--channel-root &lt;dir&gt;]&#39;; |
| snapshot | const | 1938 | no | const snapshot = buildTeamSnapshot({ agentsDir: flags[&#39;agents-dir&#39;] \|\| undefined, channelRoot: flags[&#39;channel-root&#39;] \|\| undefined, liveWindowMinutes: Number(flags[&#39;live-minutes&#39;] \|\| 30), }); |
| out | const | 1944 | no | const out = flags[&#39;state-file&#39;] \|\| &#39;C:/VIVIM/channel/team-state.json&#39;; |
| cmdCanvas | function | 1958 | no | async function cmdCanvas(positional, flags) { |
| usage | const | 1959 | no | const usage = &#39;usage: hq canvas [--out &lt;dir&gt;] [--json] [--no-ref] [--agents-dir &lt;dir&gt;]&#39;; |
| snapshot | const | 1962 | no | const snapshot = buildTeamSnapshot({ agentsDir: typeof flags[&#39;agents-dir&#39;] === &#39;string&#39; ? flags[&#39;agents-dir&#39;] : undefined, }); |
| model | const | 1965 | no | const model = buildCanvasModel({ snapshot }); |
| html | const | 1966 | no | const html = renderCanvasFragment(model); |
| outDir | const | 1967 | no | const outDir = resolve(typeof flags.out === &#39;string&#39; ? flags.out : &#39;.hq/canvas&#39;); |
| outPath | const | 1969 | no | const outPath = toPosix(join(outDir, &#39;hq-canvas.html&#39;)); |
| bytes | const | 1971 | no | const bytes = Buffer.byteLength(html, &#39;utf8&#39;); |
| seatCount | const | 1976 | no | const seatCount = model.seats === null ? &#39;?&#39; : model.seats.length; |
| providerCount | const | 1977 | no | const providerCount = model.providers === null ? &#39;?&#39; : model.providers.length; |
| lines | const | 1978 | no | const lines = [ |
| cmdPm | function | 1994 | no | async function cmdPm(positional, flags) { |
| usage | const | 1995 | no | const usage = &#39;usage: hq pm [--json] [--out &lt;dir&gt;] [--no-ref] [--qeue-dir &lt;dir&gt;] [--initiatives &lt;file&gt;] [--tasks-file &lt;file&gt;]&#39;; |
| readIfPresent | function | 1998 | no | const readIfPresent = (file) =&gt; { |
| qeueDir | const | 2005 | no | const qeueDir = resolve(typeof flags[&#39;qeue-dir&#39;] === &#39;string&#39; ? flags[&#39;qeue-dir&#39;] : &#39;qeue&#39;); |
| initiativesFile | const | 2006 | no | const initiativesFile = resolve(typeof flags.initiatives === &#39;string&#39; ? flags.initiatives : &#39;docs/integration/STRATEGIC-INITIATIVES.md&#39;); |
| tasksFile | const | 2007 | no | const tasksFile = resolve(typeof flags[&#39;tasks-file&#39;] === &#39;string&#39; ? flags[&#39;tasks-file&#39;] : &#39;C:/VIVIM/channel/tasks/active-tasks.md&#39;); |
| model | const | 2008 | no | const model = buildPortfolio({ qeueDir, initiativesText: readIfPresent(initiativesFile), tasksText: readIfPresent(tasksFile), now: Date.now(), |
| html | const | 2014 | no | const html = renderPortfolioFragment(model); |
| outDir | const | 2015 | no | const outDir = resolve(typeof flags.out === &#39;string&#39; ? flags.out : &#39;.hq/canvas&#39;); |
| outPath | const | 2017 | no | const outPath = toPosix(join(outDir, &#39;hq-pm.html&#39;)); |
| bytes | const | 2019 | no | const bytes = Buffer.byteLength(html, &#39;utf8&#39;); |
| lines | const | 2024 | no | const lines = [ |
| cmdRouteModel | function | 2039 | no | async function cmdRouteModel(positional, flags) { |
| usage | const | 2040 | no | const usage = &#39;usage: hq route-model [--json] [--apply] [--agents-dir &lt;dir&gt;] [--policy &lt;file&gt;] [--hours &lt;n&gt;]&#39;; |
| home | const | 2043 | no | const home = process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;; |
| dbPath | const | 2044 | no | const dbPath = join(home, &#39;.zcode&#39;, &#39;cli&#39;, &#39;db&#39;, &#39;db.sqlite&#39;); |
| hours | const | 2045 | no | const hours = Number(flags.hours \|\| 5); |
| now | const | 2046 | no | const now = Date.now(); |
| windowMs | const | 2047 | no | const windowMs = hours * 60 * 60 * 1000; |
| usageRows | variable | 2049 | no | let usageRows = []; |
| db | variable | 2050 | no | let db; |
| stats | const | 2059 | no | const stats = summarizeUsage(usageRows, { now, windowMs }); |
| depotCatalog | variable | 2061 | no | let depotCatalog = null; |
| catalogPath | const | 2062 | no | const catalogPath = join(home, &#39;.zcode&#39;, &#39;provider-depot&#39;, &#39;catalog.json&#39;); |
| catalog | const | 2064 | no | const catalog = buildCatalog({ depotCatalog, observed: [...stats.keys()] }); |
| agentsDir | const | 2066 | no | const agentsDir = flags[&#39;agents-dir&#39;] \|\| join(home, &#39;.zcode&#39;, &#39;agents&#39;); |
| files | const | 2067 | no | const files = collectAgentFiles(agentsDir); |
| agents | const | 2068 | no | const agents = files.map((f) =&gt; { const a = parseAgentFile(f.text, f.file); return { name: a.name \|\| f.file.replace(/\\.md$/, &#39;&#39;), model: a.model \|\| &#39;inherit&#39;, thoughtLevel: a.thoughtLevel \|\| null, fi… |
| a | const | 2069 | no | const a = parseAgentFile(f.text, f.file); |
| policy | variable | 2073 | no | let policy = { ...DEFAULT_POLICY }; |
| defaultPolicyPath | const | 2076 | no | const defaultPolicyPath = join(dirname(dirname(fileURLToPath(import.meta.url))), &#39;config&#39;, &#39;model-routing.policy.json&#39;); |
| policyPath | const | 2077 | no | const policyPath = flags.policy ? String(flags.policy) : (existsSync(defaultPolicyPath) ? defaultPolicyPath : null); |
| providerConfigPath | const | 2085 | no | const providerConfigPath = join(home, &#39;.zcode&#39;, &#39;v2&#39;, &#39;provider_config.json&#39;); |
| providerConfig | const | 2086 | no | const providerConfig = JSON.parse(readFileSync(providerConfigPath, &#39;utf8&#39;)); |
| budgetStatus | variable | 2089 | no | let budgetStatus = {}; |
| budgetSummary | variable | 2090 | no | let budgetSummary = { funded: 0, warn: 0, blocked: 0 }; |
| apply | const | 2100 | no | const apply = shouldApply(flags); |
| plan | const | 2101 | no | const plan = planRoutes({ agents, usage: usageRows, catalog: Object.fromEntries(catalog), policy, now, budgetStatus }); |
| applied | const | 2103 | no | const applied = []; |
| stamp | const | 2105 | no | const stamp = new Date().toISOString().replace(/[:.]/g, &#39;-&#39;); |
| agent | const | 2107 | no | const agent = agents.find((a) =&gt; a.name === route.agent); |
| before | const | 2109 | no | const before = readFileSync(agent.path, &#39;utf8&#39;); |
| after | variable | 2113 | no | let after = before.replace(/^model:\\s*.*$/m, `model: ${route.to}`); |
| lines | const | 2125 | no | const lines = []; |
| dead | const | 2127 | no | const dead = []; |
| health | const | 2129 | no | const health = classifyHealth(rec); |
| groups | const | 2138 | no | const groups = new Map(); |
| g | const | 2140 | no | const g = groups.get(r.to) \|\| { to: r.to, reason: r.reason, thoughtLevel: r.thoughtLevel ?? null, agents: [], from: new Set(), saving: 0 }; |
| rejected | const | 2152 | no | const rejected = g.reason.match(/rejected cheaper option (.*)$/); |
| skipReasons | const | 2164 | no | const skipReasons = new Map(); |
| list | const | 2166 | no | const list = skipReasons.get(s.reason) \|\| []; |
| cmdSeat | function | 2192 | no | async function cmdSeat(positional, flags) { |
| action | const | 2193 | no | const action = positional.shift() \|\| &#39;list&#39;; |
| root | const | 2194 | no | const root = String(flags.root \|\| process.env.HQ_CHANNEL_ROOT \|\| DEFAULT_CHANNEL_ROOT); |
| idleMinutes | const | 2195 | no | const idleMinutes = Number(flags[&#39;idle-minutes&#39;] \|\| DEFAULT_IDLE_MINUTES); |
| usage | const | 2196 | no | const usage = [ |
| doc | const | 2218 | no | const doc = loadSeats(root); |
| live | const | 2219 | no | const live = readLivenessMap(); |
| table | const | 2220 | no | const table = renderSeatTable(doc, (sid) =&gt; live.get(sid) ?? null, { idleMinutes }); |
| seatId | const | 2226 | no | const seatId = positional[0]; |
| prompt | const | 2228 | no | const prompt = typeof flags.prompt === &#39;string&#39; ? flags.prompt : positional.slice(1).join(&#39; &#39;); |
| waitSec | const | 2229 | no | const waitSec = Math.max(10, Number(flags.wait \|\| 180)); |
| live | const | 2230 | no | const live = readLivenessMap(); |
| out | const | 2231 | no | const out = wakeSeat({ root, seatId, prompt, reason: typeof flags.reason === &#39;string&#39; ? flags.reason : null, |
| lines | const | 2242 | no | const lines = [`${out.decision} ${out.code} — ${out.detail}`]; |
| seatId | const | 2257 | no | const seatId = positional[0]; |
| out | const | 2259 | no | const out = verifySeat({ root, seatId, id: typeof flags.id === &#39;string&#39; ? flags.id : null, confirm: (sid, id) =&gt; confirmWake(sid, id), |
| late | const | 2269 | no | const late = lateReplyFor(root, out.id, lateReply); |
| lines | const | 2277 | no | const lines = [`${out.decision} ${out.code} — ${out.detail}`]; |
| cmdChannel | function | 2295 | no | async function cmdChannel(positional, flags) { |
| action | const | 2296 | no | const action = positional.shift() \|\| &#39;&#39;; |
| usage | const | 2297 | no | const usage = [ |
| root | const | 2314 | no | const root = String(flags.root \|\| process.env.HQ_CHANNEL_ROOT \|\| DEFAULT_CHANNEL_ROOT); |
| stateFile | const | 2315 | no | const stateFile = String(flags[&#39;state-file&#39;] \|\| join(root, &#39;wake-state.json&#39;)); |
| seat | const | 2316 | no | const seat = typeof flags.wake === &#39;string&#39; ? flags.wake : null; |
| awaited | const | 2317 | no | const awaited = new Set([].concat(flags.await ?? []).map(String)); |
| hqSelf | const | 2318 | no | const hqSelf = fileURLToPath(import.meta.url); |
| syncScript | const | 2319 | no | const syncScript = join(dirname(hqSelf), &#39;..&#39;, &#39;..&#39;, &#39;scripts&#39;, &#39;sync.mjs&#39;); |
| loadState | function | 2321 | no | const loadState = () =&gt; { |
| doc | const | 2323 | no | const doc = JSON.parse(readFileSync(stateFile, &#39;utf8&#39;)); |
| saveState | function | 2329 | no | const saveState = (snapshot) =&gt; { |
| tmp | const | 2331 | no | const tmp = `${stateFile}.tmp-${process.pid}`; |
| busSend | function | 2335 | no | const busSend = (body) =&gt; { |
| r | const | 2336 | no | const r = spawnSync(process.execPath, [syncScript, &#39;send&#39;, &#39;--from&#39;, &#39;channel-wake&#39;, &#39;--to&#39;, &#39;*&#39;, &#39;--kind&#39;, &#39;status&#39;, &#39;--topic&#39;, &#39;channel-outcome&#39;, &#39;--body&#39;, body], { encoding: &#39;utf8&#39;, windowsHide: t… |
| wakeSeatFor | function | 2340 | no | const wakeSeatFor = (event) =&gt; { |
| prompt | const | 2341 | no | const prompt = `channel-wake: request ${event.id} ${event.to} — an awaited outcome landed; resume that work if this is yours`; |
| r | const | 2342 | no | const r = spawnSync(process.execPath, [hqSelf, &#39;seat&#39;, &#39;wake&#39;, seat, &#39;--prompt&#39;, prompt, &#39;--reason&#39;, &#39;channel-wake&#39;], { encoding: &#39;utf8&#39;, windowsHide: true }); |
| woken | const | 2348 | no | const woken = new Set(); |
| handleEvents | function | 2349 | no | const handleEvents = (events) =&gt; { |
| body | const | 2351 | no | const body = describeEvent(e); |
| before | const | 2363 | no | const before = loadState(); |
| after | const | 2364 | no | const after = scanChannel(root); |
| events | const | 2365 | no | const events = before ? diffEvents(before, after) : []; // first run = baseline only |
| seeded | const | 2375 | no | const seeded = loadState(); |
| current | variable | 2376 | no | let current = seeded ?? scanChannel(root); |
| DEBOUNCE_MS | const | 2378 | no | const DEBOUNCE_MS = 250; |
| timer | variable | 2379 | no | let timer = null; |
| rescan | function | 2380 | no | const rescan = () =&gt; { |
| after | const | 2382 | no | const after = scanChannel(root); |
| events | const | 2383 | no | const events = diffEvents(current, after); |
| schedule | function | 2389 | no | const schedule = () =&gt; { |
| watchers | const | 2393 | no | const watchers = []; |
| cmdCoordination | function | 2418 | no | async function cmdCoordination(positional, flags) { |
| action | const | 2419 | no | const action = positional.shift() \|\| &#39;status&#39;; |
| root | const | 2420 | no | const root = String(flags.root \|\| process.env.HQ_CHANNEL_ROOT \|\| DEFAULT_CHANNEL_ROOT); |
| usage | const | 2421 | no | const usage = [ |
| prompt | const | 2450 | no | const prompt = typeof flags.prompt === &#39;string&#39; ? flags.prompt : null; |
| grant | variable | 2454 | no | let grant = null; |
| text | variable | 2456 | no | let text = null; |
| out | const | 2460 | no | const out = { schema: BROKER_SCHEMA, decision: &#39;DENIED&#39;, code: &#39;GRANT_FILE_UNREADABLE&#39;, detail: `cannot read the grant file at ${resolve(flags[&#39;grant-file&#39;])}: ${error.message}` }; |
| out | const | 2467 | no | const out = { schema: BROKER_SCHEMA, decision: &#39;DENIED&#39;, code: &#39;GRANT_FILE_INVALID_JSON&#39;, detail: `the grant file at ${resolve(flags[&#39;grant-file&#39;])} is not valid JSON: ${error.message}` }; |
| out | const | 2472 | no | const out = submitRequest({ root, originSeat: typeof flags.seat === &#39;string&#39; ? flags.seat : positional[0], taskId: typeof flags.task === &#39;string&#39; ? flags.task : null, threadKey: typeof flags.thread =… |
| lines | const | 2486 | no | const lines = [`${out.decision} ${out.code ?? &#39;&#39;} — ${out.detail}`.trim()]; |
| transport | variable | 2499 | no | let transport = null; |
| summary | const | 2505 | no | const summary = await drain({ root, transport }); |
| mine | const | 2508 | no | const mine = summary.results.find((r) =&gt; r.requestId === out.requestId); |
| table | const | 2523 | no | const table = renderQueueTable(root); |
| requestId | const | 2529 | no | const requestId = positional[0]; |
| file | const | 2532 | no | const file = join(root, &#39;broker&#39;, &#39;receipts&#39;, `${requestId}.json`); |
| receipt | const | 2534 | no | const receipt = JSON.parse(await readFile(file, &#39;utf8&#39;)); |
| lines | const | 2535 | no | const lines = [ |
| lines | const | 2545 | no | const lines = [`no receipt yet for ${requestId} · state ${state}`, file]; |
| requestId | const | 2553 | no | const requestId = positional[0]; |
| out | const | 2555 | no | const out = cancelPending({ root, requestId, actor: typeof flags.actor === &#39;string&#39; ? flags.actor : &#39;hq-cli&#39; }); |
| requestId | const | 2561 | no | const requestId = positional[0]; |
| replyText | variable | 2563 | no | let replyText = typeof flags.reply === &#39;string&#39; ? flags.reply : null; |
| out | const | 2573 | no | const out = recordReply({ root, requestId, replyText }); |
| lines | const | 2574 | no | const lines = [ |
| cmdAutonomy | function | 2596 | no | async function cmdAutonomy(positional, flags) { |
| action | const | 2597 | no | const action = positional.shift() \|\| &#39;run&#39;; |
| usage | const | 2598 | no | const usage = [ |
| argv | const | 2619 | no | const argv = []; |
| valued | const | 2621 | no | const valued = [ |
| value | const | 2632 | no | const value = flags[key]; |
| result | const | 2643 | no | const result = runAutonomy({ argv, cwd: findRoot(), stdout: (line) =&gt; process.stdout.write(`${line}\\n`), stderr: (line) =&gt; process.stderr.write(`${line}\\n`), |
| cmdWork | function | 2657 | no | async function cmdWork(positional, flags) { |
| action | const | 2658 | no | const action = positional.shift() \|\| &#39;list&#39;; |
| usage | const | 2659 | no | const usage = [ |
| ordersPath | const | 2677 | no | const ordersPath = typeof flags.orders === &#39;string&#39; |
| text | variable | 2684 | no | let text; |
| doc | variable | 2691 | no | let doc = null; |
| check | const | 2693 | no | const check = validateDoc(doc); |
| report | const | 2697 | no | const report = [`work: ORDERS_INVALID — ${check.errors.join(&#39;,&#39;)}`, |
| lines | const | 2704 | no | const lines = renderOrders(doc); |
| id | const | 2709 | no | const id = positional[0]; |
| at | const | 2711 | no | const at = typeof flags.at === &#39;string&#39; ? flags.at : new Date().toISOString(); |
| next | variable | 2713 | no | let next; |
| after | const | 2724 | no | const after = validateDoc(next); |
| tmpPath | const | 2730 | no | const tmpPath = join(dirname(ordersPath), `.${basename(ordersPath)}.${process.pid}.tmp`); |
| written | const | 2739 | no | const written = next.orders.find((order) =&gt; order.id === id) ?? null; |
| line | const | 2740 | no | const line = action === &#39;claim&#39; |
| cmdReview | function | 2751 | no | async function cmdReview(positional, flags) { |
| n | const | 2752 | no | const n = Number(positional[0] ?? flags.n ?? 3); |
| ordersPath | const | 2755 | no | const ordersPath = typeof flags.orders === &#39;string&#39; |
| text | variable | 2758 | no | let text; |
| doc | variable | 2760 | no | let doc; |
| orders | const | 2763 | no | const orders = Array.isArray(doc?.orders) ? doc.orders : []; |
| completed | const | 2764 | no | const completed = orders.filter((o) =&gt; o.status === &#39;done&#39; \|\| o.status === &#39;blocked&#39; \|\| o.status === &#39;cancelled&#39;); |
| cycle | const | 2765 | no | const cycle = completed.length; |
| verdict | const | 2767 | no | const verdict = reviewGate(completed, n, cycle); |
| lines | const | 2769 | no | const lines = [ |
| cmdConsole | function | 2792 | no | async function cmdConsole(flags) { |
| rules | const | 2794 | no | const rules = []; |
| loaded | const | 2797 | no | const loaded = loadProviderRules(); |
| rows | const | 2801 | no | const rows = buildRows(rules, [], Date.now()); |
| blocked | const | 2803 | no | const blocked = rows.filter((r) =&gt; r.health.state === &#39;budget-blocked&#39; \|\| r.health.state === &#39;capped&#39; \|\| r.health.state === &#39;broken&#39;); |
| cmdComms | function | 2810 | no | async function cmdComms(flags) { |
| toolkit | const | 2821 | no | const toolkit = typeof flags.toolkit === &#39;string&#39; ? flags.toolkit : undefined; |
| channelRoot | const | 2822 | no | const channelRoot = typeof flags.root === &#39;string&#39; ? flags.root : DEFAULT_CHANNEL_ROOT; |
| parts | const | 2823 | no | const parts = { |
| roof | const | 2836 | no | const roof = buildRoof(parts); |
| actionCatalogCache | variable | 2845 | no | let actionCatalogCache = null; |
| actionCatalog | function | 2846 | no | async function actionCatalog() { |
| HANDLERS | variable | 2853 | no | let HANDLERS = {}; |
| expand | function | 2855 | no | let expand = (t) =&gt; [t]; |
| domains | const | 2857 | no | const domains = domainModules.flatMap((m) =&gt; m.DOMAINS); |
| cmdActions | function | 2862 | no | async function cmdActions(positional, flags) { |
| stats | const | 2877 | no | const stats = summarize(actions); |
| lines | const | 2879 | no | const lines = [ |
| query | const | 2888 | no | const query = positional.join(&#39; &#39;).trim().toLowerCase(); |
| rows | variable | 2889 | no | let rows = actions; |
| limit | const | 2895 | no | const limit = Number(flags.limit \|\| 40); |
| shown | const | 2896 | no | const shown = rows.slice(0, limit); |
| lines | const | 2897 | no | const lines = [`${rows.length} action(s)${rows.length &gt; shown.length ? `, showing ${shown.length}` : &#39;&#39;}`]; |
| cmdAction | function | 2904 | no | async function cmdAction(positional, flags) { |
| id | const | 2905 | no | const id = positional[0]; |
| a | const | 2908 | no | const a = actions.find((x) =&gt; x.id === id.toLowerCase()); |
| near | const | 2910 | no | const near = actions.filter((x) =&gt; x.id.includes(id.toLowerCase().split(&#39;.&#39;).pop())).slice(0, 3); |
| lines | const | 2913 | no | const lines = [ |
| out | const | 2925 | no | const out = spawnSync(a.handler.command.replace(&#39;&lt;object&gt;&#39;, positional[1] \|\| &#39;&#39;), { shell: true, encoding: &#39;utf8&#39;, windowsHide: true }); |
| fsfSources | function | 2936 | no | async function fsfSources() { |
| channelRoot | const | 2937 | no | const channelRoot = DEFAULT_CHANNEL_ROOT; |
| out | const | 2942 | no | const out = probeChannelEvidence(channelRoot); |
| file | const | 2946 | no | const file = join(process.cwd(), &#39;sync&#39;, &#39;ledger.jsonl&#39;); |
| lines | const | 2947 | no | const lines = existsSync(file) ? readFileSync(file, &#39;utf8&#39;).split(&#39;\\n&#39;).filter(Boolean) : []; |
| claims | const | 2948 | no | const claims = lines.map((l) =&gt; { try { return JSON.parse(l); } catch { return null; } }).filter((r) =&gt; r &amp;&amp; r.kind === &#39;claim&#39;).length; |
| a | const | 2953 | no | const a = approvalState({ file: join(channelRoot, &#39;control&#39;, &#39;approvals.jsonl&#39;) }); |
| r | const | 2954 | no | const r = revocationView({ file: join(channelRoot, &#39;control&#39;, &#39;revocations.jsonl&#39;) }); |
| cmdFsf | function | 2965 | no | async function cmdFsf(positional, flags) { |
| action | const | 2966 | no | const action = positional.shift() \|\| &#39;snapshot&#39;; |
| now | const | 2985 | no | const now = nowISO(); |
| slices | const | 2986 | no | const slices = await collectSlices({ now, sources: await fsfSources() }); |
| store | const | 2987 | no | const store = new FeedStore({ history: 5 }); |
| snap | const | 2988 | no | const snap = normalizeSnapshot(store.publish({ slices, now, refreshAfterMs: Number(flags[&#39;refresh-after&#39;] \|\| 5000) })); |
| degraded | const | 2989 | no | const degraded = Object.entries(snap.slices).filter(([, v]) =&gt; v.degraded).map(([k]) =&gt; k); |
| lines | const | 2990 | no | const lines = [ |
| token | const | 3001 | no | const token = flags.token \|\| process.env.HQ_FSF_TOKEN; |
| interval | const | 3003 | no | const interval = Math.max(1000, Number(flags.interval \|\| 5000)); |
| store | const | 3004 | no | const store = new FeedStore({ history: 200 }); |
| getServer | function | 3005 | no | const getServer = async () =&gt; (await import(&#39;../lib/fsf/server.mjs&#39;)).createFeedServer({ store, token, refreshAfterMs: interval, port: Number(flags.port \|\| 4319), }); |
| sources | const | 3008 | no | const sources = await fsfSources(); |
| publish | function | 3009 | no | const publish = async () =&gt; { |
| now | const | 3010 | no | const now = nowISO(); |
| srv | const | 3014 | no | const srv = await getServer(); |
| timer | const | 3015 | no | const timer = setInterval(() =&gt; { publish().catch(() =&gt; {}); }, interval); |
| base | const | 3023 | no | const base = String(flags.url \|\| &#39;http://127.0.0.1:4319&#39;).replace(/\\/+$/, &#39;&#39;); |
| url | const | 3024 | no | const url = /\\/fsf\\/snapshot$/.test(base) ? base : base + &#39;/fsf/snapshot&#39;; |
| r | const | 3025 | no | const r = await readSnapshot(url, { token: flags.token \|\| process.env.HQ_FSF_TOKEN, fetchImpl: fetch }); |
| fresh | const | 3027 | no | const fresh = isCurrent(r.snapshot, nowISO()); |
| cmdDo | function | 3035 | no | async function cmdDo(positional, flags) { |
| text | const | 3036 | no | const text = positional.join(&#39; &#39;).trim(); |
| expanded | const | 3042 | no | const expanded = text.split(/\\s+/).flatMap((w) =&gt; expand(w.toLowerCase().replace(/[^a-z0-9-]/g, &#39;&#39;))).join(&#39; &#39;); |
| r | const | 3043 | no | const r = route(actions, expanded, { limit: Number(flags.limit \|\| 3) }); |
| lines | const | 3048 | no | const lines = [`best match for &quot;${text}&quot;`, ` resolved: ${expanded}`, &#39;&#39;]; |
| best | const | 3050 | no | const best = r.matches[0].action; |
| cmdThreads | function | 3062 | no | async function cmdThreads(positional, flags) { |
| action | const | 3063 | no | const action = positional.shift() \|\| &#39;resolve&#39;; |
| channelRoot | const | 3064 | no | const channelRoot = typeof flags.root === &#39;string&#39; ? flags.root : DEFAULT_CHANNEL_ROOT; |
| registryFile | const | 3077 | no | const registryFile = join(channelRoot, &#39;threads.json&#39;); |
| out | const | 3078 | no | const out = resolveChannelThreads({ channelRoot, registryFile, write: flags.write === true }); |
| lines | const | 3079 | no | const lines = [ |
| cmdSessionCard | function | 3093 | no | async function cmdSessionCard(flags) { |
| repo | const | 3105 | no | const repo = typeof flags.repo === &#39;string&#39; ? flags.repo : process.cwd(); |
| previous | const | 3106 | no | const previous = loadStateCard(repo); |
| nextAction | const | 3108 | no | const nextAction = typeof flags[&#39;next-action&#39;] === &#39;string&#39; ? flags[&#39;next-action&#39;] : null; |
| card | const | 3109 | no | const card = buildStateCard({ repo, session: typeof flags.session === &#39;string&#39; ? flags.session : previous?.session ?? null, goal: typeof flags.goal === &#39;string&#39; ? flags.goal : previous?.goal ?? &#39;&#39;, n… |
| file | const | 3123 | no | const file = writeStateCard(repo, card); |
| cmdKb | function | 3134 | no | async function cmdKb(positional, flags) { |
| action | const | 3135 | no | const action = positional.shift(); |
| dir | const | 3144 | no | const dir = positional[0]; |
| usage | const | 3145 | no | const usage = &#39;usage: hq kb intake &lt;dir&gt; [--project &lt;name&gt;] [--dry-run]&#39;; |
| report | const | 3149 | no | const report = ingestKbDirectory(db, { dir: resolve(String(dir)), project: flags.project \|\| null, registry: loadRegistry(root), dryRun: flags[&#39;dry-run&#39;] === true, |
| lines | const | 3156 | no | const lines = []; |
| status | const | 3171 | no | const status = intakeStatus(db); |
| out | const | 3172 | no | const out = { schema: &#39;hq.kb-status/1&#39;, ...status }; |
| lines | const | 3173 | no | const lines = status.package |
| dir | const | 3186 | no | const dir = positional[0]; |
| usage | const | 3187 | no | const usage = &#39;usage: hq kb verify &lt;dir&gt; [--project &lt;name&gt;]&#39;; |
| read | const | 3190 | no | const read = readKbPackageDir(dir); |
| result | const | 3195 | no | const result = intakeVerify(db, { manifest: read.manifest, files: read.files, project: flags.project \|\| null, }); |
| out | const | 3200 | no | const out = { schema: &#39;hq.kb-verify/1&#39;, ...result }; |
| lines | const | 3201 | no | const lines = [ |
| health | const | 3213 | no | const health = kbHealth(db); |
| out | const | 3214 | no | const out = { schema: &#39;hq.kb-health/1&#39;, ...health }; |
| counts | const | 3215 | no | const counts = health.counts \|\| {}; |
| lines | const | 3216 | no | const lines = [ |
| query | const | 3227 | no | const query = positional.join(&#39; &#39;).trim(); |
| usage | const | 3228 | no | const usage = &#39;usage: hq kb query &lt;text&gt; [--kind &lt;kind&gt;] [--project &lt;name&gt;] [--limit n]&#39;; |
| results | const | 3231 | no | const results = kbQuery(db, { query, kind: flags.kind \|\| null, project: flags.project \|\| null, limit: Number(flags.limit \|\| 30), |
| out | const | 3237 | no | const out = { schema: &#39;hq.kb-query/1&#39;, query, count: results.length, results }; |
| lines | const | 3238 | no | const lines = results.length |
| graph | const | 3247 | no | const graph = kbGraph(db, { project: flags.project \|\| null, depth: Number(flags.depth \|\| 2), }); |
| out | const | 3251 | no | const out = { schema: &#39;hq.kb-graph/1&#39;, ...graph }; |
| lines | const | 3252 | no | const lines = [ |
| text | const | 3262 | no | const text = positional.join(&#39; &#39;).trim(); |
| usage | const | 3263 | no | const usage = &#39;usage: hq kb remember &lt;text&gt; [--tier now\|later] [--project &lt;name&gt;]&#39;; |
| tier | const | 3265 | no | const tier = flags.tier \|\| &#39;now&#39;; |
| message | const | 3267 | no | const message = `hq kb remember: tier &quot;${tier}&quot; is not offered here (now\|later); use \\`hq note promote &lt;id&gt; --to canon --owner-confirmed\\``; |
| note | const | 3272 | no | const note = kbRemember(db, { text, tier, project: flags.project \|\| null, }); |
| out | const | 3277 | no | const out = { schema: &#39;hq.kb-remember/1&#39;, ...note }; |
| cmdLake | function | 3290 | no | async function cmdLake(positional, flags) { |
| action | const | 3293 | no | const action = positional.shift() \|\| &#39;status&#39;; |
| projects | variable | 3296 | no | let projects = projectsForIndex(root); |
| results | const | 3298 | no | const results = []; |
| rows | const | 3306 | no | const rows = queryCommits(db, { project: flags.project, since: flags.since, path: flags.path, type: flags.type, limit: Number(flags.limit \|\| 50) }); |
| result | const | 3310 | no | const result = drift(db, { root, projects: projectsForIndex(root) }); |
| cmdWatch | function | 3326 | no | async function cmdWatch(flags) { |
| all | const | 3332 | no | const all = projectsForIndex(root); |
| projects | variable | 3335 | no | let projects = all; |
| wanted | const | 3337 | no | const wanted = new Set(String(flags.spaces).split(&#39;,&#39;).map((s) =&gt; s.trim()).filter(Boolean)); |
| wikiOptions | const | 3341 | no | const wikiOptions = profileOptions(config, &#39;wiki&#39;); |
| debounceMs | const | 3342 | no | const debounceMs = Number(flags.debounce \|\| 800); |
| wikiDebounceMs | const | 3349 | no | const wikiDebounceMs = Math.max(0, Number(flags[&#39;wiki-debounce&#39;] ?? 4000)); |
| pipeline | const | 3350 | no | const pipeline = { |
| spaceDeltas | const | 3354 | no | const spaceDeltas = new Map(); // name -&gt; {files, ms}, consumed by the next settle |
| wikiTimer | variable | 3355 | no | let wikiTimer = null; |
| wikiQueued | variable | 3356 | no | let wikiQueued = false; |
| wikiRunning | variable | 3357 | no | let wikiRunning = false; |
| stopping | variable | 3358 | no | let stopping = false; |
| line | function | 3360 | no | function line(text) { process.stdout.write(`${nowISO()} ${text}\\n`); } |
| wlog | function | 3361 | no | function wlog(text) { try { appendLogLine(root, WATCH_LOG, text); } catch { /* best effort */ } } |
| pausedNow | function | 3362 | no | const pausedNow = () =&gt; isPaused(root); |
| scheduleWiki | function | 3364 | no | function scheduleWiki(delayMs) { |
| activeSettle | variable | 3377 | no | let activeSettle = null; |
| runSettle | function | 3378 | no | function runSettle() { |
| run | function | 3380 | no | const run = (async () =&gt; { if (wikiRunning \|\| stopping) return; if (pausedNow()) { pipeline.pausedRefreshes += 1; line(&#39;paused (.hq/watch.pause present) — refreshes skipped, watching continues&#39;); |
| consumed | const | 3390 | no | const consumed = new Map(spaceDeltas); |
| dirty | const | 3393 | no | const dirty = projects.filter((p) =&gt; consumed.has(p.name)); |
| result | const | 3394 | no | const result = await runRefreshPipeline({ root, config, db, projects: all, spaces: dirty, indexResults: consumed, reason: &#39;watch&#39;, operation: &#39;watch&#39;, maxFileBytes: flags[&#39;max-file-bytes&#39;] \|\| null, m… |
| watcher | const | 3433 | no | const watcher = watchWorkspace({ root, db, projects, debounceMs, indexOptions: { maxFileBytes: config.maxFileBytes, ignores: config.ignores }, isPaused: pausedNow, |
| idx | const | 3456 | no | const idx = event.event === &#39;change&#39; ? event.result?.index : null; |
| delta | const | 3457 | no | const delta = idx ? (idx.added \|\| 0) + (idx.changed \|\| 0) + (idx.removed \|\| 0) : 0; |
| prev | const | 3460 | no | const prev = spaceDeltas.get(event.project) \|\| { files: 0, ms: 0 }; |
| stale | const | 3477 | no | const stale = await collectStale({ db, config, projects, capOverride: flags[&#39;max-file-bytes&#39;] }); |
| gate | const | 3485 | no | const gate = pipeline.lastGateOk === false ? `stale=${pipeline.lastGateStale}` : &#39;ok&#39;; |
| state | const | 3497 | no | const state = readWatcherState(root); |
| pidPath | const | 3503 | no | const pidPath = join(root, &#39;.hq&#39;, WATCH_PID); |
| wasPaused | variable | 3514 | no | let wasPaused = pausedNow(); |
| pauseTimer | const | 3515 | no | const pauseTimer = setInterval(() =&gt; { if (stopping) return; const now = pausedNow(); if (now &amp;&amp; !wasPaused) { line(&#39;paused (.hq/watch.pause present) — refreshes skipped, watching continues&#39;); |
| now | const | 3517 | no | const now = pausedNow(); |
| stop | function | 3529 | no | const stop = (signal) =&gt; { |
| info | const | 3537 | no | const info = JSON.parse(readFileSync(pidPath, &#39;utf8&#39;)); |
| cmdRefresh | function | 3561 | no | async function cmdRefresh(positional, flags) { |
| all | const | 3564 | no | const all = projectsForIndex(root); |
| selector | const | 3565 | no | const selector = positional[0] \|\| flags.space \|\| flags.project \|\| null; |
| projects | const | 3566 | no | const projects = selectProjects(all, selector); |
| options | const | 3568 | no | const options = profileOptions(config, &#39;wiki&#39;); |
| reason | const | 3569 | no | const reason = String(flags.reason \|\| &#39;manual&#39;).slice(0, 200); |
| started | const | 3570 | no | const started = performance.now(); |
| result | const | 3571 | no | const result = await runRefreshPipeline({ root, config, db, projects: all, spaces: projects, reason, operation: &#39;refresh&#39;, maxFileBytes: flags[&#39;max-file-bytes&#39;] \|\| null, maxFilePages: options.wikiMax… |
| text | const | 3586 | no | const text = `refresh skipped: another refresh is running (pid ${result.heldBy})`; |
| gate | const | 3590 | no | const gate = result.staleCount === 0 ? &#39;ok&#39; : `stale=${result.staleCount}`; |
| detail | const | 3591 | no | const detail = result.spaces.map((s) =&gt; `${s.name}: files=${s.files} pages=${s.pages} (${s.durationMs}ms)`); |
| text | const | 3594 | no | const text = flags.quiet &amp;&amp; !flags.json |
| cmdHooks | function | 3602 | no | async function cmdHooks(positional, flags) { |
| root | const | 3603 | no | const root = findRoot(); |
| action | const | 3605 | no | const action = positional[0] \|\| &#39;install&#39;; |
| selector | const | 3606 | no | const selector = flags.space \|\| flags.project \|\| null; |
| projects | const | 3607 | no | const projects = selectProjects(projectsForIndex(root), selector); |
| result | const | 3611 | no | const result = statusHooks({ root, projects }); |
| lines | const | 3612 | no | const lines = result.spaces.map((s) =&gt; `${s.project}\\t${s.git ? `${s.installed}/${s.hooks.length} hooks` : &#39;not a git repository&#39;}${s.foreign ? ` (${s.foreign} foreign)` : &#39;&#39;}`); |
| result | const | 3618 | no | const result = uninstallHooks({ root, projects }); |
| result | const | 3626 | no | const result = installHooks({ root, projects, force: flags.force === true }); |
| cmdMcp | function | 3632 | no | async function cmdMcp() { |
| cmdZcodeDoctor | function | 3641 | no | async function cmdZcodeDoctor(flags) { |
| home | const | 3643 | no | const home = process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;; |
| v2 | const | 3644 | no | const v2 = join(home, &#39;.zcode&#39;, &#39;v2&#39;); |
| report | const | 3645 | no | const report = { providerConfig: { ok: false, problems: [], providers: [] }, readiness: null, agents: null, budget: null, seats: null, zcode: null }; |
| out | const | 3649 | no | const out = execFileSync(&#39;node&#39;, [join(&#39;C:/Program Files/ZCode/resources/glm/zcode.cjs&#39;), &#39;doctor&#39;], { encoding: &#39;utf8&#39;, timeout: 60000 }); |
| providerConfigPath | const | 3656 | no | const providerConfigPath = join(v2, &#39;provider_config.json&#39;); |
| doc | const | 3658 | no | const doc = JSON.parse(readFileSync(providerConfigPath, &#39;utf8&#39;)); |
| agentsDir | const | 3668 | no | const agentsDir = join(home, &#39;.zcode&#39;, &#39;agents&#39;); |
| files | const | 3669 | no | const files = readdirSync(agentsDir).filter((f) =&gt; f.endsWith(&#39;.md&#39;)).map((f) =&gt; ({ file: f, text: readFileSync(join(agentsDir, f), &#39;utf8&#39;) })); |
| db | const | 3678 | no | const db = new Database(join(home, &#39;.zcode&#39;, &#39;cli&#39;, &#39;db&#39;, &#39;db.sqlite&#39;), { readonly: true }); |
| now | const | 3679 | no | const now = Date.now(); |
| rows | const | 3680 | no | const rows = db.query(&#39;SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at &gt; ?&#39;).all(no… |
| stats | const | 3682 | no | const stats = summarizeUsage(rows, { now, windowMs: 5 * 3600 * 1000 }); |
| health | const | 3683 | no | const health = new Map(); |
| funded | variable | 3686 | no | let funded = 0, warn = 0, blocked = 0; |
| blockedKeys | const | 3687 | no | const blockedKeys = [], warnKeys = []; |
| state | const | 3689 | no | const state = rec.health.state; |
| doc | const | 3702 | no | const doc = loadSeats(&#39;C:/VIVIM/channel&#39;); |
| lines | const | 3708 | no | const lines = renderDoctor(report); |
| cmdDoctor | function | 3714 | no | async function cmdDoctor(flags) { |
| checks | const | 3716 | no | const checks = []; |
| nodeMajor | const | 3717 | no | const nodeMajor = Number(process.versions.node.split(&#39;.&#39;)[0]); |
| gitVersion | const | 3720 | no | const gitVersion = execFileSync(&#39;git&#39;, [&#39;--version&#39;], { encoding: &#39;utf8&#39; }).trim(); |
| root | const | 3725 | no | const root = findRoot(); |
| counts | variable | 3729 | no | let counts = null; |
| db | const | 3732 | no | const db = openDb(dbPath(root)); |
| projects | const | 3740 | no | const projects = loadProjects(root).projects; |
| missing | const | 3741 | no | const missing = projects.filter((p) =&gt; !existsSync(resolveProjectPath(root, p.path))); |
| bulkDirs | const | 3749 | no | const bulkDirs = [&#39;.hq&#39;, &#39;research&#39;, &#39;harvest&#39;, &#39;wiki&#39;, &#39;.tmp&#39;, &#39;.work&#39;, &#39;sessions&#39;]; |
| measureTree | function | 3750 | no | const measureTree = (start) =&gt; { |
| bytes | variable | 3751 | no | let bytes = 0; |
| stack | const | 3752 | no | const stack = [start]; |
| current | const | 3754 | no | const current = stack.pop(); |
| info | variable | 3755 | no | let info; |
| footprintBytes | variable | 3766 | no | let footprintBytes = 0; |
| footprintParts | const | 3767 | no | const footprintParts = []; |
| dir | const | 3769 | no | const dir = join(root, name); |
| bytes | const | 3771 | no | const bytes = measureTree(dir); |
| automation | variable | 3779 | no | let automation = null; |
| automationLines | const | 3780 | no | const automationLines = []; |
| watcher | const | 3784 | no | const watcher = readWatcherState(root); |
| hooks | const | 3785 | no | const hooks = statusHooks({ root, projects: projectsForIndex(root) }); |
| lastRefresh | const | 3786 | no | const lastRefresh = lastRefreshBySpace(root); |
| watcherText | const | 3788 | no | const watcherText = watcher.running |
| out | const | 3802 | no | const out = { |
| body | const | 3806 | no | const body = checks.map((c) =&gt; `${c.ok ? &#39;ok &#39; : &#39;FAIL&#39;} ${c.name}: ${c.detail}`).join(&#39;\\n&#39;); |
| cmdCheck | function | 3811 | no | async function cmdCheck(flags) { |
| projects | const | 3813 | no | const projects = selectProjects(projectsForIndex(root), flags.project); |
| stale | const | 3818 | no | const stale = await collectStale({ db, config, projects, capOverride: flags[&#39;max-file-bytes&#39;] }); |
| out | const | 3820 | no | const out = { schema: &#39;hq.check/1&#39;, ok: stale.length === 0, staleCount: stale.length, stale: stale.slice(0, 200) }; |
| cmdConfig | function | 3825 | no | async function cmdConfig(flags) { |
| root | const | 3826 | no | const root = findRoot(); |
| config | const | 3827 | no | const config = loadConfig(root); |
| projects | const | 3828 | no | const projects = loadProjects(root); |
| out | const | 3829 | no | const out = { schema: &#39;hq.config/1&#39;, root, config, projects: projects.projects }; |
| cmdReset | function | 3834 | no | async function cmdReset(flags) { |
| root | const | 3836 | no | const root = findRoot(); |
| fence | const | 3841 | no | const fence = process.env.HQ_TEST_FENCE; |
| cmdExport | function | 3853 | no | async function cmdExport(flags) { |
| format | const | 3855 | no | const format = flags.format \|\| &#39;jsonl&#39;; |
| lines | const | 3857 | no | const lines = []; |
| text | const | 3871 | no | const text = lines.join(&#39;\\n&#39;) + &#39;\\n&#39;; |
| cmdProtocol | function | 3877 | no | async function cmdProtocol(flags) { |
| result | const | 3881 | no | const result = writeAgentProtocol(root); |
| cmdDead | function | 3889 | no | async function cmdDead(flags) { |
| rows | const | 3891 | no | const rows = db.prepare(` SELECT s.name, s.kind, s.line, s.exported, f.path, p.name AS project FROM symbols s JOIN files f ON f.id = s.file_id JOIN projects p ON p.id = s.project_id WHERE s.exported … |
| out | const | 3901 | no | const out = { schema: &#39;hq.dead/1&#39;, candidates: rows, authority: &#39;candidate_not_proof&#39; }; |
| cmdTrace | function | 3906 | no | async function cmdTrace(positional, flags) { |
| task | const | 3908 | no | const task = positional.join(&#39; &#39;).trim(); |
| bundle | const | 3911 | no | const bundle = await composeContext(db, { task, project: flags.project, budgetTokens: Number(flags.budget \|\| 3000) }); |
| lines | const | 3913 | no | const lines = [`Trace for &quot;${task}&quot; — ${bundle.sources.length} source(s)`]; |
| cmdDocs | function | 3920 | no | async function cmdDocs(positional, flags) { |
| canon | const | 3923 | no | const canon = await import(&#39;../lib/canon.mjs&#39;); |
| action | const | 3924 | no | const action = positional.shift() \|\| &#39;list&#39;; |
| projects | const | 3926 | no | const projects = projectsForIndex(root).filter((p) =&gt; !flags.project \|\| p.name === flags.project); |
| results | const | 3927 | no | const results = []; |
| result | const | 3941 | no | const result = canon.documentHealth(db, { root, projects: projectsForIndex(root) }); |
| params | const | 3953 | no | const params = []; |
| rows | const | 3957 | no | const rows = db.prepare(`SELECT d.*, p.name AS project FROM documents d JOIN projects p ON p.id = d.project_id ${where.length ? &#39;WHERE &#39; + where.join(&#39; AND &#39;) : &#39;&#39;} ORDER BY d.family, p.name, d.path … |
| cmdDecisions | function | 3969 | no | async function cmdDecisions(positional, flags) { |
| canon | const | 3972 | no | const canon = await import(&#39;../lib/canon.mjs&#39;); |
| action | const | 3973 | no | const action = positional[0]; |
| projects | const | 3975 | no | const projects = projectsForIndex(root).filter((p) =&gt; !flags.project \|\| p.name === flags.project); |
| results | const | 3976 | no | const results = projects.map((project) =&gt; ({ project: project.name, ...canon.indexDecisions(db, project) })); |
| id | const | 3981 | no | const id = positional[1]; |
| decision | const | 3983 | no | const decision = canon.confirmDecision(db, { id, ownerConfirmed: flags[&#39;owner-confirmed&#39;] === true }); |
| id | const | 3988 | no | const id = positional[1]; |
| result | const | 3990 | no | const result = canon.supersedeDecision(db, { id, by: flags.by, ownerConfirmed: flags[&#39;owner-confirmed&#39;] === true }); |
| query | const | 3994 | no | const query = positional.join(&#39; &#39;).trim(); |
| rows | const | 3995 | no | const rows = canon.decisionRegister(db, { project: flags.project, status: flags.status, query: query \|\| null, limit: Number(flags.limit \|\| 50), }); |
| cmdCanon | function | 4014 | no | async function cmdCanon(positional, flags) { |
| canon | const | 4017 | no | const canon = await import(&#39;../lib/canon.mjs&#39;); |
| action | const | 4018 | no | const action = positional[0]; |
| projects | const | 4020 | no | const projects = projectsForIndex(root).filter((p) =&gt; !flags.project \|\| p.name === flags.project); |
| results | const | 4021 | no | const results = projects.map((project) =&gt; ({ project: project.name, ...canon.indexCanonTerms(db, project) })); |
| id | const | 4026 | no | const id = positional[1]; |
| term | const | 4028 | no | const term = canon.confirmTerm(db, { id, ownerConfirmed: flags[&#39;owner-confirmed&#39;] === true }); |
| id | const | 4033 | no | const id = positional[1]; |
| term | const | 4035 | no | const term = canon.deprecateTerm(db, { id, ownerConfirmed: flags[&#39;owner-confirmed&#39;] === true }); |
| query | const | 4039 | no | const query = positional.join(&#39; &#39;).trim(); |
| rows | const | 4040 | no | const rows = canon.canonRegister(db, { project: flags.project, status: flags.status, query: query \|\| null, limit: Number(flags.limit \|\| 50), }); |
| cmdConflicts | function | 4059 | no | async function cmdConflicts(flags) { |
| canon | const | 4062 | no | const canon = await import(&#39;../lib/canon.mjs&#39;); |
| health | const | 4063 | no | const health = canon.documentHealth(db, { root, projects: projectsForIndex(root) }); |
| conflicts | const | 4064 | no | const conflicts = health.conflicts \|\| []; |
| cmdFiletypes | function | 4075 | no | async function cmdFiletypes(flags) { |
| registry | const | 4078 | no | const registry = loadRegistry(root); |
| types | variable | 4079 | no | let types = registry.types \|\| []; |
| validation | const | 4083 | no | const validation = validateRegistry(registry); |
| out | const | 4084 | no | const out = { schema: &#39;hq.filetypes/1&#39;, counts: registry.counts, validation, types }; |
| cmdRulebook | function | 4095 | no | async function cmdRulebook(flags) { |
| markdown | const | 4098 | no | const markdown = renderRuleBook(loadRegistry(root)); |
| out | const | 4100 | no | const out = join(root, &#39;docs/AGENTIC-RULEBOOK.generated.md&#39;); |
| cmdDcb | function | 4110 | no | async function cmdDcb(positional, flags) { |
| action | const | 4113 | no | const action = positional.shift() \|\| &#39;protocol&#39;; |
| path | const | 4115 | no | const path = join(root, &#39;docs/DCB-PROTOCOL.md&#39;); |
| task | const | 4121 | no | const task = positional.join(&#39; &#39;).trim(); |
| bundle | const | 4124 | no | const bundle = await composeContext(db, { task, project: flags.project, budgetTokens: Number(flags.budget \|\| 6000), maxFiles: Number(flags[&#39;max-files&#39;] \|\| 24), }); |
| out | const | 4128 | no | const out = { |
| cmdContextBudget | function | 4154 | no | async function cmdContextBudget(flags) { |
| dbPath | const | 4155 | no | const dbPath = flags.db ? resolve(String(flags.db)) : &#39;C:/Users/VIVIM.inc/.zcode/cli/db/db.sqlite&#39;; |
| days | const | 4157 | no | const days = Number(flags.days ?? 3); |
| windowTokens | const | 4158 | no | const windowTokens = Number(flags.window ?? 1000000); |
| utilization | const | 4159 | no | const utilization = Number(flags.utilization ?? 0.8); |
| ceilingOverride | const | 4160 | no | const ceilingOverride = flags.ceiling === undefined ? null : Number(flags.ceiling); |
| idleMin | const | 4161 | no | const idleMin = Number(flags[&#39;idle-min&#39;] ?? 5); |
| now | const | 4168 | no | const now = Date.now(); |
| windowMs | const | 4169 | no | const windowMs = Math.round(days * 86400000); |
| db | const | 4172 | no | const db = new DatabaseSync(dbPath, { readOnly: true }); |
| usage | const | 4174 | no | const usage = db.prepare( `SELECT session_id, agent, provider_id, model_id, status, started_at, input_tokens, output_tokens, reasoning_tokens, cache_read_input_tokens, cache_creation_input_tokens, co… |
| sessions | const | 4180 | no | const sessions = db.prepare( &#39;SELECT id, parent_id, time_updated, time_compacting FROM session&#39;, ).all(); |
| report | const | 4186 | no | const report = census(usage, { now, windowMs }); |
| plan | const | 4187 | no | const plan = planCompactions({ sessions, usageRows: usage, now, ceiling: ceilingOverride ?? undefined, window: windowTokens, utilization, |
| cmdTiming | function | 4201 | no | async function cmdTiming(positional, flags) { |
| action | const | 4203 | no | const action = positional.shift() \|\| &#39;report&#39;; |
| since | const | 4204 | no | const since = flags.since ? resolveSince(flags.since) : null; |
| report | const | 4207 | no | const report = timingReport(db, { operation: flags.operation \|\| null, since, limit: Number(flags.limit \|\| 5000) }); |
| report | const | 4212 | no | const report = budgetReport(db, config, { since }); |
| lines | const | 4213 | no | const lines = [`Budgets — profile ${report.profile}`, &#39;&#39;]; |
| result | const | 4222 | no | const result = optimize(db, config, { since }); |
| applied | const | 4224 | no | const applied = applyRecommendations(config, result); |
| out | const | 4226 | no | const out = { ...result, applied: applied.applied, skippedConflicts: applied.skippedConflicts }; |
| result | const | 4234 | no | const result = optimize(db, config, { since }); |
| out | const | 4235 | no | const out = { |
| lines | const | 4240 | no | const lines = result.conflicts.length |
| name | const | 4247 | no | const name = positional[0] \|\| flags.profile; |
| operation | const | 4255 | no | const operation = positional[0]; |
| value | const | 4256 | no | const value = positional[1]; |
| next | const | 4258 | no | const next = setPriority(config, operation, value); |
| operation | const | 4265 | no | const operation = positional[0]; |
| value | const | 4266 | no | const value = positional[1]; |
| next | const | 4268 | no | const next = setBudget(config, operation, value); |
| deleted | const | 4276 | no | const deleted = db.prepare(&#39;DELETE FROM timings&#39;).run().changes; |
| main | function | 4286 | no | async function main() { |
| argv | const | 4287 | no | const argv = process.argv.slice(2); |
| command | const | 4289 | no | const command = positional.shift(); |
| receipts | const | 4378 | no | const receipts = listReceipts(db, { limit: Number(flags.limit \|\| 20) }); |
| code | const | 4394 | no | const code = await main(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 6 | external |
| node:path | import | 10 | external |
| node:url | import | 11 | external |
| node:os | import | 12 | external |
| node:sqlite | import | 13 | external |
| node:child_process | import | 14 | external |
| node:fs | import | 15 | external |
| ../lib/schema.mjs | import | 16 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/annotation-v2.mjs | import | 19 | [hq/lib/annotation-v2.mjs](../lib/annotation-v2.mjs.md) |
| ../lib/semantic-registry.mjs | import | 20 | [hq/lib/semantic-registry.mjs](../lib/semantic-registry.mjs.md) |
| ../lib/wiki-program.mjs | import | 23 | [hq/lib/wiki-program.mjs](../lib/wiki-program.mjs.md) |
| ../lib/capabilities.mjs | import | 27 | [hq/lib/capabilities.mjs](../lib/capabilities.mjs.md) |
| ../lib/registry.mjs | import | 33 | [hq/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/util.mjs | import | 38 | [hq/lib/util.mjs](../lib/util.mjs.md) |
| ../lib/freshness.mjs | import | 42 | [hq/lib/freshness.mjs](../lib/freshness.mjs.md) |
| ../lib/channel-seats.mjs | import | 48 | [hq/lib/channel-seats.mjs](../lib/channel-seats.mjs.md) |
| ../lib/channel-broker.mjs | import | 52 | [hq/lib/channel-broker.mjs](../lib/channel-broker.mjs.md) |
| ../lib/channel-transport.mjs | import | 56 | [hq/lib/channel-transport.mjs](../lib/channel-transport.mjs.md) |
| ../lib/cnp.mjs | import | 57 | [hq/lib/cnp.mjs](../lib/cnp.mjs.md) |
| ../lib/comms-roof.mjs | import | 58 | [hq/lib/comms-roof.mjs](../lib/comms-roof.mjs.md) |
| ../lib/revive-lane.mjs | import | 59 | [hq/lib/revive-lane.mjs](../lib/revive-lane.mjs.md) |
| ../lib/team-panel.mjs | import | 60 | [hq/lib/team-panel.mjs](../lib/team-panel.mjs.md) |
| ../lib/model-router.mjs | import | 61 | [hq/lib/model-router.mjs](../lib/model-router.mjs.md) |
| ../lib/zcode-doctor.mjs | import | 62 | [hq/lib/zcode-doctor.mjs](../lib/zcode-doctor.mjs.md) |
| ../lib/session-card.mjs | import | 63 | [hq/lib/session-card.mjs](../lib/session-card.mjs.md) |
| ../lib/nomenclature.mjs | import | 64 | [hq/lib/nomenclature.mjs](../lib/nomenclature.mjs.md) |
| ../lib/ask.mjs | import | 68 | [hq/lib/ask.mjs](../lib/ask.mjs.md) |
| ../lib/telemetry.mjs | import | 69 | [hq/lib/telemetry.mjs](../lib/telemetry.mjs.md) |
| ../lib/session-views.mjs | import | 74 | [hq/lib/session-views.mjs](../lib/session-views.mjs.md) |
| ../lib/toolchain-guard.mjs | import | 78 | [hq/lib/toolchain-guard.mjs](../lib/toolchain-guard.mjs.md) |
| ../lib/indexer.mjs | dynamic | 447 | [hq/lib/indexer.mjs](../lib/indexer.mjs.md) |
| ../lib/indexer.mjs | dynamic | 519 | [hq/lib/indexer.mjs](../lib/indexer.mjs.md) |
| ../lib/skills.mjs | dynamic | 540 | [hq/lib/skills.mjs](../lib/skills.mjs.md) |
| ../lib/canon.mjs | dynamic | 551 | [hq/lib/canon.mjs](../lib/canon.mjs.md) |
| ../lib/search.mjs | dynamic | 603 | [hq/lib/search.mjs](../lib/search.mjs.md) |
| ../lib/search.mjs | dynamic | 623 | [hq/lib/search.mjs](../lib/search.mjs.md) |
| ../lib/graph.mjs | dynamic | 675 | [hq/lib/graph.mjs](../lib/graph.mjs.md) |
| ../lib/graph.mjs | dynamic | 692 | [hq/lib/graph.mjs](../lib/graph.mjs.md) |
| ../lib/context.mjs | dynamic | 707 | [hq/lib/context.mjs](../lib/context.mjs.md) |
| ../lib/receipts.mjs | dynamic | 708 | [hq/lib/receipts.mjs](../lib/receipts.mjs.md) |
| ../lib/skills.mjs | dynamic | 768 | [hq/lib/skills.mjs](../lib/skills.mjs.md) |
| ../lib/lake.mjs | dynamic | 787 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/lake.mjs | dynamic | 803 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/lake.mjs | dynamic | 804 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/memory.mjs | dynamic | 805 | [hq/lib/memory.mjs](../lib/memory.mjs.md) |
| ../lib/context.mjs | dynamic | 806 | [hq/lib/context.mjs](../lib/context.mjs.md) |
| ../lib/git.mjs | dynamic | 807 | [hq/lib/git.mjs](../lib/git.mjs.md) |
| ../lib/lake.mjs | dynamic | 898 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/git.mjs | dynamic | 900 | [hq/lib/git.mjs](../lib/git.mjs.md) |
| ../lib/memory.mjs | dynamic | 919 | [hq/lib/memory.mjs](../lib/memory.mjs.md) |
| ../lib/memory.mjs | dynamic | 964 | [hq/lib/memory.mjs](../lib/memory.mjs.md) |
| ../lib/protocol.mjs | dynamic | 992 | [hq/lib/protocol.mjs](../lib/protocol.mjs.md) |
| ../lib/protocol.mjs | dynamic | 1013 | [hq/lib/protocol.mjs](../lib/protocol.mjs.md) |
| ../lib/kg-export.mjs | dynamic | 1057 | [hq/lib/kg-export.mjs](../lib/kg-export.mjs.md) |
| ../lib/wiki.mjs | dynamic | 1094 | [hq/lib/wiki.mjs](../lib/wiki.mjs.md) |
| ../lib/wiki-runtime/graph-index.mjs | dynamic | 1119 | [hq/lib/wiki-runtime/graph-index.mjs](../lib/wiki-runtime/graph-index.mjs.md) |
| ../lib/home.mjs | dynamic | 1300 | [hq/lib/home.mjs](../lib/home.mjs.md) |
| ../lib/lake.mjs | dynamic | 1301 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/lake.mjs | dynamic | 1302 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/memory.mjs | dynamic | 1303 | [hq/lib/memory.mjs](../lib/memory.mjs.md) |
| ../lib/lake.mjs | dynamic | 1340 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/search.mjs | dynamic | 1343 | [hq/lib/search.mjs](../lib/search.mjs.md) |
| ../lib/search.mjs | dynamic | 1346 | [hq/lib/search.mjs](../lib/search.mjs.md) |
| ../lib/graph.mjs | dynamic | 1352 | [hq/lib/graph.mjs](../lib/graph.mjs.md) |
| ../lib/graph.mjs | dynamic | 1355 | [hq/lib/graph.mjs](../lib/graph.mjs.md) |
| ../lib/lake.mjs | dynamic | 1358 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/memory.mjs | dynamic | 1361 | [hq/lib/memory.mjs](../lib/memory.mjs.md) |
| ../lib/memory.mjs | dynamic | 1364 | [hq/lib/memory.mjs](../lib/memory.mjs.md) |
| ../lib/lake.mjs | dynamic | 1390 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/torrent/poll.mjs | dynamic | 1427 | [hq/lib/torrent/poll.mjs](../lib/torrent/poll.mjs.md) |
| ../lib/torrent/wanted.mjs | dynamic | 1428 | [hq/lib/torrent/wanted.mjs](../lib/torrent/wanted.mjs.md) |
| ../lib/torrent/library.mjs | dynamic | 1429 | [hq/lib/torrent/library.mjs](../lib/torrent/library.mjs.md) |
| ../lib/torrent/releases.mjs | dynamic | 1430 | [hq/lib/torrent/releases.mjs](../lib/torrent/releases.mjs.md) |
| ../lib/torrent/dispatch-adapter.mjs | dynamic | 1503 | [hq/lib/torrent/dispatch-adapter.mjs](../lib/torrent/dispatch-adapter.mjs.md) |
| ../lib/vivim.mjs | dynamic | 1538 | [hq/lib/vivim.mjs](../lib/vivim.mjs.md) |
| ../lib/session-import.mjs | dynamic | 1857 | [hq/lib/session-import.mjs](../lib/session-import.mjs.md) |
| ../lib/canvas.mjs | dynamic | 1961 | [hq/lib/canvas.mjs](../lib/canvas.mjs.md) |
| ../lib/pmo.mjs | dynamic | 1997 | [hq/lib/pmo.mjs](../lib/pmo.mjs.md) |
| bun:sqlite | dynamic | 2042 | external |
| ../lib/model-budget.mjs | dynamic | 2092 | [hq/lib/model-budget.mjs](../lib/model-budget.mjs.md) |
| ../lib/channel-wake.mjs | dynamic | 2313 | [hq/lib/channel-wake.mjs](../lib/channel-wake.mjs.md) |
| ../lib/channel-broker.mjs | dynamic | 2501 | [hq/lib/channel-broker.mjs](../lib/channel-broker.mjs.md) |
| node:fs/promises | dynamic | 2531 | external |
| node:fs | dynamic | 2565 | external |
| ./autonomy.mjs | dynamic | 2640 | [hq/bin/autonomy.mjs](./autonomy.mjs.md) |
| ../lib/work-orders.mjs | dynamic | 2682 | [hq/lib/work-orders.mjs](../lib/work-orders.mjs.md) |
| ./console.mjs | dynamic | 2793 | [hq/bin/console.mjs](./console.mjs.md) |
| ./console.mjs | dynamic | 2796 | [hq/bin/console.mjs](./console.mjs.md) |
| ../lib/action-registry.mjs | dynamic | 2849 | [hq/lib/action-registry.mjs](../lib/action-registry.mjs.md) |
| ../lib/actions/verbs.mjs | dynamic | 2850 | [hq/lib/actions/verbs.mjs](../lib/actions/verbs.mjs.md) |
| ../lib/actions/handlers.mjs | dynamic | 2854 | [hq/lib/actions/handlers.mjs](../lib/actions/handlers.mjs.md) |
| ../lib/actions/aliases.mjs | dynamic | 2856 | [hq/lib/actions/aliases.mjs](../lib/actions/aliases.mjs.md) |
| ../lib/action-registry.mjs | dynamic | 2864 | [hq/lib/action-registry.mjs](../lib/action-registry.mjs.md) |
| ../lib/action-router.mjs | dynamic | 2865 | [hq/lib/action-router.mjs](../lib/action-router.mjs.md) |
| ../lib/fsf/slices.mjs | dynamic | 2980 | [hq/lib/fsf/slices.mjs](../lib/fsf/slices.mjs.md) |
| ../lib/fsf/client.mjs | dynamic | 2981 | [hq/lib/fsf/client.mjs](../lib/fsf/client.mjs.md) |
| ../lib/fsf/store.mjs | dynamic | 2982 | [hq/lib/fsf/store.mjs](../lib/fsf/store.mjs.md) |
| ../lib/fsf/server.mjs | dynamic | 3000 | [hq/lib/fsf/server.mjs](../lib/fsf/server.mjs.md) |
| ../lib/fsf/server.mjs | dynamic | 3005 | [hq/lib/fsf/server.mjs](../lib/fsf/server.mjs.md) |
| ../lib/fsf/client.mjs | dynamic | 3022 | [hq/lib/fsf/client.mjs](../lib/fsf/client.mjs.md) |
| ../lib/action-router.mjs | dynamic | 3039 | [hq/lib/action-router.mjs](../lib/action-router.mjs.md) |
| ../lib/kb-intake.mjs | dynamic | 3147 | [hq/lib/kb-intake.mjs](../lib/kb-intake.mjs.md) |
| ../lib/filetypes.mjs | dynamic | 3148 | [hq/lib/filetypes.mjs](../lib/filetypes.mjs.md) |
| ../lib/kb-intake.mjs | dynamic | 3170 | [hq/lib/kb-intake.mjs](../lib/kb-intake.mjs.md) |
| ../lib/kb-intake.mjs | dynamic | 3189 | [hq/lib/kb-intake.mjs](../lib/kb-intake.mjs.md) |
| ../lib/kb.mjs | dynamic | 3212 | [hq/lib/kb.mjs](../lib/kb.mjs.md) |
| ../lib/kb.mjs | dynamic | 3230 | [hq/lib/kb.mjs](../lib/kb.mjs.md) |
| ../lib/kb.mjs | dynamic | 3246 | [hq/lib/kb.mjs](../lib/kb.mjs.md) |
| ../lib/kb.mjs | dynamic | 3271 | [hq/lib/kb.mjs](../lib/kb.mjs.md) |
| ../lib/lake.mjs | dynamic | 3292 | [hq/lib/lake.mjs](../lib/lake.mjs.md) |
| ../lib/automation.mjs | dynamic | 3328 | [hq/lib/automation.mjs](../lib/automation.mjs.md) |
| ../lib/refresh.mjs | dynamic | 3331 | [hq/lib/refresh.mjs](../lib/refresh.mjs.md) |
| ../lib/refresh.mjs | dynamic | 3563 | [hq/lib/refresh.mjs](../lib/refresh.mjs.md) |
| ../lib/automation.mjs | dynamic | 3604 | [hq/lib/automation.mjs](../lib/automation.mjs.md) |
| ../lib/mcp.mjs | dynamic | 3634 | [hq/lib/mcp.mjs](../lib/mcp.mjs.md) |
| node:child_process | dynamic | 3642 | external |
| bun:sqlite | dynamic | 3677 | external |
| ../lib/channel-seats.mjs | dynamic | 3701 | [hq/lib/channel-seats.mjs](../lib/channel-seats.mjs.md) |
| node:child_process | dynamic | 3715 | external |
| node:fs | dynamic | 3748 | external |
| ../lib/refresh.mjs | dynamic | 3782 | [hq/lib/refresh.mjs](../lib/refresh.mjs.md) |
| ../lib/automation.mjs | dynamic | 3783 | [hq/lib/automation.mjs](../lib/automation.mjs.md) |
| ../lib/protocol.mjs | dynamic | 3879 | [hq/lib/protocol.mjs](../lib/protocol.mjs.md) |
| ../lib/context.mjs | dynamic | 3910 | [hq/lib/context.mjs](../lib/context.mjs.md) |
| ../lib/canon.mjs | dynamic | 3923 | [hq/lib/canon.mjs](../lib/canon.mjs.md) |
| ../lib/canon.mjs | dynamic | 3972 | [hq/lib/canon.mjs](../lib/canon.mjs.md) |
| ../lib/canon.mjs | dynamic | 4017 | [hq/lib/canon.mjs](../lib/canon.mjs.md) |
| ../lib/canon.mjs | dynamic | 4062 | [hq/lib/canon.mjs](../lib/canon.mjs.md) |
| ../lib/filetypes.mjs | dynamic | 4077 | [hq/lib/filetypes.mjs](../lib/filetypes.mjs.md) |
| ../lib/filetypes.mjs | dynamic | 4097 | [hq/lib/filetypes.mjs](../lib/filetypes.mjs.md) |
| ../lib/context.mjs | dynamic | 4123 | [hq/lib/context.mjs](../lib/context.mjs.md) |
| ../lib/context-budget.mjs | dynamic | 4185 | [hq/lib/context-budget.mjs](../lib/context-budget.mjs.md) |
| ../lib/kernel/cli.mjs | dynamic | 4365 | [hq/lib/kernel/cli.mjs](../lib/kernel/cli.mjs.md) |
| ../lib/receipts.mjs | dynamic | 4377 | [hq/lib/receipts.mjs](../lib/receipts.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// hq/bin/hq.mjs — HQ command surface.
// Two audiences: Builder (agent/Harness) and Owner (VIVIM consumer).
// Read-only except: index, wiki, home, feed, hooks, watch, reset, note, project, kb,
// channel watch (writes only the one wake-state.json under the channel root).
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync, readdirSync,
  copyFileSync, renameSync, watch,
} from 'node:fs';
import { join, resolve, dirname, basename, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import {
  openDb,
} from '../lib/schema.mjs';
import { parseAnnotationV2, ANNOTATION_V2_SCHEMA } from '../lib/annotation-v2.mjs';
import {
  getSemanticId, listSemanticIds, detectSemanticDrift, SEMANTIC_REGISTRY_SCHEMA,
} from '../lib/semantic-registry.mjs';
import {
  activateProgram, rollbackProgram, listProgramVersions, getActiveProgram, previewProgram,
  WIKI_PROGRAM_SCHEMA,
} from '../lib/wiki-program.mjs';
import {
  scanCapabilitySource, persistCapabilityScan, capabilityStatus, listCapabilitySources,
  listCapabilityPackages, getCapabilityPackage, listCapabilityNodes, listCapabilityMaps,
  listCapabilityContracts, getCapabilityContract, searchCapabilityDocuments,
  exportCapabilityJson, exportCapabilitySqlite, writeCapabilitySchema, CAPABILITY_REGISTRY_SCHEMA,
} from '../lib/capabilities.mjs';
import {
  loadProjects, loadConfig, saveConfig, saveProjects, dbPath, registerProject,
  unregisterProject, discoverHarvest, projectsForIndex, findProject,
  resolveProjectPath, PROJECTS_FILE, HQ_DIR,
} from '../lib/registry.mjs';
import {
  canonicalJson, digestOf, estimateTokens, formatBytes, formatNumber, toPosix,
  nowISO, truncate, globToRegExp,
} from '../lib/util.mjs';
import { collectStaleFiles } from '../lib/freshness.mjs';

// Shared freshness walk for `check`, `verify`, `refresh` and the watch gate:
// every surface judges the same file universe (configured cap and ignores)
// as the indexer. See hq/lib/freshness.mjs.
const collectStale = collectStaleFiles;
import {
  loadSeats, wakeSeat, verifySeat, renderSeatTable, lateReplyFor, WAKE_SCHEMA,
  DEFAULT_CHANNEL_ROOT, DEFAULT_IDLE_MINUTES,
} from '../lib/channel-seats.mjs';
import {
  BROKER_SCHEMA, RECEIPT_SCHEMA, cancelPending, drain, recordReply, renderQueueTable,
  requestState, submitRequest,
} from '../lib/channel-broker.mjs';
import { readLivenessMap, resumeSession, confirmWake, sessionsTool, lateReply } from '../lib/channel-transport.mjs';
import { resolveChannelThreads } from '../lib/cnp.mjs';
import { probeBots, probeSeats, probeAgentDefs, probeThreads, probeChannels, probeDesk, probeInboxes, probeCommsBus, probeAnet, probeChannelEvidence, probeControl, buildRoof, renderRoof } from '../lib/comms-roof.mjs';
import { reviewGate, REVIVE_CODES, assessLane, chooseSafeModel, orderRevive } from '../lib/revive-lane.mjs';
import { buildTeamSnapshot, renderPanel, renderHookSummary, writeStateCache, parseAgentFile, collectAgentFiles } from '../lib/team-panel.mjs';
import { planRoutes, buildCatalog, summarizeUsage, classifyHealth, shouldApply, DEFAULT_POLICY, readDeclaredReasoningLevels } from '../lib/model-router.mjs';
import { validateProviderConfig, providerReadiness, auditAgentCompliance, renderDoctor, renderDoctorVerdict } from '../lib/zcode-doctor.mjs';
import { buildStateCard, writeStateCard, loadStateCard, renderStateCard } from '../lib/session-card.mjs';
import {
  userTerm, memoryTierLabel, sitrepHeading, apertureHeading, glossaryMarkdown,
  authorityNotice, VIVIM_TAXONOMY,
} from '../lib/nomenclature.mjs';
import { routeAsk } from '../lib/ask.mjs';
import {
  startSpan, recordTiming, timeSync, timeAsync, timingReport, budgetReport, optimize,
  applyRecommendations, applyProfile, setPriority, setBudget,
  formatTimingReport, formatOptimize, profileOptions,
} from '../lib/telemetry.mjs';
import {
  sessionRows, sessionDetail, sessionTimeline, toolUsage,
  renderSessionsText, renderSessionsMarkdown, SESSION_VIEWS_SCHEMA,
} from '../lib/session-views.mjs';
import { assertToolchain } from '../lib/toolchain-guard.mjs';

// ZAIQ-014 toolchain guard — enforced once at tool entry, before any command
```

_First 80 of 4396 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
