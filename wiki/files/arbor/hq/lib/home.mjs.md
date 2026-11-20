# File: hq/lib/home.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/home.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 39252 B |
| Lines | 887 |
| Hash | b52b10605033 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MONTHS | const | 18 | no | const MONTHS = [&#39;Jan&#39;, &#39;Feb&#39;, &#39;Mar&#39;, &#39;Apr&#39;, &#39;May&#39;, &#39;Jun&#39;, &#39;Jul&#39;, &#39;Aug&#39;, &#39;Sep&#39;, &#39;Oct&#39;, &#39;Nov&#39;, &#39;Dec&#39;]; |
| ATTENTION_LABELS | const | 20 | no | const ATTENTION_LABELS = { |
| ATTENTION_LIMIT | const | 38 | no | const ATTENTION_LIMIT = 24; |
| ACTION_LIMIT | const | 39 | no | const ACTION_LIMIT = 12; |
| RECENT_LIMIT | const | 40 | no | const RECENT_LIMIT = 30; |
| NOTE_LIMIT | const | 41 | no | const NOTE_LIMIT = 40; |
| NOTE_TEXT_LIMIT | const | 42 | no | const NOTE_TEXT_LIMIT = 800; |
| LANGUAGE_LIMIT | const | 43 | no | const LANGUAGE_LIMIT = 6; |
| MEDIA_ROWS_LIMIT | const | 45 | no | const MEDIA_ROWS_LIMIT = 25; |
| MEDIA_LIBRARY_STATES | const | 46 | no | const MEDIA_LIBRARY_STATES = [&#39;dispatched&#39;, &#39;folder-detected&#39;, &#39;complete&#39;, &#39;seeded&#39;]; |
| MEDIA_STORE_DEFAULT | const | 47 | no | const MEDIA_STORE_DEFAULT = &#39;C:/VIVIM/channel/vivim/torrent-store&#39;; |
| STYLE | const | 49 | no | const STYLE = ` |
| asArray | function | 189 | no | function asArray(value) { |
| escapeHtml | function | 193 | no | function escapeHtml(value) { |
| clip | function | 207 | no | function clip(value, max) { |
| text | const | 208 | no | const text = String(value ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| clipText | function | 214 | no | function clipText(value, max) { |
| text | const | 215 | no | const text = String(value ?? &#39;&#39;); |
| toCount | function | 220 | no | function toCount(value) { |
| n | const | 222 | no | const n = Number(value); |
| pickCount | function | 226 | no | function pickCount(value, fallback) { |
| n | const | 227 | no | const n = Number(value); |
| fmtCount | function | 231 | no | function fmtCount(value) { |
| n | const | 232 | no | const n = Number(value); |
| rounded | const | 234 | no | const rounded = Math.trunc(n); |
| grouped | const | 235 | no | const grouped = String(Math.abs(rounded)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, &#39;,&#39;); |
| plural | function | 239 | no | function plural(n, one, many) { |
| ISO_RE | const | 243 | no | const ISO_RE = /^(\\d{4})-(\\d{2})-(\\d{2})(?:[T ](\\d{2}):(\\d{2})(?::(\\d{2})(?:\\.(\\d{1,3}))?)?)?\\s*(Z\|[+-]\\d{2}:?\\d{2})?$/; |
| parseDate | function | 248 | no | function parseDate(value) { |
| ms | const | 250 | no | const ms = value.getTime(); |
| d | const | 254 | no | const d = new Date(value); |
| text | const | 258 | no | const text = value.trim(); |
| d | const | 262 | no | const d = new Date(text); |
| year | const | 265 | no | const year = Number(match[1]); |
| month | const | 266 | no | const month = Number(match[2]); |
| day | const | 267 | no | const day = Number(match[3]); |
| hour | const | 268 | no | const hour = Number(match[4] ?? 0); |
| minute | const | 269 | no | const minute = Number(match[5] ?? 0); |
| second | const | 270 | no | const second = Number(match[6] ?? 0); |
| millis | const | 271 | no | const millis = Number((match[7] ?? &#39;0&#39;).padEnd(3, &#39;0&#39;).slice(0, 3)); |
| stamp | variable | 272 | no | let stamp = Date.UTC(year, month - 1, day, hour, minute, second, millis); |
| zone | const | 273 | no | const zone = match[8]; |
| sign | const | 275 | no | const sign = zone[0] === &#39;-&#39; ? -1 : 1; |
| digits | const | 276 | no | const digits = zone.slice(1).replace(&#39;:&#39;, &#39;&#39;); |
| offset | const | 277 | no | const offset = Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4)); |
| formatDate | function | 283 | no | function formatDate(value) { |
| d | const | 284 | no | const d = parseDate(value); |
| formatDateTime | function | 289 | no | function formatDateTime(value) { |
| d | const | 290 | no | const d = parseDate(value); |
| hh | const | 292 | no | const hh = String(d.getUTCHours()).padStart(2, &#39;0&#39;); |
| mm | const | 293 | no | const mm = String(d.getUTCMinutes()).padStart(2, &#39;0&#39;); |
| isoAttr | function | 297 | no | function isoAttr(value) { |
| d | const | 298 | no | const d = parseDate(value); |
| normalizeLanguages | function | 304 | no | function normalizeLanguages(languages) { |
| rows | const | 305 | no | const rows = asArray(languages) |
| item | const | 307 | no | const item = entry &amp;&amp; typeof entry === &#39;object&#39; ? entry : {}; |
| normalizeTags | function | 315 | no | function normalizeTags(tags) { |
| list | const | 316 | no | const list = Array.isArray(tags) ? tags : (tags ? [tags] : []); |
| humanKind | function | 323 | no | function humanKind(kind) { |
| key | const | 324 | no | const key = clip(kind, 40); |
| mapped | const | 326 | no | const mapped = ATTENTION_LABELS[key] \|\| ATTENTION_LABELS[key.toLowerCase()]; |
| spaced | const | 328 | no | const spaced = key |
| projectStatus | function | 335 | no | function projectStatus(project) { |
| dirty | const | 336 | no | const dirty = toCount(project.dirty); |
| ahead | const | 337 | no | const ahead = toCount(project.ahead); |
| behind | const | 338 | no | const behind = toCount(project.behind); |
| renderStats | function | 349 | no | function renderStats(items) { |
| normalizeCapabilitySummary | function | 357 | no | function normalizeCapabilitySummary(value) { |
| source | const | 358 | no | const source = value &amp;&amp; typeof value === &#39;object&#39; ? value : null; |
| counts | const | 360 | no | const counts = source.counts &amp;&amp; typeof source.counts === &#39;object&#39; ? source.counts : {}; |
| renderCapabilitySummary | function | 369 | no | function renderCapabilitySummary(summary) { |
| approvedLine | const | 371 | no | const approvedLine = summary.approved === 0 |
| readMediaCollection | function | 392 | no | function readMediaCollection(path) { |
| parsed | const | 394 | no | const parsed = JSON.parse(readFileSync(path, &#39;utf8&#39;)); |
| loadMediaSnapshot | function | 404 | no | function loadMediaSnapshot(storeDir) { |
| dir | const | 405 | no | const dir = typeof storeDir === &#39;string&#39; &amp;&amp; storeDir.trim() ? storeDir : MEDIA_STORE_DEFAULT; |
| mediaEpisodeLabel | function | 422 | no | function mediaEpisodeLabel(release) { |
| source | const | 423 | no | const source = release &amp;&amp; typeof release === &#39;object&#39; ? release : null; |
| next | const | 424 | no | const next = source &amp;&amp; source.next &amp;&amp; typeof source.next === &#39;object&#39; ? source.next : null; |
| season | const | 425 | no | const season = toCount(next?.season); |
| number | const | 426 | no | const number = toCount(next?.number); |
| code | const | 428 | no | const code = `S${String(season).padStart(2, &#39;0&#39;)}E${String(number).padStart(2, &#39;0&#39;)}`; |
| air | const | 429 | no | const air = formatDate(next.airstamp); |
| normalizeMedia | function | 436 | no | function normalizeMedia(value) { |
| source | const | 437 | no | const source = value &amp;&amp; typeof value === &#39;object&#39; ? value : {}; |
| libraryEntries | const | 446 | no | const libraryEntries = asArray(source.library?.entries ?? source.library); |
| releaseEntries | const | 447 | no | const releaseEntries = asArray(source.releases?.entries ?? source.releases); |
| wantedEntries | const | 448 | no | const wantedEntries = asArray(source.wanted?.entries ?? source.wanted); |
| favoriteEntries | const | 449 | no | const favoriteEntries = asArray(source.favorites?.entries ?? source.favorites); |
| byState | const | 451 | no | const byState = { dispatched: 0, &#39;folder-detected&#39;: 0, complete: 0, seeded: 0 }; |
| rows | const | 452 | no | const rows = libraryEntries.map((raw) =&gt; { const entry = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : {}; const state = clip(entry.state, 24).toLowerCase() \|\| &#39;seeded&#39;; if (state in byState) byState[state]… |
| entry | const | 453 | no | const entry = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : {}; |
| state | const | 454 | no | const state = clip(entry.state, 24).toLowerCase() \|\| &#39;seeded&#39;; |
| shownRows | const | 459 | no | const shownRows = rows.slice(0, MEDIA_ROWS_LIMIT); |
| releaseByName | const | 461 | no | const releaseByName = new Map(); |
| entry | const | 463 | no | const entry = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : {}; |
| key | const | 464 | no | const key = clip(entry.title, 80).toLowerCase(); |
| shows | const | 467 | no | const shows = wantedEntries.map((raw) =&gt; { const entry = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : {}; const fallbackTitle = clip(entry.title, 90); const release = fallbackTitle ? releaseByName.get(fall… |
| entry | const | 468 | no | const entry = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : {}; |
| fallbackTitle | const | 469 | no | const fallbackTitle = clip(entry.title, 90); |
| release | const | 470 | no | const release = fallbackTitle ? releaseByName.get(fallbackTitle.toLowerCase()) : null; |
| name | const | 471 | no | const name = release &amp;&amp; clip(release.name, 90) ? clip(release.name, 90) : fallbackTitle; |
| favorites | const | 475 | no | const favorites = favoriteEntries.map((raw) =&gt; { const entry = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : { title: raw }; return { title: clip(entry.title ?? entry.id, 120) }; }).filter((row) =&gt; row.titl… |
| entry | const | 476 | no | const entry = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : { title: raw }; |
| libraryTotal | const | 480 | no | const libraryTotal = libraryEntries.length; |
| loadMediaLibrary | function | 497 | yes | export function loadMediaLibrary(storeDir) { |
| renderMediaShow | function | 501 | no | function renderMediaShow(show) { |
| source | const | 502 | no | const source = show &amp;&amp; typeof show === &#39;object&#39; ? show : { title: show }; |
| title | const | 503 | no | const title = clip(source.title, 90) \|\| &#39;Tracked show&#39;; |
| nextLabel | const | 504 | no | const nextLabel = clip(source.nextLabel, 80) \|\| &#39;no upcoming episode&#39;; |
| upcoming | const | 505 | no | const upcoming = nextLabel !== &#39;no upcoming episode&#39;; |
| renderMediaRow | function | 514 | no | function renderMediaRow(row) { |
| source | const | 515 | no | const source = row &amp;&amp; typeof row === &#39;object&#39; ? row : { title: row }; |
| title | const | 516 | no | const title = clip(source.title, 120) \|\| &#39;(untitled)&#39;; |
| state | const | 517 | no | const state = clip(source.state, 24) \|\| &#39;seeded&#39;; |
| visits | const | 518 | no | const visits = toCount(source.visits); |
| meta | const | 519 | no | const meta = [state, visits &gt; 0 ? plural(visits, &#39;visit&#39;, &#39;visits&#39;) : &#39;&#39;].filter(Boolean); |
| renderMediaLibrary | function | 526 | no | function renderMediaLibrary(media) { |
| data | const | 527 | no | const data = media &amp;&amp; typeof media === &#39;object&#39; ? media : {}; |
| shows | const | 540 | no | const shows = asArray(data.shows); |
| rows | const | 541 | no | const rows = asArray(data.rows); |
| favorites | const | 542 | no | const favorites = asArray(data.favorites).map((raw) =&gt; { const favorite = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : { title: raw }; return clip(favorite.title, 120); }).filter(Boolean); |
| favorite | const | 543 | no | const favorite = raw &amp;&amp; typeof raw === &#39;object&#39; ? raw : { title: raw }; |
| stateTags | const | 547 | no | const stateTags = MEDIA_LIBRARY_STATES.map((state) =&gt; `&lt;li class=&quot;tag&quot;&gt;${escapeHtml(`${fmtCount(toCount(data.byState?.[state]))} ${state}`)}&lt;/li&gt;`, ).join(&#39;&#39;); |
| renderAttention | function | 588 | no | function renderAttention(item, index) { |
| source | const | 589 | no | const source = item &amp;&amp; typeof item === &#39;object&#39; ? item : { title: item }; |
| kind | const | 590 | no | const kind = humanKind(source.kind); |
| title | const | 591 | no | const title = clip(source.title, 120) \|\| kind; |
| detail | const | 592 | no | const detail = clip(source.detail, 300); |
| project | const | 593 | no | const project = clip(source.project, 80); |
| renderAction | function | 602 | no | function renderAction(action) { |
| source | const | 603 | no | const source = action &amp;&amp; typeof action === &#39;object&#39; ? action : { title: action }; |
| kind | const | 604 | no | const kind = humanKind(source.kind); |
| title | const | 605 | no | const title = clip(source.title, 120) \|\| kind; |
| reason | const | 606 | no | const reason = clip(source.reason, 240); |
| renderLanguages | function | 614 | no | function renderLanguages(languages, projectName) { |
| rows | const | 615 | no | const rows = normalizeLanguages(languages); |
| total | const | 617 | no | const total = rows.reduce((sum, row) =&gt; sum + row.count, 0); |
| shown | const | 618 | no | const shown = rows.slice(0, LANGUAGE_LIMIT); |
| items | const | 619 | no | const items = shown.map((row) =&gt; { const percent = Math.max(2, Math.round((row.count / total) * 100)); return `&lt;li class=&quot;lang&quot;&gt; &lt;span class=&quot;lang-name&quot;&gt;${escapeHtml(row.lang)}&lt;/span&gt; &lt;span class=&quot;la… |
| percent | const | 620 | no | const percent = Math.max(2, Math.round((row.count / total) * 100)); |
| extra | const | 627 | no | const extra = rows.length - shown.length; |
| renderTags | function | 633 | no | function renderTags(tags, projectName) { |
| rows | const | 634 | no | const rows = normalizeTags(tags); |
| renderProject | function | 641 | no | function renderProject(project, index) { |
| source | const | 642 | no | const source = project &amp;&amp; typeof project === &#39;object&#39; ? project : {}; |
| name | const | 643 | no | const name = clip(source.name, 80) \|\| `Project ${index + 1}`; |
| path | const | 644 | no | const path = clip(source.path, 160); |
| branch | const | 645 | no | const branch = clip(source.branch, 80); |
| tags | const | 646 | no | const tags = normalizeTags(source.tags); |
| description | const | 647 | no | const description = clip(source.description, 280); |
| files | const | 648 | no | const files = toCount(source.files); |
| symbols | const | 649 | no | const symbols = toCount(source.symbols); |
| last | const | 650 | no | const last = source.lastCommit &amp;&amp; typeof source.lastCommit === &#39;object&#39; ? source.lastCommit : {}; |
| subject | const | 651 | no | const subject = clip(last.subject, 140); |
| dateLabel | const | 652 | no | const dateLabel = formatDate(last.date); |
| status | const | 653 | no | const status = projectStatus(source); |
| facts | const | 654 | no | const facts = []; |
| renderEvent | function | 677 | no | function renderEvent(commit) { |
| source | const | 678 | no | const source = commit &amp;&amp; typeof commit === &#39;object&#39; ? commit : {}; |
| subject | const | 679 | no | const subject = clip(source.subject, 140) \|\| &#39;Commit&#39;; |
| dateLabel | const | 680 | no | const dateLabel = formatDate(source.date); |
| iso | const | 681 | no | const iso = isoAttr(source.date); |
| project | const | 682 | no | const project = clip(source.project, 80); |
| author | const | 683 | no | const author = clip(source.author, 60); |
| sha | const | 684 | no | const sha = clip(source.sha, 12); |
| meta | const | 685 | no | const meta = [project, author, sha].filter(Boolean); |
| renderNote | function | 693 | no | function renderNote(note) { |
| source | const | 694 | no | const source = note &amp;&amp; typeof note === &#39;object&#39; ? note : { text: note }; |
| text | const | 695 | no | const text = clipText(source.text, NOTE_TEXT_LIMIT) \|\| &#39;(empty note)&#39;; |
| project | const | 696 | no | const project = clip(source.project, 80); |
| dateLabel | const | 697 | no | const dateLabel = formatDate(source.updatedAt); |
| meta | const | 698 | no | const meta = [project, dateLabel].filter(Boolean); |
| noteTier | function | 705 | no | function noteTier(tier) { |
| key | const | 706 | no | const key = String(tier ?? &#39;&#39;).trim().toLowerCase(); |
| renderHome | function | 714 | yes | export function renderHome(input = {}) { |
| data | const | 715 | no | const data = input &amp;&amp; typeof input === &#39;object&#39; ? input : {}; |
| workspace | const | 716 | no | const workspace = data.workspace &amp;&amp; typeof data.workspace === &#39;object&#39; ? data.workspace : {}; |
| brief | const | 717 | no | const brief = data.brief &amp;&amp; typeof data.brief === &#39;object&#39; ? data.brief : {}; |
| stats | const | 718 | no | const stats = brief.stats &amp;&amp; typeof brief.stats === &#39;object&#39; ? brief.stats : {}; |
| projectList | const | 719 | no | const projectList = asArray(data.projects); |
| attention | const | 720 | no | const attention = asArray(brief.needsAttention); |
| nextActions | const | 721 | no | const nextActions = asArray(brief.nextActions); |
| recentCommits | const | 722 | no | const recentCommits = asArray(data.recent); |
| noteList | const | 723 | no | const noteList = asArray(data.notes); |
| capabilitySummary | const | 724 | no | const capabilitySummary = normalizeCapabilitySummary(data.capabilities ?? data.capabilityStatus); |
| media | const | 725 | no | const media = normalizeMedia(data.media !== undefined ? data.media : loadMediaSnapshot(data.mediaStore)); |
| wsName | const | 727 | no | const wsName = clip(workspace.name, 80); |
| wsRoot | const | 728 | no | const wsRoot = clip(workspace.root, 240); |
| totalFiles | const | 730 | no | const totalFiles = projectList.reduce((sum, project) =&gt; sum + toCount(project?.files), 0); |
| totalSymbols | const | 731 | no | const totalSymbols = projectList.reduce((sum, project) =&gt; sum + toCount(project?.symbols), 0); |
| dirtyCount | const | 732 | no | const dirtyCount = projectList.filter((project) =&gt; toCount(project?.dirty) &gt; 0).length; |
| statItems | const | 734 | no | const statItems = [ |
| generatedLabel | const | 743 | no | const generatedLabel = formatDateTime(data.generatedAt); |
| generatedIso | const | 744 | no | const generatedIso = isoAttr(data.generatedAt); |
| generatedHtml | const | 745 | no | const generatedHtml = generatedLabel |
| shownAttention | const | 751 | no | const shownAttention = attention.slice(0, ATTENTION_LIMIT); |
| attentionOverflow | const | 752 | no | const attentionOverflow = attention.length - shownAttention.length; |
| shownActions | const | 753 | no | const shownActions = nextActions.slice(0, ACTION_LIMIT); |
| actionOverflow | const | 754 | no | const actionOverflow = nextActions.length - shownActions.length; |
| shownRecent | const | 755 | no | const shownRecent = recentCommits.slice(0, RECENT_LIMIT); |
| recentOverflow | const | 756 | no | const recentOverflow = recentCommits.length - shownRecent.length; |
| notesByTier | const | 758 | no | const notesByTier = { now: [], later: [], canon: [] }; |
| noteTotal | variable | 764 | no | let noteTotal = 0; |
| noteGroups | const | 765 | no | const noteGroups = [ |
| label | const | 770 | no | const label = memoryTierLabel(tier); |
| items | const | 771 | no | const items = notesByTier[tier].slice(0, NOTE_LIMIT - noteTotal); |
| html | const | 776 | no | const html = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 14 | external |
| node:path | import | 15 | external |
| ./nomenclature.mjs | import | 16 | [hq/lib/nomenclature.mjs](./nomenclature.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/home.mjs |
| [hq/test/capability-surfaces.test.mjs](../test/capability-surfaces.test.mjs.md) | ../lib/home.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/home.mjs — offline HTML home page for the Owner persona.
//
// renderHome is pure and self-contained: one read-only import for the VIVIM
// vocabulary, no network, no writes. The caller supplies every fact, including
// `generatedAt`, which is the only clock this module reads. Same input in,
// byte-identical HTML out.
//
// The My Media Library section is the one exception: when the caller does not
// supply `media` facts, the VIVIM media store is read read-only from disk
// (never written, never contacted). A missing or corrupt store renders as a
// clean empty state and never throws. Callers pass `media` (a snapshot) or
// `mediaStore` (a store directory) to stay fully hermetic.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { memoryTierLabel } from './nomenclature.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ATTENTION_LABELS = {
  dirty: 'Uncommitted changes',
  staleindex: 'Stale index',
  'stale-index': 'Stale index',
  'stale_index': 'Stale index',
  aheadbehind: 'Out of sync',
  'ahead-behind': 'Out of sync',
  'ahead_behind': 'Out of sync',
  missingdocs: 'Missing docs',
  'missing-docs': 'Missing docs',
  'missing_docs': 'Missing docs',
  staledocs: 'Docs out of date',
  'stale-docs': 'Docs out of date',
  'stale_docs': 'Docs out of date',
  todos: 'Open todo',
  todo: 'Open todo',
};

const ATTENTION_LIMIT = 24;
const ACTION_LIMIT = 12;
const RECENT_LIMIT = 30;
const NOTE_LIMIT = 40;
const NOTE_TEXT_LIMIT = 800;
const LANGUAGE_LIMIT = 6;

const MEDIA_ROWS_LIMIT = 25;
const MEDIA_LIBRARY_STATES = ['dispatched', 'folder-detected', 'complete', 'seeded'];
const MEDIA_STORE_DEFAULT = 'C:/VIVIM/channel/vivim/torrent-store';

const STYLE = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55}
:root{
  color-scheme:light dark;
  --bg:#f7f6f2;
  --panel:#fffefb;
  --ink:#1f1d19;
  --muted:#5c584f;
  --line:#e3ded2;
  --line-strong:#cfc8b8;
  --accent:#2f6b52;
  --track:#ece8dd;
  --warn:#98501c;
  --warn-soft:#fbeee2;
  --info:#31577f;
  --info-soft:#e8eff7;
  --good:#2c6b46;
  --good-soft:#e6f2ea;
  --muted-soft:#efece4;
  --focus:#6b3fbf;
  --shadow:0 1px 2px rgba(31,29,25,.06);
  --radius:14px;
  --gap:clamp(12px,2vw,20px);
}
@media (prefers-color-scheme:dark){
  :root{
    color-scheme:dark;
    --bg:#141416;
    --panel:#1c1c20;
    --ink:#edece8;
```

_First 80 of 888 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
