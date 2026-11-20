# File: apps/vivim-host/public/pages/chat.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/pages/chat.js |
| Language | JavaScript |
| Kind | source |
| Size | 29590 B |
| Lines | 548 |
| Hash | 13aa70094a66 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STATE_URL | const | 6 | no | const STATE_URL = &#39;/api/state&#39;; |
| MUTATE_URL | const | 7 | no | const MUTATE_URL = &#39;/api/mutate&#39;; |
| CONTROL_URL | const | 8 | no | const CONTROL_URL = &#39;/api/host/control/&#39;; |
| ACTOR | const | 9 | no | const ACTOR = &#39;owner-browser&#39;; |
| POLL_MS | const | 10 | no | const POLL_MS = 1500; |
| HANDOFF_KEY | const | 11 | no | const HANDOFF_KEY = &#39;vivim.desktop-chat-draft.v1&#39;; |
| $ | function | 13 | no | const $ = id =&gt; document.getElementById(id); |
| log | const | 14 | no | const log = $(&#39;log&#39;); |
| rev | const | 15 | no | const rev = $(&#39;rev&#39;); |
| form | const | 16 | no | const form = $(&#39;f&#39;); |
| input | const | 17 | no | const input = $(&#39;t&#39;); |
| sendBtn | const | 18 | no | const sendBtn = $(&#39;send&#39;); |
| authStatus | const | 19 | no | const authStatus = $(&#39;control-status&#39;); |
| result | const | 20 | no | const result = $(&#39;control-result&#39;); |
| recent | const | 21 | no | const recent = $(&#39;control-recent&#39;); |
| lockButton | const | 22 | no | const lockButton = $(&#39;control-logout&#39;); |
| rulePanel | const | 23 | no | const rulePanel=$(&#39;learned-rules&#39;); |
| pollTimer | variable | 26 | no | let pollTimer = null; |
| csrfProof | variable | 27 | no | let csrfProof = null; |
| busy | variable | 28 | no | let busy = false; |
| pending | variable | 29 | no | let pending = null; |
| assistance | variable | 30 | no | let assistance=null; |
| raw | const | 34 | no | const raw=window.sessionStorage.getItem(HANDOFF_KEY); |
| draft | const | 36 | no | const draft=raw?JSON.parse(raw):null; |
| element | function | 41 | no | function element(tag, className = &#39;&#39;, value) { |
| node | const | 42 | no | const node = document.createElement(tag); |
| button | function | 47 | no | function button(label, action, secondary = false) { |
| node | const | 48 | no | const node = element(&#39;button&#39;, secondary ? &#39;secondary&#39; : &#39;&#39;, label); |
| card | function | 53 | no | function card(heading) { |
| node | const | 54 | no | const node = element(&#39;div&#39;, &#39;control-card&#39;); |
| notice | function | 59 | no | function notice(message, warning = false) { |
| node | const | 60 | no | const node = card(&#39;Host Control&#39;); |
| setBusy | function | 63 | no | function setBusy(next) { |
| locked | function | 70 | no | function locked(message = &#39;Commands locked. Open the VIVIM desktop owner session to approve PC changes.&#39;) { |
| unlocked | function | 82 | no | function unlocked() { |
| json | function | 86 | no | async function json(url, options = {}) { |
| response | const | 87 | no | const response = await fetch(url, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, ...options }); |
| body | const | 88 | no | const body = await response.json().catch(() =&gt; ({})); |
| error | const | 90 | no | const error = new Error(body.error \|\| body.code \|\| (&#39;HTTP &#39; + response.status)); |
| controlApi | function | 97 | no | async function controlApi(route, body) { |
| options | const | 99 | no | const options = body === undefined ? {} : { |
| ownerSession | function | 113 | no | async function ownerSession() { |
| fragment | const | 114 | no | const fragment = window.location.hash \|\| &#39;&#39;; |
| opened | const | 119 | no | const opened = await json(CONTROL_URL + &#39;ui-exchange&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-control&#39;: &#39;1&#39; }, body: JSON.stringify({ code: match[1] }) }); |
| response | const | 128 | no | const response = await fetch(CONTROL_URL + &#39;ui-state&#39;, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39; }); |
| state | const | 132 | no | const state = await response.json().catch(() =&gt; ({})); |
| intentNode | function | 140 | no | function intentNode(intent) { |
| wrap | const | 141 | no | const wrap = element(&#39;div&#39;, &#39;intent&#39;); |
| messageNode | function | 148 | no | function messageNode(m) { |
| node | const | 149 | no | const node = element(&#39;div&#39;, &#39;msg &#39; + (m.who === &#39;user&#39; ? &#39;user&#39; : &#39;system&#39;)); |
| refresh | function | 155 | no | async function refresh() { |
| state | const | 157 | no | const state = await json(STATE_URL); |
| messages | const | 160 | no | const messages = Array.isArray(state.chat) ? state.chat : []; |
| receiptDetails | function | 169 | no | function receiptDetails(node, receipt) { |
| label | const | 171 | no | const label = receipt.status === &#39;applied&#39; ? &#39;Applied by Host&#39; |
| phrase | const | 183 | no | const phrase=$(&#39;teach-phrase&#39;),command=$(&#39;teach-command&#39;),form=$(&#39;teach-rule-form&#39;); |
| section | const | 185 | no | const section=form.closest?.(&#39;details&#39;);if(section)section.open=true; |
| phrase | const | 192 | no | const phrase=$(&#39;teach-phrase&#39;),command=$(&#39;teach-command&#39;),form=$(&#39;teach-rule-form&#39;); |
| section | const | 195 | no | const section=form.closest?.(&#39;details&#39;);if(section)section.open=true; |
| observeTheme | function | 205 | no | async function observeTheme(node, receipt) { |
| observed | const | 208 | no | const observed = await controlApi(&#39;plan&#39;, { actionId: &#39;ui.theme.show&#39;, args: {} }); |
| recoveredPlan | function | 215 | no | function recoveredPlan(record) { |
| node | const | 217 | no | const node = card(record.actionId + &#39; · &#39; + record.state); |
| inspectPlan | function | 225 | no | async function inspectPlan(planId) { |
| refreshRecent | function | 230 | no | async function refreshRecent(restoreLatest = false) { |
| rows | const | 233 | no | const rows = (await controlApi(&#39;recent&#39;)).items \|\| []; |
| item | const | 238 | no | const item = element(&#39;div&#39;, &#39;history-row&#39;); |
| showRequestContext | function | 249 | no | function showRequestContext(node, plan) { |
| context | const | 250 | no | const context=plan.requestContext; |
| wiki | const | 252 | no | const wiki=context.wiki; |
| source | const | 270 | no | const source=context.source; |
| bundle | const | 273 | no | const bundle=source.context; |
| details | const | 275 | no | const details=element(&#39;details&#39;,&#39;&#39;); |
| packet | const | 277 | no | const packet=bundle.semanticPacket; |
| planView | function | 294 | no | function planView(plan) { |
| node | const | 297 | no | const node = card(plan.title + &#39; · Host read only&#39;); |
| meaning | const | 298 | no | const meaning = plan.language?.vec?.proposal; |
| node | const | 306 | no | const node = card(&#39;Host interpretation · &#39; + String(plan.outcome ?? &#39;unavailable&#39;)); |
| expected | const | 324 | no | const expected = { planId: plan.planId, planDigest: plan.planDigest }; |
| node | const | 326 | no | const node = card(&#39;Approve exactly this Host action?&#39;); |
| meaning | const | 328 | no | const meaning = plan.language?.vec?.proposal; |
| binding | const | 329 | no | const binding=plan.approvalMeaning; |
| actions | const | 356 | no | const actions = element(&#39;div&#39;, &#39;control-actions&#39;); |
| reviewUnmatched | function | 366 | no | async function reviewUnmatched(plan,text) { |
| reading | variable | 368 | no | let reading=null; |
| view | const | 372 | no | const view=await controlApi(&#39;pwa-view&#39;); |
| compiler | const | 373 | no | const compiler=await import(&#39;/mobile/build-composer.mjs&#39;); |
| surface | const | 374 | no | const surface=view?.schema===&#39;vivim.host-pwa-view/1&#39;&amp;&amp;view.state===&#39;source-backed&#39; |
| route | const | 378 | no | const route=resolveProductRoute(text,{hostMeaning:plan,compileUi:reading?()=&gt;reading:null}); |
| node | const | 381 | no | const node=card(&#39;VEC visual request · read-only desktop review&#39;); |
| preview | const | 385 | no | const preview=element(&#39;div&#39;,&#39;visual-preview&#39;); |
| node | const | 397 | no | const node=element(&#39;p&#39;,&#39;warning&#39;,&#39;The request cannot be safely previewed; no provider message was sent.&#39;); |
| showRules | function | 404 | no | async function showRules(){ |
| proof | const | 406 | no | const proof=csrfProof; |
| data | const | 408 | no | const data=await controlApi(&#39;rules&#39;); |
| row | const | 412 | no | const row=element(&#39;div&#39;,&#39;control-card&#39;); |
| phrase | const | 431 | no | const phrase=$(&#39;teach-phrase&#39;),command=$(&#39;teach-command&#39;); |
| teachForm | const | 435 | no | const teachForm=$(&#39;teach-rule-form&#39;); |
| phrase | const | 439 | no | const phrase=$(&#39;teach-phrase&#39;).value.trim(),command=$(&#39;teach-command&#39;).value.trim(),share=$(&#39;teach-share-phone&#39;)?.checked===true; |
| submitPlan | function | 444 | no | async function submitPlan(body) { |
| apply | function | 453 | no | async function apply(expected) { |
| receipt | const | 459 | no | const receipt = await controlApi(&#39;execute&#39;, expected); |
| node | const | 460 | no | const node = card(receipt.actionId + &#39; · &#39; + receipt.status); |
| node | const | 474 | no | const node = card(&#39;Execution response unconfirmed&#39;); |
| assistPanel | const | 481 | no | const assistPanel=$(&#39;composer-assist&#39;); |
| text | const | 493 | no | const text = input.value.trim(); |
| destination | const | 495 | no | const destination=resolveDesktopDestination(text); |
| stored | variable | 505 | no | let stored = false; |
| start | function | 539 | no | async function start() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| /mobile/control-language.mjs | import | 1 | external |
| /mobile/composer-assist.mjs | import | 2 | external |
| /mobile/build-composer.mjs | dynamic | 373 | external |
| /mobile/generative-ui/renderer.mjs | dynamic | 387 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { resolveDesktopDestination, resolveProductRoute } from '/mobile/control-language.mjs';
import { mountComposerAssist } from '/mobile/composer-assist.mjs';
// The Host owns command authority. This page stores chat text separately from any effect.
(() => {
  'use strict';
  const STATE_URL = '/api/state';
  const MUTATE_URL = '/api/mutate';
  const CONTROL_URL = '/api/host/control/';
  const ACTOR = 'owner-browser';
  const POLL_MS = 1500;
  const HANDOFF_KEY = 'vivim.desktop-chat-draft.v1';

  const $ = id => document.getElementById(id);
  const log = $('log');
  const rev = $('rev');
  const form = $('f');
  const input = $('t');
  const sendBtn = $('send');
  const authStatus = $('control-status');
  const result = $('control-result');
  const recent = $('control-recent');
  const lockButton = $('control-logout');
  const rulePanel=$('learned-rules');
  if (!log || !form || !input || !result) return;

  let pollTimer = null;
  let csrfProof = null;
  let busy = false;
  let pending = null;
  let assistance=null;
  // A deliberate same-tab Wiki handoff is draft-only. Consume and erase once;
  // do not keep a transcript, carry authority, or submit automatically.
  try {
    const raw=window.sessionStorage.getItem(HANDOFF_KEY);
    window.sessionStorage.removeItem(HANDOFF_KEY);
    const draft=raw?JSON.parse(raw):null;
    if(draft&&typeof draft.text==='string'&&draft.text.length<=1000&&
       draft.expiresAt>Date.now()&&draft.expiresAt<=Date.now()+60000)input.value=draft.text;
  }catch{/* Storage may be unavailable; ordinary Chat remains usable. */}

  function element(tag, className = '', value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  }
  function button(label, action, secondary = false) {
    const node = element('button', secondary ? 'secondary' : '', label);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }
  function card(heading) {
    const node = element('div', 'control-card');
    if (heading) node.append(element('h3', '', heading));
    result.replaceChildren(node);
    return node;
  }
  function notice(message, warning = false) {
    const node = card('Host Control');
    node.append(element('p', warning ? 'warning' : '', message));
  }
  function setBusy(next) {
    busy = next;
    if(next)assistance?.reset();
    sendBtn.disabled = next;
    input.disabled = next;
    lockButton.disabled = next;
  }
  function locked(message = 'Commands locked. Open the VIVIM desktop owner session to approve PC changes.') {
    csrfProof = null;
    rulePanel?.replaceChildren();
    if($('teach-phrase'))$('teach-phrase').value='';
    if($('teach-command'))$('teach-command').value='';if($('teach-share-phone'))$('teach-share-phone').checked=false;
    assistance?.reset();
    pending = null;
    authStatus.textContent = message;
    lockButton.hidden = true;
    recent.replaceChildren();
    notice('Chat messages can still be saved. Host effects require desktop owner authentication.');
```

_First 80 of 549 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
