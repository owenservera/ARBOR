# File: studio/scripts/categorization-scoreboard.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/categorization-scoreboard.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 56837 B |
| Lines | 970 |
| Hash | f6905a0b8181 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCOREBOARD_SCHEMA | const | 59 | yes | export const SCOREBOARD_SCHEMA = &#39;capture-studio.categorization-scoreboard/1&#39;; |
| EVENT_CAP | const | 60 | yes | export const EVENT_CAP = 20000; |
| EXIT_OK | const | 61 | no | const EXIT_OK = 0; |
| EXIT_ERROR | const | 62 | no | const EXIT_ERROR = 1; |
| EXIT_USAGE | const | 63 | no | const EXIT_USAGE = 2; |
| SESSION_ID_RE | const | 64 | no | const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,200}$/; |
| SKIP_STATUSES | const | 66 | yes | export const SKIP_STATUSES = Object.freeze([&#39;recording&#39;]); |
| OTHER | const | 67 | no | const OTHER = &#39;other&#39;; |
| MULTI_LABEL_SUFFIXES | const | 69 | no | const MULTI_LABEL_SUFFIXES = new Set([ &#39;co.uk&#39;, &#39;org.uk&#39;, &#39;ac.uk&#39;, &#39;gov.uk&#39;, &#39;co.jp&#39;, &#39;ne.jp&#39;, &#39;or.jp&#39;, &#39;com.au&#39;, &#39;net.au&#39;, &#39;co.nz&#39;, &#39;co.in&#39;, &#39;com.cn&#39;, &#39;com.br&#39;, &#39;com.mx&#39;, &#39;co.za&#39;, &#39;com.tr&#39;, &#39;com.sg&#39;… |
| FAMILY_BUCKETS | const | 73 | yes | export const FAMILY_BUCKETS = [&#39;0&#39;, &#39;(0,0.25)&#39;, &#39;[0.25,0.5)&#39;, &#39;[0.5,0.75)&#39;, &#39;[0.75,1]&#39;]; |
| STREAM_ROLES | const | 82 | yes | export const STREAM_ROLES = CLASSIFIER_ROLES; |
| SPECIFIC_ROLES | const | 83 | yes | export const SPECIFIC_ROLES = Object.freeze(CLASSIFIER_ROLES.filter((r) =&gt; r !== &#39;unknown&#39;)); |
| ROLE_MODES | const | 84 | yes | export const ROLE_MODES = Object.freeze([&#39;replay&#39;, &#39;off&#39;]); |
| ROLE_CONFIDENCE_SCALE | const | 85 | yes | export const ROLE_CONFIDENCE_SCALE = &#39;ordinal heuristic (none\|low\|medium\|high); not a probability, not calibrated&#39;; |
| SESSION_STATUSES | const | 86 | yes | export const SESSION_STATUSES = Object.freeze([ &#39;complete&#39;, &#39;recording&#39;, &#39;failed&#39;, &#39;paused&#39;, &#39;canceled&#39;, &#39;stopped&#39;, &#39;aborted&#39;, &#39;error&#39;, &#39;unknown&#39;, ]); |
| KNOWN_DIALECTS | const | 91 | yes | export const KNOWN_DIALECTS = Object.freeze([ &#39;path-ops&#39;, &#39;typed-events&#39;, &#39;json-merge-patch&#39;, &#39;json-patch&#39;, &#39;dotted-set&#39;, &#39;ot-ops&#39;, &#39;array-splice&#39;, &#39;put-merge&#39;, ]); |
| TRANSPORT_LABELS | const | 95 | no | const TRANSPORT_LABELS = new Set([...STREAMING_TRANSPORTS, &#39;HTTP&#39;]); |
| DETAIL_LABELS | const | 96 | no | const DETAIL_LABELS = new Set([ ...TRANSPORT_LABELS, &#39;HTTP_SSE&#39;, &#39;HTTP_NDJSON&#39;, &#39;HTTP_JSON_SEQ&#39;, &#39;HTTP_CHUNKED_JSON&#39;, &#39;HTTP_LENGTH_PREFIXED&#39;, &#39;GRPC&#39;, &#39;EVENT_SOURCE&#39;, ]); |
| FAMILY_LABELS | const | 100 | no | const FAMILY_LABELS = new Set(listBuiltinFamilies()); |
| MAP_LABELS | const | 101 | no | const MAP_LABELS = new Set(DEFAULT_STREAM_MAPS.map((m) =&gt; m.id)); |
| ERROR_LABELS | const | 102 | no | const ERROR_LABELS = new Set([ &#39;SyntaxError&#39;, &#39;TypeError&#39;, &#39;RangeError&#39;, &#39;ReferenceError&#39;, &#39;Error&#39;, &#39;SESSION_JSON_MISSING&#39;, &#39;SESSION_JSON_INVALID&#39;, &#39;SESSION_DIR_MISSING&#39;, &#39;ENOENT&#39;, &#39;EACCES&#39;, &#39;EPERM&#39;,… |
| listBuiltinFamilies | function | 107 | no | function listBuiltinFamilies() { |
| framingLabel | function | 113 | yes | export const framingLabel = (v) =&gt; { |
| s | const | 114 | no | const s = String(v ?? &#39;&#39;); |
| roleLabel | function | 119 | yes | export const roleLabel = (v) =&gt; { |
| s | const | 120 | no | const s = String(v ?? &#39;&#39;).trim().toLowerCase(); |
| statusLabel | function | 123 | yes | export const statusLabel = (v) =&gt; { |
| s | const | 124 | no | const s = String(v ?? &#39;&#39;).trim().toLowerCase(); |
| familyLabel | function | 127 | yes | export const familyLabel = (v) =&gt; { |
| s | const | 128 | no | const s = String(v ?? &#39;&#39;); |
| mapLabel | function | 131 | yes | export const mapLabel = (v) =&gt; { |
| s | const | 132 | no | const s = String(v ?? &#39;&#39;); |
| errorLabel | function | 135 | no | const errorLabel = (e) =&gt; { |
| c | const | 136 | no | const c = errorClassOf(e); |
| sessionRef | function | 141 | yes | export function sessionRef(id) { |
| USAGE | const | 145 | no | const USAGE = [ |
| r2 | function | 156 | no | const r2 = (x) =&gt; Math.round(x * 100) / 100; |
| r3 | function | 157 | no | const r3 = (x) =&gt; Math.round(x * 1000) / 1000; |
| ratio | function | 158 | no | const ratio = (a, b) =&gt; (b &gt; 0 ? r3(a / b) : null); |
| bump | function | 159 | no | const bump = (obj, key, n = 1) =&gt; { obj[key] = (obj[key] ?? 0) + n; }; |
| addInto | function | 160 | no | const addInto = (total, counts) =&gt; { for (const [k, v] of Object.entries(counts ?? {})) total[k] = (total[k] ?? 0) + v; }; |
| registrableHost | function | 166 | yes | export function registrableHost(hostname) { |
| h | const | 168 | no | const h = hostname.toLowerCase().replace(/\\.$/, &#39;&#39;); |
| parts | const | 171 | no | const parts = h.split(&#39;.&#39;).filter(Boolean); |
| lastTwo | const | 174 | no | const lastTwo = parts.slice(-2).join(&#39;.&#39;); |
| hostOf | function | 178 | yes | export function hostOf(meta) { |
| URL_PLACEHOLDER | const | 183 | no | const URL_PLACEHOLDER = &#39;[unparsed-url]&#39;; |
| endpointHash | function | 185 | yes | export function endpointHash(method, url) { |
| tmpl | variable | 186 | no | let tmpl; |
| hasEvidenceValue | function | 195 | no | function hasEvidenceValue(v) { |
| roleOfStream | function | 209 | yes | export function roleOfStream(st) { |
| fieldPresent | const | 210 | no | const fieldPresent = Object.prototype.hasOwnProperty.call(st ?? {}, &#39;role&#39;); |
| raw | const | 211 | no | const raw = st?.role; |
| role | const | 212 | no | const role = typeof raw === &#39;string&#39; &amp;&amp; raw.trim() !== &#39;&#39; ? raw.trim() : null; |
| conf | const | 213 | no | const conf = String(st?.roleConfidence ?? &#39;&#39;); |
| cov | const | 215 | no | const cov = st?.roleCoverage !== null &amp;&amp; typeof st?.roleCoverage === &#39;object&#39; ? st.roleCoverage : null; |
| withheldRole | const | 216 | no | const withheldRole = cov &amp;&amp; SPECIFIC_ROLES.includes(cov.withheldRole) ? cov.withheldRole : null; |
| lower | const | 217 | no | const lower = role === null ? null : role.toLowerCase(); |
| ROLE_DISPOSITIONS | const | 245 | yes | export const ROLE_DISPOSITIONS = Object.freeze([&#39;specific&#39;, &#39;withheld&#39;, &#39;unknown&#39;, &#39;truncated&#39;, &#39;absent&#39;]); |
| roleDisposition | function | 246 | yes | export function roleDisposition(r) { |
| ORIGIN_CLASSES | const | 256 | yes | export const ORIGIN_CLASSES = Object.freeze([&#39;same-host&#39;, &#39;same-registrable&#39;, &#39;different-registrable&#39;, &#39;no-target-context&#39;, &#39;no-stream-url&#39;]); |
| originContextOf | function | 257 | yes | export function originContextOf(streamUrl, targetUrl) { |
| sh | variable | 258 | no | let sh = null; let th = null; |
| DIALECT_STATES | const | 282 | yes | export const DIALECT_STATES = Object.freeze([&#39;static&#39;, &#39;snapshot&#39;, &#39;known-delta&#39;, &#39;unknown-delta&#39;, &#39;opaque&#39;]); |
| dialectStateOf | function | 284 | yes | export function dialectStateOf(st, events = []) { |
| field | const | 285 | no | const field = st?.dialectState; |
| dialects | const | 287 | no | const dialects = Array.isArray(st?.deltaDialects) ? st.deltaDialects : []; |
| unapplied | const | 288 | no | const unapplied = Number(st?.deltaUnapplied ?? 0); |
| hasJson | const | 293 | no | const hasJson = events.some((e) =&gt; e &amp;&amp; e.json !== undefined); |
| readJsonIfPresent | function | 297 | no | function readJsonIfPresent(p) { |
| readSessionMeta | function | 301 | no | function readSessionMeta(dir) { |
| p | const | 302 | no | const p = path.join(dir, &#39;session.json&#39;); |
| meta | const | 304 | no | const meta = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| derivedKnowledgeOf | function | 310 | yes | export function derivedKnowledgeOf(dir) { |
| kv | const | 311 | no | const kv = path.join(dir, &#39;kv&#39;); |
| model | const | 312 | no | const model = existsSync(path.join(kv, &#39;MODEL.json&#39;)); |
| knowledgeStatus | const | 313 | no | const knowledgeStatus = existsSync(path.join(kv, &#39;KNOWLEDGE_STATUS.json&#39;)); |
| shapes | const | 314 | no | const shapes = existsSync(path.join(kv, &#39;SHAPES.json&#39;)); |
| familyBucket | function | 318 | yes | export function familyBucket(score) { |
| readFamilyVerdict | function | 329 | yes | export function readFamilyVerdict(dir) { |
| kv | const | 330 | no | const kv = path.join(dir, &#39;kv&#39;); |
| receipt | const | 331 | no | const receipt = readJsonIfPresent(path.join(kv, &#39;RECEIPT.json&#39;)); |
| rf | const | 332 | no | const rf = receipt?.family; |
| score | const | 334 | no | const score = typeof rf.score === &#39;number&#39; &amp;&amp; Number.isFinite(rf.score) ? r2(rf.score) : null; |
| shapes | const | 337 | no | const shapes = readJsonIfPresent(path.join(kv, &#39;SHAPES.json&#39;)); |
| first | const | 338 | no | const first = Array.isArray(shapes?.families) ? shapes.families[0] : null; |
| score | const | 340 | no | const score = typeof first.score === &#39;number&#39; &amp;&amp; Number.isFinite(first.score) ? r2(first.score) : null; |
| readLearnerState | function | 353 | yes | export function readLearnerState(dataRoot) { |
| dir | const | 354 | no | const dir = dataPaths(dataRoot).learner; |
| file | const | 355 | no | const file = path.join(dir, &#39;learner.json&#39;); |
| base | const | 356 | no | const base = { |
| snap | const | 367 | no | const snap = readJsonIfPresent(file); |
| bins | const | 371 | no | const bins = snap.calibrator?.bins &amp;&amp; typeof snap.calibrator.bins === &#39;object&#39; ? snap.calibrator.bins : {}; |
| kinds | const | 372 | no | const kinds = Object.keys(bins); |
| samples | variable | 373 | no | let samples = 0; |
| corrections | const | 377 | no | const corrections = Array.isArray(snap.corrections) ? snap.corrections : []; |
| proposals | const | 378 | no | const proposals = Array.isArray(snap.proposals) ? snap.proposals : []; |
| emptyRoleBucket | function | 400 | no | function emptyRoleBucket() { |
| emptyClassTab | function | 423 | no | const emptyClassTab = () =&gt; ({ streams: 0, bytes: 0, fullyInspectedSpecific: 0, fullyInspectedSpecificBytes: 0, rawSpecific: 0, rawSpecificBytes: 0, unknown: 0, unknownBytes: 0, inspectionCut: 0, ins… |
| measureSession | function | 431 | yes | export async function measureSession(dir, id, { eventCap = EVENT_CAP, roles = &#39;replay&#39; } = {}) { |
| meta | const | 432 | no | const meta = readSessionMeta(dir); |
| sessionStatus | const | 433 | no | const sessionStatus = typeof meta.status === &#39;string&#39; &amp;&amp; meta.status !== &#39;&#39; ? statusLabel(meta.status) : &#39;unknown&#39;; |
| derived | const | 434 | no | const derived = derivedKnowledgeOf(dir); |
| family | const | 435 | no | const family = readFamilyVerdict(dir); |
| entry | const | 436 | no | const entry = { |
| reducer | const | 462 | no | const reducer = new StreamReducer({ deltaDialect: &#39;auto&#39;, keepEvents: true, maxEventsPerStream: eventCap }); |
| summary | const | 468 | no | const summary = reducer.summary({ includeStreamRoles: roles !== &#39;off&#39; }); |
| mapIds | const | 469 | no | const mapIds = new Set(); |
| endpointRoles | const | 470 | no | const endpointRoles = []; |
| events | const | 473 | no | const events = reducer.eventsOf(st.sid); |
| bytes | const | 474 | no | const bytes = Number(st.bytes ?? 0); |
| r | const | 482 | no | const r = roleOfStream(st); |
| disposition | const | 484 | no | const disposition = roleDisposition(r); |
| label | const | 489 | no | const label = roleLabel(r.role); |
| fullySpecific | const | 493 | no | const fullySpecific = disposition === &#39;specific&#39; &amp;&amp; r.fullyInspected === true; |
| bcov | const | 506 | no | const bcov = st.roleCoverage?.binary; |
| binaryKey | const | 507 | no | const binaryKey = bcov?.kind === &#39;structural&#39; ? (bcov.complete === true ? &#39;structural-complete&#39; : &#39;structural-incomplete&#39;) : bcov?.kind === &#39;opaque&#39; ? &#39;opaque&#39; : null; |
| cut | const | 510 | no | const cut = r.hasRole &amp;&amp; r.role.toLowerCase() === &#39;unknown&#39; &amp;&amp; r.inspectionCut === true; |
| originClass | const | 513 | no | const originClass = originContextOf(st.url, meta?.target?.url); |
| ot | const | 514 | no | const ot = (entry.role.byOriginClass[originClass] ??= emptyClassTab()); |
| ds | const | 529 | no | const ds = dialectStateOf(st, events); |
| det | const | 536 | no | const det = detectStreamMap(events); |
| applied | const | 538 | no | const applied = applyStreamMap(det.map, events); |
| ids | const | 548 | no | const ids = [...mapIds].sort(); |
| errorEntry | function | 554 | no | function errorEntry(id, e) { |
| roleStability | function | 561 | yes | export function roleStability(perSessionEndpoints) { |
| byEndpoint | const | 563 | no | const byEndpoint = new Map(); // endpoint -&gt; Map(session -&gt; Set(role\|null)) |
| m | variable | 566 | no | let m = byEndpoint.get(endpoint); |
| roles | variable | 568 | no | let roles = m.get(session); |
| multi | variable | 573 | no | let multi = 0, comparable = 0, stable = 0, excludedMissingRole = 0, excludedUnstableWithin = 0; |
| all | const | 577 | no | const all = [...sessions.values()]; |
| labels | const | 581 | no | const labels = new Set(all.map((set) =&gt; [...set][0])); |
| endpointCoverage | function | 604 | yes | export function endpointCoverage(perSessionEndpoints) { |
| byEndpoint | const | 605 | no | const byEndpoint = new Map(); |
| units | variable | 606 | no | let units = 0; let unitsWithSpecific = 0; let totalBytes = 0; |
| perSession | const | 608 | no | const perSession = new Map(); |
| t | const | 610 | no | const t = byEndpoint.get(e.endpoint) ?? { obs: 0, full: 0, raw: 0, bytes: 0 }; |
| u | const | 615 | no | const u = perSession.get(e.endpoint) ?? { full: false }; |
| all | variable | 621 | no | let all = 0; let some = 0; let none = 0; let rawAny = 0; let topBytes = 0; let topObs = 0; |
| totalObs | const | 627 | no | const totalObs = [...byEndpoint.values()].reduce((a, t) =&gt; a + t.obs, 0); |
| aggregate | function | 646 | yes | export function aggregate(entries, stability, learner, { roleFieldPresent, roleMode = &#39;replay&#39;, endpointCoverage: epCov = null }) { |
| ok | const | 647 | no | const ok = entries.filter((e) =&gt; e.status === &#39;ok&#39;); |
| byStatus | const | 648 | no | const byStatus = {}; |
| framing | const | 650 | no | const framing = { streams: { transport: {}, transportDetail: {} }, bytes: { transport: {}, transportDetail: {} } }; |
| role | const | 651 | no | const role = { |
| dialect | const | 668 | no | const dialect = { sourceFieldSessions: 0, sourceFallbackSessions: 0, counts: {}, bytes: {} }; |
| maps | const | 669 | no | const maps = { sessionsWithMap: 0, sessionsWithoutMap: 0, byMapId: {}, mappedStreams: 0, unmappedEvents: 0, errorSignals: 0 }; |
| family | const | 670 | no | const family = { sessionsWithVerdict: 0, verdicts: {}, buckets: {} }; |
| d | const | 687 | no | const d = e.role.dispositions ?? {}; const db = e.role.dispositionBytes ?? {}; |
| into | const | 698 | no | const into = (role.byOriginClass[ORIGIN_CLASSES.includes(cls) ? cls : &#39;other&#39;] ??= emptyClassTab()); |
| listSessionIds | function | 755 | no | function listSessionIds(sessionsDir) { |
| runScoreboard | function | 764 | yes | export async function runScoreboard({ dataDir = defaultDataDir(), sessions = null, limit = null, out = null, eventCap = EVENT_CAP, roles = &#39;replay&#39;, _testHookAfterRead = null, } = {}) { |
| root | const | 769 | no | const root = path.resolve(dataDir); |
| sessionsDir | const | 773 | no | const sessionsDir = dataPaths(root).sessions; |
| ids | variable | 774 | no | let ids; |
| targets | const | 782 | no | const targets = ids.map((id) =&gt; ({ id, dir: path.join(sessionsDir, id) })); |
| before | const | 783 | no | const before = snapshotSessionDirs(targets); |
| entries | const | 784 | no | const entries = []; |
| perSessionEndpoints | const | 785 | no | const perSessionEndpoints = []; |
| roleFieldPresent | variable | 786 | no | let roleFieldPresent = false; |
| after | const | 799 | no | const after = snapshotSessionDirs(targets); |
| changes | const | 800 | no | const changes = diffSnapshots(before, after); |
| stability | const | 801 | no | const stability = roleStability(perSessionEndpoints); |
| learner | const | 802 | no | const learner = readLearnerState(root); |
| changeCounts | const | 803 | no | const changeCounts = { added: 0, removed: 0, modified: 0 }; |
| report | const | 805 | no | const report = { |
| flattenNumbers | function | 836 | yes | export function flattenNumbers(obj, prefix = &#39;&#39;, out = {}) { |
| p | const | 838 | no | const p = prefix ? `${prefix}.${k}` : k; |
| compareReports | function | 845 | yes | export function compareReports(before, after) { |
| b | const | 846 | no | const b = flattenNumbers(before?.aggregate ?? {}); |
| a | const | 847 | no | const a = flattenNumbers(after?.aggregate ?? {}); |
| paths | const | 848 | no | const paths = [...new Set([...Object.keys(b), ...Object.keys(a)])].sort(); |
| deltas | const | 849 | no | const deltas = []; |
| to | const | 852 | no | const to = a[p] ?? null; |
| delta | const | 853 | no | const delta = from !== null &amp;&amp; to !== null ? r3(to - from) : null; |
| renderComparison | function | 860 | yes | export function renderComparison(cmp) { |
| lines | const | 861 | no | const lines = [`comparison: ${cmp.changed} of ${cmp.comparedPaths} numeric measures changed`]; |
| sign | const | 863 | no | const sign = d.delta === null ? &#39;&#39; : d.delta &gt; 0 ? &#39;+&#39; : &#39;&#39;; |
| kv | function | 872 | no | const kv = (obj) =&gt; Object.entries(obj ?? {}).sort((x, y) =&gt; y[1] - x[1]).map(([k, v]) =&gt; `${k}=${v}`).join(&#39;, &#39;) \|\| &#39;-&#39;; |
| renderSummary | function | 874 | yes | export function renderSummary(report) { |
| a | const | 875 | no | const a = report.aggregate; |
| m | const | 876 | no | const m = a.measures; |
| lines | const | 877 | no | const lines = [ |
| parseArgs | function | 899 | yes | export function parseArgs(argv) { |
| o | const | 900 | no | const o = { dataDir: null, sessions: null, limit: null, out: null, compare: null, roles: &#39;replay&#39;, help: false }; |
| need | function | 901 | no | const need = (flag, v) =&gt; { |
| a | variable | 906 | no | let a = argv[i]; |
| inline | variable | 907 | no | let inline; |
| val | function | 909 | no | const val = () =&gt; (inline !== undefined ? inline : argv[++i]); |
| n | const | 914 | no | const n = Number(need(a, val())); |
| main | function | 930 | yes | export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) { |
| args | variable | 931 | no | let args; |
| result | variable | 935 | no | let result; |
| comparison | variable | 946 | no | let comparison = null; |
| prior | const | 948 | no | const prior = readJsonIfPresent(args.compare); |
| json | const | 955 | no | const json = `${JSON.stringify(comparison ? { ...result.report, comparison } : result.report, null, 2)}\\n`; |
| isMain | const | 967 | no | const isMain = process.argv[1] &amp;&amp; pathToFileURL(path.resolve(process.argv[1])).href === pathToFileURL(fileURLToPath(import.meta.url)).href; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 45 | external |
| node:path | import | 46 | external |
| node:crypto | import | 47 | external |
| node:url | import | 48 | external |
| ../src/config.mjs | import | 49 | [studio/src/config.mjs](../src/config.mjs.md) |
| ../src/store/raw-index.mjs | import | 50 | [studio/src/store/raw-index.mjs](../src/store/raw-index.mjs.md) |
| ../src/replay/reducer.mjs | import | 51 | [studio/src/replay/reducer.mjs](../src/replay/reducer.mjs.md) |
| ../src/replay/stream-role.mjs | import | 52 | [studio/src/replay/stream-role.mjs](../src/replay/stream-role.mjs.md) |
| ../src/profiles/stream-map.mjs | import | 53 | [studio/src/profiles/stream-map.mjs](../src/profiles/stream-map.mjs.md) |
| ../src/shapes/infer.mjs | import | 54 | [studio/src/shapes/infer.mjs](../src/shapes/infer.mjs.md) |
| ./fidelity-survey.mjs | import | 55 | [studio/scripts/fidelity-survey.mjs](./fidelity-survey.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Categorization scoreboard (READ-ONLY).
//
// Replays every saved session's raw log IN MEMORY through the product's own modules and reports how
// well Studio categorizes streams on its own: framing, stream role coverage and stability, delta
// dialect state, stream-map coverage, family verdict, learner state, and session accounting.
//
// It reports NUMBERS, not grades: no thresholds, no pass/fail. Run it before and after a change and
// diff the two outputs with --compare.
//
// Usage:
//   node scripts/categorization-scoreboard.mjs [--data-dir DIR] [--sessions id,id] [--limit N]
//                                              [--out FILE] [--compare BEFORE.json]
//
// Guarantees:
//   * Never writes into the data directory. Sessions are NOT opened through store/session.mjs
//     (its constructor creates kv/). Raw segments are read with store/raw-index.mjs iterateRaw;
//     session.json, kv/RECEIPT.json, kv/KNOWLEDGE_STATUS.json, kv/MODEL.json and the learner store
//     are read with readFileSync. Nothing is derived, no browser, no network.
//   * Write evidence is METADATA ONLY. Each touched session folder is snapshotted before and after
//     (relative path, kind, size, mtime) and the differences are counted, never hashed. So
//     safety.writeCheck.method = "stat" means "file metadata unchanged", NOT "content hash
//     verified". Unlike fidelity-survey a change does not abort the run: a live recorder or derive
//     may write the same folders while the scoreboard reads them, and an aborted run would be
//     useless as a baseline. Nothing here ever writes under the data directory.
//   * Refuses a data directory that is the repository checkout (or inside one), and refuses an
//     --out file inside the data directory.
//   * The report is shareable: counts, ratios and bounded enum labels only. No message text, no URL
//     paths, no query strings, no titles, no session folder names, no file names. Every label is
//     resolved against a fixed vocabulary below and anything outside it is reported as "other", so
//     a free-text field or a wire-supplied protocol name can never reach the report. A session is
//     identified by a 10-char sha1 prefix of its folder name ("ref"), an endpoint by a 10-char sha1
//     prefix of its url template. Hosts appear as the registrable host only.
//   * Sessions still 'recording' are counted in the session accounting but skipped by every stream
//     measure (their raw log is still growing).
//   * Each session is isolated in try/catch. A bad session becomes status "error" with a bounded
//     class label.
//
// Learner store (verified against src/config.mjs and src/intel/learn.mjs + learner-journal.mjs):
//   the persisted learner is <data-dir>/learner/learner.json -- dataPaths().learner plus
//   LearnerJournal(<dir>).learner.json, holding { version, revision, parentRevision, savedAt,
//   models, globalLearned, overrides, corrections, proposals, audit, nextCorrectionId, calibrator,
//   integrity }. The many *priors* the CLI prints come from the built-in prior table held in
//   memory (ScopedLearner.global), NOT from that file, so "store absent" never means "no priors".
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defaultDataDir, dataPaths, TOOL_ROOT } from '../src/config.mjs';
import { iterateRaw } from '../src/store/raw-index.mjs';
import { StreamReducer, STREAMING_TRANSPORTS } from '../src/replay/reducer.mjs';
import { STREAM_ROLES as CLASSIFIER_ROLES, CONFIDENCE_LEVELS } from '../src/replay/stream-role.mjs';
import { detectStreamMap, applyStreamMap, DEFAULT_STREAM_MAPS } from '../src/profiles/stream-map.mjs';
import { templateUrl } from '../src/shapes/infer.mjs';
import {
  snapshotSessionDirs, diffSnapshots, assertNotRepoCheckout, isInside, errorClassOf, UsageError, GuardError,
} from './fidelity-survey.mjs';

export const SCOREBOARD_SCHEMA = 'capture-studio.categorization-scoreboard/1';
export const EVENT_CAP = 20000;
const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;
const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,200}$/;
// A session that is still being written has no stable raw log: counted, never measured.
export const SKIP_STATUSES = Object.freeze(['recording']);
const OTHER = 'other';
// Public suffixes with two labels, so the registrable host keeps three.
const MULTI_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'co.jp', 'ne.jp', 'or.jp', 'com.au', 'net.au', 'co.nz',
  'co.in', 'com.cn', 'com.br', 'com.mx', 'co.za', 'com.tr', 'com.sg', 'co.kr', 'com.hk', 'com.tw',
]);
export const FAMILY_BUCKETS = ['0', '(0,0.25)', '[0.25,0.5)', '[0.5,0.75)', '[0.75,1]'];

// ---------------------------------------------------------------------------------------------
// Bounded label vocabularies. Every emitted label comes from one of these; a raw field value is
// never echoed, so a role/family/status that holds private text becomes "other", not that text.
// ---------------------------------------------------------------------------------------------
// Stream roles are the classifier's own vocabulary (src/replay/stream-role.mjs). This is the only role
// vocabulary the report will name; anything else shows up in the distribution as "other".
```

_First 80 of 971 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
