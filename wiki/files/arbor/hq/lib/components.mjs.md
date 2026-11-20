# File: hq/lib/components.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/components.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 88381 B |
| Lines | 2158 |
| Hash | bd803ba9d86a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMPONENT_SCHEMA | const | 12 | no | const COMPONENT_SCHEMA = &#39;hq.component/1&#39;; |
| PIPELINE_SCHEMA | const | 13 | no | const PIPELINE_SCHEMA = &#39;hq.pipeline/1&#39;; |
| GRAPH_SCHEMA | const | 14 | no | const GRAPH_SCHEMA = &#39;hq.pipeline-graph/1&#39;; |
| PLAN_SCHEMA | const | 15 | no | const PLAN_SCHEMA = &#39;hq.pipeline-plan/1&#39;; |
| ACTIVATION_SCHEMA | const | 16 | no | const ACTIVATION_SCHEMA = &#39;hq.activation/1&#39;; |
| COMPONENT_KINDS | const | 18 | no | const COMPONENT_KINDS = [&#39;tool&#39;, &#39;trigger&#39;, &#39;policy&#39;, &#39;context&#39;, &#39;evaluator&#39;, &#39;transform&#39;, &#39;approval&#39;, &#39;sink&#39;]; |
| COMPONENT_STATUSES | const | 19 | no | const COMPONENT_STATUSES = [&#39;active&#39;, &#39;draft&#39;, &#39;deprecated&#39;, &#39;retired&#39;]; |
| PIPELINE_STATUSES | const | 20 | no | const PIPELINE_STATUSES = [&#39;active&#39;, &#39;draft&#39;, &#39;deprecated&#39;, &#39;retired&#39;]; |
| IDEMPOTENCY | const | 21 | no | const IDEMPOTENCY = [&#39;keyed&#39;, &#39;natural&#39;, &#39;none&#39;]; |
| COST_CLASSES | const | 22 | no | const COST_CLASSES = [&#39;local&#39;, &#39;model&#39;, &#39;network&#39;]; |
| SCOPE_SPECIFICITY | const | 24 | no | const SCOPE_SPECIFICITY = [&#39;session&#39;, &#39;project&#39;, &#39;workspace&#39;]; |
| DEFAULT_LIMIT | const | 26 | no | const DEFAULT_LIMIT = 50; |
| MAX_LIMIT | const | 27 | no | const MAX_LIMIT = 1000; |
| MAX_PLAN_CACHE | const | 28 | no | const MAX_PLAN_CACHE = 128; |
| DEFAULT_MAX_FANOUT | const | 29 | no | const DEFAULT_MAX_FANOUT = 100; |
| ID_RE | const | 31 | no | const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/; |
| SEMVER_RE | const | 32 | no | const SEMVER_RE = /^(\\d+)\\.(\\d+)\\.(\\d+)(?:-([0-9A-Za-z.-]+))?(?:\\+([0-9A-Za-z.-]+))?$/; |
| READ_EFFECT_RE | const | 33 | no | const READ_EFFECT_RE = /(^\|:)(read\|list\|stat\|watch\|search\|resolve\|validate\|evaluate\|describe)$/; |
| FORBIDDEN_EFFECT_RE | const | 34 | no | const FORBIDDEN_EFFECT_RE = /^(browser\|send\|network\|http\|https\|provider\|cloud\|email\|sms\|webhook\|socket)(:\|$)/; |
| PLAN_CACHE | const | 36 | no | const PLAN_CACHE = new Map(); |
| READY_DBS | const | 37 | no | const READY_DBS = new WeakSet(); |
| STMT_CACHE | const | 38 | no | const STMT_CACHE = new WeakMap(); |
| FRAGMENT | const | 39 | no | const FRAGMENT = Symbol(&#39;hq.compose.fragment&#39;); |
| fail | function | 45 | no | function fail(code, message, detail) { |
| error | const | 46 | no | const error = new Error(message \|\| code); |
| isPlainObject | function | 52 | no | function isPlainObject(value) { |
| clone | function | 56 | no | function clone(value) { |
| jsonValue | function | 61 | no | function jsonValue(value, fallback) { |
| jsonText | function | 67 | no | function jsonText(value) { |
| mergeConfig | function | 71 | no | function mergeConfig(base, override) { |
| out | const | 74 | no | const out = clone(base); |
| sameJson | function | 82 | no | function sameJson(a, b) { |
| integer | function | 86 | no | function integer(value, fallback = null) { |
| n | const | 88 | no | const n = Number(value); |
| asStringArray | function | 93 | no | function asStringArray(value) { |
| requireId | function | 101 | no | function requireId(value, prefix) { |
| id | const | 102 | no | const id = String(value ?? &#39;&#39;).trim(); |
| parseVersion | function | 112 | no | function parseVersion(value) { |
| text | const | 113 | no | const text = String(value ?? &#39;&#39;).trim(); |
| comparePrerelease | function | 125 | no | function comparePrerelease(a, b) { |
| length | const | 129 | no | const length = Math.max(a.length, b.length); |
| left | const | 131 | no | const left = a[i]; |
| right | const | 132 | no | const right = b[i]; |
| leftNumeric | const | 135 | no | const leftNumeric = /^\\d+$/.test(left); |
| rightNumeric | const | 136 | no | const rightNumeric = /^\\d+$/.test(right); |
| diff | const | 138 | no | const diff = Number(left) - Number(right); |
| compareParsed | function | 148 | no | function compareParsed(a, b) { |
| fullVersion | function | 155 | no | function fullVersion(major, minor, patch, prerelease = []) { |
| base | const | 156 | no | const base = `${major}.${minor}.${patch}`; |
| pad5 | function | 163 | no | function pad5(value) { |
| versionKey | function | 167 | no | function versionKey(parsed) { |
| requireVersion | function | 171 | no | function requireVersion(value, prefix) { |
| parsed | const | 172 | no | const parsed = parseVersion(value); |
| parsePartial | function | 177 | no | function parsePartial(text) { |
| token | const | 178 | no | const token = String(text ?? &#39;&#39;).trim().replace(/^v/i, &#39;&#39;); |
| parts | const | 182 | no | const parts = main.split(&#39;.&#39;); |
| numbers | const | 184 | no | const numbers = []; |
| part | const | 186 | no | const part = parts[i]; |
| makeComparator | function | 203 | no | function makeComparator(op, partial) { |
| pre | const | 204 | no | const pre = partial.prerelease ?? []; |
| lowerOf | function | 205 | no | const lowerOf = () =&gt; fullVersion(partial.major ?? 0, partial.minor ?? 0, partial.patch ?? 0, pre); |
| lower | const | 207 | no | const lower = lowerOf(); |
| upper | variable | 208 | no | let upper; |
| lower | const | 217 | no | const lower = lowerOf(); |
| upper | const | 218 | no | const upper = partial.minor === null |
| comparatorFor | function | 245 | no | function comparatorFor(token) { |
| text | const | 246 | no | const text = String(token ?? &#39;&#39;).trim(); |
| op | const | 253 | no | const op = match[1] ?? &#39;=&#39;; |
| partial | const | 254 | no | const partial = parsePartial(match[2]); |
| comparator | const | 256 | no | const comparator = makeComparator(op, partial); |
| parseRange | function | 264 | no | function parseRange(range) { |
| text | const | 265 | no | const text = String(range ?? &#39;*&#39;).trim(); |
| alternatives | const | 267 | no | const alternatives = text.split(&#39;\|\|&#39;).map((part) =&gt; part.trim()).filter(Boolean); |
| sets | const | 269 | no | const sets = []; |
| tokens | const | 271 | no | const tokens = alternative.replace(/,/g, &#39; &#39;).split(/\\s+/).filter(Boolean); |
| comparators | const | 272 | no | const comparators = []; |
| comparator | const | 274 | no | const comparator = comparatorFor(token); |
| wildcard | const | 280 | no | const wildcard = sets.length === 1 &amp;&amp; sets[0].every((comparator) =&gt; comparator.any === true); |
| comparatorCovers | function | 284 | no | function comparatorCovers(version, comparator) { |
| tuple | const | 287 | no | const tuple = `${version.major}.${version.minor}.${version.patch}`; |
| diff | const | 291 | no | const diff = compareParsed(version, comparator.lower); |
| diff | const | 296 | no | const diff = compareParsed(version, comparator.upper); |
| satisfies | function | 306 | no | function satisfies(version, rangeOrParsed) { |
| parsedVersion | const | 307 | no | const parsedVersion = typeof version === &#39;string&#39; ? parseVersion(version) : version; |
| parsedRange | const | 309 | no | const parsedRange = typeof rangeOrParsed === &#39;string&#39; \|\| rangeOrParsed == null |
| compareVersionStrings | function | 316 | no | function compareVersionStrings(a, b) { |
| left | const | 317 | no | const left = parseVersion(a); |
| right | const | 318 | no | const right = parseVersion(b); |
| tryParseRef | function | 327 | no | function tryParseRef(ref) { |
| id | variable | 328 | no | let id = &#39;&#39;; |
| text | const | 331 | no | const text = ref.trim(); |
| at | const | 332 | no | const at = text.indexOf(&#39;@&#39;); |
| parsedRange | const | 346 | no | const parsedRange = parseRange(range); |
| requireRef | function | 351 | no | function requireRef(ref) { |
| parsed | const | 352 | no | const parsed = tryParseRef(ref); |
| DDL | const | 361 | no | const DDL = ` |
| ensureSchema | function | 521 | yes | export function ensureSchema(db) { |
| ready | function | 528 | no | function ready(db) { |
| stmt | function | 536 | no | function stmt(db, sql) { |
| cache | variable | 537 | no | let cache = STMT_CACHE.get(db); |
| statement | variable | 542 | no | let statement = cache.get(sql); |
| normalizeComponent | function | 554 | no | function normalizeComponent(input) { |
| id | const | 556 | no | const id = requireId(input.id, &#39;COMPONENT&#39;); |
| version | const | 557 | no | const version = requireVersion(input.version, &#39;COMPONENT&#39;); |
| parsed | const | 558 | no | const parsed = parseVersion(version); |
| kind | const | 559 | no | const kind = String(input.kind ?? &#39;tool&#39;).trim().toLowerCase(); |
| status | const | 561 | no | const status = String(input.status ?? &#39;active&#39;).trim().toLowerCase(); |
| idempotency | const | 563 | no | const idempotency = String(input.idempotency ?? &#39;natural&#39;).trim().toLowerCase(); |
| costClass | const | 565 | no | const costClass = String(input.costClass ?? input.cost_class ?? &#39;local&#39;).trim().toLowerCase(); |
| effects | const | 568 | no | const effects = asStringArray(input.effects).map((effect) =&gt; effect.toLowerCase()); |
| authority | const | 574 | no | const authority = asStringArray(input.authority).map((scopeName) =&gt; scopeName.toLowerCase()); |
| tags | const | 575 | no | const tags = asStringArray(input.tags); |
| approval | const | 576 | no | const approval = input.approval === true \|\| input.gate === &#39;approval&#39; \|\| input.requiresApproval === true; |
| compensation | const | 577 | no | const compensation = input.compensation === true \|\| input.compensates === true; |
| writeEffects | const | 578 | no | const writeEffects = effects.some((effect) =&gt; !READ_EFFECT_RE.test(effect)); |
| component | const | 590 | no | const component = { |
| contentShape | const | 615 | no | const contentShape = { ...component }; |
| componentFromRow | function | 625 | no | function componentFromRow(row) { |
| INSERT_COMPONENT | const | 657 | no | const INSERT_COMPONENT = ` |
| registerComponent | function | 665 | yes | export function registerComponent(db, component, options = {}) { |
| normalized | const | 667 | no | const normalized = normalizeComponent(component); |
| allowDuplicateDigest | const | 668 | no | const allowDuplicateDigest = options.allowDuplicateDigest === true \|\| component?.allowDuplicateDigest === true; |
| existing | const | 670 | no | const existing = stmt(db, &#39;SELECT digest, content_digest FROM components WHERE id = ? AND version = ?&#39;) |
| duplicate | const | 677 | no | const duplicate = stmt(db, &#39;SELECT version FROM components WHERE id = ? AND content_digest = ? LIMIT 1&#39;) |
| parts | const | 685 | no | const parts = normalized.versionParts; |
| tagInsert | const | 703 | no | const tagInsert = stmt(db, &#39;INSERT OR IGNORE INTO component_tags(component_id, component_version, tag) VALUES (?,?,?)&#39;); |
| allVersions | function | 715 | no | function allVersions(db, { id, source = &#39;any&#39; }) { |
| versions | const | 716 | no | const versions = []; |
| pickHighest | function | 726 | no | function pickHighest(candidates, parsedRange) { |
| best | variable | 727 | no | let best = null; |
| bestParsed | variable | 728 | no | let bestParsed = null; |
| parsed | const | 730 | no | const parsed = parseVersion(candidate); |
| stable | const | 738 | no | const stable = candidates.filter((candidate) =&gt; { const parsed = parseVersion(candidate); return parsed &amp;&amp; parsed.prerelease.length === 0; }); |
| parsed | const | 739 | no | const parsed = parseVersion(candidate); |
| resolveVersion | function | 747 | yes | export function resolveVersion(db, { id, range = &#39;*&#39;, source = &#39;any&#39; } = {}) { |
| componentId | const | 749 | no | const componentId = requireId(id, &#39;COMPONENT&#39;); |
| parsedRange | const | 750 | no | const parsedRange = parseRange(range); |
| candidates | const | 752 | no | const candidates = allVersions(db, { id: componentId, source }); |
| matching | const | 753 | no | const matching = candidates.filter((candidate) =&gt; satisfies(candidate, parsedRange)); |
| highest | const | 756 | no | const highest = pickHighest(candidates, null); |
| getComponent | function | 762 | yes | export function getComponent(db, { id, version = null } = {}) { |
| componentId | const | 764 | no | const componentId = requireId(id, &#39;COMPONENT&#39;); |
| resolved | variable | 765 | no | let resolved = version; |
| row | const | 770 | no | const row = stmt(db, &#39;SELECT * FROM components WHERE id = ? AND version = ?&#39;).get(componentId, resolved); |
| parseCursor | function | 774 | no | function parseCursor(cursor) { |
| text | const | 777 | no | const text = String(cursor); |
| at | const | 778 | no | const at = text.indexOf(&#39;@&#39;); |
| applyCursor | function | 783 | no | function applyCursor(where, params, cursor, table = &#39;c&#39;) { |
| parsed | const | 784 | no | const parsed = parseCursor(cursor); |
| parsedVersion | const | 791 | no | const parsedVersion = parseVersion(parsed.version); |
| ftsQueryParts | function | 797 | no | function ftsQueryParts(query) { |
| text | const | 798 | no | const text = String(query ?? &#39;&#39;).trim(); |
| tokens | const | 800 | no | const tokens = tokenize(text); |
| escaped | const | 801 | no | const escaped = tokens |
| structured | const | 805 | no | const structured = /\\b(OR\|AND\|NOT\|NEAR)\\b\|[&quot;()*]/.test(text); |
| runFtsSelect | function | 809 | no | function runFtsSelect(db, { table, ftsTable, select, where, params, order, limit, query }) { |
| base | const | 810 | no | const base = `SELECT ${select} FROM ${table} c`; |
| tail | const | 811 | no | const tail = `ORDER BY ${order} LIMIT ?`; |
| filters | const | 812 | no | const filters = where.length ? `WHERE ${where.join(&#39; AND &#39;)}` : &#39;&#39;; |
| run | function | 813 | no | const run = (match) =&gt; { |
| allWhere | const | 814 | no | const allWhere = [...where, `c.rowid IN (SELECT rowid FROM ${ftsTable} WHERE ${ftsTable} MATCH ?)`]; |
| fts | const | 817 | no | const fts = ftsQueryParts(query); |
| attempts | const | 822 | no | const attempts = fts.structured |
| lastError | variable | 825 | no | let lastError = null; |
| decorateList | function | 839 | no | function decorateList(rows, limit) { |
| listComponents | function | 844 | yes | export function listComponents(db, options = {}) { |
| limit | const | 846 | no | const limit = clamp(Number(options.limit ?? DEFAULT_LIMIT) \|\| DEFAULT_LIMIT, 1, MAX_LIMIT); |
| params | const | 848 | no | const params = []; |
| rows | const | 857 | no | const rows = runFtsSelect(db, { table: &#39;components&#39;, ftsTable: &#39;components_fts&#39;, select: &#39;*&#39;, where, |
| hasMore | const | 867 | no | const hasMore = rows.length &gt; limit; |
| page | const | 868 | no | const page = hasMore ? rows.slice(0, limit) : rows; |
| out | const | 869 | no | const out = decorateList(page, limit); |
| fragment | function | 881 | no | function fragment(nodes = [], edges = [], entry = [], exit = [], meta = {}) { |
| isFragment | function | 885 | no | function isFragment(value) { |
| collectGroups | function | 891 | no | function collectGroups(fragments, resolve = (ref) =&gt; ref) { |
| fallbacks | const | 892 | no | const fallbacks = []; |
| branches | const | 893 | no | const branches = []; |
| groupMeta | function | 912 | no | function groupMeta(fragments, resolve, extra = {}) { |
| meta | const | 914 | no | const meta = { ...extra }; |
| leaf | function | 920 | no | function leaf(spec) { |
| nodeSpec | const | 922 | no | const nodeSpec = isPlainObject(spec.node) ? spec.node : spec; |
| asFragment | function | 927 | no | function asFragment(part) { |
| nodes | const | 931 | no | const nodes = part.nodes.slice(); |
| declared | const | 932 | no | const declared = []; |
| edges | const | 933 | no | const edges = []; |
| pair | const | 935 | no | const pair = Array.isArray(edge) ? edge : [edge.from, edge.to]; |
| deps | const | 942 | no | const deps = new Map(); |
| enriched | const | 948 | no | const enriched = declared.map((node) =&gt; { const extra = node.dependsOn ?? []; const merged = [...extra]; for (const [to, froms] of deps.entries()) { if (to === node.id) merged.push(...froms); |
| extra | const | 949 | no | const extra = node.dependsOn ?? []; |
| merged | const | 950 | no | const merged = [...extra]; |
| entry | const | 956 | no | const entry = enriched.filter((node) =&gt; !(node.dependsOn ?? []).length); |
| dependents | const | 957 | no | const dependents = new Set(enriched.flatMap((node) =&gt; node.dependsOn ?? [])); |
| exit | const | 958 | no | const exit = enriched.filter((node) =&gt; !dependents.has(node.id)); |
| remapFragment | function | 966 | no | function remapFragment(source, mutate) { |
| mapping | const | 967 | no | const mapping = new Map(); |
| nodes | const | 968 | no | const nodes = source.nodes.map((node) =&gt; { const copy = { ...node, config: isPlainObject(node.config) ? clone(node.config) : (node.config ?? {}) }; if (Array.isArray(node.dependsOn)) copy.dependsOn =… |
| copy | const | 969 | no | const copy = { ...node, config: isPlainObject(node.config) ? clone(node.config) : (node.config ?? {}) }; |
| resolve | function | 974 | no | const resolve = (ref) =&gt; (isPlainObject(ref) ? mapping.get(ref) ?? ref : ref); |
| edges | const | 975 | no | const edges = source.edges.map(([from, to]) =&gt; [resolve(from), resolve(to)]); |
| entry | const | 976 | no | const entry = source.entry.map(resolve); |
| exit | const | 977 | no | const exit = source.exit.map(resolve); |
| meta | const | 978 | no | const meta = groupMeta([source], resolve, { ...source.meta }); |
| frag | const | 981 | no | const frag = fragment(nodes, edges, entry, exit, meta); |
| sequence | function | 986 | no | function sequence(...parts) { |
| list | const | 987 | no | const list = parts.length === 1 &amp;&amp; Array.isArray(parts[0]) ? parts[0] : parts; |
| fragments | const | 988 | no | const fragments = list.map(asFragment); |
| nodes | const | 991 | no | const nodes = fragments.flatMap((frag) =&gt; frag.nodes); |
| edges | const | 992 | no | const edges = fragments.flatMap((frag) =&gt; frag.edges); |
| parallel | function | 1001 | no | function parallel(...parts) { |
| list | const | 1002 | no | const list = parts.length === 1 &amp;&amp; Array.isArray(parts[0]) ? parts[0] : parts; |
| fragments | const | 1003 | no | const fragments = list.map(asFragment); |
| nodes | const | 1005 | no | const nodes = fragments.flatMap((frag) =&gt; frag.nodes); |
| edges | const | 1006 | no | const edges = fragments.flatMap((frag) =&gt; frag.edges); |
| entry | const | 1007 | no | const entry = fragments.flatMap((frag) =&gt; frag.entry); |
| exit | const | 1008 | no | const exit = fragments.flatMap((frag) =&gt; frag.exit); |
| branch | function | 1012 | no | function branch(condition, whenTrue, whenFalse) { |
| cond | const | 1013 | no | const cond = asFragment(condition); |
| yes | const | 1014 | no | const yes = asFragment(whenTrue); |
| no | const | 1015 | no | const no = asFragment(whenFalse); |
| nodes | const | 1016 | no | const nodes = [...cond.nodes, ...yes.nodes, ...no.nodes]; |
| edges | const | 1017 | no | const edges = [...cond.edges, ...yes.edges, ...no.edges]; |
| yesNodes | const | 1022 | no | const yesNodes = new Set(yes.nodes); |
| noNodes | const | 1023 | no | const noNodes = new Set(no.nodes); |
| marked | const | 1024 | no | const marked = nodes.map((node) =&gt; { if (yesNodes.has(node)) return { ...node, branch: &#39;yes&#39; }; if (noNodes.has(node)) return { ...node, branch: &#39;no&#39; }; return node; }); |
| remap | const | 1029 | no | const remap = new Map(nodes.map((node, index) =&gt; [node, marked[index]])); |
| remappedEdges | const | 1030 | no | const remappedEdges = edges.map(([from, to]) =&gt; [remap.get(from) ?? from, remap.get(to) ?? to]); |
| resolve | function | 1031 | no | const resolve = (node) =&gt; remap.get(node) ?? node; |
| childMeta | const | 1032 | no | const childMeta = groupMeta([cond, yes, no], resolve); |
| branches | const | 1033 | no | const branches = [ |
| meta | const | 1041 | no | const meta = { ...childMeta, branches }; |
| frag | const | 1043 | no | const frag = fragment( marked, remappedEdges, cond.entry.map(resolve), [...yes.exit, ...no.exit].map(resolve), |
| map | function | 1053 | no | function map(collection, part, options = {}) { |
| inner | const | 1054 | no | const inner = asFragment(part); |
| maxFanOut | const | 1055 | no | const maxFanOut = Number(options.maxFanOut ?? DEFAULT_MAX_FANOUT); |
| fanOut | variable | 1056 | no | let fanOut = null; |
| dynamic | variable | 1057 | no | let dynamic = false; |
| frag | const | 1072 | no | const frag = remapFragment(inner, (f) =&gt; { for (const node of f.nodes) { node.kind = node.kind ?? &#39;map&#39;; node.fanOut = fanOut; if (dynamic) node.dynamicFanOut = true; |
| reduce | function | 1083 | no | function reduce(collection, part, options = {}) { |
| inner | const | 1084 | no | const inner = asFragment(part); |
| fanOut | variable | 1085 | no | let fanOut = null; |
| mode | const | 1089 | no | const mode = options.mode === &#39;tree&#39; ? &#39;tree&#39; : &#39;sequential&#39;; |
| frag | const | 1090 | no | const frag = remapFragment(inner, (f) =&gt; { for (const node of f.nodes) { node.kind = &#39;reduce&#39;; node.fanOut = fanOut; node.reduceMode = mode; |
| retry | function | 1101 | no | function retry(part, policy = {}) { |
| inner | const | 1102 | no | const inner = asFragment(part); |
| normalized | const | 1103 | no | const normalized = typeof policy === &#39;number&#39; ? { retries: policy } : (policy ?? {}); |
| retries | const | 1104 | no | const retries = integer(normalized.retries ?? normalized.maxAttempts, 2); |
| retryPolicy | const | 1106 | no | const retryPolicy = { |
| frag | const | 1113 | no | const frag = remapFragment(inner, (f) =&gt; { for (const node of f.nodes) { node.retries = retries; node.retry = retryPolicy; } |
| fallback | function | 1123 | no | function fallback(primary, backup) { |
| first | const | 1124 | no | const first = asFragment(primary); |
| second | const | 1125 | no | const second = asFragment(backup); |
| nodes | const | 1126 | no | const nodes = [...first.nodes, ...second.nodes]; |
| edges | const | 1127 | no | const edges = [...first.edges, ...second.edges]; |
| marked | const | 1128 | no | const marked = nodes.map((node) =&gt; (second.nodes.includes(node) ? { ...node, fallbackOf: true } : node)); |
| remap | const | 1129 | no | const remap = new Map(nodes.map((node, index) =&gt; [node, marked[index]])); |
| remappedEdges | const | 1130 | no | const remappedEdges = edges.map(([from, to]) =&gt; [remap.get(from) ?? from, remap.get(to) ?? to]); |
| resolve | function | 1131 | no | const resolve = (node) =&gt; remap.get(node) ?? node; |
| childMeta | const | 1132 | no | const childMeta = groupMeta([first, second], resolve); |
| meta | const | 1133 | no | const meta = { |
| frag | const | 1141 | no | const frag = fragment( marked, remappedEdges, first.entry.map(resolve), second.exit.map(resolve), |
| approval | function | 1151 | no | function approval(part, scope = &#39;owner&#39;) { |
| inner | const | 1152 | no | const inner = asFragment(part); |
| gate | const | 1153 | no | const gate = isPlainObject(scope) ? { ...scope } : { scope: String(scope ?? &#39;owner&#39;) }; |
| frag | const | 1155 | no | const frag = remapFragment(inner, (f) =&gt; { for (const node of f.nodes) node.approval = { required: true, ...gate }; }); |
| timeout | function | 1162 | no | function timeout(part, ms) { |
| inner | const | 1163 | no | const inner = asFragment(part); |
| value | const | 1164 | no | const value = integer(ms, null); |
| frag | const | 1166 | no | const frag = remapFragment(inner, (f) =&gt; { for (const node of f.nodes) { node.timeoutMs = node.timeoutMs == null ? value : Math.min(node.timeoutMs, value); } }); |
| optional | function | 1175 | no | function optional(part) { |
| inner | const | 1176 | no | const inner = asFragment(part); |
| frag | const | 1177 | no | const frag = remapFragment(inner, (f) =&gt; { for (const node of f.nodes) node.optional = true; }); |
| resolveEndpoint | function | 1184 | no | function resolveEndpoint(endpoint, bySpec, byId) { |
| id | const | 1186 | no | const id = bySpec.get(endpoint); |
| text | const | 1190 | no | const text = String(endpoint); |
| resolveSpecList | function | 1195 | no | function resolveSpecList(list, bySpec) { |
| id | const | 1198 | no | const id = bySpec.get(item); |
| compose | function | 1206 | yes | export function compose(parts) { |
| frag | const | 1207 | no | const frag = asFragment(parts); |
| bySpec | const | 1208 | no | const bySpec = new Map(); |
| used | const | 1209 | no | const used = new Set(); |
| generated | variable | 1210 | no | let generated = 0; |
| nodes | const | 1211 | no | const nodes = frag.nodes.map((spec) =&gt; { let id = spec.id === undefined \|\| spec.id === null \|\| spec.id === &#39;&#39; ? null : String(spec.id); if (!id) { do { generated += 1; id = `n${generated}`; } while (… |
| id | variable | 1212 | no | let id = spec.id === undefined \|\| spec.id === null \|\| spec.id === &#39;&#39; ? null : String(spec.id); |
| byId | const | 1221 | no | const byId = new Map(nodes.map((node) =&gt; [node.id, node.spec])); |
| incoming | const | 1223 | no | const incoming = new Map(nodes.map((node) =&gt; [node.id, new Set()])); |
| edgeSet | const | 1224 | no | const edgeSet = new Set(); |
| fromId | const | 1226 | no | const fromId = resolveEndpoint(from, bySpec, byId); |
| toId | const | 1227 | no | const toId = resolveEndpoint(to, bySpec, byId); |
| edges | const | 1231 | no | const edges = [...edgeSet] |
| groupSpecs | const | 1235 | no | const groupSpecs = frag.meta ?? {}; |
| rawFallbacks | const | 1236 | no | const rawFallbacks = groupSpecs.fallbacks ?? (groupSpecs.fallback ? [groupSpecs.fallback] : []); |
| rawBranches | const | 1237 | no | const rawBranches = groupSpecs.branches ?? (groupSpecs.branch ? [groupSpecs.branch] : []); |
| groups | const | 1238 | no | const groups = {}; |
| fallbackByNode | const | 1258 | no | const fallbackByNode = new Map(); |
| planNodes | const | 1265 | no | const planNodes = nodes.map(({ spec, id }) =&gt; { const ref = requireRef(spec.component); const declared = Array.isArray(spec.dependsOn) ? spec.dependsOn.map(String) : []; const dependsOn = uniqueSorte… |
| ref | const | 1266 | no | const ref = requireRef(spec.component); |
| declared | const | 1267 | no | const declared = Array.isArray(spec.dependsOn) ? spec.dependsOn.map(String) : []; |
| dependsOn | const | 1268 | no | const dependsOn = uniqueSorted([...incoming.get(id), ...declared]); |
| node | const | 1269 | no | const node = { |
| entry | const | 1291 | no | const entry = resolveSpecList(frag.entry, bySpec); |
| exit | const | 1292 | no | const exit = resolveSpecList(frag.exit, bySpec); |
| graph | const | 1293 | no | const graph = { schema: GRAPH_SCHEMA, nodes: planNodes, edges, entry, exit, groups }; |
| normalizeNodeList | function | 1302 | no | function normalizeNodeList(rawNodes, rawEdges = []) { |
| incoming | const | 1304 | no | const incoming = new Map(); |
| edges | const | 1305 | no | const edges = []; |
| pair | const | 1307 | no | const pair = Array.isArray(edge) ? edge : [edge.from, edge.to]; |
| nodes | const | 1314 | no | const nodes = rawNodes.map((raw, index) =&gt; { if (!isPlainObject(raw)) fail(&#39;GRAPH_INVALID&#39;, `node ${index} must be an object`); const id = raw.id === undefined \|\| raw.id === null \|\| raw.id === &#39;&#39; ? `… |
| id | const | 1316 | no | const id = raw.id === undefined \|\| raw.id === null \|\| raw.id === &#39;&#39; ? `n${index + 1}` : String(raw.id); |
| ref | const | 1317 | no | const ref = typeof raw.component === &#39;string&#39; ? raw.component : raw.component; |
| component | const | 1318 | no | const component = typeof ref === &#39;string&#39; ? ref : (isPlainObject(ref) ? `${ref.id ?? &#39;&#39;}@${ref.range ?? ref.version ?? &#39;*&#39;}` : &#39;&#39;); |
| declared | const | 1319 | no | const declared = Array.isArray(raw.dependsOn) ? raw.dependsOn.map(String) : []; |
| extra | const | 1320 | no | const extra = incoming.get(id) ?? []; |
| normalizeGraph | function | 1343 | no | function normalizeGraph(graph) { |
| dependents | const | 1347 | no | const dependents = new Set(); |
| entry | const | 1349 | no | const entry = Array.isArray(graph.entry) &amp;&amp; graph.entry.length |
| exit | const | 1352 | no | const exit = Array.isArray(graph.exit) &amp;&amp; graph.exit.length |
| pipeline | const | 1355 | no | const pipeline = isPlainObject(graph.pipeline) |
| planOrder | function | 1371 | no | function planOrder(nodes) { |
| deps | const | 1372 | no | const deps = new Map(nodes.map((node) =&gt; [node.id, new Set(node.dependsOn)])); |
| remaining | const | 1373 | no | const remaining = new Set(nodes.map((node) =&gt; node.id)); |
| done | const | 1374 | no | const done = new Set(); |
| order | const | 1375 | no | const order = []; |
| levels | const | 1376 | no | const levels = []; |
| frontier | const | 1378 | no | const frontier = [...remaining].filter((id) =&gt; [...deps.get(id)].every((dep) =&gt; done.has(dep))).sort(); |
| validateGraph | function | 1390 | yes | export function validateGraph(graph) { |
| errors | const | 1391 | no | const errors = []; |
| normalized | variable | 1392 | no | let normalized; |
| nodes | const | 1398 | no | const nodes = normalized.nodes; |
| seen | const | 1400 | no | const seen = new Set(); |
| ref | const | 1407 | no | const ref = tryParseRef(node.component); |
| resolveComponentVersion | function | 1426 | no | function resolveComponentVersion(db, ref, cache) { |
| version | variable | 1429 | no | let version = null; |
| activationFromDb | function | 1436 | no | function activationFromDb(db, { pipelineId, scope, scopeRef }) { |
| requestedIndex | const | 1438 | no | const requestedIndex = scope ? SCOPE_SPECIFICITY.indexOf(scope) : SCOPE_SPECIFICITY.length - 1; |
| current | const | 1441 | no | const current = SCOPE_SPECIFICITY[i]; |
| ref | const | 1442 | no | const ref = current === &#39;workspace&#39; ? &#39;&#39; : String(scopeRef ?? &#39;&#39;); |
| row | const | 1444 | no | const row = stmt(db, &#39;SELECT scope, scope_ref, pipeline_id, version, config, config_digest, activated_at FROM activations WHERE scope = ? AND scope_ref = ? AND pipeline_id = ?&#39;) |
| overrideForNode | function | 1460 | no | function overrideForNode(override, nodeId, nodeIds) { |
| map | const | 1462 | no | const map = isPlainObject(override.nodes) ? override.nodes : override; |
| keys | const | 1463 | no | const keys = Object.keys(map); |
| hasStar | const | 1465 | no | const hasStar = isPlainObject(map[&#39;*&#39;]); |
| hasNodeKey | const | 1466 | no | const hasNodeKey = keys.some((key) =&gt; nodeIds.has(key)); |
| out | variable | 1468 | no | let out = {}; |
| graphPayload | function | 1474 | no | function graphPayload(graph) { |
| planDigest | function | 1488 | no | function planDigest(plan) { |
| shape | const | 1489 | no | const shape = { ...plan }; |
| compile | function | 1494 | yes | export function compile(graph, options = {}) { |
| normalized | const | 1495 | no | const normalized = normalizeGraph(graph); |
| validation | const | 1496 | no | const validation = validateGraph(normalized); |
| structural | const | 1498 | no | const structural = validation.errors.find((error) =&gt; error.code !== &#39;CYCLE&#39;); |
| cycle | const | 1499 | no | const cycle = validation.errors.find((error) =&gt; error.code === &#39;CYCLE&#39;); |
| db | const | 1504 | no | const db = options.db ?? null; |
| graphDigest | const | 1506 | no | const graphDigest = digestOf(graphPayload(normalized)); |
| activationRow | const | 1509 | no | const activationRow = options.activation |
| activationConfig | const | 1523 | no | const activationConfig = activationRow?.config ?? {}; |
| runConfig | const | 1524 | no | const runConfig = options.run ?? null; |
| pipelineConfig | const | 1526 | no | const pipelineConfig = mergeConfig( isPlainObject(normalized.defaults?.config) ? normalized.defaults.config : {}, normalized.config ?? {}, ); |
| nodeIds | const | 1530 | no | const nodeIds = new Set(normalized.nodes.map((node) =&gt; node.id)); |
| refCache | const | 1531 | no | const refCache = new Map(); |
| componentDefaults | const | 1532 | no | const componentDefaults = {}; |
| nodeConfigs | const | 1533 | no | const nodeConfigs = {}; |
| activationConfigs | const | 1534 | no | const activationConfigs = {}; |
| runConfigs | const | 1535 | no | const runConfigs = {}; |
| ref | const | 1538 | no | const ref = requireRef(node.component); |
| version | const | 1539 | no | const version = resolveComponentVersion(db, ref, refCache); |
| defaults | variable | 1540 | no | let defaults = node.componentDefaults ?? {}; |
| row | const | 1542 | no | const row = stmt(db, &#39;SELECT defaults FROM components WHERE id = ? AND version = ?&#39;).get(ref.id, version); |
| resolved | const | 1551 | no | const resolved = {}; |
| config | variable | 1553 | no | let config = mergeConfig(componentDefaults[node.id], pipelineConfig); |
| layers | const | 1560 | no | const layers = { |
| configDigest | const | 1567 | no | const configDigest = digestOf({ resolved, layers }); |
| inputs | const | 1568 | no | const inputs = options.inputs === undefined ? {} : options.inputs; |
| inputDigest | const | 1569 | no | const inputDigest = digestOf(inputs ?? {}); |
| activationKey | const | 1571 | no | const activationKey = activationRow |
| resolutionKey | const | 1576 | no | const resolutionKey = digestOf(Object.fromEntries([...refCache.entries()].sort(([a], [b]) =&gt; (a &lt; b ? -1 : a &gt; b ? 1 : 0)))); |
| cacheKey | const | 1577 | no | const cacheKey = `${graphDigest}:${configDigest}:${inputDigest}:${activationKey}:${resolutionKey}`; |
| levelOf | const | 1580 | no | const levelOf = new Map(); |
| planNodes | const | 1583 | no | const planNodes = normalized.nodes |
| ref | const | 1585 | no | const ref = requireRef(node.component); |
| version | const | 1586 | no | const version = resolveComponentVersion(db, ref, refCache); |
| plan | const | 1612 | no | const plan = { |
| oldest | const | 1635 | no | const oldest = PLAN_CACHE.keys().next().value; |
| normalizePipeline | function | 1646 | no | function normalizePipeline(input) { |
| id | const | 1648 | no | const id = requireId(input.id, &#39;PIPELINE&#39;); |
| version | const | 1649 | no | const version = requireVersion(input.version, &#39;PIPELINE&#39;); |
| parsed | const | 1650 | no | const parsed = parseVersion(version); |
| status | const | 1651 | no | const status = String(input.status ?? &#39;active&#39;).trim().toLowerCase(); |
| parentVersion | variable | 1653 | no | let parentVersion = input.parentVersion ?? input.parent_version ?? null; |
| validation | const | 1656 | no | const validation = validateGraph({ nodes, edges }); |
| structural | const | 1658 | no | const structural = validation.errors.find((error) =&gt; error.code !== &#39;CYCLE&#39;); |
| cycle | const | 1659 | no | const cycle = validation.errors.find((error) =&gt; error.code === &#39;CYCLE&#39;); |
| pipeline | const | 1664 | no | const pipeline = { |
| contentShape | const | 1680 | no | const contentShape = { ...pipeline }; |
| pipelineFromRow | function | 1690 | no | function pipelineFromRow(row) { |
| INSERT_PIPELINE | const | 1713 | no | const INSERT_PIPELINE = ` |
| registerPipeline | function | 1720 | yes | export function registerPipeline(db, pipeline, options = {}) { |
| normalized | const | 1722 | no | const normalized = normalizePipeline(pipeline); |
| allowDuplicateDigest | const | 1723 | no | const allowDuplicateDigest = options.allowDuplicateDigest === true; |
| existing | const | 1724 | no | const existing = stmt(db, &#39;SELECT digest FROM pipelines WHERE id = ? AND version = ?&#39;) |
| duplicate | const | 1731 | no | const duplicate = stmt(db, &#39;SELECT version FROM pipelines WHERE id = ? AND content_digest = ? LIMIT 1&#39;) |
| parent | const | 1739 | no | const parent = stmt(db, &#39;SELECT version FROM pipelines WHERE id = ? AND version = ?&#39;) |
| ref | const | 1749 | no | const ref = requireRef(node.component); |
| found | const | 1750 | no | const found = resolveVersion(db, { id: ref.id, range: ref.range, source: &#39;component&#39; }); |
| parts | const | 1759 | no | const parts = normalized.versionParts; |
| getPipeline | function | 1783 | yes | export function getPipeline(db, { id, version = null } = {}) { |
| pipelineId | const | 1785 | no | const pipelineId = requireId(id, &#39;PIPELINE&#39;); |
| resolved | variable | 1786 | no | let resolved = version; |
| row | const | 1791 | no | const row = stmt(db, &#39;SELECT * FROM pipelines WHERE id = ? AND version = ?&#39;).get(pipelineId, resolved); |
| listPipelines | function | 1795 | yes | export function listPipelines(db, options = {}) { |
| limit | const | 1797 | no | const limit = clamp(Number(options.limit ?? DEFAULT_LIMIT) \|\| DEFAULT_LIMIT, 1, MAX_LIMIT); |
| params | const | 1799 | no | const params = []; |
| rows | const | 1803 | no | const rows = runFtsSelect(db, { table: &#39;pipelines&#39;, ftsTable: &#39;pipelines_fts&#39;, select: &#39;*&#39;, where, |
| hasMore | const | 1813 | no | const hasMore = rows.length &gt; limit; |
| page | const | 1814 | no | const page = hasMore ? rows.slice(0, limit) : rows; |
| out | const | 1815 | no | const out = decorateList(page, limit); |
| normalizeScope | function | 1827 | no | function normalizeScope(scope, scopeRef) { |
| value | const | 1828 | no | const value = String(scope ?? &#39;workspace&#39;).trim().toLowerCase(); |
| ref | const | 1833 | no | const ref = String(scopeRef ?? &#39;&#39;).trim(); |
| resolvePipelineVersion | function | 1838 | no | function resolvePipelineVersion(db, pipelineId, version) { |
| resolved | const | 1841 | no | const resolved = resolveVersion(db, { id: pipelineId, range: version, source: &#39;pipeline&#39; }); |
| writeActivation | function | 1846 | no | function writeActivation(db, { scope, scopeRef, pipelineId, version, config, actor, action }) { |
| pipeline | const | 1847 | no | const pipeline = stmt(db, &#39;SELECT version FROM pipelines WHERE id = ? AND version = ?&#39;).get(pipelineId, version); |
| available | const | 1849 | no | const available = stmt(db, &#39;SELECT version FROM pipelines WHERE id = ?&#39;).all(pipelineId).map((row) =&gt; row.version); |
| configValue | const | 1852 | no | const configValue = isPlainObject(config) ? config : {}; |
| configDigest | const | 1853 | no | const configDigest = digestOf(configValue); |
| activatedAt | const | 1854 | no | const activatedAt = nowISO(); |
| previous | const | 1855 | no | const previous = stmt(db, &#39;SELECT version FROM activations WHERE scope = ? AND scope_ref = ? AND pipeline_id = ?&#39;) |
| activate | function | 1886 | yes | export function activate(db, { scope = &#39;workspace&#39;, scopeRef = null, pipelineId, version, config = {}, actor = null } = {}) { |
| pipeline | const | 1888 | no | const pipeline = requireId(pipelineId, &#39;PIPELINE&#39;); |
| target | const | 1889 | no | const target = normalizeScope(scope, scopeRef); |
| resolvedVersion | const | 1890 | no | const resolvedVersion = resolvePipelineVersion(db, pipeline, version); |
| rollback | function | 1894 | yes | export function rollback(db, { scope = &#39;workspace&#39;, scopeRef = null, pipelineId, toVersion, actor = null } = {}) { |
| pipeline | const | 1896 | no | const pipeline = requireId(pipelineId, &#39;PIPELINE&#39;); |
| target | const | 1897 | no | const target = normalizeScope(scope, scopeRef); |
| current | const | 1898 | no | const current = stmt(db, &#39;SELECT version, config FROM activations WHERE scope = ? AND scope_ref = ? AND pipeline_id = ?&#39;) |
| resolvedVersion | const | 1903 | no | const resolvedVersion = resolvePipelineVersion(db, pipeline, toVersion); |
| activation | const | 1904 | no | const activation = writeActivation(db, { ...target, pipelineId: pipeline, version: resolvedVersion, config: jsonValue(current.config, {}), |
| forkPipeline | function | 1915 | yes | export function forkPipeline(db, { id, fromVersion, newVersion = null, actor = null } = {}) { |
| pipelineId | const | 1917 | no | const pipelineId = requireId(id, &#39;PIPELINE&#39;); |
| source | const | 1918 | no | const source = getPipeline(db, { id: pipelineId, version: fromVersion }); |
| targetVersion | const | 1921 | no | const targetVersion = newVersion ? requireVersion(newVersion, &#39;PIPELINE&#39;) : `${from.major}.${from.minor + 1}.0`; |
| exists | const | 1925 | no | const exists = stmt(db, &#39;SELECT version FROM pipelines WHERE id = ? AND version = ?&#39;).get(pipelineId, targetVersion); |
| forked | const | 1927 | no | const forked = { |
| diffPipeline | function | 1947 | yes | export function diffPipeline(db, { id, a, b } = {}) { |
| pipelineId | const | 1949 | no | const pipelineId = requireId(id, &#39;PIPELINE&#39;); |
| before | const | 1950 | no | const before = getPipeline(db, { id: pipelineId, version: a }); |
| after | const | 1952 | no | const after = getPipeline(db, { id: pipelineId, version: b }); |
| beforeNodes | const | 1955 | no | const beforeNodes = new Map((before.nodes ?? []).map((node) =&gt; [node.id, node])); |
| afterNodes | const | 1956 | no | const afterNodes = new Map((after.nodes ?? []).map((node) =&gt; [node.id, node])); |
| added | const | 1957 | no | const added = [...afterNodes.keys()].filter((nodeId) =&gt; !beforeNodes.has(nodeId)).sort(); |
| removed | const | 1958 | no | const removed = [...beforeNodes.keys()].filter((nodeId) =&gt; !afterNodes.has(nodeId)).sort(); |
| changed | const | 1959 | no | const changed = []; |
| left | const | 1961 | no | const left = beforeNodes.get(nodeId); |
| right | const | 1962 | no | const right = afterNodes.get(nodeId); |
| fields | const | 1963 | no | const fields = []; |
| flattenConfig | function | 1973 | no | const flattenConfig = (pipeline) =&gt; { |
| defaults | const | 1974 | no | const defaults = isPlainObject(pipeline.defaults?.config) ? pipeline.defaults.config : {}; |
| leftConfig | const | 1977 | no | const leftConfig = flattenConfig(before); |
| rightConfig | const | 1978 | no | const rightConfig = flattenConfig(after); |
| configAdded | const | 1979 | no | const configAdded = Object.keys(rightConfig).filter((key) =&gt; !(key in leftConfig)).sort(); |
| configRemoved | const | 1980 | no | const configRemoved = Object.keys(leftConfig).filter((key) =&gt; !(key in rightConfig)).sort(); |
| configChanged | const | 1981 | no | const configChanged = Object.keys(leftConfig) |
| componentChanges | const | 1986 | no | const componentChanges = []; |
| left | const | 1988 | no | const left = beforeNodes.get(nodeId)?.component ?? null; |
| right | const | 1989 | no | const right = afterNodes.get(nodeId)?.component ?? null; |
| runFromRow | function | 2008 | no | function runFromRow(row) { |
| recordReplayRun | function | 2031 | no | function recordReplayRun(db, run, plan, mode) { |
| id | const | 2032 | no | const id = `run_${digestOf({ replayOf: run.id ?? null, planDigest: plan.digest }).slice(0, 24)}`; |
| exists | const | 2033 | no | const exists = stmt(db, &#39;SELECT id FROM pipeline_runs WHERE id = ?&#39;).get(id); |
| replayPlan | function | 2053 | yes | export function replayPlan(db, { runId = null, version = null, live = false, inputs = null, run = null, record = false } = {}) { |
| recorded | const | 2055 | no | const recorded = run &amp;&amp; isPlainObject(run) |
| pipelineId | const | 2084 | no | const pipelineId = recorded?.pipelineId ?? null; |
| targetVersion | const | 2086 | no | const targetVersion = version |
| pipeline | const | 2089 | no | const pipeline = getPipeline(db, { id: pipelineId, version: targetVersion }); |
| componentVersions | const | 2096 | no | const componentVersions = recorded?.componentVersions ?? {}; |
| nodeIds | const | 2097 | no | const nodeIds = new Set((pipeline.nodes ?? []).map((node) =&gt; node.id)); |
| graphNodes | const | 2098 | no | const graphNodes = (pipeline.nodes ?? []).map((node) =&gt; { if (live) return node; const pinned = componentVersions[node.id]; if (!pinned) return node; const ref = tryParseRef(node.component); |
| pinned | const | 2100 | no | const pinned = componentVersions[node.id]; |
| ref | const | 2102 | no | const ref = tryParseRef(node.component); |
| plan | const | 2107 | no | const plan = compile( { ...pipeline, nodes: graphNodes }, { db, activation: recorded?.config ?? {}, |
| resolvedVersions | const | 2118 | no | const resolvedVersions = Object.fromEntries( plan.nodes.map((node) =&gt; [node.id, node.componentVersion ?? componentVersions[node.id] ?? null]), ); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 8 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Reusable action component registry: immutable versions, versioned pipeline composition, activation, fork/diff/replay. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | lane-N |
| 5 | why | — | — | Actions are data, not code sprawl: a stable id@version plus a versioned DAG keeps 10,000 automations replayable without a cloud service. |
| 6 | invariant | — | — | No component may declare a browser or send effect; a document never grants execution authority. |

## Excerpt

```javascript
/**
 * @hq:context Reusable action component registry: immutable versions, versioned pipeline composition, activation, fork/diff/replay.
 * @hq:owner hq-agent
 * @hq:task lane-N
 * @hq:why Actions are data, not code sprawl: a stable id@version plus a versioned DAG keeps 10,000 automations replayable without a cloud service.
 * @hq:invariant No component may declare a browser or send effect; a document never grants execution authority.
 */
import {
  canonical, clamp, digestOf, nowISO, safeJsonParse, tokenize, uniqueSorted,
} from './util.mjs';

const COMPONENT_SCHEMA = 'hq.component/1';
const PIPELINE_SCHEMA = 'hq.pipeline/1';
const GRAPH_SCHEMA = 'hq.pipeline-graph/1';
const PLAN_SCHEMA = 'hq.pipeline-plan/1';
const ACTIVATION_SCHEMA = 'hq.activation/1';

const COMPONENT_KINDS = ['tool', 'trigger', 'policy', 'context', 'evaluator', 'transform', 'approval', 'sink'];
const COMPONENT_STATUSES = ['active', 'draft', 'deprecated', 'retired'];
const PIPELINE_STATUSES = ['active', 'draft', 'deprecated', 'retired'];
const IDEMPOTENCY = ['keyed', 'natural', 'none'];
const COST_CLASSES = ['local', 'model', 'network'];
// Most specific scope first: session beats project beats workspace.
const SCOPE_SPECIFICITY = ['session', 'project', 'workspace'];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;
const MAX_PLAN_CACHE = 128;
const DEFAULT_MAX_FANOUT = 100;

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
const READ_EFFECT_RE = /(^|:)(read|list|stat|watch|search|resolve|validate|evaluate|describe)$/;
const FORBIDDEN_EFFECT_RE = /^(browser|send|network|http|https|provider|cloud|email|sms|webhook|socket)(:|$)/;

const PLAN_CACHE = new Map();
const READY_DBS = new WeakSet();
const STMT_CACHE = new WeakMap();
const FRAGMENT = Symbol('hq.compose.fragment');

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function fail(code, message, detail) {
  const error = new Error(message || code);
  error.code = code;
  if (detail !== undefined) error.detail = detail;
  throw error;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function jsonValue(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') return safeJsonParse(value, fallback);
  return value;
}

function jsonText(value) {
  return JSON.stringify(canonical(value === undefined ? null : value));
}

function mergeConfig(base, override) {
  if (!isPlainObject(base)) return isPlainObject(override) ? clone(override) : (override ?? {});
  if (!isPlainObject(override)) return clone(base);
  const out = clone(base);
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(out[key])) out[key] = mergeConfig(out[key], value);
    else out[key] = clone(value);
  }
  return out;
}
```

_First 80 of 2159 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
