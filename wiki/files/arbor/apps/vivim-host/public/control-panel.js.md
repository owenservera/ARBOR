# File: apps/vivim-host/public/control-panel.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/control-panel.js |
| Language | JavaScript |
| Kind | source |
| Size | 29891 B |
| Lines | 536 |
| Hash | 92b6a1923765 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| $ | function | 7 | no | const $ = id =&gt; document.getElementById(id); |
| form | const | 8 | no | const form = $(&#39;host-command-form&#39;); |
| unlock | const | 10 | no | const unlock = $(&#39;host-control-unlock&#39;); |
| lock | const | 11 | no | const lock = $(&#39;host-control-lock&#39;); |
| text | const | 12 | no | const text = $(&#39;host-command-text&#39;); |
| submit | const | 13 | no | const submit = $(&#39;host-command-submit&#39;); |
| examples | const | 14 | no | const examples = $(&#39;host-control-examples&#39;); |
| catalogBox | const | 15 | no | const catalogBox = $(&#39;host-control-catalog&#39;); |
| result | const | 16 | no | const result = $(&#39;host-control-result&#39;); |
| recent | const | 17 | no | const recent = $(&#39;host-control-recent&#39;); |
| status | const | 18 | no | const status = $(&#39;host-control-auth-status&#39;); |
| csrfProof | variable | 19 | no | let csrfProof = null; |
| catalog | variable | 20 | no | let catalog = null; |
| pending | variable | 21 | no | let pending = null; |
| busy | variable | 22 | no | let busy = false; |
| deviceList | const | 23 | no | const deviceList = $(&#39;device-list&#39;); |
| deviceStatus | const | 24 | no | const deviceStatus = $(&#39;device-status&#39;); |
| quickPreference | const | 25 | no | const quickPreference = $(&#39;host-remember-preference&#39;); |
| quickReview | const | 26 | no | const quickReview = $(&#39;host-remember-review&#39;); |
| preferenceList | const | 27 | no | const preferenceList = $(&#39;host-preferences-list&#39;); |
| preferenceRefresh | const | 28 | no | const preferenceRefresh = $(&#39;host-preferences-refresh&#39;); |
| element | function | 30 | no | function element(tag, className, textValue) { |
| n | const | 31 | no | const n = document.createElement(tag); |
| button | function | 36 | no | function button(label, fn, kind = &#39;&#39;) { |
| b | const | 37 | no | const b = element(&#39;button&#39;, &#39;text-control-button &#39; + kind, label); |
| say | function | 42 | no | function say(message, kind = &#39;&#39;) { |
| setBusy | function | 45 | no | function setBusy(next) { |
| showLocked | function | 54 | no | function showLocked(message = &#39;Open the VIVIM desktop app to unlock private commands.&#39;) { |
| api | function | 77 | no | async function api(route, body) { |
| opts | const | 79 | no | const opts = { method: body === undefined ? &#39;GET&#39; : &#39;POST&#39;, cache: &#39;no-store&#39;, |
| response | const | 87 | no | const response = await fetch(&#39;/api/host/control/&#39; + route, opts); |
| data | const | 88 | no | const data = await response.json().catch(() =&gt; ({})); |
| error | const | 90 | no | const error = new Error(data.error \|\| data.code \|\| &#39;PC refused request (&#39; + response.status + &#39;)&#39;); |
| nativeSession | function | 101 | no | async function nativeSession() { |
| fragment | const | 102 | no | const fragment = window.location?.hash \|\| &#39;&#39;; |
| response | const | 107 | no | const response = await fetch(&#39;/api/host/control/ui-exchange&#39;, { method: &#39;POST&#39;, cache: &#39;no-store&#39;, credentials: &#39;same-origin&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-control&#39;: &#39;1&#39; },… |
| data | const | 112 | no | const data = await response.json().catch(() =&gt; ({})); |
| response | const | 119 | no | const response = await fetch(&#39;/api/host/control/ui-state&#39;, { method: &#39;GET&#39;, cache: &#39;no-store&#39;, credentials: &#39;same-origin&#39; }); |
| data | const | 123 | no | const data = await response.json().catch(() =&gt; ({})); |
| renderRecent | function | 126 | no | function renderRecent(records) { |
| title | const | 128 | no | const title = element(&#39;h3&#39;, &#39;&#39;, &#39;Recent control decisions&#39;); |
| row | const | 132 | no | const row = element(&#39;div&#39;, &#39;text-control-recent-row&#39;); |
| refreshRecent | function | 138 | no | async function refreshRecent() { |
| inspect | function | 143 | no | async function inspect(planId) { |
| renderStatus | function | 151 | no | function renderStatus(record) { |
| box | const | 152 | no | const box = element(&#39;div&#39;, &#39;text-control-plan&#39;); |
| appendReceipt | function | 162 | no | function appendReceipt(box, receipt) { |
| label | const | 163 | no | const label = receipt.status === &#39;applied&#39; ? &#39;Applied&#39; : receipt.status === &#39;failed&#39; ? &#39;Failed&#39; : &#39;Outcome uncertain&#39;; |
| view | const | 172 | no | const view = element(&#39;a&#39;, &#39;text-control-button&#39;, &#39;View updated Wiki&#39;); |
| renderPlan | function | 183 | no | function renderPlan(p) { |
| wrap | const | 186 | no | const wrap = element(&#39;div&#39;, &#39;text-control-plan&#39;); |
| message | const | 193 | no | const message = p.question \|\| (p.outcome === &#39;unavailable&#39; ? p.title + &#39; unavailable (&#39; + p.readiness + &#39;). &#39; + (p.precondition \|\| &#39;&#39;) : p.outcome === &#39;interpretation_required&#39; ? &#39;Unknown command. No… |
| expected | const | 201 | no | const expected = { planId: p.planId, planDigest: p.planDigest }; |
| box | const | 203 | no | const box = element(&#39;div&#39;, &#39;text-control-plan&#39;); |
| actions | const | 221 | no | const actions = element(&#39;div&#39;, &#39;text-control-actions&#39;); |
| plan | function | 230 | no | async function plan(body) { |
| apply | function | 239 | no | async function apply(expected) { |
| receipt | const | 245 | no | const receipt = await api(&#39;execute&#39;, expected); |
| box | const | 246 | no | const box = element(&#39;div&#39;, &#39;text-control-plan&#39;); |
| box | const | 255 | no | const box = element(&#39;div&#39;, &#39;text-control-plan&#39;); |
| actionEditor | function | 262 | no | function actionEditor(a) { |
| item | const | 263 | no | const item = element(&#39;details&#39;, &#39;text-control-action&#39;); |
| summary | const | 264 | no | const summary = element(&#39;summary&#39;); |
| detail | const | 268 | no | const detail = element(&#39;div&#39;, &#39;text-control-action-body&#39;); |
| inputs | const | 270 | no | const inputs = {}; |
| label | const | 272 | no | const label = element(&#39;label&#39;, &#39;text-control-field&#39;); |
| input | variable | 274 | no | let input; |
| opt | const | 278 | no | const opt = element(&#39;option&#39;, &#39;&#39;, val); |
| renderCatalog | function | 311 | no | function renderCatalog(actions) { |
| dev | const | 313 | no | const dev=element(&#39;details&#39;,&#39;text-control-action&#39;); |
| view | const | 315 | no | const view=element(&#39;div&#39;,&#39;text-control-action-body&#39;);dev.append(view);catalogBox.append(dev); |
| refreshDevelopment | function | 316 | no | async function refreshDevelopment(){ |
| data | const | 320 | no | const data=await api(&#39;development/status&#39;);if(!csrfProof\|\|!view.isConnected)return; |
| controls | const | 321 | no | const controls=element(&#39;div&#39;,&#39;text-control-action-body&#39;); |
| name | const | 323 | no | const name=element(&#39;input&#39;);name.placeholder=&#39;Project name&#39;;name.maxLength=128;name.setAttribute(&#39;aria-label&#39;,&#39;Project name&#39;); |
| root | const | 324 | no | const root=element(&#39;select&#39;);root.setAttribute(&#39;aria-label&#39;,&#39;Approved repository root&#39;); |
| run | const | 326 | no | const run=async(route,body)=&gt;{if(!csrfProof\|\|busy)return;setBusy(true);try{ |
| out | const | 327 | no | const out=await api(&#39;development/&#39;+route,body);say(&#39;Development operation result: &#39;+JSON.stringify(out));await refreshDevelopment(); |
| choices | const | 331 | no | const choices=data.hvi.approvedRepositories.map(repo=&gt;{const box=element(&#39;input&#39;);box.type=&#39;checkbox&#39;;const label=element(&#39;label&#39;,&#39;text-control-field&#39;);label.append(box,element(&#39;span&#39;,&#39;&#39;,repo));contr… |
| groups | const | 339 | no | const groups = new Map(); |
| name | const | 341 | no | const name = a.category \|\| &#39;other&#39;; |
| group | const | 346 | no | const group = element(&#39;section&#39;, &#39;text-control-category&#39;); |
| refreshPreferences | function | 360 | no | async function refreshPreferences() { |
| response | const | 363 | no | const response = await api(&#39;plan&#39;, { actionId: &#39;personalization.preference.list&#39;, args: {} }); |
| records | const | 372 | no | const records = response.result.preferences \|\| []; |
| item | const | 376 | no | const item = element(&#39;div&#39;, &#39;text-control-recent-row&#39;); |
| refreshDevices | function | 388 | no | async function refreshDevices() { |
| data | const | 391 | no | const data = await api(&#39;devices&#39;); |
| grants | const | 393 | no | const grants = data.grants \|\| []; |
| item | const | 396 | no | const item = element(&#39;section&#39;, &#39;text-control-category&#39;); |
| label | const | 397 | no | const label = element(&#39;h3&#39;, &#39;&#39;, (g.deviceId \|\| &#39;Unknown device&#39;).slice(0, 16) + &#39; · &#39; + g.status); |
| selected | const | 401 | no | const selected = new Map(); |
| line | const | 403 | no | const line = element(&#39;label&#39;, &#39;text-control-field&#39;); |
| checkbox | const | 404 | no | const checkbox = element(&#39;input&#39;); checkbox.type = &#39;checkbox&#39;; checkbox.checked = true; |
| approved | const | 409 | no | const approved=[...selected].filter(([,v])=&gt;v.checked).map(([k])=&gt;k); |
| memoryItems | const | 432 | no | const memoryItems = $(&#39;host-web-memory-items&#39;); |
| memoryStatus | const | 433 | no | const memoryStatus = $(&#39;host-web-memory-status&#39;); |
| memorySite | const | 434 | no | const memorySite = $(&#39;host-web-memory-site&#39;); |
| memoryMore | const | 435 | no | const memoryMore = $(&#39;host-web-memory-more&#39;); |
| memoryCursor | variable | 436 | no | let memoryCursor = null; |
| refreshWebMemory | function | 437 | no | async function refreshWebMemory(append = false) { |
| params | const | 447 | no | const params = new URLSearchParams({ limit: &#39;20&#39; }); |
| view | const | 450 | no | const view = await api(&#39;web-memory?&#39; + params.toString()); |
| row | const | 454 | no | const row = element(&#39;div&#39;, &#39;text-control-recent-row&#39;); |
| link | const | 455 | no | const link = element(&#39;a&#39;, &#39;&#39;, visit.site + &#39; · &#39; + new Date(visit.observedAt).toLocaleString()); |
| origin | const | 457 | no | const origin = element(&#39;p&#39;, &#39;fineprint&#39;, visit.url + &#39; · &#39; + visit.sourceOrigin + &#39; · &#39; + visit.trust + (visit.reduced ? &#39; · URL reduced for privacy&#39; : &#39;&#39;)); |
| unlockControl | function | 475 | no | async function unlockControl() { |
| discovered | const | 484 | no | const discovered = await api(&#39;catalog&#39;); |
| covered | const | 487 | no | const covered = discovered.coverage; |
| value | const | 510 | no | const value = text.value.trim(); |
| value | const | 517 | no | const value = quickPreference?.value?.trim() \|\| &#39;&#39;; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Desktop Universal Text Control panel (UTC05).
// No direct mutations: text and catalog-based GUI both plan through the same Host dispatcher.
// Native Host issues a single-use launch code. After exchange the page holds only an
// ephemeral CSRF proof and an HttpOnly scoped cookie; never the PC owner capability.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('host-command-form');
  if (!form) return;
  const unlock = $('host-control-unlock');
  const lock = $('host-control-lock');
  const text = $('host-command-text');
  const submit = $('host-command-submit');
  const examples = $('host-control-examples');
  const catalogBox = $('host-control-catalog');
  const result = $('host-control-result');
  const recent = $('host-control-recent');
  const status = $('host-control-auth-status');
  let csrfProof = null;
  let catalog = null;
  let pending = null;
  let busy = false;
  const deviceList = $('device-list');
  const deviceStatus = $('device-status');
  const quickPreference = $('host-remember-preference');
  const quickReview = $('host-remember-review');
  const preferenceList = $('host-preferences-list');
  const preferenceRefresh = $('host-preferences-refresh');

  function element(tag, className, textValue) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (textValue !== undefined) n.textContent = String(textValue);
    return n;
  }
  function button(label, fn, kind = '') {
    const b = element('button', 'text-control-button ' + kind, label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function say(message, kind = '') {
    result.replaceChildren(element('p', 'text-control-note ' + kind, message));
  }
  function setBusy(next) {
    busy = next;
    unlock.disabled = next;
    submit.disabled = next || !csrfProof;
    text.disabled = next || !csrfProof;
    if (quickPreference) quickPreference.disabled = next || !csrfProof;
    if (quickReview) quickReview.disabled = next || !csrfProof;
    if (preferenceRefresh) preferenceRefresh.disabled = next || !csrfProof;
  }
  function showLocked(message = 'Open the VIVIM desktop app to unlock private commands.') {
    status.textContent = message;
    lock.hidden = !csrfProof;
    submit.disabled = !csrfProof;
    text.disabled = !csrfProof;
    if (quickPreference) quickPreference.disabled = !csrfProof;
    if (quickReview) quickReview.disabled = !csrfProof;
    if (preferenceRefresh) preferenceRefresh.disabled = !csrfProof;
    if (!csrfProof) {
      pending = null;
      catalog = null;
      examples.replaceChildren();
      catalogBox.replaceChildren();
      recent.replaceChildren();
      deviceList?.replaceChildren();
      preferenceList?.replaceChildren();
      if (memoryItems) memoryItems.replaceChildren();
      if (memoryStatus) memoryStatus.textContent = 'Unlock Host Control to view private history.';
      if (memoryMore) memoryMore.hidden = true;
      if (deviceStatus) deviceStatus.textContent = 'Unlock Host Control to manage phones.';
      say('Nothing has been changed. The Host requires owner authentication before planning or execution.');
    }
  }
  async function api(route, body) {
    if (!csrfProof) throw new Error('Trusted desktop session required');
    const opts = { method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
      credentials: 'same-origin', headers: {} };
```

_First 80 of 537 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
