# File: demo/host-legacy/controller.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/host-legacy/controller.js |
| Language | JavaScript |
| Kind | source |
| Size | 39547 B |
| Lines | 733 |
| Hash | 5c1ee464115b |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TAGS | const | 35 | no | const TAGS = [&#39;layout&#39;, &#39;copy&#39;, &#39;flow&#39;, &#39;other&#39;]; |
| STORAGE_KEY | const | 36 | no | const STORAGE_KEY = &#39;vivim-demo-walkthrough-v1&#39;; |
| FEEDBACK_URL | const | 37 | no | const FEEDBACK_URL = &#39;/demo/feedback&#39;; |
| INDEX_URL | const | 38 | no | const INDEX_URL = &#39;/demo/fixture/index.json&#39;; |
| FIXTURE_BASE | const | 39 | no | const FIXTURE_BASE = &#39;/demo/fixture/&#39;; |
| INDEX_SCHEMA | const | 40 | no | const INDEX_SCHEMA = &#39;vivim.demo-steps/1&#39;; |
| STEP_SCHEMA | const | 41 | no | const STEP_SCHEMA = &#39;vivim.demo-step/1&#39;; |
| LIVE_STATE_LABELS | const | 47 | no | const LIVE_STATE_LABELS = Object.freeze({ created: &#39;Intent recorded&#39;, remote_queued: &#39;Queued on PC&#39;, claimed: &#39;Claimed by worker — not sent&#39;, send_authorized: &#39;Send authorized — not observed&#39;, |
| NOT_AVAILABLE | const | 61 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| esc | function | 63 | no | const esc = s =&gt; String(s == null ? &#39;&#39; : s) |
| clip | function | 65 | no | const clip = (v, n) =&gt; { |
| s | const | 66 | no | const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| plain | function | 69 | no | const plain = v =&gt; !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| at | function | 72 | no | const at = (obj, path) =&gt; path.split(&#39;.&#39;).reduce((o, k) =&gt; (plain(o) \|\| Array.isArray(o)) &amp;&amp; k in o ? o[k] : undefined, obj); |
| pick | function | 75 | no | const pick = (md, ...paths) =&gt; { |
| v | const | 77 | no | const v = at(md, p); |
| fail | function | 84 | no | function fail(msg) { throw new Error(&#39;Demo fixture invalid: &#39; + msg); } |
| loadJson | function | 86 | no | async function loadJson(url) { |
| res | const | 87 | no | const res = await fetch(url, { method: &#39;GET&#39; }); |
| stepFileUrl | function | 92 | no | function stepFileUrl(file) { |
| url | const | 95 | no | const url = file.startsWith(&#39;/&#39;) ? file : FIXTURE_BASE + file; |
| validateIndex | function | 100 | no | function validateIndex(index) { |
| seen | const | 105 | no | const seen = new Set(); |
| validateStep | function | 117 | no | function validateStep(step, indexEntry) { |
| loadSteps | function | 129 | no | async function loadSteps() { |
| index | const | 130 | no | const index = validateIndex(await loadJson(INDEX_URL)); |
| files | const | 131 | no | const files = index.steps.map(s =&gt; stepFileUrl(s.file)); |
| raws | const | 132 | no | const raws = await Promise.all(files.map(f =&gt; loadJson(f))); |
| steps | const | 133 | no | const steps = raws.map((raw, i) =&gt; validateStep(raw, index.steps[i])); |
| views | function | 138 | no | function views(md) { |
| snapshot | const | 139 | no | const snapshot = pick(md, &#39;statusObj.snapshot&#39;, &#39;snapshot&#39;); |
| liveLabel | function | 163 | no | function liveLabel(msg) { |
| flattenTree | function | 172 | no | function flattenTree(tree) { |
| out | const | 173 | no | const out = []; |
| walk | function | 174 | no | const walk = node =&gt; { |
| props | const | 176 | no | const props = plain(node.props) ? node.props : {}; |
| bridgeText | function | 188 | no | function bridgeText(bridge) { |
| parts | const | 190 | no | const parts = []; |
| cmdText | function | 197 | no | function cmdText(c) { |
| RENDERERS | const | 206 | no | const RENDERERS = { |
| rows | const | 208 | no | const rows = []; |
| msg | const | 216 | no | const msg = Array.isArray(c.messages) ? c.messages[0] : null; |
| passes | const | 230 | no | const passes = at(v.bootstrap ?? {}, &#39;progress.passes&#39;); |
| rows | const | 238 | no | const rows = []; |
| cmd | const | 244 | no | const cmd = Array.isArray(v.cmds) &amp;&amp; plain(v.cmds[0]) ? v.cmds[0] : null; |
| liveConv | const | 249 | no | const liveConv = plain(v.live) &amp;&amp; Array.isArray(v.live.conversations) ? v.live.conversations.find(c =&gt; plain(c) &amp;&amp; (!cmd \|\| c.id === cmd.conversationId)) ?? (plain(v.live) &amp;&amp; Array.isArray(v.live.con… |
| msg | const | 250 | no | const msg = liveConv &amp;&amp; Array.isArray(liveConv.messages) ? liveConv.messages[0] : null; |
| rows | const | 260 | no | const rows = []; |
| compiled | const | 266 | no | const compiled = plain(md.compiled) ? md.compiled : null; |
| proposal | const | 271 | no | const proposal = plain(md.proposal) ? md.proposal : null; |
| rows | const | 285 | no | const rows = []; |
| rev | const | 286 | no | const rev = plain(md.revision) ? md.revision : null; |
| q | const | 303 | no | const q = plain(md.queue) ? md.queue : null; |
| rows | const | 316 | no | const rows = []; |
| rows | const | 340 | no | const rows = []; |
| actions | const | 342 | no | const actions = at(v.control ?? {}, &#39;catalog.actions&#39;); |
| ex | const | 346 | no | const ex = actions.filter(a =&gt; plain(a) &amp;&amp; Array.isArray(a.examples)).flatMap(a =&gt; a.examples); |
| themes | const | 352 | no | const themes = at(v.control ?? {}, &#39;world.themes&#39;); |
| undo | const | 363 | no | const undo = at(v.receipt ?? {}, &#39;undo&#39;); |
| rows | const | 378 | no | const rows = []; |
| rev | const | 379 | no | const rev = plain(md.revision) ? md.revision : null; |
| q | const | 396 | no | const q = plain(md.queue) ? md.queue : null; |
| rows | const | 412 | no | const rows = []; |
| compiled | const | 413 | no | const compiled = plain(md.compiled) ? md.compiled : null; |
| proposal | const | 414 | no | const proposal = plain(md.proposal) ? md.proposal : null; |
| rows | const | 430 | no | const rows = []; |
| proof | const | 431 | no | const proof = plain(md.proof) ? md.proof : null; |
| next | const | 432 | no | const next = plain(md.nextBatch) ? md.nextBatch : null; |
| q | const | 433 | no | const q = plain(md.queue) ? md.queue : null; |
| rowsFor | function | 447 | no | function rowsFor(step) { |
| render | const | 448 | no | const render = RENDERERS[step.itemId]; |
| EMPTY | function | 455 | no | const EMPTY = () =&gt; ({ notes: &#39;&#39;, tags: [], decision: null }); |
| state | variable | 456 | no | let state = []; |
| adoptState | function | 457 | no | function adoptState(n) { |
| raw | const | 460 | no | const raw = localStorage.getItem(STORAGE_KEY); |
| parsed | const | 462 | no | const parsed = JSON.parse(raw); |
| save | function | 475 | no | function save() { |
| counts | function | 478 | no | function counts() { |
| approve | variable | 479 | no | let approve = 0, revise = 0; |
| shellEl | variable | 485 | no | let shellEl, stripEl, activeEl, progressEl, statusEl, phoneEl, acceptanceEl, feedEl, notesEl, tagsEl; |
| submitBtn | variable | 486 | no | let submitBtn, approveAllBtn; |
| demoTitle | variable | 487 | no | let demoTitle = &#39;&#39;; |
| steps | variable | 488 | no | let steps = []; |
| activeIndex | variable | 489 | no | let activeIndex = 0; |
| loaded | variable | 490 | no | let loaded = false; |
| el | function | 492 | no | function el(id) { return document.getElementById(id); } |
| bindShell | function | 494 | no | function bindShell() { |
| buildStrip | function | 529 | no | function buildStrip() { |
| chip | const | 532 | no | const chip = document.createElement(&#39;button&#39;); |
| dot | const | 537 | no | const dot = document.createElement(&#39;span&#39;); dot.className = &#39;demo-chip-dot&#39;; |
| name | const | 538 | no | const name = document.createElement(&#39;span&#39;); name.textContent = step.screen; |
| verdict | const | 539 | no | const verdict = document.createElement(&#39;span&#39;); verdict.className = &#39;demo-chip-verdict&#39;; |
| renderPhone | function | 547 | no | function renderPhone(step) { |
| row | const | 550 | no | const row = document.createElement(&#39;div&#39;); row.className = &#39;phone-row&#39;; |
| key | const | 551 | no | const key = document.createElement(&#39;div&#39;); key.className = &#39;phone-k&#39;; key.textContent = k; |
| val | const | 552 | no | const val = document.createElement(&#39;div&#39;); val.className = &#39;phone-v&#39;; val.textContent = v; |
| banner | const | 556 | no | const banner = document.createElement(&#39;div&#39;); banner.className = &#39;phone-banner&#39;; |
| renderNotes | function | 561 | no | function renderNotes(step) { |
| s | const | 562 | no | const s = state[activeIndex]; |
| tag | const | 568 | no | const tag = document.createElement(&#39;button&#39;); |
| tags | const | 574 | no | const tags = state[activeIndex].tags; |
| idx | const | 575 | no | const idx = tags.indexOf(t); |
| renderActive | function | 586 | no | function renderActive() { |
| step | const | 587 | no | const step = steps[activeIndex]; |
| s | const | 588 | no | const s = state[activeIndex]; |
| head | const | 590 | no | const head = document.createElement(&#39;div&#39;); head.className = &#39;demo-step-head&#39;; |
| headL | const | 591 | no | const headL = document.createElement(&#39;div&#39;); |
| idSpan | const | 592 | no | const idSpan = document.createElement(&#39;span&#39;); idSpan.className = &#39;demo-step-id&#39;; idSpan.textContent = step.itemId; |
| h | const | 593 | no | const h = document.createElement(&#39;h2&#39;); h.className = &#39;heading&#39;; h.textContent = step.screen; |
| badge | const | 595 | no | const badge = document.createElement(&#39;span&#39;); badge.className = &#39;demo-badge&#39;; badge.textContent = &#39;baseline · current view · no overlays&#39;; |
| stateP | const | 599 | no | const stateP = document.createElement(&#39;p&#39;); stateP.className = &#39;body-sm demo-current&#39;; |
| decision | const | 606 | no | const decision = document.createElement(&#39;div&#39;); decision.className = &#39;demo-decision&#39;; |
| approve | const | 607 | no | const approve = document.createElement(&#39;button&#39;); |
| revise | const | 612 | no | const revise = document.createElement(&#39;button&#39;); |
| chip | const | 619 | no | const chip = document.createElement(&#39;span&#39;); chip.className = &#39;demo-decision-chip&#39;; |
| setDecision | function | 624 | no | function setDecision(decision) { |
| renderProgress | function | 630 | no | function renderProgress() { |
| c | const | 631 | no | const c = counts(); |
| renderAll | function | 635 | no | function renderAll() { |
| showError | function | 641 | no | function showError(err) { |
| card | const | 654 | no | const card = document.createElement(&#39;div&#39;); card.className = &#39;demo-error&#39;; |
| title | const | 655 | no | const title = document.createElement(&#39;p&#39;); title.className = &#39;heading&#39;; title.textContent = &#39;Demo failed to load&#39;; |
| body | const | 656 | no | const body = document.createElement(&#39;p&#39;); body.className = &#39;body-sm&#39;; body.textContent = String(err &amp;&amp; err.message ? err.message : err); |
| hint | const | 657 | no | const hint = document.createElement(&#39;p&#39;); hint.className = &#39;body-sm&#39;; |
| verdicts | function | 667 | no | function verdicts() { |
| d | const | 669 | no | const d = state[i].decision; |
| verdict | const | 670 | no | const verdict = d === &#39;approve&#39; ? &#39;pass&#39; : d === &#39;revise&#39; ? &#39;fail&#39; : &#39;defer&#39;; |
| submitRound | function | 675 | no | async function submitRound(approveAll) { |
| payload | const | 678 | no | const payload = { round: String(Date.now()), approveAll, verdicts: verdicts() }; |
| res | const | 683 | no | const res = await fetch(FEEDBACK_URL, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json; charset=utf-8&#39; }, body: JSON.stringify(payload) }); |
| stored | variable | 688 | no | let stored = null; |
| n | const | 691 | no | const n = Array.isArray(stored.verdicts) ? stored.verdicts.length : payload.verdicts.length; |
| any | const | 710 | no | const any = el(&#39;demo-status&#39;) \|\| el(&#39;demo-active&#39;); |
| loadedSteps | const | 716 | no | const loadedSteps = await loadSteps(); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* @vlang:surface apps/vivim-host/public/demo/controller.js
   @vlang:surface-desc: Walkthrough controller for the ARBOR baseline demo — the reprogrammable
   @vlang:surface-desc: surface is presentation and verdict wording only: live message state
   @vlang:surface-desc: labels (LIVE_STATE_LABELS), the honest gap string (NOT_AVAILABLE), the
   @vlang:surface-desc: tag vocabulary (TAGS), fixture validation messages, and per-step
   @vlang:surface-desc: render wording. NL-driven change accepts none of: new fetch targets
   @vlang:surface-desc: (C4 same-origin /demo/* only), DOM scope beyond #demo-* elements (C7),
   @vlang:surface-desc: inline script/style (C4), or verdict payload keys beyond the C8
   @vlang:surface-desc: {round, approveAll, verdicts} shape read by POST /demo/feedback.
   @vlang:surface-desc: NLCL linkage: no action in control/action-catalog.v1.json v7 targets
   @vlang:surface-desc: this file yet — actionIds stays empty until one is catalogued.
   @vlang:id: tag-vocabulary storage-key live-state-labels not-available-gap
   @vlang:id: fixture-validation mock-data-views walkthrough-state verdict-payload dom-anchors
   @vlang:action: */

/* VIVIM Host demo — walkthrough controller (baseline mode, fixture-fed).
   Loads /demo/fixture/index.json then each step file, validates the
   'vivim.demo-step/1' schema fail-closed (mismatch -> error card, never a
   partial screen), renders each step's rows into #demo-phone strictly from the
   step's mockData fields (C6 truthfulness: a row exists only when a fixture
   field produced it; missing Host data renders the honest NOT_AVAILABLE gap),
   collects per-step notes + tags (layout/copy/flow/other) and an approve/revise
   verdict (persisted to localStorage 'vivim-demo-walkthrough-v1'), and posts
   one round JSON {round, approveAll, verdicts} to POST /demo/feedback on
   Submit / Approve-all.
   CSP (C4): no inline script, no on* attributes, no injected styles — all
   presentation lives in /demo/demo.css. fetch() targets same-origin /demo/*
   only. Touches only #demo-* elements (C7) and never reaches into
   #demo-live-preview (no contentWindow/contentDocument access).
   No product API is read or written. */

(() => {
  'use strict';

  const TAGS = ['layout', 'copy', 'flow', 'other'];
  const STORAGE_KEY = 'vivim-demo-walkthrough-v1';
  const FEEDBACK_URL = '/demo/feedback';
  const INDEX_URL = '/demo/fixture/index.json';
  const FIXTURE_BASE = '/demo/fixture/';
  const INDEX_SCHEMA = 'vivim.demo-steps/1';
  const STEP_SCHEMA = 'vivim.demo-step/1';

  // Canonical phone labels for a live message state — verbatim values from
  // apps/mobile-relay/ux/model.mjs:17-28 (LIVE_STATE_LABELS). The browser
  // controller cannot import that module (not in the server ASSETS allowlist),
  // so the map is embedded verbatim here; C6 keeps the wording in lockstep.
  const LIVE_STATE_LABELS = Object.freeze({
    created: 'Intent recorded',
    remote_queued: 'Queued on PC',
    claimed: 'Claimed by worker — not sent',
    send_authorized: 'Send authorized — not observed',
    waiting_reply: 'Send observed — awaiting reply',
    reply_observed: 'Reply observed — delivery unconfirmed',
    delivered: 'Delivery acknowledged',
    uncertain: 'Send uncertain — inspect original receipt',
    failed_before_send: 'Failed before send',
    failed_after_send: 'Possible send — review required'
  });
  // Honest gap string — verbatim from apps/mobile-relay/ux/model.mjs:14
  // (NOT_AVAILABLE). Rendered wherever a fixture field set is absent.
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clip = (v, n) => {
    const s = String(v ?? '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);

  // Read a dotted path off an object; undefined when any hop is missing.
  const at = (obj, path) => path.split('.').reduce((o, k) => (plain(o) || Array.isArray(o)) && k in o ? o[k] : undefined, obj);
  // First defined candidate — tolerates either mockData key spelling for the
  // same SPEC field (e.g. snapshot at .snapshot or .statusObj.snapshot).
  const pick = (md, ...paths) => {
    for (const p of paths) {
      const v = at(md, p);
      if (v !== undefined) return v;
    }
    return undefined;
```

_First 80 of 734 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
