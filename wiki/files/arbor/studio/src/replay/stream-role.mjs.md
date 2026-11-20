# File: studio/src/replay/stream-role.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/replay/stream-role.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 49589 B |
| Lines | 863 |
| Hash | 7dad456b3008 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STREAM_ROLE_CLASSIFIER_VERSION | const | 53 | yes | export const STREAM_ROLE_CLASSIFIER_VERSION = 3; |
| STREAM_ROLES_SCHEMA | const | 54 | yes | export const STREAM_ROLES_SCHEMA = &#39;capture-studio.stream-roles/3&#39;; |
| STREAM_ROLES_CONFIDENCE_SCALE | const | 55 | yes | export const STREAM_ROLES_CONFIDENCE_SCALE = &#39;heuristic-ordinal (none\|low\|medium\|high); uncalibrated, not a probability; signals derive from the same events and are not independent&#39;; |
| STREAM_ROLES | const | 57 | yes | export const STREAM_ROLES = Object.freeze([&#39;chat-reply&#39;, &#39;history-load&#39;, &#39;config&#39;, &#39;telemetry&#39;, &#39;push-presence&#39;, &#39;asset&#39;, &#39;auth&#39;, &#39;unknown&#39;]); |
| CONFIDENCE_LEVELS | const | 58 | yes | export const CONFIDENCE_LEVELS = Object.freeze([&#39;none&#39;, &#39;low&#39;, &#39;medium&#39;, &#39;high&#39;]); |
| EVIDENCE_FEATURES | const | 59 | yes | export const EVIDENCE_FEATURES = Object.freeze([ // verdict / coverage markers &#39;empty_stream&#39;, &#39;no_structural_evidence&#39;, &#39;weak_evidence_only&#39;, &#39;conflicting_role_evidence&#39;, &#39;incomplete_capture&#39;, &#39;insp… |
| OPTION_SPECS | const | 87 | no | const OPTION_SPECS = Object.freeze({ maxEvents: [5000, 1, 100000], // events examined per stream (the first N, in order) maxNodes: [2000, 50, 100000], // JSON nodes visited per document, per pass min… |
| resolveClassifierOptions | function | 96 | yes | export function resolveClassifierOptions(opts) { |
| src | const | 97 | no | const src = opts !== null &amp;&amp; typeof opts === &#39;object&#39; &amp;&amp; !Array.isArray(opts) ? opts : {}; |
| out | const | 98 | no | const out = {}; |
| v | const | 100 | no | const v = src[k]; |
| CHAT_ROLES | const | 107 | no | const CHAT_ROLES = new Set([&#39;user&#39;, &#39;assistant&#39;, &#39;system&#39;, &#39;tool&#39;, &#39;human&#39;, &#39;ai&#39;, &#39;model&#39;, &#39;bot&#39;]); |
| ASSISTANT_ROLES | const | 108 | no | const ASSISTANT_ROLES = new Set([&#39;assistant&#39;, &#39;model&#39;, &#39;ai&#39;, &#39;bot&#39;]); |
| INDEX_KEYS | const | 109 | no | const INDEX_KEYS = [&#39;index&#39;, &#39;output_index&#39;, &#39;content_index&#39;, &#39;block_index&#39;, &#39;candidate_index&#39;, &#39;choice_index&#39;]; |
| ASSET_MIME | const | 110 | no | const ASSET_MIME = /^(?:image\|audio\|video\|font)\\/\|^text\\/(?:css\|javascript\|html)$\|^application\\/(?:javascript\|x-javascript\|ecmascript\|wasm\|font-[\\w-]+\|x-font-[\\w-]+\|vnd\\.ms-fontobject)$/; |
| ASSET_RESOURCE_TYPES | const | 111 | no | const ASSET_RESOURCE_TYPES = new Set([&#39;Image&#39;, &#39;Stylesheet&#39;, &#39;Script&#39;, &#39;Font&#39;, &#39;Media&#39;, &#39;Manifest&#39;, &#39;TextTrack&#39;]); |
| INCOMPLETE_STATUS | const | 112 | no | const INCOMPLETE_STATUS = new Set([&#39;failed&#39;, &#39;canceled&#39;, &#39;incomplete_at_stop&#39;]); |
| JWT_SHAPED | const | 113 | no | const JWT_SHAPED = /^[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}$/; |
| OPAQUE_SECRET | const | 114 | no | const OPAQUE_SECRET = /^[A-Za-z0-9_\\-+/=]{40,}$/; |
| TOKEN_VALUE | const | 115 | no | const TOKEN_VALUE = /^[A-Za-z0-9._~+/=-]{20,}$/; |
| UUID | const | 116 | no | const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; |
| ISO_TIME | const | 117 | no | const ISO_TIME = /^\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}/; |
| NUMERIC_TEXT | const | 118 | no | const NUMERIC_TEXT = /^\\s*-?\\d+(?:\\.\\d+)?\\s*$/; |
| TOKEN_SLOT_KEYS | const | 121 | no | const TOKEN_SLOT_KEYS = new Set([&#39;accesstoken&#39;, &#39;idtoken&#39;, &#39;refreshtoken&#39;, &#39;sessiontoken&#39;, &#39;authtoken&#39;, &#39;token&#39;]); |
| EXPIRY_SLOT_KEYS | const | 122 | no | const EXPIRY_SLOT_KEYS = new Set([&#39;expiresin&#39;, &#39;expiresat&#39;, &#39;expires&#39;, &#39;expiry&#39;, &#39;exp&#39;]); |
| isObj | function | 124 | no | const isObj = (v) =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| isTimestampNumber | function | 125 | no | const isTimestampNumber = (v) =&gt; typeof v === &#39;number&#39; &amp;&amp; Number.isFinite(v) &amp;&amp; ((v &gt;= 1e9 &amp;&amp; v &lt;= 4.2e9) \|\| (v &gt;= 1e12 &amp;&amp; v &lt;= 4.2e12)); |
| isExpiryNumber | function | 126 | no | const isExpiryNumber = (v) =&gt; Number.isInteger(v) &amp;&amp; ((v &gt;= 30 &amp;&amp; v &lt;= 3.2e7) \|\| isTimestampNumber(v)); |
| isOpaqueSecret | function | 127 | no | const isOpaqueSecret = (s) =&gt; OPAQUE_SECRET.test(s) &amp;&amp; /[a-z]/.test(s) &amp;&amp; /[A-Z]/.test(s) &amp;&amp; /\\d/.test(s) &amp;&amp; !UUID.test(s); |
| starCount | function | 128 | no | const starCount = (s) =&gt; s.match(/\\*/g)?.length ?? 0; |
| isMasked | function | 129 | no | const isMasked = (s) =&gt; s.length &gt;= 8 &amp;&amp; starCount(s) &gt;= 8 &amp;&amp; starCount(s) / s.length &gt;= 0.5; |
| slotKey | function | 130 | no | const slotKey = (k) =&gt; String(k).toLowerCase().replace(/[_-]/g, &#39;&#39;); |
| mkBudget | function | 133 | no | const mkBudget = (n) =&gt; ({ n, hit: false }); |
| spend | function | 134 | no | const spend = (b) =&gt; { if (b.n &lt;= 0) { b.hit = true; return false; } b.n--; return true; }; |
| normalize | function | 137 | no | function normalize(stream) { |
| s | const | 138 | no | const s = isObj(stream) ? stream : {}; |
| wrapped | const | 139 | no | const wrapped = Array.isArray(s.events) \|\| &#39;summary&#39; in s \|\| &#39;assembled&#39; in s \|\| &#39;map&#39; in s; |
| jsonOf | function | 149 | no | const jsonOf = (ev) =&gt; (ev?.jsonNested?.json !== undefined ? ev.jsonNested.json : ev?.json); |
| collectDocs | function | 152 | no | function collectDocs(events, o) { |
| docs | const | 153 | no | const docs = []; |
| heartbeats | variable | 154 | no | let heartbeats = 0; |
| channelEvents | variable | 155 | no | let channelEvents = 0; |
| examined | const | 156 | no | const examined = events.slice(0, o.maxEvents); |
| j | const | 161 | no | const j = jsonOf(ev); |
| createGrowth | function | 168 | no | function createGrowth() { |
| targets | const | 169 | no | const targets = new Map(); // target -&gt; { n, distinct:Set, chars } |
| lastText | const | 170 | no | const lastText = new Map(); // target -&gt; last full string seen (cumulative snapshots) |
| state | const | 171 | no | const state = { lastPath: null, truncatedDocs: 0 }; |
| step | function | 172 | no | const step = (target, piece) =&gt; { |
| t | variable | 174 | no | let t = targets.get(target); |
| cumulative | function | 179 | no | const cumulative = (target, value) =&gt; { |
| prev | const | 181 | no | const prev = lastText.get(target); |
| expandPatch | function | 188 | no | function expandPatch(json) { |
| holdsContainer | function | 198 | no | const holdsContainer = (v) =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39;; |
| boundedEntries | function | 202 | no | function boundedEntries(obj, limit) { |
| entries | const | 203 | no | const entries = []; |
| more | variable | 204 | no | let more = false; |
| walkDelta | function | 213 | no | function walkDelta(node, path, depth, idx, g, b) { |
| de | const | 228 | no | const de = boundedEntries(v, 20); |
| snapshotLeaves | function | 237 | no | function snapshotLeaves(node, path, depth, g, b) { |
| feedGrowth | function | 254 | no | function feedGrowth(g, json, maxNodes) { |
| b | const | 255 | no | const b = mkBudget(maxNodes); |
| path | const | 264 | no | const path = typeof u.p === &#39;string&#39; ? u.p : g.state.lastPath; |
| mode | const | 266 | no | const mode = u.o === undefined ? &#39;append&#39; : u.o; |
| idx | const | 273 | no | const idx = INDEX_KEYS.filter((k) =&gt; Number.isInteger(u[k])).map((k) =&gt; u[k]).join(&#39;.&#39;); |
| growthSummary | function | 280 | no | function growthSummary(g, o) { |
| targets | variable | 281 | no | let targets = 0; let steps = 0; |
| mappedTextComponents | function | 288 | no | function mappedTextComponents(map) { |
| comps | const | 290 | no | const comps = Array.isArray(map.components) ? map.components : []; |
| mappedMessageComponents | function | 297 | no | function mappedMessageComponents(map) { |
| assembledTextBlocks | function | 302 | no | function assembledTextBlocks(assembled) { |
| growthFacts | function | 307 | no | function growthFacts(docs, assembled, map, o) { |
| g | const | 308 | no | const g = createGrowth(); |
| mapped | const | 311 | no | const mapped = mappedTextComponents(map); |
| blocks | const | 312 | no | const blocks = assembledTextBlocks(assembled); |
| textual | function | 317 | no | function textual(v, d = 0) { |
| roleValueOf | function | 325 | no | const roleValueOf = (node) =&gt; { |
| raw | const | 326 | no | const raw = typeof node.role === &#39;string&#39; ? node.role : (isObj(node.author) &amp;&amp; typeof node.author.role === &#39;string&#39; ? node.author.role : null); |
| messageRole | function | 331 | no | function messageRole(o) { |
| node | const | 333 | no | const node = isObj(o.message) &amp;&amp; !(&#39;role&#39; in o) ? o.message : o; |
| role | const | 334 | no | const role = roleValueOf(node); |
| isAssistantFrame | function | 341 | no | function isAssistantFrame(node) { |
| role | const | 342 | no | const role = roleValueOf(node); |
| scalarKind | function | 346 | no | const scalarKind = (v) =&gt; (typeof v === &#39;string&#39; ? &#39;s&#39; : typeof v === &#39;number&#39; ? &#39;n&#39; : typeof v === &#39;boolean&#39; ? &#39;b&#39; : v === null ? &#39;z&#39; : &#39;o&#39;); |
| isScalar | function | 347 | no | const isScalar = (v) =&gt; v === null \|\| [&#39;string&#39;, &#39;number&#39;, &#39;boolean&#39;].includes(typeof v); |
| signature | function | 349 | no | const signature = (rec) =&gt; { |
| createStats | function | 354 | no | function createStats() { |
| scalarStats | function | 362 | no | function scalarStats(st, v) { |
| noteContainer | function | 375 | no | function noteContainer(st, members) { |
| roles | const | 376 | no | const roles = members.map(messageRole).filter((r) =&gt; r !== null); |
| descriptorArray | function | 381 | no | function descriptorArray(items) { |
| sigs | const | 383 | no | const sigs = new Map(); |
| vals | function | 386 | no | const vals = (it) =&gt; boundedEntries(it, 60).entries.map((e) =&gt; e[1]); |
| scan | function | 390 | no | function scan(node, depth, st, b) { |
| members | const | 395 | no | const members = node.slice(0, 500); |
| msgs | const | 396 | no | const msgs = noteContainer(st, members); |
| vals | const | 403 | no | const vals = entries.map((e) =&gt; e[1]); |
| tokenExchangeIn | function | 411 | no | function tokenExchangeIn(obj) { |
| token | variable | 413 | no | let token = false; let expiry = false; |
| key | const | 415 | no | const key = slotKey(k); |
| tokenExchange | function | 421 | no | const tokenExchange = (doc) =&gt; tokenExchangeIn(doc) \|\| (isObj(doc) &amp;&amp; tokenExchangeIn(doc.data)); |
| recordsOf | function | 427 | no | function recordsOf(doc) { |
| pick | function | 428 | no | const pick = (arr) =&gt; { |
| better | function | 432 | no | const better = (p, best) =&gt; p &amp;&amp; (!best \|\| p.length &gt; best.length); |
| best | variable | 435 | no | let best = null; |
| analyze | function | 443 | no | function analyze(docs, assembledDoc, o) { |
| st | const | 444 | no | const st = createStats(); |
| records | const | 445 | no | const records = []; |
| truncatedDocs | variable | 446 | no | let truncatedDocs = 0; // documents whose structure scan was cut (nodes / depth / array / key caps) |
| recordPoolCapped | variable | 447 | no | let recordPoolCapped = false; // more than 500 telemetry/config records: only record-based detectors care |
| exchanges | variable | 448 | no | let exchanges = 0; |
| b | const | 450 | no | const b = mkBudget(o.maxNodes); |
| b | const | 458 | no | const b = mkBudget(o.maxNodes); |
| sigs | const | 463 | no | const sigs = new Map(); |
| rs | const | 464 | no | const rs = { numbers: 0, strings: 0, booleans: 0, longStrings: 0, tsRecords: 0, tsValues: 0 }; |
| part | const | 466 | no | const part = createStats(); |
| s | const | 470 | no | const s = signature(r); |
| dominant | const | 473 | no | const dominant = sigs.size ? Math.max(...sigs.values()) : 0; |
| isSmallFlat | function | 478 | no | function isSmallFlat(doc) { |
| vals | const | 481 | no | const vals = entries.map((e) =&gt; e[1]); |
| streamingEvidence | function | 493 | yes | export function streamingEvidence(stream, opts = {}) { |
| o | const | 494 | no | const o = resolveClassifierOptions(opts); |
| f | const | 497 | no | const f = growthFacts(docs, assembled, map, o); |
| a | const | 498 | no | const a = analyze(docs, null, o); |
| mappedMessage | const | 499 | no | const mappedMessage = mappedMessageComponents(map); |
| frames | const | 500 | no | const frames = a.st.assistantFrames; |
| feat | function | 512 | no | const feat = (feature, count) =&gt; ({ feature, count }); |
| detectReply | function | 514 | no | function detectReply(f, a, mappedMessage) { |
| frames | const | 516 | no | const frames = a.st.assistantFrames; |
| features | const | 517 | no | const features = [ |
| detectHistory | function | 527 | no | function detectHistory(a) { |
| telemetryFacts | function | 533 | no | function telemetryFacts(a) { |
| scalars | const | 535 | no | const scalars = rs.numbers + rs.strings + rs.booleans; |
| repeated | const | 536 | no | const repeated = records &gt;= 3 &amp;&amp; dominant / records &gt;= 0.6; |
| numeric | const | 537 | no | const numeric = scalars &gt; 0 &amp;&amp; rs.numbers / scalars &gt;= 0.4 &amp;&amp; rs.longStrings === 0; |
| timed | const | 538 | no | const timed = records &gt; 0 &amp;&amp; rs.tsRecords / records &gt;= 0.5; |
| detectTelemetry | function | 542 | no | function detectTelemetry(a) { |
| t | const | 543 | no | const t = telemetryFacts(a); |
| detectConfig | function | 550 | no | function detectConfig(a, ctx) { |
| scalars | const | 553 | no | const scalars = st.booleans + st.numbers + st.strings; |
| boolDense | const | 554 | no | const boolDense = st.booleans &gt;= 3 &amp;&amp; scalars &gt; 0 &amp;&amp; st.booleans / scalars &gt;= 0.3; |
| descriptors | const | 555 | no | const descriptors = st.descriptorEntries &gt;= 3; |
| detectAuth | function | 566 | no | function detectAuth(a, ctx, summary, o) { |
| redactions | const | 568 | no | const redactions = Number(summary.redactions) &gt; 0 ? Math.floor(Number(summary.redactions)) : 0; |
| hints | const | 569 | no | const hints = [feat(&#39;credential_shaped_values&#39;, st.jwt + st.opaque), feat(&#39;masked_credential_values&#39;, st.masked), feat(&#39;masked_credential_spans&#39;, redactions)]; |
| hasHint | const | 570 | no | const hasHint = st.jwt + st.opaque + st.masked + redactions &gt; 0; |
| status | const | 571 | no | const status = Number(summary.status_code); |
| statusKnown | const | 572 | no | const statusKnown = Number.isFinite(status) &amp;&amp; status &gt; 0; |
| statusOk | const | 573 | no | const statusOk = !statusKnown \|\| (status &gt;= 200 &amp;&amp; status &lt; 300); |
| method | const | 574 | no | const method = typeof summary.method === &#39;string&#39; ? summary.method.toUpperCase() : null; |
| methodOk | const | 575 | no | const methodOk = method === null \|\| method === &#39;POST&#39; \|\| method === &#39;GET&#39;; |
| smallDoc | const | 576 | no | const smallDoc = !Number.isFinite(summary.bytes) \|\| summary.bytes &lt;= o.smallDocBytes; |
| structural | const | 577 | no | const structural = a.exchanges &gt; 0 &amp;&amp; ctx.jsonEvents &gt;= 1 &amp;&amp; ctx.jsonEvents &lt;= 3 &amp;&amp; !ctx.channel &amp;&amp; smallDoc &amp;&amp; statusOk &amp;&amp; methodOk; |
| requestSeen | const | 579 | no | const requestSeen = method === &#39;POST&#39; &amp;&amp; statusKnown; |
| detectPresence | function | 585 | no | function detectPresence(a, ctx, smallFlat) { |
| detectAsset | function | 591 | no | function detectAsset(summary, ctx) { |
| mime | const | 593 | no | const mime = String(summary.mime ?? &#39;&#39;).toLowerCase().split(&#39;;&#39;)[0].trim(); |
| mimeHit | const | 594 | no | const mimeHit = ASSET_MIME.test(mime); |
| typeHit | const | 595 | no | const typeHit = ASSET_RESOURCE_TYPES.has(summary.resourceType); |
| body | const | 597 | no | const body = Math.max(1, Math.floor(Number(summary.chunks) \|\| 0)); |
| orderOf | const | 604 | no | const orderOf = new Map(EVIDENCE_FEATURES.map((f, i) =&gt; [f, i])); |
| finish | function | 605 | no | function finish(features) { |
| merged | const | 606 | no | const merged = new Map(); |
| n | const | 608 | no | const n = Math.floor(Number(count)); |
| incompleteCapture | function | 614 | no | function incompleteCapture(summary) { |
| LEVEL_BY_SCORE | const | 621 | no | const LEVEL_BY_SCORE = { 2: &#39;medium&#39;, 3: &#39;high&#39; }; |
| stepDown | function | 622 | no | const stepDown = (level) =&gt; (level === &#39;high&#39; ? &#39;medium&#39; : level === &#39;medium&#39; ? &#39;low&#39; : level); |
| buildStreamRoles | function | 627 | yes | export function buildStreamRoles(rows, { eventWindow = null } = {}) { |
| list | const | 628 | no | const list = Array.isArray(rows) ? rows.filter((r) =&gt; isObj(r) &amp;&amp; r.sid !== undefined) : []; |
| byRole | const | 630 | no | const byRole = Object.fromEntries(STREAM_ROLES.map((r) =&gt; [r, 0])); |
| withheld | variable | 631 | no | let withheld = 0; let inspectionCut = 0; |
| streams | const | 632 | no | const streams = list.map((r) =&gt; { const role = STREAM_ROLES.includes(r.role) ? r.role : &#39;unknown&#39;; byRole[role]++; const roleCoverage = cleanCoverage(r.roleCoverage); if (roleCoverage?.withheldRole) … |
| role | const | 633 | no | const role = STREAM_ROLES.includes(r.role) ? r.role : &#39;unknown&#39;; |
| roleCoverage | const | 635 | no | const roleCoverage = cleanCoverage(r.roleCoverage); |
| describeStreamRoles | function | 659 | yes | export function describeStreamRoles(doc) { |
| parts | const | 661 | no | const parts = STREAM_ROLES.filter((r) =&gt; doc.totals.byRole[r] &gt; 0).map((r) =&gt; `${doc.totals.byRole[r]} ${r}`); |
| w | const | 662 | no | const w = Number(doc.totals.withheld) &gt; 0 ? ` (${doc.totals.withheld} specific role withheld: incomplete inspection)` : &#39;&#39;; |
| COVERAGE_VERSION | const | 676 | yes | export const COVERAGE_VERSION = 1; |
| COVERAGE_SOURCES | const | 677 | no | const COVERAGE_SOURCES = [&#39;events&#39;, &#39;assembled-only&#39;, &#39;summary-only&#39;]; |
| OPAQUE_DECODERS | const | 678 | no | const OPAQUE_DECODERS = new Set([&#39;binary&#39;, &#39;raw&#39;, &#39;protobuf&#39;, &#39;grpc&#39;, &#39;length-prefixed&#39;]); |
| CONTENT_ROLES | const | 679 | no | const CONTENT_ROLES = new Set([&#39;chat-reply&#39;, &#39;history-load&#39;]); |
| nn | function | 680 | no | const nn = (v) =&gt; (Number.isFinite(v) &amp;&amp; v &gt;= 0 ? Math.floor(v) : 0); |
| BINARY_FRAME_KEYS | const | 682 | no | const BINARY_FRAME_KEYS = [&#39;analyzed&#39;, &#39;corrupt&#39;, &#39;budget&#39;, &#39;incomplete&#39;, &#39;invalid&#39;, &#39;oversize&#39;, &#39;beyondCap&#39;]; |
| binaryCoverage | function | 693 | no | function binaryCoverage(events, docs, summary) { |
| supported | variable | 694 | no | let supported = 0; let unsupported = 0; let last = null; |
| versions | const | 695 | no | const versions = new Set(); |
| pf | const | 697 | no | const pf = isObj(e) ? e.protoFeatures : null; |
| frames | const | 703 | no | const frames = Object.fromEntries(BINARY_FRAME_KEYS.map((k) =&gt; [k, nn(last?.cumulative?.[k])])); |
| decoderOpaque | const | 704 | no | const decoderOpaque = !docs.length &amp;&amp; OPAQUE_DECODERS.has(summary.decoder); |
| kind | variable | 705 | no | let kind = null; |
| notAnalyzed | const | 708 | no | const notAnalyzed = BINARY_FRAME_KEYS.filter((k) =&gt; k !== &#39;analyzed&#39;).reduce((n, k) =&gt; n + frames[k], 0); |
| inspectionTruncated | const | 709 | no | const inspectionTruncated = last?.integrity?.inspectionTruncated === true; |
| complete | const | 710 | no | const complete = kind === null ? null : (supported &gt; 0 &amp;&amp; unsupported === 0 &amp;&amp; notAnalyzed === 0 &amp;&amp; !inspectionTruncated &amp;&amp; last.integrity.incomplete !== true); |
| baseCoverage | function | 714 | no | function baseCoverage({ summary, events, docs, assembled, map, skippedEvents, growthDocsCut, structureDocsCut, recordPoolCapped, incomplete }) { |
| total | const | 715 | no | const total = Number(summary.events); |
| assembledUsed | const | 716 | no | const assembledUsed = !!(assembled &amp;&amp; assembled.revisions &gt; 0); |
| anyContentCut | function | 743 | no | function anyContentCut(c) { |
| relevantCut | function | 746 | no | const relevantCut = (c, role) =&gt; anyContentCut(c) \|\| (c.recordPoolCapped &amp;&amp; !CONTENT_ROLES.has(role)); |
| cleanCoverage | function | 749 | yes | export function cleanCoverage(c) { |
| b | const | 751 | no | const b = isObj(c.binary) ? c.binary : {}; |
| SPECIFIC_ROLE_SET | const | 780 | no | const SPECIFIC_ROLE_SET = new Set(STREAM_ROLES.filter((r) =&gt; r !== &#39;unknown&#39;)); |
| classifyStreamRole | function | 782 | yes | export function classifyStreamRole(stream, opts = {}) { |
| o | const | 783 | no | const o = resolveClassifierOptions(opts); |
| incomplete | const | 785 | no | const incomplete = incompleteCapture(summary); |
| heartbeats | const | 787 | no | const heartbeats = events.length === 0 ? Math.floor(Number(summary.heartbeats) \|\| 0) : eventHeartbeats; |
| ctx | const | 788 | no | const ctx = { |
| counts | const | 795 | no | const counts = [&#39;bytes&#39;, &#39;chunks&#39;, &#39;frames&#39;, &#39;events&#39;, &#39;esMessages&#39;].reduce((n, k) =&gt; n + (Number(summary[k]) &gt; 0 ? Number(summary[k]) : 0), 0); |
| hasContentSignal | const | 796 | no | const hasContentSignal = events.length &gt; 0 \|\| (assembled?.revisions &gt; 0) \|\| mappedTextComponents(map) &gt; 0; |
| coverage | const | 798 | no | const coverage = baseCoverage({ summary, events, docs, assembled, map, skippedEvents, growthDocsCut: 0, structureDocsCut: 0, recordPoolCapped: false, incomplete }); |
| growth | const | 802 | no | const growth = growthFacts(docs, assembled, map, o); |
| a | const | 803 | no | const a = analyze(docs, assembled?.doc, o); |
| smallFlat | const | 804 | no | const smallFlat = docs.filter(isSmallFlat).length; |
| telemetry | const | 805 | no | const telemetry = detectTelemetry(a); |
| candidates | const | 806 | no | const candidates = [ |
| content | const | 819 | no | const content = candidates.filter((c) =&gt; (c.role === &#39;chat-reply&#39; \|\| c.role === &#39;history-load&#39;) &amp;&amp; c.score &gt;= 2); |
| qualified | function | 820 | no | const qualified = (content.length ? content : candidates.filter((c) =&gt; c.score &gt;= 2)).sort((x, y) =&gt; y.score - x.score); |
| coverage | const | 821 | no | const coverage = baseCoverage({ summary, events, docs, assembled, map, skippedEvents, growthDocsCut: growth.truncatedDocs, structureDocsCut: a.structureDocsCut, recordPoolCapped: a.recordPoolCapped, … |
| classifierCut | const | 827 | no | const classifierCut = skippedEvents &gt; 0 \|\| growth.truncatedDocs &gt; 0 \|\| a.structureDocsCut &gt; 0 \|\| a.recordPoolCapped; |
| truncated | const | 828 | no | const truncated = anyContentCut(coverage) \|\| coverage.recordPoolCapped; // any cut at all, for the unknown cases |
| flags | const | 829 | no | const flags = [ |
| bin | const | 835 | no | const bin = coverage.binary; |
| binaryNotAnalyzed | const | 836 | no | const binaryNotAnalyzed = BINARY_FRAME_KEYS.filter((k) =&gt; k !== &#39;analyzed&#39;).reduce((n, k) =&gt; n + bin.frames[k], 0) + bin.unsupportedEvents; |
| binaryFeats | const | 837 | no | const binaryFeats = bin.kind === null ? [] : [feat(&#39;binary_structural_frames&#39;, bin.frames.analyzed), feat(&#39;binary_incomplete_frames&#39;, binaryNotAnalyzed)]; |
| binaryCut | const | 838 | no | const binaryCut = bin.kind !== null &amp;&amp; bin.complete === false; |
| base | const | 839 | no | const base = [...(ctx.jsonEvents &gt; 0 ? [feat(&#39;json_events&#39;, ctx.jsonEvents)] : []), ...binaryFeats]; |
| weak | const | 842 | no | const weak = candidates.filter((c) =&gt; c.score &gt;= 1); |
| top | const | 850 | no | const top = qualified[0]; |
| confidence | variable | 858 | no | let confidence = LEVEL_BY_SCORE[top.score]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../decode/proto-features.mjs | import | 47 | [studio/src/decode/proto-features.mjs](../decode/proto-features.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/categorization-scoreboard.mjs](../../scripts/categorization-scoreboard.mjs.md) | ../src/replay/stream-role.mjs |
| [studio/src/replay/derive.mjs](./derive.mjs.md) | ./stream-role.mjs |
| [studio/src/replay/reducer.mjs](./reducer.mjs.md) | ./stream-role.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Stream role classifier: what is this response/stream FOR (chat reply, history load, config, ...).
// Pure and offline: no I/O, no clock, no randomness, never mutates its input. Not wired into the
// reducer, derive or any transport label (a later lane integrates it).
//
//   classifyStreamRole(stream, opts?) -> { role, confidence, evidence }
//
// INPUT (all optional; each is exactly what the product already produces):
//   stream = {
//     summary:   one row of StreamReducer.summary().streams (mime, resourceType, method, status_code,
//                kind, bytes, chunks, frames, events, esMessages, heartbeats, status, coverage, ...)
//     events:    StreamReducer.eventsOf(sid), the decoded L2 events ({ json, jsonNested, heartbeat,
//                type, dir, ... }). Only structure is read; payload values are never copied out.
//     assembled: StreamReducer.assembled(sid) -> { doc, revisions, blocks, ... }
//     map:       applyStreamMap(map, events) result, or a STREAM_COMPONENTS stream entry
//                ({ components: [{ component, text | textLength }], stats })
//   }
//   A bare summary row (no events/assembled/map/summary key) is also accepted.
//
// OUTPUT
//   role        one of STREAM_ROLES. 'unknown' is the default and the answer to any ambiguity.
//   confidence  'none' (unknown only) | 'low' | 'medium' | 'high'. A HEURISTIC ordinal: it counts how
//               many kinds of structural signal are present. The kinds are all derived from the same
//               events (a stream map and the delta assembler read the very same payloads), so they are
//               NOT statistically independent and the level is not calibrated or a probability.
//   evidence    [{ feature, count }] in EVIDENCE_FEATURES order. feature is an enum name, count a
//               positive integer. No payload text, keys, ids, URLs or credential bytes appear here.
//
// PRINCIPLES
//   * Value types and structure decide the role. URL, endpoint and key names are never evidence by
//     themselves; neither are chunk count, framing (SSE/NDJSON/WS) or a null/absent error key.
//   * Masking, redaction counts and credential-SHAPED strings (JWT-like, opaque, starred) are capture
//     policy or incidental values, not endpoint purpose. They are weak hints at most: auth needs a
//     typed token-exchange response structure.
//   * Incremental text proves only that text grows (editor, log, notification, chat). chat-reply also
//     needs chat-specific structure: a mapped message component or a typed assistant role frame.
//   * A specific role needs score >= 2 (see each detector). Score-1 hints are reported as
//     weak_evidence_only and the role stays unknown. Two different roles at score >= 2 conflict:
//     unknown.
//   * Inspection is bounded (opts, and the reducer's event window). inspection_truncated is reported
//     whenever any cap was hit. A specific role whose verdict could be contradicted by the unexamined part
//     (omitted / skipped events, growth or structure scan cuts; the 500-record pool only for non-content
//     roles) is WITHHELD: role unknown, evidence withheld_for_incomplete_inspection, the candidate kept in
//     result.coverage.withheldRole. result.coverage separates the causes (see baseCoverage below).

// Bump when classification behaviour changes: persisted STREAM_ROLES artifacts carry it, and a consumer
// that finds an older (or missing) version must re-derive instead of reusing the artifact.
import { PROTO_FEATURES_SCHEMA, PROTO_FEATURES_VERSION } from '../decode/proto-features.mjs';

// v2: a specific role is WITHHELD (role unknown, coverage.withheldRole set) when an inspection cap or
//     omitted events could have hidden contradictory content; results carry a `coverage` object.
// v3: coverage.binary consumes the decoder's compact ev.protoFeatures snapshots (contract constants shared
//     with src/decode/proto-features.mjs): structural / opaque, complete or not. Never a role.
export const STREAM_ROLE_CLASSIFIER_VERSION = 3;
export const STREAM_ROLES_SCHEMA = 'capture-studio.stream-roles/3';
export const STREAM_ROLES_CONFIDENCE_SCALE = 'heuristic-ordinal (none|low|medium|high); uncalibrated, not a probability; signals derive from the same events and are not independent';

export const STREAM_ROLES = Object.freeze(['chat-reply', 'history-load', 'config', 'telemetry', 'push-presence', 'asset', 'auth', 'unknown']);
export const CONFIDENCE_LEVELS = Object.freeze(['none', 'low', 'medium', 'high']);
export const EVIDENCE_FEATURES = Object.freeze([
  // verdict / coverage markers
  'empty_stream', 'no_structural_evidence', 'weak_evidence_only', 'conflicting_role_evidence', 'incomplete_capture', 'inspection_truncated', 'withheld_for_incomplete_inspection',
  // shared context
  'json_events', 'heartbeat_events',
  // reply: text growth, then chat-specific structure
  'delta_growth_targets', 'delta_growth_steps', 'mapped_text_components', 'assembled_text_blocks',
  'mapped_message_components', 'assistant_role_frames',
  // history
  'message_entries', 'message_roles_distinct',
  // config
  'descriptor_array_entries', 'boolean_leaves',
  // telemetry
  'numeric_leaves', 'timestamp_values', 'repeated_record_shape',
  // presence
  'small_flat_payloads',
  // auth: structure first, then weak hints
  'token_exchange_structure', 'token_exchange_request', 'credential_shaped_values', 'masked_credential_values', 'masked_credential_spans',
  // asset
  'asset_media_type', 'asset_resource_type', 'non_json_body',
  // binary structure (decoder feature snapshots): context only, never a role
  'binary_structural_frames', 'binary_incomplete_frames',
```

_First 80 of 864 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
