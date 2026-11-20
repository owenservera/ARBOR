# File: hq/lib/lake.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/lake.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 54004 B |
| Lines | 1393 |
| Hash | af851979e13d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TODO_RE | const | 19 | no | const TODO_RE = /\\b(TODO\|FIXME\|HACK\|XXX)\\b/; |
| MAX_TODO_RESULTS | const | 20 | no | const MAX_TODO_RESULTS = 200; |
| MAX_TODO_FILES | const | 21 | no | const MAX_TODO_FILES = 500; |
| MAX_TEXT_BYTES | const | 22 | no | const MAX_TEXT_BYTES = 6000; |
| SECRET_NAMES | const | 24 | no | const SECRET_NAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, &#39;login data&#39;, ]); |
| isSecretPath | function | 29 | no | function isSecretPath(value) { |
| posix | const | 30 | no | const posix = toPosix(value); |
| name | const | 31 | no | const name = (posix.split(&#39;/&#39;).pop() \|\| &#39;&#39;).trim().toLowerCase(); |
| clampInt | function | 38 | no | function clampInt(value, lo, hi, fallback = lo) { |
| n | const | 39 | no | const n = Number(value); |
| isoTimestamp | function | 44 | no | function isoTimestamp(value) { |
| ms | const | 47 | no | const ms = Date.parse(value); |
| daysBetween | function | 51 | no | function daysBetween(fromIso, toIso) { |
| a | const | 52 | no | const a = Date.parse(fromIso); |
| b | const | 53 | no | const b = Date.parse(toIso); |
| clean | function | 58 | no | function clean(value) { |
| byteLength | function | 62 | no | function byteLength(text) { |
| clampBytes | function | 67 | no | function clampBytes(text, max) { |
| out | variable | 68 | no | let out = String(text); |
| CONVENTIONAL_RE | const | 75 | no | const CONVENTIONAL_RE = /^([A-Za-z][A-Za-z0-9_-]*)(?:\\(([^()\\r\\n]+)\\))?(!)?:\\s*(.+)$/; |
| parseConventional | function | 77 | no | function parseConventional(subject) { |
| projectAbsPath | function | 88 | no | function projectAbsPath(root, project) { |
| resolveProjects | function | 94 | no | function resolveProjects(db, root, projects) { |
| out | const | 95 | no | const out = []; |
| seen | const | 96 | no | const seen = new Set(); |
| add | function | 97 | no | const add = (name, abs) =&gt; { |
| cleanName | const | 98 | no | const cleanName = clean(name); |
| rows | const | 109 | no | const rows = db.prepare(&#39;SELECT name, path FROM projects ORDER BY name&#39;).all(); |
| projectRow | function | 115 | no | function projectRow(db, name) { |
| ensureProject | function | 119 | no | function ensureProject(db, project) { |
| name | const | 120 | no | const name = clean(project.name); |
| abs | const | 121 | no | const abs = resolve(String(project.path)); |
| kind | const | 122 | no | const kind = clean(project.kind) \|\| (existsSync(join(abs, &#39;.git&#39;)) ? &#39;git&#39; : &#39;dir&#39;); |
| remoteUrl | const | 123 | no | const remoteUrl = remote(abs); |
| branchName | const | 124 | no | const branchName = branch(abs); |
| headSha | const | 125 | no | const headSha = head(abs); |
| row | variable | 127 | no | let row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(name); |
| ingestProject | function | 147 | yes | export function ingestProject(db, project, { limit = 500, since = null } = {}) { |
| info | const | 151 | no | const info = ensureProject(db, project); |
| records | const | 152 | no | const records = logRecords(info.path, { limit: clampInt(limit, 1, 5000, 500), since: since ? isoTimestamp(since) : null, }); |
| insertCommit | const | 157 | no | const insertCommit = db.prepare(` INSERT OR IGNORE INTO commits(sha, project_id, author, date, subject, type, scope, files_changed, inserted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `); |
| insertFile | const | 161 | no | const insertFile = db.prepare(&#39;INSERT OR IGNORE INTO commit_files(sha, path, status) VALUES (?, ?, ?)&#39;); |
| inserted | variable | 163 | no | let inserted = 0; |
| skipped | variable | 164 | no | let skipped = 0; |
| files | const | 168 | no | const files = []; |
| path | const | 170 | no | const path = toPosix(String(entry.path ?? &#39;&#39;)).replace(/^\\.\\//, &#39;&#39;); |
| parsed | const | 175 | no | const parsed = parseConventional(record.subject); |
| result | const | 176 | no | const result = insertCommit.run( record.sha, info.id, clean(record.author) \|\| null, isoTimestamp(record.date), |
| queryCommits | function | 203 | yes | export function queryCommits(db, { project = null, since = null, path = null, type = null, limit = 50, } = {}) { |
| params | const | 207 | no | const params = []; |
| needle | const | 222 | no | const needle = `%${toPosix(String(path)).replace(/^\\.\\//, &#39;&#39;)}%`; |
| sql | const | 227 | no | const sql = ` |
| rows | const | 235 | no | const rows = db.prepare(sql).all(...params, clampInt(limit, 1, 5000, 50)); |
| bySha | const | 237 | no | const bySha = new Map(); |
| placeholders | const | 239 | no | const placeholders = rows.map(() =&gt; &#39;?&#39;).join(&#39;,&#39;); |
| fileRows | const | 240 | no | const fileRows = db.prepare(` SELECT sha, path FROM commit_files WHERE sha IN (${placeholders}) ORDER BY sha, path `).all(...rows.map((r) =&gt; r.sha)); |
| parseLogRecords | function | 267 | no | function parseLogRecords(out) { |
| records | const | 268 | no | const records = []; |
| text | const | 270 | no | const text = chunk.replace(/^\\r?\\n/, &#39;&#39;); |
| lines | const | 272 | no | const lines = text.split(/\\r?\\n/); |
| files | const | 275 | no | const files = []; |
| tab | const | 278 | no | const tab = line.indexOf(&#39;\\t&#39;); |
| regressionAttribution | function | 307 | yes | export function regressionAttribution(db, { project = null, goodSha = null, badSha = null, path = null, limit = 50, } = {}) { |
| projectPath | variable | 314 | no | let projectPath = null; |
| projectName | variable | 315 | no | let projectName = null; |
| row | const | 317 | no | const row = projectRow(db, project.name \|\| project); |
| first | const | 321 | no | const first = resolveProjects(db, null, null)[0]; |
| capped | const | 335 | no | const capped = range.slice(0, clampInt(limit, 1, 5000, 50)); |
| culprit | const | 336 | no | const culprit = capped.length ? capped[0] : null; |
| logRangeFrom | function | 350 | no | function logRangeFrom(root, from, to, pathFilter) { |
| args | const | 351 | no | const args = [&#39;log&#39;, `${String(from)}..${String(to)}`, &#39;--no-renames&#39;, &#39;--name-status&#39;, |
| out | const | 354 | no | const out = tryGit(root, args); |
| mergeEvidenceGap | function | 378 | yes | export function mergeEvidenceGap(db, { project = null, branchA = null, branchB = null, since = null, verify = null, conflicts = null, drift: driftInput = null, } = {}) { |
| projectPath | variable | 384 | no | let projectPath = null; |
| projectName | variable | 385 | no | let projectName = null; |
| row | const | 387 | no | const row = projectRow(db, project.name \|\| project); |
| first | const | 391 | no | const first = resolveProjects(db, null, null)[0]; |
| missingEvidence | const | 401 | no | const missingEvidence = []; |
| divergence | const | 402 | no | const divergence = {}; |
| aOnly | const | 405 | no | const aOnly = branchA ? committedSequenceExcluding(projectPath, branchA, branchB) : []; |
| bOnly | const | 406 | no | const bOnly = branchB ? committedSequenceExcluding(projectPath, branchB, branchA) : []; |
| aFiles | const | 414 | no | const aFiles = changedFileSet(aOnly); |
| bFiles | const | 415 | no | const bFiles = changedFileSet(bOnly); |
| changedFiles | const | 416 | no | const changedFiles = [...new Set([...aFiles, ...bFiles])].sort(); |
| conflictingFiles | const | 417 | no | const conflictingFiles = [...aFiles].filter((p) =&gt; bFiles.has(p)).sort(); |
| hasVerify | const | 420 | no | const hasVerify = verify != null; |
| hasConflicts | const | 421 | no | const hasConflicts = conflicts != null; |
| diverged | const | 423 | no | const diverged = Boolean(divergence.aNotInB?.length \|\| divergence.bNotInA?.length); |
| unresolved | const | 435 | no | const unresolved = Array.isArray(conflicts) |
| untested | const | 458 | no | const untested = changedFiles.filter((path) =&gt; !hasTestEvidenceForPath(db, path)); |
| mergeReceipts | variable | 473 | no | let mergeReceipts = 0; |
| changedFileSet | function | 509 | no | function changedFileSet(records) { |
| out | const | 510 | no | const out = new Set(); |
| hasTestEvidenceForPath | function | 525 | no | function hasTestEvidenceForPath(db, path) { |
| row | const | 527 | no | const row = db.prepare(` SELECT COUNT(*) AS n FROM test_results WHERE file = ? OR file LIKE ? `).get(path, `%${path}%`); |
| receipt | const | 534 | no | const receipt = db.prepare(` SELECT COUNT(*) AS n FROM receipts WHERE kind = &#39;test-outcome&#39; AND (sources LIKE ? OR sources LIKE ?) `).get(`%${path}%`, `%/hq/test/${path}%`); |
| committedSequenceExcluding | function | 544 | no | function committedSequenceExcluding(root, include, exclude) { |
| out | const | 545 | no | const out = tryGit(root, [&#39;log&#39;, `${exclude}..${include}`, &#39;--no-renames&#39;, &#39;--name-status&#39;, &#39;--format=%x1e%H%x1f%P%x1f%an%x1f%aI%x1f%s&#39;]); |
| mergeBaseOf | function | 551 | no | function mergeBaseOf(root, a, b) { |
| out | const | 552 | no | const out = tryGit(root, [&#39;merge-base&#39;, a, b]); |
| readTextFile | function | 556 | no | function readTextFile(abs, maxBytes = 256 * 1024) { |
| stat | const | 558 | no | const stat = statSync(abs); |
| dirNames | function | 566 | no | function dirNames(abs) { |
| candidateFiles | function | 576 | no | function candidateFiles(db, project, projectId, cache) { |
| rows | const | 578 | no | const rows = db.prepare(` SELECT path, kind FROM files WHERE project_id = ? AND kind IN (&#39;source&#39;, &#39;doc&#39;, &#39;config&#39;) ORDER BY path `).all(projectId); |
| scanTodos | function | 594 | no | function scanTodos(db, project, projectId, cache, budget) { |
| results | const | 595 | no | const results = []; |
| text | const | 602 | no | const text = readTextFile(join(project.path, file.path)); |
| lines | const | 604 | no | const lines = text.split(/\\r?\\n/); |
| marker | const | 608 | no | const marker = match[1]; |
| textPart | const | 609 | no | const textPart = truncate(clean(lines[i].slice(match.index + marker.length).replace(/^[\\s:—–-]+/, &#39;&#39;)), 200); |
| REF_EXT | const | 617 | no | const REF_EXT = &#39;mjs\|js\|cjs\|jsx\|ts\|tsx\|mts\|cts\|py\|go\|rs\|java\|kt\|kts\|scala\|cs\|c\|h\|cc\|cpp\|hpp\|rb\|php\|swift\|lua\|sh\|ps1\|vue\|svelte\|sql\|md\|mdx&#39;; |
| docRefs | function | 619 | no | function docRefs(text) { |
| refs | const | 620 | no | const refs = new Set(); |
| ref | const | 623 | no | const ref = match[1].replace(/[:#]\\d+(?:-\\d+)?$/, &#39;&#39;); |
| mention | const | 626 | no | const mention = new RegExp(`(?:^\|[\\\\s(\\`&#39;&quot;[&lt;])([\\\\w.@/-]+\\\\.(?:${REF_EXT}))(?:[:#][\\\\w.-]+)?`, &#39;g&#39;); for (const match of text.matchAll(mention)) { refs.add(match[1]); } return [...refs].sort(); |
| resolveRefPath | function | 633 | no | function resolveRefPath(db, projectId, ref) { |
| cleaned | const | 634 | no | const cleaned = toPosix(ref).replace(/^\\.\\//, &#39;&#39;); |
| row | const | 637 | no | const row = db.prepare(` SELECT path FROM files WHERE project_id = ? AND (path = ? OR path LIKE ?) ORDER BY length(path) ASC, path ASC LIMIT 1 `).get(projectId, cleaned, `%/${cleaned}`); |
| lastChurn | function | 647 | no | function lastChurn(db, projectId, projectPath, path) { |
| row | const | 649 | no | const row = db.prepare(` SELECT MAX(c.date) AS date FROM commits c JOIN commit_files cf ON cf.sha = c.sha WHERE c.project_id = ? AND (cf.path = ? OR cf.path LIKE ?) `).get(projectId, path, `%/${path}… |
| stat | const | 657 | no | const stat = statSync(join(projectPath, path)); |
| scanStaleDocs | function | 664 | no | function scanStaleDocs(db, project, projectId, cache) { |
| docs | const | 665 | no | const docs = []; |
| rows | const | 667 | no | const rows = db.prepare(` SELECT path, mtime_ms FROM files WHERE project_id = ? AND kind = &#39;doc&#39; ORDER BY path LIMIT 40 `).all(projectId); |
| stale | const | 683 | no | const stale = []; |
| text | const | 686 | no | const text = readTextFile(join(project.path, doc.path), 200 * 1024); |
| refs | const | 688 | no | const refs = docRefs(text).filter((ref) =&gt; ref !== doc.path).slice(0, 12); |
| churn | variable | 691 | no | let churn = 0; |
| newest | variable | 692 | no | let newest = null; |
| path | const | 694 | no | const path = resolveRefPath(db, projectId, ref); |
| when | const | 696 | no | const when = lastChurn(db, projectId, project.path, path); |
| whenMs | const | 698 | no | const whenMs = Date.parse(when); |
| drift | function | 716 | yes | export function drift(db, { root = null, projects = null } = {}) { |
| list | const | 717 | no | const list = resolveProjects(db, root, projects); |
| staleIndex | const | 718 | no | const staleIndex = []; |
| dirty | const | 719 | no | const dirty = []; |
| aheadBehindList | const | 720 | no | const aheadBehindList = []; |
| staleDocs | const | 721 | no | const staleDocs = []; |
| todos | const | 722 | no | const todos = []; |
| missingDocs | const | 723 | no | const missingDocs = []; |
| cache | const | 724 | no | const cache = new Map(); |
| todoBudget | const | 725 | no | const todoBudget = { scanned: 0, results: 0 }; |
| row | const | 733 | no | const row = projectRow(db, project.name); |
| projectId | const | 734 | no | const projectId = row ? row.id : null; |
| files | const | 738 | no | const files = db.prepare(&#39;SELECT path, size, mtime_ms, indexed_at FROM files WHERE project_id = ?&#39;).all(projectId); |
| changed | variable | 739 | no | let changed = 0; |
| stat | variable | 742 | no | let stat; |
| indexedAt | const | 750 | no | const indexedAt = file.indexed_at ? Date.parse(file.indexed_at) : NaN; |
| dirtyList | const | 756 | no | const dirtyList = [...new Set(dirtyFiles(project.path) .map((file) =&gt; toPosix(file.path)) .filter((path) =&gt; path &amp;&amp; !isSecretPath(path)))].sort().slice(0, 200); |
| tracking | const | 761 | no | const tracking = aheadBehind(project.path); |
| names | const | 771 | no | const names = new Set(dirNames(project.path).map((name) =&gt; name.toLowerCase())); |
| missing | const | 772 | no | const missing = []; |
| newestTimestamp | function | 795 | no | function newestTimestamp(db) { |
| commit | const | 796 | no | const commit = db.prepare(&#39;SELECT MAX(date) AS value FROM commits&#39;).get(); |
| project | const | 798 | no | const project = db.prepare(&#39;SELECT MAX(indexed_at) AS value FROM projects&#39;).get(); |
| file | const | 800 | no | const file = db.prepare(&#39;SELECT MAX(indexed_at) AS value FROM files&#39;).get(); |
| languageRows | function | 804 | no | function languageRows(db, projectId, limit = 6) { |
| latestCommit | function | 819 | no | function latestCommit(db, projectId) { |
| row | const | 821 | no | const row = db.prepare(` SELECT sha, date, subject, type, scope FROM commits WHERE project_id = ? ORDER BY date DESC, sha ASC LIMIT 1 `).get(projectId); |
| shortSha | function | 829 | no | function shortSha(sha, length = 7) { |
| plural | function | 833 | no | function plural(count, singular, pluralForm = singular + &#39;s&#39;) { |
| brief | function | 842 | yes | export function brief(db, { root = null, projects = null, now = null, audience = &#39;agent&#39; } = {}) { |
| list | const | 843 | no | const list = resolveProjects(db, root, projects); |
| driftData | const | 844 | no | const driftData = drift(db, { root, projects: list }); |
| throughDate | const | 845 | no | const throughDate = now ? isoTimestamp(now) : (newestTimestamp(db) \|\| &#39;1970-01-01T00:00:00.000Z&#39;); |
| dirtyByProject | const | 847 | no | const dirtyByProject = new Map(driftData.dirty.map((entry) =&gt; [entry.project, entry.files.length])); |
| aheadByProject | const | 848 | no | const aheadByProject = new Map(driftData.aheadBehind.map((entry) =&gt; [entry.project, entry])); |
| staleByProject | const | 849 | no | const staleByProject = new Map(driftData.staleIndex.map((entry) =&gt; [entry.project, entry.changedSinceIndex])); |
| missingByProject | const | 850 | no | const missingByProject = new Map(driftData.missingDocs.map((entry) =&gt; [entry.project, entry.missing])); |
| todosByProject | const | 851 | no | const todosByProject = new Map(); |
| projectEntries | const | 856 | no | const projectEntries = []; |
| nextActions | const | 857 | no | const nextActions = []; |
| totalFiles | variable | 858 | no | let totalFiles = 0; |
| totalSymbols | variable | 859 | no | let totalSymbols = 0; |
| totalCommits | variable | 860 | no | let totalCommits = 0; |
| totalDirty | variable | 861 | no | let totalDirty = 0; |
| totalAhead | variable | 862 | no | let totalAhead = 0; |
| totalBehind | variable | 863 | no | let totalBehind = 0; |
| workspaceLanguages | const | 864 | no | const workspaceLanguages = new Map(); |
| row | const | 867 | no | const row = projectRow(db, project.name); |
| projectId | const | 868 | no | const projectId = row ? row.id : null; |
| tracking | const | 869 | no | const tracking = aheadByProject.get(project.name) \|\| { ahead: 0, behind: 0 }; |
| dirtyCount | const | 870 | no | const dirtyCount = dirtyByProject.get(project.name) \|\| 0; |
| staleCount | const | 871 | no | const staleCount = staleByProject.get(project.name) \|\| 0; |
| missing | const | 872 | no | const missing = missingByProject.get(project.name) \|\| []; |
| todoCount | const | 873 | no | const todoCount = todosByProject.get(project.name) \|\| 0; |
| languages | const | 874 | no | const languages = languageRows(db, projectId, 5); |
| commitRow | const | 875 | no | const commitRow = projectId |
| commits | const | 878 | no | const commits = Number(commitRow.count \|\| 0); |
| last | const | 879 | no | const last = latestCommit(db, projectId); |
| files | const | 880 | no | const files = Number(row?.file_count \|\| 0); |
| symbols | const | 881 | no | const symbols = Number(row?.symbol_count \|\| 0); |
| indexedAt | const | 882 | no | const indexedAt = row?.indexed_at \|\| null; |
| entry | const | 884 | no | const entry = { |
| current | const | 918 | no | const current = workspaceLanguages.get(language.lang) \|\| { lang: language.lang, label: language.label, files: 0 }; |
| recentCommits | const | 926 | no | const recentCommits = db.prepare(` SELECT c.sha, c.date, c.subject, c.type, c.scope, p.name AS project FROM commits c JOIN projects p ON p.id = c.project_id ${list.length ? `WHERE p.name IN (${list.m… |
| data | const | 940 | no | const data = { |
| renderBriefText | function | 973 | no | function renderBriefText(data, audience = &#39;agent&#39;) { |
| settings | const | 974 | no | const settings = [ |
| text | variable | 980 | no | let text = &#39;&#39;; |
| briefText | function | 988 | no | function briefText(data, { commitLimit, actionLimit, langLimit }, audience = &#39;agent&#39;) { |
| owner | const | 989 | no | const owner = audience === &#39;owner&#39; &amp;&amp; data.labels; |
| lines | const | 990 | no | const lines = []; |
| workspace | const | 991 | no | const workspace = data.workspace; |
| bits | const | 1002 | no | const bits = [ |
| own | const | 1018 | no | const own = data.nextActions.filter((action) =&gt; action.id === project.name).slice(0, 3); |
| feedWindow | function | 1042 | no | function feedWindow(db, { throughHead = null, throughDate = null } = {}) { |
| headDate | variable | 1043 | no | let headDate = null; |
| row | const | 1045 | no | const row = db.prepare(&#39;SELECT date FROM commits WHERE sha = ?&#39;).get(throughHead); |
| limits | const | 1048 | no | const limits = [throughDate, headDate].filter(Boolean).sort(); |
| escapeCell | function | 1052 | no | function escapeCell(value) { |
| buildFeed | function | 1060 | yes | export function buildFeed(db, { root = null, projects = null, throughHead = null, throughDate = null, } = {}) { |
| list | const | 1063 | no | const list = resolveProjects(db, root, projects); |
| names | const | 1064 | no | const names = list.map((project) =&gt; project.name); |
| namePlaceholders | const | 1067 | no | const namePlaceholders = names.map(() =&gt; &#39;?&#39;).join(&#39;,&#39;); |
| filters | const | 1068 | no | const filters = [`p.name IN (${namePlaceholders})`]; |
| params | const | 1069 | no | const params = [...names]; |
| commitRows | const | 1075 | no | const commitRows = names.length |
| filesBySha | const | 1085 | no | const filesBySha = new Map(); |
| placeholders | const | 1087 | no | const placeholders = commitRows.map(() =&gt; &#39;?&#39;).join(&#39;,&#39;); |
| fileRows | const | 1088 | no | const fileRows = db.prepare(` SELECT sha, path FROM commit_files WHERE sha IN (${placeholders}) ORDER BY sha, path `).all(...commitRows.map((row) =&gt; row.sha)); |
| commits | const | 1098 | no | const commits = commitRows.slice(0, 100).map((row) =&gt; ({ sha: row.sha, project: row.project, date: row.date, author: clean(row.author), |
| newest | const | 1109 | no | const newest = commitRows[0] \|\| null; |
| effectiveThroughHead | const | 1110 | no | const effectiveThroughHead = throughHead \|\| (newest ? newest.sha : null); |
| effectiveThroughDate | const | 1111 | no | const effectiveThroughDate = throughDate \|\| (newest ? newest.date : newestTimestamp(db)); |
| driftData | const | 1113 | no | const driftData = drift(db, { root, projects: list }); |
| dirtyByProject | const | 1114 | no | const dirtyByProject = new Map(driftData.dirty.map((entry) =&gt; [entry.project, entry.files.length])); |
| staleByProject | const | 1115 | no | const staleByProject = new Map(driftData.staleIndex.map((entry) =&gt; [entry.project, entry.changedSinceIndex])); |
| missingByProject | const | 1116 | no | const missingByProject = new Map(driftData.missingDocs.map((entry) =&gt; [entry.project, entry.missing])); |
| todoByProject | const | 1117 | no | const todoByProject = new Map(); |
| latestByProject | const | 1122 | no | const latestByProject = new Map(); |
| totalFiles | variable | 1127 | no | let totalFiles = 0; |
| totalSymbols | variable | 1128 | no | let totalSymbols = 0; |
| feedProjects | const | 1129 | no | const feedProjects = list.map((project) =&gt; { const row = projectRow(db, project.name); const projectId = row ? row.id : null; const latest = latestByProject.get(project.name) \|\| null; const languages… |
| row | const | 1130 | no | const row = projectRow(db, project.name); |
| projectId | const | 1131 | no | const projectId = row ? row.id : null; |
| latest | const | 1132 | no | const latest = latestByProject.get(project.name) \|\| null; |
| languages | const | 1133 | no | const languages = languageRows(db, projectId, 5); |
| files | const | 1134 | no | const files = Number(row?.file_count \|\| 0); |
| symbols | const | 1135 | no | const symbols = Number(row?.symbol_count \|\| 0); |
| body | const | 1157 | no | const body = { |
| digest | const | 1181 | no | const digest = sha256(canonicalJson(body)); |
| feed | const | 1182 | no | const feed = { |
| renderFeedMarkdown | function | 1198 | no | function renderFeedMarkdown(feed) { |
| lines | const | 1199 | no | const lines = []; |
| tag | const | 1215 | no | const tag = commit.type ? `[${commit.type}${commit.scope ? `/${commit.scope}` : &#39;&#39;}] ` : &#39;&#39;; |
| driftLines | const | 1220 | no | const driftLines = []; |
| firstDifference | function | 1239 | no | function firstDifference(committed, fresh) { |
| a | const | 1240 | no | const a = String(committed).split(&#39;\\n&#39;); |
| b | const | 1241 | no | const b = String(fresh).split(&#39;\\n&#39;); |
| max | const | 1242 | no | const max = Math.max(a.length, b.length); |
| checkFeed | function | 1253 | yes | export function checkFeed(db, { root = null, projects = null, committedJson = null, committedMarkdown = null, } = {}) { |
| reasons | const | 1256 | no | const reasons = []; |
| throughHead | variable | 1261 | no | let throughHead = null; |
| throughDate | variable | 1262 | no | let throughDate = null; |
| parsed | variable | 1264 | no | let parsed = null; |
| fresh | const | 1277 | no | const fresh = buildFeed(db, { root, projects, throughHead, throughDate }); |
| committed | const | 1280 | no | const committed = String(committedJson); |
| line | const | 1282 | no | const line = firstDifference(committed, fresh.json); |
| committed | const | 1287 | no | const committed = String(committedMarkdown); |
| line | const | 1289 | no | const line = firstDifference(committed, fresh.markdown); |
| recordTestResult | function | 1304 | yes | export function recordTestResult(db, { project = null, sha = null, testId = null, status = null, file = null, line = null, durationMs = null, output = null, } = {}) { |
| projectId | variable | 1311 | no | let projectId = null; |
| row | const | 1313 | no | const row = projectRow(db, project.name \|\| project); |
| statusClean | const | 1316 | no | const statusClean = clean(String(status ?? &#39;pass&#39;)); |
| lineNum | const | 1317 | no | const lineNum = line == null ? null : Number(line); |
| durationNum | const | 1318 | no | const durationNum = durationMs == null ? null : Number(durationMs); |
| testsPassedOnlyOnOlderRevisions | function | 1356 | yes | export function testsPassedOnlyOnOlderRevisions(db, { project = null } = {}) { |
| list | variable | 1357 | no | let list; |
| row | const | 1359 | no | const row = projectRow(db, project.name \|\| project); |
| results | const | 1367 | no | const results = []; |
| headSha | const | 1369 | no | const headSha = head(pr.path); |
| rows | const | 1370 | no | const rows = db.prepare(` SELECT tr.test_id, tr.sha, c.date FROM test_results tr JOIN commits c ON c.sha = tr.sha WHERE tr.project_id = ? AND tr.status = &#39;pass&#39; |
| lastPass | const | 1377 | no | const lastPass = new Map(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| ./git.mjs | import | 9 | [hq/lib/git.mjs](./git.mjs.md) |
| ./walk.mjs | import | 12 | [hq/lib/walk.mjs](./walk.mjs.md) |
| ./lang.mjs | import | 13 | [hq/lib/lang.mjs](./lang.mjs.md) |
| ./vivim.mjs | import | 14 | [hq/lib/vivim.mjs](./vivim.mjs.md) |
| ./schema.mjs | import | 15 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./nomenclature.mjs | import | 16 | [hq/lib/nomenclature.mjs](./nomenclature.mjs.md) |
| ./util.mjs | import | 17 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-048-tests-older-revisions.mjs](../aii/fixtures/HQ-048-tests-older-revisions.mjs.md) | ../../lib/lake.mjs |
| [hq/aii/fixtures/HQ-061-regression-attribution.mjs](../aii/fixtures/HQ-061-regression-attribution.mjs.md) | ../../lib/lake.mjs |
| [hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs](../aii/fixtures/HQ-079-merge-evidence-gap.mjs.md) | ../../lib/lake.mjs |
| [hq/aii/fixtures/HQ-097-materially-changed.mjs](../aii/fixtures/HQ-097-materially-changed.mjs.md) | ../../lib/lake.mjs |
| [hq/aii/fixtures/HQ-098-stale-findings.mjs](../aii/fixtures/HQ-098-stale-findings.mjs.md) | ../../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/lake.mjs |
| [hq/lib/automation.mjs](./automation.mjs.md) | ./lake.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./lake.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./lake.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./lake.mjs |
| [hq/test/lake.test.mjs](../test/lake.test.mjs.md) | ../lib/lake.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/lake.mjs — commit lake, drift detection, owner brief and static feed.
//
// Everything is deterministic. The brief and feed never read the wall clock:
// "now" is the newest commit date (or an injected `now`), so the same database
// and working tree always render the same bytes. Storage timestamps
// (`inserted_at`, `added_at`) are written but never appear in generated output.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import {
  aheadBehind, branch, dirtyFiles, head, logRecords, remote, tryGit,
} from './git.mjs';
import { discoverFiles } from './walk.mjs';
import { languageLabel } from './lang.mjs';
import { alignmentSummary, alignmentMarkdown } from './vivim.mjs';
import { transaction } from './schema.mjs';
import { userTerm } from './nomenclature.mjs';
import { canonicalJson, nowISO, sha256, toPosix, truncate } from './util.mjs';

const TODO_RE = /\b(TODO|FIXME|HACK|XXX)\b/;
const MAX_TODO_RESULTS = 200;
const MAX_TODO_FILES = 500;
const MAX_TEXT_BYTES = 6000;

const SECRET_NAMES = new Set([
  'session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'login data',
]);

// Never persist or render secret material, not even file names.
function isSecretPath(value) {
  const posix = toPosix(value);
  const name = (posix.split('/').pop() || '').trim().toLowerCase();
  if (!name) return true;
  if (name.startsWith('.env')) return true;
  if (name.endsWith('.keystore')) return true;
  return SECRET_NAMES.has(name);
}

function clampInt(value, lo, hi, fallback = lo) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.trunc(n)));
}

function isoTimestamp(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : String(value);
}

function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function clean(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function byteLength(text) {
  return Buffer.byteLength(String(text), 'utf8');
}

// clampBytes — hard ceiling that never splits a UTF-8 sequence.
function clampBytes(text, max) {
  let out = String(text);
  if (byteLength(out) <= max) return out;
  while (out.length > 0 && byteLength(out) > max) out = out.slice(0, -1);
  return out;
}

// Conventional commit: type(scope)!: subject
const CONVENTIONAL_RE = /^([A-Za-z][A-Za-z0-9_-]*)(?:\(([^()\r\n]+)\))?(!)?:\s*(.+)$/;

function parseConventional(subject) {
  const match = CONVENTIONAL_RE.exec(String(subject ?? '').trim());
  if (!match) return { type: null, scope: null, breaking: false, description: null };
  return {
```

_First 80 of 1394 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
