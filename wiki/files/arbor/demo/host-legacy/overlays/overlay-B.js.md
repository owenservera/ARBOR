# File: demo/host-legacy/overlays/overlay-B.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/overlays/overlay-B.js |
| Language | JavaScript |
| Kind | source |
| Size | 6663 B |
| Lines | 142 |
| Hash | 6e4a5b6b8425 |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ITEM_ID | const | 11 | no | const ITEM_ID = &#39;A05&#39;; |
| SCREEN | const | 12 | no | const SCREEN = &#39;Build&#39;; |
| FIXTURE_URL | const | 13 | no | const FIXTURE_URL = &#39;/demo/fixture/tab-build-verify.json&#39;; |
| NOT_AVAILABLE | const | 14 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| ACCEPTANCE_QUESTION | const | 16 | no | const ACCEPTANCE_QUESTION = |
| SPEC_CURRENT_STATE | const | 19 | no | const SPEC_CURRENT_STATE = |
| SPEC_MOCKDATA | const | 24 | no | const SPEC_MOCKDATA = { |
| clip | function | 41 | no | const clip = (v, n) =&gt; { |
| s | const | 42 | no | const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| plain | function | 45 | no | const plain = v =&gt; !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| at | function | 46 | no | const at = (obj, path) =&gt; path.split(&#39;.&#39;).reduce((o, k) =&gt; (o != null &amp;&amp; typeof o === &#39;object&#39; &amp;&amp; k in o) ? o[k] : undefined, obj); |
| buildRows | function | 50 | no | function buildRows(mockData) { |
| rows | const | 51 | no | const rows = []; |
| proof | const | 55 | no | const proof = plain(mockData.proof) ? mockData.proof : null; |
| next | const | 70 | no | const next = plain(mockData.nextBatch) ? mockData.nextBatch : null; |
| q | const | 75 | no | const q = plain(mockData.queue) ? mockData.queue : null; |
| resolve | function | 82 | no | function resolve(step) { |
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
| unmount | function | 136 | no | function unmount(el) { |
| host | const | 140 | no | const host = typeof window !== &#39;undefined&#39; ? window : globalThis; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* DEMO overlay B — Build screen group (SPEC A05).
   Fixture-fed: GET /demo/fixture/tab-build.json, same-origin only; falls back to
   the SPEC-authored mockData when the fixture is absent/unreadable (queue-mode
   steps A01-A08 have no fixtures yet). Renders one screen group into the passed
   #demo-phone/#demo-active slot. Exports mount(slotEl[, step]) / unmount(slotEl).
   No inline script, no cross-origin network. All text from fixture fields or the
   SPEC verbatim; missing Host data renders the honest NOT_AVAILABLE gap. */
(function () {
  'use strict';

  const ITEM_ID = 'A05';
  const SCREEN = 'Build';
  const FIXTURE_URL = '/demo/fixture/tab-build-verify.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const ACCEPTANCE_QUESTION =
    'Does Build show product proof (committed revision + test receipts + commit SHA) after a scoped repair, propose the next batch via the footer next action, and update Running lane queue counts while keeping unattended actions within preauthorized boundaries?';

  const SPEC_CURRENT_STATE =
    'Build applies proposals via sendProposal/onApplied (app.js:1192-1228), renderWorld shows running/queued/queue counts (render.mjs:231-245), nextAction (model.mjs:379-395) and footer (render.mjs:199-205) drive navigation, and goTab (app.js:359-378) switches tabs.';

  // SPEC-authored mockData for A05 (Build). Used when no step is passed and the
  // fixture cannot be read. Nothing here is invented beyond the SPEC.
  const SPEC_MOCKDATA = {
    proposalId: 'prop_001',
    applied: true,
    proof: {
      committedRevision: 9,
      surfaceId: 'vivim.ui-surface/1',
      testReceipts: ['scripts/acceleration/live-host-check.test.mjs'],
      commitSHA: '3dae90c'
    },
    nextBatch: {
      label: 'Build something',
      tab: 'build',
      detail: 'Next scoped repair ready'
    },
    queue: { queued: 1, claimed: 0, done: 4, failed: 0 }
  };

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
    rows.push(['Proposal',
      clip(mockData.proposalId ?? '', 24) + ' · applied ' + (mockData.applied === true ? 'yes' : 'no')]);

    const proof = plain(mockData.proof) ? mockData.proof : null;
    if (proof) {
      rows.push(['Committed revision',
        clip(proof.surfaceId ?? '', 30) + ' r' + proof.committedRevision
        + ' · commit ' + clip(proof.commitSHA ?? '', 12)]);
      if (Array.isArray(proof.testReceipts) && proof.testReceipts.length) {
        rows.push(['Test receipts', proof.testReceipts.map(r => clip(r, 50)).join('   ')]);
      } else {
        rows.push(['Test receipts', NOT_AVAILABLE]);
      }
    } else {
      rows.push(['Committed revision', NOT_AVAILABLE]);
      rows.push(['Test receipts', NOT_AVAILABLE]);
    }

    const next = plain(mockData.nextBatch) ? mockData.nextBatch : null;
    rows.push(['Next batch',
      next ? clip(next.label ?? '', 30) + ' · ' + clip(next.detail ?? '', 60) + ' → ' + clip(next.tab ?? '', 20)
        : NOT_AVAILABLE]);

    const q = plain(mockData.queue) ? mockData.queue : null;
    rows.push(['Running lane queue',
      q ? 'queued ' + q.queued + ' · claimed ' + q.claimed + ' · done ' + q.done + ' · failed ' + q.failed
        : NOT_AVAILABLE]);
    return rows;
  }
```

_First 80 of 143 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
