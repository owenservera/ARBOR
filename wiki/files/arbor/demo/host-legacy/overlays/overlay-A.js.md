# File: demo/host-legacy/overlays/overlay-A.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/overlays/overlay-A.js |
| Language | JavaScript |
| Kind | source |
| Size | 6703 B |
| Lines | 144 |
| Hash | a2a453ffb53d |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ITEM_ID | const | 11 | no | const ITEM_ID = &#39;A04&#39;; |
| SCREEN | const | 12 | no | const SCREEN = &#39;Build&#39;; |
| FIXTURE_URL | const | 13 | no | const FIXTURE_URL = &#39;/demo/fixture/tab-build.json&#39;; |
| NOT_AVAILABLE | const | 14 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| ACCEPTANCE_QUESTION | const | 16 | no | const ACCEPTANCE_QUESTION = |
| SPEC_MOCKDATA | const | 21 | no | const SPEC_MOCKDATA = { |
| SPEC_CURRENT_STATE | const | 39 | no | const SPEC_CURRENT_STATE = |
| clip | function | 42 | no | const clip = (v, n) =&gt; { |
| s | const | 43 | no | const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| plain | function | 46 | no | const plain = v =&gt; !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| at | function | 47 | no | const at = (obj, path) =&gt; path.split(&#39;.&#39;).reduce((o, k) =&gt; (o != null &amp;&amp; typeof o === &#39;object&#39; &amp;&amp; k in o) ? o[k] : undefined, obj); |
| buildRows | function | 51 | no | function buildRows(mockData) { |
| rows | const | 52 | no | const rows = []; |
| intent | const | 53 | no | const intent = typeof mockData.intent === &#39;string&#39; &amp;&amp; mockData.intent.trim() |
| compiled | const | 58 | no | const compiled = plain(mockData.compiled) ? mockData.compiled : null; |
| proposal | const | 68 | no | const proposal = plain(mockData.proposal) ? mockData.proposal : null; |
| resolve | function | 81 | no | function resolve(step) { |
| md | const | 83 | no | const md = step &amp;&amp; plain(step.mockData) ? step.mockData : SPEC_MOCKDATA; |
| state | const | 84 | no | const state = step &amp;&amp; typeof step.currentState === &#39;string&#39; ? step.currentState : SPEC_CURRENT_STATE; |
| question | const | 85 | no | const question = step &amp;&amp; typeof step.acceptanceQuestion === &#39;string&#39; ? step.acceptanceQuestion : ACCEPTANCE_QUESTION; |
| id | const | 86 | no | const id = step &amp;&amp; typeof step.itemId === &#39;string&#39; ? step.itemId : ITEM_ID; |
| screen | const | 87 | no | const screen = step &amp;&amp; typeof step.screen === &#39;string&#39; ? step.screen : SCREEN; |
| renderPanel | function | 91 | no | function renderPanel(el, s) { |
| panel | const | 93 | no | const panel = document.createElement(&#39;div&#39;); |
| head | const | 95 | no | const head = document.createElement(&#39;div&#39;); head.className = &#39;demo-overlay-head&#39;; |
| id | const | 96 | no | const id = document.createElement(&#39;span&#39;); id.className = &#39;demo-overlay-id&#39;; id.textContent = s.id; |
| screen | const | 97 | no | const screen = document.createElement(&#39;h2&#39;); screen.className = &#39;demo-overlay-screen&#39;; screen.textContent = s.screen; |
| state | const | 100 | no | const state = document.createElement(&#39;p&#39;); state.className = &#39;demo-current&#39;; state.textContent = s.state; |
| row | const | 103 | no | const row = document.createElement(&#39;div&#39;); row.className = &#39;phone-row&#39;; |
| k | const | 104 | no | const k = document.createElement(&#39;div&#39;); k.className = &#39;phone-k&#39;; k.textContent = pair[0]; |
| v | const | 105 | no | const v = document.createElement(&#39;div&#39;); v.className = &#39;phone-v&#39;; v.textContent = pair[1]; |
| acc | const | 109 | no | const acc = document.createElement(&#39;p&#39;); acc.className = &#39;demo-acceptance&#39;; acc.textContent = &#39;Q: &#39; + s.question; |
| mount | function | 114 | no | function mount(el, step) { |
| unmount | function | 138 | no | function unmount(el) { |
| host | const | 142 | no | const host = typeof window !== &#39;undefined&#39; ? window : globalThis; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* DEMO overlay A — Build screen group (SPEC A04).
   Fixture-fed: GET /demo/fixture/tab-build.json, same-origin only; falls back to
   the SPEC-authored mockData when the fixture is absent/unreadable (queue-mode
   steps A01-A08 have no fixtures yet). Renders one screen group into the passed
   #demo-phone/#demo-active slot. Exports mount(slotEl[, step]) / unmount(slotEl).
   No inline script, no cross-origin network. All text from fixture fields or the
   SPEC verbatim; missing Host data renders the honest NOT_AVAILABLE gap. */
(function () {
  'use strict';

  const ITEM_ID = 'A04';
  const SCREEN = 'Build';
  const FIXTURE_URL = '/demo/fixture/tab-build.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const ACCEPTANCE_QUESTION =
    'Does Build render each of the three intents as a guarded proposal (is-done/is-error), refuse to publish when stale or unapproved, and navigate to World for \'open the wiki\' without introducing a second visual publisher?';

  // SPEC-authored mockData for A04 (Build). Used when no step is passed and the
  // fixture cannot be read. Nothing here is invented beyond the SPEC.
  const SPEC_MOCKDATA = {
    intent: 'show ARBOR progress projection',
    compiled: {
      kind: 'visual-update',
      surfaceId: 'vivim.ui-surface/1',
      revision: 8,
      guarded: true,
      publishable: false,
      reason: 'pending owner approval'
    },
    proposal: {
      status: 'pending',
      preview: 'ARBOR progress projection · source-backed revision 8',
      state: 'is-done'
    },
    approvalRequired: true
  };

  const SPEC_CURRENT_STATE =
    'Build tab switches via renderTabs/goTab (app.js:359-378), mounts the build surface via mountBuild/mountCompose/sendProposal/onApplied (app.js:1192-1228), and proposal CSS .proposal.is-done/.is-error/.proposal-preview exists at index.html:170-174.';

  const clip = (v, n) => {
    const s = String(v ?? '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const at = (obj, path) => path.split('.').reduce((o, k) => (o != null && typeof o === 'object' && k in o) ? o[k] : undefined, obj);

  // Rows rendered strictly from the step fixture: a row exists only when a
  // fixture field produced it; missing Host data renders the honest gap.
  function buildRows(mockData) {
    const rows = [];
    const intent = typeof mockData.intent === 'string' && mockData.intent.trim()
      ? mockData.intent
      : undefined;
    rows.push(['Intent', intent !== undefined ? intent : NOT_AVAILABLE]);

    const compiled = plain(mockData.compiled) ? mockData.compiled : null;
    if (compiled) {
      rows.push(['Compiled',
        clip(compiled.kind ?? '', 20) + ' · ' + clip(compiled.surfaceId ?? '', 30) + ' r' + compiled.revision
        + ' · guarded ' + compiled.guarded + ' · publishable ' + compiled.publishable
        + (compiled.reason ? ' · ' + clip(compiled.reason, 40) : '')]);
    } else {
      rows.push(['Compiled', NOT_AVAILABLE]);
    }

    const proposal = plain(mockData.proposal) ? mockData.proposal : null;
    if (proposal) {
      rows.push(['Proposal',
        clip(proposal.status ?? '', 20) + ' · ' + clip(proposal.preview ?? '', 60) + ' · ' + clip(proposal.state ?? '', 16)]);
    } else {
      rows.push(['Proposal', NOT_AVAILABLE]);
    }

    rows.push(['Approval required',
      mockData.approvalRequired === true ? 'yes — publish blocked until owner approves' : 'no']);
    return rows;
  }
```

_First 80 of 145 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
