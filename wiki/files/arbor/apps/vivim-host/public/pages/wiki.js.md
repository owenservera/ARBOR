# File: apps/vivim-host/public/pages/wiki.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/pages/wiki.js |
| Language | JavaScript |
| Kind | source |
| Size | 56044 B |
| Lines | 935 |
| Hash | 0999d62f811a |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SOURCES | const | 9 | no | const SOURCES = Object.freeze({ wiki: { url: &#39;/api/wiki&#39;, path: &#39;Host product journal → Wiki projection&#39; }, state: { url: &#39;/api/state&#39;, path: &#39;Host product journal → chat state projection&#39; }, context… |
| ACTOR | const | 16 | no | const ACTOR = &#39;owner-browser&#39;; |
| POLL_MS | const | 17 | no | const POLL_MS = 1600; |
| MAX_ENTRY_BYTES | const | 18 | no | const MAX_ENTRY_BYTES = 4096; |
| HANDOFF_KEY | const | 19 | no | const HANDOFF_KEY = &#39;vivim.desktop-chat-draft.v1&#39;; |
| $ | function | 20 | no | const $ = id =&gt; document.getElementById(id); |
| snapshots | const | 21 | no | const snapshots = Object.create(null); |
| editSession | variable | 22 | no | let editSession = null; |
| refreshing | variable | 23 | no | let refreshing = false; |
| busy | variable | 24 | no | let busy = false; |
| ownerCsrf | variable | 25 | no | let ownerCsrf = null; // memory-only proof of a native Host-issued short-lived session |
| interpreting | variable | 26 | no | let interpreting = false; |
| assistance | variable | 27 | no | let assistance=null; |
| surfaceQuery | variable | 28 | no | let surfaceQuery = &#39;&#39;; |
| surfaceQueryEpoch | variable | 29 | no | let surfaceQueryEpoch = 0; |
| surfaceContextEpoch | variable | 30 | no | let surfaceContextEpoch = 0; |
| surfaceContextSelection | variable | 31 | no | let surfaceContextSelection = null; |
| autoContextPending | variable | 32 | no | let autoContextPending = false; |
| indexingSources | variable | 33 | no | let indexingSources = false; |
| sourceCardHost | variable | 34 | no | let sourceCardHost=null; |
| element | function | 36 | no | function element(tag, className, text) { |
| result | const | 37 | no | const result = document.createElement(tag); |
| present | function | 42 | no | function present(value, fallback = &#39;—&#39;) { return value === undefined \|\| value === null ? fallback : String(value); } |
| isWikiDocument | function | 43 | no | function isWikiDocument(wiki) { |
| entriesOf | function | 47 | no | function entriesOf(journal) { |
| fileRecords | function | 50 | no | function fileRecords(surface) { |
| sourceRecord | function | 55 | no | function sourceRecord(key) { return snapshots[key]?.data; } |
| observedEdit | function | 56 | no | function observedEdit(page, section, content) { |
| journal | const | 57 | no | const journal = sourceRecord(&#39;journal&#39;); |
| matched | const | 59 | no | const matched = entriesOf(journal).some(entry =&gt; entry?.kind === &#39;wiki-edit&#39; &amp;&amp; entry.edit?.page === page &amp;&amp; entry.edit?.section === section &amp;&amp; entry.edit?.content === content); |
| sectionEl | function | 63 | no | function sectionEl(page, section, text, revision) { |
| wrapper | const | 64 | no | const wrapper = element(&#39;article&#39;, &#39;section&#39;); |
| head | const | 67 | no | const head = element(&#39;div&#39;, &#39;section-head&#39;); |
| edit | const | 69 | no | const edit = element(&#39;button&#39;, &#39;&#39;, &#39;Edit&#39;); |
| renderWiki | function | 79 | no | function renderWiki(wiki) { |
| root | const | 80 | no | const root = element(&#39;div&#39;, &#39;stack&#39;); |
| pages | const | 81 | no | const pages = Object.entries(wiki.pages \|\| {}); |
| pageCards | const | 83 | no | const pageCards=new Map(); |
| card | const | 85 | no | const card = element(&#39;section&#39;, &#39;page&#39;); |
| links | const | 88 | no | const links=Array.isArray(page?.links)?page.links.filter(p=&gt;typeof p===&#39;string&#39;&amp;&amp;Object.hasOwn(wiki.pages,p)):[]; |
| button | const | 92 | no | const button=element(&#39;button&#39;,&#39;&#39;,target);button.type=&#39;button&#39;; |
| sections | const | 97 | no | const sections = Object.entries(page?.sections \|\| {}); |
| semanticRows | function | 104 | no | function semanticRows(context) { |
| graph | const | 105 | no | const graph = context.semantics; |
| nodes | const | 111 | no | const nodes = new Map(); |
| labels | const | 116 | no | const labels = { &#39;changed-section&#39;: &#39;changed&#39;, &#39;supersedes-change&#39;: &#39;supersedes&#39;, |
| priority | const | 121 | no | const priority = { &#39;confirmed-change&#39;: 0, &#39;changed-section&#39;: 1, &#39;supersedes-change&#39;: 2, |
| rows | const | 124 | no | const rows = []; |
| ids | const | 125 | no | const ids = new Set(); |
| renderSemanticKnowledge | function | 145 | no | function renderSemanticKnowledge(root, context) { |
| knowledge | const | 147 | no | const knowledge = semanticRows(context); |
| card | const | 156 | no | const card = element(&#39;article&#39;, &#39;section&#39;); |
| renderContext | function | 167 | no | function renderContext(context) { |
| root | const | 168 | no | const root = element(&#39;div&#39;, &#39;stack&#39;); |
| card | const | 174 | no | const card = element(&#39;article&#39;, &#39;section&#39;); |
| interpretation | const | 178 | no | const interpretation = item.interpretation?.outcome |
| changes | const | 187 | no | const changes = context.wikiChanges; |
| card | const | 200 | no | const card = element(&#39;article&#39;, &#39;section&#39;); |
| effects | const | 211 | no | const effects = context.applicationEffects; |
| card | const | 219 | no | const card = element(&#39;article&#39;, &#39;section&#39;); |
| native | const | 236 | no | const native = context.nativeContext; |
| card | const | 246 | no | const card=element(&#39;article&#39;,&#39;section&#39;); |
| renderFileSurface | function | 256 | no | function renderFileSurface(surface) { |
| root | const | 257 | no | const root = element(&#39;div&#39;); |
| records | const | 258 | no | const records = fileRecords(surface); |
| cards | const | 261 | no | const cards=sourceCards(surface); |
| details | const | 263 | no | const details = element(&#39;details&#39;, &#39;record&#39;); |
| clearSurfaceContext | function | 287 | no | function clearSurfaceContext(message = &#39;Search annotated source or select a current file to read its verified context.&#39;) { |
| currentSurfaceRecord | function | 292 | no | function currentSurfaceRecord(record) { |
| readSurfaceContext | function | 295 | no | async function readSurfaceContext(record) { |
| epoch | const | 300 | no | const epoch = ++surfaceContextEpoch; |
| response | const | 304 | no | const response = await fetch(exactSourceContextUrl(record.sourceCard), { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, signal: AbortSignal.timeout(15000) }); |
| result | const | 313 | no | const result = await response.json(); |
| bundle | const | 315 | no | const bundle = result?.context; |
| root | const | 326 | no | const root = element(&#39;section&#39;, &#39;record&#39;); |
| autoSurfaceContext | function | 341 | no | function autoSurfaceContext(data) { |
| matches | const | 343 | no | const matches=sourceCards(data).filter(card=&gt;card.readable&amp;&amp;card.semanticId===surfaceQuery); |
| renderJournal | function | 349 | no | function renderJournal(journal) { |
| root | const | 350 | no | const root = element(&#39;div&#39;); |
| entries | const | 351 | no | const entries = entriesOf(journal); |
| scroll | const | 354 | no | const scroll = element(&#39;div&#39;, &#39;table-scroll&#39;); |
| table | const | 355 | no | const table = element(&#39;table&#39;); |
| head | const | 356 | no | const head = element(&#39;thead&#39;); const hr = element(&#39;tr&#39;); |
| body | const | 359 | no | const body = element(&#39;tbody&#39;); |
| row | const | 361 | no | const row = element(&#39;tr&#39;); |
| ref | const | 364 | no | const ref = entry.kind === &#39;wiki-edit&#39; ? `${present(entry.edit?.page)}/${present(entry.edit?.section)}` : |
| resolveWikiTarget | function | 372 | no | function resolveWikiTarget(wiki, target) { |
| matches | const | 376 | no | const matches = []; |
| linesDiff | function | 389 | no | function linesDiff(before, after) { |
| a | const | 390 | no | const a = String(before).split(&#39;\\n&#39;), b = String(after).split(&#39;\\n&#39;); |
| start | variable | 391 | no | let start = 0; |
| removed | const | 395 | no | const removed = a.slice(start, a.length - end), added = b.slice(start, b.length - end); |
| out | const | 397 | no | const out = []; |
| mutationEnvelope | function | 406 | no | function mutationEnvelope(session, revision, text) { |
| bytesOf | function | 410 | no | function bytesOf(value) { return new TextEncoder().encode(JSON.stringify(value)).byteLength; } |
| setEditorStatus | function | 411 | no | function setEditorStatus(message) { $(&#39;edit-status&#39;).textContent = message; } |
| closeEditor | function | 412 | no | function closeEditor() { |
| invalidatePreview | function | 420 | no | function invalidatePreview(message = &#39;Draft changed. Review again before sending.&#39;) { |
| openEdit | function | 427 | no | function openEdit(page, section, text, revision) { |
| markStale | function | 444 | no | function markStale(revision) { |
| checkEditorRevision | function | 451 | no | function checkEditorRevision() { |
| wiki | const | 453 | no | const wiki = sourceRecord(&#39;wiki&#39;); |
| validAppliedEffects | function | 456 | no | function validAppliedEffects(effects) { |
| getJson | function | 469 | no | async function getJson(key) { |
| url | const | 471 | no | const url = SOURCES[key].url + (key === &#39;surface&#39; &amp;&amp; surfaceQuery ? &#39;?q=&#39; + encodeURIComponent(surfaceQuery) : &#39;&#39;); |
| response | const | 472 | no | const response = await fetch(url, { cache: &#39;no-store&#39;, ...([&#39;context&#39;,&#39;surface&#39;].includes(key) ? { credentials: &#39;same-origin&#39; } : {}), signal: AbortSignal.timeout(5000) }); |
| data | const | 478 | no | const data = await response.json(); |
| changes | const | 490 | no | const changes = data.wikiChanges; |
| revisionLabel | function | 512 | no | function revisionLabel(key, data) { |
| updateSourceMeta | function | 519 | no | function updateSourceMeta(key) { |
| field | const | 521 | no | const field = $(key + &#39;-source&#39;); |
| snap | const | 523 | no | const snap = snapshots[key]; |
| ingest | function | 527 | no | function ingest(key, data) { |
| signature | const | 528 | no | const signature = JSON.stringify(data); |
| previous | const | 529 | no | const previous = snapshots[key]; |
| changed | const | 530 | no | const changed = !previous \|\| previous.signature !== signature \|\| Boolean(previous.error); |
| checkReadback | function | 558 | no | function checkReadback(wiki) { |
| session | const | 559 | no | const session = editSession; |
| ack | const | 561 | no | const ack = session.acknowledged; |
| renderSync | function | 572 | no | function renderSync() { |
| keys | const | 573 | no | const keys = Object.keys(SOURCES).filter(key =&gt; ![&#39;context&#39;,&#39;surface&#39;].includes(key)); // private sources may be locked |
| seen | const | 574 | no | const seen = keys.filter(key =&gt; !!snapshots[key]?.data).length; |
| failures | const | 575 | no | const failures = keys.filter(key =&gt; !!snapshots[key]?.error); |
| wiki | const | 576 | no | const wiki = sourceRecord(&#39;wiki&#39;); |
| state | const | 577 | no | const state = sourceRecord(&#39;state&#39;); |
| journal | const | 578 | no | const journal = sourceRecord(&#39;journal&#39;); |
| edits | const | 579 | no | const edits = entriesOf(journal).filter(entry =&gt; entry?.kind === &#39;wiki-edit&#39;).length; |
| context | const | 583 | no | const context = sourceRecord(&#39;context&#39;); |
| mismatch | const | 584 | no | const mismatch = (wiki &amp;&amp; state &amp;&amp; wiki.revision !== state.wikiRevision) \|\| |
| refresh | function | 590 | no | async function refresh() { |
| keys | const | 594 | no | const keys = Object.keys(SOURCES); |
| queryEpoch | const | 595 | no | const queryEpoch = surfaceQueryEpoch; |
| responses | const | 596 | no | const responses = await Promise.allSettled(keys.map(getJson)); |
| key | const | 598 | no | const key = keys[index]; |
| message | const | 602 | no | const message = String(result.reason?.message \|\| result.reason); |
| interpretWikiCommand | function | 630 | no | async function interpretWikiCommand(event) { |
| sentence | const | 638 | no | const sentence = $(&#39;wiki-command&#39;).value.trim(); |
| destination | const | 643 | no | const destination=resolveDesktopDestination(sentence); |
| csrf | const | 653 | no | const csrf = await ownerEditCsrf({ fresh: true }); |
| response | const | 654 | no | const response = await fetch(&#39;/api/host/control/interpret&#39;, { method: &#39;POST&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;x-… |
| meaning | const | 663 | no | const meaning = await response.json(); |
| route | const | 664 | no | const route=resolveProductRoute(sentence,{hostMeaning:meaning}); |
| explanation | const | 668 | no | const explanation = typeof meaning?.question === &#39;string&#39; ? meaning.question : |
| structural | const | 671 | no | const structural=[&#39;wiki.page.create&#39;,&#39;wiki.page.move&#39;,&#39;wiki.pages.link&#39;,&#39;wiki.pages.list&#39;,&#39;wiki.section.read&#39;].includes(meaning?.candidate?.actionId); |
| open | const | 680 | no | const open=element(&#39;button&#39;,&#39;&#39;,&#39;Continue in Chat (draft only)&#39;); |
| wiki | const | 700 | no | const wiki = await getJson(&#39;wiki&#39;); |
| canonical | const | 701 | no | const canonical = resolveWikiTarget(wiki, target); |
| rebase | function | 723 | no | async function rebase() { |
| session | const | 724 | no | const session = editSession; |
| wiki | const | 728 | no | const wiki = await getJson(&#39;wiki&#39;); |
| current | const | 730 | no | const current = wiki.pages?.[session.page]?.sections?.[session.section]; |
| review | function | 743 | no | async function review() { |
| session | const | 744 | no | const session = editSession; |
| wiki | const | 748 | no | const wiki = await getJson(&#39;wiki&#39;); |
| latest | const | 751 | no | const latest = wiki.pages?.[session.page]?.sections?.[session.section]; |
| proposed | const | 757 | no | const proposed = $(&#39;edit-content&#39;).value; |
| ownerEditCsrf | function | 777 | no | async function ownerEditCsrf({ fresh = false } = {}) { |
| fragment | const | 779 | no | const fragment = typeof window !== &#39;undefined&#39; ? String(window.location?.hash \|\| &#39;&#39;) : &#39;&#39;; |
| response | variable | 780 | no | let response; |
| data | const | 798 | no | const data = await response.json().catch(() =&gt; ({})); |
| submitEdit | function | 804 | no | async function submitEdit(event) { |
| session | const | 806 | no | const session = editSession; |
| requestSent | variable | 809 | no | let requestSent = false; |
| reviewed | const | 810 | no | const reviewed = session.preview; |
| fresh | const | 814 | no | const fresh = await getJson(&#39;wiki&#39;); |
| payload | const | 823 | no | const payload = mutationEnvelope(session, reviewed.revision, reviewed.after); |
| csrf | const | 825 | no | const csrf = await ownerEditCsrf({ fresh: true }); |
| result | const | 827 | no | const result = await fetch(&#39;/api/mutate&#39;, { method: &#39;POST&#39;, credentials: &#39;same-origin&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;x-vivim-ui-csrf&#39;: csrf }, body: JSON.st… |
| detail | const | 834 | no | const detail = (await result.text()).slice(0, 240); |
| acknowledgement | const | 839 | no | const acknowledgement = await result.json(); |
| csrf | const | 890 | no | const csrf = await ownerEditCsrf({ fresh: true }); |
| response | const | 891 | no | const response = await fetch(&#39;/api/file-surface/index&#39;, { method: &#39;POST&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: { &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;x-vivim-ui-csrf&#39;: csrf }, signal: AbortSig… |
| result | const | 897 | no | const result = await response.json(); |
| epoch | const | 900 | no | const epoch = surfaceQueryEpoch; |
| currentSurface | const | 901 | no | const currentSurface = await getJson(&#39;surface&#39;); |
| assistPanel | const | 910 | no | const assistPanel=$(&#39;composer-assist&#39;); |
| csrf | const | 914 | no | const csrf=ownerCsrf; |
| response | const | 916 | no | const response=await fetch(&#39;/api/host/control/interpret&#39;,{ method:&#39;POST&#39;,credentials:&#39;same-origin&#39;,cache:&#39;no-store&#39;,signal:AbortSignal.timeout(5000), headers:{&#39;content-type&#39;:&#39;application/json&#39;,&#39;x-viv… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| /mobile/control-language.mjs | import | 1 | external |
| /mobile/composer-assist.mjs | import | 2 | external |
| /mobile/wiki-source-view.mjs | import | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { resolveDesktopDestination, resolveProductRoute } from '/mobile/control-language.mjs';
import { mountComposerAssist } from '/mobile/composer-assist.mjs';
import { sourceCards, sameSourceCard, matchesSourceContext, exactSourceContextUrl, reconcileSourceCards } from '/mobile/wiki-source-view.mjs';
// Host read-model and reviewed Wiki drafts. NL interpretation belongs to Host;
// only the existing owner-confirmed mutation endpoint writes Wiki content.
// VEC/0.1 typed display seam: {schema:'vivim.vec-compile/0.1', domain:'wiki',
// product:'wiki-projection', outcome:'unsupported', code:'LEGACY_OWNER_NOT_MIGRATED',
// authorization:'none', executed:false, persisted:false}. No adapter is installed here.
const SOURCES = Object.freeze({
  wiki: { url: '/api/wiki', path: 'Host product journal → Wiki projection' },
  state: { url: '/api/state', path: 'Host product journal → chat state projection' },
  context: { url: '/api/host/control/wiki-context', path: 'Owner-private journal → observations and committed Wiki effects' },
  surface: { url: '/api/file-surface', path: 'Owner-authorized HQ executable source index' },
  journal: { url: '/api/journal', path: 'Host data-root/product-state/journal.jsonl' }
});
const ACTOR = 'owner-browser';
const POLL_MS = 1600;
const MAX_ENTRY_BYTES = 4096;
const HANDOFF_KEY = 'vivim.desktop-chat-draft.v1';
const $ = id => document.getElementById(id);
const snapshots = Object.create(null);
let editSession = null;
let refreshing = false;
let busy = false;
let ownerCsrf = null; // memory-only proof of a native Host-issued short-lived session
let interpreting = false;
let assistance=null;
let surfaceQuery = '';
let surfaceQueryEpoch = 0;
let surfaceContextEpoch = 0;
let surfaceContextSelection = null;
let autoContextPending = false;
let indexingSources = false;
let sourceCardHost=null;

function element(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = String(text);
  return result;
}
function present(value, fallback = '—') { return value === undefined || value === null ? fallback : String(value); }
function isWikiDocument(wiki) {
  return wiki && Number.isSafeInteger(wiki.revision) && wiki.revision >= 0 &&
    wiki.pages && typeof wiki.pages === 'object' && !Array.isArray(wiki.pages);
}
function entriesOf(journal) {
  return Array.isArray(journal) ? journal : Array.isArray(journal?.entries) ? journal.entries : [];
}
function fileRecords(surface) {
  // Live HQ projection keeps the existing vivim.file-surface/1 files contract.
  return Array.isArray(surface?.files) ? surface.files :
    Array.isArray(surface?.records) ? surface.records : Array.isArray(surface) ? surface : [];
}
function sourceRecord(key) { return snapshots[key]?.data; }
function observedEdit(page, section, content) {
  const journal = sourceRecord('journal');
  if (!journal) return 'provenance not observed';
  const matched = entriesOf(journal).some(entry => entry?.kind === 'wiki-edit' &&
    entry.edit?.page === page && entry.edit?.section === section && entry.edit?.content === content);
  return matched ? 'journal-backed edit observed' : 'initial section / no edit record observed';
}
function sectionEl(page, section, text, revision) {
  const wrapper = element('article', 'section');
  wrapper.dataset.wikiId = page + '/' + section;
  wrapper.dataset.revision = String(revision);
  const head = element('div', 'section-head');
  head.appendChild(element('h4', '', section));
  const edit = element('button', '', 'Edit');
  edit.type = 'button';
  edit.setAttribute('aria-label', `Edit Wiki section ${page}/${section}`);
  edit.addEventListener('click', () => openEdit(page, section, text, revision));
  head.appendChild(edit);
  wrapper.appendChild(head);
  wrapper.appendChild(element('p', 'body', text));
  wrapper.appendChild(element('div', 'meta', `data-wiki-id=${page}/${section} · Wiki rev ${revision} · ${observedEdit(page, section, text)}`));
  return wrapper;
}
function renderWiki(wiki) {
  const root = element('div', 'stack');
```

_First 80 of 936 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
