# File: studio/src/studio/ui/drive.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/drive.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 25849 B |
| Lines | 516 |
| Hash | 02488b1443d2 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| API | const | 4 | no | const API = &#39;/api/v1/drive&#39;; |
| POLL_MS | const | 5 | no | const POLL_MS = 1500; |
| ACTIVE | const | 6 | no | const ACTIVE = new Set([&#39;queued&#39;, &#39;running&#39;]); |
| $ | function | 8 | no | const $ = (sel, root = document) =&gt; root.querySelector(sel); |
| el | function | 10 | no | function el(tag, props = {}, kids = []) { |
| node | const | 11 | no | const node = document.createElement(tag); |
| S | const | 23 | no | const S = { |
| authExpired | variable | 29 | no | let authExpired = false; |
| setAuthNote | function | 30 | no | function setAuthNote(on) { |
| api | function | 34 | no | async function api(path, { method = &#39;GET&#39;, body } = {}) { |
| res | variable | 35 | no | let res; |
| err | const | 43 | no | const err = new Error(&#39;Could not reach the Studio. Check that it is still running.&#39;); |
| data | variable | 46 | no | let data = {}; |
| text | const | 47 | no | const text = await res.text(); |
| err | const | 52 | no | const err = new Error(data?.error \|\| res.statusText \|\| &#39;Request failed&#39;); |
| describe | function | 57 | no | function describe(e) { |
| VERDICTS | const | 66 | no | const VERDICTS = { |
| JOB_STATES | const | 73 | no | const JOB_STATES = { |
| chip | function | 76 | no | function chip(cls, label) { |
| verdictChip | function | 79 | no | function verdictChip(v) { |
| m | const | 80 | no | const m = VERDICTS[v] ?? { label: v ? String(v) : &#39;Not run&#39;, cls: &#39;v-notrun&#39; }; |
| toMs | function | 85 | no | function toMs(v) { |
| n | const | 87 | no | const n = typeof v === &#39;number&#39; ? v : (/^\\d+$/.test(String(v)) ? Number(v) : Date.parse(v)); |
| ago | function | 90 | no | function ago(ms) { |
| s | const | 91 | no | const s = Math.round((Date.now() - ms) / 1000); |
| m | const | 94 | no | const m = Math.round(s / 60); |
| h | const | 96 | no | const h = Math.round(m / 60); |
| timeNode | function | 99 | no | function timeNode(v, { absolute = false } = {}) { |
| ms | const | 100 | no | const ms = toMs(v); |
| d | const | 102 | no | const d = new Date(ms); |
| sessionLinks | function | 109 | no | function sessionLinks(id) { |
| siteStatusNodes | function | 122 | no | function siteStatusNodes(site) { |
| last | const | 123 | no | const last = site.last; |
| nodes | const | 125 | no | const nodes = [verdictChip(last.status)]; |
| when | const | 127 | no | const when = toMs(last.at); |
| links | const | 129 | no | const links = sessionLinks(last.sessionId); |
| renderSites | function | 133 | no | function renderSites() { |
| list | const | 134 | no | const list = $(&#39;#siteList&#39;); |
| same | const | 135 | no | const same = S.rows.size === S.sites.length &amp;&amp; S.sites.every((s) =&gt; S.rows.has(s.id)); |
| inputId | const | 142 | no | const inputId = &#39;site-&#39; + i, statusId = &#39;site-status-&#39; + i; |
| input | const | 143 | no | const input = el(&#39;input&#39;, { type: &#39;checkbox&#39;, id: inputId, &#39;aria-describedby&#39;: statusId, onchange: () =&gt; onSiteToggle(s.id, input.checked) }); |
| status | const | 144 | no | const status = el(&#39;div&#39;, { class: &#39;site-status&#39;, id: statusId }); |
| label | const | 146 | no | const label = el(&#39;label&#39;, { for: inputId }, [ input, el(&#39;span&#39;, { class: &#39;sname&#39;, text: s.id + (s.adapter &amp;&amp; s.adapter !== s.id ? &#39; · &#39; + s.adapter : &#39;&#39;) }), s.url ? el(&#39;span&#39;, { class: &#39;surl&#39;, text:… |
| syncChecks | function | 156 | no | function syncChecks() { |
| n | const | 158 | no | const n = S.selected.size; |
| loadSites | function | 161 | no | async function loadSites() { |
| state | const | 162 | no | const state = $(&#39;#siteState&#39;); |
| data | const | 165 | no | const data = await api(&#39;/sites&#39;); |
| setMode | function | 189 | no | function setMode(mode) { |
| onSiteToggle | function | 199 | no | function onSiteToggle(id, checked) { |
| touched | function | 207 | no | function touched() { $(&#39;#formError&#39;).textContent = &#39;&#39;; updateControls(); } |
| currentTargets | function | 209 | no | function currentTargets() { |
| url | const | 211 | no | const url = $(&#39;#driveUrl&#39;).value.trim(); |
| ok | variable | 213 | no | let ok = false; |
| activeJobId | function | 220 | no | function activeJobId() { |
| updateControls | function | 224 | no | function updateControls() { |
| t | const | 225 | no | const t = currentTargets(), active = activeJobId(); |
| ready | const | 227 | no | const ready = t.sites.length &gt; 0 &amp;&amp; !t.error &amp;&amp; !S.busy &amp;&amp; !active; |
| hint | variable | 230 | no | let hint; |
| numberField | function | 241 | no | function numberField(id, min = 0) { |
| raw | const | 242 | no | const raw = $(id).value.trim(); |
| n | const | 244 | no | const n = Number(raw); |
| launch | function | 247 | no | async function launch(dryRun) { |
| t | const | 248 | no | const t = currentTargets(); |
| body | const | 250 | no | const body = { mode: S.mode, sites: t.sites, dryRun }; |
| prompt | const | 252 | no | const prompt = $(&#39;#prompt&#39;).value.trim(); |
| timeout | const | 254 | no | const timeout = numberField(&#39;#timeout&#39;, 1), cooldown = numberField(&#39;#cooldown&#39;, 0); |
| id | const | 274 | no | const id = e.data?.activeJobId; |
| holder | const | 275 | no | const holder = e.data?.holder; |
| error | const | 276 | no | const error = $(&#39;#formError&#39;); |
| counts | function | 296 | no | function counts(progress) { |
| c | const | 297 | no | const c = { verified: 0, unverified: 0, failed: 0, blocked: 0, skipped: 0, other: 0 }; |
| summaryText | function | 306 | no | function summaryText(job) { |
| progress | const | 307 | no | const progress = job.progress ?? [], total = progress.length \|\| job.sites?.length \|\| 0; |
| finished | const | 308 | no | const finished = progress.filter((p) =&gt; p.state === &#39;done&#39; \|\| p.state === &#39;failed&#39; \|\| p.state === &#39;skipped&#39;).length; |
| c | const | 309 | no | const c = counts(progress); |
| tally | const | 310 | no | const tally = c.verified + &#39; reply matched · &#39; + c.unverified + &#39; reply not confirmed · &#39; + c.failed + &#39; failed · &#39; + c.blocked + &#39; blocked&#39; + (c.skipped ? &#39; · &#39; + c.skipped + &#39; skipped&#39; : &#39;&#39;); |
| now | const | 314 | no | const now = progress.find((p) =&gt; p.state === &#39;running&#39;); |
| rowChip | function | 327 | no | function rowChip(p, job) { |
| segClass | function | 338 | no | function segClass(p) { |
| renderProgress | function | 345 | no | function renderProgress(job) { |
| rows | const | 346 | no | const rows = job.progress?.length ? job.progress : (job.sites ?? []).map((site) =&gt; ({ site, state: &#39;pending&#39;, verdict: null })); |
| sig | const | 347 | no | const sig = JSON.stringify([job.id, job.dryRun, rows]); |
| focused | const | 351 | no | const focused = document.activeElement?.dataset?.focus; |
| list | const | 352 | no | const list = $(&#39;#progress&#39;); |
| details | const | 354 | no | const details = []; |
| links | const | 357 | no | const links = sessionLinks(p.sessionId); |
| renderJob | function | 369 | no | function renderJob(job) { |
| n | const | 376 | no | const n = job.sites?.length ?? 0; |
| meta | const | 377 | no | const meta = [(job.mode === &#39;campaign&#39; ? &#39;Campaign&#39; : &#39;Drive&#39;) + &#39; · &#39; + n + (n === 1 ? &#39; site&#39; : &#39; sites&#39;)]; |
| stamp | function | 378 | no | const stamp = (label, v) =&gt; { if (toMs(v) != null) meta.push(&#39; · &#39; + label + &#39; &#39;, timeNode(v, { absolute: true })); }; |
| active | const | 385 | no | const active = ACTIVE.has(job.state); |
| requested | const | 388 | no | const requested = S.stopRequested === job.id; |
| showJob | function | 396 | no | function showJob(job) { |
| openJob | function | 403 | no | async function openJob(id) { |
| requestSeq | const | 404 | no | const requestSeq = ++S.jobRequestSeq; |
| note | const | 416 | no | const note = &#39;Could not load requested job: &#39; + describe(e) + |
| stopPolling | function | 423 | no | function stopPolling() { S.pollSeq++; clearTimeout(S.pollTimer); S.failures = 0; $(&#39;#pollNote&#39;).textContent = &#39;&#39;; } |
| startPolling | function | 424 | no | function startPolling(id) { |
| seq | const | 425 | no | const seq = ++S.pollSeq; |
| tick | function | 426 | no | const tick = async () =&gt; { |
| refreshAfterEnd | function | 446 | no | function refreshAfterEnd() { loadSites(); loadJobs(); } |
| job | const | 449 | no | const job = S.job; if (!job) return; |
| btn | const | 450 | no | const btn = $(&#39;#btnCancel&#39;); |
| renderJobs | function | 467 | no | function renderJobs() { |
| list | const | 468 | no | const list = $(&#39;#jobList&#39;), state = $(&#39;#jobsState&#39;); |
| n | const | 472 | no | const n = j.sites?.length ?? 0; |
| btn | const | 473 | no | const btn = el(&#39;button&#39;, { type: &#39;button&#39;, &#39;data-id&#39;: j.id, onclick: () =&gt; openJob(j.id) }, [ timeNode(j.createdAt), el(&#39;span&#39;, { text: (j.mode === &#39;campaign&#39; ? &#39;Campaign&#39; : &#39;Drive&#39;) + &#39; · &#39; + n + (n… |
| loadJobs | function | 483 | no | async function loadJobs() { |
| state | const | 484 | no | const state = $(&#39;#jobsState&#39;); |
| data | const | 487 | no | const data = await api(&#39;/jobs&#39;); |
| running | const | 514 | no | const running = S.jobs.find((j) =&gt; ACTIVE.has(j.state)); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Live drive page. Same-origin fetches only; the studio cookie authenticates every request.
// Everything that came from a site (reasons, ids, urls) is rendered with textContent and DOM nodes, never as HTML.

const API = '/api/v1/drive';
const POLL_MS = 1500;
const ACTIVE = new Set(['queued', 'running']);

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, props = {}, kids = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const kid of [].concat(kids)) if (kid != null) node.append(kid);
  return node;
}

const S = {
  sites: [], defaultPrompt: '', mode: 'drive', selected: new Set(), rows: new Map(),
  job: null, jobs: [], pollTimer: null, pollSeq: 0, jobRequestSeq: 0, failures: 0, busy: false, progressSig: '', stopRequested: null,
};

/* ---------------- api ---------------- */
let authExpired = false;
function setAuthNote(on) {
  authExpired = on;
  $('#connectionNote').textContent = on ? 'Studio request rejected. Local mode needs no token; if token mode is enabled, reopen the startup URL.' : '';
}
async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      method, credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error('Could not reach the Studio. Check that it is still running.');
    err.status = 0; throw err;
  }
  let data = {};
  const text = await res.text();
  if (text) { try { data = JSON.parse(text); } catch { data = { error: 'The Studio sent a reply that was not JSON.' }; } }
  if (res.status === 401 || res.status === 403) setAuthNote(true);
  else if (res.ok && authExpired) setAuthNote(false);
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Request failed');
    err.status = res.status; err.data = data; throw err;
  }
  return data;
}
function describe(e) {
  if (e.status === 401 || e.status === 403) return 'Local Studio refused this request. Check its address and Origin settings; if token mode is enabled, reopen the startup URL.';
  if (e.status === 404) return 'Not found. This Studio build may not include Live drive, or the item no longer exists.';
  return e.message;
}

/* ---------------- labels ---------------- */
// The API values (verified, unverified, ...) are unchanged. "verified" here only ever meant the reply
// matched the expected words; this page never evaluates whether the saved capture was accepted.
const VERDICTS = {
  verified: { label: 'Reply matched', cls: 'v-verified' },
  unverified: { label: 'Reply not confirmed', cls: 'v-unverified' },
  failed: { label: 'Failed', cls: 'v-failed' },
  blocked: { label: 'Blocked', cls: 'v-blocked' },
  'not-run': { label: 'Not run', cls: 'v-notrun' },
};
const JOB_STATES = {
  queued: 'Waiting to start', running: 'Running', done: 'Finished', failed: 'Job failed', cancelled: 'Stopped',
};
function chip(cls, label) {
  return el('span', { class: 'pill ' + cls }, [label]);
}
function verdictChip(v) {
  const m = VERDICTS[v] ?? { label: v ? String(v) : 'Not run', cls: 'v-notrun' };
```

_First 80 of 517 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
