# File: hq/lib/context.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/context.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 42395 B |
| Lines | 1045 |
| Hash | 0389fe867291 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BUNDLE_SCHEMA | const | 22 | no | const BUNDLE_SCHEMA = &#39;hq.context-bundle/1&#39;; |
| ESTIMATOR | const | 23 | no | const ESTIMATOR = &#39;utf8-bytes/3&#39;; |
| MAX_FILE_BYTES | const | 26 | no | const MAX_FILE_BYTES = 24 * 1024; |
| VERIFY_BYTES | const | 28 | no | const VERIFY_BYTES = 64 * 1024; |
| SEMANTIC_VERIFY_BYTES | const | 30 | no | const SEMANTIC_VERIFY_BYTES = 1_500_001; |
| DOC_LINE_LIMIT | const | 31 | no | const DOC_LINE_LIMIT = 120; |
| COVERAGE_CHARS | const | 32 | no | const COVERAGE_CHARS = 2500; |
| TOKEN_UNIT | const | 33 | no | const TOKEN_UNIT = 32; |
| OVERHEAD_TOKENS | const | 34 | no | const OVERHEAD_TOKENS = 80; |
| RECENCY_DAYS | const | 35 | no | const RECENCY_DAYS = 90; |
| NO_DATE_RECENCY | const | 36 | no | const NO_DATE_RECENCY = 0.25; |
| MAX_SYMBOLS | const | 37 | no | const MAX_SYMBOLS = 60; |
| CONTENT_HITS | const | 39 | no | const CONTENT_HITS = 40; |
| SYMBOL_HITS | const | 40 | no | const SYMBOL_HITS = 40; |
| PATH_HITS | const | 41 | no | const PATH_HITS = 20; |
| DOC_HITS | const | 42 | no | const DOC_HITS = 10; |
| RECENT_HITS | const | 43 | no | const RECENT_HITS = 10; |
| TOKEN_QUERIES | const | 44 | no | const TOKEN_QUERIES = 12; |
| SYMBOL_PER_TOKEN | const | 45 | no | const SYMBOL_PER_TOKEN = 6; |
| SYMBOL_BONUS_EXACT | const | 52 | no | const SYMBOL_BONUS_EXACT = 1.2; |
| SYMBOL_BONUS_PREFIX | const | 53 | no | const SYMBOL_BONUS_PREFIX = 0.7; |
| SYMBOL_BONUS_SUBSTRING | const | 54 | no | const SYMBOL_BONUS_SUBSTRING = 0.3; |
| PATH_BONUS_EXACT | const | 55 | no | const PATH_BONUS_EXACT = 0.9; |
| PATH_BONUS_PREFIX | const | 56 | no | const PATH_BONUS_PREFIX = 0.45; |
| TEST_SCORE_DEMOTE | const | 57 | no | const TEST_SCORE_DEMOTE = 0.6; |
| PER_TOKEN_CONTENT_HITS | const | 58 | no | const PER_TOKEN_CONTENT_HITS = 8; |
| REASON_ORDER | const | 60 | no | const REASON_ORDER = [&#39;semantic&#39;, &#39;symbol&#39;, &#39;fts&#39;, &#39;path&#39;, &#39;doc&#39;, &#39;recent&#39;]; |
| LABELS | const | 65 | no | const LABELS = Object.freeze({ aperture: userTerm(&#39;aperture&#39;), evidence: userTerm(&#39;evidence&#39;), }); |
| cmp | function | 70 | no | function cmp(a, b) { |
| left | const | 71 | no | const left = String(a ?? &#39;&#39;); |
| right | const | 72 | no | const right = String(b ?? &#39;&#39;); |
| round6 | function | 76 | no | function round6(value) { |
| toCount | function | 80 | no | function toCount(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) { |
| n | const | 81 | no | const n = Number(value); |
| toIso | function | 86 | no | function toIso(value) { |
| ms | const | 90 | no | const ms = Number(value); |
| text | const | 93 | no | const text = String(value); |
| ms | const | 94 | no | const ms = Date.parse(text); |
| isSecretPath | function | 98 | no | function isSecretPath(value) { |
| readPrefix | function | 104 | no | function readPrefix(absPath, maxBytes) { |
| fd | variable | 105 | no | let fd = null; |
| buffer | const | 108 | no | const buffer = Buffer.alloc(maxBytes); |
| read | const | 109 | no | const read = readSync(fd, buffer, 0, maxBytes, 0); |
| splitLines | function | 120 | no | function splitLines(text) { |
| parts | const | 122 | no | const parts = text.split(/\\r?\\n/); |
| selectWindow | function | 129 | no | function selectWindow(parts, { start = 1, maxLines = null, maxBytes = MAX_FILE_BYTES } = {}) { |
| total | const | 130 | no | const total = parts.length; |
| first | const | 132 | no | const first = Math.min(Math.max(1, Math.trunc(start) \|\| 1), total); |
| last | const | 133 | no | const last = maxLines == null ? total : Math.min(total, first + Math.max(0, Math.trunc(maxLines)) - 1); |
| chosen | const | 134 | no | const chosen = []; |
| bytes | variable | 135 | no | let bytes = 0; |
| value | const | 137 | no | const value = parts[line - 1]; |
| extra | const | 138 | no | const extra = Buffer.byteLength(value, &#39;utf8&#39;) + (chosen.length ? 1 : 0); |
| mergeRanges | function | 149 | no | function mergeRanges(ranges) { |
| sorted | const | 150 | no | const sorted = ranges |
| merged | const | 153 | no | const merged = []; |
| tail | const | 155 | no | const tail = merged[merged.length - 1]; |
| selectSymbolWindow | function | 165 | no | function selectSymbolWindow(parts, ranges) { |
| merged | const | 166 | no | const merged = mergeRanges(ranges).slice(0, 3); |
| start | const | 168 | no | const start = merged[0][0]; |
| docAuthority | function | 174 | no | function docAuthority(filePath) { |
| posix | const | 175 | no | const posix = toPosix(filePath).toLowerCase(); |
| base | const | 176 | no | const base = posix.split(&#39;/&#39;).pop() \|\| &#39;&#39;; |
| reasonLabel | function | 183 | no | function reasonLabel(reasons) { |
| parts | const | 184 | no | const parts = REASON_ORDER.filter((reason) =&gt; reasons.has(reason)); |
| sourceDigest | function | 190 | no | function sourceDigest(source) { |
| bundleDigest | function | 209 | no | function bundleDigest(bundle) { |
| sources | const | 210 | no | const sources = (Array.isArray(bundle?.sources) ? bundle.sources : []).map((source) =&gt; ({ ref: source.ref, project: source.project, path: source.path, kind: source.kind, |
| emptyBundle | function | 240 | no | function emptyBundle(base) { |
| bundle | const | 241 | no | const bundle = { |
| resolveProject | function | 266 | no | function resolveProject(db, project) { |
| requested | const | 267 | no | const requested = project == null |
| row | const | 273 | no | const row = db.prepare(` SELECT id, name, path FROM projects WHERE lower(name) = lower(?) OR path = ? ORDER BY name ASC LIMIT 1`).get(requested, requested); |
| createCollector | function | 281 | no | function createCollector(db) { |
| lookup | const | 282 | no | const lookup = db.prepare(` SELECT f.id AS id, f.path AS path, f.abs_path AS abs_path, f.lang AS lang, f.kind AS kind, f.size AS size, f.mtime_ms AS mtime_ms, f.lines AS lines, f.is_test AS is_test, … |
| map | const | 289 | no | const map = new Map(); |
| add | function | 291 | no | function add(hit, reason, extra = {}) { |
| filePath | const | 293 | no | const filePath = toPosix(hit.path); |
| ref | const | 295 | no | const ref = `${hit.project}:${filePath}`; |
| candidate | variable | 296 | no | let candidate = map.get(ref); |
| row | variable | 298 | no | let row = null; |
| line | const | 325 | no | const line = Number(extra.symbol.line) \|\| 1; |
| endLine | const | 326 | no | const endLine = Number(extra.symbol.end_line) \|\| line; |
| collectSymbolHits | function | 340 | no | function collectSymbolHits(db, task, projectName, add) { |
| seen | const | 341 | no | const seen = new Set(); |
| count | variable | 342 | no | let count = 0; |
| push | function | 343 | no | const push = (hit) =&gt; { |
| key | const | 345 | no | const key = `${hit.project}\\0${hit.path}\\0${hit.name}\\0${hit.line}`; |
| collectPathHits | function | 363 | no | function collectPathHits(db, tokens, projectName, add) { |
| touched | const | 364 | no | const touched = new Set(); |
| results | variable | 367 | no | let results = []; |
| candidate | const | 371 | no | const candidate = add(hit, &#39;path&#39;); |
| collectDocHits | function | 377 | no | function collectDocHits(db, task, tokens, projectName, add) { |
| docs | const | 378 | no | const docs = new Map(); |
| consider | function | 379 | no | const consider = (hit) =&gt; { |
| path | const | 381 | no | const path = toPosix(hit.path); |
| ref | const | 383 | no | const ref = `${hit.project}:${path}`; |
| ordered | const | 404 | no | const ordered = [...docs.values()].sort((a, b) =&gt; ( docAuthority(b.path) - docAuthority(a.path) \|\| cmp(a.ref, b.ref) )).slice(0, DOC_HITS); |
| collectRecent | function | 410 | no | function collectRecent(db, projectName, add) { |
| rows | variable | 411 | no | let rows = []; |
| params | const | 414 | no | const params = projectName ? [projectName] : []; |
| touched | const | 425 | no | const touched = new Set(); |
| candidate | const | 429 | no | const candidate = add({ project: row.project, path: row.path }, &#39;recent&#39;); |
| collectCandidates | function | 434 | no | function collectCandidates(db, { task, projectName, sourceSemanticIds = [], strict = false }) { |
| collector | const | 435 | no | const collector = createCollector(db); |
| tokens | const | 436 | no | const tokens = tokenize(task).slice(0, TOKEN_QUERIES); |
| semanticQuery | const | 440 | no | const semanticQuery = strict ? sourceSemanticIds.join(&#39; &#39;) : [...sourceSemanticIds, task].join(&#39; &#39;); |
| seenContent | const | 455 | no | const seenContent = new Set(); |
| contentCount | variable | 456 | no | let contentCount = 0; |
| candidate | const | 462 | no | const candidate = collector.add(hit, &#39;fts&#39;); |
| newestCommitDates | function | 479 | no | function newestCommitDates(db, projectName) { |
| params | const | 481 | no | const params = projectName ? [projectName] : []; |
| rows | variable | 482 | no | let rows = []; |
| dates | const | 493 | no | const dates = new Map(); |
| ms | const | 496 | no | const ms = Date.parse(row.date); |
| key | const | 498 | no | const key = `${row.project}\\0${toPosix(row.path)}`; |
| previous | const | 499 | no | const previous = dates.get(key); |
| importProximity | function | 505 | no | function importProximity(db, projectName, candidateIds) { |
| params | const | 507 | no | const params = projectName ? [projectName] : []; |
| rows | variable | 508 | no | let rows = []; |
| close | const | 518 | no | const close = new Set(); |
| a | const | 521 | no | const a = Number(row.a); |
| b | const | 522 | no | const b = Number(row.b); |
| symbolMatchBonus | function | 534 | no | function symbolMatchBonus(symbolHits, gradeTokens) { |
| bonus | variable | 535 | no | let bonus = 0; |
| name | const | 537 | no | const name = String(hit?.name ?? &#39;&#39;).toLowerCase(); |
| pathMatchBonus | function | 549 | no | function pathMatchBonus(path, gradeTokens) { |
| prepareCandidates | function | 556 | no | function prepareCandidates(db, candidates, { task, projectName, nowMs, preferredSemanticAnchor, strict=false }) { |
| tokens | const | 557 | no | const tokens = tokenize(task); |
| words | const | 561 | no | const words = contentTokens(task); |
| gradeTokens | const | 562 | no | const gradeTokens = words.length ? words : tokens; |
| ids | const | 563 | no | const ids = new Set(candidates.map((candidate) =&gt; candidate.fileId)); |
| close | const | 564 | no | const close = importProximity(db, projectName, ids); |
| commitDates | const | 565 | no | const commitDates = newestCommitDates(db, projectName); |
| semantic | const | 568 | no | const semantic = strict?candidate.semanticReferences.filter(r=&gt;r.semanticAnchor?.state===&#39;indexed&#39;&amp;&amp; ![&#39;invalid_kind&#39;,&#39;deprecated&#39;].includes(r.resolution)):candidate.semanticReferences; |
| raw | const | 570 | no | const raw = readPrefix(candidate.absPath, semantic.length ? SEMANTIC_VERIFY_BYTES : MAX_FILE_BYTES); |
| parts | const | 579 | no | const parts = splitLines(raw); |
| window | variable | 585 | no | let window; |
| preferred | const | 589 | no | const preferred = candidate.ref === preferredSemanticAnchor?.ref |
| line | const | 592 | no | const line = (preferred ?? semantic[0]).line; |
| first | const | 593 | no | const first=strict?Math.min(...semantic.map(r=&gt;r.line)):line; |
| last | const | 594 | no | const last=strict?Math.max(...semantic.map(r=&gt;r.line)):line; |
| start | const | 595 | no | const start=Math.max(1,first-2); |
| haystack | const | 618 | no | const haystack = window.text.slice(0, COVERAGE_CHARS).toLowerCase(); |
| matched | const | 619 | no | const matched = gradeTokens.filter((token) =&gt; haystack.includes(token)).length; |
| coverage | const | 620 | no | const coverage = gradeTokens.length ? matched / gradeTokens.length : 0; |
| symbolBonus | const | 621 | no | const symbolBonus = symbolMatchBonus(candidate.symbolHits, gradeTokens); |
| pathBonus | const | 622 | no | const pathBonus = pathMatchBonus(candidate.path, gradeTokens); |
| dateMs | const | 623 | no | const dateMs = commitDates.get(`${candidate.project}\\0${candidate.path}`); |
| mtimeMs | const | 624 | no | const mtimeMs = candidate.mtimeMs; |
| ageMs | const | 625 | no | const ageMs = dateMs != null |
| recency | const | 628 | no | const recency = ageMs == null |
| authority | const | 631 | no | const authority = docAuthority(candidate.path); |
| proximity | const | 632 | no | const proximity = close.has(candidate.fileId) ? 1 : 0; |
| rawScore | const | 645 | no | const rawScore = 1 |
| knapsack | function | 662 | no | function knapsack(items, capacity, maxFiles) { |
| unitCap | const | 663 | no | const unitCap = Math.floor(Math.max(0, capacity) / TOKEN_UNIT); |
| count | const | 664 | no | const count = items.length; |
| fileCap | const | 665 | no | const fileCap = Math.max(0, Math.trunc(maxFiles)); |
| width | const | 668 | no | const width = fileCap + 1; |
| size | const | 669 | no | const size = (unitCap + 1) * width; |
| layers | const | 670 | no | const layers = new Array(count + 1); |
| zero | const | 671 | no | const zero = new Int32Array(size).fill(-1); |
| weights | const | 675 | no | const weights = items.map((item) =&gt; Math.max(1, Math.ceil(item.estimatedTokens / TOKEN_UNIT))); |
| values | const | 676 | no | const values = items.map((item) =&gt; Math.round(item.score * 1e6)); |
| previous | const | 679 | no | const previous = layers[i - 1]; |
| next | const | 680 | no | const next = previous.slice(); |
| weight | const | 681 | no | const weight = weights[i - 1]; |
| value | const | 682 | no | const value = values[i - 1]; |
| before | const | 685 | no | const before = previous[(j - weight) * width + (k - 1)]; |
| index | const | 687 | no | const index = j * width + k; |
| total | const | 688 | no | const total = before + value; |
| top | const | 695 | no | const top = layers[count]; |
| bestValue | variable | 696 | no | let bestValue = -1; |
| bestTokens | variable | 697 | no | let bestTokens = 0; |
| bestFiles | variable | 698 | no | let bestFiles = 0; |
| value | const | 701 | no | const value = top[j * width + k]; |
| j | variable | 711 | no | let j = bestTokens; |
| k | variable | 712 | no | let k = bestFiles; |
| picked | const | 713 | no | const picked = new Array(count).fill(false); |
| current | const | 715 | no | const current = layers[i][j * width + k]; |
| above | const | 716 | no | const above = layers[i - 1][j * width + k]; |
| buildSymbols | function | 726 | no | function buildSymbols(selected) { |
| symbols | const | 727 | no | const symbols = new Map(); |
| key | const | 731 | no | const key = `${candidate.project}\\0${candidate.path}\\0${hit.line}\\0${hit.name}`; |
| selectMandatorySources | function | 758 | yes | export function selectMandatorySources(candidates,ids,{capacity,maxFiles}){ |
| valid | const | 759 | no | const valid=candidates.filter(c=&gt;!c.unreadable&amp;&amp;c.semanticReferences?.length) |
| wanted | const | 761 | no | const wanted=new Set(ids); |
| covers | function | 762 | no | const covers=c=&gt;new Set(c.semanticReferences.filter(r=&gt;wanted.has(r.semanticId)&amp;&amp; r.semanticAnchor?.state===&#39;indexed&#39;&amp;&amp;![&#39;invalid_kind&#39;,&#39;deprecated&#39;].includes(r.resolution)).map(r=&gt;r.semanticId)); |
| covered | const | 764 | no | const covered=new Set(valid.flatMap(c=&gt;[...covers(c)])); |
| missing | const | 765 | no | const missing=ids.filter(id=&gt;!covered.has(id)); |
| best | variable | 770 | no | let best=null; |
| visit | function | 771 | no | function visit(start,chosen,seen,cost){ |
| total | const | 773 | no | const total=cost+estimateTokens(JSON.stringify(semanticPacketManifest(ids,chosen))); |
| c | const | 781 | no | const c=valid[i],next=new Set([...seen,...covers(c)]); |
| semanticPacketManifest | function | 790 | yes | export function semanticPacketManifest(ids,sources,status=&#39;complete&#39;,missing=[]){ |
| dependencies | const | 791 | no | const dependencies=sources.flatMap(source=&gt;(source.semanticReferences\|\|[]).map(r=&gt;({ ref:source.ref,semanticId:r.semanticId,annotationKind:r.annotationKind,line:r.line, anchorId:r.semanticAnchor?.anc… |
| composeContext | function | 803 | yes | export function composeContext(db, options = {}) { |
| supplied | const | 804 | no | const supplied = options.sourceSemanticIds ?? []; |
| sourceSemanticIds | const | 808 | no | const sourceSemanticIds = [...new Set(supplied)].sort(); |
| strict | const | 809 | no | const strict=options.requireSemanticCoverage===true; |
| requestedTask | const | 810 | no | const requestedTask=String(options.task ?? &#39;&#39;).trim(); |
| task | const | 812 | no | const task=strict&amp;&amp;requestedTask?&#39;Exact semantic source lookup&#39;:requestedTask; |
| project | const | 813 | no | const project = resolveProject(db, options.project); |
| budgetTokens | const | 814 | no | const budgetTokens = toCount(options.budgetTokens, 6000, 0, 10_000_000); |
| reservedForOutput | const | 815 | no | const reservedForOutput = toCount(options.reservedForOutput, 800, 0, budgetTokens); |
| maxFiles | const | 816 | no | const maxFiles = toCount(options.maxFiles, 24, 0, 500); |
| generatedAt | const | 817 | no | const generatedAt = toIso(options.now); |
| parsed | const | 818 | no | const parsed = Date.parse(generatedAt); |
| nowMs | const | 819 | no | const nowMs = Number.isFinite(parsed) ? parsed : Date.now(); |
| capacity | const | 820 | no | const capacity = Math.max(0, budgetTokens - reservedForOutput - OVERHEAD_TOKENS); |
| base | const | 822 | no | const base = { |
| finishEmpty | function | 830 | no | const finishEmpty=(status,missing=sourceSemanticIds)=&gt;{ |
| b | const | 831 | no | const b=emptyBundle(base); |
| allowedSourceRefs | const | 839 | no | const allowedSourceRefs = options.allowedSourceRefs; |
| candidates | const | 843 | no | const candidates = collectCandidates(db, { task, projectName: project.name, sourceSemanticIds,strict }) |
| readable | const | 848 | no | const readable = candidates.filter((candidate) =&gt; !candidate.unreadable); |
| mandatory | const | 849 | no | const mandatory=strict?selectMandatorySources(readable,sourceSemanticIds,{capacity,maxFiles}):null; |
| selected | const | 851 | no | const selected = (mandatory?mandatory.selected:knapsack(readable, capacity, maxFiles)) |
| sources | const | 854 | no | const sources = []; |
| fragments | const | 855 | no | const fragments = []; |
| chosen | const | 856 | no | const chosen = new Set(); |
| used | variable | 857 | no | let used = 0; |
| header | const | 879 | no | const header = JSON.stringify({ ref: candidate.ref, lines: candidate.lines, sha256: candidate.sha256, ...(candidate.contentHash ? { contentHash: candidate.contentHash, semanticReferences: candidate.s… |
| omissions | const | 888 | no | const omissions = (strict?[]:candidates) |
| symbols | const | 896 | no | const symbols = buildSymbols(selected.filter((candidate) =&gt; chosen.has(candidate.ref))); |
| bundle | const | 898 | no | const bundle = { |
| mandatoryTokens | const | 926 | no | const mandatoryTokens=estimateTokens(JSON.stringify(bundle.semanticPacket)); |
| vivimBlockForTask | function | 936 | no | function vivimBlockForTask(db, task) { |
| alignment | const | 938 | no | const alignment = alignmentForTask(db, String(task ?? &#39;&#39;)); |
| resolveSourcePath | function | 950 | no | function resolveSourcePath(bundle, source) { const hint = source?.absPath ?? source?.abs_path; |
| rel | const | 953 | no | const rel = toPosix(source?.path ?? &#39;&#39;); |
| tries | const | 955 | no | const tries = []; |
| cwd | const | 956 | no | const cwd = process.cwd(); |
| root | const | 957 | no | const root = bundle?.workspaceRoot ?? bundle?.root ?? null; |
| verifyContext | function | 978 | yes | export function verifyContext(bundle) { |
| sources | const | 979 | no | const sources = Array.isArray(bundle?.sources) ? bundle.sources : []; |
| changed | const | 980 | no | const changed = []; |
| currentSources | const | 981 | no | const currentSources = []; |
| currentFragments | const | 982 | no | const currentFragments=[]; |
| currentPayloadTokens | variable | 983 | no | let currentPayloadTokens=0; |
| absPath | const | 986 | no | const absPath = resolveSourcePath(bundle, source); |
| raw | const | 992 | no | const raw = readPrefix(absPath, source.contentHash ? SEMANTIC_VERIFY_BYTES : VERIFY_BYTES); |
| parts | const | 998 | no | const parts = splitLines(raw); |
| start | const | 1000 | no | const start = Math.max(1, Math.trunc(range[0]) \|\| 1); |
| text | const | 1002 | no | const text = parts.slice(start - 1, Math.min(parts.length, end)).join(&#39;\\n&#39;); |
| currentSha | const | 1003 | no | const currentSha = sha256(text); |
| header | const | 1005 | no | const header=JSON.stringify({ref:source.ref,lines:source.lines,sha256:currentSha, contentHash:sha256(raw),semanticReferences:source.semanticReferences}); |
| fragment | const | 1007 | no | const fragment=&#39;SOURCE &#39;+header+&#39;\\n&#39;+text; |
| cost | const | 1009 | no | const cost=estimateTokens(fragment+&#39;\\n\\n&#39;); |
| currentDigest | const | 1013 | no | const currentDigest = sourceDigest({ ref: source.ref, project: source.project, path: source.path, kind: source.kind, |
| current | const | 1034 | no | const current = bundleDigest({ ...bundle, sources: currentSources }); |
| expected | const | 1035 | no | const expected = typeof bundle?.digest === &#39;string&#39; &amp;&amp; bundle.digest ? bundle.digest : null; |
| packet | const | 1036 | no | const packet=bundle?.semanticPacket; |
| packetValid | const | 1037 | no | const packetValid=!packet\|\|(packet.status===&#39;complete&#39;&amp;&amp;packet.planningEligible===false&amp;&amp; digestOf(packet)===digestOf(semanticPacketManifest(bundle.sourceSemanticIds\|\|[],sources))&amp;&amp; (bundle.sourceSem… |
| valid | const | 1043 | no | const valid = packetValid &amp;&amp; changed.length === 0 &amp;&amp; expected !== null &amp;&amp; expected === current; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 11 | external |
| node:path | import | 12 | external |
| ./nomenclature.mjs | import | 13 | [hq/lib/nomenclature.mjs](./nomenclature.mjs.md) |
| ./vivim.mjs | import | 14 | [hq/lib/vivim.mjs](./vivim.mjs.md) |
| ./annotation-v2.mjs | import | 15 | [hq/lib/annotation-v2.mjs](./annotation-v2.mjs.md) |
| ./search.mjs | import | 16 | [hq/lib/search.mjs](./search.mjs.md) |
| ./util.mjs | import | 18 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-094-investigate-architectural-question.mjs](../aii/fixtures/HQ-094-investigate-architectural-question.mjs.md) | ../../lib/context.mjs |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](../aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | ../../lib/context.mjs |
| [hq/aii/fixtures/HQ-100-autonomous-investigation.mjs](../aii/fixtures/HQ-100-autonomous-investigation.mjs.md) | ../../lib/context.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/context.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/context.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/context.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/context.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./context.mjs |
| [hq/lib/autonomy.mjs](./autonomy.mjs.md) | ./context.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./context.mjs |
| [hq/test/context-ranking.test.mjs](../test/context-ranking.test.mjs.md) | ../lib/context.mjs |
| [hq/test/context.test.mjs](../test/context.test.mjs.md) | ../lib/context.mjs |
| [hq/test/semantic-packet.test.mjs](../test/semantic-packet.test.mjs.md) | ../lib/context.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/context.mjs — task-scoped context bundles.
//
// composeContext turns one task description into a small, budgeted slice of the
// local index: which files were read, exactly which lines, the sha256 of that
// text, and why each file earned its place. A bundle carries no authority — it
// is a read-only projection that another tool (or a person) can verify later
// with verifyContext, without trusting the bundle's retained text.
//
// Determinism is a feature: candidates are sorted by ref, the knapsack is
// solved in fixed 32-token units, and generatedAt is excluded from the digest.
import { closeSync, existsSync, openSync, readSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { userTerm } from './nomenclature.mjs';
import { alignmentForTask } from './vivim.mjs';
import { isVersionedId } from './annotation-v2.mjs';
import { findFiles, searchContent, searchSymbols, searchSemanticReferences, isSensitiveSourcePath,
  contentTokens, isNoisyPath, pathTokenMatch } from './search.mjs';
import {
  digestOf, estimateTokens, sha256, toPosix, tokenize,
} from './util.mjs';

const BUNDLE_SCHEMA = 'hq.context-bundle/1';
const ESTIMATOR = 'utf8-bytes/3';

// Excerpt byte cap; ordinary symbol/doc candidates also retain this read cap.
const MAX_FILE_BYTES = 24 * 1024;
// Verification needs at least the bytes composeContext was allowed to read.
const VERIFY_BYTES = 64 * 1024;
// Semantic candidates verify the whole indexed file, but excerpts retain MAX_FILE_BYTES.
const SEMANTIC_VERIFY_BYTES = 1_500_001;
const DOC_LINE_LIMIT = 120;
const COVERAGE_CHARS = 2500;
const TOKEN_UNIT = 32;
const OVERHEAD_TOKENS = 80;
const RECENCY_DAYS = 90;
const NO_DATE_RECENCY = 0.25;
const MAX_SYMBOLS = 60;

const CONTENT_HITS = 40;
const SYMBOL_HITS = 40;
const PATH_HITS = 20;
const DOC_HITS = 10;
const RECENT_HITS = 10;
const TOKEN_QUERIES = 12;
const SYMBOL_PER_TOKEN = 6;

// ZAIQ-013 ranking weights. The scorer rewards precision signals (a symbol
// literally named like the task, a path that names the concept) instead of a
// flat "any symbol hit" bonus, measures coverage over content words rather
// than every function word, and demotes test/fixture locations so
// implementation files answer first.
const SYMBOL_BONUS_EXACT = 1.2;
const SYMBOL_BONUS_PREFIX = 0.7;
const SYMBOL_BONUS_SUBSTRING = 0.3;
const PATH_BONUS_EXACT = 0.9;
const PATH_BONUS_PREFIX = 0.45;
const TEST_SCORE_DEMOTE = 0.6;
const PER_TOKEN_CONTENT_HITS = 8;

const REASON_ORDER = ['semantic', 'symbol', 'fts', 'path', 'doc', 'recent'];

// Secret material never becomes a candidate, not even as an omission ref.


const LABELS = Object.freeze({
  aperture: userTerm('aperture'),
  evidence: userTerm('evidence'),
});

function cmp(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  return left < right ? -1 : left > right ? 1 : 0;
}

function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

function toCount(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
```

_First 80 of 1046 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
