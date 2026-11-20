# File: studio/src/studio/ui/world-view.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/world-view.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 256189 B |
| Lines | 4385 |
| Hash | e2207e45584d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORLD_API | const | 11 | yes | export const WORLD_API = &#39;/api/v1/world&#39;; |
| AGENT_API | const | 12 | yes | export const AGENT_API = &#39;/api/v1/personal-agent&#39;; |
| PERSONAL_APPS_API | const | 13 | yes | export const PERSONAL_APPS_API = &#39;/api/v1/personal-apps&#39;; |
| CONVERSATIONS_API | const | 14 | no | const CONVERSATIONS_API = &#39;/api/v1/conversations&#39;; // read-only stored list (list_conversations); never a send |
| PAGE_LIMIT | const | 15 | yes | export const PAGE_LIMIT = 50; |
| VIEWS | const | 16 | yes | export const VIEWS = Object.freeze([&#39;conversations&#39;, &#39;projects&#39;, &#39;notes&#39;]); |
| FIND_KINDS | const | 17 | yes | export const FIND_KINDS = Object.freeze([&#39;message&#39;, &#39;project&#39;, &#39;note&#39;, &#39;task&#39;, &#39;app-note&#39;, &#39;source-reference&#39;, &#39;selection&#39;]); |
| FIND_LABELS | const | 18 | no | const FIND_LABELS = { message: &#39;Messages&#39;, project: &#39;Projects&#39;, note: &#39;Notes&#39;, task: &#39;Tasks&#39;, &#39;app-note&#39;: &#39;App notes&#39;, &#39;source-reference&#39;: &#39;Local objects&#39;, selection: &#39;Selections&#39; }; |
| SHELL_VIEWS | const | 19 | no | const SHELL_VIEWS = new Set([&#39;capture&#39;, &#39;home&#39;, &#39;agent&#39;, &#39;builder&#39;, &#39;settings&#39;, &#39;find&#39;, &#39;transfer&#39;, &#39;relations&#39;, &#39;workspace&#39;, &#39;compose&#39;, ...VIEWS]); |
| AGENT_TRANSITIONS | const | 20 | yes | export const AGENT_TRANSITIONS = Object.freeze({ queued: [&#39;active&#39;,&#39;blocked&#39;,&#39;cancelled&#39;], active: [&#39;blocked&#39;,&#39;completed&#39;,&#39;cancelled&#39;], blocked: [&#39;active&#39;,&#39;cancelled&#39;], completed: [], cancelled: [] }… |
| STANDARD_RELATION_BASIS | const | 21 | no | const STANDARD_RELATION_BASIS = &#39;local association; not native equality&#39;; |
| EXPORT_MODE_LABEL | const | 22 | no | const EXPORT_MODE_LABEL = { references: &#39;References only — no message text&#39;, transcript: &#39;Transcript — saved message text and simple formatting&#39;, &#39;full-saved&#39;: &#39;Full saved — every recorded block&#39; }; |
| EXPORT_OMIT_LABEL | const | 23 | no | const EXPORT_OMIT_LABEL = { &#39;reasoning-blocks-excluded&#39;: &#39;Saved reasoning blocks left out&#39;, &#39;tool-activity-blocks-excluded&#39;: &#39;Tool and status activity blocks left out&#39;, &#39;non-transcript-blocks-exclude… |
| ID_RE | const | 24 | no | const ID_RE = { conversations: /^c-[a-z0-9-]{1,60}$/, projects: /^p-[a-z0-9-]{1,60}$/, notes: /^n-[a-z0-9-]{1,60}$/ }; |
| clip | function | 26 | no | const clip = (s, n) =&gt; (s.length &gt; n ? s.slice(0, n) + &#39;…&#39; : s); |
| labelize | function | 28 | yes | export function labelize(key) { |
| spaced | const | 29 | no | const spaced = String(key ?? &#39;&#39;).replace(/[_-]+/g, &#39; &#39;).replace(/([a-z0-9])([A-Z])/g, &#39;$1 $2&#39;).trim(); |
| formatMeta | function | 34 | yes | export function formatMeta(value) { |
| text | const | 39 | no | const text = JSON.stringify(value); |
| integerOrNull | function | 44 | no | function integerOrNull(value) { return Number.isInteger(value) ? value : null; } |
| problemText | function | 46 | yes | export function problemText(data) { |
| msg | const | 47 | no | const msg = typeof data?.message === &#39;string&#39; &amp;&amp; data.message ? data.message |
| safeHttp | function | 52 | yes | export function safeHttp(value) { |
| url | const | 54 | no | const url = new URL(String(value ?? &#39;&#39;).trim()); |
| roleLabel | function | 59 | yes | export function roleLabel(role) { |
| redactionNote | function | 68 | yes | export function redactionNote(redactions) { |
| coverageView | function | 75 | yes | export function coverageView(coverage) { |
| c | const | 76 | no | const c = coverage &amp;&amp; typeof coverage === &#39;object&#39; ? coverage : {}; |
| state | const | 77 | no | const state = typeof c.state === &#39;string&#39; &amp;&amp; c.state ? c.state : &#39;unknown&#39;; |
| labels | const | 78 | no | const labels = { |
| chips | const | 85 | no | const chips = [labels[state] ?? [`Coverage: ${state}`, &#39;t-warn&#39;]]; |
| full | const | 86 | no | const full = c.fullNativeThread; |
| rich | const | 90 | no | const rich = c.richContent; |
| known | const | 98 | no | const known = new Set([&#39;state&#39;, &#39;fullNativeThread&#39;, &#39;richContent&#39;, &#39;reason&#39;]); |
| extra | const | 99 | no | const extra = []; |
| sentence | const | 107 | no | const sentence = state === &#39;saved-observation&#39; |
| namedFact | function | 121 | no | function namedFact(label, node) { |
| value | const | 123 | no | const value = node.value == null \|\| node.value === &#39;&#39; ? &#39;not recorded&#39; : formatMeta(node.value); |
| state | const | 124 | no | const state = typeof node.state === &#39;string&#39; &amp;&amp; node.state ? node.state : &#39;unknown&#39;; |
| basis | const | 125 | no | const basis = typeof node.basis === &#39;string&#39; &amp;&amp; node.basis ? ` Basis: ${node.basis}.` : &#39;&#39;; |
| identityRows | function | 129 | yes | export function identityRows(identity) { |
| item | const | 130 | no | const item = identity &amp;&amp; typeof identity === &#39;object&#39; ? identity : {}; |
| state | const | 131 | no | const state = typeof item.state === &#39;string&#39; &amp;&amp; item.state ? item.state : &#39;unknown&#39;; |
| rows | const | 132 | no | const rows = [ |
| threadState | const | 140 | no | const threadState = typeof item.thread.state === &#39;string&#39; &amp;&amp; item.thread.state ? item.thread.state : &#39;unknown&#39;; |
| known | const | 153 | no | const known = new Set([&#39;state&#39;, &#39;nativeThreadId&#39;, &#39;accountId&#39;, &#39;provider&#39;, &#39;origin&#39;, &#39;thread&#39;, &#39;account&#39;, &#39;qualification&#39;, &#39;observedAt&#39;]); |
| sourceRows | function | 160 | yes | export function sourceRows(source) { |
| item | const | 161 | no | const item = source &amp;&amp; typeof source === &#39;object&#39; ? source : {}; |
| kind | const | 162 | no | const kind = item.kind === &#39;saved-session&#39; ? &#39;Saved session on this computer&#39; |
| rows | const | 164 | no | const rows = [ |
| known | const | 169 | no | const known = new Set([&#39;kind&#39;, &#39;sessionId&#39;, &#39;providerUrl&#39;]); |
| messageSourceRows | function | 174 | yes | export function messageSourceRows(source) { |
| item | const | 175 | no | const item = source &amp;&amp; typeof source === &#39;object&#39; ? source : {}; |
| rows | const | 176 | no | const rows = [ |
| known | const | 182 | no | const known = new Set([&#39;sessionId&#39;, &#39;key&#39;, &#39;index&#39;, &#39;observedTurnId&#39;]); |
| fence | function | 187 | no | function fence(lang, text) { |
| body | const | 188 | no | const body = String(text); |
| runs | const | 189 | no | const runs = body.match(/`+/g) ?? []; |
| width | const | 190 | no | const width = Math.max(3, ...runs.map((run) =&gt; run.length + 1)); |
| bar | const | 191 | no | const bar = &#39;`&#39;.repeat(Number.isFinite(width) ? width : 3); |
| safeLang | const | 192 | no | const safeLang = typeof lang === &#39;string&#39; &amp;&amp; /^[\\w+#.-]{1,32}$/.test(lang) ? lang : &#39;&#39;; |
| tableMarkdown | function | 196 | no | function tableMarkdown(block) { |
| head | const | 197 | no | const head = Array.isArray(block.headers) ? block.headers : Array.isArray(block.head) ? block.head : null; |
| rows | const | 198 | no | const rows = Array.isArray(block.rows) ? block.rows : null; |
| cell | function | 200 | no | const cell = (value) =&gt; String(value ?? &#39;&#39;).replace(/\\\|/g, &#39;\\\\\|&#39;).replace(/\\r?\\n/g, &#39; &#39;).trim(); |
| heads | const | 201 | no | const heads = head.map(cell); |
| lines | const | 202 | no | const lines = [ |
| cells | const | 206 | no | const cells = Array.isArray(row) ? row : []; |
| unknownPart | function | 213 | no | function unknownPart(type) { |
| label | const | 214 | no | const label = typeof type === &#39;string&#39; &amp;&amp; /^[a-z0-9][a-z0-9 +_.:-]{0,60}$/i.test(type) ? type : &#39;unknown&#39;; |
| savedInlineLinks | function | 219 | yes | export function savedInlineLinks(block) { |
| seen | const | 221 | no | const seen = new Set(), links = []; |
| href | const | 224 | no | const href = safeHttp(part.href); |
| label | const | 225 | no | const label = typeof part.text === &#39;string&#39; &amp;&amp; part.text.trim() ? clip(part.text.trim(), 120) : &#39;Recorded link&#39;; |
| key | const | 226 | no | const key = JSON.stringify([part.t, label, href]); |
| blockToMarkdown | function | 234 | no | function blockToMarkdown(block, lines, unknowns, depth) { |
| text | const | 237 | no | const text = typeof block.text === &#39;string&#39; ? block.text : null; |
| level | const | 244 | no | const level = Number.isInteger(block.level) ? Math.min(6, Math.max(1, block.level)) : 2; |
| markdown | const | 253 | no | const markdown = tableMarkdown(block); |
| items | const | 258 | no | const items = Array.isArray(block.items) ? block.items : null; |
| start | const | 260 | no | const start = Number.isInteger(block.start) &amp;&amp; block.start &gt; 0 ? block.start : 1; |
| nested | const | 262 | no | const nested = []; |
| body | const | 266 | no | const body = nested.join(&#39;\\n&#39;).trim(); |
| marker | const | 268 | no | const marker = block.ordered ? `${start + index}. ` : &#39;- &#39;; |
| parts | const | 269 | no | const parts = body.split(&#39;\\n&#39;); |
| nested | const | 277 | no | const nested = []; |
| children | const | 280 | no | const children = Array.isArray(block.blocks) ? block.blocks : []; |
| body | const | 283 | no | const body = nested.join(&#39;\\n&#39;).trim(); |
| alt | const | 294 | no | const alt = typeof block.alt === &#39;string&#39; &amp;&amp; block.alt ? block.alt : &#39;Image&#39;; |
| href | const | 295 | no | const href = safeHttp(block.src); |
| href | const | 301 | no | const href = safeHttp(block.href); |
| name | const | 302 | no | const name = typeof block.name === &#39;string&#39; &amp;&amp; block.name ? clip(block.name, 80) : &#39;File&#39;; |
| kind | const | 308 | no | const kind = block.kind === &#39;audio&#39; \|\| block.kind === &#39;video&#39; ? block.kind : &#39;media&#39;; |
| label | const | 313 | no | const label = labelledPart(type); |
| recorded | const | 316 | no | const recorded = typeof text === &#39;string&#39; ? text : (typeof block.summary === &#39;string&#39; ? block.summary : null); |
| nested | const | 318 | no | const nested = Array.isArray(block.blocks) ? block.blocks : Array.isArray(block.parts) ? block.parts : []; |
| labelledPart | function | 329 | no | function labelledPart(type) { |
| key | const | 330 | no | const key = String(type).toLowerCase().replace(/[_\\s]+/g, &#39;-&#39;); |
| turnPlan | function | 338 | yes | export function turnPlan(message) { |
| blocks | const | 339 | no | const blocks = Array.isArray(message?.blocks) ? message.blocks : []; |
| lines | const | 340 | no | const lines = []; |
| unknowns | const | 341 | no | const unknowns = []; |
| markdown | variable | 343 | no | let markdown = lines.join(&#39;\\n&#39;).trim(); |
| note | variable | 344 | no | let note = &#39;&#39;; |
| planFrames | function | 360 | yes | export function planFrames(message) { |
| blocks | const | 361 | no | const blocks = Array.isArray(message?.blocks) ? message.blocks : []; |
| lines | const | 363 | no | const lines = []; |
| unknowns | const | 364 | no | const unknowns = []; |
| searchStatusText | function | 370 | yes | export function searchStatusText({ shown = 0, total = null, coverage = null } = {}) { |
| count | const | 371 | no | const count = Number.isInteger(total) ? `${shown} of ${total} matches in this scan` : `${shown} matches in this scan`; |
| incomplete | const | 372 | no | const incomplete = !coverage \|\| coverage.complete === false \|\| coverage.truncated === true; |
| searchCoverageLines | function | 376 | yes | export function searchCoverageLines(coverage) { |
| lines | const | 380 | no | const lines = []; |
| absent | const | 386 | no | const absent = Number.isInteger(coverage.absent?.conversations) ? coverage.absent.conversations : 0; |
| failures | const | 388 | no | const failures = Array.isArray(coverage.failures) ? coverage.failures : []; |
| message | const | 392 | no | const message = typeof failure?.message === &#39;string&#39; &amp;&amp; failure.message ? failure.message : failure?.code; |
| IMPORT_BYTE_CAP | const | 400 | yes | export const IMPORT_BYTE_CAP = 8 * 1024 * 1024; |
| isExportBundle | function | 402 | yes | export function isExportBundle(data) { |
| validWorldId | function | 406 | yes | export function validWorldId(id) { |
| custodyChip | function | 412 | yes | export function custodyChip(item) { |
| custody | const | 413 | no | const custody = item?.custody; |
| coverage | const | 414 | no | const coverage = item?.coverage?.state ?? item?.coverageState?.state ?? item?.coverageState; |
| readerProvenanceChip | function | 422 | yes | export function readerProvenanceChip(node, record) { |
| chip | const | 426 | no | const chip = provenanceChip(candidate); |
| referenceReaderRows | function | 438 | yes | export function referenceReaderRows(item) { |
| source | const | 439 | no | const source = item?.source &amp;&amp; typeof item.source === &#39;object&#39; ? item.source : null; |
| rows | const | 440 | no | const rows = []; |
| importedFromLines | function | 451 | yes | export function importedFromLines(importedFrom) { |
| digest | const | 453 | no | const digest = typeof importedFrom.digest === &#39;string&#39; ? importedFrom.digest : &#39;&#39;; |
| lines | const | 454 | no | const lines = []; |
| custodyCounts | function | 460 | yes | export function custodyCounts(records) { |
| counts | const | 461 | no | const counts = {}; |
| key | const | 463 | no | const key = typeof record?.custody === &#39;string&#39; &amp;&amp; record.custody ? record.custody : &#39;unknown&#39;; |
| checkReady | function | 469 | yes | export function checkReady(report) { |
| restoreSummary | function | 473 | yes | export function restoreSummary(report) { |
| failed | const | 475 | no | const failed = Array.isArray(report.failed) ? report.failed.length : 0; |
| applied | const | 476 | no | const applied = Array.isArray(report.applied) ? report.applied.length : 0; |
| skipped | const | 477 | no | const skipped = Array.isArray(report.skipped) ? report.skipped.length : 0; |
| pending | const | 478 | no | const pending = Array.isArray(report.pending) ? report.pending.length : 0; |
| provenanceChip | function | 488 | yes | export function provenanceChip(node) { |
| provenance | const | 490 | no | const provenance = node?.provenance; |
| custody | const | 491 | no | const custody = node?.custody; |
| relationGroupRank | function | 498 | no | function relationGroupRank(kind) { |
| relationLabel | function | 501 | no | function relationLabel(kind, outgoing) { |
| safe | const | 505 | no | const safe = /^[a-z0-9][a-z0-9_-]{0,39}$/i.test(kind) ? kind : &#39;unknown&#39;; |
| relationGroups | function | 509 | yes | export function relationGroups(focusId, map) { |
| nodes | const | 510 | no | const nodes = new Map((Array.isArray(map?.nodes) ? map.nodes : []).filter((node) =&gt; node &amp;&amp; typeof node.id === &#39;string&#39;).map((node) =&gt; [node.id, node])); |
| order | const | 511 | no | const order = [], byKey = new Map(); |
| outgoing | const | 514 | no | const outgoing = edge.from === focusId; |
| otherId | const | 515 | no | const otherId = outgoing ? edge.to : edge.from; |
| kind | const | 517 | no | const kind = typeof edge.kind === &#39;string&#39; &amp;&amp; edge.kind ? edge.kind : &#39;unknown&#39;; |
| key | const | 518 | no | const key = `${kind}:${outgoing ? &#39;out&#39; : &#39;in&#39;}`; |
| group | variable | 519 | no | let group = byKey.get(key); |
| relationShown | function | 527 | yes | export function relationShown(groups) { |
| relationStatus | function | 531 | yes | export function relationStatus(map, shown) { |
| count | const | 532 | no | const count = Number.isInteger(shown) ? shown : 0; |
| availabilityLabel | function | 538 | yes | export function availabilityLabel(hit) { |
| value | const | 539 | no | const value = typeof hit?.availability === &#39;string&#39; &amp;&amp; hit.availability ? hit.availability : &#39;&#39;; |
| reason | const | 541 | no | const reason = typeof hit.availabilityReason === &#39;string&#39; &amp;&amp; hit.availabilityReason ? ` (${hit.availabilityReason})` : &#39;&#39;; |
| readSearch | function | 548 | yes | export function readSearch(data) { |
| page | const | 549 | no | const page = readList(data); |
| readList | function | 554 | yes | export function readList(data) { |
| appendPage | function | 567 | yes | export function appendPage(previous, page) { |
| items | const | 568 | no | const items = Array.isArray(previous) ? previous.slice() : []; |
| seen | const | 569 | no | const seen = new Set(items.map((item) =&gt; item?.id)); |
| idList | function | 578 | no | const idList = (value) =&gt; (Array.isArray(value) ? value.filter((id) =&gt; typeof id === &#39;string&#39;) : []); |
| draftFromSaved | function | 580 | yes | export function draftFromSaved(item) { |
| saved | const | 581 | no | const saved = item &amp;&amp; typeof item === &#39;object&#39; ? item : {}; |
| sameDraft | function | 593 | yes | export function sameDraft(left, right) { |
| sameList | function | 597 | no | const sameList = (a = [], b = []) =&gt; a.length === b.length &amp;&amp; a.every((id, index) =&gt; id === b[index]); |
| withId | function | 602 | yes | export function withId(ids, id) { |
| current | const | 603 | no | const current = Array.isArray(ids) ? ids.filter((item) =&gt; typeof item === &#39;string&#39;) : []; |
| withoutId | function | 608 | yes | export function withoutId(ids, id) { |
| projectCreateBody | function | 612 | yes | export function projectCreateBody(title) { return { title, expectedVersion: null }; } |
| noteCreateBody | function | 613 | yes | export function noteCreateBody(title, body) { return { title, body, expectedVersion: null }; } |
| projectPutBody | function | 614 | yes | export function projectPutBody(draft) { |
| notePutBody | function | 621 | yes | export function notePutBody(draft) { |
| conflictText | function | 625 | no | function conflictText(data) { |
| expected | const | 626 | no | const expected = integerOrNull(data?.expected); |
| actual | const | 627 | no | const actual = integerOrNull(data?.actual); |
| versions | const | 628 | no | const versions = expected != null &amp;&amp; actual != null ? ` This screen had version ${expected}; the saved copy is version ${actual}.` : &#39;&#39;; |
| interpretWrite | function | 633 | yes | export function interpretWrite(result, draft) { |
| status | const | 634 | no | const status = Number(result?.status) \|\| 0; |
| data | const | 635 | no | const data = result?.data; |
| conflict | const | 642 | no | const conflict = status === 409 \|\| data?.code === &#39;CAS_VERSION_CONFLICT&#39;; |
| message | const | 643 | no | const message = conflict ? conflictText(data) |
| interpretCreate | function | 650 | yes | export function interpretCreate(result, form) { |
| written | const | 651 | no | const written = interpretWrite(result, form); |
| absorbServer | function | 656 | yes | export function absorbServer(local, item) { |
| remoteDraft | const | 657 | no | const remoteDraft = draftFromSaved(item); |
| clean | const | 658 | no | const clean = !local \|\| (local.saved &amp;&amp; sameDraft(local.draft, draftFromSaved(local.saved))); |
| blankList | function | 669 | no | function blankList() { return { items: [], total: 0, nextOffset: null, loaded: false, loading: false, error: &#39;&#39; }; } |
| editorFrom | function | 671 | no | function editorFrom(item, notice = &#39;&#39;) { |
| graphProjection | function | 684 | yes | export function graphProjection(map, focusId, maxNodes = 12) { |
| limit | const | 686 | no | const limit = Number.isInteger(maxNodes) ? Math.min(24, Math.max(1, maxNodes)) : 12; |
| unique | const | 687 | no | const unique = new Map(); |
| order | const | 692 | no | const order = [...unique.values()]; |
| focus | const | 693 | no | const focus = order.find((node) =&gt; node.id === focusId) ?? null; |
| ordered | const | 694 | no | const ordered = focus ? [focus, ...order.filter((node) =&gt; node.id !== focusId)] : order; |
| picked | const | 695 | no | const picked = ordered.slice(0, limit); |
| centerId | const | 696 | no | const centerId = picked[0]?.id ?? null; |
| visible | const | 697 | no | const visible = picked.map((node, index) =&gt; { const count = Math.max(1, picked.length - 1); const angle = -Math.PI / 2 + (2 * Math.PI * (index - 1)) / count; return { ...node, |
| count | const | 698 | no | const count = Math.max(1, picked.length - 1); |
| angle | const | 699 | no | const angle = -Math.PI / 2 + (2 * Math.PI * (index - 1)) / count; |
| byId | const | 707 | no | const byId = new Set(visible.map((node) =&gt; node.id)); |
| edges | const | 708 | no | const edges = map.edges.filter((edge) =&gt; edge &amp;&amp; typeof edge.from === &#39;string&#39; &amp;&amp; typeof edge.to === &#39;string&#39; &amp;&amp; byId.has(edge.from) &amp;&amp; byId.has(edge.to) &amp;&amp; edge.from !== edge.to); |
| mountWorldView | function | 717 | yes | export function mountWorldView({ document: doc, root, modes, chat, rich = null, announce = () =&gt; {}, fetchImpl = globalThis.fetch, storage = null } = {}) { |
| attr | function | 719 | no | const attr = (node, name) =&gt; { |
| value | const | 722 | no | const value = node.getAttribute(name); |
| buttons | const | 727 | no | const buttons = typeof modes.querySelectorAll === &#39;function&#39; |
| viewOf | function | 730 | no | const viewOf = (node) =&gt; attr(node, &#39;data-view&#39;); |
| state | const | 732 | no | const state = { |
| exportTicket | variable | 774 | no | let exportTicket = 0; |
| exportAbort | variable | 775 | no | let exportAbort = null; |
| importTicket | variable | 776 | no | let importTicket = 0; |
| importAbort | variable | 777 | no | let importAbort = null; |
| relationsTicket | variable | 778 | no | let relationsTicket = 0; |
| relationsAbort | variable | 779 | no | let relationsAbort = null; |
| workspaceReadTicket | variable | 780 | no | let workspaceReadTicket = 0; |
| workspaceReadAbort | variable | 781 | no | let workspaceReadAbort = null; |
| composeTicket | variable | 782 | no | let composeTicket = 0; |
| composeAbort | variable | 783 | no | let composeAbort = null; |
| composeReadTicket | variable | 784 | no | let composeReadTicket = 0; |
| composeReadAbort | variable | 785 | no | let composeReadAbort = null; |
| composeReadHeadNode | variable | 786 | no | let composeReadHeadNode = null; |
| readerHeadNode | variable | 787 | no | let readerHeadNode = null, readerStatusNode = null, readerBodyNode = null; |
| agentHomeTicket | variable | 789 | no | let agentHomeTicket = 0; |
| agentTicket | variable | 790 | no | let agentTicket = 0; |
| agentInsightTicket | variable | 791 | no | let agentInsightTicket = 0; |
| agentMemorySearchTicket | variable | 792 | no | let agentMemorySearchTicket = 0; |
| searchTicket | variable | 793 | no | let searchTicket = 0; |
| searchAbort | variable | 794 | no | let searchAbort = null; |
| tickets | const | 795 | no | const tickets = { |
| REF_RE | const | 799 | no | const REF_RE = /^[cnpos]-[a-z0-9-]{1,60}$/; |
| SELECTION_RE | const | 800 | no | const SELECTION_RE = /^s-[a-z0-9-]{1,60}$/; |
| itemsNode | variable | 801 | no | let itemsNode = null, moreNode = null, listErrorNode = null, listStatusNode = null, formNoteNode = null, createNode = null, namespaceNode = null; |
| linkConvSelect | variable | 802 | no | let linkConvSelect = null, linkNoteSelect = null, linkMemberSelect = null, linkCommentSelect = null, dirtyNode = null, saveNode = null; |
| framed | variable | 803 | no | let framed = false, listPane = null, detailPane = null; |
| draftFingerprint | function | 805 | no | function draftFingerprint(draft) { |
| setFail | function | 815 | no | function setFail(kind, id, text) { state.errors[kind] = text ? { id, text } : null; } |
| failText | function | 816 | no | function failText(kind, id) { |
| entry | const | 817 | no | const entry = state.errors[kind]; |
| el | function | 820 | no | function el(tag, props = {}, kids = []) { |
| node | const | 821 | no | const node = doc.createElement(tag); |
| on | function | 832 | no | const on = (node, type, fn) =&gt; node.addEventListener(type, fn); |
| storeGet | function | 833 | no | function storeGet(key) { try { return (storage ?? globalThis.sessionStorage).getItem(key); } catch { return null; } } |
| storeSet | function | 834 | no | function storeSet(key, value) { try { (storage ?? globalThis.sessionStorage).setItem(key, value); } catch { /* this tab will simply not remember the view */ } } |
| remember | function | 835 | no | function remember() { |
| call | function | 839 | no | async function call(path, { method = &#39;GET&#39;, body, signal } = {}) { |
| response | const | 841 | no | const response = await fetchImpl(WORLD_API + path, { method, signal, headers: body ? { &#39;content-type&#39;: &#39;application/json&#39; } : undefined, body: body ? JSON.stringify(body) : undefined, }); |
| data | variable | 844 | no | let data = null; |
| agentCall | function | 854 | no | async function agentCall(route, method = &#39;GET&#39;, body = null) { |
| response | const | 856 | no | const response = await fetchImpl(AGENT_API + route, { method, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: body ? { &#39;content-type&#39;: &#39;application/json&#39; } : undefined, body: body ? JSON.stri… |
| data | variable | 861 | no | let data = null; |
| agentError | function | 866 | no | function agentError(result) { |
| loadAgentHomeStatus | function | 873 | no | async function loadAgentHomeStatus() { |
| ticket | const | 874 | no | const ticket = ++agentHomeTicket, home = state.agentHome; |
| result | const | 878 | no | const result = await agentCall(&#39;/status&#39;); |
| agentRefresh | function | 889 | no | async function agentRefresh() { |
| ticket | const | 890 | no | const ticket = ++agentTicket, a = state.agent; |
| status | const | 893 | no | const status = await agentCall(&#39;/status&#39;); |
| work | const | 900 | no | const work = await agentCall(&#39;/work&#39;); |
| memory | const | 904 | no | const memory = await agentCall(&#39;/memory/&#39; + encodeURIComponent(a.tier)); |
| agentWrite | function | 913 | no | async function agentWrite(route, method, body, success, onSuccess = () =&gt; {}) { |
| a | const | 914 | no | const a = state.agent; |
| response | const | 918 | no | const response = await agentCall(route, method, body); |
| agentInspect | function | 937 | no | async function agentInspect(kind) { |
| a | const | 938 | no | const a = state.agent; |
| paths | const | 939 | no | const paths = { |
| ticket | const | 945 | no | const ticket = ++agentInsightTicket; |
| result | const | 948 | no | const result = await agentCall(paths[kind]); |
| searchAgentMemory | function | 955 | no | async function searchAgentMemory() { |
| a | const | 956 | no | const a = state.agent, form = a.memorySearch; |
| ticket | const | 963 | no | const ticket = ++agentMemorySearchTicket; |
| response | const | 967 | no | const response = await agentCall(&#39;/search-memory&#39;, &#39;POST&#39;, { query: form.query.trim(), tier: form.tier, limit: 20 }); |
| applyVisibility | function | 975 | no | function applyVisibility() { |
| world | const | 976 | no | const world = state.view !== &#39;capture&#39;; |
| breadcrumb | const | 987 | no | const breadcrumb = doc.getElementById?.(&#39;vivimViewBreadcrumb&#39;); |
| titles | const | 989 | no | const titles = { |
| ensureFrame | function | 997 | no | function ensureFrame() { |
| grid | const | 1000 | no | const grid = el(&#39;div&#39;, { class: &#39;world-grid&#39;, id: &#39;worldGrid&#39; }); |
| renderHome | function | 1009 | no | function renderHome() { |
| heading | const | 1011 | no | const heading = el(&#39;div&#39;, { class: &#39;vivim-section-head&#39; }, [ el(&#39;span&#39;, { class: &#39;vivim-eyebrow&#39;, text: &#39;YOUR PERSONAL WORLD&#39; }), el(&#39;h2&#39;, { text: &#39;Good to see you. Pick up where you left off.&#39; }), e… |
| cards | const | 1016 | no | const cards = el(&#39;div&#39;, { class: &#39;vivim-overview-grid&#39;, id: &#39;vivimOverview&#39; }); |
| list | const | 1022 | no | const list = state.lists[kind]; |
| count | const | 1023 | no | const count = list.loaded ? String(list.total) : list.loading ? &#39;…&#39; : &#39;—&#39;; |
| card | const | 1024 | no | const card = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;vivim-overview-card&#39; }, [ el(&#39;span&#39;, { class: &#39;vivim-overview-icon&#39;, &#39;aria-hidden&#39;: &#39;true&#39;, text: kind === &#39;conversations&#39; ? &#39;▤&#39; : kind === &#39;projec… |
| agentHome | const | 1033 | no | const agentHome = state.agentHome, agentStatus = agentHome.status; |
| localOpen | const | 1034 | no | const localOpen = agentStatus?.initialized ? [&#39;queued&#39;, &#39;active&#39;, &#39;blocked&#39;] |
| value | const | 1036 | no | const value = agentStatus.work?.byStatus?.[key]; |
| agentCard | const | 1039 | no | const agentCard = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;vivim-overview-card&#39;, id: &#39;vivimAgentHomeCard&#39; }, [ el(&#39;span&#39;, { class: &#39;vivim-overview-icon&#39;, &#39;aria-hidden&#39;: &#39;true&#39;, text: &#39;✦&#39; }), el(&#39;span&#39;,… |
| actions | const | 1055 | no | const actions = el(&#39;div&#39;, { class: &#39;vivim-home-actions&#39; }, [ el(&#39;h3&#39;, { text: &#39;Quick actions&#39; }), ]); |
| action | const | 1062 | no | const action = el(&#39;button&#39;, { type: &#39;button&#39;, text: title }); |
| recent | const | 1066 | no | const recent = el(&#39;section&#39;, { class: &#39;vivim-home-recent&#39; }, [el(&#39;h3&#39;, { text: &#39;Recent saved conversations&#39; })]); |
| recents | const | 1067 | no | const recents = state.lists.conversations; |
| list | const | 1071 | no | const list = el(&#39;ul&#39;, { class: &#39;plain&#39; }); |
| button | const | 1074 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;rowbtn&#39;, text: item.title \|\| item.id }); |
| renderAgent | function | 1089 | no | function renderAgent() { |
| a | const | 1091 | no | const a = state.agent, status = a.status, busy = a.loading \|\| a.busy; |
| head | const | 1092 | no | const head = el(&#39;div&#39;, { class: &#39;vivim-section-head&#39; }, [ el(&#39;span&#39;, { class: &#39;vivim-eyebrow&#39;, text: &#39;OWN YOUR AI&#39; }), el(&#39;h2&#39;, { text: &#39;Your Personal Agent&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;Your … |
| bootstrap | const | 1097 | no | const bootstrap = el(&#39;section&#39;, { class: &#39;vivim-info-card&#39;, id: &#39;worldAgentBootstrap&#39; }, [ el(&#39;h3&#39;, { text: &#39;Local bootstrap&#39; }), ]); |
| start | const | 1110 | no | const start = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAgentStart&#39;, text: status.initialized ? &#39;Resume bootstrap&#39; : &#39;Initialize and bootstrap&#39; }); |
| refresh | const | 1117 | no | const refresh = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAgentRefresh&#39;, text: &#39;Refresh agent&#39; }); |
| notice | const | 1120 | no | const notice = el(&#39;div&#39;, { id: &#39;worldAgentNotice&#39;, role: a.error ? &#39;alert&#39; : &#39;status&#39; }); |
| memory | const | 1123 | no | const memory = el(&#39;section&#39;, { class: &#39;vivim-info-card&#39;, id: &#39;worldAgentMemory&#39; }, [ el(&#39;h3&#39;, { text: &#39;Memory&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;Local and user-authored. Current removal does not er… |
| form | const | 1131 | no | const form = el(&#39;form&#39;, { id: &#39;worldAgentMemoryForm&#39; }); |
| tier | const | 1132 | no | const tier = el(&#39;select&#39;, { &#39;aria-label&#39;: &#39;Memory tier&#39; }); |
| key | const | 1135 | no | const key = el(&#39;input&#39;, { type: &#39;text&#39;, required: true, maxlength: &#39;64&#39;, placeholder: &#39;Memory key&#39;, &#39;aria-label&#39;: &#39;Memory key&#39; }); |
| value | const | 1137 | no | const value = el(&#39;textarea&#39;, { required: true, maxlength: &#39;8000&#39;, rows: &#39;3&#39;, placeholder: &#39;What should your agent remember?&#39;, &#39;aria-label&#39;: &#39;Memory text&#39; }); |
| save | const | 1139 | no | const save = el(&#39;button&#39;, { type: &#39;submit&#39;, text: &#39;Save memory locally&#39; }); save.disabled = busy; |
| existing | const | 1149 | no | const existing = el(&#39;section&#39;, { id: &#39;worldAgentMemoryEntries&#39; }, [ el(&#39;h3&#39;, { text: &#39;Saved &#39; + a.tier + &#39; memory&#39; }), ]); |
| note | const | 1155 | no | const note = el(&#39;article&#39;, { class: &#39;vivim-agent-work-row&#39; }, [ el(&#39;strong&#39;, { text: entry.key }), el(&#39;p&#39;, { class: &#39;note&#39;, text: entry.text }), ]); |
| remove | const | 1159 | no | const remove = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Remove from current memory&#39; }); |
| search | const | 1170 | no | const search = a.memorySearch; |
| searchBox | const | 1171 | no | const searchBox = el(&#39;section&#39;, { id: &#39;worldAgentMemorySearch&#39; }, [ el(&#39;h3&#39;, { text: &#39;Find personal memory&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;Explicit private local search of user-authored memory. … |
| searchForm | const | 1175 | no | const searchForm = el(&#39;form&#39;, { id: &#39;worldAgentMemorySearchForm&#39; }); |
| term | const | 1176 | no | const term = el(&#39;input&#39;, { type: &#39;search&#39;, minlength: &#39;2&#39;, maxlength: &#39;120&#39;, required: true, &#39;aria-label&#39;: &#39;Search local agent memory&#39;, placeholder: &#39;Search your memory notes&#39; }); |
| searchTier | const | 1179 | no | const searchTier = el(&#39;select&#39;, { &#39;aria-label&#39;: &#39;Memory search tier&#39; }); |
| searchButton | const | 1182 | no | const searchButton = el(&#39;button&#39;, { type: &#39;submit&#39;, text: &#39;Search local memory&#39; }); |
| resultArea | const | 1187 | no | const resultArea = el(&#39;div&#39;, { id: &#39;worldAgentMemorySearchResults&#39;, role: &#39;status&#39; }); |
| insights | const | 1203 | no | const insights = el(&#39;section&#39;, { class: &#39;vivim-info-card&#39;, id: &#39;worldAgentInsights&#39; }, [ el(&#39;h3&#39;, { text: &#39;Agent knowledge and continuity&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;Read local evidence on d… |
| button | const | 1212 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAgentInspect_&#39; + kind, text: title }); |
| tasks | const | 1226 | no | const tasks = el(&#39;section&#39;, { class: &#39;vivim-info-card&#39;, id: &#39;worldAgentWork&#39; }, [ el(&#39;h3&#39;, { text: &#39;Your Work&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;User-directed local records, not automated model exe… |
| form | const | 1231 | no | const form = el(&#39;form&#39;, { id: &#39;worldAgentWorkForm&#39; }); |
| title | const | 1232 | no | const title = el(&#39;input&#39;, { type: &#39;text&#39;, required: true, maxlength: &#39;160&#39;, placeholder: &#39;Task title&#39;, &#39;aria-label&#39;: &#39;Work title&#39; }); |
| objective | const | 1234 | no | const objective = el(&#39;textarea&#39;, { required: true, maxlength: &#39;4000&#39;, rows: &#39;3&#39;, placeholder: &#39;Task objective&#39;, &#39;aria-label&#39;: &#39;Work objective&#39; }); |
| queue | const | 1236 | no | const queue = el(&#39;button&#39;, { type: &#39;submit&#39;, text: &#39;Queue local Work&#39; }); queue.disabled = busy; |
| items | const | 1253 | no | const items = a.work?.items ?? []; |
| filters | const | 1254 | no | const filters = [ |
| filter | const | 1259 | no | const filter = el(&#39;select&#39;, { id: &#39;worldAgentWorkFilter&#39;, &#39;aria-label&#39;: &#39;Filter local Work by status&#39; }); |
| selected | const | 1266 | no | const selected = items.filter(item =&gt; a.workFilter === &#39;all&#39; \|\| (a.workFilter === &#39;open&#39; ? [&#39;queued&#39;, &#39;active&#39;, &#39;blocked&#39;].includes(item.status) : item.status === a.workFilter)); |
| row | const | 1276 | no | const row = el(&#39;article&#39;, { class: &#39;vivim-agent-work-row&#39; }, [ el(&#39;strong&#39;, { text: item.title }), el(&#39;p&#39;, { class: &#39;note&#39;, text: item.objective }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;State: &#39; + item.st… |
| canPlan | const | 1282 | no | const canPlan = [&#39;queued&#39;, &#39;active&#39;, &#39;blocked&#39;].includes(item.status); |
| action | const | 1284 | no | const action = el(&#39;textarea&#39;, { rows: &#39;2&#39;, maxlength: &#39;1000&#39;, &#39;aria-label&#39;: &#39;Next action for &#39; + item.title, placeholder: &#39;What is the next local step? No automatic execution.&#39;, }); |
| saveAction | const | 1290 | no | const saveAction = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Save next action&#39; }); |
| trimmed | const | 1293 | no | const trimmed = action.value.trim(); |
| allowed | const | 1304 | no | const allowed = AGENT_TRANSITIONS[item.status] ?? []; |
| next | const | 1306 | no | const next = el(&#39;select&#39;, { &#39;aria-label&#39;: &#39;Next work state&#39; }); |
| note | const | 1309 | no | const note = el(&#39;input&#39;, { type: &#39;text&#39;, maxlength: &#39;2000&#39;, placeholder: &#39;Reason if blocked&#39;, &#39;aria-label&#39;: &#39;Work reason&#39; }); |
| refs | const | 1310 | no | const refs = el(&#39;input&#39;, { type: &#39;text&#39;, maxlength: &#39;1200&#39;, placeholder: &#39;Evidence references if completed&#39;, &#39;aria-label&#39;: &#39;Work evidence&#39; }); |
| update | const | 1311 | no | const update = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Update Work&#39; }); update.disabled = busy; |
| more | const | 1321 | no | const more = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAgentWorkMore&#39;, text: &#39;Show older Work (&#39; + (selected.length - a.workLimit) + &#39; remaining)&#39; }); |
| builderCall | function | 1332 | no | async function builderCall(route, { method = &#39;GET&#39;, body } = {}) { |
| response | const | 1334 | no | const response = await fetchImpl(PERSONAL_APPS_API + route, { method, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: body ? { &#39;content-type&#39;: &#39;application/json&#39; } : undefined, body: body ? J… |
| data | variable | 1339 | no | let data = null; |
| refreshBuilder | function | 1344 | no | async function refreshBuilder() { |
| b | const | 1345 | no | const b = state.builder; |
| result | const | 1349 | no | const result = await builderCall(&#39;&#39;); |
| createBuilderApp | function | 1357 | no | async function createBuilderApp() { |
| b | const | 1358 | no | const b = state.builder; |
| result | const | 1369 | no | const result = await builderCall(&#39;&#39;, { method: &#39;POST&#39;, body: { title: b.title, intent: b.intent, idempotencyKey: b.pendingKey }, }); |
| selectBuilderApp | function | 1385 | no | async function selectBuilderApp(id) { |
| b | const | 1386 | no | const b = state.builder; |
| result | const | 1390 | no | const result = await builderCall(&#39;/&#39; + encodeURIComponent(id)); |
| addBuilderScreen | function | 1400 | no | async function addBuilderScreen() { |
| b | const | 1401 | no | const b = state.builder; |
| result | const | 1405 | no | const result = await builderCall(&#39;/&#39; + encodeURIComponent(b.selected.id) + &#39;/screens&#39;, { method: &#39;POST&#39;, body: { expectedVersion: b.selected.version, kind: b.kind, label: b.label }, }); |
| previewBuilderProposal | function | 1420 | no | async function previewBuilderProposal() { |
| b | const | 1421 | no | const b = state.builder; |
| input | const | 1423 | no | const input = b.proposalText, id = b.selected.id, version = b.selected.version; |
| result | const | 1427 | no | const result = await builderCall(&#39;/&#39; + encodeURIComponent(id) + &#39;/preview-change&#39;, { method: &#39;POST&#39;, body: { proposal: input }, }); |
| loadStoredReplyChoices | function | 1447 | no | async function loadStoredReplyChoices() { |
| b | const | 1448 | no | const b = state.builder; |
| items | variable | 1452 | no | let items = [], error = &#39;&#39;; |
| response | const | 1454 | no | const response = await fetchImpl(CONVERSATIONS_API, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); |
| data | const | 1455 | no | const data = await response.json(); |
| previewProviderReply | function | 1473 | no | async function previewProviderReply(choice) { |
| b | const | 1474 | no | const b = state.builder; |
| id | const | 1476 | no | const id = b.selected.id, version = b.selected.version, input = b.proposalText; |
| result | const | 1480 | no | const result = await builderCall(&#39;/&#39; + encodeURIComponent(id) + &#39;/preview-provider-reply&#39;, { method: &#39;POST&#39;, body: { conversation: choice.conversation, turnId: choice.turnId }, }); |
| data | const | 1484 | no | const data = result.data; |
| AI_ACTIVE | const | 1499 | no | const AI_ACTIVE = [&#39;queued&#39;, &#39;asking&#39;, &#39;waiting-reply&#39;]; |
| AI_SITES | const | 1501 | no | const AI_SITES = [[&#39;chatgpt&#39;, &#39;ChatGPT&#39;], [&#39;claude&#39;, &#39;Claude&#39;], [&#39;zai&#39;, &#39;Z.ai&#39;], [&#39;qwen&#39;, &#39;Qwen&#39;], [&#39;deepseek&#39;, &#39;DeepSeek&#39;], [&#39;gemini&#39;, &#39;Gemini&#39;]]; |
| AI_POLL_MS | const | 1502 | no | const AI_POLL_MS = 2500; |
| aiStopPolling | function | 1503 | no | function aiStopPolling() { |
| ai | const | 1504 | no | const ai = state.builder.ai; |
| aiSchedulePoll | function | 1507 | no | function aiSchedulePoll() { |
| ai | const | 1508 | no | const ai = state.builder.ai; |
| jobId | const | 1511 | no | const jobId = ai.job.id; |
| result | const | 1514 | no | const result = await builderCall(&#39;/ai-design/&#39; + encodeURIComponent(jobId)); |
| next | const | 1516 | no | const next = result.data?.job; |
| changed | const | 1518 | no | const changed = next.state !== ai.job.state \|\| next.waitingOn !== ai.job.waitingOn; |
| loadAiJob | function | 1525 | no | async function loadAiJob() { |
| b | const | 1526 | no | const b = state.builder, ai = b.ai, id = b.selected?.id; |
| result | const | 1529 | no | const result = await builderCall(&#39;/&#39; + encodeURIComponent(id) + &#39;/ai-design&#39;); |
| job | const | 1531 | no | const job = result.status === 200 ? result.data?.job : null; |
| startAiDesign | function | 1536 | no | async function startAiDesign() { |
| b | const | 1537 | no | const b = state.builder, ai = b.ai; |
| body | const | 1541 | no | const body = { site: ai.site }; |
| result | const | 1543 | no | const result = await builderCall(&#39;/&#39; + encodeURIComponent(b.selected.id) + &#39;/ai-design&#39;, { method: &#39;POST&#39;, body }); |
| approveAiDesign | function | 1551 | no | async function approveAiDesign() { |
| b | const | 1552 | no | const b = state.builder, ai = b.ai, job = ai.job; |
| result | const | 1556 | no | const result = await builderCall(&#39;/ai-design/&#39; + encodeURIComponent(job.id) + &#39;/approve&#39;, { method: &#39;POST&#39;, body: {} }); |
| count | const | 1560 | no | const count = result.data.job?.applied?.screens?.length ?? 0; |
| again | const | 1565 | no | const again = await builderCall(&#39;/ai-design/&#39; + encodeURIComponent(job.id)); |
| dismissAiDesign | function | 1571 | no | async function dismissAiDesign() { |
| b | const | 1572 | no | const b = state.builder, ai = b.ai, job = ai.job; |
| renderAiDesign | function | 1579 | no | function renderAiDesign(locked) { |
| b | const | 1580 | no | const b = state.builder, ai = b.ai, job = ai.job; |
| section | const | 1581 | no | const section = el(&#39;section&#39;, { id: &#39;worldBuilderAiDesign&#39;, class: &#39;vivim-info-card&#39; }, [ el(&#39;h3&#39;, { text: &#39;Design with my AI&#39; }), ]); |
| status | const | 1584 | no | const status = el(&#39;div&#39;, { id: &#39;worldBuilderAiStatus&#39;, role: &#39;status&#39;, &#39;aria-live&#39;: &#39;polite&#39; }); |
| siteLabel | const | 1586 | no | const siteLabel = job ? (job.siteLabel \|\| job.site) : &#39;&#39;; |
| cancel | const | 1593 | no | const cancel = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldBuilderAiCancel&#39;, text: &#39;Cancel&#39; }); |
| grid | const | 1599 | no | const grid = el(&#39;div&#39;, { class: &#39;vivim-builder-screen-grid&#39;, id: &#39;worldBuilderAiScreens&#39; }); |
| add | const | 1606 | no | const add = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldBuilderAiApprove&#39;, text: &#39;Add these screens&#39; }); |
| later | const | 1609 | no | const later = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldBuilderAiDismiss&#39;, text: &#39;Not now&#39; }); |
| failed | const | 1617 | no | const failed = job?.state === &#39;failed&#39;; |
| form | const | 1626 | no | const form = el(&#39;form&#39;, { id: &#39;worldBuilderAiForm&#39; }); |
| site | const | 1627 | no | const site = el(&#39;select&#39;, { &#39;aria-label&#39;: &#39;Which AI?&#39; }); |
| wish | const | 1630 | no | const wish = el(&#39;textarea&#39;, { rows: &#39;3&#39;, maxlength: &#39;500&#39;, &#39;aria-label&#39;: &#39;What do you want?&#39;, placeholder: &#39;What do you want? (optional) For example: help me plan study sessions&#39; }); |
| applyBuilderProposal | function | 1643 | no | async function applyBuilderProposal() { |
| b | const | 1644 | no | const b = state.builder, preview = b.proposalPreview, current = b.selected; |
| id | const | 1648 | no | const id = current.id, version = current.version; |
| result | const | 1657 | no | const result = from |
| renderBuilder | function | 1686 | no | function renderBuilder() { |
| b | const | 1688 | no | const b = state.builder, locked = b.busy \|\| b.loading; |
| head | const | 1689 | no | const head = el(&#39;div&#39;, { class: &#39;vivim-section-head&#39; }, [ el(&#39;span&#39;, { class: &#39;vivim-eyebrow&#39;, text: &#39;YOUR PERSONAL APP FACTORY&#39; }), el(&#39;h2&#39;, { text: &#39;Build my VIVIM&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, tex… |
| notice | const | 1694 | no | const notice = el(&#39;div&#39;, { id: &#39;worldBuilderNotice&#39;, role: b.error ? &#39;alert&#39; : &#39;status&#39; }); |
| form | const | 1697 | no | const form = el(&#39;form&#39;, { id: &#39;worldBuilderCreateForm&#39; }); |
| name | const | 1698 | no | const name = el(&#39;input&#39;, { type: &#39;text&#39;, required: true, maxlength: &#39;80&#39;, &#39;aria-label&#39;: &#39;Your app name&#39;, placeholder: &#39;My personal AI world&#39; }); |
| intent | const | 1702 | no | const intent = el(&#39;textarea&#39;, { required: true, rows: &#39;5&#39;, maxlength: &#39;2000&#39;, &#39;aria-label&#39;: &#39;What should your app become?&#39;, placeholder: &#39;I want an assistant that...&#39; }); |
| create | const | 1706 | no | const create = el(&#39;button&#39;, { type: &#39;submit&#39;, text: &#39;Create local starter app&#39; }); |
| library | const | 1710 | no | const library = el(&#39;section&#39;, { id: &#39;worldBuilderLibrary&#39;, class: &#39;vivim-info-card&#39; }, [ el(&#39;h3&#39;, { text: &#39;My app blueprints&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;Saved in the local VIVIM data directo… |
| preview | const | 1723 | no | const preview = el(&#39;section&#39;, { id: &#39;worldBuilderPreview&#39;, class: &#39;vivim-info-card&#39; }, [ el(&#39;h3&#39;, { text: b.selected ? b.selected.title + &#39; — mobile starter&#39; : &#39;Your mobile starter&#39; }), ]); |
| phone | const | 1731 | no | const phone = el(&#39;div&#39;, { class: &#39;vivim-builder-phone&#39;, id: &#39;worldBuilderPhone&#39; }); |
| nav | const | 1733 | no | const nav = el(&#39;div&#39;, { class: &#39;vivim-builder-screen-grid&#39; }); |
| add | const | 1748 | no | const add = el(&#39;form&#39;, { id: &#39;worldBuilderAddScreenForm&#39; }); |
| kind | const | 1749 | no | const kind = el(&#39;select&#39;, { &#39;aria-label&#39;: &#39;New screen kind&#39; }); |
| label | const | 1753 | no | const label = el(&#39;input&#39;, { type: &#39;text&#39;, required: true, maxlength: &#39;64&#39;, &#39;aria-label&#39;: &#39;New screen label&#39;, placeholder: &#39;My Tasks&#39; }); |
| button | const | 1756 | no | const button = el(&#39;button&#39;, { type: &#39;submit&#39;, text: &#39;Add screen to blueprint&#39; }); |
| propose | const | 1761 | no | const propose = el(&#39;form&#39;, { id: &#39;worldBuilderProposalForm&#39; }); |
| draft | const | 1764 | no | const draft = el(&#39;textarea&#39;, { id: &#39;worldBuilderProposalText&#39;, rows: &#39;8&#39;, maxlength: &#39;12000&#39;, &#39;aria-label&#39;: &#39;JSON change proposal&#39;, placeholder: &#39;vivim.personal-app-change/1 JSON&#39; }); |
| diffArea | const | 1767 | no | const diffArea = el(&#39;div&#39;, { id: &#39;worldBuilderProposalDiff&#39;, role: &#39;status&#39; }); |
| apply | const | 1768 | no | const apply = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldBuilderApplyProposal&#39;, text: &#39;Approve and apply these changes&#39; }); |
| example | const | 1779 | no | const example = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Insert editable example&#39; }); |
| check | const | 1788 | no | const check = el(&#39;button&#39;, { type: &#39;submit&#39;, id: &#39;worldBuilderPreviewProposal&#39;, text: &#39;Preview without saving&#39; }); |
| replies | const | 1795 | no | const replies = el(&#39;section&#39;, { id: &#39;worldBuilderStoredReplies&#39; }, [ el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;Or use an AI reply already saved by VIVIM. This only reads saved text; it never sends a message to… |
| load | const | 1798 | no | const load = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldBuilderLoadReplies&#39;, text: &#39;Choose a saved AI reply&#39; }); |
| pick | const | 1808 | no | const pick = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;worldBuilderPickReply&#39;, text: &#39;Preview &#39; + choice.site + &#39; reply · conversation &#39; + choice.conversation + &#39; · turn &#39; + choice.turnId + (choice.char… |
| fromReply | const | 1817 | no | const fromReply = b.proposalPreview.source === &#39;provider-reply&#39; ? b.proposalPreview.provenance : null; |
| changes | const | 1823 | no | const changes = el(&#39;ul&#39;); |
| screenPreview | const | 1828 | no | const screenPreview = el(&#39;div&#39;, { class: &#39;vivim-builder-screen-grid&#39;, id: &#39;worldBuilderProposedScreens&#39; }); |
| renderSettings | function | 1843 | no | function renderSettings() { |
| config | const | 1845 | no | const config = state.settings; |
| head | const | 1846 | no | const head = el(&#39;div&#39;, { class: &#39;vivim-section-head&#39; }, [ el(&#39;span&#39;, { class: &#39;vivim-eyebrow&#39;, text: &#39;YOUR SPACE, YOUR RULES&#39; }), el(&#39;h2&#39;, { text: &#39;Settings&#39; }), el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;Provi… |
| tabs | const | 1851 | no | const tabs = el(&#39;div&#39;, { class: &#39;vivim-settings-tabs&#39;, id: &#39;vivimSettingsTabs&#39;, role: &#39;tablist&#39;, &#39;aria-label&#39;: &#39;Settings sections&#39; }); |
| button | const | 1856 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, role: &#39;tab&#39;, &#39;aria-selected&#39;: config.tab === key ? &#39;true&#39; : &#39;false&#39;, text: label }); |
| body | const | 1861 | no | const body = el(&#39;div&#39;, { class: &#39;vivim-settings-body&#39; }); |
| row | const | 1869 | no | const row = el(&#39;div&#39;, { class: &#39;vivim-settings-provider&#39; }, [ el(&#39;span&#39;, { class: &#39;vivim-provider-emblem&#39;, &#39;aria-hidden&#39;: &#39;true&#39;, text: site.id.slice(0, 1).toUpperCase() }), el(&#39;span&#39;, { class: &#39;vivi… |
| button | const | 1876 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Choose in Chat&#39; }); |
| box | const | 1879 | no | const box = doc.getElementById?.(&#39;connectBox&#39;); |
| button | const | 1891 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Open Workspace&#39; }); |
| button | const | 1903 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Open Transfer&#39; }); |
| loadSettingsSites | function | 1915 | no | async function loadSettingsSites() { |
| config | const | 1916 | no | const config = state.settings; |
| response | const | 1921 | no | const response = await fetchImpl(&#39;/api/v1/conversation-targets&#39;, { method: &#39;GET&#39; }); |
| data | const | 1923 | no | const data = await response.json(); |
| titleFor | function | 1936 | no | function titleFor(kind, id) { |
| saved | const | 1938 | no | const saved = state.editors.get(id)?.saved; |
| syncDirty | function | 1941 | no | function syncDirty(editor) { |
| dirty | const | 1942 | no | const dirty = !!(editor &amp;&amp; editor.saved &amp;&amp; !sameDraft(editor.draft, draftFromSaved(editor.saved))); |
| syncFormNote | function | 1949 | no | function syncFormNote() { |
| kind | const | 1950 | no | const kind = state.view === &#39;notes&#39; ? &#39;note&#39; : &#39;project&#39;; |
| fillSelect | function | 1954 | no | function fillSelect(select, items, used, label) { |
| current | const | 1956 | no | const current = select.value; |
| options | const | 1957 | no | const options = items.filter((item) =&gt; item &amp;&amp; typeof item.id === &#39;string&#39; &amp;&amp; !(used ?? []).includes(item.id)); |
| refreshLinkSelects | function | 1963 | no | function refreshLinkSelects() { |
| project | const | 1964 | no | const project = state.view === &#39;projects&#39; ? state.editors.get(state.selected.projects) : null; |
| note | const | 1970 | no | const note = state.view === &#39;notes&#39; ? state.editors.get(state.selected.notes) : null; |
| fillItems | function | 1973 | no | function fillItems() { |
| list | const | 1975 | no | const list = state.lists[state.view]; |
| empty | const | 1985 | no | const empty = { |
| ul | const | 1997 | no | const ul = el(&#39;ul&#39;, { class: &#39;plain vivim-record-list vivim-record-list-&#39; + state.view }); |
| current | const | 2000 | no | const current = state.selected[state.view] === item.id; |
| meta | const | 2001 | no | const meta = state.view === &#39;conversations&#39; |
| isProject | const | 2006 | no | const isProject = state.view === &#39;projects&#39;; |
| button | const | 2007 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;rowbtn vivim-record-card&#39; + (isProject ? &#39; vivim-project-card&#39; : &#39;&#39;), &#39;aria-current&#39;: current ? &#39;true&#39; : null, }, [ ...(isProject ? [el(&#39;span&#39;, { |
| renderListPane | function | 2025 | no | function renderListPane() { |
| head | const | 2032 | no | const head = el(&#39;h2&#39;, { text: state.view === &#39;conversations&#39; ? &#39;Saved conversations&#39; : state.view === &#39;projects&#39; ? &#39;Projects&#39; : &#39;Notes&#39; }); |
| bits | const | 2034 | no | const bits = [head, namespaceNode, listStatusNode, listErrorNode]; |
| custody | const | 2036 | no | const custody = el(&#39;select&#39;, { id: &#39;worldCustody&#39;, &#39;aria-label&#39;: &#39;Which saved conversations to list&#39; }); |
| kind | const | 2050 | no | const kind = state.view === &#39;projects&#39; ? &#39;project&#39; : &#39;note&#39;; |
| title | const | 2051 | no | const title = el(&#39;input&#39;, { id: &#39;worldCreateTitle&#39;, type: &#39;text&#39;, maxlength: &#39;300&#39;, &#39;aria-label&#39;: kind === &#39;project&#39; ? &#39;New project title&#39; : &#39;New note title&#39; }); |
| fields | const | 2057 | no | const fields = [el(&#39;label&#39;, { class: &#39;lab&#39;, for: &#39;worldCreateTitle&#39;, text: &#39;Title&#39; }), title]; |
| body | const | 2059 | no | const body = el(&#39;textarea&#39;, { id: &#39;worldCreateBody&#39;, rows: &#39;4&#39;, &#39;aria-label&#39;: &#39;New note&#39; }); |
| syncNamespace | function | 2079 | no | function syncNamespace() { |
| findRecord | function | 2085 | no | function findRecord(id) { |
| found | const | 2088 | no | const found = list.items.find((item) =&gt; item?.id === id); |
| recordLabel | function | 2093 | no | function recordLabel(id) { |
| sourceJumpProblem | function | 2107 | no | function sourceJumpProblem(message) { |
| editor | const | 2111 | no | const editor = state.editors.get(state.selected[state.view]); |
| followSource | function | 2116 | no | async function followSource(record) { |
| fresh | const | 2125 | no | const fresh = await call(&#39;/selections/&#39; + encodeURIComponent(record.id)); |
| conversationId | variable | 2133 | no | let conversationId = record.conversationId; |
| parentId | const | 2135 | no | const parentId = record.objectId; |
| object | const | 2140 | no | const object = await call(&#39;/objects/&#39; + encodeURIComponent(parentId)); |
| idx | const | 2153 | no | const idx = record.source?.messageIndex; |
| sourceJumpButton | function | 2164 | no | function sourceJumpButton(record) { |
| button | const | 2166 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;mini&#39;, id: &#39;worldSourceJump-&#39; + record.id, text: &#39;Open original saved source&#39;, &#39;aria-label&#39;: &#39;Open source for &#39; + record.id }); |
| memberRow | function | 2173 | no | function memberRow(kind, id) { |
| title | const | 2174 | no | const title = kind === &#39;members&#39; \|\| kind === &#39;comments&#39; ? recordLabel(id) : (titleFor(kind, id) \|\| (kind === &#39;conversations&#39; ? &#39;Saved conversation&#39; : &#39;Note&#39;)); |
| known | const | 2176 | no | const known = record \|\| (kind === &#39;conversations&#39; ? state.lists.conversations.items.some((item) =&gt; item.id === id) \|\| state.conversations.has(id) : kind === &#39;notes&#39; ? state.lists.notes.items.some((it… |
| open | const | 2181 | no | const open = el(&#39;button&#39;, { type: &#39;button&#39;, text: kind === &#39;conversations&#39; ? &#39;Open conversation&#39; : kind === &#39;notes&#39; ? &#39;Open note&#39; : &#39;Read record&#39; }); |
| remove | const | 2186 | no | const remove = el(&#39;button&#39;, { type: &#39;button&#39;, text: &#39;Remove&#39;, &#39;aria-label&#39;: `Remove ${title}` }); |
| editor | const | 2188 | no | const editor = state.editors.get(state.selected[state.view]); |
| facts | const | 2196 | no | const facts = record ? kv([ record.availability ? { label: &#39;Availability&#39;, value: String(record.availability) } : null, record.availabilityReason ? { label: &#39;Why&#39;, value: String(record.availabilityRe… |
| selectionToolbar | function | 2214 | no | function selectionToolbar(item) { |
| box | const | 2216 | no | const box = el(&#39;section&#39;, { class: &#39;panel pad&#39;, id: &#39;worldSelectionToolbar&#39; }); |
| picker | const | 2218 | no | const picker = el(&#39;select&#39;, { id: &#39;worldSelectionProject&#39;, &#39;aria-label&#39;: &#39;Project for saved message or part&#39; }); |
| line | const | 2228 | no | const line = typeof box.querySelector === &#39;function&#39; ? box.querySelector(&#39;#worldSelectionStatus&#39;) : null; |
| title | const | 2231 | no | const title = el(&#39;input&#39;, { type: &#39;text&#39;, id: &#39;worldSelectionNewTitle&#39;, maxlength: &#39;300&#39;, &#39;aria-label&#39;: &#39;Name for a new project&#39;, placeholder: &#39;New project name&#39; }); |
| create | const | 2235 | no | const create = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldSelectionNewProject&#39;, text: &#39;Create project here&#39; }); |
| more | const | 2240 | no | const more = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldSelectionMoreProjects&#39;, text: &#39;Load more projects&#39; }); |
| pending | const | 2252 | no | const pending = state.selectionSave.pending; |
| detail | const | 2254 | no | const detail = pending.selectionId |
| finish | const | 2259 | no | const finish = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldFinishSelectionLink&#39;, text: &#39;Finish linking saved selection&#39; }); |
| dismiss | const | 2265 | no | const dismiss = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldDismissSelectionPending&#39;, text: &#39;Leave unfinished records and continue&#39; }); |
| linked | const | 2275 | no | const linked = state.selectionSave.lastLinked; |
| noteTitle | const | 2280 | no | const noteTitle = el(&#39;input&#39;, { type: &#39;text&#39;, id: &#39;worldSelectionNoteTitle&#39;, maxlength: &#39;300&#39;, &#39;aria-label&#39;: &#39;Title for a note on this selection&#39;, placeholder: &#39;Note title&#39; }); |
| noteBody | const | 2284 | no | const noteBody = el(&#39;textarea&#39;, { id: &#39;worldSelectionNoteBody&#39;, rows: &#39;3&#39;, &#39;aria-label&#39;: &#39;Your note on the saved selection&#39;, placeholder: &#39;Your note&#39; }); |
| addNote | const | 2288 | no | const addNote = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldSelectionCreateNote&#39;, text: &#39;Save note on selection&#39; }); |
| createProjectFromConversation | function | 2300 | no | async function createProjectFromConversation() { |
| work | const | 2301 | no | const work = state.selectionSave; |
| title | const | 2303 | no | const title = validTitle(work.newTitle ?? &#39;&#39;); |
| result | const | 2313 | no | const result = await call(&#39;/projects&#39;, { method: &#39;POST&#39;, body: projectCreateBody(title) }); |
| outcome | const | 2314 | no | const outcome = interpretCreate(result, { title, body: &#39;&#39; }); |
| saved | const | 2319 | no | const saved = outcome.saved; |
| list | const | 2320 | no | const list = state.lists.projects; |
| cacheSourceRecord | function | 2338 | no | function cacheSourceRecord(kind, record) { |
| list | const | 2340 | no | const list = state.lists[kind]; |
| saveObservedPart | function | 2348 | no | async function saveObservedPart(conversationId, messageIndex, partPath = []) { |
| work | const | 2349 | no | const work = state.selectionSave; |
| projectId | const | 2356 | no | const projectId = work.projectId; |
| source | const | 2357 | no | const source = state.conversations.get(conversationId); |
| message | const | 2358 | no | const message = source?.messages?.[messageIndex]; |
| validPart | const | 2359 | no | const validPart = !partPath.length \|\| (partPath.length === 1 &amp;&amp; Number.isSafeInteger(partPath[0]) &amp;&amp; partPath[0] &gt;= 0 &amp;&amp; Array.isArray(message?.blocks) &amp;&amp; partPath[0] &lt; message.blocks.length); |
| key | const | 2361 | no | const key = JSON.stringify([conversationId, messageIndex, partPath, projectId]); |
| localEditor | const | 2372 | no | const localEditor = state.editors.get(projectId); |
| object | variable | 2381 | no | let object = null, selection = null; |
| current | const | 2383 | no | const current = await call(&#39;/projects/&#39; + encodeURIComponent(projectId)); |
| project | const | 2388 | no | const project = current.data; |
| createdObject | const | 2389 | no | const createdObject = await call(&#39;/objects&#39;, { method: &#39;POST&#39;, body: { conversationId, expectedVersion: null } }); |
| createdSelection | const | 2398 | no | const createdSelection = await call(&#39;/selections&#39;, { method: &#39;POST&#39;, body: { objectId: object.id, selectionType: partPath.length ? &#39;part&#39; : &#39;message&#39;, messageIndex, partPath, expectedVersion: null, }… |
| changed | const | 2409 | no | const changed = await call(&#39;/projects/&#39; + encodeURIComponent(projectId), { method: &#39;PUT&#39;, body: { title: project.title, conversationIds: withId(project.conversationIds ?? [], conversationId), noteIds… |
| written | const | 2416 | no | const written = interpretWrite(changed, project); |
| list | const | 2428 | no | const list = state.lists.projects.items; |
| at | const | 2429 | no | const at = list.findIndex((p) =&gt; p.id === projectId); |
| finishPendingSelection | function | 2445 | no | async function finishPendingSelection() { |
| work | const | 2446 | no | const work = state.selectionSave, pending = work.pending; |
| project | const | 2463 | no | const project = projectRead.data; |
| nextConversations | const | 2464 | no | const nextConversations = withId(project.conversationIds ?? [], pending.conversationId); |
| nextMembers | const | 2465 | no | const nextMembers = withId(withId(project.memberIds ?? [], pending.objectId), pending.selectionId); |
| result | const | 2478 | no | const result = await call(&#39;/projects/&#39; + encodeURIComponent(pending.projectId), { method: &#39;PUT&#39;, body: { title: project.title, conversationIds: nextConversations, noteIds: project.noteIds ?? [], memb… |
| written | const | 2483 | no | const written = interpretWrite(result, project); |
| index | const | 2489 | no | const index = state.lists.projects.items.findIndex((p) =&gt; p.id === pending.projectId); |
| createNoteForSavedSelection | function | 2508 | no | async function createNoteForSavedSelection() { |
| work | const | 2509 | no | const work = state.selectionSave, linked = work.lastLinked; |
| title | const | 2511 | no | const title = validTitle(work.noteTitle ?? &#39;&#39;); |
| body | const | 2512 | no | const body = work.noteBody ?? &#39;&#39;; |
| savedNote | variable | 2521 | no | let savedNote = null; |
| selection | const | 2523 | no | const selection = await call(&#39;/selections/&#39; + encodeURIComponent(linked.selectionId)); |
| result | const | 2529 | no | const result = await call(&#39;/notes&#39;, { method: &#39;POST&#39;, body: { ...noteCreateBody(title, body), commentsOn: [linked.selectionId] } }); |
| outcome | const | 2531 | no | const outcome = interpretCreate(result, { title, body }); |
| notes | const | 2537 | no | const notes = state.lists.notes; |
| current | const | 2545 | no | const current = await call(&#39;/projects/&#39; + encodeURIComponent(linked.projectId)); |
| project | const | 2551 | no | const project = current.data; |
| resultLink | const | 2552 | no | const resultLink = await call(&#39;/projects/&#39; + encodeURIComponent(linked.projectId), { method: &#39;PUT&#39;, body: { title: project.title, conversationIds: project.conversationIds ?? [], noteIds: withId(proje… |
| written | const | 2556 | no | const written = interpretWrite(resultLink, project); |
| index | const | 2562 | no | const index = state.lists.projects.items.findIndex((p) =&gt; p.id === linked.projectId); |
| renderMessages | function | 2577 | no | function renderMessages(item) { |
| list | const | 2578 | no | const list = el(&#39;ol&#39;, { class: &#39;reads&#39;, id: &#39;worldMessages&#39; }); |
| messages | const | 2580 | no | const messages = Array.isArray(item.messages) ? item.messages : []; |
| coverage | const | 2582 | no | const coverage = item?.coverage?.state; |
| empty | const | 2583 | no | const empty = coverage === &#39;unavailable&#39; ? &#39;Saved messages were not shown because this read was unavailable.&#39; |
| plan | const | 2589 | no | const plan = turnPlan(message); |
| body | const | 2590 | no | const body = el(&#39;div&#39;, { class: &#39;rich&#39; }); |
| canSelect | const | 2591 | no | const canSelect = state.view === &#39;conversations&#39; &amp;&amp; state.selected.conversations === item.id; |
| frames | const | 2592 | no | const frames = planFrames(message).filter((frame) =&gt; frame.markdown \|\| frame.links.length); |
| frameBody | const | 2595 | no | const frameBody = el(&#39;div&#39;, { class: &#39;rich&#39;, &#39;data-part-path&#39;: String(frame.path[0]), tabindex: &#39;-1&#39; }); |
| sources | const | 2601 | no | const sources = el(&#39;div&#39;, { class: &#39;note&#39;, &#39;aria-label&#39;: &#39;Links observed in saved page&#39; }); |
| title | const | 2603 | no | const title = (link.kind === &#39;citation&#39; ? &#39;Recorded citation link: &#39; : &#39;Recorded link: &#39;) + link.label; |
| savePart | const | 2612 | no | const savePart = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;mini&#39;, id: &#39;worldSavePart-&#39; + index + &#39;-&#39; + frame.path[0], text: &#39;Save this part to project&#39; }); |
| unknownList | const | 2623 | no | const unknownList = el(&#39;div&#39;); |
| row | const | 2625 | no | const row = el(&#39;li&#39;, { class: &#39;rd&#39;, id: &#39;worldMsg&#39; + index, tabindex: &#39;0&#39; }, [ el(&#39;div&#39;, { class: &#39;rd-head&#39; }, [ el(&#39;b&#39;, { text: roleLabel(message?.role) }), ...(canSelect ? [(() =&gt; { const saveMessa… |
| saveMessage | const | 2629 | no | const saveMessage = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;mini&#39;, id: &#39;worldSaveMessage-&#39; + index, text: &#39;Save message to project&#39; }); |
| kv | function | 2650 | no | function kv(rows) { |
| dl | const | 2651 | no | const dl = el(&#39;dl&#39;, { class: &#39;kv&#39; }); |
| conversationReading | function | 2655 | no | function conversationReading(item, error = null, tail = null, chipOverride = null) { |
| coverage | const | 2656 | no | const coverage = coverageView(item.coverage); |
| renderDetailPane | function | 2673 | no | function renderDetailPane() { |
| kind | const | 2676 | no | const kind = state.view; |
| id | const | 2678 | no | const id = state.selected[kind]; |
| error | const | 2683 | no | const error = el(&#39;div&#39;, { class: &#39;err&#39;, id: &#39;worldError&#39;, role: &#39;alert&#39; }); |
| item | const | 2686 | no | const item = state.conversations.get(id); |
| editor | const | 2696 | no | const editor = state.editors.get(id); |
| notice | const | 2702 | no | const notice = el(&#39;div&#39;, { class: &#39;note&#39;, id: &#39;worldNotice&#39;, role: &#39;status&#39; }); |
| useSaved | const | 2706 | no | const useSaved = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldUseSaved&#39;, text: &#39;Load saved version&#39; }); |
| title | const | 2708 | no | const title = el(&#39;input&#39;, { id: &#39;worldTitle&#39;, type: &#39;text&#39;, maxlength: &#39;300&#39;, &#39;aria-label&#39;: &#39;Title&#39; }); |
| version | const | 2711 | no | const version = el(&#39;p&#39;, { class: &#39;note&#39;, id: &#39;worldVersion&#39;, text: Number.isInteger(editor.expectedVersion) ? `Version ${editor.expectedVersion}. Saving sends this version and will not overwrite a ne… |
| bodyBits | const | 2712 | no | const bodyBits = [ |
| body | const | 2721 | no | const body = el(&#39;textarea&#39;, { id: &#39;worldBody&#39;, rows: &#39;8&#39;, &#39;aria-label&#39;: &#39;Note&#39; }); |
| addComment | const | 2726 | no | const addComment = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAddComment&#39;, text: &#39;Comment on selection&#39; }); |
| addConv | const | 2738 | no | const addConv = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAddConversation&#39;, text: &#39;Add to this project&#39; }); |
| addNote | const | 2739 | no | const addNote = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAddNote&#39;, text: &#39;Add to this project&#39; }); |
| addOther | const | 2740 | no | const addOther = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldAddMember&#39;, text: &#39;Add to this project&#39; }); |
| chips | function | 2764 | no | function chips(list) { |
| linkedProjects | function | 2767 | no | function linkedProjects(id, noun) { |
| list | const | 2768 | no | const list = state.lists.projects; |
| hits | const | 2769 | no | const hits = list.items.filter((item) =&gt; { const direct = noun === &#39;conversation&#39; ? item?.conversationIds : item?.noteIds; const ids = [...(Array.isArray(direct) ? direct : []), ...(Array.isArray(ite… |
| direct | const | 2770 | no | const direct = noun === &#39;conversation&#39; ? item?.conversationIds : item?.noteIds; |
| ids | const | 2771 | no | const ids = [...(Array.isArray(direct) ? direct : []), ...(Array.isArray(item?.memberIds) ? item.memberIds : [])]; |
| box | const | 2774 | no | const box = el(&#39;div&#39;); |
| button | const | 2779 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, text: hit.title \|\| hit.id }); |
| addMember | function | 2786 | no | function addMember(kind, id) { |
| editorKind | const | 2787 | no | const editorKind = kind === &#39;comments&#39; ? &#39;notes&#39; : &#39;projects&#39;; |
| editor | const | 2788 | no | const editor = state.editors.get(state.selected[editorKind]); |
| fetchList | function | 2802 | no | async function fetchList(kind, { more = false } = {}) { |
| list | const | 2804 | no | const list = state.lists[kind]; |
| offset | const | 2808 | no | const offset = more ? list.nextOffset : 0; |
| mine | const | 2812 | no | const mine = ++tickets.list[kind]; |
| path | const | 2813 | no | const path = { conversations: &#39;/conversations&#39;, projects: &#39;/projects&#39;, notes: &#39;/notes&#39;, objects: &#39;/objects&#39;, selections: &#39;/selections&#39; }[kind]; |
| params | const | 2814 | no | const params = new URLSearchParams({ limit: String(PAGE_LIMIT), offset: String(offset) }); |
| result | const | 2816 | no | const result = await call(`${path}?${params.toString()}`); |
| page | const | 2819 | no | const page = result.status === 200 ? readList(result.data) : { ok: false, message: result.status === 0 ? &#39;Studio didn’t answer.&#39; : &#39;The list could not be read.&#39; }; |
| incoming | const | 2822 | no | const incoming = page.items.filter((item) =&gt; item &amp;&amp; typeof item.id === &#39;string&#39;); |
| openEditor | const | 2832 | no | const openEditor = state.editors.get(state.selected[state.view]); |
| dirty | const | 2833 | no | const dirty = openEditor?.saved &amp;&amp; !sameDraft(openEditor.draft, draftFromSaved(openEditor.saved)); |
| loadNamespace | function | 2836 | no | async function loadNamespace() { |
| result | const | 2839 | no | const result = await call(&#39;/namespace&#39;); |
| readRecord | function | 2845 | no | async function readRecord(id) { |
| path | const | 2846 | no | const path = id.startsWith(&#39;o-&#39;) ? &#39;/objects/&#39; : id.startsWith(&#39;s-&#39;) ? &#39;/selections/&#39; : &#39;&#39;; |
| result | const | 2848 | no | const result = await call(path + encodeURIComponent(id)); |
| fetchItem | function | 2856 | no | async function fetchItem(kind, id) { |
| mine | const | 2857 | no | const mine = ++tickets[kind]; |
| result | const | 2858 | no | const result = await call(`/${kind}/${encodeURIComponent(id)}`); |
| ok | const | 2860 | no | const ok = result.status === 200 &amp;&amp; result.data &amp;&amp; result.data.id === id; |
| cached | const | 2862 | no | const cached = kind === &#39;conversations&#39; &amp;&amp; state.conversations.has(id); |
| active | const | 2863 | no | const active = result.status === 409 &amp;&amp; result.data?.code === &#39;WORLD_SOURCE_ACTIVE&#39;; |
| text | variable | 2864 | no | let text = result.status === 404 ? &#39;Not on this computer anymore.&#39; |
| existing | const | 2876 | no | const existing = state.editors.get(id); |
| openItem | function | 2883 | no | async function openItem(kind, id) { |
| loads | const | 2891 | no | const loads = [fetchList(kind), fetchItem(kind, id)]; |
| validTitle | function | 2897 | no | function validTitle(title) { |
| trimmed | const | 2898 | no | const trimmed = title.trim(); |
| create | function | 2901 | no | async function create(kind) { |
| form | const | 2903 | no | const form = state.forms[kind]; |
| title | const | 2904 | no | const title = validTitle(form.title ?? &#39;&#39;); |
| result | const | 2908 | no | const result = await call(kind === &#39;project&#39; ? &#39;/projects&#39; : &#39;/notes&#39;, { method: &#39;POST&#39;, body: kind === &#39;project&#39; ? projectCreateBody(title) : noteCreateBody(title, form.body ?? &#39;&#39;), }); |
| out | const | 2912 | no | const out = interpretCreate(result, { title: form.title, body: form.body ?? &#39;&#39; }); |
| listKind | const | 2916 | no | const listKind = kind === &#39;project&#39; ? &#39;projects&#39; : &#39;notes&#39;; |
| save | function | 2930 | no | async function save(kind, id) { |
| editor | const | 2931 | no | const editor = state.editors.get(id); |
| title | const | 2934 | no | const title = validTitle(editor.draft.title ?? &#39;&#39;); |
| sentPrint | const | 2938 | no | const sentPrint = draftFingerprint({ ...editor.draft, title }); |
| body | const | 2940 | no | const body = kind === &#39;projects&#39; |
| result | const | 2943 | no | const result = await call(`/${kind}/${encodeURIComponent(id)}`, { method: &#39;PUT&#39;, body }); |
| current | const | 2945 | no | const current = state.editors.get(id) ?? editor; |
| written | const | 2946 | no | const written = interpretWrite(result, current.draft); |
| later | const | 2958 | no | const later = draftFingerprint(current.draft) !== sentPrint; |
| next | const | 2959 | no | const next = editorFrom(written.saved, later ? &#39;Saved what was sent. Edits made after that are still here and were not written.&#39; : &#39;Saved.&#39;); |
| index | const | 2962 | no | const index = state.lists[kind].items.findIndex((item) =&gt; item.id === id); |
| loadSaved | function | 2967 | no | async function loadSaved(kind, id) { |
| result | const | 2968 | no | const result = await call(`/${kind}/${encodeURIComponent(id)}`); |
| renderFind | function | 2978 | no | function renderFind() { |
| query | const | 2980 | no | const query = el(&#39;input&#39;, { id: &#39;worldFindQuery&#39;, type: &#39;search&#39;, role: &#39;searchbox&#39;, &#39;aria-label&#39;: &#39;Text to find in saved records&#39; }); |
| kind | const | 2984 | no | const kind = el(&#39;select&#39;, { id: &#39;worldFindKind&#39;, &#39;aria-label&#39;: &#39;Limit find to one kind of record&#39; }); |
| submit | const | 2989 | no | const submit = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldFindSubmit&#39;, text: state.find.loading ? &#39;Finding…&#39; : &#39;Find&#39; }); |
| status | const | 2992 | no | const status = el(&#39;div&#39;, { id: &#39;worldFindStatus&#39;, role: &#39;status&#39;, &#39;aria-live&#39;: &#39;polite&#39; }); |
| error | const | 2994 | no | const error = el(&#39;div&#39;, { class: &#39;err&#39;, id: &#39;worldFindError&#39;, role: &#39;alert&#39; }); |
| coverage | const | 2996 | no | const coverage = el(&#39;div&#39;, { id: &#39;worldFindCoverage&#39; }); |
| results | const | 3000 | no | const results = el(&#39;div&#39;, { id: &#39;worldFindResults&#39; }); |
| list | const | 3003 | no | const list = el(&#39;ul&#39;, { class: &#39;plain&#39; }); |
| availability | const | 3005 | no | const availability = availabilityLabel(hit); |
| button | const | 3006 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;rowbtn&#39;, &#39;aria-label&#39;: `Open ${hit.kind \|\| &#39;record&#39;} ${hit.id}` }, [ el(&#39;span&#39;, { class: &#39;conv-title&#39;, text: hit.title \|\| hit.id }), el(&#39;span&#39;, {… |
| item | const | 3011 | no | const item = el(&#39;li&#39;, {}, [ button, hit.snippet ? el(&#39;p&#39;, { class: &#39;note&#39;, text: hit.snippet }) : null, custodyChip(hit) ? el(&#39;p&#39;, { text: custodyChip(hit)[0] }) : null, availability ? el(&#39;p&#39;, { text… |
| more | const | 3021 | no | const more = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldFindMore&#39;, text: &#39;Load more matches&#39; }); |
| runSearch | function | 3051 | no | async function runSearch({ more = false } = {}) { |
| query | const | 3052 | no | const query = state.find.query.trim(); |
| offset | const | 3060 | no | const offset = more ? state.find.nextOffset : 0; |
| ticket | const | 3061 | no | const ticket = ++searchTicket; |
| controller | const | 3063 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| params | const | 3068 | no | const params = new URLSearchParams(); |
| result | const | 3073 | no | const result = await call(&#39;/search?&#39; + params.toString(), { signal: controller?.signal }); |
| page | const | 3087 | no | const page = readSearch(result.data); |
| incoming | const | 3093 | no | const incoming = page.items.filter((hit) =&gt; hit &amp;&amp; typeof hit.id === &#39;string&#39;); |
| validPartPath | function | 3105 | no | function validPartPath(partPath) { |
| partFrameOf | function | 3113 | no | function partFrameOf(row, key) { |
| found | variable | 3118 | no | let found = null; |
| visit | function | 3119 | no | const visit = (node) =&gt; { |
| attr | const | 3121 | no | const attr = typeof node.getAttribute === &#39;function&#39; ? node.getAttribute(&#39;data-part-path&#39;) : node.attrs?.[&#39;data-part-path&#39;]; |
| children | const | 3123 | no | const children = node.children; |
| openHit | function | 3129 | no | async function openHit(hit) { |
| appId | const | 3132 | no | const appId = hit.source?.appId, itemId = hit.source?.itemId; |
| response | const | 3134 | no | const response = await builderCall(&#39;/&#39; + encodeURIComponent(appId) + &#39;/content&#39;); |
| data | const | 3137 | no | const data = response.data ?? {}; |
| item | const | 3138 | no | const item = (data.content?.items ?? data.items ?? []).find(value =&gt; value.id === itemId); |
| id | const | 3146 | no | const id = hit.conversation?.id; |
| index | const | 3152 | no | const index = Number.isInteger(hit.source?.index) ? hit.source.index : null; |
| partPath | const | 3153 | no | const partPath = hit.source?.partPath; |
| askedPart | const | 3155 | no | const askedPart = partPath !== undefined &amp;&amp; partPath !== null &amp;&amp; !(Array.isArray(partPath) &amp;&amp; partPath.length === 0); |
| partKey | const | 3156 | no | const partKey = validPartPath(partPath) ? partPath.map((key) =&gt; String(key)).join(&#39;.&#39;) : null; |
| foundBefore | const | 3158 | no | const foundBefore = partKey &amp;&amp; index != null ? partFrameOf(state.messageNodes?.get(index) ?? null, partKey) : null; |
| row | const | 3163 | no | const row = index == null ? null : state.messageNodes?.get(index) ?? null; |
| frame | const | 3164 | no | const frame = partKey &amp;&amp; row ? partFrameOf(row, partKey) : null; |
| clearExportBundle | function | 3188 | no | function clearExportBundle() { |
| selectedExportIds | function | 3195 | no | function selectedExportIds() { |
| resetImportCheck | function | 3198 | no | function resetImportCheck() { |
| textBytes | function | 3205 | no | function textBytes(text) { |
| factList | function | 3208 | no | function factList(title, rows) { |
| box | const | 3209 | no | const box = el(&#39;div&#39;, {}, [el(&#39;h3&#39;, { text: title })]); |
| renderTransfer | function | 3214 | no | function renderTransfer() { |
| t | const | 3216 | no | const t = state.transfer; |
| status | const | 3217 | no | const status = el(&#39;div&#39;, { id: &#39;worldTransferStatus&#39;, role: &#39;status&#39;, &#39;aria-live&#39;: &#39;polite&#39;, text: t.exportStatus \|\| t.importStatus \|\| &#39;&#39; }); |
| n | const | 3221 | no | const n = t.nativeCheck; |
| verdict | const | 3222 | no | const verdict = n.error ? &#39;native validator unreachable (&#39; + n.error + &#39;)&#39; |
| exportError | const | 3228 | no | const exportError = el(&#39;div&#39;, { class: &#39;err&#39;, id: &#39;worldExportError&#39;, role: &#39;alert&#39;, text: t.exportError }); |
| choices | const | 3229 | no | const choices = el(&#39;div&#39;, { id: &#39;worldExportChoices&#39; }); |
| groups | const | 3230 | no | const groups = [[&#39;Saved conversations&#39;, state.lists.conversations], [&#39;Projects&#39;, state.lists.projects], [&#39;Notes&#39;, state.lists.notes]]; |
| items | const | 3233 | no | const items = (list.items ?? []).filter((item) =&gt; validWorldId(item?.id)); |
| box | const | 3236 | no | const box = el(&#39;input&#39;, { type: &#39;checkbox&#39;, id: &#39;export-&#39; + item.id }); |
| exportMode | const | 3246 | no | const exportMode = t.exportMode === &#39;transcript&#39; \|\| t.exportMode === &#39;full-saved&#39; ? t.exportMode : &#39;references&#39;; |
| modePicker | const | 3247 | no | const modePicker = el(&#39;div&#39;, { id: &#39;worldExportModes&#39;, role: &#39;radiogroup&#39;, &#39;aria-label&#39;: &#39;What the export includes&#39; }); |
| radio | const | 3253 | no | const radio = el(&#39;input&#39;, { type: &#39;radio&#39;, id: &#39;worldExportMode-&#39; + value, name: &#39;worldExportMode&#39;, value }); |
| partBox | function | 3264 | no | const partBox = (key, label) =&gt; { |
| box | const | 3265 | no | const box = el(&#39;input&#39;, { type: &#39;checkbox&#39;, id: &#39;worldExportPart-&#39; + key }); |
| partsHint | const | 3277 | no | const partsHint = exportMode === &#39;references&#39; |
| preview | const | 3280 | no | const preview = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldExportPreview&#39;, text: t.loading === &#39;export&#39; ? &#39;Previewing…&#39; : &#39;Preview&#39; }); |
| previewBox | const | 3283 | no | const previewBox = el(&#39;div&#39;, { id: &#39;worldExportPreviewOut&#39; }); |
| scope | const | 3285 | no | const scope = t.bundle.scope &amp;&amp; typeof t.bundle.scope === &#39;object&#39; ? t.bundle.scope : null; |
| coverage | const | 3286 | no | const coverage = t.bundle.coverage &amp;&amp; typeof t.bundle.coverage === &#39;object&#39; ? t.bundle.coverage : null; |
| appliedMode | const | 3287 | no | const appliedMode = typeof scope?.mode === &#39;string&#39; ? scope.mode : null; |
| counts | const | 3288 | no | const counts = custodyCounts(t.bundle.records); |
| omitted | const | 3295 | no | const omitted = Array.isArray(t.bundle.omitted) ? t.bundle.omitted : []; |
| totals | const | 3299 | no | const totals = {}; |
| reason | const | 3301 | no | const reason = typeof item?.reason === &#39;string&#39; &amp;&amp; item.reason ? item.reason : &#39;reason not given&#39;; |
| strongWarning | const | 3313 | no | const strongWarning = scope?.parts &amp;&amp; typeof scope.parts === &#39;object&#39; |
| href | variable | 3324 | no | let href = &#39;&#39;; |
| importBox | const | 3333 | no | const importBox = el(&#39;textarea&#39;, { id: &#39;worldImportText&#39;, rows: &#39;6&#39;, &#39;aria-label&#39;: &#39;Paste a world JSON bundle&#39; }); |
| file | const | 3343 | no | const file = el(&#39;input&#39;, { type: &#39;file&#39;, id: &#39;worldImportFile&#39;, accept: &#39;application/json,.json&#39;, &#39;aria-label&#39;: &#39;Choose a world JSON file&#39; }); |
| check | const | 3345 | no | const check = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldImportCheck&#39;, text: t.loading === &#39;check&#39; ? &#39;Checking…&#39; : &#39;Check&#39; }); |
| ready | const | 3348 | no | const ready = checkReady(t.check) &amp;&amp; t.checkText === t.importText &amp;&amp; t.check.digest; |
| dry | const | 3349 | no | const dry = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldImportDry&#39;, text: t.loading === &#39;dry&#39; ? &#39;Checking dry run…&#39; : &#39;Dry run&#39; }); |
| confirm | const | 3352 | no | const confirm = el(&#39;input&#39;, { type: &#39;checkbox&#39;, id: &#39;worldImportConfirm&#39; }); |
| write | const | 3356 | no | const write = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldImportRestore&#39;, text: t.loading === &#39;restore&#39; ? &#39;Restoring…&#39; : &#39;Write imported copies&#39; }); |
| importOut | const | 3359 | no | const importOut = el(&#39;div&#39;, { id: &#39;worldImportOut&#39; }); |
| importError | const | 3360 | no | const importError = el(&#39;div&#39;, { class: &#39;err&#39;, id: &#39;worldImportError&#39;, role: &#39;alert&#39;, text: t.importError }); |
| summary | const | 3364 | no | const summary = restoreSummary(t.restore); |
| applied | const | 3366 | no | const applied = Array.isArray(t.restore.applied) ? t.restore.applied : []; |
| map | const | 3367 | no | const map = t.restore.idMap &amp;&amp; typeof t.restore.idMap === &#39;object&#39; ? t.restore.idMap : {}; |
| original | const | 3369 | no | const original = applied.find((id) =&gt; typeof id === &#39;string&#39; &amp;&amp; (kind === &#39;conversations&#39; ? id.startsWith(&#39;c-&#39;) : kind === &#39;projects&#39; ? id.startsWith(&#39;p-&#39;) : id.startsWith(&#39;n-&#39;)) &amp;&amp; ID_RE[kind].test(… |
| target | const | 3373 | no | const target = map[original]; |
| open | const | 3374 | no | const open = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldImportOpen-&#39; + kind, text: &#39;Open imported &#39; + (kind === &#39;conversations&#39; ? &#39;conversation&#39; : kind === &#39;projects&#39; ? &#39;project&#39; : &#39;note&#39;) }); |
| renderCheck | function | 3408 | no | function renderCheck(report) { |
| box | const | 3409 | no | const box = el(&#39;div&#39;, { id: &#39;worldCheckOut&#39; }); |
| counts | const | 3412 | no | const counts = report.counts &amp;&amp; typeof report.counts === &#39;object&#39; ? report.counts : {}; |
| unresolved | const | 3414 | no | const unresolved = Array.isArray(report.unresolved) ? report.unresolved : []; |
| omitted | const | 3417 | no | const omitted = Array.isArray(report.omitted) ? report.omitted : []; |
| errors | const | 3420 | no | const errors = Array.isArray(report.errors) ? report.errors : []; |
| mapped | const | 3423 | no | const mapped = report.idMap &amp;&amp; typeof report.idMap === &#39;object&#39; ? Object.keys(report.idMap).length : 0; |
| known | const | 3425 | no | const known = new Set([&#39;valid&#39;, &#39;digest&#39;, &#39;counts&#39;, &#39;idMap&#39;, &#39;unresolved&#39;, &#39;omitted&#39;, &#39;errors&#39;, &#39;coverage&#39;]); |
| extra | const | 3426 | no | const extra = Object.entries(report).filter(([key]) =&gt; !known.has(key)); |
| renderOutcome | function | 3430 | no | function renderOutcome(report) { |
| box | const | 3431 | no | const box = el(&#39;div&#39;); |
| lists | const | 3432 | no | const lists = [[&#39;Applied&#39;, report.applied], [&#39;Skipped&#39;, report.skipped], [&#39;Pending&#39;, report.pending]]; |
| ids | const | 3434 | no | const ids = Array.isArray(values) ? values : []; |
| failed | const | 3437 | no | const failed = Array.isArray(report.failed) ? report.failed : []; |
| known | const | 3440 | no | const known = new Set([&#39;valid&#39;, &#39;digest&#39;, &#39;counts&#39;, &#39;idMap&#39;, &#39;unresolved&#39;, &#39;omitted&#39;, &#39;errors&#39;, &#39;coverage&#39;, &#39;dryRun&#39;, &#39;applied&#39;, &#39;skipped&#39;, &#39;failed&#39;, &#39;pending&#39;, &#39;partial&#39;, &#39;receipt&#39;]); |
| extra | const | 3441 | no | const extra = Object.entries(report).filter(([key]) =&gt; !known.has(key)); |
| runExport | function | 3445 | no | async function runExport() { |
| ids | const | 3446 | no | const ids = selectedExportIds(); |
| ticket | const | 3448 | no | const ticket = ++exportTicket; |
| controller | const | 3450 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| template | const | 3455 | no | const template = state.transfer.exportMode === &#39;references&#39; \|\| state.transfer.exportMode === &#39;transcript&#39; \|\| state.transfer.exportMode === &#39;full-saved&#39; |
| body | const | 3458 | no | const body = { ids, mode: template }; |
| result | const | 3460 | no | const result = await call(&#39;/transfer/export&#39;, { method: &#39;POST&#39;, signal: controller?.signal, body }); |
| readImportFile | function | 3476 | no | function readImportFile(file) { |
| reader | const | 3491 | no | const reader = new FileReader(); |
| text | const | 3493 | no | const text = typeof reader.result === &#39;string&#39; ? reader.result : &#39;&#39;; |
| parsedBundle | function | 3509 | no | function parsedBundle() { |
| text | const | 3510 | no | const text = state.transfer.importText; |
| runCheck | function | 3515 | no | async function runCheck() { |
| parsed | const | 3516 | no | const parsed = parsedBundle(); |
| ticket | const | 3518 | no | const ticket = ++importTicket; |
| controller | const | 3520 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| source | const | 3524 | no | const source = state.transfer.importText; |
| result | const | 3526 | no | const result = await call(&#39;/transfer/validate&#39;, { method: &#39;POST&#39;, signal: controller?.signal, body: { bundle: parsed.bundle } }); |
| runRestore | function | 3549 | no | async function runRestore({ dryRun }) { |
| parsed | const | 3561 | no | const parsed = parsedBundle(); |
| ticket | const | 3563 | no | const ticket = ++importTicket; |
| controller | const | 3565 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| digest | const | 3568 | no | const digest = state.transfer.check.digest; |
| result | const | 3570 | no | const result = await call(&#39;/transfer/restore&#39;, { method: &#39;POST&#39;, signal: controller?.signal, body: { bundle: parsed.bundle, digest, dryRun: dryRun === true, ...(dryRun ? {} : { confirm: true }) } }); |
| summary | const | 3586 | no | const summary = restoreSummary(result.data); |
| relationChoices | function | 3610 | no | function relationChoices() { |
| rows | const | 3611 | no | const rows = []; |
| relationRowElements | function | 3618 | no | function relationRowElements(group, row, open = openRelation) { |
| node | const | 3619 | no | const node = row.node; |
| chip | const | 3635 | no | const chip = provenanceChip(node); |
| availability | const | 3636 | no | const availability = availabilityLabel(node); |
| basisLine | const | 3637 | no | const basisLine = row.basis &amp;&amp; row.basis !== STANDARD_RELATION_BASIS ? row.basis : null; |
| button | const | 3638 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;rowbtn&#39;, &#39;aria-label&#39;: `Open ${row.id}` }, [ el(&#39;span&#39;, { class: &#39;conv-title&#39;, text: node.title \|\| row.id }), el(&#39;span&#39;, { class: &#39;note&#39;, text: r… |
| renderRelationGraph | function | 3653 | no | function renderRelationGraph(rel) { |
| projected | const | 3654 | no | const projected = graphProjection(rel.map, rel.id, 12); |
| section | const | 3655 | no | const section = el(&#39;section&#39;, { class: &#39;vivim-graph-panel&#39;, id: &#39;vivimRelationGraph&#39;, &#39;aria-label&#39;: &#39;Visual map of locally saved associations&#39; }); |
| stage | const | 3666 | no | const stage = el(&#39;div&#39;, { class: &#39;vivim-graph-stage&#39;, role: &#39;group&#39;, &#39;aria-label&#39;: &#39;Saved relation nodes; use the list below for full evidence&#39; }); |
| ns | const | 3669 | no | const ns = &#39;http://www.w3.org/2000/svg&#39;; |
| svg | const | 3670 | no | const svg = doc.createElementNS(ns, &#39;svg&#39;); |
| lookup | const | 3675 | no | const lookup = new Map(projected.nodes.map((node) =&gt; [node.id, node])); |
| line | const | 3679 | no | const line = doc.createElementNS(ns, &#39;line&#39;); |
| unresolved | const | 3690 | no | const unresolved = [&#39;unresolved&#39;, &#39;missing&#39;, &#39;unavailable&#39;, &#39;stale&#39;].includes(node.availability) |
| label | const | 3692 | no | const label = typeof node.title === &#39;string&#39; &amp;&amp; node.title.trim() ? node.title : node.kind \|\| node.id; |
| button | const | 3693 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;vivim-graph-node&#39; + (node.isFocus ? &#39; is-focus&#39; : &#39;&#39;), &#39;data-kind&#39;: node.kind \|\| &#39;unknown&#39;, &#39;aria-label&#39;: label + (unresolved ? &#39; — unresolved, c… |
| gatherRelations | function | 3714 | no | function gatherRelations(rel = state.relations) { |
| groups | const | 3715 | no | const groups = relationGroups(rel.id, rel.map); |
| renderRelations | function | 3718 | no | function renderRelations(view = &#39;relations&#39;) { |
| workspace | const | 3720 | no | const workspace = view === &#39;workspace&#39;; |
| rel | const | 3721 | no | const rel = state[view]; |
| prefix | const | 3722 | no | const prefix = workspace ? &#39;worldWorkspace&#39; : &#39;worldRelation&#39;; |
| render | function | 3723 | no | const render = () =&gt; renderRelations(view); |
| choices | const | 3725 | no | const choices = relationChoices(); |
| next | const | 3730 | no | const next = select.value; |
| typed | const | 3744 | no | const typed = el(&#39;input&#39;, { id: prefix + &#39;Id&#39;, type: &#39;text&#39;, &#39;aria-label&#39;: &#39;Paste an exact record id&#39;, placeholder: &#39;Or paste an exact record id (c-, p-, n-, o-, s-)&#39; }); |
| show | const | 3747 | no | const show = el(&#39;button&#39;, { type: &#39;button&#39;, id: prefix + &#39;Show&#39;, text: rel.loading ? &#39;Loading relations…&#39; : workspace ? &#39;Explore related items&#39; : &#39;Show relations&#39; }); |
| status | const | 3749 | no | const status = el(&#39;div&#39;, { id: prefix + &#39;Status&#39;, role: &#39;status&#39;, &#39;aria-live&#39;: &#39;polite&#39;, text: rel.status }); |
| error | const | 3750 | no | const error = el(&#39;div&#39;, { class: &#39;err&#39;, id: prefix + &#39;Error&#39;, role: &#39;alert&#39;, text: rel.error }); |
| results | const | 3751 | no | const results = el(&#39;div&#39;, { id: prefix + &#39;Results&#39; }); |
| resultsNote | const | 3752 | no | const resultsNote = el(&#39;p&#39;, { class: &#39;note&#39;, text: &#39;These are local associations kept on this computer. They are not proof that two records are the same thing on a provider.&#39; }); |
| focusIdEl | const | 3754 | no | const focusIdEl = workspace ? el(&#39;p&#39;, { class: &#39;mono&#39;, id: &#39;worldWorkspaceFocus&#39;, text: rel.id \|\| &#39;No starting item selected&#39; }) : null; |
| focusChipBox | const | 3755 | no | const focusChipBox = workspace ? el(&#39;div&#39;, { id: &#39;worldWorkspaceFocusChip&#39; }) : null; |
| focusChip | const | 3756 | no | const focusChip = workspace ? workspaceFocusChip(rel) : null; |
| bounds | const | 3788 | no | const bounds = []; |
| relationEmptyText | function | 3816 | no | function relationEmptyText(map) { |
| runRelations | function | 3823 | no | async function runRelations(id, view = &#39;relations&#39;) { |
| rel | const | 3824 | no | const rel = state[view]; |
| render | function | 3825 | no | const render = () =&gt; renderRelations(view); |
| raw | const | 3826 | no | const raw = typeof id === &#39;string&#39; ? id.trim() : &#39;&#39;; |
| ticket | const | 3834 | no | const ticket = ++relationsTicket; |
| controller | const | 3836 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| params | const | 3843 | no | const params = new URLSearchParams({ id: raw, limit: &#39;100&#39; }); |
| result | const | 3844 | no | const result = await call(&#39;/map?&#39; + params.toString(), { signal: controller?.signal }); |
| clearWorkspaceReading | function | 3862 | no | function clearWorkspaceReading() { |
| findListedRecord | function | 3867 | no | function findListedRecord(id) { |
| hit | const | 3869 | no | const hit = state.lists[kind].items.find((item) =&gt; item?.id === id); |
| workspaceFocusChip | function | 3876 | no | function workspaceFocusChip(rel) { |
| node | const | 3878 | no | const node = (rel.map &amp;&amp; Array.isArray(rel.map.nodes) ? rel.map.nodes : []).find((n) =&gt; n &amp;&amp; n.id === rel.id) ?? null; |
| chip | const | 3879 | no | const chip = readerProvenanceChip(node, findListedRecord(rel.id)); |
| focusReaderHead | function | 3882 | no | function focusReaderHead() { |
| renderWorkspaceReading | function | 3891 | no | function renderWorkspaceReading() { |
| ws | const | 3892 | no | const ws = state.workspace; |
| deployed | const | 3894 | no | const deployed = readerHeadNode &amp;&amp; readerStatusNode |
| children | const | 3903 | no | const children = []; |
| item | const | 3908 | no | const item = ws.item; |
| refocus | const | 3910 | no | const refocus = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldWorkspaceRefocus&#39;, text: &#39;Start from this item&#39; }); |
| openWorkspaceItem | function | 3933 | no | async function openWorkspaceItem(row) { |
| id | const | 3934 | no | const id = row?.id, node = row?.node; |
| ticket | const | 3937 | no | const ticket = workspaceReadTicket; |
| controller | const | 3938 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| ws | const | 3940 | no | const ws = state.workspace; |
| kind | const | 3943 | no | const kind = ID_RE.conversations.test(id) ? &#39;conversations&#39; : ID_RE.projects.test(id) ? &#39;projects&#39; : ID_RE.notes.test(id) ? &#39;notes&#39; : id.startsWith(&#39;o-&#39;) ? &#39;objects&#39; : &#39;selections&#39;; |
| result | const | 3944 | no | const result = await call(`/${kind}/${encodeURIComponent(id)}`, { signal: controller?.signal }); |
| openRelation | function | 3955 | no | async function openRelation(row) { |
| id | const | 3956 | no | const id = row?.id, node = row?.node; |
| COMPOSE_ENDPOINT | const | 3974 | no | const COMPOSE_ENDPOINT = { conversation: &#39;conversations&#39;, project: &#39;projects&#39;, note: &#39;notes&#39;, &#39;source-reference&#39;: &#39;objects&#39;, selection: &#39;selections&#39; }; |
| kindOfRecordId | function | 3976 | no | function kindOfRecordId(id) { |
| composeBucket | function | 3984 | no | function composeBucket(buckets, id, node, why, seen) { |
| kind | const | 3987 | no | const kind = typeof node?.kind === &#39;string&#39; &amp;&amp; node.kind ? node.kind : kindOfRecordId(id); |
| bucket | const | 3988 | no | const bucket = kind === &#39;project&#39; ? buckets.projects |
| composeBuckets | function | 3996 | no | function composeBuckets(conversationId, map) { |
| nodes | const | 3997 | no | const nodes = new Map((Array.isArray(map?.nodes) ? map.nodes : []) .filter((node) =&gt; node &amp;&amp; typeof node.id === &#39;string&#39;).map((node) =&gt; [node.id, node])); |
| buckets | const | 3999 | no | const buckets = { projects: [], notes: [], objects: [], relatedConversations: [] }; |
| seen | const | 4000 | no | const seen = new Set([conversationId]); |
| node | const | 4003 | no | const node = nodes.get(row.id) ?? row.node ?? { id: row.id }; |
| noteIds | const | 4008 | no | const noteIds = Array.isArray(project.node?.noteIds) ? project.node.noteIds : []; |
| ids | const | 4017 | no | const ids = [...(Array.isArray(item?.conversationIds) ? item.conversationIds : []), ...(Array.isArray(item?.memberIds) ? item.memberIds : [])]; |
| composeStatus | function | 4023 | no | function composeStatus(map, buckets) { |
| total | const | 4024 | no | const total = buckets.projects.length + buckets.notes.length + buckets.objects.length + buckets.relatedConversations.length; |
| noun | const | 4025 | no | const noun = total === 1 ? &#39;linked saved item&#39; : &#39;linked saved items&#39;; |
| more | const | 4026 | no | const more = map?.truncated === true \|\| map?.complete === false; |
| composeHydrate | function | 4033 | no | async function composeHydrate(rows, limit = 8) { |
| picked | const | 4034 | no | const picked = rows.slice(0, limit); |
| read | const | 4035 | no | const read = await Promise.all(picked.map(async (row) =&gt; { const endpoint = COMPOSE_ENDPOINT[row.kind]; if (!endpoint \|\| !validWorldId(row.id)) return { ...row, error: &#39;Cannot be read here: unrecogni… |
| endpoint | const | 4036 | no | const endpoint = COMPOSE_ENDPOINT[row.kind]; |
| result | const | 4038 | no | const result = await call(`/${endpoint}/${encodeURIComponent(row.id)}`); |
| loadCompose | function | 4047 | no | async function loadCompose(id) { |
| c | const | 4048 | no | const c = state.compose; |
| raw | const | 4049 | no | const raw = typeof id === &#39;string&#39; ? id.trim() : &#39;&#39;; |
| ticket | const | 4057 | no | const ticket = ++composeTicket; |
| controller | const | 4061 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| params | const | 4068 | no | const params = new URLSearchParams({ id: raw, limit: &#39;100&#39; }); |
| buckets | const | 4082 | no | const buckets = composeBuckets(raw, mapResult.data); |
| composeRowElement | function | 4104 | no | function composeRowElement(row) { |
| chip | const | 4105 | no | const chip = readerProvenanceChip(row.node, row.record ?? null); |
| listed | const | 4106 | no | const listed = findListedRecord(row.id); |
| title | const | 4107 | no | const title = row.record?.title \|\| row.node?.title \|\| listed?.title \|\| row.id; |
| button | const | 4108 | no | const button = el(&#39;button&#39;, { type: &#39;button&#39;, class: &#39;rowbtn&#39;, &#39;aria-label&#39;: `Read ${row.id} on this surface` }, [ el(&#39;span&#39;, { class: &#39;conv-title&#39;, text: title }), el(&#39;span&#39;, { class: &#39;note&#39;, text: … |
| body | const | 4116 | no | const body = typeof row.record?.body === &#39;string&#39; ? row.record.body.replace(/\\s+/g, &#39; &#39;).trim() : &#39;&#39;; |
| composeSection | function | 4125 | no | function composeSection(title, note, rows, emptyText, hidden = 0) { |
| box | const | 4126 | no | const box = el(&#39;section&#39;, { class: &#39;compose-section&#39; }, [ el(&#39;h3&#39;, { text: title }), el(&#39;p&#39;, { class: &#39;note&#39;, text: note }), ]); |
| composeReading | function | 4135 | no | function composeReading() { |
| c | const | 4136 | no | const c = state.compose; |
| head | const | 4137 | no | const head = el(&#39;h3&#39;, { id: &#39;worldComposeReadHead&#39;, tabindex: &#39;-1&#39;, text: &#39;Read here&#39; }); |
| box | const | 4139 | no | const box = el(&#39;section&#39;, { class: &#39;compose-reading&#39; }, [ head, el(&#39;p&#39;, { class: &#39;note&#39;, id: &#39;worldComposeReadStatus&#39;, role: &#39;status&#39;, &#39;aria-live&#39;: &#39;polite&#39;, text: c.readingLoading ? &#39;Loading saved i… |
| item | const | 4145 | no | const item = c.readingItem; |
| composeSurface | function | 4173 | no | function composeSurface() { |
| c | const | 4174 | no | const c = state.compose; |
| conversation | const | 4178 | no | const conversation = c.conversation ?? { id: c.id }; |
| node | const | 4179 | no | const node = (Array.isArray(c.map?.nodes) ? c.map.nodes : []).find((entry) =&gt; entry &amp;&amp; entry.id === c.id) ?? null; |
| surface | const | 4180 | no | const surface = el(&#39;article&#39;, { class: &#39;panel pad local-mark&#39;, id: &#39;worldComposeSurface&#39; }, [ el(&#39;h2&#39;, { text: conversation.title \|\| &#39;Saved conversation&#39; }), el(&#39;p&#39;, { class: &#39;mono&#39;, text: c.id }), c… |
| renderCompose | function | 4208 | no | function renderCompose() { |
| c | const | 4210 | no | const c = state.compose; |
| choices | const | 4211 | no | const choices = relationChoices().filter((choice) =&gt; choice.kind === &#39;conversation&#39;); |
| typed | const | 4218 | no | const typed = el(&#39;input&#39;, { id: &#39;worldComposeId&#39;, type: &#39;text&#39;, &#39;aria-label&#39;: &#39;Paste an exact conversation id&#39;, placeholder: &#39;Or paste an exact conversation id (c-)&#39; }); |
| open | const | 4221 | no | const open = el(&#39;button&#39;, { type: &#39;button&#39;, id: &#39;worldComposeLoad&#39;, text: c.loading ? &#39;Loading workspace…&#39; : &#39;Open this conversation&#39; }); |
| composeOpen | function | 4246 | no | async function composeOpen(row) { |
| c | const | 4247 | no | const c = state.compose; |
| endpoint | const | 4249 | no | const endpoint = COMPOSE_ENDPOINT[row.kind]; |
| ticket | const | 4251 | no | const ticket = ++composeReadTicket; |
| controller | const | 4253 | no | const controller = typeof AbortController === &#39;function&#39; ? new AbortController() : null; |
| result | const | 4259 | no | const result = await call(`/${endpoint}/${encodeURIComponent(row.id)}`, { signal: controller?.signal }); |
| focusComposeReading | function | 4272 | no | function focusComposeReading() { |
| choose | function | 4276 | no | async function choose(view, { quiet = false } = {}) { |
| loads | const | 4365 | no | const loads = [fetchList(view)]; |
| selected | const | 4367 | no | const selected = state.selected[view]; |
| initial | variable | 4373 | no | let initial = &#39;capture&#39;; |
| savedView | const | 4375 | no | const savedView = storeGet(&#39;studio.world.view&#39;); |
| savedSelected | const | 4377 | no | const savedSelected = JSON.parse(storeGet(&#39;studio.world.selected&#39;) \|\| &#39;null&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./native-bridge.mjs | import | 9 | [studio/src/studio/ui/native-bridge.mjs](./native-bridge.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/ui/chat.mjs](./chat.mjs.md) | ./world-view.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/** Saved local world inside the existing /chat shell.
 * Conversations, projects and notes are peer views of shared ids.
 * No home object and no second renderer. Reading and local edits only.
 * Importing this file does nothing until mountWorldView runs.
 */

// Desktop-shell-only native validation bridge. Outside Tauri it reports
// { available: false } and nothing below changes behavior.
import { nativeProbeRequest, validateNativeProgram } from './native-bridge.mjs';

export const WORLD_API = '/api/v1/world';
export const AGENT_API = '/api/v1/personal-agent';
export const PERSONAL_APPS_API = '/api/v1/personal-apps';
const CONVERSATIONS_API = '/api/v1/conversations'; // read-only stored list (list_conversations); never a send
export const PAGE_LIMIT = 50;
export const VIEWS = Object.freeze(['conversations', 'projects', 'notes']);
export const FIND_KINDS = Object.freeze(['message', 'project', 'note', 'task', 'app-note', 'source-reference', 'selection']);
const FIND_LABELS = { message: 'Messages', project: 'Projects', note: 'Notes', task: 'Tasks', 'app-note': 'App notes', 'source-reference': 'Local objects', selection: 'Selections' };
const SHELL_VIEWS = new Set(['capture', 'home', 'agent', 'builder', 'settings', 'find', 'transfer', 'relations', 'workspace', 'compose', ...VIEWS]);
export const AGENT_TRANSITIONS = Object.freeze({ queued: ['active','blocked','cancelled'], active: ['blocked','completed','cancelled'], blocked: ['active','cancelled'], completed: [], cancelled: [] });
const STANDARD_RELATION_BASIS = 'local association; not native equality';
const EXPORT_MODE_LABEL = { references: 'References only — no message text', transcript: 'Transcript — saved message text and simple formatting', 'full-saved': 'Full saved — every recorded block' };
const EXPORT_OMIT_LABEL = { 'reasoning-blocks-excluded': 'Saved reasoning blocks left out', 'tool-activity-blocks-excluded': 'Tool and status activity blocks left out', 'non-transcript-blocks-excluded': 'Blocks Studio does not recognize left out' };
const ID_RE = { conversations: /^c-[a-z0-9-]{1,60}$/, projects: /^p-[a-z0-9-]{1,60}$/, notes: /^n-[a-z0-9-]{1,60}$/ };

const clip = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

export function labelize(key) {
  const spaced = String(key ?? '').replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
  if (!spaced) return 'Detail';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatMeta(value) {
  if (value == null) return 'not recorded';
  if (typeof value === 'string') return clip(value, 180);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    const text = JSON.stringify(value);
    return text ? clip(text, 180) : 'recorded';
  } catch { return 'recorded'; }
}

function integerOrNull(value) { return Number.isInteger(value) ? value : null; }

export function problemText(data) {
  const msg = typeof data?.message === 'string' && data.message ? data.message
    : typeof data?.error === 'string' && data.error ? data.error : '';
  return msg || (typeof data?.code === 'string' && data.code ? data.code : 'Studio rejected this.');
}

export function safeHttp(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}

export function roleLabel(role) {
  if (role === 'user' || role === 'human') return 'You';
  if (role === 'assistant' || role === 'ai' || role === 'model' || role === 'bot') return 'Assistant';
  if (role === 'system') return 'System';
  if (role === 'tool') return 'Tool';
  if (typeof role === 'string' && role.trim()) return role.trim();
  return 'Unknown role';
}

export function redactionNote(redactions) {
  if (redactions == null || redactions === false || redactions === 0) return '';
  if (typeof redactions === 'number') return `Redactions were applied before this was saved (${redactions}). Removed text is not shown.`;
  if (Array.isArray(redactions)) return `Redactions were applied before this was saved (${redactions.length}). Removed text is not shown.`;
  return 'Redactions were applied before this was saved. Removed text is not shown.';
}

export function coverageView(coverage) {
  const c = coverage && typeof coverage === 'object' ? coverage : {};
  const state = typeof c.state === 'string' && c.state ? c.state : 'unknown';
  const labels = {
    missing: ['Saved messages: missing', 't-bad'],
    partial: ['Saved messages: partial', 't-warn'],
```

_First 80 of 4386 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
