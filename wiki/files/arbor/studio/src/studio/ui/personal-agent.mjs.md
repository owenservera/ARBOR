# File: studio/src/studio/ui/personal-agent.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/personal-agent.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 47568 B |
| Lines | 879 |
| Hash | 7ef548ae5f7f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| API | const | 3 | no | const API = &#39;/api/v1/personal-agent&#39;; |
| COMPARE_API | const | 6 | no | const COMPARE_API = &#39;/api/v1/compare&#39;; |
| COMPARE_SITES | const | 7 | no | const COMPARE_SITES = [ |
| $ | function | 11 | no | const $ = id =&gt; document.getElementById(id); |
| snapshot | variable | 12 | no | let snapshot = null; |
| stageLabels | const | 13 | no | const stageLabels = { |
| request | function | 19 | no | async function request(endpoint, options = {}) { |
| response | const | 20 | no | const response = await fetch(API + endpoint, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, ...options, }).catch(() =&gt; { throw new Error(&#39;Studio is … |
| data | const | 25 | no | const data = await response.json(); |
| friendly | const | 27 | no | const friendly = response.status === 409 |
| error | const | 33 | no | const error = new Error(friendly); |
| compareRequest | function | 40 | no | async function compareRequest(path, options = {}) { |
| response | const | 41 | no | const response = await fetch(COMPARE_API + path, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, ...options, }).catch(() =&gt; { throw new Error(&#39;Studio… |
| data | const | 46 | no | const data = await response.json(); |
| friendly | const | 48 | no | const friendly = response.status === 409 |
| error | const | 52 | no | const error = new Error(friendly); |
| element | function | 58 | no | function element(tag, text, cls) { |
| node | const | 59 | no | const node = document.createElement(tag); |
| message | function | 64 | no | function message(text, error = false) { |
| showStatus | function | 68 | no | function showStatus(status) { |
| w | const | 80 | no | const w = status.work; |
| stages | const | 87 | no | const stages = $(&#39;stages&#39;); |
| value | const | 90 | no | const value = status.stages?.[key]; |
| item | const | 91 | no | const item = element(&#39;li&#39;); |
| refresh | function | 98 | no | async function refresh() { |
| bootstrap | function | 102 | no | async function bootstrap() { |
| before | const | 106 | no | const before = await request(&#39;/status&#39;); |
| result | const | 107 | no | const result = await request(&#39;/bootstrap&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ expectedVersion: before.initialized ? before.version : null }), }); |
| discover | function | 115 | no | async function discover() { |
| data | const | 119 | no | const data = await request(&#39;/capabilities&#39;); |
| area | const | 120 | no | const area = $(&#39;discovery&#39;); |
| details | const | 123 | no | const details = element(&#39;details&#39;), summary = element(&#39;summary&#39;, &#39;Inspect discovered skills and registered tools&#39;); |
| pre | const | 124 | no | const pre = element(&#39;pre&#39;, JSON.stringify({ skills: data.skills.items.map(x =&gt; ({ path: x.path, trust: x.trust, availability: x.availability })), tools: data.tools, coverage: { complete: data.skills.… |
| readMemory | function | 134 | no | async function readMemory() { |
| tier | const | 135 | no | const tier = $(&#39;tier&#39;).value; |
| area | const | 136 | no | const area = $(&#39;entries&#39;); |
| data | const | 139 | no | const data = await request(&#39;/memory/&#39; + encodeURIComponent(tier)); |
| note | const | 143 | no | const note = element(&#39;article&#39;); |
| remove | const | 144 | no | const remove = element(&#39;button&#39;, &#39;Remove entry&#39;, &#39;secondary&#39;); |
| current | const | 150 | no | const current = await request(&#39;/status&#39;); |
| saveMemory | function | 164 | no | async function saveMemory(event) { |
| tier | const | 167 | no | const tier = $(&#39;tier&#39;).value, key = $(&#39;memoryKey&#39;).value.trim(), text = $(&#39;memoryText&#39;).value.trim(); |
| current | const | 170 | no | const current = await request(&#39;/status&#39;); |
| workTransitions | const | 187 | no | const workTransitions = { |
| pendingWorkKey | variable | 193 | no | let pendingWorkKey = null; |
| pendingWorkSignature | variable | 194 | no | let pendingWorkSignature = null; |
| workStatusLabels | const | 195 | no | const workStatusLabels = { queued: &#39;To do&#39;, active: &#39;In progress&#39;, blocked: &#39;Waiting for you&#39;, completed: &#39;Done&#39;, cancelled: &#39;Cancelled&#39; }; |
| workActionDrafts | const | 196 | no | const workActionDrafts = new Map(); |
| readContinuity | function | 198 | no | function readContinuity(key, fallback = null) { |
| writeContinuity | function | 202 | no | function writeContinuity(key, value) { |
| savedUpdates | const | 208 | no | const savedUpdates = readContinuity(&#39;work-updates&#39;, {}); |
| workUpdates | const | 209 | no | const workUpdates = new Map(Object.entries(savedUpdates &amp;&amp; typeof savedUpdates === &#39;object&#39; ? savedUpdates : {})); |
| workBusy | const | 210 | no | const workBusy = new Set(); |
| workLoadToken | variable | 211 | no | let workLoadToken = 0; |
| rememberUpdate | function | 212 | no | function rememberUpdate(id, update) { |
| contextResults | const | 222 | no | const contextResults = new Map(); // workId -&gt; relevant-memory response, or { error } |
| askDrafts | const | 223 | no | const askDrafts = new Map(); // workId -&gt; user-edited question text (lost on reload, like other drafts) |
| askSiteSelections | const | 224 | no | const askSiteSelections = new Map(); // workId -&gt; Set of chosen site ids |
| askOpenPanels | const | 225 | no | const askOpenPanels = new Set(); // workId whose Ask panel is expanded |
| askPolling | const | 226 | no | const askPolling = new Set(); // workId with a running poll loop (at most one per Work item) |
| askPanelRefs | const | 227 | no | const askPanelRefs = new Map(); // workId -&gt; live DOM refs for the CURRENT render of its card |
| askJobViews | const | 228 | no | const askJobViews = new Map(); // workId -&gt; latest read comparison job (in-memory only) |
| savedAskJobs | const | 229 | no | const savedAskJobs = readContinuity(&#39;ask-jobs&#39;, {}); |
| askJobRefs | const | 230 | no | const askJobRefs = new Map(Object.entries(savedAskJobs &amp;&amp; typeof savedAskJobs === &#39;object&#39; ? savedAskJobs : {})); |
| rememberAskJob | function | 231 | no | function rememberAskJob(workId, ref) { |
| compareResultLabels | const | 235 | no | const compareResultLabels = { queued: &#39;Waiting to start&#39;, waiting: &#39;Waiting for the answer&#39;, |
| compareStateMessage | function | 237 | no | function compareStateMessage(state) { |
| fetchRelevantMemory | function | 243 | no | async function fetchRelevantMemory(workId) { |
| data | const | 245 | no | const data = await request(&#39;/work/&#39; + encodeURIComponent(workId) + &#39;/relevant-memory?tier=all&#39;); |
| renderContext | function | 250 | no | function renderContext(workId, area) { |
| data | const | 251 | no | const data = contextResults.get(workId); |
| note | const | 257 | no | const note = element(&#39;article&#39;); |
| defaultAskQuestion | function | 263 | no | function defaultAskQuestion(item) { |
| context | const | 264 | no | const context = contextResults.get(item.id); |
| parts | const | 265 | no | const parts = [&#39;Help me with this task: &#39; + item.title + &#39;.&#39;]; |
| renderAskAnswers | function | 271 | no | function renderAskAnswers(workId, area) { |
| job | const | 272 | no | const job = askJobViews.get(workId); |
| row | const | 276 | no | const row = element(&#39;article&#39;); |
| review | const | 283 | no | const review = element(&#39;button&#39;, &#39;Review this answer to save it to Work&#39;, &#39;secondary&#39;); |
| pollAsk | function | 294 | no | async function pollAsk(workId) { |
| ref | const | 299 | no | const ref = askJobRefs.get(workId); |
| job | variable | 301 | no | let job; |
| refs | const | 304 | no | const refs = askPanelRefs.get(workId); |
| refs | const | 309 | no | const refs = askPanelRefs.get(workId); |
| refs | const | 320 | no | const refs = askPanelRefs.get(workId); |
| startAsk | function | 324 | no | async function startAsk(workId, questionBox, selectedSites, button, statusEl) { |
| question | const | 325 | no | const question = questionBox.value.trim(); |
| sites | const | 333 | no | const sites = COMPARE_SITES.map(site =&gt; site.id).filter(id =&gt; selectedSites.has(id)); |
| data | const | 334 | no | const data = await compareRequest(&#39;&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ question, sites }) }); |
| refs | const | 337 | no | const refs = askPanelRefs.get(workId); |
| resumeAskJobs | function | 345 | no | async function resumeAskJobs() { |
| refs | const | 348 | no | const refs = askPanelRefs.get(workId); |
| job | const | 350 | no | const job = (await compareRequest(&#39;/&#39; + encodeURIComponent(ref.jobId))).job; |
| missionArea | variable | 365 | no | let missionArea = null; |
| ensureMissionArea | function | 366 | no | function ensureMissionArea() { |
| anchor | const | 368 | no | const anchor = $(&#39;workList&#39;); |
| reload | const | 374 | no | const reload = element(&#39;button&#39;, &#39;Check request status&#39;, &#39;secondary&#39;); |
| body | const | 378 | no | const body = element(&#39;div&#39;); |
| renderOutcomeCard | function | 385 | no | function renderOutcomeCard(outcome) { |
| card | const | 386 | no | const card = element(&#39;article&#39;); |
| details | const | 400 | no | const details = element(&#39;details&#39;); |
| loadOutcomeCards | function | 411 | no | async function loadOutcomeCards() { |
| body | const | 413 | no | const body = $(&#39;outcomeExperienceCards&#39;); |
| paths | const | 415 | no | const paths = [&#39;/api/v1/orchestrate/outcomes&#39;, &#39;/api/v1/personal-agent/outcomes&#39;]; |
| responses | const | 416 | no | const responses = await Promise.allSettled(paths.map(async path =&gt; { const response = await fetch(path, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); if (!response.ok) throw new Error(&#39;unavaila… |
| response | const | 417 | no | const response = await fetch(path, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); |
| json | const | 419 | no | const json = await response.json(); |
| cards | const | 423 | no | const cards = responses.flatMap(r =&gt; r.status === &#39;fulfilled&#39; ? r.value : []); |
| rank | const | 424 | no | const rank = { &#39;needs-attention&#39;: 0, partial: 1, working: 2, ready: 3, |
| loadWork | function | 437 | no | async function loadWork() { |
| area | const | 438 | no | const area = $(&#39;workList&#39;); |
| token | const | 439 | no | const token = ++workLoadToken; |
| data | const | 442 | no | const data = await request(&#39;/work&#39;); |
| filter | const | 445 | no | const filter = $(&#39;workFilter&#39;).value; |
| visible | const | 446 | no | const visible = data.items.filter(item =&gt; filter === &#39;all&#39; \|\| (filter === &#39;open&#39; ? [&#39;queued&#39;, &#39;active&#39;, &#39;blocked&#39;].includes(item.status) : item.status === filter)); |
| pending | const | 454 | no | const pending = workUpdates.get(item.id); |
| card | const | 458 | no | const card = element(&#39;article&#39;); |
| history | const | 465 | no | const history = element(&#39;details&#39;); |
| description | const | 469 | no | const description = event.type === &#39;created&#39; ? &#39;Added to Work&#39; |
| context | const | 476 | no | const context = element(&#39;button&#39;, &#39;Find saved context&#39;, &#39;secondary&#39;); |
| contextArea | const | 478 | no | const contextArea = element(&#39;div&#39;); |
| askToggle | const | 490 | no | const askToggle = element(&#39;button&#39;, &#39;Ask my AI about this&#39;, &#39;secondary&#39;); |
| askPanel | const | 492 | no | const askPanel = element(&#39;div&#39;); |
| questionLabel | const | 495 | no | const questionLabel = element(&#39;label&#39;); |
| questionBox | const | 497 | no | const questionBox = element(&#39;textarea&#39;); |
| siteFieldset | const | 505 | no | const siteFieldset = element(&#39;fieldset&#39;); |
| selectedSites | const | 510 | no | const selectedSites = askSiteSelections.get(item.id) ?? new Set(); |
| siteLabel | const | 513 | no | const siteLabel = element(&#39;label&#39;); |
| siteBox | const | 521 | no | const siteBox = element(&#39;input&#39;); |
| askButton | const | 534 | no | const askButton = element(&#39;button&#39;, &#39;Ask my AI&#39;); |
| askStatus | const | 536 | no | const askStatus = element(&#39;p&#39;, &#39;&#39;, &#39;subtle&#39;); |
| askAnswers | const | 538 | no | const askAnswers = element(&#39;div&#39;); |
| opening | const | 543 | no | const opening = askPanel.hidden; |
| next | const | 557 | no | const next = element(&#39;textarea&#39;); |
| save | const | 564 | no | const save = element(&#39;button&#39;, &#39;Save next action&#39;, &#39;secondary&#39;); |
| planned | const | 568 | no | const planned = next.value.trim(); |
| status | const | 575 | no | const status = await request(&#39;/status&#39;); |
| plan | const | 587 | no | const plan = element(&#39;div&#39;); |
| transitions | const | 592 | no | const transitions = workTransitions[item.status] ?? []; |
| option | const | 597 | no | const option = element(&#39;option&#39;, workStatusLabels[status]); |
| note | const | 601 | no | const note = element(&#39;input&#39;); |
| evidence | const | 605 | no | const evidence = element(&#39;input&#39;); |
| button | const | 609 | no | const button = element(&#39;button&#39;, item.status === &#39;blocked&#39; ? &#39;Resume Work&#39; : &#39;Update Work&#39;, &#39;secondary&#39;); |
| savedUpdate | const | 611 | no | const savedUpdate = workUpdates.get(item.id); |
| updateLabel | function | 617 | no | const updateLabel = () =&gt; { button.textContent = item.status === &#39;blocked&#39; &amp;&amp; select.value === &#39;active&#39; ? &#39;Resume Work&#39; : &#39;Update Work&#39;; }; |
| refs | const | 626 | no | const refs = evidence.value.split(&#39;,&#39;).map(ref =&gt; ref.trim()).filter(Boolean); |
| payload | const | 627 | no | const payload = { to: select.value, note: note.value.trim(), evidence: refs }; |
| current | const | 637 | no | const current = await request(&#39;/status&#39;); |
| signature | const | 638 | no | const signature = JSON.stringify(payload); |
| pendingUpdate | variable | 639 | no | let pendingUpdate = workUpdates.get(item.id); |
| controls | const | 655 | no | const controls = element(&#39;div&#39;); |
| createWork | function | 665 | no | async function createWork(event) { |
| signature | const | 668 | no | const signature = JSON.stringify({ title: $(&#39;workTitle&#39;).value, objective: $(&#39;workObjective&#39;).value }); |
| latest | const | 675 | no | const latest = await request(&#39;/status&#39;); |
| CONVERSATIONS_API | const | 690 | no | const CONVERSATIONS_API = &#39;/api/v1/conversations&#39;; |
| replyPreviewToken | variable | 691 | no | let replyPreviewToken = 0; |
| replyApplying | variable | 692 | no | let replyApplying = false; |
| restoreReplyPreview | function | 693 | no | async function restoreReplyPreview() { |
| choice | const | 694 | no | const choice = readContinuity(&#39;reply-choice&#39;); |
| loadReplyChoices | function | 699 | no | async function loadReplyChoices() { |
| area | const | 700 | no | const area = $(&#39;replyChoices&#39;), button = $(&#39;replyLoad&#39;); |
| response | const | 706 | no | const response = await fetch(CONVERSATIONS_API, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); |
| data | const | 707 | no | const data = await response.json(); |
| items | const | 711 | no | const items = []; |
| row | const | 724 | no | const row = element(&#39;div&#39;); |
| pick | const | 725 | no | const pick = element(&#39;button&#39;, `Review ${choice.site} reply · ${choice.conversation} / ${choice.turnId}${choice.chars === null ? &#39;&#39; : &#39; (&#39; + choice.chars + &#39; characters)&#39;}`, &#39;secondary&#39;); |
| previewReply | function | 735 | no | async function previewReply(choice) { |
| area | const | 736 | no | const area = $(&#39;replyPreview&#39;), token = ++replyPreviewToken; |
| data | const | 739 | no | const data = await request(&#39;/work/preview-provider-reply&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ conversation: choice.conversation, turnId: choice.turnId }), }); |
| card | const | 750 | no | const card = element(&#39;article&#39;); |
| save | const | 758 | no | const save = element(&#39;button&#39;, data.alreadySaved ? &#39;Already saved in Work&#39; : &#39;Save as Work item (I approve)&#39;); |
| latest | const | 767 | no | const latest = await request(&#39;/status&#39;); |
| showKnowledge | function | 788 | no | async function showKnowledge() { |
| area | const | 789 | no | const area = $(&#39;selfKnowledge&#39;); |
| data | const | 792 | no | const data = await request(&#39;/self-knowledge?topic=&#39; + encodeURIComponent($(&#39;knowledgeTopic&#39;).value)); |
| card | const | 795 | no | const card = element(&#39;article&#39;); |
| showSitrep | function | 808 | no | async function showSitrep() { |
| output | const | 809 | no | const output = $(&#39;sitrepOutput&#39;); |
| packet | const | 812 | no | const packet = await request(&#39;/sitrep&#39;); |
| exportAgent | function | 817 | no | async function exportAgent() { |
| button | const | 818 | no | const button = $(&#39;exportAgent&#39;); |
| query | const | 821 | no | const query = new URLSearchParams({ includeMemory: String($(&#39;exportMemory&#39;).checked), includeWorkDetails: String($(&#39;exportWork&#39;).checked), }); |
| bundle | const | 825 | no | const bundle = await request(&#39;/export?&#39; + query); |
| blob | const | 826 | no | const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: &#39;application/json&#39; }); |
| uri | const | 827 | no | const uri = URL.createObjectURL(blob); |
| link | const | 829 | no | const link = element(&#39;a&#39;); |
| searchPrivateMemory | function | 848 | no | async function searchPrivateMemory(event) { |
| area | const | 850 | no | const area = $(&#39;memorySearchResults&#39;), button = $(&#39;memorySearchButton&#39;); |
| query | const | 851 | no | const query = $(&#39;memorySearchQuery&#39;).value.trim(), tier = $(&#39;memorySearchTier&#39;).value \|\| &#39;all&#39;; |
| data | const | 859 | no | const data = await request(&#39;/search-memory&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ query, tier, limit: 20 }), }); |
| card | const | 867 | no | const card = element(&#39;article&#39;); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Studio Personal Agent inspector. No browser/provider operations; user actions are explicit.
// (The saved-reply section only reads already-stored replies; it never sends.)
const API = '/api/v1/personal-agent';
// "Ask my AI about this" posts through the EXISTING /api/v1/compare route (owner's own signed-in AI
// webapp accounts). This file only wires the button: it never applies an answer to Work automatically.
const COMPARE_API = '/api/v1/compare';
const COMPARE_SITES = [
  { id: 'chatgpt', label: 'ChatGPT' }, { id: 'claude', label: 'Claude' }, { id: 'zai', label: 'Z.ai' },
  { id: 'qwen', label: 'Qwen' }, { id: 'deepseek', label: 'DeepSeek' }, { id: 'gemini', label: 'Gemini' },
];
const $ = id => document.getElementById(id);
let snapshot = null;
const stageLabels = {
  'identity-and-sitrep': 'Identity and environment',
  'shared-intelligence': 'Shared intelligence source inventory',
  'personal-memory': 'Three-tier personal memory',
  'skills-and-capabilities': 'Skills and capabilities',
};
async function request(endpoint, options = {}) {
  const response = await fetch(API + endpoint, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'content-type': 'application/json' }, ...options,
  }).catch(() => { throw new Error('Studio is unavailable right now. Keep this page open and try Refresh shortly.'); });
  const data = await response.json();
  if (!response.ok) {
    const friendly = response.status === 409
      ? 'Your saved information changed. Refresh, review it, and try again.'
      : response.status === 401 || response.status === 403
        ? 'Open Personal Agent from your paired Studio to continue.'
        : response.status >= 500 ? 'Studio could not complete this. Your draft is still here; try again shortly.'
          : 'This could not be saved. Check the details you entered and try again.';
    const error = new Error(friendly);
    error.code = data.code || String(response.status);
    throw error;
  }
  return data;
}
// Separate base: /api/v1/compare is not under the Personal Agent prefix.
async function compareRequest(path, options = {}) {
  const response = await fetch(COMPARE_API + path, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'content-type': 'application/json' }, ...options,
  }).catch(() => { throw new Error('Studio is unavailable right now. Keep this page open and try again shortly.'); });
  const data = await response.json();
  if (!response.ok) {
    const friendly = response.status === 409
      ? 'This comparison is already running in another VIVIM window. Check that window.'
      : response.status >= 500 ? 'Studio could not start this. Try again shortly.'
        : 'Could not ask your AI with these details. Check your question and choices, then try again.';
    const error = new Error(friendly);
    error.code = data.code || String(response.status);
    throw error;
  }
  return data;
}
function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (cls) node.className = cls;
  return node;
}
function message(text, error = false) {
  $('notice').textContent = text;
  $('notice').setAttribute('role', error ? 'alert' : 'status');
}
function showStatus(status) {
  snapshot = status;
  $('state').textContent = status.initialized
    ? status.nextStage ? 'Ready for local Work · setup can be continued' : 'Ready · local setup complete'
    : 'Set up your Personal Agent to begin';
  $('scope').textContent = status.initialized
    ? 'Saved on this computer. Nothing is sent to an AI unless you choose to send it.'
    : 'Local-only identity; no agent memory has been created';
  $('bootstrap').disabled = false;
  $('saveMemory').disabled = !status.initialized;
  $('workCreate').disabled = !status.initialized;
  $('replyLoad').disabled = !status.initialized;
  const w = status.work;
```

_First 80 of 880 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
