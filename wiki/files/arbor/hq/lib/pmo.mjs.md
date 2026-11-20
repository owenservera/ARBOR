# File: hq/lib/pmo.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/pmo.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 43388 B |
| Lines | 978 |
| Hash | 5659b694c293 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PMO_SCHEMA | const | 22 | yes | export const PMO_SCHEMA = &#39;hq.pmo/1&#39;; |
| PM_ROOT_ID | const | 25 | yes | export const PM_ROOT_ID = &#39;hq-pm&#39;; |
| SIGNATURE_DISPLAY_MAX | const | 28 | no | const SIGNATURE_DISPLAY_MAX = 200; |
| TITLE_DISPLAY_MAX | const | 31 | no | const TITLE_DISPLAY_MAX = 90; |
| DECISION_CAP | const | 34 | no | const DECISION_CAP = 3; |
| isObject | function | 41 | no | function isObject(value) { |
| strOrNull | function | 46 | no | function strOrNull(value) { |
| numOrNull | function | 51 | no | function numOrNull(value) { |
| n | const | 53 | no | const n = Number(value); |
| messageOf | function | 58 | no | function messageOf(error) { |
| oneDecimal | function | 65 | no | function oneDecimal(value) { |
| truncate | function | 70 | no | function truncate(value, max) { |
| s | const | 71 | no | const s = String(value ?? &#39;&#39;); |
| collapse | function | 77 | no | function collapse(value) { |
| tableCells | function | 92 | no | function tableCells(line) { |
| src | variable | 93 | no | let src = String(line ?? &#39;&#39;).trim(); |
| cells | const | 98 | no | const cells = []; |
| buf | variable | 99 | no | let buf = &#39;&#39;; |
| ch | const | 101 | no | const ch = src[i]; |
| isSeparatorRow | function | 111 | no | function isSeparatorRow(cells) { |
| headerKey | function | 117 | no | function headerKey(value) { |
| columnIndex | function | 129 | no | function columnIndex(header, names, fallback) { |
| keys | const | 131 | no | const keys = header.map(headerKey); |
| idx | const | 133 | no | const idx = keys.indexOf(name); |
| statusKey | function | 145 | no | function statusKey(status) { |
| isAcceptedStatus | function | 160 | no | function isAcceptedStatus(status) { |
| key | const | 161 | no | const key = statusKey(status); |
| isBlockedStatus | function | 168 | no | function isBlockedStatus(status) { |
| key | const | 169 | no | const key = statusKey(status); |
| loadQeue | function | 189 | yes | export function loadQeue(dir) { |
| notes | const | 191 | no | const notes = []; |
| lanes | const | 193 | no | const lanes = []; |
| root | const | 198 | no | const root = resolve(dir); |
| names | variable | 205 | no | let names = []; |
| file | const | 214 | no | const file = join(root, name); |
| parsed | variable | 216 | no | let parsed = null; |
| lane | const | 227 | no | const lane = strOrNull(parsed.lane) ?? basename(name, &#39;.json&#39;); |
| records | const | 229 | no | const records = []; |
| id | const | 235 | no | const id = strOrNull(raw.id); |
| total | const | 255 | no | const total = lanes.reduce((sum, lane) =&gt; sum + lane.records.length, 0); |
| loadInitiatives | function | 269 | yes | export function loadInitiatives(text) { |
| notes | const | 271 | no | const notes = []; |
| rows | const | 273 | no | const rows = []; |
| lines | const | 279 | no | const lines = text.split(/\\r?\\n/); |
| start | variable | 281 | no | let start = -1; |
| header | variable | 283 | no | let header = null; |
| cells | const | 285 | no | const cells = tableCells(lines[i]); |
| keys | const | 287 | no | const keys = cells.map(headerKey); |
| iId | const | 299 | no | const iId = columnIndex(header, [&#39;id&#39;], 0); |
| iTitle | const | 300 | no | const iTitle = columnIndex(header, [&#39;initiative&#39;, &#39;title&#39;, &#39;name&#39;], 1); |
| iState | const | 301 | no | const iState = columnIndex(header, [&#39;state&#39;, &#39;status&#39;], 3); |
| iGate | const | 302 | no | const iGate = columnIndex(header, [&#39;gate&#39;], 5); |
| iPhase | const | 303 | no | const iPhase = columnIndex(header, [&#39;phase&#39;], 6); |
| iOwner | const | 304 | no | const iOwner = columnIndex(header, [&#39;owner decision&#39;, &#39;owner&#39;], 7); |
| line | const | 307 | no | const line = lines[i]; |
| cells | const | 310 | no | const cells = tableCells(line); |
| id | const | 313 | no | const id = collapse(cells[iId]); |
| idsIn | function | 340 | no | function idsIn(text, ids) { |
| found | const | 342 | no | const found = []; |
| re | const | 343 | no | const re = /\\b([A-Za-z][A-Za-z0-9]*-[0-9]{3})\\b/g; |
| isNumericCell | function | 354 | no | function isNumericCell(cell) { |
| value | const | 355 | no | const value = String(cell ?? &#39;&#39;).replace(/[`*\\s]/g, &#39;&#39;); |
| scanCitations | function | 371 | no | function scanCitations(text, ids) { |
| out | const | 373 | no | const out = new Map(); |
| lines | const | 376 | no | const lines = text.split(/\\r?\\n/); |
| section | variable | 377 | no | let section = &#39;&#39;; |
| header | variable | 379 | no | let header = null; |
| heading | const | 382 | no | const heading = line.match(/^#{1,6}\\s+(.+?)\\s*$/); |
| cells | const | 388 | no | const cells = tableCells(line); |
| cited | const | 395 | no | const cited = idsIn(cells.join(&#39; \| &#39;), ids); |
| iOwner | const | 401 | no | const iOwner = columnIndex(header, [&#39;seat&#39;, &#39;owner&#39;, &#39;owner action needed&#39;, &#39;owner action&#39;, &#39;agent&#39;], -1); |
| ownerCell | const | 402 | no | const ownerCell = iOwner === -1 ? &#39;&#39; : collapse(cells[iOwner]).toLowerCase(); |
| namesOwner | const | 403 | no | const namesOwner = ownerCell !== &#39;&#39; &amp;&amp; ownerCell !== &#39;unbound&#39; &amp;&amp; ownerCell !== &#39;—&#39; &amp;&amp; ownerCell !== &#39;-&#39;; |
| evidence | const | 404 | no | const evidence = isNumericCell(cells[cells.length - 1]) \|\| /sess_[A-Za-z0-9-]+/.test(line); |
| blockedRow | const | 405 | no | const blockedRow = /^blocked\\b/.test(section); |
| entry | const | 408 | no | const entry = out.get(id) ?? { claimed: false, blocked: false, evidence: false, owner: false }; |
| normaliseSignature | function | 429 | no | function normaliseSignature(reason) { |
| groupBlocked | function | 441 | no | function groupBlocked(rows) { |
| groups | const | 443 | no | const groups = new Map(); |
| signature | const | 445 | no | const signature = normaliseSignature(row.reason) \|\| &#39;(no reason given)&#39;; |
| key | const | 446 | no | const key = signature.toLowerCase(); |
| group | const | 447 | no | const group = groups.get(key); |
| isNoneDecision | function | 460 | no | function isNoneDecision(value) { |
| text | const | 461 | no | const text = collapse(value); |
| buildDecisions | function | 475 | no | function buildDecisions(initiatives, groups, lanes) { |
| out | const | 477 | no | const out = []; |
| initiative | const | 480 | no | const initiative = initiatives.find((row) =&gt; !isNoneDecision(row.ownerDecision)); |
| group | const | 491 | no | const group = groups[0]; |
| placeholder | const | 493 | no | const placeholder = /placeholder thread/i.test(group.signature); |
| candidates | const | 504 | no | const candidates = lanes.filter((lane) =&gt; lane.total &gt; 0 &amp;&amp; lane.pct !== null); |
| lowest | const | 505 | no | const lowest = candidates.sort((a, b) =&gt; Number(a.pct) - Number(b.pct) \|\| a.lane.localeCompare(b.lane))[0]; |
| buildPortfolio | function | 530 | yes | export function buildPortfolio(sources = {}) { |
| src | const | 531 | no | const src = /** @type {any} */ (isObject(sources) ? sources : {}); |
| notes | const | 533 | no | const notes = []; |
| now | const | 534 | no | const now = typeof src.now === &#39;number&#39; &amp;&amp; Number.isFinite(src.now) ? src.now : Date.now(); |
| generatedAt | const | 535 | no | const generatedAt = new Date(now).toISOString(); |
| qeueLanes | variable | 539 | no | let qeueLanes = []; |
| loaded | const | 544 | no | const loaded = loadQeue(typeof src.qeueDir === &#39;string&#39; ? src.qeueDir : null); |
| initiativesLoaded | const | 550 | no | const initiativesLoaded = loadInitiatives(src.initiativesText); |
| initiatives | const | 552 | no | const initiatives = initiativesLoaded.rows.map((row) =&gt; ({ id: row.id, title: row.title, state: row.state, gate: row.gate, |
| tasksText | const | 562 | no | const tasksText = typeof src.tasksText === &#39;string&#39; ? src.tasksText : null; |
| knownIds | const | 571 | no | const knownIds = new Set(qeueLanes.flatMap((lane) =&gt; lane.records.map((record) =&gt; String(record.id)))); |
| citations | const | 572 | no | const citations = scanCitations(tasksText, knownIds); |
| blockedRows | const | 574 | no | const blockedRows = parseBlockedTable(tasksText); |
| blockedGroups | const | 578 | no | const blockedGroups = groupBlocked(blockedRows); |
| items | const | 582 | no | const items = []; |
| cite | const | 585 | no | const cite = citations.get(String(record.id)); |
| accepted | const | 586 | no | const accepted = isAcceptedStatus(record.status); |
| blockedCited | const | 587 | no | const blockedCited = cite ? cite.blocked : false; |
| blockedByStatus | const | 588 | no | const blockedByStatus = !accepted &amp;&amp; isBlockedStatus(record.status); |
| state | variable | 590 | no | let state = &#39;untouched&#39;; |
| because | variable | 592 | no | let because = &#39;no status and no queue row cites this id&#39;; |
| lanes | const | 622 | no | const lanes = qeueLanes.map((lane) =&gt; { const mine = items.filter((item) =&gt; item.lane === lane.lane); const accepted = mine.filter((item) =&gt; item.state === &#39;accepted&#39;).length; const total = mine.leng… |
| mine | const | 623 | no | const mine = items.filter((item) =&gt; item.lane === lane.lane); |
| accepted | const | 624 | no | const accepted = mine.filter((item) =&gt; item.state === &#39;accepted&#39;).length; |
| total | const | 625 | no | const total = mine.length; |
| tracked | const | 639 | no | const tracked = items.filter((item) =&gt; item.tracked).length; |
| coverage | const | 640 | no | const coverage = { |
| acceptedTotal | const | 649 | no | const acceptedTotal = items.filter((item) =&gt; item.state === &#39;accepted&#39;).length; |
| blockedTotal | const | 650 | no | const blockedTotal = items.filter((item) =&gt; item.state === &#39;blocked&#39;).length; |
| HQ_OWNER_RE | const | 671 | no | const HQ_OWNER_RE = /@hq:owner\\s+(\\S+)/; |
| readHqOwner | function | 680 | no | function readHqOwner(source) { |
| text | variable | 682 | no | let text; |
| resolveRequirementOwners | function | 704 | yes | export function resolveRequirementOwners(requirements = []) { |
| explicit | const | 706 | no | const explicit = strOrNull(req.owner); |
| owner | const | 707 | no | const owner = explicit ?? readHqOwner(req.source); |
| ownerlessRequirements | function | 724 | yes | export function ownerlessRequirements(requirements = []) { |
| UNFINISHED_STATUSES | const | 733 | no | const UNFINISHED_STATUSES = new Set([&#39;not_verified&#39;, &#39;open&#39;, &#39;claimed&#39;]); |
| rankUnfinishedByUserValue | function | 750 | yes | export function rankUnfinishedByUserValue(rows = [], { top } = {}) { |
| ranked | const | 751 | no | const ranked = rows |
| status | const | 753 | no | const status = String(row.status ?? &#39;&#39;).trim().toLowerCase(); |
| av | const | 766 | no | const av = a.userValue === null ? 1 : 0; // nulls sort last |
| bv | const | 767 | no | const bv = b.userValue === null ? 1 : 0; |
| ac | const | 770 | no | const ac = a.criticality_rank === null ? -1 : 0; |
| bc | const | 771 | no | const bc = b.criticality_rank === null ? -1 : 0; |
| CSS | const | 793 | no | const CSS = [ |
| cell | function | 800 | no | function cell(value) { |
| statCard | function | 805 | no | function statCard(label, value) { |
| renderDetails | function | 810 | no | function renderDetails(summary, inner) { |
| summaryText | function | 815 | no | function summaryText(label, text) { |
| renderBar | function | 827 | no | function renderBar(lane) { |
| total | const | 828 | no | const total = numOrNull(lane.total) ?? 0; |
| accepted | const | 829 | no | const accepted = numOrNull(lane.accepted) ?? 0; |
| pct | const | 830 | no | const pct = lane.pct === null \|\| lane.pct === undefined ? null : oneDecimal(Number(lane.pct)); |
| rest | const | 834 | no | const rest = oneDecimal(Math.max(0, 100 - pct)); |
| lanePrompt | function | 839 | no | function lanePrompt(lane) { |
| ragBand | function | 850 | no | function ragBand(pct) { |
| value | const | 852 | no | const value = Number(pct); |
| renderLanes | function | 860 | no | function renderLanes(lanes) { |
| rows | const | 862 | no | const rows = lanes.map((lane) =&gt; { const accepted = `${lane.accepted}/${lane.total}`; const pctText = lane.pct === null \|\| lane.pct === undefined ? &#39;—&#39; : `${Number(lane.pct).toFixed(1)}%`; const dril… |
| accepted | const | 863 | no | const accepted = `${lane.accepted}/${lane.total}`; |
| pctText | const | 864 | no | const pctText = lane.pct === null \|\| lane.pct === undefined ? &#39;—&#39; : `${Number(lane.pct).toFixed(1)}%`; |
| drill | const | 865 | no | const drill = `&lt;button type=&quot;button&quot; class=&quot;btn btn-ghost btn-xs&quot; data-prompt=&quot;${escapeHtml(lanePrompt(lane))}&quot; data-title=&quot;Investigate lane&quot;&gt;drill&lt;/button&gt;`; |
| renderInitiatives | function | 872 | no | function renderInitiatives(initiatives) { |
| rows | const | 874 | no | const rows = initiatives.map((row) =&gt; `&lt;tr&gt;&lt;td&gt;&lt;code&gt;${escapeHtml(row.id)}&lt;/code&gt;&lt;/td&gt;&lt;td&gt;${cell(row.title)}&lt;/td&gt;&lt;td&gt;${cell(row.state)}&lt;/td&gt;&lt;td&gt;${cell(row.gate)}&lt;/td&gt;&lt;td&gt;${cell(row.ownerDecision)}&lt;/t… |
| renderBlockedGroups | function | 879 | no | function renderBlockedGroups(groups) { |
| rows | const | 881 | no | const rows = groups.map((group) =&gt; { const count = numOrNull(group.count) ?? 0; const signature = truncate(group.signature, SIGNATURE_DISPLAY_MAX) \|\| &#39;(no reason given)&#39;; return `&lt;tr&gt;&lt;td class=&quot;text-… |
| count | const | 882 | no | const count = numOrNull(group.count) ?? 0; |
| signature | const | 883 | no | const signature = truncate(group.signature, SIGNATURE_DISPLAY_MAX) \|\| &#39;(no reason given)&#39;; |
| renderCoverage | function | 890 | no | function renderCoverage(coverage) { |
| stats | const | 891 | no | const stats = [ |
| renderNotes | function | 901 | no | function renderNotes(notes) { |
| items | const | 903 | no | const items = notes.map((note) =&gt; `&lt;li&gt;${escapeHtml(note)}&lt;/li&gt;`).join(&#39;&#39;); |
| decisionPrompt | function | 908 | no | function decisionPrompt(decision) { |
| renderDecisions | function | 913 | no | function renderDecisions(decisions) { |
| cards | const | 915 | no | const cards = decisions.map((raw) =&gt; { const decision = isObject(raw) ? raw : {}; const title = strOrNull(decision.title) ?? &#39;Decision&#39;; const why = strOrNull(decision.why) ?? &#39;&#39;; const command = str… |
| decision | const | 916 | no | const decision = isObject(raw) ? raw : {}; |
| title | const | 917 | no | const title = strOrNull(decision.title) ?? &#39;Decision&#39;; |
| why | const | 918 | no | const why = strOrNull(decision.why) ?? &#39;&#39;; |
| command | const | 919 | no | const command = strOrNull(decision.command) ?? &#39;&#39;; |
| renderPortfolioFragment | function | 936 | yes | export function renderPortfolioFragment(model, opts = {}) { |
| m | const | 937 | no | const m = /** @type {any} */ (isObject(model) ? model : {}); |
| generatedAt | const | 938 | no | const generatedAt = strOrNull(m.generatedAt) ?? &#39;&#39;; |
| verdict | const | 939 | no | const verdict = isObject(m.verdict) &amp;&amp; typeof m.verdict.text === &#39;string&#39; ? m.verdict.text : &#39;no verdict available&#39;; |
| lanes | const | 940 | no | const lanes = Array.isArray(m.lanes) ? m.lanes.filter(isObject) : []; |
| initiatives | const | 941 | no | const initiatives = Array.isArray(m.initiatives) ? m.initiatives.filter(isObject) : []; |
| groups | const | 942 | no | const groups = Array.isArray(m.blockedGroups) ? m.blockedGroups.filter(isObject) : []; |
| decisions | const | 943 | no | const decisions = Array.isArray(m.decisions) ? m.decisions : []; |
| notes | const | 944 | no | const notes = Array.isArray(m.notes) ? m.notes.filter((note) =&gt; typeof note === &#39;string&#39;) : []; |
| coverage | const | 945 | no | const coverage = isObject(m.coverage) |
| total | const | 954 | no | const total = lanes.reduce((sum, lane) =&gt; sum + (numOrNull(lane.total) ?? 0), 0); |
| accepted | const | 955 | no | const accepted = lanes.reduce((sum, lane) =&gt; sum + (numOrNull(lane.accepted) ?? 0), 0); |
| blocked | const | 956 | no | const blocked = lanes.reduce((sum, lane) =&gt; sum + (numOrNull(lane.blocked) ?? 0), 0); |
| blockedRowCount | const | 957 | no | const blockedRowCount = groups.reduce((sum, group) =&gt; sum + (numOrNull(group.count) ?? 0), 0); |
| withDecision | const | 958 | no | const withDecision = initiatives.filter((row) =&gt; !isNoneDecision(row.ownerDecision)).length; |
| verdictLine | const | 960 | no | const verdictLine = `&lt;p&gt;${escapeHtml(verdict)} &lt;span class=&quot;text-small text-muted&quot;&gt;generated &lt;time datetime=&quot;${escapeHtml(generatedAt)}&quot;&gt;${escapeHtml(generatedAt \|\| &#39;unknown&#39;)}&lt;/time&gt;&lt;/span&gt;&lt;/p&gt;`; |
| needsOwner | const | 961 | no | const needsOwner = `&lt;section aria-label=&quot;Needs the owner&quot;&gt;&lt;div class=&quot;text-small text-muted&quot;&gt;NEEDS THE OWNER&lt;/div&gt;${renderDecisions(decisions)}&lt;/section&gt;`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 16 | external |
| node:path | import | 17 | external |
| ./canvas.mjs | import | 18 | [hq/lib/canvas.mjs](./canvas.mjs.md) |
| ./team-dashboard.mjs | import | 19 | [hq/lib/team-dashboard.mjs](./team-dashboard.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-043-requirements-owner.mjs](../aii/fixtures/HQ-043-requirements-owner.mjs.md) | ../../lib/pmo.mjs |
| [hq/aii/fixtures/HQ-081-remaining-release-work.mjs](../aii/fixtures/HQ-081-remaining-release-work.mjs.md) | ../../lib/pmo.mjs |
| [hq/aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs](../aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs.md) | ../../lib/pmo.mjs |
| [hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs](../aii/fixtures/HQ-083-blocked-same-dependency.mjs.md) | ../../lib/pmo.mjs |
| [hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs](../aii/fixtures/HQ-085-critical-path-ownerless.mjs.md) | ../../lib/pmo.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/pmo.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Program management: one portfolio model that joins the qeue capability register, the |
| 5 | owner | hq-agent | — | hq-agent |
| 6 | task | — | — | program-management |
| 7 | invariant | — | — | read-only: three registers are read, nothing is written, no provider is touched. |
| 8 | invariant | — | — | a register that cannot be read becomes a note; it never throws and never reads as zero. |
| 9 | invariant | — | — | every dynamic string passes through escapeHtml, and the fragment stays layout only. |
| 10 | why | — | — | four registers describe one programme and none of them join; without the join, &quot;how much is |
| 13 | see | — | hq/lib/canvas.mjs | hq/lib/canvas.mjs |
| 14 | see | — | docs/integration/STRATEGIC-INITIATIVES.md | docs/integration/STRATEGIC-INITIATIVES.md |
| 670 | owner | annotation | — | annotation carrying a seat/assignee/capability-owner token. |
| 674 | owner | annotation | — | annotation from one source file, if present. |
| 697 | owner | ` | — | ` |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Program management: one portfolio model that joins the qeue capability register, the
 *   L0 strategic-initiative register and the live task queue, plus the Desktop fragment for it.
 * @hq:owner hq-agent
 * @hq:task program-management
 * @hq:invariant read-only: three registers are read, nothing is written, no provider is touched.
 * @hq:invariant a register that cannot be read becomes a note; it never throws and never reads as zero.
 * @hq:invariant every dynamic string passes through escapeHtml, and the fragment stays layout only.
 * @hq:why four registers describe one programme and none of them join; without the join, "how much is
 *   accepted" is answered by whichever file a reader happens to open, and an untracked item is
 *   indistinguishable from a finished one.
 * @hq:see hq/lib/canvas.mjs
 * @hq:see docs/integration/STRATEGIC-INITIATIVES.md
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { parseBlockedTable } from './canvas.mjs';
import { escapeHtml } from './team-dashboard.mjs';

/** The schema tag on every model this module builds. */
export const PMO_SCHEMA = 'hq.pmo/1';

/** The only id in the fragment; the host swaps the element with this id. */
export const PM_ROOT_ID = 'hq-pm';

/** How much of a blocked signature the fragment shows before it elides the rest. */
const SIGNATURE_DISPLAY_MAX = 200;

/** How much of an initiative title the decision card shows. */
const TITLE_DISPLAY_MAX = 90;

/** How many decision cards the model can carry, in priority order. */
const DECISION_CAP = 3;

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

/** One decimal place, so a percentage is stable across runs and readable in a table. */
/** @param {number} value @returns {number} */
function oneDecimal(value) {
  return Math.round(value * 10) / 10;
}

/** @param {unknown} value @param {number} max @returns {string} */
function truncate(value, max) {
  const s = String(value ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Collapse the whitespace a markdown cell can carry so a signature compares stably. */
/** @param {unknown} value @returns {string} */
function collapse(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}
```

_First 80 of 979 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
