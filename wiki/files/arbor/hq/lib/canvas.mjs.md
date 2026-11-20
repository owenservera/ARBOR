# File: hq/lib/canvas.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/canvas.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 43085 B |
| Lines | 899 |
| Hash | 2758fe2a586a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CANVAS_SCHEMA | const | 19 | yes | export const CANVAS_SCHEMA = &#39;hq.canvas/1&#39;; |
| CANVAS_ROOT_ID | const | 22 | yes | export const CANVAS_ROOT_ID = &#39;hq-canvas&#39;; |
| DEFAULT_TASKS_FILE | const | 25 | yes | export const DEFAULT_TASKS_FILE = &#39;C:/VIVIM/channel/tasks/active-tasks.md&#39;; |
| BLOCKED_CAP | const | 28 | no | const BLOCKED_CAP = 60; |
| BLOCKED_GROUP_CAP | const | 31 | no | const BLOCKED_GROUP_CAP = 8; |
| ROSTER_BLOCKING_DEFECTS | const | 34 | no | const ROSTER_BLOCKING_DEFECTS = new Set([&#39;agent-dir-missing&#39;, &#39;seat-roster-unreadable&#39;, &#39;session-db-unreadable&#39;]); |
| ROSTER_BLOCKING_NOTE | const | 37 | no | const ROSTER_BLOCKING_NOTE = /(seats could not be read\|agent definitions could not be read\|team snapshot could not be built\|snapshot was not an object)/i; |
| DEFECT_AGENT_CAP | const | 40 | no | const DEFECT_AGENT_CAP = 12; |
| NOTE_CAP | const | 43 | no | const NOTE_CAP = 12; |
| SEAT_STATES | const | 45 | no | const SEAT_STATES = [&#39;ACTIVE&#39;, &#39;IDLE&#39;, &#39;NO_SESSION&#39;, &#39;UNKNOWN&#39;]; |
| PROVIDER_STATES | const | 46 | no | const PROVIDER_STATES = [&#39;healthy&#39;, &#39;unproven&#39;, &#39;broken&#39;, &#39;capped&#39;, &#39;budget-blocked&#39;, &#39;unknown&#39;]; |
| UNAVAILABLE_PROVIDER_STATES | const | 47 | no | const UNAVAILABLE_PROVIDER_STATES = new Set([&#39;broken&#39;, &#39;capped&#39;, &#39;budget-blocked&#39;]); |
| isObject | function | 54 | no | function isObject(value) { |
| strOrNull | function | 59 | no | function strOrNull(value) { |
| numOrNull | function | 64 | no | function numOrNull(value) { |
| n | const | 66 | no | const n = Number(value); |
| messageOf | function | 71 | no | function messageOf(error) { |
| toMap | function | 77 | no | function toMap(value) { |
| normalizeSeat | function | 85 | no | function normalizeSeat(value, index) { |
| s | const | 86 | no | const s = /** @type {any} */ (isObject(value) ? value : {}); |
| id | const | 87 | no | const id = strOrNull(s.id) ?? `seat-${index + 1}`; |
| state | const | 88 | no | const state = typeof s.state === &#39;string&#39; &amp;&amp; SEAT_STATES.includes(s.state.toUpperCase()) ? s.state.toUpperCase() : &#39;UNKNOWN&#39;; |
| normalizeProvider | function | 103 | no | function normalizeProvider(key, value) { |
| v | const | 104 | no | const v = /** @type {any} */ (isObject(value) ? value : {}); |
| health | const | 105 | no | const health = /** @type {any} */ (isObject(v.health) ? v.health : {}); |
| state | const | 106 | no | const state = typeof health.state === &#39;string&#39; &amp;&amp; PROVIDER_STATES.includes(health.state.toLowerCase()) |
| slash | const | 109 | no | const slash = String(key).indexOf(&#39;/&#39;); |
| splitTableRow | function | 130 | no | function splitTableRow(line) { |
| src | variable | 131 | no | let src = String(line).trim(); |
| cells | const | 135 | no | const cells = []; |
| buf | variable | 136 | no | let buf = &#39;&#39;; |
| ch | const | 138 | no | const ch = src[i]; |
| isSeparatorRow | function | 148 | no | function isSeparatorRow(cells) { |
| sectionBody | function | 159 | no | function sectionBody(text, heading) { |
| lines | const | 160 | no | const lines = String(text ?? &#39;&#39;).split(/\\r?\\n/); |
| start | const | 161 | no | const start = lines.findIndex((line) =&gt; heading.test(line)); |
| tableRows | function | 176 | no | function tableRows(body) { |
| header | variable | 178 | no | let header = null; |
| rows | const | 180 | no | const rows = []; |
| trimmed | const | 182 | no | const trimmed = line.trim(); |
| cells | const | 184 | no | const cells = splitTableRow(trimmed); |
| columnIndex | function | 200 | no | function columnIndex(header, names, fallback) { |
| idx | const | 203 | no | const idx = header.findIndex((cell) =&gt; String(cell).toLowerCase().replace(/[^a-z0-9 ]+/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim() === name); |
| cleanCell | function | 211 | no | function cleanCell(cell) { |
| parseBlockedTable | function | 225 | yes | export function parseBlockedTable(text) { |
| body | const | 227 | no | const body = sectionBody(text, /^##\\s+Blocked\\b/i); |
| iTarget | const | 230 | no | const iTarget = columnIndex(header, [&#39;conversation&#39;, &#39;target&#39;, &#39;thread&#39;, &#39;task&#39;], 0); |
| iReason | const | 231 | no | const iReason = columnIndex(header, [&#39;blocker&#39;, &#39;reason&#39;, &#39;detail&#39;], 1); |
| iOwner | const | 232 | no | const iOwner = columnIndex(header, [&#39;owner action needed&#39;, &#39;owner action&#39;, &#39;owner&#39;, &#39;action&#39;], 2); |
| iProof | const | 233 | no | const iProof = columnIndex(header, [&#39;proof&#39;, &#39;evidence&#39;, &#39;session&#39;], 3); |
| out | const | 236 | no | const out = []; |
| target | const | 238 | no | const target = cleanCell(cells[iTarget]); |
| reason | const | 239 | no | const reason = cleanCell(cells[iReason]).replace(/^Unblock:\\s*/i, &#39;&#39;); |
| ownerAction | const | 241 | no | const ownerAction = cleanCell(cells[iOwner]) \|\| null; |
| proofCell | const | 242 | no | const proofCell = cleanCell(cells[iProof]); |
| proofMatch | const | 243 | no | const proofMatch = proofCell.match(/sess_[A-Za-z0-9-]+/); |
| parseUnboundSeats | function | 256 | no | function parseUnboundSeats(text) { |
| body | const | 258 | no | const body = sectionBody(text, /^##\\s+Tasks\\b/i); |
| iSeat | const | 261 | no | const iSeat = columnIndex(header, [&#39;seat&#39;, &#39;owner&#39;, &#39;agent&#39;], 2); |
| count | variable | 262 | no | let count = 0; |
| hasBlockedSection | function | 270 | no | function hasBlockedSection(text) { |
| normaliseSignature | function | 281 | no | function normaliseSignature(reason) { |
| groupBlocked | function | 295 | no | function groupBlocked(rows) { |
| groups | const | 297 | no | const groups = new Map(); |
| signature | const | 299 | no | const signature = normaliseSignature(row.reason) \|\| &#39;(no reason given)&#39;; |
| key | const | 300 | no | const key = signature.toLowerCase(); |
| group | const | 301 | no | const group = groups.get(key); |
| truncateText | function | 313 | no | function truncateText(text, max) { |
| s | const | 314 | no | const s = String(text ?? &#39;&#39;); |
| buildDecisions | function | 328 | no | function buildDecisions(providers, groups, notes, defects) { |
| out | const | 330 | no | const out = []; |
| severity | const | 332 | no | const severity = { broken: 0, &#39;budget-blocked&#39;: 1, capped: 2, unproven: 3, unknown: 4 }; |
| badProviders | const | 333 | no | const badProviders = (providers \|\| []) |
| group | const | 347 | no | const group = groups[0]; |
| placeholder | const | 350 | no | const placeholder = /placeholder thread/i.test(group.signature); |
| note | const | 360 | no | const note = notes.find((entry) =&gt; ROSTER_BLOCKING_NOTE.test(entry)); |
| defect | const | 361 | no | const defect = (defects \|\| []).find((entry) =&gt; ROSTER_BLOCKING_DEFECTS.has(String(entry.kind))); |
| buildCanvasModel | function | 387 | yes | export function buildCanvasModel(sources = {}, opts = {}) { |
| src | const | 388 | no | const src = /** @type {any} */ (isObject(sources) ? sources : {}); |
| options | const | 389 | no | const options = /** @type {any} */ (isObject(opts) ? opts : {}); |
| notes | const | 391 | no | const notes = []; |
| now | const | 392 | no | const now = typeof src.now === &#39;number&#39; &amp;&amp; Number.isFinite(src.now) |
| snapshot | variable | 397 | no | let snapshot = src.snapshot; |
| generatedAt | const | 412 | no | const generatedAt = strOrNull(snapshot.generatedAt) ?? new Date(now).toISOString(); |
| seats | variable | 417 | no | let seats = null; |
| healthMap | const | 425 | no | const healthMap = toMap(snapshot.providerHealth); |
| providers | variable | 427 | no | let providers = null; |
| tasks | const | 437 | no | const tasks = isObject(snapshot.tasks) ? snapshot.tasks : null; |
| queue | const | 439 | no | const queue = { |
| tasksText | variable | 451 | no | let tasksText = null; |
| file | const | 457 | no | const file = src.tasksFile === null |
| blocked | variable | 472 | no | let blocked = tasksText === null ? [] : parseBlockedTable(tasksText); |
| agents | const | 484 | no | const agents = Array.isArray(snapshot.agents) ? snapshot.agents : null; |
| defects | const | 485 | no | const defects = Array.isArray(snapshot.defects) ? snapshot.defects.filter(isObject) : null; |
| org | const | 490 | no | const org = { |
| modelCounts | const | 501 | no | const modelCounts = new Map(); |
| withProtocol | variable | 502 | no | let withProtocol = 0; |
| withContext7 | variable | 503 | no | let withContext7 = 0; |
| agent | const | 505 | no | const agent = isObject(raw) ? raw : {}; |
| model | const | 506 | no | const model = strOrNull(agent.model) ?? &#39;inherit&#39;; |
| names | const | 519 | no | const names = new Set(); |
| name | const | 521 | no | const name = strOrNull(defect.agent); |
| nextMoves | variable | 529 | no | let nextMoves = null; |
| blockedGroups | const | 541 | no | const blockedGroups = groupBlocked(blocked); |
| decisions | const | 542 | no | const decisions = buildDecisions(providers, blockedGroups, notes, defects); |
| buildVerdict | function | 568 | no | function buildVerdict(seats, queue, providers) { |
| seatPart | const | 569 | no | const seatPart = seats === null |
| queuePart | const | 572 | no | const queuePart = queue.open === null &amp;&amp; queue.blocked === null |
| broken | const | 575 | no | const broken = providers === null |
| providerPart | const | 578 | no | const providerPart = providers === null |
| CSS | const | 590 | no | const CSS = [ |
| JS | const | 599 | no | const JS = `(function () { var root = document.getElementById(&#39;hq-canvas&#39;); if (!root) return; var rows = root.querySelectorAll(&#39;[data-blocked-row]&#39;); var groups = root.querySelectorAll(&#39;[data-blocke… |
| root | variable | 600 | no | var root = document.getElementById(&#39;hq-canvas&#39;); |
| rows | variable | 602 | no | var rows = root.querySelectorAll(&#39;[data-blocked-row]&#39;); |
| groups | variable | 603 | no | var groups = root.querySelectorAll(&#39;[data-blocked-group]&#39;); |
| buttons | variable | 604 | no | var buttons = root.querySelectorAll(&#39;[data-filter]&#39;); |
| count | variable | 605 | no | var count = root.querySelector(&#39;[data-blocked-count]&#39;); |
| current | variable | 606 | no | var current = &#39;all&#39;; |
| z | variable | 608 | no | var z = window.zcode; |
| saved | variable | 609 | no | var saved = z &amp;&amp; z.widgetState &amp;&amp; z.widgetState.privateContent &amp;&amp; z.widgetState.privateContent.blockedFilter; |
| apply | function | 612 | no | function apply(next, persist) { |
| shown | variable | 614 | no | var shown = 0; |
| row | variable | 616 | no | var row = rows[i]; |
| unbound | variable | 617 | no | var unbound = row.getAttribute(&#39;data-owner&#39;) === &#39;unbound&#39;; |
| hide | variable | 618 | no | var hide = next === &#39;unbound&#39; ? !unbound : (next === &#39;bound&#39; ? unbound : false); |
| groupRows | variable | 623 | no | var groupRows = groups[g].querySelectorAll(&#39;[data-blocked-row]&#39;); |
| visible | variable | 624 | no | var visible = 0; |
| actions | variable | 642 | no | var actions = root.querySelectorAll(&#39;[data-prompt]&#39;); |
| cell | function | 654 | no | function cell(value) { |
| seatBadge | function | 659 | no | function seatBadge(state) { |
| s | const | 660 | no | const s = typeof state === &#39;string&#39; &amp;&amp; SEAT_STATES.includes(state) ? state : &#39;UNKNOWN&#39;; |
| providerBadge | function | 665 | no | function providerBadge(state) { |
| s | const | 666 | no | const s = typeof state === &#39;string&#39; &amp;&amp; PROVIDER_STATES.includes(state) ? state : &#39;unknown&#39;; |
| cls | const | 667 | no | const cls = UNAVAILABLE_PROVIDER_STATES.has(s) ? &#39;viz-badge text-destructive&#39; : (s === &#39;unknown&#39; ? &#39;viz-badge text-muted&#39; : &#39;viz-badge&#39;); |
| renderDetails | function | 672 | no | function renderDetails(summary, inner) { |
| summaryText | function | 677 | no | function summaryText(label, text) { |
| decisionPrompt | function | 682 | no | function decisionPrompt(decision) { |
| renderDecisions | function | 687 | no | function renderDecisions(decisions) { |
| cards | const | 689 | no | const cards = decisions.map((raw) =&gt; { const decision = isObject(raw) ? raw : {}; const title = strOrNull(decision.title) ?? &#39;Decision&#39;; const why = strOrNull(decision.why) ?? &#39;&#39;; const command = str… |
| decision | const | 690 | no | const decision = isObject(raw) ? raw : {}; |
| title | const | 691 | no | const title = strOrNull(decision.title) ?? &#39;Decision&#39;; |
| why | const | 692 | no | const why = strOrNull(decision.why) ?? &#39;&#39;; |
| command | const | 693 | no | const command = strOrNull(decision.command) ?? &#39;&#39;; |
| renderSeats | function | 700 | no | function renderSeats(seats) { |
| rows | const | 703 | no | const rows = seats.map((seat) =&gt; { const title = seat.title ? ` &lt;span class=&quot;text-small text-muted&quot;&gt;${escapeHtml(seat.title)}&lt;/span&gt;` : &#39;&#39;; return `&lt;tr&gt;&lt;td&gt;${escapeHtml(seat.id)}${title}&lt;/td&gt;&lt;td&gt;${se… |
| title | const | 704 | no | const title = seat.title ? ` &lt;span class=&quot;text-small text-muted&quot;&gt;${escapeHtml(seat.title)}&lt;/span&gt;` : &#39;&#39;; |
| statCard | function | 711 | no | function statCard(label, value) { |
| renderOrg | function | 716 | no | function renderOrg(org, notes) { |
| ratio | function | 717 | no | const ratio = (n, d) =&gt; (n === null \|\| d === null ? &#39;?&#39; : `${n}/${d}`); |
| stats | const | 718 | no | const stats = [ |
| models | const | 724 | no | const models = org.models.length |
| defectAgents | variable | 727 | no | let defectAgents = &#39;&#39;; |
| shown | const | 729 | no | const shown = org.defectAgents.slice(0, DEFECT_AGENT_CAP); |
| extra | const | 730 | no | const extra = org.defectAgents.length - shown.length; |
| renderBar | function | 737 | no | function renderBar(ok, err) { |
| total | const | 738 | no | const total = ok + err; |
| label | const | 739 | no | const label = total &gt; 0 ? `${ok} ok, ${err} error` : &#39;no calls observed&#39;; |
| okPct | const | 741 | no | const okPct = (ok / total) * 100; |
| errPct | const | 742 | no | const errPct = 100 - okPct; |
| routePrompt | function | 747 | no | function routePrompt(provider) { |
| renderProviders | function | 752 | no | function renderProviders(providers) { |
| rows | const | 755 | no | const rows = providers.map((provider) =&gt; { const model = provider.model &amp;&amp; provider.model !== provider.key ? ` &lt;span class=&quot;text-small text-muted&quot;&gt;${escapeHtml(provider.model)}&lt;/span&gt;` : &#39;&#39;; const er… |
| model | const | 756 | no | const model = provider.model &amp;&amp; provider.model !== provider.key ? ` &lt;span class=&quot;text-small text-muted&quot;&gt;${escapeHtml(provider.model)}&lt;/span&gt;` : &#39;&#39;; |
| errClass | const | 757 | no | const errClass = provider.err &gt; 0 ? &#39;tabular-nums text-destructive&#39; : &#39;tabular-nums&#39;; |
| action | const | 758 | no | const action = provider.state === &#39;healthy&#39; |
| investigatePrompt | function | 767 | no | function investigatePrompt(row) { |
| renderBlockedRow | function | 772 | no | function renderBlockedRow(row) { |
| reason | const | 773 | no | const reason = String(row.reason ?? &#39;&#39;); |
| shown | const | 774 | no | const shown = reason.length &gt; 140 ? `${reason.slice(0, 139)}…` : reason; |
| owner | const | 775 | no | const owner = String(row.ownerAction ?? &#39;&#39;).trim(); |
| ownerCell | const | 776 | no | const ownerCell = owner === &#39;unbound&#39; |
| proof | const | 779 | no | const proof = row.proof ? `&lt;div class=&quot;text-small text-muted&quot;&gt;&lt;code&gt;${escapeHtml(row.proof)}&lt;/code&gt;&lt;/div&gt;` : &#39;&#39;; |
| reasonCell | const | 780 | no | const reasonCell = reason |
| action | const | 783 | no | const action = `&lt;button type=&quot;button&quot; class=&quot;btn btn-ghost btn-xs&quot; data-prompt=&quot;${escapeHtml(investigatePrompt(row))}&quot; data-title=&quot;Investigate blocked task&quot;&gt;investigate&lt;/button&gt;`; |
| ownerAttr | const | 784 | no | const ownerAttr = owner === &#39;unbound&#39; ? &#39;unbound&#39; : &#39;bound&#39;; |
| renderBlockedDetails | function | 789 | no | function renderBlockedDetails(blocked, groups, queue) { |
| stats | const | 790 | no | const stats = [ |
| statsHtml | const | 797 | no | const statsHtml = `&lt;div class=&quot;viz-grid&quot;&gt;${stats.join(&#39;&#39;)}&lt;/div&gt;`; |
| controls | const | 799 | no | const controls = `&lt;div class=&quot;viz-row&quot; role=&quot;group&quot; aria-label=&quot;Filter blocked rows&quot;&gt;&lt;button type=&quot;button&quot; class=&quot;btn btn-sm&quot; data-filter=&quot;all&quot; aria-pressed=&quot;true&quot;&gt;All&lt;/button&gt; &lt;button type=&quot;button&quot; … |
| shownGroups | const | 800 | no | const shownGroups = groups.slice(0, BLOCKED_GROUP_CAP); |
| groupHtml | const | 801 | no | const groupHtml = shownGroups.map((raw) =&gt; { const group = isObject(raw) ? raw : {}; const memberRows = Array.isArray(group.rows) ? group.rows.filter(isObject) : []; const count = numOrNull(group.cou… |
| group | const | 802 | no | const group = isObject(raw) ? raw : {}; |
| memberRows | const | 803 | no | const memberRows = Array.isArray(group.rows) ? group.rows.filter(isObject) : []; |
| count | const | 804 | no | const count = numOrNull(group.count) ?? memberRows.length; |
| signature | const | 805 | no | const signature = strOrNull(group.signature) ?? &#39;(no reason given)&#39;; |
| rows | const | 806 | no | const rows = memberRows.map(renderBlockedRow).join(&#39;&#39;); |
| summary | const | 807 | no | const summary = `&lt;span class=&quot;tabular-nums&quot;&gt;${escapeHtml(count)} ×&lt;/span&gt; ${escapeHtml(signature)}`; |
| more | const | 810 | no | const more = groups.length &gt; BLOCKED_GROUP_CAP |
| renderMoves | function | 817 | no | function renderMoves(moves) { |
| rows | const | 820 | no | const rows = moves.map((move) =&gt; `&lt;tr&gt;&lt;td&gt;&lt;span class=&quot;viz-badge&quot;&gt;${cell(move.kind)}&lt;/span&gt;&lt;/td&gt;&lt;td&gt;&lt;code class=&quot;text-small&quot;&gt;${cell(move.target)}&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code class=&quot;text-small&quot;&gt;${cell(move.a… |
| renderNotes | function | 825 | no | function renderNotes(notes) { |
| shown | const | 827 | no | const shown = notes.slice(0, NOTE_CAP); |
| extra | const | 828 | no | const extra = notes.length - shown.length; |
| items | const | 829 | no | const items = shown.map((note) =&gt; `&lt;li&gt;${escapeHtml(note)}&lt;/li&gt;`).join(&#39;&#39;); |
| more | const | 830 | no | const more = extra &gt; 0 ? `&lt;li&gt;(+${extra} more)&lt;/li&gt;` : &#39;&#39;; |
| renderCanvasFragment | function | 845 | yes | export function renderCanvasFragment(model, opts = {}) { |
| m | const | 846 | no | const m = /** @type {any} */ (isObject(model) ? model : {}); |
| generatedAt | const | 847 | no | const generatedAt = strOrNull(m.generatedAt) ?? &#39;&#39;; |
| verdict | const | 848 | no | const verdict = isObject(m.verdict) &amp;&amp; typeof m.verdict.text === &#39;string&#39; ? m.verdict.text : &#39;no verdict available&#39;; |
| org | const | 849 | no | const org = isObject(m.org) |
| seats | const | 859 | no | const seats = m.seats === undefined ? null : m.seats; |
| providers | const | 860 | no | const providers = m.providers === undefined ? null : m.providers; |
| moves | const | 861 | no | const moves = m.nextMoves === undefined ? null : m.nextMoves; |
| blocked | const | 862 | no | const blocked = Array.isArray(m.blocked) ? m.blocked.filter(isObject) : []; |
| groups | const | 863 | no | const groups = Array.isArray(m.blockedGroups) ? m.blockedGroups.filter(isObject) : []; |
| decisions | const | 864 | no | const decisions = Array.isArray(m.decisions) ? m.decisions : []; |
| notes | const | 865 | no | const notes = Array.isArray(m.notes) ? m.notes.filter((note) =&gt; typeof note === &#39;string&#39;) : []; |
| queue | const | 866 | no | const queue = isObject(m.queue) |
| seatsValue | const | 870 | no | const seatsValue = Array.isArray(seats) ? seats : null; |
| providersValue | const | 871 | no | const providersValue = Array.isArray(providers) ? providers : null; |
| movesValue | const | 872 | no | const movesValue = Array.isArray(moves) ? moves : null; |
| activeSeats | const | 873 | no | const activeSeats = seatsValue ? seatsValue.filter((seat) =&gt; seat.state === &#39;ACTIVE&#39;).length : 0; |
| badProviders | const | 874 | no | const badProviders = providersValue ? providersValue.filter((provider) =&gt; provider.state !== &#39;healthy&#39;).length : 0; |
| seatHeadline | const | 876 | no | const seatHeadline = seatsValue === null ? &#39;unreadable · 0 shown&#39; : `${seatsValue.length} seats · ${activeSeats} active`; |
| orgHeadline | const | 877 | no | const orgHeadline = org.agents === null ? &#39;unreadable · 0 read&#39; : `${org.agents} agents · ${org.defectCount ?? 0} defects · ${notes.length} notes`; |
| providerHeadline | const | 878 | no | const providerHeadline = providersValue === null ? &#39;unreadable · 0 shown&#39; : `${providersValue.length} providers · ${badProviders} not healthy`; |
| blockedHeadline | const | 879 | no | const blockedHeadline = `${blocked.length} rows · ${groups.length} groups`; |
| movesHeadline | const | 880 | no | const movesHeadline = movesValue === null ? &#39;unreadable · 0 shown&#39; : `${movesValue.length} moves`; |
| verdictLine | const | 882 | no | const verdictLine = `&lt;p&gt;${escapeHtml(verdict)} &lt;span class=&quot;text-small text-muted&quot;&gt;generated &lt;time datetime=&quot;${escapeHtml(generatedAt)}&quot;&gt;${escapeHtml(generatedAt \|\| &#39;unknown&#39;)}&lt;/time&gt;&lt;/span&gt;&lt;/p&gt;`; |
| needsOwner | const | 883 | no | const needsOwner = `&lt;section aria-label=&quot;Needs the owner&quot;&gt;&lt;div class=&quot;text-small text-muted&quot;&gt;NEEDS THE OWNER&lt;/div&gt;${renderDecisions(decisions)}&lt;/section&gt;`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 14 | external |
| ./team-panel.mjs | import | 15 | [hq/lib/team-panel.mjs](./team-panel.mjs.md) |
| ./team-dashboard.mjs | import | 16 | [hq/lib/team-dashboard.mjs](./team-dashboard.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/canvas.mjs |
| [hq/lib/pmo.mjs](./pmo.mjs.md) | ./canvas.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Inline-fragment renderer for the ZCode Desktop UI: one conversation message that shows live team state. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | team-canvas |
| 6 | invariant | — | — | read-only; the fragment carries no network call, no external resource and no effect of its own. |
| 7 | invariant | — | — | the host design system owns typography, colour and controls; this file supplies layout only. |
| 8 | invariant | — | — | every dynamic string passes through escapeHtml; the model is total and never throws on bad input. |
| 9 | why | — | — | A full document cannot be embedded in a message, so this emits a fragment: stacked sections, no tabs, |
| 11 | see | — | hq/lib/team-panel.mjs | hq/lib/team-panel.mjs |
| 12 | see | — | hq/lib/team-dashboard.mjs | hq/lib/team-dashboard.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Inline-fragment renderer for the ZCode Desktop UI: one conversation message that shows live team state.
 * @hq:owner hq-agent
 * @hq:task team-canvas
 * @hq:invariant read-only; the fragment carries no network call, no external resource and no effect of its own.
 * @hq:invariant the host design system owns typography, colour and controls; this file supplies layout only.
 * @hq:invariant every dynamic string passes through escapeHtml; the model is total and never throws on bad input.
 * @hq:why A full document cannot be embedded in a message, so this emits a fragment: stacked sections, no tabs,
 *        no accordions, readable with scripting disabled, and one root id for the host to replace in place.
 * @hq:see hq/lib/team-panel.mjs
 * @hq:see hq/lib/team-dashboard.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { buildTeamSnapshot, PROTOCOL_SKILL } from './team-panel.mjs';
import { escapeHtml } from './team-dashboard.mjs';

/** The schema tag on every model this module builds. */
export const CANVAS_SCHEMA = 'hq.canvas/1';

/** The only id in the fragment; the host swaps the element with this id. */
export const CANVAS_ROOT_ID = 'hq-canvas';

/** Where the live task queue lives; blocked rows are read from this file by default. */
export const DEFAULT_TASKS_FILE = 'C:/VIVIM/channel/tasks/active-tasks.md';

/** How many blocked rows the model carries before it has to summarise the rest. */
const BLOCKED_CAP = 60;

/** How many blocked groups the default view shows; the rest stay in the task queue. */
const BLOCKED_GROUP_CAP = 8;

/** Defect kinds that stop the roster itself from being read. */
const ROSTER_BLOCKING_DEFECTS = new Set(['agent-dir-missing', 'seat-roster-unreadable', 'session-db-unreadable']);

/** Notes that mean the panel could not read the roster at all. */
const ROSTER_BLOCKING_NOTE = /(seats could not be read|agent definitions could not be read|team snapshot could not be built|snapshot was not an object)/i;

/** How many defect-named agents the ORG section lists before summarising the rest. */
const DEFECT_AGENT_CAP = 12;

/** How many notes the verdict card lists before summarising the rest. */
const NOTE_CAP = 12;

const SEAT_STATES = ['ACTIVE', 'IDLE', 'NO_SESSION', 'UNKNOWN'];
const PROVIDER_STATES = ['healthy', 'unproven', 'broken', 'capped', 'budget-blocked', 'unknown'];
const UNAVAILABLE_PROVIDER_STATES = new Set(['broken', 'capped', 'budget-blocked']);

// ---------------------------------------------------------------------------
// Small total helpers: every read of caller-supplied data goes through these.
// ---------------------------------------------------------------------------

/** @param {unknown} value @returns {value is Record<string, any>} */
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** @param {unknown} value @returns {string|null} */
function strOrNull(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

/** @param {unknown} value @returns {number|null} */
function numOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** @param {unknown} error @returns {string} */
function messageOf(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** @param {unknown} value @returns {Map<string, any>|null} */
function toMap(value) {
  if (value instanceof Map) return /** @type {Map<string, any>} */ (value);
  if (isObject(value)) return new Map(Object.entries(value));
  return null;
```

_First 80 of 900 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
